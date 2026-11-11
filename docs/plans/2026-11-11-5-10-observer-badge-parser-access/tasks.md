# Tasks — §5.10 observer badge parser access

Increment: `docs/plans/2026-11-11-5-10-observer-badge-parser-access/`
Plan: `plan.md` · AAR: `aar.md`
Status: complete (2026-11-11)

## Phase 0 — baseline and predicate confirmation

- [x] 0.1 Record the measured baseline in `aar.md`: `check:fast` 40/40 PASS,
      `test:backfill` 104/104, `test:competitive-gaps` 30/30,
      `test:output-contracts` 390/390, `state.saveNovel(novel)` count 193,
      clean tree, 51 unpushed commits.
- [x] 0.2 Re-grep the edited locations and confirm they still match the plan:
      `holonovel/src/index.ts:4937-4939`, `:4961-4978`, `:4775`, `:4787`,
      `:4814-4819`; `spec/02-requirements.md:3243`, `:3339`, `:3415`, `:3433`,
      `:3760`; `spec/appendices-reference.md:1779`, `:2061`.
- [x] 0.3 Capture the holosuite anchor unresolved set for the after-comparison.

## Phase 1 — probe

- [x] 1.1 Write the throwaway probe under `/tmp/opencode`; run it for the
      ruleset-free parser case, the ruleset-bound parser plus
      resolve/visibility case, and the description-mode case.
- [x] 1.2 Copy the probe body and exact output into `aar.md`; stop and report if
      any expected parser refusal is already a success.

## Phase 2 — implementation

- [x] 2.1 Replace the badge gate with the single read-only predicate
      (`observerReadOnly`, `playerReadOnly`, `readOnlyBadge`); delete the
      ruleset-free `requireNotObserver()` branch.
- [x] 2.2 Skip `worldSnapshot()` for every read-only badge and pass
      `allowedVerbs: READONLY_VERBS` from the same predicate.
- [x] 2.3 Drop the three `state.saveNovel(novel)` calls from the description-mode
      branches (193 → 190).
- [x] 2.4 Update the `run_command` description to name the Observer window.
- [x] 2.5 Regenerate tool definitions; run `check-tool-definitions-sync`,
      `tool-definitions-lint`, and `surface-budget --write` (unconditional).

## Phase 3 — harness

- [x] 3.1 Add the T353 observer case to `test-backfill.ts` after T259.
- [x] 3.2 Add the T643 observer window (`look`, `i`, `go north`) to
      `test-competitive-gaps.ts` before the badge reset at `:506`.
- [x] 3.3 Run both harnesses and record the counts.

## Phase 4 — spec and register

- [x] 4.1 Rewrite REQ-196a at `spec/02-requirements.md:3243` with the pinned
      draft; verify length and sentence count.
- [x] 4.2 Rewrite REQ-309b at `:3415` with the observer exception; verify
      length.
- [x] 4.3 Widen the T353 and T643 rows; leave both REQ columns unchanged.
- [x] 4.4 Move `F-5.10-2` into `## Resolved`; add `F-5.12-1` to
      `## Scheduled-roadmap`; run `check-registers:strict`.
- [x] 4.5 Delete the ROADMAP section and add the §5.12 observer
      resolve/resource-reads section; run `check-roadmap`.

## Phase 5 — bookkeeping and generation

- [x] 5.1 Add the CHANGELOG entry.
- [x] 5.2 Refresh the coverage register (`validate -- --write-register`) and
      run `npm run assemble`.
- [x] 5.3 Complete `aar.md`, including the anchor unresolved-set comparison, the
      help-branch decision, and the `LOOP PAUSED` / `LOOP OPEN` terminal token.

## Phase 6 — verification

- [x] 6.1 Run the §6 verification table in order; every row must match.
- [x] 6.2 Run `npm run session:close`; confirm one commit and a clean tree.
