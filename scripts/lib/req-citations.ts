// req-citations.ts — REQ citation expansion shared by validate and compare.
//
// Source comments cite REQs in shorthand (`REQ-567/568`, `REQ-570–572`) as
// well as one-per-token form. Expansion is deterministic: each chain yields
// the concrete REQ IDs it names, and en-dash spans expand inclusively.

const CITE_CHAIN_RE = /\bREQ-\d{3}(?:[–]\d{3}|[a-z0-9]+)?(?:\s*\/\s*\d{3}(?:[–]\d{3}|[a-z0-9]+)?)*/g;
const CITE_RANGE_RE = /^(?:REQ-)?(\d{3})[–](\d{3})$/;
const CITE_SEGMENT_RE = /^(?:REQ-)?(\d{3})([a-z0-9]*)$/;

function expandSegment(segment: string): string[] {
  const range = segment.match(CITE_RANGE_RE);
  if (range) {
    const start = Number(range[1]);
    const end = Number(range[2]);
    if (start <= end) {
      const out: string[] = [];
      for (let n = start; n <= end; n++) out.push(`REQ-${String(n).padStart(3, "0")}`);
      return out;
    }
  }
  const single = segment.match(CITE_SEGMENT_RE);
  return single ? [`REQ-${single[1]}${single[2]}`] : [];
}

export function expandReqCitations(text: string): string[] {
  const out: string[] = [];
  for (const chain of text.matchAll(CITE_CHAIN_RE)) {
    for (const raw of chain[0].split("/")) {
      out.push(...expandSegment(raw.trim()));
    }
  }
  return out;
}
