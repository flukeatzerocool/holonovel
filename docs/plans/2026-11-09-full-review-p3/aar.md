# AAR — full-review sweep, chunk P3 (§5.4 decision workflows)

**Date:** 2026-11-09 · **Scope:** chunk P3 (§5.4, 32 REQs), three P0 fixes, one
baseline anchor repair, register/roadmap write-back. **Plan:**
`docs/plans/2026-11-09-full-review-p3/plan.md` (sha256 `395f1829…`), cold
reviewed (1 blocker, 5 majors, 4 minors; re-review PASSED).

## What happened

1. Baseline measured: tree clean at `48a3867`, `check:fast` 37/37 PASS,
   `npm run check` PASS, and the six §5.4 harnesses green (`test:workflow` 13,
   `test:character-creation` 12, `test:output-contracts` 338,
   `test:backfill` 78, `test:lean-narrator` 10, `test:persistence` 41).
2. D5–D11 recorded; the split (P3 = §5.4; P3b = §5.6) applied to the worklist and
   the roadmap, and the 32 REQs partitioned into two clusters (19 + 13).
3. Code side reviewed against the REQ bodies — `respond_decision` (`:3290-3572`),
   `parseDecisionOptions`/`needInput`, `manage_scene (action: choices)`,
   `spec_health` pending-workflow payload, `checkWorkflowStaleness`, and
   `manage_character create`.
4. Three P0 defects found and fixed, with T32/T635 assertions widened. A fourth
   P0 — 19 stale holosuite anchors — surfaced from `test:all` and was fixed as
   the C0 baseline commit.
5. Five findings scheduled, register rows written under a dated subsection,
   roadmap bullets re-scoped to P3b/P4–P8/M1 plus the two new §5.4 items, and
   the sweep trigger advanced to P3b.

## What went right

- The cold pass caught a real blocker before execution: the plan said "record
  Q1–Q7 as D1–D7" while the worklist already held D1–D4. Executing that
  literally would have overwritten the program's standing decisions.
- The plan's Phase 1 step 4 named the character-creation completion branch as a
  candidate partial drain. It was a true finding (F-P3-3), found by following the
  plan rather than by luck.
- Splitting P3 before execution kept the verdict table at 32 rows; the full
  §5.4+§5.6 chunk (297 rows) would not have closed in one session.

## What went wrong

- Phase 0 ran six named harnesses but not `test:all`, so the red holosuite
  baseline surfaced only after the source edits, when anchor drift had doubled
  (7 failing anchors became 19 stale). The plan's Phase 0 should have run
  `test:all` — it is the suite that gates CI and pre-push.
- The first plan draft claimed "every cited token exists in a harness"; the cold
  pass showed REQ-104c's T103 does not, and T38 is Manual. The lesson repeats
  P2's: enumerate kinds and existence per REQ, never as a blanket claim.
- `parseDecisionOptions` had been asserting nothing for two releases while T635
  passed on "options non-empty, cancel present" — the narrow-assertion class the
  sweep exists to find.

## Findings and dispositions

| Finding | Disposition |
|---|---|
| F-P3-1 structured option set mangled (REQ-042b/191/548d) | P0 **Resolved**; T32 + T635 widened |
| F-P3-2 step-by-step equipment answer discarded (REQ-152a) | P0 **Resolved** |
| F-P3-3 partial drain on error paths (REQ-190) | P0 **Resolved** |
| F-P3-4 19 stale holosuite anchors, suite red | P0 **Resolved** (C0 baseline commit) |
| F-P3-5 end-Novel disposal not audited (REQ-140) | Scheduled-roadmap — §5.4 remediation |
| F-P3-6 creation equipment source/absent shape (REQ-152a/b) | Scheduled-roadmap — §5.4 remediation |
| F-P3-7 formula failure not a named creation error (REQ-399b) | Scheduled-roadmap — §5.4 remediation |
| F-P3-8 REQ-104c cites Automated T103 with no harness | Scheduled-roadmap — §5.4 citation repair |
| F-P3-9 drain-atomicity fix has no in-tree assertion | Scheduled-roadmap — §5.4 remediation |

## Gates

`assemble` · `check:fast` 37/37 · `check` PASS · `test:all` 54/54 ·
`check-roadmap` · `check-registers` · `check-loop-artifacts` · `build-order`.

## Next

Chunk P3b (§5.6, 265 REQs) is the sweep's next chunk and needs its own plan; it
is roughly eight clusters and may split again. The two §5.4 roadmap items are
independent of the sweep and can run in any order.

LOOP PAUSED
