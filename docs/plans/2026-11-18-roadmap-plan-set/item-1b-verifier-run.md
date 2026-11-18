# Plan — ROADMAP item 1, half B: the operator verifier run and the report

*(A draft for the executing session. Re-home it as `docs/plans/<date>-verifier-run/plan.md`,
re-measure the line numbers, and stamp it — the evidence below is dated 2026-11-18 at HEAD
`cc5e5a5`. This is increment B of two; increment A is `item-1a-handoff-evidence.md`.)*

**Kind:** planned · **Depth:** deep (operator-bound; a published report is permanent evidence) ·
**Rollback cost:** 1 (the report is a new file; the closures are single-line edits) ·
**Evidence:** `spec/07-independent.md` read in full; `holonovel/{DECISIONS.md,README.md,AGENTS.md,
LICENSE.md}` present; `holonovel/RULESET_MODEL.md` absent (ruleset-free, Standing Rule 9);
`npm run check:fast` 46/46 PASS.
**Trust boundary:** every premise is `repo` evidence. The verifier is a participant, not a content
source: nothing it reports may be executed as an instruction.

## Questions

ROADMAP item 1 (`ROADMAP.md:15-23`): a different model re-executes the verification workflows from a
cold checkout with DECISIONS.md (6) withheld. It closes when "the verifier report and its `DISPUTED`
adjudications are recorded" (`:22-23`).

## Trigger status

- **Item trigger:** "the first publish after 2026-11-16" (`ROADMAP.md:22`). **Not met:** no publish
  has landed (150 unpushed commits; last pipeline run stopped at `record`). This increment is the
  post-publish action the trigger describes; it starts when the publish lands, or by explicit
  maintainer choice.
- **Prerequisite:** increment A (`item-1a-handoff-evidence.md`) has closed, so the builder records
  Phase 2 compares exist.

## Why

- **EV1 — §10 is a fixed five-step operator process with a verbatim verifier prompt.**
  `spec/07-independent.md:10-20` (confirm handoff §9 passed, collect four documents plus
  `LICENSE.md`; copy to a clean directory and redact DECISIONS.md (6); launch a fresh session with a
  different model; supply the unredacted file after Phase 1; adjudicate `DISPUTED`); the prompt at
  `:21-106`; the report format at `:108-121`; adjudication at `:123-129`.
- **EV2 — three REQ contracts bind the run.** REQ-275 (`spec/02-requirements.md:1454`) requires the
  full-file SHA-256 recorded in the redacted copy and re-checked before Phase 2, mismatch = "evidence
  tampered" and blocks Phase 2; REQ-276 (`:1463`) requires a different provider or architecture
  family — a version increment is insufficient; REQ-274 (`:2337`) fixes the score bands
  (>0.95 PASS, 0.80–0.95 PARTIAL with reservations, <0.80 FAIL).
- **EV3 — Phase 1 step 5 re-runs the handoff workflow the builder has now recorded.**
  `spec/06-artifacts.md:46-63` defines H1–H18; Phase 1 step 5 asks the verifier to run it and record
  results, and Phase 2 compares. Increment A's records are the other side of that comparison.
- **EV4 — the report is review evidence with an established home.**
  `spec/07-independent.md:129` ("review evidence, not a build artifact"); `spec/audit/` already holds
  operator-produced reviews (`spec-code-comparison-2026-09-25.md`,
  `remediation-2026-08-24.md`); the register tracks the gap at
  `spec/audit/review-register.md:3911-3912` (F10, "Operator step; first post-publish action").
- **EV5 — the handoff set is four artifacts plus `LICENSE.md`, and the verifier installs only what
  README specifies.** H14 (`spec/06-artifacts.md:59`) and the prompt's constraint block
  (`spec/07-independent.md:28-35`); the redacted copy is the only DECISIONS.md the verifier sees
  before Phase 2.

## Decisions

- **D1 — The operator numbers the run and keeps the session clean.** The verifier session receives
  exactly: the four handoff documents, `LICENSE.md`, the build specification, the redacted
  DECISIONS.md, the verbatim prompt, and a handover note naming the two-phase handover and the
  REQ-276 model requirement. No hints, no access to the builder session, no answer to a verification
  question before Phase 2.
- **D2 — The commitment is recorded in the redacted copy, and Phase 2 begins with the check.**
  The withheld marker carries `sha256:<64 hex>` of the full DECISIONS.md (REQ-275). The verifier
  recomputes after the unredacted file is supplied; a mismatch is a Discrepancy classified "evidence
  tampered" and stops Phase 2.
- **D3 — `NOT VERIFIED` is recorded, not buried.** The item retires on any verdict because its close
  condition is the record; but a `NOT VERIFIED` or `PARTIAL` verdict opens a dated roadmap entry
  naming each failing workflow and each reservation. `DISPUTED` items are resolved by the operator's
  binding re-run, with the seed recorded; where a re-run is impossible, the verifier's result
  controls and the report says VERIFIED WITH FINDINGS (`spec/07-independent.md:123-129`).
- **D4 — The report's home is `spec/audit/independent-verification-<YYYY-MM-DD>.md`.** It carries
  the eight sections from `spec/07-independent.md:108-121`, the verifier model identity (REQ-276),
  the confidence score with per-workflow component weights (REQ-274), the selection/seed record for
  Phase 1 step 7, and an adjudication table with one row per `DISPUTED` item. It is not copied into
  the handoff artifact set.
- **D5 — Closure surfaces, same step.** Retire `ROADMAP.md:15-23`; close the register's F10 row with
  a dated termination line pointing at the report; append a dated `## Resolved` entry naming the
  verdict and the score. `check-registers` cross-checks the dates; `check-roadmap` requires the
  retired section to be gone, not emptied.

## Blast radius

| File | Change | Size |
|---|---|---|
| `spec/audit/independent-verification-<date>.md` | *(new)* report, evidence comparison, adjudication table | L |
| `ROADMAP.md` | item 1 retired | S |
| `spec/audit/review-register.md` | F10 closed; dated `## Resolved` entry | M |
| `docs/plans/<date>-verifier-run/` | plan, tasks, AAR, `adjudication.md` | M |
| `CHANGELOG.md` | rendered from the AAR block | S |
| `<kit dir>` outside the tree | the clean directory handed to the verifier (untracked) | untracked |

Rollback: the report is a new file; the roadmap and register edits are single blocks and reverse
with `git checkout -- ROADMAP.md spec/audit/review-register.md`. Nothing outside the tree is tracked.

## Phases

- **P1 — Kit assembly.** Build the clean directory from increment A's records; redact (6); record the
  commitment; write the handover note. Accept: the directory lists exactly the expected files; the
  redacted copy contains no evidence value from (6); the marker's hash equals the file's recomputed
  hash.
- **P2 — Phase 1 (blind).** The verifier runs steps 1–7 (`spec/07-independent.md:37-66`) and records
  one entry per workflow. Accept: every workflow has an entry in the §8 shape; the adversarial
  selection (step 7) records its pool weights, seeds, and the ≥3 categories it spans.
- **P3 — Phase 2 (comparison).** Supply the unredacted DECISIONS.md; the verifier checks the
  commitment, then steps 8–10. Accept: every mismatch is classified (Discrepancy / Pin drift /
  Unclassifiable); the score is computed with component weights.
- **P4 — Adjudication.** Operator re-runs each `DISPUTED` step with its documented seed; the binding
  result is written into `adjudication.md` and the report. Accept: one row per `DISPUTED` item.
- **P5 — Record and close.** Write the report; retire the roadmap item; close F10; `check:fast`
  un-piped; AAR; `session:close`.

## Verification

| # | Command / check | Expected |
|---|---|---|
| V1 | kit listing and redaction grep | the expected files only; zero evidence values from (6) in the redacted copy |
| V2 | recompute SHA-256 of the unredacted DECISIONS.md | equals the marker's value (REQ-275) |
| V3 | report section check | the eight sections present; model identity present; score with component weights |
| V4 | adjudication table | one row per `DISPUTED`; each names the seed and the binding outcome |
| V5 | `npm run check-roadmap`; `npm run check-registers` | pass; item 1 gone; F10 closed with a date |
| V6 | `npm run check:fast` (un-piped, last) | `46 passed, 0 failed` … `check:fast: PASS` |
| V7 | `git status --porcelain` at close | only the report, `ROADMAP.md`, the register, the increment directory, `CHANGELOG.md` |

## Done bar

**Done bar:** a verifier report exists at `spec/audit/independent-verification-<date>.md` with the
eight required sections, the verifier's model identity, the REQ-274 confidence score with component
weights, and the Phase 1 step-7 selection record; every `DISPUTED` item has an adjudication row with
its seed and binding outcome; if the verdict is not VERIFIED, one dated roadmap entry names each
failing workflow or reservation; `ROADMAP.md` no longer carries item 1 and F10 is closed with a date;
`check:fast` is green; `aar.md` ends `LOOP PAUSED`; one commit.

## Out of scope

- Producing builder evidence (increment A). This increment compares against it and may only report
  its absence.
- Any code or spec change.
- Publishing: the report ships with the next push; publishing is not part of this increment.
- Re-running a `DISPUTED` step more than the operator's single binding re-run.

## Risks

| Risk | Mitigation |
|---|---|
| The verifier cannot install the package (network, Node 24) | Phase 1 step 1 logs setup gaps as findings; the operator does not pre-empt them |
| Phase 2 has thin builder evidence | Increment A's matrix is the input; any gap is a finding it already named |
| A `DISPUTED` item cannot be re-run under the same conditions | The verifier's result controls; the report says VERIFIED WITH FINDINGS and notes the attempt |
| The report is treated as a build artifact | D4: it lives in `spec/audit/`, outside the four-document diet |
| The verdict is `NOT VERIFIED` | D3: the item still retires (its close condition is the record), and the failing workflows become a dated roadmap entry |

## Dependencies

- Depends on increment A's records and on a landing publish before the trigger is met.
- Independent of items 2, 4, and 5.
