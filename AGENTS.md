# AGENTS.md

## Project overview

This repository holds the **Holonovel specification** — a self-contained
build specification for an MCP server that serves tabletop RPG rulesets from
Markdown sources. The canonical document is `holonovel.md`. This is a
specification document, not an implementation.

## Layer map

```
holonovel.md            The specification (standalone, copy-pasteable)
  §1–5                  Mission, requirements, failure modes, standing rules,
                          requirements (56 REQ blocks)
  §6                    Build process (jobs, intake, discovery, construction,
                          verification & convergence)
  §7                    Runtime conventions (anchors, IDs, output contracts,
                          tool conventions, state model, guidance)
  §8                    Verification gates (Gate 0–4)
  §9                    Artifacts and handoff (4 artifacts, 12 checks)
  §10                   Independent verification
  §11                   Optional jobs (persona enrichment)
  Appendices A–M        Parsing principles, golden fixture, injection fixture,
                          MCP conformance, requirements manifest, derived tests,
                          source conversion, ruleset prep, permissive catalog,
                          anti-slop synopsis, adventure format, lorebook format,
                          REQ authoring conventions
README.md               Project orientation; see HTML comment at top for
                          README design conventions
CHANGELOG.md            Revision history (date-headed, bulleted)
AGENTS.md               This file — AI maintainer orientation
package.json            Task runner (lint, validate, typecheck)
.markdownlint.json      Lint rules (120-char prose, ATX headings)
tsconfig.json           TypeScript configuration
scripts/validate.ts     Cross-reference checker (REQ citations, test IDs,
                          TOC sync, heading separators, block shape)
```

## Conventions

### Commits

Commit messages follow the CHANGELOG.md style: a date-stamped heading with
bulleted entries. Each bullet describes a coherent change group.

Push to origin: `git push origin main`.

### Prose

- Wrapped near 110 columns (markdownlint enforces a 120-char limit, tables
  and code blocks excluded).
- ATX headings (`##`, `###`), not setext.
- Top-level sections separated by `---` horizontal rules.

### Requirements

- Canonical form: `**REQ-NNN — Title.**` followed by body ending in
  `*Check:*` or `_Check:_`.
- The spec states contracts, not implementations. Before adding detail, ask:
  could the convergence loop catch this? If yes, cut it.
- Apply the authoring checklist in §4 Standing Rule 7 before committing any
  new or modified REQ. Key tests: (a) no parameter types, default values,
  sort orders, or algorithms in REQ prose; (b) no Default: clauses; (c) no
  enumerated catalogs (>5 tokens); (d) no lifecycles restated across REQs.
- Appendix M defines what belongs in a REQ vs. what belongs elsewhere
  (builder, convergence loop, gates).
- `npm run validate` checks for spec-level violations — long REQ bodies,
  parameter type annotations, Default: clauses, enumerated token catalogs,
  and lifecycle repetition — and warns on each.

## Gates

Run before committing or after any change to `holonovel.md`:

```sh
npm run check
```

This runs:

| Command              | What it checks                                    |
|----------------------|---------------------------------------------------|
| `npm run lint`       | markdownlint style rules (`.markdownlint.json`)  |
| `npm run validate`   | Cross-references, TOC sync, REQ blocks, separators, spec violations |

Also available separately:

| Command              | What it checks                                    |
|----------------------|---------------------------------------------------|
| `npm run typecheck`  | TypeScript type checking (`tsc --noEmit`)         |

All must pass. `npm run validate` exits non-zero on errors (uncited REQs,
undefined test IDs, TOC discrepancies, or malformed blocks). Warnings
(uncited test IDs, missing separators) are informational.

Prerequisites: Node.js 20+ (for `markdownlint-cli`, `tsx`, and `typescript`).
