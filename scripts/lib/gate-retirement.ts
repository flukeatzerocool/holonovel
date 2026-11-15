// gate-retirement.ts — the retirement predicate and its cost arithmetic. [build tool]
//
// Pure: no filesystem, clock, or console use, so scripts/test-script-tooling.ts
// can exercise it directly and the gate-cost report can stay a thin printer.
//
// The policy this encodes: a green streak is a churn signal, not value
// evidence. A gate becomes a *candidate* on the streak and stays *unwritable*
// until its manifest entry declares a cover — another gate that fails on the
// same finding class. Without that, the only gates with 20 clean runs are the
// ones that hold the tree together.
import type { Gate } from "./gate-manifest.js";

/** One aggregated gate row, as the report computes it from the timing log. */
export interface RetirementRow {
  gate: string;
  medianMs: number;
  zeroFindingStreak: number;
  /** Total failed runs in the log. A gate that ever failed is not churn-free. */
  failures: number;
}

/** Per-tier medians, keyed by gate name. A gate absent from a tier has no entry. */
export interface TierMedians {
  fast: ReadonlyMap<string, number>;
  full: ReadonlyMap<string, number>;
}

export interface RetirementStatus {
  /** Streak cleared the threshold and the gate is not protected. */
  candidate: boolean;
  /** The candidate declares a cover that resolves; only writable gates may be downgraded. */
  writable: boolean;
  /** One-line explanation, printed beside the gate and carried in `--json`. */
  reason: string;
}

export function manifestGateNames(gates: readonly Pick<Gate, "name">[]): Set<string> {
  return new Set(gates.map((gate) => gate.name));
}

export function resolveCovers(
  gate: Pick<Gate, "name" | "coveredBy">,
  gates: readonly Pick<Gate, "name">[],
): { resolved: string[]; unresolved: string[] } {
  const names = manifestGateNames(gates);
  const resolved: string[] = [];
  const unresolved: string[] = [];
  for (const cover of gate.coveredBy ?? []) {
    // A gate cannot cover itself: that would let one green streak retire the
    // only surface that fails on the finding class.
    if (cover === gate.name || !names.has(cover)) unresolved.push(cover);
    else if (!resolved.includes(cover)) resolved.push(cover);
  }
  return { resolved, unresolved };
}

/**
 * Decide where a row stands. `gate` is the manifest entry, or undefined when
 * the timing log still carries a gate the manifest no longer has.
 */
export function candidateReason(
  row: RetirementRow,
  gate: Pick<Gate, "name" | "protected" | "coveredBy"> | undefined,
  gates: readonly Pick<Gate, "name">[],
  threshold: number,
): RetirementStatus {
  if (!gate) return { candidate: false, writable: false, reason: "not in the manifest" };
  if (gate.protected) return { candidate: false, writable: false, reason: "protected" };
  if (row.failures > 0) return { candidate: false, writable: false, reason: "has failed in the log" };
  if (row.zeroFindingStreak < threshold) {
    return { candidate: false, writable: false, reason: "streak below threshold" };
  }
  const { resolved, unresolved } = resolveCovers(gate, gates);
  if (resolved.length === 0) {
    const reason = unresolved.length === 0 ? "no cover declared" : `cover does not resolve: ${unresolved.join(", ")}`;
    return { candidate: true, writable: false, reason };
  }
  if (unresolved.length > 0) {
    return { candidate: true, writable: false, reason: `cover does not resolve: ${unresolved.join(", ")}` };
  }
  return { candidate: true, writable: true, reason: `covered by ${resolved.join(", ")}` };
}

/**
 * Wall-clock milliseconds a retirement would buy, per tier.
 *
 * Fast mode launches every fast gate concurrently (scripts/run-gates.ts), so
 * retiring a gate saves nothing unless it *is* the critical path — the saving
 * is its median minus the slowest sibling's. Full mode runs sequentially, so a
 * full-tier gate's saving is its whole median. A gate absent from a tier buys
 * nothing there.
 */
export function savingMs(
  gate: Pick<Gate, "name" | "fast" | "full">,
  medians: TierMedians,
): { fast: number; full: number } {
  let fast = 0;
  if (gate.fast !== null) {
    const own = medians.fast.get(gate.name);
    if (own !== undefined) {
      let slowestSibling = 0;
      for (const [name, ms] of medians.fast) if (name !== gate.name) slowestSibling = Math.max(slowestSibling, ms);
      fast = Math.max(0, own - slowestSibling);
    }
  }
  const full = gate.full.length > 0 ? medians.full.get(gate.name) ?? 0 : 0;
  return { fast, full };
}
