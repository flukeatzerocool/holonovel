# Cold-pass scope — REQ evidence linkage

Prepare step record for `independent-review`. Parent work; not a reviewer output.

- **Artifact:** `/home/fluke/Holonovel/docs/plans/2026-11-15-req-evidence-linkage/plan.md`
- **Artifact sha256:** `cea8a9e26305473cea68945c72fec1d9e6acb3a9fc5fa1f655a19bcabb6504c2`
- **Sibling artifact:** `/home/fluke/Holonovel/docs/plans/2026-11-15-req-evidence-linkage/tasks.md`
- **Depth:** standard (stages 1, 2, 3×3, 5 — stage 4 only if edits follow)
- **Dispatches:** 6 (cap 7)
- **Read budget:** ≤10 per dispatch, ≤40 total at standard

## Target files handed out

- `/home/fluke/Holonovel/scripts/validate.ts`
- `/home/fluke/Holonovel/scripts/lib/req-checks.ts`
- `/home/fluke/Holonovel/scripts/test-req-checks.ts`
- `/home/fluke/Holonovel/spec/audit/review-register.md`
- `/home/fluke/Holonovel/ROADMAP.md`
- `/home/fluke/Holonovel/CHANGELOG.md`

## Cited standards handed out

- `/home/fluke/Holonovel/AGENTS.md` (Script discipline; Gates; Review-loop governance)
- `/home/fluke/Holonovel/docs/plans/README.md`

## Withheld

Authoring conversation, the parent's prior review findings, and any conclusion of
an earlier pass. Reviewers reach their own verdict.

## Revision cycles

| Cycle | Artifact sha256 | Dispatches |
|---|---|---|
| 1 | `cea8a9e2…504c2` | stages 1, 2, 3a, 3b, 3c |
| 2 | `c032d250…52437` | stage 4 (re-zoom) |
| 3 | `4b0655bd…abfca` | stage 5 (readiness) |
| 4 | `5110a46f…019f3ab` | stage 5 re-audit |
| 5 | `1ee92fb2…87e789` | parent fixes only (cap reached) |

Edits between cycles are the parent's, made from the stage findings. No reviewer
saw a prior stage's findings, and none was asked to confirm one.

## Cap override

`independent-review` allows one re-audit per failed stage. Stage 5 failed on
`4b0655bd…` and again on `5110a46f…`. The user authorised a third dispatch on `1ee92fb2…`, a **fourth** on `e7e938d8…`,
and a **fifth** on `1d1a932c…`, each overriding the cap for one dispatch only. Both are recorded as
explicit user authorisations, not as silent retries.

## Cycle 6 (fourth readiness pass)

Artifact `e7e938d8…`. Fixes applied after the third failure: a unique
`REQ-EVIDENCE` output token (the previous assertion matched 160 pre-existing
`WARNING: REQ-…` lines), `gatherExercisedIds` keeping its `Set<string>`
signature, V5 against the literal 122, the register row's title decided, and the
`K` counter removed.

## Cycle 8 (fifth readiness pass)

Artifact `1d1a932c…`. Fixes after the fourth failure: a verification row for the
`T553` ROADMAP section (V7a); V7 now requires the replacement sentence, not just
the absence of the old one; sort direction pinned with the measured head; P4
anchored after `:673`; P1's title-resolution check made literal; V1 enumerates
the six case names.
