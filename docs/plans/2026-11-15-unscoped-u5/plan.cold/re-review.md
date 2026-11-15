# Diff re-review — U5 roadmap-closure plan v2

Reviewer: independent-review (fresh child context) · Depth: standard, diff mode
Artifact: `plan.md` sha256 `c929af67…47ff7549` (512 lines) · Reads: 12/12
Verdict: `independent-review FAILED.`

Scope: only the lines changed from v1 (the B-1/B-2/M-1…M-6 fixes). No new-lens
sweep.

## Findings

1. **[Major] Program totals still quoted the pre-fix count.** `plan.md:65` said
   "116 verdict rows"; `plan.md:117-119` said "115 rows" and "116 rows", while the
   program table sums to 118 (46 + 23 + 24 + 25).
2. **[Major] Two budget-row files were both edited and not edited.**
   `plan.md:371-372` listed `docs/workflow-cadence.md` and
   `docs/publish-pipeline.md` as blast-radius prose fixes while `plan.md:391-392`
   put the same two in the read-only predicate list; `docs/plans/README.md` was
   misclassified the same way at one remove.
3. **[Major] "The twelve code/doc rows" enumerated nine.** `plan.md:394-399`
   named nine paths, so 9 ≠ 12 and 46 = 34 + 12 could not be reconciled.
4. **[Major] §10's verifier prompt has ten steps, not nine.**
   `spec/07-independent.md:98` is step `10.` (the REQ-274 confidence threshold);
   `plan.md:160` and `tasks.md:36` said steps 1–9, inviting a reviewer to stop
   before the one directly checkable clause.
5. **[Nit] EV7's report-format count.** The block at
   `spec/07-independent.md:111-118` has eight fields, not five.
6. **[Nit] "Every line of §9 and §10 is assigned" was not literally true.**
   `spec/07-independent.md:10` ("The operator:") sat outside every row.
7. **[Nit] Phase 2's "five fixture/testdata entries" was not derivable.** The tree
   has four files under `holonovel/scripts/fixtures/` plus two `testdata`
   directories; and `holonovel/DECISIONS.md:1072` vs `:2235` disagree on whether
   `testdata/` is committed.
8. **[Nit] Phase 3's bar said "seven catalog gates"** over nine listed gates.

## Clean checks

- No residual "44 rows", "32 prose rows", "four exit clauses", or `wc -l review.md`
  claim outside the resolutions log.
- B-1 (done bar vs ROADMAP) fixed coherently; the admission rule is cited and
  `ROADMAP.md:33-34` carries a `**Trigger:**` line.
- B-2 substantively fixed: §9's 68 lines and §10's 128 lines are assigned, with
  `H1`–`H18` confirmed at `:46-63` and the tail at `:64-68`.
- Phase 1 sums to 46 and matches every restatement; Phases 3 and 4 are exact.
- `external-skill` is a verdict, not a disposition, so it does not conflict with
  the done bar's four dispositions.
- No new Blockers.

## Unknowns

- `worklist.md:250-252`'s three exit clauses were accepted from the prior pass.
- The tracked/ignored status of `holonovel/testdata/` is contested inside the
  server record; the plan now pre-identifies it as a U6 finding rather than
  assuming either answer.

## Disposition after this pass

All eight findings are fixed in v3. The re-review cap for standard depth is
reached (one re-review), so the fixes are not independently re-verified; they are
carried as conditions on the stamp rather than as a clean pass.
