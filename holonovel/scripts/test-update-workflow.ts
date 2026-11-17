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

import { spawnSync, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync, mkdtempSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { renderFingerprintDelta, type FingerprintDelta } from "../../scripts/lib/spec-update.js";
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

// Isolated baseline + synthetic server tree for the REQ-394a evidence gate.
// computeFingerprints reads only these files, so a two-line tree is enough to
// produce real, changing component hashes without touching the live server.
const DELTA_SERVER = mkdtempSync(join(tmpdir(), "update-delta-server-"));
const DELTA_STATE_DIR = mkdtempSync(join(tmpdir(), "update-delta-state-"));
mkdirSync(join(DELTA_SERVER, "src", "generated"), { recursive: true });
writeFileSync(join(DELTA_SERVER, "package.json"), JSON.stringify({ name: "fixture", version: "0.0.0" }) + "\n");
writeFileSync(join(DELTA_SERVER, "tsconfig.json"), "{}\n");
writeFileSync(join(DELTA_SERVER, "package-lock.json"), "{}\n");
writeFileSync(join(DELTA_SERVER, "src", "index.ts"), "export const version = 1;\n");
writeFileSync(join(DELTA_SERVER, "src", "state.ts"), "export const state = {};\n");
writeFileSync(join(DELTA_SERVER, "src", "generated", "fp.ts"), "export const fp = 1;\n");
// REQ-313b — the surfaces component reads the generated surface names, so the
// fixture must carry them or the component reports "absent".
writeFileSync(
  join(DELTA_SERVER, "tool-definitions.json"),
  JSON.stringify({ schema_version: 4, surface_names: { tools: ["manage_world", "manage_novel"], resources: ["world://kinds"], prompts: ["intro"] } }) + "\n"
);

function runDelta(args: string[], env: Record<string, string> = {}): { stdout: string; stderr: string; status: number } {
  const r = spawnSync("npx", ["tsx", join(ROOT, "scripts", "update-server.ts"), ...args, "--server-dir", DELTA_SERVER], {
    cwd: ROOT,
    encoding: "utf-8",
    timeout: 60000,
    env: { ...process.env, HOLONOVEL_STATE_DIR: DELTA_STATE_DIR, ...env },
  });
  return { stdout: r.stdout ?? "", stderr: r.stderr ?? "", status: r.status ?? -1 };
}

function storedSpecHash(): string | undefined {
  try {
    return JSON.parse(readFileSync(join(DELTA_STATE_DIR, "pipeline-fingerprints.json"), "utf-8")).fixture?.spec_hash;
  } catch {
    return undefined;
  }
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
const files = {
  "manifest.json": { slug: "emitted", name: "Emitted", host_version: "0.0.0", package_format: m[1], content_hash: "emitted", built_at: "2026-01-01T00:00:00.000Z", counts: {} },
  "index.json": [], "model.json": {}, "tools.json": [], "resources.json": [], "prompts.json": [],
};
for (const [f, o] of Object.entries(files)) writeFileSync(join(out, f), JSON.stringify(o, null, 2) + "\\n");
`);
    const registryPath = join(RECONCILE_DIR, "ruleset-registry.json");
    let seeded: any = {};
    try { seeded = JSON.parse(readFileSync(registryPath, "utf-8")); } catch { seeded = {}; }
    seeded.emitted = { source: RECONCILE_DIR, emitter: emitterPath, emitter_args: ["--out", "{dir}"], package_format: "old" };
    writeFileSync(registryPath, JSON.stringify(seeded, null, 2) + "\n");

    test("T689/REQ-395c: dry run plans a stale package and writes nothing", () => {
      const dry = runScript("update.ts", ["--packages-only"], { TTRPG_DATA_DIR: RECONCILE_DIR, HOLONOVEL_TRUSTED_EMITTER_ROOT: RECONCILE_DIR });
      if (dry.status !== 0) throw new Error(`update dry run failed: ${dry.stdout} ${dry.stderr}`);
      assertContains(dry.stdout, "emitted: planned");
      assertContains(dry.stdout, "no recorded emitter");
      const manifest = JSON.parse(readFileSync(join(emittedDir, "manifest.json"), "utf-8"));
      if (manifest.package_format !== "old") throw new Error("dry run mutated the package");
    });

    test("T689/REQ-395c: apply rebuilds through the recorded emitter and defers the unresolvable slug", () => {
      const run = runScript("update.ts", ["--packages-only", "--apply"], { TTRPG_DATA_DIR: RECONCILE_DIR, HOLONOVEL_TRUSTED_EMITTER_ROOT: RECONCILE_DIR });
      if (run.status !== 0) throw new Error(`update apply failed: ${run.stdout} ${run.stderr}`);
      assertContains(run.stdout, "emitted: updated");
      assertContains(run.stdout, "stale: deferred");
      const manifest = JSON.parse(readFileSync(join(emittedDir, "manifest.json"), "utf-8"));
      if (manifest.package_format === "old") throw new Error("package was not rebuilt");
      const registry = JSON.parse(readFileSync(registryPath, "utf-8"));
      if (registry.emitted.package_format === "old") throw new Error("registry was not advanced");
    });

    // REQ-563 — a gate-defective emitter output is refused before the swap.
    const defectDir = join(RECONCILE_DIR, "rulesets", "defectpkg");
    mkdirSync(defectDir, { recursive: true });
    writeFileSync(join(defectDir, "manifest.json"), JSON.stringify({ slug: "defectpkg", package_format: "old" }, null, 2) + "\n");
    const defectEmitter = join(RECONCILE_DIR, "defect-emitter.mjs");
    writeFileSync(defectEmitter, `#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const i = process.argv.indexOf("--out");
const out = i >= 0 ? process.argv[i + 1] : process.cwd();
const src = readFileSync(${JSON.stringify(join(ROOT, "holonovel", "src", "generated", "contract-fingerprints.ts"))}, "utf-8");
const m = src.match(/export const PACKAGE_FORMAT = "([0-9a-f]+)";/);
const files = {
  "manifest.json": { slug: "defectpkg", name: "Defect", host_version: "0.0.0", package_format: m[1], content_hash: "defect", built_at: "2026-01-01T00:00:00.000Z", counts: {} },
  "index.json": [], "model.json": {},
  "tools.json": [{ name: "bad_tool", title: "Bad Tool", kind: "lookup", inputSchema: { type: "object", properties: {} } }],
  "resources.json": [], "prompts.json": [],
};
for (const [f, o] of Object.entries(files)) writeFileSync(join(out, f), JSON.stringify(o, null, 2) + "\\n");
`);
    const seededAgain = JSON.parse(readFileSync(registryPath, "utf-8"));
    seededAgain.defectpkg = { source: RECONCILE_DIR, emitter: defectEmitter, emitter_args: ["--out", "{dir}"], package_format: "old" };
    writeFileSync(registryPath, JSON.stringify(seededAgain, null, 2) + "\n");

    test("T689/REQ-395c: a gate-defective rebuild is deferred and leaves the installed package untouched", () => {
      const before = readFileSync(join(defectDir, "manifest.json"), "utf-8");
      const run = runScript("update.ts", ["--packages-only", "--apply"], { TTRPG_DATA_DIR: RECONCILE_DIR, HOLONOVEL_TRUSTED_EMITTER_ROOT: RECONCILE_DIR });
      if (run.status !== 0) throw new Error(`update apply failed: ${run.stdout} ${run.stderr}`);
      assertContains(run.stdout, "defectpkg: deferred");
      assertContains(run.stdout, "bad_tool");
      const after = readFileSync(join(defectDir, "manifest.json"), "utf-8");
      if (after !== before) throw new Error("gate refusal mutated the installed package");
      const registry = JSON.parse(readFileSync(registryPath, "utf-8"));
      if (registry.defectpkg.package_format !== "old") throw new Error("registry advanced despite a gate defect");
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

    // ── REQ-394 / T462 — delta classification has no working-copy fallback ─
    const specRoot = (hash: string | null): string => {
      const dir = mkdtempSync(join(tmpdir(), "spec-delta-root-"));
      writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "fixture", version: "0.0.0" }));
      writeFileSync(join(dir, "holonovel.md"), "# Fixture\n\n**REQ-999 — Fixture.** Body.\n\n*Check:* fixture.\n");
      mkdirSync(join(dir, "holonovel"), { recursive: true });
      writeFileSync(
        join(dir, "holonovel", "DECISIONS.md"),
        hash ? `# Decisions\n\n**Spec hash:** ${hash}\n` : "# Decisions\n",
      );
      return dir;
    };

    const noBaselineRoot = specRoot(null);
    try {
      // A hand-edited working copy that matches the assembled spec must not
      // become the classification basis.
      const current = sha256(join(noBaselineRoot, "holonovel.md"));
      writeFileSync(join(noBaselineRoot, "holonovel", "DECISIONS.md"), `# Decisions\n\n**Spec hash:** ${current}\n`);
      test("T462/REQ-394: no published baseline fails closed despite a working-copy hash", () => {
        const r = runScript("spec-delta.ts", ["--root", noBaselineRoot, "--server", "holonovel"]);
        if (r.status !== 1) throw new Error(`expected exit 1, got ${r.status}: ${r.stdout} ${r.stderr}`);
        if (!r.stderr.includes("baseline-missing")) throw new Error(`missing baseline notice: ${r.stderr}`);
        const parsed = JSON.parse(r.stdout.slice(r.stdout.indexOf("{"), r.stdout.lastIndexOf("}") + 1));
        if (parsed.baseline_missing !== true) throw new Error("report did not set baseline_missing");
        if (parsed.stored_hash !== null) throw new Error("report used a working-copy hash");
        if (parsed.classification !== "major") throw new Error(`conservative class expected, got ${parsed.classification}`);
      });
    } finally {
      rmSync(noBaselineRoot, { recursive: true, force: true });
    }

    const publishedRoot = specRoot(null);
    try {
      execFileSync("git", ["init", "-q", "-b", "main"], { cwd: publishedRoot });
      execFileSync("git", ["config", "user.email", "fixture@example.invalid"], { cwd: publishedRoot });
      execFileSync("git", ["config", "user.name", "Fixture"], { cwd: publishedRoot });
      const baseHash = sha256(join(publishedRoot, "holonovel.md"));
      writeFileSync(join(publishedRoot, "holonovel", "DECISIONS.md"), `# Decisions\n\n**Spec hash:** ${baseHash}\n`);
      execFileSync("git", ["add", "-A"], { cwd: publishedRoot });
      execFileSync("git", ["commit", "-qm", "fixture"], { cwd: publishedRoot });
      writeFileSync(join(publishedRoot, "holonovel.md"), "# Fixture\n\n**REQ-999 — Fixture.** Changed body.\n\n*Check:* fixture.\n");
      test("T462/REQ-394: a resolvable published baseline classifies normally", () => {
        const r = runScript("spec-delta.ts", ["--root", publishedRoot, "--server", "holonovel"]);
        const parsed = JSON.parse(r.stdout.slice(r.stdout.indexOf("{"), r.stdout.lastIndexOf("}") + 1));
        if (parsed.baseline_missing !== false) throw new Error("baseline_missing should be false");
        if (parsed.stored_hash !== baseHash) throw new Error("stored hash did not come from the published ref");
        if (!["patch", "editorial", "minor", "major"].includes(parsed.classification)) {
          throw new Error(`unexpected classification ${parsed.classification}`);
        }
      });
    } finally {
      rmSync(publishedRoot, { recursive: true, force: true });
    }

    // ── REQ-394a / T84e — publication update evidence ──────────────────
    // Seed a baseline for the synthetic tree, then advance its fingerprints.
    // The evidence contract is a reconciliation record: one disposition per
    // changed REQ, derived from the committed coverage register where it
    // exists and from an operator table where it does not (T18b control).
    const deltaDecisionsDir = mkdtempSync(join(tmpdir(), "update-delta-decisions-"));
    const deltaDecisionsPath = join(deltaDecisionsDir, "DECISIONS.md");
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const FIXTURE_REGISTER = join(deltaDecisionsDir, "req-coverage.md");
    const OPERATOR_TABLE = join(deltaDecisionsDir, "dispositions.md");
    writeFileSync(
      FIXTURE_REGISTER,
      [
        "# REQ Coverage Register",
        "",
        "| REQ | Title | Section | Bucket | Exercised tests | §5.12 disposition |",
        "|-----|-------|---------|--------|-----------------|-------------------|",
        "| REQ-099 | Synthetic evidenced | 5.1 Output | C | T1, T2 | — |",
        "| REQ-098 | Synthetic intended gap | 5.2 Extraction | E | — | — |",
        "| REQ-101 | Synthetic needs review | 5.3 Loop | B | — | — |",
        "",
      ].join("\n"),
    );
    writeFileSync(
      OPERATOR_TABLE,
      [
        "| REQ | Disposition | Evidence |",
        "|---|---|---|",
        "| REQ-101 | deferred | operator: scheduled in the next increment |",
        "",
      ].join("\n"),
    );
    const noDeferral = (): void => writeFileSync(deltaDecisionsPath, "# DECISIONS\n\nNo deferral recorded.\n");
    const deltaReportFor = (ids: { added?: string[]; removed?: string[]; modified?: string[] }): string => {
      const path = join(deltaDecisionsDir, `delta-${Math.random().toString(36).slice(2)}.json`);
      writeFileSync(
        path,
        JSON.stringify({ requirements_changed: { added: [], removed: [], modified: [], ...ids } }, null, 2) + "\n",
      );
      return path;
    };
    try {
      noDeferral();
      const seed = runDelta(["--server", "fixture", "--spec-hash", currentHash]);
      if (seed.status !== 0) throw new Error(`delta baseline seed failed: ${seed.stdout} ${seed.stderr}`);

      // source + surfaces change (two components) → scoping "partial".
      writeFileSync(join(DELTA_SERVER, "src", "index.ts"), "export const version = 2;\n");
      // Each run presents a different spec hash so the script takes the delta
      // path rather than the spec-unchanged branch.
      const specHashN = (n: number): string => String(n).repeat(64);
      const evidenceArgs = (hash: string): string[] => [
        "--server", "fixture", "--spec-hash", hash, "--delta-class", "minor",
        "--scope-by-fingerprint", "--coverage-register", FIXTURE_REGISTER,
      ];
      const h2 = specHashN(2);
      const h3 = specHashN(3);
      const h4 = specHashN(4);
      const h5 = specHashN(5);

      test("T84e/REQ-394a: advanced fingerprints without evidence block publication", () => {
        const args = evidenceArgs(h2);
        const r = runDelta(args, { HOLONOVEL_DECISIONS_DIR: deltaDecisionsDir });
        if (r.status !== 1) throw new Error(`expected exit 1, got ${r.status}: ${r.stdout} ${r.stderr}`);
        assertContains(r.stderr, "UPDATE REQUIRED");
        assertContains(r.stderr, "scoping: scoped");
        assertContains(r.stderr, "Update-deferred");
        if (storedSpecHash() !== currentHash) throw new Error("stored baseline advanced despite the block");
        const again = runDelta(args, { HOLONOVEL_DECISIONS_DIR: deltaDecisionsDir });
        if (again.status !== 1) throw new Error(`blocked run did not leave the delta detected: ${again.stdout}`);
      });

      test("T18b/REQ-394a: check mode derives nothing and writes no baseline", () => {
        const r = runDelta([...evidenceArgs(h2), "--check"], { HOLONOVEL_DECISIONS_DIR: deltaDecisionsDir });
        if (r.status !== 0) throw new Error(`expected exit 0 in check mode, got ${r.status}: ${r.stdout} ${r.stderr}`);
        if (storedSpecHash() !== currentHash) throw new Error("check mode advanced the stored baseline");
      });

      test("T18b/REQ-394a: a changed REQ absent from the register is named and blocks", () => {
        const report = deltaReportFor({ modified: ["100a"] });
        const r = runDelta([...evidenceArgs(h2), "--delta-report", report], { HOLONOVEL_DECISIONS_DIR: deltaDecisionsDir });
        if (r.status !== 1) throw new Error(`expected exit 1, got ${r.status}: ${r.stdout} ${r.stderr}`);
        assertContains(r.stderr, "REQ-100");
        assertContains(r.stderr, "absent from");
        assertContains(r.stderr, "--write-register");
        if (storedSpecHash() !== currentHash) throw new Error("an incomplete record advanced the stored baseline");
        const record = JSON.parse(readFileSync(join(DELTA_STATE_DIR, "fingerprint-deltas.json"), "utf-8")).fixture;
        if (!Array.isArray(record.dispositions)) throw new Error("the incomplete record did not carry a dispositions array");
      });

      test("T18b/REQ-394a: a bucket-B REQ requires an operator disposition", () => {
        const report = deltaReportFor({ added: ["101"] });
        const blocked = runDelta([...evidenceArgs(h2), "--delta-report", report], { HOLONOVEL_DECISIONS_DIR: deltaDecisionsDir });
        if (blocked.status !== 1) throw new Error(`expected exit 1, got ${blocked.status}: ${blocked.stdout} ${blocked.stderr}`);
        assertContains(blocked.stderr, "bucket B");
        if (storedSpecHash() !== currentHash) throw new Error("a missing operator disposition advanced the stored baseline");
      });

      test("T18b/REQ-394a: a complete record reconciles and records one disposition per changed REQ", () => {
        const report = deltaReportFor({ added: ["099a"], modified: ["101"] });
        const r = runDelta([...evidenceArgs(h2), "--delta-report", report, "--dispositions", OPERATOR_TABLE], { HOLONOVEL_DECISIONS_DIR: deltaDecisionsDir });
        if (r.status !== 0) throw new Error(`expected exit 0, got ${r.status}: ${r.stdout} ${r.stderr}`);
        if (storedSpecHash() !== h2) throw new Error("a complete record did not advance the stored baseline");
        const record = JSON.parse(readFileSync(join(DELTA_STATE_DIR, "fingerprint-deltas.json"), "utf-8")).fixture;
        const rows = record.dispositions as Array<{ req: string; disposition: string }>;
        const byReq = new Map(rows.map((row) => [row.req, row.disposition]));
        if (byReq.get("REQ-099a") !== "implemented") throw new Error(`REQ-099a should derive implemented, got ${byReq.get("REQ-099a")}`);
        if (byReq.get("REQ-101") !== "deferred") throw new Error(`REQ-101 should take the operator row, got ${byReq.get("REQ-101")}`);
        // REQ-313b: the surfaces component hashes registered names, not source
        // bytes, so the fixture's src/state.ts mutation moves one component.
        if (record.scoping !== "scoped") throw new Error(`unexpected scoping ${record.scoping}`);
      });

      test("T18b/REQ-394a: a removed REQ is dispositioned waived, not dropped", () => {
        writeFileSync(join(DELTA_SERVER, "src", "index.ts"), "export const version = 3;\n");
        const report = deltaReportFor({ removed: ["097"] });
        const r = runDelta([...evidenceArgs(h3), "--delta-report", report], { HOLONOVEL_DECISIONS_DIR: deltaDecisionsDir });
        if (r.status !== 0) throw new Error(`expected exit 0, got ${r.status}: ${r.stdout} ${r.stderr}`);
        const record = JSON.parse(readFileSync(join(DELTA_STATE_DIR, "fingerprint-deltas.json"), "utf-8")).fixture;
        const row = (record.dispositions as Array<{ req: string; disposition: string; evidence: string }>).find((d) => d.req === "REQ-097");
        if (!row || row.disposition !== "waived") throw new Error("a removed REQ was not dispositioned waived");
      });

      writeFileSync(deltaDecisionsPath, `# DECISIONS\n\n- **Update-deferred:** fixture ${date} — synthetic fixture rebuild\n`);

      test("T84e/REQ-394a: a dated deferral publishes and is recorded in the delta record", () => {
        writeFileSync(join(DELTA_SERVER, "src", "state.ts"), "export const state = { advanced: true };\n");
        const r = runDelta(evidenceArgs(h4), { HOLONOVEL_DECISIONS_DIR: deltaDecisionsDir });
        if (r.status !== 0) throw new Error(`expected exit 0, got ${r.status}: ${r.stdout} ${r.stderr}`);
        assertContains(r.stdout, "deferred");
        if (storedSpecHash() !== h4) throw new Error("stored baseline was not advanced after the recorded deferral");
        const record = JSON.parse(readFileSync(join(DELTA_STATE_DIR, "fingerprint-deltas.json"), "utf-8")).fixture;
        if (record.deferred !== true) throw new Error("delta record did not mark the reconciliation deferred");
        if (!Array.isArray(record.dispositions) || record.dispositions.length !== 0) throw new Error("a deferral should carry no derived rows");
        // REQ-313b: surfaces no longer tracks source bytes (see above).
        if (record.scoping !== "scoped") throw new Error(`unexpected scoping ${record.scoping}`);
        for (const key of ["source", "config", "lockfile", "extraction", "surfaces"]) {
          // config concatenates two file hashes, so it is 128 hex chars; the
          // other four are single 64-char SHA-256 digests.
          if (typeof record.current?.[key] !== "string" || !/^[0-9a-f]{64,128}$/.test(record.current[key])) {
            throw new Error(`delta record missing the component hash for ${key}`);
          }
        }
        if (!record.prior?.source) throw new Error("delta record missing the prior component hashes");
      });

      test("T84e/REQ-394a: a zero-change publication records a none delta", () => {
        // No fingerprint change this time: a Minor delta with a dated pending
        // override takes the pending path and records the "none" delta.
        writeFileSync(deltaDecisionsPath, `# DECISIONS\n\n- **Pending-update override:** fixture ${date} — builder-side delta\n`);
        const r = runDelta(
          ["--server", "fixture", "--spec-hash", h5, "--delta-class", "minor", "--scope-by-fingerprint", "--allow-pending"],
          { HOLONOVEL_DECISIONS_DIR: deltaDecisionsDir }
        );
        if (r.status !== 0) throw new Error(`expected exit 0, got ${r.status}: ${r.stdout} ${r.stderr}`);
        assertContains(r.stdout, "overridden with --allow-pending");
        const record = JSON.parse(readFileSync(join(DELTA_STATE_DIR, "fingerprint-deltas.json"), "utf-8")).fixture;
        if (record.changed_count !== 0 || record.scoping !== "none") throw new Error(`expected a none delta, got ${record.scoping}/${record.changed_count}`);
        if (record.unchanged?.length !== 5) throw new Error("none delta did not list all five unchanged components");
        if (record.advice !== "none") throw new Error(`a zero-change record must carry the "none" advice, got ${record.advice}`);
      });

      // ── REQ-313/REQ-314 (T497) — fingerprint component coverage ──────────
      // A ruleset-free synthetic server: no src/generated, so the extraction
      // component records the sentinel (REQ-313c/REQ-313d).
      const FP_SERVER = mkdtempSync(join(tmpdir(), "update-fp-server-"));
      const FP_STATE_DIR = mkdtempSync(join(tmpdir(), "update-fp-state-"));
      try {
        const writeServer = (): void => {
          mkdirSync(join(FP_SERVER, "src"), { recursive: true });
          writeFileSync(join(FP_SERVER, "package.json"), JSON.stringify({ name: "fixture", version: "0.0.0" }) + "\n");
          writeFileSync(join(FP_SERVER, "tsconfig.json"), "{}\n");
          writeFileSync(join(FP_SERVER, "package-lock.json"), "{}\n");
          writeFileSync(join(FP_SERVER, "src", "index.ts"), "export const version = 1;\n");
          writeFileSync(join(FP_SERVER, "src", "state.ts"), "export const state = {};\n");
        };
        const writeSurfaces = (tools: string[]): void => {
          writeFileSync(
            join(FP_SERVER, "tool-definitions.json"),
            JSON.stringify({ schema_version: 4, surface_names: { tools, resources: ["world://kinds"], prompts: ["intro"] } }) + "\n"
          );
        };
        const runFp = (hash: string, extra: string[] = []) => {
          const r = spawnSync("npx", ["tsx", join(ROOT, "scripts", "update-server.ts"), "--server", "fixture", "--server-dir", FP_SERVER, "--spec-hash", hash, ...extra], {
            cwd: ROOT, encoding: "utf-8", timeout: 60000,
            env: { ...process.env, HOLONOVEL_STATE_DIR: FP_STATE_DIR },
          });
          return { stdout: r.stdout ?? "", stderr: r.stderr ?? "", status: r.status ?? -1 };
        };
        const readFp = (): FingerprintDelta =>
          JSON.parse(readFileSync(join(FP_STATE_DIR, "fingerprint-deltas.json"), "utf-8")).fixture;
        const SCOPED = ["--scope-by-fingerprint", "--delta-class", "patch"];
        const fp1 = "1".repeat(64);
        const fp2 = "2".repeat(64);
        const fp3 = "3".repeat(64);
        const fp4 = "4".repeat(64);
        const fp5 = "5".repeat(64);
        const fp7 = "7".repeat(64);

        writeServer();
        writeSurfaces(["manage_world", "manage_novel"]);
        const seedRun = runFp(fp1);
        if (seedRun.status !== 0) throw new Error(`cold seed failed: ${seedRun.stdout} ${seedRun.stderr}`);
        const seedRecord = readFp();

        test("T497/REQ-313a: the record renders the five component hashes beside the build fingerprint", () => {
          const rendered = renderFingerprintDelta(seedRecord);
          if (!rendered.includes("| Component | Prior | Current |")) throw new Error("rendered entry carries no component-hash table");
          for (const component of ["source", "config", "lockfile", "extraction", "surfaces"]) {
            if (!rendered.includes(`| ${component} |`)) throw new Error(`rendered entry omits the ${component} row`);
          }
          if (!/\| source \| none \| `[0-9a-f]{16}…` \|/.test(rendered)) {
            throw new Error(`a cold seed must render an empty prior column, got: ${rendered.slice(0, 400)}`);
          }
        });

        test("T497/REQ-313c+REQ-313d: a ruleset-free build records the extraction sentinel", () => {
          if (seedRecord.current.extraction !== "sentinel") {
            throw new Error(`expected the sentinel, got ${seedRecord.current.extraction}`);
          }
          const rendered = renderFingerprintDelta(seedRecord);
          if (!/\| extraction \| none \| sentinel \|/.test(rendered)) {
            throw new Error(`the rendered record does not name the sentinel: ${rendered.slice(0, 400)}`);
          }
        });

        test("T497/REQ-313c: the implementation fingerprints never gate startup", () => {
          const srcDir = join(ROOT, "holonovel", "src");
          const offenders: string[] = [];
          for (const entry of readdirSync(srcDir, { recursive: true, withFileTypes: true })) {
            if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
            const path = join((entry as any).parentPath ?? (entry as any).path, entry.name);
            const text = readFileSync(path, "utf-8");
            if (/pipeline-fingerprints|FINGERPRINT_FILE/.test(text)) offenders.push(path);
          }
          if (offenders.length > 0) throw new Error(`startup reads the fingerprint baseline: ${offenders.join(", ")}`);
        });

        test("T497/REQ-314a: a source-only change scopes to source and reuses the remaining components", () => {
          writeFileSync(join(FP_SERVER, "src", "index.ts"), "export const version = 2;\n");
          const r = runFp(fp2, SCOPED);
          if (r.status !== 0) throw new Error(`source-only update failed: ${r.stdout} ${r.stderr}`);
          const record = readFp();
          if (record.changed.join(",") !== "source") throw new Error(`expected only source to change, got ${record.changed.join(",")}`);
          if (record.scoping !== "scoped") throw new Error(`expected the scoped decision, got ${record.scoping}`);
          if (record.reused.join(",") !== "config,lockfile,extraction,surfaces") {
            throw new Error(`unchanged components were not reused: ${record.reused.join(",")}`);
          }
          assertContains(record.advice ?? "", "typecheck");
        });

        test("T497/REQ-314b: configuration and lockfile changes require reinstall and typecheck only", () => {
          writeFileSync(join(FP_SERVER, "tsconfig.json"), '{"compilerOptions":{}}\n');
          writeFileSync(join(FP_SERVER, "package-lock.json"), '{"lockfileVersion":3}\n');
          const r = runFp(fp3, SCOPED);
          if (r.status !== 0) throw new Error(`config update failed: ${r.stdout} ${r.stderr}`);
          const advice = readFp().advice ?? "";
          assertContains(advice, "dependency reinstall and typecheck only");
          const occurrences = advice.split("dependency reinstall and typecheck only").length - 1;
          if (occurrences !== 1) throw new Error(`config+lockfile advice must be stated once, got ${occurrences}: ${advice}`);
          if (/Pattern Buffer/.test(advice)) throw new Error(`config-only advice must not demand Pattern Buffer work: ${advice}`);
        });

        test("T497/REQ-314b: an extraction change requires re-indexing only, reusing prior extraction", () => {
          // A non-.ts file under src/generated moves the extraction component
          // alone: the source component hashes src/**/*.ts only (REQ-313b).
          mkdirSync(join(FP_SERVER, "src", "generated"), { recursive: true });
          writeFileSync(join(FP_SERVER, "src", "generated", "extraction.json"), '{"index":1}\n');
          const r = runFp(fp4, SCOPED);
          if (r.status !== 0) throw new Error(`extraction update failed: ${r.stdout} ${r.stderr}`);
          const record = readFp();
          if (record.changed.join(",") !== "extraction") throw new Error(`expected only extraction to change, got ${record.changed.join(",")}`);
          const advice = record.advice ?? "";
          assertContains(advice, "re-index generation data only");
          assertContains(advice, "reusing prior extraction");
          if (/Pattern Buffer|typecheck/i.test(advice)) throw new Error(`extraction-only advice over-scopes: ${advice}`);
        });

        test("T497/REQ-314b: a registered-surface change requires Pattern Buffer work for the changed names", () => {
          writeSurfaces(["manage_world", "manage_novel", "manage_codex"]);
          const r = runFp(fp5, SCOPED);
          if (r.status !== 0) throw new Error(`surface update failed: ${r.stdout} ${r.stderr}`);
          const record = readFp();
          if (record.changed.join(",") !== "surfaces") throw new Error(`expected only surfaces to change, got ${record.changed.join(",")}`);
          assertContains(record.advice ?? "", "Pattern Buffer sub-workflows for the changed tools, resources, or prompts");
        });

        test("T497/REQ-313c: every component hash is updated when a build advances the baseline", () => {
          writeFileSync(join(FP_SERVER, "src", "state.ts"), "export const state = { advanced: true };\n");
          const r = runFp(fp5);
          if (r.status !== 0) throw new Error(`baseline refresh failed: ${r.stdout} ${r.stderr}`);
          assertContains(r.stdout, "baseline refreshed");
          const storedText = readFileSync(join(FP_STATE_DIR, "pipeline-fingerprints.json"), "utf-8");
          const stored = JSON.parse(storedText).fixture.fingerprints;
          if (!/^[0-9a-f]{64}$/.test(stored.source)) throw new Error("the refreshed baseline did not store the advanced source hash");
          if (stored.extraction === "sentinel") throw new Error("the refreshed baseline kept the sentinel after generated data appeared");
        });

        test("T497/REQ-314c+REQ-314d: a cold checkout seeds, and four of five changes force a full rebuild", () => {
          if (seedRecord.scoping !== "seed" || seedRecord.prior !== null) {
            throw new Error(`a cold checkout must seed with no prior, got ${seedRecord.scoping}/${JSON.stringify(seedRecord.prior)}`);
          }
          writeFileSync(join(FP_SERVER, "src", "index.ts"), "export const version = 3;\n");
          writeFileSync(join(FP_SERVER, "tsconfig.json"), '{"compilerOptions":{"strict":true}}\n');
          writeFileSync(join(FP_SERVER, "package-lock.json"), '{"lockfileVersion":2}\n');
          writeSurfaces(["manage_world"]);
          const r = runFp(fp7, SCOPED);
          if (r.status !== 0) throw new Error(`four-of-five update failed: ${r.stdout} ${r.stderr}`);
          const record = readFp();
          if (record.changed_count !== 4) throw new Error(`expected four changed components, got ${record.changed_count} (${record.changed.join(",")})`);
          if (record.scoping !== "full") throw new Error(`four of five must run the full workflow, got ${record.scoping}`);
          assertContains(r.stdout, "full reconciliation scope");
        });
      } finally {
        rmSync(FP_SERVER, { recursive: true, force: true });
        rmSync(FP_STATE_DIR, { recursive: true, force: true });
      }
    } finally {
      rmSync(deltaDecisionsDir, { recursive: true, force: true });
      rmSync(DELTA_SERVER, { recursive: true, force: true });
      rmSync(DELTA_STATE_DIR, { recursive: true, force: true });
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
