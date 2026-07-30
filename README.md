# Holonovel

A build specification for an MCP server that serves tabletop RPG rulesets from
Markdown sources. This is the specification document, not an implementation.

## Purpose

`holonovel.md` is a self-contained specification and build prompt. Point an AI
agent at it along with a Markdown-format TTRPG ruleset and it will construct a
working MCP server — a tool bridge that lets you look up rules, roll dice,
track combat, manage characters, and reference monsters, spells, and equipment
directly from the source books. Servers support two personas: a player persona
with access limited to the player-facing rulebook, and a game master persona
with full access across all source materials.

## Implementation recommendations

- **Using the prompt.** Download `holonovel.md`, place it alongside your
  Markdown-format ruleset files, and feed them into an AI agent with a prompt
  such as: *Use holonovel.md to build a server using `players-handbook.md`.*
  The agent will follow the spec to parse, model, verify, and package the
  ruleset into a working MCP server.
- **Preparing the ruleset files.** If the §5 pre-check (Appendix H of `holonovel.md`) finds the ruleset deficient
  in Markdown formatting, the builder applies Appendix H's formatting rules to the
  source material before chunked reading begins.
- **Builds in TypeScript** — For the MCP server it produces, TypeScript is the mandated
  implementation language (Section 3 of the spec): strong typing catches ruleset
  schema mismatches at build time, and the spec's entity model maps naturally to
  TS interfaces.
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
