# Tasks — Full-review sweep, chunk P6a (world model and the adapter seam)

Derived from `plan.md` (same directory). Check an item only when its evidence is
recorded in `worklist.md` or the AAR. Done bar is `plan.md` § Done bar.

**Status:** executed 2026-11-09. All items complete; evidence in the worklist's chunk P6a section and `aar.md`.

## Phase 0 — Baseline

- [x] T0.1 `npm run check:fast` un-piped; `check:fast: PASS` (37/37).
- [x] T0.2 `npm run check` un-piped; record 0 errors or land the red-baseline branch.
- [x] T0.3 `npm --prefix holonovel run test:all`; record per-harness summary.
- [x] T0.4 Record `git rev-parse --short HEAD` and the untracked-only status.
- [x] T0.5 `git check-ignore -v docs/plans/2026-11-09-full-review-p6a/` returns nothing.
- [x] T0.6 D61–D70 recorded in the sweep `worklist.md`.
- [x] T0.7 Plan-gate evidence sidecar recorded by `preflight`.
- [x] T0.8 107 REQs / 36 family rows and their buckets re-derived; mismatch stops the run.

## Phase 1 — Code side (read-only)

- [x] T1.1 Surface enumerated with `file:line` anchors (worklist chunk P6a).
- [x] T1.2 Cluster A (model, kinds, resources) reviewed.
- [x] T1.3 Cluster B (parser, verbs, movement) reviewed.
- [x] T1.4 Cluster C (conversion, containment, coupling) reviewed.
- [x] T1.5 Cluster D (handler surface, ruleset-free mode) reviewed.
- [x] T1.6 Every cited harness opened and checked against its REQ.
- [x] T1.7 Model/resource, parser, conversion, and handler invariants verified.
- [x] T1.8 Tables recorded: 107 REQ rows, behaviour rows, 4 cluster verdicts.

## Phase 2 — Spec side (citation resolution)

- [x] T2.1 Own `_Check:_` resolved; family citations inherited where absent.
- [x] T2.2 Citation kind classified before counting a missing harness.
- [x] T2.3 No finding raised from `check:conformance -- --dedicated` alone.
- [x] T2.4 Bucket and verdict columns filled for all 107 rows.

## Phase 3 — Triage, registers, roadmap, artefacts

- [x] T3.1 Triage applied: P0 fixed in-session, P1 scheduled, P2 only on a demonstrated failure, P3 closed.
- [x] T3.2 Register rows written (Resolved, Scheduled-roadmap, Closed-P3).
- [x] T3.3 Roadmap: sweep re-scoped to P6b/P7 and P8/M1; trigger advanced to P6b.
- [x] T3.4 Changelog dated heading and bullets added.
- [x] T3.5 AAR finalised with its LOOP token; worklist status updated.
- [x] T3.6 Commit gates run; commit via `npm run session:close`. No push.
