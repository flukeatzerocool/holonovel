#!/usr/bin/env npx tsx
/**
 * Line-based REQ splitter. REQ headers are lines matching:
 *   ^**REQ-NNN[suffix] — Title.**
 * Everything between two REQ headers is the body (including AC and check).
 * Bodies >800 chars are split at paragraph boundaries (double newline).
 * Uses -a/-b/-c suffixes (or -N for existing-suffixed REQs).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkReqIdGrammar,
  checkEmptyReqBodies,
  checkTruncatedReqBodies,
} from "./lib/req-checks.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC_FILES = [
  path.resolve(__dirname, "..", "spec", "02-requirements.md"),
  path.resolve(__dirname, "..", "spec", "03-build.md"),
];
const LIMIT = 700;
const HEADER_RE = /^\*\*(REQ-\d+[a-z0-9]*)\s+—\s+(.+?)\.\*\*/;

interface ReqBlock {
  id: string;
  title: string;
  lineStart: number; // 0-indexed
  lineEnd: number;   // 0-indexed, exclusive
  bodyLines: string[]; // lines between header and next REQ/heading
}

function splitFile(filePath: string): number {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n");
  const backupPath = filePath + ".bak";

  // Phase 1: Identify all REQ header lines
  const reqHeaders: { id: string; title: string; idx: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(HEADER_RE);
    if (m) reqHeaders.push({ id: m[1], title: m[2].trim(), idx: i });
  }

  // Phase 2: Build blocks
  const blocks: ReqBlock[] = [];
  for (let i = 0; i < reqHeaders.length; i++) {
    const h = reqHeaders[i];
    const nextIdx = i + 1 < reqHeaders.length ? reqHeaders[i + 1].idx : lines.length;
    let endIdx = nextIdx;
    for (let j = h.idx + 1; j < nextIdx; j++) {
      if (/^#{2,4}\s/.test(lines[j]) && !lines[j].includes("Contents")) {
        endIdx = j;
        break;
      }
    }
    const bodyLines = lines.slice(h.idx + 1, endIdx);
    blocks.push({ id: h.id, title: h.title, lineStart: h.idx, lineEnd: endIdx, bodyLines });
  }

  // Phase 3: Determine naming
  const existingIds = new Set(reqHeaders.map((h) => h.id));
  function childNaming(baseId: string, numSuffixes: number): string[] {
    const numMatch = baseId.match(/^(REQ-\d{3})/);
    const base = numMatch ? numMatch[1] : baseId;
    const hasSuffix = base !== baseId;

    // Re-splitting a sub-REQ (e.g. REQ-073a) continues with a counter digit
    // after its existing letter: REQ-073a1, REQ-073a2 (never bare digits).
    if (hasSuffix) {
      return Array.from({ length: numSuffixes }, (_, i) => `${baseId}${i + 1}`);
    }

    // Base REQ: assign the next numSuffixes free letters (a, b, c, …),
    // skipping any letter already taken, so we never fall back to bare digits.
    const names: string[] = [];
    let letter = 97;
    while (names.length < numSuffixes) {
      const candidate = `${base}${String.fromCharCode(letter)}`;
      letter++;
      if (!existingIds.has(candidate)) names.push(candidate);
      if (letter > 122) break;
    }
    return names;
  }

  // Phase 4: For each block, split if body > 800 chars
  // Process in reverse so line indices stay valid
  let splits = 0;
  const sortedBlocks = blocks.slice().sort((a, b) => b.lineStart - a.lineStart);

  for (const block of sortedBlocks) {
    const bodyText = block.bodyLines.join("\n");
    if (bodyText.length <= LIMIT) continue;

    // Split the body at paragraph boundaries
    const paragraphs = splitAtParagraphs(bodyText);
    if (paragraphs.length <= 1) {
      // Try splitting at sentence boundaries
      const sentChunks = splitAtSentences(bodyText, LIMIT - 80);
      if (sentChunks.length <= 1) continue;
      const names = childNaming(block.id, sentChunks.length);
      const newLines = buildReplacement(names, block.title, sentChunks);
      lines.splice(block.lineStart, block.lineEnd - block.lineStart, ...newLines);
      for (const n of names) existingIds.add(n);
      splits++;
      continue;
    }

    // Pack paragraphs into chunks ≤ LIMIT chars
    const chunks: string[] = [];
    let current = paragraphs[0];
    for (let i = 1; i < paragraphs.length; i++) {
      const combined = current + "\n" + paragraphs[i];
      if (combined.length <= LIMIT) {
        current = combined;
      } else {
        chunks.push(current);
        current = paragraphs[i];
      }
    }
    chunks.push(current);

    if (chunks.length <= 1) {
      // Paragraph packing didn't help; try sentence splitting
      const sentChunks = splitAtSentences(bodyText, LIMIT - 80);
      if (sentChunks.length > 1) {
        const names = childNaming(block.id, sentChunks.length);
        const newLines = buildReplacement(names, block.title, sentChunks);
        lines.splice(block.lineStart, block.lineEnd - block.lineStart, ...newLines);
        for (const n of names) existingIds.add(n);
        splits++;
        continue;
      }
      // Last resort: force-split at word boundaries
      const forceChunks = forceSplit(bodyText, LIMIT - 80);
      if (forceChunks.length > 1) {
        const names = childNaming(block.id, forceChunks.length);
        const newLines = buildReplacement(names, block.title, forceChunks);
        lines.splice(block.lineStart, block.lineEnd - block.lineStart, ...newLines);
        for (const n of names) existingIds.add(n);
        splits++;
      }
      continue;
    }

    const names = childNaming(block.id, chunks.length);
    const newLines = buildReplacement(names, block.title, chunks);
    lines.splice(block.lineStart, block.lineEnd - block.lineStart, ...newLines);
    for (const n of names) existingIds.add(n);
    splits++;
  }

  // Backup and write
  const output = lines.join("\n");
  const violations = [
    ...checkReqIdGrammar(output),
    ...checkEmptyReqBodies(output),
    ...checkTruncatedReqBodies(output),
  ];
  if (violations.length > 0) {
    console.error(`\nABORT: split of ${path.basename(filePath)} would produce invalid REQ output:`);
    for (const v of violations) console.error(`  - ${v}`);
    console.error("No changes written.");
    process.exit(1);
  }
  fs.copyFileSync(filePath, backupPath);
  fs.writeFileSync(filePath, output, "utf-8");
  return splits;
}

function main(): void {
  let totalSplits = 0;
  for (const f of SPEC_FILES) {
    let passSplits = 0;
    for (let i = 0; i < 10; i++) {
      const n = splitFile(f);
      passSplits += n;
      if (n === 0) break;
    }
    totalSplits += passSplits;
    console.log(`Split ${passSplits} REQs in ${path.basename(f)}`);
  }
  console.log(`Total splits: ${totalSplits}`);
}

function splitAtParagraphs(body: string): string[] {
  // Split at blank lines (paragraph boundaries)
  const parts = body.split(/\n\n+/);
  return parts.filter((p) => p.trim().length > 0);
}

function splitAtSentences(body: string, maxLen: number): string[] {
  const normalized = body.replace(/\n/g, " ");
  const sentences: string[] = [];
  let last = 0;
  for (let i = 0; i < normalized.length; i++) {
    if (
      ".?!".includes(normalized[i]) &&
      i + 2 < normalized.length &&
      normalized[i + 1] === " " &&
      /[A-Z]/.test(normalized[i + 2])
    ) {
      sentences.push(normalized.slice(last, i + 1));
      last = i + 2;
    }
  }
  if (last < normalized.length) sentences.push(normalized.slice(last));

  const chunks: string[] = [];
  let current = sentences[0];
  for (let i = 1; i < sentences.length; i++) {
    const combined = (current + " " + sentences[i]).trim();
    if (combined.length <= maxLen) {
      current = combined;
    } else {
      chunks.push(current);
      current = sentences[i];
    }
  }
  chunks.push(current);
  return chunks.filter((c) => c.trim().length > 0);
}

function forceSplit(text: string, maxLen: number): string[] {
  const normalized = text.replace(/\n/g, " ");
  const words = normalized.split(/\s+/);
  const chunks: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const combined = current + " " + words[i];
    if (combined.length <= maxLen) {
      current = combined;
    } else {
      chunks.push(current);
      current = words[i];
    }
  }
  if (current) chunks.push(current);
  return chunks.filter((c) => c.length > 0);
}

function buildReplacement(names: string[], title: string, chunks: string[]): string[] {
  // Drop empty chunks before deriving names so a zero-length body can never
  // be emitted as a sub-REQ.
  const effective = chunks.map((c, i) => ({ c, i })).filter(({ c }) => c.trim().length > 0);
  const result: string[] = [];
  for (let k = 0; k < effective.length; k++) {
    const { c } = effective[k];
    const suffix = names[k].replace(/^REQ-\d{3}/, "");
    // Never double-append the part marker when the source title already
    // carries one from a prior split.
    const baseTitle = /\s*\(Part .+?\)\s*$/.test(title)
      ? title.replace(/\s*\(Part .+?\)\s*$/, "")
      : title;
    result.push(`**${names[k]} — ${baseTitle} (Part ${suffix}).**`);
    for (const line of c.split("\n")) {
      result.push(line);
    }
    if (k < effective.length - 1) result.push("");
  }
  return result;
}

main();
