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

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readAndCompute } from "./lib/contract-fingerprint.js";
import { CORE_TOOL_GROUPS } from "../holonovel/src/rulesets.js";

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

// REQ-579 — a package whose tools predate the surface contract needs a
// rebuild even when its package-format fingerprint is current.
function missingSurfaceDeclaration(slug: string): boolean {
  const toolsPath = join(installDir, slug, "tools.json");
  if (!existsSync(toolsPath)) return false;
  try {
    const tools = JSON.parse(readFileSync(toolsPath, "utf-8"));
    if (!Array.isArray(tools)) return false;
    return tools.some((tool: any) =>
      !tool?.group || !(CORE_TOOL_GROUPS as readonly string[]).includes(tool.group)
      || !Array.isArray(tool?.phases) || tool.phases.length === 0);
  } catch {
    return false;
  }
}

function installedManifests(): { slug: string; package_format?: string; missing_surface: boolean }[] {
  if (!existsSync(installDir)) return [];
  const out: { slug: string; package_format?: string; missing_surface: boolean }[] = [];
  for (const entry of readdirSync(installDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(installDir, entry.name, "manifest.json");
    if (!existsSync(manifestPath)) continue;
    const missing_surface = missingSurfaceDeclaration(entry.name);
    try {
      const m = JSON.parse(readFileSync(manifestPath, "utf-8"));
      out.push({ slug: entry.name, package_format: m.package_format, missing_surface });
    } catch {
      out.push({ slug: entry.name, missing_surface });
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
