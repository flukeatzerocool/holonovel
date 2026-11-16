# Stage 1 — zoom out

Reviewer: `review` subagent, fresh context
Artifact: `plan.md` · sha256 `cea8a9e2…504c2` (verified)
Reads: 10/10

## Findings

| Se | Finding | Rests on |
|---|---|---|
| Major | §9 assigns the parser-consolidation safety net to "V1's unchanged bucket counts", but V1 is `test:validators`, which produces no bucket counts; the guard is P1's `npm run validate` | plan:219 vs :132, :193 |
| Major | The T-ID extraction predicate from the `_Check:_` segment is never specified, though the whole population depends on it | plan:152-153, :64-70 |
| Major | Bucket E / `INTENDED_GAP_REQS` exemption unaddressed: the new check runs over all REQs; the artifact never says whether builder-side REQs contribute | plan:32-33, :68; validate.ts:2089 |
| Major | Contradiction: §4 says the "Manual → Gate" wording is "recorded, not invented", but P6 edits `ROADMAP.md:27-36`, which contains that clause at `:30` | plan:102 vs :177 |
| Major | The Manual predicate appears to fail 100% (23 unlinked of 23 Manual rows), yet §9 calls it a mild proxy | plan:52, :68, :210-212 |
| Major | Scope exceeds the goal: P6 also corrects the T22/T35/T103 parenthetical and adds a P3 ROADMAP section for T553, in one `--single` commit | plan:3-5, :177-181 |
| Major | P4's wiring (extraction plus warning emission) has no automated check; P5 tests only the pure function | plan:85, :150-165 |
| Nit | "one red and one green case" vs P5's two reds | plan:85 vs :163-165 |
| Nit | Kinds sum to the distinct-ID count, not the row count; duplicate accounting left to the reader | plan:51-52 |
| Nit | "The one row that does not survive parsing" — the row parses; the `Map` overwrites it | plan:55-56 |
| Nit | V5 expects a specific pre-existing error with no §2 evidence for that run | plan:197 |
| Nit | The signature does not state which side is the key of `citations` | plan:145 vs :65 |

## Unknowns

Baseline not run; `.desc`/`.keys()` consumers not read; the three other
`extractReqBodies` call sites unverified; `register-checks.ts:64-67` behaviour
unverified; recon counts not recomputed. Verified accurate: the T553 collision,
the Manual-preamble quote, `test:validators` → `test-req-checks.ts`, the
whole-name scan, `specTests`/`hasCheck`/`bodies`, kind dropped at `:1683`.

`stage 1: 0 blockers, 7 majors, 5 nits`

## Parent re-measurement of two findings

- **Manual predicate "fails 100%" — refuted.** Manual citation pairs total 39,
  of which 16 are linked and 23 unlinked. The 23 is the unlinked count, not the
  population.
- **Bucket E — confirmed and large.** Of the 122 findings, **99 belong to
  `INTENDED_GAP_REQS`**; only 23 are outside the exemption (8 automated,
  15 manual). The exemption needs an explicit decision, not a sentence.
