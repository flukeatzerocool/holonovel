# Tasks — mutation-sample depth (ROADMAP item 2)

Dependency-ordered. Phase numbers match `plan.md`. Each task states its accept condition. Re-measure
every `file:line` at execution (the numbers are dated to `3ae3444`).

## Phase 0 — Confirm the increment

- [ ] T1. Confirm this plan and `tasks.md` are the ones the session stamps.
- [ ] T2. Run `plan-gate.mjs preflight`, the cold pass, and the stamp; re-measure the `file:line`
      citations. Accept: the stamp records the executed plan hash.

## Phase 1 — Measure before changing

- [ ] T3. Re-read `holonovel/scripts/lib/holosuite-mutation.ts:100-201`; confirm the counted set is
      12 (5 lens, 3 invariant, 4 contract) and the run still prints `12/12`.
- [ ] T4. Table all 17 declared cases by stratum (`lens`, `lane`, `invariant`, `contract`) and mark
      the five `ORACLE_DERIVED` cases. Accept: 17 rows, 5 excluded, 12 counted, zero lane mutants
      counted.
- [ ] T5. Read the signatures of the 24 D3 candidate predicates; sketch one fault and one control
      for each. Accept: at least 21 pairs survive, with a named note for every rejected candidate.
      **Gate:** fewer than 21 → take D12's exit and stop.
- [ ] T6. Confirm live records carry `args`, `result`, `active_room`, `pre_fp`/`post_fp`, and
      `state_delta` by reading `playtest.ts:399-415`. Accept: a written confirmation with line
      citations.
- [ ] T7. Enumerate `JUDGMENT_GM_LANES` consumers. Accept: the list (today `playtest-lib.ts:308`,
      `playtest.ts:40`, `playtest.ts:575`).

## Phase 2 — Fixture extension and lanes

- [ ] T8. Extend `evidence()` to the fixed five-turn base (plan Phase 2: `t1` badge, `t2` room, `t3`
      look, `t4` `manage_npc` with `npcs: 1`, `t5` move with a changed fingerprint), each record
      carrying `pre_fp`/`post_fp`; move every mutant append to `t6` (`t7` for the two-turn mutants)
      and renumber `unrecovered_detail[0].t` to 6 and `persist_violations[0].between` to 5; give
      each mutant a `clean` fixture (plan D13); remove `MUTANT_ENV` and the selector block; export
      `MUTANTS`, `CONTRACT_MUTANTS`, and `evidence()`. Accept: the base fixture yields no lane
      finding.
- [ ] T9. Implement `world_population_failure` per plan D4 with a fault (`t6`, `npcs: 0`) and a
      clean control.
- [ ] T10. Implement `coupling_failure` per plan D5 with a fault (`t6`, `go south`, equal
      fingerprints) and a clean control.
- [ ] T11. Delete `JUDGMENT_GM_LANES` and its two consumers (`playtest.ts:40`, `:575`). Accept: V4.
- [ ] T12. Read `test-playtest.ts:215-241`; confirm none of its cases pins lane emptiness. Accept: a
      written confirmation; if one does, update it (blast-radius contingency).
- [ ] T13. Add each lane's fault/control pair to `test-holosuite-evidence.ts`. Accept: `seeded = 14`
      in the `--json` metrics; V2 green.

## Phase 3 — Stratum and controls

- [ ] T14. Add `stratum` to every mutant and to `metrics.mutants`; set `lens` to `null` outside the
      lens stratum.
- [ ] T15. Give the eight existing seeded transcript mutants a `clean` fixture per plan Phase 3 and
      D13 (the five lens clean turns are specified there). Accept: `controls_passed` = `seeded`,
      `controls_failed` empty.

## Phase 4 — Contract pairs

- [ ] T16. Add the 21 D3 pairs, one per distinct branch, each carrying its `branch` key.
- [ ] T17. Add the seeded-table two-direction test to `test-holosuite-evidence.ts` (plan D17):
      iterate the 35 seeded entries, assert `detects()` and `control()` true from each record's own
      fixtures, assert the five `ORACLE_DERIVED` entries stay declared and uncounted, and assert a
      record with `fault`/`clean` swapped yields `control() === false`.
- [ ] T18. Invert one transcript mutant, observe the miss, restore, then re-read a clean 35/35.
      Accept: `caught = 35` and `STATUS: CLEAN` after the restore.
- [ ] T19. Confirm `seeded = 35`, `controls_failed` empty, and `CONTRACT_MUTANTS.map((c) => c.branch)`
      is duplicate-free.

## Phase 5 — Interval and report

- [ ] T20. Add `wilsonInterval` to `holonovel/scripts/lib/eval-stats.ts` per plan D14 (pure; `null`
      at `seeded = 0`; clamped; 4 dp).
- [ ] T21. Add `ci95`, `composition`, `strata`, `controls_passed`, `controls_failed`, and
      `claim_note` to the mutation tier metrics.
- [ ] T22. Wire `holonovel/scripts/holosuite.ts:317-320` to print the aggregate rate and interval,
      the composition, each stratum's rate, `controls=passed/seeded`, and the `STATUS:` line
      (plan D18); print `catch_rate=n/a` when `seeded = 0`.
- [ ] T23. Add interval known-values and composition cases to `test-holosuite-evidence.ts`.
      Accept: V2 and V3 pass.

## Phase 6 — Spec amendment

- [ ] T24. Replace `spec/05-verification.md:255-263` with plan D1's paragraph verbatim.
- [ ] T25. Update the method-audit paragraph in `holonovel/scripts/playtest/README.md:152-160`.
- [ ] T26. Run `npm run assemble`; inspect `git status` for the phase-map hash and `holonovel.md`
      only. Accept: the fast gate passes.

## Phase 7 — Registers and close

- [ ] T27. Add the dated DECISIONS entry (published statistic, strata, case-level caveat, lens
      stratum, D15 reading, advisory tier, status line).
- [ ] T28. Retire `ROADMAP.md:25-34`; add the D11 lens-breadth section with a trigger and a close
      condition.
- [ ] T29. Close F9 in `spec/audit/review-register.md` as `Resolved` with the measured numbers and
      the date.
- [ ] T30. Write `aar.md` with the `## Changelog entry` block, the measured intervals, and a
      terminal token.
- [ ] T31. Run `npm run check` and `npm run check:fast` un-piped; then `npm run session:close`.
      Accept: one commit; V1–V10 green.
