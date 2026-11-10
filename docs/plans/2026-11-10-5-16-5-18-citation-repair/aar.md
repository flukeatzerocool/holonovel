# After-action report — §5.16–§5.18 citation repair (F-P6b-21)

Increment: `docs/plans/2026-11-10-5-16-5-18-citation-repair/`
Date: 2026-11-10 · Loop status: **LOOP PAUSED**

## What happened

1. Took the top scheduled roadmap item (`§5.16–§5.18 citation repair`, P1)
   because its trigger — the next citation-remediation session — was live.
2. Ran the plan's preflight table against the tree: of the 20 REQs the finding
   names, 14 already resolved to exercising harnesses. The roadmap bullet text
   was stale, not the citations.
3. Repaired the six residuals: four re-points (REQ-387b, REQ-391b, REQ-393,
   REQ-398) and two written assertions (T464 runbooks, T492 editorial
   classification), plus moving T460 from a numeric-only check to a real
   update-preservation assertion.
4. The T492 work exposed an ordering hole in `classifyDelta`: an Editorial
   disposition could lower a state-model or tool-surface body change, skipping
   the harness/contract stage. Fixed fail-closed and demonstrated the red by
   diffing the pre-change classifier.
5. Closed F-P6b-21, retired its roadmap section, and opened F-P6b-27/-25 for
   two adjacent gaps the verification found but this increment should not fix.

## What went right

- **Verify-before-edit.** The disposition table (§4.0) prevented 14 pointless
  citation rewrites. The roadmap's claim was wrong in the safe direction.
- **Re-point beats re-word.** T448, T720, T462, T491 and T498 already carried
  the contracts; the repair was a citation and a row, not new harness code.
- **The cold review earned its cost.** Both majors in the second pass (the
  unexported helper, and the T456 reframing that would have "fixed" a citation
  by describing the surface the requirement excludes) were real.
- **The red was demonstrable.** `git show HEAD:scripts/lib/spec-delta-classify.ts`
  returns `editorial` for REQ-025 + a disposition; the current module returns
  `major`. The ordering hole is not a hypothesis.

## What went wrong

- **The plan guessed finding IDs.** `F-P6b-22` through `F-P6b-26` were already
  taken; the rename to `-27`/`-28` needed two amendments and a cold-review
  catch (the first amend used `-24`/`-25`, which were also taken). The preflight
  should have listed the occupied IDs before drafting.
- **The registry model was assumed.** The plan said the spec-derived
  `PACKAGE_FORMAT` would not need regenerating; editing §5.17 changed it, and
  the committed reference package had to be re-emitted
  (`node scripts/ruleset-builds/fixture/build-package.mjs --out …`). The first
  `build:covered-package` invocation wrote to `.holonovel-state`, not the
  committed fixture, which cost a second attempt and left a backup directory
  that had to be removed.
- **The first build-order run failed twice for artifact reasons** (stale
  fingerprints, missing `aar.md`), not for the change itself. Expected in
  hindsight; the plan listed both in §5 but not in the verification order.

## Evidence

| Gate | Result |
|---|---|
| `test:spec-tooling` | 78 passed, 0 failed |
| `test:fingerprints` | 16 passed, 0 failed (T460 new) |
| `test:selection` | 10 passed, 0 failed (T457 token) |
| `test:output-contracts` | 358 passed, 0 failed |
| `test:pipeline` | 27 passed, 0 failed (T467 tokens) |
| `test:ruleset-surface-remediation` | 16 passed, 0 failed |
| `test:update-workflow` | 20 passed, 0 failed |
| `test:ironsworn` | 4 passed, 0 failed |
| `validate --write-register` | 0 errors; REQ-391 +T457, REQ-393 +T498, REQ-398 +T462; no bucket moves |
| `check-registers`, `check-roadmap` | PASS (17 roadmap sections) |
| `check:fast` | PASS after `build-order` regenerated the fingerprint and the fixture |
| `build-order` | PASS (CalVer/AGENTS/DECISIONS/index/lockfile/server.json advance) |

## Recommendations

None actionable. The two gaps the verification surfaced are scheduled as
F-P6b-27 and F-P6b-28 under `§5.16–§5.17 capability citation gaps (P1)`, which
is the tracking surface; they are not restated here.

The 43-commit publication backlog predates this increment and is a separate
`./scripts/push-pipeline.sh` action, not a finding.

LOOP PAUSED

Deferred nit from the cold amendment review: plan §12's occupancy sentence spans
"Closed-P3 and scheduled entries"; all five cited anchors are Closed-P3. Left
uncorrected because editing the plan would invalidate the bound review hash for
a phrasing-only fix.

The T492 red departed from the AGENTS derived-chain practice of a failing test
before implementation: the fix and its assertion landed together, and the red
is evidenced by diffing the pre-change classifier (see the Evidence table's
`git show HEAD:scripts/lib/spec-delta-classify.ts` note).
