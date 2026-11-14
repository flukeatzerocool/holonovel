# Binding pass — plan v3 (delta A1 only)

Plan sha256: fa5b348d035bef76fb2d86e84e57c88efc8985343c3a9b7557ed1edd577d59bc

Artifact bound: `docs/plans/2026-11-13-trust-core-error-envelope/plan.md`,
sha256 `fa5b348d035bef76fb2d86e84e57c88efc8985343c3a9b7557ed1edd577d59bc`.
Reviewed: §4a (`plan.md:254-279`), blast-radius table (`:281-298`), D5/C6
cross-references (`:166`, `:238`). This verdict covers those bytes only; the v2
lens results stand for the rest.

## Verdict

A1 is internally consistent and rests on facts that check out:

1. **Pacing is not observable per call.** `novel.pacing_counter` is written only
   inside `triggerPacingAutonomy`, after the signal gate and the once-per-window
   guard (`holonovel/src/index.ts:724-730`); the per-call increment lives in the
   in-memory session (`:690-692`). A refused call cannot move a readable
   counter — the probe's 0/0 result is the expected shape. T386c inside the
   existing `TTRPG_PACING_WINDOW=3` block is the right vehicle.
2. **`requirePlayer()` is usable for the GM-badge refusal.**
   `manage_character (action: "signal")` calls `requirePlayer()` as its first
   statement (`index.ts:5052-5053`), so a GM-badge call throws before any
   mutation and yields the converted refusal the pacing test needs.
3. **Bar 5's repoint is sound.** The retired-alias path is the dispatcher
   refusal C4 maps to `NOT_FOUND`, and §4a records the probed pre-fix shape
   consistently with `index.ts:1951`. The absent small-profile group refusal is
   correctly demoted to an AAR observation rather than a contract claim.
4. **T386c needs no catalogue row.** `T386` exists as an Appendix F row
   (`spec/appendices-reference.md:1841`) and REQ-336 cites it
   (`spec/02-requirements.md:3571`); sub-ID variants are the established
   convention (T534b/T534c), and REQ-336 is already bucket C, so the delta
   creates no coverage or traceability gap.

## Minor (changed text)

§4a cites `index.ts:713` for the counter assignment; `:713` is
`pacingSignalText` and the assignment is `:730`. The claim is true, the citation
is 17 lines off — corrected in the AAR and tasks file rather than the plan, so
the bound bytes stay stable.

## Unknowns

- The existing `TTRPG_PACING_WINDOW=3` block in `test-narrative.ts` was not
  opened to confirm the anchor (budget).
- Done-bar item 5's exact wording was not re-read; a leftover
  `TTRPG_SURFACE_PROFILE=small` phrase there would be a wording inconsistency
  only, not a blocker.

No blockers. The §4a note that A1 "is verified by `build-review` and the AAR"
is superseded by this pass.

independent-review passed. Scope: delta A1 only (new §4a, repointed bar 5,
D5→T386c, C6/blast-radius addition) on plan sha256
`fa5b348d035bef76fb2d86e84e57c88efc8985343c3a9b7557ed1edd577d59bc`; both A1
premises verified against `index.ts:724-730` and `index.ts:5052-5053`.
