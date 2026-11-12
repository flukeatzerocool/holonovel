# After-action report — §5.6 entity, scene, and NPC-depth remediation

Increment: `docs/plans/2026-11-12-5-6-entity-scene-npc-depth/`
Plan artifact: `plan.md` sha256 `fcdf573b…a8ead6` (plan-review passed, fresh,
standard; cold pass FAILED the first revision, diff re-review passed)
Executed: 2026-11-12

## Outcome

F-P3B2-1 through F-P3B2-8 are `Resolved` with current predicates. `ROADMAP.md`
is split: the surviving section closes on F-P3B2-1…8 and the untouched
personality/signal/citation findings moved to a new scheduled P1 section.
The gate set is green: `check:fast` 41/41, five harness suites plus the pattern
buffer, root and server typecheck, `surface-budget`, `check-registers:strict`,
`check-roadmap`, and the full `check` via `build-order`.

## Evidence

| Step | Command | Result |
|---|---|---|
| Predecessor commit | `npm run session:close` | `7e448c0` — the adventure increment, 28 files, gates green |
| Baseline | `npm run check:fast` | 41 passed, 0 failed |
| Baseline harnesses | five suites + pattern buffer | output-contracts 427 · backfill 105 · narrative 76 · briefing 16 · persistence 46 · pattern buffer 18/18, blocking 0 |
| Output contracts | `npm --prefix holonovel run test:output-contracts` | **450 passed, 0 failed** (+23) |
| Backfill | `npm --prefix holonovel run test:backfill` | **109 passed, 0 failed** (+4) |
| Narrative | `npm --prefix holonovel run test:narrative` | **81 passed, 0 failed** (+5) |
| Briefing | `npm --prefix holonovel run test:briefing` | **18 passed, 0 failed** (+2) |
| Persistence | `npm --prefix holonovel run test:persistence` | **48 passed, 0 failed** (+2) |
| Pattern buffer | `npm --prefix holonovel run test:pattern-buffer` | blocking failures 0 |
| Coverage register | `npm run validate -- --write-register` | 0 errors; buckets A 0 / B 0 / C 490 / E 118 |
| Registers (`--strict`) | `npm run check-registers:strict` | PASS |
| Roadmap | `npm run check-roadmap` | PASS — 12 sections |
| Tool surface | `npm run surface-budget` | PASS — full 28,713 / standard 25,115 |
| Tool definitions | `check-tool-definitions-sync` after regeneration | PASS |
| Types | `npm run typecheck`, `npm --prefix holonovel run typecheck` | clean |
| Fast gate | `npm run check:fast` | 41 passed, 0 failed, trailing `check:fast: PASS` |
| Full gate | `npm run build-order` | 0 errors, 286 warnings, "Ready to commit" |

### Red transcripts (before the implementation)

- `test-output-contracts`: 431 passed / **12 failed** — roster `race` derivation,
  `roster://race`, `roster://class`, the duplicate-import `[STATE_CONFLICT]` and
  its hint wording, the post-removal re-import, `[present]` after clearing the
  last entity, the duplicate-by-source-id branch, the last-roster-entry removal,
  and the empty-state marker.
- `test-briefing`: T351 failed on the missing Party listing.
- `test-backfill`: T331 (contradiction warning) and T312 (fast-forward bridging,
  round countdowns) failed on the absent behaviour.
- `test-narrative`: T056 failed on the missing depth markers.
- `test-persistence`: T057 failed on the pre-`scene_tick` save.
- `test-output-contracts` (description): T191's extended blocks failed on the
  divergent read.

## Deviations

1. **`presence.location` reuses the existing `location` parameter.**
   `manage_scene (action: set)` already declared `location`; adding a second
   parameter would have collided, so the staging alias (`:7974`) now picks the
   same field into its schema and the description states the presence use. The
   tool surface moved 50 tokens (28,663 → 28,713), refreshed in DECISIONS.
2. **`characters_present_ids` became nullable.** REQ-307a's "omitted means all
   present" is unrepresentable while the field defaults to `[]`. The type is
   now `string[] | null`, `null` means never declared, and every reader goes
   through `presentEntityIds`/`isPresent`. This is the fix for the plan's Risk 2
   and a small, contained behavior change beyond the report's wording.
3. **Social-check memory ingestion has no surface to hook.** No in-tree
   resolution path exists for a social check (the tool description routes checks
   to the bound ruleset's roll tools), so REQ-311d's automatic social branch is
   unhooked. Combat, disposition outcomes (including an explicit GM
   disposition change), party knowledge, and campaign coupling are implemented
   and asserted. Recorded as a P3 coverage note, not a new roadmap item.
4. **The scene-history cap assertion landed in `test-output-contracts`,** not
   `test-backfill` as the plan said, because it needs a per-test
   `TTRPG_SCENE_HISTORY_MAX`; the backfill harness shares one process.
5. **No new test IDs.** Assertions extend the existing T056/T057/T137/T191/
   T216/T217/T219/T220/T312/T331/T351 blocks rather than inventing catalogue
   IDs absent from Appendix F — which is the P2 finding on harness label
   hygiene. The duplication that remains (T220, T056) is that finding's scope.
6. **Register rewrite, first attempt.** The first edit duplicated large regions
   of `spec/audit/review-register.md` (a bad slice boundary). `check-registers`
   in strict mode caught it during `build-order`; the file was restored from
   `HEAD` and re-applied with a heading-count assertion. The failing artifact
   never reached a commit.

## Condition and review follow-through

- Plan-review carried no conditions. The cold pass's three Blockers and six
  Majors were resolved in the plan before execution; the two nits it raised
  afterwards (per-NPC-per-scene increment unit, SDK dispatch assumption) are
  visible in the code as `appearance_scenes` dedup and the Phase-1 probe.
- The execution order followed the plan: predecessor commit → baseline →
  red probes → phases 2–8 → registers and roadmap → gates. No step was skipped
  and no assertion was written after its implementation except where noted in
  the red transcript (each finding had at least one assertion observed red
  before its fix).

## Register and roadmap

- `spec/audit/review-register.md` gains the dated resolved block; chunk P3b-2
  keeps F-P3B2-9…14 under the new section title.
- `ROADMAP.md` §5.6 split in two; both triggers narrowed to their own finding
  range (`check-roadmap` and `check-registers:strict` green).
- `spec/audit/req-coverage.md` regenerated (buckets unchanged).
- `spec/04-runtime.md` §7.6 gained `TTRPG_SCENE_HISTORY_MAX`; the config-surface
  validator check passes (it reads the assembled `holonovel.md`, so
  `npm run assemble` must precede it).

## New action items

None at P0/P1. The three notes above (social-check hook, test-ID duplication,
reserved roster tokens) are recorded in place; none is a demonstrated failure
that needs a roadmap entry beyond the existing P2 harness-hygiene section.

LOOP PAUSED
