#!/usr/bin/env node
// Validator self-test: guards the REQ-integrity checks against regression.
// Exercises checkEmptyReqBodies / checkTruncatedReqBodies against synthetic
// fixtures, including the `---`-terminated empty-body case (the F1 finding).

import { checkEmptyReqBodies, checkTruncatedReqBodies, checkReqIdGrammar, checkDecisionsCitations, checkPropertyGroupCount, checkBuildPhaseMapCounts } from "./lib/req-checks.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try { fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}

// An empty REQ body terminated by `---` must be flagged as empty.
const EMPTY_TILDA = [
  "**REQ-900a — Empty body followed by rule (Part a).**",
  "",
  "---",
  "",
  "**REQ-900b — Has a body (Part b).**",
  "The server SHALL do something. _Check:_ T999.",
].join("\n");

// A REQ with a proper body before `---` must NOT be flagged empty.
const FULL_BODY = [
  "**REQ-901a — Proper body (Part a).**",
  "The server SHALL render a widget. _Check:_ T998.",
  "",
  "---",
].join("\n");

console.log("=== REQ-integrity validator self-test ===\n");

test("empty body terminated by --- is flagged empty", () => {
  const issues = checkEmptyReqBodies(EMPTY_TILDA);
  if (!issues.some(i => i.includes("REQ-900a"))) {
    throw new Error(`expected REQ-900a to be flagged empty; got: ${JSON.stringify(issues)}`);
  }
});

test("full body before --- is NOT flagged empty", () => {
  const issues = checkEmptyReqBodies(FULL_BODY);
  if (issues.some(i => i.includes("REQ-901a"))) {
    throw new Error(`REQ-901a wrongly flagged empty: ${JSON.stringify(issues)}`);
  }
});

test("truncated lower-case lead clause detected", () => {
  const text = [
    "**REQ-902a — Truncated (Part a).**",
    "the server SHALL render. _Check:_ T997.",
  ].join("\n");
  const issues = checkTruncatedReqBodies(text);
  if (!issues.some(i => i.includes("REQ-902a"))) {
    throw new Error(`expected REQ-902a truncated lead; got: ${JSON.stringify(issues)}`);
  }
});

test("REQ ID grammar rejects bare-digit suffix", () => {
  const issues = checkReqIdGrammar("Refer to REQ-903 without more. Also REQ-001.");
  if (issues.length !== 0) throw new Error(`unexpected grammar issues: ${JSON.stringify(issues)}`);
});

test("DECISIONS.md (0) citation is flagged", () => {
  const text = "**REQ-904a — Cites undefined section (Part a).**\nThe builder records in DECISIONS.md (0) the audit. _Check:_ T996.";
  const issues = checkDecisionsCitations(text);
  if (!issues.some(i => i.includes("REQ-904a"))) {
    throw new Error(`expected REQ-904a DECISIONS.md (0) flag; got: ${JSON.stringify(issues)}`);
  }
});

test("DECISIONS.md (5) citation passes", () => {
  const text = "**REQ-905a — Cites valid section (Part a).**\nThe builder records in DECISIONS.md (5) the waiver. _Check:_ T995.";
  const issues = checkDecisionsCitations(text);
  if (issues.length !== 0) throw new Error(`unexpected citation issues: ${JSON.stringify(issues)}`);
});

test("stated property-group count mismatching the §7.7 table is flagged", () => {
  const table = "| Property | Archetypes |\n| --- | --- |\n| A | Temporal |\n| B | Spatial |\n";
  const issues = checkPropertyGroupCount(table + "\nAll 30 property groups are classified.");
  if (!issues.some(i => i.includes("30") && i.includes("2"))) {
    throw new Error(`expected a count mismatch; got: ${JSON.stringify(issues)}`);
  }
});

test("stated property-group count matching the table passes", () => {
  const table = "| Property | Archetypes |\n| --- | --- |\n| A | Temporal |\n| B | Spatial |\n";
  const issues = checkPropertyGroupCount(table + "\nAll 2 property groups are classified.");
  if (issues.length !== 0) throw new Error(`unexpected property-group count issues: ${JSON.stringify(issues)}`);
});

test("§7.7 section reference is not a property-group count", () => {
  const table = "| Property | Archetypes |\n| --- | --- |\n| A | Temporal |\n";
  const issues = checkPropertyGroupCount(table + "\nThe §7.7 property groups interact through coupling contracts.");
  if (issues.length !== 0) throw new Error(`false positive on §7.7 reference: ${JSON.stringify(issues)}`);
});

test("build-phase-map subsection-count mismatch is flagged", () => {
  const map = "| 3 | 02-requirements.md | §5: all REQs, 24 subsections |";
  const spec = "### 5.1 One\n### 5.2 Two\n### 5.3 Three\n";
  const issues = checkBuildPhaseMapCounts(map, spec);
  if (!issues.some(i => i.includes("24") && i.includes("3"))) {
    throw new Error(`expected a subsection-count mismatch; got: ${JSON.stringify(issues)}`);
  }
});

test("build-phase-map subsection-count match passes", () => {
  const map = "| 3 | 02-requirements.md | §5: all REQs, 3 subsections |";
  const spec = "### 5.1 One\n### 5.2 Two\n### 5.3 Three\n";
  const issues = checkBuildPhaseMapCounts(map, spec);
  if (issues.length !== 0) throw new Error(`unexpected subsection-count issues: ${JSON.stringify(issues)}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
process.exit(0);
