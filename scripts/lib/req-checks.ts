// Shared REQ integrity checks. Consumed by validate.ts (spec gate).

const REQ_TOKEN_RE = /\bREQ-(\d{3,}[a-z0-9]*)\b/g;
const VALID_ID_RE = /^REQ-\d{3}(?:[a-z]\d*)?$/;

export function checkReqIdGrammar(text: string): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(REQ_TOKEN_RE)) {
    const token = m[0];
    if (seen.has(token)) continue;
    seen.add(token);
    if (!VALID_ID_RE.test(token)) {
      issues.push(`malformed REQ ID: ${token} (expected REQ-NNN or REQ-NNNl / REQ-NNNlN)`);
    }
  }
  return issues;
}

const REQ_HEADER_RE = /\*\*(REQ-\d{3}[a-z0-9]*)\s+—\s+.+?\.\*\*/g;

export function checkEmptyReqBodies(text: string): string[] {
  const issues: string[] = [];
  const terminatorRe = /\*\*REQ-\d{3}[a-z0-9]*\s+—|^#{1,4}\s+|^---\s*$/gm;
  for (const h of text.matchAll(REQ_HEADER_RE)) {
    const bodyStart = (h.index ?? 0) + h[0].length;
    terminatorRe.lastIndex = bodyStart;
    const t = terminatorRe.exec(text);
    const body = t ? text.slice(bodyStart, t.index) : text.slice(bodyStart);
    if (body.trim().length === 0) {
      issues.push(`${h[1]}: empty body — no content between header and next REQ/heading`);
    }
  }
  return issues;
}

export function checkTruncatedReqBodies(text: string): string[] {
  const issues: string[] = [];
  const terminatorRe = /\*\*REQ-\d{3}[a-z0-9]*\s+—|^#{1,4}\s+|^---\s*$/gm;
  for (const h of text.matchAll(REQ_HEADER_RE)) {
    const bodyStart = (h.index ?? 0) + h[0].length;
    terminatorRe.lastIndex = bodyStart;
    const t = terminatorRe.exec(text);
    const body = t ? text.slice(bodyStart, t.index) : text.slice(bodyStart);
    if (/^[a-z]/.test(body.trim())) {
      issues.push(`${h[1]}: body begins with a lowercase letter — truncated lead clause`);
    }
  }
  return issues;
}
