#!/usr/bin/env npx tsx
/**
 * req-headroom.ts — list REQ bodies close to the 800-character cap.
 * [informational]
 *
 * Purpose: a plan that amends an existing REQ needs to know its remaining
 * headroom before it promises an edit. This report lists every REQ within a
 * threshold of the cap, sorted by headroom, using the validator's own parser
 * and counting rule. It never fails on findings.
 *
 * Usage: npx tsx scripts/req-headroom.ts [--threshold <n>] [--json] [--help]
 * Exit codes: 0 = report produced, 1 = bad flag or unreadable spec,
 * 2 = fatal.
 */
import { handleHelp, parseFlag, parseValueFlag, rejectUnknown } from "./lib/args.js";
import { extractReqBodies, readSpec } from "./lib/parse-spec.js";

const CAP = 800;
const DEFAULT_THRESHOLD = 40;

const USAGE = `req-headroom — REQs close to the 800-character body cap

Usage:
  npx tsx scripts/req-headroom.ts [--threshold <n>] [--json] [--help]

Options:
  --threshold <n>  Show REQs with at most n characters of headroom (default ${DEFAULT_THRESHOLD}).
  --json           Emit machine-readable output.
  --help, -h       Show this help.

Exit codes: 0 = report produced; 1 = bad flag or unreadable spec; 2 = fatal.
`;

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--threshold", "--json"]), USAGE);
  const rawThreshold = parseValueFlag(argv, "--threshold");
  const threshold = rawThreshold === null ? DEFAULT_THRESHOLD : Number.parseInt(rawThreshold, 10);
  if (!Number.isFinite(threshold) || threshold < 0) {
    process.stderr.write(`invalid --threshold: ${rawThreshold}\n`);
    process.exit(1);
  }
  const asJson = parseFlag(argv, "--json");

  let text: string;
  try { text = readSpec(); }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  const rows = [...extractReqBodies(text).values()]
    .map(({ id, body }) => ({ id, length: body.length, headroom: CAP - body.length }))
    .filter((row) => row.headroom <= threshold)
    .sort((a, b) => a.headroom - b.headroom || a.id.localeCompare(b.id));

  if (asJson) {
    process.stdout.write(JSON.stringify({ cap: CAP, threshold, rows }, null, 2) + "\n");
  } else {
    for (const row of rows) {
      process.stdout.write(`${row.id}: ${row.length}/${CAP} chars (${row.headroom} headroom)\n`);
    }
    process.stdout.write(`${rows.length} REQ(s) within ${threshold} chars of the ${CAP}-char cap\n`);
  }
  process.exit(0);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
}
