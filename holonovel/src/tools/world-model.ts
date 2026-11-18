// World-model tools — the `run_command` surface (REQ-084, REQ-196e, REQ-197,
// REQ-319, REQ-622) and the hazard/countdown helpers it owns, moved out of
// `index.ts` during stage 3 of its split (2026-11-18).
//
// The block's bodies are unchanged: the factory head destructures `ctx` and the
// ports object so every handler body reads exactly as it did, and the two
// helpers the entry point still calls are returned from the factory rather than
// re-exported at module scope — the same shape `world-crud.ts` uses for its
// schema. A module-scope helper would force the block to module scope, where
// `ctx` is not yet bound.

import { z } from "zod";
import { hazardRoll as hazardDraw, parseRoomHazard } from "../core/hazard.js";
import { dedupeRelationships, isRelationshipInvolving, relationshipEndpoints, resolveRelationshipParty } from "../core/relationships.js";
import { presentEntityIds } from "../core/scene-ledger.js";
import { getBadge, requireGM, requireNovel } from "../core/server.js";
import type { Countdown, NovelEntity, NovelState } from "../core/state.js";
import { Direction, PARSER_CATALOG, READONLY_VERBS, ROOM_DIRECTIONS, WorldModel, WorldThing, verbCatalog, type ParserCategory } from "../world/model.js";
import { bareName, dispatchCommand, isAudibleFrom, isVisibleFrom, resolveGoMovement, roomIsLit, thingRoom, visibleHere } from "../world/parser.js";
import type { ParserState, RegisterTool, ToolContext } from "./context.js";

/** A relationship marker as the reactor consumes it (`index.ts` owns the nominal type). */
interface Marker { text: string; entity_ids: string[] }

/**
 * Everything the block needs from the entry point. The entry point builds this
 * literal once, beside the factory call; nothing here is a snapshot of mutable
 * state — the three session `let`s cross as accessors, and the parser state
 * crosses as an object reference.
 */
export interface WorldModelPorts {
  resolveIntentWorld(intent: string, novel: NovelState): Record<string, unknown>;
  presentIdsForLedger(novel: NovelState, extra?: string[]): string[];
  fireCountdown(novel: NovelState, name: string, cd: Countdown): void;
  resolvePendingDiscoveries(novel: NovelState): void;
  advanceSceneTransitionCountdowns(novel: NovelState): void;
  effectiveWisdomItems(module: string): any[];
  badgeCanSeeWisdom(item: any): boolean;
  currentBeat(novel: NovelState): string;
  activeLoreKeys(novel: NovelState): Set<string>;
  effectiveRoomDescriptionMode(): "brief" | "verbose" | "normal";
  runWorldReactivityCycle(novel: NovelState, markers: Marker[]): void;
  relationshipMarkers: Map<string, Marker[]>;
  playerReadonlyVerbs: Set<string>;
  parserState: ParserState;
  detailLevel(): "terse" | "normal" | "rich";
  playerRegister(): "character" | "meta";
  roomDescriptionMode(): "brief" | "verbose" | "normal";
  setRoomDescriptionMode(mode: "brief" | "verbose" | "normal"): void;
}

/** The two helpers the entry point still calls directly. */
export interface WorldModelTools {
  expireCountdown(novel: NovelState, name: string, cd: Countdown): void;
  expireSurvivalWithUnit(novel: NovelState, name: string, cd: Countdown): boolean;
}

export function registerWorldModelTools(register: RegisterTool, ctx: ToolContext, p: WorldModelPorts): WorldModelTools {
const { state, audit, ok, err, raw, rulesets, worldSnapshot } = ctx;
const {
  resolveIntentWorld, presentIdsForLedger, fireCountdown, resolvePendingDiscoveries,
  advanceSceneTransitionCountdowns, effectiveWisdomItems, badgeCanSeeWisdom,
  currentBeat, activeLoreKeys, effectiveRoomDescriptionMode, runWorldReactivityCycle,
  relationshipMarkers, playerReadonlyVerbs, parserState,
  detailLevel, playerRegister, roomDescriptionMode, setRoomDescriptionMode,
} = p;
// --- World-Model Tools ---


// REQ-622 / REQ-622a–c — generic hazard model. Rooms carry structured
// `encounter` / `trap` annotations; the survival parameters (bundle increment,
// per-use decrement, last-light ticks) live on the resource countdown. No
// content names are hardcoded here.
function findCountdownByName(novel: NovelState, name: string): [string, Countdown] | null {
  const want = name.toLowerCase();
  for (const [key, cd] of novel.countdowns.entries()) {
    if (key.toLowerCase() === want || cd.name.toLowerCase() === want) return [key, cd];
  }
  return null;
}

function resourceCountdown(novel: NovelState, name: string): Countdown | null {
  return findCountdownByName(novel, name)?.[1] ?? null;
}

// Pre-change resource inference, retained only to coerce legacy string
// annotations written before the structured model (REQ-622 compatibility shim).
function legacyHazardResource(novel: NovelState): string | undefined {
  for (const cd of novel.countdowns.values()) {
    if (cd.world_effect?.type === "exit") return cd.name;
  }
  return undefined;
}

function lightThingOf(novel: NovelState, resource: Countdown): WorldThing | undefined {
  const want = resource.survival?.light_thing;
  if (!want) return undefined;
  const lower = want.toLowerCase();
  return [...novel.world.things.values()].find((t) => t.name.toLowerCase() === lower);
}

function lastLightName(resourceName: string): string {
  return `${resourceName} — last light`;
}

// Deterministic across restarts: the seed, the room, and the number of prior
// hazard checks in this room (persisted in the audit log) select the draw.
// The audit log stores `args` as a JSON string, so the pure helper parses it.
function hazardRoll(novel: NovelState, roomName: string, faces = 8): number {
  return hazardDraw(novel.audit_log, process.env.TTRPG_SEED ?? "0", roomName, faces);
}

function startLastLight(novel: NovelState, resourceName: string, resource: Countdown, reason: string): void {
  const name = lastLightName(resourceName);
  const ticks = Math.max(1, resource.survival?.last_light_ticks ?? 3);
  const existing = novel.countdowns.get(name);
  if (existing) {
    existing.ticks = ticks;
    return;
  }
  novel.countdowns.set(name, {
    name,
    ticks,
    total: ticks,
    type: "narrative",
    scope: "shared",
    direction: "decrement",
    on_scene_transition: true,
    triggers: [],
    world_effect: resource.world_effect,
  });
  audit("last_light_start", { resource: resourceName, ticks, reason });
}

function spendUnit(novel: NovelState, resource: Countdown): string | null {
  const unitName = resource.survival?.unit_countdown;
  if (!unitName) return null;
  const unit = resourceCountdown(novel, unitName);
  if (!unit || unit.ticks <= 0) return null;
  unit.ticks -= 1;
  audit("unit_spend", { resource: resource.name, unit: unitName, remaining: unit.ticks });
  return unitName;
}

// REQ-622b/c — a successful trap check extinguishes the resource. The light
// goes out but the resource's ticks are preserved; an available unit relights
// it without loss, and no unit starts the declared last-light countdown.
function extinguishResource(novel: NovelState, resourceName: string): void {
  const resource = resourceCountdown(novel, resourceName);
  if (!resource) {
    audit("hazard_unbound", { resource: resourceName });
    return;
  }
  const thing = lightThingOf(novel, resource);
  if (!thing) {
    audit("hazard_unbound_light", { resource: resourceName });
    return;
  }
  if (!thing.lit) {
    startLastLight(novel, resourceName, resource, "already-extinguished");
    return;
  }
  thing.lit = false;
  if (resource.survival?.unit_countdown) {
    const unit = spendUnit(novel, resource);
    if (!unit) {
      startLastLight(novel, resourceName, resource, "no-unit");
      return;
    }
    thing.lit = true;
    novel.countdowns.delete(lastLightName(resourceName));
    audit("resource_relight", { resource: resourceName, unit });
    return;
  }
  audit("resource_extinguish", { resource: resourceName });
}

// REQ-622c — a survival resource at its expiry threshold with a unit in hand
// spends one and buys its declared last light instead of firing the effect.
function expireSurvivalWithUnit(novel: NovelState, name: string, cd: Countdown): boolean {
  if (!cd.survival?.unit_countdown) return false;
  const unit = spendUnit(novel, cd);
  if (!unit) return false;
  novel.countdowns.delete(name);
  startLastLight(novel, cd.name, cd, "unit-reprieve");
  audit("countdown_extended", { countdown: name, unit });
  return true;
}

function expireCountdown(novel: NovelState, name: string, cd: Countdown): void {
  if (expireSurvivalWithUnit(novel, name, cd)) return;
  fireCountdown(novel, name, cd);
}

function enterRoomHazards(novel: NovelState, roomName: string): string[] {
  const room = novel.world.rooms.get(roomName.toLowerCase());
  if (!room) return [];
  const { hazard, warnings } = parseRoomHazard(room.annotations, room.name, { legacyResource: legacyHazardResource(novel) });
  const out = warnings.map((w) => `[WARNING] ${w}`);

  if (hazard.encounter?.resource) {
    const resource = resourceCountdown(novel, hazard.encounter.resource);
    if (!resource) {
      out.push(`[WARNING] room '${room.name}': encounter resource '${hazard.encounter.resource}' is not an active countdown`);
    } else if (hazard.encounter.spill > 0) {
      resource.ticks = Math.max(0, resource.ticks - hazard.encounter.spill);
      audit("hazard_spill", { room: room.name, spill: hazard.encounter.spill, resource: resource.name, ticks: resource.ticks });
      if (resource.ticks <= 0) expireCountdown(novel, resource.name, resource);
    }
  }

  if (hazard.trap?.resource) {
    const resource = resourceCountdown(novel, hazard.trap.resource);
    const snuffClock = resourceCountdown(novel, hazard.trap.snuff);
    if (!resource) {
      out.push(`[WARNING] room '${room.name}': trap resource '${hazard.trap.resource}' is not an active countdown`);
    } else if (!snuffClock) {
      out.push(`[WARNING] room '${room.name}': trap snuff countdown '${hazard.trap.snuff}' is not active`);
    } else {
      const faces = Math.max(1, hazard.trap.faces);
      const chance = Math.max(0, Math.min(faces, snuffClock.ticks));
      const roll = hazardRoll(novel, room.name, faces);
      const snuffed = roll <= chance;
      audit("hazard_check", { room: room.name, roll, chance, faces, snuffed, resource: resource.name });
      if (snuffed) extinguishResource(novel, resource.name);
    }
  }

  return out;
}

// REQ-622c — a bundle is a thing whose `bundle_of` annotation names a resource;
// taking it advances that countdown by the resource's declared increment.
function advanceSurvivalBundle(novel: NovelState, thing: WorldThing | undefined): void {
  const target = thing?.annotations?.bundle_of;
  if (!target) return;
  const resource = resourceCountdown(novel, target);
  const increment = resource?.survival?.bundle_increment;
  if (!resource || !increment || increment <= 0) return;
  resource.ticks = Math.min(resource.total, resource.ticks + increment);
  audit("bundle_advance", { resource: resource.name, increment, ticks: resource.ticks, thing: thing!.name });
}

// REQ-329 — countdown-world coupling: advance any countdown whose mechanical
// trigger matches the given world-model event (`on_room_enter(<id>)`,
// `on_thing_take(<id>)`, `on_door_open(<ref>)`). Mechanical — fires regardless
// of narrative framing; supplements normal advancement.
function advanceWorldTriggeredCountdowns(novel: NovelState, event: string): void {
  const [evType, evTarget] = event.split(":");
  for (const [name, cd] of [...novel.countdowns.entries()]) {
    if (!cd.triggers || cd.triggers.length === 0) continue;
    for (const t of cd.triggers) {
      const m = t.match(/^on_(room_enter|thing_take|door_open)\((.+?)\)(?:([+-]\d+))?$/);
      if (!m || evType !== m[1] || evTarget !== m[2]) continue;
      const dir = cd.direction === "increment" ? 1 : -1;
      // REQ-329a — a signed suffix is a raw tick delta (refill); a bare
      // trigger keeps the legacy one tick in the countdown's direction.
      const delta = m[3] ? Number(m[3]) : dir;
      cd.ticks = Math.max(0, Math.min(cd.total, cd.ticks + delta));
      audit("countdown_world_trigger", { name, event, ticks: cd.ticks, delta });
      if ((dir < 0 && cd.ticks <= 0) || (dir > 0 && cd.ticks >= cd.total)) {
        expireCountdown(novel, name, cd);
      }
      state.saveNovel(novel);
      break;
    }
  }
}

// REQ-330 — knowledge-world coupling: exploration-derived knowledge entries on
// the active entity (rooms visited, things taken). Retained regardless of
// REQ-307/REQ-074 — co-locate the whole present party (plus the active entity)
// when the parser moves them. Shared by parser `go` and `climb` so both move
// the same set.
function movePartyTo(novel: NovelState, active: NovelEntity | undefined, roomName: string): Map<string, any> {
  const movers = new Map<string, any>();
  for (const id of presentEntityIds(novel) ?? novel.entities.keys()) {
    const m = novel.entities.get(id) ?? novel.npcs.get(id);
    if (m) movers.set(id, m);
  }
  if (active) movers.set(active.id, active);
  for (const [, m] of movers) if (m && "current_room" in m) m.current_room = roomName;
  return movers;
}

// current presence; grouped under "Explored" in knowledge_state.
function recordExplorationKnowledge(novel: NovelState, entity: any, type: "room" | "thing", name: string): void {
  if (!entity) return;
  const explored = (entity.knowledge?.explored ?? []) as Array<{ type: string; name: string; at: string }>;
  if (!explored.some((e) => e.type === type && e.name === name)) {
    explored.push({ type, name, at: new Date().toISOString() });
    entity.knowledge = { ...(entity.knowledge ?? {}), explored };
    state.saveNovel(novel);
  }
}

// REQ-596/REQ-597 — resolve a spatial actor (entity or NPC) or a thing for the
// read-only visibility/audibility queries.
interface SpatialActor { id: string; room: string | null; thing?: WorldThing }

function resolveSpatialActor(novel: NovelState, ref: string): SpatialActor | undefined {
  const want = ref.toLowerCase();
  const entity = novel.entities.get(ref) ?? [...novel.entities.values()].find((e) => e.id.toLowerCase() === want || e.name.toLowerCase() === want);
  if (entity) return { id: entity.id, room: entity.current_room };
  const npc = novel.npcs.get(ref) ?? [...novel.npcs.values()].find((n) => n.id.toLowerCase() === want || n.name.toLowerCase() === want);
  if (npc) return { id: npc.id, room: npc.room_id ?? npc.location ?? null };
  return undefined;
}

function resolveSpatialThing(world: WorldModel, ref: string): SpatialActor | undefined {
  const norm = (s: string) => s.toLowerCase().trim().replace(/^the\s+/, "").replace(/^an?\s+/, "");
  const want = norm(ref);
  const thing = [...world.things.values()].find((t) => norm(t.name) === want)
    ?? [...world.things.values()].find((t) => norm(t.name).includes(want) || want.includes(norm(t.name)));
  if (!thing) return undefined;
  return { id: thing.name, room: thingRoom(world, thing), thing };
}

register("run_command", {
  title: "Parser Command",
  description: "AI-narrator tool — resolves spatial intent internally. Run the spatial parser: execute a parsed command, resolve a movement outcome, or map an intent to tool calls. execute accepts free-form text, mutates world and entity state, persists, and is audited; a mistaken move is reversed by issuing the inverse command because no undo snapshot is taken. resolve computes the same movement without mutating, and suggest returns recommended calls without executing them; source and target apply only to perception queries. On a ruleset-bound Novel the parser is GM-only for navigation and mutation, while the Player and Observer badges keep read-only perception commands. Use when: a player or narrator takes a physical action, needs a movement outcome without mutating, or wants intent mapped to tools. Do NOT use when: the GM creates or edits the model — use manage_world; durable world facts — use manage_lore.",
  inputSchema: {
    action: z.enum(["execute", "resolve", "suggest", "visibility", "audibility"]).optional().describe("execute (parser), resolve (non-mutating intent), suggest (intent → tool calls), visibility (can one actor see another or a thing), or audibility (can one actor hear another). Defaults to execute."),
    command: z.string().optional().describe("The natural-language command (execute)."),
    intent: z.string().optional().describe("The intent to resolve or map (resolve/suggest)."),
    entity_id: z.string().optional().describe("Optional entity context (suggest)."),
    source: z.string().optional().describe("Observing actor for visibility/audibility (defaults to the active entity)."),
    target: z.string().optional().describe("Actor or thing being seen or heard (visibility/audibility)."),
  },
}, async (args: any) => {
  // REQ-596/REQ-597 — read-only spatial queries; never mutate or snapshot.
  // REQ-305/REQ-366b — a state query, so the read-only observer badge may call
  // it from any source; only the Player badge is pinned to its own point of view.
  if (args.action === "visibility" || args.action === "audibility") {
    const novel = requireNovel();
    const activeId = novel.active_entity_id ?? state.getActiveEntity()?.id ?? null;
    const sourceRef = args.source ?? activeId;
    if (!sourceRef) return err("INVALID_INPUT", "source is required (or set an active entity).");
    if (getBadge() === "player" && sourceRef !== activeId) {
      return err("FORBIDDEN", "Player badge queries only the active entity's point of view.");
    }
    const source = resolveSpatialActor(novel, sourceRef);
    if (!source || !source.room) return err("NOT_FOUND", `Source '${sourceRef}' has no resolvable location.`);
    const targetRef = args.target;
    if (args.action === "audibility" && !targetRef) return err("INVALID_INPUT", "target is required for audibility.");
    if (args.action === "visibility" && !targetRef) {
      const visible = visibleHere(novel.world, source.room).map((t) => t.name);
      return raw(JSON.stringify({ source: source.id, room: source.room, visible }, null, 2));
    }
    const target = resolveSpatialActor(novel, targetRef) ?? resolveSpatialThing(novel.world, targetRef);
    if (!target) return err("NOT_FOUND", `Target '${targetRef}' not found.`);
    if (args.action === "visibility") {
      const canSee = target.thing
        ? isVisibleFrom(novel.world, source.room, target.thing)
        : !!target.room && target.room.toLowerCase() === source.room.toLowerCase() && roomIsLit(novel.world, source.room);
      return raw(JSON.stringify({ source: source.id, target: target.id, can_see: canSee }, null, 2));
    }
    const canHear = isAudibleFrom(novel.world, source.room, target.room);
    return raw(JSON.stringify({ source: source.id, target: target.id, can_hear: canHear }, null, 2));
  }
  if (args.action === "resolve") {
    const badge = getBadge();
    if (badge === "player") {
      return err("FORBIDDEN", "run_command (action: resolve) is not callable by the Player badge. Player spatial intents are resolved by the AI narrator. Corrective action: switch badge or direct intents through the narrator.");
    }
    // REQ-305/REQ-366b — resolve is non-mutating (REQ-323), so the read-only
    // observer badge resolves spatial intent like the Game Master does.
    const novel = requireNovel();
    const result = resolveIntentWorld(args.intent, novel);
    return raw(JSON.stringify(result, null, 2));
  }
  if (args.action === "suggest") {
    const novel = requireNovel();
    const entity = args.entity_id ? novel.entities.get(args.entity_id) : state.getActiveEntity();
    const name = entity?.name ?? "entity";
    const rulesetBound = !!novel.ruleset;
    const badge = getBadge();
    const isGM = badge === "game_master" || badge === "none";
    const spatialCmd = (cmd: string) => (!rulesetBound || isGM)
      ? `run_command (action: execute, "${cmd}")`
      : `run_command (action: resolve, intent: "${args.intent ?? cmd}")`;
    const intentLower = (args.intent ?? "").toLowerCase();
    const domains: { mechanical: string[]; spatial: string[]; social: string[] } = { mechanical: [], spatial: [], social: [] };
    if (intentLower.includes("look") || intentLower.includes("see") || intentLower.includes("where") || intentLower.includes("examine")
      || intentLower.includes("explore") || intentLower.includes("search") || intentLower.includes("investigate")) {
      domains.spatial.push(spatialCmd("look"), spatialCmd("examine <thing>"));
    }
    if (intentLower.includes("go") || intentLower.includes("move") || intentLower.includes("travel") || intentLower.includes("sneak")) {
      domains.spatial.push(spatialCmd("go <direction>"));
    }
    if (intentLower.includes("take") || intentLower.includes("grab") || intentLower.includes("get")) {
      domains.spatial.push(spatialCmd("take <thing>"));
    }
    if (intentLower.includes("unlock")) {
      domains.spatial.push(spatialCmd("unlock <door> with <key>"), spatialCmd("open <door>"));
    } else if (intentLower.includes("open") || intentLower.includes("lock")) {
      domains.spatial.push(spatialCmd("open <door>"));
    }
    if (intentLower.includes("fight") || intentLower.includes("attack")) {
      if (isGM) domains.mechanical.push("manage_combat (action: init — GM only, auto-advance mode)");
      else domains.mechanical.push("resolve an attack or skill check for the active entity");
    }
    if (intentLower.includes("convince") || intentLower.includes("persuade") || intentLower.includes("talk") || intentLower.includes("negotiate") || intentLower.includes("intimidate")) {
      for (const [, npc] of novel.npcs) {
        domains.social.push(`${npc.name} (disposition: ${npc.disposition ?? "neutral"}) — skill check with persuasion`);
      }
      const self = resolveRelationshipParty(novel, entity?.id ?? "");
      for (const r of dedupeRelationships(novel)) {
        if (!isRelationshipInvolving(novel, r, entity?.id ?? "")) continue;
        const { a, b } = relationshipEndpoints(novel, r);
        const other = self && a.id === self.id ? b.name : a.name;
        domains.social.push(`relationship (${r.type}) with ${other}`);
      }
    }
    // REQ-084b3/b4, REQ-115 — synthesis action patterns supplement the matching
    // index only when the action-pattern toggle is enabled and the module is
    // active; GM-only patterns are excluded from Player results.
    if (novel.action_patterns_enabled) {
      const words = intentLower.split(/[^a-z0-9]+/).filter((w: string) => w.length >= 4);
      const patterns = effectiveWisdomItems("action_patterns").filter(badgeCanSeeWisdom);
      for (const p of patterns) {
        const ptext = String(p.intent ?? "").toLowerCase();
        if (words.length === 0 || !words.some((w: string) => ptext.includes(w))) continue;
        for (const a of (p.suggested_actions ?? [String(p.intent)])) {
          domains.mechanical.push(`${a} — synthesis pattern: ${p.intent}`);
        }
      }
    }
    // REQ-385a/REQ-385b — suggestions drawn from the active Novel's ruleset
    // model use the prefixed tool names, so a D&D Novel never suggests a
    // Starfinder tool. Parser (infrastructure) suggestions stay; when the
    // package declares no matching tool the generic prose is the fallback.
    if (novel.ruleset && rulesets.isInstalled(novel.ruleset)) {
      try {
        const words = intentLower.split(/[^a-z0-9]+/).filter((w: string) => w.length >= 4);
        if (words.length > 0) {
          const matched: string[] = [];
          for (const schema of rulesets.toolSchemas(novel.ruleset)) {
            const hay = `${schema.name} ${schema.title ?? ""} ${schema.description ?? ""}`.toLowerCase();
            if (!words.some((w: string) => hay.includes(w))) continue;
            matched.push(`${novel.ruleset}_${schema.name}`);
            if (matched.length >= 3) break;
          }
          if (matched.length > 0) domains.mechanical = matched;
        }
      } catch {
        // A package that fails to load falls back to the generic prose.
      }
    }
    if (domains.mechanical.length === 0 && domains.spatial.length === 0 && domains.social.length === 0) {
      // REQ-084b4 — a non-empty intent that matches nothing returns an empty
      // list; only an empty intent falls back to the contextual defaults.
      if (intentLower.trim()) return ok(`No matching actions for "${args.intent}".`);
      domains.spatial.push(spatialCmd("look"), spatialCmd("go <direction>"), spatialCmd("examine <thing>"));
    }
    // REQ-309g — one resolve entry per intent; several keyword branches can
    // match the same words, so the spatial list is deduped. REQ-309c — the GM
    // also receives the resolve mapping beside the parser form.
    domains.spatial = [...new Set(domains.spatial)];
    if (isGM && domains.spatial.length > 0) {
      domains.spatial.push(`run_command (action: resolve, intent: "${args.intent ?? ""}")`);
    }
    const blocks: string[] = [];
    if (domains.mechanical.length) blocks.push(`Mechanical:\n${domains.mechanical.map((s) => `  - ${s}`).join("\n")}`);
    if (domains.spatial.length) blocks.push(`Spatial:\n${domains.spatial.map((s) => `  - ${s}`).join("\n")}`);
    if (domains.social.length) blocks.push(`Social:\n${domains.social.map((s) => `  - ${s}`).join("\n")}`);
    // REQ-064d — under register=meta the suggestion is bare mechanical
    // information: the in-character framing line is suppressed.
    const framing = playerRegister() === "meta" ? "" : `Actions for ${name}:\n`;
    return ok(`${framing}${blocks.join("\n")}`);
  }
  let command = args.command;
  const novel = requireNovel();
  // REQ-197 — description mode commands are always recognized verbs.
  const cmdTrim = command.trim().toLowerCase();
  // REQ-196e — a bare numeric reply resolves the pending disambiguation prompt;
  // any other command clears it.
  if (parserState.pendingAmbiguity && /^\d+$/.test(cmdTrim)) {
    const chosen = parserState.pendingAmbiguity.matches[Number(cmdTrim) - 1];
    if (!chosen) {
      return raw(`[ERROR] [INVALID_INPUT] Choose 1-${parserState.pendingAmbiguity.matches.length}.`);
    }
    command = parserState.pendingAmbiguity.command.replace(parserState.pendingAmbiguity.target, chosen.name);
    parserState.pendingAmbiguity = null;
  } else if (parserState.pendingAmbiguity) {
    parserState.pendingAmbiguity = null;
  }
  // REQ-197 — description mode is session presentation (REQ-197c): it changes
  // no Novel state, so these verbs persist nothing.
  if (cmdTrim === "brief") { setRoomDescriptionMode("brief"); return ok("Description mode: brief (room name + exits only)."); }
  if (cmdTrim === "verbose") { setRoomDescriptionMode("verbose"); return ok("Description mode: verbose (full descriptions every time)."); }
  if (cmdTrim === "normal") { setRoomDescriptionMode("normal"); return ok("Description mode: normal (full on first entry)."); }
  if (cmdTrim === "help" || cmdTrim === "commands" || cmdTrim === "what can i do?" || cmdTrim === "verbs") {
    // REQ-196a/REQ-309b — the parser is GM-only on a ruleset-bound Novel; the
    // Player badge never sees the verb catalog. Ruleset-free Novels keep the
    // parser as the primary Player surface (REQ-309h).
    if (novel.ruleset && getBadge() === "player") {
      return err("FORBIDDEN", "On a ruleset-bound Novel the parser is Game Master only. The Player may issue read-only perception commands (look, examine, search, inventory).");
    }
    // REQ-283 — command("help") groups verbs by tier; command("verbs") is equivalent.
    return ok(renderVerbCatalog(novel.world));
  }
  // REQ-319 — `again`/`g` repeat the last command; bare `it`/`them` resolve to
  // the last referenced thing; embedded pronouns substitute it (session-local).
  if (cmdTrim === "again" || cmdTrim === "g") {
    if (!parserState.lastCommand) return raw(`[WARNING] No previous command to repeat.`);
    command = parserState.lastCommand;
  } else if (cmdTrim === "it" || cmdTrim === "them") {
    if (!parserState.lastReferencedThing) return raw(`[WARNING] No thing referenced yet.`);
    command = `examine ${parserState.lastReferencedThing}`;
  } else if (parserState.lastReferencedThing && /\b(it|them)\b/i.test(command)) {
    command = command.replace(/\b(it|them)\b/gi, parserState.lastReferencedThing);
  }
  // Ruleset-bound Novels gate the parser to the Game Master (REQ-309); the
  // Player badge may issue read-only perception commands (REQ-309h) and routes
  // mutating spatial intent through the narrator. The observer badge is
  // read-only on every Novel (REQ-305) and keeps the same perception surface on
  // both Novel types (REQ-366b). Ruleset-free Novels keep the parser as the
  // primary Player surface (REQ-218, REQ-309e).
  const executeBadge = getBadge();
  const playerReadOnly = novel.ruleset && executeBadge === "player";
  const observerReadOnly = executeBadge === "observer";
  const readOnlyBadge = playerReadOnly || observerReadOnly;
  if (readOnlyBadge) {
    const verb = command.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    if (!playerReadonlyVerbs.has(verb)) {
      return err("FORBIDDEN", observerReadOnly
        ? "Observer mode is read-only: the parser accepts the read-only perception commands (look, examine, search, inventory) and refuses navigation and mutation."
        : "On a ruleset-bound Novel the parser is Game Master only for navigation and mutation. The Player may issue read-only perception commands (look, examine, search, inventory).");
    }
  } else if (novel.ruleset) {
    requireGM();
  }
  // A read-only perception leaves no undo entry or audit mutation.
  if (!readOnlyBadge) worldSnapshot();
  const entity = state.getActiveEntity();

  if (!state.worldHasRooms(novel)) {
    return raw(`[ERROR] [STATE_CONFLICT] The world model has not been populated. Use an adventure module or \`convert_source\` to populate rooms before using parser commands.`);
  }

  // REQ-221 — combat-navigation interaction: while combat is active, navigation
  // verbs (go/enter/exit/move) return [STATE_CONFLICT]; inspection and
  // non-spatial commands continue to function.
  const navVerbs = new Set(["go", "walk", "move", "enter", "exit", "north", "south", "east", "west", "n", "s", "e", "w", "northeast", "northwest", "southeast", "southwest", "ne", "nw", "se", "sw", "up", "down", "u", "d"]);
  const firstWord = command.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (novel.combat && novel.combat.active && navVerbs.has(firstWord)) {
    return raw(`[ERROR] [STATE_CONFLICT] Combat is active — cannot navigate. Call \`manage_combat (action: end)\` first or flee per the ruleset's retreat mechanic.`);
  }

  // Auto-place entity in first room if no current room
  let currentRoom = entity?.current_room ?? null;
  if (!currentRoom && entity) {
    currentRoom = [...novel.world.rooms.keys()][0];
    entity.current_room = currentRoom;
  }

  // REQ-320 — narrative-intent verbs route to the GM surface (no simulation).
  const narrativeResult = handleNarrativeVerb(command, novel, entity, currentRoom);
  if (narrativeResult) return narrativeResult;

  // REQ-317 — vehicle-aboard handling: look shows the interior, exit returns to
  // the parked room, and navigation moves the vehicle through the world graph.
  const inVehicleName = (entity as any)?.in_vehicle;
  const vehicle = inVehicleName ? novel.world.things.get(String(inVehicleName).toLowerCase()) : undefined;
  if (inVehicleName && vehicle && entity) {
    const parkedRoom = vehicle.location;
    const vt = command.trim().split(/\s+/);
    const vv = vt[0].toLowerCase();
    const isExit = vv === "exit" || vv === "out" || (vv === "get" && vt[1] === "out");
    const dir = (vv === "go" || vv === "walk" || vv === "move") ? vt[1]?.toLowerCase()
      : (ROOM_DIRECTIONS.includes(vv as any) ? vv : undefined);
    if (vv === "look") {
      parserState.lastCommand = command;
      const interior = vehicle.vehicleInterior || vehicle.description || `the interior of the ${vehicle.name}`;
      return raw(`[OK] ${vehicle.name} (interior)\n${interior}\n\nExits: out.`);
    }
    if (isExit) {
      (entity as any).in_vehicle = undefined;
      entity.current_room = parkedRoom;
      vehicle.vehiclePassengers = (vehicle.vehiclePassengers ?? []).filter((p: string) => p !== entity.id);
      recordVehicleMoment(novel, "exit", vehicle.name, String(parkedRoom ?? ""));
      state.saveNovel(novel);
      audit("command", { command, exited_vehicle: vehicle.name });
      parserState.lastCommand = command;
      return raw(`[OK] You get out of the ${vehicle.name}.`);
    }
    if (dir) {
      const room = parkedRoom ? novel.world.rooms.get(String(parkedRoom).toLowerCase()) : undefined;
      // REQ-317b — the move resolves against the parked room, doors included.
      const doorName = room?.doorRefs.get(dir as Direction);
      if (doorName) {
        const door = novel.world.things.get(String(doorName).toLowerCase());
        if (door && !door.open) {
          parserState.lastCommand = command;
          return raw(`[WARNING] The ${bareName(door.name)} is ${door.locked ? "closed and locked" : "closed"}.`);
        }
      }
      const target = room?.exits.get(dir as Direction);
      if (!target) { parserState.lastCommand = command; return raw(`[WARNING] You can't go ${dir} from here.`); }
      vehicle.location = target;
      vehicle.locationType = "room";
      // REQ-317b — every passenger rides with the vehicle.
      const riders = new Set<string>([...(vehicle.vehiclePassengers ?? []), entity.id]);
      for (const riderId of riders) {
        const rider: any = novel.entities.get(riderId) ?? novel.npcs.get(riderId);
        if (rider && "current_room" in rider) rider.current_room = target;
      }
      entity.current_room = target;
      advanceWorldTriggeredCountdowns(novel, `room_enter:${String(target).toLowerCase()}`);
      const hazardWarnings = enterRoomHazards(novel, String(target));
      state.saveNovel(novel);
      audit("command", { command, vehicle_moved_to: target, passengers: [...riders] });
      parserState.lastCommand = command;
      return raw(`[OK] The ${vehicle.name} moves ${dir}.${hazardWarnings.length ? `\n${hazardWarnings.join("\n")}` : ""}`);
    }
  }

  const inventory = entity?.inventory ?? [];
  // REQ-197 — the description mode and the seen-room set are session-scoped:
  // the set resets when the active Novel changes.
  if (parserState.visitedRoomNovel !== novel.slug) { parserState.visitedRooms = new Set(); parserState.visitedRoomNovel = novel.slug; }
  const ctx = {
    world: novel.world, currentRoom, inventory, badge: getBadge(),
    actorId: entity?.id,
    descriptionMode: effectiveRoomDescriptionMode(), seenRooms: parserState.visitedRooms,
    // REQ-309b — the Player badge never sees GM-only verb names, including in
    // nearest-verb hints.
    allowedVerbs: readOnlyBadge ? READONLY_VERBS : undefined,
  };
  const loreBefore = detailLevel() === "rich" ? activeLoreKeys(novel) : null;
  const result = dispatchCommand(command, ctx);
  // REQ-196e — a disambiguation prompt is informational: neither movement
  // nor the take/drop/open side effects run until the caller picks a match.
  const okAction = result.prefix === "OK" && !result.disambiguation;

  // Apply side effects
  const hazardWarnings: string[] = [];
  if (okAction) {
    const goResult = resolveGoMovement(command, ctx);
    if (goResult.newRoom && entity && goResult.result.prefix === "OK") {
      // REQ-307/REQ-074 — move the whole present party, not only the active
      // entity; fall back to the active entity when no presence list is set.
      const movers = movePartyTo(novel, entity, goResult.newRoom);
      // Single source of truth for the party's location (REQ-331 journal coupling).
      const priorLocation = novel.scene_location;
      novel.scene_location = goResult.newRoom;
      // REQ-340a — record the arrival in the scene ledger so since-creation
      // attendance includes parser-driven transitions (REQ-125/P13).
      if (priorLocation !== goResult.newRoom) {
        novel.scene_history.push({
          timestamp: new Date().toISOString(),
          description: novel.scene_description,
          location: goResult.newRoom,
          time_of_day: novel.scene_time_of_day,
          atmosphere: novel.scene_atmosphere,
          beat: currentBeat(novel),
          characters_present_ids: presentIdsForLedger(novel, [...movers.keys()]),
        });
      }
      audit("command", { command, moved_to: goResult.newRoom, party: [...movers.keys()] });
      // REQ-329 — countdown on_room_enter triggers; REQ-330 — explored rooms.
      advanceWorldTriggeredCountdowns(novel, `room_enter:${goResult.newRoom.toLowerCase()}`);
      // REQ-125/REQ-353 — a parser move is a scene transition: tick on_scene_transition clocks.
      advanceSceneTransitionCountdowns(novel);
      // REQ-233a1 — the same reactivity cycle runs on a parser-driven transition.
      runWorldReactivityCycle(novel, [...(relationshipMarkers.get(novel.slug) ?? [])]);
      // REQ-622 — hazard rooms resolve after the transition tick, before discoveries.
      hazardWarnings.push(...enterRoomHazards(novel, goResult.newRoom));
      // Persist the move even when the room was already explored and no
      // countdown/hazard fired; a revisit must not live only in memory.
      state.saveNovel(novel);
      // REQ-340a — reaching a countdown's linked location resolves discovery.
      resolvePendingDiscoveries(novel);
      for (const [, m] of movers) recordExplorationKnowledge(novel, m, "room", goResult.newRoom.toLowerCase());
    }
  }

  // Handle take/drop side effects
  const tokens = command.trim().split(/\s+/);
  const verb = tokens[0].toLowerCase();
  if (okAction && entity) {
    if (verb === "take" || verb === "get") {
      const targetThing = findMatchingThing(tokens.slice(1).join(" "), novel.world, currentRoom);
      if (targetThing && targetThing.portable && !entity.inventory.includes(targetThing.name.toLowerCase())) {
        entity.inventory.push(targetThing.name.toLowerCase());
        targetThing.location = null;
        targetThing.locationType = null;
        state.saveNovel(novel);
        audit("command", { command, took: targetThing.name });
        // REQ-622c — a bundle advances its resource by the declared increment.
        advanceSurvivalBundle(novel, targetThing);
        // REQ-329 — countdown on_thing_take triggers; REQ-330 — explored things.
        advanceWorldTriggeredCountdowns(novel, `thing_take:${targetThing.name.toLowerCase()}`);
        state.saveNovel(novel);
        recordExplorationKnowledge(novel, entity, "thing", targetThing.name.toLowerCase());
      }
    } else if (verb === "drop" && tokens.length > 1) {
      const norm = (s: string) => s.toLowerCase().replace(/^the\s+/, "").replace(/^an?\s+/, "");
      const target = tokens.slice(1).join(" ");
      const idx = entity.inventory.findIndex((i) => norm(i) === norm(target));
      if (idx >= 0) {
        entity.inventory.splice(idx, 1);
        // Move the dropped thing back to the current room; a held thing has no
        // location, so look it up across all things rather than room-scoped.
        const thing = findThingByName(novel.world, target);
        if (thing) {
          thing.location = currentRoom;
          thing.locationType = "room";
        }
        state.saveNovel(novel);
        audit("command", { command, dropped: target });
      }
    } else if ((verb === "open" || verb === "close" || verb === "unlock" || verb === "lock") && result.prefix === "OK" && tokens.length > 1) {
      const thing = findMatchingThing(tokens.slice(1).join(" ").split(/\s+with\s+/)[0], novel.world, currentRoom);
      if (thing && (verb === "open" || verb === "close" ? thing.openable : thing.lockable)) {
        if (verb === "open") thing.open = true;
        else if (verb === "close") thing.open = false;
        else if (verb === "unlock") thing.locked = false;
        else thing.locked = true;
        state.saveNovel(novel);
        audit("command", { command, [verb + "ed"]: thing.name });
      }
    }
  }

  // REQ-316 through REQ-319 — side-effect resolution for extended verbs, plus
  // last-referenced tracking for pronoun resolution.
  const targetThing = (words: string[]) => {
    const name = words.join(" ").toLowerCase();
    return novel.world.things.get(name) ?? findMatchingThing(words.join(" "), novel.world, currentRoom);
  };
  if (entity && okAction) {
    if (verb === "examine" || verb === "x" || verb === "search") {
      const t = novel.world.things.get(tokens.slice(1).join(" ").toLowerCase()) ?? findMatchingThing(tokens.slice(1).join(" "), novel.world, currentRoom);
      if (t) parserState.lastReferencedThing = t.name;
    } else if (verb === "switch") {
      const onOff = tokens[1]?.toLowerCase() === "on";
      const thing = targetThing(tokens.slice(2));
      if (thing && thing.switchable) {
        thing.switched_on = onOff;
        parserState.lastReferencedThing = thing.name;
        state.saveNovel(novel);
        audit("command", { command, switched: thing.name, switched_on: onOff });
      }
    } else if (verb === "wear") {
      const thing = novel.world.things.get(tokens.slice(1).join(" ").toLowerCase());
      if (thing && thing.wearable) {
        thing.worn_by = entity.id || entity.name || "player";
        parserState.lastReferencedThing = thing.name;
        state.saveNovel(novel);
        audit("command", { command, wore: thing.name });
      }
    } else if (verb === "remove") {
      const thing = novel.world.things.get(tokens.slice(1).join(" ").toLowerCase());
      if (thing && thing.wearable) {
        thing.worn_by = null;
        parserState.lastReferencedThing = thing.name;
        state.saveNovel(novel);
        audit("command", { command, removed: thing.name });
      }
    } else if (verb === "eat" || verb === "drink") {
      const lower = tokens.slice(1).join(" ").toLowerCase();
      const idx = entity.inventory.indexOf(lower);
      if (idx >= 0) {
        entity.inventory.splice(idx, 1);
        const thing = novel.world.things.get(lower);
        if (thing) { thing.location = null; thing.locationType = null; parserState.lastReferencedThing = thing.name; }
        state.saveNovel(novel);
        audit("command", { command, consumed: lower });
      }
    } else if (verb === "climb") {
      const thing = targetThing(tokens.slice(1));
      if (thing && thing.climbable) {
        parserState.lastReferencedThing = thing.name;
        const room = novel.world.rooms.get((currentRoom ?? "").toLowerCase());
        const up = room?.exits.get("up") ?? room?.exits.get("climb");
        if (up) {
          // REQ-307/REQ-074 — a climb co-locates the present party, like `go`.
          const movers = movePartyTo(novel, entity, up);
          novel.scene_location = up;
          advanceWorldTriggeredCountdowns(novel, `room_enter:${up.toLowerCase()}`);
          // REQ-622a/b — entering by climbing resolves hazards like any entry.
          hazardWarnings.push(...enterRoomHazards(novel, up));
          audit("command", { command, climbed_to: up, party: [...movers.keys()] });
        }
        state.saveNovel(novel);
      }
    } else if (verb === "enter") {
      const thing = targetThing(tokens.slice(1));
      if (thing && thing.enterable) {
        parserState.lastReferencedThing = thing.name;
        if (thing.kind === "vehicle") {
          (entity as any).in_vehicle = thing.name;
          thing.vehiclePassengers = thing.vehiclePassengers ?? [];
          const alreadyAboard = thing.vehiclePassengers.includes(entity.id ?? entity.name);
          if (!alreadyAboard) {
            thing.vehiclePassengers.push(entity.id ?? entity.name);
            recordVehicleMoment(novel, "enter", thing.name, currentRoom ?? "", thing.vehicleInterior || thing.description || "");
          }
        }
        state.saveNovel(novel);
        audit("command", { command, entered: thing.name });
      }
    } else if (verb === "light" || verb === "extinguish") {
      const thing = targetThing(tokens.slice(1));
      if (thing) {
        // REQ-622c — relighting a survival resource's light spends one unit;
        // the generic binding is the resource's `light_thing` annotation.
        const resource = [...novel.countdowns.values()].find((cd) => cd.survival?.light_thing?.toLowerCase() === thing.name.toLowerCase());
        if (verb === "light" && resource && !thing.lit) {
          const unit = spendUnit(novel, resource);
          if (!unit) {
            state.saveNovel(novel);
            return raw(`[WARNING] No unit remains to relight the ${thing.name}.`);
          }
          thing.lit = true;
          novel.countdowns.delete(lastLightName(resource.name));
          parserState.lastReferencedThing = thing.name;
          state.saveNovel(novel);
          audit("command", { command, lit: thing.name, on: true, unit });
          return raw(`[OK] You relight the ${thing.name}.`);
        }
        thing.lit = verb === "light";
        if (thing.switchable) thing.switched_on = verb === "light";
        parserState.lastReferencedThing = thing.name;
        state.saveNovel(novel);
        audit("command", { command, lit: thing.name, on: verb === "light" });
      }
    } else if (verb === "sit") {
      const thing = targetThing(tokens.slice(1));
      if (thing && thing.kind === "supporter") {
        (entity as any).sitting = thing.name;
        parserState.lastReferencedThing = thing.name;
        state.saveNovel(novel);
        audit("command", { command, sat_on: thing.name });
      }
    } else if (verb === "stand") {
      (entity as any).sitting = undefined;
      state.saveNovel(novel);
      audit("command", { command, stood_up: true });
    }
  }

  // Track last command for `again`/`g` (REQ-319).
  parserState.lastCommand = command;

  // Output
  const prefix = result.prefix === "OK" ? "[OK]" : result.prefix === "WARNING" ? "[WARNING]" : "[ERROR]";
  const code = result.code ? ` [${result.code}]` : "";
  let text = `${prefix}${code} ${result.text}`;
  if (result.disambiguation) {
    parserState.pendingAmbiguity = { command, target: result.disambiguation.target, matches: result.disambiguation.matches };
    text += `\n${result.disambiguation.matches.map((m, i) => `${i + 1}. ${m.name} (${m.location})`).join("\n")}`;
  }
  if (result.correctiveAction) {
    text += `\nCorrective action: ${result.correctiveAction}`;
  }
  if (hazardWarnings.length > 0) {
    text += `\n${hazardWarnings.join("\n")}`;
  }
  // REQ-197a — the status line (exits) closes the response, after the body.
  if (result.status) {
    text += `\n\n${result.status}`;
  }
  // REQ-197c — rich detail reports lore that became newly active during the
  // command (per-call diff; no persistent buffer).
  if (loreBefore) {
    const notices = [...activeLoreKeys(novel)].filter((k) => !loreBefore.has(k)).map((k) => `[lore] ${k}`);
    if (notices.length > 0) text += `\n${notices.join("\n")}`;
  }
  return raw(text);
});

// REQ-196d / REQ-283b — one canonical help text: tier sections, category
// blocks within each tier, one-line descriptions, and per-tier counts. `help`,
// `commands`, `what can I do?`, and `verbs` all return this exact text.
function renderVerbCatalog(world: WorldModel): string {
  const tiers = verbCatalog(world);
  const availability = new Map<string, boolean>();
  for (const v of [...tiers.core, ...tiers.standard]) availability.set(v.verb, v.available);
  const categoryOrder: ParserCategory[] = [
    "navigation", "inspection", "object_interaction", "inventory", "narrative", "wait",
  ];
  const out: string[] = ["World commands (grouped by tier, then category):"];
  for (const tier of ["core", "standard"] as const) {
    const verbs = PARSER_CATALOG.filter((cmd) => cmd.tier === tier);
    out.push(`\n${tier} (${verbs.length}):`);
    for (const category of categoryOrder) {
      const entries = verbs.filter((cmd) => cmd.category === category);
      if (entries.length === 0) continue;
      out.push(`  ${category}`);
      for (const cmd of entries) {
        const args = cmd.args.length ? ` ${cmd.args.map((a) => `<${a}>`).join(" ")}` : "";
        const unavailable = availability.get(cmd.verb) === false ? " (unavailable)" : "";
        out.push(`    ${cmd.verb}${args} — ${cmd.effect}${unavailable}`);
      }
      if (category === "narrative") {
        out.push("    Note: outcomes are determined by the Game Master.");
      }
    }
  }
  const aliases = PARSER_CATALOG.filter((cmd) => cmd.tier === "alias").map((cmd) => cmd.verb);
  out.push(`\nAliases: ${aliases.join(", ")}`);
  out.push(`\nTiers: core ${tiers.core.length} · standard ${tiers.standard.length} · extended ${tiers.extended.length}`);
  return out.join("\n");
}

// REQ-317d — record a vehicle traversal as a story journal moment entry; the
// entry carries the interior description so the recap and briefing can show it.
function recordVehicleMoment(novel: any, kind: "enter" | "exit", vehicle: string, room: string, interior = ""): void {
  const entry: any = {
    index: novel.story_journal.length,
    type: "moment",
    entry: kind === "enter"
      ? `[vehicle-entry] entered ${vehicle}${interior ? ` — ${interior}` : ""}`
      : `[vehicle-exit] ${vehicle} returned to ${room}`,
    scene_anchor: (novel.scene_description ?? "").substring(0, 80),
    entity_ids: [],
    timestamp: new Date().toISOString(),
  };
  novel.story_journal.push(entry);
}

// REQ-320 — resolve an NPC by name substring among NPCs whose location matches
// the current room. Returns the NPC or null.
function resolveNpcInRoom(novel: any, name: string, roomName: string | null): any | null {
  const lower = name.toLowerCase();
  for (const [, npc] of novel.npcs) {
    const display = (npc.name ?? "").toLowerCase();
    if (!display.includes(lower)) continue;
    if (roomName && npc.location && npc.location.toLowerCase() !== roomName.toLowerCase()) continue;
    return npc;
  }
  return null;
}

// REQ-320 — narrative-intent verbs: record intent to the GM's surface without
// simulating outcomes. give transfers inventory; throw moves a thing to the
// room; show/ask/tell record intent only.
function handleNarrativeVerb(full: string, novel: any, entity: any, currentRoom: string | null): any | null {
  const tokens = full.trim().split(/\s+/);
  const verb = tokens[0]?.toLowerCase();
  if (!["ask", "tell", "give", "show", "throw"].includes(verb)) return null;

  const recordIntent = (intent: string, warning = false) => {
    novel.player_intents = novel.player_intents ?? [];
    novel.player_intents.push({ intent, warning, timestamp: new Date().toISOString() });
    const marker = warning ? "[WARNING]" : "[OK]";
    return `${marker} ${intent}`;
  };

  if (verb === "throw") {
    const thingName = tokens.slice(1).join(" ").replace(/\s+at .+$/, "").trim();
    const atMatch = full.match(/\sat (.+)$/i);
    if (!thingName || !atMatch) return raw(`[ERROR] [INVALID_INPUT] Throw what at what?`);
    const lower = thingName.toLowerCase();
    const idx = (entity?.inventory ?? []).indexOf(lower);
    if (idx < 0) return raw(`[ERROR] [NOT_FOUND] You're not carrying '${thingName}'.`);
    // REQ-320b/c — resolve the target in the current room; a matched NPC's
    // room is the thing's destination, a miss still throws into the room.
    const npc = resolveNpcInRoom(novel, atMatch[1].trim(), currentRoom);
    entity.inventory.splice(idx, 1);
    const thing = novel.world.things.get(lower);
    if (thing) { thing.location = npc?.location ?? currentRoom; thing.locationType = "room"; }
    state.saveNovel(novel);
    audit("command", { command: full, threw: thingName });
    return raw(recordIntent(`You throw the ${thingName} at ${atMatch[1].trim()}.`, !npc));
  }

  if (verb === "give") {
    const toMatch = full.match(/\sto (.+)$/i);
    const thingName = toMatch ? full.replace(/^give\s+/i, "").replace(/\s+to .+$/i, "").trim() : tokens[1] ?? "";
    const npcName = toMatch ? toMatch[1].trim() : tokens.slice(2).join(" ");
    if (!thingName || !npcName) return raw(`[ERROR] [INVALID_INPUT] Give what to whom?`);
    const lower = thingName.toLowerCase();
    const thing = novel.world.things.get(lower);
    if (thing && !thing.portable) return raw(`[ERROR] [RULE_VIOLATION] The ${thing.name} is fixed and cannot be given.`);
    const idx = (entity?.inventory ?? []).indexOf(lower);
    if (idx < 0) return raw(`[ERROR] [NOT_FOUND] You're not carrying '${thingName}'.`);
    // REQ-320b — the target must be in the current room; a miss keeps the item
    // and records a [WARNING] intent (REQ-320c).
    const npc = resolveNpcInRoom(novel, npcName, currentRoom);
    if (!npc) return raw(recordIntent(`You offer the ${thingName} to ${npcName}.`, true));
    entity.inventory.splice(idx, 1);
    if (thing) { thing.location = null; thing.locationType = null; }
    state.saveNovel(novel);
    audit("command", { command: full, gave: thingName, npc: npc.name });
    return raw(recordIntent(`You give the ${thingName} to ${npc.name}.`));
  }

  if (verb === "show") {
    const toMatch = full.match(/\sto (.+)$/i);
    const thingName = toMatch ? full.replace(/^show\s+/i, "").replace(/\s+to .+$/i, "").trim() : tokens[1] ?? "";
    const npcName = toMatch ? toMatch[1].trim() : tokens.slice(2).join(" ");
    if (!thingName || !npcName) return raw(`[ERROR] [INVALID_INPUT] Show what to whom?`);
    const npc = resolveNpcInRoom(novel, npcName, currentRoom);
    audit("command", { command: full, showed: thingName, npc: npcName });
    return raw(recordIntent(`You show the ${thingName} to ${npc ? npc.name : npcName}.`, !npc));
  }

  if (verb === "ask" || verb === "tell") {
    if (tokens.length < 2) return raw(`[ERROR] [INVALID_INPUT] ${verb === "ask" ? "Ask" : "Tell"} whom?`);
    const npcName = tokens[1];
    const npc = resolveNpcInRoom(novel, npcName, currentRoom);
    const topic = tokens.slice(2).join(" ").replace(/^(about\s+)/i, "");
    const prose = verb === "ask" ? `You ask ${npc ? npc.name : npcName}${topic ? ` about ${topic}` : ""}.` : `You tell ${npc ? npc.name : npcName}${topic ? ` about ${topic}` : ""}.`;
    audit("command", { command: full, npc: npcName, topic: topic || null });
    return raw(recordIntent(prose, !npc));
  }

  return null;
}

const normThing = (s: string) => s.toLowerCase().trim().replace(/^(?:the|an?)\s+/, "");
// All-things lookup (used where location is irrelevant, e.g. dropping a held
// item): exact normalized match first, then substring.
function findThingByName(world: WorldModel, name: string): WorldThing | null {
  const want = normThing(name);
  const all = [...world.things.values()];
  return all.find((t) => normThing(t.name) === want)
    ?? all.find((t) => { const n = normThing(t.name); return n.includes(want) || want.includes(n); })
    ?? null;
}
function findMatchingThing(name: string, world: WorldModel, roomName: string | null): WorldThing | null {
  // Reachability mirrors the parser's `getReachableThing`: exact normalized
  // match first (so `vault door` does not match `door`), then substring.
  const want = normThing(name);
  const rl = roomName?.toLowerCase();
  const reachable = (thing: WorldThing): boolean => {
    const loc = thing.location?.toLowerCase();
    if (loc === rl) return true;
    // REQ-200: things on supporters or in open containers within the room are reachable.
    if (thing.locationType === "supporter" || thing.locationType === "container") {
      const parent = world.things.get(thing.location?.toLowerCase() ?? "");
      if (parent && parent.location?.toLowerCase() === rl) {
        return thing.locationType === "supporter" || (parent.openable && parent.open);
      }
    }
    return false;
  };
  const pool = [...world.things.values()].filter(reachable);
  return pool.find((t) => normThing(t.name) === want)
    ?? pool.find((t) => { const n = normThing(t.name); return n.includes(want) || want.includes(n); })
    ?? null;
}

return { expireCountdown, expireSurvivalWithUnit };
}
