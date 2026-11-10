# After-action report — Full-review sweep, chunk P7a (determinism and knowledge artifacts)

**Status:** complete · **Date:** 2026-11-09
**Plan:** `docs/plans/2026-11-09-full-review-p7a/plan.md`
**Tasks:** `docs/plans/2026-11-09-full-review-p7a/tasks.md`
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## What happened

1. The roadmap's next open item was the full-review sweep; the next scheduled
   chunk was P7. Measured at 280 REQs / 131 family rows, it was split (D81,
   user-approved) into P7a (91 REQs / 55 family rows: §5.7, §5.14,
   §5.28–§5.30) and P7b (§5.2 + §5.8, 189 / 76, still scheduled).
2. Plan gate: a cold `independent-review` pass raised two Majors (non-summing
   REQ ranges; undeclared version-sync blast radius) and eight nits; all were
   fixed and a targeted diff re-review returned `independent-review passed.`
   The plan was stamped `fresh`, standard depth, 4/5 stages.
3. Phase 0 baseline: the first `check:fast` failed only because the new plan
   directory lacked `tasks.md`/`aar.md` (`check-loop-artifacts`). After the
   planning record was created, `check:fast` 37/37, `check`, and `test:all`
   56/56 passed. No C0 commit was needed.
4. Phase 1–2 reviewed the six core files and their handlers, opened the cited
   harnesses, and resolved every `_Check:_` citation. Three P1 findings:
   - **F-P7a-1** — the REQ-050a seed-conflict `[WARNING]` is never emitted;
     demonstrated by the oracle under `TTRPG_SEED=42`.
   - **F-P7a-2** — REQ-055/055a/055b cite Automated T31/T108, which no harness
     implements (the behaviour is exercised under T9/S17).
   - **F-P7a-3** — REQ-052 cites T20, whose body renders `world://map` rather
     than refusing a traversal; the real assertion is T739.
5. Phase 3 scheduled the three findings on a new roadmap section, wrote the
   register rows, updated the sweep worklist (91-REQ table, 16 behaviour rows,
   four cluster verdicts, D81–D90), and added the changelog entry.

## What went right

- The split decision kept the review inside one session: 91 rows plus a
  16-row behaviour table and a probe pass were completable with evidence.
- The cold pass caught two real plan defects before execution — the REQ-range
  arithmetic and the version-sync blast radius — both of which would have
  surfaced as mid-run surprises.
- Probing (oracle seed, corpus cap, index relations, player scope) produced
  direct behavioural evidence instead of citation-only verdicts.

## What went wrong

- The first `check:fast` run failed on the increment's own missing loop
  artifacts. This is the drafting step's known signature, not a baseline
  defect; the plan already carried the T0.2 fix, so it cost one gate cycle.
- The citation scan initially missed same-line REQ bodies (the extraction regex
  expected the body on the following line), producing an apparent "no check"
  result for §5.28; the scan was corrected before any verdict was recorded.

## Findings and dispositions

| ID | Severity | Disposition | Surface |
|---|---|---|---|
| F-P7a-1 | P1 | Scheduled-roadmap (§5.7 determinism and citation repair) | REQ-050a |
| F-P7a-2 | P1 | Scheduled-roadmap (§5.7 determinism and citation repair) | REQ-055, REQ-055a, REQ-055b |
| F-P7a-3 | P1 | Scheduled-roadmap (§5.7 determinism and citation repair) | REQ-052 |

No P0 was raised; no P2 or P3 findings were recorded.

## Verification

- `npm run check:fast` → `check:fast: PASS` (37/37)
- `npm run check` → `check: PASS`
- `npm --prefix holonovel run test:all` → 56/56 PASS (135.2s)
- `test:corpus` 9/9 · `test:index` 6/6 · `test:graph` 5/5 · `test:limits`
  27/27 · `test:supplementary` 4/4 · `test:fingerprints` 12/12
- `npm run check-roadmap` → PASS
- `npm run check-registers:strict` → PASS
- `npm run check-loop-artifacts` → PASS
- `npm run build-order` → PASS (version sync; no REQ body changed)

## Recommendations

- None new beyond the scheduled findings. F-P7a-1–F-P7a-3 are tracked by the
  §5.7 determinism and citation repair section; chunk P7b is the next sweep
  item.

## Loop status

`LOOP PAUSED`
