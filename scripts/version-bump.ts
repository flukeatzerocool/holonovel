#!/usr/bin/env npx tsx
/**
 * version-bump.ts — sync version references across the repo to the CalVer. [build tool]
 *
 * Targets the later of the root version and the latest dated CHANGELOG entry
 * (REQ-107a), writes it to root package.json, then bumps holonovel/package.json,
 * AGENTS.md, DECISIONS.md, src/index.ts, the lockfile, and server.json.
 * Exit codes: 0 = bumped, 1 = a pattern not found.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

const rootPkgPath = join(root, "package.json");
const rootPkg = JSON.parse(readFileSync(rootPkgPath, "utf-8"));

// REQ-107a — the CalVer must match the latest dated CHANGELOG entry. Compute
// the target as the later of the current root version and that date, and write
// it back to root package.json, so adding a CHANGELOG entry advances every
// reference in one run without a manual root bump.
function latestChangelogDate(): string | null {
  const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf-8");
  const dates = [...changelog.matchAll(/^##\s+(\d{4})-(\d{2})-(\d{2})\b/gm)]
    .map((m) => `${m[1]}.${m[2]}.${m[3]}`)
    .sort();
  return dates.length > 0 ? dates[dates.length - 1] : null;
}

const target = (() => {
  const changelogDate = latestChangelogDate();
  const current = rootPkg.version as string;
  return changelogDate && changelogDate > current ? changelogDate : current;
})();
if (target !== rootPkg.version) {
  rootPkg.version = target;
  writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n");
  console.log(`  OK   package.json (root): → ${target}`);
}
const version = target;

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

// server.json carries the npm-canonical version (leading zeros stripped), the
// form the MCP registry's npm validator resolves and version-check.ts compares.
const npmCanonical = (v: string): string =>
  v.split(".").map((p, i) => (i === 0 ? p : String(parseInt(p, 10)))).join(".");
const serverPath = join(root, "holonovel", "server.json");
const server = JSON.parse(readFileSync(serverPath, "utf-8"));
const canonical = npmCanonical(version);
let serverChanged = false;
if (server.version !== canonical) { server.version = canonical; serverChanged = true; }
if (server.packages?.[0] && server.packages[0].version !== canonical) {
  server.packages[0].version = canonical;
  serverChanged = true;
}
if (serverChanged) {
  writeFileSync(serverPath, JSON.stringify(server, null, 2) + "\n");
  console.log(`  OK   holonovel/server.json: → ${canonical}`);
} else {
  console.log(`  OK   holonovel/server.json: already ${canonical}`);
}

if (!ok) {
  console.error("\nVersion bump FAILED.");
  process.exit(1);
}

console.log(`\nAll version references bumped to ${version}.`);
process.exit(0);
