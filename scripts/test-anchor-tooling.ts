#!/usr/bin/env npx tsx
/**
 * test-anchor-tooling.ts — self-tests for the evidence-anchor resolver and the
 * `refresh-predicates` contract. [gate]
 *
 * Purpose: `refresh-predicates --check` is a gate, so the resolver's
 * conservatism is load-bearing: it must repair a moved anchor, refuse a symbol
 * that appears on several distant lines, and refuse an out-of-window guess with
 * no unique candidate. `--repath` adds a second judgement — a symbol that left
 * its file may be accepted in another file of the same source root, but only
 * when exactly one such file carries it and the other root never counts. The CLI
 * cases run against scratch trees shaped like the repository, so the real anchor
 * files are never touched.
 *
 * Usage: npx tsx scripts/test-anchor-tooling.ts [--help]
 * Exit codes: 0 = every case passed, 1 = a case failed, 2 = fatal.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handleHelp, rejectUnknown } from "./lib/args.js";
import { candidateLines, resolveAnchorLine, ANCHOR_WINDOW } from "./lib/anchor-resolver.js";

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
check(candidateLines(["// target", "target();", "  }"], "target").join(",") === "2", "comment and brace-only lines are not candidates");

// ── CLI contract against scratch trees ──
// Case 1 — a symbol that moved inside its own file is repaired by the window.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/index.ts", ["const a = 1;", "const b = 2;", "function needful() { return 3; }", "const c = 4;"]);
    writeAnchor(tree, "holonovel/scripts/holosuite-probe.ts", "holonovel/src/index.ts", 1, "needful");

    const before = run(tree, ["--check"]);
    check(before.code === 1 && /stale anchor/.test(before.out) && /fix-anchors/.test(before.out), "check fails on drift and names the repair", before.out);
    const repaired = run(tree, ["--write"]);
    check(repaired.code === 0 && /-> holonovel\/src\/index\.ts:3 \(written\)/.test(repaired.out), "write repairs the moved anchor", repaired.out);
    const after = run(tree, ["--check"]);
    check(after.code === 0 && /predicates current/.test(after.out), "check passes after the repair", after.out);
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// Cases 2, 3, 5, 7, 8, 9 — a symbol that moved to another file in its root.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/index.ts", ["const a = 1;", "const b = 2;", "const c = 3;"]);
    // The carrier is a description line, not a declaration — the live shape.
    writeSource(tree, "holonovel/src/tools/knowledge.ts", [
      "export const config = {",
      '  description: "Manage the moved surface.",',
      "};",
      "export function movedHelper() { return 1; }",
    ]);
    // A caller in the other root also carries the symbol; it must be ignored.
    writeSource(tree, "holonovel/scripts/lib/caller.ts", ["moved();", "moved();"]);
    writeAnchor(tree, "holonovel/scripts/holosuite-repath.ts", "holonovel/src/index.ts", 2, "moved");

    const noFlag = run(tree, ["--check"]);
    check(noFlag.code === 1 && /has no code line with 'moved'/.test(noFlag.out) && /fix-anchors/.test(noFlag.out), "check without --repath fails on a moved anchor and names the repair", noFlag.out);

    const reportOnly = run(tree, ["--check", "--repath"]);
    check(reportOnly.code === 1 && /holonovel\/src\/tools\/knowledge\.ts:\d+/.test(reportOnly.out), "check --repath reports the move to the source file, ignoring the other root", reportOnly.out);
    check(/description/.test(read(tree, "holonovel/src/tools/knowledge.ts").split("\n")[1] ?? ""), "check --repath writes nothing");

    const absent = run(tree, ["--check", "--repath", "--json"]);
    check(absent.code === 1 && /"written": false/.test(absent.out), "check --repath exits 1 and reports no write", absent.out);

    const repaired = run(tree, ["--write", "--repath"]);
    check(repaired.code === 0 && /-> holonovel\/src\/tools\/knowledge\.ts:\d+ \(written\)/.test(repaired.out), "write --repath rewrites the path and the line", repaired.out);
    const after = run(tree, ["--check", "--repath"]);
    check(after.code === 0 && /predicates current/.test(after.out), "check --repath passes after the repath", after.out);
    check(/anchor\("holonovel\/src\/tools\/knowledge\.ts"/.test(read(tree, "holonovel/scripts/holosuite-repath.ts")), "the anchor file now names the new path", read(tree, "holonovel/scripts/holosuite-repath.ts"));
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// Case 4 — two carriers inside the root are ambiguous and refused.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/index.ts", ["const a = 1;"]);
    writeSource(tree, "holonovel/src/tools/one.ts", ["const twin = 1;"]);
    writeSource(tree, "holonovel/src/tools/two.ts", ["const twin = 2;"]);
    writeAnchor(tree, "holonovel/scripts/holosuite-ambiguous.ts", "holonovel/src/index.ts", 1, "twin");

    const result = run(tree, ["--check", "--repath"]);
    check(result.code === 1 && /ambiguous across files \(2 candidates: holonovel\/src\/tools\/one\.ts, holonovel\/src\/tools\/two\.ts\)/.test(result.out), "two carriers in the root are ambiguous and both are named", result.out);
    const written = run(tree, ["--write", "--repath"]);
    check(written.code === 1 && /holonovel\/src\/index\.ts", 1, "twin"/.test(read(tree, "holonovel/scripts/holosuite-ambiguous.ts")), "an ambiguous move is never written", written.out);
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// Case 5 — no carrier anywhere in the root is unresolved.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/index.ts", ["const a = 1;"]);
    writeSource(tree, "holonovel/src/tools/empty.ts", ["const b = 2;"]);
    writeAnchor(tree, "holonovel/scripts/holosuite-gone.ts", "holonovel/src/index.ts", 1, "vanished");

    const result = run(tree, ["--check", "--repath"]);
    check(result.code === 1 && /has no code line with 'vanished' in holonovel\/src/.test(result.out), "a symbol with no carrier in the root is unresolved", result.out);
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// Case 6 — a recorded path that no longer exists is unresolved, not repathed.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/tools/knowledge.ts", ["const moved = 1;"]);
    writeAnchor(tree, "holonovel/scripts/holosuite-deleted.ts", "holonovel/src/deleted.ts", 1, "moved");

    const result = run(tree, ["--check", "--repath"]);
    check(result.code === 1 && /cannot read holonovel\/src\/deleted\.ts/.test(result.out), "a deleted recorded path is unresolved rather than repathed", result.out);
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

interface Tree { root: string }

function makeTree(): Tree {
  const root = mkdtempSync(join(tmpdir(), "holonovel-anchor-"));
  mkdirSync(join(root, "scripts", "lib"), { recursive: true });
  mkdirSync(join(root, "holonovel", "scripts", "lib"), { recursive: true });
  mkdirSync(join(root, "holonovel", "src"), { recursive: true });
  cpSync(join(import.meta.dirname, "refresh-predicates.ts"), join(root, "scripts", "refresh-predicates.ts"));
  cpSync(join(import.meta.dirname, "lib", "args.ts"), join(root, "scripts", "lib", "args.ts"));
  cpSync(join(import.meta.dirname, "lib", "anchor-resolver.ts"), join(root, "scripts", "lib", "anchor-resolver.ts"));
  return { root };
}

function writeSource(tree: Tree, relPath: string, fileLines: string[]): void {
  mkdirSync(join(tree.root, relPath, ".."), { recursive: true });
  writeFileSync(join(tree.root, relPath), fileLines.join("\n") + "\n");
}

function read(tree: Tree, relPath: string): string {
  return execFileSync("cat", [join(tree.root, relPath)], { encoding: "utf-8" });
}

function writeAnchor(tree: Tree, relPath: string, target: string, recorded: number, symbol: string): void {
  writeFileSync(
    join(tree.root, relPath),
    `import { anchor } from "./lib/eval-predicate.js";\nexport const P = anchor("${target}", ${recorded}, "${symbol}");\n`,
  );
}

function run(tree: Tree, args: string[]): { code: number; out: string } {
  try {
    const out = execFileSync("npx", ["tsx", join(tree.root, "scripts", "refresh-predicates.ts"), ...args], { encoding: "utf-8", cwd: tree.root, stdio: "pipe" });
    return { code: 0, out };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
