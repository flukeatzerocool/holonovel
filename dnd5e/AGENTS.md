# AGENTS.md — D&D 5e Holonovel MCP Server (v2.1)

AI maintainer orientation for the D&D 5e Holonovel MCP server implementation.

## Layer Map

```
src/dice.ts             PRNG (LCG 1664525/1013904223), rollD20, rollDice,
                        abilityModifier, proficiencyBonus
        ↓
src/data.ts             Structured ruleset data: ABILITY_SCORES, SKILLS,
                        SKILL_MAP, CONDITIONS, RACES, RACE_MODIFIERS, CLASSES,
                        plus lookup functions. Imports frozen JSON from
                        src/generated/. Indexes 1,021 ruleset Markdown files
                        for search_rules.
        ↓
src/state.ts            StateManager singleton: novels (Map<slug, NovelState>),
                        roster, NPCs, scene, countdowns, lore, enrichment,
                        adventures, snapshots (per-persona undo stacks),
                        audit log, persona gating, workflows, build fingerprint.
                        Atomic persistence to .holonovel-state/ via tmp + rename
                        + .bak retention.
        ↓
src/macros.ts           expandMacros — {{entity.name}}, {{entity.hp}},
                        {{entity.<stat>}}, {{scene.current}}, {{scene.type}},
                        {{countdown.<n>.remaining}}, {{countdown.<n>.total}},
                        {{novel.slug}}, {{persona.active}}, {{party.size}}.
                        Unknown macros preserved as literals.
        ↓
src/enrichment.ts       Enrichment manifest — 6 output modules:
                        voice_examples (5), briefing_order (1),
                        lore_templates (10), action_patterns (10),
                        supplementary_guidance (19), adventure_advice (11).
                        Additive, inert, idempotent per build fingerprint.
        ↓
src/index.ts            McpServer: registers 54 tools, 31 resources, 7 prompts.
                        Entry point for STDIO transport. Persona gating via
                        requireGM(). Error taxonomy: [FORBIDDEN], [NOT_FOUND],
                        [INVALID_INPUT], [STATE_CONFLICT], [RULE_VIOLATION],
                        [UNIMPLEMENTED].
```

## Tool Surface (54 tools)

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
`set_lore_entry` `remove_lore_entry` `toggle_lore_entry` `set_lore_group`
`suggest_lore` `export_lorebook` `import_lorebook`

### Guidance (GM only)
`set_briefing_order` `compress_audit` `load_adventure`
`generate_adventure` `generate_encounter`

### Session
`session_recap`

## Tool Registry

All tools registered via `server.registerTool()`. GM-only tools gated with `requireGM()`. Player-only tools (`player_signal`) gated for player persona. Tool names use `snake_case`. No persona (null) = full access.

## State Model

- **Roster:** Persistent character store at `.holonovel-state/roster.json`. Baselines immutable (narrative fields mutable per REQ-077).
- **Novels:** Named persistent save files at `.holonovel-state/novels/<slug>.json`. Atomic saves (write `.tmp`, rename over target, retain `.json.bak`). Removed by `end_novel` (file + backup). One active per server instance.
- **Snapshots:** Per-mutation snapshots per persona stack. `undo` restores; empty stack returns `[STATE_CONFLICT]`.
- **Audit:** Append-only log embedded in novel state. Not mutated by `compress_audit` (idempotent per REQ-086).

## RNG

Linear Congruential Generator (1664525/1013904223), seedable per session (`TTRPG_SEED`) or per call (optional `seed` param). Same seed + same call sequence = same results.

## Running

```bash
cd dnd5e && npm run start          # start server
npm run build-index                 # regenerate extraction data
npm run typecheck                   # TypeScript type checking
npx tsx scripts/test_scripts/run_all.ts  # run all tests
```

## Build

```bash
npm install
npm run build    # runs build-index to extract ruleset data
```

## Troubleshooting

### Config mismatch
Ensure the `cwd` in your MCP client config matches the actual project directory. The server is `dnd5e-holonovel` with cwd pointing to the `dnd5e/` directory containing `package.json`.

### Corrupted state
`spec_health` reports corrupted states. Delete `.holonovel-state/novels/<corrupted-slug>.json` and its `.json.bak` to recover. Roster data in `.holonovel-state/roster.json` is independent.

### Build fingerprint mismatch
A build fingerprint mismatch on startup means the ruleset was modified after the server was built. Run `npm run build` to regenerate extraction data. Novel state loads gracefully — missing fields receive defaults; extra fields preserved as inert data.

### Persona confusion
GM-only tools return `[FORBIDDEN]` directing to `set_persona`. Use `set_persona("game_master")` to switch. `set_persona` is never persona-gated.

### Missing environment variables
`TTRPG_DATA_DIR` defaults to `.holonovel-state`. `TTRPG_SEED` defaults to `Date.now()`. No other variables are required for basic operation.
