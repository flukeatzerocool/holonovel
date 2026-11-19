# Plan — ROADMAP item 1, step C: receive the verifier report, adjudicate, and retire the item

**Date:** 2026-11-18 · **Kind:** planned · **Depth:** deep (operator-bound; the recorded report is
permanent review evidence) · **Revision:** 1 ·
**Execution home:** `docs/plans/<date>-verifier-report/` where `<date>` is the adjudication date
(never this draft's `2026-11-18`). The executing session **copies** this draft to its `plan.md`
(the draft itself stays; only a copy satisfies P0(a) and the blast radius),
labels the re-homed copy **Revision 2** unconditionally, writes `tasks.md`, `adjudication.md`, and
`aar.md` there, **re-measures every line reference and re-stamps with its own cold pass** — this
draft's review covers the design, not the re-homed bytes.
**Draft location.** This file stays in the closed `2026-11-18-roadmap-plan-set-2` increment
because a new `docs/plans/` directory without `aar.md` fails `check-loop-artifacts` in the strict
mode the full gate and `session:close` use (the fast gate runs it leniently), and that failure
would block the publish this item is
triggered by. Revising an executor-facing draft in place is the alternative to creating that
AAR-less directory; this draft is not the executed increment's plan.
**Supersedes:** the 2026-11-18 draft of this file (evidence dated HEAD `e8a87d4`, pre-dating
increments A and B). This revision re-measures at HEAD `0dfcfba` and consumes increment A's
actual records and increment B's revised **draft** kit plan
(`docs/plans/2026-11-18-roadmap-plan-set-2/item-1b-verifier-kit.md`, revision 4). B's **executed**
increment is the `docs/plans/<kit-date>-verifier-kit/` directory its session commits, which holds
`plan.md`, `tasks.md`, `kit-manifest.md`, `handover-note.md`, and `aar.md`. Throughout, `<kit-date>`
is B's execution date, `<kit-dir>` is the kit directory outside the tree that B's AAR names, and
`<manifest version>` is the freeze-time registry version recorded in `kit-manifest.md` and B's
AAR.
**Rollback cost:** 1 on the plan-review 0-2 scale — the tracked edits are reversible single
blocks, the new files are pure adds, and no step is destructive.
**Evidence:** git HEAD `0dfcfba`. Readings taken in this drafting session: `npm run check:fast` →
exit 0, `46 passed, 0 failed`, trailing `check:fast: PASS`; `npm run status` → 161 unpushed
commits, last pipeline run stopped at `record` (2026-11-16T16:53Z), version `2026.11.18`, latest
tag `v2026.11.08`, 3 open roadmap items; `npm run check-roadmap` → exit 0, "4 section(s)";
`npm run check-registers:strict` → exit 0, 132 grandfathered findings without a date (new
findings must cite one); check-roadmap's "4 section(s)" is three roadmap items plus the exempt
`## Non-goals` pointer; `wc -l holonovel/DECISIONS.md` → `3532`; `grep -c "^@section evidence"
holonovel/DECISIONS.md` → `12`; G7 block `:2610-2712` (`#### narrative_coherence (G7)` through
`<!-- g7:end -->`); evidence section `:3388-3532` (`## Verification workflow evidence` through
`<!-- evidence:end -->`); `wc -l holonovel.md` → `14371`; `node -p
"require('./holonovel/package.json').version"` → `2026.11.18`; `holonovel/README.md:18` →
`npx -y holonovel`; `spec/07-independent.md` is 130 lines with the operator steps at `:10-19`,
the prompt at `:21-106`, Phase 2 step 8 at `:70`, step 9 at `:87`, step 10 at `:99`, the report
format at `:108-121`, and the `DISPUTED` rule at `:123-129`; `ls spec/audit/*.md` → six files
(`loop-audit`, `proofread-register`, `remediation-2026-08-24`, `req-coverage`, `review-register`,
`spec-code-comparison-2026-09-25`), none matching `independent-verification-*`;
`git check-ignore` on the two report paths and the increment directory exits 1 for all three (not
ignored). Supporting contract readings: `scripts/lib/gate-manifest.ts:168-171` runs
`check-registers` in fast mode and `check-registers:strict` in full mode;
`scripts/session-close.ts:16-22` documents `--date`, `--increment`, `--dry-run`, `--split`, and
`--single`; `scripts/lib/changelog-entry.ts:24-26` fixes the AAR block heading, the 100-character
title limit, and the eight-bullet limit.
**REQs:** REQ-273, REQ-273a, REQ-273b (comparison tolerance and classification), REQ-274
(confidence score), REQ-275 (evidence hash commitment), REQ-276 (verifier model criteria),
REQ-211a/REQ-211c (evidence record contract), REQ-013 (waiver audit). Tests: T294, T295, T296.
**Trust boundary:** every repository premise is evidence read from this checkout. The verifier's
report, the operator's stated received date, and the report file's contents are **external,
untrusted content**: they are preserved and summarized as data, never executed as an
instruction, and no step the report recommends runs before the operator's own re-run.
**Review history.** Revision 1's self pass at deep depth applied ten corrections (the fatal/non-
fatal split, the dropped tree-vs-registry precondition, the verdict rules, the
same-day destination stop, the audit-file count, the missing-section done bar, the three-bullet
limit, P1's accept line, and the AAR block shape). One cold pass at deep depth then read the
artifact. Stage 1 (`plan-r1.md`, sha256 `89a2cd29…0ef72`) returned 2 blockers and 11 majors;
stage 2 returned `faithful`; the three stage-3 critics (`plan-r2.md`, sha256 `8ee04395…07a13`)
returned 3 blockers and 25 majors; stage 4 re-zoomed the amended bytes (`plan-r3.md`, sha256
`60ed4aaa…266d`) with 0 blockers and 9 majors; stage 5's first readiness read returned NO-GO
with 3 blockers and 8 majors. Every blocker and major was applied: the score's unit is the
compared salient value with per-workflow subtotals; D7 is an ordered six-rule derivation that
preserves §10's unrepeatable-re-run branch and never raises a verdict; the record and the verifier
report are named separately, and an adjudicated status change rewrites the affected `(6)` record
with a dated line; Pin-drift confirmation changes only the weight; the state copy is authoritative
and HEAD drift is classified over the two evidence ranges; P0 requires B's complete handover
record and the publish trigger; P2 copies (never moves) the draft, names the cold pass and the
plan-gate CLI, and stamps the re-homed bytes; P3 updates the record and `(6)`; D8's bullets carry
their rows' REQ tokens and the follow-up section carries its trigger; the close is dated and
`--single`; the done bar uses the parsed `**Done bar:**` form and names every artifact; and the
nit-level naming, ID, rollback, marker-branch, identity, and citation defects are fixed. A second
readiness read returned 5 further blockers and 5 majors, all applied: verdict tokens outside
§10's three values normalize to an absent verdict (rule 0); the `(6)` adjudication line is a
parser-safe extra bullet and the `Pass/fail` value is rewritten in place; the `(6)` REQ-276 note
is in the done bar, P2/V11; F10's status phrase is reconciled with its `## Resolved` section; and
`n/a` rows are excluded from the numerator and N while the excluded count is recorded. The final
targeted readiness check returned GO on those mechanisms and one Major: H1-H18 had no ledger
grain. It is applied as a condition-only amendment — §10's comparison table defines no salient
fields for the H steps, so their results are unscored narrative and are adjudicated if disputed,
never counted in N. After that pass, the prerequisite increment
`docs/plans/2026-11-18-t294-arithmetic/` corrected T294's arithmetic; this plan's former
T294-inconsistency branch and its roadmap scheduling were removed, and the correction is now a
P0(b) precondition rather than a claim about the drafting HEAD. A targeted re-review of the
amended bytes confirmed the removal left no orphan clause; its one finding (the correction was
described as already committed) is fixed by the precondition. The cold reports are retained
under `/tmp/opencode/verifier-report-review/`; the stamp records the synthesized report's path
and hash.

## Questions

ROADMAP item 1 (`ROADMAP.md:15-23`) closes when "the verifier report and its `DISPUTED`
adjudications are recorded". This plan and its two predecessors split §10 into three acts.
Increment A wrote the builder-side evidence. Increment B freezes and dispatches the kit, records
the hash commitment, and hands the verifier a different model family. The operator supplies the
unredacted `DECISIONS.md` when Phase 1 ends (step 4). This increment then performs step 5 and the
operator's side of step 4: it independently verifies the copy it holds, receives the report,
records it with its recomputed score, adjudicates every `DISPUTED` item once, retires the roadmap
item, closes the register's F10, and turns a verdict that is not `VERIFIED` into scheduled work
rather than a document no one acts on.

## Trigger status

- **Item trigger:** "the first publish after 2026-11-16" (`ROADMAP.md:22`). **Not met**: 161
  unpushed commits; the last pipeline run stopped at `record`.
- **Prerequisites (the set P0 measures):** a publish landed after 2026-11-16; B executed and
  dispatched (`dispatch:` names a model and a time, not `pending`); B's handover record is
  complete (kit directory, state-copy path, manifest hash, commitment, identity); the state copy
  exists; the verifier completed Phase 1; the operator holds the report as a file and names its
  path.
- **Dormant until the report exists.** This plan is not executed against HEAD `0dfcfba`.
- **Defined stop state (C0).** A **fatal P0 check (a)-(f)**, the **P1 state-copy/commitment
  check**, or the **P1 manifest-hash check** stops the session **before the first write**: no
  increment directory, no record, no
  roadmap or register edit, no AAR, no commit. A **kit marker mismatch** (count or hex against
  the manifest) is **not** fatal: P1 records it as a `kit integrity` provenance finding and D7
  rule 6 caps the verdict at VERIFIED WITH FINDINGS. A missing content item is **not** fatal: it
  is recorded as received, and D7 rule 5 yields NOT VERIFIED. A HEAD drift inside the evidence
  ranges is not fatal either: D3 records it and the state copy governs. The session
  reports the failing check, the measured values, and the next act to the maintainer, and ends.
  No increment started, so no loop artifact is owed; this draft remains the plan of record, and
  ROADMAP item 1 and F10 stay open. A tamper finding is a P0 security event, not a plan failure.
- **Selection:** execution is a maintainer selection after the verifier's Phase 1.
- **Operator presence:** step 4 (supply the unredacted `DECISIONS.md`) and step 5 (receive and
  adjudicate) are operator acts §10 binds. The operator supplies the report file and any live
  credentials the re-runs need; the session performs the recorded work.

## Why

- **EV1 — §10's steps 4-5 are this increment, and they sit after another model's session.**
  `spec/07-independent.md:10-19`: (4) when Phase 1 completes, supply the unredacted
  `DECISIONS.md`; (5) receive the report and adjudicate `DISPUTED` items. Step 3 launched the
  verifier in increment B, so a plan that also owned the report would span two sessions and two
  models.
- **EV2 — Phase 2 is a field-by-field comparison, and Phase 1 is blind.**
  `spec/07-independent.md:68-85` compares the verifier's entries with the recorded ones on
  salient values only — commands, pins, exit statuses, diff summaries, determinate counts —
  never wording or timestamps; the per-workflow field table fixes what is compared for G0a, G0b,
  G2-G8. Step 9 (`:87-98`) classifies every mismatch as Discrepancy, Pin drift, or
  Unclassifiable; the operator's classification is binding for the `Unclassifiable` rows. Step 10
  (`:99-103`) computes the score.
- **EV3 — the tolerance rule is normative, not editorial.** The REQ-273a/273b pair
  (`spec/02-requirements.md:2332-2336`) makes dice, status prefixes, exit codes, and tool names
  with parameters exact-match fields; prose is a structural match within the Appendix O tolerance
  (`spec/appendices-reference.md:3206-3211`); exact-count fields carry zero tolerance. The pair
  turns a violation of the exact rules into a Discrepancy, a prose violation into Unclassifiable,
  and a count violation into Pin drift unless an exact rule also failed. A report that calls a
  prose difference a Discrepancy mis-scores itself.
- **EV4 — the score bands and the arithmetic.** REQ-274 (`spec/02-requirements.md:2337-2346`):
  Discrepancy weight 0; Pin drift weight 0.2, conditional on operator confirmation; Structural
  match 1.0; Exact match 1.0; score = sum(weights) / total_comparisons; below 0.80 FAIL,
  0.80-0.95 PARTIAL, above 0.95 PASS; the score and per-workflow component weights are recorded.
  T294's worked examples are corrected by the prerequisite increment
  `docs/plans/2026-11-18-t294-arithmetic/` and agree with the formula at execution
  (`spec/appendices-reference.md:1784`, `holonovel/DECISIONS.md:3341-3343`): 3 of 10 → 0.70
  (FAIL); 0 Discrepancies + 2 confirmed Pin drifts + 8 matches → 0.84 (PARTIAL); 10 of 10 → 1.0
  (PASS). The operator recomputes from the formula and uses T294 only as a check on the
  arithmetic.
- **EV5 — adjudication is binding and single-shot.** `spec/07-independent.md:123-129`: the
  operator re-runs the single contested step once; that result replaces the item's pass/fail
  status regardless of which party's result it matches; where a re-run cannot be completed under
  the same conditions (a non-deterministic Pattern Buffer sub-workflow with no pinned seed), the
  verifier's result controls and the item is reported VERIFIED WITH FINDINGS with the attempted
  re-run noted. For adversarial selections the operator SHALL reuse the documented seed
  (`:55-65`), so the same sub-workflow is selected.
- **EV6 — the report has nine labelled sections and is review evidence.** The report format
  (`spec/07-independent.md:108-121`) requires: per-workflow verdicts with basis; documentation
  gaps at cold start; the waiver audit; H1-H18 results and the builder comparison; the evidence
  comparison; the score with component weights; T29's traceability result (`spec/appendices-reference.md:1470`)
  and five sampled rows walked end to end; the adversarial Pattern Buffer selection and verdicts; the final
  verdict. `:129` states the report is review evidence, not a build artifact, and `spec/audit/`
  is where this repository keeps such evidence.
- **EV7 — the commitment is checked again, by the operator, before Phase 2.** REQ-275
  (`spec/02-requirements.md:1454-1461`): the builder records a SHA-256 of the full
  `DECISIONS.md` in the redacted copy supplied to the verifier; after Phase 1 the hash is
  recomputed against the unredacted file; a mismatch is an "evidence tampered" Discrepancy and
  blocks Phase 2. T295 exercises both paths. B takes the commitment at freeze time and holds the
  unredacted copy outside the tree; C's own check is independent of the verifier's word.
- **EV8 — the model criterion has a recorded non-blocking branch.** REQ-276
  (`spec/02-requirements.md:1463-1471`): a different provider or architecture family is required
  (a version increment is insufficient); the verifier records its own provider, model name, and
  version; the operator verifies the criterion before Phase 1; and a same-provider-same-family
  verifier "is noted as a process-compliance finding and does not block the verification but
  SHALL be recorded in DECISIONS.md (6)". B's manifest records the declared identity and the
  verdict; if the verifier actually ran a same-family model, the (6) record is a C obligation
  because it is mandatory in the spec and B's kit plan does not write it.
- **EV9 — closure has two surfaces.** ROADMAP item 1 retires, and the register's F10 row
  (`spec/audit/review-register.md:3927`, "§10 independent verification never run") is
  rewritten in place with the `Resolved` status phrase, the date, the report path, the verdict,
  and the score — F10 is the finding's canonical record, so no second F10 row is created. F10
  already sits under the `## Resolved — 2026-11-16 release hardening` heading
  (`:3893`), and `check-registers` derives the disposition from that section heading, not the
  bullet's status phrase; the rewrite makes the phrase agree with the section.
  `check-roadmap` requires a retired
  section to be gone, not emptied, and every remaining section to carry 1-3 bullets and a
  `**Trigger:**` line. `check-registers:strict` fails a finding outside a disposition section and
  a `Scheduled-roadmap` finding whose REQ tokens do not appear in `ROADMAP.md`; it reports an
  undated finding as INFO, so a new finding cites its date by convention rather than by gate.
- **EV10 — a verdict that is not VERIFIED must produce work.** Item 1's close condition is the
  record, so it retires on any verdict. A `VERIFIED WITH FINDINGS` or `NOT VERIFIED` verdict
  names failing workflows or reservations; those become one dated roadmap section (at most three
  bullets, so multiple failures are enumerated inside a bullet) and a matching
  `Scheduled-roadmap` register row. Otherwise the first independent verification of the build
  ends in a document no one acts on.

## Decisions

- **D1 — The record has two files, and the raw report is preserved verbatim.** Throughout, **the
  verifier report** is the file the verifier produced and **the record** is the operator's file.
  `spec/audit/independent-verification-<date>.md` is the record: nine labelled
  sections in the order of the report's nine required content items, the score ledger, the
  adjudication table, and a provenance block
  (verifier identity, kit manifest hash, commitment, received date, raw report sha256).
  `spec/audit/independent-verification-<date>-verifier.md` is the verifier's report **byte for
  byte**, with no wrapper text, so its hash in the provenance block is checkable with
  `sha256sum`. The nine headings are the operator's structure, not the spec's: `§10` lists the
  required content as nine bullets under one report heading, so a verifier report that answers
  them in prose still conforms. The date is the adjudication (execution) date, not the dispatch
  date.
  - Rejected: filing the report under `docs/plans/`. It is review evidence about the build, not
    an increment's working record; `spec/audit/` already holds the two operator reviews
    (`spec-code-comparison-2026-09-25.md`, `remediation-2026-08-24.md`). The gate scans do not
    read those files: `validate` parses `holonovel.md` and the two registers, and `lint` lints
    the assembled spec and `README.md`, so the raw report's foreign prose is not linted or
    cross-referenced; the two precedents establish the location.
  - Rejected: one file with the raw report in a fenced appendix. A fenced copy is not the
    received bytes, and a report containing its own fences cannot be quoted without escaping.
  - Rejected: keeping only a summary. §10 makes the report the evidence; a summary cannot be
    re-read against the verifier's words.
- **D2 — The commitment is re-checked by the operator before the comparison is read as
  evidence.** EV7. P1 recomputes the SHA-256 of the state copy B recorded and compares it to the
  manifest's commitment and to the hex in the redacted copy's withheld markers. A mismatch stops
  the session under C0 with an "evidence tampered" finding; no report is recorded and ROADMAP
  item 1 stays open. The verifier's own reported hash is a cross-check, never the authority.
  - Rejected: trusting the verifier's Phase 2 hash line. The operator's step 4 supplies the
    bytes; the operator checks the bytes it supplies.
- **D3 — The state copy is authoritative; HEAD is a secondary check with two drift kinds.** B's
  committed `DECISIONS.md` and the mode-0600 state copy hash to the commitment at B's close. C
  verifies the **state copy** against the commitment; that is the load-bearing check. HEAD is not
  authoritative: a later publish runs `push-pipeline.sh`, which syncs the `**Spec hash:**` line in
  `holonovel/DECISIONS.md` and may append a dated `### Holonovel Spec Update` entry, so HEAD
  normally differs from the freeze bytes. C compares HEAD's two evidence ranges (the G7 block and
  the appended records) with the state copy's: a difference **inside** those ranges is
  `freeze-tree drift` (recorded; the state copy governs the comparison and the report does not
  compare newer records); a difference **outside** them is `publish bookkeeping` (recorded as a
  note, not a finding). A state-copy mismatch is tamper (D2/C0).
- **D4 — The score is recomputed from the compared salient values, with per-workflow subtotals.**
  §10's table fixes the compared values, and the grain is named per workflow so two operators
  count the same rows: one row per checklist item (G0a, G0b); one row per die-value observation,
  per status-prefix observation, for `isError`, per gating decision, and one for the coverage
  count (G2); one row for the registry diff (G3); one row per test ID (G4); one row per
  sub-workflow verdict (G5); per module, one row for the active/inactive count pair and one for
  tag presence (G6); one row per attestation point (a)-(c) (G7); one row per step (G8). H1-H18 are
  a required report content item (item 4) and can be `DISPUTED`, but §10's comparison table
  defines no salient fields for them, so their results are recorded as unscored narrative and
  adjudicated under rule 3 when disputed; they are **not** ledger rows and do not enter N. A
  single per-workflow row cannot carry one class or one weight, so
  the ledger has **one row per compared salient value**; each row carries its class (Exact or
  Structural match 1.0, confirmed Pin drift 0.2, Discrepancy 0) and its weight. N is the row
  count — REQ-274's `total_comparisons` — and the score is `sum(weights) / N`. A row whose weight
  is `n/a` is recorded but excluded from both the numerator and N; the record states the total
  row count, the excluded count, and N. The per-workflow component weights are recorded as each
  workflow's weighted subtotal and its scored-value count; the subtotals sum to the numerator and
  the counts sum to N. §10's "across all compared workflows"
  describes the aggregation, not the denominator: the subtotal is the workflow's component.
  T294's "3 Discrepancies of 10" is ten compared values. Band edges are fixed: `> 0.95` PASS,
  `0.80-0.95` PARTIAL (both bounds inclusive), `< 0.80` FAIL. The verifier's stated score, the
  ledger, N, and the operator's value are all recorded; a difference beyond rounding (±0.005) is a
  finding and the operator's value is the recorded one. A report that does not enumerate the
  compared values, or gives only workflow totals, leaves the score unreproducible: the record says
  so, D7 rule 6 applies (at most VERIFIED WITH FINDINGS), and a follow-up is scheduled. A missing
  comparison **section** is a completeness failure under D7 rule 5, not merely an unreproducible
  score.
  - Rejected: copying the verifier's score. A stated number can be wrong even when the example
    is right; the operator is the last arithmetic check.
  - Rejected: recomputing after adjudication. The score measures the Phase 2 comparison, not the
    final verdict; adjudication replaces statuses and is recorded separately.
  - Rejected: using T294's examples as the oracle. The formula governs; the examples illustrate it.
- **D5 — Every mismatch the ledger cannot score is classified by the operator, and Pin drifts are
  confirmed.** §10 step 9 says an Unclassifiable mismatch is flagged for operator adjudication and
  the operator's classification is binding; REQ-274 makes a Pin drift's 0.2 conditional on
  operator confirmation. Before scoring, C (a) assigns each Unclassifiable row to Discrepancy,
  Pin drift, or match, with the reason and the REQ-273a/273b clause (word-count and count
  tolerances per Appendix O), (b) confirms or declines each Pin drift the report counted, and
  (c) records a row still unclassifiable as weight `n/a`, which makes the score unreproducible
  under D4. Confirmation changes only the **weight**: a confirmed Pin drift is 0.2; a declined
  one keeps its Pin-drift class but carries `n/a` unless the evidence shows the class itself was
  wrong (an exact-rule violation makes it a Discrepancy; a non-salient value makes it a match),
  and either correction is recorded with its clause. No row keeps 0.2 without a recorded
  confirmation, and no declined row is silently raised to a match.
- **D6 — One re-run per disputed item, at the frozen version and the documented seed.** Each
  `DISPUTED` item is re-run exactly once, with `npx -y holonovel@<manifest version>` (not
  `latest`, which would be a different build), the documented seed for an adversarial selection,
  and the builder record's fixture and parameters. `docs/plans/<date>-verifier-report/
  adjudication.md` holds the command, output, pins, seed, and result per item; the record's
  adjudication table holds one summary row per item. The operator's outcome **replaces the
  disputed item's pass/fail status in the evidence record**, per §10: the record's section 1 shows
  the verifier's status and the adjudicated one (marked binding), and when the outcome differs
  from the builder's recorded status, C also rewrites that record's `- **Pass/fail** — <value>`
  bullet in `holonovel/DECISIONS.md` (6) to the binding `pass`/`fail` and appends a
  `- **Adjudication** — <YYYY-MM-DD>: <seed>, <pins>, <result>` bullet inside the same contiguous
  bullet run, then re-runs `npm run validate`. The extra label is ignored by the T253 field check
  (it requires the six canonical labels and a `- **(a) …**` sub-check bullet, all of which remain),
  so the record still parses; the original status stays legible in the adjudication line, so the
  change is dated and attributable, not a silent rewrite. Every `DISPUTED` status is adjudicated:
  an entry that cannot be tied to a workflow is recorded as an unidentified dispute and D7 rule 5
  yields NOT VERIFIED. A re-run that cannot be completed under the same
  conditions records the attempt and keeps the verifier's result; §10 then reports that item as
  VERIFIED WITH FINDINGS, which D7 rule 2 applies. The operator replays the item's recorded
  command sequence from
  the builder record (the same tool calls, fixture, and parameters); `adjudication.md` carries
  the exact commands and their output, so the re-run is reproducible from the record alone.
  - Rejected: re-running with `latest`. B's manifest records the freeze-time registry version so
    a later version is pin drift, not a builder discrepancy.
  - Rejected: more than one re-run. §10 makes the first completed re-run binding.
- **D7 — The recorded verdict is an ordered, fail-closed rule set, and every input is recorded.**
  The record carries five inputs: (i) the verifier's verbatim final verdict; (ii) the score band
  mapped by **this plan** (neither REQ-274 nor §10 states the join): PASS→VERIFIED,
  PARTIAL→VERIFIED WITH FINDINGS, FAIL→NOT VERIFIED; (iii) completeness: each of the nine required
  content items and the final verdict present; (iv) adjudication: the per-item outcomes and
  whether the affected workflow is blocking — every G0a/G0b/G2-G8 workflow and every H step is
  blocking, and a Pattern Buffer sub-workflow is non-blocking only when its manifest records that
  flag; a workflow the report leaves unclassified is blocking fail-closed; (v) admissibility: the
  commitment result and whether the score was reproducible. The recorded verdict is then derived
  in this order:
  0. **Normalize** — only `VERIFIED`, `VERIFIED WITH FINDINGS`, and `NOT VERIFIED` are accepted
     verdicts. Any other token (including §10's per-workflow `PASS`/`FAIL`/`DISPUTED`) is recorded
     verbatim and treated as an absent verdict, so rule 5 applies; the record names the token.
  1. **Base** — the normalized verifier's verdict.
  2. **Unrepeatable re-run** — §10's own branch: the verifier's result controls and the item is
     reported VERIFIED WITH FINDINGS. The rule can only lower the base: a base of VERIFIED becomes
     VERIFIED WITH FINDINGS (so the item's §10 report is reflected), while a base of NOT VERIFIED
     stays NOT VERIFIED. The record states the item-level result and the overall result
     separately, so §10's item report is satisfied without raising the overall verdict.
  3. **Adjudicated failure** — a binding re-run that fails on a blocking workflow → NOT VERIFIED;
     on a non-blocking workflow → at most VERIFIED WITH FINDINGS.
  4. **Score band** — FAIL → NOT VERIFIED; PARTIAL → at most VERIFIED WITH FINDINGS; PASS → no
     change.
  5. **Completeness** — any of the nine content items (the ninth is the final verdict) absent →
     NOT VERIFIED.
  6. **Admissibility** — a D15 hash-mismatch admission → NOT VERIFIED; an unreproducible score,
     a `kit integrity` finding, a `commitment disagreement` finding, or a missing/unclassifiable
     model identity → at most VERIFIED WITH FINDINGS.
  Each rule records whether it applied; a rule's "at most" may only lower a verdict, never raise
  it. The verifier's words are preserved, so a generous verdict is visible rather than
  overwritten, and every lowering is attributable to a named rule.
  - Rejected: recording only the verifier's verdict. A failed operator re-run would then leave a
    VERIFIED record that contradicts its own adjudication table.
  - Rejected: recording only the derived verdict. The report's own conclusion is evidence.
  - Rejected: a plain strictest-of-N rule. It returns NOT VERIFIED where §10 mandates VERIFIED
    WITH FINDINGS on the unrepeatable branch (`spec/07-independent.md:126-128`).
- **D8 — The verdict decides the roadmap, and item 1 retires on any verdict.** Item 1 retires on
  the record it asked for. On a non-VERIFIED verdict, one dated section
  (`## Independent verification follow-ups — <YYYY-MM-DD> (P1)`, matching the file's bare suffix
  convention) carries at most three bullets in total. Each bullet names the failing workflow or
  reservation **and every REQ token its `Scheduled-roadmap` row cites**, because
  `check-registers:strict` requires those tokens to appear in `ROADMAP.md`. The section also
  carries `**Trigger:** the next independent verification; closes when each named workflow passes
  or is otherwise dispositioned.` The same edit adds one `Scheduled-roadmap` row per tracked
  defect (`F-IV-1`…), each carrying its `YYYY-MM-DD` date. A bullet may carry two rows only when
  it names both rows' REQ tokens, so the three-bullet cap and the row cardinality can both hold.
  The first row cites REQ-274 and the failing workflow's governing REQ, defined as the REQ cited
  by that workflow's §8 row or its Appendix F row; when neither cites one, the row cites REQ-274
  alone. The register gate does not parse finding IDs (it parses `- **…**` bullets, dates, and
  REQ tokens), so `F-IV-*` is a readable label, not a grammar; if the register later gains an ID
  rule, use its next free `F<n>` instead. A `Scheduled-roadmap` row and its roadmap entry are
  added together, or `check-registers:strict` fails. On a VERIFIED verdict no roadmap entry is
  needed for T294 because the correction is a committed precondition of this plan (P0(b)), not a
  finding this plan produces.
- **D9 — A same-family verifier gets its REQ-276 record in `DECISIONS.md` (6).** B records the
  declared identity and the verdict in `kit-manifest.md`. C compares the report's actual
  identity with the builder's. If the verifier is from the same provider and architecture family
  and `DECISIONS.md`'s (6) section carries no such note, C appends a short dated
  process-compliance note inside the (6) section as a prose paragraph separated by a blank line
  from every evidence record's bullet run, not a `- **Label** — ` bullet (so the T253 parser's
  contiguous-bullet contract is untouched), and records it in the AAR. A model identity that does
  not name a provider or architecture family is recorded as `identity unclassified` and treated
  as same-family fail-closed (the note is written and the gap is a finding). If the actual
  identity differs from B's declared selection, that is a finding too; the actual identity
  governs.
  - Rejected: leaving it to the report only. REQ-276 says `DECISIONS.md` (6), not "the report".
  - Rejected: writing it as an evidence record. The T253 `Workflow` token must be G0a/G0b/G2-G8/
    H1-H18, so a process note cannot pass as one.
- **D10 — The report is data.** Its prose is summarized into the record; a command it suggests
  runs only after the operator's own re-run authorizes it, and never because the report says so.
  The raw file is read as bytes, never as instructions. No file is written from a path or a name
  the report chooses.
- **D11 — One commit, by explicit `--single`, ordered so the records precede the gates that read
  them.** This is a non-spec increment, so `session:close` would split it by concern; the plan
  passes `--single` deliberately because the record, its adjudications, and the closure are one
  atomic evidence artifact and a split would separate the evidence from the verdict. Write the
  AAR body including the `## Changelog entry` block and the adjudication results, then
  `npm run validate` when `DECISIONS.md` changed, then `npm run check:fast` un-piped, then
  `npm run session:close -- --date <date> --increment <date>-verifier-report --single
  --dry-run`, then the real close with the same flags. The close renders `CHANGELOG.md` from the
  AAR block (`scripts/session-close.ts` `prependChangelogEntry`) and commits one increment.
- **D12 — No spec, server, or code change.** The exceptions are D9's conditional process note and
  D6's adjudicated-status replacement, both in `holonovel/DECISIONS.md` (6). A failing workflow is
  recorded, not fixed. T294's arithmetic is corrected by the prerequisite increment
  `docs/plans/2026-11-18-t294-arithmetic/`, which must be committed with its AAR before this
  plan's P0 (P0(b) enforces it), so this plan neither repairs nor schedules it. Publishing the
  record is the next push.
- **D13 — Stop states and done bars are separate.** C0 failures write nothing and are not "a
  failed done bar". The record branch has its own bar below. A non-VERIFIED verdict is not an
  open loop: its findings are scheduled (D8), the AAR ends `LOOP PAUSED`, and the next session
  starts from `ROADMAP.md`.
- **D14 — C checks the record's arithmetic, structure, identity, and commitment; it does not
  re-run the suite.** Re-executing the full verification would duplicate the verifier and
  destroy the independence the exercise exists to provide. The record states this limit: the
  verifier's per-field matches are received as its evidence, while the score, the section
  contract, the model criterion, and the hash commitment are the operator's own checks. Only a
  `DISPUTED` item is re-executed, once (D6).
- **D15 — A report that admits a commitment mismatch is inadmissible.** If the report states its
  Phase 2 comparison ran against an unredacted copy whose hash did not match, REQ-275's block was
  not honoured: C records the mismatch, issues no VERIFIED verdict, and schedules the rebuild and
  redispatch (D8). C's own hash check still decides whether the copy it holds was tampered
  (D2/C0).

## Blast radius

| File | Change | Size |
|---|---|---|
| `spec/audit/independent-verification-<date>.md` | *(new)* nine labelled sections, the field-level score ledger, adjudication table, provenance | L |
| `spec/audit/independent-verification-<date>-verifier.md` | *(new)* the verifier's report, byte for byte | M |
| `docs/plans/<date>-verifier-report/plan.md` | the re-homed plan, re-measured, re-stamped | M |
| `docs/plans/<date>-verifier-report/tasks.md` | P0-P5 checklist | S |
| `docs/plans/<date>-verifier-report/adjudication.md` | *(new)* one transcript per `DISPUTED` item | M |
| `docs/plans/<date>-verifier-report/aar.md` | written at close, with the `## Changelog entry` block | S |
| `docs/plans/<date>-verifier-report/plan.cold/` | *(new)* the re-homed plan's cold-pass stage reports and `report.md`, hashed into its stamp | M |
| `ROADMAP.md` | item 1 retired; a verdict follow-up section when the verdict is not VERIFIED | S |
| `spec/audit/review-register.md` | F10 rewritten with `Resolved` and a date; follow-up rows when the verdict is not VERIFIED | S |
| `holonovel/DECISIONS.md` | (6): a dated REQ-276 note on the same-family branch, and/or an adjudicated status update with its dated line | S |
| `docs/plans/2026-11-18-roadmap-plan-set-2/item-1c-report-adjudication.md` | this draft, revised — **not** in C's commit; the planning session's close or the next publish carries it, and P0(a) asserts it is already committed | M |
| `CHANGELOG.md` | rendered from the AAR `## Changelog entry` block | S |
| any file the close's `fix-anchors` reports | the close's own repair; unexpected here because C edits no `holonovel/src` or `holonovel/scripts` path | S |

Rollback: before the close, remove the two report files and the increment directory, then
`git checkout -- ROADMAP.md spec/audit/review-register.md holonovel/DECISIONS.md CHANGELOG.md`
restores HEAD (a file `fix-anchors` rewrote is restored the same way, and the AAR names it if it
is kept). After the close, `git revert <sha>` reverses the tracked change.

## Phases

- **P0 — Preconditions, before any write.** (a) This draft is committed:
  `git status --porcelain -- docs/plans/2026-11-18-roadmap-plan-set-2/item-1c-report-adjudication.md`
  is empty, and `sha256sum` of the committed file is recorded for P2's provenance.
  (b) The tracked tree is clean: `git status --porcelain` is empty, which includes the
  prerequisite `docs/plans/2026-11-18-t294-arithmetic/` increment and its committed AAR; an
  untracked or uncommitted prerequisite stops under C0 like any other dirty-tree state.
  (c) B's handover record is complete and the trigger has fired: the `docs/plans/*-verifier-kit/`
  increment whose AAR ends `LOOP PAUSED` and records a completed dispatch (a model and a time,
  not `pending`) also names the kit directory, the state-copy path, the manifest hash, the
  commitment, and the verifier identity. The trigger test is separate from the freeze version:
  `git tag --list 'v2026.*' --sort=-v:refname | head -1` names a tag whose
  `git log -1 --format=%cs <tag>` date is on or after 2026-11-16; the manifest's freeze version is
  recorded on its own and need not equal the tag (a later publish is pin drift under D6). If two
  kit increments qualify, the session stops for the operator to name the right one under C0.
  (d) The state copy exists at the recorded path and is readable.
  (e) The operator names an existing report file outside the repo, and neither destination
  exists yet: the two `spec/audit/independent-verification-<date>*.md` paths and the
  `docs/plans/<date>-verifier-report/` directory.
  (f) `npm run check:fast` is green on this tree (baseline).
  Accept: all six, measured values recorded in `tasks.md`. Any failure stops under C0 with
  nothing written. The tree version need not equal the registry's latest: C records the
  manifest's freeze version and whether the registry still serves it; an unavailable freeze
  version is D6's not-completable branch, not a precondition failure.
- **P1 — Verify the intake, before any write.**
  Read the report as bytes. The **state copy** is the unredacted `DECISIONS.md` that B placed at
  the path its AAR records (mode 0600, outside the tree); the report file is the separate file
  the operator received. Check (1) the manifest hash in B's AAR equals `sha256sum` of the
  committed `kit-manifest.md` (a mismatch is a fatal handover-integrity stop under C0); (2) the
  state copy at the path B's AAR records hashes to the
  commitment; if the kit directory is present, every withheld marker the manifest records carries
  the same hex and their count equals the manifest's withheld-range count (a mismatch is recorded
  as a `kit integrity` finding and forces D7 rule 6); (3) HEAD's two
  evidence ranges match the state copy's, or D3's drift classification applies; (4) the report
  addresses all nine required content items (in whatever form), states a final verdict among the
  three values, and states a model identity; (5) the report's own commitment line agrees; a
  disagreement that is not a D15 admission is recorded as a `commitment disagreement` finding and
  forces D7 rule 6.
  Accept: the commitment matches; a missing model identity is recorded as a finding (D9's
  `identity unclassified` path, D7 rule 6); the nine content items and verdict (the ninth item)
  are present or their absence is listed in the P1 report to the maintainer and re-entered in
  `tasks.md` at P2 (P1 writes nothing). A state-copy mismatch stops under C0 with the "evidence
  tampered" finding; a manifest-hash mismatch stops under C0 as a handover-integrity failure; a
  report that states its own Phase 2 hash mismatch is inadmissible under D15; a missing content
  item, verdict, or identity does **not** stop — P2 records it, and D7 rule 5 or 6 applies.
- **P2 — Copy, scaffold, then record the report.**
  First create `docs/plans/<date>-verifier-report/`, **copy** (not move) this draft to its
  `plan.md` with **Revision 2**, the source draft's sha256, and the cold-report path and hash in
  its header; re-measure every line reference; write `tasks.md`; then run the `independent-review`
  protocol over the re-homed plan in fresh subagent contexts (five stages, stage reports under
  `plan.cold/`, synthesized `plan.cold/report.md` beginning `Plan sha256: <re-homed plan hash>`
  with the stage coverage and token). Apply and record every finding; if a Blocker survives the
  re-audit, stop under C0 (no record is written). Otherwise stamp the re-homed plan with the
  repo's plan-gate CLI:
  `/home/fluke/.config/opencode/skills/plan-review/scripts/plan-gate.mjs stamp-plan
  --project /home/fluke/Holonovel --plan docs/plans/<date>-verifier-report/plan.md --kind planned
  --independence fresh --depth deep --reviewer independent-review
  --independent-review-path docs/plans/<date>-verifier-report/plan.cold/report.md
  --independent-review-sha256 <report hash> --independent-review-stages 5`.
  The stamp binds the re-homed bytes: the report's plan hash must equal the `plan.md` hash, and
  the stamp's review hash must equal the report's. Then copy the verifier report byte for byte to
  its `spec/audit/` raw file, verify the copy's hash, and write the record: the nine labelled
  sections in the verifier report's content order,
  each populated from the report; the value-level score ledger (D4); the operator's
  classifications and Pin-drift confirmations (D5); and the provenance block. If D9 applies,
  append the REQ-276 note. Accept: the increment has `plan.md` (Revision 2, stamped, cold report
  path and hash recorded), `tasks.md`, and `plan.cold/report.md`; the stamp's
  `independent_review_sha256` matches the report and the report's plan hash matches the re-homed
  `plan.md`; nine non-empty sections in order; the raw copy's hash equals the provenance line and
  `cmp` against the operator's source succeeds; every ledger row has a class; an unclassifiable
  row carries weight `n/a` and forces D7 rule 6; every other row has a numeric weight; `N` equals
  the scored row count and the excluded count is recorded; the subtotals sum to the numerator and
  the scored counts to N; when D9 applies, the (6) note is present and `npm run validate` passes.
- **P3 — Adjudicate, update the record, and derive the verdict.**
  Re-run each `DISPUTED` item once per D6; write `adjudication.md` with one transcript per item
  and the summary table; update the record's section 1 with the binding adjudicated statuses;
  update `holonovel/DECISIONS.md` (6) when a status differs (D6); fill the adjudication table and
  the five D7 inputs, **re-stating** P2's ledger and score rather than recomputing them (D4);
  derive the verdict by applying D7's rules 0-6 in order and record which applied. Accept: one
  adjudication row and one transcript per `DISPUTED` item; the record's section 1 shows both
  statuses with the adjudicated one marked binding; a changed status appears in (6) with its
  dated line and `npm run validate` passes; every rule's application or non-application is
  recorded; the unrepeatable branch names its §10 basis; the recorded score is P2's, unchanged.
- **P4 — Close the item.**
  Retire the roadmap section; rewrite F10 in place (it is the finding's canonical record) with
  the status `Resolved`, the date, the report path, verdict, and score; add the follow-up
  section and its `Scheduled-roadmap` rows (`F-IV-1`…) when the verdict is not VERIFIED (D8).
  Accept:
  `npm run check-roadmap` and `npm run check-registers:strict` pass; item 1 is absent; F10
  carries `Resolved` and a date; the verdict follow-up exists if and only if the verdict is not
  VERIFIED.
- **P5 — Close the increment.**
  Write the AAR with the verdict, score, `DISPUTED` count, findings and dispositions, and the
  `## Changelog entry` block in `scripts/lib/changelog-entry.ts`'s shape (Title ≤ 100 characters
  and no date prefix, a one-paragraph Summary, 1-8 bullets). The close prepends the session date
  to that Title to form the CHANGELOG heading and commit subject. Run `npm run validate` when
  `DECISIONS.md` changed; run `npm run check:fast` un-piped; dry-run
  `npm run session:close -- --date <date> --increment <date>-verifier-report --single
  --dry-run`; run the real close with the same flags. Accept: one commit, the dated heading built
  from the AAR block's Title as the subject, `LOOP PAUSED`, and this plan's V1-V15 table passes.
- **Failure branch, P2-P5.** A failed check stops the session before the next write. A defect
  found after P4 but before the close is fixed in place, because no commit exists yet; an
  unrecoverable failure rolls back. The rollback restores the tracked files (`git checkout --
  ROADMAP.md spec/audit/review-register.md holonovel/DECISIONS.md CHANGELOG.md`), removes the
  report pair and the increment directory, and keeps no partial evidence. `session:close` runs `npm run fix-anchors`; that tool resolves only
  anchors whose recorded path begins `holonovel/src/` or `holonovel/scripts/` (its header), and C
  edits neither, so a rewrite there is a surprise to be named in the AAR and kept, not silently
  added to the blast radius.

## Verification

| # | Command / check | Expected |
|---|---|---|
| V1 | P0's six checks (draft commit state and hash, `git status --porcelain`, B's handover record plus the publish tag, the state copy, the report file plus free destination paths, `check:fast`) | all six pass; any failure stops under C0 with nothing written |
| V2 | `sha256sum "<state copy>"` vs the commitment in `kit-manifest.md`; then extract the two evidence ranges from `git show HEAD:holonovel/DECISIONS.md` and from the state copy (range A: the `#### narrative_coherence (G7)` heading through the line before the next `^### ` heading; range B: the `^## Verification workflow evidence` heading through `<!-- evidence:end -->` or EOF) and `diff` them | state copy equals the commitment (mismatch stops under C0); in-range differences are D3 freeze-tree drift, out-of-range differences are publish bookkeeping |
| V3 | `sha256sum docs/plans/<kit-date>-verifier-kit/kit-manifest.md` vs the hash in that increment's `aar.md` | equal |
| V4 | only if the kit directory B's AAR names is present: withheld-marker count in `<kit-dir>/handoff/DECISIONS.md` vs the manifest's withheld-range count; `grep -c "^@section evidence"` in that copy; each marker's hex vs the commitment the manifest records | marker count equal; evidence-marker count `0` (B's D2 replaces both ranges, and B's V5 asserts the zero); each hex equals the manifest's commitment |
| V5 | report coverage: each of the nine required content items (the ninth is the final verdict) is addressed; a final verdict among the three values and a model identity are present; the operator's record has nine non-empty labelled sections | all present, or the absence is recorded as a finding; a missing content item or verdict yields D7 rule 5 (NOT VERIFIED); a missing or unclassifiable identity yields D7 rule 6 |
| V6 | `cmp <operator source> spec/audit/independent-verification-<date>-verifier.md`; `sha256sum` vs the provenance line | identical; hashes equal |
| V7 | ledger: one row per compared salient value at D4's named grain for G0a/G0b/G2-G8 only (H1-H18 are unscored narrative); `sum(weights)/N` vs the recorded score; per-workflow weighted subtotals sum to the numerator and scored counts to N; `n/a` rows counted in the excluded total, not in N; each Pin drift carries a confirmation; band vs `>0.95`/`0.80-0.95`/`<0.80` | arithmetic reproduces within ±0.005, or both values are recorded with the finding; an unreproducible score yields D7 rule 6 (at most VERIFIED WITH FINDINGS) |
| V8 | `DISPUTED` statuses in the verifier report's per-workflow verdict section vs adjudication-table rows vs transcripts in `adjudication.md`; the record's section 1 | counts equal (zero is valid); every row names its seed or `n/a` with the reason, its pins, result, and binding status; an untraceable status is recorded as unidentified; the record's section 1 marks the adjudicated status binding |
| V9 | the record's five inputs, D7 rules 0-6 (applied or not), and the recorded verdict | every rule is recorded; the verdict equals the rule sequence's result; a rule that lowers the verifier's verdict names itself |
| V10 | `npm run check-roadmap`; `npm run check-registers:strict` | pass; item 1 gone; F10 carries `Resolved` and a date; the verdict follow-up is present iff the verdict is not VERIFIED; every REQ token a row cites appears in `ROADMAP.md` |
| V11 | `npm run validate` (when `DECISIONS.md` changed, i.e. a D6 status update or a D9 note) | exit 0, `0 error(s)`; the changed records still parse under T253, and the D9 note is present when that branch applies |
| V12 | `npm run check:fast` (un-piped, last) | `46 passed, 0 failed` … `check:fast: PASS` at plan time; the executing session's own baseline governs |
| V13 | `npm run session:close -- --date <date> --increment <date>-verifier-report --single --dry-run`; then the real close with the same flags | dry-run prints one commit whose subject is the dated heading built from the AAR block's Title; the close makes it |
| V14 | `git status --porcelain` after the close; `git show --stat HEAD` | empty; only C's files — the report pair, the increment directory (including `plan.cold/` and the stamp), `ROADMAP.md`, the register, the conditional `DECISIONS.md`, `CHANGELOG.md`, and any file the close's `fix-anchors` reports; the draft is already committed and absent |
| V15 | the increment's plan stamp: `sha256sum plan.md`, the `Plan sha256:` line in `plan.cold/report.md`, and the stamp's `plan_sha256` / `independent_review_sha256` / `independent_review_stages` | all three plan hashes equal; the stamp's review hash equals `sha256sum plan.cold/report.md`; stage count is `5`; the report is non-empty |

## Done bar

**Done bar:** the record branch below — a recorded report, its adjudications, the closure, green gates, and one commit.

The increment holds the stamped Revision-2 `plan.md` (its report's plan hash and the stamp's review
hash agree), `tasks.md`, `plan.cold/report.md`, and `adjudication.md`. A record exists at
`spec/audit/independent-verification-<date>.md` with nine labelled sections in the verifier
report's content order, each carrying either the verifier's content or an explicit "missing in the
verifier's report" finding, the model identity, the kit manifest hash, the commitment, the raw
report's sha256 (`cmp`-identical to the operator's source), the value-level score ledger with the
per-workflow subtotals and the recomputed
REQ-274 score and band (or the "unreproducible" finding), and one adjudication row per
`DISPUTED` status naming its seed or its unrepeatable reason, pins, result, and binding status
(an untraceable dispute is recorded as unidentified and yields NOT VERIFIED); the raw report is
preserved byte for byte beside it; the verifier's verdict and the five
D7 inputs are recorded, every rule's application is recorded, and the recorded verdict is the
rule sequence's result; any adjudicated status change appears in `DECISIONS.md` (6) with its dated
line; the REQ-276 note is present when the verifier is same-family or `identity unclassified`; the
commitment re-check passed; if the verdict is not
VERIFIED, the follow-up section names each failing workflow or reservation, carries the same REQ
tokens as its rows, and has its `**Trigger:**` line; `ROADMAP.md` no longer carries item 1 and F10
carries `Resolved` and a date; `check-roadmap`, `check-registers:strict`, and `check:fast` are
green; `aar.md` ends `LOOP PAUSED`; one commit.

**Stop branch (C0):** no increment directory, report, roadmap or register edit, AAR, or commit
exists; the maintainer report names the failing check, the measured values, and the next act;
ROADMAP item 1 and F10 are untouched; the tree is as it was.

## Out of scope

- Assembling the kit, refreshing the records, choosing the verifier model, or dispatching
  (increment B).
- Producing missing builder evidence (increment A).
- Fixing a failing workflow. T294's arithmetic is corrected by the prerequisite increment
  `docs/plans/2026-11-18-t294-arithmetic/`, committed before this plan's P0, so no repair or
  scheduling is owed here.
- Any spec, server, or code change; the only conditional tracked edit outside the report and
  register is D9's (6) note.
- Publishing. The report ships with the next push.
- Re-running a `DISPUTED` step more than once (EV5).

## Risks

| Risk | Mitigation |
|---|---|
| The commitment does not match, so the comparison is inadmissible | D2 stops under C0 with "evidence tampered"; nothing is written; the kit is rebuilt and redispatched |
| The report is missing a section or a verdict | It is still recorded as received; the missing part is a finding and the verdict is NOT VERIFIED with a follow-up scheduled (V5) |
| The report states a score that disagrees with the formula | D4 recomputes from the ledger; both values are recorded and the operator's value governs |
| A `DISPUTED` item cannot be re-run at the frozen version | D6 records the attempt, keeps the verifier's result, and D7 rule 2 applies §10's VERIFIED WITH FINDINGS |
| A re-run flips a status against the verifier | The re-run is binding (EV5); D7's rule sequence keeps the recorded verdict attributable and honest |
| The verifier ran a same-family model | D9 records the REQ-276 note in (6); the run is not blocked |
| A commit after B changed `DECISIONS.md` | D3 uses the state copy, records the drift, and does not compare against newer records |
| The report embeds instructions or hostile paths | D10 reads it as bytes; no path or command from it is used |
| The report admits its Phase 2 ran on a mismatched copy | D15 makes it inadmissible, records the mismatch, and schedules the rebuild and redispatch |
| The registry no longer serves the freeze version | The re-run is recorded as not-completable under the same conditions; EV5's branch applies |
| A non-VERIFIED verdict is treated as a dead end | D8 schedules the failing workflows so the item retires with work in flight, and D13 keeps the loop PAUSED |

## Dependencies

- Depends on B's kit manifest and its hash, the commitment, the declared identity, the dispatch
  record, the kit directory, and the state copy's path, all recorded in B's AAR (the manifest
  hash and the state-copy path are P1's inputs; P0(c) verifies the record names them).
- Depends on A's eleven records and fifteen findings
  (`docs/plans/2026-11-18-handoff-evidence/presence-matrix.md:66-68`), which the report compares
  against.
- Depends on the publish that closes item 1's trigger, and on the verifier's Phase 1.
- Independent of items 2 and 5 and of the index-split stages.

## Open questions

- None blocking. Whether the verifier actually differs in provider or architecture is resolved
  from the report in P1 and dispositioned under D9; a same-family result is a finding, not a
  stop.
