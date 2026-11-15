// anchor-resolver.ts — pure line resolution for `path:line#symbol` anchors.
//
// Shared by `scripts/refresh-predicates.ts` and its self-test. An anchor names a
// symbol and the line it was recorded on; code movement makes the number stale.
// A symbol found on several lines is only trusted when one candidate lies within
// the window of the recorded line — otherwise the anchor is ambiguous and the
// caller must refuse rather than guess.

export const ANCHOR_WINDOW = 40;

export interface AnchorResolution {
  line: number | null;
  ambiguous: number[];
}

function isCodeLine(trimmed: string): boolean {
  if (trimmed.length === 0) return false;
  if (/^[)}\];,]+$/.test(trimmed)) return false;
  if (/^(\/\/|\/\*|\*)/.test(trimmed)) return false;
  return true;
}

export function resolveAnchorLine(lines: readonly string[], recorded: number, symbol: string): AnchorResolution {
  const token = new RegExp(`\\b${symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  const candidates: number[] = [];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!isCodeLine(trimmed)) return;
    if (token.test(trimmed)) candidates.push(index + 1);
  });
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
