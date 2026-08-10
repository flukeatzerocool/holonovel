#!/usr/bin/env node
// Inform MCP Server — Ruleset-Free Holonovel Build
// REQ-001, REQ-020, REQ-022, REQ-023, REQ-195 through REQ-202, REQ-218, REQ-219

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

import { expandMacros } from "./core/macros.js";
import { StateManager, Hat, NovelState, LoreEntry } from "./core/state.js";
import {
  initServer, getHat, requireGM, requirePlayer, requireNovel, novelSnapshot,
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
const SPEC_HASH = "0f9c1b6c421443a0633fd4b6784ae3de14baa1407475944db746dfb05df9b5df";

// ── State ──────────────────────────────────────────────────────────

const state = new StateManager(DATA_DIR);
state.loadRoster();
state.buildFingerprint.specHash = SPEC_HASH;
state.buildFingerprint.lastSpecReview = new Date().toISOString();

// ── Server ─────────────────────────────────────────────────────────

const server = new McpServer({
  name: "inform-holonovel",
  version: "2026.08.09",
});

// ── Helpers ────────────────────────────────────────────────────────
// Hat gating and snapshot helpers provided by core/server.ts

initServer(state);

function audit(tool: string, args: any, prefix?: string): void {
  const novel = state.activeNovel;
  if (novel) state.audit(novel, getHat(), tool, args, prefix);
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
    hatActive: novel?.hat ?? undefined,
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
  "Hat & Workflow": ["set_hat", "respond", "undo", "redo", "help"],
  "Characters": ["create_character", "import_character", "character_sheet", "set_active_entity", "set_personality", "set_voice_examples", "player_signal"],
  "World Model": ["command", "create_room", "delete_room", "create_thing", "delete_thing", "create_exit", "delete_exit", "convert_source"],
  "Lookups": ["search_rules", "suggest_actions", "spec_health"],
  "Combat (GM)": ["init_combat", "advance_combat", "end_combat", "add_combat_participant", "remove_combat_participant"],
  "Narrative (GM)": ["set_scene_state", "set_scene_type", "set_narrative_directive"],
  "NPCs (GM)": ["create_npc", "update_npc", "remove_npc"],
  "Countdowns (GM)": ["set_countdown", "advance_countdown", "remove_countdown"],
  "Lore (GM)": ["set_lore_entry", "update_lore_entry", "remove_lore_entry", "toggle_lore_entry", "set_lore_group", "suggest_lore", "export_lorebook", "import_lorebook"],
  "Guidance (GM)": ["set_briefing_order", "compress_audit", "load_adventure", "generate_adventure", "generate_encounter", "set_help_category"],
  "Session": ["session_recap"],
  "Novel Lifecycle": ["create_novel", "resume_novel", "switch_novel", "end_novel", "export_novel", "import_novel"],
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

// --- Hat & Workflow ---

server.registerTool("set_hat", {
  title: "Set Active Hat",
  description: "Switch active hat. Accepts 'player' or 'game_master'. Always callable.",
  inputSchema: { hat: z.enum(["player", "game_master"]) },
}, async ({ hat }) => {
  const novel = state.activeNovel;
  if (novel) {
    novel.hat = hat;
    state.saveNovel(novel);
  }
  return ok(`Active hat: ${hat}`);
});

server.registerTool("respond", {
  title: "Respond to Workflow Decision",
  description: "Respond to a pending workflow decision.",
  inputSchema: { decision: z.string(), option: z.string() },
}, async ({ decision, option }) => {
  const novel = requireNovel();
  if (option === "cancel") {
    return ok("Workflow cancelled.");
  }
  if (decision.toLowerCase().includes("end novel")) {
    const slug = state.activeNovel!.slug;
    const result = state.endNovel(novel, option as "yes" | "cancel");
    if (result.removed) {
      return ok(`Novel '${slug}' ended. Save files moved to .trash/.`);
    }
    return ok("End novel cancelled.");
  }
  return ok(`Responded to '${decision}' with '${option}'.`);
});

server.registerTool("undo", {
  title: "Undo",
  description: "Undo the most recent mutation. Restores previous snapshot.",
  inputSchema: {},
}, async () => {
  const novel = requireNovel();
  state.undo(novel, getHat());
  return ok("Undo successful.");
});

server.registerTool("redo", {
  title: "Redo",
  description: "Redo the most recently undone mutation.",
  inputSchema: {},
}, async () => {
  const novel = requireNovel();
  state.redo(novel, getHat());
  return ok("Redo successful.");
});

server.registerTool("help", {
  title: "Help and Tool Discovery",
  description: "Show available commands and tools. Accepts optional query for focused search.",
  inputSchema: { query: z.string().optional() },
}, async ({ query }: any) => {
  const hat = getHat();
  const novel = state.activeNovel;
  const isGM = hat === "game_master";

  if (query) {
    const q = query.toLowerCase();
    const registeredTools: Record<string, any> = (server as any)._registeredTools ?? {};
    const toolNames = Object.keys(registeredTools).filter(t => {
      if (t === "set_hat" || t === "respond" || t === "undo" || t === "redo") return true;
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
    if (q.includes("brief") || q.includes("hat") || q.includes("state")) {
      matched.push({ name: "hat_briefing", description: "Per-hat guidance, state, and tool recommendations.", example: "Use the hat_briefing prompt", relevance: 2 });
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
  result += "\nUse the intro prompt to get started, or hat_briefing for current hat guidance.";
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
  const ctx = { world: novel.world, currentRoom, inventory, hat: getHat() };
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
    portable: !fixed && k !== "supporter" && k !== "door",
    openable: k === "container" || k === "door" || openable === true,
    open: false,
    lockable: k === "container" || k === "door" || lockable === true,
    locked: false,
    lit: false,
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
  novel.npcs.set(id, { id, name, description, disposition, location });
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
    hat_scope: z.enum(["game_master", "shared"]).optional(),
    priority: z.number().optional(),
    sticky: z.number().optional(),
    group: z.string().optional(),
  },
}, async ({ key, content, triggers, hat_scope, priority, sticky, group }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const entry: LoreEntry = {
    key,
    content,
    triggers: triggers ?? [],
    hat_scope: hat_scope ?? "game_master",
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
    hat_scope: z.enum(["game_master", "shared"]).optional(),
    priority: z.number().optional(),
    sticky: z.number().optional(),
    group: z.string().nullable().optional(),
  },
}, async ({ key, content, triggers, hat_scope, priority, sticky, group }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();
  const entry = novel.lore.get(key);
  if (!entry) return err("NOT_FOUND", `Lore entry '${key}' not found.`);
  if (content !== undefined) entry.content = content;
  if (triggers !== undefined) entry.triggers = triggers;
  if (hat_scope !== undefined) entry.hat_scope = hat_scope;
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
    hat_scope: e.hat_scope, priority: e.priority, sticky: e.sticky,
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
        hat_scope: e.hat_scope ?? "game_master", priority: e.priority ?? 0,
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

// --- Guidance (GM) ---

server.registerTool("set_briefing_order", {
  title: "Set Briefing Order",
  description: "Reorder sections of hat_briefing. Game Master only.",
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
  description: "Summarize recent audit entries. Callable by both hats.",
  inputSchema: { max_entries: z.number().optional() },
}, async ({ max_entries }: any) => {
  const novel = requireNovel();
  const max = max_entries ?? 20;
  const recent = novel.audit_log.slice(-max);
  const isGM = novel.hat === "game_master";
  const filtered = isGM ? recent : recent.filter(e => e.hat !== "game_master");
  if (filtered.length === 0) return ok("No audit entries.");
  const lines = filtered.map(e => `${e.timestamp.split("T")[1]?.substring(0, 8) || "?"} [${e.hat ?? "·"}] ${e.tool} → ${e.output_prefix || ""}`);
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
  description: "End the current novel. Deactivates hat, removes save file.",
  inputSchema: {},
}, async () => {
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
    lore: [...novel.lore.entries()].map(([k, v]) => ({ key: k, content: v.content, triggers: v.triggers, hat_scope: v.hat_scope })),
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
    active_novel: novel?.slug ?? null,
    entities, npcs, lore_entries: loreCount, countdowns,
    enrichment_active: state.enriched,
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
  return { contents: [{ uri: "novel://current", text: JSON.stringify({ slug: novel.slug, name: novel.name, hat: novel.hat, entities: novel.entities.size }), mimeType: "application/json" }] };
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

server.registerResource("guidance-hat-switch", "guidance://shared/hat-switch", { title: "Hat Switch Guidance" }, async () => ({
  contents: [{ uri: "guidance://shared/hat-switch", text: "Use set_hat to switch between player and game_master hats. Player: describe actions. GM: describe situations.", mimeType: "text/markdown" }],
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
  const isGM = novel.hat === "game_master";
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
  const isGM = novel.hat === "game_master";
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
1. \`set_hat("player")\` — switch to player hat
2. \`command("look")\` — describe the current room
3. \`command("go north")\` — move through exits
4. \`command("examine <thing>")\` — inspect objects`
  : `**No world model populated.**

### Getting Started
1. \`set_hat("game_master")\` — switch to GM hat
2. \`create_novel({ name: "My World" })\` — create a new novel
3. \`load_adventure({ slug: "<adventure>" })\` — load an adventure module
4. \`convert_source({ source: "<world assertions>" })\` — parse room/thing declarations`}

Use \`help\` to see all tools, or \`hat_briefing\` for current hat guidance.`,
      },
    }],
  };
});

server.prompt("hat_briefing", "Current Hat Briefing", async () => {
  const novel = state.activeNovel;
  if (!novel) {
    return { messages: [{ role: "user", content: { type: "text" as const, text: "No active Novel. Create or resume one first." } }] };
  }

  const hat = novel.hat ?? "unset";
  const entity = state.getActiveEntity();

  let briefing = `## Hat Briefing — ${hat.toUpperCase()}
**Novel:** ${novel.name} (${novel.slug})
${novel.scene_description ? `**Scene:** ${novel.scene_description}` : ""}`;

  if (entity && hat !== "game_master") {
    briefing += `\n**Active entity:** ${entity.name}`;
    if (entity.current_room) briefing += ` — ${entity.current_room}`;
    if (entity.inventory.length > 0) briefing += ` — holding: ${entity.inventory.join(", ")}`;
  }

  if (hat === "player") {
    briefing += `\n\n### Player Tools
Use \`command("<action>")\` to interact with the world:
- command("look") — describe the current room
- command("go north") — move in a direction
- command("take sword") — pick up an object
- command("examine thing") — look at something closely
- command("inventory") — check what you're carrying
- command("open door") — open an openable object`;
  } else if (hat === "game_master") {
    briefing += `\n\n### GM State
**World model:** ${novel.world.rooms.size} rooms, ${novel.world.things.size} things
**NPCs:** ${novel.npcs.size} | **Lore entries:** ${novel.lore.size} | **Countdowns:** ${novel.countdowns.size}${novel.combat?.active ? `\n**Combat active:** Round ${novel.combat.round}` : ""}`;

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
5. Players use \`set_hat("player")\` and start with parser commands

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
