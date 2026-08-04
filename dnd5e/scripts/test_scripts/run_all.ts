import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const testDir = resolve(import.meta.dirname || __dirname);
const tests = [
  "test_8.ts",
  "test_9.ts",
  "test_10.ts",
  "test_16.ts",
  "test_22.ts",
  "test_39.ts",
  "test_40.ts",
  "test_43.ts",
  "test_44.ts",
  "test_45.ts",
  "test_62.ts",
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  const testPath = resolve(testDir, test);
  const label = test.replace(".ts", "").toUpperCase();
  process.stdout.write(`${label}... `);

  const result = spawnSync("npx", ["tsx", testPath], {
    cwd: testDir,
    timeout: 30000,
    encoding: "utf-8",
  });

  if (result.error) {
    console.log("FAIL (spawn error)");
    console.log(`  ${result.error.message}`);
    failed++;
    continue;
  }

  const output = result.stdout + result.stderr;

  if (result.status === 0) {
    console.log("PASS");
    passed++;
  } else {
    console.log("FAIL");
    for (const line of output.trim().split("\n")) {
      console.log(`  ${line}`);
    }
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed, ${tests.length} total`);
process.exit(failed > 0 ? 1 : 0);
