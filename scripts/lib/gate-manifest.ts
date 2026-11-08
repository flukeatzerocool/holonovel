// gate-manifest.ts — the single gate manifest.
//
// One source of truth for scripts/run-gates.ts (execution),
// scripts/check-gate-table.ts (AGENTS.md drift check), and
// scripts/gate-cost-report.ts (retirement candidates). A gate declares its
// description, its fast/full commands, and an advisory flag used by the
// retirement policy.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Mode = "fast" | "full";

export interface Gate {
  name: string;
  description: string;
  fast: string[] | null;
  full: string[];
  // A gate downgraded by the retirement policy does not fail the run.
  advisory?: boolean;
}

export const npm = (script: string, ...extra: string[]): string[] =>
  extra.length > 0 ? ["npm", "run", script, "--", ...extra] : ["npm", "run", script];

const RAW_GATES: Gate[] = [
  {
    name: "lint",
    description: "Markdown style rules on the assembled spec and README",
    fast: npm("lint"),
    full: npm("lint"),
  },
  {
    name: "validate",
    description: "REQ integrity, shape, ambiguity, cross-references, coverage audit",
    fast: npm("validate:fast"),
    full: npm("validate:sdd"),
  },
  {
    name: "test:validators",
    description: "Self-tests for the REQ validator checks",
    fast: npm("test:validators"),
    full: npm("test:validators"),
  },
  {
    name: "test:spec-tooling",
    description: "Self-tests for spec-delta and assembly tooling",
    fast: npm("test:spec-tooling"),
    full: npm("test:spec-tooling"),
  },
  {
    name: "test:script-tooling",
    description: "Self-tests for the script discipline and quality detectors",
    fast: npm("test:script-tooling"),
    full: npm("test:script-tooling"),
  },
  {
    name: "test:workflows",
    description: "Self-tests for the CI workflow pin and job-hygiene detectors",
    fast: npm("test:workflows"),
    full: npm("test:workflows"),
  },
  {
    name: "test:commit-plan",
    description: "Self-tests for the session commit planner and subject hook",
    fast: npm("test:commit-plan"),
    full: npm("test:commit-plan"),
  },
  {
    name: "test:ruleset-gates",
    description: "Self-tests for the ruleset package gates",
    fast: npm("test:ruleset-gates"),
    full: npm("test:ruleset-gates"),
  },
  {
    name: "test:world-provider",
    description: "Gate the world://kinds provider payload",
    fast: npm("test:world-provider"),
    full: npm("test:world-provider"),
  },
  {
    name: "check-world-provider",
    description: "Generated world-provider document freshness",
    fast: npm("check-world-provider"),
    full: npm("check-world-provider"),
  },
  {
    name: "validate-readme",
    description: "README structure, voice, links, and comparison table",
    fast: npm("validate-readme"),
    full: npm("validate-readme"),
  },
  {
    name: "check-script-discipline",
    description: "Script shebang, role header, exit codes, path and shell rules",
    fast: npm("check-script-discipline"),
    full: npm("check-script-discipline"),
  },
  {
    name: "check-script-quality",
    description: "Reachability, duplicate helpers, repeated parses, parser bypass",
    fast: npm("check-script-quality"),
    full: npm("check-script-quality"),
  },
  {
    name: "check-workflows",
    description: "CI workflow hygiene rules",
    fast: npm("check-workflows"),
    full: npm("check-workflows"),
  },
  {
    name: "check-roadmap",
    description: "ROADMAP.md holds scheduled work only; the Non-goals pointer resolves",
    fast: npm("check-roadmap"),
    full: npm("check-roadmap"),
  },
  {
    name: "check-traceability",
    description: "DECISIONS.md register drift against registered tools",
    fast: npm("check-traceability"),
    full: npm("check-traceability"),
  },
  {
    name: "check-markers",
    description: "README @spec: marker freshness",
    fast: npm("check-markers"),
    full: npm("check-markers"),
  },
  {
    name: "check-registers",
    description: "Review and proofread register structure and dispositions",
    fast: npm("check-registers"),
    full: npm("check-registers:strict"),
  },
  {
    name: "check-fingerprint-sync",
    description: "Committed contract fingerprints match the spec",
    fast: npm("check-fingerprint-sync"),
    full: npm("check-fingerprint-sync"),
  },
  {
    name: "check-tool-definitions-sync",
    description: "Generated tool definitions match their source",
    fast: npm("check-tool-definitions-sync"),
    full: npm("check-tool-definitions-sync"),
  },
  {
    name: "tool-definitions-lint",
    description: "Tool description quality rules",
    fast: npm("tool-definitions-lint"),
    full: npm("tool-definitions-lint"),
  },
  {
    name: "check-tool-surface",
    description: "Tool surface counts match the documented surface",
    fast: npm("check-tool-surface"),
    full: npm("check-tool-surface"),
  },
  {
    name: "surface-budget",
    description: "Tool surface stays inside the declared budget",
    fast: npm("surface-budget"),
    full: npm("surface-budget"),
  },
  {
    name: "surface-replay",
    description: "Recorded surface replays still resolve",
    fast: npm("surface-replay"),
    full: npm("surface-replay"),
  },
  {
    name: "check-performance-record",
    description: "Performance record freshness",
    fast: npm("check-performance-record"),
    full: npm("check-performance-record"),
  },
  {
    name: "check-tdqs-scoreboard",
    description: "TDQS scoreboard consistency",
    fast: npm("check-tdqs-scoreboard"),
    full: npm("check-tdqs-scoreboard"),
  },
  {
    name: "tool-citation-check",
    description: "Tool citations resolve to spec identifiers",
    fast: npm("tool-citation-check"),
    full: npm("tool-citation-check"),
  },
  {
    name: "check-reference-server-cleanliness",
    description: "Reference server stays inside the content boundary",
    fast: npm("check-reference-server-cleanliness"),
    full: npm("check-reference-server-cleanliness"),
  },
  {
    name: "check-vendor-manifest",
    description: "Vendored content hashes match the manifest",
    fast: ["npm", "--prefix", "holonovel", "run", "check:vendor"],
    full: ["npm", "--prefix", "holonovel", "run", "check:vendor"],
  },
  {
    name: "check-starter-freshness",
    description: "Starter Novel artifacts are current",
    fast: npm("check-starter-freshness"),
    full: npm("check-starter-freshness"),
  },
  // Full-gate only: spawns a child per shipped Novel, too slow for check:fast.
  {
    name: "playability",
    description: "Headless playability run for every shipped Novel",
    fast: null,
    full: npm("check-playability"),
  },
  {
    name: "check-package-manifest",
    description: "Published package manifest assertions",
    fast: npm("check-package-manifest"),
    full: npm("check-package-manifest"),
  },
  {
    name: "test:package-manifest",
    description: "Self-tests for the package manifest gate",
    fast: npm("test:package-manifest"),
    full: npm("test:package-manifest"),
  },
  {
    name: "check:conformance",
    description: "Spec-to-code bundle dependence",
    fast: npm("check:conformance"),
    full: npm("check:conformance"),
  },
  {
    name: "action-conflicts",
    description: "Action contract conflicts across tools",
    fast: npm("action-conflicts", "--check"),
    full: npm("action-conflicts", "--check"),
  },
  {
    name: "check-gate-table",
    description: "AGENTS.md gate table matches the manifest",
    fast: npm("check-gate-table"),
    full: npm("check-gate-table"),
  },
  {
    name: "check-loop-artifacts",
    description: "Increment plan/tasks/AAR contract under docs/plans",
    fast: npm("check-loop-artifacts"),
    full: npm("check-loop-artifacts"),
  },
  // Full-tier only: builds scratch repositories, too slow for check:fast.
  {
    name: "test:pipeline",
    description: "Hermetic publication-pipeline harness",
    fast: null,
    full: npm("test:pipeline"),
  },
  {
    name: "typecheck",
    description: "TypeScript type checking",
    fast: npm("typecheck"),
    full: npm("typecheck"),
  },
];

// A gate the retirement policy has downgraded. The decision lives in a
// tracked file so it is reviewable and reversible, and so the manifest stays
// the single source of truth for which gates block a run.
const RETIREMENT_FILE = join(import.meta.dirname, "..", "..", "spec", "audit", "gate-retirement.json");

function retiredGates(): Set<string> {
  if (!existsSync(RETIREMENT_FILE)) return new Set();
  try {
    const parsed = JSON.parse(readFileSync(RETIREMENT_FILE, "utf-8")) as { advisory?: string[] };
    return new Set(parsed.advisory ?? []);
  } catch {
    // A corrupt retirement file must not silently disable gates: treat it as
    // empty so every gate keeps blocking.
    return new Set();
  }
}

const RETIRED = retiredGates();
export const GATES: Gate[] = RAW_GATES.map((gate) => (RETIRED.has(gate.name) ? { ...gate, advisory: true } : gate));

// Markdown table consumed by AGENTS.md and by `run-gates --list --format=md`.
// Kept here so the doc and the runner cannot render it differently.
export function renderMarkdownTable(): string {
  const lines = ["| Gate | fast | full | What it checks |", "|---|---|---|---|"];
  for (const gate of GATES) {
    const advisory = gate.advisory ? " (advisory)" : "";
    lines.push(`| \`${gate.name}\`${advisory} | ${gate.fast ? "yes" : "no"} | yes | ${gate.description} |`);
  }
  return lines.join("\n");
}
