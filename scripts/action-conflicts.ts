#!/usr/bin/env npx tsx
/**
 * action-conflicts.ts — report candidate action-contract conflicts. [informational]
 *
 * Extracts `tool (action: …, params…)` bindings from REQ normative bodies and
 * reports each tool/action bound by two or more REQs whose parameter sets are
 * disjoint — candidates for the Appendix M action-contract-uniqueness review.
 *
 * The heuristic cannot distinguish an operation overload (a genuine defect)
 * from cumulative requirement decomposition (an action's parameters introduced
 * across several REQs), so this reports candidates for manual review and is
 * deliberately NOT wired into a gate. Exit codes: 0 always.
 *
 * Flags: --json (machine-readable payload to stdout), --help/-h.
 */
import { readSpec, extractActionBindings } from "./lib/parse-spec.js";
import { handleHelp } from "./lib/args.js";

const USAGE = `action-conflicts — report candidate action-contract conflicts

Usage: npx tsx scripts/action-conflicts.ts [--json]

  --json   Emit the findings as JSON to stdout (default: text report)
  --help   Show this help

Report-only: exits 0 regardless of findings.`;

const argv = process.argv.slice(2);
handleHelp(argv, USAGE);
for (const flag of argv) {
  if (flag !== "--json") {
    console.error(`action-conflicts: unknown flag '${flag}' (see --help)`);
    process.exit(1);
  }
}
const asJson = argv.includes("--json");

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

if (asJson) {
  process.stdout.write(JSON.stringify({ candidates, bindingCount: bindings.length }, null, 2) + "\n");
  process.exit(0);
}

console.log("=== ACTION-CONTRACT CONFLICT CANDIDATES (report-only) ===\n");
for (const c of candidates) {
  console.log(`${c.tool} (action: ${c.action})`);
  for (const p of c.pairs) {
    console.log(`  - ${p.reqA}{${p.paramsA.join(",")}} vs ${p.reqB}{${p.paramsB.join(",")}}`);
  }
}
console.log(`\n${candidates.length} candidate(s) across ${bindings.length} bindings.`);
console.log("Review against Appendix M action-contract uniqueness (report-only; not a gate).");
process.exit(0);
