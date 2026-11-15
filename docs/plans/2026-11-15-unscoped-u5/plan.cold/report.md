# Cold pass — U5 roadmap-closure plan

Reviewer: independent-review (fresh child context, no authoring context)
Depth: standard · Artifact reviewed: `plan.md` sha256 `8c406ca4…bb36cf4e` (411 lines)
Reads used: 21/40 · Verdict: `independent-review FAILED.`

## Blockers

1. **Done bar forbids the ROADMAP edit the disposition policy requires.**
   `plan.md:390` ("ROADMAP.md still holds two sections; Phase 1 removes nothing")
   contradicts `plan.md:150-152,160,356` and `tasks.md:59`, which schedule
   non-prose findings on `ROADMAP.md`. `scripts/check-roadmap.ts:163-181` also
   requires a `**Trigger:**` line, which the plan never mentions.
2. **The 44-row budget under-covers its prose surfaces.** §9 is 68 lines
   (`plan.md:46`) but `:64-68` is unassigned; `spec/07-independent.md:1-9` and
   `:121-127` are unassigned. The bar is a row *count*, so unreviewed paragraphs
   pass it.

## Majors

3. "Four exit clauses" (`plan.md:31,385-386`) against three in
   `worklist.md:250-252`; the anchor `:251-253` is off by one.
4. Two verification commands cannot pass: `wc -l review.md` and
   `grep -c '^| '` both over-count a 46-line table.
5. The blast-radius table and the "read but not changed" list between them omit
   ten row subjects (`push-pipeline.sh`, `publish/*.ts`, `weekly.ts`,
   `loop-audit.ts`, `session-close.ts`, `publish.yml`, `docs/plans/README.md`, …).
6. §10's exit clause has no disposition class and cannot be evidenced with the
   mandated `file:line` anchor, because the review skills live outside the repo.
7. Phase 4 budgets "eight asset rows" over five enumerated sources.
8. The gate set silently changes `check-registry` (worklist) to `check-registers`
   (plan) without recording it as a finding or amendment.

## Nits

9. `plan.md:269` cites the re-measurement trigger as `ROADMAP.md:44-46`; `:44` is
   the previous bullet's tail.
10. `check-traceability` was described as covering "E against the REQ set"; the
    gate parses `| REQ-` rows in the server `DECISIONS.md`.
11. Done-bar headings do not match the `**Done bar:**` marker that
    `scripts/lib/loop-artifacts.ts:92-97` tests.
12. Done-bar item 1 accepted `LOOP OPEN`, which `session:close` refuses.
13. Fingerprint anchors: `PACKAGE_SECTIONS` is `:27`, `DATA_SECTIONS` `:37-43`.
14. Phase 2 uses corrected appendix anchors (`:974/:1084/:1123`) over the
    worklist's `:970/:1080/:1119` without recording the correction.
15. Anchor granularity differs between `plan.md` and `tasks.md` for §10 and for
    U4's exit-evidence range.

## Unknowns recorded by the reviewer

- Artifact hash and git state could not be reproduced (shell denied at that
  stage); the plan hash was taken as given.
- Register line numbers (`:12,2787,2810,3244`) were not spot-checked.
- Verified correct: `plans/*` is gitignored; `assemble` writes both copies;
  `check-registers` does cross-reference `Scheduled-roadmap` rows to ROADMAP;
  all ten `V.N` anchors and both ROADMAP ranges are exact; `worklist.md:95` is
  the U5 status row; the pairs-vs-commits unit mismatch is real.
