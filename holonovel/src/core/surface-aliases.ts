// surface-aliases.ts — REQ-581 compatibility-alias projections and tombstone
// refusals. Pure helpers over a supplied registry so the locked and retired
// branches are testable with fixture registries.

import type { SurfaceAlias, SurfaceDeclaration, SurfaceRegistry } from "../surface-report.js";

// REQ-581 — hidden compatibility aliases. A tool whose every declaration is a
// compatibility alias is omitted from tools/list; a tool carrying a mix keeps
// its canonical actions and hides the compatibility action from its schema.
export function hiddenAliasNames(reg: SurfaceRegistry | null): Set<string> {
  const hidden = new Set<string>();
  if (!reg) return hidden;
  const byTool = new Map<string, SurfaceDeclaration[]>();
  for (const [key, decl] of Object.entries(reg.actions)) {
    const tool = key.includes(".") ? key.slice(0, key.indexOf(".")) : key;
    const list = byTool.get(tool) ?? [];
    list.push(decl);
    byTool.set(tool, list);
  }
  for (const [tool, decls] of byTool) {
    if (decls.length > 0 && decls.every((decl) => !!decl.compatibility)) hidden.add(tool);
  }
  return hidden;
}

export function hiddenActionAliases(reg: SurfaceRegistry | null): Map<string, string> {
  const hidden = new Map<string, string>();
  if (!reg) return hidden;
  for (const [key, decl] of Object.entries(reg.actions)) {
    if (!decl.compatibility || !key.includes(".")) continue;
    hidden.set(key, decl.compatibility.replacement);
  }
  return hidden;
}

export function surfaceAliasList(reg: SurfaceRegistry | null): SurfaceAlias[] {
  if (!reg) return [];
  const byTool = new Map<string, Array<[string, SurfaceDeclaration]>>();
  for (const [key, decl] of Object.entries(reg.actions)) {
    const tool = key.includes(".") ? key.slice(0, key.indexOf(".")) : key;
    const list = byTool.get(tool) ?? [];
    list.push([key, decl]);
    byTool.set(tool, list);
  }
  const aliases: SurfaceAlias[] = [];
  for (const [tool, entries] of byTool) {
    const compat = entries.filter(([, decl]) => !!decl.compatibility);
    if (compat.length === 0) continue;
    if (compat.length === entries.length) {
      aliases.push({
        name: tool,
        kind: "tool",
        replacement: compat[0][1].compatibility!.replacement.split(".")[0],
        retired: compat.some(([, decl]) => !!decl.compatibility!.retired),
      });
    } else {
      for (const [key, decl] of compat) {
        aliases.push({
          name: key,
          kind: "action",
          replacement: decl.compatibility!.replacement,
          retired: !!decl.compatibility!.retired,
        });
      }
    }
  }
  return aliases.sort((a, b) => a.name.localeCompare(b.name));
}

// REQ-581 — a retired compatibility alias refuses with the replacement named,
// regardless of badge. This is a tombstone, not a projection refusal.
export function retiredAliasRefusal(
  reg: SurfaceRegistry | null,
  name: string,
  args: Record<string, unknown>,
): string | null {
  if (!reg) return null;
  const action = typeof args?.action === "string" ? args.action : null;
  const key = action ? `${name}.${action}` : name;
  const decl = reg.actions[key] ?? reg.actions[name];
  if (!decl?.compatibility?.retired) return null;
  const replacement = decl.compatibility.replacement;
  const subject = action ? `${name} (action: ${action})` : name;
  return `[ERROR] [NOT_FOUND] ${subject} is retired. Use ${replacement}.`;
}
