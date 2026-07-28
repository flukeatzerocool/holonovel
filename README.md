# Holonovel

A build specification for an MCP server that serves tabletop RPG rulesets from
Markdown sources. This is the specification document, not an implementation.

## Purpose

`holonovel.md` is a self-contained specification and build prompt. Point an AI
agent at it to construct a single-user TTRPG MCP server from any Markdown
ruleset. The spec covers discovery (parsing, extraction, modeling), verification
(gates, derived tests, adversarial review), and handoff (four artifacts).

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
├── .markdownlint.json     ← lint rules
├── package.json           ← npm scripts (lint, validate, check)
├── scripts/
│   └── validate.py        ← cross-reference checker
├── .gitignore
├── CHANGELOG.md
└── README.md              ← this file
```

## Versioning

No formal versioning yet. See [CHANGELOG.md](CHANGELOG.md) for revision
history.
