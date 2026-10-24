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

// REQ-078a/§6.3 — derive the prompt inputs the host composes prompts from.
// `authored` carries ruleset-native facts the extraction model does not
// represent structurally (tagline, native personality construct names,
// narrative-tone samples); derived keys win for structural data, authored keys
// fill the open-ended fields. Absent inputs are omitted so the host falls back.
export function derivePromptInputs(model, index, { name, authored = {} } = {}) {
  const cc = model?.character_creation ?? {};
  const prompts = {};
  if (name || model?.name) prompts.display_name = name ?? model.name;
  if (authored.tagline) prompts.tagline = authored.tagline;

  const mechanic = model?.resolution?.core_mechanic;
  if (mechanic?.name) {
    prompts.core_mechanic = mechanic.description
      ? `${mechanic.name} (${mechanic.description})`
      : mechanic.name;
  }

  const sourcebooks = [...new Set((index ?? []).map((e) => e?.source_file).filter(Boolean))]
    .map((f) => f.replace(/^.*\//, "").replace(/\.md$/i, ""))
    .sort();
  if (sourcebooks.length > 0) prompts.sourcebooks = sourcebooks;

  const categories = [];
  const optionsFor = (step) => {
    const species = Object.keys(cc.species ?? {});
    const classes = Object.keys(cc.classes ?? {});
    switch (step) {
      case "name": return null;
      case "species": case "ancestry": case "race":
        return { label: "Species", options: species };
      case "class": case "classes":
        return { label: "Class", options: classes };
      case "ability_scores":
        return {
          label: "Ability scores",
          options: [...(cc.ability_names ?? []), ...Object.keys(cc.stat_methods ?? {})],
          meaning: "each method shows how to generate and assign the numbers.",
        };
      case "background":
        return { label: "Background", options: Object.keys(model?.backgrounds ?? {}) };
      case "skills":
        return { label: "Skills", options: Object.keys(cc.skills ?? model?.skills ?? {}) };
      case "equipment":
        return { label: "Starting equipment", options: Object.keys(cc.starting_equipment ?? classes) };
      default:
        return { label: step.replace(/[_-]/g, " "), options: Object.keys(cc[step] ?? {}) };
    }
  };
  for (const step of Array.isArray(cc.steps) ? cc.steps : []) {
    const entry = optionsFor(step);
    if (entry && entry.options.length > 0) categories.push(entry);
  }
  if (categories.length > 0) prompts.creation_categories = categories;

  if (Array.isArray(authored.personality_constructs) && authored.personality_constructs.length > 0) {
    prompts.personality_constructs = authored.personality_constructs;
  }
  if (authored.example_of_play) prompts.example_of_play = authored.example_of_play;
  if (Array.isArray(authored.narrative_tone) && authored.narrative_tone.length > 0) {
    prompts.narrative_tone = authored.narrative_tone;
  }

  // Optional deterministic fallback: the first indexed example-of-play passage
  // supplies a tone excerpt when the build input does not author one.
  if (!prompts.example_of_play) {
    const entry = (index ?? []).find((e) => typeof e?.content === "string" && /example of play/i.test(e.content));
    if (entry) prompts.example_of_play = entry.content.trim().slice(0, 400);
  }

  return prompts;
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

// REQ-578 / REQ-582 — a ruleset tool declares a host intent group and the
// phases it serves. A recorded user goal wins; otherwise fall back to the
// name/kind heuristic for legacy extracted tools. Shared so every emitter
// declares surfaces by one rule.
export const ALL_PHASES = ["none", "setup", "scene", "combat", "downtime", "closed"];
export function surfaceFor(tool) {
  const group = tool.user_goal
    ?? (tool.name === "core_mechanic" ? "table" : tool.kind === "roll" ? "resolve" : "lookup");
  if (group === "table") return { group, phases: ["none", "setup", "scene", "closed"] };
  if (group === "resolve") return { group, phases: ["scene", "combat", "downtime"] };
  return { group, phases: ALL_PHASES };
}

// REQ-561 — a fixed build timestamp makes re-emission byte-deterministic. The
// override is honored for the determinism gate; production emission defaults to
// the wall clock.
export function buildTimestamp() {
  return process.env.HOLONOVEL_BUILD_TIMESTAMP ?? new Date().toISOString();
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

  const tools = base.tools.map((t) => ({
    ...t, ...surfaceFor(t), description: sanitizeReadOnlyDescription(t.description),
  }));
  const packageFormat = readPackageFormat(repoRoot);
  const hostVersion = readHostVersion(repoRoot);
  const contentHash = computeContentHash(base.index, base.model, tools, base.resources, base.prompts);
  const manifest = {
    slug,
    name: base.name ?? name,
    host_version: hostVersion,
    content_hash: contentHash,
    built_at: buildTimestamp(),
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

  // Gate before install: emit into a staging directory, run the package gates,
  // and only then back up and copy over the target. A gate refusal leaves the
  // installed package untouched.
  const staging = `${outDir}.staging-${process.pid}`;
  writePackageFiles(staging, {
    "manifest.json": manifest,
    "index.json": base.index,
    "model.json": base.model,
    "tools.json": tools,
    "resources.json": base.resources,
    "prompts.json": base.prompts,
  });
  const failures = runPackageGates(staging, repoRoot);
  if (failures) {
    fs.rmSync(staging, { recursive: true, force: true });
    console.error(`\npackage gates failed (REQ-430) — ${slug} not finalized:\n${failures}`);
    return 1;
  }
  if (!opts.noBackup && fs.existsSync(outDir)) {
    console.log(`  backup:         ${backupInstallDir(outDir, installDir, slug)}`);
  }
  fs.cpSync(staging, outDir, { recursive: true });
  fs.rmSync(staging, { recursive: true, force: true });
  console.log(`\nWrote ${PACKAGE_FILES.length} files to ${outDir}`);
  return 0;
}
