#!/usr/bin/env npx tsx
/**
 * tool-definitions-heuristics.ts — report-only TDQS heuristics over the
 * committed `holonovel/tool-definitions.json` snapshot. [informational]
 *
 * Deterministic proxies are gates (see scripts/tool-definitions-lint.ts); this
 * script reports the classes that resist a precise predicate, so their
 * false-positive rate can be measured before promotion:
 *   - behavioral-transparency disclosure: a mutating tool whose description
 *     names neither persistence/audit nor a reversibility term;
 *   - cross-tool near-duplication: description token sets above a Jaccard
 *     threshold (candidate purpose overlap / disambiguation defects).
 *
 * Exit codes: 0 always (findings are advisory). `--json` emits the payload.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { jaccard, tokenize } from "./lib/similarity.js";

const ROOT = join(import.meta.dirname, "..");
const ARTIFACT = join(ROOT, "holonovel", "tool-definitions.json");
const DUP_THRESHOLD = 0.5;
const STOP = new Set(["the", "a", "an", "and", "or", "of", "to", "for", "use", "when", "not", "do", "is", "in", "on", "by", "with", "this", "that", "it", "its", "actions", "action", "novel", "state"]);

interface ToolRecord { name: string; description: string; action_enum: string[]; }
if (!existsSync(ARTIFACT)) { console.error(`FATAL: ${ARTIFACT} not found.`); process.exit(2); }
const artifact: { tools: ToolRecord[] } = JSON.parse(readFileSync(ARTIFACT, "utf-8"));

const tokens = (s: string): Set<string> => tokenize(s, { minLen: 4, stop: STOP });

const missingDisclosure: string[] = [];
const interactionMarkers = ["only when", "only by", "only ", "falls back", "alias", "overrides", "replaces", "ignores", "with neither", "defaults"];
const interactionCovered: string[] = [];
const interactionBare: string[] = [];
for (const t of artifact.tools) {
  if (t.action_enum.length === 0) continue; // non-action tools (set_badge, respond_decision, manage_history) reviewed separately
  const d = t.description.toLowerCase();
  const persists = d.includes("persist") || d.includes("audit") || d.includes("record");
  const reversible = ["revert", "undo", "reversib", "permanent", "append-only", "idempotent", "derived"].some((w) => d.includes(w));
  if (!persists || !reversible) missingDisclosure.push(t.name);
  if (interactionMarkers.some((m) => d.includes(m))) interactionCovered.push(t.name);
  else interactionBare.push(t.name);
}

const dupes: { a: string; b: string; sim: number }[] = [];
const tok = new Map(artifact.tools.map((t) => [t.name, tokens(t.description)]));
for (let i = 0; i < artifact.tools.length; i++) {
  for (let j = i + 1; j < artifact.tools.length; j++) {
    const sim = jaccard(tok.get(artifact.tools[i].name)!, tok.get(artifact.tools[j].name)!);
    if (sim >= DUP_THRESHOLD) dupes.push({ a: artifact.tools[i].name, b: artifact.tools[j].name, sim: Number(sim.toFixed(2)) });
  }
}
dupes.sort((x, y) => y.sim - x.sim);

const names = artifact.tools.map((t) => t.name);
const notClauseRefs = new Map(artifact.tools.map((t) => {
  const index = t.description.toLowerCase().indexOf("do not use when");
  const clause = index === -1 ? "" : t.description.slice(index);
  return [t.name, names.filter((n) => n !== t.name && clause.includes(n))];
}));
const mutualPairs: [string, string][] = [];
for (const [name, refs] of notClauseRefs) {
  for (const other of refs) {
    if (name < other && (notClauseRefs.get(other) ?? []).includes(name)) mutualPairs.push([name, other]);
  }
}
const dense = artifact.tools
  .map((t) => ({ name: t.name, refs: names.filter((n) => n !== t.name && t.description.includes(n)) }))
  .filter((entry) => entry.refs.length > 3);

if (process.argv.slice(2).includes("--json")) {
  process.stdout.write(JSON.stringify({ missingDisclosure, interactionCovered, interactionBare, dupes, dupThreshold: DUP_THRESHOLD, mutualPairs, dense }, null, 2) + "\n");
  process.exit(0);
}

console.log(`heuristics over ${artifact.tools.length} tools (report-only)`);
console.log(`  behavioral-disclosure gaps (gated by tool-definitions-lint): ${missingDisclosure.length}${missingDisclosure.length ? " — " + missingDisclosure.join(", ") : ""}`);
console.log(`  parameter-semantics coverage (report-only): ${interactionCovered.length}/${interactionCovered.length + interactionBare.length} tools carry an interaction clause`);
if (interactionBare.length) console.log(`    without an interaction clause: ${interactionBare.join(", ")}`);
console.log(`  near-duplicate description pairs (Jaccard >= ${DUP_THRESHOLD}): ${dupes.length}`);
for (const d of dupes.slice(0, 10)) console.log(`    ${d.a} ~ ${d.b} (${d.sim})`);
console.log(`  mutual "Do NOT use when" pairs (REQ-554): ${mutualPairs.length}`);
for (const [a, b] of mutualPairs) console.log(`    ${a} <-> ${b}`);
console.log(`  descriptions naming more than three siblings (REQ-554): ${dense.length}${dense.length ? " — " + dense.map((d) => `${d.name} (${d.refs.length})`).join(", ") : ""}`);
process.exit(0);
