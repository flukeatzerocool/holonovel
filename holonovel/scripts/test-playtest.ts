#!/usr/bin/env node
// playtest harness self-tests — metric helpers used by playtest.ts.
// REQ citations: none — guards the informational harness's measurement layer
// against regression (envelope parsing, error classification, state
// fingerprint stability, Mothership Health/Wounds reading).

import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { prefix, errorClass, classifyResult, roomSet, stateFingerprint, pcVitals, pcAlive, anchorPresent } from "./lib/playtest-lib.js";

installHarnessGuard();

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void): void {
  try { fn(); passed++; console.log(`PASS ${name}`); }
  catch (e: any) { failed++; console.error(`FAIL ${name}: ${e?.message ?? e}`); }
}
function assert(c: any, m: string): void { if (!c) throw new Error(m); }
function eq(a: any, b: any, m: string): void { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m}: got ${JSON.stringify(a)} want ${JSON.stringify(b)}`); }

// --- envelope parsing -------------------------------------------------------
test("prefix: first-line envelope wins", () => {
  eq(prefix("[OK] The Landing Zone\nExits: north."), "[OK]", "ok token");
  eq(prefix("[NEED_INPUT] choose"), "[NEED_INPUT]", "need-input token");
});
test("prefix: compound envelope keys on the specific code", () => {
  eq(prefix("[ERROR] [STATE_CONFLICT] nope"), "[STATE_CONFLICT]", "state conflict");
  eq(prefix("[ERROR] [NOT_FOUND] No 'panic' found. Did you mean?"), "[NOT_FOUND]", "not found is a corrective");
  eq(prefix("[ERROR] [INVALID_INPUT] bad format"), "[INVALID_INPUT]", "invalid input");
});
test("prefix: leading blank line skipped", () => {
  eq(prefix("\n[WARNING] soft"), "[WARNING]", "warning after blank");
});
test("prefix: bare JSON lookup has no envelope", () => {
  eq(prefix('{ "name": "Teamster" }'), "[?]", "json fallback");
});

// --- error classification ---------------------------------------------------
test("errorClass: defects vs denials vs ok", () => {
  eq(errorClass("[ERROR]"), "defect", "error");
  eq(errorClass("[RULE_VIOLATION]"), "defect", "rule violation");
  eq(errorClass("[STATE_CONFLICT]"), "defect", "state conflict");
  eq(errorClass("[FORBIDDEN]"), "denial", "forbidden");
  eq(errorClass("[NEED_INPUT]"), "denial", "need input");
  eq(errorClass("[OK]"), "ok", "ok");
});

// --- MCP tool-error classification (D4) -------------------------------------
test("classifyResult: isError validation result is a denial, not ok", () => {
  const r = classifyResult("MCP error -32602: Input validation error: Invalid arguments for tool manage_story: Invalid option", true);
  eq(r.error_class, "denial", "validation is a denial");
  eq(r.prefix, "[INVALID_INPUT]", "validation prefix");
  assert(r.mcp_error, "flags mcp_error");
});
test("classifyResult: non-validation isError is a defect", () => {
  const r = classifyResult("MCP error -32603: boom", true);
  eq(r.error_class, "defect", "internal error is a defect");
});
test("classifyResult: normal result parses its envelope", () => {
  const r = classifyResult("[OK] done", false);
  eq(r.error_class, "ok", "ok");
  eq(r.mcp_error, false, "no mcp_error");
});

// --- state fingerprint ------------------------------------------------------
const baseNovel = () => ({
  world: { rooms: { "the Landing Zone": {}, "the Main Gate": {} } },
  entities: { c1: { current_room: "the Main Gate", inventory: [{ name: "Pulse Rifle" }] } },
  vows: [{ name: "get off world", state: "active", milestones: 1 }],
  story_beats: [{ beat: "setup" }],
  countdowns: { storm: { name: "storm", metrics: {}, ticks: 6 } },
});
test("stateFingerprint: stable across key reordering", () => {
  const a = baseNovel();
  const b = { ...baseNovel(), world: { rooms: { "the Main Gate": {}, "the Landing Zone": {} } } };
  eq(stateFingerprint(a), stateFingerprint(b), "reorder-stable");
});
test("stateFingerprint: changes when a room is added", () => {
  const a = baseNovel();
  const b = baseNovel();
  b.world.rooms["the Medbay"] = {};
  assert(stateFingerprint(a) !== stateFingerprint(b), "room add should change fingerprint");
});
test("stateFingerprint: tolerates object countdowns and numeric milestones", () => {
  assert(stateFingerprint(baseNovel()).length === 40, "sha1 hex length");
});
test("roomSet: sorted room names", () => {
  eq(roomSet(baseNovel()), ["the Landing Zone", "the Main Gate"], "sorted rooms");
});

// --- Mothership vitals ------------------------------------------------------
test("pcVitals: death condition marks dead", () => {
  assert(!pcAlive({ conditions: ["Dead"] }), "dead condition");
  const v = pcVitals({ conditions: ["wounded"] });
  assert(v.dead === false && v.conditions.includes("wounded"), "wounded is not dead");
});
test("pcVitals: three Wounds is death; Health/Wounds read from stats", () => {
  const v = pcVitals({ stats: { Health: 4, Wounds: 3 } });
  assert(v.hp === 4 && v.wounds === 3 && v.dead, "wounds>=3 dead");
  assert(pcAlive({ stats: { Health: 4, Wounds: 1 } }), "one wound alive");
});
test("pcAlive: sheets without Health/Wounds default alive", () => {
  assert(pcAlive({ stats: { Stress: 2 }, conditions: [] }), "no vitals alive");
});

// --- anchor provenance ------------------------------------------------------
test("anchorPresent: null anchor key does not count", () => {
  assert(!anchorPresent('{"name":"Stress","source_anchor":null}'), "null anchor");
  assert(anchorPresent('{"name":"Stress","source_anchor":"Mothership p.12"}'), "real anchor");
  assert(anchorPresent('{"a":{"source_file":"rules/combat.md"}}'), "nested source_file");
  assert(!anchorPresent('{"cross_references":[{"anchor":"other"}]}'), "cross-ref anchor not a citation");
  assert(!anchorPresent("plain prose with no citation"), "prose");
});

harnessComplete();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
