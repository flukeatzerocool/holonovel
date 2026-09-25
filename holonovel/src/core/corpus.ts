// Knowledge Corpus — cold reference material that stays quarantined until an
// entity explicitly consumes it, then records exactly what was acquired.
// REQ-496, REQ-497, REQ-498, REQ-499, REQ-500, REQ-501, REQ-502, REQ-503

export type ConsumptionMode = "read" | "research" | "taught" | "import";

// REQ-496 — a document is cold reference material: it creates no knowledge
// until consumed. REQ-497 — every document carries a knowledge domain routed
// from its trusted source profile. REQ-498 — the four-way access predicate.
export interface CorpusDocument {
  id: string;
  title: string;
  domain: string;
  body: string;
  source_profile: string;
  access_public: boolean;
  access_domains: string[];
  access_grants: string[];
  access_denies: string[];
  registered_at: string;
}

// REQ-498 — an entity's knowledge-domain profile.
export interface CorpusAccess {
  entity_id: string;
  domains: string[];
}

// REQ-500 — what an entity acquired, and from where. REQ-502 — reference
// material's first/second person is left unresolved.
export interface CorpusConsumption {
  id: string;
  entity_id: string;
  document_id: string;
  domain: string;
  mode: ConsumptionMode;
  deixis: "unresolved" | "resolved";
  excerpt: string;
  at: string;
}

export const CONSUMPTION_MODES: ConsumptionMode[] = ["read", "research", "taught", "import"];

const DEIXIS_RE = /\b(i|you|my|your|me|we|our)\b/i;

// REQ-502 — first/second-person reference material cannot silently become
// self-knowledge: consumption records the deixis as unresolved.
export function deixisOf(body: string): "unresolved" | "resolved" {
  return DEIXIS_RE.test(body) ? "unresolved" : "resolved";
}

// REQ-498 — public, OR domain match, OR explicit grant, minus explicit deny.
export function canAccess(doc: CorpusDocument, entityId: string, access: CorpusAccess[]): boolean {
  if (doc.access_denies.includes(entityId)) return false;
  if (doc.access_public) return true;
  if (doc.access_grants.includes(entityId)) return true;
  const profile = access.find((a) => a.entity_id === entityId);
  return !!profile && profile.domains.includes(doc.domain);
}

export function nextDocumentId(docs: CorpusDocument[]): string {
  let max = 0;
  for (const d of docs) {
    const m = d.id.match(/^doc-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `doc-${max + 1}`;
}

export function nextConsumptionId(records: CorpusConsumption[]): string {
  let max = 0;
  for (const r of records) {
    const m = r.id.match(/^cc-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `cc-${max + 1}`;
}

export function excerptOf(body: string, limit = 200): string {
  return body.length > limit ? body.slice(0, limit) : body;
}
