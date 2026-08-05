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

function extractReqBodies(text: string): Map<string, { id: string; body: string }> {
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

interface Pattern {
  label: string;
  regex: RegExp;
  severity: string;
}

function checkAmbiguity(text: string): { reqId: string; label: string; match: string; context: string; severity: string }[] {
  const issues: { reqId: string; label: string; match: string; context: string; severity: string }[] = [];
  const reqs = extractReqBodies(text);

  const patterns: Pattern[] = [
    { label: "vague qualifier", regex: /\b(appropriate|suitable|reasonable|proper)(?:\s+level|\s+amount)?\b/gi, severity: "medium" },
    { label: "hedge word", regex: /\b(typically|generally|usually|normally|often)\b/gi, severity: "low" },
    { label: "unbounded extension", regex: /\b(as needed|if necessary|when required)\b/gi, severity: "high" },
    { label: "should (non-REQ, non-MUST context)", regex: /\bshould\b/gi, severity: "medium" },
    { label: "or equivalent", regex: /\bor equivalent\b/gi, severity: "high" },
    { label: "sufficiently", regex: /\bsufficiently\b/gi, severity: "low" },
  ];

  for (const [reqId, { body }] of reqs) {
    for (const { label, regex, severity } of patterns) {
      for (const m of body.matchAll(new RegExp(regex.source, regex.flags))) {
        const ctx = body.slice(Math.max(0, (m.index ?? 0) - 30), (m.index ?? 0) + (m[0]?.length ?? 0) + 30).replace(/\n/g, " ");
        issues.push({ reqId, label, match: m[0], context: `...${ctx}...`, severity });
      }
    }
  }

  return issues;
}

function main(): void {
  const text = readSpec();
  const issues = checkAmbiguity(text);

  if (issues.length === 0) {
    console.log("PASS: No ambiguous or hedging language detected in REQ bodies");
  } else {
    const byLabel = new Map<string, typeof issues>();
    for (const issue of issues) {
      const list = byLabel.get(issue.label) || [];
      list.push(issue);
      byLabel.set(issue.label, list);
    }

    for (const [label, items] of byLabel) {
      for (const item of items) {
        console.log(`WARNING: [${item.severity}] ${item.reqId} — ${label}: "${item.match}" ${item.context}`);
      }
    }
  }

  console.log(`\n${issues.length} finding(s)`);
  process.exit(0);
}

main();
