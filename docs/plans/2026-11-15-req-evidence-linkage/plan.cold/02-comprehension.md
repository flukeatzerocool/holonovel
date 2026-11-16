# Stage 2 — comprehension (attempt 2, slim plan)

Reviewer: `review` subagent, fresh context
Artifact: `plan.md` · sha256 `6e4acb10…1ae41` (verified)

## Paraphrase

A report-only, pure-function check in the Holonovel spec tooling that
cross-validates each REQ's `_Check:_` citation against the evidence kind its
Appendix F row admits.

Why: `checkImplCoverage` builds its test-ID set from Appendix F's REQ column and
never reads the IDs named in `_Check:_` text; `parseAppendixFTestText` drops the
kind cell. Measured: 122 findings (99 inside `INTENDED_GAP_REQS`, 23 outside —
8 Automated, 15 Manual). Increment 1 of 3 on a P1 ROADMAP item.

What changes: `parseAppendixFTestText` returns `{kind, desc}`; two pure exports
in `scripts/lib/req-checks.ts`; six named tests; report-only wiring printing
10 WARNING / 5 NOTE lines plus a summary, only the outside-gap count added to
warnings; `corpus.md`, a register row, a CHANGELOG heading.

Done: typecheck, 71 validator tests, `validate` exit 0 with pinned counts,
`check:fast` green, `check-registers`/`check-loop-artifacts` pass, one
`session:close --single` commit, AAR `LOOP PAUSED`.

## Could not determine

Whether the cited line numbers and counts are currently accurate (artifact-only),
and how the six named tests obtain fixtures.

`stage 2: faithful`
