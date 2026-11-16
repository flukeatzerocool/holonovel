#!/usr/bin/env npx tsx
/**
 * test-loop-artifacts.ts — self-tests for the increment artifact contract.
 * [gate]
 *
 * Guards validateIncrements' `requirePausedFor` option: the close gate must
 * refuse LOOP OPEN for the increment being closed and leave every other
 * increment's findings untouched, so historical OPEN increments cannot block
 * a session. Also guards `lenient`: an in-flight increment's missing tasks.md or
 * aar.md warns (fast gate) while the default strict mode errors (full gate,
 * close). Each case builds a throwaway docs/plans tree; no repository
 * increments are read.
 *
 * Wired into `check`/`check:fast` as the `test:loop-artifacts` manifest gate.
 * Exit codes: 0 = pass, 1 = assertion failure, 2 = fatal.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateIncrements } from "./lib/loop-artifacts.js";
import {
  artifactOverage,
  countLines,
  incrementDate,
  parseBaseline,
  type IncrementSize,
} from "./lib/loop-bounds.js";

let failures = 0;
const roots: string[] = [];

function tree(increments: Array<{ name: string; token: string | null }>): string {
  const root = mkdtempSync(join(tmpdir(), "loop-artifacts-"));
  roots.push(root);
  for (const { name, token } of increments) {
    const dir = join(root, "docs", "plans", name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "plan.md"), "# Plan\n\n**Done bar:** the thing works\n");
    writeFileSync(join(dir, "tasks.md"), "# Tasks\n");
    writeFileSync(join(dir, "aar.md"), token ? `# AAR\n\n${token}\n` : "# AAR\n\nno token here\n");
  }
  return root;
}

// A partially built increment: `omit` names the files not to write, so the
// in-flight cases can exercise a directory that only has a plan.
function partialTree(name: string, omit: Array<"plan" | "tasks" | "aar">): string {
  const root = mkdtempSync(join(tmpdir(), "loop-artifacts-"));
  roots.push(root);
  const dir = join(root, "docs", "plans", name);
  mkdirSync(dir, { recursive: true });
  if (!omit.includes("plan")) writeFileSync(join(dir, "plan.md"), "# Plan\n\n**Done bar:** works\n");
  if (!omit.includes("tasks")) writeFileSync(join(dir, "tasks.md"), "# Tasks\n");
  if (!omit.includes("aar")) writeFileSync(join(dir, "aar.md"), "# AAR\n\nLOOP PAUSED\n");
  return root;
}

function only(findings: ReturnType<typeof validateIncrements>, name: string): Array<{ level: string; message: string }> {
  return findings.filter((finding) => finding.increment === name);
}

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`  FAIL ${name}\n       ${(error as Error).message}`);
  }
}

function expect(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const OPEN_MESSAGE = /reports LOOP OPEN/;
const MISSING_MESSAGE = /no LOOP PAUSED \/ LOOP OPEN/;

try {
  check("PAUSED increment passes with requirePausedFor", () => {
    const root = tree([{ name: "2026-01-01-a", token: "LOOP PAUSED" }]);
    const findings = validateIncrements(root, { requirePausedFor: "2026-01-01-a" });
    expect(findings.length === 0, `expected no findings, got ${JSON.stringify(findings)}`);
  });

  check("OPEN increment passes when no option is given", () => {
    const root = tree([{ name: "2026-01-01-a", token: "LOOP OPEN" }]);
    expect(validateIncrements(root).length === 0, "plain call must not gate on OPEN");
  });

  check("OPEN increment errors when named", () => {
    const root = tree([{ name: "2026-01-01-a", token: "LOOP OPEN" }]);
    const findings = validateIncrements(root, { requirePausedFor: "2026-01-01-a" });
    expect(findings.length === 1, `expected one finding, got ${findings.length}`);
    expect(findings[0].level === "error", "must be an error");
    expect(OPEN_MESSAGE.test(findings[0].message), `unexpected message: ${findings[0].message}`);
  });

  check("a different increment's OPEN does not error", () => {
    const root = tree([
      { name: "2026-01-01-a", token: "LOOP OPEN" },
      { name: "2026-01-02-b", token: "LOOP PAUSED" },
    ]);
    const findings = validateIncrements(root, { requirePausedFor: "2026-01-02-b" });
    expect(findings.length === 0, `expected no findings, got ${JSON.stringify(findings)}`);
  });

  check("a missing token still errors, named or not", () => {
    const root = tree([{ name: "2026-01-01-a", token: null }]);
    const plain = validateIncrements(root);
    const named = validateIncrements(root, { requirePausedFor: "2026-01-01-a" });
    expect(plain.length === 1 && MISSING_MESSAGE.test(plain[0].message), "plain call must report the missing token");
    expect(named.length === 1 && MISSING_MESSAGE.test(named[0].message), "named call must report the missing token, not OPEN");
  });

  // --lenient: an in-flight increment warns instead of reddening the fast gate.
  check("lenient warns on a missing aar.md", () => {
    const root = partialTree("2026-01-01-a", ["aar"]);
    const findings = only(validateIncrements(root, { lenient: true }), "2026-01-01-a");
    expect(findings.length === 1, `expected one finding, got ${JSON.stringify(findings)}`);
    expect(findings[0].level === "warning", "missing aar.md must be a warning when lenient");
  });

  check("lenient warns on a missing tasks.md", () => {
    const root = partialTree("2026-01-01-a", ["tasks"]);
    const findings = only(validateIncrements(root, { lenient: true }), "2026-01-01-a");
    expect(findings.length === 1, `expected one finding, got ${JSON.stringify(findings)}`);
    expect(findings[0].level === "warning", "missing tasks.md must be a warning when lenient");
  });

  check("strict (default) errors on the same missing files", () => {
    const root = partialTree("2026-01-01-a", ["tasks", "aar"]);
    const findings = only(validateIncrements(root), "2026-01-01-a");
    expect(findings.length === 2, `expected two findings, got ${JSON.stringify(findings)}`);
    expect(findings.every((finding) => finding.level === "error"), "both must be errors by default");
  });

  check("a missing plan.md errors even when lenient", () => {
    const root = partialTree("2026-01-01-a", ["plan"]);
    const findings = only(validateIncrements(root, { lenient: true }), "2026-01-01-a");
    expect(findings.length === 1, `expected one finding, got ${JSON.stringify(findings)}`);
    expect(findings[0].level === "error", "a directory without plan.md is not an increment");
  });

  check("lenient does not silence LOOP OPEN for the closed increment", () => {
    const root = tree([{ name: "2026-01-01-a", token: "LOOP OPEN" }]);
    const findings = validateIncrements(root, { lenient: true, requirePausedFor: "2026-01-01-a" });
    expect(findings.length === 1 && OPEN_MESSAGE.test(findings[0].message), "OPEN must still error at close in lenient mode");
  });
  // ── Artifact bound (ROADMAP item 6) ──────────────────────────────────
  const baseline = { since: "2026-11-16", exempt: ["2026-11-16-exempt"] };
  const size = (name: string, planLines: number, aarLines: number): IncrementSize => ({ name, planLines, aarLines });

  check("countLines excludes a trailing newline", () => {
    expect(countLines("a\nb\n") === 2, `got ${countLines("a\nb\n")}`);
    expect(countLines("a") === 1, "a single line without newline is one line");
    expect(countLines("") === 0, "empty text has no lines");
  });

  check("an absent baseline is a first-run state, not a failure", () => {
    expect(parseBaseline(null).status === "absent", "null text must be absent");
  });

  check("an unparseable baseline is malformed", () => {
    expect(parseBaseline("{not json").status === "malformed", "invalid JSON must be malformed");
    expect(parseBaseline('{"exempt":[]}').status === "malformed", "a missing since must be malformed");
    expect(parseBaseline('{"since":"2026-11-16"}').status === "malformed", "a missing exempt array must be malformed");
  });

  check("a well-formed baseline parses", () => {
    const parsed = parseBaseline(JSON.stringify(baseline));
    expect(parsed.status === "ok", `expected ok, got ${JSON.stringify(parsed)}`);
    expect(parsed.status === "ok" && parsed.baseline.since === "2026-11-16", "since is read");
  });

  check("an increment exactly at both limits is inside the bound", () => {
    expect(artifactOverage([size("2026-11-16-a", 150, 120)], baseline).length === 0, "150/120 must pass");
  });

  check("an oversized plan past the since date is reported", () => {
    const overages = artifactOverage([size("2026-11-16-a", 151, 10)], baseline);
    expect(overages.length === 1 && overages[0].field === "plan", JSON.stringify(overages));
  });

  check("an oversized AAR past the since date is reported", () => {
    const overages = artifactOverage([size("2026-11-16-a", 10, 121)], baseline);
    expect(overages.length === 1 && overages[0].field === "aar", JSON.stringify(overages));
  });

  check("an increment dated before the since date is out of scope", () => {
    expect(artifactOverage([size("2026-11-15-a", 999, 999)], baseline).length === 0, "pre-since must be ignored");
  });

  check("an exempt increment is ignored", () => {
    expect(artifactOverage([size("2026-11-16-exempt", 999, 999)], baseline).length === 0, "exempt must be ignored");
  });

  check("an increment with no date prefix is out of scope", () => {
    expect(artifactOverage([size("scratch", 999, 999)], baseline).length === 0, "undated must be ignored");
    expect(incrementDate("scratch") === "", "no date prefix reads as empty");
  });

} catch (error) {
  console.error(`test-loop-artifacts: fatal: ${(error as Error).message}`);
  process.exit(2);
} finally {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`test-loop-artifacts: ${failures} failure(s)`);
  process.exit(1);
}
console.log("test-loop-artifacts: passed.");
