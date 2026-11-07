# After-Action Report — Materialize lore `visibility`

Session 2026-11-07. Plan: `plan.md`. Tasks: `tasks.md`.

## What was asked

The user asked for a plan for the remaining action item, confirmed both
plan-review conditions (strict legacy migration; Observer treated as non-GM),
and authorized execution.

## What happened

1. Stamped and reviewed the plan; baseline was clean (`check:fast` 36/36,
   `test:output-contracts` 321 passed, `test:persistence` 41 passed).
2. Added `LoreVisibility`, `visibility`, and `known_by` to `LoreEntry` and
   normalized both in `migrateNovelData`.
3. Added the `manage_lore` schema parameter, set/update handling, lore reveal,
   and export/import round-trip.
4. Routed lore read access through `loreVisible` across the briefing,
   resources, list/get, narrator clearance, player-safe export, campaign
   memory, index/graph scopes, and the draft scan; added the REQ-083f presence
   gate to non-GM triggered lore.
5. Initialized `known_by` and the intended visibility at every creation site.
6. Implemented T342 and updated T693's shared fixture.
7. Extended the T342 spec row, corrected T67/T400/T438, and added both fields
   to Appendix L.
8. Re-baselined the tool surface after trimming the `manage_lore` description
   to the 1000-byte budget, regenerated the coverage register and
   `tool-definitions.json`, and closed the ROADMAP and review-register rows.

## What went right

- The plan's evidence table resolved every edit site before the first change;
  no orphan surface was found.
- The read-gate helper kept the three named surfaces, list/get, and resources
  in agreement on the first test run.
- The legacy-shape probe proved the migration across two separate processes:
  the saved entry carried `visibility: "gm_only"` and `known_by: []`, and a
  second process reloaded the same shape.

## What went wrong

- The first `check:fast` after the change failed `validate` (stale coverage
  register), `check-tool-definitions-sync` (stale snapshot),
  `tool-definitions-lint` (`manage_lore` description 1094B over the 1000B
  budget), `surface-budget` (stale baseline and token counts), and
  `check-loop-artifacts` (the AAR did not exist yet). All were expected
  close-out steps except the description budget; the description was trimmed
  to exactly 1000 bytes and the surface baseline re-recorded.
- The first surface re-record still reported the old DECISIONS token counts;
  `--write` updates the baseline JSON only, so the DECISIONS line was updated
  manually to the measured 27,228 / 23,630 / 1,149.
- Execution regenerated two artifacts the approved blast-radius table omitted
  (`spec/audit/tool-surface-baseline.json`, `spec/build-phase-map.md`). The
  plan was amended, re-stamped (`1a7f58d5…`), and preflighted again before
  continuing; no scope changed.

## Findings and dispositions

| ID | Finding | Severity | Disposition |
|---|---|---|---|
| F-1 | Pre-existing shared-scope lore becomes `gm_only` after migration | P1 (user-visible behavior change) | **By design**, confirmed by the user (C-1); named in the CHANGELOG with the recovery command. No code change |
| F-2 | Observer now hides `gm_only` lore and applies the presence gate | P2 (interpretation) | **By design**, confirmed by the user (C-2); recorded in DECISIONS D3 and exercised by T342 |
| F-3 | `manage_lore` description budget forced a wording trim | P3 | **Resolved** in this increment; description is exactly 1000 bytes and `tool-definitions-lint` passes |
| F-4 | The plan's blast-radius table omitted two generated artifacts | P3 | **Resolved** by plan delta amendment and re-stamp before close; no scope change |

## Evidence

| Step | Command | Result |
|---|---|---|
| Baseline | `npm run check:fast` | 36 passed, `check:fast: PASS` |
| Baseline | `cd holonovel && npm run test:output-contracts` | 321 passed |
| Baseline | `cd holonovel && npm run test:persistence` | 41 passed |
| Types | `cd holonovel && npx tsc --noEmit` | exit 0 |
| Legacy migration | two-process tsx probe | saved and reloaded `visibility: "gm_only"`, `known_by: []` |
| T342 | `cd holonovel && npm run test:output-contracts` | 338 passed, 0 failed |
| Persistence | `cd holonovel && npm run test:persistence` | 41 passed, 0 failed |
| Briefing | `cd holonovel && npm run test:briefing` | 14 passed, 0 failed |
| Narrative | `cd holonovel && npm run test:narrative` | 49 passed, 0 failed |
| Graph | `cd holonovel && npm run test:graph` | 5 passed, 0 failed |
| Security | `cd holonovel && npm run test:security` | 12 passed, 0 failed |
| Adventure | `cd holonovel && npm run test:adventure` | 19 passed, 0 failed |
| Tool lint | `npx tsx scripts/tool-definitions-lint.ts` | PASS (37 tools, 0 violations) |
| Coverage | `npm run validate -- --write-register` | T342 bound to REQ-083 and REQ-307 |
| Final fast gate | `npm run assemble && npm run check:fast` | 36 passed, `check:fast: PASS` |
| Build order | `npm run build-order` | exit 0; 0 errors; propagate/typecheck/version OK |
| Full gate | `npm run check` | `check: PASS` |

## Loop status

`LOOP PAUSED`

The roadmap item is closed, the register row is Resolved, the plan's done bar
holds (T342 passes; `gm_only` is Player-invisible; `shared` is visible; reveal
and the presence gate behave as specified), and no new P0/P1 action item
remains. Push is out of scope for this session.
