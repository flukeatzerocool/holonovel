#!/usr/bin/env node
// Harness fail-loud meta-test — REQ-141m.
//
// Proves that a harness which spawns a process, lets it exit, and then drains
// with no completion signal exits NON-ZERO with the harness-guard diagnostic,
// while a harness that signals completion exits zero silently. Gate role:
// exits non-zero on failure. Exit codes: 0 = pass, 1 = assertion failure,
// 2 = unexpected fatal error.

import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const GUARD_HREF = new URL("./lib/harness-guard.ts", import.meta.url).href;
const ROOT = join(import.meta.dirname!, "..");

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`PASS ${name}`); }
  catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); }
}

function runFixture(body: string): Promise<{ code: number; stderr: string }> {
  const dir = mkdtempSync(join(tmpdir(), "harness-guard-"));
  const file = join(dir, "fixture.ts");
  writeFileSync(file, body);
  return new Promise((resolve) => {
    const p = spawn("npx", ["tsx", file], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    p.stderr.on("data", (d) => { stderr += d.toString(); });
    p.on("exit", (code) => {
      rmSync(dir, { recursive: true, force: true });
      resolve({ code: code ?? -1, stderr });
    });
  });
}

async function main() {
  await test("T627/REQ-141m: a harness that drains without completing fails loud", async () => {
    const crash = await runFixture(`
import { installHarnessGuard } from ${JSON.stringify(GUARD_HREF)};
import { spawn } from "node:child_process";
installHarnessGuard();
async function main() {
  spawn(process.execPath, ["-e", "0"], { stdio: "ignore" });
  await new Promise(() => {});
}
main().catch(() => process.exit(2));
`);
    if (crash.code === 0) throw new Error("silent-drain harness exited zero");
    if (!crash.stderr.includes("harness-guard:")) throw new Error(`no diagnostic emitted: ${JSON.stringify(crash.stderr.slice(0, 200))}`);
  });

  await test("T627/REQ-141m: a harness that completes exits zero without the diagnostic", async () => {
    const clean = await runFixture(`
import { installHarnessGuard, harnessComplete } from ${JSON.stringify(GUARD_HREF)};
import { spawn } from "node:child_process";
installHarnessGuard();
spawn(process.execPath, ["-e", "0"], { stdio: "ignore" });
harnessComplete();
`);
    if (clean.code !== 0) throw new Error(`clean harness exited ${clean.code}`);
    if (clean.stderr.includes("harness-guard:")) throw new Error("diagnostic emitted on clean completion");
  });

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(2); });
