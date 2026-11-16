# Stage 5 — readiness (attempt 2, slim plan)

Artifact `461bcc5f…c91218`, then re-read at `38146404…7ebde9`. Both FAILED.

## Findings

| Se | Finding |
|---|---|
| Blocker | `Finding[]` is an undefined symbol — no phase creates the type |
| Blocker | the `:2080` half of the marker rule has no phase |
| Blocker | case 7 tests output the pure function cannot emit (the NOTE is printed by `validate`) |
| Major | "Six named cases" vs a seven-item list |
| Major | "append at end of file" lands after `process.exit(0)` |
| Major | V5 does not verify "one dated" subsection |
| Major | register disposition form conflicts with `docs/plans/README.md` |
| Major | P2/P5/P6 carry no line anchors |
| Major | the new flag is outside the blast radius and leaves `AGENTS.md` stale |
| Major | rules with no case that can fail (de-dup, T-only, `kind:"none"`, last-wins) |

## Parent response (cycle 6, sha256 `3808d696…0bdc8`)

1. `LinkageFinding` is now a named export in P2's append list.
2. P2 gained `scripts/validate.ts:2080` and the `:2080` inline pair is replaced by
   `CHECK_MARKERS`.
3. The absent-`DECISIONS.md` NOTE is **gone**: the rule is skipped silently by
   passing `decisionsText: null`, so case 7 observes it in the pure function.
4. Heading says seven; insertion point is "before the summary/exit block at
   `:692`".
5. V5 pins exactly one `### 2026-11-15 REQ evidence linkage (P1)` heading.
6. The register structure was verified by reading it: `## Scheduled-roadmap`
   holds dated `###` subsections and no table rows (`:3085-3094`).
7. P2/P5/P6 anchored; `AGENTS.md`'s flag sentence added to the blast radius;
   de-dup/T-only folded into case 5; `kind:"none"` into case 3.
8. Derived numbers (72, 10, 422) now stated in §1.

# Stage 5 — re-audit (attempt 2, slim plan)

Artifact `3808d696…0bdc8`. Nine reads.

```
stage 5: 2 blockers, 4 majors, 4 nits
independent-review FAILED. plan.md — 6 reviewers, 5/5 stages
```

Verified this pass: every failure mode (a)–(d) is caught; V1's 72 = 65 + 7 is
derivable because `test()` prints `PASS <name>`; V2's 422 is derivable because
`warnings` is a counter and the baseline is 300; the proofread-register
comparison reads `proofreadTotal`, not `warnings`, so the 122 do not perturb it.

| Se | Finding |
|---|---|
| Blocker | the task list never creates `getDecisionsText`, which task 4 calls |
| Blocker | the "one definition of has-a-citation" rule has no observing check |
| Major | the `AGENTS.md` edit appears in the blast radius but in no phase |
| Major | `getDecisionsText`'s null branch is untested |
| Major | the register subsection's body content against the REQ-token rule is unspecified |
| Major | V7's expected value contradicts the sibling |

## Parent response (cycle 7, sha256 `32a21988…5d49528`)

1. `getDecisionsText` is **deleted as a symbol**: P4 inlines the guarded read, so
   there is no untested reader and no orphan task dependency (closes B1 and M4).
2. The marker rule now names **both** sites, `:183` and `:2080` — the grep found
   two, not one — and V3 asserts `= 0` against a baseline of 2.
3. `AGENTS.md` named in P6.
4. Register: heading carries no `REQ-…` token; **body prose may name** `REQ-284f`
   and `REQ-463`, because the gate scans rows and this entry is a subsection.
5. V7 reworded to "unchanged from baseline".
6. Nits: `warnings += findings.length`; case 5's fixture written out; derived
   numbers stated.
