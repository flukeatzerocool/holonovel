// Character Identity — the slow-changing definition of a persistent actor,
// staged, perspective-tagged, stability-classed, and version-compiled. Identity
// is Roster-tier: conversation, belief, and memory never write it.
// REQ-473, REQ-474, REQ-475, REQ-476, REQ-477, REQ-478, REQ-479, REQ-480,
// REQ-481, REQ-482, REQ-483

export type StabilityClass = "structural" | "constitutional" | "core" | "developmental";
export type IdentityPerspective = "self" | "biographical" | "public_reputation" | "secret" | "unknown";
export type CandidateStatus = "pending" | "accepted" | "rejected";

export const STABILITY_CLASSES: StabilityClass[] = ["structural", "constitutional", "core", "developmental"];
export const PERSPECTIVES: IdentityPerspective[] = ["self", "biographical", "public_reputation", "secret", "unknown"];

// REQ-473 — imported material enters as a candidate; it is not durable identity
// until explicitly accepted. REQ-483 — every candidate carries its source.
export interface IdentityCandidate {
  id: string;
  facet: string;
  value: string;
  stability: StabilityClass;
  perspective: IdentityPerspective;
  source: string;
  status: CandidateStatus;
  proposed_at: string;
}

// REQ-474/REQ-475 — an accepted facet is versioned, classed, and perspective-tagged.
export interface IdentityFacet {
  facet: string;
  value: string;
  stability: StabilityClass;
  perspective: IdentityPerspective;
  revision: number;
  source: string;
  accepted_at: string;
}

// REQ-478 — accepted facets are appended with a revision; the version advances.
export interface IdentityState {
  character_id: string;
  candidates: IdentityCandidate[];
  facets: IdentityFacet[];
  version: number;
}

// REQ-476 — compiled kernel cached by (character_id, identity_version, compiler_version).
export interface CompiledIdentityKernel {
  character_id: string;
  identity_version: number;
  compiler_version: string;
  structural: IdentityFacet[];
  constitutional: IdentityFacet[];
  core: IdentityFacet[];
  developmental: IdentityFacet[];
}

export const IDENTITY_COMPILER_VERSION = "2026.09.24";

export function emptyIdentity(characterId: string): IdentityState {
  return { character_id: characterId, candidates: [], facets: [], version: 0 };
}

// REQ-479 — character-card bootstrap stages candidates but excludes the
// scenario and first-message fields, which describe play, not identity.
const EXCLUDED_CARD_FIELDS = new Set(["scenario", "first_mes", "first_message", "mes_example", "example_dialogue"]);

export function candidatesFromCard(characterId: string, card: Record<string, unknown>, at: string): IdentityCandidate[] {
  const out: IdentityCandidate[] = [];
  let n = 0;
  for (const [field, raw] of Object.entries(card)) {
    if (EXCLUDED_CARD_FIELDS.has(field.toLowerCase())) continue;
    if (raw === undefined || raw === null || raw === "") continue;
    const value = typeof raw === "string" ? raw : JSON.stringify(raw);
    out.push({
      id: `idc-${++n}`,
      facet: field,
      value,
      stability: field.toLowerCase() === "name" ? "structural" : "core",
      perspective: "biographical",
      source: "character_card",
      status: "pending",
      proposed_at: at,
    });
  }
  return out;
}

// REQ-476 — deterministic compile: group accepted facets by stability class,
// sorted by facet then revision, so two instances of a character agree.
export function compileKernel(state: IdentityState): CompiledIdentityKernel {
  const byClass = (c: StabilityClass): IdentityFacet[] =>
    state.facets
      .filter((f) => f.stability === c && f.perspective !== "secret")
      .sort((a, b) => a.facet.localeCompare(b.facet) || a.revision - b.revision)
      .map((f) => ({ ...f }));
  return {
    character_id: state.character_id,
    identity_version: state.version,
    compiler_version: IDENTITY_COMPILER_VERSION,
    structural: byClass("structural"),
    constitutional: byClass("constitutional"),
    core: byClass("core"),
    developmental: byClass("developmental"),
  };
}

export function nextCandidateId(state: IdentityState): string {
  let max = 0;
  for (const c of state.candidates) {
    const m = c.id.match(/^idc-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `idc-${max + 1}`;
}

// REQ-477 — identity is the only writer of identity. Applying an accepted
// candidate is the single mutation path; nothing else calls this.
export function applyFacet(state: IdentityState, candidate: IdentityCandidate, perspective: IdentityPerspective, at: string): void {
  const prior = state.facets.filter((f) => f.facet === candidate.facet);
  state.facets = state.facets.filter((f) => f.facet !== candidate.facet);
  state.facets.push({
    facet: candidate.facet,
    value: candidate.value,
    stability: candidate.stability,
    perspective,
    revision: prior.length + 1,
    source: candidate.source,
    accepted_at: at,
  });
  state.version += 1;
}
