#!/usr/bin/env node
// D&D 5e MCP Server — Holonovel Build
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { state, Persona } from "./state.js";
import { PRNG, rollD20, rollDice, formatRoll, abilityModifier, proficiencyBonus } from "./dice.js";
import {
  ABILITY_SCORES, AbilityScore, SKILLS, SKILL_MAP, CONDITIONS, DIFFICULTY_CLASSES, LEVELS,
  RACES, RACE_MODIFIERS, CLASS_NAMES, CLASS_HIT_DIE, CLASS_SAVES, BACKGROUNDS, ALIGNMENTS,
  buildSearchIndex, searchRules, TABLES,
  WEAPONS, ARMOR, SPELLS, MONSTERS, MAGIC_ITEMS,
  lookupWeapon, lookupArmor, lookupSpell, lookupMonster, lookupMagicItem, lookupEquipment,
} from "./data.js";

// ─── Helpers ──────────────────────────────────────────────────────────────

const PREFIX_OK = "[OK]";
const PREFIX_ERR = "[ERROR]";

function ok(text: string) { return { content: [{ type: "text" as const, text: `${PREFIX_OK} ${text}` }] }; }
function err(category: string, msg: string, corrective?: string) {
  const line = corrective ? `\nCorrective action: ${corrective}` : "";
  return { isError: true, content: [{ type: "text" as const, text: `${PREFIX_ERR} [${category}] ${msg}${line}` }] };
}
function needInput(question: string, options: string[]) {
  return { content: [{ type: "text" as const, text: `[NEED_INPUT] ${question}\nOptions: ${options.slice(0, 25).join(", ")}\nCall respond(decision, option) to choose.` }] };
}

function requireGM() {
  if (state.activePersona !== "game_master") {
    return err("FORBIDDEN", "Requires Game Master (DM) persona.", "Use set_persona(\"game_master\") to switch.");
  }
  return null;
}

function requireNovel() {
  if (!state.getActiveNovel()) {
    return err("STATE_CONFLICT", "No active novel.", "Set TTRPG_NOVEL environment variable.");
  }
  return null;
}

function getRng(seed?: string) {
  if (seed) return { rng: new PRNG(seed), used: true };
  return { rng: state.prng, used: false };
}

function findEntity(id: string) {
  const novel = state.getActiveNovel();
  if (!novel) return null;
  return novel.entities[id] ?? null;
}

function findCombatParticipant(id: string): import("./state.js").CombatParticipant | null {
  const novel = state.getActiveNovel();
  if (!novel?.combat?.active) return null;
  return novel.combat.participants.find(p => p.id === id) ?? null;
}

function getStatMod(entity: import("./state.js").DnDEntity, stat: AbilityScore): number {
  return abilityModifier(entity.stats[stat]);
}

function getProfBonus(e: import("./state.js").DnDEntity): number {
  return proficiencyBonus(e.level);
}

function weaponAbility(entity: import("./state.js").DnDEntity, weapon: Record<string, any>): AbilityScore {
  const props = (weapon.properties || []).join(",").toLowerCase();
  if (props.includes("finesse")) {
    return getStatMod(entity, "dexterity") > getStatMod(entity, "strength") ? "dexterity" : "strength";
  }
  if (props.includes("ammunition") || props.includes("thrown")) return "dexterity";
  return "strength";
}

function personaStr(): string { return state.activePersona ?? "none"; }

function personaLabel(): string {
  if (state.activePersona === "player") return "Player";
  if (state.activePersona === "game_master") return "Game Master (DM)";
  return "None (full access)";
}

// ─── Server Setup ─────────────────────────────────────────────────────────

const ALL_TOOLS = [
  "set_persona", "respond", "undo", "help", "spec_health",
  "search_rules", "lookup_equipment", "lookup_spell", "lookup_monster", "lookup_class",
  "create_character", "character_sheet", "import_character",
  "roll_save", "roll_skill_check", "roll_weapon_attack", "roll_weapon_damage",
  "apply_condition", "remove_condition",
  "roll_on_table",
  "init_combat", "advance_combat", "end_combat",
  "session_recap", "end_novel", "end_game", "create_novel", "resume_novel",
  "generate_adventure", "generate_encounter",
  "set_active_entity", "set_personality", "set_voice_examples", "player_signal",
  "set_scene_state", "set_scene_type", "set_narrative_directive",
  "create_npc", "update_npc", "remove_npc",
  "set_countdown", "advance_countdown", "remove_countdown",
  "set_lore_entry", "remove_lore_entry",
  "set_briefing_order", "suggest_actions", "compress_audit", "load_adventure",
];

const server = new McpServer({
  name: "dnd5e-holonovel",
  version: "1.3.0",
}, {
  capabilities: { tools: {}, resources: { subscribe: true }, prompts: {} },
});

const PERSONA_NAMES: Record<Persona | "none", string> = {
  player: "Player",
  game_master: "Game Master (DM)",
  none: "None (full access)",
};

// ─── Tools ────────────────────────────────────────────────────────────────

// set_persona
server.registerTool("set_persona", {
  title: "Set Persona",
  description: "Switch active persona. Accepts 'player' or 'game_master'. Always callable.",
  inputSchema: { persona: z.enum(["player", "game_master"]) },
}, async ({ persona }) => {
  if (state.workflow) return err("STATE_CONFLICT", "Cannot switch persona during pending workflow.");
  state.setPersona(persona);
  state.audit(persona, "set_persona", { persona }, "OK");
  return ok(`Active persona: ${PERSONA_NAMES[persona]}`);
});

// respond
server.registerTool("respond", {
  title: "Respond",
  description: "Respond to a pending workflow decision.",
  inputSchema: { decision: z.string(), option: z.string() },
}, async ({ decision, option }) => {
  if (!state.workflow) return err("STATE_CONFLICT", "No pending workflow.");
  if (option === "cancel") {
    state.workflow = null;
    state.audit(personaStr(), "respond", { decision, option }, "CANCELLED");
    return ok("Workflow cancelled.");
  }
  const queue = state.workflow.decisionQueue;
  if (queue.length === 0) return err("STATE_CONFLICT", "No pending decisions.");
  const current = queue[0];
  const isFreeText = current.options.some(o => o.startsWith("[Type"));
  if (!isFreeText && !current.options.includes(option)) {
    return err("INVALID_INPUT", `"${option}" is not a valid option.`, `Valid: ${current.options.join(", ")}`);
  }
  queue.shift();
  const draft = state.workflow.characterDraft;
  if (draft) {
    if (decision === "stat_method") {
      if (option === "standard_array") {
        (draft as any).stats = { strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 };
      } else {
        const stats: Record<string, number> = {};
        for (const stat of ABILITY_SCORES) {
          const sorted = [state.prng.nextRange(1,6), state.prng.nextRange(1,6), state.prng.nextRange(1,6), state.prng.nextRange(1,6)].sort((a,b)=>b-a);
          stats[stat] = sorted[0] + sorted[1] + sorted[2];
        }
        (draft as any).stats = stats;
      }
      queue.push({ question: "Choose a race.", options: [...RACES, "cancel"] });
      return needInput("Choose a race.", [...RACES]);
    }
    if (decision === "race_choice") {
      if (!RACES.includes(option as any)) return err("INVALID_INPUT", `"${option}" is not a valid race.`, `Valid: ${RACES.join(", ")}`);
      (draft as any).race = option;
      queue.push({ question: "Choose a class.", options: [...CLASS_NAMES, "cancel"] });
      return needInput("Choose a class.", [...CLASS_NAMES]);
    }
    if (decision === "class_choice") {
      if (!CLASS_NAMES.includes(option as any)) return err("INVALID_INPUT", `"${option}" is not a valid class.`, `Valid: ${CLASS_NAMES.join(", ")}`);
      (draft as any).className = option;
      queue.push({ question: "Choose a background.", options: [...BACKGROUNDS, "cancel"] });
      return needInput("Choose a background.", [...BACKGROUNDS]);
    }
    if (decision === "background_choice") {
      (draft as any).personality = { background: option };
      queue.push({ question: "Choose a name for your character.", options: ["[Type a name]", "cancel"] });
      return needInput("Choose a name for your character.", ["[Type a name]", "cancel"]);
    }
    if (decision === "name_choice" || isFreeText) {
      const e = draft as Partial<import("./state.js").DnDEntity>;
      if (!e.name && decision === "name_choice") (draft as any).name = option;

      if (!e.name && !e.race && e.race === "") return err("STATE_CONFLICT", "Incomplete character draft.");

      const id = state.nextEntityId();
      const className = (e.className || "fighter") as import("./data.js").ClassName;
      const raceName = (e.race || "human") as import("./data.js").RaceName;
      const stats = e.stats || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };
      // Apply race bonuses
      const raceMods = RACE_MODIFIERS[raceName] || {};
      const adjustedStats: Record<AbilityScore, number> = {} as any;
      for (const s of ABILITY_SCORES) adjustedStats[s] = stats[s] + (raceMods[s] || 0);
      // Handle half-elf's two extra +1s
      if (raceName === "half_elf") {
        const sorted = [...ABILITY_SCORES].sort((a, b) => (raceMods[a] || 0) - (raceMods[b] || 0) || adjustedStats[b] - adjustedStats[a]);
        for (let i = 0; i < 2 && i < sorted.length; i++) adjustedStats[sorted[i]]++;
      }

      const hitDieSize = CLASS_HIT_DIE[className];
      const entity: import("./state.js").DnDEntity = {
        id, name: e.name || "Unnamed", race: raceName, className, level: 1,
        stats: adjustedStats,
        maxHp: hitDieSize + abilityModifier(adjustedStats.constitution),
        currentHp: hitDieSize + abilityModifier(adjustedStats.constitution),
        tempHp: 0,
        hitDice: { total: 1, remaining: 1, size: hitDieSize },
        armorClass: 10 + abilityModifier(adjustedStats.dexterity),
        speed: 30,
        initiative: abilityModifier(adjustedStats.dexterity),
        skills: [],
        saveProficiencies: CLASS_SAVES[className],
        conditions: [],
        inventory: [],
        equippedWeapons: [],
        equippedArmor: "",
        spellSlots: {},
        personality: e.personality || {},
      };
      state.addRoster(entity);
      state.workflow = null;
      state.audit(personaStr(), "create_character", { name: entity.name, race: raceName, class: className }, "OK");
      return ok(`Character created: ${entity.name} (roster://${id})\nClass: ${className}, Race: ${entity.race}, Level: 1\nHP: ${entity.currentHp}/${entity.maxHp}, AC: ${entity.armorClass}\n` +
        ABILITY_SCORES.map(s => `${s}: ${entity.stats[s]} (${abilityModifier(entity.stats[s]) >= 0 ? "+" : ""}${abilityModifier(entity.stats[s])})`).join(", "));
    }
  }
  return err("STATE_CONFLICT", "Unknown workflow decision.");
});

// undo
server.registerTool("undo", {
  title: "Undo",
  description: "Undo the most recent mutation. Restores previous snapshot.",
  inputSchema: {}
}, async () => {
  if (state.workflow) return err("STATE_CONFLICT", "Cannot undo while workflow is pending.", "Complete or cancel the workflow first.");
  const success = state.undo();
  state.audit(personaStr(), "undo", {}, success ? "Reverted last mutation." : "Nothing to undo.");
  return success ? ok("Reverted last mutation.") : err("STATE_CONFLICT", "Nothing to undo.");
});

// help
server.registerTool("help", {
  title: "Help",
  description: "Show available commands and tools.",
  inputSchema: { query: z.string().optional() },
}, async ({ query }) => {
  const gmOnly = ["init_combat", "advance_combat", "end_combat", "set_personality", "set_voice_examples", "set_scene_state", "set_scene_type", "set_narrative_directive", "create_npc", "update_npc", "remove_npc", "set_countdown", "advance_countdown", "remove_countdown", "set_lore_entry", "remove_lore_entry", "set_briefing_order", "compress_audit", "load_adventure", "generate_adventure", "generate_encounter", "end_novel", "end_game"];
  const filtered = query ? ALL_TOOLS.filter(t => t.toLowerCase().includes(query!.toLowerCase())) : ALL_TOOLS;
  const visible = state.activePersona === "player" ? filtered.filter(t => !gmOnly.includes(t)) : filtered;
  const grouped: Record<string, string[]> = {
    "Novel & Persona": visible.filter(t => ["set_persona", "respond", "undo", "help", "spec_health", "end_novel", "end_game", "create_novel", "resume_novel", "set_active_entity"].includes(t)),
    "Rules & Lookup": visible.filter(t => ["search_rules", "lookup_equipment", "lookup_spell", "lookup_monster", "lookup_class"].includes(t)),
    "Dice & Checks": visible.filter(t => ["roll_save", "roll_skill_check", "roll_weapon_attack", "roll_weapon_damage"].includes(t)),
    "Characters": visible.filter(t => ["create_character", "character_sheet", "import_character", "set_personality", "set_voice_examples", "player_signal"].includes(t)),
    "Combat": visible.filter(t => ["init_combat", "advance_combat", "end_combat"].includes(t)),
    "Conditions": visible.filter(t => ["apply_condition", "remove_condition"].includes(t)),
    "Tables": visible.filter(t => ["roll_on_table"].includes(t)),
    "Novel": visible.filter(t => ["session_recap", "create_novel", "resume_novel"].includes(t)),
    "Narrative": visible.filter(t => ["set_scene_state", "set_scene_type", "set_narrative_directive"].includes(t)),
    "NPCs": visible.filter(t => ["create_npc", "update_npc", "remove_npc"].includes(t)),
    "Countdowns": visible.filter(t => ["set_countdown", "advance_countdown", "remove_countdown"].includes(t)),
    "Lore": visible.filter(t => ["set_lore_entry", "remove_lore_entry"].includes(t)),
    "Guidance": visible.filter(t => ["set_briefing_order", "suggest_actions", "compress_audit", "load_adventure", "generate_adventure", "generate_encounter"].includes(t)),
  };
  let out = "# D&D 5e Holonovel — Available Tools\n\n";
  for (const [cat, tools] of Object.entries(grouped)) {
    if (tools.length === 0) continue;
    out += `## ${cat}\n`;
    for (const t of tools) out += `- \`${t}\`\n`;
    out += "\n";
  }
  out += "> Tip: Use the `intro` prompt for a guided introduction to the server.";
  return ok(out);
});

// spec_health
server.registerTool("spec_health", {
  title: "Spec Health",
  description: "Report build health and indexed counts.",
  inputSchema: {},
}, async () => {
  const index = buildSearchIndex();
  const novels = state.listNovels();
  let out = "[OK] Build health report\n\n";
  out += `Indexed sections: ${index.length}\n`;
  out += `Registered tools: ${ALL_TOOLS.length}\n`;
  out += `Ruleset data: ${WEAPONS.length} weapons, ${ARMOR.length} armor, ${SPELLS.length} spells, ${MONSTERS.length} monsters, ${MAGIC_ITEMS.length} magic items\n`;
  out += `Ruleset: D&D 5e SRD v5.1 (spec v1.3.0)\n`;
  out += `Source files: 1021 Markdown files\n`;
  out += `MUST coverage: character creation, lookup, skill/save/attack/damage rolls, combat lifecycle, conditions, tables, session recap, novel lifecycle\n`;
  if (novels.length > 0) {
    out += `\nNovels on disk: ${novels.length}\n`;
    for (const n of novels.slice(0, 10)) {
      out += `  - ${n.name} (${n.slug})${n.active ? " [ACTIVE]" : ""} — ${n.lastModified.slice(0, 10)}\n`;
    }
    if (novels.length > 10) out += `  ... and ${novels.length - 10} more\n`;
  }
  if (state.corruptStates.length > 0) {
    out += `\n[ERROR] Corrupted state files detected: ${state.corruptStates.join(", ")}.`;
    out += `\nNovel state could not be loaded — these novels will start fresh.`;
  }
  return { content: [{ type: "text", text: out }] };
});

// search_rules
server.registerTool("search_rules", {
  title: "Search Rules",
  description: "Search the D&D 5e ruleset for matching terms.",
  inputSchema: { query: z.string() },
}, async ({ query }) => {
  if (!query || query.trim().length === 0) {
    const index = buildSearchIndex();
    return ok(`Ruleset contains ${index.length} indexed sections. Enter a search term to find specific rules.`);
  }
  const { results, totalFiles } = searchRules(query);
  if (results.length === 0) return err("NOT_FOUND", `No results for "${query}".`);
  let out = `[OK] ${results.length} result${results.length > 1 ? "s" : ""} for "${query}"\n`;
  for (const r of results.slice(0, 5)) {
    out += `- ${r.title} (${r.file}#${r.anchor})\n`;
  }
  return { content: [{ type: "text", text: out }] };
});

// ─── Lookup Tools ─────────────────────────────────────────────────────────

// lookup_equipment
server.registerTool("lookup_equipment", {
  title: "Lookup Equipment",
  description: "Look up a weapon, armor, or magic item by name.",
  inputSchema: { name: z.string() },
}, async ({ name }) => {
  const result = lookupEquipment(name);
  if (!result || !result.item) return err("NOT_FOUND", `No equipment matching "${name}".${result?.hints || ""}`);
  const e = result.item;
  let out = `[OK] ${e.name} (${result.type})\n`;
  for (const [k, v] of Object.entries(e)) {
    if (v && k !== "name") out += `  ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}\n`;
  }
  if (result.source) out += `\n---\nSource: ${result.source}\n`;
  return { content: [{ type: "text", text: out }] };
});

// lookup_spell
server.registerTool("lookup_spell", {
  title: "Lookup Spell",
  description: "Look up a spell by name.",
  inputSchema: { name: z.string() },
}, async ({ name }) => {
  const result = lookupSpell(name);
  if (!result || !result.item) return err("NOT_FOUND", `No spell matching "${name}".${result?.hints || ""}`);
  const s = result.item;
  let out = `[OK] ${s.name}\n`;
  if (s.level) out += `Level: ${s.level} ${s.school ? `(${s.school})` : ""}\n`;
  if (s.casting_time) out += `Casting Time: ${s.casting_time}\n`;
  if (s.range) out += `Range: ${s.range}\n`;
  if (s.components) out += `Components: ${s.components}\n`;
  if (s.duration) out += `Duration: ${s.duration}\n`;
  if (s.description) out += `\n${s.description}\n`;
  if (s.higher_levels) out += `\nAt Higher Levels: ${s.higher_levels}\n`;
  if (result.source) out += `\n---\nSource: ${result.source}\n`;
  return { content: [{ type: "text", text: out }] };
});

// lookup_monster
server.registerTool("lookup_monster", {
  title: "Lookup Monster",
  description: "Look up a monster by name.",
  inputSchema: { name: z.string() },
}, async ({ name }) => {
  const result = lookupMonster(name);
  if (!result || !result.item) return err("NOT_FOUND", `No monster matching "${name}".${result?.hints || ""}`);
  const m = result.item;
  let out = `[OK] ${m.name}\n`;
  if (m.heading_name && m.heading_name !== m.name) out = `[OK] ${m.heading_name}\n`;
  if (m.size || m.type || m.alignment) out += `${[m.size, m.type, m.alignment].filter(Boolean).join(", ")}\n`;
  if (m.armor_class) out += `AC: ${m.armor_class}\n`;
  if (m.hit_points) out += `HP: ${m.hit_points}\n`;
  if (m.speed) out += `Speed: ${m.speed}\n`;
  const stats = ["str", "dex", "con", "int", "wis", "cha"].filter(s => m[s] != null);
  if (stats.length > 0) out += "Stats: " + stats.map(s => `${s.toUpperCase()}: ${m[s]}`).join(", ") + "\n";
  if (m.saving_throws) out += `Saves: ${m.saving_throws}\n`;
  if (m.skills) out += `Skills: ${m.skills}\n`;
  if (m.damage_resistances) out += `Damage Resistances: ${m.damage_resistances}\n`;
  if (m.damage_immunities) out += `Damage Immunities: ${m.damage_immunities}\n`;
  if (m.condition_immunities) out += `Condition Immunities: ${m.condition_immunities}\n`;
  if (m.senses) out += `Senses: ${m.senses}\n`;
  if (m.languages) out += `Languages: ${m.languages}\n`;
  if (m.challenge) out += `Challenge: ${m.challenge}\n`;
  if (m.traits) out += `\nTraits:\n${m.traits}\n`;
  if (m.actions) out += `\nActions:\n${m.actions}\n`;
  if (m.description) out += `\n${m.description}\n`;
  if (result.source) out += `\n---\nSource: ${result.source}\n`;
  return { content: [{ type: "text", text: out }] };
});

// lookup_class
server.registerTool("lookup_class", {
  title: "Lookup Class",
  description: "Look up a character class by name.",
  inputSchema: { name: z.enum(CLASS_NAMES) },
}, async ({ name }) => {
  const hitDie = CLASS_HIT_DIE[name];
  const saves = CLASS_SAVES[name];
  let out = `[OK] ${name.charAt(0).toUpperCase() + name.slice(1)}\n`;
  out += `  Hit Die: d${hitDie}\n`;
  out += `  Saving Throw Proficiencies: ${saves.join(", ")}\n`;
  return ok(out);
});

// ─── Character Creation ───────────────────────────────────────────────────

// create_character
server.registerTool("create_character", {
  title: "Create Character",
  description: "Start character creation workflow for D&D 5e (stats → race → class → background → name).",
  inputSchema: {},
}, async () => {
  const novelErr = requireNovel();
  if (novelErr) return novelErr;

  state.workflow = {
    persona: state.activePersona,
    decisionQueue: [{ question: "Choose stat generation method.", options: ["roll_4d6", "standard_array", "cancel"] }],
    preWorkflowSnapshot: null,
    characterDraft: { stats: {} as Record<AbilityScore, number>, name: "", race: "", className: "fighter" },
  };
  return needInput("Choose stat generation method.", ["roll_4d6", "standard_array", "cancel"]);
});

// character_sheet
server.registerTool("character_sheet", {
  title: "Character Sheet",
  description: "Render a character sheet for an entity. Formats: markdown (default), ascii.",
  inputSchema: { entity_id: z.string(), format: z.enum(["markdown", "ascii"]).default("markdown") },
}, async ({ entity_id, format = "markdown" }) => {
  const entity = findEntity(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity "${entity_id}" not found.`);

  const prof = getProfBonus(entity);

  if (format === "ascii") {
    const W = 72;
    const pad = (s: string, len: number) => s.padEnd(len).slice(0, len);
    const center = (s: string, w: number) => {
      const left = Math.floor((w - s.length) / 2);
      return " ".repeat(Math.max(0, left)) + s;
    };
    const hr = "─".repeat(W);

    let o = `\n╔${hr}╗\n`;
    o += `║${center(`╔═══ ${entity.name.toUpperCase()} ═══╗`, W)}║\n║${center(" ", W)}║\n`;
    o += `║${center(`Level ${entity.level} ${entity.race} ${entity.className}`, W)}║\n║${center(" ", W)}║\n`;

    // Stats block
    o += `║${center("┬────────────────── STATS ──────────────────┬───────────┐", W)}║\n`;
    const smod = (s: AbilityScore) => { const m = getStatMod(entity, s); return m >= 0 ? `+${m}` : `${m}`; };
    o += `║${center(`│ STR │ DEX │ CON │ INT │ WIS │ CHA │ HP │ AC │`, W)}║\n`;
    o += `║${center(`│${pad(String(entity.stats.strength), 5)}│${pad(String(entity.stats.dexterity), 5)}│${pad(String(entity.stats.constitution), 5)}│${pad(String(entity.stats.intelligence), 5)}│${pad(String(entity.stats.wisdom), 5)}│${pad(String(entity.stats.charisma), 5)}│${pad(`${entity.currentHp}/${entity.maxHp}`, 5)}│${pad(String(entity.armorClass), 3)}│`, W)}║\n`;
    o += `║${center(`│${pad(smod("strength"), 5)}│${pad(smod("dexterity"), 5)}│${pad(smod("constitution"), 5)}│${pad(smod("intelligence"), 5)}│${pad(smod("wisdom"), 5)}│${pad(smod("charisma"), 5)}│     │   │`, W)}║\n`;

    // Combat line
    o += `║${center("┴──────────────────────────────────────────────┴───────────┘", W)}║\n`;
    o += `║${center(" ", W)}║\n`;
    o += `║  Speed: ${pad(`${entity.speed} ft.`, 8)}  Initiative: ${pad(`${entity.initiative >= 0 ? "+" : ""}${entity.initiative}`, 4)}  Proficiency: ${pad(`+${prof}`, 3)}  Hit Dice: ${pad(`${entity.hitDice.remaining}/${entity.hitDice.total} d${entity.hitDice.size}`, 10)}  ║\n`;
    o += `║${center(" ", W)}║\n`;

    // Saving throws
    o += `║${center("┬────────────────── SAVING THROWS ──────────────────┐", W)}║\n`;
    const saveNames = ABILITY_SCORES.map(s => {
      let b = getStatMod(entity, s);
      if (entity.saveProficiencies.includes(s)) b += prof;
      const mark = entity.saveProficiencies.includes(s) ? "*" : " ";
      return `${mark}${s.slice(0, 3).toUpperCase()} ${pad(`${b >= 0 ? "+" : ""}${b}`, 3)}`;
    });
    o += `║${center(`│ ${saveNames.join(" │ ")} │`, W)}║\n`;
    o += `║${center("┴──────────────────────────────────────────────────────┘", W)}║\n`;

    // Conditions
    if (entity.conditions.length > 0) {
      o += `║${center(" ", W)}║\n`;
      o += `║${center("CONDITIONS: " + entity.conditions.join(", "), W)}║\n`;
    }

    // Background
    if (entity.personality && Object.keys(entity.personality).length > 0) {
      o += `║${center(" ", W)}║\n`;
      for (const [k, v] of Object.entries(entity.personality)) {
        o += `║  ${pad(k + ":", 14)}${pad(v, W - 17)}║\n`;
      }
    }

    o += `║${center(" ", W)}║\n╚${hr}╝\n`;
    if (entity.saveProficiencies.length > 0) o += "* = proficient\n";
    state.audit(personaStr(), "character_sheet", { entity_id, format }, "OK");
    return ok(o);
  }

  // Markdown format (default)
  let out = `# ${entity.name}\n`;
  out += `Level ${entity.level} ${entity.race} ${entity.className}\n\n`;

  out += "## Abilities\n";
  for (const s of ABILITY_SCORES) {
    const mod = getStatMod(entity, s);
    out += `| ${s.slice(0, 3).toUpperCase()} | ${entity.stats[s]} | ${mod >= 0 ? "+" : ""}${mod} |\n`;
  }

  out += `\n## Combat\n`;
  out += `| HP | ${entity.currentHp}/${entity.maxHp} (temp: ${entity.tempHp}) |\n`;
  out += `| AC | ${entity.armorClass} |\n`;
  out += `| Speed | ${entity.speed} ft. |\n`;
  out += `| Initiative | ${entity.initiative >= 0 ? "+" : ""}${entity.initiative} |\n`;
  out += `| Proficiency | +${prof} |\n`;
  out += `| Hit Dice | ${entity.hitDice.remaining}/${entity.hitDice.total} d${entity.hitDice.size} |\n`;

  out += "\n## Saving Throws\n";
  for (const s of ABILITY_SCORES) {
    let bonus = getStatMod(entity, s);
    if (entity.saveProficiencies.includes(s)) bonus += prof;
    out += `| ${s.slice(0, 3).toUpperCase()} | ${bonus >= 0 ? "+" : ""}${bonus} |\n`;
  }

  if (entity.equippedWeapons.length > 0) {
    out += "\n## Attacks\n";
    for (const wepName of entity.equippedWeapons) {
      const w = lookupWeapon(wepName);
      if (w && w.item) {
        const a = weaponAbility(entity, w.item);
        const bonus = getStatMod(entity, a) + prof;
        out += `| ${w.item.name} | +${bonus} | ${w.item.damage} ${w.item.damageType} |\n`;
      }
    }
  }

  if (entity.conditions.length > 0) {
    out += "\n## Conditions\n";
    for (const c of entity.conditions) out += `- ${c}\n`;
  }
  if (entity.personality && Object.keys(entity.personality).length > 0) {
    out += "\n## Background\n";
    for (const [k, v] of Object.entries(entity.personality)) out += `- ${k}: ${v}\n`;
  }
  state.audit(personaStr(), "character_sheet", { entity_id, format }, "OK");
  return ok(out);
});

// import_character
server.registerTool("import_character", {
  title: "Import Character",
  description: "Import a roster character into the active novel.",
  inputSchema: { roster_id: z.string() },
}, async ({ roster_id }) => {
  const novelErr = requireNovel();
  if (novelErr) return novelErr;
  const imported = state.importCharacter(roster_id);
  if (!imported) return err("NOT_FOUND", `Roster character "${roster_id}" not found.`);
  state.snapshot();
  state.audit(personaStr(), "import_character", { roster_id }, `${imported.name} imported.`);
  return ok(`Imported ${imported.name} (entity://${imported.id})`);
});

// ─── Dice & Checks ────────────────────────────────────────────────────────

// roll_save
server.registerTool("roll_save", {
  title: "Roll Saving Throw",
  description: "Roll a d20 saving throw for an entity.",
  inputSchema: { save: z.enum(ABILITY_SCORES), entity_id: z.string(), dc: z.number().optional(), modifier: z.number().optional(), seed: z.string().optional() },
}, async ({ save, entity_id, dc = 15, modifier = 0, seed }) => {
  const entity = findEntity(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity "${entity_id}" not found.`);
  const { rng, used } = getRng(seed);
  const roll = rollD20(rng);
  let bonus = getStatMod(entity, save) + modifier;
  if (entity.saveProficiencies.includes(save)) bonus += getProfBonus(entity);
  const total = roll + bonus;
  const success = total >= dc;
  state.snapshot();
  state.audit(personaStr(), "roll_save", { save, entity_id, dc, seed: seed || null },
    `Rolled ${roll}+${bonus}=${total} vs DC ${dc} — ${success ? "SUCCESS" : "FAILURE"}`);
  let result = `${save.toUpperCase()} save: ${roll}+${bonus}=${total} vs DC ${dc} — ${success ? "Success" : "Failure"}\nDice: d20 = [${roll}]`;
  if (used) result += `\n[WARNING] Per-call seed overrides session seed.`;
  return ok(result);
});

// roll_skill_check
server.registerTool("roll_skill_check", {
  title: "Roll Skill Check",
  description: "Roll a d20 ability/skill check.",
  inputSchema: { skill: z.string(), entity_id: z.string(), dc: z.number().optional(), modifier: z.number().optional(), seed: z.string().optional() },
}, async ({ skill, entity_id, dc = 15, modifier = 0, seed }) => {
  const entity = findEntity(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity "${entity_id}" not found.`);
  const ability = SKILL_MAP[skill] || "strength";
  const { rng, used } = getRng(seed);
  const roll = rollD20(rng);
  let bonus = getStatMod(entity, ability) + modifier;
  if (entity.skills.includes(skill)) bonus += getProfBonus(entity);
  const total = roll + bonus;
  const success = total >= dc;
  state.snapshot();
  state.audit(personaStr(), "roll_skill_check", { skill, entity_id, dc },
    `Rolled ${roll}+${bonus}=${total} vs DC ${dc} — ${success ? "SUCCESS" : "FAILURE"}`);
  let result = `${skill} (${ability}) check: ${roll}+${bonus}=${total} vs DC ${dc} — ${success ? "Success" : "Failure"}\nDice: d20 = [${roll}]`;
  if (used) result += `\n[WARNING] Per-call seed overrides session seed.`;
  return ok(result);
});

// roll_weapon_attack
server.registerTool("roll_weapon_attack", {
  title: "Roll Attack",
  description: "Roll a d20 attack roll against a target AC.",
  inputSchema: { weapon: z.string(), entity_id: z.string(), target_ac: z.number().optional(), advantage: z.boolean().optional(), seed: z.string().optional() },
}, async ({ weapon, entity_id, target_ac, advantage, seed }) => {
  const entity = findEntity(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity "${entity_id}" not found.`);
  const { rng, used } = getRng(seed);
  const w = lookupWeapon(weapon);
  if (!w || !w.item) return err("NOT_FOUND", `Weapon "${weapon}" not found.${w?.hints || ""}`);

  const ability = weaponAbility(entity, w.item);
  const bonus = getStatMod(entity, ability) + getProfBonus(entity);
  let roll: number, crit = false, fumble = false, nat20 = false;
  if (advantage === true) {
    const a1 = rollD20(rng), a2 = rollD20(rng);
    roll = Math.max(a1, a2);
    nat20 = a1 === 20 || a2 === 20;
    fumble = a1 === 1 && a2 === 1;
    crit = nat20;
  } else if (advantage === false) {
    const d1 = rollD20(rng), d2 = rollD20(rng);
    roll = Math.min(d1, d2);
    nat20 = false;
    fumble = d1 === 1 || d2 === 1;
    crit = false;
  } else {
    roll = rollD20(rng);
    nat20 = roll === 20;
    fumble = roll === 1;
    crit = nat20;
  }

  const total = roll + bonus;
  const hit = target_ac !== undefined ? total >= target_ac : true;
  let result = `${w.item.name} attack: ${roll}+${bonus}=${total}`;
  if (target_ac !== undefined) result += ` vs AC ${target_ac} — ${hit ? "Hit!" : "Miss"}`;
  if (crit) result += ` — CRITICAL HIT!`;
  if (fumble) result += ` — FUMBLE!`;
  result += `\nDice: d20 = [${roll}]`;
  result += `\nWeapon: ${w.item.damage} ${w.item.damageType}${w.item.properties?.length ? ` (${typeof w.item.properties === "string" ? w.item.properties : (w.item.properties as string[]).join(", ")})` : ""}`;
  if (used) result += `\n[WARNING] Per-call seed overrides session seed.`;
  return ok(result);
});

// roll_weapon_damage
server.registerTool("roll_weapon_damage", {
  title: "Roll Damage",
  description: "Roll weapon damage against a target.",
  inputSchema: { weapon: z.string(), target_id: z.string(), attacker_id: z.string(), crit: z.boolean().optional(), seed: z.string().optional() },
}, async ({ weapon, target_id, attacker_id, crit = false, seed }) => {
  const attacker = findEntity(attacker_id);
  if (!attacker) return err("NOT_FOUND", `Attacker "${attacker_id}" not found.`);

  const target = findEntity(target_id);
  const dangerTarget = !target ? findCombatParticipant(target_id) : null;
  if (!target && !dangerTarget) return err("NOT_FOUND", `Target "${target_id}" not found.`);

  const { rng, used } = getRng(seed);
  const w = lookupWeapon(weapon);
  if (!w || !w.item) return err("NOT_FOUND", `Weapon "${weapon}" not found.`);

  const ability = weaponAbility(attacker, w.item);
  const bonus = getStatMod(attacker, ability);
  const diceCount = crit ? 2 : 1;
  const dmgStr = w.item.damage;
  let totalDamage = 0;
  const allFaces: number[] = [];

  if (dmgStr && dmgStr !== "-") {
    for (let i = 0; i < diceCount; i++) {
      const { faces, total } = rollDice(rng, dmgStr);
      allFaces.push(...faces);
      totalDamage += total;
    }
    totalDamage += bonus;
  }

  state.snapshot();
  let targetName: string;
  if (dangerTarget) {
    dangerTarget.hp = dangerTarget.hp !== undefined ? Math.max(0, dangerTarget.hp - totalDamage) : undefined;
    targetName = dangerTarget.name;
  } else {
    target!.currentHp = Math.max(0, target!.currentHp - totalDamage);
    targetName = target!.name;
  }

  let result = `${w.item.name} deals ${totalDamage} ${w.item.damageType} damage to ${targetName}\n`;
  result += `Rolls: ${dmgStr}${crit ? " x2" : ""}${bonus !== 0 ? ` + ${bonus > 0 ? "+" : ""}${bonus}` : ""} = [${allFaces.join(", ")}${bonus !== 0 ? `, ${bonus}` : ""}]`;
  if (crit) result += `\nCRITICAL HIT — damage dice doubled!`;
  if (dangerTarget) {
    result += `\n${targetName} HP: ${dangerTarget.hp !== undefined ? dangerTarget.hp : "?"}`;
    if (dangerTarget.hp !== undefined && dangerTarget.hp <= 0) result += ` — ${targetName} is at 0 HP!`;
  } else {
    result += `\n${target!.name} HP: ${target!.currentHp}/${target!.maxHp}`;
    if (target!.currentHp <= 0) result += ` — ${target!.name} is at 0 HP!`;
  }
  state.audit(personaStr(), "roll_weapon_damage", { weapon, target_id, crit }, `${totalDamage} damage dealt.`);
  if (used) result += `\n[WARNING] Per-call seed overrides session seed.`;
  return ok(result);
});

// ─── Conditions ───────────────────────────────────────────────────────────

// apply_condition
server.registerTool("apply_condition", {
  title: "Apply Condition",
  description: "Apply a condition to an entity.",
  inputSchema: { entity_id: z.string(), condition: z.string() },
}, async ({ entity_id, condition }) => {
  const entity = findEntity(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity "${entity_id}" not found.`);
  if (!CONDITIONS[condition]) return err("NOT_FOUND", `Unknown condition "${condition}".`, `Known: ${Object.keys(CONDITIONS).join(", ")}`);
  if (entity.conditions.includes(condition)) return err("STATE_CONFLICT", `${entity.name} already has condition "${condition}".`);
  state.snapshot();
  entity.conditions.push(condition);
  state.audit(personaStr(), "apply_condition", { entity_id, condition }, `${condition} applied.`);
  return ok(`${condition} applied to ${entity.name}.${CONDITIONS[condition] ? "\n" + CONDITIONS[condition].map(e => "- " + e).join("\n") : ""}`);
});

// remove_condition
server.registerTool("remove_condition", {
  title: "Remove Condition",
  description: "Remove a condition from an entity.",
  inputSchema: { entity_id: z.string(), condition: z.string() },
}, async ({ entity_id, condition }) => {
  const entity = findEntity(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity "${entity_id}" not found.`);
  const idx = entity.conditions.indexOf(condition);
  if (idx === -1) return err("NOT_FOUND", `${entity.name} does not have condition "${condition}".`);
  state.snapshot();
  entity.conditions.splice(idx, 1);
  state.audit(personaStr(), "remove_condition", { entity_id, condition }, `${condition} removed.`);
  return ok(`${condition} removed from ${entity.name}.`);
});

// ─── Tables ───────────────────────────────────────────────────────────────

// roll_on_table
server.registerTool("roll_on_table", {
  title: "Roll on Table",
  description: "Roll on a random generation table.",
  inputSchema: { table: z.enum(["trinkets", "travel_pace", "ability_modifiers", "difficulty_classes", "exhaustion", "xp_thresholds"]), class_name: z.enum(CLASS_NAMES).optional(), seed: z.string().optional() },
}, async ({ table, class_name, seed }) => {
  const { rng, used } = getRng(seed);
  let result = "";
  switch (table) {
    case "ability_modifiers": {
      const roll = rollD20(rng) + 5;
      const mod = abilityModifier(roll);
      result = `Ability Score: ${roll} → Modifier: ${mod >= 0 ? "+" : ""}${mod}`;
      break;
    }
    case "difficulty_classes": {
      const dcs = TABLES.difficulty_classes as [string, number][];
      result = "Difficulty Classes:\n" + dcs.map(([name, dc]) => `  ${name}: DC ${dc}`).join("\n");
      break;
    }
    case "exhaustion": {
      const ex = TABLES.exhaustion as [number, string][];
      const roll = rng.nextRange(1, 6);
      const level = ex.find(([l]) => l === roll);
      result = `Exhaustion level ${roll} (rolled d6)\n${level ? level[1] : "Unknown"}\n\nFull table:\n${ex.map(([l, e]) => `  ${l}: ${e}`).join("\n")}`;
      break;
    }
    case "xp_thresholds": {
      const xp = TABLES.xp_thresholds as [number, number][];
      result = "XP Thresholds:\n" + xp.map(([l, x]) => `  Level ${l}: ${x.toLocaleString()} XP`).join("\n");
      break;
    }
    case "trinkets": {
      const trinkets = ["A mummified goblin hand", "A piece of crystal that faintly glows", "A brass orb etched with strange runes", "A silver skull with a dark patina", "A tiny mechanical spider", "A glass sphere filled with moving fog", "A 1-pound egg with a bright red shell"];
      const roll = rng.nextRange(0, trinkets.length - 1);
      result = `Trinket (d${trinkets.length} = ${roll + 1}): ${trinkets[roll]}`;
      break;
    }
    case "travel_pace": {
      result = `Travel Pace:\n  Fast: 400 ft/min, 4 mi/hr, 30 mi/day (-5 passive Perception)\n  Normal: 300 ft/min, 3 mi/hr, 24 mi/day\n  Slow: 200 ft/min, 2 mi/hr, 18 mi/day (stealth possible)`;
      break;
    }
    default:
      return err("NOT_FOUND", `Table "${table}" not found.`);
  }
  state.audit(personaStr(), "roll_on_table", { table }, "OK");
  if (used) result += `\n[WARNING] Per-call seed overrides session seed.`;
  return ok(result);
});

// ─── Combat ───────────────────────────────────────────────────────────────

// init_combat
server.registerTool("init_combat", {
  title: "Initiate Combat",
  description: "Start a combat encounter. Game Master only.",
  inputSchema: { participants: z.array(z.string()), dangers: z.array(z.object({ name: z.string(), ac: z.number().optional(), hp: z.number().optional(), initiative_bonus: z.number().optional() })).optional() },
}, async ({ participants, dangers }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  const novel = state.getActiveNovel()!;
  if (novel.combat?.active) {
    return err("STATE_CONFLICT", "Combat is already active.", "End the current combat before starting a new one.");
  }

  if (state.workflow) return err("STATE_CONFLICT", "Cannot start combat while workflow is pending.");
  state.snapshot();

  type CP = import("./state.js").CombatParticipant;
  const parts: CP[] = [];
  for (const eid of participants) {
    const e = findEntity(eid) ?? state.getActiveNovel()?.npcs[eid];
    if (!e) return err("NOT_FOUND", `Entity "${eid}" not found.`);
    const { rng } = getRng();
    const bonus = "initiative" in (e as any) ? (e as any).initiative : abilityModifier((e as any).stats?.dexterity || 10);
    parts.push({ id: eid, type: "entity", name: (e as any).name || eid, initiative: rollD20(rng) + bonus });
  }

  if (dangers) {
    for (const d of dangers) {
      const dId = `danger_${state.nextNpcId()}`;
      const { rng } = getRng();
      parts.push({ id: dId, type: "danger", name: d.name, initiative: rollD20(rng) + (d.initiative_bonus || 0), ac: d.ac, hp: d.hp });
    }
  }

  parts.sort((a, b) => b.initiative - a.initiative);
  novel.combat = { active: true, round: 1, participants: parts, turnIndex: 0 };
  state.audit("game_master", "init_combat", { participants }, "OK");

  let r = `Combat started!\nRound: 1\nTurn order:`;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    r += `\n  ${i + 1}. ${p.name} (Init: ${p.initiative})`;
  }
  r += `\n\nCurrent turn: ${parts[0].name}`;
  return ok(r);
});

// advance_combat
server.registerTool("advance_combat", {
  title: "Advance Combat",
  description: "Advance to the next turn in combat. Game Master only.",
  inputSchema: {},
}, async () => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  const novel = state.getActiveNovel()!;
  if (!novel.combat?.active) return err("STATE_CONFLICT", "No active combat.");

  state.snapshot();
  const c = novel.combat;
  c.turnIndex++;
  if (c.turnIndex >= c.participants.length) {
    c.turnIndex = 0;
    c.round++;
    state.advanceRoundCountdowns();
  }

  const current = c.participants[c.turnIndex];
  state.audit("game_master", "advance_combat", {}, `Round ${c.round}, turn: ${current.name}`);
  return ok(`Round ${c.round}, current turn: ${current.name} (Init: ${current.initiative})`);
});

// end_combat
server.registerTool("end_combat", {
  title: "End Combat",
  description: "End the active combat encounter. Game Master only.",
  inputSchema: { outcome: z.string().optional() },
}, async ({ outcome }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  const novel = state.getActiveNovel()!;
  if (!novel.combat?.active) return err("STATE_CONFLICT", "No active combat.");

  const summary = outcome || "Combat concluded.";
  novel.combat = null;
  state.snapshot();
  state.audit("game_master", "end_combat", { outcome: outcome || "none" }, summary);
  return ok(summary);
});

// ─── Session ──────────────────────────────────────────────────────────────

// session_recap
server.registerTool("session_recap", {
  title: "Session Recap",
  description: "Summarize recent session activity.",
  inputSchema: {},
}, async () => {
  const novelErr = requireNovel();
  if (novelErr) return novelErr;
  const novel = state.getActiveNovel()!;
  const entities = Object.values(novel.entities);
  let out = "# Session Recap\n\n";
  out += `Novel: ${state.activeNovelSlug}, Persona: ${personaLabel()}\n\n`;
  out += "## Entities\n";
  for (const e of entities) {
    out += `- **${e.name}** (${e.race} ${e.className} Lv${e.level}): HP ${e.currentHp}/${e.maxHp}`;
    if (e.conditions.length > 0) out += ` [${e.conditions.join(", ")}]`;
    out += "\n";
  }
  if (novel.combat) {
    out += `\n## Combat — Round ${novel.combat.round}\n`;
    for (let i = 0; i < novel.combat.participants.length; i++) {
      const p = novel.combat.participants[i];
      out += `${i === novel.combat.turnIndex ? "→ " : "  "}${p.name} (Init: ${p.initiative})\n`;
    }
  }
  out += "\n## Recent Activity\n";
  for (const a of novel.auditLog.slice(-10)) {
    out += `- [${new Date(a.timestamp).toISOString().slice(11, 19)}] ${a.persona}: ${a.tool} → ${a.result.slice(0, 60)}\n`;
  }
  return ok(out);
});

// end_novel
server.registerTool("end_novel", {
  title: "End Novel",
  description: "End the current novel. Deactivates persona, removes save file.",
  inputSchema: {},
}, async () => {
  const novel = state.getActiveNovel();
  if (!novel) return err("STATE_CONFLICT", "No active novel.");
  state.endNovel();
  state.saveRoster();
  return ok("Novel ended. Roster preserved. Use create_novel or resume_novel to continue.");
});

// deprecated: end_game (alias for end_novel)
server.registerTool("end_game", {
  title: "End Game",
  description: "Deprecated. Use end_novel instead. Ends the current novel.",
  inputSchema: {},
}, async () => {
  const novel = state.getActiveNovel();
  if (!novel) return err("STATE_CONFLICT", "No active novel.");
  state.endNovel();
  state.saveRoster();
  return ok("Novel ended. Roster preserved. Use create_novel or resume_novel to continue.");
});

// create_novel
server.registerTool("create_novel", {
  title: "Create Novel",
  description: "Create a named novel. Novel persists to disk at .holonovel-state/novels/<slug>.json.",
  inputSchema: { name: z.string() },
}, async ({ name }) => {
  if (!name.trim()) return err("INVALID_INPUT", "Novel name must not be empty.");
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (state._novels[slug] && !state._novels[slug].ended) {
    return err("STATE_CONFLICT", `Novel "${slug}" already exists and is active.`, "Use resume_novel to resume or end_novel to end it.");
  }
  const novel = state.createNovel(name);
  state.saveState(novel.slug);
  state.audit(personaStr(), "create_novel", { name }, `Created novel ${novel.slug}`);
  return ok(`Novel created: "${novel.name}" (slug: ${novel.slug}). Save file: .holonovel-state/novels/${novel.slug}.json\n\nNext: import a character, load an adventure, or run session_zero to set up your campaign.`);
});

// resume_novel
server.registerTool("resume_novel", {
  title: "Resume Novel",
  description: "Resume a previously created novel from disk.",
  inputSchema: { slug: z.string() },
}, async ({ slug }) => {
  const novel = state.resumeNovel(slug);
  if (!novel) return err("NOT_FOUND", `Novel "${slug}" not found.`, `Available novels: ${state.listNovels().map(n => n.slug).join(", ") || "none"}`);
  state.audit(personaStr(), "resume_novel", { slug }, `Resumed novel ${novel.name}`);
  return ok(`Novel resumed: "${novel.name}" (slug: ${novel.slug}). Created: ${novel.createdAt}`);
});

// generate_adventure
server.registerTool("generate_adventure", {
  title: "Generate Adventure",
  description: "Generate an adventure scaffold from a premise. GM only.",
  inputSchema: { premise: z.string() },
}, async ({ premise }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  const adv = state.generateAdventure(premise);
  state.snapshot();
  state.audit(personaStr(), "generate_adventure", { premise }, adv.title);
  return ok(`Adventure scaffold generated: "${adv.title}" (${adv.sections.length} sections). Load it with load_adventure("${adv.slug}").`);
});

// generate_encounter
server.registerTool("generate_encounter", {
  title: "Generate Encounter",
  description: "Generate a scene + NPC + lore entry from context. Snapshot as single undo. GM only.",
  inputSchema: { context: z.string() },
}, async ({ context }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  state.snapshot();
  const result = state.generateEncounter(context);
  state.audit(personaStr(), "generate_encounter", { context }, `Scene: ${result.sceneDescription.slice(0, 80)}`);
  return ok(`Encounter generated:\n- Scene: ${result.sceneDescription}\n- NPC: npc://${result.npcName}\n- Lore: ${result.loreKey}`);
});

// set_active_entity
server.registerTool("set_active_entity", {
  title: "Set Active Entity",
  description: "Set the currently active entity (the character being played or narrated).",
  inputSchema: { entity_id: z.string() },
}, async ({ entity_id }) => {
  const novelErr = requireNovel();
  if (novelErr) return novelErr;
  const ok_ = state.setActiveEntity(entity_id);
  if (!ok_) return err("NOT_FOUND", `Entity "${entity_id}" not found in novel.`);
  state.snapshot();
  state.audit(personaStr(), "set_active_entity", { entity_id }, "OK");
  const entity = state.getNovelEntity(entity_id)!;
  return ok(`Active entity: ${entity.name} (entity://${entity_id})`);
});

// set_personality
server.registerTool("set_personality", {
  title: "Set Personality",
  description: "Set narrative personality fields for an entity. GM only.",
  inputSchema: { entity_id: z.string(), description: z.string().optional(), voice: z.string().optional(), background: z.string().optional(), goals: z.string().optional() },
}, async ({ entity_id, description, voice, background, goals }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const entity = state.getNovelEntity(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity "${entity_id}" not found.`);
  state.snapshot();
  if (description !== undefined) entity.description = description;
  if (voice !== undefined) entity.voice = voice;
  if (background !== undefined) entity.background = background;
  if (goals !== undefined) entity.goals = goals;
  state.audit(personaStr(), "set_personality", { entity_id, description, voice, background, goals }, "OK");
  return ok(`Personality fields updated for ${entity.name}.`);
});

// set_voice_examples
server.registerTool("set_voice_examples", {
  title: "Set Voice Examples",
  description: "Set voice and dialogue examples for an entity. GM only.",
  inputSchema: { entity_id: z.string(), examples: z.array(z.object({ context: z.string(), dialogue: z.string(), tag: z.string().optional() })) },
}, async ({ entity_id, examples }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const entity = state.getNovelEntity(entity_id);
  if (!entity) return err("NOT_FOUND", `Entity "${entity_id}" not found.`);
  state.snapshot();
  entity.voice_examples = examples;
  state.audit(personaStr(), "set_voice_examples", { entity_id, count: examples.length }, "OK");
  return ok(`${examples.length} voice examples set for ${entity.name}.`);
});

// player_signal
server.registerTool("player_signal", {
  title: "Player Signal",
  description: "Send a narrative signal from the player to the GM. Player only.",
  inputSchema: { signal: z.string(), detail: z.string().optional() },
}, async ({ signal, detail }) => {
  if (state.activePersona !== "player" && state.activePersona !== null) {
    return err("FORBIDDEN", "Requires Player persona.", "Use set_persona(\"player\") to switch.");
  }
  const novelErr = requireNovel();
  if (novelErr) return novelErr;
  state.snapshot();
  const msg = detail ? `${signal}: ${detail}` : signal;
  state.audit(personaStr(), "player_signal", { signal, detail }, msg);
  return ok(`Signal received from Player: ${msg}`);
});

// ─── Narrative ─────────────────────────────────────────────────────────────

// set_scene_state
server.registerTool("set_scene_state", {
  title: "Set Scene State",
  description: "Set the scene description and location. GM only.",
  inputSchema: { description: z.string() },
}, async ({ description }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  const novel = state.getActiveNovel()!;
  state.snapshot();
  novel.scene.history.push({ timestamp: new Date().toISOString(), description });
  novel.scene.description = description;
  state.audit(personaStr(), "set_scene_state", { description: description.slice(0, 80) }, "OK");
  return ok(`Scene set: ${description.slice(0, 100)}${description.length > 100 ? "..." : ""}`);
});

// set_scene_type
server.registerTool("set_scene_type", {
  title: "Set Scene Type",
  description: "Tag the scene as combat, social, exploration, or neutral. GM only.",
  inputSchema: { type: z.enum(["combat", "social", "exploration", "neutral"]) },
}, async ({ type }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  const novel = state.getActiveNovel()!;
  state.snapshot();
  novel.scene.type = type;
  state.audit(personaStr(), "set_scene_type", { type }, "OK");
  return ok(`Scene type set to: ${type}`);
});

// set_narrative_directive
server.registerTool("set_narrative_directive", {
  title: "Set Narrative Directive",
  description: "Set overarching narrative directive for the current scene. GM only.",
  inputSchema: { directive: z.string() },
}, async ({ directive }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  const novel = state.getActiveNovel()!;
  state.snapshot();
  novel.narrativeDirective = directive;
  state.audit(personaStr(), "set_narrative_directive", { directive }, "OK");
  return ok(`Narrative directive set.`);
});

// ─── NPCs ───────────────────────────────────────────────────────────────────

// create_npc
server.registerTool("create_npc", {
  title: "Create NPC",
  description: "Create a named NPC with optional stats and narrative fields. GM only.",
  inputSchema: { name: z.string(), description: z.string().optional(), disposition: z.string().optional(), location: z.string().optional(), ac: z.number().optional(), hp: z.number().optional(), speed: z.number().optional() },
}, async ({ name, description, disposition, location, ac, hp, speed }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  state.snapshot();
  const npc = state.createNpc(name, {
    description, disposition, location,
    ac, hp: hp ? { max: hp, current: hp } : undefined, speed,
  });
  state.audit(personaStr(), "create_npc", { name, description, disposition, location }, `Created NPC ${npc.id}`);
  return ok(`NPC created: ${name} (npc://${npc.id})${description ? ` — ${description}` : ""}`);
});

// update_npc
server.registerTool("update_npc", {
  title: "Update NPC",
  description: "Update an existing NPC's fields. GM only.",
  inputSchema: { npc_id: z.string(), name: z.string().optional(), description: z.string().optional(), disposition: z.string().optional(), location: z.string().optional(), ac: z.number().optional(), hp: z.number().optional(), speed: z.number().optional() },
}, async ({ npc_id, name, description, disposition, location, ac, hp, speed }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  state.snapshot();
  const updated = state.updateNpc(npc_id, {
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(disposition !== undefined ? { disposition } : {}),
    ...(location !== undefined ? { location } : {}),
    ...(ac !== undefined ? { ac } : {}),
    ...(hp !== undefined ? { hp: { max: hp, current: hp } } : {}),
    ...(speed !== undefined ? { speed } : {}),
  });
  if (!updated) return err("NOT_FOUND", `NPC "${npc_id}" not found.`);
  state.audit(personaStr(), "update_npc", { npc_id, name, description }, "OK");
  return ok(`NPC updated: ${updated.name} (npc://${updated.id})`);
});

// remove_npc
server.registerTool("remove_npc", {
  title: "Remove NPC",
  description: "Remove an NPC from the novel. GM only.",
  inputSchema: { npc_id: z.string() },
}, async ({ npc_id }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  state.snapshot();
  const ok_ = state.removeNpc(npc_id);
  if (!ok_) return err("NOT_FOUND", `NPC "${npc_id}" not found.`);
  state.audit(personaStr(), "remove_npc", { npc_id }, "Removed");
  return ok(`NPC ${npc_id} removed.`);
});

// ─── Countdowns ─────────────────────────────────────────────────────────────

// set_countdown
server.registerTool("set_countdown", {
  title: "Set Countdown",
  description: "Set a countdown timer. GM only.",
  inputSchema: { name: z.string(), ticks: z.number().min(1), type: z.enum(["round", "narrative"]).default("narrative") },
}, async ({ name, ticks, type = "narrative" }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  state.snapshot();
  const c = state.setCountdown(name, ticks, type);
  state.audit(personaStr(), "set_countdown", { name, ticks, type }, "OK");
  return ok(`Countdown "${name}" set: ${c.ticks}/${c.total} ticks (${c.type})`);
});

// advance_countdown
server.registerTool("advance_countdown", {
  title: "Advance Countdown",
  description: "Advance a countdown timer by one tick. GM only.",
  inputSchema: { name: z.string() },
}, async ({ name }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  state.snapshot();
  const c = state.advanceCountdown(name);
  if (!c) return err("NOT_FOUND", `Countdown "${name}" not found.`);
  state.audit(personaStr(), "advance_countdown", { name }, `${c.ticks}/${c.total}`);
  const expired = c.ticks === 0 ? ` — COUNTDOWN EXPIRED!` : "";
  return ok(`Countdown "${name}": ${c.ticks}/${c.total} ticks${expired}`);
});

// remove_countdown
server.registerTool("remove_countdown", {
  title: "Remove Countdown",
  description: "Remove a countdown timer. GM only.",
  inputSchema: { name: z.string() },
}, async ({ name }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  state.snapshot();
  const ok_ = state.removeCountdown(name);
  if (!ok_) return err("NOT_FOUND", `Countdown "${name}" not found.`);
  state.audit(personaStr(), "remove_countdown", { name }, "Removed");
  return ok(`Countdown "${name}" removed.`);
});

// ─── Lore ───────────────────────────────────────────────────────────────────

// set_lore_entry
server.registerTool("set_lore_entry", {
  title: "Set Lore Entry",
  description: "Log a lore entry for the current novel. Optional keyword triggers match scene descriptions. GM only.",
  inputSchema: { key: z.string(), content: z.string(), triggers: z.array(z.string()).default([]), persona_scope: z.enum(["game_master", "shared"]).default("game_master") },
}, async ({ key, content, triggers = [], persona_scope = "game_master" }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  state.snapshot();
  state.setLoreEntry(key, content, triggers, persona_scope);
  state.audit(personaStr(), "set_lore_entry", { key, triggers, persona_scope }, "OK");
  return ok(`Lore entry set: ${key} (${persona_scope})`);
});

// remove_lore_entry
server.registerTool("remove_lore_entry", {
  title: "Remove Lore Entry",
  description: "Remove a lore entry. GM only.",
  inputSchema: { key: z.string() },
}, async ({ key }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  state.snapshot();
  const ok_ = state.removeLoreEntry(key);
  if (!ok_) return err("NOT_FOUND", `Lore entry "${key}" not found.`);
  state.audit(personaStr(), "remove_lore_entry", { key }, "Removed");
  return ok(`Lore entry "${key}" removed.`);
});

// ─── Guidance ───────────────────────────────────────────────────────────────

// set_briefing_order
server.registerTool("set_briefing_order", {
  title: "Set Briefing Order",
  description: "Reorder sections of persona_briefing. Empty array resets to default. GM only.",
  inputSchema: { sections: z.array(z.string()) },
}, async ({ sections }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  const novel = state.getActiveNovel()!;
  const validTokens = ["foundations", "anti_slop", "voice_examples", "scene_state", "entities", "npcs", "countdowns", "lore", "adventure", "player_signals", "guidance", "registry", "intro_pointer", "session_zero_pointer", "narrative_directive", "novel"];
  for (const s of sections) {
    if (!validTokens.includes(s)) return err("INVALID_INPUT", `Invalid section token: "${s}".`, `Valid: ${validTokens.join(", ")}`);
  }
  state.snapshot();
  novel.briefingOrder = sections;
  state.audit(personaStr(), "set_briefing_order", { sections }, "OK");
  return ok(sections.length === 0 ? "Briefing order reset to default." : `Briefing order set: ${sections.join(" → ")}`);
});

// suggest_actions
server.registerTool("suggest_actions", {
  title: "Suggest Actions",
  description: "Map player intent to ruleset-legal tool invocations.",
  inputSchema: { intent: z.string(), entity_id: z.string().optional() },
}, async ({ intent, entity_id }) => {
  const i = intent.toLowerCase();
  const suggestions: { tool: string; params: Record<string, unknown>; description: string }[] = [];
  const sceneType = state.getActiveNovel()?.scene.type ?? "neutral";

  if (i.includes("attack") || i.includes("hit") || i.includes("strike") || i.includes("swing")) {
    suggestions.push({ tool: "roll_weapon_attack", params: { weapon: "<weapon>", entity_id: entity_id ?? "<id>" }, description: "Roll an attack against a target" });
  }
  if (i.includes("damage") || i.includes("hurt")) {
    suggestions.push({ tool: "roll_weapon_damage", params: { weapon: "<weapon>", target_id: "<target>", attacker_id: entity_id ?? "<id>" }, description: "Roll weapon damage" });
  }
  if (i.includes("save") || i.includes("resist") || i.includes("dodge")) {
    suggestions.push({ tool: "roll_save", params: { save: "<ability>", entity_id: entity_id ?? "<id>" }, description: "Roll a saving throw" });
  }
  if (i.includes("check") || i.includes("try") || i.includes("attempt") || i.includes("skill")) {
    suggestions.push({ tool: "roll_skill_check", params: { skill: "<skill>", entity_id: entity_id ?? "<id>" }, description: "Roll a skill check" });
  }
  if (i.includes("look") || i.includes("search") || i.includes("find") || i.includes("what")) {
    suggestions.push({ tool: "search_rules", params: { query: "<topic>" }, description: "Search rules for relevant information" });
  }
  if (i.includes("spell") || i.includes("cast")) {
    suggestions.push({ tool: "lookup_spell", params: { name: "<spell name>" }, description: "Look up a spell" });
  }
  if (i.includes("monster") || i.includes("creature")) {
    suggestions.push({ tool: "lookup_monster", params: { name: "<monster name>" }, description: "Look up a monster" });
  }

  if (sceneType === "combat" && suggestions.length === 0) {
    suggestions.push({ tool: "roll_weapon_attack", params: { weapon: "<weapon>", entity_id: entity_id ?? "<id>" }, description: "Make an attack" });
    suggestions.push({ tool: "roll_save", params: { save: "<ability>", entity_id: entity_id ?? "<id>" }, description: "Make a saving throw" });
  }

  if (suggestions.length === 0) {
    suggestions.push({ tool: "search_rules", params: { query: intent }, description: "Search the rules" });
    suggestions.push({ tool: "roll_skill_check", params: { skill: "<skill>", entity_id: entity_id ?? "<id>" }, description: "Roll a skill check" });
  }

  return ok(suggestions.map(s => `**${s.tool}** — ${s.description}\n  Params: \`${JSON.stringify(s.params)}\``).join("\n\n"));
});

// compress_audit
server.registerTool("compress_audit", {
  title: "Compress Audit",
  description: "Summarize recent audit entries for a persona. GM only.",
  inputSchema: { max_entries: z.number().default(20), persona_filter: z.enum(["player", "game_master"]).optional() },
}, async ({ max_entries = 20, persona_filter }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  const novel = state.getActiveNovel()!;
  const entries = novel.auditLog
    .filter(a => !persona_filter || a.persona === persona_filter)
    .slice(-max_entries);
  if (entries.length === 0) return ok("No matching audit entries.");
  state.audit(personaStr(), "compress_audit", { max_entries, persona_filter }, "OK");
  return ok(entries.map(e => `[${e.timestamp.slice(11, 19)}] ${e.persona}: ${e.tool} → ${e.result.slice(0, 120)}`).join("\n"));
});

// load_adventure
server.registerTool("load_adventure", {
  title: "Load Adventure",
  description: "Load an adventure module from the TTRPG_ADVENTURE directory. GM only.",
  inputSchema: { slug: z.string() },
}, async ({ slug }) => {
  const gmErr = requireGM(); if (gmErr) return gmErr;
  const novelErr = requireNovel(); if (novelErr) return novelErr;
  const ok_ = state.setActiveAdventure(slug);
  const allAdvs = state.getActiveNovel() ? { ...state._systemAdventures, ...state.getActiveNovel()!.adventureModules } : { ...state._systemAdventures };
  if (!ok_) return err("NOT_FOUND", `Adventure "${slug}" not found.`, `Available: ${Object.keys(allAdvs).join(", ") || "none loaded"}`);
  const adv = state.getActiveAdventure()!;
  state.audit(personaStr(), "load_adventure", { slug }, adv.title);
  return ok(`Adventure loaded: ${adv.title} (${adv.sections.length} sections)`);
});

// ─── Resources ────────────────────────────────────────────────────────────

server.registerResource("ruleset_list", "ruleset://", { title: "Ruleset Index" }, async () => {
  const index = buildSearchIndex();
  const files = new Map<string, string[]>();
  for (const e of index) {
    if (!files.has(e.file)) files.set(e.file, []);
    files.get(e.file)!.push(e.title);
  }
  let text = `# D&D 5e SRD v5.1\n\n`;
  text += `${index.length} sections across ${files.size} files\n`;
  for (const [file, sections] of [...files.entries()].sort().slice(0, 30)) {
    text += `\n## ${file}\n`;
    for (const s of sections.slice(0, 5)) text += `- ${s}\n`;
    if (sections.length > 5) text += `- ... and ${sections.length - 5} more sections\n`;
  }
  return { contents: [{ uri: "ruleset://", mimeType: "text/markdown", text }] };
});

server.registerResource("entities_list", "entities://", { title: "Game Entities" }, async () => {
  const novel = state.getActiveNovel();
  if (!novel) return { contents: [{ uri: "entities://", mimeType: "text/markdown", text: "# Entities\n\nNo active novel." }] };
  let text = "# Active Game Entities\n\n";
  for (const e of Object.values(novel.entities)) {
    text += `- **${e.name}** (${e.race} ${e.className} Lv${e.level}): HP ${e.currentHp}/${e.maxHp}, AC ${e.armorClass}\n`;
    text += `  entity://${e.id}\n`;
  }
  return { contents: [{ uri: "entities://", mimeType: "text/markdown", text }] };
});

server.registerResource("entity_detail", "entity://{id}", { title: "Entity Detail" }, async (uri) => {
  const id = uri.pathname.replace(/^\/+/, "");
  const entity = findEntity(id);
  if (!entity) return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: `# Not Found\n\nEntity "${id}" not found.` }] };
  const prof = getProfBonus(entity);
  let text = `# ${entity.name}\n`;
  text += `Level ${entity.level} ${entity.race} ${entity.className}\n\n`;
  text += "## Stats\n";
  for (const s of ABILITY_SCORES) {
    text += `- ${s.slice(0, 3).toUpperCase()}: ${entity.stats[s]} (${getStatMod(entity, s) >= 0 ? "+" : ""}${getStatMod(entity, s)})\n`;
  }
  text += `\n## Combat\n`;
  text += `- HP: ${entity.currentHp}/${entity.maxHp}\n- AC: ${entity.armorClass}\n- Speed: ${entity.speed} ft.\n`;
  text += `- Proficiency: +${prof}\n- Hit Dice: ${entity.hitDice.remaining}/${entity.hitDice.total} d${entity.hitDice.size}\n`;
  if (entity.conditions.length > 0) text += `- Conditions: ${entity.conditions.join(", ")}\n`;
  return { contents: [{ uri: uri.href, mimeType: "text/markdown", text }] };
});

server.registerResource("audit_log", "audit://novel", { title: "Audit Log" }, async () => {
  const novel = state.getActiveNovel();
  if (!novel || novel.auditLog.length === 0) {
    return { contents: [{ uri: "audit://novel", mimeType: "text/markdown", text: "# Audit Log\n\nNo entries." }] };
  }
  let text = "# Audit Log\n\n";
  const visible = state.activePersona === "game_master" ? novel.auditLog : novel.auditLog.filter(a => a.persona !== "game_master");
  for (const e of visible) {
    text += `- [${new Date(e.timestamp).toISOString().slice(11, 19)}] ${e.persona}: ${e.tool} → ${e.result}\n`;
  }
  return { contents: [{ uri: "audit://novel", mimeType: "text/markdown", text }] };
});

server.registerResource("roster_list", "roster://", { title: "Character Roster" }, async () => {
  const roster = state._roster;
  const entries = Object.values(roster);
  if (entries.length === 0) return { contents: [{ uri: "roster://", mimeType: "text/markdown", text: "# Roster\n\nNo characters in roster." }] };
  let text = "# Character Roster\n\n";
  for (const e of entries) {
    text += `- **${e.name}** (${e.race} ${e.className}) — roster://${e.id}\n`;
  }
  return { contents: [{ uri: "roster://", mimeType: "text/markdown", text }] };
});

// ─── v1.2 Resources ────────────────────────────────────────────────────────

server.registerResource("party_current", "party://current", { title: "Party Overview" }, async () => {
  const entities = state.getAllNovelEntities();
  if (entities.length === 0) return { contents: [{ uri: "party://current", mimeType: "text/markdown", text: "# Party\n\nNo characters in novel." }] };
  let text = "# Party\n\n";
  const activeId = state.getActiveNovel()?.activeEntityId;
  for (const e of entities) {
    const active = e.id === activeId ? "★ " : "";
    text += `- ${active}**${e.name}** (${e.race} ${e.className} Lv${e.level}) — entity://${e.id}\n`;
  }
  return { contents: [{ uri: "party://current", mimeType: "text/markdown", text }] };
});

server.registerResource("npcs_list", "npcs://", { title: "NPCs" }, async () => {
  const npcs = state.getAllNpcs();
  if (npcs.length === 0) return { contents: [{ uri: "npcs://", mimeType: "text/markdown", text: "# NPCs\n\nNo NPCs in novel." }] };
  let text = "# NPCs\n\n";
  for (const n of npcs) {
    text += `- **${n.name}**${n.disposition ? ` (${n.disposition})` : ""} — npc://${n.id}\n`;
    if (n.description) text += `  ${n.description}\n`;
  }
  return { contents: [{ uri: "npcs://", mimeType: "text/markdown", text }] };
});

server.registerResource("scene_current", "scene://current", { title: "Current Scene" }, async () => {
  const novel = state.getActiveNovel();
  if (!novel) return { contents: [{ uri: "scene://current", mimeType: "text/markdown", text: "# Scene\n\nNo active novel." }] };
  const s = novel.scene;
  let text = `# Scene\n\n**Description:** ${s.description || "(none)"}\n**Type:** ${s.type}\n\n## History\n`;
  for (const h of s.history.slice(-5)) text += `- [${h.timestamp.slice(11, 19)}] ${h.description}\n`;
  return { contents: [{ uri: "scene://current", mimeType: "text/markdown", text }] };
});

server.registerResource("countdown_active", "countdown://active", { title: "Active Countdowns" }, async () => {
  const novel = state.getActiveNovel();
  if (!novel || Object.keys(novel.countdowns).length === 0) return { contents: [{ uri: "countdown://active", mimeType: "text/markdown", text: "# Countdowns\n\nNo active countdowns." }] };
  let text = "# Countdowns\n\n";
  for (const c of Object.values(novel.countdowns)) {
    text += `- **${c.name}**: ${c.ticks}/${c.total} (${c.type})${c.active ? "" : " — EXPIRED"}\n`;
  }
  return { contents: [{ uri: "countdown://active", mimeType: "text/markdown", text }] };
});

// ─── Novel Resources ──────────────────────────────────────────────────────

server.registerResource("novel_current", "novel://current", { title: "Current Novel" }, async () => {
  const novel = state.getActiveNovel();
  if (!novel) return { contents: [{ uri: "novel://current", mimeType: "text/markdown", text: "# Novel\n\nNo active novel. Use create_novel or resume_novel." }] };
  let text = `# Novel: ${novel.name}\n\n`;
  text += `**Slug:** ${novel.slug}\n`;
  text += `**Created:** ${novel.createdAt.slice(0, 10)}\n`;
  text += `**Setup:** characters ${novel.charactersPresent ? "present" : "missing"}, adventure ${novel.adventureSet ? "set" : "not set"}, session zero ${novel.sessionZeroCompleted ? "completed" : "pending"}\n`;
  text += `**Entities:** ${Object.keys(novel.entities).length} characters\n`;
  return { contents: [{ uri: "novel://current", mimeType: "text/markdown", text }] };
});

server.registerResource("novel_detail", "novel://{slug}", { title: "Novel Detail" }, async (uri) => {
  const slug = uri.pathname.replace(/^\/+/, "");
  const novels = state.listNovels().filter(n => n.slug === slug);
  if (novels.length === 0) return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: `# Not Found\n\nNovel "${slug}" not found.` }] };
  const n = novels[0];
  return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: `# Novel: ${n.name}\n\n**Slug:** ${n.slug}\n**Last modified:** ${n.lastModified.slice(0, 10)}\n**Active:** ${n.active ? "yes" : "no"}` }] };
});

// ─── Prompts ──────────────────────────────────────────────────────────────

server.registerPrompt("intro", {
  title: "Introduction",
  description: "Welcome to D&D 5e. Overview of the game, core mechanic, and next steps.",
}, async () => {
  const index = buildSearchIndex();
  const files = new Set(index.map(e => e.file));
  return {
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `# Dungeons & Dragons 5th Edition

Welcome to **D&D 5e**, the world's greatest roleplaying game. Gather your party, sharpen your swords, and prepare for adventure. You'll explore ancient dungeons, battle fearsome monsters, uncover lost treasures, and forge legends together.

You can also use \`session_zero\` to set the tone, boundaries, and character backgrounds before you begin.

## The Core Mechanic

D&D 5e uses a **d20 roll-over** system — simple, fast, and flexible. Roll a twenty-sided die, add your modifiers, and meet or beat the target number.

- **Ability Checks** — climb, persuade, investigate. Roll d20 + relevant ability modifier (and proficiency bonus if trained)
- **Attack Rolls** — swing your weapon or cast a spell. Roll d20 + attack bonus vs the target's Armor Class
- **Saving Throws** — dodge fireballs, resist poison, hold the line. Roll d20 + your save bonus

Roll a natural 20? That's a critical hit. Roll a 1? Fate has other plans.

## What You Can Do

- **Create characters** — roll stats, choose your race and class, equip your gear
- **Roll dice** — ability checks, saving throws, attack rolls, damage
- **Run combat** — initiative, attacks, conditions, tactical encounters
- **Search the rules** — 319 spells, 318 monsters, 37 weapons, 14 armor types
- **Build encounters** — create NPCs, set countdowns, load adventures
- **Manage scenes** — track locations, lore, narrative directives

## Start Here

1. **Make a character** — call \`create_character()\` and choose your race, class, and name
2. **Learn the rules** — call \`search_rules("combat")\` or \`lookup_spell("fireball")\`
3. **Roll the dice** — make skill checks, saves, and attacks
4. **Begin your adventure** — the DM describes the scene and asks: "What do you do?"

**Races:** ${RACES.join(", ")} | **Classes:** ${CLASS_NAMES.join(", ")}

## Personas

- **Player** — roll dice, manage your character, search the rules
- **Game Master (DM)** — full access: combat, NPCs, countdowns, scenes, lore, and all DM tools

Switch with \`set_persona\`. With no persona active, all tools are accessible.

Call \`help\` for all tools or \`persona_briefing\` for role-specific guidance.`
      }
    }]
  };
});

server.registerPrompt("persona_briefing", {
  title: "Persona Briefing",
  description: "What this persona can see and do, including guidance, anti-slop, voice examples, scene state, entities, NPCs, countdowns, lore, and tool registry.",
}, async () => {
  const p = state.activePersona;
  const isPlayer = p === "player";
  const isGM = p === "game_master" || p === null;
  const novel = state.getActiveNovel();

  const playerGuidance = [
    "**Describe actions, not mechanics.** Tell the DM what you want to do, not what rule you want to use. The DM will decide what check (if any) applies.",
    "**Know your abilities.** Read your class features, spells, and racial traits. They're your toolkit for solving problems.",
    "**Work as a team.** D&D is cooperative. Share the spotlight, support your allies, and build on each other's ideas.",
    "**Engage with the world.** Ask questions about your surroundings. The more you interact, the richer the story becomes.",
    "**Think creatively.** Your character sheet is a starting point, not a menu. You can attempt anything you can imagine.",
  ];

  const gmGuidance = [
    "**Fail forward.** Every failure should advance the story, just with a complication. Don't let a failed roll stop the action dead.",
    "**Balance the three pillars.** Combat, exploration, and social interaction should all feature. Each character class shines in different contexts.",
    "**Use the DC scale.** Easy (5), Medium (15), Hard (20), Very Hard (25). Set DCs based on difficulty, not character skill.",
    "**Manage action economy.** D&D 5e combat math favors the side with more actions. Boss monsters need legendary/lair actions to compete.",
    "**Reward creativity.** If a player describes a clever approach that makes sense, grant advantage. Encourage engagement with the fiction.",
    "**Prep situations, not plots.** Create interesting scenarios with meaningful choices. Let player decisions drive the story.",
    "**Remember the 6-8 encounter day.** The game's resource economy assumes multiple encounters between long rests. Not all need be combat.",
  ];

  const antiSlopGM = [
    "[anti-slop] **Purple prose.** Be concrete and sensory, not ornate. *Bad:* 'The ancient crumbling architecture haunts you with whispers of a bygone era.' *Good:* 'The hall is old. Cracked pillars. Moss on the flagstones. A draft carries the scent of damp earth.'",
    "[anti-slop] **Negation framing.** Describe what IS there, not what is absent. Transformers process negation poorly. *Bad:* 'You don't see any threats.' *Good:* 'The corridor is still. Dust settles undisturbed on the floor.'",
    "[anti-slop] **Rushing to closure.** End on an image or choice, not a resolution. Let players decide what happens next. Always leave the ball in their court.",
    "[anti-slop] **Declaring player actions.** Never narrate what a PC thinks, feels, or does. Describe the world; let the player react. *Bad:* 'A wave of courage washes over you.' *Good:* 'The beast exhales — hot, wet breath. Its eyes track you.'",
    "[anti-slop] **Vary pacing.** Not every response needs 'What do you do?' Some should end on an image and let silence build pressure.",
    "[anti-slop] **Don't over-describe the known.** Don't repeat established scene details. Use shorthand: 'The darkness waits.'",
  ];

  const antiSlopPlayer = [
    "[anti-slop] **Don't establish world facts.** Ask, don't declare. *Bad:* 'I notice the assassin behind the curtain.' *Good:* 'I scan the room. The curtains — are they moving?'",
    "[anti-slop] **Don't assume outcomes.** Describe the attempt, not the result. *Bad:* 'I stab him and he falls dead.' *Good:* 'I lunge at the guard with my dagger, aiming for his throat.'",
    "[anti-slop] **Don't rush past tension.** Investigate before acting. Check for traps. Study the lock. Feel the weight of the moment.",
    "[anti-slop] **Don't declare NPC reactions.** State your argument, then wait for the DM. *Bad:* 'The merchant is impressed and lowers the price.' *Good:* 'I lay out my reasoning and wait for his response.'",
  ];

  const defaultOrder = ["foundations", "anti_slop", "voice_examples", "scene_state", "entities", "npcs", "countdowns", "lore", "adventure", "player_signals", "narrative_directive", "novel", "guidance", "registry", "intro_pointer", "session_zero_pointer"];
  const sectionOrder = (novel?.briefingOrder?.length ?? 0) > 0 ? novel!.briefingOrder : defaultOrder;

  const sections: Record<string, string> = {};

  sections["foundations"] = isPlayer ? playerGuidance.map(g => `- ${g}`).join("\n") : gmGuidance.map(g => `- ${g}`).join("\n");

  sections["anti_slop"] = isPlayer ? antiSlopPlayer.join("\n") : (isGM ? antiSlopGM.join("\n") : [antiSlopGM.join("\n"), antiSlopPlayer.join("\n")].join("\n\n---\n\n"));

  sections["voice_examples"] = (() => {
    const entity = state.getActiveEntity();
    if (!entity) return "_No active entity. Use `set_active_entity` to select one._";
    let v = "";
    if (entity.voice) v += `**Voice:** ${entity.voice}\n`;
    if (entity.voice_examples?.length) {
      v += entity.voice_examples.map(e => `_${e.context}:_ "${e.dialogue}"${e.tag ? ` [${e.tag}]` : ""}`).join("\n");
    }
    return v || "_No voice examples set. Use `set_voice_examples`._";
  })();

  sections["scene_state"] = (() => {
    if (!novel) return "_No active novel._";
    const s = novel.scene;
    let v = s.description ? `**Scene:** ${s.description}\n` : "_No scene set._";
    v += `**Type:** ${s.type}\n`;
    if (s.history.length > 1) v += `**Recent:** ${s.history[s.history.length - 2].description.slice(0, 80)}\n`;
    return v;
  })();

  sections["entities"] = (() => {
    const entities = state.getAllNovelEntities();
    if (entities.length === 0) return "_No entities in novel._";
    return entities.map(e => {
      const active = e.id === novel?.activeEntityId ? "★ " : "";
      return `- ${active}**${e.name}** (${e.race} ${e.className} Lv${e.level}): HP ${e.currentHp}/${e.maxHp}, AC ${e.armorClass}${e.conditions.length ? ` [${e.conditions.join(", ")}]` : ""}`;
    }).join("\n");
  })();

  sections["npcs"] = (() => {
    const npcs = state.getAllNpcs();
    if (npcs.length === 0) return "_No NPCs in novel._";
    return npcs.map(n => `- **${n.name}**${n.disposition ? ` (${n.disposition})` : ""}${n.description ? ` — ${n.description}` : ""}${n.location ? ` @ ${n.location}` : ""}`).join("\n");
  })();

  sections["countdowns"] = (() => {
    if (!novel || Object.keys(novel.countdowns).length === 0) return "_No active countdowns._";
    return Object.values(novel.countdowns).map(c => `- **${c.name}**: ${c.ticks}/${c.total} (${c.type})${c.active ? "" : " — EXPIRED"}`).join("\n");
  })();

  sections["lore"] = (() => {
    const persona = state.activePersona ?? "game_master";
    const entries = state.getActiveLore(persona);
    if (entries.length === 0) return "_No relevant lore entries for current scene._";
    return entries.map(e => `- **${e.key}**: ${e.content.slice(0, 120)} (${e.persona_scope})`).join("\n");
  })();

  sections["adventure"] = (() => {
    const adv = state.getActiveAdventure();
    if (!adv) return "_No adventure loaded._";
    let v = `**${adv.title}** (${adv.sections.length} sections indexed)\n`;
    for (const s of adv.sections.slice(0, 5)) v += `- ${s.title}${s.gm_only ? " [GM]" : ""}\n`;
    return v;
  })();

  sections["novel"] = (() => {
    if (!novel) return "_No active novel._";
    return `**${novel.name}** (slug: ${novel.slug})\nCreated: ${novel.createdAt.slice(0, 10)}\nCharacters: ${novel.charactersPresent ? "present" : "none"}, Adventure: ${novel.adventureSet ? "loaded" : "none"}, Session Zero: ${novel.sessionZeroCompleted ? "done" : "pending"}`;
  })();

  sections["player_signals"] = (() => {
    if (!novel) return "_No active novel._";
    const signals = novel.auditLog.filter(a => a.tool === "player_signal").slice(-3);
    if (signals.length === 0) return "_No player signals._";
    return signals.map(s => `- [${s.timestamp.slice(11, 19)}] ${s.result}`).join("\n");
  })();

  sections["narrative_directive"] = (() => {
    if (!novel || !novel.narrativeDirective) return "_No narrative directive set._";
    return novel.narrativeDirective;
  })();

  sections["guidance"] = "- Ability checks: d20 + ability mod + prof (if skilled) vs DC\n- Attack rolls: d20 + ability mod + prof vs AC; nat 20 = crit (double damage dice)\n- Advantage: roll 2d20, take highest. Disadvantage: take lowest. They cancel.\n- Conditions apply mechanical penalties; use `apply_condition` and `remove_condition`\n- Hit Points: at 0 HP = unconscious, roll death saves";

  sections["registry"] = (() => {
    const gmOnly = ["init_combat", "advance_combat", "end_combat", "set_personality", "set_voice_examples", "set_scene_state", "set_scene_type", "set_narrative_directive", "create_npc", "update_npc", "remove_npc", "set_countdown", "advance_countdown", "remove_countdown", "set_lore_entry", "remove_lore_entry", "set_briefing_order", "compress_audit", "load_adventure", "generate_adventure", "generate_encounter"];
    const visible = ALL_TOOLS.filter(t => isPlayer ? !gmOnly.includes(t) : true);
    return visible.map(t => `- \`${t}\``).join("\n");
  })();

  sections["intro_pointer"] = "Use the `intro` prompt for a guided introduction to the server.";
  sections["session_zero_pointer"] = "Use the `session_zero` prompt for campaign setup: premise, characters, expectations, boundaries.";

  let text = `# ${personaLabel()} Briefing — D&D 5e\n\n`;
  for (const token of sectionOrder) {
    const content = sections[token];
    if (!content) continue;
    const title = token.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    text += `## ${title}\n\n${content}\n\n`;
  }

  return {
    messages: [{ role: "user", content: { type: "text", text } }]
  };
});

server.registerPrompt("use_tool", {
  title: "Use Tool",
  description: "Map a natural-language intent to a ruleset tool.",
  argsSchema: { intent: z.string() },
}, async ({ intent }) => {
  const i = intent.toLowerCase();
  const mapping: Record<string, string> = {
    "attack": "roll_weapon_attack", "hit": "roll_weapon_attack", "strike": "roll_weapon_attack",
    "damage": "roll_weapon_damage", "hurt": "roll_weapon_damage",
    "save": "roll_save", "resist": "roll_save", "dodge": "roll_save",
    "check": "roll_skill_check", "try": "roll_skill_check", "attempt": "roll_skill_check",
    "search": "search_rules", "find": "search_rules", "lookup": "search_rules",
    "spell": "lookup_spell", "monster": "lookup_monster", "equipment": "lookup_equipment",
    "combat": "init_combat", "fight": "init_combat",
    "condition": "apply_condition", "remove condition": "remove_condition",
    "character": "character_sheet", "create": "create_character",
    "recap": "session_recap", "summary": "session_recap",
    "table": "roll_on_table", "random": "roll_on_table",
    "undo": "undo", "rollback": "undo",
    "help": "help", "tools": "help",
  };
  let matched = "";
  for (const [key, tool] of Object.entries(mapping)) {
    if (i.includes(key)) { matched = tool; break; }
  }
  const text = matched
    ? `Intent "${intent}" → Use \`${matched}\`. Example: call ${matched}() with the relevant parameters.`
    : `Intent "${intent}" not directly mapped. Try \`search_rules("${intent}")\` or \`help\` to find the right tool.`;
  return { messages: [{ role: "user", content: { type: "text", text } }] };
});

server.registerPrompt("lookup_rule", {
  title: "Lookup Rule",
  description: "Map a rules question to the right search or lookup tool.",
  argsSchema: { intent: z.string() },
}, async ({ intent }) => {
  const i = intent.toLowerCase();
  let tool = "search_rules";
  let query = intent;
  if (i.includes("spell") || i.includes("fireball") || i.includes("magic missile") || i.includes("cure wounds")) {
    tool = "lookup_spell"; query = intent.replace(/spell\s*/i, "");
  } else if (i.includes("monster") || i.includes("goblin") || i.includes("dragon") || i.includes("beholder")) {
    tool = "lookup_monster"; query = intent.replace(/monster\s*/i, "");
  } else if (i.includes("weapon") || i.includes("sword") || i.includes("armor") || i.includes("equipment")) {
    tool = "lookup_equipment"; query = intent.replace(/(weapon|armor|equipment)\s*/i, "");
  }
  const text = `Rule question: "${intent}"\nRecommended tool: \`${tool}\`\nSuggested query: "${query.trim()}"`;
  return { messages: [{ role: "user", content: { type: "text", text } }] };
});

server.registerPrompt("run_workflow", {
  title: "Run Workflow",
  description: "Guide the AI through a multi-step ruleset workflow.",
  argsSchema: { intent: z.string() },
}, async ({ intent }) => {
  const i = intent.toLowerCase();
  let text = "";
  if (i.includes("character") || i.includes("create")) {
    text = `# Character Creation Workflow\n\n1. Start with \`create_character()\`\n2. Choose stat generation: roll_4d6 or standard_array\n3. Pick a race from: ${RACES.join(", ")}\n4. Pick a class from: ${CLASS_NAMES.join(", ")}\n5. Choose a background\n6. Name your character\n\nEach step raises [NEED_INPUT] — respond with \`respond(decision, option)\`.\nWrite the full chain before confirming. Use \`character_sheet(entity_id)\` to review the result.`;
  } else if (i.includes("combat") || i.includes("fight")) {
    text = `# Combat Workflow\n\n1. **Initiate** — \`init_combat({participants: ["e1", "e2"]})\` with entity IDs\n2. **Roll attack** — \`roll_weapon_attack({weapon: "longsword", entity_id: "e1", target_ac: 15})\`\n3. **Roll damage** — \`roll_weapon_damage({weapon: "longsword", target_id: "e2", attacker_id: "e1"})\`\n4. **Apply conditions** — \`apply_condition({entity_id: "e2", condition: "prone"})\`\n5. **Advance** — \`advance_combat()\` to next turn\n6. **End** — \`end_combat({outcome: "Party victory"})\` when done`;
  } else {
    text = `No workflow matching "${intent}". Supported: "create character", "run combat". Use \`help\` to see all tools.`;
  }
  return { messages: [{ role: "user", content: { type: "text", text } }] };
});

server.registerPrompt("session_zero", {
  title: "Session Zero",
  description: "Campaign setup guide: pitch premise, create characters, set expectations.",
}, async () => {
  return {
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `# Session Zero — Campaign Setup

## Step 1: Pitch the Premise

Begin by describing the adventure setting and initial hook. Example:

"The kingdom of Aethelgard faces a rising darkness. Villages along the border are disappearing without a trace. The king has issued a call for adventurers to investigate. You each have your own reason for answering that call."

## Step 2: Create Characters

Walk each player through \`create_character()\`. The workflow guides them through:

1. Roll stats (4d6 drop lowest, or standard array: 15/14/13/12/10/8)
2. Choose race — ${RACES.join(", ")}
3. Choose class — ${CLASS_NAMES.join(", ")}
4. Choose background — ${BACKGROUNDS.slice(0, 6).join(", ")}, and more
5. Name the character

Use \`import_character("roster_id")\` to add each to the novel. Use \`lookup_equipment("name")\` to help with starting gear.

## Step 3: Set Expectations

- **Tone**: heroic fantasy, dark fantasy, comedy, horror — choose one
- **Content boundaries**: discuss themes everyone is comfortable with
- **Rules style**: rules-as-written vs. rule-of-cool
- **Session length**: typical 3-4 hours, 6-8 encounters per adventuring day

## Step 4: Begin Play

With characters imported, describe the opening scene and ask: "What do you do?" Use \`roll_skill_check\` for any uncertain actions. Player checks and GM combat management flow from here.`
      }
    }]
  };
});

server.registerPrompt("novel_setup", {
  title: "Novel Setup",
  description: "Guide for setting up a new novel: characters, adventure, session zero.",
}, async () => {
  const roster = Object.values(state._roster);
  const allAdvs2 = state.getActiveNovel() ? { ...state._systemAdventures, ...state.getActiveNovel()!.adventureModules } : { ...state._systemAdventures };
  const adventures = Object.keys(allAdvs2);
  return {
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `# Novel Setup — Getting Started

## Step 1: Create or Resume a Novel

- **New:** \`create_novel("your adventure name")\` to start fresh
- **Resume:** \`resume_novel("slug")\` to continue from disk

## Step 2: Add Characters

Import roster characters into your novel with \`import_character("roster_id")\`.

${roster.length > 0 ? `**Available roster characters:**\n${roster.map(c => `- ${c.name} (${c.race} ${c.className}) — roster://${c.id}`).join("\n")}` : "_No roster characters. Use create_character() to make one._"}

## Step 3: Load an Adventure

${adventures.length > 0 ? `- \`load_adventure("slug")\` with one of: ${adventures.join(", ")}` : "- _No adventure modules indexed. Use generate_adventure(\"premise\") to scaffold one._"}

## Step 4: Run Session Zero

Use the \`session_zero\` prompt to set campaign expectations, tone, and boundaries.

## Step 5: Begin

\`set_scene_state("description")\` to set the opening scene, then describe what happens and ask "What do you do?"`
      }
    }]
  };
});

// ─── Start ─────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
