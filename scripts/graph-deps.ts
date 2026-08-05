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

function main(): void {
  const text = readSpec();
  const reqs = extractReqBodies(text);

  const edges: [string, string][] = [];
  for (const [srcId, { body }] of reqs) {
    for (const [tgtId] of reqs) {
      if (srcId === tgtId) continue;
      const escaped = tgtId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`\\b${escaped}\\b`).test(body)) {
        edges.push([srcId, tgtId]);
      }
    }
  }

  console.log("digraph REQ_Dependencies {");
  console.log('  rankdir=LR;');
  console.log('  node [shape=box, style=rounded];');

  const cited = new Set(edges.map(([_, tgt]) => tgt));
  const citedBy = new Map<string, string[]>();
  for (const [src, tgt] of edges) {
    const list = citedBy.get(src) || [];
    list.push(tgt);
    citedBy.set(src, list);
  }

  const allIds = [...reqs.keys()].sort();

  for (const id of allIds) {
    const isSource = citedBy.has(id);
    const isTarget = cited.has(id);
    if (isSource && isTarget) console.log(`  "${id}" [color=blue];`);
    else if (isSource && !isTarget) console.log(`  "${id}" [color=green];`);
    else if (!isSource && isTarget) console.log(`  "${id}" [color=red];`);
    else console.log(`  "${id}" [color=gray, style="rounded,dashed"];`);
  }

  for (const [src, tgt] of edges) {
    console.log(`  "${src}" -> "${tgt}";`);
  }

  console.log("}");

  const orphaned = allIds.filter((id) => !cited.has(id) && !citedBy.has(id));
  const sources = allIds.filter((id) => citedBy.has(id) && !cited.has(id));
  const sinks = allIds.filter((id) => cited.has(id) && !citedBy.has(id));

  console.error(`\n# Graph stats: ${reqs.size} REQs, ${edges.length} edges`);
  console.error(`# Orphaned (no citations in/out): ${orphaned.length}`);
  console.error(`# Source-only (cited by no one): ${sources.length}`);
  console.error(`# Sink-only (cites no one): ${sinks.length}`);

  process.exit(0);
}

main();
