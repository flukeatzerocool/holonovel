// Divergence — checks what an entity remembers against what the Novel recorded.
// The projection reads recorded state only (event log, story journal, campaign
// memory, relationships, NPC dispositions, scene presence and location, and
// inventory); verdicts are derived on read and never stored, so a correction is
// a new memory record rather than an edit, and the event log is never rewritten.
// REQ-629, REQ-630, REQ-631, REQ-632, REQ-633

import { normalizeToken } from "./belief.js";
import type { NovelState } from "./state.js";
import type { SubjectiveMemoryRecord } from "./subjective.js";

export type DivergenceVerdict =
  | "confirmed"
  | "misattributed"
  | "displaced"
  | "conflated"
  | "false_outcome"
  | "affect_drift";

/** A divergence verdict, or the insufficient-record outcome (REQ-630). */
export type ClaimStatus = DivergenceVerdict | "unverifiable";

export type FactPolarity = "positive" | "negative" | "neutral";

export interface TruthFact {
  subject: string;
  predicate: string;
  object: string;
  polarity: FactPolarity;
  source: string;
  anchor: number | null;
}

export interface DivergenceResult {
  record_id: string;
  verdict: ClaimStatus;
  reason: string;
  truth: TruthFact | null;
}

// Appendix O.13 — predicate families. A claim predicate maps to exactly one
// family; a predicate outside the table is unverifiable.
const PREDICATE_FAMILIES: Record<string, string> = {
  relationship: "relationship",
  ally: "relationship",
  friend: "relationship",
  trusts: "relationship",
  rival: "relationship",
  enemy: "relationship",
  suspicious: "relationship",
  disposition: "disposition",
  attitude: "disposition",
  loyalty: "disposition",
  presence: "presence",
  present: "presence",
  attends: "presence",
  location: "location",
  located: "location",
  possession: "possession",
  possesses: "possession",
  holding: "possession",
  carries: "possession",
  outcome: "outcome",
  betrayed: "outcome",
  saved: "outcome",
  defeated: "outcome",
  helped: "outcome",
  rescued: "outcome",
};

const RELATIONSHIP_POLARITY: Record<string, FactPolarity> = {
  ally: "positive",
  mentor: "positive",
  dependent: "positive",
  neutral: "neutral",
  rival: "negative",
  suspicious: "negative",
};

const POSITIVE_DISPOSITIONS = new Set(["friendly", "loyal", "friendly.", "warm", "trusting"]);
const NEGATIVE_DISPOSITIONS = new Set(["hostile", "hostile.", "suspicious", "fearful", "angry"]);

// Appendix O.13 — affect valence terms.
const AFFECT_POSITIVE = ["glad", "grateful", "relieved", "proud", "delighted", "hopeful", "fond", "warm", "safe"];
const AFFECT_NEGATIVE = ["afraid", "terror", "terrified", "angry", "furious", "ashamed", "grief", "despair", "bitter", "guilty", "alone"];

// Appendix O.13 — outcome opposition pairs, negative side first so the longer
// phrase wins when a text contains both ("gave way" before "gave").
const OUTCOME_CUES: Array<{ term: string; polarity: FactPolarity }> = [
  { term: "gave way", polarity: "negative" },
  { term: "died", polarity: "negative" },
  { term: "sealed", polarity: "negative" },
  { term: "lost", polarity: "negative" },
  { term: "abandoned", polarity: "negative" },
  { term: "broke", polarity: "negative" },
  { term: "betrayed", polarity: "negative" },
  { term: "expelled", polarity: "negative" },
  { term: "attacked", polarity: "negative" },
  { term: "threatened", polarity: "negative" },
  { term: "held", polarity: "positive" },
  { term: "survived", polarity: "positive" },
  { term: "opened", polarity: "positive" },
  { term: "won", polarity: "positive" },
  { term: "rescued", polarity: "positive" },
  { term: "kept", polarity: "positive" },
  { term: "trusted", polarity: "positive" },
  { term: "welcomed", polarity: "positive" },
  { term: "protected", polarity: "positive" },
  { term: "saved", polarity: "positive" },
];

export function predicateFamily(predicate: string): string | null {
  return PREDICATE_FAMILIES[normalizeToken(predicate)] ?? null;
}

// REQ-630 — the affect carried by a memory, classified by the O.13 lexicon.
export function affectValence(text: string): -1 | 0 | 1 {
  const t = normalizeToken(text);
  if (!t) return 0;
  const positive = AFFECT_POSITIVE.some((w) => t.includes(w));
  const negative = AFFECT_NEGATIVE.some((w) => t.includes(w));
  if (positive && !negative) return 1;
  if (negative && !positive) return -1;
  return 0;
}

function relationshipValence(type: string): FactPolarity {
  return RELATIONSHIP_POLARITY[normalizeToken(type)] ?? "neutral";
}

function dispositionValence(disposition: string): FactPolarity {
  const d = normalizeToken(disposition);
  if (POSITIVE_DISPOSITIONS.has(d)) return "positive";
  if (NEGATIVE_DISPOSITIONS.has(d)) return "negative";
  return "neutral";
}

// REQ-629 — every recorded name resolves to one canonical token, so a claim
// naming "Kael", "kael", or the NPC id compares against the same fact.
function buildAliases(novel: NovelState): Map<string, string> {
  const alias = new Map<string, string>();
  for (const [id, entity] of novel.entities ?? new Map()) {
    alias.set(normalizeToken(id), id);
    if (entity?.name) alias.set(normalizeToken(entity.name), id);
  }
  for (const [id, npc] of novel.npcs ?? new Map()) {
    alias.set(normalizeToken(id), id);
    if (npc?.name) alias.set(normalizeToken(npc.name), id);
  }
  return alias;
}

function outcomeCue(text: string): { term: string; polarity: FactPolarity } | null {
  const t = normalizeToken(text);
  for (const cue of OUTCOME_CUES) {
    if (t.includes(cue.term)) return cue;
  }
  return null;
}

function pushOutcomeFacts(
  facts: TruthFact[],
  text: string,
  source: string,
  anchor: number | null,
  alias: Map<string, string>,
): void {
  const t = normalizeToken(text);
  if (!t) return;
  const mentioned: string[] = [];
  for (const [token, canonical] of alias) {
    if (token && t.includes(token) && !mentioned.includes(canonical)) mentioned.push(canonical);
  }
  const cue = outcomeCue(text);
  if (mentioned.length >= 2) {
    for (const subject of mentioned) {
      for (const object of mentioned) {
        if (subject === object) continue;
        facts.push({
          subject,
          predicate: "outcome",
          object,
          polarity: cue ? cue.polarity : "positive",
          source,
          anchor,
        });
      }
    }
  } else if (mentioned.length === 1 && cue) {
    facts.push({ subject: mentioned[0], predicate: "outcome", object: cue.term, polarity: cue.polarity, source, anchor });
  }
}

// REQ-629 — the recorded-state truth projection. Deterministic and read-only:
// the same Novel state always yields the same ordered fact list.
export function projectTruthFacts(novel: NovelState): TruthFact[] {
  const facts: TruthFact[] = [];
  const alias = buildAliases(novel);
  const resolve = (token: string): string => alias.get(normalizeToken(token)) ?? normalizeToken(token);

  for (const rel of novel.relationships ?? []) {
    if (!rel?.entity_a || !rel?.entity_b) continue;
    facts.push({
      subject: resolve(rel.entity_a),
      predicate: "relationship",
      object: resolve(rel.entity_b),
      polarity: relationshipValence(rel.type),
      source: `relationship:${rel.entity_a}|${rel.entity_b}`,
      anchor: null,
    });
  }

  for (const npc of (novel.npcs ?? new Map()).values()) {
    if (!npc?.disposition) continue;
    facts.push({
      subject: resolve(npc.id || npc.name),
      predicate: "disposition",
      object: normalizeToken(npc.disposition),
      polarity: dispositionValence(npc.disposition),
      source: `npc:${npc.id}`,
      anchor: null,
    });
  }

  const sceneToken = normalizeToken(novel.scene_location ?? "") || "scene";
  for (const id of novel.characters_present_ids ?? []) {
    facts.push({
      subject: resolve(id),
      predicate: "presence",
      object: sceneToken,
      polarity: "positive",
      source: `presence:${sceneToken}`,
      anchor: null,
    });
  }
  const sceneLoc = normalizeToken(novel.scene_location ?? "");
  if (sceneLoc) {
    for (const npc of (novel.npcs ?? new Map()).values()) {
      const where = normalizeToken(npc.room_id ?? npc.location ?? "");
      if (where && where === sceneLoc) {
        facts.push({
          subject: resolve(npc.id || npc.name),
          predicate: "presence",
          object: sceneToken,
          polarity: "positive",
          source: `presence:${sceneToken}`,
          anchor: null,
        });
      }
    }
  }

  for (const [id, entity] of novel.entities ?? new Map()) {
    if (entity?.current_room) {
      facts.push({
        subject: resolve(id),
        predicate: "location",
        object: normalizeToken(entity.current_room),
        polarity: "positive",
        source: `location:${id}`,
        anchor: null,
      });
    }
    for (const item of entity?.inventory ?? []) {
      facts.push({
        subject: resolve(id),
        predicate: "possession",
        object: normalizeToken(item),
        polarity: "positive",
        source: `possession:${id}`,
        anchor: null,
      });
    }
  }
  for (const npc of (novel.npcs ?? new Map()).values()) {
    const where = npc?.location ?? npc?.room_id;
    if (where) {
      facts.push({
        subject: resolve(npc.id || npc.name),
        predicate: "location",
        object: normalizeToken(where),
        polarity: "positive",
        source: `npc:${npc.id}`,
        anchor: null,
      });
    }
  }

  for (const entry of novel.event_log ?? []) {
    pushOutcomeFacts(facts, entry.text, `event:${entry.ordinal}`, entry.ordinal, alias);
  }
  for (const story of novel.story_journal ?? []) {
    pushOutcomeFacts(facts, story.entry, `story:${story.index}`, null, alias);
  }
  for (const memory of novel.campaign_memory ?? []) {
    pushOutcomeFacts(facts, memory.text, `campaign:${memory.category}:${memory.at}`, null, alias);
  }

  return facts;
}

// REQ-630 — the recorded relational valence between the remembering entity and
// the claim's object, used by the affect-drift check.
function recordedValence(novel: NovelState, entityToken: string, objectToken: string): FactPolarity {
  const alias = buildAliases(novel);
  const entity = alias.get(normalizeToken(entityToken)) ?? normalizeToken(entityToken);
  const object = alias.get(normalizeToken(objectToken)) ?? normalizeToken(objectToken);
  for (const rel of novel.relationships ?? []) {
    const a = alias.get(normalizeToken(rel.entity_a)) ?? normalizeToken(rel.entity_a);
    const b = alias.get(normalizeToken(rel.entity_b)) ?? normalizeToken(rel.entity_b);
    if ((a === entity && b === object) || (a === object && b === entity)) {
      return relationshipValence(rel.type);
    }
  }
  for (const npc of (novel.npcs ?? new Map()).values()) {
    if ((alias.get(normalizeToken(npc.id || npc.name)) ?? normalizeToken(npc.id || npc.name)) === object && npc.disposition) {
      return dispositionValence(npc.disposition);
    }
  }
  return "neutral";
}

// REQ-630 — fixed precedence: false outcome, displaced, conflated,
// misattributed, affect drift, confirmed; unverifiable when nothing resolves.
export function checkRecord(
  record: SubjectiveMemoryRecord,
  facts: TruthFact[],
  novel: NovelState,
): DivergenceResult {
  const alias = buildAliases(novel);
  const resolve = (token: string): string => alias.get(normalizeToken(token)) ?? normalizeToken(token);
  const base = { record_id: record.id };

  const family = predicateFamily(record.claim.predicate);
  if (!family) {
    return {
      ...base,
      verdict: "unverifiable",
      reason: `predicate '${record.claim.predicate}' is not a declared family (Appendix O.13)`,
      truth: null,
    };
  }

  const subject = resolve(record.claim.subject);
  const object = resolve(record.claim.object);
  const polarity = record.claim.polarity;

  const question = facts.filter((f) => f.subject === subject && f.predicate === family && f.object === object);
  const anchorMismatch = (f: TruthFact): boolean =>
    record.event_ordinal !== null && f.anchor !== null && f.anchor !== record.event_ordinal;

  const samePolarity = question.filter((f) => f.polarity === polarity);
  if (samePolarity.length > 0) {
    const anchored = samePolarity.find((f) => !anchorMismatch(f));
    if (anchored) {
      const affect = affectValence(record.felt_then);
      // The claim's subject is the target when its object is not a recorded
      // entity (a disposition's object is a value, not a party).
      const target = alias.has(normalizeToken(record.claim.object)) ? record.claim.object : record.claim.subject;
      const recorded = recordedValence(novel, record.entity_id, target);
      if (affect !== 0 && recorded !== "neutral" && ((affect === 1) !== (recorded === "positive"))) {
        return {
          ...base,
          verdict: "affect_drift",
          reason: `the claim holds but the remembered affect opposes the recorded ${recorded} valence`,
          truth: anchored,
        };
      }
      return { ...base, verdict: "confirmed", reason: "recorded state asserts the claim", truth: anchored };
    }
    return {
      ...base,
      verdict: "displaced",
      reason: "the claim holds at another event than the cited one",
      truth: samePolarity[0],
    };
  }

  const opposite = question.filter((f) => f.polarity !== polarity && f.polarity !== "neutral");
  if (opposite.length > 0) {
    return {
      ...base,
      verdict: "false_outcome",
      reason: `recorded state asserts the opposite polarity (${opposite[0].polarity})`,
      truth: opposite[0],
    };
  }

  const sameSubjectPredicate = facts.filter((f) => f.subject === subject && f.predicate === family && f.object !== object);
  const samePredicateObject = facts.filter((f) => f.predicate === family && f.object === object && f.subject !== subject);
  if (sameSubjectPredicate.length > 0 && samePredicateObject.length > 0) {
    return {
      ...base,
      verdict: "conflated",
      reason: "two separate recorded facts each carry part of the claim",
      truth: samePredicateObject[0],
    };
  }
  if (samePredicateObject.length > 0) {
    return {
      ...base,
      verdict: "misattributed",
      reason: `the recorded fact names a different subject than '${record.claim.subject}'`,
      truth: samePredicateObject[0],
    };
  }
  if (sameSubjectPredicate.length > 0) {
    return {
      ...base,
      verdict: "misattributed",
      reason: `the recorded fact names a different object than '${record.claim.object}'`,
      truth: sameSubjectPredicate[0],
    };
  }

  return { ...base, verdict: "unverifiable", reason: "no recorded fact resolves the claim", truth: null };
}
