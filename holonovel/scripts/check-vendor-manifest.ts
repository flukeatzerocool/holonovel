#!/usr/bin/env npx tsx
/**
 * check-vendor-manifest.ts — verify the vendor content manifest. [gate]
 *
 * Purpose: recompute each module's SHA-256 content hash from the source file
 * named in narrative_world_model/MANIFEST.md and report match/mismatch per row,
 * so the builder can trust the manifest's pre-verified confidence distributions
 * and term-anchoring scores (REQ-451, §11.4). The MANIFEST.md "File" column is
 * relative to narrative_world_model/narrative/.
 *
 * Exit codes: 0 = all hashes match (or none recorded), 1 = a mismatch or a
 * missing source file (under --strict), 2 = fatal (unreadable manifest).
 * Without --strict the mismatch report goes to stdout and exit is 0.
 *
 * Usage: npx tsx scripts/check-vendor-manifest.ts [--strict]
 */

import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const NARRATIVE_DIR = join(ROOT, "narrative_world_model", "narrative");
const MANIFEST_PATH = join(ROOT, "narrative_world_model", "MANIFEST.md");

const strict = process.argv.includes("--strict");
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(
    "check-vendor-manifest.ts — verify narrative_world_model/MANIFEST.md hashes.\n" +
      "Usage: npx tsx scripts/check-vendor-manifest.ts [--strict]\n" +
      "  --strict  exit 1 on any hash mismatch or missing source file"
  );
  process.exit(0);
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

let manifestText: string;
try {
  manifestText = readFileSync(MANIFEST_PATH, "utf-8");
} catch {
  console.error(`FATAL: cannot read ${MANIFEST_PATH}`);
  process.exit(2);
}

interface Row {
  source: string;
  module: string;
  file: string;
  expected: string;
}

const rows: Row[] = [];
for (const line of manifestText.split("\n")) {
  const cells = line.split("|").map((c) => c.trim());
  if (cells.length < 6) continue;
  const [ , source, module, file, hash ] = cells;
  if (!file || file === "File" || file.startsWith("-")) continue;
  if (hash === "(build-time)") continue;
  rows.push({ source, module, file, expected: hash });
}

if (rows.length === 0) {
  console.error("FATAL: no hash-bearing rows parsed from MANIFEST.md");
  process.exit(2);
}

let mismatchCount = 0;
let missingCount = 0;
for (const row of rows) {
  const path = join(NARRATIVE_DIR, row.file);
  if (!existsSync(path)) {
    console.log(`MISSING  ${row.file}  (${row.source} / ${row.module})`);
    missingCount++;
    continue;
  }
  const actual = sha256(readFileSync(path, "utf-8"));
  if (actual === row.expected) {
    console.log(`OK       ${row.file}  (${row.source} / ${row.module})`);
  } else {
    console.log(`MISMATCH ${row.file}  (${row.source} / ${row.module})\n    expected ${row.expected}\n    actual   ${actual}`);
    mismatchCount++;
  }
}

const total = rows.length;
console.log(`\n${total} module hash(es) checked: ${total - mismatchCount - missingCount} match, ${mismatchCount} mismatch, ${missingCount} missing.`);
if (strict && (mismatchCount > 0 || missingCount > 0)) {
  console.error(`vendor manifest verification FAILED: ${mismatchCount} mismatch, ${missingCount} missing.`);
  process.exit(1);
}
process.exit(0);
