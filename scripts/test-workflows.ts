#!/usr/bin/env npx tsx
/**
 * test-workflows.ts — self-tests for the workflow parsers. [gate]
 *
 * Purpose: `check-workflows` gates CI configuration, but its two pure
 * detectors had no tests. This guards the SHA-pin parser (a 40-hex ref plus a
 * `# vN` comment) and the job-hygiene rules (full-history checkout and server
 * dependencies before a gate).
 *
 * Usage: npx tsx scripts/test-workflows.ts [--help]
 * Exit codes: 0 = every case passed, 1 = a case failed, 2 = fatal.
 */
import { handleHelp, rejectUnknown } from "./lib/args.js";
import { jobHygiene, parseActionPin } from "./lib/workflow-hygiene.js";

const USAGE = `Usage: npx tsx scripts/test-workflows.ts

  --help  Show this message.
`;

const SHA = "fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09";

let passed = 0;
let failed = 0;
function check(ok: boolean, label: string): void {
  if (ok) {
    passed++;
    console.log(`  PASS ${label}`);
  } else {
    failed++;
    console.error(`  FAIL ${label}`);
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--help", "-h"]), USAGE);

  const sha = parseActionPin(`- uses: actions/checkout@${SHA} # v5.1.0`);
  check(sha !== null && sha.sha && sha.major === 5, "SHA pin with a v5 comment parses");

  const major = parseActionPin("- uses: actions/checkout@v5");
  check(major !== null && !major.sha && major.major === 5, "major pin parses as mutable");

  const oldComment = parseActionPin(`- uses: actions/setup-node@${SHA} # v4.4.0`);
  check(oldComment?.major === 4, "a SHA pin's comment supplies the major");

  const noComment = parseActionPin(`- uses: actions/setup-node@${SHA}`);
  check(noComment !== null && noComment.sha && noComment.major === null, "a SHA without a comment has no major");

  const unknown = parseActionPin("- uses: some/action@v3");
  check(unknown?.major === 3, "an unknown action's major parses");

  check(parseActionPin("      - run: npm run check") === null, "non-uses lines are ignored");

  const cleanJob = [
    "  gates:",
    "    steps:",
    `      - uses: actions/checkout@${SHA} # v5.1.0`,
    "        with:",
    "          fetch-depth: 0",
    "      - uses: actions/setup-node@v5",
    "        with:",
    "          node-version: 24",
    "      - name: Install server dependencies",
    "        working-directory: holonovel",
    "        run: npm ci",
    "      - run: npm run check",
  ].join("\n");
  check(jobHygiene("ci.yml", "gates", cleanJob).length === 0, "a clean gate job passes hygiene");

  const shallow = cleanJob.replace("          fetch-depth: 0\n", "");
  check(
    jobHygiene("ci.yml", "gates", shallow).some((issue) => issue.includes("full-history")),
    "a shallow checkout is reported",
  );

  const noDeps = cleanJob.replace(
    "      - name: Install server dependencies\n        working-directory: holonovel\n        run: npm ci\n",
    "",
  );
  check(
    jobHygiene("ci.yml", "gates", noDeps).some((issue) => issue.includes("server dependencies")),
    "missing server dependencies before a gate is reported",
  );

  const noGate = ["  docs:", "    steps:", "      - run: echo hi"].join("\n");
  check(jobHygiene("ci.yml", "docs", noGate).length === 0, "a job without a gate is not checked");

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

try {
  main();
} catch (error) {
  console.error(`test-workflows: fatal: ${(error as Error).message}`);
  process.exit(2);
}
