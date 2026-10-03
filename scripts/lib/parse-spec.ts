// parse-spec.ts — shared spec parsers.
//
// readSpec, REQ-boundary extraction, heading extraction, and sentence
// splitting shared by validate.ts and the analysis scripts.
import * as fs from "node:fs";
import * as path from "node:path";

const __dirname = import.meta.dirname;
const DEFAULT_SPEC = path.resolve(__dirname, "..", "..", "holonovel.md");

export function readSpec(specPath?: string): string {
  const target = specPath || DEFAULT_SPEC;
  if (!fs.existsSync(target)) {
    throw new Error(`${target} not found`);
  }
  return fs.readFileSync(target, "utf-8");
}

const REQ_HEADER_RE = /\*\*(REQ-\d{3}[a-z0-9]*\s+—\s+.+?)\.\*\*/g;

function findReqBoundaries(text: string): { id: string; start: number; end: number }[] {
  const boundaries: { id: string; start: number; end: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = REQ_HEADER_RE.exec(text)) !== null) {
    boundaries.push({ id: match[1].match(/^(REQ-\d{3}[a-z0-9]*)/)![1], start: match.index + match[0].length, end: -1 });
  }
  const terminatorRe = /\*\*REQ-\d{3}[a-z0-9]*\s+—|^#{1,4}\s+/gm;
  for (let i = 0; i < boundaries.length; i++) {
    terminatorRe.lastIndex = boundaries[i].start;
    const tm = terminatorRe.exec(text);
    boundaries[i].end = tm ? tm.index : text.length;
  }
  return boundaries;
}

export function extractReqBodies(text: string): Map<string, { id: string; body: string }> {
  const reqs = new Map<string, { id: string; body: string }>();
  for (const b of findReqBoundaries(text)) {
    reqs.set(b.id, { id: b.id, body: text.slice(b.start, b.end) });
  }
  return reqs;
}

export interface ReqHeader {
  id: string;
  title: string;
}

// REQ header id + title, in document order. Callers that need the numeric id
// alone or a definition set use this instead of re-deriving the header regex.
export function extractReqHeaders(text: string): ReqHeader[] {
  const out: ReqHeader[] = [];
  const re = new RegExp(REQ_HEADER_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const id = match[1].match(/^(REQ-\d{3}[a-z0-9]*)/)![1];
    out.push({ id, title: match[1].slice(id.length).replace(/^\s*—\s*/, "").trim() });
  }
  return out;
}

// REQ id, title, and parsed body in one pass — the shape the analysis scripts
// (fmea, coverage tooling) build for each REQ.
export function extractReqEntries(text: string): Map<string, { id: string; title: string; body: string }> {
  const entries = new Map<string, { id: string; title: string; body: string }>();
  const titleById = new Map(extractReqHeaders(text).map((h) => [h.id, h.title]));
  for (const b of findReqBoundaries(text)) {
    entries.set(b.id, { id: b.id, title: titleById.get(b.id) ?? "", body: text.slice(b.start, b.end) });
  }
  return entries;
}

// Whitespace-normalized REQ body: the shared boundary parser captures the full
// body (including `*Acceptance criterion:*` and `_Check:_` clauses), so body
// comparison must collapse line-wrapping differences before diffing (REQ-419).
export function normalizeReqBody(body: string): string {
  return body.replace(/\s+/g, " ").trim();
}

// REQ IDs whose body differs between two spec revisions. The boundary parser is
// robust to the `*Acceptance criterion:*` emphasis that defeats an `[^*]+?`
// body regex (REQ-419: a REQ-body edit SHALL NOT classify as patch).
export function changedReqBodies(current: string, stored: string): string[] {
  const currentBodies = extractReqBodies(current);
  const storedBodies = extractReqBodies(stored);
  const changed: string[] = [];
  for (const [id, entry] of currentBodies) {
    const prev = storedBodies.get(id);
    if (prev !== undefined && normalizeReqBody(prev.body) !== normalizeReqBody(entry.body)) {
      changed.push(id.replace(/^REQ-/, ""));
    }
  }
  return changed;
}

export function extractH2Headings(text: string): string[] {
  const headings: string[] = [];
  let inFence = false;
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t.startsWith("```")) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = line.match(/^##\s+(.+)/);
    if (m) headings.push(m[1]);
  }
  return headings;
}

export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\n/g, " ");
  const parts: string[] = [];
  let lastIdx = 0;
  for (let i = 0; i < normalized.length; i++) {
    if (".?!".includes(normalized[i]) && i + 2 < normalized.length && normalized[i + 1] === " " && /[A-Z]/.test(normalized[i + 2])) {
      parts.push(normalized.slice(lastIdx, i + 1));
      lastIdx = i + 2;
    }
  }
  if (lastIdx < normalized.length) parts.push(normalized.slice(lastIdx));
  return parts.filter((s) => s.trim().length > 0);
}

export interface ActionBinding {
  reqId: string;
  tool: string;
  action: string;
  params: string[];
}

// Matches `tool (action: name[/name2], param, param?)` bindings in REQ bodies.
// The parameter tail stops at the first `)`, so values containing nested
// parentheses are parsed heuristically — acceptable because the tail is only
// scanned for identifier-shaped parameter names.
const ACTION_BINDING_RE = /\b([a-z][a-z0-9_]*) \(action: ([a-z][a-z0-9_]*(?:\/[a-z][a-z0-9_]*)*)([^)]*)\)/g;

// A parameter token is an identifier with an optional `?` and optional
// `=literal` value. Positional arguments (quoted strings, numbers, arrays)
// yield null and are ignored.
function parseParamToken(tok: string): string | null {
  const match = tok.trim().match(/^([a-z][a-z0-9_]*)\??(?:=.*)?$/);
  return match ? match[1] : null;
}

// Extracts every `tool (action: …, params…)` binding from REQ bodies. An
// action list (`import_supplementary/remove_supplementary`) yields one entry
// per action, each carrying the same parameter set.
export function extractActionBindings(text: string): ActionBinding[] {
  const bindings: ActionBinding[] = [];
  for (const [reqId, entry] of extractReqBodies(text)) {
    // Scan only the normative body — acceptance-criterion calls are
    // illustrative examples, not contract definitions.
    const acIdx = entry.body.indexOf("*Acceptance criterion:*");
    const body = acIdx >= 0 ? entry.body.slice(0, acIdx) : entry.body;
    const re = new RegExp(ACTION_BINDING_RE.source, "g");
    let match: RegExpExecArray | null;
    while ((match = re.exec(body)) !== null) {
      const params = match[3]
        .split(",")
        .map(parseParamToken)
        .filter((p): p is string => p !== null);
      for (const action of match[2].split("/")) {
        bindings.push({ reqId, tool: match[1], action, params });
      }
    }
  }
  return bindings;
}

export interface ReqBodyEntry {
  id: string;
  body: string;
  sentences: string[];
  paragraphCount: number;
}

export function extractReqBodiesWithSentences(text: string): Map<string, ReqBodyEntry> {
  const reqs = new Map<string, ReqBodyEntry>();
  for (const b of findReqBoundaries(text)) {
    let body = text.slice(b.start, b.end);
    const hrIdx = body.indexOf('\n---\n');
    if (hrIdx >= 0) body = body.slice(0, hrIdx).trimEnd();
    const paragraphCount = body.split(/\n\n+/).filter((p) => p.trim().length > 0).length;
    const acIdx = body.indexOf('*Acceptance criterion:*');
    const normativeBody = acIdx >= 0 ? body.slice(0, acIdx).trimEnd() : body;
    reqs.set(b.id, { id: b.id, body: normativeBody, sentences: splitSentences(normativeBody), paragraphCount });
  }
  return reqs;
}

export interface ProseParagraph {
  section: string;
  paragraph: string;
  line: number;
}

export function extractNarrativeProse(text: string): ProseParagraph[] {
  const startIdx = text.indexOf("### How to read this specification");
  const endIdx = text.indexOf("## 5. Requirements");
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) return [];
  const startLine = text.slice(0, startIdx).split("\n").length;
  const lines = text.slice(startIdx, endIdx).split("\n");

  const paragraphs: ProseParagraph[] = [];
  let section = "How to read this specification";
  let buf: string[] = [];
  let bufLine = 0;
  let inFence = false;

  const flush = () => {
    const p = buf.join(" ").replace(/\s+/g, " ").trim();
    if (p.length === 0) return;
    paragraphs.push({ section, paragraph: p, line: bufLine });
    buf = [];
  };

  lines.forEach((raw, i) => {
    const t = raw.trim();
    if (inFence) {
      if (t.startsWith("```")) inFence = false;
      return;
    }
    if (t.startsWith("```")) { flush(); inFence = true; return; }
    if (/^\s/.test(raw)) { flush(); return; }
    if (/^#{1,6}\s+/.test(t)) { flush(); section = t.replace(/^#+\s*/, "").trim(); return; }
    if (t === "") { flush(); return; }
    if (t.startsWith("|")) { flush(); return; }
    if (t.startsWith(">")) { flush(); return; }
    if (/^-{3,}\s*$/.test(t)) { flush(); return; }
    if (/^\d{1,2}\.\s+/.test(t)) { flush(); return; }
    if (/^[-*]\s+/.test(t)) { flush(); return; }
    if (/^\*\*.+\*\*\s*$/.test(t)) { flush(); return; }
    if (buf.length === 0) bufLine = startLine + i;
    buf.push(t);
  });
  flush();
  return paragraphs;
}

export function extractReferenceProse(text: string): ProseParagraph[] {
  const narrativeStart = text.indexOf("### How to read this specification");
  const narrativeEnd = text.indexOf("## 5. Requirements");
  const reqRanges = findReqBoundaries(text).map((b) => [b.start, b.end] as [number, number]);
  const inReq = (off: number) => reqRanges.some(([s, e]) => off >= s && off < e);

  const lines = text.split("\n");
  const paragraphs: ProseParagraph[] = [];
  let section = "";
  let buf: string[] = [];
  let bufLine = 0;
  let inFence = false;
  let offset = 0;

  const flush = () => {
    const p = buf.join(" ").replace(/\s+/g, " ").trim();
    if (p.length === 0) return;
    paragraphs.push({ section, paragraph: p, line: bufLine });
    buf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const lineOffset = offset;
    offset += raw.length + 1;
    const t = raw.trim();
    // Skip the §0–§4 narrative range — extractNarrativeProse already scores it.
    if (narrativeStart >= 0 && narrativeEnd > narrativeStart && lineOffset >= narrativeStart && lineOffset < narrativeEnd) {
      flush();
      continue;
    }
    if (inFence) { if (t.startsWith("```")) inFence = false; continue; }
    if (t.startsWith("```")) { flush(); inFence = true; continue; }
    // Skip REQ bodies (scored per-REQ) and their check trailers.
    if (inReq(lineOffset) || inReq(lineOffset + raw.length)) { flush(); continue; }
    if (/^[*_]Check:[*_]/.test(t) || /^[*_]Verify:[*_]/.test(t)) { flush(); continue; }
    if (/^\s/.test(raw)) { flush(); continue; }
    if (/^#{1,6}\s+/.test(t)) { flush(); section = t.replace(/^#+\s*/, "").trim(); continue; }
    if (t === "") { flush(); continue; }
    if (t.startsWith("|")) { flush(); continue; }
    if (t.startsWith(">")) { flush(); continue; }
    if (/^-{3,}\s*$/.test(t)) { flush(); continue; }
    if (/^\d{1,2}\.\s+/.test(t)) { flush(); continue; }
    if (/^[-*]\s+/.test(t)) { flush(); continue; }
    if (/^\*\*.+\*\*\s*$/.test(t)) { flush(); continue; }
    if (buf.length === 0) bufLine = i + 1;
    buf.push(t);
  }
  flush();
  return paragraphs;
}

export interface TerminologyEntry {
  term: string;
  canonical: string;
}

export function extractTerminology(text: string): TerminologyEntry[] {
  const entries: TerminologyEntry[] = [];
  const startIdx = text.indexOf("## 4. Standing Rules and Terminology");
  if (startIdx < 0) return entries;
  const slice = text.slice(startIdx);
  const tableStart = slice.indexOf("| Term");
  if (tableStart < 0) return entries;
  const tableSlice = slice.slice(tableStart);
  const tableEnd = tableSlice.indexOf("\n\n");
  const table = tableEnd > 0 ? tableSlice.slice(0, tableEnd) : tableSlice;
  for (const line of table.split("\n")) {
    const m = line.match(/^\|\s*(`?)([^|`]+?)\1?\s*\|/);
    if (m && !/^[-|\s]+$/.test(m[2]) && m[2].trim() !== "Term") {
      const term = m[2].trim();
      entries.push({ term, canonical: term });
    }
  }
  return entries;
}
