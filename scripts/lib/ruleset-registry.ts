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

import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, realpathSync, unlinkSync, cpSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, sep } from "node:path";
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
  // REQ-432a — the Appendix U license recorded at intake, so a package built
  // from a registered source can name it.
  source_license?: string;
}

export function registryFile(dataDir: string): string {
  return join(dataDir, "ruleset-registry.json");
}

export function loadRegistry(dataDir: string): Record<string, RegistryEntry> {
  const file = registryFile(dataDir);
  // A missing registry is a fresh install; a present-but-unparseable one is
  // corruption and must not be silently replaced by an empty map (CR-18).
  if (!existsSync(file)) return {};
  let raw: string;
  try {
    raw = readFileSync(file, "utf-8");
  } catch (e) {
    throw new Error(`Cannot read ruleset registry ${file}: ${(e as Error).message}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Corrupt ruleset registry ${file}: ${(e as Error).message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Corrupt ruleset registry ${file}: expected a JSON object`);
  }
  return parsed as Record<string, RegistryEntry>;
}

export function saveRegistry(dataDir: string, entries: Record<string, RegistryEntry>): void {
  mkdirSync(dataDir, { recursive: true });
  const file = registryFile(dataDir);
  const tmp = `${file}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, JSON.stringify(entries, null, 2) + "\n", "utf-8");
    renameSync(tmp, file);
  } catch (e) {
    try { unlinkSync(tmp); } catch { /* tmp may not exist; original untouched */ }
    throw e;
  }
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

export interface RebuildResult {
  ok: boolean;
  reason?: string;
}

export interface BaseEmissionState {
  state: "none" | "current" | "changed" | "unavailable" | "no-hash";
  recorded?: string;
  current?: string;
  reason?: string;
}

// REQ-557 — base drift is measured against the base's *current emission* (the
// emitter's committed baseline, dry-run), never the frozen overlay snapshot and
// never the overlaid package manifest. Four distinct states keep a caller from
// reporting "current" when it could not resolve the base.
export function baseEmissionState(
  root: string, installDir: string, slug: string, entry: RegistryEntry | undefined,
): BaseEmissionState {
  const recorded = entry?.base_content_hash;
  if (!recorded) return { state: "none" };
  const resolved = resolveEmitter(root, installDir, slug, entry);
  if (!resolved) return { state: "unavailable", recorded, reason: "no recorded emitter or source" };
  const r = spawnSync("node", [resolved.emitter, ...resolved.args, "--dry-run", "--json"], {
    cwd: root, encoding: "utf-8",
  });
  if (r.status !== 0) {
    return { state: "no-hash", recorded, reason: `emitter exited ${r.status}` };
  }
  try {
    const lines = (r.stdout ?? "").trim().split("\n");
    const parsed = JSON.parse(lines[lines.length - 1] ?? "{}");
    const current = parsed.content_hash;
    if (typeof current !== "string") throw new Error("no content_hash");
    return { state: current === recorded ? "current" : "changed", recorded, current };
  } catch {
    return { state: "no-hash", recorded, reason: "emitter did not report a content hash" };
  }
}

// REQ-563/REQ-564 — one staged rebuild path shared by `build-ruleset` and
// `update`: run the emitter into `<install>/<slug>.staging-<pid>` via its
// `--out` argument, run the package gates there, then back up and swap. A gate
// defect or emitter failure removes staging and leaves the installed package
// untouched. An emitter that cannot stage is refused, never installed un-gated.
//
// The gate set is REQ-430 (tool schemas), REQ-559 (model shape) and REQ-560
// (ruleset-free replay). It is duplicated from the emitter kit's
// `runPackageGates` because this module is TypeScript and the kit is `.mjs`;
// keep the two lists in step.
export function runRebuildWithGates({
  root, installDir, slug, emitter, args,
}: { root: string; installDir: string; slug: string; emitter: string; args: string[] }): RebuildResult {
  const target = join(installDir, slug);
  const staging = `${target}.staging-${process.pid}`;
  const outIdx = args.indexOf("--out");
  if (outIdx < 0 || outIdx === args.length - 1) {
    return { ok: false, reason: "emitter cannot stage (no --out argument)" };
  }
  const staged = [...args];
  staged[outIdx + 1] = staging;
  rmSync(staging, { recursive: true, force: true });
  // Some emitters write straight into `--out` instead of creating it.
  mkdirSync(staging, { recursive: true });

  const run = spawnSync("node", [emitter, ...staged], { cwd: root, encoding: "utf-8" });
  const output = `${run.stdout ?? ""}${run.stderr ?? ""}`.trim();
  if (run.status !== 0) {
    rmSync(staging, { recursive: true, force: true });
    return { ok: false, reason: `emitter exited ${run.status}: ${output.slice(-400)}` };
  }

  const gates: Array<[string, string[]]> = [
    ["scripts/check-ruleset-package.ts", [staging]],
    ["scripts/check-ruleset-model.ts", [staging]],
    ["holonovel/scripts/test-ruleset-nonovel.ts", ["--package", staging]],
  ];
  for (const [gate, gateArgs] of gates) {
    const r = spawnSync("npx", ["tsx", join(root, gate), ...gateArgs], {
      cwd: root, encoding: "utf-8",
    });
    if (r.status !== 0) {
      const detail = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().slice(-600);
      rmSync(staging, { recursive: true, force: true });
      return { ok: false, reason: `${gate} failed: ${detail}` };
    }
  }

  if (existsSync(target)) {
    const backup = join(installDir, "..", `rulesets-backup-${slug}-${Date.now()}`);
    cpSync(target, backup, { recursive: true });
  }
  cpSync(staging, target, { recursive: true });
  rmSync(staging, { recursive: true, force: true });
  return { ok: true };
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
  // Only execute an emitter that resolves under the repo's per-slug build
  // directory (or an operator-configured trusted root). The registry lives in
  // a writable data dir, so an unconstrained path is a code-execution vector
  // (CR-16).
  const trustedRoots = [join(root, "scripts", "ruleset-builds", slug)];
  if (process.env.HOLONOVEL_TRUSTED_EMITTER_ROOT) trustedRoots.push(process.env.HOLONOVEL_TRUSTED_EMITTER_ROOT);
  const isTrusted = (candidate: string): boolean => {
    try {
      const real = realpathSync(candidate);
      return trustedRoots.some((rootDir) => {
        let realRoot: string;
        try { realRoot = realpathSync(rootDir); } catch { return false; }
        return real === realRoot || real.startsWith(realRoot + sep);
      });
    } catch {
      return false;
    }
  };
  const emitter = candidates.find((c) => existsSync(c) && isTrusted(c));
  if (!emitter) return null;
  // REQ-563 — a repo emitter supplies its own committed baseline, so `--out`
  // is the only argument it needs; injecting `--baseline {dir}` would make a
  // fresh clone depend on an installed package.
  const args = entry?.emitter_args ?? ["--out", "{dir}"];
  return { emitter, args: args.map((a) => a.replaceAll("{dir}", join(installDir, slug))) };
}
