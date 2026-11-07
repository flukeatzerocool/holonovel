#!/usr/bin/env npx tsx
/**
 * session-close.ts — close a session loop: verify, gate, commit. [entry point]
 *
 * Purpose: make the last step of the loop one command. It derives the commit
 * subject from the CHANGELOG heading (so the two records cannot drift and the
 * midnight date mismatch cannot recur), verifies the increment's AAR, runs the
 * fast gate suite, stages, records the gate run for the hooks, and commits.
 *
 * Usage: npx tsx scripts/session-close.ts [--date YYYY-MM-DD] [--increment <name>] [--dry-run]
 * Exit codes: 0 = committed (or nothing to commit); 1 = contract or gate
 * failure; 2 = fatal error.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { handleHelp, parseFlag, parseValueFlag, rejectUnknown } from "./lib/args.js";
import { writeGateRun } from "./lib/gate-run-manifest.js";
import { INCREMENTS_DIR, listIncrements, validateIncrements } from "./lib/loop-artifacts.js";

const ROOT = join(import.meta.dirname, "..");
const CHANGELOG = join(ROOT, "CHANGELOG.md");
const DECISIONS = join(ROOT, "holonovel", "DECISIONS.md");

const USAGE = `Usage: npx tsx scripts/session-close.ts [--date YYYY-MM-DD] [--increment <name>] [--dry-run]

  --date        Session date (default: local today). Must match the top
                CHANGELOG heading.
  --increment   Only validate this docs/plans increment (default: all).
  --dry-run     Print the commit that would be made; change nothing.
  --help        Show this message.
`;

interface Entry {
  date: string;
  title: string;
  body: string;
}

function localToday(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function topEntry(text: string): Entry | null {
  const lines = text.split("\n");
  let start = -1;
  let date = "";
  let title = "";
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^## (\d{4}-\d{2}-\d{2}) — (.+)$/);
    if (match) {
      start = i;
      date = match[1];
      title = match[2].trim();
      break;
    }
  }
  if (start === -1) return null;
  const body: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) break;
    body.push(lines[i]);
  }
  return { date, title, body: body.join("\n").trim() };
}

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--date", "--increment", "--dry-run", "--help", "-h"]), USAGE);
  const date = parseValueFlag(argv, "--date") ?? localToday();
  const increment = parseValueFlag(argv, "--increment");
  const dryRun = parseFlag(argv, "--dry-run");

  if (!existsSync(CHANGELOG)) {
    console.error("session-close: CHANGELOG.md not found");
    process.exit(2);
  }
  const entry = topEntry(readFileSync(CHANGELOG, "utf-8"));
  if (!entry) {
    console.error("session-close: no '## <YYYY-MM-DD> — <title>' heading in CHANGELOG.md");
    process.exit(1);
  }
  if (entry.date !== date) {
    console.error(
      `session-close: top CHANGELOG heading is ${entry.date}, expected ${date}. ` +
        "Write the entry for this session first, or pass --date to match it.",
    );
    process.exit(1);
  }

  const findings = validateIncrements(ROOT);
  const scoped = increment
    ? findings.filter((finding) => finding.increment === increment)
    : findings;
  const errors = scoped.filter((finding) => finding.level === "error");
  if (increment && !listIncrements(ROOT).some((item) => item.name === increment)) {
    console.error(`session-close: no increment named ${increment} under ${INCREMENTS_DIR}`);
    process.exit(1);
  }
  for (const finding of scoped) {
    console.error(`${finding.level === "error" ? "ERROR" : "WARNING"} ${finding.increment}: ${finding.message}`);
  }
  if (errors.length > 0) {
    console.error("session-close: increment artifact contract failed — write the missing files");
    process.exit(1);
  }

  if (existsSync(DECISIONS)) {
    const decisions = readFileSync(DECISIONS, "utf-8");
    const match = decisions.match(new RegExp(`^### Holonovel Spec Update — ${date} \\((.+)\\)$`, "m"));
    if (match && match[1].trim() !== entry.title) {
      console.error(
        `session-close: WARNING — DECISIONS.md summary "${match[1].trim()}" differs from the CHANGELOG title "${entry.title}"`,
      );
    }
  }

  const subject = `${entry.date} — ${entry.title}`;
  const message = entry.body ? `${subject}\n\n${entry.body}\n` : `${subject}\n`;

  if (dryRun) {
    console.log(`session-close (dry run): would commit as:\n\n${message}`);
    process.exit(0);
  }

  const assemble = spawnSync("npm", ["run", "assemble"], { cwd: ROOT, stdio: "inherit", shell: false });
  if (assemble.status !== 0) {
    console.error("session-close: assemble failed");
    process.exit(1);
  }

  const startedAt = new Date().toISOString();
  const gates = spawnSync("npm", ["run", "check:fast"], { cwd: ROOT, stdio: "inherit", shell: false });
  const finishedAt = new Date().toISOString();
  if (gates.status !== 0) {
    writeGateRun("fast", startedAt, finishedAt, "fail");
    console.error("session-close: fast gate suite failed — nothing committed");
    process.exit(1);
  }

  execFileSync("git", ["add", "-A"], { cwd: ROOT, stdio: "inherit" });
  const staged = git(["diff", "--cached", "--name-only"]);
  if (!staged) {
    console.log("session-close: nothing to commit");
    process.exit(0);
  }

  // Record the passing run against the staged signature so the pre-commit hook
  // skips work that already ran on this exact tree.
  writeGateRun("fast", startedAt, finishedAt, "pass");

  const commit = spawnSync("git", ["commit", "-F", "-"], {
    cwd: ROOT,
    input: message,
    encoding: "utf-8",
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (commit.status !== 0) {
    console.error("session-close: git commit failed");
    process.exit(1);
  }
  const head = git(["log", "-1", "--format=%h %s"]);
  console.log(`session-close: committed ${head}`);
}

try {
  main();
} catch (error) {
  console.error(`session-close: fatal: ${(error as Error).message}`);
  process.exit(2);
}
