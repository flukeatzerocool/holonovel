#!/usr/bin/env node
// D&D 5e Module Test Suite — exercises dice, data, macros, enrichment
// REQ-050, REQ-057, REQ-059, REQ-111

import { seed, rollD20, rollDice, abilityModifier, proficiencyBonus, withIsolatedSeed } from "../../src/dice.js";
import {
  ABILITY_SCORES, SKILLS, CONDITIONS, DAMAGE_TYPES, RACES, CLASSES,
  WEAPONS, WEAPON_BY_NAME, ARMOR, ARMOR_BY_NAME,
  DIFFICULTY_CLASSES, TRAVEL_PACE, XP_THRESHOLDS, PROFICIENCY_BONUS,
  buildSearchIndex, searchRules, getSearchIndexSize,
  lookupWeapon, lookupArmor, lookupEquipment, listWeapons, listArmor,
  listRaces, listClasses,
} from "../../src/data.js";
import { expandMacros } from "../../src/macros.js";
import { DEFAULT_ENRICHMENT } from "../../src/enrichment.js";
// MacroContext is not exported — use inline type
interface MacroContext {
  entityName?: string;
  entityHp?: number;
  entityMaxHp?: number;
  entityStats?: Record<string, number>;
  sceneCurrent?: string;
  sceneLocation?: string;
  sceneTimeOfDay?: string;
  sceneAtmosphere?: string;
  sceneType?: string;
  countdowns?: Record<string, { remaining: number; total: number; scope?: string; direction?: string }>;
  novelSlug?: string;
  hatActive?: string;
  partySize?: number;
}
import * as fs from "fs";
import * as path from "path";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (e: any) {
    failed++;
    const msg = `  FAIL  ${name}: ${e.message}`;
    failures.push(msg);
    console.log(msg);
  }
}

function eq<T>(actual: T, expected: T, label?: string) {
  if (actual !== expected) {
    throw new Error(`${label ?? "value"} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function ok(cond: boolean, msg?: string) {
  if (!cond) throw new Error(msg ?? "assertion failed");
}

function contains(haystack: string, needle: string, label?: string) {
  if (!haystack.includes(needle)) {
    throw new Error(`${label ?? "string"} expected to contain "${needle}", got: ${haystack.substring(0, 200)}`);
  }
}

// ══════════════════════════════════════════════════════════════════════
// Dice tests (REQ-050)
// ══════════════════════════════════════════════════════════════════════

test("dice: seed determinism", () => {
  seed(42);
  const a = rollD20();
  seed(42);
  const b = rollD20();
  eq(a, b, "same seed → same result");
});

test("dice: different seeds differ", () => {
  seed(42);
  const a = rollD20();
  seed(12345);
  const b = rollD20();
  // Different seeds may rarely collide — check 3 more rolls
  const a2 = rollD20(), b2 = rollD20(), a3 = rollD20(), b3 = rollD20();
  ok(a !== b || a2 !== b2 || a3 !== b3, "at least one pair of rolls from different seeds differ");
});

test("dice: rollD20 range", () => {
  seed(12345);
  for (let i = 0; i < 100; i++) {
    const r = rollD20();
    ok(r >= 1 && r <= 20, `rollD20 in [1,20]: got ${r}`);
  }
});

test("dice: rollDice sum range", () => {
  seed(12345);
  for (let i = 0; i < 20; i++) {
    const r = rollDice(3, 6);
    ok(r >= 3 && r <= 18, `3d6 in [3,18]: got ${r}`);
    const r2 = rollDice(2, 10);
    ok(r2 >= 2 && r2 <= 20, `2d10 in [2,20]: got ${r2}`);
  }
});

test("dice: abilityModifier", () => {
  eq(abilityModifier(10), 0, "10 → +0");
  eq(abilityModifier(12), 1, "12 → +1");
  eq(abilityModifier(14), 2, "14 → +2");
  eq(abilityModifier(8), -1, "8 → -1");
  eq(abilityModifier(7), -2, "7 → -2");
  eq(abilityModifier(1), -5, "1 → -5");
  eq(abilityModifier(20), 5, "20 → +5");
  eq(abilityModifier(18), 4, "18 → +4");
});

test("dice: proficiencyBonus", () => {
  eq(proficiencyBonus(1), 2);
  eq(proficiencyBonus(4), 2);
  eq(proficiencyBonus(5), 3);
  eq(proficiencyBonus(9), 4);
  eq(proficiencyBonus(13), 5);
  eq(proficiencyBonus(17), 6);
});

test("dice: withIsolatedSeed", () => {
  seed(100);
  const outer1 = rollD20();
  const inner1 = withIsolatedSeed(200, () => rollD20());
  const outer2 = rollD20();
  seed(100);
  rollD20();
  const inner2 = withIsolatedSeed(200, () => rollD20());
  rollD20();
  eq(inner1, inner2, "isolated seeds produce same result");
});

// ══════════════════════════════════════════════════════════════════════
// Data tests (REQ-057, REQ-059, REQ-111)
// ══════════════════════════════════════════════════════════════════════

test("data: ABILITY_SCORES length", () => {
  eq(ABILITY_SCORES.length, 6);
});

test("data: SKILLS length", () => {
  ok(SKILLS.length >= 18, `Skills count >= 18: ${SKILLS.length}`);
});

test("data: CONDITIONS length", () => {
  ok(CONDITIONS.length >= 14, `Conditions count >= 14: ${CONDITIONS.length}`);
});

test("data: RACES count", () => {
  const keys = Object.keys(RACES);
  ok(keys.length >= 9, `Races count >= 9: ${keys.length}`);
});

test("data: CLASSES count", () => {
  const keys = Object.keys(CLASSES);
  ok(keys.length >= 12, `Classes count >= 12: ${keys.length}`);
});

test("data: WEAPONS loaded", () => {
  ok(WEAPONS.length >= 30, `Weapons count >= 30: ${WEAPONS.length}`);
});

test("data: ARMOR loaded", () => {
  ok(ARMOR.length >= 10, `Armor count >= 10: ${ARMOR.length}`);
});

test("data: DIFFICULTY_CLASSES defined", () => {
  ok(Object.keys(DIFFICULTY_CLASSES).length >= 5, `DC tiers: ${Object.keys(DIFFICULTY_CLASSES).length}`);
});

test("data: TRAVEL_PACE defined", () => {
  ok(TRAVEL_PACE.Fast.per_minute > 0, "fast pace > 0");
  ok(TRAVEL_PACE.Normal.per_minute > 0, "normal pace > 0");
  ok(TRAVEL_PACE.Slow.per_minute > 0, "slow pace > 0");
});

test("data: XP_THRESHOLDS count", () => {
  ok(Object.keys(XP_THRESHOLDS).length >= 4, `XP thresholds >= 4: ${Object.keys(XP_THRESHOLDS).length}`);
});

test("data: PROFICIENCY_BONUS count", () => {
  ok(Object.keys(PROFICIENCY_BONUS).length >= 4, `Prof bonus rows: ${Object.keys(PROFICIENCY_BONUS).length}`);
});

test("data: search index built", () => {
  const rulesetDir = path.join(import.meta.dirname!, "..", "..", "ruleset");
  if (fs.existsSync(rulesetDir)) {
    buildSearchIndex(rulesetDir);
    ok(getSearchIndexSize() >= 100, `Search index >= 100 entries: ${getSearchIndexSize()}`);
    const results = searchRules("combat");
    ok(results.length > 0, "search 'combat' returns results");
  }
});

test("data: lookupWeapon", () => {
  const w = lookupWeapon("longsword");
  ok(w !== undefined, "longsword found via lowercase alias");
});

test("data: lookupArmor", () => {
  const a = lookupArmor("chain mail");
  ok(a !== undefined, "chain mail found");
});

test("data: listRaces", () => {
  const r = listRaces();
  ok(r.length >= 9, `listRaces >= 9: ${r.length}`);
});

test("data: listClasses", () => {
  const c = listClasses();
  ok(c.length >= 12, `listClasses >= 12: ${c.length}`);
});

test("data: listWeapons", () => {
  const w = listWeapons();
  ok(w.length >= 30, `listWeapons >= 30: ${w.length}`);
});

test("data: listArmor", () => {
  const a = listArmor();
  ok(a.length >= 10, `listArmor >= 10: ${a.length}`);
});

test("data: DAMAGE_TYPES", () => {
  ok(DAMAGE_TYPES.length >= 10, `Damage types: ${DAMAGE_TYPES.length}`);
});

// ══════════════════════════════════════════════════════════════════════
// Macros tests (REQ-085)
// ══════════════════════════════════════════════════════════════════════

test("macros: entity name", () => {
  const ctx: MacroContext = { entityName: "Gandalf", entityStats: { strength: 12 } };
  const result = expandMacros("{{entity.name}} has strength {{entity.strength}}", ctx);
  ok(result.includes("Gandalf"), `entity.name: ${result}`);
  ok(result.includes("12"), `entity.strength: ${result}`);
});

test("macros: entity hp", () => {
  const ctx: MacroContext = { entityName: "Hero", entityHp: 30, entityMaxHp: 45 };
  const result = expandMacros("HP: {{entity.hp}}/{{entity.max_hp}}", ctx);
  eq(result, "HP: 30/45");
});

test("macros: scene macros", () => {
  const ctx: MacroContext = {
    sceneCurrent: "A dark cave",
    sceneLocation: "Underdark",
    sceneType: "combat",
    sceneTimeOfDay: "night",
    sceneAtmosphere: "gloomy",
  };
  const result = expandMacros("{{scene.current}} — {{scene.location}} ({{scene.type}}, {{scene.time_of_day}})", ctx);
  eq(result, "A dark cave — Underdark (combat, night)");
});

test("macros: novel and hat macros", () => {
  const ctx: MacroContext = { novelSlug: "test-novel", hatActive: "game_master" };
  const result = expandMacros("Novel: {{novel.slug}}, Hat: {{hat.active}}", ctx);
  eq(result, "Novel: test-novel, Hat: game_master");
});

test("macros: countdown macros", () => {
  const ctx: MacroContext = {
    countdowns: { "doom": { remaining: 3, total: 5 } },
  };
  const result = expandMacros("{{countdown.doom.remaining}}/{{countdown.doom.total}}", ctx);
  eq(result, "3/5");
});

test("macros: party size", () => {
  const ctx: MacroContext = { partySize: 4 };
  const result = expandMacros("{{party.size}}", ctx);
  eq(result, "4");
});

test("macros: unknown template preserved", () => {
  const ctx: MacroContext = {};
  const result = expandMacros("{{unknown.template}}", ctx);
  eq(result, "{{unknown.template}}");
});

test("macros: mixed known and unknown", () => {
  const ctx: MacroContext = { entityName: "Bilbo" };
  const result = expandMacros("{{entity.name}} does {{unknown.action}}", ctx);
  eq(result, "Bilbo does {{unknown.action}}");
});

// ══════════════════════════════════════════════════════════════════════
// Enrichment tests (REQ-080, REQ-145)
// ══════════════════════════════════════════════════════════════════════

test("enrichment: DEFAULT_ENRICHMENT exists", () => {
  ok(DEFAULT_ENRICHMENT !== undefined, "defined");
  ok(typeof DEFAULT_ENRICHMENT.collected_at === "string", "collected_at");
  ok(Array.isArray(DEFAULT_ENRICHMENT.voice_examples), "voice_examples is array");
  ok(Array.isArray(DEFAULT_ENRICHMENT.lore_templates), "lore_templates is array");
});

test("enrichment: voice_examples have content", () => {
  ok(DEFAULT_ENRICHMENT.voice_examples.length > 0, `voice_examples: ${DEFAULT_ENRICHMENT.voice_examples.length}`);
  for (const v of DEFAULT_ENRICHMENT.voice_examples) {
    ok(typeof v.content === "string", "voice example content is string");
  }
});

test("enrichment: briefing_order", () => {
  ok(Array.isArray(DEFAULT_ENRICHMENT.briefing_order.sections), "briefing_order.sections is array");
  ok(DEFAULT_ENRICHMENT.briefing_order.sections.length > 0, "briefing_order has sections");
});

test("enrichment: lore_templates have content", () => {
  ok(DEFAULT_ENRICHMENT.lore_templates.length > 0, `lore_templates: ${DEFAULT_ENRICHMENT.lore_templates.length}`);
  for (const lt of DEFAULT_ENRICHMENT.lore_templates) {
    ok(typeof lt.content === "string", `lore template content is string: ${lt.content.substring(0, 50)}`);
  }
});

// ══════════════════════════════════════════════════════════════════════
// Results
// ══════════════════════════════════════════════════════════════════════

console.log();
console.log(`\n${passed}/${passed + failed} tests passed`);

if (failed > 0) {
  console.error(`\n${failed} test(s) failed:`);
  for (const f of failures) console.error(`${f}`);
  process.exit(1);
}

console.log("\nAll tests passed.");
process.exit(0);
