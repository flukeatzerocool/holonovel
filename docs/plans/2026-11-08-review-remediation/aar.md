# AAR — Review remediation: memory, identity, and evidence anchors

Session 2026-11-08. Scope: all 7 commits since `origin/main` (`aa4b6fe..8099cbb`).
Plan: `docs/plans/2026-11-08-review-remediation/plan.md` (revision 1 + delta
amendment 1). Commits: `0359b5c` (C0), `12efa65` (C1), `115b8e5` (C2), and the
C3 docs commit.

## What shipped

| Surface | Change |
|---|---|
| `holonovel/src/core/subjective.ts` | marker suffix out of the cost path, strict budget ceiling, D4 scan matrix, deterministic legacy ids |
| `holonovel/src/core/divergence.ts` | false outcome before displaced, exact O.13 lexicon with whole-token matching, alias index passed through |
| `holonovel/src/core/memory.ts` | consolidation summary slots reserved |
| `holonovel/src/core/state.ts` | `compression_ladder.entities` preserved on undo/restore; indexed legacy normalization |
| `holonovel/src/core/identity.ts` | global catalog sort, load-time valence clamp and off-kind false-belief clear, defensive `contradicts` |
| `holonovel/src/index.ts` | open-record claim, branch filter, entity resolution, ordinal validation, `configInt`, marker cost |
| `spec/02-requirements.md` | REQ-599b, REQ-458, REQ-627, REQ-240a, REQ-241a, REQ-334b amended |
| `spec/04-runtime.md` | §7.6 `0 = unlimited`; §7.7.0 Subjective memory class contract |
| `spec/appendices-reference.md` | O.13 whole-token sentence |
| `holonovel/scripts/**` | stale anchors re-pointed; `unresolvedPredicates` validates every recorded event; T-row assertions extended |
| `docs/plans/2026-11-08-license-compliance/*` | prose repair from the sanitization pass |
| Registers | review register CR-1..CR-22, DECISIONS D1–D12, CHANGELOG, coverage register |

## Evidence

| Step | Command | Result |
|---|---|---|
| Baseline | `npm run check:fast` | PASS 37/37 |
| Baseline | `cd holonovel && npm run test:all` | **49 passed, 5 failed** (18 predicate findings) |
| C0 | `cd holonovel && npm run test:all` | 54 passed, 0 failed |
| C1 spec | `npm run assemble && npm run validate -- --sdd-strict` | 0 errors |
| C1 build | `npm run build-order` | Ready to commit; 0 errors |
| C1 gates | `npm run check:fast` / `test:all` | 37/37 / 54/54 |
| C2 | five `holosuite.ts --tier=…` | all PASS with strict predicate validation |
| C2 | `test-holosuite-evidence` | 10 passed |
| C2 | `test:all` / `check:fast` | 54/54 / 37/37 |
| C3 | `npm run check:fast` | 37/37 |

## Done bar

All CR-1..CR-22 fixed or terminally dispositioned (CR-15 is closed as
performance-only with no regression gate). `check:fast` 37/37; `test:all` 54/54
with strict anchors; `build-order` clean; every anchor resolves; the license
docs are grammatical; the increment carries plan/tasks/AAR and `LOOP PAUSED`.

## What went right

1. The Phase 0 baseline caught the red tree before source edits; the 18 stale
   anchors were fixed as their own commit (C0), so C1 did not fold a baseline
   repair into feature work.
2. The pure unit probes for marker cost, budget ceiling, affect tokens, and
   load clamping are fast and deterministic, and they pin the exact contracts
   the integration tests cannot isolate.
3. Re-pointing anchors by symbol (not line number) plus the stricter predicate
   validation closes the drift class that let 18 stale citations stay green.

## What went wrong, and its disposition

1. **The build-review token was emitted after the first mechanical anchor
   edit (C0), not before.** The edit was a line-number refresh in test-harness
   libraries, and no source or spec file had been touched, but the sequencing
   was wrong. **Resolved by disclosure**; the remaining steps emitted the
   contract first.
2. **`build-order` failed twice on regenerated artifacts** — a stale
   surface-budget baseline/DECISIONS count and a stale starter artifact after
   the `DATA_FORMAT` bump. Both are expected consequences of a spec edit and
   were fixed with `surface-budget -- --write` and `build:starter-novel`.
3. **Two REQ bodies exceeded 800 characters** on the first draft (816/817);
   the validator counts the acceptance criterion. Trimmed to within the limit
   and re-measured.
4. **The first docs-repair pass used mechanical replacements and introduced
   nested backticks**; a second exact-line pass produced readable prose.

## Findings

| Finding | Severity | Disposition |
|---|---|---|
| Red `test:all` baseline (18 stale anchors) | P0 | **Resolved** — C0; 54/54 |
| Stale anchor in a passing record hid behind the assertion-only gate | P0 | **Resolved** — C2 validates every recorded predicate |
| CR-1..CR-22 review findings | P1/P2/P3 | **Resolved / Closed-P3** — see `spec/audit/review-register.md` |
| CR-15 performance-only, no regression gate | P3 | **Closed-P3** — alias index passed through; no demonstrated failure |
| Proofread-register count drift (257 recorded vs live) | P3 | **Record-and-close** — informational, pre-existing |

## Coverage backlog

`spec/audit/req-coverage.md`: bucket A 0, B 0, C 473, E 126. No new REQ or T
IDs were added; the amended REQs remain bucket C with their existing tests.

LOOP PAUSED
