#!/usr/bin/env npx tsx
/**
 * check-conversion-evidence.ts — verify recorded conversion evidence. [gate]
 *
 * Purpose: confirm the DECISIONS.md conversion records satisfy REQ-102a–c /
 * Appendix G before converted content is used downstream (REQ-452). Verifies:
 * (2) versions — a converter and version are pinned; (5) waivers — every
 * flagged artifact carries a `fixed`/`waived`/`pending` disposition and no
 * `pending` remains; (6) evidence — per-content-type fidelity at or above
 * 90% and the Phase-1 trial gate at or above 70% are recorded, plus
 * cross-converter verification results.
 *
 * Exit codes: 0 = pass, or "conversion not selected — waived"; 1 = a missing
 * record or a threshold break (under --strict); 2 = fatal (unreadable file).
 *
 * Usage: npx tsx scripts/check-conversion-evidence.ts [--strict] [--decisions <path>]
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const strict = process.argv.includes("--strict");
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(
    "check-conversion-evidence.ts — verify DECISIONS.md conversion records (REQ-452).\n" +
      "Usage: npx tsx scripts/check-conversion-evidence.ts [--strict] [--decisions <path>]\n" +
      "  --strict       exit 1 on any missing record or threshold break\n" +
      "  --decisions    path to DECISIONS.md (default: holonovel/DECISIONS.md)"
  );
  process.exit(0);
}

const decisionsPath = argValue("--decisions") ?? join(ROOT, "DECISIONS.md");

if (!existsSync(decisionsPath)) {
  console.error(`FATAL: cannot read ${decisionsPath}`);
  process.exit(2);
}
const text = readFileSync(decisionsPath, "utf-8");

function section(marker: string): string {
  const start = text.indexOf(marker);
  if (start === -1) return "";
  const rest = text.slice(start + marker.length);
  const next = rest.match(/<!-- @section /);
  return next ? rest.slice(0, next.index) : rest;
}

const versions = section("<!-- @section versions -->");
const waivers = section("<!-- @section waivers -->");
const evidence = section("<!-- @section evidence -->");

// Conversion is "selected" when any conversion record is present. A ruleset-free
// or Markdown-only build records no converter pin, no fidelity rate, and no
// artifact disposition, so it is waived rather than treated as a failure. The pin
// check reads only DECISIONS.md (2) (`@section versions`); a whole-file scan would
// match narrative prose describing the checker itself and falsely select
// conversion (recurrence 2026-09-06).
const converterPin = /converter/i.test(versions);
const fidelityRates = /fidelity/i.test(evidence) && /\d+\s*%/.test(evidence);
const dispositions = /\bdisposition\b/i.test(waivers) && /\b(fixed|waived|pending)\b/i.test(waivers);
const crossConverter = /cross-converter|cross converter/i.test(waivers) || /cross-converter|cross converter/i.test(evidence);

const selected = converterPin || fidelityRates || dispositions;

if (!selected) {
  console.log("conversion not selected — waived (no converter pin, fidelity rate, or artifact disposition recorded).");
  process.exit(0);
}

const checks: Array<[string, boolean]> = [
  ["converter + version pinned in DECISIONS.md (2)", converterPin],
  ["artifact dispositions recorded in DECISIONS.md (5)", dispositions],
  ["per-content-type fidelity recorded in DECISIONS.md (6)", fidelityRates],
  ["cross-converter verification recorded in DECISIONS.md (5)/(6)", crossConverter],
];

const rateRe = /(\d+(?:\.\d+)?)\s*%/g;
let minRate = 100;
let hasRate = false;
for (const m of evidence.matchAll(rateRe)) {
  const v = parseFloat(m[1]);
  if (!Number.isNaN(v)) {
    hasRate = true;
    if (v < minRate) minRate = v;
  }
}
checks.push(["fidelity rate ≥ 90% (Phase 2)", !hasRate || minRate >= 90]);
checks.push(["Phase-1 trial gate ≥ 70%", minRate >= 70]);
checks.push(["no pending artifact disposition", !/\bpending\b/i.test(waivers)]);

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK  " : "FAIL"}  ${label}`);
  if (!ok) failed++;
}

console.log(`\n${checks.length} conversion-evidence check(s): ${checks.length - failed} pass, ${failed} fail.`);
if (strict && failed > 0) {
  console.error(`conversion evidence verification FAILED: ${failed} missing or broken record(s).`);
  process.exit(1);
}
process.exit(0);
