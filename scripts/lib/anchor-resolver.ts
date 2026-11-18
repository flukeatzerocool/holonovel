// anchor-resolver.ts — pure line resolution for `path:line#symbol` anchors.
//
// Shared by `scripts/refresh-predicates.ts` and its self-test. An anchor names a
// symbol and the line it was recorded on; code movement makes the number stale.
// A symbol found on several lines is only trusted when one candidate lies within
// the window of the recorded line — otherwise the anchor is ambiguous and the
// caller must refuse rather than guess.
//
// `resolveAnchorInRoot` is the `--repath` fallback: when the recorded file no
// longer carries the symbol at all, the anchor may have moved to another file in
// the same source root. It accepts a move only when exactly one other file in
// that root carries the symbol on a code line, so a name that also appears in a
// sibling harness file resolves to nothing rather than to a guess.

export const ANCHOR_WINDOW = 40;

export interface AnchorResolution {
  line: number | null;
  ambiguous: number[];
}

/** A move resolution inside one source root. `ambiguous` lists the candidate
 *  paths, sorted, when more than one file carries the symbol. */
export interface RepathResolution {
  path: string | null;
  line: number | null;
  ambiguous: string[];
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

/** Every code line (1-based) carrying `symbol` as a whole word. */
export function candidateLines(lines: readonly string[], symbol: string): number[] {
  const token = symbolToken(symbol);
  const out: number[] = [];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!isCodeLine(trimmed)) return;
    if (token.test(trimmed)) out.push(index + 1);
  });
  return out;
}

export function resolveAnchorLine(lines: readonly string[], recorded: number, symbol: string): AnchorResolution {
  const candidates = candidateLines(lines, symbol);
  if (candidates.length === 0) return { line: null, ambiguous: [] };
  const near = candidates.filter((n) => Math.abs(n - recorded) <= ANCHOR_WINDOW);
  if (near.length > 0) {
    return {
      line: near.reduce((best, n) => (Math.abs(n - recorded) < Math.abs(best - recorded) ? n : best), near[0]!),
      ambiguous: [],
    };
  }
  if (candidates.length === 1) return { line: candidates[0]!, ambiguous: [] };
  return { line: null, ambiguous: candidates };
}

/** The files in `files` (excluding `recordedPath`) whose code lines carry
 *  `symbol`, sorted for determinism. */
export function anchorCarriers(
  files: ReadonlyMap<string, readonly string[]>,
  recordedPath: string,
  symbol: string,
): string[] {
  const token = symbolToken(symbol);
  const carriers: string[] = [];
  for (const [path, lines] of files) {
    if (path === recordedPath) continue;
    const carries = lines.some((line) => {
      const trimmed = line.trim();
      return isCodeLine(trimmed) && token.test(trimmed);
    });
    if (carries) carriers.push(path);
  }
  return carriers.sort();
}

/**
 * Resolve a moved anchor inside one source root.
 *
 * - no other carrier → `{ path: null, line: null, ambiguous: [] }` (unresolved);
 * - more than one carrier → `{ path: null, line: null, ambiguous: [paths] }`;
 * - exactly one carrier → the path, and the line nearest the recorded one inside
 *   the ±40 window, falling back to the file's first carrying code line. The
 *   anchor's contract is "this line carries this symbol", so a carrying line is
 *   a valid locator; the caller reports it for review.
 */
export function resolveAnchorInRoot(
  files: ReadonlyMap<string, readonly string[]>,
  recordedPath: string,
  recorded: number,
  symbol: string,
): RepathResolution {
  const carriers = anchorCarriers(files, recordedPath, symbol);
  if (carriers.length === 0) return { path: null, line: null, ambiguous: [] };
  if (carriers.length > 1) return { path: null, line: null, ambiguous: carriers };
  const path = carriers[0]!;
  const lines = files.get(path) ?? [];
  const nearest = resolveAnchorLine(lines, recorded, symbol);
  const line = nearest.line ?? candidateLines(lines, symbol)[0] ?? null;
  if (line === null) return { path: null, line: null, ambiguous: [] };
  return { path, line, ambiguous: [] };
}
