#!/usr/bin/env npx tsx
/**
 * build-ruleset.ts — Ruleset-build entry point (REQ-395a). [entry point]
 *
 * Accepts one or more `slug=path` pairs (the B1 intake form), validates each
 * slug (§7.1a) and its source path, records the intake, and reports every intake
 * whose package still needs the Build workflow (§6.1, §6.2) as evidence — with
 * the source path and the runbook to follow. Invoked with no arguments, it
 * prints its usage and the install directory (REQ-395a).
 *
 * No agent subprocess is part of this contract: the report names what is pending
 * and the operator (or CI) runs the workflow. A printed command string would be
 * guidance the script cannot honour, so the script does not print one.
 */

import { readdirSync, existsSync, statSync, writeFileSync, mkdirSync, appendFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readAndCompute } from "./lib/contract-fingerprint.js";
import { loadRegistry, saveRegistry, resolveEmitter, runRebuildWithGates, type RegistryEntry } from "./lib/ruleset-registry.js";
import {
  mergeParts, readParts, readSupplementParts, writeParts, hashParts, hashSourceDir, snapshotBase,
} from "./lib/ruleset-supplement.js";
import { APPENDIX_U_LICENSES } from "../holonovel/src/rulesets.js";
import { locateStateDir } from "../holonovel/src/core/data-dir.js";

const root = join(import.meta.dirname, "..");
// REQ-397 — one resolver for repo tooling and the shipped server, so the
// build path never invents its own in-tree state directory.
const dataDir = locateStateDir(join(root, "holonovel")).dir;
const installDir = process.env.TTRPG_RULESET_DIRS ?? join(dataDir, "rulesets");
const decisionsFile = join(dataDir, "build-intake.md");
const provenanceFile = join(dataDir, "build-provenance.md");

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;

interface Intake {
  slug: string;
  path: string;
  role: "new" | "supplement";
}

function printUsage(): void {
  console.log("build-ruleset — Ruleset-build entry point (REQ-395a)");
  console.log("");
  console.log("Usage: npx tsx scripts/build-ruleset.ts <slug>=<path> [<slug>+=<path> ...]");
  console.log("");
  console.log("  <slug>   A valid ruleset slug (§7.1a): lowercase-hyphenated, e.g. dnd5e");
  console.log("  <slug>+  A supplement target: overlay <path> onto the installed package (REQ-557)");
  console.log("  <path>   Absolute or relative path to a directory of Markdown sources, or a");
  console.log("           durable package-parts directory (index/model/tools/resources/prompts)");
  console.log("");
  console.log("  --license=<value>  Record the source's Appendix U license (REQ-432a).");
  console.log("");
  console.log(`Install directory: ${installDir}`);
  console.log("No valid arguments given — nothing built. See Appendix V (Workflow Runbooks).");
}

function parseArgs(argv: string[]): Intake[] {
  return argv
    .filter((a) => !a.startsWith("-"))
    .map((arg) => {
      const eq = arg.indexOf("=");
      const rawSlug = eq <= 0 ? arg : arg.slice(0, eq);
      const role = rawSlug.endsWith("+") ? "supplement" : "new";
      return {
        slug: role === "supplement" ? rawSlug.slice(0, -1) : rawSlug,
        path: eq <= 0 ? "" : arg.slice(eq + 1),
        role: role as Intake["role"],
      };
    })
    .filter((i) => i.slug !== "");
}

function hasMarkdown(dirPath: string): boolean {
  try {
    const entries = statSync(dirPath);
    if (!entries.isDirectory()) return false;
    // A shallow directory listing is sufficient for intake validation; the
    // Discovery step (§6.3) performs the deep, chunked read.
    return readdirSync(dirPath).some((f: string) => f.endsWith(".md"));
  } catch {
    return false;
  }
}

function recordIntake(intakes: Intake[]): void {
  const stamp = new Date().toISOString();
  const pairs = intakes.map((i) => `${i.slug}${i.role === "supplement" ? "+" : ""}=${i.path}`).join(" ");
  const entry = `\n## B1 intake (build-ruleset) — ${stamp}\n\n- B1: ${pairs}\n`;
  mkdirSync(dataDir, { recursive: true });
  if (existsSync(decisionsFile)) {
    writeFileSync(decisionsFile, entry, { flag: "a" });
  } else {
    writeFileSync(decisionsFile, entry);
  }
}

const intakes = parseArgs(process.argv.slice(2));
// REQ-432a — the Appendix U license for the registered source, when declared.
const licenseArg = process.argv.slice(2).find((a) => a.startsWith("--license="));
const sourceLicense = licenseArg ? licenseArg.slice("--license=".length) : undefined;

if (intakes.length === 0) {
  printUsage();
  process.exit(0);
}

// REQ-421 — a bare slug (no `=path`) defaults to the recorded source path.
const registry = loadRegistry(dataDir);
for (const intake of intakes) {
  if (intake.path === "" && registry[intake.slug]?.source) {
    intake.path = registry[intake.slug].source;
    console.log(`build-ruleset: ${intake.slug} → recorded source ${intake.path}`);
  }
}

const failures: string[] = [];
for (const intake of intakes) {
  if (!SLUG_RE.test(intake.slug)) {
    failures.push(`${intake.slug}: invalid slug (§7.1a: lowercase-hyphenated)`);
    continue;
  }
  // An intake may be a durable parts directory (emitted deterministically) or a
  // Markdown directory (recorded; the Build workflow extracts it first).
  const partsDir = readSupplementParts(intake.path) !== null;
  if (!existsSync(intake.path) || (!partsDir && !hasMarkdown(intake.path))) {
    failures.push(`${intake.slug}: path '${intake.path}' is not a directory containing Markdown or the five package parts`);
    continue;
  }
  if (intake.role === "supplement" && !existsSync(join(installDir, intake.slug, "manifest.json"))) {
    failures.push(`${intake.slug}+: no installed base package to overlay (install it first)`);
  }
}
if (sourceLicense !== undefined && !APPENDIX_U_LICENSES.has(sourceLicense)) {
  failures.push(`--license '${sourceLicense}': not an Appendix U license (§U: ${[...APPENDIX_U_LICENSES].join(", ")})`);
}

if (failures.length > 0) {
  console.error("build-ruleset: intake rejected");
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`Install directory: ${installDir}`);
  process.exit(1);
}

console.log("build-ruleset — intake accepted");
console.log(`Install directory: ${installDir}`);
for (const intake of intakes) {
  console.log(`  ${intake.slug}${intake.role === "supplement" ? "+" : ""}=${intake.path}`);
}

recordIntake(intakes);

// REQ-421 — record the slug→source registry entry with the current
// package-format fingerprint at intake.
{
  const packageFormat = readAndCompute().packageFormat;
  const stamp = new Date().toISOString();
  const next = loadRegistry(dataDir);
  for (const intake of intakes) {
    const prior = next[intake.slug];
    const entry: RegistryEntry = { source: intake.path, package_format: packageFormat, built_at: stamp };
    // REQ-421 — the ordered build recipe. A supplement appends (or re-points)
    // a role-tagged source and keeps the recorded base source; a new package
    // resets the recipe to that one source.
    const priorSources = prior?.sources ?? (prior?.source ? [{ path: prior.source, role: "new" as const }] : []);
    if (intake.role === "supplement") {
      const bases = priorSources.filter((s) => s.role === "new");
      const others = priorSources.filter((s) => s.role === "supplement" && s.path !== intake.path);
      entry.sources = [...bases, ...others, { path: intake.path, role: "supplement" }];
      if (prior?.source) entry.source = prior.source;
    } else {
      entry.sources = [{ path: intake.path, role: "new" }];
    }
    if (intake.role === "supplement" && prior?.base_content_hash) {
      entry.base_content_hash = prior.base_content_hash;
    }
    if (intake.role === "supplement" && prior?.supplements) entry.supplements = prior.supplements;
    // REQ-432a — carry the declared license; a re-run without --license keeps
    // the previously recorded value.
    const license = sourceLicense ?? prior?.source_license;
    if (license) entry.source_license = license;
    // REQ-563/REQ-564 — record a committed emitter when the slug has one so
    // `update` can rebuild without re-deriving the recipe. The repo emitter
    // supplies its own baseline; `--out` is the only argument.
    const repoEmitter = join(root, "scripts", "ruleset-builds", intake.slug, "build-package.mjs");
    if (existsSync(repoEmitter)) {
      entry.emitter = repoEmitter;
      entry.emitter_args = ["--out", "{dir}"];
    }
    next[intake.slug] = entry;
  }
  saveRegistry(dataDir, next);
}

// REQ-395a/REQ-563 — invoke the resolved emitter for every intake that has one.
// A slug with no emitter keeps the printed Build invocation: extraction is not
// deterministic, so the Build workflow authors the emitter first.
//
// REQ-557 — a supplement build overlays merged parts through the same emitter,
// records base/supplement/result hashes in the registry and the state-dir
// provenance log, and replaces prior supplement content instead of duplicating.
console.log("");
let emitterFailures = 0;
const pendingBuild: string[] = [];
for (const intake of intakes) {
  const entry = loadRegistry(dataDir)[intake.slug];
  const resolved = resolveEmitter(root, installDir, intake.slug, entry);

  if (intake.role === "supplement") {
    const supplementParts = readSupplementParts(intake.path);
    if (!supplementParts) {
      pendingBuild.push(intake.slug);
      console.log(`  ${intake.slug}+: supplement recorded (Markdown source) — run the Build workflow below`);
      continue;
    }
    if (!resolved) {
      emitterFailures++;
      console.error(`  ${intake.slug}+: no emitter to overlay through`);
      continue;
    }
    const baseDir = snapshotBase(dataDir, installDir, intake.slug);
    const base = readParts(baseDir);
    const mergedDir = join(dataDir, "tmp", `merge-${intake.slug}-${process.pid}`);
    try {
      writeParts(mergedDir, mergeParts(base, [supplementParts]));
      const result = runRebuildWithGates({
        root, installDir, slug: intake.slug, emitter: resolved.emitter,
        args: ["--baseline", mergedDir, "--out", join(installDir, intake.slug)],
      });
      if (!result.ok) {
        emitterFailures++;
        console.error(`  ${intake.slug}+: failed — ${result.reason}`);
        continue;
      }
      const installed = JSON.parse(readFileSync(join(installDir, intake.slug, "manifest.json"), "utf-8"));
      const baseHash = hashParts(base);
      const supplementHashes = hashSourceDir(intake.path);
      const next = loadRegistry(dataDir);
      next[intake.slug] = {
        ...next[intake.slug],
        base_content_hash: baseHash,
        supplements: supplementHashes,
        package_format: installed.package_format ?? next[intake.slug]?.package_format,
        built_at: new Date().toISOString(),
      };
      saveRegistry(dataDir, next);
      appendFileSync(provenanceFile, [
        `\n## Supplement build — ${intake.slug} — ${new Date().toISOString()}`,
        `- base content hash: ${baseHash}`,
        ...supplementHashes.map((h) => `- supplement source: ${h}`),
        `- result content hash: ${installed.content_hash ?? "unknown"}`,
        "",
      ].join("\n"));
      console.log(`  ${intake.slug}+: overlaid (result ${String(installed.content_hash ?? "").slice(0, 12)}…)`);
    } finally {
      rmSync(mergedDir, { recursive: true, force: true });
    }
    continue;
  }

  if (!resolved) {
    pendingBuild.push(intake.slug);
    console.log(`  ${intake.slug}: recorded, no emitter — run the Build workflow below`);
    continue;
  }
  const result = runRebuildWithGates({
    root, installDir, slug: intake.slug, emitter: resolved.emitter, args: resolved.args,
  });
  if (result.ok) {
    console.log(`  ${intake.slug}: emitted`);
  } else {
    emitterFailures++;
    console.error(`  ${intake.slug}: failed — ${result.reason}`);
  }
}
if (emitterFailures > 0) {
  console.error(`\nbuild-ruleset: ${emitterFailures} emitter run(s) failed; intake is recorded.`);
  process.exit(1);
}

console.log("");
if (pendingBuild.length > 0) {
  console.log(`Pending Build workflow (§6.1, §6.2) for ${pendingBuild.length} intake(s):`);
  for (const slug of pendingBuild) {
    const intake = intakes.find((entry) => entry.slug === slug);
    console.log(`  ${slug}=${intake?.path ?? "<path>"}`);
  }
  console.log(`  install directory: ${installDir}`);
  console.log("Pending intakes are recorded; the operator runs the Build workflow for each (Appendix V.1 happy path).");
} else {
  console.log("All intakes emitted through their committed emitter; no Build workflow step is pending.");
}

// The intake is recorded in .holonovel-state/build-intake.md (server-side
// decision log, not the repo). The report above is the whole contract: this
// script reports evidence and never invokes an agent.
process.exit(0);
