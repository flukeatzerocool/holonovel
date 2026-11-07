# AAR — CI shell lint recovery

Session 2026-11-07. Plan: `plan.md`.

## What happened

- CI run 42409264303 failed in 9s at "Shell script lint (entry points)":
  `shellcheck -S warning` reported SC2034 — `GREEN` was assigned in
  `scripts/push-pipeline.sh` and never referenced.
- The dead declaration was left by the legacy-engine retirement (`20e76d3`):
  the color variable's users moved into `scripts/publish/run.ts`, the shell
  entry point kept only the assignment. Every local gate was blind to it
  because `shellcheck` is not installed on the maintainer's machine.
- The fix removes `GREEN` from both color branches. `shellcheck -S warning`
  (0.11.0) then exits 0 on all four entry points.
- The recurrence gap was closed inside the existing `check-script-discipline`
  gate rather than with a new gate: one discovered entry-point list (all
  `scripts/**/*.sh` plus every `.githooks` hook — `commit-msg` was previously
  not linted locally), passed to real `shellcheck` when installed, plus a
  deterministic detector for a color variable assigned an ANSI escape and never
  referenced. The detector makes the SC2034 class fail `check:fast` even
  without `shellcheck`.

## What went right

- The failure was reproduced from the run log and traced to a specific commit
  before any edit; the fix is one line of shell.
- The negative control proved both paths: appending a dead `BLUE` made the TS
  detector fail with a named variable and made real shellcheck fail with the
  same SC2034, and the file was restored byte-identically.
- The existing gate absorbed the new checks, so the gate manifest, the AGENTS.md
  gate table, and the tool surface did not change.

## What went wrong

- The publication pipeline pushed a tree that `shellcheck` rejects, because the
  CI-only policy was documented but never reconciled with the "push runs the
  publication gates" claim. The local prerequisite set remains `node` + npm;
  the new linter run is opportunistic, so a machine without `shellcheck` still
  relies on the deterministic detector and on CI.
- `check-script-discipline` had silently skipped `.githooks/commit-msg` since
  the hook was added. That is fixed by the same discovery change (dry-run
  clean).

## Recommendations

None new. The open item is operational, not a finding: the next publication
runs the split-gates CI job and its run must be observed green (T10).

## Loop status

`LOOP PAUSED`

Gates are green: `test-script-tooling` (29 passed), `check-script-discipline`
(skip notice locally; real shellcheck 0.11.0 exit 0 on the four entry points),
`typecheck`, and `check:fast`. No P0/P1 remains: the demonstrated failure is
fixed and the recurrence class is gated. Publication (T10) is the remaining
step; the CI run for the pushed commit must be observed green.
