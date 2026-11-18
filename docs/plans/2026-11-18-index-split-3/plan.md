# Plan — index.ts split, stage 3: the World-Model Tools block leaves the entry point

**Date:** 2026-11-18 · **Kind:** planned · **Depth:** standard · **Revision:** 5 ·
**Increment:** `docs/plans/2026-11-18-index-split-3` · **Rollback cost:** 1 (reversible edit: one
file added, one slice removed, one object declaration changed, anchors repaired) ·
**Evidence:** git HEAD `817281d`; `holonovel/src/index.ts` unchanged since `e8a87d4`
(`git diff --stat e8a87d4 HEAD` touches only `CHANGELOG.md` and `docs/plans/`). All measurements
below were re-run at this HEAD.
**Baseline:** `npm run check:fast` exit 0 (`46 passed, 0 failed`, captured by the close of the
previous increment on this tree); `npm run check-anchors` exit 0 (`predicates current`);
`wc -l holonovel/src/index.ts` → 17,217; `npm run test:holosuite-mutation` exit 0 (`12/12`).
**Trust boundary:** every premise is `repo` evidence read from this checkout.
**Provenance and revision history.** Revision 1 re-homed the reviewed draft
`docs/plans/2026-11-18-roadmap-plan-set-2/item-4-index-split-stage-3.md` unchanged and claimed the
body needed no edit. The first cold pass of this increment rejected that claim: the block references
**sixteen** index-local identifiers that are neither `toolCtx` members nor the two providers the
draft named, three of them mutable (`let detailLevel`, `let playerRegister`, `let
roomDescriptionMode`) and five of them slice-only `let`s. Revision 3 decides the whole seam — a
14-identifier seam (an 18-member ports object, a `parserState` object that keeps the five slice-only
variables alive by reference, and four session accessors), a module-scope ports slot so
`expireCountdown` reaches `fireCountdown`, per-band measured anchor declarations replacing the
draft's predicted exit codes, and the removal of the unsupported claim that the surface gates prove
registration order. The re-review then caught two Majors in revision 3 — two table rows that were
comment text and a member-expression name rather than calls, and a ports count that did not
reconcile — both fixed as revision 4's condition-only amendment.

Revision 5 is an execution amendment. P2 showed that exporting the two helpers as module-level
functions forces the slice to module scope, where `ctx` is unbound (74 `audit`/`raw`/`err`/`ok` calls
would need prefixes, or a nullable module-scope context store). The module therefore returns the pair
from the factory — the stage-2 `registerWorldCrudTools` idiom — and `index.ts` binds the result, so
revision 3's module-scope ports slot and revisions 1-4's exported-helper interface are both
**superseded**; EV3, the blast-radius row, and V1 were amended with it. No contract, surface, or
behavior change, and the implementation was verified by `test:all` 56/56, an identical `tools/list`
capture, and the surface trio.

## Questions

ROADMAP item 4 (`ROADMAP.md:36-50`): after stages 1 and 2 the item reads "Extract leaf-first next:
the World-Model Tools block (`run_command`, seven forward references), then dispatch, the ruleset
surface, and the synthesis router" (`:44-46`). This stage takes the first half of that sentence.

The cold pass established that "leaf-first" was optimistic here: the block is not self-contained.
The stage is still worth doing — it removes 980 lines from a 17,217-line entry point and makes the
remaining `index.ts` reads of world-model state explicit — but its plan must carry the seam, not
defer it.

## Trigger status

- **Trigger:** "the next increment that moves more than 50 anchors, or a week with more than 100
  reads of one file" (`ROADMAP.md:49-50`). **Not met:** stage 2 moved 20 anchors; the read-count arm
  is unmeasured. Execution is the maintainer's selection (the plan set of 2026-11-18, item 4).
- **Precedent:** one split stage is one commit passing `test:all` 56/56 (`ROADMAP.md:47`).

## Why

- **EV1 — the slice, re-measured.** The block runs from its header comment (`index.ts:5524`) through
  the closing brace of `findMatchingThing` (`:6503`): `6503 − 5524 + 1 = 980` lines. It holds 26
  top-level declarations — 25 functions/consts plus `interface SpatialActor` (`:5756`) — and one
  registration, `run_command` at `:5776`. The `toolCtx` doc comment begins at `:6505`, outside the
  slice.
- **EV2 — fourteen index-local identifiers cross the seam, and the draft named two.** The scan is
  over parsed identifiers, not raw text: it drops comment text, drops property names of member
  expressions (`state.getActiveEntity()` is the `StateManager` method, not the top-level
  `function getActiveEntity`), and keeps only names that resolve to an `index.ts` top-level
  declaration outside the slice. It reports exactly fourteen, in source order. Three server helpers
  the slice calls bare — `getBadge` (`:5796`, `:5819`, `:5834`, `:5954`, `:5977`, `:6081`),
  `requireGM` (`:5989`), `requireNovel` (`:5792`, `:5825`, `:5830`, `:5930`) — are imported at
  `:66`, so they are not seam identifiers:

  | # | Identifier | Declared | Kind | Used elsewhere in `index.ts` | Disposition |
  |---|---|---|---|---|---|
  | 1 | `PLAYER_READONLY_VERBS` | `:413` | const Set | in the slice at `:5983` | ports (by reference) |
  | 2 | `currentBeat` | `:669` | function | in the slice at `:6114`; elsewhere `:6916`, `:7246`, `:7337`, `:15854` | ports |
  | 3 | `relationshipMarkers` | `:685` | const Map | in the slice at `:6124`; elsewhere `:1112`, `:1115`, `:1137`, `:7454`, `:7459` | ports (by reference) |
  | 4 | `activeLoreKeys` | `:984` | function | in the slice at `:6088` | ports |
  | 5 | `detailLevel` | `:2144` | `let` | in the slice at `:6088`; elsewhere `:2147-2151`, `:5328`, `:10155`, `:13465-13466`, `:15852` | session getter |
  | 6 | `playerRegister` | `:2148` | `let` | in the slice at `:5926`; elsewhere `:5341`, `:5346`, `:15853` | session getter |
  | 7 | `effectiveRoomDescriptionMode` | `:2149` | function | in the slice at `:6083`; elsewhere `:13484` | ports |
  | 8 | `roomDescriptionMode` | `:2155` | `let` | written in the slice at `:5947-5949`; read at `:2152` | session getter + setter |
  | 9 | `visitedRooms` | `:2157` | `let` | in the slice only | `parserState` field |
  | 10 | `visitedRoomNovel` | `:2158` | `let` | in the slice only | `parserState` field |
  | 11 | `lastCommand` | `:2161` | `let` | in the slice only | `parserState` field |
  | 12 | `lastReferencedThing` | `:2162` | `let` | in the slice only | `parserState` field |
  | 13 | `pendingAmbiguity` | `:2165` | `let` | in the slice only | `parserState` field |
  | 14 | `runWorldReactivityCycle` | `:2730` | function | in the slice at `:6124`; elsewhere `:7472` | ports |

  Rows 1-14 are the complete set under that scan; P1 re-runs it and must also report zero. Note that
  the three `let`s read outside the slice (`detailLevel`, `playerRegister`, `roomDescriptionMode`)
  must **not** be destructured or captured in a literal — that would freeze them at initialization
  and silently change behavior (`detailLevel === "rich"` at `:6088` is the concrete failure).
- **EV3 — two symbols leave the block.** `expireCountdown` is called at `:7103`, `:7255`, `:11424`;
  `expireSurvivalWithUnit` at `:8156`. Both are `function` declarations inside the slice and both are
  called from outside it, so the factory returns them (D1) and `index.ts` binds the result once
  (D5). `expireCountdown` itself calls `fireCountdown`, so the returned helper reaches that provider
  through the factory closure — not through a module-scope slot.
- **EV4 — the seven forward references are hoisted functions.** `resolveIntentWorld` (`:6553`),
  `presentIdsForLedger` (`:7049`), `fireCountdown` (`:7109`), `resolvePendingDiscoveries` (`:7164`),
  `advanceSceneTransitionCountdowns` (`:7245`), `effectiveWisdomItems` (`:14301`),
  `badgeCanSeeWisdom` (`:14396`) are all `function` declarations declared after the slice. Six are
  read in the `run_command` handler (`:5827`, `:5877`, `:6115`, `:6122`, `:6131`); `fireCountdown`
  is read in `expireCountdown`. No top-level initializer inside the slice reads any of them, so a
  ports literal naming them at the registration site is temporal-dead-zone safe.
- **EV5 — `toolCtx` sits after the slice and must move up.** The literal is at `:6507`; its
  consumers are `:6517` and `:9687`. All 24 non-`knowledgeTools` members are declared before
  `:5524` (max: `mergeScopedArgs` at `:3934`, which the slice never calls), and `knowledgeTools` is
  behind a thunk (`:6514`). Hoisting changes no initialization order.
- **EV6 — the anchors span three bands, because the edit changes line counts in three places.** The
  imports added at the top shift every anchor below them by `α`; converting the five `let`s at
  `:2156-2165` into one `parserState` declaration changes the file above the slice by `δ`; and the
  registration site replaces 980 lines with a ports literal plus a call, a delta of `β − 980`. So
  anchors before `:2156` shift by `α`, anchors at or after `:2156` and before `:5524` shift by
  `α + δ`, and anchors at or after `:5524` shift by `α + δ + β − 980`. The nineteen anchors live in
  four files under `holonovel/scripts/lib/` (`holosuite-novel.ts` 4, `holosuite-adversarial.ts` 6,
  `holosuite-conformance.ts` 5, `holosuite-invariants.ts` 4). Their bands: **one** below `:2156`
  (`:12`), **six** in `[2156, 5524)` (`:216`, `:696`, `:1889`, `:2648`, `:3424`, `:4662`), **twelve**
  at or after `:5524`, none inside the slice. The three deltas are measured after staging, never
  predicted; if `δ` measures 0 (the conversion happens to be line-neutral) the first two bands
  coincide and the plan runs two declarations instead of three, recorded as an amendment.
- **EV7 — no gate asserts tool order, and the plan says so.** `scripts/check-tool-surface.ts` compares
  taxonomy, action sets, and counts (`:126-129`, `:196-228`); it has no positional assertion, and
  neither do `surface-budget` or `surface-replay`. Registration order is therefore preserved by
  construction (the call stays at the block's first line) and is proved by a throwaway
  `tools/list` capture before and after the move, not by those gates.
- **EV8 — the surface description is a tracked claim.** `holonovel/AGENTS.md:69-72` states the
  adapter's shape and the current line count; `AGENTS.md`'s layer map describes `src/tools/`. Both
  need the post-move numbers. No gate reads them.

## Decisions

- **D1 — New module `holonovel/src/tools/world-model.ts`, whose
  `registerWorldModelTools(register, ctx, ports)` returns `{ expireCountdown,
  expireSurvivalWithUnit }`.** This is the stage-2 idiom: `registerWorldCrudTools` returns the schema
  its callers still spread, so a factory that returns the helpers keeps every one of the slice's 74
  bare `audit`/`raw`/`err`/`ok` calls bare through the head destructure. The body is otherwise
  unchanged except for the identifiers D3/D2 rename.
  - Amended during execution (revision 5): revisions 1-4 had the module export the two helpers as
    top-level functions, which forces the slice's declarations to module scope, where `ctx` is not
    yet bound — that needs either 74 prefixes or a nullable module-scope context store.
  - Rejected: module-scope `let ctx` / `let ports` stores with exported helpers. It trades a
    compile-time binding for a runtime null hazard and rewrites 74 call sites.
- **D2 — An 18-member `WorldModelPorts` object carries everything else (EV2).** Four groups:
  - **Providers (12):** the seven forward references (EV4), plus `currentBeat`, `activeLoreKeys`,
    `effectiveRoomDescriptionMode`, `runWorldReactivityCycle`, and `relationshipMarkers` (the Map by
    reference).
  - **Constants (1):** `playerReadonlyVerbs` (the Set by reference; the slice never mutates it).
  - **Session accessors (4):** `detailLevel()`, `playerRegister()`, `roomDescriptionMode()`, and
    `setRoomDescriptionMode(v)`. Accessors rather than values, because the three are `let` bindings
    that code on both sides reads and (for the mode) writes.
  - **Parser state (1):** `parserState`, the object D3 defines, passed by reference.
  - Rejected: destructuring the mutable three. Capture-by-value would freeze `detailLevel` and
    silently change `:6088`'s behavior.
  - Rejected: importing `../index.js` (a module cycle).
  - Rejected: adding nineteen members to `ToolContext`. The context is the host-service seam;
    these are world-model helpers and session accessors.
- **D3 — The five slice-only `let`s become one `const parserState` object in `index.ts`.** `visitedRooms`,
  `visitedRoomNovel`, `lastCommand`, `lastReferencedThing`, and `pendingAmbiguity` (`:2156-2165`)
  become fields of `parserState`, declared where they are today and passed to the module by
  reference as D2's eighteenth member, so the module mutates the same state `index.ts` used to. The slice's ~35 references
  become `parserState.x`; nothing outside the slice reads them (EV2 rows 9-13), so no other call
  site changes.
  - Rejected: five getter/setter pairs on the ports object (ten members) to avoid touching the
    declarations. It is the same behavior with a worse interface.
  - Rejected: moving the variables into the new module. They are session state the entry point
    owns; moving them would make stage 4's session extraction harder, not easier.
- **D4 — D3's object conversion is the only edit outside the slice, and it is line-count-neutral
  enough to be one band.** `δ` in EV6 is `new lines − old lines` for `:2156-2165`, measured from
  `git diff -U0`.
- **D5 — The helpers reach `fireCountdown` through the factory's closure, and `index.ts` holds the
  result.** `const worldModelTools = registerWorldModelTools(server.registerTool, toolCtx, ports)`
  is bound at the block's original position, and the four call sites become
  `worldModelTools.expireCountdown(...)` (`:7103`, `:7255`, `:11424`) and
  `worldModelTools.expireSurvivalWithUnit(...)` (`:8156`) — all below the binding, so no slot exists
  and no null check is needed. (Amended in revision 5 with D1.)
  - Rejected: passing ports as an extra parameter to each helper call. Four signatures change and
    both functions are also called from inside the slice.
  - Rejected: a module-scope null slot. It is the failure mode this amendment removes.
- **D6 — Registration keeps the block's position, and order is proved by capture.** The call sits at
  the slice's first line, so `run_command` keeps its place in `tools/list`. Because no gate asserts
  sequence (EV7), P2 captures the tool-name order from a throwaway client under `/tmp/opencode`
  before the move and P3 captures it after; the two lists must be identical.
- **D7 — Commit shape: one commit.** The move, the object conversion, the imports, the docs, and the
  anchor repair are one mechanical change; splitting them leaves a tree where `check-anchors` fails
  or `typecheck` is red.
- **D8 — Anchors are repaired by measured per-band declarations, largest-magnitude first.** After
  staging, read the three deltas from `git diff -U0 -- holonovel/src/index.ts` (EV6), then:
  1. `--offset <α+δ+β−980> --path holonovel/src/index.ts --from-line 5524 --write` (12 anchors),
  2. `--offset <α+δ> --path holonovel/src/index.ts --from-line 2156 --write` (6 anchors),
  3. `--offset <α> --path holonovel/src/index.ts --write` (1 anchor: `:12`).
  `--path` is required, not optional: the tool's scope predicate is
  `offsetPath === path && recorded >= fromLine` (`scripts/refresh-predicates.ts:258`), so a
  declaration without `--path` leaves nothing in scope and silently degrades to the symbol search.
  The tool scopes a declaration by a lower bound only (`scripts/refresh-predicates.ts:258`) and
  short-circuits an anchor whose recorded line already carries the symbol (`:262`), so later runs
  leave earlier bands alone. An out-of-band stale anchor is not reported silently: it falls to the
  whole-file symbol search (`:282-289`), which repairs a unique symbol and reports an ambiguous one
  (`:284-288`). The plan therefore predicts no exit codes; the acceptance is the final
  `npm run check-anchors` reading `predicates current` plus a diff that touches only anchor lines.
- **D9 — No behavior change, and the proof is the harness plus the order capture.** No handler
  schema, message, or default changes. `test:all` (56 commands), `typecheck`, the surface trio (set
  and counts), and the D6 order capture are the acceptance gates.
- **D10 — The roadmap item stays open.** Stage 3 retires nothing; ROADMAP admits 1–3 bullets per
  section and the section already has three, so P5 **rewrites** the stage-history bullet rather
  than appending.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/tools/world-model.ts` | *(new)* the 980-line slice, bodies unchanged apart from D3/D4 renames, behind `registerWorldModelTools`, which returns the two helpers | L |
| `holonovel/src/index.ts` | delete the slice (`5534-6513` after the P2 conversion); replace it with the ports literal and the registration call; add the module import; convert `:2156-2165` to `parserState`; rewrite the four helper call sites; hoist `toolCtx` above the block | M |
| `holonovel/scripts/lib/holosuite-novel.ts` | anchor offsets (4 anchors) | S |
| `holonovel/scripts/lib/holosuite-adversarial.ts` | anchor offsets (6 anchors) | S |
| `holonovel/scripts/lib/holosuite-conformance.ts` | anchor offsets (5 anchors) | S |
| `holonovel/scripts/lib/holosuite-invariants.ts` | anchor offsets (4 anchors) | S |
| `holonovel/AGENTS.md` | module list and `index.ts` line count (`:69-72`) | S |
| `AGENTS.md` | the layer map's `holonovel/src` note, if it names the count | S |
| `ROADMAP.md` | the stage-history bullet rewritten | S |
| `holonovel/DECISIONS.md` | dated entry for the ports seam and the `parserState` object | S |
| `CHANGELOG.md` | rendered from the AAR block | S |
| `docs/plans/2026-11-18-index-split-3/` | plan, tasks, AAR | S |

Rollback: `git checkout -- holonovel/src/index.ts holonovel/scripts/lib holonovel/AGENTS.md
ROADMAP.md holonovel/DECISIONS.md` plus deleting the new module returns the tree to `817281d`. No
generated artifact records source line positions.

## Phases

- **P1 — Re-measure and capture.** Re-run the four measurements (slice bounds and declaration count,
  the parsed-identifier scan (comment text and member-expression property names excluded), the seven forward references and their consuming functions, the anchor
  partition per file). Capture the `tools/list` name order into `/tmp/opencode/tools-before.txt`.
  Accept: the scan reports 14 rows and no fifteenth; the three server helpers stay outside it
  because they are imported; the order capture is non-empty and in the server's own order.
- **P2 — Convert the parser state.** `:2156-2165` → one `parserState` object; adjust the slice's
  references in place (no move yet). Accept: `typecheck` 0 errors; `git diff -U0` shows only that
  block.
- **P3 — Move.** Create the module with the slice's bodies and the `ctx` destructure; add the ports
  interface; hoist `toolCtx`; build the ports literal and bind the factory result at the block's
  first line; rewrite the four helper call sites through it. Accept: `typecheck` passes;
  `grep -c "server\." holonovel/src/tools/world-model.ts` reads 0.
- **P4 — Surface, order, harness.** Run the surface trio; capture the order again and diff; run the
  full harness. Accept: surface trio passes with unchanged counts; `diff tools-before.txt
  tools-after.txt` is empty; `test:all` 56/56.
- **P5 — Anchors.** D8's three declarations, then `check-anchors`. Accept: `predicates current`;
  `git diff --stat holonovel/scripts/lib` touches anchor lines only.
- **P6 — Docs and close.** `AGENTS.md` counts, the DECISIONS entry, the ROADMAP bullet rewrite;
  `check:fast` un-piped; `mark-build`; AAR; `session:close`.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `wc -l holonovel/src/index.ts holonovel/src/tools/world-model.ts` | index drops by roughly 950 lines (980 removed, imports/ports/parserState conversions added); the module is the slice plus its head, the ports interface, and the factory's return |
| V2 | `npm --prefix holonovel run typecheck` | 0 errors |
| V3 | `diff /tmp/opencode/tools-before.txt /tmp/opencode/tools-after.txt` | empty — same tools in the same order |
| V4 | `npm run check-tool-surface`; `npm run surface-budget`; `npm run surface-replay` | pass; unchanged counts |
| V5 | `npm --prefix holonovel run test:all` | 56/56 |
| V6 | `npm run check-anchors` | `predicates current` after D8's three declarations |
| V7 | `grep -c "server\." holonovel/src/tools/world-model.ts` | 0 |
| V8 | `npm run check:fast` (un-piped, last) | `46 passed, 0 failed` … `check:fast: PASS` |
| V9 | `git status --porcelain` at close | only the planned files |

## Done bar

**Done bar:** `holonovel/src/tools/world-model.ts` holds the block's 26 declarations with their
bodies unchanged apart from the `parserState` and accessor renames, behind
`registerWorldModelTools(register, ctx, ports)`, and returns the two helpers from the factory; `index.ts` builds an 18-member ports literal, converts `:2156-2165` to
`parserState`, hoists `toolCtx`, and registers `run_command` at the block's original position; the
`tools/list` order is identical before and after; the surface trio and `test:all` 56/56 are green;
`check-anchors` reports `predicates current` after three measured declarations; the line counts in
`AGENTS.md` are current; `check:fast` is green; `aar.md` ends `LOOP PAUSED`; one commit.

## Out of scope

- Extracting dispatch, the ruleset surface, or the synthesis router (later stages).
- Extracting session-presentation state (`detailLevel`, `playerRegister`, `roomDescriptionMode`)
  into its own module. The ports accessors are the seam for this stage; a session-state module is a
  later, cleaner shape and this plan records it as the intended follow-up rather than doing it
  inline.
- Any handler, schema, message, or ordering change (D9).
- Retiring ROADMAP item 4 (D10).
- Fixing unrelated findings in the slice; anything noticed is recorded in the AAR.

## Risks

| Risk | Mitigation |
|---|---|
| A fifteenth external identifier is missed | P1's scan excludes comment text and member-expression property names, compares every remaining name against index's top-level declarations, `ctx`, the slice, and the import list, and must report exactly 14 (it did: 14) |
| Mutable state is captured by value | The three shared `let`s cross as accessors (D2) and the five slice-only ones cross as a shared object (D3); no ports member is a snapshot of a `let` |
| A helper is called before the factory returns | The binding is a `const` at the block's original position, above all four call sites; V5's harness exercises the countdown paths |
| The three anchor deltas collapse into one | D8 declares each band with a lower bound, measures each from `git diff -U0`, and gates on `check-anchors` |
| Registration order shifts silently | D6 captures the order before and after; no gate asserts sequence, so the capture is the proof |
| The stage grows beyond one session | P2 is independently green and reverts alone; P3-P5 are one mechanical edit and can be restarted from `git checkout` |

## Dependencies

- Independent of items 1, 2, and 5. Item 5 edits `index.ts:12280-12560` and `:14988`, outside this
  slice; if it lands first, this stage re-measures its bands.
- Stage 4+ inherits two shapes from this stage: the ports object for cross-block helpers and the
  `parserState` object as the first step of session-state extraction.
