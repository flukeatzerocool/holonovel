# AAR — Roadmap plan set 2

**AAR: SUCCESS** — six plan documents for the four open roadmap items, reviewed to a passing cold
token after two failed passes, stamped fresh at standard depth, with no roadmap item executed and no
tracked source, spec, or register file edited.

## 1. What was supposed to happen

The request was "draft plan for open roadmap items … you're allowed to re-review as many times as it
takes to complete the plan", resolved with the maintainer as **fresh planning documents for all four
items**, no execution, reviewed iteratively until no hard blocker remains (`plan.md` Questions, D1).

Done bar: six drafts, each stating its trigger status, measured evidence, decisions with rejected
alternatives, blast radius, verification table, and a falsifiable close condition; the plan names
its supersession of the earlier set; no tracked source/spec/register change; one cold pass with no
unresolved Blocker; `check:fast` green; `aar.md` ends `LOOP PAUSED`; one commit.

## 2. What happened

| Step | Result |
|---|---|
| P1 research | Baseline measured (`check:fast` 46/46, mutation 12/12, anchors current, 4 open items, 155 unpushed). Item 4 re-derived from the tree (slice `5524-6503`, 26 declarations, 2 outbound helpers, 7 forward references, 19 anchors in four files); item 5's union sites and spec lines re-measured after stage 2 shifted the file by 640; item 2's composition re-derived (12 of 17); item 1's writable evidence set bounded by §9's homes and the record parser |
| P2 drafts | Five documents first (1a/1b, 2, 4, 5) |
| P3a preflight | 7 targets present and untracked, 5 REQs matched, 0 external paths |
| P3b cold pass r1 | `independent-review FAILED.` — 6 Blockers, 19 Majors, 13 Nits |
| Revision 2 | Six Blockers and all Majors addressed, including a split of item 1b into kit-dispatch and report steps |
| P3b cold pass r2 | `independent-review FAILED.` — 1 new Blocker (item 5's single anchor offset), 3 Majors, 2 Nits |
| Revision 3 | Blocker and Majors fixed; ROADMAP citations de-drifted; kit restructured as `handoff/` + spec + prompt |
| P3b cold pass r3 | `independent-review passed.` — 0 Blockers, 1 Major, 3 Nits |
| Amendment | The 4 remaining findings fixed as a condition-only amendment (text only: no new file, no new gate, no destructive step) |
| P3c stamp | `plan_gate_stamp` → `verdict: passed`, `independence: fresh`, `depth: standard`, stages 5 |
| P4 gates | `check:fast` 46/46 PASS (before and after the set landed) |

Deviations from plan: the plan expected one cold pass and one diff re-review; the work required three
cold passes because each of the first two found a real execution-blocking defect. The user
pre-authorized that ("re-review as many times as it takes"), and the third pass passed.

### Gate outcomes

| Gate | Token | Verdict |
|---|---|---|
| plan-review / spec-plan | `plan-review passed.` | passed (after two failed cold passes) |
| independent-review | `independent-review passed.` (r3; r1 and r2 `FAILED.`) | passed |
| build-review | — | not run (no build: planning increment) |
| drift-report | — | not run (no drift question asked) |
| spec-review | — | not run (no spec change) |
| proofread | — | not run (no prose deliverable outside the drafts) |

## 3. What went right

- **The cold passes earned their cost, twice, on the same class of error.** r1 caught a
  "moved verbatim" claim that could not compile and an anchor repair aimed at the wrong directory; r2
  caught that item 5's own insertions straddle the two anchors it was repairing — the same
  false-invariant class, one draft later. Neither was visible from inside the authoring context.
- **Every count was measured, not assumed.** The slice bounds, declaration count, forward-reference
  set and their two consuming functions, the per-file anchor partition, the union sites, the mutant
  composition, and the four Wilson values all reproduced under independent re-derivation.
- **The split of item 1 into three steps is what made its done bar reachable.** The r1 verdict that a
  bar spanning an operator session and a verifier session is not a bar was correct, and the fix
  (1a evidence / 1b kit / 1c report) also resolved the H-record contradiction.
- **Trigger honesty held.** All four triggers are unfired; each draft says so and names the
  maintainer selection instead of dressing a selection up as a trigger.

## 4. What went wrong

- **The plan-gate's sequencing contradicts the skill's.** `plan-review` §0 says to persist the
  artifact *before* reviewing it, but `stamp-plan --independence self --depth standard` refuses with
  "standard depth requires a cold pass or a recorded risk acceptance". The session worked around it
  by preflighting, reviewing, then stamping `fresh` — which is what the gate wants but not what the
  prose says. Recorded as SK-33.
- **A passing token with a Major has no defined amendment path.** The contract sanctions a
  condition-only amendment beside a *failing* report (fix, re-stamp, let build-review verify) but is
  silent on a *passing* pass that leaves a Major; the session applied the same rule and disclosed it
  in the plan header. Recorded as SK-34.
- **ROADMAP line citations drifted by +2 during a rewrite.** Revision 2 rewrote the container plan and
  moved every citation down two lines while the quoted text stayed correct; r2 caught it. The cause
  is editing prose around a numbered list without re-reading the target file.
- **The revision-1 drafts cited line numbers the tree had already moved.** The earlier set's item 5
  draft was measured at `cc5e5a5`; 640 lines left `index.ts` before this session. Re-measuring was
  done up front, but the first draft still carried one stale invariant (the slice's end line, off by
  two) until the cold pass measured it.
- **A no-op risk in scripted edits.** Two Python replacement helpers initially mis-shaped their
  arguments and one `assert` caught it; the pattern is the same one that silently no-opped last
  session. The fix is the assert-per-replacement this session used throughout.

## 5. Session performance

- **Outcome vs done bar.** Met: six drafts (1a, 1b, 1c, 2, 4, 5) with trigger status, measured
  evidence, decisions with rejected alternatives, blast radius, verification table, and falsifiable
  close conditions; supersession recorded; no source/spec/register edit; a passing cold token fixed to
  the artifact; `check:fast` 46/46 twice; AAR ends `LOOP PAUSED`.
- **Scope adherence.** One item — item 1 — grew from two documents to three. That was review-driven
  (a bar spanning two sessions), not scope creep, and the container plan records it.
- **Verification quality.** The strong checks were the ones that could fail: the cold pass's own
  re-derivation, the anchor identity grep, the mutation composition, and the preflight target
  existence. The weak check was prose-claim verification by grep, which is where the citation drift
  hid until a reviewer re-read `ROADMAP.md`.
- **Rework.** `plan.md` was rewritten twice, `item-4` twice, `item-5` twice, `item-1b` replaced once
  (split). Roughly two-thirds of the rework traces to review findings rather than thrash.
- **Cost.** About 60 authoring tool calls plus three cold reviewer sessions (55 / 21 / 15 reads, the
  first over the standard budget of 40 and disclosed by the reviewer). Three cold passes is the price
  of a plan an executing session can pick up without re-deriving its evidence; it is also the
  strongest signal that the first draft was not ready.
- **User intervention.** One scoping question (scope and depth) and one authorization to re-review
  without the standard cap; no corrections after that.

## 6. Findings

**Project action items: zero.** The four roadmap items stay scheduled with their triggers; each
draft is the plan a future session executes. Triage of what the session observed:

- **P3 — record-and-close.** The drafts' evidence is dated to HEAD `e8a87d4`; each draft instructs the
  executing session to re-measure and re-stamp. No action beyond that instruction.
- **P3 — record-and-close.** `refresh-predicates` exits 1 when an out-of-band stale anchor is
  ambiguous, after writing the in-band repairs. The drafts now state this rather than assuming a
  clean exit, so no guard is needed.
- **P3 — record-and-close.** The r3 reviewer recorded `index.ts:15757` as "consistent with the
  `prompt` symbol" rather than line-precisely verified; item 5's executing session re-measures it
  before stamping.

**Process failure: none.** Every gate that ran produced a token; no change was made outside the
plan's file list; no destructive or remote operation ran.

**Skill findings: 2 SK records appended (SK-33, SK-34).** Two earlier findings recurred and are
recorded here rather than as duplicate rows: SK-31 (the diff re-review protocol assumes a previous
artifact, and these increments are untracked and edited in place — second and third instances), and
the SK-18/SK-24/SK-26 `changelog-before-commit` miss (fourth instance; the entry was authored as the
AAR block instead).

Run `skill-improvement-loop` to triage SK-33 and SK-34.

## 7. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `independent-review` (via subagent) | yes, three dispatches | routed |
| `after-action-report` | yes | routed |
| `build-review` | no | n/a — planning increment, no build or commit |
| `changelog-before-commit` | no | miss (fourth instance of the SK-18 class) |

Invocation: 5 expected, 4 loaded, 1 miss.

## Changelog entry

**Title:** Roadmap plan set 2: six executable plans for the four open items, reviewed cold

**Summary:** `ROADMAP.md`'s four remaining sections each get a plan an executing session can pick up: the operator-bound §10 verification as three steps (builder evidence, verifier kit, report and adjudication), the mutation sample measured against a named population, the third `index.ts` split stage with its seam and anchor bands measured, and the `codex pack` kind with its admission rule. Two cold passes failed before a third passed; all six Blockers and nineteen Majors were resolved.

- `item-1a-handoff-evidence.md`: the writable evidence set is bounded by §9's declared homes and the record parser, and H10/H12/H13 require (6) records
- `item-1b-verifier-kit.md`: the kit is three top-level entries — the H14 `handoff/` directory, the spec, and the verbatim prompt — so H14 stays testable
- `item-1c-report-adjudication.md`: the report's nine sections, the recomputed REQ-274 score, and one adjudication row per `DISPUTED` item; a non-VERIFIED verdict still retires the item and opens a dated roadmap entry
- `item-2-mutation-sample-depth.md`: the aggregate seeded set closes the item at n ≥ 35 with width ≤ 0.15; the lens-only interval is published as under-powered because nine lenses cap it at seven mutants
- `item-4-index-split-stage-3.md`: the 980-line block moves behind `registerWorldModelTools` with the `ctx` destructure stated, a `WorldModelDeps` object of seven hoisted providers, and two measured anchor declarations across two line bands
- `item-5-codex-pack.md`: a pack is the exporter's payload verbatim plus an optional declared hash excluded from the hash input; four refusals across two codes, and two anchor declarations straddling the increment's own insertions
- Every draft states its trigger status (all four unfired), a falsifiable close condition, and the rebase rule against the others
- `check:fast` 46/46 before and after; no `spec/`, `holonovel/src`, or register file changed; the plan is stamped fresh at standard depth

LOOP PAUSED
