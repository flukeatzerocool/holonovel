# Tasks — full-review sweep, chunk P3b-1 (§5.6 core state and lifecycle)

**Status:** draft, awaiting user approval · **Plan:**
`docs/plans/2026-11-09-full-review-p3b/plan.md`

Task IDs are stable; do not renumber. Mark `[x]` only when the evidence exists.

## Phase 0 — Baseline (no source edits)

- [x] T1 Run `npm run check:fast` un-piped; record the exit status and the
      `check:fast: PASS` line.
- [x] T2 Run `npm run check` once; record the exit status and the summary.
- [x] T3 Run the nine server harnesses named in the plan's Verification table;
      record each exit status.
- [x] T4 Record `git status --porcelain` and `git rev-parse --short HEAD`; confirm
      nothing untracked outside this increment.
- [x] T5 Confirm `git check-ignore -v docs/plans/2026-11-09-full-review-p3b/`
      returns nothing.
- [x] T6 Record Q1–Q8 as D12–D19 in the sweep `worklist.md` before review work.
- [x] T7 Record the plan-gate evidence sidecar beside the stamped artifact.
- [x] T8 Re-derive the 66-REQ partition (17 + 15 + 34) and each family's bucket;
      fix a mismatch in the worklist, never by silent re-scoping.

## Phase 1 — Code side (read-only review)

- [x] T9 Enumerate the surface with `file:line` anchors in the worklist: audit
      writer and call sites, snapshot/undo/redo stacks, the audit resource, the
      combat/condition/countdown/vow/recap dispatch cases, and the coupling
      paths.
- [x] T10 Review cluster A (audit, history, conflicts; 17 REQs) with the
      `code-review` lenses; batch findings.
- [x] T11 Review cluster B (combat and conditions; 15 REQs).
- [x] T12 Review cluster C (recap, orientation, clocks, vows; 34 REQs).
- [x] T13 Read each carrying harness and confirm it asserts the REQ's stated
      behaviour, not a narrower subset.
- [x] T14 Verify audit/undo/conflict guarantees against the implementation:
      entry content and timing, per-badge stacks, drain interaction, total
      conflict transitions.
- [x] T15 Verify countdown and vow arithmetic at boundaries and both coupling
      directions.
- [x] T16 Record one verdict per REQ in the worklist chunk P3b-1 table (66 rows)
      and a cluster verdict row per cluster (A–C).

## Phase 2 — Spec side (citation resolution)

- [x] T17 Resolve each REQ's own `*Check:*` IDs, inheriting family citations
      where absent; open every cited harness.
- [x] T18 Classify citation kind before counting a missing harness; treat
      zero-padded title tokens as shadowing, not evidence.
- [x] T19 Fill bucket and verdict columns for all 66 rows.

## Phase 3 — Triage, registers, roadmap, artefacts

- [x] T20 Triage every finding P0–P3 per D2/D13; fix P0 in-session or invoke
      the stopped-run landing.
- [x] T21 Run the pre-fix surface checks for any P0 (sibling contract, Appendix M
      limits, fingerprint regeneration per Q7).
- [x] T22 Write `spec/audit/review-register.md` rows under each used disposition
      section with the `### 2026-11-09 full-review sweep — chunk P3b-1` heading.
- [x] T23 Amend `ROADMAP.md`: bullets re-scoped to P3b-2…P3b-4/P4–P8/M1;
      trigger advanced to chunk P3b-2; admission shape preserved.
- [x] T24 Add the `CHANGELOG.md` dated heading and bullets.
- [x] T25 Replace the provisional `aar.md` with the execution record and its
      LOOP token; update the sweep worklist status table.
- [x] T26 Run the full verification table un-piped; commit C1 (and C0 first if
      the baseline was red); no push.
