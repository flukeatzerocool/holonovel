#!/usr/bin/env npx tsx
/**
 * check-gate-table.ts — keep the AGENTS.md gate table equal to the manifest. [gate]
 *
 * Purpose: the documentation drifted to 12 rows while the manifest held 32.
 * The table between the `gate-manifest` markers is generated; this gate fails
 * when it differs from `renderMarkdownTable()`. Regenerate with:
 *   npm run gates -- --list --format=md
 *
 * Usage: npx tsx scripts/check-gate-table.ts
 * Exit codes: 0 = table matches, 1 = drift or missing markers, 2 = fatal.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { handleHelp, rejectUnknown } from "./lib/args.js";
import { renderMarkdownTable } from "./lib/gate-manifest.js";

const ROOT = join(import.meta.dirname, "..");
const AGENTS = join(ROOT, "AGENTS.md");
const START = "<!-- gate-manifest:start";
const END = "<!-- gate-manifest:end -->";

const USAGE = `Usage: npx tsx scripts/check-gate-table.ts

Checks that the generated gate table in AGENTS.md matches the manifest.
Exit codes: 0 = match, 1 = drift, 2 = fatal.
`;

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--help", "-h"]), USAGE);

  const text = readFileSync(AGENTS, "utf-8");
  const startIndex = text.indexOf(START);
  const endIndex = text.indexOf(END);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    console.error(`check-gate-table: AGENTS.md is missing the "${START} … ${END}" markers`);
    process.exit(1);
  }

  const afterStart = text.indexOf("\n", startIndex);
  const actual = text.slice(afterStart + 1, endIndex).trim();
  const expected = renderMarkdownTable().trim();

  if (actual === expected) {
    console.log("PASS: AGENTS.md gate table matches the gate manifest");
    return;
  }

  const actualLines = actual.split("\n");
  const expectedLines = expected.split("\n");
  const limit = Math.max(actualLines.length, expectedLines.length);
  for (let i = 0; i < limit; i++) {
    if (actualLines[i] !== expectedLines[i]) {
      console.error(`check-gate-table: first drift at line ${i + 1}`);
      console.error(`  AGENTS.md: ${actualLines[i] ?? "<missing>"}`);
      console.error(`  manifest:  ${expectedLines[i] ?? "<missing>"}`);
      break;
    }
  }
  console.error("check-gate-table: regenerate the table with `npm run gates -- --list --format=md`");
  process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`check-gate-table: fatal: ${(error as Error).message}`);
  process.exit(2);
}
