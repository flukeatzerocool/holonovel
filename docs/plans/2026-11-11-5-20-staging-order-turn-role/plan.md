# Plan — §5.20 staging order source and AI-role turn handoff

Status: draft · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-11-5-20-staging-order-turn-role/`
Rollback cost: 1 (reversible source, spec, and harness edits; one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the first *actionable* `ROADMAP.md` section — **§5.20/§5.24 assertion and
staging remediation (P1)** (`ROADMAP.md:28-39`) — and close its two code
findings, **F-P5-5** and **F-P5-6** (`spec/audit/review-register.md:1775-1787`),
leaving the third finding (F-P5-7, six narrow assertions) as its own scheduled
chunk. The split follows the house pattern already used for
`§5.4 remediation` / `§5.4 citation repair` and `Trust-core contract
remediation` / `Trust-core citation repair`: a behaviour defect and a missing
assertion are different work with different evidence.

The file's top item, `Fingerprinted-section tool-token re-point (P2)`
(`ROADMAP.md:15-26`), is **not** taken: its trigger is "the next increment that
regenerates either the data-format (§5.6) or package-format (§5.16)
fingerprint" (`:24-26`), and the register explains why a standalone text edit is
wrong — it would "make the startup reconciliation path re-serialize every
persisted Novel and hold every installed ruleset package inactive"
(`spec/audit/review-register.md:1752-1762`). This increment edits only §5.20,
which is not a fingerprint source (`scripts/lib/contract-fingerprint.ts:37-43`),
so the trigger must not fire (done bar 8).

**Decision 1 (F-P5-5, code): `list` gets a real GM order source.**
REQ-612 says "`list` follows the GM order" (`spec/02-requirements.md:4122`), but
no action writes `social_cast.order` — the field is typed (`state.ts:737`),
defaulted (`:1204`), normalised on load (`:1641`, `:3004`), cloned (`:2825`), and
never read or written. `next_speaker`'s `list` branch iterates `present`, built
from `novel.npcs` insertion order (`index.ts:6932`), so `list` currently *is*
insertion order (`index.ts:6941`). The fix is local and additive: add an
optional `order: string[]` to `MANAGE_SCENE_SCHEMA` (`index.ts:6696-6726`), add
`"order"` to `MANAGE_SCENE_STAGING_PARAMS` (`:6686`) so the legacy `manage_scene`
schema keeps filtering staging parameters off its surface, set `cast.order` in
the `cast` branch (`:6909-6924`) and include it in the existing `set_scene_cast`
audit entry (REQ-040a), then have the `list` branch (`:6941`) walk the declared
order first and the remaining present NPCs in insertion order after it.
`manage_staging` picks the parameter up by adding `"order"` to its `pickParams`
list (`:7311`); `manage_scene`'s action enum has no `cast`/`next_speaker`, so an
`order` there would be inert, which is why the Set keeps it off.

**Decision 1a (semantics): unknown and non-present ids are ignored, not
refused.** `presence` already stores `entity_ids` unvalidated (`:6883`), so a
permissive store is the house pattern and adds no error contract. Mute keeps
winning over order (mute excludes, REQ-612); force keeps winning over
everything. Duplicate ids are stored as given and the first occurrence wins.
The alternative — refuse unknown ids with `[NOT_FOUND]` — was rejected because
REQ-611/REQ-612 name no refusal and a refusal would need a new error contract in
the body. `cast.order` survives a scene transition: REQ-611 clears only the
pooled spoken set and the manual selection (`:4119`), and the order is a GM
setting, not per-turn state. **Legacy saves carry no `order`:** load takes
`data.social_cast` wholesale (`state.ts:1641`, `:3004`), so the list branch
reads `cast.order ?? []` rather than assuming the field exists; no `state.ts`
edit and no migration.

**Decision 2 (F-P5-6, code): the handoff follows the AI's narrative role.**
REQ-412 keys the directive on the AI's narrative role — "WHEN the AI's narrative
role is Game Master and a Player or Observer badge is active … Under an AI-Player
role, the directive SHALL instruct closing turns with an in-character offer that
hands initiative back to the human Game Master"
(`spec/02-requirements.md:4112`). The implementation keys on the human badge
(`index.ts:15013-15023`) and reads `TTRPG_AI_ROLE` only afterwards, for
orientation (`:15029-15033`). A resolver for exactly this question already
exists — `narrativeRole(novel)` (`:1106-1111`, REQ-598) — and the handoff uses
it instead of a fourth parallel computation.

Concretely the block becomes:

```ts
// REQ-412 — the directive follows the AI's narrative role (REQ-304), not the badge.
if (badge !== "none") {
  const handoffRole = narrativeRole(novel);
  if (handoffRole === "game_master" && (badge === "player" || badge === "observer")) {
    /* invite the player's next action — REQ-412's WHEN clause */
  } else if (handoffRole === "player") {
    /* hand initiative back to the human GM — the AI-Player clause */
  }
}
```

The `narrativeRole` call carries no badge guard of its own — it returns
`"game_master"` for `TTRPG_AI_ROLE=game_master` whatever the badge — so the
invite branch repeats REQ-412's WHEN guard (`badge === "player" ||
badge === "observer"`) explicitly. Without it, a Game Master badge with an
AI-Game-Master role would invoke the directive the spec does not ask for.

The `badge !== "none"` short-circuit leaves the active-Novel badge-`none`
briefing without a directive, as today (the no-active-Novel early return at
`:14930-14935` is a separate path and is untouched). Default (counterpart)
behaviour is unchanged in every combination; only the override combinations the
badge key got wrong change:

| Badge | `TTRPG_AI_ROLE` | Today | After |
|---|---|---|---|
| player | unset (counterpart) | invite | invite (unchanged) |
| observer | unset (counterpart) | invite | invite (unchanged) |
| game_master | unset (counterpart) | hand back | hand back (unchanged) |
| none | any | none | none (unchanged) |
| player | `game_master` | invite | invite (unchanged) |
| observer | `game_master` | invite | invite (unchanged) |
| game_master | `player` | hand back | hand back (unchanged) |
| **player** | **`player`** | **invite** | **hand back** (fixed) |
| **observer** | **`player`** | **invite** | **hand back** (fixed) |
| **game_master** | **`game_master`** | **hand back** | **none** (fixed) |

**Decision 2a (alternatives rejected).** (a) Keep the badge key and apply the
env override afterwards — rejected: it leaves two role computations that must
stay in sync, which is what produced the drift. (b) Drive the directive on the
role alone, emitting the invite under a Game Master badge with an AI-Game-Master
role — rejected: REQ-412's WHEN guard names a Player or Observer badge, and the
spec-literal reading emits no directive where both sides claim the GM seat.
(c) Also consolidate `loopRole` (`:14944`) and `orientationRole`
(`:15029-15033`) onto `narrativeRole` — **out of scope**: the orientation
token's per-role assertion is F-P5-7's `T640` item, and `loopRole`'s
`(novel as any).ai_role` fallback has no such field in state, so touching it
belongs with that assertion's own red test. The plan records the observation for
the F-P5-7 chunk instead.

**Decision 3 (spec): two §5.20 bodies change; no fingerprint moves.** REQ-611
gains the `order?` parameter and the word "ordering" in its control clause; REQ-612
names where the GM order comes from and what happens to an id that resolves to no
present NPC. Drafts (one physical line each; wrapped here):

```text
`manage_staging (action: cast, strategy, select?, mute?, unmute?, force?, order?)` SHALL set the speaker-selection strategy for the active scene to `manual`, `natural`, `list`, or `pooled`, and SHALL support muting, forcing, or ordering named NPCs. The default strategy for a new scene SHALL be `natural`, and a scene transition SHALL clear the pooled spoken set and any manual selection. The strategy, muted set, speaker order, and pooled spoken-set SHALL persist with the active Novel's staging state without creating a property group. Setting cast state is Game Master or Editor only. *Acceptance criterion:* a three-NPC scene set to `pooled` rotates speakers; a muted NPC is never selected; Player attempts return `[FORBIDDEN]`. _Check:_ T727.
```

```text
`manage_staging (action: next_speaker, after_user?)` SHALL return one present NPC and a reason. Under `natural`, name mentions activate first, then talkativeness weights a seeded draw, then a random fallback; `list` follows the GM order set by `manage_staging (action: cast, order)`, ignoring ids that name no present NPC; `pooled` selects an unspoken NPC and resets on `after_user`; `manual` returns the selected NPC. Mute excludes and force overrides. The selection SHALL consume the seeded PRNG so identical seeds reproduce. *Acceptance criterion:* a seeded natural-order selection reproduces exactly, a mentioned NPC is chosen over a higher-talkativeness peer, and a `list` scene returns the declared order. _Check:_ T728.
```

Measured: 747 and 726 characters (limit 800), 6 and 8 sentences (limit 8).
REQ-611 today is 714 and REQ-612 is 597 (`spec/02-requirements.md:4119`,
`:4122`). REQ-412's body (`:4112`, 754) is **not** edited: the specification is
already correct; the code was not.

**Decision 4 (catalogue): T728 gains the order source; T482 gains one case.**
The T728 row already states "`list` follows the GM order"
(`spec/appendices-reference.md:2199`) and gains the setter and ignore clause.
The T482 row already states the counterpart, `TTRPG_AI_ROLE=game_master`, and
AI-Player cases plus the never-truncation budget case (`:1498`), but it does not
state the Game Master badge with an AI-Game-Master role, where REQ-412's WHEN
clause asks for no directive; that case is asserted by the extended harness, so
the row gains it.

**Decision 5 (roadmap): the section narrows to F-P5-7.** F-P5-5 and F-P5-6
become `Resolved`; the section is retitled `§5.20/§5.24 assertion repair (P1)`,
keeps only the assertion bullet, and its trigger closes when F-P5-7 is
`Resolved`. Retiring it outright would orphan that finding's scheduled row.

**Done bar** (each item names its command or artifact)

1. `holonovel/src/index.ts`: `MANAGE_SCENE_SCHEMA` carries
   `order: z.array(z.string()).optional()` with a `(cast)` description;
   `MANAGE_SCENE_STAGING_PARAMS` (`:6686`) gains `"order"`; `:7311` passes
   `order` through `pickParams`; the `cast` branch stores
   `cast.order = args.order` when supplied and adds `order: cast.order` to the
   `set_scene_cast` audit call; the `list` branch at `:6941` selects from an
   ordered present list (declared order first, then insertion order, read as
   `cast.order ?? []`) so
   `pick = <first unspoken in that order> ?? <first in that order>`.
2. The `manage_staging` description sentence names the order
   ("cast sets the multi-NPC speaker strategy, mute/unmute pool, and the GM
   speaker order for `list` selection"), and `manage_scene` is unchanged: its
   filtered schema still excludes every staging parameter, `order` included.
3. `npx tsx holonovel/scripts/generate-tool-definitions.ts` rewrites
   `holonovel/tool-definitions.json`; `check-tool-definitions-sync` and
   `tool-definitions-lint` pass.
4. `npm run surface-budget -- --write` re-records
   `spec/audit/tool-surface-baseline.json`, and the recorded `DECISIONS.md`
   budget lines match the measured footprint (the gate names any mismatch;
   take the values from `npm run surface-budget -- --json`).
5. `holonovel/src/index.ts:15013-15023` keys the handoff on
   `narrativeRole(novel)` with the `badge !== "none"` short-circuit and the
   REQ-412 WHEN guard on the invite branch; the three changed rows of the
   Decision 2 table are the only behaviour changes.
6. `holonovel/scripts/test-backfill.ts:1250-1255` (T482) asserts the counterpart
   matrix in place — Player badge → invite variant; Observer badge → invite
   variant; Game Master badge → hand-back variant; Editor badge → no
   `### Turn handoff` section — by extracting the section and matching its
   wording rather than the current `invite|hand|turn` catch-all. Suite count
   stays 105.
6a. `holonovel/scripts/test-briefing.ts` gains one T482 case for the
   environment overrides and the never-truncated tier, each with its own
   `boot(env)` process: `TTRPG_AI_ROLE=player` with a Player badge → hand-back
   variant; `TTRPG_AI_ROLE=player` with an Observer badge → hand-back variant;
   `TTRPG_AI_ROLE=game_master` with a Player badge → invite variant;
   `TTRPG_AI_ROLE=game_master` with a Game Master badge → no `### Turn handoff`
   section; `TTRPG_MAX_BRIEFING_TOKENS=400` with a Player badge → the section
   survives truncation. **Amendment (build time):** the plan originally put
   these in `test-backfill` too, but `boot()` there shares one process-global
   MCP buffer and the block's server is live, so a second process cannot be
   attached safely; `test-briefing` already boots per case with an env override
   (`:158-166`) and is the correct home. No new file, gate, or destructive step.
7. `holonovel/scripts/test-competitive-gaps.ts:609-614` (T728) asserts, in the
   existing three-NPC fixture (`Mira`, `Bo`, `Cato`, `:561-566`): the first
   `next_speaker` call passes `after_user: true` (the preceding T727 case leaves
   all three ids in `cast.spoken`, so without the reset the ordered walk would
   fall straight through to `ordered[0]`); `cast { strategy: "list", order:
   [Cato, Mira, Bo] }` then three `next_speaker` calls return `Cato`, `Mira`,
   `Bo` with `reason: "list"`; a fourth call wraps to `Cato`; `order: [Cato,
   "ghost"]` with `after_user: true` yields `Cato` then `Mira` (unknown id
   ignored, insertion order after the known prefix); muting the ordered head
   skips to the next in order; `force` still wins with `reason: "forced"`.
8. The new **behavioural** assertions fail on the pre-fix tree — output pasted in
   `aar.md` — and pass after: T728's ordered sequence, the unknown-id and
   mute/force clauses, and the T482 override case in `test-briefing`. The T482
   counterpart matrix (Player → invite, Observer → invite, Game Master →
   hand-back, Editor → none) is green pre-fix by construction — the plan's
   Decision 2 table records counterpart behaviour as unchanged — so it is a
   regression guard, not red proof. `npm --prefix holonovel run test:backfill`
   reports 105 passed, 0 failed (case count unchanged, assertions extended in
   place); `test:competitive-gaps` reports 30 passed;
   `npm --prefix holonovel run test:briefing` reports 15 passed (baseline 14).
9. `spec/02-requirements.md:4119` (REQ-611) and `:4122` (REQ-612) carry the
   Decision 3 drafts; each body is one paragraph, ≤800 characters (747, 726),
   ≤8 sentences (6, 8), with no table, bullet, or step list.
10. `spec/appendices-reference.md:2199` (T728) gains "set by
    `manage_staging (action: cast, order)`; an id that names no present NPC is
    ignored", and `:1498` (T482) gains the Game Master badge with
    `TTRPG_AI_ROLE=game_master` no-directive case.
11. `spec/audit/review-register.md`: F-P5-5 and F-P5-6 move into a new
    `### 2026-11-11 §5.20 staging order and AI-role handoff` group at the top of
    `## Resolved`, each with a post-change predicate that resolves on the
    committed tree (`index.ts` order branch and audit line; `narrativeRole`
    call site) and each naming its exercising harness (T728, T482). The row
    text corrects the stale predicates the register carries today
    (`index.ts:6360` and `:13939-13945`). F-P5-7's row stays in
    `## Scheduled-roadmap` and names the retitled section.
12. `ROADMAP.md:28-39` is replaced by `## §5.20/§5.24 assertion repair (P1)`
    carrying only the F-P5-7 bullet and a trigger that closes when F-P5-7 is
    `Resolved`; `npm run check-roadmap` and `npm run check-registers:strict`
    pass.
13. `holonovel/src/generated/contract-fingerprints.ts` is **unchanged** after
    `npm run build-order` (`git diff` empty for that file): §5.20 is not in
    `DATA_SECTIONS` or `PACKAGE_SECTIONS`. If it moves, stop and report — the
    P2 token re-point becomes in scope for that increment and this plan is
    amended, not silently widened.
14. `spec/audit/req-coverage.md` is refreshed by
    `npm run validate -- --write-register`; REQ-611 and REQ-612 still resolve
    against T727 and T728.
15. `CHANGELOG.md` gains a first entry `## 2026-11-11 — §5.20 staging order and
    AI-role handoff` naming REQ-611, REQ-612, REQ-412, REQ-304, T727, T728,
    T482, the corrected register predicates, and the narrowed roadmap section.
16. `npm run assemble && npm run check:fast` exits 0 un-piped with the trailing
    `check:fast: PASS` line; `npm run validate:sdd` reports 0 errors.
17. The increment directory holds `plan.md`, `tasks.md`, `aar.md`, and
    `independent-review.md`; `aar.md` records the Phase 0 baseline, the Phase 1
    probe transcripts, the red-test output for both harnesses, the
    fingerprint-unchanged diff, the full handoff matrix re-run, and ends
    `LOOP PAUSED`; `npm run check-loop-artifacts` passes.
18. The increment lands as one commit via `npm run session:close`, and
    `git status --porcelain` is empty afterwards.

## 2. Evidence (repo, verified this session)

- `ROADMAP.md:28-39` — the section: "give REQ-612's `list` strategy a real
  GM-order source on `manage_staging (action: cast)` (REQ-412, REQ-612;
  F-P5-5, F-P5-6)" and the F-P5-7 assertion widening; closes when F-P5-5,
  F-P5-6, and F-P5-7 are `Resolved`.
- `ROADMAP.md:15-26` — the P2 token re-point section and its fingerprint
  trigger; the reason this increment must not regenerate a fingerprint.
- `spec/audit/review-register.md:1752-1762` — F-P6a-21, the deferral rationale
  for the three `command` tokens.
- `spec/audit/review-register.md:1775-1780` — F-P5-5: "`manage_staging (action:
  next_speaker, strategy: list)` iterates `novel.npcs` insertion order;
  `social_cast.order` is persisted (`state.ts:724`, `:1186`) but never read and
  no action sets it. Predicate: `index.ts:6360`." The predicate is stale: the
  branch is `index.ts:6941` and the field's type is `state.ts:737`.
- `spec/audit/review-register.md:1781-1787` — F-P5-6: the directive "branches on
  `badge` at `index.ts:13939-13945`, while `TTRPG_AI_ROLE` is applied later only
  to orientation (`:13951-13955`), so an AI-role override renders the wrong
  handoff variant. Predicate: `index.ts:13939-13945`; `T482` asserts the
  GM-badge path only." Stale: the block is `index.ts:15013-15023` and the
  env read is `:15029`.
- `spec/audit/review-register.md:1788-1798` — F-P5-7, the remainder this plan
  keeps scheduled: T545, T550, T640, T712, T713, T727.
- `spec/02-requirements.md:4112` — REQ-412 (754 chars): directive keyed on the
  AI narrative role, never-truncated tier (REQ-135), AI-Player variant,
  `_Check:_ T482`.
- `spec/02-requirements.md:4119` — REQ-611 (714 chars): `manage_staging (action:
  cast, strategy, select?, mute?, unmute?, force?)`, default `natural`,
  transition clears spoken + manual selection, persists "without creating a
  property group", GM or Editor only, `_Check:_ T727`.
- Sibling-contract grep this session: `next_speaker` and `action: cast` appear
  in exactly two normative bodies (`spec/02-requirements.md:4119`, `:4122`) and
  one non-normative runtime mention without a parameter list
  (`spec/04-runtime.md:365`, "`manage_staging (action: cast|next_speaker)` and
  does not couple to any …"). No third REQ binds either action, so the
  parameter addition has no competing contract.
- `spec/02-requirements.md:4122` — REQ-612 (597 chars): "`list` follows the GM
  order"; mute excludes, force overrides; seeded PRNG; `_Check:_ T728`.
- `holonovel/src/core/state.ts:737` — `social_cast: { strategy; order: string[];
  muted; spoken; selected }`; `:1204` default `order: []`; `:1641` and `:3004`
  load normalisation; `:2825` clone projection.
- `holonovel/src/index.ts:6696-6726` — `MANAGE_SCENE_SCHEMA`; no `order` field
  today; `strategy` (`:6713`), `select` (`:6714`), `mute`/`unmute`/`force`
  (`:6715-6717`).
- `holonovel/src/index.ts:6686` — `MANAGE_SCENE_STAGING_PARAMS`, the set of
  staging parameters the legacy `manage_scene` schema filters out
  (`pickParams(MANAGE_SCENE_SCHEMA, … filter(key => !SET.has(key)))`, `:6735`);
  `order` belongs in it.
- `holonovel/src/index.ts:7311` — `manage_staging` picks a param subset; adding
  `order` here is required for the split surface.
- `holonovel/src/index.ts:6909-6924` — the `cast` branch: `novelSnapshot()`,
  strategy/select/mute/unmute/force, `recordMutation("set_scene_cast")`,
  `saveNovel`, `audit("set_scene_cast", { strategy, muted, selected })` — the
  audit payload that must gain `order` (REQ-040a).
- `holonovel/src/index.ts:6925-6963` — `next_speaker`; `present` is built from
  `novel.npcs.values()` at `:6932`; the `list` branch at `:6941` is the
  predicate for F-P5-5.
- `holonovel/src/index.ts:6880-6886` — `presence` stores
  `novel.characters_present_ids = args.entity_ids` unvalidated, the precedent
  for a permissive `order`.
- `holonovel/src/index.ts:1106-1111` — `narrativeRole(novel)`, the REQ-598
  resolver (comment block `:1099-1105`): env override, `null` for the Editor
  badge, otherwise the counterpart of the badge. The env override returns the
  configured role regardless of badge, which is why the invite branch repeats
  REQ-412's WHEN guard.
- `holonovel/src/index.ts:15013-15023` — the badge-keyed handoff block (F-P5-6
  predicate); `:14939` — `const badge = novel.badge`; `:14944` — `loopRole`
  (out of scope); `:15029-15033` — `aiRole`/`orientationRole`.
- `holonovel/src/core/state.ts:1641`, `:3004` — load normalisation takes
  `data.social_cast` wholesale, so a save written before this increment yields
  `order: undefined`; the list branch reads `cast.order ?? []`.
- `holonovel/src/index.ts:3173-3175` — `briefingBudget()` reads
  `TTRPG_MAX_BRIEFING_TOKENS` (fallback `TTRPG_PROMPT_BUDGET`, default 16000);
  `NEVER_TRUNCATED` contains `"turn handoff"`, so the directive survives
  truncation (REQ-135).
- `holonovel/src/index.ts:15397` — `briefing = applyPromptBudget(briefing)`.
- `holonovel/scripts/test-backfill.ts:69-79` — `boot(env)` takes an environment
  override; `:1250-1255` — the T482 case (Player badge, one regex over
  `invite|hand|turn`, Game Master badge restored).
- `holonovel/scripts/test-competitive-gaps.ts:561-566` — the T722–T729 fixture
  creates `Mira` (talkativeness 0), `Bo` (100), `Cato` (50); `:609-614` — the
  T728 case (natural mention). T727 (`:588-607`) runs first in the same scene
  and process and leaves all three ids in `cast.spoken`.
- `spec/appendices-reference.md:1498` — T482 row: GM role + Player badge, the
  `TTRPG_AI_ROLE=game_master` case, the AI-Player case, and the small-budget
  case — already forward-specified.
- `spec/appendices-reference.md:2199` — T728 row, including "`list` follows the
  GM order".
- `scripts/lib/contract-fingerprint.ts:37-43` — `DATA_SECTIONS` (no §5.20) and
  `:27` — `PACKAGE_SECTIONS` (no §5.20).
- `scripts/surface-budget.ts:157-182` — baseline freshness and the
  `DECISIONS.md` recorded-budget check (`parseRecordedBudgets`), the reason
  done bar 4 exists.
- `holonovel/scripts/generate-tool-definitions.ts:33` — the committed artifact
  is `holonovel/tool-definitions.json`; `--check` is the gate, the default run
  writes.
- Baseline this session: `npm run check:fast` → 40 passed, 0 failed,
  `check:fast: PASS`; `npm --prefix holonovel run test:backfill` → 105 passed,
  0 failed; `test:competitive-gaps` → 30 passed, 0 failed; `npm run status` →
  54 unpushed commits, 15 open roadmap items; `git status --porcelain` empty.

## 3. Blast radius

Sizes: S = a few lines; M = a section; gen = written by a tool.

| Path | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | `order` schema field; `cast` stores and audits it; `list` branch reads it; handoff keys on `narrativeRole` | M |
| `holonovel/scripts/test-backfill.ts` | T482 gains the counterpart badge matrix | S |
| `holonovel/scripts/test-briefing.ts` | new T482 case for the AI-role overrides and the never-truncated tier | S |
| `holonovel/scripts/test-competitive-gaps.ts` | T728 gains the order sequence, unknown-id, mute, and force assertions | S |
| `spec/02-requirements.md` | REQ-611 and REQ-612 bodies | S |
| `spec/appendices-reference.md` | T728 row gains the setter and ignore clause | S |
| `spec/audit/review-register.md` | F-P5-5/F-P5-6 → `Resolved` with corrected predicates; F-P5-7 row retargeted | S |
| `spec/audit/req-coverage.md` | regenerated by `npm run validate -- --write-register` | gen |
| `ROADMAP.md` | section narrowed to `§5.20/§5.24 assertion repair (P1)` | S |
| `CHANGELOG.md` | new dated first entry | S |
| `holonovel/tool-definitions.json` | regenerated by `generate-tool-definitions.ts` | gen |
| `spec/audit/tool-surface-baseline.json` | regenerated by `surface-budget --write` | gen |
| `spec/audit/tool-surface-replay.json` | conditional: re-recorded only if `surface-replay` reports the recorded replay stale | gen |
| `holonovel/DECISIONS.md` | recorded budget lines updated to the measured footprint | S |
| `holonovel.md`, `holonovel/holonovel.md` | generated by `npm run assemble` | gen |
| `spec/build-phase-map.md` | content-hash line rewritten by `npm run assemble` (REQ-278) | gen |
| `docs/plans/2026-11-11-5-20-staging-order-turn-role/` | `plan.md`, `tasks.md`, `aar.md`, `independent-review.md` | S |

No new tool, resource, or prompt; no new action. `holonovel/AGENTS.md`'s
tool-surface list and counts are tool-level and do not change. No state-schema
change (`social_cast.order` already exists), so no migration, no
`novel_format_version` bump. No data, credential, network, or publication step.

## 4. Steps (dependency order)

**Phase 0 — baseline and predicate confirmation.** Write `tasks.md` and an
`aar.md` skeleton carrying the baseline measured this session (`check:fast`
40/40; `test:backfill` 105/105; `test:competitive-gaps` 30/30; clean tree;
54 unpushed; 15 open roadmap items). Re-grep every edited location
(`index.ts:6696-6726`, `:6909-6941`, `:7311`, `:15013-15033`;
`spec/02-requirements.md:4119`, `:4122`; `appendices-reference.md:1498`,
`:2199`) and confirm F-P5-5 and F-P5-6 are the only `Scheduled-roadmap` rows for
this section.

**Phase 1 — probe the shipped behaviour (trust boundary: tool output).** Run a
throwaway `/tmp/opencode` tsx probe against a booted host and paste the
transcript into `aar.md`:
1. Three NPCs, `cast { strategy: "list" }` with an `order` argument → confirm
   the argument is rejected or ignored and `next_speaker` returns insertion
   order.
2. The seven-row handoff matrix of Decision 2 (badge × `TTRPG_AI_ROLE`, separate
   processes) → confirm the two "fixed" rows render the wrong variant today.
Stop and report if either predicate already holds (the code moved; re-scope
before editing).

**Phase 2 — the GM order source (F-P5-5).**
1. `MANAGE_SCENE_SCHEMA`: add
   `order: z.array(z.string()).optional().describe("GM speaker order of NPC ids (cast; the list strategy follows it).")`
   beside `strategy`/`select`.
2. `MANAGE_SCENE_STAGING_PARAMS` (`:6686`): add `"order"` so `manage_scene`
   keeps filtering it off its schema.
3. `manage_staging` `pickParams` list (`:7311`): add `"order"`, and extend the
   description sentence.
4. `cast` branch: `if (args.order !== undefined) cast.order = args.order;`
   before `recordMutation`, and `order: cast.order` in the `audit(...)` payload.
5. `next_speaker` `list` branch: read `const order = cast.order ?? []`, build a
   stable ordered view of `present` (declared order first, insertion order
   after), then
   `pick = ordered.find(n => !cast.spoken.includes(n.id)) ?? ordered[0]`,
   `reason = "list"`. Add a comment naming REQ-612 and the mute/force
   precedence.
6. Regenerate the committed definition and confirm the diff touches
   `manage_staging` only (`manage_scene` stays byte-identical).
7. Run the parameter's whole surface, not only the schema: `check-tool-surface`
   (documented tool counts unchanged), `surface-replay` (the routing text moved
   for `manage_staging`; the recorded baseline must still meet its floor),
   `action-conflicts -- --check` (no sibling action contract now disagrees), and
   `check-tool-definitions-sync`. Record each result in `aar.md`. If
   `surface-replay` reports the recorded replay stale, re-record it with
   `npm run surface-replay -- --write`.

**Phase 3 — the AI-role handoff (F-P5-6).** Replace the badge-keyed block
(`:15013-15023`) with the Decision 2 shape: the `badge !== "none"`
short-circuit, the invite branch guarded by REQ-412's WHEN clause
(`badge === "player" || badge === "observer"`), and the hand-back branch on the
AI-Player role. Keep both directive texts verbatim and comment the block with
REQ-412, REQ-304, and the REQ-598 resolver.

**Phase 4 — exercise both fixes.**
1. `test-backfill.ts:1250-1255`: extend T482 with the counterpart badge matrix
   per done bar 6.
1a. `test-briefing.ts`: add the T482 override/budget case per done bar 6a,
   following the existing `boot(env)` → `newNovel` → `promptText` → `kill`
   pattern (`:158-166`).
2. `test-competitive-gaps.ts:609-614`: extend T728 per done bar 7, reusing
   `created.Mira`/`created.Bo`/`created.Cato` and resetting the spoken set with
   `after_user: true` on the first ordered call.
3. Run both harnesses on the pre-fix tree first (stash the Phase 2/3 edits or
   run the assertions before applying them) and paste the failure output into
   `aar.md`.

**Phase 5 — normative and catalogue surfaces.**
1. `spec/02-requirements.md:4119` → the REQ-611 draft; `:4122` → the REQ-612
   draft, each as one physical line.
2. `spec/appendices-reference.md:2199` → append the setter and ignore clause;
   `:1498` → append the Game Master badge with `TTRPG_AI_ROLE=game_master`
   no-directive case.
3. `spec/audit/review-register.md` → move F-P5-5 and F-P5-6 into the dated
   `Resolved` group with corrected predicates; retarget the F-P5-7 row.
4. `ROADMAP.md:28-39` → the narrowed section.

**Phase 6 — regeneration and bookkeeping.** `generate-tool-definitions.ts` (no
flag) → `npm run surface-budget -- --write` → update the `DECISIONS.md` budget
lines it reports → `npm run surface-replay` (and `--write` only if it reports
the recorded replay stale) → `npm run validate -- --write-register` →
`npm run assemble` → CHANGELOG entry → `npm run build-order` (assemble, full
`check`, propagate, source-propagate, typecheck, version sync; REQ-107a) →
complete `tasks.md` and `aar.md`.

**Phase 7 — verify and commit.** Run §6 in order, confirm the fingerprint file
is untouched, then `npm run session:close`.

## 5. Edge cases and rollback

- **The pre-fix harness cannot express the case** (unknown arguments rejected by
  a strict schema rather than ignored). Record the rejection as the red proof;
  the post-fix run proves the parameter is accepted.
- **`order` collides with an action-contract rule** in `action-conflicts`.
  Rename to `speaker_order` in the schema, both surface lists, the audit
  payload, and the REQ-611 draft; the state field keeps its name.
- **Order with duplicate or unknown ids.** Stored as given; first occurrence
  wins; unknown ids are skipped at selection. Asserted by T728.
- **Muted head of the order.** Mute excludes (REQ-612), so `list` skips to the
  next ordered present NPC; asserted.
- **Scene transition.** Clears `spoken` and `selected` (`:6848-6856`) but keeps
  `order`. Intentional (Decision 1a); the plan records it so a later reviewer
  does not read it as a leak.
- **A legacy Novel save has no `social_cast.order`.** Load takes the object
  wholesale (`state.ts:1641`, `:3004`), so `cast.order` can be `undefined`; the
  list branch reads `cast.order ?? []` and falls back to insertion order,
  exactly the pre-fix behaviour. T728 exercises a fresh Novel only, so the
  legacy-read guard is a defensive default rather than an asserted branch; it is
  recorded in `aar.md` as a soft gap.
- **`surface-replay` reports the recorded replay stale.** Re-record with
  `npm run surface-replay -- --write`, add `spec/audit/tool-surface-replay.json`
  to the commit, and re-run the gate. If precision falls below 0.90 because of
  the description edit, shorten the added clause rather than relaxing the
  floor.
- **The Game Master badge with an AI-Game-Master role now carries no
  directive.** That is the spec-literal reading of REQ-412's WHEN clause and is
  asserted by T482; if the user prefers the alternative (always emit the invite
  under an AI-Game-Master role), drop the badge guard on the invite branch, flip
  the matrix row and the T482 case, and record the reading in the register.
- **A clone/checkpoint round-trip drops `order`.** `social_cast` is projected
  wholesale (`state.ts:2825`), so it should not; if it does, that is a separate
  persistence finding for the §5.9/§5.19 chunk, recorded in `aar.md`, not fixed
  here.
- **The budget assertion flakes.** `TTRPG_MAX_BRIEFING_TOKENS=400` must be low
  enough to force truncation but the fixture's briefing must exceed it; if the
  fixture is too small, seed one extra lore entry rather than lowering the
  budget below the foundations the briefing always keeps.
- **A fingerprint moves.** Contradicts §2 (`contract-fingerprint.ts:37-43`);
  stop, paste the diff, and amend the plan — the P2 token re-point becomes
  in-scope for the same increment (its trigger fires), which is a scope change,
  not a detail.
- **`surface-budget` reports a DECISIONS mismatch after `--write`** (it does not
  rewrite prose). Copy the measured canonical/compatibility/full/standard/small
  values from `npm run surface-budget -- --json` into the recorded lines.
- **Rollback.** `git revert` of the single commit restores both code paths, the
  schema, the generated artifacts, the two bodies, the T728 row, the register,
  the roadmap, and the changelog. No persisted data, package, or publication
  state is involved.

## 6. Verification summary

| Check | Command | Expected |
|---|---|---|
| Briefing harness | `npm --prefix holonovel run test:backfill` | 105 passed, 0 failed |
| Role/budget harness | `npm --prefix holonovel run test:briefing` | baseline + 1 passed, 0 failed |
| Cast harness | `npm --prefix holonovel run test:competitive-gaps` | 30 passed, 0 failed |
| Order parameter presence | `node -e` over `holonovel/tool-definitions.json` | `order` on `manage_staging` only (absent from `manage_scene`) |
| Definitions in sync | `npm run check-tool-definitions-sync` | pass |
| Surface counts | `npm run check-tool-surface` | pass, documented counts unchanged |
| Surface replay | `npm run surface-replay` | pass (or re-recorded in the same increment) |
| Action contracts | `npm run action-conflicts -- --check` | pass |
| Definition quality | `npm run tool-definitions-lint` | pass |
| Surface budget | `npm run surface-budget` | PASS, baseline fresh |
| REQ-611 length | `awk 'NR==4119{print length($0)}' spec/02-requirements.md` | 747 (≤800) |
| REQ-612 length | `awk 'NR==4122{print length($0)}' spec/02-requirements.md` | 726 (≤800) |
| Handoff keys on role | `grep -c "narrativeRole(novel)" holonovel/src/index.ts` | 2 (baseline 1 — the `narrate` call at `:15414`) |
| Order branch | `grep -c "cast.order" holonovel/src/index.ts` | ≥3 |
| Fingerprint unchanged | `git diff --stat -- holonovel/src/generated/contract-fingerprints.ts` | empty |
| Assemble + gates | `npm run assemble && npm run check:fast` | `check:fast: PASS` |
| Strict validation | `npm run validate:sdd` | 0 errors |
| Build order | `npm run build-order` | completes |
| Roadmap admission | `npm run check-roadmap` | pass |
| Register hygiene | `npm run check-registers:strict` | pass |
| Increment artifacts | `npm run check-loop-artifacts` | pass |
| Commit | `npm run session:close` | one commit, clean tree |

Unverified by design: the `real` MCP end-to-end playthrough — no tool, resource,
or prompt is added, so `npm run playability` and `test:package-smoke` stay out
of scope; the schema and description change is covered by the definitions sync
gate plus the two harness runs. The orientation token (`loopRole`) remains
env-blind; that is F-P5-7's `T640` item and is recorded, not claimed green.

## 7. Open questions

None. The order semantics are pinned by REQ-612 plus the `presence` precedent,
the handoff matrix is derived from REQ-412 and the existing `narrativeRole`
resolver, and the roadmap split matches the house remediation/citation-repair
pattern. Publication is out of scope; the plan stops at the local commit.
