# AAR — U1 foundations and constitution review

AAR: SUCCESS — chunk U1 reviewed with 80 verdict rows, six findings, three P0
prose defects fixed, one P1 scheduled, two P3 recorded; all gates green.

## 1. What was supposed to happen

Execute `docs/plans/2026-11-14-unscoped-u1/plan.md` (v2, cold-reviewed,
stamped `planned`/`standard`/`fresh`, sha256 `7fabc4c6…`): build the
rule-to-check map for §1–§4, Appendix A, and Appendix M as 80 verdict rows,
resolve eleven pre-review candidates, disposition every finding in
`spec/audit/review-register.md`, fix bounded P0 prose defects, advance the
program record, and close with `session:close`. Done bar: 80 rows, terminal
dispositions, zero unfixed P0, green gates, no §5 body edits, no fingerprint
regeneration, no push.

Assumptions that were explicit: (a) the row budget is 80 (the cold pass
corrected it from 81); (b) the validator surface can be read in one pass;
(c) P0 fixes are prose corrections, not new predicates; (d) the increment is
one commit.

## 2. What happened

| Plan phase | Outcome | Evidence |
|---|---|---|
| 1 — mapping | 16-row mapping table built; `--sdd-strict` path traced; fingerprint sets read from `contract-fingerprint.ts:27,37-43`; parse-spec substrate and script-gate boundary verified | `review.md` mapping table; `npx tsx scripts/validate.ts --sdd-strict` → 0 errors |
| 2 — verdicts | 80 rows written; 6 findings, 74 `holds`, 8 `builder-side` | `grep -cE '^\| [0-9]+ \|' review.md` → 80 |
| 3 — triage/fix | F-U1-1, F-U1-2, F-U1-4 fixed (Appendix M :2847-2848; Standing Rule 10 :50-54; Appendix M :2947 and :2960-2963); F-U1-3 scheduled; F-U1-5/F-U1-6 Closed-P3 | `spec/audit/review-register.md` dated heading in all three sections |
| 4 — bookkeeping | `worklist.md:91` + exit evidence; roadmap trigger → U2; new P1 section; CHANGELOG entry | `npm run check-roadmap` exit 0 |
| 5 — gates | assemble, registers, roadmap, fingerprints, guarded co-change all exit 0; `check:fast` and close follow | logs in §2 of this file |

Deviations from the plan:

1. **`review.md` was written with verdicts in one pass**, not created empty
   first (T6 then T7–T15). No impact: the row budget was verified after
   writing, and each row cites its predicate.
2. **The finding-count parity check changed semantics.** The plan compared
   "verdict rows containing `finding:`" to register rows. Two findings share a
   row (F-U1-3 on rows 54 and 63) and two are single-row (F-U1-5, F-U1-6), so
   the honest check is distinct IDs: 6 on both surfaces. The plan's literal
   count (7 rows vs 6 IDs) would have failed for a correct artifact.
3. **No plan-text edit** was needed: every anchor and count the plan asserted
   survived execution except the row count, which the cold pass had already
   corrected.

Gate outcomes:

| Gate | Token | Verdict |
|---|---|---|
| plan-review | `plan-review passed.` | passed (2 conditions, both addressed: cold-pass isolation recorded; C-11 fixed in-increment) |
| independent-review | `independent-review FAILED.` → `independent-review passed.` | failed v1 (1 Blocker, 6 Majors, 7 Minors, 3 Nits), all resolved, diff re-review passed |
| build-review | token emitted late (see §4) | checks applied, emission late |
| validate (`--sdd-strict`) | 0 errors / 296 warnings | passed |
| `check:fast` | see §5 | passed |
| proofread | not run separately; `validate:sdd` proofreading is the pass | n/a |

## 3. What went right

- The cold pass paid for itself: it found the 81→80 row-arithmetic Blocker
  before execution, which would otherwise have failed done-bar item 1 at close.
- The review found three real prose defects, not hypotheticals:
  `action-conflicts` was documented as report-only while gated in both modes;
  Standing Rule 10 credited G4/G5 with a prompt-text check that neither
  performs; and the SDD list claimed a blocking severity where the validator
  warns.
- The candidate set was honest: five of eleven dissolved to `holds` when the
  predicate was read (rules 9 and 11, bloat reporting, `--dedicated`
  report-only semantics, Appendix A), and the review says so rather than
  inflating findings.
- Predicate-first discipline held: every finding cites `file:line` from the
  tree, and both P0 corrections were verified against `validate:sdd`
  (0 errors, warning count unchanged at 296, grade-12 warnings unchanged).

## 4. What went wrong

- **The `build-review passed.` token was emitted after the first edit.** The
  stamp was verified, the baseline read, and §§1–6 applied before editing, but
  the auditable contract line did not open Build mode as the skill requires.
  Recorded as SK-4 in the skill-findings register; the fix belongs to the
  skill's trigger wording and to routine discipline, not to this increment.
- **`changelog-before-commit` was not loaded** before writing the CHANGELOG
  entry; the entry follows the repo's existing dated-bullet style instead of
  the skill's reader standard. Recorded as the fourth instance of SK-1..SK-3
  (deduplicated rather than re-appended).
- **The plan's parity command was wrong** (count semantics, above). A plan
  that verifies a count should name the identity it compares, not just two
  greps.
- **One finding is weaker than the rest:** F-U1-6 (five subsections over the
  40-REQ advisory, no recorded review) is a corpus observation against a
  self-declared informational rule. It is Closed-P3 for that reason.

## 5. Session performance

- **Outcome vs done bar.** All seven items hold: 80 rows; every finding has a
  terminal disposition; zero unfixed P0; P1 on `ROADMAP.md` in admission
  shape; worklist and trigger advanced; gates green; no §5 edits, no
  fingerprints, no push.
- **Scope adherence.** No out-of-plan file was edited: the change set is the
  increment directory, the register, the program worklist, `ROADMAP.md`,
  three spec files (two of them one-hunk P0 corrections), the assembled spec,
  and the CHANGELOG. `scripts/**` and `holonovel/src/**` are untouched, which
  is what keeps the rollback cost at 1.
- **Verification quality.** The P0 corrections were checked against the
  validator's own output rather than by inspection alone; the 296-warning and
  three-grade-12-warnings invariants were captured before and after. The
  parity check was corrected when its arithmetic did not match the artifact.
- **Rework.** One review cycle (cold pass + diff re-review) and one
  verification cycle. No file was edited more than twice (the register and
  Appendix M each twice: entry plus P0 hunk).
- **Cost.** Roughly 55 tool calls in the execution session: 20 reads/greps for
  the mapping and probes, 8 edits, 8 gate runs, 4 writes. The review artifact
  is 80 rows of one line each — the budget the plan predicted.
- **User intervention.** None during execution; the user's only instruction
  was "execute plan".

## 6. Findings

Project findings all carry terminal dispositions in
`spec/audit/review-register.md` (three `Resolved`, one `Scheduled-roadmap`,
two `Closed-P3`). No project action item remains open.

Follow-through register:

| Item | Status |
|---|---|
| F-U1-1, F-U1-2, F-U1-4 (P0) | resolved in this increment |
| F-U1-3 (P1) | scheduled — `ROADMAP.md` § *REQ sentence-count enforcement (P1)* |
| F-U1-5, F-U1-6 (P3) | recorded, Closed-P3 |
| SK-4 (late build-review token) | open in the skill register; `skill-improvement-loop` owns it |
| SK-1..SK-3 (changelog skill miss) | open in the skill register; this session is a fourth instance, deduplicated |

Process failure: the `build-review passed.` line was not the first Build-mode
output. The gate's checks were applied before the first edit and no step ran
unreviewed, so the failure is in the audit trail, not the work; it is recorded
rather than retro-emitted.

Skill findings: 0 new records appended (SK-4 and SK-1..SK-3 already cover both
classes). Run `skill-improvement-loop` to triage the open records.

Invocation audit:

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `build-review` | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | no | miss (SK-1..SK-3) |

Invocation: 5 expected, 4 loaded, 1 miss.

LOOP PAUSED
