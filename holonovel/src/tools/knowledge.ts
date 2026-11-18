// Knowledge, identity, and agency tools — belief and evidence, character
// identity, causal and corpus dispatch, the semantic index and the knowledge
// graph, durable agent tasks, the perception ledger, and subjective memory.
//
// Extracted verbatim from `src/index.ts` (2026-11-17 split, stage 1) behind a
// destructured ToolContext, so every handler body reads exactly as it did. The
// five helpers the rest of the server still calls are returned from here rather
// than declared twice (REQ-461–REQ-472, REQ-473–REQ-483, REQ-504–REQ-514,
// REQ-522–REQ-530, REQ-540–REQ-545, REQ-623–REQ-656).

import { AUTONOMY_LEVELS, isMutable, nextTaskId, recordAction, transition as agentTransition, type AgentAutonomy, type AgentTask, type AgentTaskStatus } from "../core/agent.js";
import { normalizeToken, questionKey, reconcileEntity, type EvidenceRecord, type EvidenceStatus, type Polarity } from "../core/belief.js";
import { CAUSAL_DOMAINS, applySlot, evaluate, nextProposalId, type CausalDomain, type OriginSource, type TransitionProposal } from "../core/causal.js";
import { CONSUMPTION_MODES, canAccess, deixisOf, excerptOf, nextConsumptionId, nextDocumentId, type ConsumptionMode, type CorpusAccess, type CorpusConsumption, type CorpusDocument } from "../core/corpus.js";
import { buildAliases, checkRecord, projectTruthFacts, type DivergenceResult } from "../core/divergence.js";
import { summaryEntries } from "../core/enumeration.js";
import { fingerprintGraph, projectGraph, visibleGraph, type GraphScope, type GraphSourceSet } from "../core/graph.js";
import { FACET_AWARENESSES, FACET_KINDS, PERSPECTIVES, STABILITY_CLASSES, VALENCE_MAX, VALENCE_MIN, applyFacet, candidatesFromCard, compileKernel, emptyIdentity, nextCandidateId, normalizeIdentityState, playerIdentityProjection, revertFacet, type FacetAwareness, type FacetKind, type IdentityCandidate, type IdentityPerspective, type IdentityState, type StabilityClass } from "../core/identity.js";
import { PERCEPTION_KINDS, nextPerceptionId, type PerceptionKind, type PerceptionRecord } from "../core/perception.js";
import { dedupeRelationships, resolveRelationshipParty } from "../core/relationships.js";
import { getBadge, novelSnapshot, requireGM, requireNotObserver, requireNovel, requirePlayer } from "../core/server.js";
import { allowedScopesFor, buildIndex, fingerprintItems, rank, type IndexSourceItem } from "../core/semantic.js";
import type { NovelState } from "../core/state.js";
import { MEMORY_DISCLOSURES, MEMORY_ORIGINS, deriveValidityWindows, eventState, foldIntoSummary, nextReinforcementId, nextSubjectiveId, playerProjection, scoreMemoryParts, selectForEviction, type MemoryDisclosure, type MemoryOrigin, type ReinforcementEntry, type SubjectiveMemoryRecord } from "../core/subjective.js";
import { z } from "zod";
import type { RegisterTool, ToolContext } from "./context.js";

/** The declarations `index.ts` still calls after the extraction, inferred from
 *  the registration function so the two cannot drift. */
export type KnowledgeHelpers = ReturnType<typeof registerKnowledgeTools>;

export function registerKnowledgeTools(register: RegisterTool, ctx: ToolContext) {
  const {
    state, configInt, wantsDetail, memoryScoreInputs, windowAwareVerdict,
    audit, ok, err, raw, mergeScopedArgs,
  } = ctx;

// --- Belief & Evidence ---

// Belief & Evidence (REQ-461–REQ-472) — determine each entity's belief stances
// from its admitted evidence, preserving support, opposition, and disagreement.
function beliefOptions() {
  return {
    acceptThreshold: Number(process.env.TTRPG_BELIEF_ACCEPT_THRESHOLD ?? "0.6"),
    decisionMargin: Number(process.env.TTRPG_BELIEF_DECISION_MARGIN ?? "0.15"),
  };
}

// REQ-465 — reconciliation enablement. When disabled, admitted evidence is
// retained but no stance is materialized or refreshed.
function beliefReconciliationEnabled(): boolean {
  return (process.env.TTRPG_BELIEF_RECONCILIATION ?? "true") !== "false";
}

// REQ-468 — recompute every belief question from the entity's evidence records.
// REQ-466 — idempotent: an unchanged stance keeps its prior timestamp, so a
// repeated reconcile is reproducible.
function recomputeBeliefs(novel: NovelState, entityId?: string): void {
  if (!beliefReconciliationEnabled()) return;
  const at = new Date().toISOString();
  const entities = entityId ? [entityId] : [...new Set(novel.evidence.map((e) => e.entity_id))];
  const previous = new Map(novel.belief_state.map((b) => [`${b.entity_id}|${b.question}`, b]));
  novel.belief_state = novel.belief_state.filter((b) => !entities.includes(b.entity_id));
  for (const eid of entities) {
    for (const rec of reconcileEntity(eid, novel.evidence, beliefOptions(), at)) {
      const prev = previous.get(`${eid}|${rec.question}`);
      if (prev
        && prev.stance === rec.stance && prev.support === rec.support && prev.opposition === rec.opposition
        && prev.accepted === rec.accepted && prev.current === rec.current
        && JSON.stringify(prev.evidence_ids) === JSON.stringify(rec.evidence_ids)) {
        rec.at = prev.at;
      }
      novel.belief_state.push(rec);
    }
  }
}

function nextEvidenceId(novel: NovelState): string {
  let max = 0;
  for (const e of novel.evidence) {
    const m = e.id.match(/^ev-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `ev-${max + 1}`;
}

// REQ-472 — a Player reads only the active entity's beliefs; the Observer reads.
function beliefReadGate(novel: NovelState, entityId: string | undefined) {
  const badge = getBadge();
  if (badge === "player" && entityId && entityId !== novel.active_entity_id) {
    return err("FORBIDDEN", "Player badge reads only the active entity's beliefs. Switch badges with set_badge to read others.");
  }
  return null;
}

register("manage_belief", {
  title: "Belief Management (evidence, stances, memory, queries)",
  description: "Manage per-entity evidence, belief stances, and memory — not objective truth, shared lore, or derived indexes. list, get, evidence, conflicts, perception_list, subjective_list, subjective_verify, and knowledge_query read; admit, retract, reconcile, perception_record, subjective_record, subjective_recall, and subjective_disclose write. admit records a weighted proposition; reconcile recomputes stances; retract needs the admit evidence_id; ledgers are append-only; each memory carries an open/guarded/secret disclosure level gating Player reads; subjective_verify returns each memory with its divergence verdict; correct mistakes with a new record. Mutations persist to the Novel. knowledge_query returns perceptions, beliefs, and secrets. Use when: inspecting what an entity learned or remembers. Do NOT use when: recording objective truth — use manage_causality; recording shared lore — use manage_lore; ranking derived text or traversing the knowledge graph — use manage_knowledge.",
  inputSchema: {
    action: z.enum(["list", "get", "evidence", "admit", "retract", "conflicts", "reconcile", "knowledge_query", "perception_record", "perception_list", "perception_for_entity", "perception_for_event", "subjective_record", "subjective_list", "subjective_verify", "subjective_disclose", "subjective_recall"]).describe("Belief: list, get, evidence, admit, retract, conflicts, or reconcile. Perception ledger: perception_record, perception_list, perception_for_entity, or perception_for_event. Subjective memory: subjective_record, subjective_list, subjective_verify, subjective_disclose, or subjective_recall. Knowledge: knowledge_query."),
    detail: z.boolean().optional().describe("Return full belief records instead of summary entries (list)."),
    entity_id: z.string().optional().describe("Entity whose beliefs are queried or mutated."),
    subject: z.string().optional().describe("Proposition subject (admit)."),
    predicate: z.string().optional().describe("Proposition predicate (admit)."),
    object: z.string().optional().describe("Proposition object (admit)."),
    polarity: z.enum(["positive", "negative"]).optional().describe("positive or negative (admit)."),
    weight: z.number().optional().describe("Evidence support weight 0..1 (admit; default 1)."),
    source: z.string().optional().describe("Source key used to correlate duplicate evidence (admit; default the active badge)."),
    status: z.enum(["active", "unresolved", "suppressed"]).optional().describe("active, unresolved, or suppressed (admit; default active)."),
    source_ordinal: z.number().optional().describe("Contributing event-log ordinal (admit; default the latest event ordinal)."),
    question: z.string().optional().describe("Belief question key, or subject|predicate|object (get/evidence)."),
    evidence_id: z.string().optional().describe("Evidence record id (retract)."),
    perception_entity_id: z.string().optional().describe("Entity that perceived (perception_record/perception_for_entity)."),
    perception_kind: z.enum(["message", "scene", "observation"]).optional().describe("message, scene, or observation (perception_record; default observation)."),
    perception_summary: z.string().optional().describe("What was perceived (perception_record)."),
    perception_event_ordinal: z.number().optional().describe("Contributing event-log ordinal (perception_record/perception_for_event; defaults to the latest event)."),
    perception_witness: z.enum(["saw", "heard", "inferred", "told"]).optional().describe("Witness kind (perception_record; default inferred; REQ-594)."),
    perception_sense: z.enum(["sight", "sound", "telling"]).optional().describe("Sense that produced the perception (perception_record; default null; REQ-594)."),
    perception_source_entity: z.string().optional().describe("Entity the perception came from (perception_record; default null)."),
    perception_room_id: z.string().optional().describe("Room identifier for the perception (perception_record; defaults to the entity's room)."),
    perception_confidence: z.number().min(0).max(1).optional().describe("0..1 confidence (perception_record; default 0; REQ-594)."),
    subjective_entity: z.string().optional().describe("Entity that remembers, by id or name (subjective_record; filter for subjective_list)."),
    subjective_gist: z.string().optional().describe("What the entity remembers, in its own terms (subjective_record)."),
    subjective_subject: z.string().optional().describe("Claim subject (subjective_record)."),
    subjective_predicate: z.string().optional().describe("Claim predicate (subjective_record)."),
    subjective_object: z.string().optional().describe("Claim object (subjective_record)."),
    subjective_polarity: z.enum(["positive", "negative"]).optional().describe("Claim polarity (subjective_record; default positive)."),
    subjective_felt_then: z.string().optional().describe("The entity's affect at the event (subjective_record)."),
    subjective_salience: z.number().min(0).max(1).optional().describe("0..1 salience (subjective_record; default 0.5)."),
    subjective_origin: z.enum(["witnessed", "told", "inferred", "authored"]).optional().describe("How the memory arose (subjective_record; default authored; REQ-623)."),
    subjective_event_ordinal: z.number().int().min(0).optional().describe("Contributing event-log ordinal, a non-negative integer (subjective_record; defaults to the latest event)."),
    subjective_disclosure: z.enum(["open", "guarded", "secret"]).optional().describe("Who may see the memory: open (quotable), guarded (gist only), or secret (never quoted) (subjective_record; default secret; subjective_disclose; required)."),
    subjective_record_id: z.string().optional().describe("Memory record id to reclassify, e.g. sm-3 (subjective_disclose)."),
    topic: z.string().optional().describe("Optional topic filter applied to knowledge_query perceptions, beliefs, and secrets."),
  },
}, async (args: any) => {
  // REQ-542 amendment — knowledge_query returns one entity's perceptions,
  // beliefs, and known secrets, each with its event provenance (REQ-545 gating).
  if (args.action === "knowledge_query") {
    requireNotObserver();
    const novel = requireNovel();
    const entityId = args.entity_id ?? novel.active_entity_id;
    if (!entityId) return err("INVALID_INPUT", "entity_id is required (or set an active entity).");
    if (getBadge() === "player" && entityId !== novel.active_entity_id) {
      return err("FORBIDDEN", "Player badge reads only the active entity's knowledge.");
    }
    const topic = typeof args.topic === "string" && args.topic.trim() ? args.topic.toLowerCase() : null;
    const matches = (text: string) => !topic || text.toLowerCase().includes(topic);
    const perceptions = novel.perception_ledger.filter((p) => p.entity_id === entityId && matches(p.summary));
    const beliefs = novel.belief_state.filter((b) => b.entity_id === entityId
      && matches(`${b.question} ${b.subject} ${b.predicate} ${b.object}`));
    const secrets = novel.secrets.filter((s) => s.known_by.includes(entityId) && matches(`${s.key} ${s.content}`));
    return raw(JSON.stringify({ entity_id: entityId, perceptions, beliefs, secrets }, null, 2));
  }
  if (typeof args.action === "string" && args.action.startsWith("perception_")) return handlePerceptionActions(mergeScopedArgs(args, "perception"));
  // REQ-625 — subjective-memory actions are absorbed under manage_belief.
  if (typeof args.action === "string" && args.action.startsWith("subjective_")) return handleSubjectiveActions(mergeScopedArgs(args, "subjective"));
  switch (args.action) {
    case "list": {
      requireNotObserver();
      const novel = requireNovel();
      if (!args.entity_id) return err("INVALID_INPUT", "entity_id is required for list.");
      const gate = beliefReadGate(novel, args.entity_id); if (gate) return gate;
      const records = novel.belief_state.filter((b) => b.entity_id === args.entity_id);
      if (records.length === 0) return ok(`No beliefs recorded for '${args.entity_id}'.`);
      if (wantsDetail(args.detail)) return raw(JSON.stringify(records, null, 2));
      return raw(JSON.stringify(summaryEntries("belief", records), null, 2));
    }
    case "get": {
      requireNotObserver();
      const novel = requireNovel();
      if (!args.entity_id || !args.question) return err("INVALID_INPUT", "entity_id and question are required for get.");
      const gate = beliefReadGate(novel, args.entity_id); if (gate) return gate;
      const key = normalizeToken(args.question);
      const record = novel.belief_state.find((b) => b.entity_id === args.entity_id && b.question === key);
      if (!record) return err("NOT_FOUND", `No belief for question '${args.question}' on '${args.entity_id}'.`);
      return raw(JSON.stringify(record, null, 2));
    }
    case "evidence": {
      requireNotObserver();
      const novel = requireNovel();
      if (!args.entity_id) return err("INVALID_INPUT", "entity_id is required for evidence.");
      const gate = beliefReadGate(novel, args.entity_id); if (gate) return gate;
      let records = novel.evidence.filter((e) => e.entity_id === args.entity_id);
      if (args.question) {
        const key = normalizeToken(args.question);
        records = records.filter((e) => questionKey(e.subject, e.predicate, e.object) === key);
      }
      if (records.length === 0) return ok(`No evidence recorded for '${args.entity_id}'.`);
      return raw(JSON.stringify(records, null, 2));
    }
    case "admit": {
      requireGM();
      const novel = requireNovel();
      if (!args.entity_id || !args.subject || !args.predicate || !args.object || !args.polarity) {
        return err("INVALID_INPUT", "entity_id, subject, predicate, object, and polarity are required for admit.");
      }
      const weight = args.weight ?? 1;
      if (typeof weight !== "number" || weight < 0 || weight > 1) return err("INVALID_INPUT", "weight must be between 0 and 1.");
      const status: EvidenceStatus = args.status ?? "active";
      const badge = getBadge();
      const source = args.source ?? (badge === "player" ? "player" : badge === "game_master" ? "game_master" : "system");
      const ordinals = args.source_ordinal !== undefined
        ? [args.source_ordinal]
        : (novel.event_log.length ? [novel.event_log[novel.event_log.length - 1].ordinal] : []);
      // REQ-461 — immutable acquisition record. REQ-462 — event provenance.
      const record: EvidenceRecord = {
        id: nextEvidenceId(novel),
        entity_id: args.entity_id,
        subject: args.subject, predicate: args.predicate, object: args.object,
        polarity: args.polarity as Polarity, status, weight, source, source_ordinals: ordinals,
        at: new Date().toISOString(),
      };
      novel.evidence.push(record);
      const cap = parseInt(process.env.TTRPG_BELIEF_MAX_ATOMS_PER_ENTITY ?? "0", 10);
      if (cap > 0) {
        const forEntity = novel.evidence.filter((e) => e.entity_id === record.entity_id);
        if (forEntity.length > cap) {
          const drop = new Set(forEntity.slice(0, forEntity.length - cap).map((e) => e.id));
          novel.evidence = novel.evidence.filter((e) => !drop.has(e.id));
        }
      }
      recomputeBeliefs(novel, record.entity_id);
      state.saveNovel(novel);
      audit("belief_admit", { entity_id: record.entity_id, question: questionKey(record.subject, record.predicate, record.object), polarity: record.polarity });
      return ok(`Evidence ${record.id} admitted for '${record.entity_id}'.`);
    }
    case "retract": {
      requireGM();
      const novel = requireNovel();
      if (!args.evidence_id) return err("INVALID_INPUT", "evidence_id is required for retract.");
      const idx = novel.evidence.findIndex((e) => e.id === args.evidence_id);
      if (idx === -1) return err("NOT_FOUND", `Evidence '${args.evidence_id}' not found.`);
      const entityId = novel.evidence[idx].entity_id;
      novel.evidence.splice(idx, 1);
      recomputeBeliefs(novel, entityId);
      state.saveNovel(novel);
      audit("belief_retract", { evidence_id: args.evidence_id });
      return ok(`Evidence '${args.evidence_id}' retracted for '${entityId}'.`);
    }
    case "conflicts": {
      requireNotObserver();
      const novel = requireNovel();
      if (!args.entity_id) return err("INVALID_INPUT", "entity_id is required for conflicts.");
      const gate = beliefReadGate(novel, args.entity_id); if (gate) return gate;
      const records = novel.belief_state.filter((b) => b.entity_id === args.entity_id && !b.accepted);
      if (records.length === 0) return ok(`No unresolved beliefs for '${args.entity_id}'.`);
      return raw(JSON.stringify(records, null, 2));
    }
    case "reconcile": {
      requireNotObserver();
      const novel = requireNovel();
      if (!args.entity_id) return err("INVALID_INPUT", "entity_id is required for reconcile.");
      const gate = beliefReadGate(novel, args.entity_id); if (gate) return gate;
      if (!beliefReconciliationEnabled()) return ok(`Belief reconciliation is disabled (TTRPG_BELIEF_RECONCILIATION=false); no stances materialized for '${args.entity_id}'.`);
      recomputeBeliefs(novel, args.entity_id);
      state.saveNovel(novel);
      return ok(`Reconciled beliefs for '${args.entity_id}'.`);
    }
    default:
      return err("INVALID_INPUT", `Unknown belief action '${args.action}'.`);
  }
});

// --- Identity ---

// Character Identity (REQ-473–483, 636–643) — durable identity in two tiers:
// a Novel-level map for Novel entities and NPCs, and the roster baseline for
// roster-only characters. Identity is the only writer of identity; conversation,
// belief, and memory never touch it.
function isNovelIdentitySubject(characterId: string): boolean {
  const novel = state.activeNovel;
  return !!novel && (novel.entities.has(characterId) || novel.npcs.has(characterId));
}

function identityFor(characterId: string, create = false): IdentityState | null {
  const novel = state.activeNovel;
  if (novel) {
    const existing = novel.identities?.[characterId];
    if (existing) return normalizeIdentityState(existing);
    if (novel.entities.has(characterId) || novel.npcs.has(characterId)) {
      const baseline = state.roster.get(characterId)?.identity;
      if (!create) {
        // A Novel subject with no Novel-tier map reads the roster baseline
        // when one exists, so a staged character keeps its imported facets.
        return baseline ? normalizeIdentityState(baseline) : emptyIdentity(characterId);
      }
      // The first Novel-tier mutation copies the baseline into the Novel and
      // shadows it; the roster baseline is never mutated by Novel play.
      const created = baseline
        ? JSON.parse(JSON.stringify(baseline)) as IdentityState
        : emptyIdentity(characterId);
      novel.identities = novel.identities ?? {};
      novel.identities[characterId] = created;
      return normalizeIdentityState(created);
    }
  }
  const entity = state.roster.get(characterId);
  if (!entity) return null;
  if (!entity.identity) entity.identity = emptyIdentity(characterId);
  // REQ-636–641 — the single defaulting seam: roster files written before the
  // psyche attributes load with the neutral defaults (fact / yes / not false).
  return normalizeIdentityState(entity.identity);
}

function saveIdentity(characterId: string): void {
  const novel = state.activeNovel;
  if (novel && (novel.identities?.[characterId] || novel.entities.has(characterId) || novel.npcs.has(characterId))) {
    state.saveNovel(novel);
    return;
  }
  state.saveRoster();
}

// REQ-643 — the Player projection for the list surface: the character knows
// what it is aware of, and never sees the Game Master's false-belief marking.
function projectIdentityRowsForPlayer<T extends { awareness: FacetAwareness; false_but_held: boolean; contradicts?: string[] }>(rows: T[]): T[] {
  return rows
    .filter((row) => row.awareness === "yes")
    .map((row) => ({ ...row, false_but_held: false, ...(row.contradicts ? { contradicts: [...row.contradicts] } : {}) }));
}

// REQ-547 — identity candidate retention bound. Oldest candidates are evicted
// first when the configured cap is exceeded; accepted facets (identity.facets)
// and the compiled kernel are unaffected.
function enforceIdentityCandidateCap(identity: IdentityState): void {
  const cap = parseInt(process.env.TTRPG_IDENTITY_MAX_CANDIDATES ?? "0", 10);
  if (cap > 0 && identity.candidates.length > cap) {
    identity.candidates.splice(0, identity.candidates.length - cap);
  }
}

function identityReadGate(characterId: string) {
  const badge = getBadge();
  if (badge === "player" && characterId !== state.activeNovel?.active_entity_id) {
    return err("FORBIDDEN", "Player badge reads only the active character's identity. Switch badges with set_badge to read others.");
  }
  return null;
}

register("manage_identity", {
  title: "Identity Management",
  description: "Manage a character's durable identity: staged candidates, accepted facets, and the versioned compiled kernel. A Novel entity or NPC uses the Novel-tier identity map; a roster-only character uses its roster baseline. stage imports or authors identity material with a psyche kind, self-awareness, optional false-but-held belief, valence, date bounds, and contradiction links; accept replaces a facet, retains the displaced value, and bumps the version; reject marks a candidate rejected; revert restores the most recently displaced facet; bootstrap seeds from a character card. Mutation persists to the owning tier, is audited, and a Novel-tier mutation is undoable; list and snapshot are read-only, and a Player reads its own projected kernel. Use when: staging, accepting, rejecting, reverting, or reading identity. Do NOT use when: recording knowledge or belief — use manage_belief; editing narrative personality — use manage_character (action: personality).",
  inputSchema: {
    action: z.enum(["stage", "accept", "reject", "revert", "list", "snapshot", "bootstrap"]).describe("stage, accept, reject, revert, list, snapshot, or bootstrap."),
    character_id: z.string().describe("Character id: a Novel entity, NPC, or roster character."),
    candidate_id: z.string().optional().describe("Identity candidate id (accept/reject)."),
    facet: z.string().optional().describe("Identity facet key, e.g. name or calling (stage)."),
    value: z.string().optional().describe("Identity facet value (stage)."),
    stability: z.enum(["structural", "constitutional", "core", "developmental"]).optional().describe("structural, constitutional, core, or developmental (stage; default core)."),
    perspective: z.enum(["self", "biographical", "public_reputation", "secret", "unknown"]).optional().describe("self, biographical, public_reputation, secret, or unknown (stage/accept; default self)."),
    source: z.string().optional().describe("Provenance label for the candidate (stage; default manual)."),
    kind: z.enum(["value", "belief", "want", "need", "fear", "wound", "stance", "taste", "habit", "contradiction", "rule", "fact"]).optional().describe("Psyche kind (stage; default fact)."),
    awareness: z.enum(["yes", "partly", "no"]).optional().describe("Whether the character knows this about itself (stage; default yes)."),
    false_but_held: z.boolean().optional().describe("Belief kind only: the character holds it and it is false (stage)."),
    valence: z.number().int().min(-100).max(100).optional().describe("Stance or taste kind only: hostile (-100) to warm (+100) (stage)."),
    since: z.string().optional().describe("ISO date the facet began (stage)."),
    until: z.string().optional().describe("ISO date the facet ended (stage)."),
    contradicts: z.array(z.string()).optional().describe("Facet keys a contradiction facet holds in tension (stage)."),
    card: z.record(z.string(), z.unknown()).optional().describe("Character-card fields to stage (bootstrap)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "list": {
      requireNotObserver();
      const gate = identityReadGate(args.character_id); if (gate) return gate;
      const identity = identityFor(args.character_id);
      if (!identity) return err("NOT_FOUND", `Character '${args.character_id}' not found. Corrective action: pass a Novel entity, NPC, or roster character id.`);
      const { history: _history, ...publicIdentity } = identity;
      // REQ-643 — a Player reads the projected record, not the GM's view.
      if (getBadge() === "player") {
        const projected = {
          ...publicIdentity,
          candidates: projectIdentityRowsForPlayer(publicIdentity.candidates),
          facets: projectIdentityRowsForPlayer(publicIdentity.facets),
        };
        return raw(JSON.stringify(projected, null, 2));
      }
      return raw(JSON.stringify(publicIdentity, null, 2));
    }
    case "snapshot": {
      requireNotObserver();
      const gate = identityReadGate(args.character_id); if (gate) return gate;
      const identity = identityFor(args.character_id);
      if (!identity) return err("NOT_FOUND", `Character '${args.character_id}' not found. Corrective action: pass a Novel entity, NPC, or roster character id.`);
      const kernel = compileKernel(identity);
      // REQ-480/REQ-643 — one kernel, projected for a Player badge.
      return raw(JSON.stringify(getBadge() === "player" ? playerIdentityProjection(kernel) : kernel, null, 2));
    }
    case "stage": {
      requireGM();
      if (isNovelIdentitySubject(args.character_id)) novelSnapshot();
      const identity = identityFor(args.character_id, true);
      if (!identity) return err("NOT_FOUND", `Character '${args.character_id}' not found. Corrective action: pass a Novel entity, NPC, or roster character id.`);
      if (!args.facet || !args.value) return err("INVALID_INPUT", "facet and value are required for stage.");
      if (args.stability && !STABILITY_CLASSES.includes(args.stability)) return err("INVALID_INPUT", `Unknown stability '${args.stability}'.`);
      if (args.perspective && !PERSPECTIVES.includes(args.perspective)) return err("INVALID_INPUT", `Unknown perspective '${args.perspective}'.`);
      // REQ-636–641 — the psyche attributes, validated before staging.
      if (args.kind && !FACET_KINDS.includes(args.kind)) return err("INVALID_INPUT", `Unknown facet kind '${args.kind}'.`);
      if (args.awareness && !FACET_AWARENESSES.includes(args.awareness)) return err("INVALID_INPUT", `Unknown awareness '${args.awareness}'.`);
      const kind = (args.kind ?? "fact") as FacetKind;
      const awareness = (args.awareness ?? "yes") as FacetAwareness;
      if (args.false_but_held === true && kind !== "belief") return err("INVALID_INPUT", "false_but_held applies only to belief-kind facets.");
      if (args.valence !== undefined && kind !== "stance" && kind !== "taste") return err("INVALID_INPUT", "valence applies only to stance or taste facets.");
      if (args.valence !== undefined && (!Number.isInteger(args.valence) || args.valence < VALENCE_MIN || args.valence > VALENCE_MAX)) {
        return err("INVALID_INPUT", `valence must be an integer from ${VALENCE_MIN} to ${VALENCE_MAX}.`);
      }
      for (const bound of [args.since, args.until]) {
        if (bound !== undefined && Number.isNaN(Date.parse(bound))) return err("INVALID_INPUT", `Unparseable date '${bound}'. Use an ISO date.`);
      }
      if (args.since && args.until && args.since >= args.until) return err("INVALID_INPUT", "until must be later than since.");
      const candidate: IdentityCandidate = {
        id: nextCandidateId(identity),
        facet: args.facet,
        value: args.value,
        stability: (args.stability ?? "core") as StabilityClass,
        perspective: (args.perspective ?? "self") as IdentityPerspective,
        source: args.source ?? "manual",
        status: "pending",
        proposed_at: new Date().toISOString(),
        kind,
        awareness,
        false_but_held: args.false_but_held === true,
        valence: args.valence,
        since: args.since,
        until: args.until,
        contradicts: Array.isArray(args.contradicts) ? args.contradicts : [],
      };
      identity.candidates.push(candidate);
      enforceIdentityCandidateCap(identity);
      saveIdentity(args.character_id);
      audit("identity_stage", { character_id: args.character_id, candidate_id: candidate.id, facet: candidate.facet, stability: candidate.stability });
      return ok(`Identity candidate ${candidate.id} staged for '${args.character_id}'.`);
    }
    case "accept": {
      requireGM();
      if (isNovelIdentitySubject(args.character_id)) novelSnapshot();
      const identity = identityFor(args.character_id);
      if (!identity) return err("NOT_FOUND", `Character '${args.character_id}' not found. Corrective action: pass a Novel entity, NPC, or roster character id.`);
      const candidate = identity.candidates.find((c) => c.id === args.candidate_id);
      if (!candidate) return err("NOT_FOUND", `Identity candidate '${args.candidate_id}' not found.`);
      if (candidate.status !== "pending") return err("STATE_CONFLICT", `Candidate '${candidate.id}' is already ${candidate.status}.`);
      const perspective = (args.perspective ?? candidate.perspective) as IdentityPerspective;
      applyFacet(identity, candidate, perspective, new Date().toISOString());
      candidate.status = "accepted";
      saveIdentity(args.character_id);
      audit("identity_accept", { character_id: args.character_id, candidate_id: candidate.id, facet: candidate.facet, version: identity.version });
      return ok(`Accepted identity candidate ${candidate.id}; identity version is now ${identity.version}.`);
    }
    case "reject": {
      requireGM();
      if (isNovelIdentitySubject(args.character_id)) novelSnapshot();
      const identity = identityFor(args.character_id);
      if (!identity) return err("NOT_FOUND", `Character '${args.character_id}' not found. Corrective action: pass a Novel entity, NPC, or roster character id.`);
      const candidate = identity.candidates.find((c) => c.id === args.candidate_id);
      if (!candidate) return err("NOT_FOUND", `Identity candidate '${args.candidate_id}' not found.`);
      candidate.status = "rejected";
      saveIdentity(args.character_id);
      audit("identity_reject", { character_id: args.character_id, candidate_id: candidate.id });
      return ok(`Rejected identity candidate ${candidate.id}.`);
    }
    case "revert": {
      requireGM();
      if (isNovelIdentitySubject(args.character_id)) novelSnapshot();
      const identity = identityFor(args.character_id);
      if (!identity) return err("NOT_FOUND", `Character '${args.character_id}' not found. Corrective action: pass a Novel entity, NPC, or roster character id.`);
      const restored = revertFacet(identity, new Date().toISOString());
      if (!restored) return err("STATE_CONFLICT", "No displaced identity facet to revert. Accept a replacement first.");
      saveIdentity(args.character_id);
      audit("identity_revert", { character_id: args.character_id, facet: restored.facet, revision: restored.revision, version: identity.version });
      return ok(`Reverted identity facet '${restored.facet}' to revision ${restored.revision}; identity version is now ${identity.version}.`);
    }
    case "bootstrap": {
      requireGM();
      if (isNovelIdentitySubject(args.character_id)) novelSnapshot();
      const identity = identityFor(args.character_id, true);
      if (!identity) return err("NOT_FOUND", `Character '${args.character_id}' not found. Corrective action: pass a Novel entity, NPC, or roster character id.`);
      if (!args.card || typeof args.card !== "object") return err("INVALID_INPUT", "card is required for bootstrap.");
      const staged = candidatesFromCard(args.character_id, args.card, new Date().toISOString());
      const autoAccept = (process.env.TTRPG_IDENTITY_AUTO_ACCEPT_AUTHORED ?? "true") !== "false";
      for (const c of staged) {
        c.id = nextCandidateId(identity);
        identity.candidates.push(c);
        // REQ-482 — developmental candidates are proposal-only, never auto-accepted.
        if (autoAccept && c.stability !== "developmental") {
          applyFacet(identity, c, c.perspective, new Date().toISOString());
          c.status = "accepted";
        }
      }
      enforceIdentityCandidateCap(identity);
      saveIdentity(args.character_id);
      audit("identity_bootstrap", { character_id: args.character_id, staged: staged.length, auto_accept: autoAccept });
      return ok(`Bootstrapped ${staged.length} identity candidate(s) for '${args.character_id}'.`);
    }
    default:
      return err("INVALID_INPUT", `Unknown identity action '${args.action}'.`);
  }
});

// --- Causal Transition Validation ---

// Causal Transition Validation (REQ-484–REQ-495) — decides whether a proposed
// objective-state transition can coexist with the committed history of one
// scope, preserving every proposal as auditable evidence. The causal layer
// never writes belief, evidence, or identity (REQ-492).
function causalOptions(novel: NovelState) {
  return {
    scope: novel.slug,
    latentTransitions: (process.env.TTRPG_CAUSAL_LATENT_TRANSITIONS ?? "false") === "true",
  };
}

function causalEnabled(): boolean {
  return (process.env.TTRPG_CAUSAL_VALIDATION ?? "true") !== "false";
}

function buildProposal(novel: NovelState, args: any, origin: OriginSource): TransitionProposal {
  return {
    id: nextProposalId(novel.transition_ledger),
    scope: args.scope ?? novel.slug,
    domain: (args.domain ?? "location") as CausalDomain,
    entity: args.entity,
    key: args.key,
    value: args.value,
    from: args.from,
    expected_version: args.expected_version,
    origin_source: origin,
    source_ordinal: args.source_ordinal !== undefined
      ? args.source_ordinal
      : (novel.event_log.length ? novel.event_log[novel.event_log.length - 1].ordinal : null),
    at: new Date().toISOString(),
  };
}

function validateProposalArgs(args: any): string | null {
  if (args.domain !== undefined && !CAUSAL_DOMAINS.includes(args.domain)) return `domain must be one of ${CAUSAL_DOMAINS.join(", ")}.`;
  if (!args.entity) return "entity is required.";
  if (args.key === undefined) return "key is required.";
  if (args.value === undefined) return "value is required.";
  return null;
}

// REQ-484–REQ-495 — Causal Transition Validation, exposed as manage_world
// (action: causal_propose / causal_admit / causal_reject / causal_list /
// causal_state / causal_ingress). Absorbed under REQ-429 consolidation.
const handleCausalActions = async (args: any) => {
  switch (args.action) {
    case "state": {
      requireNotObserver();
      const novel = requireNovel();
      if (novel.causal_slots.length === 0) return ok("No admitted causal state.");
      return raw(JSON.stringify(novel.causal_slots, null, 2));
    }
    case "list": {
      requireNotObserver();
      const novel = requireNovel();
      if (novel.transition_ledger.length === 0) return ok("Transition ledger is empty.");
      return raw(JSON.stringify(novel.transition_ledger, null, 2));
    }
    case "propose": {
      requireGM();
      const novel = requireNovel();
      if (!causalEnabled()) return err("FORBIDDEN", "Causal validation is disabled (TTRPG_CAUSAL_VALIDATION=false).");
      const bad = validateProposalArgs(args); if (bad) return err("INVALID_INPUT", bad);
      const p = buildProposal(novel, args, (args.origin_source ?? "narrative") as OriginSource);
      // REQ-484 — record the proposal; it is not truth until admitted.
      novel.transition_ledger.push({ ...p, decision: "underdetermined", reason: "proposal recorded, awaiting admission" });
      state.saveNovel(novel);
      audit("causal_propose", { proposal_id: p.id, domain: p.domain, entity: p.entity });
      return ok(`Proposal ${p.id} recorded (underdetermined).`);
    }
    case "admit": {
      requireGM();
      const novel = requireNovel();
      if (!args.proposal_id) return err("INVALID_INPUT", "proposal_id is required for admit.");
      const record = novel.transition_ledger.find((r) => r.id === args.proposal_id);
      if (!record) return err("NOT_FOUND", `Proposal '${args.proposal_id}' not found.`);
      if (record.decision !== "underdetermined") return err("STATE_CONFLICT", `Proposal '${record.id}' is already ${record.decision}.`);
      const { decision, reason } = evaluate(record, novel.causal_slots, causalOptions(novel));
      record.decision = decision;
      record.reason = reason;
      if (decision === "admitted" || decision === "admitted_with_latent_transition") {
        applySlot(novel.causal_slots, record, new Date().toISOString());
      }
      const cap = parseInt(process.env.TTRPG_CAUSAL_MAX_LEDGER_ENTRIES ?? "0", 10);
      if (cap > 0 && novel.transition_ledger.length > cap) {
        novel.transition_ledger = novel.transition_ledger.slice(novel.transition_ledger.length - cap);
      }
      state.saveNovel(novel);
      audit("causal_admit", { proposal_id: record.id, decision });
      return ok(`Proposal ${record.id}: ${decision} — ${reason}.`);
    }
    case "reject": {
      requireGM();
      const novel = requireNovel();
      if (!args.proposal_id) return err("INVALID_INPUT", "proposal_id is required for reject.");
      const record = novel.transition_ledger.find((r) => r.id === args.proposal_id);
      if (!record) return err("NOT_FOUND", `Proposal '${args.proposal_id}' not found.`);
      // REQ-491 — the refusal is preserved.
      record.decision = "rejected_impossible";
      record.reason = "rejected by operator";
      state.saveNovel(novel);
      audit("causal_reject", { proposal_id: record.id });
      return ok(`Proposal ${record.id} rejected.`);
    }
    case "ingress": {
      requireGM();
      const novel = requireNovel();
      if (!causalEnabled()) return err("FORBIDDEN", "Causal validation is disabled (TTRPG_CAUSAL_VALIDATION=false).");
      const bad = validateProposalArgs(args); if (bad) return err("INVALID_INPUT", bad);
      // REQ-493 — deterministic machine ingress: evaluate and apply in one step.
      const p = buildProposal(novel, args, "machine");
      const { decision, reason } = evaluate(p, novel.causal_slots, causalOptions(novel));
      novel.transition_ledger.push({ ...p, decision, reason });
      if (decision === "admitted" || decision === "admitted_with_latent_transition") {
        applySlot(novel.causal_slots, p, new Date().toISOString());
      }
      state.saveNovel(novel);
      audit("causal_ingress", { proposal_id: p.id, decision });
      return ok(`Ingress ${p.id}: ${decision} — ${reason}.`);
    }
    default:
      return err("INVALID_INPUT", `Unknown causal action '${args.action}'.`);
  }
};

// --- Knowledge Corpus ---

// Knowledge Corpus (REQ-496–REQ-503) — cold reference material that creates no
// knowledge until an entity explicitly consumes it, then records what was
// acquired with its access predicate and deixis.
function corpusAccessGate(novel: NovelState, entityId: string, doc: CorpusDocument): boolean {
  return canAccess(doc, entityId, novel.corpus_access);
}

// REQ-496–REQ-503 — Knowledge Corpus, exposed as manage_lore
// (action: corpus_register / corpus_list / corpus_get / corpus_route /
// corpus_grant / corpus_deny / corpus_access / corpus_consume /
// corpus_acquisitions). Absorbed under REQ-429 consolidation.
const handleCorpusActions = async (args: any) => {
  switch (args.action) {
    case "register": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      if (!args.title || !args.body || !args.domain) return err("INVALID_INPUT", "title, body, and domain are required for register.");
      // REQ-496 — cold registration; REQ-497 — domain routed from the source profile.
      const doc: CorpusDocument = {
        id: nextDocumentId(novel.corpus_documents),
        title: args.title,
        domain: args.domain,
        body: args.body,
        source_profile: args.source_profile ?? "manual",
        access_public: args.access_public ?? false,
        access_domains: args.access_domains ?? [],
        access_grants: args.grants ?? [],
        access_denies: args.denies ?? [],
        registered_at: new Date().toISOString(),
      };
      novel.corpus_documents.push(doc);
      // REQ-546 — retention bound: the document set evicts oldest first.
      const documentCap = configInt("TTRPG_CORPUS_MAX_DOCUMENTS", 0);
      if (documentCap > 0) {
        while (novel.corpus_documents.length > documentCap) novel.corpus_documents.shift();
      }
      state.saveNovel(novel);
      audit("corpus_register", { document_id: doc.id, domain: doc.domain });
      return ok(`Corpus document ${doc.id} registered (cold).`);
    }
    case "list": {
      requireNotObserver();
      const novel = requireNovel();
      let docs = novel.corpus_documents;
      if (args.domain) docs = docs.filter((d) => d.domain === args.domain);
      const summary = docs.map((d) => ({ id: d.id, title: d.title, domain: d.domain, source_profile: d.source_profile, access_public: d.access_public }));
      if (summary.length === 0) return ok("Corpus is empty.");
      return raw(JSON.stringify(summary, null, 2));
    }
    case "get": {
      requireNotObserver();
      const novel = requireNovel();
      if (!args.document_id) return err("INVALID_INPUT", "document_id is required for get.");
      const doc = novel.corpus_documents.find((d) => d.id === args.document_id);
      if (!doc) return err("NOT_FOUND", `Corpus document '${args.document_id}' not found.`);
      return raw(JSON.stringify(doc, null, 2));
    }
    case "route": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      if (!args.document_id || !args.domain) return err("INVALID_INPUT", "document_id and domain are required for route.");
      const doc = novel.corpus_documents.find((d) => d.id === args.document_id);
      if (!doc) return err("NOT_FOUND", `Corpus document '${args.document_id}' not found.`);
      // REQ-497 — domain is routed from a trusted structured profile, never prose.
      doc.domain = args.domain;
      state.saveNovel(novel);
      audit("corpus_route", { document_id: doc.id, domain: doc.domain });
      return ok(`Corpus document ${doc.id} routed to domain '${doc.domain}'.`);
    }
    case "grant": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      if (!args.document_id || !args.entity_id) return err("INVALID_INPUT", "document_id and entity_id are required for grant.");
      const doc = novel.corpus_documents.find((d) => d.id === args.document_id);
      if (!doc) return err("NOT_FOUND", `Corpus document '${args.document_id}' not found.`);
      if (!doc.access_grants.includes(args.entity_id)) doc.access_grants.push(args.entity_id);
      state.saveNovel(novel);
      audit("corpus_grant", { document_id: doc.id, entity_id: args.entity_id });
      return ok(`Entity '${args.entity_id}' granted access to ${doc.id}.`);
    }
    case "deny": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      if (!args.document_id || !args.entity_id) return err("INVALID_INPUT", "document_id and entity_id are required for deny.");
      const doc = novel.corpus_documents.find((d) => d.id === args.document_id);
      if (!doc) return err("NOT_FOUND", `Corpus document '${args.document_id}' not found.`);
      if (!doc.access_denies.includes(args.entity_id)) doc.access_denies.push(args.entity_id);
      state.saveNovel(novel);
      audit("corpus_deny", { document_id: doc.id, entity_id: args.entity_id });
      return ok(`Entity '${args.entity_id}' denied access to ${doc.id}.`);
    }
    case "access": {
      requireGM();
      const novel = requireNovel();
      novelSnapshot();
      if (!args.entity_id || !args.domains) return err("INVALID_INPUT", "entity_id and domains are required for access.");
      const existing = novel.corpus_access.find((a) => a.entity_id === args.entity_id);
      if (existing) existing.domains = args.domains;
      else novel.corpus_access.push({ entity_id: args.entity_id, domains: args.domains } as CorpusAccess);
      state.saveNovel(novel);
      audit("corpus_access", { entity_id: args.entity_id, domains: args.domains });
      return ok(`Entity '${args.entity_id}' knowledge-domain profile set.`);
    }
    case "consume": {
      requireNotObserver();
      const novel = requireNovel();
      if (!args.entity_id || !args.document_id) return err("INVALID_INPUT", "entity_id and document_id are required for consume.");
      const doc = novel.corpus_documents.find((d) => d.id === args.document_id);
      if (!doc) return err("NOT_FOUND", `Corpus document '${args.document_id}' not found.`);
      const badge = getBadge();
      if (badge === "player" && args.entity_id !== novel.active_entity_id) {
        return err("FORBIDDEN", "Player badge consumes only for the active entity. Switch badges with set_badge to consume for others.");
      }
      // REQ-498 — the access predicate gates consumption.
      if (!corpusAccessGate(novel, args.entity_id, doc)) {
        return err("FORBIDDEN", `Entity '${args.entity_id}' may not access corpus document '${doc.id}'.`);
      }
      const mode = (args.mode ?? "read") as ConsumptionMode;
      if (!CONSUMPTION_MODES.includes(mode)) return err("INVALID_INPUT", `Unknown mode '${mode}'.`);
      // REQ-500 — acquisition ledger; REQ-501 — knowledge only now, on consumption.
      const record: CorpusConsumption = {
        id: nextConsumptionId(novel.corpus_consumption),
        entity_id: args.entity_id,
        document_id: doc.id,
        domain: doc.domain,
        mode,
        deixis: deixisOf(doc.body),
        excerpt: excerptOf(doc.body),
        at: new Date().toISOString(),
      };
      novel.corpus_consumption.push(record);
      // REQ-546 — retention bound: the per-entity acquisition ledger evicts oldest first.
      const acquisitionCap = configInt("TTRPG_CORPUS_MAX_ACQUISITIONS", 0);
      if (acquisitionCap > 0) {
        const entityRecords = novel.corpus_consumption.filter((r) => r.entity_id === record.entity_id);
        if (entityRecords.length > acquisitionCap) {
          const dropped = new Set(entityRecords.slice(0, entityRecords.length - acquisitionCap).map((r) => r.id));
          novel.corpus_consumption = novel.corpus_consumption.filter((r) => !dropped.has(r.id));
        }
      }
      state.saveNovel(novel);
      audit("corpus_consume", { entity_id: record.entity_id, document_id: record.document_id, mode });
      return ok(`Acquisition ${record.id}: '${args.entity_id}' consumed '${doc.id}' (${mode}, deixis ${record.deixis}).`);
    }
    case "acquisitions": {
      requireNotObserver();
      const novel = requireNovel();
      const badge = getBadge();
      if (badge === "player" && args.entity_id && args.entity_id !== novel.active_entity_id) {
        return err("FORBIDDEN", "Player badge reads only the active entity's acquisitions. Switch badges with set_badge to read others.");
      }
      let records = novel.corpus_consumption;
      if (args.entity_id) records = records.filter((r) => r.entity_id === args.entity_id);
      if (records.length === 0) return ok("No acquisitions recorded.");
      return raw(JSON.stringify(records, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown corpus action '${args.action}'.`);
  }
};

// --- Semantic Index ---

// Semantic Index (REQ-504–REQ-509) — a derived, session-scoped, offline feature
// index over Novel sources. Ranking is advisory: candidates never write state.
function gatherIndexSources(novel: NovelState): IndexSourceItem[] {
  const items: IndexSourceItem[] = [];
  for (const [key, l] of novel.lore) {
    items.push({ id: `lore:${key}`, type: "lore", text: `${key} ${l.content} ${(l.triggers ?? []).join(" ")}`, scope: l.visibility === "gm_only" ? "game_master" : "shared" });
  }
  for (const d of novel.corpus_documents) {
    items.push({ id: `corpus:${d.id}`, type: "corpus", text: `${d.title} ${d.body}`, scope: d.access_public ? "shared" : "game_master" });
  }
  for (const [id, n] of novel.npcs) {
    items.push({ id: `npc:${id}`, type: "npc", text: `${n.name} ${n.description ?? ""} ${n.personality?.description ?? ""}`, scope: "game_master" });
  }
  for (const [id, e] of novel.entities) {
    items.push({ id: `entity:${id}`, type: "entity", text: `${e.name} ${e.personality?.description ?? ""} ${e.personality?.background ?? ""}`, scope: "shared" });
  }
  return items;
}

// --- Knowledge Graph ---

// Knowledge-Graph Projection (REQ-510–REQ-514) — a derived, rebuildable JSON
// graph over Novel sources. The Novel file is authoritative; graph reads never
// mutate state.
function gatherGraphSources(novel: NovelState): GraphSourceSet {
  const roomByName = new Map<string, string>();
  for (const [id, room] of novel.world.rooms.entries()) roomByName.set(room.name.trim().toLowerCase(), id);
  const roomKey = (token?: string | null): string | null | undefined => {
    if (!token) return token;
    const key = token.trim().toLowerCase();
    if (novel.world.rooms.has(key)) return key;
    return roomByName.get(key) ?? token;
  };
  const partyId = (token: string): string => resolveRelationshipParty(novel, token)?.id ?? token;
  return {
    characters: [...novel.entities.values()].map((e) => ({ id: e.id, name: e.name, current_room: roomKey(e.current_room) })),
    npcs: [...novel.npcs.values()].map((n) => ({ id: n.id, name: n.name, location: roomKey(n.location), room_id: roomKey(n.room_id) })),
    lore: [...novel.lore.entries()].map(([key, l]) => ({ key, scope: l.visibility === "gm_only" ? "game_master" : "shared" })),
    factions: novel.factions.map((f) => ({ id: f.id, name: f.name, territory: (f.territory ?? []).map((t) => roomKey(t) ?? t) })),
    rooms: [...novel.world.rooms.entries()].map(([id, r]) => ({ id, name: r.name })),
    relationships: dedupeRelationships(novel).map((r) => ({ entity_a: partyId(r.entity_a), entity_b: partyId(r.entity_b), type: r.type })),
  };
}

// Derived knowledge surfaces (REQ-504–REQ-514) — a semantic index for advisory
// text ranking and a typed knowledge graph. Both are derived and in-memory:
// the Novel file is authoritative; `*_build` overwrites the prior projection
// and read actions never mutate Novel state.
register("manage_knowledge", {
  title: "Derived Knowledge (index, graph, search, neighbors)",
  description: "Manage derived, non-authoritative indexes and graphs over Novel sources — not canonical facts, beliefs, or external documents. index_build and graph_build are audited, replace the prior projection in one step, and do not persist a separate copy; both are safe to rebuild from the authoritative Novel file, which is never modified. Search and neighbor reads require the matching build and return one hop of edges or ranked candidates (limit defaults to 5); rebuild after editing or restoring the Novel. The read actions never mutate state. Use when: building or rebuilding the index or graph, checking staleness, ranking indexed items, or reading relations and graph structure. Do NOT use when: searching a bound ruleset's index — use manage_ruleset (action: search); recording knowledge — use manage_corpus; recording beliefs or perceptions — use manage_belief.",
  inputSchema: {
    action: z.enum(["index_build", "index_status", "index_list", "index_search", "index_relations", "graph_build", "graph_status", "graph_get", "graph_nodes", "graph_edges", "graph_neighbors"]).describe("index_* actions operate the semantic index; graph_* actions operate the knowledge graph."),
    query: z.string().optional().describe("Query text to rank candidates against (index_search)."),
    limit: z.number().optional().describe("Maximum candidates to return (index_search; default 5)."),
    item_id: z.string().optional().describe("Indexed item id to filter relations (index_relations)."),
    node_id: z.string().optional().describe("Graph node id (graph_neighbors)."),
  },
}, async (args: any) => {
  const scopes = allowedScopesFor(getBadge()) as GraphScope[];
  switch (args.action) {
    case "index_build": {
      requireNotObserver();
      const novel = requireNovel();
      const items = gatherIndexSources(novel);
      // REQ-504/REQ-505 — deterministic offline build with a source fingerprint.
      state.semanticIndex = buildIndex(items, new Date().toISOString());
      audit("index_build", { items: items.length, fingerprint: state.semanticIndex.fingerprint });
      return ok(`Indexed ${items.length} item(s); fingerprint ${state.semanticIndex.fingerprint.slice(0, 12)}.`);
    }
    case "index_status": {
      requireNotObserver();
      const novel = requireNovel();
      if (!state.semanticIndex) return ok("Index not built.");
      const current = fingerprintItems(gatherIndexSources(novel));
      const stale = current !== state.semanticIndex.fingerprint;
      return ok(`Index built at ${state.semanticIndex.built_at}; ${stale ? "STALE (sources changed)" : "current"}; ${state.semanticIndex.records.length} item(s).`);
    }
    case "index_list": {
      requireNotObserver();
      if (!state.semanticIndex) return ok("Index not built.");
      const allow = new Set(allowedScopesFor(getBadge()));
      const visible = state.semanticIndex.records.filter((r) => allow.has(r.scope)).map((r) => ({ id: r.id, type: r.type, scope: r.scope, cluster: r.cluster }));
      if (visible.length === 0) return ok("No indexed items.");
      return raw(JSON.stringify(visible, null, 2));
    }
    case "index_search": {
      requireNotObserver();
      if (!state.semanticIndex) return err("STATE_CONFLICT", "Index not built. Run manage_knowledge (action: index_build) first.");
      if (!args.query) return err("INVALID_INPUT", "query is required for index_search.");
      const limit = args.limit ?? 5;
      // REQ-509 — scope-filtered; REQ-506 — deterministic advisory ranking.
      const candidates = rank(args.query, state.semanticIndex, allowedScopesFor(getBadge()), limit);
      if (candidates.length === 0) return ok("No candidates.");
      return raw(JSON.stringify(candidates, null, 2));
    }
    case "index_relations": {
      requireNotObserver();
      if (!state.semanticIndex) return ok("Index not built.");
      const allow = new Set(allowedScopesFor(getBadge()));
      const idxScopes = new Map(state.semanticIndex.records.map((r) => [r.id, r.scope]));
      let rels = state.semanticIndex.relations.filter((rel) => allow.has(idxScopes.get(rel.a) ?? "game_master") && allow.has(idxScopes.get(rel.b) ?? "game_master"));
      if (args.item_id) rels = rels.filter((rel) => rel.a === args.item_id || rel.b === args.item_id);
      if (rels.length === 0) return ok("No relations.");
      return raw(JSON.stringify(rels, null, 2));
    }
    case "graph_build": {
      requireNotObserver();
      const novel = requireNovel();
      // REQ-510 — derived projection; REQ-513 — fingerprint for staleness.
      state.knowledgeGraph = projectGraph(gatherGraphSources(novel), new Date().toISOString());
      audit("graph_build", { nodes: state.knowledgeGraph.nodes.length, edges: state.knowledgeGraph.edges.length });
      return ok(`Projected ${state.knowledgeGraph.nodes.length} node(s), ${state.knowledgeGraph.edges.length} edge(s); fingerprint ${state.knowledgeGraph.fingerprint.slice(0, 12)}.`);
    }
    case "graph_status": {
      requireNotObserver();
      const novel = requireNovel();
      if (!state.knowledgeGraph) return ok("Graph not projected.");
      const stale = fingerprintGraph(gatherGraphSources(novel)) !== state.knowledgeGraph.fingerprint;
      return ok(`Graph built at ${state.knowledgeGraph.built_at}; ${stale ? "STALE (sources changed)" : "current"}.`);
    }
    case "graph_get": {
      requireNotObserver();
      if (!state.knowledgeGraph) return err("STATE_CONFLICT", "Graph not projected. Run manage_knowledge (action: graph_build) first.");
      // REQ-514 — scope-filtered read.
      return raw(JSON.stringify(visibleGraph(state.knowledgeGraph, scopes), null, 2));
    }
    case "graph_nodes": {
      requireNotObserver();
      if (!state.knowledgeGraph) return err("STATE_CONFLICT", "Graph not projected. Run manage_knowledge (action: graph_build) first.");
      const nodes = visibleGraph(state.knowledgeGraph, scopes).nodes;
      if (nodes.length === 0) return ok("No visible nodes.");
      return raw(JSON.stringify(nodes, null, 2));
    }
    case "graph_edges": {
      requireNotObserver();
      if (!state.knowledgeGraph) return err("STATE_CONFLICT", "Graph not projected. Run manage_knowledge (action: graph_build) first.");
      const edges = visibleGraph(state.knowledgeGraph, scopes).edges;
      if (edges.length === 0) return ok("No visible edges.");
      return raw(JSON.stringify(edges, null, 2));
    }
    case "graph_neighbors": {
      requireNotObserver();
      if (!state.knowledgeGraph) return err("STATE_CONFLICT", "Graph not projected. Run manage_knowledge (action: graph_build) first.");
      if (!args.node_id) return err("INVALID_INPUT", "node_id is required for graph_neighbors.");
      const ids = new Set(visibleGraph(state.knowledgeGraph, scopes).nodes.map((n) => n.id));
      if (!ids.has(args.node_id)) return err("NOT_FOUND", `Node '${args.node_id}' not found or not visible.`);
      const edges = state.knowledgeGraph.edges.filter((e) => (e.from === args.node_id || e.to === args.node_id) && ids.has(e.from) && ids.has(e.to));
      if (edges.length === 0) return ok("No neighbors.");
      return raw(JSON.stringify(edges, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown knowledge action '${args.action}'.`);
  }
});

// --- Durable Agent Tasks ---

// Durable Agent Tasks (REQ-522–REQ-530) — a persistent task/action lifecycle
// for NPCs and entities. Only admitted transitions are permitted; terminal
// tasks are immutable.
function requireTask(novel: NovelState, taskId: string | undefined): AgentTask | null {
  if (!taskId) return null;
  return novel.agent_tasks.find((t) => t.id === taskId) ?? null;
}

register("manage_agent", {
  title: "Agent Task Management",
  description: "Manage durable NPC/agent tasks and their action lifecycle. create reads goal and optional source_goal; advance requires task_id and appends description; complete, fail, and cancel require task_id, settle the task without deleting it, and terminal tasks are immutable; autonomy defaults to TTRPG_AGENT_AUTONOMY. Mutating actions persist to the Novel and are audited; list/get are read-only. Use when: creating, starting, advancing, settling, or inspecting tasks. Do NOT use when: surfacing an advisory suggestion — use manage_scene (action: oracle); managing NPC identity — use manage_npc. Revert with manage_history (action: undo).",
  inputSchema: {
    action: z.enum(["create", "list", "get", "start", "advance", "complete", "fail", "cancel"]).describe("create, list, get, start, advance, complete, fail, or cancel."),
    detail: z.boolean().optional().describe("Return full agent tasks instead of summary entries (list)."),
    subject: z.string().optional().describe("Entity or NPC that owns the task (create/list)."),
    goal: z.string().optional().describe("Task goal text (create)."),
    autonomy: z.enum(["advisory", "prompt", "auto"]).optional().describe("advisory, prompt, or auto (create; default the TTRPG_AGENT_AUTONOMY setting)."),
    source_goal: z.string().optional().describe("Originating goal-pursuit suggestion (create)."),
    task_id: z.string().optional().describe("Task id (get/start/advance/complete/fail/cancel)."),
    description: z.string().optional().describe("Action description (advance)."),
  },
}, async (args: any) => {
  switch (args.action) {
    case "list": {
      // REQ-530 — task reads are available to every badge, including Observer
      // (read-only; mutation remains GM-only).
      const novel = requireNovel();
      let tasks = novel.agent_tasks;
      if (args.subject) tasks = tasks.filter((t) => t.subject === args.subject);
      if (tasks.length === 0) return ok("No agent tasks.");
      if (wantsDetail(args.detail)) return raw(JSON.stringify(tasks, null, 2));
      return raw(JSON.stringify(summaryEntries("agent_task", tasks), null, 2));
    }
    case "get": {
      // REQ-530 — task reads are available to every badge, including Observer.
      const novel = requireNovel();
      const task = requireTask(novel, args.task_id);
      if (!task) return err("NOT_FOUND", `Agent task '${args.task_id ?? "none"}' not found.`);
      return raw(JSON.stringify(task, null, 2));
    }
    case "create": {
      requireGM();
      const novel = requireNovel();
      if (!args.subject || !args.goal) return err("INVALID_INPUT", "subject and goal are required for create.");
      const autonomy = (args.autonomy ?? process.env.TTRPG_AGENT_AUTONOMY ?? "prompt") as AgentAutonomy;
      if (!AUTONOMY_LEVELS.includes(autonomy)) return err("INVALID_INPUT", `Unknown autonomy '${autonomy}'.`);
      const now = new Date().toISOString();
      // REQ-522 — a new task starts queued. REQ-529 — may cite its originating goal suggestion.
      const task: AgentTask = { id: nextTaskId(novel.agent_tasks), subject: args.subject, goal: args.goal, status: "queued", autonomy, actions: [], source_goal: args.source_goal, created_at: now, updated_at: now };
      novel.agent_tasks.push(task);
      const cap = parseInt(process.env.TTRPG_AGENT_MAX_TASKS ?? "0", 10);
      if (cap > 0 && novel.agent_tasks.length > cap) novel.agent_tasks = novel.agent_tasks.slice(novel.agent_tasks.length - cap);
      state.saveNovel(novel);
      audit("agent_create", { task_id: task.id, subject: task.subject, autonomy });
      return ok(`Agent task ${task.id} queued for '${task.subject}'.`);
    }
    case "start":
    case "complete":
    case "fail":
    case "cancel": {
      requireGM();
      const novel = requireNovel();
      const task = requireTask(novel, args.task_id);
      if (!task) return err("NOT_FOUND", `Agent task '${args.task_id ?? "none"}' not found.`);
      const target: AgentTaskStatus = args.action === "start" ? "active" : args.action === "complete" ? "done" : args.action === "fail" ? "failed" : "cancelled";
      // REQ-524 — refused when the transition is not admitted.
      if (!agentTransition(task, target, new Date().toISOString())) {
        return err("STATE_CONFLICT", `Task ${task.id} cannot move from '${task.status}' to '${target}'.`);
      }
      state.saveNovel(novel);
      audit("agent_transition", { task_id: task.id, status: task.status });
      return ok(`Agent task ${task.id}: ${task.status}.`);
    }
    case "advance": {
      requireGM();
      const novel = requireNovel();
      const task = requireTask(novel, args.task_id);
      if (!task) return err("NOT_FOUND", `Agent task '${args.task_id ?? "none"}' not found.`);
      if (!args.description) return err("INVALID_INPUT", "description is required for advance.");
      // REQ-528 — terminal tasks are immutable.
      if (!isMutable(task)) return err("STATE_CONFLICT", `Task ${task.id} is ${task.status} and cannot advance.`);
      if (task.status !== "active") return err("STATE_CONFLICT", `Task ${task.id} must be active to advance.`);
      const action = recordAction(task, args.description, new Date().toISOString());
      state.saveNovel(novel);
      audit("agent_advance", { task_id: task.id, seq: action.seq });
      return ok(`Agent task ${task.id} action #${action.seq} recorded.`);
    }
    default:
      return err("INVALID_INPUT", `Unknown agent action '${args.action}'.`);
  }
});

// --- Perception Ledger ---

// Perception Ledger (REQ-540–REQ-545) — append-only per-entity record of what
// an entity perceived. Perception is the observed layer, distinct from belief;
// it feeds evidence but is not itself belief.
// REQ-540–REQ-545 — Perception Ledger, exposed as manage_belief
// (action: perception_record / perception_list / perception_for_entity /
// perception_for_event). Absorbed under REQ-429 surface consolidation.
const handlePerceptionActions = async (args: any) => {
  switch (args.action) {
    case "record": {
      requireGM();
      const novel = requireNovel();
      if (!args.entity_id || !args.summary) return err("INVALID_INPUT", "entity_id and summary are required for record.");
      const kind = (args.kind ?? "observation") as PerceptionKind;
      if (!PERCEPTION_KINDS.includes(kind)) return err("INVALID_INPUT", `Unknown kind '${kind}'.`);
      // REQ-540/REQ-543 — record with event provenance.
      const record: PerceptionRecord = {
        id: nextPerceptionId(novel.perception_ledger),
        entity_id: args.entity_id,
        event_ordinal: args.event_ordinal !== undefined ? args.event_ordinal : (novel.event_log.length ? novel.event_log[novel.event_log.length - 1].ordinal : null),
        kind,
        summary: args.summary,
        at: new Date().toISOString(),
        witness: args.witness ?? "inferred",
        sense: args.sense ?? null,
        source_entity: args.source_entity ?? null,
        room_id: args.room_id ?? novel.entities.get(args.entity_id)?.current_room ?? null,
        confidence: typeof args.confidence === "number" ? Math.max(0, Math.min(1, args.confidence)) : 0,
      };
      novel.perception_ledger.push(record);
      const cap = parseInt(process.env.TTRPG_PERCEPTION_MAX_ENTRIES ?? "20000", 10);
      if (cap > 0 && novel.perception_ledger.length > cap) novel.perception_ledger = novel.perception_ledger.slice(novel.perception_ledger.length - cap);
      state.saveNovel(novel);
      audit("perception_record", { entity_id: record.entity_id, kind: record.kind, ordinal: record.event_ordinal });
      return ok(`Perception ${record.id} recorded for '${record.entity_id}'.`);
    }
    case "list": {
      requireNotObserver();
      const novel = requireNovel();
      const badge = getBadge();
      // REQ-545 — a Player sees only the active entity's perceptions.
      const records = badge === "player" ? novel.perception_ledger.filter((r) => r.entity_id === novel.active_entity_id) : novel.perception_ledger;
      if (records.length === 0) return ok("No perceptions recorded.");
      return raw(JSON.stringify(records, null, 2));
    }
    case "for_entity": {
      requireNotObserver();
      const novel = requireNovel();
      if (!args.entity_id) return err("INVALID_INPUT", "entity_id is required for for_entity.");
      if (getBadge() === "player" && args.entity_id !== novel.active_entity_id) {
        return err("FORBIDDEN", "Player badge reads only the active entity's perceptions.");
      }
      const records = novel.perception_ledger.filter((r) => r.entity_id === args.entity_id);
      if (records.length === 0) return ok(`No perceptions for '${args.entity_id}'.`);
      return raw(JSON.stringify(records, null, 2));
    }
    case "for_event": {
      requireNotObserver();
      const novel = requireNovel();
      if (args.event_ordinal === undefined) return err("INVALID_INPUT", "event_ordinal is required for for_event.");
      const records = novel.perception_ledger.filter((r) => r.event_ordinal === args.event_ordinal);
      if (records.length === 0) return ok(`No perceptions for event #${args.event_ordinal}.`);
      return raw(JSON.stringify(records, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown perception action '${args.action}'.`);
  }
};

// --- Subjective Memory ---

// Subjective Memory (REQ-623–REQ-628) — append-only per-entity record of what a
// character remembers, bound to an event-log ordinal. It is GM-authored and
// GM-only in this increment; it never rewrites the event log, belief, or the
// perception ledger.
// REQ-623, REQ-624, REQ-625, REQ-626, REQ-627, REQ-628
// REQ-624 — resolve a memory owner by id or name so a typo cannot create an
// orphan record that no Player or Game Master surface will ever select.
function resolveMemoryEntity(novel: NovelState, token: string): string | null {
  const t = normalizeToken(token);
  if (!t) return null;
  for (const [id, entity] of novel.entities ?? new Map()) {
    if (normalizeToken(id) === t || normalizeToken(entity?.name ?? "") === t) return id;
  }
  for (const [id, npc] of novel.npcs ?? new Map()) {
    if (normalizeToken(id) === t || normalizeToken(npc?.name ?? "") === t) return id;
  }
  return null;
}

const handleSubjectiveActions = async (args: any) => {
  const gmRead = () => {
    const badge = getBadge();
    return badge === "game_master" || badge === "none";
  };
  switch (args.action) {
    case "record": {
      requireGM();
      const novel = requireNovel();
      // REQ-624 — entity, gist, and the claim triple are required.
      if (!args.entity || !args.gist || !args.subject || !args.predicate || !args.object) {
        return err("INVALID_INPUT", "entity, gist, subject, predicate, and object are required for subjective_record.");
      }
      const entityId = resolveMemoryEntity(novel, args.entity);
      if (!entityId) {
        return err("INVALID_INPUT", `No entity or NPC named '${args.entity}'. Use manage_character (action: roster_list) or manage_npc (action: list).`);
      }
      if (args.event_ordinal !== undefined && (!Number.isInteger(args.event_ordinal) || args.event_ordinal < 0)) {
        return err("INVALID_INPUT", "event_ordinal must be a non-negative integer.");
      }
      const origin = (args.origin ?? "authored") as MemoryOrigin;
      if (!MEMORY_ORIGINS.includes(origin)) {
        return err("INVALID_INPUT", `Unknown origin '${origin}'. Valid origins: ${MEMORY_ORIGINS.join(", ")}.`);
      }
      const polarity = args.polarity ?? "positive";
      if (polarity !== "positive" && polarity !== "negative") {
        return err("INVALID_INPUT", `Unknown polarity '${polarity}'. Valid polarities: positive, negative.`);
      }
      // REQ-624 — the disclosure level defaults to secret and rejects an
      // unknown value.
      const disclosure = (args.disclosure ?? "secret") as MemoryDisclosure;
      if (!MEMORY_DISCLOSURES.includes(disclosure)) {
        return err("INVALID_INPUT", `Unknown disclosure '${disclosure}'. Valid levels: ${MEMORY_DISCLOSURES.join(", ")}.`);
      }
      const latest = novel.event_log.length ? novel.event_log[novel.event_log.length - 1].ordinal : null;
      const ordinal = args.event_ordinal !== undefined ? args.event_ordinal : latest;
      // REQ-624 — a memory may not cite an event the Novel has not recorded.
      if (ordinal !== null && latest !== null && ordinal > latest) {
        return err("INVALID_INPUT", `Event ordinal ${ordinal} exceeds the latest event ${latest}.`);
      }
      // REQ-623 — the record holds what the entity remembers, never state.
      const record: SubjectiveMemoryRecord = {
        id: nextSubjectiveId(novel.subjective_memory),
        entity_id: entityId,
        event_ordinal: ordinal ?? null,
        gist: args.gist,
        claim: { subject: args.subject, predicate: args.predicate, object: args.object, polarity },
        felt_then: args.felt_then ?? "",
        salience: typeof args.salience === "number" ? Math.max(0, Math.min(1, args.salience)) : 0.5,
        origin,
        disclosure,
        at: new Date().toISOString(),
      };
      novel.subjective_memory.push(record);
      // REQ-647 — per-entity retention, lowest score first, folding each
      // evicted record into the entity's consolidation summary before removal.
      const scoreInputs = memoryScoreInputs(novel);
      const consolidationMax = configInt("TTRPG_SUBJECTIVE_MEMORY_CONSOLIDATION_MAX", 2000);
      const ladder = novel.compression_ladder ?? (novel.compression_ladder = { version: 1, arc: [], campaign: null });
      const foldEntity = (entityId: string, evict: SubjectiveMemoryRecord[]) => {
        if (evict.length === 0) return;
        ladder.entities = ladder.entities ?? {};
        ladder.entities[entityId] = foldIntoSummary(ladder.entities[entityId], evict, consolidationMax);
        const ids = new Set(evict.map((r) => r.id));
        novel.subjective_memory = novel.subjective_memory.filter((r) => !ids.has(r.id));
      };
      const perEntity = configInt("TTRPG_SUBJECTIVE_MEMORY_PER_ENTITY_MAX", 500);
      if (perEntity > 0) {
        const own = novel.subjective_memory.filter((r) => r.entity_id === record.entity_id);
        foldEntity(record.entity_id, selectForEviction(own, perEntity, scoreInputs));
      }
      // REQ-627 — the global cap stays the outer storage bound (oldest-first),
      // but it folds through the same helper so neither bound loses a gist.
      const cap = configInt("TTRPG_SUBJECTIVE_MEMORY_MAX_ENTRIES", 20000);
      if (cap > 0 && novel.subjective_memory.length > cap) {
        const overflow = novel.subjective_memory.slice(0, novel.subjective_memory.length - cap);
        const byEntity = new Map<string, SubjectiveMemoryRecord[]>();
        for (const r of overflow) byEntity.set(r.entity_id, [...(byEntity.get(r.entity_id) ?? []), r]);
        for (const [entityId, evict] of byEntity) foldEntity(entityId, evict);
      }
      state.saveNovel(novel);
      audit("subjective_record", { entity_id: record.entity_id, ordinal: record.event_ordinal, origin: record.origin, disclosure: record.disclosure });
      return ok(`Memory ${record.id} recorded for '${record.entity_id}'.`);
    }
    case "recall": {
      // REQ-654 — an explicit GM recall appends one reinforcement entry; the
      // ledger is append-only and the render path never writes it.
      requireGM();
      const novel = requireNovel();
      const recordId = args.record_id;
      if (typeof recordId !== "string" || recordId.length === 0) {
        return err("INVALID_INPUT", "record_id is required for subjective_recall.");
      }
      const record = novel.subjective_memory.find((r) => r.id === recordId);
      if (!record) return err("NOT_FOUND", `No subjective memory with id '${recordId}'.`);
      const latest = novel.event_log.length ? novel.event_log[novel.event_log.length - 1].ordinal : 0;
      const entry: ReinforcementEntry = {
        id: nextReinforcementId(novel.subjective_reinforcement ?? []),
        record_id: recordId,
        event_ordinal: latest,
        at: new Date().toISOString(),
      };
      novel.subjective_reinforcement = [...(novel.subjective_reinforcement ?? []), entry];
      const ledgerCap = configInt("TTRPG_SUBJECTIVE_MEMORY_REINFORCEMENT_LEDGER_MAX", 5000);
      if (ledgerCap > 0 && novel.subjective_reinforcement.length > ledgerCap) {
        novel.subjective_reinforcement = novel.subjective_reinforcement.slice(novel.subjective_reinforcement.length - ledgerCap);
      }
      state.saveNovel(novel);
      audit("subjective_recall", { record_id: recordId, ordinal: entry.event_ordinal });
      return ok(`Memory ${recordId} reinforced at ordinal ${entry.event_ordinal}.`);
    }
    case "list": {
      // REQ-625 — the Game Master reads every record; the Player reads the
      // active entity's non-secret records; the Observer is refused.
      const badge = getBadge();
      if (badge !== "game_master" && badge !== "none" && badge !== "player") {
        return err("FORBIDDEN", "Subjective memory is not available under the Observer badge.", "Switch badges with `set_badge` to read subjective memory.");
      }
      const novel = requireNovel();
      let records = novel.subjective_memory;
      if (badge === "player") {
        const activeId = state.getActiveEntity()?.id;
        if (!activeId) {
          return err("STATE_CONFLICT", "No active entity is set.", "Set an active entity with manage_character (action: set_active).");
        }
        if (args.entity && args.entity !== activeId) {
          return err("FORBIDDEN", "A Player badge may read only the active entity's memories.", "Request the active entity with manage_belief (action: subjective_list).");
        }
        records = records.filter((r) => r.entity_id === activeId && r.disclosure !== "secret");
      } else if (args.entity) {
        records = records.filter((r) => r.entity_id === args.entity);
      }
      if (args.event_ordinal !== undefined) records = records.filter((r) => r.event_ordinal === args.event_ordinal);
      if (badge === "player") {
        records = records
          .map((r) => playerProjection(r))
          .filter((r): r is SubjectiveMemoryRecord => r !== null);
      }
      if (records.length === 0) return ok("No subjective memories recorded.");
      // REQ-646 — a derived event state beside each record; the record itself is
      // never rewritten and the event log's retained horizon decides the value.
      const retained = new Set((novel.event_log ?? []).map((e) => e.ordinal));
      const rows = records.map((r) => ({ ...r, event_state: eventState(r.event_ordinal, retained) }));
      return raw(JSON.stringify(rows, null, 2));
    }
    case "disclose": {
      // REQ-635 — reclassify one record without touching what it holds. The
      // array is append-only; a level change is a visibility edit, not a
      // rewrite of the memory.
      requireGM();
      const novel = requireNovel();
      const recordId = args.record_id;
      const disclosure = args.disclosure as MemoryDisclosure | undefined;
      if (typeof recordId !== "string" || recordId.length === 0) {
        return err("INVALID_INPUT", "record_id is required for subjective_disclose.");
      }
      if (!disclosure || !MEMORY_DISCLOSURES.includes(disclosure)) {
        return err("INVALID_INPUT", `Unknown disclosure '${disclosure ?? ""}'. Valid levels: ${MEMORY_DISCLOSURES.join(", ")}.`);
      }
      const record = novel.subjective_memory.find((r) => r.id === recordId);
      if (!record) return err("NOT_FOUND", `No subjective memory with id '${recordId}'.`);
      const previous = record.disclosure;
      record.disclosure = disclosure;
      state.saveNovel(novel);
      audit("subjective_disclose", { record_id: recordId, from: previous, to: disclosure });
      return ok(`Memory ${recordId} now reads as ${disclosure}.`);
    }
    case "verify": {
      // REQ-631 — the GM truth view: each record beside the recorded fact that
      // decides it. Read-only; never appends an event or an audit entry.
      if (!gmRead()) return err("FORBIDDEN", "Subjective memory is Game Master only.");
      const novel = requireNovel();
      let records = novel.subjective_memory;
      if (args.entity) records = records.filter((r) => r.entity_id === args.entity);
      if (args.event_ordinal !== undefined) records = records.filter((r) => r.event_ordinal === args.event_ordinal);
      if (records.length === 0) return ok("No subjective memories recorded.");
      const facts = projectTruthFacts(novel);
      const alias = buildAliases(novel);
      const windows = deriveValidityWindows(novel.subjective_memory ?? []);
      const scoreInputs = memoryScoreInputs(novel);
      const results = records.map((record: SubjectiveMemoryRecord) => {
        const result: DivergenceResult = windowAwareVerdict(novel, record, checkRecord(record, facts, novel, alias), windows);
        const parts = scoreMemoryParts(record, scoreInputs);
        const reinforcementCount = (novel.subjective_reinforcement ?? []).filter((e) => e.record_id === record.id).length;
        return {
          record_id: record.id,
          entity_id: record.entity_id,
          event_ordinal: record.event_ordinal,
          gist: record.gist,
          claim: record.claim,
          disclosure: record.disclosure,
          validity: windows.get(record.id) ?? { valid_from: record.event_ordinal, valid_until: null },
          score: { ...parts, total: parts.salience + parts.recency + parts.origin + parts.reinforcement },
          reinforcement_count: reinforcementCount,
          verdict: result.verdict,
          reason: result.reason,
          truth: result.truth,
        };
      });
      return raw(JSON.stringify(results, null, 2));
    }
    default:
      return err("INVALID_INPUT", `Unknown subjective action '${args.action}'.`);
  }
};
  return { identityFor, handleCausalActions, handleCorpusActions, gatherIndexSources, gatherGraphSources };
}
