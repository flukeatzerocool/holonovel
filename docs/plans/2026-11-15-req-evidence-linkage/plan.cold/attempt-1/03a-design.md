# Stage 3a — design critic

Reviewer: `review` subagent, fresh context
Artifact: `plan.md` · sha256 `cea8a9e2…504c2` (verified)
Reads: 6 file reads, 5 greps

## Findings

| Se | Finding | Rests on |
|---|---|---|
| **Blocker** | No defined data path carries the kind-bearing row map into the new check: `checkImplCoverage` returns only `CoverageRow[]`, the Appendix F map is function-local (`validate.ts:2052`), so P4 must widen a return type (P1 does not say so) or re-parse Appendix F — the class the plan avoids | plan:150-159, :123-132 |
| Major | Check-segment predicate unspecified: no boundary rule, no second marker form (`validate.ts:2080`), no token grammar; two readings yield different populations | plan:152-154, :24-25 |
| Major | "Cited ID with no row" uses a narrower universe than the audit: `specTests` merges Appendix F *and* the §6.6 sub-workflow map (`:2073-2074`), so a legitimate sub-workflow citation becomes a false finding | plan:147 |
| Major | The Manual predicate is substring membership: `T84` is satisfied by `T84e` (`DECISIONS.md:864`); a `\b`-anchored match is required | plan:146-147 |
| Major | the kind cell is read from raw `split("|")` without trim or domain assertion — `" Automated "` never equals `"Automated"`, so the check yields zero findings and V2 passes empty | plan:126-127 |
| Nit | The T553 last-wins map means the check judges one T553 citation against the other row's kind | plan:123-132 |
| Nit | §9's "V1's bucket counts" — same defect as stage 1 | plan:217-218 |
| Nit | `gatherExercisedIds` reads the harness files independently and is uncached; the copied cache caches a different parse | plan:41-44 |
| Nit | `getDecisionsText()`'s absent-file behaviour is unspecified; both existing reads are try/catch-guarded | plan:154-156 |

## Verified as sound

Both parser functions have exactly three call sites (`:1712`, `:2052`,
`:2634`); no Appendix F row carries a fifth cell, so `cells[4]` is a sound REQ
index today.

`stage 3a: 1 blocker, 4 majors, 4 nits`
