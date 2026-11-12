# AAR — §5.20 staging order source and AI-role turn handoff

Increment: `docs/plans/2026-11-11-5-20-staging-order-turn-role/`
Plan: `plan.md` · Tasks: `tasks.md`
Status: complete (2026-11-11)

## Phase 0 — baseline

| Check | Result |
|---|---|
| `npm run check:fast` | 40 passed, 0 failed, `check:fast: PASS` |
| `npm --prefix holonovel run test:backfill` | 105 passed, 0 failed |
| `npm --prefix holonovel run test:competitive-gaps` | 30 passed, 0 failed |
| `npm --prefix holonovel run test:briefing` | 14 passed, 0 failed |
| `npm run status` | 54 unpushed commits, 15 open roadmap items, `2026.11.11` |
| `git status --porcelain` | only the untracked increment directory |
| `npm run check-registers` | PASS (133 grandfathered undated findings) |

Predicate re-grep confirmed: `MANAGE_SCENE_STAGING_PARAMS` at
`holonovel/src/index.ts:6686`; `cast` branch `:6909-6924`; `list` branch
`:6941`; handoff block `:15013-15023`; `narrativeRole` `:1106-1111`; fixture
`test-competitive-gaps.ts:561-566`; T727 `:588-607`; T728 `:609-614`;
`test-backfill` T482 `:1250-1255`; `test-briefing` env-boot precedent
`:158-166`. Both register predicates for F-P5-5/F-P5-6 were confirmed stale
(`:6360`, `:13939-13945`) and are corrected in the resolved rows.

## Phase 1 — probe (tool-output, throwaway `/tmp/opencode/probe-520.ts`)

Handoff matrix, current tree. The section was classified by lifting
`### Turn handoff` … next `### ` heading and matching its wording
(`inviting the player` = GM-narrator invite; `hands initiative back` =
AI-Player hand-back; absent = none):

```text
== handoff matrix (counterpart) ==
counterpart          player:INVITE observer:INVITE game_master:HANDBACK none:NONE
TTRPG_AI_ROLE=game_master player:INVITE observer:INVITE game_master:HANDBACK none:NONE
TTRPG_AI_ROLE=player      player:INVITE observer:INVITE game_master:HANDBACK none:NONE
```

The three rows are identical: `TTRPG_AI_ROLE` had no effect on the handoff. Two
spec-divergent combinations reproduced — Player badge with
`TTRPG_AI_ROLE=player` emitted the GM-narrator invite; Game Master badge with
`TTRPG_AI_ROLE=game_master` emitted the AI-Player hand-back. F-P5-6 predicate
confirmed.

`list` order, current tree: `manage_staging { action: "cast", strategy: "list",
order: [Cato, Mira, Bo] }` returned `[OK] Cast strategy: list.` — the unknown
parameter was silently stripped — and selection ran in creation order:

```text
after_user call: (Mira, consumed)
  pick1: {"npc_id":"npc_mwcx399a","name":"Bo","reason":"list"}
  pick2: {"npc_id":"npc_mwcx399b","name":"Cato","reason":"list"}
  pick3: {"npc_id":"npc_mwcx3998","name":"Mira","reason":"list"}
```

F-P5-5 predicate confirmed: `order` was accepted-but-ignored and `list` was
insertion order.

## Plan amendments (build time)

1. **Harness split (C-amend).** The plan placed the T482 override and budget
   assertions in `test-backfill.ts`. That is unsafe: `attach()` there keeps one
   process-global stdout buffer and `pending` map (`test-backfill.ts:50-67`), so
   a second server cannot be attached while the block's server is live.
   `test-briefing.ts` already boots one server per case with an env override
   (`:158-166`), so the override matrix and the budget case landed there and
   `test-backfill`'s T482 keeps the counterpart badge matrix. No new file, gate,
   or destructive step; the plan was amended and re-stamped with `C-amend`.
2. **Done bar 8 corrected.** The T482 counterpart matrix is green pre-fix by
   construction (Decision 2 records counterpart behaviour as unchanged), so it
   is a regression guard; the red proof comes from T728's ordered sequence and
   the T482 override case. The done bar now says so.

## Red proof (pre-fix tree, assertions written first)

```text
test:competitive-gaps → 29 passed, 1 failed
  FAIL T728/REQ-612: natural order prefers a mentioned NPC:
    list order 1: {"npc_id":"npc_mwcx7a15","name":"Mira","reason":"list"}
test:briefing → 14 passed, 1 failed
  FAIL T482/T412: turn handoff follows the AI narrative role ...:
    {"TTRPG_AI_ROLE":"player"} / badge player: expected handback, got invite
test:backfill → 105 passed, 0 failed   (regression guard, green by design)
```

## Post-fix evidence

| Check | Result |
|---|---|
| `npx tsc --noEmit -p .` | exit 0 |
| `npm --prefix holonovel run test:competitive-gaps` | 30 passed, 0 failed |
| `npm --prefix holonovel run test:briefing` | 15 passed, 0 failed (baseline 14) |
| `npm --prefix holonovel run test:backfill` | 105 passed, 0 failed |
| `npx tsx holonovel/scripts/generate-tool-definitions.ts` | wrote 37 tools; diff limited to `manage_staging` (description, `order`, param counts, aggregate bytes/tokens) |
| `npm run check-tool-definitions-sync` | in sync |
| `npm run tool-definitions-lint` | PASS, 0 violations |
| `npm run check-tool-surface` | PASS — 298 actions |
| `npm run action-conflicts -- --check` | 4 baselined candidates, pass |
| `npm run surface-replay` | full precision 0.978, standard 0.978, `--check` pass (no re-record needed) |
| `npm run surface-budget` (after `--write` + DECISIONS update) | PASS — full 28,631; standard 25,033/25,768; small 1,180/2,864 |
| `npm run validate -- --write-register` | 0 errors; register written |
| `npm run validate:sdd` | 0 errors, 286 warnings |
| `npm run check-registers` | PASS |
| `npm run assemble` | wrote `holonovel.md` + `holonovel/holonovel.md`; phase-map hash updated |
| `holonovel/src/generated/contract-fingerprints.ts` diff | empty — §5.20 is in neither fingerprint section |
| `npm run check:fast` | 40 passed, 0 failed, `check:fast: PASS` |

The REQ-612 body was first written 4 characters over the 45-word sentence
guide (48 with backticked tokens); two clauses were tightened without losing a
contract ("mentions lead", "an unknown id is ignored") and the warning is gone.

## Decisions recorded

- `cast.order` is permissive like `presence`'s `entity_ids`: stored as given,
  duplicate ids take the first occurrence, ids naming no present NPC are
  ignored, mute excludes and force overrides. No new error contract.
- The `list` selector reads `cast.order ?? []`, so a pre-increment save (load
  takes `social_cast` wholesale, `state.ts:1641`, `:3004`) cannot break it. The
  guard is a defensive default, not an asserted branch — recorded as a soft gap.
- The handoff gates the invite branch on REQ-412's WHEN clause, so a Game
  Master badge with an AI-Game-Master role carries no directive. Counterpart
  behaviour is unchanged; the three override rows in the plan's matrix are the
  only behavioural deltas.
- `loopRole` (`index.ts:14944`) and `orientationRole` (`:15029-15033`) remain
  separate role computations. Consolidating them belongs to F-P5-7's `T640`
  assertion (per-role orientation at a minimal budget) and is not touched here.

## Findings and dispositions

- **F-P5-5, F-P5-6** — `Resolved` in `spec/audit/review-register.md` with
  post-change predicates and exercising harness titles.
- **F-P5-7** — remains `Scheduled-roadmap` under the retitled
  `§5.20/§5.24 assertion repair (P1)`; the roadmap section is narrowed, not
  retired.
- **Legacy-save `order` guard not asserted** — recorded and closed (P3): a
  multi-token default with no behavioural branch to test; the wholesale-load
  predicate is cited.
- **`loopRole` env-blindness** — recorded and closed here (P3): covered by
  F-P5-7's T640 item, which stays scheduled.
- **Proofread-register count drift** (register says 283, live run 286) —
  pre-existing, not introduced by this increment; recorded and closed (P3).

`deployed: not applicable — no publication in scope`

LOOP PAUSED
