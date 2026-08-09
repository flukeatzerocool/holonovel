# AGENTS.md — D&D 5e Holonovel MCP Server (v2026.08.09)

AI maintainer orientation for the D&D 5e Holonovel MCP server implementation.

## Layer Map

```
src/dice.ts             PRNG (LCG 1664525/1013904223), rollD20, rollDice,
                        abilityModifier, proficiencyBonus, withIsolatedSeed
        ↓
src/data.ts             Structured ruleset data: ABILITY_SCORES, SKILLS,
                        CONDITIONS, RACES (9), CLASSES (12), WEAPONS (37),
                        ARMOR (13), DIFFICULTY_CLASSES, TRAVEL_PACE,
                        XP_THRESHOLDS, PROFICIENCY_BONUS, search index.
        ↓
src/state.ts            StateManager singleton: novels, roster, NPCs,
                        scenes, countdowns, lore, enrichment, snapshots
                        (per-hat undo/redo stacks), audit log, hat gating,
                        workflows, build fingerprint, adventure_index,
                        adventure_scene_waypoint, story_journal, factions,
                        secrets, relationships, dm_context, notes, vows,
                        novel_enrichment, checkpoints. Atomic persistence.
        ↓
src/macros.ts           expandMacros — {{entity.name}}, {{entity.hp}},
                        {{entity.<stat>}}, {{scene.current}}, {{scene.type}},
                        {{countdown.<n>.remaining}}, {{countdown.<n>.total}},
                        {{novel.slug}}, {{hat.active}}, {{party.size}}.
        ↓
src/enrichment.ts       Enrichment manifest — 7 output modules:
                        voice_examples, briefing_order, lore_templates,
                        action_patterns, supplementary_guidance,
                        adventure_advice, narrative_voices. Tier 1
                        (ruleset-native + vendor), additive, inert.
        ↓
src/index.ts            McpServer: ~106 tools, ~29 resources, 5 prompts.
                        Entry point for STDIO transport. Hat gating via
                        requireGM()/requirePlayer(). Error taxonomy.
```

## Tool Surface (~106 tools)

- **Hat & Workflow:** set_hat, respond, undo, redo, end_game, help, set_help_category
- **Character:** create_character, import_character, character_sheet, set_active_entity, set_personality, set_voice_examples, player_signal, present_choices
- **Dice & Resolution:** roll_save, roll_skill_check, roll_weapon_attack, roll_weapon_damage, roll_on_table
- **Lookups:** search_rules, lookup_equipment, lookup_spell, lookup_monster, lookup_class, suggest_actions, spec_health
- **Combat (GM):** init_combat, advance_combat, end_combat, add_combat_participant, remove_combat_participant
- **Conditions:** apply_condition, remove_condition
- **Narrative (GM):** set_scene_state, set_scene_type, set_narrative_directive
- **NPCs (GM):** create_npc, update_npc, remove_npc
- **Factions (GM):** create_faction, update_faction, remove_faction
- **Secrets (GM):** set_secret, reveal_secret, check_knowledge
- **Relationships (GM):** set_relationship, get_relationships
- **Vows (GM):** set_vow, mark_milestone, resolve_vow, forsake_vow
- **Countdowns (GM):** set_countdown, advance_countdown, remove_countdown
- **Lore (GM):** set_lore_entry, update_lore_entry, remove_lore_entry, toggle_lore_entry, set_lore_group, suggest_lore, export_lorebook, import_lorebook
- **Story Journal (GM):** record_story, update_story, remove_story, list_stories
- **Notes:** set_note, remove_note, list_notes
- **Server Notes (GM):** set_server_note, remove_server_note, list_server_notes
- **Pause/Resume (GM):** save_pause_context, get_resume_context
- **Checkpoints (GM):** set_checkpoint, list_checkpoints, restore_checkpoint, delete_checkpoint
- **Guidance (GM):** set_briefing_order, compress_audit, load_adventure, generate_adventure, generate_encounter
- **Oracle (GM):** ask_oracle
- **Adventures:** list_adventures
- **Session:** session_recap
- **Novel Lifecycle:** create_novel, resume_novel, switch_novel, end_novel, export_novel, import_novel, rename_novel, list_novels, novel_info, clone_novel
- **Enrichment:** revert_enrichment

## Running

```bash
cd dnd5e-holonovel && npm run start          # start server
npm run build-index                 # regenerate extraction data
npm run typecheck                   # TypeScript type checking
```

## Boot

```bash
npm install
npm run build    # runs build-index to extract ruleset data
```

## State Model

- **Roster:** Persistent character store at `.holonovel-state/roster.json`. Baselines immutable (narrative fields mutable per REQ-077).
- **Novels:** Named persistent save files at `.holonovel-state/novels/<slug>.json`. Atomic saves. End moves to `.trash/`.
- **Snapshots:** Per-mutation snapshots per hat stack (undo/redo).
- **Audit:** Append-only chained log embedded in novel state.
- **Server Notes:** Server-level notes at `.holonovel-state/server-notes.json`. Survive Novels and rebuilds.

Novel property groups: 17 total (Entities, NPCs, Scene, Combat, World, Countdowns, Lore, Enrichment, Adventure, Adventure Scene Waypoint, Adventure Index, Story Journal, Faction, Secret, Relationship, DM Context, Notes, Vows, Novel Enrichment, Checkpoints).

---

## Cross-Property Coupling

| Pair | Nature | Behavior |
|---|---|---|
| Choice → Countdown | Mechanical | `present_choices` advances countdowns with matching scope |
| Choice → Faction | Mechanical | Choice result matching faction goal advances faction clock |
| Secret → Relationship | Navigational | Secret text implicating entity/faction recommends suspicious relationship |
| DM Context → State | Navigational | `save_pause_context` auto-captures factions, countdowns, NPC dispositions, relationships, story journal, vows |
| Notes → Scene | Navigational | Notes tagged with scene anchors surface when scene is active |
| Adventure → NPC | Mechanical | Structural extraction populates Novel NPCs on `load_adventure` |
