#!/usr/bin/env node
// playtest harness self-tests — metric helpers used by playtest.ts.
// REQ citations: none — guards the informational harness's measurement layer
// against regression (envelope parsing, error classification, state
// fingerprint stability, Mothership Health/Wounds reading).

import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { prefix, errorClass, classifyResult, roomSet, stateFingerprint, pcVitals, pcAlive, anchorPresent, runPhase, reachableRooms, isReachable, authoredAdventureHash, partyRooms, entityCounts, stateDelta, validateFinding, REGISTER_DISPOSITIONS } from "./lib/playtest-lib.js";

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

// --- phase boundary ---------------------------------------------------------
test("runPhase: from-scratch without a vow is authoring; target set is playtest", () => {
  eq(runPhase({ from_scratch: true, central_vow: null }), "authoring", "no target");
  eq(runPhase({ from_scratch: true, central_vow: "Get out" }), "playtest", "target set");
  eq(runPhase({ from_scratch: false, central_vow: null }), "playtest", "supplied module is playtest");
});

// --- reachability & structure ----------------------------------------------
const worldNovel = () => ({
  world: {
    rooms: {
      "landing zone": { name: "Landing Zone", exits: { north: "Main Gate" } },
      "main gate": { name: "Main Gate", exits: { south: "Landing Zone", up: "Bridge" } },
      bridge: { name: "Bridge", exits: { down: "Main Gate" } },
      vault: { name: "Vault", exits: {} },
    },
    things: { keycard: { name: "Keycard" } },
  },
  entities: { c1: { name: "A", current_room: "Landing Zone", inventory: [] }, c2: { name: "B", current_room: "Bridge", inventory: [{ name: "Rifle" }] } },
  npcs: { n1: { name: "Guard" } },
  story_beats: [{ beat: "setup" }],
});
test("reachableRooms/isReachable: BFS over exits, article-insensitive", () => {
  eq(reachableRooms(worldNovel(), "the Landing Zone"), ["Bridge", "Landing Zone", "Main Gate"], "reachable set");
  assert(isReachable(worldNovel(), "Landing Zone", "bridge"), "bridge reachable");
  assert(!isReachable(worldNovel(), "Landing Zone", "Vault"), "vault unreachable");
});
test("entityCounts: pcs, npcs, rooms, things, exits", () => {
  eq(entityCounts(worldNovel()), { pcs: 2, npcs: 1, rooms: 4, things: 1, exits: 4 }, "counts");
});
test("partyRooms: per-PC room map", () => {
  eq(partyRooms(worldNovel()), { c1: "Landing Zone", c2: "Bridge" }, "party rooms");
});
test("stateDelta: detects room and inventory changes", () => {
  const before = worldNovel(); const after = worldNovel();
  after.world.rooms.vault.exits = { east: "Bridge" };
  after.entities.c1.current_room = "Main Gate";
  after.entities.c1.inventory = [{ name: "Blaster" }];
  const d = stateDelta(before, after);
  assert(d.rooms === 0 && d.exits === 1 && d.inventory_changed, `delta ${JSON.stringify(d)}`);
});

// --- authored adventure hash ------------------------------------------------
test("authoredAdventureHash: stable and content-sensitive", () => {
  const a = { generated_adventure: { title: "X", locations: [] }, adventure_index: { premise: "p" } };
  const b = { generated_adventure: { title: "X", locations: [] }, adventure_index: { premise: "p" } };
  const c = { generated_adventure: { title: "Y", locations: [] } };
  eq(authoredAdventureHash(a), authoredAdventureHash(b), "stable");
  assert(authoredAdventureHash(a) !== authoredAdventureHash(c), "content-sensitive");
});

// --- SWSE vitals ------------------------------------------------------------
test("pcVitals: reads SWSE label keys and stat_keys", () => {
  const v = pcVitals({ stats: { "Reflex Defense": 16, "Fortitude Defense": 15, "Will Defense": 12, level: 5 } });
  assert(v.defenses.reflex === 16 && v.defenses.fortitude === 15 && v.defenses.will === 12, "defenses");
  assert(v.hp === null && v.damage_threshold === null && v.force_points === null, "absent fields null");
  assert(v.stat_keys.includes("Reflex Defense") && v.dead === false, "keys + alive");
});
test("pcVitals: raw SWSE keys also resolve", () => {
  const v = pcVitals({ stats: { hit_points: 30, damage_threshold: 18, force_points: 5, reflex_defense: 15 } });
  assert(v.hp === 30 && v.damage_threshold === 18 && v.force_points === 5 && v.defenses.reflex === 15, "raw keys");
});

// --- findings schema --------------------------------------------------------
test("validateFinding: accepts a predicate-bearing finding", () => {
  const r = validateFinding({
    class: "cross_ruleset_condition", predicate: "holonovel/src/index.ts:4107",
    evidence: { run: "gm_fair-completionist", turns: [12, 40] }, severity: "P0", target: "REQ-067d", repro: ["condition apply"],
  });
  assert(r.ok, `valid finding rejected: ${r.errors.join("; ")}`);
});
test("validateFinding: rejects a message-only finding (no file:line)", () => {
  const r = validateFinding({ class: "boom", predicate: "[ERROR] something broke", evidence: { run: "r", turns: [1, 2] }, severity: "P0", target: "x" });
  assert(!r.ok && r.errors.some((e) => /file:line/.test(e)), "should reject non file:line predicate");
});
test("validateFinding: rejects bad severity and missing evidence", () => {
  const r = validateFinding({ class: "x", predicate: "a.ts:1", severity: "P9", target: "t" });
  assert(!r.ok && r.errors.some((e) => /P0-P3/.test(e)) && r.errors.some((e) => /evidence/.test(e)), "severity+evidence");
});
test("REGISTER_DISPOSITIONS: matches the review register tokens", () => {
  eq([...REGISTER_DISPOSITIONS].sort(), ["Closed-P3", "Deferred-by-user", "Resolved", "Scheduled-roadmap"], "tokens");
});

harnessComplete();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
