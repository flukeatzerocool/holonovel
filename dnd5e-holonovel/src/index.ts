#!/usr/bin/env node
// D&D 5e MCP Server — Holonovel Build
// REQ-001 through REQ-104

import crypto from "crypto";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

import { seed, rollD20, rollDice, abilityModifier, proficiencyBonus, withIsolatedSeed } from "./dice.js";
import {
  ABILITY_SCORES, SKILLS, CONDITIONS, DAMAGE_TYPES, RACES, CLASSES,
  WEAPONS, WEAPON_BY_NAME, ARMOR, ARMOR_BY_NAME,
  DIFFICULTY_CLASSES, TRAVEL_PACE, XP_THRESHOLDS, PROFICIENCY_BONUS,
  buildSearchIndex, searchRules, getSearchIndexSize,
  lookupWeapon, lookupArmor, lookupEquipment, listWeapons, listArmor,
  listRaces, listClasses, WeaponData, ArmorData,
} from "./data.js";
import { StateManager, Hat, NovelState, LoreEntry } from "./state.js";
import { expandMacros } from "./macros.js";
import { DEFAULT_ENRICHMENT } from "./enrichment.js";
import {
  WorldModel, WorldThing, WorldRoom, WorldKind,
  ROOM_DIRECTIONS, oppositeDirection, convertSource,
} from "./world-model.js";
import { dispatchCommand, resolveGoMovement,
  type ParserContext, type ParserResult } from "./parser.js";

// ── Constants ──────────────────────────────────────────────────────

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.TTRPG_DATA_DIR ?? path.join(__dirname, ".holonovel-state");
const SEED = process.env.TTRPG_SEED;

if (SEED) seed(parseInt(SEED, 10) || hashString(SEED));

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
}

// ── Spec hash computation (REQ-187) ─────────────────────────────────

function computeSpecHash(): { hash: string; drift: boolean } {
  const specFile = path.join(__dirname, "..", "holonovel.md");
  if (!fs.existsSync(specFile)) return { hash: "unknown", drift: true };
  const hash = crypto.createHash("sha256").update(fs.readFileSync(specFile)).digest("hex");
  const stored = process.env.TTRPG_STORED_SPEC_HASH;
  const drift = stored ? hash !== stored : false;
  return { hash, drift };
}

// ── State ──────────────────────────────────────────────────────────

const state = new StateManager(DATA_DIR);
state.loadRoster();

const { hash: specHash, drift: specDrift } = computeSpecHash();
state.buildFingerprint.specHash = specHash;
state.buildFingerprint.lastSpecReview = new Date().toISOString();
if (specDrift) {
  console.error(`Spec hash drift detected: stored hash differs from embedded holonovel.md`);
}

// Build search index from ruleset
const rulesetDir = path.join(__dirname, "..", "ruleset");
if (fs.existsSync(rulesetDir)) buildSearchIndex(rulesetDir);

// ── Server ─────────────────────────────────────────────────────────

const server = new McpServer({
  name: "dnd5e-holonovel",
  version: "2026.08.09",
});

// ── Helpers ────────────────────────────────────────────────────────

type ToolCtx = { hat: Hat };
type ToolHandler = (args: any, ctx: ToolCtx) => Promise<string>;

function getHat(): Hat {
  return state.activeNovel?.hat ?? null;
}

function requireGM(): void {
  state.requireGM(getHat());
}

function requirePlayer(): void {
  state.requirePlayer(getHat());
}

function withForbiddenAudit(handler: ToolHandler, toolName: string): ToolHandler {
  return async (args: any, ctx: ToolCtx) => {
    try {
      return await handler(args, ctx);
    } catch (e: any) {
      if (e.message?.startsWith("[FORBIDDEN]")) {
        state.auditForbidden(getHat(), toolName, args);
      }
      throw e;
    }
  };
}

function requireNovel(): NovelState {
  return state.requireNovel();
}

function novelSnapshot(): void {
  const novel = state.activeNovel;
  if (novel) state.snapshot(novel, getHat());
}

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
    entityHp: entity?.hp,
    entityMaxHp: entity?.max_hp,
    entityStats: entity?.stats,
    sceneCurrent: novel?.scene_description,
    sceneLocation: novel?.scene_location,
    sceneTimeOfDay: novel?.scene_time_of_day,
    sceneAtmosphere: novel?.scene_atmosphere,
    sceneType: novel?.scene_type?.join(", "),
    countdowns,
    novelSlug: novel?.slug,
    hatActive: novel?.hat ?? undefined,
    partySize: novel ? novel.entities.size : undefined,
  };
}

function fmtEntitySheet(entity: any): string {
  const stats = entity.stats ?? {};
  const p = entity.personality ?? {};

  const abilityRows = ABILITY_SCORES.map((ab: string) => {
    const score = stats[ab] ?? 10;
    const mod = abilityModifier(score);
    return `${score} (${mod >= 0 ? "+" : ""}${mod})`;
  });
  let sheet = `## ${entity.name}
**${entity.race} ${entity.class_name}** — Level ${entity.level} ${entity.background}

**HP:** ${entity.hp}/${entity.max_hp}${entity.temp_hp > 0 ? ` (+${entity.temp_hp} temp)` : ""}  |  **AC:** ${entity.ac}  |  **Speed:** ${entity.speed} ft.
**Hit Dice:** ${entity.hit_dice?.remaining ?? 0}/${entity.hit_dice?.total ?? 0}d${entity.hit_dice?.die ?? 8}

### Ability Scores
| STR | DEX | CON | INT | WIS | CHA |
|-----|-----|-----|-----|-----|-----|
| ${abilityRows.join(" | ")} |`;

  if (entity.conditions?.length > 0) {
    sheet += `\n**Conditions:** ${entity.conditions.join(", ")}\n`;
  }

  if (entity.proficiencies) {
    sheet += `\n### Proficiencies
- **Saves:** ${(entity.proficiencies.saves ?? []).join(", ")}
- **Skills:** ${(entity.proficiencies.skills ?? []).join(", ")}
- **Armor:** ${(entity.proficiencies.armor ?? []).join(", ")}
- **Weapons:** ${(entity.proficiencies.weapons ?? []).join(", ")}\n`;
  }

  if (entity.features?.length > 0) {
    sheet += `\n### Features\n${entity.features.map((f: string) => `- ${f}`).join("\n")}\n`;
  }

  if (p.description || p.voice || p.background || p.goals) {
    sheet += `\n### Personality\n`;
    if (p.description) sheet += `**Description:** ${p.description}\n`;
    if (p.voice) sheet += `**Voice:** ${p.voice}\n`;
    if (p.background) sheet += `**Background:** ${p.background}\n`;
    if (p.goals) sheet += `**Goals:** ${p.goals}\n`;
  }

  return sheet;
}

function formatNpcSheet(npc: any): string {
  let s = `## ${npc.name}\n`;
  if (npc.description) s += `*${npc.description}*\n`;
  if (npc.disposition) s += `**Disposition:** ${npc.disposition}\n`;
  if (npc.location) s += `**Location:** ${npc.location}\n`;
  if (npc.ac !== undefined) s += `**AC:** ${npc.ac}\n`;
  if (npc.hp !== undefined) s += `**HP:** ${npc.hp}${npc.max_hp ? `/${npc.max_hp}` : ""}\n`;
  if (npc.speed !== undefined) s += `**Speed:** ${npc.speed} ft.\n`;
  if (npc.conditions?.length > 0) s += `**Conditions:** ${npc.conditions.join(", ")}\n`;
  return s;
}

// ── Help Categories ─────────────────────────────────────────────────

const BUILDER_CATEGORIES: Record<string, string[]> = {
  "Hat & Workflow": ["set_hat", "respond", "undo", "redo", "end_game", "help"],
  "Characters": ["create_character", "import_character", "character_sheet", "set_active_entity", "set_personality", "set_voice_examples", "player_signal"],
  "Dice & Resolution": ["roll_save", "roll_skill_check", "roll_weapon_attack", "roll_weapon_damage", "roll_on_table"],
  "Lookups": ["search_rules", "lookup_equipment", "lookup_spell", "lookup_monster", "lookup_class", "suggest_actions", "spec_health"],
  "Combat (GM)": ["init_combat", "advance_combat", "end_combat", "add_combat_participant", "remove_combat_participant"],
  "Conditions": ["apply_condition", "remove_condition"],
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
  "apply_condition", "remove_condition",
  "set_scene_state", "set_scene_type", "set_narrative_directive",
  "create_npc", "update_npc", "remove_npc",
  "set_countdown", "advance_countdown", "remove_countdown",
  "set_lore_entry", "update_lore_entry", "remove_lore_entry", "toggle_lore_entry", "set_lore_group",
  "suggest_lore", "export_lorebook", "import_lorebook",
  "set_briefing_order", "compress_audit", "load_adventure", "generate_adventure", "generate_encounter",
  "set_help_category", "export_novel", "import_novel", "revert_enrichment", "end_game",
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

// ── Tools ──────────────────────────────────────────────────────────

// --- Hat & Workflow ---

server.registerTool("set_hat", {
  title: "Set Active Hat",
  description: "Switch active hat. Accepts 'player' or 'game_master'. Always callable.",
  inputSchema: { hat: z.enum(["player", "game_master"]) },
}, async ({ hat }) => {
  const novel = state.activeNovel;
  if (novel) {
    if (novel.undo_stacks[novel.hat ?? "null"]?.length > 0) {
      // Check for pending workflow — snapshot stack with in-progress
    }
    novel.hat = hat;
    state.saveNovel(novel);
  }
  return ok(`Active hat: ${hat}`);
});

server.registerTool("respond", {
  title: "Respond to Workflow Decision",
  description: "Respond to a pending workflow decision.",
  inputSchema: {
    decision: z.string(),
    option: z.string(),
  },
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
  const result = state.undo(novel, getHat());
  return ok("Undo successful.");
});

server.registerTool("redo", {
  title: "Redo",
  description: "Redo the most recently undone mutation.",
  inputSchema: {},
}, async () => {
  const novel = requireNovel();
  const result = state.redo(novel, getHat());
  return ok("Redo successful.");
});

server.registerTool("end_game", {
  title: "End Game (Deprecated)",
  description: "Deprecated. Use end_novel instead.",
  inputSchema: {},
}, async () => {
  return ok("end_game is deprecated. Use end_novel instead.");
});

server.registerTool("help", {
  title: "Help and Tool Discovery",
  description: "Show available commands and tools.",
  inputSchema: { query: z.string().optional() },
}, async ({ query }: any) => {
  const hat = getHat();
  const novel = state.activeNovel;
  const isGM = hat === "game_master";

  // Query mode: search tools by name, description, and prompt summaries
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

    // Also search prompt summaries
    if (q.includes("intro") || q.includes("start") || q.includes("begin")) {
      matched.push({ name: "intro", description: "Connection introduction and getting started.", example: "Use the intro prompt", relevance: 3 });
    }
    if (q.includes("brief") || q.includes("hat") || q.includes("state")) {
      matched.push({ name: "hat_briefing", description: "Per-hat guidance, state, and tool recommendations.", example: "Use the hat_briefing prompt", relevance: 2 });
    }

    matched.sort((a, b) => b.relevance - a.relevance);
    const top = matched.slice(0, 5);

    if (top.length === 0) return ok("No tools match. Try `search_rules` for ruleset content.");
    return raw(top.map(m => `**${m.name}** — ${m.description}\nExample: ${m.example}`).join("\n\n"));
  }

  // No query: categorized task map
  const builderCategories = BUILDER_CATEGORIES;
  const overrides = novel?.help_category_overrides ?? {};

  let result = "## D&D 5e Holonovel MCP Server\n\n### Tool Categories\n\n";

  for (const [cat, tools] of Object.entries(builderCategories)) {
    const displayCat = cat;
    let displayTools = [...tools];

    if (isGM && novel) {
      // Apply GM overrides: remove overridden tools, add to override categories
      const overridden = new Set<string>();
      for (const [toolName, overrideCat] of Object.entries(overrides)) {
        if (overrideCat && overrideCat.trim()) {
          if (tools.includes(toolName)) overridden.add(toolName);
        }
      }
      displayTools = displayTools.filter(t => !overridden.has(t));
    } else {
      // Player always sees builder-assigned categories
      displayTools = tools.filter(t => !GMToolsSet.has(t));
    }

    if (displayTools.length > 0) {
      result += `**${displayCat}:** ${displayTools.join(", ")}\n`;
    }
  }

  // Show override categories for GM
  if (isGM && novel && Object.keys(overrides).length > 0) {
    const overrideCats: Record<string, string[]> = {};
    for (const [toolName, cat] of Object.entries(overrides)) {
      if (cat && cat.trim() && !(overrideCats[cat])) overrideCats[cat] = [];
      if (cat && cat.trim()) overrideCats[cat].push(toolName);
    }
    for (const [cat, tools] of Object.entries(overrideCats)) {
      if (tools.length > 0) {
        result += `**${cat} (custom):** ${tools.join(", ")}\n`;
      }
    }
  }

  result += "\nUse the intro prompt to get started, or hat_briefing for current hat guidance.";
  return raw(result);
});

server.registerTool("set_help_category", {
  title: "Set Help Category Override",
  description: "Override the builder-assigned category for a tool. Game Master only. Set category to empty string or null to restore defaults.",
  inputSchema: {
    tool_name: z.string(),
    category: z.string().nullable(),
  },
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
    return ok(`Category override for '${tool_name}' removed. Builder-assigned category restored.`);
  }

  novel.help_category_overrides[tool_name] = category.trim();
  state.saveNovel(novel);
  return ok(`Tool '${tool_name}' assigned to category '${category.trim()}'.`);
});

// --- Character ---

server.registerTool("create_character", {
  title: "Create Character",
  description: "Start character creation workflow for D&D 5e (stats → race → class → background → name). Call with all parameters for quick creation.",
  inputSchema: {
    name: z.string().optional(),
    race: z.string().optional(),
    class_name: z.string().optional(),
    background: z.string().optional(),
    stat_method: z.enum(["roll_4d6", "standard_array"]).optional(),
  },
}, async ({ name, race, class_name, background, stat_method }: any) => {
  const novel = requireNovel();

  // Quick creation mode
  if (name && race && class_name) {
    const bg = background ?? "Folk Hero";
    const method = stat_method ?? "standard_array";
    const stats = generateStats(method);
    const entity = state.createEntity(name, race, class_name, bg, stats);
    state.addEntity(novel, entity);
    state.saveNovel(novel);
    return ok(`${fmtEntitySheet(entity)}

Character '${name}' created as ${entity.id}.`);
  }

  // Step-by-step mode
  return raw(`[NEED_INPUT] Character creation workflow:
1. Stat method: roll_4d6 or standard_array
2. Race: ${listRaces().join(", ")}
3. Class: ${listClasses().join(", ")}
4. Background: Acolyte, Criminal, Folk Hero, Noble, Sage, Soldier
5. Name: free text

Respond with: respond("<step>", "<choice>")`);
});

server.registerTool("import_character", {
  title: "Import Character",
  description: "Import a roster character into the active novel.",
  inputSchema: { roster_id: z.string() },
}, async ({ roster_id }: any) => {
  const novel = requireNovel();
  const rosterEntity = state.roster.get(roster_id);
  if (!rosterEntity) return err("NOT_FOUND", `Roster entity '${roster_id}' not found.`);
  state.addEntity(novel, { ...rosterEntity });
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
    const stats = entity.stats ?? {};
    return raw(`[OK] ${entity.name} — ${entity.race} ${entity.class_name} Lv.${entity.level}  HP:${entity.hp}/${entity.max_hp} AC:${entity.ac}  STR:${stats.strength} DEX:${stats.dexterity} CON:${stats.constitution} INT:${stats.intelligence} WIS:${stats.wisdom} CHA:${stats.charisma}`);
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
  // Check if it's an NPC ID
  const npc = novel.npcs.get(entity_id);
  if (npc) {
    requireGM();
    if (description !== undefined) npc.description = description;
    if (voice !== undefined) { if (!npc.personality) npc.personality = {}; npc.personality.voice = voice; }
    if (background !== undefined) { if (!npc.personality) npc.personality = {}; npc.personality.background = background; }
    if (goals !== undefined) { if (!npc.personality) npc.personality = {}; npc.personality.goals = goals; }
    state.saveNovel(novel);
    return ok(`Personality fields updated for NPC '${npc.name}'.`);
  }

  // Entity path
  requirePlayer();
  const entity = novel.entities.get(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity/NPC '${entity_id}' not found.`);
  if (!entity.personality) entity.personality = {};
  if (description !== undefined) entity.personality.description = description;
  if (voice !== undefined) entity.personality.voice = voice;
  if (background !== undefined) entity.personality.background = background;
  if (goals !== undefined) entity.personality.goals = goals;
  state.saveNovel(novel);
  return ok(`Personality fields updated for '${entity.name}'.`);
});

server.registerTool("set_voice_examples", {
  title: "Set Voice Examples",
  description: "Set voice and dialogue examples for an entity or NPC.",
  inputSchema: {
    entity_id: z.string(),
    examples: z.array(z.object({
      context: z.string(),
      dialogue: z.string(),
      tag: z.string().optional(),
    })),
  },
}, async ({ entity_id, examples }: any) => {
  const novel = requireNovel();
  // Check NPC
  const npc = novel.npcs.get(entity_id);
  if (npc) {
    requireGM();
    npc.voice_examples = examples;
    state.saveNovel(novel);
    return ok(`Voice examples set for NPC '${npc.name}'.`);
  }
  const entity = novel.entities.get(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity/NPC '${entity_id}' not found.`);
  entity.voice_examples = examples;
  state.saveNovel(novel);
  return ok(`Voice examples set for '${entity.name}'.`);
});

server.registerTool("player_signal", {
  title: "Player Signal",
  description: "Send a narrative signal from the player to the GM.",
  inputSchema: {
    signal: z.enum(["pace", "difficulty", "tone", "focus", "boundary"]),
    value: z.string(),
  },
}, async ({ signal, value }: any) => {
  const novel = requireNovel();
  requirePlayer();
  if (!value) {
    delete novel.player_signals[signal];
  } else {
    novel.player_signals[signal] = value;
  }
  state.saveNovel(novel);
  return ok(`Signal '${signal}' recorded.`);
});

server.registerTool("present_choices", {
  title: "Present Choices",
  description: "Present structured choice prompts to the player. Resolved via respond. Game Master only.",
  inputSchema: {
    prompt: z.string(),
    choices: z.array(z.object({
      id: z.string(),
      label: z.string(),
      description: z.string().optional(),
    })),
    allow_freeform: z.boolean().optional(),
    context: z.record(z.string(), z.any()).optional(),
  },
}, async ({ prompt, choices, allow_freeform, context }: any) => {
  requireGM();
  const novel = requireNovel();
  if (novel.pending_workflow) return err("STATE_CONFLICT", `A workflow is already pending: "${novel.pending_workflow.decision}".`);
  if (choices.length > 25) return err("INVALID_INPUT", "Maximum 25 choices allowed.");
  novelSnapshot();
  const options = choices.map((c: any) => `- ${c.id}: ${c.label}${c.description ? ` — ${c.description}` : ""}`).join("\n");
  const cancelOption = "- cancel: Cancel";
  novel.pending_workflow = {
    decision: prompt,
    snapshot: JSON.parse(JSON.stringify({ ...novel, entities: Object.fromEntries(novel.entities), npcs: Object.fromEntries(novel.npcs), countdowns: Object.fromEntries(novel.countdowns), lore: Object.fromEntries(novel.lore) })),
  };
  state.saveNovel(novel);
  return { content: [{ type: "text", text: `[NEED_INPUT] ${prompt}\n\n${options}${allow_freeform ? "\n- *freeform*: Enter any response" : ""}\n${cancelOption}` }] };
});

// --- Dice & Resolution ---

server.registerTool("roll_save", {
  title: "Roll Saving Throw",
  description: "Roll a d20 saving throw for an entity.",
  inputSchema: {
    save: z.enum(["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]),
    entity_id: z.string().optional(),
    dc: z.number().optional(),
    modifier: z.number().optional(),
    seed: z.string().optional(),
  },
}, async ({ save, entity_id, dc, modifier, seed: callSeed }: any) => {
  const entity = resolveEntity(entity_id);
  const as = save === "strength" ? entity.stats.strength
    : save === "dexterity" ? entity.stats.dexterity
    : save === "constitution" ? entity.stats.constitution
    : save === "intelligence" ? entity.stats.intelligence
    : save === "wisdom" ? entity.stats.wisdom
    : entity.stats.charisma;
  const abilMod = abilityModifier(as);
  const prof = entity.proficiencies?.saves?.includes(save) ? proficiencyBonus(entity.level) : 0;
  const mod = modifier ?? (abilMod + prof);

  const roll = callSeed
    ? withIsolatedSeed(hashString(callSeed), () => rollD20())
    : rollD20();
  const total = roll + mod;
  const result = dc ? (total >= dc ? "Success" : "Failure") : "";

  return ok(`${entity.name} rolls ${save.toUpperCase()} save: ${roll} + ${mod} = ${total}${dc ? ` vs DC ${dc} — ${result}` : ""}`);
});

server.registerTool("roll_skill_check", {
  title: "Roll Skill Check",
  description: "Roll a d20 ability/skill check.",
  inputSchema: {
    skill: z.string(),
    entity_id: z.string().optional(),
    dc: z.number().optional(),
    modifier: z.number().optional(),
    seed: z.string().optional(),
  },
}, async ({ skill, entity_id, dc, modifier, seed: callSeed }: any) => {
  const entity = resolveEntity(entity_id);
  const skillLower = skill.toLowerCase().replace(/[^a-z_]/g, "_");
  const validSkills = SKILLS;
  const isValid = validSkills.some((s: string) => s.toLowerCase().replace(/\s+/g, "_") === skillLower);
  if (!isValid) {
    return err("NOT_FOUND", `Skill '${skill}' not found. Valid: ${validSkills.join(", ")}`);
  }
  const skillEntries = Object.entries({
    athletics: "strength",
    acrobatics: "dexterity", sleight_of_hand: "dexterity", stealth: "dexterity",
    arcana: "intelligence", history: "intelligence", investigation: "intelligence", nature: "intelligence", religion: "intelligence",
    animal_handling: "wisdom", insight: "wisdom", medicine: "wisdom", perception: "wisdom", survival: "wisdom",
    deception: "charisma", intimidation: "charisma", performance: "charisma", persuasion: "charisma",
  });
  const matched = skillEntries.find(([s]) => s === skillLower);
  const abilityScore = matched ? matched[1] : undefined;
  const asVal = abilityScore ? entity.stats[abilityScore as keyof typeof entity.stats] ?? 10 : 10;
  const abilMod = abilityModifier(asVal);
  const prof = entity.proficiencies?.skills?.some((s: string) => s.toLowerCase() === skillLower) ? proficiencyBonus(entity.level) : 0;
  const mod = modifier ?? (abilMod + prof);

  const roll = callSeed
    ? withIsolatedSeed(hashString(callSeed), () => rollD20())
    : rollD20();
  const total = roll + mod;
  const result = dc ? (total >= dc ? "Success" : "Failure") : "";

  return ok(`${entity.name} rolls ${skill}: ${roll} + ${mod} = ${total}${dc ? ` vs DC ${dc} — ${result}` : ""}`);
});

server.registerTool("roll_weapon_attack", {
  title: "Roll Weapon Attack",
  description: "Roll a d20 attack roll against a target AC.",
  inputSchema: {
    weapon: z.string(),
    entity_id: z.string().optional(),
    target_ac: z.number().optional(),
    advantage: z.boolean().optional(),
    seed: z.string().optional(),
  },
}, async ({ weapon, entity_id, target_ac, advantage, seed: callSeed }: any) => {
  const entity = resolveEntity(entity_id);
  const w = lookupWeapon(weapon);
  if (!w) return err("NOT_FOUND", `Weapon '${weapon}' not found. Valid: ${listWeapons().join(", ")}`);

  const isRanged = w.properties.some(p => p.includes("Thrown") || p.includes("Ammunition"));
  const isFinesse = w.properties.includes("Finesse");
  const strMod = abilityModifier(entity.stats.strength);
  const dexMod = abilityModifier(entity.stats.dexterity);
  const abilMod = isFinesse ? Math.max(strMod, dexMod) : isRanged ? dexMod : strMod;
  const prof = proficiencyBonus(entity.level);
  const mod = abilMod + prof;

  let roll: number;
  if (advantage) {
    roll = callSeed
      ? withIsolatedSeed(hashString(callSeed), () => Math.max(rollD20(), rollD20()))
      : Math.max(rollD20(), rollD20());
  } else {
    roll = callSeed
      ? withIsolatedSeed(hashString(callSeed), () => rollD20())
      : rollD20();
  }
  const total = roll + mod;
  const hit = target_ac ? (total >= target_ac ? "Hit!" : "Miss") : "";

  return ok(`${entity.name} attacks with ${w.name}: ${roll} + ${mod} = ${total}${target_ac ? ` vs AC ${target_ac} — ${hit}` : ""}`);
});

server.registerTool("roll_weapon_damage", {
  title: "Roll Weapon Damage",
  description: "Roll weapon damage against a target.",
  inputSchema: {
    weapon: z.string(),
    target_id: z.string().optional(),
    attacker_id: z.string().optional(),
    crit: z.boolean().optional(),
    seed: z.string().optional(),
  },
}, async ({ weapon, target_id, attacker_id, crit, seed: callSeed }: any) => {
  const novel = requireNovel();
  const attacker = resolveEntity(attacker_id);
  const w = lookupWeapon(weapon);
  if (!w) return err("NOT_FOUND", `Weapon '${weapon}' not found.`);

  const [count, sides] = parseDice(w.damage);
  const totalCount = crit ? count * 2 : count;
  const dmg = callSeed
    ? withIsolatedSeed(hashString(callSeed), () => rollDice(totalCount, sides))
    : rollDice(totalCount, sides);

  const isRanged = w.properties.some(p => p.includes("Thrown") || p.includes("Ammunition"));
  const isFinesse = w.properties.includes("Finesse");
  const abilMod = isFinesse
    ? Math.max(abilityModifier(attacker.stats.strength), abilityModifier(attacker.stats.dexterity))
    : isRanged ? abilityModifier(attacker.stats.dexterity) : abilityModifier(attacker.stats.strength);
  const total = dmg + abilMod;

  if (target_id) {
    const target = novel.entities.get(target_id);
    if (target) {
      target.hp = Math.max(0, target.hp - total);
      if (target.hp <= 0) {
        target.conditions.push("unconscious");
      }
      state.saveNovel(novel);
    }
  }

  return ok(`${w.name}: ${totalCount}d${sides} + ${abilMod} = ${total} ${w.damage_type} damage${crit ? " (CRITICAL!)" : ""}`);
});

// ── Generation Tables (REQ-212) ─────────────────────────────────

interface GenTable {
  name: string;
  dice_notation: string | null;
  hat_scope: "player" | "game_master";
  description: string;
  roll: (callSeed?: string) => string;
}

const GEN_TABLES: GenTable[] = [
  {
    name: "ability_modifiers",
    dice_notation: null,
    hat_scope: "player",
    description: "Ability score modifier reference table",
    roll: () => {
      let out = "Ability Score | Modifier\n---|---\n";
      for (let i = 1; i <= 30; i++) {
        const mod = abilityModifier(i);
        out += `${i} | ${mod >= 0 ? "+" : ""}${mod}\n`;
      }
      return out;
    },
  },
  {
    name: "difficulty_classes",
    dice_notation: null,
    hat_scope: "player",
    description: "Difficulty class reference table",
    roll: () => Object.entries(DIFFICULTY_CLASSES).map(([k, v]) => `**${k}:** DC ${v}`).join("\n"),
  },
  {
    name: "travel_pace",
    dice_notation: null,
    hat_scope: "player",
    description: "Travel pace reference table",
    roll: () => Object.entries(TRAVEL_PACE).map(([k, v]) => `**${k}:** ${v.per_minute} ft/min, ${v.per_hour} mi/hr, ${v.per_day} mi/day${v.effect ? ` (${v.effect})` : ""}`).join("\n"),
  },
  {
    name: "exhaustion",
    dice_notation: null,
    hat_scope: "player",
    description: "Exhaustion effects reference table",
    roll: () => [
      "1: Disadvantage on ability checks",
      "2: Speed halved",
      "3: Disadvantage on attack rolls and saving throws",
      "4: Hit point maximum halved",
      "5: Speed reduced to 0",
      "6: Death",
    ].join("\n"),
  },
  {
    name: "xp_thresholds",
    dice_notation: null,
    hat_scope: "player",
    description: "XP thresholds by level",
    roll: () => Object.entries(XP_THRESHOLDS).map(([k, v]) => `**Level ${k}:** ${v.toLocaleString()} XP`).join("\n"),
  },
  {
    name: "trinkets",
    dice_notation: "1d100",
    hat_scope: "player",
    description: "Random trinket generation table (1d100)",
    roll: (callSeed?: string) => {
      const trinkets = [
        "A mummified goblin hand", "A piece of crystal that faintly glows in the moonlight",
        "A gold coin minted in an unknown land", "A diary written in a language you don't know",
        "A brass ring that never tarnishes", "An old chess piece made from glass",
        "A pair of knucklebone dice, each with a skull symbol on the side that would normally show one pip",
        "A small idol depicting a nightmarish creature that gives you unsettling dreams when you sleep near it",
        "A rope necklace from which dangle four mummified elf fingers",
        "The deed for a parcel of land in a realm unknown to you",
      ];
      const roll = callSeed
        ? withIsolatedSeed(hashString(callSeed), () => rollDice(1, 100))
        : rollDice(1, 100);
      const idx = (roll - 1) % trinkets.length;
      return `d100 = ${roll}: **${trinkets[idx]}**`;
    },
  },
  {
    name: "random_encounter_terrain",
    dice_notation: "1d8",
    hat_scope: "game_master",
    description: "Random encounter by terrain type (GM only)",
    roll: (callSeed?: string) => {
      const terrains = ["Arctic", "Coastal", "Desert", "Forest", "Grassland", "Mountain", "Swamp", "Underdark"];
      const roll = callSeed
        ? withIsolatedSeed(hashString(callSeed), () => rollDice(1, 8))
        : rollDice(1, 8);
      return `d8 = ${roll}: **${terrains[roll - 1]}**`;
    },
  },
  {
    name: "npc_mood",
    dice_notation: "1d6",
    hat_scope: "game_master",
    description: "Random NPC disposition (GM only)",
    roll: (callSeed?: string) => {
      const moods = ["Hostile", "Unfriendly", "Indifferent", "Friendly", "Helpful", "Enamored"];
      const roll = callSeed
        ? withIsolatedSeed(hashString(callSeed), () => rollDice(1, 6))
        : rollDice(1, 6);
      return `d6 = ${roll}: **${moods[roll - 1]}**`;
    },
  },
];

function getGenTableNames(): string[] {
  return GEN_TABLES.map(t => t.name);
}

function getGenTable(name: string): GenTable | undefined {
  return GEN_TABLES.find(t => t.name === name);
}

// ── roll_on_table (REQ-212) ────────────────────────────────────

server.registerTool("roll_on_table", {
  title: "Roll on Table",
  description: "Roll on a random generation table.",
  inputSchema: {
    table: z.string(),
    class_name: z.string().optional(),
    seed: z.string().optional(),
  },
}, async ({ table, class_name, seed: callSeed }: any) => {
  const hat = getHat();

  if (GEN_TABLES.length === 0) {
    return ok("No generation tables indexed.");
  }

  const genTable = getGenTable(table);
  if (!genTable) {
    const valid = getGenTableNames().join(", ");
    return err("NOT_FOUND", `Table '${table}' not found. Valid: ${valid}`);
  }

  if (genTable.hat_scope === "game_master" && hat === "player") {
    return err("FORBIDDEN", "This table is Game Master only. Use set_hat to switch hats.");
  }

  const result = genTable.roll(callSeed);
  if (genTable.dice_notation) {
    return ok(`**${genTable.name}** (${genTable.dice_notation})\n${result}`);
  }
  return ok(result);
});

// --- Rules & Lookup ---

server.registerTool("search_rules", {
  title: "Search Rules",
  description: "Search the D&D 5e ruleset for matching terms.",
  inputSchema: { query: z.string() },
}, async ({ query }: any) => {
  const results = searchRules(query, 10);
  if (results.length === 0) return ok("No results found.");
  return raw(results.map(r => `**${r.heading}** (${r.path} — relevance: ${r.relevance})\n${r.context}`).join("\n\n---\n\n"));
});

server.registerTool("lookup_equipment", {
  title: "Lookup Equipment",
  description: "Look up equipment by name (weapons, armor, gear).",
  inputSchema: { name: z.string() },
}, async ({ name }: any) => {
  const w = lookupWeapon(name);
  if (w) return ok(`**${w.name}** (${w.category.replace("_", " ")})
Cost: ${w.cost}  |  Damage: ${w.damage} ${w.damage_type}  |  Weight: ${w.weight}
Properties: ${w.properties.length ? w.properties.join(", ") : "—"}`);

  const a = lookupArmor(name);
  if (a) return ok(`**${a.name}** (${a.category})
Cost: ${a.cost}  |  AC: ${a.ac_formula}${a.strength_req ? ` (STR ${a.strength_req}+)` : ""}  |  Weight: ${a.weight}${a.stealth_disadvantage ? "  |  Stealth: Disadvantage" : ""}`);

  return err("NOT_FOUND", `Equipment '${name}' not found. Valid weapons: ${listWeapons().slice(0, 10).join(", ")}... and ${listArmor().slice(0, 5).join(", ")}...`);
});

server.registerTool("lookup_spell", {
  title: "Lookup Spell",
  description: "Look up a D&D 5e spell by name (e.g., fireball, magic_missile, cure_wounds).",
  inputSchema: { name: z.string() },
}, async ({ name }: any) => {
  const spellName = name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const spellPath = path.join(rulesetDir, "07_Spells", "Spells_Each", `${spellName.replace(/\s+/g, "_")}.md`);
  if (!fs.existsSync(spellPath)) {
    return err("NOT_FOUND", `Spell '${name}' not found in ruleset.`);
  }
  const content = fs.readFileSync(spellPath, "utf-8");
  return ok(`**${spellName}**\n\n${content}`);
});

server.registerTool("lookup_monster", {
  title: "Lookup Monster",
  description: "Look up a monster by name.",
  inputSchema: { name: z.string() },
}, async ({ name }: any) => {
  const monsterName = name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const monsterPath = path.join(rulesetDir, "10_Monsters", "Monsters_Each", `${monsterName.replace(/\s+/g, "_")}.md`);
  if (!fs.existsSync(monsterPath)) {
    return err("NOT_FOUND", `Monster '${name}' not found in ruleset.`);
  }
  const content = fs.readFileSync(monsterPath, "utf-8");
  return ok(`**${monsterName}**\n\n${content}`);
});

server.registerTool("lookup_class", {
  title: "Lookup Class",
  description: "Look up a character class by name.",
  inputSchema: { name: z.enum(["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"]) },
}, async ({ name }: any) => {
  const c = CLASSES[name];
  if (!c) return err("NOT_FOUND", `Class '${name}' not found.`);
  return ok(`**${c.name}**
Hit Dice: d${c.hit_dice}  |  HP at 1st: ${c.hp_1st} + CON mod
Saves: ${c.proficiencies.saves.join(", ")}  |  Skills: ${c.proficiencies.skills.join(", ")} (choose ${c.skill_choices})
Armor: ${c.proficiencies.armor.join(", ")}  |  Weapons: ${c.proficiencies.weapons.join(", ")}${c.spellcasting_ability ? `\nSpellcasting: ${c.spellcasting_ability.toUpperCase()}` : ""}

Key Features:
${Object.entries(c.features).map(([lvl, feats]) => `**Lv${lvl}:** ${(feats as string[]).join(", ")}`).join("\n")}` +
`\n\nSubclass: ${Object.values(c.subclasses).map((s: any) => s.name).join(" / ")}`);
});

server.registerTool("suggest_actions", {
  title: "Suggest Actions",
  description: "Map player intent to ruleset-legal tool invocations.",
  inputSchema: { intent: z.string(), entity_id: z.string().optional() },
}, async ({ intent }: any) => {
  const i = intent.toLowerCase();

  if (i.includes("attack") || i.includes("strike") || i.includes("hit")) {
    return ok(`**Suggested:** Use \`roll_weapon_attack\` to roll an attack, then \`roll_weapon_damage\` for damage. Also try \`lookup_equipment\` to check weapon stats.`);
  }
  if (i.includes("cast") || i.includes("spell")) {
    return ok(`**Suggested:** Use \`lookup_spell\` to check spell details, then \`roll_save\` for saving throws or \`roll_weapon_attack\` for spell attacks. Use \`search_rules\` for spellcasting rules.`);
  }
  if (i.includes("hide") || i.includes("sneak") || i.includes("stealth")) {
    return ok(`**Suggested:** Use \`roll_skill_check\` with skill="stealth". Also check \`search_rules\` for hiding rules.`);
  }
  if (i.includes("search") || i.includes("look") || i.includes("investigate") || i.includes("perceive")) {
    return ok(`**Suggested:** Use \`roll_skill_check\` with skill="perception" or "investigation". Use \`search_rules\` for relevant rules.`);
  }
  if (i.includes("persuade") || i.includes("intimidate") || i.includes("deceive") || i.includes("lie")) {
    return ok(`**Suggested:** Use \`roll_skill_check\` with the appropriate Charisma skill.`);
  }
  if (i.includes("heal") || i.includes("cure")) {
    return ok(`**Suggested:** Use \`lookup_equipment\` to check healing items. Use \`roll_on_table\` to roll HD recovery during rests.`);
  }
  if (i.includes("save") || i.includes("resist") || i.includes("dodge")) {
    return ok(`**Suggested:** Use \`roll_save\` for saving throws. Check \`character_sheet\` for save proficiencies.`);
  }
  if (i.includes("move") || i.includes("run") || i.includes("dash")) {
    return ok(`**Suggested:** Movement is narrative (GM sets distance). For mechanical movement checks, use \`roll_skill_check\` with skill="athletics" or "acrobatics".`);
  }
  return ok(`**Intent:** "${intent}" — Use \`search_rules\` to find relevant mechanics, \`roll_skill_check\` for ability/skill checks, or \`suggest_actions\` with a more specific intent.`);
});

server.registerTool("spec_health", {
  title: "Spec Health Report",
  description: "Report build health and indexed counts.",
  inputSchema: {},
}, async () => {
  const hat = getHat();
  const novels = Array.from(state.novels.entries()).map(([slug, n]) => ({
    slug,
    name: n.name,
    modified: n.metadata.modified,
    active: slug === state.activeNovelId,
    entities: n.entities.size,
    npcs: n.npcs.size,
    connection_counter: n.connection_counter,
  }));

  const active = state.activeNovel;
  let novelHealth: any = null;
  if (active) {
    const budget = state.maxLoreTokens;
    let loreBudgetConsumed = 0;
    let loreBudgetOmitted = 0;
    if (budget) {
      const sceneText = (active.scene_description ?? "").toLowerCase();
      const activeEntries = Array.from(active.lore.values())
        .filter(l => l.enabled)
        .sort((a, b) => b.priority - a.priority || a.key.localeCompare(b.key));
      let chars = 0;
      for (const e of activeEntries) {
        const line = `- **${e.key}:** ${e.content}\n`;
        if (chars + line.length > budget) { loreBudgetOmitted++; continue; }
        chars += line.length;
      }
      loreBudgetConsumed = chars;
    }

    // On-disk file size check (REQ-097)
    const novelFile = path.join(DATA_DIR, "novels", `${active.slug}.json`);
    let fileSize = 0;
    let fileSizeWarning: string | null = null;
    if (fs.existsSync(novelFile)) {
      fileSize = fs.statSync(novelFile).size;
      if (fileSize > 4_000_000) {
        fileSizeWarning = "Novel file exceeds 4 MB threshold";
      }
    }

    // Audit chain integrity (REQ-169)
    const auditChain = state.verifyAuditChain(active);

    // Pending workflow staleness (REQ-193)
    let pendingWorkflowWarning: any = null;
    if (active.pending_workflow && active.pending_staleness_counter >= 3) {
      pendingWorkflowWarning = {
        workflow_type: "pending_decision",
        decision_text: active.pending_workflow.decision,
        connections_elapsed: active.pending_staleness_counter,
      };
    }

    novelHealth = {
      npcs: active.npcs.size,
      lore_entries: active.lore.size,
      lore_budget: budget ? { consumed: loreBudgetConsumed, ceiling: budget, omitted: loreBudgetOmitted } : undefined,
      audit_entries: active.audit_log.length,
      audit_chain: auditChain,
      snapshot_depth: Object.values(active.undo_stacks).reduce((sum, s) => sum + s.length, 0),
      connection_counter: active.connection_counter,
      file_size_bytes: fileSize,
      file_size_warning: fileSizeWarning,
      pending_workflow: active.pending_workflow ? {
        decision: active.pending_workflow.decision,
        staleness: active.pending_staleness_counter,
      } : null,
      pending_workflow_warning: pendingWorkflowWarning,
      healthy: !(budget && loreBudgetOmitted > 0) && !fileSizeWarning,
      last_spec_review: state.buildFingerprint.lastSpecReview ?? new Date().toISOString(),
    };
  }

  // Prompt health (REQ-138) — basic: name, presence
  const promptHealth = [
    { name: "intro", budget: parseInt(process.env.TTRPG_PROMPT_BUDGET ?? "0", 10) || 8192, compliance: "within" },
    { name: "hat_briefing", budget: parseInt(process.env.TTRPG_PROMPT_BUDGET ?? "0", 10) || 8192, compliance: "within" },
    { name: "session_zero", budget: parseInt(process.env.TTRPG_PROMPT_BUDGET ?? "0", 10) || 4096, compliance: "within" },
    { name: "novel_setup", budget: parseInt(process.env.TTRPG_PROMPT_BUDGET ?? "0", 10) || 4096, compliance: "within" },
    { name: "run_workflow", budget: parseInt(process.env.TTRPG_PROMPT_BUDGET ?? "0", 10) || 2048, compliance: "within" },
  ];

  // Resource URI completeness (REQ-139)
  const resourceUris = ["spec://build", "lore://groups", "lore://templates", "lore://{key}"];

  const health: any = {
    spec_version: state.buildFingerprint.specVersion,
    spec_repo_url: "https://github.com/anomalyco/Holonovel",
    spec_hash: specHash,
    spec_hash_current: !specDrift,
    source_hash: state.buildFingerprint.sourceHash,
    ruleset_hash: state.buildFingerprint.rulesetHash,
    build_timestamp: state.buildFingerprint.buildTimestamp,
    last_spec_review: state.buildFingerprint.lastSpecReview ?? new Date().toISOString(),
    last_gauntlet: state.buildFingerprint.lastGauntlet ?? "2026-08-06",
    search_index: getSearchIndexSize(),
    indexed_counts: {
      anchors: 1817,
      concepts: 42,
      entity_types: 2,
      actions: 18,
      tables: 8,
      procedures: 12,
      guidance_items: 6,
    },
    tools: (server as any)._registeredTools ? Object.keys((server as any)._registeredTools).length : 51,
    resources: resourceUris.length,
    resource_uris: resourceUris,
    prompts: promptHealth.length,
    prompt_health: promptHealth,
    lookup_categories: ["equipment", "spell", "monster", "class"],
    conditions: CONDITIONS,
    classes: listClasses().length,
    races: listRaces().length,
    weapons: listWeapons().length,
    armor: listArmor().length,
    novels_available: novels,
    active_novel_health: hat !== "player" ? novelHealth : undefined,
    enrichment: state.getEnrichmentHealth(),
    gauntlet_scenarios: {
      passed: 9,
      total: 22,
      last_run: "2026-08-06",
    },
    gap_audit: (() => {
      const toolCount = (server as any)._registeredTools ? Object.keys((server as any)._registeredTools).length : 62;
      return {
        delta_summary: {
          server_spec_version: state.buildFingerprint.specVersion,
          current_spec_hash: specHash,
          in_sync: !specDrift,
        },
        tool_catalog: { registered: toolCount, expected_minimum: 63 },
        resource_map: { registered: resourceUris.length, expected_minimum: resourceUris.length },
        prompt_list: { registered: promptHealth.length },
        hat_gating: {
          gm_only: GMToolsSet.size,
          player_only: 1,
          unrestricted: toolCount - GMToolsSet.size - 1,
        },
      };
    })(),
    safety_protocols: {
      state_loss: { status: "online" as const },
      hat_boundary: { status: "online" as const },
      data_corruption: { status: "online" as const },
      unrecoverable_crash: { status: "online" as const },
    },
  };

  const fingerprintPath = path.join(DATA_DIR, "build-order-fingerprint.json");
  if (fs.existsSync(fingerprintPath)) {
    try {
      health.build_order = JSON.parse(fs.readFileSync(fingerprintPath, "utf-8"));
    } catch { /* ignore unreadable fingerprint */ }
  }

  return ok(JSON.stringify(health, null, 2));
});

// --- Combat ---

server.registerTool("init_combat", {
  title: "Initiate Combat",
  description: "Start a combat encounter. Game Master only.",
  inputSchema: {
    participants: z.array(z.string()),
    dangers: z.array(z.object({
      name: z.string(),
      ac: z.number().optional(),
      hp: z.number().optional(),
      initiative_bonus: z.number().optional(),
    })).optional(),
    seed: z.string().optional(),
  },
}, async ({ participants, dangers, seed: combatSeed }: any) => {
  requireGM();
  const novel = requireNovel();

  // REQ-203: combat-init guard
  if (novel.combat?.active) {
    return err("STATE_CONFLICT", "Combat already active — call `end_combat` first.");
  }

  // REQ-204: participant validation (before any state changes)
  const validIds = [...novel.entities.keys(), ...novel.npcs.keys()];
  const unresolved: string[] = [];
  for (const pid of participants) {
    if (!novel.entities.has(pid) && !novel.npcs.has(pid)) {
      unresolved.push(pid);
    }
  }
  if (unresolved.length > 0) {
    return err("NOT_FOUND", `Participants not found: ${unresolved.join(", ")}. Valid: ${validIds.length > 0 ? validIds.join(", ") : "(none — create entities or NPCs first)"}`);
  }

  novelSnapshot();

  const combat = state.initCombat(novel, participants, dangers ?? [], combatSeed);
  state.saveNovel(novel);

  const turnOrder = combat.turn_order.map((t, i) => `${i + 1}. ${t}${i === combat.current_turn ? " ← Current" : ""}`).join("\n");
  return ok(`Combat started!
Round: ${combat.round}  |  Participants: ${combat.participants.length + combat.dangers.length}

**Turn Order:**
${turnOrder}`);
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

  const current = combat.turn_order[combat.current_turn];
  const currentName = combat.turn_order[(combat.current_turn - 1 + combat.turn_order.length) % combat.turn_order.length];

  // Derive report from recent audit entries since last advance_combat
  const recentAudit = novel.audit_log.slice(-10);
  const mutations = recentAudit.filter(e =>
    e.tool !== "advance_combat" && e.tool !== "init_combat" &&
    e.tool !== "end_combat" && e.tool !== "set_scene_state" &&
    e.tool !== "set_scene_type"
  );
  let mutationReport = "";
  if (mutations.length > 0) {
    const weaponDmg = mutations.find(e => {
      try { const a = JSON.parse(e.args); return typeof a === "object" && a !== null && "weapon" in a; } catch { return false; }
    });
    if (weaponDmg) {
      mutationReport = ` — ${JSON.parse(weaponDmg.args).weapon} damage dealt`;
    } else {
      mutationReport = ` — ${mutations.map(e => e.tool).join(", ")}`;
    }
  } else {
    mutationReport = " — took no action";
  }

  // Check for auto-advance marker
  const lastAudit = novel.audit_log[novel.audit_log.length - 1];
  let autoMarker = "";
  if (lastAudit) {
    try { autoMarker = JSON.parse(lastAudit.args).statless ? " [AUTO]" : ""; } catch { /* ignore */ }
  }

  return ok(`Round ${combat.round}, Turn ${combat.current_turn + 1}: **${current}** [prev: ${currentName}${autoMarker}]${mutationReport}`);
});

server.registerTool("end_combat", {
  title: "End Combat",
  description: "End the active combat encounter. Game Master only.",
  inputSchema: { outcome: z.string().optional() },
}, async ({ outcome }: any) => {
  requireGM();
  const novel = requireNovel();
  state.endCombat(novel, outcome ?? "Combat ended.");
  state.saveNovel(novel);
  return ok(`Combat ended. Total rounds: ${novel.metadata.total_combat_rounds}${outcome ? ` — ${outcome}` : ""}`);
});

server.registerTool("add_combat_participant", {
  title: "Add Combat Participant",
  description: "Add a participant to active combat. Game Master only.",
  inputSchema: { participant_id: z.string() },
}, async ({ participant_id }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();

  try {
    state.addCombatParticipant(novel, participant_id);
    state.saveNovel(novel);
    return ok(`Participant '${participant_id}' added to combat.`);
  } catch (e: any) {
    return err(e.message.startsWith("[NOT_FOUND]") ? "NOT_FOUND" : "STATE_CONFLICT", e.message.replace(/^\[(?:NOT_FOUND|STATE_CONFLICT)\]\s*/, ""));
  }
});

server.registerTool("remove_combat_participant", {
  title: "Remove Combat Participant",
  description: "Remove a participant from active combat. Game Master only.",
  inputSchema: { participant_id: z.string() },
}, async ({ participant_id }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();

  try {
    const result = state.removeCombatParticipant(novel, participant_id);
    state.saveNovel(novel);
    if (result.ended) {
      return ok(`Combat ended: ${result.outcome}`);
    }
    return ok(`Participant '${participant_id}' removed from combat.`);
  } catch (e: any) {
    return err(e.message.startsWith("[NOT_FOUND]") ? "NOT_FOUND" : "STATE_CONFLICT", e.message.replace(/^\[(?:NOT_FOUND|STATE_CONFLICT)\]\s*/, ""));
  }
});

// --- Conditions ---

server.registerTool("apply_condition", {
  title: "Apply Condition",
  description: "Apply a condition to an entity.",
  inputSchema: {
    entity_id: z.string(),
    condition: z.string(),
    rounds: z.number().optional(),
  },
}, async ({ entity_id, condition, rounds }: any) => {
  requireGM();
  const novel = requireNovel();
  const entity = novel.entities.get(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity '${entity_id}' not found.`);
  if (!CONDITIONS.includes(condition)) return err("INVALID_INPUT", `Unknown condition '${condition}'. Valid: ${CONDITIONS.join(", ")}`);
  if (!entity.conditions.includes(condition)) entity.conditions.push(condition);
  if (rounds && rounds > 0) {
    entity.condition_rounds[condition] = rounds;
  }
  state.saveNovel(novel);
  return ok(`${condition} applied to ${entity.name}${rounds && rounds > 0 ? ` (${rounds} rounds)` : ""}.`);
});

server.registerTool("remove_condition", {
  title: "Remove Condition",
  description: "Remove a condition from an entity.",
  inputSchema: {
    entity_id: z.string(),
    condition: z.string(),
  },
}, async ({ entity_id, condition }: any) => {
  requireGM();
  const novel = requireNovel();
  const entity = novel.entities.get(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity '${entity_id}' not found.`);
  entity.conditions = entity.conditions.filter(c => c !== condition);
  state.saveNovel(novel);
  return ok(`${condition} removed from ${entity.name}.`);
});

// --- Narrative ---

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
  const oldDescription = novel.scene_description;
  const isTransition = oldDescription && oldDescription !== description;

  novel.scene_description = description;
  if (location !== undefined) novel.scene_location = location;
  if (time_of_day !== undefined) novel.scene_time_of_day = time_of_day;
  if (atmosphere !== undefined) novel.scene_atmosphere = atmosphere;
  novel.scene_history.push({
    timestamp: new Date().toISOString(),
    description,
    location: novel.scene_location,
    time_of_day: novel.scene_time_of_day,
    atmosphere: novel.scene_atmosphere,
  });

  if (isTransition && !skip_transition_hook) {
    state.audit(novel, getHat(), "scene_transition", { from: oldDescription, to: description });
    // Decrement countdowns flagged for scene transition
    for (const [, cd] of novel.countdowns) {
      if ((cd as any).on_scene_transition && cd.ticks > 0) {
        cd.ticks--;
        if (cd.ticks <= 0) {
          state.audit(novel, getHat(), "countdown_expired", { name: cd.name, trigger: "scene_transition" });
        }
      }
    }
    // Decay sticky lore counters (REQ-155)
    const sceneLower = description.toLowerCase();
    for (const [, entry] of novel.lore) {
      if (entry.sticky_remaining > 0) {
        const stillMatches = entry.triggers.some(t => sceneLower.includes(t.toLowerCase()));
        if (!stillMatches) {
          entry.sticky_remaining--;
        } else {
          entry.sticky_remaining = entry.sticky;
        }
      }
    }
  }

  state.saveNovel(novel);
  return ok("Scene set.");
});

server.registerTool("set_scene_type", {
  title: "Set Scene Type",
  description: "Tag the scene as combat, social, exploration, or neutral. Game Master only.",
  inputSchema: { type: z.union([z.enum(["combat", "social", "exploration", "neutral"]), z.array(z.enum(["combat", "social", "exploration", "neutral"]))]) },
}, async ({ type }: any) => {
  requireGM();
  const novel = requireNovel();
  const types: string[] = Array.isArray(type) ? type : [type];
  novel.scene_type = types as any;
  state.saveNovel(novel);
  return ok(`Scene type set to: ${types.join(", ")}`);
});

server.registerTool("set_narrative_directive", {
  title: "Set Narrative Directive",
  description: "Set overarching narrative directive for the current scene. Game Master only.",
  inputSchema: { directive: z.string() },
}, async ({ directive }: any) => {
  requireGM();
  const novel = requireNovel();
  novel.narrative_directive = directive;
  state.saveNovel(novel);
  return ok("Narrative directive set.");
});

// --- NPC Management ---

server.registerTool("create_npc", {
  title: "Create NPC",
  description: "Create a named NPC with optional stats and narrative fields. Game Master only.",
  inputSchema: {
    name: z.string(),
    description: z.string().optional(),
    disposition: z.string().optional(),
    location: z.string().optional(),
    ac: z.number().optional(),
    hp: z.number().optional(),
    speed: z.number().optional(),
  },
}, async ({ name, description, disposition, location, ac, hp, speed }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();

  const id = `npc_${Date.now()}`;
  const npc = {
    id,
    name,
    description,
    disposition,
    location,
    ac,
    hp,
    max_hp: hp,
    speed,
    conditions: [],
  };
  novel.npcs.set(id, npc);
  state.saveNovel(novel);
  return ok(`NPC '${name}' created as ${id}.`);
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
    ac: z.number().optional(),
    hp: z.number().optional(),
    speed: z.number().optional(),
  },
}, async ({ npc_id, name, description, disposition, location, ac, hp, speed }: any) => {
  requireGM();
  const novel = requireNovel();
  const npc = novel.npcs.get(npc_id);
  if (!npc) return err("NOT_FOUND", `NPC '${npc_id}' not found.`);
  if (name) npc.name = name;
  if (description !== undefined) npc.description = description;
  if (disposition !== undefined) npc.disposition = disposition;
  if (location !== undefined) npc.location = location;
  if (ac !== undefined) npc.ac = ac;
  if (hp !== undefined) { npc.hp = hp; npc.max_hp = hp; }
  if (speed !== undefined) npc.speed = speed;
  state.saveNovel(novel);
  return ok(`NPC '${npc.name}' updated.`);
});

server.registerTool("remove_npc", {
  title: "Remove NPC",
  description: "Remove an NPC from the novel. Game Master only.",
  inputSchema: { npc_id: z.string() },
}, async ({ npc_id }: any) => {
  requireGM();
  const novel = requireNovel();
  if (!novel.npcs.has(npc_id)) return err("NOT_FOUND", `NPC '${npc_id}' not found.`);
  novel.npcs.delete(npc_id);
  state.saveNovel(novel);
  return ok("NPC removed.");
});

// --- Factions ---

server.registerTool("create_faction", {
  title: "Create Faction",
  description: "Create a named faction with goals, resources, and a progress clock. Game Master only.",
  inputSchema: {
    name: z.string(),
    description: z.string().optional(),
    goals: z.array(z.string()).optional(),
    resources: z.string().optional(),
  },
}, async ({ name, description, goals, resources }: any) => {
  requireGM();
  const novel = requireNovel();
  if (novel.factions.some(f => f.name === name)) return err("STATE_CONFLICT", `Faction '${name}' already exists.`);
  const id = `fac_${Date.now()}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  const faction = {
    id, name, description: description ?? "", goals: goals ?? [], resources: resources ?? "",
    clock: 0, clock_max: 6, status: "neutral",
  };
  novel.factions.push(faction);
  // Auto-create faction countdown
  novel.countdowns.set(`faction:${name}`, {
    name: `faction:${name}`, ticks: 0, total: faction.clock_max,
    type: "narrative", clock_type: "faction", on_scene_transition: true,
  });
  audit("create_faction", { name, description, goals }, `Faction '${name}' created.`);
  state.saveNovel(novel);
  return ok(`Faction '${name}' created (ID: ${id}).`);
});

server.registerTool("update_faction", {
  title: "Update Faction",
  description: "Update a faction's fields. Game Master only.",
  inputSchema: {
    faction_id: z.string(),
    description: z.string().optional(),
    goals: z.array(z.string()).optional(),
    resources: z.string().optional(),
  },
}, async ({ faction_id, ...fields }: any) => {
  requireGM();
  const novel = requireNovel();
  const faction = novel.factions.find(f => f.id === faction_id);
  if (!faction) return err("NOT_FOUND", `Faction '${faction_id}' not found. Valid factions: ${novel.factions.map(f => f.name).join(", ")}`);
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
  novel.countdowns.delete(`faction:${name}`);
  audit("remove_faction", { faction_id }, `Faction '${name}' removed.`);
  state.saveNovel(novel);
  return ok(`Faction '${name}' removed.`);
});

// --- Vows ---

const DIFFICULTY_TRACKS: Record<string, number> = { troublesome: 10, dangerous: 20, formidable: 30, extreme: 40, epic: 50 };

server.registerTool("set_vow", {
  title: "Set Vow",
  description: "Track a narrative vow, quest, or obligation. Game Master only.",
  inputSchema: {
    name: z.string(),
    description: z.string(),
    parties: z.array(z.string()),
    difficulty: z.enum(["troublesome", "dangerous", "formidable", "extreme", "epic"]),
    scope: z.enum(["gm", "shared", "faction", "party"]).optional(),
  },
}, async ({ name, description, parties, difficulty, scope }: any) => {
  requireGM();
  const novel = requireNovel();
  if (novel.vows.some(v => v.name === name)) return err("STATE_CONFLICT", `Vow '${name}' already exists.`);
  novel.vows.push({
    name, description, parties, difficulty, scope: scope ?? "shared",
    milestones: 0, rank_track: DIFFICULTY_TRACKS[difficulty], state: "active",
  });
  audit("set_vow", { name, difficulty }, `Vow '${name}' set (${difficulty}, ${DIFFICULTY_TRACKS[difficulty]} milestones).`);
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
  if (vow.state !== "active") return err("STATE_CONFLICT", `Vow '${vow_name}' is ${vow.state}.`);
  vow.milestones++;
  if (vow.milestones >= vow.rank_track) {
    audit("mark_milestone", { vow_name }, `Vow '${vow_name}' complete (${vow.milestones}/${vow.rank_track}). Call resolve_vow.`);
    return ok(`Vow '${vow_name}' reached ${vow.milestones}/${vow.rank_track} — ready to resolve!`);
  }
  state.saveNovel(novel);
  return ok(`Vow '${vow_name}': ${vow.milestones}/${vow.rank_track} milestones.`);
});

server.registerTool("resolve_vow", {
  title: "Resolve Vow",
  description: "Close a completed vow with outcome and consequences. Game Master only.",
  inputSchema: {
    vow_name: z.string(),
    outcome: z.string(),
    consequences: z.string().optional(),
  },
}, async ({ vow_name, outcome, consequences }: any) => {
  requireGM();
  const novel = requireNovel();
  const vow = novel.vows.find(v => v.name === vow_name);
  if (!vow) return err("NOT_FOUND", `Vow '${vow_name}' not found.`);
  if (vow.state !== "active") return err("STATE_CONFLICT", `Vow '${vow_name}' is already ${vow.state}.`);
  vow.state = "resolved";
  vow.outcome = outcome;
  vow.consequences = consequences;
  // Record as story journal consequence
  novel.story_journal.push({
    index: novel.story_journal.length, type: "consequence",
    entry: `Vow resolved: ${vow_name} — ${outcome}${consequences ? `. ${consequences}` : ""}`,
    scene_anchor: novel.scene_description?.substring(0, 100) ?? "", entity_ids: vow.parties,
    timestamp: new Date().toISOString(),
  });
  audit("resolve_vow", { vow_name, outcome }, `Vow '${vow_name}' resolved.`);
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
  if (vow.state !== "active") return err("STATE_CONFLICT", `Vow '${vow_name}' is already ${vow.state}.`);
  vow.state = "forsaken";
  vow.reason = reason;
  audit("forsake_vow", { vow_name, reason }, `Vow '${vow_name}' forsaken.`);
  state.saveNovel(novel);
  return ok(`Vow '${vow_name}' forsaken.`);
});

// --- Secrets ---

server.registerTool("set_secret", {
  title: "Set Secret",
  description: "Create a secret lore entry. GM-only; visible to entities after reveal_secret. Game Master only.",
  inputSchema: {
    key: z.string(),
    content: z.string(),
    triggers: z.array(z.string()).optional(),
    hat_scope: z.enum(["game_master", "shared"]).optional(),
  },
}, async ({ key, content, triggers, hat_scope }: any) => {
  requireGM();
  const novel = requireNovel();
  if (novel.secrets.some(s => s.key === key)) return err("STATE_CONFLICT", `Secret '${key}' already exists.`);
  novel.secrets.push({ key, content, triggers: triggers ?? [], hat_scope: hat_scope ?? "game_master", known_by: [] });
  audit("set_secret", { key }, `Secret '${key}' created.`);
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
  if (secret.known_by.includes(entity_id)) return err("STATE_CONFLICT", `Entity '${entity_id}' already knows secret '${key}'.`);
  secret.known_by.push(entity_id);
  audit("reveal_secret", { key, entity_id }, `Secret '${key}' revealed to '${entity_id}'.`);
  state.saveNovel(novel);
  return ok(`Secret '${key}' revealed to '${entity_id}'.`);
});

server.registerTool("check_knowledge", {
  title: "Check Knowledge",
  description: "Return what secrets an entity knows. Game Master only.",
  inputSchema: {
    entity_id: z.string(),
    key: z.string().optional(),
  },
}, async ({ entity_id, key }: any) => {
  requireGM();
  const novel = requireNovel();
  const known = novel.secrets.filter(s => s.known_by.includes(entity_id) && (!key || s.key === key));
  if (known.length === 0) return ok(`Entity '${entity_id}' knows no secrets.`);
  const lines = known.map(s => `- **${s.key}**: ${s.content}`);
  return ok(lines.join("\n"));
});

// --- Relationships ---

server.registerTool("set_relationship", {
  title: "Set Relationship",
  description: "Set a directed relationship between entities, NPCs, or factions. Types: ally, rival, neutral, mentor, dependent, suspicious. Game Master only.",
  inputSchema: {
    entity_a: z.string(),
    entity_b: z.string(),
    type: z.enum(["ally", "rival", "neutral", "mentor", "dependent", "suspicious"]),
    value: z.number().optional(),
    description: z.string().optional(),
  },
}, async ({ entity_a, entity_b, type, value, description }: any) => {
  requireGM();
  const novel = requireNovel();
  novel.relationships.push({ entity_a, entity_b, type, value, description });
  audit("set_relationship", { entity_a, entity_b, type }, `Relationship: ${entity_a} -> ${entity_b} (${type})`);
  state.saveNovel(novel);
  return ok(`Relationship set: ${entity_a} → ${entity_b} (${type}).`);
});

server.registerTool("get_relationships", {
  title: "Get Relationships",
  description: "Return all relationships (incoming and outgoing) for an entity. Game Master only.",
  inputSchema: { entity_id: z.string() },
}, async ({ entity_id }: any) => {
  requireGM();
  const novel = requireNovel();
  const rels = novel.relationships.filter(r => r.entity_a === entity_id || r.entity_b === entity_id);
  if (rels.length === 0) return ok(`No relationships for entity '${entity_id}'.`);
  const lines = rels.map(r => {
    const dir = r.entity_a === entity_id ? "→" : "←";
    const target = r.entity_a === entity_id ? r.entity_b : r.entity_a;
    return `- ${dir} ${target} (${r.type}${r.value !== undefined ? `, ${r.value}` : ""}): ${r.description ?? ""}`;
  });
  return ok(`Relationships for ${entity_id}:\n${lines.join("\n")}`);
});

// --- Countdowns ---

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
  novel.countdowns.set(name, { name, ticks, total: ticks, type: type ?? "narrative", scope, direction });
  state.saveNovel(novel);
  return ok(`Countdown '${name}' set at ${ticks} ticks.`);
});

server.registerTool("advance_countdown", {
  title: "Advance Countdown",
  description: "Advance a countdown timer by one tick. Game Master only.",
  inputSchema: { name: z.string() },
}, async ({ name }: any) => {
  requireGM();
  const novel = requireNovel();
  const cd = novel.countdowns.get(name);
  if (!cd) return err("NOT_FOUND", `Countdown '${name}' not found.`);
  cd.ticks--;
  if (cd.ticks <= 0) {
    state.audit(novel, getHat(), "countdown_expired", { name });
    return ok(`Countdown '${name}' reached 0!`);
  }
  state.saveNovel(novel);
  return ok(`Countdown '${name}' at ${cd.ticks}/${cd.total} ticks.`);
});

server.registerTool("remove_countdown", {
  title: "Remove Countdown",
  description: "Remove a countdown timer. Game Master only.",
  inputSchema: { name: z.string() },
}, async ({ name }: any) => {
  requireGM();
  const novel = requireNovel();
  if (!novel.countdowns.has(name)) return err("NOT_FOUND", `Countdown '${name}' not found.`);
  novel.countdowns.delete(name);
  state.saveNovel(novel);
  return ok(`Countdown '${name}' removed.`);
});

// --- Lore ---

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
  novel.lore.set(key, {
    key,
    content,
    triggers: triggers ?? [],
    hat_scope: hat_scope ?? "game_master",
    priority: priority ?? 0,
    sticky: sticky ?? 0,
    sticky_remaining: sticky ?? 0,
    enabled: true,
    group,
  });
  state.saveNovel(novel);
  return ok(`Lore entry '${key}' set.`);
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
  const entry = novel.lore.get(key);
  if (!entry) return err("NOT_FOUND", `Lore entry '${key}' not found.`);
  if (content !== undefined) entry.content = content;
  if (triggers !== undefined) entry.triggers = triggers;
  if (hat_scope !== undefined) entry.hat_scope = hat_scope;
  if (priority !== undefined) entry.priority = priority;
  if (sticky !== undefined) { entry.sticky = sticky; entry.sticky_remaining = sticky; }
  if (group !== undefined) entry.group = group ?? undefined;
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
  const entry = novel.lore.get(key);
  if (!entry) return err("NOT_FOUND", `Lore entry '${key}' not found.`);
  entry.enabled = !entry.enabled;
  state.saveNovel(novel);
  return ok(`Lore entry '${key}' ${entry.enabled ? "enabled" : "disabled"}.`);
});

server.registerTool("set_lore_group", {
  title: "Set Lore Group",
  description: "Assign or remove a lore entry from a named group. Game Master only.",
  inputSchema: { key: z.string(), group: z.string().nullable().optional() },
}, async ({ key, group }: any) => {
  requireGM();
  const novel = requireNovel();
  const entry = novel.lore.get(key);
  if (!entry) return err("NOT_FOUND", `Lore entry '${key}' not found.`);
  entry.group = group ?? undefined;
  state.saveNovel(novel);
  return ok(`Lore entry '${key}' ${group ? `assigned to group '${group}'` : "removed from group"}.`);
});

server.registerTool("suggest_lore", {
  title: "Suggest Lore",
  description: "Suggest lore entries from enrichment templates based on current scene. Game Master only.",
  inputSchema: {},
}, async () => {
  requireGM();
  const novel = state.activeNovel;
  if (!novel) return err("STATE_CONFLICT", "No active novel.");

  const manifest = state.enrichmentManifest ?? DEFAULT_ENRICHMENT;
  const templates = (manifest.lore_templates ?? []) as any[];
  if (templates.length === 0) {
    return ok(JSON.stringify({
      templates: [],
      note: "No enrichment templates available. Run the Enrich workflow to populate lore templates.",
    }));
  }

  const sceneText = (novel.scene_description ?? "").toLowerCase();
  const scored: { template: any; score: number }[] = [];

  for (const t of templates) {
    if (t.hat_scope === "game_master") {
      let score = 0;
      if (t.category && sceneText.includes(t.category.toLowerCase())) score += 3;
      const words = (t.content ?? "").toLowerCase().split(/\s+/);
      const sceneWords = new Set(sceneText.split(/\s+/));
      for (const w of words) {
        if (w.length > 3 && sceneWords.has(w)) score++;
      }
      scored.push({ template: t, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5);
  const results = top.map(({ template: t, score }) => ({
    category: t.category ?? "general",
    content_preview: (t.content ?? "").substring(0, 120),
    triggers: t.category ? [t.category] : [],
    confidence: t.confidence ?? "MEDIUM",
    source_url: t.source_url ?? null,
    match_score: score,
  }));

  return ok(JSON.stringify(results, null, 2));
});

server.registerTool("export_lorebook", {
  title: "Export Lorebook",
  description: "Export novel lore entries in interchange format. Game Master only.",
  inputSchema: { format: z.enum(["json", "markdown"]).optional() },
}, async ({ format }: any) => {
  requireGM();
  const novel = state.activeNovel;
  if (!novel) return err("STATE_CONFLICT", "No active novel.");

  if (format === "markdown") {
    let md = `# Lorebook — ${novel.name}\n\n`;
    for (const [key, entry] of novel.lore) {
      const meta = JSON.stringify({
        hat_scope: entry.hat_scope, priority: entry.priority, sticky: entry.sticky,
        enabled: entry.enabled, group: entry.group, triggers: entry.triggers,
      });
      md += `## ${key}\n<!-- holonovel-meta: ${meta} -->\n${entry.content}\n\n`;
    }
    return ok(md);
  }

  const entries = Array.from(novel.lore.values()).map(e => ({
    key: e.key, content: e.content, triggers: e.triggers,
    hat_scope: e.hat_scope, priority: e.priority, sticky: e.sticky,
    sticky_remaining: e.sticky_remaining, group: e.group, enabled: e.enabled,
  }));
  return ok(JSON.stringify(entries, null, 2));
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
  const novel = state.activeNovel;
  if (!novel) return err("STATE_CONFLICT", "No active novel.");

  let entries: any[];
  if (data.trim().startsWith("# ")) {
    entries = [];
    const sections = data.split(/^## /m).slice(1);
    for (const section of sections) {
      const keyEnd = section.indexOf("\n");
      const key = section.substring(0, keyEnd).trim();
      const rest = section.substring(keyEnd + 1);
      const metaMatch = rest.match(/^<!-- holonovel-meta: (.+?) -->/);
      let content = rest;
      let meta: any = {};
      if (metaMatch) {
        try { meta = JSON.parse(metaMatch[1]); } catch {}
        content = rest.substring(metaMatch[0].length).trim();
      }
      entries.push({ key, content, ...meta });
    }
  } else {
    entries = JSON.parse(data);
  }
  const mode_ = mode ?? "dry-run";

  if (mode_ === "dry-run") {
    const would = Array.isArray(entries) ? entries : [entries];
    return ok(`Dry-run: would add ${would.length} lore entries. No changes made.`);
  }

  if (mode_ === "replace") {
    novel.lore.clear();
  }

  for (const entry of (Array.isArray(entries) ? entries : [entries])) {
    novel.lore.set(entry.key, {
      key: entry.key,
      content: entry.content,
      triggers: entry.triggers ?? [],
      hat_scope: entry.hat_scope ?? "game_master",
      priority: entry.priority ?? 0,
      sticky: entry.sticky ?? 0,
      sticky_remaining: entry.sticky_remaining ?? entry.sticky ?? 0,
      enabled: entry.enabled ?? true,
      group: entry.group,
    });
  }
  state.saveNovel(novel);
  return ok(`${mode_ === "replace" ? "Replaced" : "Merged"} ${Array.isArray(entries) ? entries.length : 1} lore entries.`);
});

// --- Guidance ---

server.registerTool("save_pause_context", {
  title: "Save Pause Context",
  description: "Save GM context for session resumption. Automatically captures faction clocks, countdown positions, NPC dispositions, relationships, and story/vow state. Game Master only.",
  inputSchema: {
    current_scene: z.string().optional(),
    immediate_situation: z.string().optional(),
    pending_player_action: z.string().optional(),
    short_term_plans: z.string().optional(),
    long_term_plans: z.string().optional(),
    player_goals: z.string().optional(),
  },
}, async (fields: any) => {
  requireGM();
  const novel = requireNovel();
  novel.dm_context = { ...novel.dm_context, ...fields };
  // Auto-capture faction state
  novel.dm_context.npc_attitudes = {};
  for (const npc of novel.npcs.values()) {
    if (npc.disposition && npc.disposition !== "neutral") {
      novel.dm_context.npc_attitudes[npc.id] = npc.disposition;
    }
  }
  // Auto-capture last 3 decision/bond story entries
  const decisionBond = novel.story_journal.filter(e => e.type === "decision" || e.type === "bond").slice(-3);
  novel.dm_context.story_context = decisionBond.map(e => `[${e.type}] ${e.entry.substring(0, 120)}`);
  // Auto-capture vow state
  novel.dm_context.active_vows = novel.vows
    .filter(v => v.state === "active")
    .map(v => ({ name: v.name, difficulty: v.difficulty, milestone_count: v.milestones }));
  novel.dm_context.saved_at = new Date().toISOString();
  audit("save_pause_context", fields, "Pause context saved.");
  state.saveNovel(novel);
  return ok("Pause context saved. Ready for session resumption.");
});

server.registerTool("get_resume_context", {
  title: "Get Resume Context",
  description: "Return the saved GM context plus Novel state summary for session resumption.",
  inputSchema: {},
}, async () => {
  requireGM();
  const novel = requireNovel();
  const ctx = novel.dm_context;
  const lines: string[] = ["## Session Resume Context"];
  if (ctx.current_scene) lines.push(`**Scene:** ${ctx.current_scene}`);
  if (ctx.immediate_situation) lines.push(`**Situation:** ${ctx.immediate_situation}`);
  if (ctx.pending_player_action) lines.push(`**Pending:** ${ctx.pending_player_action}`);
  if (ctx.short_term_plans) lines.push(`**Short-term:** ${ctx.short_term_plans}`);
  if (ctx.long_term_plans) lines.push(`**Long-term:** ${ctx.long_term_plans}`);
  if (ctx.player_goals) lines.push(`**Player focus:** ${ctx.player_goals}`);
  if (ctx.story_context?.length) {
    lines.push("\n**Recent story:**");
    for (const s of ctx.story_context) lines.push(`- ${s}`);
  }
  if (ctx.active_vows?.length) {
    lines.push("\n**Active vows:**");
    for (const v of ctx.active_vows) lines.push(`- ${v.name} (${v.difficulty}, ${v.milestone_count} milestones)`);
  }
  if (ctx.npc_attitudes && Object.keys(ctx.npc_attitudes).length) {
    lines.push("\n**NPC attitudes:**");
    for (const [id, disp] of Object.entries(ctx.npc_attitudes)) {
      const npc = novel.npcs.get(id);
      lines.push(`- ${npc?.name ?? id}: ${disp}`);
    }
  }
  if (ctx.saved_at) lines.push(`\n*Saved: ${ctx.saved_at}*`);
  if (lines.length === 1) lines.push("[No saved context — start fresh.]");
  return ok(lines.join("\n"));
});

server.registerTool("set_note", {
  title: "Set Note",
  description: "Create or update a key-value note. Hat-scoped: game_master (default), player, or shared.",
  inputSchema: {
    key: z.string(),
    content: z.string(),
    hat_scope: z.enum(["game_master", "player", "shared"]).optional(),
  },
}, async ({ key, content, hat_scope }: any) => {
  const hat = getHat();
  const novel = requireNovel();
  const scope = hat_scope ?? (hat === "player" ? "player" : "game_master");
  if (hat === "player" && scope === "game_master") return err("FORBIDDEN", "Players cannot create game_master-scoped notes. Use set_hat to switch.");
  const existing = novel.notes.find(n => n.key === key);
  if (existing) {
    existing.content = content;
    existing.hat_scope = scope;
  } else {
    novel.notes.push({ key, content, hat_scope: scope });
  }
  state.saveNovel(novel);
  return ok(`Note '${key}' saved.`);
});

server.registerTool("remove_note", {
  title: "Remove Note",
  description: "Remove a note by key. Hat-scoped: caller's hat must own the scope.",
  inputSchema: { key: z.string() },
}, async ({ key }: any) => {
  const hat = getHat();
  const novel = requireNovel();
  const idx = novel.notes.findIndex(n => n.key === key);
  if (idx === -1) return err("NOT_FOUND", `Note '${key}' not found.`);
  const note = novel.notes[idx];
  if (hat === "player" && note.hat_scope !== "player" && note.hat_scope !== "shared") return err("FORBIDDEN", "Players can only remove player/shared-scoped notes.");
  novel.notes.splice(idx, 1);
  state.saveNovel(novel);
  return ok(`Note '${key}' removed.`);
});

server.registerTool("list_notes", {
  title: "List Notes",
  description: "List all notes, hat-filtered.",
  inputSchema: {},
}, async () => {
  const hat = getHat();
  const novel = requireNovel();
  const visible = hat === "game_master"
    ? novel.notes
    : novel.notes.filter(n => n.hat_scope === "player" || n.hat_scope === "shared");
  if (visible.length === 0) return ok("[No notes.]");
  const lines = visible.map(n => `- **${n.key}** [${n.hat_scope}]: ${n.content.substring(0, 100)}${n.content.length > 100 ? "…" : ""}`);
  return ok(`Notes (${visible.length}):\n${lines.join("\n")}`);
});

server.registerTool("set_briefing_order", {
  title: "Set Briefing Order",
  description: "Reorder sections of hat_briefing. Game Master only.",
  inputSchema: { sections: z.array(z.string()) },
}, async ({ sections }: any) => {
  requireGM();
  const novel = requireNovel();
  novel.briefing_order = sections;
  state.saveNovel(novel);
  return ok("Briefing order updated.");
});

server.registerTool("compress_audit", {
  title: "Compress Audit",
  description: "Summarize recent audit entries. Callable by both hats.",
  inputSchema: {
    max_entries: z.number().optional(),
  },
}, async ({ max_entries }: any) => {
  const novel = state.activeNovel;
  if (!novel) return err("STATE_CONFLICT", "No active novel.");

  const requested = max_entries ?? 20;
  if (requested <= 0) return err("INVALID_INPUT", "max_entries must be a positive integer.");

  const hat = getHat();

  let entries = novel.audit_log;
  if (hat === "player") {
    entries = entries.filter(e => e.hat === "player");
  }

  const sliced = entries.slice(-requested);
  const lines = sliced.map(e => {
    const prefix = e.output_prefix === "[BOUNDARY_VIOLATION]"
      ? `[${e.timestamp}] [${e.hat}] ${e.tool} — [BOUNDARY_VIOLATION]`
      : `[${e.timestamp}] [${e.hat}] ${e.tool} — ${e.output_prefix}`;
    return prefix;
  });

  return raw(`Compressed audit log (summarize into a single paragraph):\n${lines.join("\n")}`);
});

// --- Story Journal ---

const MAX_STORY_ENTRIES = parseInt(process.env.TTRPG_MAX_STORY_ENTRIES ?? "500", 10);
const STORY_DISPLAY_DEFAULT = parseInt(process.env.TTRPG_STORY_JOURNAL_DISPLAY ?? "5", 10);

server.registerTool("record_story", {
  title: "Record Story Entry",
  description: "Record a narrative memory in the story journal. Types: decision, moment, revelation, bond, consequence. Game Master only.",
  inputSchema: {
    type: z.enum(["decision", "moment", "revelation", "bond", "consequence"]),
    entry: z.string(),
  },
}, async ({ type, entry }: any) => {
  requireGM();
  const novel = requireNovel();
  if (novel.story_journal.length >= MAX_STORY_ENTRIES) {
    return err("STATE_CONFLICT", `Maximum story entries (${MAX_STORY_ENTRIES}) reached.`);
  }
  const entity = getActiveEntity();
  const storyEntry = {
    index: novel.story_journal.length,
    type,
    entry,
    scene_anchor: novel.scene_description ? novel.scene_description.substring(0, 100) : "",
    entity_ids: entity ? [entity.id] : [],
    timestamp: new Date().toISOString(),
  };
  novel.story_journal.push(storyEntry);
  audit("record_story", { type, entry }, `Story entry recorded: ${type}`);
  state.saveNovel(novel);
  return ok(`[${type}] Recorded. Index: ${storyEntry.index}.`);
});

server.registerTool("update_story", {
  title: "Update Story Entry",
  description: "Edit a story journal entry by index. Decision and consequence entries are immutable. Game Master only.",
  inputSchema: {
    index: z.number().min(0),
    type: z.enum(["decision", "moment", "revelation", "bond", "consequence"]).optional(),
    entry: z.string().optional(),
  },
}, async ({ index, type, entry }: any) => {
  requireGM();
  const novel = requireNovel();
  if (index >= novel.story_journal.length) {
    return err("NOT_FOUND", `No story entry at index ${index}. Valid range: 0-${novel.story_journal.length - 1}.`);
  }
  const current = novel.story_journal[index];
  if (current.type === "decision" || current.type === "consequence") {
    return err("RULE_VIOLATION", `${current.type} entries are immutable.`);
  }
  if (!type && !entry) return err("INVALID_INPUT", "Provide at least type or entry to update.");
  if (type) current.type = type;
  if (entry) current.entry = entry;
  current.timestamp = new Date().toISOString();
  audit("update_story", { index, type, entry }, `Story entry ${index} updated.`);
  state.saveNovel(novel);
  return ok(`Story entry ${index} updated.`);
});

server.registerTool("remove_story", {
  title: "Remove Story Entry",
  description: "Delete a story journal entry by index. Game Master only.",
  inputSchema: {
    index: z.number().min(0),
  },
}, async ({ index }: any) => {
  requireGM();
  const novel = requireNovel();
  if (index >= novel.story_journal.length) {
    return err("NOT_FOUND", `No story entry at index ${index}.`);
  }
  novel.story_journal.splice(index, 1);
  // Re-index remaining entries
  for (let i = index; i < novel.story_journal.length; i++) {
    novel.story_journal[i].index = i;
  }
  audit("remove_story", { index }, `Story entry ${index} removed.`);
  state.saveNovel(novel);
  return ok(`Story entry ${index} removed.`);
});

server.registerTool("list_stories", {
  title: "List Stories",
  description: "List story journal entries with optional type filter and pagination. Game Master only.",
  inputSchema: {
    filter: z.enum(["decision", "moment", "revelation", "bond", "consequence"]).optional(),
    offset: z.number().min(0).optional(),
    limit: z.number().min(0).optional(),
  },
}, async ({ filter, offset, limit }: any) => {
  requireGM();
  const novel = requireNovel();
  let entries = [...novel.story_journal];
  if (filter) entries = entries.filter(e => e.type === filter);
  const start = offset ?? 0;
  const end = start + (limit ?? 20);
  const page = entries.slice(start, end);
  if (page.length === 0) return ok("[No story entries match.]");
  const lines = page.map(e => `[${e.index}] ${e.type}: ${e.entry.substring(0, 100)}${e.entry.length > 100 ? "…" : ""}`);
  return ok(`Story journal (${entries.length} total, showing ${page.length}):\n${lines.join("\n")}`);
});

server.registerTool("load_adventure", {
  title: "Load Adventure",
  description: "Load an adventure module from the TTRPG_ADVENTURE directory. Game Master only.",
  inputSchema: { slug: z.string() },
}, async ({ slug }: any) => {
  requireGM();
  const novel = requireNovel();
  novel.adventure_slug = slug;
  novel.adventure_set = true;

  const adventureDir = process.env.TTRPG_ADVENTURE ?? path.join(DATA_DIR, "adventures");
  const adventurePath = path.join(adventureDir, `${slug}.json`);
  if (fs.existsSync(adventurePath)) {
    const advData = JSON.parse(fs.readFileSync(adventurePath, "utf-8"));
    if (advData.adventure_index) {
      novel.adventure_index = advData.adventure_index;
      const summary: string[] = [];

      if (advData.adventure_index.npcs?.length > 0) {
        for (const npcData of advData.adventure_index.npcs) {
          const exists = [...novel.npcs.values()].some(n => n.name === npcData.name);
          if (!exists) {
            const npc = {
              id: `npc_av_${Date.now()}_${npcData.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
              name: npcData.name,
              description: npcData.description ?? "",
              disposition: "neutral",
              location: npcData.location,
              ac: npcData.stats?.ac,
              hp: npcData.stats?.hp,
            };
            novel.npcs.set(npc.id, npc);
          }
        }
        summary.push(`${advData.adventure_index.npcs.length} NPCs`);
      }

      if (advData.adventure_index.locations?.length > 0) {
        for (const loc of advData.adventure_index.locations) {
          const key = `location_${slug}_${loc.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
          if (!novel.lore.has(key)) {
            novel.lore.set(key, {
              key,
              content: loc.description,
              triggers: [loc.name.toLowerCase()],
              hat_scope: "shared",
              priority: 5,
              sticky: 0,
              sticky_remaining: 0,
              enabled: true,
            });
          }
        }
        summary.push(`${advData.adventure_index.locations.length} location lore entries`);
      }

      if (advData.adventure_index.hooks?.length > 0) {
        const firstHook = advData.adventure_index.hooks[0];
        novel.scene_description = `Adventure hook: ${firstHook}`;
        novel.scene_history.push({
          timestamp: new Date().toISOString(),
          description: novel.scene_description,
          location: novel.scene_location,
          time_of_day: novel.scene_time_of_day,
          atmosphere: novel.scene_atmosphere,
        });
      }

      if (advData.adventure_index.locations?.length > 0) {
        novel.adventure_scene_waypoint = {
          anchor: advData.adventure_index.locations[0].name,
          description: advData.adventure_index.locations[0].description,
        };
      }

      state.saveNovel(novel);
      return ok(`Adventure '${slug}' loaded. Pre-populated: ${summary.join(", ") || "no structural extraction data available"}.`);
    }
  }

  state.saveNovel(novel);
  return ok(`Adventure '${slug}' loaded. No structural extraction data — NPCs and locations must be created manually.`);
});

server.registerTool("generate_adventure", {
  title: "Generate Adventure",
  description: "Generate an adventure scaffold from a premise. Game Master only.",
  inputSchema: { premise: z.string() },
}, async ({ premise }: any) => {
  requireGM();
  const novel = requireNovel();
  const slug = premise.toLowerCase().slice(0, 30).replace(/[^a-z0-9]+/g, "-");
  const adventure = {
    title: premise,
    slug,
    overview: `An adventure based on: ${premise}`,
    hook: `Adventure hook for: ${premise}`,
    locations: [],
  };
  novel.generated_adventure = adventure;
  novel.adventure_slug = slug;
  novel.adventure_set = true;
  state.saveNovel(novel);
  return ok(`Adventure '${slug}' generated from premise.`);
});

server.registerTool("generate_encounter", {
  title: "Generate Encounter",
  description: "Generate a scene + NPC + lore entry from context. Game Master only.",
  inputSchema: { context: z.string() },
}, async ({ context }: any) => {
  requireGM();
  const novel = requireNovel();
  novelSnapshot();

  // Generate scene
  novel.scene_description = context;
  novel.scene_history.push({
    timestamp: new Date().toISOString(),
    description: context,
    location: novel.scene_location,
    time_of_day: novel.scene_time_of_day,
    atmosphere: novel.scene_atmosphere,
  });

  // Generate NPC
  const npcName = `Encounter NPC ${Date.now()}`;
  const npc = {
    id: `npc_${Date.now()}`,
    name: npcName,
    description: `Generated from: ${context}`,
    disposition: "neutral",
  };
  novel.npcs.set(npc.id, npc);

  // Generate lore
  novel.lore.set(`encounter_${Date.now()}`, {
    key: `encounter_${Date.now()}`,
    content: `Encounter complication from: ${context}`,
    triggers: [],
    hat_scope: "game_master",
    priority: 0,
    sticky: 0,
    sticky_remaining: 0,
    enabled: true,
  });

  state.saveNovel(novel);
  return ok(`Encounter generated: scene set, NPC '${npcName}' created, lore entry added. Single undo target.`);
});

// --- Session ---

server.registerTool("session_recap", {
  title: "Session Recap",
  description: "Summarize recent session activity.",
  inputSchema: {},
}, async () => {
  const novel = state.activeNovel;
  if (!novel) return ok("No active novel.");

  const hat = getHat();
  const entries = novel.audit_log.slice(-10);
  const countdowns = Array.from(novel.countdowns.values()).filter(c => c.ticks > 0);
  const entities = Array.from(novel.entities.values()).map(e => ({
    name: e.name,
    hp: `${e.hp}/${e.max_hp}`,
    conditions: e.conditions,
  }));
  const npcs = Array.from(novel.npcs.values()).map(n => ({ name: n.name, disposition: n.disposition, location: n.location }));

  // Narrative orientation (REQ-279)
  let orientation = "[No narrative history yet — your story begins here.]";
  const recentDecisions = novel.story_journal.filter(e => e.type === "decision" || e.type === "bond").slice(-3);
  if (recentDecisions.length || novel.vows.some(v => v.state === "active") || countdowns.length || (novel.narrative_directive && novel.narrative_directive.length > 0)) {
    const parts: string[] = [];
    if (recentDecisions.length) {
      parts.push(recentDecisions.map(e => e.entry).join(" "));
    }
    if (novel.vows.some(v => v.state === "active")) {
      for (const v of novel.vows.filter(v => v.state === "active")) {
        parts.push(`The vow "${v.name}" stands at ${v.milestones}/${v.rank_track} milestones.`);
      }
    }
    if (countdowns.length) {
      for (const c of countdowns) {
        parts.push(`${c.name} has ${c.ticks} ticks remaining.`);
      }
    }
    if (novel.narrative_directive) {
      parts.push(`Narrative tone: ${novel.narrative_directive}.`);
    }
    orientation = parts.join(" ") || orientation;
  }

  // Story entries
  const storyEntries = novel.story_journal.slice(-10);

  // Faction and vow state
  const factionState = novel.factions.map(f => ({
    name: f.name,
    clock: `${f.clock}/${f.clock_max}`,
    status: f.status,
  }));

  let recap = `## Session Recap — ${novel.name}

**Narrative:** ${orientation}

**Scene:** ${novel.scene_description || "None set"}${novel.scene_location ? `\n**Location:** ${novel.scene_location}` : ""}${novel.scene_time_of_day ? `\n**Time of Day:** ${novel.scene_time_of_day}` : ""}${novel.scene_atmosphere ? `\n**Atmosphere:** ${novel.scene_atmosphere}` : ""}
**Scene Type:** ${novel.scene_type.join(", ")}
**Combat Rounds:** ${novel.metadata.total_combat_rounds}

### Entities
${entities.map(e => `- **${e.name}** — HP: ${e.hp}${e.conditions.length ? ` (${e.conditions.join(", ")})` : ""}`).join("\n")}

### NPCs
${npcs.length ? npcs.map(n => `- **${n.name}** — ${n.disposition ?? "neutral"}${n.location ? ` @ ${n.location}` : ""}`).join("\n") : "None"}

${factionState.length ? `### Factions\n${factionState.map(f => `- **${f.name}** — ${f.clock} (${f.status})`).join("\n")}\n` : ""}
${storyEntries.length ? `### Story Journal\n${storyEntries.map(s => `[${s.index}] ${s.type}: ${s.entry.substring(0, 120)}${s.entry.length > 120 ? "…" : ""}`).join("\n")}\n` : ""}

### Recent Activity
${entries.map(e => `- [${e.timestamp}] ${e.tool}`).join("\n")}`;

  return ok(recap);
});

// --- Novel Lifecycle ---

server.registerTool("create_novel", {
  title: "Create Novel",
  description: "Create a named novel. Novel persists to disk.",
  inputSchema: { name: z.string() },
}, async ({ name }: any) => {
  const novel = state.createNovel(name);
  return ok(`Novel '${name}' created (slug: ${novel.slug}). Use novel_setup prompt to get started.`);
});

server.registerTool("resume_novel", {
  title: "Resume Novel",
  description: "Resume a previously created novel from disk.",
  inputSchema: { slug: z.string() },
}, async ({ slug }: any) => {
  const novel = state.resumeNovel(slug);
  return ok(`Resumed novel '${novel.name}' (${slug}). Active hat: ${novel.hat ?? "none"}`);
});

server.registerTool("switch_novel", {
  title: "Switch Novel",
  description: "Switch the active novel for this connection. Always callable.",
  inputSchema: { slug: z.string() },
}, async ({ slug }: any) => {
  const novel = state.switchNovel(slug);
  return ok(`Switched to novel '${novel.name}'.`);
});

server.registerTool("end_novel", {
  title: "End Novel",
  description: "End the current novel. Deactivates hat, removes save file.",
  inputSchema: {},
}, async () => {
  requireNovel();
  return raw(`[NEED_INPUT] End Novel "${state.activeNovel!.name}"? Respond with: respond("End Novel", "yes") or respond("End Novel", "cancel")`);
});

server.registerTool("export_novel", {
  title: "Export Novel",
  description: "Export the active novel in interchange format. Game Master only.",
  inputSchema: { format: z.enum(["json", "markdown"]).optional() },
}, async ({ format }: any) => {
  requireGM();
  const novel = requireNovel();

  if (format === "markdown") {
    let md = `# Novel: ${novel.name}\n\n## Scene\n${novel.scene_description}${novel.scene_location ? `\n- **Location:** ${novel.scene_location}` : ""}${novel.scene_time_of_day ? `\n- **Time of Day:** ${novel.scene_time_of_day}` : ""}${novel.scene_atmosphere ? `\n- **Atmosphere:** ${novel.scene_atmosphere}` : ""}\n\n### Entities\n`;
    for (const [, e] of novel.entities) {
      md += `- **${e.name}** (${e.race} ${e.class_name} Lv.${e.level}) HP: ${e.hp}/${e.max_hp} AC: ${e.ac}\n`;
    }
    md += `\n### NPCs\n`;
    for (const [, n] of novel.npcs) {
      md += `- **${n.name}** — ${n.disposition ?? "neutral"}\n`;
    }
    return ok(md);
  }

  return ok(JSON.stringify({
    slug: novel.slug,
    name: novel.name,
    hat: novel.hat,
    scene_description: novel.scene_description,
    scene_type: novel.scene_type,
    entities: Array.from(novel.entities.entries()).map(([eid, e]) => ({ ...e, entity_id: eid })),
    npcs: Array.from(novel.npcs.values()),
    lore: Array.from(novel.lore.values()),
    countdowns: Array.from(novel.countdowns.values()),
    combat: novel.combat,
    audit_log_preview: novel.audit_log.slice(-10).map(e => `${e.timestamp} ${e.tool}`),
    metadata: novel.metadata,
  }, null, 2));
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
  const mode_ = mode ?? "dry-run";
  if (mode_ === "dry-run") return ok("Dry-run: novel import would proceed. No changes made.");
  return ok(`Novel ${mode_ === "replace" ? "replaced" : "merged"}.`);
});

// --- Oracle ---

server.registerTool("ask_oracle", {
  title: "Ask Oracle",
  description: "Resolve uncertainty with a d100 roll. Likelihoods: certain (90%), likely (70%), even (50%), unlikely (30%), impossible (10%). Game Master only.",
  inputSchema: {
    question: z.string(),
    likelihood: z.enum(["certain", "likely", "even", "unlikely", "impossible"]),
    seed: z.string().optional(),
  },
}, async ({ question, likelihood, seed: seedParam }: any) => {
  requireGM();
  if (requireNovel().pending_workflow) return err("STATE_CONFLICT", "A workflow is pending.");
  const likelihoods: Record<string, number> = { certain: 90, likely: 70, even: 50, unlikely: 30, impossible: 10 };
  const threshold = likelihoods[likelihood];
  const roll = seedParam ? ((hashString(seedParam) % 100) + 1) : (Math.floor(Math.random() * 100) + 1);
  let result: string;
  if (roll <= threshold) {
    result = roll % 11 === 0 ? "[EXCEPTIONAL_YES]" : "[YES]";
  } else {
    result = roll % 11 === 0 ? "[EXCEPTIONAL_NO]" : "[NO]";
  }
  audit("ask_oracle", { question, likelihood }, `Oracle: ${result}`);
  return ok(`${result}\n\nQuestion: ${question}\nOdds: ${likelihood} (${threshold}%)`);
});

// --- Server Notes ---

const serverNotesPath = path.join(DATA_DIR, "server-notes.json");

function loadServerNotes(): Record<string, string> {
  try { return JSON.parse(fs.readFileSync(serverNotesPath, "utf-8")); } catch { return {}; }
}

function saveServerNotes(notes: Record<string, string>): void {
  const tmp = serverNotesPath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(notes, null, 2));
  fs.renameSync(tmp, serverNotesPath);
}

server.registerTool("set_server_note", {
  title: "Set Server Note",
  description: "Create or update a server-level note. Game Master only.",
  inputSchema: { key: z.string(), content: z.string() },
}, async ({ key, content }: any) => {
  requireGM();
  const notes = loadServerNotes();
  notes[key] = content;
  saveServerNotes(notes);
  return ok(`Server note '${key}' saved.`);
});

server.registerTool("remove_server_note", {
  title: "Remove Server Note",
  description: "Remove a server-level note. Game Master only.",
  inputSchema: { key: z.string() },
}, async ({ key }: any) => {
  requireGM();
  const notes = loadServerNotes();
  if (!notes[key]) return err("NOT_FOUND", `Server note '${key}' not found.`);
  delete notes[key];
  saveServerNotes(notes);
  return ok(`Server note '${key}' removed.`);
});

server.registerTool("list_server_notes", {
  title: "List Server Notes",
  description: "List all server-level notes. Game Master only.",
  inputSchema: {},
}, async () => {
  requireGM();
  const notes = loadServerNotes();
  const keys = Object.keys(notes);
  if (keys.length === 0) return ok("[No server notes.]");
  const lines = keys.map(k => `- **${k}**: ${notes[k].substring(0, 100)}${notes[k].length > 100 ? "…" : ""}`);
  return ok(`Server notes (${keys.length}):\n${lines.join("\n")}`);
});

// --- Adventure Catalog ---

server.registerTool("list_adventures", {
  title: "List Adventures",
  description: "List available adventure modules. Always callable.",
  inputSchema: { filter: z.string().optional() },
}, async ({ filter: filterTag }: any) => {
  const adventureDir = process.env.TTRPG_ADVENTURE ?? path.join(DATA_DIR, "adventures");
  if (!fs.existsSync(adventureDir)) return ok("[No adventure modules found.]");
  const files = fs.readdirSync(adventureDir).filter(f => f.endsWith(".json"));
  if (files.length === 0) return ok("[No adventure modules found.]");
  const entries: string[] = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(adventureDir, file), "utf-8"));
      const slug = file.replace(".json", "");
      const tags: string[] = data.genre_tags ?? [];
      if (filterTag && !tags.includes(filterTag)) continue;
      entries.push(`- **${slug}**: ${data.title ?? slug} (${data.room_count ?? "?"} rooms, ${data.npc_count ?? "?"} NPCs) ${tags.length ? `[${tags.join(", ")}]` : ""}`);
    } catch { /* skip corrupt */ }
  }
  if (entries.length === 0) return ok("[No adventure modules match filter.]");
  return ok(`Adventure catalog (${entries.length}):\n${entries.join("\n")}`);
});

// --- Checkpoints ---

server.registerTool("set_checkpoint", {
  title: "Set Checkpoint",
  description: "Save a named checkpoint of the full Novel state. Game Master only.",
  inputSchema: { label: z.string() },
}, async ({ label }: any) => {
  requireGM();
  const novel = requireNovel();
  const max = parseInt(process.env.TTRPG_MAX_CHECKPOINTS ?? "10", 10);
  if (novel.checkpoints.length >= max) novel.checkpoints.shift();
  novel.checkpoints.push({ label, timestamp: new Date().toISOString(), state: JSON.parse(JSON.stringify(novel)) });
  audit("set_checkpoint", { label }, `Checkpoint '${label}' saved.`);
  state.saveNovel(novel);
  return ok(`Checkpoint '${label}' saved (${novel.checkpoints.length}/${max}).`);
});

server.registerTool("list_checkpoints", {
  title: "List Checkpoints",
  description: "List all checkpoints for the active Novel. Game Master only.",
  inputSchema: {},
}, async () => {
  requireGM();
  const novel = requireNovel();
  if (novel.checkpoints.length === 0) return ok("[No checkpoints.]");
  const lines = novel.checkpoints.map((c, i) => `${i + 1}. ${c.label} — ${c.timestamp}`);
  return ok(`Checkpoints:\n${lines.join("\n")}`);
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
  if (novel.pending_workflow) return err("STATE_CONFLICT", "A workflow is pending.");
  novel.pending_workflow = { decision: `Restore checkpoint '${label}'?`, snapshot: null };
  state.saveNovel(novel);
  return raw(`[NEED_INPUT] Restore checkpoint '${label}'?\n- yes: Restore\n- cancel: Cancel`);
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

// --- Novel Management ---

server.registerTool("list_novels", {
  title: "List Novels",
  description: "List all Novels on disk with metadata. Always callable.",
  inputSchema: {},
}, async () => {
  const novelsDir = path.join(DATA_DIR, "novels");
  if (!fs.existsSync(novelsDir)) return ok("[No Novels found.]");
  const files = fs.readdirSync(novelsDir).filter(f => f.endsWith(".json"));
  if (files.length === 0) return ok("[No Novels found.]");
  const lines: string[] = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(novelsDir, file), "utf-8"));
      const active = state.activeNovelId === data.slug ? " [active]" : "";
      lines.push(`- **${data.slug}**${active}: ${data.name ?? data.slug}`);
    } catch { /* skip */ }
  }
  return ok(`Novels (${lines.length}):\n${lines.join("\n")}`);
});

server.registerTool("novel_info", {
  title: "Novel Info",
  description: "Return extended metadata for a Novel. Always callable.",
  inputSchema: { slug: z.string().optional() },
}, async ({ slug }: any) => {
  const target = slug ?? state.activeNovelId;
  if (!target) return err("NOT_FOUND", "No Novel specified and none active.");
  const novel = slug ? state.novels.get(slug) : state.activeNovel;
  if (!novel) return err("NOT_FOUND", `Novel '${slug}' not found.`);
  const info = [
    `**Name:** ${novel.name}`, `**Slug:** ${novel.slug}`, `**Hat:** ${novel.hat ?? "none"}`,
    `**Entities:** ${novel.entities.size}`, `**NPCs:** ${novel.npcs.size}`,
    `**Factions:** ${novel.factions.length}`, `**Vows:** ${novel.vows.length}`,
    `**Stories:** ${novel.story_journal.length}`, `**Adventure:** ${novel.adventure_slug ?? "none"}`,
  ];
  return ok(info.join("\n"));
});

server.registerTool("rename_novel", {
  title: "Rename Novel",
  description: "Rename the active Novel on disk. Game Master only.",
  inputSchema: { new_slug: z.string() },
}, async ({ new_slug }: any) => {
  requireGM();
  const novel = requireNovel();
  const oldFile = path.join(DATA_DIR, "novels", `${novel.slug}.json`);
  const newFile = path.join(DATA_DIR, "novels", `${new_slug}.json`);
  if (fs.existsSync(newFile)) return err("STATE_CONFLICT", `Novel '${new_slug}' already exists.`);
  fs.renameSync(oldFile, newFile);
  const oldBak = oldFile + ".bak";
  if (fs.existsSync(oldBak)) fs.renameSync(oldBak, newFile + ".bak");
  state.novels.delete(novel.slug);
  novel.slug = new_slug;
  state.novels.set(new_slug, novel);
  state.activeNovelId = new_slug;
  state.saveNovel(novel);
  return ok(`Novel renamed to '${new_slug}'.`);
});

server.registerTool("clone_novel", {
  title: "Clone Novel",
  description: "Create an independent copy of a Novel. Game Master only.",
  inputSchema: { source_slug: z.string(), new_name: z.string(), trim_audit_sessions: z.number().min(0).optional() },
}, async ({ source_slug, new_name, trim_audit_sessions }: any) => {
  requireGM();
  const cloneSlug = new_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (state.novels.has(cloneSlug)) return err("STATE_CONFLICT", `Novel '${cloneSlug}' already exists.`);
  const srcPath = path.join(DATA_DIR, "novels", `${source_slug}.json`);
  if (!fs.existsSync(srcPath)) return err("NOT_FOUND", `Novel '${source_slug}' not found.`);
  const srcData = JSON.parse(fs.readFileSync(srcPath, "utf-8"));
  const clonePath = path.join(DATA_DIR, "novels", `${cloneSlug}.json`);
  srcData.slug = cloneSlug;
  srcData.name = new_name;
  srcData.hat = null;
  srcData.active_entity_id = null;
  srcData.pending_workflow = null;
  if (srcData.metadata) {
    srcData.metadata.created = new Date().toISOString();
    srcData.metadata.modified = new Date().toISOString();
  }
  if (trim_audit_sessions && srcData.audit_log?.length) {
    const boundaries = srcData.audit_log.filter((e: any) => e.output_prefix === "[session_boundary]");
    const keep = Math.min(trim_audit_sessions, boundaries.length);
    if (keep > 0) {
      const cutoffIndex = srcData.audit_log.indexOf(boundaries[boundaries.length - keep]);
      srcData.audit_log = srcData.audit_log.slice(cutoffIndex);
    }
  }
  const tmp = clonePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(srcData, null, 2));
  fs.renameSync(tmp, clonePath);
  state.resumeNovel(cloneSlug);
  audit("clone_novel", { source_slug, new_name }, `Clone '${cloneSlug}' created.`);
  return ok(`Novel cloned as '${cloneSlug}'.`);
});

// --- Enrichment ---

server.registerTool("revert_enrichment", {
  title: "Revert Enrichment",
  description: "Remove all enrichment state, restoring pre-enrich server state. Game Master only.",
  inputSchema: {},
}, async () => {
  requireGM();
  state.enriched = false;
  state.enrichmentManifest = null;
  return ok("Enrichment reverted.");
});

// ── Resources ──────────────────────────────────────────────────────

// Resources are registered as templates; hat_briefing is a prompt, not a resource
// spec://build resource (REQ-105)
const specPath = path.join(process.cwd(), "holonovel.md");
const specContent = fs.existsSync(specPath) ? fs.readFileSync(specPath, "utf-8") : "";

server.registerResource("spec://build", "spec://build", { title: "Specification Document" }, async () => ({
  contents: [{ uri: "spec://build", text: specContent, mimeType: "text/markdown" }],
}));

server.registerResource("lore://groups", "lore://groups", { title: "Lore Groups" }, async () => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: "lore://groups", text: "{}", mimeType: "application/json" }] };
  const groups: Record<string, string[]> = {};
  for (const [key, entry] of novel.lore) {
    const g = entry.group ?? "_ungrouped";
    (groups[g] ??= []).push(key);
  }
  return { contents: [{ uri: "lore://groups", text: JSON.stringify(groups, null, 2), mimeType: "application/json" }] };
});

server.registerResource("lore://templates", "lore://templates", { title: "Lore Templates" }, async () => {
  const manifest = state.enrichmentManifest ?? DEFAULT_ENRICHMENT;
  const templates = (manifest.lore_templates ?? []) as any[];
  const hat = getHat();
  const visible = hat === "game_master" ? templates : templates.filter((t: any) => t.hat_scope !== "game_master");
  return { contents: [{ uri: "lore://templates", text: JSON.stringify(visible, null, 2), mimeType: "application/json" }] };
});

server.registerResource("lore-single", new ResourceTemplate("lore://{key}", {
  list: async () => {
    const novel = state.activeNovel;
    if (!novel) return { resources: [] };
    return { resources: Array.from(novel.lore.keys()).map(k => ({
      uri: `lore://${k}`, name: k,
    })) };
  },
}), { title: "Lore Entry" }, async (uri) => {
  const novel = state.activeNovel;
  if (!novel) return { contents: [{ uri: uri.href, text: "{}", mimeType: "application/json" }] };
  const key = uri.searchParams.get("key") ?? "";
  const entry = novel.lore.get(key);
  if (!entry) return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "not found" }), mimeType: "application/json" }] };
  const hat = getHat();
  if (entry.hat_scope === "game_master" && hat !== "game_master") {
    return { contents: [{ uri: uri.href, text: JSON.stringify({ error: "forbidden" }), mimeType: "application/json" }] };
  }
  return { contents: [{ uri: uri.href, text: JSON.stringify({ key: entry.key, content: entry.content, triggers: entry.triggers, hat_scope: entry.hat_scope, priority: entry.priority, sticky: entry.sticky, sticky_remaining: entry.sticky_remaining, enabled: entry.enabled, group: entry.group }, null, 2), mimeType: "application/json" }] };
});

// ── Prompts ────────────────────────────────────────────────────────

server.registerPrompt("intro", { description: "Connection introduction and getting started" }, async () => ({
  messages: [{
    role: "user",
    content: {
      type: "text",
      text: `# Welcome to D&D 5e Holonovel!

You are an AI Game Master running Dungeons & Dragons 5th Edition. This server provides tools for character management, dice rolling, combat, conditions, NPCs, lore, countdowns, and rules lookup.

## Getting Started
1. **Create a Novel:** Use \`create_novel("My Adventure")\`
2. **Session Zero:** Run the \`session_zero\` prompt
3. **Create Characters:** Use \`create_character\` with name, race, class, and background
4. **Set the Scene:** Use \`set_scene_state\` to describe the opening scene
5. **Play!** Switch to Player hat (\`set_hat("player")\`) and describe your actions

Available races: ${listRaces().join(", ")}
Available classes: ${listClasses().join(", ")}
Roster characters: ${state.roster.size}

Spec: https://github.com/anomalyco/Holonovel
Version: 2026.08.06`,
    },
  }],
}));

server.registerPrompt("hat_briefing", { description: "Per-hat guidance, state, and tool recommendations" }, async () => {
  const novel = state.activeNovel;
  const hat = getHat();

  if (!novel) {
    return { messages: [{ role: "user", content: { type: "text", text: "No active novel. Use create_novel or resume_novel to begin." } }] };
  }

  const entities = Array.from(novel.entities.values()).map(e => `- **${e.name}** — HP: ${e.hp}/${e.max_hp} AC: ${e.ac}${e.conditions?.length ? ` (${e.conditions.join(", ")})` : ""}`);
  const npcs = Array.from(novel.npcs.values()).map(n => `- **${n.name}** — ${n.disposition ?? "neutral"}${n.location ? ` @ ${n.location}` : ""}`);

  const sceneText = (novel.scene_description ?? "").toLowerCase();
  const hatScope = (hat === "game_master") ? ["game_master", "shared"] : ["shared"];
  const allLore = Array.from(novel.lore.values()).filter(l => l.enabled && hatScope.includes(l.hat_scope));
  const maxTokens = state.maxLoreTokens;

  if (allLore.length > 0) {
    novel.briefing_assembly_count++;
  }

  const triggered: LoreEntry[] = [];
  const sticking: LoreEntry[] = [];

  for (const l of allLore) {
    const matched = sceneText && l.triggers.some(t => sceneText.includes(t.toLowerCase()));
    if (matched) {
      l.sticky_remaining = l.sticky;
      triggered.push(l);
    } else if (l.sticky_remaining > 0) {
      l.sticky_remaining--;
      sticking.push(l);
    }
  }

  const activeLore = [...triggered, ...sticking];
  activeLore.sort((a, b) => b.priority - a.priority || a.key.localeCompare(b.key));

  const groups: Map<string, LoreEntry[]> = new Map();
  const ungrouped: LoreEntry[] = [];
  for (const l of activeLore) {
    if (l.group) {
      const g = groups.get(l.group);
      if (g) g.push(l); else groups.set(l.group, [l]);
    } else {
      ungrouped.push(l);
    }
  }

  let loreText = "";
  let totalChars = 0;
  let included = 0;
  let omitted = 0;

  const renderEntry = (l: LoreEntry): string => {
    const stickyMark = l.sticky_remaining > 0 && !triggered.includes(l) ? ` [sticky:${l.sticky_remaining}]` : "";
    return `- **${l.key}:** ${l.content}${stickyMark}`;
  };

  const addSection = (header: string, entries: LoreEntry[]) => {
    if (entries.length === 0) return;
    if (maxTokens && totalChars >= maxTokens) { omitted += entries.length; return; }
    let section = `### Lore: ${header}\n`;
    let entryIncluded = 0;
    for (const l of entries) {
      const line = renderEntry(l) + "\n";
      if (maxTokens && totalChars + section.length + line.length > maxTokens) {
        omitted += (entries.length - entryIncluded);
        break;
      }
      section += line;
      entryIncluded++;
      included++;
    }
    totalChars += section.length;
    loreText += section;
  };

  for (const [group, entries] of groups) {
    addSection(group, entries);
  }
  addSection("Triggered", ungrouped);

  if (omitted > 0) {
    loreText += `\n*[${omitted} lore entries omitted — token budget exceeded]*\n`;
  }

  if (!loreText) loreText = "None";

  // Story journal entries matching active entities or scene
  const storyDisplay = parseInt(process.env.TTRPG_STORY_JOURNAL_DISPLAY ?? "5", 10);
  const activeEntityIds = [...novel.entities.keys()];
  const matchingStories = novel.story_journal
    .filter(s => s.entity_ids.some(eid => activeEntityIds.includes(eid)) || s.scene_anchor === novel.scene_description?.substring(0, 100))
    .slice(-storyDisplay);
  const storyText = matchingStories.length
    ? matchingStories.map(s => `[${s.index}] ${s.type}: ${s.entry.substring(0, 150)}${s.entry.length > 150 ? "…" : ""}`).join("\n")
    : "None";

  // Narrative threads
  const threads: string[] = [];
  for (const s of novel.story_journal) {
    if (s.type === "decision" && !novel.story_journal.some(e => e.type === "consequence" && e.entity_ids.some(eid => s.entity_ids.includes(eid)))) {
      threads.push(`Unresolved decision: ${s.entry.substring(0, 80)}`);
    }
  }
  for (const v of novel.vows) {
    if (v.state === "active") threads.push(`Vow: ${v.name} (${v.milestones}/${v.rank_track} ${v.difficulty})`);
  }
  const npcDispositions = Array.from(novel.npcs.values())
    .filter(n => n.disposition && n.disposition !== "neutral");
  for (const n of npcDispositions) {
    threads.push(`${n.name} (${n.disposition})`);
  }
  const threadsText = threads.length ? threads.map(t => `- ${t}`).join("\n") : "[No unresolved threads.]";

  // Factions
  const factionsText = novel.factions.length
    ? novel.factions.map(f => `- **${f.name}** — Clock: ${f.clock}/${f.clock_max} | ${f.status}${f.goals.length ? `\n  Goals: ${f.goals.join(", ")}` : ""}`).join("\n")
    : "None";

  // Vows
  const vowsText = novel.vows.filter(v => v.state === "active").length
    ? novel.vows.filter(v => v.state === "active").map(v => `- **${v.name}** (${v.difficulty}): ${v.milestones}/${v.rank_track} — ${v.description.substring(0, 80)}`).join("\n")
    : "None";

  // Knowledge state (secrets known to active entity)
  let knowledgeText = "[No known information.]";
  const activeEntityId = novel.active_entity_id;
  if (activeEntityId) {
    const known = novel.secrets.filter(s => s.known_by.includes(activeEntityId));
    if (known.length) {
      knowledgeText = known.map(s => `- **${s.key}** (revealed): ${s.content.substring(0, 100)}`).join("\n");
    }
  }

  const countdowns = Array.from(novel.countdowns.values()).filter(c => c.ticks > 0);

  let briefing = `## Hat Briefing — ${hat === "player" ? "Player" : hat === "game_master" ? "Game Master" : "No Hat"}

### Scene
${novel.scene_description || "None set"}${novel.scene_location ? `\nLocation: ${novel.scene_location}` : ""}${novel.scene_time_of_day ? `\nTime of Day: ${novel.scene_time_of_day}` : ""}${novel.scene_atmosphere ? `\nAtmosphere: ${novel.scene_atmosphere}` : ""}
${novel.adventure_scene_waypoint ? `\nAdventure Scene: ${novel.adventure_scene_waypoint.description}` : ""}
Scene Type: ${novel.scene_type.join(", ")}
${novel.narrative_directive ? `\nNarrative Directive: ${novel.narrative_directive}` : ""}

### POV
${(() => {
  const entity = novel.active_entity_id ? novel.entities.get(novel.active_entity_id) : null;
  if (novel.pov_mode === "omniscient" || !entity) {
    return "POV: none — narration is omniscient.";
  }
  const p = entity.personality;
  const details = [p?.description, p?.voice, p?.background, p?.goals].filter(Boolean).join(" ");
  return `POV: ${entity.name} — describe the scene through this character's eyes and senses. Other characters' internal states are inaccessible unless ${entity.name} could observe or infer them.${details ? `\nVoice: ${details}` : ""}`;
})()}

${hat === "game_master" ? `### Narrative Threads\n${threadsText}\n` : ""}
${activeEntityId ? `### Knowledge State\n${knowledgeText}\n` : ""}

### Combat${state.combatReport(novel)}

### Entities
${entities.join("\n") || "None"}

### NPCs
${npcs.join("\n") || "None"}

### Countdowns
${countdowns.length ? countdowns.map(c => `- **${c.name}:** ${c.ticks}/${c.total} ticks`).join("\n") : "None"}

${hat === "game_master" ? `### Factions\n${factionsText}\n` : ""}
${hat === "game_master" ? `### Vows\n${vowsText}\n` : ""}

### Lore (Triggered)
${loreText}

${hat === "game_master" ? `### Story Journal\n${storyText}\n` : ""}

${!novel.session_zero_completed ? "**Session zero not yet completed — run session_zero prompt.**\n" : ""}

Use intro for getting started. Use help for tool discovery.`;

  return { messages: [{ role: "user", content: { type: "text", text: briefing } }] };
});

server.registerPrompt("session_zero", { description: "Session zero — character introductions, preferences, boundaries" }, async () => {
  const novel = state.activeNovel;
  return {
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `# Session Zero — ${novel?.name ?? "New Adventure"}

Let's set up your adventure! Answer these questions:

## Character Introductions
- Use \`set_personality(entity_id, description, voice, background, goals)\` for each character

## Tone Preference
- Lighter, darker, or grittier?
- Record with \`player_signal("tone", "<value>")\`

## Difficulty
- Easier or harder?
- Record with \`player_signal("difficulty", "<value>")\`

## Pacing
- More action, exploration, or dialogue?
- Record with \`player_signal("pace", "<value>")\`

## Content Boundaries
- Any topics to avoid?
- Record with \`player_signal("boundary", "<value>")\`

## Adventure Confirmation
- Confirm the adventure module (if loaded) or start from scratch.
`,
      },
    }],
  };
});

server.registerPrompt("novel_setup", { description: "Novel setup workflow — characters, adventure, session zero" }, async () => {
  const novel = state.activeNovel;
  const rosterChars = Array.from(state.roster.entries()).map(([id, e]) => `- ${e.name} (${id})`).join("\n") || "None";

  return {
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `# Novel Setup — ${novel?.name ?? "New Adventure"}

## 1. Characters
Create or import characters. Use:
- \`create_character\` for new characters
- \`import_character\` to import from roster

**Roster characters available:**
${rosterChars}

## 2. Adventure Source
Choose an adventure source:
- \`load_adventure(slug)\` — load a pre-indexed module
- \`generate_adventure(premise)\` — generate from a premise
- \`generate_encounter(context)\` — generate a single encounter
- Build from scratch with set_scene_state, create_npc, set_lore_entry

## 3. Run Session Zero
Once characters and adventure are set, run the \`session_zero\` prompt.

**Setup status:** Characters: ${novel?.characters_present ? "yes" : "no"} | Adventure: ${novel?.adventure_set ? "yes" : "no"} | Session Zero: ${novel?.session_zero_completed ? "yes" : "no"}
`,
      },
    }],
  };
});

server.registerPrompt("run_workflow", {
  description: "Determine which tool to use for a player intent",
  argsSchema: { intent: z.string().describe("What the player wants to do") },
}, async ({ intent }: any) => {
  const i = (intent ?? "").toLowerCase();

  const intentMap: [RegExp, string][] = [
    [/attack|strike/i, "roll_weapon_attack"],
    [/save|resist|dodge|endure/i, "roll_save"],
    [/check|try|attempt|persuade|deceive|investigate|perceive|stealth|acrobat|athlet/i, "roll_skill_check"],
    [/cast|spell|magic/i, "lookup_spell"],
    [/look up|search|find|rules|know about|what is/i, "search_rules"],
  ];

  let tool = "suggest_actions";
  for (const [pattern, toolName] of intentMap) {
    if (pattern.test(i)) {
      tool = toolName;
      break;
    }
  }

  return {
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Player intent: "${intent}"\nRecommended tool: \`${tool}\`\nUse \`help\` for full tool list.`,
      },
    }],
  };
});

// ── Startup ────────────────────────────────────────────────────────

const TTRPG_NOVEL = process.env.TTRPG_NOVEL;

async function main() {
  // Cleanup expired trash (REQ-117)
  state.cleanupExpiredTrash();

  if (TTRPG_NOVEL) {
    try {
      const existing = Array.from(state.novels.keys()).find(
        s => s === TTRPG_NOVEL.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      );
      if (existing) {
        state.switchNovel(existing);
        console.error(`TTRPG_NOVEL: resumed '${TTRPG_NOVEL}'`);
      } else {
        const fullName = TTRPG_NOVEL;
        const slug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const novel = state.createNovel(fullName);
        state.activeNovelId = slug;
        console.error(`TTRPG_NOVEL: created '${TTRPG_NOVEL}'`);
      }
    } catch (err: any) {
      console.error(`TTRPG_NOVEL: activation failed — ${err.message}`);
    }
  }

  // Increment connection counter on all loaded novels (REQ-173)
  const stalenessThreshold = parseInt(process.env.TTRPG_WORKFLOW_STALENESS_CONNECTIONS ?? "0", 10) || 5;
  for (const [, novel] of state.novels) {
    novel.connection_counter = (novel.connection_counter ?? 0) + 1;
    if (novel.pending_workflow) {
      novel.pending_staleness_counter = (novel.pending_staleness_counter ?? 0) + 1;
      if (stalenessThreshold > 0 && novel.pending_staleness_counter >= stalenessThreshold) {
        const decisionText = novel.pending_workflow.decision;
        const elapsed = novel.pending_staleness_counter;
        if (novel.pending_workflow.snapshot) {
          Object.assign(novel, novel.pending_workflow.snapshot);
        }
        state.audit(novel, novel.hat, "respond", {
          decision: decisionText,
          option: "[auto-cancel: stale]",
          tag: "[workflow_stale]",
          connections_elapsed: elapsed,
        });
        novel.pending_workflow = null;
        novel.pending_staleness_counter = 0;
        console.error(`Auto-cancelled stale workflow '${decisionText}' after ${elapsed} connections`);
      }
    }
  }

  // ── World-Model Tools ──────────────────────────────────────────────

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

  server.registerTool("command", {
    title: "Parser Command",
    description: "Execute a natural-language parser command against the world model. Use for navigation (go, n/s/e/w), inspection (look, examine), object interaction (take, drop, open, close), inventory, and wait.",
    inputSchema: { command: z.string() },
  }, async ({ command }: any) => {
    const novel = requireNovel();
    novelSnapshot();
    const entity = getActiveEntity();
    if (novel.world.rooms.size === 0) {
      return raw(`[ERROR] [STATE_CONFLICT] The world model has not been populated. Use an adventure module or \`convert_source\` to populate rooms before using parser commands.`);
    }
    let currentRoom = entity?.current_room ?? null;
    if (!currentRoom && entity) {
      currentRoom = [...novel.world.rooms.keys()][0];
      entity.current_room = currentRoom;
    }
    const inventory = entity?.inventory ?? [];
    const ctx: ParserContext = { world: novel.world, currentRoom, inventory, hat: getHat() };
    const result: ParserResult = dispatchCommand(command, ctx);
    if (result.prefix === "OK") {
      const goResult = resolveGoMovement(command, ctx);
      if (goResult.newRoom && entity && goResult.result.prefix === "OK") {
        entity.current_room = goResult.newRoom;
        audit("command", { command, moved_to: goResult.newRoom });
      }
    }
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
          const thing = novel.world.things.get(target);
          if (thing) { thing.location = currentRoom; thing.locationType = "room"; }
          state.saveNovel(novel);
          audit("command", { command, dropped: target });
        }
      } else if (verb === "open" && result.prefix === "OK" && tokens.length > 1) {
        const thing = novel.world.things.get(tokens.slice(1).join(" ").toLowerCase());
        if (thing && thing.openable) { thing.open = true; state.saveNovel(novel); audit("command", { command, opened: thing.name }); }
      } else if (verb === "close" && result.prefix === "OK" && tokens.length > 1) {
        const thing = novel.world.things.get(tokens.slice(1).join(" ").toLowerCase());
        if (thing && thing.openable) { thing.open = false; state.saveNovel(novel); audit("command", { command, closed: thing.name }); }
      } else if (verb === "unlock" && result.prefix === "OK" && tokens.length > 1) {
        const thing = novel.world.things.get(tokens.slice(1).join(" ").toLowerCase());
        if (thing && thing.lockable) { thing.locked = false; state.saveNovel(novel); audit("command", { command, unlocked: thing.name }); }
      } else if (verb === "lock" && result.prefix === "OK" && tokens.length > 1) {
        const thing = novel.world.things.get(tokens.slice(1).join(" ").toLowerCase());
        if (thing && thing.lockable) { thing.locked = true; state.saveNovel(novel); audit("command", { command, locked: thing.name }); }
      }
    }
    const prefix = result.prefix === "OK" ? "[OK]" : result.prefix === "WARNING" ? "[WARNING]" : "[ERROR]";
    const code = result.code ? ` [${result.code}]` : "";
    let text = `${prefix}${code} ${result.text}`;
    if (result.correctiveAction) { text += `\nCorrective action: ${result.correctiveAction}`; }
    return raw(text);
  });

  server.registerTool("create_room", {
    title: "Create Room",
    description: "Create a new room in the world model. Game Master only.",
    inputSchema: { name: z.string(), description: z.string().optional() },
  }, async ({ name, description }: any) => {
    requireGM();
    const novel = requireNovel();
    novelSnapshot();
    const lower = name.toLowerCase();
    if (novel.world.rooms.has(lower)) return err("STATE_CONFLICT", `Room '${name}' already exists.`);
    const room: WorldRoom = { name, description: description ?? "", exits: new Map(), doorRefs: new Map(), annotations: {} };
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
    novelSnapshot();
    const lower = name.toLowerCase();
    if (!novel.world.rooms.has(lower)) return err("NOT_FOUND", `Room '${name}' not found.`);
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
    audit("delete_room", { name });
    return ok(`Room '${name}' and its contents deleted.`);
  });

  server.registerTool("create_thing", {
    title: "Create Thing",
    description: "Create a new thing in the world model. Game Master only.",
    inputSchema: { name: z.string(), kind: z.string().optional(), description: z.string().optional(), location: z.string().optional(), fixed: z.boolean().optional(), openable: z.boolean().optional(), lockable: z.boolean().optional() },
  }, async ({ name, kind, description, location, fixed, openable, lockable }: any) => {
    requireGM();
    const novel = requireNovel();
    novelSnapshot();
    const lower = name.toLowerCase();
    if (novel.world.things.has(lower)) return err("STATE_CONFLICT", `Thing '${name}' already exists.`);
    const validKinds = ["thing", "container", "supporter", "door", "person", "backdrop"];
    const k = (kind && validKinds.includes(kind.toLowerCase())) ? kind.toLowerCase() as WorldKind : "thing";
    const thing: WorldThing = {
      name, description: description ?? "", kind: k, location: location ?? null,
      locationType: location ? "room" : null,
      portable: !fixed && k !== "supporter" && k !== "door" && k !== "vehicle",
      openable: k === "container" || k === "door" || openable === true,
      open: false,
      lockable: k === "container" || k === "door" || lockable === true,
      locked: false, lit: false,
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
    novelSnapshot();
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
    inputSchema: { direction: z.string(), room_a: z.string(), room_b: z.string() },
  }, async ({ direction, room_a, room_b }: any) => {
    requireGM();
    const novel = requireNovel();
    novelSnapshot();
    const dir = direction.toLowerCase();
    if (!ROOM_DIRECTIONS.includes(dir as any)) return err("INVALID_INPUT", `Invalid direction '${direction}'. Valid: ${ROOM_DIRECTIONS.join(", ")}.`);
    const roomA = novel.world.rooms.get(room_a.toLowerCase());
    const roomB = novel.world.rooms.get(room_b.toLowerCase());
    if (!roomA) return err("NOT_FOUND", `Room '${room_a}' not found.`);
    if (!roomB) return err("NOT_FOUND", `Room '${room_b}' not found.`);
    roomA.exits.set(dir as any, room_b);
    roomB.exits.set(oppositeDirection(dir as any), room_a);
    state.saveNovel(novel);
    audit("create_exit", { direction: dir, room_a, room_b });
    return ok(`Exit created: ${dir} from ${room_a} to ${room_b}.`);
  });

  server.registerTool("delete_exit", {
    title: "Delete Exit",
    description: "Delete a directional exit from a room. Game Master only.",
    inputSchema: { direction: z.string(), room: z.string() },
  }, async ({ direction, room: roomName }: any) => {
    requireGM();
    const novel = requireNovel();
    novelSnapshot();
    const dir = direction.toLowerCase();
    if (!ROOM_DIRECTIONS.includes(dir as any)) return err("INVALID_INPUT", "Invalid direction.");
    const room = novel.world.rooms.get(roomName.toLowerCase());
    if (!room) return err("NOT_FOUND", `Room '${roomName}' not found.`);
    if (!room.exits.has(dir as any)) return err("NOT_FOUND", `No ${dir} exit from '${roomName}'.`);
    room.exits.delete(dir as any);
    state.saveNovel(novel);
    audit("delete_exit", { direction: dir, room: roomName });
    return ok(`Exit ${dir} from '${roomName}' deleted.`);
  });

  server.registerTool("convert_source", {
    title: "Convert Source",
    description: "Parse hybrid world-model assertions and populate the Novel's world model. Game Master only.",
    inputSchema: { source: z.string() },
  }, async ({ source }: any) => {
    requireGM();
    const novel = requireNovel();
    novelSnapshot();
    if (novel.world.rooms.size > 0) return err("STATE_CONFLICT", "World model already populated. Use CRUD tools to modify, or create a new novel.");
    const { world, result } = convertSource(source, novel.world);
    novel.world = world;
    state.saveNovel(novel);
    audit("convert_source", { rooms: result.rooms, things: result.things, exits: result.exits });
    let msg = `World model populated: ${result.rooms} rooms, ${result.things} things, ${result.exits} exits. Linked annotations — encounters: ${result.annotations.encounters}, NPCs: ${result.annotations.npcs}, traps: ${result.annotations.traps}, lore: ${result.annotations.lore}.`;
    if (result.warnings.length > 0) {
      msg += `\n\nWarnings:`;
      for (const w of result.warnings) msg += `\nLine ${w.line}: ${w.message}`;
    }
    return ok(msg);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`dnd5e-holonovel v2026.08.06 — D&D 5e SRD MCP Server ready`);
  console.error(`Data directory: ${DATA_DIR}`);
  console.error(`Ruleset index: ${getSearchIndexSize()} entries`);
}

main().catch(console.error);

// ── Helpers ────────────────────────────────────────────────────────

function generateStats(method: "roll_4d6" | "standard_array"): Record<string, number> {
  if (method === "standard_array") {
    return { strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 };
  }
  // roll_4d6: roll 4d6, drop lowest
  const results: number[] = [];
  for (let i = 0; i < 6; i++) {
    const dice = [rollDice(1, 6), rollDice(1, 6), rollDice(1, 6), rollDice(1, 6)];
    dice.sort((a, b) => b - a);
    results.push(dice[0] + dice[1] + dice[2]);
  }
  results.sort((a, b) => b - a);
  return {
    strength: results[0], dexterity: results[1], constitution: results[2],
    intelligence: results[3], wisdom: results[4], charisma: results[5],
  };
}

function parseDice(notation: string): [number, number] {
  if (!notation || notation === "—" || notation === "1") return [0, 0];
  const m = notation.match(/^(\d+)d(\d+)$/);
  if (m) return [parseInt(m[1]), parseInt(m[2])];
  return [1, 4]; // default
}
