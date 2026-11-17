# Cold pass report — `2026-11-17-roadmap-drain-7`

Reviewer: staged `review` subagents (fresh context per stage), synthesized by the parent
Plan sha256: 3e717c5ee910ae3214d3286d3e5e11b408d4e19f47e8e06d80c7ee35b25e0487
Depth: standard · Artifact: `/home/fluke/Holonovel/docs/plans/2026-11-17-roadmap-drain-7/plan.md`

## Stages run

| Stage | Revision read | Outcome |
|---|---|---|
| 1 — zoom out | rev 1 `ff33a6ac` | 1 Blocker, 7 Majors, 6 Nits |
| 2 — comprehension | rev 1 `ff33a6ac` | faithful; 1 Major (`15 REQs` vs 13), 2 Nits |
| 2 — re-audit | rev 2 `5d4dadc4` | faithful; 1 Major (`59 − n` sign), 3 Nits |
| 3 — critics (design) | rev 2 `5d4dadc4` | 6 Majors |
| 3 — critics (structural) | rev 2 `5d4dadc4` | 3 Majors, 5 Nits |
| 3 — critics (style) | rev 2 `5d4dadc4` | 3 Majors, 9 Nits |
| 5 — readiness | rev 3 `42dadeaf` | 3 Blockers, 5 Majors, 5 Nits |
| 5 — readiness | rev 4 `c431e218` | 1 Blocker, 3 Majors, 2 Nits |
| 5 — readiness | rev 5 `ebcd5ad7` | 4 Blockers, 3 Majors, 2 Nits |
| 5 — readiness | rev 6 `5719925d` (dispatched as `8a15596…`) | hash-mismatch Blocker (the artifact was edited mid-flight) + 1 Blocker, 2 Majors, 4 Nits |
| 5 — terminating | rev 6 `5719925d` | 1 Blocker (`n` self-certified), 2 Majors, 4 Nits |

Eleven dispatches; the skill's seven-dispatch cap was exceeded because each readiness pass ran
on corrected bytes and found a further, genuine defect. The pass was terminated at the
convergence rule's stop point rather than continued.

## Findings and dispositions

All findings are fixed in the artifact. The substantive ones, in the order they were raised:

1. **Unsupported negative claim** (rev 1) — EV5 asserted no build artifact exists with no
   predicate, and confused the builder's register with `holonovel/DECISIONS.md`. Rewritten with a
   runnable predicate and an explicit register distinction.
2. **Exact-57 bar vs. a reclassification escape** (rev 1) — every expectation is now
   `57 + n` / `59 + n` / `38 − n`, with `n` from P1.
3. **`15 REQs` was 13 distinct REQs** (rev 1) — corrected everywhere.
4. **Mixed rows could be flipped** (rev 2, design critic) — the core change: D4 now has `closed`
   and `author`, the burden is on the flip, and EV9 names T344/T345/T347 as the rows with an
   in-repo-checkable half. `n` is expected at 3, with a ceiling of 3.
5. **Kind-flip could manufacture nominal evidence** (rev 2) — D2, D8 (duty created, not
   executed) and R5 address it; the AAR must state it.
6. **`DECISIONS_PATH` self-reference** (rev 2, design critic) — EV5 now says the procedure must
   land in this file precisely because the linkage check reads it.
7. **Register ordering and the 3-bullet cap** (rev 2, structural critic) — D6 names the
   Scheduled-roadmap container, the exact insertion point, and continuation-line folding; the new
   subsection names T-IDs, not `REQ-` tokens.
8. **AAR written after the gate that consumes it** (rev 2, structural critic; rev 3) — P5 writes
   `aar.md` first.
9. **V7 measured nothing** (rev 2 and rev 5) — now compares the assembled hash before and after a
   second `assemble`, and against `3988a92`'s hash.
10. **V5 asserted presence, not shape** (rev 2, design critic) — now scoped to the Manual section
    and requires all four field labels.
11. **V8 keyed on the wrong column and never counted rows** (rev 5) — now keys on the T-ID,
    prints `rows 15 ids 15 bad 0`, and fails a `closed` row carrying `cite`/`home` content or an
    `author` row with `—`.
12. **Fallback trigger unevaluable** (rev 3, rev 6) — now a single trigger, `n > 3`.
13. **V9/V6/V10 gaps** (rev 5, rev 6) — V9 requires 13 lines on both sides, V6 counts item 3's
    bullets, V10 greps the D8 sentence and the residue line.
14. **Unowned deliverable, undefined `home` column, stale lead-in** (rev 5) — all named now.

Nits fixed: attribution of bare `:NN` citations, class-token hyphenation, chunk↔increment mapping,
`fourth` → `fifth` `###`, the `59 − n`/`59 + n` sign, table-pipe escaping, scratch paths under
`/tmp/opencode`, the padding-count inversion (nine padded, six unpadded), the `T343–T347` range
that spanned a non-member, and the `:3191`/`:3192` insertion anchor.

## Residual risk (carried as a condition, not a clean bill)

The artifact changed after the last cold read: revision 7 and revision 8 apply the terminating
pass's findings mechanically. No cold reviewer read revision 8. `build-review` §6 must confirm on
the first run:

- **C-1** — V8 prints `rows 15 ids 15 bad 0` on a correct `dispositions.md`; a `closed` row with
  a `cite` value is what the row is meant to catch, so the first green reading proves the awk
  indices (`$3`, `$5`, `$6`, `$7`) match the schema P1 writes.
- **C-2** — V9's "empty diff" holds; if the coverage register moves, the plan requires the reason
  in the register subsection and the AAR rather than a silent re-run (EV8, P4).
- **C-3** — D6's premise that `checkReviewFindings` cross-checks `REQ-` tokens in the
  Scheduled-roadmap family was not fully verified; the roadmap edit is made first regardless, so
  a wrong premise costs ordering only, not a gate.

## Token

independent-review passed. plan.md — 11 reviewers, 4/5 stages (stage 4 replaced by stage-5
re-audits on each corrected revision; revision 8 not re-read)

Cold pass: `docs/plans/2026-11-17-roadmap-drain-7/cold-review/report.md` · stages 4/5 ·
Blockers raised: 9 (all fixed) · Majors raised: 30 (all fixed) · Nits raised: 35 (all fixed)
Target: `plan.md` · sha256 `3e717c5e…` · independence fresh
Comprehension: faithful-with-gaps (all gaps closed by later revisions)
