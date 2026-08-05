import { StateManager } from "./state.js";
import { ABILITY_SCORES, AbilityScore } from "./data.js";

export function expandMacros(text: string, state: StateManager): string {
  const novel = state.getActiveNovel();
  const entity = state.getActiveEntity();

  return text.replace(/\{\{([^}]+)\}\}/g, (_match, path: string) => {
    const parts = path.trim().split(".");

    if (parts[0] === "entity") {
      if (!entity) return `{{${path}}}`;
      if (parts[1] === "name") return entity.name;
      if (parts[1] === "hp") return `${entity.currentHp}/${entity.maxHp}`;
      if (parts.length === 2 && ABILITY_SCORES.includes(parts[1] as AbilityScore)) {
        return String(entity.stats[parts[1] as AbilityScore]);
      }
      return `{{${path}}}`;
    }

    if (parts[0] === "scene" && novel) {
      if (parts[1] === "current") return novel.scene.description;
      if (parts[1] === "type") return novel.scene.type;
      return `{{${path}}}`;
    }

    if (parts[0] === "countdown" && parts.length === 3 && novel) {
      const cd = novel.countdowns[parts[1]];
      if (!cd) return `{{${path}}}`;
      if (parts[2] === "remaining") return String(cd.ticks);
      if (parts[2] === "total") return String(cd.total);
      return `{{${path}}}`;
    }

    if (parts[0] === "novel" && novel) {
      if (parts[1] === "slug") return novel.slug;
      return `{{${path}}}`;
    }

    if (parts[0] === "persona" && parts[1] === "active") {
      return state.activePersona ?? "none";
    }

    if (parts[0] === "party" && parts[1] === "size" && novel) {
      return String(Object.keys(novel.entities).length);
    }

    return `{{${path}}}`;
  });
}
