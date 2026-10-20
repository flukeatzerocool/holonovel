#!/usr/bin/env npx tsx
/**
 * surface-budget.ts — deterministic catalog-budget measurement for the Tool
 * Surface Contract (REQ-571, Appendix T.3). [gate]
 *
 * Reads the measured `surface_footprint` recorded in `tool-definitions.json`
 * (full, standard, and per-group small projections under the pinned
 * UTF-8-bytes/4 estimator), enforces the recorded budgets (`standard` at most
 * 90% of the full baseline; `small` at most one tenth), and verifies the
 * recorded baseline is fresh. `--write` re-records the baseline beside the
 * coverage register for the replay harness (REQ-569).
 *
 * Flags: --check (default; fail on over-budget or stale baseline), --write
 * (record baseline), --json (machine-readable to stdout), --help.
 * Exit codes: 0 = pass, 1 = over budget or usage error, 2 = fatal
 * (missing/unreadable artifact).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { surfaceAliases, type SurfaceRegistryLike } from "./lib/surface.js";

const ROOT = join(import.meta.dirname, "..");
const DEFS = join(ROOT, "holonovel", "tool-definitions.json");
const REGISTRY = join(ROOT, "holonovel", "tool-surface-registry.json");
const BASELINE = join(ROOT, "spec", "audit", "tool-surface-baseline.json");

interface CatalogSize {
  tools: number;
  bytes: number;
  tokens: number;
}
interface Footprint {
  estimator: string;
  profiles: {
    full: CatalogSize;
    standard: CatalogSize;
    small: CatalogSize & { groups: Record<string, CatalogSize> };
  };
}
interface Artifact {
  tools_list_bytes?: number;
  surface_footprint?: Footprint;
}
interface Registry extends SurfaceRegistryLike {
  taxonomy: { groups: string[] };
}

const ARGV = process.argv.slice(2);
const KNOWN = new Set(["--check", "--write", "--json", "--help", "-h"]);
for (const arg of ARGV) {
  if (!KNOWN.has(arg)) {
    console.error(`[surface-budget] unknown flag: ${arg}`);
    process.exit(1);
  }
}
if (ARGV.includes("--help") || ARGV.includes("-h")) {
  console.log("surface-budget — enforce catalog budgets and baseline freshness\n");
  console.log("Usage: npx tsx scripts/surface-budget.ts [--check] [--write] [--json]\n");
  console.log("  --check  fail on over-budget or stale baseline (default)");
  console.log("  --write  re-record spec/audit/tool-surface-baseline.json");
  console.log("  --json   machine-readable payload to stdout");
  process.exit(0);
}

function fail(message: string): never {
  console.error(`[surface-budget] ${message}`);
  process.exit(2);
}
function readJson<T>(path: string): T {
  if (!existsSync(path)) fail(`missing artifact: ${path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    fail(`unreadable JSON: ${path}`);
  }
}

const artifact = readJson<Artifact>(DEFS);
const registry = readJson<Registry>(REGISTRY);
const footprint = artifact.surface_footprint;
if (!footprint) fail("tool-definitions.json is missing surface_footprint — run `npm run build-order`");

const full = footprint.profiles.full;
const standard = footprint.profiles.standard;
const small = footprint.profiles.small;
const budgets = {
  standard: Math.ceil(full.tokens * 0.9),
  small: Math.ceil(full.tokens * 0.1),
};

const defects: string[] = [];
if (standard.tokens > budgets.standard) {
  defects.push(`standard projection ${standard.tokens} tokens exceeds budget ${budgets.standard}`);
}
if (small.tokens > budgets.small) {
  defects.push(`small projection ${small.tokens} tokens exceeds budget ${budgets.small}`);
}

const declared = Object.values(registry.actions);
const canonicalActions = declared.filter((decl) => !decl.compatibility).length;
const compatibilityActions = declared.filter((decl) => !!decl.compatibility).length;
const byTool = new Map<string, string[]>();
for (const key of Object.keys(registry.actions)) {
  const tool = key.includes(".") ? key.slice(0, key.indexOf(".")) : key;
  const keys = byTool.get(tool) ?? [];
  keys.push(key);
  byTool.set(tool, keys);
}
const canonicalTools = new Set(
  [...byTool].filter(([, keys]) => keys.some((key) => !registry.actions[key].compatibility)).map(([tool]) => tool),
);
const compatibilityTools = new Set(
  [...byTool].filter(([, keys]) => keys.every((key) => !!registry.actions[key].compatibility)).map(([tool]) => tool),
);

const groups = registry.taxonomy.groups.map((group) => {
  const measured = small.groups[group] ?? { tools: 0, bytes: 0, tokens: 0 };
  return {
    group,
    tools: measured.tools,
    standard_tools: standard.tools,
    standard_tokens: standard.tokens,
    small_tools: measured.tools,
    small_tokens: measured.tokens,
  };
});

const payload = {
  schema_version: 1,
  estimator: footprint.estimator,
  baseline: {
    tools: full.tools,
    actions: Object.keys(registry.actions).length,
    canonical_tools: canonicalTools.size,
    canonical_actions: canonicalActions,
    compatibility_tools: compatibilityTools.size,
    compatibility_actions: compatibilityActions,
    aliases: surfaceAliases(registry),
    full_tokens: full.tokens,
    tools_list_bytes: artifact.tools_list_bytes ?? 0,
  },
  measurements: { full, standard, small },
  budgets,
  worst_case: { standard_tokens: standard.tokens, small_tokens: small.tokens },
  groups,
  defects,
};

if (ARGV.includes("--write")) {
  writeFileSync(BASELINE, JSON.stringify(payload, null, 2) + "\n");
  console.log(`surface-budget: wrote ${BASELINE}`);
  process.exit(0);
}

// Freshness: the recorded baseline must match the committed footprint.
if (!existsSync(BASELINE)) {
  defects.push("baseline is missing — run `npm run surface-budget -- --write`");
} else {
  const baseline = readJson<{ measurements?: unknown }>(BASELINE);
  const recorded = JSON.stringify(baseline.measurements);
  const measured = JSON.stringify(payload.measurements);
  if (recorded !== measured) {
    defects.push("baseline is stale — the measured footprint changed; run `npm run surface-budget -- --write`");
  }
}

if (ARGV.includes("--json")) {
  console.log(JSON.stringify(payload, null, 2));
} else if (defects.length) {
  console.error("[surface-budget] budget defects:");
  for (const defect of defects) console.error(`  - ${defect}`);
} else {
  console.log(
    `surface-budget: PASS — full ${full.tokens} tokens; ` +
      `standard ${standard.tokens}/${budgets.standard}; ` +
      `small ${small.tokens}/${budgets.small}`,
  );
}

process.exit(defects.length === 0 ? 0 : 1);
