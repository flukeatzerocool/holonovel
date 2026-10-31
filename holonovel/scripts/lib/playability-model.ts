// playability-model.ts — pure content-solvability analysis for the playability
// gate. No engine, no I/O beyond the caller's parsed Novel object.
//
// Derives a seeded action script from a Novel's world graph (BFS over rooms,
// keys, and locked doors), then reports typed findings for goal reachability,
// soft-locks, countdown target validity, economy collapse, and encounter
// declarations. Predicate anchors cite this file so a finding names the
// condition it rests on.
//
// REQ citations: REQ-565 (starter Novel), REQ-200 (world-model reachability),
// REQ-073c2 / REQ-329a (countdown direction and trigger deltas), REQ-090 /
// REQ-091 (adventure/encounter content), REQ-622/REQ-622a (hazard balance).
// Exit codes: n/a (library).

export type FindingClass =
  | "unreachable_goal"
  | "soft_lock"
  | "countdown_target_invalid"
  | "economy_collapse"
  | "encounter_unsurvivable"
  | "goal_unreached_dynamic";

export interface Finding {
  class: FindingClass;
  novel: string;
  pointer: string;
  detail: string;
  anchor: string;
}

export interface Room {
  name: string;
  exits: Map<string, string>;
  doorRefs: Map<string, string>;
  annotations: Record<string, string>;
}

export interface Thing {
  name: string;
  kind: string;
  location: string | null;
  portable: boolean;
  openable: boolean;
  open: boolean;
  lockable: boolean;
  locked: boolean;
  key: string | null;
}

export interface Countdown {
  name: string;
  ticks: number;
  total: number;
  direction: "increment" | "decrement";
  on_scene_transition: boolean;
  triggers: string[];
  world_effect: { type: string; target?: string; direction?: string; destination?: string; property?: string } | null;
}

export interface NovelShape {
  slug?: string;
  name?: string;
  scene_location?: string | null;
  world?: {
    rooms?: Record<string, unknown>;
    things?: Record<string, unknown>;
  };
  countdowns?: Record<string, unknown>;
  entities?: Record<string, unknown>;
  npcs?: Record<string, unknown>;
}

export interface EncounterSpec {
  at_room: string;
  participants: string[];
  dangers: { name: string; ac?: number; hp?: number; initiative_bonus?: number }[];
  max_rounds?: number;
  seed?: string;
}

export interface ManifestEntry {
  path: string;
  expect: FindingClass[];
  goal?: string;
  encounters?: EncounterSpec[];
  seed?: number;
}

export interface WorldModel {
  novel: NovelShape;
  rooms: Map<string, Room>;
  things: Map<string, Thing>;
  start: string | null;
  goals: Set<string>;
  doorKey: Map<string, string>;
  keyIndex: Map<string, number>;
}

export type PathAction =
  | { kind: "take"; thing: string }
  | { kind: "move"; direction: string; from: string; to: string };

export interface WinningPath {
  actions: PathAction[];
  visited: string[];
  transitions: number;
  taken: Set<string>;
}

export type ScriptStep =
  | { tool: "run_command"; args: { action: "execute"; command: string }; tag?: string }
  | { tool: "manage_combat"; args: Record<string, unknown>; tag?: string }
  | { tool: "manage_countdown"; args: Record<string, unknown>; tag?: string };

export interface DerivedScript {
  steps: ScriptStep[];
  goalRooms: string[];
  countdownAdvances: { name: string; advances: number }[];
}

const ANCHOR = "holonovel/scripts/lib/playability-model.ts";

function lower(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function buildWorldModel(novel: NovelShape, goalOverride?: string): WorldModel {
  const rooms = new Map<string, Room>();
  const things = new Map<string, Thing>();

  for (const [id, raw] of Object.entries(asRecord(novel.world?.rooms))) {
    const room = asRecord(raw);
    const name = String(room.name ?? id);
    const exits = new Map<string, string>();
    for (const [dir, target] of Object.entries(asRecord(room.exits))) {
      exits.set(lower(dir), lower(target));
    }
    const doorRefs = new Map<string, string>();
    for (const [dir, door] of Object.entries(asRecord(room.doorRefs))) {
      doorRefs.set(lower(dir), lower(door));
    }
    const annotations: Record<string, string> = {};
    for (const [key, value] of Object.entries(asRecord(room.annotations))) annotations[lower(key)] = String(value);
    rooms.set(lower(name), { name, exits, doorRefs, annotations });
  }

  for (const [id, raw] of Object.entries(asRecord(novel.world?.things))) {
    const thing = asRecord(raw);
    const name = String(thing.name ?? id);
    things.set(lower(name), {
      name,
      kind: String(thing.kind ?? "thing"),
      location: thing.location == null ? null : lower(thing.location),
      portable: thing.portable !== false,
      openable: thing.openable === true,
      open: thing.open === true,
      lockable: thing.lockable === true,
      locked: thing.locked === true,
      key: thing.key == null ? null : lower(thing.key),
    });
  }

  const doorKey = new Map<string, string>();
  for (const [name, thing] of things) {
    if (thing.kind === "door" && thing.locked && thing.key) doorKey.set(name, thing.key);
  }
  const keyIndex = new Map<string, number>();
  for (const key of [...new Set(doorKey.values())].sort()) keyIndex.set(key, keyIndex.size);

  const start = novel.scene_location == null ? null : lower(novel.scene_location);

  const goals = new Set<string>();
  if (goalOverride) {
    goals.add(lower(goalOverride));
  } else {
    for (const room of rooms.values()) {
      for (const [dir, target] of room.exits) {
        if (dir === "out") goals.add(target);
      }
    }
    if (goals.size === 0) {
      for (const room of rooms.values()) {
        for (const target of room.exits.values()) {
          if (!rooms.has(target)) goals.add(target);
        }
      }
    }
  }

  return { novel, rooms, things, start, goals, doorKey, keyIndex };
}

function stateKey(room: string, mask: number): string {
  return `${room}\u0000${mask}`;
}

export function findWinningPath(model: WorldModel): WinningPath | null {
  const { rooms, things, start, goals, doorKey, keyIndex } = model;
  if (!start || !rooms.has(start) || goals.size === 0) return null;

  const goalMask = 0;
  const startKey = stateKey(start, goalMask);
  const predecessor = new Map<string, { prev: string | null; action: PathAction | null }>();
  predecessor.set(startKey, { prev: null, action: null });
  const queue: { room: string; mask: number }[] = [{ room: start, mask: 0 }];
  let foundKey: string | null = null;

  while (queue.length > 0) {
    const { room, mask } = queue.shift()!;
    if (goals.has(room)) {
      foundKey = stateKey(room, mask);
      break;
    }
    const node = rooms.get(room);
    if (!node) continue;

    for (const [key, index] of keyIndex) {
      const thing = things.get(key);
      if (!thing || thing.location !== room) continue;
      if (mask & (1 << index)) continue;
      const nextMask = mask | (1 << index);
      const nextKey = stateKey(room, nextMask);
      if (predecessor.has(nextKey)) continue;
      predecessor.set(nextKey, { prev: stateKey(room, mask), action: { kind: "take", thing: key } });
      queue.push({ room, mask: nextMask });
    }

    for (const [direction, target] of node.exits) {
      const door = node.doorRefs.get(direction);
      if (door) {
        const doorThing = things.get(door);
        if (doorThing?.locked) {
          const required = doorKey.get(door);
          if (!required) continue;
          const index = keyIndex.get(required);
          if (index === undefined || !(mask & (1 << index))) continue;
        }
      }
      const nextKey = stateKey(target, mask);
      if (predecessor.has(nextKey)) continue;
      predecessor.set(nextKey, {
        prev: stateKey(room, mask),
        action: { kind: "move", direction, from: room, to: target },
      });
      queue.push({ room: target, mask });
    }
  }

  if (!foundKey) return null;

  const actions: PathAction[] = [];
  let cursor: string | null = foundKey;
  while (cursor) {
    const entry: { prev: string | null; action: PathAction | null } = predecessor.get(cursor)!;
    if (entry.action) actions.push(entry.action);
    cursor = entry.prev;
  }
  actions.reverse();

  const visited = [start];
  const taken = new Set<string>();
  let transitions = 0;
  for (const action of actions) {
    if (action.kind === "take") taken.add(action.thing);
    else {
      visited.push(action.to);
      transitions += 1;
    }
  }
  return { actions, visited, transitions, taken };
}

export function countdowns(model: WorldModel): Countdown[] {
  const out: Countdown[] = [];
  for (const [id, raw] of Object.entries(asRecord(model.novel.countdowns))) {
    const cd = asRecord(raw);
    const effect = cd.world_effect == null ? null : asRecord(cd.world_effect);
    out.push({
      name: String(cd.name ?? id),
      ticks: Number(cd.ticks ?? cd.total ?? 0),
      total: Number(cd.total ?? cd.ticks ?? 0),
      direction: cd.direction === "increment" ? "increment" : "decrement",
      on_scene_transition: cd.on_scene_transition === true,
      triggers: Array.isArray(cd.triggers) ? cd.triggers.map(String) : [],
      world_effect: effect
        ? {
            type: String(effect.type ?? ""),
            target: effect.target == null ? undefined : String(effect.target),
            direction: effect.direction == null ? undefined : String(effect.direction),
            destination: effect.destination == null ? undefined : String(effect.destination),
            property: effect.property == null ? undefined : String(effect.property),
          }
        : null,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function triggerDelta(trigger: string): { kind: string; target: string; delta: number } | null {
  const match = trigger.match(/^on_(room_enter|thing_take|door_open)\((.+?)\)(?:([+-]\d+))?$/);
  if (!match) return null;
  return { kind: match[1], target: lower(match[2]), delta: match[3] ? Number(match[3]) : 0 };
}

function effectTargetResolves(model: WorldModel, countdown: Countdown): boolean {
  const effect = countdown.world_effect;
  if (!effect) return true;
  const target = lower(effect.target);
  if (!target) return false;
  if (effect.type === "property") return model.things.has(target);
  if (effect.type === "exit" || effect.type === "describe") {
    if (!model.rooms.has(target)) return false;
    if (effect.type === "exit" && !effect.destination) {
      const room = model.rooms.get(target)!;
      const direction = lower(effect.direction);
      return direction.length > 0 && room.exits.has(direction);
    }
    return true;
  }
  return false;
}

export function countdownFindings(model: WorldModel): Finding[] {
  const findings: Finding[] = [];
  const novel = model.novel.slug ?? model.novel.name ?? "unknown";
  for (const cd of countdowns(model)) {
    const pointer = `/countdowns/${cd.name}`;
    if (cd.total < 1) {
      findings.push({
        class: "countdown_target_invalid",
        novel,
        pointer,
        detail: `countdown '${cd.name}' has total ${cd.total} (< 1)`,
        anchor: `${ANCHOR}:323`,
      });
      continue;
    }
    if (cd.world_effect && !effectTargetResolves(model, cd)) {
      findings.push({
        class: "countdown_target_invalid",
        novel,
        pointer,
        detail: `countdown '${cd.name}' world_effect target '${cd.world_effect.target}' does not resolve`,
        anchor: `${ANCHOR}:305`,
      });
    }
  }
  return findings;
}

/** Refill things keyed by room lower-name for one gating clock. */
function refillsFor(model: WorldModel, countdown: Countdown): Map<string, { thing: string; delta: number }[]> {
  const byRoom = new Map<string, { thing: string; delta: number }[]>();
  for (const trigger of countdown.triggers) {
    const parsed = triggerDelta(trigger);
    if (!parsed || parsed.kind !== "thing_take" || parsed.delta === 0) continue;
    const thing = model.things.get(parsed.target);
    if (!thing || !thing.location) continue;
    const list = byRoom.get(thing.location) ?? [];
    list.push({ thing: parsed.target, delta: parsed.delta });
    byRoom.set(thing.location, list);
  }
  return byRoom;
}

function gatingCountdowns(model: WorldModel): Countdown[] {
  return countdowns(model).filter(
    (cd) => cd.direction === "decrement" && cd.on_scene_transition && cd.world_effect?.type === "exit",
  );
}

export function economyFindings(model: WorldModel, path: WinningPath): Finding[] {
  const findings: Finding[] = [];
  const novel = model.novel.slug ?? model.novel.name ?? "unknown";
  for (const cd of gatingCountdowns(model)) {
    const refills = refillsFor(model, cd);
    let ticks = cd.ticks;
    const start = path.visited[0];
    for (const refill of refills.get(start) ?? []) ticks = Math.min(cd.total, ticks + refill.delta);
    let collapseAt: number | null = null;
    for (let i = 1; i < path.visited.length; i += 1) {
      ticks -= 1;
      if (ticks <= 0) {
        collapseAt = i;
        break;
      }
      for (const refill of refills.get(path.visited[i]) ?? []) ticks = Math.min(cd.total, ticks + refill.delta);
    }
    if (collapseAt !== null) {
      findings.push({
        class: "economy_collapse",
        novel,
        pointer: `/countdowns/${cd.name}`,
        detail: `countdown '${cd.name}' expires after ${collapseAt} of ${path.transitions} transitions on the winning path`,
        anchor: `${ANCHOR}:372`,
      });
    }
  }
  return findings;
}

export interface BalanceReport {
  remainingWax: number;
  remainingMatches: number;
  lowWater: number;
  spill: number;
  expectedSnuffs: number;
  matchBundles: number;
  detourTraps: number;
}

/** REQ-622/REQ-622a — report the deterministic hazard balance of a winning
 *  path under the gamble-all policy: encounter spills, expected trap snuffs,
 *  match bundles, and the resulting wax/match end state. Report-only. */
export function balanceReport(model: WorldModel, path: WinningPath): BalanceReport | null {
  const gating = gatingCountdowns(model)[0];
  if (!gating) return null;
  const refills = refillsFor(model, gating);
  const trapTicks: number[] = [];
  let spill = 0;
  let matchBundles = 0;
  let detourTraps = 0;
  const dreadCd = countdowns(model).find((cd) => cd.name.toLowerCase() === "dread");
  let dread = dreadCd?.ticks ?? 0;
  const matchCd = countdowns(model).find((cd) => cd.name.toLowerCase() === "matches");
  const matchRooms = new Map<string, number>();
  for (const trigger of matchCd?.triggers ?? []) {
    const parsed = triggerDelta(trigger);
    if (!parsed || parsed.kind !== "thing_take") continue;
    const thing = model.things.get(parsed.target);
    if (thing?.location) matchRooms.set(thing.location, (matchRooms.get(thing.location) ?? 0) + Math.abs(parsed.delta));
  }
  let ticks = gating.ticks;
  let low = ticks;
  for (let i = 0; i < path.visited.length; i += 1) {
    const room = path.visited[i];
    if (i > 0) ticks -= 1;
    const annotations = model.rooms.get(room)?.annotations ?? {};
    const encounter = /spill=(\d+)/i.exec(annotations.encounter ?? "");
    if (encounter) spill += Number(encounter[1]);
    if (annotations.trap) {
      if (/avoid=([1-9]\d*)/i.test(annotations.trap)) detourTraps += 1;
      trapTicks.push(dread);
    }
    if (matchRooms.has(room)) matchBundles += 1;
    for (const refill of refills.get(room) ?? []) ticks = Math.min(gating.total, ticks + refill.delta);
    if (annotations.encounter) {
      const n = Number(/spill=(\d+)/i.exec(annotations.encounter ?? "")?.[1] ?? 0);
      ticks -= n;
    }
    if (matchCd && matchRooms.has(room)) {
      // matches are counted, not wax; handled above
    }
    low = Math.min(low, ticks);
    if (/entry landing$/i.test(room) && (dreadCd?.direction ?? "increment") === "increment") dread += 1;
  }
  const expectedSnuffs = trapTicks.reduce((sum, value) => sum + value, 0) / 8;
  const remainingMatches = Math.max(0, matchBundles * 2 - expectedSnuffs);
  return { remainingWax: ticks, remainingMatches, lowWater: low, spill, expectedSnuffs, matchBundles, detourTraps };
}

export function findStructuralPath(model: WorldModel): WinningPath | null {
  const { rooms, start, goals } = model;
  if (!start || !rooms.has(start) || goals.size === 0) return null;
  const predecessor = new Map<string, { prev: string | null; direction: string | null }>();
  predecessor.set(start, { prev: null, direction: null });
  const queue = [start];
  let found: string | null = null;
  while (queue.length > 0) {
    const room = queue.shift()!;
    if (goals.has(room)) {
      found = room;
      break;
    }
    for (const [direction, target] of rooms.get(room)?.exits ?? []) {
      if (predecessor.has(target)) continue;
      predecessor.set(target, { prev: room, direction });
      queue.push(target);
    }
  }
  if (!found) return null;
  const actions: PathAction[] = [];
  let cursor: string | null = found;
  while (cursor) {
    const entry: { prev: string | null; direction: string | null } = predecessor.get(cursor)!;
    if (entry.prev && entry.direction) actions.push({ kind: "move", direction: entry.direction, from: entry.prev, to: cursor });
    cursor = entry.prev;
  }
  actions.reverse();
  const visited = [start, ...actions.map((action) => (action.kind === "move" ? action.to : start))];
  return { actions, visited, transitions: actions.length, taken: new Set() };
}

export function staticFindings(model: WorldModel, path: WinningPath | null, encounters: EncounterSpec[] = []): Finding[] {
  const novel = model.novel.slug ?? model.novel.name ?? "unknown";
  const findings: Finding[] = [];
  findings.push(...countdownFindings(model));

  if (!path) {
    const soft = softLock(model);
    if (soft) findings.push(soft);
    else {
      findings.push({
        class: "unreachable_goal",
        novel,
        pointer: "/world/rooms",
        detail: `no path from '${model.start ?? "(no start)"}' to ${[...model.goals].join(", ") || "(no goal)"}`,
        anchor: `${ANCHOR}:197`,
      });
    }
  }

  const economyPath = path ?? findStructuralPath(model);
  if (economyPath) findings.push(...economyFindings(model, economyPath));

  for (const encounter of encounters) {
    const known = new Set([...Object.keys(asRecord(model.novel.entities)), ...Object.keys(asRecord(model.novel.npcs))]);
    const missing = encounter.participants.filter((participant) => !known.has(participant));
    if (missing.length > 0) {
      findings.push({
        class: "encounter_unsurvivable",
        novel,
        pointer: `/encounters/${encounter.at_room}`,
        detail: `encounter at '${encounter.at_room}' names unknown participant(s): ${missing.join(", ")}`,
        anchor: `${ANCHOR}:434`,
      });
    }
  }

  return findings;
}

function softLock(model: WorldModel): Finding | null {
  const novel = model.novel.slug ?? model.novel.name ?? "unknown";
  if (!model.start) return null;
  for (const [doorName, keyName] of model.doorKey) {
    const door = model.things.get(doorName);
    if (!door || !door.location) continue;
    const key = model.things.get(keyName);
    if (!key || !key.location) continue;
    const reachable = reachableWithDoorClosed(model, doorName);
    if (!reachable.has(key.location)) {
      return {
        class: "soft_lock",
        novel,
        pointer: `/world/things/${keyName}`,
        detail: `key '${keyName}' is only reachable behind '${doorName}', which it opens`,
        anchor: `${ANCHOR}:473`,
      };
    }
  }
  return null;
}

function reachableWithDoorClosed(model: WorldModel, closedDoor: string): Set<string> {
  const seen = new Set<string>();
  if (!model.start) return seen;
  const queue = [model.start];
  seen.add(model.start);
  while (queue.length > 0) {
    const room = model.rooms.get(queue.shift()!);
    if (!room) continue;
    for (const [direction, target] of room.exits) {
      if (room.doorRefs.get(direction) === closedDoor) continue;
      if (seen.has(target)) continue;
      seen.add(target);
      queue.push(target);
    }
  }
  return seen;
}

function refillThingsOnPath(model: WorldModel, path: WinningPath): string[] {
  const candidates = new Set<string>();
  for (const cd of countdowns(model)) {
    for (const trigger of cd.triggers) {
      const parsed = triggerDelta(trigger);
      if (parsed && parsed.kind === "thing_take" && parsed.delta > 0) candidates.add(parsed.target);
    }
  }
  const onPath: string[] = [];
  for (const room of path.visited) {
    for (const name of candidates) {
      const thing = model.things.get(name);
      if (thing?.location === room) onPath.push(name);
    }
  }
  return [...new Set(onPath)];
}

export function deriveScript(model: WorldModel, path: WinningPath, encounters: EncounterSpec[], seed: number): DerivedScript {
  const steps: ScriptStep[] = [];
  const opened = new Set<string>();
  const taken = new Set<string>();
  const push = (command: string) => steps.push({ tool: "run_command", args: { action: "execute", command } });

  const emitPickups = (room: string) => {
    for (const name of refillThingsOnPath(model, path)) {
      const thing = model.things.get(name);
      if (thing?.location !== room || taken.has(name)) continue;
      taken.add(name);
      push(`take ${thing.name}`);
    }
  };
  const emitEncounter = (room: string) => {
    for (const encounter of encounters) {
      if (lower(encounter.at_room) !== room) continue;
      const rounds = Math.max(1, encounter.max_rounds ?? 3);
      steps.push({
        tool: "manage_combat",
        args: { action: "init", participants: encounter.participants, dangers: encounter.dangers, seed: encounter.seed ?? String(seed) },
        tag: `encounter_init:${room}`,
      });
      for (let round = 0; round < rounds; round += 1) {
        steps.push({ tool: "manage_combat", args: { action: "advance" }, tag: `encounter_advance:${room}` });
      }
      steps.push({ tool: "manage_combat", args: { action: "end", outcome: "playability gate" }, tag: `encounter_end:${room}` });
    }
  };

  emitPickups(path.visited[0]);
  emitEncounter(path.visited[0]);
  for (const action of path.actions) {
    if (action.kind === "take") {
      if (taken.has(action.thing)) continue;
      const thing = model.things.get(action.thing);
      if (!thing) continue;
      taken.add(action.thing);
      push(`take ${thing.name}`);
      continue;
    }
    const room = model.rooms.get(action.from);
    const doorName = room?.doorRefs.get(action.direction);
    if (doorName) {
      const door = model.things.get(doorName);
      if (door && !door.open && !opened.has(doorName)) {
        if (door.locked && door.key) {
          const key = model.things.get(door.key);
          if (key) push(`unlock ${door.name} with ${key.name}`);
        }
        push(`open ${door.name}`);
        opened.add(doorName);
      }
    }
    push(`go ${action.direction}`);
    emitPickups(action.to);
    emitEncounter(action.to);
  }

  const countdownAdvances: { name: string; advances: number }[] = [];
  steps.push({ tool: "run_command", args: { action: "execute", command: "look" }, tag: "final_look" });
  for (const cd of countdowns(model)) {
    if (!cd.world_effect) continue;
    const advances = cd.direction === "increment" ? Math.max(0, cd.total - Math.min(cd.ticks, cd.total)) : Math.min(cd.ticks, cd.total);
    if (advances <= 0) continue;
    countdownAdvances.push({ name: cd.name, advances });
    for (let i = 0; i < advances; i += 1) {
      steps.push({ tool: "manage_countdown", args: { action: "advance", name: cd.name }, tag: `countdown_advance:${cd.name}` });
    }
    steps.push({ tool: "manage_countdown", args: { action: "list" }, tag: "countdown_list" });
  }

  return { steps, goalRooms: [...model.goals], countdownAdvances };
}

export function loadNovel(raw: unknown): NovelShape {
  return asRecord(raw) as NovelShape;
}
