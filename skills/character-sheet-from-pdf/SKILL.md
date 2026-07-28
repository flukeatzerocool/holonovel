---
name: character-sheet-from-pdf
description: Use ONLY when the user asks to build, create, or add a character sheet rendering tool to an MCP server, starting from a character sheet PDF. Guides the full process from PDF study through data model, renderers, and tool wiring. Ruleset-agnostic and MCP-server-agnostic.
---

# Character Sheet from PDF → MCP Tool

Build a character-sheet rendering tool for a TTRPG MCP server, starting from a PDF.

## Process

### 1. Study the PDF
Open the PDF. Visually enumerate every field (not OCR — read labels by eye). For each: label, data type, page, and whether it derives from other fields (e.g. modifier = floor((score - 10) / 2)). Record blank/rp-only fields too.

### 2. Entity type
Translate the field inventory to a flat, serializable interface. One slot per PDF field. Use arrays for lists (proficiencies, equipment, spells), optional fields for conditional data (spell slots). Every entity carries a unique `id: string`.

### 3. Prerequisites: ruleset index
The derivation layer needs a pre-built index with named lookup maps (`equipmentByName`, `spellsByName`, `speciesByName`) — not runtime search. If the MCP server doesn't have one, build it first.

### 4. File structure
```
domain/sheet.ts       — shared helpers + typed row interfaces + ASCII renderer
domain/sheet_md.ts    — Markdown renderer (imports shared; no independent math)
```
Keep renderers separate. Both import the same derivation module.

### 5. Derivation layer (format-agnostic)
Pure functions: `(entity, rulesIndex) => RowData[]`. No layout code. Return typed interfaces (`WeaponRowData`, `SpellRowData`) that renderers consume. Common helpers: score→modifier math, proficiency checks, equipment resolution, spell resolution, permanent save bonuses from features/items. Extend over time as rules change.

### 6. Markdown renderer (build first — default format)
Consume the derivation layer. Structure mirrors the PDF: identity line, combat strip table, abilities/saves/skills table (bold proficient), weapons table, features/traits/feats as bulleted lists, spellcasting section (ability, DC, slots, spell table with C/R/M flags), equipment list, details/coins. Handle empties: `_No cantrips or prepared spells._`. Escape `|` in cells. Flag unindexed data with `(not indexed)`.

### 7. ASCII renderer (build after Markdown — on-request only)
Same derivation helpers, different layout. Use `+`, `-`, `|` for boxed tables with per-column widths. Section bands with `+====+`. Checkboxes: `[*]`/`[ ]`. Blanks: `____`. Pips for slot/DS tracking. Multi-page PDF → PAGE N OF M headers. Fixed output width (e.g. 100 cols). Wrap long text.

### 8. MCP tool wiring
```
name: "character_sheet"
input: { entity: string, format: enum["markdown","ascii"], default "markdown" }
handler:
  1. Resolve entity from game state (fallback to roster)
  2. Not found → [ERROR] [NOT_FOUND] with valid IDs
  3. Dispatch to renderer based on format
  4. Output prefix: [OK] Character sheet for {name} ({id}, {source}, {format}.md|.txt)
  5. Truncate output if it exceeds the payload limit
  6. Return { content: [{ type: "text", text: result }] }
```

### 9. Conventions
- Markdown listed first in descriptions, set as default enum — ASCII is on-request only.
- Output prefix appends file extension (`.md` / `.txt`).
- Markdown tables use `| --- |` separators; ASCII uses `+---+` with horizontal rules between every row.
- `[OK]` for success, `[ERROR]` for failures — downstream parsable.

### 10. Tests

**Renderer tests:** Build a `minimalIndex()` test double with pre-populated `equipmentByName`, `spellsByName`, `speciesByName` maps. Cover identity rendering, stat math, weapon resolution (bonus stacking, Unarmed Strike fallback), spellcasting (DC, slots, sorting, empty-case fallback), edge cases (missing data, optional fields). Test both renderers.

**Gate tests:** Verify protocol conformance (`{ content: [{ type: "text", text }] }`), error for invalid entity IDs, persona gating, output prefix shape, and file extension in the status line.

### 11. After each change
Run: typecheck, build, unit tests, gate tests. Fix before proceeding.
