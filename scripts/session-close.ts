#!/usr/bin/env npx tsx
/**
 * session-close.ts — close a session loop: verify, gate, commit. [entry point]
 *
 * Purpose: make the last step of the loop one command. It derives the commit
 * subject from the CHANGELOG heading (so the two records cannot drift and the
 * midnight date mismatch cannot recur), verifies the increment's AAR, runs the
 * fast gate suite, stages, records the gate run for the hooks, and commits.
 *
 * A spec increment stays one commit. A non-spec session is split by concern
 * (`pipeline → server → config → misc → docs`), with docs last. The driver
 * runs the fast suite once on the final tree, typechecks each code-bearing
 * commit in a detached worktree, and asserts the final HEAD tree equals the
 * tree the suite passed on.
 *
 * Usage: npx tsx scripts/session-close.ts [--date YYYY-MM-DD] [--increment <name>]
 *        [--dry-run] [--split | --single]
 * Exit codes: 0 = committed (or nothing to commit); 1 = contract or gate
 * failure; 2 = fatal error.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handleHelp, parseFlag, parseValueFlag, rejectUnknown } from "./lib/args.js";
import { isSpecIncrement, planCommits, type CommitPlan } from "./lib/commit-plan.js";
import { writeGateRun } from "./lib/gate-run-manifest.js";
import { INCREMENTS_DIR, listIncrements, validateIncrements } from "./lib/loop-artifacts.js";
import { collectStagedGuards } from "./lib/publish-guards.js";

const ROOT = join(import.meta.dirname, "..");
const CHANGELOG = join(ROOT, "CHANGELOG.md");
const DECISIONS = join(ROOT, "holonovel", "DECISIONS.md");

const USAGE = `Usage: npx tsx scripts/session-close.ts [--date YYYY-MM-DD] [--increment <name>]
       [--dry-run] [--split | --single]

  --date        Session date (default: local today). Must match the top
                CHANGELOG heading.
  --increment   Only validate this docs/plans increment (default: all).
  --dry-run     Print the commit (and, for a split, the series); change nothing.
  --split       Split a non-spec session by concern. Refused for a spec increment.
  --single      Commit the whole staged tree as one commit.
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
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function tryGit(args: string[]): string | null {
  try {
    return git(args);
  } catch {
    return null;
  }
}

/** NUL-separated `git diff --cached --name-only` output. */
function stagedPaths(): string[] {
  return execFileSync("git", ["diff", "--cached", "--name-only", "-z"], {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  })
    .split("\0")
    .filter(Boolean);
}

/** The paths `git add -A` would stage, without mutating the index. */
function workingPaths(): string[] {
  const changed = execFileSync("git", ["diff", "--name-only", "-z", "HEAD"], {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  })
    .split("\0")
    .filter(Boolean);
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  })
    .split("\0")
    .filter(Boolean);
  return [...new Set([...changed, ...untracked])];
}

function needsTypecheck(paths: string[]): boolean {
  return paths.some(
    (path) => path.startsWith("scripts/") || path.startsWith("holonovel/src/") || path.startsWith("holonovel/scripts/"),
  );
}

/** Typecheck one committed tree in a throwaway worktree. */
function typecheckCommit(verifyDir: string): void {
  rmSync(verifyDir, { recursive: true, force: true });
  execFileSync("git", ["worktree", "add", "-q", "--detach", verifyDir, "HEAD"], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const modules of ["node_modules", join("holonovel", "node_modules")]) {
    try {
      symlinkSync(join(ROOT, modules), join(verifyDir, modules), "dir");
    } catch {
      // The link already exists (a repeated bucket) or the dependency tree is
      // absent; the typecheck below reports the real failure.
    }
  }
  const result = spawnSync("npm", ["run", "typecheck"], {
    cwd: verifyDir,
    stdio: "inherit",
    shell: false,
  });
  execFileSync("git", ["worktree", "remove", "--force", verifyDir], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error("per-commit typecheck failed");
  }
}

/**
 * Apply the series. `finalTree` is the index tree the fast suite passed on.
 * On any failure the history and index are rewound to `preHead`; the working
 * tree keeps every change.
 */
function commitSeries(plan: CommitPlan, message: string): void {
  const preHead = tryGit(["rev-parse", "HEAD"]);
  const finalTree = git(["write-tree"]);
  const verifyDir = mkdtempSync(join(tmpdir(), "session-close-typecheck-"));
  try {
    execFileSync("git", ["reset", "-q"], { cwd: ROOT, stdio: "inherit" });
    for (let index = 0; index < plan.entries.length; index++) {
      const entry = plan.entries[index];
      const last = index === plan.entries.length - 1;
      if (entry.paths.length === 0) continue;
      execFileSync("git", ["add", "-A", "--", ...entry.paths], { cwd: ROOT, stdio: "inherit" });
      if (git(["diff", "--cached", "--name-only"]) === "") continue;

      if (last) {
        const commit = spawnSync("git", ["commit", "-F", "-"], {
          cwd: ROOT,
          input: message,
          encoding: "utf-8",
          stdio: ["pipe", "inherit", "inherit"],
        });
        if (commit.status !== 0) throw new Error("final commit failed");
      } else {
        const commit = spawnSync("git", ["commit", "--no-verify", "-m", entry.subject], {
          cwd: ROOT,
          encoding: "utf-8",
          stdio: ["inherit", "inherit", "inherit"],
        });
        if (commit.status !== 0) throw new Error(`commit failed: ${entry.subject}`);
      }

      if (!last && needsTypecheck(entry.paths)) {
        typecheckCommit(verifyDir);
      }
    }

    if (git(["status", "--porcelain"]) !== "") {
      throw new Error("paths left uncommitted after the series");
    }
    const headTree = git(["rev-parse", "HEAD^{tree}"]);
    if (headTree !== finalTree) {
      throw new Error(`final tree ${headTree} does not match the gated tree ${finalTree}`);
    }
  } catch (error) {
    if (preHead) {
      try {
        execFileSync("git", ["reset", "--soft", preHead], { cwd: ROOT, stdio: "ignore" });
      } catch {
        // The soft reset is best-effort; the original failure is the report.
      }
    }
    rmSync(verifyDir, { recursive: true, force: true });
    throw error;
  }
  rmSync(verifyDir, { recursive: true, force: true });
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(
    argv,
    new Set(["--date", "--increment", "--dry-run", "--split", "--single", "--help", "-h"]),
    USAGE,
  );
  const date = parseValueFlag(argv, "--date") ?? localToday();
  const increment = parseValueFlag(argv, "--increment");
  const dryRun = parseFlag(argv, "--dry-run");
  const forceSplit = parseFlag(argv, "--split");
  const forceSingle = parseFlag(argv, "--single");
  if (forceSplit && forceSingle) {
    console.error("session-close: --split and --single are mutually exclusive");
    process.exit(1);
  }

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
  const preview = planCommits(workingPaths(), entry.date, entry.title);
  if (forceSplit && preview.mode === "single") {
    console.error("session-close: a spec increment stays one commit; --split is refused");
    process.exit(1);
  }
  const mode = forceSingle ? "single" : forceSplit ? "split" : preview.mode;

  if (dryRun) {
    console.log(`session-close (dry run): mode=${mode}`);
    console.log(`\n${message}`);
    if (mode === "split") {
      console.log("Series:");
      for (const plannedEntry of preview.entries) {
        console.log(`  ${plannedEntry.subject} (${plannedEntry.paths.length} path(s))`);
      }
    }
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
  const guards = collectStagedGuards(ROOT);
  if (guards.problems.length > 0) {
    for (const problem of guards.problems) console.error(`session-close: BLOCKED: ${problem}`);
    console.error("session-close: staging guards failed — nothing committed");
    process.exit(1);
  }
  const paths = stagedPaths();
  if (paths.length === 0) {
    console.log("session-close: nothing to commit");
    process.exit(0);
  }

  // Record the passing run against the staged signature so the pre-commit hook
  // skips work that already ran on this exact tree.
  writeGateRun("fast", startedAt, finishedAt, "pass");

  if (mode === "single") {
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
    console.log(`session-close: committed ${git(["log", "-1", "--format=%h %s"])}`);
    return;
  }

  const splitPlan = planCommits(paths, entry.date, entry.title);
  try {
    commitSeries(splitPlan, message);
  } catch (error) {
    console.error(`session-close: split commit series failed — ${(error as Error).message}`);
    process.exit(1);
  }
  console.log("session-close: committed series");
  console.log(git(["log", "--format=%h %s", "-n", String(splitPlan.entries.length)]));
}

try {
  main();
} catch (error) {
  console.error(`session-close: fatal: ${(error as Error).message}`);
  process.exit(2);
}
