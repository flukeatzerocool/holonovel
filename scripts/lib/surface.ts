// surface.ts — shared helpers for the Tool Surface Contract scripts.
// [informational] Pure functions over the committed surface registry; no I/O.

import {
  SURFACE_GLOBALS,
  entryTools as projectEntryTools,
  toolGroups as projectToolGroups,
  type SurfaceDeclaration,
  type SurfaceRegistryLike,
} from "../../holonovel/src/core/surface-projection.js";

export { SURFACE_GLOBALS };
export type { SurfaceDeclaration, SurfaceRegistryLike };

export interface SurfaceAlias {
  name: string;
  kind: "tool" | "action";
  replacement: string;
  retired: boolean;
}

export function toolGroups(registry: SurfaceRegistryLike, tool: string): Set<string> {
  return projectToolGroups(registry, tool);
}

export function entryTools(registry: SurfaceRegistryLike, group: string): string[] {
  return [...projectEntryTools(registry, group)];
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
