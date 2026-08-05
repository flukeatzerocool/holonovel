#!/usr/bin/env npx tsx
import { readSpec, extractReqBodies } from "./lib/parse-spec.js";

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
