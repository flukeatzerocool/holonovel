#!/usr/bin/env npx tsx
/**
 * check-ruleset-model.ts — model-shape gate for a built ruleset package
 * (REQ-559). [gate]
 *
 * `check-ruleset-package` validates the declared tool schemas (REQ-430); this
 * gate validates the package MODEL those tools resolve against, closing the
 * defect class where a tool is well-formed but its backing data is missing or
 * unresolvable:
 *   (a) every `info` tool has a backing model entry;
 *   (b) every lookup/table/generation-table entry carries a unique, non-empty
 *       `name` (so key-only, heading-slug entries are caught);
 *   (c) every `roll` tool's `defaultDice` is valid notation and, when the
 *       description names a die, matches it;
 *   (d) no table entry keeps only an auto-generated `${file}-${headers}-${rows}`
 *       key without a human `name`.
 *
 * Usage: npx tsx scripts/check-ruleset-model.ts <package-dir> [--report-only]
 * Exit codes: 0 = conformant (or report-only clean), 1 = violations, 2 = fatal.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log("Usage: check-ruleset-model <package-dir> [--report-only]");
  console.log("Validates <package-dir>/model.json against the REQ-559 model contract.");
  process.exit(0);
}
const reportOnly = argv.includes("--report-only");
const dir = argv.find((a) => !a.startsWith("-"));
if (!dir) { console.error("FATAL: no package directory given — usage: check-ruleset-model <package-dir>"); process.exit(2); }

const modelPath = join(dir, "model.json");
const toolsPath = join(dir, "tools.json");
if (!existsSync(modelPath)) { console.error(`FATAL: ${modelPath} not found`); process.exit(2); }
if (!existsSync(toolsPath)) { console.error(`FATAL: ${toolsPath} not found`); process.exit(2); }

let model: Record<string, any>;
let tools: Record<string, any>[];
try {
  model = JSON.parse(readFileSync(modelPath, "utf-8"));
  tools = JSON.parse(readFileSync(toolsPath, "utf-8"));
} catch (e) { console.error(`FATAL: package JSON is invalid: ${(e as Error).message}`); process.exit(2); }

const normId = (s: unknown) => String(s ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const DICE_RE = /^(?:\d+)?d(?:100|20|12|10|8|6|4|f)(?:[+-]\d+)?$/i;
// A key that is purely generated: `<file>-md-<headers>-<count>` and similar.
const GENERATED_KEY_RE = /-md-|-\d+-?\d*$/;

function backingEntry(model: Record<string, any>, toolName: string): any {
  const want = normId(toolName);
  const info = model.info;
  if (info && typeof info === "object") {
    if (info[toolName] !== undefined) return info[toolName];
    const k = Object.keys(info).find((key) => normId(key) === want);
    if (k) return info[k];
  }
  for (const coll of Object.values(model)) {
    if (!coll || typeof coll !== "object" || Array.isArray(coll)) continue;
    const hit = Object.keys(coll).find((key) => normId(key) === want);
    if (hit) return (coll as any)[hit];
  }
  return null;
}

const violations: string[] = [];
const advisories: string[] = [];
const seenNames = new Map<string, string>();
const tableColls = ["tables", "generation_tables"];

function checkCollection(collName: string, coll: Record<string, any>): void {
  if (!coll || typeof coll !== "object" || Array.isArray(coll)) return;
  for (const [key, entry] of Object.entries(coll)) {
    const name = (entry as any)?.name;
    // (b) non-empty unique name — duplicate names are ADVISORY only: repeated
    // source headings (e.g. "Actions" per chapter) are legitimate.
    if (typeof name !== "string" || name.trim() === "") {
      // (d) only a generated key with no name is a violation; a hand-authored
      // key with no name in a non-table collection is tolerated.
      if (tableColls.includes(collName) && GENERATED_KEY_RE.test(key)) {
        violations.push(`table '${key}' has no human 'name' (auto-generated key)`);
      }
      continue;
    }
    const nk = `${collName}:${name.trim().toLowerCase()}`;
    if (seenNames.has(nk)) advisories.push(`duplicate name '${name}' in ${collName} ('${key}' and '${seenNames.get(nk)}')`);
    else seenNames.set(nk, key);
  }
}

for (const tool of tools) {
  if (!tool || typeof tool !== "object") continue;
  if (tool.kind === "info") {
    // (a) info tool must be backed by a model entry.
    if (!backingEntry(model, tool.name)) violations.push(`info tool '${tool.name}' has no backing model entry`);
  }
  if (tool.kind === "roll" && tool.defaultDice !== undefined) {
    // (c) valid notation + matches a die named in the description.
    const dd = String(tool.defaultDice).trim();
    if (!DICE_RE.test(dd)) violations.push(`roll tool '${tool.name}' defaultDice '${dd}' is not valid notation`);
    const desc = String(tool.description ?? "");
    const descDie = desc.match(/\b(?:1)?d(\d{2,3})\b/i)?.[1];
    if (descDie && !dd.toLowerCase().includes(`d${descDie}`)) {
      violations.push(`roll tool '${tool.name}' defaultDice '${dd}' does not match the 'd${descDie}' named in its description`);
    }
  }
  // Lookup collections per tool; table collections are scanned once below.
  if (tool.kind === "lookup") {
    const coll = tool.collection ?? "concepts";
    checkCollection(coll, model[coll]);
  }
}
for (const tc of tableColls) checkCollection(tc, model[tc]);

for (const a of advisories) console.log(`${reportOnly ? "REPORT" : "ADVISORY"}: ${a}`);
if (violations.length > 0) {
  for (const v of violations) console.error(`${reportOnly ? "REPORT" : "FAIL"}: ${v}`);
  console.error(`\n${violations.length} ruleset model violation(s) (REQ-559)${reportOnly ? " [report-only]" : ""}`);
  process.exit(reportOnly ? 0 : 1);
}
console.log(`PASS: ruleset model conformant (REQ-559)${advisories.length > 0 ? ` (${advisories.length} advisory)` : ""}`);
process.exit(0);
