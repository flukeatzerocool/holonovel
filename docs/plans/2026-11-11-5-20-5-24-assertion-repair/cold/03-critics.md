# Stage 3 — critics (cold)

Reviewer: three fresh `review` subagents (design, structural, style), read-only,
artifact sha256 cd4f1190…

Counts: Blockers 2 (one design, one design), Majors 22, Nits 17.

Accepted and fixed in the revision:

1. [Blocker][design] T640's boots had no per-boot Novel/badge setup (fresh
   `DATA_DIR`, Editor briefing without an active Novel). Fixed: each boot
   creates a Novel, sets its badge, pins `TTRPG_AI_ROLE: ""` and
   `TTRPG_GUIDANCE_PROFILE: "full"`.
2. [Blocker][design] Deleting the F-P5-7 bullet empties its
   `### … chunk P5` group. Fixed: D8 deletes the heading too; the moved bullet
   drops its "Scheduled under ROADMAP …" sentence.
3. [Major] D5a left `unhashed_checkpoints` claiming clean. Fixed: the clean arm
   requires an empty `unhashed_checkpoints`.
4. [Major] D5a's T716 justification was wrong (T716 appends an event). Fixed:
   its entry carries a digest.
5. [Major] REQ-603 missing from the coverage bar. Fixed: REQ-603 added, and the
   T713 row records the cross-match.
6. [Major] `report.clean` meaning unverified. Fixed: the exact composition is
   cited (`index.ts:10206`).
7. [Major] T550's expected JSON path and the admit union were unstated. Fixed:
   `records[0].source_ordinals` = `[1]`, citing `:9003-9011`.
8. [Major] The pre-fix red run stashed the fix with no restore. Fixed by
   reordering: assertions (Phase 2) → red run (Phase 3) → code fixes (Phase 4).
9. [Major] `independent-review.md` had no producing step. Fixed: Phase 0 states
   it is the plan-review cold artifact, written before execution.
10. [Major] T545's fresh-run leg does not exercise replay. Fixed: the label is
    a regression guard and T545 adds a `replay (to_event: 2)` observation.
11. [Major] `test-persistence` was asserted but never run. Fixed: added to the
    verification table and the edge cases.
12. [Major] T727's insertion point and the `Ann`/`Ben` id source were unstated.
    Fixed: end of the second block, ids captured at creation, exact scene
    sequence.
13. [Major] Two conflicting dispositions for a pre-fix failure. Fixed: done bar
    9 governs; the edge case now defers to it.
14. [Major][clarity] "Five are assertion-only" contradicted the two code fixes.
    Fixed: four are assertion-only.
15. [Major][clarity] "Two bold matrix rows" contradicted three changed cases.
    Fixed: three bold rows, and done bar 8 names three.
16. [Major][clarity] REQ-135 vs REQ-135b drift. Fixed: REQ-135b for tier 1,
    REQ-135a implicitly for the budget.
17. [Major][clarity] "Run §6" was ambiguous. Fixed: "the Section 6 table".
18. [Major][clarity] Done-bar item 5 was swallowed by item 4. Fixed.
19. [Major][clarity] `T712` named two different tests. Fixed: the persistence
    case is qualified.
20. [Major][clarity] The preamble premise in done bar 8 was self-contradictory.
    Fixed: the stop condition now says the token would already be outside the
    preamble.
21. [Major][clarity] "stash the Phase 2 edit" had no pathspec. Fixed by the
    phase reorder (no stash).

Accepted as nits and applied: register bullet/row vocabulary unified to
"bullet"; budget unit stated once as characters; blast radius lists the D5a
edit; the empty-group heading deletion; the T713 filename lookup reuses T714's
`readdirSync` pattern; the version-sync row names the `index.ts` constant.

Rejected / recorded instead:

- Seven extra boots leak temp dirs: accepted and recorded (no tracked state).
- Absolute gate counts (12/10/30/13) are kept as baselines recorded in Phase 0;
  done bar 13 states the delta as "one fewer".
- The brittle grep rows stay as advisory proxies beside the harness assertions.
