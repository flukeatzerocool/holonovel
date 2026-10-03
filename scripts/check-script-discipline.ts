#!/usr/bin/env npx tsx
/**
 * check-script-discipline.ts — enforce the Script discipline standards. [gate]
 *
 * Verifies the mechanical rules from the AGENTS.md "Script discipline"
 * section across scripts/ and holonovel/scripts/ (TypeScript and .mjs) and the
 * shell entry points. The per-file detectors live in
 * `scripts/lib/script-discipline.ts`, where `test-script-tooling.ts` asserts
 * them against known-violation fixtures. Exit codes: 0 = all pass, 1 = one or
 * more violations.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { walkFiles, walkTsFiles } from "./lib/walk.js";
import { contentIssues, shellIssues } from "./lib/script-discipline.js";

const ROOT = join(import.meta.dirname, "..");
const DIRS = [join(ROOT, "scripts"), join(ROOT, "holonovel", "scripts")];
const LIB_DIRS = [join(ROOT, "scripts", "lib"), join(ROOT, "holonovel", "scripts", "lib")];
// Shell discipline applies to entry points and hooks (AGENTS.md §Script
// discipline). `.opencode/` agent tooling is deliberately out of scope.
const SHELL_DIRS = [join(ROOT, "scripts"), join(ROOT, ".githooks")];

function collectIssues(): string[] {
  const issues: string[] = [];

  for (const dir of SHELL_DIRS) {
    for (const file of walkFiles(dir, ".sh")) {
      issues.push(...shellIssues(file.slice(ROOT.length + 1), readFileSync(file, "utf-8")));
    }
  }
  // .githooks/ files have no .sh extension.
  for (const file of walkFiles(join(ROOT, ".githooks"), "")) {
    if (/[/\\]pre-(commit|push)$/.test(file)) {
      issues.push(...shellIssues(file.slice(ROOT.length + 1), readFileSync(file, "utf-8")));
    }
  }

  for (const dir of DIRS) {
    for (const file of [...walkTsFiles(dir), ...walkFiles(dir, ".mjs")]) {
      const isLib = LIB_DIRS.some((d) => file.startsWith(d));
      issues.push(...contentIssues(file.slice(ROOT.length + 1), readFileSync(file, "utf-8"), isLib));
    }
  }

  return issues;
}

const issues = collectIssues();
if (issues.length > 0) {
  for (const issue of issues) console.error(`FAIL: ${issue}`);
  console.error(`\n${issues.length} script-discipline violation(s)`);
  process.exit(1);
}
console.log(`PASS: script discipline — ${DIRS.length} TS trees (TS + .mjs) + shell entry points, no violations`);
process.exit(0);
