// eval-stats.ts — pure statistics helpers for the Holosuite method audit.
//
// `wilsonInterval` is the two-sided Wilson score interval for a binomial
// proportion. Deterministic, no I/O, no clock: the same `(caught, seeded)`
// always yields the same bounds. Used by the mutation tier to publish a catch
// rate with its uncertainty (REQ citations: none — harness support for the §8
// mutation-audit catch rate). Exit codes: n/a (library).

export interface WilsonInterval {
  low: number;
  high: number;
  width: number;
}

const round4 = (value: number): number => Number(value.toFixed(4));

/**
 * Two-sided Wilson score interval at the given z (1.96 = 95%).
 * Returns `null` for an empty sample. `caught` is clamped to `[0, seeded]`;
 * bounds are clamped to `[0, 1]`; `width` is computed from the unrounded
 * bounds, so it is not always the difference of the two printed bounds.
 */
export function wilsonInterval(caught: number, seeded: number, z = 1.96): WilsonInterval | null {
  if (!Number.isFinite(seeded) || seeded <= 0) return null;
  const c = Math.min(Math.max(caught, 0), seeded);
  const p = c / seeded;
  const z2 = z * z;
  const denominator = 1 + z2 / seeded;
  const centre = (p + z2 / (2 * seeded)) / denominator;
  const half = (z * Math.sqrt((p * (1 - p)) / seeded + z2 / (4 * seeded * seeded))) / denominator;
  const rawLow = Math.max(0, centre - half);
  const rawHigh = Math.min(1, centre + half);
  return { low: round4(rawLow), high: round4(rawHigh), width: round4(rawHigh - rawLow) };
}
