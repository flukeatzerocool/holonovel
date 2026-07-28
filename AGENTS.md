# AGENTS.md

## Project overview

This repository holds the **Holonovel specification** — a self-contained
build specification for an MCP server that serves tabletop RPG rulesets from
Markdown sources. The canonical document is `holonovel.md`. This is a
specification document, not an implementation.

## Layer map

```
holonovel.md            The specification (standalone, copy-pasteable)
  §1–5                  Architecture, discovery, modeling, verification, handoff
  §6                    Ruleset structure
  §7                    Verification gates
  Appendices A–E        XML schema, edge cases, parsing heuristics,
                          defect classes, requirement index
README.md               Project orientation
CHANGELOG.md            Revision history (date-headed, bulleted)
AGENTS.md               This file — AI maintainer orientation
package.json            Task runner (lint, validate)
.markdownlint.json      Lint rules (120-char prose, ATX headings)
scripts/validate.py     Cross-reference checker (REQ citations, test IDs,
                          TOC sync, heading separators, block shape)
```

## Conventions

### Commits

Commit messages follow the CHANGELOG.md style: a date-stamped heading with
bulleted entries. Each bullet describes a coherent change group.

Push to Codeberg: `git push origin main`.

### Prose

- Wrapped near 110 columns (markdownlint enforces a 120-char limit, tables
  and code blocks excluded).
- ATX headings (`##`, `###`), not setext.
- Top-level sections separated by `---` horizontal rules.

### Requirements

- Canonical form: `**REQ-NNN — Title.**` followed by body ending in
  `*Check:*` or `_Check:_`.

## Gates

Run before committing or after any change to `holonovel.md`:

```sh
npm run check
```

This runs:

| Command              | What it checks                                    |
|----------------------|---------------------------------------------------|
| `npm run lint`       | markdownlint style rules (`.markdownlint.json`)  |
| `npm run validate`   | Cross-references, TOC sync, REQ blocks, separators |

Both must pass. `npm run validate` exits non-zero on errors (uncited REQs,
undefined test IDs, TOC discrepancies, or malformed blocks). Warnings
(uncited test IDs, missing separators) are informational.

Prerequisites: Node.js (for `markdownlint-cli`) and Python 3 (for
`scripts/validate.py`).
