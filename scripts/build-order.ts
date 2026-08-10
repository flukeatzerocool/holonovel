import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

interface Step {
  label: string;
  cmd?: string;
  cwd?: string;
  skip?: boolean;
}

function run(label: string, cmd: string, cwd?: string): boolean {
  process.stdout.write(`\n${label} ... `);
  try {
    execSync(cmd, { cwd: cwd ?? root, stdio: "pipe" });
    console.log("OK");
    return true;
  } catch (e: unknown) {
    console.log("FAILED");
    const err = e as { stderr?: Buffer; stdout?: Buffer; status?: number };
    const output = err.stderr?.toString().trim() || err.stdout?.toString().trim() || err.status;
    console.error(`  ${output}`);
    return false;
  }
}

const steps: Step[] = [
  { label: "1. Assemble spec", cmd: "npx tsx scripts/assemble.ts" },
  { label: "2. Check spec", cmd: "npm run check" },
  { label: "3. Propagate spec to servers", cmd: "npx tsx scripts/spec-propagate.ts" },
  { label: "4. Propagate source to dnd5e-holonovel", cmd: "npx tsx scripts/source-propagate.ts" },
  { label: "5. Typecheck holonovel", cmd: "npm run typecheck", cwd: join(root, "holonovel") },
  { label: "6. Typecheck dnd5e-holonovel", cmd: "npm run typecheck", cwd: join(root, "dnd5e-holonovel") },
  { label: "7. Bump versions", cmd: "npx tsx scripts/version-bump.ts" },
  { label: "8. Verify version consistency", cmd: "npx tsx scripts/version-check.ts" },
];

console.log("Holonovel build order\n");

let failed = false;
for (const step of steps) {
  if (!run(step.label, step.cmd!, step.cwd)) {
    failed = true;
    break;
  }
}

if (failed) {
  console.error("\nBuild order FAILED.");
  process.exit(1);
}

console.log("\nBuild order complete. Ready to commit.");
process.exit(0);
