#!/usr/bin/env npx tsx
/**
 * surface-budget.ts — deterministic catalog-budget measurement for the Tool
 * Surface Contract (REQ-571, Appendix T.3). [gate]
 *
 * Projects the committed tool snapshot through each intent group and profile,
 * measures the serialized UTF-8 size under the pinned estimator (bytes / 4),
 * and enforces the recorded budgets: `standard` at most half the full baseline
 * and `small` at most one tenth. `--write` records the baseline beside the
 * coverage register for the later model-replay harness (REQ-569).
 *
 * Flags: --check (default; fail on over-budget), --write (record baseline),
 * --json (machine-readable to stdout). Exit codes: 0 = pass, 1 = over budget
 * or usage error, 2 = fatal (missing/unreadable artifact).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SURFACE_GLOBALS, entryTools, toolGroups } from "./lib/surface.js";

const ROOT = join(import.meta.dirname, "..");
const DEFS = join(ROOT, "holonovel", "tool-definitions.json");
const REGISTRY = join(ROOT, "holonovel", "tool-surface-registry.json");
const BASELINE = join(ROOT, "spec", "audit", "tool-surface-baseline.json");

interface ToolDefinition {
  name: string;
  title?: string;
  description?: string;
  action_enum?: string[];
}
interface Declaration {
  group: string;
  entry: boolean;
}
interface Registry {
  taxonomy: { groups: string[] };
  actions: Record<string, Declaration>;
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
function tokensFor(value: unknown): number {
  return Math.ceil(Buffer.byteLength(JSON.stringify(value), "utf8") / 4);
}
const defs = readJson<{ tools: ToolDefinition[]; tools_list_bytes?: number }>(DEFS);
const registry = readJson<Registry>(REGISTRY);
const byName = new Map(defs.tools.map((tool) => [tool.name, tool]));
const full = defs.tools;
const fullTokens = tokensFor(full);
const budgets = {
  standard: Math.ceil(fullTokens / 2),
  small: Math.ceil(fullTokens / 10),
};

const groups = registry.taxonomy.groups.map((group) => {
  const members = full.filter((tool) => toolGroups(registry, tool.name).has(group));
  const entries = entryTools(registry, group)
    .map((name) => byName.get(name))
    .filter((tool): tool is ToolDefinition => !!tool);
  const standard = [...new Map([...members, ...[...SURFACE_GLOBALS].map((n) => byName.get(n))]
    .filter((tool): tool is ToolDefinition => !!tool)
    .map((tool) => [tool.name, tool])).values()];
  const small = [...new Map([...entries, ...[...SURFACE_GLOBALS].map((n) => byName.get(n))]
    .filter((tool): tool is ToolDefinition => !!tool)
    .map((tool) => [tool.name, tool])).values()];
  // Tier 0 is the small profile: name, group, and one-line purpose only.
  const tier0 = small.map((tool) => ({
    name: tool.name,
    group: [...toolGroups(registry, tool.name)][0] ?? null,
    purpose: (tool.description ?? "").split(".")[0] + ".",
  }));
  return {
    group,
    tools: members.length,
    standard_tools: standard.length,
    standard_tokens: tokensFor(standard),
    small_tools: small.length,
    small_tokens: tokensFor(tier0),
  };
});

const worstStandard = Math.max(...groups.map((group) => group.standard_tokens));
const worstSmall = Math.max(...groups.map((group) => group.small_tokens));
const defects: string[] = [];
if (worstStandard > budgets.standard) {
  defects.push(
    `standard projection ${worstStandard} tokens exceeds budget ${budgets.standard}`,
  );
}
if (worstSmall > budgets.small) {
  defects.push(`small projection ${worstSmall} tokens exceeds budget ${budgets.small}`);
}

const payload = {
  schema_version: 1,
  estimator: "utf8-bytes-div-4-ceil",
  baseline: {
    tools: full.length,
    actions: Object.keys(registry.actions).length,
    full_tokens: fullTokens,
    tools_list_bytes: defs.tools_list_bytes ?? 0,
  },
  budgets,
  worst_case: { standard_tokens: worstStandard, small_tokens: worstSmall },
  groups,
  defects,
};

if (process.argv.includes("--write")) {
  writeFileSync(BASELINE, JSON.stringify(payload, null, 2) + "\n");
  console.log(`surface-budget: wrote ${BASELINE}`);
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(payload, null, 2));
} else if (defects.length) {
  console.error("[surface-budget] budget defects:");
  for (const defect of defects) console.error(`  - ${defect}`);
} else {
  console.log(
    `surface-budget: PASS — full ${fullTokens} tokens; ` +
      `standard ${worstStandard}/${budgets.standard}; ` +
      `small ${worstSmall}/${budgets.small}`,
  );
}

process.exit(defects.length === 0 ? 0 : 1);
