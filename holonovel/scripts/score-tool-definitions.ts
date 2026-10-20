#!/usr/bin/env npx tsx
/**
 * score-tool-definitions.ts — structural TDQS proxy for host tool definitions.
 * [informational]
 *
 * Prints the per-tool, per-dimension deterministic proxy from the shared
 * `core/tdqs.ts` module over the committed `tool-definitions.json` snapshot.
 * The authoritative score is LLM-graded (Glama) and external (tdqs.dev); this
 * report is advisory and never fails the build.
 *
 * Exit codes: 0 = report emitted (always), 2 = fatal (missing/unreadable
 * artifact).
 *
 * REQ-024c, REQ-450, REQ-552 — see Appendix T.2 Tool Definition Authoring
 * Standard. Enforcement lives in T536/T642 (`test-security.ts`,
 * `test-tool-definitions.ts`) and T679/T680.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { scoreTool, type ToolDefinition } from "../src/core/tdqs.js";

const ROOT = join(import.meta.dirname, "..");

interface ArtifactTool {
  name: string;
  title: string;
  description: string;
  params: Record<string, string>;
  required: string[];
  output_fields: Record<string, string>;
  annotations: Record<string, boolean> | null;
}
interface Artifact {
  tools: ArtifactTool[];
}

function fail(message: string): never {
  console.error(`[score-tool-definitions] ${message}`);
  process.exit(2);
}

let artifact: Artifact;
try {
  artifact = JSON.parse(readFileSync(join(ROOT, "tool-definitions.json"), "utf8")) as Artifact;
} catch {
  fail("missing or unreadable tool-definitions.json — run `npm run build-order`");
}

const definitions: ToolDefinition[] = artifact.tools.map((tool) => ({
  name: tool.name,
  title: tool.title,
  description: tool.description,
  inputSchema: {
    type: "object",
    properties: Object.fromEntries(
      Object.entries(tool.params).map(([key, description]) => [key, { type: "string", description }]),
    ),
    required: tool.required,
  },
  outputSchema: {
    type: "object",
    properties: Object.fromEntries(
      Object.entries(tool.output_fields).map(([key, description]) => [key, { type: "string", description }]),
    ),
  },
  annotations: tool.annotations,
}));

const siblings = definitions.map((definition) => definition.name);
const rows = definitions.map((definition) => scoreTool(definition, siblings));
const mean = rows.reduce((sum, row) => sum + row.tdqs, 0) / rows.length;
const min = Math.min(...rows.map((row) => row.tdqs));

console.log(`Deterministic TDQS proxy — ${rows.length} host tools`);
console.log(`mean ${mean.toFixed(2)} | min ${min.toFixed(2)}`);
console.log("");
console.log("| tool | purpose | usage | behavior | params | concise | complete | tdqs |");
console.log("|---|---|---|---|---|---|---|---|");
for (const row of [...rows].sort((a, b) => a.tdqs - b.tdqs)) {
  const scores = row.scores;
  console.log(
    `| ${row.name} | ${scores.purpose_clarity} | ${scores.usage_guidelines} | ${scores.behavioral_transparency} | ` +
      `${scores.parameter_semantics} | ${scores.conciseness_structure} | ${scores.contextual_completeness} | ${row.tdqs.toFixed(1)} |`,
  );
}
console.log("");
console.log("Advisory only — the authoritative score is LLM-graded (Glama) / external (tdqs.dev).");
