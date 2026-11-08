// Subjective Memory — an append-only per-entity record of what a character
// remembers, bound to an event-log ordinal and carrying a gist, a structured
// claim, the affect at the time, a salience, an origin, and a disclosure level.
// It is separate from the objective event log and from belief: recording a
// memory never rewrites either, and reconciliation never rewrites a memory.
// The disclosure axis decides which surfaces may quote a record.
// REQ-599b, REQ-623, REQ-624, REQ-625, REQ-626, REQ-627, REQ-628, REQ-634

// REQ-623 — how the entity came to hold the memory.
export type MemoryOrigin = "witnessed" | "told" | "inferred" | "authored";

// REQ-623/REQ-634 — who may see the record and how it may be quoted.
//   open    — quotable on the owning entity's Player surfaces.
//   guarded — the gist may be shown; the claim and affect are withheld.
//   secret  — shapes narration only; absent from every Player surface.
export type MemoryDisclosure = "open" | "guarded" | "secret";

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
  disclosure: MemoryDisclosure;
  at: string;
}

export const MEMORY_ORIGINS: MemoryOrigin[] = ["witnessed", "told", "inferred", "authored"];

export const MEMORY_DISCLOSURES: MemoryDisclosure[] = ["open", "guarded", "secret"];

const POLARITIES: MemoryClaim["polarity"][] = ["positive", "negative"];

// REQ-623 — a record missing any field loads with an inert default rather than
// being dropped, so a Novel written before a field existed survives. A record
// with no disclosure level loads as `secret`: it was GM-only before the axis
// existed, and opening it without a Game Master action would publish content
// the caller never chose to share.
export function normalizeSubjectiveRecord(raw: any): SubjectiveMemoryRecord {
  const origin: MemoryOrigin = MEMORY_ORIGINS.includes(raw?.origin) ? raw.origin : "authored";
  const disclosure: MemoryDisclosure = MEMORY_DISCLOSURES.includes(raw?.disclosure)
    ? raw.disclosure
    : "secret";
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
    disclosure,
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

// REQ-625/REQ-634 — the Player-safe projection. `open` renders in full,
// `guarded` keeps the gist and provenance while the claim and affect are
// cleared, and `secret` is absent. Pure: the input record is never mutated.
export function playerProjection(r: SubjectiveMemoryRecord): SubjectiveMemoryRecord | null {
  if (r.disclosure === "secret") return null;
  if (r.disclosure === "open") return { ...r, claim: { ...r.claim } };
  return {
    ...r,
    claim: { subject: "", predicate: "", object: "", polarity: r.claim.polarity },
    felt_then: "",
  };
}

// REQ-599b — the draft-visibility targets a memory contributes. `secret` is a
// target in full; `guarded` withholds only its gist from the owner, so a claim
// or affect is always a target and the gist is one for every other entity.
// `open` records are quotable and contribute nothing.
export function disclosureScanTargets(
  r: SubjectiveMemoryRecord,
  activeEntityId: string | null,
): Array<{ kind: string; phrase: string; key: false }> {
  if (r.disclosure === "open") return [];
  const claim = `${r.claim.subject} ${r.claim.predicate} ${r.claim.object}`.trim();
  const owner = activeEntityId !== null && activeEntityId === r.entity_id;
  const targets: Array<{ kind: string; phrase: string; key: false }> = [];
  if (r.disclosure === "secret" || !owner) {
    targets.push({ kind: `${r.disclosure} memory gist`, phrase: r.gist, key: false });
  }
  if (claim.length > 0) {
    targets.push({ kind: `${r.disclosure} memory claim`, phrase: claim, key: false });
  }
  if (owner && r.felt_then.length > 0) {
    targets.push({ kind: `${r.disclosure} memory affect`, phrase: r.felt_then, key: false });
  }
  return targets.filter((t) => t.phrase.trim().length > 0);
}
