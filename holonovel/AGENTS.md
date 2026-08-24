# AGENTS.md — holonovel MCP Server (v2026.08.24)

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
src/index.ts            McpServer: ~44 tools, ~22 resources, 5 prompts.
                        Entry point for STDIO transport. Badge gating via
                        requireGM()/requirePlayer()/requireNotObserver(). Error taxonomy.
```

## Tool Surface (~44 tools)

- **Badges & Workflow:** set_badge, respond, undo, redo, help
- **Characters:** create_character (quick-create + step-by-step [NEED_INPUT] workflow), stage_character, import_character, character_sheet, set_active_entity, set_personality, set_voice_examples, player_signal
- **World Model:** command, create_room, delete_room, create_thing, delete_thing, create_exit, delete_exit, convert_source
- **Lookups:** search_rules (empty), suggest_actions (context-only), spec_health
- **Combat (GM):** init_combat, advance_combat, end_combat, add_combat_participant, remove_combat_participant
- **Narrative (GM):** set_scene_state, set_scene_type, set_narrative_directive
- **NPCs (GM):** create_npc, update_npc, remove_npc
- **Countdowns (GM):** set_countdown, advance_countdown, remove_countdown
- **Lore (GM):** set_lore_entry, update_lore_entry, remove_lore_entry, toggle_lore_entry, set_lore_group, suggest_lore, export_lorebook, import_lorebook
- **Guidance (GM):** set_briefing_order, compress_audit, load_adventure, generate_adventure, generate_encounter, set_help_category
- **Session:** session_recap
- **Novel Lifecycle:** create_novel, resume_novel, switch_novel, end_novel, export_novel, import_novel
- **Enrichment:** revert_enrichment

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

- **Roster:** Persistent character store at `.holonovel-state/roster.json`. Staged via `stage_character` / `create_character(stage_to_roster=true)`; imported into a novel via `import_character`. Entries carry name, personality, voice examples, inventory, and optional ruleset-derived `stats`.
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
