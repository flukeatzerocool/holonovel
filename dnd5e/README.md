# D&D 5e Holonovel MCP Server

An MCP server that serves the D&D 5e SRD v5.1 ruleset — 1021 Markdown files
extracted into structured data (37 weapons, 14 armor, 319 spells, 318 monsters,
239 magic items) and exposed as a conversational tabletop RPG engine.

## Setup

**Prerequisites:** Node.js 20+

```bash
cd dnd5e-holonovel
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
      "cwd": "/home/fluke/Holonovel/dnd5e-holonovel"
    }
  }
}
```

## Persona Model

| Persona        | Alias | What It Can Do                                                  |
|----------------|-------|-----------------------------------------------------------------|
| **Player**     | —     | Create/import characters, view sheets, roll saves/skills/attacks/damage, cast spells, manage conditions, search rules, lookup equipment/spells/monsters/magic items, roll on tables, request session recaps |
| **Game Master** | **DM** | Everything the Player can do, *plus*: initiate/advance/end combat, apply/remove conditions on any entity, manage the roster, switch personas |

The `set_persona` tool switches between `player` and `game_master` modes.
GM-only tools reject with `FORBIDDEN` when the active persona is `player`.

## State Model

| Store      | Path                                  | Lifetime         | Contents                                |
|------------|---------------------------------------|------------------|-----------------------------------------|
| **Roster** | `.holonovel-state/roster.json`        | Cross-session    | Saved character baselines (library)     |
| **Games**  | `.holonovel-state/game-{id}.json`     | Per-session      | Active entities, combat state, conditions |
| **Snapshots** | In-memory, persisted to game file | Per-turn         | Undo stack (one level deep)             |
| **Audit**  | `.holonovel-state/audit.json`         | Append-only      | Ordered log of all mutations            |

- State persists across process restarts. Snapshots are saved on every mutation.
- `undo` rolls back to the most recent snapshot.
- `session_recap` dumps the audit log for the active game.

## RNG

- **Algorithm:** Linear Congruential Generator (LCG), constants 1664525 /
  1013904223 (standard numerical recipes).
- **Seeding:** Session seed generated at startup from `Math.random()`. Each
  roll tool accepts an optional per-call `seed` parameter for reproducible
  rolls (useful for testing or replay).
- **Dice primitives:** `rollD20(advantage, seed)`, `rollDice(count, sides, seed)`.
- **Derived:** `abilityModifier(score)`, `proficiencyBonus(level)`.

## Example Usage

```text
# Create a character
[call] create_character

# Import a character from the roster
[call] import_character { "roster_id": "alder-1" }

# View character sheet
[call] character_sheet { "entity_id": "alder-1" }

# Roll a Dexterity saving throw
[call] roll_save { "save": "dexterity", "entity_id": "alder-1" }

# Roll a Wisdom (Perception) skill check
[call] roll_skill_check { "skill": "perception", "entity_id": "alder-1" }

# Make an attack with a longsword
[call] roll_attack { "weapon": "longsword", "target_id": "goblin-1", "entity_id": "alder-1" }

# Roll damage
[call] roll_damage { "weapon": "longsword", "target_id": "goblin-1", "attacker_id": "alder-1" }

# Search the ruleset
[call] search_rules { "query": "grapple" }

# Look up a spell
[call] lookup_spell { "name": "fireball" }

# Look up a monster
[call] lookup_monster { "name": "ancient red dragon" }

# Combat (GM only)
[call] init_combat { "participants": ["alder-1", "goblin-1", "goblin-2"] }
[call] advance_combat { "action": "attack", "target_id": "goblin-1", "weapon": "longsword" }
[call] end_combat { "outcome": "victory" }

# Conditions (GM only)
[call] apply_condition { "entity_id": "alder-1", "condition": "poisoned" }
[call] remove_condition { "entity_id": "alder-1", "condition": "poisoned" }

# Roll on a random table
[call] roll_on_table { "table": "trinkets" }

# Get a session recap
[call] session_recap
```

## Available Tools

23 tools: `set_persona`, `respond`, `undo`, `help`, `spec_health`,
`search_rules`, `lookup_equipment`, `lookup_spell`, `lookup_monster`,
`create_character`, `character_sheet`, `import_character`, `roll_save`,
`roll_skill_check`, `roll_attack`, `roll_damage`, `apply_condition`,
`remove_condition`, `roll_on_table`, `init_combat`, `advance_combat`,
`end_combat`, `session_recap`.

## License

Ruleset content: OGL 1.0a + CC BY 4.0 (Wizards of the Coast SRD v5.1).
Server code: MIT.
