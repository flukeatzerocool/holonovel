// spec-update.ts — helpers for the DECISIONS.md Spec Update record.
//
// Shared by spec-update-record.ts (the --check gate) and its self-tests, so the
// "verification line was never filled" predicate has one implementation. The
// fingerprint-delta renderer is shared with update-server.ts, which emits the
// record the generator consumes (REQ-313a, REQ-314b).

import type { Fingerprints } from "./fingerprints.js";

const PLACEHOLDER = /^_?fill after running the gates/i;

export function isPlaceholderVerification(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed === "") return true;
  return PLACEHOLDER.test(trimmed);
}

function entrySlice(decisions: string, start: number): string {
  const rest = decisions.slice(start);
  const next = rest.indexOf("\n### ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

// The entry for the current hash (via its @spec-update marker), falling back to
// today's heading when a hand-edited entry lacks the marker.
export function entryFor(decisions: string, specHash: string, today: string): string | null {
  const marker = decisions.indexOf(`@spec-update:${specHash}`);
  if (marker !== -1) {
    const before = decisions.slice(0, marker);
    const heading = before.lastIndexOf("### Holonovel Spec Update — ");
    return heading === -1 ? null : entrySlice(decisions, heading);
  }
  const heading = decisions.indexOf(`### Holonovel Spec Update — ${today}`);
  return heading === -1 ? null : entrySlice(decisions, heading);
}

export function verificationLine(entry: string): string | null {
  const match = entry.match(/^\s*-\s+\*\*Verification:\*\*\s*(.*)$/m);
  return match ? match[1] : null;
}

export function hasUnfilledVerification(decisions: string, specHash: string, today: string): boolean {
  const entry = entryFor(decisions, specHash, today);
  if (entry === null) return false;
  const line = verificationLine(entry);
  return line === null || isPlaceholderVerification(line);
}

// REQ-394a — one disposition per REQ the delta changed. `implemented` is
// derived from committed evidence (the coverage register) or authored by the
// operator; `deferred` and `waived` are operator judgements. The table is
// rendered into the dated DECISIONS.md Spec Update entry (REQ-313a/REQ-314b).
export type ReqDispositionKind = "implemented" | "deferred" | "waived";

export interface ReqDisposition {
  req: string;
  disposition: ReqDispositionKind;
  evidence: string;
}

// REQ-313a / REQ-314b — the per-run fingerprint delta emitted by
// update-server.ts and rendered into the dated DECISIONS.md Spec Update entry.
export interface FingerprintDelta {
  spec_hash: string;
  prior_spec_hash: string | null;
  changed: string[];
  unchanged: string[];
  changed_count: number;
  scoping: "full" | "partial" | "scoped" | "none" | "seed";
  deferred: boolean;
  // REQ-394a — the reconciliation record. Empty when no fingerprint advanced
  // (nothing to disposition) or when the record is incomplete and publication
  // was blocked; `deferred` marks the dated-deferral channel.
  dispositions: ReqDisposition[];
  reused: string[];
  current: Fingerprints;
  prior: Fingerprints | null;
}

const DELTA_BULLET = /^\s*-\s+\*\*Fingerprint delta:\*\*/m;

export function hasFingerprintDelta(entry: string): boolean {
  return DELTA_BULLET.test(entry);
}

// The 2026-10-25 publication predates the delta record. Its prior component
// hashes were overwritten by the next reconcile and cannot be reconstructed, so
// its entry cannot carry a truthful delta line; it is exempt from the --check
// gate. No other hash may be added here without an equivalent justification.
const LEGACY_DELTA_EXEMPT = new Set([
  "f4bc3d04d34a9629b7d13d5e56194a044e5eb51ccb8c6ec66a3cb612f0697e69",
]);

export function isLegacyDeltaExempt(specHash: string): boolean {
  return LEGACY_DELTA_EXEMPT.has(specHash);
}

function componentList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "none";
}

// REQ-394a — the evidence kind replaces the retired invocation claim: this model
// has no agent subprocess to report, only a reconciliation record or a deferral.
function evidenceKind(record: FingerprintDelta): string {
  if (record.deferred) return "dated operator deferral";
  if (record.dispositions.length > 0) return `reconciliation record (${record.dispositions.length} changed REQ)`;
  if (record.scoping === "seed") return "baseline seed";
  return "no fingerprint advanced";
}

// Evidence cells cite the register bucket, never a test ID: a Manual T-ID
// appearing anywhere in DECISIONS.md satisfies REQ evidence linkage, so the
// table would vouch for itself (REQ-321d).
export function renderFingerprintDelta(record: FingerprintDelta): string {
  const prior = record.prior_spec_hash ? record.prior_spec_hash.slice(0, 8) : "none";
  const bullet = `- **Fingerprint delta:** ${record.scoping} — changed: ${componentList(record.changed)}; unchanged: ${componentList(record.unchanged)}; reused: ${componentList(record.reused)}; evidence: ${evidenceKind(record)}. Prior spec ${prior} → current ${record.spec_hash.slice(0, 8)}.`;
  if (record.dispositions.length === 0) return bullet;
  const rows = record.dispositions.map((row) => `| ${row.req} | ${row.disposition} | ${row.evidence} |`);
  return [bullet, "", "| REQ | Disposition | Evidence |", "|---|---|---|", ...rows].join("\n");
}
