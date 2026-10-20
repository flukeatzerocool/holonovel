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

export interface SurfaceReportInput {
  registry: SurfaceRegistry | null;
  live: Set<string>;
  profile: string;
  catalogBytes: number;
  overrides: number;
  budgets: SurfaceBudgets;
}

export interface SurfaceReport {
  profile: string;
  actions: number;
  coverage: {
    live: number;
    declared: number;
    orphan_actions: string[];
    missing_actions: string[];
  };
  groups: Record<string, number>;
  group_balance: Record<string, { actions: number; tools: number }>;
  entries: Record<string, string | null>;
  entry_uniqueness: Record<string, number>;
  duplicate_entry_groups: string[];
  workflow_calls: { total: number; by_group: Record<string, number> };
  catalog_bytes: number;
  catalog_tokens_estimate: number;
  overrides: number;
  budgets: SurfaceBudgets;
}

function toolNameOf(key: string): string {
  return key.includes(".") ? key.slice(0, key.indexOf(".")) : key;
}

export function buildSurfaceReport(input: SurfaceReportInput): SurfaceReport {
  const { registry, live, profile, catalogBytes, overrides, budgets } = input;
  const declared = registry ? Object.keys(registry.actions) : [];
  const groups = registry?.taxonomy.groups ?? [];

  const groupBalance: Record<string, { actions: number; tools: number }> = {};
  const entries: Record<string, string | null> = {};
  const entryUniqueness: Record<string, number> = {};
  const workflowCalls: Record<string, number> = {};
  let workflowTotal = 0;

  for (const group of groups) {
    const members = declared.filter((key) => registry!.actions[key].group === group);
    const tools = new Set(members.map(toolNameOf));
    const entryActions = members.filter((key) => registry!.actions[key].entry);
    const calls = members.filter((key) => registry!.actions[key].successors.length > 0).length;
    groupBalance[group] = { actions: members.length, tools: tools.size };
    entries[group] = entryActions[0] ?? null;
    entryUniqueness[group] = entryActions.length;
    workflowCalls[group] = calls;
    workflowTotal += calls;
  }

  return {
    profile,
    actions: declared.length,
    coverage: {
      live: live.size,
      declared: declared.length,
      orphan_actions: [...live].filter((key) => !registry?.actions[key]),
      missing_actions: declared.filter((key) => !live.has(key)),
    },
    groups: Object.fromEntries(groups.map((group) => [group, groupBalance[group].tools])),
    group_balance: groupBalance,
    entries,
    entry_uniqueness: entryUniqueness,
    duplicate_entry_groups: groups.filter((group) => entryUniqueness[group] > 1),
    workflow_calls: { total: workflowTotal, by_group: workflowCalls },
    catalog_bytes: catalogBytes,
    catalog_tokens_estimate: Math.ceil(catalogBytes / 4),
    overrides,
    budgets,
  };
}
