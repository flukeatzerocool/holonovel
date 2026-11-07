# AAR — workflow convergence

## What happened

Executed the approved item-1 plan in one increment: status report, commit-msg
hook, Agent Operating Routine, shared staging guards, partial-range rehearsal,
CI SHA pins, and atomic session commits. Commit 0 fixed a red baseline
(`version-check`: 2026.11.06 < 2026.11.07) before feature work; the feature
work landed under one pipeline commit; the docs close is the final commit.

## What went right

- The baseline check found the version-currency failure before any feature
  edit; the bump and README marker refresh were isolated in commit 0.
- The guard library is pure; the hermetic harness exercises the secret,
  deny-list, leftover, identity, and partial-range cases without a network.
- The planner and the real `commit-msg` hook are tested together, so a
  generated subject cannot drift from the hook.
- Bounded runs recompute `specHash`/delta and no bounded commit records a
  suite it did not run.

## What went wrong / conditions

- C-1 resolved: `actions/checkout` → `fbc6f399…` (`v5.1.0`),
  `actions/setup-node` → `a0853c24…` (`v5.0.0`), both from `git ls-remote`.
- C-2 resolved: fast suite baseline 34/34; timings are in
  `.holonovel-state/gate-timing.json`. Per-commit typecheck runs only for
  code-bearing buckets.
- C-3 resolved in isolation: the legacy CHANGELOG-heading transformation
  yields `2026-11-07 — Roadmap hygiene: scheduled work only`, which the hook
  accepts. No real publish was run.
- C-4 resolved: one version bump (commit 0); `version-check` is green after it.

## Verification

- `npm run check:fast` → PASS (36 gates with the two new self-tests).
- `npm run check` → PASS.
- `npm run test:pipeline` → 22/22.
- `npm run test:workflows` → 10/10.
- `npm run test:commit-plan` → 21/21.
- `npm run status` → exit 0 (roadmap now holds 2 items).
- Split close: `npm run session:close` dogfoods the `pipeline` + `docs` series.

## Recommendations

None new. The remaining roadmap items (real-publish rehearsal, hazard
annotations) are already scheduled. Record the split-commit gate ownership in
DECISIONS.md (done) so a future session does not re-litigate `--no-verify`.

LOOP PAUSED
