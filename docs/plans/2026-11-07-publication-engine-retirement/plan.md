<!-- Amendment 2026-11-07 — the maintainer directed "don't publish", "not publishing today", and "don't defer". Phase 1 (pre-publish dress rehearsal), Phase 2 (the live publish), and Branch B are withdrawn. Phase 4 (retirement) and Phase 5 (verification, minus session:close) execute now. The residual real-remote evidence is recorded as a standing fact in holonovel/DECISIONS.md and docs/publish-pipeline.md rather than scheduled. -->

# Plan — Rehearse the step-registry publication engine on a real publish

**Status:** draft for review · **Date:** 2026-11-07 · **Depth:** deep (live publish to a remote; deletion of the backout engine)
**Review independence:** self

## Done bar

**Done bar:** (amended 2026-11-07 — the live publish was withdrawn by maintainer decision) the legacy engine and the `HOLONOVEL_PIPELINE_GATES` bridge are gone and `scripts/push-pipeline.sh` is the sole entry point, holding the advisory `push-pipeline.lock` and delegating to the step registry; the retirement and the still-owed first-live-run evidence are recorded in `docs/publish-pipeline.md` and `holonovel/DECISIONS.md` as a standing fact; the ROADMAP item is removed, CHANGELOG records the change, the increment artifacts exist with a LOOP terminal token, and `npm run check:fast` plus `npm run test:pipeline` are green.

## Questions being asked

1. What is the top ROADMAP item and what does it actually require? — *Rehearse the `next` publication engine on a real publish* (ROADMAP.md:15–27): run a real publish through the step registry, record the recovery path it used in `docs/publish-pipeline.md`, then delete the legacy engine and the deprecated environment bridge.
2. Is the item executable today? — Yes: the tree is on `main`, clean, 8 commits ahead of `origin/main`, the deploy clone exists, and the step registry is the default engine.
3. What must not happen? — Publishing without explicit authorization; deleting the backout engine before the run proves it is unnecessary.

## Evidence verified this session

| Claim | Evidence | Class |
|---|---|---|
| ROADMAP item 1 requires a real publish, a recovery-path record, then deletion of the legacy engine and bridge | `ROADMAP.md:15–27` | repo |
| `check:fast` baseline is green: 36 passed, 0 failed | `npm run check:fast` → `check:fast: PASS` | tool-output |
| 8 commits are unpushed; last publish is unrecorded; version is 2026.11.07; latest tag is v2026.10.31 | `npm run status` | tool-output |
| The step registry has 17 ordered steps (`preflight` … `verify_deploy`) and is the default engine | `scripts/publish/steps.ts`; `scripts/push-pipeline.sh:76–83` | repo |
| The registry step is an advisory `check-registry-publish.ts --wait 900` check, not an npm publish | `scripts/publish/steps.ts:504–515`; `scripts/publish/run.ts:204–206` | repo |
| npm publication happens in CI and is guarded by an `npm view` existence test | `.github/workflows/publish.yml` (Determine publish state) | repo |
| The deploy clone is present, on `main`, clean, at `a7d1fd8`, with the same `origin` URL spelling as the workspace | `git -C /home/fluke/Holonovel-deployed ...` | tool-output |
| The spec delta against `origin/main` is **patch**; no requirement was added, removed, or modified | `npx tsx scripts/spec-delta.ts --server holonovel --report-only` | tool-output |
| The pending-update gate passes today (so the `update` step needs no `--auto-update`) | `npx tsx scripts/update-server.ts ... --delta-class patch --check` → exit 0 | tool-output |
| The advisory `flock` documented for `push-pipeline.sh` exists **only** in the legacy engine | `scripts/push-pipeline-legacy.sh:196–205`; `AGENTS.md:391`; no `flock` in `scripts/publish/` | repo |
| The two bridge blocks are the only `HOLONOVEL_PIPELINE_GATES` consumers outside the legacy engine | `.githooks/pre-commit:33–36`; `.githooks/pre-push:30–35` | repo |
| No gate or harness references the legacy script; the harness drives `run.ts` directly | `scripts/test-push-pipeline.ts` (no engine/legacy match); `.github/workflows/ci.yml:19` shellchecks `push-pipeline.sh` and the three hooks — the legacy script is absent from the list | repo |
| No project-register row references the ROADMAP item or the engine names | grep of `spec/audit/review-register.md` and `holonovel/DECISIONS.md` → no match | repo |
| `--dry-run` is documented as "change nothing" but runs `build-order` and the `record` step, both of which write | `scripts/publish/run.ts:29`; `scripts/publish/steps.ts` (build, record) | repo |
| `flock` is available (util-linux 2.42.2) | `command -v flock` | tool-output |
| The deploy path defaults to `~/Holonovel-deployed` | `scripts/publish/run.ts:146` | repo |
| No spec REQ mandates a backout engine; the contracts are REQ-394 and REQ-418 | `spec/02-requirements.md:3974`; grep of `spec/` for the engine names is clean | repo |

## Scope

### In scope

1. A pre-publish dress rehearsal that proves the pending tree can pass the gates the publication will run.
2. One real publish through the step-registry engine, with its log preserved.
3. A dated ledger entry in `docs/publish-pipeline.md` recording the recovery path used, or that none was needed.
4. Conditional on a clean run: delete the legacy engine, the entry-point engine selection, and the hook bridges; move the advisory run lock into the surviving entry point.
5. ROADMAP removal, CHANGELOG entry, increment artifacts, and the session commit.

### Out of scope

- Any spec (`spec/`) change. The delta is `patch` with no requirement change; no REQ body is touched.
- Fixing the `--dry-run` write behaviour (finding F-2). Record-only; it is not on this item's path.
- A second live publish in this session. The retirement commit rides the next publish (see Commit plan).
- The `registry` waiter's own semantics; it is advisory and its outcome is recorded, not changed.

## Alternatives rejected

| Decision | Alternative | Why rejected |
|---|---|---|
| Order | Delete the legacy engine first, then publish | Removes the backout path exactly when the live run is most likely to need it; the ROADMAP trigger is explicitly "after" the run |
| Order | Record the recovery path *before* running, as "none needed" | Fabricates the evidence the item exists to produce |
| Engine lock | Rely on `run.ts` alone after deletion and drop the `flock` | AGENTS.md:391 documents the lock as entry-point behaviour; dropping it silently removes a concurrency guard |
| Engine lock | Re-implement the lock inside `run.ts` | The bash form is already proven and inherited across `exec`; a TS file lock needs a stale-lock policy that is not worth designing here |
| Close-out | Publish a second time in this session to ship the retirement commit | Same version, no server-path change; it would only lengthen the run and the AAR could not observe its outcome |
| Commit shape | Split docs from pipeline changes | The CHANGELOG must ride the change (AGENTS.md), and the deletion is atomic; one commit with a stated size exception is the honest shape |

## Blast radius

| Path | Change | Size | Rollback |
|---|---|---|---|
| `scripts/push-pipeline.sh` | Remove `PUSH_ENGINE`/`--engine`/`--legacy`; always exec `run.ts`; acquire the advisory `flock`; update header/usage | M | 1 (git revert) |
| `scripts/push-pipeline-legacy.sh` | Delete (892 lines) | L | 1 (git revert restores) |
| `.githooks/pre-commit` | Delete the `HOLONOVEL_PIPELINE_GATES` bridge block (lines 33–36) | S | 1 |
| `.githooks/pre-push` | Delete the bridge block (lines 30–35) | S | 1 |
| `docs/publish-pipeline.md` | Rewrite the engine paragraph; replace "Not yet rehearsed" with the dated result; retire "Why the old engine is still present" | M | 1 |
| `AGENTS.md` | Drop the legacy-engine line (106); the `flock` sentence stays true because the lock moves | S | 1 |
| `ROADMAP.md` | Remove the item (lines 15–27) | S | 1 |
| `CHANGELOG.md` | Add the dated entry | S | 1 |
| `docs/plans/2026-11-07-publication-engine-rehearsal/{plan,tasks,aar}.md` | Add the increment artifacts (tracked; not under the ignored `plans/` path) | M | 1 |

Aggregate rollback cost: 2 for the session as a whole (a deletion, plus remote state already published by Phase 2). The publication itself is irreversible; the retirement commit is reversible with `git revert`.

## Phases

### Phase 0 — Baseline (no writes)

1. `git status --porcelain` → empty; `git rev-parse --abbrev-ref HEAD` → `main`.
2. `npm run status` → record the 8 unpushed commits and the version/tag state in `tasks.md`.
3. `git fetch origin main` → must succeed (no `--allow-stale-base`).

### Phase 1 — Pre-publish dress rehearsal (no external writes)

Run the exact suite the publication and the pre-push hook will run, so a red gate is found here rather than mid-publish:

1. `npm run check` (full gate: includes `test:pipeline` and `playability`).
2. `npm run test:package-smoke` (AGENTS.md requires it before a publish; CI runs it in the publish verify job; it needs network).
3. `npm run validate:sdd -- --impl-audit=strict` (the pre-push strict coverage gate).
4. `(cd holonovel && npm run test:tool-definitions && npm run test:security && npm run test:holosuite-evidence && npm run test:holosuite-conformance && npm run test:holosuite-invariants && npm run test:holosuite-novel && npm run test:holosuite-adversarial && npm run test:holosuite-differential)`.
5. `git status --porcelain` again → still empty. A new untracked path blocks preflight; clean or resolve it before Phase 2.
6. `git -C ~/Holonovel-deployed status --porcelain` → empty, and its `origin` URL matches the workspace.

**Red-baseline rule:** any failure here stops the plan before Phase 2 and is fixed as its own commit, never folded into the retirement commit.

### Phase 2 — Real publish (external, irreversible; requires explicit user authorization)

1. `./scripts/push-pipeline.sh --yes > /tmp/opencode/publish-2026-11-07.log 2>&1; echo "exit=$?"` — run in a long-timeout shell or in the background; allow up to ~45 minutes (full check in `build-order`, server harnesses, registry wait, deploy `npm ci`).
2. Do not create `docs/plans/2026-11-07-publication-engine-rehearsal/` before this phase: untracked files fail preflight.
3. On failure, follow **Backout**; do not retry blind. A retry that uses `--from`/`--resume` is itself a recovery path and must be recorded.

### Phase 3 — Record the run (Branch A and Branch B)

1. Read `.holonovel-state/publish-run.json` (per-step status) and the Phase 2 log.
2. In `docs/publish-pipeline.md`, replace the "Not yet rehearsed against a real remote" bullet with a dated entry naming: the engine, the published commit and tag, the deploy HEAD, and the recovery path used — one of `preflight rejection`, `deploy reset`, `tag reuse`, `resume`, or `none needed`.
3. Record the `registry` step outcome (listed, or warned after the 900-second wait).
4. Branch A only: rewrite the opening engine paragraph to describe one engine. In Branch B the two-engine paragraph stays and gains the new ledger row.

### Phase 4 — Retire the legacy engine (Branch A only)

1. `scripts/push-pipeline.sh`: delete the `ENGINE` variable (line 51), the `--engine`/`--legacy` parsing (lines 57–59), the case block (lines 76–87), and the usage lines (45–46); leave a single `exec npx tsx "$DIR/publish/run.ts" "${ARGS[@]}"`. Add the advisory lock before the exec, resolved from the repo root: `ROOT="$(cd "$DIR/.." && pwd)"; mkdir -p "$ROOT/.holonovel-state"; exec 9>"$ROOT/.holonovel-state/push-pipeline.lock"; flock -n 9 || { message; exit 1; }`, with a warning-only branch when `flock` is absent (the legacy behaviour). Keep the `[entry point]` header, the REQ-394/REQ-418 citations, and the 0/1/2 exit-code contract.
2. Delete `scripts/push-pipeline-legacy.sh`.
3. `.githooks/pre-commit`: delete lines 33–36; keep the 8–13 comment about the run manifest (it explains the replacement, it is not the bridge).
4. `.githooks/pre-push`: delete lines 30–35.
5. `AGENTS.md`: delete the `scripts/push-pipeline-legacy.sh` role line (106). The `flock` sentence at 391 stays and is now accurate for the only engine.
6. `docs/publish-pipeline.md`: replace "Why the old engine is still present" with a short "Engine history" note naming the retirement date and that backout is `git revert`.
7. `ROADMAP.md`: delete the item, keeping `## Non-goals`. No review-register or DECISIONS row cross-references it (verified above), so only the ROADMAP and CHANGELOG move; Phase 5 re-runs `check-registers`, `check-traceability`, and `check-roadmap`.

### Phase 5 — Verify and close

1. `npm run assemble && npm run check:fast` — capture the unpiped exit status.
2. `npm run test:pipeline` (full-only gate; proves the registry still runs).
3. Lock test, with `ROOT=/home/fluke/Holonovel`: hold the lock in a subshell (`flock "$ROOT/.holonovel-state/push-pipeline.lock" -c "sleep 5" &`), then `./scripts/push-pipeline.sh --only preflight --yes` → exit 1 with the "another run holds" message; after it releases, `./scripts/push-pipeline.sh --help` → exit 0.
4. CLI removal test: `./scripts/push-pipeline.sh --engine=legacy` → unknown-option message, exit 2.
5. Entry-point smoke: `./scripts/push-pipeline.sh --only preflight --yes` on a clean tree → exit 0 (runs preflight through the rewritten entry point, no build and no push). `npx tsx scripts/publish/run.ts --help` → exit 0.
6. Optional (finding F-2 probe): `./scripts/push-pipeline.sh --dry-run --yes` then `git status --porcelain`. Expected clean; any diff is recorded against F-2, not fixed here. The full dry run re-runs `build-order`, so it is optional.
7. Write `tasks.md` and `aar.md` (every finding dispositioned), then `npm run session:close`.
8. `npm run status` → the retirement commit is the only unpushed commit; last publish is recorded.

## Branch B — the run used a recovery path

If Phase 2 touched the recovery column (preflight rejection, deploy reset, tag reuse, or resume), then:

1. Phase 3 still ships: the ledger entry is mandatory.
2. Phase 4 does **not** run. Keeping the legacy engine is the whole point of the trigger.
3. `ROADMAP.md` keeps the item, with a bullet recording the recovery path and a refreshed `**Trigger:**` naming what must be clean next time.
4. `aar.md` ends `LOOP OPEN`, naming the ROADMAP entry as the tracking surface.

## Verification matrix

| Criterion | Command | Expected |
|---|---|---|
| Gates green before publish | `npm run check` | exit 0 |
| Packed artifact sound | `npm run test:package-smoke` | exit 0 |
| Strict coverage | `npm run validate:sdd -- --impl-audit=strict` | exit 0 |
| Real publish completes | Phase 2 command | `exit=0`; `push=true` and `deploy=true` (`commit`/`tag`/`mirror`/`wiki` as observed — `wiki` is false when the clone has no changes) |
| Repo pushed | `git rev-parse origin/main` vs `git rev-parse HEAD` | equal |
| Tag published | `git ls-remote --tags origin v2026.11.07` | one ref |
| Deploy verified (REQ-418) | `git -C ~/Holonovel-deployed rev-parse HEAD` | equals published HEAD |
| Registry (advisory) | Phase 3 record | listed, or warned — either is a pass |
| Single engine remains | `grep -rn "push-pipeline-legacy\|PUSH_ENGINE\|--legacy" scripts/ .githooks/ AGENTS.md` | no matches |
| Bridge gone | `grep -rn HOLONOVEL_PIPELINE_GATES .githooks/` | no matches |
| Run lock present | Phase 5 lock test | exit 1 while held, exit 0 when free |
| Entry point wired | `--only preflight --yes` | exit 0 |
| Pipeline harness | `npm run test:pipeline` | exit 0 |
| Fast gates | `npm run check:fast` | `check:fast: PASS` |

## Backout

| Failure point | State at risk | Recovery |
|---|---|---|
| Phase 1 gate | none (local tree) | fix as its own commit; re-run Phase 1 |
| Phase 2 before `push_repo` | local commit written by the `record`/`commit` steps | inspect `git log`; correct, then re-run from the top (fast-forward push is unaffected) |
| Phase 2 after `push_repo`, before/at deploy | main + tag + mirror already public | `./scripts/push-pipeline.sh --from deploy --resume` (record it as a recovery path) |
| Phase 2 registry check | advisory only | none; CI's daily self-heal registers a late version |
| Legacy engine needed | fallback for Phase 2 | `PUSH_ENGINE=legacy ./scripts/push-pipeline.sh --yes` — still present until Phase 4 |
| Phase 4 retirement | tooling regression | `git revert <retirement-sha>` restores the legacy engine and the bridge |

## User impact

- The deploy step updates the deployed host at `~/Holonovel-deployed` to the published spec and fingerprints (REQ-418). The delta is **patch** with no requirement change, so no user-data migration is expected; if `update` reports a stale tier, REQ-556/REQ-424 reconciliation is the pipeline's job and is not this plan's.
- Nothing requires a restart on the operator's side; the next publish uses the simplified entry point, and the only removed CLI surface (`--engine`/`--legacy`) has no caller in this tree.

## Trust boundary

All evidence is `repo` (file:line) or `tool-output` (local command exit codes and git state). No step is premised on web content, issue text, or dependency metadata. The Phase 2 log is local process output.

## Risks and unknowns

- **Full check red on the 8 pending commits** (unknown until Phase 1). Mitigation: Phase 1 is the probe; a red gate stops the plan.
- **Pre-push strict coverage red** (REQ-level evidence). Same mitigation.
- **Registry propagation exceeds 900 s.** Advisory by design; record the warning. CI self-heals.
- **Deploy `npm ci` network failure.** The deploy step fails; recovery is Phase 2's `--from deploy` row, recorded as a recovery path.
- **Deploy clone drift at pull time.** The pipeline resets it — that is a "deploy reset" recovery path, which makes the run Branch B. The clone is clean today, so this should not fire.
- **Removing the `--engine` flag surprises an operator.** No caller in the tree uses it except the documentation being rewritten; the harness drives `run.ts` directly.
- **Finding F-1:** the documented advisory `flock` exists only in the legacy engine (`AGENTS.md:391` vs `scripts/push-pipeline-legacy.sh:196–205`). The deletion would remove the guard, so Phase 4 restores it in the surviving entry point. This is a regression the plan prevents, not scope creep.
- **Finding F-2 (record-only):** `--dry-run` claims "change nothing" but runs `build-order` and `record`, both of which write (`run.ts:29`, `steps.ts`). Phase 5 probes it optionally; a diff is recorded in the AAR. Disposition: P3 record-and-close unless the probe shows a diff, in which case it is scheduled on ROADMAP.md.
- **Assumption (A1):** `update-server --check` passing today means the `update` step needs no `--auto-update`. Confirmed by the `patch` classification and the exit-0 probe; Phase 2 re-checks it live.
- **Assumption (A2):** version 2026.11.07 is not yet tagged remotely (`v2026.10.31` is the latest local tag). Phase 2's `tag` step creates it; if it exists remotely the step reuses it, which is a recovery path and makes the run Branch B.

## Commit plan

- **Phase 2** commits the `record` step's spec-update entry (the stored spec hash is stale, so the step writes a diff) and pushes the 8 pending commits with it. Commit gate: the publication's own `build` (`build-order` with `HOLONOVEL_IMPL_STRICT=1`) and the `pre-push` hook.
- **Phase 5** produces one commit via `npm run session:close`: the retirement (scripts, hooks), the ledger, ROADMAP, AGENTS, CHANGELOG, and the increment artifacts. One commit is justified because the deletion is atomic and the CHANGELOG must ride the change; the diff is dominated by the 892-line file deletion (the stated atomic-change exception to the ~300-line guidance).
  - Gate: `npm run check:fast` + `npm run test:pipeline` green before the close; `check-loop-artifacts` verifies plan/tasks/AAR.
  - Pre-push gate on the next publish: full `check` + server harnesses + strict coverage.

## Open questions (with recommended defaults)

1. **Authorization to publish.** Phase 2 is a real, irreversible publish to git.gay, GitHub, npm (via CI), the MCP registry, and the deploy clone. Recommended: require the explicit word "publish"/"ship" before Phase 2.
2. **Ship the retirement now or next session?** Recommended: let the retirement commit ride the next session's publish. A second live publish in this session (same version, no server-path change) buys little and would make the AAR describe a run it cannot observe.
3. **Branch B acceptance.** Recommended: accept deferral. A recovery path used means the trigger did not fire, and the engine stays for one more rehearsal.
