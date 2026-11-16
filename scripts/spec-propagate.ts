#!/usr/bin/env npx tsx
/**
 * spec-propagate.ts — mirror the assembled spec into each server directory. [build tool]
 *
 * Copies `holonovel.md` into each server's `holonovel.md` so the embedded copy
 * the runtime reads (REQ-105) stays in sync. `--check` compares instead of
 * writing: it exits 1 naming `npm run assemble` when a copy is missing or stale,
 * so the untracked generated copy cannot drift unnoticed.
 *
 * Usage: npx tsx scripts/spec-propagate.ts [--check]
 * Exit codes: 0 = propagated (or every copy current), 1 = target directory
 * missing or a copy divergent under --check, 2 = fatal error.
 */
import { copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { SERVERS } from "./lib/servers.js";
import { assembledSpecExists, specCopyFindings } from "./lib/spec-copy.js";
import { handleHelp, parseFlag, rejectUnknown } from "./lib/args.js";

const root = join(import.meta.dirname, "..");

const SOURCE = join(root, "holonovel.md");
const TARGETS = SERVERS.map((s) => join(root, s, "holonovel.md"));

const USAGE = `Usage: npx tsx scripts/spec-propagate.ts [--check]

  --check  Compare each server copy with the assembled spec; write nothing.
  --help   Show this message.
`;

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--check", "--help", "-h"]), USAGE);
  const check = parseFlag(argv, "--check");

  if (!assembledSpecExists(root)) {
    console.error(`  FAIL  ${SOURCE}: assembled spec not found — run \`npm run assemble\``);
    process.exit(1);
  }

  if (check) {
    const findings = specCopyFindings(root, SERVERS);
    for (const finding of findings) {
      const detail = finding.reason === "missing" ? "missing" : "differs from holonovel.md";
      console.error(`  STALE ${finding.path}: ${detail} — run \`npm run assemble\``);
    }
    if (findings.length > 0) {
      console.error("\nSpec copy check FAILED.");
      process.exit(1);
    }
    console.log("Spec copies are current.");
    return;
  }

  let ok = true;
  for (const target of TARGETS) {
    if (!existsSync(dirname(target))) {
      console.error(`  FAIL  ${target}: target directory not found`);
      ok = false;
      continue;
    }
    copyFileSync(SOURCE, target);
    console.log(`  OK    ${target}`);
  }

  if (!ok) {
    console.error("\nSpec propagation FAILED.");
    process.exit(1);
  }
  console.log("\nSpec propagated to server.");
}

try {
  main();
} catch (error) {
  console.error(`spec-propagate: fatal: ${(error as Error).message}`);
  process.exit(2);
}
