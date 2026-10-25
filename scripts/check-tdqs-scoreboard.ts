#!/usr/bin/env npx tsx
/**
 * check-tdqs-scoreboard.ts — validate the committed external TDQS captures
 * (REQ-552). [gate]
 *
 * The authoritative TDQS is LLM-graded and external (tdqs.dev via Glama). This
 * gate does not fetch it and never treats the deterministic proxy as the
 * score; it validates the recorded captures' shape, ranges, per-tool
 * arithmetic, coherence rollup, description-quality rollup, overall formula,
 * and tier mapping.
 *
 * Usage: npx tsx scripts/check-tdqs-scoreboard.ts [file] [--json]
 * Exit codes: 0 = conformant, 1 = defects, 2 = fatal (missing/unreadable).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const DEFAULT = join(ROOT, "spec", "audit", "tdqs-scoreboard.json");
const WEIGHTS = {
  purpose_clarity: 25,
  usage_guidelines: 20,
  behavioral_transparency: 20,
  parameter_semantics: 15,
  conciseness_structure: 10,
  contextual_completeness: 10,
} as const;
const DIMENSIONS = Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[];
const COHERENCE_DIMENSIONS = [
  "disambiguation",
  "naming_consistency",
  "tool_count_appropriateness",
  "completeness",
] as const;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const ARGV = process.argv.slice(2);
if (ARGV.includes("--help") || ARGV.includes("-h")) {
  console.log("Usage: check-tdqs-scoreboard [file] [--json]\n");
  console.log("Validates one or more external TDQS captures (REQ-552). Default file:");
  console.log(`  ${DEFAULT}`);
  process.exit(0);
}
const json = ARGV.includes("--json");
const file = ARGV.find((a) => !a.startsWith("-")) ?? DEFAULT;
for (const arg of ARGV) {
  if (arg === "--json" || arg === "--help" || arg === "-h" || !arg.startsWith("-")) continue;
  console.error(`[tdqs-scoreboard] unknown flag: ${arg}`);
  process.exit(1);
}
if (!existsSync(file)) {
  console.error(`FATAL: TDQS scoreboard not found: ${file}`);
  process.exit(2);
}

let record: Record<string, any>;
try {
  record = JSON.parse(readFileSync(file, "utf-8"));
} catch (e) {
  console.error(`FATAL: unreadable TDQS scoreboard: ${(e as Error).message}`);
  process.exit(2);
}

const round1 = (p: number, q: number): number => Math.floor((20 * p + q) / (2 * q)) / 10;
const tenths = (value: number): number => Math.round(value * 10);
const tierFor = (score: number): string =>
  score >= 3.5 ? "A" : score >= 3.0 ? "B" : score >= 2.0 ? "C" : score >= 1.0 ? "D" : "F";
const isScore = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 5;
const isDimension = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;

const defects: string[] = [];
if (record.schema_version !== 1) defects.push("schema_version must be 1");
if (!Array.isArray(record.captures) || record.captures.length === 0) {
  defects.push("captures must be a non-empty array");
}

const captures: any[] = Array.isArray(record.captures) ? record.captures : [];
captures.forEach((capture, index) => {
  const prefix = `captures[${index}]`;
  if (typeof capture.captured_at !== "string" || !ISO_DATETIME.test(capture.captured_at)) {
    defects.push(`${prefix}.captured_at must be an ISO date-time`);
  }
  if (typeof capture.source !== "string" || !/^https?:\/\//.test(capture.source)) {
    defects.push(`${prefix}.source must be an http(s) URL`);
  }
  if (typeof capture.server !== "string" || capture.server.trim() === "") {
    defects.push(`${prefix}.server must be a non-empty string`);
  }
  if (!Number.isInteger(capture.tool_count) || capture.tool_count <= 0) {
    defects.push(`${prefix}.tool_count must be a positive integer`);
  }
  for (const dimension of COHERENCE_DIMENSIONS) {
    if (!isDimension(capture.dimensions?.[dimension])) {
      defects.push(`${prefix}.dimensions.${dimension} must be an integer 1-5`);
    }
    const justification = capture.justifications?.[dimension];
    if (typeof justification !== "string" || justification.trim() === "") {
      defects.push(`${prefix}.justifications.${dimension} must be a non-empty string`);
    }
  }

  const tools: any[] = Array.isArray(capture.tools) ? capture.tools : [];
  if (tools.length !== capture.tool_count) {
    defects.push(`${prefix}.tools must contain tool_count records (got ${tools.length}, expected ${capture.tool_count})`);
  }
  const names = new Set<string>();
  const toolTenths: number[] = [];
  for (const tool of tools) {
    if (typeof tool.name !== "string" || tool.name.trim() === "") {
      defects.push(`${prefix}.tools entry missing name`);
      continue;
    }
    if (names.has(tool.name)) defects.push(`${prefix}.tools duplicate name '${tool.name}'`);
    names.add(tool.name);
    const dimensions = tool.dimensions ?? {};
    let unified = true;
    let hundredths = 0;
    for (const dimension of DIMENSIONS) {
      if (!isDimension(dimensions[dimension])) {
        defects.push(`${prefix}.tools.${tool.name}.dimensions.${dimension} must be an integer 1-5`);
        unified = false;
        continue;
      }
      hundredths += dimensions[dimension] * WEIGHTS[dimension];
    }
    const computed = unified ? round1(hundredths, 100) : null;
    if (!isScore(tool.tdqs)) {
      defects.push(`${prefix}.tools.${tool.name}.tdqs must be a score 1.0-5.0`);
      continue;
    }
    if (computed !== null && tenths(computed) !== tenths(tool.tdqs)) {
      defects.push(`${prefix}.tools.${tool.name}.tdqs ${tool.tdqs} disagrees with weighted dimensions (${computed})`);
    }
    if (tool.tier !== tierFor(tool.tdqs)) {
      defects.push(`${prefix}.tools.${tool.name}.tier ${tool.tier} disagrees with tdqs ${tool.tdqs}`);
    }
    toolTenths.push(tenths(tool.tdqs));
  }

  if (toolTenths.length > 0) {
    const n = toolTenths.length;
    const sum = toolTenths.reduce((a, b) => a + b, 0);
    const min = Math.min(...toolTenths);
    const descriptionQuality = round1(6 * sum + 4 * n * min, 100 * n);
    if (!isScore(capture.description_quality) || tenths(capture.description_quality) !== tenths(descriptionQuality)) {
      defects.push(`${prefix}.description_quality ${capture.description_quality} disagrees with per-tool rollup (${descriptionQuality})`);
    }
  }

  if (COHERENCE_DIMENSIONS.every((d) => isDimension(capture.dimensions?.[d]))) {
    const sum = COHERENCE_DIMENSIONS.reduce((acc, d) => acc + capture.dimensions[d], 0);
    const coherence = round1(sum, 4);
    if (!isScore(capture.coherence) || tenths(capture.coherence) !== tenths(coherence)) {
      defects.push(`${prefix}.coherence ${capture.coherence} disagrees with dimension mean (${coherence})`);
    }
  }

  if (isScore(capture.description_quality) && isScore(capture.coherence) && isScore(capture.overall)) {
    const overall = round1(7 * tenths(capture.description_quality) + 3 * tenths(capture.coherence), 100);
    if (tenths(capture.overall) !== tenths(overall)) {
      defects.push(`${prefix}.overall ${capture.overall} disagrees with the 0.7/0.3 formula (${overall})`);
    }
    if (capture.tier !== tierFor(capture.overall)) {
      defects.push(`${prefix}.tier ${capture.tier} disagrees with overall ${capture.overall}`);
    }
  } else {
    defects.push(`${prefix}.description_quality, coherence, and overall must be scores 1.0-5.0`);
  }
});

if (json) {
  console.log(JSON.stringify({ file, ok: defects.length === 0, defects }, null, 2));
} else if (defects.length > 0) {
  for (const defect of defects) console.error(`FAIL: ${defect}`);
  console.error(`\n${defects.length} TDQS scoreboard defect(s) (REQ-552)`);
} else {
  console.log(`PASS: TDQS scoreboard conforms (REQ-552, ${captures.length} capture(s))`);
}
process.exit(defects.length === 0 ? 0 : 1);
