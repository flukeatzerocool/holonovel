#!/usr/bin/env npx tsx
/**
 * refresh-predicates.ts — repair holosuite predicate line numbers.
 * [gate with --check; build tool with --write; informational otherwise]
 *
 * Purpose: holosuite evidence anchors carry `path:line#symbol`, and an anchor is
 * valid only when its recorded line is a code line carrying the symbol as a
 * whole word. Resolution is by identity, never by proximity: a symbol that the
 * recorded line no longer carries is repaired only when the file carries it on
 * exactly one code line. A symbol on several lines is ambiguous and refused —
 * after a block move the nearest occurrence is routinely a different one — so a
 * move between lines is repaired by declaring its offset with `--offset`.
 * Output is deterministic (sorted by file then line).
 *
 * `--offset <n>` declares a line shift for the anchors recorded in `--path`:
 * an anchor whose recorded line still carries the symbol is left alone; one
 * whose line does not is moved to `recorded + n` and rewritten only when that
 * line carries the symbol; otherwise it is unresolved and nothing is written for
 * it. `--from-line <N>` restricts the declaration to anchors at or after line N.
 * Every rewrite is verified before it is written and re-read after the file is
 * written.
 *
 * `--repath` extends resolution to a move between files: when the recorded file
 * no longer carries the symbol, the whole source root (the recorded path's first
 * two segments — `holonovel/src` or `holonovel/scripts`) is searched, and the
 * anchor is rewritten only when exactly one other file in that root carries the
 * symbol on exactly one code line. Two carriers, or two candidate lines in the
 * one carrier, are ambiguous and refused; a recorded path that no longer exists
 * is unresolved. An `--offset` miss falls back to `--repath` only when the
 * recorded file carries no candidate line at all; if it still carries the
 * symbol, the declaration was wrong and the anchor is refused.
 *
 * `npm run fix-anchors` passes `--write --repath`; `check-anchors` does not, so a
 * move fails the gate instead of being repaired silently during a check.
 *
 * Usage: npx tsx scripts/refresh-predicates.ts [--check] [--write] [--repath]
 *          [--offset <n> --path <recorded-path> [--from-line <n>]] [--json] [--help]
 * Exit codes: 0 = current or repaired, 1 = drift under --check, ambiguous or
 * unresolvable anchor, invalid declaration, 2 = fatal.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { handleHelp, parseFlag, parseValueFlag, rejectUnknown } from "./lib/args.js";
import {
  candidateLines,
  lineCarriesSymbol,
  resolveAnchorInRoot,
  resolveAnchorSymbol,
} from "./lib/anchor-resolver.js";

const ROOT = join(import.meta.dirname, "..");
const ANCHOR_RE = /anchor\("([^"]+)",\s*(\d+),\s*"([A-Za-z_$][\w$]*)"\)/g;
const BOOLEAN_FLAGS = ["--check", "--write", "--repath", "--json"];
const VALUE_FLAGS = ["--offset", "--path", "--from-line"];

const USAGE = `refresh-predicates — repair holosuite predicate line numbers

Usage:
  npx tsx scripts/refresh-predicates.ts [--check] [--write] [--repath]
      [--offset <n> --path <recorded-path> [--from-line <n>]] [--json] [--help]

Without --write the tool reports drift only. With --write it rewrites a recorded
line only when the new line carries the symbol as a whole word. An anchor whose
recorded line lost the symbol is repaired only when the file carries it on
exactly one code line; several candidates are ambiguous and refused.

--offset <n> declares a line shift for the anchors recorded in --path:
an anchor whose recorded line still carries the symbol is untouched, one whose
line lost it moves to recorded + n and is rewritten only when that line carries
the symbol. --from-line <N> limits the declaration to anchors at or after N.
An --offset miss falls back to --repath only when the recorded file carries no
candidate line at all.

--repath accepts a move between files: it searches the recorded path's source
root (its first two segments) and rewrites the path as well as the line, but
only when exactly one other file in that root carries the symbol on exactly one
code line. Two carriers, or two candidate lines, are ambiguous and refused; a
missing recorded file is unresolved.

Exit codes: 0 = current or repaired; 1 = drift under --check, ambiguous or
unresolvable anchor, invalid declaration; 2 = fatal.
`;

interface Drift {
  source: string;
  path: string;
  from: number;
  to: number;
  symbol: string;
  matched: string;
  toPath: string;
  delta: number;
}

interface StaleAnchor {
  recordedPath: string;
  recorded: number;
  symbol: string;
  candidates: number[];
}

interface Rewritten {
  recordedPath: string;
  recorded: number;
  symbol: string;
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

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

/** The nearest candidate's delta, used only to suggest a declared offset. */
function suggestionDelta(anchor: StaleAnchor): number | null {
  if (anchor.candidates.length === 0) return null;
  const nearest = anchor.candidates.reduce((best, line) =>
    Math.abs(line - anchor.recorded) < Math.abs(best - anchor.recorded) ? line : best,
  );
  return nearest - anchor.recorded;
}

/** One advisory stderr line per file whose stale anchors share a modal delta.
 *  Never affects the exit code and never writes. */
function printHints(stale: StaleAnchor[]): void {
  const byPath = new Map<string, Map<number, number>>();
  for (const anchor of stale) {
    const delta = suggestionDelta(anchor);
    if (delta === null) continue;
    const counts = byPath.get(anchor.recordedPath) ?? new Map<number, number>();
    counts.set(delta, (counts.get(delta) ?? 0) + 1);
    byPath.set(anchor.recordedPath, counts);
  }
  for (const [path, counts] of [...byPath.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    const [delta, count] = ranked[0]!;
    const runnerUp = ranked[1]?.[1] ?? 0;
    if (count < 2 || count <= runnerUp) continue;
    process.stderr.write(
      `hint: ${count} anchor(s) in ${path} share a delta of ${delta}; declare it with --offset ${delta} --path ${path}\n`,
    );
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(
    argv,
    new Set([...BOOLEAN_FLAGS, ...VALUE_FLAGS]),
    USAGE,
    new Set(VALUE_FLAGS),
  );
  const check = parseFlag(argv, "--check");
  const write = parseFlag(argv, "--write") && !check;
  const asJson = parseFlag(argv, "--json");
  const repath = parseFlag(argv, "--repath");

  const offsetText = parseValueFlag(argv, "--offset");
  const offsetPath = parseValueFlag(argv, "--path");
  const fromLineText = parseValueFlag(argv, "--from-line");

  if (argv.includes("--offset") && offsetText === null) fail("--offset requires a value");
  if (argv.includes("--path") && offsetPath === null) fail("--path requires a value");
  if (argv.includes("--from-line") && fromLineText === null) fail("--from-line requires a value");

  let offset = 0;
  let fromLine = 1;
  if (offsetText !== null) {
    if (!/^-?\d+$/.test(offsetText)) fail(`--offset requires a signed integer (got '${offsetText}')`);
    offset = Number.parseInt(offsetText, 10);
    if (offset === 0) fail("--offset 0 declares no shift");
  }
  if (offsetPath !== null && offsetText === null) fail("--path requires --offset");
  if (offsetText !== null && offsetPath === null) fail("--offset requires --path <recorded-path>");
  if (fromLineText !== null) {
    if (offsetText === null || offsetPath === null) {
      fail("--from-line requires --offset and --path");
    }
    if (!/^\d+$/.test(fromLineText)) fail(`--from-line requires a positive integer (got '${fromLineText}')`);
    fromLine = Number.parseInt(fromLineText, 10);
    if (fromLine < 1) fail("--from-line requires a positive integer");
  }

  const drifts: Drift[] = [];
  const unresolved: string[] = [];
  const stale: StaleAnchor[] = [];
  const rewritten: Rewritten[] = [];
  const edits = new Map<string, string>();
  const declared = offsetText !== null;
  let selected = 0;

  for (const source of anchorFiles()) {
    const text = readFileSync(source, "utf-8");
    let next = text;
    for (const match of text.matchAll(ANCHOR_RE)) {
      const [whole, path, lineText, symbol] = match;
      const recorded = Number.parseInt(lineText!, 10);
      let target: string;
      try {
        target = readFileSync(join(ROOT, path!), "utf-8");
      } catch {
        unresolved.push(`${relative(ROOT, source)}: cannot read ${path}`);
        continue;
      }
      const lines = target.split(/\r?\n/);
      const recordedLine = lines[recorded - 1] ?? "";
      const inScope = declared && offsetPath === path && recorded >= fromLine;
      if (inScope) selected++;
      let current: number | null;
      let currentPath = path!;
      if (lineCarriesSymbol(recordedLine, symbol!)) {
        current = recorded;
      } else {
        stale.push({ recordedPath: path!, recorded, symbol: symbol!, candidates: candidateLines(lines, symbol!) });
        if (inScope) {
          const shifted = recorded + offset;
          if (shifted >= 1 && shifted <= lines.length && lineCarriesSymbol(lines[shifted - 1]!, symbol!)) {
            current = shifted;
          } else if (repath && candidateLines(lines, symbol!).length === 0) {
            const moved = resolveMovedAnchor(path!, symbol!, unresolved, source, recorded);
            if (moved === null) continue;
            currentPath = moved.path;
            current = moved.line;
          } else {
            unresolved.push(
              `${relative(ROOT, source)}: offset target ${path}:${shifted} does not carry '${symbol}' (anchor ${relative(ROOT, source)}:${path}:${recorded})`,
            );
            continue;
          }
        } else {
          const resolution = resolveAnchorSymbol(lines, symbol!);
          current = resolution.line;
          if (current === null && resolution.ambiguous.length > 0) {
            unresolved.push(
              `${relative(ROOT, source)}: ${path}:${recorded}#${symbol} is ambiguous (${resolution.ambiguous.length} candidates: ${resolution.ambiguous.join(", ")}); declare the shift with --offset <n> --path ${path}, or repoint the line by hand`,
            );
            continue;
          }
          if (current === null) {
            if (!repath) {
              unresolved.push(
                `${relative(ROOT, source)}: ${path} has no code line with '${symbol}'; if the symbol moved between files, repair with: npm run fix-anchors (--repath)`,
              );
              continue;
            }
            const moved = resolveMovedAnchor(path!, symbol!, unresolved, source, recorded);
            if (moved === null) continue;
            currentPath = moved.path;
            current = moved.line;
          }
        }
      }
      if (current !== recorded || currentPath !== path) {
        drifts.push({
          source: relative(ROOT, source),
          path: path!,
          from: recorded,
          to: current,
          symbol: symbol!,
          matched: whole,
          toPath: currentPath,
          delta: current - recorded,
        });
        next = next.replace(whole, `anchor("${currentPath}", ${current}, "${symbol}")`);
        rewritten.push({ recordedPath: currentPath, recorded: current, symbol: symbol! });
      }
    }
    if (next !== text) edits.set(source, next);
  }

  if (declared && selected === 0) {
    fail(`no anchor records path ${offsetPath}; --path must name a path an anchor actually records`);
  }

  if (write) {
    const written = [...edits.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [source, text] of written) {
      writeFileSync(source, text);
    }
    // Verify every rewritten line, after the write, from the file on disk.
    const cache = new Map<string, string[]>();
    const failures: string[] = [];
    for (const entry of rewritten) {
      let lines = cache.get(entry.recordedPath);
      if (!lines) {
        try {
          lines = readFileSync(join(ROOT, entry.recordedPath), "utf-8").split(/\r?\n/);
        } catch {
          failures.push(`post-write verification: cannot read ${entry.recordedPath}`);
          continue;
        }
        cache.set(entry.recordedPath, lines);
      }
      if (!lineCarriesSymbol(lines[entry.recorded - 1] ?? "", entry.symbol)) {
        failures.push(
          `post-write verification: ${entry.recordedPath}:${entry.recorded} does not carry '${entry.symbol}'`,
        );
      }
    }
    if (failures.length > 0) {
      for (const failure of failures) process.stderr.write(`${failure}\n`);
      process.exit(1);
    }
  }

  if (asJson) {
    process.stdout.write(
      JSON.stringify(
        {
          drifts,
          unresolved,
          written: write,
          declared: declared ? { offset, path: offsetPath, fromLine } : null,
        },
        null,
        2,
      ) + "\n",
    );
  } else {
    for (const d of drifts.sort((a, b) => a.source.localeCompare(b.source) || a.from - b.from)) {
      const where = d.toPath === d.path ? `${d.path}:${d.to}` : `${d.toPath}:${d.to}`;
      const moved = d.toPath !== d.path;
      const suffix = write && !moved ? ` (written) [delta ${d.delta >= 0 ? "+" : ""}${d.delta}]` : write ? " (written)" : "";
      process.stdout.write(`${d.source}: ${d.path}:${d.from}#${d.symbol} -> ${where}${suffix}\n`);
    }
    for (const u of unresolved) process.stderr.write(`unresolved: ${u}\n`);
    printHints(stale);
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

/** Resolve a symbol that left its recorded file, reporting whatever stopped a
 *  unique answer. Returns null when nothing was resolved. */
function resolveMovedAnchor(
  path: string,
  symbol: string,
  unresolved: string[],
  source: string,
  recorded: number,
): { path: string; line: number } | null {
  const root = sourceRoot(path);
  if (root === null) {
    unresolved.push(
      `${relative(ROOT, source)}: ${path} has no code line with '${symbol}' and no source root to search`,
    );
    return null;
  }
  const moved = resolveAnchorInRoot(filesUnder(root), path, symbol);
  if (moved.ambiguity === "files") {
    unresolved.push(
      `${relative(ROOT, source)}: ${path}:${recorded}#${symbol} is ambiguous across files (${moved.ambiguous.length} candidates: ${moved.ambiguous.join(", ")})`,
    );
    return null;
  }
  if (moved.ambiguity === "lines") {
    unresolved.push(
      `${relative(ROOT, source)}: ${path}:${recorded}#${symbol} is ambiguous in ${moved.carrier} (${moved.ambiguous.length} candidate lines: ${moved.ambiguous.join(", ")}); repoint the line by hand`,
    );
    return null;
  }
  if (moved.path === null || moved.line === null) {
    unresolved.push(
      `${relative(ROOT, source)}: ${path} has no code line with '${symbol}' in ${root}`,
    );
    return null;
  }
  return { path: moved.path, line: moved.line };
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
}
