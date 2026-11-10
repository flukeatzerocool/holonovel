#!/usr/bin/env npx tsx
/**
 * refresh-predicates.ts — repair holosuite predicate line numbers.
 * [informational; build tool with --write]
 *
 * Purpose: holosuite evidence anchors carry `path:line#symbol`, and the
 * resolver requires the recorded line to contain the symbol. Code movement
 * makes the numbers stale; this tool finds each symbol's current line and,
 * with `--write`, rewrites the anchor. The resolver contract is unchanged.
 *
 * Usage: npx tsx scripts/refresh-predicates.ts [--write] [--json] [--help]
 * Exit codes: 0 = current or repaired, 1 = malformed/unresolvable anchor,
 * 2 = fatal. Output is deterministic (sorted by file then line).
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { handleHelp, parseFlag, rejectUnknown } from "./lib/args.js";

const ROOT = join(import.meta.dirname, "..");
const ANCHOR_RE = /anchor\("([^"]+)",\s*(\d+),\s*"([A-Za-z_$][\w$]*)"\)/g;

const USAGE = `refresh-predicates — repair holosuite predicate line numbers

Usage:
  npx tsx scripts/refresh-predicates.ts [--write] [--json] [--help]

Without --write the tool reports drift only. With --write it rewrites the
recorded line to the current line that carries the symbol token.

Exit codes: 0 = current or repaired; 1 = malformed or unresolvable anchor; 2 = fatal.
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

function resolveLine(lines: string[], recorded: number, symbol: string): number | null {
  const token = new RegExp(`\\b${symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  const candidates: number[] = [];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return;
    if (/^[)}\];,]+$/.test(trimmed)) return;
    if (/^(\/\/|\/\*|\*)/.test(trimmed)) return;
    if (token.test(trimmed)) candidates.push(index + 1);
  });
  if (candidates.length === 0) return null;
  return candidates.reduce((best, n) => (Math.abs(n - recorded) < Math.abs(best - recorded) ? n : best), candidates[0]!);
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--write", "--json"]), USAGE);
  const write = parseFlag(argv, "--write");
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
      const current = 1 <= recorded && recorded <= lines.length && lines[recorded - 1]!.includes(symbol!)
        ? recorded
        : resolveLine(lines, recorded, symbol!);
      if (current === null) {
        unresolved.push(`${relative(ROOT, source)}: ${path} has no code line with '${symbol}'`);
        continue;
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
  process.exit(unresolved.length > 0 ? 1 : 0);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
}
