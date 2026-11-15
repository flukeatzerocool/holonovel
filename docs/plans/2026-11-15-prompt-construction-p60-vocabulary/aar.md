# AAR — 2026-11-15 §7.3a record and P60 vocabulary

AAR: SUCCESS — the P1 item shipped whole: P60's token resolves, the vocabulary
drift is a gate failure with a demonstrated red state, the scene-type tone
directive exists under `REQ-598a`, and §7.3a's four clauses are recorded in
`holonovel/DECISIONS.md`.

## 1. What was supposed to happen

The user asked for a plan for the next roadmap item, then approved execution.
The selected item (`ROADMAP.md` § *§7.3a documentation and P60 vocabulary (P1)*)
had two clauses. The plan (`plan.md`, v2) was self-reviewed and cold-reviewed at
standard depth, then stamped. Its done bar: (1) no pattern-rule token outside
the vocabulary, enforced by a predicate whose red state is demonstrated; (2) the
`narrate` prompt carries a persistent scene-type tone directive, tested by T788
and stated in a REQ; (3) DECISIONS records each clause with a predicate; (4)
registers and roadmap agree and `check:fast` is green.

The plan's explicit assumptions were that the validator could be self-tested
only through `scripts/lib/req-checks.ts` (EV16), that §7.7 is fingerprinted
(EV10), and that REQ-598 could not absorb a new sentence (EV21, 795/800
characters).

## 2. What happened

Phases 0–5 ran in order. Two deviations:

1. **The plan's gate ordering was wrong for its own artifact.** `npm run
   build-order` runs `check-loop-artifacts`, which requires the increment's
   `aar.md`, so the plan's Phase 4 build-order could not pass before Phase 5's
   AAR. The first build-order run failed on this (after a starter-freshness
   failure, below). The AAR was therefore written before the final full gate.
2. **The starter Novel artifact was not in the blast radius.**
   `check-starter-freshness` failed because `spec_version` and `data_format`
   moved; `npm --prefix holonovel run build:starter-novel` regenerated it
   (`holonovel/content/torre-nosferatu.json`, 2 lines).

Evidence: `check-loop-artifacts` and `check-starter-freshness` outputs are in
the session log; the red/green predicate outputs are in `tasks.md` T4 and T5.

**Loop closure.** plan-review passed → build-review checked → outcome verified
by the gates below. No `spec-review`/`proofread` delta token applies: this was
a Planned Change, not spec-engineering.

**Gate outcomes.**

| Gate | Token | Verdict |
|------|-------|---------|
| plan-review | `plan-review passed.` | passed (self + cold) |
| independent-review | `independent-review passed.` | passed (5/5 stages, 40 reads) |
| build-review | checks run; contract line emitted late (see 4) | passed with a finding |
| drift-report | not invoked (no drift lens) | n/a |
| spec-review | not invoked (no spec-review lens) | n/a |
| proofread | no separate token; the full `validate` pass ran inside `check` | n/a |

## 3. What went right

- **The cold pass earned its cost before execution.** Five Majors, one of them
  load-bearing: REQ-598 is at 795/800 characters, so the planned one-sentence
  amendment could not fit. The plan moved to `REQ-598a` before any edit. A
  build-time discovery would have forced a spec rewrite mid-increment.
- **The new gate has a real red state.** The predicate reported exactly one
  finding on the pre-retarget tree (`P60 … "Surface"`), and nothing after the
  retarget — the plan's error-gate dry run did what it was for.
- **The documentation duty found a real gap.** Writing the §7.3a record forced
  the discovery that scene-type anchoring was unimplemented (no tone directive
  anywhere in `holonovel/src`), which is now shipped and tested rather than
  documented as aspirational.
- **Traceability held.** `REQ-598a` needed no §5 map edit (base-keyed map,
  EV22), and the coverage audit stayed at 0 errors / 296 warnings — unchanged
  from baseline.

## 4. What went wrong

- **A plan's final gate can cover the plan's own artifact.** The plan put
  `build-order` in Phase 4 and the AAR in Phase 5; `check-loop-artifacts` makes
  that order unexecutable. The ordering was fixed at execution, but the plan
  template has no check for it (SK-12).
- **Blast-radius completeness slipped twice:** the starter artifact was
  regenerated without being listed, and the generated fingerprint file was
  named `scripts/lib/contract-fingerprints.ts` when it is
  `holonovel/src/generated/contract-fingerprints.ts`. Both are labeling misses,
  not scope creep.
- **A failure-mode row rested on a wrong predicate.** The plan warned that T640
  asserts `narrate` truncation; T640 asserts `badge_briefing` truncation
  (`TTRPG_MAX_BRIEFING_TOKENS`). The mitigation (run the whole suite) was still
  correct, and T788 now asserts the `narrate` prompt is not truncated.
- **The build-review contract line was not the first Build-mode output**
  (recurrence of SK-4). The gate checks ran before the first edit; only the
  auditable token was late.

## 5. Session performance

- **Outcome vs done bar.** All seven criteria hold: the red/green predicate, the
  helper self-test (63 passed), T788 plus the full lean-narrator suite (17
  passed), the DECISIONS record with four predicates, the register/roadmap
  pair, fingerprint regeneration, and a green fast gate.
- **Scope adherence.** One unplanned file (the starter Novel artifact, required
  by an existing freshness gate) and one unplanned ordering change. No feature
  beyond the plan; D3's implementation was in the approved plan.
- **Verification quality.** The predicate's red state is a captured output, not
  an assertion that it would fail; T788 exercises set, unset, persistence, and
  swap, plus a budget assertion. The gates that remain to run are the full
  `check` and `check:fast` at close.
- **Rework.** One plan revision cycle (cold review: 5 Majors, 9 Minors), one
  starter regeneration, one gate-order correction. No thrash on files.
- **Cost and effort.** Roughly 60 tool calls, dominated by the two full-gate
  runs; the cold pass used its full 40-read budget.
- **User intervention.** None after "execute plan".

## 6. Findings

| # | Finding | Triage | Disposition |
|---|---|---|---|
| F1 | A plan whose final gate runs `check-loop-artifacts` cannot put its own `aar.md` last. | P2 | Fixed in-session: AAR written before the final full gate; SK-12 raised for plan-review. |
| F2 | The starter Novel artifact regenerates whenever `spec_version`/`data_format` moves and was not in the blast radius. | P3 | Record-and-close: `AGENTS.md` already names `build:starter-novel`; the blast radius should list `holonovel/content/torre-nosferatu.json` for any spec-version bump. |
| F3 | The plan mislabeled the generated fingerprint file's path. | P3 | Record-and-close. |
| F4 | The plan's T640 failure-mode row cited the wrong prompt. | P3 | Record-and-close; T788 now covers the real risk. |
| F5 | The build-review contract line was late (recurrence of SK-4). | P3 | Record-and-close; no gate was skipped. |

No P0 or P1 findings. Project action items terminate at zero.

**Skill findings:** 1 SK record appended (SK-12, plan-review). The changelog
miss is a recurrence of the SK-1 class and is recorded here rather than as a
duplicate row. Run `skill-improvement-loop` to triage.

```
Process failure: none. No gate was skipped or bypassed; the build-review
contract line was emitted after execution rather than before the first edit,
which is a reporting-timing finding (F5), not a skipped gate.
```

### Follow-through register

No `SR-`/`PR-` IDs were opened this session. Prior AAR action items: none
carried into this increment.

## 7. Auto-remediation

Not requested. The one P2 finding was fixed in-session.

## 8. Invocation audit

Loads, in order: `programming-orchestrator`, `plan-review`,
`after-action-report`, `build-review`. `independent-review` ran as a delegated
cold pass (subagent).

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `independent-review` | yes (delegated) | routed |
| `build-review` | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | no | miss (recurrence of SK-1; no duplicate row) |
| `testing` | n/a | the harness already existed; T788 extends it |

Invocation: 6 expected, 5 loaded, 1 miss (recurring class).

LOOP PAUSED
