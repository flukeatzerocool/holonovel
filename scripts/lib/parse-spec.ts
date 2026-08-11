import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
    const slice = text.slice(boundaries[i].start);
    terminatorRe.lastIndex = 0;
    const tm = terminatorRe.exec(slice);
    boundaries[i].end = tm ? boundaries[i].start + tm.index : text.length;
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
