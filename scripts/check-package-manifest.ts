#!/usr/bin/env npx tsx
/**
 * check-package-manifest.ts — static published-package manifest gate.
 * [gate]
 *
 * Reads `holonovel/package.json` and asserts the publication contract
 * (REQ-614/T732): required metadata, export conditions and types, the files
 * allowlist, exact dependency pins, Node 22+, publish config, and no install
 * lifecycle scripts. No build or network access.
 *
 * Usage: npx tsx scripts/check-package-manifest.ts [--json] [--help]
 * Exit codes: 0 = manifest conforms, 1 = violations, 2 = fatal.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { handleHelp, parseFlag } from "./lib/args.js";
import { checkManifest } from "./lib/package-manifest.js";

const ROOT = join(import.meta.dirname, "..");
const USAGE = `Usage: npx tsx scripts/check-package-manifest.ts [--json] [--help]

  --json  Emit the report as JSON.
  --help  Show this message.
`;

function main(): never {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  const known = new Set(["--json"]);
  const unknown = argv.filter((arg) => !known.has(arg));
  if (unknown.length > 0) {
    console.error(`check-package-manifest: unknown flag(s): ${unknown.join(", ")}`);
    console.error(USAGE);
    process.exit(1);
  }

  let report;
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, "holonovel", "package.json"), "utf-8"));
    report = checkManifest(pkg);
  } catch (error) {
    console.error("check-package-manifest: fatal:", error instanceof Error ? error.message : error);
    process.exit(2);
  }

  if (parseFlag(argv, "--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else if (report.ok) {
    console.log("PASS: holonovel package manifest conforms (REQ-614)");
  } else {
    for (const item of report.issues) console.error(`FAIL ${item.code}: ${item.message}`);
    console.error(`\n${report.issues.length} manifest violation(s)`);
  }
  process.exit(report.ok ? 0 : 1);
}

main();
