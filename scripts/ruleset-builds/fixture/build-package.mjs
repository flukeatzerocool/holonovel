#!/usr/bin/env node
/**
 * build-package.mjs — covered reference-package emitter (REQ-563). [build tool]
 *
 * Emits the one non-commercial reference package authored in this repository
 * (`holonovel/testdata/rulesets/fixture`) from its committed durable parts.
 * The emitter is deterministic: the build timestamp is pinned, `host_version`
 * comes from package.json, and `package_format` comes from the generated
 * contract fingerprints, so a fresh clone emits the six files byte-identically
 * without an installed package (REQ-561, REQ-563).
 *
 * The package gates (REQ-430, REQ-559, REQ-560) run before any finalize, so a
 * defective package is refused naming the defect.
 *
 * Usage:
 *   node scripts/ruleset-builds/fixture/build-package.mjs [--out <dir>]
 *        [--baseline <dir>] [--dry-run] [--json] [--no-backup] [--check]
 *
 *   --check   Emit into a temp dir and compare all six files with the committed
 *             package; write nothing and exit 1 on any difference.
 *
 * Exit codes: 0 = emitted (or check passed), 1 = gate refusal or drift,
 * 2 = fatal (unreadable baseline, unknown flag).
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { emitFromBaseline, PACKAGE_FILES } from "../../lib/ruleset-build-kit.mjs";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..");
const SLUG = "fixture";
const BASELINE_DIR = join(REPO_ROOT, "holonovel", "testdata", "rulesets", "fixture");
// REQ-561 — a fixed build timestamp makes re-emission byte-identical. The
// release/version-bump step re-emits the package, so this value is provenance,
// not a wall-clock stamp.
const BUILT_AT = "2026-11-10T00:00:00.000Z";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(`usage: node scripts/ruleset-builds/${SLUG}/build-package.mjs [--out <dir>] [--baseline <dir>] [--dry-run] [--json] [--no-backup] [--check]`);
  console.log("  --check  Emit to a temp dir and compare the six files with the committed package.");
  process.exit(0);
}

const check = argv.includes("--check");
const passthrough = argv.filter((a) => a !== "--check");

function emit(args) {
  process.env.HOLONOVEL_BUILD_TIMESTAMP ??= BUILT_AT;
  return emitFromBaseline({
    slug: SLUG,
    name: "Holonovel Character-Creation Fixture",
    repoRoot: REPO_ROOT,
    scriptDir: import.meta.dirname,
    argv: args,
    defaultBaselineDir: BASELINE_DIR,
  });
}

if (!check) {
  try {
    process.exit(emit(passthrough));
  } catch (e) {
    console.error(`build-package (${SLUG}): ${e.message}`);
    process.exit(2);
  }
}

// ── --check: freshness comparison (REQ-563) ────────────────────────────────
const scratch = mkdtempSync(join(tmpdir(), `holonovel-fixture-check-`));
let status = 0;
try {
  const rc = emit([...passthrough, "--out", scratch, "--no-backup"]);
  if (rc !== 0) {
    console.error("check-fixture-emitter: emission failed, cannot compare");
    status = 1;
  } else {
    const drifted = PACKAGE_FILES.filter((file) => {
      try {
        return readFileSync(join(scratch, file), "utf-8") !== readFileSync(join(BASELINE_DIR, file), "utf-8");
      } catch {
        // A missing committed file is drift, not a crash.
        return true;
      }
    });
    if (drifted.length > 0) {
      console.error(`check-fixture-emitter: committed package is stale: ${drifted.join(", ")}`);
      console.error(
        "Fix: node scripts/ruleset-builds/fixture/build-package.mjs " +
          "--out holonovel/testdata/rulesets/fixture --no-backup",
      );
      status = 1;
    } else {
      console.log(`PASS: fixture package is current (${PACKAGE_FILES.length} files)`);
    }
  }
} catch (e) {
  console.error(`check-fixture-emitter: ${e.message}`);
  status = 2;
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
process.exit(status);
