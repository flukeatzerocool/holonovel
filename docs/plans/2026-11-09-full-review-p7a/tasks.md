# Tasks — Full-review sweep, chunk P7a (determinism and knowledge artifacts)

**Status:** complete · **Date:** 2026-11-09
**Plan:** `docs/plans/2026-11-09-full-review-p7a/plan.md`
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## Phase 0 — Baseline

- [x] T0.1 Run `npm run check:fast` un-piped; baseline **FAIL** —
      `check-loop-artifacts` rejected this increment directory for missing
      `tasks.md`/`aar.md`; 36 passed, 1 failed.
- [x] T0.2 Create `tasks.md` and a provisional `aar.md`; re-run `check:fast`:
      37 passed, 0 failed, `check:fast: PASS`.
- [x] T0.3 Run `npm run check`: `check: PASS`.
- [x] T0.4 Run `npm --prefix holonovel run test:all`: 56 passed, 0 failed
      (135.2s).
- [x] T0.5 Targeted harnesses: `test:corpus` 9/9, `test:index` 6/6,
      `test:graph` 5/5, `test:limits` 27/27, `test:supplementary` 4/4,
      `test:fingerprints` 12/12 — all reached by `test:all`.
- [x] T0.6 Record `git status --porcelain` (only this increment directory
      untracked), HEAD `8170ccc`, `origin/main..HEAD` = 17.
- [x] T0.7 Confirm `git check-ignore -v` returns nothing for the increment
      directory.
- [x] T0.8 Record Q1–Q10 as D81–D90 in the sweep worklist.
- [x] T0.9 Plan-gate preflight sidecar written; stamp `fresh`, standard depth.
- [x] T0.10 Re-derive 91 REQs / 55 family rows; buckets 49 C / 6 E. Match.

## Phase 1 — Code review (read-only)

- [x] T1.1 Enumerate exports and handler branches with `file:line` anchors.
- [x] T1.2 Cluster A review: determinism, safety, performance (§5.7).
- [x] T1.3 Cluster B review: content sources (§5.14).
- [x] T1.4 Cluster C review: knowledge corpus (§5.28).
- [x] T1.5 Cluster D review: semantic index and graph (§5.29–§5.30).
- [x] T1.6 Open every cited harness; record exercise, not token presence.
- [x] T1.7 Record 91 REQ verdicts, the 16-row behaviour table, four cluster
      verdicts.

## Phase 2 — Citation resolution

- [x] T2.1 Resolve every `_Check:_` citation for the 91 rows.
- [x] T2.2 Classify citation kind; three citation/behaviour findings recorded
      (F-P7a-1..3).
- [x] T2.3 Fill bucket and verdict columns for all 91 rows.

## Phase 3 — Triage, registers, roadmap, artefacts

- [x] T3.1 Triage findings P0–P3: no P0; three P1s scheduled.
- [x] T3.2 Write `spec/audit/review-register.md` Scheduled-roadmap rows.
- [x] T3.3 Update `ROADMAP.md`: sweep trigger to P7b; new §5.7 remediation
      section.
- [x] T3.4 Write the `CHANGELOG.md` dated heading and bullets.
- [x] T3.5 Update the sweep worklist status table and decisions D81–D90.
- [x] T3.6 Replace the provisional AAR with the execution record.
- [x] T3.7 Run the verification table; commit.
