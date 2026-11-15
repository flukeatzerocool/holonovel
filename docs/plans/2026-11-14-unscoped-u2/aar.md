# AAR — U2: build process and tooling review

AAR: **SUCCESS** — 35 verdict rows, 5 P0 prose defects found and fixed against
their predicates, one P3 closed, program record advanced, gates green.

## 1. What was supposed to happen

`docs/plans/2026-11-14-unscoped-u2/plan.md` (sha256 `a23db375`), reviewed at
standard depth with a fresh cold pass. The done bar: 35 verdict rows each
carrying a predicate; every non-`holds` row dispositioned in the review
register; all 12 candidates resolved; zero unfixed P0; the program record
advanced to U3; the gate set green after the AAR; no §5 REQ body change and no
push.

Explicit assumptions: §6 phases are builder-side unless they claim a
repository-mechanical check (D2); the map's hash covers its sources, not itself
(D6); §6.3/§6.4.2 are the only fingerprinted sections in scope (D5).

## 2. What happened

| Step | Result | Evidence |
|---|---|---|
| Phase 1 — mapping and reads | done | severity per consumer recorded; hooks, `version-bump`, `gate-run-manifest`, `spec-delta-classify` read |
| Phase 2 — 35 verdicts | done | `grep -cE '^\| [0-9]+ \|' review.md` → **35** |
| Candidates C-1…C-12 | all resolved | 5 became findings, 7 `holds` (C-3, C-4, C-6, C-7, C-8, C-9, C-11, C-12 — C-7's severity split to F-U2-6) |
| Phase 3 — triage and fix | done | 5 P0 fixed, 1 P3 recorded; 0 P1, 0 P2 |
| `npm run assemble` | exit 0 | wrote both artifacts; map hash → `308cd32d` |
| `npm run validate:sdd` | exit 0 | 0 errors, 296 warnings (286 registered — unchanged from baseline) |
| Register, worklist, roadmap | done | dated U2 heading in `Resolved` (5) and `Closed-P3` (1); trigger → U3 |
| CHANGELOG entry | done | `2026-11-14 — Build-process review: five spec claims corrected against their evidence` |

Deviations from the plan:

1. **A sixth finding was found outside the candidate list** (F-U2-1, the
   Holonovel coverage map). The plan's row 15 required a verdict and the
   predicate did not hold, so it became a finding. This is Phase 2 working as
   intended, not scope creep: the row was in the budget.
2. **No `build-order` run.** `D5` fires only on a §6.3/§6.4.2 edit; the fix set
   touched §6.4, §6.6, §6.7, and the map. `check-fingerprint-sync` is the
   evidence that this decision was safe.
3. **The plan was amended three times after its first stamp** (self-pass fixes,
   cold-pass Majors, then the three carried-forward conditions). The stamp was
   renewed each time; see findings below.

Loop closure: plan reviewed (`plan-review passed.`) → executed
(`build-review passed.`) → outcome verified (this AAR). The cold pass ran, then
the single permitted diff re-review, then a condition-only amendment. There was
no `spec-review` in this session (the deliverable is a review sweep, not a spec
change), so no `**Resolves:**` chain applies.

### Gate outcomes

| Gate | Token | Verdict |
|---|---|---|
| plan-review | `plan-review passed.` | passed (re-stamped 3×) |
| independent-review | `independent-review passed.` | passed (cold pass + 1 diff re-review, stages 5) |
| build-review | `build-review passed.` | passed (conditions C-1…C-3) |
| drift-report | not run as a skill | **Unknown** — the lens was applied inline per the plan |
| spec-review | n/a | not applicable |
| proofread | not run separately | covered by `validate:sdd` (0 errors; warnings unchanged) |

### Execution gates (step 19, run after this AAR existed)

| Gate | Command | Exit | Result |
|---|---|---|---|
| assemble | `npm run assemble` | 0 | map hash current (`308cd32d`) |
| registers | `npm run check-registers -- --strict` | 0 | structurally clean; 122 grandfathered rows unchanged |
| roadmap | `npm run check-roadmap` | 0 | admission rule satisfied |
| fingerprints | `npm run check-fingerprint-sync` | 0 | in sync — `D5` did not fire, as the fix set predicted |
| guarded co-change | `npm run check-guarded-rule-change` (staged) | 0 | no unacknowledged rule/validator co-change |
| container image | not invoked | n/a | only `check` (full) runs it; no `build-order` was needed |
| fast gate | `npm run check:fast` | 0 | **41 passed, 0 failed**, `check:fast: PASS` |

Conditions C-1…C-3 verified in the build: C-1 is moot (no regeneration needed,
and the gate confirms the fingerprints are in sync); C-2 ran in staged mode with
the fix set staged; C-3's version fields are unchanged.

## 3. What went right

- **The row budget was exact and countable.** 16 §6 subsections + 19 map units
  = 35, and the count survived the cold pass's independent recount. The verdict
  table is auditable by one command.
- **The candidate probes earned their keep.** C-10 ("probe that the table has
  six steps") found seven; C-5's arithmetic found the 8,000/9,200 split; C-2's
  read of `classifyDelta` found the Editorial/Patch inversion. Three of the five
  P0s came from candidates whose probe was written before execution.
- **The review gate caught the two ordering defects that would have blocked the
  close** — `build-order` before the AAR it needs, and `check-fingerprint-sync`
  before the only command that regenerates its input. Both were plan defects,
  not execution defects, and both were caught before the first edit.
- **The predicate rule held.** Every finding cites the condition that settles
  it, and every `holds` that retired a candidate cites the predicate that
  disproved the hypothesis (C-4, C-3). No hypothesis was carried into the
  register as a finding.
- **The prose budget did not move:** 296 warnings / 286 registered, identical to
  the pre-change baseline.

## 4. What went wrong

- **Two plan defects were found only by the reviewer, not the author.** The
  gate-ordering errors (M1, and the carried-forward C-1) were visible in the
  plan's own text — a conditional `build-order` sequenced before the AAR whose
  existence it requires. The authoring pass read the gate manifest but not the
  dependency between `check-loop-artifacts` and `build-order`'s full `check`.
  Blameless framing: the plan lacked a step that asks "does this gate depend on
  an artifact this plan produces later?"
- **A fix set was described as "≤12 lines" and ran to 26 changed lines** across
  two files (19 in `03-build.md`, 7 in the map). The budget was stated as an
  expectation, not enforced, and the overage is reflow, not extra claims — but
  the plan should have bounded *hunks*, not lines.
- **The CHANGELOG was written before the changelog skill was loaded** — the
  fourth session in a row (SK-1, SK-2, SK-3 all open for this same gap). The
  entry was rewritten to the skill's reader standard after loading it, which is
  rework that a routing step would have avoided.
- **The cold reviewer could not persist its own report**, so the parent wrote
  the artifact whose sha256 the gate then verified (SK-5). Then the report
  lacked the `independent-review passed.` token form, costing one extra reviewer
  round-trip and one re-stamp; and `mark-build` refused the report for lacking a
  bare `Plan sha256:` line (SK-8), so that line is now a **parent declaration**
  with its provenance stated directly beneath it rather than a reviewer claim.
- **A condition-only amendment was re-stamped after the cold pass**, which
  loosens the binding between the reviewed bytes and the stamped bytes: the
  stamp now certifies `a23db375` while the cold review saw `42c788cc` plus a
  documented delta. This is the skill's sanctioned route for condition-level
  fixes, but the audit chain now has a seam a reader has to follow through
  `cold-review.md`.

## 5. Session performance

- **Outcome vs done bar.** Met. 35 rows (verified by command), 5 findings
  dispositioned, 0 unfixed P0, program record advanced, no §5 body change, no
  push.
- **Scope adherence.** One finding beyond the candidate list (F-U2-1), on a row
  that was already budgeted. No file outside the blast radius was edited; the
  diff touches 8 tracked files exactly as the table predicted, plus
  `holonovel/holonovel.md`, which the plan added after the cold pass.
- **Verification quality.** Strong where it is countable: row count, warning
  count, fingerprint sync, register structure. Weaker where it is not: the
  "§6 phases are builder-side" judgement is an interpretation (D2) that no gate
  can confirm, and the drift-report lens was applied inline rather than by the
  named skill, so a second reader cannot re-derive the criteria from a skill
  contract.
- **Rework.** Three plan amendments, one CHANGELOG rewrite, one extra reviewer
  round-trip. No file was edited more than twice. The amendment cycle was
  necessary iteration; the changelog rewrite was avoidable thrash.
- **Cost and effort.** Roughly 90 tool calls and 3 subagent turns, with three
  review passes (self, cold, diff). The plan artifacts are ~700 lines for a
  change whose prose diff is 26 lines — proportionate for a review sweep, whose
  product *is* the record.
- **User intervention.** None during execution: the user authorized the plan and
  did not correct a step. The one judgement call surfaced to the user was the
  withheld cold-pass token, which the reviewer raised rather than the user.

## 6. Findings

Project findings are dispositioned in the review register; no new project action
items were raised by this AAR.

- **F-U2-1…F-U2-5** — fixed in this increment, `Resolved` in
  `spec/audit/review-register.md`.
- **F-U2-6** — P3, `Closed-P3` (warning-only map freshness predicates; no
  demonstrated failure). No follow-up.
- **Process finding (record-and-close).** A plan that schedules a conditional
  gate should state that gate's input dependencies in the same step. Not raised
  as a project item because `plan-review`'s M1 check already covers it and did
  fire; the remedy is the skill's existing check, not a new project gate.
- **Process finding (record-and-close).** The "≤12 lines" fix budget should be
  expressed as hunks. Record-and-close: the overshoot was reflow, and no claim
  was added beyond the five findings.

No P1 or P2 items. Nothing is scheduled on `ROADMAP.md` by this AAR; the next
chunk (U3) is already the roadmap trigger.

Skill findings: **2** SK records appended (`SK-10`, `SK-11`). Run
`skill-improvement-loop` to triage. The changelog recurrence above is already
covered by the open `SK-1`/`SK-2`/`SK-3` records and is not duplicated.

## 7. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `independent-review` | yes (delegated) | routed |
| `build-review` | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | yes, after the entry was written | miss (recurrence of SK-1/2/3) |
| `code-review` | no | miss (the chunk's declared lens) |
| `drift-report` | no | miss (the chunk's declared lens) |

`Invocation: 8 expected, 5 loaded, 3 misses`.

The two lens misses are routing-table gaps: the session's shape was "review a
spec surface against code", which the orchestrator maps to `drift-report` plus
`code-review`, and neither was named by the plan. Recorded as `SK-10` and
`SK-11`.

LOOP PAUSED
