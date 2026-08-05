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

function checkCitations(text: string): string[] {
  const issues: string[] = [];
  const arxiv = text.match(/\(arXiv:\d{4}\.\d{4,5}\)|\(arXiv:\d{4}\.\d{4,5}\)/g);
  if (arxiv) {
    for (const c of arxiv) {
      issues.push(`Unverifiable citation: ${c} — verify or replace with stated rationale`);
    }
  }
  return issues;
}

function checkPrefixNumbers(text: string): string[] {
  const issues: string[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("```") || line.startsWith("|") || line.startsWith("-") || line.startsWith("*")) continue;
    if (line.startsWith("#") || line.length === 0) continue;
    if (!line.match(/^\d+\s+/) && !line.startsWith("- [") && !line.startsWith(">")) continue;
  }
  return issues;
}

function checkMagicNumbers(text: string): string[] {
  const issues: string[] = [];
  const patterns: { pattern: RegExp; label: string }[] = [
    { pattern: /\b(10|5|3)\s*(mechanical|extract|chunk|section)/i, label: "chunk/attempt count" },
    { pattern: /(cold start|startup).*≤\s*(\d+)\s*seconds/i, label: "startup threshold" },
    { pattern: /\b(200|1000)\s*(indexed|mechanical|sections|items)/i, label: "indexed-item threshold" },
  ];
  for (const { pattern, label } of patterns) {
    const matches = text.matchAll(new RegExp(pattern.source, "gi"));
    for (const m of matches) {
      const ctx = text.slice(Math.max(0, (m.index ?? 0) - 40), (m.index ?? 0) + (m[0]?.length ?? 0) + 40);
      if (!/because|rationale|basis|empirical|measured|calibrated/i.test(ctx)) {
        issues.push(`Magic number without justification (${label}): "${m[0]}" near: ...${ctx.replace(/\n/g, " ")}...`);
        break;
      }
    }
  }
  return issues;
}

function checkAbsoluteLanguage(text: string): string[] {
  const issues: string[] = [];
  const lines = text.split("\n");
  let inReq = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\*\*REQ-\d{3}/.test(line)) inReq = true;
    if (inReq && /_Check:|_Check:|$/.test(line) && !/\*\*REQ-/.test(line)) continue;
    if (!inReq && line.trim().startsWith("##")) inReq = false;
    if (inReq) continue;
    if (line.includes("`") || line.startsWith("|") || line.startsWith("#") || line.startsWith(">") || line.startsWith("- ")) continue;
    const absMatch = line.match(/\b(must always|can never|the only|without exception)\b/gi);
    if (absMatch) {
      issues.push(`Line ${i + 1}: absolute language — "${absMatch[0]}" — consider qualification`);
    }
  }
  return issues;
}

function checkUntieredThresholds(text: string): string[] {
  const issues: string[] = [];
  const unqualified = text.matchAll(/(?<!Light|Standard|Heavy|Huge|tiered\s)≥\s*(80|90)\%/g);
  for (const m of unqualified) {
    if (m.index === undefined) continue;
    const ctx = text.slice(Math.max(0, m.index - 80), m.index + 40).replace(/\n/g, " ");
    if (!/tier|complexity|REQ-100|Light|Standard|Heavy|Huge/i.test(ctx)) {
      issues.push(`Untiered threshold: "≥ ${m[1]}%" may need tiering per REQ-100. Context: ...${ctx}...`);
    }
  }
  return issues;
}

function main(): void {
  const text = readSpec();
  let warnings = 0;

  const checks: { name: string; fn: (t: string) => string[] }[] = [
    { name: "Citations", fn: checkCitations },
    { name: "Magic numbers", fn: checkMagicNumbers },
    { name: "Absolute language", fn: checkAbsoluteLanguage },
    { name: "Untiered thresholds", fn: checkUntieredThresholds },
  ];

  for (const { name, fn } of checks) {
    const issues = fn(text);
    if (issues.length > 0) {
      for (const issue of issues) {
        console.log(`WARNING: [${name}] ${issue}`);
      }
      warnings += issues.length;
    }
  }

  if (warnings === 0) {
    console.log("PASS: No structural assumption patterns detected");
  }
  console.log(`\n${warnings} warning(s)`);
  process.exit(0);
}

main();
