// Belief & Evidence — deterministic per-entity reconciliation of admitted
// evidence into belief stances, preserving all evidence and disagreement.
// REQ-461, REQ-462, REQ-463, REQ-464, REQ-465, REQ-466, REQ-467, REQ-468,
// REQ-469, REQ-470, REQ-471, REQ-472

export type EvidenceStatus = "active" | "unresolved" | "suppressed";
export type Polarity = "positive" | "negative";
export type BeliefStance = "positive" | "negative" | "unresolved";

export interface EvidenceRecord {
  id: string;
  entity_id: string;
  subject: string;
  predicate: string;
  object: string;
  polarity: Polarity;
  status: EvidenceStatus;
  weight: number;
  source: string;
  // REQ-462 — contributing event-log ordinals.
  source_ordinals: number[];
  at: string;
}

export interface BeliefRecord {
  entity_id: string;
  question: string;
  subject: string;
  predicate: string;
  object: string;
  stance: BeliefStance;
  support: number;
  opposition: number;
  accepted: boolean;
  // REQ-469 — declared family policy, reported for determinism.
  family: "durable" | "volatile" | "single_value";
  // REQ-470 — the sole current object for a single-value predicate.
  current: boolean;
  evidence_ids: string[];
  at: string;
}

// REQ-469 — predicate family policy. Deterministic default mapping; a ruleset
// or builder may extend it, but the mapping used is always reported.
const VOLATILE_PREDICATES = new Set(["status", "mood", "location", "condition", "activity"]);
const SINGLE_VALUE_PREDICATES = new Set(["location", "wearing", "holding", "carrying"]);

export function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

// REQ-463 — polarity-independent question identity.
export function questionKey(subject: string, predicate: string, object: string): string {
  return `${normalizeToken(subject)}|${normalizeToken(predicate)}|${normalizeToken(object)}`;
}

export function beliefFamily(predicate: string): BeliefRecord["family"] {
  const p = normalizeToken(predicate);
  if (SINGLE_VALUE_PREDICATES.has(p)) return "single_value";
  if (VOLATILE_PREDICATES.has(p)) return "volatile";
  return "durable";
}

export interface ReconcileOptions {
  acceptThreshold: number;
  decisionMargin: number;
}

// REQ-466 — noisy-OR over independent sources; evidence sharing a source key is
// correlated and does not compound.
function sideSupport(records: EvidenceRecord[]): number {
  const bySource = new Map<string, number>();
  for (const r of records) {
    const key = r.source || "unknown";
    bySource.set(key, Math.max(bySource.get(key) ?? 0, r.weight));
  }
  let product = 1;
  for (const w of bySource.values()) product *= 1 - w;
  return 1 - product;
}

function activeFor(records: EvidenceRecord[]): EvidenceRecord[] {
  return records.filter((r) => r.status === "active");
}

// REQ-468/REQ-465/REQ-469/REQ-470 — recompute every question for one entity.
export function reconcileEntity(
  entityId: string,
  evidence: EvidenceRecord[],
  opts: ReconcileOptions,
  at: string,
): BeliefRecord[] {
  const mine = activeFor(evidence).filter((e) => e.entity_id === entityId);
  const questions = new Map<string, EvidenceRecord[]>();
  for (const e of mine) {
    const key = questionKey(e.subject, e.predicate, e.object);
    const list = questions.get(key) ?? [];
    list.push(e);
    questions.set(key, list);
  }

  const records: BeliefRecord[] = [];
  for (const [key, list] of questions) {
    const first = list[0];
    const family = beliefFamily(first.predicate);
    const positive = list.filter((e) => e.polarity === "positive");
    const negative = list.filter((e) => e.polarity === "negative");

    let support: number;
    let opposition: number;
    let stance: BeliefStance;

    if (family === "volatile") {
      // REQ-469 — most recent acquisition wins; ties go to the later id.
      const latest = [...list].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.id.localeCompare(b.id))).pop()!;
      support = latest.polarity === "positive" ? latest.weight : 0;
      opposition = latest.polarity === "negative" ? latest.weight : 0;
      stance = latest.weight >= opts.acceptThreshold ? latest.polarity : "unresolved";
    } else {
      support = sideSupport(positive);
      opposition = sideSupport(negative);
      if (support >= opts.acceptThreshold && support - opposition >= opts.decisionMargin) stance = "positive";
      else if (opposition >= opts.acceptThreshold && opposition - support >= opts.decisionMargin) stance = "negative";
      else stance = "unresolved";
    }

    records.push({
      entity_id: entityId,
      question: key,
      subject: first.subject,
      predicate: first.predicate,
      object: first.object,
      stance,
      support: Number(support.toFixed(4)),
      opposition: Number(opposition.toFixed(4)),
      accepted: stance !== "unresolved",
      family,
      current: family !== "single_value",
      evidence_ids: list.map((e) => e.id),
      at,
    });
  }

  // REQ-470 — single-value predicates: only the highest-support object for a
  // subject+predicate is current; a tie-contested slot yields no current value.
  const slots = new Map<string, BeliefRecord[]>();
  for (const r of records) {
    if (r.family !== "single_value") continue;
    const slot = `${normalizeToken(r.subject)}|${normalizeToken(r.predicate)}`;
    const group = slots.get(slot) ?? [];
    group.push(r);
    slots.set(slot, group);
  }
  for (const group of slots.values()) {
    const accepted = group.filter((r) => r.accepted);
    const ranked = [...accepted].sort((a, b) => b.support - a.support);
    const top = ranked[0];
    const tie = top && ranked.filter((r) => Math.abs(r.support - top.support) < opts.decisionMargin).length > 1;
    for (const r of group) r.current = !!top && !tie && r === top;
  }

  return records.sort((a, b) => a.question.localeCompare(b.question));
}
