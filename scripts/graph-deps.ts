#!/usr/bin/env npx tsx
/**
 * graph-deps.ts — REQ dependency graph. [informational]
 *
 * Emits a DOT/Graphviz digraph of REQ citation edges to stdout. Exit codes:
 * 0 always.
 */
import { readSpec, extractReqBodies } from "./lib/parse-spec.js";

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
