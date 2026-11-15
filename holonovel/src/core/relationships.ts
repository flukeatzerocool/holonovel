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
// REQ-234b, REQ-234d, REQ-236a, REQ-286, REQ-512.

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

// REQ-234b/REQ-234d — a secret that implicates another party recommends a
// relationship. The recommendation is derived on every read: it is a function
// of the secret store, the registered party names, and the existing rows, so
// nothing new is persisted and clone/checkpoint/archive stay unchanged. The
// server never writes the edge; the GM applies it with
// manage_relationship (action: set), after which the recommendation disappears.
export interface SecretRelationshipRecommendation {
  type: "suspicious" | "rival";
  holder_id: string;
  holder_name: string;
  target_id: string;
  target_name: string;
  secret_key: string;
}

interface NamedParty {
  id: string;
  name: string;
  kind: "entity" | "npc" | "faction";
}

// Entity, NPC, and faction names, deduped by id in resolution order, so an
// entity/faction id collision behaves as it does everywhere else (entities win).
function registeredParties(novel: NovelState): NamedParty[] {
  const parties: NamedParty[] = [];
  const seen = new Set<string>();
  const push = (id: string, name: string, kind: NamedParty["kind"]): void => {
    if (!id || !name || seen.has(id)) return;
    seen.add(id);
    parties.push({ id, name, kind });
  };
  for (const entity of novel.entities.values()) push(entity.id, entity.name, "entity");
  for (const npc of novel.npcs.values()) push(npc.id, npc.name, "npc");
  for (const faction of novel.factions) push(faction.id, faction.name, "faction");
  return parties;
}

// REQ-234b — "name overlap" is an exact, case-insensitive match bounded by
// non-alphanumeric characters. No substring, stemming, or semantic matching.
function namesPartyInText(text: string, name: string): boolean {
  const needle = name.trim().toLowerCase();
  if (!needle) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "u").test(text.toLowerCase());
}

// Existing rows keyed by unordered resolved pair and type. The stored pair key
// is order-sensitive (relationshipTokenPairKey), so sorting the two ids makes a
// reverse-direction set suppress exactly like a forward one.
function existingRelationshipKeys(novel: NovelState): Set<string> {
  const keys = new Set<string>();
  for (const rel of dedupeRelationships(novel)) {
    const a = resolveRelationshipParty(novel, rel.entity_a);
    const b = resolveRelationshipParty(novel, rel.entity_b);
    if (!a || !b) continue;
    const [left, right] = [a.id, b.id].sort();
    keys.add(`${left}\u0000${right}\u0000${rel.type}`);
  }
  return keys;
}

/**
 * Recommendations implied by the Novel's secrets (REQ-234b, REQ-234d).
 *
 * A faction holder's secret naming another faction recommends `rival`
 * (REQ-234d). Every other combination recommends `suspicious` (REQ-234b),
 * including a faction holder whose secret names an entity or NPC. One
 * recommendation per (holder, target, type); the first secret in store order
 * supplies the key, so the output is deterministic.
 */
export function secretRelationshipRecommendations(novel: NovelState): SecretRelationshipRecommendation[] {
  const parties = registeredParties(novel);
  const byId = new Map(parties.map((party) => [party.id, party]));
  const existing = existingRelationshipKeys(novel);
  const emitted = new Set<string>();
  const recommendations: SecretRelationshipRecommendation[] = [];
  for (const secret of novel.secrets) {
    for (const holderId of secret.known_by) {
      const holder = byId.get(holderId);
      if (!holder) continue;
      for (const target of parties) {
        if (target.id === holder.id) continue;
        if (!namesPartyInText(secret.content, target.name)) continue;
        const type = holder.kind === "faction" && target.kind === "faction" ? "rival" : "suspicious";
        const [left, right] = [holder.id, target.id].sort();
        const key = `${left}\u0000${right}\u0000${type}`;
        if (existing.has(key) || emitted.has(key)) continue;
        emitted.add(key);
        recommendations.push({
          type,
          holder_id: holder.id,
          holder_name: holder.name,
          target_id: target.id,
          target_name: target.name,
          secret_key: secret.key,
        });
      }
    }
  }
  return recommendations;
}
