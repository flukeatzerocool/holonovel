// Event Log — Novel-scoped append-only observational record with deterministic
// ordering, provenance, supersession, and branch slicing.
// REQ-455, REQ-456, REQ-457, REQ-458, REQ-459, REQ-460

export type EventSource = "player" | "game_master" | "system" | "machine";

export interface EventLogEntry {
  ordinal: number;
  source: EventSource;
  kind: string;
  text: string;
  at: string;
  // REQ-457 — supersession: the prior entry is retained, never deleted.
  superseded?: boolean;
  superseded_by?: number;
  // REQ-457 — replacements recorded as alternatives to the superseded entry.
  alternatives?: number[];
}

export interface BranchLineage {
  parent_slug: string | null;
  branch_point: number | null;
}

export function emptyBranchLineage(): BranchLineage {
  return { parent_slug: null, branch_point: null };
}

// REQ-455 — deterministic ordinal: monotonic within a Novel, independent of
// wall-clock time, so replaying the same inputs reproduces the same ordinals.
export function nextOrdinal(log: EventLogEntry[]): number {
  if (log.length === 0) return 1;
  return log[log.length - 1].ordinal + 1;
}

// REQ-455 — append. Returns the new entry. Callers persist the Novel after.
export function appendEvent(
  log: EventLogEntry[],
  source: EventSource,
  kind: string,
  text: string,
  at: string,
): EventLogEntry {
  const entry: EventLogEntry = { ordinal: nextOrdinal(log), source, kind, text, at };
  log.push(entry);
  return entry;
}

// REQ-457 — append a replacement and mark the prior entry superseded. The prior
// entry remains readable; the replacement is linked as an alternative.
export function supersedeEvent(
  log: EventLogEntry[],
  ordinal: number,
  source: EventSource,
  kind: string,
  text: string,
  at: string,
): EventLogEntry | null {
  const prior = log.find((e) => e.ordinal === ordinal);
  if (!prior) return null;
  const replacement = appendEvent(log, source, kind, text, at);
  prior.superseded = true;
  prior.superseded_by = replacement.ordinal;
  if (!prior.alternatives) prior.alternatives = [];
  prior.alternatives.push(replacement.ordinal);
  return replacement;
}

// REQ-458 — branch slice: entries up to and including the branch point.
export function sliceThrough(log: EventLogEntry[], ordinal: number | null): EventLogEntry[] {
  if (ordinal === null) return log.map((e) => ({ ...e }));
  return log.filter((e) => e.ordinal <= ordinal).map((e) => ({ ...e }));
}

// REQ-456 — non-semantic view: ordering, provenance, and supersession only.
export function describeEntry(e: EventLogEntry): string {
  const tag = e.superseded ? " [superseded]" : "";
  return `#${e.ordinal} (${e.source}/${e.kind})${tag} ${e.text}`;
}

// REQ-460 — contributing entries for a derived record, by ordinal.
export function entriesByOrdinals(log: EventLogEntry[], ordinals: number[]): EventLogEntry[] {
  const set = new Set(ordinals);
  return log.filter((e) => set.has(e.ordinal));
}

// REQ-455 — configured cap: evict oldest entries when the cap is exceeded,
// preserving the append-only contract for entries still retained.
export function evictToCap(log: EventLogEntry[], cap: number): EventLogEntry[] {
  if (cap > 0 && log.length > cap) {
    return log.slice(log.length - cap);
  }
  return log;
}
