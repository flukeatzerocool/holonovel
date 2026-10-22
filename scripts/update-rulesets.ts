#!/usr/bin/env npx tsx
/**
 * update-rulesets.ts — Ruleset update entry point (REQ-422). [entry point]
 *
 * Lists installed packages whose package-format fingerprint (REQ-420) differs
 * from the host's current value or is absent, and prints the Build workflow
 * invocation for each affected slug, reading slug→source mappings from the
 * source registry (REQ-421). Invoked with no arguments it prints usage, the
 * install directory, and a per-package compatibility summary.
 *
 * LIMITATION: This script prints `opencode run` commands but does NOT invoke
 * them — opencode cannot recursively invoke itself.
 */

import { join } from "node:path";
import { readAndCompute } from "./lib/contract-fingerprint.js";
import { loadRegistry, installedManifests } from "./lib/ruleset-registry.js";

const root = join(import.meta.dirname, "..");
const dataDir = process.env.TTRPG_DATA_DIR ?? join(root, "holonovel", ".holonovel-state");
const installDir = process.env.TTRPG_RULESET_DIRS ?? join(dataDir, "rulesets");

const current = readAndCompute().packageFormat;
const registry = loadRegistry(dataDir);
const packages = installedManifests(installDir);

console.log("update-rulesets — package compatibility summary");
console.log(`Current package-format fingerprint: ${current}`);
console.log(`Install directory: ${installDir}`);
console.log("");
for (const pkg of packages) {
  const state = pkg.package_format !== current
    ? (pkg.package_format ? "STALE (fingerprint mismatch)" : "STALE (no fingerprint)")
    : pkg.missing_surface
      ? "STALE (missing surface declaration)"
      : "current";
  console.log(`  ${pkg.slug}: ${state}`);
}

const stale = packages.filter((p) => p.package_format !== current || p.missing_surface);
console.log("");
if (stale.length === 0) {
  console.log("No stale packages — all installed packages match the current package-format fingerprint.");
} else {
  console.log(`${stale.length} stale package(s) require a rebuild (see Appendix V.7):`);
  for (const pkg of stale) {
    const source = registry[pkg.slug]?.source;
    console.log("");
    console.log(`  ${pkg.slug}${source ? ` — source: ${source}` : " — no registry entry; supply an explicit path"}`);
    console.log(`  Invoking: opencode run --agent build "Perform Build workflow on ${pkg.slug}. B1 intake: ${pkg.slug}=${source ?? "<path>"}. Follow Appendix V.1 happy path."`);
  }
}
