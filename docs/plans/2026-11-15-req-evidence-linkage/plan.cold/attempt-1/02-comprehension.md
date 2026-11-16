# Stage 2 — comprehension

Reviewer: `review` subagent, fresh context (no authoring history)
Artifact: `plan.md` · sha256 `cea8a9e26305473cea68945c72fec1d9e6acb3a9fc5fa1f655a19bcabb6504c2`
Verified: artifact hash matched on read.

## Paraphrase

A report-only validator check, `checkReqEvidenceLinkage` (pure, in
`scripts/lib/req-checks.ts`), that for each REQ whose `_Check:_` cites a T-ID
tests whether the citation lands on an Appendix F row whose *kind* admits that
evidence — `Automated` rows must be named by a real `test("<name>")` harness,
`Manual` rows must be named in `holonovel/DECISIONS.md`. Prerequisite refactors:
one kind-aware row parser (`parseAppendixFRows`) replacing two, and a cached
REQ-body parse shared with `checkImplCoverage`.

Why: the existing coverage audit joins on Appendix F's REQ column and never
reads `_Check:_` text, so a citation attributed to a different REQ is invisible;
bucket B5 errors name the REQ, not the T-ID, and are baseline-ratcheted; bucket E
exempts whole REQs.

Done: check wired report-only (`validate` still exits 0), red+green self-tests,
corpus list of ~122 unlinked pairs, `Scheduled-roadmap` register row, `T553`
collision scheduled on ROADMAP, stale T22/T35/T103 parenthetical corrected,
`check:fast` green, one commit via `session:close --single`, AAR `LOOP PAUSED`.
Triage-to-zero and error-mode explicitly out.

## Could not determine

1. The extraction rule turning `_Check:_` prose into citations — P4 names the
   input but not the grammar, so the 122 is not reproducible from the document.
2. The done bar's "one red and one green case" conflicts with P5's two reds and
   one green.

Inherited AGENTS.md did not conflict.

## Verdict

`stage 2: faithful-with-gaps` — gaps 1 and 2 above. Non-blocking; both are text
defects to fix in the stage-4 edit round.
