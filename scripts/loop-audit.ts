#!/usr/bin/env npx tsx
/**
 * loop-audit.ts — measure the session-commit and publication loops. [informational; gate with --check]
 *
 * Purpose: turn the two workflow loops into numbers instead of impressions.
 * Reads git history, docs/plans increment artifacts, the push reflog, the local
 * gate-timing log, and the hook-events log; writes a snapshot report.
 *
 * The snapshot is stamped with the commit it was generated from, so it is
 * reproducible for that commit. `--check` recomputes the metrics live and exits
 * non-zero on drift — it never byte-compares the committed snapshot, so the
 * report cannot become a wall-clock freshness gate.
 *
 * Usage: npx tsx scripts/loop-audit.ts [--write] [--check] [--json]
 * Exit codes: 0 = report produced (and --check passed); 1 = --check found
 * drift; 2 = fatal error.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { handleHelp, parseFlag, rejectUnknown } from "./lib/args.js";
import { readHookEvents } from "./lib/hook-events.js";

const ROOT = join(import.meta.dirname, "..");
const REPORT_PATH = join(ROOT, "spec", "audit", "loop-audit.md");
const PLANS_DIR = join(ROOT, "docs", "plans");
const TIMING_PATH = join(ROOT, ".holonovel-state", "gate-timing.json");

const USAGE = `Usage: npx tsx scripts/loop-audit.ts [--write] [--check] [--json]

  --write  Write spec/audit/loop-audit.md (default: print to stdout).
  --check  Fail (exit 1) when drift exceeds a recorded threshold.
  --json   Emit the metrics as JSON instead of Markdown.
  --help   Show this message.
`;

// Thresholds for --check. Chosen from the historical baseline, not invented:
// date drift was 28/672 (4.2%) and must not grow past 5%; the trailing 14-day
// window opened with 4 repeated subjects, so 4 is a no-new-debt ceiling that
// decays as those commits age out of the window. Increments are held at zero
// missing AARs from the moment docs/plans/ exists.
const MAX_DATE_DRIFT_RATIO = 0.05;
const MAX_REPEATED_SUBJECTS = 4;
const SESSION_GAP_SECONDS = 90 * 60;
const REPEAT_WINDOW_SECONDS = 14 * 24 * 60 * 60;

interface Commit {
  hash: string;
  seconds: number;
  subject: string;
}

interface Push {
  hash: string;
  seconds: number;
  commits: number;
}

interface GateRow {
  runs: number;
  failures: number;
  medianMs: number;
  p95Ms: number;
  zeroFindingStreak: number;
}

interface Metrics {
  head: string;
  headDate: string;
  commits: number;
  activeDays: number;
  spanDays: number;
  sessions: number;
  commitsPerSession: number;
  repeatedSubjects: number;
  recentRepeats: number;
  dateDrift: number;
  dateDriftRatio: number;
  pushes: number;
  medianCommitsPerPush: number;
  singleCommitPushes: number;
  medianPushGapMinutes: number;
  pushesUnderHour: number;
  increments: number;
  incrementsMissingAar: number;
  incrementsMissingLoopToken: number;
  gateRows: Record<string, GateRow>;
  hookSkips: number;
  hookRuns: number;
}

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function readCommits(): Commit[] {
  const raw = git(["log", "--format=%H%x09%ct%x09%s"]).trim();
  if (!raw) return [];
  return raw.split("\n").map((line) => {
    const [hash, seconds, ...rest] = line.split("\t");
    return { hash, seconds: Number(seconds), subject: rest.join("\t") };
  });
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

function localDate(seconds: number): string {
  const d = new Date(seconds * 1000);
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readPushes(commitsDescending: Commit[]): Push[] {
  let raw = "";
  try {
    raw = git(["reflog", "show", "origin/main", "--date=unix", "--format=%H%x09%gd%x09%gs"]).trim();
  } catch {
    // No origin/main reflog (fresh clone or no remote): push metrics are
    // unavailable, which the report states rather than guessing.
    return [];
  }
  const events: { hash: string; seconds: number }[] = [];
  for (const line of raw.split("\n")) {
    const [hash, gd, gs] = line.split("\t");
    if (gs !== "update by push") continue;
    const match = gd?.match(/\{(\d+)\}/);
    if (match) events.push({ hash, seconds: Number(match[1]) });
  }
  events.reverse();
  const pushes: Push[] = [];
  let previous = "";
  for (const event of events) {
    let count = 0;
    try {
      count = Number(git(["rev-list", "--count", previous ? `${previous}..${event.hash}` : event.hash]).trim());
    } catch {
      count = 0;
    }
    pushes.push({ hash: event.hash, seconds: event.seconds, commits: count });
    previous = event.hash;
  }
  // Drop the bootstrap push (the whole history at first observation).
  if (pushes.length > 0 && pushes[0].commits === commitsDescending.length) pushes.shift();
  return pushes;
}

function readIncrements(): { increments: number; missingAar: number; missingLoop: number } {
  if (!existsSync(PLANS_DIR)) return { increments: 0, missingAar: 0, missingLoop: 0 };
  const dirs = readdirSync(PLANS_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  let missingAar = 0;
  let missingLoop = 0;
  for (const dir of dirs) {
    const aarPath = join(PLANS_DIR, dir.name, "aar.md");
    if (!existsSync(aarPath)) {
      missingAar++;
      continue;
    }
    const aar = readFileSync(aarPath, "utf-8");
    if (!/LOOP (PAUSED|OPEN)/.test(aar)) missingLoop++;
  }
  return { increments: dirs.length, missingAar, missingLoop };
}

function readGateRows(): Record<string, GateRow> {
  if (!existsSync(TIMING_PATH)) return {};
  let records: { gate: string; ms: number; status: string }[] = [];
  try {
    const parsed = JSON.parse(readFileSync(TIMING_PATH, "utf-8")) as { records?: typeof records };
    records = Array.isArray(parsed.records) ? parsed.records : [];
  } catch {
    // Corrupt telemetry is disposable; report no gate rows rather than failing.
    return {};
  }
  const byGate = new Map<string, { ms: number[]; failures: number; streak: number }>();
  for (const record of records) {
    const entry = byGate.get(record.gate) ?? { ms: [], failures: 0, streak: 0 };
    entry.ms.push(record.ms);
    if (record.status === "fail") {
      entry.failures++;
      entry.streak = 0;
    } else if (record.status === "pass") {
      entry.streak++;
    }
    byGate.set(record.gate, entry);
  }
  const rows: Record<string, GateRow> = {};
  for (const [gate, entry] of byGate) {
    rows[gate] = {
      runs: entry.ms.length,
      failures: entry.failures,
      medianMs: Math.round(median(entry.ms)),
      p95Ms: Math.round(percentile(entry.ms, 95)),
      zeroFindingStreak: entry.streak,
    };
  }
  return rows;
}

function computeMetrics(): Metrics {
  const commitsDescending = readCommits();
  const commits = [...commitsDescending].sort((a, b) => a.seconds - b.seconds);
  const head = commits.length > 0 ? commitsDescending[0].hash : "";
  const headDate = commits.length > 0 ? localDate(commitsDescending[0].seconds) : "unknown";

  const days = new Set(commits.map((c) => localDate(c.seconds)));
  const spanDays = commits.length > 0
    ? Math.round((commits[commits.length - 1].seconds - commits[0].seconds) / 86400)
    : 0;

  const sessions: Commit[][] = [];
  for (const commit of commits) {
    const current = sessions[sessions.length - 1];
    if (!current || commit.seconds - current[current.length - 1].seconds > SESSION_GAP_SECONDS) {
      sessions.push([commit]);
    } else {
      current.push(commit);
    }
  }

  const subjectSeen = new Map<string, number[]>();
  const recentCutoff = commits.length > 0 ? commits[commits.length - 1].seconds - REPEAT_WINDOW_SECONDS : 0;
  let repeated = 0;
  for (const commit of commits) {
    const seen = subjectSeen.get(commit.subject) ?? [];
    if (seen.some((previous) => commit.seconds - previous <= REPEAT_WINDOW_SECONDS)) repeated++;
    seen.push(commit.seconds);
    subjectSeen.set(commit.subject, seen);
  }
  // --check scores the trailing window, not all history: an old repeat is a
  // record, a new one is a habit. The all-time count stays in the snapshot.
  let recentRepeats = 0;
  const recentSeen = new Map<string, boolean>();
  for (const commit of commits) {
    if (commit.seconds < recentCutoff) continue;
    if (recentSeen.has(commit.subject)) recentRepeats++;
    recentSeen.set(commit.subject, true);
  }

  const datePattern = /^(?:## )?(\d{4}-\d{2}-\d{2}) — /;
  let drift = 0;
  for (const commit of commits) {
    const match = commit.subject.match(datePattern);
    if (match && match[1] !== localDate(commit.seconds)) drift++;
  }

  const pushes = readPushes(commitsDescending);
  const pushGaps: number[] = [];
  for (let i = 1; i < pushes.length; i++) {
    pushGaps.push((pushes[i].seconds - pushes[i - 1].seconds) / 60);
  }

  const increments = readIncrements();
  const hookEvents = readHookEvents();

  return {
    head,
    headDate,
    commits: commits.length,
    activeDays: days.size,
    spanDays,
    sessions: sessions.length,
    commitsPerSession: sessions.length === 0 ? 0 : commits.length / sessions.length,
    repeatedSubjects: repeated,
    recentRepeats,
    dateDrift: drift,
    dateDriftRatio: commits.length === 0 ? 0 : drift / commits.length,
    pushes: pushes.length,
    medianCommitsPerPush: median(pushes.map((p) => p.commits)),
    singleCommitPushes: pushes.filter((p) => p.commits === 1).length,
    medianPushGapMinutes: Math.round(median(pushGaps)),
    pushesUnderHour: pushGaps.filter((gap) => gap < 60).length,
    increments: increments.increments,
    incrementsMissingAar: increments.missingAar,
    incrementsMissingLoopToken: increments.missingLoop,
    gateRows: readGateRows(),
    hookSkips: hookEvents.filter((e) => e.action === "skipped").length,
    hookRuns: hookEvents.filter((e) => e.action === "ran").length,
  };
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function renderMarkdown(metrics: Metrics): string {
  const gateNames = Object.keys(metrics.gateRows).sort();
  const lines: string[] = [];
  lines.push(`# Loop audit — as of ${metrics.head.slice(0, 7)} (${metrics.headDate})`);
  lines.push("");
  lines.push("Generated by `scripts/loop-audit.ts`. Snapshot of the session and");
  lines.push("publication loops at the commit above; refresh with `npm run loop-audit`.");
  lines.push("");
  lines.push("## Session loop");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|---|---|");
  lines.push(`| Commits | ${metrics.commits} |`);
  lines.push(`| Active days | ${metrics.activeDays} of ${metrics.spanDays + 1} |`);
  lines.push(`| Sessions (≥90 min gap) | ${metrics.sessions} |`);
  lines.push(`| Commits per session | ${metrics.commitsPerSession.toFixed(1)} |`);
  lines.push(`| Repeated subjects within 14 days | ${metrics.repeatedSubjects} |`);
  lines.push(`| Repeated subjects in trailing 14 days | ${metrics.recentRepeats} |`);
  lines.push(`| Subject date ≠ commit date | ${metrics.dateDrift} (${pct(metrics.dateDriftRatio)}) |`);
  lines.push(`| Tracked increments | ${metrics.increments} |`);
  lines.push(`| Increments missing AAR | ${metrics.incrementsMissingAar} |`);
  lines.push(`| AARs missing LOOP token | ${metrics.incrementsMissingLoopToken} |`);
  lines.push("");
  lines.push("## Publication loop");
  lines.push("");
  if (metrics.pushes === 0) {
    lines.push("No `origin/main` push reflog in this clone; push metrics unavailable.");
  } else {
    lines.push("| Metric | Value |");
    lines.push("|---|---|");
    lines.push(`| Pushes observed | ${metrics.pushes} |`);
    lines.push(`| Median commits per push | ${metrics.medianCommitsPerPush} |`);
    lines.push(`| Single-commit pushes | ${metrics.singleCommitPushes} |`);
    lines.push(`| Median interval (min) | ${metrics.medianPushGapMinutes} |`);
    lines.push(`| Intervals under 1 h | ${metrics.pushesUnderHour} |`);
  }
  lines.push("");
  lines.push("## Gate cost");
  lines.push("");
  if (gateNames.length === 0) {
    lines.push("No gate timing recorded yet — run a gate with `--timing`.");
  } else {
    lines.push("| Gate | Runs | Failures | Median ms | p95 ms | Zero-finding streak |");
    lines.push("|---|---|---|---|---|---|");
    for (const name of gateNames) {
      const row = metrics.gateRows[name];
      lines.push(`| \`${name}\` | ${row.runs} | ${row.failures} | ${row.medianMs} | ${row.p95Ms} | ${row.zeroFindingStreak} |`);
    }
  }
  lines.push("");
  lines.push("## Hook events");
  lines.push("");
  lines.push(`Ran: ${metrics.hookRuns} · Skipped: ${metrics.hookSkips}`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function checkThresholds(metrics: Metrics): string[] {
  const problems: string[] = [];
  if (metrics.incrementsMissingAar > 0) {
    problems.push(`${metrics.incrementsMissingAar} tracked increment(s) missing an AAR`);
  }
  if (metrics.incrementsMissingLoopToken > 0) {
    problems.push(`${metrics.incrementsMissingLoopToken} AAR(s) without a LOOP token`);
  }
  if (metrics.dateDriftRatio > MAX_DATE_DRIFT_RATIO) {
    problems.push(`subject/date drift ${pct(metrics.dateDriftRatio)} exceeds ${pct(MAX_DATE_DRIFT_RATIO)}`);
  }
  if (metrics.recentRepeats > MAX_REPEATED_SUBJECTS) {
    problems.push(`${metrics.recentRepeats} repeated subjects in the last 14 days exceeds ${MAX_REPEATED_SUBJECTS}`);
  }
  return problems;
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--write", "--check", "--json", "--help", "-h"]), USAGE);

  const write = parseFlag(argv, "--write");
  const check = parseFlag(argv, "--check");
  const json = parseFlag(argv, "--json");

  const metrics = computeMetrics();
  const problems = checkThresholds(metrics);

  if (json) {
    console.log(JSON.stringify({ metrics, problems }, null, 2));
  } else if (write) {
    mkdirSync(join(ROOT, "spec", "audit"), { recursive: true });
    writeFileSync(REPORT_PATH, renderMarkdown(metrics));
    console.log(`loop-audit: wrote spec/audit/loop-audit.md (as of ${metrics.head.slice(0, 7)})`);
  } else {
    process.stdout.write(renderMarkdown(metrics));
  }

  if (check) {
    if (problems.length > 0) {
      for (const problem of problems) console.error(`loop-audit: ${problem}`);
      process.exit(1);
    }
    console.log("loop-audit: check passed");
  }
}

try {
  main();
} catch (error) {
  console.error(`loop-audit: fatal: ${(error as Error).message}`);
  process.exit(2);
}
