#!/usr/bin/env npx tsx
/**
 * run-gates.ts — run the project gate suite from one manifest. [gate]
 *
 * Single source of truth for the `check` (full) and `check:fast` gate lists.
 * Full mode runs sequentially and stops at the first failure, matching the old
 * `&&` chain. Fast mode runs in parallel and buffers each gate's output so a
 * failure is attributed to its gate instead of interleaving with its siblings.
 *
 * `--timing` records one row per gate into `.holonovel-state/gate-timing.json`
 * (local only, never committed) so gate cost and zero-finding runs are
 * measurable rather than folklore. `--list --format=md` emits the gate table
 * consumed by AGENTS.md; `--list` alone keeps the plain form.
 *
 * Usage: npx tsx scripts/run-gates.ts --full|--fast [--timing] [--list [--format plain|md]]
 * Exit codes: 0 = all gates passed, 1 = a gate failed, 2 = fatal.
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { handleHelp, parseFlag, parseValueFlag, rejectUnknown } from "./lib/args.js";
import { gateRunMatches, readGateRun, writeGateRun } from "./lib/gate-run-manifest.js";

const ROOT = join(import.meta.dirname, "..");
const TIMING_PATH = join(ROOT, ".holonovel-state", "gate-timing.json");
const TIMING_CAP = 4000;

const USAGE = `Usage: npx tsx scripts/run-gates.ts --full|--fast [--timing] [--list [--format plain|md]]

  --full     Run every gate sequentially, stopping at the first failure.
  --fast     Run the fast subset in parallel (structural checks, no proofreading).
  --timing   Append per-gate timings to .holonovel-state/gate-timing.json.
  --record   Write the run manifest the git hooks read (.holonovel-state/gate-run.json).
  --recorded Print the suite that already passed on this exact tree:
             "full", "fast", "full+publish", "fast+publish", or "none".
  --list     Print the gate manifest and exit.
  --format   With --list: "plain" (default) or "md" (Markdown table).
  --help     Show this message.
`;

type Mode = "fast" | "full";
type Status = "pass" | "fail" | "advisory-fail";

import { GATES, renderMarkdownTable, type Gate } from "./lib/gate-manifest.js";


interface Result {
  code: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}

interface TimingRecord {
  at: string;
  mode: Mode;
  head: string;
  gate: string;
  ms: number;
  status: Status;
}

function runGate(gate: Gate, mode: Mode, capture: boolean): Promise<Result> {
  const args = mode === "fast" ? gate.fast : gate.full;
  if (!args) return Promise.resolve({ code: 0, stdout: "", stderr: "" });
  return new Promise((resolve) => {
    const child = spawn(args[0], args.slice(1), {
      cwd: ROOT,
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    let stdout = "";
    let stderr = "";
    if (capture) {
      child.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
      child.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    }
    child.on("error", (error) => resolve({ code: null, stdout, stderr, error }));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

function shortHead(): string {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    // A repo without commits (or without git) still records timings; the head
    // is informational, so an empty value is safe.
    return "";
  }
}

function writeTiming(records: TimingRecord[]): void {
  let prior: TimingRecord[] = [];
  if (existsSync(TIMING_PATH)) {
    try {
      const parsed = JSON.parse(readFileSync(TIMING_PATH, "utf-8")) as { records?: TimingRecord[] };
      prior = Array.isArray(parsed.records) ? parsed.records : [];
    } catch {
      // A corrupt timing file is disposable local state: start a fresh one
      // rather than failing a gate run over telemetry.
      prior = [];
    }
  }
  const merged = [...prior, ...records].slice(-TIMING_CAP);
  mkdirSync(join(ROOT, ".holonovel-state"), { recursive: true });
  writeFileSync(TIMING_PATH, `${JSON.stringify({ schema_version: 1, records: merged }, null, 2)}\n`);
}

function finish(mode: Mode, failed: number, record: boolean, startedAt: string): never {
  const label = mode === "fast" ? "check:fast" : "check";
  if (record) {
    writeGateRun(mode, startedAt, new Date().toISOString(), failed > 0 ? "fail" : "pass");
  }
  if (failed > 0) {
    console.error(`\n${label}: FAIL`);
    process.exit(1);
  }
  console.log(`\n${label}: PASS`);
  process.exit(0);
}

function listGates(format: string): void {
  if (format === "md") {
    console.log(renderMarkdownTable());
    return;
  }
  if (format !== "plain") {
    console.error(`run-gates: unknown --format value: ${format}`);
    process.exit(1);
  }
  for (const gate of GATES) {
    const modes = [gate.fast ? "fast" : null, "full"].filter(Boolean).join(",");
    console.log(`${gate.name}${modes ? ` (${modes})` : ""}`);
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2).flatMap((arg) => {
    // Accept --flag=value as well as --flag value (npm pass-through makes both
    // forms common); parseValueFlag only understands the space form.
    const equals = arg.match(/^(--[a-z-]+)=(.+)$/i);
    return equals ? [equals[1], equals[2]] : [arg];
  });
  handleHelp(argv, USAGE);

  const fast = parseFlag(argv, "--fast");
  const full = parseFlag(argv, "--full");
  const list = parseFlag(argv, "--list");
  const timing = parseFlag(argv, "--timing");
  const recordRun = parseFlag(argv, "--record");
  const recorded = parseFlag(argv, "--recorded");
  const format = parseValueFlag(argv, "--format") ?? "plain";
  rejectUnknown(argv, new Set(["--fast", "--full", "--list", "--timing", "--record", "--recorded", "--format", "--help", "-h"]), USAGE);
  if (format !== "plain" && format !== "md") {
    console.error(`run-gates: unknown --format value: ${format}`);
    process.stderr.write(USAGE);
    process.exit(1);
  }

  if (list) {
    listGates(format);
    process.exit(0);
  }

  if (recorded) {
    const matched = gateRunMatches("full") ? "full" : gateRunMatches("fast") ? "fast" : "none";
    const run = matched === "none" ? null : readGateRun();
    console.log(run && run.publish ? `${matched}+publish` : matched);
    process.exit(0);
  }

  if (fast === full) {
    console.error("run-gates: pass exactly one of --fast or --full");
    process.stderr.write(USAGE);
    process.exit(1);
  }

  const mode: Mode = fast ? "fast" : "full";
  const startedAt = new Date().toISOString();
  const head = shortHead();
  const records: TimingRecord[] = [];
  const record = (gate: Gate, ms: number, status: Status): void => {
    records.push({ at: new Date().toISOString(), mode, head, gate: gate.name, ms: Math.round(ms), status });
  };

  if (mode === "full") {
    for (const gate of GATES) {
      console.log(`\n=== ${gate.name} ===`);
      const started = performance.now();
      const result = await runGate(gate, mode, false);
      const ms = performance.now() - started;
      if (result.error) {
        console.error(`gate ${gate.name} could not start: ${result.error.message}`);
        if (timing) writeTiming(records);
        process.exit(2);
      }
      const passed = result.code === 0;
      record(gate, ms, passed ? "pass" : gate.advisory ? "advisory-fail" : "fail");
      if (!passed && gate.advisory) {
        console.error(`\nADVISORY FAIL (does not block): ${gate.name}`);
        continue;
      }
      if (!passed) {
        console.error(`\nGATE FAILED: ${gate.name}`);
        if (timing) writeTiming(records);
        finish(mode, 1, recordRun, startedAt);
      }
    }
    if (timing) writeTiming(records);
    finish(mode, 0, recordRun, startedAt);
  }

  const fastGates = GATES.filter((gate) => gate.fast !== null);
  const resultPairs = await Promise.all(
    fastGates.map(async (gate) => {
      const gateStart = performance.now();
      const result = await runGate(gate, mode, true);
      return { gate, result, ms: performance.now() - gateStart };
    }),
  );
  let failed = 0;
  for (const { gate, result, ms } of resultPairs) {
    if (result.error) {
      console.error(`gate ${gate.name} could not start: ${result.error.message}`);
      if (timing) writeTiming(records);
      process.exit(2);
    }
    const passed = result.code === 0;
    record(gate, ms, passed ? "pass" : gate.advisory ? "advisory-fail" : "fail");
    if (!passed && gate.advisory) {
      console.error(`\n=== ${gate.name}: ADVISORY FAIL (does not block) ===`);
      continue;
    }
    if (!passed) {
      failed++;
      console.error(`\n=== ${gate.name}: FAILED ===`);
      if (result.stdout.trim()) console.error(result.stdout.trimEnd());
      if (result.stderr.trim()) console.error(result.stderr.trimEnd());
    } else {
      console.log(`PASS ${gate.name}`);
    }
  }
  if (timing) writeTiming(records);
  console.log(`\n${fastGates.length - failed} passed, ${failed} failed`);
  finish(mode, failed, recordRun, startedAt);
}

void main();
