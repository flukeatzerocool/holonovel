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

let ok = true;

const pkg = readJson(join(root, "dnd5e-holonovel", "package.json"));
ok = check("dnd5e-holonovel/package.json", pkg.version as string, rootVersion) && ok;

const decisionsVersion = grepVersion(
  join(root, "dnd5e-holonovel", "DECISIONS.md"),
  /\*\*Spec version:\*\*\s*(.+)/m
);
ok = check("dnd5e-holonovel/DECISIONS.md", decisionsVersion, rootVersion) && ok;

const agentsVersion = grepVersion(
  join(root, "dnd5e-holonovel", "AGENTS.md"),
  /^# AGENTS\.md.*\(v(.+)\)/m
);
ok = check("dnd5e-holonovel/AGENTS.md", agentsVersion, rootVersion) && ok;

const readmeVersion = grepVersion(
  join(root, "dnd5e-holonovel", "README.md"),
  /Holonovel\]\([^)]+\)\s+v(.+)\./
);
ok = check("dnd5e-holonovel/README.md", readmeVersion, rootVersion) && ok;

const decisionsSpecHash = grepVersion(
  join(root, "dnd5e-holonovel", "DECISIONS.md"),
  /\*\*Spec hash:\*\*\s*([a-f0-9]{64})/m
);
if (decisionsSpecHash) {
  console.log(`  OK  dnd5e-holonovel/DECISIONS.md: spec hash present`);
} else {
  console.error(`  FAIL  dnd5e-holonovel/DECISIONS.md: missing spec hash field`);
  ok = false;
}

const stateContent = readFileSync(join(root, "dnd5e-holonovel", "src", "state.ts"), "utf-8");
if (stateContent.includes(`SPEC_VERSION: string = JSON.parse`) &&
    stateContent.includes(`readFileSync`) &&
    stateContent.includes(`package.json`)) {
  console.log(`  OK  dnd5e-holonovel/src/state.ts: reads version dynamically from package.json`);
} else {
  console.error(`  FAIL  dnd5e-holonovel/src/state.ts: must read version dynamically from package.json`);
  ok = false;
}

if (!ok) {
  console.error("\nVersion sync FAILED. Update all version references to match root package.json.");
  console.error("Root package.json version:", rootVersion);
  process.exit(1);
}

console.log("\nVersion sync OK. Root version:", rootVersion);
process.exit(0);
