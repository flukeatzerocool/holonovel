# AAR — index.ts split, stage 3

**AAR: SUCCESS** — the `run_command` world-model surface (980 lines) left `index.ts` for
`src/tools/world-model.ts` behind an explicit ports seam, with no behavioral change: `test:all`
56/56, an identical `tools/list` order capture, and the surface trio unchanged.

## 1. What was supposed to happen

ROADMAP item 4's third stage, executed from the plan set of 2026-11-18: extract the World-Model
Tools block (`index.ts:5524-6503`, 980 lines, 26 declarations, one registration) into its own module
with no behavior change, repair the evidence anchors, update the surface documentation, and close as
one commit passing `test:all` 56/56.

Done bar: the module holds the block with its bodies unchanged behind
`registerWorldModelTools(register, ctx, ports)`; `index.ts` builds the ports object at the block's
position; the `tools/list` order is identical; surface trio and `test:all` green; `check-anchors`
current; `check:fast` green; AAR ends `LOOP PAUSED`; one commit.

## 2. What happened

| Step | Result |
|---|---|
| Plan gate | Cold pass r1 `FAILED.` (3 Blockers: the head's binding set was undecided, the anchor offset was mis-derived, the helper mechanism was unstated) → revision 3 designed the whole seam → diff re-review `passed.` with two Majors → revision 4 → stamp fresh |
| P1 | 14 external identifiers confirmed by a parsed-identifier scan (not 16 — the first scan matched comment text and `state.getActiveEntity()`); anchors 1 / 6 / 12 across three bands; `tools/list` captured (37 tools) |
| P2 | The five slice-only `let`s became one `parserState` object in `index.ts` (`δ = −7`), declared in `src/tools/context.ts` with a factory; kept in place so the move stayed one mechanical edit |
| P3 | Module built with the slice's bodies, a 18-member `WorldModelPorts`, and the factory returning the two helpers; `index.ts` deleted the block, hoisted `toolCtx`, built the ports literal, and rewrote the four helper call sites |
| Amendment | Execution showed that exporting the helpers as module functions forces the block to module scope where `ctx` is unbound; the factory now returns them (the `world-crud.ts` idiom). Revision 5 |
| P4 | Surface trio unchanged (300 actions, 29,915 tokens); `tools/list` diff empty; `test:all` initially failed four anchor predicates (expected, P5 not yet run), then 56/56 |
| P5 | Three measured declarations (`+1`, `−6`, `−973`); `check-anchors` → `predicates current` |
| P6 | `holonovel/AGENTS.md` counts and module entry, `DECISIONS.md` seam entry, `ROADMAP.md` bullet rewritten; `check:fast` 46/46 |

Deviations from plan: one design amendment (D1/D5, revision 5) plus the four stale sentences it
left behind, fixed inside the same amendment after the binding pass named them. Both are recorded in
`plan.md`'s provenance paragraph.

### Gate outcomes

| Gate | Token | Verdict |
|---|---|---|
| plan-review / spec-plan | `plan-review passed.` | passed |
| independent-review | `independent-review passed.` (r2); binding pass `FAILED.` then passed after the four fixes | passed after amendment |
| build-review | `build-review passed.` | passed |
| drift-report | — | not run (no drift question asked) |
| spec-review | — | not run (no spec change) |
| proofread | — | not run (no prose deliverable outside the plan) |

## 3. What went right

- **The plan gate paid for itself twice.** The first cold pass found that the block was not a leaf
  at all: fourteen names the draft never listed, three of them mutable. The design that came out
  (ports object, `parserState` by reference, accessors for the three shared `let`s) is the reason
  the move compiled on the first attempt.
- **The mechanisms were verified, not assumed.** `refresh-predicates`'s lower-bound scoping and
  short-circuit were read in source before the anchor procedure was written; the three deltas were
  measured from the diff and cross-checked against three known call-site shifts.
- **The order claim got a real proof.** No gate asserts `tools/list` sequence, so a throwaway client
  captured the order before and after; the diff is empty.
- **Every step had an independent green point.** P2's conversion was `typecheck`-clean on its own,
  so a failure in P3 would have reverted alone.

## 4. What went wrong

- **The seam was under-specified in the first two drafts.** "Leaf-first" was asserted from the
  block's source bounds, not from its dependency closure. The scan that produced "seven forward
  references" looked only at symbols declared *after* the block; fourteen more were declared before
  it and used inside it. The lesson is procedural: a split plan's binding set must be computed by
  scanning the block's identifiers against the whole file, not by reading the block's comments.
- **The scan then over-counted.** The first exhaustive pass reported sixteen because it matched the
  word "structured" in a comment and the property name in `state.getActiveEntity()`. The re-review
  caught it; P1's criterion now excludes comment text and member-expression names.
- **A post-review amendment invalidated the gate binding.** The execution amendment changed the
  plan's bytes, so `mark-build` refused with "independent-review report is not bound to this plan"
  until a fresh bound report existed. That is the third instance of the SK-28 shape.
- **The amendment left stale text behind.** The D1/D5 change did not reach EV3, the blast-radius
  row, or V1; the binding pass found all three plus an incomplete history. An amendment is a sweep of every
  sentence that encodes the old design, not a patch of the decision lines.

## 5. Session performance

- **Outcome vs done bar.** Met: module extracted, bodies unchanged apart from the documented
  renames, surface identical, `test:all` 56/56, anchors current, docs current, `check:fast` green.
- **Scope adherence.** The plan named one module and one object conversion; both landed. The
  amendment changed the module's return shape, not its contract.
- **Verification quality.** The strong checks were the ones that could fail: the order capture (which
  passed only because registration position was preserved), the anchor bands (which failed on the
  first `test:all` run and then passed), and the surface trio's token counts. The weak check was the
  first identifier scan, which was text-based; its replacement is parsed and is now the P1 criterion.
- **Rework.** Five plan revisions, one expected `test:all` failure (anchors), and two `tsc`
  rounds for missing imports (`state`, `ParserCategory`). The moved code was written once and never
  rewritten.
- **Cost.** Roughly 45 tool calls in execution after the plan gate, plus four cold dispatches across
  the plan and binding passes. `test:all` ran twice (175 s, 174 s).
- **User intervention.** None during execution; the scope question and the re-review authorization
  were answered before it started.

## 6. Findings

**Project action items: zero.** Triage:

- **P3 — record-and-close.** `holonovel/AGENTS.md`'s `src/index.ts` line count is now 16,244; it is
  a hand-maintained claim, and the next stage re-measures it. No guard exists or is proposed.
- **P3 — record-and-close.** The two type imports the module needed (`state` from `ToolContext`,
  `ParserCategory` from `world/model.js`) were found by `tsc`, not by the plan. The plan's P1
  criterion now covers values and types; no further action.
- **P3 — record-and-close.** The anchor bands needed three declarations rather than the two the
  plan's D8 first described; the procedure (largest magnitude first, measure, gate on
  `check-anchors`) held unchanged.

**Process failure: none** — but one process lesson worth naming: an execution amendment must sweep
every mention of the superseded design, not only the decision lines. It is recorded here rather than
as a roadmap item.

**Skill findings: none new.** The binding-breakage I hit is the third instance of SK-28's shape
(condition-only amendment leaves the stamp citing a report that no longer matches), and the
parent-persisted cold report is SK-29. Both are already open; no duplicate rows.

## 7. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes (plan-set session, carried) | routed |
| `plan-review` | yes | routed |
| `independent-review` (via subagent) | yes, four dispatches | routed |
| `build-review` | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | no | miss (fifth instance of the SK-18 class) |

Invocation: 5 expected, 4 loaded, 1 miss.

## Changelog entry

**Title:** index.ts split, stage 3: the world-model command surface leaves the entry point

**Summary:** The `run_command` surface — the block that parses and dispatches world commands, with its hazard, ambiguity, and countdown helpers — moves out of `index.ts` into `src/tools/world-model.ts`, behind a factory that takes the host context and an explicit ports object and returns the two helpers the entry point still calls. `index.ts` drops from 17,217 to 16,244 lines with no behavioural change.

- `holonovel/src/tools/world-model.ts` (new): the 980-line block with its bodies unchanged, behind `registerWorldModelTools(register, ctx, ports)`, which returns `expireCountdown` and `expireSurvivalWithUnit` — the `world-crud.ts` factory idiom, so no module-scope context store exists
- `holonovel/src/tools/context.ts`: `ParserState` and `createParserState()`; the five session-local command-parser variables (`visitedRooms`, `visitedRoomNovel`, `lastCommand`, `lastReferencedThing`, `pendingAmbiguity`) become one object, shared by reference so the module mutates the same state
- `holonovel/src/index.ts`: the ports literal carries the sixteen index-local names the block needs — twelve providers, `PLAYER_READONLY_VERBS`, `parserState`, and accessors for `detailLevel`/`playerRegister`/`roomDescriptionMode`; the three shared `let`s cross as accessors because destructuring them would freeze their values
- A runtime `tools/list` capture is identical before and after (37 tools, same order), and the surface trio is unchanged: 300 actions, 29,915 catalog tokens
- 19 evidence anchors repaired by three measured declarations (+1, −6, −973), the deltas taken from the diff rather than predicted; `check-anchors` reports current
- `holonovel/AGENTS.md`, `holonovel/DECISIONS.md`, and `ROADMAP.md` record the new module, the seam decisions, and the remaining extraction targets
- `test:all` 56/56; `check:fast` 46/46

LOOP PAUSED
