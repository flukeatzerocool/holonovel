// Semantic Index — a build-time, offline, deterministic feature index over
// Novel sources. Ranking is advisory only: candidates never write state, and a
// candidate becomes truth only when promoted through its authoritative tool.
// REQ-504, REQ-505, REQ-506, REQ-507, REQ-508, REQ-509

import { createHash } from "node:crypto";

export type IndexItemType = "lore" | "corpus" | "npc" | "entity";
export type IndexScope = "shared" | "game_master";
export type SemanticRelationKind = "equivalent" | "refines" | "contradicts" | "related";

export interface IndexSourceItem {
  id: string;
  type: IndexItemType;
  text: string;
  scope: IndexScope;
}

export interface IndexRecord {
  id: string;
  type: IndexItemType;
  scope: IndexScope;
  terms: Record<string, number>;
  norm: number;
  cluster: string | null;
}

export interface SemanticRelation {
  a: string;
  b: string;
  relation: SemanticRelationKind;
  score: number;
}

export interface SemanticIndex {
  built_at: string;
  fingerprint: string;
  records: IndexRecord[];
  relations: SemanticRelation[];
  clusters: Record<string, string[]>;
}

export interface Candidate {
  id: string;
  type: IndexItemType;
  scope: IndexScope;
  score: number;
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "is", "are", "was",
  "were", "be", "been", "it", "its", "this", "that", "with", "for", "as", "by",
]);

// REQ-504 — deterministic offline feature extraction.
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

export function termVector(text: string): { terms: Record<string, number>; norm: number } {
  const terms: Record<string, number> = {};
  for (const t of tokenize(text)) terms[t] = (terms[t] ?? 0) + 1;
  let sum = 0;
  for (const v of Object.values(terms)) sum += v * v;
  return { terms, norm: Math.sqrt(sum) };
}

export function cosine(a: { terms: Record<string, number>; norm: number }, b: { terms: Record<string, number>; norm: number }): number {
  if (a.norm === 0 || b.norm === 0) return 0;
  const [small, large] = Object.keys(a.terms).length <= Object.keys(b.terms).length ? [a, b] : [b, a];
  let dot = 0;
  for (const [t, v] of Object.entries(small.terms)) {
    const w = large.terms[t];
    if (w) dot += v * w;
  }
  return dot / (a.norm * b.norm);
}

// REQ-505 — a source fingerprint so staleness is detectable.
export function fingerprintItems(items: IndexSourceItem[]): string {
  const canonical = items
    .map((i) => `${i.id}|${i.type}|${i.scope}|${i.text}`)
    .sort()
    .join("\n");
  return createHash("sha256").update(canonical).digest("hex");
}

// REQ-504 — build the index. REQ-507 — derive advisory relations.
export function buildIndex(items: IndexSourceItem[], builtAt: string): SemanticIndex {
  const records: IndexRecord[] = items.map((i) => {
    const { terms, norm } = termVector(`${i.id} ${i.text}`);
    return { id: i.id, type: i.type, scope: i.scope, terms, norm, cluster: null };
  });
  // Deterministic clustering by connected components over shared high-weight terms.
  const clusters: Record<string, string[]> = {};
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    return r;
  };
  for (const r of records) parent.set(r.id, r.id);
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const shared = Object.keys(records[i].terms).filter((t) => records[i].terms[t] > 0 && records[j].terms[t] > 0);
      if (shared.length >= 2) {
        const a = find(records[i].id); const b = find(records[j].id);
        if (a !== b) parent.set(a, b);
      }
    }
  }
  for (const r of records) {
    const root = find(r.id);
    (clusters[root] ??= []).push(r.id);
    r.cluster = root;
  }
  // Keep only real clusters (size > 1).
  for (const key of Object.keys(clusters)) if (clusters[key].length < 2) delete clusters[key];

  const relations: SemanticRelation[] = [];
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const score = cosine(records[i], records[j]);
      if (score >= 0.8) relations.push({ a: records[i].id, b: records[j].id, relation: "equivalent", score: Number(score.toFixed(4)) });
      else if (score >= 0.5) relations.push({ a: records[i].id, b: records[j].id, relation: "related", score: Number(score.toFixed(4)) });
    }
  }
  return { built_at: builtAt, fingerprint: fingerprintItems(items), records, relations, clusters };
}

// REQ-506 — deterministic advisory ranking. REQ-509 — scope filter.
export function rank(query: string, index: SemanticIndex, allowedScopes: IndexScope[], limit: number): Candidate[] {
  const q = termVector(query);
  const allow = new Set(allowedScopes);
  return index.records
    .filter((r) => allow.has(r.scope))
    .map((r) => ({ id: r.id, type: r.type, scope: r.scope, score: Number(cosine(q, r).toFixed(4)) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit);
}

export function allowedScopesFor(badge: string): IndexScope[] {
  return badge === "game_master" || badge === "none" ? ["shared", "game_master"] : ["shared"];
}
