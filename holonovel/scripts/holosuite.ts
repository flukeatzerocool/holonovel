#!/usr/bin/env node
/**
 * holosuite.ts — Holosuite unified evaluation runner. [gate]
 *
 * Runs the deterministic Holosuite tiers against a live holonovel server:
 * T0 protocol conformance (`conformance`), T1 bounded model-based invariants
 * (`invariants`), T3 adversarial input fuzzing (`adversarial`), and T4
 * differential/replay determinism (`differential`). The report-only method
 * audit (`mutation`) reports the mutation-audit catch rate and is not part of
 * `all`. Emits a structured JSON report with `--json`. The stochastic
 * Understudies tier is a follow-on increment and is not selected here.
 *
 * Usage:
 *   tsx scripts/holosuite.ts --tier=all [--server-dir <dir>] [--data-dir <dir>]
 *                            [--seed <n>] [--steps <n>] [--json] [--help]
 *
 * Exit codes: 0 = all selected tiers passed, 1 = a tier failed or emitted a
 * finding, 2 = fatal (bad flags or an unrecoverable tier error).
 *
 * Implements the Holosuite testing environment (plans/2026-10-02-holosuite);
 * cites REQ-450 (tool annotations) and REQ-001/REQ-002/REQ-032/REQ-041/REQ-050
 * as the contracts the tiers exercise.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { runConformance } from "./lib/holosuite-conformance.js";
import { runInvariants } from "./lib/holosuite-invariants.js";
import { runAdversarial } from "./lib/holosuite-adversarial.js";
import { runDifferential } from "./lib/holosuite-differential.js";
import { runMutationAudit } from "./lib/holosuite-mutation.js";
import { appendEvent, canonicalJson, summarize, type EvalProvenance, type TierResult } from "./lib/eval-schema.js";

installHarnessGuard();

type Tier = "conformance" | "invariants" | "adversarial" | "differential" | "mutation" | "all";

const USAGE = `Usage: tsx scripts/holosuite.ts --tier=<conformance|invariants|adversarial|differential|mutation|all> [options]

Options:
  --tier <name>        Tier to run (required): conformance, invariants,
                       adversarial, differential, mutation, or all. The
                       mutation tier is report-only and excluded from all.
  --server-dir <dir>   Server root under test (default: current directory).
  --data-dir <dir>     State dir to use (default: a fresh temp dir per tier).
  --seed <n>           Deterministic seed (default: 1).
  --steps <n>          Bounded sequence length for the invariants tier (default: 12).
  --report <path>      Write a canonical JSON report to <path> and an event log to <path>.jsonl.
  --json               Emit a machine-readable report to stdout.
  -h, --help           Show this help.

Exit codes: 0 = pass, 1 = failure/finding, 2 = fatal.`;

/** REQ contracts each tier exercises, for event traceability and the aggregate. */
const TIER_REQS: Record<string, string[]> = {
  conformance: ["REQ-020", "REQ-022", "REQ-023", "REQ-024", "REQ-025", "REQ-450"],
  invariants: ["REQ-001", "REQ-032", "REQ-041", "REQ-050"],
  adversarial: ["REQ-002", "REQ-054", "REQ-444", "REQ-450"],
  differential: ["REQ-041", "REQ-050", "REQ-055"],
  mutation: ["REQ-050", "REQ-141m"],
};

function parseArgs(argv: string[]): { tier: Tier; serverDir: string; dataDir?: string; seed: number; steps: number; report?: string; json: boolean } {
  const VALUE_FLAGS = new Set(["--tier", "--server-dir", "--data-dir", "--seed", "--steps", "--report"]);
  const BOOL_FLAGS = new Set(["--json"]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "-h" || a === "--help") continue;
    if (a.includes("=")) {
      const flag = a.slice(0, a.indexOf("="));
      if (!VALUE_FLAGS.has(flag)) throw new Error(`Unknown argument: ${a}`);
      continue;
    }
    if (BOOL_FLAGS.has(a)) continue;
    if (VALUE_FLAGS.has(a)) {
      i++; // consume the flag's value
      continue;
    }
    throw new Error(`Unknown argument: ${a}`);
  }
  const value = (flag: string): string | undefined => {
    const eq = argv.find((a) => a.startsWith(`${flag}=`));
    if (eq) return eq.slice(flag.length + 1);
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const tier = (value("--tier") ?? "all") as Tier;
  if (!["conformance", "invariants", "adversarial", "differential", "mutation", "all"].includes(tier)) throw new Error(`Unknown tier: ${tier}`);
  const seed = Number.parseInt(value("--seed") ?? "1", 10);
  const steps = Number.parseInt(value("--steps") ?? "12", 10);
  if (!Number.isFinite(seed) || !Number.isFinite(steps) || steps < 1) throw new Error("--seed/--steps must be positive integers");
  return { tier, serverDir: value("--server-dir") ?? join(import.meta.dirname, ".."), dataDir: value("--data-dir"), seed, steps, report: value("--report"), json: argv.includes("--json") };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    console.log(USAGE);
    process.exit(0);
  }
  let args;
  try {
    args = parseArgs(argv);
  } catch (e: unknown) {
    console.error(`${e instanceof Error ? e.message : String(e)}\n${USAGE}`);
    process.exit(1);
  }
  const results: TierResult[] = [];
  if (args.tier === "conformance" || args.tier === "all") {
    results.push(await runConformance({ serverDir: args.serverDir, dataDir: args.dataDir }));
  }
  if (args.tier === "invariants" || args.tier === "all") {
    results.push(await runInvariants({ serverDir: args.serverDir, dataDir: args.dataDir, seed: args.seed, steps: args.steps }));
  }
  if (args.tier === "adversarial" || args.tier === "all") {
    results.push(await runAdversarial({ serverDir: args.serverDir, dataDir: args.dataDir, seed: args.seed }));
  }
  if (args.tier === "differential" || args.tier === "all") {
    results.push(await runDifferential({ serverDir: args.serverDir, dataDir: args.dataDir, seed: args.seed }));
  }
  if (args.tier === "mutation") {
    results.push(await runMutationAudit());
  }
  // Coverage traceability (§8): every event carries the REQs its tier
  // exercises, and the aggregate is emitted for the coverage register.
  const coverage: Record<string, string[]> = {};
  for (const r of results) {
    const declared = TIER_REQS[r.tier] ?? [];
    for (const e of r.events) if (e.req_ids.length === 0) e.req_ids = [...declared];
    const reqs = [...new Set([...declared, ...r.events.flatMap((e) => e.req_ids)])];
    for (const req of reqs) (coverage[req] ??= []).push(r.tier);
  }
  const summary = summarize(results);
  if (args.report) {
    const provenance: EvalProvenance = {
      server_dir: args.serverDir,
      git_sha: null,
      spec_hash: null,
      ruleset: null,
      novel: null,
      node: process.version,
      seed: args.seed,
    };
    writeFileSync(args.report, canonicalJson({ provenance, tiers: results, summary, coverage }) + "\n");
    for (const r of results) for (const e of r.events) appendEvent(`${args.report}.jsonl`, e);
  }
  harnessComplete();

  if (args.json) {
    console.log(JSON.stringify({ tiers: results, summary, coverage }, null, 2));
  } else {
    for (const r of results) console.log(`${r.failed === 0 ? "PASS" : "FAIL"} ${r.tier}: ${r.passed} passed, ${r.failed} failed`);
    for (const r of results) {
      if (r.metrics && typeof r.metrics.catch_rate === "number") {
        const missed = Array.isArray(r.metrics.missed) ? r.metrics.missed : [];
        console.log(`  ${r.tier} catch_rate=${r.metrics.catch_rate} (${r.metrics.caught}/${r.metrics.seeded})${missed.length ? ` missed: ${missed.join(", ")}` : ""}`);
      }
    }
    for (const f of summary.findings) console.error(`  FINDING [${f.severity}] ${f.tier}/${f.class} @ ${f.predicate} — ${f.detail}`);
  }
  const ok = summary.failed === 0 && results.every((r) => r.findings.length === 0);
  if (!args.json) console.log(`holosuite: ${ok ? "PASS" : "FAIL"}`);
  process.exit(ok ? 0 : 1);
}

main().catch((e: unknown) => {
  console.error(`holosuite fatal: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(2);
});
