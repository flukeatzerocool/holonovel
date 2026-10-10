#!/usr/bin/env node
// build-package.mjs — overlay the ThunderCats 5.5E supplements onto the
// `dnd2024` ruleset package and emit the six-file declarative package
// (Build workflow §6.4.2; REQ-389). [build tool]
//
// Role: build tool. The extraction baseline (core books + prior 5E supplements)
// is builder-side per REQ-563; the committed durable sources for this package
// are the supplement extract (`extract-thundercats.json`) and the authored tool
// set (`authored/tools-thundercats.json`). This script merges the ThunderCats
// index entries and collections, adds the ThunderCats lookup tools, sanitizes
// read-only descriptions (REQ-552), recomputes the content hash, runs the
// ruleset-package gates (REQ-430), and writes the package.
//
// Usage:
//   node build-package.mjs [--baseline <dir>] [--out <dir>] [--install] [--dry-run]
//
// Exit codes: 0 = package written (or dry run), 1 = gate refusal / build failure,
// 2 = fatal.

import * as fs from "node:fs";
import * as path from "node:path";
import { computeContentHash } from "../../lib/ruleset-package.mjs";
import {
  parseBuildArgs, readJson, readPackageFormat, readHostVersion,
  sanitizeReadOnlyDescription, writePackageFiles, runPackageGates,
} from "../../lib/ruleset-build-kit.mjs";

const HERE = import.meta.dirname;
const REPO_ROOT = path.resolve(HERE, "..", "..", "..");
const DEPLOYED = process.env.TC_DEPLOYED ?? path.join(REPO_ROOT, "..", "Holonovel-deployed", "holonovel");
const DEFAULT_INSTALL = path.join(DEPLOYED, ".holonovel-state", "rulesets", "dnd2024");

function main() {
  const o = parseBuildArgs(process.argv.slice(2), {
    baseline: "baselineDir", out: "out", install: "install", "dry-run": "dryRun",
  });
  if (o.help) {
    console.log("usage: node build-package.mjs [--baseline <dir>] [--out <dir>] [--install] [--dry-run]");
    return 0;
  }
  const baselineDir = o.baselineDir ?? DEFAULT_INSTALL;
  const outDir = path.resolve(o.out ?? (o.install ? baselineDir : path.join(HERE, "package")));

  const base = {};
  for (const f of ["manifest.json", "index.json", "model.json", "tools.json", "resources.json", "prompts.json"]) {
    base[f] = readJson(path.join(baselineDir, f));
  }
  const extract = readJson(path.join(HERE, "extract-thundercats.json"));
  const newTools = readJson(path.join(HERE, "authored", "tools-thundercats.json"));

  // Idempotent overlay: drop any prior ThunderCats content from the baseline so
  // re-running the build does not duplicate entries or collide on tool names.
  const isTc = (v) => String(v ?? "").startsWith("supplements/ThunderCats");

  const baseIndex = base["index.json"].filter((e) => !isTc(e.source_file));
  const ids = new Set(baseIndex.map((e) => e.id));
  const mergedIndex = [...baseIndex];
  for (const e of extract.index) {
    let id = e.id;
    let n = 2;
    while (ids.has(id)) id = `${e.id}_${n++}`;
    ids.add(id);
    mergedIndex.push({ ...e, id });
  }

  const model = JSON.parse(JSON.stringify(base["model.json"]));
  for (const [coll, entries] of Object.entries(extract.model)) {
    const prior = Object.fromEntries(Object.entries(model[coll] ?? {}).filter(([, v]) => !isTc(v?.source_file)));
    model[coll] = { ...prior, ...entries };
  }

  const newToolNames = new Set(newTools.map((t) => t.name));
  const mergedTools = base["tools.json"]
    .filter((t) => !newToolNames.has(t.name))
    .map((t) => ({ ...t, description: sanitizeReadOnlyDescription(t.description) }));
  for (const t of newTools) mergedTools.push({ ...t, description: sanitizeReadOnlyDescription(t.description) });

  const resources = base["resources.json"];
  const prompts = base["prompts.json"];
  const contentHash = computeContentHash(mergedIndex, model, mergedTools, resources, prompts);

  const counts = { ...(base["manifest.json"].counts ?? {}) };
  for (const coll of Object.keys(extract.model)) counts[coll] = Object.keys(model[coll]).length;
  counts.anchor = mergedIndex.length;
  counts.thundercats_index = extract.index.length;

  const manifest = {
    ...base["manifest.json"],
    slug: "dnd2024",
    name: base["manifest.json"].name,
    host_version: readHostVersion(path.dirname(DEPLOYED)),
    content_hash: contentHash,
    built_at: new Date().toISOString(),
    counts,
    package_format: readPackageFormat(path.dirname(DEPLOYED)),
  };

  console.log(`build-package — dnd2024 + ThunderCats`);
  console.log(`  baseline:     ${baselineDir}`);
  console.log(`  output:       ${outDir}`);
  console.log(`  index:        ${base["index.json"].length} -> ${mergedIndex.length} (+${extract.index.length})`);
  console.log(`  tools:        ${base["tools.json"].length} -> ${mergedTools.length} (+${newTools.length})`);
  console.log(`  collections:  ${Object.entries(extract.model).map(([k, v]) => `${k}:${Object.keys(v).length}`).join(", ")}`);
  console.log(`  content_hash: ${contentHash}`);

  if (o.dryRun) { console.log("\nDry run — no files written."); return 0; }
  writePackageFiles(outDir, {
    "manifest.json": manifest,
    "index.json": mergedIndex,
    "model.json": model,
    "tools.json": mergedTools,
    "resources.json": resources,
    "prompts.json": prompts,
  });
  const failures = runPackageGates(outDir, REPO_ROOT);
  if (failures) { console.error(`\npackage gates failed (REQ-430) — dnd2024 not finalized:\n${failures}`); return 1; }
  console.log(`\nWrote 6 files to ${outDir}`);
  return 0;
}

try {
  process.exit(main());
} catch (e) {
  console.error(`build-package: ${e.message}`);
  process.exit(1);
}
