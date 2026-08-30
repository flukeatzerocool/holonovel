/**
 * update-rulesets.ts — Ruleset update entry point (REQ-422).
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

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readAndCompute } from "./lib/contract-fingerprint.js";

const root = join(import.meta.dirname, "..");
const dataDir = process.env.TTRPG_DATA_DIR ?? join(root, "holonovel", ".holonovel-state");
const installDir = process.env.TTRPG_RULESET_DIRS ?? join(dataDir, "rulesets");
const registryFile = join(dataDir, "ruleset-registry.json");

interface RegistryEntry {
  source: string;
  package_format: string;
  built_at: string;
}

function loadRegistry(): Record<string, RegistryEntry> {
  try { return JSON.parse(readFileSync(registryFile, "utf-8")); }
  catch { return {}; }
}

function installedManifests(): { slug: string; package_format?: string }[] {
  if (!existsSync(installDir)) return [];
  const out: { slug: string; package_format?: string }[] = [];
  for (const entry of readdirSync(installDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(installDir, entry.name, "manifest.json");
    if (!existsSync(manifestPath)) continue;
    try {
      const m = JSON.parse(readFileSync(manifestPath, "utf-8"));
      out.push({ slug: entry.name, package_format: m.package_format });
    } catch {
      out.push({ slug: entry.name });
    }
  }
  return out;
}

const current = readAndCompute().packageFormat;
const registry = loadRegistry();
const packages = installedManifests();

console.log("update-rulesets — package compatibility summary");
console.log(`Current package-format fingerprint: ${current}`);
console.log(`Install directory: ${installDir}`);
console.log("");
for (const pkg of packages) {
  const state = pkg.package_format === current
    ? "current"
    : pkg.package_format
      ? "STALE (fingerprint mismatch)"
      : "STALE (no fingerprint)";
  console.log(`  ${pkg.slug}: ${state}`);
}

const stale = packages.filter((p) => p.package_format !== current);
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
