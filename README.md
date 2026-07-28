# Holonovel

A build specification for an MCP server that serves tabletop RPG rulesets from
Markdown sources. This is the specification document, not an implementation.

## Purpose

`holonovel.md` is a self-contained specification and build prompt. Point an AI
agent at it to construct a single-user TTRPG MCP server from any Markdown
ruleset. The spec covers discovery (parsing, extraction, modeling), verification
(gates, derived tests, adversarial review), and handoff (four artifacts).

## Using the prompt

Download `holonovel.md`, place it alongside your Markdown-format ruleset
files, and feed them into an AI agent with a prompt such as:

> Use holonovel.md to build a server using `players-handbook.md`.

The agent will follow the spec to parse, model, verify, and package the
ruleset into a working MCP server — no manual preprocessing required.

## Implementation recommendations

- **TypeScript** for the MCP server. Strong typing catches ruleset schema
  mismatches at build time, and the spec's entity model (typed carriers with
  derivation layers) maps naturally to TS interfaces.
- **Deepseek Pro** (or an equivalent strong reasoning model) as the AI agent
  running the prompt. The spec requires sustained multi-step reasoning —
  parsing heuristics, classification, verification, and adversarial review —
  and Deepseek's performance on complex instruction-following makes it a
  strong fit.

## Validating

```sh
npm run check
```

This runs:

- `npm run lint` — style checks via [markdownlint](https://github.com/DavidAnson/markdownlint)
- `npm run validate` — cross-reference checker (REQ citations, test IDs, TOC sync,
  heading separators, requirement block shape)

Prerequisites: Node.js (for `markdownlint-cli`) and Python 3 (for the
validator).

## Project structure

```
holonovel-spec/
├── holonovel.md           ← the specification (standalone, copy-pasteable)
├── skills/
│   └── character-sheet-from-pdf/
│       └── SKILL.md       ← opencode skill: build character sheet rendering
│                             on top of a holonovel-built server
├── .markdownlint.json     ← lint rules
├── package.json           ← npm scripts (lint, validate, check)
├── scripts/
│   └── validate.py        ← cross-reference checker
├── .gitignore
├── CHANGELOG.md
└── README.md              ← this file
```

## Character sheet from PDF skill

`skills/character-sheet-from-pdf/SKILL.md` is an opencode skill that guides
building a character-sheet rendering MCP tool from a PDF. The process
covers: field-by-field study of the PDF layout, translating the field
inventory to a typed data model, building a format-agnostic derivation layer
(modifier math, proficiency checks, equipment resolution), and wiring up
dual renderers (ASCII plain-text and Markdown). Ruleset-agnostic and
MCP-server-agnostic — works with any holonovel-built server.

## Versioning

No formal versioning yet. See [CHANGELOG.md](CHANGELOG.md) for revision
history.
