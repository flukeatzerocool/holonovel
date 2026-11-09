# Tasks — full-review sweep, chunk P3b-3 (§5.6 adventure content)

**Plan:** `docs/plans/2026-11-09-full-review-p3b3/plan.md`
**Status:** draft, awaiting plan approval and the standard-depth cold pass. Check
a box only when the evidence is recorded in the worklist or AAR.

## Phase 0 — Baseline

- [x] T1 Run `npm run check:fast` un-piped and record exit status; run
      `npm run check` once and record the full-gate baseline. Fix a red baseline
      as C0, its own commit; if it cannot be fixed, land per the plan's
      red-baseline branch.
- [x] T2 Run `npm --prefix holonovel run test:all` and record the per-harness
      summary and exit status; confirm `test-adventure` and
      `test-output-contracts` are in the run.
- [x] T3 Record `git status --porcelain` (only the untracked increment directory)
      and `git rev-parse --short HEAD`.
- [x] T4 Confirm `git check-ignore -v docs/plans/2026-11-09-full-review-p3b3/`
      returns nothing.
- [x] T5 Record Q1–Q8 as D28–D35 in the sweep worklist. Do not renumber D1–D27.
- [x] T6 Record the external plan-gate preflight evidence sidecar beside the
      stamped artifact.
- [x] T7 Re-derive the 39-REQ / 11-family partition (15 + 8 + 11 + 5) and each
      family's bucket from `spec/audit/req-coverage.md`.

## Phase 1 — Code side (read-only review)

- [x] T8 Enumerate the cluster A surface with `file:line` anchors (module load,
      world-model population, annotation linking, codex target, catalog, discovery).
- [x] T9 Enumerate the cluster B surface with `file:line` anchors (build-time
      validation, drift detection, structural extraction, `spec_health` fields).
- [x] T10 Enumerate the cluster C surface with `file:line` anchors (overview and
      navigation resources, scene waypoint, briefing block, synthesis linkage).
- [x] T11 Enumerate the cluster D surface with `file:line` anchors (generate,
      replacement, coexistence, discard, `[generated]` tagging).
- [x] T12 Run the read-only `code-review` pass on cluster A and batch findings.
- [x] T13 Run the read-only `code-review` pass on cluster B and batch findings.
- [x] T14 Run the read-only `code-review` pass on cluster C and batch findings.
- [x] T15 Run the read-only `code-review` pass on cluster D and batch findings.
- [x] T16 Open every cited harness and confirm it asserts the REQ contract, not
      a substring; record a finding where it is narrower. Classify `T59`, `T60`,
      `T61`, `T206`, `T287`, `T368`, `T208`, `T209`, `T283` before calling them absent.
- [x] T17 Verify module load, pre-population, duplicate skipping, codex target,
      anchor addressing, and archive export/import by reading the implementation.
- [x] T18 Verify the catalog and discovery fields under both badges, including
      the genre filter and `indexed_adventures`.
- [x] T19 Verify validation, drift, and extraction: confirm whether a runtime or
      builder-side contract exists before recording `builder-side`.
- [x] T20 Verify the resources, waypoint, briefing labelling, transition hook,
      and synthesis augmentation presence/omission rules.
- [x] T21 Verify generated-adventure lifecycle, coexistence, briefing order, and
      discard semantics.
- [x] T22 Record one verdict per REQ (39 rows) and one cluster verdict per
      cluster in the worklist.

## Phase 2 — Spec side (citation resolution)

- [x] T23 Resolve every REQ's own `_Check:_` IDs; inherit the family set when
      absent; classify citation kind before counting a missing harness.
- [x] T24 Confirm every `Automated` token appears in a harness and that the
      harness body exercises the behaviour; treat `T0nn` shadowing as
      non-evidence (F-P2-4).
- [x] T25 Fill bucket and verdict columns for all 39 rows.

## Phase 3 — Triage and write-back

- [x] T26 Triage every finding per Q2 (P0 fix, P1 schedule, P2 demonstrated-only,
      P3 record-and-close) and apply the P0 fix guardrails.
- [x] T27 Write the review-register rows under the disposition section each
      finding names.
- [x] T28 Update `ROADMAP.md`: re-scope the sweep bullets to P3b-4/P4–P8/M1 and
      advance the trigger to chunk P3b-4, keeping the admission shape.
- [x] T29 Write the `CHANGELOG.md` dated heading and bullets.
- [x] T30 Replace the provisional `aar.md` with the execution record and the
      earned LOOP token; update the sweep status table.

## Phase 4 — Verification

- [x] T31 Run the plan's verification table un-piped and record each exit status.
- [x] T32 Run `npm run session:close` and report the commit list; no push.
