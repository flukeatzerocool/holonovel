# Plan — Split `index.ts`, stage 2: extract the World-Model CRUD cluster

**Date:** 2026-11-18 · **Kind:** planned · **Depth:** standard · **Revision:** 3 ·
**Increment:** `docs/plans/2026-11-18-index-split-2` · **Rollback cost:** 1 ·
**Evidence:** git HEAD `9bfaa96` (tracked tree clean after the version-currency fix); `wc -l
holonovel/src/index.ts` reads 17,857; `npm run check:fast` exit 0 (`46 passed, 0 failed`);
`npm --prefix holonovel run test:all` exit 0 (`56 passed, 0 failed`, 175 s);
`npm run check-anchors` exits 0 (`predicates current`); 20 evidence anchors name
`holonovel/src/index.ts`.
**Source draft:** `docs/plans/2026-11-18-roadmap-plan-set/item-4-index-split-stage-2.md`. This plan
re-measures it and corrects it; see "Delta from the draft".
**Review history.** Revision 1 was read by one cold pass (stages 1–5, one context, 26/40 reads).
Verdict `independent-review FAILED.` with three Blockers: the anchor repair could not pass because
the type move shifts lines *above* the cut (so `-627` lands ~22 lines short and the five below-cut
anchors were wrongly called untouched); the `index.ts` line-count expectation ignored the type move
and the added lines; and the `create_room` anchor would silently re-bind to an unrelated description
line in `index.ts:9316` because the module carries the symbol on four lines and `--repath` refuses
ambiguity while in-file resolution never falls back. Four Majors (a false helper-use count, a
`ToolContext` widening that breaks stage 1's call site, a byte-identity check that contradicts the
wrapper's indentation, and a misattributed type-use sentence) and three Minors/Nits were also
recorded. Revision 2 resolved all of them by splitting the work into two commits with a measured
offset per commit, declaring the `create_room` repoint explicitly, introducing one shared
`toolCtx`, correcting the helper count and the type sentence, and restating the counts and the
verbatim rule. The r2 diff re-review (5 reads) returned `independent-review FAILED.` with one
Blocker — the `+1` repair run was still ordered after the deletion, so its lower-bound-only scope
swept anchors that need −25 — plus two Major stale-range defects (V6's `BASE` and the commit-B
delete instruction still used pre-commit-A coordinates), two Minors (a binding name that does not
exist, and an unfinished import list) and one Nit. Revision 3 reorders the two repair runs to follow
the edits they measure, pins `BASE` to the pre-A commit, restates the delete bounds as measured at
P3 start, fixes the binding name, enumerates the import set, writes the fifteen field signatures,
and gives the per-file anchor rows. That leaves the standard re-review cap reached; the changes are
recorded in `plan.cold/fixes-r3.md` for escalation rather than a third cold pass.

## Questions

ROADMAP item 4 (`ROADMAP.md:36-45`) asks for the `index.ts` split, leaf-first, one stage per commit,
`test:all` 56/56 each, no file above 3,000 lines. This is stage 2. It does not finish the split.

## Trigger status

- **Trigger:** "the next increment that moves more than 50 anchors, or a week with more than 100
  reads of one file" (`ROADMAP.md:44`). **Not met:** this stage moves 19 anchors (18 shifted, one repointed; the anchor at
  `:12` does not move) and no committed artifact measures reads. Execution is the maintainer's selection ("continue" after the plan set
  landed), recorded rather than dressed up as a trigger.
- **Item status after this stage:** the item stays open; `index.ts` lands near 17,205 + Δ lines (Δ = commit B's added lines), still
  above the 3,000-line target. The roadmap bullet records stage 2 and names stage 3.

## Why

- **EV1 — the block is a closed leaf.** Scanning `:6528-7154` (header at `:6528`, `});` closing
  `manage_world` at `:7153`, blank at `:7154`, `resolve_intent` header at `:7155`) for
  `function`/`const`/`class` at column 0 finds three declarations — `MANAGE_WORLD_CAUSAL_PARAMS`
  (`:6532`), `DEFAULT_VEHICLE_CAPACITY` (`:6535`), `MANAGE_WORLD_SCHEMA` (`:6536`) — with exactly
  one reference from outside the range: `MANAGE_WORLD_SCHEMA` at `:7515`.
- **EV2 — one registration, no resources, no prompts, no top-level `await`.** `manage_world` is
  registered at `:6593`.
- **EV3 — fifteen index-local values are used inside, and the context seam exists.**
  `holonovel/src/tools/context.ts` declares `ToolContext` and `RegisterTool` (`:23-56`). The block
  uses six existing fields (`state`, `audit`, `ok`, `err`, `raw`, `mergeScopedArgs`) plus
  `sanitizeGenerationName` (`index.ts:608`), `worldSnapshot` (`:3908`), `rulesets` (`:2208`),
  `pickParams` (`:423`), `worldGenMaxRooms` (`:463`), `WORLD_GEN_ROLES` (`:470`),
  `generationObjectKind` (`:489`), `validateGeneratedWorld` (`:518`), `worldGenRoleOf` (`:590`),
  `sanitizeGenerationText` (`:598`), `rollGenerationTable` (`:616`), `materializeAnnotations`
  (`:3516`), `needInput` (`:3645`), `seedWarningSuffix` (`:3653`), and `knowledgeTools` (`:10324`).
- **EV4 — `knowledgeTools` is declared after the call site, so it travels as an accessor.** It is
  created at `:10324`; a by-value read at `:6528` would hit its temporal dead zone. The block uses it
  once, inside a handler (`:6598`).
- **EV5 — five index-local types are referenced inside the block, and all five are also used by code
  that stays in `index.ts`.** `WorldGenRole` (`:469`, used at `:470` and `:590`), `GeneratedSecret`
  (`:499`, used at `:520`), `GeneratedWitness` (`:509`, used at `:521`), `WorldGenTable` (`:576`,
  used at `:616`), `WorldGenRoll` (`:583`, used at `:616`). They must therefore live in a module both
  sides can import.
- **EV6 — 20 anchors, and the move is two different line deltas.** Anchors name `index.ts` at 12,
  213, 719, 1912, 2671, 3447, 4685, 6641, 10411, 10855 ×2, 11109 ×2, 11130, 11165, 11916, 12199,
  12907, 12934, 16397. Removing the block (`:6528-7154`, 627 lines) shifts every anchor at or after
  `:7155` by −627 plus whatever the commit adds above the cut. Removing the five type declarations
  (`:469`, `:499-507`, `:509-512`, `:576-581`, `:583-588` — 26 lines) shifts everything after them,
  and adding the type import adds a line above them. **One declared offset cannot satisfy both** (the
  tool takes one delta per path), so the repair runs per commit with the delta measured from the
  tool's own drift report (`scripts/refresh-predicates.ts:190` prints
  `declare it with --offset <delta> --path <path>`), not predicted here.
- **EV7 — one anchor cannot be repaired mechanically.** `holosuite-adversarial.ts:30` is
  `anchor("holonovel/src/index.ts", 6641, "create_room")`, whose line is
  `case "create_room": {`. After the move `index.ts` still carries the symbol on exactly one line —
  `:9316`, a `manage_faction` description — so in-file resolution binds the anchor there and
  `--repath` never runs (`:270` requires zero in-file candidates). The module carries the symbol on
  four lines (schema enum, `case`, `audit(...)`, a guidance string), which `--repath` refuses as
  ambiguous. A repoint to the module's `case "create_room":` line is therefore declared (D5).
- **EV8 — the invariants are already gated.** `RegisterTool` is the *patched* registration
  (`context.ts:8-14`); the call site stays at the cut's first line so order is preserved;
  `check-tool-surface`, `surface-replay`, and `check-tool-definitions-sync` fail if order or
  definitions move; `typecheck` names every unresolved identifier.

## Decisions

- **D1 — Two commits, because the two line deltas cannot share one offset.**
  - **Commit A (types):** create `holonovel/src/world/generation-types.ts` with the five EV5
    declarations moved verbatim; delete them from `index.ts`; add one import line.
  - **Commit B (block):** create `holonovel/src/tools/world-crud.ts` with the 627-line block moved
    verbatim behind `registerWorldCrudTools(register, ctx)`; delete it from `index.ts`; add the call
    site.
  Each commit is independently green (`typecheck`, `check-anchors`, `check:fast`) and reversible.
  - Rejected: one commit with a hand-computed offset. The two removals are at different places, so
    one `--offset` value is wrong for one of the anchor bands, and the tool refuses rather than
    repairs a wrong target.
- **D2 — `registerWorldCrudTools(register, ctx)`; the call site stays where `:6528` was.** Inside
  the module, `server.registerTool("manage_world"` becomes `register("manage_world"`. The moved block
  is inserted **verbatim at column 0** inside the function body — no reindent — so the slice
  comparison (V6) is an exact `includes`, and the module reads as a transcript rather than a rewrite.
  `MANAGE_WORLD_SCHEMA` is exported from the module and imported back for its `:7515` read.
- **D3 — One shared `toolCtx` object, declared before the cut.** `ToolContext` gains the fifteen EV3
  fields (required). A new `const toolCtx: ToolContext = { … }` sits immediately before the
  `registerWorldCrudTools` call and carries all twenty-five members; stage 1's call site at
  `:10324` changes from its ten-field literal to
  `registerKnowledgeTools(server.registerTool, toolCtx)`, and
  `toolCtx.knowledgeTools` is the accessor `() => knowledgeTools`.
  - This is forced, not stylistic: fifteen new required fields make the existing literal a
    missing-properties error under `"strict": true` (`holonovel/tsconfig.json:8`), and duplicating
    them at `:10324` would need a self-referential accessor inside the literal that defines it.
  Field signatures (N3 — nothing is inferred, so `context.ts` imports the real types):
  `sanitizeGenerationName(value: unknown): string`; `worldSnapshot(): void`;
  `rulesets: RulesetManager` (`../rulesets.js`);
  `pickParams<T extends Record<string, unknown>>(schema: T, keys: readonly string[]): Partial<T>`;
  `worldGenMaxRooms(): number`; `WORLD_GEN_ROLES: WorldGenRole[]`;
  `generationObjectKind(result: string, title: string): WorldKind`;
  `validateGeneratedWorld(world: WorldModel, secrets: GeneratedSecret[], witness: GeneratedWitness | null, personTablePresent: boolean): string[]`;
  `worldGenRoleOf(key: string, title: string): WorldGenRole | null`;
  `sanitizeGenerationText(value: unknown): string`;
  `rollGenerationTable(rng: Rng, table: WorldGenTable): WorldGenRoll | null`;
  `materializeAnnotations(novel: NovelState, directives: AnnotationDirective[], slug: string | null): { counts: { npcs: number; lore: number }; warnings: string[] }`;
  `needInput(text: string): { content: Array<{ type: "text"; text: string }>; structuredContent: unknown }`;
  `seedWarningSuffix(seed: unknown): string`; `knowledgeTools(): any`.
  - The generation family stays in `index.ts`. **Scope reason, not a use count:** six of the eight
    helpers have no use outside the block (`worldGenMaxRooms`, `generationObjectKind`,
    `validateGeneratedWorld`, `worldGenRoleOf`, `sanitizeGenerationName`, `rollGenerationTable`), so
    moving the family is *possible*; it would be a second extraction with its own anchors in one
    stage, so it is deferred. (Revision 1 claimed each helper had exactly one external use; that was
    wrong and is corrected here.)
- **D4 — Types live in `holonovel/src/world/generation-types.ts`.** The five declarations move
  verbatim; `index.ts` and `world-crud.ts` both import them. The module imports nothing, so there is
  no cycle.
- **D5 — The `create_room` anchor is repointed by hand, and the repoint is verified.** After commit
  B's offset run, `holosuite-adversarial.ts:30` becomes
  `anchor("holonovel/src/tools/world-crud.ts", <line>, "create_room")` where `<line>` is the
  `case "create_room":` line, measured in P3 and recorded in `tasks.md`. `npm run check-anchors`
  verifies that the line carries the symbol; the choice of *which* carrier is the maintainer's
  judgement, stated here rather than inferred by a tool that would pick the description at `:9316`.
  This is the one deliberate exception to "no hand edits"; every other anchor is repaired by the
  tool.
- **D6 — No behavioural change.** The move is verbatim apart from the registration substitution and
  the one accessor call, proven by V6.
- **D7 — Stage 3 is named, not attempted:** `World-Model Tools` (`:5547-6527`, 981 lines,
  `run_command` at `:5799`, seven forward references). The roadmap bullet records stage 2 and names
  stage 3; the item is not retired. No register row and no new gate: the split is held by the
  existing gates.

## Blast radius

| File | Commit | Change | Size |
|---|---|---|---|
| `holonovel/src/world/generation-types.ts` | A | *(new)* five declarations moved verbatim | S |
| `holonovel/src/index.ts` | A | delete the five declarations, add the import, repair anchors | S |
| `holonovel/scripts/lib/holosuite-conformance.ts` | A | `:213` +1; `:1912`, `:2671`, `:3447`, `:16397` −25 | S |
| `holonovel/scripts/lib/holosuite-invariants.ts` | A | `:719`, `:4685`, `:10411`, `:11109` −25 | S |
| `holonovel/scripts/lib/holosuite-novel.ts` | A | `:10855`, `:11109`, `:11130`, `:11916` −25 | S |
| `holonovel/scripts/lib/holosuite-adversarial.ts` | A | `:6641`, `:10855`, `:11165`, `:12199`, `:12907`, `:12934` −25 (`:12` untouched) | S |
| `holonovel/src/tools/world-crud.ts` | B | *(new)* the block behind `registerWorldCrudTools` | L |
| `holonovel/src/tools/context.ts` | B | +15 fields | M |
| `holonovel/src/index.ts` | B | cut the block at its post-A bounds (6503-7129), `toolCtx`, call site, stage-1 call site, imports | L |
| `holonovel/scripts/lib/holosuite-adversarial.ts` | B | `:6641` repointed (D5) and `:10855`, `:11165`, `:12199`, `:12907`, `:12934` shifted | S |
| `holonovel/scripts/lib/holosuite-{conformance,invariants,novel}.ts` | B | seven anchors shifted by the block move | S |
| `holonovel/AGENTS.md` | B | layer map: two new modules, new `index.ts` count; corrects the stale 17,856 (`:59`) | S |
| `ROADMAP.md` | B | item 4 bullet records stage 2, names stage 3 | S |
| `CHANGELOG.md` | B | AAR entry; commit A carries no changelog line | S |
| `docs/plans/2026-11-18-index-split-2/` | — | plan, tasks, AAR | S |

Rollback: commit A reverses with `git checkout -- holonovel/src/index.ts holonovel/scripts/lib` plus
`rm holonovel/src/world/generation-types.ts`; commit B (before the close) reverses the same way with
`world-crud.ts`, `tools/context.ts`, `AGENTS.md`, `ROADMAP.md`. After `session:close`, add
`git checkout -- CHANGELOG.md`; the increment directory is untracked until then and is removed with
`git clean -fd docs/plans/2026-11-18-index-split-2`.

## Phases

- **P1 — Baseline and identifier walk (before any edit).** Record both typechecks, `test:all`
  (expect 56/56 — measured on `9bfaa96`), `check-anchors`, `wc -l` (17,857), and the 20-anchor table
  with each anchor's file. Re-run the identifier walk over `:6528-7154`: every module-scope name and
  every type annotation, written to `tasks.md`. Accept: the field list is twenty-five members (ten
  existing + fifteen), and no surprise name.
- **P2 — Commit A: the type move, edit-then-repair, twice.** The tool's scope is a lower bound only
  (`refresh-predicates.ts:258`: `recorded >= fromLine`), so **each repair run follows the edit it
  measures**: (a) create the types module and add the import → run `--offset +1 --from-line
  <the import's line>` (every anchor after it moved down one); (b) delete the five declarations →
  run `--offset -26 --from-line <the band's position after step (a)>`. Run (b)'s lower bound
  legitimately excludes the pre-band anchor at `:213`, and an anchor already carrying its symbol is
  skipped before the offset branch (`:262`). Accept: `typecheck` clean; `check-anchors` prints
  `predicates current`; `check:fast` green. Commit.
- **P3 — Commit B: the block.** Create `world-crud.ts` with this import set (N2): `z` from `zod`;
  `WorldRoom`, `WorldThing`, `WorldKind`, `Direction`, `ROOM_DIRECTIONS`, `WORLD_MODEL_KINDS`,
  `createEmptyWorldModel`, `convertSource`, `oppositeDirection` from `../world/model.js`; `createRng`,
  `sessionRoll` from `../core/rng.js`; `requireGM`, `requireNovel` from `../core/server.js`; the five
  types from `../world/generation-types.js`. **No `fs`, `path`, or `crypto`** (measured: zero
  word-boundary uses). Create the `toolCtx` object and both call sites, and rewrite stage 1's call
  site. Then **delete the block at its post-commit-A bounds, re-measured at P3 start** (6503-7129 as
  of this plan), run the offset for anchors recorded at ≥ the old `:7155` (delta measured), and do the
  D5 repoint, recording the module line in `tasks.md`. Accept: both typechecks clean;
  `check-anchors` current; V6 `moved text matches: yes`; V7 counts.
- **P4 — Gates and docs.** `test:all` 56/56; `check:fast` un-piped; layer map, roadmap bullet, AAR;
  `session:close`.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `wc -l holonovel/src/index.ts holonovel/src/tools/world-crud.ts holonovel/src/world/generation-types.ts` | `index.ts` < 17,250 (17,857 − 26 + 1 − 627 + Δ, Δ = commit B's added lines, recorded); module 630–720; types 28–40 |
| V2 | `npm run typecheck`; `npm --prefix holonovel run typecheck` after each commit | exit 0, no output |
| V3 | `npm --prefix holonovel run test:all` (after P3) | 56 commands, all PASS |
| V4 | `npm run check:fast` (un-piped, after each commit; last in P4) | `46 passed, 0 failed` … `check:fast: PASS` |
| V5 | `npm run check-anchors` after each commit | `predicates current` |
| V6 | slice comparison (below), after P3 | `moved text matches: yes` |
| V7 | `grep -c 'server.registerTool("manage_world"' holonovel/src/index.ts`; `grep -c 'register("manage_world"' holonovel/src/tools/world-crud.ts` | `0` and `1` |
| V8 | `grep -rn 'from "../index\|from "../../index' holonovel/src/tools holonovel/src/world` | empty — the enforced form of "no module imports `index.ts`" |
| V9 | `grep -n 'anchor("holonovel/src/tools/world-crud.ts"' holonovel/scripts/lib/holosuite-adversarial.ts` | one line, and `check-anchors` accepts it |
| V10 | `git log --oneline -2`; `git status --porcelain` at close | the two planned subjects; only the planned files |

V6 — the moved block is byte-identical apart from the registration substitution and the accessor
call; the slice is compared against the pre-move file, so it runs before commit B rewrites
`index.ts`'s history:

```sh
# before commit B, pin BASE to the PRE-COMMIT-A file, where the block still starts at :6528
# BASE=$(git rev-parse HEAD~1)   # HEAD is commit A here; HEAD~1 is its parent
node -e '
const { execSync } = require("node:child_process"); const fs = require("node:fs");
const orig = execSync(`git show ${process.env.BASE}:holonovel/src/index.ts`, { encoding: "utf8" })
  .split("\n").slice(6527, 7154).join("\n")
  .replace(/server\.registerTool\(/g, "register(")
  .replace(/knowledgeTools\.handleCausalActions/g, "knowledgeTools().handleCausalActions");
const body = fs.readFileSync("holonovel/src/tools/world-crud.ts", "utf8");
console.log(body.includes(orig) ? "moved text matches: yes" : "moved text matches: NO");
'
```

## Done bar

**Done bar:** the five types live in `world/generation-types.ts` and `index.ts` imports them; the
627-line block is gone from `index.ts` and present verbatim in `tools/world-crud.ts` behind
`registerWorldCrudTools`; one shared `toolCtx` feeds both stage-1's and stage-2's registrations;
`index.ts` is below 17,250 lines and the new module is below 720; `check-anchors` is current after
each commit, including the declared `create_room` repoint; both typechecks are clean; `test:all` is
56/56; `check:fast` is green with the surface gates; the layer map and roadmap bullet agree and the
stale 17,856 is corrected; `aar.md` ends `LOOP PAUSED`; two commits, each green on its own.

## Delta from the draft

- **Two commits, not one.** The type move and the block move are separate line deltas at separate
  places; one offset cannot repair both, and the tool refuses rather than guesses.
- **One shared `toolCtx`.** Fifteen new required fields break stage 1's literal; the draft did not
  mention `index.ts:10324`.
- **The `create_room` anchor is repointed by hand (D5).** `--repath` cannot reach it (in-file
  resolution binds a description line first; the module is ambiguous), and the draft's "1 repathed"
  would have silently pointed the evidence at `index.ts:9316`.
- **Field count is 15 and the helper-use claim is corrected** (six of eight helpers have no external
  use; the family stays for scope, not for need).
- **Line counts are bands, not a predicted sum,** because commit B adds lines above the cut.

## Out of scope

- Stage 3 and later; the 3,000-line target is not reached (D7).
- Moving the generation helper family (`:423-616`) — possible, deferred (D3).
- Any behavioural change to `manage_world`; `core/server.ts`'s `ToolCtx`.

## Risks

| Risk | Mitigation |
|---|---|
| A hidden index-local dependency | P1's identifier walk is written before the cut; `typecheck` names the rest |
| An offset lands an anchor on a coincidental line | The tool verifies the target carries the symbol; each commit's `check-anchors` is the gate; the one carrier choice that `check-anchors` cannot judge is declared in D5 |
| Two deltas in one commit | D1's commit split; each repair uses the delta the tool prints |
| Tool order drifts | Call site at the cut's first line; `check-tool-surface` and `surface-replay` red if it moves |
| The block ends mid-expression | P1 confirms `:7154` is blank and `manage_world` closes at `:7153` |
| Commit A reddens something only `test:all` sees | `test:all` runs after P3 and again in P4; commit A is type-only and `check:fast` + both typechecks gate it |
| A pre-existing failure is mistaken for a regression | Baseline measured on `9bfaa96`: 56/56, recorded in P1 |

## Open questions

- None blocking. P1's identifier walk is the one measurement that can change the plan; a sixteenth
  name or a missing type would be recorded as a delta amendment before the cut.
