#!/usr/bin/env node
// Character-creation engine unit tests (REQ-399, REQ-104/151/181, T468). [gate]
// Pure-function tests: formula evaluator, derived-stat computation, stat
// generation, and species adjustment — no server process required.

import { strict as assert } from "node:assert";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();
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

test("formula context exposes class starting HP and hit die (REQ-399b)", () => {
  const rules: CharacterRules = {
    ...RULES,
    derived_stats: [
      { key: "hit_points", label: "Hit Points", formula: "class_bonus.starting_hp + (level - 1) * (floor(class_bonus.hit_die / 2) + 1 + ability_mod.might)" },
      { key: "force_points", label: "Force Points", formula: "5 + floor(level / 2)" },
    ],
  };
  const r = computeDerived(build({ classLevels: [{ className: "warrior", levels: 3 }] }), rules);
  // Warrior startingHp 10, hitDie 10, Might 14 -> +2: 10 + 2 * (5 + 1 + 2) = 26.
  assert.equal(r.values.hit_points, 26);
  assert.equal(r.values.force_points, 5 + Math.floor(3 / 2));
});

test("formula context exposes the first class's data, not the last (REQ-399b)", () => {
  const rules: CharacterRules = {
    ...RULES,
    derived_stats: [
      { key: "hp_first", label: "HP (first)", formula: "class_bonus.starting_hp" },
      { key: "die_first", label: "Die (first)", formula: "class_bonus.hit_die" },
    ],
  };
  // Warrior (startingHp 10) precedes Scholar (startingHp 6): first wins.
  const wFirst = computeDerived(build({ classLevels: [{ className: "warrior", levels: 2 }, { className: "scholar", levels: 2 }] }), rules);
  assert.equal(wFirst.values.hp_first, 10, "warrior's starting HP wins when first");
  assert.equal(wFirst.values.die_first, 10, "warrior's hit die wins when first");
  // Reversed order: Scholar is now the first class.
  const sFirst = computeDerived(build({ classLevels: [{ className: "scholar", levels: 2 }, { className: "warrior", levels: 2 }] }), rules);
  assert.equal(sFirst.values.hp_first, 6, "scholar's starting HP wins when first");
  assert.equal(sFirst.values.die_first, 6, "scholar's hit die wins when first");
});

test("a failing derived-stat formula names the statistic and formula (REQ-399b)", () => {
  const rules: CharacterRules = {
    ...RULES,
    derived_stats: [
      { key: "hit_points", label: "Hit Points", formula: "5 + ability_mod.nope" },
    ],
  };
  assert.throws(
    () => computeDerived(build(), rules),
    (e: Error) => e.message.includes("hit_points")
      && e.message.includes("Hit Points")
      && e.message.includes("5 + ability_mod.nope")
      && e.message.includes("undefined input"),
    "the thrown message names the statistic, its label, its formula, and the original cause",
  );
});

console.log(`\n${passed} tests passed${process.exitCode ? " (with failures)" : ""}`);

// ── T468 server tier (REQ-152a, REQ-152b, REQ-399b, REQ-190) ──────────
//
// The pure tests above prove the engine; this tier proves the host wiring:
// equipment provenance and omission, the named creation error, and the
// undrained workflow after a failed build. Spawned through the shared MCP
// client so the assertions read real persisted Novel state.

let spawnPassed = 0;
let spawnFailed = 0;
async function atest(name: string, fn: () => Promise<void>): Promise<void> {
  try { await fn(); spawnPassed++; console.log(`  PASS ${name}`); }
  catch (e: any) { spawnFailed++; console.error(`  FAIL ${name}: ${e.message}`); process.exitCode = 1; }
}

function assertContains(hay: string, needle: string): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected to contain "${needle}", got: ${hay.slice(0, 300)}`);
}

async function main(): Promise<void> {
  const { bootServer } = await import("./lib/mcp-client.js");
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { computeContentHash } = await import("../src/rulesets.js");

  const root = join(import.meta.dirname!, "..");
  const fixtureDir = join(root, "testdata", "rulesets", "fixture");
  const readJson = (name: string) => JSON.parse(readFileSync(join(fixtureDir, name), "utf-8"));
  const base = {
    slug: readJson("manifest.json").slug as string,
    manifest: readJson("manifest.json"),
    index: readJson("index.json"),
    model: readJson("model.json"),
    tools: readJson("tools.json"),
    resources: readJson("resources.json"),
    prompts: readJson("prompts.json"),
  };
  const variant = (slug: string, mutate: (model: any) => void) => {
    const model = JSON.parse(JSON.stringify(base.model));
    mutate(model);
    const manifest = { ...base.manifest, slug, content_hash: computeContentHash(base.index, model, base.tools, base.resources, base.prompts) };
    return { slug, manifest, index: base.index, model, tools: base.tools, resources: base.resources, prompts: base.prompts };
  };
  const none = variant("fixture-none", (m) => { delete m.character_creation.starting_equipment; });
  const bad = variant("fixture-bad", (m) => { m.character_creation.derived_stats[0].formula = "5 + ability_mod.nope"; });

  const client = await bootServer({ serverDir: root });
  const entityBySlug = (slug: string, name: string) => {
    const payload = JSON.parse(readFileSync(join(client.dataDir, "novels", `${slug}.json`), "utf-8"));
    const entities = Object.values(payload.entities ?? {}) as any[];
    const entity = entities.find((e) => e.name === name);
    if (!entity) throw new Error(`entity '${name}' not found in ${slug}`);
    return entity;
  };
  const setup = async (pkg: { slug: string; manifest: any; index: any; model: any; tools: any; resources: any; prompts: any }, novelName: string): Promise<string> => {
    await client.call("set_badge", { badge: "game_master" });
    const installed = await client.call("manage_ruleset", { action: "install", slug: pkg.slug, manifest: pkg.manifest, index: pkg.index, model: pkg.model, tools: pkg.tools, resources: pkg.resources, prompts: pkg.prompts });
    assertContains(installed.text, "[OK]");
    await client.call("manage_novel", { action: "create", name: novelName });
    const info = JSON.parse((await client.call("manage_novel", { action: "info" })).text);
    const slug = info.slug;
    const bound = await client.call("manage_ruleset", { action: "bind", slug: pkg.slug });
    assertContains(bound.text, "[OK]");
    return slug;
  };

  try {
    console.log("\n=== T468 server tier (REQ-152a/b, REQ-399b, REQ-190) ===");

    const slugMain = await setup(base, "T468 quick");
    await atest("T468/REQ-399b: quick mode returns the ruleset's labelled derived statistics", async () => {
      const res = await client.call("manage_character", { action: "create", name: "Quick", species: "Human", classes: "Warrior 1", stat_method: "planned" });
      assertContains(res.text, "[OK]");
      const entity = entityBySlug(slugMain, "Quick");
      // Might 10, Grace 10: HP 5 + 1*5 + 0 = 10; Reflex 10 + 1 + 0 + 1 = 12; Power max(0,0)+1 = 1.
      if (entity.stats["Hit Points"] !== 10) throw new Error(`Hit Points = ${entity.stats["Hit Points"]}`);
      if (entity.stats.Reflex !== 12) throw new Error(`Reflex = ${entity.stats.Reflex}`);
      if (entity.stats.Power !== 1) throw new Error(`Power = ${entity.stats.Power}`);
    });

    await atest("T468/REQ-152a: ruleset-declared equipment carries its declared source", async () => {
      const entity = entityBySlug(slugMain, "Quick");
      const item = entity.stats.equipment?.[0];
      if (!item) throw new Error("no equipment assigned");
      if (item.name !== "Sword" || item.quantity !== 1) throw new Error(`equipment shape: ${JSON.stringify(item)}`);
      if (item.source !== "Fixture") throw new Error(`source = ${JSON.stringify(item.source)}`);
    });

    await atest("T468/REQ-152a: player-supplied equipment carries the bound ruleset as its source", async () => {
      const res = await client.call("manage_character", { action: "create", name: "Supplied", species: "Human", classes: "Warrior 1", equipment: "Torch Rope" });
      assertContains(res.text, "[OK]");
      const entity = entityBySlug(slugMain, "Supplied");
      const names = (entity.stats.equipment ?? []).map((e: any) => `${e.name}:${e.source}`);
      if (names.length !== 2) throw new Error(`equipment: ${JSON.stringify(entity.stats.equipment)}`);
      for (const entry of entity.stats.equipment) {
        if (entry.source !== "fixture") throw new Error(`source = ${JSON.stringify(entry.source)} for ${entry.name}`);
      }
    });

    const slugNone = await setup(none, "T468 no equipment");
    await atest("T468/REQ-152b: a ruleset with no starting equipment omits the equipment key", async () => {
      const res = await client.call("manage_character", { action: "create", name: "Bare", species: "Human", classes: "Warrior 1" });
      assertContains(res.text, "[OK]");
      const entity = entityBySlug(slugNone, "Bare");
      if ("equipment" in entity.stats) throw new Error(`equipment present: ${JSON.stringify(entity.stats.equipment)}`);
    });

    const slugBad = await setup(bad, "T468 bad formula");
    await atest("T468/REQ-399b: a failing formula returns a named creation error in quick mode", async () => {
      const res = await client.call("manage_character", { action: "create", name: "Broken", species: "Human", classes: "Warrior 1" });
      assertContains(res.text, "[ERROR] [INVALID_INPUT]");
      assertContains(res.text, "hit_points");
      assertContains(res.text, "5 + ability_mod.nope");
    });

    await atest("T468/REQ-190: a failed step-by-step build leaves the workflow undrained", async () => {
      const start = await client.call("manage_character", { action: "create" });
      assertContains(start.text, "[NEED_INPUT]");
      for (const option of ["Broken", "Human", "Warrior 1", "10 10 10"]) {
        const step = await client.call("respond_decision", { decision: "character_creation", option });
        assertContains(step.text, "[NEED_INPUT]");
      }
      const last = await client.call("respond_decision", { decision: "character_creation", option: "Sword" });
      assertContains(last.text, "[ERROR] [INVALID_INPUT]");
      assertContains(last.text, "hit_points");
      const undo = await client.call("manage_history", { action: "undo" });
      assertContains(undo.text, "[ERROR] [STATE_CONFLICT]");
      const cancelled = await client.call("respond_decision", { decision: "character_creation", option: "cancel" });
      assertContains(cancelled.text, "[OK]");
    });
  } finally {
    await client.close();
  }

  console.log(`\n${spawnPassed} server-tier tests passed${spawnFailed ? `, ${spawnFailed} failed` : ""}`);
  if (spawnFailed) process.exitCode = 1;
}

main().then(() => harnessComplete()).catch((e) => {
  console.error(`server tier failed: ${e?.stack ?? e}`);
  process.exitCode = 1;
  harnessComplete();
});

