// Parser command dispatch — REQ-196, REQ-319, REQ-320
// Resolves natural-language commands against world-model current state.

import { WorldModel, WorldRoom, WorldThing, Direction, ROOM_DIRECTIONS, resolveThingName, resolveThingInInventory } from "./world-model.js";

export interface ParserContext {
  world: WorldModel;
  currentRoom: string | null;
  inventory: string[]; // thing lowercased names
  hat: string | null;
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

let lastCommand: string | null = null;
let lastReferencedThing: string | null = null;

export function dispatchCommand(raw: string, ctx: ParserContext): ParserResult {
  const trimmed = raw.trim();
  // Track for "again" — don't track "again" or "g" themselves
  if (trimmed && trimmed.split(" ")[0] !== "again" && trimmed.split(" ")[0] !== "g") {
    lastCommand = trimmed;
  }
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
      if (args[0] === "up" || args[0] === "") return handleGo(args[1] || "", ctx);
      return handleTake(args.join(" "), ctx);
    }
    case "drop":
    case "put": {
      const inIdx = args.findIndex(a => a === "in" || a === "on");
      if (verb === "put" && inIdx > 0) {
        const thingName = args.slice(0, inIdx).join(" ");
        const targetName = args.slice(inIdx + 1).join(" ");
        return handlePut(thingName, targetName, ctx);
      }
      return handleDrop(args.join(" "), ctx);
    }
    case "insert": {
      const intoIdx = args.findIndex(a => a === "into" || a === "in");
      if (intoIdx > 0) {
        const thingName = args.slice(0, intoIdx).join(" ");
        const targetName = args.slice(intoIdx + 1).join(" ");
        return handlePut(thingName, targetName, ctx);
      }
      return handlePut(args.join(" "), "", ctx);
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
    case "search":  return handleExamine(args.join(" "), ctx);
    case "read":    return handleRead(args.join(" "), ctx);
    case "wear":    return handleWear(args.join(" "), ctx);
    case "remove":  return handleRemove(args.join(" "), ctx);
    case "eat":     return handleEat(args.join(" "), ctx);
    case "drink":   return handleDrink(args.join(" "), ctx);
    case "climb":   return handleClimb(args.join(" "), ctx);
    case "enter":   return handleEnter(args.join(" "), ctx);
    case "exit":
    case "get out": return handleExit(ctx);
    case "switch": {
      if (args[0] === "on") return handleSwitchOn(args.slice(1).join(" "), ctx);
      if (args[0] === "off") return handleSwitchOff(args.slice(1).join(" "), ctx);
      return { prefix: "ERROR", code: "INVALID_INPUT", text: "Switch on or switch off what?", correctiveAction: "Try: switch on <thing> or switch off <thing>." };
    }
    case "push":    return { prefix: "OK", text: `You push the ${args.join(" ") || "thing"}. Nothing happens.` };
    case "pull":    return { prefix: "OK", text: `You pull the ${args.join(" ") || "thing"}. Nothing happens.` };
    case "sit":     return handleSit(args.join(" "), ctx);
    case "stand":   return handleStand(ctx);
    case "light":   return handleLight(args.join(" "), ctx);
    case "extinguish": return handleExtinguish(args.join(" "), ctx);
    case "listen":  return handleListen(ctx);
    case "smell":   return handleSmell(ctx);
    case "touch":   return handleTouch(args.join(" "), ctx);
    case "ask":
    case "tell": {
      const aboutIdx = args.findIndex(a => a === "about");
      const npc = aboutIdx > 0 ? args.slice(0, aboutIdx).join(" ") : args.slice(0, -1).join(" ");
      const topic = aboutIdx > 0 ? args.slice(aboutIdx + 1).join(" ") : "";
      return handleNarrative(verb, npc, topic, ctx);
    }
    case "give":
    case "show": {
      const toIdx = args.findIndex(a => a === "to");
      const thingName = toIdx > 0 ? args.slice(0, toIdx).join(" ") : "";
      const npc = toIdx > 0 ? args.slice(toIdx + 1).join(" ") : "";
      return handleGiveShow(verb, thingName, npc, ctx);
    }
    case "throw": {
      const atIdx = args.findIndex(a => a === "at");
      const thingName = atIdx > 0 ? args.slice(0, atIdx).join(" ") : "";
      const target = atIdx > 0 ? args.slice(atIdx + 1).join(" ") : "";
      return handleThrow(thingName, target, ctx);
    }
    case "again":
    case "g": {
      if (!lastCommand) return { prefix: "WARNING", text: "Nothing to repeat." };
      const repeat = lastCommand;
      lastCommand = null;
      return dispatchCommand(repeat, ctx);
    }
    case "it": {
      if (!lastReferencedThing) return { prefix: "WARNING", text: "I am not sure what 'it' refers to." };
      return dispatchCommand(`${args.join(" ")} ${lastReferencedThing}`, ctx);
    }
    case "them": {
      if (!lastReferencedThing) return { prefix: "WARNING", text: "I am not sure what 'them' refers to." };
      return dispatchCommand(`${args.join(" ")} ${lastReferencedThing}`, ctx);
    }
    case "all": {
      return { prefix: "ERROR", code: "NOT_IMPLEMENTED", text: "\"all\" is not yet implemented." };
    }
    case "help":
    case "commands":
    case "verbs":   return handleHelp();
    case "brief":   return { prefix: "OK", text: "Room description mode set to brief. Subsequent look will show room name and exits only." };
    case "verbose": return { prefix: "OK", text: "Room description mode set to verbose. Every room entry will print the full description." };
    case "normal":  return { prefix: "OK", text: "Room description mode set to normal. Full description on first entry; brief thereafter." };
    case "wait":    return { prefix: "OK", text: "Time passes." };
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

  const roomThings = getRoomThings(ctx.currentRoom, ctx);
  const matches = resolveThingName(target, roomThings, ctx.inventory);
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
  if (thing.locked) return { prefix: "WARNING", text: `The ${thing.name} is locked.`, correctiveAction: `Try: unlock ${thing.name} with <key>.` };
  return { prefix: "OK", text: `You open the ${thing.name}.` };
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

function handleRead(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Read what?" };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.readable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not readable.` };
  const text = thing.read_text || thing.description || `There is nothing written on the ${thing.name}.`;
  return { prefix: "OK", text };
}

function handleWear(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Wear what?" };
  if (!ctx.inventory.includes(target.toLowerCase())) return { prefix: "ERROR", code: "NOT_FOUND", text: `You're not carrying '${target}'.` };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.wearable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not wearable.` };
  if (thing.worn_by) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is already being worn.` };
  return { prefix: "OK", text: `You put on the ${thing.name}.` };
}

function handleRemove(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Remove what?" };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.worn_by) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `You are not wearing the ${thing.name}.` };
  return { prefix: "OK", text: `You take off the ${thing.name}.` };
}

function handleEat(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Eat what?" };
  if (!ctx.inventory.includes(target.toLowerCase())) return { prefix: "ERROR", code: "NOT_FOUND", text: `You're not carrying '${target}'.` };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You're not carrying '${target}'.` };
  if (!thing.edible) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not edible.` };
  return { prefix: "OK", text: `You eat the ${thing.name}.` };
}

function handleDrink(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Drink what?" };
  if (!ctx.inventory.includes(target.toLowerCase())) return { prefix: "ERROR", code: "NOT_FOUND", text: `You're not carrying '${target}'.` };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You're not carrying '${target}'.` };
  if (!thing.drinkable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not drinkable.` };
  return { prefix: "OK", text: `You drink the ${thing.name}.` };
}

function handleClimb(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Climb what?" };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.climbable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not climbable.` };
  const room = ctx.world.rooms.get(ctx.currentRoom.toLowerCase());
  if (!room) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "Room not found." };
  for (const [dir, doorName] of room.doorRefs) {
    if (doorName.toLowerCase() === thing.name.toLowerCase()) {
      const targetRoom = room.exits.get(dir as Direction);
      if (targetRoom) return { prefix: "OK", text: `You climb the ${thing.name}.` };
    }
  }
  return { prefix: "ERROR", code: "RULE_VIOLATION", text: `Climbing the ${thing.name} doesn't lead anywhere.` };
}

function handleEnter(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Enter what?" };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.enterable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not something you can enter.` };
  return { prefix: "OK", text: `You enter the ${thing.name}.` };
}

function handleExit(ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  return { prefix: "OK", text: "You get out." };
}

function handleSwitchOn(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Switch on what?" };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.switchable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} cannot be switched on.` };
  if (thing.switched_on) return { prefix: "WARNING", text: `The ${thing.name} is already on.` };
  return { prefix: "OK", text: `You switch on the ${thing.name}.` };
}

function handleSwitchOff(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Switch off what?" };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.switchable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} cannot be switched off.` };
  if (!thing.switched_on) return { prefix: "WARNING", text: `The ${thing.name} is already off.` };
  return { prefix: "OK", text: `You switch off the ${thing.name}.` };
}

function handleSit(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Sit on what?" };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (thing.kind !== "supporter") return { prefix: "ERROR", code: "RULE_VIOLATION", text: `You cannot sit on the ${thing.name}.` };
  return { prefix: "OK", text: `You sit on the ${thing.name}.` };
}

function handleStand(ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  return { prefix: "OK", text: "You stand up." };
}

function handleLight(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Light what?" };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.lit) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not a light source.` };
  return { prefix: "OK", text: `You light the ${thing.name}.` };
}

function handleExtinguish(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Extinguish what?" };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  if (!thing.lit) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is not a light source.` };
  return { prefix: "OK", text: `You extinguish the ${thing.name}.` };
}

function handleListen(ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  return { prefix: "OK", text: "You listen. You hear the ambient sounds of your surroundings." };
}

function handleSmell(ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  return { prefix: "OK", text: "You smell the air. It carries the scent of your surroundings." };
}

function handleTouch(target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Touch what?" };
  const thing = getThing(target, ctx);
  if (!thing) return { prefix: "ERROR", code: "NOT_FOUND", text: `You see no '${target}' here.` };
  return { prefix: "OK", text: `You touch the ${thing.name}.` };
}

function handleHelp(): ParserResult {
  let text = "Available commands:\n\n";
  text += "--- Core ---\nlook, go <direction>, take <thing>, drop <thing>, inventory, examine <thing>, wait, again\n";
  text += "--- Standard ---\nopen/close, unlock/lock, put/insert, search, wear/remove, read, eat/drink, climb, enter/exit, switch on/off, push/pull, sit/stand, light/extinguish, listen, smell, touch\n";
  text += "--- Narrative ---\nask <npc> about <topic>, tell <npc> about <topic>, give <thing> to <npc>, show <thing> to <npc>, throw <thing> at <target>";
  return { prefix: "OK", text };
}

function handleNarrative(verb: string, npc: string, topic: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!npc) return { prefix: "ERROR", code: "INVALID_INPUT", text: `${verb.charAt(0).toUpperCase() + verb.slice(1)} whom?` };
  return { prefix: "OK", text: `You ${verb} ${npc}${topic ? ` about ${topic}` : ""}.` };
}

function handleGiveShow(verb: string, thingName: string, npc: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!thingName) return { prefix: "ERROR", code: "INVALID_INPUT", text: `${verb.charAt(0).toUpperCase() + verb.slice(1)} what?` };
  if (!npc) return { prefix: "ERROR", code: "INVALID_INPUT", text: `${verb.charAt(0).toUpperCase() + verb.slice(1)} to whom?` };
  if (verb === "give") {
    if (!ctx.inventory.includes(thingName.toLowerCase())) return { prefix: "ERROR", code: "NOT_FOUND", text: `You're not carrying '${thingName}'.` };
    const thing = getThing(thingName, ctx);
    if (thing && !thing.portable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is fixed and cannot be given.` };
  }
  return { prefix: "OK", text: `You ${verb} the ${thingName} to ${npc}.` };
}

function handleThrow(thingName: string, target: string, ctx: ParserContext): ParserResult {
  if (!ctx.currentRoom) return { prefix: "ERROR", code: "STATE_CONFLICT", text: "The world model has not been populated." };
  if (!thingName) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Throw what?" };
  if (!target) return { prefix: "ERROR", code: "INVALID_INPUT", text: "Throw at what?" };
  if (!ctx.inventory.includes(thingName.toLowerCase())) return { prefix: "ERROR", code: "NOT_FOUND", text: `You're not carrying '${thingName}'.` };
  const thing = getThing(thingName, ctx);
  if (thing && !thing.portable) return { prefix: "ERROR", code: "RULE_VIOLATION", text: `The ${thing.name} is fixed and cannot be thrown.` };
  return { prefix: "OK", text: `You throw the ${thingName} toward ${target}.` };
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
