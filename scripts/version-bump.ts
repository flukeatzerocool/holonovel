import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

let ok = true;

const dnd5ePkgPath = join(root, "dnd5e", "package.json");
const dnd5ePkg = JSON.parse(readFileSync(dnd5ePkgPath, "utf-8"));
dnd5ePkg.version = version;
writeFileSync(dnd5ePkgPath, JSON.stringify(dnd5ePkg, null, 2) + "\n");
console.log(`  OK   dnd5e/package.json: → ${version}`);

ok = replaceInFile(
  join(root, "dnd5e", "DECISIONS.md"),
  /(\*\*Spec version:\*\*\s*).+/m,
  `$1${version}`,
  "dnd5e/DECISIONS.md spec version"
) && ok;

ok = replaceInFile(
  join(root, "dnd5e", "AGENTS.md"),
  /^(# AGENTS\.md — .+?\(v).+(\))/m,
  `$1${version}$2`,
  "dnd5e/AGENTS.md header"
) && ok;

ok = replaceInFile(
  join(root, "dnd5e", "README.md"),
  /(Holonovel\]\([^)]+\)\s+v).+(\.)/m,
  `$1${version}$2`,
  "dnd5e/README.md"
) && ok;

if (!ok) {
  console.error("\nVersion bump FAILED.");
  process.exit(1);
}

console.log(`\nAll version references bumped to ${version}.`);
process.exit(0);
