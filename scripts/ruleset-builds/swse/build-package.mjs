#!/usr/bin/env node
// build-package.mjs — deterministic rebuild of the `swse` ruleset package. [build tool]
//
// Role: build tool. Re-emits the six-file declarative ruleset package (REQ-389)
// for Star Wars Saga Edition from a durable, committed build source:
// `character_creation.json` (the authored character-creation rules, REQ-399a)
// overlaid onto an extraction baseline (index/model/tools/resources/prompts).
//
// The authored character_creation source — not a post-build hand edit of the
// installed model.json — is the single source of truth for the damage-tracking
// derived statistics (`hit_points`, `damage_threshold`, `force_points`, REQ-399a).
// Any `character_creation` carried by the baseline is discarded before the
// authored block is applied, so a rebuild from a pre-patch extraction emits the
// same statistics.
//
// Usage:
//   node scripts/ruleset-builds/swse/build-package.mjs [options]
//
//   --baseline <dir>   Extraction baseline dir (default: the installed swse dir).
//   --out <dir>        Output dir (default: the installed swse dir).
//   --dry-run          Print the plan and write nothing.
//   --no-backup        Skip the pre-write backup of the output dir.
//   -h, --help         Print this usage and exit 0.
//
// Exit codes: 0 = package written (or dry-run), 1 = build/validation failure,
// 2 = unexpected fatal error.
//
// REQ-389 (declarative package), REQ-395a (build entry point, committed tooling),
// REQ-399a (character-creation package data), REQ-420 (package-format fingerprint).

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

const SCRIPT_DIR = import.meta.dirname;
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..", "..");
const SLUG = "swse";
const NAME = "Star Wars Saga Edition";
const PACKAGE_FILES = ["manifest.json", "index.json", "model.json", "tools.json", "resources.json", "prompts.json"];

function usage() {
  console.log("build-package.mjs — rebuild the swse ruleset package");
  console.log("");
  console.log("Usage: node scripts/ruleset-builds/swse/build-package.mjs [--baseline <dir>] [--out <dir>] [--dry-run] [--no-backup]");
  console.log("");
  console.log(`Authored source: ${path.join(SCRIPT_DIR, "character_creation.json")}`);
}

function parseArgs(argv) {
  const opts = { baseline: null, out: null, dryRun: false, backup: true, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") opts.help = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--no-backup") opts.backup = false;
    else if (a === "--baseline") opts.baseline = argv[++i];
    else if (a === "--out") opts.out = argv[++i];
    else { console.error(`build-package: unknown flag '${a}'`); usage(); process.exit(1); }
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help) { usage(); process.exit(0); }

const repoRoot = REPO_ROOT;
const installDir = process.env.TTRPG_RULESET_DIRS ?? path.join(repoRoot, "holonovel", ".holonovel-state", "rulesets");
const outDir = path.resolve(opts.out ?? path.join(installDir, SLUG));
const baselineDir = path.resolve(opts.baseline ?? outDir);
const authoredPath = path.join(SCRIPT_DIR, "character_creation.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

// Canonical JSON + SHA-256, identical to the host's computeContentHash
// (holonovel/src/rulesets.ts) — canonicalization strips to a compact JSON string
// so the host accepts the emitted content_hash.
const canonical = (obj) => JSON.stringify(JSON.parse(JSON.stringify(obj)));
function computeContentHash(index, model, tools, resources, prompts) {
  const h = crypto.createHash("sha256");
  for (const obj of [index, model, tools, resources, prompts]) h.update(canonical(obj));
  return h.digest("hex");
}

function readPackageFormat() {
  const gen = path.join(repoRoot, "holonovel", "src", "generated", "contract-fingerprints.ts");
  const src = fs.readFileSync(gen, "utf-8");
  const m = src.match(/export const PACKAGE_FORMAT = "([0-9a-f]+)";/);
  if (!m) throw new Error(`PACKAGE_FORMAT not found in ${gen}`);
  return m[1];
}

function readHostVersion() {
  return readJson(path.join(repoRoot, "package.json")).version;
}

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

  // Discard any baseline character_creation: the authored source is authoritative.
  const model = { ...baseline["model.json"], character_creation: authored };

  const packageFormat = readPackageFormat();
  const hostVersion = readHostVersion();
  const contentHash = computeContentHash(baseline["index.json"], model, baseline["tools.json"], baseline["resources.json"], baseline["prompts.json"]);
  const builtAt = new Date().toISOString();

  const manifest = {
    slug: SLUG,
    name: NAME,
    host_version: hostVersion,
    content_hash: contentHash,
    built_at: builtAt,
    counts: baselineManifest.counts ?? {},
    package_format: packageFormat,
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

  if (opts.backup && fs.existsSync(outDir)) {
    // Back up beside the install dir (not inside it): a sibling of the slug dirs
    // would be scanned as a package slug by the host at boot.
    const backupParent = outDir.startsWith(installDir + path.sep) ? path.dirname(installDir) : path.dirname(outDir);
    const backup = path.join(backupParent, `rulesets-backup-${SLUG}-${Date.now()}`);
    fs.cpSync(outDir, backup, { recursive: true });
    console.log(`  backup:          ${backup}`);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const files = {
    "manifest.json": manifest,
    "index.json": baseline["index.json"],
    "model.json": model,
    "tools.json": baseline["tools.json"],
    "resources.json": baseline["resources.json"],
    "prompts.json": baseline["prompts.json"],
  };
  for (const f of PACKAGE_FILES) {
    fs.writeFileSync(path.join(outDir, f), JSON.stringify(files[f], null, 2) + "\n");
  }
  console.log(`\nWrote ${PACKAGE_FILES.length} files to ${outDir}`);
  process.exit(0);
} catch (e) {
  console.error(`build-package: ${e.message}`);
  process.exit(1);
}
