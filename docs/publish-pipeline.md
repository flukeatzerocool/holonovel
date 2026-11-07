# Publication pipeline — failure ledger

Every entry below was a real publication failure. The rule this file exists to
enforce: a failure produces a guarding test, not a comment. A `# NOTE:` in the
script is not a regression test and not a rehearsal.

`scripts/push-pipeline.sh` is the operator entry point. It takes the advisory
run lock and delegates to `scripts/publish/run.ts`, the ordered step registry.
There is one engine: the previous monolith was deleted on 2026-11-07 (see
"Engine history").

| Date | Symptom | Fix | Guard | Manual recovery |
|---|---|---|---|---|
| 2026-08-24 | `npm install` in the deploy clone rewrote `package-lock.json`, invalidating the lockfile fingerprint and failing REQ-418 | `npm ci` only, and revert lockfile drift after install | deploy step checks `git status -- package-lock.json`; `test-update-workflow` | `git -C <deploy>/<server> checkout -- package-lock.json`, then re-run `--from deploy` |
| 2026-08-29 | `TAG_TO_PUSH` unbound under `set -u` when the tag already existed remotely | initialise the variable, reuse an existing tag at HEAD, refuse a retarget | `--from tag` resume case in the pipeline harness | none needed; the step is idempotent |
| 2026-08-30 | Deploy clone had a stale `HOST_VERSION` edit; `pull --ff-only` refused | discard deploy-tree drift before pull (`checkout -- .` + `clean -fd`) | deploy step asserts a clean tree after the reset | `git -C <deploy> checkout -- . && git -C <deploy> clean -fd` |
| 2026-10-25 | `git add -A` could stage leftovers; the wiki mirror pages are owned by a separate clone | preflight rejects untracked commit-surface files; wiki paths are reset out of the index | preflight untracked check; `--allow-untracked` escape | unstage with `git reset -- .holonovel-state/wiki` |
| 2026-10-31 | Deploy aborted at step 9 after main, tag, mirror, and wiki were pushed: the same repository was spelled `git@host:path` and `ssh://git@host/path` | compare remote identity, not spelling (`scripts/lib/remote-url.ts`) | preflight remote-identity check (now runs *before* any write) | `--from deploy --resume` |
| 2026-10-31 | A non-interactive run without `--yes` paid for the full gate pass, rewrote `DECISIONS.md`, then refused | confirmation availability is a preflight check | preflight `!--yes && !isTTY` rejection | re-run with `--yes` |
| 2026-10-31 | A failed deploy left the workspace dirty and the next run refused on staged changes | preflight reports staged changes before writing | preflight staged-change check | commit or unstage, then re-run |
| 2026-10-31 | Ship: `publish.yml` checked out at depth 1, so `spec-delta --base` had no ancestor and the verify job failed | full-history checkout; hermetic fixture for the delta self-test | `check-workflows` rule + `test-spec-tooling` repository fixture | re-run the mirror CI with a full checkout |
| 2026-10-31 | CI installed server dependencies after `npm run check`, so the tool-definition gate died on `ERR_MODULE_NOT_FOUND` | install server dependencies before the gate | `check-workflows` dependency-order rule | re-run CI |

## Staging guards

`git add -A` is whole-tree, so the pipeline and `session:close` apply the same
four guards after staging. A guard failure stops before the commit.

| Guard | Failure it prevents | Test |
|---|---|---|
| Secret scan | An API key or private key enters history in a staged addition; matches are reported as `path:line [kind]`, never by value | `test:pipeline` (staged secret case) |
| Deny-list | `node_modules/`, `dist/`, `.holonovel-state/`, local config, `.env*`, SQLite/key files, or an SSH key is committed | `test:pipeline` (deny-list case) |
| Leftover check | A path stays unstaged or untracked after `git add -A`, so the commit silently under-ships the tree | `test:pipeline` (unit case) |
| Identity guard | A commit is attempted with no `user.name`/`user.email` (fails in preflight before any write) | `test:pipeline` (missing-identity case) |

`--allow-secrets` downgrades only the secret match to a warning on the publish
path; `session:close` has no override.

## Rehearsal status

The manual recovery column is the SRE requirement: an owner must have *executed*
the fallback once, not merely believed it would work. Status as of 2026-11-07:

- Rehearsed in the hermetic harness: preflight rejection, deploy-tree reset,
  tag reuse, resume after a failed step, idempotent re-run, the staging guards,
  and partial ranges (`--stage repo`, `--from stage`, `--stage deploy`,
  `--only commit`). A bounded run passes or fails loudly; it never exits 0
  after skipping state it needed.
- **Not yet rehearsed against a real remote:** the REQ-418 remote-identity
  recovery and the REQ-428 registry waiter. The sole engine has not completed a
  live publish yet. The first live run must record the recovery path it used, or
  state that none was needed. The legacy backout engine was deleted before that
  run by maintainer decision (see "Engine history"), so this evidence is owed
  rather than optional.

## Engine history

The legacy monolith (`scripts/push-pipeline-legacy.sh`) was the backout path
after the step registry became the default. It was deleted on 2026-11-07 by
maintainer decision, before the first live run of the sole engine. Backout is
now `git revert` of the retirement commit; the recovery commands in the table
above remain the operational fallback.
