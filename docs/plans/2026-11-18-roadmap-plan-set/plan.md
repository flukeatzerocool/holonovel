# Plan — Roadmap plan set: an executable plan for each open roadmap item

**Date:** 2026-11-18 · **Kind:** planned · **Depth:** standard · **Revision:** 2 ·
**Increment:** `docs/plans/2026-11-18-roadmap-plan-set` · **Rollback cost:** 0 (five new
documents; no tracked file is edited) ·
**Evidence:** git HEAD `cc5e5a5`; tracked tree clean at plan time. Baseline readings on this tree:
`npm run check:fast` exit 0 (`46 passed, 0 failed`, trailing `check:fast: PASS`);
`npm run test:holosuite-mutation` exit 0 (`catch_rate=1 (12/12)`); `npm run status` — 4 open roadmap
items, 150 unpushed commits, version `2026.11.17`, latest tag `v2026.11.08`, last pipeline run
stopped at `record` (started 2026-11-16T16:53Z); `wc -l holonovel/src/index.ts` reads 17,857 while
`holonovel/AGENTS.md:59` still says 17,856 — a one-line doc drift the split stage re-measures and
corrects.
**Trust boundary:** every premise below is `repo` evidence read from this checkout. No web or
user-supplied content is embedded.
**Review history.** Revision 1 was read by one cold pass (stages 1–5 in one session, 47 reads
against a 40-read budget — the overrun is disclosed, and the four unread claims are listed in its
report as Unknowns rather than guessed). Verdict: `independent-review FAILED.` with three
Blockers — (1) the state-store artifact copy held a stale `plan.md` from another session, so the
gate hash and the reviewed text could diverge; (2) item 4's verification table encoded an
impossible line count, an off-by-one slice, and a contradictory 3,000-line expectation; (3) item
1's done bar spanned two sessions in one increment directory, which `docs/plans/README.md:35-37`
forbids — and seven Majors (four wrong `file:line` citations in this plan, F9 misattributed to the
split, item 2's mutant arithmetic landing at 33 not 35, item 5 closing a register row that does not
exist, the "numeric close condition" bar that two drafts could not meet, a strict `check-loop-
artifacts` invocation described as lenient, and item 2's `catch_rate=1 (34/35)`) plus ten Minors and
Nits. Revision 2 resolves all of them: the artifact is stamped from the reviewed bytes (D-note in
the review section), item 1 splits into increments A and B (`item-1a`, `item-1b`), item 4's range is
`:6528-7154` (627 lines) with a corrected slice and a V1 that states the 3,000-line target is
unmet, the four citations are re-read from the tree, item 2's arithmetic is 14 + 21 = 35, item 5
opens its own dated Resolved entry (D10), the close-condition bar is "falsifiable" rather than
"numeric", `check-loop-artifacts -- --lenient` is the in-flight invocation, and the counting,
citation-precision, and retain-or-delete ambiguities are settled on the page. The diff re-review
(10 reads, changed lines only) returned `independent-review passed.` with 0 Blockers, 0 unresolved
Majors, and 4 new Minors on changed lines — a propagated document count, one neighbouring range
boundary, one stale `--from-line` value, and two flat "sixteen" claims — all four fixed as a
condition-only amendment (no new file, no new gate, no destructive step), so the pass was not
re-run. That re-review read the text before those four edits; the stamp below covers the final
bytes.

## Questions

The request: "draft plan for open roadmap items," resolved with the maintainer to **planning
documents for all four items** — no execution of any item in this increment. `ROADMAP.md` carries
four scheduled sections (`:15-57`). This increment produces one executable plan per section — item 1
splits into two documents because its work cannot be one session (Blocker fix, revision 2) — each
carrying the evidence gathered here, its trigger status, its blast radius, and its own done bar, so
a later session can pick one up without repeating the research.

The drafts are numbered 1a, 1b, 2, 4, 5 because they follow ROADMAP section order: item 3 (REQ
evidence linkage) was retired on 2026-11-17 and its number is not reused.

## Why

- **EV1 — the four items are not interchangeable, and three of four have triggers that have not
  fired.** `ROADMAP.md:22` gates item 1 on "the first publish after 2026-11-16" (no publish has
  landed: 150 unpushed commits, last pipeline run stopped at `record`). Item 2 is gated on "the next
  Holosuite lens change" (`:33`). Item 4 is gated on "the next increment that moves more than 50
  anchors, or a week with more than 100 reads of one file" (`:44`) — no committed artifact measures
  reads (`spec/audit/loop-audit.md` measures the session and publication loops). Item 5 is gated on
  "the next artifact-registry change (REQ-620/REQ-621), or a request to move a codex library between
  hosts" (`:55`). Each draft therefore records the met-or-not status and the maintainer selection
  that overrides it, rather than dressing a selection up as a trigger (the form stage 1 of the split
  used, `docs/plans/2026-11-17-index-split-1/plan.md:45-50`).
- **EV2 — item 1's builder-side evidence is largely absent, and that changes the plan shape.** §10
  Phase 2 compares the verifier's evidence "against the recorded evidence" per workflow
  (`spec/07-independent.md:68-85`). `holonovel/DECISIONS.md` carries exactly one `@section evidence`
  record — the G7 `narrative_coherence` attestation at `:2511-2522`. No `@section evidence-g2`,
  `-g4`, `-g5`, `-g8`, and no H1–H18 record exists (`grep -n "@section evidence"` returns one line).
  No script implements H1–H18: the harness set (`holonovel/package.json:64-110`) has no handoff
  runner. The draft therefore splits the work into a builder-evidence session and an operator
  verifier session, and forbids authoring evidence that was not produced by a run.
- **EV3 — item 2's sample is small by construction, and two declared lanes are never computed.**
  `runMutationAudit` seeds 17 mutants, of which five are excluded as oracle-derived
  (`holonovel/scripts/lib/holosuite-mutation.ts:100-112`), leaving `seeded: 12`; the run reports
  `catch_rate=1 (12/12)`. At 12/12 a 95% Wilson interval is `[0.7575, 1.0000]` — width 0.2425.
  `GM_LANES` declares `world_population_failure` and `coupling_failure`
  (`playtest-lib.ts:305`), `JUDGMENT_GM_LANES` names both (`:308`), and `computeLenses` pushes to
  ten of the thirteen declared lanes (`holonovel/scripts/lib/playtest-lib.ts:366-431`) — never to
  `world_population_failure`, `coupling_failure`, or `wrong_tool` (`:307`) — so both GM lanes are
  permanently empty and contribute no mutant.
- **EV4 — item 4's next leaf is measurable now.** `index.ts` carries 19 section headers; stage 1
  removed the knowledge cluster (`:10318-11626`) leaving 17,857 lines. Measuring each candidate for
  closure under use (top-level declarations referenced outside their own range) gives: World-Model
  CRUD `:6528-7154` — 627 lines, one tool registration (`manage_world` at `:6593`), 22 index-local
  names used, one forward reference out (`MANAGE_WORLD_SCHEMA` at `:6536` read at `:7515`); World-
  Model Tools `:5547-6528` — 981 lines, `run_command` at `:5799`, seven *forward* references
  (`resolveIntentWorld` `:7190`, `presentIdsForLedger` `:7686`, `fireCountdown` `:7746`,
  `resolvePendingDiscoveries` `:7801`, `advanceSceneTransitionCountdowns` `:7882`,
  `effectiveWisdomItems` `:14941`, `badgeCanSeeWisdom` `:15036`); session/Novel lifecycle
  `:11761-12639` — 878 lines, 21 names; package surface `:12639-13800` — 1,161 lines, 29 names and
  three registrations. The CRUD block is the leaf with no forward-reference inversion.
- **EV5 — item 5's kind set is a closed union in four places.** `ArtifactKind` is
  `"novel" | "adventure" | "ruleset"` (`holonovel/src/core/artifact-registry.ts:16`), ordered by
  `KIND_ORDER` (`:54`), counted by `registryCounts` (`:188`); `manage_artifact`'s schema enumerates
  the same three (`index.ts:12969`), the install branch switches on them (`:13006`), and
  `spec_health` reports `artifacts_registered` (`:13965`). The exporter emits
  `{schema:"holonovel.codex/1", entries}` with no slug or title (`:15628`), while the action's
  `slug` parameter is optional and documented as "a pack without one adopts it" (`:12971`) — so a
  pack needs an envelope rule — the draft states one and rejects the alternative of changing the
  exporter contract (REQ-321o's byte-identity clause).
- **EV6 — the five drafts interact, so their order is a decision, not an accident.** Item 4's
  package-surface candidate range `:12639-13800` contains `manage_artifact` (`:12964`), which item 5
  edits. Item 2 touches the Holosuite libs only. Item 1 touches nothing but evidence and a report.
  The drafts record the ordering constraint in each plan's Dependencies section.

## Decisions

- **D1 — Scope: five plan documents plus this increment's own artifacts; no source, spec, or
  register change.** The drafts live beside this plan as `item-<n>-<slug>.md`. Forcing them into
  five increment directories would fail `check-loop-artifacts` (each directory would need its own
  `tasks.md` and `aar.md`, `scripts/lib/loop-artifacts.ts:70-90`). A later session re-homes its
  draft as `docs/plans/<date>-<slug>/plan.md`, stamps it, and amends only what the tree has changed
  since this evidence date.
- **D2 — Each draft carries measured evidence, not assumptions.** Counts in the drafts were
  produced in this session by the commands named there (line measurements by `node` over
  `holonovel/src/index.ts`, mutation composition by reading `holosuite-mutation.ts` and running
  `test:holosuite-mutation`, kind-set surface by grep over `holonovel/src`). A draft that states a
  count names how it was produced.
- **D3 — Each draft states its trigger status and the selection that overrides it.** EV1. A draft
  whose trigger has not fired says so in its first section; execution is a maintainer selection.
- **D4 — Each draft defines a falsifiable close condition before its work list: a number, or a
  named artifact set with a stated verdict.** Item 2's "useful confidence interval" becomes a
  computed criterion (width ≤ 0.15 and lower bound ≥ 0.85 at 95% Wilson); item 1's "report
  recorded" becomes a report path with eight required sections and one adjudication row per
  `DISPUTED` item; item 4 carries line counts and an anchor set; item 5 carries
  `counts.codex == 1` plus four refusal codes. Without this, "closes when the sample is large
  enough" is unfalsifiable — the finding the mutation item already carries
  (`spec/audit/review-register.md:3908-3910`).
- **D5 — No draft promises a green gate it cannot reach.** Item 1's verifier run may end
  `NOT VERIFIED`; its draft says the item still closes (the roadmap's close condition is that the
  report and adjudications are recorded) but adds a rule that a `NOT VERIFIED` verdict re-opens the
  finding rather than the item. Item 2's draft names the composition caveat (evaluator mutants
  measure the instruments) instead of claiming the interval describes oracle detection power.
- **D6 — Review independence is per-draft, at execution time.** This increment's review covers the
  drafts as documents (plan-review, one cold pass). Each executing session must re-stamp its own
  plan: the evidence here is dated, and a plan whose target lines have moved is not the plan that
  was reviewed. The drafts say this in their own header.
- **D7 — No spec edit and no new gate in this increment.** Nothing in `spec/` changes, so no
  fingerprint, coverage register, G7 attestation, or phase-map regeneration runs. Each draft that
  does need a spec edit names the full regeneration chain its own increment must run (item 5 does).
  Existing-check discovery: no draft adds a gate row or a manifest entry — item 2 changes only the
  internals of the advisory `test:holosuite-mutation` tier, item 5 rides the existing artifact,
  freshness, and surface gates, and items 1 and 4 add none.
- **D8 — Commit shape: one commit.** Five new documents plus this plan, `tasks.md`, and the AAR are
  one concern (the plan set). `session:close` runs the fast gate; the drafts are untracked until
  then, so `check-loop-artifacts -- --lenient` warns rather than errors while the increment is in
  flight (`scripts/lib/loop-artifacts.ts:71-75`; the plain form is strict and is run from P4 on).

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-18-roadmap-plan-set/plan.md` | this plan | M |
| `docs/plans/2026-11-18-roadmap-plan-set/tasks.md` | P1–P4 checklist | S |
| `docs/plans/2026-11-18-roadmap-plan-set/item-1a-handoff-evidence.md` | new plan (builder half of item 1) | M |
| `docs/plans/2026-11-18-roadmap-plan-set/item-1b-verifier-run.md` | new plan (operator half of item 1) | M |
| `docs/plans/2026-11-18-roadmap-plan-set/item-2-mutation-sample-depth.md` | new plan | M |
| `docs/plans/2026-11-18-roadmap-plan-set/item-4-index-split-stage-2.md` | new plan | M |
| `docs/plans/2026-11-18-roadmap-plan-set/item-5-codex-pack.md` | new plan | M |
| `docs/plans/2026-11-18-roadmap-plan-set/aar.md` | written at close (P4) | S |
| `CHANGELOG.md` | rendered from the AAR block by `session:close` | S |

Rollback: `rm -rf docs/plans/2026-11-18-roadmap-plan-set` and `git checkout -- CHANGELOG.md`
returns the tree to `cc5e5a5`. No tracked file outside the increment directory is edited, apart
from the CHANGELOG entry the close renders.

## Phases

- **P1 — Research (done before this plan was written).** Accept: each claim in EV1–EV6 resolves to
  the cited file:line or the named command output; the four trigger predicates are read from
  `ROADMAP.md` verbatim; the mutation composition is re-derived from
  `holosuite-mutation.ts:100-112` and matches the run's `12/12`; the line counts come from `wc -l`
  and the `node` closure measurement, not from the stage-1 plan's text.
- **P2 — Write the five drafts.** Each carries: header (date, kind, depth, revision, evidence,
  trust boundary, re-stamp note), Questions, Trigger status, Why (numbered evidence lines),
  Decisions with rejected alternatives, Blast radius table, Phases, Verification table, Done bar,
  Out of scope, Risks, Dependencies. Accept: every path in every draft exists on this tree
  (`test -e` per path) except the paths the draft proposes to create, which are marked *(new)*.
- **P3 — Self review and one cold pass.** Apply the plan-review checklist to the set; delegate the
  cold pass to `independent-review` with this artifact, its sha256, and the five drafts. Fix every
  Blocker and Major; record the review history in this header.
- **P4 — Close.** Write `aar.md` under `after-action-report` with the Changelog entry block and a
  terminal token; run `npm run check:fast` un-piped; `npm run session:close`. The drafts remain
  ROADMAP-tracked work — closing this increment retires no roadmap item.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `npm run check:fast` (un-piped, run last) | `46 passed, 0 failed` … `check:fast: PASS`; the in-flight increment may warn |
| V2 | `npm run check-loop-artifacts -- --lenient` (AAR does not exist until P4) | exit 0; a missing `aar.md` warns, not errors (`scripts/check-loop-artifacts.ts:13-15`) |
| V3 | `npm run check-roadmap` | pass; four sections, unchanged by this increment |
| V4 | `for f in item-*.md; do test -s "$f"; done` | five drafts non-empty |
| V5 | `grep -c '^\*\*Done bar\|^\*\*Done bar:' item-*.md` | one done-bar line per draft |
| V6 | `git status --porcelain` at close | only the increment directory and `CHANGELOG.md` |
| V7 | `npm run session:close` | one commit; subject from the AAR title |

## Done bar

**Done bar:** five plan documents exist under `docs/plans/2026-11-18-roadmap-plan-set/`, each
stating its trigger status, measured evidence, decisions with rejected alternatives, blast radius,
verification table, and a falsifiable close condition; no tracked source, spec, or register file is
edited; one cold pass has reviewed the set with no unresolved Blocker; `check:fast` is green;
`aar.md` ends `LOOP PAUSED`; the increment closes as one commit.

## Out of scope

- Executing any of the four items (D1). No `spec/`, `holonovel/src`, `holonovel/scripts`, or
  `ROADMAP.md` edit.
- Retiring a roadmap item: only an executing increment retires its item.
- Re-measuring the drafts' line numbers at execution time — the executing session does that itself
  (D6).

## Open questions

- None blocking. The one unresolved judgement is item 2's sample-size target: the draft fixes
  width ≤ 0.15 and lower bound ≥ 0.85 at 95% Wilson, which n=35 satisfies with zero or one miss
  (`[0.9011, 1.0000]` and `[0.8547, 0.9949]`). If the executing session finds fewer honest mutants
  than 35, it must either lower the criterion explicitly or schedule the remainder — it must not
  pad the set with repeated seeds (CR-32's tautology rule).
