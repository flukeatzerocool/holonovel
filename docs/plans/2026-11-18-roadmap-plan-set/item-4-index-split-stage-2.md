# Plan — ROADMAP item 4, stage 2: extract the World-Model CRUD cluster

*(A draft for the executing session. Re-home it as
`docs/plans/<date>-index-split-2/plan.md`, re-measure the ranges and anchors, and stamp it — the
evidence below is dated 2026-11-18 at HEAD `cc5e5a5`.)*

**Kind:** planned · **Depth:** standard · **Rollback cost:** 1 ·
**Evidence:** `wc -l holonovel/src/index.ts` = 17,857; stage 1 landed 2026-11-17 (commit `4c1e679`,
19,156 → 17,857, `holonovel/src/tools/{context.ts,knowledge.ts}` in place); `npm run check:fast`
46/46 PASS; `npm run check-anchors` passes on this tree; 20 evidence anchors name
`holonovel/src/index.ts`.
**Trust boundary:** `repo` evidence only.

## Questions

ROADMAP item 4 (`ROADMAP.md:36-45`): "extract `index.ts` leaf-first, one stage per commit,
`test:all` 56/56 each, no file above 3,000 lines", with the named order "trust core, dispatch,
ruleset surface, world model, synthesis router" (`:40-41`). This plan is stage 2 and does not finish
the split.

## Trigger status

- **Trigger:** "the next increment that moves more than 50 anchors, or a week with more than 100
  reads of one file" (`ROADMAP.md:44`). **Not met:** this stage moves 13 anchors (D4) and no
  committed artifact measures file reads — `spec/audit/loop-audit.md` measures the session and
  publication loops, not reads.
- **Selection:** the maintainer's planning request (this set). Recorded as a selection, not as a met
  trigger, matching stage 1's treatment (`docs/plans/2026-11-17-index-split-1/plan.md:45-50`).
- **Item status after this stage:** the item stays open. `index.ts` lands near 17,230 lines, still
  above the 3,000-line target; stage 3 is named in D6.

## Why

- **EV1 — the CRUD block is the largest leaf that needs no dependency inversion.** Measured by
  closing each candidate over its own top-level declarations: `World-Model CRUD`
  (`// --- World-Model CRUD (GM-only) ---` at `index.ts:6528`; the block ends at `:7154`, the line
  before the `resolve_intent` header at `:7155`) is 627 lines with **one** registration
  (`server.registerTool("manage_world"` at `:6593`)
  and **one** forward reference out of the range (`MANAGE_WORLD_SCHEMA` declared `:6536`, read at
  `:7515`). The neighbouring `World-Model Tools` block (`:5547-6527`, 981 lines, `run_command` at
  `:5799`) has seven forward references — `resolveIntentWorld` `:7190`, `presentIdsForLedger` `:7686`,
  `fireCountdown` `:7746`, `resolvePendingDiscoveries` `:7801`, `advanceSceneTransitionCountdowns`
  `:7882`, `effectiveWisdomItems` `:14941`, `badgeCanSeeWisdom` `:15036` — so extracting it would
  make the new module import `index.ts` and close a cycle. The CRUD block can be taken first.
- **EV2 — the block is closed under use.** Scanning `:6528-7154` for `function`/`const`/`class` at
  column 0 finds three top-level declarations — `MANAGE_WORLD_CAUSAL_PARAMS` (`:6532`),
  `DEFAULT_VEHICLE_CAPACITY` (`:6535`), and `MANAGE_WORLD_SCHEMA` (`:6536`) — with exactly **one**
  reference from outside the range: `MANAGE_WORLD_SCHEMA` at `:7515`. Everything else the block
  defines is scoped inside handlers.
- **EV3 — 22 index-local names are used inside, and the context already exists.**
  `holonovel/src/tools/context.ts` declares `ToolContext` with ten host services and `RegisterTool`
  (`:28-54`); the CRUD block needs six of those ten (`state`, `audit`, `ok`, `err`, `raw`,
  `mergeScopedArgs`) plus sixteen new names: `sanitizeGenerationName` (`index.ts:608`),
  `worldSnapshot` (`:3908`), `rulesets` (`:2208`), `pickParams` (`:423`), `worldGenMaxRooms`
  (`:463`), `WORLD_GEN_ROLES` (`:470`), `generationObjectKind` (`:489`), `validateGeneratedWorld`
  (`:518`), `worldGenRoleOf` (`:590`), `sanitizeGenerationText` (`:598`), `rollGenerationTable`
  (`:616`), `materializeAnnotations` (`:3516`), `needInput` (`:3645`), `seedWarningSuffix`
  (`:3653`), `knowledgeTools` (`:10324`), and one `server` use (`:179`) whose member P1 must name.
  Sixteen of these are index-local; twelve of them are the world-generation helper family.
- **EV4 — `knowledgeTools` is the only reference that points *after* the block.** It is created at
  `:10324` from `registerKnowledgeTools` (stage 1's export). Importing it back from `index.ts` in a
  moved module would be a cycle, so it travels through `ToolContext` — the same seam that already
  carries `state` and the envelopes.
- **EV5 — the anchor surface is small and already repairable.** Twenty anchors name
  `holonovel/src/index.ts` (lines 12, 213, 719, 1912, 2671, 3447, 4685, 6641, 10411, 10855 ×2,
  11109 ×2, 11130, 11165, 11916, 12199, 12907, 12934, 16397, measured by
  `grep -rho 'anchor("holonovel/src/index.ts", [0-9]*' holonovel/scripts`). Seven are below the cut
  and untouched; `:6641` moves into the new module; twelve shift by −627 (the block's inclusive
  length). Stage 1's `--repath`
  (`scripts/refresh-predicates.ts:56-70`) and the anchor-repair `--offset` are both in place.
- **EV6 — the seam and the surface gates already hold the invariants stage 1 established.**
  `RegisterTool` is documented as the *patched* `server.registerTool`, not the SDK original
  (`context.ts:8-14`); registration order is preserved by keeping the call site at the cut's first
  line; `check-tool-surface`, `surface-replay`, and `check-tool-definitions-sync` fail loudly if
  order or definitions move (gate manifest).

## Decisions

- **D1 — Target: `index.ts:6528-7154` (627 lines) → `holonovel/src/tools/world-crud.ts`, one commit.**
  Expected result: `index.ts` 17,857 − 627 = 17,230 lines, new module ≈ 650 lines. The item's
  3,000-line target is still unreached; the done bar says so rather than implying it is met.
- **D2 — `registerWorldCrudTools(register, ctx)` with the call site at the cut's first line.** Inside
  the module, `server.registerTool("manage_world"` becomes `register("manage_world"`; the call site in
  `index.ts` stays at the same ordinal position, preserving registration order (EV6). The
  badge/authorization helpers the block calls (`requireGM` and any other `core/server.ts` singleton
  P1 enumerates) are imported, not threaded through the context — the rule stage 1 set
  (`docs/plans/2026-11-17-index-split-1/plan.md` D3/D4).
- **D3 — `ToolContext` grows by the names EV3 measures, flat.** Sixteen fields are added — seventeen
  if P1 finds a second `server` member — each typed
  from its declaration signature in `index.ts`; `knowledgeTools` joins them (EV4), which removes the
  only forward reference. The twelve generation helpers stay a flat family inside the context:
  grouping them into a sub-object would invent an abstraction the code does not have and would
  rename every call inside the block, turning a move into a rewrite.
  - Rejected: extracting the generation helper family (`index.ts:423-616`) first. It sits in the
    trust core, so it moves the highest-risk code ahead of the leaf and triples the anchor shift for
    this stage.
  - Rejected: importing the helpers back from `index.ts`. That is a module cycle; typecheck accepts
    it and the runtime does not.
- **D4 — The anchor repair is two declared operations, verified between them.**
  `npx tsx scripts/refresh-predicates.ts --write --offset -627 --path holonovel/src/index.ts
  --from-line 7155` shifts the twelve anchors below the cut, then
  `npx tsx scripts/refresh-predicates.ts --write --repath` repaths `:6641` into the new module. Each
  is preceded by `--check` on the untouched tree (`predicates current`), and followed by
  `npm run check-anchors`. The `--offset` declaration is verified before and after the write; a
  refused anchor stops the phase rather than being hand-edited (the 2026-11-17 repair contract,
  `docs/plans/2026-11-17-anchor-repair-gap/`).
- **D5 — No behavioural change.** The move is verbatim apart from the single
  `server.registerTool(` → `register(` substitution and the destructure line, proven by the slice
  comparison (V6). No description, schema, default, or audit path changes.
- **D6 — Stage 3 is named, not attempted:** `World-Model Tools` (`:5547-6527`, above the cut so its
  line numbers do not move — 981 lines, `run_command` at `:5799`, seven forward references). It
  needs a dependency-inversion decision (context function fields, or moving those helpers first),
  which is a stage of its own. The roadmap bullet is updated in this increment to record stage 2 and
  name stage 3; the item is not retired. No `spec/audit/review-register.md` row is opened or closed:
  this stage closes no tracked finding, and the register row that routed stage 1 belongs to another
  item (`spec/audit/review-register.md:3908-3910`, the mutation sample).
- **D7 — One commit (L).** Unlike stage 1, the tooling this stage needs already exists
  (`--repath`, `--offset`), so there is no independently useful first commit. The move, the context
  growth, the anchor repair, and the doc updates land together, gated by `typecheck`, `test:all`
  56/56, `check:fast`, and `check-anchors`.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/tools/world-crud.ts` | *(new)* the moved block behind `registerWorldCrudTools` | L |
| `holonovel/src/tools/context.ts` | +16 host fields (17 if P1 finds a second `server` member), each typed from its `index.ts` declaration | M |
| `holonovel/src/index.ts` | cut `:6528-7154`, call site, imports, prune now-unused imports | L |
| `holonovel/scripts/lib/holosuite-{adversarial,invariants,novel,conformance}.ts` | 12 shifted anchors + 1 repathed anchor | S |
| `holonovel/AGENTS.md` | layer map: `tools/world-crud.ts`, new `index.ts` line count | S |
| `ROADMAP.md` | item 4 bullet records stage 2 and names stage 3 | S |
| `CHANGELOG.md` | rendered from the AAR block | S |
| `docs/plans/<date>-index-split-2/` | plan, tasks, AAR | S |

Rollback: `git checkout -- holonovel/src/index.ts holonovel/src/tools/context.ts
holonovel/scripts/lib/ && rm holonovel/src/tools/world-crud.ts` returns the tree to HEAD. Nothing is
generated from `index.ts`.

## Phases

- **P1 — Baseline and the fourth name.** Record `typecheck` (both roots), `test:all` 56/56,
  `check:anchors` (`predicates current`), `wc -l holonovel/src/index.ts` (17,857), and the 20-anchor
  table. Resolve the single `server` use inside `:6528-7154`: if it is the registration call it
  becomes `register(` and the context grows by 16 fields; if it is another member, that member is
  named and the context grows by 17. Accept: the context list is written, each field with its
  declaration line, and the count is one of those two.
- **P2 — Extract.** Create `world-crud.ts`, move the block, destructure the context, import the
  badge/authorization helpers P1 enumerated, replace the one registration call, add the call site at
  `:6528`, and prune imports until `npm --prefix holonovel run typecheck` and `npm run typecheck`
  are clean.
- **P3 — Anchors.** `--check` (current), then `--write --offset -627 --from-line 7155`, then
  `--write --repath`, then `npm run check-anchors`. Confirm the repathed anchor lands on a line that
  carries its symbol and names the new module (printed `path:line`).
- **P4 — Gates and docs.** `npm --prefix holonovel run test:all` (56/56), `npm run check:fast`
  un-piped, layer map, roadmap bullet, CHANGELOG, AAR, close.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `wc -l holonovel/src/index.ts holonovel/src/tools/world-crud.ts` | `index.ts` = 17,857 − 627 = 17,230 (±5); new module ≈650 (<900). The 3,000-line target is **not** reached by this stage (D1) |
| V2 | `npm run typecheck`; `npm --prefix holonovel run typecheck` | exit 0, no output |
| V3 | `npm --prefix holonovel run test:all` | 56 commands, all PASS |
| V4 | `npm run check:fast` (un-piped, last) | `46 passed, 0 failed` … `check:fast: PASS` — includes the three surface gates |
| V5 | `npm run check-anchors`; `npx tsx scripts/refresh-predicates.ts --check --repath` | `predicates current` |
| V6 | slice comparison with `BASE` = `git rev-parse HEAD` before the move (below) | `moved text matches: yes` |
| V7 | `grep -c 'server.registerTool("manage_world"' holonovel/src/index.ts`; `grep -c 'register("manage_world"' holonovel/src/tools/world-crud.ts` | `0` and `1` |
| V8 | `git log --oneline -1`; `git status --porcelain` | the planned subject; empty status |
| V9 | `grep -rn 'from "../index' holonovel/src/tools/` | empty — no moved module imports the entry point (the cycle guard for EV4 and D3) |

V6 — the moved block is byte-identical except the single registration substitution:

```sh
# before the move: BASE=$(git rev-parse HEAD)
node -e '
const { execSync } = require("node:child_process"); const fs = require("node:fs");
const orig = execSync(`git show ${process.env.BASE}:holonovel/src/index.ts`, { encoding: "utf8" })
  .split("\n").slice(6527, 7154).join("\n").replace(/server\.registerTool\(/g, "register(");
const body = fs.readFileSync("holonovel/src/tools/world-crud.ts", "utf8");
console.log(body.includes(orig) ? "moved text matches: yes" : "moved text matches: NO");
'
```

## Done bar

**Done bar:** `index.ts:6528-7154` is gone from `index.ts` and present verbatim in
`holonovel/src/tools/world-crud.ts` behind `registerWorldCrudTools`; `index.ts` is below 17,300 lines
and the new module below 900; `ToolContext` carries every name the block uses and no module imports
`index.ts`; 13 anchors are repaired (1 repathed, 12 shifted) and `check-anchors` is current; both
typechecks are clean; `test:all` is 56/56; `check:fast` is green with the surface gates; the layer
map and roadmap bullet agree; `aar.md` ends `LOOP PAUSED`; one commit.

## Out of scope

- Stage 3 (the World-Model Tools block and its forward references) and every later stage; the
  3,000-line target is not reached here (D6).
- Any behavioural change to `manage_world`, including its schema, defaults, or generation helpers.
- Moving the generation helper family (`:423-616`) or the trust core.
- `core/server.ts`'s `ToolCtx` (stage 1's D4 boundary).

## Risks

| Risk | Mitigation |
|---|---|
| A hidden dependency on an index-local name | `typecheck` names every unresolved identifier; the context grows by exactly those names |
| A module cycle through a helper declared later | `knowledgeTools` travels in the context (EV4); `grep -n "from \"../index" holonovel/src/tools/` must stay empty |
| Tool order drifts | Call site at the cut's first line; `check-tool-surface` and `surface-replay` red if it moves |
| The offset lands an anchor on a coincidental symbol line | The resolver verifies the target line carries the symbol; the plan reviews the printed `path:line` (P3) |
| A generation helper is used once and bloats the context | Accepted (D3) to avoid a rewrite; the alternative is recorded |
| `manage_world`'s handler is larger than the block (a closure escaping the range) | P1 measures the range end against the registration body; a closure crossing `:7154` stops the plan for an amendment |

## Dependencies

- Depends on stage 1's `ToolContext`/`RegisterTool` seam and on the anchor-repair contract
  (`--repath`, `--offset`), both landed 2026-11-17.
- Independent of items 1, 2, and 5 — except that item 5 edits `manage_artifact` (`:12964`), which is
  outside this stage's range; if a later stage moves the package surface, item 5 must land first or
  rebase onto the moved module (recorded in item 5's plan).
