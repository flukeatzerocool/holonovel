#!/usr/bin/env npx tsx
/**
 * test-anchor-tooling.ts — self-tests for the evidence-anchor resolver and the
 * `refresh-predicates` contract. [gate]
 *
 * Purpose: `refresh-predicates --check` is now a gate, so the resolver's
 * conservatism is load-bearing: it must repair a moved anchor, refuse a symbol
 * that appears on several distant lines, and refuse an out-of-window guess with
 * no unique candidate. The CLI cases run against a scratch tree shaped like the
 * repository, so the real anchor files are never touched.
 *
 * Usage: npx tsx scripts/test-anchor-tooling.ts [--help]
 * Exit codes: 0 = every case passed, 1 = a case failed, 2 = fatal.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handleHelp, rejectUnknown } from "./lib/args.js";
import { resolveAnchorLine, ANCHOR_WINDOW } from "./lib/anchor-resolver.js";

const USAGE = `Usage: npx tsx scripts/test-anchor-tooling.ts

  --help  Show this message.
`;

handleHelp(process.argv, USAGE);
rejectUnknown(process.argv, new Set(["--help", "-h"]), USAGE);

let passed = 0;
let failed = 0;
function check(ok: boolean, label: string, detail = ""): void {
  if (ok) { passed++; console.log(`  PASS ${label}`); }
  else { failed++; console.error(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`); }
}

const lines = [
  "export function alpha() {", // 1
  "  return 1;",
  "}",
  "export function beta() {", // 4
  "  return 2;",
  "}",
  ...Array.from({ length: 60 }, (_, i) => `const filler${i} = ${i};`), // 7..66
  "export function gamma() {", // 67
  "  return 3;",
  "}",
  "export function delta() {", // 70
  "  return 4;",
  "}",
];

const unique = resolveAnchorLine(lines, 60, "gamma");
check(unique.line === 67 && unique.ambiguous.length === 0, "a single candidate is found however far it moved");

const near = resolveAnchorLine(["a();", "b();", "target();", "c();", "target();"], 2, "target");
check(near.line === 3 && near.ambiguous.length === 0, "the nearest candidate inside the window wins");

const far = resolveAnchorLine(
  ["dup();", ...Array.from({ length: 98 }, (_, i) => `x${i} = ${i};`), "dup();", "z();"],
  50,
  "dup",
);
check(far.line === null && far.ambiguous.length === 2, "two candidates outside the window are ambiguous");

const missing = resolveAnchorLine(["one();", "two();"], 1, "nope");
check(missing.line === null && missing.ambiguous.length === 0, "an absent symbol resolves to nothing");
check(ANCHOR_WINDOW === 40, "the window is the documented ±40 lines");

// ── CLI contract against a scratch tree ──
const root = mkdtempSync(join(tmpdir(), "holonovel-anchor-"));
try {
  mkdirSync(join(root, "scripts", "lib"), { recursive: true });
  mkdirSync(join(root, "holonovel", "scripts", "lib"), { recursive: true });
  mkdirSync(join(root, "holonovel", "src"), { recursive: true });
  cpSync(join(import.meta.dirname, "refresh-predicates.ts"), join(root, "scripts", "refresh-predicates.ts"));
  cpSync(join(import.meta.dirname, "lib", "args.ts"), join(root, "scripts", "lib", "args.ts"));
  cpSync(join(import.meta.dirname, "lib", "anchor-resolver.ts"), join(root, "scripts", "lib", "anchor-resolver.ts"));
  copySource(root, ["const a = 1;", "const b = 2;", "function needful() { return 3; }", "const c = 4;"]);
  writeAnchor(root, ["lib/holosuite-probe.ts"], 1);

  const run = (args: string[]): { code: number; out: string } => {
    try {
      const out = execFileSync("npx", ["tsx", join(root, "scripts", "refresh-predicates.ts"), ...args], { encoding: "utf-8", cwd: root, stdio: "pipe" });
      return { code: 0, out };
    } catch (error) {
      const e = error as { status?: number; stdout?: string; stderr?: string };
      return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
    }
  };

  const before = run(["--check"]);
  check(before.code === 1 && /stale anchor/.test(before.out) && /fix-anchors/.test(before.out), "check fails on drift and names the repair", before.out);
  const repaired = run(["--write"]);
  check(repaired.code === 0 && /-> 3/.test(repaired.out), "write repairs the moved anchor", repaired.out);
  const after = run(["--check"]);
  check(after.code === 0 && /predicates current/.test(after.out), "check passes after the repair", after.out);
} finally {
  rmSync(root, { recursive: true, force: true });
}

function copySource(root: string, fileLines: string[]): void {
  writeFileSync(join(root, "holonovel", "src", "index.ts"), fileLines.join("\n") + "\n");
}
function writeAnchor(root: string, files: string[], recorded: number): void {
  for (const file of files) {
    writeFileSync(
      join(root, "holonovel", "scripts", file),
      `import { anchor } from "./lib/eval-predicate.js";\nexport const P = anchor("holonovel/src/index.ts", ${recorded}, "needful");\n`,
    );
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
