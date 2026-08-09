# D&D 5e Holonovel — MCP Server

AI-powered D&D 5th Edition Game Master, built by the Holonovel specification.

## Quick Start

```bash
cd dnd5e-holonovel
npm install
npm run build    # index ruleset files
npm run start    # launch MCP server
```

## Tools

**106 tools** covering character management, dice rolling, combat, conditions, NPCs, factions, secrets, relationships, lore, countdowns, rules lookup, adventure generation, session recap, and novel lifecycle.

## Ruleset

D&D 5th Edition SRD v5.1 (Wizards of the Coast, 2016) — 1,021 Markdown files sourced from `oldmanumby/dnd.srd.5.1` (5esrd branch, CC BY 4.0).

## Requirements

- Node.js 20+
- npm

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `TTRPG_DATA_DIR` | `.holonovel-state` | State persistence directory |
| `TTRPG_SEED` | `Date.now()` | PRNG session seed |

## License

Ruleset data: OGL + CC BY 4.0. Server code: MIT. See `LICENSE.md`.

## Spec

Built by [Holonovel](https://git.gay/flukeatzerocool/Holonovel) v2026.08.09.
