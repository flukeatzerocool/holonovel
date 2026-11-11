#!/usr/bin/env node
/**
 * test-world-provider.ts — world-model provider contract gate. [gate]
 *
 * Purpose: assert that the `world://kinds` payload and the provider schema
 * constants agree — every kind and documented property contract is rendered,
 * the declarable-kind list excludes non-per-thing kinds, and every base parser
 * command carries its documented effect. This is the gate-surface evidence for
 * REQ-202a (the resource holds kind hierarchy, property contracts, and parser
 * catalog); the freshness of the committed provider document is a separate
 * gate (`check-world-provider`).
 *
 * Exit codes: 0 = pass, 1 = one or more assertions failed, 2 = fatal error.
 *
 * Usage: npx tsx scripts/test-world-provider.ts [--help]
 * REQ-200, REQ-202a.
 */

import {
  WORLD_MODEL_KINDS,
  WORLD_MODEL_PROPERTIES,
  WORLD_MODEL_DECLARABLE_KINDS,
  BASE_PARSER_COMMANDS,
  READONLY_VERBS,
  nearestVerbs,
  worldKinds,
} from "../src/world/model.js";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: npx tsx scripts/test-world-provider.ts");
  console.log("  Asserts world://kinds covers every kind, property contract, and parser command.");
  process.exit(0);
}

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void): void {
  try { fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const kinds = worldKinds();

test("T245/T202: world://kinds renders the property-contract section (REQ-202a)", () => {
  assert(kinds.includes("## Property Contracts"), "world://kinds is missing '## Property Contracts'");
  for (const prop of WORLD_MODEL_PROPERTIES) {
    assert(kinds.includes(`**${prop.name}**`), `world://kinds is missing property '${prop.name}'`);
  }
});

test("T245/T202: world://kinds renders every kind in the hierarchy", () => {
  for (const kind of Object.keys(WORLD_MODEL_KINDS)) {
    assert(kinds.includes(`**${kind}**`), `world://kinds is missing kind '${kind}'`);
  }
});

test("T245/T202: declarable kinds are a subset of the hierarchy and exclude region", () => {
  for (const kind of WORLD_MODEL_DECLARABLE_KINDS) {
    assert(kind in WORLD_MODEL_KINDS, `declarable kind '${kind}' is not in WORLD_MODEL_KINDS`);
  }
  assert(!(WORLD_MODEL_DECLARABLE_KINDS as readonly string[]).includes("region"), "region must not be declarable per thing");
});

test("T245/T202: every base parser command declares its documented effect", () => {
  for (const cmd of BASE_PARSER_COMMANDS) {
    assert(typeof cmd.effect === "string" && cmd.effect.trim().length > 0, `command '${cmd.verb}' has no effect prose`);
  }
});

test("T245/REQ-318a + REQ-222b: world://kinds carries read_text and sourced parser commands", () => {
  assert(kinds.includes("**read_text**"), "world://kinds is missing the read_text property contract");
  assert(kinds.includes("[narrative]"), "world://kinds is missing the narrative parser category");
  for (const cmd of BASE_PARSER_COMMANDS) {
    assert(typeof (cmd as any).source === "string" && (cmd as any).source.trim().length > 0, `command '${cmd.verb}' has no extraction source`);
  }
});

test("T245/REQ-196c + REQ-309b: nearest verbs respect the caller's vocabulary", () => {
  const nearest = nearestVerbs("xyzzy", undefined, 3);
  assert(nearest.length === 3, `expected 3 nearest verbs, got ${nearest.length}`);
  const playerNearest = nearestVerbs("xyzzy", READONLY_VERBS, 3);
  assert(playerNearest.length === 3, `expected 3 player-eligible verbs, got ${playerNearest.length}`);
  for (const verb of playerNearest) {
    assert(READONLY_VERBS.has(verb), `player-badge nearest verb '${verb}' is outside the read-only set`);
  }
});

test("T245/REQ-309b: bound-Player kinds omits the parser catalog", () => {
  const player = worldKinds("player", true);
  assert(!player.includes("## Parser Commands"), "bound-Player kinds leaked '## Parser Commands'");
  assert(!player.includes("## Verb Coverage Tiers"), "bound-Player kinds leaked '## Verb Coverage Tiers'");
  assert(player.includes("## Property Contracts"), "bound-Player kinds dropped the property contracts");
  const free = worldKinds("player", false);
  assert(free.includes("## Parser Commands"), "ruleset-free Player kinds dropped the parser catalog");
  assert(free.includes("## Verb Coverage Tiers"), "ruleset-free Player kinds dropped the tiers");
  const gm = worldKinds();
  assert(gm.includes("## Parser Commands") && gm.includes("## Verb Coverage Tiers"), "GM kinds dropped the parser catalog");
});

harnessComplete();
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
process.exit(0);
