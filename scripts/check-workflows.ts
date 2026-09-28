#!/usr/bin/env npx tsx
/**
 * check-workflows.ts — guardrail for GitHub Actions workflow hygiene. [gate]
 *
 * Static, offline checks over .github/workflows/. It guards the recurrence of
 * two demonstrated failure modes: a Node-runtime action pinned below the
 * Node-24-capable major (the deprecated-runtime warning), and the publish
 * workflow reading MCP Registry state through the eventually-consistent
 * `?search=` listing endpoint — or embedding its own presence probe instead of
 * the shared freshness script — which produced the spurious-republish failure
 * (REQ-428).
 *
 * Usage: npx tsx scripts/check-workflows.ts [--help]
 *
 * Exit codes: 0 = all checks pass, 1 = one or more violations, 2 = unexpected
 * fatal error.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { handleHelp } from "./lib/args.js";

const USAGE = `Usage: npx tsx scripts/check-workflows.ts [--help]

Exit codes: 0 = all checks pass, 1 = one or more violations, 2 = unexpected
fatal error.
`;

handleHelp(process.argv, USAGE);

const root = join(import.meta.dirname, "..");
const workflowsDir = join(root, ".github", "workflows");

// Actions whose major version selects the Node.js runtime GitHub forces them
// to run on. v5 targets Node 24; v4 targets the deprecated Node 20.
const MIN_ACTION_MAJOR: Record<string, number> = {
  "actions/checkout": 5,
  "actions/setup-node": 5,
};

// The publish workflow must read MCP Registry presence through
// scripts/check-registry-publish.ts (deterministic per-server versions
// endpoint), never the eventually-consistent `?search=` listing endpoint.
const REGISTRY_SEARCH_LITERAL = "/v0/servers?search=";
const REGISTRY_SCRIPT = "scripts/check-registry-publish.ts";
const MIN_NODE_MAJOR = 24;

const issues: string[] = [];

function listWorkflows(): string[] {
  const out: string[] = [];
  let entries;
  try {
    entries = readdirSync(workflowsDir, { withFileTypes: true });
  } catch {
    // No workflows directory: nothing to check. Safely ignored — the guard is
    // scoped to whatever workflows exist.
    return out;
  }
  for (const e of entries) {
    if (e.isFile() && /\.ya?ml$/.test(e.name)) out.push(join(workflowsDir, e.name));
  }
  return out.sort();
}

function actionMajor(ref: string): number | null {
  const m = ref.match(/@v?(\d+)(?:\.|$)/);
  return m ? Number(m[1]) : null;
}

function checkFile(file: string): void {
  const rel = file.slice(root.length + 1);
  const content = readFileSync(file, "utf-8");

  for (const line of content.split("\n")) {
    const uses = line.match(/^\s*-?\s*uses:\s*(\S+)\s*$/);
    if (uses) {
      const ref = uses[1]!;
      const name = ref.split("@")[0]!;
      const min = MIN_ACTION_MAJOR[name];
      const major = min === undefined ? null : actionMajor(ref);
      if (min !== undefined && major !== null && major < min) {
        issues.push(
          `${rel}: ${ref} is below the required major; use ${name}@v${min}+ (Node 24 runtime)`,
        );
      }
    }

    const nodeVer = line.match(/^\s*node-version:\s*["']?(\d+)/);
    if (nodeVer) {
      const major = Number(nodeVer[1]);
      if (major < MIN_NODE_MAJOR) {
        issues.push(`${rel}: node-version ${major} is below the required Node ${MIN_NODE_MAJOR}`);
      }
    }
  }

  if (rel.endsWith("publish.yml")) {
    if (content.includes(REGISTRY_SEARCH_LITERAL)) {
      issues.push(
        `${rel}: uses the eventually-consistent MCP Registry '${REGISTRY_SEARCH_LITERAL}' listing endpoint; delegate to ${REGISTRY_SCRIPT}`,
      );
    }
    if (!content.includes(REGISTRY_SCRIPT)) {
      issues.push(
        `${rel}: does not delegate registry presence to ${REGISTRY_SCRIPT} (single source of truth)`,
      );
    }
  }
}

const files = listWorkflows();
if (files.length === 0) {
  issues.push("no workflow files found under .github/workflows/");
}
for (const file of files) checkFile(file);

if (issues.length > 0) {
  for (const issue of issues) console.error(`FAIL: ${issue}`);
  console.error(`\n${issues.length} workflow-hygiene violation(s)`);
  process.exit(1);
}

console.log(`PASS: workflow hygiene — ${files.length} workflow file(s), no violations`);
process.exit(0);
