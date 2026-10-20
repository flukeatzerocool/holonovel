#!/usr/bin/env npx tsx
/**
 * check-tool-surface.ts — static enforcement of the Tool Surface Contract
 * (REQ-567, Appendix T.3) over the committed registry and the live tool
 * snapshot. [gate]
 *
 * Checks that every registered action resolves to exactly one intent-group
 * declaration, that every declaration names a registered action, that groups,
 * phases, and mutation classes use the contract vocabularies, that each core
 * group has exactly one entry action, and that no group is over- or
 * under-balanced. Deterministic; reads only committed files.
 *
 * Exit codes: 0 = conformant, 1 = defects, 2 = fatal (missing/unreadable
 * artifact). Flags: `--json` (machine-readable payload to stdout), `--defs`
 * and `--registry` (override the committed artifact paths; used by the T660
 * fixture tests), `--help`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CORE_TOOL_GROUPS, CORE_TOOL_PHASES } from "../holonovel/src/rulesets.js";
import { parseValueFlag, handleHelp } from "./lib/args.js";

const USAGE = `Usage: npx tsx scripts/check-tool-surface.ts [--json] [--defs FILE] [--registry FILE] [--help]

Exit codes: 0 = conformant, 1 = defects, 2 = fatal (missing/unreadable artifact).
`;

const ARGV = process.argv.slice(2);
handleHelp(ARGV, USAGE);

const VALUE_FLAGS = new Set(["--defs", "--registry"]);
const BOOLEAN_FLAGS = new Set(["--json", "--help", "-h"]);
for (const arg of ARGV) {
  if (!arg.startsWith("-") || VALUE_FLAGS.has(arg) || BOOLEAN_FLAGS.has(arg)) continue;
  console.error(`[check-tool-surface] unknown flag: ${arg}`);
  process.exit(1);
}
for (const flag of VALUE_FLAGS) {
  const i = ARGV.indexOf(flag);
  if (i !== -1 && (ARGV[i + 1] === undefined || ARGV[i + 1].startsWith("--"))) {
    console.error(`[check-tool-surface] ${flag} requires a file path`);
    process.exit(1);
  }
}

const ROOT = join(import.meta.dirname, "..");
const DEFS = parseValueFlag(ARGV, "--defs") ?? join(ROOT, "holonovel", "tool-definitions.json");
const REGISTRY = parseValueFlag(ARGV, "--registry") ?? join(ROOT, "holonovel", "tool-surface-registry.json");
const MIN_TOOLS_PER_GROUP = 2;
const MAX_TOOLS_PER_GROUP = 10;

interface ToolDefinition {
  name: string;
  action_enum?: string[];
}

interface HiddenAlias {
  name: string;
  kind: "tool" | "action";
  replacement: string;
  action_enum?: string[];
}

interface Declaration {
  group: string;
  phases: string[];
  entry: boolean;
  mutation_class: string;
  ruleset: string | null;
  preconditions: string[];
  successors: string[];
  edges: string[];
  compatibility?: { replacement: string; retired?: boolean };
}

interface Registry {
  schema_version: number;
  taxonomy: {
    groups: string[];
    phases: string[];
    mutation_classes: string[];
  };
  actions: Record<string, Declaration>;
}

function fail(message: string): never {
  console.error(`[check-tool-surface] ${message}`);
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

const defs = readJson<{
  tools: ToolDefinition[];
  hidden_aliases?: HiddenAlias[];
  tools_list_bytes?: number;
  surface_footprint?: { profiles: { full: { tokens: number } } };
}>(DEFS);
const registry = readJson<Registry>(REGISTRY);
const defects: string[] = [];

if (registry.schema_version !== 1) defects.push("registry schema_version is not 1");
if (!isStringArray(registry.taxonomy?.groups)) defects.push("registry taxonomy.groups is absent");
if (!isStringArray(registry.taxonomy?.phases)) defects.push("registry taxonomy.phases is absent");
if (!isStringArray(registry.taxonomy?.mutation_classes)) {
  defects.push("registry taxonomy.mutation_classes is absent");
}

const groups = new Set(registry.taxonomy?.groups ?? []);
const phases = new Set(registry.taxonomy?.phases ?? []);
const mutationClasses = new Set(registry.taxonomy?.mutation_classes ?? []);

// REQ-578 — the registry taxonomy and the host's package validation share one
// vocabulary. Drift between them is a build defect.
if (JSON.stringify(registry.taxonomy?.groups) !== JSON.stringify([...CORE_TOOL_GROUPS])) {
  defects.push("registry groups drift from CORE_TOOL_GROUPS");
}
if (JSON.stringify(registry.taxonomy?.phases) !== JSON.stringify([...CORE_TOOL_PHASES])) {
  defects.push("registry phases drift from CORE_TOOL_PHASES");
}

const live = new Map<string, ToolDefinition>();
for (const tool of defs.tools) {
  const actions = tool.action_enum?.length ? tool.action_enum : [null];
  for (const action of actions) live.set(action ? `${tool.name}.${action}` : tool.name, tool);
}
for (const alias of defs.hidden_aliases ?? []) {
  if (alias.kind === "action") {
    live.set(alias.name, { name: alias.name.split(".")[0] });
  } else {
    const actions = alias.action_enum?.length ? alias.action_enum : [null];
    for (const action of actions) live.set(action ? `${alias.name}.${action}` : alias.name, { name: alias.name });
  }
}

for (const key of live.keys()) {
  if (!registry.actions[key]) defects.push(`unregistered action: ${key}`);
}
for (const key of Object.keys(registry.actions)) {
  if (!live.has(key)) defects.push(`declaration names no registered action: ${key}`);
}

// REQ-581 — a compatibility declaration must name a resolvable replacement.
for (const [key, decl] of Object.entries(registry.actions)) {
  if (!decl.compatibility) continue;
  if (!decl.compatibility.replacement) {
    defects.push(`${key}: compatibility declaration has no replacement`);
  } else if (!registry.actions[decl.compatibility.replacement]) {
    defects.push(`${key}: compatibility replacement '${decl.compatibility.replacement}' is not declared`);
  }
}

const entriesByGroup = new Map<string, string[]>();
const toolsByGroup = new Map<string, Set<string>>();
const actionsByTool = new Map<string, string[]>();
for (const [key, decl] of Object.entries(registry.actions)) {
  if (!groups.has(decl.group)) defects.push(`${key}: unknown group ${decl.group}`);
  if (!mutationClasses.has(decl.mutation_class)) {
    defects.push(`${key}: unknown mutation class ${decl.mutation_class}`);
  }
  if (!Array.isArray(decl.phases) || decl.phases.length === 0) {
    defects.push(`${key}: phases must be a non-empty array`);
  } else {
    for (const phase of decl.phases) {
      if (!phases.has(phase)) defects.push(`${key}: unknown phase ${phase}`);
    }
  }
  const tool = key.includes(".") ? key.slice(0, key.indexOf(".")) : key;
  const toolActions = actionsByTool.get(tool) ?? [];
  toolActions.push(key);
  actionsByTool.set(tool, toolActions);
  if (decl.compatibility) continue;
  if (decl.entry) {
    const entries = entriesByGroup.get(decl.group) ?? [];
    entries.push(key);
    entriesByGroup.set(decl.group, entries);
  }
  const tools = toolsByGroup.get(decl.group) ?? new Set<string>();
  tools.add(tool);
  toolsByGroup.set(decl.group, tools);
}

for (const group of groups) {
  const entries = entriesByGroup.get(group) ?? [];
  if (entries.length !== 1) {
    defects.push(`group ${group}: expected exactly one entry action, found ${entries.length}`);
  }
  const toolCount = toolsByGroup.get(group)?.size ?? 0;
  if (toolCount < MIN_TOOLS_PER_GROUP || toolCount > MAX_TOOLS_PER_GROUP) {
    defects.push(
      `group ${group}: ${toolCount} tools, outside ${MIN_TOOLS_PER_GROUP}–${MAX_TOOLS_PER_GROUP}`,
    );
  }
}

// REQ-413 — canonical actions of one tool may span at most two intent groups.
const groupSpans: Record<string, string[]> = {};
const spanViolations: string[] = [];
for (const [tool, keys] of actionsByTool) {
  const canonical = keys.filter((key) => !registry.actions[key].compatibility);
  if (canonical.length === 0) continue;
  const span = [...new Set(canonical.map((key) => registry.actions[key].group))].sort();
  groupSpans[tool] = span;
  if (span.length > 2) spanViolations.push(`${tool}: ${span.join(", ")}`);
}
for (const violation of spanViolations) {
  defects.push(`group span exceeds two: ${violation}`);
}

const canonicalActions = Object.values(registry.actions).filter((decl) => !decl.compatibility).length;
const compatibilityActions = Object.values(registry.actions).filter((decl) => !!decl.compatibility).length;
const canonicalTools = [...actionsByTool].filter(([, keys]) =>
  keys.some((key) => !registry.actions[key].compatibility),
).length;
const compatibilityTools = [...actionsByTool].filter(([, keys]) =>
  keys.every((key) => !!registry.actions[key].compatibility),
).length;

const catalogBytes = defs.tools_list_bytes ?? 0;
const catalogTokens = defs.surface_footprint?.profiles.full.tokens ?? Math.ceil(catalogBytes / 4);
const payload = {
  status: defects.length === 0 ? "OK" : "FAIL",
  actions: Object.keys(registry.actions).length,
  canonical: { tools: canonicalTools, actions: canonicalActions },
  compatibility: { tools: compatibilityTools, actions: compatibilityActions },
  groups: [...groups],
  tool_counts: Object.fromEntries(
    [...groups].map((group) => [group, toolsByGroup.get(group)?.size ?? 0]),
  ),
  entry_actions: Object.fromEntries(
    [...groups].map((group) => [group, entriesByGroup.get(group)?.[0] ?? null]),
  ),
  group_spans: groupSpans,
  span_violations: spanViolations,
  catalog_bytes: catalogBytes,
  catalog_tokens_estimate: catalogTokens,
  defects,
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(payload, null, 2));
} else if (defects.length) {
  console.error("[check-tool-surface] surface contract defects:");
  for (const defect of defects) console.error(`  - ${defect}`);
} else {
  console.log(
    `check-tool-surface: PASS — ${payload.actions} actions, ` +
      `~${payload.catalog_tokens_estimate} catalog tokens`,
  );
}

process.exit(defects.length === 0 ? 0 : 1);
