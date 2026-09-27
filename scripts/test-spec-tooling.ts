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
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
let passed = 0;
let failed = 0;

function check(ok: boolean, label: string): void {
  if (ok) { passed++; console.log(`  PASS ${label}`); }
  else { failed++; console.error(`  FAIL ${label}`); }
}

function run(args: string[]): string {
  return execFileSync("npx", ["tsx", ...args], { cwd: root, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });
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

  console.log(`\nspec-tooling self-tests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

try {
  main();
} catch (e: any) {
  console.error(`fatal: ${e?.message ?? e}`);
  process.exit(2);
}
