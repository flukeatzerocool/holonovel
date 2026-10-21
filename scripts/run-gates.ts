#!/usr/bin/env npx tsx
/**
 * run-gates.ts — run the project gate suite from one manifest. [gate]
 *
 * Single source of truth for the `check` (full) and `check:fast` gate lists.
 * Full mode runs sequentially and stops at the first failure, matching the old
 * `&&` chain. Fast mode runs in parallel and buffers each gate's output so a
 * failure is attributed to its gate instead of interleaving with its siblings.
 *
 * Usage: npx tsx scripts/run-gates.ts --full|--fast [--list]
 * Exit codes: 0 = all gates passed, 1 = a gate failed, 2 = fatal.
 */
import { spawn } from "node:child_process";
import { join } from "node:path";
import { handleHelp, parseFlag } from "./lib/args.js";

const ROOT = join(import.meta.dirname, "..");

const USAGE = `Usage: npx tsx scripts/run-gates.ts --full|--fast [--list]

  --full   Run every gate sequentially, stopping at the first failure.
  --fast   Run the fast subset in parallel (structural checks, no proofreading).
  --list   Print the gate manifest and exit.
  --help   Show this message.
`;

type Mode = "fast" | "full";

interface Gate {
  name: string;
  fast: string[];
  full: string[];
}

const npm = (script: string, ...extra: string[]): string[] =>
  extra.length > 0 ? ["npm", "run", script, "--", ...extra] : ["npm", "run", script];

const GATES: Gate[] = [
  { name: "lint", fast: npm("lint"), full: npm("lint") },
  { name: "validate", fast: npm("validate:fast"), full: npm("validate:sdd") },
  { name: "test:validators", fast: npm("test:validators"), full: npm("test:validators") },
  { name: "test:spec-tooling", fast: npm("test:spec-tooling"), full: npm("test:spec-tooling") },
  { name: "test:script-tooling", fast: npm("test:script-tooling"), full: npm("test:script-tooling") },
  { name: "test:ruleset-gates", fast: npm("test:ruleset-gates"), full: npm("test:ruleset-gates") },
  { name: "validate-readme", fast: npm("validate-readme"), full: npm("validate-readme") },
  { name: "check-script-discipline", fast: npm("check-script-discipline"), full: npm("check-script-discipline") },
  { name: "check-script-quality", fast: npm("check-script-quality"), full: npm("check-script-quality") },
  { name: "check-workflows", fast: npm("check-workflows"), full: npm("check-workflows") },
  { name: "check-traceability", fast: npm("check-traceability"), full: npm("check-traceability") },
  { name: "check-markers", fast: npm("check-markers"), full: npm("check-markers") },
  { name: "check-registers", fast: npm("check-registers"), full: npm("check-registers:strict") },
  { name: "check-fingerprint-sync", fast: npm("check-fingerprint-sync"), full: npm("check-fingerprint-sync") },
  { name: "check-tool-definitions-sync", fast: npm("check-tool-definitions-sync"), full: npm("check-tool-definitions-sync") },
  { name: "tool-definitions-lint", fast: npm("tool-definitions-lint"), full: npm("tool-definitions-lint") },
  { name: "check-tool-surface", fast: npm("check-tool-surface"), full: npm("check-tool-surface") },
  { name: "surface-budget", fast: npm("surface-budget"), full: npm("surface-budget") },
  { name: "surface-replay", fast: npm("surface-replay"), full: npm("surface-replay") },
  { name: "check-performance-record", fast: npm("check-performance-record"), full: npm("check-performance-record") },
  { name: "tool-citation-check", fast: npm("tool-citation-check"), full: npm("tool-citation-check") },
  {
    name: "check-reference-server-cleanliness",
    fast: npm("check-reference-server-cleanliness"),
    full: npm("check-reference-server-cleanliness"),
  },
  { name: "check-starter-freshness", fast: npm("check-starter-freshness"), full: npm("check-starter-freshness") },
  { name: "check:conformance", fast: npm("check:conformance"), full: npm("check:conformance") },
  {
    name: "action-conflicts",
    fast: npm("action-conflicts", "--check"),
    full: npm("action-conflicts", "--check"),
  },
  { name: "typecheck", fast: npm("typecheck"), full: npm("typecheck") },
];

interface Result {
  code: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}

function runGate(gate: Gate, mode: Mode, capture: boolean): Promise<Result> {
  const args = gate[mode];
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

function finish(mode: Mode, failed: number): never {
  const label = mode === "fast" ? "check:fast" : "check";
  if (failed > 0) {
    console.error(`\n${label}: FAIL`);
    process.exit(1);
  }
  console.log(`\n${label}: PASS`);
  process.exit(0);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);

  const fast = parseFlag(argv, "--fast");
  const full = parseFlag(argv, "--full");
  const list = parseFlag(argv, "--list");
  const known = new Set(["--fast", "--full", "--list"]);
  for (const arg of argv) {
    if (!known.has(arg)) {
      console.error(`run-gates: unknown flag: ${arg}`);
      process.stderr.write(USAGE);
      process.exit(1);
    }
  }

  if (list) {
    for (const gate of GATES) {
      const modes = [fast && "fast", full && "full"].filter(Boolean).join(",");
      console.log(`${gate.name}${modes ? ` (${modes})` : ""}`);
    }
    process.exit(0);
  }

  if (fast === full) {
    console.error("run-gates: pass exactly one of --fast or --full");
    process.stderr.write(USAGE);
    process.exit(1);
  }

  const mode: Mode = fast ? "fast" : "full";

  if (mode === "full") {
    for (const gate of GATES) {
      console.log(`\n=== ${gate.name} ===`);
      const result = await runGate(gate, mode, false);
      if (result.error) {
        console.error(`gate ${gate.name} could not start: ${result.error.message}`);
        process.exit(2);
      }
      if (result.code !== 0) {
        console.error(`\nGATE FAILED: ${gate.name}`);
        finish(mode, 1);
      }
    }
    finish(mode, 0);
  }

  const results = await Promise.all(GATES.map((gate) => runGate(gate, mode, true)));
  let failed = 0;
  for (let i = 0; i < GATES.length; i++) {
    const gate = GATES[i];
    const result = results[i];
    if (result.error) {
      console.error(`gate ${gate.name} could not start: ${result.error.message}`);
      process.exit(2);
    }
    if (result.code !== 0) {
      failed++;
      console.error(`\n=== ${gate.name}: FAILED ===`);
      if (result.stdout.trim()) console.error(result.stdout.trimEnd());
      if (result.stderr.trim()) console.error(result.stderr.trimEnd());
    } else {
      console.log(`PASS ${gate.name}`);
    }
  }
  console.log(`\n${GATES.length - failed} passed, ${failed} failed`);
  finish(mode, failed);
}

void main();
