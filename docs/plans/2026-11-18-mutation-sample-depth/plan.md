# Plan — ROADMAP item 2: mutation-sample depth

**Date:** 2026-11-18
**Kind:** planned · **Depth:** standard · **Revision:** 3
**Increment:** `docs/plans/2026-11-18-mutation-sample-depth`
**Rollback cost:** 0 for this increment (two new documents). The execution increment this plan
authorises is cost 1: reversible edits to one spec paragraph, seven harness files, one README, and
three registers, with no destructive or external step.
**Evidence:** every premise below is repository content read at HEAD `3ae3444`. Baseline readings:
`npm run test:holosuite-mutation` exit 0 (`PASS mutation: 12 passed, 0 failed`, `mutation
catch_rate=1 (12/12)`), `git status --porcelain` empty.
**Trust boundary:** no web, user-supplied, or tool-output content is embedded.
**Deliverable of this increment:** this plan and `tasks.md`, cold-reviewed and stamped. No source,
spec, or register file is edited here. The blast radius, phases, and done bar describe the execution
increment a later session runs.
**Supersedes:** `docs/plans/2026-11-18-roadmap-plan-set-2/item-2-mutation-sample-depth.md`. This
document re-homes that draft, re-measures its lines on the post-stage-3 tree, and changes three of
its decisions (D1's §8 contradiction, D3's contract-pair census, D15's population reading).
**Execution note:** the execution session re-measures every `file:line` before starting; the numbers
here are dated to `3ae3444`.
**Review history.** Seven fresh-context review dispatches: r1 (6 Blockers, 19 Majors — including a §8
replacement that scored the lens stratum 0/5 and a census that mislabelled the lane mutants), r2
(3 Blockers — EV6's "spec-capped lens stratum" premise, D11's unsatisfiable successor, invariant
controls with no construction), r3 (4 Blockers — emphasis on fixture turn collisions, the miss-cap
contradiction, the missing branch key), r4 (3 Blockers — the control-ordering contradiction that
led to removing the environment selector), r5 (2 Blockers — the record union's missing arms and a
swap rule that contradicted D13), r6 (0 Blockers, 3 Majors — the `missed_mutation` polarity, the
print-guard truth table, and the uncounted entries' faults). All six failing passes' findings were
fixed in the text; r6's three Majors were fixed as a text-only amendment after the pass, which is
why the stamped bytes differ from the bytes r6 read. The cold report records this.


## Terms

- **The mutation tier** — `npm run test:holosuite-mutation` (`holosuite/scripts/holosuite.ts
  --tier=mutation`). It is the *method audit*: report-only, advisory at the gate, excluded from
  `--tier=all` and from coverage validation. "Audit" and "tier" below both name it.
- **Understudies** — the stochastic playtest tier (`holonovel/scripts/playtest.ts`), the campaign
  the catch rate accompanies.
- **Seeded / counted** — a mutant included in `seeded` and therefore in `catch_rate`.
- **`derived` flag** — a mutant record field: `true` means counted. It is unrelated to the
  `ORACLE_DERIVED` set, which names the five mutants excluded because their fault is an oracle field
  their lens re-emits verbatim (`holosuite-mutation.ts:85-100`). The code counts the *array* it
  filters on that flag (`const derived = results.filter((r) => r.derived)`, `:198`), and D15's
  reading rests on that array.
- **Stratum tokens** — the code uses `lens`, `lane`, `invariant`, `contract`; §8 as amended publishes
  them as lens-derived, GM lane, harness invariant, and contract evaluator. D13 fixes the mapping.
- **Phase N** — a phase of the execution increment (Phase 0 belongs to the authoring session, which
  stamps this plan). ROADMAP priorities (`P1`–`P3`) never appear as phase labels here.

## Questions

`ROADMAP.md:25-34` schedules "Mutation-sample depth (P2)": the audit "scores 12 transcript-derived
cases", the two uncomputed lanes are judgment lanes, and the item "closes when the derived sample is
large enough to report a catch rate with a useful confidence interval" (`:33-34`).

The request: **draft the plan for this item, reviewed until no hard blocker remains** — planning
only, no execution in this increment.

## Trigger status

- **Trigger:** "the next Holosuite lens change" (`ROADMAP.md:33`). **Not met**, and not self-firing:
  this increment adds no lens (`LENSES` is unchanged; Out of scope), so the item is not the event its
  own trigger names. `ROADMAP.md:27-31` records that the sample grew only by contract mutants
  (2026-11-16, 8 → 12), and the tree's `LENSES` and mutant set match that description. Execution is
  therefore a maintainer selection, recorded as such rather than dressed up as a fired trigger.
- **Tier status:** the mutation tier is report-only and advisory
  (`scripts/lib/gate-manifest.ts:272-279`, `advisory: true`), and the runner excludes it from
  coverage validation (`holonovel/scripts/holosuite.ts:179-181`). A miss can never fail a build; the
  execution increment must still leave the printed number honest, because the printed number is the
  deliverable.

## Why

- **EV1 — the counted set is 12 of 17 declared cases, and no lane mutant is counted.** `LENSES`
  holds nine names (`holonovel/scripts/lib/playtest-lib.ts:301-304`), `GM_LANES` four (`:305`), and
  `JUDGMENT_GM_LANES` the two judgment lanes `world_population_failure` and `coupling_failure`
  (`:308`). `MUTANTS` expands to thirteen entries
  (`holonovel/scripts/lib/holosuite-mutation.ts:103-109`): eight lens mutants (`LENSES` minus the
  judgment lens `wrong_tool`), two lane mutants, and three invariant mutants. The lane mutants are
  `gating_leak` and `unreachable_goal` — the *deterministic* lanes. The two judgment lanes have no
  mutant at all. `CONTRACT_MUTANTS` adds four (`:137-163`). `ORACLE_DERIVED` excludes five (`:100`:
  `hallucinated_tool`, `unrecovered_error`, `state_divergence`, `gating_leak`, `unreachable_goal`),
  leaving `seeded = derived.length = 12` (`:201`), printed as `12/12`. The twelve are five lens
  mutants, three invariants, and four contract mutants. `ROADMAP.md:27-28` describes the same twelve
  as "the lens set plus four contract mutants"; the census above is the accurate one, and the
  retirement entry states it.
- **EV2 — a perfect 12/12 carries a wide interval, and only the point estimate is printed.**
  Two-sided Wilson at 95% for 12/12 is `[0.7575, 1.0000]`, width 0.2425 (z = 1.96, recomputed this
  session). The printed line (`holonovel/scripts/holosuite.ts:317-320`) shows `catch_rate=1 (12/12)`
  and nothing about precision, so a reader cannot see the uncertainty the roadmap item exists to
  remove.
- **EV3 — four report sections can never carry a finding today.** `computeLenses` initialises every
  lane in `[...LENSES, ...GM_LANES]` to `[]` (`playtest-lib.ts:362`) and pushes only to eight of the
  nine lenses plus `gating_leak` and `unreachable_goal` (`:366-431`). `world_population_failure` and
  `coupling_failure` are empty today, and `wrong_tool` is empty by design — a judgment lens with no
  deterministic signal. D4 and D5 fill the first two; `wrong_tool` stays as it is (Out of scope).
- **EV4 — the shipped metric contradicts §8's own definition of the catch rate.** §8 defines it as
  "the fraction of seeded mutants that cause at least one **lens** to fail"
  (`spec/05-verification.md:255-260`). Four of the twelve counted cases (the contract mutants) bind
  evaluator predicates — `missingParamRefused`, `hasUndefinedRecord`, `classifyResult`, `stateDelta`
  (`holosuite-mutation.ts:137-163`) — and never run `computeLenses`; the three invariant mutants
  test `eval-oracle` predicates directly (`:106-108`). Seven of the twelve counted cases therefore
  cannot cause a lens to fail. The clause is normative prose, not a REQ body, so no requirement
  currently owns the gap.
- **EV5 — the evaluator surface is large enough to grow the population on distinct branches.** The
  harness's own libs export the predicates the tiers rely on: `validateParams`, `isAbsent`,
  `paramKey`, `requirementFor` (`holonovel/src/core/param-contract.ts:39-105`); `prefix`,
  `errorClass`, `classifyResult`, `asArray`, `roomSet`, `stateFingerprint`, `pcAlive`, `partyRooms`,
  `entityCounts`, `stateDelta`, `validateFinding`, `anchorPresent`, `reachableRooms`, `isReachable`
  (`playtest-lib.ts:30-275`, with `stateDelta` at `:225-238`); `pcVitals` (the branch candidate 10
  uses, `:114-147`, dead/wound rule at `:124-138`); `deriveCoverage`, `assertedReqsByTier`,
  `validateCoverage`
  (`holonovel/scripts/lib/eval-coverage.ts:13-95`); `parsePredicate`, `resolvePredicate`,
  `unresolvedPredicates` (`holonovel/scripts/lib/eval-predicate.ts:24-100`); `inventoryNames`
  (`holonovel/scripts/lib/eval-oracle.ts:62-66`); `canonicalJson`, `summarize`
  (`holonovel/scripts/lib/eval-schema.ts:79-95`). D3's 24 candidates are drawn from these functions;
  two candidates may share a function but never a branch.
- **EV6 — a useful lens-only interval is out of this increment's scope, for three harness reasons.**
  The lens stratum holds five mutants because the nine lenses yield eight mutants and three of those
  (for `hallucinated_tool`, `unrecovered_error`, `state_divergence`) are excluded as tautologies —
  the lens re-emits the field the mutant seeds (`holosuite-mutation.ts:85-100`). The stratum could
  grow three ways: de-tautologise those three lenses so each derives its signal from the transcript,
  admit several fault branches per lens, or add lenses to §8's list. Each is real harness or spec
  work with its own fixtures, and the first two are the roadmap section D11 schedules. Until then
  the numbers are: 5/5 `[0.5655, 1.0000]`, width 0.4345; counting the two deterministic lane mutants
  (`gating_leak`, `unreachable_goal`) as lens cases, 7/7 `[0.6457, 1.0000]`, width 0.3543; a tenth
  lens, 6/6 `[0.6097, 1.0000]`, width 0.3903; all nine lenses one mutant each, 9/9
  `[0.7008, 1.0000]`, width 0.2992. All four are far from the 0.15 width the item asks for.
- **EV7 — the fixture is three transcript turns and an oracle object, and it lacks both lanes'
  evidence shapes.** `evidence()` (`holosuite-mutation.ts:29-81`) builds `set_badge`, `manage_world
  create_room`, and `run_command look`, each with `state_delta` and `post_fp`, plus an oracle with
  `gating_leak`, `mission`, and `authoring`. Records carry `result`, `args`, `prefix`, `error_class`,
  `post_fp`, and `state_delta` — but no `pre_fp`, no `manage_npc` turn, and no movement turn.
  Phase 2 adds those three; the extension is named, not improvised.
- **EV8 — live transcript records carry every field the two lanes read.** The record written per
  turn carries `args` (`playtest.ts:407`), `result` (`:406-408`), `active_room` (`:400`, `:410`),
  `pre_fp` and `post_fp` (`:410`), `state_delta` (`:412`), and `rooms_before`/`rooms_after`
  (`:410`). `computeLenses` already reads `result` through `text()` (`playtest-lib.ts:364`), and
  `playtest.ts:608` reads `active_room` from the same records. Both lane predicates therefore observe
  live runs, not only their fixture. `result` is truncated to 4,000 characters on non-defect turns
  (`:408`), which is immaterial here: neither lane parses prose.
- **EV9 — the lib self-test uses its own `test()` helper.** `test-holosuite-evidence.ts` declares a
  local `test(name, fn)` at `:26` and `assert` at `:36`, and holds ten cases covering assertion
  recording, predicate resolution, coverage, and spec hashing. It runs inside `test:all` as one of
  the 56 commands (`holonovel/scripts/run-test-suite.ts:76`). New cases join that file in that style
  — a case written in `node:test` styling would collect nothing.
- **EV10 — the register already records the gap and its shape.**
  `spec/audit/review-register.md:3907-3909` F9: "the mutation sample was too small … a wider *lens*
  sample needs new deterministic lenses, since the two uncomputed lanes are judgment lanes
  (`JUDGMENT_GM_LANES`)"; F12 records the 8 → 12 contract-mutant step as resolved.

## Decisions

- **D1 — Amend §8 so the published statistic has one definition, then compute that definition.**
  The clause currently promises a lens-only catch rate while the code publishes a mixed one (EV4).
  Amending the clause is chosen because the mixed population is what makes a useful interval
  reachable without inventing lenses, and because a harness must not publish a number its spec's
  definition excludes. Replacement paragraph, verbatim, replacing the nine lines at
  `spec/05-verification.md:255-263`:

  > **Mutation-audit catch rate.** The method audit measures whether the harness detects known
  > defects. It seeds a deterministic set of mutants — fault injections into the server, the
  > harness, or the evaluation evidence — each bound to a declared detection predicate, and reports
  > a catch rate: the fraction of seeded mutants whose bound predicate observes the injected fault.
  > A mutant MAY be selected by an identifier that leaves normal runs unaffected, or MAY carry its
  > fault and control evidence directly. Every counted mutant SHALL carry a clean control that its
  > bound predicate does not observe. The mutant set SHALL be published enumerated, with its
  > composition by stratum — lens-derived, GM lane, harness invariant, and contract evaluator — and
  > each stratum's own rate SHALL be published beside the aggregate, so the aggregate is never read
  > as lens precision. The catch rate SHALL be published before an Understudies campaign is treated
  > as evidence; a campaign whose accompanying catch rate is absent is diagnostic only and does not
  > support a convergence claim. The audit is report-only and never blocks a build.

  Two wording choices are deliberate. "Observes the injected fault" matches the code: a lens
  mutant's bound predicate is `computeLenses` reporting at least one finding for that lens, so it
  observes the fault by succeeding — a clause written as "the predicate fails" would score the lens
  stratum 0/5. "MAY be selected by an identifier" admits the contract mutants, which carry their
  evidence directly instead of reading `TTRPG_MUTANT`.
  - Rejected: cut the contract and invariant mutants from `seeded` to match the clause as written.
    That leaves n = 5 and a width of 0.4345; the item's bar could not be met by any harness work.
  - Rejected: leave §8 alone and publish a mixed number anyway. That is the shipped state, and it
    is precisely the drift this increment exists to remove.
- **D2 — The closing population is the aggregate seeded set, fixed at exactly 35, with all 35
  caught.** Every mutant in the sample is authored, so a miss is a defect in the case or in the
  harness, never a property of the world: the bar is `caught = 35`, width 0.0989, lower bound
  0.9011, and a miss is fixed or the case is replaced from the reserve (D3, D12) — never tolerated.
  - Rejected: a one-miss tolerance. The miss would be authored, so "at most one miss" would license
    shipping a known-broken case, and the interval criteria at larger n could certify a sample the
    cap rejects.
  - Rejected: "n ≥ 35". Under it the three criteria can disagree, and a bigger authored sample adds
    nothing to a rate that is 1.0 by construction.
  - Rejected: binding the bar to a lens-only population. Growing it honestly is the roadmap section
    D11 schedules (EV6), so a bar set there would be unreachable this session and a plan whose done
    bar cannot go green is not a plan.
  - Rejected: "lower bound ≥ 0.90". At zero misses the lower bound is 0.9011 only at n = 35; a
    smaller sample fails it for no gain.
- **D3 — Grow to 35 with the two judgment lanes and twenty-one contract pairs, each on a distinct
  behaviour branch.** Arithmetic: 5 lens + 2 lane + 3 invariant + 25 contract = 35. A *branch* is a
  function plus the input shape that distinguishes it; two pairs MAY share a function but never a
  branch, and a pair whose control can never fail is rejected. Candidates, in execution order:
  1. `paramKey` — an actionless call keys as `tool:` and a classified call as `tool:action` (the
     missing-parameter refusal branch is already covered by the shipped `unguarded_missing_param`
     pair, `holosuite-mutation.ts:138-143`).
  2. `requirementFor` — a classified `tool:action` returns its requirement; an unclassified one
     returns `undefined` (the `unless` branch is already exercised by `missingParamRefused`, so it
     is not a second candidate).
  3. `isAbsent` — a whitespace-only string is absent.
  4. `prefix` — unrecognized text classifies as `[?]`.
  5. `errorClass` — a `[NEED_INPUT]` prefix is a denial, not a defect.
  6. `classifyResult` — `isError: true` sets `mcp_error` on an `[OK]` body.
  7. `asArray` — an object map normalizes to its values.
  8. `roomSet` — room names sort canonically regardless of insertion order.
  9. `stateFingerprint` — key order does not change the fingerprint.
  10. `pcVitals` — three Wounds is death and two is not; a `dead` condition string is death and
      hit points do not decide it (`playtest-lib.ts:123-139`).
  11. `reachableRooms` — a two-hop exit chain reaches the far room.
  12. `isReachable` — an unknown goal is unreachable.
  13. `partyRooms` — an unplaced PC maps to `null`.
  14. `entityCounts` — a populated world reports nonzero rooms, exits, and NPCs.
  15. `stateDelta` — removing an entity is a negative delta (the existing pair covers creation, so
      this is a distinct branch).
  16. `validateFinding` — a finding with no `file:line` predicate is rejected.
  17. `anchorPresent` — a quoted `source_anchor` counts; a bare key does not.
  18. `inventoryNames` — object items normalize and sort.
  19. `deriveCoverage` — a non-assertion event contributes no coverage.
  20. `validateCoverage` — an unknown REQ is reported, a known one is not.
  21. `parsePredicate` — a malformed predicate returns `null`.
  22. `resolvePredicate` — a `..` path escape is refused.
  23. `unresolvedPredicates` — repeated unresolvable predicates collapse to one entry.
  24. `canonicalJson` — key order is stable and value changes alter the string.

  Candidates 1–21 are the required set; 22–24 are reserve and replace a failed candidate one for
  one, so the total stays 35. The four existing contract pairs count inside the 25. Distinctness is
  mechanical: a new pair's `(function, branch-input)` key must differ from the existing four and
  from every other new pair, and Phase 4 asserts the key set is unique.
  - Rejected: repeated seeds of the same mutant id. The audit's own tautology rule — a mutant that
    seeds the field its lens re-emits proves nothing (`holosuite-mutation.ts:85-100`) — forbids it,
    and a repeated seed adds no information to an interval.
  - Rejected: raising `n` by cloning existing cases under new ids. The interval would narrow as if
    the cases were independent and the audit would report precision it does not have.
  - Rejected: a tenth lens. It is a §8 change and, on its own, moves the lens stratum from 5 to 6 —
    still under-powered (6/6, width 0.3903).
- **D4 — `world_population_failure` is derived from the transcript: a successful NPC creation that
  adds no NPC.** Predicate shape: a record with `tool === "manage_npc"`, `args.action === "create"`
  (updates and removals are excluded), `prefix === "[OK]"`, a non-null `state_delta`, and
  `state_delta.npcs === 0` — the call declared a new inhabitant and the counted population did not
  move. `state_delta` is either `stateDelta(before, after)` or `null` (`playtest.ts:412`), and
  `stateDelta` always emits every key including `npcs` (`playtest-lib.ts:225-238`), so the predicate
  sees a full delta or nothing; a `null` means no diff was computed for that turn and is not a
  fault. Clean control: a `t6` create with `state_delta.npcs === 1`. `state_delta` is computed per
  record from the before and after Novel documents, so the predicate reads a live field, not prose
  and not an oracle field, and stays outside `ORACLE_DERIVED`.
- **D5 — `coupling_failure` is derived from the transcript: a move reports success and the mechanical
  state does not change.** Predicate shape: an `[OK]` `run_command` whose first whitespace-delimited
  token of `args.command`, lowercased, is one of `go move walk north south east west northeast
  northwest southeast southwest up down in out enter exit climb descend ascend`; and whose record has
  `pre_fp === post_fp`. Matching is whole-token, not prefix, so `gossip` never matches. A successful
  move changes `stateFingerprint`, which folds each entity's `current_room` (`playtest-lib.ts:97-105`),
  so an equal fingerprint is the location property failing to couple. Clean control: a `t6` move with
  `pre_fp !== post_fp`. A failed move is `[NOT_FOUND]` or `[INVALID_INPUT]`, so it never reaches the
  predicate.
  - Rejected: a predicate on prose. `result` is free text, and `look`, `examine`, and `suggest`
    legitimately name rooms without moving — a prose test fires on non-faults and on GM-only runs
    where `active_room` is `null` (`playtest.ts:400`).
  - Rejected: keying the lane on `state_delta` counts. `stateDelta` (`playtest-lib.ts:225-242`)
    counts rooms, things, exits, PCs, NPCs, beats, and inventory; a move moves none of them, which is
    exactly why the fingerprint, not the delta, carries the signal.
- **D6 — Every seeded mutant carries a clean control, including the eight transcript mutants that
  have none today.** The contract pairs already do (`holosuite-mutation.ts:137-163`); the eight
  seeded transcript mutants (five lens, three invariant) do not. After Phase 2 the transcript
  population is ten, so `controls_passed` reaches 35 over the full sample and `controls_failed` must
  be empty. A control is never scored into `catch_rate`. D13 gives the construction for each kind.
- **D7 — The published report is stratified, and the lens stratum is labelled under-powered.**
  "Published enumerated" (§8, D1) is satisfied on one named surface: the tier's `--json` report
  carries `metrics.mutants` with one entry per **declared** case — all 40, each carrying `id`,
  `lens`, `stratum`, `detail`, and `derived`, so the five uncounted `ORACLE_DERIVED` cases are
  visible and marked. The metrics also carry:

  ```
  catch_rate: number | null        // null only when seeded === 0
  ci95: [number, number] | null
  composition: { lens: number; lane: number; invariant: number; contract: number }  // seeded only
  strata: { [token: string]: { caught: number; seeded: number; ci95: [number, number] | null } }
  controls_passed: number
  controls_failed: string[]
  claim_note: string
  ```

  Keys are the stratum tokens (`lens`, `lane`, `invariant`, `contract`); the printed line and the
  README use the §8 display names through one table in the runner, so a token never appears as a
  label. `claim_note` states D8's two claims in one sentence and names the lens stratum's five
  cases; the printed line labels that stratum with the literal string `lens (5/5, under-powered)`.
  Its acceptance is textual and checkable: the note contains the substrings `transcript`,
  `contract`, and `5 of 35`. `metrics.mutants` already exists (`holosuite-mutation.ts:218`); the increment adds `detail` and
  `stratum` to each entry and sets `lens` to `null` outside the lens stratum. §8 as amended requires
  the enumeration and the per-stratum rates; the note is the plain reading of that sentence, not an
  extra obligation.
  - Rejected: dropping the lens-only interval to avoid an awkward number. The number is the evidence
    for EV6 and for the roadmap's own diagnosis; suppressing it hides a fact.
  - Rejected: one unlabeled interval over the mixed set. It would let the aggregate pose as
    lens-precision evidence, which EV4 and EV6 forbid.
- **D8 — The published number makes two claims, and the plan says which is which.** The transcript
  strata (lens, lane, invariant; n = 10) measure whether the oracle observes seeded faults. The
  contract stratum (n = 25) measures whether a production evaluator discriminates a fault from a
  clean input — a regression test, not oracle power. The aggregate is the audit's headline because
  §8 defines one rate, but it never stands alone: `strata` publishes both, `claim_note` states the
  two claims in one sentence, and DECISIONS records that a reader may not read the aggregate as
  oracle power. Cases inside a stratum are also not independent draws, so the case-level Wilson
  interval overstates precision for any single predicate; no design-effect correction is claimed,
  because no measured design effect exists.
  - Rejected: publishing only the transcript strata. n = 10 is `[0.7225, 1.0000]`, width 0.2775, so
    the item's bar would be unmet and the roadmap would gain no number.
  - Rejected: a cluster-robust interval over the strata. It would be an invented statistic with no
    established variance estimator in this repository, and its lower bound would be dominated by the
    lens ceiling the item cannot move.
- **D9 — `wilsonInterval` is a new pure helper in `holonovel/scripts/lib/eval-stats.ts`, tested in
  the existing `test-holosuite-evidence.ts`.** No new harness and no new gate: a new harness would
  change `test:all`'s command count and the documented "56 commands" prose for no coverage gain.
  `check-script-quality` (C2) confirms no duplicate helper exists, and `grep -rn "wilson"` over
  `holonovel/scripts` and `scripts` returns nothing, so the helper is genuinely new.
- **D10 — No new lens and no new tool-surface change.** The spec edit is one §8 paragraph. It
  touches no REQ body, no §5.19 guardrail, no §7.7 property group, and no contract fingerprint
  input, so `check-fingerprint-sync` has nothing to regenerate: the fingerprinted surfaces are
  enumerated in `AGENTS.md`'s pre-commit checklist (§5.9, §5.16–5.17, §6.3, §6.4.2, §7.7, §5.19,
  Appendix Q) and §8 is not among them. `assemble` rewrites the `build-phase-map.md` content hash
  because `05-verification.md` is in the hashed set (`scripts/lib/phase-map-hash.ts:14-28`).
- **D11 — The item closes on the measured numbers, not on code landing.** Retire `ROADMAP.md:25-34`;
  close F9 with the measured composition and intervals; add a dated `## Resolved` entry; keep the
  tier advisory. Add one roadmap section, `## Deterministic lens breadth`, with its trigger and close
  condition stated: **Trigger:** the next change to `computeLenses` (a new or revised lens, or a
  lens's signal handed to it) — not the §8 lens-list event the retired item waited on, since
  de-tautologising a lens changes the harness without touching §8; closes when no lens mutant is
  `ORACLE_DERIVED` (each of the three lenses derives its signal from the transcript) and every
  deterministic lens carries at least two fault branches, so the lens stratum reaches at least 22
  counted cases and publishes a width ≤ 0.15 at zero misses. The bullets state that the aggregate's
  lens stratum is 5 of 35 and that a reader must not take the aggregate for lens precision.
  Historical register rows keep their recorded numbers (`review-register.md:2097-2103` records
  `13/13`; F12 records `8 → 12` as resolved); only F9 is rewritten, because only F9 states the open
  sample.
- **D12 — Feasibility is probed before the work starts, and a shortfall is scheduled, not absorbed.**
  Phase 1 sketches all 24 candidate pairs before any code is written. If fewer than 21 can be paired
  two ways, the increment does **not** execute to a smaller sample: it stops at Phase 1, writes
  `aar.md` ending `LOOP PAUSED` with the measured shortfall, adds the dated `ROADMAP.md` entry, and
  closes — the only work in that session is Phase 1 plus the register and close steps. D2's bar is
  never lowered at execution time.
- **D13 — A mutant is one record with a fault fixture, a clean fixture, and a branch key.** Every
  entry — lens, lane, invariant, or contract — is a discriminated record with one arm per stratum:
  - `lens` and `lane` (seeded): `{ kind: "evidence", fault: Evidence, clean: Evidence, bound:
    (e: Evidence) => boolean }` with `detects() = bound(fault)` and `control() = !bound(clean)`.
  - `invariant` and `contract` (seeded): `{ kind: "predicate", fault: () => boolean, clean: () =>
    boolean }` with `detects() = fault()` and `control() = clean()`. The three invariants read
    `fault: () => !fingerprintStable("a","b").ok` / `clean: () => fingerprintStable("a","a").ok`;
    `fault: () => !fingerprintChanged("a","a").ok` / `clean: () => fingerprintChanged("a","b").ok`;
    `fault: () => !envelopeRecognized("garbage result", false).ok` /
    `clean: () => envelopeRecognized("[OK] fine", false).ok`.
  - the five uncounted `ORACLE_DERIVED` entries: `{ kind: "predicate", fault: () => boolean,
    clean: () => true }`, never counted and never in `controls_*`. Their faults become explicit
    fixtures now that the selector is gone: each `fault` is `() => computeLenses(<faulted
    fixture>)[lens].length > 0`, where the faulted fixture is the clean base plus that mutant's
    single injection named at `holosuite-mutation.ts:45-80` — a `phantom_tool` record for
    `hallucinated_tool`, `unrecovered_detail: [{ t: 6 }]` for `unrecovered_error`,
    `persist_violations: [{ between: 5 }]` for `state_divergence`, `gating_leak: true`, and
    `reachability.objective_reachable: false`. D17 asserts their `detects()` is true as well; they
    are excluded from the rate because the lens re-emits the field the mutant seeds, not because
    they fail.

  Every record also carries `id`, `lens` (the lens name for `lens` stratum, else `null`),
  `stratum`, `detail`, `derived`, and (contract only) `branch` formatted
  `"<file-basename>#<function>:<input-shape>"`. A pair is rejected when either direction is false;
  there is no swap rule, because a predicate pair's two closures are different functions over
  different inputs. The per-record environment selector is removed:
  `MUTANT_ENV` and the
  `switch (activeMutant())` block (`holosuite-mutation.ts:22-24`, `:43-80`) become unused, because a
  global selector is what made a correct control impossible without an ordering rule. `evidence()`
  keeps its signature and becomes the base-fixture builder: the five turns `t1`–`t5` (`t1`
  `set_badge`, `t2` `create_room`, `t3` `look`, `t4` `manage_npc` with `npcs: 1`, `t5` move with a
  changed fingerprint). Each mutant's `fault` and `clean` are built from that base plus appended
  turns at `t6` (and `t7` where needed), and a `clean` fixture may carry a different number of
  appended turns than its `fault` fixture. `lens` is the owning lens name for lens mutants and
  `null` otherwise; `stratum` is `lens`, `lane`, `invariant`, or `contract`; `branch` is present on
  contract entries only, formatted `"<file-basename>#<function>:<input-shape>"`.
  `runMutationAudit` maps every seeded mutant's `control()` into one `controls` array, keeping the
  shipped `try/catch` guard (`:186-192`) — a throwing control records `{ id, control: false }` and
  appears in `controls_failed` rather than aborting the tier — and pushes
  `{ id, lens: lens ?? null, stratum, detail, caught, derived }` onto each `results` entry (`:167`,
  `:177`, `:194`). A lane mutant's `detects()` is
  `computeLenses(case.fault.tx, case.fault.oracle)[lane].some((f) => f.t === 6)`, `derived: true`,
  `stratum: "lane"`, and the finding's turn is the attribution: a finding pushed by a different
  lane, or by the same lane on another turn, cannot satisfy it. Each new lane pushes
  `{ t: <the fault record's t, i.e. 6>, tool: "manage_npc" | "run_command", detail: <fixed string> }`
  from `computeLenses`, in the GM-lane block after `unreachable_goal` (`playtest-lib.ts:425-430`), so
  the pushed `t` is the fault turn rather than that block's convention of `0`.
- **D14 — `wilsonInterval` is total and pure.** Signature
  `wilsonInterval(caught: number, seeded: number, z = 1.96): { low: number; high: number; width:
  number } | null`. `seeded === 0` returns `null` (no sample, no interval — the printed line then
  says `ci95=n/a`). `caught` is clamped to `[0, seeded]`. Bounds use the standard score formula,
  clamped to `[0, 1]` and rounded to 4 dp; `width` is computed from the unrounded bounds and then
  rounded, so it is not always the difference of the two printed bounds. At `caught = 0, seeded = 35`
  the result is `[0, 0.0989]`. No I/O, no clock, no randomness.
- **D15 — "The derived sample" is read as the audit's seeded population, and the reading is recorded
  where the item retires.** `ROADMAP.md:33-34` closes the item on "the derived sample", the field
  name the code counts (`derived`, `holosuite-mutation.ts:198-201`) and the population D1 writes
  into §8. Read as a lens-only population the bar is unreachable this session (EV6), so closing the
  item on the aggregate is the only reading under which it can close now. The cost of that reading —
  25 of 35 cases are contract evaluators and the lens stratum stays at 5 — is stated in the
  retirement commit's CHANGELOG entry, in `claim_note`, in DECISIONS, and in the D11 roadmap
  section, whose bullets repeat the cost. A maintainer who rejects the reading rejects D1 and D2
  together, and the item stays open.
- **D16 — One commit, and the two gates run in a fixed order.** `session:close` runs the fast gate
  and derives the subject from the CHANGELOG heading. The full gate (`npm run check`) runs in
  Phase 7 after `aar.md` exists, because `check` is strict about a missing AAR; the fast gate is
  lenient about it in flight. A finding is dispositioned in `aar.md` by exactly one of: fixed in the
  increment, a dated `ROADMAP.md` entry, or a `review-register.md` row — the same terminal set the
  AAR contract defines.
- **D17 — The mutant tables are exported so the self-test proves both directions.** `MUTANTS`,
  `CONTRACT_MUTANTS`, and `evidence()` are module-private today (`holosuite-mutation.ts:29,103,137`),
  so no committed test can exercise them; the current tier is its own only check. The execution
  increment exports the tables and the fixture builder, and `test-holosuite-evidence.ts` iterates
  the **seeded** entries only — every `MUTANTS` entry with `derived: true` plus all 25 contract
  entries, 35 in total — and for each asserts `detects()` true and `control()` true over the
  record's own `fault`/`clean` fixtures. No environment variable is set or restored, because D13
  removes the selector. It separately asserts that the five `ORACLE_DERIVED` entries are present and
  `derived: false` (declared, not counted, no control required), and that one case with its clean
  side broken — the fault fixture supplied as `clean` for an evidence entry, or `clean: () =>
  false` for a predicate entry — yields `control() === false` (the test-of-the-test). This replaces
  the transient manual inversion loop as the committed evidence; Phase 4 still runs one manual
  inversion as a spot check.
- **D18 — The tier keeps its report-only exit and gains a status line.** §8 says the audit never
  blocks a build, and `runMutationAudit` returns `passed: caught, failed: 0` unconditionally
  (`holosuite-mutation.ts:203-219`), so a 34/35 run currently prints `PASS mutation: 34 passed, 0
  failed`. The increment leaves the exit code at 0 and adds one printed `STATUS:` line whose value
  is `CLEAN` (no miss, no failed control) or `FAIL <ids>` (any miss or any failed control), where
  `<ids>` is the union of missed mutant ids and failed control ids. A `FAIL` line is a defect to
  fix, not a state to ship (D2). When `seeded === 0` the metrics set `catch_rate` to `null` and the
  printed rate reads `n/a`; the runner's guard (`holosuite.ts:318`, today
  `if (r.metrics && typeof r.metrics.catch_rate === "number")`) becomes
  `if (r.metrics && "catch_rate" in r.metrics)`, and its body prints
  `r.metrics.catch_rate === null ? "n/a" : r.metrics.catch_rate`. That keeps a tier with no
  `metrics` object silent, prints the line for a zero-sample mutation run, and shows a numeric rate
  otherwise.

## Blast radius

| File | Change | Size |
|---|---|---|
| `spec/05-verification.md` | D1's replacement paragraph (§8 catch-rate clause) | S |
| `spec/build-phase-map.md` | content hash refreshed by `assemble` (generated) | S |
| `holonovel/src/generated/g7-attestation.ts` | `SPEC_HASH` refreshed: the attestation embeds the assembled spec hash, so any spec edit invalidates it (amendment made during execution) | S |
| `holonovel.md` | assembled spec (generated) | S |
| `holonovel/scripts/lib/holosuite-mutation.ts` | fault/clean fixtures per mutant (D13), removal of `MUTANT_ENV` and the selector block, two lane mutants, 21 contract pairs, exported tables (D17), `stratum`/`detail`/`branch`, controls for every mutant, metrics, status line | L |
| `holonovel/scripts/lib/playtest-lib.ts` | compute `world_population_failure` and `coupling_failure`; delete `JUDGMENT_GM_LANES` | M |
| `holonovel/scripts/lib/eval-stats.ts` | new: `wilsonInterval` (pure) | S |
| `holonovel/scripts/holosuite.ts` | print interval, composition, strata, and controls (`:317-320`) | S |
| `holonovel/scripts/test-holosuite-evidence.ts` | interval known-values, composition, and each new lane's fault/control pair | M |
| `holonovel/scripts/test-playtest.ts` | contingency: the `computeLenses` cases, only if one pins the lane map | S |
| `holonovel/scripts/playtest.ts` | drop the `JUDGMENT_GM_LANES` import (`:40`) and the `judgment_gm_lanes` oracle field (`:575`); it has no reader | S |
| `holonovel/scripts/playtest/README.md` | the method-audit paragraph (`:152-160`) states the stratified rate and the controls | S |
| `holonovel/DECISIONS.md` | dated design entry (D7, D8, D11, D15) | S |
| `ROADMAP.md` | item 2 retired; the D11 lens-breadth section added | S |
| `spec/audit/review-register.md` | F9 closed with the measured numbers | S |
| `CHANGELOG.md` | rendered from the AAR block | S |
| `docs/plans/<date>-mutation-sample-depth/` | plan, tasks, AAR | S |

Rollback for the execution increment: `git revert <sha>` restores the prose, the harness files, the
README, and the registers in one step. Nothing generated consumes the audit's numbers (the tier is
report-only), so no freshness chain re-derives. `holonovel/holonovel.md` is the ignored copy
`scripts/assemble.ts:18-19,150-159` rewrites; it is not part of the commit.

## Phases

- **Phase 0 — Confirm the increment.** This plan and `tasks.md` already sit in
  `docs/plans/2026-11-18-mutation-sample-depth/`; the execution session stamps them (preflight, cold
  pass, `plan_gate_stamp`) and re-measures the `file:line` citations. Accept: the stamp records the
  plan hash that the session executes, and the increment directory holds both files from the first
  working phase.
- **Phase 1 — Measure before changing.** Re-derive the composition by reading
  `holosuite-mutation.ts:100-201`; confirm the run still reports `12/12`. Table the 17 declared cases
  by stratum. Read the 24 candidate predicates' signatures and sketch one fault and one control for
  each; reject any that cannot be paired two ways and promote a reserve. Inventory the fields the two
  lanes read against `playtest.ts:399-415`, and enumerate the constant's consumers with
  `grep -rn "JUDGMENT_GM_LANES" holonovel/`. Accept: a 17-row composition table, a 24-row predicate
  table with both directions sketched, at least 21 pairs that survive, a written confirmation that
  `args`, `active_room`, `pre_fp`/`post_fp`, and `state_delta` are live fields, and the consumer
  list (today `playtest-lib.ts:308`, `playtest.ts:40`, `playtest.ts:575`). The 21 executed are
  candidates 1–21 in D3 order, with a reserve promoted into the slot of any rejected candidate; a
  further survivor is recorded in the AAR as unused reserve. **Gate:** if fewer than 21 pairs
  survive, take D12's exit and stop before Phase 2.
- **Phase 2 — Fixture extension, exports, and lanes.** Extend `evidence()` with a fixed five-turn
  base: `t1` `set_badge` (gm), `t2` `manage_world create_room` (gm), `t3` `run_command look`
  (player), `t4` `manage_npc create` (gm, `state_delta {npcs: 1}`), `t5` movement (player,
  `args.command "go north"`, `pre_fp !== post_fp`) — each record carrying `pre_fp`/`post_fp`, with
  `t1`/`t3` unchanged fingerprints. Every mutant's appended turns move from their current `t4`/`t5`
  to a fault turn at `t6` (and `t7` where the mutant uses two, `forbidden_thrash` and `loop`), so the
  base never collides, no base turn follows a fault turn (the `dead_end` lens requires no later
  same-agent turn, `playtest-lib.ts:396`), and the one oracle-embedded turn number becomes 6:
  `unrecovered_detail[0].t` moves from 5 to 6. `persist_violations[0].between` is a boundary index,
  not a turn, and becomes 5 (the last base turn). Each mutant also gains a `clean` fixture whose
  `t6` turn is the fault turn made clean. The lane faults append at `t6`: `manage_npc` with
  `state_delta {npcs: 0}` for D4, and `run_command "go south"` with `pre_fp === post_fp` for D5; each
  lane's clean control is the same `t6` turn with `npcs: 1` and with a changed fingerprint
  respectively. Export `MUTANTS`, `CONTRACT_MUTANTS`, and `evidence()` (D17). Implement
  `world_population_failure` (D4) and `coupling_failure` (D5) in `computeLenses`, pushing with the
  fault record's `t` as D13 requires; delete `JUDGMENT_GM_LANES` and its two consumers; remove
  `MUTANT_ENV`, the `switch (activeMutant())` block, and the module header sentence that documents
  the identifier; add both mutants to `MUTANTS` with `derived: true` and a clean fixture; read `test-playtest.ts:215-241` and
  confirm none of its cases pins lane emptiness — if one does, change it to assert that the two new
  lane keys are present and empty on an empty transcript and re-run V5; add each lane's
  fault/control pair to `test-holosuite-evidence.ts` in its local `test()` style. Accept: each lane
  fires exactly once at `t6` on its fault and is silent on its clean control; the base reports no
  lane finding; `seeded = 14` in the `--json` metrics; the `computeLenses` cases still pass.
- **Phase 3 — Stratum, controls, and clean fixtures.** Add `stratum` and `detail` to each mutant
  record and to `metrics.mutants`, widening the entry's `lens` to `string | null`; set `lens` to
  `null` outside the lens stratum. Give the eight existing seeded transcript mutants a `clean`
  fixture (D13). The five lens mutants' clean turns are fixed: `forbidden_thrash` → one `[FORBIDDEN]`
  turn (no second); `missing_corrective` → a `[NOT_FOUND]` turn whose result carries `try <option>`;
  `dead_end` → a `[NOT_FOUND]` turn followed by another player turn at `t7`; `loop` → a repeated
  call whose `post_fp` differs; `ambiguity_stall` → an `[OK]` turn with no `[AMBIGUOUS]` prefix. The
  three invariants use their clean literal (`fingerprintStable("a", "a")`, `fingerprintChanged("a",
  "b")`, `envelopeRecognized("[OK] fine", false)`). Accept, read from
  `npm run test:holosuite-mutation -- --json` (the two control fields already exist,
  `holosuite-mutation.ts:215-216`): `controls_passed` equals `seeded` (14 after Phases 2–3) and
  `controls_failed` is empty.
- **Phase 4 — Contract pairs to exactly 35.** Add the 21 pairs of D3, each binding a production
  evaluator on a distinct branch and carrying its `branch` key (D13). The four existing pairs get
  keys that name their current bindings — `holosuite-mutation#missingParamRefused:
  ok-with-absent-param`, `eval-state#hasUndefinedRecord:undefined-key`,
  `playtest-lib#classifyResult:denial-vs-defect`, `playtest-lib#stateDelta:room-created` — so D3's
  distinctness rule is checkable from the start. A pair is accepted when `detects()` and
  `control()` are both true (D13's two directions); any other pair is rejected. Add the seeded-table
  two-direction test to `test-holosuite-evidence.ts` (D17). Accept: `seeded = 35`
  and `caught = 35` in the `--json` metrics; the test asserts `detects()` and `control()` true for
  every one of the 35, the five `ORACLE_DERIVED` entries stay declared and uncounted, and the
  broken-clean case yields false; temporarily removing `missing_corrective`'s fault turn is
  observed to miss and then restored, with a clean 35/35 read after the restore; `controls_failed`
  empty; `CONTRACT_MUTANTS.map((c) => c.branch)` is duplicate-free. The status line (D18) lands here
  too, so this phase can read it.
- **Phase 5 — Interval, composition, and report line.** Add `wilsonInterval` per D14 in
  `eval-stats.ts`; add `ci95`, `composition`, `strata`, and `claim_note` to the tier metrics (the
  two `controls_*` fields already exist and already print through the new line); wire
  `holonovel/scripts/holosuite.ts:317-320` to print the aggregate rate and interval, the
  composition, each stratum's rate, `controls=passed/seeded`, and the `STATUS:` line (D18); add the
  interval known-values and composition cases to `test-holosuite-evidence.ts`. Accept: known-value
  cases pass (`35/35 → [0.9011, 1.0000]`, `34/35 → [0.8547, 0.9949]`, `12/12 → [0.7575, 1.0000]`,
  `7/7 → [0.6457, 1.0000]`, `0/35 → [0, 0.0989]`, `0/0 → null`); `claim_note` contains
  `transcript`, `contract`, and `5 of 35`, and the printed lens label reads
  `lens (5/5, under-powered)`; every field V1 asserts is on the printed line.
- **Phase 6 — Spec amendment, docs, and assembly.** Apply D1's paragraph; rewrite the method-audit
  paragraph in `holonovel/scripts/playtest/README.md:152-160` so it describes the stratified rate and
  the controls and no longer mentions a declared mutant identifier; run `npm run assemble`. Accept:
  §8 reads as D1; the README matches the code (V4b still empty); `holonovel.md` and the phase-map
  hash are refreshed; the fast gate passes.
- **Phase 7 — Registers, AAR, gates, close.** DECISIONS dated entry (D7, D8, D15); ROADMAP
  retirement plus the D11 section; F9 closure; `aar.md` with the `## Changelog entry` block
  (`docs/plans/README.md:48-70`), the measured intervals, and the terminal token; then
  `npm run check` and `npm run check:fast` un-piped; then `session:close`. Accept: V1–V10 pass; one
  commit.

## Verification

| # | Command | Expected |
|---|---|---|
| V0 | Phase 1 gate: the 24-row candidate table | at least 21 pairs survive with both directions sketched; otherwise D12's exit is taken |
| V1 | `npm run test:holosuite-mutation` | `seeded = 35`, `caught = 35`; `composition` is `{lens: 5, lane: 2, invariant: 3, contract: 25}`; `metrics.mutants` has 40 entries; `STATUS: CLEAN`; `controls=35/35`; the printed line carries the aggregate `ci95`, the composition, each stratum's rate with the label `lens (5/5, under-powered)`, `claim_note`, and no `ci95=n/a` |
| V2 | `npm --prefix holonovel run test:holosuite-evidence` | all cases pass, including the six interval known-values (`35/35`, `34/35`, `12/12`, `7/7`, `0/35`, `0/0`), the seeded-table two-direction test, and the broken-clean test |
| V3 | `node -e` with D14's score formula over the five printed pairs (`35/35`, `5/5`, `2/2`, `3/3`, `25/25`) | each matches the formula's own recomputation to 4 dp |
| V4 | `grep -rn "JUDGMENT_GM_LANES" holonovel/` | no reference remains — the constant and both consumers are gone |
| V4b | `grep -rn "MUTANT_ENV\|TTRPG_MUTANT" holonovel/` | no reference remains — the selector, its export, and the module header sentence are gone |
| V5 | `npm --prefix holonovel run test:all` | 56/56 — the lens change must not disturb the other tiers |
| V6 | `npm run assemble`, then `npm run check` (un-piped) | 0 errors; the amended §8 prose passes proofreading and ambiguity checks |
| V7 | `npm run check:fast` (un-piped, last) | trailing `check:fast: PASS` |
| V8a | `npm run check-roadmap` | pass; item 2 gone; the lens-breadth section has a trigger and a close condition |
| V8b | `npm run check-registers` | pass; F9 `Resolved` with a date and the measured numbers |
| V8c | `npm run check-traceability` | pass |
| V9 | `git diff --stat` against the blast-radius table | only the planned files |
| V10 | `npm run spec-delta -- --base origin/main` | exit 0 and a printed classification of `minor` (or `major` if a REQ also moved); the class is recorded in the AAR |

## Done bar

**Done bar:** the seeded sample is exactly 35 with all 35 caught, and its 95% Wilson interval is
published with width ≤ 0.15 and lower bound ≥ 0.85; every seeded mutant carries a clean control and
`controls_failed` is empty; the composition (lens/lane/invariant/contract) and each stratum's
interval are reported, with the lens stratum labelled under-powered and the reason recorded;
`world_population_failure` and `coupling_failure` are computed lanes with fault/control pairs proving
both directions; §8 defines the published statistic and the implementation matches it;
`test-holosuite-evidence`, `test:all`, `check`, and `check:fast` are green; ROADMAP item 2 is retired
with the D15 reading recorded and the lens-breadth residue scheduled; F9 is closed with the measured
numbers; `aar.md` ends `LOOP PAUSED`; one commit.

## Out of scope

- Any new lens name, or a change to §8's nine-lens list. `wrong_tool` stays a judgment lens with no
  mutant, exactly as today; only the two judgment *lanes* become deterministic. Lens breadth is the
  D11 roadmap section.
- Making the mutation tier blocking. A mutation audit that blocks invites tuning the mutants to the
  gate.
- Any change to Understudies scoring — `success`, `partial_score`, or the tier declarations. Removing
  the unused `judgment_gm_lanes` oracle field (`playtest.ts:575`) is a report-shape change, listed in
  the blast radius; it feeds no score.
- Re-scoring the five `ORACLE_DERIVED` mutants; they stay reported-and-excluded.
- Padding the sample to reach 35: D3 and D12 forbid it.
- Any change to the Understudies scoring, tier declarations, or the coverage register.

## Risks

| Risk | Mitigation |
|---|---|
| The amended §8 paragraph trips proofreading, ambiguity, or length checks | Phase 6 runs the full gate before the registers land, so the wording settles while the harness work is already green |
| Fewer than 21 candidate pairs survive Phase 1 | Phase 1 sketches all 24 before any code; D12 takes the scheduled exit instead of shipping a smaller sample |
| The fixture extension shifts an existing mutant's evidence | Phase 2 fixes the base at five turns and appends every fault at `t6`, and asserts the base reports no lane finding; V5 runs the other tiers |
| A lane cannot be computed from live-transcript fields | EV8 lists the fields with line citations; D4/D5 read only those; Phase 1 re-confirms them |
| The aggregate is read as lens precision | D7 publishes strata and a normative label; D15 records the reading at the point of retirement |
| The case-level interval overstates precision within a stratum | D8 states it in DECISIONS and here; no independence claim is made |
| A new lane false-positives on a live transcript | Both directions self-tested (Phase 2); the tier stays advisory and report-only |
| The evaluator pairs drift from the evaluators they bind to | Each pair imports the production function, so a signature change fails compilation and a behaviour change fails the control |
| A new case uses `node:test` styling in a file with a local `test()` | EV9 names the helper; Phases 2, 4, and 5 add cases in that style and V2 proves they ran |
| `assemble` rewrites more than the phase-map hash | Phase 6 runs it before the registers and inspects `git status`; the committed diff is limited to `holonovel.md` and the hash line |

## Dependencies

- Independent of the other ROADMAP sections: it touches `holonovel/scripts/lib/`, the runner, one §8
  paragraph, and one README. A concurrent `index.ts` split moves no file this plan reads.
- `assemble`, `check`, and the fast gate must be runnable in the execution session (they are the same
  commands the last three increments ran).
- No generated artifact consumes the audit's numbers, so no freshness chain runs beyond `assemble`'s
  phase-map hash.
