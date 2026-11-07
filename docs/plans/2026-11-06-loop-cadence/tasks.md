# Tasks — Two loops, one cadence

1. [x] Phase 0 — `scripts/loop-audit.ts`, `--timing`/`--recorded`/`--list --format=md`
   in `run-gates.ts`, hook-event writer.
2. [x] Phase 0 — baseline captured: 672 commits, 107 sessions, 28 date drifts,
   33 pushes; `check:fast` 31 gates in 9.95 s.
3. [x] Phase 1 — `docs/plans/README.md`, `scripts/lib/loop-artifacts.ts`,
   `scripts/check-loop-artifacts.ts`, `scripts/session-close.ts`.
4. [x] Phase 2 — `scripts/lib/gate-run-manifest.ts`; hooks read the manifest;
   pre-commit runs the fast suite only; pre-push runs only what is left.
5. [x] Phase 2 — `scripts/lib/gate-manifest.ts`, `scripts/check-gate-table.ts`,
   generated AGENTS.md table.
6. [x] Phase 3 — `scripts/publish/preflight.ts`, `steps.ts`, `run.ts`;
   `push-pipeline.sh` thin driver; legacy retained as
   `scripts/push-pipeline-legacy.sh`; `docs/publish-pipeline.md` ledger.
7. [x] Phase 4 — `scripts/test-push-pipeline.ts`; 11 cases; passed twice;
   default engine flipped to `next`.
8. [x] Phase 5 — `scripts/gate-cost-report.ts`, `scripts/weekly.ts`,
   `docs/workflow-cadence.md`, `spec/audit/gate-retirement.json` support.
9. [x] Phase 6 — CHANGELOG entry, AGENTS.md layer map, version bump, this
   increment's artifacts.
10. [ ] First real publish on the `next` engine, recording the recovery path used
    (scheduled on `ROADMAP.md`).
