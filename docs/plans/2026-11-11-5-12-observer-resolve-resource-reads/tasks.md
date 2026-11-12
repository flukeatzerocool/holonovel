# Tasks — §5.12 observer resolve and resource reads

Increment: `docs/plans/2026-11-11-5-12-observer-resolve-resource-reads/`
Plan: `plan.md` · AAR: `aar.md`
Status: complete (2026-11-11)

## Phase 0 — baseline and predicate confirmation

- [x] 0.1 Record the measured baseline in `aar.md`: `check:fast` 40/40 PASS,
      `test:narrative` 75/75, `test:competitive-gaps` 30/30,
      `requireNotObserver();` count 45 in `holonovel/src/index.ts`, clean tree,
      52 unpushed commits.
- [x] 0.2 Re-grep the edited locations and confirm they still match the plan:
      `holonovel/src/index.ts:4786-4787`, `:4814-4819`, `:13447-13448`,
      `:13486-13487`; `spec/02-requirements.md:3760`;
      `spec/appendices-reference.md:1872`, `:2061`.
- [x] 0.3 Capture the holosuite anchor unresolved set for the after-comparison.

## Phase 1 — probe

- [x] 1.1 Re-run the throwaway probe under `/tmp/opencode`; record observer
      `resolve`, `visibility`, `audibility`, and the three resource reads.
- [x] 1.2 Copy the probe body and exact output into `aar.md`; stop and report if
      a query already succeeds or a resource read is refused.

## Phase 2 — implementation

- [x] 2.1 Delete `requireNotObserver()` at `index.ts:4787`; keep the Player
      point-of-view restriction and add the REQ-305/REQ-366b comment.
- [x] 2.2 Delete `requireNotObserver()` at `index.ts:4819`; keep the Player
      refusal above it.
- [x] 2.3 Admit `observer` in the `isGM` predicate of `room-single` (`:13448`)
      and `thing-single` (`:13487`).
- [x] 2.4 Confirm no description, schema, or generated-artifact edit
      (`git diff --stat` on `tool-definitions.json` and
      `tool-surface-baseline.json` is empty).

## Phase 3 — harness

- [x] 3.1 Extend the T417 case in `test-narrative.ts:910-919` with resolve,
      visibility, audibility, and the three resource reads at GM depth.
- [x] 3.2 Add resolve and visibility assertions to the T643 observer window in
      `test-competitive-gaps.ts:509-518`.
- [x] 3.3 Run both harnesses and record the counts (75/75, 30/30).

## Phase 4 — spec and register

- [x] 4.1 Rewrite REQ-366b at `spec/02-requirements.md:3760` with the pinned
      draft; verify length (≤800) and sentence count (≤8).
- [x] 4.2 Widen the T417 row; widen the T643 row and extend its REQ column.
- [x] 4.3 Move `F-5.12-1` into `## Resolved` with the corrected predicate; run
      `check-registers:strict`.
- [x] 4.4 Delete the ROADMAP section; run `check-roadmap`.

## Phase 5 — bookkeeping and generation

- [x] 5.1 Add the CHANGELOG entry.
- [x] 5.2 Refresh the coverage register (`validate -- --write-register`) and run
      `npm run assemble`.
- [x] 5.3 Complete `aar.md`, including the probe transcript, the
      annotation-depth decision, the anchor comparison, and the `LOOP PAUSED` /
      `LOOP OPEN` terminal token.

## Phase 6 — verification

- [x] 6.1 Run the §6 verification table in order; every row must match.
- [x] 6.2 Run `npm run session:close`; confirm one commit and a clean tree.
