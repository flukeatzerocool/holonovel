import { execSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tests = [
  "test_1_dice.ts", "test_2_data.ts", "test_3_state.ts",
  "test_4_character.ts", "test_5_novel.ts", "test_6_macros.ts",
  "test_7_enrichment.ts", "test_8_lore.ts",
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  const file = path.join(__dirname, test);
  try {
    execSync(`npx tsx ${file}`, { stdio: "inherit", cwd: path.resolve(__dirname, "../..") });
    passed++;
    console.log(`PASS: ${test}`);
  } catch {
    failed++;
    console.error(`FAIL: ${test}`);
  }
}

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
