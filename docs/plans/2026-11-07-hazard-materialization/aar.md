# AAR — hazard-annotation materialization

Session 2026-11-07. Plan: `plan.md` (stamped sha256 `2a95d4a8…`), tasks:
`tasks.md`. Roadmap item: "Materialize adventure-module hazard annotations".

## Done bar

| Clause | Result |
|---|---|
| Well-formed `@encounter`/`@trap` materializes the target room's annotation through convert and load | **Met** — probe and two harness assertions |
| Reported linked-annotation counts become non-zero | **Met** — `encounters: 1`, `traps: 1` in the load and convert messages |
| Prose-only or invalid annotation writes nothing and warns without blocking | **Met** — `annotation not materialized`, load still `[OK]` |
| Appendix K documents the clause and no longer calls the annotations inert | **Met** — grammar block, behavior paragraph, format example |
| `test-adventure`, `test-backfill`, `test-starter-novel` green | **Met** — 16/16, 77/77, 15/15 |
| `check:fast` and `check` green on the assembled tree | **Met** — 36/0 `check:fast: PASS`; `build-order` 0 errors |
| Roadmap item removed; `@npc`/`@lore` gap scheduled | **Met** — ROADMAP + register updated in the same change |

## Evidence

- `npx tsx /tmp/opencode/probe-convert.ts` → `{"encounters":1,"npcs":0,"traps":1,"lore":0}`,
  both room annotations populated, malformed clause warned, `@npc` reported as
  guidance.
- `npm run test:adventure` → 16 passed, 0 failed (before: 15).
- `npm run test:backfill` → 77 passed, 0 failed (before: 76).
- `npm run test:starter-novel` → 15 passed, 0 failed (hazard firing unchanged).
- `npm run assemble` → spec SHA-256 `f7cf5782…`.
- `npm run check:fast` → 36 passed, `check:fast: PASS`.
- `npm run build-order` → 0 errors, 258 warnings (pre-existing proofreading
  register count), propagate/version/typecheck OK.

## Findings

| Finding | Predicate | Disposition |
|---|---|---|
| The roadmap described the defect as "counts but never writes"; the counts were a zeroed literal, so the user-facing message claimed links that did not exist | `holonovel/src/world/model.ts` `annotationCounts` declaration (was never incremented) | **Resolved** in this increment; register row moved to Resolved |
| `@npc`/`@lore` mechanical linkage is unimplemented while Appendix K and T244 claim it, and the old warning falsely reported a link | `holonovel/src/world/model.ts:applyAnnotationLine` guidance branch | **Scheduled-roadmap** — ROADMAP entry + Scheduled-roadmap row |
| Room resolution needed to ignore a leading article (`@trap(Hall of Statues)` vs `The Hall of Statues is a room.`), which the plan stated only as case-insensitive matching | `annotationName` in `model.ts` | **Resolved** in-session; recorded as a plan amendment |
| T244's `manage_ruleset (action: search)` retrievability assertion has no exercising harness | spec test table row T244 | **Closed-P3** — no gate consumes it, and the row's other half is now reachable |
| Clause-bearing annotations are new author-facing syntax; prose-only modules still load but now warn | Appendix K | **Resolved** — documented; the alternative (prose inference) was rejected for fabricating mechanics |

## What went right

- Probing the runtime before planning turned the roadmap's imprecise claim into a
  precise defect statement and surfaced the Appendix K contradiction before any
  code was written.
- The plan's three review conditions each mapped to a real defect: the format
  example, the assertion splitter, and the preserved-world branch.

## What went wrong

- The first load-test run failed on a fixture key (`trap hall` vs `the trap
  hall`); the assertion was wrong, not the code. Fixed in one iteration.
- Typecheck rejected `avoid: number | null` on the first pass; the null is now
  folded to `undefined` explicitly.

## Loop status

`LOOP PAUSED`

Gates green, no open P0/P1 beyond the scheduled roadmap. Publication of this
increment is deliberately not part of it (the maintenance instruction for this
session was "do not publish"); it is covered by the standing roadmap item that
rehearses the publication engine, together with the six commits already ahead of
origin.
