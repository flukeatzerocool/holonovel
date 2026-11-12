# After-action report — §5.6 state surfaces remediation

Increment: `docs/plans/2026-11-12-5-6-state-surfaces-remediation/`
Commit target: one spec increment.

## Outcome against the done bar

All fifteen findings F-P3B4-1…15 are `Resolved` in
`spec/audit/review-register.md` with current predicates. The ROADMAP section is
removed. Five harness suites pass; root and server typecheck are clean;
`check:fast` and the full `check` inside `build-order` are green. The coverage
register is regenerated unchanged in shape (A 0, B 0, C 490, D 0, E 118) and the
nine touched REQ families stay bucket C. No tool, parameter, resource, or gate
was added. One Novel-persisted key (`world_in_motion`) was added under the
existing §7.7 World in Motion property group.

## What went right

- The register's stale line anchors were re-anchored on symbols before each
  edit, so no phase edited the wrong site.
- Two findings (F-P3B4-3's neutral marker set, F-P3B4-8's captured `ruleset`)
  were already implemented; the increment spent assertion-only effort there and
  recorded the fact rather than inventing a code change.
- The plan's blocking issues (marker-clear ordering, second persisted key) were
  caught by the cold pass before implementation; the implementation followed the
  corrected D4/D5 and did not repeat them.

## What went wrong

- **Red-first was not uniformly observed.** The test assertions for T268/T275/
  T280/T334/T384/T270/T358 were written after Phases 2–5 landed. The first
  suite run still produced genuine red findings (three backfill failures, two
  narrative failures, one briefing failure, four output-contract failures), but
  several fixes had already been applied before those assertions existed, so
  those rows are verified green, not red-proven. Deviation recorded.
- **Test-only mistakes cost three cycles:** a nickname assertion that relied on
  an unaudited tool (`manage_story`), a scene audit entry lost because
  `saveNovel` runs before `audit`, and a case-sensitive goal comparison. The
  first two exposed real behaviours worth knowing (story beats are not audited;
  the audit append after `saveNovel` depends on a later save).
- Two uncovered gaps surfaced while widening assertions and were fixed in-plan
  because they are the same contract surface: the session-boundary marker
  carried no `started_at`/`ended_at` (REQ-237a) and `manage_context (action:
  recap, session_id)` never scoped a live session (REQ-237b1).

## Evidence

| Step | Command | Result |
|---|---|---|
| Baseline | five harnesses | 390/105/15/75/46 passed, 0 failed |
| Red pass | `test-backfill` | 102 passed, 3 failed (T280 end workflow, T334 badge after unresolved workflow, T277 pending workflow) |
| Red pass | `test-narrative` | 74 passed, 2 failed (T270 pause capture, transition marker clear) |
| Red pass | `test-briefing` | 15 passed, 1 failed (T358 non-NPC change) |
| Red pass | `test-output-contracts` | 390 passed, 4 failed (T275 scoping/boundary, T384 partition) |
| Final | `test-backfill` | 105 passed, 0 failed |
| Final | `test-narrative` | 76 passed, 0 failed |
| Final | `test-briefing` | 16 passed, 0 failed |
| Final | `test-output-contracts` | 396 passed, 0 failed |
| Final | `test-persistence` | 46 passed, 0 failed |
| Types | `npm run typecheck`, `holonovel` `tsc --noEmit` | clean |
| Spec | `npm run assemble` + `validate --write-register` | 0 errors, 286 warnings; register A 0 / B 0 / C 490 / E 118 |
| Full gate | `npm run build-order` | `check: PASS` after the starter-novel rebuild |
| Fast gate | `npm run check:fast` | `check:fast: PASS` |

## Deviations from the plan

1. REQ-065f's `_Check:` was re-pointed to T224 rather than a new T52 harness
   (planned D11).
2. `world_reactivity_warnings` is derived at render time, not persisted
   (planned D5; keeps the one-key claim true).
3. `TTRPG_WORLD_REACTIVITY=off` is now honoured alongside `false`; the previous
   parser treated only `false` as off.
4. The session-boundary marker gained `started_at`/`ended_at` and the live-session
   recap scoping was implemented during assertion widening (REQ-237a/b1; same
   surface as F-P3B4-13).
5. `test-backfill`'s note test ends a temporary Novel through the end-Novel
   confirmation workflow rather than calling `end` bare.

## New action items

None. The widened T275 exposed the audit-append ordering (a `saveNovel` before
`audit` relies on a later save for durability). It is a pre-existing behaviour
outside this finding set and did not produce wrong output in the increment; if a
future increment adds an `audit`-only path it should save after the append.
Recorded as an observation, not a scheduled item.

LOOP PAUSED
