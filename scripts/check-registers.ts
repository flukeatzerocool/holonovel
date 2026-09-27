#!/usr/bin/env npx tsx
/**
 * check-registers.ts — validate the review and proofread registers. [gate]
 *
 * Structural checks on the review-loop tracking surfaces (AGENTS.md
 * "Review-loop governance"): every finding carries a terminal disposition,
 * Scheduled-roadmap findings trace to ROADMAP.md, and every proofread finding
 * carries one of the four allowed dispositions. Heuristic and report-only by
 * default; `--strict` exits non-zero on findings. Exit codes: 0 = clean /
 * report-only, 1 = findings under --strict or a missing input.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { handleHelp, parseFlag } from "./lib/args.js";
import { parseFindings, checkReviewFindings, checkProofreadDispositions } from "./lib/register-checks.js";

const root = join(import.meta.dirname, "..");
const REVIEW = join(root, "spec", "audit", "review-register.md");
const PROOFREAD = join(root, "spec", "audit", "proofread-register.md");
const ROADMAP = join(root, "ROADMAP.md");

const USAGE = `Usage: npx tsx scripts/check-registers.ts [--strict]

  --strict     Exit 1 when any register finding is reported (default: report
               findings and exit 0).
  --help, -h   Show this message.

Exit codes: 0 = clean / report-only, 1 = findings under --strict or a missing
register file.
`;

function main(): void {
  handleHelp(process.argv, USAGE);
  const strict = parseFlag(process.argv, "--strict");
  const all: string[] = [];
  if (!existsSync(REVIEW)) all.push("spec/audit/review-register.md is missing");
  else {
    const roadmap = existsSync(ROADMAP) ? readFileSync(ROADMAP, "utf-8") : "";
    all.push(...checkReviewFindings(parseFindings(readFileSync(REVIEW, "utf-8")), roadmap));
  }
  if (!existsSync(PROOFREAD)) all.push("spec/audit/proofread-register.md is missing");
  else all.push(...checkProofreadDispositions(readFileSync(PROOFREAD, "utf-8")));

  const info = all.filter((i) => i.startsWith("INFO:"));
  const issues = all.filter((i) => !i.startsWith("INFO:"));
  for (const i of info) console.log(`  INFO: ${i.slice("INFO: ".length)}`);
  if (issues.length === 0) {
    console.log("PASS: review and proofread registers are structurally clean");
    process.exit(0);
  }
  for (const issue of issues) console.log(`  ${strict ? "FAIL" : "WARN"}: ${issue}`);
  console.log(`\n${issues.length} register finding(s) (report-only${strict ? ", --strict" : ""}).`);
  process.exit(strict ? 1 : 0);
}

main();
