# Holonovel

Holonovel is a build prompt that instructs an AI agent how to turn tabletop RPG
rulesets — from local Markdown files, PDFs, or scraped web SRDs — into an
interactive MCP server.

## What is Holonovel?

Tabletop RPG players and game masters want their rulebooks at their fingertips —
searchable rules, automated dice rolls, combat tracking — but wiring up a tool
bridge for every game system is tedious, error-prone manual work. Holonovel
eliminates that work. Provide your rulebooks in any supported format, run one AI
agent, and you get a fully functional MCP server.

`holonovel.md` is a self-contained build specification. An AI agent reads it
alongside your ruleset, then follows the spec to parse the source material, model
every rule as structured data, verify internal consistency, and package the result
into a working MCP server. No glue code, no hand-written integrations — the spec
drives the entire build.

**Source intake.** Holonovel accepts rulesets through three paths:

- **Markdown files** — you already have formatted Markdown; skip prep and build
  directly.
- **PDF/HTML import** — convert PDF rulebooks or HTML source into spec-compliant
  Markdown via the Appendix F conversion pipeline.
- **Web scrape** — scrape an online SRD (System Reference Document) from a
  permissively-licensed game and convert automatically. Appendix I provides a
  catalog of ten permissively-licensed TTRPGs you can choose from, or you can
  suggest your own URL. The spec verifies the source's license before scraping,
  and the builder presents a hard-stop review of the converted Markdown before
  any server code is written.

**Self-contained output.** At build time, the finalized ruleset Markdown is
bundled into the server output — an internal copy the server reads at runtime,
and a user-facing copy (`ruleset-user/`) for your own reference. The server
requires no external file paths after build.

The finished server gives you rules-aware dice rolls, initiative and combat
management, monster and spell lookups, equipment catalogs, character sheets with
leveling, rollable random tables, and encounter-building tools for the game
master — all sourced directly from your books. To run adventures, you pick a
persona: the player persona lets the AI act as game master, calling tools for
mechanics and narration while gating content the player shouldn't see; the game
master persona gives you full access and adjudication powers.

## Who is this for?

Holonovel is for tabletop RPG enthusiasts who want their rulebooks as
programmable tools — players who want rules-aware dice and character automation,
game masters who want combat tracking and monster lookups, and developers who
want to skip hand-wiring an MCP server and let AI build the bridge instead.

## Project status

Holonovel is in active development. The specification is stabilizing; the build
pipeline has been tested against D&D 2024 (Player's Handbook, Dungeon Master's
Guide, Monster Manual). The web-scrape intake path has been exercised against
the D&D 3.5 SRD (d20srd.org). No formal versioning yet — track changes in
[CHANGELOG.md](CHANGELOG.md).

## Prerequisites

- **Node.js 20+** — required for `markdownlint-cli`, `tsx`, and `typescript`
  (the spec's own validation tooling).
- **An AI agent with access to DeepSeek Pro or an equivalent model** — this
  reads the spec and builds the server. On my computer, DeepSeek v4 Pro built
  an MCP server for D&D 2024 for US $2. I use Opencode Go for DeepSeek access.

## Quick Start

1. Clone this repo or download [`holonovel.md`](holonovel.md).
2. Choose your ruleset source:
   - **Markdown:** place your `.md` files alongside `holonovel.md` and feed
     them to the agent.
   - **PDF/HTML:** point the agent at the source files; it converts them to
     Markdown first (Appendix F).
   - **Web SRD:** ask the agent to scrape a permissively-licensed game. It
     presents a catalog of ten games (D&D 3.5/5e, Pathfinder 1e/2e, Starfinder,
     Traveller, FATE, Blades in the Dark, Dungeon World, Old-School Essentials)
     or you can suggest your own URL. The spec verifies the license before
     scraping.
3. Feed the spec and your ruleset to an AI agent:

   > Use holonovel.md to build a server from `players-handbook.md`.

4. The agent parses, models, verifies, and packages the ruleset into a working
   MCP server. A hard-stop review gate asks you to confirm the Markdown looks
   correct before discovery work begins.
5. (Optional) Validate the spec itself:

   ```sh
   npm install && npm run check
   ```

## Implementation notes

- **Builds in TypeScript** — TypeScript is the mandated implementation language
  for the server and the game code.
- **`character-sheet-generator.md`** is a prompt that guides building
  a character-sheet rendering MCP app from a character sheet PDF. The process
  covers field-by-field study of the PDF layout, translating the field
  inventory to a typed data model, building a format-agnostic derivation layer
  (modifier math, proficiency checks, equipment resolution), wiring up Markdown
  and ASCII renderers, and optional MCP App HTML display. Ruleset-agnostic and
  MCP-server-agnostic — works with any holonovel-built server.

## Validating

```sh
npm run check
```

This runs:

- `npm run lint` — style checks via
  [markdownlint](https://github.com/DavidAnson/markdownlint)
- `npm run validate` — cross-reference checker (REQ citations, test IDs, TOC
  sync, heading separators, requirement block shape)

Also available separately:

- `npm run typecheck` — TypeScript type checking (`npx tsc --noEmit`)

## Project structure

```
Holonovel/
├── holonovel.md                ← the complete build specification
│                                 (includes intake workflow, web-scrape
│                                 sub-flow, hard-stop readiness gates,
│                                 and ruleset preparation prompt as
│                                 Appendix H)
├── character-sheet-generator.md  ← prompt: build character sheet
│                                    rendering on top of a holonovel-built
│                                    server
├── .markdownlint.json     ← lint rules
├── package.json           ← npm scripts (lint, validate, typecheck, check)
├── scripts/
│   └── validate.ts        ← cross-reference checker
├── tsconfig.json           ← TypeScript configuration
├── .githooks/
│   └── pre-commit          ← pre-commit hook
├── .gitignore
├── CHANGELOG.md
├── LICENSE
└── README.md              ← this file
```

## Contributing

- Commit messages follow the [CHANGELOG.md](CHANGELOG.md) style: date-stamped
  headings with bulleted entries. Push to `main`.
- Prose is wrapped near 110 columns (markdownlint enforces a 120-char limit).
  Use ATX headings (`##`, `###`). Separate top-level sections with `---`.
- Run `npm run check` before committing.
- Fork, branch from `main`, make your changes, and open a pull request.

## License

MIT — see [LICENSE](./LICENSE) for details.
