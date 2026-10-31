// Hazard-roll helpers — deterministic seeded draws for room hazard checks.
// Pure: no I/O and no engine state, so the prior-check accounting and the roll
// are unit-testable without a Novel. REQ-622b (trap hazard resolution).
import { createRng } from "./rng.js";
import type { EncounterAnnotation, TrapAnnotation } from "../world/model.js";

/** The audit fields the hazard accounting reads. `args` is the serialized
 *  argument object `StateManager.audit` persists (a JSON string). */
export interface AuditLike {
  tool?: string;
  args?: unknown;
}

function asRoom(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim().toLowerCase() : null;
}

/** Parse a persisted audit `args` value. Accepts the JSON-string form the
 *  audit log stores and an already-parsed object; malformed input is ignored. */
export function parseAuditArgs(args: unknown): Record<string, unknown> {
  if (args && typeof args === "object") return args as Record<string, unknown>;
  if (typeof args !== "string" || args.length === 0) return {};
  try {
    const parsed = JSON.parse(args);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    // A malformed historical entry is not a check we can attribute to a room.
    return {};
  }
}

/** Count prior hazard checks recorded for `room`. The audit log stores `args`
 *  as a JSON string, so a direct property read would always miss. */
export function countPriorHazardChecks(auditLog: readonly AuditLike[] | undefined, room: string): number {
  const target = asRoom(room);
  if (!target) return 0;
  let count = 0;
  for (const entry of auditLog ?? []) {
    if (entry?.tool !== "hazard_check") continue;
    if (asRoom(parseAuditArgs(entry.args).room) === target) count += 1;
  }
  return count;
}

/** Deterministic across restarts: the seed, the room, and the number of prior
 *  hazard checks in that room select the draw. The count is folded into the
 *  hashed key (not XORed into the seed) so it perturbs the whole draw. */
export function hazardRoll(
  auditLog: readonly AuditLike[] | undefined,
  seed: string,
  room: string,
  faces = 8,
): number {
  const prior = countPriorHazardChecks(auditLog, room);
  let h = 2166136261;
  const key = `${seed}:${room.trim().toLowerCase()}:${prior}`;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return createRng(h >>> 0).roll(faces);
}

// REQ-622 — hazard annotations are structured objects. Legacy `key=value`
// strings (written before the structured model) are coerced so existing Novels
// keep playing; anything else is ignored with a warning and never blocks entry.
// `legacyResource` is the caller's pre-change resource inference (the first
// countdown carrying an exit world effect), used only for legacy strings.
export interface ParsedHazard {
  encounter?: EncounterAnnotation;
  trap?: TrapAnnotation;
}

export interface HazardParseResult {
  hazard: ParsedHazard;
  warnings: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function nonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && Number.isInteger(value);
}

function positiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 && Number.isInteger(value);
}

function named(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalWaxCost(value: unknown): number | undefined {
  return nonNegativeInt(value) ? value : undefined;
}

function legacyField(text: string, key: string): string | null {
  const m = text.match(new RegExp(`${key}\\s*=\\s*([A-Za-z0-9 _-]+)`, "i"));
  return m ? m[1].trim() : null;
}

export function parseRoomHazard(
  raw: unknown,
  room: string,
  opts: { legacyResource?: string } = {},
): HazardParseResult {
  const hazard: ParsedHazard = {};
  const warnings: string[] = [];
  if (!isRecord(raw)) return { hazard, warnings };

  const legacyResource = opts.legacyResource?.trim() || "";

  if (raw.encounter !== undefined) {
    if (isRecord(raw.encounter)) {
      const enc = raw.encounter;
      if (nonNegativeInt(enc.spill) && named(enc.resource)) {
        hazard.encounter = { spill: enc.spill, resource: enc.resource.trim(), ...(optionalWaxCost(enc.avoid) !== undefined ? { avoid: optionalWaxCost(enc.avoid) } : {}) };
      } else {
        warnings.push(`room '${room}': encounter annotation needs an integer 'spill' and a non-empty 'resource'`);
      }
    } else if (typeof raw.encounter === "string") {
      const spill = legacyField(raw.encounter, "spill");
      if (spill !== null && /^\d+$/.test(spill)) {
        hazard.encounter = { spill: Number(spill), resource: legacyResource, ...(legacyField(raw.encounter, "avoid") !== null ? { avoid: Number(legacyField(raw.encounter, "avoid")) } : {}) };
        warnings.push(`room '${room}': legacy encounter annotation coerced; rebuild the content to migrate`);
      } else {
        warnings.push(`room '${room}': encounter annotation is malformed and was ignored`);
      }
    } else {
      warnings.push(`room '${room}': encounter annotation is malformed and was ignored`);
    }
  }

  if (raw.trap !== undefined) {
    if (isRecord(raw.trap)) {
      const trap = raw.trap;
      if (positiveInt(trap.faces) && named(trap.snuff) && named(trap.resource)) {
        hazard.trap = {
          snuff: trap.snuff.trim(),
          faces: trap.faces,
          resource: trap.resource.trim(),
          ...(optionalWaxCost(trap.avoid) !== undefined ? { avoid: optionalWaxCost(trap.avoid) } : {}),
        };
      } else {
        warnings.push(`room '${room}': trap annotation needs a positive integer 'faces', a 'snuff' countdown, and a 'resource'`);
      }
    } else if (typeof raw.trap === "string") {
      const snuff = legacyField(raw.trap, "snuff");
      const avoid = legacyField(raw.trap, "avoid");
      if (snuff !== null) {
        hazard.trap = { snuff, faces: 8, resource: legacyResource, ...(avoid !== null && /^\d+$/.test(avoid) ? { avoid: Number(avoid) } : {}) };
        warnings.push(`room '${room}': legacy trap annotation coerced; rebuild the content to migrate`);
      } else {
        warnings.push(`room '${room}': trap annotation is malformed and was ignored`);
      }
    } else {
      warnings.push(`room '${room}': trap annotation is malformed and was ignored`);
    }
  }

  if ((hazard.encounter && !hazard.encounter.resource) || (hazard.trap && !hazard.trap.resource)) {
    warnings.push(`room '${room}': hazard annotation names no survival resource; the hazard is inert`);
  }

  return { hazard, warnings };
}
