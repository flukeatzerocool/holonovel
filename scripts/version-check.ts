#!/usr/bin/env npx tsx
/**
 * version-check.ts — verify version references are in sync. [gate]
 *
 * Checks that holonovel/package.json, AGENTS.md, DECISIONS.md, src/index.ts,
 * and the lockfile all match the root package.json version, and that the
 * version is not stale against the CHANGELOG (REQ-107a). Exit codes: 0 = in
 * sync, 1 = a mismatch or stale version.
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseValueFlag, handleHelp, rejectUnknown } from "./lib/args.js";
import { validateManifest, unsupportedKeywords } from "./lib/server-manifest.js";

const USAGE =
  "version-check.ts — verify version references are in sync.\n" +
  "Usage: npx tsx scripts/version-check.ts [--root <dir>]\n" +
  "  --root <dir>  read package.json and CHANGELOG.md from <dir> (default: the repo root).\n" +
  "                Every other referenced file is still read from the repo.\n";

const root = join(import.meta.dirname, "..");

const argv = process.argv.slice(2);
handleHelp(argv, USAGE);
rejectUnknown(argv, new Set(["--root", "--help", "-h"]), USAGE);
// The root override exists so a harness can exercise the currency branch against a
// scratch package.json/CHANGELOG.md pair; it must not move the version-reference
// checks, which read the repo's own files.
const rootArg = parseValueFlag(argv, "--root");
if (argv.includes("--root") && rootArg === null) {
  console.error("--root requires a directory");
  process.exit(1);
}
const versionRoot = rootArg ? resolve(rootArg) : root;

const rootPkg = JSON.parse(readFileSync(join(versionRoot, "package.json"), "utf-8"));
const rootVersion = rootPkg.version;

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function grepVersion(filePath: string, pattern: RegExp): string | null {
  const content = readFileSync(filePath, "utf-8");
  const match = content.match(pattern);
  return match ? match[1] : null;
}

function check(label: string, value: string | null, expected: string): boolean {
  if (value === expected) {
    console.log(`  OK  ${label}: ${value}`);
    return true;
  }
  console.error(`  FAIL  ${label}: expected ${expected}, got ${value ?? "null"}`);
  return false;
}

function checkFileContains(filePath: string, patterns: string[], label: string): boolean {
  const content = readFileSync(filePath, "utf-8");
  const missing = patterns.filter(p => !content.includes(p));
  if (missing.length === 0) {
    console.log(`  OK  ${label}`);
    return true;
  }
  console.error(`  FAIL  ${label}: missing expected patterns`);
  return false;
}

let ok = true;

// ── holonovel ──

const holoPkg = readJson(join(root, "holonovel", "package.json"));
ok = check("holonovel/package.json", holoPkg.version as string, rootVersion) && ok;

const holoAgentsVersion = grepVersion(
  join(root, "holonovel", "AGENTS.md"),
  /^# AGENTS\.md.*\(v(.+)\)/m
);
ok = check("holonovel/AGENTS.md", holoAgentsVersion, rootVersion) && ok;

const holoDecisionsVersion = grepVersion(
  join(root, "holonovel", "DECISIONS.md"),
  /^\| Spec version \| (.+) \|/m
);
ok = check("holonovel/DECISIONS.md", holoDecisionsVersion, rootVersion) && ok;

const coordinationIssues = checkVersionCoordination(rootVersion as string, holoDecisionsVersion);
if (coordinationIssues.length > 0) {
  for (const issue of coordinationIssues) console.error(`  FAIL  ${issue}`);
  ok = false;
} else {
  console.log("  OK  REQ-107b version coordination (T106): CalVer shape and DECISIONS §2 agree");
}

const holoIndexVersion = grepVersion(
  join(root, "holonovel", "src", "index.ts"),
  /^\s+version: "(.+)"[,;]?$/m
);
ok = check("holonovel/src/index.ts", holoIndexVersion, rootVersion) && ok;

const holoLock = readJson(join(root, "holonovel", "package-lock.json"));
const holoLockVersion = holoLock.version as string | undefined;
const holoLockPkgVersion =
  (holoLock.packages as Record<string, { version?: string }> | undefined)?.[""]?.version;
ok = check("holonovel/package-lock.json (root)", holoLockVersion ?? null, rootVersion) && ok;
ok = check("holonovel/package-lock.json (packages[\"\"])", holoLockPkgVersion ?? null, rootVersion) && ok;

ok = checkFileContains(
  join(root, "holonovel", "src", "core", "state.ts"),
  ["SPEC_VERSION", "JSON.parse", "readFileSync", "package.json"],
  "holonovel/src/core/state.ts: reads version dynamically"
) && ok;

// server.json carries the npm-canonical version (leading zeros stripped), which
// is the form the MCP registry's npm validator resolves. Compare against the
// normalized root version, not the padded CalVer.
const npmCanonical = (v: string): string =>
  v.split(".").map((p, i) => (i === 0 ? p : String(parseInt(p, 10)))).join(".");

const holoServerJson = readJson(join(root, "holonovel", "server.json"));
ok = check(
  "holonovel/server.json",
  holoServerJson.version as string,
  npmCanonical(rootVersion)
) && ok;
const holoServerPackages = holoServerJson.packages as
  | Array<{ version?: string }>
  | undefined;
ok = check(
  "holonovel/server.json packages[0].version",
  holoServerPackages?.[0]?.version ?? null,
  npmCanonical(rootVersion)
) && ok;

// REQ-428 — the manifest must also satisfy the vendored registry schema, not
// only carry matching version strings. Fail closed on an unreadable schema.
const manifestSchema = readJson(join(root, "holonovel", "schemas", "mcp-server.schema.json"));
const unsupported = unsupportedKeywords(manifestSchema);
if (unsupported.length > 0) {
  console.error(`  FAIL  holonovel/server.json schema: validator does not implement ${unsupported.join(", ")}`);
  ok = false;
}
const manifestValidation = validateManifest(holoServerJson, manifestSchema);
if (manifestValidation.ok) {
  console.log("  OK  holonovel/server.json: valid against the registry schema");
} else {
  console.error("  FAIL  holonovel/server.json: registry schema validation failed");
  for (const error of manifestValidation.errors.slice(0, 5)) console.error(`        ${error}`);
  ok = false;
}

// ── REQ-107b: version coordination (T106) ──

// T106 — the clauses this function owns: the root version is a CalVer
// date-stamp, it names a real calendar date, and the DECISIONS §2 Pinned
// Versions row (the value `spec_health.spec_version` reports) matches it. The
// live-server clauses are recorded as unclaimed in the increment's
// dispositions.md.
function checkVersionCoordination(rootVersion: string, decisionsVersion: string | null): string[] {
  const issues: string[] = [];
  if (!/^\d{4}\.\d{2}\.\d{2}$/.test(rootVersion)) {
    issues.push(`T106 — root package.json version ${rootVersion} is not a CalVer date-stamp (YYYY.MM.DD).`);
    return issues;
  }
  const [year, month, day] = rootVersion.split(".").map(Number) as [number, number, number];
  const stamp = new Date(Date.UTC(year, month - 1, day));
  if (stamp.getUTCFullYear() !== year || stamp.getUTCMonth() !== month - 1 || stamp.getUTCDate() !== day) {
    issues.push(`T106 — root package.json version ${rootVersion} is not a real calendar date.`);
  }
  if (decisionsVersion !== rootVersion) {
    issues.push(`T106 — DECISIONS.md §2 Pinned Versions reads ${decisionsVersion ?? "nothing"}; expected ${rootVersion}.`);
  }
  return issues;
}

// ── REQ-107a: version currency vs CHANGELOG ──

// T493 — both clauses of the row: a version older than the latest dated entry is
// an issue, and an equal-or-newer version is not. Declared with an explicit
// `string[]` return so the evidence scan reads the label (req-checks:812-823).
function checkVersionCurrency(rootVersion: string, changelog: string): string[] {
  const issues: string[] = [];
  const dated = [...changelog.matchAll(/^##\s+(\d{4})-(\d{2})-(\d{2})\b/gm)]
    .map(m => `${m[1]}.${m[2]}.${m[3]}`)
    .sort()
    .pop();
  if (dated && rootVersion < dated) {
    issues.push(`T493 — version currency: root version ${rootVersion} predates the latest substantive CHANGELOG entry (${dated}).`);
    issues.push(`REQ-107a requires the CalVer to match the last substantive change date; bump to ${dated} first.`);
  }
  return issues;
}

const changelog = readFileSync(join(versionRoot, "CHANGELOG.md"), "utf-8");
const currencyIssues = checkVersionCurrency(rootVersion, changelog);
if (currencyIssues.length > 0) {
  for (const issue of currencyIssues) console.error(`  FAIL  ${issue}`);
  ok = false;
} else {
  const latest = [...changelog.matchAll(/^##\s+(\d{4})-(\d{2})-(\d{2})\b/gm)]
    .map(m => `${m[1]}.${m[2]}.${m[3]}`)
    .sort()
    .pop();
  if (latest) console.log(`  OK   version currency: ${rootVersion} >= latest CHANGELOG entry ${latest}`);
}

if (!ok) {
  console.error("\nVersion sync FAILED. Update all version references to match root package.json.");
  console.error("Root package.json version:", rootVersion);
  process.exit(1);
}

console.log("\nVersion sync OK. Root version:", rootVersion);
process.exit(0);
