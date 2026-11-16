# Tasks — Torre Nosferatu readiness

**Increment:** `docs/plans/2026-11-16-torre-readiness`
**Depends on:** none
**Done bar:** see `plan.md`.

## Phase 0 — Preflight

- [x] `git status --short` clean for the six named paths; wiki clone's 22 other
      modifications untouched.
- [x] Counts confirmed: 94 rooms, 35 things, 6 NPCs, 17 lore, 3 secrets,
      3 countdowns.
- [x] `faction_mv4q1cba` resolves to "The Survivors".

## Phase 1 — Starter content

- [x] `lore.the-candle` gains `"visibility": "shared"`.
- [x] `lore.resources` gains `"visibility": "shared"`.
- [x] `secrets[secret-ilona-bitten].known_by` becomes
      `["faction_mv4q1cba"]`.

## Phase 2 — Regenerate

- [x] `npm --prefix holonovel run build:starter-novel`.
- [x] `git diff --stat holonovel/content/` shows source + artifact only.

## Phase 3 — Harness assertion

- [x] New `test-starter-novel.ts` case asserts ≥2 shared lore entries, the two
      named keys, ≥1 held secret, and every holder resolving.
- [x] `npm --prefix holonovel run test:starter-novel` → 16 passed, 0 failed.

## Phase 4 — Wiki onboarding

- [x] `.holonovel-state/wiki/Playing-Torre-Nosferatu.md` gains the
      "Put on the Player badge" subsection after "Start it".
- [x] `_Last updated:_` becomes `2026-11-16`.
- [x] Commit only that path in the wiki clone; no push.
      Commit `fd184f3`, 1 file, 11 insertions, 1 deletion.

## Phase 5 — Verify

- [x] `npm --prefix holonovel run check:starter-freshness` → PASS.
- [x] `npm --prefix holonovel run test:holosuite-novel` → 100 passed, 0 failed.
- [x] `cd holonovel && npx tsx scripts/playability.ts --novel
      content/torre-nosferatu.json` → clean. (Command corrected from the
      original `npm --prefix … exec` form; see plan Delta.)

## Phase 6 — Close

- [x] `CHANGELOG.md` gains the dated entry.
- [x] `aar.md` written and ends `LOOP PAUSED`.
- [x] `npm run session:close` passes and commits.
