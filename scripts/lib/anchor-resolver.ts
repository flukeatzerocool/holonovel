// anchor-resolver.ts — pure line resolution for `path:line#symbol` anchors.
//
// Shared by `scripts/refresh-predicates.ts` and its self-test. An anchor names a
// symbol and the line it was recorded on; code movement makes the number stale.
// Resolution is by identity, never by proximity: a line carries the symbol only
// when it is a code line holding the symbol as a whole word, and an anchor is
// repaired only to a line that carries it. A symbol found on several lines gives
// no basis for choosing between them — the anchor is ambiguous and the caller
// must refuse rather than guess, because a nearby wrong occurrence of a common
// name is indistinguishable from the intended one by line number alone.
//
// `resolveAnchorInRoot` is the `--repath` fallback: when the recorded file no
// longer carries the symbol at all, the anchor may have moved to another file in
// the same source root. It accepts a move only when exactly one other file in
// that root carries the symbol, and only when that file carries it on exactly
// one code line; a caller that knows which line is meant declares it instead.

export interface AnchorResolution {
  line: number | null;
  ambiguous: number[];
}

/** How a repath failed to be unique: several carrier files, several candidate
 *  lines in the one carrier, or no carrier at all. */
export type RepathAmbiguity = "none" | "files" | "lines";

/** A move resolution inside one source root. `ambiguous` lists the candidate
 *  paths when `ambiguity` is `files`, and `path:line` entries when it is
 *  `lines`. */
export interface RepathResolution {
  path: string | null;
  line: number | null;
  ambiguous: string[];
  ambiguity: RepathAmbiguity;
  carrier: string | null;
}

function isCodeLine(trimmed: string): boolean {
  if (trimmed.length === 0) return false;
  if (/^[)}\];,]+$/.test(trimmed)) return false;
  if (/^(\/\/|\/\*|\*)/.test(trimmed)) return false;
  return true;
}

function symbolToken(symbol: string): RegExp {
  return new RegExp(`\\b${symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
}

/**
 * Whether `line` carries `symbol`: it must be a code line (not blank, not a
 * closers-only line, not a comment) and hold the symbol as a whole word. A
 * substring occurrence inside a longer identifier does not count, so `err` is
 * not carried by a line holding `error(`.
 */
export function lineCarriesSymbol(line: string, symbol: string): boolean {
  const trimmed = line.trim();
  return isCodeLine(trimmed) && symbolToken(symbol).test(trimmed);
}

/** Every code line (1-based) carrying `symbol` as a whole word. */
export function candidateLines(lines: readonly string[], symbol: string): number[] {
  const out: number[] = [];
  lines.forEach((line, index) => {
    if (lineCarriesSymbol(line, symbol)) out.push(index + 1);
  });
  return out;
}

/**
 * Resolve a symbol inside one file, with no reference to the recorded number.
 *
 * - one candidate line → that line;
 * - no candidate → `null` with an empty `ambiguous` list (the symbol is not in
 *   this file);
 * - several candidates → `null` with every candidate line listed. Proximity is
 *   not evidence: after a block move the nearest occurrence is routinely a
 *   different one, so the caller refuses and asks for a declaration.
 */
export function resolveAnchorSymbol(lines: readonly string[], symbol: string): AnchorResolution {
  const candidates = candidateLines(lines, symbol);
  if (candidates.length === 1) return { line: candidates[0]!, ambiguous: [] };
  if (candidates.length === 0) return { line: null, ambiguous: [] };
  return { line: null, ambiguous: candidates };
}

/** The files in `files` (excluding `recordedPath`) whose code lines carry
 *  `symbol`, sorted for determinism. */
export function anchorCarriers(
  files: ReadonlyMap<string, readonly string[]>,
  recordedPath: string,
  symbol: string,
): string[] {
  const carriers: string[] = [];
  for (const [path, lines] of files) {
    if (path === recordedPath) continue;
    if (lines.some((line) => lineCarriesSymbol(line, symbol))) carriers.push(path);
  }
  return carriers.sort();
}

/**
 * Resolve a moved anchor inside one source root.
 *
 * - no carrier → `{ path: null, line: null, ambiguous: [], ambiguity: "none" }`;
 * - more than one carrier → `ambiguous` lists the paths, `ambiguity: "files"`;
 * - exactly one carrier → that path, and its line only when the file carries the
 *   symbol on exactly one code line. Several candidate lines are reported as
 *   `path:line` entries with `ambiguity: "lines"`, because the recorded number
 *   belongs to the old file and cannot rank them.
 */
export function resolveAnchorInRoot(
  files: ReadonlyMap<string, readonly string[]>,
  recordedPath: string,
  symbol: string,
): RepathResolution {
  const carriers = anchorCarriers(files, recordedPath, symbol);
  if (carriers.length === 0) {
    return { path: null, line: null, ambiguous: [], ambiguity: "none", carrier: null };
  }
  if (carriers.length > 1) {
    return { path: null, line: null, ambiguous: carriers, ambiguity: "files", carrier: null };
  }
  const path = carriers[0]!;
  const lines = files.get(path) ?? [];
  const candidates = candidateLines(lines, symbol);
  if (candidates.length > 1) {
    return {
      path: null,
      line: null,
      ambiguous: candidates.map((line) => `${path}:${line}`),
      ambiguity: "lines",
      carrier: path,
    };
  }
  return { path, line: candidates[0] ?? null, ambiguous: [], ambiguity: "none", carrier: path };
}
