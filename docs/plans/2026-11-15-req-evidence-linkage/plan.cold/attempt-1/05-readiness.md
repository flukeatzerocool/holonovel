# Stage 5 — readiness

Reviewer: `review` subagent, fresh context
Artifact: `plan.md` · sha256 `4b0655bd…abfca` (verified)
Reads: 7 file reads, 3 greps

## Blockers

1. **No verification row can fail on a silent no-op.** V2 accepts
   "linkage summary line" with no pinned count; V5 compares the corpus length to
   that same `N`, so 0 == 0 passes; P6 explicitly discards §2's measurements as a
   cross-check. V5 is also not a runnable command.
2. **The 12-line total cap makes the `NOTE:` branch unreachable** with 23
   outside-gap findings, contradicting the done bar and §2.
3. **Self-test inventory and task/phase map disagree**: the done bar omits the
   extraction case that V1 requires; task 11 (`assemble` + `check:fast`) has no
   P8 counterpart.

## Majors

4. P5 has no line anchor — the wiring site (`:2605`) is never named.
5. V1 states no expected total, so cases authored-but-not-invoked pass.
6. P0 carries no check that can fail.
7. `getReqBodies` / `getDecisionsText` do not exist and their return shape is
   unstated; P3's signature is written against a hypothetical type.

## Nits

8. "no fifth cell exists today" — the rows have six cells; the REQ cell is
   index 4.
9. `t.all` is on `HarnessTest`, not `HarnessSource`.
10. No fallback if `check-registers` demands a REQ citation in the row.
11. `getDecisionsText()` returning `""` makes all 39 Manual pairs findings on a
    scratch checkout — worth a risk note.

```
stage 5: 3 blockers, 4 majors, 4 nits
independent-review FAILED. plan.md — 6 reviewers, 5/5 stages
```

## Parent response

All three blockers and all four majors applied in cycle 4:

- V2 pins `REQ evidence linkage: 122 finding(s) — 23 outside intended gaps`;
  P6's numbers must reconcile with §2's table or the run stops and amends;
  V5 became `grep -c '^| REQ-' corpus.md`.
- The two print groups are capped separately (all outside-gap warnings, at most
  5 `NOTE:` lines), so the `NOTE:` branch is reachable.
- The done bar names the extraction case; P8 gained the `assemble` + `check:fast`
  gate and the task map now points tasks 11–12 at P8; V1 expects 71 passed.
- P5 is anchored to `main()` after the `checkImplCoverage(...)` call at `:2605`.
- P0 is relabelled preamble, not a phase.
- P2 states that the two getters are new, with `getReqBodies` returning the
  `extractReqBodies` shape.
- Nits 8–11 applied, including the register fallback and the scratch-checkout
  risk note.

# Stage 5 — re-audit

Reviewer: `review` subagent, fresh context
Artifact: `plan.md` · sha256 `5110a46f…019f3ab` (verified)
Reads: 7/10

## Verdict on the load-bearing question

**Aggregate: no. Detail: yes.** V2's pinned string means a zero-finding
implementation fails. But no row asserted that a single `WARNING:` or `NOTE:`
line is emitted, so a summary-only printer satisfied every row.

## Findings

| Se | Finding | Rests on |
|---|---|---|
| **Blocker** | The output budget is contradictory (done bar "12 lines", P5 "all warnings + 5 notes", tasks "12-line cap") and no row measures it | plan:114-116, :222-224; tasks:14 |
| **Blocker** | Per-finding emission is unverified — a summary-only printer passes all rows | plan:114, :270, :273 |
| Major | P5's own check cannot fail on the number ("the summary line appears") | plan:228-229 |
| Major | P2 points at a field instead of the existing `collectHarnessTestNames` helper, inviting a duplicate-helper failure; and its check passes if P2 is skipped | plan:189-191; validate.ts:1572 |
| Major | P3 and P4 carry no line anchor | plan:197, :207 |
| Major | V5's row semantics unstated, so the corpus format is undecidable | plan:233-239, :273 |
| Major | Two done-bar items have no runnable check (`corpus.md` T553 note; surviving T22/T35/T103 prose) | plan:119-121 |
| Nit | V1's 71 assumes the green case is one test | plan:207-211 |
| Nit | V6 is a row that can never be green | plan:274 |
| Nit | An open question survives in an executable artifact | plan:278 |
| Nit | The warning-total drift is unstated | plan:227 |

Verified sound by the reviewer: P5's anchor and variable scope, `baseReq`,
`harnessSourcesCache`, the sibling phase map, the done-bar arithmetic, and the
self-test inventory agreement.

```
stage 5: 2 blockers, 5 majors, 4 nits
independent-review FAILED. plan.md — 6 reviewers, 5/5 stages
```

## Parent response (cycle 5, sha256 `1ee92fb2…87e789`)

One rule for the output budget in all three places (10 `WARNING:` then 5
`NOTE:` lines, then the total); V2 now asserts the line counts; P2 reuses
`collectHarnessTestNames` with a check that fails when skipped; P3/P4 anchored to
`:645` and `:661`; P6 fixes the corpus to one row per finding with named
columns; two new grep rows for the done-bar prose items; V6 marked
informational; the corpus-grouping question moved to §9 Resolved; the
warning-total drift verified independent of `proofreadTotal` (`:2349`).

**This is the skill's cap: a stage that fails twice escalates rather than
loops.** The re-audit findings above are all applied, but they are applied by
the parent, not certified by a reviewer. The gate stays blocked until the user
authorizes one more readiness pass or accepts the residual risk in writing.

# Stage 5 — authorised third pass (cap override)

Reviewer: `review` subagent, fresh context
Artifact: `plan.md` · sha256 `1ee92fb2…87e789` (verified)
Reads: 9/10

```
stage 5: 2 blockers, 6 majors, 4 nits
independent-review FAILED. plan.md — 6 reviewers, 5/5 stages
```

## The two Blockers, and whether they hold

1. **V2's detail assertion cannot isolate the new lines.** The plan's line
   format is `WARNING: <REQ> — <T-ID> …`, and V2 expects
   `grep -c '^WARNING: REQ-'` = 10. Verified against a live run: **160**
   pre-existing lines match that prefix (`WARNING: REQ-280b: 2/3 sentences
   passive (67%)` etc., emitted through `validate.ts:2314` from ambiguity
   issues built at `:290`). The row fails a correct implementation and cannot
   detect a summary-only one. **Holds.**
2. **P2's wording collides.** "`gatherExercisedIds` becomes
   `collectHarnessTestNames()`" changes the type flowing into
   `checkImplCoverage` (`Set<string>` → `HarnessTest[]`). The intent was
   `new Set(collectHarnessTestNames().flatMap(t => t.all))`, signature
   unchanged. **Holds — a parent wording defect.**

Major #3 (REQ-cell index) does not hold as stated: the row splits to six cells
with index 5 empty after the trailing pipe, so "the last cell before the
trailing pipe" is index 4, which is what the plan says. The phrasing is
ambiguous, not wrong.

## Gate state

Three readiness passes, three FAILED verdicts. Per the authorised cap override,
**no further plan edits were made after this result.** The gate closes FAILED:
no stamp, no execution, no commit. The ROADMAP item remains open.

# Stage 5 — fourth pass

Reviewer: `review` subagent, fresh context
Artifact: `plan.md` · sha256 `e7e938d8…70c71` (verified)
Reads: 10/10

```
stage 5: 2 blockers, 5 majors, 4 nits
independent-review FAILED. plan.md — 6 reviewers, 5/5 stages
```

Verified sound this pass: `REQ-EVIDENCE` appears nowhere under `scripts/` today,
so the token is unique; all three silent-failure modes (nothing produced, totals
without detail, detail indistinguishable from old output) are caught by V2;
REQ-012 truly cites T4 and is outside `INTENDED_GAP_REQS`; the `:645` append
point is the file's last export; the call-site census is exact.

Both Blockers were gaps in §8 for items §4 promised, not design defects:

1. The `T553` ROADMAP section had no verification row (`check-roadmap` validates
   shape, not presence).
2. V7 could not tell "replaced" from "deleted", so a bare deletion passed.

Majors: V2's named pair had no established rank (sort direction unstated); P4's
anchor `:661` lands inside an existing test body (ends `:673`); P1's
"same title-resolution count" had no recorded baseline; V1's total cannot
distinguish six arbitrary tests from the enumerated inventory; P7 kept a live
contingency branch.

## Parent response (cycle 7, sha256 `1d1a932c…fc14a1`)

All eleven applied: sort direction pinned with the measured head (`REQ-002` line
1, `REQ-012` line 2); P1's check now asserts the literal
`PASS: Every harness title ID resolves to the Appendix F catalogue`; P4 anchored
after `:673`; V7 asserts the replacement sentence **and** its absence-form, with
V7a for the `T553` section; V1 enumerates the six case names; P7's contingency
became a stop condition; V8 covers any fs spelling; P2's check became a runnable
`sed … | grep -c`.

**Four cold passes, four FAILED verdicts, every finding applied.** The design has
not changed since pass 2; passes 3 and 4 found verification-strength holes only.

# Stage 5 — fifth pass

Reviewer: `review` subagent, fresh context
Artifact: `plan.md` · sha256 `1d1a932c…14a1` (verified)
Reads: 12 (10-tool budget plus greps)

```
stage 5: 4 blockers, 5 majors, 5 nits
independent-review FAILED. plan.md — 6 reviewers, 5/5 stages
```

## The Blockers

1. **A content error of mine.** The ROADMAP replacement sentence says "122
   unlinked citations, **99 of them outside** the intended-gap exemption" — §2
   measures 99 **inside** and 23 outside. Written literally, the increment would
   insert the same defect class it exists to remove, and V7 cannot tell (both of
   its greps are satisfied by the inverted sentence).
2. **V2's named pair is not derivable from the document.** §2 carries only
   aggregates; the identity of the 23 outside-gap findings appears nowhere, so a
   correct implementation whose set differs fails V2 with nothing to fix. The
   within-REQ comparator is also unpinned while the 10-line cap makes the
   printed set order-sensitive.
3. **The register row can be skipped silently.** `checkReviewFindings`
   (`register-checks.ts:64-69`) iterates *existing* rows; an absent row produces
   no finding, so V4 passes with the done-bar item unmet.
4. **V1's grep depends on test names the plan never fixes**, and its own count
   is self-inconsistent ("names all six" then enumerates five).

## Majors

`desc` precedence silently flips for the duplicated `T553` (first-wins would
change what `:1712` consumes; today's parser is last-wins); the 300→323 aggregate
is stated but unread by any row; P2's `sed` range is line-shift fragile; the
deletion of `parseAppendixFReqTests` has no row; "one commit" has no row.

## Gate state — STOPPED

Five cold passes, five FAILED verdicts. Per the commitment made when the fifth
pass was authorised, **no further plan edits were made after this result**. The
artifact is unexecuted and uncommitted, so the inverted sentence cannot reach a
tracked surface.

**Observation for whoever resumes:** the findings are not shrinking (2, 3, 2, 4
blockers). Each round's fixes enlarge the document — 10 phases, 10 verification
rows, and roughly 30 falsifiable claims — and every pass re-audits the whole
surface. The next move is a scope decision, not another edit.
