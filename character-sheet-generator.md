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
- **MCP App readiness.** If you plan to add an HTML UI (step 6a), verify:
  - The renderer functions (`renderCharacterSheet`, `renderCharacterSheetMarkdown`) are
    exported from their modules and importable.
  - The target MCP host supports `_meta.ui.resourceUri` in tool definitions. Check the
    host's documentation or test with a minimal app tool before investing in HTML UI work.
  - **Stdio-compatible hosts (preferred):** Some hosts (including opencode) serve MCP App
    resources over the existing stdio transport — no separate HTTP entry point is needed.
    Verify by registering a minimal `registerAppTool` + `registerAppResource` on the main
    server (§6a.0). Skip the HTTP fallback path if this works.
  - **HTTP-only hosts (fallback):** Other hosts require a separate HTTP entry point for
    MCP App resources. See §6a.1 fallback path. The stdio server stays unchanged (REQ-051).

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

**Persona gating with `registerAppTool`:** When the tool is registered via
`registerAppTool` (from `@modelcontextprotocol/ext-apps/server`) instead of the
server's standard tool registration, persona visibility gating may not be wired
automatically. After registration, push the tool definition to the server's internal
tool registry manually (e.g. `toolRegistry.push`) to enforce `persona` gating.
Skip this if the server's normal registration path already handles persona gating.

### 6a. MCP App support (optional — HTML sheet display)

When the target MCP host supports MCP App UI rendering, add an HTML character sheet
display on top of the text-based tool. The HTML UI consumes the tool's Markdown output —
it does NOT duplicate server-side rendering logic. The Markdown text output remains the
canonical format and works regardless of host support.

**Prefer stdio-first.** If the host supports MCP App resources over stdio transport
(verify in §6a.0), register `registerAppTool` and `registerAppResource` directly on the
existing stdio server. This avoids code duplication — a separate app server would
register the same `character_sheet` tool a second time, creating drift and maintenance
burden. Only fall back to a separate HTTP entry point when the host requires it.

#### 6a.0 Host compatibility check

Verify the host supports MCP Apps before building the HTML UI. Test in order:

1. **Stdio (preferred):** Register a minimal `registerAppTool` with
   `_meta.ui.resourceUri` and a `registerAppResource` serving an HTML page at
   `ui://character-sheet/test.html` on the existing stdio server. Confirm the host
   renders the HTML in a sandboxed iframe. If this works, skip the HTTP fallback
   entirely — register the real tool and resource on the stdio server (§6a.1
   preferred).
2. **HTTP (fallback):** If the host does not support MCP App over stdio, register a
   minimal remote tool (HTTP transport) with `_meta.ui.resourceUri` and confirm the
   host renders the HTML. If neither path works, skip this section — the text-based
   `character_sheet` tool is still fully functional.

#### 6a.1 Architecture — preferred (stdio, no separate server)

When the host supports MCP App over stdio (§6a.0 test 1 passes), register the app
tool and HTML resource directly on the existing stdio server entry point
(e.g. `src/index.ts`):

- **Tool registration:** Replace the `character_sheet` tool definition with
  `registerAppTool(server, "character_sheet", handler, { ... })` and add
  `_meta: { ui: { resourceUri: "ui://character-sheet/sheet.html" } }` so the host
  discovers the HTML UI when the tool is invoked. The handler and rendering logic
  stay identical to the text-only version.
  - **Persona gating:** After `registerAppTool`, persona gating (the `persona`
    field) may not be wired automatically. Manually push the definition to the
    server's internal tool registry (e.g. `toolRegistry.push`) if needed.
- **Resource registration:** `registerAppResource(server, "ui://character-sheet/sheet.html",
  { mimeType: RESOURCE_MIME_TYPE, load: async () => ({ blob: await fs.readFile(
  path.join(__dirname, "ui", "sheet.html")) }) })`. The bundled HTML lives at
  `dist/ui/sheet.html` after the build step.
- **Imports:** `registerAppTool`, `registerAppResource`, `RESOURCE_MIME_TYPE` from
  `@modelcontextprotocol/ext-apps/server`; `fs/promises` and `path` from `node:`.
- **Dependencies:** `@modelcontextprotocol/ext-apps`, `vite`,
  `vite-plugin-singlefile`. No Express, no HTTP transport, no CORS.
- **Build:** The standard `npm run build` compiles TypeScript (`tsc`) and bundles
  the HTML UI (`vite build`). Output: `dist/index.js` + `dist/ui/sheet.html`.
- **No HTTP port.** The host serves the HTML resource through its own transport —
  no Express server, no port to configure, no separate MCP config entry (§6a.3).

#### 6a.1 Fallback — HTTP entry point (only if stdio not supported)

If the host does not support MCP App over stdio (§6a.0 test 1 fails but test 2
passes), create a separate HTTP entry point (`src/app.ts`) that reuses the server's
existing config, index, state, and renderers. Do NOT switch the stdio server to
HTTP — the core server stays stdio-based (REQ-051).

```
src/app.ts  — HTTP entry point
src/ui/     — client-side HTML/JS/CSS (bundled to dist/ui/sheet.html)
```

The app entry point:

- Creates an `McpServer` with a distinct name (e.g. `holonovel_<ruleset>_sheet`)
- Registers the `character_sheet` tool via `registerAppTool` (from
  `@modelcontextprotocol/ext-apps/server`) with
  `_meta: { ui: { resourceUri: "ui://character-sheet/sheet.html" } }`
- Registers the bundled HTML as a resource via `registerAppResource` with MIME
  type `RESOURCE_MIME_TYPE` (`text/html;profile=mcp-app`)
- Serves via Express + `StreamableHTTPServerTransport` on a configured port

Dependencies: `@modelcontextprotocol/ext-apps`, `express`, `cors`, `vite`,
`vite-plugin-singlefile`.

```
npm run build-app   # vite bundles src/ui/ → dist/ui/sheet.html + tsc compiles src/app.ts
npm run serve-app   # starts app server on the configured port
```

> **Warning:** This approach duplicates the `character_sheet` tool registration
> between two servers. Keep both registrations in sync — drift will cause the
> HTML UI to render differently from the text output.

#### 6a.2 HTML UI

The UI is a single HTML file (vite + `vite-plugin-singlefile` bundling). It includes:

- The `App` class from `@modelcontextprotocol/ext-apps` for host communication
- An `ontoolresult` handler that receives the tool's Markdown output, parses it into
  structured data, and renders it in styled HTML matching the official character sheet
  layout
- A format toggle (styled HTML ↔ raw ASCII / raw Markdown) that calls
  `app.callServerTool()` with `format: "ascii"` or `format: "markdown"` to re-fetch
  in the alternate format
- CSS implementing the PDF-sourced layout (identity banner, combat strip, ability
  grid, weapon table, features list, spellcasting section, equipment/details)

The UI parser handles every Markdown section documented in §5. Unrecognized sections
pass through as raw Markdown — the tool output is the source of truth.

#### 6a.3 Host MCP config

**Stdio path (preferred):** No additional MCP configuration is needed. The tool and
HTML resource are served by the existing stdio server. The host discovers the app
UI from `_meta.ui.resourceUri` in the tool definition.

**HTTP fallback:** Add the app server as a separate MCP entry in the host
configuration:

```json
"holonovel_sheet_app": {
  "type": "remote",
  "url": "http://localhost:3001/mcp"
}
```

The host connects to both servers: stdio for gameplay tools, HTTP for the character
sheet display.

> **Canonical format.** The Markdown text output is the authoritative character
> sheet. The MCP App HTML UI is an optional display enhancement. If a host doesn't
> support MCP Apps, the text-based `character_sheet` tool continues to work
> unchanged. The HTML UI parses the tool's Markdown output; it must never duplicate
> server-side rendering logic.

### 7. Tests

Build a `minimalIndex()` test double that implements the same `RulesIndex` interface the derivation
layer consumes — no mocking framework, no type casts. Pre-populate `equipmentByName`, `spellsByName`,
`speciesByName`, and every other map a renderer path reads. Each populated entry must resolve through
the same lookup path (case-folded key, bounded-domain token match) the production code uses.

| Area       | Coverage |
| ---------- | -------- |
| Rendering  | Identity, stat math, weapon resolution (bonus stacking, Unarmed Strike fallback), spellcasting (DC, slots, sorting, empty-case fallback), edge cases (missing data, optional fields). Test both renderers. |
| Protocol   | Response contract (`{ content: [{ type: "text", text }] }`), error for invalid entity IDs, persona gating, output prefix shape, file extension in status line. |
| MCP App (if built) | Tool definition includes `_meta.ui.resourceUri`. HTML resource returns MIME type `text/html;profile=mcp-app`. Both `markdown` and `ascii` formats render through the app path with identical data as the text path. On the stdio path (preferred), verify the resource is served without an HTTP server. Client-side markdown parser handles all §5 sections. |

### 8. After each change

Run: typecheck, build, unit tests, gate tests. Fix before proceeding.
