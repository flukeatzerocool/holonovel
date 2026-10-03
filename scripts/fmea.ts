#!/usr/bin/env npx tsx
/**
 * fmea.ts — REQ-level failure mode and effects skeleton. [informational]
 *
 * Maps each REQ to the failure-mode tags (F1..Fn) it prevents. Exit codes: 0
 * always.
 */
import { readSpec, extractReqEntries } from "./lib/parse-spec.js";

interface ReqInfo {
  id: string;
  title: string;
  body: string;
  checks: string[];
  failureModes: number[];
}

function extractReqs(text: string): ReqInfo[] {
  const reqs: ReqInfo[] = [];
  for (const { id, title, body } of extractReqEntries(text).values()) {
    const checkMatch = body.match(/[*_]Check:[*_]\s*(.+?)(?:\.\s*$|$)/m);
    const checks = checkMatch ? checkMatch[1].split(/;\s*/).map((s) => s.trim()) : [];

    const failuresInBody = body.match(/\(F(\d)\)/g);
    const modes = failuresInBody ? [...new Set(failuresInBody.map((f) => parseInt(f.replace(/[()F]/g, ""))))] : [];

    reqs.push({ id, title, body, checks, failureModes: modes });
  }
  return reqs;
}

function severity(req: ReqInfo): number {
  if (req.failureModes.includes(1)) return 5;
  if (req.failureModes.includes(3)) return 4;
  if (req.failureModes.includes(5)) return 4;
  if (req.failureModes.length > 0) return 3;
  return 3;
}

function main(): void {
  const text = readSpec();
  const reqs = extractReqs(text);
  let highSeverityNoDetection = 0;

  const header = "| REQ | Title | Severity | Detection | FM Tags |";
  const sep = "| --- | --- | --- | --- | --- |";
  const rows: string[] = [header, sep];

  for (const req of reqs) {
    const sev = severity(req);
    const detection = req.checks.length > 0 ? req.checks.join("; ") : "**UNDETECTED**";
    const fmTags = req.failureModes.length > 0 ? req.failureModes.map((f) => `F${f}`).join(", ") : "—";

    if (sev >= 4 && req.checks.length === 0) {
      highSeverityNoDetection++;
      console.log(`WARNING: ${req.id} — severity ${sev} with no detection coverage (title: "${req.title}")`);
    }

    rows.push(`| ${req.id} | ${req.title} | ${sev} | ${detection} | ${fmTags} |`);
  }

  console.log(rows.join("\n"));
  console.log(`\n${reqs.length} REQs analyzed`);
  console.log(`${highSeverityNoDetection} high-severity REQ(s) with no detection coverage`);

  process.exit(0);
}

main();
