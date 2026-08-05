// Macro expansion system — REQ-085
import { StateManager } from "./state.js";
import { ABILITY_SCORES, AbilityScore } from "./data.js";

export function expandMacros(text: string, state: StateManager): string {
  const novel = state.getActiveNovel();
  const entity = state.getActiveEntity();

  return text.replace(/\{\{([^}]+)\}\}/g, (_match, path: string) => {
    const parts = path.trim().split(".");

    // {{entity.name}}
    if (parts[0] === "entity" && parts[1] === "name" && entity) return entity.name;
    // {{entity.hp}}
    if (parts[0] === "entity" && parts[1] === "hp" && entity) return `${entity.currentHp}/${entity.maxHp}`;
    // {{entity.<stat>}} — per-ruleset stat names
    if (parts[0] === "entity" && parts.length === 2 && entity) {
      const stat = parts[1];
      if (ABILITY_SCORES.includes(stat as AbilityScore)) {
        return String(entity.stats[stat as AbilityScore]);
      }
    }

    // {{scene.current}}
    if (parts[0] === "scene" && parts[1] === "current" && novel) return novel.scene.description;
    // {{scene.type}}
    if (parts[0] === "scene" && parts[1] === "type" && novel) return novel.scene.type;

    // {{countdown.<name>.remaining}}
    if (parts[0] === "countdown" && parts.length === 3 && parts[2] === "remaining" && novel) {
      const cd = novel.countdowns[parts[1]];
      if (cd) return String(cd.ticks);
    }
    // {{countdown.<name>.total}}
    if (parts[0] === "countdown" && parts.length === 3 && parts[2] === "total" && novel) {
      const cd = novel.countdowns[parts[1]];
      if (cd) return String(cd.total);
    }

    // {{novel.slug}}
    if (parts[0] === "novel" && parts[1] === "slug" && novel) return novel.slug;

    // {{persona.active}}
    if (parts[0] === "persona" && parts[1] === "active") return state.activePersona ?? "none";

    // {{party.size}}
    if (parts[0] === "party" && parts[1] === "size" && novel) return String(Object.keys(novel.entities).length);

    // Unknown macro — return literal token unchanged
    return `{{${path}}}`;
  });
}

export function wrapWithMacros(handler: () => Promise<{ content: { type: string; text: string }[] }> | { content: { type: string; text: string }[] }, state: StateManager): ReturnType<typeof handler> {
  return (async () => {
    const result = handler instanceof Function ? await handler() : handler;
    if (result && "content" in result && Array.isArray(result.content)) {
      result.content = result.content.map(c => {
        if (c.type === "text") {
          return { ...c, text: expandMacros(c.text, state) };
        }
        return c;
      });
    }
    return result;
  })();
}
