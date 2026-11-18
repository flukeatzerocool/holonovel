// holosuite-mutation.ts — Holosuite method audit: mutation-audit catch rate.
//
// Report-only tier implementing the §8 mutation-audit catch rate: a
// deterministic set of mutants, each bound to a detection predicate and paired
// with a clean control, evaluated over the mutant's own fault and clean
// evidence. The published rate is the fraction of seeded mutants whose
// predicate observes its injected fault; the set is published enumerated and
// stratified (lens-derived, GM lane, harness invariant, contract evaluator),
// with each stratum's own rate beside the aggregate. Never blocks a build and
// is not part of the `all` tier.
//
// Exit codes: n/a (library). REQ citations: none — informational evaluation
// harness support implementing the §8 Holosuite evaluation method.

import {
  fingerprintStable, fingerprintChanged, envelopeRecognized, inventoryNames,
} from "./eval-oracle.js";
import {
  LENSES, computeLenses, classifyResult, stateDelta, prefix, errorClass, asArray,
  roomSet, stateFingerprint, pcVitals, reachableRooms, isReachable, partyRooms,
  entityCounts, validateFinding, anchorPresent,
} from "./playtest-lib.js";
import { REQUIRED_PARAMS, paramKey, isAbsent, requirementFor } from "../../src/core/param-contract.js";
import { hasUndefinedRecord } from "./eval-state.js";
import { deriveCoverage, validateCoverage } from "./eval-coverage.js";
import { parsePredicate } from "./eval-predicate.js";
import { wilsonInterval } from "./eval-stats.js";
import type { TierResult, EvalEvent } from "./eval-schema.js";

export interface Evidence { tx: any[]; oracle: any; }

export type Stratum = "lens" | "lane" | "invariant" | "contract";

export interface CaseBase {
  id: string;
  /** Owning lens for lens mutants; `null` for every other stratum. */
  lens: string | null;
  stratum: Stratum;
  detail: string;
  derived: boolean;
  /** Contract entries only: `<file-basename>#<function>:<input-shape>`. */
  branch?: string;
}

export type MutantCase = CaseBase & (
  | { kind: "evidence"; fault: Evidence; clean: Evidence; bound: (e: Evidence) => boolean }
  | { kind: "predicate"; fault: () => boolean; clean: () => boolean }
);

/** The clean base fixture: five turns, one fault-turn slot at t6. */
export function evidence(): Evidence {
  const tx: any[] = [
    { t: 1, agent: "gm", tool: "set_badge", args: { badge: "game_master" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp0", post_fp: "fp0", state_delta: null, result: "[OK] badge set" },
    { t: 2, agent: "gm", tool: "manage_world", args: { action: "create_room", name: "Vault" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp0", post_fp: "fp1", state_delta: { rooms: 1, things: 0, exits: 0, pcs: 0, npcs: 0, beats: 0, inventory_changed: false }, result: "[OK] vault created" },
    { t: 3, agent: "player", tool: "run_command", args: { action: "execute", command: "look" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp1", post_fp: "fp1", state_delta: null, result: "[OK] You see a door." },
    { t: 4, agent: "gm", tool: "manage_npc", args: { action: "create", name: "Mira", location: "Vault" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp1", post_fp: "fp2", state_delta: { rooms: 0, things: 0, exits: 0, pcs: 0, npcs: 1, beats: 0, inventory_changed: false }, result: "[OK] NPC 'Mira' created." },
    { t: 5, agent: "player", tool: "run_command", args: { action: "execute", command: "go north" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp2", post_fp: "fp3", state_delta: { rooms: 0, things: 0, exits: 0, pcs: 0, npcs: 0, beats: 0, inventory_changed: false }, result: "[OK] You move north." },
  ];
  const oracle: any = {
    success: true,
    gating_leak: false,
    unrecovered_detail: [],
    mission: { hallucinated_tools: [], persist_violations: [], unexplained_room_drift: [] },
    authoring: { reachability: { objective_reachable: true, objective: "Vault" } },
  };
  return { tx, oracle };
}

// ── Fixture helpers ───────────────────────────────────────────────────

const ZERO_DELTA = { rooms: 0, things: 0, exits: 0, pcs: 0, npcs: 0, beats: 0, inventory_changed: false };

/** Base fixture plus appended turns and an optional oracle mutation. */
function fixture(turns: any[] = [], patch: (oracle: any) => void = () => {}): Evidence {
  const base = evidence();
  base.tx.push(...turns);
  patch(base.oracle);
  return base;
}

/** A lens-derived case: the bound predicate is "this lens reports a finding". */
function lensCase(
  lens: string,
  detail: string,
  faultTurns: any[],
  cleanTurns: any[],
  patch: (oracle: any) => void = () => {},
  derived = true,
): MutantCase {
  return {
    kind: "evidence",
    id: lens,
    lens,
    stratum: "lens",
    detail,
    derived,
    fault: fixture(faultTurns, patch),
    clean: fixture(cleanTurns),
    bound: (e) => (computeLenses(e.tx, e.oracle)[lens] ?? []).length > 0,
  };
}

function laneCase(
  lane: string,
  detail: string,
  faultTurns: any[],
  cleanTurns: any[],
): MutantCase {
  return {
    kind: "evidence",
    id: lane,
    lens: null,
    stratum: "lane",
    detail,
    derived: true,
    fault: fixture(faultTurns),
    clean: fixture(cleanTurns),
    bound: (e) => (computeLenses(e.tx, e.oracle)[lane] ?? []).length > 0,
  };
}

// ── Declared mutant set ───────────────────────────────────────────────
// Five lens mutants, two deterministic GM lanes, three harness invariants,
// and five oracle-derived lens mutants that stay declared and uncounted: the
// lens re-emits the field the mutant seeds, so the detection is tautological.

const DENIAL = { error_class: "denial" as const };

export const MUTANTS: MutantCase[] = [
  lensCase(
    "forbidden_thrash",
    "consecutive [FORBIDDEN] by one agent",
    [
      { t: 6, agent: "player", tool: "manage_combat", args: {}, prefix: "[FORBIDDEN]", pre_fp: "fp3", post_fp: "fp3", state_delta: null, result: "[FORBIDDEN] GM only", ...DENIAL },
      { t: 7, agent: "player", tool: "manage_combat", args: {}, prefix: "[FORBIDDEN]", pre_fp: "fp3", post_fp: "fp3", state_delta: null, result: "[FORBIDDEN] GM only", ...DENIAL },
    ],
    [],
  ),
  lensCase(
    "missing_corrective",
    "a denial with no corrective hint",
    [{ t: 6, agent: "player", tool: "manage_story", args: {}, prefix: "[NOT_FOUND]", pre_fp: "fp3", post_fp: "fp3", state_delta: null, result: "[NOT_FOUND] no entry", ...DENIAL }],
    [{ t: 6, agent: "player", tool: "manage_story", args: {}, prefix: "[NOT_FOUND]", pre_fp: "fp3", post_fp: "fp3", state_delta: null, result: "[NOT_FOUND] no entry. try list", ...DENIAL }],
  ),
  lensCase(
    "dead_end",
    "a parser refusal with no later agent turn",
    [{ t: 6, agent: "player", tool: "run_command", args: { action: "execute", command: "go north" }, prefix: "[NOT_FOUND]", pre_fp: "fp3", post_fp: "fp3", state_delta: null, result: "[NOT_FOUND] no exit", ...DENIAL }],
    [
      { t: 6, agent: "player", tool: "run_command", args: { action: "execute", command: "go north" }, prefix: "[NOT_FOUND]", pre_fp: "fp3", post_fp: "fp3", state_delta: null, result: "[NOT_FOUND] no exit", ...DENIAL },
      { t: 7, agent: "player", tool: "run_command", args: { action: "execute", command: "look" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp3", post_fp: "fp3", state_delta: null, result: "[OK] You see a door." },
    ],
  ),
  lensCase(
    "loop",
    "an identical call repeated with no state movement",
    [
      { t: 6, agent: "gm", tool: "run_command", args: { action: "execute", command: "wait" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp3", post_fp: "fp3", state_delta: null, result: "[OK]" },
      { t: 7, agent: "gm", tool: "run_command", args: { action: "execute", command: "wait" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp3", post_fp: "fp3", state_delta: null, result: "[OK]" },
    ],
    [
      { t: 6, agent: "gm", tool: "run_command", args: { action: "execute", command: "wait" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp3", post_fp: "fp3", state_delta: null, result: "[OK]" },
      { t: 7, agent: "gm", tool: "run_command", args: { action: "execute", command: "wait" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp3", post_fp: "fp4", state_delta: null, result: "[OK]" },
    ],
  ),
  lensCase(
    "ambiguity_stall",
    "an unresolved [AMBIGUOUS] envelope",
    [{ t: 6, agent: "gm", tool: "run_command", args: {}, prefix: "[AMBIGUOUS]", pre_fp: "fp3", post_fp: "fp3", state_delta: null, result: "[AMBIGUOUS] which door?", ...DENIAL }],
    [{ t: 6, agent: "gm", tool: "run_command", args: {}, prefix: "[OK]", error_class: "ok", pre_fp: "fp3", post_fp: "fp3", state_delta: null, result: "[OK]" }],
  ),

  // Deterministic GM lanes (counted).
  laneCase(
    "world_population_failure",
    "a successful NPC creation that adds no NPC",
    [{ t: 6, agent: "gm", tool: "manage_npc", args: { action: "create", name: "Mira" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp3", post_fp: "fp3", state_delta: ZERO_DELTA, result: "[OK] NPC 'Mira' created." }],
    [{ t: 6, agent: "gm", tool: "manage_npc", args: { action: "create", name: "Mira" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp3", post_fp: "fp4", state_delta: { ...ZERO_DELTA, npcs: 1 }, result: "[OK] NPC 'Mira' created." }],
  ),
  laneCase(
    "coupling_failure",
    "a successful move that leaves the state fingerprint unchanged",
    [{ t: 6, agent: "player", tool: "run_command", args: { action: "execute", command: "go south" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp3", post_fp: "fp3", state_delta: ZERO_DELTA, result: "[OK] You move south." }],
    [{ t: 6, agent: "player", tool: "run_command", args: { action: "execute", command: "go south" }, prefix: "[OK]", error_class: "ok", pre_fp: "fp3", post_fp: "fp4", state_delta: ZERO_DELTA, result: "[OK] You move south." }],
  ),

  // Harness invariants (counted).
  {
    kind: "predicate",
    id: "fingerprint_drift",
    lens: null,
    stratum: "invariant",
    detail: "fingerprintStable flags a read-only mutation",
    derived: true,
    fault: () => !fingerprintStable("a", "b").ok,
    clean: () => fingerprintStable("a", "a").ok,
  },
  {
    kind: "predicate",
    id: "missed_mutation",
    lens: null,
    stratum: "invariant",
    detail: "fingerprintChanged flags a no-op mutation",
    derived: true,
    fault: () => !fingerprintChanged("a", "a").ok,
    clean: () => fingerprintChanged("a", "b").ok,
  },
  {
    kind: "predicate",
    id: "unrecognized_envelope",
    lens: null,
    stratum: "invariant",
    detail: "envelopeRecognized flags a bare result",
    derived: true,
    fault: () => !envelopeRecognized("garbage result", false).ok,
    clean: () => envelopeRecognized("[OK] fine", false).ok,
  },

  // Oracle-derived lens mutants: declared, uncounted (the lens re-emits the
  // field the mutant seeds, so detection is tautological).
  {
    kind: "evidence",
    id: "hallucinated_tool",
    lens: "hallucinated_tool",
    stratum: "lens",
    detail: "oracle detects a tool absent from tools/list",
    derived: false,
    fault: fixture(
      [{ t: 6, agent: "player", tool: "phantom_tool", args: {}, prefix: "[OK]", error_class: "ok", pre_fp: "fp3", post_fp: "fp3", state_delta: null, result: "[OK]" }],
      (o) => { o.mission.hallucinated_tools = ["phantom_tool"]; },
    ),
    clean: fixture(),
    bound: (e) => (computeLenses(e.tx, e.oracle).hallucinated_tool ?? []).length > 0,
  },
  {
    kind: "evidence",
    id: "unrecovered_error",
    lens: "unrecovered_error",
    stratum: "lens",
    detail: "oracle reports a defect the next turn does not correct",
    derived: false,
    fault: fixture([], (o) => { o.unrecovered_detail = [{ t: 6, tool: "run_command", prefix: "[ERROR]" }]; }),
    clean: fixture(),
    bound: (e) => (computeLenses(e.tx, e.oracle).unrecovered_error ?? []).length > 0,
  },
  {
    kind: "evidence",
    id: "state_divergence",
    lens: "state_divergence",
    stratum: "lens",
    detail: "oracle reports a fingerprint break between turns",
    derived: false,
    fault: fixture([], (o) => { o.mission.persist_violations = [{ between: 5, prev: "fp3", next: "fp9" }]; }),
    clean: fixture(),
    bound: (e) => (computeLenses(e.tx, e.oracle).state_divergence ?? []).length > 0,
  },
  {
    kind: "evidence",
    id: "gating_leak",
    lens: "gating_leak",
    stratum: "lane",
    detail: "oracle reports a vow resolved outside the escape room",
    derived: false,
    fault: fixture([], (o) => { o.gating_leak = true; }),
    clean: fixture(),
    bound: (e) => (computeLenses(e.tx, e.oracle).gating_leak ?? []).length > 0,
  },
  {
    kind: "evidence",
    id: "unreachable_goal",
    lens: "unreachable_goal",
    stratum: "lane",
    detail: "oracle reports an unreachable escape target",
    derived: false,
    fault: fixture([], (o) => { o.authoring.reachability.objective_reachable = false; }),
    clean: fixture(),
    bound: (e) => (computeLenses(e.tx, e.oracle).unreachable_goal ?? []).length > 0,
  },
];

// ── Contract evaluator pairs ──────────────────────────────────────────
// Each pair binds a production evaluator and asserts its two directions: the
// fault input must be classified as a fault and the clean input accepted.
// `branch` names the evaluator and input shape so no two pairs test the same
// branch.

interface ContractSeed {
  id: string;
  branch: string;
  detail: string;
  fault: () => boolean;
  clean: () => boolean;
}

const isMissingParamEnvelope = (text: string): boolean => /^\[ERROR\] \[MISSING_PARAM\]/.test(text.trim());

/** True when the call is acceptable: unclassified, supplied, or refused. */
function missingParamRefused(tool: string, args: Record<string, unknown>, text: string): boolean {
  const req = REQUIRED_PARAMS[paramKey(tool, args.action)];
  if (!req) return true;
  if (req.unless?.some((alternative) => !isAbsent(args[alternative]))) return true;
  if (!req.params.some((parameter) => isAbsent(args[parameter]))) return true;
  return isMissingParamEnvelope(text);
}

const tierResult = (events: EvalEvent[] = []): TierResult => ({ tier: "mutation", passed: 0, failed: 0, findings: [], events });
const assertionEvent = (reqIds: string[]): EvalEvent => ({
  tier: "mutation", step: 1, role: "system", badge: null, tool: "assertion", args: {},
  prefix: "[OK]", error_class: "ok", is_error: false, mcp_error: false, latency_ms: 0,
  req_ids: reqIds,
});
const nonAssertionEvent = (): EvalEvent => ({
  tier: "mutation", step: 1, role: "system", badge: null, tool: "run_command", args: {},
  prefix: "[OK]", error_class: "ok", is_error: false, mcp_error: false, latency_ms: 0,
  req_ids: ["REQ-001"],
});

const worldNovel = (order: "ab" | "ba", extraRoom = false): any => {
  const rooms: Record<string, any> = {};
  if (order === "ab") { rooms.a = { exits: { north: "b" } }; rooms.b = { exits: {} }; }
  else { rooms.b = { exits: {} }; rooms.a = { exits: { north: "b" } }; }
  if (extraRoom) rooms.c = { exits: {} };
  return { world: { rooms, things: {} }, entities: { pc: { current_room: "a", inventory: [{ name: "torch" }] } }, npcs: { n1: {} }, story_beats: [], vows: [], countdowns: [] };
};

export const CONTRACT_MUTANTS: ContractSeed[] = [
  {
    id: "unguarded_missing_param",
    branch: "holosuite-mutation#missingParamRefused:ok-with-absent-param",
    detail: "the guard's table classifies an [OK] for an absent parameter as unrefused",
    fault: () => !missingParamRefused("manage_lore", { action: "set" }, "[OK] Lore entry 'undefined' created."),
    clean: () => missingParamRefused("manage_lore", { action: "set", key: "k" }, "[OK] Lore entry 'k' created."),
  },
  {
    id: "undefined_record",
    branch: "eval-state#hasUndefinedRecord:undefined-key",
    detail: "the shared scanner flags a Novel persisted under an undefined key",
    fault: () => hasUndefinedRecord({ lore: { undefined: {} } }),
    clean: () => !hasUndefinedRecord({ lore: { k: { content: "x" } } }),
  },
  {
    id: "denial_vs_defect",
    branch: "playtest-lib#classifyResult:denial-vs-defect",
    detail: "the oracle separates a denial from a defect",
    fault: () => classifyResult("[FORBIDDEN] GM only", true).error_class === "denial",
    clean: () => classifyResult("Cannot read properties of undefined (reading 'trim')", true).error_class !== "denial",
  },
  {
    id: "mutation_counted",
    branch: "playtest-lib#stateDelta:room-created",
    detail: "the oracle counts a created room as a state delta",
    fault: () => stateDelta({}, { world: { rooms: { a: {} } } }).rooms === 1,
    clean: () => stateDelta({}, { world: { rooms: {} } }).rooms === 0,
  },
  {
    id: "param_key_actionless",
    branch: "param-contract#paramKey:actionless",
    detail: "an actionless call keys as tool: and a classified call as tool:action",
    fault: () => paramKey("manage_lore", undefined) === "manage_lore:",
    clean: () => paramKey("manage_lore", "set") === "manage_lore:set",
  },
  {
    id: "requirement_lookup",
    branch: "param-contract#requirementFor:classified-vs-unclassified",
    detail: "only a classified action resolves to a requirement",
    fault: () => requirementFor("manage_lore", "set") !== undefined,
    clean: () => requirementFor("manage_lore", "no-such-action") === undefined,
  },
  {
    id: "absent_whitespace",
    branch: "param-contract#isAbsent:whitespace",
    detail: "a whitespace-only string is an absent parameter",
    fault: () => isAbsent("   "),
    clean: () => !isAbsent("x"),
  },
  {
    id: "unknown_prefix",
    branch: "playtest-lib#prefix:unknown-text",
    detail: "unrecognized text classifies as [?]",
    fault: () => prefix("plain text") === "[?]",
    clean: () => prefix("[OK] done") === "[OK]",
  },
  {
    id: "need_input_denial",
    branch: "playtest-lib#errorClass:need-input",
    detail: "a [NEED_INPUT] prefix is a denial, not a defect",
    fault: () => errorClass("[NEED_INPUT]") === "denial",
    clean: () => errorClass("[ERROR]") === "defect",
  },
  {
    id: "mcp_error_flag",
    branch: "playtest-lib#classifyResult:mcp-error",
    detail: "an isError transport flag sets mcp_error on an [OK] body",
    fault: () => classifyResult("[OK]", true).mcp_error === true,
    clean: () => classifyResult("[OK]", false).mcp_error === false,
  },
  {
    id: "array_normalization",
    branch: "playtest-lib#asArray:object-map",
    detail: "an object map normalizes to its values",
    fault: () => asArray({ a: 1, b: 2 }).length === 2,
    clean: () => asArray(undefined).length === 0,
  },
  {
    id: "room_order",
    branch: "playtest-lib#roomSet:insertion-order",
    detail: "room names sort canonically regardless of insertion order",
    fault: () => roomSet(worldNovel("ba")).join(",") === "a,b",
    clean: () => roomSet(worldNovel("ab")).join(",") === "a,b",
  },
  {
    id: "fingerprint_key_order",
    branch: "playtest-lib#stateFingerprint:key-order",
    detail: "key insertion order does not change the fingerprint",
    fault: () => stateFingerprint(worldNovel("ab")) === stateFingerprint(worldNovel("ba")),
    clean: () => stateFingerprint(worldNovel("ab")) !== stateFingerprint(worldNovel("ab", true)),
  },
  {
    id: "wounds_death",
    branch: "playtest-lib#pcVitals:wounds-death",
    detail: "three Wounds is death and two is not",
    fault: () => pcVitals({ stats: { Wounds: 3 } }).dead === true,
    clean: () => pcVitals({ stats: { Wounds: 2 } }).dead === false,
  },
  {
    id: "reachability_two_hop",
    branch: "playtest-lib#reachableRooms:two-hop",
    detail: "a two-hop exit chain reaches the far room",
    fault: () => reachableRooms(worldNovel("ab"), "a").includes("b"),
    clean: () => !reachableRooms(worldNovel("ab"), "a").includes("z"),
  },
  {
    id: "unreachable_goal_lookup",
    branch: "playtest-lib#isReachable:unknown-goal",
    detail: "an unknown goal is unreachable and a linked one is reachable",
    fault: () => isReachable(worldNovel("ab"), "a", "nosuch") === false,
    clean: () => isReachable(worldNovel("ab"), "a", "b") === true,
  },
  {
    id: "unplaced_pc",
    branch: "playtest-lib#partyRooms:unplaced-pc",
    detail: "an unplaced PC maps to null",
    fault: () => partyRooms({ entities: { x: {} } }).x === null,
    clean: () => partyRooms({ entities: { x: { current_room: "vault" } } }).x === "vault",
  },
  {
    id: "entity_counts",
    branch: "playtest-lib#entityCounts:populated-vs-empty",
    detail: "a populated world reports nonzero rooms and exits",
    fault: () => { const c = entityCounts(worldNovel("ab")); return c.rooms === 2 && c.exits === 1 && c.npcs === 1; },
    clean: () => { const c = entityCounts({}); return c.rooms === 0 && c.exits === 0 && c.npcs === 0; },
  },
  {
    id: "delta_entity_removal",
    branch: "playtest-lib#stateDelta:entity-removal",
    detail: "removing a PC is a negative delta",
    fault: () => stateDelta({ entities: { a: {}, b: {} } }, { entities: { a: {} } }).pcs === -1,
    clean: () => stateDelta({ entities: { a: {} } }, { entities: { a: {} } }).pcs === 0,
  },
  {
    id: "finding_predicate_required",
    branch: "playtest-lib#validateFinding:predicate-shape",
    detail: "a finding with no file:line predicate is rejected",
    fault: () => !validateFinding({ class: "x", predicate: "no line", severity: "P1", target: "t", evidence: { run: "r", turns: [1, 2] } }).ok,
    clean: () => validateFinding({ class: "x", predicate: "a.ts:3", severity: "P1", target: "t", evidence: { run: "r", turns: [1, 2] } }).ok,
  },
  {
    id: "anchor_present",
    branch: "playtest-lib#anchorPresent:quoted-anchor",
    detail: "a quoted source_anchor counts and a bare key does not",
    fault: () => anchorPresent('{"source_anchor":"x"}'),
    clean: () => !anchorPresent('{"anchor":null}'),
  },
  {
    id: "inventory_names",
    branch: "eval-oracle#inventoryNames:object-items",
    detail: "inventory items normalize and sort by name",
    fault: () => inventoryNames({ entities: { a: { inventory: [{ name: "b" }, { name: "a" }] } } }, "a").join(",") === "a,b",
    clean: () => inventoryNames({ entities: { a: { inventory: [] } } }, "a").length === 0,
  },
  {
    id: "coverage_assertions_only",
    branch: "eval-coverage#deriveCoverage:assertion-events-only",
    detail: "a non-assertion event contributes no coverage",
    fault: () => Object.keys(deriveCoverage([tierResult([nonAssertionEvent()])])).length === 0,
    clean: () => deriveCoverage([tierResult([assertionEvent(["REQ-001"])])])["REQ-001"]?.join(",") === "mutation",
  },
  {
    id: "coverage_unknown_req",
    branch: "eval-coverage#validateCoverage:unknown-req",
    detail: "an unknown REQ is reported and a known one is not",
    fault: () => validateCoverage({ mutation: ["REQ-001"] }, [tierResult([assertionEvent(["REQ-999"])])], new Set(["REQ-001"])).unknown.some((u) => u.req === "REQ-999"),
    clean: () => !validateCoverage({ mutation: ["REQ-001"] }, [tierResult([assertionEvent(["REQ-001"])])], new Set(["REQ-001"])).unknown.some((u) => u.req === "REQ-001"),
  },
  {
    id: "predicate_parse",
    branch: "eval-predicate#parsePredicate:malformed",
    detail: "a malformed predicate parses to null and a well-formed one does not",
    fault: () => parsePredicate("not a predicate") === null,
    clean: () => parsePredicate("a.ts:3#f")?.symbol === "f",
  },
];

/** Every declared case, in publication order. */
export const CASES: MutantCase[] = [
  ...MUTANTS,
  ...CONTRACT_MUTANTS.map((c): MutantCase => ({
    kind: "predicate",
    id: c.id,
    lens: null,
    stratum: "contract",
    detail: c.detail,
    derived: true,
    branch: c.branch,
    fault: c.fault,
    clean: c.clean,
  })),
];

/** Evaluate one direction of a case; `true` means the predicted outcome held. */
export function detectsOf(c: MutantCase): boolean {
  try {
    return c.kind === "evidence" ? c.bound(c.fault) : c.fault();
  } catch {
    // A predicate whose evaluator changed shape is a miss, not a crash.
    return false;
  }
}

export function controlOf(c: MutantCase): boolean {
  try {
    return c.kind === "evidence" ? !c.bound(c.clean) : c.clean();
  } catch {
    // Same rule for the control: a throw is a failed control.
    return false;
  }
}

/** Per-stratum tallies over the seeded cases. */
function stratumTallies(seeded: MutantCase[], results: Array<{ id: string; stratum: Stratum; caught: boolean }>): Record<string, { caught: number; seeded: number; ci95: { low: number; high: number; width: number } | null }> {
  const out: Record<string, { caught: number; seeded: number; ci95: ReturnType<typeof wilsonInterval> }> = {};
  for (const s of ["lens", "lane", "invariant", "contract"] as Stratum[]) {
    const ids = new Set(seeded.filter((c) => c.stratum === s).map((c) => c.id));
    if (ids.size === 0) continue;
    const caught = results.filter((r) => ids.has(r.id) && r.caught).length;
    out[s] = { caught, seeded: ids.size, ci95: wilsonInterval(caught, ids.size) };
  }
  return out;
}

/** Run the method audit and return the catch rate (report-only, never fails). */
export async function runMutationAudit(): Promise<TierResult> {
  const results = CASES.map((c) => ({
    id: c.id,
    lens: c.lens,
    stratum: c.stratum,
    detail: c.detail,
    caught: detectsOf(c),
    derived: c.derived,
  }));

  const seededCases = CASES.filter((c) => c.derived);
  const seededIds = new Set(seededCases.map((c) => c.id));
  const controls = seededCases.map((c) => ({ id: c.id, control: controlOf(c) }));

  const derivedResults = results.filter((r) => r.derived && seededIds.has(r.id));
  const missed = derivedResults.filter((r) => !r.caught).map((r) => r.id);
  const controlsFailed = controls.filter((c) => !c.control).map((c) => c.id);
  const caught = derivedResults.filter((r) => r.caught).length;
  const seeded = derivedResults.length;

  const composition: Record<string, number> = { lens: 0, lane: 0, invariant: 0, contract: 0 };
  for (const c of seededCases) composition[c.stratum] = (composition[c.stratum] ?? 0) + 1;

  const status = missed.length === 0 && controlsFailed.length === 0
    ? "CLEAN"
    : `FAIL ${[...missed, ...controlsFailed].join(", ")}`;

  return {
    tier: "mutation",
    passed: caught,
    failed: 0,
    findings: [],
    events: [],
    metrics: {
      catch_rate: seeded > 0 ? Number((caught / seeded).toFixed(4)) : null,
      ci95: wilsonInterval(caught, seeded),
      seeded,
      caught,
      missed,
      oracle_derived: results.filter((r) => !r.derived).map((r) => r.id),
      controls_passed: controls.filter((c) => c.control).length,
      controls_failed: controlsFailed,
      composition,
      strata: stratumTallies(seededCases, derivedResults),
      claim_note: "Transcript strata (lens, lane, invariant) measure whether the oracle observes seeded faults; the contract stratum measures evaluator regression; the lens stratum is 5 of 35.",
      status,
      mutants: results,
    },
  };
}
