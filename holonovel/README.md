# holonovel

**The Holodeck for your rulebooks — rules enforced, worlds remembered.**

A world-model MCP server for tabletop RPG play: rooms, things, exits, a
parser command layer, and narrative tools, with out-of-the-box mechanics from
Fate, Ironsworn, and Blades in the Dark (Fudge dice, momentum, and stress
tracks — no ruleset required). Install it, then drop in any number of ruleset
packages; each loads alongside the base and never modifies it.

## Requirements

- Node.js 22+

## Install

```sh
npx -y holonovel
```

A fresh install is playable without a rulebook: the server seeds **Torre
Nosferatu**, a tutorial Novel, and `open_session` resumes it in one call. Set
`TTRPG_STARTER_NOVEL=off` to start with an empty world instead.

From a source checkout, run `npm install` and `npm run start` while developing;
for a non-development run, `npm run build && node dist/index.js`.

## MCP client configuration

```json
{
  "mcpServers": {
    "holonovel": {
      "command": "npx",
      "args": ["-y", "holonovel"]
    }
  }
}
```

## Data

A Novel is a structured save file with atomic saves, per-badge undo/redo
snapshots, and an append-only audit log. By default the state directory is the
operating system's user-data location: `~/.local/share/holonovel` on Linux,
`~/Library/Application Support/holonovel` on macOS, or
`%LOCALAPPDATA%\holonovel` on Windows. Set `TTRPG_DATA_DIR` to override it. An
existing `.holonovel-state/` beside the server is honored for compatibility.

Campaign data and installed packages live under the state directory, outside
the server tree, so updating holonovel never touches them. A container or hosted
deploy keeps that directory inside the container — point `TTRPG_DATA_DIR` at a
mounted volume to keep campaigns across restarts.

## Tool surface

The host exposes 36 action-discriminator tools covering persisted entity
types, the parser command layer, and base-mechanics resolvers. Retired tool
aliases are hidden from the default listing. Every tool carries all four MCP
mutation-class hints and a three-clause description (see `AGENTS.md` for the
full surface and the tool-definition authoring standard).

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
| `TTRPG_DATA_DIR` | State directory (default: the per-user data location) |
| `TTRPG_NOVEL` | Novel to activate at startup |
| `TTRPG_SEED` | Deterministic PRNG seed |
| `TTRPG_RULESETS` | Ruleset slugs to load eagerly |
| `TTRPG_RULESET_DIRS` | Ruleset install directories |
| `TTRPG_NPC_AUTONOMY`, `TTRPG_NPC_MIND` | NPC autonomy behaviors |
| `TTRPG_WORLD_REACTIVITY` | World-in-Motion reactivity (default on) |
| `TTRPG_NARRATION_VALIDATION` | Narration grounding validation |
| `TTRPG_GUIDANCE_PROFILE` | `full` or `lean` guidance |

## Development

```sh
npm run typecheck          # TypeScript type checking
npm run test:all           # verification harnesses
```

Tests are `tsx` harnesses under `scripts/` (there is no `test/` directory).

## License

MIT. See `LICENSE.md`.

Bundled mechanics and Ruleset Wisdom are built from:

- D&D 5e SRD v5.1 (CC BY 4.0 + OGL 1.0a, Wizards of the Coast)
- Graham Nelson's Inform (Artistic License 2.0, Graham Nelson)
- if-craft-corpus (CC BY 4.0, pvliesdonk)
- dmcp (MIT, Shawn Rushefsky)
- lonelog (CC BY-SA 4.0, zeruhur)
- BitD SRD (CC BY 3.0, John Harper)
- Ironsworn: Starforged SRD (CC BY 4.0, Shawn Tomkin)
- Sly Flourish Lazy GM Resource Document (CC BY 4.0, Mike Shea)
- The Alexandrian (CC BY 4.0, Justin Alexander)
- Dungeon World SRD (CC BY 3.0, Sage LaTorra, Adam Koebel)
- Fate SRD (CC BY 3.0, Evil Hat Productions)
- Ironsworn SRD (CC BY 4.0, Shawn Tomkin)
- COF — Character Open File (CC BY 4.0 / CC0 1.0, Yann Souetre)

License texts: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/),
[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/),
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/),
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/),
[MIT](https://opensource.org/license/mit),
[OGL 1.0a](https://opengamingfoundation.org/ogl.html),
[Artistic 2.0](https://opensource.org/license/artistic-2-0).

Upstream sources: [D&D 5e SRD](https://www.dndbeyond.com/srd),
[Inform](https://inform7.com),
[if-craft-corpus](https://pvliesdonk.github.io/if-craft-corpus/),
[dmcp](https://github.com/shawnrushefsky/dmcp),
[lonelog](https://lonelog.org),
[BitD SRD](https://bladesinthedark.com/),
[Starforged SRD](https://ironswornrpg.com),
[Lazy GM](https://slyflourish.com/lazy_gm_resource_document.html),
[The Alexandrian](https://thealexandrian.net),
[Dungeon World SRD](https://www.dungeonworldsrd.com),
[Fate SRD](https://fate-srd.com),
[Ironsworn SRD](https://ironswornrpg.com),
[COF](https://github.com/yannsouetre/cof).
