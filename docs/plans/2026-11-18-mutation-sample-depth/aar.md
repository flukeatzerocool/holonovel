# AAR — mutation-sample depth (ROADMAP item 2)

**AAR: SUCCESS** — the audit now publishes a stratified 35-case catch rate with its Wilson interval,
both former judgment lanes are computed, §8 defines the published statistic, and roadmap item 2 is
retired with the lens-breadth residue scheduled.

## 1. What was supposed to happen

Execute the stamped plan `docs/plans/2026-11-18-mutation-sample-depth/plan.md` (plan-review passed,
cold review fresh, standard depth): amend §8, implement the two deterministic lanes, grow the sample
to exactly 35 with a clean control per case, publish the interval and strata, close the registers,
and commit once. Done bar: 35/35, width ≤ 0.15, lower ≥ 0.85, `controls_failed` empty, all gates
green, item retired, F9 closed.

## 2. What happened

| Phase | Result |
|---|---|
| 0 · stamp | Preflight clean; stamp verified (`fresh`, standard, stages 5) before the first edit |
| 1 · measure | Composition re-derived (12 = 5 lens + 3 invariant + 4 contract, no lane counted); 24 candidates sketched — 21 survived, none needed the reserve |
| 2 · fixture, selector, lanes | Base fixture grown to five turns with `pre_fp`/`post_fp`; `MUTANT_ENV` and its selector removed; `world_population_failure` and `coupling_failure` implemented; `JUDGMENT_GM_LANES` deleted with its two consumers |
| 3 · strata and controls | `stratum`/`detail`/`branch` on every case; clean fixtures for the eight existing transcript mutants; `lens` nulled outside the lens stratum |
| 4 · contract pairs | 21 new pairs added on distinct branches; seeded set = 35 |
| 5 · interval and report | `wilsonInterval` in `eval-stats.ts`; `ci95`, `composition`, `strata`, `claim_note`, `STATUS` wired into the printed line |
| 6 · spec and docs | §8 paragraph replaced; playtest README rewritten; `assemble` |
| 7 · registers and close | DECISIONS dated entry; ROADMAP item retired and lens-breadth section added; F9 closed; AAR; gates; commit |

### Gate outcomes

| Gate | Token | Verdict |
|---|---|---|
| plan-review / spec-plan | `plan-review passed.` | passed (stamped fresh, standard) |
| build-review | `build-review passed.` | passed |
| `test:holosuite-mutation` | `35 passed, 0 failed` · `catch_rate=1 (35/35)` · `ci95=[0.9011, 1] width=0.0989` · `controls=35/35` · `STATUS: CLEAN` | passed |
| `test:holosuite-evidence` | `14 passed, 0 failed` | passed |
| `test:all` | `56 passed, 0 failed` (181.7 s) | passed |
| `check` (full) | see §5 | passed |
| `check:fast` | `46 passed, 0 failed` … `check:fast: PASS` | passed |

### Deviations from the plan

1. **`g7-attestation.ts`** regenerated. The plan's D10 correctly said §8 is not a contract-fingerprint
   input, but the G7 attestation embeds the *whole assembled spec hash*, so the §8 edit invalidated
   it and the full gate failed. Fixed by running the generator (byte-deterministic, no content
   choice); the blast radius gained the row by amendment. This is the one gap the plan review did
   not catch.
2. **Two self-inflicted defects, both caught by the plan's own verification.** `errorClass` takes a
   prefix token, not result text, so the first `need_input_denial` pair read the wrong input; and the
   first cut listed 22 contract pairs because the reserve (candidate 22) was implemented. Both were
   fixed in Phase 5/4 respectively, and `test:holosuite-evidence` now pins the pair count and the
   composition.

## 3. What went right

- **The verification table did the work.** V1's `controls=35/35` and `composition={lens:5…}` caught
  the 36-case arithmetic immediately; the two-direction test caught the `errorClass` defect before
  the tier ran clean.
- **Removing the selector was the right call.** The cold pass that demanded it was right: with a
  global selector, `detects()` and `control()` need opposite environment states, and the first
  attempt at a control was unreachable by construction.
- **The mechanical lane predicates hold up.** Both read fields a live transcript carries
  (`state_delta.npcs`, `pre_fp`/`post_fp`), both have clean twins, and neither parses prose.

## 4. What went wrong

- **The plan under-predicted one generated artifact.** The G7 attestation embeds the spec hash; the
  checklist in AGENTS.md names fingerprints and the coverage register but not this file, so a
  planner following the plan misses it. The full gate caught it, which is the right place, but it
  cost a regeneration cycle.
- **The contract-pair count drifted once.** The plan's reserve list is a safety net, not an
  instruction; implementing candidate 22 pushed the sample to 36 and the interval to `35/36`. The
  `seeded === 35` assertion now prevents recurrence.

## 5. Session performance

- **Outcome vs done bar.** Met in full: 35/35, width 0.0989 ≤ 0.15, lower 0.9011 ≥ 0.85, controls
  35/35, lanes computed, §8 amended, registers closed, `LOOP PAUSED`.
- **Scope adherence.** One out-of-plan file (`g7-attestation.ts`), disclosed and amended; everything
  else matches the blast radius.
- **Verification quality.** Strong checks: the seeded-table two-direction test, the known-value
  interval table, `test:all` 56/56, and the full gate. The weak check was the plan's own generated-
  artifact list.
- **Rework.** One generator run and two case fixes. No gate was bypassed.
- **Cost.** One execution session; the plan's seven cold passes carried most of the design cost, and
  the execution itself was mostly mechanical.

## 6. Findings

- **P2 — record-and-close.** Any future spec edit invalidates `g7-attestation.ts`. The pre-commit
  checklist in AGENTS.md should name it beside the fingerprint list; that is a documentation fix
  outside this increment's scope, recorded here rather than scheduled, because the gate already
  blocks the mistake and the recovery is one command.
- **P3 — record-and-close.** The lens stratum remains 5 and under-powered; `ROADMAP.md` now carries
  the deterministic-lens-breadth section with its trigger and close condition.
- **P3 — record-and-close.** The case-level interval overstates precision within a stratum; DECISIONS
  records it and the per-stratum rates are published beside the aggregate.

**Project action items: zero.** No skill findings: every skill gate that ran produced a token, and
the one missed artifact is a project-doc gap (P2 above), not a skill gap.

## 7. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `independent-review` (via subagent) | yes, seven dispatches | routed |
| `build-review` | yes | routed |
| `after-action-report` | yes, this document | routed |
| `changelog-before-commit` | no | the CHANGELOG entry is authored as the AAR block per `docs/plans/README.md` |

## Changelog entry

**Title:** Mutation-sample depth: a stratified 35-case catch rate with its interval

**Summary:** The mutation audit now publishes the number §8 defines and its uncertainty: 35 seeded cases across four strata, each with a clean control, all caught, `ci95=[0.9011, 1.0000]` (width 0.0989). The two judgment lanes became deterministic, the `TTRPG_MUTANT` selector and `JUDGMENT_GM_LANES` are gone, and roadmap item 2 is retired with the lens-breadth residue scheduled.

- §8: the catch rate is defined over the bound detection predicate, requires a clean control per counted mutant, and publishes the set enumerated with every stratum's rate
- `world_population_failure` fires on an `[OK]` `manage_npc` create whose `state_delta.npcs` is 0; `coupling_failure` on a successful move whose `pre_fp === post_fp`
- 35 cases: 5 lens-derived, 2 GM lane, 3 harness invariant, 25 contract evaluator; `controls=35/35`, `STATUS: CLEAN`
- `wilsonInterval` (new `lib/eval-stats.ts`) publishes `ci95` and width; the lens stratum prints as `lens (5/5, under-powered)` beside the aggregate
- every mutant carries its own fault and clean fixture; the environment selector is removed
- `test:holosuite-evidence` grows to 14 cases (interval known values, all 35 two-direction checks, broken-clean, composition and branch uniqueness)
- ROADMAP item 2 retired, F9 closed, and a deterministic-lens-breadth section scheduled; `test:all` 56/56 and the full gate green

LOOP PAUSED
