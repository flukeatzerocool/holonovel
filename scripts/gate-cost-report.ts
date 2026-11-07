#!/usr/bin/env npx tsx
/**
 * gate-cost-report.ts — per-gate cost and retirement candidates. [informational; gate with --apply]
 *
 * Purpose: gate suites grow and never shrink. `package.json` scripts went from 3
 * to 63 and the gate manifest from 26 to 32 with zero retirements. This report
 * reads the local gate-timing log and flags gates that have not failed in N
 * consecutive runs, then (with --apply) downgrades them to advisory by writing
 * spec/audit/gate-retirement.json. A gate is never deleted automatically.
 *
 * Usage: npx tsx scripts/gate-cost-report.ts [--apply] [--threshold N] [--json]
 * Exit codes: 0 = report produced, 1 = --apply failed to write, 2 = fatal.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { handleHelp, parseFlag, parseValueFlag, rejectUnknown } from "./lib/args.js";

const ROOT = join(import.meta.dirname, "..");
const TIMING = join(ROOT, ".holonovel-state", "gate-timing.json");
const RETIREMENT = join(ROOT, "spec", "audit", "gate-retirement.json");
const DEFAULT_THRESHOLD = 20;

const USAGE = `Usage: npx tsx scripts/gate-cost-report.ts [--apply] [--threshold N] [--json]

  --apply        Write spec/audit/gate-retirement.json for candidates.
  --threshold N  Consecutive zero-finding runs required (default ${DEFAULT_THRESHOLD}).
  --json         Emit the report as JSON.
  --help         Show this message.
`;

interface TimingRecord {
  gate: string;
  ms: number;
  status: string;
  at: string;
}

interface Row {
  gate: string;
  runs: number;
  failures: number;
  medianMs: number;
  p95Ms: number;
  zeroFindingStreak: number;
  candidate: boolean;
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
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

function loadRecords(): TimingRecord[] {
  if (!existsSync(TIMING)) return [];
  try {
    const parsed = JSON.parse(readFileSync(TIMING, "utf-8")) as { records?: TimingRecord[] };
    return Array.isArray(parsed.records) ? parsed.records : [];
  } catch {
    // Corrupt telemetry is disposable; report no rows rather than failing.
    return [];
  }
}

function buildRows(records: TimingRecord[], threshold: number): Row[] {
  const grouped = new Map<string, TimingRecord[]>();
  for (const record of records) {
    const list = grouped.get(record.gate) ?? [];
    list.push(record);
    grouped.set(record.gate, list);
  }
  const rows: Row[] = [];
  for (const [gate, list] of grouped) {
    const ms = list.map((record) => record.ms);
    const failures = list.filter((record) => record.status === "fail").length;
    let streak = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].status === "pass") streak++;
      else break;
    }
    rows.push({
      gate,
      runs: list.length,
      failures,
      medianMs: Math.round(median(ms)),
      p95Ms: Math.round(percentile(ms, 95)),
      zeroFindingStreak: streak,
      candidate: streak >= threshold && failures === 0,
    });
  }
  return rows.sort((a, b) => b.medianMs - a.medianMs);
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--apply", "--threshold", "--json", "--help", "-h"]), USAGE);
  const apply = parseFlag(argv, "--apply");
  const json = parseFlag(argv, "--json");
  const threshold = Number(parseValueFlag(argv, "--threshold") ?? DEFAULT_THRESHOLD);
  if (!Number.isFinite(threshold) || threshold < 1) {
    console.error("gate-cost-report: --threshold must be a positive integer");
    process.exit(1);
  }

  const rows = buildRows(loadRecords(), threshold);
  const candidates = rows.filter((row) => row.candidate);

  if (json) {
    console.log(JSON.stringify({ threshold, rows, candidates: candidates.map((row) => row.gate) }, null, 2));
  } else {
    if (rows.length === 0) {
      console.log("gate-cost-report: no timing recorded yet — run `npm run check:fast` (it passes --timing)");
    } else {
      console.log("| Gate | Runs | Failures | Median ms | p95 ms | Zero-finding streak |");
      console.log("|---|---|---|---|---|---|");
      for (const row of rows) {
        const mark = row.candidate ? " (candidate)" : "";
        console.log(`| \`${row.gate}\`${mark} | ${row.runs} | ${row.failures} | ${row.medianMs} | ${row.p95Ms} | ${row.zeroFindingStreak} |`);
      }
    }
    console.log(
      `\nRetirement threshold: ${threshold} consecutive zero-finding runs. ` +
        `${candidates.length} candidate(s).`,
    );
  }

  if (apply && candidates.length > 0) {
    mkdirSync(dirname(RETIREMENT), { recursive: true });
    let existing: { schema_version: number; advisory: string[]; decisions: { gate: string; date: string; reason: string }[] } = {
      schema_version: 1,
      advisory: [],
      decisions: [],
    };
    if (existsSync(RETIREMENT)) {
      try {
        existing = JSON.parse(readFileSync(RETIREMENT, "utf-8")) as typeof existing;
      } catch {
        console.error("gate-cost-report: gate-retirement.json is unreadable — refusing to overwrite");
        process.exit(1);
      }
    }
    const date = new Date().toISOString().slice(0, 10);
    for (const row of candidates) {
      if (!existing.advisory.includes(row.gate)) {
        existing.advisory.push(row.gate);
        existing.decisions.push({
          gate: row.gate,
          date,
          reason: `${row.zeroFindingStreak} consecutive zero-finding runs (threshold ${threshold}); downgraded to advisory`,
        });
      }
    }
    writeFileSync(RETIREMENT, `${JSON.stringify(existing, null, 2)}\n`);
    console.log(`\ngate-cost-report: wrote ${RETIREMENT} (${existing.advisory.length} advisory gate(s))`);
  }
}

try {
  main();
} catch (error) {
  console.error(`gate-cost-report: fatal: ${(error as Error).message}`);
  process.exit(2);
}
