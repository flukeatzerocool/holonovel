#!/usr/bin/env npx tsx
/**
 * check-fixture-emitter.ts — covered-package freshness gate (REQ-563). [gate]
 *
 * Runs the committed emitter for the one sanctioned reference package
 * (`scripts/ruleset-builds/fixture/build-package.mjs --check`): it emits into a
 * temp directory and compares all six files with the committed package. Any
 * drift fails the gate with the stale file names and the remedy, so a fresh
 * clone cannot carry a package that its own emitter no longer produces.
 *
 * Usage: npx tsx scripts/check-fixture-emitter.ts
 * Exit codes: 0 = committed package is current, 1 = drift/refusal, 2 = fatal.
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const emitter = join(root, "scripts", "ruleset-builds", "fixture", "build-package.mjs");

const result = spawnSync("node", [emitter, "--check"], { cwd: root, encoding: "utf-8" });
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.error) {
  console.error(`check-fixture-emitter: ${result.error.message}`);
  process.exit(2);
}
process.exit(result.status ?? 2);
