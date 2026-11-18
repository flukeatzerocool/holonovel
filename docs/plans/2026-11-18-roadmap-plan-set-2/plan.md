# Plan — Roadmap plan set 2: an executable plan for each open roadmap item

**Date:** 2026-11-18 · **Kind:** planned · **Depth:** standard · **Revision:** 3 ·
**Increment:** `docs/plans/2026-11-18-roadmap-plan-set-2` · **Rollback cost:** 0 on the
plan-review scale (0 pure add, 1 reversible edit, 2 destructive) — nine new documents, and no
tracked file outside the increment directory is edited except the CHANGELOG the close renders ·
**Evidence:** git HEAD `e8a87d4`, tracked tree clean at plan time. Baseline readings on this tree:
`npm run check:fast` exit 0 (`46 passed, 0 failed`, trailing `check:fast: PASS`);
`npm run test:holosuite-mutation` exit 0 (`PASS mutation: 12 passed, 0 failed`,
`catch_rate=1 (12/12)`); `npm run check-anchors` exit 0 (`predicates current`); `npm run status` —
4 open roadmap items, 155 unpushed commits, version `2026.11.18`, latest tag `v2026.11.08`, last
pipeline run stopped at `record` (started 2026-11-16T16:53Z); `wc -l holonovel/src/index.ts`
reads 17,217.
**Trust boundary:** every premise below is `repo` evidence read from this checkout. No web or
user-supplied content is embedded.
**Review history.** Revision 1 was read by one cold pass (`independent-review`, five stages plus a
readiness gate, six fresh reviewer contexts, 55 reads — the standard budget is 40 and the depth cap
is 80, so the overrun is disclosed). Verdict: `independent-review FAILED.` with six Blockers and
nineteen Majors. Revision 2 resolved all of them: the slice became `5524-6503` (980 lines) with the
`ctx` destructure stated; the anchor band became four files under `holonovel/scripts/lib/`, repaired
by the writing wrapper; item 5 gained an anchor row and a `check-anchors` row; the H-record question
was settled in item 1a's favour; item 1 split into a kit-dispatch step and a report step; and item
2's close condition named its population. The second cold pass re-reviewed the diff and returned
`independent-review FAILED.` on one new Blocker (item 5's single offset could not serve two deltas),
three Majors, and two Nits. Revision 3 resolved them and the third pass returned
`independent-review passed.` with no remaining hard blocker, one Major, and three Nits; those four
were fixed as a condition-only amendment (no new file, no new gate, no destructive step), so the
pass was not re-run per `plan-review`'s amendment rule. The amendment set: item 5's D10 now states
that its first declaration is expected to write one band and exit 1 with the other unresolved (the
acceptance is the final `check-anchors`), the Risks row that still said "one offset", this header's
revision number and artifact citations, and item 1b's two loose clauses about the handover note and
the redacted DECISIONS.md. The stamped bytes therefore differ from the bytes the third pass read
only by those four amendments.

**Review artifacts.** The plan gate's evidence sidecar is
`/home/fluke/.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/plan.evidence.json`;
it is regenerated from these final bytes at stamp time, so its `planSha256` field is the stamped
value. The cold reports are
`cold-report-r1.md` (sha256 `4e2c50826bfdca6ece440ef38821d551703d969fa7bec2baa21901b41fc27a74`),
`cold-report-r2.md` (sha256 `4dd7b7a293c0be4a60e9bce6b9a34a76d429c42058c5ae5fbb5477e93238038c`), and
`cold-report-r3.md` (sha256 `cc370d08c9424f181e0bc3633c019f262664d76c8c7d6cfbdc4a9b8f105ea319`), all
in that directory. The state directory also holds a stale `plan.md` from another session; it is not
this artifact.

## Questions

The request: "draft plan for open roadmap items," resolved with the maintainer to **fresh planning
documents for all four open items** — no execution of any item in this increment — reviewed
iteratively until no hard blocker remains (`plan-review`, standard depth).

`ROADMAP.md` carries four scheduled sections (`:15-62`): independent verification (§10) (P1),
mutation-sample depth (P2), split `index.ts` (P2), and `codex pack` as an artifact kind (P3).
This increment supersedes `docs/plans/2026-11-18-roadmap-plan-set/` (commit `0fd600c`) as the
executable plan set, because one of its five drafts has since been executed and the tree under the
remaining four has moved.

The drafts are numbered 1a, 1b, 1c, 2, 4, 5: they follow ROADMAP section order, and item 3 (REQ
evidence linkage) was retired on 2026-11-17 without its number being reused. Item 1 needs three
documents because its work crosses two sessions and one operator/verifier boundary: 1a produces the
builder evidence, 1b assembles and dispatches the verifier kit, and 1c receives the report and
closes the item.

## Why

- **E1 — the prior set is spent in part, and stale in part.** `0fd600c` produced five drafts. Its
  `item-4-index-split-stage-2.md` was executed by `136c770` + `524b10f` + `e8a87d4` (stage 2:
  `index.ts` 17,857 → 17,217, `src/world/generation-types.ts` and `src/tools/world-crud.ts`
  created). The other four drafts' evidence is dated to `cc5e5a5`, and every `index.ts` line
  number in `item-5-codex-pack.md` moved when 640 lines left the file (re-measured below).
  Reusing those documents would hand an executing session line numbers that no longer resolve.
- **E2 — the four items still stand, and all four triggers are unfired.** `ROADMAP.md:22` gates
  item 1 on "the first publish after 2026-11-16" — no publish has landed (155 unpushed commits; the
  last pipeline run stopped at `record`). Item 2 is gated on "the next Holosuite lens change"
  (`:33`). Index-split is gated on "the next increment that moves more than 50 anchors, or a week
  with more than 100 reads of one file" (`:49-50`); stage 2 moved 20 anchors and no committed
  artifact measures reads. Item 5 is gated on "the next artifact-registry change
  (REQ-620/REQ-621), or a request to move a codex library between hosts" (`:60-62`). Each draft
  records the met-or-not status and the maintainer selection that overrides it.
- **E3 — item 4's next leaf is now measurable.** Stage 2 removed the CRUD block; the World-Model
  Tools block is now `index.ts:5524-6503` (980 lines: `6503 − 5524 + 1`), carrying 26 top-level
  declarations and running `run_command`'s registration at `:5776`. The `toolCtx` doc comment
  begins at `:6505`, immediately after the block. The slice has two outbound dependencies
  (`expireCountdown` used at `:7103`, `:7255`, `:11424`; `expireSurvivalWithUnit` at `:8156`) and
  seven inbound forward references — `resolveIntentWorld` (`:6553`), `presentIdsForLedger`
  (`:7049`), `fireCountdown` (`:7109`), `resolvePendingDiscoveries` (`:7164`),
  `advanceSceneTransitionCountdowns` (`:7245`), `effectiveWisdomItems` (`:14301`),
  `badgeCanSeeWisdom` (`:14396`). All seven are declared after the block; six are read inside
  `resolveSpatialThing` (`:5767`) and `fireCountdown` inside `expireCountdown` (`:5647`). Nineteen
  anchors name `holonovel/src/index.ts` — seven before the slice (`:12`, `:216`, `:696`, `:1889`,
  `:2648`, `:3424`, `:4662`), twelve at or after it (`:9771` … `:15757`), none inside it. They live
  in four files under `holonovel/scripts/lib/`: `holosuite-novel.ts`, `holosuite-adversarial.ts`,
  `holosuite-conformance.ts`, `holosuite-invariants.ts`.
- **E4 — item 5's union sites all moved, and one constraint surfaced.** `ArtifactKind` is
  `"novel" | "adventure" | "ruleset"` (`holonovel/src/core/artifact-registry.ts:16`), ordered by
  `KIND_ORDER` (`:54`), concatenated by `buildArtifactRegistry` (`:56-62`), scanned by
  `scanRulesets` (`:156`), and counted by `registryCounts` (`:188-191`); `RegistrySources`
  (`:45-52`) carries `novelsDir`, `adventureDirs`, `rulesets`, `rulesetHash`. In `index.ts` the
  `kind` enum is `:12329`, `artifactRegistry()` builds the sources at `:12280-12292` (so
  `inboxSourcePath`, declared `:12294`, sits below the insertion point), the install branch switches
  at `:12374` (novel), `:12457` (adventure), `:12522` (ruleset), removal at `:12531`, `spec_health`
  reports `artifacts_registered` at `:13325`, and the exporter emits
  `{schema: "holonovel.codex/1", entries}` at `:14988`. The harness has 23 cases
  (`grep -c "await test(" holonovel/scripts/test-artifact-registry.ts`). Spec sites: REQ-620
  `spec/02-requirements.md:2562`, REQ-621 `:2564`, T738 `spec/appendices-reference.md:2100`, T739
  `:2101`, T792 `:2153`.
- **E5 — item 2's composition is 12 of 17 declared cases, and the two judgment lanes are still
  empty.** `LENSES` holds nine names (`holonovel/scripts/lib/playtest-lib.ts:301-304`); `GM_LANES`
  holds four (`:305`) and `JUDGMENT_GM_LANES` names the two judgment lanes,
  `world_population_failure` and `coupling_failure` (`:308`). `MUTANTS` expands to thirteen entries
  (eight lens mutants, the two judgment-lane mutants, and three invariant mutants,
  `holosuite-mutation.ts:103-108`); `CONTRACT_MUTANTS` adds four (`:137-163`); `ORACLE_DERIVED`
  excludes five (`:100`), leaving `seeded = 12` (`:201`), which the run prints as `12/12`. The nine
  lenses yield at most seven derived lens mutants even after both judgment lanes become
  deterministic, so a lens-only interval cannot reach a useful width without new spec lenses.
- **E6 — item 1's evidence set is bounded by §9's homes and by the record parser.** The spec
  declares nine evidence homes in §9 — `grep -o "evidence-g[0-9]*[ab]*" spec/06-artifacts.md`
  returns `g0a, g0b, g2, g3, g4, g5, g6, g8`, and G7's home is the `narrative_coherence`
  attestation. `holonovel/DECISIONS.md` carries one record (G7, `:2511-2522`).
  `checkEvidenceRecordContract` (`scripts/lib/req-checks.ts:984-1040`) requires every bare
  `@section evidence` marker to carry six labelled bullets, a workflow token matching
  `^(G0a|G0b|G[2-8]|H(?:1[0-8]|[1-9]))\b` (`:992`), an ISO-8601 timestamp (`:993`), a
  `pass`/`fail` value, and a sub-check enumeration; `scripts/validate.ts:3005` runs it on every
  `validate`. Because the token pattern admits `H` steps and H10/H12/H13 require entries in (6),
  H-step records are writable as well — they simply have no §9 *home*, which the home check
  requires only for G workflows.
- **E7 — the §10 verifier's redaction target is the evidence section, not a numbered heading.**
  `spec/06-artifacts.md:11-19` defines DECISIONS.md's six sections by marker, and (6) is the
  "verification workflow evidence organized in sub-sections" block. The shipped
  `holonovel/DECISIONS.md` carries no `## (1)`…`## (6)` headings (its sixteen `##` sections are
  topic-dated). Item 1a therefore names the redaction set by content, and 1b redacts that set.
- **E8 — the drafts share two tracked surfaces, and only item 4 and item 5 share source.** Items
  1c, 2, 4, and 5 all edit `ROADMAP.md`; items 1c, 2, and 5 edit
  `spec/audit/review-register.md`; the shared source region is `index.ts`, where item 4 moves
  `5524-6503` and item 5 edits `12280-12560` and `:14988`. Nothing in stage 3's slice is read by
  `manage_artifact`, so either may land first; each draft states the rebase rule instead of
  assuming isolation.

## Decisions

- **D1 — Scope: six item drafts plus this increment's own plan, tasks, and AAR; no source, spec, or
  register change.** The drafts live beside this plan as `item-<n>-<slug>.md`. Forcing each into
  its own increment directory would fail `check-loop-artifacts` (every directory needs its own
  `tasks.md` and `aar.md`). A later session re-homes its draft as
  `docs/plans/<date>-<slug>/plan.md`, stamps it, and amends only what the tree has changed since
  this evidence date.
- **D2 — New increment, not an edit of the prior set.** `0fd600c` is committed with its own
  `aar.md`, its item-4 draft is spent, and amending a closed increment would rewrite accepted
  history. The new set is `docs/plans/2026-11-18-roadmap-plan-set-2/`; this plan names the
  supersession so a reader cannot execute a stale draft by mistake.
- **D3 — Each draft carries measured evidence, not assumptions.** Every count in the drafts was
  produced in this session by the command named beside it (line measurements by `node` over
  `holonovel/src/index.ts`, the mutant composition by reading `holosuite-mutation.ts` and running
  the tier, the anchor partition by grepping `holonovel/scripts/lib` for
  `anchor("holonovel/src/index.ts"`).
- **D4 — Each draft states its trigger status and the selection that overrides it.** E2. A draft
  whose trigger has not fired says so in its first section; execution is a maintainer selection.
- **D5 — Each draft defines a falsifiable close condition before its work list.** Item 2's
  "useful confidence interval" becomes a named population with a computed width and lower bound;
  1c's "report recorded" becomes a path with nine required sections and one adjudication row per
  `DISPUTED` item; item 4 carries line counts and an anchor set; item 5 carries `counts.codex == 1`
  plus four labelled refusals.
- **D6 — Item 4's seam is chosen, not discovered.** Four constraints measured in E3 decide it: the
  block registers `run_command` at a fixed source position the tool surface must preserve;
  `toolCtx` currently sits after the block (`:6507`) and every one of its 24 non-`knowledgeTools`
  members is declared before `:5524` (max: `mergeScopedArgs` at `:3934`); the slice's bare calls
  (`audit` `:5589`, `ok`, `err`, `raw`, `mergeScopedArgs`) are all `toolCtx` members, so the
  module head destructures `ctx` exactly as `src/tools/world-crud.ts:22` does; and the seven
  forward references are `function` declarations, so a dependency object may name them at the call
  site. The draft therefore (a) hoists `toolCtx` above the block, (b) passes a `WorldModelDeps`
  object, (c) exports the two outbound helpers, and (d) states that handler bodies are unchanged
  rather than the text being "moved verbatim" with one rebinding.
  - Rejected: importing `../index.js` from the new module (a module cycle).
  - Rejected: adding seven members to `ToolContext` (feature helpers would become a permanent
    part of the host-service seam).
  - Rejected: moving the seven providers first (each lives in a block larger than this leaf).
- **D7 — No draft promises a green gate it cannot reach.** 1c may record a `NOT VERIFIED` verdict:
  the item still closes (the roadmap's close condition is that the report and adjudications are
  recorded), and a non-VERIFIED verdict opens a dated roadmap entry naming each failing workflow;
  the *finding* stays open rather than being re-opened as an item. Item 2 publishes a lens-only
  interval that is under-powered by construction and says so, instead of presenting the aggregate
  interval as oracle-detection evidence.
- **D8 — Review independence is per-draft, at execution time.** This increment's review covers the
  drafts as documents (plan-review, standard depth, one cold pass). Each executing session must
  re-stamp its own plan: the evidence here is dated, and a plan whose target lines have moved is
  not the plan that was reviewed. The drafts say this in their own header.
- **D9 — No spec edit and no new gate in this increment.** Nothing in `spec/` changes, so no
  fingerprint, coverage register, G7 attestation, or phase-map regeneration runs. Each draft that
  does need a spec edit names the full regeneration chain its own increment must run (item 5 does).
  Existing-check discovery: no draft adds a gate or a manifest row — item 2 changes the internals
  of the advisory `test:holosuite-mutation` tier, item 5 rides the existing artifact, freshness,
  surface, and anchor gates, and items 1 and 4 add none.
- **D10 — Commit shape: one commit.** Nine new documents plus the AAR are one concern (the plan
  set). `session:close` runs the fast gate; the drafts are untracked until then, so
  `check-loop-artifacts -- --lenient` warns rather than errors while the increment is in flight;
  the plain form runs from P4 on.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-18-roadmap-plan-set-2/plan.md` | this plan | M |
| `docs/plans/2026-11-18-roadmap-plan-set-2/tasks.md` | P1–P4 checklist | S |
| `docs/plans/2026-11-18-roadmap-plan-set-2/item-1a-handoff-evidence.md` | new plan (builder evidence) | M |
| `docs/plans/2026-11-18-roadmap-plan-set-2/item-1b-verifier-kit.md` | new plan (kit assembly and dispatch) | M |
| `docs/plans/2026-11-18-roadmap-plan-set-2/item-1c-report-adjudication.md` | new plan (report intake and closure) | M |
| `docs/plans/2026-11-18-roadmap-plan-set-2/item-2-mutation-sample-depth.md` | new plan | M |
| `docs/plans/2026-11-18-roadmap-plan-set-2/item-4-index-split-stage-3.md` | new plan | M |
| `docs/plans/2026-11-18-roadmap-plan-set-2/item-5-codex-pack.md` | new plan | M |
| `docs/plans/2026-11-18-roadmap-plan-set-2/aar.md` | written at close (P4) | S |
| `CHANGELOG.md` | rendered from the AAR block by `session:close` | S |

Rollback: before the close commit, `rm -rf docs/plans/2026-11-18-roadmap-plan-set-2` and
`git checkout -- CHANGELOG.md` return the tree to `e8a87d4`. After the commit, the reversal is
`git revert <sha>`. No tracked file outside the increment directory is edited, apart from the
CHANGELOG entry the close renders.

## Phases

- **P1 — Research (done before this plan was written).** Accept: each claim in E1–E8 resolves to
  the cited `file:line` or the named command output; the four trigger predicates are read from
  `ROADMAP.md` verbatim; the mutation composition is re-derived from `holosuite-mutation.ts` and
  matches the run's `12/12`; the `index.ts` measurements come from `node` over the file and
  `wc -l`, not from the stage-2 plan's text; the anchor partition comes from the source grep over
  `holonovel/scripts/lib`.
- **P2 — Write the six drafts.** Each carries: header (date, kind, depth, revision, evidence, trust
  boundary, re-stamp note), Questions, Trigger status, Why (numbered evidence lines), Decisions with
  rejected alternatives, Blast radius table, Phases, Verification table, Done bar, Out of scope,
  Risks, Dependencies. Accept: every path in every draft exists on this tree (`test -e` per path)
  except the paths the draft proposes to create, which are marked *(new)*.
- **P3 — Review.** Three ordered steps, because the plan gate refuses a standard-depth self stamp:
  - **P3a — Preflight.** Run `plan-gate.mjs preflight` over the target list and the cited REQs;
    write the evidence sidecar and cite it in this header.
  - **P3b — Self pass, then one cold pass.** Apply the plan-review checklist (including
    `references/spec-project-checks.md`) to the set, then delegate the cold pass to
    `independent-review` with the artifact paths, their sha256 values, the sidecar path, the target
    list, and the standards. Persist the cold report outside the tree and record its path and hash
    here. Fix every Blocker and Major; re-review the diff once.
  - **P3c — Stamp.** Call `plan_gate_stamp` with `kind: planned`, `independence: fresh`,
    `depth: standard`, the reviewer label, the cold-report path, its sha256, and stages 5. This is
    the increment's first stamp; nothing earlier is re-stamped.
- **P4 — Close.** Write `aar.md` under `after-action-report` with the Changelog entry block and a
  terminal token; run `npm run check:fast` un-piped; `npm run session:close`. The drafts remain
  ROADMAP-tracked work — closing this increment retires no roadmap item.

## Verification

| # | Command / check | Expected |
|---|---|---|
| V1 | `npm run check:fast` (un-piped, run last) | `46 passed, 0 failed` … `check:fast: PASS`; the in-flight increment may warn |
| V2 | `npm run check-loop-artifacts -- --lenient` (AAR does not exist until P4) | exit 0; a missing `aar.md` warns, not errors |
| V3 | `npm run check-roadmap` | pass; four sections, unchanged by this increment |
| V4 | `for f in item-*.md; do test -s "$f"; done; ls item-*.md \| wc -l` | six drafts, all non-empty |
| V5 | `grep -c '^\*\*Done bar:\*\*' item-*.md` | one done bar per draft (6) |
| V6 | `node /home/fluke/.config/opencode/skills/plan-review/scripts/plan-gate.mjs status --project .` | one stamped plan at `independence: fresh`, `depth: standard`, stages 5 |
| V7 | `git status --porcelain` at close | only the increment directory and `CHANGELOG.md` |
| V8 | `npm run session:close` | one commit; subject from the AAR title |

## Done bar

**Done bar:** six plan documents exist under `docs/plans/2026-11-18-roadmap-plan-set-2/`, each
stating its trigger status, measured evidence, decisions with rejected alternatives, blast radius,
verification table, and a falsifiable close condition; the plan names its supersession of
`2026-11-18-roadmap-plan-set`; no tracked source, spec, or register file is edited; one cold pass
has reviewed the set and its Blockers are resolved with a diff re-review recorded; the plan is
stamped fresh at standard depth; `check:fast` is green; `aar.md` ends `LOOP PAUSED`; the increment
closes as one commit.

## Out of scope

- Executing any of the four items (D1). No `spec/`, `holonovel/src`, `holonovel/scripts`, or
  `ROADMAP.md` edit.
- Retiring a roadmap item: only an executing increment retires its item.
- Amending or deleting the prior plan set (D2).
- Re-measuring the drafts' line numbers at execution time — the executing session does that itself
  (D8).

## Open questions

- None blocking. Three judgements are recorded for the executing sessions rather than resolved
  here: how many of the eight G workflows have a runnable command (`item-1a-handoff-evidence.md`
  D1 — a workflow with no runnable command is a named finding, not a pass), whether item 2 can
  reach n ≥ 35 aggregate cases without padding (`item-2-mutation-sample-depth.md` D2), and whether
  a codex pack should ever carry a declared hash (`item-5-codex-pack.md` D3 accepts one but the
  exporter never emits it).
