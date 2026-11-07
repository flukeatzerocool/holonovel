# Plan — Recover the CI shell lint failure and close the recurrence gap

**Status:** executed · **Date:** 2026-11-07 · **Depth:** standard
**Review independence:** self

## Done bar

**Done bar:** `shellcheck -S warning` reports zero findings on the four shell
entry points; `check-script-discipline` catches a dead color variable without
`shellcheck` installed and runs the real linter when it is; the detector
self-test asserts both cases; `npm run check:fast` and `npm run check` exit 0;
the CI run for the pushed commit is green.

## Evidence (root cause)

- CI run 42409264303 failed at "Shell script lint (entry points)" with
  `SC2034: GREEN appears unused` at `scripts/push-pipeline.sh:27`.
- The legacy-engine retirement (`20e76d3`) kept the `GREEN` assignment while
  its uses moved into the step-registry driver (`scripts/publish/run.ts`).
- The maintainer's machine has no `shellcheck` in PATH, so no local gate could
  see the finding; AGENTS.md recorded the CI-only policy that allowed it.

## Blast radius

| File | Change | Size |
|---|---|---|
| `scripts/push-pipeline.sh` | drop the dead `GREEN` assignment (both branches) | S |
| `scripts/lib/script-discipline.ts` | unused color declaration detector in `shellIssues` | S |
| `scripts/test-script-tooling.ts` | fixture and assertions for the new detector | S |
| `scripts/check-script-discipline.ts` | one shell entry-point list; run `shellcheck` when installed | M |
| `AGENTS.md` | shellcheck policy: opportunistic local, CI authoritative | S |
| `CHANGELOG.md` | dated entry | S |

Rollback cost: 1 (reversible edits; no external state, no schema).

## Alternatives considered

1. npm `shellcheck` wrapper as a devDependency — rejected: downloads a binary
   at first use (network in a gate) and adds 129 transitive packages.
2. CI-only authority, unchanged — rejected: that arrangement produced a red
   `main` and has no local reach.
3. Full SC2034 reimplementation — rejected: false positives on `IFS`,
   exported variables, and indirect expansion; the detector is scoped to
   ANSI-escape assignments.

## Steps

1. Remove `GREEN=` from both color branches in `scripts/push-pipeline.sh`.
2. Add the unused-color-declaration detector to `shellIssues`.
3. Add the self-test fixture (dead `GREEN`, live `RED`) to
   `test-script-tooling.ts`.
4. Discover shell entry points once (all `.sh` plus every `.githooks` hook),
   feed the same list to `shellcheck -S warning` when available, and skip
   with a notice when absent.
5. Update the AGENTS.md shell-discipline paragraph.
6. Record the CHANGELOG entry and this increment.

## Verification

1. `npx tsx scripts/test-script-tooling.ts` — detector assertions pass.
2. `npx tsx scripts/check-script-discipline.ts` — passes, prints the
   `shellcheck unavailable` notice locally.
3. Same gate with a throwaway shellcheck 0.11.0 on PATH — runs the real linter
   and passes.
4. Negative control — append a dead `BLUE` declaration; both the TS detector
   and real shellcheck fail; restore.
5. `npm run check:fast`, then `npm run check`.
6. After push, the CI run for the new commit is green.
