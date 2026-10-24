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

// REQ-201 — kinds accepted by the declarative assertion syntax. `region` is a
// hierarchy kind but is not declared per-thing; keep this list in step with the
// `convertSource` grammar and the provider template's `{{KIND_LIST}}`.
export const WORLD_MODEL_DECLARABLE_KINDS = [
  "thing", "container", "supporter", "door", "device", "vehicle", "person", "backdrop",
] as const;

export type DeclarableKind = (typeof WORLD_MODEL_DECLARABLE_KINDS)[number];

// REQ-200/REQ-202a — documented property contracts. This table is the single
// source for the `world://kinds` property section and the generated provider
// document. `WorldThing` and the `convertSource` regexes remain the behavioral
// source: adding a property or changing an accepted setter form requires
// updating this table in the same change.
export interface WorldPropertyContract {
  name: string;
  values: string;
  contract: string;
  group: string;
  doc: "all-things" | WorldKind[];
  settersNamed?: string[];
  settersCurrent?: string[];
}

export const WORLD_MODEL_PROPERTIES: readonly WorldPropertyContract[] = [
  {
    name: "portable", values: "true / false", group: "Universal Properties (all things)", doc: "all-things",
    contract: "IF false THEN the thing cannot be taken.",
    settersNamed: ["is fixed", "is portable"], settersCurrent: ["It is fixed", "It is portable"],
  },
  {
    name: "openable", values: "true / false", group: "Container Properties", doc: ["container"],
    contract: "IF true THEN the thing has open/closed state.",
    settersNamed: ["is openable"], settersCurrent: ["It is openable"],
  },
  {
    name: "open", values: "true / false", group: "Container and Door Properties", doc: ["container", "door"],
    contract: "IF true THEN contents are visible and accessible; a closed door blocks passage.",
    settersNamed: ["is open"], settersCurrent: ["It is open", "It is closed"],
  },
  {
    name: "lockable", values: "true / false", group: "Container and Door Properties", doc: ["container", "door"],
    contract: "IF true THEN the thing has locked/unlocked state.",
    settersNamed: ["is lockable"], settersCurrent: ["It is lockable"],
  },
  {
    name: "locked", values: "true / false", group: "Container and Door Properties", doc: ["container", "door"],
    contract: "IF true AND closed THEN the thing cannot be opened.",
    settersNamed: ["is locked"], settersCurrent: ["It is locked"],
  },
  {
    name: "capacity", values: "integer", group: "Supporter and Vehicle Properties", doc: ["supporter", "vehicle"],
    contract: "Maximum number of things the supporter or vehicle can hold.",
  },
  {
    name: "lit", values: "true / false", group: "Light Properties (things)", doc: "all-things",
    contract: "Whether the thing provides light.",
    settersNamed: ["is lit", "is dark"], settersCurrent: ["It is lit", "It is dark"],
  },
  {
    name: "switchable", values: "true / false", group: "Device Properties", doc: ["device"],
    contract: "IF true THEN the thing exposes switched on/off state.",
    settersNamed: ["is switchable"], settersCurrent: ["It is switchable"],
  },
  {
    name: "switched_on", values: "true / false", group: "Device Properties", doc: ["device"],
    contract: "Current device state; set with `It is switched on.` or `It is switched off.`",
    settersCurrent: ["It is switched on", "It is switched off"],
  },
  {
    name: "enterable", values: "true / false", group: "Vehicle Properties", doc: ["vehicle"],
    contract: "IF true THEN the thing has a virtual interior room.",
    settersNamed: ["is enterable"], settersCurrent: ["It is enterable"],
  },
  {
    name: "wearable", values: "true / false", group: "Extended Properties (all things)", doc: "all-things",
    contract: "IF true THEN the thing can be worn on the body.",
    settersNamed: ["is wearable"], settersCurrent: ["It is wearable"],
  },
  {
    name: "readable", values: "true / false", group: "Extended Properties (all things)", doc: "all-things",
    contract: "IF true THEN the thing carries discoverable `read_text`.",
    settersNamed: ["is readable"], settersCurrent: ["It is readable"],
  },
  {
    name: "edible", values: "true / false", group: "Extended Properties (all things)", doc: "all-things",
    contract: "IF true THEN the thing can be eaten and is consumed on use.",
    settersNamed: ["is edible"], settersCurrent: ["It is edible"],
  },
  {
    name: "drinkable", values: "true / false", group: "Extended Properties (all things)", doc: "all-things",
    contract: "IF true THEN the thing can be drunk and is consumed on use.",
    settersNamed: ["is drinkable"], settersCurrent: ["It is drinkable"],
  },
  {
    name: "climbable", values: "true / false", group: "Extended Properties (all things)", doc: "all-things",
    contract: "IF true THEN the thing can be climbed.",
    settersNamed: ["is climbable"], settersCurrent: ["It is climbable"],
  },
  {
    name: "transparent", values: "true / false", group: "Extended Properties (all things)", doc: "all-things",
    contract: "IF true THEN contents are visible without opening.",
    settersNamed: ["is transparent"], settersCurrent: ["It is transparent"],
  },
  {
    name: "noise", values: "text", group: "Extended Properties (all things)", doc: "all-things",
    contract: "Auditory cue text the thing emits; `listen` reports it. Null when no cue is modeled.",
    settersNamed: ['has a noise of "..."'], settersCurrent: [],
  },
  {
    name: "scent", values: "text", group: "Extended Properties (all things)", doc: "all-things",
    contract: "Olfactory cue text the thing emits; `smell` reports it. Null when no cue is modeled.",
    settersNamed: ['has a scent of "..."'], settersCurrent: [],
  },
];

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
  // REQ-318 — sensory text properties (null when no cue is modeled).
  noise: string | null;
  scent: string | null;
  key?: string;
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
  { verb: "look", category: "navigation", args: [], effect: "Describe the current room: name, description, visible things, exits." },
  { verb: "go", category: "navigation", args: ["direction"], effect: "Move through an exit in the given direction." },
  { verb: "north", category: "navigation", args: [], effect: "Short-form alias for `go north`." },
  { verb: "south", category: "navigation", args: [], effect: "Short-form alias for `go south`." },
  { verb: "east", category: "navigation", args: [], effect: "Short-form alias for `go east`." },
  { verb: "west", category: "navigation", args: [], effect: "Short-form alias for `go west`." },
  { verb: "northeast", category: "navigation", args: [], effect: "Short-form alias for `go northeast`." },
  { verb: "northwest", category: "navigation", args: [], effect: "Short-form alias for `go northwest`." },
  { verb: "southeast", category: "navigation", args: [], effect: "Short-form alias for `go southeast`." },
  { verb: "southwest", category: "navigation", args: [], effect: "Short-form alias for `go southwest`." },
  { verb: "up", category: "navigation", args: [], effect: "Short-form alias for `go up`." },
  { verb: "down", category: "navigation", args: [], effect: "Short-form alias for `go down`." },
  { verb: "in", category: "navigation", args: [], effect: "Short-form alias for `go in`." },
  { verb: "out", category: "navigation", args: [], effect: "Short-form alias for `go out`." },
  { verb: "take", category: "object_interaction", args: ["thing"], effect: "Pick up a portable thing in the current room." },
  { verb: "drop", category: "object_interaction", args: ["thing"], effect: "Drop a held thing in the current room." },
  { verb: "inventory", category: "inventory", args: [], effect: "List held things." },
  { verb: "i", category: "inventory", args: [], effect: "Short-form alias for `inventory`." },
  { verb: "open", category: "object_interaction", args: ["thing"], effect: "Open an openable thing." },
  { verb: "close", category: "object_interaction", args: ["thing"], effect: "Close an openable thing." },
  { verb: "unlock", category: "object_interaction", args: ["thing", "key"], effect: "Unlock a lockable thing with the named key." },
  { verb: "lock", category: "object_interaction", args: ["thing", "key"], effect: "Lock a lockable thing with the named key." },
  { verb: "put", category: "object_interaction", args: ["thing", "target"], effect: "Place a thing inside or on a container or supporter." },
  { verb: "search", category: "inspection", args: ["thing"], effect: "Examine a thing's contents (containers, supporters)." },
  { verb: "examine", category: "inspection", args: ["thing"], effect: "Show a thing's description." },
  { verb: "wait", category: "wait", args: [], effect: "Pass time; advance narrative countdowns." },
];

export function resolveThingName(input: string, thingsInRoom: WorldThing[], inventory: string[]): WorldThing[] {
  // Normalize both sides (lowercase, strip a leading article) so `take the
  // pulse rifle` matches a thing named `A Pulse Rifle`. Prefer exact matches.
  const norm = (s: string) => s.toLowerCase().trim().replace(/^(?:the|an?)\s+/, "");
  const want = norm(input);
  if (!want) return [];
  const exact = thingsInRoom.filter(t => norm(t.name) === want);
  if (exact.length > 0) return exact;
  return thingsInRoom.filter(t => {
    const n = norm(t.name);
    return n.includes(want) || want.includes(n);
  });
}

export function resolveThingInInventory(input: string, heldThings: WorldThing[]): WorldThing[] {
  const norm = (s: string) => s.toLowerCase().trim().replace(/^(?:the|an?)\s+/, "");
  const want = norm(input);
  if (!want) return [];
  const exact = heldThings.filter(t => norm(t.name) === want);
  if (exact.length > 0) return exact;
  return heldThings.filter(t => {
    const n = norm(t.name);
    return n.includes(want) || want.includes(n);
  });
}

// ── convert_source (REQ-201) ──────────────────────────────────────

export interface ConvertResult {
  rooms: number;
  things: number;
  exits: number;
  annotations: { encounters: number; npcs: number; traps: number; lore: number };
  warnings: { line: number; pattern: string; message: string }[];
}

// REQ-201 — the thing-kind grammar is derived from the declarable-kind list so
// the parser and the documented assertion syntax cannot drift.
const THING_KIND_DECLARATION = new RegExp(
  `^(.+?) is a (${WORLD_MODEL_DECLARABLE_KINDS.join("|")})\\.\\s*(?:"(.*)")?\\s*$`,
  "i",
);

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
      const existingRoom = world.rooms.get(name.toLowerCase());
      if (existingRoom) {
        // Preserve exits/doorRefs accumulated when this room was first referenced
        // as an exit target (a stub); replacing it would silently drop them.
        existingRoom.name = name;
        if (description) existingRoom.description = description;
      } else {
        world.rooms.set(name.toLowerCase(), { name, description, exits: new Map(), doorRefs: new Map(), annotations: {} });
      }
      currentRoom = name;
      currentThing = null;
      continue;
    }

    // Multi-direction door form: "<Name> is <dir> of <RoomA> and <dir2> of <RoomB>."
    const doorMatch = text.match(/^(.+?) is (\w+) of (.+?) and (\w+) of (.+?)\.$/i);
    if (doorMatch) {
      const doorName = doorMatch[1].trim();
      const dirA = doorMatch[2].toLowerCase();
      const roomA = doorMatch[3].trim();
      const dirB = doorMatch[4].toLowerCase();
      const roomB = doorMatch[5].trim();
      if (isDirection(dirA) && isDirection(dirB)) {
        let rA = world.rooms.get(roomA.toLowerCase());
        if (!rA) { rA = { name: roomA, description: "", exits: new Map(), doorRefs: new Map(), annotations: {} }; world.rooms.set(roomA.toLowerCase(), rA); }
        let rB = world.rooms.get(roomB.toLowerCase());
        if (!rB) { rB = { name: roomB, description: "", exits: new Map(), doorRefs: new Map(), annotations: {} }; world.rooms.set(roomB.toLowerCase(), rB); }
        rA.exits.set(dirA as Direction, roomB);
        rB.exits.set(dirB as Direction, roomA);
        rA.doorRefs.set(dirA as Direction, doorName);
        rB.doorRefs.set(dirB as Direction, doorName);
        const door: WorldThing = {
          name: doorName,
          description: "",
          kind: "door",
          location: roomA,
          locationType: "room",
          portable: false,
          openable: true,
          open: false,
          lockable: true,
          locked: true,
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
          noise: null,
          scent: null,
          annotations: {},
          doorConnects: { roomA, roomB },
        };
        world.things.set(doorName.toLowerCase(), door);
        currentThing = doorName;
        currentRoom = null;
        continue;
      }
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
      if (room.exits.has(dir as Direction)) {
        warnings.push({ line: lnum, pattern: text, message: `Exit '${dir}' from '${roomName}' overwrites an existing exit.` });
      }
      room.exits.set(dir as Direction, targetName);
      // Implicit reverse exit
      if (target.exits.has(oppositeDirection(dir as Direction))) {
        warnings.push({ line: lnum, pattern: text, message: `Implicit reverse exit into '${targetName}' overwrites an existing exit.` });
      }
      target.exits.set(oppositeDirection(dir as Direction), roomName);
      currentRoom = null;
      currentThing = null;
      continue;
    }

    // Current-thing placement: "It is in <Room>." / "It is on <Supporter>."
    // (places the thing declared by the preceding kind/property statement).
    const placeMatch = text.match(/^It is (in|on) (.+?)\.\s*$/i);
    if (placeMatch) {
      if (!currentThing) {
        warnings.push({ line: lnum, pattern: text, message: "Placement with no current thing." });
        continue;
      }
      const thing = world.things.get(currentThing.toLowerCase());
      if (thing) {
        thing.location = placeMatch[2].trim();
        thing.locationType = placeMatch[1].toLowerCase() === "on" ? "supporter" : "room";
      }
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
        noise: null,
        scent: null,
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
        noise: null,
        scent: null,
        annotations: {},
      };
      world.things.set(thingName.toLowerCase(), thing);
      currentThing = thingName;
      currentRoom = null;
      continue;
    }

    // Thing kind declaration: "<Name> is a <kind>." or "<Name> is a <kind>. "Description.""
    const kindMatch = text.match(THING_KIND_DECLARATION);
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
        if (kind === "vehicle") { existing.portable = false; existing.enterable = true; existing.vehiclePassengers = existing.vehiclePassengers || []; existing.vehicleInterior = existing.vehicleInterior || desc; existing.capacity = existing.capacity ?? 4; }
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
          vehicleInterior: kind === "vehicle" ? desc : undefined,
          vehiclePassengers: [],
          capacity: kind === "vehicle" ? 4 : undefined,
          wearable: false,
          worn_by: null,
          readable: false,
          read_text: null,
          edible: false,
          drinkable: false,
          climbable: false,
          transparent: false,
          noise: null,
          scent: null,
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

    // Key binding: "Its key is <thing>." binds the preceding thing's lock (REQ-552).
    const keyMatch = text.match(/^Its key is (.+?)\.\s*$/i);
    if (keyMatch && currentThing) {
      const thing = world.things.get(currentThing.toLowerCase());
      if (thing) thing.key = keyMatch[1].trim().toLowerCase().replace(/^the\s+/, "").replace(/^an?\s+/, "");
      continue;
    }

    // read_text extraction: "The inscription on the altar reads 'Beware.'" (REQ-318b)
    const readTextMatch = text.match(/^The inscription on (.+?) reads ['"](.+)['"]\.?$/i);
    if (readTextMatch) {
      const target = readTextMatch[1].trim().toLowerCase().replace(/^the\s+/, "").replace(/^an?\s+/, "");
      const norm = (n: string) => n.toLowerCase().replace(/^the\s+/, "").replace(/^an?\s+/, "");
      const things = [...world.things.values()];
      const thing = things.find((t) => norm(t.name) === target)
        ?? things.find((t) => norm(t.name).includes(target) || target.includes(norm(t.name)));
      if (thing) {
        thing.readable = true;
        thing.read_text = readTextMatch[2];
      } else {
        warnings.push({ line: lnum, pattern: text, message: `Thing '${readTextMatch[1].trim()}' not found for inscription.` });
      }
      continue;
    }

    // Sensory cue extraction: "<Name> has a noise of \"...\"." (REQ-318b)
    const senseMatch = text.match(/^(.+?) has (?:a )?(noise|scent) of ["'](.+)["']\.?\s*$/i);
    if (senseMatch) {
      const target = senseMatch[1].trim().toLowerCase().replace(/^the\s+/, "").replace(/^an?\s+/, "");
      const norm = (n: string) => n.toLowerCase().replace(/^the\s+/, "").replace(/^an?\s+/, "");
      const things = [...world.things.values()];
      const thing = things.find((t) => norm(t.name) === target)
        ?? things.find((t) => norm(t.name).includes(target) || target.includes(norm(t.name)));
      if (thing) {
        const field = senseMatch[2].toLowerCase() as "noise" | "scent";
        thing[field] = senseMatch[3];
      } else {
        warnings.push({ line: lnum, pattern: text, message: `Thing '${senseMatch[1].trim()}' not found for sensory cue.` });
      }
      continue;
    }

    // Device switch-state assertion: "It is switched on." / "It is switched off." (REQ-316b)
    const switchedMatch = text.match(/^It is (switched on|switched off)\.\s*$/i);
    if (switchedMatch) {
      const thing = world.things.get((currentThing ?? "").toLowerCase());
      if (thing) {
        thing.switched_on = switchedMatch[1].toLowerCase() === "switched on";
      } else {
        warnings.push({ line: lnum, pattern: text, message: "Switched-state declaration with no current thing target." });
      }
      continue;
    }

    // Property declaration: "<Name> is <property>." or "It is <property> and <property>."
    const propMatch = text.match(/^It is (fixed|portable|openable|open|close|closed|lockable|locked|lit|dark|switchable|wearable|readable|edible|drinkable|climbable|transparent|enterable)(?: and (fixed|portable|locked|open|closed))?\.\s*$/i) ||
                      text.match(/^(.+?) is (fixed|portable|openable|open|lockable|locked|lit|dark|switchable|wearable|readable|edible|drinkable|climbable|transparent|enterable)\.\s*$/i);

    if (propMatch) {
      let targetName = currentThing;
      let props: string[] = [];

      if (propMatch[1] && propMatch[1].match(/^(fixed|portable|openable|open|lockable|locked|lit|dark|close|closed|switchable|wearable|readable|edible|drinkable|climbable|transparent|enterable)$/i)) {
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
          case "switchable": thing.switchable = true; break;
          case "wearable": thing.wearable = true; break;
          case "readable": thing.readable = true; break;
          case "edible": thing.edible = true; break;
          case "drinkable": thing.drinkable = true; break;
          case "climbable": thing.climbable = true; break;
          case "transparent": thing.transparent = true; break;
          case "enterable": thing.enterable = true; break;
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
  for (const [, thing] of world.things) {
    if (!thing.location) warnings.push({ line: 0, pattern: thing.name, message: `Thing '${thing.name}' has no location — declare it directly after its room, before any exit statement.` });
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

  lines.push("\n## Property Contracts");
  let lastGroup = "";
  for (const prop of WORLD_MODEL_PROPERTIES) {
    if (prop.group !== lastGroup) {
      lines.push(`\n### ${prop.group}`);
      lastGroup = prop.group;
    }
    lines.push(`- **${prop.name}** (${prop.values}): ${prop.contract}`);
  }

  lines.push("\n## Parser Commands");
  for (const cmd of BASE_PARSER_COMMANDS) {
    lines.push(`- \`${cmd.verb}\` [${cmd.category}]`);
  }

  lines.push("\n## Verb Coverage Tiers");
  const tiers = verbCatalog(undefined);
  lines.push(`- core (${tiers.core.length}): ${tiers.core.map(v => v.verb).join(", ") || "none"}`);
  lines.push(`- standard (${tiers.standard.length}): ${tiers.standard.map(v => v.available ? v.verb : v.verb + " (unavailable)").join(", ") || "none"}`);
  lines.push(`- extended (${tiers.extended.length}): ${tiers.extended.map(v => v.verb).join(", ") || "none registered"}`);

  return lines.join("\n");
}

// ── Verb coverage tiers (REQ-283) ─────────────────────────────────

export interface TieredVerb {
  verb: string;
  available: boolean;
}

export interface VerbCatalog {
  core: TieredVerb[];
  standard: TieredVerb[];
  extended: TieredVerb[];
}

const CORE_VERBS = ["look", "go", "examine", "take", "drop", "inventory", "wait"];
const STANDARD_VERBS = ["open", "close", "lock", "unlock", "push", "pull", "search", "read", "listen", "smell", "sit", "stand", "wear", "remove", "eat", "drink", "light", "extinguish", "climb", "jump", "enter", "exit", "put", "insert", "switch on", "switch off", "ask", "tell", "give", "show", "throw"];

// Maps a standard verb to the world-model property whose presence makes it
// available; verbs without an entry are always available.
const VERB_PROPERTY: Record<string, (t: any) => boolean> = {
  "open": (t) => t.openable,
  "close": (t) => t.openable,
  "lock": (t) => t.lockable,
  "unlock": (t) => t.lockable,
  "read": (t) => t.readable || !!t.read_text,
  "wear": (t) => t.wearable,
  "remove": (t) => t.wearable,
  "eat": (t) => t.edible,
  "drink": (t) => t.drinkable,
  "climb": (t) => t.climbable,
  "enter": (t) => t.enterable,
  "exit": (t) => t.enterable,
  "light": (t) => t.lit || t.switchable,
  "extinguish": (t) => t.lit || t.switchable,
  "sit": (t) => t.kind === "supporter",
  "stand": (t) => t.kind === "supporter",
  "switch on": (t) => t.switchable,
  "switch off": (t) => t.switchable,
};

export function verbCatalog(world: { things: Map<string, any> } | undefined): VerbCatalog {
  const things = world ? [...world.things.values()] : [];
  const core = CORE_VERBS.map(verb => ({ verb, available: true }));
  const standard = STANDARD_VERBS.map((verb) => {
    const check = VERB_PROPERTY[verb];
    if (!check) return { verb, available: true };
    return { verb, available: things.some(check) };
  });
  const extended: TieredVerb[] = [];
  return { core, standard, extended };
}
