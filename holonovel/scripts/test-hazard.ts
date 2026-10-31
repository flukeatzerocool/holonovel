#!/usr/bin/env node
/**
 * test-hazard.ts — hazard-roll helper harness. [gate]
 *
 * Purpose: verify the pure hazard helpers behind REQ-622b. Regression guard:
 * the audit log persists `args` as a JSON string, so the prior-check count must
 * parse it; a direct property read silently returned zero and froze every
 * room's draw. Also covers malformed-entry tolerance, seed/room stability, and
 * the declared face count.
 *
 * Exit codes: 0 = all checks passed, 1 = a check failed, 2 = fatal.
 * Usage: tsx scripts/test-hazard.ts [--help]
 * REQ-622b.
 */
import { strict as assert } from "node:assert";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { countPriorHazardChecks, hazardRoll, parseAuditArgs, parseRoomHazard } from "../src/core/hazard.js";
import type { AuditLike } from "../src/core/hazard.js";
installHarnessGuard();

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void): void {
  try { fn(); passed++; console.log(`  PASS ${name}`); }
  catch (error: any) { failed++; console.error(`  FAIL ${name}: ${error?.message ?? error}`); }
}

function auditEntry(tool: string, args: unknown): AuditLike {
  return { tool, args };
}
function priorChecks(count: number, room = "Trap Hall"): AuditLike[] {
  return Array.from({ length: count }, () => auditEntry("hazard_check", JSON.stringify({ room, roll: 1 })));
}

test("REQ-622b: parseAuditArgs reads the persisted JSON-string form", () => {
  assert.deepEqual(parseAuditArgs(JSON.stringify({ room: "Trap Hall" })), { room: "Trap Hall" });
});
test("REQ-622b: parseAuditArgs accepts an already-parsed object", () => {
  assert.deepEqual(parseAuditArgs({ room: "Trap Hall" }), { room: "Trap Hall" });
});
test("REQ-622b: parseAuditArgs tolerates malformed input", () => {
  assert.deepEqual(parseAuditArgs("{not json"), {});
  assert.deepEqual(parseAuditArgs(undefined), {});
  assert.deepEqual(parseAuditArgs(42), {});
});
test("REQ-622b: prior checks are counted from JSON-string args (regression)", () => {
  const log = [...priorChecks(3), auditEntry("hazard_check", JSON.stringify({ room: "Beast Warren" })), auditEntry("match_spend", JSON.stringify({ remaining: 1 }))];
  assert.equal(countPriorHazardChecks(log, "Trap Hall"), 3);
  assert.equal(countPriorHazardChecks([], "Trap Hall"), 0);
});
test("REQ-622b: malformed hazard entries are not attributed to a room", () => {
  assert.equal(countPriorHazardChecks([auditEntry("hazard_check", "{bad"), auditEntry("hazard_check", JSON.stringify({ room: 7 }))], "Trap Hall"), 0);
});
test("REQ-622b: room matching is case- and whitespace-insensitive", () => {
  assert.equal(countPriorHazardChecks(priorChecks(2, "Trap Hall"), "  trap hall "), 2);
});
test("REQ-622b: the draw is stable for the same seed, room, and history", () => {
  assert.equal(hazardRoll(priorChecks(2), "seed-1", "Trap Hall"), hazardRoll(priorChecks(2), "seed-1", "Trap Hall"));
});
test("REQ-622b: prior checks change the draw (regression)", () => {
  const draws = new Set([0, 1, 2, 3, 4].map((n) => hazardRoll(priorChecks(n), "seed-1", "Trap Hall")));
  assert.ok(draws.size > 1, `expected the prior count to affect the draw, got ${[...draws].join(",")}`);
});
test("REQ-622b: the draw stays within the declared face count", () => {
  for (let n = 0; n < 20; n += 1) {
    const roll = hazardRoll(priorChecks(n), "seed-1", "Trap Hall", 6);
    assert.ok(roll >= 1 && roll <= 6, `roll ${roll} outside 1..6`);
  }
});

test("REQ-622: a well-formed structured annotation parses", () => {
  const { hazard, warnings } = parseRoomHazard({
    encounter: { spill: 2, resource: "The Candle" },
    trap: { snuff: "Dread", faces: 6, resource: "The Candle" },
  }, "Trap Hall");
  assert.deepEqual(hazard.encounter, { spill: 2, resource: "The Candle" });
  assert.deepEqual(hazard.trap, { snuff: "Dread", faces: 6, resource: "The Candle" });
  assert.equal(warnings.length, 0);
});

test("REQ-622: malformed annotations warn and are dropped", () => {
  const { hazard, warnings } = parseRoomHazard({ trap: { snuff: 5 }, encounter: { resource: "The Candle" } }, "Trap Hall");
  assert.equal(hazard.trap, undefined);
  assert.equal(hazard.encounter, undefined);
  assert.equal(warnings.length, 2);
  assert.ok(warnings.every((w) => w.includes("Trap Hall")));
});

test("REQ-622: legacy string annotations coerce with a warning", () => {
  const { hazard, warnings } = parseRoomHazard(
    { trap: "snuff=Dread;avoid=2", encounter: "spill=1" },
    "Trap Hall",
    { legacyResource: "The Candle" },
  );
  assert.deepEqual(hazard.trap, { snuff: "Dread", faces: 8, resource: "The Candle", avoid: 2 });
  assert.deepEqual(hazard.encounter, { spill: 1, resource: "The Candle" });
  assert.equal(warnings.length, 2);
  assert.ok(warnings.every((w) => w.includes("legacy")));
});

test("REQ-622: an unknown resource name is not a parse error", () => {
  const { hazard, warnings } = parseRoomHazard({ encounter: { spill: 1, resource: "Missing" } }, "Trap Hall");
  assert.deepEqual(hazard.encounter, { spill: 1, resource: "Missing" });
  assert.equal(warnings.length, 0);
});

if (failed === 0) harnessComplete();
console.log(`\ntest-hazard: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
