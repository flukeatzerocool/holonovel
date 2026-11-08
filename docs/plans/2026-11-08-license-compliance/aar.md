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

- P2 history purge (backup bundle, rewrite, force-push both remotes, re-clone).
- P3 registry/policy, P4 gates, P5 attribution fields, P6 distribution and close.

## Open

- `2026-11-08-subjective-memory-store` arrived untracked and without an AAR from
  a prior session; it blocked `check-loop-artifacts` and is carried forward with
  a placeholder AAR.

LOOP OPEN
