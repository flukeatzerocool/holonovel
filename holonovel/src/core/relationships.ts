// Relationship resolution — a relationship party is the same party whether it
// is stored by id or by display name. This is the single read seam for the
// knowledge state, the character sheet, the relationship tool, intent
// suggestions, and the knowledge-graph source set.
//
// Resolution order is Novel entities, NPCs, then factions. Storage keeps the
// supplied token; reads resolve it, so existing saves load unchanged. An
// unresolved token falls back to a normalized raw match (the test fixtures use
// ad-hoc labels such as "a" and "b" that are not registered parties).
//
// REQ-236a, REQ-286, REQ-512.

import type { NovelState, Relationship } from "./state.js";

export interface RelationshipParty {
  id: string;
  name: string;
}

function normalizeRelationshipToken(token: unknown): string {
  return String(token ?? "").trim().toLowerCase();
}

/** Resolve an id or display name to the party it names. */
export function resolveRelationshipParty(novel: NovelState, token: unknown): RelationshipParty | null {
  const t = normalizeRelationshipToken(token);
  if (!t) return null;
  for (const entity of novel.entities.values()) {
    if (normalizeRelationshipToken(entity.id) === t || normalizeRelationshipToken(entity.name) === t) {
      return { id: entity.id, name: entity.name };
    }
  }
  for (const npc of novel.npcs.values()) {
    if (normalizeRelationshipToken(npc.id) === t || normalizeRelationshipToken(npc.name) === t) {
      return { id: npc.id, name: npc.name };
    }
  }
  for (const faction of novel.factions) {
    if (normalizeRelationshipToken(faction.id) === t || normalizeRelationshipToken(faction.name) === t) {
      return { id: faction.id, name: faction.name };
    }
  }
  return null;
}

/** The resolved party, or the raw token when it names no registered party. */
export function relationshipParty(novel: NovelState, token: unknown): RelationshipParty {
  return resolveRelationshipParty(novel, token) ?? { id: String(token ?? ""), name: String(token ?? "") };
}

/** Both endpoints, resolved for display. */
export function relationshipEndpoints(novel: NovelState, rel: Relationship): { a: RelationshipParty; b: RelationshipParty } {
  return { a: relationshipParty(novel, rel.entity_a), b: relationshipParty(novel, rel.entity_b) };
}

/** Ordered canonical key for a pair of supplied tokens. */
export function relationshipTokenPairKey(novel: NovelState, a: unknown, b: unknown): string {
  const ra = resolveRelationshipParty(novel, a);
  const rb = resolveRelationshipParty(novel, b);
  const left = ra ? ra.id : normalizeRelationshipToken(a);
  const right = rb ? rb.id : normalizeRelationshipToken(b);
  return `${left}\u0000${right}`;
}

/** Ordered canonical key for a stored relationship row. */
export function relationshipPairKey(novel: NovelState, rel: Relationship): string {
  return relationshipTokenPairKey(novel, rel.entity_a, rel.entity_b);
}

/** True when the row names the target party in either direction. */
export function isRelationshipInvolving(novel: NovelState, rel: Relationship, token: unknown): boolean {
  const target = resolveRelationshipParty(novel, token);
  if (target) {
    const a = resolveRelationshipParty(novel, rel.entity_a);
    const b = resolveRelationshipParty(novel, rel.entity_b);
    if (a && a.id === target.id) return true;
    if (b && b.id === target.id) return true;
    if (a || b) return false;
  }
  const t = normalizeRelationshipToken(token);
  return normalizeRelationshipToken(rel.entity_a) === t || normalizeRelationshipToken(rel.entity_b) === t;
}

/** First row per ordered canonical pair, preserving source order. */
export function dedupeRelationships(novel: NovelState): Relationship[] {
  const seen = new Set<string>();
  const out: Relationship[] = [];
  for (const rel of novel.relationships) {
    const key = relationshipPairKey(novel, rel);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(rel);
  }
  return out;
}

/** Outgoing and incoming rows for one party, matched by id or display name. */
export function relationshipEdgesFor(novel: NovelState, token: unknown): { outgoing: Relationship[]; incoming: Relationship[] } {
  const target = resolveRelationshipParty(novel, token);
  const rows = dedupeRelationships(novel);
  const matches = (endpoint: unknown): boolean => {
    const party = resolveRelationshipParty(novel, endpoint);
    if (target && party) return party.id === target.id;
    return normalizeRelationshipToken(endpoint) === normalizeRelationshipToken(token);
  };
  return {
    outgoing: rows.filter((rel) => matches(rel.entity_a)),
    incoming: rows.filter((rel) => matches(rel.entity_b)),
  };
}

/** Display lines for the parties related to the target. */
export function relationshipLines(novel: NovelState, token: unknown): string[] {
  return dedupeRelationships(novel)
    .filter((rel) => isRelationshipInvolving(novel, rel, token))
    .map((rel) => {
      const { a, b } = relationshipEndpoints(novel, rel);
      return `${a.name} -> ${b.name} (${rel.type})`;
    });
}
