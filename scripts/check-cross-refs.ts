#!/usr/bin/env npx tsx
import { readSpec, extractReqBodies } from "./lib/parse-spec.js";

interface ReqSection {
  reqId: string;
  section: string;
  body: string;
  cites: string[];
}

function parseManifest(text: string): Set<string> {
  const manifest = new Set<string>();
  const startIdx = text.indexOf("## Appendix E: Requirements Manifest");
  if (startIdx < 0) return manifest;
  const rest = text.slice(startIdx);
  const endMatch = rest.slice("## Appendix E: Requirements Manifest".length).match(/\n##\s/);
  const section = endMatch ? rest.slice(0, rest.indexOf(endMatch[0])) : rest;
  for (const line of section.split("\n")) {
    const m = line.match(/^\|\s*(REQ-\d{3}[a-z]?)\b/);
    if (m) manifest.add(m[1]);
  }
  return manifest;
}

function sectionNameForReq(reqId: string, text: string): string {
  const sections = text.match(/^### (5\.\d+ .+)$/gm) || [];
  const reqIdx = text.indexOf(`**${reqId}`);
  if (reqIdx < 0) return "unknown";

  let nearest = "unknown";
  for (const sec of sections.reverse()) {
    const secIdx = text.indexOf(sec);
    if (secIdx < reqIdx) {
      nearest = sec.replace(/^### /, "");
      break;
    }
  }
  return nearest;
}

function extractCites(body: string): string[] {
  const re = /\bREQ-\d{3}[a-z]?\b/g;
  const found = body.match(re) || [];
  return [...new Set(found)];
}

function main(): void {
  const text = readSpec();
  const reqBodies = extractReqBodies(text);
  const manifest = parseManifest(text);
  const reqs: ReqSection[] = [];

  for (const [id, { body }] of reqBodies) {
    const cites = extractCites(body);
    reqs.push({
      reqId: id,
      section: sectionNameForReq(id, text),
      body,
      cites,
    });
  }

  const allIds = new Set(reqs.map((r) => r.reqId));
  const citedBy: Map<string, string[]> = new Map();
  for (const r of reqs) {
    for (const cite of r.cites) {
      if (!citedBy.has(cite)) citedBy.set(cite, []);
      citedBy.get(cite)!.push(r.reqId);
    }
  }

  let fatalErrors = 0;
  let warnings = 0;

  // Fatal: dead citations — REQ cited that doesn't exist as a REQ block
  for (const r of reqs) {
    for (const cite of r.cites) {
      if (!allIds.has(cite)) {
        console.log(`FATAL: ${r.reqId} cites ${cite} which does not exist in the specification`);
        fatalErrors++;
      }
    }
  }

  // Fatal: REQ block exists in body but missing from manifest
  for (const r of reqs) {
    if (!manifest.has(r.reqId)) {
      console.log(`FATAL: ${r.reqId} has a REQ block in the spec body but is missing from the Appendix E manifest`);
      fatalErrors++;
    }
  }

  // Warning: divergent scope (one-way cross-section citations)
  const citePairsSeen = new Set<string>();
  for (const r of reqs) {
    for (const cite of r.cites) {
      if (!allIds.has(cite)) continue;
      const pair = [r.reqId, cite].sort().join("↔");
      if (citePairsSeen.has(pair)) continue;
      citePairsSeen.add(pair);

      const citingSection = r.section;
      const citedSection = sectionNameForReq(cite, text);
      if (citingSection !== citedSection && citingSection !== "unknown" && citedSection !== "unknown") {
        const hasReciprocal = (citedBy.get(r.reqId) || []).includes(cite);
        if (!hasReciprocal) {
          warnings++;
        }
      }
    }
  }

  // Warning: orphaned REQs
  const knownRoots = new Set(["REQ-001", "REQ-010", "REQ-020", "REQ-030", "REQ-050", "REQ-088", "REQ-092", "REQ-109"]);
  for (const r of reqs) {
    const inbound = citedBy.get(r.reqId) || [];
    if (inbound.length === 0 && !knownRoots.has(r.reqId)) {
      warnings++;
    }
  }

  console.log(`\n${reqs.length} REQs analyzed — ${fatalErrors} fatal error(s), ${warnings} warning(s)`);
  process.exit(fatalErrors > 0 ? 1 : 0);
}

main();

