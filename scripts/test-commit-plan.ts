#!/usr/bin/env npx tsx
/**
 * test-commit-plan.ts — self-tests for the session commit planner. [gate]
 *
 * Purpose: `session-close` depends on the planner for bucket order and
 * subjects. This guards the spec-increment rule, path assignment, the
 * release-note subject, and that every generated subject passes the real
 * `.githooks/commit-msg` validator.
 *
 * Usage: npx tsx scripts/test-commit-plan.ts [--help]
 * Exit codes: 0 = every case passed, 1 = a case failed, 2 = fatal.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handleHelp, rejectUnknown } from "./lib/args.js";
import { isSpecIncrement, normalizeSubject, planCommits } from "./lib/commit-plan.js";

const ROOT = join(import.meta.dirname, "..");
const HOOK = join(ROOT, ".githooks", "commit-msg");
const USAGE = `Usage: npx tsx scripts/test-commit-plan.ts

  --help  Show this message.
`;

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

function hookAccepts(subject: string): boolean {
  const dir = mkdtempSync(join(tmpdir(), "commit-msg-"));
  const file = join(dir, "message");
  try {
    writeFileSync(file, `${subject}\n`);
    return spawnSync(HOOK, [file], { cwd: ROOT, encoding: "utf-8" }).status === 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--help", "-h"]), USAGE);

  check(isSpecIncrement(["spec/02-requirements.md"]), "spec/ path is a spec increment");
  check(isSpecIncrement(["holonovel.md"]), "assembled spec is a spec increment");
  check(!isSpecIncrement(["scripts/status.ts"]), "script path is not a spec increment");

  const single = planCommits(
    ["spec/02-requirements.md", "holonovel.md", "CHANGELOG.md"],
    "2026-11-07",
    "Fixture increment",
  );
  check(single.mode === "single", "a spec increment plans one commit");
  check(single.entries.length === 1 && single.entries[0]!.key === "increment", "the single entry is named increment");
  check(single.entries[0]!.paths.length === 3, "a spec increment keeps every path in one commit");

  const split = planCommits(
    [
      "scripts/status.ts",
      "package.json",
      ".githooks/commit-msg",
      "holonovel/src/index.ts",
      "holonovel/package.json",
      "CHANGELOG.md",
      "docs/workflow-cadence.md",
      "some/unclassified.txt",
    ],
    "2026-11-07",
    "Fixture session",
  );
  check(split.mode === "split", "a non-spec session plans a split");
  check(
    split.entries.map((entry) => entry.key).join(",") === "pipeline,server,config,misc,docs",
    "buckets are ordered pipeline → server → config → misc → docs",
  );
  const assigned = split.entries.flatMap((entry) => entry.paths).sort();
  const input = [
    "scripts/status.ts",
    "package.json",
    ".githooks/commit-msg",
    "holonovel/src/index.ts",
    "holonovel/package.json",
    "CHANGELOG.md",
    "docs/workflow-cadence.md",
    "some/unclassified.txt",
  ].sort();
  check(JSON.stringify(assigned) === JSON.stringify(input), "every path is assigned exactly once");
  check(split.entries.at(-1)?.key === "docs", "docs is last");
  check(split.entries.at(-1)?.subject === "2026-11-07 — Fixture session", "the last entry carries the plain title");
  check(
    split.entries[0]!.subject === "2026-11-07 — Fixture session: pipeline",
    "earlier entries add their bucket label",
  );

  const empty = planCommits([], "2026-11-07", "Empty");
  check(empty.entries.length === 0, "an empty plan has no entries");

  check(normalizeSubject("  Title.  ") === "Title", "subjects are trimmed and lose a trailing period");
  check(normalizeSubject("x".repeat(200)).length === 120, "subjects are capped at 120 characters");

  for (const entry of [...single.entries, ...split.entries]) {
    check(hookAccepts(entry.subject), `commit-msg accepts: ${entry.subject}`);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

try {
  main();
} catch (error) {
  console.error(`test-commit-plan: fatal: ${(error as Error).message}`);
  process.exit(2);
}
