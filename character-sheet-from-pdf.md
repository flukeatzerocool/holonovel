# Character Sheet from PDF → MCP Tool

Build a character-sheet rendering tool for a TTRPG MCP server, starting from a PDF.

## Process

### 0. Server pre-check

Before writing code, audit the server for pre-existing infrastructure this character sheet tool depends on:

- **Truncation.** Does a shared `truncateText(text)` function exist? If so, changing to per-tool counters
  (step 6.5) affects every call site — audit all uses. Replace a global `payload-N` counter with per-tool
  counters (`output://<tool>/<counter>` starting at 1).
- **Output resource.** Is an `output://` resource template registered? Step 6.5a registers
  `output://{tool}/{counter}`. If a template already exists, verify it supports path-segment variables:
  the pattern `output://{id}` does not match URIs containing `/`. Payloads are session-local; evict the
  oldest when exceeding the payload bound.
- **Error format.** All server errors follow REQ-002: `[ERROR] [<CATEGORY>] <explanation>` with a
  separate `Corrective action: <action>` line. Verify the shared error helper uses this format. If it uses
  an inline `Valid:` suffix instead, fix the helper — this affects all tools, not just the character sheet.
- **Render files.** Verify `domain/sheet.ts` and `domain/sheet_md.ts` exist. If they do, use steps 4–7 as
  a compliance checklist against them. If not, build from scratch following steps 4–5.

This document serves as both a greenfield build prompt and a compliance checklist — the pre-check applies
either way.

### 1. Study the PDF

Open the PDF. When auditing an existing implementation, use the §0 pre-check outcome and skip
to §4. Visually enumerate every field (not OCR — read labels by eye). For each: label, data type,
page, and whether it derives from other fields (e.g. modifier = floor((score - 10) / 2)). Record
blank/rp-only fields too.

### 2. Entity type

Translate the field inventory to a flat, serializable interface. One slot per PDF field. Use arrays for
lists (proficiencies, equipment, spells), optional fields for conditional data (spell slots). Every
entity carries a unique `id: string`.

### 3. Prerequisites: ruleset index

The derivation layer needs a pre-built index with named lookup maps (e.g. `equipmentByName`,
`spellsByName`, `speciesByName` — map names reflect the actual ruleset, never hardcoded) — not runtime
search. If the MCP server doesn't have one, build it first.

### 4. Architecture & Derivation

```
domain/sheet.ts       — shared helpers, typed row interfaces, ASCII renderer
domain/sheet_md.ts    — Markdown renderer (imports shared; no independent math)
```

Keep renderers separate. Both import the same derivation module.

**Derivation layer (format-agnostic):** Pure functions: `(entity, rulesIndex) => RowData[]`. No layout
code. Return typed interfaces (`WeaponRowData`, `SpellRowData`) that renderers consume. Common helpers:
score→modifier math, proficiency checks, equipment resolution, spell resolution, permanent save bonuses
from features/items. Extend over time as rules change.

### 5. Renderers

**Markdown (build first — default format):** Consume the derivation layer. Structure mirrors the PDF:
identity line, combat strip, abilities/saves/skills (bold proficient), weapons,
features/traits/feats as bulleted lists, spellcasting section (ability, DC, slots, spell table with
C/R/M flags), equipment list, details/coins. Tables use `| --- |` separators. Handle empties:
`_No cantrips or prepared spells._`. Escape `|` in cells. Flag unindexed data with `(not indexed)`.

**ASCII (build after Markdown — on-request only):** Same derivation helpers, different layout. Use
`+`, `-`, `|` for boxed tables with per-column widths and horizontal rules between every row. Section
bands with `+====+`. Checkboxes: `[*]`/`[ ]`. Blanks: `____`. Pips for slot/DS tracking. Multi-page
PDF → PAGE N OF M headers. Fixed output width (e.g. 100 cols). Wrap long text.

### 6. MCP tool wiring

```
name: "character_sheet"
title: "<Entity> Sheet"
description: "Render an entity's sheet in the ruleset's official layout."
persona: both
input: { entity: string, format: enum["markdown","ascii"], default "markdown" }
annotations:
  readOnlyHint: true, idempotentHint: true
  destructiveHint: false, openWorldHint: false
sideEffects: "None"
example: { "entity": "delver_01" }

handler:
  1. Resolve entity from game state (fallback to roster)
  2. Not found → [ERROR] [NOT_FOUND] <explanation> (REQ-002; REQ-058)
     Corrective action: <valid entity IDs visible to this persona>
  3. Dispatch to renderer based on format
  4. Output prefix: [OK] Character sheet for {name} ({id}, {source}, {format}.md|.txt)
  5. Truncate output if it exceeds the payload limit, ending with
     … [truncated — full content: output://character_sheet/<counter>]
     Per-tool counter; if the server's truncateText is shared, audit all call sites.
  6. Register an output://{tool}/{counter} resource template. Payloads are session-local;
     evict oldest when exceeding the payload bound. Not found → throw JSON-RPC error
     (-32000) with [NOT_FOUND] message.
  7. Return { content: [{ type: "text", text: result }] }
```

### 7. Tests

Build a `minimalIndex()` test double that implements the same `RulesIndex` interface the derivation
layer consumes — no mocking framework, no type casts. Pre-populate `equipmentByName`, `spellsByName`,
`speciesByName`, and every other map a renderer path reads. Each populated entry must resolve through
the same lookup path (case-folded key, bounded-domain token match) the production code uses.

| Area       | Coverage |
| ---------- | -------- |
| Rendering  | Identity, stat math, weapon resolution (bonus stacking, Unarmed Strike fallback), spellcasting (DC, slots, sorting, empty-case fallback), edge cases (missing data, optional fields). Test both renderers. |
| Protocol   | Response contract (`{ content: [{ type: "text", text }] }`), error for invalid entity IDs, persona gating, output prefix shape, file extension in status line. |

### 8. After each change

Run: typecheck, build, unit tests, gate tests. Fix before proceeding.
