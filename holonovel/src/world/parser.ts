// Parser command dispatch — REQ-196
// Resolves natural-language commands against world-model current state.

import { WorldModel, WorldRoom, WorldThing, Direction, ROOM_DIRECTIONS, resolveThingName, resolveThingInInventory } from "./model.js";

export interface ParserContext {
  world: WorldModel;
  currentRoom: string | null;
  inventory: string[]; // thing lowercased names
  badge: string | null;
}

export interface ParserResult {
  prefix: "OK" | "WARNING" | "ERROR";
  code?: string;
  text: string;
  correctiveAction?: string;
}

const DIRECTION_ALIASES: Record<string, string> = {
  n: "north", s: "south", e: "east", w: "west",
  ne: "northeast", nw: "northwest", se: "southeast", sw: "southwest",
  u: "up", d: "down",
};

export function dispatchCommand(raw: string, ctx: ParserContext): ParserResult {
  const trimmed = raw.trim();
  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return { prefix: "ERROR", code: "INVALID_INPUT", text: "No command provided.", correctiveAction: "Try: look, go <direction>, examine <thing>, take <thing>, inventory, or wait." };

  const verb = tokens[0].toLowerCase();
  const args = tokens.slice(1);

  // Direction aliases as standalone commands
  if (verb in DIRECTION_ALIASES || ROOM_DIRECTIONS.includes(verb as any)) {
    const dir = DIRECTION_ALIASES[verb] || verb;
    return handleGo(dir, ctx);
  }

  switch (verb) {
    case "look":     return handleLook(ctx);
    case "go":       return handleGo(args[0] || "", ctx);
    case "walk":
    case "move":     return handleGo(args[0] || "", ctx);
    case "north":
    case "south":
    case "east":
    case "west":
    case "northeast":
    case "northwest":
    case "southeast":
    case "southwest":
    case "up":
    case "down":
    case "in":
    case "out":      return handleGo(verb, ctx);
    case "take":
    case "get":
    case "pick": {
      if (verb === "get" && args[0]?.toLowerCase() === "out") return handleExit(ctx);
      if (args[0] === "up" || args[0] === "") return handleGo(args[1] || "", ctx);
      return handleTake(args.join(" "), ctx);
    }
    case "drop":
    case "put": {
      // "put X in/on Y" vs "drop X"
      const inIdx = args.findIndex(a => a === "in" || a === "on");
      if (verb === "put" && inIdx > 0) {
        const thingName = args.slice(0, inIdx).join(" ");
        const targetName = args.slice(inIdx + 1).join(" ");
        return handlePut(thingName, targetName, ctx);
      }
      return handleDrop(args.join(" "), ctx);
    }
    case "open":    return handleOpen(args.join(" "), ctx);
    case "close":   return handleClose(args.join(" "), ctx);
    case "unlock":  return handleUnlock(args.join(" "), ctx);
    case "lock":    return handleLock(args.join(" "), ctx);
    case "inventory":
    case "i":       return handleInventory(ctx);
    case "examine":
    case "x":
    case "look at":
    case "search": {
      return handleExamine(args.join(" "), ctx);
    }
    case "wait":    return { prefix: "OK", text: "Time passes." };
    case "switch": {
      const onOff = args[0]?.toLowerCase();
      if (onOff === "on" || onOff === "off") return handleSwitch(onOff, args.slice(1).join(" "), ctx);
      return { prefix: "ERROR", code: "INVALID_INPUT", text: "Switch what on or off?", correctiveAction: "Try: switch on <device> or switch off <device>." };
    }
    case "wear":    return handleWear(args.join(" "), ctx);
    case "remove":  return handleRemove(args.join(" "), ctx);
    case "read":    return handleRead(args.join(" "), ctx);
    case "eat":     return handleConsume("eat", args.join(" "), ctx);
    case "drink":   return handleConsume("drink", args.join(" "), ctx);
    case "climb":   return handleClimb(args.join(" "), ctx);
    case "enter":   return handleEnter(args.join(" "), ctx);
    case "exit":    return handleExit(ctx);
    case "sit":     return handleSit(args.join(" "), ctx);
    case "stand":   return handleStand(ctx);
    case "push":    return handlePushPull("push", args.join(" "), ctx);
    case "pull":    return handlePushPull("pull", args.join(" "), ctx);
    case "light":   return handleLightExtinguish("light", args.join(" "), ctx);
    case "extinguish": return handleLightExtinguish("extinguish", args.join(" "), ctx);
    case "listen":  return handleListen(ctx);
    case "smell":   return handleSmell(ctx);
    case "touch":   return handleTouch(args.join(" "), ctx);
    case "insert":  return handleInsert(args.join(" "), ctx);
    default:
      return {
        prefix: "ERROR",
        code: "NOT_FOUND",
        text: `"${verb}" is not a recognized command.`,
        correctiveAction: `Try: look, go <direction>, take <thing>, drop <thing>, open <door>, close <door>, inventory, examine <thing>, or wait.`,
      };
  }
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  let current = "";
  while (i < input.length) {
    if (input[i] === '"') {
      const end = input.indexOf('"', i + 1);
      if (end === -1) {
        current += input.slice(i);
        i = input.length;
      } else {
        tokens.push(input.slice(i + 1, end));
        i = end + 1;
      }
      continue;
    }
    if (input[i] === " ") {
      if (current) tokens.push(current);
      current = "";
      i++;
      continue;
    }
    current += input[i];
    i++;
  }
  if (current) tokens.push(current);
  return tokens;
}

function getRoom(name: string, ctx: ParserContext): WorldRoom | undefined {
  return ctx.world.rooms.get(name.toLowerCase());
}

function getRoomThings(roomName: string, ctx: ParserContext): WorldThing[] {
  const things: WorldThing[] = [];
  const rl = roomName.toLowerCase();
  for (const [, thing] of ctx.world.things) {
    if (!thing.location) continue;
    const loc = thing.location.toLowerCase();
    if (loc === rl && thing.locationType === "room") {
      things.push(thing);
    }
  }
  return things;
}

function getThingsInContainer(containerName: string, ctx: ParserContext): WorldThing[] {
  const things: WorldThing[] = [];
  const cl = containerName.toLowerCase();
  for (const [, thing] of ctx.world.things) {
    if (thing.location?.toLowerCase() === cl && thing.locationType === "container") {
      things.push(thing);
    }
  }
  return things;
}

function getThingsOnSupporter(supporterName: string, ctx: ParserContext): WorldThing[] {
  const things: WorldThing[] = [];
  const sl = supporterName.toLowerCase();
  for (const [, thing] of ctx.world.things) {
    if (thing.location?.toLowerCase() === sl && thing.locationType === "supporter") {
      things.push(thing);
    }
  }
  return things;
}

function getThing(name: string, ctx: ParserContext): WorldThing | undefined {
  return ctx.world.things.get(name.toLowerCase());
}

function getHeldThing(name: string, ctx: ParserContext): WorldThing | undefined {
  if (!ctx.inventory.includes(name.toLowerCase())) return undefined;
  return ctx.world.things.get(name.toLowerCase());
}

function handleLook(ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) {
    return { prefix: "ERROR", code: "STATE_CONFLICT", text: "You are nowhere. The world model has not been populated.", correctiveAction: "Use an adventure module or CRUD tools to populate the world model." };
  }
  const room = getRoom(ctx.currentRoom, ctx);
  if (!room) {
    return { prefix: "ERROR", code: "NOT_FOUND", text: `Room '${ctx.currentRoom}' not found.` };
  }

  let text = `${room.name}\n${room.description || "There is nothing special about this place."}`;

  // Visible things
  const roomThings = getRoomThings(ctx.currentRoom, ctx).filter(t => t.locationType === "room");
  const containerThings = getThingsInContainer(ctx.currentRoom, ctx);
  const supporterThings = ctx.world.things.get(ctx.currentRoom.toLowerCase())?.kind === "supporter"
    ? getThingsOnSupporter(ctx.currentRoom, ctx) : [];

  const visibleThings = [...roomThings, ...containerThings, ...supporterThings];
  if (visibleThings.length > 0) {
    const names = visibleThings.map(t => `${t.name}${t.portable ? "" : " (fixed)"}`);
    text += `\n\nYou can see: ${names.join(", ")}.`;
  }

  // REQ-367 — property propagation across containment: a lit+switched_on device
  // inside a transparent container reports its light state to the room; an
  // opaque/dark boundary at any level hides recursively contained contents.
  for (const [, t] of (ctx.world as any)?.things ?? new Map()) {
    if (t.locationType !== "container" && t.locationType !== "room") continue;
    const isOpaque = (t.transparent === false || t.transparent === undefined) && t.openable;
    const inner = (ctx.world as any)?.things ? [...(ctx.world as any).things.values()].filter((i: any) => i.location && String(i.location).toLowerCase() === t.name.toLowerCase() && i.locationType === "container") : [];
    if (!isOpaque && inner.length > 0) {
      for (const i of inner) {
        if (i.lit && i.switched_on) text += `\nA glowing ${i.name} (inside the ${t.name}).`;
        else if (i.lit) text += `\nA dark ${i.name} (inside the ${t.name}).`;
      }
    } else if (isOpaque && (t.openable || t.kind === "container")) {
      const hasContents = [...(ctx.world as any)?.things?.values() ?? []].some((i: any) => i.location && String(i.location).toLowerCase() === t.name.toLowerCase());
      if (hasContents) text += `\nA ${t.name} (opaque, what's inside is hidden).`;
    }
  }

  // Exits
  const exitList: string[] = [];
  for (const [dir, target] of room.exits) {
    const door = room.doorRefs.get(dir);
    if (door) {
      const doorThing = getThing(door, ctx);
      if (doorThing) {
        const state = doorThing.open ? "open" : (doorThing.locked ? "closed, locked" : "closed");
        exitList.push(`${dir} (${door} — ${state})`);
      } else {
        exitList.push(`${dir}`);
      }
    } else {
      exitList.push(`${dir}`);
    }
  }
  if (exitList.length > 0) {
    text += `\n\nExits: ${exitList.join(", ")}.`;
  }

  return { prefix: "OK", text };
}

function handleGo(dir: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) {
    return { prefix: "ERROR", code: "STATE_CONFLICT", text: "You are nowhere. The world model has not been populated.", correctiveAction: "Use an adventure module or CRUD tools to populate the world model." };
  }

  if (!dir) {
    return { prefix: "ERROR", code: "INVALID_INPUT", text: "Go where?", correctiveAction: "Try: go north, go south, etc." };
  }

  const direction = dir.toLowerCase();
  if (!ROOM_DIRECTIONS.includes(direction as any)) {
    return { prefix: "ERROR", code: "INVALID_INPUT", text: `'${dir}' is not a valid direction.`, correctiveAction: `Valid directions: ${ROOM_DIRECTIONS.join(", ")}.` };
  }

  const room = getRoom(ctx.currentRoom, ctx);
  if (!room) {
    return { prefix: "ERROR", code: "NOT_FOUND", text: `Room '${ctx.currentRoom}' not found.` };
  }

  // Check for door blocking
  const doorName = room.doorRefs.get(direction as Direction);
  if (doorName) {
    const door = getThing(doorName, ctx);
    if (door) {
      if (!door.open) {
        if (door.locked) {
          return { prefix: "WARNING", text: `The ${door.name} is closed and locked.`, correctiveAction: `Try: unlock ${door.name} with <key>, then open ${door.name}.` };
        }
        return { prefix: "WARNING", text: `The ${door.name} is closed.`, correctiveAction: `Try: open ${door.name}.` };
      }
    }
  }

  // Check for exit
  const target = room.exits.get(direction as Direction);
  if (!target) {
    return { prefix: "WARNING", text: `You can't go ${direction} from here.` };
  }

  const targetRoom = getRoom(target, ctx);
  if (!targetRoom) {
    return { prefix: "ERROR", code: "NOT_FOUND", text: `Room '${target}' not found.` };
  }

  // Actually move happens in the caller — the parser just resolves
  return { prefix: "OK", text: `${targetRoom.name}\n${targetRoom.description || "There is nothing special about this place."}` };
}

function handleTake(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) {
    return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated.", correctiveAction: "Use an adventure module or CRUD tools to populate the world model." };
  }

  // REQ-200: things are reachable from the room directly, from an open
  // container in the room, or from a supporter in the room.
  const roomThings = getRoomThings(ctx.currentRoom, ctx);
  const reachable: WorldThing[] = [...roomThings];
  for (const [, thing] of ctx.world.things) {
    if (!thing.location) continue;
    const parentName = thing.location;
    const parent = ctx.world.things.get(parentName.toLowerCase());
    if (!parent) continue;
    if (parent.location?.toLowerCase() !== ctx.currentRoom.toLowerCase()) continue;
    if (thing.locationType === "supporter") reachable.push(thing);
    else if (thing.locationType === "container" && parent.openable && parent.open) reachable.push(thing);
  }
  const matches = resolveThingName(target, reachable, ctx.inventory);
  if (matches.length === 0) {
    return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  }
  if (matches.length > 1) {
    const names = matches.map(t => `'${t.name}' (${t.description || t.kind})`);
    return { prefix: "ERROR", code: "AMBIGUOUS", text: `Which do you mean: ${names.join(", ")}?` };
  }

  const thing = matches[0];
  if (!thing.portable) {
    return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is fixed.`, correctiveAction: "Fixed objects cannot be taken." };
  }

  // Check if it's inside a closed container
  if (thing.locationType === "container") {
    const container = getThing(thing.location || "", ctx);
    if (container && !container.open && container.openable) {
      return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is inside the ${container.name}, which is closed.`, correctiveAction: `Try: open ${container.name} first.` };
    }
  }

  // Move to inventory (caller updates)
  return { prefix: "OK", text: `You take the ${thing.name}.` };
}

function handleDrop(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) {
    return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  }

  if (!target) {
    return { prefix: "ERROR", code: "INVALID_INPUT", text: "Drop what?" };
  }

  const heldThings: WorldThing[] = [];
  for (const name of ctx.inventory) {
    const t = ctx.world.things.get(name);
    if (t) heldThings.push(t);
  }

  const matches = resolveThingInInventory(target, heldThings);
  if (matches.length === 0) {
    return { prefix: "ERROR", code: "NOT_FOUND", text: `You're not carrying '${target}'.` };
  }
  if (matches.length > 1) {
    const names = matches.map(t => `'${t.name}'`);
    return { prefix: "ERROR", code: "AMBIGUOUS", text: `Which do you mean: ${names.join(", ")}?` };
  }

  return { prefix: "OK", text: `You drop the ${matches[0].name}.` };
}

function handlePut(thingName: string, targetName: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!thingName) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Put what where?" };

  const heldThing = getHeldThing(thingName, ctx);
  if (!heldThing && ctx.inventory.includes(thingName.toLowerCase())) {
    return { prefix: "ERROR", code: "NOT_FOUND", text: `You're not carrying '${thingName}'.` };
  }

  const targetThing = getThing(targetName, ctx);
  if (!targetThing) {
    // Try room name
    const room = getRoom(targetName, ctx);
    if (room) {
      return { prefix: "OK", text: `You put the ${thingName} in ${targetName}.` };
    }
    return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${targetName}' here.` };
  }

  if (targetThing.kind === "container") {
    if (targetThing.openable && !targetThing.open) {
      return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${targetThing.name} is closed.`, correctiveAction: `Try: open ${targetThing.name} first.` };
    }
  }

  return { prefix: "OK", text: `You put the ${thingName} ${targetThing.kind === "supporter" ? "on" : "in"} the ${targetName}.` };
}

function handleOpen(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.openable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} cannot be opened.` };
  if (thing.open) return { prefix: "WARNING", text: `The ${thing.name} is already open.` };
  if (thing.locked) {
    // REQ-284 — implicit action hints: when a reachable key exists in the room
    // or inventory, name it and its location; no hint when none is reachable.
    const hint = findUnlockHint(ctx, thing);
    return { prefix: "WARNING", text: `The ${thing.name} is locked.`, correctiveAction: hint ?? `Try: unlock ${thing.name} with <key>.` };
  }
  return { prefix: "OK", text: `You open the ${thing.name}.` };
}

// REQ-284 — locate a reachable key (room, inventory, or open container) to
// unlock the given thing; returns a Hint: line or null.
function findUnlockHint(ctx: ParserContext, thing: any): string | null {
  const keyName = thing.key?.toLowerCase?.() ?? (thing.lockable ? undefined : undefined);
  const roomName = ctx.currentRoom?.toLowerCase?.() ?? "";
  for (const [, t] of (ctx.world as any)?.things ?? new Map()) {
    const name = t.name?.toLowerCase?.() ?? "";
    const isKey = name.includes("key") || name.includes("lockpick");
    if (!isKey) continue;
    if (ctx.inventory?.includes(name)) return `Hint: You need the ${t.name} (inventory) first.`;
    if (t.location && String(t.location).toLowerCase() === roomName) return `Hint: You need the ${t.name} (${roomName}) first.`;
    if (t.locationType === "container" && t.location === roomName) return `Hint: You need the ${t.name} (${roomName}) first.`;
  }
  return null;
}

function handleClose(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.openable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} cannot be closed.` };
  if (!thing.open) return { prefix: "WARNING", text: `The ${thing.name} is already closed.` };
  return { prefix: "OK", text: `You close the ${thing.name}.` };
}

function handleUnlock(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.lockable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not lockable.` };
  if (!thing.locked) return { prefix: "WARNING", text: `The ${thing.name} is already unlocked.` };

  const args = target.split(" with ");
  const keyName = args[1];
  if (keyName && !ctx.inventory.includes(keyName.toLowerCase())) {
    return { prefix: "WARNING", text: `You need ${keyName} to unlock the ${thing.name}. You're not carrying it.` };
  }

  return { prefix: "OK", text: `You unlock the ${thing.name}.` };
}

function handleLock(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.lockable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not lockable.` };
  if (thing.locked) return { prefix: "WARNING", text: `The ${thing.name} is already locked.` };
  if (thing.open) return { prefix: "WARNING", text: `You must close the ${thing.name} before locking it.` };

  const args = target.split(" with ");
  const keyName = args[1];
  if (keyName && !ctx.inventory.includes(keyName.toLowerCase())) {
    return { prefix: "WARNING", text: `You need ${keyName} to lock the ${thing.name}. You're not carrying it.` };
  }

  return { prefix: "OK", text: `You lock the ${thing.name}.` };
}

function handleInventory(ctx: ParserContext): ParserResult {
  if (ctx.inventory.length === 0) {
    return { prefix: "OK", text: "You are carrying nothing." };
  }
  const items = ctx.inventory.map(i => {
    const thing = ctx.world.things.get(i);
    return thing ? thing.name : i;
  });
  return { prefix: "OK", text: `You are carrying: ${items.join(", ")}.` };
}

function handleExamine(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Examine what?" };

  const thing = getThing(target, ctx);
  if (thing) {
    let text = thing.description || `You see nothing special about the ${thing.name}.`;
    // Show container contents if open
    if (thing.kind === "container" && thing.openable && thing.open) {
      const contents = getThingsInContainer(thing.name, ctx);
      if (contents.length > 0) {
        text += `\n\nInside the ${thing.name}: ${contents.map(t => t.name).join(", ")}.`;
      }
    }
    if (thing.kind === "supporter") {
      const contents = getThingsOnSupporter(thing.name, ctx);
      if (contents.length > 0) {
        text += `\n\nOn the ${thing.name}: ${contents.map(t => t.name).join(", ")}.`;
      }
    }
    return { prefix: "OK", text };
  }

  return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
}

// ── Extended parser commands (REQ-316 through REQ-320) ────────────

function getReachable(ctx: ParserContext): WorldThing[] {
  const reachable: WorldThing[] = [...getRoomThings(ctx.currentRoom || "", ctx)];
  for (const [, thing] of ctx.world.things) {
    if (!thing.location) continue;
    const parent = ctx.world.things.get(thing.location.toLowerCase());
    if (!parent) continue;
    if (parent.location?.toLowerCase() !== (ctx.currentRoom || "").toLowerCase()) continue;
    if (thing.locationType === "supporter") reachable.push(thing);
    else if (thing.locationType === "container" && parent.openable && parent.open) reachable.push(thing);
  }
  return reachable;
}

function resolveReachable(name: string, ctx: ParserContext): WorldThing | undefined {
  const lower = name.trim().toLowerCase().replace(/^the\s+/, "").replace(/^an?\s+/, "");
  const inv = ctx.world.things.get(lower);
  if (inv && ctx.inventory.includes(lower)) return inv;
  const candidates = [...ctx.world.things.values()].filter((t) => {
    const k = t.name.toLowerCase();
    return k === lower || k.includes(lower) || lower.includes(k);
  });
  const reachable = candidates.filter((t) => {
    const inRoom = t.location?.toLowerCase() === (ctx.currentRoom || "").toLowerCase();
    if (inRoom) return true;
    const parent = t.location ? ctx.world.things.get(t.location.toLowerCase()) : undefined;
    const onSupporter = t.locationType === "supporter" && parent && parent.location?.toLowerCase() === (ctx.currentRoom || "").toLowerCase();
    const inOpenContainer = t.locationType === "container" && parent && parent.openable && parent.open && parent.location?.toLowerCase() === (ctx.currentRoom || "").toLowerCase();
    return onSupporter || inOpenContainer;
  });
  return reachable.length === 1 ? reachable[0] : undefined;
}

function handleSwitch(action: "on" | "off", target: string, ctx: ParserContext): ParserResult {
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: `Switch ${action} what?` };
  const thing = resolveReachable(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.switchable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not switchable.`, correctiveAction: "Only devices can be switched." };
  const want = action === "on";
  if (thing.switched_on === want) return { prefix: "WARNING", text: `The ${thing.name} is already switched ${action}.` };
  return { prefix: "OK", text: `You switch ${action} the ${thing.name}.` };
}

function handleWear(target: string, ctx: ParserContext): ParserResult {
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Wear what?" };
  const lower = target.toLowerCase();
  const thing = ctx.world.things.get(lower);
  if (!thing || !ctx.inventory.includes(lower)) return { prefix: "ERROR", code: "NOT_FOUND", text: `You're not carrying '${target}'.` };
  if (!thing.wearable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not wearable.` };
  if (thing.worn_by) return { prefix: "WARNING", text: `The ${thing.name} is already being worn.` };
  return { prefix: "OK", text: `You wear the ${thing.name}.` };
}

function handleRemove(target: string, ctx: ParserContext): ParserResult {
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Remove what?" };
  const thing = ctx.world.things.get(target.toLowerCase());
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.wearable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not wearable.` };
  if (!thing.worn_by) return { prefix: "WARNING", text: `You are not wearing the ${thing.name}.` };
  return { prefix: "OK", text: `You take off the ${thing.name}.` };
}

function handleRead(target: string, ctx: ParserContext): ParserResult {
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Read what?" };
  const thing = resolveReachable(target, ctx) ?? ctx.world.things.get(target.toLowerCase());
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.readable && !thing.read_text) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not readable.` };
  if (thing.read_text) return { prefix: "OK", text: `The ${thing.name} reads: "${thing.read_text}"` };
  return { prefix: "OK", text: thing.description || `You read the ${thing.name}.` };
}

function handleConsume(verb: "eat" | "drink", target: string, ctx: ParserContext): ParserResult {
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: `${verb[0].toUpperCase() + verb.slice(1)} what?` };
  const lower = target.toLowerCase();
  const thing = ctx.world.things.get(lower);
  if (!thing || !ctx.inventory.includes(lower)) return { prefix: "ERROR", code: "NOT_FOUND", text: `You're not carrying '${target}'.` };
  const prop = verb === "eat" ? "edible" : "drinkable";
  if (!(thing as any)[prop]) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not ${prop}.` };
  return { prefix: "OK", text: `You ${verb} the ${thing.name}.` };
}

function handleClimb(target: string, ctx: ParserContext): ParserResult {
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Climb what?" };
  const thing = resolveReachable(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.climbable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not climbable.` };
  return { prefix: "OK", text: `You climb the ${thing.name}.` };
}

function handleEnter(target: string, ctx: ParserContext): ParserResult {
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Enter what?" };
  const thing = resolveReachable(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.enterable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not enterable.` };
  if (thing.kind === "vehicle" && thing.capacity !== undefined && thing.vehiclePassengers.length >= thing.capacity) {
    return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is full.` };
  }
  return { prefix: "OK", text: `You enter the ${thing.name}.` };
}

function handleExit(ctx: ParserContext): ParserResult {
  return { prefix: "OK", text: "You get out." };
}

function handleSit(target: string, ctx: ParserContext): ParserResult {
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Sit on what?" };
  const thing = resolveReachable(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (thing.kind !== "supporter") return { prefix: "ERROR", code: "RULE_VIOLATION", text: `You can't sit on the ${thing.name}.` };
  return { prefix: "OK", text: `You sit on the ${thing.name}.` };
}

function handleStand(ctx: ParserContext): ParserResult {
  return { prefix: "OK", text: "You stand up." };
}

function handlePushPull(verb: "push" | "pull", target: string, ctx: ParserContext): ParserResult {
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: `${verb[0].toUpperCase() + verb.slice(1)} what?` };
  const thing = resolveReachable(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (thing.portable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} moves freely — you can't ${verb} it.` };
  return { prefix: "OK", text: `You ${verb} the ${thing.name}, but it doesn't budge.` };
}

function handleLightExtinguish(verb: "light" | "extinguish", target: string, ctx: ParserContext): ParserResult {
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: `${verb[0].toUpperCase() + verb.slice(1)} what?` };
  const thing = resolveReachable(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  const want = verb === "light";
  if (want && thing.lit) return { prefix: "WARNING", text: `The ${thing.name} is already lit.` };
  if (!want && !thing.lit) return { prefix: "WARNING", text: `The ${thing.name} is not lit.` };
  return { prefix: "OK", text: `You ${verb} the ${thing.name}.` };
}

function handleListen(ctx: ParserContext): ParserResult {
  return { prefix: "OK", text: "You listen." };
}

function handleSmell(ctx: ParserContext): ParserResult {
  return { prefix: "OK", text: "You smell the air." };
}

function handleTouch(target: string, ctx: ParserContext): ParserResult {
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Touch what?" };
  const thing = resolveReachable(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  return { prefix: "OK", text: `You touch the ${thing.name}.` };
}

function handleInsert(target: string, ctx: ParserContext): ParserResult {
  const words = target.split(/\s+/);
  const inIdx = words.findIndex(a => a === "in" || a === "into");
  if (inIdx < 0) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Insert what into what?", correctiveAction: "Try: insert <thing> in <container>." };
  const thingName = words.slice(0, inIdx).join(" ");
  const containerName = words.slice(inIdx + 1).join(" ");
  return handlePut(thingName, containerName, ctx);
}

export function resolveGoMovement(
  command: string,
  ctx: ParserContext
): { newRoom: string | null; result: ParserResult } {
  const result = dispatchCommand(command, ctx);
  if (result.prefix !== "OK" && result.prefix !== "WARNING") {
    return { newRoom: null, result };
  }

  // For go commands, determine the new room
  const trimmed = command.trim();
  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return { newRoom: null, result };

  const verb = tokens[0].toLowerCase();
  let dir = "";

  if (verb in DIRECTION_ALIASES) dir = DIRECTION_ALIASES[verb];
  else if (ROOM_DIRECTIONS.includes(verb as any)) dir = verb;
  else if (verb === "go" || verb === "walk" || verb === "move") dir = tokens[1] || "";

  if (!dir) return { newRoom: null, result };

  const direction = dir.toLowerCase();
  if (!ROOM_DIRECTIONS.includes(direction as any)) return { newRoom: null, result };

  if (!ctx.currentRoom) return { newRoom: null, result };

  const room = ctx.world.rooms.get(ctx.currentRoom.toLowerCase());
  if (!room) return { newRoom: null, result };

  // Check for door blocking
  const doorName = room.doorRefs.get(direction as Direction);
  if (doorName) {
    const door = ctx.world.things.get(doorName.toLowerCase());
    if (door && (!door.open || door.locked)) return { newRoom: null, result };
  }

  const target = room.exits.get(direction as Direction);
  return { newRoom: target || null, result };
}
