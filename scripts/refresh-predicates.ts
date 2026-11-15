#!/usr/bin/env npx tsx
/**
 * refresh-predicates.ts — repair holosuite predicate line numbers.
 * [gate with --check; build tool with --write; informational otherwise]
 *
 * Purpose: holosuite evidence anchors carry `path:line#symbol`, and the
 * resolver requires the recorded line to contain the symbol. Code movement
 * makes the numbers stale; this tool finds each symbol's current line and,
 * with `--write`, rewrites the anchor. With `--check` it is a gate: any drift
 * exits 1 and names the repair. A symbol found on several lines with none within
 * the ±40-line window is refused rather than guessed. Output is deterministic
 * (sorted by file then line).
 *
 * Usage: npx tsx scripts/refresh-predicates.ts [--check] [--write] [--write --json] [--help]
 * Exit codes: 0 = current or repaired, 1 = drift under --check, ambiguous or
 * unresolvable anchor, 2 = fatal.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { handleHelp, parseFlag, rejectUnknown } from "./lib/args.js";
import { resolveAnchorLine } from "./lib/anchor-resolver.js";

const ROOT = join(import.meta.dirname, "..");
const ANCHOR_RE = /anchor\("([^"]+)",\s*(\d+),\s*"([A-Za-z_$][\w$]*)"\)/g;

const USAGE = `refresh-predicates — repair holosuite predicate line numbers

Usage:
  npx tsx scripts/refresh-predicates.ts [--check] [--write] [--json] [--help]

Without --write the tool reports drift only. With --write it rewrites the
recorded line to the current line that carries the symbol token. With --check it
fails on drift, naming the repair. A symbol on several lines with none within
±40 lines of the recorded line is ambiguous and refused.

Exit codes: 0 = current or repaired; 1 = drift under --check, ambiguous or
unresolvable anchor; 2 = fatal.
`;

interface Drift {
  source: string;
  path: string;
  from: number;
  to: number;
  symbol: string;
  matched: string;
}

function anchorFiles(): string[] {
  const scripts = join(ROOT, "holonovel", "scripts");
  const lib = join(scripts, "lib");
  const out: string[] = [];
  for (const name of readdirSync(scripts).sort()) {
    if (/^holosuite.*\.ts$/.test(name)) out.push(join(scripts, name));
  }
  for (const name of readdirSync(lib).sort()) {
    if (/^holosuite-.*\.ts$/.test(name)) out.push(join(lib, name));
  }
  return out;
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--check", "--write", "--json"]), USAGE);
  const check = parseFlag(argv, "--check");
  const write = parseFlag(argv, "--write") && !check;
  const asJson = parseFlag(argv, "--json");

  const drifts: Drift[] = [];
  const unresolved: string[] = [];
  const edits = new Map<string, string>();

  for (const source of anchorFiles()) {
    const text = readFileSync(source, "utf-8");
    let next = text;
    for (const match of text.matchAll(ANCHOR_RE)) {
      const [whole, path, lineText, symbol] = match;
      const recorded = Number.parseInt(lineText!, 10);
      let target: string;
      try { target = readFileSync(join(ROOT, path!), "utf-8"); }
      catch { unresolved.push(`${relative(ROOT, source)}: cannot read ${path}`); continue; }
      const lines = target.split(/\r?\n/);
      let current: number | null;
      if (1 <= recorded && recorded <= lines.length && lines[recorded - 1]!.includes(symbol!)) {
        current = recorded;
      } else {
        const resolution = resolveAnchorLine(lines, recorded, symbol!);
        current = resolution.line;
        if (current === null && resolution.ambiguous.length > 0) {
          unresolved.push(`${relative(ROOT, source)}: ${path}:${recorded}#${symbol} is ambiguous (${resolution.ambiguous.length} candidates: ${resolution.ambiguous.join(", ")})`);
          continue;
        }
        if (current === null) {
          unresolved.push(`${relative(ROOT, source)}: ${path} has no code line with '${symbol}'`);
          continue;
        }
      }
      if (current !== recorded) {
        drifts.push({ source: relative(ROOT, source), path: path!, from: recorded, to: current, symbol: symbol!, matched: whole });
        next = next.replace(whole, `anchor("${path}", ${current}, "${symbol}")`);
      }
    }
    if (next !== text) edits.set(source, next);
  }

  if (write) {
    for (const [source, text] of [...edits.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      writeFileSync(source, text);
    }
  }

  if (asJson) {
    process.stdout.write(JSON.stringify({ drifts, unresolved, written: write }, null, 2) + "\n");
  } else {
    for (const d of drifts.sort((a, b) => a.source.localeCompare(b.source) || a.from - b.from)) {
      process.stdout.write(`${d.source}: ${d.path}:${d.from}#${d.symbol} -> ${d.to}${write ? " (written)" : ""}\n`);
    }
    for (const u of unresolved) process.stderr.write(`unresolved: ${u}\n`);
    if (drifts.length === 0 && unresolved.length === 0) process.stdout.write("predicates current\n");
    else process.stdout.write(`${drifts.length} drift(s), ${unresolved.length} unresolved\n`);
  }
  if (unresolved.length > 0) process.exit(1);
  if (check && drifts.length > 0) {
    process.stderr.write(`${drifts.length} stale anchor(s); repair with: npm run fix-anchors\n`);
    process.exit(1);
  }
  process.exit(0);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
}
