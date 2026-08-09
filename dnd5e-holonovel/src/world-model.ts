// World Model — kinds, properties, rooms, things, exits, containment, convert_source
// REQ-195, REQ-196, REQ-198, REQ-199, REQ-200, REQ-201, REQ-202, REQ-222

export const WORLD_MODEL_KINDS = {
  thing: { parent: null, description: "A physical object in the world." },
  container: { parent: "thing", description: "A thing that can hold other things. Portable by default. When closed, contents are blocked." },
  supporter: { parent: "thing", description: "A thing that other things can rest on. Fixed by default." },
  door: { parent: "thing", description: "A thing that connects two rooms and may be opened or closed. Blocks passage when closed. Lockable." },
  person: { parent: "thing", description: "An animate being. Visible and examinable in rooms." },
  backdrop: { parent: "thing", description: "A thing present in multiple rooms; scenery-level." },
  region: { parent: null, description: "A named area spanning multiple rooms." },
} as const;

export type WorldKind = keyof typeof WORLD_MODEL_KINDS;

export const ROOM_DIRECTIONS = [
  "north", "south", "east", "west",
  "northeast", "northwest", "southeast", "southwest",
  "up", "down", "in", "out",
] as const;

export type Direction = (typeof ROOM_DIRECTIONS)[number];

export function oppositeDirection(dir: Direction): Direction {
  const pairs: Record<string, Direction> = {
    north: "south", south: "north", east: "west", west: "east",
    northeast: "southwest", northwest: "southeast", southeast: "northwest", southwest: "northeast",
    up: "down", down: "up", in: "out", out: "in",
  };
  return pairs[dir] ?? dir;
}

export interface WorldThing {
  name: string;
  description: string;
  kind: WorldKind;
  location: string | null; // room name, container name, or supporter name
  locationType: "room" | "container" | "supporter" | null;
  // Properties
  portable: boolean;
  openable: boolean;
  open: boolean;
  lockable: boolean;
  locked: boolean;
  lit: boolean;
  capacity?: number; // supporter capacity
  // Door connections
  doorConnects?: { roomA: string; roomB: string };
  // Annotations
  annotations: { encounter?: string; trap?: string; npc?: string; lore?: string };
}

export interface WorldRoom {
  name: string;
  description: string;
  exits: Map<string, string>; // direction -> target room name
  doorRefs: Map<string, string>; // direction -> door thing name
  annotations: { encounter?: string; trap?: string; npc?: string; lore?: string };
}

export interface WorldModel {
  rooms: Map<string, WorldRoom>;
  things: Map<string, WorldThing>;
}

export function createEmptyWorldModel(): WorldModel {
  return { rooms: new Map(), things: new Map() };
}

export const BASE_PARSER_COMMANDS = [
  { verb: "look", category: "navigation", args: [] },
  { verb: "go", category: "navigation", args: ["direction"] },
  { verb: "north", category: "navigation", args: [] },
  { verb: "south", category: "navigation", args: [] },
  { verb: "east", category: "navigation", args: [] },
  { verb: "west", category: "navigation", args: [] },
  { verb: "northeast", category: "navigation", args: [] },
  { verb: "northwest", category: "navigation", args: [] },
  { verb: "southeast", category: "navigation", args: [] },
  { verb: "southwest", category: "navigation", args: [] },
  { verb: "up", category: "navigation", args: [] },
  { verb: "down", category: "navigation", args: [] },
  { verb: "in", category: "navigation", args: [] },
  { verb: "out", category: "navigation", args: [] },
  { verb: "take", category: "object_interaction", args: ["thing"] },
  { verb: "drop", category: "object_interaction", args: ["thing"] },
  { verb: "inventory", category: "inventory", args: [] },
  { verb: "i", category: "inventory", args: [] },
  { verb: "open", category: "object_interaction", args: ["thing"] },
  { verb: "close", category: "object_interaction", args: ["thing"] },
  { verb: "unlock", category: "object_interaction", args: ["thing", "key"] },
  { verb: "lock", category: "object_interaction", args: ["thing", "key"] },
  { verb: "put", category: "object_interaction", args: ["thing", "target"] },
  { verb: "search", category: "inspection", args: ["thing"] },
  { verb: "examine", category: "inspection", args: ["thing"] },
  { verb: "wait", category: "wait", args: [] },
];

export function resolveThingName(input: string, thingsInRoom: WorldThing[], inventory: string[]): WorldThing[] {
  const lower = input.toLowerCase().trim();
  const candidates = thingsInRoom.filter(t => t.name.toLowerCase().includes(lower));
  return candidates;
}

export function resolveThingInInventory(input: string, heldThings: WorldThing[]): WorldThing[] {
  const lower = input.toLowerCase().trim();
  return heldThings.filter(t => t.name.toLowerCase().includes(lower));
}

// ── convert_source (REQ-201) ──────────────────────────────────────

export interface ConvertResult {
  rooms: number;
  things: number;
  exits: number;
  annotations: { encounters: number; npcs: number; traps: number; lore: number };
  warnings: { line: number; pattern: string; message: string }[];
}

function splitStatements(source: string): string[] {
  const statements: string[] = [];
  const raw = source.split("\n");
  for (const line of raw) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#")) continue;
    let current = "";
    let inQuote = false;
    let skipNextSpace = false;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (ch === '"') inQuote = !inQuote;
      current += ch;
      if (!inQuote && ch === "." && i < trimmed.length - 1 && trimmed[i + 1] === " ") {
        // Don't split if next non-space char is a quote (attached description)
        let j = i + 1;
        while (j < trimmed.length && trimmed[j] === " ") j++;
        if (j < trimmed.length && trimmed[j] === '"') {
          current += " ";
          i++;
          skipNextSpace = true;
          continue;
        }
        statements.push(current.trim());
        current = "";
        skipNextSpace = true;
      } else if (skipNextSpace && ch === " ") {
        skipNextSpace = false;
        continue;
      } else {
        skipNextSpace = false;
      }
    }
    const remain = current.trim();
    if (remain) statements.push(remain);
  }
  return statements;
}

export function convertSource(source: string, existingWorld: WorldModel): { world: WorldModel; result: ConvertResult } {
  const warnings: { line: number; pattern: string; message: string }[] = [];
  const world = createEmptyWorldModel();
  const statements = splitStatements(source);
  const statementLines: { line: number; text: string }[] = statements.map((text, i) => ({ line: i + 1, text }));

  // Pass 1: collect room names and declarations
  let currentThing: string | null = null;
  let currentRoom: string | null = null;

  for (const stmt of statementLines) {
    const text = stmt.text;
    const lnum = stmt.line;

    // TTRPG annotations (attached to current room/thing)
    if (text.startsWith("@")) {
      const annotationMatch = text.match(/^@(\w+)\((.+?)\)(?:\s+(.+))?$/);
      if (annotationMatch) {
        const [, category, target, content] = annotationMatch;
        // Attach to world-model objects
        if (category === "npc") {
          if (!world.rooms.has(target)) {
            // Check if it names a room or if we should create a generic annotation
          }
          warnings.push({ line: lnum, pattern: text, message: `TTRPG annotation '@${category}' — resolved as linked annotation.` });
        }
        continue;
      }
    }

    // Room declaration: "<Name> is a room." or "<Name> is a room. "Description.""
    const roomMatch = text.match(/^(.+?) is a room\.\s*(?:"(.*)")?\s*(with\s+.*)?$/i);
    if (roomMatch) {
      const name = roomMatch[1].trim();
      const description = roomMatch[2] || "";
      const room: WorldRoom = {
        name,
        description,
        exits: new Map(),
        doorRefs: new Map(),
        annotations: {},
      };
      world.rooms.set(name.toLowerCase(), room);
      currentRoom = name;
      currentThing = null;
      continue;
    }

    // Exit declaration: "<Direction> of <Room> is <Target>."
    const exitMatch = text.match(/^(\w+) of (.+?) is (.+?)\.$/i);
    if (exitMatch) {
      const dir = exitMatch[1].toLowerCase();
      const roomName = exitMatch[2].trim();
      const targetName = exitMatch[3].trim();
      if (!isDirection(dir)) {
        warnings.push({ line: lnum, pattern: text, message: `Unknown direction '${dir}'.` });
        continue;
      }
      if (targetName.toLowerCase() === "nowhere") {
        const room = world.rooms.get(roomName.toLowerCase());
        if (room) room.exits.delete(dir as Direction);
        continue;
      }
      let room = world.rooms.get(roomName.toLowerCase());
      if (!room) {
        room = { name: roomName, description: "", exits: new Map(), doorRefs: new Map(), annotations: {} };
        world.rooms.set(roomName.toLowerCase(), room);
      }
      let target = world.rooms.get(targetName.toLowerCase());
      if (!target) {
        target = { name: targetName, description: "", exits: new Map(), doorRefs: new Map(), annotations: {} };
        world.rooms.set(targetName.toLowerCase(), target);
      }
      room.exits.set(dir as Direction, targetName);
      // Implicit reverse exit
      target.exits.set(oppositeDirection(dir as Direction), roomName);
      currentRoom = null;
      currentThing = null;
      continue;
    }

    // Thing in room: "<Name> is in <Room>." or "A <name> is in <Room>."
    const thingInMatch = text.match(/^(?:A |An )?(.+?) is in (.+?)\.\s*(?:"(.*)")?\s*$/i);
    if (thingInMatch) {
      const thingName = thingInMatch[1].trim();
      const location = thingInMatch[2].trim();
      const desc = thingInMatch[3] || "";
      const thing: WorldThing = {
        name: thingName,
        description: desc,
        kind: "thing",
        location: location,
        locationType: "room",
        portable: true,
        openable: false,
        open: false,
        lockable: false,
        locked: false,
        lit: false,
        annotations: {},
      };
      world.things.set(thingName.toLowerCase(), thing);
      currentThing = thingName;
      currentRoom = null;
      continue;
    }

    // Thing on supporter: "<Name> is on <Supporter>."
    const thingOnMatch = text.match(/^(.+?) is on (.+?)\.\s*(?:"(.*)")?\s*$/i);
    if (thingOnMatch) {
      const thingName = thingOnMatch[1].trim();
      const supporter = thingOnMatch[2].trim();
      const desc = thingOnMatch[3] || "";
      const thing: WorldThing = {
        name: thingName,
        description: desc,
        kind: "thing",
        location: supporter,
        locationType: "supporter",
        portable: true,
        openable: false,
        open: false,
        lockable: false,
        locked: false,
        lit: false,
        annotations: {},
      };
      world.things.set(thingName.toLowerCase(), thing);
      currentThing = thingName;
      currentRoom = null;
      continue;
    }

    // Thing kind declaration: "<Name> is a <kind>." or "<Name> is a <kind>. "Description.""
    const kindMatch = text.match(/^(.+?) is a (thing|container|supporter|door|person|backdrop)\.\s*(?:"(.*)")?\s*$/i);
    if (kindMatch) {
      const name = kindMatch[1].trim();
      const kind = kindMatch[2].toLowerCase() as WorldKind;
      const desc = kindMatch[3] || "";
      const existing = world.things.get(name.toLowerCase());
      if (existing) {
        existing.kind = kind;
        existing.description = existing.description || desc;
        if (kind === "container") { existing.openable = true; existing.portable = true; }
        if (kind === "supporter") { existing.portable = false; }
        if (kind === "door") { existing.openable = true; existing.portable = false; }
      } else {
        const thing: WorldThing = {
          name,
          description: desc,
          kind,
          location: currentRoom || null,
          locationType: currentRoom ? "room" : null,
          portable: kind === "supporter" || kind === "door" ? false : true,
          openable: kind === "container" || kind === "door",
          open: false,
          lockable: kind === "container" || kind === "door",
          locked: kind === "door" ? true : false,
          lit: false,
          annotations: {},
        };
        if (kind === "door") {
          thing.locked = true;
        }
        world.things.set(name.toLowerCase(), thing);
      }
      currentThing = name;
      currentRoom = null;
      continue;
    }

    // Property declaration: "<Name> is <property>." or "It is <property> and <property>."
    const propMatch = text.match(/^It is (fixed|portable|openable|open|close|closed|lockable|locked|lit|dark)(?: and (fixed|portable|locked|open|closed))?\.\s*$/i) ||
                      text.match(/^(.+?) is (fixed|portable|openable|open|lockable|locked|lit|dark)\.\s*$/i);

    if (propMatch) {
      let targetName = currentThing;
      let props: string[] = [];

      if (propMatch[1] && propMatch[1].match(/^(fixed|portable|openable|open|lockable|locked|lit|dark|close|closed)$/i)) {
        // "It is ..." form
        props = [propMatch[1], propMatch[2]].filter(Boolean).map(s => s!.toLowerCase().replace(/close$/, "closed"));
      } else if (propMatch[1]) {
        targetName = propMatch[1].trim();
        props = [propMatch[2]].filter(Boolean).map(s => s!.toLowerCase());
      }

      if (!targetName) {
        warnings.push({ line: lnum, pattern: text, message: "Property declaration with no current thing target." });
        continue;
      }

      const thing = world.things.get(targetName.toLowerCase());
      if (!thing) {
        warnings.push({ line: lnum, pattern: text, message: `Thing '${targetName}' not found for property declaration.` });
        continue;
      }

      for (const prop of props) {
        switch (prop) {
          case "fixed": thing.portable = false; break;
          case "portable": thing.portable = true; break;
          case "openable": thing.openable = true; break;
          case "open": thing.open = true; break;
          case "closed": thing.open = false; break;
          case "lockable": thing.lockable = true; break;
          case "locked": thing.locked = true; break;
          case "unlocked": thing.locked = false; break;
          case "lit": thing.lit = true; break;
          case "dark": thing.lit = false; break;
          default:
            warnings.push({ line: lnum, pattern: text, message: `Unknown property '${prop}'.` });
        }
      }
      continue;
    }

    // Unrecognized
    warnings.push({ line: lnum, pattern: text, message: `Unrecognized assertion pattern.` });
  }

  // Finalize: count all objects
  const annotationCounts = { encounters: 0, npcs: 0, traps: 0, lore: 0 };
  let exitCount = 0;
  for (const [, room] of world.rooms) {
    exitCount += room.exits.size;
  }

  return {
    world,
    result: {
      rooms: world.rooms.size,
      things: world.things.size,
      exits: exitCount,
      annotations: annotationCounts,
      warnings,
    },
  };
}

function isDirection(s: string): s is Direction {
  return (ROOM_DIRECTIONS as readonly string[]).includes(s);
}

// ── World-model resources ─────────────────────────────────────────

export function worldMap(world: WorldModel): string {
  const lines: string[] = [];
  for (const [, room] of world.rooms) {
    const exitList: string[] = [];
    for (const [dir, target] of room.exits) {
      exitList.push(`${dir} → ${target}`);
    }
    lines.push(`${room.name}: ${exitList.join(", ") || "no exits"}`);
  }
  return lines.join("\n");
}

export function worldKinds(): string {
  const lines = ["## Kind Hierarchy"];
  for (const [kind, def] of Object.entries(WORLD_MODEL_KINDS)) {
    const parent = def.parent ? ` (extends ${def.parent})` : "";
    lines.push(`- **${kind}**${parent}: ${def.description}`);
  }

  lines.push("\n## Parser Commands");
  for (const cmd of BASE_PARSER_COMMANDS) {
    lines.push(`- \`${cmd.verb}\` [${cmd.category}]`);
  }

  return lines.join("\n");
}
