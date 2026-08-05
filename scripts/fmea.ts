#!/usr/bin/env npx tsx
import { readSpec } from "./lib/parse-spec.js";

function extractFailureModeTags(text: string): Map<number, string> {
  const tags = new Map<number, string>();
  const section = text.split("## 3. How This Build Fails")[1]?.split("---")[0] || "";
  for (const line of section.split("\n")) {
    const m = line.match(/^\|\s*F(\d+)\s*\|(.+?)\|/);
    if (m) {
      tags.set(parseInt(m[1]), m[2].trim());
    }
  }
  return tags;
}

interface ReqInfo {
  id: string;
  title: string;
  body: string;
  checks: string[];
  failureModes: number[];
}

function extractReqs(text: string): ReqInfo[] {
  const reqs: ReqInfo[] = [];
  const failureTags = extractFailureModeTags(text);

  const re = /\*\*(REQ-\d{3}[a-z]?\s+—\s+(.+?))\.\*\*/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const fullHeader = match[1];
    const reqId = fullHeader.match(/^(REQ-\d{3}[a-z]?)/)![1];
    const title = fullHeader.slice(reqId.length).replace(/^—\s*/, "").trim();
    const bodyStart = match.index + match[0].length;
    const rest = text.slice(bodyStart);
    const endMatch = rest.match(/\*\*REQ-\d{3}[a-z]?\s+—|^#{1,4}\s+/m);
    const body = endMatch ? rest.slice(0, endMatch.index!) : rest;

    const checkMatch = body.match(/[*_]Check:[*_]\s*(.+?)(?:\.\s*$|$)/m);
    const checks = checkMatch ? checkMatch[1].split(/;\s*/).map((s) => s.trim()) : [];

    const failuresInBody = body.match(/\(F(\d)\)/g);
    const modes = failuresInBody ? [...new Set(failuresInBody.map((f) => parseInt(f.replace(/[()F]/g, ""))))] : [];

    reqs.push({ id: reqId, title, body, checks, failureModes: modes });
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
