# Tasks — Full-review sweep, chunk P4 (persistence and the §5.19 cross-check)

Derived from `plan.md` (same directory). Check an item only when its evidence is
recorded in `worklist.md` or the AAR. Done bar is `plan.md` § Done bar.

**Executed 2026-11-09.** All items complete; evidence in the worklist's chunk P4
section and `aar.md`.

## Phase 0 — Baseline

- [x] T0.1 `npm run check:fast` — 37/37 PASS.
- [x] T0.2 `npm run check` — PASS (0 errors).
- [x] T0.3 `npm --prefix holonovel run test:all` — 54/54 PASS.
- [x] T0.4 Tree clean at `5f941e4`; only this increment's directory untracked.
- [x] T0.5 `git check-ignore` returns nothing (trackable).
- [x] T0.6 D44–D51 recorded in the sweep `worklist.md`.
- [x] T0.7 Plan-gate evidence sidecar recorded by `preflight`.
- [x] T0.8 Nine §5.19 REQs / eight family rows re-derived; all bucket C.

## Phase 1 — Code side (read-only)

- [x] T1.1 Surface enumerated with `file:line` anchors (worklist chunk P4).
- [x] T1.2 Cluster A reviewed — holds (P3 note F-P4-10).
- [x] T1.3 Cluster B reviewed — findings F-P4-4, F-P4-9.
- [x] T1.4 Cluster C reviewed — findings F-P4-1 (fixed), F-P4-2, F-P4-8.
- [x] T1.5 Cluster D reviewed — findings F-P4-3, F-P4-6, F-P4-7.
- [x] T1.6 Every cited harness opened and checked against its REQ.
- [x] T1.7 Atomicity and failure paths verified (temp/fsync/rename, rotation,
      restore guard, no-valid-backup path, trash move, retention).
- [x] T1.8 `data-dir.ts` verified (precedence, legacy, per-OS, 0700, traversal,
      slug grammar) — holds.
- [x] T1.9 Tables recorded: 9 §5.19 rows, 15 behaviour rows, 4 cluster verdicts.

## Phase 2 — Spec side (citation resolution)

- [x] T2.1 Own `_Check:_` resolved; family citations inherited where absent.
- [x] T2.2 Citation kind classified before counting a missing harness.
- [x] T2.3 No finding raised from `check:conformance -- --dedicated` alone.
- [x] T2.4 Bucket and verdict columns filled for all nine rows.

## Phase 3 — Triage, registers, roadmap, artefacts

- [x] T3.1 Triage applied; the P0 fixed in-session, P1 scheduled, P3 closed.
- [x] T3.2 Register rows written (Resolved, Scheduled-roadmap, Closed-P3).
- [x] T3.3 Roadmap: sweep trigger advanced to chunk P5; one remediation section
      added naming every scheduled REQ.
- [x] T3.4 Changelog dated heading and bullets added.
- [x] T3.5 AAR finalised with `LOOP PAUSED`; worklist status updated.
- [x] T3.6 Commit gates run; commit pending (`npm run session:close`). No push.
