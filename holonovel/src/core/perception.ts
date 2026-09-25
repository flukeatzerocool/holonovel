// Perception Ledger — an append-only per-entity record of what an entity
// perceived (messages, scene changes, observations), distinct from what it
// believes. Perception feeds evidence; it is not itself belief.
// REQ-540, REQ-541, REQ-542, REQ-543, REQ-544, REQ-545

export type PerceptionKind = "message" | "scene" | "observation";

export interface PerceptionRecord {
  id: string;
  entity_id: string;
  event_ordinal: number | null;
  kind: PerceptionKind;
  summary: string;
  at: string;
}

export const PERCEPTION_KINDS: PerceptionKind[] = ["message", "scene", "observation"];

export function nextPerceptionId(records: PerceptionRecord[]): string {
  let max = 0;
  for (const r of records) {
    const m = r.id.match(/^pr-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `pr-${max + 1}`;
}
