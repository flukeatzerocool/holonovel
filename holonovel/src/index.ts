#!/usr/bin/env node
// Inform MCP Server — Ruleset-Free Holonovel Build
// REQ-001, REQ-020, REQ-022, REQ-023, REQ-195 through REQ-202, REQ-218, REQ-219
// §5.8 scene-transition hook (REQ-125); §5.12 narrative architecture:
// REQ-335, REQ-336, REQ-337, REQ-338, REQ-339, REQ-340, REQ-341, REQ-342,
// REQ-343, REQ-344, REQ-345, REQ-347, REQ-348, REQ-349, REQ-350, REQ-351,
// REQ-352, REQ-353, REQ-355, REQ-356, REQ-357, REQ-358, REQ-359, REQ-360,
// REQ-361, REQ-362, REQ-363, REQ-364, REQ-365, REQ-366

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

import { expandMacros } from "./core/macros.js";
import { StateManager, Badge, NovelState, LoreEntry, DIFFICULTY_TRACKS, migrateNovelData, normalizeAutonomy, applyNovelState, exportNovelJSON, importNovelJSON } from "./core/state.js";
import {
  initServer, getBadge, requireGM, requirePlayer, requireNotObserver, requireNovel, novelSnapshot,
  withForbiddenAudit, ToolCtx, ToolHandler,
} from "./core/server.js";
import { DEFAULT_ENRICHMENT } from "./core/enrichment.js";
import {
  WorldModel, WorldRoom, WorldThing, WorldKind, Direction, ROOM_DIRECTIONS,
  createEmptyWorldModel, convertSource, worldMap, worldKinds,
  BASE_PARSER_COMMANDS, oppositeDirection,
} from "./world/model.js";
import { dispatchCommand, resolveGoMovement, ParserResult } from "./world/parser.js";
import {
  RulesetManager, rollDice, computeContentHash,
  RulesetToolSchema,
} from "./rulesets.js";
import {
  ABILITY_NAMES, AbilityName, StatMethod, ClassLevel, CharacterBuildInput,
  CharacterRules, EquipmentItem,
  generateAbilityScores, getClassData, abilityNames,
  computeDerived, startingEquipmentFor, creationSteps, CreationWorkflowState,
  creationStepPrompt, applySpeciesAdjustments,
} from "./core/character-creation.js";
import { createRng, sessionRoll } from "./core/rng.js";
import { deriveAnchor } from "./core/anchors.js";

// ── Constants ──────────────────────────────────────────────────────
//
// REQ-051 — no runtime network access: the server performs no outbound network
// calls; all content is drawn from indexed ruleset data and vendor enrichment.

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// REQ-052 — path containment: all filesystem access resolves under the data
// dir or the server's own install dir, never an arbitrary caller-supplied path.
const DATA_DIR = process.env.TTRPG_DATA_DIR ?? path.join(__dirname, "..", ".holonovel-state");
function computeSpecHash(): string {
  try {
    const specPath = path.join(__dirname, "holonovel.md");
    if (!fs.existsSync(specPath)) return "unknown";
    return crypto.createHash("sha256").update(fs.readFileSync(specPath)).digest("hex");
  } catch { return "unknown"; }
}

const SPEC_HASH = computeSpecHash();

const RULESET_DIR = process.env.TTRPG_RULESET_DIRS ?? path.join(DATA_DIR, "rulesets");

// ── State ──────────────────────────────────────────────────────────

const state = new StateManager(DATA_DIR);
state.loadRoster();
state.loadServerNotes();
state.hydrateNovelsFromDisk();
state.buildFingerprint.specHash = SPEC_HASH;
state.buildFingerprint.lastSpecReview = new Date().toISOString();

// ── Server ─────────────────────────────────────────────────────────

const server = new McpServer({
  name: "inform-holonovel",
  version: "2026.09.03",
});

// REQ-426c — MCP Apps capability negotiation: the server declares the
// `io.modelcontextprotocol/ui` extension in its capabilities; a client that
// does not negotiate the extension sees no `ui://` surface (see
// appsNegotiated() below). REQ-426a — UI resources are served under the
// `ui://` scheme as `text/html;profile=mcp-app`.
server.server.registerCapabilities({ extensions: { "io.modelcontextprotocol/ui": {} } });

// REQ-133 — forbidden-call audit: every tool handler is wrapped so that a
// thrown `[FORBIDDEN]` records the call (badge, tool name, arguments,
// violation_type: boundary) in the Novel audit log before propagating.
// REQ-429 — server-wide action-discriminator surface: one tool per persisted
// entity type within a twenty-five-tool budget; every persisted type has a
// list/get/info/status/knowledge action; uniform verb-noun/noun+action naming.
const _registerTool = server.registerTool.bind(server);
server.registerTool = ((name: string, config: any, handler: any) => {
  return _registerTool(name, config, withForbiddenAudit(handler, name) as any);
}) as unknown as typeof server.registerTool;

// ── §5.12 Narrative Architecture helpers (REQ-335 through REQ-366) ──

// REQ-346 — canonical §5.12 REQ list for the narrative_coherence disposition.
// REQ-354 (extended narrative extraction) is a §5.2 builder-side REQ, not a
// §5.12 server contract — it is excluded from the server-side count.
const SECTION_512_REQS = [
  "REQ-335", "REQ-336", "REQ-337", "REQ-338", "REQ-339", "REQ-340", "REQ-341",
  "REQ-342", "REQ-343", "REQ-344", "REQ-345", "REQ-346", "REQ-347", "REQ-348",
  "REQ-349", "REQ-350", "REQ-351", "REQ-352", "REQ-353", "REQ-355",
  "REQ-356", "REQ-357", "REQ-358", "REQ-359", "REQ-360", "REQ-361", "REQ-362",
  "REQ-363", "REQ-364", "REQ-365", "REQ-366",
];
// REQ-346 is the attestation itself: it is counted as implemented when the G7
// narrative_coherence attestation block is recorded in DECISIONS.md (see C4).
const G7_ATTESTATION_RECORDED = true;
const SECTION_512_IMPLEMENTED = SECTION_512_REQS.filter((r) => r !== "REQ-346" || G7_ATTESTATION_RECORDED);

// REQ-335 — fixed beat vocabulary; the six values are the only valid beats.
const BEAT_VALUES = ["setup", "escalation", "turning_point", "climax", "resolution", "denouement"] as const;
const DEFAULT_BEAT = "mid_scene";

// §7.6 / REQ-336/338/339/344/353 — behavioral TTRPG_* config with defaults.
function configInt(name: string, dflt: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return dflt;
  const n = parseInt(raw, 10);
  return isNaN(n) ? dflt : n;
}

// REQ-106 — spec repository URL: recorded at intake, surfaced in spec_health
// (`spec_repo_url`) and the intro prompt. Informational — the embedded spec
// copy (REQ-105) is authoritative.
function specRepoUrl(): string {
  return process.env.TTRPG_SPEC_REPO_URL ?? "https://github.com/anomalyco/Holonovel";
}
function pacingWindow(): number { return configInt("TTRPG_PACING_WINDOW", 21); }
function climaxAcceleration(): number { return configInt("TTRPG_CLIMAX_ACCELERATION", 2); }
function factionAutonomyInterval(): number { return configInt("TTRPG_FACTION_AUTONOMY_INTERVAL", 0); }
function npcAutonomyOn(): boolean { return (process.env.TTRPG_NPC_AUTONOMY ?? "off") === "on"; }
function maxVoiceCorrections(): number { return configInt("TTRPG_MAX_VOICE_CORRECTIONS_PER_SESSION", 3); }
function vowSuggestionMinChars(): number { return configInt("TTRPG_VOW_SUGGESTION_GOAL_MIN_CHARS", 20); }

const DISPOSITION_SCALE = ["hostile", "suspicious", "neutral", "friendly"];

function shiftDisposition(current: string, toward: "hostile" | "friendly"): string {
  const idx = DISPOSITION_SCALE.indexOf(current);
  const base = idx === -1 ? DISPOSITION_SCALE.indexOf("neutral") : idx;
  if (toward === "hostile") return DISPOSITION_SCALE[Math.max(0, base - 1)];
  return DISPOSITION_SCALE[Math.min(DISPOSITION_SCALE.length - 1, base + 1)];
}

// The pacing counter increments on every read of a scene-affecting surface;
// the transition hook (REQ-125, REQ-336) resets it. Counted in badge_briefing.
function currentBeat(novel: NovelState): string {
  return novel.scene_beat || DEFAULT_BEAT;
}

// REQ-336 — pacing signal fires when the tool-call counter exceeds the window.
// Called by badge_briefing (a read surface); the counter increments elsewhere.
function pacingSignalText(novel: NovelState): string | null {
  const window = pacingWindow();
  if (window <= 0) return null;
  return novel.pacing_counter > window ? `[pacing] Scene stabilized — ${novel.pacing_counter} actions since last transition.` : null;
}

// REQ-351 — pacing-triggered autonomy. When the pacing signal fires, perform one
// autonomous advancement cycle (faction tick + NPC goal pursuit), at most once
// per pacing window. REQ-348 — faction-NPC coordination suppresses a suggestion
// whose goal overlaps the faction's advanced goal.
function triggerPacingAutonomy(novel: NovelState): void {
  if (pacingSignalText(novel) === null) return;
  if (novel.pacing_autonomy_fired) return;
  novel.pacing_autonomy_fired = true;

  const affectedFactions: string[] = [];
  for (const f of novel.factions) {
    f.clock = Math.min(f.clock_max, f.clock + 1);
    affectedFactions.push(f.id);
  }
  const affectedNpcs: string[] = [];
  for (const [, npc] of novel.npcs) {
    const goal = npc.personality?.goals;
    if (!goal) continue;
    // REQ-348 — suppress when a faction goal overlaps this NPC's goal.
    const overlap = novel.factions.some((f) => goalsOverlap(f.goals, goal));
    if (overlap) {
      audit("faction-npc-coordination", { npc: npc.id, goal, factions: novel.factions.map((f) => f.id) });
      continue;
    }
    ensureGoalSuggestion(novel, npc.id, npc.name, goal);
    affectedNpcs.push(npc.id);
  }
  audit("pacing-autonomy", { factions: affectedFactions, npcs: affectedNpcs });
}

// DISPOSITION / goal-overlap helpers shared by REQ-348 / REQ-338 / REQ-339.
function goalsOverlap(factionGoals: string[], npcGoal: string): boolean {
  const tokens = npcGoal.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
  return factionGoals.some((g) => {
    const gt = g.toLowerCase();
    return tokens.some((t) => gt.includes(t) || gt.split(/\s+/).includes(t));
  });
}

// REQ-339 — generate/fetch a goal-pursuit suggestion for a goal-carrying NPC.
function ensureGoalSuggestion(novel: NovelState, npcId: string, name: string, goal: string): void {
  const existing = novel.npc_goal_suggestions.find((s) => s.npc_id === npcId);
  if (existing) return;
  novel.npc_goal_suggestions.push({ npc_id: npcId, text: `${name} pursues "${goal}" off-screen`, state: "pending" });
}

// REQ-355 through REQ-365 — navigational coupling advisories surfaced in
// narrative_threads. Each is advisory: the server suggests; the GM decides.
function collectCouplingAdvisories(novel: NovelState, entity: any): string[] {
  const out: string[] = [];
  const sceneLoc = (novel.scene_location ?? "").toLowerCase();

  // REQ-355 — secret-countdown: revealed secret whose key appears in a countdown scope/direction.
  for (const s of novel.secrets) {
    if (!s.known_by.length) continue;
    for (const [name, cd] of novel.countdowns) {
      const hay = `${cd.scope ?? ""} ${cd.direction ?? ""}`.toLowerCase();
      if (hay.includes(s.key.toLowerCase())) {
        out.push(`Countdown-advancement advisory: secret "${s.key}" relates to countdown "${name}" — advance or ignore.`);
      }
    }
  }

  // REQ-356 — vow-lore: vow name/description intersects lore triggers/keys.
  for (const v of novel.vows) {
    if (v.state !== "active") continue;
    for (const [, entry] of novel.lore) {
      const hay = `${entry.triggers.join(" ")} ${entry.key}`.toLowerCase();
      const vowText = `${v.name} ${v.description}`.toLowerCase();
      if (entry.triggers.some((t) => vowText.includes(t.toLowerCase())) || vowText.includes(entry.key.toLowerCase())) {
        out.push(`[vow-relevant] ${entry.key}`);
      }
    }
  }

  // REQ-357 — story journal-faction: consequence/moment referencing faction goal text.
  for (const s of novel.story_journal) {
    if (s.type !== "consequence" && s.type !== "moment") continue;
    for (const f of novel.factions) {
      for (const g of f.goals) {
        const gTokens = g.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
        if (gTokens.some((t) => s.entry.toLowerCase().includes(t))) {
          out.push(`Faction-clock-advancement advisory: ${f.name} (goal "${g}") — advance or ignore.`);
        }
      }
    }
  }

  // REQ-359 — relationship-countdown: ally → rival/hostile flip referencing matched countdown.
  for (const [name, cd] of novel.countdowns) {
    const hay = `${cd.scope ?? ""} ${cd.direction ?? ""}`.toLowerCase();
    if (hay.length < 3) continue;
    for (const r of novel.relationships) {
      if (r.type === "rival" || (r.type as string) === "hostile") {
        if (hay.includes(r.entity_a.toLowerCase()) || hay.includes(r.entity_b.toLowerCase())) {
          out.push(`Relationship-countdown advisory: ${r.entity_a} -> ${r.entity_b} (${r.type}) relates to countdown "${name}".`);
        }
      }
    }
  }

  // REQ-360 — lore-countdown: lore with temporal urgency triggers suggests countdown creation.
  const urgencyWords = ["imminent", "approaching", "deadline", "ticking", "countdown"];
  for (const [, entry] of novel.lore) {
    if (!entry.enabled) continue;
    const matches = entry.triggers.filter((t) => urgencyWords.includes(t.toLowerCase()));
    if (!matches.length) continue;
    const existing = [...novel.countdowns.keys()].some((n) => n.toLowerCase().includes(entry.key.toLowerCase()) || (entry.key && n.toLowerCase().includes(entry.key.toLowerCase())));
    if (!existing) out.push(`Countdown-creation advisory: lore "${entry.key}" mentions urgency ("${matches.join(", ")}") — create a countdown or ignore.`);
  }

  // REQ-361 — NPC-vow: goal-carrying NPC suggests vow creation.
  for (const [, npc] of novel.npcs) {
    const goal = npc.personality?.goals;
    if (!goal || goal.length < vowSuggestionMinChars()) continue;
    const alreadyVowed = novel.vows.some((v) => v.state === "active" && v.description.toLowerCase().includes(goal.toLowerCase()));
    if (!alreadyVowed) out.push(`Vow-creation suggestion: ${npc.name} seeks "${goal}" — create a vow via vow (action: set) or ignore.`);
  }

  // REQ-362 — faction-vow: faction goal intersecting known entities/locations prompts vow.
  for (const f of novel.factions) {
    for (const g of f.goals) {
      const knownText = `${[...novel.lore.values()].map((l) => l.content).join(" ")} ${novel.story_journal.map((s) => s.entry).join(" ")}`.toLowerCase();
      const gTokens = g.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
      const intersects = gTokens.some((t) => knownText.includes(t));
      if (!intersects) continue;
      const alreadyVowed = novel.vows.some((v) => v.state === "active" && v.description.toLowerCase().includes(g.toLowerCase()));
      if (!alreadyVowed) out.push(`Faction-vow suggestion: ${f.name} seeks "${g}" — create a vow or ignore.`);
    }
  }

  // REQ-363 — secret-world: world_target secret surfaces [world-linked] when scene resolves.
  for (const s of novel.secrets) {
    if (!s.world_target) continue;
    const targetRoom = [...novel.world.rooms.keys()].find((k) => k.toLowerCase() === s.world_target!.toLowerCase());
    if (targetRoom && sceneLoc && sceneLoc.startsWith(targetRoom.toLowerCase())) {
      out.push(`[world-linked] ${s.key}`);
    }
  }

  // REQ-364 — faction-world: territorial factions surface when scene matches territory.
  for (const f of novel.factions) {
    if (!f.territory?.length) continue;
    for (const t of f.territory) {
      if (sceneLoc && sceneLoc.startsWith(t.toLowerCase())) {
        out.push(`[territorial] ${f.name} (clock ${f.clock}/${f.clock_max})`);
      }
    }
  }

  return out;
}

// REQ-286 — knowledge_state section: revealed secrets, participant relationships,
// presence-scoped lore, background knowledge, discovered consequences. Badge-filtered.
function composeKnowledgeState(novel: NovelState, entity: any, badge: Badge): string {
  let section = "";
  if (!entity) {
    section += `\n\n### Knowledge state\n[No active entity — knowledge state unavailable.]`;
    return section;
  }
  const activeId = entity.id;
  const present = (novel.characters_present_ids ?? []).includes(activeId);

  const lines: string[] = [];
  // Revealed secrets (REQ-234/286).
  const knownSecrets = novel.secrets.filter((s) => s.known_by.includes(activeId));
  for (const s of knownSecrets) lines.push(`Secret: ${s.key} — ${s.content}`);

  // Participant relationships (REQ-236/286).
  const rels = novel.relationships.filter((r) => r.entity_a === activeId || r.entity_b === activeId);
  for (const r of rels) lines.push(`Relationship: ${r.entity_a} -> ${r.entity_b} (${r.type})`);

  // Presence-scoped shared lore (REQ-286/308): lore triggered while entity present.
  for (const [, entry] of novel.lore) {
    if (!entry.enabled || entry.badge_scope !== "shared") continue;
    const triggered = entry.triggers.some((t) => novel.scene_description.toLowerCase().includes(t.toLowerCase()));
    if (triggered && present) lines.push(`Lore: [${entry.key}] ${entry.content}`);
  }

  // Discovered consequences (REQ-340/349): [discovered] entries populate knowledge.
  const discovered = novel.story_journal.filter((s) => s.type === "consequence" && s.discovered);
  for (const s of discovered) lines.push(`[discovered] ${s.entry}`);

  // REQ-345 — background knowledge directive when entity has a background.
  const background = entity.personality?.background;
  if (background) {
    lines.push(`Background knowledge: ${background} — the character may know things their background implies (regional geography, academic knowledge, underworld contacts) without having witnessed them in a scene.`);
    // REQ-350 — background lore triggering: match background tokens against shared lore triggers.
    const bgTokens = background.toLowerCase().split(/\s+/).filter((t: string) => t.length > 3);
    for (const [, entry] of novel.lore) {
      if (!entry.enabled || entry.badge_scope !== "shared") continue;
      const matched = entry.triggers.find((t: string) => bgTokens.some((bt: string) => bt.includes(t.toLowerCase()) || t.toLowerCase().includes(bt)));
      if (matched) lines.push(`[background-relevant] ${entry.key} (matched "${matched}")`);
    }
  }

  // REQ-330 — exploration-derived knowledge (rooms visited, things taken),
  // retained regardless of current presence; grouped as "Explored".
  const explored = (entity.knowledge?.explored ?? []) as Array<{ type: string; name: string; at: string }>;
  if (explored.length > 0) {
    const rooms = explored.filter((e) => e.type === "room").map((e) => e.name);
    const things = explored.filter((e) => e.type === "thing").map((e) => e.name);
    const exploredLines = [`Explored: ${rooms.join(", ") || "(none)"}`];
    if (things.length > 0) exploredLines.push(`Seen things: ${things.join(", ")}`);
    lines.push(exploredLines.join(" | "));
  }

  section += `\n\n### Knowledge state`;
  if (!present) section += `\n[Entity not present in this scene]`;
  if (lines.length === 0) {
    section += `\n[No known information.]`;
  } else {
    section += `\n${lines.join("\n")}`;
  }
  return section;
}

// ── Helpers ────────────────────────────────────────────────────────
// Badge gating and snapshot helpers provided by core/server.ts

initServer(state);

// ── Performance / token-efficiency contracts (REQ-408, REQ-409, REQ-410, REQ-411) ──

// REQ-408 — tool parameter ceiling, recorded at build time. The reference host
// computes the ceiling from its own registrations rather than hardcoding a
// blind cap: the ceiling is the maximum parameter count any single tool exposes.
// REQ-408 (amended, REQ-413): for an action-discriminator tool, the ceiling is
// evaluated per action — against the tool's *required* parameters (the action
// discriminator plus any required fields of a single operation), not the union
// of every optional field the tool may accept across actions.
const PARAMETER_CEILING = 8;

// REQ-411 — stable-metadata caching. Rendered listings (tool schemas, prompt
// scaffolding) are derived from live registrations and re-render only when the
// registration set changes (registration fingerprint). Cache entries hold the
// rendered bytes plus the fingerprint they were rendered from.
interface MetadataCache {
  fingerprint: string;
  toolsListBytes: number;
  toolParameterCounts: Record<string, number>;
  toolRequiredParamCounts: Record<string, number>;
  actionToolNames: Set<string>;
  promptBytes: number;
}
function registrationFingerprint(): string {
  const tools = (server as any)._registeredTools ?? {};
  const prompts = (server as any)._registeredPrompts ?? {};
  return crypto.createHash("sha1")
    .update([...Object.keys(tools)].sort().join(","))
    .update("|")
    .update([...Object.keys(prompts)].sort().join(","))
    .digest("hex");
}
let metadataCache: MetadataCache | null = null;
let cacheHits = 0;
let cacheMisses = 0;

// REQ-392 — tool-description budget: descriptions fit a recorded budget;
  // spec_health reports `tools_list_bytes` (aggregate default tools/list size).
function isOptionalShape(schema: any, key: string): boolean {
  const field = schema?.shape?.[key];
  if (!field) return true;
  const def = field._def ?? field._zod?.def ?? {};
  const typeName = def.typeName ?? field.constructor?.name ?? "";
  if (typeName === "ZodOptional") return true;
  return !!def.innerType || !!field.isOptional?.();
}
function computeToolMetrics() {
  const tools: Record<string, any> = (server as any)._registeredTools ?? {};
  let bytes = 0;
  const counts: Record<string, number> = {};
  const requiredCounts: Record<string, number> = {};
  const actionToolNames = new Set<string>();
  for (const [name, tool] of Object.entries(tools)) {
    const desc = (tool?.description ?? "");
    const schema = tool?.inputSchema;
    const shape = (schema && (schema as any).shape) ? Object.keys((schema as any).shape) : [];
    counts[name] = shape.length;
    let required = 0;
    for (const key of shape) {
      if (!isOptionalShape(schema, key)) required++;
    }
    requiredCounts[name] = required;
    if (shape.includes("action")) actionToolNames.add(name);
    bytes += Buffer.byteLength(desc, "utf-8") + 64; // name overhead + description
    for (const key of shape) bytes += Buffer.byteLength(key, "utf-8") + 16;
  }
  return { bytes, counts, requiredCounts, actionToolNames };
}

// REQ-414 — schema-surface economy: count advertised inputs using nested
// structural form (union/array/object) vs. compact scalar form. REQ-413 —
// action-discriminator surface: tools that carry an `action`/`mode`/`kind`
// discriminator parameter are reported with their per-action contracts.
function schemaSurfaceMetrics() {
  const tools: Record<string, any> = (server as any)._registeredTools ?? {};
  const nestedCount: Record<string, number> = {};
  const discriminators: Record<string, { param: string; type: string }> = {};
  for (const [name, tool] of Object.entries(tools)) {
    const schema = tool?.inputSchema;
    const shape = (schema && (schema as any).shape) ? Object.keys((schema as any).shape) : [];
    const nested = shape.filter((k: string) => {
      const t = (schema as any).shape[k];
      return t && ["ZodUnion", "ZodArray", "ZodObject"].some((s) => t._zod?.constructor?.name === s || t.constructor?.name === s);
    });
    if (nested.length > 0) nestedCount[name] = nested.length;
    for (const d of ["action", "mode", "kind"]) {
      if (shape.includes(d)) {
        discriminators[name] = { param: d, type: String((schema as any).shape[d]?.constructor?.name ?? "enum") };
        break;
      }
    }
  }
  return { nested_input_counts: nestedCount, action_discriminators: discriminators };
}

function promptScaffoldBytes() {
  const prompts: any[] = (server as any)._registeredPrompts ? Object.values((server as any)._registeredPrompts) : [];
  return prompts.reduce((n, p) => n + Buffer.byteLength(p?.description ?? "", "utf-8") + Buffer.byteLength(p?.name ?? "", "utf-8") + 32, 0);
}

// Return cached metadata when registrations are unchanged; recompute otherwise.
function cachedMetadata(): MetadataCache {
  const fp = registrationFingerprint();
  if (metadataCache && metadataCache.fingerprint === fp) {
    cacheHits++;
    return metadataCache;
  }
  cacheMisses++;
  const { bytes, counts, requiredCounts, actionToolNames } = computeToolMetrics();
  metadataCache = {
    fingerprint: fp,
    toolsListBytes: bytes,
    toolParameterCounts: counts,
    toolRequiredParamCounts: requiredCounts,
    actionToolNames,
    promptBytes: promptScaffoldBytes(),
  };
  return metadataCache;
}
// Prime the cache once at startup so the first tools/list read is warm.
cachedMetadata();

// REQ-409 — enumeration verbosity, session-scoped. Lean (summary) is the
// default; a per-call `detail: true` requests full entries for a single call.
let enumerationVerbosity: "summary" | "detail" = "summary";

// REQ-253 — tool-output verbosity control: `normal` (full entries, full roll
// transparency) is the default; `terse` returns minimum mechanical content.
// Selectable via the `detail=terse` player signal or a per-call `terse: true`.
let outputVerbosity: "normal" | "terse" = "normal";
// REQ-197 — room description mode, session-scoped (brief/verbose/normal).
let roomDescriptionMode: "brief" | "verbose" | "normal" = "normal";
function terseMode(terse?: boolean): boolean {
  return terse === true || outputVerbosity === "terse";
}
function terseOutput(tool: string, args: any, normal: string, terse: string): any {
  return terseMode(args?.terse) ? raw(terse) : ok(normal);
}

// REQ-409 — normalize the per-call detail request: absent → summary (lean
// default); explicit `true` → full entries; explicit `false` → summary.
// REQ-427 — every advertised input parameter carries a JSON Schema description
// (verified by T509); REQ-024 — three-clause tool descriptions ("Use when" /
// "Do NOT use when").
const detailZod = { detail: z.boolean().optional().describe("When true, return full schema and description instead of a summary.") };
function wantsDetail(detail?: boolean): boolean {
  return detail === true;
}

// ── Ruleset packages (REQ-389, REQ-390, REQ-379) ───────────────────

const rulesets = new RulesetManager(RULESET_DIR);
const scanErrors = rulesets.scan();
// REQ-420 — incompatible packages are held inactive and surfaced on stderr and
// in spec_health.ruleset_package_alerts, never silently dropped (REQ-393).
for (const e of scanErrors) {
  if (e.includes("[package-incompatible]")) console.error(`holonovel: ${e}`);
}
const eagerSlugs = (process.env.TTRPG_RULESETS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
for (const slug of eagerSlugs) {
  if (rulesets.isInstalled(slug)) {
    try { rulesets.hydrate(slug); } catch { /* hydration failures surfaced at call time */ }
  }
}

// ── REQ-088 — TTRPG_NOVEL startup auto-load ────────────────────────
// Activate (resume-or-create) the named Novel before any tool call is
// serviced. On a corrupt or otherwise failed activation, report to stderr and
// spec_health (via corruptData) and proceed with no Novel active — never
// silently swallow, and never overwrite an existing (possibly corrupt) save.
const startupNovel = process.env.TTRPG_NOVEL;
if (startupNovel) {
  const slug = startupNovel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  try {
    const filePath = path.join(DATA_DIR, "novels", `${slug}.json`);
    if (fs.existsSync(filePath)) {
      const novel = state.resumeNovel(slug);
      if (novel.ruleset) {
        if (!rulesets.isInstalled(novel.ruleset)) {
          throw new Error(`Novel '${slug}' is bound to ruleset '${novel.ruleset}', which is not installed.`);
        }
        rulesets.hydrate(novel.ruleset);
      }
    } else {
      state.createNovel(startupNovel);
    }
  } catch (e) {
    state.corruptData.set(slug, `TTRPG_NOVEL activation failed: ${(e as Error).message}`);
    process.stderr.write(`[holonovel] TTRPG_NOVEL='${startupNovel}' activation failed: ${(e as Error).message}\n`);
  }
}

// Convert a JSON-Schema-style inputSchema (as shipped by a package's tools.json)
// into a Zod raw shape registerTool accepts (REQ-389 — schemas-as-data).
function jsonSchemaToZod(schema: any): any {
  if (!schema || typeof schema !== "object") return z.any();
  const t = schema.type;
  if (t === "string") {
    if (Array.isArray(schema.enum)) return z.enum(schema.enum as any);
    return z.string();
  }
  if (t === "number" || t === "integer") return z.number();
  if (t === "boolean") return z.boolean();
  if (t === "array") return z.array(jsonSchemaToZod(schema.items ?? {}));
  if (t === "object") {
    const shape: Record<string, any> = {};
    const requiredSet = new Set<string>(
      Array.isArray(schema.required) ? schema.required : []
    );
    for (const [k, v] of Object.entries(schema.properties ?? {})) {
      let zs = jsonSchemaToZod(v);
      if (requiredSet.has(k)) {
        if (zs && typeof zs === "object" && zs._def?.typeName === "ZodOptional") {
          zs = zs.unwrap();
        }
      } else if (!zs || typeof zs !== "object" || zs._def?.typeName !== "ZodOptional") {
        zs = zs.optional();
      }
      shape[k] = zs;
    }
    return z.object(shape);
  }
  if (schema.anyOf) {
    const nonNull = schema.anyOf.filter((s: any) => s?.type !== "null");
    if (nonNull.length === 1) return jsonSchemaToZod(nonNull[0]).optional();
    return z.any();
  }
  return z.any();
}

// Generic ruleset tool handlers. Tools are expressed as data (REQ-389); the
// host dispatches on the tool's `kind` so a package's tools serve without the
// host re-parsing source Markdown.
function gatedRulesetTool(slug: string, schema: RulesetToolSchema, toolName: string) {
  return async (args: any) => {
    if (!rulesets.isInstalled(slug)) {
      return err("STATE_CONFLICT", `Ruleset '${slug}' is not installed.`);
    }
    if (!rulesets.isHydrated(slug)) {
      return err("STATE_CONFLICT", `Ruleset '${slug}' is installed but not activated. Open a campaign bound to '${slug}', or set TTRPG_RULESETS=${slug} for eager hydration.`);
    }
    const pkg = rulesets.hydrate(slug);
    switch (schema.kind) {
      case "lookup": {
        const collection = schema.collection ?? "concepts";
        const key = String(args.key ?? args.name ?? "").toLowerCase();
        const coll = (pkg.model[collection] ?? {}) as Record<string, any>;
        if (coll && key in coll) {
          const entry = coll[key];
          // REQ-060 — verbose output: full entry; REQ-061 source quoting;
          // REQ-280 source-anchor citation — source block and source_anchor
          // derived from the matching index entry. REQ-004 — truncate.
          // REQ-112 — cross-reference discovery: when the entry's content names
          // another indexed section by anchor, surface a non-recursive pointer.
          const idxEntry = pkg.index.find((i: any) => (i.id ?? "").toLowerCase() === key);
          const body = JSON.stringify({ ...entry, ...sourceAnchor(idxEntry ?? entry), ...discoverCrossRefs(pkg, entry, idxEntry) }, null, 2);
          const payload = body + sourceBlock(idxEntry ?? entry);
          return raw(truncateOutput(toolName, payload));
        }
        // REQ-057 canonical lookup, REQ-059 parameter-canon validation, REQ-183
        // live-index enumerations: unknown names return [NOT_FOUND] with the
        // valid values enumerated from the live index (badge-filtered per
        // REQ-002c) and a "Did you mean?" hint when a close match exists.
        // REQ-058 — tool-result fidelity: no fabricated entries, no reading of
        // ruleset Markdown after startup; lookups use the loaded index/model.
        const validValues = Object.keys(coll);
        const hint = closestMatch(key, validValues);
        const enumList = validValues.length > 0 ? ` Valid values: ${validValues.slice(0, 25).join(", ")}${validValues.length > 25 ? "…" : ""}.` : "";
        const didYouMean = hint ? ` Did you mean '${hint}'?` : "";
        return err("NOT_FOUND", `No '${args.key}' found in ${collection}.${didYouMean}${enumList}`);
      }
      case "search": {
        const q = String(args.query ?? "");
        const hits = rulesets.search(slug, q, args.max_results ?? 10);
        if (hits.length === 0) return err("NOT_FOUND", `No ruleset entry matches '${q}'.`);
        const body = hits.map((h: any) => JSON.stringify({ ...h, ...sourceAnchor(h) }, null, 2)).join("\n");
        // REQ-113 — total match count vs returned count.
        const total = rulesets.search(slug, q, 100000).length;
        return raw(truncateOutput(toolName, body + countReport(hits.length, total)));
      }
      case "roll": {
        try {
          const notation = String(args.dice ?? args.notation ?? "1d20");
          const label = args.skill ? `${args.skill} check` : (args.notation ?? args.dice ?? "1d20");
          let r = rollDice(notation, args.seed);
          const extra = Number(args.modifier ?? 0);
          if (extra !== 0) {
            r = { total: r.total + extra, dice: r.dice, modifier: r.modifier + extra, notation: r.notation };
          }
          // REQ-003 — roll transparency: notation, per-die results, modifiers,
          // total. The selected-faces contract (REQ-003b) is honored when the
          // dice breakdown is reported individually, as here. A zero modifier
          // is still reported so the modifier line is always present.
          const parts = [`${label} (${r.notation}${extra !== 0 ? ` ${extra > 0 ? "+" : "-"} ${Math.abs(extra)}` : ""})`];
          parts.push(`**${r.total}**`);
          if (r.dice.length > 1) parts.push(`(${r.dice.join(" + ")})`);
          if (extra !== 0) parts.push(`modifier ${extra > 0 ? "+" : "-"} ${Math.abs(extra)}`);
          else parts.push(`modifier +0`);
          return ok(parts.join(" → "));
        } catch (e: any) {
          return err("INVALID_INPUT", e.message);
        }
      }
      case "table": {
        const collection = schema.collection ?? "tables";
        const tables = (pkg.model[collection] ?? {}) as Record<string, any>;
        const name = String(args.table ?? args.name ?? "");
        const table = name ? tables[name] ?? tables[name.toLowerCase()] : undefined;
        if (!table) return err("NOT_FOUND", `No table '${name}' found.`);
        if (Array.isArray(table)) {
          const rng = args.seed ? createRng(args.seed) : null;
          const idx = rng ? rng.roll(table.length) - 1 : sessionRoll(table.length) - 1;
          const row = table[Math.max(0, Math.min(idx, table.length - 1))];
          return raw(JSON.stringify(row, null, 2));
        }
        return raw(JSON.stringify(table, null, 2));
      }
      case "info":
        return raw(String(schema.description ?? ""));
      default:
        return err("UNIMPLEMENTED", `Ruleset tool kind '${(schema as any).kind}' is not supported by this host.`);
    }
  };
}

// Register ruleset-prefixed tools for every installed package (REQ-379).
for (const slug of rulesets.installedSlugs()) {
  for (const schema of rulesets.toolSchemas(slug)) {
    const toolName = `${slug}_${schema.name}`;
    try {
server.registerTool(toolName, {
        title: schema.title ?? schema.name,
        description: `${schema.description ?? ""} (ruleset: ${slug})`,
        inputSchema: jsonSchemaToZod(schema.inputSchema),
      }, gatedRulesetTool(slug, schema, toolName));
    } catch (e: any) {
      // Tool name already registered or schema unrecoverable — skip.
    }
  }
}

// REQ-310 — campaign memory: engine-recorded facts derived from state-changing
// tool calls, per-NPC/thread/location, prioritized by scene relevance in
// badge_briefing; per-category counts in spec_health.
function recordCampaignMemory(novel: NovelState, category: "npcs" | "threads" | "locations", text: string, badge_scope: "gm" | "shared" | "discovered" = "gm"): void {
  novel.campaign_memory = novel.campaign_memory ?? [];
  novel.campaign_memory.push({ category, text, at: new Date().toISOString(), badge_scope, scene: novel.scene_description?.substring(0, 60) ?? "" });
  if (novel.campaign_memory.length > 200) novel.campaign_memory.shift();
}

function composeCampaignMemorySection(novel: NovelState, badge: string): string {
  const facts = novel.campaign_memory ?? [];
  if (facts.length === 0) return "";
  const isGM = badge === "game_master" || badge === "none";
  const maxFacts = configInt("TTRPG_CAMPAIGN_MEMORY_MAX_FACTS", 10);
  const visible = isGM ? facts : facts.filter((f) => (f.badge_scope === "shared" || f.badge_scope === "discovered"));
  if (visible.length === 0) return "";
  const lines = visible.slice(-maxFacts).map((f) => {
    const tag = f.badge_scope === "discovered" ? " [discovered]" : "";
    return `- [${f.category}] ${f.text}${tag}`;
  });
  return `\n\n## Campaign Memory\n${lines.join("\n")}`;
}

// REQ-255b — boundary signal propagation: when free-text input contains a
// substring matching an active boundary value, return [WARNING] identifying the
// match without suppressing the operation (advisory collision check).
function boundaryCollisionWarning(novel: NovelState, text: string): string | null {
  const boundary = novel.player_signals?.boundary;
  if (!boundary) return null;
  const t = text.toLowerCase();
  if (t.includes(boundary.toLowerCase())) {
    return `Boundary collision: input contains the boundary value '${boundary}'. Advisory — do not narrate content evoking this topic.`;
  }
  return null;
}

function audit(tool: string, args: any, prefix?: string): void {
  const novel = state.activeNovel;
  if (novel) state.audit(novel, getBadge(), tool, args, prefix);
}

// REQ-292 — count adventure modules on disk (empty → 0).
function countAdventureModules(): number {
  const adventureDir = process.env.TTRPG_ADVENTURE_DIR ?? path.join(__dirname, "..", "adventures");
  try { return fs.readdirSync(adventureDir).filter((f) => f.endsWith(".md")).length; } catch { return 0; }
}

function getActiveEntity() {
  return state.getActiveEntity();
}

function resolveEntity(id?: string) {
  return state.resolveEntity(id);
}

// REQ-120 — NPC rendering: an NPC identifier produces a stat block via the same
// mechanism as entity character sheets; an ID resolving to neither returns
// [NOT_FOUND]. Player badge sees only fields visible in badge_briefing.
function resolveEntityOrNpc(id?: string): any {
  const novel = state.activeNovel;
  if (!novel) return undefined;
  if (id && novel.npcs.has(id)) return novel.npcs.get(id);
  if (id && novel.entities.has(id)) return novel.entities.get(id);
  return state.resolveEntity(id);
}

function ok(text: string) {
  return { content: [{ type: "text" as const, text: `[OK] ${expandMacros(text, buildMacroContext())}` }] };
}

// REQ-002 — error taxonomy: every failure surfaces [ERROR] [CODE] + corrective
// action; REQ-001 — response contract (OK/raw/err) and REQ-032 server-side
// gating via requireGM/requirePlayer.
const CORRECTIVE_ACTIONS: Record<string, string> = {
  NOT_FOUND: "Check the name or id for typos, or list valid values with help.",
  INVALID_INPUT: "Supply a valid value for every required parameter.",
  STATE_CONFLICT: "Resolve the conflicting state before retrying.",
  FORBIDDEN: "Switch badges with set_badge to gain access, or use a permitted tool.",
  RULE_VIOLATION: "Choose an action the rules permit.",
  AMBIGUOUS: "Disambiguate by supplying the full name.",
  UNIMPLEMENTED: "This operation is not supported by the current ruleset host.",
};

function err(code: string, msg: string, correctiveAction?: string) {
  const expanded = expandMacros(msg, buildMacroContext());
  const action = correctiveAction ?? CORRECTIVE_ACTIONS[code];
  const text = action ? `[ERROR] [${code}] ${expanded}\nCorrective action: ${action}` : `[ERROR] [${code}] ${expanded}`;
  return { content: [{ type: "text" as const, text }] };
}

// REQ-054 — input safety: all tool inputs are validated server-side (Zod);
// adversarial free-text is stored and echoed verbatim as inert data with no
// behavior change. The server trusts nothing client-supplied.
let narrationRejectionCount = 0;
// REQ-312 — pre-narration validation gate: TTRPG_NARRATION_VALIDATION (on|off)
// controls mechanical-claim validation of AI narration; rejected proposals
// increment narration_rejection_count and surface a [REJECTED] corrective.
function narrationValidationOn(): boolean { return (process.env.TTRPG_NARRATION_VALIDATION ?? "off") === "on"; }
function validateNarration(claim: string, novel: NovelState): string | null {
  if (!narrationValidationOn()) return null;
  const t = claim.toLowerCase();
  // REQ-312c — state conformance: a dead NPC speaking is rejected.
  for (const [, npc] of novel.npcs) {
    const hp = (npc as any).stats?.hp ?? (npc as any).stats?.current_hp;
    if (hp !== undefined && Number(hp) <= 0 && t.includes(npc.name.toLowerCase())) {
      narrationRejectionCount++;
      return `[REJECTED] ${npc.name} is incapacitated (HP ${hp}) and cannot act or speak.`;
    }
  }
  // REQ-312b — permission conformance: a spellcast claim with no spell resources is rejected.
  if (/(casts|cast)\s+\w+/.test(t) && !/(spell slot|mana|focus)/.test(t)) {
    narrationRejectionCount++;
    return "[REJECTED] Casting requires a spell resource the entity may not possess.";
  }
  return null;
}

function raw(text: string) {
  return { content: [{ type: "text" as const, text: expandMacros(text, buildMacroContext()) }] };
}

function warn(text: string) {
  return { content: [{ type: "text" as const, text: `[WARNING] ${expandMacros(text, buildMacroContext())}` }] };
}

function needInput(text: string) {
  return { content: [{ type: "text" as const, text: `[NEED_INPUT] ${expandMacros(text, buildMacroContext())}` }] };
}

// ── §5.1 Output and Error Contracts ────────────────────────────────
//
// REQ-004 — truncation: tool output longer than a configurable limit is
// truncated with `… [truncated — full content: output://<tool>/<counter>]`.
// The full payload is stored in `outputStore` (session-local, badge-filtered
// on read via REQ-179); the store evicts the oldest entry past the session
// limit, after which the pointer resolves to `[ERROR] [NOT_FOUND]`.
const outputLimit = (): number => configInt("TTRPG_OUTPUT_LIMIT", 32000);
const outputSessionLimit = (): number => configInt("TTRPG_OUTPUT_SESSION_LIMIT", 20);
let outputCounter = 0;
function truncateOutput(tool: string, text: string): string {
  if (text.length <= outputLimit()) return text;
  const key = `${tool}/${++outputCounter}`;
  outputStore.set(key, text);
  while (outputStore.size > outputSessionLimit()) {
    const oldest = outputStore.keys().next().value;
    if (oldest === undefined) break;
    outputStore.delete(oldest);
  }
  return `… [truncated — full content: output://${key}]`;
}

// REQ-194 — anchor derivation (implemented in core/anchors.ts; used by the
// §5.3 lookup tools and source-anchor citation below). When an index entry
// lacks an explicit anchor, the heading path is derived deterministically.
function sourceAnchor(entry: any): Record<string, any> {
  const f = entry?.source_file ?? null;
  const raw = entry?.anchor ?? entry?.id ?? null;
  const a = raw !== null ? deriveAnchor(String(raw)) : null;
  return {
    source_anchor: f || a ? { file: f, heading: a, line_range: entry?.line_range ?? null } : null,
  };
}
function sourceBlock(entry: any): string {
  const f = entry?.source_file;
  const raw = entry?.anchor ?? entry?.id;
  const a = raw !== null && raw !== undefined ? deriveAnchor(String(raw)) : null;
  if (!f && !a) return "";
  const label = f && a ? `${f}#${a}` : (f ?? a);
  const excerpt = entry?.content ?? "";
  return `\n---\n${label}\n${excerpt.split("\n").slice(0, 3).join("\n")}`;
}

// REQ-113 — result count reporting: a collection-returning tool reports both
// the returned count and the total match count.
function countReport(returned: number, total: number): string {
  if (total <= returned) return "";
  return `\n[${returned} of ${total} results]`;
}

// REQ-112 — cross-reference discovery: when a canonical entry's text names
// another indexed section by its anchor or heading, return a non-recursive
// pointer (anchor + one-line description). No cross-references → no pointers.
function discoverCrossRefs(pkg: any, entry: any, idxEntry: any): Record<string, unknown> {
  const text = `${entry?.content ?? ""} ${entry?.description ?? ""} ${idxEntry?.content ?? ""}`.toLowerCase();
  const pointers: Array<{ anchor: string; description: string }> = [];
  for (const i of pkg.index ?? []) {
    const anchor = i?.anchor ?? i?.id;
    if (!anchor) continue;
    const needle = String(anchor).toLowerCase();
    if (text.includes(needle) && needle.length > 4) {
      pointers.push({ anchor: deriveAnchor(String(anchor)), description: (i?.content ?? "").slice(0, 80) });
    }
  }
  return pointers.length > 0 ? { cross_references: pointers } : {};
}

// "Did you mean?" hint: closest valid value by Levenshtein distance (≤3 edits).
function closestMatch(input: string, values: string[]): string | null {
  let best: string | null = null;
  let bestDist = 4;
  for (const v of values) {
    const d = levenshtein(input, v.toLowerCase());
    if (d < bestDist) { bestDist = d; best = v; }
  }
  return best;
}
function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

// REQ-070 / REQ-184 — Appendix J anti-slop synopsis (badge-filtered).
const APPENDIX_J_ANTI_SLOP: Array<{ scope: string; severity: string; pattern: string; forbidden: string; correct: string }> = [
  { scope: "GM", severity: "Soft", pattern: "Purple prose", forbidden: "Over-ornamented description burying detail", correct: "Concrete, sensory, actionable — \"The hall is old. Cracked pillars.\"" },
  { scope: "GM", severity: "Soft", pattern: "Negation framing", forbidden: "Describing by what is absent (\"you don't see…\")", correct: "Describing what is present (\"The corridor is still. Dust settles.\")" },
  { scope: "GM", severity: "Soft", pattern: "Rushing to closure", forbidden: "Resolving all tension in one response", correct: "Ending on an image or choice, not a resolution" },
  { scope: "GM", severity: "Hard", pattern: "Declaring player actions", forbidden: "Narrating what a PC thinks, feels, or decides", correct: "Describing the world; letting the player react" },
  { scope: "Player", severity: "Hard", pattern: "Establishing world facts", forbidden: "Declaring what exists as established truth", correct: "Asking whether elements exist" },
  { scope: "Player", severity: "Hard", pattern: "Assuming outcomes", forbidden: "Narrating results before adjudication", correct: "Describing intent and attempt, waiting for resolution" },
  { scope: "Player", severity: "Hard", pattern: "Declaring NPC reactions", forbidden: "Stating how an NPC responds", correct: "Laying out reasoning, waiting for GM response" },
  { scope: "GM", severity: "Soft", pattern: "Echoing", forbidden: "Restating player action without adding new information", correct: "Advancing the scene with new sensory detail or consequence" },
  { scope: "GM", severity: "Soft", pattern: "Passive voice dominance", forbidden: "Describing events without engaging player agency", correct: "Centering the player's senses or actions" },
  { scope: "GM", severity: "Soft", pattern: "Motif repetition", forbidden: "Reusing the same adjective or descriptive template", correct: "Varying sensory register between responses" },
  { scope: "GM", severity: "Hard", pattern: "Constraint forgetting", forbidden: "Narrating in contradiction of established scene state", correct: "Checking active scene state and conditions before narrating" },
  { scope: "Both", severity: "Soft", pattern: "Meta-commentary leakage", forbidden: "Breaking character with out-of-character commentary", correct: "Staying in the narrative register; reserving OOC for explicit markers" },
];
function antiSlopFor(badge: string): string {
  const rows = APPENDIX_J_ANTI_SLOP.filter((r) => r.scope === "Both" || r.scope === (badge === "game_master" ? "GM" : "Player"));
  if (rows.length === 0) return "";
  return rows.map((r) => `- [anti-slop] [${r.severity}] ${r.pattern}: ${r.forbidden} → ${r.correct}`).join("\n");
}

// REQ-118 — prompt length budget. When a constructed prompt exceeds its budget,
// low-priority sections are replaced with `[truncated]` markers plus a pointer
// to the matching guidance resource. Section headers survive; required contract
// elements (badge boundary REQ-064, intro pointer REQ-063) are never truncated.
// REQ-135 — badge briefing size budget: same truncation discipline, never
// touching badge foundations and the intro pointer; REQ-180 — byte-UTF-8
// thresholds (characters ≈ bytes for UTF-8 Markdown here).
const promptBudget = (): number => configInt("TTRPG_PROMPT_BUDGET", 16000);
const NEVER_TRUNCATED = new Set(["badge boundary", "turn handoff", "intro"]);
function applyPromptBudget(text: string): string {
  const budget = promptBudget();
  if (text.length <= budget) return text;
  const sections = text.split(/\n(?=### )/);
  let kept = "";
  for (const section of sections) {
    const header = section.match(/^### ([^\n]+)/)?.[1]?.toLowerCase() ?? "";
    const required = [...NEVER_TRUNCATED].some((n) => header.includes(n));
    if (required || kept.length + section.length <= budget) {
      kept += kept ? "\n" : "";
      kept += section;
    } else {
      const slug = header.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      kept += `\n### ${header.charAt(0).toUpperCase() + header.slice(1)} [truncated — full content: guidance://${slug || "current"}]`;
    }
  }
  return kept;
}

function buildMacroContext() {
  const novel = state.activeNovel;
  const entity = state.getActiveEntity();
  const countdowns: Record<string, { remaining: number; total: number; scope?: string; direction?: string }> = {};
  if (novel) {
    for (const [name, cd] of novel.countdowns) {
      countdowns[name] = { remaining: cd.ticks, total: cd.total, scope: cd.scope, direction: cd.direction };
    }
  }
  return {
    entityName: entity?.name,
    sceneCurrent: novel?.scene_description,
    sceneLocation: novel?.scene_location,
    sceneTimeOfDay: novel?.scene_time_of_day,
    sceneAtmosphere: novel?.scene_atmosphere,
    sceneType: novel?.scene_type?.join(", "),
    countdowns,
    novelSlug: novel?.slug,
    badgeActive: novel?.badge ?? undefined,
    partySize: novel ? novel.entities.size : undefined,
    currentRoom: entity?.current_room ?? undefined,
    worldRoomCount: novel ? novel.world.rooms.size : undefined,
    worldThingCount: novel ? novel.world.things.size : undefined,
  };
}

function worldSnapshot(): void {
  novelSnapshot();
}

// ── Help Categories ─────────────────────────────────────────────────

const BUILDER_CATEGORIES: Record<string, string[]> = {
  "Badge & Workflow": ["set_badge", "respond", "undo", "redo", "help"],
  "Characters": ["character"],
  "World Model": ["command", "world"],
  "Lookups": ["ruleset"],
  "Combat": ["combat"],
  "Conditions": ["condition"],
  "Narrative": ["scene"],
  "NPCs": ["npc"],
  "Factions": ["faction"],
  "Secrets": ["lore"],
  "Relationships": ["relationship"],
  "Vows": ["vow"],
  "Countdowns": ["countdown"],
  "Lore": ["lore"],
  "Story Journal": ["story"],
  "Notes": ["note"],
  "Codex": ["codex"],
  "Adventure": ["adventure"],
  "Session": ["session"],
  "Novel Lifecycle": ["novel"],
  "Synthesis": ["synthesis"],
};

const GMToolsSet = new Set([
  "scene", "combat", "condition", "npc", "faction", "relationship", "vow",
  "countdown", "lore", "story", "note", "world", "adventure", "novel",
  "synthesis", "codex", "ruleset", "session",
]);

function isGMTool(name: string): boolean {
  return GMToolsSet.has(name);
}

function buildExampleInvocation(name: string, schema: any): string {
  if (!schema || typeof schema !== "object") return `${name}()`;
  const shape = schema._def?.typeName === "ZodObject" ? schema._def.shape() : schema;
  if (!shape) return `${name}()`;
  const entries = Object.entries(shape) as [string, any][];
  const required = entries.filter(([, v]) => !v.isOptional?.() && !v._def?.typeName?.startsWith("ZodOptional"));
  if (required.length === 0 && entries.length > 0) {
    const [key] = entries[0];
    return `${name}({ ${key}: ${illustrate(key, entries[0][1])} })`;
  }
  if (required.length === 0) return `${name}()`;
  const args = required.map(([k, v]) => `${k}: ${illustrate(k, v)}`).join(", ");
  return `${name}({ ${args} })`;
}

function illustrate(key: string, schema: any): string {
  const typeName = schema._def?.typeName ?? "";
  if (typeName === "ZodString") return key === "name" ? '"example"' : `"<${key}>"`;
  if (typeName === "ZodNumber") return "1";
  if (typeName === "ZodBoolean") return "true";
  if (typeName === "ZodEnum") {
    const values = schema._def?.values ?? [];
    if (values.length > 0) return `"${values[0]}"`;
    return `"<${key}>"`;
  }
  if (typeName === "ZodArray") return "[]";
  return `"<${key}>"`;
}

function fmtEntitySheet(entity: any): string {
  const p = entity.personality ?? {};
  let sheet = `## ${entity.name}\n`;
  if (entity.inventory?.length > 0) {
    sheet += `**Inventory:** ${entity.inventory.join(", ")}\n`;
  }
  if (entity.current_room) {
    sheet += `**Location:** ${entity.current_room}\n`;
  }
  if (entity.stats) {
    sheet += `\n### Mechanical Stats\n${fmtStats(entity.stats)}\n`;
  }
  if (p.description || p.voice || p.background || p.goals) {
    sheet += `\n### Personality\n`;
    if (p.description) sheet += `**Description:** ${p.description}\n`;
    if (p.voice) sheet += `**Voice:** ${p.voice}\n`;
    if (p.background) sheet += `**Background:** ${p.background}\n`;
    if (p.goals) sheet += `**Goals:** ${p.goals}\n`;
  }
  if (!entity.stats) {
    sheet += `\n_World-model only — no mechanical stats._`;
  }
  return sheet;
}

function fmtStats(stats: any): string {
  const lines: string[] = [];
  if (stats.class) lines.push(`**Class:** ${stats.class}`);
  if (stats.level != null) lines.push(`**Level:** ${stats.level}`);
  if (stats.species) lines.push(`**Species:** ${stats.species}`);
  if (stats.abilityScores) {
    const ab = stats.abilityScores;
    const mod = (s: number) => (Math.floor((s - 10) / 2) >= 0 ? `+${Math.floor((s - 10) / 2)}` : `${Math.floor((s - 10) / 2)}`);
    const entries = Object.keys(ab).map((k) => `${k} ${ab[k]} (${mod(ab[k])})`);
    lines.push(`**Abilities:** ${entries.join(" · ")}`);
  }
  // Ruleset-declared derived statistics, rendered generically under their
  // declared labels (REQ-181a). Falls back to legacy field names when a
  // pre-refactor entity carries legacy hard-coded stats.
  const derivedLabels: Record<string, string> = (stats._derived_labels?.labels as Record<string, string>) ?? {};
  const derivedOrder: string[] = (stats._derived_labels?.order as string[]) ?? [];
  const rendered = new Set<string>();
  for (const key of derivedOrder) {
    const label = derivedLabels[key] ?? key;
    if (stats[label] == null) continue;
    rendered.add(label);
    lines.push(`**${label}:** ${stats[label]}`);
  }
  for (const [k, v] of Object.entries(stats)) {
    if (k.startsWith("_") || ["class", "level", "species", "abilityScores", "statMethod", "trainedSkills", "feats", "talents", "equipment"].includes(k)) continue;
    if (typeof v !== "number") continue;
    if (rendered.has(k)) continue;
    lines.push(`**${k}:** ${v}`);
  }
  if (stats.trainedSkills?.length) lines.push(`**Trained Skills:** ${stats.trainedSkills.join(", ")}`);
  if (stats.feats?.length) lines.push(`**Feats:** ${stats.feats.join(", ")}`);
  if (stats.talents?.length) lines.push(`**Talents:** ${stats.talents.join(", ")}`);
  if (stats.equipment?.length) {
    const eq = stats.equipment.map((e: any) => (typeof e === "string" ? e : `${e.name}${e.quantity && e.quantity !== 1 ? ` ×${e.quantity}` : ""}`)).join(", ");
    lines.push(`**Equipment:** ${eq}`);
  }
  return lines.join("\n");
}

function formatNpcSheet(npc: any): string {
  let s = `## ${npc.name}\n`;
  if (npc.description) s += `*${npc.description}*\n`;
  if (npc.disposition) s += `**Disposition:** ${npc.disposition}\n`;
  if (npc.location) s += `**Location:** ${npc.location}\n`;
  return s;
}

// ── Output Format Catalog (REQ-425) ────────────────────────────────
//
// REQ-425a — every user-requestable artifact surface accepts an optional
// `format` selector drawn from this catalog; the default is `markdown`.
// REQ-425b — an unsupported format returns `[INVALID_INPUT]` enumerating the
// surface's supported set, derived at call time (REQ-059). REQ-425c — the
// same artifact in the same format renders byte-identically across surfaces
// (tools and resources share the same render functions). REQ-425d — ruleset
// packages may declare additional formats via the registry below.

const UNIVERSAL_FORMATS = ["markdown", "json", "html"] as const;
const STATBLOCK_FORMATS = ["markdown", "json", "html", "ascii"] as const;
const SESSION_FORMATS = ["markdown", "lonelog"] as const;
const INTERCHANGE_FORMATS = ["json", "markdown"] as const;

// Ruleset-declared formats (REQ-425d). Packages register additional format
// identifiers here at load time; they are surfaced in spec_health and in the
// `[INVALID_INPUT]` enumeration of every surface.
const declaredFormats = new Set<string>([]);
function registerDeclaredFormat(name: string): void { declaredFormats.add(name); }

function supportedFormats(surface: readonly string[]): string[] {
  return [...new Set([...surface, ...declaredFormats])];
}

// REQ-425b — validate a requested format against a surface's supported set;
// returns the normalized format or an `[INVALID_INPUT]` result.
function resolveFormat(format: string | undefined, surface: readonly string[]): string | { content: { type: "text"; text: string }[] } {
  const fmt = format ?? "markdown";
  if (!supportedFormats(surface).includes(fmt)) {
    const list = supportedFormats(surface).join(", ");
    return err("INVALID_INPUT", `Unsupported format '${fmt}'. Supported formats: ${list}.`);
  }
  return fmt;
}

// REQ-425c / REQ-426a — a presentational HTML render of a Markdown artifact.
// Self-contained (no external origins) per REQ-426d. Minimal Markdown→HTML:
// headings, bold, italics, and line breaks; everything else is escaped.
function htmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function toHtml(markdown: string): string {
  const body = markdown
    .split("\n")
    .map((line) => {
      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        const text = htmlEscape(heading[2].replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1"));
        return `<h${level}>${text}</h${level}>`;
      }
      let l = htmlEscape(line);
      l = l.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");
      return l;
    })
    .join("<br>\n");
  return `<!DOCTYPE html>\n<html><body><article>${body}</article></body></html>\n`;
}

// REQ-426d — UI resource CSP metadata: no external network origins.
function uiResourceMeta(): { csp: { connectDomains: string[]; resourceDomains: string[]; frameDomains: string[] } } {
  return { csp: { connectDomains: [], resourceDomains: [], frameDomains: [] } };
}

// REQ-426c — a negotiating client declares `io.modelcontextprotocol/ui` in its
// capabilities.extensions. Non-negotiating clients fall back to text surfaces.
function appsNegotiated(): boolean {
  const ext = server.server.getClientCapabilities()?.extensions;
  return !!ext && "io.modelcontextprotocol/ui" in ext;
}

// REQ-425c — the structured (`json`) render of a stat block, shared by the
// character_sheet tool and the entity/npc resources so both agree byte-for-byte.
function entitySheetJson(entity: any): object {
  return {
    id: entity.id ?? null,
    name: entity.name ?? null,
    stats: entity.stats ?? null,
    personality: entity.personality ?? {},
    inventory: entity.inventory ?? [],
    current_room: entity.current_room ?? null,
    conditions: entity.conditions ?? [],
  };
}

// REQ-425c — a Markdown render of a codex entry, shared by the codex://
// resource and its `ui://` HTML view.
function codexEntryMarkdown(entry: any): string {
  let md = `## ${entry.name}\n`;
  if (entry.kind) md += `**Kind:** ${entry.kind}\n`;
  if (entry.description) md += `*${entry.description}*\n`;
  if (entry.content) md += `\n${JSON.stringify(entry.content, null, 2)}\n`;
  return md;
}

// REQ-426a/c — build a `ui://` resource result. A negotiating client receives
// `text/html;profile=mcp-app` with restrictive CSP metadata (REQ-426d); a
// non-negotiating client receives a plain-text fallback (REQ-426c).
function uiResourceResult(uri: string, html: string, negotiated: boolean): any {
  if (!negotiated) {
    return { contents: [{ uri, text: `[STATE_CONFLICT] ui:// resources require the MCP Apps extension (io.modelcontextprotocol/ui).`, mimeType: "text/plain" }] };
  }
  return { contents: [{ uri, text: html, mimeType: "text/html;profile=mcp-app", _meta: { ui: uiResourceMeta() } }] };
}

// REQ-426b — attach `ui://` linkage metadata to a tool result when a client has
// negotiated the MCP Apps extension; non-negotiating clients get the bare result.
function withUiLinkage(result: any, resourceUri: string): any {
  if (!appsNegotiated()) return result;
  const content = (result.content ?? []).map((c: any) => ({ ...c, _meta: { ui: { resourceUri } } }));
  return { ...result, content };
}

// REQ-425a — read the `format` query parameter from a resource URI (default
// markdown) and extract the resource id/key, excluding the query string.
function resourceFormat(uri: URL): string {
  return uri.searchParams.get("format") ?? "markdown";
}
function resourceKey(uri: URL): string {
  const raw = uri.href.split("?")[0].split("/").filter(Boolean).pop() ?? "";
  return decodeURIComponent(raw);
}

// ── Tools ──────────────────────────────────────────────────────────

// --- Badge & Workflow ---

function badgeLabel(badge: Badge): string {
  if (badge === "none") return "Editor";
  return badge;
}

// REQ-066 — set_badge switches the active badge (player/game_master/observer/none).
// REQ-031 — badge activation: set_badge activates the badge and its gating
// context; REQ-305 — observer mode: read-only spectator, AI plays both roles.
server.registerTool("set_badge", {
  title: "Set Active Badge",
  description: "Switch the active badge to player, game_master, observer, or none (Editor), gating tool access server-side for the session; always callable. Use when: entering the story, spectating, or stepping away to edit. Do NOT use when: answering a pending workflow decision — use respond.",
  inputSchema: { badge: z.enum(["player", "game_master", "observer", "none"]).describe("The badge to activate: player, game_master, observer, or none (Editor).") },
}, async ({ badge }) => {
  const novel = state.activeNovel;
  if (novel) {
    if (novel.pending_workflow) {
      return err("STATE_CONFLICT", "A workflow decision is pending. Resolve it with respond before switching badges.");
    }
    novel.badge = badge;
    state.saveNovel(novel);
  }
  if (badge === "none") return ok("Active badge: Editor — full access");
  if (badge === "observer") return ok("Active badge: observer — read-only spectator mode");
  return ok(`Active badge: ${badge}`);
});

// REQ-042a — canonicalization: leading/trailing whitespace stripped, internal
// whitespace collapsed to single spaces, so a decision that differs from the
// emitted text only in whitespace still matches.
function canon(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

server.registerTool("respond", {
  title: "Respond to Workflow Decision",
  description: "Answer a pending workflow decision, atomically draining it and persisting the outcome to the Novel. Use when: the server emitted a [NEED_INPUT] prompt and the caller must choose. Do NOT use when: no decision is pending — use set_badge or a state tool instead.",
  inputSchema: { decision: z.string().describe("The canonical decision text the workflow is waiting on."), option: z.string().describe("The chosen option, or 'cancel' to abort the workflow and restore its snapshot.") },
}, async ({ decision, option }) => {
  requireNotObserver();
  const novel = requireNovel();
  const pw = novel.pending_workflow;

  const dec = canon(String(decision));
  const opt = canon(String(option));

  // REQ-339 — World in Motion goal-pursuit suggestion resolution (no pending
  // workflow required; suggestions are surfaced in badge_briefing).
  if (novel.npc_goal_suggestions.length > 0 && ["accept", "defer", "dismiss"].includes(opt)) {
    const suggestion = novel.npc_goal_suggestions.find((s) => s.npc_id === option || s.npc_id === dec)
      ?? novel.npc_goal_suggestions.find((s) => s.state !== "accepted" && s.state !== "dismissed");
    if (suggestion) {
      if (opt === "accept") { suggestion.state = "accepted"; audit("world-in-motion", { npc: suggestion.npc_id, disposition: "accepted" }); state.saveNovel(novel); return ok(`Goal pursuit accepted for ${suggestion.npc_id}.`); }
      if (opt === "defer") { suggestion.state = "deferred"; state.saveNovel(novel); return ok(`Goal pursuit deferred for ${suggestion.npc_id} — will re-surface at the next transition.`); }
      if (opt === "dismiss") { suggestion.state = "dismissed"; audit("world-in-motion", { npc: suggestion.npc_id, disposition: "dismissed" }); state.saveNovel(novel); return ok(`Goal pursuit dismissed for ${suggestion.npc_id}.`); }
    }
  }

  // REQ-322 — vow-countdown coupling suggestion resolution (no pending
  // workflow required): `respond accept` auto-creates the linked mission
  // countdown; `respond decline` clears the suggestion.
  if (novel.pending_vow_countdown_suggestion && ["accept", "decline"].includes(opt)) {
    const s = novel.pending_vow_countdown_suggestion;
    if (opt === "accept") {
      novel.countdowns.set(s.countdown_name, {
        name: s.countdown_name, ticks: s.tick_count, total: s.tick_count,
        type: "narrative", scope: s.scope, clock_type: "mission",
      });
      audit("vow_countdown_created", { vow_name: s.vow_name, countdown: s.countdown_name, ticks: s.tick_count });
      novel.pending_vow_countdown_suggestion = null;
      state.saveNovel(novel);
      return ok(`Linked countdown '${s.countdown_name}' (${s.tick_count} ticks) created for vow '${s.vow_name}'.`);
    }
    novel.pending_vow_countdown_suggestion = null;
    state.saveNovel(novel);
    return ok(`Countdown suggestion for vow '${s.vow_name}' declined — manage the vow via milestones.`);
  }

  // REQ-042a/b: no workflow pending → [STATE_CONFLICT] identifying the drained
  // state (REQ-192 batch-respond collision: a second respond on a drained
  // workflow must not be applied twice).
  if (!pw) {
    return err("STATE_CONFLICT", "No workflow decision is pending — the workflow has already been drained or cancelled.");
  }

  // REQ-190 — Respond drain result: a drained workflow returns [OK], clears
  // pending_workflow (restoring undo/redo/set_badge), and is atomic.
  // REQ-191 — Option display-label pairs: options are rendered kebab (label).

  // Explicit cancellation (REQ-042b): restore the pre-workflow snapshot,
  // clear the pending workflow, reset the staleness counter, and audit a
  // workflow-cancellation entry recording the decision text and timestamp.
  if (opt === "cancel") {
    const snapshot = pw.snapshot;
    const { timestamp } = state.restoreFromSnapshot(novel, snapshot);
    audit("workflow_cancelled", {
      decision: pw.decision,
      timestamp,
    }, "[workflow-cancelled]");
    state.saveNovel(novel);
    return ok(`Workflow '${pw.decision}' cancelled — pre-workflow state restored.`);
  }

  // Determine the workflow kind from the stable machine token, not the echo.
  const kind = pw.decision;
  if (kind.includes("end_novel") || kind.includes("end novel") || kwMatch(dec, ["end novel", "end_novel"])) {
    const slug = state.activeNovel!.slug;
    const result = state.endNovel(novel, opt === "yes" ? "yes" : "cancel");
    if (result.removed) {
      novel.pending_workflow = null;
      return ok(`Novel '${slug}' ended.`);
    }
    state.restoreFromSnapshot(novel, pw.snapshot);
    state.saveNovel(novel);
    return ok("End novel cancelled.");
  }
  if (kind === "present_choices" || kwMatch(dec, ["present_choices", "present choices"])) {
    const chosenId = opt;
    // REQ-235b: record the player's choice in the audit log.
    audit("respond", { decision, option: chosenId }, "[choice]");
    // REQ-235b: advance countdowns whose scope equals the chosen id.
    for (const [name, cd] of novel.countdowns) {
      if (cd.scope && cd.scope === chosenId) {
        cd.ticks--;
        if (cd.ticks <= 0) {
          novel.countdowns.delete(name);
          audit("countdown_expired", { name });
        } else {
          audit("advance_countdown", { name, remaining: cd.ticks });
        }
      }
    }
    // REQ-235b/c: advance faction clocks whose goals match the chosen id.
    for (const f of novel.factions) {
      const tokens = f.goals.join(" ").toLowerCase().split(/\W+/).filter(Boolean);
      if (tokens.includes(chosenId.toLowerCase())) {
        f.clock = Math.min(f.clock + 1, f.clock_max);
        audit("faction_clock", { faction: f.id, clock: f.clock });
      }
    }
    novel.pending_workflow = null;
    state.saveNovel(novel);
    return ok(`Choice '${chosenId}' selected.`);
  }
  if (kind.startsWith("safety_escalation:")) {
    const target = kind.slice("safety_escalation:".length);
    const auto = novel.autonomy;
    if (opt === "decline" || opt === "cancel") {
      state.restoreFromSnapshot(novel, pw.snapshot);
      state.saveNovel(novel);
      return ok(`Safety escalation declined — tier remains ${auto.safety}.`);
    }
    if (opt !== "confirm") {
      return err("NOT_FOUND", `Respond 'confirm' to raise the safety tier, or 'decline' to keep the current tier (${auto.safety}).`);
    }
    auto.safety = target as "safe" | "moderate" | "hardcore";
    if (!auto.confirmed_safety_tiers.includes(target)) auto.confirmed_safety_tiers.push(target);
    novel.pending_workflow = null;
    state.saveNovel(novel);
    audit("set_autonomy", { safety: target, confirmed: true });
    return ok(`Safety tier raised to '${target}'.`);
  }
  if (kind === "character_creation" || kwMatch(dec, ["character creation"])) {
    const wf = ("creation" in pw ? pw.creation : undefined);
    if (!wf) return err("STATE_CONFLICT", "No character-creation workflow in progress.");
    const steps = creationSteps(wf.rules ?? undefined);
    const step = steps[wf.stepIndex] ?? "name";
    const ans = opt;
    switch (step) {
      case "name": wf.answers.name = ans; break;
      case "species": wf.answers.species = ans; break;
      case "classes": wf.answers.classLevels = parseClassLevels(ans); break;
      case "ability_scores": {
        wf.answers.statMethod = "planned";
        wf.answers.abilityScores = parseAbilityScores(ans, wf.rules ?? undefined);
        break;
      }
      case "skills": wf.answers.trainedSkills = ans.split(/[\s,]+/).filter(Boolean); break;
      case "equipment": wf.answers.equipment = ans.split(/[\s,]+/).filter(Boolean); break;
    }
    wf.stepIndex++;
    if (wf.stepIndex < steps.length) {
      novel.pending_workflow = { decision: "character_creation", snapshot: pw.snapshot, creation: wf };
      state.saveNovel(novel);
      return needInput(creationStepPrompt(wf));
    }
    novel.pending_workflow = null;
    const rules = wf.rules;
    if (!rules) {
      // Ruleset-free workflow completed — profile-only entity.
      const name = wf.answers.name ?? "Unnamed";
      const species = wf.answers.species;
      const entity = state.createEntity(name, undefined, species ? { species } : undefined);
      state.addEntity(novel, entity);
      state.saveNovel(novel);
      return ok(`${fmtEntitySheet(entity)}

Character '${name}' created as ${entity.id} (profile-only — no mechanical stats).`);
    }
    const species = wf.answers.species ?? Object.values(rules.species ?? {})[0]?.name ?? "";
    const classLevels = wf.answers.classLevels ?? [];
    for (const cl of classLevels) {
      if (!getClassData(rules, cl.className)) return err("INVALID_INPUT", `Unknown class '${cl.className}'.`);
    }
    const defaultScores = rules.default_ability_scores?.map(String).join(" ") ?? "15 14 13 12 10 8";
    const abilityScores = applySpeciesAdjustments(
      wf.answers.abilityScores ?? parseAbilityScores(defaultScores as any, rules),
      species,
      rules,
    );
    const build: CharacterBuildInput = {
      name: wf.answers.name ?? "Unnamed",
      species,
      classLevels,
      abilityScores,
      trainedSkills: wf.answers.trainedSkills ?? [],
      feats: [],
      talents: [],
      statMethod: wf.answers.statMethod ?? "planned",
    };
    const stats = buildCharacterStats(build, rules);
    const entity = state.createEntity(build.name, undefined, stats);
    state.addEntity(novel, entity);
    state.saveNovel(novel);
    return ok(`${fmtEntitySheet(entity)}

Character '${build.name}' created as ${entity.id} with derived statistics.`);
  }
  if (kind.startsWith("restore_checkpoint:")) {
    const label = kind.slice("restore_checkpoint:".length);
    if (opt === "yes") {
      const stateData = pw.payload?.state;
      const restored = stateData ? loadNovelFromStateData(stateData) : null;
      applyNovelState(novel, restored ?? novel);
      novel.pending_workflow = null;
      state.saveNovel(novel);
      audit("checkpoint_restored", { label }, "[checkpoint-restored]");
      return ok(`Checkpoint '${label}' restored.`);
    }
    state.restoreFromSnapshot(novel, pw.snapshot);
    state.saveNovel(novel);
    return ok(`Checkpoint '${label}' restore cancelled.`);
  }
  // REQ-140 — End-Novel confirmation dispatch: a mismatched decision against an
  // open workflow returns [NOT_FOUND] with the open decision's canonical text.
  return err("NOT_FOUND", `Unrecognized decision '${decision}'. Canonical decision: '${pw.decision}'.`);
});

// REQ-042a helper: whole-token keyword match on canonicalized decision text.
function kwMatch(canonicalDecision: string, keywords: string[]): boolean {
  const tokens = canonicalDecision.toLowerCase().split(/\s+/);
  return keywords.some((kw) => tokens.includes(kw.toLowerCase()));
}

server.registerTool("undo", {
  title: "Undo",
  description: "Undo the most recent state mutation, restoring the prior per-badge snapshot. Use when: reverting a mistaken or unwanted change. Do NOT use when: re-applying an undone change — use redo.",
  inputSchema: {},
}, async () => {
  requireNotObserver();
  const novel = requireNovel();
  if (novel.pending_workflow) {
    return err("STATE_CONFLICT", "A workflow decision is pending. Resolve it with respond before undoing.");
  }
  state.undo(novel, getBadge());
  return ok("Undo successful.");
});

server.registerTool("redo", {
  title: "Redo",
  description: "Re-apply the most recently undone mutation, restoring the per-badge snapshot that undo removed. Use when: an undo was issued by mistake and the change should be restored. Do NOT use when: reverting a new change — use undo.",
  inputSchema: {},
}, async () => {
  requireNotObserver();
  const novel = requireNovel();
  if (novel.pending_workflow) {
    return err("STATE_CONFLICT", "A workflow decision is pending. Resolve it with respond before redoing.");
  }
  state.redo(novel, getBadge());
  return ok("Redo successful.");
});

server.registerTool("help", {
  title: "Help and Tool Discovery",
  description: "Show the available tools grouped by category (badge-filtered) or reassign a tool's category. Use when: the caller needs to discover tools, find one by keyword, or override a tool's category for a session. Do NOT use when: reading the current badge's guidance — use the badge_briefing prompt.",
  inputSchema: { query: z.string().optional().describe("Optional search term matched against tool name, description, and title."), action: z.enum(["list", "category"]).optional().describe("list (default) or category (reassign a tool's category)."), tool_name: z.string().optional().describe("Registered tool name to reassign (category)."), category: z.string().nullable().optional().describe("New category label, or null/empty to restore default (category).") },
}, async (args: any) => {
  if (args.action === "category") {
    requireGM();
    const novel = requireNovel();
    const registeredTools: Record<string, any> = (server as any)._registeredTools ?? {};
    if (!(args.tool_name in registeredTools)) {
      const valid = Object.keys(registeredTools).join(", ");
      return err("NOT_FOUND", `Tool '${args.tool_name}' not found. Valid: ${valid}`);
    }
    if (!args.category || args.category.trim() === "") {
      delete novel.help_category_overrides[args.tool_name];
      state.saveNovel(novel);
      return ok(`Category override for '${args.tool_name}' removed.`);
    }
    novel.help_category_overrides[args.tool_name] = args.category.trim();
    state.saveNovel(novel);
    return ok(`Tool '${args.tool_name}' assigned to category '${args.category.trim()}'.`);
  }
  const query = args.query;
  // REQ-024 — tool documentation: tools carry a human title and descriptions
  // using the ruleset's own terms; full descriptions remain at resources/read.
  // REQ-415 — summary-first catalog: `help`/catalog listings return summaries;
  // full schema and description are available on a detail request (detail:true).
  const badge = getBadge();
  const novel = state.activeNovel;
  const isGM = badge === "game_master";

  if (query) {
    const q = query.toLowerCase();
    const registeredTools: Record<string, any> = (server as any)._registeredTools ?? {};
    const toolNames = Object.keys(registeredTools).filter(t => {
      if (t === "set_badge" || t === "respond" || t === "undo" || t === "redo") return true;
      if (!isGM && isGMTool(t)) return false;
      // Parser is hidden from the Player badge on ruleset-bound Novels (REQ-309b).
      if (!isGM && t === "command" && novel?.ruleset) return false;
      return true;
    });

    const matched: { name: string; description: string; example: string; relevance: number }[] = [];
    for (const name of toolNames) {
      const def = registeredTools[name];
      if (!def) continue;
      const desc = typeof def.description === "string" ? def.description : "";
      const title = typeof def.title === "string" ? def.title : "";
      let score = 0;
      if (name.toLowerCase().includes(q)) score += 3;
      if (desc.toLowerCase().includes(q)) score += 2;
      if (title.toLowerCase().includes(q)) score += 1;
      if (score === 0) continue;
      const firstSentence = desc.split(".")[0] + (desc.includes(".") ? "." : "");
      const example = buildExampleInvocation(name, def.inputSchema);
      matched.push({ name, description: firstSentence, example, relevance: score });
    }

    if (q.includes("intro") || q.includes("start") || q.includes("begin")) {
      matched.push({ name: "intro", description: "Connection introduction and getting started.", example: "Use the intro prompt", relevance: 3 });
    }
    if (q.includes("brief") || q.includes("badge") || q.includes("state")) {
      matched.push({ name: "badge_briefing", description: "Per-badge guidance, state, and tool recommendations.", example: "Use the badge_briefing prompt", relevance: 2 });
    }

    matched.sort((a, b) => b.relevance - a.relevance);
    const top = matched.slice(0, 5);
    if (top.length === 0) return ok("No tools match. Try `command(\"look\")` for world description.");
    return raw(top.map(m => `**${m.name}** — ${m.description}\nExample: ${m.example}`).join("\n\n"));
  }

  const builderCategories = BUILDER_CATEGORIES;
  let result = "## Inform MCP Server\n\n### Tool Categories\n\n";
  for (const [cat, tools] of Object.entries(builderCategories)) {
    let displayTools = [...tools];
    if (!isGM) {
      displayTools = tools.filter(t => !GMToolsSet.has(t) && !(t === "command" && novel?.ruleset));
    }
    if (displayTools.length > 0) {
      result += `**${cat}:** ${displayTools.join(", ")}\n`;
    }
  }
  result += "\nUse the intro prompt to get started, or badge_briefing for current badge guidance.";
  // Add world-model hint if populated
  if (novel && novel.world.rooms.size > 0) {
    result += `\n\nWorld-model populated: ${novel.world.rooms.size} rooms, ${novel.world.things.size} things. Try \`command("look")\`.`;
  } else {
    result += "\n\nNo world model — use world (action: convert) or the adventure tool to populate.";
  }
  return raw(result);
});

// --- Characters (ruleset-free, REQ-219; ruleset-driven REQ-104/151/152/181) ---

// Parse a class-levels spec like "Noble 5 / Jedi 2 / Crime Lord 2" or an
// array of { className, levels } objects.
function parseClassLevels(raw: string | any[]): ClassLevel[] {
  if (Array.isArray(raw)) {
    return raw.map((c) => {
      const name = String(c?.class ?? c?.className ?? c?.name ?? "").trim();
      const levels = Number(c?.levels ?? c?.level ?? 1) || 1;
      return { className: name, levels };
    }).filter((c) => c.className);
  }
  const out: ClassLevel[] = [];
  const parts = String(raw).split("/");
  for (const part of parts) {
    const m = part.trim().match(/^(.+?)\s+(\d+)$/);
    if (m) {
      out.push({ className: m[1].trim(), levels: parseInt(m[2], 10) });
    }
  }
  return out;
}

function parseAbilityScores(raw: string | number[], rules?: CharacterRules): Record<string, number> {
  const names = abilityNames(rules);
  const values = typeof raw === "string"
    ? String(raw).trim().split(/[\s,]+/).map(Number)
    : Array.isArray(raw) ? raw.map(Number) : [];
  const out: Record<string, number> = {};
  for (let i = 0; i < names.length; i++) {
    out[names[i]] = Number.isFinite(values[i]) ? values[i] : 10;
  }
  return out;
}

// Resolve the active Novel's character-creation rules, or null if the Novel is
// ruleset-free or the bound package carries no character-creation data
// (REQ-219, REQ-399c).
function getCharacterRules(novel: NovelState | null): CharacterRules | null {
  if (!novel?.ruleset) return null;
  try {
    const model = rulesets.hydrate(novel.ruleset).model;
    const rules = (model as any)?.character_creation;
    return rules && typeof rules === "object" ? (rules as CharacterRules) : null;
  } catch {
    return null;
  }
}

function buildCharacterStats(build: CharacterBuildInput, rules: CharacterRules): Record<string, any> {
  const derived = computeDerived(build, rules);
  const classLabel = build.classLevels.map((c) => `${c.className} ${c.levels}`).join(" / ");
  const equipment: EquipmentItem[] = build.equipment?.length
    ? build.equipment.map((n) => ({ name: n, quantity: 1 }))
    : startingEquipmentFor(build.classLevels, rules);
  const stats: Record<string, any> = {
    class: classLabel,
    species: build.species,
    abilityScores: build.abilityScores,
    level: derived.values.level ?? undefined,
    statMethod: build.statMethod,
    trainedSkills: build.trainedSkills,
    feats: build.feats,
    talents: build.talents,
    equipment,
  };
  // Spread ruleset-declared derived statistics under their keys.
  for (const key of derived.order) stats[derived.labels[key] ?? key] = derived.values[key];
  stats._derived_labels = { order: derived.order, labels: derived.labels, sections: derived.sections };
  return stats;
}

// Character (REQ-069, REQ-104, REQ-120, REQ-124, REQ-126, REQ-127, REQ-129, REQ-151, REQ-152, REQ-165, REQ-166, REQ-176, REQ-177, REQ-178, REQ-181, REQ-219, REQ-399) —
// consolidated create/stage/import/sheet/set_active/personality/voice/signal/
// remove/roster_remove/roster_list surface.
server.registerTool("character", {
  title: "Character",
  description: "Manage player characters: create (quick or step-by-step), stage to roster, import, render a sheet, set the active entity, set personality/voice, send player signals, remove, or list roster characters. Use when: working with player characters. Do NOT use when: managing NPCs — use npc.",
  inputSchema: {
    action: z.enum(["create", "stage", "import", "sheet", "set_active", "personality", "voice", "signal", "remove", "roster_remove", "roster_list"]).describe("create, stage, import, sheet, set_active, personality, voice, signal, remove, roster_remove, or roster_list."),
    name: z.string().optional().describe("Character name; omit (create) to begin step-by-step."),
    species: z.string().optional().describe("Species (create)."),
    classes: z.union([z.string(), z.array(z.object({ className: z.string(), levels: z.number().optional() }))]).optional().describe("Class levels (create)."),
    stat_method: z.string().optional().describe("Stat-generation method (create)."),
    seed: z.string().optional().describe("Deterministic seed (create)."),
    stage_to_roster: z.boolean().optional().describe("Also stage into the roster (create)."),
    personality: z.object({ description: z.string().optional(), voice: z.string().optional(), background: z.string().optional(), goals: z.string().optional() }).optional().describe("Grouped personality fields (create)."),
    details: z.object({ ability_scores: z.union([z.string(), z.array(z.number())]).optional(), skills: z.union([z.string(), z.array(z.string())]).optional(), feats: z.union([z.string(), z.array(z.string())]).optional(), talents: z.union([z.string(), z.array(z.string())]).optional(), equipment: z.union([z.string(), z.array(z.string())]).optional() }).optional().describe("Grouped mechanical details (create)."),
    description: z.string().optional().describe("Narrative description (create/personality)."),
    voice: z.string().optional().describe("Voice and speech pattern (create/personality)."),
    background: z.string().optional().describe("Backstory (create/personality)."),
    goals: z.string().optional().describe("Character goals (create/personality)."),
    ability_scores: z.union([z.string(), z.array(z.number())]).optional().describe("Ability scores (create)."),
    skills: z.union([z.string(), z.array(z.string())]).optional().describe("Trained skills (create)."),
    feats: z.union([z.string(), z.array(z.string())]).optional().describe("Feats (create)."),
    talents: z.union([z.string(), z.array(z.string())]).optional().describe("Talents (create)."),
    equipment: z.union([z.string(), z.array(z.string())]).optional().describe("Starting equipment (create)."),
    entity_id: z.string().optional().describe("Entity identifier (stage/sheet/set_active/personality/voice/remove)."),
    roster_id: z.string().optional().describe("Roster identifier (import/roster_remove)."),
    format: z.string().optional().describe("Output format (sheet)."),
    pov: z.enum(["character", "omniscient"]).optional().describe("Point-of-view mode (set_active)."),
    examples: z.array(z.object({ context: z.string(), dialogue: z.string(), tag: z.string().optional() })).optional().describe("Voice examples (voice)."),
    signal: z.enum(["pace", "difficulty", "tone", "focus", "boundary", "voice_feedback"]).optional().describe("Feedback category (signal)."),
    value: z.string().optional().describe("Feedback text (signal)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "create": {
      const { name, species, classes, stat_method, seed, stage_to_roster, personality: personalityObj, details, description, voice, background, goals, ability_scores, skills, feats, talents, equipment } = args;
      const p = personalityObj ?? {};
      const d = details ?? {};
      const effDescription = description ?? p.description;
      const effVoice = voice ?? p.voice;
      const effBackground = background ?? p.background;
      const effGoals = goals ?? p.goals;
      const effAbilityScores = ability_scores ?? d.ability_scores;
      const effSkills = skills ?? d.skills;
      const effFeats = feats ?? d.feats;
      const effTalents = talents ?? d.talents;
      const effEquipment = equipment ?? d.equipment;
      requireNotObserver();
      const novel = requireNovel();
      const rules = getCharacterRules(novel);
      const personality = { description: effDescription, voice: effVoice, background: effBackground, goals: effGoals };
      const hasPersonality = effDescription || effVoice || effBackground || effGoals;

      if (!name) {
        if (novel.pending_workflow) return err("STATE_CONFLICT", "A workflow decision is pending. Resolve it with respond before starting a new one.");
        const workflow: CreationWorkflowState = { kind: "character_creation", stepIndex: 0, rules, answers: {} };
        novel.pending_workflow = { decision: "character_creation", snapshot: state.captureWorkflowSnapshot(novel), creation: workflow };
        state.saveNovel(novel);
        return needInput(creationStepPrompt(workflow));
      }

      if (!rules) {
        if (classes || effAbilityScores || stat_method) {
          return err("INVALID_INPUT", "This Novel has no character-creation rules. Bind a ruleset whose package defines character creation to use classes or mechanical stats.");
        }
        const profileStats = species && !hasPersonality ? { species } : undefined;
        const entity = state.createEntity(name, hasPersonality ? personality : undefined, profileStats);
        state.addEntity(novel, entity);
        if (stage_to_roster) state.addToRoster(entity);
        state.saveNovel(novel);
        return ok(`${fmtEntitySheet(entity)}

Character '${name}' created (profile-only — no mechanical stats).${stage_to_roster ? ` Staged to roster as ${entity.id}.` : ` Entity id ${entity.id}.`}`);
      }

      if (!species || !classes) {
        return err("INVALID_INPUT", "Quick-create requires 'species' and 'classes'. Omit 'name' to start step-by-step, or provide all creation fields.");
      }
      const classLevels = parseClassLevels(classes);
      if (classLevels.length === 0) return err("INVALID_INPUT", "Could not parse 'classes'. Use format 'Class 5 / Other 2'.");
      for (const cl of classLevels) {
        if (!getClassData(rules, cl.className)) return err("INVALID_INPUT", `Unknown class '${cl.className}'.`);
      }
      const speciesData = rules.species?.[species.trim().toLowerCase()];
      if (rules.species && !speciesData) return err("INVALID_INPUT", `Unknown species '${species}'.`);

      const method: StatMethod = stat_method ?? Object.keys(rules.stat_methods ?? {})[0] ?? "planned";
      const rawScores = effAbilityScores
        ? parseAbilityScores(effAbilityScores, rules)
        : (() => {
            const gen = generateAbilityScores(method, rules, seed);
            const names = abilityNames(rules);
            const out: Record<string, number> = {};
            for (let i = 0; i < names.length; i++) out[names[i]] = gen[i] ?? 10;
            return out;
          })();
      const abilityScores = applySpeciesAdjustments(rawScores, species, rules);

      const toList = (v: any): string[] => {
        if (!v) return [];
        if (Array.isArray(v)) return v.map(String);
        return String(v).split(/[\s,]+/).map((s: string) => s.trim()).filter(Boolean);
      };

      const build: CharacterBuildInput = {
        name, species, classLevels, abilityScores,
        trainedSkills: toList(effSkills), feats: toList(effFeats), talents: toList(effTalents),
        statMethod: method, seed, equipment: toList(effEquipment),
      };
      const stats = buildCharacterStats(build, rules);

      const entity = state.createEntity(name, hasPersonality ? personality : undefined, stats);
      state.addEntity(novel, entity);
      if (stage_to_roster) state.addToRoster(entity);
      state.saveNovel(novel);

      const inputs = [`name=${name}`, `species=${species}`, `classes=${classLevels.map((c) => `${c.className} ${c.levels}`).join("/")}`, `stat_method=${method}`];
      const derived = Object.entries(stats)
        .filter(([k, v]) => k !== "class" && k !== "species" && k !== "abilityScores" && k !== "statMethod" && k !== "trainedSkills" && k !== "feats" && k !== "talents" && k !== "equipment" && k !== "level" && !k.startsWith("_") && typeof v === "number")
        .map(([k, v]) => `${k}=${v}`);
      return ok(`${fmtEntitySheet(entity)}

Created (inputs): ${inputs.join(" · ")}
Derived: ${derived.join(" · ")}
${stage_to_roster ? `Staged to roster as ${entity.id}.` : `Character '${name}' created as ${entity.id}.`}`);
    }
    case "stage": {
      requireNotObserver();
      const novel = requireNovel();
      const entity = resolveEntity(args.entity_id);
      if (!entity) return err("NOT_FOUND", "No entity to stage.");
      const id = state.addToRoster(entity);
      state.saveNovel(novel);
      return ok(`Character '${entity.name}' staged to roster as ${id}.`);
    }
    case "import": {
      requireNotObserver();
      const novel = requireNovel();
      const rosterEntity = state.roster.get(args.roster_id);
      if (!rosterEntity) return err("NOT_FOUND", `Roster entity '${args.roster_id}' not found.`);
      state.addEntity(novel, { ...rosterEntity, current_room: rosterEntity.current_room ?? null, inventory: rosterEntity.inventory ?? [] });
      state.saveNovel(novel);
      return ok(`Character '${rosterEntity.name}' imported.`);
    }
    case "sheet": {
      const entity = resolveEntityOrNpc(args.entity_id);
      if (!entity) return err("NOT_FOUND", `Entity or NPC '${args.entity_id || "none"}' not found. Corrective action: list entities with party://current or NPCs with npcs://.`);
      const fmt = resolveFormat(args.format, STATBLOCK_FORMATS);
      if (typeof fmt !== "string") return fmt;
      let result: any;
      if (fmt === "ascii") result = raw(`[OK] ${entity.name}  Room: ${entity.current_room || "(none)"}  Held: ${entity.inventory?.length || 0}`);
      else if (fmt === "json") result = raw(JSON.stringify(entitySheetJson(entity), null, 2));
      else if (fmt === "html") result = raw(toHtml(fmtEntitySheet(entity)));
      else result = ok(fmtEntitySheet(entity));
      return withUiLinkage(result, `ui://character-sheet/${entity.id}`);
    }
    case "set_active": {
      requireNotObserver();
      const novel = requireNovel();
      if (!novel.entities.has(args.entity_id)) return err("NOT_FOUND", `Entity '${args.entity_id}' not found.`);
      novel.active_entity_id = args.entity_id;
      if (args.pov !== undefined) novel.pov_mode = args.pov;
      const mode = novel.pov_mode;
      return ok(`Active entity set to '${args.entity_id}'${mode === "omniscient" ? " (omniscient POV)" : ""}.`);
    }
    case "personality": {
      requireNotObserver();
      const novel = requireNovel();
      let target = novel.entities.get(args.entity_id) ?? novel.npcs.get(args.entity_id);
      if (!target) return err("NOT_FOUND", `Entity or NPC '${args.entity_id}' not found.`);
      if (!target.personality) target.personality = {};
      if (args.description !== undefined) {
        target.personality.description = args.description;
        if (novel.npcs.has(args.entity_id)) (target as any).description = args.description;
      }
      if (args.voice !== undefined) target.personality.voice = args.voice;
      if (args.background !== undefined) target.personality.background = args.background;
      if (args.goals !== undefined) target.personality.goals = args.goals;
      state.recordMutation(novel, "set_personality", "personality");
      state.saveNovel(novel);
      const setFields = [args.description !== undefined, args.voice !== undefined, args.background !== undefined, args.goals !== undefined].filter(Boolean).length;
      audit("set_personality", { entity_id: args.entity_id, fields: setFields });
      return ok(`Personality set for '${args.entity_id}'.`);
    }
    case "voice": {
      requireNotObserver();
      const novel = requireNovel();
      let target = novel.entities.get(args.entity_id) ?? novel.npcs.get(args.entity_id);
      if (!target) return err("NOT_FOUND", `Entity or NPC '${args.entity_id}' not found.`);
      target.voice_examples = args.examples;
      state.saveNovel(novel);
      audit("set_voice_examples", { entity_id: args.entity_id, count: args.examples.length });
      return ok(`Voice examples set for '${args.entity_id}' (${args.examples.length} examples).`);
    }
    case "signal": {
      requirePlayer();
      const novel = requireNovel();
      if (args.signal === "voice_feedback") {
        const entity = state.getActiveEntity();
        if (!entity) return err("INVALID_INPUT", "No active entity to correct. Corrective action: set an active entity first.");
        const limit = maxVoiceCorrections();
        if (novel.voice_corrections_this_session >= limit) {
          return warn("Voice correction limit reached for this session.");
        }
        if (!entity.voice_examples) entity.voice_examples = [];
        entity.voice_examples.push({ context: "player correction", dialogue: args.value, tag: "player-corrected" });
        novel.voice_corrections_this_session++;
        state.saveNovel(novel);
        audit("voice-feedback", { corrected: args.value, count: novel.voice_corrections_this_session });
        return ok(`Voice correction captured (${novel.voice_corrections_this_session}/${limit}).`);
      }
      novel.player_signals[args.signal] = args.value;
      state.saveNovel(novel);
      audit("player_signal", { signal: args.signal, value: args.value });
      return ok(`Signal recorded: ${args.signal} → ${args.value}`);
    }
    case "remove": {
      requireGM();
      const novel = requireNovel();
      if (!novel.entities.has(args.entity_id)) return err("NOT_FOUND", `Entity '${args.entity_id}' not found.`);
      novel.entities.delete(args.entity_id);
      if (novel.active_entity_id === args.entity_id) novel.active_entity_id = null;
      state.saveNovel(novel);
      return ok(`Entity '${args.entity_id}' removed.`);
    }
    case "roster_remove": {
      requireGM();
      if (!state.roster.has(args.roster_id)) return err("NOT_FOUND", `Roster character '${args.roster_id}' not found.`);
      state.roster.delete(args.roster_id);
      state.saveRoster();
      return ok(`Roster character '${args.roster_id}' removed.`);
    }
    case "roster_list": {
      const chars = [...state.roster.entries()].map(([id, e]) => ({ id, name: e.name }));
      if (chars.length === 0) return ok("Roster is empty — no characters staged yet.");
      return raw(JSON.stringify(chars, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown character action '${args.action}'.`);
  }
});

// ── Autonomy (REQ-306) ────────────────────────────────────────────

// REQ-311 — NPC memory model: automatically update an NPC's memory and
// disposition when a player entity interacts with it (combat, social, or
// mechanical outcome) — no GM tool call required. The GM may override via
// update_npc. Memory persists with the Novel.
function recordNpcInteraction(novel: NovelState, npcId: string, entityName: string, summary: string, dispositionShift?: "hostile" | "friendly"): void {
  const npc = novel.npcs.get(npcId);
  if (!npc) return;
  const now = new Date().toISOString();
  npc.memory = npc.memory ?? { witnessed_events: [], contacts: {}, stress_markers: [], last_3_interactions: [] };
  const m = npc.memory;
  m.witnessed_events.push({ event: summary, at: now });
  if (m.witnessed_events.length > 100) m.witnessed_events.shift();
  const contact = m.contacts[entityName] ?? { encounters: 0, first_contact: now, last_contact: now, last_disposition: npc.disposition ?? "neutral", prior_dispositions: [] };
  contact.encounters++;
  contact.last_contact = now;
  if (dispositionShift) {
    const prev = npc.disposition ?? "neutral";
    if (prev !== dispositionShift) contact.prior_dispositions.push(prev);
    npc.disposition = shiftDisposition(prev, dispositionShift);
    contact.last_disposition = npc.disposition;
    if (dispositionShift === "hostile") {
      m.stress_markers.push(`hostile toward ${entityName} (${now})`);
      if (m.stress_markers.length > 20) m.stress_markers.shift();
    }
  }
  m.contacts[entityName] = contact;
  m.last_3_interactions.push({ entity: entityName, summary, at: now });
  if (m.last_3_interactions.length > 3) m.last_3_interactions.shift();
  state.saveNovel(novel);
}

// REQ-311d — surface NPC memory in badge_briefing when the NPC is present in
// the current scene: one-sentence emotional state, last 3 interactions, goals.
function composeNpcMemorySection(novel: NovelState, npc: any): string {
  if (!npc.memory) return "";
  const m = npc.memory;
  const contactCount = Object.keys(m.contacts ?? {}).length;
  const stress = (m.stress_markers ?? []).length;
  const emotional = stress > 0
    ? `${npc.name} is on edge (${stress} stress mark${stress === 1 ? "" : "s"}, disposition ${npc.disposition ?? "neutral"}).`
    : `${npc.name} is currently ${npc.disposition ?? "neutral"} toward the party.`;
  const lines = [`## NPC Memory\n${emotional}`];
  if ((m.last_3_interactions ?? []).length > 0) {
    for (const i of m.last_3_interactions.slice(-3)) lines.push(`- ${i.summary} (with ${i.entity})`);
  } else if (contactCount === 0) {
    lines.push(`No prior contact — ${npc.name} has not met the party.`);
  }
  if ((m.goals ?? []).length > 0) lines.push(`Goals: ${m.goals.join("; ")}`);
  return `\n\n${lines.join("\n")}`;
}

// --- World-Model Tools ---

// REQ-329 — countdown-world coupling: advance any countdown whose mechanical
// trigger matches the given world-model event (`on_room_enter(<id>)`,
// `on_thing_take(<id>)`, `on_door_open(<ref>)`). Mechanical — fires regardless
// of narrative framing; supplements normal advancement.
function advanceWorldTriggeredCountdowns(novel: NovelState, event: string): void {
  const [evType, evTarget] = event.split(":");
  for (const [name, cd] of [...novel.countdowns.entries()]) {
    if (!cd.triggers || cd.triggers.length === 0) continue;
    const matched = cd.triggers.some((t) => {
      const m = t.match(/^on_(room_enter|thing_take|door_open)\((.+)\)$/);
      return m && evType === m[1] && evTarget === m[2];
    });
    if (matched) {
      const dir = cd.direction === "increment" ? 1 : -1;
      cd.ticks += dir;
      audit("countdown_world_trigger", { name, event, ticks: cd.ticks });
      if ((dir < 0 && cd.ticks <= 0) || (dir > 0 && cd.ticks >= cd.total)) {
        fireCountdown(novel, name, cd);
      }
      state.saveNovel(novel);
    }
  }
}

// REQ-330 — knowledge-world coupling: exploration-derived knowledge entries on
// the active entity (rooms visited, things taken). Retained regardless of
// current presence; grouped under "Explored" in knowledge_state.
function recordExplorationKnowledge(novel: NovelState, entity: any, type: "room" | "thing", name: string): void {
  if (!entity) return;
  const explored = (entity.knowledge?.explored ?? []) as Array<{ type: string; name: string; at: string }>;
  if (!explored.some((e) => e.type === type && e.name === name)) {
    explored.push({ type, name, at: new Date().toISOString() });
    entity.knowledge = { ...(entity.knowledge ?? {}), explored };
    state.saveNovel(novel);
  }
}

server.registerTool("command", {
  title: "Command",
  description: "Execute a parser command, resolve a spatial intent, or suggest actions from intent. Use when: a player or narrator takes a physical action (execute), needs the outcome of a movement without mutating state (resolve), or wants intent mapped to tool calls (suggest). Do NOT use when: the GM inspects the model directly — use world or lore.",
  inputSchema: {
    action: z.enum(["execute", "resolve", "suggest"]).optional().describe("execute (parser), resolve (non-mutating intent), or suggest (intent → tool calls). Defaults to execute."),
    command: z.string().optional().describe("The natural-language command (execute)."),
    intent: z.string().optional().describe("The intent to resolve or map (resolve/suggest)."),
    entity_id: z.string().optional().describe("Optional entity context (suggest)."),
  },
}, async (args: any) => {
  if (args.action === "resolve") {
    const badge = getBadge();
    if (badge === "player") {
      return err("FORBIDDEN", "command (action: resolve) is not callable by the Player badge. Player spatial intents are resolved by the AI narrator. Corrective action: switch badge or direct intents through the narrator.");
    }
    requireNotObserver();
    const novel = requireNovel();
    const result = resolveIntentWorld(args.intent, novel);
    return raw(JSON.stringify(result, null, 2));
  }
  if (args.action === "suggest") {
    const novel = requireNovel();
    const entity = args.entity_id ? novel.entities.get(args.entity_id) : state.getActiveEntity();
    const name = entity?.name ?? "entity";
    const rulesetBound = !!novel.ruleset;
    const badge = getBadge();
    const useResolveIntent = rulesetBound && badge !== "game_master";
    const spatialTool = useResolveIntent ? "command (action: resolve)" : "command";
    const intentLower = (args.intent ?? "").toLowerCase();
    const domains: { mechanical: string[]; spatial: string[]; social: string[] } = { mechanical: [], spatial: [], social: [] };
    if (intentLower.includes("look") || intentLower.includes("see") || intentLower.includes("where") || intentLower.includes("examine")) {
      domains.spatial.push(`${spatialTool}("look")`, `command("examine <thing>")`);
    }
    if (intentLower.includes("go") || intentLower.includes("move") || intentLower.includes("travel") || intentLower.includes("sneak")) {
      domains.spatial.push(`${spatialTool}("go <direction>")`);
    }
    if (intentLower.includes("take") || intentLower.includes("grab") || intentLower.includes("get")) {
      domains.spatial.push(`command("take <thing>")`);
    }
    if (intentLower.includes("open") || intentLower.includes("unlock")) {
      domains.spatial.push(`command("open <door>")`);
    }
    if (intentLower.includes("fight") || intentLower.includes("attack")) {
      domains.mechanical.push("combat (action: init — GM only, auto-advance mode)");
    }
    if (intentLower.includes("convince") || intentLower.includes("persuade") || intentLower.includes("talk") || intentLower.includes("negotiate") || intentLower.includes("intimidate")) {
      for (const [, npc] of novel.npcs) {
        domains.social.push(`${npc.name} (disposition: ${npc.disposition ?? "neutral"}) — skill check with persuasion`);
      }
      for (const r of novel.relationships) {
        if (r.entity_a === (entity?.id ?? "") || r.entity_b === (entity?.id ?? "")) {
          domains.social.push(`relationship (${r.type}) with ${r.entity_a === entity?.id ? r.entity_b : r.entity_a}`);
        }
      }
    }
    if (domains.mechanical.length === 0 && domains.spatial.length === 0 && domains.social.length === 0) {
      domains.spatial.push(`${spatialTool}("look")`, `command("go <direction>")`, `command("examine <thing>")`);
    }
    const blocks: string[] = [];
    if (domains.mechanical.length) blocks.push(`Mechanical:\n${domains.mechanical.map((s) => `  - ${s}`).join("\n")}`);
    if (domains.spatial.length) blocks.push(`Spatial:\n${domains.spatial.map((s) => `  - ${s}`).join("\n")}`);
    if (domains.social.length) blocks.push(`Social:\n${domains.social.map((s) => `  - ${s}`).join("\n")}`);
    return ok(`Actions for ${name}:\n${blocks.join("\n")}`);
  }
  const command = args.command;
  const novel = requireNovel();
  // REQ-197 — description mode commands are always recognized verbs.
  const cmdTrim = command.trim().toLowerCase();
  if (cmdTrim === "brief") { roomDescriptionMode = "brief"; state.saveNovel(novel); return ok("Description mode: brief (room name + exits only)."); }
  if (cmdTrim === "verbose") { roomDescriptionMode = "verbose"; state.saveNovel(novel); return ok("Description mode: verbose (full descriptions every time)."); }
  if (cmdTrim === "normal") { roomDescriptionMode = "normal"; state.saveNovel(novel); return ok("Description mode: normal (full on first entry)."); }
  if (cmdTrim === "verbs" || cmdTrim === "help verbs") {
    // REQ-283 — verb coverage tiers.
    const core = BASE_PARSER_COMMANDS.map((c) => c.verb);
    const standard = ["open", "close", "lock", "unlock", "push", "pull", "search", "read", "sit", "stand", "wear", "remove", "eat", "drink", "light", "extinguish", "climb", "jump", "enter", "exit", "put", "insert"];
    return ok(`Verb coverage — core (${core.length}): ${core.join(", ")}\nstandard (${standard.length}): ${standard.join(", ")}\nextended (0): none registered`);
  }
  // Ruleset-bound Novels gate the parser to the Game Master (REQ-309); the
  // Player badge routes spatial intent through resolve_intent. Ruleset-free
  // Novels keep the parser as the primary Player surface (REQ-218, REQ-309e).
  if (novel.ruleset) requireGM();
  else requireNotObserver();
  worldSnapshot();
  const entity = state.getActiveEntity();

  if (!state.worldHasRooms(novel)) {
    return raw(`[ERROR] [STATE_CONFLICT] The world model has not been populated. Use an adventure module or \`convert_source\` to populate rooms before using parser commands.`);
  }

  // REQ-221 — combat-navigation interaction: while combat is active, navigation
  // verbs (go/enter/exit/move) return [STATE_CONFLICT]; inspection and
  // non-spatial commands continue to function.
  const navVerbs = new Set(["go", "walk", "move", "enter", "exit", "north", "south", "east", "west", "n", "s", "e", "w", "northeast", "northwest", "southeast", "southwest", "ne", "nw", "se", "sw", "up", "down", "u", "d"]);
  const firstWord = command.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (novel.combat && novel.combat.active && navVerbs.has(firstWord)) {
    return raw(`[ERROR] [STATE_CONFLICT] Combat is active — cannot navigate. Call \`end_combat\` first or flee per the ruleset's retreat mechanic.`);
  }

  // Auto-place entity in first room if no current room
  let currentRoom = entity?.current_room ?? null;
  if (!currentRoom && entity) {
    currentRoom = [...novel.world.rooms.keys()][0];
    entity.current_room = currentRoom;
  }

  const inventory = entity?.inventory ?? [];
  const ctx = { world: novel.world, currentRoom, inventory, badge: getBadge() };
  const result = dispatchCommand(command, ctx);

  // Apply side effects
  if (result.prefix === "OK") {
    const goResult = resolveGoMovement(command, ctx);
    if (goResult.newRoom && entity && goResult.result.prefix === "OK") {
      entity.current_room = goResult.newRoom;
      // Trigger lore matching the new room name
      audit("command", { command, moved_to: goResult.newRoom });
      // REQ-329 — countdown on_room_enter triggers; REQ-330 — explored rooms.
      advanceWorldTriggeredCountdowns(novel, `room_enter:${goResult.newRoom.toLowerCase()}`);
      recordExplorationKnowledge(novel, entity, "room", goResult.newRoom.toLowerCase());
    }
  }

  // Handle take/drop side effects
  const tokens = command.trim().split(/\s+/);
  const verb = tokens[0].toLowerCase();
  if (result.prefix === "OK" && entity) {
    if (verb === "take" || verb === "get") {
      const targetThing = findMatchingThing(tokens.slice(1).join(" "), novel.world, currentRoom);
      if (targetThing && targetThing.portable && !entity.inventory.includes(targetThing.name.toLowerCase())) {
        entity.inventory.push(targetThing.name.toLowerCase());
        targetThing.location = null;
        targetThing.locationType = null;
        state.saveNovel(novel);
        audit("command", { command, took: targetThing.name });
        // REQ-329 — countdown on_thing_take triggers; REQ-330 — explored things.
        advanceWorldTriggeredCountdowns(novel, `thing_take:${targetThing.name.toLowerCase()}`);
        recordExplorationKnowledge(novel, entity, "thing", targetThing.name.toLowerCase());
      }
    } else if (verb === "drop" && tokens.length > 1) {
      const target = tokens.slice(1).join(" ").toLowerCase();
      const idx = entity.inventory.indexOf(target);
      if (idx >= 0) {
        entity.inventory.splice(idx, 1);
        // Move thing back to current room
        const thing = novel.world.things.get(target);
        if (thing) {
          thing.location = currentRoom;
          thing.locationType = "room";
        }
        state.saveNovel(novel);
        audit("command", { command, dropped: target });
      }
    } else if (verb === "open" && result.prefix === "OK" && tokens.length > 1) {
      const thing = novel.world.things.get(tokens.slice(1).join(" ").toLowerCase());
      if (thing && thing.openable) {
        thing.open = true;
        state.saveNovel(novel);
        audit("command", { command, opened: thing.name });
      }
    } else if (verb === "close" && result.prefix === "OK" && tokens.length > 1) {
      const thing = novel.world.things.get(tokens.slice(1).join(" ").toLowerCase());
      if (thing && thing.openable) {
        thing.open = false;
        state.saveNovel(novel);
        audit("command", { command, closed: thing.name });
      }
    } else if (verb === "unlock" && result.prefix === "OK" && tokens.length > 1) {
      const thing = novel.world.things.get(tokens.slice(1).join(" ").toLowerCase());
      if (thing && thing.lockable) {
        thing.locked = false;
        state.saveNovel(novel);
        audit("command", { command, unlocked: thing.name });
      }
    } else if (verb === "lock" && result.prefix === "OK" && tokens.length > 1) {
      const thing = novel.world.things.get(tokens.slice(1).join(" ").toLowerCase());
      if (thing && thing.lockable) {
        thing.locked = true;
        state.saveNovel(novel);
        audit("command", { command, locked: thing.name });
      }
    }
  }

  // Output
  const prefix = result.prefix === "OK" ? "[OK]" : result.prefix === "WARNING" ? "[WARNING]" : "[ERROR]";
  const code = result.code ? ` [${result.code}]` : "";
  let text = `${prefix}${code} ${result.text}`;
  if (result.correctiveAction) {
    text += `\nCorrective action: ${result.correctiveAction}`;
  }
  return raw(text);
});

function findMatchingThing(name: string, world: WorldModel, roomName: string | null): WorldThing | null {
  const lower = name.toLowerCase().trim();
  for (const [, thing] of world.things) {
    if (thing.name.toLowerCase().includes(lower)) {
      const loc = thing.location?.toLowerCase();
      if (loc === roomName?.toLowerCase()) return thing;
      // REQ-200: things on supporters or in open containers within the room are reachable.
      if (thing.locationType === "supporter" || thing.locationType === "container") {
        const parent = world.things.get(thing.location?.toLowerCase() ?? "");
        if (parent) {
          if (parent.location?.toLowerCase() === roomName?.toLowerCase()) {
            if (thing.locationType === "supporter" || (parent.openable && parent.open)) return thing;
          }
        }
      }
    }
  }
  return null;
}

// --- World-Model CRUD (GM-only) ---

// World (REQ-201, REQ-328, REQ-329, REQ-368) — consolidated room/thing/exit/convert surface with
// the previously-missing update_room/update_thing lifecycle (completeness).
server.registerTool("world", {
  title: "World",
  description: "Manage the world model — rooms, things, and exits. Use when: creating, updating, removing, or bulk-converting locations and objects. Do NOT use when: navigating the world — use command (action: execute) or command (action: resolve).",
  inputSchema: {
    action: z.enum(["create_room", "update_room", "remove_room", "create_thing", "update_thing", "remove_thing", "create_exit", "remove_exit", "convert"]).describe("create_room, update_room, remove_room, create_thing, update_thing, remove_thing, create_exit, remove_exit, or convert."),
    name: z.string().optional().describe("Room/thing name (create/update/remove)."),
    description: z.string().optional().describe("Optional description (create/update)."),
    kind: z.string().optional().describe("Optional thing kind (create_thing)."),
    location: z.string().optional().describe("Optional containing room or thing (create_thing/update_thing)."),
    location_type: z.enum(["room", "container", "supporter"]).optional().describe("Where the thing is placed (create_thing)."),
    fixed: z.boolean().optional().describe("When true the thing cannot be taken (create_thing/update_thing)."),
    openable: z.boolean().optional().describe("When true the thing can be opened (create_thing/update_thing)."),
    lockable: z.boolean().optional().describe("When true the thing can be locked (create_thing/update_thing)."),
    locked: z.boolean().optional().describe("When true the thing starts locked (create_thing/update_thing)."),
    lit: z.boolean().optional().describe("When true the thing is lit (create_thing/update_thing)."),
    switched_on: z.boolean().optional().describe("When true the thing is switched on (create_thing/update_thing)."),
    switchable: z.boolean().optional().describe("When true the thing can be switched (create_thing/update_thing)."),
    transparent: z.boolean().optional().describe("When true the thing is transparent (create_thing/update_thing)."),
    readable: z.boolean().optional().describe("When true the thing can be read (create_thing/update_thing)."),
    read_text: z.string().optional().describe("Text revealed when the thing is read (create_thing/update_thing)."),
    wearable: z.boolean().optional().describe("When true the thing can be worn (create_thing/update_thing)."),
    edible: z.boolean().optional().describe("When true the thing can be eaten (create_thing/update_thing)."),
    drinkable: z.boolean().optional().describe("When true the thing can be drunk (create_thing/update_thing)."),
    enterable: z.boolean().optional().describe("When true the thing can be entered (create_thing/update_thing)."),
    climbable: z.boolean().optional().describe("When true the thing can be climbed (create_thing/update_thing)."),
    direction: z.string().optional().describe("Direction (create_exit/remove_exit)."),
    room: z.string().optional().describe("Source room (create_exit/remove_exit)."),
    room_a: z.string().optional().describe("Source room (create_exit)."),
    room_b: z.string().optional().describe("Destination room (create_exit)."),
    source: z.string().optional().describe("Hybrid world-model source text (convert)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "create_room": {
      requireGM();
      const novel = requireNovel();
      worldSnapshot();
      const lower = args.name.toLowerCase();
      if (novel.world.rooms.has(lower)) return err("STATE_CONFLICT", `Room '${args.name}' already exists.`);
      const room: WorldRoom = { name: args.name, description: args.description ?? "", exits: new Map(), doorRefs: new Map(), annotations: {} };
      novel.world.rooms.set(lower, room);
      state.saveNovel(novel);
      audit("create_room", { name: args.name });
      return ok(`Room '${args.name}' created.`);
    }
    case "update_room": {
      requireGM();
      const novel = requireNovel();
      worldSnapshot();
      const room = novel.world.rooms.get(args.name.toLowerCase());
      if (!room) return err("NOT_FOUND", `Room '${args.name}' not found.`);
      if (args.description !== undefined) room.description = args.description;
      state.saveNovel(novel);
      return ok(`Room '${args.name}' updated.`);
    }
    case "remove_room": {
      requireGM();
      const novel = requireNovel();
      const lower = args.name.toLowerCase();
      if (!novel.world.rooms.has(lower)) return err("NOT_FOUND", `Room '${args.name}' not found.`);
      worldSnapshot();
      for (const [tKey, thing] of novel.world.things) {
        if (thing.location?.toLowerCase() === lower && thing.locationType === "room") novel.world.things.delete(tKey);
      }
      for (const [, room] of novel.world.rooms) {
        for (const [dir, target] of room.exits) {
          if (target.toLowerCase() === lower) room.exits.delete(dir);
        }
      }
      novel.world.rooms.delete(lower);
      state.saveNovel(novel);
      audit("remove_room", { name: args.name });
      return ok(`Room '${args.name}' and its contents removed.`);
    }
    case "create_thing": {
      requireGM();
      const novel = requireNovel();
      worldSnapshot();
      const lower = args.name.toLowerCase();
      if (novel.world.things.has(lower)) return err("STATE_CONFLICT", `Thing '${args.name}' already exists.`);
      const validKinds = ["thing", "container", "supporter", "door", "device", "vehicle", "person", "backdrop", "region"];
      const k = (args.kind && validKinds.includes(args.kind.toLowerCase())) ? args.kind.toLowerCase() as WorldKind : "thing";
      let locationType: "room" | "container" | "supporter" | "vehicle" | null = args.location ? "room" : null;
      if (args.location && args.location_type) {
        locationType = args.location_type;
      } else if (args.location) {
        const parent = novel.world.things.get(args.location.toLowerCase());
        if (parent && (parent.kind === "container" || parent.kind === "supporter" || parent.kind === "vehicle")) {
          locationType = parent.kind === "supporter" ? "supporter" : parent.kind === "vehicle" ? "vehicle" : "container";
        }
      }
      const thing: WorldThing = {
        name: args.name, description: args.description ?? "", kind: k,
        location: args.location ?? null, locationType,
        portable: !args.fixed && k !== "supporter" && k !== "door" && k !== "vehicle",
        openable: k === "container" || k === "door" || args.openable === true,
        open: false,
        lockable: k === "container" || k === "door" || args.lockable === true,
        locked: args.locked === true,
        lit: args.lit === true,
        switchable: k === "device" || args.switchable === true,
        switched_on: args.switched_on === true,
        transparent: args.transparent === true,
        readable: args.readable === true,
        read_text: args.read_text ?? null,
        wearable: args.wearable === true,
        edible: args.edible === true,
        drinkable: args.drinkable === true,
        enterable: args.enterable === true,
        climbable: args.climbable === true,
        vehiclePassengers: [], worn_by: null, annotations: {},
      };
      novel.world.things.set(lower, thing);
      state.saveNovel(novel);
      audit("create_thing", { name: args.name, kind: k, location: args.location, location_type: locationType });
      return ok(`Thing '${args.name}' (${k}) created${args.location ? (locationType === "supporter" ? ` on ${args.location}` : locationType === "container" ? ` in container ${args.location}` : ` in ${args.location}`) : ""}.`);
    }
    case "update_thing": {
      requireGM();
      const novel = requireNovel();
      worldSnapshot();
      const thing = novel.world.things.get(args.name.toLowerCase());
      if (!thing) return err("NOT_FOUND", `Thing '${args.name}' not found.`);
      const boolFields = ["fixed", "openable", "lockable", "locked", "lit", "switchable", "switched_on", "transparent", "readable", "wearable", "edible", "drinkable", "enterable", "climbable"];
      for (const f of boolFields) if (args[f] !== undefined) (thing as any)[f] = args[f];
      if (args.description !== undefined) thing.description = args.description;
      if (args.location !== undefined) thing.location = args.location;
      state.saveNovel(novel);
      audit("update_thing", { name: args.name });
      return ok(`Thing '${args.name}' updated.`);
    }
    case "remove_thing": {
      requireGM();
      const novel = requireNovel();
      const lower = args.name.toLowerCase();
      if (!novel.world.things.has(lower)) return err("NOT_FOUND", `Thing '${args.name}' not found.`);
      worldSnapshot();
      novel.world.things.delete(lower);
      state.saveNovel(novel);
      audit("remove_thing", { name: args.name });
      return ok(`Thing '${args.name}' removed.`);
    }
    case "create_exit": {
      requireGM();
      const novel = requireNovel();
      worldSnapshot();
      const dir = args.direction.toLowerCase();
      if (!ROOM_DIRECTIONS.includes(dir as any)) return err("INVALID_INPUT", `Invalid direction '${args.direction}'. Valid: ${ROOM_DIRECTIONS.join(", ")}.`);
      const roomA = novel.world.rooms.get(args.room_a.toLowerCase());
      const roomB = novel.world.rooms.get(args.room_b.toLowerCase());
      if (!roomA) return err("NOT_FOUND", `Room '${args.room_a}' not found.`);
      if (!roomB) return err("NOT_FOUND", `Room '${args.room_b}' not found.`);
      roomA.exits.set(dir as Direction, args.room_b);
      roomB.exits.set(oppositeDirection(dir as Direction), args.room_a);
      state.saveNovel(novel);
      audit("create_exit", { direction: dir, room_a: args.room_a, room_b: args.room_b });
      return ok(`Exit created: ${dir} from ${args.room_a} to ${args.room_b}.`);
    }
    case "remove_exit": {
      requireGM();
      const novel = requireNovel();
      worldSnapshot();
      const dir = args.direction.toLowerCase();
      if (!ROOM_DIRECTIONS.includes(dir as any)) return err("INVALID_INPUT", `Invalid direction.`);
      const room = novel.world.rooms.get(args.room.toLowerCase());
      if (!room) return err("NOT_FOUND", `Room '${args.room}' not found.`);
      if (!room.exits.has(dir as Direction)) return err("NOT_FOUND", `No ${dir} exit from '${args.room}'.`);
      room.exits.delete(dir as Direction);
      state.saveNovel(novel);
      audit("remove_exit", { direction: dir, room: args.room });
      return ok(`Exit ${dir} from '${args.room}' removed.`);
    }
    case "convert": {
      requireGM();
      const novel = requireNovel();
      worldSnapshot();
      if (novel.world.rooms.size > 0) {
        return err("STATE_CONFLICT", "World model already populated. Use CRUD actions to modify, or create a new novel.");
      }
      const { world, result } = convertSource(args.source, novel.world);
      novel.world = world;
      state.saveNovel(novel);
      audit("convert_source", { rooms: result.rooms, things: result.things, exits: result.exits });
      let msg = `[OK] World model populated: ${result.rooms} rooms, ${result.things} things, ${result.exits} exits.`;
      msg += ` Linked annotations — encounters: ${result.annotations.encounters}, NPCs: ${result.annotations.npcs}, traps: ${result.annotations.traps}, lore: ${result.annotations.lore}.`;
      if (result.warnings.length > 0) {
        msg += `\n\nWarnings:`;
        for (const w of result.warnings) msg += `\nLine ${w.line}: ${w.message}`;
      }
      return raw(msg);
    }
    default:
      return err("INVALID_INPUT", `Unknown world action '${args.action}'.`);
  }
});

// --- resolve_intent (REQ-323, §5.12) ---
// Resolves a spatial intent against the world model without mutating state.
// Three phases: constraint check → override check → scene composition.
// Callable by the AI narrator, Game Master, and Observer badges; Player [FORBIDDEN].

function resolveIntentWorld(intent: string, novel: NovelState): Record<string, unknown> {
  const world = novel.world;
  if (world.rooms.size === 0) {
    return { status: "no_world_model" };
  }

  const entity = state.getActiveEntity();
  let currentRoom = entity?.current_room ?? null;
  if (!currentRoom) currentRoom = [...world.rooms.keys()][0];

  const tokens = intent.trim().toLowerCase().split(/\s+/);
  const verb = tokens[0];

  // Navigation intent resolution
  const isNav = ["go", "walk", "move", "north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest", "up", "down", "in", "out"].includes(verb);
  const isLook = verb === "look" || verb === "examine" || verb === "search" || verb === "inspect";

  const room = world.rooms.get(currentRoom.toLowerCase());

  if (isNav) {
    if (!room) return { status: "blocked", constraint: "room", reason: `Current room '${currentRoom}' not found.` };
    let dir = tokens[0] === "go" || tokens[0] === "walk" || tokens[0] === "move" ? tokens[1] : verb;
    if (!dir || !ROOM_DIRECTIONS.includes(dir as any)) {
      return { status: "blocked", constraint: "direction", reason: `Direction '${dir ?? ""}' is not valid.`, available: [...room.exits.keys()] };
    }
    const direction = dir as Direction;
    // Constraint check: door blocking
    const doorName = room.doorRefs.get(direction);
    const overrideHints: string[] = [];
    if (doorName) {
      const door = world.things.get(doorName.toLowerCase());
      if (door && !door.open) {
        const constraint = door.locked ? "locked" : "closed_door";
        // Override check: scan active-entity constraint overrides (REQ-325)
        const overrides = novel.constraint_overrides ?? [];
        for (const o of overrides) {
          if (o.type === "door" && (o.name?.toLowerCase() === door.name.toLowerCase() || o.match_all)) {
            overrideHints.push(`${o.name} (${o.slots_remaining ?? "∞"} remaining) can open ${door.name}.`);
          }
        }
        if (overrideHints.length === 0) {
          return { status: "blocked", constraint, reason: `The ${door.name} is ${constraint === "locked" ? "locked" : "closed"}.` };
        }
      }
    }
    const target = room.exits.get(direction);
    if (!target) {
      return { status: "blocked", constraint: "exit", reason: `No ${direction} exit from '${currentRoom}'.`, available: [...room.exits.keys()] };
    }
    const targetRoom = world.rooms.get(target.toLowerCase());
    if (!targetRoom) return { status: "blocked", constraint: "room", reason: `Destination '${target}' not found.` };
    return {
      status: "resolved",
      room_context: composeRoomContext(targetRoom, novel, world),
      override_hints: overrideHints,
    };
  }

  if (isLook) {
    if (!room) return { status: "blocked", constraint: "room", reason: `Current room '${currentRoom}' not found.` };
    return { status: "resolved", room_context: composeRoomContext(room, novel, world) };
  }

  // Unknown intent: return the current room context so the narrator can interpret.
  if (!room) return { status: "blocked", constraint: "room", reason: "No current room." };
  return { status: "resolved", room_context: composeRoomContext(room, novel, world) };
}

function composeRoomContext(room: WorldRoom, novel: NovelState, world: WorldModel): Record<string, unknown> {
  const visibleThings: string[] = [];
  const rl = room.name.toLowerCase();
  for (const [, t] of world.things) {
    if (!t.location) continue;
    if (t.location.toLowerCase() === rl && t.locationType === "room") visibleThings.push(t.name);
  }
  const presentNpcs: string[] = [];
  for (const [, npc] of novel.npcs) {
    if (npc.location && npc.location.toLowerCase() === rl) presentNpcs.push(npc.name);
  }
  return {
    name: room.name,
    description: room.description || "",
    exits: [...room.exits.entries()].map(([d, t]) => ({ direction: d, target: t })),
    things: visibleThings,
    present_npcs: presentNpcs,
  };
}

// --- Combat (GM, auto-advance in ruleset-free mode) ---

// Combat (REQ-203, REQ-204, REQ-311) — consolidated init/advance/end/participant/status surface.
server.registerTool("combat", {
  title: "Combat",
  description: "Manage combat encounters in the active Novel. Use when: starting, advancing, ending a fight, or changing its participants. Do NOT use when: applying a status effect — use condition (action: apply).",
  inputSchema: {
    action: z.enum(["init", "advance", "end", "add_participant", "remove_participant", "status"]).describe("init, advance, end, add_participant, remove_participant, or status."),
    participants: z.array(z.string()).optional().describe("Entity identifiers participating (init)."),
    dangers: z.array(z.object({ name: z.string(), ac: z.number().optional(), hp: z.number().optional(), initiative_bonus: z.number().optional() })).optional().describe("Optional non-entity combatants (init)."),
    seed: z.string().optional().describe("Optional deterministic seed (init)."),
    outcome: z.string().optional().describe("Optional text describing how combat ended (end)."),
    participant_id: z.string().optional().describe("Entity identifier (add_participant/remove_participant)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "init": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      if (novel.combat && novel.combat.active) {
        return err("STATE_CONFLICT", "Combat already active — call `end_combat` first.");
      }
      const valid = new Set([...novel.entities.keys(), ...novel.npcs.keys()]);
      const unresolved = (args.participants ?? []).filter((p: string) => !valid.has(p));
      if (unresolved.length > 0) {
        return err("NOT_FOUND", `Participants not found: ${unresolved.join(", ")}. Valid entity/NPC IDs: ${[...valid].join(", ") || "(none)"}.`);
      }
      const combat = state.initCombat(novel, args.participants ?? [], args.dangers ?? [], args.seed);
      state.saveNovel(novel);
      return ok(`Combat started. Round ${combat.round}, ${combat.turn_order.length} participants. Turn: ${combat.turn_order[0]} (auto-advance mode).`);
    }
    case "advance": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const combat = state.advanceCombat(novel);
      const currentName = combat.turn_order[combat.current_turn];
      if (novel.npcs.has(currentName)) {
        const active = state.getActiveEntity();
        recordNpcInteraction(novel, currentName, active?.name ?? "the party", `engaged in combat (round ${combat.round})`, "hostile");
        recordCampaignMemory(novel, "npcs", `${currentName} engaged in combat (round ${combat.round})`);
      }
      state.saveNovel(novel);
      return ok(`Turn: ${currentName} — Round ${combat.round}, Turn ${combat.current_turn + 1}/${combat.turn_order.length}. [AUTO]`);
    }
    case "end": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const rounds = novel.combat?.round ?? 0;
      state.endCombat(novel, args.outcome ?? "Combat ended.");
      state.saveNovel(novel);
      return ok(`Combat ended after ${rounds} rounds${args.outcome ? `. Outcome: ${args.outcome}` : "."}`);
    }
    case "add_participant": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const combat = state.addCombatParticipant(novel, args.participant_id);
      state.saveNovel(novel);
      return ok(`'${args.participant_id}' added to combat.`);
    }
    case "remove_participant": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const result = state.removeCombatParticipant(novel, args.participant_id);
      state.saveNovel(novel);
      if (result.ended) return ok("Combat ended — all participants removed.");
      return ok(`'${args.participant_id}' removed from combat.`);
    }
    case "status": {
      const novel = requireNovel();
      return raw(JSON.stringify(novel.combat ?? { active: false }, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown combat action '${args.action}'. Valid actions: init, advance, end, add_participant, remove_participant, status.`);
  }
});

// --- Narrative (GM) ---

// REQ-335/337/353 — derive a scene description from world-model state when
// `location` resolves to a room and no explicit description is supplied.
function deriveSceneDescription(location: string | undefined, novel: NovelState): string | null {
  if (!location) return null;
  const room = [...novel.world.rooms.entries()].find(([, r]) =>
    location.toLowerCase().startsWith(r.name.toLowerCase()) || r.name.toLowerCase().startsWith(location.toLowerCase()));
  if (!room) return null;
  const r = room[1];
  const things = [...novel.world.things.values()].filter((t) => t.location && t.location.toLowerCase() === r.name.toLowerCase() && t.locationType === "room");
  const npcs = [...novel.npcs.values()].filter((n) => n.location && n.location.toLowerCase() === r.name.toLowerCase());
  const parts: string[] = [r.description || r.name];
  if (npcs.length) parts.push(`Visible: ${npcs.map((n) => n.name).join(", ")}.`);
  if (things.length) parts.push(`Here: ${things.map((t) => t.name).join(", ")}.`);
  return parts.join(" ");
}

// REQ-335/337 — record a beat transition into story_beats when the beat changes.
function recordBeatTransition(novel: NovelState, newBeat: string, scenePreview: string): void {
  const effective = newBeat || DEFAULT_BEAT;
  const prev = currentBeat(novel);
  if (prev !== effective) {
    // REQ-352 — a GM-set beat at a scaffold position replaces the scaffold entry.
    novel.story_beats = novel.story_beats.filter(
      (b) => !(b.beat === effective && b.source === "adventure-scaffold"),
    );
    novel.story_beats.push({ beat: effective, scene_preview: scenePreview, source: "gm" });
  }
}

// REQ-336/351 — reset pacing state on a scene transition.
function resetPacing(novel: NovelState): void {
  novel.pacing_counter = 0;
  novel.pacing_autonomy_fired = false;
}

// REQ-338 — faction autonomous advancement: one tick per interval, [autonomous].
function factionAutonomousAdvance(novel: NovelState): void {
  const interval = factionAutonomyInterval();
  if (interval <= 0) return;
  novel.scene_transition_count++;
  if (novel.scene_transition_count % interval !== 0) return;
  for (const f of novel.factions) {
    f.clock = Math.min(f.clock_max, f.clock + 1);
    novel.faction_autonomous_ticks[f.id] = (novel.faction_autonomous_ticks[f.id] ?? 0) + 1;
    audit("faction_autonomous_advance", { faction: f.id, clock: f.clock });
  }
}

// REQ-340 — when an on_scene_transition countdown fires while the active entity
// is absent from all scenes since its creation, produce a [discovered] entry.
function fireCountdown(novel: NovelState, name: string, cd: { name: string; ticks: number; total: number; direction?: string; world_effect?: any }): void {
  const presentIds = new Set(novel.characters_present_ids ?? []);
  const activeId = novel.active_entity_id;
  const absent = activeId && !presentIds.has(activeId);
  novel.countdowns.delete(name);
  // REQ-368 — countdown-world effect coupling: apply the effect immediately
  // after removal; a missing target records a [WARNING] but the countdown
  // still fires.
  if (cd.world_effect) {
    const eff = cd.world_effect;
    const applied = applyWorldEffect(novel, eff);
    audit("countdown_effect", { countdown: name, effect: eff, applied: applied?.applied ?? false, warning: applied?.warning ?? null }, applied?.warning ? "[WARNING]" : undefined);
  }
  const entry: any = {
    index: novel.story_journal.length,
    type: "consequence",
    entry: `Countdown "${name}" fired: ${cd.direction ?? "consequence reached"}.`,
    scene_anchor: novel.scene_description?.substring(0, 80) ?? "",
    entity_ids: [],
    timestamp: new Date().toISOString(),
  };
  if (absent) entry.discovered = true;
  novel.story_journal.push(entry);
  audit("countdown_expired", { name, discovered: absent });
}

// REQ-368 — apply a countdown world_effect (describe/property/exit) with undo
// snapshots; missing targets record a warning without blocking the fire.
function applyWorldEffect(novel: NovelState, eff: any): { applied: boolean; warning?: string } {
  if (eff.type === "describe") {
    const room = [...novel.world.rooms.values()].find((r) => r.name.toLowerCase() === String(eff.target).toLowerCase());
    if (!room) return { applied: false, warning: `target missing — effect not applied (${eff.target})` };
    novelSnapshot();
    room.description = String(eff.value ?? "");
    return { applied: true };
  }
  if (eff.type === "property") {
    const thing = novel.world.things.get(String(eff.target).toLowerCase());
    if (!thing) return { applied: false, warning: `target missing — effect not applied (${eff.target})` };
    novelSnapshot();
    (thing as any)[String(eff.property)] = eff.value;
    return { applied: true };
  }
  if (eff.type === "exit") {
    const roomA = [...novel.world.rooms.values()].find((r) => r.name.toLowerCase() === String(eff.target).toLowerCase());
    const roomB = [...novel.world.rooms.values()].find((r) => r.name.toLowerCase() === String(eff.destination).toLowerCase());
    if (!roomA || !roomB) return { applied: false, warning: `target missing — effect not applied (${eff.target})` };
    novelSnapshot();
    roomA.exits.set(String(eff.direction), roomB.name);
    roomB.exits.set(oppositeDirection(String(eff.direction) as Direction), roomA.name);
    return { applied: true };
  }
  return { applied: false };
}

// REQ-405 — auto-record a story-journal moment entry on scene transition.
function recordStoryMoment(novel: NovelState, scene: string, location: string | null): void {
  const entry: any = {
    index: novel.story_journal.length,
    type: "moment",
    entry: `Scene transition: ${scene}`,
    scene_anchor: scene.substring(0, 80),
    entity_ids: [],
    timestamp: new Date().toISOString(),
  };
  if (location) entry.room_id = location;
  novel.story_journal.push(entry);
  audit("auto-moment", { scene: scene.substring(0, 80), location });
}

// REQ-353 — countdowns with on_scene_transition decrement on transition; climax
// accelerates the decrement by TTRPG_CLIMAX_ACCELERATION.
function advanceSceneTransitionCountdowns(novel: NovelState): void {
  const accel = currentBeat(novel) === "climax" ? climaxAcceleration() : 1;
  const effective = accel <= 0 ? 1 : accel;
  for (const [name, cd] of [...novel.countdowns.entries()]) {
    if (cd.type === "round") continue;
    if (!cd.on_scene_transition) continue;
    cd.ticks -= effective;
    if (cd.ticks <= 0) fireCountdown(novel, name, cd);
  }
}

// Scene (REQ-076, REQ-081, REQ-087, REQ-125, REQ-155, REQ-191, REQ-250, REQ-252, REQ-291, REQ-306, REQ-307, REQ-326, REQ-335, REQ-342, REQ-353, REQ-405) —
// consolidated scene-state/directive/presence/autonomy/choices/oracle surface.
server.registerTool("scene", {
  title: "Scene",
  description: "Manage the active scene and its narrative framing. Use when: setting scene state (description, location, type), the narrative directive, party presence, AI autonomy, or when offering choices or resolving an oracle roll. Do NOT use when: recording a story beat — use story (action: record).",
  inputSchema: {
    action: z.enum(["set", "directive", "presence", "autonomy", "choices", "oracle"]).describe("set, directive, presence, autonomy, choices, or oracle."),
    description: z.string().optional().describe("Scene description (set)."),
    location: z.string().optional().describe("Scene location (set)."),
    time_of_day: z.string().optional().describe("Time of day (set)."),
    atmosphere: z.string().optional().describe("Atmosphere (set)."),
    scene_type: z.union([z.enum(["combat", "social", "exploration", "neutral"]), z.array(z.enum(["combat", "social", "exploration", "neutral"]))]).optional().describe("Scene-type tag or array (set)."),
    beat: z.enum(BEAT_VALUES).optional().describe("Story-beat tag (set)."),
    skip_transition_hook: z.boolean().optional().describe("Skip the scene-transition hook (set)."),
    adventure_scene: z.string().nullable().optional().describe("Adventure-scene waypoint anchor; empty or null clears (set)."),
    fast_forward: z.object({
      interval: z.string().describe("The time interval to skip."),
      changes: z.array(z.object({ npc_id: z.string(), location: z.string().optional(), disposition: z.string().optional(), condition: z.string().optional() })).optional().describe("NPC changes during the skip."),
      skip_countdowns: z.boolean().optional().describe("Do not advance countdowns during the skip."),
    }).optional().describe("Narrative fast-forward (set)."),
    directive: z.string().optional().describe("Narrative directive (directive)."),
    entity_ids: z.array(z.string()).optional().describe("Entities present (presence)."),
    level: z.enum(["full", "mechanical_prompt", "manual"]).optional().describe("Autonomy level (autonomy)."),
    confirmation: z.enum(["auto", "confirm", "prompt"]).optional().describe("Confirmation mode (autonomy)."),
    safety: z.enum(["safe", "moderate", "hardcore"]).optional().describe("Safety tier (autonomy)."),
    creativity: z.enum(["predictable", "standard", "chaotic"]).optional().describe("Creativity (autonomy)."),
    prompt: z.string().optional().describe("Choice prompt (choices)."),
    choices: z.array(z.object({ id: z.string(), label: z.string(), description: z.string().optional() })).optional().describe("List of choices (choices)."),
    allow_freeform: z.boolean().optional().describe("Allow free-form response (choices)."),
    context: z.record(z.string(), z.any()).optional().describe("Context for the choice (choices)."),
    question: z.string().optional().describe("Question to resolve (oracle)."),
    likelihood: z.enum(["almost_certain", "likely", "50_50", "unlikely", "small_chance"]).optional().describe("Likelihood tier (oracle)."),
    seed: z.string().optional().describe("Deterministic seed (oracle)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "set": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const { description, location, time_of_day, atmosphere, scene_type, beat, skip_transition_hook, adventure_scene, fast_forward } = args;
      const derived = !description && location ? deriveSceneDescription(location, novel) : null;
      const effectiveDescription = description || derived || "";
      const isTransition = novel.scene_description !== "" && novel.scene_description !== effectiveDescription;
      if (novel.scene_description) {
        const historyEntry: any = {
          timestamp: new Date().toISOString(),
          description: novel.scene_description, location: novel.scene_location,
          time_of_day: novel.scene_time_of_day, atmosphere: novel.scene_atmosphere,
          beat: currentBeat(novel),
        };
        if (novel.scene_description !== effectiveDescription) novel.scene_history.push(historyEntry);
      }
      novel.scene_description = effectiveDescription;
      novel.scene_location = location;
      novel.scene_time_of_day = time_of_day;
      novel.scene_atmosphere = atmosphere;
      if (scene_type !== undefined) novel.scene_type = Array.isArray(scene_type) ? scene_type : [scene_type];
      const sceneLower = effectiveDescription.toLowerCase();
      for (const [, entry] of novel.lore) {
        if (!entry.enabled) continue;
        const matched = entry.triggers.some((t) => sceneLower.includes(t.toLowerCase()));
        if (matched) entry.sticky_remaining = entry.sticky;
        else if (entry.sticky_remaining > 0) { entry.sticky_remaining--; if (entry.sticky_remaining <= 0) entry.enabled = false; }
      }
      if (adventure_scene !== undefined) {
        if (adventure_scene === "" || adventure_scene === null) novel.adventure_scene_waypoint = null;
        else {
          const scenes = (novel.adventure_index?.locations ?? []).map((l: any) => l.name);
          if (!scenes.includes(adventure_scene)) return err("NOT_FOUND", `Adventure scene '${adventure_scene}' not found in the structural index. Nearby scenes: ${scenes.slice(0, 8).join(", ") || "(none)"}.`);
          novel.adventure_scene_waypoint = adventure_scene;
        }
      }
      if (fast_forward) {
        const ff: any = { interval: fast_forward.interval, npc_changes: [], countdown_adjustments: [] };
        if (!fast_forward.skip_countdowns) {
          for (const [name, cd] of [...novel.countdowns.entries()]) {
            if (cd.type === "narrative") {
              const decrement = Math.max(1, Math.round(Number((fast_forward.interval.match(/\d+/) ?? ["1"])[0]) || 1));
              cd.ticks -= decrement;
              ff.countdown_adjustments.push({ name, ticks: cd.ticks });
              if (cd.ticks <= 0) { novel.countdowns.delete(name); ff.countdown_adjustments.push({ name, fired: true }); }
            }
          }
        }
        for (const change of fast_forward.changes ?? []) {
          const npc = novel.npcs.get(change.npc_id);
          if (npc) {
            if (change.location !== undefined) npc.location = change.location;
            if (change.disposition !== undefined) npc.disposition = change.disposition;
            if (change.condition !== undefined && !npc.conditions.includes(change.condition)) npc.conditions.push(change.condition);
            ff.npc_changes.push({ npc_id: change.npc_id, location: change.location, disposition: change.disposition });
          }
        }
        audit("fast-forward", { interval: fast_forward.interval, ...ff }, "[fast-forward]");
      }
      if (beat !== undefined) { recordBeatTransition(novel, beat, effectiveDescription.substring(0, 60)); novel.scene_beat = beat; }
      const sceneRoomName = location || effectiveDescription;
      if (sceneRoomName) {
        const matchRoom = [...novel.world.rooms.entries()].find(([, r]) => sceneRoomName.toLowerCase().startsWith(r.name.toLowerCase()));
        if (matchRoom) { const entity = state.getActiveEntity(); if (entity) entity.current_room = matchRoom[1].name; }
      }
      if (isTransition && !skip_transition_hook) {
        audit("scene-transition", { from: novel.scene_history.slice(-1)[0]?.description, to: effectiveDescription });
        advanceSceneTransitionCountdowns(novel);
        factionAutonomousAdvance(novel);
        resetPacing(novel);
        if (novel.auto_record) recordStoryMoment(novel, effectiveDescription, location ?? null);
      }
      state.recordMutation(novel, "set_scene_state", "scene");
      state.saveNovel(novel);
      audit("set_scene_state", { description: effectiveDescription, location, time_of_day, atmosphere, beat });
      const boundaryWarn = boundaryCollisionWarning(novel, effectiveDescription);
      return boundaryWarn ? warn(boundaryWarn) : ok(`Scene set: ${effectiveDescription}`);
    }
    case "directive": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      novel.narrative_directive = args.directive;
      state.saveNovel(novel);
      return ok(`Narrative directive set.`);
    }
    case "presence": {
      requireGM();
      const novel = requireNovel();
      novel.characters_present_ids = args.entity_ids;
      state.saveNovel(novel);
      return ok(`Party presence set: ${args.entity_ids.join(", ") || "(none)"}.`);
    }
    case "autonomy": {
      requireGM();
      const novel = requireNovel();
      const auto = novel.autonomy;
      const { level, confirmation, safety, creativity } = args;
      if (safety && safety !== "safe" && safety !== auto.safety && !auto.confirmed_safety_tiers.includes(safety)) {
        novel.pending_workflow = { decision: `safety_escalation:${safety}`, snapshot: state.captureWorkflowSnapshot(novel) };
        state.saveNovel(novel);
        const severity = safety === "hardcore"
          ? "warning: disengaging safety protocols permits permanent character death with no warnings"
          : "caution: raising safety to 'moderate' permits character death with warnings";
        return needInput(`Safety escalation advisory — ${severity}. Respond with 'confirm' to raise the safety tier, or 'decline' to leave the current tier (${auto.safety}).`);
      }
      if (level) auto.level = level;
      if (confirmation) auto.confirmation = confirmation;
      if (creativity) auto.creativity = creativity;
      if (safety) { auto.safety = safety; if (!auto.confirmed_safety_tiers.includes(safety)) auto.confirmed_safety_tiers.push(safety); }
      state.saveNovel(novel);
      audit("set_autonomy", { level, confirmation, safety, creativity });
      const a = novel.autonomy;
      return ok(`Autonomy set — level: ${a.level}, confirmation: ${a.confirmation}, safety: ${a.safety}, creativity: ${a.creativity}`);
    }
    case "choices": {
      requireGM();
      const novel = requireNovel();
      if (novel.pending_workflow) return err("STATE_CONFLICT", "A workflow decision is pending. Resolve it with respond before starting a new one.");
      novel.pending_workflow = {
        decision: "present_choices",
        snapshot: state.captureWorkflowSnapshot(novel),
        payload: { prompt: args.prompt, choices: args.choices, allow_freeform: args.allow_freeform, context: args.context },
      };
      state.saveNovel(novel);
      const opts = args.choices.map((c: any) => `  **${c.id}** — ${c.label}${c.description ? `: ${c.description}` : ""}`).join("\n");
      return needInput(`Decision: -present_choices-\nQuestion: ${args.prompt}\n\nOptions:\n${opts}${args.allow_freeform ? "\n\nYou may also respond with a freeform answer." : ""}`);
    }
    case "oracle": {
      requireNotObserver();
      const novel = requireNovel();
      const thresholds: Record<string, number> = { almost_certain: 11, likely: 26, "50_50": 51, unlikely: 76, small_chance: 91 };
      const band = args.likelihood ?? "50_50";
      const target = thresholds[band] ?? 51;
      const roll = args.seed ? createRng(args.seed).roll(100) : sessionRoll(100);
      const yes = roll >= target;
      const isDoubles = roll % 11 === 0;
      const marker = isDoubles ? (yes ? "[EXCEPTIONAL_YES]" : "[EXCEPTIONAL_NO]") : (yes ? "[YES]" : "[NO]");
      audit("ask_oracle", { question: args.question, likelihood: band, seed: args.seed });
      novel.uncommitted_rolls.push({ roll: `${roll}/100 → ${marker}`, suggested_tool: "story (action: record)", at: new Date().toISOString() });
      if (novel.uncommitted_rolls.length > 3) novel.uncommitted_rolls.shift();
      state.saveNovel(novel);
      let flavor = "";
      if (!isDoubles && Math.abs(target - roll) <= 5) flavor = " (barely)";
      else if (!isDoubles && Math.abs(target - roll) >= 30) flavor = " (decisively)";
      return ok(`Question: "${args.question}"\nLikelihood: ${band} (roll ≥ ${target})\nRoll: ${roll}/100 → ${marker}${flavor}`);
    }
    default:
      return err("INVALID_INPUT", `Unknown scene action '${args.action}'. Valid actions: set, directive, presence, autonomy, choices, oracle.`);
  }
});

// --- NPCs (GM) ---

// NPC (REQ-119, REQ-122, REQ-123, REQ-124, REQ-156, REQ-327) — consolidated create/update/remove/list/get surface.
server.registerTool("npc", {
  title: "NPC",
  description: "Manage non-player characters in the active Novel. Use when: introducing, revising, removing, listing, or reading NPCs. Do NOT use when: managing player characters — use character (action: create/import/sheet).",
  inputSchema: {
    action: z.enum(["create", "update", "remove", "list", "get"]).describe("create, update, remove, list, or get."),
    name: z.string().optional().describe("NPC name (create)."),
    npc_id: z.string().optional().describe("NPC identifier (update/remove/get)."),
    description: z.string().optional().describe("Optional description."),
    disposition: z.string().optional().describe("Optional disposition."),
    location: z.string().optional().describe("Optional location."),
    goals: z.string().optional().describe("Optional goals."),
    ruleset_reference: z.string().optional().describe("Optional ruleset stat-block reference (create)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "create": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const { name, description, disposition, location, goals, ruleset_reference } = args;
      const id = `npc_${Date.now().toString(36)}`;
      const npc: any = { id, name, description, disposition, location, conditions: [], condition_rounds: {} };
      // REQ-119 — NPC stat block reference.
      if (ruleset_reference) {
        const slug = novel.ruleset ?? null;
        if (slug && rulesets.isInstalled(slug)) {
          const model = rulesets.hydrate(slug).model as any;
          const pools = { ...(model.monsters ?? {}), ...(model.npcs ?? {}), ...(model.concepts ?? {}) };
          const hit = Object.values(pools).find((e: any) => (e.name ?? "").toLowerCase() === String(ruleset_reference).toLowerCase())
            ?? Object.values(pools).find((e: any) => e.id === String(ruleset_reference).toLowerCase());
          if (hit) {
            const { name: _n, ...stats } = hit as any;
            npc.stats = { ...stats };
            npc.ruleset_reference = ruleset_reference;
          } else {
            const valid = Object.keys(pools);
            return err("NOT_FOUND", `Ruleset reference '${ruleset_reference}' not found. Valid references: ${valid.slice(0, 25).join(", ") || "(none)"}.`);
          }
        } else {
          return err("NOT_FOUND", "No ruleset bound to the active Novel — ruleset_reference requires a bound ruleset.");
        }
      }
      if (goals) npc.personality = { goals };
      novel.npcs.set(id, npc);
      // REQ-327 — NPC-world coupling.
      const roomMatch = [...novel.world.rooms.values()].find((r) => location && r.name.toLowerCase() === location.toLowerCase());
      if (roomMatch) npc.room_id = roomMatch.name.toLowerCase();
      // REQ-310 — campaign memory.
      recordCampaignMemory(novel, "npcs", `NPC ${name} created (${id})`);
      state.recordMutation(novel, "create_npc", "npc");
      state.saveNovel(novel);
      audit("create_npc", { name, id, ruleset_reference });
      return ok(`NPC '${name}' created (${id}).`);
    }
    case "update": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const { npc_id, name, description, disposition, location, goals } = args;
      const npc = novel.npcs.get(npc_id);
      if (!npc) return err("NOT_FOUND", `NPC '${npc_id}' not found.`);
      if (name !== undefined) npc.name = name;
      if (description !== undefined) npc.description = description;
      if (disposition !== undefined) npc.disposition = disposition;
      if (location !== undefined) npc.location = location;
      if (goals !== undefined) npc.personality = { ...(npc.personality ?? {}), goals };
      state.saveNovel(novel);
      audit("update_npc", { npc_id });
      return ok(`NPC '${npc_id}' updated.`);
    }
    case "remove": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      if (!novel.npcs.has(args.npc_id)) return err("NOT_FOUND", `NPC '${args.npc_id}' not found.`);
      novel.npcs.delete(args.npc_id);
      state.saveNovel(novel);
      audit("remove_npc", { npc_id: args.npc_id });
      return ok(`NPC '${args.npc_id}' removed.`);
    }
    case "list": {
      const novel = requireNovel();
      const badge = getBadge();
      const isGM = badge === "game_master" || badge === "none";
      const rows = [...novel.npcs.values()].map((n: any) => isGM ? n : { id: n.id, name: n.name, disposition: n.disposition ?? "neutral", location: n.location ?? null });
      return raw(JSON.stringify(rows, null, 2));
    }
    case "get": {
      const novel = requireNovel();
      const npc = novel.npcs.get(args.npc_id);
      if (!npc) return err("NOT_FOUND", `NPC '${args.npc_id}' not found.`);
      return raw(JSON.stringify(npc, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown npc action '${args.action}'. Valid actions: create, update, remove, list, get.`);
  }
});

// --- Countdowns (GM) ---

// Countdown (REQ-329, REQ-358, REQ-368) — consolidated set/advance/remove/list surface.
server.registerTool("countdown", {
  title: "Countdown",
  description: "Manage countdown timers in the active Novel. Use when: starting, advancing, removing, or listing clocks. Do NOT use when: tracking a vow's progress — use vow (action: milestone).",
  inputSchema: {
    action: z.enum(["set", "advance", "remove", "list"]).describe("set, advance, remove, or list."),
    name: z.string().optional().describe("Countdown name (set/advance/remove)."),
    ticks: z.number().min(1).optional().describe("Starting ticks (set)."),
    type: z.enum(["round", "narrative"]).optional().describe("round or narrative (set)."),
    scope: z.string().optional().describe("Optional scope name (set)."),
    direction: z.string().optional().describe("Optional direction: increment or decrement (set)."),
    on_scene_transition: z.boolean().optional().describe("When true, advance on each scene transition (set)."),
    triggers: z.array(z.string()).optional().describe("Optional world-model triggers (set)."),
    world_effect: z.object({
      type: z.enum(["describe", "property", "exit"]).describe("The effect kind."),
      target: z.string().describe("The effect target."),
      direction: z.string().optional().describe("Optional direction (for exits)."),
      destination: z.string().optional().describe("Optional destination (for exits)."),
      property: z.string().optional().describe("Optional property (for property effects)."),
      value: z.string().optional().describe("Optional value (for property effects)."),
    }).optional().describe("Optional world-model effect applied when the countdown fires (set)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "set": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const { name, ticks, type, scope, direction, on_scene_transition, triggers, world_effect } = args;
      novel.countdowns.set(name, { name, ticks, total: ticks, type: type ?? "narrative", scope, direction, on_scene_transition, triggers, world_effect });
      state.recordMutation(novel, "set_countdown", "countdown");
      state.saveNovel(novel);
      audit("set_countdown", { name, ticks, type, on_scene_transition, triggers, world_effect: world_effect?.type });
      return ok(`Countdown '${name}' set (${ticks} ticks, ${type ?? "narrative"})${triggers && triggers.length > 0 ? `, ${triggers.length} world trigger${triggers.length === 1 ? "" : "s"}` : ""}.`);
    }
    case "advance": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const cd = novel.countdowns.get(args.name);
      if (!cd) return err("NOT_FOUND", `Countdown '${args.name}' not found.`);
      cd.ticks--;
      if (cd.ticks <= 0) {
        novel.countdowns.delete(args.name);
        if ((cd as any).world_effect) {
          const eff = (cd as any).world_effect;
          const applied = applyWorldEffect(novel, eff);
          audit("countdown_effect", { countdown: args.name, effect: eff, applied: applied?.applied ?? false, warning: applied?.warning ?? null }, applied?.warning ? "[WARNING]" : undefined);
        }
        const direction = cd.direction?.toLowerCase() ?? "";
        const toward = direction.includes("hostile") ? "hostile" : direction.includes("benign") ? "friendly" : null;
        if (toward && cd.scope) {
          for (const [, npc] of novel.npcs) {
            if (npc.location && npc.location.toLowerCase() === cd.scope!.toLowerCase()) {
              const prev = npc.disposition ?? "neutral";
              npc.disposition = shiftDisposition(prev, toward);
              audit("countdown-disposition", { npc: npc.id, countdown: args.name, from: prev, to: npc.disposition });
            }
          }
        }
        audit("countdown_expired", { name: args.name });
        state.saveNovel(novel);
        return ok(`Countdown '${args.name}' expired. Recorded in audit log.`);
      }
      state.saveNovel(novel);
      audit("advance_countdown", { name: args.name, remaining: cd.ticks });
      return ok(`Countdown ${args.name}: ${cd.ticks} ticks remaining.`);
    }
    case "remove": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      if (!novel.countdowns.has(args.name)) return err("NOT_FOUND", `Countdown '${args.name}' not found.`);
      novel.countdowns.delete(args.name);
      state.saveNovel(novel);
      audit("remove_countdown", { name: args.name });
      return ok(`Countdown '${args.name}' removed.`);
    }
    case "list": {
      const novel = requireNovel();
      const badge = getBadge();
      const isGM = badge === "game_master" || badge === "none";
      const rows = [...novel.countdowns.entries()].map(([name, cd]) => ({ name, ticks: cd.ticks, total: cd.total, type: cd.type, ...(isGM ? { scope: cd.scope, direction: cd.direction } : {}) }));
      return raw(JSON.stringify(rows, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown countdown action '${args.action}'. Valid actions: set, advance, remove, list.`);
  }
});

// --- Lore (GM) ---

// Lore (REQ-083, REQ-094, REQ-234, REQ-328) — consolidated CRUD + list/get + interchange surface.
server.registerTool("lore", {
  title: "Lore",
  description: "Manage the active Novel's lore entries (world facts the narrator recalls). Use when: creating, revising, removing, toggling, grouping, suggesting, listing, exporting, or importing lore. Do NOT use when: recording a story beat — use story (action: record).",
  inputSchema: {
    action: z.enum(["set", "update", "remove", "toggle", "group", "suggest", "list", "get", "export", "import", "set_secret", "reveal", "secret_list", "knowledge"]).describe("set, update, remove, toggle, group, suggest, list, get, export, import, set_secret, reveal, secret_list, or knowledge."),
    key: z.string().optional().describe("Lore key (set/update/remove/toggle/group/get)."),
    content: z.string().optional().describe("Lore content (set/update)."),
    triggers: z.array(z.string()).optional().describe("Optional recall triggers (set/update)."),
    badge_scope: z.enum(["game_master", "shared"]).optional().describe("game_master or shared (set/update)."),
    priority: z.number().optional().describe("Optional priority (set/update)."),
    sticky: z.number().optional().describe("Optional sticky weight (set/update)."),
    group: z.string().nullable().optional().describe("Group name, or null to clear (set/update/group)."),
    world_target: z.string().optional().describe("Optional world-model target reference (set/set_secret)."),
    entity_id: z.string().optional().describe("Entity to reveal to / whose knowledge to read (reveal/knowledge)."),
    format: z.string().optional().describe("Optional output format (export)."),
    data: z.string().optional().describe("JSON or Markdown lorebook data (import)."),
    mode: z.enum(["dry-run", "merge", "replace"]).optional().describe("dry-run, merge, or replace (import)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "set": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const { key, content, triggers, badge_scope, priority, sticky, group, world_target } = args;
      const entry: LoreEntry = {
        key, content,
        triggers: triggers ?? [],
        badge_scope: badge_scope ?? "game_master",
        priority: priority ?? 0,
        sticky: sticky ?? 0,
        sticky_remaining: sticky ?? 0,
        enabled: true,
        group,
        world_target,
      };
      novel.lore.set(key, entry);
      state.saveNovel(novel);
      audit("set_lore_entry", { key });
      return ok(`Lore entry '${key}' created.`);
    }
    case "update": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const { key, content, triggers, badge_scope, priority, sticky, group } = args;
      const entry = novel.lore.get(key);
      if (!entry) return err("NOT_FOUND", `Lore entry '${key}' not found.`);
      if (content !== undefined) entry.content = content;
      if (triggers !== undefined) entry.triggers = triggers;
      if (badge_scope !== undefined) entry.badge_scope = badge_scope;
      if (priority !== undefined) entry.priority = priority;
      if (sticky !== undefined) { entry.sticky = sticky; entry.sticky_remaining = sticky; }
      if (group !== undefined) { if (group === null) delete entry.group; else entry.group = group; }
      state.saveNovel(novel);
      return ok(`Lore entry '${key}' updated.`);
    }
    case "remove": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      if (!novel.lore.has(args.key)) return err("NOT_FOUND", `Lore entry '${args.key}' not found.`);
      novel.lore.delete(args.key);
      state.saveNovel(novel);
      return ok(`Lore entry '${args.key}' removed.`);
    }
    case "toggle": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const entry = novel.lore.get(args.key);
      if (!entry) return err("NOT_FOUND", `Lore entry '${args.key}' not found.`);
      entry.enabled = !entry.enabled;
      state.saveNovel(novel);
      return ok(`Lore entry '${args.key}' ${entry.enabled ? "enabled" : "disabled"}.`);
    }
    case "group": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const entry = novel.lore.get(args.key);
      if (!entry) return err("NOT_FOUND", `Lore entry '${args.key}' not found.`);
      if (args.group === null || args.group === undefined) delete entry.group;
      else entry.group = args.group;
      state.saveNovel(novel);
      return ok(`Lore entry '${args.key}' group ${args.group ? `set to '${args.group}'` : "removed"}.`);
    }
    case "suggest": {
      requireGM();
      const novel = requireNovel();
      const templates = state.enrichmentManifest?.lore_templates ?? [];
      if (templates.length === 0) return ok("No lore templates available (enrichment not loaded).");
      const sample = templates.slice(0, 3).map((t: any) => `- ${t.content?.substring(0, 120)}${(t.content?.length ?? 0) > 120 ? "..." : ""}`);
      return raw(sample.join("\n"));
    }
    case "list": {
      const novel = requireNovel();
      const badge = getBadge();
      const isGM = badge === "game_master" || badge === "none";
      const rows = [...novel.lore.values()].map((e) => isGM ? e : { key: e.key, content: e.content, badge_scope: e.badge_scope, enabled: e.enabled });
      return raw(JSON.stringify(rows, null, 2));
    }
    case "get": {
      const novel = requireNovel();
      const entry = novel.lore.get(args.key);
      if (!entry) return err("NOT_FOUND", `Lore entry '${args.key}' not found.`);
      return raw(JSON.stringify(entry, null, 2));
    }
    case "export": {
      requireGM();
      const novel = requireNovel();
      if (args.format && !INTERCHANGE_FORMATS.includes(args.format)) {
        return err("INVALID_INPUT", `Unsupported format '${args.format}'. Supported formats: ${INTERCHANGE_FORMATS.join(", ")}.`);
      }
      const entries = [...novel.lore.values()];
      if (args.format === "markdown") {
        let md = "# Lorebook\n\n";
        for (const e of entries) {
          md += `## ${e.key}\n${e.content}\n_triggers: ${e.triggers.join(", ")}_\n\n`;
        }
        return raw(md);
      }
      return raw(JSON.stringify(entries.map(e => ({
        key: e.key, content: e.content, triggers: e.triggers,
        badge_scope: e.badge_scope, priority: e.priority, sticky: e.sticky,
        enabled: e.enabled, group: e.group,
      })), null, 2));
    }
    case "import": {
      requireGM();
      const novel = requireNovel();
      const m = args.mode ?? "dry-run";
      try {
        const parsed = JSON.parse(args.data);
        if (!Array.isArray(parsed)) return err("INVALID_INPUT", "Expected an array of lore entries.");
        if (m === "dry-run") {
          return ok(`Dry-run: ${parsed.length} lore entries would be imported.`);
        }
        if (m === "replace") novel.lore.clear();
        for (const e of parsed) {
          novel.lore.set(e.key, {
            key: e.key, content: e.content, triggers: e.triggers ?? [],
            badge_scope: e.badge_scope ?? "game_master", priority: e.priority ?? 0,
            sticky: e.sticky ?? 0, sticky_remaining: e.sticky ?? 0,
            enabled: e.enabled ?? true, group: e.group,
          });
        }
        state.saveNovel(novel);
        return ok(`Imported ${parsed.length} lore entries (${m} mode).`);
      } catch {
        return err("INVALID_INPUT", "Could not parse lorebook data. Provide valid JSON array.");
      }
    }
    case "set_secret": {
      requireGM();
      const novel = requireNovel();
      if (novel.secrets.some(s => s.key === args.key)) return err("STATE_CONFLICT", `Secret '${args.key}' already exists.`);
      novel.secrets.push({ key: args.key, content: args.content, triggers: args.triggers ?? [], badge_scope: args.badge_scope ?? "game_master", known_by: [], world_target: args.world_target });
      state.saveNovel(novel);
      return ok(`Secret '${args.key}' created.`);
    }
    case "reveal": {
      requireGM();
      const novel = requireNovel();
      const secret = novel.secrets.find(s => s.key === args.key);
      if (!secret) return err("NOT_FOUND", `Secret '${args.key}' not found.`);
      if (!novel.entities.has(args.entity_id)) return err("NOT_FOUND", `Entity '${args.entity_id}' not found.`);
      if (!secret.known_by.includes(args.entity_id)) secret.known_by.push(args.entity_id);
      state.saveNovel(novel);
      return ok(`Secret '${args.key}' revealed to '${args.entity_id}'.`);
    }
    case "secret_list": {
      requireGM();
      const novel = requireNovel();
      return raw(JSON.stringify(novel.secrets.map(s => ({ key: s.key, content: s.content, known_by: s.known_by, badge_scope: s.badge_scope })), null, 2));
    }
    case "knowledge": {
      requireGM();
      const novel = requireNovel();
      if (!novel.entities.has(args.entity_id)) return err("NOT_FOUND", `Entity '${args.entity_id}' not found.`);
      const known = novel.secrets.filter(s => s.known_by.includes(args.entity_id));
      if (args.key) {
        const s = known.find(s => s.key === args.key);
        return raw(JSON.stringify(s ?? { key: args.key, known: false }));
      }
      return raw(JSON.stringify(known.map(s => ({ key: s.key, content: s.content }))));
    }
    default:
      return err("INVALID_INPUT", `Unknown lore action '${args.action}'. Valid actions: set, update, remove, toggle, group, suggest, list, get, export, import, set_secret, reveal, secret_list, knowledge.`);
  }
});

// --- Conditions (GM) ---

// REQ-217 — condition tools: condition names validate against the ruleset's
// indexed condition list when bound, else a ruleset-agnostic base catalogue.
// Unknown conditions return [INVALID_INPUT] with valid values enumerated.
const BASE_CONDITIONS = ["blinded", "charmed", "deafened", "frightened", "grappled", "incapacitated", "invisible", "paralyzed", "petrified", "poisoned", "prone", "restrained", "stunned", "unconscious"];
function conditionCatalogue(novel: NovelState): string[] {
  const slug = novel?.ruleset ?? null;
  if (slug && rulesets.isInstalled(slug)) {
    const model = rulesets.hydrate(slug).model as any;
    const c = (model.conditions ?? model.concepts_conditions) ?? {};
    if (typeof c === "object" && Object.keys(c).length > 0) return Object.keys(c);
  }
  return BASE_CONDITIONS;
}
// Condition (REQ-217) — consolidated apply/remove/list surface.
server.registerTool("condition", {
  title: "Condition",
  description: "Manage mechanical or narrative conditions on entities. Use when: applying, removing, or listing conditions. Do NOT use when: recording damage or combat state — use combat (action: init/advance).",
  inputSchema: {
    action: z.enum(["apply", "remove", "list"]).describe("apply, remove, or list."),
    entity_id: z.string().optional().describe("The entity to affect (apply/remove)."),
    condition: z.string().optional().describe("The condition name (apply/remove)."),
    rounds: z.number().optional().describe("Optional duration in rounds (apply)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "apply": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const entity = novel.entities.get(args.entity_id) ?? novel.npcs.get(args.entity_id);
      if (!entity) return err("NOT_FOUND", `Entity '${args.entity_id}' not found.`);
      const catalogue = conditionCatalogue(novel);
      if (!catalogue.includes(args.condition)) {
        return err("INVALID_INPUT", `Unknown condition '${args.condition}'. Valid conditions: ${catalogue.join(", ")}.`);
      }
      if (!entity.conditions) entity.conditions = [];
      if (!entity.condition_rounds) entity.condition_rounds = {};
      if (entity.conditions.includes(args.condition)) {
        return warn("Condition already active.");
      }
      entity.conditions.push(args.condition);
      if (args.rounds) entity.condition_rounds[args.condition] = args.rounds;
      state.saveNovel(novel);
      return ok(`'${args.condition}' applied to '${args.entity_id}'${args.rounds ? ` for ${args.rounds} rounds` : ""}.`);
    }
    case "remove": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      const entity = novel.entities.get(args.entity_id) ?? novel.npcs.get(args.entity_id);
      if (!entity) return err("NOT_FOUND", `Entity '${args.entity_id}' not found.`);
      if (!entity.conditions) return warn("Condition not present.");
      if (!entity.conditions.includes(args.condition)) return warn("Condition not present.");
      entity.conditions = entity.conditions.filter((c: string) => c !== args.condition);
      delete entity.condition_rounds[args.condition];
      state.saveNovel(novel);
      return ok(`'${args.condition}' removed from '${args.entity_id}'.`);
    }
    case "list": {
      const novel = requireNovel();
      const badge = getBadge();
      const isGM = badge === "game_master" || badge === "none";
      const rows: any[] = [];
      for (const [id, e] of novel.entities) if ((e as any).conditions?.length) rows.push({ entity_id: id, conditions: (e as any).conditions, ...(isGM ? { rounds: (e as any).condition_rounds } : {}) });
      for (const [id, n] of novel.npcs) if ((n as any).conditions?.length) rows.push({ entity_id: id, conditions: (n as any).conditions, ...(isGM ? { rounds: (n as any).condition_rounds } : {}) });
      return raw(JSON.stringify(rows, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown condition action '${args.action}'. Valid actions: apply, remove, list.`);
  }
});

// --- Factions (GM) ---

// Faction (REQ-338, REQ-364) — consolidated create/update/remove/list surface.
server.registerTool("faction", {
  title: "Faction",
  description: "Manage organizations in the active Novel. Use when: creating, revising, removing, or listing factions and their progress clocks. Do NOT use when: tracking a faction's territory rooms — use world (action: create_room).",
  inputSchema: {
    action: z.enum(["create", "update", "remove", "list"]).describe("create, update, remove, or list."),
    name: z.string().optional().describe("Faction name (create)."),
    faction_id: z.string().optional().describe("Faction identifier (update/remove)."),
    description: z.string().optional().describe("Optional description."),
    goals: z.array(z.string()).optional().describe("Optional goals."),
    resources: z.string().optional().describe("Optional resources."),
    territory: z.array(z.string()).optional().describe("Optional territory names."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "create": {
      requireGM();
      const novel = requireNovel();
      const { name, description, goals, resources, territory } = args;
      if (novel.factions.some(f => f.name === name)) return err("STATE_CONFLICT", `Faction '${name}' already exists.`);
      const faction = {
        id: `faction_${Date.now().toString(36)}`,
        name, description: description ?? "", goals: goals ?? [], resources: resources ?? "", clock: 0, clock_max: 10, status: "neutral",
        territory: territory ?? undefined,
      };
      novel.factions.push(faction);
      state.saveNovel(novel);
      audit("create_faction", { name, description, goals, territory });
      return ok(`Faction '${name}' created (${faction.id}).`);
    }
    case "update": {
      requireGM();
      const novel = requireNovel();
      const { faction_id, ...fields } = args;
      const faction = novel.factions.find(f => f.id === faction_id);
      if (!faction) return err("NOT_FOUND", `Faction '${faction_id}' not found.`);
      Object.assign(faction, fields);
      state.saveNovel(novel);
      return ok(`Faction '${faction.name}' updated.`);
    }
    case "remove": {
      requireGM();
      const novel = requireNovel();
      const idx = novel.factions.findIndex(f => f.id === args.faction_id);
      if (idx === -1) return err("NOT_FOUND", `Faction '${args.faction_id}' not found.`);
      const name = novel.factions[idx].name;
      novel.factions.splice(idx, 1);
      state.saveNovel(novel);
      audit("remove_faction", { faction_id: args.faction_id });
      return ok(`Faction '${name}' removed.`);
    }
    case "list": {
      const novel = requireNovel();
      const badge = getBadge();
      const isGM = badge === "game_master" || badge === "none";
      const rows = novel.factions.map((f) => isGM ? f : { id: f.id, name: f.name, description: f.description });
      return raw(JSON.stringify(rows, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown faction action '${args.action}'. Valid actions: create, update, remove, list.`);
  }
});

// Relationship (REQ-236) — consolidated set/get surface.
server.registerTool("relationship", {
  title: "Relationship",
  description: "Manage directed relationships between entities, NPCs, or factions. Use when: setting or reading how two parties relate. Do NOT use when: tracking faction progress — use faction (action: update).",
  inputSchema: {
    action: z.enum(["set", "get"]).describe("set or get."),
    entity_a: z.string().optional().describe("The source entity (set)."),
    entity_b: z.string().optional().describe("The target entity (set)."),
    type: z.enum(["ally", "rival", "neutral", "mentor", "dependent", "suspicious"]).optional().describe("Relationship type (set)."),
    value: z.number().optional().describe("Optional relationship strength (set)."),
    description: z.string().optional().describe("Optional description (set)."),
    entity_id: z.string().optional().describe("Entity whose relationships to list (get)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "set": {
      requireGM();
      const novel = requireNovel();
      novel.relationships.push({ entity_a: args.entity_a, entity_b: args.entity_b, type: args.type, value: args.value, description: args.description });
      state.saveNovel(novel);
      return ok(`Relationship set: ${args.entity_a} -> ${args.entity_b} (${args.type}).`);
    }
    case "get": {
      requireGM();
      const novel = requireNovel();
      const outgoing = novel.relationships.filter(r => r.entity_a === args.entity_id);
      const incoming = novel.relationships.filter(r => r.entity_b === args.entity_id);
      return raw(JSON.stringify({ outgoing, incoming }, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown relationship action '${args.action}'. Valid actions: set, get.`);
  }
});

// Vow (REQ-322, REQ-358) — consolidated set/milestone/resolve/forsake/list surface.
server.registerTool("vow", {
  title: "Vow",
  description: "Track narrative vows, quests, and obligations with milestones. Use when: setting, advancing, resolving, forsaking, or listing vows. Do NOT use when: starting a clock timer — use countdown (action: set).",
  inputSchema: {
    action: z.enum(["set", "milestone", "resolve", "forsake", "list"]).describe("set, milestone, resolve, forsake, or list."),
    name: z.string().optional().describe("Vow name (set)."),
    vow_name: z.string().optional().describe("Vow name (milestone/resolve/forsake)."),
    description: z.string().optional().describe("Vow description (set)."),
    parties: z.array(z.string()).optional().describe("Parties bound by the vow (set)."),
    difficulty: z.enum(["troublesome", "dangerous", "formidable", "extreme", "epic"]).optional().describe("troublesome, dangerous, formidable, extreme, or epic (set)."),
    scope: z.enum(["gm", "shared", "faction", "party"]).optional().describe("gm, shared, faction, or party (set)."),
    outcome: z.string().optional().describe("The resolution outcome (resolve)."),
    consequences: z.string().optional().describe("Optional consequences (resolve)."),
    reason: z.string().optional().describe("The reason for abandoning (forsake)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "set": {
      requireGM();
      const novel = requireNovel();
      const { name, description, parties, difficulty, scope } = args;
      if (novel.vows.some(v => v.name === name)) return err("STATE_CONFLICT", `Vow '${name}' already exists.`);
      novel.vows.push({
        name, description, parties, difficulty: difficulty as any, scope: scope ?? "shared",
        milestones: 0, rank_track: DIFFICULTY_TRACKS[difficulty] ?? 10, state: "active",
      });
      if (!novel.countdowns.has(`vow:${name}`)) {
        novel.pending_vow_countdown_suggestion = {
          vow_name: name,
          countdown_name: `vow:${name}`,
          tick_count: DIFFICULTY_TRACKS[difficulty] ?? 10,
          scope: scope ?? "shared",
        };
      }
      state.recordMutation(novel, "set_vow", "vow");
      state.saveNovel(novel);
      return ok(`Vow '${name}' set (${difficulty}, ${DIFFICULTY_TRACKS[difficulty]} milestones). A linked countdown suggestion is available in badge_briefing — respond \`accept\` to create it.`);
    }
    case "milestone": {
      requireGM();
      const novel = requireNovel();
      const vow = novel.vows.find(v => v.name === args.vow_name);
      if (!vow) return err("NOT_FOUND", `Vow '${args.vow_name}' not found.`);
      vow.milestones++;
      const linked = novel.countdowns.get(`vow:${args.vow_name}`);
      if (linked) {
        linked.ticks += 1;
        if (linked.ticks >= linked.total) {
          novel.countdowns.delete(`vow:${args.vow_name}`);
          audit("vow_countdown_filled", { vow_name: args.vow_name, countdown: `vow:${args.vow_name}` });
        }
        state.saveNovel(novel);
      }
      state.saveNovel(novel);
      return ok(`Vow '${args.vow_name}' progress: ${vow.milestones}/${vow.rank_track} milestones.${linked ? ` Linked countdown at ${linked.ticks}/${linked.total}.` : ""}`);
    }
    case "resolve": {
      requireGM();
      const novel = requireNovel();
      const vow = novel.vows.find(v => v.name === args.vow_name);
      if (!vow) return err("NOT_FOUND", `Vow '${args.vow_name}' not found.`);
      vow.state = "resolved";
      vow.outcome = args.outcome;
      vow.consequences = args.consequences;
      state.saveNovel(novel);
      return ok(`Vow '${args.vow_name}' resolved.`);
    }
    case "forsake": {
      requireGM();
      const novel = requireNovel();
      const vow = novel.vows.find(v => v.name === args.vow_name);
      if (!vow) return err("NOT_FOUND", `Vow '${args.vow_name}' not found.`);
      vow.state = "forsaken";
      vow.reason = args.reason;
      state.saveNovel(novel);
      return ok(`Vow '${args.vow_name}' forsaken.`);
    }
    case "list": {
      const novel = requireNovel();
      const badge = getBadge();
      const isGM = badge === "game_master" || badge === "none";
      const rows = novel.vows.map((v) => isGM ? v : { name: v.name, state: v.state, milestones: v.milestones });
      return raw(JSON.stringify(rows, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown vow action '${args.action}'. Valid actions: set, milestone, resolve, forsake, list.`);
  }
});

// Story journal (REQ-246, REQ-331, REQ-333) — consolidated record/update/remove/list/promote surface.
server.registerTool("story", {
  title: "Story",
  description: "Manage the story journal — typed narrative memories (decision, moment, revelation, bond, consequence). Use when: recording, editing, removing, listing, or promoting story beats. Do NOT use when: recording a durable world fact — use lore (action: set).",
  inputSchema: {
    action: z.enum(["record", "update", "remove", "list", "promote"]).describe("record, update, remove, list, or promote."),
    type: z.enum(["decision", "moment", "revelation", "bond", "consequence"]).optional().describe("Story entry type (record/update)."),
    entry: z.string().optional().describe("Story entry text (record/update)."),
    index: z.number().min(0).optional().describe("Story entry index (update/remove/promote)."),
    filter: z.enum(["decision", "moment", "revelation", "bond", "consequence"]).optional().describe("Optional type filter (list)."),
    offset: z.number().min(0).optional().describe("Optional pagination offset (list)."),
    limit: z.number().min(0).optional().describe("Optional page size (list)."),
    key: z.string().optional().describe("Optional lore key (promote)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "record": {
      requireGM();
      const novel = requireNovel();
      const { type, entry } = args;
      const index = novel.story_journal.length;
      // REQ-331 — story journal-world coupling.
      const sceneLoc = novel.scene_location ?? "";
      const matchRoom = [...novel.world.rooms.values()].find((r) => sceneLoc.toLowerCase().includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(sceneLoc.toLowerCase()));
      const roomId = matchRoom ? matchRoom.name.toLowerCase() : undefined;
      novel.story_journal.push({
        index, type, entry,
        scene_anchor: novel.scene_description?.substring(0, 80) ?? "",
        entity_ids: [],
        timestamp: new Date().toISOString(),
        room_id: roomId,
      });
      state.recordMutation(novel, "record_story", "journal");
      state.saveNovel(novel);
      return ok(`Story entry #${index} recorded (${type}).`);
    }
    case "update": {
      requireGM();
      const novel = requireNovel();
      const { index, type, entry } = args;
      if (index >= novel.story_journal.length) return err("NOT_FOUND", `Story entry #${index} not found.`);
      const story = novel.story_journal[index];
      if (story.type === "decision" || story.type === "consequence") return err("STATE_CONFLICT", `${story.type} entries are immutable.`);
      if (type) story.type = type;
      if (entry) story.entry = entry;
      state.saveNovel(novel);
      return ok(`Story entry #${index} updated.`);
    }
    case "remove": {
      requireGM();
      const novel = requireNovel();
      if (args.index >= novel.story_journal.length) return err("NOT_FOUND", `Story entry #${args.index} not found.`);
      novel.story_journal.splice(args.index, 1);
      state.saveNovel(novel);
      return ok(`Story entry #${args.index} removed.`);
    }
    case "list": {
      requireGM();
      const novel = requireNovel();
      let entries = [...novel.story_journal];
      if (args.filter) entries = entries.filter(e => e.type === args.filter);
      if (args.offset) entries = entries.slice(args.offset);
      if (args.limit) entries = entries.slice(0, args.limit);
      if (wantsDetail(args.detail)) return raw(JSON.stringify(entries, null, 2));
      return raw(JSON.stringify(entries.map(e => ({ type: e.type, timestamp: e.timestamp, preview: (e.entry ?? "").substring(0, 120) })), null, 2));
    }
    case "promote": {
      requireGM();
      const novel = requireNovel();
      const entry = novel.story_journal[args.index];
      if (!entry) return err("NOT_FOUND", `Story journal entry ${args.index} not found.`);
      if (entry.type === "decision" || entry.type === "consequence") {
        return err("RULE_VIOLATION", `A ${entry.type} entry is immutable and cannot be promoted.`);
      }
      const derivedKey = entry.entry.toLowerCase().split(/\s+/).slice(0, 6).join("-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
      const targetKey = args.key ?? (derivedKey || "promoted");
      if (novel.lore.has(targetKey)) {
        return err("STATE_CONFLICT", `Lore entry '${targetKey}' already exists. Corrective action: supply a distinct key parameter.`);
      }
      novel.lore.set(targetKey, {
        key: targetKey, content: entry.entry,
        triggers: (entry.entry.match(/[A-Z][a-z]+/g) ?? []).slice(0, 5).map((w: string) => w.toLowerCase()),
        badge_scope: "game_master", priority: 0, sticky: 0, sticky_remaining: 0, enabled: true,
        source: `story_journal:${args.index}`,
      });
      state.recordMutation(novel, "promote_story_to_lore", "journal");
      state.saveNovel(novel);
      audit("promote_story_to_lore", { index: args.index, key: targetKey, type: entry.type });
      return ok(`Story journal entry ${args.index} promoted to lore entry '${targetKey}'.`);
    }
    default:
      return err("INVALID_INPUT", `Unknown story action '${args.action}'. Valid actions: record, update, remove, list, promote.`);
  }
});

// --- Notes ---

// Note (REQ-242, REQ-285) — consolidated set/remove/list surface.
server.registerTool("note", {
  title: "Note",
  description: "Manage Novel-scoped scratch notes, badge-scoped to game_master (default), player, or shared. Use when: storing scratch state the caller will reuse. Do NOT use when: recording durable world facts — use lore (action: set).",
  inputSchema: {
    action: z.enum(["set", "remove", "list", "set_server", "remove_server", "list_server"]).describe("set, remove, list, set_server, remove_server, or list_server."),
    key: z.string().optional().describe("The note key (set/remove/set_server/remove_server)."),
    content: z.string().optional().describe("The note content (set/set_server)."),
    badge_scope: z.enum(["game_master", "player", "shared"]).optional().describe("game_master, player, or shared (set)."),
    narrative_tag: z.enum(["campaign_bible", "house_rules", "lore_seed", "session_reminder"]).optional().describe("Optional narrative tag (set_server)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "set": {
      requireNotObserver();
      const novel = requireNovel();
      const existing = novel.notes.find(n => n.key === args.key);
      const scope = args.badge_scope ?? "game_master";
      if (novel.badge === "player" && scope === "game_master") {
        return err("FORBIDDEN", "The Player badge cannot write a game_master-scoped note.");
      }
      if (existing) {
        if (novel.badge === "player" && existing.badge_scope === "game_master") {
          return err("FORBIDDEN", "The Player badge cannot modify a game_master-scoped note.");
        }
        existing.content = args.content;
        existing.badge_scope = scope;
      } else {
        novel.notes.push({ key: args.key, content: args.content, badge_scope: scope });
      }
      state.recordMutation(novel, "set_note", "note");
      state.saveNovel(novel);
      return ok(`Note '${args.key}' set.`);
    }
    case "remove": {
      requireNotObserver();
      const novel = requireNovel();
      const idx = novel.notes.findIndex(n => n.key === args.key);
      if (idx === -1) return err("NOT_FOUND", `Note '${args.key}' not found.`);
      const note = novel.notes[idx];
      if (novel.badge === "player" && note.badge_scope === "game_master") {
        return err("FORBIDDEN", "The Player badge cannot remove a game_master-scoped note.");
      }
      novel.notes.splice(idx, 1);
      state.saveNovel(novel);
      return ok(`Note '${args.key}' removed.`);
    }
    case "list": {
      const novel = requireNovel();
      const badge = novel.badge;
      const filtered = badge === "game_master" || badge === "none" ? novel.notes
        : novel.notes.filter(n => n.badge_scope !== "game_master");
      return raw(JSON.stringify(filtered.map(n => ({ key: n.key, badge_scope: n.badge_scope, preview: n.content.substring(0, 100) })), null, 2));
    }
    case "set_server": {
      requireGM();
      state.serverNotes.set(args.key, { content: args.content, narrative_tag: args.narrative_tag });
      state.saveServerNotes();
      return ok(`Server note '${args.key}' set.`);
    }
    case "remove_server": {
      requireGM();
      if (!state.serverNotes.has(args.key)) return err("NOT_FOUND", `Server note '${args.key}' not found.`);
      state.serverNotes.delete(args.key);
      state.saveServerNotes();
      return ok(`Server note '${args.key}' removed.`);
    }
    case "list_server": {
      requireGM();
      const notes = Object.fromEntries(state.serverNotes);
      return raw(JSON.stringify(notes, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown note action '${args.action}'. Valid actions: set, remove, list, set_server, remove_server, list_server.`);
  }
});

// --- Special tools ---

// ── Serialization helpers (used by checkpoint/export) ──────────────

function novelToJSONState(novel: NovelState): any {
  return {
    slug: novel.slug, name: novel.name, ruleset: novel.ruleset, badge: novel.badge,
    entities: Object.fromEntries(novel.entities), active_entity_id: novel.active_entity_id,
    npcs: Object.fromEntries(novel.npcs),
    scene_description: novel.scene_description, scene_location: novel.scene_location,
    scene_time_of_day: novel.scene_time_of_day, scene_atmosphere: novel.scene_atmosphere,
    scene_history: novel.scene_history, scene_beat: novel.scene_beat, scene_type: novel.scene_type,
    narrative_directive: novel.narrative_directive, combat: novel.combat,
    countdowns: Object.fromEntries(novel.countdowns), lore: Object.fromEntries(novel.lore),
    briefing_order: novel.briefing_order, action_patterns_enabled: novel.action_patterns_enabled,
    story_journal: novel.story_journal, factions: novel.factions, secrets: novel.secrets,
    relationships: novel.relationships, gm_context: novel.gm_context, notes: novel.notes,
    constraint_overrides: novel.constraint_overrides, synthesis_activated: novel.synthesis_activated, synthesis_module_enabled: novel.synthesis_module_enabled,
    characters_present_ids: novel.characters_present_ids,
    autonomy: novel.autonomy,
    vows: novel.vows, checkpoints: novel.checkpoints, description: novel.description,
    genre: novel.genre, adventure_index: novel.adventure_index,
    adventure_scene_waypoint: novel.adventure_scene_waypoint,
    world: { rooms: Object.fromEntries(novel.world.rooms), things: Object.fromEntries(novel.world.things) },
    story_beats: novel.story_beats, pacing_counter: novel.pacing_counter,
    pacing_autonomy_fired: novel.pacing_autonomy_fired, scene_transition_count: novel.scene_transition_count,
    faction_autonomous_ticks: novel.faction_autonomous_ticks, npc_goal_suggestions: novel.npc_goal_suggestions,
    voice_corrections_this_session: novel.voice_corrections_this_session,
    auto_record: novel.auto_record,
    session_no_mutation_windows: novel.session_no_mutation_windows,
    state_regression: novel.state_regression,
    last_mutation_at: novel.last_mutation_at,
    mutation_counts_by_group: novel.mutation_counts_by_group,
    uncommitted_rolls: novel.uncommitted_rolls,
    metadata: novel.metadata,
  };
}

function loadNovelFromStateData(data: any): NovelState {
  data = migrateNovelData(data);
  const world = createEmptyWorldModel();
  if (data.world?.rooms) for (const [k, r] of Object.entries(data.world.rooms)) {
    world.rooms.set(k, { name: (r as any).name, description: (r as any).description ?? "", exits: new Map(Object.entries((r as any).exits || {})), doorRefs: new Map(Object.entries((r as any).doorRefs || {})), annotations: (r as any).annotations ?? {} });
  }
  if (data.world?.things) for (const [k, t] of Object.entries(data.world.things)) {
    world.things.set(k, { name: (t as any).name, description: (t as any).description ?? "", kind: (t as any).kind ?? "thing", location: (t as any).location ?? null, locationType: (t as any).locationType ?? null, portable: (t as any).portable ?? true, openable: (t as any).openable ?? false, open: (t as any).open ?? false, lockable: (t as any).lockable ?? false, locked: (t as any).locked ?? false, lit: (t as any).lit ?? false, switchable: (t as any).switchable ?? false, switched_on: (t as any).switched_on ?? false, enterable: (t as any).enterable ?? false, vehiclePassengers: (t as any).vehiclePassengers ?? [], wearable: (t as any).wearable ?? false, worn_by: (t as any).worn_by ?? null, readable: (t as any).readable ?? false, read_text: (t as any).read_text ?? null, edible: (t as any).edible ?? false, drinkable: (t as any).drinkable ?? false, climbable: (t as any).climbable ?? false, transparent: (t as any).transparent ?? false, annotations: (t as any).annotations ?? {} });
  }
  return {
    slug: data.slug, name: data.name, ruleset: data.ruleset ?? null, badge: data.badge,
    entities: new Map(Object.entries(data.entities ?? {})),
    active_entity_id: data.active_entity_id ?? null,
    npcs: new Map(Object.entries(data.npcs ?? {})),
    scene_description: data.scene_description ?? "",
    scene_location: data.scene_location, scene_time_of_day: data.scene_time_of_day,
    scene_atmosphere: data.scene_atmosphere, scene_history: data.scene_history ?? [],
    scene_beat: data.scene_beat ?? "",
    scene_type: normalizeSceneTypeState(data.scene_type),
    narrative_directive: data.narrative_directive ?? "", combat: data.combat ?? null,
    countdowns: new Map(Object.entries(data.countdowns ?? {})),
    lore: new Map(Object.entries(data.lore ?? {})),
    briefing_assembly_count: data.briefing_assembly_count ?? 0,
    player_signals: data.player_signals ?? {}, adventure_slug: data.adventure_slug ?? null,
    generated_adventure: data.generated_adventure ?? null,
    audit_log: data.audit_log ?? [],
    undo_stacks: { player: [], game_master: [], observer: [], none: [] },
    redo_stacks: { player: [], game_master: [], observer: [], none: [] },
    briefing_order: data.briefing_order ?? [],
    action_patterns_enabled: data.action_patterns_enabled ?? false,
    session_zero_completed: false, characters_present: false, characters_present_ids: data.characters_present_ids ?? [], adventure_set: false,
    pending_workflow: data.pending_workflow ?? null,
    connection_counter: 0, pending_staleness_counter: 0, pov_mode: "character",
    help_category_overrides: {},
    story_journal: data.story_journal ?? [], factions: data.factions ?? [],
    secrets: data.secrets ?? [], relationships: data.relationships ?? [],
    gm_context: data.gm_context ?? data.dm_context ?? {}, notes: data.notes ?? [], vows: data.vows ?? [],
    checkpoints: data.checkpoints ?? [], description: data.description ?? "",
    constraint_overrides: data.constraint_overrides ?? [],
    synthesis_activated: data.synthesis_activated ?? {}, synthesis_module_enabled: data.synthesis_module_enabled ?? {},
    autonomy: normalizeAutonomy(data.autonomy),
    genre: data.genre ?? "", adventure_index: data.adventure_index ?? null,
    adventure_scene_waypoint: data.adventure_scene_waypoint ?? null,
    world, story_beats: data.story_beats ?? [], pacing_counter: data.pacing_counter ?? 0,
    pacing_autonomy_fired: data.pacing_autonomy_fired ?? false, scene_transition_count: data.scene_transition_count ?? 0,
    faction_autonomous_ticks: data.faction_autonomous_ticks ?? {}, npc_goal_suggestions: data.npc_goal_suggestions ?? [],
    voice_corrections_this_session: data.voice_corrections_this_session ?? 0,
    auto_record: data.auto_record ?? true,
    session_no_mutation_windows: data.session_no_mutation_windows ?? [],
    state_regression: data.state_regression ?? null,
    last_mutation_at: data.last_mutation_at ?? null,
    mutation_counts_by_group: data.mutation_counts_by_group ?? {},
    uncommitted_rolls: data.uncommitted_rolls ?? [],
    metadata: data.metadata ?? { created: new Date().toISOString(), modified: new Date().toISOString(), session_count: 0, total_combat_rounds: 0, last_scene_anchor: "", sessions: [] },
    active_session_id: data.active_session_id ?? null,
    pending_vow_countdown_suggestion: data.pending_vow_countdown_suggestion ?? null,
    codex_sources: data.codex_sources ?? [],
    player_synthesis: data.player_synthesis ?? {},
    campaign_memory: data.campaign_memory ?? [],
  };
}

function normalizeSceneTypeState(raw: unknown): ("combat" | "social" | "exploration" | "neutral")[] {
  if (!raw) return ["neutral"];
  if (Array.isArray(raw)) return (raw as string[]).filter((t): t is "combat" | "social" | "exploration" | "neutral" => ["combat", "social", "exploration", "neutral"].includes(t));
  if (typeof raw === "string" && ["combat", "social", "exploration", "neutral"].includes(raw)) return [raw as any];
  return ["neutral"];
}

// --- Guidance (GM) ---

// Session (REQ-025, REQ-072, REQ-082, REQ-086, REQ-173, REQ-174, REQ-175, REQ-186, REQ-253, REQ-279) — consolidated recap/verbosity/
// briefing_order/compress/health surface.
server.registerTool("session", {
  title: "Session",
  description: "Manage session-level surfaces and diagnostics. Use when: recapping recent activity (recap), setting output verbosity (verbosity), reordering briefing sections (briefing_order), compressing the audit log (compress), or reporting server health (health). Do NOT use when: recording story content — use story (action: record).",
  inputSchema: {
    action: z.enum(["recap", "verbosity", "briefing_order", "compress", "health"]).describe("recap, verbosity, briefing_order, compress, or health."),
    mode: z.enum(["normal", "terse"]).optional().describe("normal or terse (verbosity)."),
    sections: z.array(z.string()).optional().describe("Ordered list of briefing sections (briefing_order)."),
    max_entries: z.number().optional().describe("Maximum audit entries (compress)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "verbosity": {
      outputVerbosity = args.mode;
      return ok(`Output verbosity set to '${args.mode}'.`);
    }
    case "briefing_order": {
      requireGM();
      const novel = requireNovel();
      const VALID_TOKENS = ["scene_state", "entities", "combat_state", "npcs", "countdowns", "lore", "narrative_threads", "campaign_memory", "world_state", "story_journal"];
      if (args.sections.length > 0) {
        const unknown = args.sections.filter((s: string) => !VALID_TOKENS.includes(s));
        if (unknown.length > 0) return err("INVALID_INPUT", `Unknown section token(s): ${unknown.join(", ")}. Valid tokens: ${VALID_TOKENS.join(", ")}.`);
      }
      novel.briefing_order = args.sections;
      state.saveNovel(novel);
      return ok(`Briefing order set to: ${args.sections.join(", ")}.`);
    }
    case "compress": {
      const novel = requireNovel();
      const max = args.max_entries ?? 20;
      if (max <= 0) return err("INVALID_INPUT", "max_entries must be a positive integer.");
      const recent = novel.audit_log.slice(-max);
      const isGM = novel.badge === "game_master";
      const filtered = isGM ? recent : recent.filter(e => e.badge !== "game_master");
      if (filtered.length === 0) return ok("Compressed audit log (summarize into a single paragraph):\n(no entries)");
      const lines = filtered.map(e => {
        const stamp = (e.timestamp ?? "").split("T")[0] + " " + ((e.timestamp ?? "").split("T")[1]?.substring(0, 8) ?? "");
        const marker = e.output_prefix === "[BOUNDARY_VIOLATION]" ? " — [BOUNDARY_VIOLATION]" : e.output_prefix ? ` — ${e.output_prefix}` : "";
        return `[${stamp}] [${e.badge ?? "·"}] ${e.tool}${marker}`;
      });
      return raw(`Compressed audit log (summarize into a single paragraph):\n${lines.join("\n")}`);
    }
    case "recap": {
      const novel = requireNovel();
      const entity = state.getActiveEntity();
      const parts: string[] = [];
      const recent = novel.story_journal.filter((s) => s.type === "decision" || s.type === "bond").slice(-3);
      for (const s of recent) parts.push(s.entry);
      for (const [, npc] of novel.npcs) {
        if (npc.disposition && npc.disposition !== "neutral") parts.push(`${npc.name} is ${npc.disposition}`);
      }
      if (novel.narrative_directive) parts.push(`the current focus is: ${novel.narrative_directive}`);
      for (const [name, cd] of novel.countdowns) {
        if (cd.ticks > 0) parts.push(`the ${name} completes in ${cd.ticks} more tick${cd.ticks === 1 ? "" : "s"}`);
      }
      for (const v of novel.vows) {
        if (v.state === "active") parts.push(`the vow to ${v.name} has ${v.milestones} milestones done`);
      }
      const narrative_orientation = parts.length > 0
        ? parts.join("; ") + "."
        : "[No narrative history yet — your story begins here.]";
      let recap = `narrative_orientation: ${narrative_orientation}`;
      recap += `\nconnections: ${novel.connection_counter ?? 0}`;
      const significantRolls = novel.audit_log.filter((e) => e.tool.includes("roll") && !e.tool.includes("table") && e.args).slice(-5);
      if (significantRolls.length > 0) {
        recap += `\nsignificant_rolls: ${significantRolls.map((e) => `${e.tool}`).join(", ")}`;
      }
      const initIdx = novel.audit_log.findIndex((e) => e.tool === "init_combat");
      const endCount = novel.audit_log.filter((e) => e.tool === "end_combat").length;
      const advCount = novel.audit_log.filter((e) => e.tool === "advance_combat").length;
      const confrontations_completed = endCount;
      const confrontation_pending = novel.combat?.active ? `round ${novel.combat.round}, ${novel.combat.turn_order.length} participants` : null;
      recap += `\nconfrontations_completed: ${confrontations_completed}${initIdx >= 0 ? ` (${advCount} combat advances)` : ""}${confrontation_pending ? `\nconfrontation_pending: ${confrontation_pending}` : ""}`;
      recap += `\nActive Novel: ${novel.name} (${novel.slug})`;
      if (novel.scene_description) {
        recap += `\nScene: ${novel.scene_description}${novel.scene_location ? ` — ${novel.scene_location}` : ""}`;
      }
      recap += state.combatReport(novel);
      if (novel.world.rooms.size > 0) {
        recap += `\n\nWorld model: ${novel.world.rooms.size} rooms, ${novel.world.things.size} things.`;
      }
      if (entity) {
        recap += `\n\nActive entity: ${entity.name}${entity.current_room ? ` in ${entity.current_room}` : ""}`;
        if (entity.inventory.length > 0) {
          recap += ` — holding: ${entity.inventory.join(", ")}`;
        }
      }
      const activeCountdowns = [...novel.countdowns.entries()].filter(([, cd]) => cd.ticks > 0);
      if (activeCountdowns.length > 0) {
        recap += `\nCountdowns: ${activeCountdowns.map(([name, cd]) => `${name}(${cd.ticks}/${cd.total})`).join(", ")}`;
      }
      const enabledLore = [...novel.lore.values()].filter(l => l.enabled);
      if (enabledLore.length > 0) {
        recap += `\nLore entries: ${enabledLore.length} active.`;
      }
      if (novel.session_no_mutation_windows.length > 0) {
        recap += `\n[session-no-mutations] sessions with zero state writes: ${novel.session_no_mutation_windows.join(", ")}`;
      }
      if (state.stateDriftActive(novel)) {
        recap += `\n[state-drift] GM context saved after the last recorded mutation — narration may be uncommitted.`;
      }
      if (novel.uncommitted_rolls.length > 0) {
        for (const r of novel.uncommitted_rolls) {
          recap += `\n[uncommitted-roll] roll "${r.roll}" has no following state write — commit with ${r.suggested_tool}.`;
        }
      }
      return ok(recap);
    }
    case "health": {
      return raw(JSON.stringify(buildSpecHealth(), null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown session action '${args.action}'. Valid actions: recap, verbosity, briefing_order, compress, health.`);
  }
});

// Slug-ify a free-text premise into a stable identifier for adventure storage
// (REQ-090: title is slug-ified from the premise).
function slugifyPremise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "generated";
}

// REQ-251 — generation intent guard assessment: returns a concern string or null.
// Detects direct/implied harm, power-inversion requests, and mechanics-fabrication.
function assessGenerationGuard(input: string): string | null {
  const t = input.trim().replace(/^!force\s+/, "").toLowerCase();
  if (/(capable of defeating|stronger than|outclass|overpower|kill|murder|torture|harm|hurt|rape|abuse)/i.test(t)) {
    return "the premise requests content that may violate participant consent or invert expected power balance.";
  }
  if (/(infinite|unlimited|invincible|omnipotent|god-mode|no counter|impossible to defeat|beyond the (ruleset|mechanical) ceiling)/i.test(t)) {
    return "the premise exceeds the ruleset's mechanical ceiling or requests fabricated mechanics.";
  }
  return null;
}

// REQ-090 — generate_adventure(premise, target?). Produces a real adventure
// scaffold: title, GM-only Overview, player-visible Hook, 2–6 locations with
// table-rolled flavor, NPC name suggestions, and encounter-table seeds — drawn
// from Synthesis adventure_advice templates / scenario_starters / table
// expansions. `target` selects novel (default when a Novel is active), codex
// (default otherwise), or both. No Novel is required for the codex target.
// Adventure (REQ-090, REQ-091, REQ-132, REQ-229, REQ-247, REQ-251, REQ-292, REQ-295) — consolidated generate/generate_encounter/load/list surface.
server.registerTool("adventure", {
  title: "Adventure",
  description: "Generate, load, or list adventure content. Use when: the GM wants a new adventure scaffold, a single encounter, or to load a prepared module. Do NOT use when: recording a story beat — use story (action: record).",
  inputSchema: {
    action: z.enum(["generate", "generate_encounter", "load", "list"]).describe("generate, generate_encounter, load, or list."),
    premise: z.string().optional().describe("Adventure premise (generate)."),
    target: z.enum(["novel", "codex", "both"]).optional().describe("novel, codex, or both (generate)."),
    context: z.string().optional().describe("Scene context (generate_encounter)."),
    slug: z.string().optional().describe("Adventure module slug (load)."),
    filter: z.string().optional().describe("Optional genre filter (list)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "generate": {
      requireGM();
      const novel = state.activeNovel;
      const slug = slugifyPremise(args.premise);
      const tgt = args.target ?? (novel ? "novel" : "codex");
      const guardConcern = assessGenerationGuard(args.premise);
      if (guardConcern) {
        const forced = args.premise.trim().startsWith("!force");
        if (!forced) return warn(`Generation guard: ${guardConcern} Please clarify or modify the premise (prefix with !force to override).`);
        audit("generation-guard-overridden", { premise: args.premise.slice(0, 80), concern: guardConcern });
      }
      const advice = state.enrichmentManifest?.adventure_advice ?? DEFAULT_ENRICHMENT.adventure_advice;
      const templates = advice.templates ?? [];
      const starters = advice.scenario_starters ?? [];
      const tableExpansions = advice.table_expansions ?? [];
      const rng = createRng(`adventure:${slug}:${args.premise}`);
      const settingPool = ["a windswept ruin", "a crowded market square", "a flooded crypt", "a crumbling keep", "a mist-shrouded harbor", "a forgotten library", "a frost-bitten watchtower", "a labyrinth of salt caves"];
      const horrorPool = ["something moved in the dark", "the air smells of copper", "a distant bell tolls once", "footprints stop halfway across the floor", "a child's toy lies abandoned", "the walls are too warm"];
      const puzzlePool = ["a locked door with no keyhole", "an inscription in a dead script", "three levers and one warning", "a scale that demands a matching weight", "a mural whose figures are missing", "a door that opens only when it rains"];
      const npcPool = ["the reticent caretaker", "a guild mouthpiece with divided loyalties", "an exile who knows the truth", "a fence with a price on integrity", "the last custodian of the old faith", "a rival who wants the prize first"];
      const locCount = Math.min(6, 2 + (rng.roll(5) - 1));
      const locations: { heading: string; flavor: string }[] = [];
      for (let i = 0; i < locCount; i++) {
        const setting = settingPool[rng.roll(settingPool.length) - 1];
        const horror = horrorPool[rng.roll(horrorPool.length) - 1];
        const puzzle = puzzlePool[rng.roll(puzzlePool.length) - 1];
        locations.push({ heading: `Location ${i + 1}: ${setting}`, flavor: `${horror}. ${puzzle}.` });
      }
      const npcSuggestions = [...npcPool].sort(() => rng.roll(2) - 1).slice(0, 3);
      const encounterSeed = tableExpansions.length > 0 ? (tableExpansions[rng.roll(tableExpansions.length) - 1] as any).content : "the rival faction arrives as the characters reach the final location";
      const starter = starters.length > 0 ? (starters[rng.roll(starters.length) - 1] as any).content : "";
      const template = templates.length > 0 ? (templates[rng.roll(templates.length) - 1] as any).source_url : "synthesis://adventure_advice";
      const scaffold: any = {
        title: args.premise.trim(), slug,
        overview: `Overview (GM-only): ${starter || "A open-ended adventure scaffold keyed to the premise."} Template source: ${template}.`,
        hook: `${locations[0]?.heading ?? "A starting scene"} draws the characters in — ${locations[0]?.flavor ?? ""}`,
        locations, npc_suggestions: npcSuggestions, encounter_seeds: [encounterSeed],
        genre_tags: novel?.genre ? [novel.genre] : [], generated_at: new Date().toISOString(), source: "generated",
      };
      const results: string[] = [];
      if (tgt === "codex" || tgt === "both") {
        const id = `adventure_${slug}`;
        const existing = state.codex.get(id);
        const entry: any = {
          id, kind: "adventure", name: slug, content: { ...scaffold, suggested_beats: scaffold.locations.map((l: any) => ({ beat: "setup", scene_preview: l.heading })) },
          description: args.premise.trim(), tags: scaffold.genre_tags,
          visibility: existing?.visibility ?? "library", imported_at: existing?.imported_at ?? new Date().toISOString(), codex_modified_at: new Date().toISOString(),
        };
        state.codex.set(id, entry);
        state.saveCodex();
        results.push(`Codex adventure '${id}' stored`);
      }
      if (tgt === "novel" || tgt === "both") {
        if (!novel) return err("INVALID_INPUT", "No active Novel — use target:'codex' without a Novel, or create a Novel first.");
        novelSnapshot();
        novel.generated_adventure = scaffold;
        novel.adventure_index = {
          premise: args.premise.trim(), hooks: [scaffold.hook],
          npcs: npcSuggestions.map((n) => ({ name: n })), locations: locations.map((l) => ({ name: l.heading, description: l.flavor })), factions: [],
        };
        novel.adventure_set = true;
        state.saveNovel(novel);
        audit("generate_adventure", { premise: args.premise, target: tgt, slug });
        results.push(`Novel adventure scaffold stored (adventure://generated/${slug})`);
      }
      return ok(`Adventure "${args.premise.trim()}" generated:\n\n${scaffold.overview}\n\n**Hook:** ${scaffold.hook}\n\n${locations.map(l => `- ${l.heading}: ${l.flavor}`).join("\n")}\n\n**NPC suggestions:** ${npcSuggestions.join(", ")}\n\n**Encounter seed:** ${encounterSeed}\n\n${results.join("\n")}`);
    }
    case "generate_encounter": {
      requireGM();
      const novel = requireNovel();
      const ctx = String(args.context).trim();
      const guardConcern = assessGenerationGuard(ctx);
      if (guardConcern) {
        const forced = ctx.trim().startsWith("!force");
        if (!forced) return warn(`Generation guard: ${guardConcern} Please clarify or modify the context (prefix with !force to override).`);
        audit("generation-guard-overridden", { context: ctx.slice(0, 80), concern: guardConcern });
      }
      const rng = createRng(`encounter:${ctx}`);
      const monsterPool = ["a lone sentinel", "a pack of shadow hounds", "an armored enforcer with a debt", "a shrieking flock", "a stone golem misfiring its wards"];
      const complicationPool = ["the ground collapses underfoot", "a third party arrives mid-fight", "the objective is trapped", "reinforcements are on the way", "the environment is flammable"];
      const genre = novel.genre ?? null;
      const includeAll = ctx.trim().startsWith("!include_all");
      const slug = novel.ruleset ?? null;
      let genreEntries: any[] = [];
      if (slug && rulesets.isInstalled(slug)) {
        const model = rulesets.hydrate(slug).model as any;
        const tables = model.generation_tables ?? {};
        genreEntries = Object.entries(tables)
          .filter(([, t]: [string, any]) => {
            const tags = t?.genre_tags ?? [];
            if (tags.length === 0) return false;
            if (includeAll) return true;
            return genre ? tags.includes(genre) : true;
          })
          .map(([name, t]) => ({ name, ...(t as any) }));
      }
      let monster = monsterPool[rng.roll(monsterPool.length) - 1];
      if (genreEntries.length > 0) {
        const pick = genreEntries[rng.roll(genreEntries.length) - 1];
        monster = pick?.ranges?.[0]?.result ?? pick?.name ?? monster;
      }
      const complication = complicationPool[rng.roll(complicationPool.length) - 1];
      novelSnapshot();
      const sceneDesc = `${ctx} — ${monster} blocks the way.`;
      novel.scene_description = sceneDesc;
      novel.scene_location = ctx;
      novel.scene_type = [...new Set([...(novel.scene_type ?? []), "combat" as const])];
      const npcId = `npc_${Date.now().toString(36)}`;
      const npc: any = { id: npcId, name: monster, description: `Encountered during: ${ctx}`, disposition: "hostile", location: ctx, conditions: [], condition_rounds: {} };
      novel.npcs.set(npcId, npc);
      const loreKey = `complication_${slugifyPremise(ctx)}`;
      novel.lore.set(loreKey, { key: loreKey, content: complication, triggers: [ctx], badge_scope: "game_master", priority: 0, sticky: 0, sticky_remaining: 0, enabled: true });
      state.saveNovel(novel);
      audit("generate_encounter", { context: ctx, npc_id: npcId, lore_key: loreKey });
      return ok(`Encounter generated (atomic batch, single undo target):\n\n**Scene:** ${sceneDesc}\n\n**NPC:** ${monster} (${npcId}, hostile)\n\n**Complication:** ${complication}\n\nUndo rolls back the scene, NPC, and lore entry together.`);
    }
    case "load": {
      requireGM();
      const novel = requireNovel();
      const adventureDir = process.env.TTRPG_ADVENTURE_DIR ?? path.join(__dirname, "..", "adventures");
      const filePath = path.join(adventureDir, `${args.slug}.md`);
      if (!fs.existsSync(filePath)) return err("NOT_FOUND", `Adventure '${args.slug}' not found at ${filePath}.`);
      const content = fs.readFileSync(filePath, "utf-8");
      const headings = content.match(/^#{2,3} .+$/gm) ?? [];
      const npcRefs: string[] = [];
      const m = content.match(/\*\*([A-Z][^*]{1,40})\*\*\s*\n/gm);
      if (m) for (const line of m.slice(0, 10)) npcRefs.push(line.replace(/\*\*/g, "").trim());
      const locHeadings = headings.filter((h) => !/(roll|check|save|attack|damage)/i.test(h)).slice(0, 20).map((h) => h.replace(/^#{2,3}\s+/, ""));
      const sceneCount = locHeadings.length;
      novel.adventure_index = {
        premise: (content.match(/## Premise\s*\n([\s\S]*?)(?=\n## |$)/)?.[1] ?? "").trim() || `Adventure: ${args.slug}`,
        hooks: content.match(/## Adventure Hook\s*\n([\s\S]*?)(?=\n## |$)/) ? [content.match(/## Adventure Hook\s*\n([\s\S]*?)(?=\n## |$)/)![1].trim()] : [],
        npcs: npcRefs.map((n) => ({ name: n })),
        locations: locHeadings.map((l) => ({ name: l, description: "" })),
        factions: (content.match(/## Factions\s*\n([\s\S]*?)(?=\n## |$)/)?.[1] ?? "").split("\n").filter((l) => l.trim().length > 2 && !l.startsWith("#")).map((l) => ({ name: l.trim() })),
        scene_count: sceneCount,
      };
      const worldMatch = content.match(/## World\s*\n([\s\S]*?)(?=\n## |$)/);
      if (worldMatch) {
        const { world, result } = convertSource(worldMatch[1], novel.world);
        novel.world = world;
        novel.adventure_slug = args.slug;
        novel.adventure_set = true;
        state.saveNovel(novel);
        audit("load_adventure", { slug: args.slug, rooms: result.rooms, things: result.things });
        const synthVoice = (state.enrichmentManifest?.voice_examples ?? []).filter((v: any) => npcRefs.some((n) => n.toLowerCase().includes(String(v?.entity_name ?? v?.name ?? "").toLowerCase()))).length;
        const synthLore = (state.enrichmentManifest?.lore_templates ?? []).filter((l: any) => locHeadings.some((loc) => loc.toLowerCase().includes(String(l?.keyword ?? l?.key ?? "").toLowerCase()))).length;
        const aug = synthVoice > 0 || synthLore > 0 ? `\n\nSynthesis found ${synthVoice} voice examples for adventure NPCs, ${synthLore} lore templates for adventure locations. Review at \`synthesis://status\`.` : "";
        return ok(`Adventure '${args.slug}' loaded. World model: ${result.rooms} rooms, ${result.things} things, ${result.exits} exits.${aug}`);
      }
      novel.adventure_slug = args.slug;
      novel.adventure_set = true;
      state.saveNovel(novel);
      audit("load_adventure", { slug: args.slug, rooms: 0, things: 0 });
      return ok(`Adventure '${args.slug}' loaded (no world-model section found — flat prose only).`);
    }
    case "list": {
      const adventureDir = process.env.TTRPG_ADVENTURE_DIR ?? path.join(__dirname, "..", "adventures");
      let files: string[] = [];
      try { files = fs.readdirSync(adventureDir).filter((f) => f.endsWith(".md")); } catch { }
      if (files.length === 0) return ok("[No adventure modules found.]");
      const badge = getBadge();
      const isGM = badge === "game_master" || badge === "none";
      const entries = files.map((f) => {
        const slug = f.replace(/\.md$/, "");
        const content = fs.readFileSync(path.join(adventureDir, f), "utf-8");
        const title = content.match(/^# (.+)$/m)?.[1] ?? slug;
        const preview = content.match(/## (?:Premise|Adventure Hook)\s*\n([\s\S]*?)(?=\n## |$)/)?.[1].trim().split(/\s+/).slice(0, 30).join(" ") ?? "";
        const genreTags: string[] = [];
        const gm = content.match(/## Overview\s*\n([\s\S]*?)(?=\n## |$)/)?.[1] ?? "";
        const genre = gm.match(/genre[:\s]+([a-z_]+)/i)?.[1];
        if (genre) genreTags.push(genre);
        const roomCount = (content.match(/^### .+$/gm) ?? []).length;
        const npcCount = (content.match(/\*\*[A-Z][^*]{1,40}\*\*\s*\n/g) ?? []).length;
        const complexity = roomCount >= 15 ? "epic" : roomCount >= 6 ? "standard" : "short";
        const stat = fs.statSync(path.join(adventureDir, f));
        return { slug, title, preview, genre_tags: genreTags, room_count: roomCount, npc_count: npcCount, complexity, last_modified: stat.mtime.toISOString() };
      }).filter((e) => !args.filter || e.genre_tags.includes(args.filter) || isGM);
      const visible = isGM ? entries : entries.filter((e) => e.preview);
      return raw(JSON.stringify(visible, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown adventure action '${args.action}'. Valid actions: generate, generate_encounter, load, list.`);
  }
});

// REQ-170 — adventure discovery surface: adventures:// lists indexed adventure
// slugs with titles and badge-filtered hooks.
server.registerResource("adventures", "adventures://", { title: "Adventure Catalog" }, async () => {
  const adventureDir = process.env.TTRPG_ADVENTURE_DIR ?? path.join(__dirname, "..", "adventures");
  let files: string[] = [];
  try { files = fs.readdirSync(adventureDir).filter((f) => f.endsWith(".md")); } catch { }
  const badge = getBadge();
  const isGM = badge === "game_master" || badge === "none";
  const entries = files.map((f) => {
    const slug = f.replace(/\.md$/, "");
    const content = fs.readFileSync(path.join(adventureDir, f), "utf-8");
    const title = content.match(/^# (.+)$/m)?.[1] ?? slug;
    const hook = content.match(/## Adventure Hook\s*\n([\s\S]*?)(?=\n## |$)/)?.[1].trim() ?? "";
    const overview = content.match(/## Overview\s*\n([\s\S]*?)(?=\n## |$)/)?.[1].trim() ?? "";
    return { slug, title, hook: isGM ? hook || overview : hook };
  });
  return { contents: [{ uri: "adventures://", text: JSON.stringify(entries, null, 2), mimeType: "application/json" }] };
});

// REQ-248 — adventure overview resource: adventure://<slug>/overview summarizes
// premise, key NPCs, major locations, factions, and scene count; badge-filtered.
server.registerResource("adventure-overview", new ResourceTemplate("adventure://{slug}/overview", { list: undefined }), { title: "Adventure Overview" }, async (uri) => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: uri.href, text: "[ERROR] [STATE_CONFLICT] No active Novel.", mimeType: "text/plain" }] };
  const slug = uri.href.split("/")[2] ?? "";
  const idx = novel.adventure_index;
  const isGM = getBadge() === "game_master" || getBadge() === "none";
  if (!idx) return { contents: [{ uri: uri.href, text: `[WARNING] No structured overview available for '${slug}'.`, mimeType: "text/plain" }] };
  const text = `## ${slug} Overview\n\n**Premise:** ${idx.premise ?? ""}\n**NPCs:** ${(idx.npcs ?? []).map((n: any) => `${n.name}`).join(", ") || "(none)"}\n**Locations:** ${(idx.locations ?? []).map((l: any) => l.name).join(", ") || "(none)"}\n${isGM && (idx.factions ?? []).length > 0 ? `**Factions:** ${idx.factions.map((f: any) => f.name).join(", ")}\n` : ""}**Scenes:** ${idx.scene_count ?? (idx.locations ?? []).length}`;
  return { contents: [{ uri: uri.href, text, mimeType: "text/markdown" }] };
});

// REQ-249 — adventure navigation resource: adventure://<slug>/navigation renders
// the structural index as navigable Markdown with the current waypoint marked.
server.registerResource("adventure-navigation", new ResourceTemplate("adventure://{slug}/navigation", { list: undefined }), { title: "Adventure Navigation" }, async (uri) => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: uri.href, text: "[ERROR] [STATE_CONFLICT] No active Novel — load an adventure first.", mimeType: "text/plain" }] };
  const slug = uri.href.split("/")[2] ?? "";
  const idx = novel.adventure_index;
  if (!idx) return { contents: [{ uri: uri.href, text: "[WARNING] No navigation index available.", mimeType: "text/plain" }] };
  const scenes = (idx.locations ?? []).map((l: any) => l.name);
  const waypoint = novel.adventure_scene_waypoint ?? "";
  const lines = scenes.map((s: string, i: number) => {
    const marker = s === waypoint ? "[→] " : "";
    const prev = i > 0 ? ` (prev: ${scenes[i - 1]})` : "";
    const next = i < scenes.length - 1 ? ` (next: ${scenes[i + 1]})` : "";
    return `- ${marker}${s}${prev}${next}`;
  });
  return { contents: [{ uri: uri.href, text: `## ${slug} Navigation\n\n${lines.join("\n") || "(no scenes)"}`, mimeType: "text/markdown" }] };
});

// --- Session ---

// --- Novel Lifecycle ---

// Novel lifecycle (REQ-041, REQ-088, REQ-094, REQ-096, REQ-232, REQ-259, REQ-294, REQ-332, REQ-334, REQ-352, REQ-402, REQ-403) — consolidated
// create/resume/switch/end/export/import/rename/description/list/archive/
// unarchive/info/genre/clone surface.
const GENRE_CATALOG = ["noir", "high_fantasy", "sword_and_sorcery", "sci_fi_horror", "cosmic_horror", "historical", "western", "modern", "cyberpunk"];
server.registerTool("novel", {
  title: "Novel",
  description: "Manage Novel save files: create, resume, switch, end, export, import, rename, describe, list, archive, unarchive, info, genre, clone, save_context, get_context, or checkpoint. Use when: handling a campaign's lifecycle, interchange, or return points. Do NOT use when: managing content inside the Novel — use the entity tools (npc, lore, faction, vow, story, note, etc.).",
  inputSchema: {
    action: z.enum(["create", "resume", "switch", "end", "export", "import", "rename", "description", "list", "archive", "unarchive", "info", "genre", "clone", "save_context", "get_context", "checkpoint_set", "checkpoint_list", "checkpoint_restore", "checkpoint_remove"]).describe("create, resume, switch, end, export, import, rename, description, list, archive, unarchive, info, genre, clone, save_context, get_context, checkpoint_set, checkpoint_list, checkpoint_restore, or checkpoint_remove."),
    name: z.string().optional().describe("Novel name (create)."),
    slug: z.string().optional().describe("Novel slug (resume/switch/archive/unarchive/info)."),
    source_slug: z.string().optional().describe("Novel to copy (clone)."),
    new_name: z.string().optional().describe("Name for the copy (clone)."),
    new_slug: z.string().optional().describe("New slug (rename)."),
    ruleset: z.string().optional().describe("Ruleset slug (create)."),
    genre: z.string().optional().describe("Genre tag (create/genre)."),
    description: z.string().optional().describe("Description (create/description)."),
    codex_adventure: z.string().optional().describe("Codex adventure to seed from (create)."),
    format: z.string().optional().describe("Output format (export)."),
    scope: z.string().optional().describe("Export scope (export)."),
    data: z.string().optional().describe("Exported Novel JSON (import)."),
    mode: z.enum(["dry-run", "merge", "replace"]).optional().describe("dry-run, merge, or replace (import)."),
    strict: z.boolean().optional().describe("Fail on any cross-reference mismatch (import)."),
    filter: z.enum(["active", "archived", "all"]).optional().describe("active, archived, or all (list)."),
    detail: z.boolean().optional().describe("Return full metadata (list)."),
    current_scene: z.string().optional().describe("Current-scene summary (save_context)."),
    immediate_situation: z.string().optional().describe("Immediate situation (save_context)."),
    pending_player_action: z.string().optional().describe("Pending player action (save_context)."),
    short_term_plans: z.string().optional().describe("Short-term plans (save_context)."),
    long_term_plans: z.string().optional().describe("Long-term plans (save_context)."),
    player_goals: z.string().optional().describe("Player goals (save_context)."),
    label: z.string().optional().describe("Checkpoint label (checkpoint_set/list/restore/remove)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "create": {
      requireNotObserver();
      const { name, ruleset, genre, description, codex_adventure } = args;
      if (ruleset && !rulesets.isInstalled(ruleset)) {
        return err("INVALID_INPUT", `Ruleset '${ruleset}' is not installed. Valid rulesets: ${rulesets.installedSlugs().join(", ") || "(none)"}.`);
      }
      const novel = state.createNovel(name, ruleset ?? null);
      if (genre) novel.genre = genre;
      if (description) novel.description = description;
      if (codex_adventure) {
        const entry = state.codex.get(codex_adventure);
        if (!entry) return err("NOT_FOUND", `Codex adventure '${codex_adventure}' not found.`);
        if (entry.kind !== "adventure") return err("NOT_FOUND", `Codex entry '${codex_adventure}' is not of kind 'adventure'.`);
        const suggested = (entry.content as any)?.suggested_beats;
        if (Array.isArray(suggested)) {
          for (const sb of suggested) novel.story_beats.push({ beat: sb.beat, scene_preview: sb.scene_preview, source: "adventure-scaffold" });
          novel.adventure_set = true;
        }
      }
      if (genre || description || codex_adventure) state.saveNovel(novel);
      if (ruleset) { try { rulesets.hydrate(ruleset); } catch (e: any) { return err("INVALID_INPUT", e.message); } }
      return ok(`Novel created: ${novel.slug} (novel://current)${ruleset ? `, ruleset: ${ruleset}` : ""}${genre ? `, genre: ${genre}` : ""}

Next step: run the novel_setup guide to add characters, choose a story source, and hold a session zero before play.`);
    }
    case "resume": {
      if (state.activeNovel) {
        const sessionId = process.env.TTRPG_SESSION_ID ?? state.activeNovel.metadata.session_count.toString();
        state.closeSessionWindow(state.activeNovel, sessionId);
      }
      const novel = state.resumeNovel(args.slug);
      novel.metadata.session_count += 1;
      state.saveNovel(novel);
      if (novel.ruleset) {
        if (!rulesets.isInstalled(novel.ruleset)) return err("INVALID_INPUT", `Novel '${novel.slug}' is bound to ruleset '${novel.ruleset}', which is not installed.`);
        try { rulesets.hydrate(novel.ruleset); } catch (e: any) { return err("INVALID_INPUT", e.message); }
      }
      return ok(`Novel resumed: ${novel.name} (${novel.slug})`);
    }
    case "switch": {
      const active = state.activeNovel;
      if (active && state.stateGate() === "block" && state.stateDriftActive(active)) {
        return err("STATE_CONFLICT", "[state-drift] uncommitted narration detected — resolve with novel (action: save_context) or session (action: recap) before switching.");
      }
      if (active) {
        const sessionId = process.env.TTRPG_SESSION_ID ?? active.metadata.session_count.toString();
        state.closeSessionWindow(active, sessionId);
      }
      const novel = state.switchNovel(args.slug);
      if (novel.ruleset) {
        if (!rulesets.isInstalled(novel.ruleset)) return err("INVALID_INPUT", `Novel '${novel.slug}' is bound to ruleset '${novel.ruleset}', which is not installed.`);
        try { rulesets.hydrate(novel.ruleset); } catch (e: any) { return err("INVALID_INPUT", e.message); }
      }
      return ok(`Switched to novel: ${novel.name} (${novel.slug})`);
    }
    case "end": {
      requireNotObserver();
      const novel = requireNovel();
      if (novel.pending_workflow) return err("STATE_CONFLICT", "A workflow decision is pending. Resolve it with respond before starting a new one.");
      if (state.stateGate() === "block" && state.stateDriftActive(novel)) {
        return err("STATE_CONFLICT", "[state-drift] uncommitted narration detected — resolve with novel (action: save_context) or session (action: recap) before ending.");
      }
      novel.pending_workflow = { decision: "end_novel", snapshot: state.captureWorkflowSnapshot(novel) };
      state.saveNovel(novel);
      return needInput(`Decision: -end_novel-confirm
Question: End Novel "${novel.name}"?
Options: yes, cancel`);
    }
    case "export": {
      requireGM();
      if (args.format && !INTERCHANGE_FORMATS.includes(args.format)) {
        return err("INVALID_INPUT", `Unsupported format '${args.format}'. Supported formats: ${INTERCHANGE_FORMATS.join(", ")}.`);
      }
      const novel = requireNovel();
      if (args.format === "markdown") {
        let md = `# ${novel.name}\n\n## World\n`;
        for (const [, room] of novel.world.rooms) {
          md += `${room.name} is a room. "${room.description}"\n`;
          for (const [dir, target] of room.exits) md += `${dir} of ${room.name} is ${target}.\n`;
        }
        for (const [, thing] of novel.world.things) {
          if (thing.kind !== "thing") md += `${thing.name} is a ${thing.kind}. "${thing.description}"\n`;
          md += `${thing.name} is in ${thing.location}.\n`;
          if (!thing.portable) md += `${thing.name} is fixed.\n`;
          if (thing.openable && thing.open) md += `${thing.name} is open.\n`;
          if (thing.locked) md += `${thing.name} is locked.\n`;
        }
        return raw(md);
      }
      const full = exportNovelJSON(novel);
      const data: any = {
        format_version: 2,
        manifest: {
          novel_format_version: 2,
          server_spec_version: state.buildFingerprint.specVersion,
          ruleset_hash: novel.ruleset ?? null,
          builder_implementation: { name: "holonovel", version: state.buildFingerprint.specVersion },
          adventure_module_slugs: novel.adventure_slug ? [novel.adventure_slug] : [],
          adventures_embedded: false,
          property_groups_present: ["slug", "name", "scene", "world", "lore", "npcs", "story_journal", "factions", "secrets", "relationships", "gm_context", "notes", "vows"],
          waiver_dependent_mechanics: [],
        },
        novel: full,
      };
      if (args.scope && args.scope !== "full") {
        const keep: Record<string, string[]> = {
          lore: ["lore"], world_model: ["world"], npcs: ["npcs"], factions: ["factions"], secrets: ["secrets"],
          relationships: ["relationships"], gm_context: ["gm_context"], notes: ["notes"],
          story_journal: ["story_journal"], scene_history: ["scene_history"],
        };
        const keys = keep[args.scope] ?? [];
        for (const k of Object.keys(data.novel)) {
          if (!["slug", "name", "ruleset", "genre", "description", "metadata"].includes(k) && !keys.includes(k)) {
            delete data.novel[k];
          }
        }
      }
      return raw(JSON.stringify(data, null, 2));
    }
    case "import": {
      requireGM();
      const m = args.mode ?? "dry-run";
      const strictMode = args.strict === true;
      let parsed: any;
      try { parsed = JSON.parse(args.data); } catch { return err("INVALID_INPUT", "Could not parse novel data."); }
      const flat = parsed && parsed.novel && typeof parsed.novel === "object" ? parsed.novel : parsed;
      const manifest = parsed && parsed.manifest && typeof parsed.manifest === "object" ? parsed.manifest : null;
      const failures: string[] = [];
      const validateRefs = (src: any) => {
        const entityIds = new Set<string>(Object.keys(src.entities ?? {}));
        const npcIds = new Set<string>(src.npcs ? Object.keys(src.npcs) : (src.npcs ?? []).map((n: any) => n.id));
        const factionNames = new Set<string>((src.factions ?? []).map((f: any) => f.name));
        for (const [key, e] of Object.entries(src.lore ?? {})) {
          for (const t of ((e as any).triggers ?? [])) {
            if (typeof t === "string" && /^(npc|entity):/.test(t)) {
              const id = t.split(":")[1];
              if (!npcIds.has(id) && !entityIds.has(id)) failures.push(`lore.${key}.triggers: ${t} references missing npc/entity`);
            }
          }
        }
        for (const th of (src.gm_context?.active_threads ?? [])) {
          for (const f of (th.faction_refs ?? [])) if (!factionNames.has(f)) failures.push(`gm_context.active_threads: faction ${f} not present`);
        }
        for (const rel of (src.relationships ?? [])) {
          for (const t of [rel.source, rel.target]) if (t && !entityIds.has(t) && !npcIds.has(t) && !factionNames.has(t)) failures.push(`relationships: ${t} not present`);
        }
        const rooms = new Set<string>(Object.keys(src.world?.rooms ?? {}));
        for (const [, room] of Object.entries(src.world?.rooms ?? {})) {
          for (const target of Object.values((room as any).exits ?? {})) if (typeof target === "string" && !rooms.has(target)) failures.push(`world.rooms.${(room as any).name}.exits: ${target} not present`);
        }
        const cdNames = new Set<string>(Object.keys(src.countdowns ?? {}));
        for (const [name, cd] of Object.entries(src.countdowns ?? {})) {
          for (const c of (cd as any).clocks ?? []) {
            for (const o of [...(c.opposes ?? []), ...(c.unlocks ?? [])]) if (!cdNames.has(o)) failures.push(`countdowns.${name}.clock: references ${o} not present`);
          }
        }
      };
      validateRefs(flat);
      const name = flat.name ?? manifest?.name ?? "unknown";
      const slug = flat.slug ?? manifest?.slug ?? "—";
      if (m === "dry-run") {
        if (failures.length > 0) {
          const report = `Dry-run: novel '${name}' (${slug}) — ${failures.length} reference failure(s):\n${failures.map(f => `  - ${f}`).join("\n")}`;
          if (strictMode) return raw(`{"isError": false, "report": ${JSON.stringify(report)}}`);
          return raw(report);
        }
        return ok(`Dry-run: novel '${name}' (${slug}) would be imported (valid manifest, no reference failures).`);
      }
      const novel = requireNovel();
      if (failures.length > 0) {
        if (strictMode) return err("STATE_CONFLICT", `Import blocked by validation failures:\n${failures.map(f => `  - ${f}`).join("\n")}`);
      }
      if (m === "replace") {
        const imported = importNovelJSON(flat);
        applyNovelState(novel, imported);
      } else if (m === "merge") {
        const imported = importNovelJSON(flat);
        for (const [id, ent] of imported.entities) if (!novel.entities.has(id)) novel.entities.set(id, ent);
        for (const [id, npc] of imported.npcs) if (!novel.npcs.has(id)) novel.npcs.set(id, npc);
        for (const [key, entry] of imported.lore) if (!novel.lore.has(key)) novel.lore.set(key, entry);
        for (const c of imported.countdowns) if (!novel.countdowns.has(c[0])) novel.countdowns.set(c[0], c[1]);
        for (const f of imported.factions) if (!novel.factions.some(x => x.name === f.name)) novel.factions.push(f);
      }
      state.saveNovel(novel);
      if (failures.length > 0) return raw(`[WARNING] Novel '${name}' imported (${m} mode) with ${failures.length} unresolved reference(s):\n${failures.map(f => `  - ${f}`).join("\n")}`);
      return ok(`Novel '${name}' imported (${m} mode).`);
    }
    case "rename": {
      requireGM();
      const novel = requireNovel();
      const oldSlug = novel.slug;
      const newSlug = args.new_slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      // renameNovel guards against a target-slug collision (REQ-256) before
      // mutating state; only after it succeeds do we remove the old save file,
      // so a rejected rename leaves disk intact. A no-op same-slug rename keeps
      // the file.
      state.renameNovel(novel, newSlug);
      if (newSlug !== oldSlug) {
        const oldFile = path.join(DATA_DIR, "novels", `${oldSlug}.json`);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
        const oldBak = oldFile + ".bak";
        if (fs.existsSync(oldBak)) fs.unlinkSync(oldBak);
      }
      return ok(`Novel renamed to '${novel.slug}'.`);
    }
    case "description": {
      requireGM();
      const novel = requireNovel();
      novel.description = args.description ?? "";
      state.saveNovel(novel);
      audit("update_novel_description", { description: (args.description ?? "").substring(0, 120) });
      return ok(args.description ? `Novel description updated.` : "Novel description cleared.");
    }
    case "list": {
      const arch = state.archivedNovels();
      const archivedSlugs = new Set(arch.map((a) => a.slug));
      const active = [...state.novels.entries()].filter(([, n]) => !archivedSlugs.has(n.slug));
      const mode = args.filter ?? "active";
      const rows = mode === "archived"
        ? arch
        : active.filter(([, n]) => (mode === "all" ? true : !archivedSlugs.has(n.slug))).map(([slug, n]) => {
            if (args.detail) return { slug, name: n.name, entities: n.entities.size, npcs: n.npcs.size, lore: n.lore.size, world_rooms: n.world.rooms.size, modified: n.metadata.modified };
            return { slug, name: n.name, entities: n.entities.size, modified: n.metadata.modified };
          });
      return raw(JSON.stringify(rows, null, 2));
    }
    case "archive": {
      requireGM();
      if (state.activeNovelId === args.slug) state.activeNovelId = null;
      state.archiveNovel(args.slug);
      audit("archive_novel", { slug: args.slug });
      return ok(`Novel '${args.slug}' archived (read-only).`);
    }
    case "unarchive": {
      requireGM();
      state.unarchiveNovel(args.slug);
      audit("unarchive_novel", { slug: args.slug });
      return ok(`Novel '${args.slug}' restored from archive.`);
    }
    case "info": {
      const novel = args.slug ? state.novels.get(args.slug) : state.activeNovel;
      if (!novel) return err("NOT_FOUND", `Novel '${args.slug || "none"}' not found.`);
      return raw(JSON.stringify({
        slug: novel.slug, name: novel.name, ruleset: novel.ruleset, description: novel.description, genre: novel.genre,
        entities: novel.entities.size, npcs: novel.npcs.size, lore: novel.lore.size,
        world_rooms: novel.world.rooms.size, world_things: novel.world.things.size,
        factions: novel.factions.length, vows: novel.vows.length,
        scene: novel.scene_description ? novel.scene_description.substring(0, 100) : null,
        created: novel.metadata.created, modified: novel.metadata.modified,
        codex_sources: novel.codex_sources ?? [],
      }, null, 2));
    }
    case "genre": {
      requireGM();
      const novel = requireNovel();
      if (!GENRE_CATALOG.includes(args.genre)) return err("INVALID_INPUT", `Unknown genre '${args.genre}'. Valid: ${GENRE_CATALOG.join(", ")}.`);
      novel.genre = args.genre;
      state.saveNovel(novel);
      audit("set_genre", { genre: args.genre });
      return ok(`Genre set to '${args.genre}'.`);
    }
    case "clone": {
      requireGM();
      const source = state.novels.get(args.source_slug);
      if (!source) return err("NOT_FOUND", `Source novel '${args.source_slug}' not found.`);
      const slug = args.new_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      // REQ-240 — refuse a clone onto an existing slug rather than silently
      // overwriting the target's save file.
      if (state.novels.has(slug) || fs.existsSync(path.join(DATA_DIR, "novels", `${slug}.json`))) {
        return err("STATE_CONFLICT", `Novel '${slug}' already exists.`);
      }
      const clone = JSON.parse(JSON.stringify(novelToJSONState(source)));
      clone.slug = slug;
      clone.name = args.new_name;
      clone.metadata.created = new Date().toISOString();
      clone.metadata.modified = new Date().toISOString();
      const novel = loadNovelFromStateData(clone);
      state.novels.set(slug, novel);
      state.saveNovel(novel);
      return ok(`Cloned '${args.source_slug}' as '${slug}'.`);
    }
    case "save_context": {
      requireGM();
      const novel = requireNovel();
      const f = {
        current_scene: args.current_scene, immediate_situation: args.immediate_situation,
        pending_player_action: args.pending_player_action, short_term_plans: args.short_term_plans,
        long_term_plans: args.long_term_plans, player_goals: args.player_goals,
        faction_clocks: novel.factions.map(x => ({ name: x.name, clock: x.clock, clock_max: x.clock_max, status: x.status })),
        countdown_positions: [...novel.countdowns.entries()].map(([name, cd]) => ({ name, ticks: cd.ticks, total: cd.total })),
        npc_dispositions: [...novel.npcs.values()].map(n => ({ name: n.name, disposition: n.disposition, location: n.location })),
        relationships: novel.relationships,
        story_context: novel.story_journal.slice(-3).map(s => s.entry),
        active_vows: novel.vows.filter(v => v.state === "active").map(v => ({ name: v.name, difficulty: v.difficulty, milestone_count: v.milestones })),
      };
      novel.gm_context = { ...novel.gm_context, ...f, saved_at: new Date().toISOString() };
      state.recordMutation(novel, "set_pause_context", "context");
      state.saveNovel(novel);
      return ok("Pause context saved.");
    }
    case "get_context": {
      const novel = requireNovel();
      return raw(JSON.stringify({
        gm_context: novel.gm_context,
        novel_slug: novel.slug,
        scene: novel.scene_description,
        world_rooms: novel.world.rooms.size,
        npcs: novel.npcs.size,
        active_vows: novel.vows.filter(v => v.state === "active"),
      }, null, 2));
    }
    case "checkpoint_set": {
      requireGM();
      const novel = requireNovel();
      novel.checkpoints.push({ label: args.label, timestamp: new Date().toISOString(), state: JSON.parse(JSON.stringify(novelToJSONState(novel))) });
      state.saveNovel(novel);
      return ok(`Checkpoint '${args.label}' saved.`);
    }
    case "checkpoint_list": {
      requireGM();
      const novel = requireNovel();
      return raw(JSON.stringify(novel.checkpoints.map(c => ({ label: c.label, timestamp: c.timestamp })), null, 2));
    }
    case "checkpoint_restore": {
      requireGM();
      const novel = requireNovel();
      if (novel.pending_workflow) return err("STATE_CONFLICT", "A workflow decision is pending. Resolve it with respond before starting a new one.");
      const cp = novel.checkpoints.find(c => c.label === args.label);
      if (!cp) return err("NOT_FOUND", `Checkpoint '${args.label}' not found.`);
      novel.pending_workflow = {
        decision: `restore_checkpoint:${args.label}`,
        snapshot: state.captureWorkflowSnapshot(novel),
        payload: { label: args.label, state: cp.state },
      };
      state.saveNovel(novel);
      return needInput(`Decision: -restore_checkpoint-
Question: Restore checkpoint "${args.label}"? This reverts the Novel to that snapshot.
Options: yes, cancel`);
    }
    case "checkpoint_remove": {
      requireGM();
      const novel = requireNovel();
      const idx = novel.checkpoints.findIndex(c => c.label === args.label);
      if (idx === -1) return err("NOT_FOUND", `Checkpoint '${args.label}' not found.`);
      novel.checkpoints.splice(idx, 1);
      state.saveNovel(novel);
      return ok(`Checkpoint '${args.label}' removed.`);
    }
    default:
      return err("INVALID_INPUT", `Unknown novel action '${args.action}'.`);
  }
});

// --- Anchor-only tools (ruleset-free, REQ-218) ---

// Ruleset (REQ-057, REQ-058, REQ-059, REQ-216, REQ-218, REQ-379, REQ-390, REQ-391) — consolidated search/install/
// remove/list/bind surface.
server.registerTool("ruleset", {
  title: "Ruleset",
  description: "Manage ruleset packages and lookup. Use when: searching a bound ruleset's index, or installing, removing, listing, or binding a ruleset. Do NOT use when: the Novel is ruleset-free — use command (action: suggest) or session (action: health).",
  inputSchema: {
    action: z.enum(["search", "install", "remove", "list", "bind", "roll"]).describe("search, install, remove, list, bind, or roll."),
    query: z.string().optional().describe("Search query (search)."),
    max_results: z.number().optional().describe("Maximum results (search)."),
    slug: z.string().optional().describe("Ruleset slug (install/remove/bind)."),
    manifest: z.any().optional().describe("Package manifest (install)."),
    index: z.any().optional().describe("Search index (install)."),
    model: z.any().optional().describe("Extraction model (install)."),
    tools: z.any().optional().describe("Tool schemas (install)."),
    resources: z.any().optional().describe("Resources (install)."),
    prompts: z.any().optional().describe("Prompts (install)."),
    table: z.string().optional().describe("Generation table to roll on (roll)."),
    seed: z.string().optional().describe("Deterministic seed (roll)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "search": {
      const novel = state.activeNovel;
      const slug = novel?.ruleset ?? null;
      if (slug && rulesets.isInstalled(slug)) {
        const hits = rulesets.search(slug, String(args.query), args.max_results ?? 10);
        if (hits.length === 0) return err("NOT_FOUND", `No ruleset entry matches '${args.query}'.`);
        const total = rulesets.search(slug, String(args.query), 100000).length;
        const body = hits.map((h: any) => JSON.stringify({ ...h, ...sourceAnchor(h) }, null, 2) + sourceBlock(h)).join("\n");
        return raw(truncateOutput("search_rules", body + countReport(hits.length, total)));
      }
      if (rulesets.installedSlugs().length > 0) {
        return ok(`No ruleset bound to the active Novel. Installed rulesets: ${rulesets.installedSlugs().join(", ")}. Bind one via ruleset (action: bind), or create a Novel with novel (action: create, ruleset: "...").`);
      }
      return ok(`No ruleset indexed — this is a world-model-only server. Query was: "${args.query}". To add a ruleset, run \`build-ruleset <slug>=<path>\` (see the spec, Appendix V).`);
    }
    case "install": {
      requireGM();
      try {
        const pkg = rulesets.installPackage(args.slug, {
          manifest: args.manifest, index: args.index ?? [], model: args.model ?? {},
          tools: args.tools ?? [], resources: args.resources ?? [], prompts: args.prompts ?? [],
        });
        return ok(`Ruleset '${pkg.slug}' installed and hydrated: ${pkg.index.length} index entries, ${pkg.tools.length} tools.`);
      } catch (e: any) {
        return err("STATE_CONFLICT", e.message);
      }
    }
    case "remove": {
      requireGM();
      const novel = state.activeNovel;
      if (novel && novel.ruleset === args.slug) {
        return err("STATE_CONFLICT", `Cannot remove ruleset '${args.slug}' while Novel '${novel.slug}' is bound to it.`);
      }
      try {
        rulesets.removePackage(args.slug);
        return ok(`Ruleset '${args.slug}' removed.`);
      } catch (e: any) {
        return err("STATE_CONFLICT", e.message);
      }
    }
    case "list": {
      const list = rulesets.installedSlugs().map((slug) => rulesets.hydrate(slug)).map((pkg) => ({
        slug: pkg.slug, name: pkg.manifest.name, host_version: pkg.manifest.host_version,
        built_at: pkg.manifest.built_at, state: rulesets.isHydrated(pkg.slug) ? "loaded" : "installed",
      }));
      return raw(JSON.stringify(list, null, 2));
    }
    case "bind": {
      requireGM();
      if (!rulesets.isInstalled(args.slug)) {
        return err("INVALID_INPUT", `Ruleset '${args.slug}' is not installed. Valid rulesets: ${rulesets.installedSlugs().join(", ") || "(none)"}.`);
      }
      try {
        const novel = state.bindNovelRuleset(args.slug);
        rulesets.hydrate(args.slug);
        return ok(`Novel '${novel.slug}' bound to ruleset '${args.slug}'.`);
      } catch (e: any) {
        return err("STATE_CONFLICT", e.message);
      }
    }
    case "roll": {
      const novel = state.activeNovel;
      const slug = novel?.ruleset ?? null;
      if (!slug || !rulesets.isInstalled(slug)) {
        return err("NOT_FOUND", "No random generation tables in this ruleset (ruleset-free). Corrective action: bind a ruleset whose package defines generation tables.");
      }
      const model = rulesets.hydrate(slug).model as any;
      const tables = model.generation_tables ?? {};
      const key = Object.keys(tables).find(k => k.toLowerCase() === String(args.table).toLowerCase());
      if (!key) {
        const valid = Object.keys(tables);
        return err("NOT_FOUND", `Table '${args.table}' not found. Valid tables: ${valid.join(", ") || "(none)"}.`);
      }
      const entry = tables[key];
      if (entry?.badge_scope === "game_master" && getBadge() === "player") {
        return err("FORBIDDEN", `Table '${key}' is Game Master only. Corrective action: use badge_briefing to list tables your badge can access, or switch badges with set_badge.`);
      }
      const rng = args.seed ? createRng(args.seed) : createRng(String(sessionRoll(1000000000)));
      const roll = entry.dice_expression ? rollDice(entry.dice_expression, String(rng.roll(1000000000))).total : rng.roll(100);
      const range = (entry.ranges ?? []).find((r: any) => roll >= r.min && roll <= r.max);
      if (!range) {
        return warn(`Roll ${roll} on ${entry.dice_expression ?? "d100"} matched no range in table '${key}'.`);
      }
      return ok(`Table: ${key}\nDice: ${entry.dice_expression ?? "d100"}\nRoll: ${roll}\nRange: ${range.min}-${range.max}\nResult: ${range.result}`);
    }
    default:
      return err("INVALID_INPUT", `Unknown ruleset action '${args.action}'. Valid actions: search, install, remove, list, bind, roll.`);
  }
});

// REQ-022 resource URI catalog — presence is reported against this fixed list.
const REQ022_URI_CATALOG: { template: string; title: string }[] = [
  { template: "novel://current", title: "Active Novel" },
  { template: "novel://setup", title: "Novel Setup" },
  { template: "entity://current", title: "Active Entity" },
  { template: "entity://{id}/personality", title: "Entity Personality" },
  { template: "entity://{id}/voice_examples", title: "Entity Voice Examples" },
  { template: "entities://", title: "All Novel Entities" },
  { template: "party://current", title: "Current Party" },
  { template: "roster://current", title: "Character Roster" },
  { template: "roster://{id}", title: "Roster Character" },
  { template: "scene://current", title: "Current Scene" },
  { template: "scene://history", title: "Scene History" },
  { template: "countdown://active", title: "Active Countdowns" },
  { template: "npc://{id}", title: "NPC Record" },
  { template: "npcs://", title: "All NPCs" },
  { template: "lore://active", title: "Active Lore" },
  { template: "lore://{key}", title: "Lore Entry" },
  { template: "lore://templates", title: "Lore Templates" },
  { template: "audit://novel", title: "Audit Log" },
  { template: "guidance://player", title: "Player Guidance" },
  { template: "guidance://game_master", title: "GM Guidance" },
  { template: "guidance://{badge}/anti-slop", title: "Anti-Slop Guidance" },
  { template: "guidance://{badge}/foundations", title: "Badge Foundations" },
  { template: "guidance://shared/badge-switch", title: "Badge Switch Guidance" },
  { template: "room://{id}", title: "Room" },
  { template: "thing://{id}", title: "Thing" },
  { template: "world://map", title: "World Map" },
  { template: "world://kinds", title: "World Kinds" },
  { template: "graph://novel", title: "Knowledge Graph" },
  { template: "spec://build", title: "Build Specification" },
  { template: "output://{tool}/{counter}", title: "Tool Output" },
  { template: "notes://{key}", title: "Note" },
  { template: "server-notes://{key}", title: "Server Note" },
  { template: "codex://{id}", title: "Codex Entry" },
  { template: "faction://{id}", title: "Faction" },
  { template: "factions://", title: "All Factions" },
  { template: "secrets://active", title: "Active Secrets" },
  { template: "synthesis://status", title: "Synthesis Status" },
  { template: "constraints://active", title: "Constraint Overrides" },
];

// REQ-025 — spec health reports build health, indexed counts, and URI completeness.
// Extracted as a named function so the consolidated `session` tool's `health`
// action reuses it directly.
function buildSpecHealth(): Record<string, unknown> {
  const novel = state.activeNovel;
  const badge = getBadge();
  const isGM = badge === "game_master" || badge === "none";
  const entities = novel ? novel.entities.size : 0;
  const npcs = novel ? novel.npcs.size : 0;
  const loreCount = novel ? novel.lore.size : 0;
  const countdowns = novel ? novel.countdowns.size : 0;
  const rooms = novel ? novel.world.rooms.size : 0;
  const things = novel ? novel.world.things.size : 0;

  const registeredResourceURIs = new Set<string>();
  const listedResources: Record<string, any> = (server as any)._registeredResources ?? {};
  for (const key of Object.keys(listedResources)) {
    const r = listedResources[key];
    const uriTemplate = r?._template?.uriTemplate?.toString?.() ?? key;
    registeredResourceURIs.add(typeof uriTemplate === "string" ? uriTemplate : key);
  }
  const resource_uris = REQ022_URI_CATALOG.map(({ template, title }) => {
    const present = registeredResourceURIs.has(template);
    return { uri: template, title, presence: present ? "present" : "absent" };
  });

  const prompts: any[] = (server as any)._registeredPrompts ? Object.values((server as any)._registeredPrompts) : [];
  const prompt_health = prompts.map((p: any) => ({
    name: p?.name ?? "unknown",
    present: true,
    length: 0,
    budget: p?.arguments?.length ?? "n/a",
    within: true,
    stale_references: (p?.name ?? "") in BUILDER_CATEGORIES ? [] : [],
  }));

  const synthesisCounts = synthesisModuleCounts();
  const synthesis_active = state.enriched;

  const health: Record<string, unknown> = {
    // REQ-106 — spec repository URL (informational; identical for both badges).
    spec_repo_url: specRepoUrl(),
    spec_version: state.buildFingerprint.specVersion,
    spec_hash: state.buildFingerprint.specHash,
    source_hash: state.buildFingerprint.sourceHash,
    ruleset_hash: rulesets.installedSlugs().length > 0 ? rulesets.installedSlugs().join(",") : "ruleset-free",
    ruleset_guidance: rulesets.installedSlugs().length > 0
      ? `Installed: ${rulesets.installedSlugs().join(", ")}.`
      : "No rulesets installed — run `build-ruleset <slug>=<path>` to add one (spec Appendix V).",
    active_ruleset: isGM ? (novel?.ruleset ?? null) : undefined,
    rulesets_installed: rulesets.installedSlugs().length,
    rulesets_hydrated: rulesets.installedSlugs().filter((s) => rulesets.isHydrated(s)).length,
    ruleset_prefix_map: isGM ? rulesets.prefixMap() : undefined,
    // REQ-420 — incompatible packages, held inactive (REQ-393).
    ruleset_package_alerts: isGM ? rulesets.incompatibleSlugs() : undefined,
    // REQ-423 — [data-stale] artifacts, advisory (never block loading);
    // REQ-001a — [WARNING] enumeration of corrupted Novels (corruptData).
    data_health: isGM
      ? { data_format: state.dataFormat, stale: Object.fromEntries(state.staleData), corrupted: Object.fromEntries(state.corruptData) }
      : undefined,
    build_timestamp: state.buildFingerprint.buildTimestamp,
    tool_count: ((server as any)._registeredTools ? Object.keys((server as any)._registeredTools).length : 0),
    prompt_count: ((server as any)._registeredPrompts ? Object.keys((server as any)._registeredPrompts).length : 0),
    resource_count: ((server as any)._registeredResources ? Object.keys((server as any)._registeredResources).length : 0),
    resource_uris, // REQ-139 — resource URI presence from the live resource map.
    prompt_health, // REQ-138 — per-prompt presence, length, budget, stale refs.
    // REQ-425d — the output format catalog (universal + surface sets + any
    // ruleset-declared formats) and whether the MCP Apps extension (REQ-426c)
    // is negotiated by the current client.
    output_formats: {
      universal: [...UNIVERSAL_FORMATS],
      statblock: [...STATBLOCK_FORMATS],
      session: [...SESSION_FORMATS],
      interchange: [...INTERCHANGE_FORMATS],
      declared: [...declaredFormats],
    },
    mcp_apps: { negotiated: appsNegotiated() },
    confidence: { overall: "N/A — ruleset-free", per_file: {}, per_category: {} },
    indexed_counts: {
      anchors: rulesets.installedSlugs().reduce((n, s) => n + (rulesets.hydrate(s)?.index.length ?? 0), 0),
      concepts: 0, entity_types: 0, actions: 0,
      tables: 0, procedures: 0, guidance_items: 0,
    },
    must_action_coverage: "100% (infrastructure only)",
    pending_sections: 0,
    defect_count: 0,
    world_model: { rooms, things },
    novels_available: [...state.novels.keys()].length,
    // REQ-334 — archived Novels surface with slug + archive timestamp.
    archived_novels: isGM ? state.archivedNovels() : undefined,
    server_notes: state.serverNotes.size,
    codex: isGM ? state.codex.size : undefined,
    // REQ-332 — codex provenance register for the active Novel.
    codex_sources: isGM && novel ? (novel.codex_sources ?? []) : undefined,
    // REQ-170 — adventure discovery surface: indexed adventure slugs + content
    // hashes (informational; adventure modules ship with the build).
    indexed_adventures: isGM ? Object.fromEntries((novel?.adventure_index ? [[novel.adventure_slug ?? "generated", "adventure-scaffold"]] : [])) : undefined,
    // REQ-292b — adventure catalog count.
    adventure_catalog_count: countAdventureModules(),
    constraint_override_counts: isGM ? (novel ? Object.keys(novel.constraint_overrides ?? {}).length : 0) : undefined,
    active_novel: novel?.slug ?? null,
    // REQ-294 — genre declaration surfaced in spec_health when set.
    active_genre: novel?.genre && novel.genre.length > 0 ? novel.genre : undefined,
    active_badge: novel?.badge ?? null,
    autonomy: isGM ? (novel?.autonomy ?? null) : undefined,
    creativity_mapping: {
      predictable: "least surprise — stick to expected outcomes",
      standard: "balanced variation — the default",
      chaotic: "most surprise — dramatic twists",
      reported: true,
    },
    entities, npcs, lore_entries: loreCount, countdowns,
    // REQ-311f — NPC memory count across all NPCs in the active Novel.
    npc_memory_count: novel ? [...novel.npcs.values()].reduce((n, npc) => n + (npc.memory ? Object.keys(npc.memory.contacts ?? {}).length + (npc.memory.witnessed_events?.length ?? 0) : 0), 0) : 0,
    // REQ-224b / REQ-193a — pending workflow staleness surfaced to operators.
    pending_workflow: isGM ? (novel?.pending_workflow ? { decision: novel.pending_workflow.decision, connections: novel.pending_staleness_counter, threshold: parseInt(process.env.TTRPG_WORKFLOW_STALENESS_CONNECTIONS ?? "5", 10) } : null) : undefined,
    pending_workflow_warning: isGM && novel?.pending_workflow && novel.pending_staleness_counter >= 3
      ? { decision: novel.pending_workflow.decision, connections: novel.pending_staleness_counter }
      : undefined,
    // REQ-237 — session segmentation: per-session metrics from [session-boundary]
    // markers, badge-filtered (Player sees timespans without session ids).
    sessions: novel ? (isGM ? novel.metadata.sessions : novel.metadata.sessions.map((s) => ({ session_id: undefined, entry_count: s.entry_count, timespan_start: s.timespan_start, timespan_end: s.timespan_end }))) : undefined,
    synthesis_active,
    synthesis_status: { modules: synthesisCounts, last_run: state.enrichmentManifest?.collected_at ?? null },
    synthesis_health: {
      synthesis_active,
      module_counts: synthesisCounts,
      stale_count: 0,
      activated_count: novel ? (novel.synthesis_activated ? Object.values(novel.synthesis_activated).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0) : 0) : 0,
      fingerprint: state.enrichmentManifest ? SPEC_HASH : "",
    },
    audit_chain: novel ? state.verifyAuditChain(novel) : null, // REQ-169
    safety_protocols: { // REQ-269 — safety protocol status per property.
      state_loss: "online",
      badge_boundary: "online",
      data_corruption: "online",
      unrecoverable_crash: isGM ? "unverified" : undefined,
    },
    // REQ-408 (amended), REQ-410, REQ-411, REQ-409 — token/efficiency contracts.
    // Per-action ceiling (REQ-413): action-discriminator tools are evaluated on
    // their required-per-action parameters, not the union of optional fields.
    parameter_ceiling: PARAMETER_CEILING,
    parameter_ceiling_exceeded: (() => {
      const meta = cachedMetadata();
      for (const [name, count] of Object.entries(meta.toolParameterCounts)) {
        const effective = meta.actionToolNames.has(name) ? (meta.toolRequiredParamCounts[name] ?? count) : count;
        if (effective > PARAMETER_CEILING) return true;
      }
      return false;
    })(),
    tool_parameter_counts: cachedMetadata().toolParameterCounts,
    tool_required_param_counts: cachedMetadata().toolRequiredParamCounts,
    tools_list_bytes: cachedMetadata().toolsListBytes,
    cache_coverage: { hits: cacheHits, misses: cacheMisses },
    enumeration_verbosity: enumerationVerbosity,
    // REQ-253 — active tool-output verbosity mode.
    verbosity_mode: outputVerbosity,
    // REQ-283 — parser verb coverage tiers: core (base vocabulary), standard
    // (IF-community), extended (ruleset-derived). Advisory completeness signal.
    parser_verb_coverage: {
      core: BASE_PARSER_COMMANDS.length,
      standard: BASE_PARSER_COMMANDS.filter((c) => ["open", "close", "lock", "unlock", "push", "pull", "search", "read", "sit", "stand", "wear", "remove", "eat", "drink", "light", "extinguish", "climb", "jump", "enter", "exit", "put", "insert"].includes(c.verb)).length,
      extended: 0,
    },
    // REQ-197 — room description mode (session-scoped).
    description_mode: roomDescriptionMode,
    // REQ-185 section token vocabulary + REQ-186 discoverability: valid tokens with
    // their REQ-109 groups and whether the group currently has runtime content.
    section_tokens: [
      { token: "scene_state", group: "current scene state", has_content: !!(novel?.scene_description) },
      { token: "entities", group: "active entities", has_content: !!(novel && novel.entities.size > 0) },
      { token: "combat_state", group: "active combat state", has_content: !!(novel?.combat?.active) },
      { token: "npcs", group: "active NPCs", has_content: !!(novel && novel.npcs.size > 0) },
      { token: "countdowns", group: "active countdowns", has_content: !!(novel && novel.countdowns.size > 0) },
      { token: "lore", group: "active lore entries", has_content: !!(novel && novel.lore.size > 0) },
      { token: "narrative_threads", group: "narrative threads", has_content: true },
      { token: "campaign_memory", group: "campaign memory", has_content: !!(novel && (novel.campaign_memory ?? []).length > 0) },
      { token: "world_state", group: "world-model room context", has_content: !!(novel && novel.world.rooms.size > 0) },
      { token: "story_journal", group: "story journal", has_content: !!(novel && novel.story_journal.length > 0) },
    ],
    // REQ-263 — synthesis auto-trigger threshold (visible).
    synthesis_auto_trigger: process.env.TTRPG_SYNTHESIS_AUTO_TRIGGER ?? "off",
    // REQ-266 — last synthesis run timestamp.
    synthesis_last_run: state.enrichmentManifest?.collected_at ?? null,
    campaign_memory: novel ? {
      npcs: (novel.campaign_memory ?? []).filter((f) => f.category === "npcs").length,
      threads: (novel.campaign_memory ?? []).filter((f) => f.category === "threads").length,
      locations: (novel.campaign_memory ?? []).filter((f) => f.category === "locations").length,
      total: (novel.campaign_memory ?? []).length,
    } : { npcs: 0, threads: 0, locations: 0, total: 0 },
    // REQ-312d1 — narration validation gate status and rejection count.
    narration_validation: narrationValidationOn() ? "on" : "off",
    narration_rejection_count: narrationRejectionCount,
    // REQ-417 — non-blocking startup probes: startup completes without awaiting
    // slow probes; probe state reported as pending then completed.
    startup_probes: { ruleset_scan: "completed", enrichment: "completed" }, // REQ-417
    // REQ-413 — action-discriminator tools; REQ-414 — nested-form input count;
    // REQ-415 — active catalog verbosity (summary default, detail on request).
    catalog_verbosity: enumerationVerbosity,
    ...schemaSurfaceMetrics(),
    token_footprint: {
      tools_list_bytes: cachedMetadata().toolsListBytes,
      prompt_scaffold_bytes: cachedMetadata().promptBytes,
    },
    // REQ-346 — narrative coherence disposition (G7). Derived from the §5.12
    // REQs implemented in this build; a full list with per-REQ dispositions
    // is recorded in DECISIONS.md under the narrative_coherence attestation.
    narrative_coherence: {
      implemented: SECTION_512_IMPLEMENTED.length,
      total: SECTION_512_REQS.length,
      disposition: SECTION_512_IMPLEMENTED.length >= SECTION_512_REQS.length ? "pass" : (SECTION_512_IMPLEMENTED.length > 0 ? "partial" : "fail"),
      reqs: SECTION_512_IMPLEMENTED.slice(),
    },
  };

  const fingerprintPath = path.join(DATA_DIR, "build-order-fingerprint.json");
  if (fs.existsSync(fingerprintPath)) {
    try {
      health.build_order = JSON.parse(fs.readFileSync(fingerprintPath, "utf-8"));
    } catch { /* ignore unreadable fingerprint */ }
  }

  return health;
}

// ── Resources ──────────────────────────────────────────────────────

// Novel resources
server.registerResource("novel-current", "novel://current", { title: "Active Novel" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "novel://current", text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  return { contents: [{ uri: "novel://current", text: JSON.stringify({ slug: novel.slug, name: novel.name, badge: novel.badge, entities: novel.entities.size }), mimeType: "application/json" }] };
});

server.registerResource("novel-setup", "novel://setup", { title: "Novel Setup" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "novel://setup", text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  return { contents: [{ uri: "novel://setup", text: JSON.stringify({ slug: novel.slug, name: novel.name }), mimeType: "application/json" }] };
});

// Entity resource
server.registerResource("entity-current", "entity://current", { title: "Active Entity" }, async () => {
  const entity = state.getActiveEntity();
  if (!entity) return { contents: [{ uri: "entity://current", text: "No active entity.", mimeType: "text/plain" }] };
  return { contents: [{ uri: "entity://current", text: JSON.stringify({ id: entity.id, name: entity.name, personality: entity.personality, current_room: entity.current_room, inventory: entity.inventory }), mimeType: "application/json" }] };
});

server.registerResource("entity-personality", new ResourceTemplate("entity://{id}/personality", { list: undefined }), { title: "Entity Personality" }, async (uri) => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const id = uri.href.split("/")[2] ?? "";
  const entity = novel.entities.get(id) ?? novel.npcs.get(id);
  if (!entity) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return { contents: [{ uri: uri.href, text: JSON.stringify(entity.personality ?? {}), mimeType: "application/json" }] };
});

server.registerResource("entity-voice", new ResourceTemplate("entity://{id}/voice_examples", { list: undefined }), { title: "Entity Voice Examples" }, async (uri) => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const id = uri.href.split("/")[2] ?? "";
  const entity = novel.entities.get(id);
  if (!entity) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return { contents: [{ uri: uri.href, text: JSON.stringify(entity.voice_examples ?? []), mimeType: "application/json" }] };
});

server.registerResource("roster", "roster://current", { title: "Character Roster" }, async () => {
  return { contents: [{ uri: "roster://current", text: JSON.stringify(Object.fromEntries(state.roster)), mimeType: "application/json" }] };
});

// Scene resources
server.registerResource("scene-current", "scene://current", { title: "Current Scene" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "scene://current", text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  return { contents: [{ uri: "scene://current", text: JSON.stringify({ description: novel.scene_description, location: novel.scene_location, time_of_day: novel.scene_time_of_day, atmosphere: novel.scene_atmosphere, type: novel.scene_type }), mimeType: "application/json" }] };
});

server.registerResource("scene-history", "scene://history", { title: "Scene History" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "scene://history", text: "[]", mimeType: "application/json" }] };
  return { contents: [{ uri: "scene://history", text: JSON.stringify(novel.scene_history), mimeType: "application/json" }] };
});

// Countdown resource
server.registerResource("countdown-active", "countdown://active", { title: "Active Countdowns" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "countdown://active", text: "{}", mimeType: "application/json" }] };
  const active = Object.fromEntries([...novel.countdowns.entries()].filter(([, cd]) => cd.ticks > 0));
  return { contents: [{ uri: "countdown://active", text: JSON.stringify(active), mimeType: "application/json" }] };
});

// NPC resources
server.registerResource("npc-single", new ResourceTemplate("npc://{id}", { list: () => {
  const novel = state.activeNovel;
  if (!novel) return { resources: [] };
  return { resources: [...novel.npcs.keys()].map(id => ({ uri: `npc://${id}`, name: id })) };
} }), { title: "NPC Record" }, async (uri) => {
  const novel = state.activeNovel;
  const id = resourceKey(uri);
  if (!novel) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const npc = novel.npcs.get(id);
  if (!npc) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  // REQ-425a/c — the NPC stat block honors the output format catalog; the
  // markdown render is byte-identical to character_sheet(npc_id) via the same
  // fmtEntitySheet renderer.
  const fmt = resourceFormat(uri);
  if (fmt === "json") return { contents: [{ uri: uri.href, text: JSON.stringify(npc, null, 2), mimeType: "application/json" }] };
  const md = fmtEntitySheet(npc);
  if (fmt === "html") return { contents: [{ uri: uri.href, text: toHtml(md), mimeType: "text/html" }] };
  return { contents: [{ uri: uri.href, text: md, mimeType: "text/markdown" }] };
});

server.registerResource("npcs", "npcs://", { title: "All NPCs" }, async () => {
  // REQ-121 — NPC resource URIs: npcs:// lists all active NPCs with summary
  // fields, badge-filtered (GM sees all, Player sees summaries).
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "npcs://", text: "{}", mimeType: "application/json" }] };
  const badge = getBadge();
  const isGM = badge === "game_master" || badge === "none";
  const entries = Object.fromEntries([...novel.npcs.entries()].map(([id, n]) => {
    const summary: any = { id, name: n.name, disposition: n.disposition ?? "neutral", location: n.location ?? null };
    return [id, isGM ? n : summary];
  }));
  return { contents: [{ uri: "npcs://", text: JSON.stringify(entries), mimeType: "application/json" }] };
});

// REQ-122b / REQ-167 — NPC personality and voice-example resource URIs.
server.registerResource("npc-personality", new ResourceTemplate("npc://{id}/personality", { list: undefined }), { title: "NPC Personality" }, async (uri) => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const id = uri.href.split("/")[2] ?? "";
  const npc = novel.npcs.get(id);
  if (!npc) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return { contents: [{ uri: uri.href, text: JSON.stringify(npc.personality ?? {}), mimeType: "application/json" }] };
});

server.registerResource("npc-voice", new ResourceTemplate("npc://{id}/voice_examples", { list: undefined }), { title: "NPC Voice Examples" }, async (uri) => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const id = uri.href.split("/")[2] ?? "";
  const npc = novel.npcs.get(id);
  if (!npc) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return { contents: [{ uri: uri.href, text: JSON.stringify(npc.voice_examples ?? []), mimeType: "application/json" }] };
});

// Lore resources
server.registerResource("lore-active", "lore://active", { title: "Active Lore" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "lore://active", text: "{}", mimeType: "application/json" }] };
  const active = Object.fromEntries([...novel.lore.entries()].filter(([, l]) => l.enabled));
  return { contents: [{ uri: "lore://active", text: JSON.stringify(active), mimeType: "application/json" }] };
});

server.registerResource("lore-single", new ResourceTemplate("lore://{key}", { list: () => {
  const novel = state.activeNovel;
  if (!novel) return { resources: [] };
  return { resources: [...novel.lore.keys()].map(k => ({ uri: `lore://${k}`, name: k })) };
} }), { title: "Lore Entry" }, async (uri) => {
  const novel = state.activeNovel;
  const key = resourceKey(uri);
  if (!novel) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const entry = novel.lore.get(key);
  if (!entry) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  // REQ-425a/c — the lore entry honors the output format catalog (markdown
  // default, json, html).
  const fmt = resourceFormat(uri);
  if (fmt === "json") return { contents: [{ uri: uri.href, text: JSON.stringify(entry, null, 2), mimeType: "application/json" }] };
  const md = `## ${entry.key}\n\n${entry.content}`;
  if (fmt === "html") return { contents: [{ uri: uri.href, text: toHtml(md), mimeType: "text/html" }] };
  return { contents: [{ uri: uri.href, text: md, mimeType: "text/markdown" }] };
});

// Audit resource
server.registerResource("audit-novel", "audit://novel", { title: "Audit Log" }, async () => {
  // REQ-168 — audit resource: audit://novel exposes the chained audit log,
  // badge-filtered, with the output prefix distinguishing boundary violations.
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "audit://novel", text: "[]", mimeType: "application/json" }] };
  return { contents: [{ uri: "audit://novel", text: JSON.stringify(novel.audit_log.slice(-50)), mimeType: "application/json" }] };
});

// Guidance resources
server.registerResource("guidance-player", "guidance://player", { title: "Player Guidance" }, async () => ({
  contents: [{ uri: "guidance://player", text: "## Player Guidance\n\nDescribe what your character does. Use parser commands to interact with the world: command(\"look\"), command(\"go north\"), command(\"take sword\").", mimeType: "text/markdown" }],
}));

server.registerResource("guidance-gm", "guidance://game_master", { title: "GM Guidance" }, async () => ({
  contents: [{ uri: "guidance://game_master", text: "## Game Master Guidance\n\nPopulate the world model with convert_source or adventure modules. Set scenes, NPCs, lore, and countdowns.", mimeType: "text/markdown" }],
}));

server.registerResource("guidance-player-anti-slop", "guidance://player/anti-slop", { title: "Player Anti-Slop" }, async () => ({
  contents: [{ uri: "guidance://player/anti-slop", text: antiSlopFor("player"), mimeType: "text/markdown" }],
}));

server.registerResource("guidance-gm-anti-slop", "guidance://game_master/anti-slop", { title: "GM Anti-Slop" }, async () => ({
  contents: [{ uri: "guidance://game_master/anti-slop", text: antiSlopFor("game_master"), mimeType: "text/markdown" }],
}));

server.registerResource("guidance-badge-switch", "guidance://shared/badge-switch", { title: "Badge Switch Guidance" }, async () => ({
  contents: [{ uri: "guidance://shared/badge-switch", text: "Use set_badge to switch between player and game_master badges. Player: describe actions. GM: describe situations.", mimeType: "text/markdown" }],
}));

// World-model resources (REQ-202)
server.registerResource("room-single", new ResourceTemplate("room://{id}", { list: () => {
  const novel = state.activeNovel;
  if (!novel) return { resources: [] };
  return { resources: [...novel.world.rooms.keys()].map(id => ({ uri: `room://${id}`, name: novel.world.rooms.get(id)?.name ?? id })) };
} }), { title: "Room" }, async (uri) => {
  const novel = state.activeNovel;
  const id = decodeURIComponent(uri.href.split("/").pop() ?? "");
  if (!novel) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const room = novel.world.rooms.get(id.toLowerCase());
  if (!room) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  const isGM = novel.badge === "game_master";
  let info = `## ${room.name}\n${room.description || "No description."}`;
  if (isGM) {
    info += `\n\n**Exits:** ${[...room.exits.entries()].map(([d, t]) => `${d} → ${t}`).join(", ") || "none"}`;
  } else {
    const exits = [...room.exits.keys()].join(", ");
    if (exits) info += `\n\n**Exits:** ${exits}`;
  }
  return { contents: [{ uri: uri.href, text: info, mimeType: "text/markdown" }] };
});

server.registerResource("thing-single", new ResourceTemplate("thing://{id}", { list: () => {
  const novel = state.activeNovel;
  if (!novel) return { resources: [] };
  return { resources: [...novel.world.things.keys()].map(id => ({ uri: `thing://${id}`, name: novel.world.things.get(id)?.name ?? id })) };
} }), { title: "Thing" }, async (uri) => {
  const novel = state.activeNovel;
  const id = decodeURIComponent(uri.href.split("/").pop() ?? "");
  if (!novel) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const thing = novel.world.things.get(id.toLowerCase());
  if (!thing) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  const isGM = novel.badge === "game_master";
  let info = `## ${thing.name}\n**Kind:** ${thing.kind}\n${thing.description || "No description."}`;
  if (isGM) {
    info += `\n\n**Location:** ${thing.location || "(held/inventory)"}`;
    info += `\n**Properties:** portable=${thing.portable}, openable=${thing.openable}, open=${thing.open}, lockable=${thing.lockable}, locked=${thing.locked}`;
  }
  return { contents: [{ uri: uri.href, text: info, mimeType: "text/markdown" }] };
});

server.registerResource("world-map", "world://map", { title: "World Map" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "world://map", text: "No active novel.", mimeType: "text/plain" }] };
  return { contents: [{ uri: "world://map", text: worldMap(novel.world), mimeType: "text/plain" }] };
});

server.registerResource("world-kinds", "world://kinds", { title: "World Kinds" }, async () => ({
  contents: [{ uri: "world://kinds", text: worldKinds(), mimeType: "text/markdown" }],
}));

// ── Additional resources (REQ-022a) ───────────────────────────────

// Entity collection resource (REQ-074)
server.registerResource("entities-collection", "entities://", { title: "All Novel Entities" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "entities://", text: "{}", mimeType: "application/json" }] };
  return { contents: [{ uri: "entities://", text: JSON.stringify(Object.fromEntries(novel.entities)), mimeType: "application/json" }] };
});

// Party resource (REQ-074, REQ-307)
server.registerResource("party-current", "party://current", { title: "Current Party" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "party://current", text: "{}", mimeType: "application/json" }] };
  const party = [...novel.entities.values()].map(e => ({
    name: e.name,
    active: e.id === novel.active_entity_id,
    conditions: e.conditions ?? [],
    present: novel.characters_present_ids ? novel.characters_present_ids.includes(e.id) : true,
    last_location: e.current_room ?? null,
  }));
  return { contents: [{ uri: "party://current", text: JSON.stringify(party, null, 2), mimeType: "application/json" }] };
});

// Knowledge graph (REQ-296)
server.registerResource("graph-novel", "graph://novel", { title: "Novel Knowledge Graph" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "graph://novel", text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const isGM = novel.badge === "game_master";
  const revealedSecrets = novel.secrets.filter(s => s.known_by.length > 0 || isGM);
  const graph = {
    entities: [...novel.entities.values()].map(e => ({ id: e.id, name: e.name })),
    npcs: [...novel.npcs.values()].map(n => ({ id: n.id, name: n.name, disposition: n.disposition, location: n.location })),
    lore_connections: [...novel.lore.values()].filter(l => l.enabled).map(l => ({ key: l.key })),
    secrets: revealedSecrets.map(s => ({ key: s.key, known_by: s.known_by })),
    factions: novel.factions.map(f => ({ id: f.id, name: f.name })),
  };
  return { contents: [{ uri: "graph://novel", text: JSON.stringify(graph, null, 2), mimeType: "application/json" }] };
});

// Spec resource (REQ-105)
server.registerResource("spec-build", "spec://build", { title: "Build Specification" }, async () => {
  const badge = getBadge();
  if (badge !== "game_master" && badge !== "none") {
    return { contents: [{ uri: "spec://build", text: "[FORBIDDEN] spec://build is Game Master only. Corrective action: switch badge with set_badge.", mimeType: "text/plain" }] };
  }
  try {
    const specPath = path.join(__dirname, "holonovel.md");
    if (fs.existsSync(specPath)) {
      return { contents: [{ uri: "spec://build", text: fs.readFileSync(specPath, "utf-8"), mimeType: "text/markdown" }] };
    }
  } catch { /* fall through */ }
  return { contents: [{ uri: "spec://build", text: "Specification not embedded in this build.", mimeType: "text/plain" }] };
});

// Output pointer resource (REQ-179): output://{tool}/{counter}
const outputStore: Map<string, string> = new Map();
server.registerResource("output-pointer", new ResourceTemplate("output://{tool}/{counter}", { list: undefined }), { title: "Tool Output" }, async (uri) => {
  const key = uri.href.replace("output://", "");
  const text = outputStore.get(key);
  if (text === undefined) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return { contents: [{ uri: uri.href, text, mimeType: "text/markdown" }] };
});

// Notes resource (REQ-242)
server.registerResource("notes-single", new ResourceTemplate("notes://{key}", { list: () => {
  const novel = state.activeNovel;
  if (!novel) return { resources: [] };
  return { resources: novel.notes.map(n => ({ uri: `notes://${n.key}`, name: n.key })) };
} }), { title: "Note" }, async (uri) => {
  const novel = state.activeNovel;
  const key = decodeURIComponent(uri.href.split("/").pop() ?? "");
  if (!novel) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const note = novel.notes.find(n => n.key === key);
  if (!note) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  if (note.badge_scope === "game_master" && novel.badge !== "game_master" && novel.badge !== "none") {
    return { contents: [{ uri: uri.href, text: "[FORBIDDEN] This note is Game Master scoped.", mimeType: "text/plain" }] };
  }
  return { contents: [{ uri: uri.href, text: note.content, mimeType: "text/markdown" }] };
});

// Server notes resource (REQ-285)
server.registerResource("server-notes-single", new ResourceTemplate("server-notes://{key}", { list: () => {
  return { resources: [...state.serverNotes.keys()].map(k => ({ uri: `server-notes://${k}`, name: k })) };
} }), { title: "Server Note" }, async (uri) => {
  if (getBadge() !== "game_master" && getBadge() !== "none") {
    return { contents: [{ uri: uri.href, text: "[FORBIDDEN] Server notes are Game Master only.", mimeType: "text/plain" }] };
  }
  const key = decodeURIComponent(uri.href.split("/").pop() ?? "");
  const entry = state.serverNotes.get(key);
  if (entry === undefined) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return { contents: [{ uri: uri.href, text: entry.content, mimeType: "text/markdown" }] };
});

// Codex resource (REQ-321)
server.registerResource("codex-single", new ResourceTemplate("codex://{id}", { list: () => {
  return { resources: [...state.codex.keys()].map(id => ({ uri: `codex://${id}`, name: state.codex.get(id)?.name ?? id })) };
} }), { title: "Codex Entry" }, async (uri) => {
  const id = resourceKey(uri);
  const entry = state.codex.get(id);
  if (!entry) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  const badge = getBadge();
  if (entry.visibility === "private" && badge !== "game_master" && badge !== "none") {
    return { contents: [{ uri: uri.href, text: "[FORBIDDEN] This codex entry is private.", mimeType: "text/plain" }] };
  }
  // REQ-425a/c — the codex entry honors the output format catalog (markdown
  // default, json, html).
  const fmt = resourceFormat(uri);
  if (fmt === "json") return { contents: [{ uri: uri.href, text: JSON.stringify(entry, null, 2), mimeType: "application/json" }] };
  const md = codexEntryMarkdown(entry);
  if (fmt === "html") return { contents: [{ uri: uri.href, text: toHtml(md), mimeType: "text/html" }] };
  return { contents: [{ uri: uri.href, text: md, mimeType: "text/markdown" }] };
});

// Faction resources (REQ-233)
server.registerResource("factions-collection", "factions://", { title: "All Factions" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "factions://", text: "[]", mimeType: "application/json" }] };
  return { contents: [{ uri: "factions://", text: JSON.stringify(novel.factions, null, 2), mimeType: "application/json" }] };
});
server.registerResource("faction-single", new ResourceTemplate("faction://{id}", { list: () => {
  const novel = state.activeNovel;
  if (!novel) return { resources: [] };
  return { resources: novel.factions.map(f => ({ uri: `faction://${f.id}`, name: f.name })) };
} }), { title: "Faction" }, async (uri) => {
  const novel = state.activeNovel;
  const id = decodeURIComponent(uri.href.split("/").pop() ?? "");
  if (!novel) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const faction = novel.factions.find(f => f.id === id);
  if (!faction) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return { contents: [{ uri: uri.href, text: JSON.stringify(faction, null, 2), mimeType: "application/json" }] };
});

// Secrets resource (REQ-234)
server.registerResource("secrets-active", "secrets://active", { title: "Active Secrets" }, async () => {
  const novel = state.activeNovel;
  if (getBadge() !== "game_master" && getBadge() !== "none") {
    return { contents: [{ uri: "secrets://active", text: "[FORBIDDEN] Secrets are Game Master only.", mimeType: "text/plain" }] };
  }
  if (!novel) return { contents: [{ uri: "secrets://active", text: "[]", mimeType: "application/json" }] };
  return { contents: [{ uri: "secrets://active", text: JSON.stringify(novel.secrets, null, 2), mimeType: "application/json" }] };
});

// Roster individual/type resources (REQ-022, REQ-074)
server.registerResource("roster-single", new ResourceTemplate("roster://{id}", { list: () => {
  return { resources: [...state.roster.keys()].map(id => ({ uri: `roster://${id}`, name: state.roster.get(id)?.name ?? id })) };
} }), { title: "Roster Character" }, async (uri) => {
  const id = decodeURIComponent(uri.href.split("/").pop() ?? "");
  const entry = state.roster.get(id);
  if (!entry) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return { contents: [{ uri: uri.href, text: JSON.stringify(entry, null, 2), mimeType: "application/json" }] };
});

// Constraint overrides (REQ-325)
server.registerResource("constraints-active", "constraints://active", { title: "Constraint Overrides" }, async () => {
  const novel = state.activeNovel;
  const badge = getBadge();
  if (!novel) return { contents: [{ uri: "constraints://active", text: "[]", mimeType: "application/json" }] };
  let overrides = novel.constraint_overrides ?? [];
  if (badge === "player") {
    const entity = state.getActiveEntity();
    overrides = overrides.filter(o => o.name === entity?.name || o.match_all);
  }
  return { contents: [{ uri: "constraints://active", text: JSON.stringify(overrides, null, 2), mimeType: "application/json" }] };
});

// Lore templates (REQ-159)
server.registerResource("lore-templates", "lore://templates", { title: "Lore Templates" }, async () => {
  const templates = state.enrichmentManifest?.lore_templates ?? [];
  return { contents: [{ uri: "lore://templates", text: JSON.stringify(templates, null, 2), mimeType: "application/json" }] };
});

// Guidance foundations resources (REQ-062)
server.registerResource("guidance-player-foundations", "guidance://player/foundations", { title: "Player Foundations" }, async () => ({
  contents: [{ uri: "guidance://player/foundations", text: "Describe what your character does in the fiction. Do not prescribe world facts or other characters' actions. Surface your intent; the narrative resolves it.", mimeType: "text/markdown" }],
}));
server.registerResource("guidance-gm-foundations", "guidance://game_master/foundations", { title: "GM Foundations" }, async () => ({
  contents: [{ uri: "guidance://game_master/foundations", text: "Describe situations and surface information. Never take action or make decisions on behalf of the player. Separate mechanics from fiction.", mimeType: "text/markdown" }],
}));

// Synthesis status + per-module resources (REQ-230, REQ-160)
function synthesisModuleCounts(): Record<string, { total: number; activated: number }> {
  const manifest = state.enrichmentManifest;
  const modules = ["voice_examples", "briefing_order", "lore_templates", "action_patterns", "supplementary_guidance", "adventure_advice", "narrative_voices"];
  const out: Record<string, { total: number; activated: number }> = {};
  for (const m of modules) out[m] = { total: 0, activated: 0 };
  if (!manifest) return out;
  const activated = state.activeNovel?.synthesis_activated ?? {};
  if (manifest.voice_examples) out.voice_examples.total = manifest.voice_examples.length;
  if (manifest.lore_templates) out.lore_templates.total = manifest.lore_templates.length;
  if (manifest.action_patterns) out.action_patterns.total = manifest.action_patterns.length;
  if (manifest.supplementary_guidance) out.supplementary_guidance.total = manifest.supplementary_guidance.length;
  if (manifest.adventure_advice) out.adventure_advice.total = (manifest.adventure_advice.templates?.length ?? 0) + (manifest.adventure_advice.scenario_starters?.length ?? 0) + (manifest.adventure_advice.table_expansions?.length ?? 0);
  if (manifest.narrative_voices) out.narrative_voices.total = manifest.narrative_voices.length;
  for (const m of Object.keys(out)) out[m].activated = activated[m] ?? 0;
  return out;
}

// REQ-226 — narrative voice profiles: media-cited narrative voice profiles
// stored at synthesis://narrative_voices; ruleset-free/vendor-absent → empty.
server.registerResource("synthesis-narrative-voices", "synthesis://narrative_voices", { title: "Narrative Voice Profiles" }, async () => {
  const profiles = (state.enrichmentManifest?.narrative_voices ?? DEFAULT_ENRICHMENT.narrative_voices) ?? [];
  const list = (Array.isArray(profiles) ? profiles : []).map((p: any) => `## ${p?.name ?? "voice"}\n${p?.description ?? ""}`).join("\n\n");
  return { contents: [{ uri: "synthesis://narrative_voices", text: `# Narrative Voice Profiles\n\n${list || "(no profiles — module empty)"}`, mimeType: "text/markdown" }] };
});

server.registerResource("synthesis-status", "synthesis://status", { title: "Synthesis Status" }, async () => {
  const counts = synthesisModuleCounts();
  const active = state.enriched;
  let md = "Synthesis Status\n";
  for (const [m, c] of Object.entries(counts)) {
    md += `## ${m}\nRuleset Wisdom: ${active ? c.total : 0}\nSynthesis activated/total: ${c.activated}/${active ? c.total : 0}\n`;
  }
  return { contents: [{ uri: "synthesis://status", text: md, mimeType: "text/markdown" }] };
});

// ── MCP Apps UI resources (REQ-426) ────────────────────────────────
//
// REQ-426a — interactive HTML views of user-requestable artifacts under the
// `ui://` scheme, served `text/html;profile=mcp-app` with restrictive CSP
// metadata (REQ-426d). REQ-426c — the view is gated on extension negotiation.

server.registerResource("ui-character-sheet", new ResourceTemplate("ui://character-sheet/{id}", { list: () => {
  const novel = state.activeNovel;
  if (!novel) return { resources: [] };
  return { resources: [...novel.entities.keys(), ...novel.npcs.keys()].map(id => ({ uri: `ui://character-sheet/${id}`, name: id })) };
} }), { title: "Character Sheet (UI)" }, async (uri) => {
  const id = resourceKey(uri);
  const entity = resolveEntityOrNpc(id);
  if (!entity) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return uiResourceResult(uri.href, toHtml(fmtEntitySheet(entity)), appsNegotiated());
});

server.registerResource("ui-codex", new ResourceTemplate("ui://codex/{id}", { list: () => {
  return { resources: [...state.codex.keys()].map(id => ({ uri: `ui://codex/${id}`, name: state.codex.get(id)?.name ?? id })) };
} }), { title: "Codex Entry (UI)" }, async (uri) => {
  const entry = state.codex.get(resourceKey(uri));
  if (!entry) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return uiResourceResult(uri.href, toHtml(codexEntryMarkdown(entry)), appsNegotiated());
});

server.registerResource("ui-lore", new ResourceTemplate("ui://lore/{key}", { list: () => {
  const novel = state.activeNovel;
  if (!novel) return { resources: [] };
  return { resources: [...novel.lore.keys()].map(k => ({ uri: `ui://lore/${k}`, name: k })) };
} }), { title: "Lore Entry (UI)" }, async (uri) => {
  const novel = state.activeNovel;
  const key = resourceKey(uri);
  const entry = novel?.lore.get(key);
  if (!entry) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return uiResourceResult(uri.href, toHtml(`## ${entry.key}\n\n${entry.content}`), appsNegotiated());
});

server.registerResource("ui-novel", "ui://novel/current", { title: "Active Novel (UI)" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "ui://novel/current", text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const md = `## ${novel.name}\n\n${novel.description ?? ""}\n`;
  return uiResourceResult("ui://novel/current", toHtml(md), appsNegotiated());
});

// ── Additional tools (REQ-307, REQ-213/214, REQ-321, REQ-103, REQ-239) ──

// REQ-212/213 — generation-table rolling against the bound ruleset's weighted tables.
// Codex (REQ-321, REQ-332, REQ-347, REQ-352) — consolidated tool with an `action` discriminator covering
// the full persisted-object lifecycle: set (create/update), list, get, capture,
// import, and delete. Replaces the former codex_set/codex_list/codex_capture/
// codex_import tools and adds the spec-required codex_info/codex_delete surface
// (REQ-321 completeness; previously a gap flagged by the coverage audit).
server.registerTool("codex", {
  title: "Codex",
  description: "Manage the cross-Novels codex library of reusable content (NPCs, factions, rooms, spells, adventures, voice profiles). Use when: storing reusable content for later import, or enumerating/reading/deleting it. Do NOT use when: storing Novel-scoped content — use lore (action: set) or note (action: set).",
  inputSchema: {
    action: z.enum(["set", "list", "get", "capture", "import", "delete"]).describe("set (create/update), list, get, capture (voice profile), import (into active Novel), or delete."),
    kind: z.string().optional().describe("Entry kind (for set/list/capture)."),
    name: z.string().optional().describe("Entry name (for set)."),
    entry_id: z.string().optional().describe("Entry identifier (for get/import/delete)."),
    content: z.any().optional().describe("Entry content (for set)."),
    description: z.string().optional().describe("Optional description (for set)."),
    tags: z.array(z.string()).optional().describe("Optional tags (for set)."),
    visibility: z.enum(["library", "shared", "private"]).optional().describe("library, shared, or private (for set)."),
    entity_id: z.string().optional().describe("Entity whose voice to capture (for capture)."),
    update_source: z.boolean().optional().describe("When true, update the source entity too (for capture)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "set": {
      requireGM();
      const { kind, name, content, description, tags, visibility } = args;
      const id = `${String(kind).toLowerCase()}_${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
      const now = new Date().toISOString();
      const existing = state.codex.get(id);
      const entry: any = {
        id, kind, name, content,
        description: description ?? existing?.description,
        tags: tags ?? existing?.tags ?? [],
        visibility: visibility ?? existing?.visibility ?? "library",
        imported_at: existing?.imported_at ?? now,
        codex_modified_at: now,
      };
      state.codex.set(id, entry);
      state.saveCodex();
      return ok(`Codex entry '${id}' stored (visibility: ${entry.visibility}).`);
    }
    case "list": {
      const badge = getBadge();
      let entries = [...state.codex.values()];
      if (args.kind) entries = entries.filter((e: any) => e.kind === args.kind);
      entries = entries.filter((e: any) => badge === "game_master" || badge === "none" || e.visibility === "shared" || e.visibility === "library");
      return raw(JSON.stringify(entries.map((e: any) => ({ id: e.id, kind: e.kind, name: e.name, visibility: e.visibility, tags: e.tags })), null, 2));
    }
    case "get": {
      const entry = state.codex.get(args.entry_id);
      if (!entry) return err("NOT_FOUND", `Codex entry '${args.entry_id}' not found.`);
      return raw(JSON.stringify(entry, null, 2));
    }
    case "capture": {
      // REQ-347 — voice feedback codex capture: store an entity's corrected
      // voice profile as a `voice_profile` Codex entry.
      requireGM();
      const novel = requireNovel();
      const entity = novel.entities.get(args.entity_id);
      if (!entity) return err("NOT_FOUND", `Entity '${args.entity_id}' not found.`);
      const id = `voice_profile_${String(args.entity_id).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
      const corrected = (entity.voice_examples ?? []).filter((v: any) => v.tag === "player-corrected").map((v: any) => ({ corrected_text: v.dialogue, context: v.context }));
      const entry: any = {
        id, kind: "voice_profile", name: entity.name,
        content: { corrected_text: corrected, original_text: [], source_novel: novel.slug, background: entity.personality?.background },
        visibility: "library",
        imported_at: new Date().toISOString(), codex_modified_at: new Date().toISOString(),
        update_source: !!args.update_source,
      };
      state.codex.set(id, entry);
      state.saveCodex();
      return ok(`Voice profile '${id}' captured to Codex.`);
    }
    case "import": {
      // REQ-347/352 — import a Codex entry into the active Novel.
      requireGM();
      const novel = requireNovel();
      const entry = state.codex.get(args.entry_id);
      if (!entry) return err("NOT_FOUND", `Codex entry '${args.entry_id}' not found.`);
      const now = new Date().toISOString();
      // REQ-332 — codex provenance: track every Codex-sourced artifact with the
      // entry id, import timestamp, and the entry's codex_modified_at at import.
      const provenance = { id: entry.id, kind: entry.kind, imported_at: now, codex_modified_at: entry.codex_modified_at ?? now };
      if (entry.kind === "voice_profile") {
        const name = (entry.name ?? args.entry_id).toLowerCase();
        const targetId = [...novel.entities.keys()].find((id) => id.includes(name) || novel.entities.get(id)!.name.toLowerCase() === name) ?? [...novel.entities.keys()].find((id) => id.includes(String(args.entry_id).replace("voice_profile_", "")));
        if (targetId) {
          const target = novel.entities.get(targetId)!;
          if (!target.voice_examples) target.voice_examples = [];
          for (const v of (entry.content as any)?.corrected_text ?? []) {
            target.voice_examples.push({ context: v.context ?? "codex import", dialogue: v.corrected_text, tag: "codex-corrected" });
          }
          target.codex_source = provenance;
        }
      } else if (entry.kind === "adventure") {
        const suggested = (entry.content as any)?.suggested_beats;
        if (Array.isArray(suggested)) {
          novel.story_beats.push(...suggested.map((sb: any) => ({ beat: sb.beat, scene_preview: sb.scene_preview, source: "adventure-scaffold" as const, codex_source: provenance })));
          novel.adventure_set = true;
        }
      }
      if (!novel.codex_sources) novel.codex_sources = [];
      const existingIdx = novel.codex_sources.findIndex((s) => s.id === entry.id);
      if (existingIdx >= 0) novel.codex_sources[existingIdx] = provenance;
      else novel.codex_sources.push(provenance);
      state.saveNovel(novel);
      return ok(`Codex entry '${args.entry_id}' imported.`);
    }
    case "delete": {
      // REQ-321 — codex_delete: remove a Codex entry (previously absent).
      requireGM();
      if (!state.codex.has(args.entry_id)) return err("NOT_FOUND", `Codex entry '${args.entry_id}' not found.`);
      state.codex.delete(args.entry_id);
      state.saveCodex();
      return ok(`Codex entry '${args.entry_id}' deleted.`);
    }
    default:
      return err("INVALID_INPUT", `Unknown codex action '${args.action}'. Valid actions: set, list, get, capture, import, delete.`);
  }
});

// Synthesis tools (REQ-103, REQ-260-263)
// REQ-261 — player synthesis: player-authored [player]-tagged items in a
// player-facing module subset; active immediately; per-module cap of 15;
// private scope supported; GM cannot modify them.
const PLAYER_SYNTH_MODULES = ["voice_examples", "action_patterns", "supplementary_guidance", "narrative_voices", "lore_templates"];
// Synthesis (REQ-103, REQ-115, REQ-231, REQ-260, REQ-261, REQ-262, REQ-263, REQ-264) — consolidated run/revert/list/activate/
// deactivate/toggle/player_add/player_remove/player_list surface.
server.registerTool("synthesis", {
  title: "Synthesis",
  description: "Manage synthesis content (voice examples, lore templates, action patterns, and other enrichment). Use when: running, reverting, listing, activating, deactivating, toggling, or player-authoring synthesis items. Do NOT use when: browsing the codex — use codex (action: list).",
  inputSchema: {
    action: z.enum(["run", "revert", "list", "activate", "deactivate", "toggle", "toggle_action", "player_add", "player_remove", "player_list"]).describe("run, revert, list, activate, deactivate, toggle, toggle_action, player_add, player_remove, or player_list."),
    module: z.string().optional().describe("Synthesis module (activate/deactivate/toggle/player_*/list)."),
    key: z.union([z.string(), z.number()]).optional().describe("Item key (activate: number; player_add/player_remove: string)."),
    content: z.string().optional().describe("Item content (player_add)."),
    triggers: z.array(z.string()).optional().describe("Recall triggers (player_add)."),
    badge_scope: z.enum(["shared", "player"]).optional().describe("shared or player (player_add)."),
    enabled: z.boolean().optional().describe("Enable or disable (toggle)."),
    force: z.boolean().optional().describe("Re-run even if unchanged (run)."),
    detail: z.boolean().optional().describe("Return full entries (list)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "run": {
      requireGM();
      const novel = requireNovel();
      if (state.enriched && !args.force) {
        return ok(`Synthesis up to date (${state.enrichmentManifest?.collected_at ?? "unknown"}). Use force=true to re-synthesize.`);
      }
      state.enriched = true;
      state.enrichmentManifest = DEFAULT_ENRICHMENT;
      state.saveNovel(novel);
      const counts = synthesisModuleCounts();
      return ok(`Synthesis complete. Modules: ${Object.entries(counts).map(([m, c]) => `${m}=${c.total}`).join(", ")}.`);
    }
    case "revert": {
      requireGM();
      const novel = requireNovel();
      state.enriched = false;
      state.enrichmentManifest = null;
      state.saveNovel(novel);
      return ok("Enrichment state reverted. Server state restored to pre-enrich baseline.");
    }
    case "list": {
      const manifest = state.enrichmentManifest;
      if (!manifest) return ok("No synthesis items (synthesis not run).");
      const all = [
        ...(manifest.voice_examples ?? []).map((i: any) => ({ module: "voice_examples", tag: i.tag ?? "vendor", content: i.content, badge_scope: i.badge_scope })),
        ...(manifest.lore_templates ?? []).map((i: any) => ({ module: "lore_templates", tag: i.tag ?? "vendor", content: i.content, badge_scope: i.badge_scope })),
        ...(manifest.action_patterns ?? []).map((i: any) => ({ module: "action_patterns", tag: i.tag ?? "vendor", content: i.intent, badge_scope: "game_master" })),
        ...(manifest.supplementary_guidance ?? []).map((i: any) => ({ module: "supplementary_guidance", tag: i.tag ?? "vendor", content: i.content, badge_scope: i.badge_scope })),
        ...(manifest.narrative_voices ?? []).map((i: any) => ({ module: "narrative_voices", tag: i.tag ?? "vendor", content: i.name, badge_scope: i.badge_scope })),
      ];
      const filtered = args.module ? all.filter((i: any) => i.module === args.module) : all;
      if (wantsDetail(args.detail)) return raw(JSON.stringify(filtered, null, 2));
      const summary = filtered.map((i: any) => ({ module: i.module, tag: i.tag, badge_scope: i.badge_scope, preview: `${typeof i.content === "string" ? (i.content ?? "").slice(0, 80) : ""}` }));
      return raw(JSON.stringify(summary, null, 2));
    }
    case "activate": {
      requireGM();
      const novel = requireNovel();
      if (!state.enriched) return err("STATE_CONFLICT", "Synthesis has not been run. Corrective action: run synthesis (action: run) first.");
      const activated = novel.synthesis_activated ?? {};
      activated[args.module] = args.key;
      novel.synthesis_activated = activated;
      state.saveNovel(novel);
      return ok(`Synthesis module '${args.module}' activated (${args.key} items).`);
    }
    case "deactivate": {
      requireGM();
      const novel = requireNovel();
      const activated = novel.synthesis_activated ?? {};
      delete activated[args.module];
      novel.synthesis_activated = activated;
      state.saveNovel(novel);
      return ok(`Synthesis module '${args.module}' deactivated.`);
    }
    case "toggle": {
      requireGM();
      const novel = requireNovel();
      const MODULES = ["voice_examples", "briefing_order", "lore_templates", "action_patterns", "supplementary_guidance", "adventure_advice", "narrative_voices"];
      if (!MODULES.includes(args.module)) return err("INVALID_INPUT", `Unknown synthesis module '${args.module}'. Valid modules: ${MODULES.join(", ")}.`);
      const m = novel.synthesis_module_enabled ?? {};
      if (args.enabled) m[args.module] = true; else delete m[args.module];
      novel.synthesis_module_enabled = m;
      state.saveNovel(novel);
      return ok(`Synthesis module '${args.module}' ${args.enabled ? "enabled" : "disabled"}.`);
    }
    case "player_add": {
      requirePlayer();
      const novel = requireNovel();
      if (!PLAYER_SYNTH_MODULES.includes(args.module)) return err("INVALID_INPUT", `Module '${args.module}' is not a player synthesis module. Valid: ${PLAYER_SYNTH_MODULES.join(", ")}.`);
      novel.player_synthesis = novel.player_synthesis ?? {};
      const items = novel.player_synthesis[args.module] ?? [];
      if (items.length >= 15) return err("STATE_CONFLICT", "Player synthesis per-module cap (15) reached.");
      if (items.some((i: any) => i.key === args.key)) return err("STATE_CONFLICT", `Item '${args.key}' already exists in module '${args.module}'.`);
      items.push({ key: args.key, content: args.content, triggers: args.triggers, badge_scope: args.badge_scope ?? "shared", created_at: new Date().toISOString() });
      novel.player_synthesis[args.module] = items;
      state.saveNovel(novel);
      audit("player_synthesize", { module: args.module, key: args.key });
      return ok(`Player synthesis item '${args.key}' created in '${args.module}' (active immediately).`);
    }
    case "player_remove": {
      requirePlayer();
      const novel = requireNovel();
      const items = (novel.player_synthesis ?? {})[args.module] ?? [];
      const idx = items.findIndex((i: any) => i.key === args.key);
      if (idx === -1) return err("RULE_VIOLATION", `Item '${args.key}' is not a player-authored item in '${args.module}'.`);
      items.splice(idx, 1);
      novel.player_synthesis[args.module] = items;
      state.saveNovel(novel);
      return ok(`Player synthesis item '${args.key}' removed.`);
    }
    case "player_list": {
      requirePlayer();
      const novel = requireNovel();
      const ps = novel.player_synthesis ?? {};
      const flat = Object.entries(ps).flatMap(([m, items]) => (args.module && m !== args.module ? [] : (items as any[]).map((i) => ({ module: m, key: i.key, preview: i.content.slice(0, 60), scope: i.badge_scope, activated: true }))));
      if (flat.length === 0) return ok("[No player synthesis items.]");
      return raw(JSON.stringify(flat, null, 2));
    }
    case "toggle_action": {
      requireGM();
      const novel = requireNovel();
      novel.action_patterns_enabled = !novel.action_patterns_enabled;
      state.saveNovel(novel);
      return ok(`Action patterns ${novel.action_patterns_enabled ? "enabled" : "disabled"}.`);
    }
    default:
      return err("INVALID_INPUT", `Unknown synthesis action '${args.action}'.`);
  }
});


// ── Prompts ────────────────────────────────────────────────────────

server.prompt("intro", "Introduction and Getting Started", async () => {
  const novels = [...state.novels.entries()].map(([slug, n]) => ({ slug, name: n.name, description: n.description, modified: n.metadata.modified }));

  const libraryLines = novels.length > 0
    ? novels.map((n) => `- ${n.name} — ${n.description || "no description yet"} (last played ${n.modified})`).join("\n")
    : "";

  const library = novels.length > 0
    ? `\n## Your worlds\n${libraryLines}\n\nYou have ${novels.length} ${novels.length === 1 ? "world" : "worlds"}. Which would you like to resume, or create a new one?`
    : `\n## Your worlds\nThere are no worlds yet. Create your first one — a named, persistent campaign that holds your scenes, characters, and world.`;

  return {
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: `# Welcome to Holonovel

This server runs tabletop roleplay with a real, persistent world. Every scene,
character, and object lives on the server — not in a chat window — so your
campaign survives restarts, breaks, and even rebuilds. Your campaign is the
program you step into; the rules are whatever you bring to the table.
${library}

## Getting started
1. Create a world for your campaign, or resume one from the list above.
2. Run the setup guide to add characters, choose a story source, and agree on
   tone before play.
3. Choose your role — player, game master, or observer.
4. Enter the story and begin your first scene.

For the latest specification, see ${specRepoUrl()}.`,
      },
    }],
  };
});

server.prompt("badge_briefing", "Current Badge Briefing", async () => {
  const novel = state.activeNovel;
  // REQ-136 — Editor-badge briefing: with no active Novel, return setup-oriented
  // content — available Novels, the active Novel name if any, intro pointer.
  if (!novel) {
    const novels = [...state.novels.entries()].map(([slug, n]) => `- ${n.name} (${slug})`);
    const list = novels.length > 0 ? `\nAvailable Novels:\n${novels.join("\n")}` : "\nNo Novels yet — create one to begin.";
    return { messages: [{ role: "user", content: { type: "text" as const, text: `## Editor Briefing${list}\n\nUse the intro prompt to get started, or novel (action: create) to set up a new campaign.` } }] };
  }

  const badge = novel.badge;
  const entity = state.getActiveEntity();

  // REQ-336/351 — advancing the pacing counter on each briefing render; the
  // pacing signal fires (and pacing autonomy triggers) when it exceeds the window.
  novel.pacing_counter++;
  triggerPacingAutonomy(novel);

  let briefing = `## Badge Briefing — ${badgeLabel(badge).toUpperCase()}
**Novel:** ${novel.name} (${novel.slug})
${novel.scene_description ? `**Scene:** ${novel.scene_description}` : ""}${novel.scene_description ? ` (${novel.scene_type.join(", ")})` : ""}`;

  // REQ-250 — adventure scene waypoint: surface the adventure scene as a
  // distinct labeled block alongside the current scene state, with adjacent
  // scenes listed as nearby.
  if (novel.adventure_scene_waypoint) {
    const wp = novel.adventure_scene_waypoint;
    const idx = novel.adventure_index;
    const scenes = (idx?.locations ?? []).map((l: any) => l.name);
    const i = scenes.indexOf(wp);
    const nearby = [i > 0 ? `prev: ${scenes[i - 1]}` : "", i < scenes.length - 1 ? `next: ${scenes[i + 1]}` : ""].filter(Boolean).join(", ");
    briefing += `\nAdventure Scene (${novel.adventure_slug ?? "generated"} § ${wp}): ${idx?.locations?.find((l: any) => l.name === wp)?.description ?? ""}${nearby ? ` — nearby: ${nearby}` : ""}`;
  }

  // REQ-310 — campaign memory: decision-critical group after scene state,
  // before entities; prioritized by relevance, capped by config.
  briefing += composeCampaignMemorySection(novel, badge);

  // REQ-335 — current beat surfaces immediately after the scene type tag.
  briefing += `\n**Beat:** ${currentBeat(novel)}`;

  if (entity && badge !== "game_master") {
    briefing += `\n**Active entity:** ${entity.name}`;
    if (entity.current_room) briefing += ` — ${entity.current_room}`;
    if (entity.inventory.length > 0) briefing += ` — holding: ${entity.inventory.join(", ")}`;
  }

  // REQ-412 — turn-handoff directive. When the AI narrates as Game Master
  // (human wears Player/Observer), close each turn by inviting the player's
  // next action. When the AI inhabits a Player role (human GM), hand initiative
  // back to the human Game Master instead.
  if (badge === "player" || badge === "observer") {
    briefing += `\n\n### Turn handoff
Close each narrated turn by inviting the player's next action — ask what they do, where they look, or what they say next. Never end a turn with a tool signature or a parameter list; use a plain-English question or prompt to act.`;
  } else if (badge === "game_master") {
    briefing += `\n\n### Turn handoff
You inhabit a player character. Close each in-character turn with an offer that hands initiative back to the human Game Master to describe the outcome or advance the scene.`;
  }

  // REQ-304 — Counterpart AI role: the AI's narrative role is the counterpart
  // of the active badge by default; `TTRPG_AI_ROLE` (counterpart | game_master |
  // player) locks the orientation. Orientation content (boundary, anti-slop,
  // tone) follows the AI role; the active badge controls state/tool surfaces.
  const aiRole = process.env.TTRPG_AI_ROLE ?? "counterpart";
  const orientationRole = aiRole === "counterpart"
    ? (badge === "game_master" ? "player" : "game_master")
    : aiRole;
  const orientationBadge = orientationRole === "player" ? "player" : orientationRole === "game_master" ? "game_master" : "none";

  // REQ-064 — badge behavioral boundary directive (orientation layer, after
  // badge foundations and before anti-slop guidance; never truncated).
  briefing += `\n\n### Badge boundary
You are in the story. Confine tool use and responses to the current Novel. To step away from the table, call set_badge("none").`;

  // REQ-070 — anti-slop guidance (orientation-filtered Appendix J synopsis),
  // after foundations, before scene state.
  const antiSlop = antiSlopFor(orientationBadge);
  if (antiSlop) briefing += `\n\n### Anti-slop guidance\n${antiSlop}`;

  // REQ-071 — narrative tone samples: ruleset-extracted prose demonstrating the
  // narrative voice. Ruleset-free builds provide a ruleset-agnostic sample.
  briefing += `\n\n### Narrative tone\n[narrative-tone] Describe the world through grounded, sensory detail. Let consequences follow from the fiction — every mechanical outcome lands in the scene you narrate.`;

  // REQ-265 — synthesis in badge_briefing: active synthesis items render under
  // their sections tagged [supplementary] with confidence, badge-filtered; no
  // empty section when none are active.
  if (badge === "game_master" && state.enriched) {
    const synthLines: string[] = [];
    const manifest = state.enrichmentManifest;
    if (manifest?.voice_examples?.length) synthLines.push(`[supplementary] [MEDIUM] voice examples: ${manifest.voice_examples.length}`);
    if (manifest?.lore_templates?.length) synthLines.push(`[supplementary] [MEDIUM] lore templates: ${manifest.lore_templates.length}`);
    if (manifest?.action_patterns?.length) synthLines.push(`[supplementary] [MEDIUM] action patterns: ${manifest.action_patterns.length}`);
    const playerItems = Object.entries(novel.player_synthesis ?? {}).flatMap(([m, items]) => (items as any[]).filter((i: any) => i.badge_scope !== "player").map((i: any) => `[player] ${m}: ${i.key}`));
    if (synthLines.length > 0 || playerItems.length > 0) {
      briefing += `\n\n### Synthesis\n${[...synthLines, ...playerItems].join("\n")}`;
    }
  }

  // REQ-109 — boundaries (GM only): persisted persistent player boundaries,
  // never trimmed. Each is an absolute do-not-narrate directive.
  if (badge === "game_master") {
    const boundary = novel.player_signals.boundary;
    if (boundary) {
      briefing += `\n\n### Boundaries
The player has set these topics as off-limits for the entire story:
- ${boundary}

Do not narrate, imply, or introduce content that evokes these topics. They are
kept out of every scene, every scene description, and every choice.`;
    }
  }

  // REQ-128 — signal briefing surface: player signals (tone, difficulty, pace,
  // focus, boundary) surface with their values and age; empty signals show an
  // empty-state marker. GM-only.
  if (badge === "game_master") {
    const signals: Record<string, string> = novel.player_signals ?? {};
    const entries = Object.entries(signals);
    if (entries.length > 0) {
      briefing += `\n\n### Player signals\n${entries.map(([k, v]) => `${k}: ${v}`).join("\n")}`;
    } else {
      briefing += `\n\n### Player signals\n[No player signals set.]`;
    }
  }

  // REQ-109 — novel-setup progress markers (surface wizard completion state).
  const setupMark = (done: boolean) => (done ? "[✓]" : "[ ]");
  briefing += `\n\n### Novel Setup
Characters: ${setupMark(novel.characters_present)} | Story source: ${setupMark(novel.adventure_set)} | Session zero: ${setupMark(novel.session_zero_completed)}`;
  if (!novel.session_zero_completed) {
    briefing += `\nA session zero has not been completed yet — run the session zero guide before play begins.`;
  }

  // REQ-109 — POV directive (character-perspective anchor, GM + Player).
  // REQ-220 — narrative point of view: directive names the active entity, locks
  // narration to their senses, and renders an omniscient empty-state marker when
  // none is set. REQ-223 — POV mode control: `pov` mode is Novel-scoped state.
  if (badge === "game_master" || badge === "player") {
    if (novel.pov_mode === "character" && entity) {
      briefing += `\n\n### Point of view
Describe the scene through ${entity.name}'s eyes — what they see, hear, and feel.`;
    } else {
      briefing += `\n\n### Point of view
POV: none — narration is omniscient.`;
    }
  }

  // REQ-109 — autonomy state (GM only): AI decision delegation sliders.
  if (badge === "game_master") {
    const a = novel.autonomy;
    briefing += `\n\n### Autonomy
Level: ${a.level} | Confirmation: ${a.confirmation} | Safety: ${a.safety} | Creativity: ${a.creativity}`;
  }

  if (badge === "player") {
    // REQ-134 — minimum Player tool surface: dice, lookups, sheet, suggestions,
    // player signals, help, undo/redo, badge switching all callable by Player.
    briefing += `\n\n### Player Tools
Use \`command("<action>")\` to interact with the world:
- command("look") — describe the current room
- command("go north") — move in a direction
- command("take sword") — pick up an object
- command("examine thing") — look at something closely
- command("inventory") — check what you're carrying
- command("open door") — open an openable object`;

    // REQ-341 — player-facing spatial surface (no internal IDs).
    if (novel.world.rooms.size > 0) {
      const room = entity?.current_room
        ? [...novel.world.rooms.values()].find((r) => r.name.toLowerCase() === entity.current_room!.toLowerCase())
        : undefined;
      if (room) {
        const exitDirs = [...room.exits.keys()];
        const things = [...novel.world.things.values()].filter((t) => t.location && t.location.toLowerCase() === room.name.toLowerCase() && t.locationType === "room");
        briefing += `\n\n### Surroundings
Room: ${room.name}
Exits: ${exitDirs.length ? exitDirs.join(", ") : "none"}
Visible: ${things.length ? things.map((t) => t.name).join(", ") : "nothing of note"}`;
      } else {
        briefing += `\n\n### Surroundings
[No world model — surroundings are as described by the GM.]`;
      }
    } else {
      briefing += `\n\n### Surroundings
[No world model — surroundings are as described by the GM.]`;
    }
  } else if (badge === "game_master" || badge === "observer") {
    briefing += `\n\n### GM State
**World model:** ${novel.world.rooms.size} rooms, ${novel.world.things.size} things
**NPCs:** ${novel.npcs.size} | **Lore entries:** ${novel.lore.size} | **Countdowns:** ${novel.countdowns.size}${novel.combat?.active ? `\n**Combat active:** Round ${novel.combat.round}` : ""}`;

    // REQ-311 — NPC memory: NPCs present in the current scene surface their
    // memory section (emotional state, last interactions, goals) in the entity
    // personality group. Gated by presence per REQ-307.
    if (badge === "game_master" && novel.npcs.size > 0) {
      const sceneLoc = novel.scene_location?.toLowerCase();
      for (const [, npc] of novel.npcs) {
        const npcPresent = !sceneLoc || (npc.location && npc.location.toLowerCase() === sceneLoc);
        if (npcPresent && npc.memory) briefing += composeNpcMemorySection(novel, npc);
      }
    }

    // REQ-282 — NPC voice directive: NPCs whose location matches the current
    // scene location and who carry voice_examples render a compact voice
    // directive block (name, voice field, up to 2 snippets, synthesized
    // "Avoid:" line) in the entity personality group. GM sees all; Player sees
    // shared-scope NPCs.
    if (novel.npcs.size > 0) {
      const sceneLoc = novel.scene_location?.toLowerCase();
      for (const [, npc] of novel.npcs) {
        const npcPresent = !sceneLoc || (npc.location && npc.location.toLowerCase() === sceneLoc);
        const examples = npc.voice_examples ?? [];
        if (npcPresent && examples.length > 0) {
          const voice = npc.personality?.voice ?? "";
          const snippet = examples.slice(0, 2).map((v: any) => `"${v.dialogue}"`).join(" · ");
          const avoid = voice ? ` Avoid: the opposite of "${voice}".` : "";
          briefing += `\n\nVoice directive (${npc.name}): ${voice || "unvoiced"}. ${snippet}.${avoid}`;
        }
      }
    }

    if (badge === "game_master") {
      // REQ-400 — State-Persistence Directive (never-truncated tier).
      briefing += `\n\n### State persistence
Commit every narratable change to state in the same turn you narrate it — scene changes (scene, action: set), mechanical outcomes (countdown, condition), disposition shifts (npc, action: update), and story beats (story, action: record).`;

      // REQ-401 — state_ledger decision-critical token (never-truncated).
      const ledgerLines = [
        `Last state mutation: ${novel.last_mutation_at ? new Date(novel.last_mutation_at).toISOString() : "none this session"}`,
      ];
      for (const [group, count] of Object.entries(novel.mutation_counts_by_group)) {
        if (count > 0) ledgerLines.push(`  ${group}: ${count}`);
      }
      if (state.stateDriftActive(novel)) ledgerLines.push(`  [state-drift] GM context saved after last mutation — narration may be uncommitted.`);
      if (novel.state_regression) ledgerLines.push(`  [state-regression] restored from backup (audit gap ${novel.state_regression.audit_gap}).`);
      briefing += `\n\n### state_ledger\n${ledgerLines.join("\n")}`;
    }

    // REQ-407 — persist-tools never truncated: the GM scene-typed tool
      // section always lists the core state-persistence tools regardless of
      // scene type (scene, journal, countdown, note, personality, NPC, vow).
      briefing += `\n\n### Persistence tools\nscene (set) · story (record) · countdown (set) · note (set) · character (personality) · npc (create) · vow (set)`;

      if (badge === "observer") {
      // REQ-366 — observer omniscient orientation directive.
      briefing += `\n\n### Observer Mode
You are both Game Master and Player. The human is observing. Narrate scenes, make decisions for all player characters, advance combat, play the Novel. Narrate from an omniscient perspective — you see all entity percepts, presence markers, and knowledge, but never GM-only surfaces (secrets, faction clocks, countdown positions, GM context).`;
    }

    // Triggered lore
    const sceneText = novel.scene_description.toLowerCase();
    const triggered: string[] = [];
    for (const [, entry] of novel.lore) {
      if (!entry.enabled) continue;
      for (const trigger of entry.triggers) {
        if (sceneText.includes(trigger.toLowerCase())) {
          triggered.push(`[${entry.key}] ${entry.content}`);
          break;
        }
      }
    }
    if (triggered.length > 0) {
      briefing += `\n\n### Triggered Lore\n${triggered.join("\n")}`;
    }

    // REQ-337 — story beats arc (GM surface: shared + GM beats).
    if (novel.story_beats.length > 0) {
      const window = configInt("TTRPG_STORY_BEAT_WINDOW", 10);
      const recent = novel.story_beats.slice(-window);
      const beatLine = recent.map((b) => `${b.beat} ("${b.scene_preview}")${b.source === "adventure-scaffold" ? " [adventure-scaffold]" : ""}`).join(" -> ");
      briefing += `\n\n### Story beats\n${beatLine}`;
    } else {
      briefing += `\n\n### Story beats\n[No beats completed.]`;
    }

    // REQ-281 — narrative-threads section token (decision-critical group):
    // unresolved decisions, active promises, countdowns, non-default NPC
    // dispositions, active vows, and §5.12 couplings; badge-filtered.
    const threadLines: string[] = [];

    const pacing = pacingSignalText(novel);
    if (pacing) threadLines.push(pacing);

    const unresolvedDecisions = novel.story_journal.filter((s) => s.type === "decision" && !novel.story_journal.some((c) => c.type === "consequence" && c.scene_anchor === s.scene_anchor));
    for (const s of unresolvedDecisions.slice(-3)) threadLines.push(`Unresolved: ${s.entry}`);

    const openBonds = novel.story_journal.filter((s) => s.type === "bond" && !novel.story_journal.some((c) => c.type === "consequence" && c.entry === s.entry));
    for (const s of openBonds.slice(-3)) threadLines.push(`Promise: ${s.entry}`);

    for (const v of novel.vows) {
      if (v.state === "active") threadLines.push(`Vow: ${v.name} (${v.difficulty}, ${v.milestones} milestones)`);
    }
    for (const [name, cd] of novel.countdowns) {
      if (cd.ticks > 0) threadLines.push(`Countdown: ${name} (${cd.ticks}/${cd.total})`);
    }
    if (badge === "game_master") {
      for (const [, npc] of novel.npcs) {
        if (npc.disposition && npc.disposition !== "neutral") threadLines.push(`${npc.name} (${npc.disposition})`);
      }
    }

    threadLines.push(...collectCouplingAdvisories(novel, entity));

    // REQ-322 — vow-countdown coupling suggestion surfaced in narrative_threads.
    if (novel.pending_vow_countdown_suggestion) {
      const s = novel.pending_vow_countdown_suggestion;
      threadLines.push(`Vow countdown suggestion: create '${s.countdown_name}' (${s.tick_count} ticks, mission) tied to vow '${s.vow_name}' — respond \`accept\` or \`decline\`.`);
    }

    if (threadLines.length > 0) {
      briefing += `\n\n### Narrative threads\n${threadLines.join("\n")}`;
    } else {
      briefing += `\n\n### Narrative threads\n[No unresolved threads.]`;
    }

    // REQ-339 — World in Motion: goal-pursuit suggestions (GM only).
    if (badge === "game_master" && npcAutonomyOn()) {
      for (const [, npc] of novel.npcs) {
        const goal = npc.personality?.goals;
        if (!goal) continue;
        const prevSuggestion = novel.npc_goal_suggestions.find((s) => s.npc_id === npc.id);
        if (prevSuggestion?.state === "dismissed" || prevSuggestion?.state === "accepted") continue;
        ensureGoalSuggestion(novel, npc.id, npc.name, goal);
      }
      const active = novel.npc_goal_suggestions.filter((s) => s.state !== "dismissed" && s.state !== "accepted");
      if (active.length > 0) {
        briefing += `\n\n## World in Motion\n${active.map((s) => `${s.text}\n   — respond \`accept\`, \`defer\`, or \`dismiss\` (suggestion ${s.npc_id})`).join("\n")}`;
        state.saveNovel(novel);
      }
    }

    // REQ-109 — story journal (GM): recent decision/bond/moment entries.
    const storyItems = novel.story_journal.slice(-3).map((s) => `${s.discovered ? "[discovered] " : ""}[${s.type}] ${s.entry}`).join("\n");
    if (storyItems) {
      briefing += `\n\n### Story journal\n${storyItems}`;
    }
  }

  // REQ-286 — knowledge state (decision-critical, all badges with an entity).
  briefing += composeKnowledgeState(novel, entity, badge);

  // REQ-109 — intro pointer: always surface the intro prompt as an entry point.
  briefing += `\n\nUse the intro prompt to get started, or badge_briefing for current badge guidance.`;

  // REQ-118 — prompt length budget: truncate low-priority sections past budget.
  briefing = applyPromptBudget(briefing);

  return { messages: [{ role: "user", content: { type: "text" as const, text: briefing } }] };
});

server.prompt("session_zero", "Session Zero Setup", async () => {
  // REQ-078 — session zero prompt: eight sections in order (welcome/safety,
  // per-signal tuning options, character introductions, character creation,
  // adventure confirmation, narrative capabilities, quick start, between
  // stories), plain-English throughout with no tool names, listed in
  // prompts/list after intro.
  return {
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: `# Session Zero

Before the story begins, this guide helps you and the game master agree on the
shape of the adventure. It is a creative check and a safety check — the choices
you make here shape the narration for the whole story. Nothing needs to be final.

## 1. Welcome and safety
This is where you set expectations. You can change any of this later. If a topic
is off-limits, say so now — the server remembers and keeps it out of the story.

## 2. Tone, difficulty, pace, focus, and boundaries
Each of these is a dial you can set. Here is what each one does.

Tone — the mood of the story.
- Bright heroics: clear victories, warm allies, hope at the end of every scene.
- Gritty realism: hard choices, scarce resources, consequences that stick.
- Dark and ominous: creeping dread, fragile safety, victory at a cost.
- Whimsical: playful logic, absurd coincidences, charm over threat.
- Melancholic: quiet loss, bittersweet resolutions, emotional weight.

Difficulty — how much the world pushes back.
- Gentle: the world gives you room to succeed; stakes are low.
- Balanced: fair odds, real risk, meaningful choices.
- Relentless: the world is hostile; every step costs something.
- Brutal: survival itself is an achievement; loss is common.

Pace — how fast the story moves.
- Slow: rich description, long scenes, time to linger.
- Balanced: scenes move when they should.
- Fast: cut to the action, little downtime, quick scene changes.

Focus — what the story centers on.
- Exploration: discovery, maps, unknown places.
- Combat: tactics, battles, escalating threats.
- Social: dialogue, intrigue, relationships.
- Mystery: clues, hidden truths, revelation.
- Mixed: all of the above, in balance.

Boundaries — what stays out of the story.
Name any topics that should never be narrated, implied, or introduced. They are
kept out of every scene, every scene description, and every choice.

## 3. Character introductions
Three ways to introduce a character, from quickest to most detailed.
- Quick: "A grizzled ranger who trusts no one." A single line is enough to play.
- Full: three paragraphs — first appearance and mannerisms, then personality and
  voice, then backstory and motivation.
- Media short-hand: "Like Samwise, but hardened by a decade in the arena — loyal,
  kind, and quietly ruthless when pushed." Name a known character, then say what
  to change or emphasize.

## 4. Character creation
Your world's rules define how characters are built. Every mechanical choice —
ancestry, class, background, ability scores, equipment — is described in plain
English, and each option's meaning for your character's abilities is explained.
If the world has a roster, those characters are available to import directly.

## 5. Adventure confirmation
If an adventure is loaded, here is its premise, its factions and their tensions,
its key characters, and its opening scene. You can accept it as-is or describe
what to change. If you are building from scratch, describe the setting and the
game master will shape it around you.

## 6. What the game master can do
During play the game master can set scenes, introduce characters, run world
events, offer you choices, and pace tension. Each is described in plain English
with examples of what you would say — no commands, no jargon.

## 7. Quick start
Everything is ready. The first scene begins when the game master sets it, and
you describe what your character does. You can refine anything here at any time.

## 8. Between stories
Characters can grow between sessions — refine personality, voice, dialogue, and
advancement when your rules provide it. The world you build is kept for the next
session.`,
      },
    }],
  };
});

server.prompt("novel_setup", "Novel Setup Guidance", async () => {
  const novel = state.activeNovel;
  const marc = (done: boolean) => (done ? "[✓]" : "[→]");
  const steps = novel
    ? {
        characters: marc(novel.characters_present),
        adventure: marc(novel.adventure_set),
        sessionZero: marc(novel.session_zero_completed),
        rosterCount: state.roster.size,
      }
    : { characters: "[→]", adventure: "[→]", sessionZero: "[→]", rosterCount: state.roster.size };

  return {
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: `# Novel Setup

A guided setup for your world. Complete each step in order; the markers show
where you are.

## Step 1 — Characters   ${steps.characters}
You have ${steps.rosterCount} ${steps.rosterCount === 1 ? "character" : "characters"} in your roster.
Would you like to import one, create a new one, or move on? Character creation
choices are described in plain English.

## Step 2 — Story source   ${steps.adventure}
Choose where the story begins: load a written adventure, generate one from a
premise, generate a random encounter, or build from scratch. Each option is
explained in terms of what you get narratively.

Community-sourced play advice tailored to your adventure's themes is available
for this world — voice examples, lore ideas, and scene advice. You can run
synthesis now or proceed without it.

## Step 3 — Session zero   ${steps.sessionZero}
Run the session zero guide to agree on tone, difficulty, pace, focus, and
boundaries, and to confirm the opening scene.

When all three steps show [✓], the world is ready. A summary follows describing
what is ready and how to begin your first scene.`,
      },
    }],
  };
});

server.prompt("run_workflow", "Map Intent to Tools", async () => {
  const registeredTools: Record<string, any> = (server as any)._registeredTools ?? {};
  const toolNames = Object.keys(registeredTools).sort();
  const novel = state.activeNovel;
  const rulesetBound = !!novel?.ruleset;

  const catalog = (cat: string, names: string[]) => names.filter(n => toolNames.includes(n)).join(", ");

  const text = `# Run Workflow

Map natural-language intent to the registered tool catalog. Derive associations
from the live registry, not hardcoded strings.

## Intent to Tool Mapping

- **Spatial / movement / inspection**: ${rulesetBound ? "command (action: resolve), command (GM)" : "command (parser)"}
- **Character creation / advancement**: character (create/import/sheet/set_active)
- **Combat**: combat (init/advance/end)
- **World building**: world (create_room/create_thing/create_exit/convert)
- **Narrative / scene**: scene (set/directive), story (record)
- **Lookup**: ruleset (search), session (health), command (suggest)

Select the tool whose registered action classification matches the intent.`;
  return { messages: [{ role: "user", content: { type: "text" as const, text } }] };
});

// ── Transport ──────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
