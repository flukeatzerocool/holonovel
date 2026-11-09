# Tasks — Full-review sweep, chunk P5 (engine loop, event stream, durable agent tasks)

Derived from `plan.md` (same directory). Check an item only when its evidence is
recorded in `worklist.md` or the AAR. Done bar is `plan.md` § Done bar.

**Executed 2026-11-09.** All items complete; evidence in the worklist's chunk P5
section and `aar.md`.

## Phase 0 — Baseline

- [x] T0.1 `npm run check:fast` — 37/37 PASS.
- [x] T0.2 `npm run check` — PASS (0 errors).
- [x] T0.3 `test:all` — red (2 Holosuite anchor findings); fixed as C0, then PASS.
- [x] T0.4 Tree clean at `110360e`; only this increment's directory untracked.
- [x] T0.5 `git check-ignore` returns nothing (trackable).
- [x] T0.6 D52–D60 recorded in the sweep `worklist.md`.
- [x] T0.7 Plan-gate evidence sidecar recorded by `preflight`.
- [x] T0.8 24 REQs / 23 family rows re-derived; all bucket C.

## Phase 1 — Code side (read-only)

- [x] T1.1 Surface enumerated with `file:line` anchors (worklist chunk P5).
- [x] T1.2 Cluster A reviewed — finding F-P5-6; narrow F-P5-7.
- [x] T1.3 Cluster B reviewed — findings F-P5-1, F-P5-3 (fixed).
- [x] T1.4 Cluster C reviewed — finding F-P5-2 (fixed).
- [x] T1.5 Cluster D reviewed — finding F-P5-4 (fixed).
- [x] T1.6 Engine-contract §2–§6 cross-check recorded.
- [x] T1.7 Every cited harness opened and checked against its REQ.
- [x] T1.8 Branch, eviction, ordinal, and terminal-task invariants verified.
- [x] T1.9 Tables recorded: 24 REQ rows, 31 behaviour rows, 10 verdict rows.

## Phase 2 — Spec side (citation resolution)

- [x] T2.1 Own `_Check:_` resolved; family citations inherited where absent.
- [x] T2.2 Citation kind classified before counting a missing harness.
- [x] T2.3 No finding raised from `check:conformance -- --dedicated` alone.
- [x] T2.4 Bucket and verdict columns filled for all 24 rows.

## Phase 3 — Triage, registers, roadmap, artefacts

- [x] T3.1 Triage applied; four P0s fixed in-session, three P1s scheduled, P3 closed.
- [x] T3.2 Register rows written (Resolved, Scheduled-roadmap, Closed-P3).
- [x] T3.3 Roadmap: sweep trigger advanced to chunk P6; remediation section added.
- [x] T3.4 Changelog dated heading and bullets added.
- [x] T3.5 AAR finalised with `LOOP PAUSED`; worklist status updated.
- [x] T3.6 Commit gates run; commit via `npm run session:close`. No push.
