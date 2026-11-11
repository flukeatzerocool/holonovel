# Tasks — §5.10 override hint envelope and REQ-325c Check

Dependency-ordered. Each task names its verification; done means the check
passed, not that the edit landed.

## Phase 0 — Baseline and predicate re-check

- [x] T0.1 `npm run status` and `npm run check:fast` un-piped; recorded in
      `aar.md` (40/40, `check:fast: PASS`).
- [x] T0.2 Predicates A–E re-confirmed with `grep -n`; B's attribution clause
      withdrawn (REQ-325c's GM clause requires the wide view).
- [x] T0.3 `test:output-contracts` and `test:backfill` baselines recorded
      (385/0, 104/0).
- [x] T0.4 `plans/…` ignored; increment directory absent.
- [x] T0.5 Sibling-contract grep (`override_hints`, REQ-084b) — only Appendix F
      T370 names the field.
- [x] T0.6 T-token scan: T370 ×2, T371 ×1, T373 ×2, T374 ×2; corrections
      chosen (D5).
- [x] T0.7 REQ-325c body measured: 514 chars / 7 sentences, inside 800/8.

## Phase 1 — Red tests

- [x] T1.1 T372 widened (`test-output-contracts.ts:1649`): every entry carries
      `type`/`source`/`prerequisites`; Player health omits
      `constraint_override_counts`. Passes pre-fix (catch-up).
- [x] T1.2 New T370 test (`:1575`): open exit resolved; locked door blocked
      with no hints; injected attributed + foreign overrides → blocked with
      `Knock (1 slot remaining) can open it.` and the foreign `Passwall`; exit
      block; Player `[FORBIDDEN]`; `no_world_model`; `tools/list`.
      Pre-fix failure recorded: `REQ-325b hint text wrong: []`.
- [x] T1.3 Retitles: `:1526` → T373/T374, `:780` → T376, `:728` → T377,
      `test-backfill.ts:713` → REQ-only.
- [x] T1.4 Both harnesses run; only T370 red before the fix.

## Phase 2 — Implementation

- [x] T2.1 `visibleConstraintOverrides` (`index.ts:6125`) shared by the
      resource (`:13726`) and the hint scan; observer/Player behavior unchanged.
- [x] T2.2 `doorOverrideHints` (`:6138`) keys on `type === "door"`, reads
      `name`/`slots_remaining`, omits the slot clause when absent.
- [x] T2.3 Door branch (`:6176-6195`) returns blocked with `constraint`,
      `reason`, and conditional `override_hints`; the resolved branch no longer
      carries hints.
- [x] T2.4 `npx tsc --noEmit -p holonovel/tsconfig.json` → 0;
      `test:output-contracts` → 390/0.

## Phase 3 — Spec, register, roadmap, changelog

- [x] T3.1 REQ-325c `_Check:_ T370, T372`; REQ-326d `_Check:_ T373`.
- [x] T3.2 Appendix F T370 row rewritten (blocked envelope, pinned hint, GM
      breadth; help clause dropped; REQ-323, REQ-325).
- [x] T3.3 F-5.10-1 moved to `Resolved`; `Closed-P3` entry added for the
      unreachable Player clause, label corrections, and the Appendix O pointer.
- [x] T3.4 ROADMAP §5.10 override section deleted; new P1 item scheduled for
      the pre-existing pattern-buffer I1 conflict.
- [x] T3.5 CHANGELOG new dated heading.
- [x] T3.6 `npm run assemble`; `validate -- --write-register` → 0 errors,
      REQ-325 = `T370, T372`, REQ-326 = `T373`, REQ-324 = E.

## Phase 4 — Verification

- [x] T4.1 `test:output-contracts` 390/0; `test:backfill` 104/0.
- [x] T4.2 `npm run check:fast` → 40/40, `check:fast: PASS`.
- [x] T4.3 `npm run check` → `check: PASS`; `npm run build-order` → complete.
- [x] T4.4 `npm --prefix holonovel run test:all` → 50 passed, 6 failed; all six
      diagnosed as pre-existing (27 stale holosuite anchors + pattern-buffer
      I1), verified stale at `HEAD`; recorded in `aar.md`.

## Phase 5 — Close

- [x] T5.1 Build marker recorded.
- [x] T5.2 `aar.md` written; increment moved to `docs/plans/`.
- [x] T5.3 One commit via `npm run session:close`.
