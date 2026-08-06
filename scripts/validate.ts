#!/usr/bin/env npx tsx
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { readSpec } from "./lib/parse-spec.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC = path.resolve(__dirname, "..", "holonovel.md");

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
  const aptStart = combined.indexOf("## Appendix F:");
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

function classifyReq(body: string): "state-tier" | "standard" {
  if (/Novel-scoped|survives connection restarts|persists across connections/.test(body)) {
    return "state-tier";
  }
  return "standard";
}

function checkSpecViolations(text: string): string[] {
  const issues: string[] = [];
  const re = /\*\*(REQ-\d{3}[a-z]?\s+—\s+.+?)\.\*\*/g;
  const bodyText = text;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const reqId = match[1].match(/^(REQ-\d{3}[a-z]?)/)![1];
    const bodyStart = match.index + match[0].length;
    const rest = bodyText.slice(bodyStart);
    const endMatch = rest.match(/\*\*REQ-\d{3}[a-z]?\s+—|^#{1,4}\s+/m);
    const body = endMatch ? rest.slice(0, endMatch.index!) : rest;

    const tier = classifyReq(body);
    const limit = tier === "state-tier" ? 1500 : 800;
    if (body.length > limit) {
      issues.push(`${reqId}: body exceeds ${limit}-char ${tier} limit (${body.length}) — may contain implementation detail`);
    }
    if (/\(string[,) ]|\(integer[,) ]|\(boolean[,) ]|\(float[,) ]|\(number[,) ]/.test(body)) {
      issues.push(`${reqId}: contains parameter type annotations — consider removing`);
    }
    if (/Default:\s/.test(body)) {
      issues.push(`${reqId}: contains 'Default:' clause — defaults are builder's domain`);
    }
    if (/\bdefault\s+\d[\d,]*\s*(?:bytes|seconds|minutes|entries|items|MB|KB|ms)\b/i.test(body)) {
      issues.push(`${reqId}: contains bare default value with unit — defaults are builder's domain`);
    }

    const enumerated = body.match(/`[^`]+`(,\s*`[^`]+`)*/g);
    if (enumerated) {
      for (const list of enumerated) {
        const count = (list.match(/`/g) || []).length / 2;
        if (count > 5) {
          issues.push(`${reqId}: enumerated ${count} tokens — catalog-as-requirement`);
          break;
        }
      }
    }
  }

  const lifecycleMatches = text.match(/survives connection restarts|persists across connections and is discarded/g);
  if (lifecycleMatches && lifecycleMatches.length > 3) {
    issues.push(`lifecycle pattern 'survives connection restarts / discarded on end_novel' appears ${lifecycleMatches.length} times — consider consolidating`);
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
        if (/^REQ-\d{3}$/.test(reqId) && (version === "\u2014" || version === "(today)")) {
          issues.push(`${reqId}: Spec version not populated`);
        }
      } else if (!line.trim().startsWith("|")) {
        break;
      }
    }
  }
  return issues;
}

const traceability = process.argv.includes("--traceability");

function generateTraceability(text: string, reqIndex: Map<string, string>): void {
  const reqs = [...reqIndex.keys()].sort();

  const testIds = extractTestIds(text);
  const citedTests = findTestCitations(text);

  console.log("\n=== TRACEABILITY MATRIX ===\n");

  const reqTests = new Map<string, Set<string>>();
  for (const reqId of reqs) {
    reqTests.set(reqId, new Set());
  }

  for (const [tid] of testIds) {
    for (const reqId of reqs) {
      if (text.includes(`${reqId}`) && text.includes(tid)) {
        const reqBody = text.substring(
          text.indexOf(`**${reqId}`),
          text.indexOf(`**${reqId}`) + 500
        );
        if (reqBody.includes(tid)) {
          reqTests.get(reqId)!.add(tid);
        }
      }
    }
  }

  const reqsWithoutTests: string[] = [];
  for (const reqId of reqs) {
    const re = new RegExp(`\\*\\*${reqId.replace(/[a-z]$/, "")}[a-z]?\\s+—\\s+(.+?)\\.\\*\\*`);
    const m = text.match(re);
    const title = m ? m[1] : "";
    const checkMatch = text.slice(text.indexOf(`**${reqId}`), text.indexOf(`**${reqId}`) + 2000).match(/[*_]Check:[*_]\s*(.+)/);
    const checks = checkMatch ? checkMatch[1].trim() : "none";

    if (checks === "none") {
      reqsWithoutTests.push(`${reqId} (${title})`);
    }
  }

  if (reqsWithoutTests.length > 0) {
    console.log(`REQs with no Check: citations (${reqsWithoutTests.length}):`);
    for (const r of reqsWithoutTests) {
      console.log(`  - ${r}`);
    }
  } else {
    console.log("PASS: All REQs have at least one Check: citation");
  }

  console.log("");

  const testReqCount = new Map<string, number>();
  for (const tid of testIds) {
    testReqCount.set(tid, 0);
  }
  for (const [_reqId, tests] of reqTests) {
    for (const tid of tests) {
      testReqCount.set(tid, (testReqCount.get(tid) || 0) + 1);
    }
  }

  const uncitedTestsList = [...testReqCount.entries()]
    .filter(([_, count]) => count === 0)
    .map(([tid]) => tid)
    .sort();

  if (uncitedTestsList.length > 0) {
    console.log(`Test IDs not cited in any REQ body (${uncitedTestsList.length}):`);
    for (const tid of uncitedTestsList) {
      console.log(`  - ${tid}`);
    }
  } else {
    console.log("PASS: All test IDs are cited in at least one REQ body");
  }

  console.log("");

  const gateReqs = new Map<string, Set<string>>();
  const gateNames = ["Gate 0", "Gate 1", "Gate 2", "Gate 2b", "Gate 3", "Gate 4", "Gate 5"];
  const gateSections: { name: string; start: number; end: number }[] = [];

  for (const gate of gateNames) {
    const gateLabel = gate.replace(" ", " ");
    const startIdx = text.indexOf(`**${gateLabel}`);
    if (startIdx !== -1) {
      const endIdx = text.indexOf("\n**Gate", startIdx + 1);
      const effectiveEnd = endIdx !== -1 ? endIdx : text.indexOf("\n---", startIdx);
      gateSections.push({ name: gate, start: startIdx, end: effectiveEnd !== -1 ? effectiveEnd : text.length });
      gateReqs.set(gate, new Set());
    }
  }

  for (const reqId of reqs) {
    for (const { name, start, end } of gateSections) {
      if (text.slice(start, end).includes(reqId)) {
        gateReqs.get(name)!.add(reqId);
      }
    }
  }

  console.log("Gate → REQ coverage:");
  for (const gate of gateNames) {
    const covered = gateReqs.get(gate);
    if (covered) {
      console.log(`  ${gate}: ${covered.size} REQs — ${[...covered].sort().join(", ")}`);
    }
  }

  console.log("");

  const fmTags = [1, 2, 3, 4, 5, 6];
  console.log("Failure mode → preventive REQ count:");
  for (const fm of fmTags) {
    const pattern = new RegExp(`\\(F${fm}\\)`);
    const coveredReqs = reqs.filter((reqId) => pattern.test(text.slice(
      text.indexOf(`**${reqId}`),
      text.indexOf(`**${reqId}`) + 2000
    )));
    console.log(`  F${fm}: ${coveredReqs.length} REQs`);
  }

  console.log("\n=== END TRACEABILITY MATRIX ===\n");
}

function checkCoverageCompleteness(text: string): string[] {
  const issues: string[] = [];

  const toolSection = text.match(/### 5\.2 Tools and Resources[\s\S]*?### 5\.3/);
  if (toolSection) {
    const toolNames = toolSection[0].matchAll(/\b(lookup_\w+|roll_\w+|search_rules|spec_health|character_sheet|create_character|create_novel|end_novel|resume_novel|list_novels|import_character|set_hat|set_active_entity|apply_condition|remove_condition|init_combat|advance_combat|end_combat|set_countdown|advance_countdown|remove_countdown|set_lore_entry|toggle_lore_entry|remove_lore_entry|set_lore_group|suggest_lore|export_lorebook|import_lorebook|set_scene_state|set_scene_type|set_narrative_directive|set_briefing_order|set_personality|set_voice_examples|create_npc|update_npc|remove_npc|session_recap|suggest_actions|compress_audit|generate_adventure|generate_encounter|load_adventure|help|undo|respond|player_signal|roll_on_table|roll_save|roll_skill_check|roll_weapon_attack|roll_weapon_damage|make_panic_check)\b/g);
    for (const tool of toolNames) {
      const cited = text.match(new RegExp(`REQ-\\d{3}.*${tool[0]}`));
      if (!cited) {
        issues.push(`Tool '${tool[0]}' not explicitly cited in any REQ body`);
      }
    }
  }

  const stateTiers = [
    "Roster", "Novel", "Connection", "NPC", "Scene", "Countdown", "Lore", "Enrichment", "Adventure"
  ];
  for (const tier of stateTiers) {
    const inStateTable = text.match(new RegExp(`\\|\\s*${tier}\\s*\\|`));
    if (inStateTable) {
      const hasPersistenceReq = text.includes("REQ-092") || text.includes("REQ-055");
      const hasFilteringReq = text.includes("REQ-032");
      if (!hasPersistenceReq && tier !== "Connection") {
        issues.push(`State tier '${tier}' — no persistence REQ citation found nearby`);
      }
      if (!hasFilteringReq && tier !== "Connection") {
        issues.push(`State tier '${tier}' — no hat-filtering REQ citation found nearby`);
      }
    }
  }

  const layers = ["MCP skeleton", "Index", "Extraction pipeline", "Domain tools", "State", "Prompts"];
  for (const layer of layers) {
    const inLayerTable = text.match(new RegExp(`\\|\\s*\\d+\\s*\\|\\s*${layer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    if (inLayerTable) {
      const hasAcceptance = text.slice(inLayerTable.index!).match(/Acceptance\s*\|/);
      if (!hasAcceptance) {
        issues.push(`Construction layer '${layer}' — no acceptance check in table`);
      }
    }
  }

  return issues;
}

function checkAppendixRange(text: string): string[] {
  const issues: string[] = [];
  const appendixHeadings = [...text.matchAll(/^## Appendix ([A-Z]):/gm)];
  if (appendixHeadings.length === 0) return issues;

  const highestLetter = appendixHeadings
    .map(h => h[1])
    .sort()
    .pop()!;

  let inBlock = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) { inBlock = !inBlock; continue; }
    if (inBlock) continue;
    // skip line if it's the appendix heading itself or the TOC entry line
    if (/^## Appendix [A-Z]/.test(line.trim())) continue;
    if (/- \[Appendix [A-Z]/.test(line.trim())) continue;

    const match = line.match(/Appendices\s+([A-Z])–([A-Z])\b/);
    if (match && match[2] !== highestLetter) {
      issues.push(
        `Line ${i + 1}: stale appendix range "${match[0]}" — actual highest is "Appendix ${highestLetter}"`
      );
    }
  }
  return issues;
}

function checkStaleCounts(text: string): string[] {
  const issues: string[] = [];
  const words = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve";
  const nouns = "metric|phase|step|category|domain|subsection|workflow|property|group|verification";
  const re = new RegExp(
    `\\b(${words})\\s+(${nouns})s?\\s+in\\s+(§\\d|Section\\s+\\d|Appendix\\s+[A-Z])`,
    "gi"
  );

  let inBlock = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) { inBlock = !inBlock; continue; }
    if (inBlock) continue;

    const matches = line.matchAll(re);
    for (const m of matches) {
      issues.push(
        `Line ${i + 1}: hardcoded count "${m[0]}" — verify actual count matches referenced section`
      );
    }
  }
  return issues;
}

function checkStaleGateReferences(text: string): string[] {
  const issues: string[] = [];

  const workflowsStart = text.indexOf("## 8. Verification Workflows");
  if (workflowsStart === -1) return issues;

  const workflowsEnd = text.indexOf("\n## ", workflowsStart + 1);
  const workflowsSection = text.slice(
    workflowsStart,
    workflowsEnd !== -1 ? workflowsEnd : undefined
  );

  const canonicalWorkflows = new Set<string>();
  const tableRe = /\|\s*(G\d+[a-z]?)\s*\|/g;
  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tableRe.exec(workflowsSection)) !== null) {
    canonicalWorkflows.add(tableMatch[1]);
  }
  if (canonicalWorkflows.size === 0) return issues;

  const lines = text.split("\n");
  let inBlock = false;
  let skip = false;
  let staleCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      inBlock = !inBlock;
      continue;
    }
    if (inBlock) continue;

    if (skip) {
      if (/^##\s/.test(line)) skip = false;
      continue;
    }

    if (line.trim() === "## 8. Verification Workflows") {
      skip = true;
      continue;
    }

    const gateMatches = line.matchAll(/Gate\s+(\d+[a-z]?)\b/gi);
    for (const gm of gateMatches) {
      const gateId = "G" + gm[1].toUpperCase();
      if (!canonicalWorkflows.has(gateId)) {
        if (staleCount === 0) {
          issues.push("Stale verification workflow references found:");
        }
        issues.push(
          `  - Line ${i + 1}: "${gm[0]}" — no matching workflow in §8 (canonical: ${[...canonicalWorkflows].sort().join(", ")})`
        );
        staleCount++;
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

  const specViolations = checkSpecViolations(text);
  if (specViolations.length > 0) {
    for (const issue of specViolations) {
      console.log(`WARNING: ${issue}`);
    }
    warnings += specViolations.length;
  } else {
    console.log("PASS: No spec authoring violations detected");
  }

  const staleRefIssues = checkStaleGateReferences(text);
  if (staleRefIssues.length > 0) {
    for (const issue of staleRefIssues) {
      console.log(`WARNING: ${issue}`);
    }
    warnings += staleRefIssues.length;
  }

  const appendixIssues = checkAppendixRange(text);
  if (appendixIssues.length > 0) {
    for (const issue of appendixIssues) {
      console.log(`WARNING: ${issue}`);
    }
    warnings += appendixIssues.length;
  }

  const countIssues = checkStaleCounts(text);
  if (countIssues.length > 0) {
    for (const issue of countIssues) {
      console.log(`WARNING: ${issue}`);
    }
    warnings += countIssues.length;
  }

  if (traceability) {
    generateTraceability(text, reqIndex);

    const coverageIssues = checkCoverageCompleteness(text);
    if (coverageIssues.length > 0) {
      console.log("\n=== COVERAGE COMPLETENESS ===\n");
      for (const issue of coverageIssues) {
        console.log(`WARNING: ${issue}`);
      }
      warnings += coverageIssues.length;
    } else {
      console.log("\n=== COVERAGE COMPLETENESS ===\nPASS: No coverage gaps detected");
    }
  }

  console.log(`\n${errors} error(s), ${warnings} warning(s)`);
  if (errors > 0) {
    process.exit(1);
  }
}

main();
