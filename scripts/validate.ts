#!/usr/bin/env npx tsx
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC = path.resolve(__dirname, "..", "holonovel.md");

function readSpec(): string {
  if (!fs.existsSync(SPEC)) {
    console.error(`ERROR: ${SPEC} not found`);
    process.exit(1);
  }
  return fs.readFileSync(SPEC, "utf-8");
}

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

function parseColumnIndices(
  headerLine: string,
  requiredCols: string[]
): Map<string, number> | string {
  const cols = headerLine
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const map = new Map<string, number>();
  for (const name of requiredCols) {
    const idx = cols.indexOf(name);
    if (idx === -1) return `Column '${name}' not found in header: ${headerLine.trim()}`;
    map.set(name, idx);
  }
  return map;
}

function extractReqIndex(text: string): Map<string, string> {
  const reqs = new Map<string, string>();
  let inTable = false;
  let colMap: Map<string, number> | null = null;
  for (const line of text.split("\n")) {
    if (line.trim().startsWith("| REQ     | Title")) {
      inTable = true;
      const result = parseColumnIndices(line, ["REQ", "Title"]);
      if (typeof result === "string") {
        console.error(`ERROR: ${result}`);
        process.exit(1);
      }
      colMap = result;
      continue;
    }
    if (inTable) {
      if (line.trim().startsWith("| -------")) continue;
      const cells = line
        .split("|")
        .map((s) => s.trim())
        .filter((_, i) => i > 0); // skip leading empty from split
      if (colMap && cells.length >= Math.max(...colMap.values()) + 1) {
        const reqId = cells[colMap.get("REQ")!];
        const title = cells[colMap.get("Title")!];
        if (/^REQ-\d{3}[a-z]?$/.test(reqId)) {
          reqs.set(reqId, title);
        }
      } else if (!line.trim().startsWith("|")) {
        break;
      }
    }
  }
  return reqs;
}

function extractTestIds(text: string): Set<string> {
  const tests = new Set<string>();
  let inTable = false;
  for (const line of text.split("\n")) {
    if (line.trim().startsWith("| #   | Test") || line.trim().startsWith("| #     | Type")) {
      inTable = true;
      continue;
    }
    if (inTable) {
      if (line.trim().startsWith("| ---")) continue;
      const m = line.match(/^\|\s*((?:T\d+[a-z]?)(?:\s*,\s*(?:T\d+[a-z]?))*)\s*\|/);
      if (m) {
        for (const tid of m[1].matchAll(/T\d+[a-z]?/g)) {
          tests.add(tid[0]);
        }
      } else if (!line.trim().startsWith("| T")) {
        break;
      }
    }
  }
  return tests;
}

function extractHeadings(text: string): [number, string][] {
  const headings: [number, string][] = [];
  let inBlock = false;
  for (const line of text.split("\n")) {
    if (line.trim().startsWith("```")) {
      inBlock = !inBlock;
      continue;
    }
    if (inBlock) continue;
    const m = line.match(/^(#{1,4})\s+(.+)/);
    if (m) {
      const level = m[1].length;
      const title = stripMarkdownFormatting(m[2]);
      headings.push([level, title]);
    }
  }
  return headings;
}

function extractTocEntries(text: string): string[] {
  const entries: string[] = [];
  let inToc = false;
  for (const line of text.split("\n")) {
    if (line.trim() === "## Contents") {
      inToc = true;
      continue;
    }
    if (inToc) {
      if (line.trim().startsWith("##") && !line.trim().startsWith("###")) break;
      const m = line.match(/^\s*-\s*\[(.+?)\]\(/);
      if (m) {
        entries.push(stripMarkdownFormatting(m[1]));
      }
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
    if (manifestEnd !== -1) {
      afterApx = afterApx.slice(manifestEnd);
    }
  }
  const combined = beforeApx + afterApx;
  const matches = combined.matchAll(/\b(REQ-\d{3}[a-z]?)\b/g);
  return new Set(Array.from(matches, (m) => m[1]));
}

function findTestCitations(text: string): Set<string> {
  const gatesStart = text.indexOf("## 8. Verification Gates");
  const gatesEnd = text.indexOf("## 9. Artifacts");
  let combined: string;
  if (gatesStart !== -1 && gatesEnd !== -1) {
    combined = text.slice(0, gatesStart) + text.slice(gatesEnd);
  } else {
    combined = text;
  }
  const aptStart = combined.indexOf("## Appendix T:");
  const aptEnd = combined.indexOf("\n##", aptStart + 1);
  if (aptStart !== -1) {
    combined = combined.slice(0, aptStart) + (aptEnd !== -1 ? combined.slice(aptEnd) : "");
  }
  const matches = combined.matchAll(/\b(T\d+[a-z]?)\b/g);
  return new Set(Array.from(matches, (m) => m[1]));
}

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

function checkSeparators(text: string): string[] {
  const issues: string[] = [];
  let inBlock = false;
  let pastAppendices = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      inBlock = !inBlock;
      continue;
    }
    if (inBlock) continue;
    if (/^#\s+Appendices/.test(line)) {
      pastAppendices = true;
      continue;
    }
    if (pastAppendices) continue;
    if (/^#{2}\s+Contents/.test(line)) continue;
    if (/^#{1,4}\s+/.test(line) && i > 0) {
      let prev = i - 1;
      while (prev >= 0 && !lines[prev].trim()) prev--;
      if (prev >= 0 && lines[prev].trim() !== "---") {
        if (line.startsWith("## ")) {
          issues.push(
            `Line ${i + 1}: heading '${line.trim()}' not preceded by ---`
          );
        }
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
      if (typeof result === "string") {
        console.error(`ERROR: ${result}`);
        process.exit(1);
      }
      reqColIdx = result.get("REQ")!;
      specColIdx = result.get("Spec version")!;
      continue;
    }
    if (inTable) {
      if (line.trim().startsWith("| -------")) continue;
      const cells = line
        .split("|")
        .map((s) => s.trim())
        .filter((_, i) => i > 0);
      if (reqColIdx !== null && specColIdx !== null && cells.length > specColIdx) {
        const reqId = cells[reqColIdx];
        const version = cells[specColIdx];
        if (/^REQ-\d{3}$/.test(reqId) && version === "\u2014") {
          issues.push(`${reqId}: Spec version not populated (\u2014)`);
        }
      } else if (!line.trim().startsWith("|")) {
        break;
      }
    }
  }
  return issues;
}

function main(): void {
  const text = readSpec();
  let errors = 0;
  let warnings = 0;

  const reqIndex = extractReqIndex(text);
  const citedReqs = findReqCitations(text);
  const undefinedReqs = new Set([...citedReqs].filter((r) => !reqIndex.has(r)));
  const uncitedReqs = new Set([...reqIndex.keys()].filter((r) => !citedReqs.has(r)));

  if (undefinedReqs.size > 0) {
    for (const r of [...undefinedReqs].sort()) {
      console.log(`ERROR: ${r} cited but not defined in Appendix E`);
    }
    errors += undefinedReqs.size;
  }
  if (uncitedReqs.size > 0) {
    for (const r of [...uncitedReqs].sort()) {
      console.log(`WARNING: ${r} defined in Appendix E but never cited`);
    }
    warnings += uncitedReqs.size;
  }
  if (undefinedReqs.size === 0 && uncitedReqs.size === 0) {
    console.log("PASS: All REQ citations resolve; all defined REQs are cited");
  }

  const actual = reqIndex.size;
  console.log(`PASS: Appendix E manifest contains ${actual} REQ rows`);

  const testIds = extractTestIds(text);
  const citedTests = findTestCitations(text);
  const undefinedTests = new Set([...citedTests].filter((t) => !testIds.has(t)));
  const uncitedTests = new Set([...testIds].filter((t) => !citedTests.has(t)));

  if (undefinedTests.size > 0) {
    for (const t of [...undefinedTests].sort()) {
      console.log(`ERROR: ${t} cited but not in Section 7 test table`);
    }
    errors += undefinedTests.size;
  }
  if (uncitedTests.size > 0) {
    for (const t of [...uncitedTests].sort()) {
      console.log(`WARNING: ${t} in Section 7 but never cited elsewhere`);
    }
    warnings += uncitedTests.size;
  }
  if (undefinedTests.size === 0 && uncitedTests.size === 0) {
    console.log("PASS: All test ID citations resolve; all test IDs are cited");
  }

  const headings = extractHeadings(text);
  const tocEntries = extractTocEntries(text);
  const headingTextsSet = new Set(headings.map((h) => h[1]));
  const tocSet = new Set(tocEntries);
  const missingHeadings = [...tocSet].filter((h) => !headingTextsSet.has(h)).sort();

  if (missingHeadings.length > 0) {
    for (const entry of missingHeadings) {
      console.log(`ERROR: TOC entry '${entry}' not found in headings`);
    }
    errors += missingHeadings.length;
  } else {
    console.log("PASS: All TOC entries resolve to headings");
  }

  const blockIssues = checkReqBlocks(text);
  if (blockIssues.length > 0) {
    for (const issue of blockIssues) {
      console.log(`ERROR: ${issue}`);
    }
    errors += blockIssues.length;
  } else {
    console.log("PASS: All requirement blocks follow canonical shape");
  }

  const sepIssues = checkSeparators(text);
  if (sepIssues.length > 0) {
    for (const issue of sepIssues) {
      console.log(`WARNING: ${issue}`);
    }
    warnings += sepIssues.length;
  } else {
    console.log("PASS: All sections separated by ---");
  }

  const versionIssues = checkSpecVersionFormat(text);
  if (versionIssues.length > 0) {
    for (const issue of versionIssues) {
      console.log(`ERROR: ${issue}`);
    }
    errors += versionIssues.length;
  } else {
    console.log("PASS: All REQ spec versions populated");
  }

  console.log(`\n${errors} error(s), ${warnings} warning(s)`);
  if (errors > 0) {
    process.exit(1);
  }
}

main();
