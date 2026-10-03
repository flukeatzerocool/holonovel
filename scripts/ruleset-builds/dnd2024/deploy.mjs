#!/usr/bin/env node
// deploy.mjs — Install the rebuilt dnd2024 package into the deployed server,
// after backing up the prior package, and record the change. [build tool]
//
// Usage: node deploy.mjs [--dry-run]
// Exit codes: 0 = deployed (or dry run), 1 = failure, 2 = fatal.

import * as fs from "node:fs";
import * as path from "node:path";

const HERE = import.meta.dirname;
const PKG = path.join(HERE, "package");
const DEPLOYED = process.env.TC_DEPLOYED ?? "/home/fluke/Holonovel-deployed/holonovel";
const STATE = path.join(DEPLOYED, ".holonovel-state");
const INSTALL = path.join(STATE, "rulesets", "dnd2024");
const REGISTRY = path.join(STATE, "ruleset-registry.json");
const INTAKE = path.join(STATE, "build-intake.md");
const FILES = ["manifest.json", "index.json", "model.json", "tools.json", "resources.json", "prompts.json"];
const DRY = process.argv.includes("--dry-run");

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf-8"));
const stamp = new Date().toISOString();
const next = readJson(path.join(PKG, "manifest.json"));
const prev = readJson(path.join(INSTALL, "manifest.json"));

console.log(`deploy — dnd2024 + ThunderCats`);
console.log(`  install:      ${INSTALL}`);
console.log(`  host_version: ${prev.host_version} -> ${next.host_version}`);
console.log(`  content_hash: ${(prev.content_hash || "").slice(0, 12)}… -> ${next.content_hash.slice(0, 12)}…`);
console.log(`  counts:       anchor ${prev.counts?.anchor} -> ${next.counts?.anchor}, tools 19 -> 24`);

if (DRY) {
  console.log("\nDry run — nothing written.");
  process.exit(0);
}

// Backup beside the install dir (a sibling of the slug dirs would be scanned).
const backup = path.join(STATE, `rulesets-backup-dnd2024-thundercats-${Date.now()}`);
fs.cpSync(INSTALL, backup, { recursive: true });
console.log(`  backup:       ${backup}`);

for (const f of FILES) fs.copyFileSync(path.join(PKG, f), path.join(INSTALL, f));

const registry = readJson(REGISTRY);
registry.dnd2024 = { ...(registry.dnd2024 ?? {}), package_format: next.package_format, built_at: next.built_at };
fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n");

const entry = [
  "",
  `## Supplement integration — ThunderCats 5.5E (${stamp})`,
  "",
  "Added the two ThunderCats 5.5E RPG books (Campaign and Setting Guide; Adventures) to the",
  "`dnd2024` package as supplement sources, converted per Appendix G and overlaid by",
  "`/home/fluke/Documents/Thundercats/build/build-package.mjs`.",
  "",
  `- anchor ${prev.counts?.anchor} -> ${next.counts?.anchor} (+${next.counts?.thundercats_index} ThunderCats index entries); tools 19 -> 24.`,
  "- new collections: vehicles 64, equipment 45, locations 98, adventures 5, spirits 4; merged: classes +15, species +7, feats +19, spells +21, magic_items +45, conditions +3, monsters +253.",
  `- content_hash ${(prev.content_hash || "").slice(0, 12)}… -> ${next.content_hash.slice(0, 12)}…; host_version ${prev.host_version} -> ${next.host_version}.`,
  "- Restart of the deployed host required to load (boot-time scan; no hot reload).",
];
fs.appendFileSync(INTAKE, entry.join("\n") + "\n");

console.log(`\nDeployed. Restart the host to load the package.`);
process.exit(0);
