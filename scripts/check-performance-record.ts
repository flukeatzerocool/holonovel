#!/usr/bin/env npx tsx
/**
 * check-performance-record.ts — composed end-to-end performance record gate
 * (REQ-586 / T686). [gate]
 *
 * Validates one record that composes conversion fidelity, extraction
 * completeness, tool-selection coverage, mean calls per intent, catalog and
 * prompt token footprint, cold-start time, and query latency. Every term must
 * carry a value or a recorded waiver with a reason; the record must declare its
 * scope, the ruleset content hash, the specification hash, and the measurement
 * environment.
 *
 * Usage: npx tsx scripts/check-performance-record.ts [file] [--json]
 * Exit codes: 0 = conformant, 1 = defects, 2 = fatal (missing/unreadable).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const DEFAULT = join(ROOT, "spec", "audit", "performance-record.json");
const TERMS = [
  "conversion_fidelity",
  "extraction_completeness",
  "tool_selection_coverage",
  "mean_calls_per_intent",
  "catalog_tokens",
  "tools_list_bytes",
  "prompt_tokens",
  "cold_start_ms",
  "query_latency_ms",
] as const;
const HEX64 = /^[0-9a-f]{64}$/i;

const ARGV = process.argv.slice(2);
if (ARGV.includes("--help") || ARGV.includes("-h")) {
  console.log("Usage: check-performance-record [file] [--json]\n");
  console.log("Validates a REQ-586 performance record. Default file:");
  console.log(`  ${DEFAULT}`);
  process.exit(0);
}
const json = ARGV.includes("--json");
const file = ARGV.find((a) => !a.startsWith("-")) ?? DEFAULT;
for (const arg of ARGV) {
  if (arg === "--json" || arg === "--help" || arg === "-h" || !arg.startsWith("-")) continue;
  console.error(`[performance-record] unknown flag: ${arg}`);
  process.exit(1);
}
if (!existsSync(file)) {
  console.error(`FATAL: performance record not found: ${file}`);
  process.exit(2);
}

let record: Record<string, any>;
try {
  record = JSON.parse(readFileSync(file, "utf-8"));
} catch (e) {
  console.error(`FATAL: unreadable performance record: ${(e as Error).message}`);
  process.exit(2);
}

const defects: string[] = [];
const scope = record.scope;
if (scope !== "ruleset-build" && scope !== "reference-host") {
  defects.push(`scope must be 'ruleset-build' or 'reference-host' (got ${JSON.stringify(scope)})`);
}
for (const field of ["spec_hash", "ruleset_content_hash"] as const) {
  if (typeof record[field] !== "string" || !HEX64.test(record[field])) {
    defects.push(`${field} must be a 64-character hex digest`);
  }
}
if (typeof record.environment !== "string" || record.environment.trim() === "") {
  defects.push("environment must name the measurement environment");
}
if (typeof record.measured_at !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(record.measured_at)) {
  defects.push("measured_at must be an ISO date (YYYY-MM-DD)");
}

const terms = record.terms;
if (!terms || typeof terms !== "object" || Array.isArray(terms)) {
  defects.push("terms must be an object");
} else {
  for (const key of TERMS) {
    const value = terms[key];
    if (value === undefined) {
      defects.push(`missing term '${key}'`);
      continue;
    }
    if (value !== null && typeof value === "object") {
      const waiver = value.waived;
      if (typeof waiver !== "string" || waiver.trim() === "") {
        defects.push(`term '${key}' carries a waiver without a reason`);
      }
      continue;
    }
    if (typeof value !== "number" && typeof value !== "string") {
      defects.push(`term '${key}' must be a number, string, or { waived: reason }`);
    }
  }
  for (const key of Object.keys(terms)) {
    if (!(TERMS as readonly string[]).includes(key)) defects.push(`unknown term '${key}'`);
  }
}

if (json) {
  console.log(JSON.stringify({ file, ok: defects.length === 0, defects }, null, 2));
} else if (defects.length > 0) {
  for (const defect of defects) console.error(`FAIL: ${defect}`);
  console.error(`\n${defects.length} performance-record defect(s) (REQ-586)`);
} else {
  console.log(`PASS: performance record conforms (REQ-586, scope ${scope})`);
}
process.exit(defects.length === 0 ? 0 : 1);
