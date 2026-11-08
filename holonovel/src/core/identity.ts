// Character Identity — the slow-changing definition of a persistent actor,
// staged, perspective-tagged, stability-classed, and version-compiled. Identity
// is Roster-tier: conversation, belief, and memory never write it.
// REQ-473, REQ-474, REQ-475, REQ-476, REQ-477, REQ-478, REQ-479, REQ-480,
// REQ-481, REQ-482, REQ-483, REQ-636, REQ-637, REQ-638, REQ-639, REQ-640,
// REQ-641, REQ-642, REQ-643

export type StabilityClass = "structural" | "constitutional" | "core" | "developmental";
export type IdentityPerspective = "self" | "biographical" | "public_reputation" | "secret" | "unknown";
export type CandidateStatus = "pending" | "accepted" | "rejected";

export const STABILITY_CLASSES: StabilityClass[] = ["structural", "constitutional", "core", "developmental"];
export const PERSPECTIVES: IdentityPerspective[] = ["self", "biographical", "public_reputation", "secret", "unknown"];

// REQ-636 — the psyche-kind catalog, adapted from COF 1.2's psyche-node kinds.
// `fact` is Holonovel's addition: an authored identity fact (name, calling) is
// not a psyche node. The renderer walks facets in this order, with `fact` last.
export type FacetKind =
  | "value"
  | "belief"
  | "want"
  | "need"
  | "fear"
  | "wound"
  | "stance"
  | "taste"
  | "habit"
  | "contradiction"
  | "rule"
  | "fact";
export const FACET_KINDS: FacetKind[] = [
  "value", "belief", "want", "need", "fear", "wound",
  "stance", "taste", "habit", "contradiction", "rule", "fact",
];
const KIND_INDEX = new Map<FacetKind, number>(FACET_KINDS.map((k, i) => [k, i]));

// REQ-637 — COF's `aware`: whether the character knows this about itself. Not
// disclosure (what it tells others); a `no` facet is acted on, never stated.
export type FacetAwareness = "yes" | "partly" | "no";
export const FACET_AWARENESSES: FacetAwareness[] = ["yes", "partly", "no"];

// REQ-639 — the valence domain, declared once. Stance and taste only.
export const VALENCE_MIN = -100;
export const VALENCE_MAX = 100;

// REQ-636/637/638/639/640/641 — the psyche attributes every candidate and
// facet carries. All optional on the wire; normalization is the only place
// defaults are applied, so roster files written before this increment load
// with today's behavior.
export interface PsycheAttributes {
  kind: FacetKind;
  awareness: FacetAwareness;
  false_but_held: boolean;
  valence?: number;
  since?: string;
  until?: string;
  contradicts: string[];
}

// REQ-473 — imported material enters as a candidate; it is not durable identity
// until explicitly accepted. REQ-483 — every candidate carries its source.
export interface IdentityCandidate extends PsycheAttributes {
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
export interface IdentityFacet extends PsycheAttributes {
  facet: string;
  value: string;
  stability: StabilityClass;
  perspective: IdentityPerspective;
  revision: number;
  source: string;
  accepted_at: string;
}

// REQ-641 — one owned contradiction whose named ends are both current facets.
export interface IdentityTension {
  id: string;
  value: string;
  ends: [string, string];
}

// REQ-478 — accepted facets are appended with a revision; the version advances.
export interface IdentityState {
  character_id: string;
  candidates: IdentityCandidate[];
  facets: IdentityFacet[];
  // Displaced accepted facets, newest last. Used only by revert; list and
  // snapshot report current facets. Optional for records written before REQ-478
  // reversibility.
  history?: IdentityFacet[];
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
  // REQ-641 — derived from the facets, so it is deterministic per version.
  tensions: IdentityTension[];
}

// REQ-476 — the kernel shape changed with the psyche attributes (2026-11-08).
export const IDENTITY_COMPILER_VERSION = "2026.11.08";

export function emptyIdentity(characterId: string): IdentityState {
  return { character_id: characterId, candidates: [], facets: [], history: [], version: 0 };
}

// REQ-636–641 — the single defaulting point. An unknown value falls back to
// the neutral default rather than failing a load: a roster file is user data.
export function normalizeFacetAttributes(raw?: Partial<PsycheAttributes>): PsycheAttributes {
  const kind = raw?.kind && KIND_INDEX.has(raw.kind) ? raw.kind : "fact";
  const awareness = raw?.awareness && FACET_AWARENESSES.includes(raw.awareness) ? raw.awareness : "yes";
  const valence = typeof raw?.valence === "number" && Number.isFinite(raw.valence)
    ? Math.max(VALENCE_MIN, Math.min(VALENCE_MAX, Math.round(raw.valence)))
    : undefined;
  return {
    kind,
    awareness,
    false_but_held: kind === "belief" && raw?.false_but_held === true,
    valence,
    since: typeof raw?.since === "string" ? raw.since : undefined,
    until: typeof raw?.until === "string" ? raw.until : undefined,
    contradicts: Array.isArray(raw?.contradicts)
      ? raw.contradicts.filter((k): k is string => typeof k === "string")
      : [],
  };
}

// Applies the defaults to a whole identity record in place. Idempotent; called
// at the access seam (identityFor) so every read and write sees attributes.
export function normalizeIdentityState(state: IdentityState): IdentityState {
  for (const c of state.candidates) Object.assign(c, normalizeFacetAttributes(c));
  for (const f of state.facets) Object.assign(f, normalizeFacetAttributes(f));
  for (const f of state.history ?? []) Object.assign(f, normalizeFacetAttributes(f));
  return state;
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
      ...normalizeFacetAttributes({}),
    });
  }
  return out;
}

// REQ-641 — a tension survives while a contradiction facet's named ends are
// both current facets. A missing end makes the tension dormant, not deleted.
export function compileTensions(facets: IdentityFacet[]): IdentityTension[] {
  const current = new Set(facets.map((f) => f.facet));
  const out: IdentityTension[] = [];
  for (const f of facets) {
    if (f.kind !== "contradiction") continue;
    const ends = [...new Set(f.contradicts)]
      .filter((k) => k !== f.facet && current.has(k))
      .sort();
    if (ends.length < 2) continue;
    out.push({ id: `${f.facet}:${ends[0]}+${ends[1]}`, value: f.value, ends: [ends[0], ends[1]] });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

// REQ-476 — deterministic compile: group accepted facets by stability class,
// sorted by facet then revision, so two instances of a character agree.
export function compileKernel(state: IdentityState): CompiledIdentityKernel {
  const byClass = (c: StabilityClass): IdentityFacet[] =>
    state.facets
      .filter((f) => f.stability === c && f.perspective !== "secret")
      .sort((a, b) => a.facet.localeCompare(b.facet) || a.revision - b.revision)
      .map((f) => ({ ...f, contradicts: [...(f.contradicts ?? [])] }));
  const compiled = {
    character_id: state.character_id,
    identity_version: state.version,
    compiler_version: IDENTITY_COMPILER_VERSION,
    structural: byClass("structural"),
    constitutional: byClass("constitutional"),
    core: byClass("core"),
    developmental: byClass("developmental"),
  };
  return { ...compiled, tensions: compileTensions([...compiled.structural, ...compiled.constitutional, ...compiled.core, ...compiled.developmental]) };
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
  const prior = state.facets
    .filter((f) => f.facet === candidate.facet)
    .sort((a, b) => b.revision - a.revision)[0];
  if (prior) {
    state.history = state.history ?? [];
    state.history.push({ ...prior, contradicts: [...(prior.contradicts ?? [])] });
  }
  const history = state.history ?? [];
  const maxRevision = Math.max(
    0,
    ...state.facets.filter((f) => f.facet === candidate.facet).map((f) => f.revision),
    ...history.filter((f) => f.facet === candidate.facet).map((f) => f.revision),
  );
  state.facets = state.facets.filter((f) => f.facet !== candidate.facet);
  state.facets.push({
    facet: candidate.facet,
    value: candidate.value,
    stability: candidate.stability,
    perspective,
    revision: maxRevision + 1,
    source: candidate.source,
    accepted_at: at,
    ...normalizeFacetAttributes(candidate),
  });
  state.version += 1;
}

// REQ-478 — compensate the most recent accepted replacement by re-applying the
// displaced facet through applyFacet. The prior value is retained only for
// this path; list and snapshot report current facets.
export function revertFacet(state: IdentityState, at: string): IdentityFacet | null {
  const prior = (state.history ?? []).pop();
  if (!prior) return null;
  const candidate: IdentityCandidate = {
    id: `revert-${prior.facet}-${prior.revision}`,
    facet: prior.facet,
    value: prior.value,
    stability: prior.stability,
    perspective: prior.perspective,
    source: prior.source,
    status: "accepted",
    proposed_at: at,
    ...normalizeFacetAttributes(prior),
  };
  applyFacet(state, candidate, prior.perspective, at);
  return state.facets.find((f) => f.facet === prior.facet) ?? null;
}

// REQ-643 — the Player sees what the character knows about itself and never
// the Game Master's marking of a false belief.
export function playerIdentityProjection(kernel: CompiledIdentityKernel): CompiledIdentityKernel {
  const project = (group: IdentityFacet[]): IdentityFacet[] =>
    group
      .filter((f) => f.awareness === "yes")
      .map((f) => ({ ...f, false_but_held: false, contradicts: [...(f.contradicts ?? [])] }));
  const structural = project(kernel.structural);
  const constitutional = project(kernel.constitutional);
  const core = project(kernel.core);
  const developmental = project(kernel.developmental);
  return {
    ...kernel,
    structural,
    constitutional,
    core,
    developmental,
    tensions: compileTensions([...structural, ...constitutional, ...core, ...developmental]),
  };
}

export interface RenderOptions {
  badge: "game_master" | "player";
  // REQ-640 — the evaluation instant. The newest event-log entry for the active
  // Novel, or null when the log is empty (then no bounds apply).
  at: string | null;
}

// REQ-640 — a facet is current only inside its date window.
function inWindow(f: IdentityFacet, at: string | null): boolean {
  if (at === null) return true;
  if (f.since && f.since > at) return false;
  if (f.until && at >= f.until) return false;
  return true;
}

// REQ-636–642 — the deterministic "who they are" body. Catalog order first,
// with `fact` last across stability classes; stability class then facet then
// revision break ties so two renders at one version are byte-identical.
export function renderWhoTheyAre(kernel: CompiledIdentityKernel, opts: RenderOptions): string {
  const groups: IdentityFacet[][] = [kernel.structural, kernel.constitutional, kernel.core, kernel.developmental];
  const classIndex = (f: IdentityFacet): number => Math.max(0, STABILITY_CLASSES.indexOf(f.stability));
  const rows: IdentityFacet[] = groups
    .flat()
    .filter((f) => {
      if (!inWindow(f, opts.at)) return false;
      // REQ-637/643 — a facet the character does not know is never stated.
      if (opts.badge === "player" && f.awareness !== "yes") return false;
      return true;
    })
    .sort(
      (a, b) =>
        (KIND_INDEX.get(a.kind) ?? FACET_KINDS.length) - (KIND_INDEX.get(b.kind) ?? FACET_KINDS.length) ||
        classIndex(a) - classIndex(b) ||
        a.facet.localeCompare(b.facet) ||
        a.revision - b.revision,
    );

  const lines = rows.map((f) => {
    const marks: string[] = [];
    if (opts.badge === "game_master") {
      // REQ-638 — the GM sees the authored falsity; the Player does not.
      if (f.false_but_held) marks.push("[false belief]");
      if (f.awareness === "no") marks.push("[unaware]");
      else if (f.awareness === "partly") marks.push("[partly aware]");
    }
    // REQ-639 — valence rides the facet it belongs to.
    if (typeof f.valence === "number") marks.push(`(valence ${f.valence})`);
    const label = f.kind === "fact" ? f.facet : f.kind;
    return `- ${label}: ${f.value}${marks.length > 0 ? ` ${marks.join(" ")}` : ""}`;
  });

  const stated = new Set(rows.map((f) => f.facet));
  const tensions = kernel.tensions
    .filter((t) => stated.has(t.ends[0]) && stated.has(t.ends[1]))
    .map((t) => `Tension: ${t.value} (${t.ends[0]} <-> ${t.ends[1]})`);

  if (lines.length === 0) return "[No identity facets to state.]";
  return [...lines, ...tensions].join("\n");
}
