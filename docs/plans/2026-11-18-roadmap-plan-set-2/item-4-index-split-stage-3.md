# Plan — ROADMAP item 4 (stage 3): the World-Model Tools block leaves `index.ts`

*(A draft for the executing session. Re-home it as
`docs/plans/<date>-index-split-3/plan.md`, re-measure the slice, the forward-reference set, and
the anchor partition, and stamp it — the evidence below is dated 2026-11-18 at HEAD `e8a87d4`,
and `index.ts` line numbers move whenever another stage lands.)*

**Kind:** planned · **Depth:** standard · **Rollback cost:** 1 (one file added, one slice deleted,
one import block edited, anchors repaired) ·
**Evidence:** `wc -l holonovel/src/index.ts` → 17,217; `npm run check:fast` 46/46 PASS;
`npm run check-anchors` → `predicates current`; slice, reference sets, and anchor partition
measured by `node` and `grep` over the tree in this session.
**Trust boundary:** `repo` evidence only.

## Questions

ROADMAP item 4 (`ROADMAP.md:36-50`): after stages 1 and 2 the item is one sentence — "Extract
leaf-first next: the World-Model Tools block (`run_command`, seven forward references), then
dispatch, the ruleset surface, and the synthesis router" (`:44-46`). This stage executes the first
half of that sentence: move the block to `src/tools/world-model.ts` with no behavioral change.

## Trigger status

- **Trigger:** "the next increment that moves more than 50 anchors, or a week with more than 100
  reads of one file" (`ROADMAP.md:49-50`). **Not met:** stage 2 moved 20 anchors, below the
  50-anchor arm, and no committed artifact measures reads (`spec/audit/loop-audit.md` covers the
  session and publication loops). Execution is therefore the maintainer's selection (this set),
  recorded as such.
- **Precedent:** a split stage is one commit passing the full harness (`test:all` 56/56)
  (`ROADMAP.md:47`).

## Why

- **EV1 — the slice is 980 lines, 26 declarations, one registration.** The block runs from its
  header comment (`index.ts:5524`) through the closing brace of its last helper (`:6503`);
  `6503 − 5524 + 1 = 980`. The `toolCtx` doc comment begins at `:6505`, outside the slice. The
  block registers exactly one tool, `run_command` (`:5776`) — the only `server.` call in the slice
  — and declares 26 top-level functions and consts.
- **EV2 — the slice calls host helpers bare, and the module head must supply them.** `audit` is
  called at `:5589` and defined at `:2963`; `ok` (`:3399`), `err` (`:3424`), `raw` (`:3605`), and
  `mergeScopedArgs` (`:3934`) are called the same way; `expireCountdown` (`:5647`) calls
  `fireCountdown`. Every one of the first five is a `toolCtx` member (`:6508-6509`), and
  `fireCountdown` is a dependency. So the module head is the stage-2 idiom —
  `const { audit, ok, err, raw, mergeScopedArgs, … } = ctx;` plus the two deps it uses — and the
  handler *bodies* are unchanged. The plan says "bodies unchanged", not "moved verbatim".
- **EV3 — two symbols leave the block.** `expireCountdown` is called at `:7103`, `:7255`, and
  `:11424`; `expireSurvivalWithUnit` at `:8156` — all four call sites outside the slice. Both are
  `function` declarations inside it, so the module exports them and `index.ts` imports them
  (`:7103` and `:7255` sit in the Narrative block, `:8156` in Countdowns, `:11424` in Novel
  lifecycle). A later stage carries the import along.
- **EV4 — seven forward references, and they converge on one function.** The block reads
  `resolveIntentWorld` (`:6553`), `presentIdsForLedger` (`:7049`), `fireCountdown` (`:7109`),
  `resolvePendingDiscoveries` (`:7164`), `advanceSceneTransitionCountdowns` (`:7245`),
  `effectiveWisdomItems` (`:14301`), and `badgeCanSeeWisdom` (`:14396`) — every one declared after
  the slice. Six are read inside `resolveSpatialThing` (`:5767`); `fireCountdown` is read inside
  `expireCountdown` (`:5647`). No top-level initializer inside the slice reads any of them, so no
  temporal-dead-zone hazard exists at registration time. All seven are `function` declarations,
  which are module-hoisted, so a plain object literal naming them is legal at the call site.
- **EV5 — `toolCtx` sits after the slice and must move up.** The literal is at `:6507` and its
  consumers are `worldCrudTools` (`:6517`) and `knowledgeTools` (`:9687`). Every one of its 24
  non-`knowledgeTools` members is declared before `:5524` (`state` `:172`, `configInt` `:417`,
  `pickParams` `:426`, `worldGenMaxRooms` `:466`, `WORLD_GEN_ROLES` `:472`,
  `generationObjectKind` `:491`, `validateGeneratedWorld` `:507`, `worldGenRoleOf` `:567`,
  `sanitizeGenerationText` `:575`, `sanitizeGenerationName` `:585`, `rollGenerationTable` `:593`,
  `wantsDetail` `:2179`, `rulesets` `:2185`, `memoryScoreInputs` `:2821`, `windowAwareVerdict`
  `:2842`, `audit` `:2963`, `ok` `:3399`, `err` `:3424`, `materializeAnnotations` `:3493`, `raw`
  `:3605`, `needInput` `:3622`, `seedWarningSuffix` `:3630`, `worldSnapshot` `:3885`,
  `mergeScopedArgs` `:3934`), and `knowledgeTools` is already behind a thunk (`:6514`). Hoisting
  the literal above `:5524` therefore changes no initialization order.
- **EV6 — the anchors need two declarations and no repath.** Nineteen anchors name
  `holonovel/src/index.ts`, in four files under `holonovel/scripts/lib/`:
  `holosuite-novel.ts` (`:10215`, `:10469`, `:10490`, `:11276`), `holosuite-adversarial.ts`
  (`:12`, `:10215`, `:10525`, `:11559`, `:12267`, `:12294`), `holosuite-conformance.ts`
  (`:216`, `:1889`, `:2648`, `:3424`, `:15757`), `holosuite-invariants.ts` (`:696`, `:4662`,
  `:9771`, `:10469`). Seven are before the slice, twelve at or after it, none inside it — so no
  anchor changes file and `--repath` never runs. But the import lines the module needs are new
  lines *above* the slice, so the delta is two-valued: `+k` for the seven, `k − 980` for the
  twelve. `refresh-predicates` takes one `--offset` per declaration with only a lower bound
  (`--from-line`), so the two bands are declared in two ordered runs (D5).
- **EV7 — the tool surface must not move.** `run_command`'s registration keeps its source position
  (the block's first line), so `tools/list` order is unchanged; `check-tool-surface`,
  `surface-budget`, and `surface-replay` are the gates that would notice if it did.
- **EV8 — the surface description is a tracked claim.** `holonovel/AGENTS.md:69-72` states the
  adapter's shape and the current line count ("`index.ts` is 17,217 lines after"), and `AGENTS.md`'s
  layer map describes `src/tools/`. Both need the post-move count and the new module; no gate reads
  these lines, so the update is manual and part of the increment.

## Decisions

- **D1 — New module `holonovel/src/tools/world-model.ts`, exporting
  `registerWorldModelTools(register, ctx, deps)`, `expireCountdown`, and
  `expireSurvivalWithUnit`.** The name follows `src/tools/world-crud.ts` (stage 2) and matches the
  block's own header. Handler bodies are unchanged (EV2): the module head destructures the `ctx`
  members the slice calls and the two deps `resolveSpatialThing` and `expireCountdown` need, and
  the registration call is rebound from `server.registerTool` to `register`.
  - Rejected: "the slice moves verbatim". It cannot compile without the head bindings (EV2), and
    a plan that says so would hand the implementer a false invariant.
- **D2 — The seven forward references arrive through a `WorldModelDeps` object.** The interface
  names the seven providers with their existing signatures; `index.ts` builds the literal at the
  registration site.
  - Rejected: `import { resolveIntentWorld, … } from "../index.js"` inside the module. That is a
    module cycle, which stages 1 and 2 exist to avoid (`src/tools/context.ts:1-11`).
  - Rejected: adding seven members to `ToolContext`. The context is the host-service seam —
    envelopes, audit, config, state — and these are feature helpers owned by later blocks.
  - Rejected: moving the seven providers first. Each lives in a block larger than this leaf
    (`resolve_intent` 120 lines, Narrative 787, Guidance 1,438), which inverts leaf-first.
- **D3 — `toolCtx` hoists above the block, and registration order is preserved.** EV5. The
  `worldCrudTools` and `knowledgeTools` calls stay where they are.
  - Rejected: moving the registration call down beside the current `toolCtx` position. That would
    reorder `run_command` after `manage_world` in `tools/list` and put the surface gates at risk.
  - Rejected: a second context literal for this module. Two literals drift; the stage-2 note in
    `src/tools/world-crud.ts:1-8` exists to prevent that.
- **D4 — Commit shape: one commit for the move plus its anchors.** The slice deletion, the import
  edit, the new module, the `AGENTS.md` counts, and the anchor repair are one mechanical change;
  splitting them leaves a tree where `check-anchors` fails. Stage 2 needed two commits because two
  removal sites created two deltas; this stage has one removal site plus one import insertion, and
  those are two *bands*, not two commits (D5).
- **D5 — The anchors are repaired in two ordered declarations, and both offsets are measured.**
  The net deltas are `+k` (import lines, for the seven pre-slice anchors) and `k − 980` (for the
  twelve post-slice anchors). Run, in this order:
  1. `npx tsx scripts/refresh-predicates.ts --write --offset <k−980> --path holonovel/src/index.ts --from-line 5524`
     — writes the twelve post-slice repairs, then reports the seven pre-slice anchors unresolved and
     **exits 1**. `--from-line` limits only which anchors receive the declared offset; a stale
     anchor outside the bound falls to the repath fallback
     (`scripts/refresh-predicates.ts:281-301`), which refuses ambiguity, and short symbols such as
     `err` are carried on many lines of a 17,000-line file. The writes at `:326` have already landed.
  2. `npx tsx scripts/refresh-predicates.ts --write --offset <+k> --path holonovel/src/index.ts`
     — writes the seven; the twelve already carry their symbols at their rewritten lines, so
     `refresh-predicates.ts:262` short-circuits them before the fallback.
  Step 1's non-zero exit is expected, not a failure: acceptance is the final
  `npm run check-anchors` reading `predicates current`, not each invocation's exit code.
  `npm run fix-anchors` is the same binary with `--write --repath` and is the wrapper to prefer
  when a repath is in play; here `--repath` never runs (no anchor changes file). `k` is counted
  from `git diff --numstat -- holonovel/src/index.ts` after staging, never predicted. The
  declaration order matters: a single global offset would be wrong for one band by 980 lines.
- **D6 — No behavior change, and the proof is the unchanged surface plus the full harness.** No
  handler body, schema, or message is edited. `test:all` (56 commands) and `typecheck` are the
  acceptance gates; `check-tool-surface` and `surface-replay` prove the registered surface did not
  move.
- **D7 — The roadmap item stays open.** Stage 3 retires nothing; the item closes when dispatch, the
  ruleset surface, and the synthesis router are extracted. ROADMAP admits 1–3 bullets per section
  (`ROADMAP.md:4-7`) and the section already carries three, so P5 **rewrites** the stage-history
  bullet to read "stages 1-2 landed 2026-11-17/18 (`docs/plans/2026-11-17-index-split-1`,
  `-18-index-split-2`); stage 3 landed <date> (`-<date>-index-split-3`, `index.ts` N lines)" rather
  than appending a fourth bullet.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/tools/world-model.ts` | *(new)* the 980-line slice, bodies unchanged, behind `registerWorldModelTools` | L |
| `holonovel/src/index.ts` | delete `5524-6503`; hoist `toolCtx`; add the import, the deps literal, and the registration call | M |
| `holonovel/scripts/lib/holosuite-novel.ts` | anchor offset | S |
| `holonovel/scripts/lib/holosuite-adversarial.ts` | anchor offset | S |
| `holonovel/scripts/lib/holosuite-conformance.ts` | anchor offset | S |
| `holonovel/scripts/lib/holosuite-invariants.ts` | anchor offset | S |
| `holonovel/AGENTS.md` | module list and the `index.ts` line count (`:69-72`) | S |
| `AGENTS.md` | the layer map's `holonovel/src` note, if it names the count | S |
| `ROADMAP.md` | the stage-history bullet rewritten (1–3 bullets per section) | S |
| `holonovel/DECISIONS.md` | dated design entry for the `WorldModelDeps` seam (D2) | S |
| `CHANGELOG.md` | rendered from the AAR block | S |
| `docs/plans/<date>-index-split-3/` | plan, tasks, AAR | S |

Rollback: `git checkout -- holonovel/src/index.ts holonovel/scripts/lib holonovel/AGENTS.md
ROADMAP.md holonovel/DECISIONS.md` plus deleting the new module returns the tree to the pre-stage
state. No generated artifact records source line positions, so nothing else re-derives.

## Phases

- **P1 — Re-measure the slice.** Re-run four measurements: slice bounds (`5524-6503`), 26
  declarations, the outbound/inbound reference sets, and the anchor partition per file. Accept: the
  measured slice equals the plan's or the plan is amended with the new bounds before any edit;
  every one of the seven providers is still a `function` declaration (if one became a `const`, its
  deps entry becomes a thunk and the amendment is recorded); every bare call inside the slice
  resolves to a `toolCtx` member or a dep (no third category).
- **P2 — Move.** Create the module with the slice's bodies; write the head destructure of `ctx` and
  deps; rebind the registration to `register`; export the two helpers; hoist `toolCtx`; build
  `WorldModelDeps` and call the registration at the old position; import the two helpers. Accept:
  `npm --prefix holonovel run typecheck` passes; `grep -c "server\." holonovel/src/tools/world-model.ts`
  reads 0; `grep -c "^const { .* } = ctx" holonovel/src/tools/world-model.ts` reads 1.
- **P3 — Surface and harness.** Run the surface trio and the full harness. Accept:
  `check-tool-surface`, `surface-budget`, and `surface-replay` pass with unchanged counts;
  `test:all` 56/56.
- **P4 — Anchors.** Count `k`, run D5's two declarations in order, run `check-anchors`. Accept:
  `predicates current`; `git diff --stat holonovel/scripts/lib` touches only anchor lines in the
  four files named in EV6.
- **P5 — Docs and close.** `AGENTS.md` counts, the DECISIONS seam note, the ROADMAP bullet rewrite;
  `check:fast` un-piped; AAR; `session:close`.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `wc -l holonovel/src/index.ts holonovel/src/tools/world-model.ts` | index drops by roughly 970 lines (980 removed, imports/deps/call added); the module is the slice plus its head and two exports |
| V2 | `npm --prefix holonovel run typecheck` | 0 errors |
| V3 | `npm run check-tool-surface`; `npm run surface-budget`; `npm run surface-replay` | pass; the same 37 listed tools in the same order |
| V4 | `npm --prefix holonovel run test:all` | 56/56 |
| V5 | `npm run check-anchors` | `predicates current` |
| V6 | `grep -c "server\." holonovel/src/tools/world-model.ts` | 0 — the block never used the server object except to register |
| V7 | `npm run check:fast` (un-piped, last) | `46 passed, 0 failed` … `check:fast: PASS` |
| V8 | `git status --porcelain` at close | only the planned files |

## Done bar

**Done bar:** `holonovel/src/tools/world-model.ts` holds the block's 26 declarations with their
bodies unchanged behind `registerWorldModelTools`, its head destructuring the `ctx` members the
slice calls and the two deps, and exporting the two outbound helpers; `index.ts` imports them,
hoists `toolCtx`, and registers `run_command` at the block's original position through a
`WorldModelDeps` object of the seven providers; the tool surface is byte-identical (37 tools, same
order) and `test:all` is 56/56; `check-anchors` reports `predicates current` after D5's two
measured declarations; the line counts in `AGENTS.md` are current; `check:fast` is green; `aar.md`
ends `LOOP PAUSED`; one commit.

## Out of scope

- Extracting dispatch, the ruleset surface, or the synthesis router (later stages).
- Any handler, schema, message, or ordering change (D6).
- Retiring ROADMAP item 4 (D7).
- Fixing unrelated findings in the slice. Anything noticed is recorded in the AAR, not fixed
  inline.

## Risks

| Risk | Mitigation |
|---|---|
| A bare call inside the slice resolves to neither `ctx` nor a dep | P1 enumerates every module-scope identifier the slice references before the move; a third category is an amendment, not a surprise |
| A forward reference is not hoisted as measured | P1 re-checks the declaration kind; a `const` becomes a thunk in the deps literal |
| The two anchor bands are collapsed into one offset | D5 runs two declarations in a stated order; `check-anchors` is the gate that proves it |
| Moving `toolCtx` changes initialization order | EV5 measures every member's declaration line; the only lazy member is already a thunk |
| Registration order shifts | The call keeps the block's position (D3) and V3 proves the surface order |
| The stage makes a later extraction harder | The deps object is stage-local and shrinks as providers move; D2 records that the ToolContext seam was deliberately not used |

## Dependencies

- Independent of items 1, 2, and 5: item 5 edits `12280-12560` and `:14988`, outside this slice. If
  item 5 lands first, this stage re-measures its slice bounds and its anchor delta.
- Stage 4+ (dispatch, ruleset surface, synthesis router) inherits the `WorldModelDeps` pattern for
  cross-block helpers.
