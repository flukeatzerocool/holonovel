#!/usr/bin/env node
// §6.7 update-workflow harness (REQ-098). Exercises T84b: the fingerprint-scoped
// Update workflow entry point (`scripts/update-server.ts --check`) against a
// controlled fingerprint baseline. Asserts the three workflow outcomes that the
// pre-push gate depends on: (1) an unchanged spec reports "current" without
// mutation; (2) a Minor/Major delta with unchanged fingerprints is blocked as
// a pending update (REQ-394); (3) a Patch delta with unchanged fingerprints is
// exempt and exits clean. Each test name carries the T-ID it exercises so the
// coverage register can surface the evidence.
//
// The harness saves and restores `.holonovel-state/pipeline-fingerprints.json`
// (gitignored runtime state) around its runs; no tracked file is mutated.

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const ROOT = join(import.meta.dirname!, "..", "..");
const SPEC_PATH = join(ROOT, "holonovel.md");
const STATE_DIR = join(ROOT, ".holonovel-state");
const FP_FILE = join(STATE_DIR, "pipeline-fingerprints.json");

function sha256(p: string): string {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

function runUpdate(args: string[]): { stdout: string; stderr: string; status: number } {
  const r = spawnSync("npx", ["tsx", join(ROOT, "scripts", "update-server.ts"), ...args], {
    cwd: ROOT,
    encoding: "utf-8",
    timeout: 60000,
  });
  return { stdout: r.stdout ?? "", stderr: r.stderr ?? "", status: r.status ?? -1 };
}

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void): void {
  try { fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assertContains(hay: string, needle: string): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected to contain "${needle}", got: ${hay.substring(0, 300)}`);
}

function main(): void {
  console.log("=== §6.7 Update Workflow (REQ-098) ===\n");
  const currentHash = sha256(SPEC_PATH);
  const otherHash = "f".repeat(64);

  // Save the prior fingerprint state (if any) so the reconcile run does not
  // clobber a real baseline; restore it in the finally block.
  let original: string | null = null;
  if (existsSync(FP_FILE)) original = readFileSync(FP_FILE, "utf-8");
  mkdirSync(STATE_DIR, { recursive: true });

  try {
    // Establish a stored baseline: current spec hash + current fingerprints.
    const seed = runUpdate(["--server", "holonovel", "--spec-hash", currentHash]);
    if (seed.status !== 0) throw new Error(`baseline reconcile failed: ${seed.stdout} ${seed.stderr}`);

    test("T84b/REQ-098: unchanged spec reports current without mutation", () => {
      const r = runUpdate(["--server", "holonovel", "--spec-hash", currentHash, "--check"]);
      if (r.status !== 0) throw new Error(`expected exit 0, got ${r.status}: ${r.stdout} ${r.stderr}`);
      assertContains(r.stdout, "no update needed");
    });

    test("T84b/REQ-098+REQ-394: minor delta with unchanged fingerprints blocks as pending update", () => {
      const r = runUpdate(["--server", "holonovel", "--spec-hash", otherHash, "--delta-class", "minor", "--check"]);
      if (r.status === 0) throw new Error(`expected non-zero exit for pending update: ${r.stdout}`);
      assertContains(r.stdout, "PENDING UPDATE");
    });

    test("T84b/REQ-098+REQ-394: patch delta with unchanged fingerprints is exempt", () => {
      const r = runUpdate(["--server", "holonovel", "--spec-hash", otherHash, "--delta-class", "patch", "--check"]);
      if (r.status !== 0) throw new Error(`expected exit 0 for patch delta, got ${r.status}: ${r.stdout} ${r.stderr}`);
      assertContains(r.stdout, "patch-class");
    });
  } finally {
    // Restore the prior fingerprint baseline.
    if (original !== null) writeFileSync(FP_FILE, original);
    else rmSync(FP_FILE, { force: true });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

try {
  main();
} catch (e: any) {
  console.error("Fatal:", e.message);
  process.exit(2);
}
