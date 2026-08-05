#!/usr/bin/env npx tsx
import { readSpec } from "./lib/parse-spec.js";

function main(): void {
  const text = readSpec();
  const lines = text.split("\n");

  const reqCount = (text.match(/\*\*REQ-\d{3}[a-z]?\s+—/g) || []).length;
  const testCount = (text.match(/^\|\s*(T\d+[a-z]?)\s*\|/gm) || []).length;
  const lineCount = lines.length;

  const citMatch = text.matchAll(/\b(REQ-\d{3}[a-z]?)\b/g);
  const citations = new Set(Array.from(citMatch, (m) => m[1]));

  const crossRefDensity = reqCount > 0 ? (citations.size / reqCount).toFixed(1) : "N/A";
  const testPerReq = reqCount > 0 ? (testCount / reqCount).toFixed(1) : "N/A";

  const headingCount = (text.match(/^#{2,4}\s+/gm) || []).length;
  const tableCount = (text.match(/^\|.+\|.+\|$/gm) || []).length;
  const codeBlockCount = (text.match(/^```/gm) || []).length / 2;

  console.log("=== Holonovel Spec Health Trends ===");
  console.log(`REQs:            ${reqCount}`);
  console.log(`Tests:           ${testCount}`);
  console.log(`Lines:           ${lineCount}`);
  console.log(`Headings:        ${headingCount}`);
  console.log(`Tables:          ${tableCount}`);
  console.log(`Code blocks:     ${codeBlockCount}`);
  console.log(`Unique REQ cites: ${citations.size}`);
  console.log(`Cross-ref density: ${crossRefDensity} cites/REQ`);
  console.log(`Test coverage:   ${testPerReq} tests/REQ`);
  console.log("");
  console.log("Compare these numbers across spec revisions to detect complexity drift.");
  console.log("Trends to watch: REQ growth without proportional test growth,");
  console.log("line count inflation, cross-reference density spikes.");

  process.exit(0);
}

main();
