#!/usr/bin/env node
// §6.7 update-workflow harness (REQ-098). Exercises T84b: the fingerprint-scoped [gate]
// Update workflow entry point (`scripts/update-server.ts --check`) against a
// controlled fingerprint baseline. Asserts the three workflow outcomes that the
// pre-push gate depends on: (1) an unchanged spec reports "current" without
// mutation; (2) a Minor/Major delta with unchanged fingerprints is blocked as
// a pending update (REQ-394); (3) a Patch delta with unchanged fingerprints is
// exempt and exits clean. It also exercises T649/REQ-556: the Update workflow's
// user-data reconciliation migrates every stale persisted artifact and reports
// a stale package whose source is unavailable rather than omitting it. Each
// test name carries the T-ID it exercises so the coverage register can surface
// the evidence.
//
// The harness isolates the pipeline-fingerprint baseline under a temp
// HOLONOVEL_STATE_DIR (REQ-314) so its runs never read or write the live
// `.holonovel-state/pipeline-fingerprints.json`; no tracked file is mutated.

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, rmSync, mkdtempSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const ROOT = join(import.meta.dirname!, "..", "..");
const SPEC_PATH = join(ROOT, "holonovel.md");
// Temp state dir passed to the spawned update-server (REQ-314 isolation).
const WORK_STATE_DIR = mkdtempSync(join(tmpdir(), "update-workflow-state-"));
// Temp data dir for the REQ-556 reconciliation tests (T649) — holds stale
// Novels, flat artifacts, and a stale package so the migration never touches
// the live state dir.
const RECONCILE_DIR = mkdtempSync(join(tmpdir(), "update-reconcile-data-"));

function runScript(script: string, args: string[], env: Record<string, string> = {}): { stdout: string; stderr: string; status: number } {
  const r = spawnSync("npx", ["tsx", join(ROOT, "scripts", script), ...args], {
    cwd: ROOT,
    encoding: "utf-8",
    timeout: 60000,
    env: { ...process.env, ...env },
  });
  return { stdout: r.stdout ?? "", stderr: r.stderr ?? "", status: r.status ?? -1 };
}

function sha256(p: string): string {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

function runUpdate(args: string[], env: Record<string, string> = {}): { stdout: string; stderr: string; status: number } {
  const r = spawnSync("npx", ["tsx", join(ROOT, "scripts", "update-server.ts"), ...args], {
    cwd: ROOT,
    encoding: "utf-8",
    timeout: 60000,
    env: { ...process.env, HOLONOVEL_STATE_DIR: WORK_STATE_DIR, ...env },
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

    // REQ-098 self-invocation contract: the update command is printed but not
    // executed unless HOLONOVEL_INVOKE_UPDATE=1 (unattended shell/CI only).
    const fakeDir = mkdtempSync(join(tmpdir(), "holonovel-fake-opencode-"));
    const fakeBin = join(fakeDir, "opencode");
    writeFileSync(fakeBin, `#!/bin/sh\necho "$@" > "$FAKE_OPENCODE_MARKER"\n`, { mode: 0o755 });
    const defaultMarker = join(fakeDir, "default-marker.txt");
    const execMarker = join(fakeDir, "exec-marker.txt");

    test("T84c/REQ-098: update command is printed, not executed, by default", () => {
      const r = runUpdate(["--server", "holonovel", "--spec-hash", otherHash, "--delta-class", "minor", "--scope-by-fingerprint"], {
        HOLONOVEL_INVOKE_UPDATE: "0",
        PATH: `${fakeDir}:${process.env.PATH}`,
        FAKE_OPENCODE_MARKER: defaultMarker,
      });
      if (r.status === 0) throw new Error(`expected non-zero exit for pending update: ${r.stdout}`);
      assertContains(r.stdout, "Invoking: opencode run");
      if (existsSync(defaultMarker)) throw new Error("update command executed without HOLONOVEL_INVOKE_UPDATE=1");
    });

    test("T84d/REQ-098: HOLONOVEL_INVOKE_UPDATE=1 executes the update command", () => {
      const r = runUpdate(["--server", "holonovel", "--spec-hash", otherHash, "--delta-class", "minor", "--scope-by-fingerprint"], {
        HOLONOVEL_INVOKE_UPDATE: "1",
        PATH: `${fakeDir}:${process.env.PATH}`,
        FAKE_OPENCODE_MARKER: execMarker,
      });
      if (r.status !== 0) throw new Error(`expected exit 0, got ${r.status}: ${r.stdout} ${r.stderr}`);
      if (!existsSync(execMarker)) throw new Error("update command was not executed with HOLONOVEL_INVOKE_UPDATE=1");
      const invoked = readFileSync(execMarker, "utf-8");
      assertContains(invoked, "--agent build");
    });
    rmSync(fakeDir, { recursive: true, force: true });

    // ── REQ-556 / T649 — user-data reconciliation ─────────────────────────
    // A deployed instance whose package and artifact fingerprints are stale.
    mkdirSync(join(RECONCILE_DIR, "novels"), { recursive: true });
    mkdirSync(join(RECONCILE_DIR, "rulesets", "stale"), { recursive: true });
    writeFileSync(join(RECONCILE_DIR, "novels", "n1.json"), JSON.stringify({ slug: "n1", data_format: "old", lore: { k: { text: "x", hat_scope: "player" } } }));
    writeFileSync(join(RECONCILE_DIR, "roster.json"), JSON.stringify({ hero: {}, __holonovel_meta: { data_format: "old" } }));
    writeFileSync(join(RECONCILE_DIR, "codex.json"), JSON.stringify({ c: {} }));
    writeFileSync(join(RECONCILE_DIR, "server-notes.json"), JSON.stringify({ n: 1, __holonovel_meta: { data_format: "old" } }));
    writeFileSync(join(RECONCILE_DIR, "rulesets", "stale", "manifest.json"), JSON.stringify({ slug: "stale", package_format: "old" }));

    const migrate = runScript("migrate-user-data.ts", ["--apply"], { TTRPG_DATA_DIR: RECONCILE_DIR });
    const dataFormat = (migrate.stdout.match(/Current data-format fingerprint: ([0-9a-f]+)/) ?? [])[1] ?? "";

    test("T649/REQ-556: reconciliation migrates every stale persisted artifact", () => {
      if (migrate.status !== 0) throw new Error(`migrate-user-data failed: ${migrate.stdout} ${migrate.stderr}`);
      if (!dataFormat) throw new Error("could not read the current data-format fingerprint");
      const novel = JSON.parse(readFileSync(join(RECONCILE_DIR, "novels", "n1.json"), "utf-8"));
      if (novel.data_format !== dataFormat) throw new Error("Novel not re-stamped to the current fingerprint");
      if (novel.lore?.k?.badge_scope !== "player") throw new Error("Novel field migration (REQ-065) not materialized on disk");
      for (const f of ["roster.json", "codex.json", "server-notes.json"]) {
        const d = JSON.parse(readFileSync(join(RECONCILE_DIR, f), "utf-8"));
        if (d.__holonovel_meta?.data_format !== dataFormat) throw new Error(`${f} not re-stamped to the current fingerprint`);
      }
    });

    test("T649/REQ-556: reconciliation is idempotent — no stale artifacts remain", () => {
      const dry = runScript("migrate-user-data.ts", [], { TTRPG_DATA_DIR: RECONCILE_DIR });
      if (dry.status !== 0) throw new Error(`dry run failed: ${dry.stdout} ${dry.stderr}`);
      assertContains(dry.stdout, "No stale artifacts");
    });

    test("T649/REQ-556: a stale package with no recorded source is reported, not omitted", () => {
      const rules = runScript("update-rulesets.ts", [], { TTRPG_DATA_DIR: RECONCILE_DIR });
      if (rules.status !== 0) throw new Error(`update-rulesets failed: ${rules.stdout} ${rules.stderr}`);
      assertContains(rules.stdout, "stale");
      assertContains(rules.stdout, "no registry entry");
    });

    // ── REQ-395c / T689 — unified Update entry point ─────────────────
    const emittedDir = join(RECONCILE_DIR, "rulesets", "emitted");
    mkdirSync(emittedDir, { recursive: true });
    writeFileSync(join(emittedDir, "manifest.json"), JSON.stringify({ slug: "emitted", package_format: "old" }, null, 2) + "\n");
    const emitterPath = join(RECONCILE_DIR, "fixture-emitter.mjs");
    writeFileSync(emitterPath, `#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const i = process.argv.indexOf("--out");
const out = i >= 0 ? process.argv[i + 1] : process.cwd();
const src = readFileSync(${JSON.stringify(join(ROOT, "holonovel", "src", "generated", "contract-fingerprints.ts"))}, "utf-8");
const m = src.match(/export const PACKAGE_FORMAT = "([0-9a-f]+)";/);
writeFileSync(join(out, "manifest.json"), JSON.stringify({ slug: "emitted", package_format: m[1] }, null, 2) + "\\n");
`);
    const registryPath = join(RECONCILE_DIR, "ruleset-registry.json");
    let seeded: any = {};
    try { seeded = JSON.parse(readFileSync(registryPath, "utf-8")); } catch { seeded = {}; }
    seeded.emitted = { source: RECONCILE_DIR, emitter: emitterPath, emitter_args: ["--out", "{dir}"], package_format: "old" };
    writeFileSync(registryPath, JSON.stringify(seeded, null, 2) + "\n");

    test("T689/REQ-395c: dry run plans a stale package and writes nothing", () => {
      const dry = runScript("update.ts", ["--packages-only"], { TTRPG_DATA_DIR: RECONCILE_DIR });
      if (dry.status !== 0) throw new Error(`update dry run failed: ${dry.stdout} ${dry.stderr}`);
      assertContains(dry.stdout, "emitted: planned");
      assertContains(dry.stdout, "no recorded emitter");
      const manifest = JSON.parse(readFileSync(join(emittedDir, "manifest.json"), "utf-8"));
      if (manifest.package_format !== "old") throw new Error("dry run mutated the package");
    });

    test("T689/REQ-395c: apply rebuilds through the recorded emitter and defers the unresolvable slug", () => {
      const run = runScript("update.ts", ["--packages-only", "--apply"], { TTRPG_DATA_DIR: RECONCILE_DIR });
      if (run.status !== 0) throw new Error(`update apply failed: ${run.stdout} ${run.stderr}`);
      assertContains(run.stdout, "emitted: updated");
      assertContains(run.stdout, "stale: deferred");
      const manifest = JSON.parse(readFileSync(join(emittedDir, "manifest.json"), "utf-8"));
      if (manifest.package_format === "old") throw new Error("package was not rebuilt");
      const registry = JSON.parse(readFileSync(registryPath, "utf-8"));
      if (registry.emitted.package_format === "old") throw new Error("registry was not advanced");
    });

    test("T689/REQ-395c: the data tier runs in the same invocation", () => {
      const run = runScript("update.ts", ["--data-only", "--apply"], { TTRPG_DATA_DIR: RECONCILE_DIR });
      if (run.status !== 0) throw new Error(`update data tier failed: ${run.stdout} ${run.stderr}`);
      assertContains(run.stdout, "data    persisted artifacts: updated");
    });

    // ── REQ-394 / T462 — --allow-pending requires a recorded override ─────
    // Re-seed the baseline so the delta is pending regardless of earlier tests.
    runUpdate(["--server", "holonovel", "--spec-hash", currentHash]);
    const decisionsDir = mkdtempSync(join(tmpdir(), "update-decisions-"));
    try {
      const decisionsPath = join(decisionsDir, "DECISIONS.md");
      writeFileSync(decisionsPath, "# DECISIONS\n\nNo override recorded.\n");

      test("T462/REQ-394: --allow-pending without a recorded override is refused", () => {
        const r = runUpdate(
          ["--server", "holonovel", "--spec-hash", otherHash, "--delta-class", "minor", "--scope-by-fingerprint", "--allow-pending"],
          { HOLONOVEL_DECISIONS_DIR: decisionsDir }
        );
        if (r.status === 0) throw new Error(`expected refusal, got exit 0: ${r.stdout}`);
        assertContains(r.stderr, "requires a recorded operator override");
      });

      const today = new Date();
      const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      writeFileSync(decisionsPath, `# DECISIONS\n\n- **Pending-update override:** holonovel ${date} — scheduled update\n`);

      test("T462/REQ-394: --allow-pending accepts a dated recorded override", () => {
        const r = runUpdate(
          ["--server", "holonovel", "--spec-hash", otherHash, "--delta-class", "minor", "--scope-by-fingerprint", "--allow-pending"],
          { HOLONOVEL_DECISIONS_DIR: decisionsDir }
        );
        if (r.status !== 0) throw new Error(`expected exit 0, got ${r.status}: ${r.stdout} ${r.stderr}`);
        assertContains(r.stdout, "overridden with --allow-pending");
      });
    } finally {
      rmSync(decisionsDir, { recursive: true, force: true });
    }
  } finally {
    // Drop the isolated temp baselines; the live .holonovel-state was never touched.
    rmSync(WORK_STATE_DIR, { recursive: true, force: true });
    rmSync(RECONCILE_DIR, { recursive: true, force: true });
  }

  harnessComplete();
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
