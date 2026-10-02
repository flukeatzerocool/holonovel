// eval-oracle.ts — pure oracle predicates shared by the Holosuite tiers.
//
// Re-exports the playtest measurement layer so the deterministic and
// stochastic tiers classify envelopes, fingerprints, and vitals by one
// definition, and adds the mechanical invariant predicates the model-based
// tier asserts. No I/O. Exit codes: n/a (library).
//
// REQ citations: none — informational evaluation-harness support.

import { classifyResult, stateFingerprint } from "./playtest-lib.js";

export {
  DEFECT_PREFIXES,
  DENIAL_PREFIXES,
  prefix,
  errorClass,
  classifyResult,
  stateFingerprint,
  pcAlive,
  anchorPresent,
  roomSet,
  entityCounts,
} from "./playtest-lib.js";

export interface InvariantResult {
  name: string;
  ok: boolean;
  detail: string;
}

/** A read-only action must leave the mechanical state fingerprint unchanged. */
export function fingerprintStable(before: string, after: string, name = "read_only_no_mutation"): InvariantResult {
  return {
    name,
    ok: before === after,
    detail: before === after ? "fingerprint unchanged" : `${before.slice(0, 8)} -> ${after.slice(0, 8)}`,
  };
}

/** A mutating action must change the mechanical state fingerprint. */
export function fingerprintChanged(before: string, after: string, name = "mutation_observed"): InvariantResult {
  return {
    name,
    ok: before !== after,
    detail: before !== after ? "fingerprint changed" : "fingerprint unchanged after a mutating action",
  };
}

/** Every tool result must carry a recognized envelope prefix, never `[?]`. */
export function envelopeRecognized(text: string, isError: boolean | undefined, name = "envelope_recognized"): InvariantResult {
  const r = classifyResult(text, isError);
  const recognized = r.prefix !== "[?]";
  return { name, ok: recognized, detail: recognized ? r.prefix : text.slice(0, 80) };
}

/** A gated call must return an expected denial, not a generic defect. */
export function isDenial(text: string, isError: boolean | undefined, name = "gating_refusal_is_denial"): InvariantResult {
  const r = classifyResult(text, isError);
  return { name, ok: r.error_class === "denial", detail: `${r.prefix} (${r.error_class})` };
}

/** Sorted inventory item names for an entity, tolerating string or object items. */
export function inventoryNames(novel: unknown, entityId: string): string[] {
  const entities = (novel as { entities?: Record<string, { inventory?: unknown[] }> })?.entities ?? {};
  const inv = entities[entityId]?.inventory ?? [];
  return inv.map((i) => String((i as { name?: unknown })?.name ?? i)).sort();
}

/** Convenience: fingerprint a Novel document. */
export function fingerprintOf(novel: unknown): string {
  return stateFingerprint(novel);
}
