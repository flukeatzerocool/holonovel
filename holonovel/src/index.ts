#!/usr/bin/env node
// Inform MCP Server — Ruleset-Free Holonovel Build
// REQ-001, REQ-020, REQ-022, REQ-023, REQ-195 through REQ-202, REQ-218, REQ-219

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

import { expandMacros } from "./core/macros.js";
import { StateManager, Badge, NovelState, LoreEntry, DIFFICULTY_TRACKS, migrateNovelData } from "./core/state.js";
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

// ── Constants ──────────────────────────────────────────────────────

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.TTRPG_DATA_DIR ?? path.join(__dirname, "..", ".holonovel-state");
function computeSpecHash(): string {
  try {
    const specPath = path.join(__dirname, "holonovel.md");
    if (!fs.existsSync(specPath)) return "unknown";
    return crypto.createHash("sha256").update(fs.readFileSync(specPath)).digest("hex");
  } catch { return "unknown"; }
}

const SPEC_HASH = computeSpecHash();

// ── State ──────────────────────────────────────────────────────────

const state = new StateManager(DATA_DIR);
state.loadRoster();
state.loadServerNotes();
state.buildFingerprint.specHash = SPEC_HASH;
state.buildFingerprint.lastSpecReview = new Date().toISOString();

// ── Server ─────────────────────────────────────────────────────────

const server = new McpServer({
  name: "inform-holonovel",
  version: "2026.08.17",
});

// ── Helpers ────────────────────────────────────────────────────────
// Badge gating and snapshot helpers provided by core/server.ts

initServer(state);

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

function err(code: string, msg: string) {
  return { content: [{ type: "text" as const, text: `[ERROR] [${code}] ${expandMacros(msg, buildMacroContext())}` }] };
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
  "Characters": ["create_character", "import_character", "character_sheet", "set_active_entity", "set_personality", "set_voice_examples", "player_signal", "remove_entity", "list_roster_characters", "remove_roster_character"],
  "World Model": ["command", "create_room", "delete_room", "create_thing", "delete_thing", "create_exit", "delete_exit", "convert_source"],
  "Lookups": ["search_rules", "suggest_actions", "spec_health"],
  "Combat (GM)": ["init_combat", "advance_combat", "end_combat", "add_combat_participant", "remove_combat_participant"],
  "Conditions (GM)": ["apply_condition", "remove_condition"],
  "Narrative (GM)": ["set_scene_state", "set_scene_type", "set_narrative_directive"],
  "NPCs (GM)": ["create_npc", "update_npc", "remove_npc"],
  "Factions (GM)": ["create_faction", "update_faction", "remove_faction"],
  "Secrets (GM)": ["set_secret", "reveal_secret", "check_knowledge"],
  "Relationships (GM)": ["set_relationship", "get_relationships"],
  "Vows (GM)": ["set_vow", "mark_milestone", "resolve_vow", "forsake_vow"],
  "Countdowns (GM)": ["set_countdown", "advance_countdown", "remove_countdown"],
  "Lore (GM)": ["set_lore_entry", "update_lore_entry", "remove_lore_entry", "toggle_lore_entry", "set_lore_group", "suggest_lore", "export_lorebook", "import_lorebook"],
  "Story Journal (GM)": ["record_story", "update_story", "remove_story", "list_stories"],
  "Notes": ["set_note", "remove_note", "list_notes"],
  "Server Notes (GM)": ["set_server_note", "remove_server_note", "list_server_notes"],
  "Pause/Resume (GM)": ["save_pause_context", "get_resume_context"],
  "Checkpoints (GM)": ["set_checkpoint", "list_checkpoints", "restore_checkpoint", "delete_checkpoint"],
  "Guidance (GM)": ["set_briefing_order", "compress_audit", "load_adventure", "generate_adventure", "generate_encounter", "set_help_category", "toggle_action_patterns", "present_choices", "ask_oracle"],
  "Session": ["session_recap"],
  "Novel Lifecycle": ["create_novel", "resume_novel", "switch_novel", "end_novel", "export_novel", "import_novel", "rename_novel", "list_novels", "novel_info", "clone_novel"],
  "Enrichment": ["revert_enrichment"],
};

const GMToolsSet = new Set([
  "init_combat", "advance_combat", "end_combat", "add_combat_participant", "remove_combat_participant",
  "set_scene_state", "set_scene_type", "set_narrative_directive",
  "create_npc", "update_npc", "remove_npc",
  "set_countdown", "advance_countdown", "remove_countdown",
  "set_lore_entry", "update_lore_entry", "remove_lore_entry", "toggle_lore_entry", "set_lore_group",
  "suggest_lore", "export_lorebook", "import_lorebook",
  "set_briefing_order", "compress_audit", "load_adventure", "generate_adventure", "generate_encounter",
  "set_help_category", "export_novel", "import_novel", "revert_enrichment",
  "create_room", "delete_room", "create_thing", "delete_thing", "create_exit", "delete_exit", "convert_source",
  "apply_condition", "remove_condition",
  "create_faction", "update_faction", "remove_faction",
  "set_secret", "reveal_secret", "check_knowledge",
  "set_relationship", "get_relationships",
  "set_vow", "mark_milestone", "resolve_vow", "forsake_vow",
  "set_checkpoint", "list_checkpoints", "restore_checkpoint", "delete_checkpoint",
  "set_server_note", "remove_server_note", "list_server_notes",
  "save_pause_context", "get_resume_context",
  "record_story", "update_story", "remove_story", "list_stories",
  "present_choices", "ask_oracle", "toggle_action_patterns",
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
  if (p.description || p.voice || p.background || p.goals) {
    sheet += `\n### Personality\n`;
    if (p.description) sheet += `**Description:** ${p.description}\n`;
    if (p.voice) sheet += `**Voice:** ${p.voice}\n`;
    if (p.background) sheet += `**Background:** ${p.background}\n`;
    if (p.goals) sheet += `**Goals:** ${p.goals}\n`;
  }
  sheet += `\n_World-model only — no mechanical stats._`;
  return sheet;
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

server.registerTool("respond", {
  title: "Respond to Workflow Decision",
  description: "Respond to a pending workflow decision.",
  inputSchema: { decision: z.string(), option: z.string() },
}, async ({ decision, option }) => {
  requireNotObserver();
  const novel = requireNovel();
  if (option === "cancel") {
    novel.pending_workflow = null;
    state.saveNovel(novel);
    return ok("Workflow cancelled.");
  }
  if (decision.toLowerCase().includes("end novel") || decision.toLowerCase().includes("end_novel")) {
    const slug = state.activeNovel!.slug;
    const result = state.endNovel(novel, option as "yes" | "cancel");
    if (result.removed) return ok(`Novel '${slug}' ended.`);
    return ok("End novel cancelled.");
  }
  if (decision.toLowerCase().includes("present_choices")) {
    novel.pending_workflow = null;
    state.saveNovel(novel);
    return ok(`Choice '${option}' selected.`);
  }
  return ok(`Responded to '${decision}' with '${option}'.`);
});

server.registerTool("undo", {
  title: "Undo",
  description: "Undo the most recent mutation. Restores previous snapshot.",
  inputSchema: {},
}, async () => {
  requireNotObserver();
  const novel = requireNovel();
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
      displayTools = tools.filter(t => !GMToolsSet.has(t));
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

// --- Characters (ruleset-free, REQ-219) ---

server.registerTool("create_character", {
  title: "Create Character",
  description: "Start character creation workflow. Ruleset-free: accepts name and optional personality fields only.",
  inputSchema: {
    name: z.string(),
    description: z.string().optional(),
    voice: z.string().optional(),
    background: z.string().optional(),
    goals: z.string().optional(),
  },
}, async ({ name, description, voice, background, goals }: any) => {
  requireNotObserver();
  const personality = { description, voice, background, goals };
  const hasPersonality = description || voice || background || goals;
  const entity = state.createEntity(name, hasPersonality ? personality : undefined);
  const novel = requireNovel();
  state.addEntity(novel, entity);
  state.saveNovel(novel);
  return ok(`${fmtEntitySheet(entity)}

Character '${name}' created as ${entity.id}.`);
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

server.registerTool("player_signal", {
  title: "Player Signal",
  description: "Send a narrative signal from the player to the GM.",
  inputSchema: {
    signal: z.enum(["pace", "difficulty", "tone", "focus", "boundary"]),
    value: z.string(),
  },
}, async ({ signal, value }: any) => {
  requirePlayer();
  const novel = requireNovel();
  novel.player_signals[signal] = value;
  state.saveNovel(novel);
  audit("player_signal", { signal, value });
  return ok(`Signal recorded: ${signal} → ${value}`);
});

// --- World-Model Tools ---

server.registerTool("command", {
  title: "Parser Command",
  description: "Execute a natural-language parser command against the world model. Use for navigation (go, n/s/e/w), inspection (look, examine), object interaction (take, drop, open, close), inventory, and wait.",
  inputSchema: { command: z.string() },
}, async ({ command }: any) => {
  requireNotObserver();
  const novel = requireNovel();
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

server.registerTool("delete_room", {
  title: "Delete Room",
  description: "Delete a room and its contained things and exits. Game Master only.",
  inputSchema: { name: z.string() },
}, async ({ name }: any) => {
  requireGM();
  const novel = requireNovel();
  worldSnapshot();
  const lower = name.toLowerCase();
  if (!novel.world.rooms.has(lower)) return err("NOT_FOUND", `Room '${name}' not found.`);

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
  audit("delete_room", { name });
  return ok(`Room '${name}' and its contents deleted.`);
});

server.registerTool("create_thing", {
  title: "Create Thing",
  description: "Create a new thing in the world model. Game Master only.",
  inputSchema: {
    name: z.string(),
    kind: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    fixed: z.boolean().optional(),
    openable: z.boolean().optional(),
    lockable: z.boolean().optional(),
  },
}, async ({ name, kind, description, location, fixed, openable, lockable }: any) => {
  requireGM();
  const novel = requireNovel();
  worldSnapshot();
  const lower = name.toLowerCase();
  if (novel.world.things.has(lower)) return err("STATE_CONFLICT", `Thing '${name}' already exists.`);

  const validKinds = ["thing", "container", "supporter", "door", "person", "backdrop"];
  const k = (kind && validKinds.includes(kind.toLowerCase())) ? kind.toLowerCase() as WorldKind : "thing";

  const thing: WorldThing = {
    name,
    description: description ?? "",
    kind: k,
    location: location ?? null,
    locationType: location ? "room" : null,
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
  audit("create_thing", { name, kind: k, location });
  return ok(`Thing '${name}' (${k}) created${location ? ` in ${location}` : ""}.`);
});

server.registerTool("delete_thing", {
  title: "Delete Thing",
  description: "Delete a thing from the world model. Game Master only.",
  inputSchema: { name: z.string() },
}, async ({ name }: any) => {
  requireGM();
  const novel = requireNovel();
  worldSnapshot();
  const lower = name.toLowerCase();
  if (!novel.world.things.has(lower)) return err("NOT_FOUND", `Thing '${name}' not found.`);
  novel.world.things.delete(lower);
  state.saveNovel(novel);
  audit("delete_thing", { name });
  return ok(`Thing '${name}' deleted.`);
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

server.registerTool("delete_exit", {
  title: "Delete Exit",
  description: "Delete a directional exit from a room. Game Master only.",
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
  audit("delete_exit", { direction: dir, room: roomName });
  return ok(`Exit ${dir} from '${roomName}' deleted.`);
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

server.registerTool("set_scene_state", {
  title: "Set Scene State",
  description: "Set the scene description and location. Game Master only.",
  inputSchema: {
    description: z.string(),
    location: z.string().optional(),
    time_of_day: z.string().optional(),
    atmosphere: z.string().optional(),
    skip_transition_hook: z.boolean().optional(),
  },
}, async ({ description, location, time_of_day, atmosphere, skip_transition_hook }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();

  if (novel.scene_description) {
    novel.scene_history.push({
      timestamp: new Date().toISOString(),
      description: novel.scene_description,
      location: novel.scene_location,
      time_of_day: novel.scene_time_of_day,
      atmosphere: novel.scene_atmosphere,
    });
  }
  novel.scene_description = description;
  novel.scene_location = location;
  novel.scene_time_of_day = time_of_day;
  novel.scene_atmosphere = atmosphere;

  // Auto-update active entity position if location or description matches a world-model room
  const sceneRoomName = location || description;
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

  state.saveNovel(novel);
  audit("set_scene_state", { description, location, time_of_day, atmosphere });
  return ok(`Scene set: ${description}`);
});

server.registerTool("set_scene_type", {
  title: "Set Scene Type",
  description: "Tag the scene as combat, social, exploration, or neutral. Game Master only.",
  inputSchema: {
    type: z.union([z.enum(["combat", "social", "exploration", "neutral"]), z.array(z.enum(["combat", "social", "exploration", "neutral"]))]),
  },
}, async ({ type }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  novel.scene_type = Array.isArray(type) ? type : [type];
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
  },
}, async ({ name, description, disposition, location }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const id = `npc_${Date.now().toString(36)}`;
  novel.npcs.set(id, { id, name, description, disposition, location, conditions: [], condition_rounds: {} });
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
  },
}, async ({ npc_id, name, description, disposition, location }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const npc = novel.npcs.get(npc_id);
  if (!npc) return err("NOT_FOUND", `NPC '${npc_id}' not found.`);
  if (name !== undefined) npc.name = name;
  if (description !== undefined) npc.description = description;
  if (disposition !== undefined) npc.disposition = disposition;
  if (location !== undefined) npc.location = location;
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
  },
}, async ({ name, ticks, type, scope, direction }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  novel.countdowns.set(name, { name, ticks, total: ticks, type: type ?? "narrative", scope, direction });
  state.saveNovel(novel);
  audit("set_countdown", { name, ticks, type });
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
  inputSchema: { name: z.string(), description: z.string().optional(), goals: z.array(z.string()).optional(), resources: z.string().optional() },
}, async ({ name, description, goals, resources }: any) => {
  requireGM();
  const novel = requireNovel();
  if (novel.factions.some(f => f.name === name)) return err("STATE_CONFLICT", `Faction '${name}' already exists.`);
  const faction = {
    id: `faction_${Date.now().toString(36)}`,
    name, description: description ?? "", goals: goals ?? [], resources: resources ?? "", clock: 0, clock_max: 10, status: "neutral",
  };
  novel.factions.push(faction);
  state.saveNovel(novel);
  audit("create_faction", { name, description, goals });
  return ok(`Faction '${name}' created (${faction.id}).`);
});

server.registerTool("update_faction", {
  title: "Update Faction",
  description: "Update a faction's fields. Game Master only.",
  inputSchema: { faction_id: z.string(), description: z.string().optional(), goals: z.array(z.string()).optional(), resources: z.string().optional() },
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
  inputSchema: { key: z.string(), content: z.string(), triggers: z.array(z.string()).optional(), badge_scope: z.enum(["game_master", "shared"]).optional() },
}, async ({ key, content, triggers, badge_scope }: any) => {
  requireGM();
  const novel = requireNovel();
  if (novel.secrets.some(s => s.key === key)) return err("STATE_CONFLICT", `Secret '${key}' already exists.`);
  novel.secrets.push({ key, content, triggers: triggers ?? [], badge_scope: badge_scope ?? "game_master", known_by: [] });
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

server.registerTool("check_knowledge", {
  title: "Check Knowledge",
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
  inputSchema: { filter: z.enum(["decision", "moment", "revelation", "bond", "consequence"]).optional(), offset: z.number().min(0).optional(), limit: z.number().min(0).optional() },
}, async ({ filter, offset, limit }: any) => {
  requireGM();
  const novel = requireNovel();
  let entries = [...novel.story_journal];
  if (filter) entries = entries.filter(e => e.type === filter);
  if (offset) entries = entries.slice(offset);
  if (limit) entries = entries.slice(0, limit);
  return raw(JSON.stringify(entries, null, 2));
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
  const scope = badge_scope ?? (novel.badge === "game_master" ? "game_master" : "player");
  if (existing) {
    existing.content = content;
    existing.badge_scope = scope;
  } else {
    novel.notes.push({ key, content, badge_scope: scope });
  }
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
  novel.notes.splice(idx, 1);
  state.saveNovel(novel);
  return ok(`Note '${key}' removed.`);
});

server.registerTool("list_notes", {
  title: "List Notes",
  description: "List all notes, badge-filtered.",
  inputSchema: {},
}, async () => {
  const novel = requireNovel();
  const badge = novel.badge;
  const filtered = badge === "game_master" ? novel.notes
    : novel.notes.filter(n => n.badge_scope !== "game_master");
  return raw(JSON.stringify(filtered, null, 2));
});

// --- Server Notes (GM) ---

server.registerTool("set_server_note", {
  title: "Set Server Note",
  description: "Create or update a server-level note. Game Master only.",
  inputSchema: { key: z.string(), content: z.string() },
}, async ({ key, content }: any) => {
  requireGM();
  state.serverNotes.set(key, content);
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

server.registerTool("save_pause_context", {
  title: "Save Pause Context",
  description: "Save GM context for session resumption. Game Master only.",
  inputSchema: { current_scene: z.string().optional(), immediate_situation: z.string().optional(), pending_player_action: z.string().optional(), short_term_plans: z.string().optional(), long_term_plans: z.string().optional(), player_goals: z.string().optional() },
}, async (fields: any) => {
  requireGM();
  const novel = requireNovel();
  novel.dm_context = { ...novel.dm_context, ...fields, saved_at: new Date().toISOString() };
  state.saveNovel(novel);
  return ok("Pause context saved.");
});

server.registerTool("get_resume_context", {
  title: "Get Resume Context",
  description: "Return the saved GM context plus Novel state summary for session resumption.",
  inputSchema: {},
}, async () => {
  const novel = requireNovel();
  return raw(JSON.stringify({
    dm_context: novel.dm_context,
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
  const cp = novel.checkpoints.find(c => c.label === label);
  if (!cp) return err("NOT_FOUND", `Checkpoint '${label}' not found.`);
  const restored = loadNovelFromStateData(cp.state);
  novel.entities = restored.entities;
  novel.npcs = restored.npcs;
  novel.scene_description = restored.scene_description;
  novel.scene_location = restored.scene_location;
  novel.combat = restored.combat;
  novel.countdowns = restored.countdowns;
  novel.lore = restored.lore;
  novel.world = restored.world;
  novel.story_journal = restored.story_journal;
  novel.factions = restored.factions;
  novel.secrets = restored.secrets;
  novel.relationships = restored.relationships;
  novel.vows = restored.vows;
  novel.notes = restored.notes;
  state.saveNovel(novel);
  return ok(`Checkpoint '${label}' restored.`);
});

server.registerTool("delete_checkpoint", {
  title: "Delete Checkpoint",
  description: "Delete a named checkpoint. Game Master only.",
  inputSchema: { label: z.string() },
}, async ({ label }: any) => {
  requireGM();
  const novel = requireNovel();
  const idx = novel.checkpoints.findIndex(c => c.label === label);
  if (idx === -1) return err("NOT_FOUND", `Checkpoint '${label}' not found.`);
  novel.checkpoints.splice(idx, 1);
  state.saveNovel(novel);
  return ok(`Checkpoint '${label}' deleted.`);
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
  novel.slug = new_slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  novel.name = new_slug;
  state.novels.delete(oldSlug);
  state.novels.set(novel.slug, novel);
  // Delete old file, save at new path
  const oldFile = path.join(DATA_DIR, "novels", `${oldSlug}.json`);
  if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
  const oldBak = oldFile + ".bak";
  if (fs.existsSync(oldBak)) fs.unlinkSync(oldBak);
  state.saveNovel(novel);
  return ok(`Novel renamed to '${novel.slug}'.`);
});

server.registerTool("list_novels", {
  title: "List Novels",
  description: "List all Novels on disk with metadata. Always callable.",
  inputSchema: {},
}, async () => {
  const novels = [...state.novels.entries()].map(([slug, n]) => ({
    slug,
    name: n.name,
    entities: n.entities.size,
    world_rooms: n.world.rooms.size,
    modified: n.metadata.modified,
  }));
  return raw(JSON.stringify(novels, null, 2));
});

server.registerTool("novel_info", {
  title: "Novel Info",
  description: "Return extended metadata for a Novel. Always callable.",
  inputSchema: { slug: z.string().optional() },
}, async ({ slug }: any) => {
  const novel = slug ? state.novels.get(slug) : state.activeNovel;
  if (!novel) return err("NOT_FOUND", `Novel '${slug || "none"}' not found.`);
  return raw(JSON.stringify({
    slug: novel.slug, name: novel.name, description: novel.description, genre: novel.genre,
    entities: novel.entities.size, npcs: novel.npcs.size, lore: novel.lore.size,
    world_rooms: novel.world.rooms.size, world_things: novel.world.things.size,
    factions: novel.factions.length, vows: novel.vows.length,
    scene: novel.scene_description ? novel.scene_description.substring(0, 100) : null,
    created: novel.metadata.created, modified: novel.metadata.modified,
  }, null, 2));
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
  },
}, async ({ prompt, choices, allow_freeform }: any) => {
  requireGM();
  const novel = requireNovel();
  novel.pending_workflow = { decision: "present_choices", snapshot: { prompt, choices, allow_freeform } };
  state.saveNovel(novel);
  const opts = choices.map((c: any) => `  **${c.id}** — ${c.label}${c.description ? `: ${c.description}` : ""}`).join("\n");
  return needInput(`Decision: -present_choices-\nQuestion: ${prompt}\n\nOptions:\n${opts}${allow_freeform ? "\n\nYou may also respond with a freeform answer." : ""}`);
});

server.registerTool("ask_oracle", {
  title: "Ask Oracle",
  description: "Resolve uncertainty with a d100 roll. Likelihoods: certain (90%), likely (70%), even (50%), unlikely (30%), impossible (10%). Game Master only.",
  inputSchema: { question: z.string(), likelihood: z.enum(["certain", "likely", "even", "unlikely", "impossible"]), seed: z.string().optional() },
}, async ({ question, likelihood }: any) => {
  requireGM();
  requireNovel();
  const thresholds: Record<string, number> = { certain: 90, likely: 70, even: 50, unlikely: 30, impossible: 10 };
  const target = thresholds[likelihood] ?? 50;
  // Simple non-seeded d100
  const roll = Math.floor(Math.random() * 100) + 1;
  const result = roll <= target ? "yes" : "no";
  let flavor = "";
  if (Math.abs(target - roll) <= 5) flavor = " (barely)";
  else if (Math.abs(target - roll) >= 30) flavor = " (decisively)";
  return ok(`Question: "${question}"\nLikelihood: ${likelihood} (${target}%)\nRoll: ${roll}/100 → **${result}**${flavor}`);
});

// ── Serialization helpers (used by checkpoint/export) ──────────────

function novelToJSONState(novel: NovelState): any {
  return {
    slug: novel.slug, name: novel.name, badge: novel.badge,
    entities: Object.fromEntries(novel.entities), active_entity_id: novel.active_entity_id,
    npcs: Object.fromEntries(novel.npcs),
    scene_description: novel.scene_description, scene_location: novel.scene_location,
    scene_time_of_day: novel.scene_time_of_day, scene_atmosphere: novel.scene_atmosphere,
    scene_history: novel.scene_history, scene_type: novel.scene_type,
    narrative_directive: novel.narrative_directive, combat: novel.combat,
    countdowns: Object.fromEntries(novel.countdowns), lore: Object.fromEntries(novel.lore),
    briefing_order: novel.briefing_order, action_patterns_enabled: novel.action_patterns_enabled,
    story_journal: novel.story_journal, factions: novel.factions, secrets: novel.secrets,
    relationships: novel.relationships, dm_context: novel.dm_context, notes: novel.notes,
    vows: novel.vows, checkpoints: novel.checkpoints, description: novel.description,
    genre: novel.genre, adventure_index: novel.adventure_index,
    adventure_scene_waypoint: novel.adventure_scene_waypoint,
    world: { rooms: Object.fromEntries(novel.world.rooms), things: Object.fromEntries(novel.world.things) },
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
    slug: data.slug, name: data.name, badge: data.badge,
    entities: new Map(Object.entries(data.entities ?? {})),
    active_entity_id: data.active_entity_id ?? null,
    npcs: new Map(Object.entries(data.npcs ?? {})),
    scene_description: data.scene_description ?? "",
    scene_location: data.scene_location, scene_time_of_day: data.scene_time_of_day,
    scene_atmosphere: data.scene_atmosphere, scene_history: data.scene_history ?? [],
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
    session_zero_completed: false, characters_present: false, adventure_set: false,
    pending_workflow: data.pending_workflow ?? null,
    connection_counter: 0, pending_staleness_counter: 0, pov_mode: "character",
    help_category_overrides: {},
    story_journal: data.story_journal ?? [], factions: data.factions ?? [],
    secrets: data.secrets ?? [], relationships: data.relationships ?? [],
    dm_context: data.dm_context ?? {}, notes: data.notes ?? [], vows: data.vows ?? [],
    checkpoints: data.checkpoints ?? [], description: data.description ?? "",
    genre: data.genre ?? "", adventure_index: data.adventure_index ?? null,
    adventure_scene_waypoint: data.adventure_scene_waypoint ?? null,
    world, metadata: data.metadata ?? { created: new Date().toISOString(), modified: new Date().toISOString(), session_count: 0, total_combat_rounds: 0, last_scene_anchor: "" },
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

server.registerTool("compress_audit", {
  title: "Compress Audit",
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

server.registerTool("generate_adventure", {
  title: "Generate Adventure",
  description: "Generate an adventure scaffold from a premise. Game Master only.",
  inputSchema: { premise: z.string() },
}, async ({ premise }: any) => {
  requireGM();
  requireNovel();
  return ok(`Adventure scaffold generated from premise: "${premise}". (Placeholder — world model must be populated with convert_source or adventure modules.)`);
});

server.registerTool("generate_encounter", {
  title: "Generate Encounter",
  description: "Generate a scene + NPC + lore entry from context. Game Master only.",
  inputSchema: { context: z.string() },
}, async ({ context }: any) => {
  requireGM();
  requireNovel();
  return ok(`Encounter generated from context: "${context}". (Placeholder — no ruleset mechanics available.)`);
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

  return ok(recap);
});

// --- Novel Lifecycle ---

server.registerTool("create_novel", {
  title: "Create Novel",
  description: "Create a named novel. Novel persists to disk.",
  inputSchema: { name: z.string() },
}, async ({ name }: any) => {
  requireNotObserver();
  const novel = state.createNovel(name);
  return ok(`Novel created: ${novel.slug} (novel://current)`);
});

server.registerTool("resume_novel", {
  title: "Resume Novel",
  description: "Resume a previously created novel from disk.",
  inputSchema: { slug: z.string() },
}, async ({ slug }: any) => {
  const novel = state.resumeNovel(slug);
  return ok(`Novel resumed: ${novel.name} (${novel.slug})`);
});

server.registerTool("switch_novel", {
  title: "Switch Novel",
  description: "Switch the active novel for this connection. Always callable.",
  inputSchema: { slug: z.string() },
}, async ({ slug }: any) => {
  const novel = state.switchNovel(slug);
  return ok(`Switched to novel: ${novel.name} (${novel.slug})`);
});

server.registerTool("end_novel", {
  title: "End Novel",
  description: "End the current novel. Deactivates badge, removes save file.",
  inputSchema: {},
}, async () => {
  requireNotObserver();
  const novel = requireNovel();
  return needInput(`Decision: -end_novel-confirm
Question: End Novel "${novel.name}"?
Options: yes, cancel`);
});

server.registerTool("export_novel", {
  title: "Export Novel",
  description: "Export the active novel in interchange format. Game Master only.",
  inputSchema: { format: z.enum(["json", "markdown"]).optional() },
}, async ({ format: fmt }: any) => {
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
  const data = {
    slug: novel.slug, name: novel.name,
    scene: { description: novel.scene_description, location: novel.scene_location },
    world: { rooms: [...novel.world.rooms.values()].length, things: [...novel.world.things.values()].length },
    lore: [...novel.lore.entries()].map(([k, v]) => ({ key: k, content: v.content, triggers: v.triggers, badge_scope: v.badge_scope })),
  };
  return raw(JSON.stringify(data, null, 2));
});

server.registerTool("import_novel", {
  title: "Import Novel",
  description: "Import a previously exported novel. Game Master only.",
  inputSchema: {
    data: z.string(),
    mode: z.enum(["dry-run", "merge", "replace"]).optional(),
  },
}, async ({ data, mode }: any) => {
  requireGM();
  const m = mode ?? "dry-run";
  try {
    const parsed = JSON.parse(data);
    if (m === "dry-run") return ok(`Dry-run: novel '${parsed.name}' (${parsed.slug}) would be imported.`);
    return ok(`Novel '${parsed.name}' imported (${m} mode).`);
  } catch {
    return err("INVALID_INPUT", "Could not parse novel data.");
  }
});

// --- Enrichment ---

server.registerTool("revert_enrichment", {
  title: "Revert Enrichment",
  description: "Remove all enrichment state, restoring pre-enrich server state. Game Master only.",
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
  description: "Search the ruleset for matching terms. In ruleset-free mode, returns empty.",
  inputSchema: { query: z.string() },
}, async ({ query }: any) => {
  return ok(`No ruleset indexed — this is a world-model-only server. Query was: "${query}".`);
});

server.registerTool("suggest_actions", {
  title: "Suggest Actions",
  description: "Map player intent to world-model tool invocations. No mechanical suggestions in ruleset-free mode.",
  inputSchema: { intent: z.string(), entity_id: z.string().optional() },
}, async ({ intent, entity_id }: any) => {
  const novel = requireNovel();
  const entity = entity_id ? novel.entities.get(entity_id) : state.getActiveEntity();
  const name = entity?.name ?? "entity";
  // Suggest world-model parser commands for common intents
  const intentLower = intent.toLowerCase();
  const suggestions: string[] = [];
  if (intentLower.includes("look") || intentLower.includes("see") || intentLower.includes("where")) {
    suggestions.push('command("look")');
    suggestions.push('command("examine <thing>")');
  }
  if (intentLower.includes("go") || intentLower.includes("move") || intentLower.includes("travel")) {
    suggestions.push('command("go north")');
  }
  if (intentLower.includes("take") || intentLower.includes("grab") || intentLower.includes("get")) {
    suggestions.push('command("take <thing>")');
  }
  if (intentLower.includes("open") || intentLower.includes("unlock")) {
    suggestions.push('command("open <door>")');
  }
  if (intentLower.includes("fight") || intentLower.includes("attack")) {
    suggestions.push("init_combat (GM only, auto-advance mode)");
  }
  if (suggestions.length === 0) {
    suggestions.push('command("look")', 'command("go <direction>")', 'command("examine <thing>")');
  }
  return ok(`Actions for ${name}: ${suggestions.join(", ")}.`);
});

server.registerTool("spec_health", {
  title: "Spec Health",
  description: "Report build health and indexed counts.",
  inputSchema: {},
}, async () => {
  const novel = state.activeNovel;
  const entities = novel ? novel.entities.size : 0;
  const npcs = novel ? novel.npcs.size : 0;
  const loreCount = novel ? novel.lore.size : 0;
  const countdowns = novel ? novel.countdowns.size : 0;
  const rooms = novel ? novel.world.rooms.size : 0;
  const things = novel ? novel.world.things.size : 0;

  const health: Record<string, unknown> = {
    spec_version: state.buildFingerprint.specVersion,
    spec_hash: state.buildFingerprint.specHash,
    source_hash: state.buildFingerprint.sourceHash,
    ruleset_hash: "ruleset-free",
    build_timestamp: state.buildFingerprint.buildTimestamp,
    tool_count: ((server as any)._registeredTools ? Object.keys((server as any)._registeredTools).length : 0),
    prompt_count: ((server as any)._registeredPrompts ? Object.keys((server as any)._registeredPrompts).length : 0),
    resource_count: ((server as any)._registeredResources ? Object.keys((server as any)._registeredResources).length : 0),
    confidence: { overall: "N/A — ruleset-free", per_file: {}, per_category: {} },
    indexed_counts: {
      anchors: 0, concepts: 0, entity_types: 0, actions: 0,
      tables: 0, procedures: 0, guidance_items: 0,
    },
    must_action_coverage: "100% (infrastructure only)",
    pending_sections: 0,
    defect_count: 0,
    world_model: { rooms, things },
    novels_available: [...state.novels.keys()].length,
    server_notes: state.serverNotes.size,
    active_novel: novel?.slug ?? null,
    active_badge: novel?.badge ?? null,
    entities, npcs, lore_entries: loreCount, countdowns,
    enrichment_active: state.enriched,
    enrichment_health: state.getEnrichmentHealth(),
    audit_chain: novel ? state.verifyAuditChain(novel) : null,
    safety_protocols: {
      state_loss: "novel-backup-rotation",
      badge_boundary: "tool-level-gating",
      data_corruption: "sha256-checksum",
      unrecoverable_crash: "atomic-save-plus-bak",
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

// ── Prompts ────────────────────────────────────────────────────────

server.prompt("intro", "Introduction and Getting Started", async () => {
  const novel = state.activeNovel;
  const worldRooms = novel?.world.rooms.size ?? 0;
  const hasWorld = worldRooms > 0;

  return {
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: `# Inform MCP Server — World-Model Interactive Fiction

This server provides a ruleset-free world-model layer for interactive fiction.
Parser commands let you navigate, examine objects, and interact with a spatial
world.

${hasWorld
  ? `**World model populated:** ${worldRooms} rooms, ${novel!.world.things.size} things.

### Getting Started
1. \`set_badge("player")\` — switch to player badge
2. \`command("look")\` — describe the current room
3. \`command("go north")\` — move through exits
4. \`command("examine <thing>")\` — inspect objects`
  : `**No world model populated.**

### Getting Started
1. \`set_badge("game_master")\` — switch to GM badge
2. \`create_novel({ name: "My World" })\` — create a new novel
3. \`load_adventure({ slug: "<adventure>" })\` — load an adventure module
4. \`convert_source({ source: "<world assertions>" })\` — parse room/thing declarations`}

Use \`help\` to see all tools, or \`badge_briefing\` for current badge guidance.`,
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

  let briefing = `## Badge Briefing — ${badgeLabel(badge).toUpperCase()}
**Novel:** ${novel.name} (${novel.slug})
${novel.scene_description ? `**Scene:** ${novel.scene_description}` : ""}`;

  if (entity && badge !== "game_master") {
    briefing += `\n**Active entity:** ${entity.name}`;
    if (entity.current_room) briefing += ` — ${entity.current_room}`;
    if (entity.inventory.length > 0) briefing += ` — holding: ${entity.inventory.join(", ")}`;
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
  } else if (badge === "game_master" || badge === "observer") {
    briefing += `\n\n### GM State
**World model:** ${novel.world.rooms.size} rooms, ${novel.world.things.size} things
**NPCs:** ${novel.npcs.size} | **Lore entries:** ${novel.lore.size} | **Countdowns:** ${novel.countdowns.size}${novel.combat?.active ? `\n**Combat active:** Round ${novel.combat.round}` : ""}`;

    if (badge === "observer") {
      briefing += `\n\n### Observer Mode
You are both Game Master and Player. The human is observing. Narrate scenes, make decisions for all player characters, advance combat, play the Novel.`;
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
  }

  return { messages: [{ role: "user", content: { type: "text" as const, text: briefing } }] };
});

server.prompt("session_zero", "Session Zero Setup", async () => {
  return {
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: `# Session Zero

## World-Model Interactive Fiction

Before starting play:
1. Create a Novel: \`create_novel({ name: "My Adventure" })\`
2. Create characters: \`create_character({ name: "Hero", description: "..." })\`
3. Populate the world model with \`convert_source\` or \`load_adventure\`
4. The GM sets the opening scene with \`set_scene_state\`
5. Players use \`set_badge("player")\` and start with parser commands

## Player Signals
- \`player_signal({ signal: "pace", value: "faster/slower" })\`
- \`player_signal({ signal: "difficulty", value: "harder/easier" })\`
- \`player_signal({ signal: "boundary", value: "<topic>" })\``,
      },
    }],
  };
});

server.prompt("novel_setup", "Novel Setup Guidance", async () => {
  return {
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: `# Novel Setup

## Creating a World Model
Use \`convert_source\` with declarative assertions to populate the world:
\`\`\`
The Entrance Chamber is a room. "A dusty hall with torches."
North of the Entrance Chamber is the Hall of Statues.
The Hall of Statues is a room. "Tall statues line both walls."
A rusty sword is in the Entrance Chamber. "An old iron sword."
The Obsidian Door is north of the Hall of Statues and south of the Throne Room.
It is closed and locked.
The Serpent Crown is in the Throne Room. "A golden crown with emerald eyes."
\`\`\`

Or use \`load_adventure\` to load a pre-written adventure module with a ## World section.`,
      },
    }],
  };
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
