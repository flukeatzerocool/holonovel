# D&D 5e Holonovel MCP Server

An MCP server that serves the D&D 5e SRD v5.1 ruleset — 1,021 Markdown files extracted into structured data (37 weapons, 14 armor, 319 spells, 318 monsters, 239 magic items) and exposed as a conversational tabletop RPG engine.

Built by [Holonovel](https://github.com/anomalyco/Holonovel) v2026.08.05.

## Setup

**Prerequisites:** Node.js 20+

```bash
cd dnd5e
npm install
npm run build        # extracts ruleset data
```

## Opencode Configuration

Add to `~/.config/opencode/opencode.json`:

```json
{
  "mcpServers": {
    "dnd5e-holonovel": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/home/fluke/Holonovel/dnd5e"
    }
  }
}
```

## Persona Model

| Persona | Alias | What It Can Do |
|---------|-------|---------------|
| **Player** | — | Create/import characters, view sheets, roll saves/skills/attacks/damage, manage conditions, search rules, lookup equipment/spells/monsters, roll on tables, request session recaps, send player signals |
| **Game Master** | **DM** | Everything the Player can do, plus: initiate/advance/end combat, manage NPCs, set scenes and countdowns, manage lore entries, load adventures, generate encounters/adventures, switch personas |

Use `set_persona` to switch between `player` and `game_master`. Player-only tools (`player_signal`) are gated for the player persona. GM-only tools reject with `FORBIDDEN` when the active persona is `player`.

## State Model

| Store | Path | Lifetime | Contents |
|-------|------|----------|----------|
| **Roster** | `.holonovel-state/roster.json` | Cross-session | Saved character baselines (library) |
| **Novels** | `.holonovel-state/novels/<slug>.json` | Persistent | All entities, NPCs, combat, scene, countdowns, lore, enrichment, adventures, audit log, persona state. Survives restarts and rebuilds. |
| **Snapshots** | In-memory, persisted to novel file | Per-mutation | Undo stack (one level deep per persona) |
| **Audit** | Embedded in novel file | Append-only | Ordered log of all mutations |

- State persists across process restarts. Novel saves are atomic (temp file + rename + backup).
- `undo` rolls back to the most recent snapshot.
- `end_novel` deactivates persona, removes the Novel file and backup from disk. Roster survives.

## RNG

- **Algorithm:** Linear Congruential Generator, constants 1664525 / 1013904223.
- **Seeding:** Session seed generated at startup. Each roll tool accepts an optional per-call `seed` parameter for reproducible rolls.
- **Dice primitives:** `rollD20(advantage?, seed?)`, `rollDice(count, sides, seed?)`.
- **Derived:** `abilityModifier(score)`, `proficiencyBonus(level)`.

## Tool Surface (54 tools)

| Category | Tools |
|----------|-------|
| Novel & Persona | `set_persona`, `respond`, `undo`, `help`, `spec_health`, `end_novel`, `end_game`, `create_novel`, `resume_novel`, `set_active_entity` |
| Characters | `create_character`, `import_character`, `character_sheet`, `set_personality`, `set_voice_examples`, `player_signal` |
| Dice & Resolution | `roll_save`, `roll_skill_check`, `roll_weapon_attack`, `roll_weapon_damage`, `roll_on_table` |
| Combat | `init_combat`, `advance_combat`, `end_combat`, `apply_condition`, `remove_condition` |
| Lookups | `search_rules`, `lookup_equipment`, `lookup_spell`, `lookup_monster`, `lookup_class` |
| State | `set_scene_state`, `set_scene_type`, `set_narrative_directive` |
| NPCs | `create_npc`, `update_npc`, `remove_npc` |
| Countdowns | `set_countdown`, `advance_countdown`, `remove_countdown` |
| Lore | `set_lore_entry`, `remove_lore_entry`, `toggle_lore_entry`, `set_lore_group`, `suggest_lore`, `export_lorebook`, `import_lorebook` |
| Guidance | `set_briefing_order`, `suggest_actions`, `compress_audit`, `load_adventure`, `generate_adventure`, `generate_encounter` |
| Session | `session_recap` |

## Resources (31)

`ruleset://`, `entities://`, `entity://{id}`, `entity://{id}/personality`, `entity://{id}/voice_examples`, `audit://novel`, `roster://`, `party://current`, `npcs://`, `npc://{id}`, `lore://active`, `lore://{key}`, `lore://templates`, `adventure://{slug}/{anchor}`, `novel://current`, `novel://{slug}`, `novel://setup`, `guidance://game_master`, `guidance://player`, `guidance://shared`, `guidance://shared/persona-switch`, `guidance://{role}/anti-slop`, `guidance://{role}/voice`, `guidance://{role}/foundations`, `enrichment://voice_examples`, `enrichment://briefing_order`, `enrichment://adventure_advice`, `resources/templates/list`, `scene://current`, `countdown://active`

## Prompts (7)

`intro`, `persona_briefing`, `use_tool`, `lookup_rule`, `run_workflow`, `session_zero`, `novel_setup`

## Example Usage

```text
# Create a character
[call] create_character

# Import from roster
[call] import_character { "roster_id": "alder-1" }

# View character sheet
[call] character_sheet { "entity_id": "alder-1" }

# Roll a Dexterity saving throw
[call] roll_save { "save": "dexterity", "entity_id": "alder-1" }

# Search for a rule
[call] search_rules { "query": "grapple" }

# Look up a spell
[call] lookup_spell { "name": "Fireball" }

# Look up a monster
[call] lookup_monster { "name": "Goblin" }

# Start combat
[call] init_combat { "participants": ["alder-1"], "dangers": [{"name": "Goblin", "ac": 15, "hp": 7}] }

# Attack
[call] roll_weapon_attack { "weapon": "Longsword", "entity_id": "alder-1", "target_ac": 15 }

# End combat
[call] end_combat { "outcome": "Party victory" }
```

## Environment Variables

| Variable | Required | Meaning |
|----------|----------|---------|
| `TTRPG_DATA_DIR` | No | State directory (default `.holonovel-state`) |
| `TTRPG_SEED` | No | String seed for the deterministic PRNG |
| `TTRPG_NOVEL` | No | Novel identifier for cross-connection persistence |
| `TTRPG_PERSONA` | No | Default active persona on startup |
| `TTRPG_ADVENTURE` | No | Comma-separated paths to adventure Markdown files |

## License

- **Ruleset Data:** Open Game License v1.0a + CC BY 4.0 (see `LICENSE.md`)
- **Server Code:** MIT (see `package.json`)
