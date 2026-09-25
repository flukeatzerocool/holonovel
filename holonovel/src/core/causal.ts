// Causal Transition Validation — decides whether a proposed objective-state
// transition can coexist with the committed history of one scope, preserving
// every proposal (admitted or not) as auditable evidence.
// REQ-484, REQ-485, REQ-486, REQ-487, REQ-488, REQ-489, REQ-490, REQ-491,
// REQ-492, REQ-493, REQ-494, REQ-495

export type AdmissionDecision =
  | "admitted"
  | "admitted_with_latent_transition"
  | "rejected_impossible"
  | "conflict"
  | "underdetermined"
  | "fork_required"
  | "epistemic_only";

export type CausalDomain = "location" | "scalar";
export type OriginSource = "narrative" | "machine" | "ruleset";

export type CausalValue = string | number | boolean | null;

// REQ-484 — a proposal is recorded before it is applied; it is not truth until admitted.
export interface TransitionProposal {
  id: string;
  scope: string;
  domain: CausalDomain;
  entity: string;
  key: string;
  value: CausalValue;
  from?: CausalValue;
  expected_version?: number;
  origin_source: OriginSource;
  source_ordinal: number | null;
  at: string;
}

// REQ-491 — refused proposals remain in the ledger as auditable evidence.
export interface TransitionRecord extends TransitionProposal {
  decision: AdmissionDecision;
  reason: string;
}

// REQ-486/REQ-487 — the admitted value at a scope coordinate.
export interface CausalSlot {
  scope: string;
  domain: CausalDomain;
  entity: string;
  key: string;
  value: CausalValue;
  version: number;
  at: string;
}

export interface CausalOptions {
  scope: string;
  latentTransitions: boolean;
}

export function slotKey(s: { scope: string; domain: CausalDomain; entity: string; key: string }): string {
  return `${s.scope}|${s.domain}|${s.entity}|${s.key}`;
}

export function findSlot(slots: CausalSlot[], p: TransitionProposal): CausalSlot | undefined {
  const k = slotKey(p);
  return slots.find((s) => slotKey(s) === k);
}

// REQ-485 — the admission decision; REQ-486–REQ-490 set the outcome.
export function evaluate(p: TransitionProposal, slots: CausalSlot[], opts: CausalOptions): { decision: AdmissionDecision; reason: string } {
  // REQ-488 — a proposal must co-reside on the active scope coordinate.
  if (!p.scope) return { decision: "rejected_impossible", reason: "missing scope coordinate" };
  if (p.scope !== opts.scope) {
    return { decision: "rejected_impossible", reason: `scope coordinate mismatch: '${p.scope}' is not the active scope '${opts.scope}'` };
  }
  const slot = findSlot(slots, p);
  if (!slot) return { decision: "admitted", reason: "first write at this coordinate" };

  // REQ-489 — optimistic version guard.
  if (p.expected_version !== undefined && p.expected_version !== slot.version) {
    return { decision: "conflict", reason: `stale expected version ${p.expected_version} (current ${slot.version})` };
  }
  // REQ-489 — idempotent when the value is unchanged.
  if (slot.value === p.value) return { decision: "admitted", reason: "idempotent — value unchanged" };

  // REQ-486 — an incompatible prior value is a conflict unless a latent transition is allowed.
  if (p.from !== undefined && p.from !== slot.value) {
    return opts.latentTransitions
      ? { decision: "admitted_with_latent_transition", reason: "incompatible prior value; latent transition admitted" }
      : { decision: "conflict", reason: "incompatible prior value" };
  }
  // REQ-487 — ordered scalar state admits a later value, refuses an incompatible one.
  if (p.domain === "scalar" && typeof slot.value === "number" && typeof p.value === "number") {
    return p.value >= slot.value
      ? { decision: "admitted", reason: "ordered scalar advance" }
      : { decision: "conflict", reason: "concurrent incompatible scalar value" };
  }
  // A continuous transition (from matches) is admitted; an unconstrained write is not.
  if (p.from !== undefined && p.from === slot.value) {
    return { decision: "admitted", reason: "continuous transition from prior value" };
  }
  return opts.latentTransitions
    ? { decision: "admitted_with_latent_transition", reason: "unconstrained incompatible write; latent transition admitted" }
    : { decision: "conflict", reason: "unconstrained incompatible write" };
}

// REQ-489 — apply an admitted value; returns false (no version bump) when idempotent.
export function applySlot(slots: CausalSlot[], p: TransitionProposal, at: string): boolean {
  const idx = slots.findIndex((s) => slotKey(s) === slotKey(p));
  if (idx === -1) {
    slots.push({ scope: p.scope, domain: p.domain, entity: p.entity, key: p.key, value: p.value, version: 1, at });
    return true;
  }
  if (slots[idx].value === p.value) return false;
  slots[idx] = { ...slots[idx], value: p.value, version: slots[idx].version + 1, at };
  return true;
}

export function nextProposalId(ledger: TransitionRecord[]): string {
  let max = 0;
  for (const r of ledger) {
    const m = r.id.match(/^tp-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `tp-${max + 1}`;
}

// REQ-490 — a latent transition is provisional: it is applied but flagged.
export function isProvisional(decision: AdmissionDecision): boolean {
  return decision === "admitted_with_latent_transition";
}

// REQ-492 — the causal layer never writes epistemic or identity state. This
// module has no access to those stores; the firewall is structural.
export const CAUSAL_DOMAINS: CausalDomain[] = ["location", "scalar"];
