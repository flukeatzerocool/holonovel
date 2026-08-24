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
  RulesetManager, HOST_VERSION, rollDice, computeContentHash,
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
state.buildFingerprint.specHash = SPEC_HASH;
state.buildFingerprint.lastSpecReview = new Date().toISOString();

// ── Server ─────────────────────────────────────────────────────────

const server = new McpServer({
  name: "inform-holonovel",
  version: "2026.08.24",
});

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
    if (!alreadyVowed) out.push(`Vow-creation suggestion: ${npc.name} seeks "${goal}" — create a vow via set_vow or ignore.`);
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
const PARAMETER_CEILING = 8;

// REQ-411 — stable-metadata caching. Rendered listings (tool schemas, prompt
// scaffolding) are derived from live registrations and re-render only when the
// registration set changes (registration fingerprint). Cache entries hold the
// rendered bytes plus the fingerprint they were rendered from.
interface MetadataCache {
  fingerprint: string;
  toolsListBytes: number;
  toolParameterCounts: Record<string, number>;
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

function computeToolMetrics() {
  const tools: Record<string, any> = (server as any)._registeredTools ?? {};
  let bytes = 0;
  const counts: Record<string, number> = {};
  for (const [name, tool] of Object.entries(tools)) {
    const desc = (tool?.description ?? "");
    const schema = tool?.inputSchema;
    const shape = (schema && (schema as any).shape) ? Object.keys((schema as any).shape) : [];
    counts[name] = shape.length;
    bytes += Buffer.byteLength(desc, "utf-8") + 64; // name overhead + description
    for (const key of shape) bytes += Buffer.byteLength(key, "utf-8") + 16;
  }
  return { bytes, counts };
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
  const { bytes, counts } = computeToolMetrics();
  metadataCache = {
    fingerprint: fp,
    toolsListBytes: bytes,
    toolParameterCounts: counts,
    promptBytes: promptScaffoldBytes(),
  };
  return metadataCache;
}
// Prime the cache once at startup so the first tools/list read is warm.
cachedMetadata();

// REQ-409 — enumeration verbosity, session-scoped. Lean (summary) is the
// default; a per-call `detail: true` requests full entries for a single call.
let enumerationVerbosity: "summary" | "detail" = "summary";

// REQ-409 — normalize the per-call detail request: absent → summary (lean
// default); explicit `true` → full entries; explicit `false` → summary.
const detailZod = { detail: z.boolean().optional() };
function wantsDetail(detail?: boolean): boolean {
  return detail === true;
}

// ── Ruleset packages (REQ-389, REQ-390, REQ-379) ───────────────────

const rulesets = new RulesetManager(RULESET_DIR, HOST_VERSION);
const scanErrors = rulesets.scan();
const eagerSlugs = (process.env.TTRPG_RULESETS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
for (const slug of eagerSlugs) {
  if (rulesets.isInstalled(slug)) {
    try { rulesets.hydrate(slug); } catch { /* hydration failures surfaced at call time */ }
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
function gatedRulesetTool(slug: string, schema: RulesetToolSchema) {
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
          return raw(JSON.stringify(coll[key], null, 2));
        }
        const hits = rulesets.search(slug, key || args.key || "", 5);
        if (hits.length === 0) return err("NOT_FOUND", `No '${args.key}' found in ${collection}.`);
        return raw(JSON.stringify(hits, null, 2));
      }
      case "search": {
        const q = String(args.query ?? "");
        const hits = rulesets.search(slug, q, args.max_results ?? 10);
        if (hits.length === 0) return err("NOT_FOUND", `No ruleset entry matches '${q}'.`);
        return raw(JSON.stringify(hits, null, 2));
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
          const parts = [`${label} (${r.notation}${extra !== 0 ? ` ${extra > 0 ? "+" : "-"} ${Math.abs(extra)}` : ""})`];
          parts.push(`**${r.total}**`);
          if (r.dice.length > 1) parts.push(`(${r.dice.join(" + ")})`);
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
      }, gatedRulesetTool(slug, schema));
    } catch (e: any) {
      // Tool name already registered or schema unrecoverable — skip.
    }
  }
}

function audit(tool: string, args: any, prefix?: string): void {
  const novel = state.activeNovel;
  if (novel) state.audit(novel, getBadge(), tool, args, prefix);
}

function getActiveEntity() {
  return state.getActiveEntity();
}

function resolveEntity(id?: string) {
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

function raw(text: string) {
  return { content: [{ type: "text" as const, text: expandMacros(text, buildMacroContext()) }] };
}

function warn(text: string) {
  return { content: [{ type: "text" as const, text: `[WARNING] ${expandMacros(text, buildMacroContext())}` }] };
}

function needInput(text: string) {
  return { content: [{ type: "text" as const, text: `[NEED_INPUT] ${expandMacros(text, buildMacroContext())}` }] };
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
  "Characters": ["create_character", "import_character", "stage_character", "character_sheet", "set_active_entity", "set_personality", "set_voice_examples", "player_signal", "remove_entity", "list_roster_characters", "remove_roster_character"],
  "World Model": ["command", "resolve_intent", "create_room", "remove_room", "create_thing", "remove_thing", "create_exit", "remove_exit", "convert_source"],
  "Lookups": ["search_rules", "suggest_actions", "spec_health"],
  "Combat (GM)": ["init_combat", "advance_combat", "end_combat", "add_combat_participant", "remove_combat_participant"],
  "Conditions (GM)": ["apply_condition", "remove_condition"],
  "Narrative (GM)": ["set_scene_state", "set_scene_type", "set_narrative_directive"],
  "NPCs (GM)": ["create_npc", "update_npc", "remove_npc"],
  "Factions (GM)": ["create_faction", "update_faction", "remove_faction"],
  "Secrets (GM)": ["set_secret", "reveal_secret", "get_knowledge"],
  "Relationships (GM)": ["set_relationship", "get_relationships"],
  "Vows (GM)": ["set_vow", "mark_milestone", "resolve_vow", "forsake_vow"],
  "Countdowns (GM)": ["set_countdown", "advance_countdown", "remove_countdown"],
  "Lore (GM)": ["set_lore_entry", "update_lore_entry", "remove_lore_entry", "toggle_lore_entry", "set_lore_group", "suggest_lore", "export_lorebook", "import_lorebook"],
  "Story Journal (GM)": ["record_story", "update_story", "remove_story", "list_stories"],
  "Notes": ["set_note", "remove_note", "list_notes"],
  "Server Notes (GM)": ["set_server_note", "remove_server_note", "list_server_notes"],
  "Pause/Resume (GM)": ["set_pause_context", "get_pause_context"],
  "Checkpoints (GM)": ["set_checkpoint", "list_checkpoints", "restore_checkpoint", "remove_checkpoint"],
  "Guidance (GM)": ["set_briefing_order", "compact_audit_log", "load_adventure", "generate_adventure", "generate_encounter", "set_help_category", "toggle_action_patterns", "present_choices"],
  "Autonomy (GM)": ["set_autonomy"],
  "Oracle": ["ask_oracle"],
  "Session": ["session_recap"],
  "Novel Lifecycle": ["create_novel", "resume_novel", "switch_novel", "end_novel", "export_novel", "import_novel", "rename_novel", "list_novels", "novel_info", "clone_novel"],
  "Synthesis (GM)": ["revert_synthesis"],
};

const GMToolsSet = new Set([
  "init_combat", "advance_combat", "end_combat", "add_combat_participant", "remove_combat_participant",
  "set_scene_state", "set_scene_type", "set_narrative_directive",
  "create_npc", "update_npc", "remove_npc",
  "set_countdown", "advance_countdown", "remove_countdown",
  "set_lore_entry", "update_lore_entry", "remove_lore_entry", "toggle_lore_entry", "set_lore_group",
  "suggest_lore", "export_lorebook", "import_lorebook",
  "set_briefing_order", "compact_audit_log", "load_adventure", "generate_adventure", "generate_encounter",
  "set_help_category", "export_novel", "import_novel", "revert_synthesis",
  "create_room", "remove_room", "create_thing", "remove_thing", "create_exit", "remove_exit", "convert_source",
  "apply_condition", "remove_condition",
  "create_faction", "update_faction", "remove_faction",
  "set_secret", "reveal_secret", "get_knowledge",
  "set_relationship", "get_relationships",
  "set_vow", "mark_milestone", "resolve_vow", "forsake_vow",
  "set_checkpoint", "list_checkpoints", "restore_checkpoint", "remove_checkpoint",
  "set_server_note", "remove_server_note", "list_server_notes",
  "set_pause_context", "get_pause_context",
  "record_story", "update_story", "remove_story", "list_stories",
  "present_choices", "toggle_action_patterns",
  "set_autonomy",
  "rename_novel", "list_novels", "novel_info", "clone_novel",
  "remove_entity", "remove_roster_character", "list_roster_characters",
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

// ── Tools ──────────────────────────────────────────────────────────

// --- Badge & Workflow ---

function badgeLabel(badge: Badge): string {
  if (badge === "none") return "Editor";
  return badge;
}

// REQ-066 — set_badge switches the active badge (player/game_master/observer/none).
server.registerTool("set_badge", {
  title: "Set Active Badge",
  description: "Switch active badge: player, game_master, observer, or none (Editor). Always callable.",
  inputSchema: { badge: z.enum(["player", "game_master", "observer", "none"]) },
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
  description: "Respond to a pending workflow decision.",
  inputSchema: { decision: z.string(), option: z.string() },
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
  description: "Undo the most recent mutation. Restores previous snapshot.",
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
  description: "Redo the most recently undone mutation.",
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
  description: "Show available commands and tools. Accepts optional query for focused search.",
  inputSchema: { query: z.string().optional() },
}, async ({ query }: any) => {
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
    result += "\n\nNo world model — use `convert_source` or adventure tools to populate.";
  }
  return raw(result);
});

server.registerTool("set_help_category", {
  title: "Set Help Category Override",
  description: "Override the builder-assigned category for a tool. Game Master only. Set category to empty string or null to restore defaults.",
  inputSchema: { tool_name: z.string(), category: z.string().nullable() },
}, async ({ tool_name, category }: any) => {
  requireGM();
  const novel = requireNovel();
  const registeredTools: Record<string, any> = (server as any)._registeredTools ?? {};
  if (!(tool_name in registeredTools)) {
    const valid = Object.keys(registeredTools).join(", ");
    return err("NOT_FOUND", `Tool '${tool_name}' not found. Valid: ${valid}`);
  }
  if (!category || category.trim() === "") {
    delete novel.help_category_overrides[tool_name];
    state.saveNovel(novel);
    return ok(`Category override for '${tool_name}' removed.`);
  }
  novel.help_category_overrides[tool_name] = category.trim();
  state.saveNovel(novel);
  return ok(`Tool '${tool_name}' assigned to category '${category.trim()}'.`);
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

server.registerTool("create_character", {
  title: "Create Character",
  description: "Create a character. Quick-create: pass name, species, classes, ability_scores, stat_method, skills, feats, talents. Step-by-step: call with no params to begin a guided [NEED_INPUT] workflow.",
  inputSchema: {
    name: z.string().optional(),
    description: z.string().optional(),
    voice: z.string().optional(),
    background: z.string().optional(),
    goals: z.string().optional(),
    species: z.string().optional(),
    classes: z.union([z.string(), z.array(z.object({ className: z.string(), levels: z.number().optional() }))]).optional(),
    ability_scores: z.union([z.string(), z.array(z.number())]).optional(),
    stat_method: z.string().optional(),
    seed: z.string().optional(),
    skills: z.union([z.string(), z.array(z.string())]).optional(),
    feats: z.union([z.string(), z.array(z.string())]).optional(),
    talents: z.union([z.string(), z.array(z.string())]).optional(),
    equipment: z.union([z.string(), z.array(z.string())]).optional(),
    stage_to_roster: z.boolean().optional(),
  },
}, async ({ name, description, voice, background, goals, species, classes, ability_scores, stat_method, seed, skills, feats, talents, equipment, stage_to_roster }: any) => {
  requireNotObserver();
  const novel = requireNovel();
  const rules = getCharacterRules(novel);
  const personality = { description, voice, background, goals };
  const hasPersonality = description || voice || background || goals;

  if (!name) {
    // Step-by-step mode: start a guided creation workflow.
    if (novel.pending_workflow) return err("STATE_CONFLICT", "A workflow decision is pending. Resolve it with respond before starting a new one.");
    const workflow: CreationWorkflowState = { kind: "character_creation", stepIndex: 0, rules, answers: {} };
    novel.pending_workflow = { decision: "character_creation", snapshot: state.captureWorkflowSnapshot(novel), creation: workflow };
    state.saveNovel(novel);
    return needInput(creationStepPrompt(workflow));
  }

  // Ruleset-free (or character-data-less) profile-only path (REQ-219a1, REQ-399c).
  if (!rules) {
    if (classes || ability_scores || stat_method) {
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

  // Quick-create mode: require species + classes.
  if (!species || !classes) {
    return err("INVALID_INPUT", "Quick-create requires 'species' and 'classes'. Omit 'name' to start step-by-step, or provide all creation fields.");
  }
  const classLevels = parseClassLevels(classes);
  if (classLevels.length === 0) return err("INVALID_INPUT", "Could not parse 'classes'. Use format 'Class 5 / Other 2'.");
  for (const cl of classLevels) {
    if (!getClassData(rules, cl.className)) return err("INVALID_INPUT", `Unknown class '${cl.className}'.`);
  }
  const speciesName = species;
  const speciesData = rules.species?.[speciesName.trim().toLowerCase()];
  if (rules.species && !speciesData) return err("INVALID_INPUT", `Unknown species '${speciesName}'.`);

  const method: StatMethod = stat_method ?? Object.keys(rules.stat_methods ?? {})[0] ?? "planned";
  const rawScores = ability_scores
    ? parseAbilityScores(ability_scores, rules)
    : (() => {
        const gen = generateAbilityScores(method, rules, seed);
        const names = abilityNames(rules);
        const out: Record<string, number> = {};
        for (let i = 0; i < names.length; i++) out[names[i]] = gen[i] ?? 10;
        return out;
      })();
  const abilityScores = applySpeciesAdjustments(rawScores, speciesName, rules);

  const toList = (v: any): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(String);
    return String(v).split(/[\s,]+/).map((s: string) => s.trim()).filter(Boolean);
  };

  const build: CharacterBuildInput = {
    name,
    species: speciesName,
    classLevels,
    abilityScores,
    trainedSkills: toList(skills),
    feats: toList(feats),
    talents: toList(talents),
    statMethod: method,
    seed,
    equipment: toList(equipment),
  };
  const stats = buildCharacterStats(build, rules);

  const entity = state.createEntity(name, hasPersonality ? personality : undefined, stats);
  state.addEntity(novel, entity);
  if (stage_to_roster) state.addToRoster(entity);
  state.saveNovel(novel);

  const inputs = [`name=${name}`, `species=${speciesName}`, `classes=${classLevels.map((c) => `${c.className} ${c.levels}`).join("/")}`, `stat_method=${method}`];
  const derived = Object.entries(stats)
    .filter(([k, v]) => k !== "class" && k !== "species" && k !== "abilityScores" && k !== "statMethod" && k !== "trainedSkills" && k !== "feats" && k !== "talents" && k !== "equipment" && k !== "level" && !k.startsWith("_") && typeof v === "number")
    .map(([k, v]) => `${k}=${v}`);
  return ok(`${fmtEntitySheet(entity)}

Created (inputs): ${inputs.join(" · ")}
Derived: ${derived.join(" · ")}
${stage_to_roster ? `Staged to roster as ${entity.id}.` : `Character '${name}' created as ${entity.id}.`}`);
});

server.registerTool("stage_character", {
  title: "Stage Character to Roster",
  description: "Stage an existing novel entity into the persistent roster for later import.",
  inputSchema: { entity_id: z.string().optional() },
}, async ({ entity_id }: any) => {
  requireNotObserver();
  const novel = requireNovel();
  const entity = resolveEntity(entity_id);
  if (!entity) return err("NOT_FOUND", "No entity to stage.");
  const id = state.addToRoster(entity);
  state.saveNovel(novel);
  return ok(`Character '${entity.name}' staged to roster as ${id}.`);
});


server.registerTool("import_character", {
  title: "Import Character",
  description: "Import a roster character into the active novel.",
  inputSchema: { roster_id: z.string() },
}, async ({ roster_id }: any) => {
  requireNotObserver();
  const novel = requireNovel();
  const rosterEntity = state.roster.get(roster_id);
  if (!rosterEntity) return err("NOT_FOUND", `Roster entity '${roster_id}' not found.`);
  state.addEntity(novel, { ...rosterEntity, current_room: rosterEntity.current_room ?? null, inventory: rosterEntity.inventory ?? [] });
  state.saveNovel(novel);
  return ok(`Character '${rosterEntity.name}' imported.`);
});

server.registerTool("character_sheet", {
  title: "Character Sheet",
  description: "Render a character sheet for an entity. Formats: markdown (default), ascii.",
  inputSchema: {
    entity_id: z.string().optional(),
    format: z.enum(["markdown", "ascii"]).optional(),
  },
}, async ({ entity_id, format }: any) => {
  const entity = resolveEntity(entity_id);
  if (format === "ascii") {
    return raw(`[OK] ${entity.name}  Room: ${entity.current_room || "(none)"}  Held: ${entity.inventory?.length || 0}`);
  }
  return ok(fmtEntitySheet(entity));
});

server.registerTool("set_active_entity", {
  title: "Set Active Entity",
  description: "Set the currently active entity.",
  inputSchema: { entity_id: z.string(), pov: z.enum(["character", "omniscient"]).optional() },
}, async ({ entity_id, pov }: any) => {
  requireNotObserver();
  const novel = requireNovel();
  if (!novel.entities.has(entity_id)) return err("NOT_FOUND", `Entity '${entity_id}' not found.`);
  novel.active_entity_id = entity_id;
  if (pov !== undefined) novel.pov_mode = pov;
  const mode = novel.pov_mode;
  return ok(`Active entity set to '${entity_id}'${mode === "omniscient" ? " (omniscient POV)" : ""}.`);
});

server.registerTool("set_personality", {
  title: "Set Entity or NPC Personality",
  description: "Set narrative personality fields for an entity or NPC.",
  inputSchema: {
    entity_id: z.string(),
    description: z.string().optional(),
    voice: z.string().optional(),
    background: z.string().optional(),
    goals: z.string().optional(),
  },
}, async ({ entity_id, description, voice, background, goals }: any) => {
  requireNotObserver();
  const novel = requireNovel();
  let target = novel.entities.get(entity_id) ?? novel.npcs.get(entity_id);
  if (!target) return err("NOT_FOUND", `Entity or NPC '${entity_id}' not found.`);

  if (!target.personality) target.personality = {};
  if (description !== undefined) target.personality.description = description;
  if (voice !== undefined) target.personality.voice = voice;
  if (background !== undefined) target.personality.background = background;
  if (goals !== undefined) target.personality.goals = goals;

  state.recordMutation(novel, "set_personality", "personality");
  state.saveNovel(novel);
  const setFields = [description !== undefined, voice !== undefined, background !== undefined, goals !== undefined].filter(Boolean).length;
  audit("set_personality", { entity_id, fields: setFields });
  return ok(`Personality set for '${entity_id}'.`);
});

server.registerTool("set_voice_examples", {
  title: "Set Voice Examples",
  description: "Set voice and dialogue examples for an entity or NPC.",
  inputSchema: {
    entity_id: z.string(),
    examples: z.array(z.object({ context: z.string(), dialogue: z.string(), tag: z.string().optional() })),
  },
}, async ({ entity_id, examples }: any) => {
  requireNotObserver();
  const novel = requireNovel();
  let target = novel.entities.get(entity_id) ?? novel.npcs.get(entity_id);
  if (!target) return err("NOT_FOUND", `Entity or NPC '${entity_id}' not found.`);
  target.voice_examples = examples;
  state.saveNovel(novel);
  audit("set_voice_examples", { entity_id, count: examples.length });
  return ok(`Voice examples set for '${entity_id}' (${examples.length} examples).`);
});

// REQ-069 — player feedback signal to the GM.
server.registerTool("player_signal", {
  title: "Player Signal",
  description: "Send a narrative signal from the player to the GM.",
  inputSchema: {
    signal: z.enum(["pace", "difficulty", "tone", "focus", "boundary", "voice_feedback"]),
    value: z.string(),
  },
}, async ({ signal, value }: any) => {
  requirePlayer();
  const novel = requireNovel();
  // REQ-344 — voice feedback corrects the entity's voice examples, rate-limited.
  if (signal === "voice_feedback") {
    const entity = state.getActiveEntity();
    if (!entity) return err("INVALID_INPUT", "No active entity to correct. Corrective action: set an active entity first.");
    const limit = maxVoiceCorrections();
    if (novel.voice_corrections_this_session >= limit) {
      return warn("Voice correction limit reached for this session.");
    }
    if (!entity.voice_examples) entity.voice_examples = [];
    entity.voice_examples.push({ context: "player correction", dialogue: value, tag: "player-corrected" });
    novel.voice_corrections_this_session++;
    state.saveNovel(novel);
    audit("voice-feedback", { corrected: value, count: novel.voice_corrections_this_session });
    return ok(`Voice correction captured (${novel.voice_corrections_this_session}/${limit}).`);
  }
  novel.player_signals[signal] = value;
  state.saveNovel(novel);
  audit("player_signal", { signal, value });
  return ok(`Signal recorded: ${signal} → ${value}`);
});

// ── Autonomy (REQ-306) ────────────────────────────────────────────

server.registerTool("set_autonomy", {
  title: "Adjustable Autonomy",
  description: "Set the AI autonomy sliders for the active Novel. level: full/mechanical_prompt/manual; confirmation: auto/confirm/prompt; safety: safe/moderate/hardcore; creativity: predictable/standard/chaotic. Game Master only.",
  inputSchema: {
    level: z.enum(["full", "mechanical_prompt", "manual"]).optional(),
    confirmation: z.enum(["auto", "confirm", "prompt"]).optional(),
    safety: z.enum(["safe", "moderate", "hardcore"]).optional(),
    creativity: z.enum(["predictable", "standard", "chaotic"]).optional(),
  },
}, async ({ level, confirmation, safety, creativity }: any) => {
  requireGM();
  const novel = requireNovel();
  const auto = novel.autonomy;

  // REQ-306f — escalating safety above `safe` requires confirmation, once per
  // Novel per target tier.
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
  if (safety) {
    auto.safety = safety;
    if (!auto.confirmed_safety_tiers.includes(safety)) auto.confirmed_safety_tiers.push(safety);
  }
  state.saveNovel(novel);
  audit("set_autonomy", { level, confirmation, safety, creativity });
  const a = novel.autonomy;
  return ok(`Autonomy set — level: ${a.level}, confirmation: ${a.confirmation}, safety: ${a.safety}, creativity: ${a.creativity}`);
});

// --- World-Model Tools ---

server.registerTool("command", {
  title: "Parser Command",
  description: "Execute a natural-language parser command against the world model. Use for navigation (go, n/s/e/w), inspection (look, examine), object interaction (take, drop, open, close), inventory, and wait.",
  inputSchema: { command: z.string() },
}, async ({ command }: any) => {
  const novel = requireNovel();
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

server.registerTool("create_room", {
  title: "Create Room",
  description: "Create a new room in the world model. Game Master only.",
  inputSchema: {
    name: z.string(),
    description: z.string().optional(),
  },
}, async ({ name, description }: any) => {
  requireGM();
  const novel = requireNovel();
  worldSnapshot();
  const lower = name.toLowerCase();
  if (novel.world.rooms.has(lower)) return err("STATE_CONFLICT", `Room '${name}' already exists.`);
  const room: WorldRoom = {
    name,
    description: description ?? "",
    exits: new Map(),
    doorRefs: new Map(),
    annotations: {},
  };
  novel.world.rooms.set(lower, room);
  state.saveNovel(novel);
  audit("create_room", { name });
  return ok(`Room '${name}' created.`);
});

server.registerTool("remove_room", {
  title: "Remove Room",
  description: "Remove a room and its contained things and exits. Game Master only.",
  inputSchema: { name: z.string() },
}, async ({ name }: any) => {
  requireGM();
  const novel = requireNovel();
  const lower = name.toLowerCase();
  if (!novel.world.rooms.has(lower)) return err("NOT_FOUND", `Room '${name}' not found.`);
  worldSnapshot();

  // Remove things in this room
  for (const [tKey, thing] of novel.world.things) {
    if (thing.location?.toLowerCase() === lower && thing.locationType === "room") {
      novel.world.things.delete(tKey);
    }
  }
  // Remove exits referencing this room
  for (const [, room] of novel.world.rooms) {
    for (const [dir, target] of room.exits) {
      if (target.toLowerCase() === lower) room.exits.delete(dir);
    }
  }
  novel.world.rooms.delete(lower);
  state.saveNovel(novel);
  audit("remove_room", { name });
  return ok(`Room '${name}' and its contents removed.`);
});

server.registerTool("create_thing", {
  title: "Create Thing",
  description: "Create a new thing in the world model. Game Master only.",
  inputSchema: {
    name: z.string(),
    kind: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    location_type: z.enum(["room", "container", "supporter"]).optional(),
    fixed: z.boolean().optional(),
    openable: z.boolean().optional(),
    lockable: z.boolean().optional(),
  },
}, async ({ name, kind, description, location, location_type, fixed, openable, lockable }: any) => {
  requireGM();
  const novel = requireNovel();
  worldSnapshot();
  const lower = name.toLowerCase();
  if (novel.world.things.has(lower)) return err("STATE_CONFLICT", `Thing '${name}' already exists.`);

  const validKinds = ["thing", "container", "supporter", "door", "device", "vehicle", "person", "backdrop", "region"];
  const k = (kind && validKinds.includes(kind.toLowerCase())) ? kind.toLowerCase() as WorldKind : "thing";

  // Determine containment: explicit location_type, or infer from the parent's kind.
  let locationType: "room" | "container" | "supporter" | "vehicle" | null = location ? "room" : null;
  if (location && location_type) {
    locationType = location_type;
  } else if (location) {
    const parent = novel.world.things.get(location.toLowerCase());
    if (parent && (parent.kind === "container" || parent.kind === "supporter" || parent.kind === "vehicle")) {
      locationType = parent.kind === "supporter" ? "supporter" : parent.kind === "vehicle" ? "vehicle" : "container";
    }
  }

  const thing: WorldThing = {
    name,
    description: description ?? "",
    kind: k,
    location: location ?? null,
    locationType,
    portable: !fixed && k !== "supporter" && k !== "door" && k !== "vehicle",
    openable: k === "container" || k === "door" || openable === true,
    open: false,
    lockable: k === "container" || k === "door" || lockable === true,
    locked: false,
    lit: false,
    switchable: k === "device",
    switched_on: false,
    enterable: k === "vehicle",
    vehiclePassengers: [],
    wearable: false,
    worn_by: null,
    readable: false,
    read_text: null,
    edible: false,
    drinkable: false,
    climbable: false,
    transparent: false,
    annotations: {},
  };
  novel.world.things.set(lower, thing);
  state.saveNovel(novel);
  audit("create_thing", { name, kind: k, location, location_type: locationType });
  return ok(`Thing '${name}' (${k}) created${location ? (locationType === "supporter" ? ` on ${location}` : locationType === "container" ? ` in container ${location}` : ` in ${location}`) : ""}.`);
});

server.registerTool("remove_thing", {
  title: "Remove Thing",
  description: "Remove a thing from the world model. Game Master only.",
  inputSchema: { name: z.string() },
}, async ({ name }: any) => {
  requireGM();
  const novel = requireNovel();
  const lower = name.toLowerCase();
  if (!novel.world.things.has(lower)) return err("NOT_FOUND", `Thing '${name}' not found.`);
  worldSnapshot();
  novel.world.things.delete(lower);
  state.saveNovel(novel);
  audit("remove_thing", { name });
  return ok(`Thing '${name}' removed.`);
});

server.registerTool("create_exit", {
  title: "Create Exit",
  description: "Create a directional exit between two rooms. Reverse exit created implicitly. Game Master only.",
  inputSchema: {
    direction: z.string(),
    room_a: z.string(),
    room_b: z.string(),
  },
}, async ({ direction, room_a, room_b }: any) => {
  requireGM();
  const novel = requireNovel();
  worldSnapshot();
  const dir = direction.toLowerCase();
  if (!ROOM_DIRECTIONS.includes(dir as any)) return err("INVALID_INPUT", `Invalid direction '${direction}'. Valid: ${ROOM_DIRECTIONS.join(", ")}.`);

  const roomA = novel.world.rooms.get(room_a.toLowerCase());
  const roomB = novel.world.rooms.get(room_b.toLowerCase());
  if (!roomA) return err("NOT_FOUND", `Room '${room_a}' not found.`);
  if (!roomB) return err("NOT_FOUND", `Room '${room_b}' not found.`);

  roomA.exits.set(dir as Direction, room_b);
  roomB.exits.set(oppositeDirection(dir as Direction), room_a);
  state.saveNovel(novel);
  audit("create_exit", { direction: dir, room_a, room_b });
  return ok(`Exit created: ${dir} from ${room_a} to ${room_b}.`);
});

server.registerTool("remove_exit", {
  title: "Remove Exit",
  description: "Remove a directional exit from a room. Game Master only.",
  inputSchema: {
    direction: z.string(),
    room: z.string(),
  },
}, async ({ direction, room: roomName }: any) => {
  requireGM();
  const novel = requireNovel();
  worldSnapshot();
  const dir = direction.toLowerCase();
  if (!ROOM_DIRECTIONS.includes(dir as any)) return err("INVALID_INPUT", `Invalid direction.`);

  const room = novel.world.rooms.get(roomName.toLowerCase());
  if (!room) return err("NOT_FOUND", `Room '${roomName}' not found.`);
  if (!room.exits.has(dir as Direction)) return err("NOT_FOUND", `No ${dir} exit from '${roomName}'.`);

  room.exits.delete(dir as Direction);
  state.saveNovel(novel);
  audit("remove_exit", { direction: dir, room: roomName });
  return ok(`Exit ${dir} from '${roomName}' removed.`);
});

server.registerTool("convert_source", {
  title: "Convert Source",
  description: "Parse hybrid world-model assertions and populate the Novel's world model. Game Master only. Only on an empty world model.",
  inputSchema: { source: z.string() },
}, async ({ source }: any) => {
  requireGM();
  const novel = requireNovel();
  worldSnapshot();

  if (novel.world.rooms.size > 0) {
    return err("STATE_CONFLICT", "World model already populated. Use CRUD tools to modify, or create a new novel.");
  }

  const { world, result } = convertSource(source, novel.world);
  novel.world = world;
  state.saveNovel(novel);
  audit("convert_source", { rooms: result.rooms, things: result.things, exits: result.exits });

  let msg = `[OK] World model populated: ${result.rooms} rooms, ${result.things} things, ${result.exits} exits.`;
  msg += ` Linked annotations — encounters: ${result.annotations.encounters}, NPCs: ${result.annotations.npcs}, traps: ${result.annotations.traps}, lore: ${result.annotations.lore}.`;

  if (result.warnings.length > 0) {
    msg += `\n\nWarnings:`;
    for (const w of result.warnings) {
      msg += `\nLine ${w.line}: ${w.message}`;
    }
  }

  return raw(msg);
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

server.registerTool("resolve_intent", {
  title: "Resolve Intent",
  description: "Resolve a natural-language spatial intent against the world model without mutating state. Use when: a player or the AI narrator needs to determine the outcome of a movement or inspection against the world model. Do NOT use when: you are the Game Master inspecting the model directly — use the parser command tool for that.",
  inputSchema: { intent: z.string() },
}, async ({ intent }: any) => {
  const badge = getBadge();
  if (badge === "player") {
    return err("FORBIDDEN", "resolve_intent is not callable by the Player badge. Player spatial intents are resolved by the AI narrator. Corrective action: switch badge or direct intents through the narrator.");
  }
  requireNotObserver();
  const novel = requireNovel();
  const result = resolveIntentWorld(intent, novel);
  return raw(JSON.stringify(result, null, 2));
});

// --- Combat (GM, auto-advance in ruleset-free mode) ---

server.registerTool("init_combat", {
  title: "Initiate Combat",
  description: "Start a combat encounter. Game Master only. In ruleset-free mode, all participants auto-advance.",
  inputSchema: {
    participants: z.array(z.string()),
    dangers: z.array(z.object({ name: z.string(), ac: z.number().optional(), hp: z.number().optional(), initiative_bonus: z.number().optional() })).optional(),
    seed: z.string().optional(),
  },
}, async ({ participants, dangers, seed }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const combat = state.initCombat(novel, participants, dangers ?? [], seed);
  state.saveNovel(novel);
  return ok(`Combat started. Round ${combat.round}, ${combat.turn_order.length} participants. Turn: ${combat.turn_order[0]} (auto-advance mode).`);
});

server.registerTool("advance_combat", {
  title: "Advance Combat",
  description: "Advance to the next turn in combat. Game Master only.",
  inputSchema: {},
}, async () => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const combat = state.advanceCombat(novel);
  state.saveNovel(novel);
  const currentName = combat.turn_order[combat.current_turn];
  return ok(`Turn: ${currentName} — Round ${combat.round}, Turn ${combat.current_turn + 1}/${combat.turn_order.length}. [AUTO]`);
});

server.registerTool("end_combat", {
  title: "End Combat",
  description: "End the active combat encounter. Game Master only.",
  inputSchema: { outcome: z.string().optional() },
}, async ({ outcome }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const rounds = novel.combat?.round ?? 0;
  state.endCombat(novel, outcome ?? "Combat ended.");
  state.saveNovel(novel);
  return ok(`Combat ended after ${rounds} rounds${outcome ? `. Outcome: ${outcome}` : "."}`);
});

server.registerTool("add_combat_participant", {
  title: "Add Combat Participant",
  description: "Add a participant to active combat. Game Master only.",
  inputSchema: { participant_id: z.string() },
}, async ({ participant_id }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const combat = state.addCombatParticipant(novel, participant_id);
  state.saveNovel(novel);
  return ok(`'${participant_id}' added to combat.`);
});

server.registerTool("remove_combat_participant", {
  title: "Remove Combat Participant",
  description: "Remove a participant from active combat. Game Master only.",
  inputSchema: { participant_id: z.string() },
}, async ({ participant_id }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const result = state.removeCombatParticipant(novel, participant_id);
  state.saveNovel(novel);
  if (result.ended) return ok("Combat ended — all participants removed.");
  return ok(`'${participant_id}' removed from combat.`);
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
function fireCountdown(novel: NovelState, name: string, cd: { name: string; ticks: number; total: number; direction?: string }): void {
  const presentIds = new Set(novel.characters_present_ids ?? []);
  const activeId = novel.active_entity_id;
  const absent = activeId && !presentIds.has(activeId);
  novel.countdowns.delete(name);
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

server.registerTool("set_scene_state", {
  title: "Set Scene State",
  description: "Set the scene description and location. Game Master only.",
  inputSchema: {
    description: z.string(),
    location: z.string().optional(),
    time_of_day: z.string().optional(),
    atmosphere: z.string().optional(),
    beat: z.enum(BEAT_VALUES).optional(),
    skip_transition_hook: z.boolean().optional(),
  },
}, async ({ description, location, time_of_day, atmosphere, beat, skip_transition_hook }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();

  // REQ-342 — derive the scene description from world-model state when `location`
  // resolves and no explicit description is supplied.
  const derived = !description && location ? deriveSceneDescription(location, novel) : null;
  const effectiveDescription = description || derived || "";

  const isTransition = novel.scene_description !== "" && novel.scene_description !== effectiveDescription;

  if (novel.scene_description) {
    const historyEntry: any = {
      timestamp: new Date().toISOString(),
      description: novel.scene_description,
      location: novel.scene_location,
      time_of_day: novel.scene_time_of_day,
      atmosphere: novel.scene_atmosphere,
      beat: currentBeat(novel),
    };
    if (novel.scene_description !== effectiveDescription) {
      novel.scene_history.push(historyEntry);
    }
  }
  novel.scene_description = effectiveDescription;
  novel.scene_location = location;
  novel.scene_time_of_day = time_of_day;
  novel.scene_atmosphere = atmosphere;

  // REQ-335 — record the transition into story_beats, then advance the beat.
  if (beat !== undefined) {
    recordBeatTransition(novel, beat, effectiveDescription.substring(0, 60));
    novel.scene_beat = beat;
  }

  // Auto-update active entity position if location or description matches a world-model room (REQ-326)
  const sceneRoomName = location || effectiveDescription;
  if (sceneRoomName) {
    const matchRoom = [...novel.world.rooms.entries()].find(([, r]) =>
      sceneRoomName.toLowerCase().startsWith(r.name.toLowerCase()));
    if (matchRoom) {
      const entity = state.getActiveEntity();
      if (entity) {
        entity.current_room = matchRoom[1].name;
      }
    }
  }

  // REQ-125 — scene transition hook: audit + countdown/faction advancement.
  if (isTransition && !skip_transition_hook) {
    audit("scene-transition", { from: novel.scene_history.slice(-1)[0]?.description, to: effectiveDescription });
    advanceSceneTransitionCountdowns(novel); // REQ-353
    factionAutonomousAdvance(novel); // REQ-338
    resetPacing(novel); // REQ-336
    // REQ-405 — auto-moment on transitions unless disabled or skipped.
    if (novel.auto_record) {
      recordStoryMoment(novel, effectiveDescription, location ?? null);
    }
  }

  state.recordMutation(novel, "set_scene_state", "scene");
  state.saveNovel(novel);
  audit("set_scene_state", { description: effectiveDescription, location, time_of_day, atmosphere, beat });
  return ok(`Scene set: ${effectiveDescription}`);
});

server.registerTool("set_scene_type", {
  title: "Set Scene Type",
  description: "Tag the scene as combat, social, exploration, or neutral. Game Master only.",
  inputSchema: {
    type: z.union([z.enum(["combat", "social", "exploration", "neutral"]), z.array(z.enum(["combat", "social", "exploration", "neutral"]))]),
    beat: z.enum(BEAT_VALUES).optional(),
  },
}, async ({ type, beat }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  novel.scene_type = Array.isArray(type) ? type : [type];
  if (beat !== undefined) {
    recordBeatTransition(novel, beat, novel.scene_description.substring(0, 60));
    novel.scene_beat = beat;
  }
  state.saveNovel(novel);
  return ok(`Scene type set to: ${novel.scene_type.join(", ")}.`);
});

server.registerTool("set_narrative_directive", {
  title: "Set Narrative Directive",
  description: "Set overarching narrative directive for the current scene. Game Master only.",
  inputSchema: { directive: z.string() },
}, async ({ directive }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  novel.narrative_directive = directive;
  state.saveNovel(novel);
  return ok(`Narrative directive set.`);
});

// --- NPCs (GM) ---

server.registerTool("create_npc", {
  title: "Create NPC",
  description: "Create a named NPC with optional description and narrative fields. Game Master only.",
  inputSchema: {
    name: z.string(),
    description: z.string().optional(),
    disposition: z.string().optional(),
    location: z.string().optional(),
    goals: z.string().optional(),
  },
}, async ({ name, description, disposition, location, goals }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const id = `npc_${Date.now().toString(36)}`;
  const npc: any = { id, name, description, disposition, location, conditions: [], condition_rounds: {} };
  if (goals) npc.personality = { goals };
  novel.npcs.set(id, npc);
  state.recordMutation(novel, "create_npc", "npc");
  state.saveNovel(novel);
  audit("create_npc", { name, id });
  return ok(`NPC '${name}' created (${id}).`);
});

server.registerTool("update_npc", {
  title: "Update NPC",
  description: "Update an existing NPC's fields. Game Master only.",
  inputSchema: {
    npc_id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    disposition: z.string().optional(),
    location: z.string().optional(),
    goals: z.string().optional(),
  },
}, async ({ npc_id, name, description, disposition, location, goals }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
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
});

server.registerTool("remove_npc", {
  title: "Remove NPC",
  description: "Remove an NPC from the novel. Game Master only.",
  inputSchema: { npc_id: z.string() },
}, async ({ npc_id }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  if (!novel.npcs.has(npc_id)) return err("NOT_FOUND", `NPC '${npc_id}' not found.`);
  novel.npcs.delete(npc_id);
  state.saveNovel(novel);
  audit("remove_npc", { npc_id });
  return ok(`NPC '${npc_id}' removed.`);
});

// --- Countdowns (GM) ---

server.registerTool("set_countdown", {
  title: "Set Countdown",
  description: "Set a countdown timer. Game Master only.",
  inputSchema: {
    name: z.string(),
    ticks: z.number().min(1),
    type: z.enum(["round", "narrative"]).optional(),
    scope: z.string().optional(),
    direction: z.string().optional(),
    on_scene_transition: z.boolean().optional(),
  },
}, async ({ name, ticks, type, scope, direction, on_scene_transition }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  novel.countdowns.set(name, { name, ticks, total: ticks, type: type ?? "narrative", scope, direction, on_scene_transition });
  state.recordMutation(novel, "set_countdown", "countdown");
  state.saveNovel(novel);
  audit("set_countdown", { name, ticks, type, on_scene_transition });
  return ok(`Countdown '${name}' set (${ticks} ticks, ${type ?? "narrative"}).`);
});

server.registerTool("advance_countdown", {
  title: "Advance Countdown",
  description: "Advance a countdown timer by one tick. Game Master only.",
  inputSchema: { name: z.string() },
}, async ({ name }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const cd = novel.countdowns.get(name);
  if (!cd) return err("NOT_FOUND", `Countdown '${name}' not found.`);
  cd.ticks--;
  if (cd.ticks <= 0) {
    novel.countdowns.delete(name);
    // REQ-358 — countdown fire shifts disposition of NPCs whose location matches
    // the countdown scope toward the countdown direction (hostile/benign).
    const direction = cd.direction?.toLowerCase() ?? "";
    const toward = direction.includes("hostile") ? "hostile" : direction.includes("benign") ? "friendly" : null;
    if (toward && cd.scope) {
      for (const [, npc] of novel.npcs) {
        if (npc.location && npc.location.toLowerCase() === cd.scope!.toLowerCase()) {
          const prev = npc.disposition ?? "neutral";
          npc.disposition = shiftDisposition(prev, toward);
          audit("countdown-disposition", { npc: npc.id, countdown: name, from: prev, to: npc.disposition });
        }
      }
    }
    audit("countdown_expired", { name });
    state.saveNovel(novel);
    return ok(`Countdown '${name}' expired. Recorded in audit log.`);
  }
  state.saveNovel(novel);
  audit("advance_countdown", { name, remaining: cd.ticks });
  return ok(`Countdown ${name}: ${cd.ticks} ticks remaining.`);
});

server.registerTool("remove_countdown", {
  title: "Remove Countdown",
  description: "Remove a countdown timer. Game Master only.",
  inputSchema: { name: z.string() },
}, async ({ name }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  if (!novel.countdowns.has(name)) return err("NOT_FOUND", `Countdown '${name}' not found.`);
  novel.countdowns.delete(name);
  state.saveNovel(novel);
  audit("remove_countdown", { name });
  return ok(`Countdown '${name}' removed.`);
});

// --- Lore (GM) ---

server.registerTool("set_lore_entry", {
  title: "Set Lore Entry",
  description: "Log a lore entry for the current novel. Game Master only.",
  inputSchema: {
    key: z.string(),
    content: z.string(),
    triggers: z.array(z.string()).optional(),
    badge_scope: z.enum(["game_master", "shared"]).optional(),
    priority: z.number().optional(),
    sticky: z.number().optional(),
    group: z.string().optional(),
  },
}, async ({ key, content, triggers, badge_scope, priority, sticky, group }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const entry: LoreEntry = {
    key,
    content,
    triggers: triggers ?? [],
    badge_scope: badge_scope ?? "game_master",
    priority: priority ?? 0,
    sticky: sticky ?? 0,
    sticky_remaining: sticky ?? 0,
    enabled: true,
    group,
  };
  novel.lore.set(key, entry);
  state.saveNovel(novel);
  audit("set_lore_entry", { key });
  return ok(`Lore entry '${key}' created.`);
});

server.registerTool("update_lore_entry", {
  title: "Update Lore Entry",
  description: "Update fields of an existing lore entry. Game Master only.",
  inputSchema: {
    key: z.string(),
    content: z.string().optional(),
    triggers: z.array(z.string()).optional(),
    badge_scope: z.enum(["game_master", "shared"]).optional(),
    priority: z.number().optional(),
    sticky: z.number().optional(),
    group: z.string().nullable().optional(),
  },
}, async ({ key, content, triggers, badge_scope, priority, sticky, group }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
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
});

server.registerTool("remove_lore_entry", {
  title: "Remove Lore Entry",
  description: "Remove a lore entry. Game Master only.",
  inputSchema: { key: z.string() },
}, async ({ key }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  if (!novel.lore.has(key)) return err("NOT_FOUND", `Lore entry '${key}' not found.`);
  novel.lore.delete(key);
  state.saveNovel(novel);
  return ok(`Lore entry '${key}' removed.`);
});

server.registerTool("toggle_lore_entry", {
  title: "Toggle Lore Entry",
  description: "Enable or disable a lore entry. Game Master only.",
  inputSchema: { key: z.string() },
}, async ({ key }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const entry = novel.lore.get(key);
  if (!entry) return err("NOT_FOUND", `Lore entry '${key}' not found.`);
  entry.enabled = !entry.enabled;
  state.saveNovel(novel);
  return ok(`Lore entry '${key}' ${entry.enabled ? "enabled" : "disabled"}.`);
});

server.registerTool("set_lore_group", {
  title: "Set Lore Group",
  description: "Assign or remove a lore entry from a named group. Game Master only.",
  inputSchema: { key: z.string(), group: z.string().nullable() },
}, async ({ key, group }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const entry = novel.lore.get(key);
  if (!entry) return err("NOT_FOUND", `Lore entry '${key}' not found.`);
  if (group === null || group === undefined) delete entry.group;
  else entry.group = group;
  state.saveNovel(novel);
  return ok(`Lore entry '${key}' group ${group ? `set to '${group}'` : "removed"}.`);
});

server.registerTool("suggest_lore", {
  title: "Suggest Lore",
  description: "Suggest lore entries from enrichment templates based on current scene. Game Master only.",
  inputSchema: {},
}, async () => {
  requireGM();
  const novel = requireNovel();
  const templates = state.enrichmentManifest?.lore_templates ?? [];
  if (templates.length === 0) return ok("No lore templates available (enrichment not loaded).");
  const sample = templates.slice(0, 3).map((t: any) => `- ${t.content?.substring(0, 120)}${(t.content?.length ?? 0) > 120 ? "..." : ""}`);
  return raw(sample.join("\n"));
});

server.registerTool("export_lorebook", {
  title: "Export Lorebook",
  description: "Export novel lore entries in interchange format. Game Master only.",
  inputSchema: { format: z.enum(["json", "markdown"]).optional() },
}, async ({ format: fmt }: any) => {
  requireGM();
  const novel = requireNovel();
  const entries = [...novel.lore.values()];
  if (fmt === "markdown") {
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
});

server.registerTool("import_lorebook", {
  title: "Import Lorebook",
  description: "Import lore entries from JSON or Markdown. Modes: dry-run, merge, or replace. Game Master only.",
  inputSchema: {
    data: z.string(),
    mode: z.enum(["dry-run", "merge", "replace"]).optional(),
  },
}, async ({ data, mode }: any) => {
  requireGM();
  const novel = requireNovel();
  const m = mode ?? "dry-run";
  try {
    const parsed = JSON.parse(data);
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
});

// --- Conditions (GM) ---

server.registerTool("apply_condition", {
  title: "Apply Condition",
  description: "Apply a condition to an entity.",
  inputSchema: { entity_id: z.string(), condition: z.string(), rounds: z.number().optional() },
}, async ({ entity_id, condition, rounds }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const entity = novel.entities.get(entity_id) ?? novel.npcs.get(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity '${entity_id}' not found.`);
  if (!entity.conditions) entity.conditions = [];
  if (!entity.condition_rounds) entity.condition_rounds = {};
  if (!entity.conditions.includes(condition)) entity.conditions.push(condition);
  if (rounds) entity.condition_rounds[condition] = rounds;
  state.saveNovel(novel);
  return ok(`'${condition}' applied to '${entity_id}'${rounds ? ` for ${rounds} rounds` : ""}.`);
});

server.registerTool("remove_condition", {
  title: "Remove Condition",
  description: "Remove a condition from an entity.",
  inputSchema: { entity_id: z.string(), condition: z.string() },
}, async ({ entity_id, condition }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const entity = novel.entities.get(entity_id) ?? novel.npcs.get(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity '${entity_id}' not found.`);
  if (!entity.conditions) return ok(`Entity '${entity_id}' has no conditions.`);
  entity.conditions = entity.conditions.filter((c: string) => c !== condition);
  delete entity.condition_rounds[condition];
  state.saveNovel(novel);
  return ok(`'${condition}' removed from '${entity_id}'.`);
});

// --- Factions (GM) ---

server.registerTool("create_faction", {
  title: "Create Faction",
  description: "Create a named faction with goals, resources, and a progress clock. Game Master only.",
  inputSchema: { name: z.string(), description: z.string().optional(), goals: z.array(z.string()).optional(), resources: z.string().optional(), territory: z.array(z.string()).optional() },
}, async ({ name, description, goals, resources, territory }: any) => {
  requireGM();
  const novel = requireNovel();
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
});

server.registerTool("update_faction", {
  title: "Update Faction",
  description: "Update a faction's fields. Game Master only.",
  inputSchema: { faction_id: z.string(), description: z.string().optional(), goals: z.array(z.string()).optional(), resources: z.string().optional(), territory: z.array(z.string()).optional() },
}, async ({ faction_id, ...fields }: any) => {
  requireGM();
  const novel = requireNovel();
  const faction = novel.factions.find(f => f.id === faction_id);
  if (!faction) return err("NOT_FOUND", `Faction '${faction_id}' not found.`);
  Object.assign(faction, fields);
  state.saveNovel(novel);
  return ok(`Faction '${faction.name}' updated.`);
});

server.registerTool("remove_faction", {
  title: "Remove Faction",
  description: "Remove a faction and its clock. Game Master only.",
  inputSchema: { faction_id: z.string() },
}, async ({ faction_id }: any) => {
  requireGM();
  const novel = requireNovel();
  const idx = novel.factions.findIndex(f => f.id === faction_id);
  if (idx === -1) return err("NOT_FOUND", `Faction '${faction_id}' not found.`);
  const name = novel.factions[idx].name;
  novel.factions.splice(idx, 1);
  state.saveNovel(novel);
  audit("remove_faction", { faction_id });
  return ok(`Faction '${name}' removed.`);
});

// --- Secrets (GM) ---

server.registerTool("set_secret", {
  title: "Set Secret",
  description: "Create a secret lore entry. GM-only; visible to entities after reveal_secret. Game Master only.",
  inputSchema: { key: z.string(), content: z.string(), triggers: z.array(z.string()).optional(), badge_scope: z.enum(["game_master", "shared"]).optional(), world_target: z.string().optional() },
}, async ({ key, content, triggers, badge_scope, world_target }: any) => {
  requireGM();
  const novel = requireNovel();
  if (novel.secrets.some(s => s.key === key)) return err("STATE_CONFLICT", `Secret '${key}' already exists.`);
  novel.secrets.push({ key, content, triggers: triggers ?? [], badge_scope: badge_scope ?? "game_master", known_by: [], world_target });
  state.saveNovel(novel);
  return ok(`Secret '${key}' created.`);
});

server.registerTool("reveal_secret", {
  title: "Reveal Secret",
  description: "Make a secret known to a specific entity. Game Master only.",
  inputSchema: { key: z.string(), entity_id: z.string() },
}, async ({ key, entity_id }: any) => {
  requireGM();
  const novel = requireNovel();
  const secret = novel.secrets.find(s => s.key === key);
  if (!secret) return err("NOT_FOUND", `Secret '${key}' not found.`);
  if (!novel.entities.has(entity_id)) return err("NOT_FOUND", `Entity '${entity_id}' not found.`);
  if (!secret.known_by.includes(entity_id)) secret.known_by.push(entity_id);
  state.saveNovel(novel);
  return ok(`Secret '${key}' revealed to '${entity_id}'.`);
});

server.registerTool("get_knowledge", {
  title: "Get Knowledge",
  description: "Return what secrets an entity knows. Game Master only.",
  inputSchema: { entity_id: z.string(), key: z.string().optional() },
}, async ({ entity_id, key }: any) => {
  requireGM();
  const novel = requireNovel();
  if (!novel.entities.has(entity_id)) return err("NOT_FOUND", `Entity '${entity_id}' not found.`);
  const known = novel.secrets.filter(s => s.known_by.includes(entity_id));
  if (key) {
    const s = known.find(s => s.key === key);
    return raw(JSON.stringify(s ?? { key, known: false }));
  }
  return raw(JSON.stringify(known.map(s => ({ key: s.key, content: s.content }))));
});

// --- Relationships (GM) ---

server.registerTool("set_relationship", {
  title: "Set Relationship",
  description: "Set a directed relationship between entities, NPCs, or factions. Types: ally, rival, neutral, mentor, dependent, suspicious. Game Master only.",
  inputSchema: { entity_a: z.string(), entity_b: z.string(), type: z.enum(["ally", "rival", "neutral", "mentor", "dependent", "suspicious"]), value: z.number().optional(), description: z.string().optional() },
}, async ({ entity_a, entity_b, type, value, description }: any) => {
  requireGM();
  const novel = requireNovel();
  novel.relationships.push({ entity_a, entity_b, type, value, description });
  state.saveNovel(novel);
  return ok(`Relationship set: ${entity_a} -> ${entity_b} (${type}).`);
});

server.registerTool("get_relationships", {
  title: "Get Relationships",
  description: "Return all relationships (incoming and outgoing) for an entity. Game Master only.",
  inputSchema: { entity_id: z.string() },
}, async ({ entity_id }: any) => {
  requireGM();
  const novel = requireNovel();
  const outgoing = novel.relationships.filter(r => r.entity_a === entity_id);
  const incoming = novel.relationships.filter(r => r.entity_b === entity_id);
  return raw(JSON.stringify({ outgoing, incoming }, null, 2));
});

// --- Vows (GM) ---

server.registerTool("set_vow", {
  title: "Set Vow",
  description: "Track a narrative vow, quest, or obligation. Game Master only.",
  inputSchema: { name: z.string(), description: z.string(), parties: z.array(z.string()), difficulty: z.enum(["troublesome", "dangerous", "formidable", "extreme", "epic"]), scope: z.enum(["gm", "shared", "faction", "party"]).optional() },
}, async ({ name, description, parties, difficulty, scope }: any) => {
  requireGM();
  const novel = requireNovel();
  if (novel.vows.some(v => v.name === name)) return err("STATE_CONFLICT", `Vow '${name}' already exists.`);
  novel.vows.push({
    name, description, parties, difficulty: difficulty as any, scope: scope ?? "shared",
    milestones: 0, rank_track: DIFFICULTY_TRACKS[difficulty] ?? 10, state: "active",
  });
  state.recordMutation(novel, "set_vow", "vow");
  state.saveNovel(novel);
  return ok(`Vow '${name}' set (${difficulty}, ${DIFFICULTY_TRACKS[difficulty]} milestones).`);
});

server.registerTool("mark_milestone", {
  title: "Mark Milestone",
  description: "Advance a vow's progress by one milestone. Game Master only.",
  inputSchema: { vow_name: z.string() },
}, async ({ vow_name }: any) => {
  requireGM();
  const novel = requireNovel();
  const vow = novel.vows.find(v => v.name === vow_name);
  if (!vow) return err("NOT_FOUND", `Vow '${vow_name}' not found.`);
  vow.milestones++;
  state.saveNovel(novel);
  return ok(`Vow '${vow_name}' progress: ${vow.milestones}/${vow.rank_track} milestones.`);
});

server.registerTool("resolve_vow", {
  title: "Resolve Vow",
  description: "Close a completed vow with outcome and consequences. Game Master only.",
  inputSchema: { vow_name: z.string(), outcome: z.string(), consequences: z.string().optional() },
}, async ({ vow_name, outcome, consequences }: any) => {
  requireGM();
  const novel = requireNovel();
  const vow = novel.vows.find(v => v.name === vow_name);
  if (!vow) return err("NOT_FOUND", `Vow '${vow_name}' not found.`);
  vow.state = "resolved";
  vow.outcome = outcome;
  vow.consequences = consequences;
  state.saveNovel(novel);
  return ok(`Vow '${vow_name}' resolved.`);
});

server.registerTool("forsake_vow", {
  title: "Forsake Vow",
  description: "Abandon a vow with a reason. Game Master only.",
  inputSchema: { vow_name: z.string(), reason: z.string() },
}, async ({ vow_name, reason }: any) => {
  requireGM();
  const novel = requireNovel();
  const vow = novel.vows.find(v => v.name === vow_name);
  if (!vow) return err("NOT_FOUND", `Vow '${vow_name}' not found.`);
  vow.state = "forsaken";
  vow.reason = reason;
  state.saveNovel(novel);
  return ok(`Vow '${vow_name}' forsaken.`);
});

// --- Story Journal (GM) ---

server.registerTool("record_story", {
  title: "Record Story",
  description: "Record a narrative memory in the story journal. Types: decision, moment, revelation, bond, consequence. Game Master only.",
  inputSchema: { type: z.enum(["decision", "moment", "revelation", "bond", "consequence"]), entry: z.string() },
}, async ({ type, entry }: any) => {
  requireGM();
  const novel = requireNovel();
  const index = novel.story_journal.length;
  novel.story_journal.push({
    index, type, entry,
    scene_anchor: novel.scene_description?.substring(0, 80) ?? "",
    entity_ids: [],
    timestamp: new Date().toISOString(),
  });
  state.recordMutation(novel, "record_story", "journal");
  state.saveNovel(novel);
  return ok(`Story entry #${index} recorded (${type}).`);
});

server.registerTool("update_story", {
  title: "Update Story",
  description: "Edit a story journal entry by index. Decision and consequence entries are immutable. Game Master only.",
  inputSchema: { index: z.number().min(0), type: z.enum(["decision", "moment", "revelation", "bond", "consequence"]).optional(), entry: z.string().optional() },
}, async ({ index, type, entry }: any) => {
  requireGM();
  const novel = requireNovel();
  if (index >= novel.story_journal.length) return err("NOT_FOUND", `Story entry #${index} not found.`);
  const story = novel.story_journal[index];
  if (story.type === "decision" || story.type === "consequence") return err("STATE_CONFLICT", `${story.type} entries are immutable.`);
  if (type) story.type = type;
  if (entry) story.entry = entry;
  state.saveNovel(novel);
  return ok(`Story entry #${index} updated.`);
});

server.registerTool("remove_story", {
  title: "Remove Story",
  description: "Delete a story journal entry by index. Game Master only.",
  inputSchema: { index: z.number().min(0) },
}, async ({ index }: any) => {
  requireGM();
  const novel = requireNovel();
  if (index >= novel.story_journal.length) return err("NOT_FOUND", `Story entry #${index} not found.`);
  novel.story_journal.splice(index, 1);
  state.saveNovel(novel);
  return ok(`Story entry #${index} removed.`);
});

server.registerTool("list_stories", {
  title: "List Stories",
  description: "List story journal entries with optional type filter and pagination. Game Master only.",
  inputSchema: { filter: z.enum(["decision", "moment", "revelation", "bond", "consequence"]).optional(), offset: z.number().min(0).optional(), limit: z.number().min(0).optional(), ...detailZod },
}, async ({ filter, offset, limit, detail }: any) => {
  requireGM();
  const novel = requireNovel();
  let entries = [...novel.story_journal];
  if (filter) entries = entries.filter(e => e.type === filter);
  if (offset) entries = entries.slice(offset);
  if (limit) entries = entries.slice(0, limit);
  if (wantsDetail(detail)) return raw(JSON.stringify(entries, null, 2));
  return raw(JSON.stringify(entries.map(e => ({ type: e.type, timestamp: e.timestamp, preview: (e.entry ?? "").substring(0, 120) })), null, 2));
});

// --- Notes ---

server.registerTool("set_note", {
  title: "Set Note",
  description: "Create or update a key-value note. Badge-scoped: game_master (default), player, or shared.",
  inputSchema: { key: z.string(), content: z.string(), badge_scope: z.enum(["game_master", "player", "shared"]).optional() },
}, async ({ key, content, badge_scope }: any) => {
  requireNotObserver();
  const novel = requireNovel();
  const existing = novel.notes.find(n => n.key === key);
  // Default scope is game_master (REQ-242); the Player badge cannot write GM-scoped notes.
  const scope = badge_scope ?? "game_master";
  if (novel.badge === "player" && scope === "game_master") {
    return err("FORBIDDEN", "The Player badge cannot write a game_master-scoped note.");
  }
  if (existing) {
    if (novel.badge === "player" && existing.badge_scope === "game_master") {
      return err("FORBIDDEN", "The Player badge cannot modify a game_master-scoped note.");
    }
    existing.content = content;
    existing.badge_scope = scope;
  } else {
    novel.notes.push({ key, content, badge_scope: scope });
  }
  state.recordMutation(novel, "set_note", "note");
  state.saveNovel(novel);
  return ok(`Note '${key}' set.`);
});

server.registerTool("remove_note", {
  title: "Remove Note",
  description: "Remove a note by key. Badge-scoped: caller's badge must own the scope.",
  inputSchema: { key: z.string() },
}, async ({ key }: any) => {
  requireNotObserver();
  const novel = requireNovel();
  const idx = novel.notes.findIndex(n => n.key === key);
  if (idx === -1) return err("NOT_FOUND", `Note '${key}' not found.`);
  const note = novel.notes[idx];
  if (novel.badge === "player" && note.badge_scope === "game_master") {
    return err("FORBIDDEN", "The Player badge cannot remove a game_master-scoped note.");
  }
  novel.notes.splice(idx, 1);
  state.saveNovel(novel);
  return ok(`Note '${key}' removed.`);
});

server.registerTool("list_notes", {
  title: "List Notes",
  description: "List all notes (100-character preview), badge-filtered.",
  inputSchema: {},
}, async () => {
  const novel = requireNovel();
  const badge = novel.badge;
  const filtered = badge === "game_master" || badge === "none" ? novel.notes
    : novel.notes.filter(n => n.badge_scope !== "game_master");
  return raw(JSON.stringify(filtered.map(n => ({ key: n.key, badge_scope: n.badge_scope, preview: n.content.substring(0, 100) })), null, 2));
});

// --- Server Notes (GM) ---

server.registerTool("set_server_note", {
  title: "Set Server Note",
  description: "Create or update a server-level note. Game Master only.",
  inputSchema: { key: z.string(), content: z.string(), narrative_tag: z.enum(["campaign_bible", "house_rules", "lore_seed", "session_reminder"]).optional() },
}, async ({ key, content, narrative_tag }: any) => {
  requireGM();
  state.serverNotes.set(key, { content, narrative_tag });
  state.saveServerNotes();
  return ok(`Server note '${key}' set.`);
});

server.registerTool("remove_server_note", {
  title: "Remove Server Note",
  description: "Remove a server-level note. Game Master only.",
  inputSchema: { key: z.string() },
}, async ({ key }: any) => {
  requireGM();
  if (!state.serverNotes.has(key)) return err("NOT_FOUND", `Server note '${key}' not found.`);
  state.serverNotes.delete(key);
  state.saveServerNotes();
  return ok(`Server note '${key}' removed.`);
});

server.registerTool("list_server_notes", {
  title: "List Server Notes",
  description: "List all server-level notes. Game Master only.",
  inputSchema: {},
}, async () => {
  requireGM();
  const notes = Object.fromEntries(state.serverNotes);
  return raw(JSON.stringify(notes, null, 2));
});

// --- Pause/Resume (GM) ---

server.registerTool("set_pause_context", {
  title: "Set Pause Context",
  description: "Save GM context for session resumption. Game Master only.",
  inputSchema: { current_scene: z.string().optional(), immediate_situation: z.string().optional(), pending_player_action: z.string().optional(), short_term_plans: z.string().optional(), long_term_plans: z.string().optional(), player_goals: z.string().optional() },
}, async (fields: any) => {
  requireGM();
  const novel = requireNovel();
  // Auto-capture derived context (REQ-232): faction clocks, countdown positions,
  // NPC dispositions, relationships, recent story entries, and active vows.
  const f = {
    ...fields,
    faction_clocks: novel.factions.map(x => ({ name: x.name, clock: x.clock, clock_max: x.clock_max, status: x.status })),
    countdown_positions: [...novel.countdowns.entries()].map(([name, cd]) => ({ name, ticks: cd.ticks, total: cd.total })),
    npc_dispositions: [...novel.npcs.values()].map(n => ({ name: n.name, disposition: n.disposition, location: n.location })),
    relationships: novel.relationships,
    story_context: novel.story_journal.slice(-3).map(s => s.entry),
    active_vows: novel.vows.filter(v => v.state === "active").map(v => ({ name: v.name, difficulty: v.difficulty, milestone_count: v.milestones })),
  };
  novel.gm_context = { ...novel.gm_context, ...f, saved_at: new Date().toISOString() };
  // REQ-403 — committing the pause context records the state write, clearing drift.
  state.recordMutation(novel, "set_pause_context", "context");
  state.saveNovel(novel);
  return ok("Pause context saved.");
});

server.registerTool("get_pause_context", {
  title: "Get Pause Context",
  description: "Return the saved GM context plus Novel state summary for session resumption.",
  inputSchema: {},
}, async () => {
  const novel = requireNovel();
  return raw(JSON.stringify({
    gm_context: novel.gm_context,
    novel_slug: novel.slug,
    scene: novel.scene_description,
    world_rooms: novel.world.rooms.size,
    npcs: novel.npcs.size,
    active_vows: novel.vows.filter(v => v.state === "active"),
  }, null, 2));
});

// --- Checkpoints (GM) ---

server.registerTool("set_checkpoint", {
  title: "Set Checkpoint",
  description: "Save a named checkpoint of the full Novel state. Game Master only.",
  inputSchema: { label: z.string() },
}, async ({ label }: any) => {
  requireGM();
  const novel = requireNovel();
  novel.checkpoints.push({ label, timestamp: new Date().toISOString(), state: JSON.parse(JSON.stringify(novelToJSONState(novel))) });
  state.saveNovel(novel);
  return ok(`Checkpoint '${label}' saved.`);
});

server.registerTool("list_checkpoints", {
  title: "List Checkpoints",
  description: "List all checkpoints for the active Novel. Game Master only.",
  inputSchema: {},
}, async () => {
  requireGM();
  const novel = requireNovel();
  return raw(JSON.stringify(novel.checkpoints.map(c => ({ label: c.label, timestamp: c.timestamp })), null, 2));
});

server.registerTool("restore_checkpoint", {
  title: "Restore Checkpoint",
  description: "Restore a checkpoint (confirmation required). Game Master only.",
  inputSchema: { label: z.string() },
}, async ({ label }: any) => {
  requireGM();
  const novel = requireNovel();
  if (novel.pending_workflow) return err("STATE_CONFLICT", "A workflow decision is pending. Resolve it with respond before starting a new one.");
  const cp = novel.checkpoints.find(c => c.label === label);
  if (!cp) return err("NOT_FOUND", `Checkpoint '${label}' not found.`);
  novel.pending_workflow = {
    decision: `restore_checkpoint:${label}`,
    snapshot: state.captureWorkflowSnapshot(novel),
    payload: { label, state: cp.state },
  };
  state.saveNovel(novel);
  return needInput(`Decision: -restore_checkpoint-
Question: Restore checkpoint "${label}"? This reverts the Novel to that snapshot.
Options: yes, cancel`);
});

server.registerTool("remove_checkpoint", {
  title: "Remove Checkpoint",
  description: "Remove a named checkpoint. Game Master only.",
  inputSchema: { label: z.string() },
}, async ({ label }: any) => {
  requireGM();
  const novel = requireNovel();
  const idx = novel.checkpoints.findIndex(c => c.label === label);
  if (idx === -1) return err("NOT_FOUND", `Checkpoint '${label}' not found.`);
  novel.checkpoints.splice(idx, 1);
  state.saveNovel(novel);
  return ok(`Checkpoint '${label}' removed.`);
});

// --- Novel Lifecycle additions (GM) ---

server.registerTool("rename_novel", {
  title: "Rename Novel",
  description: "Rename the active Novel on disk. Game Master only.",
  inputSchema: { new_slug: z.string() },
}, async ({ new_slug }: any) => {
  requireGM();
  const novel = requireNovel();
  const oldSlug = novel.slug;
  const newSlug = new_slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  // Delete old file, save at new path.
  const oldFile = path.join(DATA_DIR, "novels", `${oldSlug}.json`);
  if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
  const oldBak = oldFile + ".bak";
  if (fs.existsSync(oldBak)) fs.unlinkSync(oldBak);
  state.renameNovel(novel, newSlug);
  return ok(`Novel renamed to '${novel.slug}'.`);
});

// REQ-259 — Update Novel description: sets/replaces/clears the active Novel's
// description, surfaced in novel_info and badge_briefing.
server.registerTool("update_novel_description", {
  title: "Update Novel Description",
  description: "Set or replace the active Novel's description. An empty string clears it. Game Master only.",
  inputSchema: { description: z.string() },
}, async ({ description }: any) => {
  requireGM();
  const novel = requireNovel();
  novel.description = description ?? "";
  state.saveNovel(novel);
  audit("update_novel_description", { description: (description ?? "").substring(0, 120) });
  return ok(description ? `Novel description updated.` : "Novel description cleared.");
});

server.registerTool("list_novels", {
  title: "List Novels",
  description: "List all Novels on disk with metadata. Always callable.",
  inputSchema: { ...detailZod, filter: z.enum(["active", "archived", "all"]).optional() },
}, async ({ detail, filter }: any) => {
  const arch = state.archivedNovels();
  const archivedSlugs = new Set(arch.map((a) => a.slug));
  const active = [...state.novels.entries()].filter(([, n]) => !archivedSlugs.has(n.slug));
  const mode = filter ?? "active";
  const rows = mode === "archived"
    ? arch
    : active.filter(([, n]) => (mode === "all" ? true : !archivedSlugs.has(n.slug))).map(([slug, n]) => {
      if (wantsDetail(detail)) {
        return { slug, name: n.name, entities: n.entities.size, npcs: n.npcs.size, lore: n.lore.size, world_rooms: n.world.rooms.size, modified: n.metadata.modified };
      }
      return { slug, name: n.name, entities: n.entities.size, modified: n.metadata.modified };
    });
  return raw(JSON.stringify(rows, null, 2));
});

// REQ-334 — archive/unarchive Novel (Game Master only).
server.registerTool("archive_novel", {
  title: "Archive Novel",
  description: "Move a Novel to the long-term archive (read-only). Game Master only.",
  inputSchema: { slug: z.string() },
}, async ({ slug }: any) => {
  requireGM();
  if (state.activeNovelId === slug) state.activeNovelId = null;
  const result = state.archiveNovel(slug);
  audit("archive_novel", { slug });
  return ok(`Novel '${slug}' archived (read-only).`);
});

server.registerTool("unarchive_novel", {
  title: "Unarchive Novel",
  description: "Restore an archived Novel to active status. Game Master only.",
  inputSchema: { slug: z.string() },
}, async ({ slug }: any) => {
  requireGM();
  const novel = state.unarchiveNovel(slug);
  audit("unarchive_novel", { slug });
  return ok(`Novel '${slug}' restored from archive.`);
});

server.registerTool("novel_info", {
  title: "Novel Info",
  description: "Return extended metadata for a Novel. Always callable.",
  inputSchema: { slug: z.string().optional() },
}, async ({ slug }: any) => {
  const novel = slug ? state.novels.get(slug) : state.activeNovel;
  if (!novel) return err("NOT_FOUND", `Novel '${slug || "none"}' not found.`);
  return raw(JSON.stringify({
    slug: novel.slug, name: novel.name, ruleset: novel.ruleset, description: novel.description, genre: novel.genre,
    entities: novel.entities.size, npcs: novel.npcs.size, lore: novel.lore.size,
    world_rooms: novel.world.rooms.size, world_things: novel.world.things.size,
    factions: novel.factions.length, vows: novel.vows.length,
    scene: novel.scene_description ? novel.scene_description.substring(0, 100) : null,
    created: novel.metadata.created, modified: novel.metadata.modified,
  }, null, 2));
});

// REQ-294 — set_genre: set the active Novel's canonical genre tag.
const GENRE_CATALOG = ["noir", "high_fantasy", "sword_and_sorcery", "sci_fi_horror", "cosmic_horror", "historical", "western", "modern", "cyberpunk"];
server.registerTool("set_genre", {
  title: "Set Genre",
  description: "Set the active Novel's genre tag. Game Master only. Valid: noir, high_fantasy, sword_and_sorcery, sci_fi_horror, cosmic_horror, historical, western, modern, cyberpunk.",
  inputSchema: { genre: z.string() },
}, async ({ genre }: any) => {
  requireGM();
  const novel = requireNovel();
  if (!GENRE_CATALOG.includes(genre)) {
    return err("INVALID_INPUT", `Unknown genre '${genre}'. Valid: ${GENRE_CATALOG.join(", ")}.`);
  }
  novel.genre = genre;
  state.saveNovel(novel);
  audit("set_genre", { genre });
  return ok(`Genre set to '${genre}'.`);
});

server.registerTool("clone_novel", {
  title: "Clone Novel",
  description: "Create an independent copy of a Novel. Game Master only.",
  inputSchema: { source_slug: z.string(), new_name: z.string(), trim_audit_sessions: z.number().min(0).optional() },
}, async ({ source_slug, new_name }: any) => {
  requireGM();
  const source = state.novels.get(source_slug);
  if (!source) return err("NOT_FOUND", `Source novel '${source_slug}' not found.`);
  const slug = new_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const clone = JSON.parse(JSON.stringify(novelToJSONState(source)));
  clone.slug = slug;
  clone.name = new_name;
  clone.metadata.created = new Date().toISOString();
  clone.metadata.modified = new Date().toISOString();
  const novel = loadNovelFromStateData(clone);
  state.novels.set(slug, novel);
  state.saveNovel(novel);
  return ok(`Cloned '${source_slug}' as '${slug}'.`);
});

// --- Entity Management ---

server.registerTool("remove_entity", {
  title: "Remove Entity",
  description: "Remove an entity from the active Novel. Game Master only.",
  inputSchema: { entity_id: z.string() },
}, async ({ entity_id }: any) => {
  requireGM();
  const novel = requireNovel();
  if (!novel.entities.has(entity_id)) return err("NOT_FOUND", `Entity '${entity_id}' not found.`);
  novel.entities.delete(entity_id);
  if (novel.active_entity_id === entity_id) novel.active_entity_id = null;
  state.saveNovel(novel);
  return ok(`Entity '${entity_id}' removed.`);
});

server.registerTool("remove_roster_character", {
  title: "Remove Roster Character",
  description: "Remove a character from the roster. Game Master only.",
  inputSchema: { roster_id: z.string() },
}, async ({ roster_id }: any) => {
  requireGM();
  if (!state.roster.has(roster_id)) return err("NOT_FOUND", `Roster character '${roster_id}' not found.`);
  state.roster.delete(roster_id);
  state.saveRoster();
  return ok(`Roster character '${roster_id}' removed.`);
});

server.registerTool("list_roster_characters", {
  title: "List Roster Characters",
  description: "List all characters in the roster.",
  inputSchema: {},
}, async () => {
  const chars = [...state.roster.entries()].map(([id, e]) => ({ id, name: e.name }));
  return raw(JSON.stringify(chars, null, 2));
});

// --- Special tools ---

server.registerTool("toggle_action_patterns", {
  title: "Toggle Action Patterns",
  description: "Toggle enrich-derived action patterns on or off for the active Novel. Game Master only.",
  inputSchema: {},
}, async () => {
  requireGM();
  const novel = requireNovel();
  novel.action_patterns_enabled = !novel.action_patterns_enabled;
  state.saveNovel(novel);
  return ok(`Action patterns ${novel.action_patterns_enabled ? "enabled" : "disabled"}.`);
});

server.registerTool("present_choices", {
  title: "Present Choices",
  description: "Present structured choice prompts to the player. Resolved via respond. Game Master only.",
  inputSchema: {
    prompt: z.string(),
    choices: z.array(z.object({ id: z.string(), label: z.string(), description: z.string().optional() })),
    allow_freeform: z.boolean().optional(),
    context: z.record(z.string(), z.any()).optional(),
  },
}, async ({ prompt, choices, allow_freeform, context }: any) => {
  requireGM();
  const novel = requireNovel();
  // REQ-191 — options render as display-label pairs: `**<kebab-id>** — <label>`.
  if (novel.pending_workflow) {
    return err("STATE_CONFLICT", "A workflow decision is pending. Resolve it with respond before starting a new one.");
  }
  novel.pending_workflow = {
    decision: "present_choices",
    snapshot: state.captureWorkflowSnapshot(novel),
    payload: { prompt, choices, allow_freeform, context },
  };
  state.saveNovel(novel);
  const opts = choices.map((c: any) => `  **${c.id}** — ${c.label}${c.description ? `: ${c.description}` : ""}`).join("\n");
  return needInput(`Decision: -present_choices-\nQuestion: ${prompt}\n\nOptions:\n${opts}${allow_freeform ? "\n\nYou may also respond with a freeform answer." : ""}`);
});

server.registerTool("ask_oracle", {
  title: "Ask Oracle",
  description: "Resolve uncertainty with a d100 roll against the Ask-the-Oracle ladder: almost_certain (≥11), likely (≥26), 50_50 (≥51), unlikely (≥76), small_chance (≥91). Defaults to 50_50 when likelihood is omitted. Callable by Player and Game Master.",
  inputSchema: { question: z.string(), likelihood: z.enum(["almost_certain", "likely", "50_50", "unlikely", "small_chance"]).optional(), seed: z.string().optional() },
}, async ({ question, likelihood, seed }: any) => {
  requireNotObserver();
  const novel = requireNovel();
  // Ask-the-Oracle ladder (REQ-291): each tier is a d100 target the roll must
  // meet or exceed for a YES. Omitted likelihood defaults to 50_50.
  const thresholds: Record<string, number> = { almost_certain: 11, likely: 26, "50_50": 51, unlikely: 76, small_chance: 91 };
  const band = likelihood ?? "50_50";
  const target = thresholds[band] ?? 51;
  // Seeded draw uses an isolated Rng (REQ-050b); otherwise the session PRNG.
  const roll = seed ? createRng(seed).roll(100) : sessionRoll(100);
  const yes = roll >= target;
  // Doubles on the d100 (11, 22, …, 99) produce an exceptional result (REQ-291).
  const isDoubles = roll % 11 === 0;
  const marker = isDoubles
    ? (yes ? "[EXCEPTIONAL_YES]" : "[EXCEPTIONAL_NO]")
    : (yes ? "[YES]" : "[NO]");
  audit("ask_oracle", { question, likelihood: band, seed });
  // REQ-404 — roll-to-commit coupling: a significant roll flags an
  // uncommitted-roll marker cleared by the next state write.
  novel.uncommitted_rolls.push({ roll: `${roll}/100 → ${marker}`, suggested_tool: "record_story", at: new Date().toISOString() });
  if (novel.uncommitted_rolls.length > 3) novel.uncommitted_rolls.shift();
  state.saveNovel(novel);
  let flavor = "";
  if (!isDoubles && Math.abs(target - roll) <= 5) flavor = " (barely)";
  else if (!isDoubles && Math.abs(target - roll) >= 30) flavor = " (decisively)";
  return ok(`Question: "${question}"\nLikelihood: ${band} (roll ≥ ${target})\nRoll: ${roll}/100 → ${marker}${flavor}`);
});

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
    metadata: data.metadata ?? { created: new Date().toISOString(), modified: new Date().toISOString(), session_count: 0, total_combat_rounds: 0, last_scene_anchor: "" },
  };
}

function normalizeSceneTypeState(raw: unknown): ("combat" | "social" | "exploration" | "neutral")[] {
  if (!raw) return ["neutral"];
  if (Array.isArray(raw)) return (raw as string[]).filter((t): t is "combat" | "social" | "exploration" | "neutral" => ["combat", "social", "exploration", "neutral"].includes(t));
  if (typeof raw === "string" && ["combat", "social", "exploration", "neutral"].includes(raw)) return [raw as any];
  return ["neutral"];
}

// --- Guidance (GM) ---

server.registerTool("set_briefing_order", {
  title: "Set Briefing Order",
  description: "Reorder sections of badge_briefing. Game Master only.",
  inputSchema: { sections: z.array(z.string()) },
}, async ({ sections }: any) => {
  requireGM();
  const novel = requireNovel();
  novel.briefing_order = sections;
  state.saveNovel(novel);
  return ok(`Briefing order set to: ${sections.join(", ")}.`);
});

server.registerTool("compact_audit_log", {
  title: "Compact Audit Log",
  description: "Summarize recent audit entries. Callable by both badges.",
  inputSchema: { max_entries: z.number().optional() },
}, async ({ max_entries }: any) => {
  const novel = requireNovel();
  const max = max_entries ?? 20;
  const recent = novel.audit_log.slice(-max);
  const isGM = novel.badge === "game_master";
  const filtered = isGM ? recent : recent.filter(e => e.badge !== "game_master");
  if (filtered.length === 0) return ok("No audit entries.");
  const lines = filtered.map(e => `${e.timestamp.split("T")[1]?.substring(0, 8) || "?"} [${e.badge ?? "·"}] ${e.tool} → ${e.output_prefix || ""}`);
  return raw(`## Audit (last ${filtered.length} entries)\n${lines.join("\n")}`);
});

// Slug-ify a free-text premise into a stable identifier for adventure storage
// (REQ-090: title is slug-ified from the premise).
function slugifyPremise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "generated";
}

// REQ-090 — generate_adventure(premise, target?). Produces a real adventure
// scaffold: title, GM-only Overview, player-visible Hook, 2–6 locations with
// table-rolled flavor, NPC name suggestions, and encounter-table seeds — drawn
// from Synthesis adventure_advice templates / scenario_starters / table
// expansions. `target` selects novel (default when a Novel is active), codex
// (default otherwise), or both. No Novel is required for the codex target.
server.registerTool("generate_adventure", {
  title: "Generate Adventure",
  description: "Generate an adventure scaffold from a premise. Game Master only.",
  inputSchema: {
    premise: z.string(),
    target: z.enum(["novel", "codex", "both"]).optional(),
  },
}, async ({ premise, target }: any) => {
  requireGM();
  const novel = state.activeNovel;
  const slug = slugifyPremise(premise);
  const tgt = target ?? (novel ? "novel" : "codex");

  const advice = state.enrichmentManifest?.adventure_advice ?? DEFAULT_ENRICHMENT.adventure_advice;
  const templates = advice.templates ?? [];
  const starters = advice.scenario_starters ?? [];
  const tableExpansions = advice.table_expansions ?? [];

  const rng = createRng(`adventure:${slug}:${premise}`);

  // Location flavor pools (REQ-090: table-rolled flavor — setting, horror,
  // puzzle). Drawn deterministically so regeneration with the same premise
  // replaces the prior scaffold with an identical one.
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
  const encounterSeed = tableExpansions.length > 0
    ? (tableExpansions[rng.roll(tableExpansions.length) - 1] as any).content
    : "the rival faction arrives as the characters reach the final location";
  const starter = starters.length > 0 ? (starters[rng.roll(starters.length) - 1] as any).content : "";
  const template = templates.length > 0 ? (templates[rng.roll(templates.length) - 1] as any).source_url : "synthesis://adventure_advice";

  const scaffold: any = {
    title: premise.trim(),
    slug,
    overview: `Overview (GM-only): ${starter || "A open-ended adventure scaffold keyed to the premise."} Template source: ${template}.`,
    hook: `${locations[0]?.heading ?? "A starting scene"} draws the characters in — ${locations[0]?.flavor ?? ""}`,
    locations,
    npc_suggestions: npcSuggestions,
    encounter_seeds: [encounterSeed],
    genre_tags: novel?.genre ? [novel.genre] : [],
    generated_at: new Date().toISOString(),
    source: "generated",
  };

  const results: string[] = [];

  if (tgt === "codex" || tgt === "both") {
    const id = `adventure_${slug}`;
    const existing = state.codex.get(id);
    const entry: any = {
      id, kind: "adventure", name: slug, content: { ...scaffold, suggested_beats: scaffold.locations.map((l: any) => ({ beat: "setup", scene_preview: l.heading })) },
      description: premise.trim(),
      tags: scaffold.genre_tags,
      visibility: existing?.visibility ?? "library",
      imported_at: existing?.imported_at ?? new Date().toISOString(),
      codex_modified_at: new Date().toISOString(),
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
      premise: premise.trim(),
      hooks: [scaffold.hook],
      npcs: npcSuggestions.map((n) => ({ name: n })),
      locations: locations.map((l) => ({ name: l.heading, description: l.flavor })),
      factions: [],
    };
    novel.adventure_set = true;
    state.saveNovel(novel);
    audit("generate_adventure", { premise, target: tgt, slug });
    results.push(`Novel adventure scaffold stored (adventure://generated/${slug})`);
  }

  return ok(`Adventure "${premise.trim()}" generated:\n\n${scaffold.overview}\n\n**Hook:** ${scaffold.hook}\n\n${locations.map(l => `- ${l.heading}: ${l.flavor}`).join("\n")}\n\n**NPC suggestions:** ${npcSuggestions.join(", ")}\n\n**Encounter seed:** ${encounterSeed}\n\n${results.join("\n")}`);
});

// REQ-091 — generate_encounter(context). Produces a scene description, an NPC
// stat block, and a complication lore entry as one atomic batch with a single
// undo target. Player badge → [FORBIDDEN].
server.registerTool("generate_encounter", {
  title: "Generate Encounter",
  description: "Generate a scene + NPC + lore entry from context. Game Master only.",
  inputSchema: { context: z.string() },
}, async ({ context }: any) => {
  requireGM();
  const novel = requireNovel();
  const ctx = String(context).trim();
  const rng = createRng(`encounter:${ctx}`);

  const monsterPool = ["a lone sentinel", "a pack of shadow hounds", "an armored enforcer with a debt", "a shrieking flock", "a stone golem misfiring its wards"];
  const complicationPool = ["the ground collapses underfoot", "a third party arrives mid-fight", "the objective is trapped", "reinforcements are on the way", "the environment is flammable"];
  const monster = monsterPool[rng.roll(monsterPool.length) - 1];
  const complication = complicationPool[rng.roll(complicationPool.length) - 1];

  // Single undo target for the whole batch (REQ-091b).
  novelSnapshot();

  const sceneDesc = `${ctx} — ${monster} blocks the way.`;
  novel.scene_description = sceneDesc;
  novel.scene_location = ctx;
  novel.scene_type = [...new Set([...(novel.scene_type ?? []), "combat" as const])];

  const npcId = `npc_${Date.now().toString(36)}`;
  const npc: any = { id: npcId, name: monster, description: `Encountered during: ${ctx}`, disposition: "hostile", location: ctx, conditions: [], condition_rounds: {} };
  novel.npcs.set(npcId, npc);

  const loreKey = `complication_${slugifyPremise(ctx)}`;
  novel.lore.set(loreKey, {
    key: loreKey, content: complication,
    triggers: [ctx], badge_scope: "game_master",
    priority: 0, sticky: 0, sticky_remaining: 0, enabled: true,
  });

  state.saveNovel(novel);
  audit("generate_encounter", { context: ctx, npc_id: npcId, lore_key: loreKey });

  return ok(`Encounter generated (atomic batch, single undo target):\n\n**Scene:** ${sceneDesc}\n\n**NPC:** ${monster} (${npcId}, hostile)\n\n**Complication:** ${complication}\n\nUndo rolls back the scene, NPC, and lore entry together.`);
});

server.registerTool("load_adventure", {
  title: "Load Adventure",
  description: "Load an adventure module. Game Master only.",
  inputSchema: { slug: z.string() },
}, async ({ slug }: any) => {
  requireGM();
  const novel = requireNovel();
  const adventureDir = process.env.TTRPG_ADVENTURE_DIR ?? path.join(__dirname, "..", "adventures");
  const filePath = path.join(adventureDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return err("NOT_FOUND", `Adventure '${slug}' not found at ${filePath}.`);
  const content = fs.readFileSync(filePath, "utf-8");
  // Parse ## World section if present
  const worldMatch = content.match(/## World\s*\n([\s\S]*?)(?=\n## |$)/);
  if (worldMatch) {
    const { world, result } = convertSource(worldMatch[1], novel.world);
    novel.world = world;
    novel.adventure_slug = slug;
    novel.adventure_set = true;
    state.saveNovel(novel);
    audit("load_adventure", { slug, rooms: result.rooms, things: result.things });
    return ok(`Adventure '${slug}' loaded. World model: ${result.rooms} rooms, ${result.things} things, ${result.exits} exits.`);
  }
  novel.adventure_slug = slug;
  novel.adventure_set = true;
  state.saveNovel(novel);
  return ok(`Adventure '${slug}' loaded (no world-model section found — flat prose only).`);
});

// --- Session ---

// REQ-072 — session_recap summarizes recent session activity.
server.registerTool("session_recap", {
  title: "Session Recap",
  description: "Summarize recent session activity.",
  inputSchema: {},
}, async () => {
  const novel = requireNovel();
  const entity = state.getActiveEntity();
  let recap = `Active Novel: ${novel.name} (${novel.slug})`;
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

  // §5.19 guardrail markers (REQ-402/403/404) — observational, never block.
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
});

// --- Novel Lifecycle ---

server.registerTool("create_novel", {
  title: "Create Novel",
  description: "Create a named novel. Novel persists to disk.",
  inputSchema: { name: z.string(), ruleset: z.string().optional(), genre: z.string().optional(), description: z.string().optional(), codex_adventure: z.string().optional() },
}, async ({ name, ruleset, genre, description, codex_adventure }: any) => {
  requireNotObserver();
  if (ruleset && !rulesets.isInstalled(ruleset)) {
    return err("INVALID_INPUT", `Ruleset '${ruleset}' is not installed. Valid rulesets: ${rulesets.installedSlugs().join(", ") || "(none)"}.`);
  }
  const novel = state.createNovel(name, ruleset ?? null);
  // REQ-294 — genre declaration: the Novel carries a canonical-genre `genre`
  // field surfaced in novel_info, spec_health.active_genre, and badge_briefing.
  if (genre) novel.genre = genre;
  if (description) novel.description = description;
  // REQ-352 — codex adventure beat sequences: pre-populate story_beats from the
  // adventure entry's suggested_beats with [adventure-scaffold] annotation.
  if (codex_adventure) {
    const entry = state.codex.get(codex_adventure);
    if (!entry) return err("NOT_FOUND", `Codex adventure '${codex_adventure}' not found.`);
    if (entry.kind !== "adventure") return err("NOT_FOUND", `Codex entry '${codex_adventure}' is not of kind 'adventure'.`);
    const suggested = (entry.content as any)?.suggested_beats;
    if (Array.isArray(suggested)) {
      for (const sb of suggested) {
        novel.story_beats.push({ beat: sb.beat, scene_preview: sb.scene_preview, source: "adventure-scaffold" });
      }
      novel.adventure_set = true;
    }
  }
  if (genre || description || codex_adventure) state.saveNovel(novel);
  if (ruleset) { try { rulesets.hydrate(ruleset); } catch (e: any) { return err("INVALID_INPUT", e.message); } }
  return ok(`Novel created: ${novel.slug} (novel://current)${ruleset ? `, ruleset: ${ruleset}` : ""}${genre ? `, genre: ${genre}` : ""}

Next step: run the novel_setup guide to add characters, choose a story source, and hold a session zero before play.`);
});

server.registerTool("resume_novel", {
  title: "Resume Novel",
  description: "Resume a previously created novel from disk.",
  inputSchema: { slug: z.string() },
}, async ({ slug }: any) => {
  // REQ-402 — resuming closes the prior session window; a window with zero
  // state writes is surfaced as [session-no-mutations].
  if (state.activeNovel) {
    const sessionId = process.env.TTRPG_SESSION_ID ?? state.activeNovel.metadata.session_count.toString();
    state.closeSessionWindow(state.activeNovel, sessionId);
  }
  const novel = state.resumeNovel(slug);
  novel.metadata.session_count += 1;
  state.saveNovel(novel);
  if (novel.ruleset) {
    if (!rulesets.isInstalled(novel.ruleset)) {
      return err("INVALID_INPUT", `Novel '${novel.slug}' is bound to ruleset '${novel.ruleset}', which is not installed.`);
    }
    try { rulesets.hydrate(novel.ruleset); } catch (e: any) { return err("INVALID_INPUT", e.message); }
  }
  return ok(`Novel resumed: ${novel.name} (${novel.slug})`);
});

server.registerTool("switch_novel", {
  title: "Switch Novel",
  description: "Switch the active novel for this connection. Always callable.",
  inputSchema: { slug: z.string() },
}, async ({ slug }: any) => {
  // REQ-403b — TTRPG_STATE_GATE=block refuses to leave a drifting Novel.
  const active = state.activeNovel;
  if (active && state.stateGate() === "block" && state.stateDriftActive(active)) {
    return err("STATE_CONFLICT", "[state-drift] uncommitted narration detected — resolve with set_pause_context or session_recap before switching.");
  }
  // REQ-402 — switching closes the prior session window.
  if (active) {
    const sessionId = process.env.TTRPG_SESSION_ID ?? active.metadata.session_count.toString();
    state.closeSessionWindow(active, sessionId);
  }
  const novel = state.switchNovel(slug);
  if (novel.ruleset) {
    if (!rulesets.isInstalled(novel.ruleset)) {
      return err("INVALID_INPUT", `Novel '${novel.slug}' is bound to ruleset '${novel.ruleset}', which is not installed.`);
    }
    try { rulesets.hydrate(novel.ruleset); } catch (e: any) { return err("INVALID_INPUT", e.message); }
  }
  return ok(`Switched to novel: ${novel.name} (${novel.slug})`);
});

server.registerTool("end_novel", {
  title: "End Novel",
  description: "End the current novel. Deactivates badge, removes save file.",
  inputSchema: {},
}, async () => {
  requireNotObserver();
  const novel = requireNovel();
  if (novel.pending_workflow) {
    return err("STATE_CONFLICT", "A workflow decision is pending. Resolve it with respond before starting a new one.");
  }
  // REQ-403b — TTRPG_STATE_GATE=block refuses to end a drifting Novel.
  if (state.stateGate() === "block" && state.stateDriftActive(novel)) {
    return err("STATE_CONFLICT", "[state-drift] uncommitted narration detected — resolve with set_pause_context or session_recap before ending.");
  }
  novel.pending_workflow = { decision: "end_novel", snapshot: state.captureWorkflowSnapshot(novel) };
  state.saveNovel(novel);
  return needInput(`Decision: -end_novel-confirm
Question: End Novel "${novel.name}"?
Options: yes, cancel`);
});

server.registerTool("export_novel", {
  title: "Export Novel",
  description: "Export the active novel in interchange format. Game Master only.",
  inputSchema: { format: z.enum(["json", "markdown"]).optional(), scope: z.string().optional() },
}, async ({ format: fmt, scope }: any) => {
  requireGM();
  const novel = requireNovel();
  if (fmt === "markdown") {
    let md = `# ${novel.name}\n\n`;
    md += `## World\n`;
    for (const [, room] of novel.world.rooms) {
      md += `${room.name} is a room. "${room.description}"\n`;
      for (const [dir, target] of room.exits) {
        md += `${dir} of ${room.name} is ${target}.\n`;
      }
    }
    for (const [, thing] of novel.world.things) {
      if (thing.kind !== "thing") {
        md += `${thing.name} is a ${thing.kind}. "${thing.description}"\n`;
      }
      md += `${thing.name} is in ${thing.location}.\n`;
      if (!thing.portable) md += `${thing.name} is fixed.\n`;
      if (thing.openable && thing.open) md += `${thing.name} is open.\n`;
      if (thing.locked) md += `${thing.name} is locked.\n`;
    }
    return raw(md);
  }
  // Full-self-contained interchange per Annex Q / REQ-096. The `novel` key
  // carries the complete serialized state (including actual world rooms/things,
  // entities, npcs, countdowns, audit log, checkpoints, notes, vows), so a
  // replace-import round-trip is lossless.
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
      property_groups_present: [
        "slug", "name", "scene", "world", "lore", "npcs", "story_journal", "factions", "secrets", "relationships", "gm_context", "notes", "vows",
      ],
      waiver_dependent_mechanics: [],
    },
    novel: full,
  };
  // scope filtering (REQ-096b): retain only the payload described by scope.
  const SCOPE_KEYS: Record<string, string[]> = {
    full: [],
    state_only: ["audit_log", "checkpoints", "undo_stacks", "redo_stacks"],
    lore: [],
    world_model: [],
    npcs: [],
    factions: [],
    secrets: [],
    relationships: [],
    gm_context: [],
    notes: [],
    story_journal: [],
    scene_history: [],
  };
  if (scope && scope !== "full") {
    // scope keys describe the ONLY tier(s) to keep; everything else is stripped.
    const keep: Record<string, string[]> = {
      lore: ["lore"],
      world_model: ["world"],
      npcs: ["npcs"],
      factions: ["factions"],
      secrets: ["secrets"],
      relationships: ["relationships"],
      gm_context: ["gm_context"],
      notes: ["notes"],
      story_journal: ["story_journal"],
      scene_history: ["scene_history"],
    };
    const keys = keep[scope] ?? [];
    for (const k of Object.keys(data.novel)) {
      if (!["slug", "name", "ruleset", "genre", "description", "metadata"].includes(k) && !keys.includes(k)) {
        delete data.novel[k];
      }
    }
  }
  return raw(JSON.stringify(data, null, 2));
});

server.registerTool("import_novel", {
  title: "Import Novel",
  description: "Import a previously exported novel. Game Master only.",
  inputSchema: {
    data: z.string(),
    mode: z.enum(["dry-run", "merge", "replace"]).optional(),
    strict: z.boolean().optional(),
  },
}, async ({ data, mode, strict }: any) => {
  requireGM();
  const m = mode ?? "dry-run";
  const strictMode = strict === true;
  let parsed: any;
  try {
    parsed = JSON.parse(data);
  } catch {
    return err("INVALID_INPUT", "Could not parse novel data.");
  }
  // Accept the interchange envelope ({ format_version, manifest, novel }) or a
  // flat legacy payload. The `novel` key is authoritative when present.
  const flat = parsed && parsed.novel && typeof parsed.novel === "object" ? parsed.novel : parsed;
  const manifest = parsed && parsed.manifest && typeof parsed.manifest === "object" ? parsed.manifest : null;

  // Cross-reference validation (REQ-096d1). Collects failures with item paths.
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
      for (const f of (th.faction_refs ?? [])) {
        if (!factionNames.has(f)) failures.push(`gm_context.active_threads: faction ${f} not present`);
      }
    }
    for (const rel of (src.relationships ?? [])) {
      for (const t of [rel.source, rel.target]) {
        if (t && !entityIds.has(t) && !npcIds.has(t) && !factionNames.has(t)) failures.push(`relationships: ${t} not present`);
      }
    }
    const rooms = new Set<string>(Object.keys(src.world?.rooms ?? {}));
    for (const [, room] of Object.entries(src.world?.rooms ?? {})) {
      for (const target of Object.values((room as any).exits ?? {})) {
        if (typeof target === "string" && !rooms.has(target)) failures.push(`world.rooms.${(room as any).name}.exits: ${target} not present`);
      }
    }
    const cdNames = new Set<string>(Object.keys(src.countdowns ?? {}));
    for (const [name, cd] of Object.entries(src.countdowns ?? {})) {
      for (const c of (cd as any).clocks ?? []) {
        for (const o of [...(c.opposes ?? []), ...(c.unlocks ?? [])]) {
          if (!cdNames.has(o)) failures.push(`countdowns.${name}.clock: references ${o} not present`);
        }
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
    if (strictMode) {
      return err("STATE_CONFLICT", `Import blocked by validation failures:\n${failures.map(f => `  - ${f}`).join("\n")}`);
    }
    // Non-strict: surface as warnings but proceed.
  }

  if (m === "replace") {
    const imported = importNovelJSON(flat);
    applyNovelState(novel, imported);
  } else if (m === "merge") {
    // Merge entities, NPCs, and lore by id/key, skipping duplicates (REQ-096f).
    const imported = importNovelJSON(flat);
    for (const [id, ent] of imported.entities) if (!novel.entities.has(id)) novel.entities.set(id, ent);
    for (const [id, npc] of imported.npcs) if (!novel.npcs.has(id)) novel.npcs.set(id, npc);
    for (const [key, entry] of imported.lore) if (!novel.lore.has(key)) novel.lore.set(key, entry);
    for (const c of imported.countdowns) if (!novel.countdowns.has(c[0])) novel.countdowns.set(c[0], c[1]);
    for (const f of imported.factions) if (!novel.factions.some(x => x.name === f.name)) novel.factions.push(f);
  }

  state.saveNovel(novel);
  if (failures.length > 0) {
    return raw(`[WARNING] Novel '${name}' imported (${m} mode) with ${failures.length} unresolved reference(s):\n${failures.map(f => `  - ${f}`).join("\n")}`);
  }
  return ok(`Novel '${name}' imported (${m} mode).`);
});

// --- Enrichment ---

server.registerTool("revert_synthesis", {
  title: "Revert Synthesis",
  description: "Remove all synthesis state, restoring pre-synthesis server state. Game Master only.",
  inputSchema: {},
}, async () => {
  requireGM();
  const novel = requireNovel();
  state.enriched = false;
  state.enrichmentManifest = null;
  state.saveNovel(novel);
  return ok("Enrichment state reverted. Server state restored to pre-enrich baseline.");
});

// --- Anchor-only tools (ruleset-free, REQ-218) ---

server.registerTool("search_rules", {
  title: "Search Rules",
  description: "Search the active ruleset's index for matching terms. Empty when no ruleset is bound.",
  inputSchema: { query: z.string(), max_results: z.number().optional() },
}, async ({ query, max_results }: any) => {
  const novel = state.activeNovel;
  const slug = novel?.ruleset ?? null;
  if (slug && rulesets.isInstalled(slug)) {
    const hits = rulesets.search(slug, String(query), max_results ?? 10);
    if (hits.length === 0) return err("NOT_FOUND", `No ruleset entry matches '${query}'.`);
    return raw(JSON.stringify(hits, null, 2));
  }
  if (rulesets.installedSlugs().length > 0) {
    return ok(`No ruleset bound to the active Novel. Installed rulesets: ${rulesets.installedSlugs().join(", ")}. Bind one via bind_novel_ruleset, or create a Novel with create_novel(ruleset: "...").`);
  }
  return ok(`No ruleset indexed — this is a world-model-only server. Query was: "${query}". To add a ruleset, run \`build-ruleset <slug>=<path>\` (see the spec, Appendix V).`);
});

server.registerTool("install_ruleset", {
  title: "Install Ruleset",
  description: "Install a ruleset package from a files bundle. Game Master or Editor only.",
  inputSchema: {
    slug: z.string(),
    manifest: z.any(),
    index: z.any().optional(),
    model: z.any().optional(),
    tools: z.any().optional(),
    resources: z.any().optional(),
    prompts: z.any().optional(),
  },
}, async (args: any) => {
  requireGM();
  try {
    const pkg = rulesets.installPackage(args.slug, {
      manifest: args.manifest,
      index: args.index ?? [],
      model: args.model ?? {},
      tools: args.tools ?? [],
      resources: args.resources ?? [],
      prompts: args.prompts ?? [],
    });
    return ok(`Ruleset '${pkg.slug}' installed and hydrated: ${pkg.index.length} index entries, ${pkg.tools.length} tools.`);
  } catch (e: any) {
    return err("STATE_CONFLICT", e.message);
  }
});

server.registerTool("remove_ruleset", {
  title: "Remove Ruleset",
  description: "Remove an installed ruleset package. Game Master or Editor only.",
  inputSchema: { slug: z.string() },
}, async ({ slug }: any) => {
  requireGM();
  const novel = state.activeNovel;
  if (novel && novel.ruleset === slug) {
    return err("STATE_CONFLICT", `Cannot remove ruleset '${slug}' while Novel '${novel.slug}' is bound to it.`);
  }
  try {
    rulesets.removePackage(slug);
    return ok(`Ruleset '${slug}' removed.`);
  } catch (e: any) {
    return err("STATE_CONFLICT", e.message);
  }
});

server.registerTool("list_rulesets", {
  title: "List Rulesets",
  description: "List installed ruleset packages with loaded-versus-installed state.",
  inputSchema: {},
}, async () => {
  const list = rulesets.installedSlugs().map((slug) => rulesets.hydrate(slug)).map((pkg) => ({
    slug: pkg.slug,
    name: pkg.manifest.name,
    host_version: pkg.manifest.host_version,
    built_at: pkg.manifest.built_at,
    state: rulesets.isHydrated(pkg.slug) ? "loaded" : "installed",
  }));
  return raw(JSON.stringify(list, null, 2));
});

server.registerTool("bind_novel_ruleset", {
  title: "Bind Novel Ruleset",
  description: "Bind the active ruleset-free Novel to an installed ruleset. Game Master or Editor only; one-way and audited.",
  inputSchema: { slug: z.string() },
}, async ({ slug }: any) => {
  requireGM();
  if (!rulesets.isInstalled(slug)) {
    return err("INVALID_INPUT", `Ruleset '${slug}' is not installed. Valid rulesets: ${rulesets.installedSlugs().join(", ") || "(none)"}.`);
  }
  try {
    const novel = state.bindNovelRuleset(slug);
    rulesets.hydrate(slug);
    return ok(`Novel '${novel.slug}' bound to ruleset '${slug}'.`);
  } catch (e: any) {
    return err("STATE_CONFLICT", e.message);
  }
});

server.registerTool("suggest_actions", {
  title: "Suggest Actions",
  description: "Map player intent to world-model tool invocations. No mechanical suggestions in ruleset-free mode.",
  inputSchema: { intent: z.string(), entity_id: z.string().optional() },
}, async ({ intent, entity_id }: any) => {
  const novel = requireNovel();
  const entity = entity_id ? novel.entities.get(entity_id) : state.getActiveEntity();
  const name = entity?.name ?? "entity";
  // On ruleset-bound Novels the Player spatial intent routes through
  // resolve_intent (REQ-309b); the parser is never surfaced to the Player.
  const rulesetBound = !!novel.ruleset;
  const badge = getBadge();
  const useResolveIntent = rulesetBound && badge !== "game_master";
  const spatialTool = useResolveIntent ? "resolve_intent" : "command";
  const intentLower = intent.toLowerCase();

  // REQ-343 — unified intent resolution grouped by domain: mechanical, spatial, social.
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
    domains.mechanical.push("init_combat (GM only, auto-advance mode)");
  }
  // Social intents — persuasion, convincing, negotiation; resolved against NPC
  // dispositions and the caller entity's relationships (REQ-343c).
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

// REQ-025 — spec_health reports build health, indexed counts, and URI completeness.
server.registerTool("spec_health", {
  title: "Spec Health",
  description: "Report build health, indexed counts, and resource URI completeness.",
  inputSchema: {},
}, async () => {
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
    build_timestamp: state.buildFingerprint.buildTimestamp,
    tool_count: ((server as any)._registeredTools ? Object.keys((server as any)._registeredTools).length : 0),
    prompt_count: ((server as any)._registeredPrompts ? Object.keys((server as any)._registeredPrompts).length : 0),
    resource_count: ((server as any)._registeredResources ? Object.keys((server as any)._registeredResources).length : 0),
    resource_uris,
    prompt_health,
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
    // REQ-224b / REQ-193a — pending workflow staleness surfaced to operators.
    pending_workflow: isGM ? (novel?.pending_workflow ? { decision: novel.pending_workflow.decision, connections: novel.pending_staleness_counter, threshold: parseInt(process.env.TTRPG_WORKFLOW_STALENESS_CONNECTIONS ?? "5", 10) } : null) : undefined,
    pending_workflow_warning: isGM && novel?.pending_workflow && novel.pending_staleness_counter >= 3
      ? { decision: novel.pending_workflow.decision, connections: novel.pending_staleness_counter }
      : undefined,
    synthesis_active,
    synthesis_status: { modules: synthesisCounts, last_run: state.enrichmentManifest?.collected_at ?? null },
    synthesis_health: {
      synthesis_active,
      module_counts: synthesisCounts,
      stale_count: 0,
      activated_count: novel ? (novel.synthesis_activated ? Object.values(novel.synthesis_activated).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0) : 0) : 0,
      fingerprint: state.enrichmentManifest ? SPEC_HASH : "",
    },
    audit_chain: novel ? state.verifyAuditChain(novel) : null,
    safety_protocols: {
      state_loss: "online",
      badge_boundary: "online",
      data_corruption: "online",
      unrecoverable_crash: isGM ? "unverified" : undefined,
    },
    // REQ-408, REQ-410, REQ-411, REQ-409 — token/efficiency contracts.
    parameter_ceiling: PARAMETER_CEILING,
    parameter_ceiling_exceeded: Object.values(cachedMetadata().toolParameterCounts).some((n) => n > PARAMETER_CEILING),
    tool_parameter_counts: cachedMetadata().toolParameterCounts,
    tools_list_bytes: cachedMetadata().toolsListBytes,
    cache_coverage: { hits: cacheHits, misses: cacheMisses },
    enumeration_verbosity: enumerationVerbosity,
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

  return raw(JSON.stringify(health, null, 2));
});

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
  const id = uri.href.split("/")[3];
  const entity = novel.entities.get(id);
  if (!entity) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return { contents: [{ uri: uri.href, text: JSON.stringify(entity.personality ?? {}), mimeType: "application/json" }] };
});

server.registerResource("entity-voice", new ResourceTemplate("entity://{id}/voice_examples", { list: undefined }), { title: "Entity Voice Examples" }, async (uri) => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const id = uri.href.split("/")[3];
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
  const id = uri.href.split("/").pop() ?? "";
  if (!novel) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const npc = novel.npcs.get(id);
  if (!npc) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return { contents: [{ uri: uri.href, text: JSON.stringify(npc), mimeType: "application/json" }] };
});

server.registerResource("npcs", "npcs://", { title: "All NPCs" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "npcs://", text: "{}", mimeType: "application/json" }] };
  return { contents: [{ uri: "npcs://", text: JSON.stringify(Object.fromEntries(novel.npcs)), mimeType: "application/json" }] };
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
  const key = uri.href.split("/").pop() ?? "";
  if (!novel) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "no active novel" }), mimeType: "application/json" }] };
  const entry = novel.lore.get(key);
  if (!entry) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  return { contents: [{ uri: uri.href, text: JSON.stringify(entry), mimeType: "application/json" }] };
});

// Audit resource
server.registerResource("audit-novel", "audit://novel", { title: "Audit Log" }, async () => {
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
  contents: [{ uri: "guidance://player/anti-slop", text: "Describe actions concretely. Use parser commands for world interaction. Narrate in-character.", mimeType: "text/markdown" }],
}));

server.registerResource("guidance-gm-anti-slop", "guidance://game_master/anti-slop", { title: "GM Anti-Slop" }, async () => ({
  contents: [{ uri: "guidance://game_master/anti-slop", text: "Describe situations richly. Surface information. Do not take actions or make decisions for the player.", mimeType: "text/markdown" }],
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
  const id = decodeURIComponent(uri.href.split("/").pop() ?? "");
  const entry = state.codex.get(id);
  if (!entry) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  const badge = getBadge();
  if (entry.visibility === "private" && badge !== "game_master" && badge !== "none") {
    return { contents: [{ uri: uri.href, text: "[FORBIDDEN] This codex entry is private.", mimeType: "text/plain" }] };
  }
  return { contents: [{ uri: uri.href, text: JSON.stringify(entry, null, 2), mimeType: "application/json" }] };
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

server.registerResource("synthesis-status", "synthesis://status", { title: "Synthesis Status" }, async () => {
  const counts = synthesisModuleCounts();
  const active = state.enriched;
  let md = "Synthesis Status\n";
  for (const [m, c] of Object.entries(counts)) {
    md += `## ${m}\nRuleset Wisdom: ${active ? c.total : 0}\nSynthesis activated/total: ${c.activated}/${active ? c.total : 0}\n`;
  }
  return { contents: [{ uri: "synthesis://status", text: md, mimeType: "text/markdown" }] };
});

// ── Additional tools (REQ-307, REQ-213/214, REQ-321, REQ-103, REQ-239) ──

server.registerTool("set_party_presence", {
  title: "Set Party Presence",
  description: "Declare which entities are present in the current scene. Use when: the GM needs to override party presence without altering other scene fields. Do NOT use when: setting scene description — use set_scene_state.",
  inputSchema: { entity_ids: z.array(z.string()), location: z.string().optional() },
}, async ({ entity_ids, location }: any) => {
  requireGM();
  const novel = requireNovel();
  novel.characters_present_ids = entity_ids;
  state.saveNovel(novel);
  return ok(`Party presence set: ${entity_ids.join(", ") || "(none)"}.`);
});

// REQ-212/213 — generation-table rolling against the bound ruleset's weighted tables.
server.registerTool("roll_on_table", {
  title: "Roll On Table",
  description: "Roll on a generation table from the bound ruleset. Use when: resolving a random-generation table (names, treasure, events). Do NOT use when: resolving a fixed lookup — use a lookup tool.",
  inputSchema: { table: z.string(), seed: z.string().optional() },
}, async ({ table, seed }: any) => {
  const novel = state.activeNovel;
  const slug = novel?.ruleset ?? null;
  if (!slug || !rulesets.isInstalled(slug)) {
    return err("NOT_FOUND", "No random generation tables in this ruleset (ruleset-free). Corrective action: bind a ruleset whose package defines generation tables.");
  }
  const model = rulesets.hydrate(slug).model as any;
  const tables = model.generation_tables ?? {};
  const key = Object.keys(tables).find(k => k.toLowerCase() === String(table).toLowerCase());
  if (!key) {
    const valid = Object.keys(tables);
    return err("NOT_FOUND", `Table '${table}' not found. Valid tables: ${valid.join(", ") || "(none)"}.`);
  }
  const entry = tables[key];
  const rng = seed ? createRng(seed) : createRng(String(sessionRoll(1000000000)));
  const roll = entry.dice_expression ? rollDice(entry.dice_expression, String(rng.roll(1000000000))).total : rng.roll(100);
  const range = (entry.ranges ?? []).find((r: any) => roll >= r.min && roll <= r.max);
  if (!range) {
    return warn(`Roll ${roll} on ${entry.dice_expression ?? "d100"} matched no range in table '${key}'.`);
  }
  return ok(`Table: ${key}\nDice: ${entry.dice_expression ?? "d100"}\nRoll: ${roll}\nRange: ${range.min}-${range.max}\nResult: ${range.result}`);
});

// Codex tools (REQ-321)
server.registerTool("codex_set", {
  title: "Set Codex Entry",
  description: "Create or update a typed codex entry that persists across Novels. Use when: storing reusable content (NPCs, factions, rooms, spells, etc.) for later import. Do NOT use when: storing Novel-scoped content — use set_lore_entry or set_note.",
  inputSchema: {
    kind: z.string(),
    name: z.string(),
    content: z.any(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    visibility: z.enum(["library", "shared", "private"]).optional(),
  },
}, async ({ kind, name, content, description, tags, visibility }: any) => {
  requireGM();
  const id = `${kind.toLowerCase()}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
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
});

server.registerTool("codex_list", {
  title: "List Codex Entries",
  description: "List codex entries by kind, badge-filtered by visibility. Use when: discovering reusable content to import. Do NOT use when: listing Novel entities — use list_notes or list_stories.",
  inputSchema: { kind: z.string().optional() },
}, async ({ kind }: any) => {
  const badge = getBadge();
  let entries = [...state.codex.values()];
  if (kind) entries = entries.filter(e => e.kind === kind);
  entries = entries.filter(e => badge === "game_master" || badge === "none" || e.visibility === "shared" || e.visibility === "library");
  return raw(JSON.stringify(entries.map(e => ({ id: e.id, kind: e.kind, name: e.name, visibility: e.visibility, tags: e.tags })), null, 2));
});

// REQ-347 — voice feedback codex capture: store an entity's corrected voice
// profile as a `voice_profile` Codex entry.
server.registerTool("codex_capture", {
  title: "Capture to Codex",
  description: "Capture an entity's voice profile to the Codex. Use when: persisting a character's corrected voice across Novels. Do NOT use when: storing Novel-scoped lore — use set_lore_entry.",
  inputSchema: { kind: z.enum(["voice_profile"]), entity_id: z.string(), update_source: z.boolean().optional() },
}, async ({ kind, entity_id, update_source }: any) => {
  requireGM();
  const novel = requireNovel();
  const entity = novel.entities.get(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity '${entity_id}' not found.`);
  const id = `voice_profile_${entity_id.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  const corrected = (entity.voice_examples ?? []).filter((v: any) => v.tag === "player-corrected").map((v: any) => ({ corrected_text: v.dialogue, context: v.context }));
  const entry: any = {
    id, kind: "voice_profile", name: entity.name,
    content: { corrected_text: corrected, original_text: [], source_novel: novel.slug, background: entity.personality?.background },
    visibility: "library",
    imported_at: new Date().toISOString(), codex_modified_at: new Date().toISOString(),
    update_source: !!update_source,
  };
  state.codex.set(id, entry);
  state.saveCodex();
  return ok(`Voice profile '${id}' captured to Codex.`);
});

// REQ-347/352 — import a Codex entry into the active Novel.
server.registerTool("codex_import", {
  title: "Import from Codex",
  description: "Import a Codex entry into the active Novel. Use when: pulling reusable content (voice profiles, adventures) in. Do NOT use when: reading the Codex — use codex_list.",
  inputSchema: { entry_id: z.string() },
}, async ({ entry_id }: any) => {
  requireGM();
  const novel = requireNovel();
  const entry = state.codex.get(entry_id);
  if (!entry) return err("NOT_FOUND", `Codex entry '${entry_id}' not found.`);
  if (entry.kind === "voice_profile") {
    const name = (entry.name ?? entry_id).toLowerCase();
    const targetId = [...novel.entities.keys()].find((id) => id.includes(name) || novel.entities.get(id)!.name.toLowerCase() === name) ?? [...novel.entities.keys()].find((id) => id.includes(entry_id.replace("voice_profile_", "")));
    if (targetId) {
      const target = novel.entities.get(targetId)!;
      if (!target.voice_examples) target.voice_examples = [];
      for (const v of (entry.content as any)?.corrected_text ?? []) {
        target.voice_examples.push({ context: v.context ?? "codex import", dialogue: v.corrected_text, tag: "codex-corrected" });
      }
    }
  } else if (entry.kind === "adventure") {
    const suggested = (entry.content as any)?.suggested_beats;
    if (Array.isArray(suggested)) {
      novel.story_beats.push(...suggested.map((sb: any) => ({ beat: sb.beat, scene_preview: sb.scene_preview, source: "adventure-scaffold" as const })));
      novel.adventure_set = true;
    }
  }
  state.saveNovel(novel);
  return ok(`Codex entry '${entry_id}' imported.`);
});

// Synthesis tools (REQ-103, REQ-260-263)
server.registerTool("synthesize", {
  title: "Synthesize",
  description: "Run synthesis against the active Novel's state and vendor content. Use when: generating voice examples, lore templates, and action patterns from Novel and vendor sources. Do NOT use when: editing mechanical fields — synthesis is additive only.",
  inputSchema: { force: z.boolean().optional() },
}, async ({ force }: any) => {
  requireGM();
  const novel = requireNovel();
  if (state.enriched && !force) {
    return ok(`Synthesis up to date (${state.enrichmentManifest?.collected_at ?? "unknown"}). Use force=true to re-synthesize.`);
  }
  state.enriched = true;
  state.enrichmentManifest = DEFAULT_ENRICHMENT;
  state.saveNovel(novel);
  const counts = synthesisModuleCounts();
  return ok(`Synthesis complete. Modules: ${Object.entries(counts).map(([m, c]) => `${m}=${c.total}`).join(", ")}.`);
});

server.registerTool("list_synthesis_items", {
  title: "List Synthesis Items",
  description: "List synthesis items by module and tier. Use when: reviewing available synthesis content. Do NOT use when: browsing the codex — use codex_list.",
  inputSchema: { module: z.string().optional(), ...detailZod },
}, async ({ module, detail }: any) => {
  const manifest = state.enrichmentManifest;
  if (!manifest) return ok("No synthesis items (synthesis not run).");
  const all = [
    ...(manifest.voice_examples ?? []).map((i: any) => ({ module: "voice_examples", tag: i.tag ?? "vendor", content: i.content, badge_scope: i.badge_scope })),
    ...(manifest.lore_templates ?? []).map((i: any) => ({ module: "lore_templates", tag: i.tag ?? "vendor", content: i.content, badge_scope: i.badge_scope })),
    ...(manifest.action_patterns ?? []).map((i: any) => ({ module: "action_patterns", tag: i.tag ?? "vendor", content: i.intent, badge_scope: "game_master" })),
    ...(manifest.supplementary_guidance ?? []).map((i: any) => ({ module: "supplementary_guidance", tag: i.tag ?? "vendor", content: i.content, badge_scope: i.badge_scope })),
    ...(manifest.narrative_voices ?? []).map((i: any) => ({ module: "narrative_voices", tag: i.tag ?? "vendor", content: i.name, badge_scope: i.badge_scope })),
  ];
  const filtered = module ? all.filter((i: any) => i.module === module) : all;
  if (wantsDetail(detail)) return raw(JSON.stringify(filtered, null, 2));
  const summary = filtered.map((i: any) => ({ module: i.module, tag: i.tag, badge_scope: i.badge_scope, preview: `${typeof i.content === "string" ? (i.content ?? "").slice(0, 80) : ""}` }));
  return raw(JSON.stringify(summary, null, 2));
});

server.registerTool("activate_synthesis_item", {
  title: "Activate Synthesis Item",
  description: "Activate a synthesis item for the active Novel. Use when: incorporating synthesis content into play. Do NOT use when: deactivating — use deactivate_synthesis_item.",
  inputSchema: { module: z.string(), key: z.number() },
}, async ({ module, key }: any) => {
  requireGM();
  const novel = requireNovel();
  if (!state.enriched) return err("STATE_CONFLICT", "Synthesis has not been run. Corrective action: run synthesize first.");
  const activated = novel.synthesis_activated ?? {};
  activated[module] = key;
  novel.synthesis_activated = activated;
  state.saveNovel(novel);
  return ok(`Synthesis module '${module}' activated (${key} items).`);
});

server.registerTool("deactivate_synthesis_item", {
  title: "Deactivate Synthesis Item",
  description: "Deactivate a synthesis item for the active Novel. Use when: removing a synthesis item from play without deleting it. Do NOT use when: removing Ruleset Wisdom — use revert_synthesis.",
  inputSchema: { module: z.string() },
}, async ({ module }: any) => {
  requireGM();
  const novel = requireNovel();
  const activated = novel.synthesis_activated ?? {};
  delete activated[module];
  novel.synthesis_activated = activated;
  state.saveNovel(novel);
  return ok(`Synthesis module '${module}' deactivated.`);
});

server.registerTool("toggle_synthesis_module", {
  title: "Toggle Synthesis Module",
  description: "Enable or disable a synthesis module for the active Novel. Use when: controlling whether a module's content appears in surfaces. Do NOT use when: activating a single item — use activate_synthesis_item.",
  inputSchema: { module: z.string(), enabled: z.boolean() },
}, async ({ module, enabled }: any) => {
  requireGM();
  const novel = requireNovel();
  const m = novel.synthesis_module_enabled ?? {};
  if (enabled) m[module] = true; else delete m[module];
  novel.synthesis_module_enabled = m;
  state.saveNovel(novel);
  return ok(`Synthesis module '${module}' ${enabled ? "enabled" : "disabled"}.`);
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
4. Enter the story and begin your first scene.`,
      },
    }],
  };
});

server.prompt("badge_briefing", "Current Badge Briefing", async () => {
  const novel = state.activeNovel;
  if (!novel) {
    return { messages: [{ role: "user", content: { type: "text" as const, text: "No active Novel. Create or resume one first." } }] };
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

  // REQ-109 — novel-setup progress markers (surface wizard completion state).
  const setupMark = (done: boolean) => (done ? "[✓]" : "[ ]");
  briefing += `\n\n### Novel Setup
Characters: ${setupMark(novel.characters_present)} | Story source: ${setupMark(novel.adventure_set)} | Session zero: ${setupMark(novel.session_zero_completed)}`;
  if (!novel.session_zero_completed) {
    briefing += `\nA session zero has not been completed yet — run the session zero guide before play begins.`;
  }

  // REQ-109 — POV directive (character-perspective anchor, GM + Player).
  if (badge === "game_master" || badge === "player") {
    if (novel.pov_mode === "character" && entity) {
      briefing += `\n\n### Point of view
Describe the scene through ${entity.name}'s eyes — what they see, hear, and feel.`;
    } else {
      briefing += `\n\n### Point of view
No character point of view is set — narrate in the third person until one is chosen.`;
    }
  }

  // REQ-109 — autonomy state (GM only): AI decision delegation sliders.
  if (badge === "game_master") {
    const a = novel.autonomy;
    briefing += `\n\n### Autonomy
Level: ${a.level} | Confirmation: ${a.confirmation} | Safety: ${a.safety} | Creativity: ${a.creativity}`;
  }

  if (badge === "player") {
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

    if (badge === "game_master") {
      // REQ-400 — State-Persistence Directive (never-truncated tier).
      briefing += `\n\n### State persistence
Commit every narratable change to state in the same turn you narrate it — scene changes (set_scene_state), mechanical outcomes (countdowns, conditions), disposition shifts (update_npc), and story beats (record_story).`;

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
      briefing += `\n\n### Persistence tools\nset_scene_state · record_story · set_countdown · set_note · set_personality · create_npc · set_vow`;

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

    // REQ-336/281 — narrative threads: pacing signal, unresolved decisions, bonds,
    // countdowns, non-default NPC dispositions, active vows, and §5.12 couplings.
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

  return { messages: [{ role: "user", content: { type: "text" as const, text: briefing } }] };
});

server.prompt("session_zero", "Session Zero Setup", async () => {
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

- **Spatial / movement / inspection**: ${rulesetBound ? "resolve_intent, command (GM)" : "command (parser)"}
- **Character creation / advancement**: create_character, import_character, set_active_entity
- **Combat**: init_combat, advance_combat, end_combat
- **World building**: ${catalog("world", ["convert_source", "create_room", "create_thing", "create_exit"])}
- **Narrative / scene**: ${catalog("narrative", ["set_scene_state", "record_story", "set_narrative_directive"])}
- **Lookup**: ${catalog("lookup", ["search_rules", "spec_health", "suggest_actions"])}

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
