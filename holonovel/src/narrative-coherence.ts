// narrative-coherence.ts — REQ-346b disposition derivation.
//
// The `spec_health.narrative_coherence` disposition is derived, not asserted:
// §5.12's bodies come from the shipped spec at runtime, and the attested set
// comes from the generated attestation data (coverage register at build time).
// A side-effect-free module so the harness can exercise the rule without
// starting a server.

export type CoherenceDisposition = "pass" | "partial" | "fail";
export type AttestationState = "recorded" | "stale" | "missing";

export interface Section512Req {
  id: string;
  parent: string;
  builderSide: boolean;
}

export interface NarrativeCoherenceReport {
  implemented: number;
  total: number;
  disposition: CoherenceDisposition;
  reqs: string[];
  missing: string[];
  attestation: AttestationState;
}

// A builder-side body obliges the builder or defines a handoff defect
// (REQ-346a1/a2); it is recorded by the attestation rather than satisfied by
// the server runtime.
const BUILDER_SIDE = /\bthe builder SHALL\b|\bhandoff defect\b/;
export function parseSection512(specText: string): Section512Req[] {
  const start = specText.indexOf("\n### 5.12 ");
  if (start === -1) return [];
  const end = specText.indexOf("\n### ", start + 1);
  const slice = specText.slice(start, end === -1 ? undefined : end);
  const headers = [...slice.matchAll(/^\*\*(REQ-\d+[a-z0-9]*)\s+—/gm)];
  return headers.map((match, index) => {
    const id = match[1]!;
    const bodyStart = match.index! + match[0].length;
    const bodyEnd = index + 1 < headers.length ? headers[index + 1]!.index! : slice.length;
    const text = slice.slice(bodyStart, bodyEnd);
    return { id, parent: id.match(/^REQ-\d+/)![0], builderSide: BUILDER_SIDE.test(text) };
  });
}

// REQ-346b: pass requires every server-side §5.12 REQ implemented AND the
// attestation recorded; partial requires at least one implemented; fail
// otherwise. A stale attestation (the shipped spec is not the one the
// attestation was generated from) cannot reach pass.
export function narrativeCoherence(
  reqs: readonly Section512Req[],
  attestedParents: readonly string[],
  opts: { recorded: boolean; specCurrent: boolean },
): NarrativeCoherenceReport {
  const attested = new Set(attestedParents);
  const server = reqs.filter((req) => !req.builderSide);
  const implementedIds = server.filter((req) => attested.has(req.parent)).map((req) => req.id);
  const missing = server.filter((req) => !attested.has(req.parent)).map((req) => req.id);
  const attestation: AttestationState = !opts.recorded ? "missing" : opts.specCurrent ? "recorded" : "stale";
  const total = server.length;
  const implemented = implementedIds.length;
  const disposition: CoherenceDisposition =
    total === 0 ? "fail"
      : implemented === total && attestation === "recorded" ? "pass"
        : implemented > 0 ? "partial"
          : "fail";
  return { implemented, total, disposition, reqs: implementedIds, missing, attestation };
}
