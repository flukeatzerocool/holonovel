import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

ok = checkFileContains(
  join(root, "holonovel", "src", "core", "state.ts"),
  ["SPEC_VERSION", "JSON.parse", "readFileSync", "package.json"],
  "holonovel/src/core/state.ts: reads version dynamically"
) && ok;

if (!ok) {
  console.error("\nVersion sync FAILED. Update all version references to match root package.json.");
  console.error("Root package.json version:", rootVersion);
  process.exit(1);
}

console.log("\nVersion sync OK. Root version:", rootVersion);
process.exit(0);
