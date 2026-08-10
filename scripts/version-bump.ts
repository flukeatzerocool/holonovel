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

const pkgPath = join(root, "dnd5e-holonovel", "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`  OK   dnd5e-holonovel/package.json: → ${version}`);

ok = replaceInFile(
  join(root, "dnd5e-holonovel", "DECISIONS.md"),
  /(\*\*Spec version:\*\*\s*).+/m,
  `$1${version}`,
  "dnd5e-holonovel/DECISIONS.md spec version"
) && ok;

ok = replaceInFile(
  join(root, "dnd5e-holonovel", "AGENTS.md"),
  /^(# AGENTS\.md — .+?\(v).+(\))/m,
  `$1${version}$2`,
  "dnd5e-holonovel/AGENTS.md header"
) && ok;

ok = replaceInFile(
  join(root, "dnd5e-holonovel", "README.md"),
  /(Holonovel\]\([^)]+\)\s+v).+(\.)/m,
  `$1${version}$2`,
  "dnd5e-holonovel/README.md"
) && ok;

if (!ok) {
  console.error("\nVersion bump FAILED.");
  process.exit(1);
}

console.log(`\nAll version references bumped to ${version}.`);
process.exit(0);
