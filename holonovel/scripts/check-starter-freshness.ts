#!/usr/bin/env npx tsx
/**
 * check-starter-freshness.ts — bundled starter artifact freshness gate. [gate]
 *
 * Purpose: fail when the committed `content/torre-nosferatu.json` drifts from a
 * fresh emit of its source under the server's current DATA_FORMAT (REQ-566).
 * Comparison ignores `spec_version` (advances every release) and `_checksum`;
 * DATA_FORMAT and all content must match. Wired into `check` and `check:fast`.
 *
 * Exit codes: 0 = fresh, 1 = drift, 2 = fatal (unreadable source/artifact).
 *
 * Usage: npx tsx scripts/check-starter-freshness.ts [--help]
 * REQ-566.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildStarterArtifact, canonicalStarter, ARTIFACT_REL } from "./lib/starter-novel.js";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: check-starter-freshness.ts");
  console.log("  Fails when content/torre-nosferatu.json is stale versus a fresh emit.");
  process.exit(0);
}

const serverDir = join(import.meta.dirname, "..");
const target = join(serverDir, ARTIFACT_REL);

if (!existsSync(target)) {
  console.error(`FAIL: starter artifact missing: ${target}`);
  console.error("      run: npm run build:starter-novel");
  process.exit(1);
}

let committed: string;
let fresh: string;
try {
  committed = readFileSync(target, "utf-8");
  fresh = buildStarterArtifact(serverDir);
} catch (e) {
  console.error(`FATAL: ${(e as Error).message}`);
  process.exit(2);
}

if (canonicalStarter(committed) !== canonicalStarter(fresh)) {
  console.error("FAIL: starter artifact is stale — regenerate with: npm run build:starter-novel");
  process.exit(1);
}

console.log("PASS: starter artifact is fresh");
process.exit(0);
