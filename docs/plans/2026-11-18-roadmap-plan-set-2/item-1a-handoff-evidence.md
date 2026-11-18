# Plan — ROADMAP item 1, half A: the builder-side handoff evidence

*(A draft for the executing session. Re-home it as `docs/plans/<date>-handoff-evidence/plan.md`,
re-measure every line number, and stamp it — the evidence below is dated 2026-11-18 at HEAD
`e8a87d4`. This is the first of three steps: B is `item-1b-verifier-kit.md` and C is
`item-1c-report-adjudication.md`.)*

**Kind:** planned · **Depth:** standard · **Rollback cost:** 1 ·
**Evidence:** `holonovel/DECISIONS.md` carries exactly one `@section evidence` marker
(`grep -rn "@section evidence" holonovel/DECISIONS.md` → `:2511`); `spec/06-artifacts.md:11-19`
defines the six-section layout; `scripts/lib/req-checks.ts:984-1040` is the record parser;
`npm run check:fast` 46/46 PASS.
**Trust boundary:** every premise is `repo` evidence read from this checkout.

## Questions

Increment A produces what §10 Phase 2 compares against. ROADMAP item 1 (`ROADMAP.md:15-23`) binds
the operator to a verifier run; a comparison needs a builder record, and the tree has one record
(G7's). This increment writes the rest — only where a run produced it.

## Trigger status

- **Item trigger:** "the first publish after 2026-11-16" (`ROADMAP.md:22`). **Not met:** no publish
  has landed — `npm run status` reports 155 unpushed commits and the last pipeline run stopped at
  `record`.
- **Why this half can start without the trigger:** it is preparation, not the verification. §10
  does not require the publish to have happened in order to record builder evidence.
- **Selection:** the maintainer's planning request (this set).

## Why

- **EV1 — §10 Phase 2 is a field-by-field comparison against recorded evidence.**
  `spec/07-independent.md:68-85` compares the verifier's entries with "the recorded ones" per
  workflow and per salient field; step 9 (`:87-98`) classifies each mismatch as Discrepancy, Pin
  drift, or Unclassifiable. With no builder record, every comparison is Unclassifiable and step
  10's score (`:99-103`) collapses.
- **EV2 — the G-workflow set is eight, and it is fixed by the spec, not chosen here.** §9 declares
  nine evidence homes — `grep -o "evidence-g[0-9]*[ab]*" spec/06-artifacts.md` returns
  `g0a, g0b, g2, g3, g4, g5, g6, g8`, and G7's home is the `narrative_coherence` attestation for
  REQ-346. So G0a, G0b, G2, G3, G4, G5, G6, and G8 are the workflows whose records (6) is
  organized around; G1 is reserved by §10's prompt.
- **EV2a — H-step records are admissible and three of them are required.** The parser's workflow
  token admits `H1`-`H18` (`scripts/lib/req-checks.ts:992`), and three handoff steps require an
  entry in (6): H10 records the ruleset-free disposition (`spec/06-artifacts.md:55`), H12 requires
  "command, exit code, G2 pass/fail result, and builder's environment pins" (`:57`), and H13
  presupposes the G5 record (`:58`). The §9 *home* check applies only to G workflows, so an
  H record needs no home — it needs a runnable command. Increment B compares against these, so
  they are in scope here and item 1a says so.
- **EV3 — the tree carries one record.** `holonovel/DECISIONS.md:2511-2522` holds the G7
  `narrative_coherence` attestation (`Workflow`, `Timestamp`, `Environment pins`, `Commands and
  output`, `Pass/fail`, `Findings`, plus three sub-check bullets). No G0a, G0b, G2, G3, G4, G5,
  G6, or G8 record exists, and August's server-change entries carry a `Verification` table row
  rather than an evidence record.
- **EV4 — the record has a live parser, and its shape is not negotiable.**
  `checkEvidenceRecordContract` (`scripts/lib/req-checks.ts:984-1040`) scans lines matching
  `^@section evidence\b`, requires six labelled bullets (`:984-991`), a `Workflow` value matching
  `^(G0a|G0b|G[2-8]|H(?:1[0-8]|[1-9]))\b` (`:992`), an ISO-8601 `Timestamp` (`:993`), a
  `pass`/`fail` value, and at least one sub-check bullet; `scripts/validate.ts:3005` runs it on
  every `validate`, so a record in any other shape reddens the gate.
- **EV5 — the redaction target is the evidence section, and locating it is a discovery step.**
  `spec/06-artifacts.md:11-19` defines DECISIONS.md's six sections by marker, and (6) is
  "verification workflow evidence organized in sub-sections". The shipped `holonovel/DECISIONS.md`
  has no `## (1)`…`## (6)` headings — its sixteen `##` sections are topic-dated — so P1 records the
  exact block set that (6) denotes before any record is written. Writing records into a section
  nobody redacts would leave the verifier's blind phase unblinded.
- **EV6 — the build is ruleset-free, which shrinks some workflows to N/A.** No
  `holonovel/RULESET_MODEL.md` exists; H1 and H10 carry a Standing Rule 9 exemption for
  ruleset-free builds (`spec/06-artifacts.md:46`, `:55`), and G0b/G2 use the Appendix W fixture.
  P1 confirms whether the "ruleset-free — no source" entry that (1) is supposed to carry exists
  today; the draft does not assume it.
- **EV7 — no handoff runner exists for H1-H18.** The harness set (`holonovel/package.json:64-110`)
  has no H-step script and no G0 checklist runner; the nearest artifacts are `run_pattern_buffer`
  (G5), `test-output-contracts`, `check-g7-attestation` (already satisfied), and `test:all`. The
  probe is `grep -in "handoff\|test:h[0-9]\|g0" holonovel/package.json`, which returns no runner.
  So the executable subset is small and the rest is a finding, not a pass.

## Decisions

- **D1 — Record only what a run produced.** For each workflow P1 maps to a command, run it and
  record the result in the REQ-211a shape; for each workflow with no harness, write a finding
  naming the workflow and the missing runner. No inferred, reconstructed, or hand-summarised pass.
  - Rejected: derive G4 from `check:fast` — a gate run is not the per-test table G4 records.
- **D2 — P1 maps before P2 writes.** The mapping table has one row per workflow (G0a, G0b, G2, G3,
  G4, G5, G6, G8) and per handoff step (H1-H18) with: harness command or "none", the evidence
  record present today, and the expected field source. A row whose harness the session cannot find
  is recorded as "none" rather than guessed.
- **D3 — The record shape is the parser's shape.** Each new block is a bare `@section evidence`
  marker followed by the six labelled bullets and a sub-check enumeration (EV4). `npm run validate`
  is the acceptance test: `0 error(s)`, every new block parsed.
- **D4 — Ruleset-free N/A is recorded as N/A, not dressed as evidence.** A workflow with no
  ruleset to exercise records `pass` with an N/A basis only if it can be meaningfully replayed
  against the host with no package; otherwise it records `fail` with the reason, which is the
  honest value a verifier can compare.
- **D5 — The redaction set is recorded before the records are written.** P1 writes the block set
  that (§10's) item (6) denotes into the increment's `presence-matrix.md`, so increment B redacts
  a named set rather than re-deriving one (EV5).
- **D6 — No spec, code, or register change.** The increment edits `holonovel/DECISIONS.md` and its
  own artifacts, and nothing else. No ROADMAP retirement: the item closes after the report exists
  (increments B and C). A finding P1 raises that is not a missing record goes to the AAR; opening a
  `review-register.md` row would put a tracked file in a blast radius this increment does not have.
- **D7 — A record is refreshed by whoever re-runs it, and only a missing record is A's to write.**
  Increment B rebuilds the kit at a later commit, so the workflow it re-executes may drift from the
  commit A recorded. B therefore re-runs each recorded workflow at the kit's commit and rewrites
  that record's `Timestamp`, `Environment pins`, and `Commands and output`; producing a record that
  does not exist stays A's job. Without this rule, Phase 2 compares a verifier run against evidence
  from a different tree and the mismatch is uninterpretable.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/DECISIONS.md` | one record per executable workflow in the REQ-211a shape; absence findings for the rest | L |
| `docs/plans/<date>-handoff-evidence/` | plan, tasks, AAR, `presence-matrix.md` *(new)* with the P1 table and the redaction set | M |
| `CHANGELOG.md` | rendered from the AAR block | S |

Rollback: the new evidence blocks are additions inside one region and reverse with
`git checkout -- holonovel/DECISIONS.md`; the increment directory is new and untracked.

## Phases

- **P1 — Presence matrix, harness mapping, and the redaction set.** Produce `presence-matrix.md`:
  one row per workflow and handoff step with harness command (or none), current record (grep), and
  expected field source; plus the named block set that item (6) denotes. Accept: every row
  resolved; the `@section evidence` grep reproduces one marker before any edit; the one existing
  record's section is named as part of the redaction set; the Rule 9 "ruleset-free — no source"
  entry is confirmed or recorded as absent.
- **P2 — Execute and record.** Run each mapped workflow, write its block, and re-run `validate`.
  Accept: `npm run validate` exits 0 with `0 error(s)`; every new block carries the six labels, a
  canonical token, an ISO-8601 timestamp, `pass`/`fail`, and at least one sub-check bullet.
- **P3 — Absence findings and close.** Write the finding list for unmapped workflows into the AAR;
  `check:fast` un-piped; `session:close`.

## Verification

| # | Command / check | Expected |
|---|---|---|
| V1 | `grep -rn "@section evidence" holonovel/DECISIONS.md` | one marker before P2; one per recorded workflow after |
| V2 | `npm run validate` after P2 | exit 0; `0 error(s)`; the parser accepts every new block |
| V3 | probe: delete one labelled bullet from a new block, re-run `validate`, restore | the `T253 — … missing a non-empty '<label>' field` failure fires; restored; `git status --porcelain -- holonovel/DECISIONS.md` empty |
| V4 | `presence-matrix.md` row count | one row per G workflow (eight), per H step (eighteen), and per record written (at least G-set plus H10/H12/H13 where runnable), plus the named redaction set |
| V5 | `npm run check:fast` (un-piped, last) | `46 passed, 0 failed` … `check:fast: PASS` |
| V6 | `git status --porcelain` at close | only `holonovel/DECISIONS.md`, the increment directory, `CHANGELOG.md` |

## Done bar

**Done bar:** `presence-matrix.md` resolves every G workflow (G0a, G0b, G2-G6, G8) and every
handoff step (H1-H18) to a command or to "none", and names the redaction set for item (6); every
workflow with a runnable command — including H10, H12, and H13 — carries a record;
every workflow with a command has a REQ-211a-shaped record in DECISIONS.md and `validate` reports
`0 error(s)`; every workflow without one is a named finding in the AAR; the Rule 9 entry is
confirmed or recorded as absent; `check:fast` is green; `aar.md` ends `LOOP PAUSED`; one commit.

## Out of scope

- The verifier run, the report, and the roadmap retirement — increments B and C
  (`item-1b-verifier-kit.md`, `item-1c-report-adjudication.md`).
- Writing evidence for a workflow no run produced (D1).
- Any code or spec change, and any new harness — a missing harness is a finding here and a
  separate increment if it is ever built.
- G7's record: it exists and is attested; this increment does not rewrite it.

## Risks

| Risk | Mitigation |
|---|---|
| The matrix finds almost no runnable workflow, so Phase 2 stays thin | That is the finding, stated in the AAR and carried into B; the alternative is fabrication |
| A record's shape fails the parser | `validate` is the acceptance test and the V3 probe proves it fires |
| Standing Rule 9's entry is missing from (1) | P1 records it as a finding; the workflow it enables is recorded with the honest value |
| The redaction set is misidentified, blinding nothing | P1 names the set from §9's section contract (EV5) and B redacts exactly that set |
| Evidence written from a stale run | Each record carries its own timestamp and pins; a re-run updates the timestamp |

## Dependencies

- Independent of items 2, 4, and 5.
- Increment B (`item-1b-verifier-kit.md`) depends on this increment's records and on the redaction
  set named here; increment C (`item-1c-report-adjudication.md`) depends on B's kit and commitment.
