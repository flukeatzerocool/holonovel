// ruleset-registry.ts — shared source-registry helpers (REQ-421, REQ-579). [build tool]
//
// The slug→source registry lives under the server state directory (REQ-397) and
// never in the repository. This module owns the schema, load/save, the installed
// package scan, the legacy-surface staleness predicate (REQ-579), and emitter
// resolution so build-ruleset, update-rulesets, and update agree on one shape.
//
// The schema is additive over the original { source, package_format, built_at }:
// older entries load unchanged. Extra fields: `sources` (ordered recipe),
// `emitter`/`emitter_args` (the rebuild invocation), `base_content_hash` and
// `supplements` (REQ-557). No filesystem side effects beyond the exported calls.

import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { CORE_TOOL_GROUPS } from "../../holonovel/src/rulesets.js";

export interface RecipeSource {
  path: string;
  role: "new" | "supplement";
}

export interface RegistryEntry {
  source: string;
  sources?: RecipeSource[];
  emitter?: string;
  emitter_args?: string[];
  package_format?: string;
  built_at?: string;
  base_content_hash?: string;
  supplements?: string[];
}

export function registryFile(dataDir: string): string {
  return join(dataDir, "ruleset-registry.json");
}

export function loadRegistry(dataDir: string): Record<string, RegistryEntry> {
  try {
    return JSON.parse(readFileSync(registryFile(dataDir), "utf-8"));
  } catch {
    // Missing or unreadable registry → empty map; intake recreates it.
    return {};
  }
}

export function saveRegistry(dataDir: string, entries: Record<string, RegistryEntry>): void {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(registryFile(dataDir), JSON.stringify(entries, null, 2) + "\n", "utf-8");
}

// REQ-579 — a package whose tools predate the surface contract needs a rebuild
// even when its package-format fingerprint is current.
export function missingSurfaceDeclaration(installDir: string, slug: string): boolean {
  const toolsPath = join(installDir, slug, "tools.json");
  if (!existsSync(toolsPath)) return false;
  try {
    const tools = JSON.parse(readFileSync(toolsPath, "utf-8"));
    if (!Array.isArray(tools)) return false;
    return tools.some((tool: any) =>
      !tool?.group || !(CORE_TOOL_GROUPS as readonly string[]).includes(tool.group)
      || !Array.isArray(tool?.phases) || tool.phases.length === 0);
  } catch {
    // Unreadable tools.json is not a surface defect; the host flags it at load.
    return false;
  }
}

export interface InstalledManifest {
  slug: string;
  package_format?: string;
  missing_surface: boolean;
}

export function installedManifests(installDir: string): InstalledManifest[] {
  if (!existsSync(installDir)) return [];
  const out: InstalledManifest[] = [];
  for (const entry of readdirSync(installDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(installDir, entry.name, "manifest.json");
    if (!existsSync(manifestPath)) continue;
    const missing_surface = missingSurfaceDeclaration(installDir, entry.name);
    try {
      const m = JSON.parse(readFileSync(manifestPath, "utf-8"));
      out.push({ slug: entry.name, package_format: m.package_format, missing_surface });
    } catch {
      out.push({ slug: entry.name, missing_surface });
    }
  }
  return out;
}

export interface ResolvedEmitter {
  emitter: string;
  args: string[];
}

// REQ-563/REQ-564 — resolve the per-slug rebuild invocation. Order: recorded
// emitter → committed repo emitter → an emitter discovered beside the recorded
// source. Repo emitters take a baseline flag; discovered external emitters
// default to writing the install dir via `--out` only (their own flags vary).
export function resolveEmitter(
  root: string,
  installDir: string,
  slug: string,
  entry: RegistryEntry | undefined,
): ResolvedEmitter | null {
  const repoEmitter = join(root, "scripts", "ruleset-builds", slug, "build-package.mjs");
  const candidates: string[] = [];
  if (entry?.emitter) candidates.push(entry.emitter);
  if (existsSync(repoEmitter)) candidates.push(repoEmitter);
  if (entry?.source) {
    const src = entry.source;
    candidates.push(join(src, "build", "build-package.mjs"));
    candidates.push(join(join(src, ".."), "build", "build-package.mjs"));
    candidates.push(join(src, "build-package.mjs"));
  }
  const emitter = candidates.find((c) => existsSync(c));
  if (!emitter) return null;
  const isRepoEmitter = emitter === repoEmitter;
  const args = entry?.emitter_args
    ?? (isRepoEmitter ? ["--baseline", "{dir}", "--out", "{dir}"] : ["--out", "{dir}"]);
  return { emitter, args: args.map((a) => a.replaceAll("{dir}", join(installDir, slug))) };
}
