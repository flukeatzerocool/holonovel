// script-quality.ts — pure detectors for the Script quality standards.
//
// Shared by `check-script-quality.ts` (the gate) and `test-script-tooling.ts`
// (the regression self-test). Holds the C2 duplicate-helper scanner, the C4
// REQ-header-shape predicate, and the bounded function-body extractor the
// duplicate scanner uses. No filesystem access; callers pass content in.

import { tokenize, jaccard } from "./similarity.js";

// ─── C2 duplicate-helper ───────────────────────────────────────────────────

export interface HelperDef {
  file: string;
  name: string;
  body: string;
}

export interface HelperPair {
  name: string;
  a: HelperDef;
  b: HelperDef;
  sim: number;
}

// Helpers whose name is shared for ordinary reasons; excluded from C2.
const COMMON_HELPER_NAMES = new Set([
  "main", "test", "run", "send", "attach", "boot", "call", "kill", "assert",
  "assertContains", "assertNotContains", "sleep", "usage", "record", "hash",
  "readFile", "writeFile",
]);

// TypeScript 7 ships no JS compiler API, so function bodies are recovered with
// a bounded brace scanner. C2 is a near-duplicate heuristic, so the
// approximation is acceptable.
export function extractBracedBody(text: string, openIdx: number): string {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.slice(openIdx, i + 1);
    }
  }
  return text.slice(openIdx);
}

export function topLevelHelpers(text: string, relPath: string): HelperDef[] {
  const out: HelperDef[] = [];
  const fnRe = /(?:^|\n)[ \t]*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;
  for (const m of text.matchAll(fnRe)) {
    const brace = text.indexOf("{", m.index + m[0].length);
    if (brace !== -1) out.push({ file: relPath, name: m[1], body: extractBracedBody(text, brace) });
  }
  const varRe = /(?:^|\n)[ \t]*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g;
  for (const m of text.matchAll(varRe)) {
    const after = m.index + m[0].length;
    const brace = text.indexOf("{", after);
    const semi = text.indexOf(";", after);
    const nl = text.indexOf("\n", after);
    if (brace !== -1 && (semi === -1 || brace < semi) && (nl === -1 || brace < nl)) {
      out.push({ file: relPath, name: m[1], body: extractBracedBody(text, brace) });
    } else {
      const end = [semi, nl].filter((x) => x !== -1).sort((a, b) => a - b)[0] ?? text.length;
      out.push({ file: relPath, name: m[1], body: text.slice(after, end) });
    }
  }
  return out;
}

// Same-named top-level helpers across different files whose token sets are at
// least 0.85 Jaccard-similar. Pairs, not findings — the gate applies baseline
// dispositions and builds the message.
export function duplicateHelperPairs(defs: HelperDef[]): HelperPair[] {
  const byName = new Map<string, HelperDef[]>();
  for (const d of defs) {
    if (COMMON_HELPER_NAMES.has(d.name)) continue;
    if (!byName.has(d.name)) byName.set(d.name, []);
    byName.get(d.name)!.push(d);
  }
  const out: HelperPair[] = [];
  const seen = new Set<string>();
  for (const [name, group] of byName) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b = group[j];
        if (a.file === b.file) continue;
        const ta = tokenize(a.body, { minLen: 3 });
        const tb = tokenize(b.body, { minLen: 3 });
        if (ta.size < 15 || tb.size < 15) continue;
        const sim = jaccard(ta, tb);
        if (sim < 0.85) continue;
        const key = `${name}:${[a.file, b.file].sort().join("|")}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ name, a, b, sim });
      }
    }
  }
  return out;
}

// ─── C4 shared-parser-bypass ───────────────────────────────────────────────

// A REQ-header-shape regex literal: escaped `**`, a REQ id, and an em dash.
// Bare citation scans (`\bREQ-\d…\b`) and table-row detectors are not parser
// bypasses and are deliberately not matched.
export function isReqHeaderRegex(re: string): boolean {
  return re.includes("\\*\\*") && re.includes("REQ-") && re.includes("\u2014");
}
