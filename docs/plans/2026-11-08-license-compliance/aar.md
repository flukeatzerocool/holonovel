# AAR — License compliance (in progress)

**Status:** in progress · **Date:** 2026-11-08
**Plan:** `plan.md` · **Tasks:** `tasks.md`

## Done so far

- Removed `scripts/ruleset-builds/` in full: the `dnd2024` supplement pipeline
  (1.07 MB of commercial ThunderCats book text plus its annotate/extract/build/
  deploy scripts and authored tools) and the `swse` rebuild (character-creation
  source, emitter, provenance). Per the user's decision, per-book build assets
  belong in the deployed content pipeline.
- `.gitignore` now ignores `scripts/ruleset-builds/` wholesale, so a local copy
  cannot be staged by accident.
- `check-reference-server-cleanliness.ts` no longer carries a slug allowlist:
  any tracked file under `scripts/ruleset-builds/` fails the gate. Header and
  DECISIONS.md content-boundary section updated to match.
- `scripts/update.ts` drops the dnd2024 extract special case; a removed emitter
  now surfaces as `deferred` ("no recorded emitter or source"), which
  `update.ts:112` already handles.
- `holonovel/scripts/test-ruleset-gates.ts` T689/T737 now exercise a neutral
  stub emitter generated into `TMP` instead of the deleted `swse` build asset.
  Evidence: 21 passed, 0 failed.
- Spec T737 wording no longer names `swse`; playtest docs and tests stop naming
  the product; `script-quality-baseline.json` drops the five deleted paths.
- CalVer advanced to 2026.11.08 (root, server package, lockfile, index.ts,
  AGENTS.md header, server.json) — REQ-107a version currency was already red at
  HEAD before this increment.
- `scripts/lib/gate-run-manifest.ts` reads the working diff with a 64 MB buffer;
  the 1 MB default crashed the pre-commit hook with ENOBUFS on a large deletion
  and blocked the commit.

## Not yet done

- P3 registry/policy, P4 gates, P5 attribution fields, P6 distribution and close.

## History purge (P2, complete)

- Backup: `/tmp/opencode/holonovel-pre-purge.bundle` (11 MB, `--all`).
  Restore: `git fetch /tmp/opencode/holonovel-pre-purge.bundle 'refs/*:refs/restore/*'`.
- `git-filter-repo` was absent, so the rewrite used
  `git filter-branch --index-filter 'git rm -r --cached --ignore-unmatch
  scripts/ruleset-builds' --prune-empty --tag-name-filter cat --all`, covering
  dnd2024, swse, and the historical `robotech/baseline.json` (3.4 MB).
- Result: `git log main -- scripts/ruleset-builds` → 0;
  `git rev-list --objects --all | grep ruleset-builds` → 0; `git fsck` clean;
  25 tags rewritten.
- Force-pushed `main` and all tags to `origin` (git.gay) and `github`; both now
  report `9b856c0`.
- Deployed instance reconciled with `git reset --hard origin/main`; its
  `.holonovel-state/` (dnd2024, mothership, robotech, swse installs) preserved.
- Fresh clone of the public GitHub remote: `scripts/ruleset-builds` absent,
  history hits 0; the only remaining "ThunderCats" strings are title references
  in `CHANGELOG.md`, this plan, and the review register — no book prose.
- `TTRPG_DATA_DIR=<deployed state> npm run update -- --json` reports `swse`
  `deferred` ("no recorded emitter or source") — the accepted outcome, not a
  failure.

## Follow-up found during P2

- History still contains a 1,022-file `dnd5e/ruleset/` conversion tree and a
  3.4 MB `robotech/baseline.json` predecessor. The SRD 5.1 text is openly
  licensed (CC BY 4.0 + OGL), so this is a policy question, not a legal exposure;
  it is not purged because it was outside the approved path list.
- `.opencode/extract_swse.py` exists in history.

## Open

- `2026-11-08-subjective-memory-store` arrived untracked and without an AAR from
  a prior session; it blocked `check-loop-artifacts` and is carried forward with
  a placeholder AAR.

LOOP OPEN
