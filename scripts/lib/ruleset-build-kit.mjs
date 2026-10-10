// ruleset-build-kit.mjs — shared helpers for the ruleset package emitters.
//
// Role: build tooling support (REQ-563). The per-slug emitters
// (scripts/ruleset-builds/<slug>/build-package.mjs) consume these helpers so the
// flag parsing, package-format/host-version reads, read-only description
// sanitize (REQ-552), backup, and the package-gate binding (REQ-430) live in one
// place. Emitters run `runPackageGates` over the emitted package and refuse to
// finalize on any reported defect (REQ-430).
//
// No filesystem side effects beyond those the exported functions name.

import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { computeContentHash } from "./ruleset-package.mjs";

export const PACKAGE_FILES = [
  "manifest.json",
  "index.json",
  "model.json",
  "tools.json",
  "resources.json",
  "prompts.json",
];

export function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function readHostVersion(repoRoot) {
  return readJson(path.join(repoRoot, "package.json")).version;
}

export function readPackageFormat(repoRoot) {
  const gen = path.join(repoRoot, "holonovel", "src", "generated", "contract-fingerprints.ts");
  const src = fs.readFileSync(gen, "utf-8");
  const m = src.match(/export const PACKAGE_FORMAT = "([0-9a-f]+)";/);
  if (!m) throw new Error(`PACKAGE_FORMAT not found in ${gen}`);
  return m[1];
}

// REQ-552 — rephrase read-only tool descriptions so the TDQS mutation-verb scan
// does not match under readOnlyHint (the "persists nothing" family).
export function sanitizeReadOnlyDescription(d) {
  return String(d)
    .replace(/writes no state/gi, "no state change")
    .replace(/emits no audit entry/gi, "no audit entry")
    .replace(/changes no badge/gi, "no badge change")
    .replace(/persists nothing/gi, "no persistence");
}

// Generic emitter flag parser. `spec` maps a flag name (without --) to an
// option key; boolean flags have null values. Always supports --help.
export function parseBuildArgs(argv, spec = {}) {
  const opts = { help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") { opts.help = true; continue; }
    const key = a.replace(/^--/, "");
    if (!(key in spec)) throw new Error(`unknown flag '${a}'`);
    const dest = spec[key];
    opts[dest] = true;
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) { opts[dest] = next; i++; }
  }
  return opts;
}

export function backupInstallDir(outDir, installDir, slug) {
  const parent = installDir && outDir.startsWith(installDir + path.sep) ? path.dirname(installDir) : path.dirname(outDir);
  const backup = path.join(parent, `rulesets-backup-${slug}-${Date.now()}`);
  fs.cpSync(outDir, backup, { recursive: true });
  return backup;
}

// REQ-430 — the emitter runs the ruleset-package gates over the emitted package
// and refuses to finalize on any defect. Returns the combined output; callers
// treat a non-null message as a refusal.
export function runPackageGates(dir, repoRoot) {
  const gates = ["check-ruleset-package.ts", "check-ruleset-model.ts"];
  const failures = [];
  for (const gate of gates) {
    const r = spawnSync("npx", ["tsx", path.join("scripts", gate), dir], { cwd: repoRoot, encoding: "utf-8" });
    const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
    if (r.status !== 0) failures.push(`${gate}:\n${out.trim()}`);
  }
  return failures.length > 0 ? failures.join("\n") : null;
}

export function writePackageFiles(outDir, files) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of PACKAGE_FILES) {
    fs.writeFileSync(path.join(outDir, f), JSON.stringify(files[f], null, 2) + "\n");
  }
}

// REQ-563 — re-emit a package from a committed durable baseline (or a
// `--baseline <dir>` override) with sanitized read-only descriptions, then run
// the package gates and refuse to finalize on any defect. Returns an exit code
// (0 = written or dry-run, 1 = gate refusal / failure). Thin per-slug recipes
// call this so the emitter logic lives in one place.
export function emitFromBaseline({ slug, name, repoRoot, scriptDir, argv }) {
  const opts = parseBuildArgs(argv, {
    baseline: "baselineDir", out: "out", "dry-run": "dryRun", "no-backup": "noBackup",
  });
  if (opts.help) {
    console.log(`usage: node scripts/ruleset-builds/${slug}/build-package.mjs [--baseline <dir>] [--out <dir>] [--dry-run] [--no-backup]`);
    return 0;
  }
  const installDir = process.env.TTRPG_RULESET_DIRS ?? path.join(repoRoot, "holonovel", ".holonovel-state", "rulesets");
  const outDir = path.resolve(opts.out ?? path.join(installDir, slug));

  let base;
  if (opts.baselineDir) {
    base = {
      name,
      counts: {},
      index: readJson(path.join(opts.baselineDir, "index.json")),
      model: readJson(path.join(opts.baselineDir, "model.json")),
      tools: readJson(path.join(opts.baselineDir, "tools.json")),
      resources: readJson(path.join(opts.baselineDir, "resources.json")),
      prompts: readJson(path.join(opts.baselineDir, "prompts.json")),
    };
  } else {
    base = readJson(path.join(scriptDir, "baseline.json"));
  }

  const tools = base.tools.map((t) => ({ ...t, description: sanitizeReadOnlyDescription(t.description) }));
  const packageFormat = readPackageFormat(repoRoot);
  const hostVersion = readHostVersion(repoRoot);
  const contentHash = computeContentHash(base.index, base.model, tools, base.resources, base.prompts);
  const manifest = {
    slug,
    name: base.name ?? name,
    host_version: hostVersion,
    content_hash: contentHash,
    built_at: new Date().toISOString(),
    counts: base.counts ?? {},
    package_format: packageFormat,
  };

  console.log(`build-package — ${slug}`);
  console.log(`  baseline:       ${opts.baselineDir ?? path.join(scriptDir, "baseline.json")}`);
  console.log(`  output:         ${outDir}`);
  console.log(`  host_version:   ${hostVersion}`);
  console.log(`  package_format: ${packageFormat}`);
  console.log(`  content_hash:   ${contentHash}`);

  if (opts.dryRun) { console.log("\nDry run — no files written."); return 0; }
  if (!opts.noBackup && fs.existsSync(outDir)) {
    console.log(`  backup:         ${backupInstallDir(outDir, installDir, slug)}`);
  }
  writePackageFiles(outDir, {
    "manifest.json": manifest,
    "index.json": base.index,
    "model.json": base.model,
    "tools.json": tools,
    "resources.json": base.resources,
    "prompts.json": base.prompts,
  });
  const failures = runPackageGates(outDir, repoRoot);
  if (failures) {
    console.error(`\npackage gates failed (REQ-430) — ${slug} not finalized:\n${failures}`);
    return 1;
  }
  console.log(`\nWrote ${PACKAGE_FILES.length} files to ${outDir}`);
  return 0;
}
