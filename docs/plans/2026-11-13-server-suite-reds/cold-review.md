# Cold review report — plan-server-suite-reds

Reviewer: fresh-subagent fan-out (stage 1, stage 2, stage 3 design/structural/style, stage 4, stage 5; stage 1 and stage 5 re-audited once)
Plan sha256: e59ee90a3a671eb15b62bac39cdc376313e7b25254f08a6be8b6e8abcf4881e4
Repository: /home/fluke/Holonovel · git HEAD 6e65c37
Depth: standard
Stages: 5/5

## Token

independent-review passed. plan-server-suite-reds.md — 7 reviewers, 5/5 stages

## Round 1 (stage 1) — FAILED, 3 Blockers

1. [Blocker, design] Change A skipped migration when `TTRPG_AUTO_MIGRATE=off`, orphaning the v1 audit sidecar on the next save. → resolved: migration always runs in memory; the unlink is deferred to the first successful primary write.
2. [Blocker, design] The projection bump broke `test-persistence.ts` T712, absent from the blast radius. → resolved: file added to the blast radius and to commit 2's gates.
3. [Blocker, clarity] Root cause C misquoted the predicate: `contentHash` already strips `_checksum`. → resolved: only `connection_counter` is the delta; `_checksum` is not added to the exclusion list.

Majors resolved: no contract change without a record (DECISIONS.md line added); the deferred-unlink variant now chosen; the T772 fix scoped to the identity block; the duplicated switch predicate replaced by one exported helper; evidence provenance restated.

## Stage 2 — PASS. Comprehension faithful; done bar present and measurable.

## Stage 3 — design FAIL, structural FAIL, style PASS

- [Blocker→resolved] The T772 replacement assertion could pass vacuously (`undefined === undefined`); presence and type asserts added, and `canonicalJson` named with its import path.
- [Major→resolved] Change A still had a dual unlink ordering on the default path; now exactly one ordering, always deferred.
- [Major→resolved] Commit 2's holosuite gate was unsatisfiable while anchors were still stale; the holosuite causes are now one commit with a green gate.
- Structural minors resolved: CHANGELOG and DECISIONS ownership stated; `test:persistence` added to commit 1's gates; the `changed:` diagnostic fixed rather than left misleading; the projection-pin sweep added.

## Stage 4 — PASS. Re-zoom found no new contradiction; only wording nits, all applied.

## Stage 5 — PASS after one re-audit. Every command, symbol and path resolves.

Remaining minors (non-blocking, all recorded in the document):
- The exclusion narrows the `verify` surface to exclude `connection_counter` — intentional, and recorded in DECISIONS.md.
- A projection revert leaves rewritten digests reading as stale — data-side noise, no loss.
- Per-anchor line targets are resolved at execution by definition/dispatch site, with the tier run as proof.

## Post-review correction

After the final readiness pass, one stale clause was deleted: Change A step 2 now reads "records the sidecar path in a new `pendingAuditSidecars` **set** of sidecar paths" instead of naming a `sidecarPath → owning slug` value. That is the only difference between the reviewed text and the artifact at the hash above; the correction is exactly the Minor raised in the stage-5 re-audit.

## Unknowns

- Whether REQ-602's older-projection row is reported as historical by `verify` — confirmed by `test:persistence` before commit 2.
- Whether any projection pin exists outside `holonovel/scripts/test-persistence.ts` — a grep sweep is a named step; the stage-5 re-audit found none.
- Per-commit changed-line counts against the ~300-line split guideline — measured during execution.

## Cost

Review cost: 7 fresh subagent dispatches · ~60 min · reads 72/40 (budget exceeded across the fan-out; recorded honestly rather than trimmed).
