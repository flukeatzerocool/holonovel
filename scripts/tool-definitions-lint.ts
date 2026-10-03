#!/usr/bin/env npx tsx
/**
 * tool-definitions-lint.ts — static enforcement of the Tool Definition
 * Authoring Standard (REQ-024c, REQ-450, Appendix T.2) over the committed
 * `holonovel/tool-definitions.json` snapshot. [gate]
 *
 * Runs without booting the server, so definition drift is caught at
 * `check:fast`/pre-commit as well as at publication. Enforces the deterministic
 * TDQS proxies:
 *   - three-clause structure (summary, "Use when:", "Do NOT use when:");
 *   - non-tautological opening (description is not just the tool name/title);
 *   - the "Do NOT use when:" clause names at least one real sibling tool;
 *   - uniform `verb_noun` naming against the recorded verb allowlist;
 *   - description within the recorded byte budget; title >= name length;
 *   - documented output-schema fields.
 *
 * The LLM-judged TDQS dimensions are intentionally out of scope; only
 * deterministic proxies gate. Exit codes: 0 = conformant, 1 = violations,
 * 2 = fatal (missing/unreadable artifact).
 *
 * Flags: `--json` (machine-readable payload to stdout).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  applyHardGates, dimensionProxies, computeTdqs, computeTier, PASSING_TIER,
  coherenceProxies, shadowCandidatesWithCosts, type ContextSignals, type ToolDefinition,
} from "../holonovel/src/core/tdqs.js";

const ROOT = join(import.meta.dirname, "..");
const ARTIFACT = join(ROOT, "holonovel", "tool-definitions.json");
const DECISIONS = join(ROOT, "holonovel", "DECISIONS.md");
const VERB_ALLOWLIST = ["manage", "resolve", "run", "respond", "set"];
const NAME_RE = /^(manage|resolve|run|respond|set)_[a-z][a-z0-9_]*$/;
// REQ-450 disclosure vocabulary: a mutating tool must disclose persistence and
// reversibility (or that the mutation is irreversible/derived). Recorded in
// DECISIONS.md beside the description budget.
const PERSISTENCE_TOKENS = ["persist", "audit", "record"];
const REVERSIBILITY_TOKENS = ["revert", "undo", "reversib", "permanent", "append-only", "idempotent", "derived"];

interface ToolRecord {
  name: string; title: string; description: string; description_bytes: number;
  action_enum: string[]; param_count: number; required: string[];
  params: Record<string, string>; output_fields: Record<string, string>;
  annotations: Record<string, boolean> | null; context_signals?: ContextSignals;
  category: string; gate: string;
}
interface Artifact { schema_version: number; tool_count: number; tools_list_bytes: number; tools: ToolRecord[]; }

function recordedDescriptionBudget(): number {
  const md = readFileSync(DECISIONS, "utf-8");
  const m = md.match(/\*\*Recorded description budget:\*\*\s*(\d+)/);
  if (!m) { console.error("FATAL: DECISIONS.md is missing the REQ-024c 'Recorded description budget' line."); process.exit(2); }
  return parseInt(m[1], 10);
}

if (!existsSync(ARTIFACT)) {
  console.error(`FATAL: ${ARTIFACT} not found — run \`npx tsx holonovel/scripts/generate-tool-definitions.ts\`.`);
  process.exit(2);
}

let artifact: Artifact;
try { artifact = JSON.parse(readFileSync(ARTIFACT, "utf-8")); }
catch (e) { console.error(`FATAL: tool-definitions.json is not valid JSON: ${(e as Error).message}`); process.exit(2); }

const budget = recordedDescriptionBudget();
const names = new Set(artifact.tools.map((t) => t.name));
const violations: string[] = [];

for (const t of artifact.tools) {
  const desc = t.description;
  const lower = desc.toLowerCase();
  if (!lower.includes("use when") || !lower.includes("do not use when")) {
    violations.push(`${t.name}: description missing the three-clause structure (REQ-024a)`);
  }
  if (!NAME_RE.test(t.name) || !VERB_ALLOWLIST.includes(t.name.split("_")[0]!)) {
    violations.push(`${t.name}: does not match the uniform verb_noun convention (REQ-429)`);
  }
  if (t.title.length < t.name.length) {
    violations.push(`${t.name}: title '${t.title}' shorter than the tool name (REQ-024c)`);
  }
  if (t.description_bytes > budget) {
    violations.push(`${t.name}: description ${t.description_bytes}B exceeds the recorded budget ${budget}B (REQ-024c)`);
  }
  const trimmed = desc.trim().replace(/\.$/, "");
  if (trimmed === t.name || trimmed === t.title || trimmed.length < 30) {
    violations.push(`${t.name}: tautological or truncating opening — description must add meaning beyond the name/title (REQ-450)`);
  }
  // The "Do NOT use when:" clause must name a real sibling tool.
  const notIdx = lower.indexOf("do not use when");
  const notClause = notIdx === -1 ? "" : desc.slice(notIdx);
  const sibling = [...names].some((n) => n !== t.name && notClause.includes(n));
  if (notIdx !== -1 && !sibling) {
    violations.push(`${t.name}: "Do NOT use when:" clause names no registered sibling tool (REQ-024a)`);
  }
  const outFields = Object.entries(t.output_fields ?? {});
  if (outFields.length === 0) {
    violations.push(`${t.name}: output schema has no documented fields (REQ-548b)`);
  }
  for (const [k, d] of outFields) {
    if (!d || d.trim() === "") violations.push(`${t.name}: output field '${k}' undocumented (REQ-548b)`);
  }
  // REQ-450 — an action-bearing tool must disclose persistence and
  // reversibility (or irreversibility/derived status).
  if (t.action_enum.length > 0) {
    const d = desc.toLowerCase();
    if (!PERSISTENCE_TOKENS.some((w) => d.includes(w)) || !REVERSIBILITY_TOKENS.some((w) => d.includes(w))) {
      violations.push(`${t.name}: mutating-tool disclosure missing persistence and/or reversibility vocabulary (REQ-450)`);
    }
  }
  // REQ-553 — TDQS hard gates.
  const def: ToolDefinition = { name: t.name, title: t.title, description: desc, annotations: t.annotations };
  for (const g of applyHardGates(def)) {
    violations.push(`${t.name}: hard gate ${g.gate} — ${g.detail} (REQ-553)`);
  }
  // REQ-552 — deterministic TDQS proxy must clear the passing tier.
  if (t.context_signals) {
    const scores = dimensionProxies(def, t.context_signals, [...names], budget);
    const proxy = computeTdqs(scores);
    if (computeTier(proxy) > PASSING_TIER) {
      violations.push(`${t.name}: deterministic TDQS proxy ${proxy} below the passing tier ${PASSING_TIER} (REQ-552)`);
    }
  }
}

// REQ-554 — server tool-surface coherence over the live catalog.
const defs: ToolDefinition[] = artifact.tools.map((t) => ({ name: t.name, title: t.title, description: t.description, annotations: t.annotations }));
const coherence = coherenceProxies(defs);
if (coherence.namingConsistency < 5) {
  violations.push(`surface naming consistency ${coherence.namingConsistency}/5 — a tool name deviates from verb_noun (REQ-554)`);
}
for (const [a, b] of coherence.overlappingPairs) {
  violations.push(`overlapping pair ${a} / ${b} not disambiguated in both descriptions (REQ-554)`);
}
// REQ-555 — shadowing candidates are reported beside the score, never gated.
const shadowRisks = shadowCandidatesWithCosts(
  artifact.tools
    .filter((t) => t.context_signals)
    .map((t) => ({ name: t.name, description: t.description, cost: Number(t.context_signals!.invocationCost ?? 0) })),
);

if (process.argv.slice(2).includes("--json")) {
  process.stdout.write(JSON.stringify({ tool_count: artifact.tool_count, budget, violations, shadowing_risks: shadowRisks }, null, 2) + "\n");
  process.exit(violations.length === 0 ? 0 : 1);
}

if (shadowRisks.length > 0) {
  for (const r of shadowRisks) console.error(`WARNING: shadowing risk — ${r.tool} (cost ${r.invocationCost}) may be shadowed by ${r.cheaperSibling} (cost ${r.cheaperSiblingInvocationCost}) (REQ-555)`);
}

if (violations.length > 0) {
  for (const v of violations) console.error(`FAIL: ${v}`);
  console.error(`\n${violations.length} tool-definition violation(s) across ${artifact.tool_count} tools`);
  process.exit(1);
}

console.log(`PASS: tool definitions conformant — ${artifact.tool_count} tools, budget ${budget}B, ${violations.length} violations`);
process.exit(0);
