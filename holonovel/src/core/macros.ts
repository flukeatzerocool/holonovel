// Macro expansion for {{entity.name}}, {{scene.current}}, etc.
// REQ-085: macro tokens of the form {{<path>}}

export interface MacroContext {
  entityName?: string;
  sceneCurrent?: string;
  sceneLocation?: string;
  sceneTimeOfDay?: string;
  sceneAtmosphere?: string;
  sceneType?: string;
  countdowns?: Record<string, { remaining: number; total: number; scope?: string; direction?: string }>;
  novelSlug?: string;
  badgeActive?: string;
  partySize?: number;
  currentRoom?: string;
  worldRoomCount?: number;
  worldThingCount?: number;
}

export function expandMacros(text: string, ctx: MacroContext): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_match, path: string) => {
    const parts = path.trim().split(".");

    if (parts[0] === "entity") {
      if (parts[1] === "name" && ctx.entityName) return ctx.entityName;
    }

    if (parts[0] === "scene") {
      if (parts[1] === "current" && ctx.sceneCurrent) return ctx.sceneCurrent;
      if (parts[1] === "type" && ctx.sceneType) return ctx.sceneType;
      if (parts[1] === "location" && ctx.sceneLocation) return ctx.sceneLocation;
      if (parts[1] === "time_of_day" && ctx.sceneTimeOfDay) return ctx.sceneTimeOfDay;
      if (parts[1] === "atmosphere" && ctx.sceneAtmosphere) return ctx.sceneAtmosphere;
    }

    if (parts[0] === "countdown") {
      const name = parts[1];
      if (name && ctx.countdowns?.[name]) {
        if (parts[2] === "remaining") return String(ctx.countdowns[name].remaining);
        if (parts[2] === "total") return String(ctx.countdowns[name].total);
        if (parts[2] === "scope" && ctx.countdowns[name].scope) return ctx.countdowns[name].scope;
        if (parts[2] === "direction" && ctx.countdowns[name].direction) return ctx.countdowns[name].direction;
      }
    }

    if (parts[0] === "novel" && parts[1] === "slug" && ctx.novelSlug) return ctx.novelSlug;
    if (parts[0] === "badge" && parts[1] === "active" && ctx.badgeActive) return ctx.badgeActive;
    if (parts[0] === "party" && parts[1] === "size" && ctx.partySize !== undefined) return String(ctx.partySize);
    if (parts[0] === "world" && parts[1] === "room" && ctx.currentRoom) return ctx.currentRoom;
    if (parts[0] === "world" && parts[1] === "room_count" && ctx.worldRoomCount !== undefined) return String(ctx.worldRoomCount);
    if (parts[0] === "world" && parts[1] === "thing_count" && ctx.worldThingCount !== undefined) return String(ctx.worldThingCount);

    return `{{${path}}}`;
  });
}
