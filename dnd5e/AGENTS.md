# AGENTS.md — D&D 5e Holonovel MCP Server (v2026.08.06)

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
                        workflows, build fingerprint. Atomic persistence.
        ↓
src/macros.ts           expandMacros — {{entity.name}}, {{entity.hp}},
                        {{entity.<stat>}}, {{scene.current}}, {{scene.type}},
                        {{countdown.<n>.remaining}}, {{countdown.<n>.total}},
                        {{novel.slug}}, {{hat.active}}, {{party.size}}.
        ↓
src/enrichment.ts       Enrichment manifest — 6 output modules:
                        voice_examples, briefing_order, lore_templates,
                        action_patterns, supplementary_guidance,
                        adventure_advice. Additive, inert, idempotent.
        ↓
src/index.ts            McpServer: ~51 tools, ~29 resources, 7 prompts.
                        Entry point for STDIO transport. Hat gating via
                        requireGM()/requirePlayer(). Error taxonomy.
```

## Tool Surface (~51 tools)

- **Hat & Workflow:** set_hat, respond, undo, redo, end_game, help
- **Character:** create_character, import_character, character_sheet, set_active_entity, set_personality, set_voice_examples, player_signal
- **Dice & Resolution:** roll_save, roll_skill_check, roll_weapon_attack, roll_weapon_damage, roll_on_table
- **Lookups:** search_rules, lookup_equipment, lookup_spell, lookup_monster, lookup_class, suggest_actions, spec_health
- **Combat (GM):** init_combat, advance_combat, end_combat
- **Conditions:** apply_condition, remove_condition
- **Narrative (GM):** set_scene_state, set_scene_type, set_narrative_directive
- **NPCs (GM):** create_npc, update_npc, remove_npc
- **Countdowns (GM):** set_countdown, advance_countdown, remove_countdown
- **Lore (GM):** set_lore_entry, remove_lore_entry, toggle_lore_entry, set_lore_group, suggest_lore, export_lorebook, import_lorebook
- **Guidance (GM):** set_briefing_order, compress_audit, load_adventure, generate_adventure, generate_encounter
- **Session:** session_recap
- **Novel Lifecycle:** create_novel, resume_novel, switch_novel, end_novel, export_novel, import_novel
- **Enrichment:** revert_enrichment

## Running

```bash
cd dnd5e && npm run start          # start server
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
