# AGENTS.md — holonovel MCP Server (v2026.09.29)

AI maintainer orientation for the holonovel (world-model) MCP server implementation.

## Layer Map

```
src/world/model.ts      World-model data structures: kind hierarchy (thing,
                        container, supporter, door, device, vehicle, person,
                        backdrop, region), property contracts (portable,
                        openable/lockable/lit/switchable/switched_on/enterable/
                        wearable/readable/edible/drinkable/climbable/transparent),
                        rooms, things, exits, convert_source parser, verb coverage
                        tiers (verbCatalog), resource serialization (worldMap,
                        worldKinds).
        ↓
src/world/parser.ts     Command dispatch: lexer, resolver against world-model
                        state. Core (look, go, take, drop, open, close, unlock,
                        lock, inventory, examine, wait) plus standard-tier verbs
                        (switch on/off, wear, remove, read, eat, drink, climb,
                        enter, exit, sit, stand, push, pull, light, extinguish,
                        listen, smell, touch, insert). Returns ParserResult;
                        side-effect resolution (movement, property mutations)
                        lives in src/index.ts.
        ↓
src/core/state.ts       StateManager singleton: novels, roster, NPCs, scenes,
                        countdowns, lore, Ruleset Wisdom, snapshots (per-badge
                        undo/redo stacks), audit log, badge gating, workflows,
                        build fingerprint. Atomic persistence.
        ↓
src/core/macros.ts      expandMacros — {{entity.name}}, {{scene.current}},
                        {{scene.type}}, {{countdown.<n>.remaining}},
                        {{countdown.<n>.total}}, {{novel.slug}}, {{badge.active}},
                        {{party.size}}, {{world.room}}, {{world.room_count}},
                        {{world.thing_count}}.
        ↓
src/core/wisdom.ts     Ruleset Wisdom manifest — 7 output modules populated
                        from vendor content (Tier 1). Ruleset-free mode
                        uses vendor as the sole Ruleset Wisdom source.
        ↓
src/index.ts            McpServer: 33 action-discriminator tools, 38 resources and 21 resource templates, 5 prompts.
                        Entry point for STDIO transport. Badge gating via
                        requireGM()/requirePlayer()/requireNotObserver(). Error taxonomy.
                        Narrative-intent verbs (ask/tell/give/show/throw) and
                        vehicle-aboard state are resolved here (Novel + entity serve
                        as the surfaces for NPC resolution, item transfer, and
                        [vehicle-entry]/[vehicle-exit] story-journal moments).
```

## Tool Surface (33 tools — the REQ-429 recorded budget in DECISIONS.md)

- **Badges & Workflow:** set_badge, respond_decision, manage_history (action: undo/redo)
- **manage_character** (action: create/stage/import/sheet/set_active/personality/voice/signal/remove/roster_remove/roster_list) — player characters, roster, step-by-step [NEED_INPUT] workflow
- **manage_npc** (action: create/update/remove/list/get) — GM NPC management
- **manage_world** (action: create_room/update_room/remove_room/create_thing/update_thing/remove_thing/create_exit/remove_exit/convert) — world-model rooms, things, exits
- **run_command** (action: execute/resolve/suggest) — parser dispatch, spatial intent resolution, action suggestions
- **manage_combat** (action: init/advance/end/add_participant/remove_participant/status) — GM combat lifecycle
- **manage_condition** (action: apply/remove/list) — mechanical/narrative conditions
- **manage_countdown** (action: set/advance/remove/list) — GM countdown timers
- **manage_faction** (action: create/update/remove/list) — GM factions and progress clocks
- **manage_vow** (action: set/milestone/resolve/forsake/list) — GM narrative vows
- **manage_relationship** (action: set/get) — directed entity relationships
- **manage_lore** (action: set/update/remove/toggle/group/suggest/list/get/export/import/set_secret/reveal/secret_list/knowledge) — Novel lore entries and secrets
- **manage_story** (action: record/update/remove/list/promote) — story journal beats
- **manage_note** (action: set/remove/list/set_server/remove_server/list_server) — Novel-scoped and server notes
- **manage_codex** (action: set/list/get/capture/import/delete) — cross-Novel reusable content library
- **manage_novel** (action: create/resume/switch/end/export/import/rename/description/list/archive/unarchive/info/genre/clone/branch/save_context/get_context/checkpoint_set/checkpoint_list/checkpoint_restore/checkpoint_remove) — save-file lifecycle, including event-log branching (REQ-458/REQ-459)
- **manage_adventure** (action: generate/generate_encounter/load/list) — adventure scaffolds and encounters
- **manage_synthesis** (action: run/revert/list/activate/deactivate/toggle/toggle_action/player_add/player_remove/player_list) — Ruleset Wisdom and synthesis content
- **manage_ruleset** (action: search/install/remove/list/bind/roll) — ruleset lookup, package, and generation-table roll
- **manage_scene** (action: set/directive/presence/autonomy/choices/oracle) — scene state and narrative framing
- **manage_session** (action: recap/verbosity/briefing_order/compress/compact/health/subscribe/discover/category/event/history) — session recap, verbosity, briefing order, audit summary prompt (compress), irreversible audit-log compaction (compact), event subscriptions, tool discovery/category reassignment, event-log append/read (REQ-455–457/REQ-460), and the `spec_health` report
- **manage_belief** (action: list/get/evidence/admit/retract/conflicts/reconcile) — per-entity evidence and reconciled belief stances (REQ-461–REQ-472)
- **manage_identity** (action: stage/accept/reject/list/snapshot/bootstrap) — Roster-tier character identity: staged candidates, accepted facets, versioned kernel (REQ-473–REQ-483)
- **manage_causal** (action: propose/admit/reject/list/state/ingress) — objective-state transition validation and the transition ledger (REQ-484–REQ-495)
- **manage_corpus** (action: register/list/get/route/grant/deny/access/consume/acquisitions) — cold reference material and per-entity knowledge acquisition (REQ-496–REQ-503)
- **manage_knowledge** (action: index_build/index_status/index_list/index_search/index_relations/graph_build/graph_status/graph_get/graph_nodes/graph_edges/graph_neighbors) — derived semantic index (REQ-504–REQ-509) and knowledge-graph projection (REQ-510–REQ-514); in-memory, advisory, read-only reads
- **manage_agent** (action: create/list/get/start/advance/complete/fail/cancel) — durable NPC/agent task and action lifecycle (REQ-522–REQ-530)
- **manage_perception** (action: record/list/for_entity/for_event) — per-entity perception ledger, observed not believed (REQ-540–REQ-545)
- **resolve_fate** (action: roll/aspect/fate_point/stress) — Fudge dice, aspects, Fate points, stress/consequences
- **resolve_ironsworn** (action: momentum/move/progress) — Ironsworn momentum, move framework, progress tracks
- **resolve_forged** (action: action_roll/stress/downtime) — Forged in the Dark action rolls, stress/trauma, downtime

**Tool annotations (REQ-450 / REQ-015).** Every host tool carries all four MCP
mutation-class hints (`readOnlyHint`, `destructiveHint`, `idempotentHint`,
`openWorldHint`) as explicit booleans, set in the `TOOL_ANNOTATIONS` map in
`src/index.ts`. All 33 tools are command/hybrid (`destructiveHint: true`);
`openWorldHint` is `false` everywhere (REQ-051 — no network). Registering a host
tool without a map entry throws at startup; ruleset-derived tools (REQ-379)
compute their hints from `schema.kind`. Adding a tool requires a corresponding
`TOOL_ANNOTATIONS` entry — T536 (in `scripts/test-security.ts`) enforces the
four-hint contract.

## Running

```bash
cd holonovel && npm run start     # start server
npm run typecheck               # TypeScript type checking
```

Verification harnesses (`npm run test:*`) include the Holonovel Pattern Buffer
(`test:pattern-buffer`, §6.6 Holonovel Pattern Buffer sub-workflows I1–I18) and
the Ruleset-scope suite (`test:pattern-buffer-ruleset`, §6.6 sub-workflows
S1–S37 — in-tree scaffolding for ruleset builds; server-native ones execute;
mechanics-fidelity ones record `skipped — ruleset hash unchanged`; S30/S31
execute (REQ-372 supplementary import; REQ-373 is a terminal builder-scope
non-goal); the rest are `follow-on` increments, all summarized in the emitted
`ruleset-pattern-buffer-manifest.json`).

Tests live in `scripts/test-*.ts` and run as tsx harnesses via `npm run test:all`.
There are no conventional `*.test.ts` files or a `test/` directory, so registry
crawlers that detect tests by filename will report none — this is expected.

## Boot

```bash
npm install
npm run start
```

## State Model

- **Roster:** Persistent character store at `.holonovel-state/roster.json`. Staged via `manage_character (action: stage)` / `manage_character (action: create, stage_to_roster=true)`; imported into a novel via `manage_character (action: import)`. Entries carry name, personality, voice examples, inventory, and optional ruleset-derived `stats`.
- **Novels:** Named persistent save files at `.holonovel-state/novels/<slug>.json`. Atomic saves. End moves to `.trash/`.
- **World Model:** Rooms, things, exits persisted within the Novel's JSON. Indexed at runtime as Maps.
- **Snapshots:** Per-mutation snapshots per badge stack (`manage_history` action: undo/redo).
- **Audit:** Append-only chained log embedded in novel state.

## Two-Repo Workflow (commit canonical source first)

This server ships in one repo but runs in two locations:

- **Workspace** `/home/fluke/Holonovel/holonovel/` — the canonical source of
  truth. This is where you edit and **commit**.
- **Deployed** `/home/fluke/Holonovel-deployed/holonovel/` — the running
  instance. It is updated by a deployment job that runs
  `git pull --ff-only origin main`, which **discards any uncommitted working
  tree edits** and resets the tree to `origin/main`. Runtime data
  (`.holonovel-state/`, novels, rulesets, roster) is preserved by REQ-396,
  but source edits are not.

**Standing rules:**

1. Never begin coding against the deployed copy. Edit and test against the
   workspace source; commit there.
2. If you must edit the deployed copy (e.g. to inspect runtime state or
   install a ruleset package), be aware that source-level edits there will be
   wiped on the next deploy pull. Re-do any source change in the workspace
   and commit it.
3. After committing in the workspace, the deployment pipeline (push-pipeline)
   propagates the change to the deployed instance. Do not hand-copy source
   files between the two repos.
4. Ruleset packages (e.g. `dnd5e`) live only in the deployed instance's
   install directory — keep them out of the workspace git tree (REQ-395a).

## Retiring a server (data preservation)

When a server generation is retired, its `.holonovel-state/` data is user
campaigns, not build output. **Retire by migrate-or-trash, never hard-delete:**

1. Consolidate first — run
   `npx tsx scripts/consolidate-novels.ts --data-dir <canonical> --scan-dir <legacy>/novels`
   and import any Novels not already present in the canonical dir.
2. Move the legacy state dir to the OS Trash rather than `rm -rf`, so the
   Novels remain recoverable if step 1 missed something.
3. Prune bounded runtime junk (crash snapshots, old ruleset backups) with
   `npx tsx scripts/retention-prune.ts --data-dir <canonical> --prune`.

This is the process that would have preserved the `mothership-holonovel`
campaign "Another Bug Hunt"; its state dir was hard-deleted on retirement and
the save file had to be reconstructed from the session transcript.
