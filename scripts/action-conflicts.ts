#!/usr/bin/env npx tsx
/**
 * action-conflicts.ts — report candidate action-contract conflicts. [gate]
 *
 * Extracts `tool (action: …, params…)` bindings from REQ normative bodies and
 * reports each tool/action bound by two or more REQs whose parameter sets are
 * disjoint — candidates for the Appendix M action-contract-uniqueness review.
 *
 * The heuristic cannot distinguish an operation overload (a genuine defect)
 * from cumulative requirement decomposition (an action's parameters introduced
 * across several REQs). Known groups are dispositioned in
 * `spec/audit/action-conflicts-baseline.json`; report-only by default, while
 * `--check` fails on any group not listed there so a NEW candidate is caught.
 * Exit codes: 0 = clean / report-only, 1 = unbaselined candidate under --check
 * or a missing baseline file.
 *
 * Flags: --check, --json (machine-readable payload to stdout), --help/-h.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readSpec, extractActionBindings } from "./lib/parse-spec.js";
import { handleHelp } from "./lib/args.js";

const BASELINE_PATH = join(import.meta.dirname, "..", "spec", "audit", "action-conflicts-baseline.json");

const USAGE = `action-conflicts — report candidate action-contract conflicts

Usage: npx tsx scripts/action-conflicts.ts [--check] [--json]

  --check  Exit 1 when a candidate group is not in the baseline
           (spec/audit/action-conflicts-baseline.json).
  --json   Emit the findings as JSON to stdout (default: text report)
  --help   Show this help

Report-only unless --check is passed.`;

const argv = process.argv.slice(2);
handleHelp(argv, USAGE);
for (const flag of argv) {
  if (flag !== "--json" && flag !== "--check") {
    console.error(`action-conflicts: unknown flag '${flag}' (see --help)`);
    process.exit(1);
  }
}
const asJson = argv.includes("--json");
const checkMode = argv.includes("--check");

interface BaselineEntry {
  tool: string;
  action: string;
  disposition: string;
  justification: string;
  since?: string;
}

function loadBaselineEntries(): BaselineEntry[] {
  if (!existsSync(BASELINE_PATH)) {
    console.error(`action-conflicts: baseline not found at ${BASELINE_PATH}`);
    process.exit(1);
  }
  let parsed: { baseline?: BaselineEntry[] };
  try {
    parsed = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
  } catch (e: any) {
    console.error(`action-conflicts: could not parse baseline: ${e.message}`);
    process.exit(1);
  }
  return parsed.baseline ?? [];
}

function loadBaseline(): Set<string> {
  return new Set(loadBaselineEntries().map((b) => `${b.tool}\u0000${b.action}`));
}

const bindings = extractActionBindings(readSpec());

interface Candidate {
  tool: string;
  action: string;
  pairs: { reqA: string; paramsA: string[]; reqB: string; paramsB: string[] }[];
}

// Group bindings by tool/action, keeping each REQ's named-parameter set.
const groups = new Map<string, Map<string, Set<string>>>();
for (const b of bindings) {
  const key = `${b.tool}\u0000${b.action}`;
  if (!groups.has(key)) groups.set(key, new Map());
  const reqs = groups.get(key)!;
  if (!reqs.has(b.reqId)) reqs.set(b.reqId, new Set());
  for (const p of b.params) reqs.get(b.reqId)!.add(p);
}

const candidates: Candidate[] = [];
for (const [key, reqs] of [...groups.entries()].sort()) {
  const named = [...reqs.entries()].filter(([, p]) => p.size > 0);
  const pairs: Candidate["pairs"] = [];
  for (let i = 0; i < named.length; i++) {
    for (let j = i + 1; j < named.length; j++) {
      const [reqA, paramsA] = named[i];
      const [reqB, paramsB] = named[j];
      if (![...paramsA].some((p) => paramsB.has(p))) {
        pairs.push({ reqA, paramsA: [...paramsA].sort(), reqB, paramsB: [...paramsB].sort() });
      }
    }
  }
  if (pairs.length > 0) {
    const [tool, action] = key.split("\u0000");
    candidates.push({ tool, action, pairs });
  }
}

const baseline = checkMode ? loadBaseline() : new Set<string>();
const unbaselined = candidates.filter((c) => !baseline.has(`${c.tool}\u0000${c.action}`));

if (asJson) {
  process.stdout.write(JSON.stringify({ candidates, unbaselined: unbaselined.map((c) => `${c.tool} (action: ${c.action})`), bindingCount: bindings.length }, null, 2) + "\n");
  process.exit(checkMode && unbaselined.length > 0 ? 1 : 0);
}

// A `known-conflict` baseline entry records an unresolved operation overload;
// it must stay named on ROADMAP.md until resolved, so it cannot silently
// persist. (The `since` field, when present, records when it was opened.)
const ROADMAP_PATH = join(import.meta.dirname, "..", "ROADMAP.md");
const roadmap = existsSync(ROADMAP_PATH) ? readFileSync(ROADMAP_PATH, "utf-8") : "";
const orphanConflicts = checkMode
  ? loadBaselineEntries().filter((b) => b.disposition === "known-conflict" && !roadmap.includes(b.action))
  : [];

if (checkMode && (unbaselined.length > 0 || orphanConflicts.length > 0)) {
  if (unbaselined.length > 0) {
    console.error("=== UNBASELINED ACTION-CONTRACT CANDIDATES ===\n");
    for (const c of unbaselined) {
      console.error(`${c.tool} (action: ${c.action})`);
      for (const p of c.pairs) console.error(`  - ${p.reqA}{${p.paramsA.join(",")}} vs ${p.reqB}{${p.paramsB.join(",")}}`);
    }
    console.error(`\n${unbaselined.length} unbaselined candidate(s) across ${bindings.length} bindings.`);
    console.error("Resolve the conflict or add a disposition to spec/audit/action-conflicts-baseline.json.");
  }
  if (orphanConflicts.length > 0) {
    console.error("=== KNOWN-CONFLICT BASELINE ENTRIES MISSING FROM ROADMAP.md ===");
    for (const b of orphanConflicts) console.error(`  ${b.tool} (action: ${b.action})`);
    console.error("A known-conflict entry must be tracked on ROADMAP.md until resolved.");
  }
  process.exit(1);
}

console.log("=== ACTION-CONTRACT CONFLICT CANDIDATES (report-only) ===\n");
for (const c of candidates) {
  const status = checkMode ? "baselined" : "candidate";
  console.log(`${c.tool} (action: ${c.action}) [${status}]`);
  for (const p of c.pairs) {
    console.log(`  - ${p.reqA}{${p.paramsA.join(",")}} vs ${p.reqB}{${p.paramsB.join(",")}}`);
  }
}
console.log(`\n${candidates.length} candidate(s) across ${bindings.length} bindings.`);
if (checkMode) console.log("All candidates are baselined (spec/audit/action-conflicts-baseline.json).");
else console.log("Review against Appendix M action-contract uniqueness (report-only; use --check to gate).");
process.exit(0);
