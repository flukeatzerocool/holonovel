# Plan — ROADMAP item 2: mutation-sample depth

*(A draft for the executing session. Re-home it as
`docs/plans/<date>-mutation-sample-depth/plan.md`, re-measure the composition and the line numbers,
and stamp it — the evidence below is dated 2026-11-18 at HEAD `cc5e5a5`.)*

**Kind:** planned · **Depth:** standard · **Rollback cost:** 1 ·
**Evidence:** `npm run test:holosuite-mutation` → `PASS mutation: 12 passed, 0 failed`,
`catch_rate=1 (12/12)`; `npm run check:fast` 46/46 PASS; workspace `holonovel/scripts/lib/
holosuite-mutation.ts` 224 lines.
**Trust boundary:** `repo` evidence only.

## Questions

ROADMAP item 2 (`ROADMAP.md:25-34`): the audit "scores 12 transcript-derived cases … a larger *lens*
sample needs new deterministic lenses rather than repeated seeds (the tautology
`ORACLE_DERIVED`/CR-32 already excludes)." It closes when "the derived sample is large enough to
report a catch rate with a useful confidence interval" (`:34`).

## Trigger status

- **Trigger:** "the next Holosuite lens change" (`ROADMAP.md:33`). **Not met:** no lens has changed
  since 2026-11-16. The trigger is mildly circular — this item *is* the lens change it waits for —
  so execution is the maintainer's selection, stated as such (the form
  `docs/plans/2026-11-17-index-split-1/plan.md:45-50` used).

## Why

- **EV1 — the sample is 12 of 17 seeded mutants, and five are excluded by rule.**
  `MUTANTS` builds 13 entries — the eight non-judgment lenses (`LENSES` minus `wrong_tool`,
  `playtest-lib.ts:301-304,307`) plus `gating_leak`, `unreachable_goal`, and three invariant
  predicates (`holosuite-mutation.ts:103-108`) — and `CONTRACT_MUTANTS` adds four
  (`:137-163`). `ORACLE_DERIVED` excludes five (`:100`), so `seeded` is 12 (`:196-208`), which the
  run prints as `12/12`.
- **EV2 — a perfect 12/12 has a wide interval.** Wilson 95% two-sided at 12/12 is
  `[0.7575, 1.0000]`, width 0.2425 (computed this session with z = 1.96). The published line
  (`holosuite.ts:320`) prints only the point estimate, so a reader cannot see the uncertainty.
- **EV3 — two declared lanes are never computed.** `GM_LANES` names `world_population_failure` and
  `coupling_failure` (`playtest-lib.ts:305`), `JUDGMENT_GM_LANES` names both (`:308`), and
  `computeLenses` initialises every lane to `[]` (`:362`) but pushes only to `hallucinated_tool`,
  `forbidden_thrash`, `unrecovered_error`, `missing_corrective`, `dead_end`, `loop`,
  `ambiguity_stall`, `state_divergence`, `gating_leak`, and `unreachable_goal` (`:366-431`). Both
  judgment lanes are therefore permanently empty: a report section that can never carry a finding.
- **EV4 — the published statistic already carries a composition, but not the mix.**
  `metrics` exposes `seeded`, `caught`, `missed`, `oracle_derived`, `controls_passed`,
  `controls_failed`, and `mutants` (`:210-222`), and the spec requires the rate be "published with
  the mutant set enumerated" (`spec/05-verification.md:255-263`). What is missing is (a) an interval
  and (b) the split between transcript-derived lens mutants, deterministic invariants, and
  evaluator mutants — three different things that the single numerator currently mixes.
- **EV5 — evaluator mutants are cheap and honest, but they measure a different thing.**
  `CONTRACT_MUTANTS` binds each case to a production evaluator (`REQUIRED_PARAMS`/`paramKey`/
  `isAbsent`, `hasUndefinedRecord`, `classifyResult`, `stateDelta`) and requires a clean control
  (`:119-136`). A predicate that always answers one way fails its control, so the pair is a real
  self-test. What it does not measure is the oracle's power to detect a *transcript* fault — the
  thing §8's catch rate is about (`spec/05-verification.md:257-260`).
- **EV6 — the tier is report-only and already gated advisory.** `test:holosuite-mutation` is in the
  gate manifest as advisory (AGENTS.md gate table; `package.json:27`), and the runner skips the
  tier's pass/fail from the aggregate (`holonovel/scripts/holosuite.ts:179-181`). The change cannot
  block a build; it must still keep the command green.
- **EV7 — the register already records the gap and its shape.**
  `spec/audit/review-register.md:3908-3910`: F9 "the mutation sample was too small …
  a wider *lens* sample needs new deterministic lenses, since the two uncomputed lanes are judgment
  lanes (`JUDGMENT_GM_LANES`)"; F12 names the contract block as the 8→12 step.

## Decisions

- **D1 — "Useful" is numeric, fixed before the work: 95% Wilson two-sided interval with width
  ≤ 0.15 and lower bound ≥ 0.85.** At n = 35 that is met with zero misses (`[0.9011, 1.0000]`,
  width 0.0989) and with one miss (`[0.8547, 0.9949]`, width 0.1403); two misses fail
  (`[0.8139, 0.9842]`, width 0.1703). Target: **derived sample ≥ 35, at most one miss**, every miss
  dispositioned.
  - Rejected: "lower bound ≥ 0.90" — reachable only at zero misses for n ≈ 29–35, so a single
    honest miss makes the bar unreachable and invites hiding it.
  - Rejected: the rule of three (one-sided, and it discards the observed miss rate).
  - Rejected: an unqualified "large enough" — unfalsifiable, which is the finding the register
    already carries.
- **D2 — Grow the sample with new deterministic lenses first, then evaluator mutants.** Ordering
  follows the roadmap's own diagnosis (F9): the two uncomputed lanes become deterministic where a
  transcript-only predicate exists; then evaluator mutants fill the remainder to 35.
  - Rejected: repeated seeds of the same lens. CR-32's tautology rule and the item's own text forbid
    it, and a repeated seed adds no information to an interval.
  - Rejected: raising `n` by cloning cases under new ids. The interval would widen as if independent
    and the audit would report precision it does not have.
- **D3 — `world_population_failure` derives from the transcript, not from the oracle.** Predicate
  shape: a `manage_world` call whose args declare population (room creation or an NPC placement) is
  followed by an entry into that room whose `result` enumerates no NPC while the declaration named
  at least one. Clean control: the same sequence where the entry result names the declared NPC.
  Both directions are self-tested (D6). The lens must not read any field a mutant seeds on the
  oracle; that is what keeps it out of `ORACLE_DERIVED`.
- **D4 — `coupling_failure` derives from a declared coupling against an unrelated state delta.**
  Predicate shape: a room (or entity) call declares a coupling key; a later state-mutating call by a
  tool outside the coupling's declared resolver changes that key, visible in the record's
  `state_delta`. Clean control: the change arrives through the declared resolver, or no change
  arrives. If P1 finds the evidence fixture does not carry the coupling declaration, the fixture is
  extended in the same increment and the scope change is recorded as an amendment, not improvised.
- **D5 — Publish the interval and the composition, not a single headline number.**
  `runMutationAudit` gains `catch_rate_ci95: [lo, hi]`, `lens_catch_rate_ci95: [lo, hi]` (the
  transcript-derived lens mutants only), and `composition: { lens_derived, invariants, evaluators }`.
  `holosuite.ts:320` prints both rates with their intervals:
  `mutation catch_rate=… ci95=[…] lens=… ci95=[…] (caught/seeded)`.
  - Rejected: one interval over the mixed set with no label. It would let an all-evaluator sample
    pose as oracle-detection evidence, which EV5 forbids.
  - Rejected: dropping evaluator mutants to keep the rate pure. That abandons a working self-test
    surface and makes D1's target unreachable (only 13 lanes exist, five of them oracle-derived).
- **D6 — Both new lanes are proven in both directions before they are counted.** Each lane gets a
  fault case (fires exactly once, on the right turn) and a clean control (silent), added to
  `holonovel/scripts/test-holosuite-evidence.ts` (the Holosuite lib self-test, 11 cases today) or
  `test-playtest.ts`.
- **D7 — No spec change; the design is recorded in `holonovel/DECISIONS.md`.** §8 requires the rate
  be published with the mutant set enumerated (`spec/05-verification.md:255-263`); an interval plus
  a composition is an addition to the published statistic and the enumeration already exists in
  `metrics.mutants`. A spec edit would drag in assemble, fingerprints, the coverage register, and the
  G7 hash for no normative gain.
  - Rejected: making the interval normative now. If a later review wants it in §8, that is its own
    spec increment with its own gates.
- **D8 — The item closes when the numbers hold, not when the code lands.** Retire
  `ROADMAP.md:25-34`, close the register's F9 row with the measured composition and interval, add a
  dated `## Resolved` entry, and keep `test:holosuite-mutation` advisory (it must not become a
  blocking gate: a mutation audit that blocks invites tuning the mutants to the gate).

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/scripts/lib/holosuite-mutation.ts` | two lane mutants, ≥21 evaluator fault/control pairs, `wilsonInterval`, composition + intervals in metrics | L |
| `holonovel/scripts/lib/playtest-lib.ts` | compute `world_population_failure` and `coupling_failure`; shrink `JUDGMENT_GM_LANES` | M |
| `holonovel/scripts/holosuite.ts` | print both rates with intervals | S |
| `holonovel/scripts/test-holosuite-evidence.ts` | interval cases, composition cases, lane fault/control pairs | M |
| `holonovel/DECISIONS.md` | dated design entry (D7) | S |
| `ROADMAP.md` | item 2 retired | S |
| `spec/audit/review-register.md` | F9 closed with the measured numbers | S |
| `CHANGELOG.md` | rendered from the AAR block | S |
| `docs/plans/<date>-mutation-sample-depth/` | plan, tasks, AAR | S |

Rollback: `git checkout -- holonovel/scripts` plus the single-line register/roadmap edits. No
generated artifact depends on the audit's numbers (it is report-only), so nothing else re-derives.

## Phases

- **P1 — Composition audit and fixture check.** Re-derive the composition by reading
  `holosuite-mutation.ts:100-163` (17 seeded cases: 5 lens-derived, 3 invariants, 4 evaluators, 5
  excluded) and confirm the run still reports `12/12`. Inspect the evidence fixture (`evidence()` at
  `:30-82`) for the fields D3 and D4 need; record what is missing. Accept: a table of the 17 cases by
  category and a written list of the fixture fields each new lane needs.
- **P2 — Two deterministic lanes.** Implement the predicates in `computeLenses`; remove both from
  `JUDGMENT_GM_LANES` (it becomes empty and is deleted, with call sites checked by `grep -rn
  JUDGMENT_GM_LANES holonovel/`); add their mutants with `derived: true`. Accept: each lane fires on
  its fault case and is silent on its control; the run reports `seeded = 14`.
- **P3 — Evaluator mutants to the target.** Extend `CONTRACT_MUTANTS` with fault/control pairs bound
  to production evaluators. Arithmetic: 14 seeded after P2 + **21 pairs** = 35. Each pair names the
  module and the function it binds to; a pair whose control can never fail is rejected. Accept:
  `seeded ≥ 35`; `controls_failed` is empty; every new case fails when its fault is inverted (probe,
  restored).
- **P4 — Interval and composition.** Add `wilsonInterval(caught, seeded, z = 1.96)` (pure, 4 dp,
  deterministic) and the metric fields; wire the printed line. Accept: `12/12`-style known-value
  cases pass (`35/35 → 0.9011`, `34/35 → 0.8547`, `12/12 → 0.7575` to 4 dp); the printed line carries
  both rates and both intervals.
- **P5 — Registers, design note, close.** DECISIONS.md entry; ROADMAP retirement; F9 closure; AAR
  with the measured interval; `check:fast` un-piped; `session:close`.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `npm run test:holosuite-mutation` | `seeded=35` and `caught=35` (`catch_rate=1`) or `caught=34` (`catch_rate=0.9714`) with a dispositioned miss; both `ci95` values printed; `holosuite: PASS` |
| V2 | `npm --prefix holonovel run test:holosuite-evidence` | all cases pass, including the interval known-values and each lane's fault/control pair |
| V3 | `node -e` recompute the Wilson interval independently for the reported `(caught, seeded)` | matches the printed `ci95` to 4 dp |
| V4 | `grep -rn "JUDGMENT_GM_LANES" holonovel/` | no reference remains — P2 deletes the constant because both its members became deterministic |
| V5 | `npm --prefix holonovel run test:all` | 56/56 — the lens change must not disturb the other tiers |
| V6 | `npm run check:fast` (un-piped, last) | `46 passed, 0 failed` … `check:fast: PASS` |
| V7 | `npm run check-roadmap`; `npm run check-registers` | pass; item 2 gone; F9 closed with a date and the numbers |
| V8 | `git status --porcelain` at close | only the planned files |

## Done bar

**Done bar:** a 95% Wilson interval is published for the aggregate sample and for the
transcript-derived lens sample; the composition is reported; the derived sample is ≥ 35 with at most
one miss, every miss dispositioned; `world_population_failure` and `coupling_failure` are computed
lanes with fault/control pairs proving both directions; `test:holosuite-evidence` and `test:all` are
green; ROADMAP item 2 retired and F9 closed with the measured numbers; `check:fast` green; `aar.md`
ends `LOOP PAUSED`; one commit.

## Out of scope

- Any normative change to §8 or to the catch-rate clause (D7).
- Making the audit blocking (D8).
- A stochastic Understudies campaign; new *lens* names beyond the two lanes the spec already defines
  (adding a tenth lens is a spec change, not a harness change).
- Re-scoring the 5 `ORACLE_DERIVED` mutants; they stay reported-and-excluded.

## Risks

| Risk | Mitigation |
|---|---|
| The fixture cannot express a coupling declaration | P1 measures it; D4 extends the fixture in-increment and records an amendment |
| A new lane false-positives on live transcripts | Both directions self-tested (D6); the lane is a report section, and the audit stays advisory |
| Honest cases fall short of 35 | D2 forbids clones; the shortfall is a finding. Lowering D1's criterion is a plan amendment (re-stamped), never a silent change, and the AAR records the realised interval |
| The interval is misread as oracle-detection evidence | D5 publishes the lens-only interval beside the aggregate and the composition |
| The evaluator mutants drift from the evaluators they bind to | Each pair imports the production function (the pattern at `:119-136`); a shape change makes the fault predicate false and the audit reports a miss |

## Dependencies

- Independent of items 1, 4, and 5; it touches only `holonovel/scripts/lib/` and the runner.
- No generated artifact consumes the audit's numbers, so no freshness chain runs.
