import { copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const SOURCE = join(root, "holonovel.md");
const TARGETS = [
  join(root, "holonovel", "holonovel.md"),
  join(root, "dnd5e-holonovel", "holonovel.md"),
];

let ok = true;

for (const target of TARGETS) {
  const dir = dirname(target);
  if (!existsSync(dir)) {
    console.error(`  FAIL  ${target}: target directory not found`);
    ok = false;
    continue;
  }
  copyFileSync(SOURCE, target);
  console.log(`  OK   ${target}`);
}

if (!ok) {
  console.error("\nSpec propagation FAILED.");
  process.exit(1);
}

console.log("\nSpec propagated to both servers.");
process.exit(0);
