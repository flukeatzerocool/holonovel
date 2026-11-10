# AAR — Full-review sweep, chunk P6b (ruleset packages and host entry points)

**Status:** complete · **Date:** 2026-11-09 · **Loop:** `LOOP PAUSED`

## What happened

1. Plan `docs/plans/2026-11-09-full-review-p6b/plan.md` was reviewed at
   standard depth (`independent-review passed.`, 4/5 stages; one targeted diff
   re-review) and stamped `fresh`. Condition C-1 (finding-ID casing) was
   applied as a condition-only amendment and verified here.
2. Phase 0 baseline was **red**: `npm run check` passed, but
   `npm --prefix holonovel run test:all` reported 52/55 with three Holosuite
   tiers failing on 13 stale evidence anchors. A separate C0 commit
   (`40a8808`, `2026-11-09 — Restore green baseline (test:holosuite-*)`)
   repointed them; all three tiers then passed (45/45, 25/25, 100/100).
3. Phase 1 reviewed four clusters read-only: A package format/manager,
   B ruleset-scoped surface, C host entry points, D base capabilities. Every
   finding predicate was re-read in source before triage; predicates that could
   not be confirmed were dropped or downgraded.
4. Phase 2 resolved all 73 `_Check:_` citations. 21 are absent or
   non-exercising and are recorded as a citation-repair finding (F-P6b-21).
5. Phase 3 fixed six P0s with a new harness
   (`test:ruleset-surface-remediation`, 6/6), wrote 26 finding rows (6 resolved,
   15 scheduled, 5 closed), advanced the roadmap trigger to P7, added five
   remediation sections, and wrote the changelog.

## What went right

- The plan's split of the baseline from the review held: the C0 fix landed
  first, alone, and the review then ran against a green tree.
- The new harness asserts the fixed contracts end-to-end through the engine
  façade (two packages, a cross-ruleset refusal, idle-vs-loaded listing,
  removal, a corrupt package, malformed dice, and state application) rather
  than unit-testing helpers.
- Cluster reviews produced `file:line` predicates; the strongest ones (scope
  gating, list hydration, dead `[load-rejected]` channel) survived direct
  re-reading and became P0s.

## What went wrong

- The baseline was red at session start: P6a's AAR claimed the anchors were
  repointed, but 13 remained stale across three tiers. The roadmap's P2
  "anchor repoint automation" item is the standing cause.
- The six P0 fixes shifted `holonovel/src/index.ts` again and broke 16
  Holosuite evidence anchors; they were repointed by hand a second time. The
  P2 roadmap item for anchor-repoint automation is the standing fix.
- Removing REQ-381 from `INTENDED_GAP_REQS` (`scripts/validate.ts`) was forced
  by the coverage gate once dispatch gating landed; the file was outside the
  plan's blast radius and is recorded here as a deviation.
- The plan's blast radius did not name the three `holosuite-*.ts` files the
  C0 fix would touch; the red-baseline branch covered the change but the table
  was incomplete. Recorded as a plan-precision miss.
- Cluster C's review reports no committed ruleset emitter. That is a
  spec-versus-repository boundary conflict (REQ-563 requires a committed
  emitter; `.gitignore:22` forbids one), not a small implementation gap; it is
  scheduled, not fixed.

## Findings

| Metric | Value |
|---|---|
| REQ rows | 73 — 23 pure holds, 50 with at least one finding |
| Behaviour rows | 20 |
| Cluster verdicts | A P1, B P1, C P1, D P1 |
| Findings | 26 (F-P6b-1 … F-P6b-26) |
| P0 | 6 — F-P6b-1 … F-P6b-6, **Resolved** |
| P1 | 15 — F-P6b-7 … F-P6b-21, `Scheduled-roadmap` |
| P3 | 5 — F-P6b-22 … F-P6b-26, `Closed-P3` |
| Source files changed | `rulesets.ts`, `index.ts`, `core/state.ts`, `holosuite-*.ts` (C0) |
| Harness added | `scripts/test-ruleset-surface-remediation.ts` |
| REQ bodies changed | 0 |

## Verification

- `npm --prefix holonovel run test:ruleset-surface-remediation` → 6/6 PASS
- `npm --prefix holonovel run test:all` → 56/56 PASS (new harness included)
- `npm run check` → `check: PASS` (0 errors)
- `npm run check:fast` → 37/37, `check:fast: PASS`
- `npm run check-roadmap` → PASS
- `npm run check-registers:strict` → PASS
- `npm run check-loop-artifacts` → PASS
- `npm run build-order` → run for version sync (no REQ body changed)

## Recommendations

- None new beyond the scheduled findings. F-P6b-7–F-P6b-21 are tracked by the
  five remediation sections added to `ROADMAP.md`; chunk P7 is the next sweep
  item.

## Loop status

`LOOP PAUSED`
