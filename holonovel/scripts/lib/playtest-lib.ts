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
    const pfx = validation ? "[INVALID_INPUT]" : "[ERROR]";
    return { prefix: pfx, error_class: validation ? "denial" : "defect", mcp_error: true };
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

/** Read a character's death signal, Health, Wounds, and conditions. */
export function pcVitals(e: any): { dead: boolean; hp: number | null; wounds: number | null; conditions: string[] } {
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
  const hp = num("Health", "health", "HP", "hp");
  const wounds = num("Wounds", "wounds");
  // Mothership: 3 Wounds is death. Health/Wounds are absent on some sheets, so
  // condition strings remain the live signal.
  const dead = deadCond || (wounds !== null && wounds >= 3);
  return { dead, hp, wounds, conditions: cond };
}

/** A character is alive unless a death signal is present. */
export function pcAlive(e: any): boolean {
  return !pcVitals(e).dead;
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
