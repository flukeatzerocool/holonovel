// State hashes — canonical persisted-state projection and SHA-256 digest.
// REQ-601, REQ-602, REQ-603
//
// The projection excludes the export bookkeeping tiers (REQ-096j) and the
// event log itself, because a per-event hash is stored inside an event entry
// and would otherwise be self-referential.

import crypto from "node:crypto";

export const STATE_HASH_EXCLUDED_KEYS: readonly string[] = [
  "audit_log",
  "audit_archive",
  "undo_stacks",
  "redo_stacks",
  "checkpoints",
  "metadata",
  "event_log",
];

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v === undefined) continue;
      out[key] = normalize(v);
    }
    return out;
  }
  return value;
}

// REQ-601 — canonical JSON: equal content produces an equal string regardless
// of insertion order, so two states with the same content hash equally.
export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalize(value));
}

export function projectState(state: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(state ?? {}).sort()) {
    if (STATE_HASH_EXCLUDED_KEYS.includes(key)) continue;
    out[key] = state[key];
  }
  return out;
}

// REQ-601 — SHA-256 over the canonical projection.
export function stateHash(state: Record<string, unknown>): string {
  return crypto
    .createHash("sha256")
    .update(canonicalJson(projectState(state ?? {})))
    .digest("hex");
}
