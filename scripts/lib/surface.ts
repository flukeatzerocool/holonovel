// surface.ts — shared helpers for the Tool Surface Contract scripts.
// [informational] Pure functions over the committed surface registry; no I/O.

export interface SurfaceDeclaration {
  group: string;
  entry: boolean;
}
export interface SurfaceRegistryLike {
  actions: Record<string, SurfaceDeclaration>;
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
    if (key === tool || key.startsWith(prefix)) groups.add(decl.group);
  }
  return groups;
}

export function entryTools(registry: SurfaceRegistryLike, group: string): string[] {
  const tools = new Set<string>();
  for (const [key, decl] of Object.entries(registry.actions)) {
    if (decl.group === group && decl.entry) {
      tools.add(key.includes(".") ? key.slice(0, key.indexOf(".")) : key);
    }
  }
  return [...tools];
}
