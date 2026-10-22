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

harnessComplete();
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
process.exit(0);
