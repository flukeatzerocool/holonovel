# After-action report — §5.18 deploy, state, and publication remediation

Plan: `plan.md` (deep, stamped fresh). Done bar: the four findings are
`Resolved` with a cited assertion; the roadmap section is removed; gates green;
T466, T465, T491, T462, and T510 each run an assertion that fails on the pre-fix
tree; AAR ends `LOOP PAUSED`.

## Result against the done bar

- F-P6b-8, F-P6b-13, F-P6b-14, F-P6b-19 are `Resolved` in
  `spec/audit/review-register.md` with `file:line` predicates and the harness
  that exercises each (T466, T465/T491, T462, T510).
- The `§5.18 deploy, state, and publication remediation` roadmap section is
  removed; F-P6b-21 and the citation-repair bullet are narrowed to the
  remaining gaps.
- Gates: `check:fast` 40/40 PASS; `check` PASS; `test:pipeline` 27/27;
  `test:package-smoke` 11/11; `build-order` complete.
- Red tests: each new assertion was written against the pre-fix behaviour
  (no `[state-in-tree]`, no state guard, generic fast-forward message,
  stubbed `deploy=true`, working-copy hash fallback, version-only manifest
  check) and fails on it.

## What went right

1. The cold plan review caught two defects that would have shipped: the
   original deploy guard was tautological and would also have refused the live
   deployment (whose state is gitignored and survives `clean -fd`), and the
   schema keyword claim was measured wrong (24 keys, not 13). Both were fixed
   before the first edit.
2. Running the guard against the real deploy clone's ignore rules during
   preflight (probe 7) turned an abstract "refuse in-tree state" rule into the
   correct "refuse only what checkout/clean would touch" rule.
3. The `--report-only` discovery in the cold pass prevented a fail-closed
   change that would never have fired: the consumer reads the explicit
   `baseline_missing` field, not the exit code.
4. The hermetic pipeline harness absorbed the new preflight manifest check by
   carrying the committed manifest and schema — no weakening of the gate.

## What went wrong

1. The docker daemon is unreachable for this user, so probe 6 (build the image
   by hand) could not run. `check-container-image` skips with a notice; the CI
   `container` job is the only proof of the image so far. The gate's
   daemon-unreachable branch was added after the first failure rather than
   planned.
2. The first W1 harness case asserted a per-OS resolution that the workspace's
   existing legacy `.holonovel-state` legitimately overrides; the case was
   rewritten to assert delegation to the resolver plus a no-hardcoded-fallback
   source check.
3. `publish-guards.ts` initially called `resolveDataDir` (which mkdirs) from the
   guard; caught in implementation and switched to the no-create
   `locateStateDir`.
4. The `--stage deploy` harness assertion compared the deploy clone to the local
   HEAD instead of the published head; corrected after the first run.

## Register state

- Review register: four dispositions moved to `## Resolved — 2026-11-10`;
  F-P6b-21 remains Scheduled-roadmap for the remaining §5.16–§5.18 citation
  gaps (T440, T442–T447, T451, T457, T458, T463–T464, T467, T492).
- Coverage register: REQ-397 moved out of the intended-gap whitelist (now
  server-cited); REQ-396/418/428 evidence recorded; register regenerated.
- Roadmap: 16 scheduled sections after the removal; nothing added.

## Recommendations

None requiring a new plan. The remaining work is already scheduled
(`ROADMAP.md`), and the one unverified item is a CI job, not a code change:

- Confirm on the next push that the CI `container` job builds the image and
  prints the launcher usage (REQ-428's image half is otherwise unproven on a
  machine without a reachable docker daemon). This is a verification step in
  the existing pipeline, not a new action item.

LOOP PAUSED
