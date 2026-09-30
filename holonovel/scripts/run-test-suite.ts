#!/usr/bin/env node
/**
 * run-test-suite.ts — bounded-concurrency runner for the server test suite. [gate]
 *
 * Runs the `test:all` command set with bounded parallelism instead of the
 * former sequential `&&` chain (REQ-314 rebuild-scoping surface / suite
 * runtime). Every harness isolates its own state (temp DATA_DIR or an isolated
 * HOLONOVEL_STATE_DIR), so commands may overlap; the runner buffers each
 * command's output to keep the log readable and fails the whole run when any
 * command fails.
 *
 * Usage: tsx scripts/run-test-suite.ts [--concurrency <n>] [--help]
 *   --concurrency  Max simultaneous commands (default min(4, CPUs); env
 *                  HOLONOVEL_TEST_CONCURRENCY overrides).
 * Exit codes: 0 = all commands passed, 1 = one or more failed, 2 = fatal.
 */
import { spawn } from "node:child_process";
import { join } from "node:path";
import { cpus } from "node:os";

const ROOT = join(import.meta.dirname, "..");

// Ordered suite, mirroring the former `test:all` chain. Keep in step with
// holonovel/package.json when a harness is added or removed.
const TESTS = [
  "test:harness-guard",
  "test:lean-narrator",
  "test:workflow",
  "test:character-creation",
  "test:fingerprints",
  "test:output-contracts",
  "test:pattern-buffer",
  "test:pattern-buffer-ruleset",
  "test:backfill",
  "test:persistence",
  "test:persistence-guardrails",
  "test:limits",
  "test:narrative",
  "test:adventure",
  "test:g7",
  "test:tool-definitions",
  "test:competitive-gaps",
  "test:fate",
  "test:ironsworn",
  "test:forged",
  "test:security",
  "test:event-log",
  "test:belief",
  "test:identity",
  "test:causal",
  "test:corpus",
  "test:index",
  "test:graph",
  "test:supplementary",
  "test:agent",
  "test:perception",
  "test:briefing",
  "test:playtest-lib",
  "test:help",
  "test:update-workflow",
  "check:vendor",
  "check:conversion-evidence",
];

const USAGE = `Usage: tsx scripts/run-test-suite.ts [--concurrency <n>]

Options:
  --concurrency <n>  Max simultaneous commands (default min(4, CPUs)).
  -h, --help         Show this help.

Exit codes: 0 = all passed, 1 = a command failed, 2 = fatal.`;

function parseConcurrency(argv: string[]): number {
  const flag = argv.indexOf("--concurrency");
  const raw = flag >= 0 ? argv[flag + 1] : process.env.HOLONOVEL_TEST_CONCURRENCY;
  if (raw === undefined) return Math.min(4, Math.max(1, cpus().length));
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    console.error(`Invalid concurrency: ${raw}`);
    process.exit(1);
  }
  return Math.min(n, TESTS.length);
}

const argv = process.argv.slice(2);
if (argv.includes("-h") || argv.includes("--help")) {
  console.log(USAGE);
  process.exit(0);
}
const known = new Set(["--concurrency"]);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]!;
  if (known.has(a)) continue;
  if (i > 0 && known.has(argv[i - 1]!)) continue;
  console.error(`Unknown argument: ${a}\n${USAGE}`);
  process.exit(1);
}

interface Result {
  name: string;
  code: number;
  seconds: number;
  output: string;
}

function runOne(name: string): Promise<Result> {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = spawn("npm", ["run", name], { cwd: ROOT, env: { ...process.env } });
    let output = "";
    child.stdout.on("data", (d) => { output += d.toString(); });
    child.stderr.on("data", (d) => { output += d.toString(); });
    child.on("error", (e) => {
      resolve({ name, code: 1, seconds: (Date.now() - start) / 1000, output: `${output}\n${e.message}` });
    });
    child.on("close", (code) => {
      resolve({ name, code: code ?? 1, seconds: (Date.now() - start) / 1000, output });
    });
  });
}

async function main(): Promise<void> {
  const concurrency = parseConcurrency(argv);
  console.log(`=== Test suite: ${TESTS.length} commands, concurrency ${concurrency} ===\n`);
  const results = new Map<string, Result>();
  const queue = [...TESTS];
  const started = Date.now();

  async function worker(): Promise<void> {
    for (;;) {
      const name = queue.shift();
      if (name === undefined) return;
      const r = await runOne(name);
      results.set(name, r);
      console.log(`  ${r.code === 0 ? "PASS" : "FAIL"} ${name} (${r.seconds.toFixed(1)}s)`);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const ordered = TESTS.map((n) => results.get(n)!).filter(Boolean);
  const failed = ordered.filter((r) => r.code !== 0);
  for (const r of failed) {
    console.error(`\n----- FAIL ${r.name} (exit ${r.code}) -----`);
    const lines = r.output.trimEnd().split("\n");
    console.error(lines.slice(-40).join("\n"));
  }

  const total = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n${ordered.length - failed.length} passed, ${failed.length} failed (${total}s wall clock)`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e: unknown) => {
  console.error(`fatal: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(2);
});
