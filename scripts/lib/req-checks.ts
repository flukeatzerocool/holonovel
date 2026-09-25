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

export function checkDecisionsCitations(text: string): string[] {
  const issues: string[] = [];
  const terminatorRe = /\*\*REQ-\d{3}[a-z0-9]*\s+—|^#{1,4}\s+|^---\s*$/gm;
  for (const h of text.matchAll(REQ_HEADER_RE)) {
    const bodyStart = (h.index ?? 0) + h[0].length;
    terminatorRe.lastIndex = bodyStart;
    const t = terminatorRe.exec(text);
    const body = t ? text.slice(bodyStart, t.index) : text.slice(bodyStart);
    const citeRe = /DECISIONS\.md \((\d+)\)/g;
    let c: RegExpExecArray | null;
    while ((c = citeRe.exec(body)) !== null) {
      const n = parseInt(c[1], 10);
      if (n < 1 || n > 6) {
        issues.push(`${h[1]}: DECISIONS.md section (${n}) is undefined — §9 enumerates sections (1)–(6)`);
      }
    }
  }
  return issues;
}

// A statement of how many property groups the Novel has can drift as the §7.7
// table grows. Parse the table as the single source of truth and flag any
// numeric statement that disagrees with it.
const NUMBER_WORDS =
  "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|" +
  "fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|" +
  "fifty|sixty|seventy|eighty|ninety|hundred";
const PROPERTY_COUNT_RE = new RegExp(
  `(?<![\\w.])(${NUMBER_WORDS}|\\d+)(?:[\\s-](?:${NUMBER_WORDS}))?\\s+(?:total\\s+)?property groups\\b`,
  "gi",
);

const ONES: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
const TEENS: Record<string, number> = { ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

function parseCount(token: string): number | null {
  if (/^\d+$/.test(token)) return parseInt(token, 10);
  const parts = token.toLowerCase().split(/[-\s]+/);
  if (parts.length === 1) return ONES[parts[0]] ?? TEENS[parts[0]] ?? TENS[parts[0]] ?? (parts[0] === "hundred" ? 100 : null);
  if (parts.length === 2 && TENS[parts[0]] !== undefined && ONES[parts[1]] !== undefined) return TENS[parts[0]] + ONES[parts[1]];
  return null;
}

// Count the rows of the §7.7 property table (header carries `Property` and `Archetypes`).
export function actualPropertyGroupCount(text: string): number {
  const lines = text.split("\n");
  const headerIdx = lines.findIndex((l) => l.includes("| Property |") && l.includes("Archetypes"));
  if (headerIdx === -1) return 0;
  let count = 0;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("|")) break;
    if (/^\|\s*-+/.test(line)) continue;
    const name = line.split("|").map((s) => s.trim()).filter(Boolean)[0];
    if (name) count++;
  }
  return count;
}

export function checkPropertyGroupCount(text: string): string[] {
  const issues: string[] = [];
  const actual = actualPropertyGroupCount(text);
  if (actual === 0) return issues;
  for (const line of text.split("\n")) {
    for (const m of line.matchAll(PROPERTY_COUNT_RE)) {
      const n = parseCount(m[1]);
      if (n !== null && n !== actual) {
        issues.push(`stated "${m[0]}" but the §7.7 table defines ${actual} property groups`);
      }
    }
  }
  return issues;
}

// The build-phase-map file-index row declares an §5 subsection count. Compare it
// to the actual `### 5.N` headings so the declaration cannot drift.
export function checkBuildPhaseMapCounts(mapText: string, specText: string): string[] {
  const issues: string[] = [];
  const row = mapText.split("\n").find((l) => l.includes("02-requirements.md"));
  if (!row) return issues;
  const m = row.match(/(\d+)\s+subsections/);
  if (!m) return issues;
  const declared = parseInt(m[1], 10);
  const actual = (specText.match(/^### 5\.\d+\b/gm) ?? []).length;
  if (declared !== actual) {
    issues.push(`build-phase-map declares ${declared} §5 subsections but the spec has ${actual}`);
  }
  return issues;
}
