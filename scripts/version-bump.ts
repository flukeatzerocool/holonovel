#!/usr/bin/env npx tsx
/**
 * version-bump.ts — sync version references across the repo to root package.json. [build tool]
 *
 * Bumps holonovel/package.json, AGENTS.md, DECISIONS.md, src/index.ts, and the
 * lockfile to the root version. Exit codes: 0 = bumped, 1 = a pattern not found.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

const rootPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const version = rootPkg.version;

function replaceInFile(filePath: string, pattern: RegExp, replacement: string, label: string): boolean {
  const content = readFileSync(filePath, "utf-8");
  if (!content.match(pattern)) {
    console.error(`  FAIL  ${label}: pattern not found`);
    return false;
  }
  const updated = content.replace(pattern, replacement);
  writeFileSync(filePath, updated);
  console.log(`  OK   ${label}: → ${version}`);
  return true;
}

function bumpPkgVersion(serverDir: string, label: string): boolean {
  const pkgPath = join(root, serverDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  pkg.version = version;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`  OK   ${label}: → ${version}`);
  return true;
}

let ok = true;

// ── holonovel ──

ok = bumpPkgVersion("holonovel", "holonovel/package.json") && ok;

ok = replaceInFile(
  join(root, "holonovel", "AGENTS.md"),
  /^(# AGENTS\.md — .+?\(v).+(\))/m,
  `$1${version}$2`,
  "holonovel/AGENTS.md header"
) && ok;

ok = replaceInFile(
  join(root, "holonovel", "DECISIONS.md"),
  /^(\| Spec version \| ).+?( \|)/m,
  `$1${version}$2`,
  "holonovel/DECISIONS.md spec version"
) && ok;

ok = replaceInFile(
  join(root, "holonovel", "src", "index.ts"),
  /^(  version: ").+(",$)/m,
  `$1${version}$2`,
  "holonovel/src/index.ts McpServer version"
) && ok;

// Sync the lockfile's embedded version fields (root and packages[""] entry)
// so the REQ-313 lockfile fingerprint stays consistent with package.json.
const lockPath = join(root, "holonovel", "package-lock.json");
const lock = JSON.parse(readFileSync(lockPath, "utf-8"));
if (lock.version !== version || (lock.packages && lock.packages[""] && lock.packages[""].version !== version)) {
  lock.version = version;
  if (lock.packages && lock.packages[""] && "version" in lock.packages[""]) {
    lock.packages[""].version = version;
  }
  writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
  console.log(`  OK   holonovel/package-lock.json: → ${version}`);
} else {
  console.log(`  OK   holonovel/package-lock.json: already ${version}`);
}

if (!ok) {
  console.error("\nVersion bump FAILED.");
  process.exit(1);
}

console.log(`\nAll version references bumped to ${version}.`);
process.exit(0);
