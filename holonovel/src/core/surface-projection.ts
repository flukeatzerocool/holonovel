// surface-projection.ts — pure Tool Surface Contract projection. [library]
//
// REQ-570, REQ-571, REQ-580 — the profile projection is shared by the runtime
// (`tools/list`, `spec_health`) and the build harnesses (`surface-budget`,
// `surface-replay`, `generate-tool-definitions`) so the measured catalog and
// the served catalog cannot drift.
//
// `full` is the complete, detailed surface. `standard` is call-complete: every
// tool and action is listed, with a lean output-schema presence marker, so a
// caller never needs a group switch. `small` is a discovery catalog: the
// active group's entry tools plus the always-visible globals, reduced to a
// one-line purpose and parameter names/types.

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

export interface SurfaceRegistryLike {
  taxonomy: { groups: string[] };
  actions: Record<string, SurfaceDeclaration>;
}

export interface SurfaceTool {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any> | null;
  annotations?: Record<string, boolean> | null;
}

export type SurfaceProfile = "full" | "standard" | "small";

export const SURFACE_GLOBALS = new Set([
  "set_badge",
  "manage_session",
  "respond_decision",
  "open_session",
  "close_session",
]);

export function normalizeProfile(value: string | null | undefined): SurfaceProfile {
  const profile = (value ?? "full").toLowerCase();
  return profile === "standard" || profile === "small" ? profile : "full";
}

function toolOf(key: string): string {
  return key.includes(".") ? key.slice(0, key.indexOf(".")) : key;
}

export function toolGroups(registry: SurfaceRegistryLike | null, tool: string): Set<string> {
  const groups = new Set<string>();
  if (!registry) return groups;
  const prefix = `${tool}.`;
  for (const [key, decl] of Object.entries(registry.actions)) {
    if (decl.compatibility) continue;
    if (key === tool || key.startsWith(prefix)) groups.add(decl.group);
  }
  return groups;
}

export function entryTools(registry: SurfaceRegistryLike | null, group: string): Set<string> {
  const tools = new Set<string>();
  if (!registry) return tools;
  for (const [key, decl] of Object.entries(registry.actions)) {
    if (decl.compatibility) continue;
    if (decl.group === group && decl.entry) tools.add(toolOf(key));
  }
  return tools;
}

function groupActions(registry: SurfaceRegistryLike | null, tool: string, group: string): string[] {
  const actions: string[] = [];
  if (!registry) return actions;
  const prefix = `${tool}.`;
  for (const [key, decl] of Object.entries(registry.actions)) {
    if (decl.compatibility || decl.group !== group) continue;
    if (key === tool) continue;
    if (key.startsWith(prefix)) actions.push(key.slice(prefix.length));
  }
  return actions.sort();
}

function firstSentence(description: string | undefined): string {
  if (typeof description !== "string" || description.trim() === "") return "";
  const match = description.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : description).trim();
}

function compactSchema(schema: Record<string, any> | undefined): Record<string, any> {
  const properties = schema?.properties;
  if (!properties || typeof properties !== "object") return { type: "object" };
  const compact: Record<string, any> = {};
  for (const [key, value] of Object.entries<any>(properties)) {
    const type = typeof value?.type === "string" ? value.type : "string";
    compact[key] = { type };
    if (Array.isArray(value?.enum)) compact[key].enum = [...value.enum];
  }
  const required = Array.isArray(schema?.required)
    ? schema!.required.filter((key: string) => key in compact)
    : [];
  return { type: "object", properties: compact, required };
}

export function leanTool<T extends SurfaceTool>(tool: T): T {
  return { ...tool, outputSchema: { type: "object" } };
}

export function summarizeTool<T extends SurfaceTool>(
  tool: T,
  registry: SurfaceRegistryLike | null,
  group: string | null,
  restrictActions: boolean,
): T {
  const inputSchema = compactSchema(tool.inputSchema);
  if (restrictActions && group && inputSchema.properties?.action?.enum) {
    const allowed = groupActions(registry, tool.name, group);
    if (allowed.length > 0) {
      inputSchema.properties.action.enum = inputSchema.properties.action.enum.filter((action: string) =>
        allowed.includes(action),
      );
    }
  }
  return {
    ...tool,
    description: firstSentence(tool.description),
    inputSchema,
    outputSchema: { type: "object" },
  };
}

export interface ProjectOptions {
  profile: SurfaceProfile;
  group?: string | null;
  activeGroup: string;
  registry: SurfaceRegistryLike | null;
}

export function projectToolList<T extends SurfaceTool>(tools: T[], options: ProjectOptions): T[] {
  const { profile, group, activeGroup, registry } = options;
  const selected = group ?? (profile === "small" ? activeGroup : null);
  let projected = tools;
  if (profile === "small" && selected) {
    const entries = entryTools(registry, selected);
    projected = projected.filter((tool) => SURFACE_GLOBALS.has(tool.name) || entries.has(tool.name));
  } else if (selected) {
    projected = projected.filter((tool) => {
      if (SURFACE_GLOBALS.has(tool.name)) return true;
      return toolGroups(registry, tool.name).has(selected);
    });
  }
  if (profile === "standard") return projected.map(leanTool);
  if (profile === "small") {
    return projected.map((tool) =>
      summarizeTool(tool, registry, selected, !SURFACE_GLOBALS.has(tool.name)),
    );
  }
  return projected;
}
