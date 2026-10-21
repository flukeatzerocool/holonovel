#!/usr/bin/env npx tsx
/**
 * test-spec-tooling.ts — self-tests for the spec-delta and compare-spec-code
 * flags added by the 2026-09-27 conformance follow-up. [gate]
 *
 * Guards `spec-delta --base` and `compare-spec-code --dedicated`/`--bundles`
 * against regression. Deterministic; reads the working tree and git refs only,
 * no network. Wired into `check` and `check:fast`.
 *
 * Exit codes: 0 = pass, 1 = assertion failure, 2 = fatal.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readSpec, extractReqBodies, extractReqHeaders, changedReqBodies } from "./lib/parse-spec.js";

const root = join(import.meta.dirname, "..");
let passed = 0;
let failed = 0;

function check(ok: boolean, label: string): void {
  if (ok) { passed++; console.log(`  PASS ${label}`); }
  else { failed++; console.error(`  FAIL ${label}`); }
}

function run(args: string[]): string {
  return execFileSync("npx", ["tsx", ...args], { cwd: root, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
}
function runCode(args: string[]): { code: number; out: string } {
  try {
    return { code: 0, out: run(args) };
  } catch (e: any) {
    return { code: Number(e?.status ?? -1), out: `${e?.stdout ?? ""}${e?.stderr ?? ""}` };
  }
}

function main(): void {
  // REQ-098/F5 — spec-delta --base classifies against the given ref.
  const delta = run(["scripts/spec-delta.ts", "--base", "HEAD", "--report-only"]);
  const deltaJson = JSON.parse(delta.slice(delta.indexOf("{")));
  check(["none", "patch", "editorial", "minor", "major"].includes(deltaJson.classification), "spec-delta --base emits a valid classification");
  check(typeof deltaJson.current_hash === "string" && deltaJson.current_hash.length === 64, "spec-delta --base emits a SHA-256 current_hash");

  // F3 — the dedicated-evidence report renders with a parseable count.
  const dedicated = run(["scripts/compare-spec-code.ts", "--dedicated"]);
  check(dedicated.includes("Dedicated-evidence report"), "compare-spec-code --dedicated emits the report header");
  check(/no dedicated exercised test: \d+/.test(dedicated), "dedicated report carries a count");

  // SC-6 — the bundle report runs and reports a count.
  const bundles = run(["scripts/compare-spec-code.ts", "--bundles"]);
  check(/Bundle-dependent REQs \(\d+\)/.test(bundles), "compare-spec-code --bundles reports a count");

  // REQ-419 — the shared body parser captures the full REQ body past the
  // `*Acceptance criterion:*` emphasis, so a body edit cannot classify patch.
  const baseSpec = [
    "**REQ-900 — Alpha.**",
    "The system SHALL do alpha.",
    "*Acceptance criterion:* alpha happens. _Check:_ T900.",
    "",
    "**REQ-901 — Beta.**",
    "The system SHALL do beta.",
    "*Acceptance criterion:* beta happens. _Check:_ T901.",
  ].join("\n");
  const editedSpec = baseSpec.replace("alpha happens", "alpha always happens");
  const changed = changedReqBodies(editedSpec, baseSpec);
  check(changed.length === 1 && changed[0] === "900", "REQ-body edit inside an acceptance criterion is detected (REQ-419)");
  check(changedReqBodies(baseSpec, baseSpec).length === 0, "identical specs report no REQ-body changes");
  check(changedReqBodies(baseSpec, editedSpec).length === 1, "REQ-body diff is symmetric");

  // The shared parser must cover every canonical REQ header in the assembled spec.
  const spec = readSpec();
  const headerCount = extractReqHeaders(spec).length;
  check(extractReqBodies(spec).size === headerCount, `body parser covers every REQ header (${extractReqBodies(spec).size}/${headerCount})`);

  // T686 (REQ-586) — the performance-record gate accepts a complete record and
  // rejects a missing term or an unreasoned waiver.
  const perfDir = mkdtempSync(join(tmpdir(), "perf-record-"));
  const goodRecord = {
    schema_version: 1,
    scope: "reference-host",
    measured_at: "2026-10-21",
    environment: "linux x86_64, node 24, 16GB",
    spec_hash: "a".repeat(64),
    ruleset_content_hash: "b".repeat(64),
    terms: {
      conversion_fidelity: { waived: "authored Markdown source" },
      extraction_completeness: 0.97,
      tool_selection_coverage: 0.93,
      mean_calls_per_intent: 1.0,
      catalog_tokens: 25856,
      prompt_tokens: 1234,
      cold_start_ms: 850,
      query_latency_ms: 12,
    },
  };
  const write = (name: string, value: any): string => {
    const path = join(perfDir, name);
    writeFileSync(path, JSON.stringify(value, null, 2));
    return path;
  };
  const good = runCode(["scripts/check-performance-record.ts", write("good.json", goodRecord)]);
  check(good.code === 0, "performance-record gate accepts a complete record");
  const missing = JSON.parse(JSON.stringify(goodRecord));
  delete missing.terms.prompt_tokens;
  const missingRun = runCode(["scripts/check-performance-record.ts", write("missing.json", missing)]);
  check(missingRun.code === 1 && missingRun.out.includes("missing term 'prompt_tokens'"), "performance-record gate rejects a missing term");
  const unreasoned = JSON.parse(JSON.stringify(goodRecord));
  unreasoned.terms.conversion_fidelity = { waived: "" };
  const unreasonedRun = runCode(["scripts/check-performance-record.ts", write("unreasoned.json", unreasoned)]);
  check(unreasonedRun.code === 1 && unreasonedRun.out.includes("waiver without a reason"), "performance-record gate rejects an unreasoned waiver");
  rmSync(perfDir, { recursive: true, force: true });

  console.log(`\nspec-tooling self-tests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

try {
  main();
} catch (e: any) {
  console.error(`fatal: ${e?.message ?? e}`);
  process.exit(2);
}
