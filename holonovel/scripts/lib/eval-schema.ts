// eval-schema.ts — shared event/manifest schema for the Holosuite tiers.
//
// Pure library. One record shape for every tier (deterministic and
// stochastic) so transcripts, oracles, and reports agree. Serialization is
// canonical (sorted keys) and carries no wall-clock field, so committed
// evidence does not flap. Exit codes: n/a (library).
//
// REQ citations: none — informational evaluation-harness support.

import { appendFileSync } from "node:fs";

export type ErrorClass = "defect" | "denial" | "ok";
export type Severity = "P0" | "P1" | "P2" | "P3";

/** Provenance pins a run to the exact artifacts under test. */
export interface EvalProvenance {
  server_dir: string;
  git_sha: string | null;
  spec_hash: string | null;
  ruleset: string | null;
  novel: string | null;
  node: string;
  seed: number | null;
}

/** One recorded tool interaction, shared by all tiers. */
export interface EvalEvent {
  tier: string;
  step: number;
  role: string;
  badge: string | null;
  tool: string;
  args: Record<string, unknown>;
  prefix: string;
  error_class: ErrorClass;
  is_error: boolean;
  mcp_error: boolean;
  latency_ms: number;
  req_ids: string[];
  detail?: string;
}

/** A defect finding. `predicate` is a `file:line` citation, never a message. */
export interface EvalFinding {
  class: string;
  predicate: string;
  tier: string;
  step: number;
  severity: Severity;
  target: string;
  detail: string;
}

/** Per-tier result envelope. */
export interface TierResult {
  tier: string;
  passed: number;
  failed: number;
  findings: EvalFinding[];
  events: EvalEvent[];
  /** Optional tier-specific metrics (e.g. the mutation audit's catch rate). */
  metrics?: Record<string, unknown>;
}

function sortValue(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(sortValue);
  if (x && typeof x === "object") {
    const o = x as Record<string, unknown>;
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortValue(o[k])]));
  }
  return x;
}

/** Deterministic JSON with recursively sorted object keys. */
export function canonicalJson(x: unknown): string {
  return JSON.stringify(sortValue(x));
}

/** Append one event as a single JSONL line. */
export function appendEvent(path: string, e: EvalEvent): void {
  appendFileSync(path, JSON.stringify(e) + "\n");
}

/** Aggregate tier results into a single pass/fail with findings. */
export function summarize(results: TierResult[]): { passed: number; failed: number; findings: EvalFinding[] } {
  return {
    passed: results.reduce((n, r) => n + r.passed, 0),
    failed: results.reduce((n, r) => n + r.failed, 0),
    findings: results.flatMap((r) => r.findings),
  };
}
