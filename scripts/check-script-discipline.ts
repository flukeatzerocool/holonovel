#!/usr/bin/env npx tsx
/**
 * check-script-discipline.ts — enforce the Script discipline standards. [gate]
 *
 * Verifies the mechanical rules from the AGENTS.md "Script discipline"
 * section across scripts/ and holonovel/scripts/ (TypeScript and .mjs) and the
 * shell entry points. The per-file detectors live in
 * `scripts/lib/script-discipline.ts`, where `test-script-tooling.ts` asserts
 * them against known-violation fixtures. The same shell entry-point list is
 * handed to `shellcheck -S warning` when the tool is installed, so the CI shell
 * bar is reachable locally; a missing tool is a notice, not a failure. Exit
 * codes: 0 = all pass, 1 = one or more violations.
 */

import { spawnSync } from "node:child_process";
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
// Hook files carry no .sh extension; every hook is a shell entry point.
const HOOK_RE = /[/\\](pre-commit|pre-push|commit-msg)$/;

// The shell entry points the discipline rules (and shellcheck) cover. One list
// drives both, so a new hook cannot be linted by one and not the other.
function shellEntrypoints(): string[] {
  const files: string[] = [];
  for (const dir of SHELL_DIRS) files.push(...walkFiles(dir, ".sh"));
  for (const file of walkFiles(join(ROOT, ".githooks"), "")) {
    if (HOOK_RE.test(file)) files.push(file);
  }
  return files.sort();
}

// `shellcheck -S warning` is the CI shell bar. Run it here too when the tool is
// installed so a dead declaration (SC2034) is caught before the push instead of
// after publication; absence is a notice, not a failure (AGENTS.md: shellcheck
// is not a local prerequisite).
function shellcheckIssues(files: string[]): string[] {
  const probe = spawnSync("shellcheck", ["--version"], { encoding: "utf-8" });
  if (probe.error || probe.status !== 0) {
    console.error("note: shellcheck unavailable — shell lint skipped (CI runs it)");
    return [];
  }
  const result = spawnSync("shellcheck", ["-S", "warning", ...files], { encoding: "utf-8" });
  if (result.status === 0) return [];
  const detail = `${result.stdout ?? ""}${result.stderr ?? ""}`
    .trim()
    .split("\n")
    .filter((line) => line.trim() !== "");
  return ["shellcheck -S warning reported findings:", ...detail];
}

function collectIssues(): string[] {
  const issues: string[] = [];
  const shells = shellEntrypoints();

  for (const file of shells) {
    issues.push(...shellIssues(file.slice(ROOT.length + 1), readFileSync(file, "utf-8")));
  }
  issues.push(...shellcheckIssues(shells.map((file) => file.slice(ROOT.length + 1))));

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
