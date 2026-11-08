// Subjective Memory — an append-only per-entity record of what a character
// remembers, bound to an event-log ordinal and carrying a gist, a structured
// claim, the affect at the time, a salience, and an origin. It is separate from
// the objective event log and from belief: recording a memory never rewrites
// either, and reconciliation never rewrites a memory.
// REQ-623, REQ-624, REQ-625, REQ-626, REQ-627, REQ-628

// REQ-623 — how the entity came to hold the memory.
export type MemoryOrigin = "witnessed" | "told" | "inferred" | "authored";

// REQ-623 — the claim is the entity's proposition, not recorded state.
export interface MemoryClaim {
  subject: string;
  predicate: string;
  object: string;
  polarity: "positive" | "negative";
}

export interface SubjectiveMemoryRecord {
  id: string;
  entity_id: string;
  event_ordinal: number | null;
  gist: string;
  claim: MemoryClaim;
  felt_then: string;
  salience: number;
  origin: MemoryOrigin;
  at: string;
}

export const MEMORY_ORIGINS: MemoryOrigin[] = ["witnessed", "told", "inferred", "authored"];

const POLARITIES: MemoryClaim["polarity"][] = ["positive", "negative"];

// REQ-623 — a record missing any field loads with an inert default rather than
// being dropped, so a Novel written before a field existed survives.
export function normalizeSubjectiveRecord(raw: any): SubjectiveMemoryRecord {
  const origin: MemoryOrigin = MEMORY_ORIGINS.includes(raw?.origin) ? raw.origin : "authored";
  const polarity: MemoryClaim["polarity"] = POLARITIES.includes(raw?.claim?.polarity)
    ? raw.claim.polarity
    : "positive";
  const salience = typeof raw?.salience === "number" && Number.isFinite(raw.salience)
    ? Math.min(1, Math.max(0, raw.salience))
    : 0.5;
  return {
    id: String(raw?.id ?? ""),
    entity_id: String(raw?.entity_id ?? ""),
    event_ordinal: typeof raw?.event_ordinal === "number" ? raw.event_ordinal : null,
    gist: String(raw?.gist ?? ""),
    claim: {
      subject: String(raw?.claim?.subject ?? ""),
      predicate: String(raw?.claim?.predicate ?? ""),
      object: String(raw?.claim?.object ?? ""),
      polarity,
    },
    felt_then: String(raw?.felt_then ?? ""),
    salience,
    origin,
    at: String(raw?.at ?? ""),
  };
}

export function nextSubjectiveId(records: SubjectiveMemoryRecord[]): string {
  let max = 0;
  for (const r of records) {
    const m = r.id.match(/^sm-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `sm-${max + 1}`;
}

// REQ-626 — deterministic selection for the GM briefing. Order is descending
// salience, then descending event ordinal, then ascending record id; the render
// time never participates, so unchanged state yields an identical section.
export function selectForBriefing(
  records: SubjectiveMemoryRecord[],
  presentEntityIds: Set<string>,
  max: number,
): SubjectiveMemoryRecord[] {
  const pool = records.filter((r) => presentEntityIds.has(r.entity_id));
  pool.sort(
    (a, b) =>
      b.salience - a.salience ||
      (b.event_ordinal ?? -1) - (a.event_ordinal ?? -1) ||
      a.id.localeCompare(b.id, undefined, { numeric: true }),
  );
  return max > 0 ? pool.slice(0, max) : pool;
}
