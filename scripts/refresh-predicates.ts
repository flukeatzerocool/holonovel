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
 * `--repath` extends resolution to a move between files: when the recorded file
 * no longer carries the symbol, the whole source root (the recorded path's first
 * two segments — `holonovel/src` or `holonovel/scripts`) is searched, and the
 * anchor is rewritten only when exactly one other file in that root carries the
 * symbol on a code line. Two carriers are ambiguous and refused; a recorded path
 * that no longer exists is unresolved. `npm run fix-anchors` passes the flag;
 * `check-anchors` does not, so a move fails the gate instead of being repaired
 * silently during a check.
 *
 * Usage: npx tsx scripts/refresh-predicates.ts [--check] [--write] [--repath] [--json] [--help]
 * Exit codes: 0 = current or repaired, 1 = drift under --check, ambiguous or
 * unresolvable anchor, 2 = fatal.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { handleHelp, parseFlag, rejectUnknown } from "./lib/args.js";
import { resolveAnchorInRoot, resolveAnchorLine } from "./lib/anchor-resolver.js";

const ROOT = join(import.meta.dirname, "..");
const ANCHOR_RE = /anchor\("([^"]+)",\s*(\d+),\s*"([A-Za-z_$][\w$]*)"\)/g;

const USAGE = `refresh-predicates — repair holosuite predicate line numbers

Usage:
  npx tsx scripts/refresh-predicates.ts [--check] [--write] [--repath] [--json] [--help]

Without --write the tool reports drift only. With --write it rewrites the
recorded line to the current line that carries the symbol token. With --check it
fails on drift, naming the repair. A symbol on several lines with none within
±40 lines of the recorded line is ambiguous and refused.

--repath accepts a move between files: it searches the recorded path's source
root (its first two segments) and rewrites the path as well as the line, but
only when exactly one other file in that root carries the symbol. Two carriers
are ambiguous and refused; a missing recorded file is unresolved.

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
  toPath: string;
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

/** The recorded path's source root: its first two segments. A path with fewer
 *  segments has no root and is never repathed. */
function sourceRoot(recordedPath: string): string | null {
  const parts = recordedPath.split("/").filter(Boolean);
  if (parts.length < 3) return null;
  return `${parts[0]}/${parts[1]}`;
}

const rootCache = new Map<string, Map<string, string[]>>();

/** Every `.ts` file under `root`, keyed by repo-relative path with `/`
 *  separators. Built once per root, sorted so the map iterates deterministically. */
function filesUnder(root: string): Map<string, string[]> {
  const cached = rootCache.get(root);
  if (cached) return cached;
  const out = new Map<string, string[]>();
  let names: string[];
  try {
    names = (readdirSync(join(ROOT, root), { recursive: true }) as string[]).sort();
  } catch {
    rootCache.set(root, out);
    return out;
  }
  for (const name of names) {
    if (!name.endsWith(".ts")) continue;
    const abs = join(ROOT, root, name);
    try {
      if (!statSync(abs).isFile()) continue;
      out.set(`${root}/${name.split("\\").join("/")}`, readFileSync(abs, "utf-8").split(/\r?\n/));
    } catch {
      // An unreadable file under the root cannot carry the symbol we need; the
      // anchor stays unresolved rather than failing the whole run.
    }
  }
  rootCache.set(root, out);
  return out;
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--check", "--write", "--repath", "--json"]), USAGE);
  const check = parseFlag(argv, "--check");
  const write = parseFlag(argv, "--write") && !check;
  const asJson = parseFlag(argv, "--json");
  const repath = parseFlag(argv, "--repath");

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
      let currentPath = path!;
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
          if (!repath) {
            unresolved.push(`${relative(ROOT, source)}: ${path} has no code line with '${symbol}'; if the symbol moved between files, repair with: npm run fix-anchors (--repath)`);
            continue;
          }
          const root = sourceRoot(path!);
          if (root === null) {
            unresolved.push(`${relative(ROOT, source)}: ${path} has no code line with '${symbol}' and no source root to search`);
            continue;
          }
          const moved = resolveAnchorInRoot(filesUnder(root), path!, recorded, symbol!);
          if (moved.ambiguous.length > 0) {
            unresolved.push(`${relative(ROOT, source)}: ${path}:${recorded}#${symbol} is ambiguous across files (${moved.ambiguous.length} candidates: ${moved.ambiguous.join(", ")})`);
            continue;
          }
          if (moved.path === null || moved.line === null) {
            unresolved.push(`${relative(ROOT, source)}: ${path} has no code line with '${symbol}' in ${root}`);
            continue;
          }
          currentPath = moved.path;
          current = moved.line;
        }
      }
      if (current !== recorded || currentPath !== path) {
        drifts.push({ source: relative(ROOT, source), path: path!, from: recorded, to: current, symbol: symbol!, matched: whole, toPath: currentPath });
        next = next.replace(whole, `anchor("${currentPath}", ${current}, "${symbol}")`);
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
      const target = d.toPath === d.path ? `${d.path}:${d.to}` : `${d.toPath}:${d.to}`;
      process.stdout.write(`${d.source}: ${d.path}:${d.from}#${d.symbol} -> ${target}${write ? " (written)" : ""}\n`);
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
