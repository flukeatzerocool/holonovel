#!/usr/bin/env npx tsx
/**
 * build-starter-novel.ts — emit the bundled starter Novel artifact. [build tool]
 *
 * Purpose: regenerate `content/torre-nosferatu.json` from its pristine source
 * `content/torre-nosferatu.source.json`, stamping the server's current
 * DATA_FORMAT (REQ-566). Emission is byte-deterministic — the committed
 * artifact is freshness-gated by `check-starter-freshness.ts`.
 *
 * Exit codes: 0 = written (or dry-run), 1 = build error, 2 = fatal.
 *
 * Usage: npx tsx scripts/build-starter-novel.ts [--dry-run] [--help]
 * REQ-566.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { buildStarterArtifact, ARTIFACT_REL } from "./lib/starter-novel.js";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log("Usage: build-starter-novel.ts [--dry-run] [--help]");
  console.log("  --dry-run  Report the target and byte count without writing.");
  process.exit(0);
}
const unknown = argv.filter((a) => a !== "--dry-run");
if (unknown.length > 0) {
  console.error(`Unknown flag: ${unknown[0]}`);
  process.exit(1);
}
const dryRun = argv.includes("--dry-run");

const serverDir = join(import.meta.dirname, "..");
const target = join(serverDir, ARTIFACT_REL);

let artifact: string;
try {
  artifact = buildStarterArtifact(serverDir);
} catch (e) {
  console.error(`Emit failed: ${(e as Error).message}`);
  process.exit(1);
}

if (dryRun) {
  console.log(`[dry-run] would write ${target} (${Buffer.byteLength(artifact)} bytes)`);
  process.exit(0);
}

mkdirSync(join(serverDir, "content"), { recursive: true });
writeFileSync(target, artifact);
console.log(`Wrote ${target} (${Buffer.byteLength(artifact)} bytes)`);
process.exit(0);
