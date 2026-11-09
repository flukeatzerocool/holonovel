# AAR — Full-review sweep, chunk P4 (persistence and the §5.19 cross-check)

**Status:** complete · **Date:** 2026-11-09 · **Loop:** `LOOP PAUSED`

## What happened

1. Plan stamped `fresh` at standard depth after a cold `independent-review
   passed.` (0 blockers, 3 majors, 8 nits, all resolved; diff re-review passed).
2. Phase 0 baseline: `check:fast` 37/37 PASS, `check` PASS (0 errors),
   `npm --prefix holonovel run test:all` 54/54 PASS, tree clean at `5f941e4`.
3. Phase 1 reviewed `core/state.ts` persistence, `core/data-dir.ts`, and the
   `manage_novel`/`manage_archive` handlers across four clusters (save path,
   load/restore, lifecycle, §5.19 cross-check), opening every cited harness.
4. Phase 2 resolved the nine §5.19 citations: six holds and three findings, plus
   one citation-narrowness finding spanning three holding REQs.
5. Phase 3 fixed the one P0 in-session, scheduled eight P1 findings under a new
   *§5.9/§5.19 persistence remediation* roadmap section, closed three P3 notes,
   advanced the sweep trigger to chunk P5, and wrote the register and changelog.

## What went right

- The code-side lens found a P0 the harness had encoded as correct: T381 archived
  the active Novel and asserted success, so REQ-334a's refusal was never tested.
- A live probe settled the `novel_format_version` question rather than inferring
  it from a grep: a created Novel carries only `data_format` and `spec_version`.
- The §5.19 cross-check kept the seam-pass fixes in scope to confirm, not to
  re-litigate; REQ-403a and REQ-404 needed no new finding.

## What went wrong

- The first draft of the plan named `loadNovel` and stale rotation anchors; the
  cold pass caught it before execution.
- The persistence directive and warn-mode text had been treated as "implemented"
  by the seam pass on the strength of their markers; the review found both are
  narrower than their REQs.

## Findings

| Metric | Value |
|---|---|
| §5.19 rows | 9 (6 holds, 3 findings) |
| Code-surface rows | 15 behaviours reviewed |
| Findings | 12 (F-P4-1 … F-P4-12) |
| P0 | 1 — F-P4-1, **Resolved** |
| P1 | 8 — F-P4-2 … F-P4-9, `Scheduled-roadmap` |
| P3 | 3 — F-P4-10 … F-P4-12, `Closed-P3` |
| Source files changed | `holonovel/src/index.ts`, `holonovel/scripts/test-persistence.ts` |
| REQ bodies changed | 0 |

## Verification

- `npm run typecheck` → exit 0
- `npm --prefix holonovel run test:persistence` → 41/41 PASS (after F-P4-1)
- `npm --prefix holonovel run test:all` → 54/54 PASS (baseline)
- `npm run check:fast` → 37/37, `check:fast: PASS`
- `npm run check` → `check: PASS` (0 errors)
- `npm run check-roadmap` → PASS (after the roadmap edit)
- `npm run check-registers -- --strict` → PASS
- `npm run check-loop-artifacts` → PASS
- `npm run build-order` → 0 errors

## Recommendations

- None new. The eight P1 findings are tracked by the roadmap section and the
  review register; chunk P5 is the next scheduled sweep item.

## Loop status

`LOOP PAUSED`
