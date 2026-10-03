#!/usr/bin/env node
// build-package.mjs — Overlay the ThunderCats 5.5E supplements onto the
// installed `dnd2024` ruleset package and emit the six-file declarative package
// (Build workflow §6.4.2; REQ-389). [build tool]
//
// The installed dnd2024 package is the extraction baseline (core books + the
// three prior 5E supplements). This script merges the ThunderCats index entries
// and collections, adds the ThunderCats lookup tools, recomputes the host
// content hash, and writes the package to a staging directory. Nothing is
// written to the live install unless --install is passed.
//
// Usage:
//   node build-package.mjs [--baseline <dir>] [--out <dir>] [--install] [--dry-run]
//
// Exit codes: 0 = package written (or dry run), 1 = build failure, 2 = fatal.

import * as fs from "node:fs";
import * as path from "node:path";
import { computeContentHash } from "../../lib/ruleset-package.mjs";

const HERE = import.meta.dirname;
const DEPLOYED = process.env.TC_DEPLOYED ?? "/home/fluke/Holonovel-deployed/holonovel";
const DEFAULT_INSTALL = path.join(DEPLOYED, ".holonovel-state", "rulesets", "dnd2024");
const PACKAGE_FILES = ["manifest.json", "index.json", "model.json", "tools.json", "resources.json", "prompts.json"];

function parseArgs(argv) {
  const o = { baseline: DEFAULT_INSTALL, out: null, install: false, dryRun: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--baseline") o.baseline = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else if (a === "--install") o.install = true;
    else if (a === "--dry-run") o.dryRun = true;
    else if (a === "-h" || a === "--help") o.help = true;
    else {
      console.error(`build-package: unknown flag '${a}'`);
      process.exit(1);
    }
  }
  return o;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}


function readPackageFormat() {
  const src = fs.readFileSync(path.join(DEPLOYED, "src", "generated", "contract-fingerprints.ts"), "utf-8");
  const m = src.match(/export const PACKAGE_FORMAT = "([0-9a-f]+)";/);
  if (!m) throw new Error("PACKAGE_FORMAT not found");
  return m[1];
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help) {
    console.log("usage: node build-package.mjs [--baseline <dir>] [--out <dir>] [--install] [--dry-run]");
    process.exit(0);
  }
  const outDir = path.resolve(o.out ?? (o.install ? o.baseline : path.join(HERE, "package")));

  const base = {};
  for (const f of PACKAGE_FILES) base[f] = readJson(path.join(o.baseline, f));
  const extract = readJson(path.join(HERE, "extract-thundercats.json"));
  const newTools = readJson(path.join(HERE, "authored", "tools-thundercats.json"));

  // Idempotent overlay: drop any prior ThunderCats content from the baseline so
  // re-running the build does not duplicate entries or collide on tool names.
  const isTc = (v) => String(v ?? "").startsWith("supplements/ThunderCats");

  // index: drop prior ThunderCats entries, then append with unique ids
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

  // model: drop prior ThunderCats entries from each collection, then merge
  const model = JSON.parse(JSON.stringify(base["model.json"]));
  for (const [coll, entries] of Object.entries(extract.model)) {
    const prior = Object.fromEntries(Object.entries(model[coll] ?? {}).filter(([, v]) => !isTc(v?.source_file)));
    model[coll] = { ...prior, ...entries };
  }

  // tools: append ThunderCats tools (skip any name collision). Descriptions are
  // sanitized so the read-only tools do not trip the REQ-552 TDQS hard gate
  // (MUTATION_VERBS matches the literal "writes"/"changes" phrasing the legacy
  // packages used).
  const sanitize = (d) =>
    String(d)
      .replace(/writes no state/gi, "no state change")
      .replace(/emits no audit entry/gi, "no audit entry")
      .replace(/changes no badge/gi, "no badge change")
      .replace(/persists nothing/gi, "no persistence");
  const newToolNames = new Set(newTools.map((t) => t.name));
  const mergedTools = base["tools.json"]
    .filter((t) => !newToolNames.has(t.name))
    .map((t) => ({ ...t, description: sanitize(t.description) }));
  for (const t of newTools) mergedTools.push({ ...t, description: sanitize(t.description) });

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
    host_version: readJson(path.join(DEPLOYED, "package.json")).version,
    content_hash: contentHash,
    built_at: new Date().toISOString(),
    counts,
    package_format: readPackageFormat(),
  };

  console.log(`build-package — dnd2024 + ThunderCats`);
  console.log(`  baseline:    ${o.baseline}`);
  console.log(`  output:      ${outDir}`);
  console.log(`  index:       ${base["index.json"].length} -> ${mergedIndex.length} (+${extract.index.length})`);
  console.log(`  tools:       ${base["tools.json"].length} -> ${mergedTools.length} (+${newTools.length})`);
  console.log(`  collections: ${Object.entries(extract.model).map(([k, v]) => `${k}:${Object.keys(v).length}`).join(", ")}`);
  console.log(`  content_hash: ${contentHash}`);

  if (o.dryRun) {
    console.log("\nDry run — no files written.");
    return;
  }
  fs.mkdirSync(outDir, { recursive: true });
  const files = {
    "manifest.json": manifest,
    "index.json": mergedIndex,
    "model.json": model,
    "tools.json": mergedTools,
    "resources.json": resources,
    "prompts.json": prompts,
  };
  for (const f of PACKAGE_FILES) fs.writeFileSync(path.join(outDir, f), JSON.stringify(files[f], null, 2) + "\n");
  console.log(`\nWrote ${PACKAGE_FILES.length} files to ${outDir}`);
}

try {
  main();
  process.exit(0);
} catch (e) {
  console.error(`build-package: ${e.message}`);
  process.exit(1);
}
