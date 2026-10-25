#!/usr/bin/env node
/**
 * holosuite.ts — Holosuite unified evaluation runner. [gate]
 *
 * Runs the deterministic Holosuite tiers against a live holonovel server:
 * T0 protocol conformance (`conformance`), T1 bounded model-based invariants
 * (`invariants`), T2 bundled-Novel walkthrough (`novel`), T3 adversarial input
 * fuzzing (`adversarial`), and T4 differential/replay determinism
 * (`differential`). The report-only method audit (`mutation`) reports the
 * mutation-audit catch rate and is not part of `all`. Emits a structured JSON
 * report with `--json`. The stochastic Understudies tier is a follow-on
 * increment and is not selected here.
 *
 * Evidence integrity: per-REQ coverage is derived from assertion events, every
 * emitted predicate is resolved against the source tree, provenance pins the
 * commit and spec hash, and `--check-determinism` proves a second run matches.
 *
 * Usage:
 *   tsx scripts/holosuite.ts --tier=all [--server-dir <dir>] [--data-dir <dir>]
 *                            [--seed <n>] [--steps <n>] [--spec <path>]
 *                            [--check-determinism] [--report <path>] [--json] [--help]
 *
 * Exit codes: 0 = all selected tiers passed, 1 = a tier failed or emitted a
 * finding, 2 = fatal (bad flags, unreadable spec, or an unrecoverable tier
 * error).
 *
 * Implements the Holosuite testing environment (plans/2026-10-02-holosuite);
 * cites REQ-450 (tool annotations) and REQ-001/REQ-002/REQ-032/REQ-041/REQ-050
 * as the contracts the tiers exercise.
 */
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { runConformance } from "./lib/holosuite-conformance.js";
import { runInvariants } from "./lib/holosuite-invariants.js";
import { runAdversarial } from "./lib/holosuite-adversarial.js";
import { runDifferential } from "./lib/holosuite-differential.js";
import { runNovel } from "./lib/holosuite-novel.js";
import { runMutationAudit } from "./lib/holosuite-mutation.js";
import { appendEvent, canonicalJson, summarize, type EvalFinding, type EvalProvenance, type TierResult } from "./lib/eval-schema.js";
import { deriveCoverage, validateCoverage } from "./lib/eval-coverage.js";
import { resolvePredicate } from "./lib/eval-predicate.js";
import { gitDirty, gitSha, specContentHash } from "./lib/eval-provenance.js";
import { extractReqHeaders, readSpec } from "../../scripts/lib/parse-spec.js";

installHarnessGuard();

type Tier = "conformance" | "invariants" | "novel" | "adversarial" | "differential" | "mutation" | "all";

const USAGE = `Usage: tsx scripts/holosuite.ts --tier=<conformance|invariants|novel|adversarial|differential|mutation|all> [options]

Options:
  --tier <name>        Tier to run (required): conformance, invariants, novel,
                       adversarial, differential, mutation, or all. The
                       mutation tier is report-only and excluded from all.
  --server-dir <dir>   Server root under test (default: current directory).
  --data-dir <dir>     State dir to use (default: a fresh temp dir per tier).
  --seed <n>           Deterministic seed (default: 1).
  --steps <n>          Bounded sequence length for the invariants tier (default: 12).
  --spec <path>        Assembled spec used to validate REQ identifiers
                       (default: <server-dir>/../holonovel.md).
  --check-determinism  Run the selected tiers twice and compare report digests.
  --report <path>      Write a canonical JSON report to <path> and an event log to <path>.jsonl.
  --json               Emit a machine-readable report to stdout.
  -h, --help           Show this help.

Exit codes: 0 = pass, 1 = failure/finding, 2 = fatal.`;

/** REQ contracts each tier asserts, used to validate coverage honesty. */
const TIER_REQS: Record<string, string[]> = {
  conformance: ["REQ-001", "REQ-002", "REQ-020", "REQ-022", "REQ-023", "REQ-024", "REQ-170", "REQ-450", "REQ-570", "REQ-581", "REQ-598"],
  invariants: ["REQ-001", "REQ-002", "REQ-032", "REQ-041", "REQ-050", "REQ-603", "REQ-604", "REQ-606"],
  novel: ["REQ-089", "REQ-096j", "REQ-284", "REQ-542", "REQ-565", "REQ-599", "REQ-601", "REQ-602", "REQ-603", "REQ-604", "REQ-606"],
  adversarial: ["REQ-001", "REQ-002", "REQ-032", "REQ-041", "REQ-054", "REQ-603"],
  differential: ["REQ-050", "REQ-055", "REQ-089", "REQ-601"],
  mutation: ["REQ-050", "REQ-141m"],
};

const P_TIER_REQS = "holonovel/scripts/holosuite.ts:71"; // TIER_REQS declaration
const P_DETERMINISM = "holonovel/scripts/holosuite.ts:244"; // reportDigest (determinism comparison)

interface Args {
  tier: Tier;
  serverDir: string;
  dataDir?: string;
  seed: number;
  steps: number;
  spec: string;
  report?: string;
  json: boolean;
  checkDeterminism: boolean;
}

function parseArgs(argv: string[]): Args {
  const VALUE_FLAGS = new Set(["--tier", "--server-dir", "--data-dir", "--seed", "--steps", "--spec", "--report"]);
  const BOOL_FLAGS = new Set(["--json", "--check-determinism"]);
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
  if (!["conformance", "invariants", "novel", "adversarial", "differential", "mutation", "all"].includes(tier)) throw new Error(`Unknown tier: ${tier}`);
  const seed = Number.parseInt(value("--seed") ?? "1", 10);
  const steps = Number.parseInt(value("--steps") ?? "12", 10);
  if (!Number.isFinite(seed) || !Number.isFinite(steps) || steps < 1) throw new Error("--seed/--steps must be positive integers");
  const serverDir = value("--server-dir") ?? join(import.meta.dirname, "..");
  const spec = value("--spec") ?? join(serverDir, "..", "holonovel.md");
  return {
    tier,
    serverDir,
    dataDir: value("--data-dir"),
    seed,
    steps,
    spec,
    report: value("--report"),
    json: argv.includes("--json"),
    checkDeterminism: argv.includes("--check-determinism"),
  };
}

/** Run the selected tiers; the caller may invoke this twice for determinism. */
async function runTiers(args: Args): Promise<TierResult[]> {
  const results: TierResult[] = [];
  if (args.tier === "conformance" || args.tier === "all") {
    results.push(await runConformance({ serverDir: args.serverDir, dataDir: args.dataDir }));
  }
  if (args.tier === "invariants" || args.tier === "all") {
    results.push(await runInvariants({ serverDir: args.serverDir, dataDir: args.dataDir, seed: args.seed, steps: args.steps }));
  }
  if (args.tier === "novel" || args.tier === "all") {
    results.push(await runNovel({ serverDir: args.serverDir, dataDir: args.dataDir, seed: args.seed }));
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
  return results;
}

/** REQ IDs defined by the assembled spec, including family aliases. */
function readSpecReqIds(path: string): Set<string> {
  const ids = new Set(extractReqHeaders(readSpec(path)).map((header) => header.id));
  // A family ID (REQ-020) is valid when its leaves (REQ-020a/b) are defined,
  // matching the prefix fallback used elsewhere in the project.
  for (const id of [...ids]) {
    const family = /^(REQ-\d{3})[a-z0-9]+$/.exec(id);
    if (family) ids.add(family[1]!);
  }
  return ids;
}

/** Add coverage-honesty findings to the tiers they concern. */
function applyCoverageValidation(results: TierResult[], specIds: Set<string>): void {
  const { unknown, unasserted } = validateCoverage(TIER_REQS, results, specIds);
  for (const result of results) {
    // The mutation tier is report-only: its catch rate is a metric, not a set
    // of assertions, so declaration coverage does not apply to it.
    if (result.tier === "mutation") continue;
    for (const entry of unknown.filter((u) => u.tier === result.tier)) {
      const target = (TIER_REQS[result.tier] ?? []).includes(entry.req) ? entry.req : "";
      result.findings.push({
        class: "coverage_unknown_req",
        predicate: P_TIER_REQS,
        tier: result.tier,
        step: 0,
        severity: "P1",
        target,
        detail: `${entry.req} is declared or asserted but is not defined in the spec`,
      });
      result.failed++;
    }
    for (const entry of unasserted.filter((u) => u.tier === result.tier)) {
      result.findings.push({
        class: "coverage_unasserted_req",
        predicate: P_TIER_REQS,
        tier: result.tier,
        step: 0,
        severity: "P1",
        target: entry.req,
        detail: `${entry.req} is declared for ${entry.tier} but no assertion in that tier exercises it`,
      });
      result.failed++;
    }
  }
}

/** Add predicate-resolution findings for every finding and assertion anchor. */
function applyPredicateValidation(results: TierResult[], root: string): void {
  for (const result of results) {
    const unresolved = new Map<string, { step: number; target: string; detail: string }>();
    for (const finding of result.findings) {
      const resolution = resolvePredicate(finding.predicate, root);
      if (!resolution.ok && !unresolved.has(finding.predicate)) {
        unresolved.set(finding.predicate, { step: finding.step, target: finding.target, detail: resolution.reason });
      }
    }
    for (const event of result.events) {
      if (event.tool !== "assertion" || !event.predicate) continue;
      const resolution = resolvePredicate(event.predicate, root);
      if (!resolution.ok && !unresolved.has(event.predicate)) {
        unresolved.set(event.predicate, { step: event.step, target: event.req_ids.join(","), detail: resolution.reason });
      }
    }
    for (const [predicate, info] of unresolved) {
      const finding: EvalFinding = {
        class: "predicate_unresolved",
        predicate,
        tier: result.tier,
        step: info.step,
        severity: "P1",
        target: info.target,
        detail: info.detail,
      };
      result.findings.push(finding);
      result.failed++;
    }
  }
}

/** Canonical digest of the evidence body, for the determinism comparison. */
function reportDigest(provenance: EvalProvenance, results: TierResult[]): string {
  return createHash("sha256")
    .update(canonicalJson({ provenance, tiers: results, summary: summarize(results), coverage: deriveCoverage(results) }))
    .digest("hex");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    console.log(USAGE);
    process.exit(0);
  }
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (e: unknown) {
    console.error(`${e instanceof Error ? e.message : String(e)}\n${USAGE}`);
    process.exit(1);
  }

  let specIds: Set<string>;
  try {
    specIds = readSpecReqIds(args.spec);
  } catch {
    console.error(`holosuite fatal: cannot read the spec for REQ validation: ${args.spec} (pass --spec <path>)`);
    process.exit(2);
  }

  const provenance: EvalProvenance = {
    server_dir: args.serverDir,
    git_sha: gitSha(args.serverDir),
    git_dirty: gitDirty(args.serverDir),
    spec_hash: specContentHash(args.spec),
    spec_path: args.spec,
    ruleset: null,
    novel: null,
    node: process.version,
    seed: args.seed,
  };

  const results = await runTiers(args);
  let determinism: { checked: boolean; digest: string } | null = null;
  if (args.checkDeterminism) {
    const first = reportDigest(provenance, results);
    const second = reportDigest(provenance, await runTiers(args));
    if (first === second) {
      determinism = { checked: true, digest: first };
      console.error(`determinism: identical (${first.slice(0, 16)})`);
    } else {
      results.push({
        tier: "determinism",
        passed: 0,
        failed: 1,
        findings: [{
          class: "nondeterministic_report",
          predicate: P_DETERMINISM,
          tier: "determinism",
          step: 0,
          severity: "P0",
          target: "",
          detail: `two runs with the same seed produced different evidence digests (${first.slice(0, 16)} != ${second.slice(0, 16)})`,
        }],
        events: [],
      });
    }
  }

  applyCoverageValidation(results, specIds);
  applyPredicateValidation(results, join(args.serverDir, ".."));

  const coverage = deriveCoverage(results);
  const summary = summarize(results);
  if (args.report) {
    const report = { provenance, determinism, tiers: results, summary, coverage };
    writeFileSync(args.report, canonicalJson(report) + "\n");
    writeFileSync(`${args.report}.jsonl`, "");
    for (const r of results) for (const e of r.events) appendEvent(`${args.report}.jsonl`, e);
  }
  harnessComplete();

  if (args.json) {
    console.log(JSON.stringify({ provenance, determinism, tiers: results, summary, coverage }, null, 2));
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
