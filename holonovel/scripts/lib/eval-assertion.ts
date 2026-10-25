// eval-assertion.ts — shared assertion recording for the Holosuite tiers.
//
// One assertion produces one finding (on failure) and one event (always), so
// per-REQ coverage is derived from what the tiers actually asserted rather
// than from a hand-written declaration. Exit codes: n/a (library).
//
// REQ citations: none — informational evaluation-harness support.

import type { EvalEvent, EvalFinding, Severity } from "./eval-schema.js";

/** Mutable accumulator every tier produces and the runner consumes. */
export interface AssertionContext {
  findings: EvalFinding[];
  events: EvalEvent[];
  passed: number;
  failed: number;
}

export interface AssertionInput {
  name: string;
  ok: boolean;
  detail: string;
  step: number;
  req: string[];
  predicate: string;
  severity?: Severity;
}

/**
 * Record one assertion. Failure adds a finding; every call adds an event with
 * `tool: "assertion"` so coverage can be derived from it. Returns `ok` so tiers
 * that branch on the result keep their existing shape.
 */
export function recordAssertion(ctx: AssertionContext, tier: string, input: AssertionInput): boolean {
  if (input.ok) {
    ctx.passed++;
  } else {
    ctx.failed++;
    ctx.findings.push({
      class: input.name,
      predicate: input.predicate,
      tier,
      step: input.step,
      severity: input.severity ?? "P1",
      target: input.req.join(","),
      detail: input.detail,
    });
  }
  ctx.events.push({
    tier,
    step: input.step,
    role: "assertion",
    badge: null,
    tool: "assertion",
    args: { assertion: input.name },
    prefix: input.ok ? "[OK]" : "[DEFECT]",
    error_class: input.ok ? "ok" : "defect",
    is_error: !input.ok,
    mcp_error: false,
    latency_ms: 0,
    req_ids: [...input.req],
    predicate: input.predicate,
    detail: input.detail,
  });
  return input.ok;
}

/** Bind the tier name once; the returned function matches the old `record`. */
export function assertionRecorder(ctx: AssertionContext, tier: string) {
  return (name: string, ok: boolean, detail: string, step: number, req: string[], predicate: string, severity?: Severity): boolean =>
    recordAssertion(ctx, tier, { name, ok, detail, step, req, predicate, severity });
}
