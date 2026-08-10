// World Model — kinds, properties, rooms, things, exits, containment, convert_source
// REQ-195, REQ-196, REQ-198, REQ-199, REQ-200, REQ-201, REQ-202, REQ-222
// REQ-316, REQ-317, REQ-318, REQ-319, REQ-320

export const WORLD_MODEL_KINDS = {
  thing: { parent: null, description: "A physical object in the world." },
  container: { parent: "thing", description: "A thing that can hold other things. Portable by default. When closed, contents are blocked." },
  supporter: { parent: "thing", description: "A thing that other things can rest on. Fixed by default." },
  door: { parent: "thing", description: "A thing that connects two rooms and may be opened or closed. Blocks passage when closed. Lockable." },
  device: { parent: "thing", description: "A thing that can be switched on or off. Portable by default." },
  vehicle: { parent: "thing", description: "An enterable thing with a virtual interior room. Moves between rooms. Fixed by default." },
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
  locationType: "room" | "container" | "supporter" | "vehicle" | null;
  // Core properties
  portable: boolean;
  openable: boolean;
  open: boolean;
  lockable: boolean;
  locked: boolean;
  lit: boolean;
  capacity?: number; // supporter or vehicle capacity
  // Door connections
  doorConnects?: { roomA: string; roomB: string };
  // REQ-316 — Device properties
  switchable: boolean;
  switched_on: boolean;
  // REQ-317 — Vehicle properties
  enterable: boolean;
  vehicleInterior?: string; // description of vehicle interior room
  vehiclePassengers: string[];
  // REQ-318 — Extended properties
  wearable: boolean;
  worn_by: string | null;
  readable: boolean;
  read_text: string | null;
  edible: boolean;
  drinkable: boolean;
  climbable: boolean;
  transparent: boolean;
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
  // Core tier
  { verb: "look", category: "navigation", tier: "core", args: [] },
  { verb: "go", category: "navigation", tier: "core", args: ["direction"] },
  { verb: "north", category: "navigation", tier: "core", args: [] },
  { verb: "south", category: "navigation", tier: "core", args: [] },
  { verb: "east", category: "navigation", tier: "core", args: [] },
  { verb: "west", category: "navigation", tier: "core", args: [] },
  { verb: "northeast", category: "navigation", tier: "core", args: [] },
  { verb: "northwest", category: "navigation", tier: "core", args: [] },
  { verb: "southeast", category: "navigation", tier: "core", args: [] },
  { verb: "southwest", category: "navigation", tier: "core", args: [] },
  { verb: "up", category: "navigation", tier: "core", args: [] },
  { verb: "down", category: "navigation", tier: "core", args: [] },
  { verb: "in", category: "navigation", tier: "core", args: [] },
  { verb: "out", category: "navigation", tier: "core", args: [] },
  { verb: "take", category: "object_interaction", tier: "core", args: ["thing"] },
  { verb: "drop", category: "object_interaction", tier: "core", args: ["thing"] },
  { verb: "inventory", category: "inventory", tier: "core", args: [] },
  { verb: "i", category: "inventory", tier: "core", args: [] },
  { verb: "examine", category: "inspection", tier: "core", args: ["thing"] },
  { verb: "wait", category: "wait", tier: "core", args: [] },
  // Standard tier
  { verb: "open", category: "object_interaction", tier: "standard", args: ["thing"] },
  { verb: "close", category: "object_interaction", tier: "standard", args: ["thing"] },
  { verb: "unlock", category: "object_interaction", tier: "standard", args: ["thing", "key"] },
  { verb: "lock", category: "object_interaction", tier: "standard", args: ["thing", "key"] },
  { verb: "put", category: "object_interaction", tier: "standard", args: ["thing", "target"] },
  { verb: "insert", category: "object_interaction", tier: "standard", args: ["thing", "target"] },
  { verb: "search", category: "inspection", tier: "standard", args: ["thing"] },
  { verb: "wear", category: "object_interaction", tier: "standard", args: ["thing"] },
  { verb: "remove", category: "object_interaction", tier: "standard", args: ["thing"] },
  { verb: "read", category: "inspection", tier: "standard", args: ["thing"] },
  { verb: "eat", category: "object_interaction", tier: "standard", args: ["thing"] },
  { verb: "drink", category: "object_interaction", tier: "standard", args: ["thing"] },
  { verb: "climb", category: "navigation", tier: "standard", args: ["thing"] },
  { verb: "enter", category: "navigation", tier: "standard", args: ["thing"] },
  { verb: "exit", category: "navigation", tier: "standard", args: [] },
  { verb: "get out", category: "navigation", tier: "standard", args: [] },
  { verb: "switch on", category: "object_interaction", tier: "standard", args: ["thing"] },
  { verb: "switch off", category: "object_interaction", tier: "standard", args: ["thing"] },
  { verb: "push", category: "object_interaction", tier: "standard", args: ["thing"] },
  { verb: "pull", category: "object_interaction", tier: "standard", args: ["thing"] },
  { verb: "sit", category: "navigation", tier: "standard", args: ["thing"] },
  { verb: "stand", category: "navigation", tier: "standard", args: [] },
  { verb: "light", category: "object_interaction", tier: "standard", args: ["thing"] },
  { verb: "extinguish", category: "object_interaction", tier: "standard", args: ["thing"] },
  { verb: "listen", category: "inspection", tier: "standard", args: [] },
  { verb: "smell", category: "inspection", tier: "standard", args: [] },
  { verb: "touch", category: "inspection", tier: "standard", args: ["thing"] },
  // Narrative tier (REQ-320)
  { verb: "ask", category: "narrative", tier: "standard", args: ["npc", "topic"] },
  { verb: "tell", category: "narrative", tier: "standard", args: ["npc", "topic"] },
  { verb: "give", category: "narrative", tier: "standard", args: ["thing", "npc"] },
  { verb: "show", category: "narrative", tier: "standard", args: ["thing", "npc"] },
  { verb: "throw", category: "narrative", tier: "standard", args: ["thing", "target"] },
  // Meta tier
  { verb: "again", category: "meta", tier: "core", args: [] },
  { verb: "g", category: "meta", tier: "core", args: [] },
  { verb: "help", category: "wait", tier: "core", args: [] },
  { verb: "commands", category: "wait", tier: "core", args: [] },
  { verb: "verbs", category: "wait", tier: "core", args: [] },
  { verb: "brief", category: "wait", tier: "core", args: [] },
  { verb: "verbose", category: "wait", tier: "core", args: [] },
  { verb: "normal", category: "wait", tier: "core", args: [] },
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
      // Associate climbable thing in source room with this exit direction
      for (const [, thing] of world.things) {
        if (thing.climbable && thing.location?.toLowerCase() === roomName.toLowerCase() && !room.doorRefs.has(dir as Direction)) {
          room.doorRefs.set(dir as Direction, thing.name);
        }
      }
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
        switchable: false,
        switched_on: false,
        enterable: false,
        vehiclePassengers: [],
        wearable: false,
        worn_by: null,
        readable: false,
        read_text: null,
        edible: false,
        drinkable: false,
        climbable: false,
        transparent: false,
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
        switchable: false,
        switched_on: false,
        enterable: false,
        vehiclePassengers: [],
        wearable: false,
        worn_by: null,
        readable: false,
        read_text: null,
        edible: false,
        drinkable: false,
        climbable: false,
        transparent: false,
        annotations: {},
      };
      world.things.set(thingName.toLowerCase(), thing);
      currentThing = thingName;
      currentRoom = null;
      continue;
    }

    // Thing kind declaration: "<Name> is a <kind>." or "<Name> is a <kind>. "Description.""
    const kindMatch = text.match(/^(.+?) is a (thing|container|supporter|door|device|vehicle|person|backdrop)\.\s*(?:"(.*)")?\s*$/i);
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
        if (kind === "device") { existing.switchable = true; }
        if (kind === "vehicle") { existing.portable = false; existing.enterable = true; existing.vehiclePassengers = existing.vehiclePassengers || []; }
      } else {
        const thing: WorldThing = {
          name,
          description: desc,
          kind,
          location: currentRoom || null,
          locationType: currentRoom ? "room" : null,
          portable: kind === "supporter" || kind === "door" || kind === "vehicle" ? false : true,
          openable: kind === "container" || kind === "door",
          open: false,
          lockable: kind === "container" || kind === "door",
          locked: kind === "door",
          lit: false,
          switchable: kind === "device",
          switched_on: false,
          enterable: kind === "vehicle",
          vehiclePassengers: [],
          wearable: false,
          worn_by: null,
          readable: false,
          read_text: null,
          edible: false,
          drinkable: false,
          climbable: false,
          transparent: false,
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

    // Property declaration:

    // Read text: "The inscription on the <name> reads '<text>'."
    const readMatch = text.match(/^The inscription on the (.+?) reads ['"](.+)['"]\.\s*$/i);
    if (readMatch) {
      const name = readMatch[1].trim();
      const readText = readMatch[2];
      const thing = world.things.get(name.toLowerCase());
      if (thing) {
        thing.readable = true;
        thing.read_text = readText;
      } else {
        warnings.push({ line: lnum, pattern: text, message: `Thing '${name}' not found for read_text declaration.` });
      }
      continue;
    }

    // Property declaration: "<Name> is <property>." or "It is <property> and <property>."
    const propMatch = text.match(/^It is (fixed|portable|openable|open|close|closed|lockable|locked|lit|dark|switchable|switched on|switched off|wearable|readable|edible|drinkable|enterable|climbable|transparent)(?: and (fixed|portable|locked|open|closed|switchable|switched on|wearable|readable|edible|drinkable|enterable|climbable|transparent))?\.\s*$/i) ||
                      text.match(/^(.+?) is (fixed|portable|openable|open|lockable|locked|lit|dark|switchable|switched on|switched off|wearable|readable|edible|drinkable|enterable|climbable|transparent)\.\s*$/i);

    if (propMatch) {
      let targetName = currentThing;
      let props: string[] = [];

      if (propMatch[1] && propMatch[1].match(/^(fixed|portable|openable|open|lockable|locked|lit|dark|close|closed|switchable|switched on|switched off|wearable|readable|edible|drinkable|enterable|climbable|transparent)$/i)) {
        // "It is ..." form
        props = [propMatch[1], propMatch[2]].filter(Boolean).map(s => s!.toLowerCase().replace(/close$/, "closed").replace(/\s+/g, "_"));
      } else if (propMatch[1]) {
        targetName = propMatch[1].trim();
        props = [propMatch[2]].filter(Boolean).map(s => s!.toLowerCase().replace(/\s+/g, "_"));
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
          case "switchable": thing.switchable = true; break;
          case "switched_on": thing.switched_on = true; break;
          case "switched_off": thing.switched_on = false; break;
          case "wearable": thing.wearable = true; break;
          case "readable": thing.readable = true; break;
          case "edible": thing.edible = true; break;
          case "drinkable": thing.drinkable = true; break;
          case "enterable": thing.enterable = true; break;
          case "climbable": thing.climbable = true; break;
          case "transparent": thing.transparent = true; break;
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
  const tiers = ["core", "standard"];
  for (const tier of tiers) {
    const tierCmds = BASE_PARSER_COMMANDS.filter(c => c.tier === tier);
    if (tierCmds.length > 0) {
      lines.push(`\n### ${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier`);
      for (const cmd of tierCmds) {
        lines.push(`- \`${cmd.verb}\` [${cmd.category}]`);
      }
    }
  }

  return lines.join("\n");
}
