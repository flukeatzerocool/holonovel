# Plan — ROADMAP item 1, half A: the builder-side handoff evidence

**Date:** 2026-11-18 · **Kind:** planned · **Depth:** standard · **Revision:** 1 ·
**Increment:** `docs/plans/2026-11-18-handoff-evidence` · **Rollback cost:** 1
(0 pure add, 1 reversible edit, 2 destructive) — one appended region in a tracked
file plus new untracked documents.
**Supersedes:** `docs/plans/2026-11-18-roadmap-plan-set-2/item-1a-handoff-evidence.md`
(draft, evidence dated HEAD `e8a87d4`). This plan re-measures every claim at HEAD
`a687660`; the draft's line numbers no longer resolve.
**Evidence:** git HEAD `a687660`, tracked tree clean at plan time. Readings taken
in this session: `grep -rn "@section evidence" holonovel/DECISIONS.md` →
`2612:@section evidence`; `grep -c "@section " holonovel/DECISIONS.md` → `1`;
`grep -c "^## " holonovel/DECISIONS.md` → `18`; `wc -l holonovel/DECISIONS.md` →
`3386`; `ls holonovel/RULESET_MODEL.md` → absent; `npm run check:fast` → exit 0,
`46 passed, 0 failed`, trailing `check:fast: PASS`; `npm run gates -- --list |
grep -c "(fast"` → `46`; `npm run status` → 160 unpushed commits, last pipeline
run stopped at `record`, 3 open roadmap items, version `2026.11.18`; `git ls-files
--error-unmatch holonovel/DECISIONS.md` → tracked; `git check-ignore
docs/plans/2026-11-18-handoff-evidence/plan.md` → exit 1 (not ignored).
**REQs:** REQ-211a, REQ-211c (evidence record contract), REQ-346 (G7
attestation), REQ-013 (waivers), REQ-273/REQ-274/REQ-275 (§10 comparison and
score).
**Trust boundary:** every premise below is `repo` evidence read from this
checkout. No web or user-supplied content is embedded.
**Review history.** Revision 1 was read by one cold pass (`independent-review`,
29 reads of the 40-read standard budget). Verdict: `plan-review FAILED.` with
two Blockers and three Majors. Revision 2 fixes them: the close names
`--increment` because seven increments share the session date; the AAR must
carry a `## Changelog entry` block because `session:close` only re-renders that
input; H14 leaves the multi-package group (the four-artifact diet is not
multi-package-only); every H row states an explicit `pass`/`fail` value; P1's
"no file edited" accept is scoped to tracked files; and the two conditions are
recorded (the §9 comment-form deviation is an AAR finding, and redaction range B
ends at a sentinel). Revision 2 also corrects two exactness nits (the parser's
closing line and step 10's end line). The diff re-review returned
`plan-review passed.` with no new Blocker or Major. Two further non-blocking
corrections (V7's before-state and the block's exact heading/title constraints)
were applied as condition-only amendments after that pass; they change no
finding. The stamped bytes therefore differ from the bytes the diff re-review
read only by those two amendments and this paragraph.

## Questions

The request: draft the plan for ROADMAP item 1 half A — the builder-side handoff
evidence — as its own increment, and run plan review until it passes. This
document is that increment's plan, drafted and reviewed in a planning session;
the executing session performs P1-P3 and writes the records.

ROADMAP item 1 (`ROADMAP.md:15-23`) binds an operator to an independent §10
verification. §10 Phase 2 compares the verifier's entries against the builder's
recorded entries; with no builder record, every comparison is Unclassifiable.
Half A writes the records the comparison needs. Half B assembles and dispatches
the verifier kit, and half C receives the report and closes the item.

## Trigger status

- **Item trigger:** "the first publish after 2026-11-16" (`ROADMAP.md:22`).
  **Not met:** `npm run status` reports 160 unpushed commits and the last
  pipeline run stopped at `record`.
- **Why this half can start without the trigger:** it is preparation, not the
  verification. §10 does not require a publish before builder evidence is
  recorded.
- **Selection:** the maintainer's planning request for this increment.

## Why

- **E1 — §10 Phase 2 is a field-by-field comparison against recorded evidence.**
  `spec/07-independent.md:68-85` compares the verifier's entries with "the
  recorded ones" per workflow and per salient field; step 9 (`:87-98`) classifies
  each mismatch as Discrepancy, Pin drift, or Unclassifiable, and step 10
  (`:99-103`) computes the REQ-274 score. With no builder record, every
  comparison is Unclassifiable and the score collapses.
- **E2 — the workflow set is fixed by the spec.** §8's table
  (`spec/05-verification.md:12-23`) declares G0a, G0b, and G2-G8; G1 is reserved
  (`:26-27`). §9 declares the evidence homes
  (`spec/06-artifacts.md:11-26`): `evidence-g0a`, `evidence-g0b`, `evidence-g2`,
  `evidence-g3`, `evidence-g4`, `evidence-g5`, `evidence-g6`, `evidence-g8`,
  with G7 recorded as its own `narrative_coherence` attestation per REQ-346. The
  handoff workflow adds H1-H18 (`:46-63`) and binds the builder: "Every step must
  have a recorded result in DECISIONS.md" (`:41`).
- **E3 — the record has a live parser, and its shape is not negotiable.**
  `checkEvidenceRecordContract` (`scripts/lib/req-checks.ts:995-1044`) scans
  lines matching `^@section evidence\b`, takes the contiguous `- ` bullet run
  after each marker, and requires six exact bold labels — `Workflow`,
  `Timestamp`, `Environment pins`, `Commands and output`, `Pass/fail`,
  `Findings` (`:984-991`) — a workflow value matching
  `^(G0a|G0b|G[2-8]|H(?:1[0-8]|[1-9]))\b` (`:992`), an ISO-8601 `Timestamp`
  (`:993`), a `pass`/`fail` value, and at least one `**(a) …** — …` sub-check
  bullet; the function closes at `:1044`. `scripts/validate.ts:3005` runs it on
  every `validate`, so a record in
  any other shape reddens the gate. The regex matches `@section evidence-g2`
  too, so the §9 home marker itself can carry the record — but only as a bare
  line, not inside the HTML comment form §9 uses for placement.
- **E4 — the tree carries one record.** `holonovel/DECISIONS.md:2612` is the only
  `@section evidence` marker in the file (`grep -c "@section "` → 1). It is the
  G7 `narrative_coherence` attestation: heading `:2610`, marker `:2612`, six
  labelled bullets `:2614-2623`, generated disposition table `:2625-2712`, next
  heading `:2714`.
  No G0a, G0b, G2-G6, or G8 record exists, and no H-step record exists.
- **E5 — the shipped DECISIONS.md does not carry the §9 section markers, so
  five of six sections cannot be located by marker.** §9 defines (1) intake,
  (2) versions, (3) traceability, (4) normalizations, (5) waivers, and (6)
  evidence by `@section` marker (`spec/06-artifacts.md:11-26`), with separate
  `@section audit` and `@section task-list` markers. The file carries only the
  (6) evidence marker; `@section intake`, `versions`, `traceability`,
  `normalizations`, `waivers`, `audit`, and `task-list` are absent. Its eighteen
  `##` headings are
  topic-dated, not numbered, and `grep -c "^| REQ-"` finds no one-row-per-REQ
  Appendix E table (the 108 `| REQ-` rows include the G7 disposition table and
  dispositions elsewhere). P1 confirms by content grep before treating the
  sections as absent. Consequently H1 (intake answers), H2 (traceability table),
  and H6 (waiver cross-reference) have no declared section to read in this
  checkout; that is a reportable finding, not a record this increment may
  invent.
- **E6 — the build is ruleset-free, and the entry H1 needs is absent.** No
  `holonovel/RULESET_MODEL.md` exists. Standing Rule 9 gives ruleset-free
  exemptions at `spec/06-artifacts.md:46` (H1: pass with the recorded
  "ruleset-free — no source" entry in (1)) and `:55` (H10: skip the confidence
  check, recorded as "ruleset-free" in (6)). The H1 entry is absent from
  `holonovel/DECISIONS.md` (`grep "ruleset-free — no source"` returns nothing),
  and there is no (1) marker to hold it (E5).
- **E7 — the G7 attestation is a byte-compared generated block; new records must
  not enter it.** `attestationBlock` (`holonovel/scripts/generate-g7-attestation.ts:123-129`)
  extracts from the `#### narrative_coherence (G7)` heading to the next `###` or
  `####` heading and folds that authored text into `SOURCE_HASH` (`:160-162`).
  `check-g7-attestation` compares the committed module against a fresh render, so
  inserting records anywhere inside `:2610-2713` changes the hash and reddens the
  gate. The append point must be outside that extent.
- **E8 — the harness inventory is partial and must be mapped, not assumed.**
  `holonovel/package.json:58-121` has no G0 checklist runner and no H-step
  runner (`grep -in "handoff\|test:h[0-9]\|g0" holonovel/package.json` returns
  nothing), but candidate harnesses cover several G workflows: G4 via
  `test:all`/`run-test-suite.ts`, G5 via `test:pattern-buffer`, G3 via
  `test-security.ts` (REQ-444 import-channel inertness), G6 via
  `test-supplementary.ts` (synthesis import), G8 via `test-ruleset-gates.ts` and
  `test-ruleset-nonovel.ts` (T651/T652), and G0b only partially via
  `smoke-package.ts` (MCP handshake, not the Appendix D checklist). G2's
  ruleset-free replay is T261, a manual Appendix W.3 transcript; the
  `test-backfill.ts` cases tagged T261 exercise parser commands but do not replay
  the transcript. H10 can draw on `spec/audit/performance-record.json` and
  `check-performance-record.ts` (REQ-586/T686); H13 can draw on the manifest
  `run_pattern_buffer.ts` writes to `<DATA_DIR>/pattern-buffer-manifest.json`
  (`:758-779`). P1 resolves each row; this plan promises no record count.
- **E9 — the baseline is green.** `npm run check:fast` exits 0 with
  `46 passed, 0 failed` and the trailing `check:fast: PASS`; `validate` runs
  inside it and reports `0 error(s)`.

## Decisions

- **D1 — Record only what a run produced, and only when the harness exercises
  the workflow's §8 pass criterion.** A gate run is not evidence for a different
  workflow: `test:all` can evidence G4's per-test pass/fail, but it cannot
  evidence G2's transcript replay. A workflow whose harness is absent or partial
  is a finding; no inferred, reconstructed, or hand-summarised pass.
- **D2 — P1 maps before P2 writes.** The matrix has one row per G workflow (G0a,
  G0b, G2-G8) and per H step (H1-H18), each naming: the candidate harness command
  or "none", the exact §8/§9 pass criterion it covers, the record present today,
  and the expected field source. A row whose harness does not cover the
  criterion is "none", not the nearest gate. A row whose procedure consumes
  another workflow's result names the prerequisite: H12 needs G2's pass/fail
  result, and H13 presupposes the G5 record, so an unrecorded prerequisite makes
  the dependent row "none — prerequisite G2/G5 unrecorded".
- **D3 — The record shape is the parser's shape.** Each G record is a bare
  `@section evidence-g<n>` line (never the HTML-comment form) followed by the six
  exact bold labels and at least one `**(a) …** — …` sub-check bullet. Each H
  record uses a bare `@section evidence` marker, since §9 declares no H home.
  `npm run validate` is the acceptance test; the V3 probe proves the parser
  fires. The bare form is a deviation from §9's `<!-- @section evidence-gN -->`
  comment form (the parser requires the trimmed line to start with
  `@section evidence`, so the comment form would not parse); the AAR records
  that deviation as a finding and increment B carries it into the comparison
  scope.
- **D4 — New records append in one new section at end of file, outside the G7
  block.** P2 appends `## Verification workflow evidence` after the last line of
  `holonovel/DECISIONS.md` (currently `:3386`) and writes the blocks under it.
  This keeps the G7 attestation's authored extent (`:2610-2713`, E7) byte-
  identical. Rejected: inserting beside the G7 record (breaks `SOURCE_HASH`) and
  scattering blocks per topic section (unredactable).
- **D5 — N/A is recorded honestly.** A ruleset-free exemption uses the spec's own
  wording — G0a records `pass` with "no ruleset — skipped"
  (`spec/05-verification.md:29-34`). A workflow that cannot be meaningfully
  replayed records `fail` with the reason; neither value is dressed as a run that
  did not happen. H10 records the skipped confidence check
  (`spec/06-artifacts.md:55`) as its finding and `pass` only if the remaining H10
  checks pass. H14 is the four-artifact diet, not a multi-package check: with no
  `RULESET_MODEL.md` it records `fail` naming the missing artifact. H15-H18 are
  the multi-package group; this single-package build records each as `fail` with
  the build-mode reason, never as a fabricated multi-package pass.
- **D6 — The redaction set is named before any record is written.** P1 writes
  the set into `presence-matrix.md`: range A is the G7 attestation block
  (`:2610-2713` at plan time), range B is the new evidence section from its
  `## Verification workflow evidence` heading through the `<!-- evidence:end -->`
  sentinel P2 writes as its last line. Increment B redacts exactly those ranges
  on the operator's copy; a record written outside them would leave the
  verifier's blind phase partially unblinded, and the sentinel stops a later
  append from silently widening range B.
- **D7 — The missing §9 sections are findings, not repairs.** This increment does
  not invent intake answers, a versions table, a traceability table, waiver
  entries, or empty `@section` markers. Fabricating (3) would also collide with
  H2's "every REQ in Appendix E appears exactly once" criterion. P1 records the
  marker inventory and P3 records the H1/H2/H6 consequences.
- **D8 — No spec, code, or register change; one commit.** Nothing in `spec/`,
  `holonovel/src`, `holonovel/scripts`, or a register is edited, so no
  fingerprint, coverage-register, G7 regeneration, or phase-map step runs. The
  increment edits `holonovel/DECISIONS.md`, its own directory, and the CHANGELOG
  entry whose `## Changelog entry` block the AAR carries. No gate is added, so
  existing-check discovery is not applicable. ROADMAP is not retired:
  item 1 closes only after the report exists (increment C).
- **D9 — A record is refreshed by whoever re-runs it.** Increment B rebuilds the
  kit at a later commit, so it re-runs each recorded workflow at the kit's commit
  and rewrites that record's `Timestamp`, `Environment pins`, and `Commands and
  output`. Creating a missing record stays A's job.
- **D10 — Findings get terminal dispositions in the AAR.** A workflow left
  unrecorded is a named finding with either a record-and-close note (no runnable
  harness; the reason stated) or a carry-forward note for B's comparison scope.
  It is not opened as a new roadmap item: item 1 already owns the follow-through,
  and a missing harness is not evidence of a project defect.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/DECISIONS.md` | one appended `## Verification workflow evidence` section holding the records the runs produce | L |
| `docs/plans/2026-11-18-handoff-evidence/plan.md` | this plan | M |
| `docs/plans/2026-11-18-handoff-evidence/tasks.md` | P1-P3 checklist | S |
| `docs/plans/2026-11-18-handoff-evidence/presence-matrix.md` | *(new)* the P1 table and the named redaction ranges | M |
| `docs/plans/2026-11-18-handoff-evidence/aar.md` | written at close | S |
| `CHANGELOG.md` | rendered from the AAR `## Changelog entry` block by `session:close` | S |

Rollback: before the close commit, `git checkout -- holonovel/DECISIONS.md`
removes the appended section and `rm -rf docs/plans/2026-11-18-handoff-evidence`
removes the increment directory. After the commit, `git revert <sha>`. No other
tracked file is touched apart from the CHANGELOG entry the close renders.

## Phases

- **P1 — Presence matrix, harness mapping, and redaction set.** Produce
  `presence-matrix.md` with one row per G workflow (8) and H step (18): candidate
  command or "none", the pass criterion it covers, the record present today
  (`grep`), and the field source. Also record the §9 marker inventory
  (`grep "@section " holonovel/DECISIONS.md` → one), the absent (1)-(5) markers,
  the absent "ruleset-free — no source" entry, and the two redaction ranges.
  Accept: every row resolved to a command or "none" with a stated reason; the
  marker and ruleset-free greps reproduce the E4/E6 values; only
  `presence-matrix.md` is written and no tracked file is edited
  (`holonovel/DECISIONS.md` stays untouched).
- **P2 — Execute and record.** Run each mapped harness; append one block per
  workflow whose output exercises the §8 pass criterion, under the new section
  at EOF (D4). Accept: `npm run validate` exits 0 with `0 error(s)`; every new
  block carries the six labels, a canonical token, an ISO-8601 timestamp,
  `pass`/`fail`, and at least one sub-check bullet; the section's last line is
  the `<!-- evidence:end -->` sentinel; `git diff -U0 holonovel/DECISIONS.md`
  shows only additions after the pre-edit EOF and no change inside `:2610-2713`.
- **P3 — Absence findings, Changelog block, and close.** Write the finding list
  for every workflow P1 could not record, with its reason and D10 disposition,
  into the AAR, including the §9 comment-form deviation and the missing (1)-(5)
  markers. Write the AAR's `## Changelog entry` block — heading exactly
  `## Changelog entry`, `**Title:**` ≤ 100 characters and not beginning with a
  date prefix, `**Summary:**`, 1-8 `- ` bullets; `session:close` renders it and
  does not author it. Run `npm run check:fast` un-piped, then `npm run
  session:close -- --increment 2026-11-18-handoff-evidence` (add `--date
  2026-11-18` if the close runs on a later day). Accept: AAR ends `LOOP PAUSED`
  and carries the block; one commit; the verification table below passes.

## Verification

| # | Command / check | Expected |
|---|---|---|
| V1 | `grep -c "^@section evidence" holonovel/DECISIONS.md` before P2 / after P2 | `1` before; `1 + <records written>` after, each marker followed by a parsed block |
| V2 | `npm run validate` after P2 | exit 0; `0 error(s)`; the parser accepts every new block |
| V3 | probe: delete one labelled bullet from a new block, re-run `npm run validate`, restore the bullet | the `T253 — evidence record at line N is missing a non-empty '<label>' field` failure fires; after restore `validate` is green and `git diff` shows no residue |
| V4 | `grep -c '^[|] G' presence-matrix.md`; `grep -c '^[|] H' presence-matrix.md`; row audit | 8 G rows, 18 H rows, plus the redaction ranges and the marker inventory |
| V5 | `git diff -U0 holonovel/DECISIONS.md` | additions only, all after the pre-edit last line; no hunk touching `:2610-2713`; G7 byte-identical |
| V6 | `npm run check:fast` (un-piped, last) | `46 passed, 0 failed` … `check:fast: PASS` |
| V7 | `git status --porcelain` before `session:close`; again after it | before: `holonovel/DECISIONS.md` plus the untracked increment directory (`CHANGELOG.md` is written by the close); after: empty |
| V8 | `npm run session:close -- --increment 2026-11-18-handoff-evidence` | one commit; subject is the AAR block's title; no sibling increment is validated or closed |

## Done bar

**Done bar:** `presence-matrix.md` resolves every G workflow (G0a, G0b, G2-G8)
and every H step (H1-H18) to a harness command or to "none" with the pass
criterion it does or does not cover, and names the two redaction ranges; every
workflow whose harness exercises its §8 pass criterion has a record in the
REQ-211a field shape that satisfies REQ-211c/T253, in the appended section; every
other workflow is a named AAR finding with a D10 disposition; the absent (1)-(5)
section markers, the absent "ruleset-free — no source" entry, and the bare-marker
deviation from §9's comment form are recorded; the G7 block is byte-identical;
`npm run validate` reports `0 error(s)`; `check:fast` is green (46/46); `aar.md`
carries the `## Changelog entry` block and ends `LOOP PAUSED`; the scoped
`session:close` makes one commit.

## Out of scope

- The verifier kit, dispatch, report, adjudication, and roadmap retirement —
  increments B and C.
- Writing intake, versions, traceability, normalizations, or waiver content for
  §9 sections (1)-(5) (D7).
- Writing a record for a workflow no run produced (D1).
- Any code or spec change, and any new harness: a missing harness is a finding
  here and a separate increment if one is ever built.
- G7's record: it exists and is attested; this increment does not rewrite it.

## Risks

| Risk | Mitigation |
|---|---|
| The matrix finds few runnable workflows, so P2 stays thin | That is the finding, stated in the AAR and carried into B; the alternative is fabrication |
| A new record's shape fails the parser | `validate` is the acceptance test and the V3 probe proves it fires |
| A record is inserted inside the G7 attestation extent, breaking `check-g7-attestation` | D4 appends at EOF; V5 asserts no hunk touches `:2610-2713` |
| The redaction set omits a record or includes non-evidence | P1 names the ranges from the section contract; B redacts exactly them |
| Evidence written from a stale run | Each record carries its own timestamp and pins; D9 makes the re-run the rewriter |
| A missing §9 section is mistaken for a record defect | E5/D7 name the inventory; the AAR records it as a finding, not an invented section |
| A dependent record is written against an unrecorded prerequisite | D2 marks the row "none — prerequisite G2/G5 unrecorded" instead of writing a partial H12/H13 |

## Dependencies

- Independent of roadmap items 2 and 3 (`Deterministic lens breadth`, `Split
  index.ts`).
- Increment B depends on this increment's records and on the redaction set named
  in `presence-matrix.md`; increment C depends on B's kit and commitment.

## Open questions

- None blocking. P1 resolves how many of the eight G workflows and eighteen H
  steps have a harness whose output actually exercises the §8 pass criterion; the
  plan promises a mapping and an honest finding, not a record count.
