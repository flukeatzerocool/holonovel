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
const version = target;

interface Edit { path: string; pattern: RegExp; replacement: string; label: string }
const edits: Edit[] = [
  {
    path: join(root, "holonovel", "AGENTS.md"),
    pattern: /^(# AGENTS\.md — .+?\(v).+(\))/m,
    replacement: `$1${version}$2`,
    label: "holonovel/AGENTS.md header",
  },
  {
    path: join(root, "holonovel", "DECISIONS.md"),
    pattern: /^(\| Spec version \| ).+?( \|)/m,
    replacement: `$1${version}$2`,
    label: "holonovel/DECISIONS.md spec version",
  },
  {
    path: join(root, "holonovel", "src", "index.ts"),
    pattern: /^(  version: ").+(",$)/m,
    replacement: `$1${version}$2`,
    label: "holonovel/src/index.ts McpServer version",
  },
];

// Validate every target and pattern BEFORE writing anything, so a stale
// pattern cannot leave the tree half-bumped (CR-27).
let ok = true;
for (const e of edits) {
  if (!readFileSync(e.path, "utf-8").match(e.pattern)) {
    console.error(`  FAIL  ${e.label}: pattern not found`);
    ok = false;
  }
}
const jsonTargets = [
  join(root, "holonovel", "package.json"),
  join(root, "holonovel", "package-lock.json"),
  join(root, "holonovel", "server.json"),
];
for (const p of jsonTargets) {
  try { JSON.parse(readFileSync(p, "utf-8")); }
  catch { console.error(`  FAIL  ${p}: unreadable JSON`); ok = false; }
}
if (!ok) {
  console.error("\nVersion bump FAILED (no files written).");
  process.exit(1);
}

// ── Apply ──
if (target !== rootPkg.version) {
  rootPkg.version = target;
  writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n");
  console.log(`  OK   package.json (root): → ${target}`);
}

const holonovelPkgPath = join(root, "holonovel", "package.json");
const holonovelPkg = JSON.parse(readFileSync(holonovelPkgPath, "utf-8"));
if (holonovelPkg.version !== version) {
  holonovelPkg.version = version;
  writeFileSync(holonovelPkgPath, JSON.stringify(holonovelPkg, null, 2) + "\n");
  console.log(`  OK   holonovel/package.json: → ${version}`);
} else {
  console.log(`  OK   holonovel/package.json: already ${version}`);
}

for (const e of edits) {
  const content = readFileSync(e.path, "utf-8");
  const updated = content.replace(e.pattern, e.replacement);
  if (updated === content) {
    console.log(`  OK   ${e.label}: already ${version}`);
    continue;
  }
  writeFileSync(e.path, updated);
  console.log(`  OK   ${e.label}: → ${version}`);
}

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

console.log(`\nAll version references bumped to ${version}.`);
process.exit(0);
