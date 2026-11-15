# Plan — Gate-retirement sweep: retire by redundancy, not by streak

Status: draft v2 (v1 → cold pass: 1 Blocker, 6 Majors, 6 Nits, all applied; see Amendments)
· Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-gate-retirement-sweep/`
Rollback cost: 1 (reversible source and prose edits; no persisted state, no migration; the
retirement file is never written)
Evidence class: repo (`file:line` at HEAD `675daeb`) and tool output (baseline gate run and
telemetry read in this session). No web, user, or third-party content enters this plan.
Trust boundary: repo and local tool output only; telemetry is local state, so every number it
supplies is corroborated by a live timing run in the Evidence table.
Review independence: fresh — cold pass
`docs/plans/2026-11-15-gate-retirement-sweep/plan.cold/report.md`
(`independent-review FAILED: 1 blockers`; 1 Blocker, 6 Majors, 6 Nits; all applied in v2),
then one constrained diff re-review (`independent-review passed.`, 2 of 10 reads; 1 Major, 1
Minor, 5 Nits, all applied in v3). Standard depth allows one re-review; the v3 edits are the
re-review's own resolutions, recorded in Amendments.

## Vocabulary

Three nouns, fixed for the whole document. They are distinct because the increment's
verification hangs on the difference.

- **row** — one gate in the timing log that also exists in the gate manifest. Rows for gates no
  longer in the manifest (the log still carries `playability`) are dropped before rendering.
- **candidate** — a row with `streak >= threshold` that is not `protected`. At HEAD this is
  **36 of 49** manifest gates. Candidacy is a *question*, not a decision.
- **writable** — a candidate whose manifest entry declares a resolved `coveredBy` cover. At
  HEAD this is **0**, because no gate declares a cover (D8). `--apply` writes only writable
  gates.

## Why

Two facts settle this sweep before any gate is touched.

**The ritual is armed.** `docs/workflow-cadence.md:50-52` instructs a monthly
"Gate-retirement review: `npm run gate-cost -- --apply` downgrades gates with no findings
across 20 consecutive runs to advisory." That is the operator's scheduled action, not a
hypothetical.

**The predicate is a streak.** `scripts/gate-cost-report.ts:96` marks a gate a candidate when
`streak >= threshold && failures === 0`; at the default threshold of 20 against the current
timing log that is 36 of the 49 manifest gates (`gate-cost-report`, this session). The 36
include `validate`, `typecheck`, `lint`, `check-script-discipline`, `check-fingerprint-sync`,
`check-markers`, `check-workflows`, `check:conformance`, and `action-conflicts` — the gates that
hold the tree together.

**The fast-mode saving is zero.** Fast mode launches every fast gate concurrently
(`scripts/run-gates.ts:217-224`, no worker pool), and an advisory gate still runs — it only
stops blocking (`scripts/run-gates.ts:232-245`). Measured this session:
`npx tsx scripts/run-gates.ts --fast --timing` finished 45 gates in **12.53 s wall**, whose
critical path is `test:ruleset-gates` at **12.32 s**; the 0.21 s difference is runner overhead,
so "retiring the other 44 fast gates saves under 0.25 s" is an upper bound derived from that
gap, not a per-gate measurement. The only fast gate whose retirement would buy wall clock is
the slowest one itself, `test:ruleset-gates` (≈4.9 s against the next-slowest fast median of
7.45 s), and it guards a distinct finding class, so it is not retireable either.

**Full mode is where retirement buys seconds — and where it costs coverage.** Full mode runs
sequentially (`scripts/run-gates.ts:190-215`), so retiring any full-tier gate saves its whole
median: `test:all` alone is 181 s. Those gates are protected or guard distinct classes (server
harness suite, publication pipeline, container image, anchors), so the saving is real and the
trade is not. The plan reports both numbers rather than letting "gate retirement saves build
time" stand unqualified (D4).

**Zero findings is not zero value.** A clean tree makes `validate`, `typecheck`, and
`check-fingerprint-sync` pass every run; that is evidence the gates work, not evidence they are
unnecessary. The gate count has grown 26 → 46 since the script's header was written
(`scripts/gate-cost-report.ts:5-7`) and stands at 49 today, with zero retirements, so the
pressure to shrink the suite is real — the pressure is just not answered by counting green runs.

The sweep's finding is therefore that the policy, not the gate list, is the defect: applied as
documented it converts roughly three quarters of the blocking suite into advice while saving
nothing measurable in the fast tier. This increment fixes the predicate and proves, gate by
gate, that no candidate has a redundant cover.

## Scope

**In scope.**

1. A redundancy predicate for retirement: a gate is **writable** only when the timing streak
   clears the threshold, the gate is not protected, **and** the manifest declares a cover for
   it (`coveredBy`) that resolves to another manifest gate.
2. Every **row** in the report carries its cover (or `—`), a one-line `reason` for its status
   (`streak below threshold`, `protected`, `no cover declared`, `cover does not resolve: <name>`,
   `covered by <names>`), and both tier savings (`fastSavingMs`, `fullSavingMs`), in the printed
   table and in `--json`; the `--json` envelope also gains the `writable` name list.
3. Rows for gates that are no longer in the manifest are excluded from the report instead of
   being reported as ordinary gates.
4. `--apply` writes only **writable** gates: it prints one refusal line per candidate that is not
   writable and leaves the file untouched when none is.
5. Tests for the predicate, the cover resolution, the saving rule, and the filter, appended to
   the existing `scripts/test-script-tooling.ts` harness.
6. A per-gate classification table (`review.md`) recording, for all 36 candidates, the finding
   class and why no other blocking gate covers it — the evidence that the correct outcome is
   zero retirements.
7. Prose and register updates: `docs/workflow-cadence.md` (the ritual line),
   `spec/audit/review-register.md` (a `## Resolved` section), `CHANGELOG.md`, a refreshed gate
   count in the `gate-cost-report.ts` header, and this increment's artifacts.

**Non-goals.** Retiring or deleting any gate (none is writable; see Done bar). Changing
fast/full tier membership. Parallel scheduling, worker pools, or caching of gates. Making the
full suite faster (`test:all` 181 s median is a separate, recorded P3 observation). Any edit
under `spec/` other than the audit registers. Any change to `spec/audit/gate-retirement.json`
semantics: the file still does not exist after this increment.

## Evidence

All reads at HEAD `675daeb`; baseline `npm run check:fast` → **45 passed, 0 failed**
(`check:fast: PASS`), recorded un-piped this session.

| ID | Claim | Predicate |
|---|---|---|
| EV1 | The monthly ritual instructs a bare `--apply`. | `docs/workflow-cadence.md:50-52`. |
| EV2 | Candidate status rests on the streak alone. | `scripts/gate-cost-report.ts:93-97` (`candidate: streak >= threshold && failures === 0`). |
| EV3 | 36 of 49 gates are candidates at threshold 20. | `npx tsx scripts/gate-cost-report.ts --json` → `candidates.length = 36` (this session). |
| EV4 | The 36 include the contract-critical gates. | Same run; `validate`, `typecheck`, `lint`, `check-script-discipline`, `check-fingerprint-sync`, `check-markers`, `check-workflows`, `check:conformance`, `action-conflicts`, `check-traceability` all appear in the candidate list. |
| EV5 | Fast mode runs every fast gate concurrently, unbounded. | `scripts/run-gates.ts:217-224` (`Promise.all` over `fastGates`; no pool). |
| EV6 | Advisory gates still run; only blocking changes. | `scripts/run-gates.ts:232-245` (`ADVISORY FAIL (does not block)` then `continue`); `scripts/lib/gate-manifest.ts:19-20`. |
| EV7 | Fast suite wall clock is concurrency-bound. | `/usr/bin/time … run-gates.ts --fast` → `WALL=12.53s`; `45 passed, 0 failed`. |
| EV8 | The critical path is `test:ruleset-gates`. | `.holonovel-state/gate-timing.json`, latest head, fast rows → `test:ruleset-gates 12320 ms`, `12198 ms`; next `test:spec-tooling 7450`, `validate 7372` (medians 9.4 s and 6.9 s in full mode). |
| EV9 | Protected gates are already excluded from candidacy. | `scripts/gate-cost-report.ts:113-119`; `scripts/lib/gate-manifest.ts:22-23, 341-361` (a protected retirement entry is ignored with a warning at `:353`). |
| EV10 | The timing log carries a gate the manifest no longer has. | `playability` — exactly 6 rows in `.holonovel-state/gate-timing.json`, absent from `run-gates.ts --list` (49 names). |
| EV11 | The manifest is the single source for the doc table and the runner. | `scripts/lib/gate-manifest.ts:368-375`; `scripts/check-gate-table.ts:44-60`. |
| EV12 | The report has no dedicated self-test. | `grep -rl "gate-cost-report" scripts/*.ts scripts/lib/*.ts` → only the script and `lib/gate-manifest.ts`; `package.json:89` wires `gate-cost` as informational. |
| EV13 | The timing log records `mode`, but the report discards it. | `scripts/run-gates.ts:186-188` writes `mode`; `scripts/gate-cost-report.ts:32-37` (`TimingRecord`) omits it, so `medianMs` is mode-blended. |
| EV14 | Full mode is sequential, so full-tier retirement really does save time. | `scripts/run-gates.ts:190-215`; `test:all` full median 181 204 ms from the timing log. |
| EV15 | The sweep has no open roadmap or register row to close. | `ROADMAP.md:15-25` (only the date-gated P2); `spec/audit/review-register.md:3060-3080` (`Scheduled-roadmap` holds no open finding). |
| EV16 | The increment contract requires `LOOP PAUSED` to close. | `docs/plans/README.md:52-54`, `:60-66`. |

## Decisions

- **D1 — redundancy is the criterion, not a value heuristic.** A gate may be downgraded only
  when another blocking surface covers the same finding class. Rejected: a "these gates look
  important" allow-list, which encodes taste; and a minimum-cost threshold, which would retire
  cheap gates and keep expensive ones.
- **D2 — the streak stays, as a necessary condition.** Twenty zero-finding runs is a fair
  *churn* signal: a gate that needed repair recently should not be downgraded. It is not a
  sufficient one. Threshold unchanged at 20 so the ritual's arithmetic still means what the doc
  says.
- **D3 — the cover lives in the manifest.** `coveredBy?: string[]` on `Gate`
  (`scripts/lib/gate-manifest.ts:15-24`), beside `protected`. The manifest is already the one
  source shared by the runner, the doc table, and this report (EV11); a side file would create a
  second place to forget. Rejected: declaring covers in `gate-retirement.json` — that file is
  the *output* of the decision, so it cannot also be the input that justifies it.
- **D4 — the report states the saving, per tier.** Rows carry `fullSavingMs = median(g)` for a
  full-tier gate (sequential execution, EV14) and
  `fastSavingMs = max(0, median(g) − max median of the other fast-tier gates)` (concurrency,
  EV5/EV7); a gate absent from a tier has `0` for that tier. Reporting both is what keeps the
  plan honest: the fast tier is where the ritual is cheap to obey, and the full tier is where
  obedience buys seconds. Rejected: a single suite total, which would let a 2 s gate look like a
  2 s saving.
- **D5 — a cover must be a manifest gate, and must resolve.** `resolveCovers` resolves against
  `manifestGateNames(gates)`; any other name yields a warning and no writability, mirroring the
  protected-gate warning already there (EV9). Rejected: allowing a "gated harness command" as a
  cover — the manifest has no harness registry, so that clause would be unresolvable in
  practice; a harness a project wants to treat as a cover should first be a manifest gate.
- **D6 — do not delete the retirement mechanism.** With the predicate fixed it becomes a real
  tool: it can retire a gate once someone builds a genuine covering surface, and the decision
  stays reviewable in a tracked JSON file. Deleting it would leave the monthly ritual with
  nothing to run.
- **D7 — filter telemetry to manifest gates.** A row for a gate that no longer exists is not a
  candidate; it is noise from an earlier layout. Excluded with a one-line notice so the
  exclusion is visible rather than silent (EV10).
- **D8 — no gate declares `coveredBy` in this increment.** The classification table is what
  establishes that; an empty field the tool honours is the correct end state, and a
  pre-populated field would assert a cover nobody verified.
- **D9 — per-tier medians are a data-model change, not a formatting one.** `TimingRecord` gains
  `mode` (already written, EV13) and the report keeps a per-`(gate, mode)` median alongside the
  existing blended `Median ms` column. Without this the saving column would be fiction.

## Blast radius

| File | Change | Size | Note |
|---|---|---|---|
| `scripts/lib/gate-manifest.ts` | add `coveredBy?: string[]` to `Gate`; document the contract (manifest gate names only) | S | type only; no gate declares it |
| `scripts/lib/gate-retirement.ts` | **new** pure module: `manifestGateNames`, `resolveCovers`, `candidateReason`, `savingMs` | M | no I/O, no `Date`, no `process`; header role `[build tool]` |
| `scripts/gate-cost-report.ts` | read `mode` into `TimingRecord`; keep per-tier medians; use the module for candidacy and writability; drop non-manifest rows with a notice; add `cover`, `reason`, `fastSavingMs`, `fullSavingMs` to the table and `--json`; `--apply` writes only writable gates; refresh the header's 26 → 46 count to the current 49 | M | keeps its `[informational; gate with --apply]` role |
| `scripts/test-script-tooling.ts` | append eight cases (candidacy, cover resolution, tier saving, filter) | S | reuses the existing `check()` harness |
| `docs/workflow-cadence.md` | the monthly ritual line states the redundancy requirement and the two savings | S | lines 50-52 |
| `spec/audit/review-register.md` | one `## Resolved — 2026-11-15 gate-retirement sweep` section, finding `F-GR-1` | S | section form, matching the file's convention |
| `CHANGELOG.md` | date-headed entry in the file's existing form | S | `## 2026-11-15 — …` |
| `docs/plans/2026-11-15-gate-retirement-sweep/{plan,tasks,review,aar}.md` | this increment's artifacts | M | `review.md` carries the 36-row table |

Not touched: `AGENTS.md` (the layer-map line at `:95` — "Per-gate cost and automatic retirement
candidates" — stays accurate, so no edit is expected; step 5 verifies and drops it if the
wording still holds), `spec/audit/gate-retirement.json` (stays absent), `package.json`,
`scripts/run-gates.ts`, `scripts/check-gate-table.ts`, `scripts/weekly.ts` (runs the report
without `--apply`), any `holonovel/` source.

## Implementation outline

1. **Type.** `scripts/lib/gate-manifest.ts:15-24`: add `coveredBy?: string[]` with a comment
   stating the contract — each entry names another gate in this manifest that fails on the same
   finding class; no harness commands, no external paths.
2. **Pure module.** `scripts/lib/gate-retirement.ts` (header role `[build tool]`):
   - `manifestGateNames(gates): Set<string>`
   - `resolveCovers(gate, gates): { resolved: string[]; unresolved: string[] }`
   - `candidateReason(row, gate, gates, threshold): { candidate: boolean; writable: boolean; reason: string }`
     with reasons `streak below threshold`, `protected`, `no cover declared`,
     `cover does not resolve: <name>`, `covered by <names>`.
   - `savingMs(gate, tierMedians): { fast: number; full: number }` per D4, returning `0` for a
     tier the gate is absent from.
   - No filesystem, clock, or console use (the caller prints).
3. **Report.** `scripts/gate-cost-report.ts`: extend `TimingRecord` (`:32-37`) with `mode`;
   compute per-tier medians beside the blended one; replace the inline candidate expression
   (`:96`) and the protected filter (`:113-119`) with the module; drop non-manifest rows before
   rendering (notice: `gate-cost-report: ignored N timing row(s) for gates no longer in the
   manifest`); add the four fields to the printed table and to `--json`; in `--apply`
   (`:142-168`) iterate candidates, write only writable ones, and print a refusal line carrying
   the `reason` for each candidate it skips. Refresh the header's gate count (the Why's 26 → 46
   → 49 paragraph) to the current 49.
4. **Tests.** `scripts/test-script-tooling.ts`: import from the new module and append eight
   cases — under-threshold streak, protected, no cover, unknown cover, resolved cover, fast-tier
   saving (critical path vs non-critical), full-only gate absent from the fast tier, and
   `manifestGateNames` membership for a name absent from the manifest (the predicate the report
   uses to drop the `playability` rows). Fixture gates are minimal literals; no timing file is
   read.
5. **Prose.** `docs/workflow-cadence.md:50-52` — the ritual keeps `--apply` but states that a
   gate is downgraded only when the manifest declares a redundant cover, that `--apply` refuses
   the rest, and that the report prints the per-tier saving so a zero-saving retirement is
   visible. Verify `AGENTS.md:95` still describes the script accurately; edit only if it does
   not.
6. **Registers.** `spec/audit/review-register.md`: a new `## Resolved — 2026-11-15
   gate-retirement sweep` section opening with the finding bullet `F-GR-1` — the predicate
   (`scripts/gate-cost-report.ts:96` at `675daeb`), the 36/49 and 0-writable counts, the
   12.53 s/12.32 s measurement, the honest split between fast-mode and full-mode saving, and the
   disposition `Resolved`, cross-referencing `review.md`. No register row is retired or renamed:
   there is no `ROADMAP.md` section for this sweep and no `Scheduled-roadmap` row to move (EV15),
   so `check-registers` and `check-traceability` see an added section, not a broken
   cross-reference. `docs/plans/2026-11-15-gate-retirement-sweep/review.md` holds the 36 rows:
   gate, finding class, nearest neighbouring gate, why it is not a cover.
7. **AAR before the gate.** Write `aar.md` ending **`LOOP PAUSED`** (EV16: `session:close`
   refuses an increment whose AAR ends `LOOP OPEN`) before the final `check:fast`, because
   `check-loop-artifacts` reads the increment directory and is part of that suite.
8. **Commits.** Two, split by concern, each green on `check:fast` before the next:
   (a) `scripts/` tooling + tests; (b) prose, registers, changelog, plan artifacts. One
   `session:close` pass commits them in that order.

## Verification

| ID | Check | Command | Expected |
|---|---|---|---|
| V1 | Predicate tests | `npm run test:script-tooling` | pass, eight new labels present |
| V2 | Candidate set is unchanged, writable set is empty | `npm run gate-cost -- --json` | `candidates.length = 36`, `writable: []`; each candidate row carries `reason` `no cover declared` |
| V3 | Per-tier saving is computed | `npm run gate-cost` | every row shows `fastSavingMs` and `fullSavingMs`; the only non-zero fast saving is `test:ruleset-gates` (≈4.9 s); full-only gates show `0` fast |
| V4 | Stale telemetry is excluded, visibly | `npm run gate-cost` | notice `ignored 6 timing row(s) …`; no `playability` row |
| V5 | `--apply` is inert | `npm run gate-cost -- --apply` | exit 0, 36 refusal lines carrying reasons, and `spec/audit/gate-retirement.json` still absent |
| V6 | Suite still green | `npm run check:fast` | `45 passed, 0 failed` + `check:fast: PASS`, un-piped |
| V7 | Doc table unchanged | `npm run check-gate-table` | PASS (no new `(advisory)` row) |
| V8 | No spec drift | `git status --short spec/` | only `spec/audit/review-register.md` |
| V9 | Type surface | `npm run typecheck` | pass |
| V10 | The old predicate really decides, not merely reports | `git worktree add /tmp/opencode/replay-gr 675daeb`; copy `.holonovel-state/gate-timing.json` into it; run the old report there with `--apply`; then run the new `npm run gate-cost -- --apply` in the main tree | the worktree run writes `spec/audit/gate-retirement.json` holding 36 advisory names; the main-tree run writes nothing; both outputs pasted into `review.md` |

## Done bar

**Done bar:** the six checks below all hold — 0 writable and 36 candidates at HEAD, an inert
`--apply`, eight passing predicate tests, a green 45-gate `check:fast`, corrected ritual prose,
and one two-commit increment closing on `LOOP PAUSED`.

This increment is done when all six hold.

1. `npm run gate-cost` reports **0 writable** at HEAD — the telemetry-independent assertion — with
   **36 candidates** corroborating against this session's timing log, and every one of the 36
   appears in `review.md` with a finding class and a stated reason it has no cover.
2. `npm run gate-cost -- --apply` writes no retirement file, and
   `spec/audit/gate-retirement.json` does not exist at the end of the increment.
3. The predicate, cover, saving, and filter cases (eight) pass inside
   `npm run test:script-tooling`, and `check-script-quality` still passes with the new module
   reachable (C1) and no duplicated helper (C2).
4. `npm run check:fast` is green at 45 gates with the baseline's `check:fast: PASS` line,
   captured un-piped.
5. The monthly ritual text no longer licenses a streak-only downgrade, and states the fast/full
   saving split truthfully.
6. One increment, two commits from `session:close`, register section `F-GR-1` / `Resolved`,
   CHANGELOG entry, `aar.md` ending `LOOP PAUSED`.

## Edge cases and rollback

- **A gate declares a cover before this ships.** The predicate honours it; V2's expected
  `writable: []` becomes that gate, and `--apply` would then write it. No gate declares a cover
  at HEAD (D8), so `writable: []` is deterministic and independent of the timing log. The
  `candidates.length = 36` half of V2 is not telemetry-independent: it holds against this
  session's timing log (EV3), and Done bar 1's primary assertion is the writable count, with 36
  as corroboration.
- **The replay worktree has no dependencies.** `npx tsx` may fetch `tsx` on first use; if it
  does not, run `npm ci` in the worktree or export `NODE_PATH` to the main tree's
  `node_modules`. The worktree is disposable, so installing into it is safe.
- **The timing log is missing or corrupt.** `loadRecords` already returns `[]`; the report
  prints its existing "no timing recorded" line, so rows, candidates, and writable are all
  empty. The module never reads the file, so the tests do not depend on local state.
- **A gate has rows in one tier only.** `savingMs` returns `0` for the absent tier by
  construction (D4); the eight test cases include this shape.
- **`--apply` on a tree where a cover resolves.** Exercised only by the unit test; no write is
  performed against the repository.
- **Rollback.** Every change is an edit to tracked files; `git revert` of the two commits
  restores the previous predicate, and no artifact outside git is created (`/tmp/opencode`
  replay tree is disposable).

## Open questions

1. **Should `test:ruleset-gates` be optimized rather than retired?** It is the fast suite's
   critical path (12.3 s of a 12.5 s wall). Out of scope here; recorded as a P3 observation in
   the AAR, not scheduled — no demonstrated failure, and the fast suite is inside its current
   tolerance.
2. **Does any future gate need a cover?** Yes, the field exists for that; no gate needs one
   today, and `review.md` is the evidence. Revisit when a gate is proposed whose finding class is
   already gated.

## Amendments

Applied from the cold pass (`/tmp/opencode/cold-review-gate-retirement.md`, 1 Blocker, 6 Majors,
6 Nits):

- **B1 — "candidate" carried two meanings.** The Vocabulary section now fixes row / candidate /
  writable, and Scope, D4, the outline, V2, V4, and V5 use them consistently. `--apply`'s refusal
  loop iterates candidates, which makes the previously unreachable skip branch reachable.
- **M1 — the saving formulas needed per-tier medians the report cannot produce.** D9 and the
  blast-radius row now name the `TimingRecord.mode` + per-tier median change, and D4 states the
  absent-tier rule.
- **M2 — V2 expected a `reason` field no step added.** Scope 2 and outline step 3 add `reason` to
  the table and `--json`.
- **M3 — the cover set was defined twice.** Scope 1 and step 1 now say manifest gates only; D5
  records why the harness clause was rejected.
- **M4 — the zero-saving claim overreached.** The Why section now separates the fast-mode zero
  from the real full-mode seconds, and Done bar 5 requires the prose to carry that split.
- **M5 — the AAR was allowed to end `LOOP OPEN`.** Step 7, T7, and Done bar 6 now require
  `LOOP PAUSED`, citing EV16.
- **M6 — V10's replay was not executable.** V10 now uses `git worktree` at `675daeb` with the
  timing log copied in, so the script's `import.meta.dirname`-relative imports and paths resolve.
- **N1–N6.** Refreshed the stale 26 → 46 header citation and made refreshing it to 49 part of
  step 3; switched the register entry to section form with finding ID `F-GR-1`; changed the new
  module's role to the enforced `[build tool]` token; recorded that `AGENTS.md:95` needs no edit
  unless the wording stops holding; labelled the 0.25 s figure as an upper bound from the
  runner-overhead gap.

### v3 — the diff re-review's own resolutions

Applied from the identical-context diff re-review (`independent-review passed.`, 2 of 10
reads). These are the reviewer's fixes to v2; no new lens was applied.

- **Major — V10 did not discriminate the change.** V2's vocabulary made both outputs agree on
  36 candidates, so "the old predicate is really gone" was untested. V10 is now a decision-path
  differential: `--apply` in a `675daeb` worktree writes 36 advisory names, `--apply` in the
  main tree writes nothing.
- **Minor — the determinism claim backed the wrong half of V2.** The edge case now grounds
  determinism on `writable: []` (D8, telemetry-independent) and states that the 36 holds
  against this session's log; Done bar 1 makes the writable count the primary assertion.
- **Nits.** The `--json` envelope gains the `writable` name list (Scope 2); the header-refresh
  citation points at the Why's count paragraph instead of EV13; the replay worktree names its
  dependency fallback (`npm ci` / `NODE_PATH`); the eighth test case now names
  `manifestGateNames` membership as its target; the cold artifact moved from `/tmp` to
  `docs/plans/2026-11-15-gate-retirement-sweep/plan.cold/report.md` so the stamp and
  `build-review` can re-hash a durable copy.
