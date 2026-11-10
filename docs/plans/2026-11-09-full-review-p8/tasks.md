# Tasks — full-review sweep, chunk P8 and the closing M1 re-run

Increment: `docs/plans/2026-11-09-full-review-p8/`
Plan: `plan.md` · Tracker: `docs/plans/2026-11-09-full-review-sweep/worklist.md`
Status: in progress · Terminal token lands in `aar.md`

## Phase 0 — Baseline

- [x] T1 Create `tasks.md` and a provisional `aar.md` (`LOOP OPEN`).
- [x] T2 Run `npm run check:fast` and `npm run check` un-piped; record the trailing line.
- [x] T3 Run `npm --prefix holonovel run test:all`; record the harness summary.
- [x] T4 Record `git status --porcelain`, HEAD, and `origin/main..HEAD`.
- [x] T5 Confirm the increment directory is not gitignored.
- [x] T6 Record Q1–Q10 as D101–D110; correct the worklist's stale P8 row.
- [x] T7 Re-derive 166 REQs / 113 family rows and the bucket split.

## Phase 1 — Code side (read-only review)

- [x] T8 Enumerate the seven cognition modules, the three handlers, and the §5.12 derivation.
- [x] T9 Review cluster A (§5.12, 84 REQs / 31 rows).
- [x] T10 Review cluster B (§5.25 + §5.27, 24/24).
- [x] T11 Review cluster C (§5.26, 21/21).
- [x] T12 Review cluster D (§5.32 + §5.33, 15/15).
- [x] T13 Review cluster E (§5.34 + §5.35, 22/22).
- [x] T14 Open every cited harness and record exercise, not token presence.
- [x] T15 Record 166 REQ verdicts, nineteen behaviour rows, five cluster verdicts.

## Phase 2 — Spec side (citation resolution)

- [x] T16 Resolve every `_Check:_` citation for the 166 rows; classify kind.
- [x] T17 Record `Automated` tokens with no exercising harness as findings.
- [x] T18 Fill bucket and verdict columns for all 166 rows.
- [x] T19 Regenerate the coverage register only on a body/bucket change; record the outcome.

## Phase 3 — Triage, registers, roadmap, artefacts

- [x] T20 Triage findings P0–P3; apply a bounded in-session P0 fix if any.
- [x] T21 Write `spec/audit/review-register.md` rows per the register write-back table.
- [x] T22 Update `ROADMAP.md`: remove the shipped sweep section; add remediation sections if scheduled.
- [x] T23 Write the `CHANGELOG.md` heading and bullets.
- [x] T24 Update the worklist status table with the outcome branch.
- [x] T25 Replace the provisional `aar.md` with the execution record and its LOOP token.

## Phase 4 — Closing M1 machine-evidence re-run

- [x] T26 Run `check:conformance`, `fmea`, `graph-deps`; archive output.
- [x] T27 Record the summary as a Delta amendment in `worklist.md`.

## Phase 5 — Verification and commit

- [x] T28 Run the verification table un-piped; record every exit status.
- [x] T29 Mark the build gate and commit through `npm run session:close`.
