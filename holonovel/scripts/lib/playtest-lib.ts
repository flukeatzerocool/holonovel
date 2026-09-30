// playtest-lib.ts — pure, testable helpers for the playtest harness.
//
// Extracted from playtest.ts so scripts/test-playtest.ts can assert metric
// behavior without spawning a server. Exit codes: n/a (library).
//
// REQ citations: none — informational harness support.
import { createHash } from "node:crypto";

/** Prefixes that indicate a genuine defect (vs. an expected refusal). */
export const DEFECT_PREFIXES = new Set(["[ERROR]", "[RULE_VIOLATION]", "[STATE_CONFLICT]"]);
/** Prefixes that indicate an expected refusal/handoff, not a defect. */
export const DENIAL_PREFIXES = new Set(["[FORBIDDEN]", "[INVALID_INPUT]", "[NEED_INPUT]", "[NOT_FOUND]"]);
/** Terminal dispositions accepted by spec/audit/review-register.md. */
export const REGISTER_DISPOSITIONS = new Set(["Resolved", "Scheduled-roadmap", "Closed-P3", "Deferred-by-user"]);
/** Tools whose calls may legitimately change the room set. */
export const WORLD_TOOLS = new Set(["manage_world", "manage_adventure", "run_command"]);

/**
 * Extract the envelope prefix token from a tool result. When the server emits a
 * compound envelope (`[ERROR] [NOT_FOUND] ...`), the most specific trailing code
 * is returned, so classification keys on the code (`[NOT_FOUND]`,
 * `[STATE_CONFLICT]`), not the generic outer `[ERROR]`.
 */
export function prefix(text: string): string {
  const firstLine = text.split("\n").find((l) => l.trim().length > 0) ?? "";
  const leading = firstLine.match(/^\s*((?:\[[A-Z_]+\]\s*)+)/);
  if (leading) {
    const tokens = leading[1].match(/\[[A-Z_]+\]/g) ?? [];
    if (tokens.length) return tokens[tokens.length - 1]!;
  }
  const any = text.match(/\[(OK|WARNING|ERROR|PARTIAL|NEED_INPUT|FORBIDDEN|NOT_FOUND|RULE_VIOLATION|STATE_CONFLICT|INVALID_INPUT|[A-Z_]+)\]/);
  return any ? any[0] : (text.startsWith("[") ? text.slice(0, 24) : "[?]");
}

/** Classify a result prefix as a defect, an expected denial, or ok. */
export function errorClass(p: string): "defect" | "denial" | "ok" {
  if (DEFECT_PREFIXES.has(p)) return "defect";
  if (DENIAL_PREFIXES.has(p)) return "denial";
  return "ok";
}

/**
 * Classify a tool result. The MCP SDK returns argument-schema violations as a
 * tool result with `isError: true` and an `MCP error -32602: Input validation
 * error …` message (no `[ERROR] [CODE]` envelope); classify that as an
 * expected denial so it is not miscounted as a success.
 */
export function classifyResult(text: string, isError?: boolean): { prefix: string; error_class: "defect" | "denial" | "ok"; mcp_error: boolean } {
  if (isError) {
    const validation = /Input validation error|Invalid arguments|Invalid option|Invalid enum/i.test(text);
    if (validation) return { prefix: "[INVALID_INPUT]", error_class: "denial", mcp_error: true };
    // A refusal envelope still counts as a denial when the SDK marks the
    // result as an error — badge gating returns `[FORBIDDEN]` with
    // `isError: true`, which is an expected refusal, not a defect.
    const p = prefix(text);
    if (DENIAL_PREFIXES.has(p)) return { prefix: p, error_class: "denial", mcp_error: true };
    return { prefix: "[ERROR]", error_class: "defect", mcp_error: true };
  }
  const p = prefix(text);
  return { prefix: p, error_class: errorClass(p), mcp_error: false };
}

/** Coerce an array-or-keyed-object (or null/undefined) to an array. */
export function asArray<T>(x: T[] | Record<string, T> | undefined | null): T[] {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object") return Object.values(x);
  return [];
}

/** Sorted room names from a Novel's world model. */
export function roomSet(novel: any): string[] {
  return Object.keys(novel?.world?.rooms ?? {}).sort();
}

/**
 * Canonical, reload-stable fingerprint of the Novel's mechanical state
 * (world rooms, entity rooms + inventory, vows, story beats, countdowns).
 * Used to compare end-of-turn N with start-of-turn N+1.
 */
export function stateFingerprint(novel: any): string {
  const entities = Object.entries(novel?.entities ?? {})
    .map(([id, e]: [string, any]) => [id, e.current_room ?? null, (e.inventory ?? []).map((i: any) => i?.name ?? i).slice().sort()])
    .sort();
  const vows = asArray<any>(novel?.vows).map((v: any) => [v.name, v.state, Array.isArray(v.milestones) ? v.milestones.length : (typeof v.milestones === "number" ? v.milestones : 0)]);
  const beats = asArray<any>(novel?.story_beats).map((b: any) => b.beat);
  const countdowns = asArray<any>(novel?.countdowns).map((c: any) => [c.name, c.remaining ?? c.ticks ?? null]).sort();
  return createHash("sha1").update(JSON.stringify({ rooms: roomSet(novel), entities, vows, beats, countdowns })).digest("hex");
}

/**
 * Read a character's death signal, vitals, and conditions. Reads both raw
 * stat keys (`hit_points`, `reflex_defense`) and the human labels the sheet
 * renders (`"Hit Points"`, `"Reflex Defense"`). SWSE sheets persist only the
 * three defenses today, so absent fields are reported null and `stat_keys`
 * exposes what the sheet actually carries (a fidelity signal).
 */
export function pcVitals(e: any): {
  dead: boolean;
  hp: number | null;
  wounds: number | null;
  conditions: string[];
  force_points: number | null;
  damage_threshold: number | null;
  defenses: { reflex: number | null; fortitude: number | null; will: number | null };
  stat_keys: string[];
} {
  const cond = (e.conditions ?? []).map((c: any) => String(c).toLowerCase());
  const deadCond = cond.some((c: string) => /dead|deceased|killed|fatal|corpse/.test(c));
  const s = e.stats ?? {};
  const num = (...keys: string[]): number | null => {
    for (const k of keys) {
      const v = s[k];
      if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
    }
    return null;
  };
  const hp = num("Health", "health", "HP", "hp", "Hit Points", "hit_points", "hitPoints");
  const wounds = num("Wounds", "wounds");
  // Mothership: 3 Wounds is death. Health/Wounds are absent on some sheets, so
  // condition strings remain the live signal.
  const dead = deadCond || (wounds !== null && wounds >= 3);
  return {
    dead, hp, wounds, conditions: cond,
    force_points: num("Force Points", "force_points", "forcePoints"),
    damage_threshold: num("Damage Threshold", "damage_threshold", "damageThreshold", "DT"),
    defenses: {
      reflex: num("Reflex Defense", "reflex_defense", "Reflex"),
      fortitude: num("Fortitude Defense", "fortitude_defense", "Fortitude"),
      will: num("Will Defense", "will_defense", "Will"),
    },
    stat_keys: Object.keys(s),
  };
}

/** A character is alive unless a death signal is present. */
export function pcAlive(e: any): boolean {
  return !pcVitals(e).dead;
}

/** Authoring phase runs until the completion target (central_vow) is set. */
export function runPhase(cfg: { from_scratch?: boolean; central_vow?: string | null }): "authoring" | "playtest" {
  return cfg.from_scratch && !cfg.central_vow ? "authoring" : "playtest";
}

/** Normalize a room name for comparison (case, leading article). */
function normRoom(s: any): string {
  return String(s ?? "").trim().toLowerCase().replace(/^(the|an?)\s+/, "");
}

/** Room keys/names as a lookup from normalized name -> room key. */
function roomKeyLookup(novel: any): { keys: string[]; rooms: Record<string, any>; find: (name: string) => string | undefined } {
  const rooms: Record<string, any> = novel?.world?.rooms ?? {};
  const keys = Object.keys(rooms);
  const find = (name: string): string | undefined =>
    keys.find((k) => normRoom(k) === normRoom(name) || normRoom(rooms[k]?.name) === normRoom(name));
  return { keys, rooms, find };
}

/** Rooms reachable from `start` over the world model's exits (BFS). */
export function reachableRooms(novel: any, start: string): string[] {
  const { rooms, find } = roomKeyLookup(novel);
  const startKey = find(start);
  if (!startKey) return [];
  const seen = new Set<string>([startKey]);
  const q: string[] = [startKey];
  while (q.length) {
    const k = q.shift()!;
    for (const target of Object.values(rooms[k]?.exits ?? {})) {
      const tk = find(String(target));
      if (tk && !seen.has(tk)) { seen.add(tk); q.push(tk); }
    }
  }
  return [...seen].map((k) => rooms[k]?.name ?? k).sort();
}

/** True when `goal` is reachable from `start` through the world model. */
export function isReachable(novel: any, start: string, goal: string): boolean {
  return reachableRooms(novel, start).some((n) => normRoom(n) === normRoom(goal));
}

/** Stable hash of an authored adventure (scaffold + structural index). */
export function authoredAdventureHash(novel: any): string {
  return createHash("sha1")
    .update(JSON.stringify({ g: novel?.generated_adventure ?? null, i: novel?.adventure_index ?? null }))
    .digest("hex");
}

/** Per-PC room map, for party-scope movement telemetry. */
export function partyRooms(novel: any): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const [id, e] of Object.entries(novel?.entities ?? {})) out[id] = (e as any)?.current_room ?? null;
  return out;
}

/** Structural counts of the Novel's world and cast. */
export function entityCounts(novel: any): { pcs: number; npcs: number; rooms: number; things: number; exits: number } {
  const rooms: Record<string, any> = novel?.world?.rooms ?? {};
  return {
    pcs: Object.keys(novel?.entities ?? {}).length,
    npcs: Object.keys(novel?.npcs ?? {}).length,
    rooms: Object.keys(rooms).length,
    things: Object.keys(novel?.world?.things ?? {}).length,
    exits: Object.values(rooms).reduce((a: number, r: any) => a + Object.keys(r?.exits ?? {}).length, 0),
  };
}

/** Compact before/after delta of the Novel's mechanical surfaces. */
export function stateDelta(before: any, after: any): {
  rooms: number; things: number; exits: number; pcs: number; npcs: number; beats: number; inventory_changed: boolean;
} {
  const c = (n: any) => entityCounts(n);
  const inv = (n: any) => Object.fromEntries(Object.entries(n?.entities ?? {}).map(
    ([id, e]: [string, any]) => [id, (e.inventory ?? []).map((i: any) => i?.name ?? i).sort().join("|")]));
  const b = c(before); const a = c(after);
  return {
    rooms: a.rooms - b.rooms, things: a.things - b.things, exits: a.exits - b.exits,
    pcs: a.pcs - b.pcs, npcs: a.npcs - b.npcs,
    beats: asArray(after?.story_beats).length - asArray(before?.story_beats).length,
    inventory_changed: JSON.stringify(inv(before)) !== JSON.stringify(inv(after)),
  };
}

/** A finding that cites a server predicate (`file:line`), not a gate message. */
export interface Finding {
  class: string;
  predicate: string;
  evidence: { run: string; turns: [number, number] };
  recurrence?: number;
  severity: "P0" | "P1" | "P2" | "P3";
  target: string;
  repro?: string[];
  suggestion?: string;
}

/** Validate a Finding record; rejects message-only findings (no file:line). */
export function validateFinding(f: any): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!f || typeof f !== "object") return { ok: false, errors: ["finding is not an object"] };
  for (const k of ["class", "predicate", "severity", "target"]) {
    if (typeof f[k] !== "string" || !f[k].trim()) errors.push(`missing string field '${k}'`);
  }
  if (typeof f.predicate === "string" && f.predicate.trim() && !/[^\s:]+:\d+/.test(f.predicate)) {
    errors.push("predicate must be a file:line citation");
  }
  if (f.severity !== undefined && !["P0", "P1", "P2", "P3"].includes(f.severity)) errors.push("severity must be P0-P3");
  const ev = f.evidence;
  if (!ev || typeof ev.run !== "string" || !Array.isArray(ev.turns) || ev.turns.length !== 2) {
    errors.push("evidence must be {run, turns:[a,b]}");
  }
  return { ok: errors.length === 0, errors };
}

/**
 * True when a lookup result carries a real (non-empty) source anchor. A bare
 * `"source_anchor": null` key must not count — the key name alone is not a
 * citation.
 */
export function anchorPresent(result: string): boolean {
  try {
    const stack: any[] = [JSON.parse(result)];
    // Cite-bearing keys only. A generic `anchor` key is a cross-reference
    // pointer, not a source citation, so it must not count.
    const keys = /^(source_anchor|sourceAnchor|source_file|sourceFile)$/i;
    while (stack.length) {
      const o = stack.pop();
      if (!o || typeof o !== "object") continue;
      for (const [k, v] of Object.entries(o)) {
        if (keys.test(k) && v != null && String(v).trim() !== "") return true;
        if (v && typeof v === "object") stack.push(v);
      }
    }
    return false;
  } catch {
    // Non-JSON result — accept a quoted, non-empty anchor value only.
    return /["']?(source_anchor|sourceAnchor|anchor)["']?\s*[:=]\s*["'][^"']+["']/i.test(result);
  }
}
