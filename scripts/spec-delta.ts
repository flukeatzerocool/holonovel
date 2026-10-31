#!/usr/bin/env npx tsx
/**
 * spec-delta.ts — classify the spec delta against the last-published hash. [gate]
 *
 * Compares the assembled spec to the last-published revision and classifies
 * the change as none/patch/editorial/minor/major, reporting requirements
 * added/removed/modified. `--base <ref>` classifies against the given git ref
 * instead of `origin/main` (useful on an unpushed branch). Exit codes: 0 =
 * classified (in/out of sync), 1 = unknown server.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { extractH2Headings, changedReqBodies } from "./lib/parse-spec.js";
import { classifyDelta } from "./lib/spec-delta-classify.js";
import { SERVERS } from "./lib/servers.js";

const root = join(import.meta.dirname, "..");

const SPEC_PATH = join(root, "holonovel.md");

const server = process.argv.includes("--server")
  ? process.argv[process.argv.indexOf("--server") + 1]
  : SERVERS[0];
const baseRef = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : null;

if (baseRef && !/^[A-Za-z0-9._/~^:-]+$/.test(baseRef)) {
  console.error(`Invalid --base ref: ${baseRef}`);
  process.exit(1);
}

if (!SERVERS.includes(server)) {
  console.error(`Usage: npm run spec-delta -- --server <${SERVERS.join("|")}>`);
  process.exit(1);
}

const SERVER_DIR = join(root, server);
const DECISIONS_PATH = join(SERVER_DIR, "DECISIONS.md");

function sha256(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function grepInFile(filePath: string, pattern: RegExp): string | null {
  const match = readFileSync(filePath, "utf-8").match(pattern);
  return match ? (match[1] ?? null) : null;
}

interface DeltaReport {
  in_sync: boolean;
  current_hash: string;
  stored_hash: string | null;
  classification: "none" | "patch" | "editorial" | "minor" | "major";
  spec_modified: boolean;
  requirements_changed: { added: string[]; removed: string[]; modified: string[] };
  version_changed: { from: string | null; to: string };
  sections_changed: string[];
  raw_diff_lines: number;
}

const report: DeltaReport = {
  in_sync: true,
  current_hash: sha256(SPEC_PATH),
  stored_hash: null,
  classification: "none",
  spec_modified: false,
  requirements_changed: { added: [], removed: [], modified: [] },
  version_changed: { from: null, to: "" },
  sections_changed: [],
  raw_diff_lines: 0,
};

// Run git without a shell so a ref or path can never be interpreted as a
// command fragment (CR-17).
function gitOut(args: string[], maxBuffer = 64 * 1024 * 1024): string | null {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf-8",
      timeout: 10000,
      maxBuffer,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function lastPublishedSpec(baseRef: string | null): string | null {
  const refs = baseRef ? [baseRef] : ["origin/main", "HEAD"];
  for (const ref of refs) {
    const out = gitOut(["show", `${ref}:holonovel.md`]);
    if (out && out.trim()) return out;
  }
  if (!baseRef) {
    const rev = gitOut(["rev-list", "-n", "1", "HEAD", "--", "holonovel.md"])?.trim();
    if (rev) {
      const out = gitOut(["show", `${rev}:holonovel.md`]);
      if (out && out.trim()) return out;
    }
  }
  return null;
}

function lastPublishedStoredHash(baseRef: string | null): string | null {
  const refs = baseRef ? [baseRef] : ["origin/main", "HEAD"];
  for (const ref of refs) {
    const out = gitOut(["show", `${ref}:holonovel/DECISIONS.md`], 1024 * 1024);
    const m = out?.match(/\*\*Spec hash:\*\*\s*([a-f0-9]+)/m);
    if (m) return m[1];
  }
  return null;
}

function hasEditorialDisposition(decisions: string, modified: string[]): boolean {
  const editorial = decisions.match(/\| Delta class\s*\|\s*editorial\s*\|/i);
  if (!editorial) return false;
  // The Editorial disposition must name the repaired REQ set.
  const repaired = decisions.match(/Repaired REQ set[^\n]*/i)?.[0] ?? "";
  const named: string[] = [...repaired.matchAll(/REQ-([0-9]+[a-z0-9]*)/gi)].map(mm => mm[1]);
  return modified.every(id => named.some(n => n === id || n === id.replace(/[a-z0-9]+$/, "")));
}

const decisions = readFileSync(DECISIONS_PATH, "utf-8");
const workingStored = grepInFile(DECISIONS_PATH, /\*\*Spec hash:\*\*\s*([a-f0-9]+)/m);
report.stored_hash = lastPublishedStoredHash(baseRef) ?? workingStored;

const rootPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
report.version_changed.to = rootPkg.version;

report.in_sync = report.current_hash === report.stored_hash;

if (!report.in_sync) {
  report.spec_modified = true;

  let specModified = false;
  const baseRev = gitOut(["rev-parse", "main"])?.trim() ?? "HEAD";
  const diff = gitOut(["diff", baseRev, "--", "holonovel.md"]) ?? gitOut(["diff", "HEAD", "--", "holonovel.md"]);
  if (diff && diff.trim()) {
    specModified = true;
    report.raw_diff_lines = diff.split("\n").length;
  }

  if (!specModified) {
    const staged = gitOut(["diff", "--cached", "--", "holonovel.md"]);
    if (staged && staged.trim()) {
      specModified = true;
      report.raw_diff_lines = staged.split("\n").length;
    }
  }

  const currentSpec = readFileSync(SPEC_PATH, "utf-8");

  const currentReqs = [...currentSpec.matchAll(/\*\*REQ-([0-9]+[a-z0-9]*)/g)].map(m => m[1]);
  const currentSections = extractH2Headings(currentSpec).map(h => h.split(" ")[0]);

  const storedSpec = lastPublishedSpec(baseRef);

  if (storedSpec) {
    const storedReqs = [...storedSpec.matchAll(/\*\*REQ-([0-9]+[a-z0-9]*)/g)].map(m => m[1]);
    const storedSections = extractH2Headings(storedSpec).map(h => h.split(" ")[0]);

    report.requirements_changed.added = currentReqs.filter(r => !storedReqs.includes(r));
    report.requirements_changed.removed = storedReqs.filter(r => !currentReqs.includes(r));

    report.requirements_changed.modified = changedReqBodies(currentSpec, storedSpec);

    report.sections_changed = currentSections.filter(s => !storedSections.includes(s));
  }

  report.classification = classifyDelta({
    added: report.requirements_changed.added,
    removed: report.requirements_changed.removed,
    modified: report.requirements_changed.modified,
    sectionsChanged: report.sections_changed,
    editorial: hasEditorialDisposition(decisions, report.requirements_changed.modified),
  });
}

const reportOnly = process.argv.includes("--report-only");

console.log(JSON.stringify(report, null, 2));

if (reportOnly) {
  console.error(`\nSpec delta: ${report.classification.toUpperCase()}${report.in_sync ? " (already in sync)" : ""}`);
  process.exit(0);
}

if (!report.in_sync) {
  console.error(`\nSpec delta detected: ${report.classification.toUpperCase()}`);
  process.exit(1);
} else {
  console.error("\nServer in sync with spec.");
  process.exit(0);
}
