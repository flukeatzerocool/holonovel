# AAR — Roadmap plan set

**AAR: SUCCESS** — five plan documents for the four open roadmap items, reviewed to a passing cold
token, with no roadmap item executed and no tracked file changed outside the increment.

## 1. What was supposed to happen

The request was "draft plan for open roadmap items," resolved with the maintainer to **planning
documents for all four items**, no execution (`plan.md` Questions, D1). The plan's done bar: five
drafts, each stating its trigger status, measured evidence, decisions with rejected alternatives,
blast radius, verification table, and a falsifiable close condition; no tracked source/spec/register
change; one cold pass with no unresolved Blocker; `check:fast` green; `aar.md` ends `LOOP PAUSED`;
one commit. The plan was reviewed before execution (plan-review, standard depth, one cold pass plus
one diff re-review).

## 2. What happened

| Step | Result |
|---|---|
| P1 research | Evidence gathered for all four items: trigger texts read verbatim; mutation composition re-derived (17 mutants / 5 oracle-derived / 12 seeded); four `index.ts` candidate ranges measured for closure; artifact-kind union sites enumerated; item 1's evidence audit (one `@section evidence` record, no H1–H18 harness) |
| P2 drafts | Five documents written (item 1 split into 1a/1b after review) |
| P2a paths | Preflight: 4/4 targets present and untracked, 0 missing, 3 REQs; 10/10 non-target paths probed with `test -e` |
| P3 self review | Four citation and premise defects fixed before dispatch |
| P3a cold pass | `independent-review FAILED.` — 3 Blockers, 7 Majors, 10 Minors; all resolved |
| P3b diff re-review | `independent-review passed.` — 0 Blockers, 0 unresolved Majors, 4 new Minors (fixed as a condition-only amendment) |
| Stamp | Fresh stamp, stages 5, no conditions; artifact identity re-bound after the stale-copy discovery |
| P4 close | AAR + `check:fast` + `session:close` |

Deviations from plan: none of scope. The plan's blast radius listed four drafts and one item-1 file;
the review's Blocker 3 split item 1 into two documents, so the blast radius grew by one file. That is
a plan-review-driven amendment, recorded in `plan.md`'s review history, not an improvised change.

### Gate outcomes

| Gate | Token | Verdict |
|---|---|---|
| plan-review / spec-plan | `plan-review passed.` | passed |
| independent-review | `independent-review passed.` (r2; r1 `FAILED.`) | passed |
| build-review | `build-review passed.` | passed |
| drift-report | — | not run (no doc-drift question asked) |
| spec-review | — | not run (no spec change) |
| proofread | — | Unknown (not invoked; no prose deliverable outside the drafts) |

## 3. What went right

- **The cold pass earned its cost.** It found a verification table that could not go green (item 4's
  V1 demanded "no file above 3,000" beside `index.ts ≈17,230`), an off-by-one verbatim slice that
  would have failed a *correct* move, and a done bar spanning two sessions — none of which the self
  pass caught.
- **Every count in the drafts was measured, not assumed.** The mutation composition, the block
  closure, the anchor partition (7/1/12), and the kind-union sites all reproduced under the
  reviewer's independent re-derivation.
- **The register's own history was used as a pre-flight.** SK-27 named the missing `Plan sha256:`
  binding line, so the report was amended and re-stamped *before* `mark-build` could refuse.
- **Trigger honesty held.** Three of four items have unfired triggers; each draft says so and names
  the maintainer selection instead of dressing it as a trigger.

## 4. What went wrong

- **The state directory held a stale `plan.md`.** `stamp-plan` writes a timestamped copy, but the
  repo-keyed directory still carried another session's plan under the name `plan.md`; the cold
  reviewer opened that path and reviewed the wrong document until it cross-checked the sidecar. Root
  cause: preflight writes evidence into a directory whose `plan.md` is not necessarily the current
  plan. Recorded as SK-30.
- **Three patch replacements silently no-opped.** Text edits applied through exact-string replacement
  without an assertion left a stale "nine forward references" and an unfixed lane claim in `plan.md`;
  the reviewer caught the second and a later sweep caught the first. The process gap: a patch helper
  that cannot report "pattern not found" reads as applied. Now fixed by asserting each replacement.
- **The diff re-review had no previous artifact to diff against.** The plan is untracked and was
  edited in place, so r1's bytes existed only in the reviewer's memory and the evidence sidecar.
  The session substituted a finding→fix table with current quotations. Recorded as SK-31.
- **Item 4's arithmetic was written from an inclusive-range habit** (6528–7155 read as 627 lines
  while the string implied 628), which produced three inconsistent sites. Caught by the cold pass.

## 5. Session performance

- **Outcome vs done bar.** Met: five drafts, each with a falsifiable bar; no source/spec/register
  change; one cold pass ending in a pass; `check:fast` 46/46 twice (before and after the set landed);
  AAR ends `LOOP PAUSED`; one commit planned.
- **Scope adherence.** No roadmap item was executed, by design (D1). No scope creep beyond the
  review-mandated split of item 1.
- **Verification quality.** The strong checks were the ones that could fail: preflight's target
  existence, the mutation run, the anchor partition, and the reviewer's own recomputation. The weak
  check was prose-claim verification by grep, which is where the silent no-ops hid.
- **Rework.** `plan.md` was edited four times, `item-4` three times, `item-5` twice. All but one round
  trace to review findings, not thrash; the one self-inflicted round is the no-op patch class (§4).
- **Cost.** Roughly 75 tool calls and two cold-reviewer sessions (r1: 47 reads against a 40 budget,
  disclosed; r2: 10/10). The budget overrun in r1 is a reviewer-side cost, not a plan defect.
- **User intervention.** One scoping question was asked and answered (planning documents for all four
  items); no corrections after that.

## 6. Findings

**Project action items: zero.** The four roadmap items stay scheduled with their triggers; each
draft is the plan a future session executes. Triage of what the session observed:

- **P3 — record-and-close.** The drafts' evidence is dated to HEAD `cc5e5a5`; each draft says the
  executing session re-measures and re-stamps. No action beyond that instruction.
- **P3 — record-and-close.** `holonovel/AGENTS.md:59` says `index.ts` is 17,856 lines while `wc -l`
  reads 17,857. Item 4's stage 2 corrects it; opening a one-line docs commit now would add a
  publication for a number the next split stage rewrites.
- **P3 — record-and-close.** `plan.cold/report-r1.md` and `fixes-r2.md` are process artifacts inside
  the increment; they are committed as evidence, not as deliverables.

**Process failure: none.** Every gate that ran produced a token; no change was made outside the
plan's file list; no destructive or remote operation ran.

**Skill findings: 2 SK records appended (SK-30, SK-31).** Both are harness contracts, not project
defects. The `changelog-before-commit` miss is the fifth instance of SK-18 / SK-24 / SK-26 and is
recorded here rather than as a duplicate row.

## 7. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `independent-review` (via subagent) | yes | routed |
| `build-review` | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | no | miss (same gap as SK-18/24/26; entry authored as the AAR block) |

Invocation: 6 expected, 5 loaded, 1 miss.

## Changelog entry

**Title:** Roadmap plan set: an executable plan for each open item, reviewed cold

**Summary:** `ROADMAP.md`'s four remaining sections each get a plan an executing session can pick up:
the operator-bound §10 verification (split into a builder-evidence increment and a verifier run), the
mutation sample measured to a Wilson interval criterion, the next `index.ts` leaf measured for closure
under use, and the `codex pack` kind with its admission rule. The set was cold-reviewed: the first
pass failed on three Blockers and seven Majors, all fixed, and the diff re-review passed.

- `item-1a-handoff-evidence.md` / `item-1b-verifier-run.md`: §10 is two increments, because
  `holonovel/DECISIONS.md` carries one `@section evidence` record and no H1–H18 harness exists, so
  Phase 2 has almost nothing to compare against until the record is written
- `item-2-mutation-sample-depth.md`: "a useful confidence interval" becomes a number (95% Wilson
  width ≤ 0.15, lower bound ≥ 0.85 at n ≥ 35); the two judgment lanes are never computed today, so
  the sample grows by making them deterministic plus 21 evaluator fault/control pairs
- `item-4-index-split-stage-2.md`: the next leaf is the World-Model CRUD block (`:6528-7154`, 627
  lines, three top-level declarations, one forward reference), not the cluster the roadmap names
  next; 13 anchors repair by one `--offset` and one `--repath`
- `item-5-codex-pack.md`: a pack is the exporter's payload verbatim, so REQ-321o's byte-identity
  clause is untouched; the kind adds one admission branch, a canonical-JSON hash rule, and a refusal
  for duplicate slugs
- Each draft carries its trigger status (three of four have not fired), a blast radius, a
  verification table, a falsifiable close condition, and its rejected alternatives
- The cold pass found a verification table that could not go green, an off-by-one verbatim slice,
  and a done bar spanning two sessions; the diff re-review found four changed-line Minors
- `check:fast` 46/46 before and after; no `/spec`, `holonovel/src`, or register file changed

LOOP PAUSED
