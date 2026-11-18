#!/usr/bin/env npx tsx
/**
 * test-anchor-tooling.ts — self-tests for the evidence-anchor resolver and the
 * `refresh-predicates` contract. [gate]
 *
 * Purpose: `refresh-predicates --check` is a gate, so the resolver's
 * conservatism is load-bearing. It resolves by identity, never proximity: a
 * symbol the recorded line no longer carries is repaired only when the file
 * carries it on exactly one code line, and several candidates are refused rather
 * than ranked by distance. `--repath` adds a second judgement — a symbol that
 * left its file may be accepted in another file of the same source root, but
 * only when exactly one such file carries it and that file carries it on exactly
 * one line. `--offset` declares a line shift, is verified before and after the
 * write, and never falls back to a cross-file repath while the recorded file
 * still carries the symbol. The CLI cases run against scratch trees shaped like
 * the repository, so the real anchor files are never touched.
 *
 * Usage: npx tsx scripts/test-anchor-tooling.ts [--help]
 * Exit codes: 0 = every case passed, 1 = a case failed, 2 = fatal.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handleHelp, rejectUnknown } from "./lib/args.js";
import {
  candidateLines,
  lineCarriesSymbol,
  resolveAnchorInRoot,
  resolveAnchorSymbol,
} from "./lib/anchor-resolver.js";

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

const unique = resolveAnchorSymbol(lines, "gamma");
check(unique.line === 67 && unique.ambiguous.length === 0, "a single candidate is found however far it moved");

const near = resolveAnchorSymbol(["a();", "b();", "target();", "c();", "target();"], "target");
check(near.line === null && near.ambiguous.join(",") === "3,5", "two candidates are ambiguous even when one is near");

const far = resolveAnchorSymbol(
  ["dup();", ...Array.from({ length: 98 }, (_, i) => `x${i} = ${i};`), "dup();", "z();"],
  "dup",
);
check(far.line === null && far.ambiguous.length === 2, "two distant candidates are ambiguous");

const missing = resolveAnchorSymbol(["one();", "two();"], "nope");
check(missing.line === null && missing.ambiguous.length === 0, "an absent symbol resolves to nothing");
check(candidateLines(["// target", "target();", "  }"], "target").join(",") === "2", "comment and brace-only lines are not candidates");
check(
  lineCarriesSymbol('  return err("X");', "err") &&
    !lineCarriesSymbol("const errorRate = 1;", "err") &&
    !lineCarriesSymbol("// err is documented here", "err"),
  "lineCarriesSymbol rejects a substring occurrence and a comment line",
);
check(resolveAnchorSymbol.length === 2, "resolution takes no recorded line number");

const oneLine = resolveAnchorInRoot(new Map([["a/x.ts", ["twin();"]]]), "a/recorded.ts", "twin");
const twoLines = resolveAnchorInRoot(
  new Map([["a/x.ts", ["twin();", "y();", "twin();"]]]),
  "a/recorded.ts",
  "twin",
);
check(
  oneLine.ambiguity === "none" && oneLine.path === "a/x.ts" && oneLine.line === 1 &&
    twoLines.ambiguity === "lines" && twoLines.ambiguous.join(",") === "a/x.ts:1,a/x.ts:3",
  "repath accepts one candidate line and refuses two in the carrier file",
);

// ── CLI contract against scratch trees ──
// C1 — a symbol that moved inside its own file, unique in that file.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/index.ts", ["const a = 1;", "const b = 2;", "function needful() { return 3; }", "const c = 4;"]);
    writeAnchor(tree, "holonovel/scripts/holosuite-probe.ts", "holonovel/src/index.ts", 1, "needful");

    const before = run(tree, ["--check"]);
    check(before.code === 1 && /stale anchor/.test(before.out) && /fix-anchors/.test(before.out), "C1 check fails on drift and names the repair", before.out);
    const repaired = run(tree, ["--write"]);
    check(repaired.code === 0 && /-> holonovel\/src\/index\.ts:3 \(written\)/.test(repaired.out), "C1 write repairs the moved anchor", repaired.out);
    const after = run(tree, ["--check"]);
    check(after.code === 0 && /predicates current/.test(after.out), "C1 check passes after the repair", after.out);
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

/**
 * The shared dense-symbol tree: `err` on lines 1, 5 and 47, and the anchor
 * recorded at 42 — the stage-1 shape, where the nearest occurrence is the wrong
 * one.
 */
function denseTree(): Tree {
  const tree = makeTree();
  const body = [
    "export function err(code: string) {", // 1
    "  return { code };",
    "const alpha = 1;",
    "const beta = 2;",
    "function run() { return err(\"X\"); }", // 5
    ...Array.from({ length: 41 }, (_, i) => `const f${i} = ${i};`), // 6..46
    "export function other() { return err(\"Y\"); }", // 47
  ];
  writeSource(tree, "holonovel/src/index.ts", body);
  writeAnchor(tree, "holonovel/scripts/holosuite-dense.ts", "holonovel/src/index.ts", 42, "err");
  return tree;
}

// C2 — a stale multi-candidate anchor is refused, never ranked by distance.
{
  const tree = denseTree();
  try {
    const before = read(tree, "holonovel/scripts/holosuite-dense.ts");
    const reported = run(tree, ["--check"]);
    check(reported.code === 1 && /ambiguous \(3 candidates: 1, 5, 47\)/.test(reported.out), "C2 a stale multi-candidate anchor is reported ambiguous with every candidate named", reported.out);
    const written = run(tree, ["--write"]);
    check(written.code === 1 && /ambiguous \(3 candidates/.test(written.out), "C2 write refuses the ambiguity", written.out);
    check(read(tree, "holonovel/scripts/holosuite-dense.ts") === before, "C2 nothing is written for an ambiguous anchor");
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// C3, C4, C5, C16 — the declared offset.
{
  const tree = denseTree();
  try {
    writeSource(tree, "holonovel/src/tools/errs.ts", ["export const errLine = 1;", "const err = 2;"]);
    const before = read(tree, "holonovel/scripts/holosuite-dense.ts");

    const missed = run(tree, ["--write", "--offset", "3", "--path", "holonovel/src/index.ts"]);
    check(missed.code === 1 && /offset target holonovel\/src\/index\.ts:45 does not carry 'err'/.test(missed.out), "C4 an offset whose target does not carry the symbol is refused", missed.out);
    check(read(tree, "holonovel/scripts/holosuite-dense.ts") === before, "C4 a refused offset writes nothing");

    const guarded = run(tree, ["--write", "--repath", "--offset", "3", "--path", "holonovel/src/index.ts"]);
    check(guarded.code === 1 && /offset target/.test(guarded.out) && /does not carry/.test(guarded.out), "C16 an offset miss does not fall back to a cross-file repath while the recorded file still carries the symbol", guarded.out);
    check(read(tree, "holonovel/scripts/holosuite-dense.ts") === before && /holonovel\/src\/index\.ts", 42/.test(before), "C16 the anchor is untouched by the refused fallback");

    const repaired = run(tree, ["--write", "--offset", "5", "--path", "holonovel/src/index.ts"]);
    check(repaired.code === 0 && /-> holonovel\/src\/index\.ts:47 \(written\)/.test(repaired.out), "C3 a declared offset repairs to the verified line", repaired.out);
    check(/anchor\("holonovel\/src\/index\.ts", 47, "err"\)/.test(read(tree, "holonovel/scripts/holosuite-dense.ts")), "C3 the anchor file now records the verified line");

    const afterBytes = read(tree, "holonovel/scripts/holosuite-dense.ts");
    const untouched = run(tree, ["--write", "--offset", "5", "--path", "holonovel/src/index.ts"]);
    check(untouched.code === 0 && /predicates current/.test(untouched.out) && read(tree, "holonovel/scripts/holosuite-dense.ts") === afterBytes, "C5 an anchor whose recorded line still carries the symbol is left alone");
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// C6, C12, C13, C15 — declaration validation.
{
  const tree = denseTree();
  try {
    const noPath = run(tree, ["--write", "--offset", "5"]);
    check(noPath.code === 1 && /--offset requires --path/.test(noPath.out), "C6 --offset requires --path", noPath.out);
    const notInteger = run(tree, ["--write", "--offset", "abc", "--path", "holonovel/src/index.ts"]);
    check(notInteger.code === 1 && /requires a signed integer/.test(notInteger.out), "C12 a non-integer offset is refused", notInteger.out);
    const zero = run(tree, ["--write", "--offset", "0", "--path", "holonovel/src/index.ts"]);
    check(zero.code === 1 && /declares no shift/.test(zero.out), "C12 a zero offset is refused", zero.out);
    const emptyPath = run(tree, ["--check", "--offset", "1", "--path", "holonovel/src/nonexistent.ts"]);
    check(emptyPath.code === 1 && /no anchor records path holonovel\/src\/nonexistent\.ts/.test(emptyPath.out), "C13 a --path with no anchor is an error", emptyPath.out);
    const noValue = run(tree, ["--write", "--path", "holonovel/src/index.ts", "--offset"]);
    const badFromLine = run(tree, ["--write", "--offset", "1", "--path", "holonovel/src/index.ts", "--from-line", "x"]);
    check(
      noValue.code === 1 && /--offset requires a value/.test(noValue.out) &&
        badFromLine.code === 1 && /--from-line requires a positive integer/.test(badFromLine.out),
      "C15 a value flag with no value (or a non-integer --from-line) is an error",
      `${noValue.out}\n${badFromLine.out}`,
    );
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// C14 — a negative offset survives argument parsing and applies.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/index.ts", [
      "export function err(code: string) { return { code }; }", // 1
      ...Array.from({ length: 44 }, (_, i) => `const f${i} = ${i};`), // 2..45
      "export function other() { return err(\"Y\"); }", // 46
      ...Array.from({ length: 5 }, (_, i) => `const g${i} = ${i};`), // 47..51
    ]);
    writeAnchor(tree, "holonovel/scripts/holosuite-negative.ts", "holonovel/src/index.ts", 51, "err");
    const repaired = run(tree, ["--write", "--offset", "-5", "--path", "holonovel/src/index.ts"]);
    check(repaired.code === 0 && /-> holonovel\/src\/index\.ts:46 \(written\) \[delta -5\]/.test(repaired.out), "C14 a negative offset is parsed and applied", repaired.out);
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// C7 — --from-line scopes the declaration.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/index.ts", [
      "dup();", // 1
      "other();", // 2
      ...Array.from({ length: 17 }, (_, i) => `const f${i} = ${i};`), // 3..19
      "dup();", // 20
      ...Array.from({ length: 4 }, (_, i) => `const g${i} = ${i};`), // 21..24
      "const other = 1;", // 25
      ...Array.from({ length: 4 }, (_, i) => `const h${i} = ${i};`), // 26..29
      "other();", // 30
    ]);
    writeAnchors(tree, "holonovel/scripts/holosuite-scope.ts", [
      { target: "holonovel/src/index.ts", recorded: 15, symbol: "dup" },
      { target: "holonovel/src/index.ts", recorded: 26, symbol: "other" },
    ]);
    const result = run(tree, ["--write", "--offset", "4", "--path", "holonovel/src/index.ts", "--from-line", "20"]);
    const text = read(tree, "holonovel/scripts/holosuite-scope.ts");
    check(
      /anchor\("holonovel\/src\/index\.ts", 30, "other"\)/.test(text) &&
        /anchor\("holonovel\/src\/index\.ts", 15, "dup"\)/.test(text) &&
        result.code === 1,
      "C7 --from-line offsets only the anchors at or after the cut",
      `${result.out}\n${text}`,
    );
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// C8 — an unresolved anchor does not suppress a verified write.
{
  const tree = denseTree();
  try {
    writeAnchors(tree, "holonovel/scripts/holosuite-mixed.ts", [
      { target: "holonovel/src/index.ts", recorded: 42, symbol: "err" },
      { target: "holonovel/src/index.ts", recorded: 30, symbol: "absent" },
    ]);
    const result = run(tree, ["--write", "--offset", "5", "--path", "holonovel/src/index.ts"]);
    const text = read(tree, "holonovel/scripts/holosuite-mixed.ts");
    check(
      result.code === 1 &&
        /anchor\("holonovel\/src\/index\.ts", 47, "err"\)/.test(text) &&
        /holonovel\/src\/index\.ts", 30, "absent"/.test(text),
      "C8 an unresolved anchor does not suppress a verified write",
      `${result.out}\n${text}`,
    );
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// C9 — a repath to a carrier file with two candidate lines is refused.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/index.ts", ["const a = 1;"]);
    writeSource(tree, "holonovel/src/tools/twin.ts", ["const twin = 1;", "const x = 0;", "twin();"]);
    writeAnchor(tree, "holonovel/scripts/holosuite-lines.ts", "holonovel/src/index.ts", 1, "twin");
    const before = read(tree, "holonovel/scripts/holosuite-lines.ts");
    const result = run(tree, ["--check", "--repath"]);
    check(result.code === 1 && /is ambiguous in holonovel\/src\/tools\/twin\.ts \(2 candidate lines: holonovel\/src\/tools\/twin\.ts:1, holonovel\/src\/tools\/twin\.ts:3\)/.test(result.out), "C9 repath ambiguity names both candidate lines", result.out);
    check(read(tree, "holonovel/scripts/holosuite-lines.ts") === before, "C9 an ambiguous repath is never written");
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// C10 — a substring-only occurrence is not a carrying line.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/index.ts", ["const a = 1;", "const b = 2;", "const c = 3;", "const d = 4;", "const errorRate = 1;"]);
    writeAnchor(tree, "holonovel/scripts/holosuite-substring.ts", "holonovel/src/index.ts", 5, "err");
    const result = run(tree, ["--check"]);
    check(result.code === 1 && /has no code line with 'err'/.test(result.out), "C10 a line holding only a longer identifier is not current", result.out);
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// C11 — the hint names the modal delta and changes nothing.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/index.ts", [
      "dup();", // 1
      "other();", // 2
      ...Array.from({ length: 27 }, (_, i) => `const f${i} = ${i};`), // 3..29
      "dup();", // 30
      "other();", // 31
    ]);
    writeAnchors(tree, "holonovel/scripts/holosuite-hint.ts", [
      { target: "holonovel/src/index.ts", recorded: 5, symbol: "dup" },
      { target: "holonovel/src/index.ts", recorded: 6, symbol: "other" },
    ]);
    const before = read(tree, "holonovel/scripts/holosuite-hint.ts");
    const result = run(tree, ["--check"]);
    check(
      /hint: 2 anchor\(s\) in holonovel\/src\/index\.ts share a delta of -4; declare it with --offset -4 --path holonovel\/src\/index\.ts/.test(result.out) &&
        /ambiguous/.test(result.out) &&
        read(tree, "holonovel/scripts/holosuite-hint.ts") === before,
      "C11 the hint names the modal delta on stderr and writes nothing",
      result.out,
    );
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// Existing repath contract — a symbol that moved to another file in its root.
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
    check(noFlag.code === 1 && /has no code line with 'moved'/.test(noFlag.out) && /fix-anchors/.test(noFlag.out), "repath: check without --repath fails on a moved anchor and names the repair", noFlag.out);

    const reportOnly = run(tree, ["--check", "--repath"]);
    check(reportOnly.code === 1 && /holonovel\/src\/tools\/knowledge\.ts:\d+/.test(reportOnly.out), "repath: check --repath reports the move to the source file, ignoring the other root", reportOnly.out);
    check(/description/.test(read(tree, "holonovel/src/tools/knowledge.ts").split("\n")[1] ?? ""), "repath: check --repath writes nothing");

    const absent = run(tree, ["--check", "--repath", "--json"]);
    check(absent.code === 1 && /"written": false/.test(absent.out), "repath: check --repath exits 1 and reports no write", absent.out);

    const repaired = run(tree, ["--write", "--repath"]);
    check(repaired.code === 0 && /-> holonovel\/src\/tools\/knowledge\.ts:\d+ \(written\)/.test(repaired.out), "repath: write --repath rewrites the path and the line", repaired.out);
    const after = run(tree, ["--check", "--repath"]);
    check(after.code === 0 && /predicates current/.test(after.out), "repath: check --repath passes after the repath", after.out);
    check(/anchor\("holonovel\/src\/tools\/knowledge\.ts"/.test(read(tree, "holonovel/scripts/holosuite-repath.ts")), "repath: the anchor file now names the new path", read(tree, "holonovel/scripts/holosuite-repath.ts"));
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// Existing repath contract — two carrier files are ambiguous and refused.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/index.ts", ["const a = 1;"]);
    writeSource(tree, "holonovel/src/tools/one.ts", ["const twin = 1;"]);
    writeSource(tree, "holonovel/src/tools/two.ts", ["const twin = 2;"]);
    writeAnchor(tree, "holonovel/scripts/holosuite-ambiguous.ts", "holonovel/src/index.ts", 1, "twin");

    const result = run(tree, ["--check", "--repath"]);
    check(result.code === 1 && /ambiguous across files \(2 candidates: holonovel\/src\/tools\/one\.ts, holonovel\/src\/tools\/two\.ts\)/.test(result.out), "repath: two carriers in the root are ambiguous and both are named", result.out);
    const written = run(tree, ["--write", "--repath"]);
    check(written.code === 1 && /holonovel\/src\/index\.ts", 1, "twin"/.test(read(tree, "holonovel/scripts/holosuite-ambiguous.ts")), "repath: an ambiguous move is never written", written.out);
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// Existing repath contract — no carrier anywhere in the root.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/index.ts", ["const a = 1;"]);
    writeSource(tree, "holonovel/src/tools/empty.ts", ["const b = 2;"]);
    writeAnchor(tree, "holonovel/scripts/holosuite-gone.ts", "holonovel/src/index.ts", 1, "vanished");

    const result = run(tree, ["--check", "--repath"]);
    check(result.code === 1 && /has no code line with 'vanished' in holonovel\/src/.test(result.out), "repath: a symbol with no carrier in the root is unresolved", result.out);
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

// Existing repath contract — a recorded path that no longer exists.
{
  const tree = makeTree();
  try {
    writeSource(tree, "holonovel/src/tools/knowledge.ts", ["const moved = 1;"]);
    writeAnchor(tree, "holonovel/scripts/holosuite-deleted.ts", "holonovel/src/deleted.ts", 1, "moved");

    const result = run(tree, ["--check", "--repath"]);
    check(result.code === 1 && /cannot read holonovel\/src\/deleted\.ts/.test(result.out), "repath: a deleted recorded path is unresolved rather than repathed", result.out);
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
}

interface Tree { root: string }

interface AnchorSpec {
  target: string;
  recorded: number;
  symbol: string;
}

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
  writeAnchors(tree, relPath, [{ target, recorded, symbol }]);
}

function writeAnchors(tree: Tree, relPath: string, anchors: AnchorSpec[]): void {
  const body = anchors
    .map((a, i) => `export const P${i} = anchor("${a.target}", ${a.recorded}, "${a.symbol}");`)
    .join("\n");
  writeFileSync(join(tree.root, relPath), `import { anchor } from "./lib/eval-predicate.js";\n${body}\n`);
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
