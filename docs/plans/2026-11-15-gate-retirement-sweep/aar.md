# AAR — Gate-retirement sweep

## 1. What was supposed to happen

Replace the streak-only advisory predicate with a redundancy predicate, prove that none of the
36 candidates has a redundant cover, and correct the monthly ritual text so the operator's
scheduled `--apply` cannot downgrade a necessary gate. Done bar: **0 writable and 36 candidates
at HEAD**, an inert `--apply` that writes no retirement file, eight passing predicate tests, a
green 45-gate `check:fast`, corrected ritual prose, and one increment closing on `LOOP PAUSED`.

## 2. What happened

1. **Type.** `Gate.coveredBy?: string[]` added in `scripts/lib/gate-manifest.ts`, with the
   contract stated in the comment: another manifest gate that fails on the same finding class.
2. **Predicate.** New pure module `scripts/lib/gate-retirement.ts` (`[build tool]`):
   `manifestGateNames`, `resolveCovers` (self-reference and unknown names do not resolve),
   `candidateReason` (manifest membership → protected → log failures → streak → cover), and
   `savingMs` (fast = margin over the slowest sibling, full = own median, absent tier = 0).
3. **Report.** `scripts/gate-cost-report.ts` reads the `mode` the runner already wrote, keeps
   per-tier medians beside the blended one, filters timing rows to manifest gates, prints
   `Fast save ms` / `Full save ms` / `Status`, carries `reason`/`fastSavingMs`/`fullSavingMs`
   in `--json` plus top-level `writable`, refuses every unwritable candidate by name in
   `--apply`, and refreshed its stale header count (26 → 49).
4. **Evidence.** `review.md` holds the 36-row classification table and the `675daeb` replay;
   the register carries `F-GR-1`; the cadence ritual states the redundancy requirement and the
   two savings.
5. **Tests.** Eight cases appended to `npm run test:script-tooling` (39 passed, 0 failed).

## 3. Evidence

| Done-bar item | Command → result |
|---|---|
| 0 writable, 36 candidates | `npm run gate-cost -- --json` → `rows 49 · candidates 36 · writable 0`; reason histogram `{ "no cover declared": 36 }` |
| `--apply` inert | `npm run gate-cost -- --apply` → exit 0, 36 `not retiring …` lines, `--apply wrote nothing`; `spec/audit/gate-retirement.json` absent |
| Old predicate really decided | worktree at `675daeb` + copied timing log → old `--apply` wrote `36 advisory gate(s)`; new `--apply` wrote nothing |
| Per-tier saving computed | `npm run gate-cost` → only non-zero fast saving is `test:ruleset-gates` (4 562 ms); full-tier rows carry their medians |
| Stale telemetry excluded | `npm run gate-cost` → `ignored timing row(s) … playability`; no `playability` row |
| Predicate tests | `npm run test:script-tooling` → 40 passed, 0 failed (nine new labels) |
| New module is clean | `npm run check-script-discipline` → PASS; `npm run check-script-quality` → 136 scripts, 0 hard, 0 report-only |
| Register | `npm run check-registers` → PASS (`F-GR-1` present) |
| Suite | `npx tsx scripts/run-gates.ts --fast` → 45 passed, 0 failed, `check:fast: PASS` (un-piped) |
| Doc table | `npm run check-gate-table` → no advisory row added; `AGENTS.md` needed no edit |

## 4. Deviations from the plan

- **D-1 — first cut nominated 40 candidates, not 36. Resolved in-session.** The rewrite of
  `candidateReason` dropped the old `failures === 0` conjunct, so four gates with a long current
  streak but a failure in the log (`check-registers`, `check-gate-table`, and two others) became
  candidates. The plan's D2 says the streak stays a *necessary* condition and the baseline is
  36, so the conjunct was restored as an explicit `has failed in the log` reason and a ninth
  test case. Caught by comparing the report against the plan's stated count, not by a gate.
- **D-2 — the fast saving measures 4 562 ms, not the plan's ≈4.9 s.** The plan's figure was
  derived from blended medians (12 320 − 7 450); per-tier medians give 4 562 ms. The direction
  and the conclusion are unchanged; `review.json` in this session's transcript records the
  exact figure and the plan text carries `≈`.
- **D-3 — the replay needed no dependency install.** C-1 anticipated `npm ci` or `NODE_PATH` in
  the worktree; `npx tsx` resolved from the main tree's install and the old report ran first
  time. C-1 closed with no action.
- **D-4 — a provisional AAR was required at planning time.** Creating the increment directory
  turned `check-loop-artifacts` red until `aar.md` existed, so a `LOOP OPEN` placeholder was
  written and replaced by this file. Recurrence of the SK-12 class; no new action.

## 5. Findings and dispositions

| Finding | Severity | Disposition |
|---|---|---|
| D-1 candidate count drifted to 40 when the failure conjunct was lost | P0 (wrong output, caught in-session) | `Resolved` 2026-11-15 — conjunct restored, ninth test case added |
| The fast-tier saving is dominated by one gate (`test:ruleset-gates`, 98% of the wall) | P3 | Record-and-close: no demonstrated failure; the fast suite is inside tolerance and the report now makes the number visible |
| Full-tier cost (`test:all` median 181 s) is real but not addressable by retirement | P3 | Record-and-close: protected gate, distinct finding class |
| Plan's D-4 replay figure was ≈4.9 s, actual 4 562 ms | P3 | Record-and-close: the plan text carries `≈`; the AAR records the exact number |
| Provisional AAR needed before execution (SK-12 recurrence) | P3 | Record-and-close: no new SK record, the plan already sequences the real AAR before the gate |
| R-1 (final cold pass) — outline step 3 omits the `--json` envelope's `writable` key that V2 asserts | P1 | Closed-P3 2026-11-15: the code emits it (`scripts/gate-cost-report.ts`, `writable: writable.map(...)`), V2 verified it live, so the gap is plan-text traceability, not behavior. The plan bytes stayed frozen at the reviewed hash rather than edited at the review cap |
| R-2 (final cold pass) — the Amendments header still cites the `/tmp` cold report while the durable path is used elsewhere | P3 | Closed-P3 2026-11-15: `plan.cold/report.md` and `plan.cold/report-v3.md` are both on disk and cited by the stamp; the stale sentence is superseded by the v3 bullet |
| R-3 (final cold pass) — the eighth unit case asserted `manifestGateNames` membership, which would still pass if the report's row filter were deleted | P2 | Resolved 2026-11-15: a ninth case asserts `candidateReason(row, undefined, …) === "not in the manifest"`, exercising the module branch the filter relies on (40 passed). The filter itself remains verified live by V4 |

No project action item remains and no roadmap entry is created: nothing in this increment
carries forward. `ROADMAP.md` keeps its single date-gated P2 item.

## 6. Cost

One plan (two review dispatches: cold pass 22/40 reads, one diff re-review 2/10), one execution
pass, two gate runs, one scratch worktree, one commit series.

LOOP PAUSED
