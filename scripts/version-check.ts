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
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

const rootPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
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

// ── REQ-107a: version currency vs CHANGELOG ──

const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf-8");
const dated = [...changelog.matchAll(/^##\s+(\d{4})-(\d{2})-(\d{2})\b/gm)]
  .map(m => `${m[1]}.${m[2]}.${m[3]}`)
  .sort()
  .pop();
if (dated && rootVersion < dated) {
  console.error(`  FAIL  version currency: root version ${rootVersion} predates the latest substantive CHANGELOG entry (${dated}).`);
  console.error(`        REQ-107a requires the CalVer to match the last substantive change date; bump to ${dated} first.`);
  ok = false;
} else if (dated) {
  console.log(`  OK   version currency: ${rootVersion} >= latest CHANGELOG entry ${dated}`);
}

if (!ok) {
  console.error("\nVersion sync FAILED. Update all version references to match root package.json.");
  console.error("Root package.json version:", rootVersion);
  process.exit(1);
}

console.log("\nVersion sync OK. Root version:", rootVersion);
process.exit(0);
