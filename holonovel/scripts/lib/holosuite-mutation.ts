// holosuite-mutation.ts — Holosuite method audit: mutation-audit catch rate.
//
// Report-only tier. Seeds a deterministic set of mutants (fault injections
// into the evaluation evidence, selected by the `TTRPG_MUTANT` identifier so
// normal runs are unaffected), runs the oracle/lens predicates over each, and
// reports the fraction of seeded mutants the oracle detects — the catch rate
// §8 defines. Never blocks a build and is not part of the `all` tier.
//
// Exit codes: n/a (library). REQ citations: none — informational evaluation
// harness support implementing the §8 Holosuite evaluation method.

import { fingerprintStable, fingerprintChanged, envelopeRecognized } from "./eval-oracle.js";
import { LENSES, computeLenses } from "./playtest-lib.js";
import type { TierResult } from "./eval-schema.js";

/** Environment identifier that selects the active mutant. */
export const MUTANT_ENV = "TTRPG_MUTANT";

function activeMutant(): string | null {
  return process.env[MUTANT_ENV] ?? null;
}

interface Evidence { tx: any[]; oracle: any; }

/** Nominal clean-run evidence; perturbed only when a mutant id is selected. */
function evidence(): Evidence {
  const tx: any[] = [
    { t: 1, agent: "gm", tool: "set_badge", args: { badge: "game_master" }, prefix: "[OK]", error_class: "ok", post_fp: "fp1", state_delta: null, result: "[OK]" },
    { t: 2, agent: "gm", tool: "manage_world", args: { action: "create_room", name: "Vault" }, prefix: "[OK]", error_class: "ok", post_fp: "fp2", state_delta: { rooms: 1 }, result: "[OK] vault created" },
    { t: 3, agent: "player", tool: "run_command", args: { action: "execute", command: "look" }, prefix: "[OK]", error_class: "ok", post_fp: "fp2", state_delta: null, result: "[OK] You see a door." },
  ];
  const oracle: any = {
    success: true,
    gating_leak: false,
    unrecovered_detail: [],
    mission: { hallucinated_tools: [], persist_violations: [], unexplained_room_drift: [] },
    authoring: { reachability: { objective_reachable: true, objective: "Vault" } },
  };

  switch (activeMutant()) {
    case "hallucinated_tool":
      oracle.mission.hallucinated_tools = ["phantom_tool"];
      tx.push({ t: 4, agent: "player", tool: "phantom_tool", args: {}, prefix: "[OK]", error_class: "ok", post_fp: "fp2", state_delta: null, result: "[OK]" });
      break;
    case "forbidden_thrash":
      tx.push({ t: 4, agent: "player", tool: "manage_combat", args: {}, prefix: "[FORBIDDEN]", error_class: "denial", post_fp: "fp2", state_delta: null, result: "[FORBIDDEN] GM only" });
      tx.push({ t: 5, agent: "player", tool: "manage_combat", args: {}, prefix: "[FORBIDDEN]", error_class: "denial", post_fp: "fp2", state_delta: null, result: "[FORBIDDEN] GM only" });
      break;
    case "unrecovered_error":
      oracle.unrecovered_detail = [{ t: 5, tool: "run_command", prefix: "[ERROR]" }];
      break;
    case "missing_corrective":
      tx.push({ t: 4, agent: "player", tool: "manage_story", args: {}, prefix: "[NOT_FOUND]", error_class: "denial", post_fp: "fp2", state_delta: null, result: "[NOT_FOUND] no entry" });
      break;
    case "dead_end":
      tx.push({ t: 4, agent: "player", tool: "run_command", args: { action: "execute", command: "go north" }, prefix: "[NOT_FOUND]", error_class: "denial", post_fp: "fp2", state_delta: null, result: "[NOT_FOUND] no exit" });
      break;
    case "loop":
      tx.push({ t: 4, agent: "gm", tool: "run_command", args: { action: "execute", command: "wait" }, prefix: "[OK]", error_class: "ok", post_fp: "fp2", state_delta: null, result: "[OK]" });
      tx.push({ t: 5, agent: "gm", tool: "run_command", args: { action: "execute", command: "wait" }, prefix: "[OK]", error_class: "ok", post_fp: "fp2", state_delta: null, result: "[OK]" });
      break;
    case "ambiguity_stall":
      tx.push({ t: 4, agent: "gm", tool: "run_command", args: {}, prefix: "[AMBIGUOUS]", error_class: "denial", post_fp: "fp2", state_delta: null, result: "[AMBIGUOUS] which door?" });
      break;
    case "state_divergence":
      oracle.mission.persist_violations = [{ between: 4, prev: "fp2", next: "fp9" }];
      break;
    case "gating_leak":
      oracle.gating_leak = true;
      break;
    case "unreachable_goal":
      oracle.authoring.reachability.objective_reachable = false;
      break;
    default:
      break;
  }
  return { tx, oracle };
}

interface Mutant { id: string; lens: string; detail: string; caught: () => boolean; }

/** Deterministic mutant set: nine lens mutants plus three invariant mutants. */
const MUTANTS: Mutant[] = [
  ...LENSES.filter((l) => l !== "wrong_tool").map((lens) => ({ id: lens, lens, detail: `oracle detects a seeded ${lens}`, caught: () => computeLenses(evidence().tx, evidence().oracle)[lens]!.length > 0 })),
  { id: "gating_leak", lens: "gating_leak", detail: "oracle detects a narrated unearned success", caught: () => computeLenses(evidence().tx, evidence().oracle).gating_leak!.length > 0 },
  { id: "unreachable_goal", lens: "unreachable_goal", detail: "oracle detects an unreachable escape target", caught: () => computeLenses(evidence().tx, evidence().oracle).unreachable_goal!.length > 0 },
  { id: "fingerprint_drift", lens: "determinism", detail: "fingerprintStable flags a read-only mutation", caught: () => !fingerprintStable("a", "b").ok },
  { id: "missed_mutation", lens: "determinism", detail: "fingerprintChanged flags a no-op mutation", caught: () => !fingerprintChanged("a", "a").ok },
  { id: "unrecognized_envelope", lens: "determinism", detail: "envelopeRecognized flags a bare result", caught: () => !envelopeRecognized("garbage result", false).ok },
];

/** Run the method audit and return the catch rate (report-only, never fails). */
export async function runMutationAudit(): Promise<TierResult> {
  const prior = process.env[MUTANT_ENV];
  const results: { id: string; lens: string; caught: boolean }[] = [];
  for (const m of MUTANTS) {
    process.env[MUTANT_ENV] = m.id;
    let caught = false;
    try {
      caught = m.caught();
    } catch {
      // A mutant whose predicate throws is not caught — record it as a miss.
      caught = false;
    }
    results.push({ id: m.id, lens: m.lens, caught });
  }
  if (prior === undefined) delete process.env[MUTANT_ENV];
  else process.env[MUTANT_ENV] = prior;

  const caught = results.filter((r) => r.caught).length;
  const seeded = results.length;
  const catchRate = seeded ? Number((caught / seeded).toFixed(4)) : 1;
  return {
    tier: "mutation",
    passed: caught,
    failed: 0,
    findings: [],
    events: [],
    metrics: {
      catch_rate: catchRate,
      seeded,
      caught,
      missed: results.filter((r) => !r.caught).map((r) => r.id),
      mutants: results,
    },
  };
}
