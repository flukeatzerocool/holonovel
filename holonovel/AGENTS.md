# AGENTS.md — holonovel MCP Server (v2026.09.04)

AI maintainer orientation for the holonovel (world-model) MCP server implementation.

## Layer Map

```
src/world-model.ts      World-model data structures: kind hierarchy (thing,
                        container, supporter, door, person, backdrop, region),
                        property contracts, rooms, things, exits, convert_source
                        parser, resource serialization (worldMap, worldKinds).
        ↓
src/parser.ts           Command dispatch: lexer, resolver against world-model
                        state. Handles look, go, take, drop, open, close,
                        unlock/lock, inventory, examine, wait. Side-effect
                        resolution (movement, property mutations).
        ↓
src/state.ts            StateManager singleton: novels, roster, NPCs, scenes,
                        countdowns, lore, enrichment, snapshots (per-badge
                        undo/redo stacks), audit log, badge gating, workflows,
                        build fingerprint. Atomic persistence.
        ↓
src/macros.ts           expandMacros — {{entity.name}}, {{scene.current}},
                        {{scene.type}}, {{countdown.<n>.remaining}},
                        {{countdown.<n>.total}}, {{novel.slug}}, {{badge.active}},
                        {{party.size}}, {{world.room}}, {{world.room_count}},
                        {{world.thing_count}}.
        ↓
src/enrichment.ts       Enrichment manifest — 7 output modules populated
                        from vendor content (Tier 1). Ruleset-free mode
                        uses vendor as the sole enrichment source.
        ↓
src/index.ts            McpServer: 28 action-discriminator tools, ~22 resources, 5 prompts.
                        Entry point for STDIO transport. Badge gating via
                        requireGM()/requirePlayer()/requireNotObserver(). Error taxonomy.
```

## Tool Surface (28 tools)

- **Badges & Workflow:** set_badge, respond, undo, redo, help
- **character** (action: create/stage/import/sheet/set_active/personality/voice/signal/remove/roster_remove/roster_list) — player characters, roster, step-by-step [NEED_INPUT] workflow
- **npc** (action: create/update/remove/list/get) — GM NPC management
- **world** (action: create_room/update_room/remove_room/create_thing/update_thing/remove_thing/create_exit/remove_exit/convert) — world-model rooms, things, exits
- **command** (action: execute/resolve/suggest) — parser dispatch, spatial intent resolution, action suggestions
- **combat** (action: init/advance/end/add_participant/remove_participant/status) — GM combat lifecycle
- **condition** (action: apply/remove/list) — mechanical/narrative conditions
- **countdown** (action: set/advance/remove/list) — GM countdown timers
- **faction** (action: create/update/remove/list) — GM factions and progress clocks
- **vow** (action: set/milestone/resolve/forsake/list) — GM narrative vows
- **relationship** (action: set/get) — directed entity relationships
- **lore** (action: set/update/remove/toggle/group/suggest/list/get/export/import/set_secret/reveal/secret_list/knowledge) — Novel lore entries and secrets
- **story** (action: record/update/remove/list/promote) — story journal beats
- **note** (action: set/remove/list/set_server/remove_server/list_server) — Novel-scoped and server notes
- **codex** (action: set/list/get/capture/import/delete) — cross-Novel reusable content library
- **novel** (action: create/resume/switch/end/export/import/rename/description/list/archive/unarchive/info/genre/clone/save_context/get_context/checkpoint_set/checkpoint_list/checkpoint_restore/checkpoint_remove) — save-file lifecycle
- **adventure** (action: generate/generate_encounter/load/list) — adventure scaffolds and encounters
- **synthesis** (action: run/revert/list/activate/deactivate/toggle/toggle_action/player_add/player_remove/player_list) — enrichment content
- **ruleset** (action: search/install/remove/list/bind/roll) — ruleset lookup, package, and generation-table roll
- **scene** (action: set/directive/presence/autonomy/choices/oracle) — scene state and narrative framing
- **session** (action: recap/verbosity/briefing_order/compress/health/subscribe) — session recap, verbosity, briefing order, audit compression, event subscriptions, and the `spec_health` report
- **fate** (action: roll/aspect/fate_point/stress) — Fudge dice, aspects, Fate points, stress/consequences
- **ironsworn** (action: momentum/move/progress) — Ironsworn momentum, move framework, progress tracks
- **forged** (action: action_roll/stress/downtime) — Forged in the Dark action rolls, stress/trauma, downtime

## Running

```bash
cd holonovel && npm run start     # start server
npm run typecheck               # TypeScript type checking
```

## Boot

```bash
npm install
npm run start
```

## State Model

- **Roster:** Persistent character store at `.holonovel-state/roster.json`. Staged via `character (action: stage)` / `character (action: create, stage_to_roster=true)`; imported into a novel via `character (action: import)`. Entries carry name, personality, voice examples, inventory, and optional ruleset-derived `stats`.
- **Novels:** Named persistent save files at `.holonovel-state/novels/<slug>.json`. Atomic saves. End moves to `.trash/`.
- **World Model:** Rooms, things, exits persisted within the Novel's JSON. Indexed at runtime as Maps.
- **Snapshots:** Per-mutation snapshots per badge stack (undo/redo).
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
