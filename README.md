# Holonovel

Holonovel is a build prompt that instructs an AI agent how to turn Markdown
tabletop RPG rulebooks into an interactive MCP server.

## Purpose

Tabletop RPG players and game masters want their rulebooks at their fingertips —
searchable rules, automated dice rolls, combat tracking — but wiring up a tool
bridge for every game system is tedious, error-prone manual work. Holonovel
eliminates that work. Drop in your rulebooks as Markdown, run one AI agent, and
you get a fully functional MCP server.

`holonovel.md` is a self-contained build specification. An AI agent reads it
alongside your Markdown ruleset, then follows the spec to parse the source
material, model every rule as structured data, verify internal consistency, and
package the result into a working MCP server. No glue code, no hand-written
integrations — the spec drives the entire build.

The finished server gives you rules-aware dice rolls, initiative and combat
management, monster and spell lookups, equipment catalogs, character sheets with
leveling, rollable random tables, and encounter-building tools for the game
master — all sourced directly from your books. To run adventures, you pick a
persona: the player persona lets the AI act as game master, calling tools for
mechanics and narration while gating content the player shouldn't see; the game
master persona gives you full access and adjudication powers.

## Implementation recommendations

- **Using the prompt.** Download `holonovel.md`, place it alongside your
  Markdown-format ruleset files, and feed them into an AI agent with a prompt
  such as: *Use holonovel.md to build a server using `players-handbook.md`.*
  The agent will follow the spec to parse, model, verify, and package the
  ruleset into a working MCP server.
- **Preparing the ruleset files.** If the pre-check finds the ruleset deficient
  in Markdown formatting, the builder applies formatting rules to the
  source material before chunked reading begins.
- **Builds in TypeScript** — For the MCP server it produces, TypeScript is the mandated
  implementation language.
- **DeepSeek Pro** is my primary AI for both building this project and running the
  prompt. I use Opencode Go for access to DeepSeek models. On my computer,
  Deepseek v4 Pro built an MCP server for D&D 2024 (Players Handbook, Dungeon Master's Guide, and Monster Manual) for US $2.
- **`character-sheet-from-pdf.md`** is a prompt that guides building
  a character-sheet rendering MCP tool from a PDF. The process covers
  field-by-field study of the PDF layout, translating the field inventory
  to a typed data model, building a format-agnostic derivation layer (modifier
  math, proficiency checks, equipment resolution), and wiring up dual
  renderers (ASCII plain-text and Markdown). Ruleset-agnostic and
  MCP-server-agnostic — works with any holonovel-built server.

## Validating

```sh
npm run check
```

This runs:

- `npm run lint` — style checks via [markdownlint](https://github.com/DavidAnson/markdownlint)
- `npm run validate` — cross-reference checker (REQ citations, test IDs, TOC sync,
  heading separators, requirement block shape)

Also available separately:

- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)

Prerequisites: Node.js 20+ (for `markdownlint-cli`, `tsx`, and `typescript`).

## Project structure

```
Holonovel/
├── holonovel.md                ← the complete build specification
│                                 (includes the ruleset preparation
│                                 prompt as Appendix H)
├── character-sheet-from-pdf.md  ← prompt: build character sheet
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
└── README.md              ← this file
```

## Versioning

No formal versioning yet. See [CHANGELOG.md](CHANGELOG.md) for revision
history.
