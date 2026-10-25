// eval-coverage.ts — derive per-REQ coverage from assertions and validate it.
//
// The report's coverage map counts only events with `tool: "assertion"`, so a
// declared tier REQ with no assertion is a finding rather than an invisible
// claim. Unknown IDs (absent from the spec) are reported too. Exit codes: n/a
// (library).
//
// REQ citations: none — informational evaluation-harness support.

import type { TierResult } from "./eval-schema.js";

/** REQ -> sorted tier names, from assertion events only. */
export function deriveCoverage(results: TierResult[]): Record<string, string[]> {
  const byReq = new Map<string, Set<string>>();
  for (const result of results) {
    for (const event of result.events) {
      if (event.tool !== "assertion") continue;
      for (const req of event.req_ids) {
        const tiers = byReq.get(req) ?? new Set<string>();
        tiers.add(result.tier);
        byReq.set(req, tiers);
      }
    }
  }
  return Object.fromEntries([...byReq.keys()].sort().map((req) => [req, [...byReq.get(req)!].sort()]));
}

/** REQ IDs exercised by at least one assertion, grouped by tier. */
export function assertedReqsByTier(results: TierResult[]): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const result of results) {
    const reqs = new Set<string>();
    for (const event of result.events) {
      if (event.tool !== "assertion") continue;
      for (const req of event.req_ids) reqs.add(req);
    }
    out.set(result.tier, reqs);
  }
  return out;
}

export interface CoverageValidation {
  /** IDs that appear in a declaration or an assertion but not in the spec. */
  unknown: Array<{ tier: string; req: string }>;
  /** Declared tier REQs with zero assertions in that tier. */
  unasserted: Array<{ tier: string; req: string }>;
}

/**
 * Validate the declared tier->REQ map against the assertions that ran.
 * Only tiers present in `results` are checked, so a single-tier run does not
 * report the other tiers as unasserted.
 */
export function validateCoverage(
  declaredByTier: Record<string, string[]>,
  results: TierResult[],
  specIds: Set<string>,
): CoverageValidation {
  const byTier = assertedReqsByTier(results);
  const unknown: Array<{ tier: string; req: string }> = [];
  const unasserted: Array<{ tier: string; req: string }> = [];
  for (const result of results) {
    const asserted = byTier.get(result.tier) ?? new Set<string>();
    const declared = declaredByTier[result.tier] ?? [];
    const tierUnknown = new Set([...asserted, ...declared].filter((req) => !specIds.has(req)));
    for (const req of tierUnknown) unknown.push({ tier: result.tier, req });
    for (const req of declared) if (!asserted.has(req)) unasserted.push({ tier: result.tier, req });
  }
  const order = (a: { tier: string; req: string }, b: { tier: string; req: string }) =>
    a.tier.localeCompare(b.tier) || a.req.localeCompare(b.req);
  return { unknown: unknown.sort(order), unasserted: unasserted.sort(order) };
}
