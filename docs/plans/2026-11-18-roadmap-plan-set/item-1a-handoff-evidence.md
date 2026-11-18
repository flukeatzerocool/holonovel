# Plan — ROADMAP item 1, half A: the builder-side handoff evidence

*(A draft for the executing session. Re-home it as
`docs/plans/<date>-handoff-evidence/plan.md`, re-measure every line number, and stamp it — the
evidence below is dated 2026-11-18 at HEAD `cc5e5a5`. This is increment A of two; increment B is
`item-1b-verifier-run.md`.)*

**Kind:** planned · **Depth:** standard · **Rollback cost:** 1 ·
**Evidence:** this checkout at `cc5e5a5`; `npm run check:fast` 46/46 PASS; `holonovel/DECISIONS.md`
carries exactly one `@section evidence` record (`grep -n "@section evidence"` → `:2511`);
`holonovel/package.json:64-110` lists no H-step or G0 harness; `holonovel/RULESET_MODEL.md` does not
exist (ruleset-free build).
**Trust boundary:** every premise is `repo` evidence read from this checkout.

## Questions

Increment A produces what §10 Phase 2 compares against. ROADMAP item 1 (`ROADMAP.md:15-23`) binds
the operator to a verifier run; a verifier comparison needs a builder record, and the tree has one
record (G7). This increment writes the rest — only where a run produced it.

## Trigger status

- **Item trigger:** "the first publish after 2026-11-16" (`ROADMAP.md:22`). **Not met:** no publish
  has landed — `npm run status` reports 150 unpushed commits and the last pipeline run stopped at
  `record`.
- **Why this half can start:** it is preparation, not the verification. §10 does not require the
  publish to have happened in order to record the builder evidence.
- **Selection:** the maintainer's planning request (this set).

## Why

- **EV1 — §10 Phase 2 is a field-by-field comparison against recorded evidence.**
  `spec/07-independent.md:68-85` compares the verifier's entries with "the recorded ones" per
  workflow and per salient field; step 9 (`:87-98`) classifies each mismatch as Discrepancy, Pin
  drift, or Unclassifiable. With no builder record, every comparison is Unclassifiable and step 10's
  score (`:99-103`) collapses.
- **EV2 — the tree carries one record.** `holonovel/DECISIONS.md:2511-2522` holds the G7
  `narrative_coherence` attestation (`Workflow`, `Timestamp`, `Environment pins`, `Commands and
  output`, `Pass/fail`, `Findings`, plus three sub-check bullets). There is no
  `@section evidence-g0a`, `-g0b`, `-g2`, `-g3`, `-g4`, `-g5`, `-g6`, `-g8`, and no H1–H18 record.
- **EV3 — the record has a live parser.** `checkEvidenceRecordContract` in `scripts/validate.ts`
  asserts the six labels, a canonical workflow token, an ISO timestamp, a `pass`/`fail` value, and a
  sub-check enumeration (REQ-211a `spec/02-requirements.md:1446`, REQ-211c `:1452`); it landed
  2026-11-17. A record written in any other shape reddens `validate`.
- **EV4 — the build is ruleset-free, which shrinks the workflow set.** No `RULESET_MODEL.md` exists;
  Standing Rule 9 records "ruleset-free — no source" in DECISIONS.md (1) and skips H1 and H10
  (`spec/02-requirements.md:3564`); G0b and G2 use the Appendix W fixture
  (`spec/appendices-fixtures.md:778`); H14's diet is four artifacts plus `LICENSE.md`
  (`spec/06-artifacts.md:59`). P1 confirms whether the Rule 9 entry exists today — the draft does
  not assume it.
- **EV5 — no handoff runner exists.** The harness set (`holonovel/package.json:64-110`) has no H-step
  script and no G0 checklist runner; the nearest artifacts are `run_pattern_buffer.ts` (G5),
  `test-output-contracts.ts`, `check-g7-attestation` (already satisfied), and `test:all` (per-test
  counts). So the executable subset is small and the rest is a finding, not a pass.

## Decisions

- **D1 — Record only what a run produced.** For each workflow P1 maps to a command, run it and record
  the result in the REQ-211a shape; for each workflow with no harness, write a finding naming the
  workflow and the missing runner. No inferred, reconstructed, or hand-summarised pass.
  - Rejected: derive G4 from `check:fast` — a gate run is not the per-test table G4 records.
- **D2 — P1 maps before P2 writes.** The mapping table has one row per workflow (G0a, G0b, G2, G3,
  G4, G5, G6, G7, G8, H1–H18) with: harness command or "none", the evidence record present today,
  and the expected field source. A row whose harness the executing session cannot find is recorded
  as "none" rather than guessed.
- **D3 — The record shape is the parser's shape.** Each new block is
  `<!-- @section evidence-<workflow> -->` followed by the six labelled bullets and a sub-check
  enumeration (EV3). `npm run validate` is the acceptance test: it must stay at `0 error(s)` and
  each new record must parse.
- **D4 — Ruleset-free N/A is recorded as N/A, not as pass.** G6 and G8 have no ruleset to exercise;
  their records say `pass` with an N/A basis only if the workflow can be meaningfully replayed
  against the host with no package — otherwise the record says `fail` with the reason, which is the
  honest value a verifier can compare.
- **D5 — No spec, code, or register change.** The increment edits DECISIONS.md (6) and its own
  artifacts. No ROADMAP retirement: the item closes in increment B, when the report exists.
- **D6 — Closure surfaces.** `spec/audit/review-register.md` gains a dated evidence-run row only if
  P1 discovers a finding that needs tracking; otherwise the increment records its result in the AAR
  and the item's own roadmap bullet is left for B to retire.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/DECISIONS.md` | (6): one record per executable workflow, in the REQ-211a shape; absence findings for the rest | L |
| `docs/plans/<date>-handoff-evidence/` | plan, tasks, AAR; `presence-matrix.md` with the P1 table | M |
| `CHANGELOG.md` | rendered from the AAR block | S |

Rollback: the evidence blocks are one section and reverse with
`git checkout -- holonovel/DECISIONS.md`; the increment directory is new and untracked.

## Phases

- **P1 — Presence matrix and harness mapping.** Produce `presence-matrix.md`: one row per workflow
  and handoff step with harness command (or none), current record (grep), and expected field source.
  Accept: every row resolved; the grep for `@section evidence` reproduces one line before any edit;
  the Rule 9 "ruleset-free — no source" entry is confirmed present or recorded as a finding.
- **P2 — Execute and record.** Run each mapped workflow, write its block, and re-run `validate`.
  Accept: `npm run validate` exits 0 with `0 error(s)`; every new block carries the six labels, a
  canonical token, an ISO-8601 timestamp, `pass`/`fail`, and at least one sub-check bullet.
- **P3 — Absence findings and close.** Write the finding list for unmapped workflows into the AAR
  (and the register, only if D6 applies); `check:fast` un-piped; `session:close`.

## Verification

| # | Command / check | Expected |
|---|---|---|
| V1 | `grep -n "@section evidence" holonovel/DECISIONS.md` | the G7 record before P2; one block per recorded workflow after |
| V2 | `npm run validate` after P2 | exit 0; `0 error(s)`; the record parser accepts every new block |
| V3 | `npm run validate` with one required label deleted from a new block (probe) | the `T253` failure fires; block restored; `git status --porcelain -- holonovel/DECISIONS.md` empty |
| V4 | presence matrix row count | one row per workflow in `spec/07-independent.md:40-47` and per step H1–H18 |
| V5 | `npm run check:fast` (un-piped, last) | `46 passed, 0 failed` … `check:fast: PASS` |
| V6 | `git status --porcelain` at close | only `holonovel/DECISIONS.md`, the increment directory, `CHANGELOG.md` |

## Done bar

**Done bar:** `presence-matrix.md` resolves every workflow (G0a, G0b, G2–G8) and every handoff step
(H1–H18) to a command or to "none"; every workflow with a command has a REQ-211a-shaped record in
DECISIONS.md (6) and `validate` reports `0 error(s)`; every workflow without one is a named finding
in the AAR; the Rule 9 entry is confirmed or recorded as absent; `check:fast` is green; `aar.md` ends
`LOOP PAUSED`; one commit.

## Out of scope

- The verifier run, the report, and the roadmap retirement (increment B, `item-1b-verifier-run.md`).
- Writing evidence for a workflow no run produced (D1).
- Any code or spec change; any new harness (a missing harness is a finding, and adding one is a
  separate increment).

## Risks

| Risk | Mitigation |
|---|---|
| The matrix finds almost no runnable workflow, so Phase 2 stays thin | That is the finding, stated in the AAR and carried into B; the alternative is fabrication |
| A record's shape fails the parser | `validate` is the acceptance test and the V3 probe proves it fires |
| Standing Rule 9's entry is missing | P1 records it as a finding; the record it enables is written to `fail` with the reason |
| Evidence written from a stale run | Each record carries its own timestamp and pins; a re-run updates the timestamp |

## Dependencies

- Independent of items 2, 4, and 5.
- Increment B (`item-1b-verifier-run.md`) depends on this increment's records.
