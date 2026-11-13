# Tasks — pre-existing harness failures: divergence probe and license refusal

Increment: `docs/plans/2026-11-12-harness-failure-remediation/`
Plan: `plan.md` · AAR: `aar.md`
Status: draft (not started; AAR lands at session close)

## Phase 0 — baseline and probes

- [ ] 0.1 `npm run check:fast` (expect 41/41, trailing PASS); record the count.
      Drafting baseline: exit 0, 41 passed (un-piped).
- [ ] 0.2 Record harness baselines: `test:memory-recall` 19/1 fail (T752),
      `test:limits` 26/1 fail (T740).
- [ ] 0.3 Confirm H-1: T752 `displaced-outcome` verdict `confirmed` with
      `truth.source = campaign:threads:…`, `truth.anchor = null`.
- [ ] 0.4 Confirm H-2: share with the restricted module loaded returns a bundle
      whose manifest names `rights-reserved` and whose `adventure` is the
      generated payload; the unattributed audit names `generated`.
- [ ] 0.5 Write `tasks.md` (this file); create the AAR skeleton at close.

## Phase 1 — spec line

- [ ] 1.1 Add the O.13 precedence line (event-anchored fact outranks an
      unanchored restatement when the record cites an event ordinal).
- [ ] 1.2 `npm run assemble`.

## Phase 2 — red assertions

- [ ] 2.1 T752: assert the `displaced` verdict's `truth.anchor` is non-null and
      an event ordinal; confirm it fails on HEAD behaviour.
- [ ] 2.2 T740: assert the `[license-unattributed]` audit names `unlicensed`,
      not `generated`; confirm it fails on HEAD behaviour.
- [ ] 2.3 Copy both red transcripts into `aar.md`.

## Phase 3 — divergence fix

- [ ] 3.1 In `checkRecord`, restrict `samePolarity`/`opposite` to the
      event-anchored subset when the record cites an ordinal and an anchored
      fact exists.
- [ ] 3.2 `npm --prefix holonovel run test:memory-recall` → 20/0.
- [ ] 3.3 `npm --prefix holonovel run test:belief` → unchanged.

## Phase 4 — share license gate

- [ ] 4.1 Add `shareLicenseRefusal(novel)` resolving the loaded module's
      provenance (skip on no slug, skipped slug, missing file).
- [ ] 4.2 Call it from the `share` branch before `embeddedAdventureContent`;
      remove the payload-bound gate or reduce it to the generated case.
- [ ] 4.3 `npm --prefix holonovel run test:limits` → 27/0.
- [ ] 4.4 `npm --prefix holonovel run test:adventure` → unchanged.

## Phase 5 — registers and docs

- [ ] 5.1 `spec/audit/review-register.md`: `Resolved` entry for H-1/H-2,
      `Closed-P3` for H-3, predicates cited.
- [ ] 5.2 `ROADMAP.md`: remove the closed section; `check-roadmap` passes.
- [ ] 5.3 `CHANGELOG.md`: dated entry describing the two predicate fixes.
- [ ] 5.4 Confirm no coverage-register bucket moved; regenerate only if the
      freshness check reports drift.

## Phase 6 — close

- [ ] 6.1 `npm run assemble && npm run check:fast` → PASS, un-piped exit 0.
- [ ] 6.2 Complete `aar.md` with the verification table and a LOOP token.
- [ ] 6.3 Commit with `npm run session:close` (one increment).
