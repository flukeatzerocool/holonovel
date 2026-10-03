// similarity.ts — shared tokenization and Jaccard similarity.
//
// One implementation for the callers that previously duplicated it
// (detect-near-dupes, tool-definitions-heuristics, compare-spec-code,
// validate-readme). Tokenization lowercases, replaces non-alphanumerics
// with spaces, drops tokens shorter than `minLen`, and drops stop words.

export const DEFAULT_STOP_WORDS: ReadonlySet<string> = new Set([
  "the", "is", "a", "an", "in", "of", "to", "for", "and", "or",
  "on", "at", "by", "with", "from", "as", "it", "its", "be", "not",
  "this", "that", "are", "was", "were", "been", "has", "have", "had",
  "will", "would", "can", "could", "may", "might", "shall", "should",
]);

export function tokenize(
  text: string,
  opts: { minLen?: number; stop?: ReadonlySet<string> } = {},
): Set<string> {
  const minLen = opts.minLen ?? 2;
  const stop = opts.stop ?? DEFAULT_STOP_WORDS;
  const out = new Set<string>();
  for (const raw of text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)) {
    if (raw.length >= minLen && !stop.has(raw)) out.add(raw);
  }
  return out;
}

export function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const w of a) if (b.has(w)) intersection++;
  return intersection / (a.size + b.size - intersection);
}
