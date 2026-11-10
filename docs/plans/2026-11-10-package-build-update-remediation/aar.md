# After-action report — §5.17/§5.18 package build and update remediation

Plan: `plan.md` (stamped fresh, standard depth). Executed 2026-11-10.

## Outcome against the done bar

| Done-bar item | Result |
|---|---|
| F-P6b-7, F-P6b-15 `Resolved` with `file:line` evidence | Done — moved to `## Resolved — 2026-11-10` in `spec/audit/review-register.md` |
| Roadmap section removed | Done — `ROADMAP.md` opens at §5.18 deploy remediation; `check-roadmap` passes |
| Fresh emission reproduces the committed package | Done — six-file `--check` passes; gate wired as `check-fixture-emitter` |
| `update --apply` stages, gates, refuses a gate-defective emission | Done — T689 gate-refusal case passes; installed package byte-identical after refusal |
| `assemble`, `check:fast`, `build-order` pass | Done — `check:fast` PASS 38/38; `build-order` complete |
| AAR terminal token | `LOOP OPEN` — publication/deploy verification not run this session |

## What was built

1. **Covered package.** `scripts/ruleset-builds/fixture/build-package.mjs` emits
   the sanctioned non-commercial fixture from its committed parts with a pinned
   `built_at`; `.gitignore` narrows to `scripts/ruleset-builds/*` plus a
   `!fixture/` negation, and `check-reference-server-cleanliness` sanctions the
   exact prefix only.
2. **Freshness gate.** `scripts/check-fixture-emitter.ts` + a
   `check-fixture-emitter` manifest entry + the regenerated AGENTS table;
   `version-bump` re-emits the package on a version advance.
3. **Emitter invocation.** `build-ruleset` resolves and runs the emitter for
   covered/registered slugs, records `emitter_args: ["--out", "{dir}"]`, and
   keeps the printed Build invocation only for extraction-only slugs.
4. **One staged rebuild path.** `runRebuildWithGates` (staging → REQ-430/559/560
   gates → backup → swap) is used by both `build-ruleset` and `update`; the
   replay harness gained `--package <dir>`.
5. **Supplement overlay.** `slug+=path` intake; `scripts/lib/ruleset-supplement.ts`
   merges by key (idempotent), snapshots the base for rebuild, hashes sources,
   and the registry + `<state>/build-provenance.md` record base/supplement/result
   hashes. `update` and `update-rulesets` report drift against the base's
   **current emission**, with `unavailable` / `no-hash` kept distinct.
6. **Assertions.** T463, T650, T656, T657 added; T499 and T689 extended;
   coverage register refreshed (REQ-395a, REQ-557, REQ-563, REQ-564 now cite
   their exercising tests).

## What went right

- The cold review caught five structural defects before code: the tautological
  base-drift comparison, the install-dir baseline that broke fresh-clone
  emission, the unspecified overlay interface, the missing gate script, and
  gate-after-write. Each fix is visible in the shipped predicates.
- Existing fixtures in `test-update-workflow` were reconciled before running:
  its one-file emitter was upgraded to a six-file package so the new gate set is
  satisfiable.

## What went wrong / deviations from the plan

- **`runRebuildWithGates` lives in `scripts/lib/ruleset-registry.ts`, not the
  `.mjs` kit.** TypeScript scripts (`build-ruleset`, `update`) cannot import a
  `.mjs` module without `allowJs`; the helper sits beside `resolveEmitter`. The
  gate list is duplicated in the kit and the TS helper, with a comment on each
  to keep them in step. A shared `.d.ts` or a `allowJs` change would remove the
  duplication — recorded as P3, no demonstrated failure.
- **`mergeSupplementParts` lives in a new `scripts/lib/ruleset-supplement.ts`**
  rather than the kit, for the same reason. It also owns hashing and the base
  snapshot.
- **A staging-directory bug surfaced during execution:** external emitters that
  write straight into `--out` failed because the staging dir did not exist.
  `runRebuildWithGates` now creates it. Caught by the T689 harness, not by the
  plan.
- **The recorded-base test simulates drift by corrupting the recorded hash**
  rather than editing the base's durable source. The predicate (recorded vs
  current emission) is the same; a scratch-emitter variant would be more
  faithful and is noted below.

## Verification evidence

- `npm run check:fast` → PASS, 38/38 (includes `check-fixture-emitter`,
  `check-registers`, `check-gate-table`, `typecheck`).
- `npm run build-order` → complete: assemble, full check (0 errors), propagate,
  typecheck, version bump (covered package re-emitted), markers, version check.
- `npx tsx holonovel/scripts/test-ruleset-gates.ts` → 23 passed, 0 failed.
- `npx tsx holonovel/scripts/test-fingerprints.ts` → 15 passed, 0 failed.
- `npx tsx holonovel/scripts/test-update-workflow.ts` → 18 passed, 0 failed.
- `npx tsx holonovel/scripts/test-ruleset-nonovel.ts` and `--package <fixture>`
  → 9/9 and 1/1.
- Manual end-to-end in a temp data dir: emission, dry-run/apply, supplement
  overlay twice (identical hash, one concept), drift reporting in both
  entry points, registry recipe dedupe.

## New findings

- None at P0/P1. Three P3 notes, recorded here (not roadmap items):
  - duplicate gate list across the kit and the TS helper (above);
  - the fixture replay is vacuous (zero declared tools), so REQ-560 coverage
    for this package is structural only — the synthetic `fixture558` replay
    remains the real exercise;
  - REQ-557's wording says "installed base package"; the implementation
    compares the base's current *emission*. The acceptance criterion is
    satisfied; the wording difference is carried forward as a spec-clarification
    candidate, not a defect.

## Loop status

Gates green and the tree is ready to commit. Deployment has not been verified:
publication (`./scripts/push-pipeline.sh`) is a separate, explicitly authorized
step.

LOOP OPEN — next action: commit (`npm run session:close`), then publish on the
user's instruction.
