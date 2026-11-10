// Subjective Memory — an append-only per-entity record of what a character
// remembers, bound to an event-log ordinal and carrying a gist, a structured
// claim, the affect at the time, a salience, an origin, and a disclosure level.
// It is separate from the objective event log and from belief: recording a
// memory never rewrites either, and reconciliation never rewrites a memory.
// The disclosure axis decides which surfaces may quote a record.
// REQ-599b, REQ-623, REQ-624, REQ-625, REQ-626, REQ-627, REQ-628, REQ-634
// REQ-644, REQ-645, REQ-646, REQ-647

import { estimateTokens } from "./memory.js";

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

// REQ-654 — one append-only reinforcement entry; the ledger lives inside the
// subjective-memory surface so clone, archive, export, and checkpoint exclusion
// inherit the REQ-627 semantics.
export interface ReinforcementEntry {
  id: string;
  record_id: string;
  event_ordinal: number;
  at: string;
}

export function normalizeReinforcementEntry(raw: any, index = 0): ReinforcementEntry {
  const rawId = typeof raw?.id === "string" && raw.id.length > 0 ? raw.id : `sr-legacy-${index + 1}`;
  return {
    id: rawId,
    record_id: String(raw?.record_id ?? ""),
    event_ordinal: typeof raw?.event_ordinal === "number" ? raw.event_ordinal : 0,
    at: String(raw?.at ?? ""),
  };
}

export function nextReinforcementId(entries: ReinforcementEntry[]): string {
  let max = 0;
  for (const e of entries) {
    const m = e.id.match(/^sr-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `sr-${max + 1}`;
}

export const MEMORY_ORIGINS: MemoryOrigin[] = ["witnessed", "told", "inferred", "authored"];

export const MEMORY_DISCLOSURES: MemoryDisclosure[] = ["open", "guarded", "secret"];

const POLARITIES: MemoryClaim["polarity"][] = ["positive", "negative"];

// REQ-623 — a record missing any field loads with an inert default rather than
// being dropped, so a Novel written before a field existed survives. A record
// with no disclosure level loads as `secret`: it was GM-only before the axis
// existed, and opening it without a Game Master action would publish content
// the caller never chose to share. REQ-623 — a record that predates the id
// field gets a deterministic legacy id so it stays addressable.
export function normalizeSubjectiveRecord(raw: any, index = 0): SubjectiveMemoryRecord {
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
  const rawId = typeof raw?.id === "string" && raw.id.length > 0 ? raw.id : `sm-legacy-${index + 1}`;
  return {
    id: rawId,
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

// REQ-644 — one integer score, computed from recorded state only. Salience
// dominates (0..1000); recency decays linearly across the retained event log so
// no clock and no new config is involved; origin is a small provenance bonus.
export interface MemoryScoreInputs {
  latestOrdinal: number;   // event-log head; 0 when the log is empty
  logLength: number;       // retained entries; the recency horizon
  reinforcements?: ReinforcementEntry[]; // REQ-654 ledger, already Novel-scoped
  decayHalfLife?: number;  // REQ-653, event ordinals
  reinforcementBonus?: number; // REQ-654
  reinforcementMax?: number;   // REQ-654
}

export interface MemoryScoreParts {
  salience: number;
  recency: number;
  origin: number;
  reinforcement: number;
}

export function scoreMemoryParts(r: SubjectiveMemoryRecord, inputs: MemoryScoreInputs): MemoryScoreParts {
  const entries = (inputs.reinforcements ?? []).filter((e) => e.record_id === r.id);
  const anchor = entries.length > 0
    ? Math.max(...entries.map((e) => e.event_ordinal))
    : r.event_ordinal;
  // REQ-653 — decayed salience. A record citing no event contributes no decayed
  // salience; the scale is rounded so §7.9e keeps integer terms.
  let salience = Math.round(Math.min(1, Math.max(0, r.salience)) * 1000);
  if (anchor !== null && inputs.latestOrdinal > 0) {
    const distance = Math.max(0, inputs.latestOrdinal - anchor);
    const halfLife = Math.max(1, inputs.decayHalfLife ?? 200);
    salience = Math.round(salience * Math.pow(2, -distance / halfLife));
  }
  let recency = 0;
  if (r.event_ordinal !== null && inputs.latestOrdinal > 0) {
    const distance = inputs.latestOrdinal - r.event_ordinal;
    recency = Math.max(0, Math.round(200 * (1 - distance / Math.max(1, inputs.logLength))));
  }
  const origin = r.origin === "witnessed" ? 60 : r.origin === "told" ? 40 : r.origin === "inferred" ? 20 : 0;
  const reinforcement = Math.min(entries.length, inputs.reinforcementMax ?? 6) * (inputs.reinforcementBonus ?? 25);
  return { salience, recency, origin, reinforcement };
}

export function scoreMemory(r: SubjectiveMemoryRecord, inputs: MemoryScoreInputs): number {
  const parts = scoreMemoryParts(r, inputs);
  return parts.salience + parts.recency + parts.origin + parts.reinforcement;
}

// REQ-644 — deterministic order for the section. Score first, then the chunk-1
// tie-breaks so unchanged state stays byte-identical. The render time never
// participates. The bound is applied by `assembleMemorySection`, not here.
export function selectForBriefing(
  records: SubjectiveMemoryRecord[],
  presentEntityIds: Set<string>,
  inputs: MemoryScoreInputs,
): SubjectiveMemoryRecord[] {
  const pool = records.filter((r) => presentEntityIds.has(r.entity_id));
  pool.sort(
    (a, b) =>
      scoreMemory(b, inputs) - scoreMemory(a, inputs) ||
      (b.event_ordinal ?? -1) - (a.event_ordinal ?? -1) ||
      a.id.localeCompare(b.id, undefined, { numeric: true }),
  );
  return pool;
}

// REQ-645 — budgeted assembly. Records are admitted whole, in score order,
// until the record cap or the token budget binds; the caller supplies the
// renderer (and therefore the badge projection), so the omitted count covers
// only records that badge can see. REQ-632/REQ-646 — a marker returned as
// `suffix` is appended after admission, so it never changes selection, order,
// or the render cap; cost is measured on the record's own `text`.
export interface MemoryRender {
  text: string;
  suffix?: string;
}

export interface AssembledMemorySection {
  lines: string[];
  kept_ids: string[];
  omitted: number;
  tokens: number;
}

export function assembleMemorySection(
  records: SubjectiveMemoryRecord[],
  render: (r: SubjectiveMemoryRecord) => MemoryRender,
  opts: { maxRecords: number; budgetTokens: number; marker: (omitted: number) => string },
): AssembledMemorySection {
  const lines: string[] = [];
  const kept: string[] = [];
  let omitted = 0;
  let tokens = 0;
  for (const record of records) {
    if (opts.maxRecords > 0 && kept.length >= opts.maxRecords) { omitted++; continue; }
    const rendered = render(record);
    const cost = estimateTokens(rendered.text);
    if (opts.budgetTokens > 0 && tokens + cost > opts.budgetTokens) { omitted++; continue; }
    lines.push(rendered.text + (rendered.suffix ?? ""));
    kept.push(record.id);
    tokens += cost;
  }
  if (omitted > 0) {
    lines.push(opts.marker(omitted));
  }
  return { lines, kept_ids: kept, omitted, tokens };
}

// REQ-647 — the records a bound should evict, lowest score first. Ties break by
// oldest event ordinal then ascending id so the choice is reproducible.
export function selectForEviction(
  records: SubjectiveMemoryRecord[],
  cap: number,
  inputs: MemoryScoreInputs,
): SubjectiveMemoryRecord[] {
  if (cap <= 0 || records.length <= cap) return [];
  const ordered = [...records].sort(
    (a, b) =>
      scoreMemory(a, inputs) - scoreMemory(b, inputs) ||
      (a.event_ordinal ?? -1) - (b.event_ordinal ?? -1) ||
      a.id.localeCompare(b.id, undefined, { numeric: true }),
  );
  return ordered.slice(0, records.length - cap);
}

// REQ-647 — fold evicted records into one entity's consolidation summary.
// Keyed by `memory:<id>` so a re-fold (undo, then re-record) never duplicates a
// line; the oldest lines go first when the character bound binds.
export interface EntityMemorySummaryData {
  entity_id: string;
  text: string;
  source_ordinals: number[];
  source_refs: string[];
}

export function foldIntoSummary(
  summary: EntityMemorySummaryData | undefined,
  evicted: SubjectiveMemoryRecord[],
  maxChars: number,
): EntityMemorySummaryData {
  const prior = summary ?? { entity_id: evicted[0]?.entity_id ?? "", text: "", source_ordinals: [], source_refs: [] };
  const seen = new Set(prior.source_refs);
  const lines = prior.text.length > 0 ? prior.text.split("\n") : [];
  const ordinals = [...prior.source_ordinals];
  const refs = [...prior.source_refs];
  for (const record of evicted) {
    const ref = `memory:${record.id}`;
    if (seen.has(ref)) continue;
    seen.add(ref);
    const ordinal = record.event_ordinal === null ? "none" : String(record.event_ordinal);
    lines.push(`- [${record.origin}] ${record.gist} (ordinal ${ordinal})`);
    refs.push(ref);
    if (record.event_ordinal !== null) ordinals.push(record.event_ordinal);
  }
  let text = lines.join("\n");
  while (maxChars > 0 && text.length > maxChars && lines.length > 1) {
    lines.shift();
    text = lines.join("\n");
  }
  if (maxChars > 0 && text.length > maxChars) text = text.slice(text.length - maxChars);
  return {
    entity_id: summary?.entity_id ?? evicted[0]?.entity_id ?? "",
    text,
    source_ordinals: [...new Set(ordinals)].sort((a, b) => a - b),
    source_refs: refs,
  };
}

// REQ-646 — whether a record's cited event is still in the retained log.
export function eventState(ordinal: number | null, retained: Set<number>): "retained" | "evicted" | "none" {
  if (ordinal === null) return "none";
  return retained.has(ordinal) ? "retained" : "evicted";
}

// REQ-599b/REQ-634 — the Player-safe projection. `open` renders in full,
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

// REQ-599b — the draft-visibility targets a memory contributes. `open` records
// are quotable and contribute nothing. `guarded` withholds its claim and affect
// from the owning entity's narration, and withholds the gist and claim from any
// other entity; `secret` withholds the gist and claim from everyone. The affect
// of a `secret` record is not a target: it shapes narration without being
// quoted, and the gist/claim already gate the content.
export function disclosureScanTargets(
  r: SubjectiveMemoryRecord,
  activeEntityId: string | null,
): Array<{ kind: string; phrase: string; key: false }> {
  if (r.disclosure === "open") return [];
  const claim = `${r.claim.subject} ${r.claim.predicate} ${r.claim.object}`.trim();
  const owner = activeEntityId !== null && activeEntityId === r.entity_id;
  const targets: Array<{ kind: string; phrase: string; key: false }> = [];
  const push = (kind: string, phrase: string) => {
    if (phrase.trim().length > 0) targets.push({ kind, phrase, key: false });
  };
  if (r.disclosure === "secret") {
    push("secret memory gist", r.gist);
    push("secret memory claim", claim);
  } else if (owner) {
    push("guarded memory claim", claim);
    push("guarded memory affect", r.felt_then);
  } else {
    push("guarded memory gist", r.gist);
    push("guarded memory claim", claim);
  }
  return targets;
}

// REQ-655 — derived validity windows. The chain key is the subject, predicate,
// and object; polarity is not part of the key because a polarity flip is a
// contradiction, not a supersession. Windows are computed on read and never
// stored on the record.
export interface ValidityWindow {
  valid_from: number | null;
  valid_until: number | null;
}

export function claimChainKey(r: SubjectiveMemoryRecord): string {
  return [r.entity_id, r.claim.subject, r.claim.predicate]
    .map((part) => part.trim().toLowerCase())
    .join("\u0000");
}

export function deriveValidityWindows(records: SubjectiveMemoryRecord[]): Map<string, ValidityWindow> {
  const windows = new Map<string, ValidityWindow>();
  const chains = new Map<string, SubjectiveMemoryRecord[]>();
  for (const r of records) {
    const key = claimChainKey(r);
    chains.set(key, [...(chains.get(key) ?? []), r]);
  }
  for (const chain of chains.values()) {
    const ordered = [...chain].sort(
      (a, b) =>
        (a.event_ordinal ?? Number.MAX_SAFE_INTEGER) - (b.event_ordinal ?? Number.MAX_SAFE_INTEGER) ||
        a.id.localeCompare(b.id, undefined, { numeric: true }),
    );
    ordered.forEach((r, i) => {
      const next = ordered[i + 1];
      windows.set(r.id, {
        valid_from: r.event_ordinal,
        valid_until: next ? next.event_ordinal : null,
      });
    });
  }
  return windows;
}
