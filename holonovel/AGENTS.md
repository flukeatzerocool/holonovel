# AGENTS.md — holonovel MCP Server (v2026.08.07)

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
                        countdowns, lore, enrichment, snapshots (per-hat
                        undo/redo stacks), audit log, hat gating, workflows,
                        build fingerprint. Atomic persistence.
        ↓
src/macros.ts           expandMacros — {{entity.name}}, {{scene.current}},
                        {{scene.type}}, {{countdown.<n>.remaining}},
                        {{countdown.<n>.total}}, {{novel.slug}}, {{hat.active}},
                        {{party.size}}, {{world.room}}, {{world.room_count}},
                        {{world.thing_count}}.
        ↓
src/enrichment.ts       Enrichment manifest — 7 output modules populated
                        from vendor content (Tier 1). Ruleset-free mode
                        uses vendor as the sole enrichment source.
        ↓
src/index.ts            McpServer: ~44 tools, ~22 resources, 5 prompts.
                        Entry point for STDIO transport. Hat gating via
                        requireGM()/requirePlayer(). Error taxonomy.
```

## Tool Surface (~44 tools)

- **Hat & Workflow:** set_hat, respond, undo, redo, help
- **Characters:** create_character (ruleset-free), import_character, character_sheet, set_active_entity, set_personality, set_voice_examples, player_signal
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

- **Roster:** Persistent character store at `.holonovel-state/roster.json`. Ruleset-free entities: name + personality fields only.
- **Novels:** Named persistent save files at `.holonovel-state/novels/<slug>.json`. Atomic saves. End moves to `.trash/`.
- **World Model:** Rooms, things, exits persisted within the Novel's JSON. Indexed at runtime as Maps.
- **Snapshots:** Per-mutation snapshots per hat stack (undo/redo).
- **Audit:** Append-only chained log embedded in novel state.
