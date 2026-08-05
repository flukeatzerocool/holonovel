# AGENTS.md — D&D 5e Holonovel MCP Server (v1.2)

AI maintainer orientation for the D&D 5e Holonovel MCP server implementation.

## Layer Map

```
src/dice.ts             PRNG (LCG 1664525/1013904223), rollD20, rollDice,
                        abilityModifier, proficiencyBonus
        ↓
src/data.ts             Structured ruleset data: ABILITY_SCORES, SKILLS,
                        CONDITIONS, RACES, CLASSES, plus lookup functions
                        (lookupWeapon, lookupArmor, lookupSpell,
                        lookupMonster, lookupMagicItem, lookupEquipment,
                        searchRules, buildSearchIndex). Imports frozen
                        JSON from src/generated/.
        ↓
src/state.ts            StateManager: roster, games (Map<id, GameState>),
                        NPCs, scene, countdowns, lore, enrichment, adventures,
                        snapshots (per-game undo stacks), audit log,
                        persona (player|game_master|null), workflows,
                        build fingerprint. Persists to .holonovel-state/.
        ↓
src/index.ts            McpServer: registers all 43 tools, 6 prompts,
                        9 resources, startup + adventure loading.
                        Entry point for STDIO transport.
```

## Tool Surface (43 tools)

### Persona & Workflow
`set_persona` `respond` `undo` `help` `end_game`

### Character
`create_character` `import_character` `character_sheet` `set_active_entity`
`set_personality` `set_voice_examples` `player_signal`

### Dice & Resolution
`roll_save` `roll_skill_check` `roll_weapon_attack` `roll_weapon_damage`
`roll_on_table`

### Rules & Lookup
`search_rules` `lookup_equipment` `lookup_spell` `lookup_monster`
`lookup_class` `suggest_actions` `spec_health`

### Combat (GM only)
`init_combat` `advance_combat` `end_combat`

### Conditions
`apply_condition` `remove_condition`

### Narrative (GM only)
`set_scene_state` `set_scene_type` `set_narrative_directive`

### NPC Management (GM only)
`create_npc` `update_npc` `remove_npc`

### Countdowns (GM only)
`set_countdown` `advance_countdown` `remove_countdown`

### Lore (GM only)
`set_lore_entry` `remove_lore_entry`

### Guidance (GM only)
`set_briefing_order` `compress_audit` `load_adventure`

### Session
`session_recap`

## Tool Registry

All tools registered via `server.registerTool()`. GM-only tools gated with `requireGM()`. Player-only tools (`player_signal`) gated for player persona. Tool names use `snake_case`. No persona (null) = full access.
