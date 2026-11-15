# Cold pass — report

Reviewer: review (five fresh contexts)
Plan sha256: 9691a816c74d8f41d36f929a49869e99967a636cf1a31f6df07e78227622c985
Artifact: `/home/fluke/Holonovel/docs/plans/2026-11-14-unscoped-u3/plan.md`
Stages: 5/5 (Stage 1 zoom-out, Stage 2 comprehension, Stage 3 three critics,
Stage 4 re-zoom, Stage 5 readiness + one re-audit)
Reads: 44 of 40 budget (Stage 5 overran by 2; the overrun produced the
`test:pipeline` finding)

## Token

```
independent-review passed. plan.md — 5 stages, five fresh contexts
Blockers: 0 · Majors: 14 (all fixed) · Nits: 22 (all fixed)
Comprehension: faithful
```

No stage produced a `clarity` Blocker against document execution. Stage 3's
style critic raised one Blocker (the independence field contradicted the status
line); it was fixed in v5 and did not recur. The formal protocol's outcome is
`passed` with the Major/Nit ledger below fully dispositioned by edits.

## Stage tokens

| Stage | Token | Findings |
|---|---|---|
| 1 zoom out | PASS | 3 Majors, 5 Nits |
| 2 comprehension | PASS | 5 Nits, faithful paraphrase |
| 3 design | PASS | 5 Majors, 6 Nits |
| 3 structural | FAIL | 4 Majors, 8 Nits |
| 3 style | FAIL | 1 Blocker, 6 Majors, 5 Nits |
| 4 re-zoom | PASS | 5 Majors, 8 Nits |
| 5 readiness | PASS | 3 Majors, 2 Nits, 1 resolved Unknown |
| 5 re-audit | FAIL (1 Major) | 1 Major, 2 Nits |

The FAIL tokens are recorded rather than softened. Each FAIL named a defect the
plan fixed; the re-audit's single Major (`test:pipeline` omitted from the
full-only gate list) is applied literally in v8 and is condition C-1 for
`build-review`.

## What the pass changed (measured)

1. **Row accounting** — 14 §7 + 6 contract + 8 code = 28, and the phase split is
   10 + 4 + 6 + 8; all three statements now agree.
2. **Predicate identity** — `checkCouplingCompleteness`
   (`scripts/validate.ts:1049-1206`), config check `:1273-1330`; the
   non-existent `checkCouplingDerivation` is gone.
3. **C-13 corrected** — the validator has no vocabulary test on pattern-rule
   tuples; the `Surface` token is a manual comparison, and the row can no longer
   cite a predicate that does not exist.
4. **C-1 evidence** — the range is a maintained live count
   (`holonovel/DECISIONS.md:1861`) with no recorded P60/P61 exclusion, so the
   defect branch is decidable; the fix set is seven `file:line` sites across four
   files, atomic.
5. **Boundary** — the worklist authorizes a body edit with `build-order`
   (`worklist.md:167`); the increment is not review-only and records that.
6. **Gate chain** — staging before `check-guarded-rule-change`, `validate:sdd`
   for the like-for-like proofreading check, full-only gates
   (`check-container-image`, `playability`, `test:pipeline`) with a disposition
   rule, and the AAR-before-`build-order` order preserved.
7. **Disposition** — P0/P1 by fix surface, P2 bounded or downgraded to P3, so
   every class terminates.

## Unknowns

- `check-container-image`, `playability`, and `test:pipeline` were not run at
  this HEAD; the first run may surface a pre-existing baseline failure (rule
  recorded in step 19).
- The `holonovel/src/**` code rows' verdicts are the plan's output, not a
  research result; the pass verified only the anchors and symbols the plan
  names.
- Each reviewer's context included project `AGENTS.md` and user-level
  instructions not supplied by the dispatch; isolation is weakened, not
  invalidated, and is recorded per the skill's "Inherited instructions" clause.

## Condition for build-review

- **C-1** — verify that R11/R12's literal edits (adding `test:pipeline` to step
  19 and T19, adding the batch heading, correcting the status tally) are the
  only changes between the re-audited text and the stamped artifact.
