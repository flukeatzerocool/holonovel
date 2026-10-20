// surface-report.ts — REQ-568 surface conformance report derivation.
//
// Pure: the caller supplies the committed registry, the live action set, and
// the catalog measurements, so the report can be exercised against fixture
// registries without booting the server.

export interface SurfaceDeclaration {
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

export interface SurfaceAlias {
  name: string;
  kind: "tool" | "action";
  replacement: string;
  retired: boolean;
  actions?: string[];
}

export interface SurfaceRegistry {
  schema_version: number;
  taxonomy: { groups: string[]; phases: string[]; mutation_classes: string[] };
  actions: Record<string, SurfaceDeclaration>;
}

export interface SurfaceBudgets {
  standard: number;
  small: number;
}

export interface SurfaceCatalogSize {
  bytes: number;
  tokens: number;
}

export interface SurfaceCatalogProfiles {
  full: SurfaceCatalogSize;
  standard: SurfaceCatalogSize;
  small: SurfaceCatalogSize;
}

export interface SurfaceReportInput {
  registry: SurfaceRegistry | null;
  live: Set<string>;
  profile: string;
  catalogBytes: number;
  catalogProfiles?: SurfaceCatalogProfiles;
  overrides: number;
  budgets: SurfaceBudgets;
}

export interface SurfaceReport {
  profile: string;
  actions: number;
  canonical: { tools: number; actions: number };
  compatibility: { tools: number; actions: number; retired: number; aliases: SurfaceAlias[] };
  coverage: {
    live: number;
    declared: number;
    orphan_actions: string[];
    missing_actions: string[];
  };
  groups: Record<string, number>;
  group_balance: Record<string, { actions: number; tools: number }>;
  group_spans: Record<string, string[]>;
  span_violations: string[];
  entries: Record<string, string | null>;
  entry_uniqueness: Record<string, number>;
  duplicate_entry_groups: string[];
  workflow_calls: { total: number; by_group: Record<string, number> };
  catalog_bytes: number;
  catalog_tokens_estimate: number;
  catalog_profiles: SurfaceCatalogProfiles;
  overrides: number;
  budgets: SurfaceBudgets;
}

function toolNameOf(key: string): string {
  return key.includes(".") ? key.slice(0, key.indexOf(".")) : key;
}

export function buildSurfaceReport(input: SurfaceReportInput): SurfaceReport {
  const { registry, live, profile, catalogBytes, overrides, budgets } = input;
  const catalogProfiles = input.catalogProfiles ?? {
    full: { bytes: catalogBytes, tokens: Math.ceil(catalogBytes / 4) },
    standard: { bytes: catalogBytes, tokens: Math.ceil(catalogBytes / 4) },
    small: { bytes: catalogBytes, tokens: Math.ceil(catalogBytes / 4) },
  };
  const declared = registry ? Object.keys(registry.actions) : [];
  const groups = registry?.taxonomy.groups ?? [];
  const isCompatibility = (key: string): boolean => !!registry?.actions[key]?.compatibility;
  const canonical = declared.filter((key) => !isCompatibility(key));
  const compatibility = declared.filter(isCompatibility);

  // A tool is a compatibility-only tool when every declaration it owns is a
  // compatibility alias. A tool with at least one canonical action remains a
  // canonical tool even when it also carries compatibility actions.
  const actionsByTool = new Map<string, string[]>();
  for (const key of declared) {
    const tool = toolNameOf(key);
    const list = actionsByTool.get(tool) ?? [];
    list.push(key);
    actionsByTool.set(tool, list);
  }
  const canonicalTools = new Set([...actionsByTool].filter(([, keys]) => keys.some((key) => !isCompatibility(key))).map(([tool]) => tool));
  const compatibilityTools = new Set([...actionsByTool].filter(([, keys]) => keys.every((key) => isCompatibility(key))).map(([tool]) => tool));

  const aliases: SurfaceAlias[] = [];
  for (const [tool, keys] of actionsByTool) {
    const compatKeys = keys.filter(isCompatibility);
    if (compatKeys.length === 0) continue;
    if (compatKeys.length === keys.length) {
      aliases.push({
        name: tool,
        kind: "tool",
        replacement: registry!.actions[compatKeys[0]].compatibility!.replacement.split(".")[0],
        retired: compatKeys.some((key) => !!registry!.actions[key].compatibility!.retired),
        actions: compatKeys.map((key) => (key.includes(".") ? key.slice(key.indexOf(".") + 1) : key)).sort(),
      });
    } else {
      for (const key of compatKeys) {
        aliases.push({
          name: key,
          kind: "action",
          replacement: registry!.actions[key].compatibility!.replacement,
          retired: !!registry!.actions[key].compatibility!.retired,
        });
      }
    }
  }
  aliases.sort((a, b) => a.name.localeCompare(b.name));

  const groupBalance: Record<string, { actions: number; tools: number }> = {};
  const entries: Record<string, string | null> = {};
  const entryUniqueness: Record<string, number> = {};
  const workflowCalls: Record<string, number> = {};
  const groupSpans: Record<string, string[]> = {};
  const spanViolations: string[] = [];
  let workflowTotal = 0;

  for (const group of groups) {
    const members = canonical.filter((key) => registry!.actions[key].group === group);
    const tools = new Set(members.map(toolNameOf));
    const entryActions = members.filter((key) => registry!.actions[key].entry);
    const calls = members.filter((key) => registry!.actions[key].successors.length > 0).length;
    groupBalance[group] = { actions: members.length, tools: tools.size };
    entries[group] = entryActions[0] ?? null;
    entryUniqueness[group] = entryActions.length;
    workflowCalls[group] = calls;
    workflowTotal += calls;
  }

  for (const [tool, keys] of actionsByTool) {
    if (!keys.some((key) => !isCompatibility(key))) continue;
    const span = [...new Set(keys.filter((key) => !isCompatibility(key)).map((key) => registry!.actions[key].group))].sort();
    groupSpans[tool] = span;
    if (span.length > 2) spanViolations.push(`${tool}: ${span.join(", ")}`);
  }

  return {
    profile,
    actions: declared.length,
    canonical: { tools: canonicalTools.size, actions: canonical.length },
    compatibility: {
      tools: compatibilityTools.size,
      actions: compatibility.length,
      retired: compatibility.filter((key) => !!registry!.actions[key].compatibility!.retired).length,
      aliases,
    },
    coverage: {
      live: live.size,
      declared: declared.length,
      orphan_actions: [...live].filter((key) => !registry?.actions[key]),
      missing_actions: declared.filter((key) => !live.has(key)),
    },
    groups: Object.fromEntries(groups.map((group) => [group, groupBalance[group].tools])),
    group_balance: groupBalance,
    group_spans: groupSpans,
    span_violations: spanViolations,
    entries,
    entry_uniqueness: entryUniqueness,
    duplicate_entry_groups: groups.filter((group) => entryUniqueness[group] > 1),
    workflow_calls: { total: workflowTotal, by_group: workflowCalls },
    catalog_bytes: catalogBytes,
    catalog_tokens_estimate: Math.ceil(catalogBytes / 4),
    catalog_profiles: catalogProfiles,
    overrides,
    budgets,
  };
}
