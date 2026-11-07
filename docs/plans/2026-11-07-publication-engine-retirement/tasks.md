# Tasks — Publication engine retirement

Session 2026-11-07. Plan: `plan.md` (amended; stamped artifact sha256
`5a873d65…`, fixed at git `eb114fb`).

Ordered by dependency; each item's evidence is the command or read that proved
it.

## Baseline (before the first edit)

- [x] `npm run status` → on `main`, 8 unpushed commits, last publish never
  recorded, version 2026.11.07, 2 open roadmap items.
- [x] `npm run check:fast` → 36 passed, 0 failed (`check:fast: PASS`).
- [x] `git status --porcelain` → clean.
- [x] `git rev-parse --abbrev-ref HEAD` → `main`.
- [ ] `git fetch origin main` — not run. No publish this session; remote
  freshness is irrelevant to a local tooling change (deviation D-2).

## Maintainer decisions (this session)

- **D-1 — do not publish.** Phase 2 (the live run) and Phase 1 (its pre-publish
  dress rehearsal) are withdrawn.
- **D-2 — do not defer.** The retirement executes without a live run; Branch B
  is withdrawn. The evidence half of the old ROADMAP trigger is owed, recorded
  as a standing fact, not scheduled.

## Retirement

- [x] `scripts/push-pipeline.sh`: engine selection (`PUSH_ENGINE`,
  `--engine`, `--legacy`) removed; the entry point always execs
  `scripts/publish/run.ts`.
- [x] `scripts/push-pipeline.sh`: the advisory `flock` the legacy engine owned
  moved in front of the exec (fd 9 inherited across it), with the same
  warn-only branch when `flock` is absent.
- [x] `scripts/push-pipeline-legacy.sh` deleted.
- [x] `.githooks/pre-commit`: `HOLONOVEL_PIPELINE_GATES` bridge block removed.
- [x] `.githooks/pre-push`: bridge block removed.
- [x] `AGENTS.md`: the legacy-engine role line removed from the layer map.
- [x] `docs/publish-pipeline.md`: one-engine paragraph; the residual
  real-remote notice is dated; "Why the old engine is still present" replaced
  by "Engine history".
- [x] `ROADMAP.md`: the rehearsal item removed.
- [x] `holonovel/DECISIONS.md`: standing-fact entry recording the accepted
  tradeoff and the owed first-live-run evidence.
- [x] `CHANGELOG.md`: dated entry added.

## Verification (actual results)

| Check | Command | Result |
|---|---|---|
| Shell syntax | `bash -n` on the entry point and both hooks | pass |
| Help path | `./scripts/push-pipeline.sh --help` | exit 0 |
| Engine flag gone | `./scripts/push-pipeline.sh --engine=legacy` | exit 2, `Unknown option` |
| Run lock | hold `flock` on the lock file, then `--only preflight --yes` | exit 1, "Another push-pipeline run holds …" |
| Lock release | `--help` after the holder exits | exit 0 |
| Script discipline | `npm run check-script-discipline` | PASS |
| Workflow hygiene | `npm run check-workflows` | PASS |
| Roadmap admission | `npm run check-roadmap` | OK, 2 sections |
| Registers | `npm run check-registers` | PASS |
| Traceability | `npm run check-traceability` | 24 rows, 0 Deferred/Waived |
| Markdown | `npm run lint` | clean |
| Spec validation | `npm run validate` | 0 errors, 258 warnings |
| Pipeline harness | `npm run test:pipeline` | 22 passed, 0 failed |

- [ ] `--only preflight --yes` on a clean tree — not run: the tree is dirty by
  design until the session commit, and the driver has no commit instruction
  (deviation D-3). It runs at the next session's first publish.
- [x] `npm run session:close --single` → the session commit (`git log -1`,
  subject `2026-11-07 — Retire the legacy publication engine`); this artifact
  rides that commit.

## Deviations

- **D-1** Phase 1 dress rehearsal withdrawn with the publish.
- **D-2** `git fetch origin main` not run.
- **D-3** clean-tree preflight smoke deferred to the next publish.
- **D-4** Three `HOLONOVEL_PIPELINE_GATES` / legacy-path matches remain, all
  explanatory comments rather than consumers: `scripts/lib/gate-run-manifest.ts:3`
  (provenance), `.githooks/pre-commit:12` (what the run manifest replaced), and
  `docs/publish-pipeline.md:58` (engine history).
