# Cold review — roadmap-drain-9 plan

Plan sha256: 961092976787170fdf9722a597cf6c5eaaa75ae7c78a1635f9e99eeaf4becc12

(Revision 3 — the condition-only amendment of the targeted re-review's M2a. The reviewer's passes
read revision 1 at `cd81a8fd…` and revision 2 at `9faaed77…`; revision 3 changes only the
`Built from:` predicate wording and two counts, per the re-review's condition.)

**Reviewer:** `review` subagent (fresh context, no authoring history)
**Pass 1 plan sha256:** `cd81a8fd64afb5f4d69a25835809fb360adbce9031de1b56517835195d36fcdb`
**Pass 2 (targeted re-review) plan sha256:** `9faaed77f36c86fb8cb3d4403067f77436f7ad62659f6c349176a0dd0a65264e`
**Depth:** standard · **Stages:** 5/5 closed · **Reads:** 24/40 (pass 1), 3/10 (re-review)

## Pass 1 — verdict: FAILED

Blocker B1 (D2's per-file diff had no recorded baseline — the map records one aggregate hash).
Majors: M1 (REQ-278's file-list clause attributed to `validate`, not the builder's DECISIONS.md
(6)), M2 (P3's pre-edit expectation contradicted D5/EV6), M3 (T186 under-asserted REQ-153), M4
(the probe-restore check could never pass with an untracked increment directory). Minors: N1
(Holonovel-map row count 21 → 25), N2 (cited README range omitted the RSS/date lines), N3 (three
line drifts), N4 (the server README already carries the attribution bullets). Nits: N5 (T538
over-labelling), N6 (AAR ordering), N7 (RSS target unspecified).

All seven load-bearing premises were confirmed against the tree, with two corrections: premise 6
(the live `npm run validate` count) was unverifiable in the reviewer's sandbox, and premise 7's
Holonovel-map row count was wrong (25, not 21).

## Pass 2 — targeted re-review, verdict: `independent-review passed.`

Every prior finding resolved. B1's mechanism removed; M1's attribution stated; M2's pre-edit set
restated; M3's predicate strengthened; M4's restore check path-scoped; N1–N7 corrected. The
reviewer confirmed executability: `validate.ts:1473` sits inside `checkPhaseMapHash`'s return
range so `T298` is collected; `checkHandoffDocs(text: string): string[]` satisfies
`checkFunctionRanges`; the T186 and T187 predicates can pass after the proposed doc edits.

One Major remained in the changed acceptance text (M2a): a case-insensitive `Built from:` test
would pass pre-edit (the section already says "built from:"), so the pre-edit set would be three
items, not four. Resolved as a condition-only amendment in revision 3: the check now requires the
literal capitalised `Built from:` lead-in, restoring the four-item expectation.

Non-blocking observations accepted: P2's intermediate count aligned to 52; the rollback file count
aligned to seven; the Open-questions fallback now states the Done-bar amendment. `checkPhaseMapHash`
re-cited as `:1465-1477`.
