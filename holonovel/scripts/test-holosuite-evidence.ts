#!/usr/bin/env node
/**
 * test-holosuite-evidence.ts — self-tests for the Holosuite evidence libs. [gate]
 *
 * Covers the four pure helpers the runner relies on so the evidence contract
 * cannot regress silently: assertion recording (event/finding shape), predicate
 * resolution, assertion-derived coverage, coverage validation, and spec hashing.
 * Exit codes: 0 = pass, 1 = failure, 2 = fatal. Wired into the Holosuite gate
 * group in package.json, run-test-suite, CI, and pre-push.
 */

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { recordAssertion } from "./lib/eval-assertion.js";
import { parsePredicate, resolvePredicate } from "./lib/eval-predicate.js";
import { deriveCoverage, validateCoverage } from "./lib/eval-coverage.js";
import { specContentHash } from "./lib/eval-provenance.js";
import type { TierResult } from "./lib/eval-schema.js";

installHarnessGuard();

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`PASS ${name}`);
  } catch (e: unknown) {
    failed++;
    console.error(`FAIL ${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
function assert(cond: unknown, message: string): void {
  if (!cond) throw new Error(message);
}

const ROOT = mkdtempSync(join(tmpdir(), "holosuite-evidence-"));
try {
  const source = join(ROOT, "ok.ts");
  writeFileSync(source, "const a = 1;\nexport function f() {}\n}\n// comment\n");

  test("recordAssertion emits one event and counts a pass", () => {
    const ctx = { findings: [], events: [], passed: 0, failed: 0 };
    const ok = recordAssertion(ctx, "t", { name: "check", ok: true, detail: "fine", step: 1, req: ["REQ-001"], predicate: "ok.ts:2" });
    assert(ok, "expected the assertion to return true");
    assert(ctx.passed === 1 && ctx.failed === 0, "expected one pass and no failure");
    assert(ctx.events.length === 1, "expected one event");
    const event = ctx.events[0] as { tool: string; req_ids: string[]; predicate?: string; is_error: boolean };
    assert(event.tool === "assertion", "event tool should be 'assertion'");
    assert(event.req_ids.join(",") === "REQ-001", "event should carry the REQ ids");
    assert(event.predicate === "ok.ts:2", "event should carry the predicate");
    assert(event.is_error === false, "passing event should not be an error");
    assert(ctx.findings.length === 0, "passing assertion should not emit a finding");
  });

  test("recordAssertion emits a finding with the requested severity on failure", () => {
    const ctx = { findings: [], events: [], passed: 0, failed: 0 };
    const ok = recordAssertion(ctx, "t", { name: "bad", ok: false, detail: "broke", step: 2, req: ["REQ-002"], predicate: "ok.ts:1", severity: "P0" });
    assert(!ok, "expected the assertion to return false");
    assert(ctx.failed === 1, "expected one failure");
    assert(ctx.findings.length === 1, "expected one finding");
    const finding = ctx.findings[0] as { class: string; severity: string; tier: string; target: string };
    assert(finding.class === "bad" && finding.severity === "P0", "finding should carry class and severity");
    assert(finding.tier === "t" && finding.target === "REQ-002", "finding should carry tier and target");
    assert(ctx.events[0]!.is_error === true, "failing event should be an error");
  });

  test("parsePredicate accepts path:line and rejects malformed input", () => {
    assert(parsePredicate("a/b.ts:12")?.line === 12, "should parse line 12");
    assert(parsePredicate("a/b.ts") === null, "missing line should be rejected");
    assert(parsePredicate("a/b.ts:0") === null, "line 0 should be rejected");
  });

  test("resolvePredicate accepts a real code line", () => {
    assert(resolvePredicate("ok.ts:2", ROOT).ok, "line 2 should resolve");
  });

  test("resolvePredicate rejects missing, out-of-range, closing, and comment lines", () => {
    assert(!resolvePredicate("missing.ts:1", ROOT).ok, "missing file should fail");
    assert(!resolvePredicate("ok.ts:99", ROOT).ok, "past-EOF line should fail");
    assert(!resolvePredicate("ok.ts:3", ROOT).ok, "closing brace should fail");
    assert(!resolvePredicate("ok.ts:4", ROOT).ok, "comment-only line should fail");
    assert(!resolvePredicate("../ok.ts:1", ROOT).ok, "escaping path should fail");
  });

  test("deriveCoverage counts assertion events only", () => {
    const results: TierResult[] = [
      {
        tier: "t1",
        passed: 1,
        failed: 0,
        findings: [],
        events: [
          { tier: "t1", step: 1, role: "assertion", badge: null, tool: "assertion", args: {}, prefix: "[OK]", error_class: "ok", is_error: false, mcp_error: false, latency_ms: 0, req_ids: ["REQ-001"] },
          { tier: "t1", step: 2, role: "prober", badge: null, tool: "manage_novel", args: {}, prefix: "[OK]", error_class: "ok", is_error: false, mcp_error: false, latency_ms: 0, req_ids: ["REQ-999"] },
        ],
      },
    ];
    const coverage = deriveCoverage(results);
    assert(coverage["REQ-001"]?.join(",") === "t1", "assertion REQ should be covered");
    assert(coverage["REQ-999"] === undefined, "non-assertion event must not create coverage");
  });

  test("validateCoverage reports unknown and unasserted declarations", () => {
    const results: TierResult[] = [
      {
        tier: "t1",
        passed: 1,
        failed: 0,
        findings: [],
        events: [
          { tier: "t1", step: 1, role: "assertion", badge: null, tool: "assertion", args: {}, prefix: "[OK]", error_class: "ok", is_error: false, mcp_error: false, latency_ms: 0, req_ids: ["REQ-001"] },
        ],
      },
    ];
    const result = validateCoverage({ t1: ["REQ-001", "REQ-002", "REQ-999"] }, results, new Set(["REQ-001", "REQ-002"]));
    assert(result.unknown.length === 1 && result.unknown[0]!.req === "REQ-999", "unknown declaration should be reported");
    assert(result.unasserted.some((entry) => entry.req === "REQ-002"), "unasserted declaration should be reported");
  });

  test("specContentHash is stable and falls back to null", () => {
    const spec = join(ROOT, "spec.md");
    writeFileSync(spec, "**REQ-001 — Test.**\n");
    assert(specContentHash(spec) === specContentHash(spec), "hash should be stable");
    assert(specContentHash(join(ROOT, "nope.md")) === null, "missing spec should be null");
  });
} finally {
  rmSync(ROOT, { recursive: true, force: true });
}

harnessComplete();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
