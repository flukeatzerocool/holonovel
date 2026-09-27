#!/usr/bin/env npx tsx
/**
 * score-tool-definitions.ts — structural TDQS proxy for host tool definitions.
 * [informational]
 *
 * Prints a per-tool, per-dimension proxy of the Glama TDQS rubric computed from
 * static text and the shared output schema — the mechanically checkable subset
 * only. It never fails the build and never calls the network; the authoritative
 * score is LLM-graded (Glama) and external (tdqs.dev).
 *
 * Exit codes: 0 = report emitted (always).
 *
 * REQ-024c, REQ-450, REQ-548b — see Appendix T.2 Tool Definition Authoring
 * Standard. Enforcement lives in T536 (scripts/test-security.ts) and T642
 * (scripts/test-tool-definitions.ts); this script is advisory.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const source = readFileSync(join(ROOT, "src", "index.ts"), "utf-8");
const decisions = readFileSync(join(ROOT, "DECISIONS.md"), "utf-8");

const budget = (() => {
  const m = decisions.match(/\*\*Recorded description budget:\*\*\s*(\d+)/);
  if (!m) throw new Error("DECISIONS.md is missing the 'Recorded description budget' line");
  return parseInt(m[1], 10);
})();

const titles = [...source.matchAll(/^  title: "(.*)",$/gm)].map((m) => m[1]);
const descriptions = [...source.matchAll(/^  description: "(.*)",$/gm)].map((m) => m[1]);
const outputDocumented = /status: z\.string\(\)\.describe\(/.test(source) && /text: z\.string\(\)\.optional\(\)\.describe\(/.test(source);

const clamp = (n: number) => Math.max(1, Math.min(5, n));
const weights: Record<string, number> = {
  purpose: 25, usage: 20, behavior: 20, parameters: 15, conciseness: 10, completeness: 10,
};

interface Row { name: string; scores: Record<string, number>; tdqs: number }

const rows: Row[] = descriptions.map((desc, i) => {
  const title = titles[i] ?? "";
  const bytes = Buffer.byteLength(desc, "utf-8");
  const scores = {
    purpose: clamp(desc.includes("Use when") && desc.includes("Do NOT use") ? 5 : desc.includes("Use when") ? 4 : 2),
    usage: clamp(desc.includes("Do NOT use when") && /—\s*use\s/.test(desc) ? 5 : desc.includes("Do NOT use") ? 4 : 2),
    behavior: clamp((desc.match(/persist|audit|read-only|mutating|reversib/gi) ?? []).length >= 2 ? 5 : 4),
    parameters: 4,
    conciseness: clamp(bytes <= budget ? 5 : 3),
    completeness: outputDocumented ? 5 : 3,
  };
  const hundredths = Object.entries(weights).reduce((sum, [k, w]) => sum + scores[k as keyof typeof scores] * w, 0);
  return { name: title || "(untitled)", scores, tdqs: Math.round(hundredths / 100 * 10) / 10 };
});

const mean = rows.reduce((s, r) => s + r.tdqs, 0) / rows.length;
const min = Math.min(...rows.map((r) => r.tdqs));

console.log(`Structural TDQS proxy — ${rows.length} host descriptions, description budget ${budget}B`);
console.log(`mean ${mean.toFixed(2)} | min ${min.toFixed(2)} | output-schema fields documented: ${outputDocumented}`);
console.log("");
console.log("| tool | purpose | usage | behavior | params | concise | complete | tdqs |");
console.log("|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  const s = r.scores;
  console.log(`| ${r.name} | ${s.purpose} | ${s.usage} | ${s.behavior} | ${s.parameters} | ${s.conciseness} | ${s.completeness} | ${r.tdqs.toFixed(1)} |`);
}
console.log("");
console.log("Advisory only — the authoritative score is LLM-graded (Glama) / external (tdqs.dev).");
