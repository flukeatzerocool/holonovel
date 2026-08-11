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

export function extractReqBodies(text: string): Map<string, { id: string; body: string }> {
  const reqs = new Map<string, { id: string; body: string }>();
  const re = /\*\*(REQ-\d{3}[a-z]?\s+—\s+.+?)\.\*\*/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const reqId = match[1].match(/^(REQ-\d{3}[a-z]?)/)![1];
    const bodyStart = match.index + match[0].length;
    const rest = text.slice(bodyStart);
    const endMatch = rest.match(/\*\*REQ-\d{3}[a-z]?\s+—|^#{1,4}\s+/m);
    const body = endMatch ? rest.slice(0, endMatch.index!) : rest;
    reqs.set(reqId, { id: reqId, body });
  }
  return reqs;
}

export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\n/g, " ");
  const parts = normalized.split(/(?<=[.!?])\s+(?=[A-Z])/);
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
  const re = /\*\*(REQ-\d{3}[a-z]?\s+—\s+.+?)\.\*\*/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const reqId = match[1].match(/^(REQ-\d{3}[a-z]?)/)![1];
    const bodyStart = match.index + match[0].length;
    const rest = text.slice(bodyStart);
    const endMatch = rest.match(/\*\*REQ-\d{3}[a-z]?\s+—|^#{1,4}\s+/m);
    const body = endMatch ? rest.slice(0, endMatch.index!) : rest;
    const paragraphCount = body.split(/\n\n+/).filter((p) => p.trim().length > 0).length;
    reqs.set(reqId, { id: reqId, body, sentences: splitSentences(body), paragraphCount });
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
