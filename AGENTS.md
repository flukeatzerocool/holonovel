# AGENTS.md

## Project overview

This repository holds the **Holonovel specification** — a self-contained
build specification for an MCP server that serves tabletop RPG rulesets from
Markdown sources. The canonical document is `holonovel.md`. This is a
specification document, not an implementation.

## Layer map

```
holonovel.md            The specification (standalone, copy-pasteable)
  §1–5                  Mission, requirements, failure modes (with fault trees),
                          standing rules (including red-team discipline),
                          requirements (117 REQ blocks)
  §6                    Build process (jobs, intake, discovery, construction,
                          verification & convergence)
  §7                    Runtime conventions (anchors, IDs, output contracts,
                          tool conventions, state model, guidance)
  §8                    Verification gates (G0–G5, G2b)
  §9                    Artifacts and handoff (4 artifacts, 12 checks,
                          troubleshooting)
  §10                   Independent verification (includes adversarial round)
  §11                   Optional jobs (hat enrichment)
  Appendices A–S        Parsing principles, golden fixture, injection fixture,
                          MCP conformance, requirements manifest, derived tests,
                          source conversion, ruleset prep, permissive catalog,
                          anti-slop synopsis, adventure format, lorebook format,
                          REQ authoring conventions, complex fixture, behavioral
                          contracts, STRIDE security threat model
README.md               Project orientation; see HTML comment at top for
                          README design conventions
CHANGELOG.md            Revision history (date-headed, bulleted)
SPEC-QUEUE.md           Cross-session spec-engineering task tracker —
                          @SPEC-QUEUE.md next | add: <item> to <tier>
AGENTS.md               This file — AI maintainer orientation
package.json            Task runner (lint, validate, audit-assumptions,
                          scan-ambiguity, typecheck)
.markdownlint.json      Lint rules (120-char prose, ATX headings)
tsconfig.json           TypeScript configuration
scripts/validate.ts     Cross-reference checker with --traceability flag
                          (REQ citations, test IDs, TOC sync, heading separators,
                          block shape, traceability matrix, coverage completeness)
scripts/audit-assumptions.ts  Structural assumption auditor (citations,
                          magic numbers, absolute language, thresholds)
scripts/scan-ambiguity.ts     Ambiguity scanner (hedging, vague qualifiers,
                          indefinite language in REQ bodies)
scripts/fmea.ts               REQ-level failure mode and effects skeleton
scripts/graph-deps.ts         REQ dependency graph (DOT/Graphviz output)
scripts/spec-health-trends.ts Spec health metrics over revisions
scripts/lib/parse-spec.ts     Shared parsers (readSpec, extractReqBodies)
scripts/lib/parse-readme.ts   README structural parsers (headings, links, blockquotes)
scripts/validate-readme.ts    README guardrail (structure, voice, links, comparison table)
scripts/detect-near-dupes.ts   Near-duplicate paragraph detector
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
- Apply the authoring checklist in Appendix M before committing any
  new or modified REQ.
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

| Command                    | What it checks                                    |
|----------------------------|---------------------------------------------------|
| `npm run lint`             | markdownlint style rules (`.markdownlint.json`)  |
| `npm run validate`         | Cross-references, TOC sync, REQ blocks, separators, spec violations |
| `npm run audit-assumptions`| Structural assumption patterns (citations, magic numbers, absolute language) |
| `npm run scan-ambiguity`   | Hedging, vague qualifiers, indefinite language in REQ bodies |
| `npm run check-cross-refs`  | Dead citations, orphan REQs, divergent scope |
| `npm run detect-dupes`      | Near-duplicate paragraphs within 40-sentence window |
| `npm run validate-readme`  | README guardrail (design comment, headings, tool names, voice, links, comparison table) |

Also available separately:

| Command              | What it checks                                    |
|----------------------|---------------------------------------------------|
| `npm run typecheck`  | TypeScript type checking (`tsc --noEmit`)         |

All must pass. `npm run validate` exits non-zero on errors (uncited REQs,
undefined test IDs, TOC discrepancies, or malformed blocks). Warnings
(uncited test IDs, missing separators, stale appendix ranges, hardcoded
cross-section counts) are informational.

## Before committing spec changes

When you change `holonovel.md`, verify before committing:

- [ ] `npm run check` passes with 0 errors (warnings are informational)
- [ ] All cross-section counts match their targets (e.g., §6.5 metric count
      matches REQ-025 text)
- [ ] Appendix ranges like "Appendices A–X" match actual appendix count
- [ ] No REQ body contains parameter types, Default: clauses, or enumerated
      catalogs (>5 tokens) — `npm run validate` flags these
- [ ] Renamed headings or appendices are followed by a spec-wide grep
      for stale references
- [ ] Gate/workflow references use `GN` form (not "Gate N") outside §8

Prerequisites: Node.js 20+ (for `markdownlint-cli`, `tsx`, and `typescript`).
