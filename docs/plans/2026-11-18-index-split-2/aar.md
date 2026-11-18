# AAR — index.ts split, stage 2

**AAR: SUCCESS** — the world-model CRUD surface and the generation types leave the entry point;
`index.ts` 17,857 → 17,217 lines, `test:all` 56/56, every anchor current, one deliberate repoint.

## 1. What was supposed to happen

ROADMAP item 4, stage 2 (`docs/plans/2026-11-18-index-split-2/plan.md`): move the five
world-generation types into `holonovel/src/world/generation-types.ts` and the 627-line
`manage_world` block into `holonovel/src/tools/world-crud.ts`, behind one shared `toolCtx`, with
every anchor repaired, `test:all` 56/56, `check:fast` green, exactly one declared hand-repoint, two
commits each green on its own. The plan was reviewed before execution at standard depth (one cold
pass, one diff re-review, and a targeted re-check the maintainer authorised over the cap).

## 2. What happened

| Step | Result |
|---|---|
| Baseline | `0fd600c` was **red**: `T510/REQ-428` version currency — the previous increment's CHANGELOG entry (2026-11-18) outran the CalVer (2026.11.17). `test:all` 55/56 |
| Red-baseline fix | `npm run version-bump` → 2026.11.18 across 8 files; `refresh-properties` re-stamped the README marker; committed alone as `9bfaa96`; `test:all` then 56/56 |
| P1 | Identifier walk: 25 context members (10 existing + 15 new), five index-local types, 20 anchors; block boundaries confirmed (`:7153` closes `manage_world`, `:7154` blank) |
| P2 (commit A) | Types module created (36 lines); declarations removed; import added. Anchors: `+1` for 19 (the import), then `-26` for 18 (the declarations). Green: typecheck, `check-anchors`, `check:fast`. Committed `136c770` |
| P3 (commit B) | `world-crud.ts` (648 lines, block verbatim at column 0), `toolCtx`, both call sites, `context.ts` +15 fields. Anchors: `-615` for 13 below the cut, `+2` for the six above it, and the `create_room` repoint |
| V6 | `moved text matches: yes` against the pre-commit-A file |
| V7 | `0` / `1` |
| Gates | `typecheck` both roots clean; `check:fast` 46/46; `test:all` 56/56 (179 s); `check-anchors` current |

### Gate outcomes

| Gate | Token | Verdict |
|---|---|---|
| plan-review / spec-plan | `plan-review passed.` | passed |
| independent-review | r1 `FAILED.`, r2 `FAILED.`, r3 `passed.` (maintainer-authorised over the cap) | passed |
| build-review | `build-review passed.` | passed |
| drift-report | — | not run (no drift question) |
| spec-review | — | not run (no spec change) |
| proofread | — | Unknown (no prose deliverable outside the artifacts) |

## 3. What went right

- **The red baseline was found before the feature work and fixed in its own commit.** The
  version-currency failure was invisible to `check:fast` (it lives in `test:all`), so it would have
  surfaced as a confusing "regression" after the split.
- **The cold pass paid for itself twice.** It caught that one `--offset` could not repair anchors
  across two separate removals (the build would have failed at P2), and it predicted the exact
  `create_room` mispoint — which then happened: the resolver silently bound the anchor to
  `index.ts:8679`, a `manage_faction` description, and only the declared repoint corrected it.
- **Every delta was measured, not predicted.** Each repair used the value `refresh-predicates`
  reported (`+1`, `-26`, `-615`, `+2`), and `check-anchors` gated each commit.
- **The verbatim check held.** The 627 lines are byte-identical apart from the two stated
  substitutions.

## 4. What went wrong

- **Revision 1's single-offset design was wrong at the arithmetic level** and needed a cold pass to
  find it. The two-commit split that replaced it costs a second gate run but is honest about line
  deltas.
- **The r2 re-review found four more mechanical defects** (a repair order that swept the wrong band,
  two stale coordinate sets, a binding name that does not exist in `index.ts`). The plan was on its
  third revision before execution; the cap was then reached and the maintainer authorised one
  targeted pass rather than a fourth full one.
- **A mid-execution mechanism deviation could not be recorded where the plan says it belongs.**
  D2 said the moved module would *export* `MANAGE_WORLD_SCHEMA`; the block defines it inside the
  function body, so the module returns it from `registerWorldCrudTools` instead (stage 1's pattern
  for its five helpers). V6 requires the block to stay contiguous, which a hoist would break.
  Amending `plan.md` after stamping would change its hash and block the commit, so the deviation is
  recorded here and in the commit message rather than as a plan amendment. That is a process gap,
  not a code defect — see SK-32.

## 5. Session performance

- **Outcome vs done bar.** Met: two modules, one shared context, `index.ts` 17,217 (< 17,250),
  module 648 (< 720), both typechecks clean, `test:all` 56/56, `check:fast` green, 20 anchors current
  including the declared repoint, docs and roadmap updated, two commits (A landed; B closes).
- **Scope adherence.** No behavioural change; the generation helper family stayed in `index.ts` as
  the plan decided; stage 3 named on the roadmap and not attempted.
- **Verification quality.** The strong checks were the ones that can fail and did: the cold pass's
  arithmetic review, `check-anchors` after each repair run, V6's slice, and `test:all`. The weak
  spot is inherent to the anchor format — a line that carries a symbol by coincidence still
  self-validates; the `create_room` repoint is the live instance.
- **Rework.** Three plan revisions, four repair runs, one failed first `--offset` guess (-612, wrong
  band), one reset of the anchor files to recover a clean state. That last one was avoidable: I ran
  a wrong delta before measuring the true one.
- **Cost.** Two cold-reviewer sessions plus one targeted pass (26 + 5 + 5 reads), four `test:all`
  runs (~3 min each), and two `check:fast` runs.
- **User intervention.** One scoping choice at the start (which draft to execute), one gate
  authorisation at the re-review cap.

## 6. Findings

**Project action items: zero.** The roadmap carries stage 3 (the World-Model Tools block,
`run_command`, seven forward references) as the next scheduled split stage. Triage:

- **P3 — record-and-close.** The anchor format cannot distinguish a coincidental carrier; the
  `create_room` repoint is now bound to `case "create_room":` in the module, and the limitation is
  already recorded (2026-11-17 anchor-repair increment).
- **P3 — record-and-close.** `MANAGE_WORLD_SCHEMA` is returned rather than exported (see §4); the
  module's header states the contract.
- **P3 — record-and-close.** The generator family remains in `index.ts` with six helpers having no
  external use; moving it is a candidate for a later stage, not a defect.

**Process failure: none.** Every gate that ran produced a token; the red baseline was fixed before
the feature work rather than folded into it; no destructive or remote operation ran.

**Skill findings: 1 SK record appended (SK-32).** The `changelog-before-commit` miss is the sixth
instance of the SK-18/24/26 gap and is recorded here rather than as a duplicate row.

## 7. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `independent-review` (via subagent) | yes | routed |
| `build-review` | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | no | miss (same gap as SK-18/24/26) |

Invocation: 6 expected, 5 loaded, 1 miss.

## Changelog entry

**Title:** index.ts split, stage 2: the world-model CRUD surface leaves the entry point

**Summary:** Stage 2 takes the largest remaining closed block out of the entry point. The `manage_world` surface — rooms, things, exits, converts, world generation, and causal proposals — moves verbatim into its own module behind one shared tool context, and the five world-generation types move to a module both sides can import. `index.ts` drops from 17,857 to 17,217 lines with no behavioural change and `test:all` 56/56.

- `holonovel/src/world/generation-types.ts` (new): `WorldGenRole`, `GeneratedSecret`, `GeneratedWitness`, `WorldGenTable`, `WorldGenRoll`, moved verbatim; the module imports nothing, so the dependency stays acyclic
- `holonovel/src/tools/world-crud.ts` (new): the 627-line block moved verbatim at column 0 behind `registerWorldCrudTools(register, ctx)`, which returns the schema `resolve_intent` still spreads; `server.registerTool("manage_world"` becomes `register("manage_world"` and the one knowledge-tool read goes through the context accessor
- `holonovel/src/tools/context.ts`: +15 fields — the ruleset manager, the generation helper family, the adventure-annotation materializer, and a lazy `knowledgeTools()` accessor that defers the read past the declaration it would otherwise hit in its temporal dead zone
- `holonovel/src/index.ts`: one `toolCtx` literal feeds both tool modules; stage 1's call site collapses to `registerKnowledgeTools(server.registerTool, toolCtx)`; 17,857 → 17,217 lines
- 20 evidence anchors repaired across four holosuite files — 19 by a measured `+1`, 18 by `-26`, then 13 by `-615` and six by `+2`, each delta taken from the tool's own report
- The `create_room` anchor is repointed by hand to `world-crud.ts:133`: the resolver would otherwise have bound it to a `manage_faction` description that carries the same word, and `--repath` refuses the module's four carriers as ambiguous
- A red baseline was fixed first, as its own commit (`9bfaa96`): the CalVer lagged the previous entry, which `test:all` saw and `check:fast` could not
- `holonovel/AGENTS.md` layer map and the ROADMAP bullet record stage 2 and name stage 3; `test:all` 56/56, `check:fast` 46/46

LOOP PAUSED
