// surface.ts — shared helpers for the Tool Surface Contract scripts.
// [informational] Pure functions over the committed surface registry; no I/O.

export interface SurfaceDeclaration {
  group: string;
  entry: boolean;
  compatibility?: { replacement: string; retired?: boolean };
}
export interface SurfaceRegistryLike {
  actions: Record<string, SurfaceDeclaration>;
}

export interface SurfaceAlias {
  name: string;
  kind: "tool" | "action";
  replacement: string;
  retired: boolean;
}

export const SURFACE_GLOBALS = new Set([
  "set_badge",
  "manage_session",
  "respond_decision",
  "open_session",
  "close_session",
]);

export function toolGroups(registry: SurfaceRegistryLike, tool: string): Set<string> {
  const groups = new Set<string>();
  const prefix = `${tool}.`;
  for (const [key, decl] of Object.entries(registry.actions)) {
    if (decl.compatibility) continue;
    if (key === tool || key.startsWith(prefix)) groups.add(decl.group);
  }
  return groups;
}

export function entryTools(registry: SurfaceRegistryLike, group: string): string[] {
  const tools = new Set<string>();
  for (const [key, decl] of Object.entries(registry.actions)) {
    if (decl.compatibility) continue;
    if (decl.group === group && decl.entry) {
      tools.add(key.includes(".") ? key.slice(0, key.indexOf(".")) : key);
    }
  }
  return [...tools];
}

export function surfaceAliases(registry: SurfaceRegistryLike): SurfaceAlias[] {
  const byTool = new Map<string, string[]>();
  for (const key of Object.keys(registry.actions)) {
    const tool = key.includes(".") ? key.slice(0, key.indexOf(".")) : key;
    const keys = byTool.get(tool) ?? [];
    keys.push(key);
    byTool.set(tool, keys);
  }
  const aliases: SurfaceAlias[] = [];
  for (const [tool, keys] of byTool) {
    const compat = keys.filter((key) => !!registry.actions[key].compatibility);
    if (compat.length === 0) continue;
    if (compat.length === keys.length) {
      aliases.push({
        name: tool,
        kind: "tool",
        replacement: registry.actions[compat[0]].compatibility!.replacement.split(".")[0],
        retired: compat.some((key) => !!registry.actions[key].compatibility!.retired),
      });
    } else {
      for (const key of compat) {
        aliases.push({
          name: key,
          kind: "action",
          replacement: registry.actions[key].compatibility!.replacement,
          retired: !!registry.actions[key].compatibility!.retired,
        });
      }
    }
  }
  return aliases.sort((a, b) => a.name.localeCompare(b.name));
}
