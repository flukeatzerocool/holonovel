# Plan — ROADMAP item 2: mutation-sample depth

*(A draft for the executing session. Re-home it as
`docs/plans/<date>-mutation-sample-depth/plan.md`, re-measure the composition and the line
numbers, and stamp it — the evidence below is dated 2026-11-18 at HEAD `e8a87d4`.)*

**Kind:** planned · **Depth:** standard · **Rollback cost:** 1 ·
**Evidence:** `npm run test:holosuite-mutation` → `PASS mutation: 12 passed, 0 failed`,
`catch_rate=1 (12/12)`; `npm run check:fast` 46/46 PASS; composition re-derived by reading
`holonovel/scripts/lib/holosuite-mutation.ts` and `playtest-lib.ts` in this session.
**Trust boundary:** `repo` evidence only.

## Questions

ROADMAP item 2 (`ROADMAP.md:25-34`): the audit "scores 12 transcript-derived cases … a larger
*lens* sample needs new deterministic lenses rather than repeated seeds (the tautology
`ORACLE_DERIVED`/CR-32 already excludes)." It closes when "the derived sample is large enough to
report a catch rate with a useful confidence interval" (`:33-34`).

## Trigger status

- **Trigger:** "the next Holosuite lens change" (`ROADMAP.md:33`). **Not met:** no lens has changed
  since 2026-11-16. The trigger is mildly circular — this item *is* the lens change it waits for —
  so execution is the maintainer's selection, stated as such.
- **Tier status:** `test:holosuite-mutation` is advisory in the gate manifest and the runner skips
  its pass/fail from the aggregate (`holonovel/scripts/holosuite.ts:176-181`). The change cannot
  block a build; it must still keep the command green.

## Why

- **EV1 — the sample is 12 of 17 declared cases, and five are excluded by rule.** `LENSES` holds
  nine names (`playtest-lib.ts:301-304`); `GM_LANES` holds four (`:305`) and `JUDGMENT_GM_LANES`
  names the two judgment lanes (`:308`). `MUTANTS` expands to thirteen entries — eight lens mutants
  (`LENSES` minus the judgment lens `wrong_tool`), plus `gating_leak` and `unreachable_goal`, plus
  three invariant mutants (`holosuite-mutation.ts:103-108`) — and `CONTRACT_MUTANTS` adds four
  (`:137-163`). `ORACLE_DERIVED` excludes five (`:100`), leaving `seeded = derived.length = 12`
  (`:201`), which the run prints as `12/12`. Composition of the twelve: five lens-derived, three
  invariants, four evaluator mutants.
- **EV2 — a perfect 12/12 has a wide interval.** Wilson 95% two-sided at 12/12 is
  `[0.7575, 1.0000]`, width 0.2425 (z = 1.96, computed this session). The published line
  (`holosuite.ts:318-320`) prints only the point estimate, so a reader cannot see the uncertainty.
- **EV3 — the two judgment lanes are never computed.** `JUDGMENT_GM_LANES` names
  `world_population_failure` and `coupling_failure` (`playtest-lib.ts:308`); `computeLenses`
  initialises every lane in `[...LENSES, ...GM_LANES]` to `[]` (`:362`) while pushing only to the
  nine lenses plus `gating_leak`/`unreachable_goal` (`:366-431`). Both judgment lanes are therefore
  permanently empty: a report section that can never carry a finding.
- **EV4 — the published statistic already carries a composition, but not the mix.** `metrics`
  exposes `seeded`, `caught`, `missed`, `oracle_derived`, `controls_passed`, `controls_failed`, and
  `mutants` (`:210-222`), and §8 requires the rate be "published with the mutant set enumerated"
  (`spec/05-verification.md:255-263`). What is missing is (a) an interval and (b) the split between
  transcript-derived lens mutants, deterministic invariants, and evaluator mutants.
- **EV5 — evaluator mutants are cheap and honest, but they measure a different thing.**
  `CONTRACT_MUTANTS` binds each case to a production evaluator (`REQUIRED_PARAMS`/`paramKey`/
  `isAbsent`, `hasUndefinedRecord`, `classifyResult`, `stateDelta`) and requires a clean control
  (`:119-136`). A predicate that always answers one way fails its control, so the pair is a real
  self-test. What it does not measure is the oracle's power to detect a *transcript* fault.
- **EV6 — the lens population cannot reach a useful width without a spec change.** The spec defines
  nine lenses plus the four GM lanes (`playtest-lib.ts:301-305`), and a lens yields one mutant, so
  the most the lens-derived population can hold after both judgment lanes become deterministic is
  seven (five lens mutants plus two lanes). Wilson 95% at 7/7 is `[0.6457, 1.0000]`, width 0.3543 —
  2.4× the width the item calls useful. Reaching the bar on that population alone needs new
  deterministic lenses, which is a spec change and not this increment.
- **EV7 — the fixture is three transcript turns and an oracle object.** `evidence()`
  (`holosuite-mutation.ts:29-36`) builds `set_badge`, `manage_world create_room`, and `run_command
  look`, each with `state_delta`, plus an oracle with `gating_leak`, `mission`, and `authoring`
  fields; per-mutant cases append turns. Neither judgment lane's predicate has the fields it needs
  today (no NPC population declaration, no coupling declaration), so P1 measures the extension
  rather than assuming it exists.
- **EV8 — the register already records the gap and its shape.**
  `spec/audit/review-register.md:3907-3909`: F9 "the mutation sample was too small … a wider *lens*
  sample needs new deterministic lenses, since the two uncomputed lanes are judgment lanes
  (`JUDGMENT_GM_LANES`)"; F12 (`:3905-3906`) names the contract block as the 8 → 12 step.
- **EV9 — the lib self-test uses its own `test()` helper.** `holonovel/scripts/test-holosuite-evidence.ts`
  declares a local `test(name, fn)` at `:26` and `assert` at `:36`, and holds ten cases covering
  assertion recording, predicate resolution, coverage validation, and spec hashing. New lane and
  interval cases join that file in that style; a case written in `node:test` styling would collect
  nothing.

## Decisions

- **D1 — The closing population is the aggregate seeded set, and the bar is width ≤ 0.15 with a
  lower bound ≥ 0.85 at 95% Wilson.** That is the population §8 defines (the fraction of *seeded*
  mutants the oracle detects) and the one the item's words "the derived sample" name (`seeded` is
  the derived count in `:201`). At n = 35 it is met with zero misses (`[0.9011, 1.0000]`, width
  0.0989) and with one miss (`[0.8547, 0.9949]`, width 0.1403); two misses fail (`[0.8139, 0.9842]`,
  width 0.1703). Target: **aggregate ≥ 35, at most one miss**, every miss dispositioned.
  - Rejected: binding the bar to the lens-only population. Its ceiling is seven mutants (EV6), so
    the bar would be unreachable without a spec change, and a plan whose done bar cannot go green
    is not a plan.
  - Rejected: "lower bound ≥ 0.90" — reachable only at zero misses for n ≈ 29-35, so one honest
    miss makes the bar unreachable and invites hiding it.
  - Rejected: the rule of three (one-sided, and it discards the observed miss rate).
- **D2 — The lens-only interval is published as a labelled, under-powered supplement.** The draft
  reports `lens_catch_rate_ci95` beside the aggregate and states in the printed line and the
  DECISIONS entry that a lens-only interval of useful width needs new spec lenses (EV6). It never
  closes the item, and the AAR records the realised lens-only width rather than implying it met
  the bar.
  - Rejected: dropping `lens_catch_rate_ci95` to avoid the awkward number. The number is the
    evidence for EV6 and for the roadmap's own diagnosis; suppressing it would hide a fact.
  - Rejected: presenting one unlabeled interval over the mixed set. It would let the aggregate
    pose as oracle-detection evidence, which EV5 forbids.
- **D3 — Grow the sample with the two deterministic lanes first, then evaluator mutants.**
  Arithmetic: 12 seeded today + 2 lanes = 14, + 21 fault/control pairs = 35.
  - Rejected: repeated seeds of the same lens. CR-32's tautology rule and the item's own text
    forbid it, and a repeated seed adds no information to an interval.
  - Rejected: raising `n` by cloning cases under new ids. The interval would narrow as if the cases
    were independent and the audit would report precision it does not have.
- **D4 — `world_population_failure` derives from the transcript, not from the oracle.** Predicate
  shape: a `manage_world` call whose args declare population (room creation with an NPC placement)
  is followed by an entry into that room whose `result` enumerates no NPC while the declaration
  named at least one. Clean control: the same sequence where the entry result names the declared
  NPC. The lens must not read any field the oracle seeds, which is what keeps it out of
  `ORACLE_DERIVED`.
- **D5 — `coupling_failure` derives from a declared coupling against an unrelated state delta.**
  Predicate shape: a call declares a coupling key; a later state-mutating call by a tool outside the
  coupling's declared resolver changes that key, visible in the record's `state_delta`. Clean
  control: the change arrives through the declared resolver, or no change arrives. If P1 finds the
  fixture cannot express a coupling declaration, the fixture is extended in the same increment and
  the scope change is recorded as an amendment, not improvised.
- **D6 — Both new lanes are proven in both directions before they are counted.** Each lane gets a
  fault case (fires exactly once, on the right turn) and a clean control (silent), added to
  `test-holosuite-evidence.ts` in its own `test()` style (EV9).
- **D7 — No spec change; the design is recorded in `holonovel/DECISIONS.md`.** §8 requires the rate
  be published with the mutant set enumerated; an interval plus a composition is an addition to the
  published statistic, and the enumeration already exists in `metrics.mutants`. A spec edit would
  drag in assemble, fingerprints, the coverage register, and the G7 hash for no normative gain.
  - Rejected: making the interval normative now. If a later review wants it in §8, that is its own
    spec increment with its own gates.
- **D8 — One disposition rule for a shortfall.** If honest cases fall short of 35, the increment
  does **not** lower D1's bar and does **not** silently ship a smaller sample: it records the
  realised `(caught, seeded)` and interval, keeps the item open, and amends the plan with the
  measured gap before re-stamping. A lower bar is a maintainer decision recorded on `ROADMAP.md`,
  never an AAR improvisation.
- **D9 — The item closes when the aggregate numbers hold, not when the code lands.** Retire
  `ROADMAP.md:25-34`, close the register's F9 row with the measured composition and both intervals,
  add a dated `## Resolved` entry, and keep the tier advisory (a mutation audit that blocks invites
  tuning the mutants to the gate).

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/scripts/lib/holosuite-mutation.ts` | two lane mutants, 21 evaluator fault/control pairs, `wilsonInterval`, composition and intervals in metrics | L |
| `holonovel/scripts/lib/playtest-lib.ts` | compute `world_population_failure` and `coupling_failure`; retire `JUDGMENT_GM_LANES` | M |
| `holonovel/scripts/holosuite.ts` | print both rates with intervals (`:318-320`) | S |
| `holonovel/scripts/test-holosuite-evidence.ts` | interval known-value cases, composition cases, lane fault/control pairs | M |
| `holonovel/DECISIONS.md` | dated design entry (D7) | S |
| `ROADMAP.md` | item 2 retired | S |
| `spec/audit/review-register.md` | F9 closed with the measured numbers | S |
| `CHANGELOG.md` | rendered from the AAR block | S |
| `docs/plans/<date>-mutation-sample-depth/` | plan, tasks, AAR | S |

Rollback: `git checkout -- holonovel/scripts` plus the single-line register/roadmap edits. No
generated artifact consumes the audit's numbers (it is report-only), so nothing else re-derives.

## Phases

- **P1 — Composition audit and fixture check.** Re-derive the composition by reading
  `holosuite-mutation.ts:100-163` and confirm the run still reports `12/12`; inspect `evidence()`
  (`:29-36`) and the per-mutant cases for the fields D4 and D5 need; record what is missing. Accept:
  a table of the 17 cases by category and a written list of the fixture fields each new lane needs.
- **P2 — Two deterministic lanes.** Implement the predicates in `computeLenses`; remove both from
  `JUDGMENT_GM_LANES` (it becomes empty and is deleted, with call sites checked by
  `grep -rn "JUDGMENT_GM_LANES" holonovel/`); add their mutants with `derived: true`. Accept: each
  lane fires on its fault case and is silent on its control; the run reports `seeded = 14`.
- **P3 — Evaluator mutants to the target.** Extend `CONTRACT_MUTANTS` with fault/control pairs bound
  to production evaluators, 21 of them (D3's arithmetic). Each pair names the module and function it
  binds to; a pair whose control can never fail is rejected. Accept: `seeded ≥ 35`;
  `controls_failed` is empty; every new case fails when its fault is inverted (probe, restored).
- **P4 — Interval and composition.** Add `wilsonInterval(caught, seeded, z = 1.96)` (pure, 4 dp,
  deterministic) and the metric fields; wire the printed line. Accept: known-value cases pass
  (`35/35 → 0.9011`, `34/35 → 0.8547`, `12/12 → 0.7575`, `7/7 → 0.6457` to 4 dp); the printed line
  carries both rates and both intervals with the lens-only one labelled.
- **P5 — Registers, design note, close.** DECISIONS entry; ROADMAP retirement; F9 closure; AAR with
  the measured intervals; `check:fast` un-piped; `session:close`.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `npm run test:holosuite-mutation` | `seeded ≥ 35` with at most one miss; both `ci95` values printed and the lens-only one labelled; `holosuite: PASS` |
| V2 | `npm --prefix holonovel run test:holosuite-evidence` | all cases pass, including the interval known-values and each lane's fault/control pair |
| V3 | `node -e` recompute the Wilson interval independently for the reported `(caught, seeded)` | matches the printed `ci95` to 4 dp |
| V4 | `grep -rn "JUDGMENT_GM_LANES" holonovel/` | no reference remains — P2 deletes the constant |
| V5 | `npm --prefix holonovel run test:all` | 56/56 — the lens change must not disturb the other tiers |
| V6 | `npm run check:fast` (un-piped, last) | `46 passed, 0 failed` … `check:fast: PASS` |
| V7 | `npm run check-roadmap`; `npm run check-registers` | pass; item 2 gone; F9 closed with a date and the numbers |
| V8 | `git status --porcelain` at close | only the planned files |

## Done bar

**Done bar:** the aggregate seeded sample reaches ≥ 35 with at most one dispositioned miss, and its
95% Wilson interval is published with width ≤ 0.15 and lower bound ≥ 0.85; the composition
(lens-derived / invariants / evaluators) is reported; the lens-only interval is published beside it
and labelled under-powered, with the reason recorded; `world_population_failure` and
`coupling_failure` are computed lanes with fault/control pairs proving both directions;
`test-holosuite-evidence` and `test:all` are green; ROADMAP item 2 retired and F9 closed with the
measured numbers; `check:fast` green; `aar.md` ends `LOOP PAUSED`; one commit.

## Out of scope

- Any normative change to §8 or to the catch-rate clause (D7).
- Making the audit blocking (D9).
- New *lens* names beyond the two lanes the spec already defines: adding a tenth lens is a spec
  change, not a harness change, and it is what a lens-only bar would require (EV6).
- Re-scoring the five `ORACLE_DERIVED` mutants; they stay reported-and-excluded.
- Padding the sample to reach 35: D3 and D8 forbid it.

## Risks

| Risk | Mitigation |
|---|---|
| The fixture cannot express a coupling or population declaration | P1 measures it; D5's extension is in-increment and recorded as an amendment |
| A new lane false-positives on live transcripts | Both directions self-tested (D6); the lane is a report section and the tier stays advisory |
| Honest cases fall short of 35 | D8's single rule: record, keep the item open, amend and re-stamp; never lower the bar silently |
| The aggregate interval is read as lens-only precision | D2 publishes the lens-only interval beside it, labelled, with the seven-mutant ceiling stated |
| The evaluator mutants drift from the evaluators they bind to | Each pair imports the production function; a shape change makes the fault predicate false and the audit reports a miss |
| A new case uses `node:test` styling in a file with a local `test()` | EV9 names the local helper; P2/P3 add cases in that style and V2 proves they ran |

## Dependencies

- Independent of items 1, 4, and 5; it touches only `holonovel/scripts/lib/` and the runner.
- No generated artifact consumes the audit's numbers, so no freshness chain runs.
