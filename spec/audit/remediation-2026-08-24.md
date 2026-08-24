# REQ Coverage Remediation Plan — 2026-08-24

Generated from `scripts/validate.ts` implementation-coverage audit (`npm run validate -- --write-register`).
Register: `spec/audit/req-coverage.md`. Baseline: 381 base REQs → **281 A (gap), 80 B (review), 20 C (evidenced), 0 D (spec-side)**.

## What the audit measures

A REQ's status is mechanical: `holonovel/src` citation (source) × exercised
spec test (Appendix F / §6.6). It is an **absence register**, not a correctness
certificate. A citation is a weak signal (presence of a comment, not verified
behavior); its *absence* is a strong signal (uncited = unimplemented or
unattributed). Two distinct causes produce a gap, and they demand different
remediation:

1. **Builder/verifier-side REQ** — the contract is owed by the build pipeline
   (extraction, confidence, conversion, multi-ruleset build), not the running
   server. Correctly absent from `holonovel/src`; a server citation would be
   wrong. *No code change; the register is simply annotating ownership.*
2. **Server-runtime REQ** — the contract is owed by the shipped server but no
   source file cites it. Either the feature is missing or it was built without
   attribution. *Investigate and either implement or cite.*

## Findings, grouped

### Finding 1 — §5.12 Narrative Architecture is entirely uncited (32/32 REQs)

REQ-335 through REQ-366 (scene-beat taxonomy, dramatic pacing, narrative arc,
faction autonomous advancement, NPC goal pursuit, unified intent resolution,
secret/faction/vow/countdown/lore/relationship **coupling contracts**, observer
narrative surface) — **not a single one is cited in `holonovel/src`.**

This is the headline gap. The neighboring subsystems these couplings bind
(factions REQ-233, secrets REQ-234, relationships REQ-236, story journal,
countdowns REQ-073, lore REQ-083, vows, codex REQ-321) *are* cited and present.
The narrative-architecture layer that consumes them is not. Disposition: the
server does not currently implement the §5.12 layer — a **real implementation
gap**, not a citation gap. This also means the G7 narrative-coherence
attestation (REQ-346a1) **cannot pass as of this baseline** and must not be
recorded as passing.

*Remediation:* a dedicated implementation effort (Phase 4+), scoped by §5.12
in sequence, each REQ landing with a harness assertion. Not achievable as one
change; the register + this plan are the tracking surface.

### Finding 2 — Builder/verifier-side REQs incorrectly flagged as gaps

Sections §5.2 (Extraction and Confidence), §5.14 (Content Sources), §5.16
(Multi-Ruleset Build), §5.17/§5.18 (Ruleset Packages / Workflow Entry Points),
and the build-tooling subset of §5.3 (REQ-011 confidence, REQ-099/147
confidence floor, REQ-102 conversion, REQ-161–164 build modes, REQ-187 spec
hash, REQ-278 phase-map, REQ-107a/107b version coordination) are **owed by the
build pipeline, not the server**. Their absence from `holonovel/src` is
correct. *No action beyond recording ownership* — they are the subject of the
spec-side build tools, not this server.

### Finding 3 — Server-runtime REQs with a citation gap (false GAP → should cite)

Several §5.1/§5.3/§5.6–§5.8 REQs appear A (gap) but their behavior demonstrably
exists in `holonovel/src` — the code just lacks the REQ citation:

- REQ-002 Error taxonomy (`[ERROR] [NOT_FOUND]` etc. throughout `index.ts`)
- REQ-004 Truncation (`output://` pointer)
- REQ-050 Determinism (`core/rng.ts` cites REQ-050 already; sub-parts uncited)
- REQ-055 Durability/resume (state survive-restart paths)
- REQ-058 Tool-result fidelity, REQ-060 Verbose output, REQ-061 Source quoting

These are reversible, bounded, and *do not require new behavior* — they require
attribution. **Deliberately deferred**: adding citation annotations is exactly
the invasive-annotation path the evidence-tier decision rejected. The register
classifies them honestly (A) so they remain visible; they are closed as
implementation lands per REQ, not by retroactive commenting.

### Finding 4 — Review backlog (bucket B, 80 REQs)

Cited in `holonovel/src` but no exercised spec test maps to them. These are
implemented-but-unverified. They are the natural next target for *test*
coverage, not implementation: each should gain a harness assertion (a T-ID or
I-ID) once the spec's test cases are exercised. Highest-value first: §5.6
state/lifecycle (20), §5.9 persistence (13), §5.8 synthesis (12).

## Remediation sequencing (recommended)

1. **Automation complete** — this audit now runs on every `npm run validate` /
   `check:fast`; the gap register is committed and diffable. (This plan.)
2. **§5.12 Narrative Architecture** — the single largest genuine gap; a
   dedicated, sequentially-scoped implementation effort (Finding 1).
3. **Bucket-B test backfill** — convert review REQs to evidenced by adding
   harness assertions (Finding 4).
4. **G7 narrative-coherence attestation** — populable only after Finding 1
   lands; not fabricated before (Finding 1, REQ-346).
5. **`--impl-audit=strict`** — enable as a pre-push gate only after the gap
   count reflects *intended* coverage, so builder/verifier-side absences are
   whitelisted rather than treated as server defects (Finding 2).

## Explicit decisions

- **No citation-annotation sweep.** The evidence tier is comment-refs + test-IDs;
  retroactively adding citations to already-implemented code (Finding 3) would
  turn the audit into a self-graded exercise. Gaps close by real implementation,
  not by decoration.
- **No fabricated G7 attestation.** REQ-346a1 requires a passing narrative
  attestation "before handoff"; §5.12 is currently unimplemented, so the
  attestation is left unrecorded until it can pass honestly.
- **Register is the source of truth for drift.** `--write-register` regenerates
  it; subsequent spec/server changes that alter REQ presence will surface as
  register diffs under `check:fast`.
