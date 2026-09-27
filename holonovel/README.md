# holonovel

**Build the Holodeck. Load your campaign.**

A world-model MCP server for tabletop RPG play: rooms, things, exits, a
parser command layer, and narrative tools, with out-of-the-box mechanics from
Fate, Ironsworn, and Blades in the Dark (Fudge dice, momentum, and stress
tracks — no ruleset required). Install it, then drop in any number of ruleset
packages; each loads alongside the base and never modifies it.

## Requirements

- Node.js 20+

## Install

```sh
npm install
npm run start
```

Or run the published package:

```sh
npx -y holonovel
```

## MCP client configuration

```json
"holonovel": {
  "type": "local",
  "command": ["npx", "tsx", "src/index.ts"],
  "cwd": "<path>/holonovel",
  "environment": {
    "TTRPG_NOVEL": "default"
  },
  "enabled": true
}
```

## Tool surface

The host exposes 34 action-discriminator tools — one per persisted entity
type — plus a parser command tool and three base-mechanics resolvers. Every
tool carries all four MCP mutation-class hints and a three-clause description
(see `AGENTS.md` for the full surface and the tool-definition authoring
standard).

Categories:

- **Badges & Workflow** — badge switching, workflow response, undo/redo
- **Characters & Cast** — player characters, NPCs, identity, beliefs
- **World & Scene** — world model, scene framing, perception, causal state
- **Narrative** — story journal, lore, notes, vows, factions, countdowns
- **Session** — recap, health, discovery, event log, audit
- **Mechanics** — Fate, Ironsworn, and Forged in the Dark resolvers
- **Content** — adventures, codex, ruleset packages, synthesis

## Configuration

Behavioral switches read from the environment; every switch is inert by
default. Common values:

| Variable | Purpose |
|---|---|
| `TTRPG_DATA_DIR` | State directory (default: `.holonovel-state`) |
| `TTRPG_NOVEL` | Novel to activate at startup |
| `TTRPG_SEED` | Deterministic PRNG seed |
| `TTRPG_RULESETS` | Ruleset slugs to load eagerly |
| `TTRPG_RULESET_DIRS` | Ruleset install directories |
| `TTRPG_NPC_AUTONOMY`, `TTRPG_NPC_MIND` | NPC autonomy behaviors |
| `TTRPG_WORLD_REACTIVITY` | World-in-Motion reactivity (default on) |
| `TTRPG_NARRATION_VALIDATION` | Narration grounding validation |
| `TTRPG_GUIDANCE_PROFILE` | `full` or `lean` guidance |

## State

A Novel is a structured save file under `.holonovel-state/novels/<slug>.json`
with atomic saves, per-badge undo/redo snapshots, and an append-only audit
log. Campaign data and installed packages live under `.holonovel-state/`,
outside the server tree, so updating holonovel never touches them.

## Development

```sh
npm run typecheck          # TypeScript type checking
npm run test:all           # verification harnesses
```

Tests are `tsx` harnesses under `scripts/` (there is no `test/` directory).

## License

MIT. See `LICENSE.md`.
