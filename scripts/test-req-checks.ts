#!/usr/bin/env node
// Validator self-test: guards the REQ-integrity checks against regression.
// Exercises checkEmptyReqBodies / checkTruncatedReqBodies against synthetic
// fixtures, including the `---`-terminated empty-body case (the F1 finding).

import { checkEmptyReqBodies, checkTruncatedReqBodies, checkReqIdGrammar } from "./lib/req-checks.js";

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

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
process.exit(0);
