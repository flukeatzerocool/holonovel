// harness-guard.ts — fail-loud guard for spawned-process test harnesses.
//
// REQ-141m (harness fail-loud). A harness that spawns a server and then awaits
// a call that never resolves when the child crashes can drain its event loop
// and exit 0 with no summary — a silent pass. installHarnessGuard() registers a
// `beforeExit` hook that turns that case into a non-zero exit with a
// diagnostic; harnessComplete() marks a clean completion. The guard never
// overrides an explicit non-zero exit.
//
// Usage:
//   import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
//   installHarnessGuard();
//   // ... tests ...
//   harnessComplete();
//   console.log(`\n${passed} passed, ${failed} failed`);
//
// Exit codes: the host harness's own; the guard only raises a silent drain
// (exit 0 with no completion signal) to exit 1.
import { writeSync } from "node:fs";

let completed = false;
let installed = false;

export function harnessComplete(): void {
  completed = true;
}

export function installHarnessGuard(): void {
  if (installed) return;
  installed = true;
  process.on("beforeExit", (code) => {
    if (completed) return;
    // Synchronous fd write: a queued async write can be lost when the loop is
    // already draining. process.stderr.write is not guaranteed to flush here.
    try {
      writeSync(2, "harness-guard: harness exited before completion — a spawned process likely crashed; treating as failure.\n");
    } catch {
      // stderr closed/unwritable — the non-zero exit below still fails the run.
    }
    process.exitCode = code && code !== 0 ? code : 1;
  });
}
