#!/usr/bin/env node
// Character-creation engine unit tests (REQ-399, REQ-104/151/181, T468).
// Pure-function tests: formula evaluator, derived-stat computation, stat
// generation, and species adjustment — no server process required.

import { strict as assert } from "node:assert";
import {
  evaluateFormula, computeDerived, generateAbilityScores, applySpeciesAdjustments,
  getSpecies, getClassData, abilityNames, abilityModifier,
  CharacterRules, CharacterBuildInput,
} from "../src/core/character-creation.js";

let passed = 0;
function test(name: string, fn: () => void): void {
  try { fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { console.error(`  FAIL ${name}: ${e.message}`); process.exitCode = 1; }
}

const RULES: CharacterRules = {
  steps: ["name", "species", "classes", "ability_scores", "equipment"],
  ability_names: ["Might", "Grace", "Wits"],
  ability_modifier_formula: "floor((score - 10) / 2)",
  stat_methods: {
    standard: { array: [10, 10, 10] },
    planned: { point_buy: {} },
  },
  default_ability_scores: [10, 10, 10],
  species: {
    human: { name: "Human", size: "Medium", speed: 6, abilityAdjustments: {}, traits: ["Versatile"] },
    elf: { name: "Elf", size: "Medium", speed: 7, abilityAdjustments: { grace: 2, might: -1 }, traits: ["Keen Senses"] },
  },
  classes: {
    warrior: { name: "Warrior", hitDie: 10, startingHp: 10, babType: "good", bab: 1, defenseBonuses: { reflex: 1, fortitude: 2 }, classSkills: ["Athletics"] },
    scholar: { name: "Scholar", hitDie: 6, startingHp: 6, babType: "poor", bab: 0, defenseBonuses: { will: 2 }, classSkills: ["Knowledge"] },
  },
  starting_equipment: {
    warrior: [{ name: "Sword", quantity: 1, source: "Fixture" }],
    scholar: [{ name: "Tome", quantity: 1, source: "Fixture" }],
  },
  derived_stats: [
    { key: "hit_points", label: "Hit Points", formula: "5 + level * 5 + ability_mod.might" },
    { key: "reflex", label: "Reflex", formula: "10 + level + ability_mod.grace + class_bonus.reflex" },
    { key: "power", label: "Power", formula: "max(ability_mod.might, ability_mod.grace) + bab" },
  ],
};

function build(over: Partial<CharacterBuildInput> = {}): CharacterBuildInput {
  return {
    name: "Test",
    species: "human",
    classLevels: [{ className: "warrior", levels: 1 }],
    abilityScores: { Might: 14, Grace: 12, Wits: 10 },
    ...over,
  };
}

console.log("Character-creation engine tests");

test("abilityNames honors ruleset-declared names", () => {
  assert.deepEqual(abilityNames(RULES), ["Might", "Grace", "Wits"]);
  assert.equal(abilityNames(undefined).length, 6); // neutral fallback
});

test("abilityModifier honors ruleset formula", () => {
  assert.equal(abilityModifier(14, RULES), 2);
  assert.equal(abilityModifier(8, RULES), -1);
  assert.equal(abilityModifier(10), 0); // neutral fallback
});

test("evaluateFormula arithmetic and parentheses", () => {
  assert.equal(evaluateFormula("2 + 3 * 4"), 14);
  assert.equal(evaluateFormula("(2 + 3) * 4"), 20);
  assert.equal(evaluateFormula("10 / 2 + 1"), 6);
});

test("evaluateFormula functions and dotted variables", () => {
  assert.equal(evaluateFormula("floor(2.9)"), 2);
  assert.equal(evaluateFormula("ceil(2.1)"), 3);
  assert.equal(evaluateFormula("max(1, 5, 3)"), 5);
  assert.equal(evaluateFormula("min(1, 5, 3)"), 1);
  assert.equal(evaluateFormula("level + ability_mod.grace", { level: 3, ability_mod: { grace: 1 } }), 4);
  assert.equal(evaluateFormula("class_bonus.reflex + species.speed", { class_bonus: { reflex: 2 }, species: { speed: 7 } }), 9);
});

test("evaluateFormula raises on undefined input", () => {
  assert.throws(() => evaluateFormula("ability_mod.nope", { ability_mod: {} }), /undefined input/);
  assert.throws(() => evaluateFormula("unknown_var"), /undefined input/);
  assert.throws(() => evaluateFormula("2 +"), /Unexpected/);
});

test("computeDerived computes ruleset formula stats", () => {
  const b = build();
  const r = computeDerived(b, RULES);
  // Might 14 -> +2, Grace 12 -> +1. Warrior 1: bab good = +1, reflex +1, fortitude +2.
  assert.equal(r.values.level, 1);
  assert.equal(r.values.hit_points, 5 + 1 * 5 + 2);
  assert.equal(r.values.reflex, 10 + 1 + 1 + 1);
  assert.equal(r.values.power, Math.max(2, 1) + 1);
  assert.equal(r.labels.hit_points, "Hit Points");
  assert.deepEqual(r.order, ["hit_points", "reflex", "power"]);
});

test("applySpeciesAdjustments applies declared adjustments", () => {
  const adj = applySpeciesAdjustments({ Might: 14, Grace: 12, Wits: 10 }, "elf", RULES);
  assert.equal(adj.Might, 13); // -1
  assert.equal(adj.Grace, 14); // +2
  assert.equal(adj.Wits, 10);
});

test("getSpecies/getClassData resolve against rulesets", () => {
  assert.equal(getSpecies(RULES, "Human")?.name, "Human");
  assert.equal(getClassData(RULES, "Scholar")?.babType, "poor");
  assert.equal(getClassData(RULES, "nope"), undefined);
});

test("generateAbilityScores standard array from rulesets", () => {
  const scores = generateAbilityScores("standard", RULES, "0");
  assert.deepEqual(scores, [10, 10, 10]);
});

test("profile-only route has no rules (getCharacterRules null path)", () => {
  // No rules → the create_character handler must not compute mechanical stats;
  // this is exercised via the server handler, but the pure engine never sees
  // a null rules object (callers guard first). Assert the engine requires rules.
  assert.throws(() => computeDerived(build(), null as unknown as CharacterRules), /Cannot read|undefined/);
});

console.log(`\n${passed} tests passed${process.exitCode ? " (with failures)" : ""}`);
