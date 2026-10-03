#!/usr/bin/env npx tsx
/**
 * test-script-tooling.ts — self-tests for the Script discipline and quality
 * detectors. [gate]
 *
 * Guards `scripts/lib/script-discipline.ts` and `scripts/lib/script-quality.ts`
 * against regression by feeding known-violation and known-clean fixtures to
 * the same pure detectors the gates run. Deterministic; no filesystem or
 * network. Wired into `check` and `check:fast`.
 *
 * Exit codes: 0 = pass, 1 = assertion failure, 2 = fatal.
 */
import { contentIssues, shellIssues } from "./lib/script-discipline.js";
import { isReqHeaderRegex, topLevelHelpers, duplicateHelperPairs } from "./lib/script-quality.js";

let passed = 0;
let failed = 0;

function check(ok: boolean, label: string): void {
  if (ok) { passed++; console.log(`  PASS ${label}`); }
  else { failed++; console.error(`  FAIL ${label}`); }
}

function has(issues: string[], needle: string): boolean {
  return issues.some((i) => i.includes(needle));
}

function main(): void {
  // ── Discipline: contentIssues ───────────────────────────────────────────
  const clean = `#!/usr/bin/env npx tsx
/**
 * demo.ts — a compliant fixture. [gate]
 */
process.exit(0);
`;
  check(contentIssues("demo.ts", clean, false).length === 0, "compliant script reports no issues");

  // Fixture content is assembled from parts so this test's own source does not
  // trip the discipline detectors it is exercising (mirrors the gate's own
  // assembled literals).
  const HOLONOVEL_LIST = "[" + JSON.stringify("holonovel") + "]";
  const FILE_URL = "fileURLToPath" + "(" + "import" + "." + "meta" + "." + "url" + ")";
  const EMPTY_CATCH = "catch {" + "}";
  const dirty = [
    `const servers = ${HOLONOVEL_LIST};`,
    "process." + "exit(3);",
    `try { servers; } ${EMPTY_CATCH}`,
    `const p = ${FILE_URL};`,
  ].join("\n");
  const dirtyIssues = contentIssues("dirty.ts", dirty, false);
  check(has(dirtyIssues, "missing shebang"), "missing shebang detected");
  check(has(dirtyIssues, "missing header comment"), "missing header comment detected");
  check(has(dirtyIssues, "non-standard exit code 3"), "non-standard exit code detected");
  check(has(dirtyIssues, "hardcoded server list"), "hardcoded server list detected");
  check(has(dirtyIssues, "path resolution"), "fileURLToPath path resolution detected");
  check(has(dirtyIssues, "empty catch"), "empty catch block detected");

  const noRole = `#!/usr/bin/env npx tsx
// demo.ts — header with no role token.
process.exit(0);
`;
  check(has(contentIssues("norole.ts", noRole, false), "declares no role"), "missing role token detected");

  // lib files are exempt from shebang and role, but not from other rules.
  const libBody = `// lib.ts — shared helper.
try { x; } ${EMPTY_CATCH}
`;
  const libIssues = contentIssues("scripts/lib/lib.ts", libBody, true);
  check(!has(libIssues, "missing shebang"), "lib file exempt from shebang");
  check(!has(libIssues, "declares no role"), "lib file exempt from role token");
  check(has(libIssues, "empty catch"), "lib file still checked for empty catch");

  // ── Discipline: shellIssues ─────────────────────────────────────────────
  const cleanSh = `#!/usr/bin/env bash
# demo.sh — a compliant fixture.
set -euo pipefail
echo ok
exit 0
`;
  check(shellIssues("demo.sh", cleanSh).length === 0, "compliant shell script reports no issues");

  const dirtySh = `#!/bin/zsh
# demo.sh — bad fixture.
echo "\\033[31mred\\033[0m"
exit 7
`;
  const dirtyShIssues = shellIssues("demo.sh", dirtySh);
  check(has(dirtyShIssues, "disallowed shebang"), "disallowed shell shebang detected");
  check(has(dirtyShIssues, "missing 'set -euo pipefail'"), "missing pipefail detected");
  check(has(dirtyShIssues, "non-standard exit code 7"), "non-standard shell exit code detected");
  check(has(dirtyShIssues, "TTY guard"), "unguarded color detected");

  // ── Quality: C4 REQ-header predicate ────────────────────────────────────
  check(isReqHeaderRegex("/\\*\\*(REQ-\\d{3}[a-z0-9]*\\s+—\\s+.+?)\\.\\*\\*/g"), "REQ-header regex recognized");
  check(!isReqHeaderRegex("/\\bREQ-(\\d{3}[a-z0-9]*)\\b/g"), "bare citation regex not flagged");
  check(!isReqHeaderRegex("/^\\| REQ-\\d/"), "table-row detector not flagged");

  // ── Quality: C2 duplicate-helper ────────────────────────────────────────
  const helperBody = `async function doThing(proc, uri) {
  const resp = await send(proc, { method: "resources/read", params: { uri } });
  if (resp.error) throw new Error(\`RPC error: \${JSON.stringify(resp.error)}\`);
  const content = resp.result?.contents ?? [];
  return content.map((c) => c?.text ?? "").join("\\n");
}`;
  const defs = [
    ...topLevelHelpers(helperBody, "a.ts"),
    ...topLevelHelpers(helperBody, "b.ts"),
    ...topLevelHelpers("function onlyOnce(x) { return x; }", "c.ts"),
  ];
  const pairs = duplicateHelperPairs(defs);
  check(pairs.length === 1 && pairs[0].name === "doThing", "identical cross-file helper flagged as duplicate");
  check(pairs.every((p) => p.a.file !== p.b.file), "same-file helper not flagged");

  console.log(`\nscript-tooling self-tests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

try {
  main();
} catch (e: unknown) {
  console.error(`fatal: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(2);
}
