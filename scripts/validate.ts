#!/usr/bin/env npx tsx
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readSpec,
  extractReqBodiesWithSentences,
  extractTerminology,
  extractNarrativeProse,
  splitSentences,
  type ReqBodyEntry,
} from "./lib/parse-spec.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC = path.resolve(__dirname, "..", "holonovel.md");

const sddStrict = process.argv.includes("--sdd-strict");
const quick = process.argv.includes("--quick");
const traceability = process.argv.includes("--traceability");

// ─── Utilities ──────────────────────────────────────────────────────────

function stripMarkdownFormatting(raw: string): string {
  let s = raw;
  s = s.replace(/`([^`]+)`/g, "$1");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/_([^_]+)_/g, "$1");
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  return s.trim();
}

function parseColumnIndices(headerLine: string, requiredCols: string[]): Map<string, number> | string {
  const cols = headerLine.split("|").map((s) => s.trim()).filter((s) => s.length > 0);
  const map = new Map<string, number>();
  for (const name of requiredCols) {
    const idx = cols.indexOf(name);
    if (idx === -1) return `Column '${name}' not found in header: ${headerLine.trim()}`;
    map.set(name, idx);
  }
  return map;
}

// ─── REQ Index & Manifest ───────────────────────────────────────────────

function extractReqIndex(text: string): Map<string, string> {
  const reqs = new Map<string, string>();
  let inTable = false;
  let colMap: Map<string, number> | null = null;
  for (const line of text.split("\n")) {
    if (line.trim().startsWith("| REQ     | Title")) {
      inTable = true;
      const result = parseColumnIndices(line, ["REQ", "Title"]);
      if (typeof result === "string") { console.error(`ERROR: ${result}`); process.exit(1); }
      colMap = result;
      continue;
    }
    if (inTable) {
      if (line.trim().startsWith("| -------")) continue;
      const cells = line.split("|").map((s) => s.trim()).filter((_, i) => i > 0);
      if (colMap && cells.length >= Math.max(...colMap.values()) + 1) {
        const reqId = cells[colMap.get("REQ")!];
        const title = cells[colMap.get("Title")!];
        if (/^REQ-\d{3}[a-z0-9]*$/.test(reqId)) reqs.set(reqId, title);
      } else if (!line.trim().startsWith("|")) break;
    }
  }
  return reqs;
}

function extractTestIds(text: string): Set<string> {
  const tests = new Set<string>();
  let inTable = false;
  for (const line of text.split("\n")) {
    if (line.trim().startsWith("| #   | Test") || line.trim().startsWith("| #     | Type")) { inTable = true; continue; }
    if (inTable) {
      if (line.trim().startsWith("| ---")) continue;
      const m = line.match(/^\|\s*((?:T\d+[a-z0-9]*)(?:\s*,\s*(?:T\d+[a-z0-9]*))*)\s*\|/);
      if (m) { for (const tid of m[1].matchAll(/T\d+[a-z0-9]*/g)) tests.add(tid[0]); }
      else if (!line.trim().startsWith("| T")) break;
    }
  }
  return tests;
}

function extractHeadings(text: string): [number, string][] {
  const headings: [number, string][] = [];
  let inBlock = false;
  for (const line of text.split("\n")) {
    if (line.trim().startsWith("```")) { inBlock = !inBlock; continue; }
    if (inBlock) continue;
    const m = line.match(/^(#{1,4})\s+(.+)/);
    if (m) headings.push([m[1].length, stripMarkdownFormatting(m[2])]);
  }
  return headings;
}

function extractTocEntries(text: string): string[] {
  const entries: string[] = [];
  let inToc = false;
  for (const line of text.split("\n")) {
    if (line.trim() === "## Contents") { inToc = true; continue; }
    if (inToc) {
      if (line.trim().startsWith("##") && !line.trim().startsWith("###")) break;
      const m = line.match(/^\s*-\s*\[(.+?)\]\(/);
      if (m) entries.push(stripMarkdownFormatting(m[1]));
    }
  }
  return entries;
}

function findReqCitations(text: string): Set<string> {
  const appendixEStart = text.indexOf("## Appendix E:");
  const beforeApx = appendixEStart !== -1 ? text.slice(0, appendixEStart) : text;
  let afterApx = appendixEStart !== -1 ? text.slice(appendixEStart) : "";
  const manifestStart = afterApx.indexOf("| REQ     | Title");
  if (manifestStart !== -1) {
    const manifestEnd = afterApx.indexOf("\n\n", manifestStart);
    if (manifestEnd !== -1) afterApx = afterApx.slice(manifestEnd);
  }
  const combined = beforeApx + afterApx;
  return new Set(Array.from(combined.matchAll(/\b(REQ-\d{3}[a-z0-9]*)\b/g), (m) => m[1]));
}

function findTestCitations(text: string): Set<string> {
  const gatesStart = text.indexOf("## 8. Verification Gates");
  const gatesEnd = text.indexOf("## 9. Artifacts");
  let combined: string;
  if (gatesStart !== -1 && gatesEnd !== -1) combined = text.slice(0, gatesStart) + text.slice(gatesEnd);
  else combined = text;
  const aptStart = combined.indexOf("## Appendix F:");
  const aptEnd = combined.indexOf("\n##", aptStart + 1);
  if (aptStart !== -1) combined = combined.slice(0, aptStart) + (aptEnd !== -1 ? combined.slice(aptEnd) : "");
  return new Set(Array.from(combined.matchAll(/\b(T\d+[a-z0-9]*)\b/g), (m) => m[1]));
}

// ─── REQ Block Integrity ────────────────────────────────────────────────

function checkReqBlocks(text: string): string[] {
  const issues: string[] = [];
  const re = /\*\*(REQ-\d{3}\s+—\s+.+?)\.\*\*/g;
  const bodyText = text;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const reqId = match[1].split(/\s+/)[0];
    const bodyStart = match.index + match[0].length;
    const rest = bodyText.slice(bodyStart);
    const endMatch = rest.match(/\*\*REQ-\d{3}\s+—|^#{1,4}\s+/m);
    const body = endMatch ? rest.slice(0, endMatch.index!) : rest;
    if (!body.includes("*Check:*") && !body.includes("_Check:_")) {
      issues.push(`${reqId}: missing Check: trailer`);
    }
  }
  return issues;
}

// ─── Spec Violations ────────────────────────────────────────────────────

function checkSpecViolations(text: string): string[] {
  const issues: string[] = [];
  const re = /\*\*(REQ-\d{3}[a-z0-9]*\s+—\s+.+?)\.\*\*/g;
  const bodyText = text;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const reqId = match[1].match(/^(REQ-\d{3}[a-z0-9]*)/)![1];
    const bodyStart = match.index + match[0].length;
    const rest = bodyText.slice(bodyStart);
    const endMatch = rest.match(/\*\*REQ-\d{3}[a-z0-9]*\s+—|^#{1,4}\s+/m);
    const body = endMatch ? rest.slice(0, endMatch.index!) : rest;

    const limit = 800;
    if (body.length > limit) {
      issues.push(`${reqId}: body exceeds ${limit}-char limit (${body.length})`);
    }
    if (/\(string[,) ]|\(integer[,) ]|\(boolean[,) ]|\(float[,) ]|\(number[,) ]/.test(body)) {
      issues.push(`${reqId}: contains parameter type annotations`);
    }
    if (/Default:\s/.test(body)) {
      issues.push(`${reqId}: contains 'Default:' clause — defaults are builder's domain`);
    }
    if (/\bdefault\s+\d[\d,]*\s*(?:bytes|seconds|minutes|entries|items|MB|KB|ms)\b/i.test(body)) {
      issues.push(`${reqId}: contains bare default value with unit`);
    }

    const enumerated = body.match(/`[^`]+`(,\s*`[^`]+`)*/g);
    if (enumerated) {
      for (const list of enumerated) {
        const count = (list.match(/`/g) || []).length / 2;
        if (count > 5) { issues.push(`${reqId}: enumerated ${count} tokens — catalog-as-requirement`); break; }
      }
    }
  }

  const lifecycleMatches = text.match(/survives connection restarts|persists across connections and is discarded/g);
  if (lifecycleMatches && lifecycleMatches.length > 3) {
    issues.push(`lifecycle pattern appears ${lifecycleMatches.length} times — consider consolidating`);
  }
  return issues;
}

// ─── REQ Shape Checks (SDD Strict) ─────────────────────────────────────

function checkReqShape(reqs: Map<string, ReqBodyEntry>): string[] {
  const issues: string[] = [];

  for (const [reqId, entry] of reqs) {
    const body = entry.body;

    if (entry.paragraphCount > 1) {
      issues.push(`${reqId}: spans ${entry.paragraphCount} paragraphs — split into sub-REQs`);
    }

    const tableInBody = body.split("\n").some((l) => !l.trim().startsWith("```") && l.trim().startsWith("|") && l.trim().endsWith("|"));
    if (tableInBody) {
      issues.push(`${reqId}: contains markdown table — move to appendix or §6`);
    }

    const bulletInBody = body.split("\n").some((l) => /^\s*-\s/.test(l) && !l.startsWith("```"));
    if (bulletInBody) {
      issues.push(`${reqId}: contains bullet list — move enumeration to appendix`);
    }

    const numberedInBody = body.split("\n").some((l) => /^\s*\d+\.\s/.test(l) && !l.startsWith("```"));
    if (numberedInBody) {
      issues.push(`${reqId}: contains numbered steps — move procedure to §6`);
    }

    const shallCount = (body.match(/\bSHALL\b/g) || []).length;
    if (shallCount > 12) {
      issues.push(`${reqId}: ${shallCount} SHALL clauses — almost certainly multi-contract`);
    } else if (shallCount > 8) {
      issues.push(`${reqId}: ${shallCount} SHALL clauses — review for splitting`);
    }
  }

  return issues;
}

// ─── Ambiguity Scan (merged from scan-ambiguity.ts) ─────────────────────

interface Pattern {
  label: string;
  regex: RegExp;
}

function checkAmbiguity(reqBodies: Map<string, { id: string; body: string }>): string[] {
  const issues: string[] = [];

  const patterns: Pattern[] = [
    { label: "vague qualifier", regex: /\b(appropriate|suitable|reasonable|proper)(?:\s+level|\s+amount)?\b/gi },
    { label: "hedge word", regex: /\b(typically|generally|usually|normally|often)\b/gi },
    { label: "unbounded extension", regex: /\b(as needed|if necessary|when required)\b/gi },
    { label: "should (ambiguous obligation)", regex: /\bshould\b/gi },
    { label: "or equivalent", regex: /\bor equivalent\b/gi },
    { label: "sufficiently", regex: /\bsufficiently\b/gi },
  ];

  for (const [reqId, { body }] of reqBodies) {
    for (const { label, regex } of patterns) {
      for (const m of body.matchAll(new RegExp(regex.source, regex.flags))) {
        const ctx = body.slice(Math.max(0, (m.index ?? 0) - 30), (m.index ?? 0) + (m[0]?.length ?? 0) + 30).replace(/\n/g, " ");
        issues.push(`${reqId} — ${label}: "${m[0]}" …${ctx}…`);
      }
    }
  }
  return issues;
}

// ─── Cross-Reference Audit (merged from check-cross-refs.ts) ────────────

function parseManifest(text: string): Set<string> {
  const manifest = new Set<string>();
  const startIdx = text.indexOf("## Appendix E: Requirements Manifest");
  if (startIdx < 0) return manifest;
  const rest = text.slice(startIdx);
  const endMatch = rest.slice("## Appendix E: Requirements Manifest".length).match(/\n##\s/);
  const section = endMatch ? rest.slice(0, rest.indexOf(endMatch[0])) : rest;
  for (const line of section.split("\n")) {
    const m = line.match(/^\|\s*(REQ-\d{3}[a-z0-9]*)\b/);
    if (m) manifest.add(m[1]);
  }
  return manifest;
}

function sectionNameForReq(reqId: string, text: string): string {
  const sections = text.match(/^### (5\.\d+ .+)$/gm) || [];
  const reqIdx = text.indexOf(`**${reqId}`);
  if (reqIdx < 0) return "unknown";
  let nearest = "unknown";
  let minDist = Infinity;
  for (const sec of sections) {
    const idx = text.indexOf(sec);
    if (idx < reqIdx && reqIdx - idx < minDist) { minDist = reqIdx - idx; nearest = sec.replace(/^### /, ""); }
  }
  return nearest;
}

function checkCrossRefs(text: string): string[] {
  const issues: string[] = [];
  const manifest = parseManifest(text);
  const defRe = /\*\*(REQ-\d{3}[a-z0-9]*)\s+—/g;
  const defined = new Set<string>();
  let dm: RegExpExecArray | null;
  while ((dm = defRe.exec(text)) !== null) defined.add(dm[1]);

  const allReqs = new Set([...manifest, ...defined]);
  const citedRe = /\bREQ-(\d{3}[a-z0-9]*)\b/g;
  let cm: RegExpExecArray | null;
  const allReqsSorted = [...allReqs].sort();
  function hasSubReq(prefix: string): boolean {
    return allReqsSorted.some((r) => r.startsWith(prefix) && r !== prefix);
  }
  while ((cm = citedRe.exec(text)) !== null) {
    const r = cm[0];
    if (!allReqs.has(r) && !hasSubReq(r) && !cm[1].startsWith("0")) {
      issues.push(`dangling citation: ${r} at position ${cm.index} — not in manifest or REQ headers`);
    }
  }

  for (const r of manifest) {
    if (!defined.has(r)) {
      issues.push(`orphan REQ: ${r} in Appendix E manifest but no REQ header found`);
    }
  }
  return issues;
}

// ─── Assumption Audit (merged from audit-assumptions.ts) ────────────────

function checkAssumptions(text: string): string[] {
  const issues: string[] = [];

  const arxiv = text.match(/\(arXiv:\d{4}\.\d{4,5}\)|\(arXiv:\d{4}\.\d{4,5}\)/g);
  if (arxiv) {
    for (const c of arxiv) issues.push(`unverifiable citation: ${c}`);
  }

  const magicPatterns: { pattern: RegExp; label: string }[] = [
    { pattern: /\b(10|5|3)\s*(mechanical|extract|chunk|section)/i, label: "chunk/attempt count" },
    { pattern: /(cold start|startup).*≤\s*(\d+)\s*seconds/i, label: "startup threshold" },
    { pattern: /\b(200|1000)\s*(indexed|mechanical|sections|items)/i, label: "indexed-item threshold" },
  ];
  for (const { pattern, label } of magicPatterns) {
    const matches = text.matchAll(new RegExp(pattern.source, "gi"));
    for (const m of matches) {
      const ctx = text.slice(Math.max(0, (m.index ?? 0) - 40), (m.index ?? 0) + (m[0]?.length ?? 0) + 40).replace(/\n/g, " ");
      if (!/because|rationale|basis|empirical|measured|calibrated/i.test(ctx)) {
        issues.push(`magic number (${label}): "${m[0]}" near: …${ctx}…`);
        break;
      }
    }
  }

  const absPattern = /\b(must always|can never|the only|without exception)\b/gi;
  const lines = text.split("\n");
  let inReq = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\*\*REQ-\d{3}/.test(line)) inReq = true;
    if (inReq && /[*_]Check:[*_]/.test(line)) inReq = false;
    if (inReq) continue;
    if (line.includes("`") || line.startsWith("|") || line.startsWith("#") || line.startsWith(">") || line.startsWith("- ")) continue;
    const absMatch = line.match(absPattern);
    if (absMatch) issues.push(`absolute language — "${absMatch[0]}" on line ${i + 1}`);
  }

  const unqualified = text.matchAll(/(?<!Light|Standard|Heavy|Huge|tiered\s)≥\s*(80|90)\%/g);
  for (const m of unqualified) {
    if (m.index === undefined) continue;
    const ctx = text.slice(Math.max(0, m.index - 80), m.index + 40).replace(/\n/g, " ");
    if (!/tier|complexity|REQ-100|Light|Standard|Heavy|Huge/i.test(ctx)) {
      issues.push(`untiered threshold: "≥ ${m[1]}%" — context: …${ctx}…`);
    }
  }

  return issues;
}

// ─── Proofreading: Consolidated ──────────────────────────────────────────

interface ProofreadingIssues {
  passive: string[];
  modal: string[];
  xref: string[];
  doubleNeg: string[];
  sentLen: string[];
  condStack: string[];
  emptySec: string[];
  pronoun: string[];
  termDrift: string[];
  readability: string[];
  proseReadability: string[];
}

function emptyIssues(): ProofreadingIssues {
  return { passive: [], modal: [], xref: [], doubleNeg: [], sentLen: [], condStack: [], emptySec: [], pronoun: [], termDrift: [], readability: [], proseReadability: [] };
}

function fleschKincaidGrade(words: string[], sentences: string[]): number {
  if (words.length === 0 || sentences.length === 0) return 0;
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  return 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;
}

function consolidateProofreading(text: string, reqs: Map<string, ReqBodyEntry>, terms: { term: string; canonical: string }[]): ProofreadingIssues {
  const issues = emptyIssues();

  // ── Cross-reference format (text-level) ──
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```") || line.startsWith("|") || line.startsWith("#")) continue;
    if (/req\s+\d{3}/i.test(line) && !/REQ-\d{3}/.test(line)) {
      issues.xref.push(`line ${i + 1}: non-canonical REQ reference — use "REQ-NNN"`);
    }
    if (/section\s+\d/i.test(line) && !/^##\s/.test(line) && !/^\s*-/.test(line)) {
      issues.xref.push(`line ${i + 1}: non-canonical section reference — use "§N"`);
    }
  }

  // ── Empty sections (text-level) ──
  let lastHeading = "";
  let lastHeadingLine = 0;
  let nonBlankLines = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      while (i + 1 < lines.length && !lines[++i].startsWith("```"));
      continue;
    }
    if (/^#{2,4}\s+/.test(line) && !line.includes("Contents")) {
      if (lastHeading && nonBlankLines === 0) {
        issues.emptySec.push(`empty section: line ${lastHeadingLine} "${lastHeading}" — no prose content`);
      }
      lastHeading = line.trim().replace(/^#+\s*/, "");
      lastHeadingLine = i + 1;
      nonBlankLines = 0;
      continue;
    }
    if (line.trim().length > 0 && !line.trim().startsWith("---")) nonBlankLines++;
  }

  // ── Per-REQ checks (single loop) ──
  const passiveRe = /\b(is|are|was|were|been|being)\s+(\w+(?:ed|en|t)|built|made|found|known|seen|taken|given)\b/gi;
  const dnRe = /\b(not\s+fail|not\s+omit|never\s+not|not\s+absent|not\s+missing)\b/gi;
  const initialPronounRe = /^(It|This|That|These|Those)\s/i;
  const pronounDensityRe = /\b(it|they|them|this|that|these|those)\b/gi;
  const termSet = new Set(terms.map((t) => t.term.toLowerCase()));

  for (const [reqId, entry] of reqs) {
    const body = entry.body;
    const sentences = entry.sentences;
    if (sentences.length === 0) continue;
    const words = body.split(/\s+/).filter((w) => w.length > 0);

    // Passive voice
    let passiveCount = 0;
    for (const s of sentences) { if (passiveRe.test(s)) passiveCount++; }
    const passivePct = passiveCount / sentences.length;
    if (passivePct > 0.4) issues.passive.push(`${reqId}: ${passiveCount}/${sentences.length} sentences passive (${Math.round(passivePct * 100)}%)`);

    // Modal drift
    const mustMatch = body.match(/\bmust\b/gi);
    const willMatch = body.match(/\bwill\b/gi);
    const shouldMatch = body.match(/\bshould\b/gi);
    if ((mustMatch || willMatch || shouldMatch) && /\bSHALL\b/.test(body)) {
      const parts: string[] = [];
      if (mustMatch) parts.push(`"must" (${mustMatch.length})`);
      if (willMatch) parts.push(`"will" (${willMatch.length})`);
      if (shouldMatch) parts.push(`"should" (${shouldMatch.length})`);
      issues.modal.push(`${reqId}: ${parts.join(", ")} alongside SHALL — consider standardizing to SHALL`);
    }

    // Double negatives
    const dnMatch = body.match(dnRe);
    if (dnMatch) issues.doubleNeg.push(`${reqId}: double negative "${dnMatch[0]}" — simplify`);

    // Sentence length
    const wordCounts = sentences.map((s) => s.split(/\s+/).filter((w) => w.length > 0).length);
    const veryLong = wordCounts.filter((w) => w > 45);
    const allLong = wordCounts.every((w) => w > 30);
    if (veryLong.length > 0) {
      issues.sentLen.push(`${reqId}: ${veryLong.length} sentence(s) exceed 45 words (max ${Math.max(...wordCounts)})`);
    } else if (allLong && wordCounts.length > 1) {
      issues.sentLen.push(`${reqId}: all ${wordCounts.length} sentences >30 words — monotonous density`);
    }

    // Condition stacking
    for (const s of sentences) {
      const conjunctions = (s.match(/\b(and|or)\b/gi) || []).length;
      const conditionals = (s.match(/\b(if|when|while|unless)\b/gi) || []).length;
      if (conjunctions > 3 || conditionals > 2) {
        issues.condStack.push(`${reqId}: sentence with ${conjunctions} conjunctions, ${conditionals} conditionals — multiple contracts`);
        break;
      }
    }

    // Pronoun ambiguity
    for (const s of sentences) {
      if (initialPronounRe.test(s)) {
        issues.pronoun.push(`${reqId}: sentence starts with ambiguous pronoun "${s.slice(0, 30)}…"`);
        break;
      }
      const sWords = s.split(/\s+/).filter((w) => w.length > 0);
      const pronounCount = (s.match(pronounDensityRe) || []).length;
      if (sWords.length > 0 && pronounCount / sWords.length > 0.2) {
        issues.pronoun.push(`${reqId}: pronoun density ${Math.round(pronounCount / sWords.length * 100)}% — ambiguous referents`);
        break;
      }
    }

    // Term drift
    for (const w of words) {
      const clean = w.replace(/[`*_,.()]/g, "").toLowerCase();
      if (termSet.has(clean) && w !== w.toLowerCase() && w.includes("_")) {
        const canonical = terms.find((t) => t.term.toLowerCase() === clean)?.canonical;
        if (canonical && w !== canonical) {
          issues.termDrift.push(`${reqId}: term "${w}" drifts from canonical "${canonical}"`);
          break;
        }
      }
    }

    // Readability (Flesch-Kincaid)
    if (words.length > 0) {
      const grade = fleschKincaidGrade(words, sentences);
      if (grade > 15) issues.readability.push(`${reqId}: Flesch-Kincaid grade ${grade.toFixed(1)} — exceeds grade 15`);
    }
  }

  // ── Narrative prose readability (text-level) ──
  for (const p of extractNarrativeProse(text)) {
    const words = p.paragraph.split(/\s+/).filter((w) => w.length > 0);
    const sentences = splitSentences(p.paragraph);
    if (words.length === 0 || sentences.length === 0) continue;
    const grade = fleschKincaidGrade(words, sentences);
    if (grade > 12) issues.proseReadability.push(`${p.section} (line ${p.line}): Flesch-Kincaid grade ${grade.toFixed(1)} — exceeds grade 12`);
  }

  return issues;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  const groups = word.match(/[aeiouy]+/g) || [];
  let count = groups.length;
  if (word.endsWith("e") && count > 1) count--;
  return Math.max(1, count);
}

// ─── Separators & Structural ────────────────────────────────────────────

function checkSeparators(text: string): string[] {
  const issues: string[] = [];
  let inBlock = false;
  let pastAppendices = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) { inBlock = !inBlock; continue; }
    if (inBlock) continue;
    if (/^#\s+Appendices/.test(line)) { pastAppendices = true; continue; }
    if (pastAppendices) continue;
    if (/^#{2}\s+Contents/.test(line)) continue;
    if (/^#{1,4}\s+/.test(line) && i > 0) {
      let prev = i - 1;
      while (prev >= 0 && !lines[prev].trim()) prev--;
      if (prev >= 0 && lines[prev].trim() !== "---") {
        if (line.startsWith("## ")) issues.push(`Line ${i + 1}: heading '${line.trim()}' not preceded by ---`);
      }
    }
  }
  return issues;
}

function checkSpecVersionFormat(text: string): string[] {
  const issues: string[] = [];
  let inTable = false;
  let reqColIdx: number | null = null;
  let specColIdx: number | null = null;
  for (const line of text.split("\n")) {
    if (line.trim().startsWith("| REQ     | Title")) {
      inTable = true;
      const result = parseColumnIndices(line, ["REQ", "Spec version"]);
      if (typeof result === "string") { console.error(`ERROR: ${result}`); process.exit(1); }
      reqColIdx = result.get("REQ")!;
      specColIdx = result.get("Spec version")!;
      continue;
    }
    if (inTable) {
      if (line.trim().startsWith("| -------")) continue;
      const cells = line.split("|").map((s) => s.trim()).filter((_, i) => i > 0);
      if (reqColIdx !== null && specColIdx !== null && cells.length > specColIdx) {
        const reqId = cells[reqColIdx];
        const version = cells[specColIdx];
        if (/^REQ-\d{3}$/.test(reqId) && (version === "\u2014" || version === "(today)")) {
          issues.push(`${reqId}: Spec version not populated`);
        }
      } else if (!line.trim().startsWith("|")) break;
    }
  }
  return issues;
}

function checkAppendixRange(text: string): string[] {
  const issues: string[] = [];
  const appendixHeadings = [...text.matchAll(/^## Appendix ([A-Z]):/gm)];
  if (appendixHeadings.length === 0) return issues;
  const highestLetter = appendixHeadings.map((h) => h[1]).sort().pop()!;
  let inBlock = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) { inBlock = !inBlock; continue; }
    if (inBlock) continue;
    if (/^## Appendix [A-Z]/.test(line.trim())) continue;
    if (/- \[Appendix [A-Z]/.test(line.trim())) continue;
    const match = line.match(/Appendices\s+([A-Z])–([A-Z])\b/);
    if (match && match[2] !== highestLetter) {
      issues.push(`Line ${i + 1}: stale appendix range "${match[0]}" — actual highest is "Appendix ${highestLetter}"`);
    }
  }
  return issues;
}

function checkStaleCounts(text: string): string[] {
  const issues: string[] = [];
  const words = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve";
  const nouns = "metric|phase|step|category|domain|subsection|workflow|property|group|verification";
  const re = new RegExp(`\\b(${words})\\s+(${nouns})s?\\s+in\\s+(§\\d|Section\\s+\\d|Appendix\\s+[A-Z])`, "gi");
  let inBlock = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) { inBlock = !inBlock; continue; }
    if (inBlock) continue;
    for (const m of line.matchAll(re)) {
      issues.push(`Line ${i + 1}: hardcoded count "${m[0]}" — verify actual count`);
    }
  }
  return issues;
}

function checkStaleGateReferences(text: string): string[] {
  const issues: string[] = [];
  const workflowsStart = text.indexOf("## 8. Verification Workflows");
  if (workflowsStart === -1) return issues;
  const workflowsEnd = text.indexOf("\n## ", workflowsStart + 1);
  const workflowsSection = text.slice(workflowsStart, workflowsEnd !== -1 ? workflowsEnd : undefined);
  const canonicalWorkflows = new Set<string>();
  const workflowRe = /\|\s*(G\d+[a-z0-9]*)\s*\|/g;
  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = workflowRe.exec(workflowsSection)) !== null) canonicalWorkflows.add(tableMatch[1]);

  const lines = text.split("\n");
  let inBlock = false;
  let skip = false;
  let staleCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) { inBlock = !inBlock; continue; }
    if (inBlock) continue;
    if (skip) { if (/^##\s/.test(line)) skip = false; continue; }
    if (line.trim() === "## 8. Verification Workflows") { skip = true; continue; }

    for (const gm of line.matchAll(/Gate\s+(\d+[a-z0-9]*)\b/gi)) {
      const gateId = "G" + gm[1].toUpperCase();
      if (!canonicalWorkflows.has(gateId)) {
        if (staleCount === 0) issues.push("Stale verification workflow references found:");
        issues.push(`  - Line ${i + 1}: "${gm[0]}" — no matching workflow in §8`);
        staleCount++;
      }
    }
  }
  return issues;
}

function checkSubsectionCounts(text: string): string[] {
  const issues: string[] = [];
  const tableStart = text.indexOf("| §       | Title");
  if (tableStart === -1) return issues;
  const tableEnd = text.indexOf("\n\n", tableStart);
  if (tableEnd === -1) return issues;
  const tableText = text.slice(tableStart, tableEnd);
  const expected = new Map<string, number>();
  for (const line of tableText.split("\n")) {
    const m = line.match(/^\|\s*(5\.\d+)\s*\|.*\|\s*(\d+)\s*\|$/);
    if (m) expected.set(m[1], parseInt(m[2]));
  }
  if (expected.size === 0) return issues;
  const actual = new Map<string, number>();
  let currentSection = "";
  for (const line of text.split("\n")) {
    const h = line.match(/^### (5\.\d+) /);
    if (h) { currentSection = h[1]; continue; }
    if (line.match(/^(## |---$)/)) { currentSection = ""; continue; }
    if (line.match(/^### /)) { currentSection = ""; continue; }
    if (currentSection && line.match(/^\*\*REQ-\d{3}/)) {
      actual.set(currentSection, (actual.get(currentSection) || 0) + 1);
    }
  }
  for (const [sec, exp] of expected) {
    const act = actual.get(sec) || 0;
    if (act !== exp) issues.push(`WARNING: §${sec} count mismatch — table says ${exp}, actual ${act}`);
  }
  return issues;
}

// ─── Traceability & Coverage ────────────────────────────────────────────

function generateTraceability(text: string, reqIndex: Map<string, string>): void {
  const reqs = [...reqIndex.keys()].sort();
  const testIds = extractTestIds(text);
  const citedTests = findTestCitations(text);

  console.log("\n=== TRACEABILITY MATRIX ===\n");

  const reqTests = new Map<string, Set<string>>();
  for (const reqId of reqs) reqTests.set(reqId, new Set());

  for (const [tid] of testIds) {
    for (const reqId of reqs) {
      if (text.includes(reqId) && text.includes(tid)) {
        const reqBody = text.substring(text.indexOf(`**${reqId}`), text.indexOf(`**${reqId}`) + 500);
        if (reqBody.includes(tid)) reqTests.get(reqId)!.add(tid);
      }
    }
  }

  const reqsWithoutTests: string[] = [];
  for (const reqId of reqs) {
    const re = new RegExp(`\\*\\*${reqId.replace(/[a-z]$/, "")}[a-z0-9]*\\s+—\\s+(.+?)\\.\\*\\*`);
    const m = text.match(re);
    const title = m ? m[1] : "";
    const checkMatch = text.slice(text.indexOf(`**${reqId}`), text.indexOf(`**${reqId}`) + 2000).match(/[*_]Check:[*_]\s*(.+)/);
    const checks = checkMatch ? checkMatch[1].trim() : "none";
    if (checks === "none") reqsWithoutTests.push(`${reqId} (${title})`);
  }

  if (reqsWithoutTests.length > 0) {
    console.log(`REQs with no Check: citations (${reqsWithoutTests.length}):`);
    for (const r of reqsWithoutTests) console.log(`  - ${r}`);
  } else {
    console.log("PASS: All REQs have at least one Check: citation");
  }
  console.log("");

  const testReqCount = new Map<string, number>();
  for (const tid of testIds) testReqCount.set(tid, 0);
  for (const [_reqId, tests] of reqTests) {
    for (const tid of tests) testReqCount.set(tid, (testReqCount.get(tid) || 0) + 1);
  }
  const uncitedTestsList = [...testReqCount.entries()].filter(([_, count]) => count === 0).map(([tid]) => tid).sort();
  if (uncitedTestsList.length > 0) {
    console.log(`Test IDs not cited in any REQ body (${uncitedTestsList.length}):`);
    for (const tid of uncitedTestsList) console.log(`  - ${tid}`);
  } else {
    console.log("PASS: All test IDs are cited in at least one REQ body");
  }
  console.log("");

  const gateNames = ["Gate 0", "Gate 1", "Gate 2", "Gate 2b", "Gate 3", "Gate 4", "Gate 5"];
  const gateSections: { name: string; start: number; end: number }[] = [];
  for (const gate of gateNames) {
    const startIdx = text.indexOf(`**${gate}`);
    if (startIdx !== -1) {
      const endIdx = text.indexOf("\n**Gate", startIdx + 1);
      const effectiveEnd = endIdx !== -1 ? endIdx : text.indexOf("\n---", startIdx);
      gateSections.push({ name: gate, start: startIdx, end: effectiveEnd !== -1 ? effectiveEnd : text.length });
    }
  }

  console.log("Gate → REQ coverage:");
  for (const { name, start, end } of gateSections) {
    const covered = new Set(reqs.filter((reqId) => text.slice(start, end).includes(reqId)));
    console.log(`  ${name}: ${covered.size} REQs — ${[...covered].sort().join(", ")}`);
  }
  console.log("");

  const fmTags = [1, 2, 3, 4, 5, 6, 7, 8];
  console.log("Failure mode → preventive REQ count:");
  for (const fm of fmTags) {
    const pattern = new RegExp(`\\(F${fm}\\)`);
    const coveredReqs = reqs.filter((reqId) =>
      pattern.test(text.slice(text.indexOf(`**${reqId}`), text.indexOf(`**${reqId}`) + 2000))
    );
    console.log(`  F${fm}: ${coveredReqs.length} REQs`);
  }
  console.log("\n=== END TRACEABILITY MATRIX ===\n");
}

function checkCoverageCompleteness(text: string): string[] {
  const issues: string[] = [];
  const stateTiers = ["Roster", "Novel", "Connection", "NPC", "Scene", "Countdown", "Lore", "Enrichment", "Adventure"];
  for (const tier of stateTiers) {
    const inStateTable = text.match(new RegExp(`\\|\\s*${tier}\\s*\\|`));
    if (inStateTable) {
      const hasPersistenceReq = text.includes("REQ-092") || text.includes("REQ-055");
      const hasFilteringReq = text.includes("REQ-032");
      if (!hasPersistenceReq && tier !== "Connection") issues.push(`State tier '${tier}' — no persistence REQ citation found nearby`);
      if (!hasFilteringReq && tier !== "Connection") issues.push(`State tier '${tier}' — no hat-filtering REQ citation found nearby`);
    }
  }
  return issues;
}

function checkPatternBufferCoverageMap(text: string, reqIndex: Map<string, string>): string[] {
  const issues: string[] = [];
  const coverageStart = text.indexOf("**REQ Pattern Buffer coverage map.**");
  if (coverageStart === -1) { issues.push("REQ Pattern Buffer coverage map not found in §6.6"); return issues; }
  const coverageEnd = text.indexOf("| REQ-002", coverageStart);
  if (coverageEnd === -1) { issues.push("REQ Pattern Buffer coverage map table not found"); return issues; }
  const mapSection = text.slice(coverageStart, coverageEnd + 500);
  const mapReqs = new Set<string>();
  for (const match of mapSection.matchAll(/\| REQ-(\d{3}[a-z0-9]*)\s*\|/g)) mapReqs.add("REQ-" + match[1]);
  if (mapReqs.size === 0) { issues.push("REQ Pattern Buffer coverage map contains no REQ entries"); return issues; }

  const sectionMapStart = text.indexOf("| §       | Title");
  if (sectionMapStart === -1) { issues.push("§5 section map not found"); return issues; }
  const sectionMapEnd = text.indexOf("\n### 5.1", sectionMapStart);
  if (sectionMapEnd === -1) { issues.push("§5.1 heading not found after section map"); return issues; }
  const sectionMap = text.slice(sectionMapStart, sectionMapEnd);
  const coveredSections = ["5.5", "5.6", "5.7"];
  const sectionReqs = new Set<string>();
  for (const line of sectionMap.split("\n")) {
    for (const sec of coveredSections) {
      if (line.includes(`| ${sec}`)) {
        const reqs = line.match(/REQ-\d{3}[a-z0-9]*/g);
        if (reqs) for (const r of reqs) sectionReqs.add(r);
        const ranges = line.match(/(\d{3}[a-z0-9]*)–(\d{3}[a-z0-9]*)/g);
        if (ranges) {
          for (const range of ranges) {
            const [lo, hi] = range.split("–");
            const loNum = parseInt(lo);
            const hiNum = parseInt(hi);
            if (!isNaN(loNum) && !isNaN(hiNum)) {
              for (let n = loNum; n <= hiNum; n++) {
                const padded = String(n).padStart(3, "0");
                if (reqIndex.has("REQ-" + padded)) sectionReqs.add("REQ-" + padded);
              }
            }
          }
        }
      }
    }
  }
  for (const r of [...sectionReqs].sort()) {
    if (!mapReqs.has(r)) issues.push(`ERROR: ${r} in §5.5/5.6/5.7 but missing from Pattern Buffer coverage map`);
  }
  for (const r of [...mapReqs].sort()) {
    if (!reqIndex.has(r)) issues.push(`WARNING: ${r} in Pattern Buffer coverage map but not in Appendix E`);
  }
  if (sectionReqs.size === 0) issues.push("Could not extract §5.5/5.6/5.7 REQs from section map");
  return issues;
}

function checkCouplingCompleteness(text: string): string[] {
  const issues: string[] = [];
  const VALID_ARCHETYPES = new Set(["Temporal", "Entity-bearing", "Scene-anchored", "Knowledge-carrying", "Narrative-memory", "Spatial", "Relational", "Decision", "Guidance", "Session", "Ruleset Wisdom", "Mechanical"]);
  const CONTENT_SOURCE_MARKER = "[content source]";
  const NON_PROPERTY_MARKER = "[non-property]";
  const ALIASES: Record<string, string[]> = {
    Combat: ["Entity-bearing"],
    Entity: ["Entity-bearing"],
    Vehicle: ["Spatial"],
    "Undo/Redo/Badge": ["Session"],
    suggest_actions: ["Ruleset Wisdom"],
    resolve_intent: ["Decision"],
    "Pacing Window": ["Temporal"],
    "NPC Autonomy": ["Entity-bearing"],
    "Constraint Overrides": ["Decision"],
    "Player Signal": ["Session"],
  };

  const propsMatch = text.match(/\*\*Novel properties\.\*\*[\s\S]*?(?=\nDangers and non-entity)/);
  const propsText = propsMatch ? propsMatch[0] : "";
  if (!propsText) { issues.push("ERROR: §7.7 Novel properties table not found"); return issues; }

  const propLines = propsText.split("\n");
  const propGroups: { name: string; archetypes: string[] }[] = [];
  let inPropTable = false;
  for (const line of propLines) {
    if (line.includes("| Property |") && line.includes("Archetypes")) { inPropTable = true; continue; }
    if (inPropTable && line.startsWith("|") && line.includes("|")) {
      const cols = line.split("|").map((s) => s.trim()).filter(Boolean);
      if (cols.length >= 2) {
        const name = cols[0];
        const archetypeStr = cols[1];
        if (name && !name.startsWith("-") && name !== "Property") {
          let archetypes: string[];
          if (archetypeStr.includes(CONTENT_SOURCE_MARKER)) archetypes = [CONTENT_SOURCE_MARKER];
          else {
            archetypes = archetypeStr.split(",").map((s) => s.trim()).filter(Boolean);
            for (const a of archetypes) {
              if (!VALID_ARCHETYPES.has(a)) issues.push(`WARNING: Property "${name}" has unrecognized archetype "${a}"`);
            }
          }
          propGroups.push({ name, archetypes });
        }
      }
    }
    if (inPropTable && !line.startsWith("|")) break;
  }
  if (propGroups.length === 0) { issues.push("ERROR: No property groups found in §7.7 table"); return issues; }

  const resolveArchetypes = (token: string): string[] | null => {
    const t = token.trim();
    const group = propGroups.find((g) => g.name === t);
    if (group) return group.archetypes;
    if (ALIASES[t]) return ALIASES[t];
    return null;
  };

  const couplingMatch = text.match(/##### 7\.7\.1a Active couplings[\s\S]*?(?=##### 7\.7\.1b Coupling curation)/);
  const couplingSection = couplingMatch ? couplingMatch[0] : "";
  const couplingPairs = new Set<string>();
  const couplingRows: { pair: string; patternRule: string }[] = [];
  if (couplingSection) {
    let inCouplingTable = false;
    for (const line of couplingSection.split("\n")) {
      if (line.includes("| Property pair |") && line.includes("Pattern Rule")) { inCouplingTable = true; continue; }
      if (inCouplingTable && line.startsWith("|") && line.includes("|")) {
        const cols = line.split("|").map((s) => s.trim()).filter(Boolean);
        if (cols.length >= 2) {
          const pair = cols[0];
          const patternRule = cols[1] || "";
          if (pair && !pair.startsWith("-") && pair !== "Property pair") {
            const normalized = pair.replace(/\s*[↔→]\s*/g, "→").replace(/\s+/g, " ").trim();
            couplingPairs.add(normalized);
            couplingRows.push({ pair: normalized, patternRule });
            if (patternRule && patternRule !== "—" && !/^P\d+/.test(patternRule)) {
              issues.push(`ERROR: Coupling row "${pair}" has invalid Pattern Rule "${patternRule}"`);
            }
          }
        }
      }
      if (inCouplingTable && !line.startsWith("|") && line.trim().length > 0) break;
    }
  }

  const patternMatch = text.match(/\*\*Coupling pattern rules\.\*\*[\s\S]*?(?=#### 7\.7\.1 Cross-property coupling)/);
  const patternSection = patternMatch ? patternMatch[0] : "";
  const patternRules = new Set<string>();
  const patternRuleArchetypes = new Map<string, { src: string[]; tgt: string[]; srcText: string; tgtText: string }>();
  if (patternSection) {
    let inPatternTable = false;
    for (const line of patternSection.split("\n")) {
      if (line.includes("| Rule |") && line.includes("Source archetype")) { inPatternTable = true; continue; }
      if (inPatternTable && line.startsWith("|") && (line.includes("→") || line.includes("↔"))) {
        const cols = line.split("|").map((s) => s.trim()).filter(Boolean);
        if (cols.length >= 2) {
          const ruleName = cols[0];
          if (!ruleName.startsWith("—") && ruleName.length > 0) {
            patternRules.add(ruleName);
            const parts = cols[1].split(/[↔→]/).map((s) => s.trim());
            if (parts.length >= 2) {
              const srcText = parts[0];
              const tgtText = parts[1];
              const src = srcText.split("+").map((s) => s.trim()).filter(Boolean);
              const tgt = tgtText.split("+").map((s) => s.trim()).filter(Boolean);
              patternRuleArchetypes.set(ruleName, { src, tgt, srcText, tgtText });
            }
          }
        }
      }
      if (inPatternTable && !line.startsWith("|") && line.trim().length > 0) break;
    }
  }

  const usedRules = new Set<string>();
  for (const row of couplingRows) { if (row.patternRule !== "—") usedRules.add(row.patternRule); }

  let orphanedRules = 0;
  for (const rule of patternRules) {
    if (!usedRules.has(rule)) { issues.push(`ERROR: Pattern rule ${rule} has zero coupling rows in §7.7.1a`); orphanedRules++; }
  }
  for (const rule of usedRules) {
    if (!patternRules.has(rule)) issues.push(`WARNING: Coupling rows cite undefined pattern rule ${rule}`);
  }

  let mismatches = 0;
  for (const row of couplingRows) {
    if (!row.patternRule || row.patternRule === "—") continue;
    const rule = patternRuleArchetypes.get(row.patternRule);
    if (!rule) continue;
    if (row.pair.includes(NON_PROPERTY_MARKER)) continue;
    const parts = row.pair.split("→");
    if (parts.length !== 2) continue;
    const srcArch = resolveArchetypes(parts[0]);
    const tgtArch = resolveArchetypes(parts[1]);
    if (!srcArch || !tgtArch) {
      issues.push(`WARNING: Coupling row "${row.pair}" has an unresolvable property token`);
      continue;
    }
    const union = new Set([...srcArch, ...tgtArch]);
    const srcOk = rule.src.every((a) => union.has(a));
    const tgtOk = rule.tgt.some((a) => union.has(a));
    if (!srcOk || !tgtOk) {
      issues.push(`ERROR: Coupling row "${row.pair}" cites ${row.patternRule} (${rule.srcText} → ${rule.tgtText}) but property archetypes [${[...union].join(", ")}] do not match`);
      mismatches++;
    }
  }
  if (mismatches > 0) console.log(`  ${mismatches} coupling row(s) with mismatched archetype rule`);

  const populatedRules = patternRules.size - orphanedRules;
  console.log(`\nCoupling derivation: ${populatedRules}/${patternRules.size} pattern rules have ≥1 coupling row`);
  if (orphanedRules > 0) console.log(`  ${orphanedRules} orphaned pattern rule(s) with zero coupling rows`);
  else console.log("PASS: All pattern rules have ≥1 coupling row");
  return issues;
}

// ─── Main ────────────────────────────────────────────────────────────────

function main(): void {
  const text = readSpec();
  let errors = 0;
  let warnings = 0;

  const reqIndex = extractReqIndex(text);
  const citedReqs = findReqCitations(text);

  // A cited REQ is valid if it exists in Appendix E OR (for group references
  // ≤8 chars like REQ-001a or REQ-003) a longer sub-REQ exists with that prefix.
  // Full sub-REQ IDs (≥9 chars) that are not in the manifest remain errors.
  const reqKeys = [...reqIndex.keys()];
  const isDefined = (cited: string): boolean => {
    if (reqIndex.has(cited)) return true;
    if (cited.length < 9) return reqKeys.some((k) => k.startsWith(cited) && k.length > cited.length);
    return false;
  };
  const undefinedReqs = new Set([...citedReqs].filter((r) => !isDefined(r)));
  const uncitedReqs = new Set([...reqIndex.keys()].filter((r) => !citedReqs.has(r)));

  console.log("=== REQ MANIFEST ===\n");
  if (undefinedReqs.size > 0) {
    for (const r of [...undefinedReqs].sort()) console.log(`ERROR: ${r} cited but not defined in Appendix E`);
    errors += undefinedReqs.size;
  }
  if (uncitedReqs.size > 0) {
    for (const r of [...uncitedReqs].sort()) console.log(`WARNING: ${r} defined in Appendix E but never cited`);
    warnings += uncitedReqs.size;
  }
  if (undefinedReqs.size === 0 && uncitedReqs.size === 0) console.log("PASS: All REQ citations resolve; all defined REQs are cited");
  console.log(`PASS: Appendix E manifest contains ${reqIndex.size} REQ rows`);

  const testIds = extractTestIds(text);
  const citedTests = findTestCitations(text);
  const undefinedTests = new Set([...citedTests].filter((t) => !testIds.has(t)));
  const uncitedTests = new Set([...testIds].filter((t) => !citedTests.has(t)));

  if (undefinedTests.size > 0) {
    for (const t of [...undefinedTests].sort()) console.log(`ERROR: ${t} cited but not in Section 7 test table`);
    errors += undefinedTests.size;
  }
  if (uncitedTests.size > 0) {
    for (const t of [...uncitedTests].sort()) console.log(`WARNING: ${t} in Section 7 but never cited elsewhere`);
    warnings += uncitedTests.size;
  }
  if (undefinedTests.size === 0 && uncitedTests.size === 0) console.log("PASS: All test ID citations resolve; all test IDs are cited");

  const headings = extractHeadings(text);
  const tocEntries = extractTocEntries(text);
  const headingTextsSet = new Set(headings.map((h) => h[1]));
  const tocSet = new Set(tocEntries);
  const missingHeadings = [...tocSet].filter((h) => !headingTextsSet.has(h)).sort();
  if (missingHeadings.length > 0) {
    for (const entry of missingHeadings) console.log(`ERROR: TOC entry '${entry}' not found in headings`);
    errors += missingHeadings.length;
  } else console.log("PASS: All TOC entries resolve to headings");

  console.log("\n=== REQ BLOCK INTEGRITY ===\n");
  const blockIssues = checkReqBlocks(text);
  if (blockIssues.length > 0) { for (const issue of blockIssues) console.log(`ERROR: ${issue}`); errors += blockIssues.length; }
  else console.log("PASS: All requirement blocks follow canonical shape");

  console.log("\n=== REQ SHAPE (SDD STRICT) ===\n");
  const reqsWithSentences = extractReqBodiesWithSentences(text);
  const shapeIssues = checkReqShape(reqsWithSentences);
  if (shapeIssues.length > 0) {
    for (const issue of shapeIssues) {
      const isSoft = issue.includes("review for splitting");
      if (sddStrict && !isSoft) { console.log(`ERROR: ${issue}`); errors++; }
      else { console.log(`WARNING: ${issue}`); warnings++; }
    }
  } else if (sddStrict) { console.log("PASS: All REQs satisfy SDD shape constraints"); }

  console.log("\n=== SPEC AUTHORING VIOLATIONS ===\n");
  const specViolations = checkSpecViolations(text);
  if (specViolations.length > 0) {
    for (const issue of specViolations) {
      if (sddStrict) { console.log(`ERROR: ${issue}`); errors++; }
      else { console.log(`WARNING: ${issue}`); warnings++; }
    }
  } else { console.log("PASS: No spec authoring violations detected"); }

  console.log("\n=== AMBIGUITY SCAN ===\n");
  const ambiguityIssues = checkAmbiguity(reqsWithSentences);
  if (ambiguityIssues.length > 0) {
    for (const issue of ambiguityIssues) console.log(`WARNING: ${issue}`);
    warnings += ambiguityIssues.length;
  } else { console.log("PASS: No ambiguous or hedging language detected in REQ bodies"); }

  console.log("\n=== CROSS-REFERENCE AUDIT ===\n");
  const xrefIssues = checkCrossRefs(text);
  if (xrefIssues.length > 0) {
    for (const issue of xrefIssues) console.log(`ERROR: ${issue}`);
    errors += xrefIssues.length;
  } else { console.log("PASS: No dangling citations or orphan REQs"); }

  console.log("\n=== ASSUMPTION AUDIT ===\n");
  const assumptionIssues = checkAssumptions(text);
  if (assumptionIssues.length > 0) {
    for (const issue of assumptionIssues) console.log(`WARNING: ${issue}`);
    warnings += assumptionIssues.length;
  } else { console.log("PASS: No structural assumption patterns detected"); }

  const terms = extractTerminology(text);

  const noProofread = process.argv.includes("--no-proofread");

  console.log("\n=== PROOFREADING ===\n");
  if (noProofread) {
    console.log("SKIPPED: proofreading disabled (--no-proofread)");
  } else {
    const proof = consolidateProofreading(text, reqsWithSentences, terms);

  const proofCats: [string[], string, string][] = [
    [proof.passive, "PASS: Passive voice within threshold", "WARNING"],
    [proof.modal, "PASS: Modal verb consistency", "WARNING"],
    [proof.xref, "PASS: Cross-reference format consistent", "WARNING"],
    [proof.doubleNeg, "PASS: No double negatives detected", "WARNING"],
    [proof.sentLen, "PASS: Sentence length within bounds", "WARNING"],
    [proof.condStack, "PASS: No condition stacking detected", "WARNING"],
    [proof.emptySec, "PASS: No empty sections detected", "WARNING"],
    [proof.pronoun, "PASS: No ambiguous pronoun references", "WARNING"],
    [proof.termDrift, "PASS: Term usage consistent with Terminology table", "WARNING"],
    [proof.readability, "PASS: Readability within grade threshold", "WARNING"],
    [proof.proseReadability, "PASS: Narrative prose within grade-12 threshold", "WARNING"],
  ];
  for (const [iss, passMsg, level] of proofCats) {
    if (iss.length > 0) {
      for (const i of iss) console.log(`${level}: ${i}`);
      warnings += iss.length;
    } else { console.log(passMsg); }
  }
  }

  const sepIssues = checkSeparators(text);
  if (sepIssues.length > 0) { for (const issue of sepIssues) console.log(`WARNING: ${issue}`); warnings += sepIssues.length; }
  else console.log("PASS: All sections separated by ---");

  const versionIssues = checkSpecVersionFormat(text);
  if (versionIssues.length > 0) { for (const issue of versionIssues) console.log(`ERROR: ${issue}`); errors += versionIssues.length; }
  else console.log("PASS: All REQ spec versions populated");

  const staleRefIssues = checkStaleGateReferences(text);
  if (staleRefIssues.length > 0) { for (const issue of staleRefIssues) console.log(`WARNING: ${issue}`); warnings += staleRefIssues.length; }

  const appendixIssues = checkAppendixRange(text);
  if (appendixIssues.length > 0) { for (const issue of appendixIssues) console.log(`WARNING: ${issue}`); warnings += appendixIssues.length; }

  const countIssues = checkStaleCounts(text);
  if (countIssues.length > 0) { for (const issue of countIssues) console.log(`WARNING: ${issue}`); warnings += countIssues.length; }

  const subCountIssues = checkSubsectionCounts(text);
  if (subCountIssues.length > 0) { for (const issue of subCountIssues) console.log(issue); warnings += subCountIssues.length; }

  if (traceability) {
    generateTraceability(text, reqIndex);
    const coverageIssues = checkCoverageCompleteness(text);
    if (coverageIssues.length > 0) {
      console.log("\n=== COVERAGE COMPLETENESS ===\n");
      for (const issue of coverageIssues) console.log(`WARNING: ${issue}`);
      warnings += coverageIssues.length;
    }
  }

  if (!quick) {
    const patternBufferCoverageIssues = checkPatternBufferCoverageMap(text, reqIndex);
    if (patternBufferCoverageIssues.length > 0) {
      console.log("\n=== PATTERN BUFFER REQ COVERAGE MAP ===\n");
      for (const issue of patternBufferCoverageIssues) {
        if (issue.startsWith("ERROR")) { console.log(issue); errors++; }
        else { console.log(issue); warnings++; }
      }
    }

    const couplingIssues = checkCouplingCompleteness(text);
    if (couplingIssues.length > 0) {
      console.log("\n=== COUPLING COMPLETENESS ===\n");
      for (const issue of couplingIssues) {
        if (issue.startsWith("ERROR")) { console.log(issue); errors++; }
        else { console.log(issue); warnings++; }
      }
    }
  }

  console.log(`\n${errors} error(s), ${warnings} warning(s)`);
  if (errors > 0) process.exit(1);
}

main();
