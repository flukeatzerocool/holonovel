# Plan — Split `index.ts`, stage 1: the `--repath` repair path and the knowledge-tool cluster

**Date:** 2026-11-17 · **Kind:** planned · **Depth:** standard · **Revision:** 3 ·
**Increment:** `docs/plans/2026-11-17-index-split-1` · **Rollback cost:** 1 ·
**Evidence:** git HEAD `0df83dc`, tracked tree clean at plan time, so every baseline below is
recoverable with `git checkout -- <path>`. Readings on this tree: `npm run check:fast` exit 0
(`46 passed, 0 failed`, trailing `check:fast: PASS`); `npm --prefix holonovel run test:all` exit 0
(`56 passed, 0 failed`, 180.8 s); `npm run check-anchors` exit 0 (`predicates current`);
`npm run status` — 4 open roadmap items, 147 unpushed commits, tag `v2026.11.08`, last pipeline run
stopped at `record`; `holonovel/src/index.ts` is 19,156 lines (`wc -l`).
**Trust boundary:** every premise is `repo` evidence read from this checkout. No web or
user-supplied content is embedded.
**Review history.** Revision 1 was read by one cold pass (stages 1, 2, 3, 5; 27 of 40 reads):
one Blocker, six Majors, six Nits (`plan.cold/review-r1.md`). The Blocker is fatal to the done
bar: `--repath` as drafted searched both `holonovel/src` and `holonovel/scripts`, where
`knowledge_query` is also carried by `holonovel/scripts/lib/holosuite-novel.ts:394` and three
harness files, so the file-uniqueness rule would refuse the one live anchor. Revision 2 resolves
all thirteen: the search is restricted to the recorded file's own source root (D1); the
line-choice rule is stated as a locator rule with its consequence named, not as an extension of
the window (D1, M1); the context carries the ten index-local names actually measured, with the
badge helpers imported from `core/server.ts` instead (D4, M2); `RegisterTool` is specified and the
register argument is the *patched* `server.registerTool` (D3, M3); the rehearsal replaces an
unfalsifiable dry run as the control for the post-move case (D1a → D1c, M4); expectations read
`predicates current` (M5); V9 reads the log instead of an empty diff (M6); and the declaration
count, anchor enumeration, `rejectUnknown` set, verbatim check, and commit lists are corrected
(N1–N6). Revision 2's diff re-review (`plan.cold/review-r2.md`, 5 of 10 reads) returned
`independent-review passed.` with B1 and M1–M6 RESOLVED and five mechanical findings: the self-test
count disagreed with its own enumeration, V10's slice was bound to a mutable `HEAD`, the
review-history sentence over-claimed two Nits, D1 was silent on a deleted recorded path, and D1b's
human confirmation had no step. Revision 3 fixes all five: the nine cases are numbered one per
line, V10 pins `BASE` to the commit-1 sha and runs before commit 2, EV2 and `tasks.md` carry the
corrected shorthand and commit list, D1 states the deleted-path outcome, and P4 names the locator
confirmation.

## Questions

The request: "execute plan", resolved with the maintainer to ROADMAP item 4, *Split `index.ts`*
(`ROADMAP.md:36-40`). That item has two halves: add `--repath` to `refresh-predicates`, then
extract `index.ts` leaf-first, one stage per commit, `test:all` 56/56 each, no file above 3,000
lines. This increment does the prerequisite and the first stage. It does not finish the split;
`index.ts` lands at roughly 17,850 lines and four stages remain.

## Why

- **EV1 — the item's own premise is a direct maintainer request, not a met trigger.**
  `ROADMAP.md:41` gates the item on "the next increment that moves more than 50 anchors, or a
  week with more than 100 reads of one file". This increment moves one anchor (EV5) and no
  committed artifact measures file reads (`spec/audit/loop-audit.md` measures the session and
  publication loops, not read counts). The premise is therefore the maintainer's selection of the
  item, stated here rather than dressed up as a trigger.
- **EV2 — the extraction is blocked without `--repath`, which is why the item orders it first.**
  `refresh-predicates` resolves an anchor only inside the file the anchor already names
  (`scripts/refresh-predicates.ts:81-98`), and its scan set is the holosuite evidence files
  (`:49-60`). When a symbol moves to a new file, resolution fails with
  `has no code line with 'X'` (`:95`) and `--check` exits 1 (`:123-127`) with no repair: the tool
  never rewrites the path component, only the number (`:101`). The `fix-anchors` script is
  `npx tsx scripts/refresh-predicates.ts --write` (`package.json:94`), so the named repair cannot
  fix a moved anchor either. The gate row is `AGENTS.md:366`.
- **EV3 — the largest clean leaf is the knowledge-tool cluster.** `holonovel/src/index.ts:10323`
  opens `// --- Belief & Evidence ---` and the contiguous block through `:11626` holds the
  belief/evidence, identity, causal-dispatch, corpus-dispatch, semantic-index, knowledge-graph,
  agent, perception, and subjective-memory handlers, plus the `manage_belief`,
  `manage_identity`, `manage_knowledge`, and `manage_agent` registrations
  (`server.registerTool(` at `:10381`, `:10626`, `:11129`, `:11247`; no resource, prompt, or
  top-level `await` in the range). It is closed under use: exactly five declarations are
  referenced outside the block — `identityFor` (`:10561`), `handleCausalActions` (`:10831`),
  `handleCorpusActions` (`:10925`), `gatherIndexSources` (`:11083`), `gatherGraphSources`
  (`:11105`). Nothing outside the block depends on any other symbol defined in it.
- **EV4 — the seam already exists.** `ToolCtx` and `initServer` are the established pattern for
  helpers that need the live server (`holonovel/src/core/server.ts:6-41`), and
  `ToolRegistry`/`bindMcp` already separate definition from transport
  (`holonovel/src/tool-registry.ts:1-98`). Ten index-local names are used inside the block,
  measured by scanning it for calls to declarations made outside it: `state` (`index.ts:168`),
  `configInt` (`:413`), `wantsDetail` (`:2201`), `memoryScoreInputs` (`:2843`),
  `windowAwareVerdict` (`:2864`), `audit` (`:2985`), `ok` (`:3421`), `err` (`:3446`), `raw`
  (`:3627`), `mergeScopedArgs` (`:3956`). The badge helpers the block also calls —
  `getBadge`, `requireGM`, `requireNotObserver`, `requireNovel`, `novelSnapshot` — are already
  module singletons in `core/server.ts`, wired by `initServer(state)` at `index.ts:1437`, so they
  are imported rather than threaded through the context.
- **EV5 — exactly one evidence anchor moves.** 21 anchor calls name `holonovel/src/index.ts`; one
  of them, `anchor("holonovel/src/index.ts", 10383, "knowledge_query")`, lies inside the cut. The
  other 20 name lines outside it (`:12`, `:212`, `:718`, `:1911`, `:2670`, `:3446`, `:4684`,
  `:6640`, `:11710`, `:12154`, `:12408`, `:12429`, `:12464`, `:13215`, `:13498`, `:14206`,
  `:14233`, `:17696`, with `:12154` and `:12408` repeated). This is the real-data case that
  proves `--repath`.

## Design decisions

- **D1 — `--repath` is a resolution mode, and it searches the recorded file's own source root.**
  `refresh-predicates` gains one flag. With it, an anchor whose recorded file no longer carries
  the symbol on a code line is searched recursively inside that file's source root — the first two
  path segments, so `holonovel/src` for `holonovel/src/index.ts` and `holonovel/scripts` for
  `holonovel/scripts/...`. Restricting the root is what makes the live case decidable:
  `knowledge_query` is carried by four `holonovel/scripts` harness files as well as by the moved
  module, so a repository-wide search would refuse (M4/B1). Exactly one file in the root accepts
  the move; two or more refuse as ambiguous and list the candidates; none is unresolved. A
  definition-site match is *not* required — the live anchor names a description line
  (`holonovel/src/index.ts:10383`), not a declaration. A recorded path that no longer exists has no
  root to search and is unresolved, not repathed. Without the flag, behaviour is today's:
  unresolved, exit 1. No clock, no network.
- **D1b — the line is a locator, and the plan says so.** Inside the accepting file the line is
  chosen by the existing ±40-line window; when no candidate is near, the first code line in file
  order is taken. This is a *new* rule, deliberately: the anchor contract is "this line carries
  this symbol" (`scripts/refresh-predicates.ts:85`), not "this line is the declaration", so any
  carrying line is a valid anchor and the choice is a locator hint. The consequence is accepted
  and stated: after a repath the anchor self-validates, and the maintainer confirms the chosen
  line when reviewing the diff rather than expecting the tool to infer intent.
- **D1c — the post-move case is rehearsed, not assumed.** The unchanged-tree run cannot exercise
  the fallback, so P2 ends with two controls: (a) `--check --repath` over the unmodified tree
  prints `predicates current` (no false positive — the fallback cannot fire while the recorded
  file still matches), and (b) a scratch-tree case that mirrors the live shape — a moved
  description line plus a caller file *in the other root* — proves the root restriction picks the
  source file and not the harness file. The real post-move run happens in P3/P4 before commit 2.
- **D2 — the write path is `npm run fix-anchors`, which gains `--repath`.** `package.json:94`
  becomes `npx tsx scripts/refresh-predicates.ts --write --repath`, so the repair the gate names
  can always perform the repair. `check-anchors` stays `--check` (`package.json:95`): a moved
  anchor must fail the gate rather than be silently repaired during a check. `--repath` joins the
  `rejectUnknown` set (`scripts/refresh-predicates.ts:65`), the `USAGE` text, and the header
  comment.
- **D3 — the extraction is verbatim behind a destructured context.** The block moves into
  `holonovel/src/tools/knowledge.ts` as
  `export function registerKnowledgeTools(register: RegisterTool, ctx: ToolContext)`, with the
  ten EV4 names destructured from `ctx` as the first statement, and the five badge helpers
  imported from `../core/server.js`. Call sites inside the block are untouched, so the diff is a
  move plus declarations, not a rewrite. `server.registerTool(` becomes `register(` in exactly the
  four places listed in EV3. The call site stays at `holonovel/src/index.ts:10323`, preserving
  registration order and therefore tool-surface order. `RegisterTool` is
  `(name: string, config: any, handler: any) => void`, and the argument passed is
  `server.registerTool` — the *patched* function at `index.ts:324-346` that enforces
  `TOOL_ANNOTATIONS` and applies the envelope chain — never `_registerTool` (`:255`), which binds
  the unpatched SDK original and would drop the annotation check and every handler wrapper.
- **D4 — `ToolContext` is declared once.** `holonovel/src/tools/context.ts` exports
  `ToolContext` with the ten EV4 names, each typed against the real signature (`state:
  StateManager`; `ok`/`err`/`raw` returning the response envelope; `audit(tool, args, prefix?)`;
  `configInt(name, dflt)`; `wantsDetail(detail?)`; `memoryScoreInputs(novel)`;
  `windowAwareVerdict(...)`; `mergeScopedArgs(args, prefix)`), plus `RegisterTool`. It does not
  replace `core/server.ts`'s `ToolCtx`; that type stays as it is, so the trust core is not
  disturbed in this stage.
- **D5 — the five shared symbols are exported, not duplicated.** `knowledge.ts` exports
  `identityFor`, `handleCausalActions`, `handleCorpusActions`, `gatherIndexSources`, and
  `gatherGraphSources`; `index.ts` imports them back. No wrapper and no second definition.

## Phases

**P1 — Baseline and probe.** Record `check:fast` (46/46 PASS), `holonovel` `test:all` (56/56),
`check-anchors` (`predicates current`), both typechecks, and `wc -l holonovel/src/index.ts`
(19,156). Capture the current `--repath`-free failure: temporarily move a symbol in a scratch tree
and confirm `--check` reports `has no code line with`. Confirm the plan artifacts are trackable
(`git check-ignore docs/plans/2026-11-17-index-split-1/plan.md` prints nothing) and that no
existing script already repaths (`grep -rl "repath" scripts/ holonovel/scripts/` is empty).

**P2 — `--repath`.** Extend `scripts/lib/anchor-resolver.ts` with a pure source-root file index
over a supplied `Map<path, lines>` and `scripts/refresh-predicates.ts` to build that map when the
flag is present, rewrite `path` and `line`, and report `path:from#symbol -> path:to`. Extend
`scripts/test-anchor-tooling.ts` with nine scratch-tree cases, one per sentence:
1. a moved definition repaths;
2. a moved non-definition line (a description string, mirroring EV5) repaths;
3. a caller file in the *other* root that also carries the symbol is ignored, not counted as a
   second candidate;
4. two carrying files inside the root refuse as ambiguous and name both;
5. an absent symbol is unresolved;
6. a recorded path that does not exist is unresolved and the run continues (N-r2-4);
7. `--check` without `--repath` fails on a moved anchor and names `fix-anchors`;
8. `--check --repath` reports drift and exits 1 without writing;
9. `--write --repath` repairs and the following `--check --repath` passes.
Then the D1c control over the live tree. Update `package.json:94`, the `rejectUnknown` set, the
header, the `USAGE` block, and the `AGENTS.md` script row.

**P3 — Extraction.** Create `holonovel/src/tools/context.ts` and
`holonovel/src/tools/knowledge.ts`; cut `index.ts:10323-11626` into the latter behind the
destructure from D3; re-import the five shared symbols; add and prune imports on both sides until
`npm --prefix holonovel run typecheck` is clean.

**P4 — Anchor repair and gates.** `npx tsx scripts/refresh-predicates.ts --check --repath` (the
`knowledge_query` anchor reports the new path); confirm the reported `path:line` is the
`manage_belief` description line in `knowledge.ts` (the D1b locator check, N-r2-5);
`npm run fix-anchors`; re-check; then `npm run check:fast`, `npm --prefix holonovel run typecheck`,
`npm --prefix holonovel run test:all`.

**P5 — Registers and close.** `holonovel/AGENTS.md` layer map gains `src/tools/knowledge.ts` and
`src/tools/context.ts` and the new `index.ts` line count; `CHANGELOG.md` carries the dated entry
(2026-11-17, matching the current CalVer `2026.11.17` in `package.json`, so the version-currency
check sees no drift); the AAR is written with its terminal token before the last gate run.

## Commit plan

Two commits, non-spec split, docs last. Each commit leaves the tree green for the gate it feeds.

| # | Subject | Files | Gate before commit | Size |
|---|---|---|---|---|
| 1 | `refresh-predicates --repath` | `scripts/lib/anchor-resolver.ts`, `scripts/refresh-predicates.ts`, `scripts/test-anchor-tooling.ts`, `package.json`, `AGENTS.md` | `test-anchor-tooling`, `check-anchors`, `check-script-quality`, `check-script-discipline` | M |
| 2 | extract the knowledge-tool cluster | `holonovel/src/tools/context.ts` (new), `holonovel/src/tools/knowledge.ts` (new), `holonovel/src/index.ts`, `holonovel/scripts/lib/holosuite-*.ts` (anchor), `holonovel/AGENTS.md`, `CHANGELOG.md`, `docs/plans/2026-11-17-index-split-1/` | `holonovel` `typecheck`, `test:all` 56/56, `check:fast`, `check-anchors` | L |

Commit 1 is independently usable (the flag exists and is tested before any anchor needs it), which
is what makes the two-commit split preferable to one: if the extraction reddens, the tooling stays
committed and the move is reverted alone.

## Blast-radius table

| File | Change | Size | Why |
|---|---|---|---|
| `scripts/lib/anchor-resolver.ts` | add source-root file index + line choice | M | D1, D1b |
| `scripts/refresh-predicates.ts` | add `--repath`, report `path:line`, keep default behaviour | M | D1, D2 |
| `scripts/test-anchor-tooling.ts` | nine scratch-tree cases | M | D1c |
| `package.json` | `fix-anchors` gains `--repath` | S | D2 |
| `AGENTS.md` | script row and flag doc | S | D2 |
| `holonovel/src/tools/context.ts` | new: `ToolContext`, `RegisterTool` | S | D4 |
| `holonovel/src/tools/knowledge.ts` | new: the moved block behind `registerKnowledgeTools` | L | D3, D5 |
| `holonovel/src/index.ts` | cut `:10323-11626`, call site, imports | L | D3, D5 |
| `holonovel/scripts/lib/holosuite-*.ts` | one repathed anchor | S | EV5 |
| `holonovel/AGENTS.md` | layer map | S | done bar 8 |
| `CHANGELOG.md` | dated entry | S | done bar 8 |
| `docs/plans/2026-11-17-index-split-1/` | plan, tasks, AAR | S | process |


## Done bar

1. `refresh-predicates` accepts `--repath`; a moved definition *and* a moved description line
   repath, a caller file in the other root is ignored, two carrying files inside the root refuse,
   an absent symbol is unresolved, and each of the nine self-test cases passes; the unmodified-tree
   run prints `predicates current`.
2. `npm run fix-anchors` performs the repair with no manual edit; `npm run check-anchors` passes
   afterwards.
3. `holonovel/src/index.ts:10323-11626` is gone from `index.ts` and present verbatim in
   `holonovel/src/tools/knowledge.ts`; `index.ts` is below 17,900 lines and the new module below
   1,400.
4. `npm --prefix holonovel run typecheck` and root `npm run typecheck` are clean.
5. `npm --prefix holonovel run test:all` reports 56/56.
6. `npm run check:fast` reports `46 passed, 0 failed` and `check:fast: PASS`.
7. Registration order is unchanged: the tool surface gates inside `check:fast`
   (`check-tool-surface`, `surface-replay`, `check-tool-definitions-sync`) stay green.
8. Docs and register agree: `holonovel/AGENTS.md` names the new modules, `AGENTS.md` names the
   flag, `CHANGELOG.md` carries the entry.
9. `aar.md` ends `LOOP PAUSED` with zero new action items, and the increment is committed in two
   commits.

## Out of scope

- Stages 2+ of the split (trust core, dispatch, ruleset surface, world model, synthesis router);
  the 3,000-line target is not reached in this increment.
- Any behavioural change to a tool. The extraction is a move: no description, schema, gate, or
  audit path changes.
- `ToolCtx`/`core/server.ts` refactoring (D4).
- Repathing anchors into files outside `holonovel/src` and `holonovel/scripts`; the two roots are
  the whole recorded anchor surface today (EV5).

## Risks

| Risk | Mitigation |
|---|---|
| `--repath` guesses a wrong file for a common symbol | Source-root restriction, file-level uniqueness, and refusal on two or more carrying files in that root (D1); the ambiguity, other-root-caller, and non-definition cases are self-tests |
| The fallback fires on anchors that already resolve | It cannot: the tree search runs only when the recorded file has no matching code line, and D1c's unmodified-tree run proves it (`predicates current`) |
| The chosen line is not the one a reader expects | The anchor contract is "line carries symbol" (`refresh-predicates.ts:85`); D1b states the locator rule and the maintainer confirms the line in the diff |
| A hidden dependency on an index-local helper breaks the move | `holonovel` `typecheck` names every unresolved identifier; the context grows by exactly those names |
| Tool order drifts and a surface gate reddens | The call site stays at the cut's first line; `check-tool-surface` and `surface-replay` fail loudly if order moves |
| Imports left behind in `index.ts` (no `noUnusedLocals`) | Unused imports are harmless and `typecheck` stays green, so this is cosmetic; P3 greps each pruned import before removal |
| Anchor repair run before the move lands | P4 runs after P3; `--check --repath` first reports, then `fix-anchors` writes |
| The extraction reddens a gate late | Commit 1 (tooling) is independent, so the move alone is reverted: `git checkout -- holonovel/src/index.ts` plus `rm holonovel/src/tools/{context,knowledge}.ts` returns to HEAD |

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `npx tsx scripts/test-anchor-tooling.ts` | `N passed, 0 failed`, with the nine new cases |
| V2 | `npx tsx scripts/refresh-predicates.ts --check --repath` | `predicates current` on the unmodified tree (D1c); one repath line after the move; `predicates current` after the repair |
| V3 | `npm run check-anchors` | `predicates current`, exit 0 |
| V4 | `wc -l holonovel/src/index.ts holonovel/src/tools/knowledge.ts` | below 17,900 and below 1,400 |
| V5 | `npm --prefix holonovel run typecheck` | exit 0, no output |
| V6 | `npm run typecheck` | exit 0, no output |
| V7 | `npm --prefix holonovel run test:all` | `56` commands, all PASS |
| V8 | `npm run check:fast` | `46 passed, 0 failed`, trailing `check:fast: PASS` |
| V9 | `git log --oneline -2` and `git status --porcelain` at close | the two planned subjects; empty status |
| V10 | verbatim check (below), run with `BASE` = the commit-1 sha, before commit 2 | `moved text matches: yes` |

V10 — the moved block is byte-identical to the original apart from the four
`server.registerTool(` → `register(` substitutions. `BASE` is captured with
`BASE=$(git rev-parse HEAD)` immediately after commit 1 and the check runs
before commit 2 lands, so the slice always reads the pre-move file:

```sh
# after commit 1: BASE=$(git rev-parse HEAD)
node -e '
const { execSync } = require("node:child_process"); const fs = require("node:fs");
const base = process.env.BASE;
const orig = execSync(`git show ${base}:holonovel/src/index.ts`, { encoding: "utf8" })
  .split("\n").slice(10322, 11626).join("\n").replace(/server\.registerTool\(/g, "register(");
const body = fs.readFileSync("holonovel/src/tools/knowledge.ts", "utf8");
console.log(body.includes(orig) ? "moved text matches: yes" : "moved text matches: NO");
'
```
