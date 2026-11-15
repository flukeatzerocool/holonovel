# After-action report — Secret relationship recommendations (REQ-234b, REQ-234d)

AAR: SUCCESS — both clauses are implemented, GM-scoped, and asserted; the increment is
green on every gate and the roadmap P1 item is retired.

## 1. What was supposed to happen

Close the only actionable `ROADMAP.md` item (P1) by implementing REQ-234b's `suspicious`
recommendation and REQ-234d's `rival` recommendation, surfacing them in the Game Master
briefing only (REQ-234c), asserting them in the T274 harness row, and retiring the roadmap
section and register row. The P2 re-measurement is date-gated to 2026-11-28 and was out of
scope. The plan was reviewed at standard depth (cold pass plus a v2 re-review plus a v3
delta re-review) and stamped `kind: planned`, `independence: fresh`.

## 2. What happened

1. Baseline recorded: `check:fast` 45/45, `test:narrative` 84/84, `check-registers` clean.
   Adding the increment directory made `check-loop-artifacts` red for its missing `aar.md`;
   a provisional AAR restored green before the first edit.
2. Phase A: `secretRelationshipRecommendations` in `core/relationships.ts`; the T274
   gate-decisive probe written first and observed red (FAIL: expected "Relationship
   suggestion:"); then the GM-only `narrative_threads` line. `typecheck` exit 0;
   `test:narrative` 84/84. Commit `c560a1d`.
3. Phase B: the three-fixture matrix, exact-pair negatives, Player/Observer negatives,
   reverse-order suppression, and `secrets://active` assertions; Appendix F T274 row;
   `assemble`, G7 regeneration, `check:fast` 45/45. Commit `2f294d8`.
4. Phase C: U6-F5b relocated to a dated `## Resolved` section, P1 roadmap section removed,
   CHANGELOG entry, `validate -- --write-register` (0 errors), `build-order`, strict
   validator 0 errors, `check-registers --strict` clean, `check-roadmap` OK,
   `check-anchors` current, `test:all` 56/56, `check:fast` 45/45.

Deviations, all recorded in the plan's Amendments section and `tasks.md`:

- **A-1** — the v2 re-review's B1 ("Phase A already implemented") was a working-tree read;
  `git show b1f5c4a:...` contains neither the export nor the line.
- **A-2** — the v2 re-review's B2 was real: the faction-to-faction negative assertion
  collided with the Phase A probe's legitimate Ash↔Grey line; corrected to the exact
  Salt Watch↔Ash Guild pair.
- **A-3** — EV4 pointer, holder-from-`known_by` wording, REQ-hit count, and step order.
- **A-4** — Phase A landed before the v3 stamp; the commit split was preserved with a
  stash of the Phase B spec edit so the pre-commit hook's assembly did not fold B into A.
- **A-5** — the entity-holder assertion names the resolved holder (`Eira`), not the id
  (`character_01`); the briefing renders names.

| Gate | Token | Verdict |
|---|---|---|
| plan-review | `plan-review passed.` | passed |
| independent-review | `independent-review passed.` (v1) then `FAILED.` (v2, B1 false positive + B2 real) then `passed.` (v3 delta) | passed after amendment |
| build-review | `build-review passed.` | passed |
| drift-report | not run — not a drift task | n/a |
| spec-review | not run — no specification-body change beyond the Appendix F test row | n/a |
| proofread | not run — no prose body edited | n/a |

## 3. What went right

- The probe-first step did its job: the assertion failed before the wiring and passed after
  it, so the Phase A gate could distinguish an empty detector from a working one.
- The re-review caught a genuine unsatisfiable assertion (B2) before it became a red test
  that would have looked like an implementation bug.
- The computed-not-persisted design held: no `state.ts` change, no clone/checkpoint/archive
  or §7.7 work, and the recommendation disappears once the GM sets the edge.
- Evidence anchors needed no repair: `check-anchors` was current on the first run.

## 4. What went wrong

- **The plan's v2 fixture assertion was wrong (B2).** The negative clause excluded lines
  that correct behavior emits. The cold re-review caught it; the remedy was a one-clause
  plan amendment plus a delta re-review.
- **The v2 re-review read the working tree as if it were HEAD (B1).** Phase A was already
  applied and uncommitted, so the reviewer concluded the plan's baseline was false. The
  reviewer cannot see git history; the parent's `git show` evidence settled it. This is a
  reviewer-input limitation, not a plan defect.
- **`mark-build` rejected a passing cold report** because the report named the v1 plan hash
  while the stamp bound v2. The chain needed a re-review whose report names the stamped
  hash — the third dispatch of the session.
- **`check-loop-artifacts` gated the increment before its AAR existed.** A provisional
  `LOOP OPEN` AAR was required to restore the baseline; the close rewrites it.
- **`changelog-before-commit` was not loaded** before the CHANGELOG entry was authored
  (recurrence of SK-18).
- **The pre-commit hook assembles the whole spec**, so the Phase B spec edit had to be
  stashed to keep the A commit clean. The plan's three-commit split survived, but only
  because of that manual step.

## 5. Session performance

- **Outcome vs done bar.** Met: `suspicious` and `rival` recommendations render for the GM;
  the Player and Observer briefings carry neither; reverse-order suppression works; T274
  and its Appendix F row name REQ-234b/REQ-234d; U6-F5b is `Resolved`; the P1 roadmap
  section is gone and P2 remains; `check:fast` 45/45 and `test:all` 56/56.
- **Scope adherence.** No new tool, action, resource, parameter, schema, or persisted state.
  `state.ts` and the tool surface are untouched.
- **Verification quality.** The red-then-green probe proves the assertion can fail. The
  suppression assertion targets the `Relationship suggestion:` prefix, not a bare type
  name that the REQ-236b marker could satisfy. Badge scoping is asserted on both non-GM
  badges.
- **Rework.** One re-review cycle plus one extra delta dispatch; one blocked commit
  (G7 stale from the assembled spec edit); one stash/unstash to preserve the commit split.
  No file was rewritten repeatedly.
- **Cost.** Three plan-review dispatches, two server-suite runs (`test:narrative` ×3 plus
  `test:all`), and one full `check:fast` per phase. The re-stamp cycle was the dominant
  avoidable cost (SK-16).
- **User intervention.** One decision: authorize the v3 amendment plus an extra delta
  re-review at the plan-review cap. No correction of the work itself.

## 6. Findings

- **F-1 — the v2 fixture assertion was unsatisfiable. Resolved 2026-11-15.** Fixed in the
  plan's A-2 amendment and asserted in T274; the delta re-review verified the corrected
  pair. P0 (would have produced a failing test on correct behavior), fixed in-session.
- **F-2 — the v2 re-review read uncommitted working-tree state as HEAD. Closed-P3,
  2026-11-15.** `git show b1f5c4a:holonovel/src/core/relationships.ts` and
  `holonovel/src/index.ts` yield zero matches for the detector and the line, so the plan's
  baseline statement was true. A reviewer-input limitation; no action on this repo.
- **F-3 — the delta re-review's Major 1 (a false EV4→D3 pointer) was non-blocking.
  Resolved 2026-11-15.** D3 now states the reveal-action → persisted-`known_by` reading and
  the holder-reporting rule (condition C-4 satisfied). P3, fixed in-session.
- **F-4 — the increment's AAR had to precede the gate that reads it. Closed-P3,
  2026-11-15.** `check-loop-artifacts` is part of `check:fast`; a provisional `LOOP OPEN`
  AAR restored the baseline. Recurrence of SK-12 (no new record).
- **F-5 — the stamp/re-stamp cycle for mechanical plan deltas. Closed-P3, 2026-11-15.**
  Three dispatches and three stamps for one increment; recurrence of SK-16 (no new record).
- **F-6 — `changelog-before-commit` was not loaded before the CHANGELOG edit. Closed-P3,
  2026-11-15.** Recurrence of SK-18; the entry follows the file's existing date-headed
  style. No new record (repeat miss).

No project action items remain. Skill findings: 0 SK records appended (all observations are
recurrences of SK-8, SK-12, SK-14, SK-16, and SK-18).

## 7. Loop status

No remediation was requested and no project action item remains. The P2 roadmap item stays
scheduled for 2026-11-28. The next plan comes from `ROADMAP.md` or a direct user request.

LOOP PAUSED
