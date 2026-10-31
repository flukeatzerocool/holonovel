// Hazard-roll helpers — deterministic seeded draws for room hazard checks.
// Pure: no I/O and no engine state, so the prior-check accounting and the roll
// are unit-testable without a Novel. REQ-622b (trap hazard resolution).
import { createRng } from "./rng.js";

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
