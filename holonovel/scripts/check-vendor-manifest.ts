#!/usr/bin/env npx tsx
/**
 * check-vendor-manifest.ts — verify the vendor content manifest. [gate]
 *
 * Purpose: recompute each module's SHA-256 content hash from the source file
 * named in narrative_world_model/MANIFEST.md and report match/mismatch per row,
 * so the builder can trust the manifest's pre-verified confidence distributions
 * and term-anchoring scores (REQ-451, §11.4). It also requires every row to
 * carry an absolute `https://` Source URL, the provenance §11.4 admits a
 * vendored row by (REQ-451a, Appendix U rule (c)). The column is located by
 * header name, so inserting a column cannot shift the hash column. The
 * MANIFEST.md "File" column is relative to narrative_world_model/narrative/.
 *
 * Provenance is checked on every row before the content-hash guard, so a row
 * whose confidence fields are still `(build-time)` cannot skip the URL check.
 *
 * Exit codes: 0 = all hashes match and every row carries a URL (or none are
 * recorded), 1 = a hash mismatch, a missing source file, or a missing/malformed
 * URL (under --strict), 2 = fatal (unreadable manifest or no parseable rows).
 * Without --strict the findings go to stdout and exit is 0.
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
    "check-vendor-manifest.ts — verify narrative_world_model/MANIFEST.md hashes and provenance.\n" +
      "Usage: npx tsx scripts/check-vendor-manifest.ts [--strict]\n" +
      "  --strict  exit 1 on any hash mismatch, missing source file, or missing/malformed Source URL"
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
  url: string;
  line: number;
}

// Header-indexed so a new column cannot silently shift the hash column.
const lines = manifestText.split("\n");
const headerIndex = lines.findIndex((line) => /^\|\s*Source\s*\|/.test(line));
if (headerIndex === -1) {
  console.error("FATAL: MANIFEST.md has no '| Source |' header row");
  process.exit(2);
}
const columns = new Map<string, number>();
lines[headerIndex]
  .split("|")
  .map((cell) => cell.trim())
  .forEach((cell, i) => {
    if (cell) columns.set(cell.toLowerCase(), i);
  });
for (const required of ["source", "module", "file", "content hash", "source url"]) {
  if (!columns.has(required)) {
    console.error(`FATAL: MANIFEST.md header is missing the '${required}' column`);
    process.exit(2);
  }
}
const cell = (cells: string[], name: string): string => cells[columns.get(name)!] ?? "";

const rows: Row[] = [];
for (let i = headerIndex + 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.startsWith("|")) continue;
  if (/^\|[\s-]+\|/.test(line)) continue;
  const cells = line.split("|").map((c) => c.trim());
  const file = cell(cells, "file");
  if (!file) continue;
  rows.push({
    source: cell(cells, "source"),
    module: cell(cells, "module"),
    file,
    expected: cell(cells, "content hash"),
    url: cell(cells, "source url"),
    line: i + 1,
  });
}

if (rows.length === 0) {
  console.error("FATAL: no data rows parsed from MANIFEST.md");
  process.exit(2);
}

// Provenance first: every row, including those whose hash is still
// `(build-time)`, must name its upstream source (REQ-451a).
const URL_SHAPE = /^https:\/\/[^\s|]+$/;
let noUrlCount = 0;
let badUrlCount = 0;
for (const row of rows) {
  if (!row.url) {
    console.log(`NOURL    ${row.file}  (${row.source} / ${row.module})  line ${row.line}`);
    noUrlCount++;
    continue;
  }
  if (!URL_SHAPE.test(row.url)) {
    console.log(`BADURL   ${row.file}  (${row.source} / ${row.module})  line ${row.line}\n    not an absolute https URL: ${row.url}`);
    badUrlCount++;
  }
}

let mismatchCount = 0;
let missingCount = 0;
let checkedCount = 0;
for (const row of rows) {
  if (row.expected === "(build-time)" || !row.expected) continue;
  checkedCount++;
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

console.log(
  `\n${rows.length} row(s): provenance ${rows.length - noUrlCount - badUrlCount} ok, ${noUrlCount} missing, ${badUrlCount} malformed; ` +
    `${checkedCount} hash(es) checked: ${checkedCount - mismatchCount - missingCount} match, ${mismatchCount} mismatch, ${missingCount} missing.`
);
if (strict && (mismatchCount > 0 || missingCount > 0 || noUrlCount > 0 || badUrlCount > 0)) {
  console.error(
    `vendor manifest verification FAILED: ${mismatchCount} mismatch, ${missingCount} missing, ${noUrlCount} missing URL, ${badUrlCount} malformed URL.`
  );
  process.exit(1);
}
process.exit(0);
