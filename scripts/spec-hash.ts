#!/usr/bin/env npx tsx
/**
 * spec-hash.ts — print the SHA-256 of the assembled spec. [informational]
 *
 * One implementation of the published-spec hash shared by the push pipeline and
 * the git hooks, so a delta classification cannot drift from the hash written
 * into DECISIONS.md. Reads `holonovel.md` by default.
 *
 * Usage: npx tsx scripts/spec-hash.ts [--file <path>] [--help]
 * Exit codes: 0 = hash printed, 1 = the file is unreadable, 2 = fatal.
 */
import { join } from "node:path";
import { handleHelp, parseValueFlag } from "./lib/args.js";
import { hashFile } from "./lib/hash.js";

const USAGE = `Usage: npx tsx scripts/spec-hash.ts [--file <path>] [--help]

  --file <path>  Hash this file instead of holonovel.md.
  --help, -h     Show this message.

Exit codes: 0 = hash printed, 1 = unreadable file, 2 = fatal.
`;

handleHelp(process.argv, USAGE);

const arg = parseValueFlag(process.argv, "--file");
const path = arg ?? join(import.meta.dirname, "..", "holonovel.md");
const hash = hashFile(path, "");
if (!hash) {
  console.error(`FAIL: cannot read ${path}`);
  process.exit(1);
}
process.stdout.write(hash);
