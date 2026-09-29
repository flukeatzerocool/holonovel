#!/usr/bin/env npx tsx
/**
 * tool-citation-check.ts — spec↔registry citation conformance. [gate]
 *
 * Every `tool (action: …)` binding cited in a REQ normative body must resolve
 * to a registered host tool and action. This catches the drift class where a
 * tool is merged, renamed, or has an action removed but the spec still cites
 * the old name — the exact failure mode of the index/graph consolidation
 * (REQ-429, REQ-413). Bindings whose tool does not use a host verb are skipped
 * (ruleset-derived tools such as `lookup_*` are package-provided).
 *
 * Reads the committed snapshot `holonovel/tool-definitions.json` (W5a) and the
 * assembled `holonovel.md`, so it runs without booting the server. Exit codes:
 * 0 = all host citations resolve, 1 = unresolved citation(s), 2 = fatal
 * (missing artifact or spec).
 *
 * Flags: `--json` (machine-readable payload to stdout).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readSpec, extractActionBindings } from "./lib/parse-spec.js";

const ROOT = join(import.meta.dirname, "..");
const ARTIFACT = join(ROOT, "holonovel", "tool-definitions.json");
const HOST_VERB_RE = /^(manage|resolve|run|respond|set)_/;

interface Artifact { tools: { name: string; action_enum: string[] }[]; }

if (!existsSync(ARTIFACT)) {
  console.error(`FATAL: ${ARTIFACT} not found — run \`npx tsx holonovel/scripts/generate-tool-definitions.ts\`.`);
  process.exit(2);
}
let artifact: Artifact;
try { artifact = JSON.parse(readFileSync(ARTIFACT, "utf-8")); }
catch (e) { console.error(`FATAL: tool-definitions.json is not valid JSON: ${(e as Error).message}`); process.exit(2); }

const byName = new Map(artifact.tools.map((t) => [t.name, t]));
const violations: { req: string; tool: string; action: string; reason: string }[] = [];

for (const b of extractActionBindings(readSpec())) {
  if (!HOST_VERB_RE.test(b.tool)) continue; // ruleset-derived tools are package-provided
  const tool = byName.get(b.tool);
  if (!tool) {
    violations.push({ req: b.reqId, tool: b.tool, action: b.action, reason: "tool is not registered" });
  } else if (b.action && !tool.action_enum.includes(b.action)) {
    violations.push({ req: b.reqId, tool: b.tool, action: b.action, reason: `action not in enum [${tool.action_enum.join(", ")}]` });
  }
}

if (process.argv.slice(2).includes("--json")) {
  process.stdout.write(JSON.stringify({ violations }, null, 2) + "\n");
  process.exit(violations.length === 0 ? 0 : 1);
}

if (violations.length > 0) {
  for (const v of violations) console.error(`FAIL: ${v.req} cites ${v.tool} (action: ${v.action}) — ${v.reason}`);
  console.error(`\n${violations.length} unresolved tool citation(s)`);
  process.exit(1);
}

console.log("PASS: every host tool citation in the spec resolves to a registered tool and action");
process.exit(0);
