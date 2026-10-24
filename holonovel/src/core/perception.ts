// Perception Ledger — an append-only per-entity record of what an entity
// perceived (messages, scene changes, observations), distinct from what it
// believes. Perception feeds evidence; it is not itself belief.
// REQ-540, REQ-541, REQ-542, REQ-543, REQ-544, REQ-545, REQ-594

export type PerceptionKind = "message" | "scene" | "observation";

// REQ-594 — witness provenance: how the entity came to perceive the event.
export type WitnessKind = "saw" | "heard" | "inferred" | "told";

export type PerceptionSense = "sight" | "sound" | "telling" | null;

export interface PerceptionRecord {
  id: string;
  entity_id: string;
  event_ordinal: number | null;
  kind: PerceptionKind;
  summary: string;
  at: string;
  witness: WitnessKind;
  sense: PerceptionSense;
  source_entity: string | null;
  room_id: string | null;
  confidence: number;
}

export const PERCEPTION_KINDS: PerceptionKind[] = ["message", "scene", "observation"];

export const WITNESS_KINDS: WitnessKind[] = ["saw", "heard", "inferred", "told"];

// REQ-594 — legacy records carry no witness fields; load them inert rather than
// dropping them, so a pre-change Novel survives the schema addition (REQ-544).
export function normalizePerceptionRecord(raw: any): PerceptionRecord {
  const witness: WitnessKind = WITNESS_KINDS.includes(raw?.witness) ? raw.witness : "inferred";
  const sense: PerceptionSense =
    raw?.sense === "sight" || raw?.sense === "sound" || raw?.sense === "telling" ? raw.sense : null;
  return {
    id: String(raw?.id ?? ""),
    entity_id: String(raw?.entity_id ?? ""),
    event_ordinal: raw?.event_ordinal ?? null,
    kind: PERCEPTION_KINDS.includes(raw?.kind) ? raw.kind : "observation",
    summary: String(raw?.summary ?? ""),
    at: String(raw?.at ?? ""),
    witness,
    sense,
    source_entity: raw?.source_entity ?? null,
    room_id: raw?.room_id ?? null,
    confidence: typeof raw?.confidence === "number" ? raw.confidence : 0,
  };
}

export function nextPerceptionId(records: PerceptionRecord[]): string {
  let max = 0;
  for (const r of records) {
    const m = r.id.match(/^pr-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `pr-${max + 1}`;
}
