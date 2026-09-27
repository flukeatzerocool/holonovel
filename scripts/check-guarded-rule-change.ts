#!/usr/bin/env npx tsx
/**
 * check-guarded-rule-change.ts — block a self-attesting rule change. [gate]
 *
 * A change that edits Appendix M's authoring rules and, in the same commit,
 * the validator patterns that enforce them (scripts/lib/req-checks.ts or
 * scripts/validate.ts) is self-attesting: the rule and its gate move together.
 * This gate requires the same change to record a review-register entry naming
 * the rule, so the edit is a reviewed step rather than a silent one
 * (AGENTS.md "Review-loop governance").
 *
 * Default mode inspects the staged diff (index vs HEAD) — run it from the
 * pre-commit hook. `--base <ref>` inspects `<ref>..HEAD` instead, for an
 * opt-in CI/PR scan.
 *
 * Exit codes: 0 = no guarded co-change or the change is acknowledged, 1 =
 * unacknowledged co-change or bad usage, 2 = unexpected fatal error.
 */
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { handleHelp, parseValueFlag } from "./lib/args.js";
import { extractAppendixM, decideGuardedRuleChange } from "./lib/guarded-rule.js";

const root = join(import.meta.dirname, "..");

const USAGE = `Usage: npx tsx scripts/check-guarded-rule-change.ts [--base <ref>]

  --base <ref>   Inspect <ref>..HEAD instead of the staged diff (CI/PR scan).
  --help, -h     Show this message.

Exit codes: 0 = clean or acknowledged, 1 = unacknowledged co-change or bad
usage, 2 = unexpected fatal error.
`;

// The validator-pattern home: the files that mechanically enforce the
// Appendix M authoring rules.
const VIGIL = ["scripts/lib/req-checks.ts", "scripts/validate.ts"];
const APPENDICES = "spec/appendices-reference.md";
const REGISTER = "spec/audit/review-register.md";

handleHelp(process.argv, USAGE);

const KNOWN = new Set(["--base", "--help", "-h"]);
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === "--base") { i++; continue; }
  if (!KNOWN.has(a)) {
    console.error(`Unknown flag: ${a}\n${USAGE}`);
    process.exit(1);
  }
}
const baseRef = parseValueFlag(process.argv, "--base");
if (process.argv.includes("--base") && baseRef === null) {
  console.error(`--base requires a ref\n${USAGE}`);
  process.exit(1);
}

function git(args: string[]): string | null {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    // A missing revision/path is a legitimate "no content" result here; the
    // caller distinguishes it with null.
    return null;
  }
}

if (baseRef !== null && git(["rev-parse", "--verify", "--quiet", baseRef]) === null) {
  console.error(`--base ref not found: ${baseRef}`);
  process.exit(2);
}

// The Appendix M slice at a revision (null when the file/ref is unavailable).
function appendixAt(rev: string): string | null {
  const file = git(["show", `${rev}:${APPENDICES}`]);
  return file === null ? null : extractAppendixM(file);
}

// Changed file names for the diff under inspection.
function changedFiles(): Set<string> {
  const out = baseRef === null
    ? git(["diff", "--cached", "--name-only"])
    : git(["diff", "--name-only", `${baseRef}..HEAD`]);
  return new Set((out ?? "").split("\n").filter(Boolean));
}

// Added lines (start with "+", not the "+++" header) in a path's diff.
function addedLines(path: string): string {
  const out = baseRef === null
    ? git(["diff", "--cached", "--", path])
    : git(["diff", `${baseRef}..HEAD`, "--", path]);
  if (out === null) return "";
  return out.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n");
}

let afterM: string | null;
let beforeM: string | null;
if (baseRef === null) {
  beforeM = appendixAt("HEAD");
  const staged = git(["show", `:${APPENDICES}`]);
  afterM = staged === null ? null : extractAppendixM(staged);
} else {
  beforeM = appendixAt(baseRef);
  afterM = appendixAt("HEAD");
}

const before = beforeM ?? "";
const after = afterM ?? "";
const ruleChanged = before !== after && (before !== "" || after !== "");
const files = changedFiles();
const validatorChanged = VIGIL.some((f) => files.has(f));
const registerAcknowledges = /Appendix M/.test(addedLines(REGISTER));

// Nothing staged: the hook may run on an amend or a no-op commit.
if (baseRef === null && files.size === 0) {
  console.log("PASS: no staged changes — guarded-rule check is a no-op");
  process.exit(0);
}

const failure = decideGuardedRuleChange({ ruleChanged, validatorChanged, registerAcknowledges });
if (failure) {
  console.error(`BLOCKED: ${failure}`);
  console.error("See AGENTS.md \"Review-loop governance\" for the acknowledgment convention.");
  process.exit(1);
}
console.log("PASS: no unacknowledged rule/validator co-change");
process.exit(0);
