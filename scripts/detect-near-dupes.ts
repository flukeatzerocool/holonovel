#!/usr/bin/env npx tsx
/**
 * detect-near-dupes.ts — near-duplicate paragraph detector. [informational]
 *
 * Flags sentence pairs whose Jaccard similarity exceeds a threshold. Exit
 * codes: 0 always (findings are warnings, not failures).
 */
import { readSpec } from "./lib/parse-spec.js";

const BOILERPLATE_STARTS = [
  "_Check:", "*Check:", "Acceptance criterion:", "Verify with:",
  "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9",
];
const STOP_WORDS = new Set([
  "the", "is", "a", "an", "in", "of", "to", "for", "and", "or",
  "on", "at", "by", "with", "from", "as", "it", "its", "be", "not",
  "this", "that", "are", "was", "were", "been", "has", "have", "had",
  "will", "would", "can", "could", "may", "might", "shall", "should",
]);

interface NearDupe {
  lineA: number;
  lineB: number;
  similarity: number;
  snippetA: string;
  snippetB: string;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const w of a) {
    if (b.has(w)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
}

function tokenize(sentence: string): Set<string> {
  return new Set(
    sentence
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w))
  );
}

function isBoilerplate(sentence: string): boolean {
  for (const prefix of BOILERPLATE_STARTS) {
    if (sentence.trimStart().startsWith(prefix)) return true;
  }
  return false;
}

function extractSentences(text: string): { sentence: string; line: number }[] {
  const result: { sentence: string; line: number }[] = [];
  const lines = text.split("\n");
  let inBlock = false;
  let inTable = false;
  let current = "";
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inBlock = !inBlock;
      continue;
    }
    if (inBlock) continue;

    if (trimmed.startsWith("|") && (trimmed.includes("-|") || trimmed.match(/^\|.+\|.+\|/))) {
      inTable = true;
      continue;
    }
    if (inTable && !trimmed.startsWith("|")) {
      inTable = false;
    }
    if (inTable) continue;

    if (trimmed.startsWith("#") || trimmed.startsWith(">") || trimmed.startsWith("- [") || trimmed.startsWith("* [")) {
      continue;
    }

    if (trimmed.length === 0) {
      if (current.length > 0) {
        result.push({ sentence: current.trim(), line: startLine });
        current = "";
      }
      continue;
    }

    if (current.length === 0) startLine = i + 1;
    current += (current.length > 0 ? " " : "") + trimmed;
  }

  if (current.length > 0) {
    result.push({ sentence: current.trim(), line: startLine });
  }

  return result;
}

function main(): void {
  const text = readSpec();
  const sentences = extractSentences(text);
  const WINDOW = 40;
  const THRESHOLD = 0.75;
  const MIN_WORDS = 10;

  const findings: NearDupe[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const sa = sentences[i];
    if (sa.sentence.split(/\s+/).length < MIN_WORDS) continue;
    if (isBoilerplate(sa.sentence)) continue;

    const tokensA = tokenize(sa.sentence);

    for (let j = i + 1; j < Math.min(sentences.length, i + WINDOW); j++) {
      const sb = sentences[j];
      if (sb.sentence.split(/\s+/).length < MIN_WORDS) continue;
      if (isBoilerplate(sb.sentence)) continue;

      const tokensB = tokenize(sb.sentence);
      const sim = jaccard(tokensA, tokensB);

      if (sim >= THRESHOLD) {
        findings.push({
          lineA: sa.line,
          lineB: sb.line,
          similarity: Math.round(sim * 100) / 100,
          snippetA: sa.sentence.slice(0, 120),
          snippetB: sb.sentence.slice(0, 120),
        });
      }
    }
  }

  if (findings.length === 0) {
    console.log("PASS: No near-duplicate paragraphs detected");
    process.exit(0);
  }

  for (const f of findings) {
    console.log(
      `WARNING: [near-duplicate] Lines ${f.lineA}-${f.lineB} (${f.similarity} similarity):`
    );
    console.log(`  "${f.snippetA}..."`);
    console.log(`  "${f.snippetB}..."`);
    console.log();
  }

  console.log(`\n${findings.length} finding(s)`);
  process.exit(0);
}

main();
