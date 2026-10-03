#!/usr/bin/env npx tsx
/**
 * check-ruleset-package.ts — TDQS conformance gate for a built ruleset package
 * (REQ-430). [gate]
 *
 * Reads a package directory's tools.json and validates every declared tool
 * schema against the REQ-552 TDQS conformance contract: a title, a three-clause
 * description (REQ-024a), a description on every input parameter (REQ-427), no
 * hard-gate defect (REQ-553), and a description within the recorded budget
 * (REQ-024c). The Build workflow (§6.4.2 step 4) runs this before handoff; a
 * defect blocks the package, so a ruleset cannot add a non-conformant tool to
 * the live surface.
 *
 * Usage: npx tsx scripts/check-ruleset-package.ts <package-dir>
 * Exit codes: 0 = conformant, 1 = violations, 2 = fatal (missing/unreadable).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { validateToolSchema, type RulesetToolSchema } from "../holonovel/src/rulesets.js";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log("Usage: check-ruleset-package <package-dir>");
  console.log("Validates <package-dir>/tools.json against the REQ-430 TDQS contract.");
  process.exit(0);
}

const dir = argv.find((a) => !a.startsWith("-"));
if (!dir) {
  console.error("FATAL: no package directory given — usage: check-ruleset-package <package-dir>");
  process.exit(2);
}
const toolsPath = join(dir, "tools.json");
if (!existsSync(toolsPath)) {
  console.error(`FATAL: ${toolsPath} not found`);
  process.exit(2);
}

let tools: RulesetToolSchema[];
try {
  tools = JSON.parse(readFileSync(toolsPath, "utf-8")) as RulesetToolSchema[];
} catch (e) {
  console.error(`FATAL: tools.json is not valid JSON: ${(e as Error).message}`);
  process.exit(2);
}

const violations: string[] = [];
for (const schema of tools) {
  for (const defect of validateToolSchema(schema)) {
    violations.push(`${schema.name}: ${defect}`);
  }
}

if (violations.length > 0) {
  for (const v of violations) console.error(`FAIL: ${v}`);
  console.error(`\n${violations.length} ruleset tool-definition violation(s) (REQ-430)`);
  process.exit(1);
}
console.log(`PASS: ${tools.length} ruleset tool schema(s) conformant (REQ-430)`);
process.exit(0);
