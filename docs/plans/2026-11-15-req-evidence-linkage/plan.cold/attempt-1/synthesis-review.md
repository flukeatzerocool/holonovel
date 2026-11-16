# Plan review record — REQ evidence linkage (2026-11-15)

> **Superseded by `plan.cold/` and does not attest independence.**
> This file was written after two rounds of review that ran the five stages
> sequentially in a *single* reviewer context. That is not a cold pass as
> `independent-review` defines it (one fresh context per stage, with a
> `plan.cold/report.md` carrying the artifact hash). The verdicts below are real
> reviewer output, but the process they describe is weaker than this file's
> original framing implied, and no `independent-review passed.` token exists for
> this plan. See `plan.cold/00-scope.md` for the genuine cold pass and its
> outcome.

Two sequential passes in one reviewer context: pass 1 failed, the plan was
revised, pass 2 passed with two Majors that were then corrected.

## Pass 1 — `plan-review: FAILED.`

Blockers: B1 the check's input was Appendix F's REQ column rather than the
`_Check:_` text; B2 `manualProcedures` had no producer or predicate.

Majors: M1 `npm run test:req-checks` did not exist; M2 a missing second parser
caller; M3 the "one parser" claim and its repeated-parse rationale; M4 the
bucket-B severity claim; M5 the stale T22/T35/T103 parenthetical; M6 the
`Gate`-kind amendment never written; M7 the register disposition unspecified;
M8 the corpus list had no durable path.

## Pass 2 — `plan-review: PASSED.`

13 of 14 prior findings resolved on the text; m1 partial. Remaining Majors F1
(population figures unattainable under the stated data path) and F2 (row counts
one adrift, traced to the duplicated `T553` row) were corrected by re-measuring
with the real parsers.

These findings were sound and were carried forward. What this file cannot do is
stand in for the cold artifact the gate requires.
