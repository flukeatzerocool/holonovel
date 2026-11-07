# Tasks — workflow convergence

**Done bar:** every gate in the plan's verification list passes, the roadmap
item is removed, and `session:close` dogfoods split mode.

- [x] Baseline: `version-check` red (2026.11.06 < 2026.11.07); fix as commit 0.
- [x] `scripts/status.ts` + `npm run status`.
- [x] `.githooks/commit-msg` + legacy subject fix (rehearsed against the
      current CHANGELOG heading).
- [x] Agent Operating Routine in `AGENTS.md` and `docs/workflow-cadence.md`.
- [x] `scripts/lib/publish-guards.ts`; wired into preflight, stage, and
      `session:close`; `--allow-secrets` on the publish path.
- [x] `ensureSpecHash` / `ensureDelta` and the `suiteRan` guard for bounded
      runs; no bounded commit records a suite it did not run.
- [x] Harness guard cases and partial-range cases (`test:pipeline`: 22/22).
- [x] SHA-pinned CI actions, `check-workflows` pin parser,
      `test:workflows` (10/10), duplicate Typecheck step removed.
- [x] `scripts/lib/commit-plan.ts` + `test:commit-plan` (21/21);
      `session:close` split/single/auto.
- [x] Gate manifest entries for `test:workflows` and `test:commit-plan`;
      AGENTS gate table regenerated.
- [ ] `docs/publish-pipeline.md` guard matrix and rehearsal status.
- [ ] DECISIONS standing decisions.
- [ ] CHANGELOG entry and ROADMAP removal.
- [ ] Full `check`, `check:fast`, `version-check`, `status`, and split close.
- [ ] AAR with a terminal LOOP token.

## Evidence

- `npm run check:fast` baseline → exit 0 (34/34).
- `npm run version-bump` → `2026.11.07`; `version-check` → exit 0.
- `npm run status` → exit 0 (6 fields, 3 open roadmap items before removal).
- `npm run test:workflows` → 10/10.
- `npm run test:commit-plan` → 21/21 (including real `commit-msg` acceptance).
- `npm run test:pipeline` → 22/22.
- `npm run check-workflows` → pass (2 workflows).
- `npm run typecheck` → exit 0.
- `npm run check-script-discipline` / `check-script-quality` → pass.
