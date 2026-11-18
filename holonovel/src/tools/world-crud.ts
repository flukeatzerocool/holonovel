// World-model CRUD tools — the `manage_world` surface (REQ-201, REQ-328,
// REQ-329, REQ-368), moved out of `index.ts` during stage 2 of its split.
// The block is verbatim: only the registration call is rebound to `register`
// and the single `knowledgeTools` read goes through the context accessor.
// `registerWorldCrudTools` returns the schema that `resolve_intent` still
// spreads into its own causal parameters.

import { z } from "zod";
import {
  WorldRoom, WorldThing, WorldKind, Direction, ROOM_DIRECTIONS, WORLD_MODEL_KINDS,
  createEmptyWorldModel, convertSource, oppositeDirection,
} from "../world/model.js";
import { createRng, sessionRoll } from "../core/rng.js";
import { requireGM, requireNovel } from "../core/server.js";
import type { WorldGenRole, GeneratedSecret, GeneratedWitness, WorldGenTable, WorldGenRoll } from "../world/generation-types.js";
import type { RegisterTool, ToolContext } from "./context.js";

export function registerWorldCrudTools(register: RegisterTool, ctx: ToolContext) {
const { state, audit, ok, err, raw, mergeScopedArgs, sanitizeGenerationName, worldSnapshot, rulesets, pickParams, worldGenMaxRooms, WORLD_GEN_ROLES, generationObjectKind, validateGeneratedWorld, worldGenRoleOf, sanitizeGenerationText, rollGenerationTable, materializeAnnotations, needInput, seedWarningSuffix, knowledgeTools } = ctx;
// --- World-Model CRUD (GM-only) ---

// World (REQ-201, REQ-328, REQ-329, REQ-368) — consolidated room/thing/exit/convert surface with
// the previously-missing update_room/update_thing lifecycle (completeness).
const MANAGE_WORLD_CAUSAL_PARAMS = new Set(["causal_scope", "causal_domain", "causal_entity", "causal_key", "causal_value", "causal_from", "causal_expected_version", "causal_origin_source", "causal_source_ordinal", "causal_proposal_id"]);
// REQ-317c — the default vehicle passenger capacity; `convert` and
// `create_thing` share it so the two creation paths cannot disagree.
const DEFAULT_VEHICLE_CAPACITY = 4;
const MANAGE_WORLD_SCHEMA = {
    action: z.enum(["list", "get", "create_room", "update_room", "remove_room", "create_thing", "update_thing", "remove_thing", "create_exit", "remove_exit", "convert", "generate", "causal_propose", "causal_admit", "causal_reject", "causal_list", "causal_state", "causal_ingress"]).describe("World: list, get, create_room, update_room, remove_room, create_thing, update_thing, remove_thing, create_exit, remove_exit, convert, or generate. Causal: causal_propose, causal_admit, causal_reject, causal_list, causal_state, or causal_ingress."),
    name: z.string().optional().describe("Room/thing name (create/update/remove)."),
    id: z.string().optional().describe("Room or thing id (get; the lowercased name)."),
    description: z.string().optional().describe("Optional description (create/update)."),
    kind: z.string().optional().describe("Optional thing kind (create_thing)."),
    location: z.string().optional().describe("Optional containing room or thing (create_thing/update_thing)."),
    location_type: z.enum(["room", "container", "supporter"]).optional().describe("Where the thing is placed (create_thing)."),
    fixed: z.boolean().optional().describe("When true the thing cannot be taken (create_thing/update_thing)."),
    openable: z.boolean().optional().describe("When true the thing can be opened (create_thing/update_thing)."),
    lockable: z.boolean().optional().describe("When true the thing can be locked (create_thing/update_thing)."),
    locked: z.boolean().optional().describe("When true the thing starts locked (create_thing/update_thing)."),
    lit: z.boolean().optional().describe("When true the thing is lit (create_thing/update_thing)."),
    switched_on: z.boolean().optional().describe("When true the thing is switched on (create_thing/update_thing)."),
    switchable: z.boolean().optional().describe("When true the thing can be switched (create_thing/update_thing)."),
    transparent: z.boolean().optional().describe("When true the thing is transparent (create_thing/update_thing)."),
    readable: z.boolean().optional().describe("When true the thing can be read (create_thing/update_thing)."),
    read_text: z.string().optional().describe("Text revealed when the thing is read (create_thing/update_thing)."),
    key: z.string().optional().describe("Bound key thing name required to unlock or lock this thing when lockable (create_thing/update_thing)."),
    wearable: z.boolean().optional().describe("When true the thing can be worn (create_thing/update_thing)."),
    edible: z.boolean().optional().describe("When true the thing can be eaten (create_thing/update_thing)."),
    drinkable: z.boolean().optional().describe("When true the thing can be drunk (create_thing/update_thing)."),
    enterable: z.boolean().optional().describe("When true the thing can be entered (create_thing/update_thing)."),
    capacity: z.number().int().positive().optional().describe("Maximum passengers for a vehicle (create_thing/update_thing; defaults to 4 for vehicles)."),
    climbable: z.boolean().optional().describe("When true the thing can be climbed (create_thing/update_thing)."),
    noise: z.string().optional().describe("Auditory cue text reported by listen (create_thing/update_thing)."),
    scent: z.string().optional().describe("Olfactory cue text reported by smell (create_thing/update_thing)."),
    direction: z.string().optional().describe("Direction (create_exit/remove_exit)."),
    room: z.string().optional().describe("Source room (create_exit/remove_exit)."),
    room_a: z.string().optional().describe("Source room (create_exit)."),
    room_b: z.string().optional().describe("Destination room (create_exit)."),
    from: z.string().optional().describe("Source room alias for room_a (create_exit)."),
    to: z.string().optional().describe("Destination room alias for room_b (create_exit)."),
    door: z.string().optional().describe("Door thing name bound to the created exit (create_exit); the door must already exist with kind 'door'."),
    source: z.string().optional().describe("Hybrid world-model source text (convert)."),
    seed: z.string().optional().describe("Deterministic seed (generate)."),
    options: z.object({
      roles: z.object({
        room: z.array(z.string()).optional(),
        objects: z.array(z.string()).optional(),
        persons: z.array(z.string()).optional(),
        hazards: z.array(z.string()).optional(),
      }).optional(),
      rooms: z.number().int().positive().optional(),
    }).optional().describe("Generation options (generate): roles maps installed table names to room, objects, persons, or hazards pools; rooms requests a count bounded by TTRPG_WORLD_GEN_MAX_ROOMS."),
    causal_scope: z.string().optional().describe("Scope coordinate (causal_propose; default the active Novel slug)."),
    causal_domain: z.enum(["location", "scalar"]).optional().describe("location or scalar (causal_propose; default location)."),
    causal_entity: z.string().optional().describe("Entity whose objective state is proposed (causal_propose)."),
    causal_key: z.string().optional().describe("State key within the entity (causal_propose)."),
    causal_value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional().describe("Proposed value (causal_propose/causal_ingress)."),
    causal_from: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional().describe("Expected prior value (causal_propose)."),
    causal_expected_version: z.number().optional().describe("Optimistic version guard (causal_propose)."),
    causal_origin_source: z.enum(["narrative", "machine", "ruleset"]).optional().describe("narrative, machine, or ruleset (causal_propose)."),
    causal_source_ordinal: z.number().optional().describe("Contributing event-log ordinal (causal_propose; default the latest event)."),
    causal_proposal_id: z.string().optional().describe("Recorded proposal id (causal_admit/causal_reject)."),
  };

register("manage_world", {
  title: "World Model Management",
  description: "Manage the world model — rooms, things, exits, and their spatial properties. create and update mutate in place and persist to the Novel; all mutations are audited; remove is permanent and requires re-creation; convert replaces the described subtree; generate creates rooms from installed table pools bounded by TTRPG_WORLD_GEN_MAX_ROOMS. create_exit links both directions and optionally binds an existing door thing so the door blocks passage; create_thing honors location_type only when location is set, and kind forces property defaults. list enumerates rooms, things, and exits; get returns one record by id; both are read-only and require the Game Master or Editor badge. Use when: creating, updating, removing, bulk-converting, generating, or inspecting locations and objects. Do NOT use when: navigating the world — use run_command (action: execute); recording what an entity believes — use manage_belief.",
  inputSchema: pickParams(MANAGE_WORLD_SCHEMA, Object.keys(MANAGE_WORLD_SCHEMA).filter((key) => !MANAGE_WORLD_CAUSAL_PARAMS.has(key))),
}, async (args: any) => {
  if (typeof args.action === "string" && args.action.startsWith("causal_")) return knowledgeTools().handleCausalActions(mergeScopedArgs(args, "causal"));
  switch (args.action) {
    case "list": {
      requireGM();
      const novel = requireNovel();
      const kind = typeof args.kind === "string" ? args.kind.toLowerCase() : null;
      const rooms = [...novel.world.rooms.values()].map((room) => ({
        id: room.name.toLowerCase(),
        name: room.name,
        description: room.description,
        exits: [...room.exits.entries()].map(([direction, destination]) => ({ direction, destination })),
      }));
      const things = [...novel.world.things.values()]
        .filter((thing) => !kind || thing.kind === kind)
        .map((thing) => ({
          id: thing.name.toLowerCase(),
          name: thing.name,
          kind: thing.kind,
          location: thing.location,
          location_type: thing.locationType,
        }));
      return raw(JSON.stringify({ rooms, things }, null, 2));
    }
    case "get": {
      requireGM();
      const novel = requireNovel();
      const id = String(args.id ?? args.name ?? "").toLowerCase();
      if (!id) return err("INVALID_INPUT", "id is required for get.");
      const room = novel.world.rooms.get(id);
      if (room) {
        return raw(JSON.stringify({
          kind: "room",
          id,
          name: room.name,
          description: room.description,
          exits: [...room.exits.entries()].map(([direction, destination]) => ({ direction, destination })),
          door_refs: Object.fromEntries(room.doorRefs),
        }, null, 2));
      }
      const thing = novel.world.things.get(id);
      if (thing) return raw(JSON.stringify({ id, ...thing }, null, 2));
      return err("NOT_FOUND", `World object '${id}' not found.`);
    }
    case "create_room": {
      requireGM();
      const novel = requireNovel();
      worldSnapshot();
      const lower = args.name.toLowerCase();
      if (novel.world.rooms.has(lower)) return err("STATE_CONFLICT", `Room '${args.name}' already exists.`);
      const room: WorldRoom = { name: args.name, description: args.description ?? "", exits: new Map(), doorRefs: new Map(), annotations: {} };
      novel.world.rooms.set(lower, room);
      state.saveNovel(novel);
      audit("create_room", { name: args.name });
      return ok(`Room '${args.name}' created.`);
    }
    case "update_room": {
      requireGM();
      const novel = requireNovel();
      const room = novel.world.rooms.get(args.name.toLowerCase());
      if (!room) return err("NOT_FOUND", `Room '${args.name}' not found.`);
      worldSnapshot();
      const fields: string[] = [];
      if (args.description !== undefined) { room.description = args.description; fields.push("description"); }
      state.saveNovel(novel);
      audit("update_room", { name: args.name, fields });
      return ok(`Room '${args.name}' updated.`);
    }
    case "remove_room": {
      requireGM();
      const novel = requireNovel();
      const lower = args.name.toLowerCase();
      if (!novel.world.rooms.has(lower)) return err("NOT_FOUND", `Room '${args.name}' not found.`);
      worldSnapshot();
      // REQ-198 — remove all contained things, transitively: a thing is
      // removed when its location names the room or any removed thing.
      const removedThings = new Set<string>();
      let grew = true;
      while (grew) {
        grew = false;
        for (const [tKey, thing] of novel.world.things) {
          if (removedThings.has(tKey)) continue;
          const loc = thing.location?.toLowerCase();
          if (!loc) continue;
          if (loc === lower || removedThings.has(loc)) {
            removedThings.add(tKey);
            grew = true;
          }
        }
      }
      // Connected exits in both directions, plus their bound doors.
      const removedDoors = new Set<string>();
      let exits = 0;
      for (const [rKey, room] of novel.world.rooms) {
        for (const [dir, target] of [...room.exits.entries()]) {
          if (rKey !== lower && target.toLowerCase() !== lower) continue;
          const doorName = room.doorRefs.get(dir);
          if (doorName) removedDoors.add(doorName.toLowerCase());
          room.exits.delete(dir);
          room.doorRefs.delete(dir);
          exits++;
        }
      }
      for (const doorName of removedDoors) {
        if (novel.world.things.has(doorName)) removedThings.add(doorName);
      }
      for (const [, room] of novel.world.rooms) {
        for (const [dir, doorName] of [...room.doorRefs.entries()]) {
          if (removedDoors.has(doorName.toLowerCase())) room.doorRefs.delete(dir);
        }
      }
      for (const id of removedThings) novel.world.things.delete(id);
      novel.world.rooms.delete(lower);
      state.saveNovel(novel);
      audit("remove_room", { name: args.name, things: removedThings.size, exits, doors: removedDoors.size });
      return ok(`Room '${args.name}' and its contents removed.`);
    }
    case "create_thing": {
      requireGM();
      const novel = requireNovel();
      worldSnapshot();
      const lower = args.name.toLowerCase();
      if (novel.world.things.has(lower)) return err("STATE_CONFLICT", `Thing '${args.name}' already exists.`);
      const validKinds = Object.keys(WORLD_MODEL_KINDS);
      const k = (args.kind && validKinds.includes(args.kind.toLowerCase())) ? args.kind.toLowerCase() as WorldKind : "thing";
      let locationType: "room" | "container" | "supporter" | "vehicle" | null = args.location ? "room" : null;
      if (args.location && args.location_type) {
        locationType = args.location_type;
      } else if (args.location) {
        const parent = novel.world.things.get(args.location.toLowerCase());
        if (parent && (parent.kind === "container" || parent.kind === "supporter" || parent.kind === "vehicle")) {
          locationType = parent.kind === "supporter" ? "supporter" : parent.kind === "vehicle" ? "vehicle" : "container";
        }
      }
      const thing: WorldThing = {
        name: args.name, description: args.description ?? "", kind: k,
        location: args.location ?? null, locationType,
        portable: !args.fixed && k !== "supporter" && k !== "door" && k !== "vehicle",
        openable: k === "container" || k === "door" || args.openable === true,
        open: false,
        lockable: k === "container" || k === "door" || args.lockable === true,
        locked: args.locked === true,
        lit: args.lit === true,
        switchable: k === "device" || args.switchable === true,
        switched_on: args.switched_on === true,
        transparent: args.transparent === true,
        readable: args.readable === true,
        read_text: args.read_text ?? null,
        wearable: args.wearable === true,
        edible: args.edible === true,
        drinkable: args.drinkable === true,
        enterable: args.enterable === true,
        climbable: args.climbable === true,
        capacity: k === "vehicle" ? (args.capacity ?? DEFAULT_VEHICLE_CAPACITY) : args.capacity,
        vehicleInterior: k === "vehicle" ? (args.description ?? undefined) : undefined,
        noise: args.noise ?? null, scent: args.scent ?? null,
        vehiclePassengers: [], worn_by: null, annotations: {},
        key: args.key ? String(args.key).toLowerCase().replace(/^the\s+/, "").replace(/^an?\s+/, "") : undefined,
      };
      novel.world.things.set(lower, thing);
      state.saveNovel(novel);
      audit("create_thing", { name: args.name, kind: k, location: args.location, location_type: locationType });
      return ok(`Thing '${args.name}' (${k}) created${args.location ? (locationType === "supporter" ? ` on ${args.location}` : locationType === "container" ? ` in container ${args.location}` : ` in ${args.location}`) : ""}.`);
    }
    case "update_thing": {
      requireGM();
      const novel = requireNovel();
      worldSnapshot();
      const thing = novel.world.things.get(args.name.toLowerCase());
      if (!thing) return err("NOT_FOUND", `Thing '${args.name}' not found.`);
      const boolFields = ["openable", "lockable", "locked", "lit", "switchable", "switched_on", "transparent", "readable", "wearable", "edible", "drinkable", "enterable", "climbable"];
      for (const f of boolFields) if (args[f] !== undefined) (thing as any)[f] = args[f];
      // REQ-198/REQ-200 — the tool exposes `fixed`; the state model stores its
      // inverse (`portable`). Writing `thing.fixed` would leave `portable`
      // untouched and the thing still takeable.
      if (args.fixed !== undefined) thing.portable = !args.fixed;
      if (args.description !== undefined) thing.description = args.description;
      if (args.noise !== undefined) thing.noise = args.noise;
      if (args.scent !== undefined) thing.scent = args.scent;
      if (args.location !== undefined) thing.location = args.location;
      if (args.capacity !== undefined) thing.capacity = args.capacity;
      if (args.key !== undefined) thing.key = args.key ? String(args.key).toLowerCase().replace(/^the\s+/, "").replace(/^an?\s+/, "") : undefined;
      state.saveNovel(novel);
      audit("update_thing", { name: args.name });
      return ok(`Thing '${args.name}' updated.`);
    }
    case "remove_thing": {
      requireGM();
      const novel = requireNovel();
      const lower = args.name.toLowerCase();
      if (!novel.world.things.has(lower)) return err("NOT_FOUND", `Thing '${args.name}' not found.`);
      worldSnapshot();
      novel.world.things.delete(lower);
      state.saveNovel(novel);
      audit("remove_thing", { name: args.name });
      return ok(`Thing '${args.name}' removed.`);
    }
    case "create_exit": {
      requireGM();
      const novel = requireNovel();
      const dir = String(args.direction ?? "").toLowerCase();
      if (!dir || !ROOM_DIRECTIONS.includes(dir as any)) return err("INVALID_INPUT", `Invalid or missing direction '${args.direction ?? ""}'. Valid: ${ROOM_DIRECTIONS.join(", ")}.`);
      const roomAName = args.room_a ?? args.room ?? args.from;
      const roomBName = args.room_b ?? args.to;
      if (!roomAName || !roomBName) return err("INVALID_INPUT", "create_exit requires a source (room_a/room/from) and a destination (room_b/to).");
      const roomA = novel.world.rooms.get(String(roomAName).toLowerCase());
      const roomB = novel.world.rooms.get(String(roomBName).toLowerCase());
      if (!roomA) return err("NOT_FOUND", `Room '${roomAName}' not found.`);
      if (!roomB) return err("NOT_FOUND", `Room '${roomBName}' not found.`);
      const opposite = oppositeDirection(dir as Direction);
      let door: WorldThing | undefined;
      if (args.door !== undefined) {
        door = novel.world.things.get(String(args.door).toLowerCase());
        if (!door || door.kind !== "door") return err("INVALID_INPUT", `Door '${args.door}' must name an existing door thing.`);
        if (door.doorConnects && (door.doorConnects.roomA.toLowerCase() !== roomA.name.toLowerCase() || door.doorConnects.roomB.toLowerCase() !== roomB.name.toLowerCase())) {
          return err("STATE_CONFLICT", `Door '${door.name}' is already bound to another exit.`);
        }
      }
      worldSnapshot();
      // Clear any prior binding on this direction so a re-created exit cannot
      // leave a stale blocking door (REQ-199).
      for (const [room, direction] of [[roomA, dir], [roomB, opposite]] as Array<[WorldRoom, string]>) {
        const priorName = room.doorRefs.get(direction);
        if (priorName) {
          const prior = novel.world.things.get(priorName.toLowerCase());
          if (prior?.doorConnects) delete prior.doorConnects;
          room.doorRefs.delete(direction);
        }
      }
      roomA.exits.set(dir as Direction, roomB.name);
      roomB.exits.set(opposite, roomA.name);
      if (door) {
        roomA.doorRefs.set(dir as Direction, door.name);
        roomB.doorRefs.set(opposite, door.name);
        door.doorConnects = { roomA: roomA.name, roomB: roomB.name };
      }
      state.saveNovel(novel);
      audit("create_exit", { direction: dir, room_a: roomAName, room_b: roomBName, ...(door ? { door: door.name } : {}) });
      return ok(`Exit created: ${dir} from ${roomAName} to ${roomBName}.`);
    }
    case "remove_exit": {
      requireGM();
      const novel = requireNovel();
      const dir = args.direction.toLowerCase();
      if (!ROOM_DIRECTIONS.includes(dir as any)) return err("INVALID_INPUT", `Invalid direction.`);
      const room = novel.world.rooms.get(args.room.toLowerCase());
      if (!room) return err("NOT_FOUND", `Room '${args.room}' not found.`);
      if (!room.exits.has(dir as Direction)) return err("NOT_FOUND", `No ${dir} exit from '${args.room}'.`);
      worldSnapshot();
      const opposite = oppositeDirection(dir as Direction);
      const targetName = room.exits.get(dir as Direction)!;
      const target = novel.world.rooms.get(targetName.toLowerCase());
      const doorName = room.doorRefs.get(dir as Direction);
      room.exits.delete(dir as Direction);
      room.doorRefs.delete(dir as Direction);
      // Remove the reverse edge only when it still points back at this room.
      if (target && target.exits.get(opposite)?.toLowerCase() === room.name.toLowerCase()) {
        const reverseDoor = target.doorRefs.get(opposite);
        target.exits.delete(opposite);
        target.doorRefs.delete(opposite);
        const boundName = doorName ?? reverseDoor;
        if (boundName) {
          const bound = novel.world.things.get(boundName.toLowerCase());
          if (bound?.doorConnects) delete bound.doorConnects;
        }
      } else if (doorName) {
        const bound = novel.world.things.get(doorName.toLowerCase());
        if (bound?.doorConnects) delete bound.doorConnects;
      }
      state.saveNovel(novel);
      audit("remove_exit", { direction: dir, room: args.room });
      return ok(`Exit ${dir} from '${args.room}' removed.`);
    }
    case "convert": {
      requireGM();
      const novel = requireNovel();
      worldSnapshot();
      if (novel.world.rooms.size > 0) {
        return err("STATE_CONFLICT", "World model already populated. Use CRUD actions to modify, or create a new novel.");
      }
      const { world, result } = convertSource(args.source, novel.world);
      novel.world = world;
      // REQ-079a — @npc/@lore directives write Novel state after the world is
      // final, so a directive may name any room the source declares.
      const linked = materializeAnnotations(novel, result.directives, null);
      state.saveNovel(novel);
      audit("convert_source", { rooms: result.rooms, things: result.things, exits: result.exits, npcs: linked.counts.npcs, lore: linked.counts.lore });
      let msg = `[OK] World model populated: ${result.rooms} rooms, ${result.things} things, ${result.exits} exits.`;
      msg += ` Linked annotations — encounters: ${result.annotations.encounters}, NPCs: ${linked.counts.npcs}, traps: ${result.annotations.traps}, lore: ${linked.counts.lore}.`;
      for (const warning of linked.warnings) msg += `\n[WARNING] ${warning}`;
      if (result.warnings.length > 0) {
        msg += `\n\nWarnings:`;
        for (const w of result.warnings) msg += `\nLine ${w.line}: ${w.message}`;
      }
      return raw(msg);
    }
    // REQ-431 — procedural world generation: deterministic table-driven scaffold
    // offered as a workflow decision (apply/discard). Never fabricates mechanics.
    case "generate": {
      requireGM();
      const novel = requireNovel();
      if (novel.pending_workflow) return err("STATE_CONFLICT", "A workflow decision is pending. Resolve it with respond before generating.");
      if (novel.world.rooms.size > 0) return err("STATE_CONFLICT", "World model already populated. Use CRUD actions to modify, or create a new novel.");
      const slug = novel.ruleset;
      let tables: Record<string, any> = {};
      if (slug && rulesets.isInstalled(slug)) {
        const model = rulesets.hydrate(slug).model as any;
        tables = model.generation_tables ?? {};
      }
      const entries: WorldGenTable[] = Object.entries(tables)
        .filter(([, t]) => t && typeof t === "object" && Array.isArray((t as any).ranges))
        .map(([key, t]: [string, any]) => ({
          key,
          title: String(t.title ?? t.name ?? key),
          dice_expression: String(t.dice_expression ?? "1d100"),
          ranges: (t.ranges as any[])
            .map((r) => ({ min: Number(r.min), max: Number(r.max), result: r.result }))
            .filter((r) => Number.isFinite(r.min) && Number.isFinite(r.max)),
        }))
        .filter((t) => t.ranges.length > 0);
      if (entries.length === 0) {
        return ok("No generation tables in this ruleset — manage_world (action: generate) cannot fabricate rooms. Corrective action: bind a ruleset whose package defines generation tables, or build the world manually with manage_world (action: create_room).");
      }

      const roles: Record<WorldGenRole, string[]> = { room: [], objects: [], persons: [], hazards: [], secrets: [] };
      for (const entry of entries) {
        const role = worldGenRoleOf(entry.key, entry.title);
        if (role) roles[role].push(entry.key);
      }
      const explicitRoles = (args.options as any)?.roles;
      if (explicitRoles !== undefined) {
        if (!explicitRoles || typeof explicitRoles !== "object") return err("INVALID_INPUT", "options.roles must be an object mapping room, objects, persons, hazards, or secrets to table names.");
        for (const role of WORLD_GEN_ROLES) {
          const names = (explicitRoles as Record<string, unknown>)[role];
          if (names === undefined) continue;
          if (!Array.isArray(names)) return err("INVALID_INPUT", `options.roles.${role} must be an array of table names.`);
          const resolved: string[] = [];
          for (const raw of names) {
            const want = String(raw);
            const match = entries.find((e) => e.key === want || e.title === want)
              ?? entries.find((e) => e.key.toLowerCase() === want.toLowerCase() || e.title.toLowerCase() === want.toLowerCase());
            if (!match) return err("INVALID_INPUT", `options.roles.${role} names unknown table '${want}'.`);
            resolved.push(match.key);
          }
          roles[role] = [...new Set(resolved)];
        }
      } else if (roles.room.length === 0) {
        // D2 — no room-role table: theme rooms from the first table (sorted).
        roles.room = [entries.slice().sort((a, b) => a.key.localeCompare(b.key))[0].key];
      }

      const byKey = new Map(entries.map((e) => [e.key, e]));
      const cap = Math.max(1, worldGenMaxRooms());
      const rng = args.seed ? createRng(String(args.seed)) : createRng(String(sessionRoll(1000000000)));
      const requestedRooms = Number((args.options as any)?.rooms);
      const roomCount = Number.isFinite(requestedRooms) && requestedRooms >= 1
        ? Math.min(cap, Math.floor(requestedRooms))
        : Math.min(cap, rng.roll(cap));

      const assertions: string[] = [];
      const rolls: WorldGenRoll[] = [];
      const usedNames = new Set<string>();
      const uniqueName = (base: string, fallback: string): string => {
        const seedName = base || fallback;
        let candidate = seedName;
        let n = 2;
        while (usedNames.has(candidate.toLowerCase())) { candidate = `${seedName} ${n}`; n++; }
        usedNames.add(candidate.toLowerCase());
        return candidate;
      };
      const draw = (key: string) => {
        const table = byKey.get(key)!;
        const roll = rollGenerationTable(rng, table);
        if (roll) rolls.push(roll);
        return { table, roll };
      };

      const roomNames: string[] = [];
      for (let i = 0; i < roomCount; i++) {
        const roomKey = roles.room[rng.roll(roles.room.length) - 1];
        const { table, roll } = draw(roomKey);
        const title = sanitizeGenerationName(table.title) || `Generation Table ${i + 1}`;
        const name = uniqueName(`${title} ${i + 1}`, `Chamber ${i + 1}`);
        const description = roll?.result || `A chamber shaped by the ${title} table.`;
        roomNames.push(name);
        assertions.push(`${name} is a room. "${description}"`);
      }

      if (roles.objects.length > 0) {
        for (let i = 0; i < roomCount; i++) {
          const count = rng.roll(3) - 1;
          for (let k = 0; k < count; k++) {
            const { table, roll } = draw(roles.objects[rng.roll(roles.objects.length) - 1]);
            const description = roll?.result || `An object drawn from the ${table.title} table.`;
            const base = sanitizeGenerationName(roll?.result ?? "") || sanitizeGenerationName(table.title) || "Object";
            const name = uniqueName(base, `${table.title} ${i + 1}-${k + 1}`);
            const kind = generationObjectKind(roll?.result ?? "", table.title);
            assertions.push(`${name} is a ${kind}. "${description}"`);
            assertions.push(`It is in ${roomNames[i]}.`);
            if (kind === "container" || kind === "supporter") {
              const inner = draw(roles.objects[rng.roll(roles.objects.length) - 1]);
              const innerDescription = inner.roll?.result || `A find drawn from the ${inner.table.title} table.`;
              const innerBase = sanitizeGenerationName(inner.roll?.result ?? "") || sanitizeGenerationName(inner.table.title) || "Find";
              const innerName = uniqueName(innerBase, `${inner.table.title} ${i + 1}-${k + 1} inner`);
              assertions.push(`${innerName} is a thing. "${innerDescription}"`);
              assertions.push(kind === "container" ? `${innerName} is in ${name}.` : `${innerName} is on ${name}.`);
            }
          }
        }
      }

      // REQ-431d — a secret-role draw becomes a readable clue inside a
      // reachable container, and a Novel secret linked to the room.
      let generatedSecret: GeneratedSecret | null = null;
      let secretRoomIndex = -1;
      if (roles.secrets.length > 0) {
        const { table, roll } = draw(roles.secrets[rng.roll(roles.secrets.length) - 1]);
        const content = sanitizeGenerationText(roll?.result ?? "");
        if (content) {
          secretRoomIndex = rng.roll(roomCount) - 1;
          const room = roomNames[secretRoomIndex];
          const containerName = uniqueName(`${sanitizeGenerationName(table.title) || "Hidden"} Cache`, "Hidden Cache");
          const clueName = uniqueName(`${sanitizeGenerationName(table.title) || "Hidden"} Clue`, "Hidden Clue");
          assertions.push(`${containerName} is a container.`);
          assertions.push(`It is in ${room}.`);
          assertions.push(`${clueName} is a thing.`);
          assertions.push(`It is in ${containerName}.`);
          assertions.push(`It is readable.`);
          assertions.push(`The inscription on ${clueName} reads "${content}".`);
          generatedSecret = {
            key: `world-gen-${table.key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${secretRoomIndex + 1}`,
            content,
            triggers: [],
            badge_scope: "game_master",
            world_target: room,
            clue: clueName,
            container: containerName,
          };
        }
      }

      let witness: GeneratedWitness | null = null;
      if (roles.persons.length > 0) {
        for (let i = 0; i < roomCount; i++) {
          if (rng.roll(2) !== 1) continue;
          const { table, roll } = draw(roles.persons[rng.roll(roles.persons.length) - 1]);
          const description = roll?.result || `A figure drawn from the ${table.title} table.`;
          const base = sanitizeGenerationName(roll?.result ?? "") || sanitizeGenerationName(table.title) || "Figure";
          const name = uniqueName(base, `${table.title} ${i + 1}`);
          assertions.push(`${name} is a person. "${description}"`);
          assertions.push(`It is in ${roomNames[i]}.`);
          if (generatedSecret && i === secretRoomIndex && !witness) witness = { name, room: roomNames[i] };
        }
        // REQ-431d — guarantee a witness in the secret's room when a secret was
        // placed; same-room sound makes it perceivable without requiring light.
        if (generatedSecret && !witness && secretRoomIndex >= 0) {
          const { table, roll } = draw(roles.persons[rng.roll(roles.persons.length) - 1]);
          const description = roll?.result || `A figure drawn from the ${table.title} table.`;
          const base = sanitizeGenerationName(roll?.result ?? "") || sanitizeGenerationName(table.title) || "Witness";
          const name = uniqueName(base, `${table.title} witness`);
          assertions.push(`${name} is a person. "${description}"`);
          assertions.push(`It is in ${roomNames[secretRoomIndex]}.`);
          witness = { name, room: roomNames[secretRoomIndex] };
        }
      }

      if (roles.hazards.length > 0) {
        for (let i = 0; i < roomCount; i++) {
          if (rng.roll(4) !== 1) continue;
          const { table, roll } = draw(roles.hazards[rng.roll(roles.hazards.length) - 1]);
          const description = roll?.result || `A hazard drawn from the ${table.title} table.`;
          const base = sanitizeGenerationName(roll?.result ?? "") || sanitizeGenerationName(table.title) || "Hazard";
          const name = uniqueName(base, `${table.title} ${i + 1}`);
          assertions.push(`${name} is a thing. "${description}"`);
          assertions.push(`It is fixed.`);
          assertions.push(`It is in ${roomNames[i]}.`);
        }
      }

      // Deterministic reciprocal exit graph: ring plus floor(roomCount / 4)
      // chords. convertSource adds the reverse exit, so one line per edge.
      const edges: [number, number][] = [];
      const edgeKeys = new Set<string>();
      const addEdge = (a: number, b: number) => {
        if (a === b) return;
        const key = [a, b].sort((x, y) => x - y).join("-");
        if (edgeKeys.has(key)) return;
        edgeKeys.add(key);
        edges.push([a, b]);
      };
      for (let i = 0; i < roomCount; i++) addEdge(i, (i + 1) % roomCount);
      const chordTarget = edges.length + Math.floor(roomCount / 4);
      let attempts = 0;
      while (edges.length < chordTarget && attempts < roomCount * 10 + 20) {
        attempts++;
        addEdge(rng.roll(roomCount) - 1, rng.roll(roomCount) - 1);
      }
      const usedDirections = new Map<number, Set<string>>();
      for (const [a, b] of edges) {
        const aDirs = usedDirections.get(a) ?? new Set<string>();
        const bDirs = usedDirections.get(b) ?? new Set<string>();
        const direction = ROOM_DIRECTIONS.find((d) => !aDirs.has(d) && !bDirs.has(oppositeDirection(d)));
        if (!direction) continue;
        aDirs.add(direction);
        bDirs.add(oppositeDirection(direction));
        usedDirections.set(a, aDirs);
        usedDirections.set(b, bDirs);
        assertions.push(`${direction} of ${roomNames[a]} is ${roomNames[b]}.`);
      }

      // Parse before offering so a malformed row is reported and dropped rather
      // than silently half-applied when the caller answers.
      let batch = assertions;
      let parsed = convertSource(batch.join("\n"), createEmptyWorldModel());
      let dropped: string[] = [];
      if (parsed.result.warnings.length > 0) {
        const warned = new Set(parsed.result.warnings.map((w) => w.line));
        dropped = parsed.result.warnings.map((w) => `line ${w.line}: ${w.message}`);
        batch = assertions.filter((_, idx) => !warned.has(idx + 1));
        parsed = convertSource(batch.join("\n"), createEmptyWorldModel());
      }

      const provenance = rolls.length > 0
        ? `\n\nRoll provenance: ${rolls.length} table roll(s) — ${[...new Set(rolls.map((r) => r.table))].join(", ")}.`
        : "";
      const droppedNote = dropped.length > 0 ? `\n\nDropped ${dropped.length} invalid assertion(s):\n${dropped.join("\n")}` : "";

      // REQ-431d — refuse a batch that fails spatial validation rather than
      // offering it for apply.
      const generatedSecrets = generatedSecret ? [generatedSecret] : [];
      const validation = validateGeneratedWorld(parsed.world, generatedSecrets, witness, roles.persons.length > 0);
      if (validation.length > 0) {
        return err("INVALID_INPUT", `World generation validation failed; the batch was not offered.\n${validation.join("\n")}`);
      }
      const report = "Validation: passed — all rooms reachable, exits reciprocal, containment and secret placement valid.";

      novel.pending_workflow = {
        decision: "world_generate",
        snapshot: state.captureWorkflowSnapshot(novel),
        payload: {
          assertions: batch.join("\n"),
          seed: args.seed ?? null,
          roomCount,
          roles,
          rolls,
          secrets: generatedSecrets,
          report,
          counts: { rooms: parsed.result.rooms, things: parsed.result.things, exits: parsed.result.exits },
        },
      };
      state.saveNovel(novel);
      return needInput(`World generation — ${parsed.result.rooms} rooms, ${parsed.result.things} things, ${parsed.result.exits} exits proposed (seed ${args.seed ?? "session"}).\n\n${batch.join("\n")}${provenance}${droppedNote}\n\n${report}\n\nRespond 'apply' to populate the world model, or 'discard' to cancel.${seedWarningSuffix(args.seed)}`);
    }
    default:
      return err("INVALID_INPUT", `Unknown world action '${args.action}'.`);
  }
});

return { MANAGE_WORLD_SCHEMA };
}
