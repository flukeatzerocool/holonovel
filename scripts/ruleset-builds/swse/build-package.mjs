#!/usr/bin/env node
// build-package.mjs — deterministic rebuild of the `swse` ruleset package. [build tool]
//
// Role: build tool. Re-emits the six-file declarative ruleset package (REQ-389)
// for Star Wars Saga Edition by overlaying the committed authored
// character-creation source (`character_creation.json`, REQ-399a) onto the
// extraction baseline. Read-only tool descriptions are sanitized (REQ-552) and
// the ruleset-package gates run before finalizing (REQ-430, REQ-563).
//
// The authored character_creation source — not a post-build hand edit of the
// installed model.json — is the single source of truth for the damage-tracking
// derived statistics (`hit_points`, `damage_threshold`, `force_points`, REQ-399a).
//
// Per REQ-563, the base extraction baseline is builder-side (Build workflow
// Discovery); the committed durable source for this package is the authored
// `character_creation.json` overlay.
//
// Usage:
//   node scripts/ruleset-builds/swse/build-package.mjs [--baseline <dir>] [--out <dir>] [--dry-run] [--no-backup]
//
// Exit codes: 0 = package written (or dry-run), 1 = gate refusal / build failure,
// 2 = unexpected fatal error.
//
// REQ-389, REQ-395a, REQ-399a, REQ-430, REQ-552, REQ-563.

import * as fs from "node:fs";
import * as path from "node:path";
import { computeContentHash } from "../../lib/ruleset-package.mjs";
import {
  PACKAGE_FILES, parseBuildArgs, readJson, readPackageFormat, readHostVersion,
  sanitizeReadOnlyDescription, writePackageFiles, backupInstallDir, runPackageGates,
} from "../../lib/ruleset-build-kit.mjs";

const SCRIPT_DIR = import.meta.dirname;
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..", "..");
const SLUG = "swse";
const NAME = "Star Wars Saga Edition";

// REQ-399a — the authored character-creation model must declare every
// damage-tracking resource the ruleset defines, as a derived statistic.
const REQUIRED_DAMAGE_STATS = ["hit_points", "damage_threshold", "force_points"];
function assertDamageTracking(cc) {
  const keys = new Set((cc?.derived_stats ?? []).map((d) => d.key));
  const missing = REQUIRED_DAMAGE_STATS.filter((k) => !keys.has(k));
  if (missing.length > 0) {
    throw new Error(`authored character_creation.json is missing damage-tracking derived stats: ${missing.join(", ")} (REQ-399a)`);
  }
}

try {
  const opts = parseBuildArgs(process.argv.slice(2), {
    baseline: "baselineDir", out: "out", "dry-run": "dryRun", "no-backup": "noBackup",
  });
  if (opts.help) {
    console.log(`usage: node scripts/ruleset-builds/${SLUG}/build-package.mjs [--baseline <dir>] [--out <dir>] [--dry-run] [--no-backup]`);
    process.exit(0);
  }

  const installDir = process.env.TTRPG_RULESET_DIRS ?? path.join(REPO_ROOT, "holonovel", ".holonovel-state", "rulesets");
  const outDir = path.resolve(opts.out ?? path.join(installDir, SLUG));
  const baselineDir = path.resolve(opts.baselineDir ?? outDir);
  const authoredPath = path.join(SCRIPT_DIR, "character_creation.json");

  const authored = readJson(authoredPath).character_creation ?? readJson(authoredPath);
  assertDamageTracking(authored);

  const baseline = {};
  for (const f of ["index.json", "model.json", "tools.json", "resources.json", "prompts.json"]) {
    const p = path.join(baselineDir, f);
    if (!fs.existsSync(p)) throw new Error(`baseline is missing ${f} in ${baselineDir}`);
    baseline[f] = readJson(p);
  }
  const baselineManifestPath = path.join(baselineDir, "manifest.json");
  const baselineManifest = fs.existsSync(baselineManifestPath) ? readJson(baselineManifestPath) : {};

  const model = { ...baseline["model.json"], character_creation: authored };
  const tools = baseline["tools.json"].map((t) => ({ ...t, description: sanitizeReadOnlyDescription(t.description) }));

  const packageFormat = readPackageFormat(REPO_ROOT);
  const hostVersion = readHostVersion(REPO_ROOT);
  const contentHash = computeContentHash(baseline["index.json"], model, tools, baseline["resources.json"], baseline["prompts.json"]);
  const manifest = {
    slug: SLUG, name: NAME, host_version: hostVersion, content_hash: contentHash,
    built_at: new Date().toISOString(), counts: baselineManifest.counts ?? {}, package_format: packageFormat,
  };

  console.log(`build-package — ${SLUG}`);
  console.log(`  authored source: ${authoredPath}`);
  console.log(`  baseline:        ${baselineDir}`);
  console.log(`  output:          ${outDir}`);
  console.log(`  host_version:    ${baselineManifest.host_version ?? "?"} -> ${hostVersion}`);
  console.log(`  package_format:  ${packageFormat}`);
  console.log(`  content_hash:    ${contentHash}`);
  console.log(`  damage stats:    ${REQUIRED_DAMAGE_STATS.join(", ")}`);

  if (opts.dryRun) { console.log("\nDry run — no files written."); process.exit(0); }
  if (!opts.noBackup && fs.existsSync(outDir)) {
    console.log(`  backup:          ${backupInstallDir(outDir, installDir, SLUG)}`);
  }

  writePackageFiles(outDir, {
    "manifest.json": manifest,
    "index.json": baseline["index.json"],
    "model.json": model,
    "tools.json": tools,
    "resources.json": baseline["resources.json"],
    "prompts.json": baseline["prompts.json"],
  });
  const failures = runPackageGates(outDir, REPO_ROOT);
  if (failures) { console.error(`\npackage gates failed (REQ-430) — ${SLUG} not finalized:\n${failures}`); process.exit(1); }
  console.log(`\nWrote ${PACKAGE_FILES.length} files to ${outDir}`);
  process.exit(0);
} catch (e) {
  console.error(`build-package: ${e.message}`);
  process.exit(1);
}
