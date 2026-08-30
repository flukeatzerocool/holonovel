#!/usr/bin/env npx tsx
/**
 * spec-propagate.ts — copy the assembled spec into each server directory. [build tool]
 *
 * Mirrors holonovel.md into each server's holonovel.md so the embedded copy
 * stays in sync. Exit codes: 0 = propagated, 1 = a target directory missing.
 */
import { copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { SERVERS } from "./lib/servers.js";

const root = join(import.meta.dirname, "..");

const SOURCE = join(root, "holonovel.md");
const TARGETS = SERVERS.map((s) => join(root, s, "holonovel.md"));

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

console.log("\nSpec propagated to server.");
process.exit(0);
