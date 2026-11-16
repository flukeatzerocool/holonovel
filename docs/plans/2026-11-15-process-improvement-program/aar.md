# After-action report — process improvement program

Covers I0 (process contract plus five ROADMAP admissions) and I1 (anchor
maintenance). Terminal state: LOOP PAUSED at the end of I1.

## What was supposed to happen

Execute `docs/plans/2026-11-15-process-improvement-program/plan.md` (stamped
fresh, standard depth): land I0 (four cadence rules, one routine pointer, five
ROADMAP admissions) and I1 (`check-anchors` in the fast tier, `session:close`
heals anchors before gating, a demonstrated red probe), file I2–I6 as scheduled
work, and close as two commits through `session:close --single`.

## What happened

| Phase | Outcome |
|---|---|
| Plan gate | Cold pass 1 FAILED (5 Blockers, 8 Majors). Plan revised; cold pass 2 passed 13/13; stamped `fresh`, standard depth. |
| I0 | Committed `afe4f87`. Baseline `check:fast` was 44/45 — the one red was this increment's own missing `tasks.md`/`aar.md`, the exact defect R3 fixes. |
| I1 | `check-anchors` moved to the fast tier; `session:close` heals before gating; red probe demonstrated; committed. |

## Verification

| # | Command | Result |
|---|---|---|
| V1 | `npm run check-loop-artifacts` (after I0 artifact) | 0 errors, 7 warnings (other increments) |
| V2 | `npm run check-roadmap` | OK, 7 sections admitted |
| V3 | `npm run check-gate-table` | PASS after regenerating the AGENTS.md table |
| V4 | `npm run check:fast` (I0) | 45 passed, 0 failed — `check:fast: PASS` |
| V5 | Red probe: 3 lines prepended to `holonovel/src/index.ts` | `check:fast` → 41 passed, **1 failed** (`check-anchors`) |
| V6 | `npm run fix-anchors` with the probe in place | 21 drift(s), 0 unresolved; `check-anchors` → `predicates current` |
| V7 | `git checkout` the probe away | `check-anchors` → `predicates current`; tree clean of probe |
| V8 | `npm run check:fast` (I1) | 45 passed, 0 failed — `check:fast: PASS` |

## Deviations from plan

- **I1 task 9 (add two anchor self-test cases) was not executed.** The cases
  already exist in `scripts/test-anchor-tooling.ts`: "a single candidate is found
  however far it moved" (`:54`), "two candidates outside the window are
  ambiguous" (`:64`), the CLI drift-red (`:93`), and the write-repair
  (`:95-97`). Adding duplicates would breach the duplicate-check discipline.
  Recorded, not re-implemented.
- **I0's ROADMAP titles were adjusted** so the fix-up measurement stays one
  section: R11 is carried by the existing section (amended in I2), and R3 gets a
  separate "loop artifact gate ordering" section. Same scope.
- The five admissions are the plan's I2–I6, with I6 explicitly scheduled rather
  than executed here (condition C-1).

## Finding triage

- **F1 (P0, process) — the plan's own increment reddens the fast gate until the
  artifact lands.** Predicate: `scripts/lib/loop-artifacts.ts:65-72` errors on a
  missing `tasks.md`/`aar.md`, and `check:fast` runs it. Observed as the I0
  baseline (44/45). This is exactly R3/I2, already scheduled on ROADMAP.
  Disposition: scheduled-roadmap.
- **F2 (P3) — `check-loop-artifacts` warns on seven older increments with no
  `**Done bar:**` line.** Predicate: the warning list names them. Pre-existing,
  out of scope. Disposition: Closed-P3.
- **F3 (P3) — the plan predicted six ROADMAP sections; the gate reports seven.**
  Predicate: `check-roadmap` output. The seventh is the pre-existing fix-up
  section, which was counted as one of the five before I2 re-scoped it.
  Recorded; no action.

## What went right

- The cold pass paid for itself before execution: four of five Blockers were
  premises I had asserted without reading the code (`assemble.ts` already writes
  both copies; the pre-commit hook skips on a recorded pass; `validateIncrements`
  already runs at close; no `retires` field exists). Each fix made the increment
  smaller, not larger.
- The red probe is a captured output, not a claim: 21 anchors moved, the gate
  went red, the heal resolved all 21, and the tree restored clean.
- `check-anchors` costs well under a second in the fast tier, so the gate is
  affordable at commit time.

## What went wrong

- The plan was drafted against assumptions rather than the code, which cost one
  full review round. The lesson is the one the recommendations encode: read the
  predicate before writing the change entry.
- `session:close` derived its subject from the CHANGELOG heading as designed, but
  the I1 heading had to be authored manually before the second close — the
  bookkeeping cost R9/I5 is meant to remove, still manual here.

## Outcome vs done bar

All five items hold: I0 and I1 landed with `check:fast` green; `check-anchors`
runs in the fast tier; `session:close` heals before gating; I2–I6 are written
into `ROADMAP.md`; the increment has `plan.md`, `tasks.md`, and this `aar.md`.
None of the five recommendations outside I0/I1 was executed here; they are
scheduled with triggers.

LOOP PAUSED
