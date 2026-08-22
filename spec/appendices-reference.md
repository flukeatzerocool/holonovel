# Appendices

## Appendix A: Markdown Parsing Principles

**Encoding.** Read all files as UTF-8; never fall back to platform default. Undecodable
bytes are a structural defect.

**Headings.** ATX only (`##`, `###`, `####`). Treat the hierarchy as a tree but allow
gaps. Anchors are derived from heading text per REQ-194 (§7.1).

**Role scoping.** A trailing italic heading marker of the form `*<name> only*` scopes the
section to the GM badge. Match the marker case-insensitively against discovered badge
terms or their final word. The marker is stripped before anchor generation. A book-level
`#` heading carrying the marker scopes every `##` section in that file as GM-only;
individual sections may override. An ambiguous marker matching two or more discovered badge
terms defaults to shared (not badge-scoped).

**Tables.** Take the column count from the widest row. Pad short rows with empty cells.
Merge overflow cells into the last column. A first-column cell of the form `a–b` denotes
the inclusive integer range a..b. A multi-row table's first row is a header and is
excluded from data extraction. Inline formatting within cells is preserved. A prose
paragraph immediately preceding a table and ending in a colon or containing "following
table" is treated as the table's caption.

**Bold-labeled fields.** Accept `**Label**: Value`, `Label: **Value**`, and `**Label: Value**`;
normalize internally. A section with at least two consecutive bold-label paragraphs and no
intervening prose is a definition list — each entry extracted as a named item.

**Defect classes.** Three classes are recorded: **parse defects** (malformed structure),
**content findings** (well-formed but thin/unextractable content), and **contradictions**
(two statements in direct conflict). The most authoritative section is canonical; the
loser is LOW.

**Other elements.** HTML comments are ignored. Code blocks are literal text, never
executed. Blockquotes whose first line matches a bold-label pattern are callouts.
Strikethrough text (`~~text~~`) is preserved; affected sections are flagged with a content
finding. Images with descriptive captions are indexed; unresolvable image placeholders are
defects. Cross-file entries sharing the same canonical name are compared — identical
content collapses to the first file; differing content is flagged as a finding.

**Classification.** Sections are classified by mechanical pattern (stat blocks, feats,
equipment, species, spells, skills, talents, etc.) using a per-ruleset classification
profile derived from the structural pass. Sections matching no mechanical pattern are
guidance/prose (MEDIUM). The builder samples at least 10 sections per assigned type and
verifies classifications by inspection.

Extraction is guided by these principles; the convergence loop (§6.5) enforces the
thresholds. Detailed heuristics — including content-type detection signals, embedded stat
block patterns, and structured progression extraction — are derived by the builder from
the ruleset's own conventions during the structural pass.

---

## Appendix D: MCP Conformance Checklist

Record the pinned specification version in `DECISIONS.md`, then verify:

- `initialize` handshake succeeds; the server advertises exactly the capabilities it
  implements — tools, resources, and prompts — and no others; `resources` advertises no
  `subscribe`, and none of `tools`, `resources`, or `prompts` advertises `listChanged`.
- `tools/list`: unique names, valid JSON schemas, all REQ-020 base-surface tools
  present: Novel lifecycle, badge and workflow, scene and narrative state, NPC
  management, countdowns, dynamic lore, entity and roster management, personality,
  briefing ordering, export and import (Novel and lorebook), search and action
  suggestions, adventure and encounter generation, world model (parser
  command dispatch, world-model CRUD, hybrid source conversion),
  session tools, utility (`help`, `spec_health`), and synthesis reversion.
- `tools/call`: REQ-001 prefix and `isError` semantics on success and failure paths.
  Tool-level failure is a normal `result` with `isError: true`, never a JSON-RPC `error`
  response. Success responses carry `isError: false` (or the field omitted, equivalent
  per JSON-RPC). Verify: call a canonical lookup with a known-absent name — the
  response is a `result` object with `isError: true` and `[ERROR] [NOT_FOUND]` in
  `content[0].text`, not a JSON-RPC `error` object.
- `resources/list` and `resources/read`: `ruleset://`, `entities://`, `entity://<id>`,
  `audit://novel`, `roster://<type>`, `roster://<id>`, and `guidance://<badge>` retrievable
  per badge gating rules (REQ-032). `resources/read` returns Markdown text with a small
  source header (REQ-022), not wrapped in a JSON envelope.
- `prompts/list` and `prompts/get`: `run_workflow`, `badge_briefing`,
  `intro`, `session_zero`, and `novel_setup`; the one intent-mapping prompt
  (`run_workflow`) takes a required `intent` argument with a description;
  `badge_briefing`, `intro`, `session_zero`, and `novel_setup` take none; each
  `prompts/get` returns exactly one user-role message (REQ-023).
- All operations function with networking disabled (REQ-051).
- Conformance runs exercise both gated states (no badge / full access, Player badge / gated) per REQ-031, REQ-066.

---

## Appendix E: Requirements Manifest

Section 5 is the sole normative statement of every REQ. This table records which
specification version last changed each requirement. Version pins are CalVer
date-stamps matching CHANGELOG entries.

| REQ     | Title                     | Spec version |
| ------- | ------------------------- | ------------ |
| REQ-101a | Assumption audit trail (Part a) | 2026-08-11 |
| REQ-101b | Assumption audit trail (Part b) | 2026-08-11 |
| REQ-101c | Assumption audit trail (Part c) | 2026-08-11 |
| REQ-001 | Response contract | 2026-08-11 |
| REQ-001a1 | Warning and Partial semantics (Part a1) | 2026-08-11 |
| REQ-001a2 | Warning and Partial semantics (Part a2) | 2026-08-11 |
| REQ-277 | Fixture evolution contract | 2026-08-11 |
| REQ-002 | Error taxonomy | 2026-08-11 |
| REQ-002a1 | Extended error category semantics (Part a1) | 2026-08-11 |
| REQ-002a2 | Extended error category semantics (Part a2) | 2026-08-11 |
| REQ-002b1 | Corrective-action contract (Part b1) | 2026-08-11 |
| REQ-002b2 | Corrective-action contract (Part b2) | 2026-08-11 |
| REQ-002c1 | Badge-filtered error values (Part c1) | 2026-08-11 |
| REQ-002c2 | Badge-filtered error values (Part c2) | 2026-08-11 |
| REQ-003a | Roll transparency (Part a) | 2026-08-11 |
| REQ-003b | Roll transparency (Part b) | 2026-08-11 |
| REQ-003c | Roll transparency (Part c) | 2026-08-11 |
| REQ-004 | Truncation | 2026-08-11 |
| REQ-004a | Stat block baseline view | 2026-08-11 |
| REQ-179a | Output pointer resource template (Part a) | 2026-08-11 |
| REQ-179b | Output pointer resource template (Part b) | 2026-08-11 |
| REQ-118a | Prompt length budget (Part a) | 2026-08-11 |
| REQ-118b | Prompt length budget (Part b) | 2026-08-11 |
| REQ-113 | Result count reporting | 2026-08-11 |
| REQ-060a | Verbose output (Part a) | 2026-08-11 |
| REQ-060b | Verbose output (Part b) | 2026-08-11 |
| REQ-061 | Source quoting | 2026-08-11 |
| REQ-280a | Source-anchor citation (Part a) | 2026-08-11 |
| REQ-280b | Source-anchor citation (Part b) | 2026-08-11 |
| REQ-280c | Source-anchor citation (Part c) | 2026-08-11 |
| REQ-062 | Badge foundations | 2026-08-11 |
| REQ-070a | Anti-slop guidance (Part a) | 2026-08-11 |
| REQ-070b | Anti-slop guidance (Part b) | 2026-08-11 |
| REQ-184a | Anti-slop resource rendering (Part a) | 2026-08-11 |
| REQ-184b | Anti-slop resource rendering (Part b) | 2026-08-11 |
| REQ-194a | Anchor derivation (Part a) | 2026-08-11 |
| REQ-194b | Anchor derivation (Part b) | 2026-08-11 |
| REQ-071a | Narrative tone samples (Part a) | 2026-08-11 |
| REQ-071b | Narrative tone samples (Part b) | 2026-08-11 |
| REQ-064a | Badge behavioral boundaries (Part a) | 2026-08-11 |
| REQ-064b | Badge behavioral boundaries (Part b) | 2026-08-11 |
| REQ-064c | Badge behavioral boundaries (Part c) | 2026-08-11 |
| REQ-064d | Badge behavioral boundaries (Part d) | 2026-08-11 |
| REQ-064e | Badge behavioral boundaries (Part e) | 2026-08-11 |
| REQ-064f | Badge behavioral boundaries (Part f) | 2026-08-11 |
| REQ-001b1 | Error boundary (Part b1) | 2026-08-11 |
| REQ-001b2 | Error boundary (Part b2) | 2026-08-11 |
| REQ-010 | Traceability | 2026-08-11 |
| REQ-011a | Confidence (Part a) | 2026-08-11 |
| REQ-011b | Confidence (Part b) | 2026-08-11 |
| REQ-011c | Confidence (Part c) | 2026-08-11 |
| REQ-147a | Confidence aggregation (Part a) | 2026-08-11 |
| REQ-147b | Confidence aggregation (Part b) | 2026-08-11 |
| REQ-153 | AGENTS.md troubleshooting | 2026-08-11 |
| REQ-154a | README.md handoff content (Part a) | 2026-08-11 |
| REQ-154b | README.md handoff content (Part b) | 2026-08-11 |
| REQ-270 | Artifact version identification | 2026-08-11 |
| REQ-271 | AGENTS.md structure contract | 2026-08-11 |
| REQ-099 | Confidence-floor acknowledgment | 2026-08-11 |
| REQ-207a | Core-mechanic identification (Part a) | 2026-08-11 |
| REQ-207b | Core-mechanic identification (Part b) | 2026-08-11 |
| REQ-207c | Core-mechanic identification (Part c) | 2026-08-11 |
| REQ-012 | Graceful fallback | 2026-08-11 |
| REQ-315a | Full-text ruleset indexing (Part a) | 2026-08-11 |
| REQ-315b | Full-text ruleset indexing (Part b) | 2026-08-11 |
| REQ-111a | Search result quality (Part a) | 2026-08-11 |
| REQ-111b | Search result quality (Part b) | 2026-08-11 |
| REQ-212a | Generation table rolling (Part a) | 2026-08-11 |
| REQ-212b | Generation table rolling (Part b) | 2026-08-11 |
| REQ-013 | No assumed mechanics | 2026-08-11 |
| REQ-014 | Source immutability | 2026-08-11 |
| REQ-015 | Action classification | 2026-08-11 |
| REQ-214a | Table classification (Part a) | 2026-08-11 |
| REQ-214b | Table classification (Part b) | 2026-08-11 |
| REQ-214c | Table classification (Part c) | 2026-08-11 |
| REQ-016 | Guidance extraction | 2026-08-11 |
| REQ-017 | Badge stories | 2026-08-11 |
| REQ-018 | Extraction evidence | 2026-08-11 |
| REQ-146a | Reconciliation authority (Part a) | 2026-08-11 |
| REQ-146b | Reconciliation authority (Part b) | 2026-08-11 |
| REQ-146c | Reconciliation authority (Part c) | 2026-08-11 |
| REQ-146d | Reconciliation authority (Part d) | 2026-08-11 |
| REQ-209 | Cross-format consistency | 2026-08-11 |
| REQ-210a | Extraction categories (Part a) | 2026-08-11 |
| REQ-210b | Extraction categories (Part b) | 2026-08-11 |
| REQ-215a | Table content extraction (Part a) | 2026-08-11 |
| REQ-215b | Table content extraction (Part b) | 2026-08-11 |
| REQ-215c | Table content extraction (Part c) | 2026-08-11 |
| REQ-272 | Stock elements catalog | 2026-08-11 |
| REQ-102a | Source conversion contract (Part a) | 2026-08-11 |
| REQ-102b | Source conversion contract (Part b) | 2026-08-11 |
| REQ-102c | Source conversion contract (Part c) | 2026-08-11 |
| REQ-225a | Ruleset Wisdom extraction (Part a) | 2026-08-11 |
| REQ-225b | Ruleset Wisdom extraction (Part b) | 2026-08-11 |
| REQ-354 | Extended narrative extraction | 2026-08-11 |
| REQ-324 | Constraint override extraction | 2026-08-11 |
| REQ-020a | Tools (Part a) | 2026-08-11 |
| REQ-020b | Tools (Part b) | 2026-08-11 |
| REQ-021 | Tool-surface economy | 2026-08-11 |
| REQ-022a | Resources (Part a) | 2026-08-11 |
| REQ-022b | Resources (Part b) | 2026-08-11 |
| REQ-296a | Knowledge-graph resource (Part a) | 2026-08-11 |
| REQ-296b | Knowledge-graph resource (Part b) | 2026-08-11 |
| REQ-023a | Prompts (Part a) | 2026-08-11 |
| REQ-023b | Prompts (Part b) | 2026-08-11 |
| REQ-024a | Tool documentation (Part a) | 2026-08-11 |
| REQ-024b | Tool documentation (Part b) | 2026-08-11 |
| REQ-025a | spec_health (Part a) | 2026-08-11 |
| REQ-025b1 | spec_health (Part b1) | 2026-08-11 |
| REQ-025b2 | spec_health (Part b2) | 2026-08-11 |
| REQ-025c | spec_health (Part c) | 2026-08-11 |
| REQ-160a | Synthesis health reporting (Part a) | 2026-08-11 |
| REQ-160b | Synthesis health reporting (Part b) | 2026-08-11 |
| REQ-160c | Synthesis health reporting (Part c) | 2026-08-11 |
| REQ-169a | Audit chain integrity reporting (Part a) | 2026-08-11 |
| REQ-169b | Audit chain integrity reporting (Part b) | 2026-08-11 |
| REQ-138a | Prompt health reporting (Part a) | 2026-08-11 |
| REQ-138b | Prompt health reporting (Part b) | 2026-08-11 |
| REQ-139 | Resource URI completeness reporting | 2026-08-11 |
| REQ-269 | Safety protocol status | 2026-08-11 |
| REQ-388a | Holodeck config discovery (Part a) | 2026-08-11 |
| REQ-388b | Holodeck config discovery (Part b) | 2026-08-11 |
| REQ-388c | Holodeck config discovery (Part c) | 2026-08-11 |
| REQ-388d | Holodeck config discovery (Part d) | 2026-08-11 |
| REQ-105 | Spec resource | 2026-08-11 |
| REQ-106 | Spec repository URL | 2026-08-11 |
| REQ-107a | Version coordination (Part a) | 2026-08-11 |
| REQ-107b | Version coordination (Part b) | 2026-08-11 |
| REQ-187a | Spec content hash computation (Part a) | 2026-08-11 |
| REQ-187b | Spec content hash computation (Part b) | 2026-08-11 |
| REQ-278 | Build-phase-map staleness detection | 2026-08-11 |
| REQ-161a | Intake workflow contract (Part a) | 2026-08-11 |
| REQ-161b | Intake workflow contract (Part b) | 2026-08-11 |
| REQ-161c | Intake workflow contract (Part c) | 2026-08-11 |
| REQ-162a | Build-mode profiles (Part a) | 2026-08-11 |
| REQ-162b | Build-mode profiles (Part b) | 2026-08-11 |
| REQ-162c | Build-mode profiles (Part c) | 2026-08-11 |
| REQ-163a | Client config verification (Part a) | 2026-08-11 |
| REQ-163b | Client config verification (Part b) | 2026-08-11 |
| REQ-164a | Viability pre-check (Part a) | 2026-08-11 |
| REQ-164b | Viability pre-check (Part b) | 2026-08-11 |
| REQ-067a | Help and tool discovery (Part a) | 2026-08-11 |
| REQ-067b | Help and tool discovery (Part b) | 2026-08-11 |
| REQ-067c | Help and tool discovery (Part c) | 2026-08-11 |
| REQ-063a | Connection introduction (Part a) | 2026-08-11 |
| REQ-063b | Connection introduction (Part b) | 2026-08-11 |
| REQ-063c | Connection introduction (Part c) | 2026-08-11 |
| REQ-078a | Session zero prompt (Part a) | 2026-08-11 |
| REQ-078b | Session zero prompt (Part b) | 2026-08-11 |
| REQ-078c1 | Session zero prompt (Part c1) | 2026-08-11 |
| REQ-078c2 | Session zero prompt (Part c2) | 2026-08-11 |
| REQ-078c3 | Session zero prompt (Part c3) | 2026-08-11 |
| REQ-078c4 | Session zero prompt (Part c4) | 2026-08-11 |
| REQ-078d | Session zero prompt (Part d) | 2026-08-11 |
| REQ-057a | Canonical lookup tools (Part a) | 2026-08-11 |
| REQ-057b | Canonical lookup tools (Part b) | 2026-08-11 |
| REQ-112 | Cross-reference discovery | 2026-08-11 |
| REQ-058 | Tool-result fidelity | 2026-08-11 |
| REQ-110 | Tool surface consolidation | 2026-08-11 |
| REQ-059a | Parameter canon validation (Part a) | 2026-08-11 |
| REQ-059b | Parameter canon validation (Part b) | 2026-08-11 |
| REQ-059c | Parameter canon validation (Part c) | 2026-08-11 |
| REQ-182a | Bounded-domain parameter documentation (Part a) | 2026-08-11 |
| REQ-182b | Bounded-domain parameter documentation (Part b) | 2026-08-11 |
| REQ-183a | Live-index-derived error enumerations (Part a) | 2026-08-11 |
| REQ-183b | Live-index-derived error enumerations (Part b) | 2026-08-11 |
| REQ-323a | resolve_intent tool (Part a) | 2026-08-11 |
| REQ-323b | resolve_intent tool (Part b) | 2026-08-11 |
| REQ-056 | Advancement workflow | 2026-08-11 |
| REQ-042a | Workflow decisions (Part a) | 2026-08-11 |
| REQ-042b | Workflow decisions (Part b) | 2026-08-11 |
| REQ-042c | Workflow decisions (Part c) | 2026-08-11 |
| REQ-042d | Workflow decisions (Part d) | 2026-08-11 |
| REQ-042e | Workflow decisions (Part e) | 2026-08-11 |
| REQ-042f | Workflow decisions (Part f) | 2026-08-11 |
| REQ-190 | Respond drain result | 2026-08-11 |
| REQ-191 | Option display-label pairs | 2026-08-11 |
| REQ-192 | Batch-respond collision | 2026-08-11 |
| REQ-193a | Pending workflow staleness detection (Part a) | 2026-08-11 |
| REQ-193b | Pending workflow staleness detection (Part b) | 2026-08-11 |
| REQ-104a | Character creation workflow (Part a) | 2026-08-11 |
| REQ-104b | Character creation workflow (Part b) | 2026-08-11 |
| REQ-104c | Character creation workflow (Part c) | 2026-08-11 |
| REQ-181a | Character creation output surface (Part a) | 2026-08-11 |
| REQ-181b | Character creation output surface (Part b) | 2026-08-11 |
| REQ-151a | Creation step enumeration (Part a) | 2026-08-11 |
| REQ-151b | Creation step enumeration (Part b) | 2026-08-11 |
| REQ-152a | Starting equipment assignment (Part a) | 2026-08-11 |
| REQ-152b | Starting equipment assignment (Part b) | 2026-08-11 |
| REQ-140 | End-Novel confirmation dispatch | 2026-08-11 |
| REQ-224a | Workflow staleness detection (Part a) | 2026-08-11 |
| REQ-224b | Workflow staleness detection (Part b) | 2026-08-11 |
| REQ-224c | Workflow staleness detection (Part c) | 2026-08-11 |
| REQ-235a | Structured player choices (Part a) | 2026-08-11 |
| REQ-235b | Structured player choices (Part b) | 2026-08-11 |
| REQ-235c | Structured player choices (Part c) | 2026-08-11 |
| REQ-030 | Single-user connection | 2026-08-11 |
| REQ-031a | Badge activation (Part a) | 2026-08-11 |
| REQ-031b | Badge activation (Part b) | 2026-08-11 |
| REQ-066a | set_badge tool (Part a) | 2026-08-11 |
| REQ-066b | set_badge tool (Part b) | 2026-08-11 |
| REQ-032a | Server-side gating (Part a) | 2026-08-11 |
| REQ-032b | Server-side gating (Part b) | 2026-08-11 |
| REQ-216a | Generation table badge filtering (Part a) | 2026-08-11 |
| REQ-216b | Generation table badge filtering (Part b) | 2026-08-11 |
| REQ-133a | Forbidden-call audit (Part a) | 2026-08-11 |
| REQ-133b | Forbidden-call audit (Part b) | 2026-08-11 |
| REQ-134 | Minimum Player tool surface | 2026-08-11 |
| REQ-220a | Narrative point of view (Part a) | 2026-08-11 |
| REQ-220b | Narrative point of view (Part b) | 2026-08-11 |
| REQ-220c | Narrative point of view (Part c) | 2026-08-11 |
| REQ-220d | Narrative point of view (Part d) | 2026-08-11 |
| REQ-223a | POV mode control (Part a) | 2026-08-11 |
| REQ-223b | POV mode control (Part b) | 2026-08-11 |
| REQ-223c | POV mode control (Part c) | 2026-08-11 |
| REQ-304a | Counterpart AI role (Part a) | 2026-08-11 |
| REQ-304b | Counterpart AI role (Part b) | 2026-08-11 |
| REQ-304c | Counterpart AI role (Part c) | 2026-08-11 |
| REQ-305a | Observer mode (Part a) | 2026-08-11 |
| REQ-305b | Observer mode (Part b) | 2026-08-11 |
| REQ-306a | Adjustable autonomy (Part a) | 2026-08-11 |
| REQ-306b | Adjustable autonomy (Part b) | 2026-08-11 |
| REQ-306c | Adjustable autonomy (Part c) | 2026-08-11 |
| REQ-306d | Adjustable autonomy (Part d) | 2026-08-11 |
| REQ-306e | Adjustable autonomy (Part e) | 2026-08-11 |
| REQ-306f | Safety escalation advisory (Part f) | 2026-08-22 |
| REQ-306g | Creativity tier mapping (Part g) | 2026-08-22 |
| REQ-109a | Badge briefing composition (Part a) | 2026-08-11 |
| REQ-109b | Badge briefing composition (Part b) | 2026-08-11 |
| REQ-109c1 | Badge briefing composition (Part c1) | 2026-08-11 |
| REQ-109c2 | Badge briefing composition (Part c2) | 2026-08-11 |
| REQ-109c3 | Badge briefing composition (Part c3) | 2026-08-11 |
| REQ-109d | Badge briefing composition (Part d) | 2026-08-11 |
| REQ-109e | Badge briefing composition (Part e) | 2026-08-11 |
| REQ-109f | Badge briefing composition (Part f) | 2026-08-11 |
| REQ-281a | Narrative-threads section token (Part a) | 2026-08-11 |
| REQ-281b | Narrative-threads section token (Part b) | 2026-08-11 |
| REQ-281c | Narrative-threads section token (Part c) | 2026-08-11 |
| REQ-286a | Knowledge-state section token (Part a) | 2026-08-11 |
| REQ-286b | Knowledge-state section token (Part b) | 2026-08-11 |
| REQ-286c | Knowledge-state section token (Part c) | 2026-08-11 |
| REQ-159a | Synthesis briefing integration (Part a) | 2026-08-11 |
| REQ-159b | Synthesis briefing integration (Part b) | 2026-08-11 |
| REQ-159c | Synthesis briefing integration (Part c) | 2026-08-11 |
| REQ-159d | Synthesis briefing integration (Part d) | 2026-08-11 |
| REQ-135a | Badge briefing size budget (Part a) | 2026-08-11 |
| REQ-135b | Badge briefing size budget (Part b) | 2026-08-11 |
| REQ-135c | Badge briefing size budget (Part c) | 2026-08-11 |
| REQ-180a | Truncation budget unit (Part a) | 2026-08-11 |
| REQ-180b | Truncation budget unit (Part b) | 2026-08-11 |
| REQ-136a | Editor-badge briefing (Part a) | 2026-08-11 |
| REQ-136b | Editor-badge briefing (Part b) | 2026-08-11 |
| REQ-137a | Gate classification auditability (Part a) | 2026-08-11 |
| REQ-137b | Gate classification auditability (Part b) | 2026-08-11 |
| REQ-148 | Structural integrity gate | 2026-08-11 |
| REQ-149 | MCP conformance gate | 2026-08-11 |
| REQ-150a | Golden transcript coverage completeness (Part a) | 2026-08-11 |
| REQ-150b | Golden transcript coverage completeness (Part b) | 2026-08-11 |
| REQ-211a | Evidence record field contract (Part a) | 2026-08-11 |
| REQ-211b | Evidence record field contract (Part b) | 2026-08-11 |
| REQ-211c | Evidence record field contract (Part c) | 2026-08-11 |
| REQ-275 | Evidence hash commitment | 2026-08-11 |
| REQ-276 | Independent verifier model criteria | 2026-08-11 |
| REQ-040a | Audit log (Part a) | 2026-08-11 |
| REQ-040b | Audit log (Part b) | 2026-08-11 |
| REQ-040c | Audit log (Part c) | 2026-08-11 |
| REQ-040d | Audit log (Part d) | 2026-08-11 |
| REQ-168a | Audit resource (Part a) | 2026-08-11 |
| REQ-168b | Audit resource (Part b) | 2026-08-11 |
| REQ-041a | Snapshots and undo (Part a) | 2026-08-11 |
| REQ-041b | Snapshots and undo (Part b) | 2026-08-11 |
| REQ-041c | Snapshots and undo (Part c) | 2026-08-11 |
| REQ-116 | Redo | 2026-08-11 |
| REQ-043a | Conflict lifecycle (Part a) | 2026-08-11 |
| REQ-043b | Conflict lifecycle (Part b) | 2026-08-11 |
| REQ-043c | Conflict lifecycle (Part c) | 2026-08-11 |
| REQ-043d | Conflict lifecycle (Part d) | 2026-08-11 |
| REQ-043e | Conflict lifecycle (Part e) | 2026-08-11 |
| REQ-043f | Conflict lifecycle (Part f) | 2026-08-11 |
| REQ-043g | Conflict lifecycle (Part g) | 2026-08-11 |
| REQ-203 | Combat-init guard | 2026-08-11 |
| REQ-204a | Combat participant validation (Part a) | 2026-08-11 |
| REQ-204b | Combat participant validation (Part b) | 2026-08-11 |
| REQ-205a | Mid-combat participant changes (Part a) | 2026-08-11 |
| REQ-205b | Mid-combat participant changes (Part b) | 2026-08-11 |
| REQ-205c | Mid-combat participant changes (Part c) | 2026-08-11 |
| REQ-206a | Combat-round condition expiry (Part a) | 2026-08-11 |
| REQ-206b | Combat-round condition expiry (Part b) | 2026-08-11 |
| REQ-206c | Combat-round condition expiry (Part c) | 2026-08-11 |
| REQ-221a | Combat-navigation interaction (Part a) | 2026-08-11 |
| REQ-221b | Combat-navigation interaction (Part b) | 2026-08-11 |
| REQ-217a | Condition tools (Part a) | 2026-08-11 |
| REQ-217b | Condition tools (Part b) | 2026-08-11 |
| REQ-217c | Condition tools (Part c) | 2026-08-11 |
| REQ-217d | Condition tools (Part d) | 2026-08-11 |
| REQ-072a1 | Session recap (Part a1) | 2026-08-11 |
| REQ-072a2 | Session recap (Part a2) | 2026-08-11 |
| REQ-072b | Session recap (Part b) | 2026-08-11 |
| REQ-072c1 | Session recap (Part c1) | 2026-08-11 |
| REQ-072c2 | Session recap (Part c2) | 2026-08-11 |
| REQ-072d | Session recap (Part d) | 2026-08-11 |
| REQ-072e | Session recap (Part e) | 2026-08-11 |
| REQ-072f | Session recap (Part f) | 2026-08-11 |
| REQ-279a | Narrative orientation (Part a) | 2026-08-11 |
| REQ-279b | Narrative orientation (Part b) | 2026-08-11 |
| REQ-279c | Narrative orientation (Part c) | 2026-08-11 |
| REQ-174a | Significant-roll criterion for recap (Part a) | 2026-08-11 |
| REQ-174b | Significant-roll criterion for recap (Part b) | 2026-08-11 |
| REQ-175a | Confrontation summary derivation (Part a) | 2026-08-11 |
| REQ-175b | Confrontation summary derivation (Part b) | 2026-08-11 |
| REQ-0731 | Countdowns (Part 1) | 2026-08-11 |
| REQ-0732 | Countdowns (Part 2) | 2026-08-11 |
| REQ-0733 | Countdowns (Part 3) | 2026-08-11 |
| REQ-329a | Countdown-world coupling (Part a) | 2026-08-11 |
| REQ-329b | Countdown-world coupling (Part b) | 2026-08-11 |
| REQ-289a | Vow tracking (Part a) | 2026-08-11 |
| REQ-289b | Vow tracking (Part b) | 2026-08-11 |
| REQ-289c | Vow tracking (Part c) | 2026-08-11 |
| REQ-289d | Vow tracking (Part d) | 2026-08-11 |
| REQ-289e | Vow tracking (Part e) | 2026-08-11 |
| REQ-322a | Vow-countdown coupling (Part a) | 2026-08-11 |
| REQ-322b | Vow-countdown coupling (Part b) | 2026-08-11 |
| REQ-322c | Vow-countdown coupling (Part c) | 2026-08-11 |
| REQ-322d | Vow-countdown coupling (Part d) | 2026-08-11 |
| REQ-074a | Multi-entity support (Part a) | 2026-08-11 |
| REQ-074b | Multi-entity support (Part b) | 2026-08-11 |
| REQ-074c | Multi-entity support (Part c) | 2026-08-11 |
| REQ-176a | Entity removal (Part a) | 2026-08-11 |
| REQ-176b | Entity removal (Part b) | 2026-08-11 |
| REQ-177 | Roster entity removal | 2026-08-11 |
| REQ-178a | Roster listing (Part a) | 2026-08-11 |
| REQ-178b | Roster listing (Part b) | 2026-08-11 |
| REQ-075a | Named-NPC state (Part a) | 2026-08-11 |
| REQ-075b | Named-NPC state (Part b) | 2026-08-11 |
| REQ-075c | Named-NPC state (Part c) | 2026-08-11 |
| REQ-075d | Named-NPC state (Part d) | 2026-08-11 |
| REQ-075e | Named-NPC state (Part e) | 2026-08-11 |
| REQ-119a | NPC stat block reference (Part a) | 2026-08-11 |
| REQ-119b | NPC stat block reference (Part b) | 2026-08-11 |
| REQ-119c | NPC stat block reference (Part c) | 2026-08-11 |
| REQ-119d | NPC stat block reference (Part d) | 2026-08-11 |
| REQ-120 | NPC rendering | 2026-08-11 |
| REQ-121 | NPC resource URIs | 2026-08-11 |
| REQ-122a | NPC narrative fields (Part a) | 2026-08-11 |
| REQ-122b | NPC narrative fields (Part b) | 2026-08-11 |
| REQ-156 | NPC description field | 2026-08-11 |
| REQ-123 | Builder-defined NPC stat fields | 2026-08-11 |
| REQ-124a | NPC damage resolution (Part a) | 2026-08-11 |
| REQ-124b | NPC damage resolution (Part b) | 2026-08-11 |
| REQ-0761 | Scene-state ledger (Part 1) | 2026-08-11 |
| REQ-0762 | Scene-state ledger (Part 2) | 2026-08-11 |
| REQ-0763 | Scene-state ledger (Part 3) | 2026-08-11 |
| REQ-0764 | Scene-state ledger (Part 4) | 2026-08-11 |
| REQ-0765 | Scene-state ledger (Part 5) | 2026-08-11 |
| REQ-0766 | Scene-state ledger (Part 6) | 2026-08-11 |
| REQ-0767 | Scene-state ledger (Part 7) | 2026-08-11 |
| REQ-076a1 | Structured scene fields (Part a1) | 2026-08-11 |
| REQ-076a2 | Structured scene fields (Part a2) | 2026-08-11 |
| REQ-252a | Narrative fast-forward (Part a) | 2026-08-11 |
| REQ-252b | Narrative fast-forward (Part b) | 2026-08-11 |
| REQ-252c | Narrative fast-forward (Part c) | 2026-08-11 |
| REQ-307a | Entity presence (Part a) | 2026-08-11 |
| REQ-307b | Entity presence (Part b) | 2026-08-11 |
| REQ-307c | Entity presence (Part c) | 2026-08-11 |
| REQ-308a | Knowledge gating by presence (Part a) | 2026-08-11 |
| REQ-308b | Knowledge gating by presence (Part b) | 2026-08-11 |
| REQ-330a | Knowledge-world coupling (Part a) | 2026-08-11 |
| REQ-330b | Knowledge-world coupling (Part b) | 2026-08-11 |
| REQ-330c | Knowledge-world coupling (Part c) | 2026-08-11 |
| REQ-311a | NPC memory model (Part a) | 2026-08-11 |
| REQ-311b | NPC memory model (Part b) | 2026-08-11 |
| REQ-311c | NPC memory model (Part c) | 2026-08-11 |
| REQ-311d | NPC memory model (Part d) | 2026-08-11 |
| REQ-311e | NPC memory model (Part e) | 2026-08-11 |
| REQ-311f | NPC memory model (Part f) | 2026-08-11 |
| REQ-311g | NPC memory model (Part g) | 2026-08-11 |
| REQ-077a | Entity personality fields (Part a) | 2026-08-11 |
| REQ-077b | Entity personality fields (Part b) | 2026-08-11 |
| REQ-077c | Entity personality fields (Part c) | 2026-08-11 |
| REQ-077d | Entity personality fields (Part d) | 2026-08-11 |
| REQ-077e | Entity personality fields (Part e) | 2026-08-11 |
| REQ-077f | Entity personality fields (Part f) | 2026-08-11 |
| REQ-126a | Voice examples rendering (Part a) | 2026-08-11 |
| REQ-126b | Voice examples rendering (Part b) | 2026-08-11 |
| REQ-282a | NPC voice directive (Part a) | 2026-08-11 |
| REQ-282b | NPC voice directive (Part b) | 2026-08-11 |
| REQ-282c | NPC voice directive (Part c) | 2026-08-11 |
| REQ-282d | NPC voice directive (Part d) | 2026-08-11 |
| REQ-127a | Ruleset-native personality mapping (Part a) | 2026-08-11 |
| REQ-127b | Ruleset-native personality mapping (Part b) | 2026-08-11 |
| REQ-165a | Entity ownership for personality gating (Part a) | 2026-08-11 |
| REQ-165b | Entity ownership for personality gating (Part b) | 2026-08-11 |
| REQ-166a | Personality briefing rendering (Part a) | 2026-08-11 |
| REQ-166b | Personality briefing rendering (Part b) | 2026-08-11 |
| REQ-166c | Personality briefing rendering (Part c) | 2026-08-11 |
| REQ-167a | Personality resource URIs (Part a) | 2026-08-11 |
| REQ-167b | Personality resource URIs (Part b) | 2026-08-11 |
| REQ-069a | Player feedback signal (Part a) | 2026-08-11 |
| REQ-069b | Player feedback signal (Part b) | 2026-08-11 |
| REQ-069c | Player feedback signal (Part c) | 2026-08-11 |
| REQ-128a | Signal briefing surface (Part a) | 2026-08-11 |
| REQ-128b | Signal briefing surface (Part b) | 2026-08-11 |
| REQ-255a | Boundary signal propagation (Part a) | 2026-08-11 |
| REQ-255b | Boundary signal propagation (Part b) | 2026-08-11 |
| REQ-255c | Boundary signal propagation (Part c) | 2026-08-11 |
| REQ-173a | Connection counter (Part a) | 2026-08-11 |
| REQ-173b | Connection counter (Part b) | 2026-08-11 |
| REQ-173c | Connection counter (Part c) | 2026-08-11 |
| REQ-129a | Property group cardinality (Part a) | 2026-08-11 |
| REQ-129b1 | Property group cardinality (Part b1) | 2026-08-11 |
| REQ-129b2 | Property group cardinality (Part b2) | 2026-08-11 |
| REQ-129c | Property group cardinality (Part c) | 2026-08-11 |
| REQ-129d | Property group cardinality (Part d) | 2026-08-11 |
| REQ-079a | Adventure modules (Part a) | 2026-08-11 |
| REQ-079b | Adventure modules (Part b) | 2026-08-11 |
| REQ-079c | Adventure modules (Part c) | 2026-08-11 |
| REQ-079d | Adventure modules (Part d) | 2026-08-11 |
| REQ-079e | Adventure modules (Part e) | 2026-08-11 |
| REQ-079f | Adventure modules (Part f) | 2026-08-11 |
| REQ-079g | Adventure modules (Part g) | 2026-08-11 |
| REQ-079h | Adventure modules (Part h) | 2026-08-11 |
| REQ-079i | Adventure modules (Part i) | 2026-08-11 |
| REQ-079j1 | Adventure modules (Part j1) | 2026-08-11 |
| REQ-079j2 | Adventure modules (Part j2) | 2026-08-11 |
| REQ-292a | Adventure catalog (Part a) | 2026-08-11 |
| REQ-292b | Adventure catalog (Part b) | 2026-08-11 |
| REQ-292c | Adventure catalog (Part c) | 2026-08-11 |
| REQ-292d | Adventure catalog (Part d) | 2026-08-11 |
| REQ-229a | Adventure synthesis linkage (Part a) | 2026-08-11 |
| REQ-229b | Adventure synthesis linkage (Part b) | 2026-08-11 |
| REQ-229c | Adventure synthesis linkage (Part c) | 2026-08-11 |
| REQ-229d | Adventure synthesis linkage (Part d) | 2026-08-11 |
| REQ-170 | Adventure discovery surface | 2026-08-11 |
| REQ-171a | Adventure content validation (Part a) | 2026-08-11 |
| REQ-171b | Adventure content validation (Part b) | 2026-08-11 |
| REQ-172 | Adventure content drift detection | 2026-08-11 |
| REQ-247a | Adventure structure extraction (Part a) | 2026-08-11 |
| REQ-247b1 | Adventure structure extraction (Part b1) | 2026-08-11 |
| REQ-247b2 | Adventure structure extraction (Part b2) | 2026-08-11 |
| REQ-247c | Adventure structure extraction (Part c) | 2026-08-11 |
| REQ-248a | Adventure overview resource (Part a) | 2026-08-11 |
| REQ-248b | Adventure overview resource (Part b) | 2026-08-11 |
| REQ-249a | Adventure navigation resource (Part a) | 2026-08-11 |
| REQ-249b | Adventure navigation resource (Part b) | 2026-08-11 |
| REQ-250a | Adventure scene waypoint (Part a) | 2026-08-11 |
| REQ-250b | Adventure scene waypoint (Part b) | 2026-08-11 |
| REQ-250c | Adventure scene waypoint (Part c) | 2026-08-11 |
| REQ-132a | Adventure generation lifecycle (Part a) | 2026-08-11 |
| REQ-132b | Adventure generation lifecycle (Part b) | 2026-08-11 |
| REQ-132c | Adventure generation lifecycle (Part c) | 2026-08-11 |
| REQ-132d | Adventure generation lifecycle (Part d) | 2026-08-11 |
| REQ-132e | Adventure generation lifecycle (Part e) | 2026-08-11 |
| REQ-044 | Ruleset hash recording | 2026-08-11 |
| REQ-302a | Per-section content hashing (Part a) | 2026-08-11 |
| REQ-302b | Per-section content hashing (Part b) | 2026-08-11 |
| REQ-065a | Build fingerprint (Part a) | 2026-08-11 |
| REQ-065b | Build fingerprint (Part b) | 2026-08-11 |
| REQ-065c | Build fingerprint (Part c) | 2026-08-11 |
| REQ-065d | Build fingerprint (Part d) | 2026-08-11 |
| REQ-065e | Build fingerprint (Part e) | 2026-08-11 |
| REQ-065f | Build fingerprint (Part f) | 2026-08-11 |
| REQ-313a | Server implementation fingerprinting (Part a) | 2026-08-11 |
| REQ-313b | Server implementation fingerprinting (Part b) | 2026-08-11 |
| REQ-313c | Server implementation fingerprinting (Part c) | 2026-08-11 |
| REQ-313d | Server implementation fingerprinting (Part d) | 2026-08-11 |
| REQ-314a | Fingerprint-driven partial rebuild (Part a) | 2026-08-11 |
| REQ-314b | Fingerprint-driven partial rebuild (Part b) | 2026-08-11 |
| REQ-314c | Fingerprint-driven partial rebuild (Part c) | 2026-08-11 |
| REQ-314d | Fingerprint-driven partial rebuild (Part d) | 2026-08-11 |
| REQ-232a | Pause/resume context (Part a) | 2026-08-11 |
| REQ-232b | Pause/resume context (Part b) | 2026-08-11 |
| REQ-232c | Pause/resume context (Part c) | 2026-08-11 |
| REQ-232d | Pause/resume context (Part d) | 2026-08-11 |
| REQ-2331 | Factions (Part 1) | 2026-08-11 |
| REQ-2332 | Factions (Part 2) | 2026-08-11 |
| REQ-2333 | Factions (Part 3) | 2026-08-11 |
| REQ-233a1 | World reactivity (Part a1) | 2026-08-11 |
| REQ-233a2 | World reactivity (Part a2) | 2026-08-11 |
| REQ-233a3 | World reactivity (Part a3) | 2026-08-11 |
| REQ-236a | Entity relationships (Part a) | 2026-08-11 |
| REQ-236b | Entity relationships (Part b) | 2026-08-11 |
| REQ-236c | Entity relationships (Part c) | 2026-08-11 |
| REQ-237a | Session segmentation (Part a) | 2026-08-11 |
| REQ-237b1 | Session segmentation (Part b1) | 2026-08-11 |
| REQ-237b2 | Session segmentation (Part b2) | 2026-08-11 |
| REQ-073a1 | Clock types (Part a) (Part a1) | 2026-08-11 |
| REQ-073a2 | Clock types (Part a) (Part a2) | 2026-08-11 |
| REQ-073b1 | Clock types (Part b) (Part b1) | 2026-08-11 |
| REQ-073b2 | Clock types (Part b) (Part b2) | 2026-08-11 |
| REQ-239a | Audit log compaction (Part a) | 2026-08-11 |
| REQ-239b | Audit log compaction (Part b) | 2026-08-11 |
| REQ-239c | Audit log compaction (Part c) | 2026-08-11 |
| REQ-239d | Audit log compaction (Part d) | 2026-08-11 |
| REQ-241a | Checkpoints (Part a) | 2026-08-11 |
| REQ-241b | Checkpoints (Part b) | 2026-08-11 |
| REQ-241c | Checkpoints (Part c) | 2026-08-11 |
| REQ-242a | Notes (Part a) | 2026-08-11 |
| REQ-242b | Notes (Part b) | 2026-08-11 |
| REQ-242c | Notes (Part c) | 2026-08-11 |
| REQ-242d | Notes (Part d) | 2026-08-11 |
| REQ-285a | Server notes (Part a) | 2026-08-11 |
| REQ-285b | Server notes (Part b) | 2026-08-11 |
| REQ-285c | Server notes (Part c) | 2026-08-11 |
| REQ-321a | Codex (Part a) | 2026-08-11 |
| REQ-321b | Codex (Part b) | 2026-08-11 |
| REQ-321c | Codex (Part c) | 2026-08-11 |
| REQ-321d | Codex (Part d) | 2026-08-11 |
| REQ-321e | Codex (Part e) | 2026-08-11 |
| REQ-321f | Codex (Part f) | 2026-08-11 |
| REQ-321g | Codex (Part g) | 2026-08-11 |
| REQ-321h | Codex (Part h) | 2026-08-11 |
| REQ-321i | Codex (Part i) | 2026-08-11 |
| REQ-321j | Codex (Part j) | 2026-08-11 |
| REQ-321k | Codex (Part k) | 2026-08-11 |
| REQ-321l | Codex (Part l) | 2026-08-11 |
| REQ-321m1 | Codex (Part m1) | 2026-08-11 |
| REQ-321m2 | Codex (Part m2) | 2026-08-11 |
| REQ-321m3 | Codex (Part m3) | 2026-08-11 |
| REQ-321m4 | Codex (Part m4) | 2026-08-11 |
| REQ-332a | Codex provenance (Part a) | 2026-08-11 |
| REQ-332b | Codex provenance (Part b) | 2026-08-11 |
| REQ-332c | Codex provenance (Part c) | 2026-08-11 |
| REQ-050a | Determinism (Part a) | 2026-08-11 |
| REQ-050b | Determinism (Part b) | 2026-08-11 |
| REQ-050c | Determinism (Part c) | 2026-08-11 |
| REQ-273a | Independent verification reproducibility tolerance (Part a) | 2026-08-11 |
| REQ-273b | Independent verification reproducibility tolerance (Part b) | 2026-08-11 |
| REQ-274 | Independent verifier confidence score | 2026-08-11 |
| REQ-213a | Weighted table result mapping (Part a) | 2026-08-11 |
| REQ-213b | Weighted table result mapping (Part b) | 2026-08-11 |
| REQ-213c | Weighted table result mapping (Part c) | 2026-08-11 |
| REQ-291a | Oracle tool (Part a) | 2026-08-11 |
| REQ-291b | Oracle tool (Part b) | 2026-08-11 |
| REQ-291c | Oracle tool (Part c) | 2026-08-11 |
| REQ-291d | Oracle tool (Part d) | 2026-08-11 |
| REQ-157a | Combat determinism (Part a) | 2026-08-11 |
| REQ-157b | Combat determinism (Part b) | 2026-08-11 |
| REQ-051 | No runtime network access | 2026-08-11 |
| REQ-052 | Path containment | 2026-08-11 |
| REQ-251a | Generation intent guard (Part a) | 2026-08-11 |
| REQ-251b | Generation intent guard (Part b) | 2026-08-11 |
| REQ-251c | Generation intent guard (Part c) | 2026-08-11 |
| REQ-251d | Generation intent guard (Part d) | 2026-08-11 |
| REQ-100a | Performance benchmark (Part a) | 2026-08-11 |
| REQ-100b | Performance benchmark (Part b) | 2026-08-11 |
| REQ-100c | Performance benchmark (Part c) | 2026-08-11 |
| REQ-100d | Performance benchmark (Part d) | 2026-08-11 |
| REQ-253a | Tool-output verbosity control (Part a) | 2026-08-11 |
| REQ-253b | Tool-output verbosity control (Part b) | 2026-08-11 |
| REQ-253c | Tool-output verbosity control (Part c) | 2026-08-11 |
| REQ-054 | Input safety | 2026-08-11 |
| REQ-055 | Durability | 2026-08-11 |
| REQ-055a | Badge precedence on resume | 2026-08-11 |
| REQ-055b | Story-in-progress notice | 2026-08-11 |
| REQ-3121 | Pre-narration validation gate (Part 1) | 2026-08-11 |
| REQ-3122 | Pre-narration validation gate (Part 2) | 2026-08-11 |
| REQ-312a | Bounds conformance | 2026-08-11 |
| REQ-312b | Permission conformance | 2026-08-11 |
| REQ-312c | State conformance | 2026-08-11 |
| REQ-2461 | Story journal (Part 1) | 2026-08-11 |
| REQ-2462 | Story journal (Part 2) | 2026-08-11 |
| REQ-246a | Story journal surfacing | 2026-08-11 |
| REQ-331a | Story journal-world coupling (Part a) | 2026-08-11 |
| REQ-331b | Story journal-world coupling (Part b) | 2026-08-11 |
| REQ-333a | Story journal to lore promotion (Part a) | 2026-08-11 |
| REQ-333b | Story journal to lore promotion (Part b) | 2026-08-11 |
| REQ-333c | Story journal to lore promotion (Part c) | 2026-08-11 |
| REQ-310a | Campaign Memory (Part a) | 2026-08-11 |
| REQ-310b | Campaign Memory (Part b) | 2026-08-11 |
| REQ-310c | Campaign Memory (Part c) | 2026-08-11 |
| REQ-310d | Campaign Memory (Part d) | 2026-08-11 |
| REQ-310e | Campaign Memory (Part e) | 2026-08-11 |
| REQ-310f | Campaign Memory (Part f) | 2026-08-11 |
| REQ-310g | Campaign Memory (Part g) | 2026-08-11 |
| REQ-080a | Synthesis boundaries (Part a) | 2026-08-11 |
| REQ-080b | Synthesis boundaries (Part b) | 2026-08-11 |
| REQ-080c | Synthesis boundaries (Part c) | 2026-08-11 |
| REQ-080d | Synthesis boundaries (Part d) | 2026-08-11 |
| REQ-080e | Synthesis boundaries (Part e) | 2026-08-11 |
| REQ-080f | Synthesis boundaries (Part f) | 2026-08-11 |
| REQ-080g1 | Synthesis boundaries (Part g1) | 2026-08-11 |
| REQ-080g2 | Synthesis boundaries (Part g2) | 2026-08-11 |
| REQ-081a | Narrative directive (Part a) | 2026-08-11 |
| REQ-081b | Narrative directive (Part b) | 2026-08-11 |
| REQ-081c | Narrative directive (Part c) | 2026-08-11 |
| REQ-081d | Narrative directive (Part d) | 2026-08-11 |
| REQ-082a | Prompt section ordering (Part a) | 2026-08-11 |
| REQ-082b | Prompt section ordering (Part b) | 2026-08-11 |
| REQ-082c | Prompt section ordering (Part c) | 2026-08-11 |
| REQ-185a | Section token vocabulary (Part a) | 2026-08-11 |
| REQ-185b | Section token vocabulary (Part b) | 2026-08-11 |
| REQ-185c | Section token vocabulary (Part c) | 2026-08-11 |
| REQ-186a | Section token discoverability (Part a) | 2026-08-11 |
| REQ-186b | Section token discoverability (Part b) | 2026-08-11 |
| REQ-083a | Dynamic lore (Part a) | 2026-08-11 |
| REQ-083b | Dynamic lore (Part b) | 2026-08-11 |
| REQ-083c | Dynamic lore (Part c) | 2026-08-11 |
| REQ-083d | Dynamic lore (Part d) | 2026-08-11 |
| REQ-083e | Dynamic lore (Part e) | 2026-08-11 |
| REQ-083f | Dynamic lore (Part f) | 2026-08-11 |
| REQ-155a | Sticky counter decay (Part a) | 2026-08-11 |
| REQ-155b | Sticky counter decay (Part b) | 2026-08-11 |
| REQ-328a | Lore-world coupling (Part a) | 2026-08-11 |
| REQ-328b | Lore-world coupling (Part b) | 2026-08-11 |
| REQ-158a | Independent verification obligation (Part a) | 2026-08-11 |
| REQ-158b | Independent verification obligation (Part b) | 2026-08-11 |
| REQ-0841 | Action suggestions (Part 1) | 2026-08-11 |
| REQ-0842 | Action suggestions (Part 2) | 2026-08-11 |
| REQ-0843 | Action suggestions (Part 3) | 2026-08-11 |
| REQ-0844 | Action suggestions (Part 4) | 2026-08-11 |
| REQ-084a1 | Proactive action surfacing (Part a1) | 2026-08-11 |
| REQ-084a2 | Proactive action surfacing (Part a2) | 2026-08-11 |
| REQ-084a3 | Proactive action surfacing (Part a3) | 2026-08-11 |
| REQ-115a | Action pattern activation (Part a) | 2026-08-11 |
| REQ-115b | Action pattern activation (Part b) | 2026-08-11 |
| REQ-114a | Suggestion coverage (Part a) | 2026-08-11 |
| REQ-114b | Suggestion coverage (Part b) | 2026-08-11 |
| REQ-103a | Synthesis reversion (Part a) | 2026-08-11 |
| REQ-103b | Synthesis reversion (Part b) | 2026-08-11 |
| REQ-103c | Synthesis reversion (Part c) | 2026-08-11 |
| REQ-103d | Synthesis reversion (Part d) | 2026-08-11 |
| REQ-260a | Granular synthesis activation (Part a) | 2026-08-11 |
| REQ-260b | Granular synthesis activation (Part b) | 2026-08-11 |
| REQ-260c | Granular synthesis activation (Part c) | 2026-08-11 |
| REQ-260d | Granular synthesis activation (Part d) | 2026-08-11 |
| REQ-261a | Player synthesis (Part a) | 2026-08-11 |
| REQ-261b | Player synthesis (Part b) | 2026-08-11 |
| REQ-261c | Player synthesis (Part c) | 2026-08-11 |
| REQ-261d | Player synthesis (Part d) | 2026-08-11 |
| REQ-261e | Player synthesis (Part e) | 2026-08-11 |
| REQ-262a | Synthesis tool (Part a) | 2026-08-11 |
| REQ-262b | Synthesis tool (Part b) | 2026-08-11 |
| REQ-262c | Synthesis tool (Part c) | 2026-08-11 |
| REQ-263a | Synthesis auto-trigger (Part a) | 2026-08-11 |
| REQ-263b | Synthesis auto-trigger (Part b) | 2026-08-11 |
| REQ-264a | Synthesis confidence model (Part a) | 2026-08-11 |
| REQ-264b | Synthesis confidence model (Part b) | 2026-08-11 |
| REQ-264c | Synthesis confidence model (Part c) | 2026-08-11 |
| REQ-265a | Synthesis in badge_briefing (Part a) | 2026-08-11 |
| REQ-265b | Synthesis in badge_briefing (Part b) | 2026-08-11 |
| REQ-265c | Synthesis in badge_briefing (Part c) | 2026-08-11 |
| REQ-266a | Synthesis in dashboard (Part a) | 2026-08-11 |
| REQ-266b | Synthesis in dashboard (Part b) | 2026-08-11 |
| REQ-130a | Synthesis rebuild contract (Part a) | 2026-08-11 |
| REQ-130b | Synthesis rebuild contract (Part b) | 2026-08-11 |
| REQ-130c | Synthesis rebuild contract (Part c) | 2026-08-11 |
| REQ-226a | Narrative voice profiles (Part a) | 2026-08-11 |
| REQ-226b | Narrative voice profiles (Part b) | 2026-08-11 |
| REQ-226c | Narrative voice profiles (Part c) | 2026-08-11 |
| REQ-227a | Synthesis model (Part a) | 2026-08-11 |
| REQ-227b | Synthesis model (Part b) | 2026-08-11 |
| REQ-228a | Synthesis consistency during spec-driven updates (Part a) | 2026-08-11 |
| REQ-228b | Synthesis consistency during spec-driven updates (Part b) | 2026-08-11 |
| REQ-228c | Synthesis consistency during spec-driven updates (Part c) | 2026-08-11 |
| REQ-230a | Synthesis status dashboard (Part a) | 2026-08-11 |
| REQ-230b | Synthesis status dashboard (Part b) | 2026-08-11 |
| REQ-231a | Per-module synthesis toggle (Part a) | 2026-08-11 |
| REQ-231b | Per-module synthesis toggle (Part b) | 2026-08-11 |
| REQ-243a | Synthesis population during spec-driven updates (Part a) | 2026-08-11 |
| REQ-243b | Synthesis population during spec-driven updates (Part b) | 2026-08-11 |
| REQ-243c | Synthesis population during spec-driven updates (Part c) | 2026-08-11 |
| REQ-243d | Synthesis population during spec-driven updates (Part d) | 2026-08-11 |
| REQ-244a | Convergence cache key (Part a) | 2026-08-11 |
| REQ-244b | Convergence cache key (Part b) | 2026-08-11 |
| REQ-244c | Convergence cache key (Part c) | 2026-08-11 |
| REQ-244d | Convergence cache key (Part d) | 2026-08-11 |
| REQ-244e | Convergence cache key (Part e) | 2026-08-11 |
| REQ-245a | Pre-computed synthesis manifest (Part a) | 2026-08-11 |
| REQ-245b | Pre-computed synthesis manifest (Part b) | 2026-08-11 |
| REQ-245c | Pre-computed synthesis manifest (Part c) | 2026-08-11 |
| REQ-245d | Pre-computed synthesis manifest (Part d) | 2026-08-11 |
| REQ-245e | Pre-computed synthesis manifest (Part e) | 2026-08-11 |
| REQ-085a | Macro system (Part a) | 2026-08-11 |
| REQ-085b | Macro system (Part b) | 2026-08-11 |
| REQ-086a | Audit compression (Part a) | 2026-08-11 |
| REQ-086b | Audit compression (Part b) | 2026-08-11 |
| REQ-086c | Audit compression (Part c) | 2026-08-11 |
| REQ-087a | Scene type tagging (Part a) | 2026-08-11 |
| REQ-087b | Scene type tagging (Part b) | 2026-08-11 |
| REQ-087c | Scene type tagging (Part c) | 2026-08-11 |
| REQ-125a | Scene transition hook (Part a) | 2026-08-11 |
| REQ-125b | Scene transition hook (Part b) | 2026-08-11 |
| REQ-234a | Secrets and knowledge (Part a) | 2026-08-11 |
| REQ-234b | Secrets and knowledge (Part b) | 2026-08-11 |
| REQ-234c | Secrets and knowledge (Part c) | 2026-08-11 |
| REQ-234d | Secrets and knowledge (Part d) | 2026-08-11 |
| REQ-088a | Novel lifecycle (Part a) | 2026-08-11 |
| REQ-088b | Novel lifecycle (Part b) | 2026-08-11 |
| REQ-088c | Novel lifecycle (Part c) | 2026-08-11 |
| REQ-088d | Novel lifecycle (Part d) | 2026-08-11 |
| REQ-088e | Novel lifecycle (Part e) | 2026-08-11 |
| REQ-088f | Novel lifecycle (Part f) | 2026-08-11 |
| REQ-088g | Novel lifecycle (Part g) | 2026-08-11 |
| REQ-088h1 | Novel lifecycle (Part h1) | 2026-08-11 |
| REQ-088h2 | Novel lifecycle (Part h2) | 2026-08-11 |
| REQ-117 | Novel retention period | 2026-08-11 |
| REQ-095a | Novel switching (Part a) | 2026-08-11 |
| REQ-095b | Novel switching (Part b) | 2026-08-11 |
| REQ-256a | Rename Novel (Part a) | 2026-08-11 |
| REQ-256b | Rename Novel (Part b) | 2026-08-11 |
| REQ-259 | Update Novel description | 2026-08-11 |
| REQ-257a | List Novels (Part a) | 2026-08-11 |
| REQ-257b | List Novels (Part b) | 2026-08-11 |
| REQ-258a | Novel info (Part a) | 2026-08-11 |
| REQ-258b | Novel info (Part b) | 2026-08-11 |
| REQ-089a | Novel setup (Part a) | 2026-08-11 |
| REQ-089b | Novel setup (Part b) | 2026-08-11 |
| REQ-089c | Novel setup (Part c) | 2026-08-11 |
| REQ-089d | Novel setup (Part d) | 2026-08-11 |
| REQ-294 | Genre declaration | 2026-08-11 |
| REQ-090a | Adventure generation (Part a) | 2026-08-11 |
| REQ-090b | Adventure generation (Part b) | 2026-08-11 |
| REQ-090c | Adventure generation (Part c) | 2026-08-11 |
| REQ-090d | Adventure generation (Part d) | 2026-08-11 |
| REQ-090e | Adventure generation (Part e) | 2026-08-11 |
| REQ-091a | Enhanced encounter generation (Part a) | 2026-08-11 |
| REQ-091b | Enhanced encounter generation (Part b) | 2026-08-11 |
| REQ-295a | Genre-filtered generation (Part a) | 2026-08-11 |
| REQ-295b | Genre-filtered generation (Part b) | 2026-08-11 |
| REQ-295c | Genre-filtered generation (Part c) | 2026-08-11 |
| REQ-092a | Novel persistence (Part a) | 2026-08-11 |
| REQ-092b | Novel persistence (Part b) | 2026-08-11 |
| REQ-092c | Novel persistence (Part c) | 2026-08-11 |
| REQ-092d | Novel persistence (Part d) | 2026-08-11 |
| REQ-092e | Novel persistence (Part e) | 2026-08-11 |
| REQ-092f | Novel persistence (Part f) | 2026-08-11 |
| REQ-092g | Novel persistence (Part g) | 2026-08-11 |
| REQ-092h1 | Novel persistence (Part h1) | 2026-08-11 |
| REQ-092h2 | Novel persistence (Part h2) | 2026-08-11 |
| REQ-093a | Novel listing and metadata (Part a) | 2026-08-11 |
| REQ-093b | Novel listing and metadata (Part b) | 2026-08-11 |
| REQ-093c | Novel listing and metadata (Part c) | 2026-08-11 |
| REQ-094a | Lorebook interchange (Part a) | 2026-08-11 |
| REQ-094b | Lorebook interchange (Part b) | 2026-08-11 |
| REQ-094c | Lorebook interchange (Part c) | 2026-08-11 |
| REQ-096a | Novel interchange (Part a) | 2026-08-11 |
| REQ-096b | Novel interchange (Part b) | 2026-08-11 |
| REQ-096c | Novel interchange (Part c) | 2026-08-11 |
| REQ-096d1 | Novel interchange (Part d1) | 2026-08-11 |
| REQ-096d2 | Novel interchange (Part d2) | 2026-08-11 |
| REQ-096e | Novel interchange (Part e) | 2026-08-11 |
| REQ-096f | Novel interchange (Part f) | 2026-08-11 |
| REQ-096g | Novel interchange (Part g) | 2026-08-11 |
| REQ-096h | Novel interchange (Part h) | 2026-08-11 |
| REQ-096i1 | Novel interchange (Part i1) | 2026-08-11 |
| REQ-096i2 | Novel interchange (Part i2) | 2026-08-11 |
| REQ-097a1 | Novel health (Part a1) | 2026-08-11 |
| REQ-097a2 | Novel health (Part a2) | 2026-08-11 |
| REQ-097b | Novel health (Part b) | 2026-08-11 |
| REQ-097c | Novel health (Part c) | 2026-08-11 |
| REQ-131a | Novel initialization order (Part a) | 2026-08-11 |
| REQ-131b | Novel initialization order (Part b) | 2026-08-11 |
| REQ-131c | Novel initialization order (Part c) | 2026-08-11 |
| REQ-238a | Backup rotation (Part a) | 2026-08-11 |
| REQ-238b | Backup rotation (Part b) | 2026-08-11 |
| REQ-240a | Clone Novel (Part a) | 2026-08-11 |
| REQ-240b | Clone Novel (Part b) | 2026-08-11 |
| REQ-240c | Clone Novel (Part c) | 2026-08-11 |
| REQ-334a | Novel archive (Part a) | 2026-08-11 |
| REQ-334b | Novel archive (Part b) | 2026-08-11 |
| REQ-334c | Novel archive (Part c) | 2026-08-11 |
| REQ-334d | Novel archive (Part d) | 2026-08-11 |
| REQ-195a | World-model state tier (Part a) | 2026-08-11 |
| REQ-195b | World-model state tier (Part b) | 2026-08-11 |
| REQ-196a | Parser command dispatch (Part a) | 2026-08-11 |
| REQ-196b | Parser command dispatch (Part b) | 2026-08-11 |
| REQ-196c | Parser command dispatch (Part c) | 2026-08-11 |
| REQ-196d | Parser command dispatch (Part d) | 2026-08-11 |
| REQ-196e | Parser command dispatch (Part e) | 2026-08-11 |
| REQ-196f | Parser command dispatch (Part f) | 2026-08-11 |
| REQ-283a | Verb coverage tiers (Part a) | 2026-08-11 |
| REQ-283b | Verb coverage tiers (Part b) | 2026-08-11 |
| REQ-283c | Verb coverage tiers (Part c) | 2026-08-11 |
| REQ-284a | Implicit action hints (Part a) | 2026-08-11 |
| REQ-284b | Implicit action hints (Part b) | 2026-08-11 |
| REQ-284c | Implicit action hints (Part c) | 2026-08-11 |
| REQ-284d | Implicit action hints (Part d) | 2026-08-11 |
| REQ-284e | Implicit action hints (Part e) | 2026-08-11 |
| REQ-316a | Device kind (Part a) | 2026-08-11 |
| REQ-316b | Device kind (Part b) | 2026-08-11 |
| REQ-317a | Vehicle kind (Part a) | 2026-08-11 |
| REQ-317b | Vehicle kind (Part b) | 2026-08-11 |
| REQ-317c | Vehicle kind (Part c) | 2026-08-11 |
| REQ-317d | Vehicle kind (Part d) | 2026-08-11 |
| REQ-318a | Extended property contracts (Part a) | 2026-08-11 |
| REQ-318b | Extended property contracts (Part b) | 2026-08-11 |
| REQ-319a | Extended parser command vocabulary (Part a) | 2026-08-11 |
| REQ-319b | Extended parser command vocabulary (Part b) | 2026-08-11 |
| REQ-319c | Extended parser command vocabulary (Part c) | 2026-08-11 |
| REQ-319d | Extended parser command vocabulary (Part d) | 2026-08-11 |
| REQ-320a | Narrative-intent parser verbs (Part a) | 2026-08-11 |
| REQ-320b | Narrative-intent parser verbs (Part b) | 2026-08-11 |
| REQ-320c | Narrative-intent parser verbs (Part c) | 2026-08-11 |
| REQ-197a | Room description generation (Part a) | 2026-08-11 |
| REQ-197b | Room description generation (Part b) | 2026-08-11 |
| REQ-197c | Room description generation (Part c) | 2026-08-11 |
| REQ-197d | Room description generation (Part d) | 2026-08-11 |
| REQ-198 | World-model CRUD | 2026-08-11 |
| REQ-199 | Property state tracking | 2026-08-11 |
| REQ-200 | Kind mechanical contracts | 2026-08-11 |
| REQ-201 | Hybrid source conversion | 2026-08-11 |
| REQ-202a | World-model resources (Part a) | 2026-08-11 |
| REQ-202b | World-model resources (Part b) | 2026-08-11 |
| REQ-222a | Parser command vocabulary extension (Part a) | 2026-08-11 |
| REQ-222b | Parser command vocabulary extension (Part b) | 2026-08-11 |
| REQ-222c | Parser command vocabulary extension (Part c) | 2026-08-11 |
| REQ-309a | World and narrative surface prominence (Part a) | 2026-08-11 |
| REQ-309b | World and narrative surface prominence (Part b) | 2026-08-11 |
| REQ-309c | World and narrative surface prominence (Part c) | 2026-08-11 |
| REQ-309d | World and narrative surface prominence (Part d) | 2026-08-11 |
| REQ-309e | World and narrative surface prominence (Part e) | 2026-08-11 |
| REQ-309f | World and narrative surface prominence (Part f) | 2026-08-11 |
| REQ-309g | World and narrative surface prominence (Part g) | 2026-08-11 |
| REQ-309h | World and narrative surface prominence (Part h) | 2026-08-11 |
| REQ-325a | Constraint override catalog (Part a) | 2026-08-11 |
| REQ-325b | Constraint override catalog (Part b) | 2026-08-11 |
| REQ-325c | Constraint override catalog (Part c) | 2026-08-11 |
| REQ-326a | Scene-world coupling (Part a) | 2026-08-11 |
| REQ-326b | Scene-world coupling (Part b) | 2026-08-11 |
| REQ-326c | Scene-world coupling (Part c) | 2026-08-11 |
| REQ-326d | Scene-world coupling (Part d) | 2026-08-11 |
| REQ-327a | NPC-world coupling (Part a) | 2026-08-11 |
| REQ-327b | NPC-world coupling (Part b) | 2026-08-11 |
| REQ-327c | NPC-world coupling (Part c) | 2026-08-11 |
| REQ-367a | Property propagation across containment (Part a) | 2026-08-11 |
| REQ-367b1 | Property propagation across containment (Part b1) | 2026-08-11 |
| REQ-367b2 | Property propagation across containment (Part b2) | 2026-08-11 |
| REQ-367c | Property propagation across containment (Part c) | 2026-08-11 |
| REQ-368a | Countdown-world effect coupling (Part a) | 2026-08-11 |
| REQ-368b | Countdown-world effect coupling (Part b) | 2026-08-11 |
| REQ-368c | Countdown-world effect coupling (Part c) | 2026-08-11 |
| REQ-368d | Countdown-world effect coupling (Part d) | 2026-08-11 |
| REQ-368e | Countdown-world effect coupling (Part e) | 2026-08-11 |
| REQ-218a | Ruleset-free build (Part a) | 2026-08-11 |
| REQ-218b | Ruleset-free build (Part b) | 2026-08-11 |
| REQ-218c | Ruleset-free build (Part c) | 2026-08-11 |
| REQ-219a1 | Ruleset-free entity creation (Part a) (Part a1) | 2026-08-11 |
| REQ-219a2 | Ruleset-free entity creation (Part a) (Part a2) | 2026-08-11 |
| REQ-219b | Ruleset-free entity creation (Part b) | 2026-08-11 |
| REQ-335a | Scene beat taxonomy (Part a) | 2026-08-11 |
| REQ-335b | Scene beat taxonomy (Part b) | 2026-08-11 |
| REQ-335c | Scene beat taxonomy (Part c) | 2026-08-11 |
| REQ-353 | Beat-accelerated countdown advancement | 2026-08-11 |
| REQ-336a | Dramatic pacing signal (Part a) | 2026-08-11 |
| REQ-336b | Dramatic pacing signal (Part b) | 2026-08-11 |
| REQ-351a | Pacing-triggered autonomy (Part a) | 2026-08-11 |
| REQ-351b | Pacing-triggered autonomy (Part b) | 2026-08-11 |
| REQ-351c | Pacing-triggered autonomy (Part c) | 2026-08-11 |
| REQ-337a | Narrative arc visibility (Part a) | 2026-08-11 |
| REQ-337b | Narrative arc visibility (Part b) | 2026-08-11 |
| REQ-352a | Codex adventure beat sequences (Part a) | 2026-08-11 |
| REQ-352b | Codex adventure beat sequences (Part b) | 2026-08-11 |
| REQ-352c | Codex adventure beat sequences (Part c) | 2026-08-11 |
| REQ-352d | Codex adventure beat sequences (Part d) | 2026-08-11 |
| REQ-338a | Faction autonomous advancement (Part a) | 2026-08-11 |
| REQ-338b | Faction autonomous advancement (Part b) | 2026-08-11 |
| REQ-338c | Faction autonomous advancement (Part c) | 2026-08-11 |
| REQ-339a | NPC goal pursuit (Part a) | 2026-08-11 |
| REQ-339b | NPC goal pursuit (Part b) | 2026-08-11 |
| REQ-339c | NPC goal pursuit (Part c) | 2026-08-11 |
| REQ-348a | Faction-NPC goal coordination (Part a) | 2026-08-11 |
| REQ-348b | Faction-NPC goal coordination (Part b) | 2026-08-11 |
| REQ-348c | Faction-NPC goal coordination (Part c) | 2026-08-11 |
| REQ-340a | Discovered consequences (Part a) | 2026-08-11 |
| REQ-340b | Discovered consequences (Part b) | 2026-08-11 |
| REQ-340c | Discovered consequences (Part c) | 2026-08-11 |
| REQ-349a | Consequence-to-knowledge coupling (Part a) | 2026-08-11 |
| REQ-349b | Consequence-to-knowledge coupling (Part b) | 2026-08-11 |
| REQ-349c | Consequence-to-knowledge coupling (Part c) | 2026-08-11 |
| REQ-341a | Player-facing spatial surface (Part a) | 2026-08-11 |
| REQ-341b | Player-facing spatial surface (Part b) | 2026-08-11 |
| REQ-341c | Player-facing spatial surface (Part c) | 2026-08-11 |
| REQ-342a | Scene description from world-model state (Part a) | 2026-08-11 |
| REQ-342b | Scene description from world-model state (Part b) | 2026-08-11 |
| REQ-343a | Unified intent resolution (Part a) | 2026-08-11 |
| REQ-343b | Unified intent resolution (Part b) | 2026-08-11 |
| REQ-343c | Unified intent resolution (Part c) | 2026-08-11 |
| REQ-343d | Unified intent resolution (Part d) | 2026-08-11 |
| REQ-344a | Voice example feedback (Part a) | 2026-08-11 |
| REQ-344b | Voice example feedback (Part b) | 2026-08-11 |
| REQ-344c | Voice example feedback (Part c) | 2026-08-11 |
| REQ-347a | Voice feedback codex capture (Part a) | 2026-08-11 |
| REQ-347b | Voice feedback codex capture (Part b) | 2026-08-11 |
| REQ-347c | Voice feedback codex capture (Part c) | 2026-08-11 |
| REQ-345a | Background-derived knowledge (Part a) | 2026-08-11 |
| REQ-345b | Background-derived knowledge (Part b) | 2026-08-11 |
| REQ-345c | Background-derived knowledge (Part c) | 2026-08-11 |
| REQ-350a | Background lore triggering (Part a) | 2026-08-11 |
| REQ-350b | Background lore triggering (Part b) | 2026-08-11 |
| REQ-350c | Background lore triggering (Part c) | 2026-08-11 |
| REQ-355a | Secret-countdown coupling (Part a) | 2026-08-11 |
| REQ-355b | Secret-countdown coupling (Part b) | 2026-08-11 |
| REQ-356a | Vow-lore coupling (Part a) | 2026-08-11 |
| REQ-356b | Vow-lore coupling (Part b) | 2026-08-11 |
| REQ-357a | Story journal-faction coupling (Part a) | 2026-08-11 |
| REQ-357b | Story journal-faction coupling (Part b) | 2026-08-11 |
| REQ-358a | Countdown-NPC disposition coupling (Part a) | 2026-08-11 |
| REQ-358b | Countdown-NPC disposition coupling (Part b) | 2026-08-11 |
| REQ-359a | Relationship-countdown coupling (Part a) | 2026-08-11 |
| REQ-359b | Relationship-countdown coupling (Part b) | 2026-08-11 |
| REQ-360a | Lore-countdown coupling (Part a) | 2026-08-11 |
| REQ-360b | Lore-countdown coupling (Part b) | 2026-08-11 |
| REQ-361a | NPC-vow coupling (Part a) | 2026-08-11 |
| REQ-361b | NPC-vow coupling (Part b) | 2026-08-11 |
| REQ-362a | Faction-vow coupling (Part a) | 2026-08-11 |
| REQ-362b | Faction-vow coupling (Part b) | 2026-08-11 |
| REQ-363a | Secret-world coupling (Part a) | 2026-08-11 |
| REQ-363b | Secret-world coupling (Part b) | 2026-08-11 |
| REQ-364a | Faction-world coupling (Part a) | 2026-08-11 |
| REQ-364b | Faction-world coupling (Part b) | 2026-08-11 |
| REQ-365a | Server notes narrative coupling (Part a) | 2026-08-11 |
| REQ-365b | Server notes narrative coupling (Part b) | 2026-08-11 |
| REQ-365c | Server notes narrative coupling (Part c) | 2026-08-11 |
| REQ-366a | Observer narrative surface (Part a) | 2026-08-11 |
| REQ-366b | Observer narrative surface (Part b) | 2026-08-11 |
| REQ-366c | Observer narrative surface (Part c) | 2026-08-11 |
| REQ-366d | Observer narrative surface (Part d) | 2026-08-11 |
| REQ-346a1 | Narrative coherence attestation (Part a) (Part a1) | 2026-08-11 |
| REQ-346a2 | Narrative coherence attestation (Part a) (Part a2) | 2026-08-11 |
| REQ-346b | Narrative coherence attestation (Part b) | 2026-08-11 |
| REQ-369a | Holodeck archetype taxonomy (Part a) | 2026-08-11 |
| REQ-369b | Holodeck archetype taxonomy (Part b) | 2026-08-11 |
| REQ-370a | Coupling derivation (Part a) | 2026-08-11 |
| REQ-370b | Coupling derivation (Part b) | 2026-08-11 |
| REQ-371a | Ruleset Wisdom as rendered reality (Part a) | 2026-08-11 |
| REQ-371b | Ruleset Wisdom as rendered reality (Part b) | 2026-08-11 |
| REQ-374a | Archetype coverage (Part a) | 2026-08-11 |
| REQ-374b | Archetype coverage (Part b) | 2026-08-11 |
| REQ-375a | Wisdom mechanical coupling rate (Part a) | 2026-08-11 |
| REQ-375b | Wisdom mechanical coupling rate (Part b) | 2026-08-11 |
| REQ-376a1 | Holonovel Pattern Buffer traceability (Part a) (Part a1) | 2026-08-11 |
| REQ-376a2 | Holonovel Pattern Buffer traceability (Part a) (Part a2) | 2026-08-11 |
| REQ-376a3 | Holonovel Pattern Buffer traceability (Part a) (Part a3) | 2026-08-11 |
| REQ-376b | Holonovel Pattern Buffer traceability (Part b) | 2026-08-11 |
| REQ-372a | Supplementary ruleset import (Part a) | 2026-08-11 |
| REQ-372b | Supplementary ruleset import (Part b) | 2026-08-11 |
| REQ-372c | Supplementary ruleset import (Part c) | 2026-08-11 |
| REQ-372d | Supplementary ruleset import (Part d) | 2026-08-11 |
| REQ-372e | Supplementary ruleset import (Part e) | 2026-08-11 |
| REQ-373a1 | Dynamic tool registration (Part a) (Part a1) | 2026-08-11 |
| REQ-373a2 | Dynamic tool registration (Part a) (Part a2) | 2026-08-11 |
| REQ-373b | Dynamic tool registration (Part b) | 2026-08-11 |
| REQ-377a | Mechanical coupling extraction (Part a) | 2026-08-11 |
| REQ-377b | Mechanical coupling extraction (Part b) | 2026-08-11 |
| REQ-377c | Mechanical coupling extraction (Part c) | 2026-08-11 |
| REQ-377d | Mechanical coupling extraction (Part d) | 2026-08-11 |
| REQ-378a | Mechanical coupling verification (Part a) | 2026-08-11 |
| REQ-378b | Mechanical coupling verification (Part b) | 2026-08-11 |
| REQ-379a | Tool namespacing (Part a) | 2026-08-11 |
| REQ-379b | Tool namespacing (Part b) | 2026-08-11 |
| REQ-379c | Tool namespacing (Part c) | 2026-08-11 |
| REQ-380a | Novel ruleset binding (Part a) | 2026-08-11 |
| REQ-380b | Novel ruleset binding (Part b) | 2026-08-11 |
| REQ-380c | Novel ruleset binding (Part c) | 2026-08-11 |
| REQ-381a | Ruleset-scoped tool gating (Part a) | 2026-08-11 |
| REQ-381b | Ruleset-scoped tool gating (Part b) | 2026-08-11 |
| REQ-381c | Ruleset-scoped tool gating (Part c) | 2026-08-11 |
| REQ-382a | Per-ruleset extraction isolation (Part a) | 2026-08-11 |
| REQ-382b | Per-ruleset extraction isolation (Part b) | 2026-08-11 |
| REQ-382c | Per-ruleset extraction isolation (Part c) | 2026-08-11 |
| REQ-383a | Host ruleset health (Part a) | 2026-08-11 |
| REQ-383b | Host ruleset health (Part b) | 2026-08-11 |
| REQ-384a | Cross-ruleset Novel switching (Part a) | 2026-08-11 |
| REQ-384b | Cross-ruleset Novel switching (Part b) | 2026-08-11 |
| REQ-384c | Cross-ruleset Novel switching (Part c) | 2026-08-11 |
| REQ-385a | suggest_actions cross-ruleset scoping (Part a) | 2026-08-11 |
| REQ-385b | suggest_actions cross-ruleset scoping (Part b) | 2026-08-11 |
| REQ-386a | Cross-ruleset import rejection (Part a) | 2026-08-11 |
| REQ-386b | Cross-ruleset import rejection (Part b) | 2026-08-11 |
| REQ-387a | Codex ruleset annotation (Part a) | 2026-08-11 |
| REQ-387b | Codex ruleset annotation (Part b) | 2026-08-11 |
| REQ-389a | Ruleset package format (Part a) | 2026-08-17 |
| REQ-389b | Ruleset package format (Part b) | 2026-08-17 |
| REQ-389c | Ruleset install surface (Part c) | 2026-08-17 |
| REQ-390a | Lazy ruleset hydration (Part a) | 2026-08-17 |
| REQ-390b | Lazy ruleset hydration (Part b) | 2026-08-17 |
| REQ-391a | Scoped tool listing (Part a) | 2026-08-17 |
| REQ-391b | On-demand schema delivery (Part b) | 2026-08-17 |
| REQ-391c | Tool listing pagination (Part c) | 2026-08-17 |
| REQ-392 | Tool-description budget | 2026-08-17 |
| REQ-393 | Update preservation | 2026-08-17 |
| REQ-394 | Spec publication integrity | 2026-08-17 |
| REQ-395a | Ruleset-build entry point (Part a) | 2026-08-18 |
| REQ-395b | Workflow runbooks (Part b) | 2026-08-18 |
| REQ-396 | Deploy preservation | 2026-08-18 |
| REQ-397 | Untracked state location | 2026-08-19 |
| REQ-398 | Deploy-model scope | 2026-08-19 |
| REQ-399a | Character-creation package data (Part a) | 2026-08-21 |
| REQ-399b | Character-creation computation (Part b) | 2026-08-21 |
| REQ-399c | Character creation without package data (Part c) | 2026-08-21 |
| REQ-400 | State-Persistence Directive | 2026-08-21 |
| REQ-401 | State ledger briefing token | 2026-08-21 |
| REQ-402 | Session no-mutation detection | 2026-08-21 |
| REQ-403a | State-drift detection (Part a) | 2026-08-21 |
| REQ-403b | State-drift detection (Part b) | 2026-08-21 |
| REQ-404 | Roll-to-commit coupling | 2026-08-21 |
| REQ-405 | Auto-moment on transitions | 2026-08-21 |
| REQ-406 | Backup-restore regression visibility | 2026-08-21 |
| REQ-407 | Persist-tools never truncated | 2026-08-21 |
| REQ-408 | Tool parameter ceiling | 2026-08-21 |
| REQ-409 | Response-lean enumeration reads | 2026-08-21 |
| REQ-410 | Token footprint in performance record | 2026-08-21 |
| REQ-411 | Stable-metadata caching | 2026-08-21 |
| REQ-412 | Turn-handoff directive | 2026-08-22 |
| REQ-299 | Cross-model audit sufficiency | 2026-08-11 |
| REQ-108a | Pattern Buffer traceability (Part a) | 2026-08-11 |
| REQ-108b | Pattern Buffer traceability (Part b) | 2026-08-11 |
| REQ-141a | Input-validation convergence metric (Part a) | 2026-08-11 |
| REQ-141b | Input-validation convergence metric (Part b) | 2026-08-11 |
| REQ-141c | Input-validation convergence metric (Part c) | 2026-08-11 |
| REQ-141d | Input-validation convergence metric (Part d) | 2026-08-11 |
| REQ-141e | Input-validation convergence metric (Part e) | 2026-08-11 |
| REQ-141f | Input-validation convergence metric (Part f) | 2026-08-11 |
| REQ-141g | Input-validation convergence metric (Part g) | 2026-08-11 |
| REQ-141h | Input-validation convergence metric (Part h) | 2026-08-11 |
| REQ-141i | Input-validation convergence metric (Part i) | 2026-08-11 |
| REQ-141j | Input-validation convergence metric (Part j) | 2026-08-11 |
| REQ-142a | Blocking classification principle (Part a) | 2026-08-11 |
| REQ-142b | Blocking classification principle (Part b) | 2026-08-11 |
| REQ-208a | Pattern Buffer convergence metric mapping (Part a) | 2026-08-11 |
| REQ-208b | Pattern Buffer convergence metric mapping (Part b) | 2026-08-11 |
| REQ-376a | Holonovel Pattern Buffer traceability (Part a) | 2026-08-11 |
| REQ-300 | Structured failure diagnostics | 2026-08-11 |
| REQ-301 | Convergence loop audit trail | 2026-08-11 |
| REQ-303 | Scoped re-verification | 2026-08-11 |
| REQ-098 | Spec-driven update workflow | 2026-08-11 |

---

## Appendix F: Derived Test Catalogue

Each test cites its requirements; T29 verifies the traceability table mandate. Waivers
are allowed only under REQ-013. Tests keep their original numbering; identifiers T1, T2,
T6, T7, T11, T12, T14, T19, T24, T30, T34, T37, and T22a are retired and never reused.

Automated tests must ship a runnable script in the project directory
(`scripts/test_N.sh` or `scripts/test_N.ts`) that exercises the test and returns exit
code 0 on pass. Manual tests must document the verification procedure and expected output
shape in `DECISIONS.md`. The automated test scripts are exempt from the four-artifact
diet.

| #     | Type     | Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Requirements                                |
| ----- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| T3    | Manual   | Tool documentation complete; justification list matches registry; annotations match REQ-015 typing; each tool carries REQ-024 title; name uniqueness and schema validity per G0b (MCP conformance)                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | REQ-024, REQ-021                            |
| T4    | Automated | Search returns the expected section in the top 3 results for exact, prefix, and substring queries                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | REQ-012                                     |
| T5    | Manual   | Entity lifecycle end to end: create, field mutation, and deletion where the ruleset defines it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | REQ-020                                     |
| T8    | Automated | Every mutation and roll is audit-logged with all required fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | REQ-040                                     |
| T9    | Automated | Startup: Editor badge active — full access. `set_badge player`: Player badge active, in the story — GM tools blocked. `set_badge game_master`: GM badge active, in the story — full access restored. `set_badge none`: returns to the Editor badge, full access restored, Novel persists. Badge switches are audited; `set_badge` blocked during pending workflows (STATE_CONFLICT); undo stacks are badge-separate; Novel state survives restart; undo stack empty after restart                                                                                                                                                                                                                                                                                                                                                                                                                              | REQ-031, REQ-032, REQ-055, REQ-066         |
| T10   | Automated | Undo restores prior state, including entity data; audit log stays append-only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | REQ-041                                     |
| T13   | Automated | Truncation at limit with `output://` pointer; payload badge filtering (REQ-032), session isolation, oldest-first eviction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | REQ-004, REQ-032                            |
| T15   | Automated | `spec_health` reports confidence, convergence_summary, counts, coverage, defects, version; player filters GM-only items; game_master report unfiltered; expected values from Appendix B.2                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | REQ-025, REQ-010, REQ-011, REQ-015, REQ-032 |
| T16   | Automated | Rules index loads; anchor count matches structural pass; resource retrieval returns expected Markdown for major anchors; re-index twice and diff URI lists; `resources/list` stable across entity creation; entity, roster-record, and `output://` templates appear in `resources/templates/list`; resources declare REQ-022 media type and title                                                                                                                                                                                                                                                                                                        | REQ-022                                     |
| T17   | Automated | Ruleset drift after intake — simulated on a copy of the ruleset so T21's byte-identity holds — → stderr warning + `spec_health` flag                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | REQ-044                                     |
| T18   | Manual   | Anti-badge sub-workflows (§8)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | REQ-002, REQ-032                            |
| T20   | Automated | Path traversal and malformed input rejected; adversarial free-text stored and echoed verbatim as inert data in all surfaces, with no behavior change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | REQ-052, REQ-054                            |
| T21   | Automated | Original Markdown — and, where conversion applied (Appendix G), the original sources — byte-identical to intake hashes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | REQ-014                                     |
| T22   | Automated | Prompt registration: register a stub tool, restart — assert `prompts/get` output reflects it, each `prompts/get` returns exactly one user-role message, `prompts/list` carries a title on every prompt and a description on every argument, and the stub appears in all five prompts. Call all five prompts, then remove the stub and restart — assert absence from all.                                                                                                                                                                                                                                                                                                                                                         | REQ-023                                     |
| T23   | Automated | Performance benchmark per REQ-100: cold start ≤ tier threshold; query latency (mean of 5 representative lookups, one per category) ≤ 1 second; measurement environment recorded in DECISIONS.md (4); `spec_health` reports most recent measurement. | REQ-100 |
| T25   | Automated | Deletion drills on copies of the fixture, re-running discovery for each: **(i)** delete the Dice section — defect flagged, no roll tool appears, dependent tests waived with reasons logged in `DECISIONS.md`; **(ii)** delete the Confrontations section — defect flagged, no conflict tools appear, the conflict tools are waived under REQ-043's logged-reason clause, the Dangers section remains searchable                                                                                                                                                                                                                                                             | REQ-013, REQ-043                            |
| T26   | Manual   | Guidance items cited, confidence-labeled, attributed; GM-scoped items hidden from player; inferred-attribution items visible to all; `badge_briefing` differs per badge; badge foundations present in `badge_briefing`; Player briefing excludes GM-tagged foundations; Player read of `guidance://<gm-badge>` fails FORBIDDEN                                                                                                                                                                                                                                                                                                                                                                                                          | REQ-016, REQ-023, REQ-032, REQ-062          |
| T27   | Automated | RNG continuity across sessions and games under `TTRPG_SEED=7`; seed conflict warns and persists; seed stream position preserved during per-call override; witness values from Appendix B.4 (d6 and d20); default-seed-0 reproducibility when `TTRPG_SEED` is unset (two restarts without the env var produce identical event sequences for identical tool-call sequences)                                                                                                                                                                                                                                                                                                                                                                                                                                          | REQ-050, REQ-055                            |
| T28   | Manual   | Badge stories: MUST-covering set maps intent prompts to expected tools/resources; GM-targeting stories fail FORBIDDEN; each badge's stories achievable from visible registry; grounding verified at Discovery checkpoint                                                                                                                                                                                                                                                                                                                                                                                                                      | REQ-017, REQ-023, REQ-032                   |
| T29   | Automated | DECISIONS.md traceability table parses; every REQ in Appendix E appears exactly once; every cited test ID exists; waived tests cross-reference (5); every (5) waiver names defect and re-activation condition (REQ-013); re-run if (3) or (5) changes                                                                                                                                                                                                                                                                                                                                                                               | §9                                   |
| T31   | Automated | Novel isolation: entities invisible across Novels; roster baselines immutable; `import_character` creates fresh copy; `end_novel` discards Novel; roster survives; resuming ended Novel fails                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | REQ-055                                     |
| T32   | Manual   | Character creation matches ruleset: verify class, species, ability scores, HP, saves, skills, equipment, starting inventory; verify step-by-step mode presents stat assignment as a `[NEED_INPUT]` decision rather than auto-assigning; verify each ability score receives its own `[NEED_INPUT]` decision showing remaining unassigned values — no ability score is auto-assigned to a stat without player choice; verify `[NEED_INPUT]` options are display-label pairs with kebab-cased values and human-readable labels, `cancel` always last; verify RULESET_MODEL.md step enumeration matches the number of `[NEED_INPUT]` decisions produced; verify Novel-scoped enforcement — creation without active Novel returns `[STATE_CONFLICT]`; verify no ruleset-defined starting field is zeroed out; if leveling defined, verify class-table progression via REQ-056; verify §7.7 places pending workflow in the Novel tier, not Session tier; waived under REQ-013 if no advancement                                                                                                                                                                                                                                                                                                                                                                                                                                       | REQ-013, REQ-020, REQ-042, REQ-056, REQ-104, REQ-151, REQ-152, REQ-191          |
| T33   | Manual   | Combat resolution uses ruleset: attack with named weapon/spell via ruleset-specific and canonical lookup tools; damage dice, type, and properties match ruleset entry; miss/save produces ruleset outcome, no HP change; H5 automates live invocation; waived if no attack procedure                                                                                                                                                                                                                                                                                                                                                                     | REQ-013, REQ-020, REQ-043, REQ-057          |
| T35   | Automated | Fixture isolation: with the target ruleset (not the Appendix B fixture), verify that fixture-only tool names (`create_delver`, `roll_move`, `start_confrontation`) are absent from `tools/list`; when serving the fixture itself, verify they are present                                                                                                                                                                                                                                                                                                                                                                                                 | REQ-021, REQ-024                            |
| T36   | Automated | DECISIONS.md review: section (1) edition/title matches source; section (5) covers every hardcoded class, species, hit-dice, equipment, or spell table with waiver; missing waiver is failure                                                                                                                                                                                                                                                                                                                                                                                                                                                              | REQ-013, §9                                       |
| T38   | Manual   | Advancement workflow derives tool name from ruleset term; raises `[NEED_INPUT]` for open choices; applies progression server-side; waived if no advancement procedure                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | REQ-056, REQ-013, REQ-042                   |
| T39   | Automated | Canonical lookup tools registered: for each required category (equipment, spells, monsters, conditions, feats, class features, species, backgrounds as the ruleset requires), assert a `lookup_<category>` tool is in `tools/list`, accepts the canonical name and documented aliases, and returns the ruleset entry                                                                                                                                                                                                                                                                                                                                      | REQ-057, REQ-024                            |
| T40   | Automated | Lookup tool rejects unknown names: request a non-existent item and assert `[ERROR] [NOT_FOUND]` with session-visible valid values enumerated; if a close Levenshtein match exists (≤ 2), assert a "Did you mean?" hint appears before the enumeration; assert no fabricated entry is returned                                                                                                                                                                                                                                                                                                                                                                                                                                    | REQ-057, REQ-002                            |
| T39a  | Automated | Gameplay tool parameter validation: for each bounded-domain tool parameter documented in DECISIONS.md (5) (per REQ-182), call the tool with an unknown value — assert `[ERROR] [NOT_FOUND]` with session-visible valid values enumerated; confirm fuzzy-match hints appear for near-miss inputs. Call the same tool with a valid value from the documented domain — assert `[OK]`. For dice-resolution tools, assert the `[OK]` response includes transparent dice results (per REQ-003). | REQ-059, REQ-002, REQ-003, REQ-182 |
| T39b  | Automated | Live-index enumeration: add a new skill entry to the ruleset source, rebuild, call a skill-check tool with the new skill name and assert `[OK]`; remove a skill entry, rebuild, assert `[NOT_FOUND]` for the removed skill. Both enumerations reflect the live index — no hardcoded skill list produces stale values. | REQ-183 |
| T41   | Automated | No direct source reads: instrument the server or inspect handlers; run a tool call that resolves a canonical name and assert no ruleset Markdown file is read after startup indexing; the lookup tool must use the loaded index or model | REQ-058, REQ-051 |
| T42   | Automated | No tool-result fabrication: request a canonical item at the edge of the ruleset (last table row, ambiguous alias) and assert the result either resolves correctly or returns `[ERROR]`/`[PARTIAL]`; assert no invented mechanics, damage values, or properties appear                                                                                                                                                                                                                                                                                                                                                                                     | REQ-058, REQ-054                            |
| T43   | Automated | Decision auto-completion blocked: start a workflow that raises `[NEED_INPUT]` and verify the server does not emit a chosen option or complete the workflow without a `respond` call; a client or LLM must not supply a default                                                                                                                                                                                                                                                                                                                                                                                                                            | REQ-042, REQ-058                            |
| T44   | Automated | Player badge boundary: with `player` active, request GM-only content — returns `[ERROR] [FORBIDDEN]` or stripped response directing to `set_badge`; switch to `game_master` — same request succeeds; no hidden row revealed                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | REQ-032, REQ-058                            |
| T45   | Automated | spec_health threshold: assert overall confidence is at least 80% and MUST-action coverage is 100% after waivers; if the score is below threshold, assert the build stops and `DECISIONS.md` records a remediation plan                                                                                                                                                                                                                                                                                                                                                                                                                                    | REQ-025, REQ-011                            |
| T46   | Automated | Cross-file extraction: index both fixture files; assert gear table anchor exists; assert "Marshwise" row 4 collapsed to cross-reference, not a second entity; assert inline mechanical fields (Rusty Blade → 1d6 slashing) extract from table cells; assert `roll_on_table` for "gear" returns a valid row from the gear table. Assert `roll_on_table` with a fixed seed returns identical results; assert different seeds produce different results; assert GM-only table returns `[FORBIDDEN]` under Player badge. Waiver: may only be waived when the structural pass confirms the ruleset is a single source file; for multi-file rulesets T46 is mandatory — cross-file dedup is a structural requirement. Waiver ground: absent cross-file content (REQ-013), recorded in `DECISIONS.md` with the single-source-file evidence from the structural pass. | REQ-013         |
| T47   | Automated | Verbose output: every lookup tool returns full entry text, not a summary; combat results include every modifier with its contribution, the calculation path, and the outcome in prose; roll results report the result band when the ruleset defines one; roll results report all rolled faces with selected/discarded distinction when only a subset is selected (advantage, disadvantage, drop-lowest); modifiers are decomposed by source with signed per-source contributions, never collapsed to a bare aggregate; spell lookups return level, school, casting time, range, components, duration, description, and at-higher-level effects; monster lookups return full stat block including AC, HP, speed, ability scores, saves, skills, senses, traits, and actions; class lookups return hit dice, HP formula, proficiencies, features by level, and archetype paths; character creation and advancement results include all derived statistics alongside inputs (see REQ-181 for minimum output surface)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | REQ-060, REQ-003, REQ-043, REQ-181 |
| T48   | Automated | Source quoting: lookup results, search results, and rule-derived tool responses include a `---`-separated source block with `<file>#<anchor>` label and verbatim Markdown excerpt preserving original formatting; pure-state tools (undo, state queries, condition queries, audit reads) are exempt from the quote requirement                                                                                                                                                                                                                                                                                                                                                                       | REQ-061                                     |
| T49   | Manual   | Connection introduction: invoke the `intro` prompt on a running server and assert the output is ≤ 300 words, opens with the publisher's tagline (or server-name identification when ruleset-free), includes a dynamic sourcebook listing drawn from the live index (or world-model-only notice when ruleset-free), and ends with four concrete next actions; verify the `help` tool and `badge_briefing` each include a pointer to the `intro` prompt. Assert no ruleset-revealing content is visible to any badge (the intro is unfiltered by design)                                                                                                                                                                                                                                                                                              | REQ-063, REQ-023, REQ-024                   |
| T50   | Automated | Intro pointer consistency: invoke `help()` with no query on the running server and assert the output directs callers to the `intro` prompt; invoke `badge_briefing` for each badge (switch via `set_badge`: player, game_master) and assert each includes the intro pointer; invoke the `intro` prompt itself and assert it returns the full overview (same content regardless of badge)                                                                                                                                                                                                                                                                                                                     | REQ-063, REQ-023, REQ-032                   |
| T51   | Manual   | Badge behavioral boundaries: invoke a Player-badge session and assert the server does not prescribe world facts or narrative outcomes without Game Master confirmation; assert the server negotiates environmental details when the player asks whether elements exist. Invoke a Game-Master-badge session and assert the server describes situations and surfaces essential information without taking action or making decisions on behalf of the player. Sample output from both badges and verify the "describe richly, prescribe never" contract holds across tool responses. | REQ-064                                     |
| T461 | Automated | Badge boundary directive: invoke `badge_briefing` as Player — assert the boundary directive sentence ("You are in the story. Confine tool use and responses to the current Novel. To step away from the table, call `set_badge(\"none\")`.") appears after foundations and before anti-slop guidance. Invoke as Game Master — assert the same directive appears identically. Configure a small briefing budget — assert the directive is never truncated. | REQ-064, REQ-135 |
| T462 | Automated | Pending-update gate: advance a Minor or Major spec delta without advancing the implementation fingerprints — assert publication tooling blocks with a pending-update notice naming the server. Run the §6.7 update — assert fingerprints advance and publication succeeds. Assert a patch-class delta publishes without the notice. Assert an operator override recorded in DECISIONS.md lifts the block. Assert that when the spec repository and the deployed server are separate directories, the gate evaluates the deployed server tree, not the spec repo's own tree. | REQ-394 |
| T463 | Automated | Build entry point: invoke `build-ruleset` with no arguments — assert it prints usage and the install directory and exits 0. Invoke with a `slug=path` pair pointing at a dir without Markdown — assert a named failure and nonzero exit. | REQ-395a |
| T464 | Automated | Runbooks: assert Appendix V contains a runbook for each of Convert, Build, Synthesize, and Update, each naming an entry point, happy-path steps, and recovery steps; assert the reading guide (§0) references Appendix V. | REQ-395b |
| T465 | Automated | Deploy preservation: install a package, create a Novel and a codex entry, and record byte-for-byte hashes of the install directory and the user-data directory. Run a deploy step (git pull plus a clean of untracked files) — assert the install directory, installed package, and every Novel, roster, codex, server-note, and world-model entry are byte-for-byte identical afterward. Assert a deploy step whose git operations would delete or revert the install or user-data directory is rejected before any file is removed. Assert the default data directory does not resolve inside a git work tree. | REQ-396 |
| T466 | Automated | In-tree state guard: start a server inside a git work tree, create a Novel and a codex entry, then run `git clean -fdx` and `git reset --hard` — assert the Novel, codex, roster, server notes, and installed packages are byte-for-byte identical afterward. Assert a server that must place state in-tree reports `[state-in-tree]` in `spec_health` and on stderr at startup, and that the warning does not block startup. | REQ-397 |
| T467 | Automated | Two-repo propagation: advance a Minor spec delta in the specification repository without advancing the deployed server's fingerprints — assert publication tooling blocks with a pending-update notice. Run the §6.7 Update against the deployed server — assert fingerprints advance and publication succeeds. | REQ-398 |
| T468 | Automated | Ruleset-driven character creation: install a fixture ruleset that declares character-creation rules — species, classes, a formula-based derived statistic, starting equipment, and a step enumeration. Bind a Novel to it — assert `create_character` quick-mode returns the ruleset's derived statistic computed from its declared formula with the declared label, and assigned starting equipment with name, quantity, and source. Assert step-by-step mode produces exactly one `[NEED_INPUT]` per declared choice step in the declared order. On a Novel bound to a package with no character-creation rules — assert profile-only behavior with no stat block and a named error when classes are requested. Assert a derived-statistic formula referencing an undefined input yields a named creation error. | REQ-104, REQ-151, REQ-152, REQ-181, REQ-219, REQ-399 |
| T469 | Automated | State-Persistence Directive: invoke `badge_briefing` as GM — assert the orientation layer includes the persistence directive ("persist what you narrate") naming the state tools, and that it renders after the badge boundary directive and before anti-slop guidance. Configure a small briefing budget — assert the persistence directive is never truncated. | REQ-400, REQ-135 |
| T470 | Automated | State ledger token: create a Novel, perform scene and story mutations, invoke `badge_briefing` as GM — assert a `state_ledger` token renders the last state-mutation timestamp, per-group mutation counts for the session, and any active drift markers. Assert the token is never truncated under a small budget and is absent from the Player briefing. | REQ-401, REQ-135 |
| T471 | Automated | Session no-mutation: open a session (new `TTRPG_SESSION_ID`), make zero mutating calls, close the session — assert `spec_health` and `session_recap` surface a `[session-no-mutations]` marker naming the session; assert no tool is blocked by the marker. | REQ-402, REQ-237 |
| T472 | Automated | State-drift gate: set `gm_context` via `set_pause_context` with no intervening state mutation — assert `[state-drift]` appears in `spec_health`, `session_recap`, and the `state_ledger` token. With `TTRPG_STATE_GATE=warn`, assert session-close surfaces append a warning naming the uncommitted beats. With `TTRPG_STATE_GATE=block`, assert `set_pause_context`, `end_novel`, and `switch_novel` return `[STATE_CONFLICT]` while drift is active, and that a commit call clears the gate. With `TTRPG_STATE_GATE=off`, assert no blocking. | REQ-403 |
| T473 | Automated | Roll-to-commit: perform a significant roll without a following state mutation — assert `session_recap` flags `[uncommitted-roll]` naming the roll and suggested commit tool. Perform a significant roll followed by a state mutation — assert no flag. | REQ-404, REQ-174 |
| T474 | Automated | Auto-moment: with `auto_record` defaulting true, call `set_scene_state("The vault")` — assert a `moment` story journal entry is appended with scene anchor and timestamp. Call with `skip_transition_hook=true` — assert no auto-moment. Set the Novel `auto_record` false — assert `set_scene_state` appends no moment. | REQ-405, REQ-246, REQ-125 |
| T475 | Automated | Regression visibility: corrupt a Novel primary file, restart — assert backup restore succeeds and `spec_health` reports `[state-regression]` with an audit-entry-count and timestamp gap versus the corruption event. | REQ-406, REQ-092 |
| T476 | Automated | Persist-tools never-truncated: set scene type to social, invoke `badge_briefing` as GM — assert the scene-typed tool section includes the core state-persistence tools (scene, story journal, countdown, note, personality, NPC, and vow) regardless of scene type, and that a small budget never truncates them. | REQ-407, REQ-087, REQ-135 |
| T477 | Automated | Parameter ceiling: build a server and record the parameter ceiling in DECISIONS.md — assert no `tools/list` schema exceeds the ceiling; assert `spec_health` exposes per-tool parameter counts; assert a tool whose operation needs more inputs splits into a compact entry call plus a refinement path rather than inflating one schema. | REQ-408 |
| T478 | Automated | Response-lean enumeration: call a collection tool (e.g., `list_npcs`) — assert summary entries by default; request detail — assert full entries returned with no intervening state mutation. Call a lookup (e.g., `lookup_spell`) under the default — assert the full REQ-060 entry, not a summary. Assert `spec_health` reports the active enumeration verbosity. | REQ-409, REQ-060, REQ-253 |
| T479 | Automated | Token footprint: after a Standard-tier build, assert DECISIONS.md (4) records the aggregate default-listing byte size (REQ-392) and prompt-budget consumption (REQ-118) alongside cold-start and latency figures; assert `spec_health` reports the same values as the most recent measurement; assert a build missing the footprint record fails the H10 handoff gate. | REQ-410, REQ-100, REQ-392, REQ-118 |
| T480 | Automated | Stable-metadata caching: read a tool schema or prompt scaffold twice — assert the second read returns the cached entry (no recompute); mutate a registration — assert the cache invalidates and the next read reflects it; assert outputs are identical cached or not and `spec_health` reports cache coverage. | REQ-411, REQ-023b, REQ-025 |
| T481 | Automated | Oracle player access: call `ask_oracle("Is there a guard behind the door?", "50_50", seed="42")` under the Player badge — assert returns `[YES]`, `[NO]`, `[EXCEPTIONAL_YES]`, or `[EXCEPTIONAL_NO]`. Call under the Game Master badge — assert succeeds. Assert no badge returns `[FORBIDDEN]` for `ask_oracle`. | REQ-291 |
| T482 | Automated | Turn-handoff directive: invoke `badge_briefing` under the GM role with a Player badge active — assert orientation includes the turn-handoff directive instructing the narrator to close each turn by inviting the player's next action in plain English. Invoke with `TTRPG_AI_ROLE=game_master` and a Player badge — assert the directive is present. Invoke `badge_briefing` with the AI in the Player role (human GM) — assert the directive instructs handing initiative back to the human Game Master. Assert the directive renders under a small briefing budget (never truncation per REQ-135). | REQ-412, REQ-304 |
| T483 | Automated | Safety escalation advisory: call `set_autonomy({safety: "moderate"})` from a Novel currently at `safety=safe` — assert the escalation advisory surfaces and requires confirmation before the tier applies. Declining — assert `safe` remains active. Confirming via `respond` — assert `moderate` applies. Assert re-raising to the same tier in the same Novel does not re-surface the advisory. | REQ-306 |
| T484 | Automated | Creativity tier mapping: build a server — assert DECISIONS.md (4) records distinct configurations for the `predictable`, `standard`, and `chaotic` tiers. Assert `spec_health` reports the tier mapping. Assert the `standard` tier configuration is not identified as an unmodified platform sampling default unless recorded as such. | REQ-306 |
| T485 | Automated | Autonomy launch preset: start a server with `TTRPG_AUTONOMY=mechanical_prompt,prompt,safe,standard` — assert a newly created Novel defaults its autonomy sliders to those values before any `set_autonomy` call. Call `set_autonomy({safety: "hardcore"})` — assert the per-Novel override applies and persists across restart. Start without `TTRPG_AUTONOMY` — assert sliders default to `mechanical_prompt`, `prompt`, `safe`, `standard`. | REQ-306 |
| T52   | Automated | Build fingerprint: build server, create state (character, Novel entities), record fingerprint. Modify a copy of the ruleset to add/remove an entity field, rebuild, restart: (1) fingerprint mismatch warning on stderr, (2) state loads without error, (3) roster baselines unchanged, (4) `spec_health` reports mismatch status. Attempt to load structurally corrupted state — verify the server reports unrecoverable state and does not silently discard. Waived if the ruleset has no mutable state (no entities, no roster). | REQ-065                                     |
| T224  | Automated | Startup drift comparison: build a server with a known ruleset, record the fingerprint. Modify a ruleset file, restart — assert spec_health reports [ruleset-drift] with stored and current hashes, assert stderr carries matching warning. Modify the embedded holonovel.md, restart — assert spec_health reports [spec-drift]. Modify the installed holonovel package version (e.g., symlink a newer version of the package) and restart — assert spec_health reports [holonovel-drift] with stored and current versions. Revert both changes — assert no drift warnings. Assert drift detection does not block startup or novel resume. Assert a fresh start with no stored fingerprint produces no drift warnings. | REQ-065, REQ-014 |
| T226  | Automated | Spec content hash: compute SHA-256 of the embedded `holonovel.md` in the server directory — assert it matches `state.buildFingerprint.specHash`. Modify one character of the embedded spec file — restart, assert drift warning on stderr and `spec_health.spec_hash_current: false`. Restore the original file — restart, assert warning clears and `spec_hash_current: true`. | REQ-187 |
| T53   | Automated | Session recap: invoke `session_recap` after a combat session, assert the summary includes entities with final HP and conditions, combat outcomes, scene state, active lore entries with trigger status, narrative directive, current scene type, and last scene state transitions. Assert entity status reports "alive" when HP > 0, "unconscious" at HP = 0, "dead" when death condition active. Assert all 14 named fields present with typed values. Call `session_recap(max_transitions=2, max_rolls=3)` — assert at most 2 transitions and 3 rolls. Call `session_recap(max_transitions=0)` — assert `[ERROR] [INVALID_INPUT]`. Invoke as Player badge — assert only own-entity data appears and narrative elements are badge-filtered. Invoke as Game Master — assert all entity data and narrative elements appear.                                                                                                                                                                                                                                                                                                                                                                                                             | REQ-072, REQ-032, REQ-174, REQ-175          |
| T54   | Automated | Countdowns: set a `round` countdown (5 ticks), run 3 combat rounds, assert remaining ticks = 2. Set a `narrative` countdown (3 ticks), advance twice manually, assert remaining = 1. Advance again — assert countdown fires and is removed from active countdowns but present in audit log.                                                                                                                                                                                                                                                                                                                                                                                                            | REQ-073                                     |
| T55   | Automated | Multi-entity: create two entities, import both into a Novel, assert `entities://` lists both. Switch active entity via `set_active_entity`, assert mutating tools target the active entity. Verify `party://current` lists all player entities with summary stats.                                                                                                                                                                                                                                                                                                                                                                                                                                       | REQ-074                                     |
| T56   | Automated | Named-NPC: create an NPC with partial stats (only name + Grit), verify at `npc://<id>`. Include NPC in a confrontation — assert NPC gets a turn. Update NPC stats, verify changes persist across connection restart. Update NPC with a stat field not previously set — assert field is added and persists across restart.                                                                                                                                                                                                                                                                                                                                                                                                                                              | REQ-075, REQ-043                            |
| T57   | Automated | Scene state: set scene state, verify it appears in `scene://current` and `badge_briefing`. Update scene state, verify old entry in audit log and new entry as current. Attempt `set_scene_state` as Player badge — assert `[FORBIDDEN]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                         | REQ-076, REQ-032                            |
| T58   | Automated | Entity personality: create a character, set personality fields, verify they appear in `badge_briefing` and `entity://<id>/personality`. Set Novel-level overrides — assert they replace roster baseline in `badge_briefing` for that Novel. Verify mechanical stats remain immutable (baseline unchanged).                                                                                                                                                                                                                                                                                                                                                                                         | REQ-077                                     |
| T59   | Automated | Adventure load: load an adventure, verify `adventure://<slug>/<anchor>` resources are retrievable. Assert `*Keeper only*` sections return content for Game Master badge and are hidden from Player badge. Assert `search_rules` with a query matching a section heading assigns HIGH confidence; matching body text assigns MEDIUM confidence. Assert each result line begins with a bracketed confidence label matching the query-token location rule. Assert `[generated]` tag does not affect sort order.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | REQ-079, REQ-032                            |
| T60   | Automated | Adventure isolation: load adventure A, create NPCs from its text. Load adventure B via `load_adventure`. Assert adventure A's NPCs persist as Novel entities but adventure A's content no longer appears in `badge_briefing`. Verify no content leak between adventures.                                                                                                                                                                                                                                                                                                                                                                                                                              | REQ-079                                     |
| T61   | Automated | Adventure continuity: load adventure, create NPCs, set scene state within the adventure. Restart the server with the same `TTRPG_NOVEL`. Assert the active adventure, NPCs, and scene state are restored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | REQ-079, REQ-055                            |
| T62   | Automated | Help and tool discovery: invoke `help()` with no query — assert output includes a categorized task map and all registered tools. Invoke `help("combat")` — assert results include combat tools. Invoke as Player badge — assert GM-only tools are not listed.                                                                                                                                                                                                                                                                                                                                                                                                                                       | REQ-067, REQ-032                            |
| T63   | Automated | Synthesis boundaries: run synthesize, diff entity stat fields (stats/saves/HP) before and after — assert no changes. Diff `tools/list` — assert no changes. Assert all voice_examples, lore templates, and action patterns carry `[supplementary]` tag. Assert all six synthesis output modules (§11.1) are populated with non-empty content. Re-run synthesize — assert idempotent. Switch to player badge — assert GM-scoped enrich content hidden.                                                                                                                                                                                                                                                                                                                     | REQ-080, REQ-077, REQ-032                   |
| T64   | Automated | Narrative directive: set directive, verify it appears in GM `badge_briefing` and is absent from Player `badge_briefing`. Clear directive, verify absent from both. Player attempt to set returns `[FORBIDDEN]`. Restart connection, verify directive persists.                                                                                                                                                                                                                                                                                                                                                                                                                              | REQ-081, REQ-032                            |
| T65   | Automated | Entity voice examples: set voice_examples, verify they appear in `entity://<id>/personality` and `badge_briefing` tagged `[supplementary]` when enrich-sourced. Set Novel-level overrides — assert they replace roster baseline for that Novel. Verify mechanical stats remain immutable. Player attempt on another player's entity returns `[FORBIDDEN]`.                                                                                                                                                                                                                                                                                                                                            | REQ-077, REQ-032                            |
| T66   | Automated | Prompt section ordering: set custom order, invoke `badge_briefing` for GM — assert sections appear in specified order. Omit a section token — assert section absent from briefing. Set empty array — assert builder default order restored. Unknown token — assert `[ERROR] [INVALID_INPUT]` with valid token list. Token for absent ruleset feature accepted (empty section). Player attempt returns `[FORBIDDEN]`. Restart — verify ordering persists.                                                                                                                                                                                                                                              | REQ-082, REQ-032                            |
| T67   | Automated | Dynamic lore: create lore entry with trigger "vault". Set scene_state containing "vault" — assert entry in GM `badge_briefing`. Change scene_state without trigger — assert entry deactivated. Create GM-only lore entry — switch to Player, assert GM-only entry hidden, shared entry visible. Remove entry — assert absent. Player create attempt returns `[FORBIDDEN]`.                                                                                                                                                                                                                                                                                                                           | REQ-083, REQ-032                            |
| T68   | Automated | Action suggestions: call `suggest_actions("I want to attack")` in combat context — assert results include combat tools with correct tool names and parameter hints. Call with empty intent — assert context-relevant suggestions based on scene type and entity state. Call with nonsense intent — assert empty list (no tool matches). Verify no GM-only tools in Player results. Call with ambiguous social intent ("I want to convince the guard") — assert multiple plausible tools returned. With enrich and toggle activated, call an intent matching an enrich-derived pattern — assert that pattern's tools appear in results alongside registry matches.                                                                                                                                                                                                  | REQ-084, REQ-032                            |
| T69   | Automated | Macro system: set scene_state, create entity with known stats, set countdown. Call a tool whose output contains `{{scene.current}}`, `{{entity.name}}`, `{{countdown.foo.remaining}}`. Assert output contains expanded values, not macro tokens. Reference nonexistent `{{nope.field}}` — assert literal text unchanged. Read audit log entry containing macro tokens — assert tokens NOT expanded.                                                                                                                                                                                                                                                                                              | REQ-085                                     |
| T70   | Automated | Audit compression: run several mutations (advance combat, apply condition). Call `compress_audit(3)` — assert output contains Markdown header "Compressed audit log (summarize into a single paragraph):" followed by per-entry lines in format `[timestamp] [badge] tool_name — output_prefix`. Assert forbidden-call entries carry `[BOUNDARY_VIOLATION]` prefix. Switch to Player badge — assert entries affecting a player-owned entity are visible even when the recorded badge is `game_master`. Verify audit log is unchanged (REQ-040). Call with 0 — assert `[ERROR] [INVALID_INPUT]`.                                                                                                                                                                                                                                                                                                                                                                                          | REQ-086, REQ-032, REQ-040                   |
| T71   | Automated | Scene type tagging: set scene type to "social" — assert GM `badge_briefing` prioritizes social tools in registry section. Call `suggest_actions("talk")` — assert social actions appear. Call `init_combat` — assert combat tools prioritized in `badge_briefing` regardless of scene type. Set to unknown type — assert `[ERROR] [NOT_FOUND]` with valid values enumerated. Player attempt returns `[FORBIDDEN]`. Restart — verify type persists.                                                                                                                                                                                                                                                                                                     | REQ-087, REQ-032                            |
| T72   | Automated | Novel lifecycle: create Novel, assert state file on disk at `.holonovel-state/novels/<slug>.json`. Restart server with same `TTRPG_NOVEL`, assert state restored (entities, NPCs, scene). `end_novel`, assert file removed from disk. Resume ended Novel → `[STATE_CONFLICT]`. Create Novel with duplicate slug → `[STATE_CONFLICT]`. Server start without `TTRPG_NOVEL` — Novel-scoped tools return `[STATE_CONFLICT]`. This test reads the on-disk state format — it verifies REQ-092's format contract (verification workflow G4). Pattern Buffer sub-workflows (G5) verify the same state-survival behaviors through tool-observable surfaces. See §6.6 Verification principle.                                                                                                                                                                                                                                                                                   | REQ-088, REQ-092                            |
| T73   | Automated | Novel isolation: create Novel A with entities. Create Novel B — assert Novel A's entities not visible via `entities://`. Resume Novel A — assert entities restored. Generated adventure content scoped to the Novel that generated it.                                                                                                                                                                                                                                                                                                                                                                                                                                                              | REQ-088, REQ-074, REQ-090                   |
| T74   | Manual   | Novel setup: invoke `novel_setup` prompt on a fresh Novel. Assert output presents three sequential steps (characters, story source, session zero) with visual completion markers `[✓]`, `[→]`, and `[ ]`. Assert step descriptions use conversational plain English — a prompt for action, not a static list. Create a character — assert characters step marked `[✓]`. Load an adventure — assert story source step marked `[✓]`. Run session zero — assert session zero step marked `[✓]` and next-steps summary appears after completion. Verify metadata in `badge_briefing` under `novel` token. | REQ-089                                     |
| T75   | Automated | Adventure generation: call `generate_adventure("A haunted space station")`. Assert output contains title, Overview (GM-only), Adventure Hook, 2–6 locations, NPC entries. Assert generated content retrievable at `adventure://<slug>/<anchor>`. Assert GM-only sections hidden from Player. Assert appears in `search_rules` results. Regenerate — assert old content replaced.                                                                                                                                                                                                                                                                                                                       | REQ-090, REQ-032                            |
| T76   | Automated | Enhanced encounters: call `generate_encounter("dark alley")`. Assert output creates a scene_state entry, an NPC, and a lore entry — all snapshot-able. Call without context — assert generates from ruleset tables. Undo — assert all three artifacts removed (single undo). Player attempt → `[FORBIDDEN]`.                                                                                                                                                                                                                                                                                                                                                                                           | REQ-091, REQ-041, REQ-032                   |
| T77   | Automated | Novel persistence: create Novel, populate state (entity, NPC, scene, countdown, lore, adventure). Restart server — assert all state tiers restored. Modify the entity model (add/remove a field), rebuild, resume — assert graceful load (no errors, missing fields get defaults, extra fields preserved). Corrupt the on-disk JSON — assert stderr warning and `spec_health` flag.                                                                                                                                                                                                                                                                                                                  | REQ-092, REQ-065                            |
| T78   | Automated | Novel metadata: create two Novels (A and B). Resume A — assert `spec_health` lists both Novels on disk, marks A as active. Verify Novel metadata in `badge_briefing` under `novel` token includes entity count, adventure source, and setup-completion flags.                                                                                                                                                                                                                                                                                                                                                                                                                                       | REQ-093                                     |
| T79   | Automated | Extended lore lifecycle: create two lore entries with priority 100 and 10, both triggered — assert priority-100 entry appears first in `badge_briefing` lore section. Set sticky on one entry, trigger it, advance scene state without trigger — assert the entry persists for the sticky duration then deactivates. Disable an active entry — assert it disappears from `badge_briefing` but remains at `lore://<key>`. Re-enable it — assert reactivation. Disabled entries do not trigger. Player badge attempts on enable/disable return `[FORBIDDEN]`. Undo a sticky refresh — assert sticky count restored.                                                                                                                                                                                                                                                                                  | REQ-083, REQ-041, REQ-032                   |
| T80   | Automated | Lorebook export/import: create 3 lore entries with varied metadata. Export as JSON — assert output includes all Appendix L metadata fields; verify mechanical fields absent. Export as Markdown — assert Appendix L format. Re-export — assert idempotent. Import with "dry-run" — assert preview and collision report; state unchanged. Import with "replace" — assert lore tier replaced. Import with "merge" 2 entries (1 new key, 1 duplicate) — assert new entry added, existing entry preserved unmodified, operation reports 1 added, 1 skipped. Player attempt → `[FORBIDDEN]`.                                                                                                                                                                                                                                                                                                          | REQ-094, REQ-032                            |
| T81   | Automated | Lore grouping: group entries under named groups. Assert `lore://groups` lists groups with correct members. Assign an entry to a new group — assert it leaves the old group. Ungroup an entry — assert it no longer appears in any group. Player attempt → `[FORBIDDEN]`.                                                                                                                                                                                                                                                                                                                                                                                                        | REQ-083, REQ-032                            |
| T82   | Automated | Lore suggestion: run synthesize (or seed mock templates), call `suggest_lore` with and without scene text — assert up to 5 matching templates returned with key, content preview, triggers, confidence, and source_url. Call `suggest_lore()` with no enrich run — assert empty list with enrich guidance note. Verify no template fabrication. Switch to Player — assert GM-scoped templates excluded. Switch to GM — assert `suggest_lore` returns templates of all `badge_scope` values (game_master, shared, and any player-scoped templates).                                                                                                                                                                                                                                                                                                                                        | REQ-083, REQ-032, REQ-080                   |
| T83   | Automated | Lore entry budget: configure a token budget for triggered lore entries in badge_briefing via the builder's configuration mechanism. Create enough triggered lore entries to exceed the budget. Assert badge_briefing lore section respects the configured budget — only entries that fit the budget appear. Assert spec_health reports budget consumption and entries omitted. Assert the budget is adjustable at runtime. Assert all triggered entries appear when the budget is removed or set above the entry count.                                                                                                                                                                                                                                                                                                                                                                                    | REQ-083                                     |
| T299  | Automated | Sticky counter decay: create lore entry with `sticky: 3` and trigger "vault". Set scene_state containing "vault" — assert entry triggered in `badge_briefing`. Set scene_state without "vault" — assert entry's sticky counter decrements by 1 (call `badge_briefing` twice on same scene — assert counter unchanged). After 3 scene changes to non-triggering scenes, assert entry no longer appears in `badge_briefing` lore section. Revert scene back to "vault" — assert sticky counter resets to 3 and entry reappears.                                                                                                                                                                                                                                                                                                                                                                                    | REQ-155                                    |
| T84   | Manual   | Spec-driven update: perform a spec comparison audit of the server against this specification. Assert DECISIONS.md contains a dated entry listing all gaps with dispositions (implemented / deferred / waived) with each gap citing its relevant REQ and disposition reason. Assert `spec_health` includes `last_spec_review` and `last_pattern_buffer` fields populated with ISO dates. Assert the Pattern Buffer rerun passes all blocking sub-workflows for any gap-audit-implemented changes. Assert any previously-unimplemented Pattern Buffer sub-workflows from §6.6 are now implemented.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | REQ-098                                     |
| T86   | Manual   | Confidence-floor acknowledgment: induce or simulate a sub-80% confidence build (Light tier sub-85%, Standard sub-80%, Heavy sub-75%, Huge sub-70%). Assert DECISIONS.md (5) contains the operator-approval field with the adjusted threshold and justification. Assert the build does not proceed past the convergence loop without the approval. Provide approval — assert the build proceeds.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | REQ-099                                     |
| T87   | Automated | Performance benchmark: measure cold-start time and query latency per REQ-100. Assert measured cold-start ≤ tier threshold. Assert query latency (mean of 5 representative lookups) ≤ 1 second. Assert individual per-category latencies recorded in DECISIONS.md (4). Assert measurements recorded in DECISIONS.md (4) and `spec_health`. | REQ-100 |
| T88   | Automated | Atomic writes: create a Novel, trigger a mutation, assert `<slug>.json.bak` exists alongside `<slug>.json`. Corrupt the primary file — assert server emits stderr warning and loads from backup or reports corruption in `spec_health`. Assert `end_novel` removes both the primary and backup files.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | REQ-092                                     |
| T89   | Manual   | Assumption audit trail: invoke the `assumption_audit` prompt against the current spec revision. Assert DECISIONS.md (0) contains at least one challenged assumption per category (technology, AI-as-builder, extraction, MCP, state, verification, build process, runtime, spec process). For a spec revision, assert a diff-only audit covering changed assumptions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | REQ-101                                     |
| T90   | Manual   | Complex fixture verification workflow: build a server from the Appendix N fixture, replay the N.3 transcript. Assert all behavioral contracts (Appendix O) hold: status prefixes, dice transparency, roll values per N.4 witness table, combat turn resolution, condition lifecycle, countdown auto-decrement, session_recap, undo correctness, and badge enforcement. Required for rulesets at REQ-100 tiers Standard, Heavy, Huge (≥100 indexed items).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | REQ-001, REQ-032, REQ-041, REQ-043, REQ-072, REQ-073, REQ-050                                   |
| T91   | Manual   | Appendix O spot-check: invoke one tool from each behavioral contract category (O.1–O.8) on the running server and assert the output shape matches the category's documented contract. This is a lightweight cross-check — the individual behaviors are verified by automated tests; this confirms the output contracts are mutually consistent.                                                                                                                                                                                                                                                                                                                                                                                    | REQ-001, REQ-012, REQ-043, REQ-041, REQ-032                                   |
| T92   | Automated | Alternative tech stack: build a server in a non-TypeScript language. Assert all verification workflows pass and the full Pattern Buffer passes. Assert alternative stack recorded with justification in DECISIONS.md (2). Waived if the builder uses only TypeScript.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | REQ-101 (via §4)                            |
| T93   | Manual   | Source conversion: verify DECISIONS.md (2) records converter and version; (6) records fidelity rate per content type ≥ 90%; (5) records artifact dispositions for all flagged artifacts. Assert `spec_health` includes `conversionFidelity` section with per-content-type rates, overall rate, sample set, unresolved ambiguities, and confidence cap counts. Assert REQ-011 confidence capping for converted sections below threshold. Assert Appendix H.19 (converted table match) passes for sampled tables. When conversion is not selected, T93 is waived.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | REQ-102, REQ-011, REQ-025                   |
| T94   | Automated | Enrichment reversion: run synthesize, verify 6 modules populated. Call `revert_synthesis` — assert all synthesis resource URIs (`synthesis://voice_examples`, `synthesis://briefing_order`, `synthesis://action_patterns`, `synthesis://adventure_advice`) return empty or absent; `lore://templates` returns only Novel-scoped entries, synthesis state removed, mechanical fields unchanged, `[ruleset]` content unchanged, DECISIONS.md synthesis evidence retained, GM-configured briefing_order and action_patterns_enabled survive reversion unchanged. Re-run synthesize — assert repopulation succeeds. Player badge attempt returns `[FORBIDDEN]`. Assert enrichment briefing_order tokens are a subset of `spec_health.section_tokens`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | REQ-103, REQ-080, REQ-185                            |
| T95   | Automated | LOW-confidence tagging: run synthesize with LOW items present. Inspect `badge_briefing` and synthesis resources — assert every LOW-confidence item carries `[LOW]` tag distinct from `[supplementary]`. Assert LOW items appear after HIGH/MEDIUM items within their module section. Assert HIGH/MEDIUM items do not carry `[LOW]` tag.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | REQ-080                                     |
| T96   | Automated | Action pattern inertness: run synthesize. Assert `suggest_actions(intent)` does not return enrich-derived patterns while the action pattern toggle (REQ-115) is disabled. Activate patterns via `toggle_action_patterns` — assert patterns appear in results for matching intents. Deactivate via `toggle_action_patterns` — assert patterns excluded again. GM-only tool patterns excluded from Player results whether activated or not. Player badge attempt on `toggle_action_patterns` returns `[ERROR] [FORBIDDEN]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                      | REQ-084                                     |
| T97   | Automated | Enrichment collected_at: run synthesize. Inspect every item in all seven output modules — assert `collected_at` is present, non-empty, valid ISO 8601, and within ±1 minute of current time.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | REQ-080                                     |
| T98   | Automated | Novel switching: create two Novels (A and B) with distinct state. Switch from A to B via `switch_novel` — assert B's state restored independently. Switch back to A — assert A's state unchanged. Assert `switch_novel` with non-existent slug returns `[STATE_CONFLICT]`. Assert switching to ended Novel returns `[STATE_CONFLICT]`. Assert two connections with different active Novels operate independently. Verify badge state restores per Novel on switch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | REQ-095, REQ-088, REQ-055                   |
| T99   | Automated | Novel metadata enrichment: create a Novel with entities, play through 3 sessions with distinct `TTRPG_SESSION_ID` values, run combat rounds. Assert `spec_health` and `badge_briefing` report session count, cumulative play time, last-active scene anchor, current combat round, and total combat rounds played. Assert metadata appears under the `novel` section token in `badge_briefing`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | REQ-093                                     |
| T100  | Automated | Novel interchange: create a populated Novel with entities, NPCs, scene, countdowns, lore, and combat state. Export as JSON — assert output matches Appendix Q schema. Assert exported audit_log contains all entries with full structure per REQ-040 entry format (not a truncated preview). Import as `dry-run` — assert preview and no side effects. Import as `replace` — assert state matches exported data. Import as `merge` — assert entities and NPCs added, duplicates skipped. Verify round-trip: export → import → export produces identical output. Player badge attempts return `[FORBIDDEN]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | REQ-096, REQ-032, REQ-040, REQ-168          |
| T101  | Automated | Novel health: populate a Novel to near-limit thresholds (NPCs, lore entries, snapshots, file size approaching 4 MB). Assert `spec_health` reports warnings for each threshold and `healthy` reports false. Remove items to clear thresholds — assert `healthy` reports true. Assert Player badge sees entity-level health only; GM sees all.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | REQ-097, REQ-032                            |
| T102  | Automated | Synthesis staleness: populate enrichment with `collected_at` timestamps past `TTRPG_SYNTHESIS_STALE_DAYS`. Assert `[stale]` flag in `spec_health` for inactive items. Assert stale items excluded from enrichment resource surfaces. Activate one stale item — assert flag cleared. Re-run synthesize — assert all timestamps refreshed and stale flags removed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | REQ-080                                     |
| T103  | Automated | Character creation undo: create a character via step-by-step workflow and via quick mode. Call `undo` after each — assert roster returns to pre-creation state and the entity is no longer accessible. Assert undo blocked during pending `[NEED_INPUT]`. Assert empty undo stack returns `[STATE_CONFLICT]`.                                                                                                                                                                                                                                                                                                                                                                                                                                       | REQ-041, REQ-104                            |
| T104  | Automated | Spec resource: call `resources/read` on `spec://build` — assert full spec text returned as Markdown. Assert `spec://build` appears in `resources/list`. Switch to Player badge — assert `[FORBIDDEN]`. Compare embedded copy against the builder's copy — assert content hash matches DECISIONS.md (1).                                                                                                                                                                                                                                                                                                                                                                                           | REQ-105, REQ-032                            |
| T105  | Automated | Spec repository URL: assert `spec_health` output contains `spec_repo_url` field matching the intake value from DECISIONS.md. Assert `intro` prompt includes the URL. Assert URL is present for both Game Master and Player badges. Modify the URL in DECISIONS.md, rebuild — assert new URL reflected in both surfaces.                                                                                                                                                                                                                                                                                                                                                                                                                  | REQ-106                                     |
| T106  | Automated | Version coordination: assert `spec_health` output contains `spec_version` field matching the version in DECISIONS.md §2 Pinned Versions. Assert `spec_version` is a CalVer date-stamp (YYYY.MM.DD format). Assert the version matches the root `package.json` version. Modify the spec version in DECISIONS.md without changing other state — assert `spec_health` reports the new version. Assert Player badge sees the field with no elevation of privilege. Upload a spec with the same version as the server — assert gap audit reports "current" and exits without mutation.                                                                                                                                                                                                                                                                                                                                                                                              | REQ-107, REQ-098                            |
| T107  | Automated | Pattern Buffer traceability: after a full Pattern Buffer run, assert DECISIONS.md (6) contains a sub-workflow-to-REQ mapping covering every REQ in §5.5 (Badges and Access), §5.6 (State and Lifecycle), §5.7 (Determinism, Safety, and Performance), and REQ-002 (Error taxonomy). Assert each covered REQ maps to at least one sub-workflow. Assert no sub-workflow maps to a REQ outside the covered sections. Add a stub REQ to §5.5 and rebuild via spec-driven update (REQ-098) — assert a gap finding is logged in DECISIONS.md (5).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | REQ-108                                     |
| T108  | Automated | Badge precedence: activate GM badge in Novel A, set `TTRPG_BADGE=player`, resume Novel A — assert GM badge active (Novel persisted state wins). Create Novel B without activating badge, resume B with `TTRPG_BADGE=player` — assert player badge active (env var applied to Novel with no persisted badge). `switch_novel(B)` → `switch_novel(A)` — assert each Novel restores its own persisted badge independently.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | REQ-055                                     |
| T109  | Automated | Badge briefing mandatory groups: create a Novel with entity, NPC, countdowns, lore entries, scene state, narrative directive, adventure content, and active combat state (init_combat). Invoke `badge_briefing` as GM — assert all 16 groups from REQ-109 present including combat state (round, turn order, current participant). Assert decision-critical groups (scene state, entities, combat state, triggered lore, active NPCs, active countdowns) precede the section boundary and supplementary groups follow. Invoke as Player — assert GM-only groups excluded and all player-visible groups present. End combat — assert combat group omitted. Remove entities — assert entity group omitted. Clear scene state — assert group shows empty-state marker.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | REQ-109, REQ-032                            |
| T110  | Automated | Combat state lifecycle: create a Novel with 2 entities (equal initiative), 1 NPC, 1 danger. Call `init_combat` — assert turn order follows entity > NPC > danger then alphabetical by name. Assert `badge_briefing` (GM) includes combat state group (round, turn order, current participant). Advance combat through one full round — assert briefing reflects updated round and current participant. End combat — assert briefing omits combat group, `spec_health` reports total combat rounds incremented by rounds played. Switch to Player badge — assert combat state group visible (entity turn positions only). | REQ-043, REQ-093, REQ-109, REQ-032         |
| T111  | Automated | RNG seed isolation: per-call seed override does not advance session PRNG position — after override, the next session-seeded draw matches the sequence the session would have produced without the override. Assert d20 witness values from Appendix B.4 column 2 reproduce exactly under the LCG formula. Assert `create_character(stat_method="roll_4d6", seed="42")` produces identical stat arrays on two separate server restarts and does not advance the session PRNG position.                                                                                                                                                                                                                                                                                                                                       | REQ-050                                     |
| T112  | Automated | Scene history: call `set_scene_state("forest clearing")`, then `set_scene_state("dark cavern")`. Assert `scene://current` returns the most recent. Call `resources/read` on `scene://history` — assert all timestamped entries returned in chronological order with descriptions. Assert Player badge sees only non-GM-specific scene descriptions.                                                                                                                                                                                                                                                    | REQ-076, REQ-032                            |
| T113  | Automated | Tool surface consolidation: invoke `tools/list` and assert no two registered tools share an identical parameter schema differentiated only by a category enum. For each canonical content category, assert the lookup mechanism returns equivalent output shapes. When the builder determines categories share a retrieval pattern, assert they are exposed as a single parameterized tool whose parameter description documents the valid categories.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | REQ-110                                     |
| T114  | Automated | Search result quality: search for a term appearing in multiple sections with different relevance — assert the most relevant section appears first. Search for a term with many matches beyond the display limit — assert suppressed-result count appears. Search for a single-match term — assert match context includes surrounding text, not just the anchor link. Search for a term that does not appear — assert zero results with no suppressed-result count.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | REQ-111                                     |
| T115  | Automated | Cross-reference discovery: lookup a spell that references a condition (e.g., a spell that applies Blinded) — assert result includes a pointer to the condition's anchor and a one-line description of the relationship. Lookup a monster that references a spell — assert pointer to spell. Lookup a ruleset entry with no cross-references — assert no pointer section appears. Assert pointers are index references, not inline full recursive expansions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | REQ-112                                     |
| T116  | Automated | Result count reporting: search for a term with exactly 3 matches and a display or segment limit of 1 — assert output reports returned count of 1 and total count of 3. Search with a segment size larger than the match count — assert returned equals total. Call a tool that returns a collection — assert both returned and total counts appear in the output.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | REQ-113                                     |
| T117  | Automated | Suggestion coverage: assert RULESET_MODEL.md contains a curated intent set with derivation citations spanning all ruleset-defined action categories identified during discovery. For each intent in the set, assert `suggest_actions(intent)` returns at least one matching registered tool. Assert the coverage percentage (matching intents ÷ total curated set) is recorded in RULESET_MODEL.md. Assert coverage below 80% produces a DECISIONS.md (5) finding that names the uncovered categories.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | REQ-114                                     |
| T118  | Automated | Help category override: as GM, reassign a tool from its builder-assigned category to a user-defined category via the Novel-scoped mapping. Call `help()` — assert tool appears under the user-defined category and is absent from the builder-assigned category. Reset mapping to empty — assert builder-assigned categories restored. Switch to Player badge — assert builder-assigned categories appear unchanged. Attempt reassignment of an unknown tool name — assert `[ERROR] [NOT_FOUND]` with valid tool names enumerated. Player badge attempt to modify mapping returns `[ERROR] [FORBIDDEN]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | REQ-067, REQ-032                            |
| T119  | Automated | Action pattern toggle: novel has active enrich patterns. Call `suggest_actions` with a pattern-matching intent — assert patterns absent. Call `toggle_action_patterns` — assert "enabled" in response. Call `suggest_actions` with the same intent — assert patterns appear. Call `toggle_action_patterns` — assert "disabled." Call `suggest_actions` — assert patterns absent again. Player badge attempt on `toggle_action_patterns` returns `[FORBIDDEN]`. No novel active — assert `[STATE_CONFLICT]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | REQ-115, REQ-084, REQ-032                   |
| T120  | Automated | Suggestion precision: call `suggest_actions("I want to convince the guard")` — assert at least one result maps to a social-resolution tool, not a combat or lookup tool. Call `suggest_actions("strike a bargain")` — assert results exclude weapon-attack tools. Call with a combat intent while combat is active — assert combat tools appear and scene-type filtering excludes non-combat tools from the top results. Call with intent matching no plausible tool ("I want to become a sandwich") — assert empty list.                                                                                                                                                                                                                                                                                                                                                                                                   | REQ-084                                     |
| T121  | Automated | Redo: create Novel with entity. Apply condition → undo → assert condition removed → redo → assert condition restored. Undo twice then redo once → assert one step restored, one still undone. Redo on empty redo stack → `[STATE_CONFLICT]`. Mutate after undo → assert redo stack cleared and new undo target created. Redo blocked during pending `[NEED_INPUT]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | REQ-116, REQ-041                            |
| T122  | Automated | Retention: create Novel with state, end Novel confirming "yes." Assert primary `.json` and `.json.bak` moved to `.holonovel-state/novels/.trash/`. Assert `listNovels` excludes the slug. Assert `resume_novel(slug)` returns `[STATE_CONFLICT]`. Set `TTRPG_NOVEL_RETENTION_DAYS=0`, restart — assert trash files retained. Set `TTRPG_NOVEL_RETENTION_DAYS=1`, restart — assert files older than 1 day removed, recent files retained.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | REQ-117, REQ-088                            |
| T123  | Automated | Prompt length budget: populate a Novel with the maximum expected NPCs, lore entries, countdowns, and entities (per REQ-097 default thresholds). Invoke `badge_briefing` — assert output length does not exceed the configured budget; assert truncated sections carry `[truncated]` markers with resource URI pointers; assert section headers and required contract elements (intro pointer, `player_signal` directives) are preserved untruncated. Invoke `session_zero` — assert output within budget. Invoke `novel_setup` with a full roster and indexed adventures — assert output within budget. Modify the budget config to a lower value, restart — assert truncation activates at the new threshold.                                                                                                                                                                                                                                                                                                                                                                                                                                           | REQ-118                                     |
| T124  | Automated | Session zero content: invoke the `session_zero` prompt on a running server. Assert the output contains all eight sections in order: welcome, per-signal explanations (tone, difficulty, pace, focus, boundary), character introductions (three example descriptions at increasing detail), character creation (ruleset's choice categories in plain English), adventure confirmation, narrative capabilities (no tool names, plaintext examples), quick-start guide, post-session. Assert per-signal explanations include three to five named tuning options with narrative paragraphs. Assert the narrative capabilities section contains zero tool names. Assert the `intro` prompt output directs to `session_zero` as a recommended next action. | REQ-078, REQ-063 |
| T125  | Automated | Synthesis rebuild survival: create Novel, populate enrichment across all six modules. Restart server — assert enrichment restored unchanged. Rebuild with same ruleset — assert enrichment preserved, all items still tagged `[supplementary]`. Change ruleset hash, rebuild, resume — assert `spec_health` reports fingerprint mismatch with enrichment retained from prior build. Run Build + Enrich against new hash — assert new enrichment manifest generated, old enrichment replaced. Delete state directory, rebuild without enrich — assert no enrichment present. Build + Enrich with matching fingerprint — assert no-op with enriched state unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | REQ-080, REQ-103, REQ-092, REQ-065 |
| T126  | Automated | NPC stat block reference: call `lookup_monster("goblin")`, capture its stats. Call `create_npc("Goblin Scout", reference="goblin")` — assert NPC created with stats matching the goblin entry. Call `create_npc("Goblin Chief", reference="goblin", hp=21)` — assert HP overridden to 21, other stats from reference. Call `create_npc("Fake", reference="nonexistent")` — assert `[ERROR] [NOT_FOUND]` with valid reference names enumerated. Call `create_npc` with a reference entry carrying a field not in the builder-determined stat surface — assert the extra field is included in the NPC's stat block and resource URI output. Assert reference parameter is optional — calling without reference succeeds.                                                                                                                                                                                                     | REQ-119                                     |
| T127  | Automated | NPC rendering: create NPC with stat fields and narrative fields (per REQ-075, REQ-122). Call `character_sheet(npc_id)` — assert output contains NPC name, populated stat fields, conditions, and narrative fields in ruleset baseline format. Call with a non-existent ID — assert `[ERROR] [NOT_FOUND]`. Switch to Player badge — assert stat fields visible, GM-only narrative fields hidden. Verify output format matches entity `character_sheet` format.                                                                                                                                                                                                                                                  | REQ-120, REQ-032                            |
| T128  | Automated | NPC resource URIs: create NPC, assert `npc://<id>` resource returns full stat block and narrative fields. Assert `npcs://` resource lists all active NPCs with name, disposition, location. Assert resources re-registered on `switch_novel`. Assert resources removed after `end_novel`. Switch to Player badge — assert `npc://<id>` returns summary fields only, `npcs://` returns summary list.                                                                                                                                                                                                                                                      | REQ-121, REQ-032                            |
| T129  | Automated | NPC narrative fields: create NPC. Call `set_personality(npc_id, description, voice, background, goals)` — assert fields set and surfaced in `badge_briefing` and at `npc://<id>/personality`. Call `set_voice_examples(npc_id, [...])` — assert examples set. Verify NPC narrative fields are Novel-scoped — `end_novel` removes them, no roster backing. Assert Player badge attempt on `set_personality` for NPC returns `[FORBIDDEN]`.                                                                                                                                                                                                                                                                                                                            | REQ-122, REQ-075, REQ-032                   |
| T191  | Automated | NPC description field: call `create_npc("Guard", description="Tall")` then `set_personality(npc_id, {description: "Suspicious"})` — assert the NPC's description reads "Suspicious" at `npc://<id>`, `character_sheet`, and `npc://<id>/personality`. Call `create_npc("Merchant")` (no description) then `set_personality(npc_id, {description: "Cheerful"})` — assert description is "Cheerful" at all three surfaces.                                                                                                                                                                                                                                                                                                                 | REQ-156                                     |
| T192  | Automated | Combat determinism: start a fresh server with `TTRPG_SEED=7`. Call `init_combat` with one danger and `seed="42"` — assert danger initiative d20 face matches Appendix B.4 seed-42 column at position 1 (value 6). Call `roll_save("dexterity")` without a seed — assert the d20 face matches the session sequence (seed-7 B.4 column). Call `init_combat` with two dangers and `seed="42"` — assert d20 faces match positions 1 and 2 of the B.4 seed-42 column. Call `init_combat` with one danger and no seed — assert the d20 face matches the next position in the seed-7 session sequence (after the roll_save draw). | REQ-157                                     |
| T193  | Manual   | Independent verification: execute the verifier prompt (§10) against a completed build. Assert the verifier can complete Phase 1 (cold start, G0b–G4, smoke session, waiver audit, T29, H1–H14, artifact diet, adversarial Pattern Buffer) without builder assistance. Assert the report produces a VERIFIED or VERIFIED WITH FINDINGS verdict.                                                                                                                                                                                                                                                                                                                                                                                                                  | REQ-158                                     |
| T194  | Automated | Synthesis briefing integration: after enriching a Novel, invoke `badge_briefing` as GM — assert supplementary guidance items appear tagged `[supplementary]` with source URLs. Assert enrich-sourced voice examples appear under entity personality with `[supplementary]` tag. Switch to Player badge — assert game_master-scoped enrichment items are absent. Call `revert_synthesis` — assert all synthesis content absent from all badge briefing views.                                                                                                                       | REQ-159, REQ-080                            |
| T195  | Automated | Enrichment health reporting: after enriching a Novel, invoke `spec_health` — assert `synthesis_active: true`, per-module counts matching the manifest, non-empty fingerprint. Call `revert_synthesis` — assert `synthesis_active: false` and `module_counts` contains all six module names (`voice_examples`, `briefing_order`, `lore_templates`, `action_patterns`, `supplementary_guidance`, `adventure_advice`) each with value zero. Populate stale items past `TTRPG_SYNTHESIS_STALE_DAYS` — assert `stale_count` increments and `[stale]` flag. Activate a lore template via `set_lore_entry` — assert `activated_count` increments.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | REQ-160, REQ-025                            |
| T196  | Automated | Intake workflow contract: attempt a build without recording intake answers in DECISIONS.md (1) — assert the process-compliance convergence metric fails. Run a non-interactive build with network detected — assert Q0 defaults to `build + enrich` and the probe result is recorded in DECISIONS.md (1). Run a non-interactive build offline — assert Q0 defaults to `build` only. Re-run a build selecting an additional workflow — assert only new workflow questions are re-asked.                                                                                                                                                                                                                                                                                                                                                                                                                                                    | REQ-161                                     |
| T197  | Automated | Build-mode profiles: run a production build — assert assumption audit (T89), auditor pre-flight, and cross-model audit results are recorded in DECISIONS.md. Run a quick-build build — assert a `quick-build` annotation in DECISIONS.md (6) listing skipped rituals. Assert the Pattern Buffer passes for both modes. Run a quick-build build without the annotation — assert the process-compliance metric fails.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | REQ-162                                     |
| T198  | Automated | Client config verification: write a client config entry with `workdir` key targeting a client whose documented schema expects `cwd` — assert the builder produces an F6 defect and blocks the build. After correction — assert the initialize handshake succeeds with matching `serverInfo.name`. Write a valid config entry — assert no F6 defect, handshake passes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | REQ-163, H11                                |
| T199  | Automated | Viability pre-check: provide a ruleset with 15 mechanical sections out of 60 total sections (25%) — assert the builder warns with density percentage and the operator-decision prompt. Record the operator's "proceed" decision — assert the count and decision appear in DECISIONS.md (4). Provide a ruleset with 25/60 (42%) — assert the build proceeds without warning and the count is recorded in DECISIONS.md (4).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | REQ-164                                     |
| T200  | Automated | Entity ownership for personality gating: create an entity as Player via `create_character` — assert `set_personality` succeeds on that entity. Create an entity as GM — assert the Player can still call `set_personality` on it (ownership non-exclusive). A Player who has never created any entity can call `set_personality` on an entity imported by the GM.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | REQ-165, REQ-077                            |
| T201  | Automated | Personality briefing rendering: set `voice: "gruff"` and `goals: "find the relic"` on an entity via `set_personality`. Assert `badge_briefing` renders both fields under the entity's name and `description`/`background` are absent. Create an entity with no personality — assert absent from the personality group. Create an NPC with narrative fields — assert NPC personality renders alongside entity personality with an NPC marker. Assert the group renders the empty-state marker when no entities have personality data.                                                                                                                                                                                                                                                                                                                                                                                                                                                            | REQ-166, REQ-109                            |
| T202  | Automated | Personality resource URIs: set personality fields on an entity — assert `entity://<id>/personality` returns populated fields only, unset fields absent. Assert `npc://<id>/personality` follows same contract when NPC personality is set. Assert enrichment-sourced voice_examples carry `source: "enrichment"` and `source_url`. Switch to Player badge — assert personality fields visible for all entities per REQ-032.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | REQ-167, REQ-126                            |
| T203  | Automated | Audit resource: create a Novel, perform several mutations. Assert `resources/read` on `audit://novel` returns all audit entries in append order with chained hashes. Assert Player badge sees only own-entity and own-badge entries. Assert forbidden-call entries carry `[BOUNDARY_VIOLATION]` prefix. Assert state query tool calls are absent from the resource. Assert no-Novel access returns `[ERROR] [STATE_CONFLICT]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | REQ-168, REQ-040, REQ-133                   |
| T204  | Automated | Audit chain integrity reporting: create a Novel with 5 valid audit entries — assert `spec_health.audit_chain` reports `valid: true, entries: 5` with `first_broken_index` absent. Tamper with entry 2's hash in the on-disk state — assert `valid: false, first_broken_index: 2`. Assert the field is absent when no Novel is active. Assert a Novel with zero entries reports `valid: true, entries: 0`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | REQ-169, REQ-025                            |
| T205  | Automated | Section token documentation: read DECISIONS.md from the handoff directory — assert it contains a section-token-to-group mapping table citing REQ-109 group names. Invoke `set_briefing_order` with an unknown token — assert `[ERROR] [INVALID_INPUT]` with valid tokens enumerated. Assert every token in the DECISIONS.md mapping appears in the runtime `[INVALID_INPUT]` error enumeration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | REQ-082, REQ-109                            |
| T210  | Automated | Roll transparency output shape: invoke roll_save, roll_skill_check, roll_weapon_attack, roll_weapon_damage, and roll_on_table (ruleset-permitting) with deterministic seeds. Assert every roll result contains: `[OK] Total:` header with total and outcome, `Dice:` line with notation and individual faces in brackets, `Modifiers:` line with per-source signed contributions (not a bare aggregate), and `Outcome:` line with prose description. For advantage/disadvantage rolls, assert all rolled faces appear with used/discarded distinction. Assert result band appears when the ruleset defines one (e.g., natural 20). | REQ-003 |
| T211  | Automated | Connection counter: set a player signal, restart the server — assert the signal shows "set 1 connection ago" in `badge_briefing`. Set another signal, restart — assert the first shows "set 2 connections ago" and the second shows "set 1 connection ago." Remove and re-set a signal in the same connection — assert it shows "set this connection." Assert a pre-existing Novel from a build without connection counter support displays "unknown" for the age field. Assert the counter is visible in `novel://current` metadata.                                                                                                                                                                                                                                                                                                                                                                                                                                                             | REQ-173, REQ-069, REQ-128                   |
| T212  | Automated | Session recap entity status: create entities at full HP, at 0 HP, and with a death condition applied. Assert `session_recap()` reports entity status as "alive" when HP > 0, "unconscious" at HP = 0, "dead" when the ruleset death condition is active. For a ruleset without a death condition, assert statuses are "alive" and "incapacitated."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | REQ-072                                     |
| T213  | Automated | Significant-roll criterion: run 2 saving throws, 3 weapon attacks, 2 table rolls, and 1 untargeted skill check. Assert `session_recap` includes 6 significant rolls (2 saves + 3 attacks + 1 skill check) and excludes 2 table rolls. Assert roll ordering is chronological. Assert each entry has tool name, entity_id, die faces, and outcome summary.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | REQ-174, REQ-072                            |
| T214  | Automated | Confrontation summary: run init_combat → advance_combat (2 rounds) → end_combat(outcome="goblins routed"). Call `session_recap` — assert `confrontations_completed` has one entry with participant count, round count = 2, outcome = "goblins routed", and `confrontation_pending` is null. Run a second init_combat (no end_combat) — assert `confrontations_completed` still has one entry and `confrontation_pending` is non-null with participants, round, and turn_position.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | REQ-175, REQ-072                            |
| T215  | Automated | Session recap structured output: invoke `session_recap()` on a populated Novel. Assert all 14 named fields are present (timespan_start, timespan_end, entities, confrontations_completed, confrontation_pending, scene, scene_type, lore_entries, narrative_directive, scene_transitions, roster_changes, condition_changes, significant_rolls, total_combat_rounds). Assert `timespan_start` and `timespan_end` are ISO 8601 strings or null. Assert `entities` array entries have `name`, `hp`, `max_hp`, `conditions`, and `status` fields. Assert `total_combat_rounds` is an integer. Assert no unlabeled narrative prose surrounds the structured fields.                                                                                                                                                                                                                                                                                                                                                                                        | REQ-072                                     |
| T216  | Automated | Entity removal: import two entities into a Novel — assert `remove_entity("character_02")` removes the entity from `entities://` and `party://current`. Assert the roster baseline is unchanged and re-importing the same roster ID creates a fresh copy. Assert Player badge returns `[FORBIDDEN]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | REQ-176, REQ-074                            |
| T217  | Automated | Roster entity removal: create a roster character, import it into a Novel. Call `remove_roster_character(roster_id)` — assert entry removed from `roster://`. Assert the Novel entity copy survives independently. Call with nonexistent roster ID — assert `[NOT_FOUND]` with valid IDs enumerated. Assert Player badge returns `[FORBIDDEN]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | REQ-177                                     |
| T218  | Automated | Entity cardinality: set `TTRPG_MAX_ENTITIES=1`, import two entities — assert second returns `[STATE_CONFLICT]` with group name and counts. Set `TTRPG_MAX_ENTITIES=0` — assert `import_character` fails with `[STATE_CONFLICT]`. Set `TTRPG_MAX_ROSTER_ENTITIES=1`, create two characters — assert second returns `[STATE_CONFLICT]` before state mutation. Assert `spec_health` reports entity count, maximum, overflow flag, and 80% warning.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | REQ-129, REQ-074                            |
| T219  | Automated | Roster listing: create three roster characters. Assert `list_roster_characters()` returns all with ID, name, race, class, level. Assert `roster://character_01` returns full data including personality fields. Clear roster — assert returns empty-state marker.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | REQ-178, REQ-089                            |
| T220  | Automated | Duplicate import guard: import roster character "Thorn" into Novel A. Call `import_character` for the same roster ID into Novel A again — assert `[STATE_CONFLICT]` naming existing entity. Import "Thorn" into Novel B — assert success.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | REQ-074                                     |
| T206  | Automated | Load adventure error contract: call `load_adventure("nonexistent-slug")` — assert `[ERROR] [NOT_FOUND]` with available adventure slugs enumerated in the error value. Assert the builder records the validation mechanism in DECISIONS.md. Call `load_adventure("tomb-of-horrors")` with a valid slug — assert the adventure activates normally.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | REQ-079                                     |
| T207  | Automated | Adventure discovery surface: after building with indexed adventures, assert `spec_health.indexed_adventures` lists slugs and content hashes. Assert `resources/read` on `adventures://` returns the complete list with titles and badge-filtered hooks. Switch to Player badge — assert only Player-visible adventure hooks appear.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | REQ-170, REQ-079                            |
| T208  | Automated | Adventure content validation: build with a malformed adventure (missing `## Overview` heading). Assert `spec_health` reports `[malformed-adventure]` with slug and failure reason. Assert partially indexed adventures serve conforming sections at `adventure://<slug>/<anchor>`. Assert skipped adventures are absent from all surfaces.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | REQ-171                                     |
| T209  | Automated | Adventure content drift detection: modify an indexed adventure file after build, restart the server. Assert `spec_health` reports `[adventure-drift]` for the modified slug with detection timestamp. Assert stderr carries a matching warning. Assert drift detection does not block startup.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | REQ-172, REQ-079                            |
| T130  | Automated | Builder-defined NPC stat fields: build server for a ruleset with stat-block conventions. Assert `create_npc` exposes stat fields matching that ruleset's stat-block schema (not hardcoded ac/hp/speed). Build with a ruleset that has no NPC stat conventions — assert NPC surface exposes only narrative fields. Assert all stat fields are optional. Assert `name` is the only required field.                                                                                                                                                                                                                                                                                              | REQ-123, REQ-075                            |
| T131  | Automated | NPC damage resolution: create NPC with ac and hp. Initiate combat with NPC as participant. Call `advance_combat` through NPC's turn — assert turn resolves. Call damage-resolution tool with NPC as target — assert damage resolved against ruleset's damage model (HP, wounds, or loss-of-effectiveness metric), result transparent per REQ-003. Reduce NPC to zero health threshold — assert incapacitation condition applied per ruleset convention. Assert damage against NPC is audited and snapshot-able. Call damage-resolution tool with unknown NPC ID — assert `[ERROR] [NOT_FOUND]`.                                                                                                                                                                                                     | REQ-124, REQ-043, REQ-003                   |
| T132  | Automated | Scene history cap: call `set_scene_state` N+1 times (N = configured max). Assert `scene://history` returns exactly N entries (most recent). Assert output includes count of suppressed entries and `[truncated]` marker. Assert audit log contains all N+1 entries.                                                                                                                                                                                                                                                                                                                                                                                                                                                  | REQ-076                                     |
| T133  | Automated | Structured scene fields: set scene state with description, location, time_of_day, atmosphere. Assert all fields appear in `scene://current` and `badge_briefing`. Set scene state with only description — assert optional fields empty or absent. Attempt `set_scene_state` with structured fields as Player badge — assert `[FORBIDDEN]`. Restart — verify fields persist.                                                                                                                                                                                                                                                                           | REQ-076a, REQ-032                            |
| T134  | Automated | Stacked directives: set directive via single string — assert appears as `primary` label. Set directives via array with three labels — assert all three appear grouped in GM `badge_briefing` and absent from Player `badge_briefing`. Set duplicate label — assert replaced. Pass empty array — assert all directives cleared. Player attempt returns `[FORBIDDEN]`. Restart — verify directives persist.                                                                                                                                                                                                                                                                   | REQ-081, REQ-032                            |
| T135  | Automated | Compound scene types: set scene type to `["social", "exploration"]` — assert GM `badge_briefing` orders both social and exploration tools before unmatched tools. Set to single string `"exploration"` — assert backward-compat behavior identical to current spec. Set to `["nonexistent"]` — assert `[ERROR] [NOT_FOUND]` with valid values enumerated. Player attempt returns `[FORBIDDEN]`. Restart — verify type persists.                                                                                                                                                                                                                                 | REQ-087, REQ-032                            |
| T136  | Automated | Scene transition hook: create Novel with scene state "forest". Call `set_scene_state` with "cave" — assert `[scene-transition]` audit entry with both descriptions. Set narrative countdown with `on_scene_transition=true`, 3 ticks. Call `set_scene_state` with "castle" — assert countdown decrements to 2. Call `set_scene_state` with "castle" (same description) — assert no transition (no audit entry, no countdown decrement). Call with `skip_transition_hook=true` — assert no audit entry, no countdown decrement. Player badge reads transitions in `scene://history`.                                                                                                                                       | REQ-125, REQ-073                            |
| T137  | Automated | Scene pacing tick: create Novel — assert scene_tick = 0. Init combat with 2 participants, advance through one full round (wrap back to first) — assert scene_tick = 1. Advance through second full round — assert scene_tick = 2. Call `set_scene_state` with new description (triggering transition) — assert scene_tick resets to 0. Verify tick visible in GM `badge_briefing`, absent from Player `badge_briefing`.                                                                                                                                                                                                                                                                                          | REQ-076                                     |
| T138  | Automated | Workflow lifecycle: raise `[NEED_INPUT]` via step-by-step character creation. Assert `respond` with whitespace-only variation of the decision text (leading/trailing whitespace, collapsed internal whitespace) is accepted and drains the decision — `undo` becomes callable (no longer returns `[STATE_CONFLICT]`). Assert `respond` with non-whitespace difference returns `[ERROR] [NOT_FOUND]` with the canonical text. Assert `respond` with unrecognized option returns `[ERROR] [NOT_FOUND]` enumerating valid options. Assert `respond("cancel")` restores pre-workflow state — no entity in roster, `[workflow-cancelled]` audit entry recorded with decision text, `undo` callable. Assert `create_character()` without params while workflow is pending returns `[STATE_CONFLICT]`. Assert `undo` returns `[STATE_CONFLICT]` during pending workflow. Assert `set_badge` returns `[STATE_CONFLICT]` during pending workflow. Restart server — assert the pending `[NEED_INPUT]` survives and `respond("cancel")` restores pre-workflow state.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | REQ-042, REQ-190, REQ-066, REQ-041, REQ-092 |
| T139  | Automated | Countdown lifecycle: set a shared increment countdown "tension" (3 ticks). Advance twice — assert remaining = 2/3, still active. Advance again — assert fires at 3/3, removed from active, audit log entry present, name slot free. Set a game-master decrement countdown "patrol" (2 ticks). Switch to Player — assert `badge_briefing` shows "tension" (shared) but not "patrol" (GM-only). Switch to GM — assert both. `remove_countdown("patrol")` — assert removed, no audit expiry. Set "patrol" again — assert new countdown (not reactivated).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | REQ-073, REQ-032                            |
| T140  | Automated | Voice examples rendering: create entity with personality fields and voice_examples. Call `badge_briefing` — assert voice_examples appear alongside personality traits under the entity personality group, with dialogue examples before trait descriptions. Call `character_sheet` — assert voice_examples rendered under Personality section. Set Novel-level override for voice field — assert override voice renders alongside original voice_examples. Verify enrich-sourced voice_examples carry `[supplementary]` tag in all surfaces. Invoke `entity://<id>/personality` resource — assert rendering contract holds. NPC with personality fields: assert same rendering contract at `npc://<id>/personality`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | REQ-077, REQ-126, REQ-109                   |
| T141  | Manual   | Ruleset-native personality mapping: build server for a ruleset with native personality constructs (e.g., D&D 5e Traits/Ideals/Bonds/Flaws). Assert RULESET_MODEL.md records a mapping from each native construct to a Holonovel personality field. Assert `set_personality` tool description references the ruleset-native construct names. Assert `session_zero` prompt's character introductions and character creation sections use the ruleset-native construct names in plain English (e.g., "describe your character's Traits, Ideals, Bonds, and Flaws"). Build server for a ruleset without native constructs (e.g., Appendix B fixture) — assert tool descriptions use only Holonovel field names and no native construct names.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | REQ-127, REQ-104, REQ-078                   |
| T142  | Automated | Signal lifecycle: set five player signals (pace, difficulty, tone, focus, boundary) with distinct values. Assert all five appear in the audit log. Invoke `badge_briefing` as GM — assert a dedicated player-signals section with all five signals, each showing signal type, value, and age (connection-counter delta per REQ-173). Invoke `badge_briefing` as Player — assert signals absent. Invoke `player_signal` from GM badge — assert `[FORBIDDEN]`. Set `player_signal("pace", "")` — assert pace removed, briefing section reflects removal. Set `player_signal("pace", "new_value")` — assert replaced with refreshed connection counter. Restart server — assert all signals persist and ages advance. End Novel, resume — assert signals restored. | REQ-069, REQ-128, REQ-032, REQ-173        |
| T143  | Automated | Property group cardinality: create 3 NPCs, assert `spec_health` reports current=3/500. Configure `TTRPG_MAX_NPCS=3`, attempt to create a 4th NPC — assert `[ERROR] [STATE_CONFLICT]` with group named and counts reported. Set `TTRPG_MAX_NPCS=0` — assert `create_npc` returns `[STATE_CONFLICT]`. Restore to 500 — assert creation succeeds. Repeat for countdowns (max 3 via `TTRPG_MAX_COUNTDOWNS`) and lore entries (max 3 via `TTRPG_MAX_LORE_ENTRIES`). Assert `spec_health` `overflow` flag true when any group at maximum. | REQ-129                                     |
| T144  | Automated | Synthesis rebuild contract: run synthesize, activate one lore template and one voice example via Novel-scoped GM tool calls that cause them to appear in tool-observable surfaces. Re-run synthesize — assert activated items persist exactly as activated. Verify an inactive enrich item's content may change (replaced by fresh output). Run `revert_synthesis`, re-run synthesize — assert all fresh. Create Novel with enrichment from prior build, change ruleset hash, rebuild with same spec — assert activated items preserved, inactive items replaced. | REQ-130, REQ-080, REQ-103                   |
| T145  | Automated | Novel initialization order: create a Novel with an adventure module (REQ-079), an NPC created from an adventure template reference (REQ-119), a lore entry whose content references the NPC name, and a countdown with `on_scene_transition=true` (REQ-125). Set scene state with text matching the lore trigger. Restart server. Assert `badge_briefing` surfaces content in dependency order: adventure hook before NPC, NPC before lore entry, lore entry active (triggered by scene), countdown with correct ticks. Assert the order is stable across 3 restarts. | REQ-131, REQ-079, REQ-119, REQ-083, REQ-073 |
| T146  | Automated | Adventure generation lifecycle: call `generate_adventure("A haunted space station")` — assert content at `adventure://generated/overview` and `adventure://generated/hook`. Restart server — assert generated adventure preserved. Call `load_adventure("tomb-of-horrors")` — assert indexed and generated adventures coexist in `badge_briefing`, indexed first then generated. Call `generate_adventure("Sunken temple")` — assert old generated content replaced. `end_novel` — assert generated adventure discarded with the Novel, not present on disk in `TTRPG_ADVENTURE` directory. | REQ-132, REQ-079, REQ-090                |
| T147  | Automated | Forbidden-call audit: create a Novel, invoke a GM-only tool under the Player badge — assert `[FORBIDDEN]` audit entry recorded with badge `player`, tool name, arguments, `violation_type: "boundary"` field, and `[BOUNDARY_VIOLATION]` prefix on the output column. Invoke a Player-only tool under the GM badge — assert another `[FORBIDDEN]` audit entry with the same markers. Verify entries visible at `audit://novel` and chained with correct hashes (REQ-040). Verify state queries do not produce audit entries. | REQ-133, REQ-040 |
| T148  | Automated | Minimum Player tool surface: set Player badge, invoke one tool from each Player-guaranteed group (dice-resolution, ruleset lookup, character_sheet, suggest_actions, player_signal, help, undo, set_badge) — assert all succeed. Invoke a GM-exclusive tool (create_npc, init_combat, set_scene_state, set_lore_entry) — assert each returns `[FORBIDDEN]`. Switch to Game Master — assert all tools succeed. Verify `tools/list` filtered by each badge matches the DECISIONS.md classification table. | REQ-134, REQ-032 |
| T149  | Automated | Badge briefing size budget: configure a small `TTRPG_MAX_BRIEFING_TOKENS`, invoke `badge_briefing` with populated Novel — assert supplementary sections truncate before decision-critical sections at the same budget threshold; assert badge foundations and intro pointer are never truncated. Configure a very large budget — assert no truncation markers. Verify truncated sections are full (not partial) and each carries a retrieval pointer. | REQ-135, REQ-109 |
| T150  | Automated | Editor-badge briefing: restart with no Novel active, invoke `badge_briefing` — assert setup-oriented message with intro pointer and Novel-creation guidance. Create a Novel, do not set badge, invoke `badge_briefing` — assert active Novel name and guidance to set up the Novel under the Editor badge. Verify no gated content appears in either case. Set badge to Player — assert full Player briefing (in the story mode, not setup mode). | REQ-136, REQ-031 |
| T151  | Automated | Gate classification auditability: build server, inspect DECISIONS.md gate-classification table — assert every registered tool appears in exactly one of {Player-only, GM-only, un-gated}. Assert `tools/list` filtered by Player badge contains exactly the tools classified as Player + un-gated. Assert `tools/list` filtered by GM badge contains exactly the tools classified as GM + un-gated. Assert `set_badge` is classified un-gated and appears in both lists. Assert no tool is classified as both Player-only and GM-only. | REQ-137, REQ-032 |
| T152  | Automated | Prompt health reporting: invoke `spec_health` — assert every registered prompt appears in a `prompt_health` section with name, presence, length, budget, budget-compliance flag, and stale-references list. Rename a tool referenced in a prompt — assert the stale-references list for that prompt shows the old tool name. Restore the original name — assert the stale-references list clears. | REQ-138 |
| T153  | Automated | Resource URI completeness: invoke `spec_health` — assert a `resource_uris` section lists every REQ-022 URI template with presence (present/absent), registration name, and MIME type. Register a new resource — assert its URI appears as `present` immediately. Remove a resource — assert the URI changes to `absent`. | REQ-139 |
| T154  | Automated | Gap audit comparison surface: invoke `spec_health` — assert a `gap_audit` section is present containing a delta summary (spec_version comparison), tool-catalog comparison (per-category presence), resource-map comparison, prompt-list comparison, and badge-gating summary. Assert the section is absent when build is not complete. | REQ-025 |
| T155  | Automated | run_workflow derivation source: invoke `prompts/get` on `run_workflow` — assert intent-to-tool mapping uses registered tool catalog action classifications (REQ-015) rather than hardcoded keyword strings. Add a tool with `attack` classification to the registry and restart — assert the prompt's attack-intent recommendation changes without code changes. | REQ-023 |
| T156  | Automated | Atomic write durability: create Novel, make mutations, SIGKILL the process. Restart — assert pre-kill state loads from backup or intact primary. Assert zero-byte or truncated files surface in `spec_health` and stderr. Assert Novel file uses unique temp file names (PID or timestamp suffix). | REQ-092 |
| T157  | Automated | Pending workflow restart survival: initiate step-by-step character creation, restart server with same Novel — assert `[NEED_INPUT]` remains open with same decision text. `respond(cancel)` after restart — assert correct pre-workflow snapshot restored. `respond(valid_option)` after restart — assert decision drains. | REQ-042 |
| T158  | Automated | End-Novel confirmation dispatch: `end_novel()` → assert `[NEED_INPUT]` with yes/cancel options. `respond("End Novel <slug>?", "yes")` → assert Novel file removed, active set empty. `resume_novel(slug)` → assert `[STATE_CONFLICT]`. `respond` with non-matching decision → assert `[NOT_FOUND]` with open decision text. | REQ-140 |
| T266  | Automated | Workflow staleness: start a pending workflow via step-by-step character creation. Restart server 4 times — assert workflow remains pending on each restart. On the 5th restart — assert workflow auto-cancels with `[workflow-stale]` audit entry naming the decision text and connection count (5). Assert pre-workflow snapshot restored, undo callable. Assert `spec_health` reports `pending_workflow` with staleness counter before auto-cancel. Set `TTRPG_WORKFLOW_STALENESS_CONNECTIONS=0` — assert auto-cancellation disabled, workflow remains pending indefinitely. | REQ-224 |
| T159  | Automated | TTRPG_NOVEL startup auto-load: set `TTRPG_NOVEL=<slug>` where Novel exists on disk — start server, assert Novel is active before any tool call. Set `TTRPG_NOVEL=<new_slug>` where no Novel exists — assert Novel is created and active. Set `TTRPG_NOVEL=<slug>` with corrupt file — assert error in stderr and `spec_health`, server proceeds with no Novel active. | REQ-088 |
| T160  | Automated | Novel file-size accuracy: invoke `spec_health` — assert on-disk file size metric matches OS-reported size within 1%. Mismatch > 1% — assert `[size-mismatch]` warning in `spec_health`. Assert growth trajectory uses on-disk size. | REQ-097 |
| T161  | Automated | advance_combat audit-log-derived output: init combat with entity, perform weapon-damage against target, advance_combat — assert output includes participant name, weapon used, damage roll transparency, target HP change. advance_combat with no prior mutations — assert reports participant took no action. | REQ-043 |
| T162  | Automated | Auto turn advancement for statless: init combat with entity, NPC (no stats), and danger. Advance through NPC turn — assert `[auto]` marker, narrative action from NPC description, no mechanical changes, immediate turn advance. Advance through danger turn — assert `[auto]` marker, narrative action from danger name. | REQ-043 |
| T163  | Automated | Input-validation convergence: trigger an S14a failure (empty string accepted without [INVALID_INPUT]), assert the builder maps it to the input-validation metric, assert Phase 2 re-enters for input-validation only (other three metrics unchanged), assert DECISIONS.md (6) records the failing input value and error category mismatch. After Pattern Buffer re-entry for input-validation, assert DECISIONS.md (6) records a fresh 3-attempt budget independent of the original Phase 2 budget. Assert the re-entry's iteration count does not accumulate with original Phase 2 iterations. | REQ-141, REQ-208 |
| T164  | Automated | Blocking classification: after a full Pattern Buffer run, assert DECISIONS.md (6) contains a blocking classification record for every sub-workflow with the safety property it protects and the citing REQ(s). Assert every sub-workflow marked blocking in the exit criteria is classified blocking in the record. Assert every sub-workflow not in the exit criteria is classified non-blocking. | REQ-142 |
| T165  | Automated | Extraction completeness: after build with ≥20 mechanical sections, assert `spec_health.convergence_summary.extractionCompleteness` ≥ 95% and ≤ 100%. Assert the completeness count matches the viability pre-check mechanical-section count less guidance-only sections. | REQ-025 |
| T166  | Automated | Per-category confidence: after build, assert `spec_health.convergence_summary.category_confidence` contains an entry for each of the 7 extraction categories, each with counts and percentages for HIGH, MEDIUM, and LOW. Assert the sum of category counts matches the total indexed count. | REQ-025 |
| T167  | Automated | Prompt health convergence: after build, assert `spec_health.convergence_summary.prompt_health.stale_reference_count` = 0 for each registered prompt. Assert the prompt health section of convergence_summary lists every prompt from REQ-023. | REQ-138 |
| T168  | Automated | Resource URI convergence: after build, assert `spec_health.convergence_summary.resource_uri_completeness` = 100%. Assert every REQ-022 URI template has a `present` entry in the convergence_summary. | REQ-139 |
| T169  | Manual   | Pattern Buffer→Phase 1 re-entry: induce an extraction defect (miscategorized action) that survives Phase 1 and Phase 2 convergence but produces a Pattern Buffer failure. Assert the builder traces the root cause to Phase 1, records the affected Phase 1 metric, and re-enters Phase 1 for that metric. Assert the re-entry counts against the Phase 1 iteration budget. Assert DECISIONS.md (6) records the root-cause trace. | §6.6 |
| T170  | Automated | Convergence velocity: after a build that required ≥2 iterations on any quantitative metric, assert `spec_health.convergence_summary` includes a `velocity` field for that metric with ≥2 delta entries. Assert the first delta is the initial measurement, subsequent deltas are differences from the previous measurement. After a build requiring ≥2 iterations with zero velocity on iteration 3 while below threshold, assert a `[velocity-stall]` finding in DECISIONS.md (5) and assert the metric's step count does not increment beyond the stall. Assert the velocity field is absent when a metric converges on the first attempt. | REQ-025 |
| T171  | Automated | Guidance pass budget: after a build with a ruleset containing 120 guidance-only sections, assert sections are processed in 3 batches of 50 interleaved with chunk reads. Assert DECISIONS.md (4) records total guidance sections = 120, batches = 3, and the defect log carries a `[guidance-heavy]` finding. Repeat with 30 guidance sections — assert processed in a single pass with no `[guidance-heavy]` finding. | REQ-025 |
| T172  | Automated | Cross-chunk reference resolution: after a build with 15 cross-chunk references, assert DECISIONS.md (4) records resolved/unresolved counts. Assert every resolveable reference maps to a source anchor in RULESET_MODEL.md. Assert an unresolvable broken reference appears in the defect log with severity and source location. Assert resolution completes within one additional pass. | REQ-210 |
| T173  | Automated | Category extraction order: after a build, assert a ruleset chunk whose Actions reference a Concept term defined within the same chunk resolves that reference against the Concept inventory. Assert a reference to a Concept term not yet extracted within the chunk produces a deferred-reference annotation in the defect log. Assert the deferred reference is resolved correctly after cross-chunk resolution. | REQ-210 |
| T174  | Automated | Reconciliation authority criteria: after a build with a mechanic restated in three sections (core-mechanics chapter, summary table, supplement), assert canonical status is assigned to the core-mechanics section via criterion 3. With a ruleset whose index points to the summary table, assert criterion 1 overrides. Assert an `[authority-tie]` defect is produced when criteria 1–4 all produce a tie, and assert the defect log records which criterion resolved each reconciliation. | REQ-146 |
| T175  | Automated | Warning and Partial semantics: simulate a corrupted Novel on disk — assert `spec_health` returns `[WARNING]` with the Novel slug enumerated. Submit a search query returning contradictory ruleset texts — assert `[PARTIAL]` with both texts cited. Assert neither `[WARNING]` nor `[PARTIAL]` uses `isError: true`. | REQ-001a |
| T176  | Automated | Extended error category semantics: call `apply_condition` with an already-active condition — assert `[ERROR] [RULE_VIOLATION]` citing the ruleset anchor. Call a tool for a waived subsystem — assert `[ERROR] [UNIMPLEMENTED]` with the waiver reference. | REQ-002a |
| T177  | Automated | Error taxonomy completeness: call a tool with an ambiguous input matching multiple entries — assert `[ERROR] [AMBIGUOUS]` enumerating matching entries with distinguishing fields. Call a tool with a required parameter absent — assert `[ERROR] [MISSING_PARAM]` naming the missing parameter. | REQ-002 |
| T178  | Automated | Corrective-action contract: trigger a `[FORBIDDEN]` error from Player badge — assert exactly one `Corrective action:` line directing to `set_badge`. Trigger a `[STATE_CONFLICT]` — assert a corrective action referencing the required state change. Trigger a `[SYSTEM]` error via JSON-RPC `-32000` — assert no corrective action. | REQ-002b |
| T179  | Automated | Badge-filtered error values: as Player badge, call `lookup_spell` with a GM-only spell name — assert `[NOT_FOUND]` with only player-visible spell names and no "Did you mean?" hint for the GM-only name. As Game Master badge, repeat — assert full catalogue including the GM-only name in enumeration and hints. | REQ-002c |
| T180  | Automated | Error boundary: call a tool with a structurally invalid parameter — assert an SDK-level `-32602` response before the handler, without `[ERROR] [INVALID_INPUT]` or REQ-002 category. Call a tool with a semantically invalid parameter — assert a result with `isError: true` and `[ERROR] [INVALID_INPUT]`. Assert no protocol-level error carries a REQ-002 category string. | REQ-001b |
| T181  | Automated | Confidence aggregation: construct a RULESET_MODEL.md with three sections matching the REQ-147 acceptance criterion example. Assert per-section scores are 100%, 60%. Assert guidance-only section items are excluded. Assert overall player-filtered HIGH+MEDIUM = 80%. Assert `spec_health` reports this percentage. | REQ-147 |
| T182  | Automated | Category confidence floor: build against a fixture where one extraction category (e.g., Actions) has 40% HIGH+MEDIUM while overall confidence exceeds the tier threshold. Assert Phase 1 records a `[category-confidence-block]` finding in DECISIONS.md (5). Assert the builder re-extracts the affected category. Assert the build does not proceed past Phase 1 without operator disposition. Repeat with guidance category at 40% — assert no block (guidance is exempt). | REQ-011, §6.5 |
| T183  | Manual   | Structural integrity gate: provide a ruleset with a duplicate heading — assert G0a fails and discovery is blocked. Provide a ruleset missing horizontal-rule separators — assert G0a passes with the finding logged in DECISIONS.md (4). Assert the evidence record in DECISIONS.md (6) enumerates each blocking item with its pass/fail status. | REQ-148 |
| T184  | Automated | MCP conformance gate: launch a server, run every Appendix D check. Assert `tools/list` returns unique names. Assert `tools/call` with a known-absent canonical lookup returns `result` with `isError: true` and `[ERROR] [NOT_FOUND]`, not a JSON-RPC `error`. Assert `resources/read` against `guidance://player` returns Markdown with source header. Assert `prompts/get` on `badge_briefing` returns one user-role message. Assert networking-disabled operation. Assert all checks pass and the evidence record enumerates each. | REQ-149 |
| T185  | Automated | G2 coverage completeness: replay the Appendix B golden transcript. Assert the G2 evidence record enumerates all eight contracts and their coverage status. Assert every contract is exercised by at least one transcript interaction. Mask the `undo` interaction from the transcript — assert the evidence record marks REQ-041 as unexercised (coverage gap) without blocking. | REQ-150 |
| T186  | Automated | AGENTS.md troubleshooting: parse AGENTS.md. Assert `## Troubleshooting` heading present. Assert each of the four failure classes (config mismatch, corrupted state file, badge confusion, missing environment variables) appears. Assert each failure class has at least one diagnostic step. | REQ-153 |
| T187  | Automated | README.md handoff content: parse README.md. Assert `mcpServers` JSON block present with `command`/`args`/`env` fields. Assert setup section lists prerequisites. Assert state model description mentions persistence boundary. Assert RNG section mentions seed/determinism. | REQ-154 |
| T188  | Automated | H12 evidence format: parse DECISIONS.md (6). Assert H12 evidence entry present with non-empty command, exit_code, g2_result, and env_pins fields. | §9 |
| T189  | Automated | H13 Pattern Buffer freshness: parse DECISIONS.md (6). Assert H13 evidence entry with Pattern Buffer timestamp newer than most recent source file mtime. | §9 |
| T190  | Automated | Four-artifact diet: list handoff directory. Assert exactly RULESET_MODEL.md, DECISIONS.md, README.md, AGENTS.md, and LICENSE.md present alongside `src/`, `scripts/`, `package.json`, `tsconfig.json`, and config files. Assert no `.log`, `.tmp`, `.json` state files, or build artifacts in the handoff root. | §9 |
| T221  | Automated | Output pointer resource template: produce a tool output exceeding 32,000 bytes — assert `resources/templates/list` includes `output://{tool_name}/{counter}`. Read the resolved URI — assert full untruncated content returned as Markdown, badge-filtered per REQ-032. Push output storage beyond the configurable limit — assert the oldest payload is evicted and its URI returns `[NOT_FOUND]` with eviction message. | REQ-179, REQ-032 |
| T222  | Automated | Truncation budget unit: invoke a tool producing output near a 32,000-byte threshold — assert truncation occurs at the same byte offset whether measured in bytes or tokens. Assert DECISIONS.md records the `CHARS_PER_TOKEN` heuristic. Assert token-based truncation does not truncate earlier than the byte threshold would require. | REQ-180 |
| T223  | Manual   | Anti-slop guidance: invoke `badge_briefing` as GM — assert `[anti-slop]`-tagged items present with forbidden/corrected pattern pairs; assert LLM-specific patterns (echoing, passive voice, motif repetition) present for GM badge. Invoke as Player — assert Player-scoped anti-slop items present (establishing world facts, assuming outcomes, declaring NPC reactions, meta-commentary leakage), GM-only items excluded. Read `guidance://game_master/anti-slop` — assert Markdown containing all Appendix J GM-scoped patterns tagged `[anti-slop]` and badge-filtered; enrichment-sourced items carry `[supplementary]` with source URL. Read `guidance://player/anti-slop` — assert Player-scoped patterns. Severity classification (Hard/Soft) discernible from pattern metadata. | REQ-070, REQ-184 |
| T300  | Automated | Section token vocabulary: build for D&D 5e — assert DECISIONS.md contains a table mapping every REQ-109 group name to a snake_case token. Build for the Appendix B fixture — assert the token set shrinks (absent: combat, countdowns, lore, adventures) but token names for shared groups are identical to the D&D 5e build. | REQ-185 |
| T225  | Automated | Section token discoverability: invoke `spec_health` — assert `section_tokens` array with token, group, and has_content fields. Invoke `help` with query `"briefing"` — assert valid token set enumerated. Invoke `help` with query `"section ordering"` — assert valid token set enumerated. Invoke `set_briefing_order` with an unknown token — assert `[INVALID_INPUT]` with valid tokens enumerated matching `spec_health.section_tokens` exactly. | REQ-186, REQ-082 |
| T236  | Automated | Anchor determinism: parse the Appendix B fixture, extract all heading anchors, re-parse, assert identical anchor set. Assert anchors with CJK heading text preserve CJK characters. Assert `*Keeper only*` heading produces same anchor as bare heading text. Assert `{#custom-id}` overrides auto-derived anchor. Assert duplicate headings produce `-1`, `-2` suffixes matching GFM convention. | REQ-194 |
| T237  | Automated | World-model conflict resolution: create a Novel with a populated world model. Assert a TTRPG combat operation (init_combat, advance_combat) overrides the world-model tool surface — active combat state triggers TTRPG-turn-gating during parser navigation regardless of scene type. Assert world-model room descriptions override infrastructure output-format defaults — the room description format uses the world-model convention (name, description, visible things) rather than generic infrastructure formatting. | §5.10 |
| T238  | Automated | World-model state tier: create a Novel, populate rooms/things/exits via `convert_source` or CRUD tools. Assert `spec_health` reports world-model object counts. Persist and restart — assert world-model objects restored. Assert snapshot undo restores world-model state. Assert an empty Novel (no rooms) reports zero counts and parser commands return not-implemented. | REQ-195 |
| T239  | Automated | Parser command dispatch: populate a world model from the Appendix K fixture example. Assert `command("look")` returns the Entrance Chamber name, description, and visible things. Assert `command("go north")` enters the Hall of Statues. Assert `command("go north")` from the Hall hits the locked Obsidian Door and returns a rule-violation. Assert `command("open obsidian door")` succeeds. Assert `command("take serpent crown")` succeeds and removes the crown from the Throne Room. Assert `command("take entrance chamber")` returns a rule-violation (room is not a thing). Assert `command("xyzzy")` returns not-implemented. Assert `command("take something not here")` returns not-found. | REQ-196 |
| T240  | Automated | Room description generation: enter a room containing a supporter with an object on it and a closed container — assert the LOOK output shows name on first line, description verbatim, visible things with the containment chain expressed (supporter with object, container with its state noted). Assert the description matches the source text exactly — no generative prose appended. Assert exits appear in status-line context, not in the description body. | REQ-197 |
| T241  | Automated | World-model CRUD: create a room via `create_room("Vault", "A stone chamber.")`. Create a thing via `create_thing("crown", {location: "Vault", fixed: true})`. Create an exit via `create_exit("north", "Vault", "Gallery")`. Assert reverse exit created. Assert `command("look")` in the Vault shows the crown. Assert `command("take crown")` returns rule-violation (fixed). Delete room via `remove_room("Vault")` — assert crown and exits removed. Assert audit log records all mutations. Assert undo restores deleted room with contents. | REQ-198 |
| T242  | Automated | Property state tracking: load an adventure with a closed locked door and a closed openable container containing an object. Assert `command("go north")` through locked door returns rule-violation. Assert `command("open door")` returns an unlock-first notification or auto-unlock if capable. Assert `command("take bronzemedal")` with the lockbox closed returns rule-violation (container closed). Assert `command("open lockbox")` succeeds then `command("take bronzemedal")` succeeds. Assert property mutations are snapshot-able — undo reverts door to locked. | REQ-199 |
| T243  | Automated | Kind mechanical contracts: create a container thing (openable), a supporter thing, a door between two rooms, and a person in a room. Assert the container blocks content access when closed. Assert the supporter's surface things are visible without taking the supporter. Assert the door blocks passage when closed and permits passage when open. Assert a backdrop declared in a region is visible from every room in that region. Assert taking a supporter returns rule-violation (fixed by default). | REQ-200 |
| T244  | Automated | Hybrid source conversion: call `convert_source` with the Appendix K fixture example. Assert `[OK]` with object counts: 3+ rooms, 1+ things, exits. Assert linked annotation counts. Assert `command("look")` shows Entrance Chamber with murals lore reference. Assert `@npc(Serpent King Ghost)` created a Novel NPC in the Throne Room. Assert `@encounter` and `@trap` annotations are retrievable via `search_rules`. Call `convert_source` again on the same Novel — assert `[STATE_CONFLICT]`. Run `convert_source` with an assertion referencing an unknown kind — assert not-implemented warning with line number, and recognized assertions still populated. | REQ-201 |
| T245  | Automated | World-model resources: populate a world model with 3 rooms, 4 things, and exits. Read `room://<id>` — assert name, description, visible things, exits. Read `thing://<id>` — assert name, description, location, properties. Read `world://map` — assert adjacency list with all rooms and directional exits. Switch to Player badge — assert room and thing descriptions still visible but GM-only metadata (property values, containment chains) excluded. Read `world://map` as Player — assert room connectivity visible but GM-only annotations absent. | REQ-202 |
| T264  | Automated | Parser vocabulary extension: build a server for a ruleset whose equipment section defines "push" and "pull" as object interactions. Assert `world://kinds` reports `push` and `pull` under `parser_commands` with category `object_interaction` and source anchors. Build a ruleset-free server — assert `world://kinds` reports only the base vocabulary. Assert no fabricated verbs appear in either build. | REQ-222 |
| T246  | Automated | Combat-init guard: call `init_combat` with valid participants — assert `[OK]` and combat is active. Call `init_combat` again — assert `[STATE_CONFLICT]` with the message "Combat already active — call `end_combat` first." Assert the active combat's round and turn order are unchanged by the rejected call. | REQ-203 |
| T247  | Automated | Combat participant validation: call `init_combat(participants=["nonexistent"])` with no entities imported — assert `[NOT_FOUND]` enumerating "nonexistent" and listing valid entity/NPC IDs; assert no combat state is created; assert `session_recap` reports no pending confrontation. Call `init_combat` with a mix of valid and invalid participant IDs — assert `[NOT_FOUND]` enumerating only the invalid IDs; turn-order construction does not begin. | REQ-204 |
| T248  | Automated | Mid-combat participant changes: during active combat with participants ["hero", "goblin"], call `add_combat_participant("wizard")` — assert wizard inserted after hero in turn order. Call `remove_combat_participant("goblin")` — assert goblin removed and pointer advances if goblin was current. Remove last participant from a 1-participant combat — assert auto-`end_combat` with outcome "All participants removed." Assert undo reverts the participant change. Assert Player badge returns `[FORBIDDEN]`. | REQ-205 |
| T249  | Automated | Combat-round condition expiry: apply a condition with `rounds: 1` to a participant, call `advance_combat` once — assert condition removed after turn and audit log contains `[condition-expired]`. Apply condition with `rounds: 0` — assert no decrement. Apply condition with no `rounds` field — assert no auto-expiry. Apply condition with `rounds: 2` — assert decrements to 1 after first `advance_combat` and expires after second. | REQ-206 |
| T263  | Automated | Combat-navigation interaction: create a Novel with a populated world model, init combat. Assert `command("go north")` returns `[STATE_CONFLICT]` with combat-active message. Assert `command("look")` and `command("examine sword")` return `[OK]`. End combat — assert navigation resumes. Assert parser commands that don't move the player (take from current room, drop) continue to function during combat. | REQ-221 |
| T250  | Automated | Pattern Buffer convergence metric mapping: induce a missing-tool Pattern Buffer failure — assert it maps to MUST-coverage with the classification rule cited in DECISIONS.md (6). Induce a mechanics-fidelity failure — assert it maps to mechanics-fidelity. Induce a novel defect class — assert it is logged as process-compliance with a proposed metric mapping. Assert every mapped failure records the classification rule applied. | REQ-208 |
| T251  | Automated | Core-mechanic identification: build against the Captain Proton fixture (known core mechanic: d20 + stat vs target number). Assert the builder correctly identifies the core resolution mechanic. Assert DECISIONS.md (5) records the criterion used (a, b, or c from REQ-207) alongside the identified mechanic. Assert the core mechanic's confidence meets the ≥85% threshold. | REQ-207 |
| T252  | Automated | Cross-format consistency: after extraction, sample 10 items at random from RULESET_MODEL.md and ruleset_model.json — spanning at least three extraction categories. Assert all 10 items agree on name, source anchor, confidence label, and action classification across both formats. Introduce a deliberate mismatch — assert it is flagged as a discovery defect and recorded in the defect log with both values. Assert the build does not proceed to construction until the mismatch is resolved. | REQ-209 |
| T253  | Automated | Evidence record field contract: parse DECISIONS.md (6). Assert every evidence record contains workflow identifier, timestamp, environment pins (runtime version, OS, spec hash), pass/fail status, and a findings section with per-sub-check enumeration. Assert G0 records enumerate Appendix H and Appendix D items individually. Assert G2 records include per-contract coverage enumeration. Assert G4 records include per-test pass/fail counts. Assert G5 records include per-sub-workflow verdicts with blocking/non-blocking classification. | REQ-211 |
| T254  | Automated | Weighted table result: invoke `roll_on_table("wand_of_wonder", seed="42")` with a fixture table defining 1d100 → { 1-10: "Fireball", 11-20: "Stinking Cloud" }. Assert output includes dice notation, individual die face, matched range, and result text. Assert repeat with same seed produces identical result. Assert roll falling outside all ranges returns `[WARNING]` with raw roll and "no range matched" message. Assert table with interleaved lookup/dice-range rows is classified as generation-only. | REQ-213 |
| T255  | Automated | Table classification: invoke `roll_on_table` with a lookup-table name — assert the lookup table is not accessible through `roll_on_table`. Assert `roll_on_table.table` enum contains only generation tables; assert no lookup table appears in the enum; assert the D&D 5e build includes trinkets, madness tables, and at least one equipment/spell d100 table; assert a fixture ruleset with zero generation tables returns `[NOT_FOUND]` with a "no tables" message. | REQ-214 |
| T256  | Automated | Table content extraction: assert `spec_health` reports `generation_tables` count ≥ 6 for D&D 5e; assert each entry has dice_expression, ranges, and source_anchor; assert `roll_on_table("trinkets", seed="42")` returns a valid trinket from the SRD trinket list, not a bare d100 number. | REQ-215 |
| T257  | Automated | Badge filtering for generation tables: assert GM-only generation table returns `[FORBIDDEN]` under Player badge with table name visible; assert shared table returns result under both badges. assert Player badge_briefing hides GM-only table names. | REQ-216 |
| T258  | Automated | Condition tools: apply a condition — assert `[OK]` and condition appears on `character_sheet` and `badge_briefing`. Reapply same condition — assert `[WARNING]` with "Condition already active." and no duplicate in state. Remove condition — assert `[OK]`. Remove absent condition — assert `[WARNING]` with "Condition not present." Apply unknown condition — assert `[INVALID_INPUT]` with valid conditions enumerated. Player applies condition to another player's entity — assert `[FORBIDDEN]` with target entity ID. Apply condition with `rounds: 1` — assert GM `badge_briefing` shows the round count, Player `badge_briefing` does not. | REQ-217 |
| T259  | Automated | Ruleset-free build mode: start a build with B1="none". Assert the builder records ruleset-free mode in DECISIONS.md (1). Assert no chunked reading or extraction occurs. Assert the viability pre-check is skipped with "ruleset-free mode" recorded. Assert G0a passes with "no ruleset — skipped." Assert the server's `tools/list` contains all REQ-020 infrastructure categories. Assert no canonical lookup tools are registered (waived under REQ-013). Assert `search_rules` returns empty results with "no ruleset indexed." Assert `roll_on_table` returns content-absent message. Assert `spec_health` reports the sentinel ruleset hash and zero indexed items. Assert `intro` prompt is ≤300 words, identifies the server by name, includes "world-model-only" notice, and ends with four concrete next actions (one of which references world-model parser commands). Assert Phase 1 and Phase 2 convergence metrics record `ruleset-free` zero-case dispositions. Assert H1 passes with "ruleset-free" entry. Assert H10 skips confidence with "ruleset-free" annotation. | REQ-218, REQ-063, REQ-020 |
| T260  | Automated | Ruleset-free entity creation: with server in ruleset-free mode, call `create_character("Fen", description="tall, scarred", voice="clipped, wary", background="former guard", goals="find the Crown")`. Assert roster entry created with name and personality fields — no stats, no HP, no equipment. Assert `character_sheet("fen")` displays name and personality fields with no stat block. Assert `import_character("fen")` succeeds. Assert `init_combat(participants=["fen"], dangers=[{"name":"statue"}])` succeeds — Fen receives a turn in the order and auto-advances with `[auto]`. Assert `suggest_actions("fight")` returns empty list. Assert `entity://fen/personality` returns the populated fields. | REQ-219, REQ-077 |
| T261  | Manual   | World-model fixture replay: build a ruleset-free server and replay the Appendix W.3 golden transcript. Assert every interaction produces the expected prefix and tool name. Assert parser commands (look, go, take, open) resolve correctly against the world model. Assert badge gating — `init_combat` blocks under Player badge. Assert undo restores item position. Assert countdown lifecycle. Assert lore triggers on scene transition containing keyword. Assert `end_novel` confirmation workflow. Assert Appendix W.4 contracts are all exercised. | REQ-001, REQ-032, REQ-041, REQ-042, REQ-055, REQ-072, REQ-073, REQ-092, REQ-196, REQ-198, REQ-199, REQ-201 |
| T262  | Automated | Narrative POV directive: import two entities into a Novel, call `set_active_entity("character_01")`, assert `badge_briefing` includes a POV directive naming character_01 with narrative instruction and personality fields. Call `set_active_entity("character_02")` — assert directive updates to character_02. Remove all entities — assert omniscient empty-state marker. Assert the POV directive is present in the decision-critical group before entity listing. Assert the directive is never truncated under a tight briefing budget. | REQ-220 |
| T265  | Automated | POV omniscient mode: import two entities into a Novel. Call `set_active_entity("char_01", pov="omniscient")` — assert `badge_briefing` shows omniscient marker with char_01 as active entity. Call `set_active_entity("char_02")` — assert omniscient mode preserved with char_02. Call `set_active_entity("char_02", pov="character")` — assert character-locked POV for char_02. Assert Novel-scoped persistence: restart server, POV mode survives. | REQ-223 |
| T268  | Automated | Pause/resume context: call `set_pause_context(current_scene="tavern brawl", short_term_plans="Guards arrive in 2 rounds")` — assert `get_pause_context()` returns both fields. Restart server, resume same Novel — assert `intro` prompt includes GM context summary. Call `end_novel()` — assert `gm_context` cleared. Assert `set_pause_context` auto-captures faction clock states and NPC dispositions. | REQ-232 |
| T269  | Automated | Factions: call `create_faction("Merchant Guild", "Controls trade routes", goals=["Expand to East Dock"])` — assert faction created with `faction`-type clock. Assert `faction://<id>` returns faction with clock position. Call `advance_countdown` on faction clock — assert faction display updates. Assert faction clock advances on scene transition. Call `remove_faction` — assert faction and clock removed. | REQ-233 |
| T270  | Automated | Relationships: call `set_relationship("pc_1", "npc_guard", "suspicious", value=3)` — assert `get_relationships("pc_1")` includes the entry. Assert `character_sheet("pc_1")` shows "Relationships: Guard (suspicious)." Call `set_relationship("pc_1", "npc_guard", "ally")` — assert `badge_briefing` prompts GM to consider lore entry. Assert relationships saved in pause context. | REQ-236 |
| T271  | Automated | Clock types: create a `racing` clock pair with `opposes` — assert first to full wins, simultaneous complete produces tie. Create a `linked` clock chain — assert child clock triggers on parent completion. Create a `tug_of_war` clock — assert `retreat_countdown` removes ticks; retreat to zero does not trigger. Create a `mission` clock — assert it auto-decrements on `resume_novel`. | REQ-073 |
| T272  | Automated | Session notation: call `session_recap(format="lonelog")` — assert output in Lonelog notation (`###` scene headers, `@` actions, `=>` outcomes). Call `compress_audit(format="lonelog")` — assert compressed Lonelog entries. Assert audit entries contain optional `notation` field. Call `session_recap(format="markdown")` — assert current behavior unchanged. | REQ-072 |
| T273  | Automated | Player choices: call `present_choices("The goon blocks your path.", [{id:"talk", label:"Talk", description:"Persuade him"}, {id:"fight", label:"Fight", description:"Start combat"}])` — assert returns `[NEED_INPUT]` with two options. Call `respond(decision, "fight")` — assert `[choice]` audit entry and matching countdown advances. Call with `allow_freeform=true` — assert freeform text stored in audit entry. | REQ-235 |
| T274  | Automated | Secrets and knowledge: call `set_secret("confession", "The butler killed Lord Ashworth")` — assert GM-only lore entry created. Call `reveal_secret("confession", "pc_detective")` — assert `character_sheet("pc_detective")` includes "Known Information" section. Call `get_knowledge("pc_detective")` — assert returns the secret. Call `get_knowledge("pc_guard")` — assert does not return the secret. | REQ-234 |
| T275  | Automated | Session segmentation: run two sessions with different `TTRPG_SESSION_ID` values — assert audit log contains two `[session-boundary]` markers with session IDs and timestamps. Call `session_recap(session_id="s1")` — assert returns only entries from session s1. Call `session_recap(session_id="s2")` — assert returns only entries from session s2. Call `session_recap()` with no session_id — assert returns all entries. Call `spec_health` — assert per-session metrics array includes entry counts, timespans, and combat rounds for both sessions. | REQ-237 |
| T276  | Automated | Backup rotation: set `TTRPG_NOVEL_BACKUP_COUNT=3` — after 10 mutations, assert three rotated backup files exist (`.bak.1`, `.bak.2`, `.bak.3`) with descending modification times. Corrupt the primary `.json` file and `.bak.1` — restart the server, assert it restores from `.bak.2` and the audit log contains a `[restored-from-backup]` entry naming backup index 2. Call `end_novel` — assert all backup files and the primary are moved to `.trash/`. | REQ-238 |
| T277  | Automated | Audit log compaction: with `TTRPG_AUDIT_RETENTION_SESSIONS=1`, run two sessions — assert audit log has entries for both. Call `compact_audit_log()` — assert `[NEED_INPUT]` confirmation prompt. Confirm with `respond(decision, "yes")` — assert session 1 entries are gone from live audit log, `audit://novel/archive` contains session 1 summary with timespan, entry_count, confrontations, and significant_rolls. Call `session_recap(session_id="s1")` — assert returns the summary from archive. Call `session_recap()` with no session_id — assert returns only session 2 entries. Call `compact_audit_log(sessions=2)` — assert prompt to retain both sessions. Player badge `compact_audit_log` returns `[FORBIDDEN]`. | REQ-239 |
| T278  | Automated | Clone Novel: call `clone_novel("my-novel", "my-novel-fork")` — assert new Novel created at `novels/my-novel-fork.json`, `spec_health` lists both Novels, source Novel's active flag unchanged. Mutate the clone (add NPC) — assert source Novel unaffected. Call `clone_novel("my-novel", "my-novel-fork")` again — assert `[STATE_CONFLICT]`. Call `clone_novel("my-novel", "trimmed", trim_audit_sessions=2)` — assert cloned audit log contains only 2 most recent sessions. Player badge `clone_novel` returns `[FORBIDDEN]`. | REQ-240 |
| T279  | Automated | Checkpoints: call `set_checkpoint("before-ritual")` — assert checkpoint created, `list_checkpoints()` returns `{label: "before-ritual", ...}`. Perform 5 mutations. Call `restore_checkpoint("before-ritual")` — assert `[NEED_INPUT]`, confirm `yes`, assert all 5 mutations reversed. Call `remove_checkpoint("before-ritual")` — assert `list_checkpoints()` is empty. Set `TTRPG_MAX_CHECKPOINTS=1`, create two checkpoints — assert oldest discarded. Call `end_novel()` — assert checkpoints cleared. `export_novel("json", include_checkpoints=true)` — assert `checkpoints` key present. Player badge returns `[FORBIDDEN]`. | REQ-241 |
| T280  | Automated | Notes: call `set_note("twist", "The king is the dragon")` — assert stored with default `game_master` scope. Call `set_note("clue", "The key is in the clock", "player")` — assert stored with `player` scope. Call `list_notes()` under Game Master badge — assert returns both notes with their badge_scope values. Switch to Player badge — assert `list_notes()` returns only the `player`-scoped note; `notes://twist` returns `[FORBIDDEN]`; `notes://clue` returns full content. Assert Player `badge_briefing` `notes` section shows only the player-scoped note. Assert GM `badge_briefing` `notes` section shows both notes. Call `set_note("gm_only", "secret", "game_master")` under Player badge — assert `[FORBIDDEN]`. Call `remove_note("twist")` — assert note removed. `export_novel("json")` — assert `notes` key present with `{content, badge_scope}` objects. `end_novel()` — assert notes cleared. | REQ-242 |
| T281  | Automated | Novel interchange validation: call `export_novel("json")` — assert `manifest` object present with all declared fields (novel_format_version, server_spec_version, ruleset_hash, builder_implementation, adventure_module_slugs, adventures_embedded, property_groups_present, waiver_dependent_mechanics). Call `export_novel("json", "lore")` — assert only `format_version`, `manifest`, `lore`, and `novel_metadata` keys present. Call `export_novel("json", "gm_context")` — assert only `format_version`, `manifest`, `gm_context`, and `novel_metadata` present. Export with full scope, introduce a broken NPC reference in a lore trigger via manual JSON editing — call `import_novel(modified_data, "dry-run")` — assert validation failure reporting the broken reference with item path. Call `import_novel(modified_data, "replace")` — assert `[WARNING]` with broken reference enumerated but import succeeds. Call `import_novel(modified_data, "replace", strict=true)` — assert `[ERROR] [STATE_CONFLICT]` with failure list, state unchanged. Call `import_novel(modified_data, "dry-run", strict=true)` — assert `isError: false` with failure report. | REQ-096 |
| T282  | Automated | Story journal: call `record_story("moment", "The ferryman told a story...")` during an active scene with entity "eira" on scene "river-crossing" — assert entry appended to `story_journal` array in Novel JSON with `type: "moment"`, `entry`, `timestamp` (ISO 8601), `scene_anchor: "river-crossing"`, and `entity_ids: ["eira"]`. Call `undo` — assert story journal entry persists (not undone). Call `export_novel("json")` — assert `story_journal` key present with one entry. Call `record_story("moment", "...")` under Player badge — assert `[FORBIDDEN]`. Call `record_story("invalid_type", "...")` — assert `[ERROR] [INVALID_INPUT]` with valid type enumeration. Invoke `session_recap()` — assert `story_entries` field present as array with at most 10 most recent entries. Invoke `badge_briefing` with scene set to "river-crossing" and entity "eira" active — assert `story` section token present containing the ferryman entry. Call `end_novel()` — assert `story_journal` cleared. | REQ-246 |
| T283  | Automated | Adventure structure extraction: build with a non-Appendix-K adventure module (raw prose, no `## World`, no `@npc` annotations). Assert structural index produced with scene headings, NPC references, and location entries. Assert extracted NPC names appear in DECISIONS.md (4) adventure index. Assert a module with entirely garbled OCR text (no discoverable structure) produces an empty index without error. Assert no `[malformed-adventure]` flag for non-conforming adventures — structural extraction is independent of Appendix K validation. | REQ-247, REQ-171 |
| T284  | Automated | Adventure scene waypoint: load an adventure with a populated structural index. Call `set_scene_state(adventure_scene="Some Scene Heading")` — assert `badge_briefing` surfaces the adventure scene description labeled with the active adventure slug and scene heading. Assert adjacent scenes (previous and next in the structural index) are listed in `badge_briefing`. Assert the GM's free-text `description` remains independent and visible alongside the adventure scene. Call `set_scene_state(adventure_scene="")` — assert waypoint cleared, adventure scene absent from briefing. Call `set_scene_state(adventure_scene="nonexistent-heading")` — assert `[ERROR] [NOT_FOUND]` with nearby scene names enumerated. Assert changing the waypoint fires a scene transition hook (REQ-125). Switch to Player badge — assert adventure scene visible in briefing passively, `set_scene_state` with `adventure_scene` returns `[FORBIDDEN]`. | REQ-250, REQ-125, REQ-032 |
| T285  | Automated | Adventure overview resource: load an adventure with populated structural extraction. Call `resources/read` on `adventure://<slug>/overview` — assert premise, NPC list with role descriptions, location list, faction descriptions, and scene count present. Switch to Player badge — assert GM-only sections (NPCs marked Keeper-only) hidden; premise and shared locations visible. Call `load_adventure` on a module with empty structural extraction — assert `[WARNING]` with "No structured overview available." | REQ-248, REQ-079, REQ-032 |
| T286  | Automated | Adventure navigation resource: load an adventure with populated structural index. Call `resources/read` on `adventure://<slug>/navigation` — assert scene list in order with heading anchors. Set adventure scene waypoint to scene heading — assert current waypoint marked with `[→]`, adjacent scenes indicated as previous/next. Switch to Player badge — assert GM-only section headings are hidden; shared scene headings visible. Call with no adventure loaded — assert `[ERROR] [STATE_CONFLICT]`. Load an adventure with empty extraction — assert `[WARNING]` with "No navigation index available." | REQ-249, REQ-250, REQ-032 |
| T287  | Automated | Adventure pre-population: build with a non-Appendix-K adventure containing discoverable NPC names (bolded name + stat-like value) and location headings with prose. Call `load_adventure` — assert NPC entities created in Novel with extracted names; assert lore entries created keyed by location heading names; assert factions created from organization references. Assert load response includes summary with item counts. Assert NPCs carrying only a name and no parseable stats (skeletal entities) participate in combat with `[auto]` turns per REQ-043. Assert duplicate-name Novel state is skipped with note in load response. Assert fuzzy-match suggestion appears when extracted NPC name matches a ruleset monster entry. | REQ-079, REQ-247, REQ-043 |
| T288  | Automated | Synthesis auto-activation on adventure load: load an adventure with enrichment active and NPC references matching synthesis voice_examples. Assert ruleset-native synthesis voice examples are auto-activated for the GM — items appear active in `badge_briefing` and synthesis resources immediately after load completes. Assert community enrichment items remain inert with activation prompt in load response. Load an adventure with no matching enrichment items — assert no augmentation section, no auto-activation. | REQ-229, REQ-080 |
| T311 | Automated | Generation intent guard: call `generate_adventure("create an adversary capable of defeating Data")` — assert `[WARNING]` listing the guard concern: power-inversion intent, fabricated mechanics required. Assert no adventure content is produced. Call `generate_adventure("!force create an adversary capable of defeating Data")` — assert adventure scaffold generated, `[generation-guard-overridden]` audit entry recorded. Call with a ruleset that defines challenge ratings — assert `generate_encounter("dragon fight")` caps danger difficulty against party level and warns on exceedance. Assert `badge_briefing` under GM badge includes guard-fire advisory when a guard fired in the current session. | REQ-251 |
| T312 | Automated | Narrative fast-forward: call `set_scene_state("The castle", fast_forward={interval:"three days travel", changes:[{npc_id:"guard_1", location:"castle gate"}]})` — assert audit entry `[fast-forward]` recorded with interval, countdown adjustments, and NPC update. Assert narrative countdown advanced by 3-day-equivalent ticks. Assert guard_1 location updated. Assert `undo` restores pre-fast-forward state. Assert fast-forward with `skip_countdowns: true` preserves countdown positions. Assert fast-forward + `skip_transition_hook` returns `[ERROR] [INVALID_INPUT]`. Assert Player badge returns `[FORBIDDEN]`. | REQ-252, REQ-073, REQ-125 |
| T313 | Automated | Tool-output verbosity control: call `lookup_spell("fireball", terse=true)` — assert output includes spell name, level, and damage die; assert verbal/somatic/material component text absent. Set `player_signal("detail", "terse")` — assert subsequent `search_rules("grapple")` returns most relevant sentence only. Assert `advance_combat` under terse mode returns participant name + action result only, no full roll transparency. Assert `detail=normal` restores full output. Assert per-call `terse: true` overrides session detail signal. Assert `detail=rich` returns full descriptions with lore trigger notifications. | REQ-253, REQ-196, REQ-069 |
| T314 | Automated | Boundary signal propagation: set boundary "spiders" — assert recorded. GM badge_briefing — assert Boundaries advisory section with "spiders" and "Do not narrate, imply, or introduce content" directive, positioned before scene state. Call `set_scene_state("a cavern full of spiders")` — assert `[WARNING]` boundary collision identified, operation proceeds. Call `create_npc("spider queen")` — assert `[WARNING]`. Call `set_scene_state("a sunny meadow")` — assert `[OK]` no warning. Player badge — assert Boundaries absent from briefing. Remove boundary — section absent from subsequent briefing. Set two boundaries ("spiders", "drowning") — assert both listed in advisory. | REQ-255, REQ-069, REQ-128 |
| T308 | Automated | Enrichment population during spec-driven updates: perform a Minor spec-driven update that adds a new `lookup_<category>` tool. Assert the gap audit's implemented-disposition rows include the new tool. Assert DECISIONS.md records the added synthesis item count per module for the new surface. Assert the merged enrichment manifest contains new `[ruleset]`-tagged items in action_patterns or supplementary_guidance that reference the new tool. Assert existing enrichment items for other modules are unchanged (append-only). Assert a patch-level update with no new surfaces skips the synthesis population step with "no new surfaces — skipped" annotation. | REQ-243 |
| T315 | Automated | Rename Novel: create a Novel with slug "my-novel". Call `rename_novel("my-novel", "my-novel-v2")` — assert `[OK]`, novel now accessible under new slug. Call `resume_novel("my-novel")` — assert `[STATE_CONFLICT]`. Call `resume_novel("my-novel-v2")` — assert Novel state restored. Assert renamed Novel metadata reflects new slug in `spec_health`. Assert rename to existing slug returns `[STATE_CONFLICT]`. Assert rename of non-existent Novel returns `[NOT_FOUND]`. Assert Player badge returns `[FORBIDDEN]`. | REQ-256 |
| T316 | Automated | List Novels: create two Novels (A and B). Call `list_novels()` — assert both slugs listed with metadata (name, last_played, entity_count, active). Assert active Novel marked. Call `end_novel` on A — assert A absent from listing. Call `list_novels()` on a clean server — assert empty list with empty-state marker. Assert `list_novels()` is callable regardless of badge — both Player and Game Master see same listing. | REQ-257 |
| T317 | Automated | Novel info: create a Novel with entities, NPCs, lore entries, and an active adventure. Call `novel_info()` — assert output includes slug, name, created_at, last_played, entity_count, adventure_module, session_count, and total_combat_rounds. Assert `novel_info(slug="my-novel")` with a non-active Novel returns same fields. Assert `novel_info(slug="nonexistent")` returns `[NOT_FOUND]`. Assert `novel_info(format="json")` returns all metadata fields in structured format matching `spec_health` novel fields. | REQ-258 |
| T318 | Automated | Update Novel description: create a Novel with name "Original Name". Call `update_novel(description="A tale of adventure")` — assert `[OK]`, description stored. Call `novel_info()` — assert description field present. Call `badge_briefing` — assert description appears under novel token. Call `update_novel(name="New Name", description="Revised")` — assert both fields updated. Call `update_novel()` with no fields — assert `[ERROR] [INVALID_INPUT]`. Assert Player badge returns `[FORBIDDEN]`. Assert `end_novel` then `resume_novel` — assert description persists. | REQ-259 |
| T319 | Automated | Granular enrichment activation: build with enrichment active across 6 modules. Call `activate_synthesis_module("lore_templates")` — assert `[OK]`, module activated and items appear in `badge_briefing`. Call `deactivate_synthesis_module("lore_templates")` — assert module deactivated, items absent from `badge_briefing`. Call `activate_synthesis_module("unknown_module")` — assert `[NOT_FOUND]` with valid module names enumerated. Assert `spec_health` reports per-module activation status. Assert activation is Novel-scoped — restart restores module activation states. Assert Player badge returns `[FORBIDDEN]` on activation/deactivation of non-`[player]` items. Assert Player can call `deactivate_synthesis_item` on own `[player]` items — item hidden from player briefing. Assert Player calling `activate_synthesis_item` on a `[ruleset]` item returns `[FORBIDDEN]`. Assert `revert_synthesis` resets all modules to inert. | REQ-260 |
| T320 | Automated | Player synthesis: build with enrichment active. Call `player_synthesize("action_patterns", "feint-suggestion", "When I feint, suggest deception check")` — assert item appears in Player `suggest_actions` output and in GM `badge_briefing` (default shared scope). Call `player_synthesize("voice_examples", "growl", "Get away!", [], "player")` — assert item visible to Player badge, absent from GM badge. Call `player_list_synthesis()` — assert both items listed with module, key, preview, and scope. Call `player_remove_synthesis("action_patterns", "feint-suggestion")` — assert item removed. Call `player_remove_synthesis` on a Tier 1 `[ruleset]` item — assert `[RULE_VIOLATION]`. Call `list_synthesis_items()` as GM — assert `[player]` items visible with source tag. GM attempts `player_synthesize` — assert `[FORBIDDEN]`. Assert player items survive server restart. Assert `revert_synthesis` does not remove `[player]` items. Assert per-module cap of 15 enforced. | REQ-261 |
| T321 | Automated | Novel synthesis tier: create a Novel with populated NPCs, lore entries, story journal entries, and faction state. Call `synthesize()` — assert items tagged `[novel]` appear in `list_synthesis_items(tier=3)`. Assert source citations use `novel://<slug>/` prefix. Call `revert_synthesis` — assert `[novel]` items persist unchanged. Call `revert_synthesis` — assert `[novel]` items removed. Call `end_novel` — assert `[novel]` items discarded with Novel JSON. Assert Player may deactivate `[novel]` items scoped `shared` or `player` via `deactivate_synthesis_item`. | REQ-262, REQ-103, REQ-265, REQ-260 |
| T322 | Automated | Novel enrichment synthesis: create a Novel with an NPC possessing personality fields (description, voice, goals). Call `synthesize()` — assert voice example items produced with `source: novel://<slug>/npc/<npc_id>`. Call again with no state changes — assert up-to-date message with ISO 8601 timestamp. Call `synthesize(force=true)` — assert re-synthesis regardless of staleness. Assert Player badge returns `[FORBIDDEN]`. Assert items are inert (inactive) by default — GM must activate via `activate_synthesis_item`. | REQ-263 |
| T323 | Automated | Novel synthesis auto-trigger: set `TTRPG_SYNTHESIS_AUTO_TRIGGER=on_session_start`. Change `TTRPG_SESSION_ID` — assert `synthesize` triggers, items appear in `list_synthesis_items(tier=3)` with `activated: false`. Set to `off` — assert no auto-trigger on session change. Set to `on_scene_change` — call `set_scene_state("new scene")` — assert synthesis triggers. Assert `spec_health` shows `synthesis_auto_trigger: <threshold>`. Create a ruleset-free Novel with no state — assert synthesis produces `[novel] [empty — no state]` markers. | REQ-264 |
| T324 | Automated | Novel enrichment removal: create a Novel with `[novel]` enrichment items. Call `revert_synthesis()` — assert `list_synthesis_items(tier=3)` returns 0 items. Assert Tier 1 (`[ruleset]`) items unchanged. Assert Tier 2 (`[supplementary]`) items unchanged. Call `revert_synthesis` — assert Tier 2 items removed, `[novel]` items remain at 0 (already removed). Call `revert_synthesis()` on empty tier — assert `[OK] No novel enrichment to revert`. Assert Player badge returns `[FORBIDDEN]`. | REQ-265, REQ-103 |
| T325 | Automated | Novel enrichment confidence: create a Novel with an NPC carrying explicit personality text. Call `synthesize()` — assert voice example item carries `[novel] [MEDIUM]`. Create a story journal entry and call synthesis — assert theme-detection item carries `[novel] [LOW]`. Edit the NPC personality, call synthesis — assert `collected_at` timestamp updated. Assert `MEDIUM` items always correspond to explicit-field sources; `LOW` items always correspond to inference sources. | REQ-266 |
| T326 | Automated | Synthesis in badge_briefing: create a Novel with active synthesis items. Call `badge_briefing` under GM badge — assert synthesis items appear under respective sections tagged `[supplementary]` alongside `[ruleset]`, `[vendor]`, and `[player]` items. Switch to Player badge — assert only synthesis items with scope `shared` or `player` visible; `game_master`-scoped items absent. Call `deactivate_synthesis_item` on a synthesis item scoped `shared` — assert item hidden from Player badge. Call `revert_synthesis` — assert no synthesis section in `badge_briefing` (no empty-section marker). | REQ-265, REQ-032, REQ-260 |
| T327 | Automated | Synthesis in dashboard: create a Novel with synthesis items in voice_examples and lore_templates modules. Call `resources/read` on `synthesis://status` — assert synthesis column present in per-module table alongside Ruleset Wisdom column. Assert non-zero counts for voice_examples and lore_templates in the synthesis column. Call `spec_health` — assert `synthesis_status` with per-module activated/total counts and `synthesis_last_run` timestamp. Call `revert_synthesis` — assert synthesis column shows zero counts. | REQ-266, REQ-230 |
| T334 | Automated | Server notes: call `set_server_note("campaign-bible", "The old gods were banished to the outer dark")` — assert stored. Call `list_server_notes()` — assert returns `{key: "campaign-bible", preview: "The old gods were banished to the outer dark"}`. Call `server-notes://campaign-bible` — assert full content returned. Restart server — assert server note survives. Create and `end_novel` — assert server notes persist. Switch to Player badge — assert `set_server_note`, `remove_server_note`, `list_server_notes`, and `server-notes://<key>` all return `[FORBIDDEN]`. Call `spec_health` — assert `server_notes` count present. Call `remove_server_note("campaign-bible")` — assert `list_server_notes()` is empty. | REQ-285 |
| T289    | Automated | Safety protocol status: build a server with a known badge-gating defect — assert `spec_health.safety_protocols.badge_boundary` reports `offline`. Fix the defect — assert reports `online`. Induce a non-blocking failure in S16 (narrative state) — assert relevant property reports `degraded`. Assert all four properties present in `spec_health` output. Assert a ruleset-free build reports `state_loss` and `badge_boundary` as `online`, `data_corruption` and `unrecoverable_crash` as `unverified`. | REQ-269 |
| T290    | Automated | Artifact version identification: build a server and inspect the first line of each handoff artifact — assert each begins with `<!-- built against Holonovel spec vXX.XX.XX -->` matching `spec_health.spec_version`. Remove the comment from one artifact — assert handoff verification flags a defect. Assert version mismatch between artifact and `spec_health` is a handoff defect. | REQ-270 |
| T291    | Automated | AGENTS.md structure: build a server and inspect AGENTS.md — assert four sections present in order: Code Map, Verification, Troubleshooting, Build Context. Assert each section has non-empty content. Assert Build Context includes spec version, build date (ISO 8601), builder model identifier, ruleset content hash, and holonovel version. Assert missing section or empty content produces a handoff defect. | REQ-271, REQ-153 |
| T292    | Automated | Stock elements catalog: build a server against Tin Lanterns — assert DECISIONS.md (4) contains a `stock_elements` table with character archetype, monster, location, lore pattern, and generation table entries. Rebuild with unchanged ruleset hash — assert the catalog is referenced, not re-extracted. Mutate the source — assert delta extraction updates only changed entries. | REQ-272, REQ-044 |
| T293    | Automated | Reproducibility tolerance: execute Phase 1 independent verification against a known-good build. Assert seed-pinned dice and status prefixes match exactly. Assert natural-language prose matches structurally (non-empty, ±20% word count) without verbatim comparison. Assert a dice mismatch classifies as Discrepancy. Assert a prose-only mismatch classifies as Unclassifiable. Assert count mismatch within zero tolerance classifies as Pin drift. | REQ-273 |
| T294    | Automated | Verifier confidence score: execute Phase 2 comparison with 3 Discrepancies out of 10 total comparisons — assert confidence score = 0.70 (FAIL). With 1 Discrepancy, 2 Pin drifts (operator-confirmed), 7 matches — assert score = 0.84 (PARTIAL). With 0 Discrepancies, 10 matches — assert score = 1.0 (PASS). Assert per-workflow component weights are recorded in verifier evidence. | REQ-274 |
| T295    | Automated | Evidence hash commitment: compute SHA-256 of DECISIONS.md before Phase 1 and record it. After operator supplies unredacted DECISIONS.md, compute its hash — assert match. Modify the unredacted DECISIONS.md after the commitment — assert hash mismatch recorded as "evidence tampered" Discrepancy. Assert mismatch blocks Phase 2. | REQ-275 |
| T296    | Automated | Verifier model criteria: execute independent verification with same-provider-same-architecture model — assert verifier records the finding but does not block. Execute with different-provider model — assert no finding. Assert verifier evidence record includes model identity fields. | REQ-276 |
| T297    | Automated | Fixture evolution: modify the Tin Lanterns ruleset source such that Appendix B.3 golden transcript fails replay. Assert the fixture version bumps per the evolution contract. Assert the citing REQ is recorded in the fixture changelog comment. Assert transcript and witness values are updated. Assert a fixture with mismatched transcript and witness values is flagged as a spec defect by `npm run validate`. | REQ-277 |
| T298    | Automated | Build-phase-map staleness: run `npm run assemble` — assert `spec/build-phase-map.md` content hash comment is updated. Modify one spec file — assert `npm run validate` reports a stale-hash warning with the file name. Compute the current hash and overwrite the stale one — assert warning clears on next validate run. | REQ-278 |
| T348 | Automated | Counterpart AI role: set `TTRPG_AI_ROLE=counterpart`. Call `set_badge("player")` — invoke `badge_briefing` and assert orientation content (foundations, anti-slop, tone) is GM-oriented. Call `set_badge("game_master")` — assert orientation content is Player-oriented. Call `set_badge("none")` — assert Editor-badge briefing per REQ-136. Set `TTRPG_AI_ROLE=game_master` — assert `badge_briefing` orientation is always GM-oriented regardless of active badge. Set `TTRPG_AI_ROLE=player` — assert orientation is always Player-oriented. | REQ-304 |
| T349 | Automated | Observer mode: call `set_badge("observer")` — assert returns `[OK] Active badge: observer — read-only spectator mode`. Call `set_scene_state("test")` — assert `[FORBIDDEN]` with corrective action citing `set_badge`. Call `help()` — assert succeeds. Call `badge_briefing` — assert orientation includes dual-role instruction. Call `character_sheet(entity_id)` — assert succeeds. Switch to player badge then back to observer — assert `[FORBIDDEN]` still applies for mutating tools. | REQ-305 |
| T350 | Automated | Adjustable autonomy: call `set_autonomy({level: "full", confirmation: "auto", safety: "safe", creativity: "standard"})` — assert `[OK]`. Invoke `badge_briefing` — assert autonomy state visible. Set `level=mechanical_prompt, confirmation=prompt` — assert AI auto-narrates exploration but pauses via `present_choices` for combat actions; human responds via `respond`. Set `safety=safe` — assert lethal damage reduces HP to 1 and applies incapacitation instead of death. Set `safety=hardcore` — assert death permanent, no warnings. Set `creativity=chaotic` — assert AI makes unexpected, dramatic choices. Assert Player badge `set_autonomy` returns `[FORBIDDEN]`. Assert autonomy persists across Novel restart. | REQ-306 |
| T351 | Automated | Entity presence: call `set_scene_state("Dark corridor", characters_present=["rogue_01"])` — assert `party://current` shows rogue present, wizard not present with `[not present]`. Call `set_party_presence(["wizard_01"], "Camp")` — assert scene description unchanged, wizard present. Call `set_party_presence([])` — assert all entities not present. Entity listing in `badge_briefing` — assert `[not present]` markers and `last_location` fields. `set_active_entity` to non-present entity — assert no error, `knowledge_state` renders "Entity not present" marker. | REQ-307 |
| T352 | Automated | Knowledge gating by presence: set scene to corridor with rogue only present. Call `reveal_secret("floor_trap", "rogue_01")` — assert rogue's `knowledge_state` includes trap. Set scene to camp with wizard only present — assert wizard's `knowledge_state` does NOT include trap. Reunite party (`characters_present` includes all). Assert rogue's trap knowledge retained, wizard's still excludes trap. Call `reveal_secret("floor_trap", "wizard_01")` — assert wizard now knows trap. | REQ-308 |
| T353 | Automated | World and narrative surface prominence: build with `TTRPG_WORLD_PROMINENCE=secondary` — assert World tools in secondary help category, world-model state folded into scene state in `badge_briefing`, `suggest_actions("go north")` returns no parser commands. Build with `TTRPG_WORLD_PROMINENCE=visible` — assert world-model and narrative tools in primary help categories, dedicated world-model state section in `badge_briefing` with empty-state marker when unpopulated, `suggest_actions("go north")` returns parser command alongside TTRPG tools. Build with `TTRPG_WORLD_PROMINENCE=prominent` — assert parser `command` is a top-level help entry, world CRUD tools in primary setup category, world-model state in decision-critical `badge_briefing` group, `suggest_actions("go north")` returns parser command before TTRPG tools. Assert ruleset-free build skips B12 and records no `TTRPG_WORLD_PROMINENCE` value. | REQ-309 |
| T301 | Automated | Ruleset-native enrichment extraction: run Discovery on a ruleset with GM advice chapters and example-of-play dialogues. Assert enrichment items produced in ≥4 of 7 modules with `[ruleset]` tag and source anchors. Assert items are sorted into correct module slots (example-of-play → voice_examples, GM advice → briefing_order, etc.). Assert ruleset-free mode (B1=none) produces empty enrichment modules recorded as "ruleset-free" in DECISIONS.md. | REQ-225 |
| T302 | Automated | Narrative voice profiles: run Discovery on a ruleset with `Suggested Reading`, `Suggested Viewing`, or equivalent sections. Assert narrative voice items extracted with source anchors. Assert items tagged `[ruleset]` and placed in narrative_voices module. Assert ruleset without such sections produces no narrative voice items. | REQ-226 |
| T303 | Automated | Two-tier enrichment model: build with enrichment active. Assert `list_synthesis_items(tier=1)` returns only ruleset-native `[ruleset]` items. Assert `list_synthesis_items(tier=2)` returns `[supplementary]` items. Assert `revert_synthesis` removes Tier 2 only. Assert Tier 1 items survive `revert_synthesis`. | REQ-227 |
| T304 | Automated | Enrichment consistency during spec-driven updates: perform a Minor spec-driven update that adds a tool surface. Assert the gap audit records the old surface was removed and enrichment items for that surface are flagged for GM review. Assert `badge_briefing` under GM badge includes advisory about removed surface. Assert `revert_synthesis`+re-activation preserves existing items for unchanged surfaces. | REQ-228 |
| T305 | Automated | Adventure synthesis linkage: call `load_adventure` on an adventure with synthesis data. Assert adventure-linked enrichment items appear in `list_synthesis_items` tagged with the adventure slug. Assert `end_novel` removes adventure-linked items. Assert `revert_synthesis` does not remove adventure-linked items. | REQ-229 |
| T306 | Automated | Enrichment status dashboard: call `resources/read` on `synthesis://status` — assert per-module table with ruleset, community, and novel columns and per-tier counts. Assert `spec_health` reports synthesis_status with per-module activated/total counts. Assert dashboard is accessible under both badges. | REQ-230 |
| T307 | Automated | Per-module enrichment toggle: call `toggle_enrichment_module("voice_examples", false)` — assert voice_example items absent from `badge_briefing`. Call `toggle_enrichment_module("voice_examples", true)` — assert items restored. Assert toggle of unknown module returns `[NOT_FOUND]`. Assert toggle is Novel-scoped and persists across restarts. | REQ-231 |
| T309 | Automated | Convergence cache key: build with the same ruleset twice. On the second build, assert the cache-key match triggers "cached — skipping Discovery" with the date of the prior build. Assert DECISIONS.md records the cache hit. Change one section of the ruleset — assert cache miss triggers full Discovery. Assert the cache key is computed from the ruleset content hash plus the B10 provider doc hash. | REQ-244 |
| T310 | Automated | Pre-computed enrichment manifest: build holonovel/ with a provider doc containing synthesis data. Assert `holonovel/build/enrichment.json` is populated with `[ruleset]` items per module. Assert manifest includes items with source anchors, confidence, and module tags. Assert ruleset-free build produces empty `enrichment.json`. | REQ-245 |
| T328 | Automated | Narrative orientation: call `session_recap` after a session with scene changes. Assert `narrative_orientation` section includes recent plot beats, unresolved threads, and party state. Call `end_novel` then `create_novel` — assert `session_recap` returns empty orientation. Assert orientation references lore entries that fired during the session. | REQ-279 |
| T329 | Automated | Source-anchor citation: call `lookup_spell("fireball")` — assert output includes source anchor (section/file reference). Call `lookup_monster("goblin")` — assert source anchor present. Assert `lookup_equipment` output includes source anchor. Assert ruleset-free mode does not include source anchors in lookup responses. | REQ-280 |
| T330 | Automated | Narrative-threads section token: create a Novel, set a lore entry with triggers, and call `badge_briefing` under GM badge. Assert Narrative Threads section token appears with threads derived from lore entries. Assert each thread includes trigger, content preview, and priority. Assert empty-Novel briefing omits the Narrative Threads section. | REQ-281 |
| T336 | Automated | Knowledge-state section token: call `reveal_secret("floor_trap", "rogue_01")`. Assert `badge_briefing` under GM badge includes `knowledge_state` section token listing the revealed secret. Set active entity to an entity not present in the current scene — assert section renders "[Entity not present in this scene]" marker. Assert Player badge sees only own-entity knowledge. Assert empty Novel renders the empty-state marker. | REQ-286 |
| T331 | Automated | Scene-state ledger: call `set_scene_state("Tavern", "Merry tavern")`. Assert badge_briefing includes scene token with current location and description. Call `set_scene_state("Forest", "Dark forest")` — assert prior scene pushed to ledger. Call `undo` — assert ledger restored to prior scene. Assert `session_recap` includes scene transitions. | REQ-076 |
| T332 | Automated | NPC voice directive: call `set_personality(npc_id, voice="Gruff and impatient")` on an NPC. Assert `badge_briefing` under GM badge includes NPC voice directive with the personality fields. Assert the voice directive includes positive framing ("SHALL") and negative counsel ("should NOT") per REQ-282. Assert Player badge does not see GM-only voice directives. | REQ-282 |
| T333 | Automated | Verb coverage tiers: build with a populated world model containing openable doors, readable books, and wearable items. Assert `command("help")` enumerates core tier verbs (7), standard tier verbs (12+ depending on world-model supports), and extended tier verbs per REQ-222. Assert ruleset with no additional verbs reports 0 extended. Assert `command("verbs")` produces same output as `command("help")`. | REQ-283 |
| T335 | Automated | Vow tracking: call `set_vow("vengeance", "Track down and defeat the brigand leader", entity_id)`. Assert `badge_briefing` includes Vows section with the vow description, target, and entity. Call `resolve_vow("vengeance")` — assert vow marked resolved in briefing. Call `forsake_vow("vengeance")` — assert vow marked forsaken with `[vow-forsaken]` marker. Assert `list_vows()` returns all active/forsaken vows. | REQ-289 |
| T337 | Automated | Oracle tool: call `ask_oracle("Is the door locked?", "unlikely", seed="test")` — assert returns Yes/No with modifier annotation. Call `ask_oracle("What's behind the door?", "50_50", seed="test")` — assert returns result. Assert deterministic output with same seed. Assert `ask_oracle("...")` with likelihood omitted defaults to `50_50` and returns a result. | REQ-291 |
| T338 | Automated | Adventure catalog: call `list_adventures()` on a server with indexed adventure modules. Assert each entry includes slug, title, and ruleset compatibility. Call `list_adventures(filter="fantasy")` — assert filtered results. Assert `list_adventures()` on empty catalog returns empty-state marker. | REQ-292 |
| T339 | Automated | Genre declaration: call `set_genre("horror")` on an active Novel. Assert `novel_info()` reports genre. Assert `spec_health` includes genre field. Call `set_genre("fantasy")` — assert updated. Assert `set_genre("invalid_genre")` returns `[ERROR] [INVALID_INPUT]` with valid genres enumerated. | REQ-294 |
| T340 | Automated | Genre-filtered generation: set genre to "horror" on a Novel. Call `generate_encounter("forest clearing")` — assert encounter elements include horror-appropriate tropes. Set genre to "fantasy" — assert encounter elements shift to fantasy-appropriate tropes. Assert `generate_adventure("dungeon")` respects genre in adventure scaffold. | REQ-295 |
| T341 | Automated | Knowledge-graph resource: create a Novel with entities, NPCs, lore entries, and an adventure. Call `graph://novel` — assert nodes for entities, NPCs, and lore entries with edges for relationships (disposition, location, adventure linkage). Assert `graph://novel?format=json` returns structured data. Assert empty Novel returns graph with only the novel root node. | REQ-296 |
| T342 | Automated | Dynamic lore: call `set_lore_entry("tavern_secret", "The barkeep is a retired assassin", triggers=["tavern", "barkeep"])`. Assert `badge_briefing` includes lore item when scene description matches triggers. Call `toggle_lore_entry("tavern_secret")` to disable — assert item absent from briefing. Call `toggle_lore_entry("tavern_secret")` to enable — assert item returns. Call `remove_lore_entry("tavern_secret")` — assert item removed. | REQ-083 |
| T343 | Automated | Adjusted thresholds: build with a ruleset whose indexed-item count exceeds 200. Assert the confidence threshold is lowered per REQ-098 and DECISIONS.md records the adjusted threshold with justification. Assert ruleset under 200 indexed items uses the standard threshold. Assert adjusted thresholds survive convergence re-verification. | REQ-299 |
| T344 | Automated | Structured failure diagnostics: induce a Gate 2 failure on init_combat turn-order mismatch. Assert DECISIONS.md (5) contains a diagnostic record with gate name, failing test ID, REQ citation, expected turn order, actual turn order, and a diff. Assert resolution field transitions from pending to converged on fix. | REQ-300 |
| T345 | Automated | Convergence loop audit trail: run convergence with ≥2 iterations. Assert DECISIONS.md (5) contains traceable records per iteration: iteration number, REQ/test addressed, change summary, re-test result, and token cost. Assert convergence_summary includes total iterations, final disposition per REQ, and aggregate token cost. | REQ-301 |
| T346 | Automated | Per-section content hashing: build with a ruleset containing 10 sections. After initial build, change one section's content. Assert the delta detection identifies the single changed section. Assert only the changed section re-runs extraction. Assert `spec_health.section_hashes` includes per-section hashes. Assert unchanged sections produce "[section unchanged — re-validating from previous build]" annotations. | REQ-302 |
| T347 | Automated | Scoped re-verification: perform an incremental extraction where 2 of 5 sections changed. Assert Pattern Buffer sub-workflows for unchanged sections are skipped with annotations. Assert cross-section sub-workflows run in full. Assert final Pattern Buffer summary distinguishes "skipped (unchanged)" from "passed" sub-workflows. | REQ-303 |
| T354 | Automated | Implicit action hints: create a world model with a locked chest and an iron key in the room. Call `command("open chest")` — assert `[RULE_VIOLATION]` with hint naming the iron key and its location. Call `command("unlock chest")` — assert `[OK]`. Call `command("open chest")` — assert `[OK]`. Remove the iron key, call `command("open chest")` on a new locked chest — assert `[RULE_VIOLATION]` with no hint (no reachable key). Assert hint format matches: `Hint: You need the <object name> (<location>) first.` A readable inscription inside a closed transparent jar — assert `Hint: The inscription is inside the glass jar — open it first.` A vehicle in an adjacent room with an open exit — assert direction-bearing hint for `command("enter raft")`. A switched-off lantern — assert no hint. A container in an adjacent room — assert no hint (not covered by implication contract). | REQ-284 |
| T355 | Automated | Campaign Memory: after a session with 2 NPCs, 3 scene changes, 1 faction clock advancement, and 1 story journal decision, assert `spec_health` campaign_memory counts ≥ thresholds. Assert `badge_briefing` includes `## Campaign Memory` section with facts prioritized by scene relevance. Create an NPC with personality fields — assert per-NPC fact appears after NPC participates in combat (REQ-043). Advance a faction clock — assert per-thread fact appears. Change scene 3 times — assert per-location facts appear. Assert `export_novel("json")` includes `campaign_memory`. Assert facts survive Novel persistence. | REQ-310 |
| T356 | Automated | NPC memory model: create NPC "Blacksmith" with `goals="Repay debt"`. Import player entity "Fighter". Set scene to forge with both present. Call `apply_condition("blacksmith", "frightened")` — assert NPC memory records the event with `disposition: hostile`. Assert `badge_briefing` `## NPC Memory` shows emotional state and the interaction. Set scene with only Fighter present — assert Blacksmith memory absent (not present in scene). Switch back — assert memory persists. Create second NPC "Innkeeper" with no prior contact — assert "no prior contact" marker. Assert `spec_health.npc_memory_count ≥ 1`. | REQ-311, REQ-307, REQ-308 |
| T357 | Automated | Pre-narration validation: create NPC, apply dead condition. Simulate AI narration claiming the dead NPC speaks. Assert engine rejects with `[REJECTED]` and corrective suggestion citing deceased state. Assert `spec_health.narration_rejection_count: 1`. Set `TTRPG_NARRATION_VALIDATION=off` — assert same narration passes through. Assert validation rejects damage claims exceeding ruleset maxima. Assert Player badge never receives invalid narration text. | REQ-312 |
| T358 | Automated | World reactivity: set `TTRPG_WORLD_REACTIVITY=on`. Create NPC with `goals="Steal the crown"`. Call `set_scene_state("Throne room")` — assert `## World in Motion` section includes NPC goal pursuit entry. Create relationship (entity A `ally` entity B), then flip entity A to `rival` — assert campaign memory fact propagated to entity B. Accept a world change — assert it appears in campaign memory. Defer a change — assert it re-appears at next scene transition. Assert 4th deferral produces `[WARNING]` in `spec_health`. Set `TTRPG_WORLD_REACTIVITY=off` — assert `## World in Motion` absent. | REQ-233, REQ-233a, REQ-310 |
| T359 | Automated | Proactive action surfacing: create wizard entity with known 3rd-level spell slots. Set scene type to combat. Assert `badge_briefing` `## Available Actions` includes weapon attack and spell actions. Assert "Cast Fireball" appears only when 3rd-level slot available — spend the slot, assert "Cast Fireball" absent. Set scene type to social. Assert persuasion and deception actions appear instead of combat actions. Assert `suggest_actions("fight")` continues to return reactive results independently. Assert at most 8 actions listed. | REQ-084, REQ-084a, REQ-109 |
| T360 | Automated | Search-index coverage: build a server against a ruleset with a known table of contents. Call `spec_health` — assert `search_index_coverage.coverage_pct` = 100 and `unmapped_sections` is empty. Call `search_rules("ability scores")` — assert at least one result from the character creation chapter. Call `search_rules` with a heading text from the ruleset's own TOC — assert result. Manually remove one heading's entry from the search index, call `search_rules` for that heading — assert zero results and `spec_health.search_index_coverage` drops below 100 with the unmapped heading listed. | REQ-315 |
| T361 | Automated | Device lifecycle: create a device `create_thing("lantern", {kind: "device", lit: true})`. Assert `command("switch on lantern")` returns `[OK]`. Assert lantern has `switched_on: true`. Assert `command("switch on lantern")` again returns `[WARNING]` (already on). Assert `command("switch off lantern")` returns `[OK]`. Assert `command("switch off lantern")` again returns `[WARNING]`. Assert `command("switch on nonexistent")` returns `[NOT_FOUND]`. Create a non-device thing — assert `command("switch on rock")` returns `[RULE_VIOLATION]`. Assert `convert_source` recognizes "It is switchable." and "It is switched on." property assertions. | REQ-316 |
| T362 | Automated | Vehicle lifecycle: create a world model with a vehicle `convert_source("A raft is a vehicle. 'A rickety wooden raft.' It is in the Underground Lake.")`. Assert vehicle is `enterable: true`, `portable: false`. Assert `command("enter raft")` returns `[OK]`. Assert player viewpoint is inside vehicle. Assert `command("look")` shows vehicle interior. Assert `command("exit")` returns to the Underground Lake. Assert `command("get out")` is equivalent. Assert `command("enter raft")` + `command("go north")` moves both player and vehicle. Assert vehicle persists at its last location when unoccupied. Assert `command("enter nonexistent")` returns `[NOT_FOUND]`. Assert `command("enter rock")` on non-enterable returns `[RULE_VIOLATION]`. Assert entering vehicle creates `[vehicle-entry]` story journal `moment` entry; assert exiting creates `[vehicle-exit]` entry. Assert vehicle entries appear in `session_recap` and `badge_briefing` narrative context. | REQ-317 |
| T363 | Automated | Extended property contracts: create things with properties `convert_source("A silver ring is in the Entrance Chamber. It is wearable. A red mushroom is in the Entrance Chamber. It is edible. An iron lever is in the Entrance Chamber. It is climbable. A glass jar is a container. It is transparent. The inscription on the altar reads 'Beware the serpent.' The altar is in the Entrance Chamber. It is readable.")`. Assert ring is `wearable: true`. Assert mushroom is `edible: true`. Assert lever is `climbable: true`. Assert jar is `transparent: true`. Assert altar is `readable: true` with `read_text: 'Beware the serpent.'`. Assert `command("wear ring")` returns `[OK]`. Assert `command("eat mushroom")` returns `[OK]`. Assert `command("read altar")` returns the inscription text. Assert each property assertion is recognized by `convert_source`. Assert missing-property commands return `[RULE_VIOLATION]`. | REQ-318 |
| T364 | Automated | Extended parser commands: populate a world model with objects supporting all new standard-tier commands. Assert `command("wear hat")` succeeds for wearable thing in inventory. Assert `command("remove hat")` succeeds when worn. Assert `command("read scroll")` returns `read_text`. Assert `command("eat mushroom")` succeeds for edible in inventory. Assert `command("drink potion")` succeeds for drinkable in inventory. Assert `command("climb rope ladder")` resolves associated exit. Assert `command("enter tent")` succeeds for enterable. Assert `command("sit bench")` succeeds for supporter. Assert `command("stand")` succeeds. Assert `command("light torch")` succeeds for `lit` thing. Assert `command("extinguish torch")` succeeds. Assert `command("listen")` returns `[OK]`. Assert `command("smell")` returns `[OK]`. Assert `command("touch altar")` returns `[OK]`. Assert `command("again")` repeats last command. Assert `command("g")` is equivalent. Assert `command("help")` lists verbs grouped by tier. Assert `command("verbs")` reports per-tier counts. Assert all property-violation cases return `[RULE_VIOLATION]`. | REQ-319 |
| T365 | Automated | Narrative-intent verbs: populate a world model with an NPC. Assert `command("ask guard about crypt")` returns `[OK] You ask guard about crypt.` Assert `command("tell guard about amulet")` returns `[OK]`. Assert `command("give sword to guard")` transfers item from inventory and returns `[OK]`. Assert `command("show shield to guard")` does NOT transfer and returns `[OK]`. Assert `command("throw rock at statue")` moves rock from inventory to room and returns `[OK]`. Assert `command("give fixed_altar to guard")` returns `[RULE_VIOLATION]`. Assert `command("throw nonexistent at guard")` returns `[NOT_FOUND]`. Assert `command("ask nobody about crypt")` where nobody matches returns `[WARNING]`. | REQ-320 |
| T366 | Automated | Codex: call `codex_set("npc", "Blacksmith", {description: "Gruff, scarred", ac: 14, hp: 35}, "The village blacksmith", ["blacksmith", "village"])` — assert stored with default visibility `library`. Call `codex_set("npc", "Fighter", {...}, visibility="shared")` — assert `shared` visibility. Call `codex_list("npc")` under Player badge — assert only `shared` entries. Call `codex_list("npc")` under Game Master badge — assert all entries. Call `codex_list("npc")` with the Editor badge — assert all entries unfiltered. Call `codex_info("blacksmith")` — assert full record with data payload. Restart server — assert codex entries survive. Create and `end_novel` — assert codex entries persist. Call `codex_import("blacksmith")` under Game Master badge into an active Novel — assert NPC created with stored fields. Call `codex_import("fighter")` under Player badge (character kind, shared visibility) — assert character imported via `import_character`. Call `codex_import("blacksmith")` under Player badge — assert `[FORBIDDEN]`. Call `codex_set(...)` under Player badge — assert `[FORBIDDEN]`. Call `codex_import("my-adventure")` with kind `adventure` into an active Novel — assert world-model, NPCs, factions, lore, and synthesis linkages populated. Call `codex_capture("npc", "blacksmith")` from within a Novel — assert `source_novel` field populated. Call `codex_capture("adventure")` from a Novel with adventure content — assert Codex entry created with `source: captured:<slug>`. Call `codex_capture("adventure")` from a Novel with no adventure content — assert `[STATE_CONFLICT]`. Call `codex_import("blacksmith")` with no Novel active — assert `[STATE_CONFLICT]`. Call `spec_health` — assert `codex` key reports counts partitioned by kind. Call `codex_delete("blacksmith")` — assert removed. Call `undo` — assert entry restored. | REQ-321 |
| T367 | Automated | Adventure generation codex: call `generate_adventure("The goblin king demands tribute")` with active Novel — assert scaffold at `adventure://generated/<anchor>`. Call `generate_adventure("The dragon hoard", target="codex")` with no Novel active — assert `[OK]`. Call `codex_list("adventure")` — assert entry present with `source: generated`. Call `codex_info("<slug>")` — assert full adventure data payload including title, premise, overview, hook, locations, npc_suggestions, encounter_seeds, genre_tags, sections. Restart server — assert Codex entry survives. Call `generate_adventure("The dragon hoard", target="codex")` again — assert entry replaced (same slug). | REQ-090 |
| T368 | Automated | Adventure loading codex: call `load_adventure("tomb-of-the-serpent-king")` with active Novel — assert world-model populated and NPCs created. Call `load_adventure("tomb-of-the-serpent-king", target="codex")` with no Novel active — assert `[OK]`. Call `codex_list("adventure")` — assert entry present with `source: loaded:tomb-of-the-serpent-king`. Call `codex_info("<slug>")` — assert full sections payload. Restart server — assert Codex entry survives. | REQ-079 |
| T369 | Automated | Vow-countdown coupling: call `set_vow("Find Crown", "Recover the lost Crown of Alara", parties=["pc_1"], difficulty="dangerous", scope="shared")` — assert `badge_briefing` narrative_threads includes countdown suggestion. Accept suggestion via decision workflow — assert 20-tick `mission`-type countdown created with name `vow:Find Crown`. Call `mark_milestone("Find Crown")` — assert both milestone counter and countdown advance by one tick. Advance countdown to fill — assert vow becomes eligible for `resolve_vow`. Call `resolve_vow("Find Crown", "Found it", "Kingdom restored")` — assert countdown removed. Call `set_vow("Other Vow", "A minor task", parties=["pc_1"], difficulty="troublesome", scope="gm")` — decline countdown suggestion — assert vow functions with milestones-only (current behavior). | REQ-322 |
| T370 | Automated | resolve_intent tool: populate world model with rooms Entrance (exits: north → Hall), Hall (exits: south, north → Chapel, locked door north), Chapel. Call `resolve_intent("go north")` from Entrance — assert status `resolved`, room_context.name = "Hall". Call `resolve_intent("go north")` from Hall — assert status `blocked` with constraint `locked`. Create character with Knock spell — create override entry. Call `resolve_intent("go north")` from Hall as that character — assert override_hints includes Knock. Call `resolve_intent("go east")` where no east exit — assert `blocked` with constraint `exit`. Call `resolve_intent` under Player badge — assert `[FORBIDDEN]`. World model unpopulated — assert `no_world_model`. Assert tool appears in `tools/list`. Assert `help("resolve_intent")` returns usage. | REQ-323 |
| T371 | Automated | Constraint override extraction: build against a ruleset containing Knock, Fly, Passwall, and Darkvision spells (or equivalent mechanics). Assert RULESET_MODEL.md records ≥4 constraint overrides with type, mechanic name, mechanic source, and source anchor. Assert each override classified by type (lockable, solid, dark, etc.). Build ruleset-free — assert scan skipped with "ruleset-free" annotation. | REQ-324 |
| T372 | Automated | Constraint override catalog: build with constraint overrides present. Call `resources/read` on `constraints://active` as Game Master — assert all overrides returned with type, name, source, prerequisites. Call as Player with active entity having 1 override — assert only that override returned. Call `resolve_intent` against a locked door with Knock available — assert error response includes `Hint: Knock (1 slot remaining) can open it.` Call with no override available — assert no hint. `spec_health` reports `constraint_override_counts` by type. | REQ-325 |
| T373 | Automated | Scene-world coupling: create world model with room "Throne Room" (exits: north, south; things: throne, chandelier). Call `set_scene_state("The royal chamber", location="Throne Room")` — assert `scene://current` includes `room_id`, `room_name: "Throne Room"`. Call `resolve_intent("look")` as GM — assert exits and contained things composable. Call `set_scene_state("The void", location="Nowhere")` — assert `location` is free-text, no `room_id`. Call `set_scene_state("The room", location="Throne")` — assert fuzzy match resolves to "Throne Room". Call `undo` — assert scene state restored. | REQ-326 |
| T374 | Automated | NPC-world coupling: create world model with rooms Forge and Inn. Call `create_npc("Blacksmith", location="Forge")` — assert NPC registered in Forge room. Call `resolve_intent("look")` from Forge — assert Blacksmith listed in room_context.present_npcs. Call `update_npc("blacksmith", location="Inn")` — assert Blacksmith no longer in Forge; `resolve_intent("look")` from Inn lists Blacksmith. Call `create_npc("Stranger", location="The Void")` — assert no room match; NPC carries free-text location only, not registered in any room. Assert `characters_present` on `set_scene_state` still governs badge_briefing NPC presence. | REQ-327 |
| T375 | Automated | Lore-world coupling: create world model with room Chapel, thing altar_01. Call `set_lore_entry("altar_secret", "The altar hums with dark power", world_target="altar_01")`. Call `resolve_intent("examine altar")` from Chapel — assert lore triggers with `[world]` tag. Call `resolve_intent("look")` from Chapel (no target interaction) — assert lore does NOT trigger on keyword match alone. Call `set_lore_entry("room_rumor", "The chapel feels wrong", triggers=["chapel"], world_target="chapel")`. Call `resolve_intent("look")` from Chapel with "chapel" keyword in scene — assert lore triggers on keyword match. Call `resolve_intent("enter chapel")` — assert lore triggers on room entry. Call `suggest_lore` — assert world-targeted lore returned when target reachable. | REQ-328 |
| T376 | Automated | Countdown-world coupling: create world model with room Guard Room. Call `set_countdown("ambush", 3, type="narrative", triggers=["on_room_enter(guard_room)"])`. Call `resolve_intent("go north")` from adjacent room into Guard Room — assert countdown advances by one tick. Navigate into Guard Room three times — assert countdown fires and is removed. Call `set_countdown("raid", 5, type="round", triggers=["on_room_enter(throne_room)", "on_thing_take(crown_01)"])`. Start combat — advance_combat four times — assert countdown at 1 tick remaining. Navigate into Throne Room — assert countdown fires. Remove countdown — assert no further trigger fires. | REQ-329 |
| T377 | Automated | Knowledge-world coupling: create world model with rooms Entrance, Guard Room, Chapel. Call `resolve_intent("go north")` from Entrance to Guard Room as entity "rogue_01" — assert `knowledge_state` includes "Guard Room" under "Explored" with timestamp. Call `resolve_intent("go north")` from Guard Room to Chapel — assert Chapel added. Return to Guard Room — assert no duplicate. Call `set_scene_state("Camp", characters_present=["rogue_01"])` — assert GM declaration overrides exploration presence. `knowledge_state` retains all prior exploration entries. Call `resolve_intent("look")` in Guard Room — assert NPCs seen added to knowledge. | REQ-330 |
| T378 | Automated | Story journal-world coupling: create world model with room Library. Call `set_scene_state("The library", location="Library")` (scene-world coupled). Call `record_story("moment", "Found the hidden map behind the bookshelf")` — assert entry auto-populates `room_id: "library"` and `scene_anchor` includes "Library". Call `list_stories` — assert entry shows room name. Call `set_scene_state("The void", location="Nowhere")` (no match). Call `record_story("moment", "Drifted through nothingness")` — assert `room_id` absent. Call `session_recap` — assert "Library" in narrative_orientation for first entry, absent for second. | REQ-331 |
| T379 | Automated | Codex bootstrap: call `codex_set("adventure", "Dragon Hoard", {title: "The Dragon Hoard", premise: "A dragon demands tribute", sections: {}})` to create a Codex adventure entry. Call `create_novel("my-game", codex_adventure="dragon-hoard")` — assert Novel created, adventure scaffold imported (world-model populated, NPCs created, factions set, lore entries present, synthesis linkages active), `adventure_set: true` in metadata. Call `create_novel("broken", codex_adventure="nonexistent")` — assert `[NOT_FOUND]`. Call `create_novel("wrong-kind", codex_adventure="blacksmith")` where blacksmith is kind `npc` — assert `[NOT_FOUND]` (wrong kind). | REQ-088, REQ-321 |
| T380 | Automated | Story journal to lore promotion: call `record_story("revelation", "The old well leads to the undercity")` — assert entry at index 0. Call `promote_story_to_lore(0)` — assert lore entry `the-old-well-leads-to-the-undercity` created with `source: story_journal:0`. Call `list_stories()` — assert journal entry unchanged (non-destructive). Call `record_story("decision", "We chose to trust the vampire")` — assert at index 1. Call `promote_story_to_lore(1)` — assert `[RULE_VIOLATION]`. Call `promote_story_to_lore(0, key="well-undercity-link")` — assert `[STATE_CONFLICT]` (key already taken). Player badge — assert `[FORBIDDEN]`. | REQ-333 |
| T381 | Automated | Novel archiving: create a Novel with entities, NPCs, lore entries, and an active adventure. Call `archive_novel("my-novel")` — assert file moved to `.holonovel-state/archive/my-novel.json`. Call `list_novels()` — assert Novel absent. Call `list_novels(filter="archived")` — assert Novel present with archive timestamp and metadata. Call `resume_novel("my-novel")` — assert `[STATE_CONFLICT]`. Call `novel_info("my-novel")` — assert read-only metadata returned. Call `unarchive_novel("my-novel")` — assert file restored to `.holonovel-state/novels/my-novel.json`. Call `resume_novel("my-novel")` — assert full state intact. Call `archive_novel("my-novel")` while another connection has it active — assert `[STATE_CONFLICT]`. Player badge `archive_novel` — assert `[FORBIDDEN]`. `spec_health.archived_novels` — assert lists the archived slug. | REQ-334 |
| T382 | Automated | Batch codex import: call `codex_import(["blacksmith", "innkeeper"])` — assert both NPCs created, single audit entry recorded, one undo snapshot restores both. Call `codex_import(["existing-npc", "nonexistent"])` — assert `[NOT_FOUND]` for `nonexistent` at index 1; assert `existing-npc` was NOT created (atomic rollback). | REQ-321 |
| T383 | Automated | Bidirectional codex sync: call `codex_import("blacksmith")` into Novel — assert NPC with `codex_source` created. Set personality and voice_examples on the NPC via `set_personality` and `set_voice_examples`. Call `codex_capture("npc", "blacksmith", update_source=true)` — assert Codex entry "blacksmith" updated in-place (personality, voice_examples reflected), NOT a new entry. Call `codex_info("blacksmith")` — assert updated data payload. Call `codex_capture("npc", "guard-captain", update_source=true)` where guard-captain has no codex_source — assert `[STATE_CONFLICT]`. | REQ-321, REQ-332 |
| T384 | Automated | Codex provenance: call `codex_import("blacksmith")` into active Novel — assert NPC carries `codex_source: {id: "blacksmith", imported_at: <ISO>, codex_modified_at: <ISO>}`. Call `novel_info()` — assert `codex_sources` includes `{id: "blacksmith", kind: "npc"}`. Update blacksmith Codex entry via `codex_set` (change description). Call `spec_health` — assert `[codex-stale]` flag for blacksmith. Call `codex_import("blacksmith")` again — assert existing NPC updated (description changed, HP and conditions preserved), NOT duplicated. Call `clone_novel(...)` — assert cloned NPC retains `codex_source`. | REQ-332, REQ-258, REQ-097 |
| T385 | Automated | Scene beat taxonomy: call `set_scene_state("The hall darkens", beat="escalation")`. Invoke `badge_briefing` — assert scene state section includes `Beat: escalation` after scene type tag. Call `session_recap` — assert `beat_transitions` array includes `{from: "mid_scene", to: "escalation"}`. Call `set_scene_state("Still dark", beat="escalation")` — assert no new transition entry (same beat). Call `set_scene_state("Dawn breaks", beat="resolution")` — assert second transition entry. Assert `badge_briefing` shows `Beat: resolution`. | REQ-335 |
| T386 | Automated | Dramatic pacing signal: set `TTRPG_PACING_WINDOW=3`. Call `set_scene_state("Start", beat="setup")`. Perform 4 tool calls (any non-mutating tools). Invoke `badge_briefing` — assert `[pacing] Scene stabilized — 4 actions since last transition.` Call `set_scene_state("New scene")` — assert counter reset, pacing signal absent. Set `TTRPG_PACING_WINDOW=0` — assert no pacing signal after 20+ calls. | REQ-336 |
| T387 | Automated | Narrative arc visibility: call `set_scene_state("The hall is quiet", beat="setup")`, then `set_scene_state("Torches flicker", beat="escalation")`, then `set_scene_state("The door bursts open", beat="climax")`. Invoke `badge_briefing` under GM — assert `story_beats` line contains three-beat sequence with scene previews. Invoke under Player — assert only `shared`-scope beats visible. Perform 12 beat transitions — assert only most recent 10 appear. Empty Novel — assert `[No beats completed.]`. | REQ-337 |
| T388 | Automated | Faction autonomous advancement: create faction with `TTRPG_FACTION_AUTONOMY_INTERVAL=3`. Call `set_scene_state("Scene A")` — assert no autonomous tick (interval not yet met). Call scene transitions for Scenes B and C — assert clock advances by 1 autonomous tick on 3rd transition with `[autonomous]` annotation. Advance through Scenes D, E, F — assert 2nd autonomous tick on 6th transition. Create linked countdown and fill via autonomous tick — assert `[pending-fire]` in `badge_briefing`. Set interval to zero — assert no autonomous ticks. | REQ-338 |
| T389 | Automated | NPC goal pursuit: create NPC with `goals="Steal the crown"`, `disposition="suspicious"`. Set `TTRPG_NPC_AUTONOMY=on`. Call `set_scene_state("Throne room")` — assert `badge_briefing` World in Motion includes goal-pursuit suggestion. Accept suggestion — assert state change applies, suggestion absent on next transition. Defer — assert re-appears at next transition. Dismiss — assert does not re-appear. Set `TTRPG_NPC_AUTONOMY=off` — assert no suggestions. | REQ-339 |
| T390 | Automated | Discovered consequences: create countdown linked to Guard Room. Set entity absent (not in `characters_present`). Advance countdown to fire. Set entity present in Gatehouse (different location). Advance scene — assert no discovery. Set entity present in Guard Room — assert `[discovered]` story journal entry created with `discovered: true` and "Meanwhile, ..." orientation text. Countdown fires with entity present — assert standard `consequence` entry with `discovered` unset. | REQ-340 |
| T391 | Automated | Player-facing spatial surface: populate world model with rooms, exits, things. Invoke Player `badge_briefing` — assert scene state section includes room name, exit directions (no destination names), visible things (no internal IDs). Unpopulated world model — assert `[No world model — surroundings are as described by the GM.]`. Game Master `badge_briefing` — assert full world-model surface (IDs included). | REQ-341 |
| T392 | Automated | Scene from world model: call `set_scene_state("", location="Throne Room")` with Throne Room containing throne thing, chandelier, and 2 NPCs. Assert scene description derived from room description + contents. Call `set_scene_state("The royal chamber", location="Throne Room")` — assert explicit description used, not derived. Call `set_scene_state("The void", location="Nowhere")` — assert description parameter used alone (no match). Call `undo` — assert scene state restored. | REQ-342 |
| T393 | Automated | Unified intent: call `suggest_actions("convince the guard to let us pass", entity_id="bard_01")` — assert results grouped by domain (mechanical, spatial, social). Assert social domain includes guard's disposition and relationship. Call `suggest_actions("attack the goblin")` — assert only mechanical suggestions. Call `suggest_actions("sneak past")` — assert mechanical + spatial. Call under Player badge — assert all three domains return. | REQ-343 |
| T394 | Automated | Voice feedback: call `player_signal("voice_feedback", "She wouldn't say that — she'd say 'The door is trapped. Stand back.'")`. Assert `character_sheet` shows `[player-corrected]` voice example. Assert `badge_briefing` shows correction. Assert audit log entry recorded. Call 4th correction in same session — assert `[WARNING] Voice correction limit reached for this session.`. Change `TTRPG_SESSION_ID` — assert limit reset. | REQ-344 |
| T395 | Automated | Background knowledge: create entity with `background="Veteran of the Border Wars"`. Invoke `badge_briefing` — assert `knowledge_state` includes `background_knowledge` subsection with background text and boundary directive. Create entity with empty `background` — assert subsection absent. Update entity to add `background="Scholar of the Arcane"` — assert subsection appears on next briefing render. | REQ-345 |
| T396 | Automated | Narrative coherence attestation: after build completion, assert DECISIONS.md (6) contains `narrative_coherence` section sub-headed `@section evidence`. Assert attestation includes: (a) narrative-critical REQ implementation status, (b) badge_briefing narrative section population, (c) smoke-session transcript embedded or linked with ≥5 turns. Assert `spec_health` includes `narrative_coherence` flag with disposition. | REQ-346 |
| T397 | Automated | Voice codex capture: call `player_signal("voice_feedback", "She wouldn't say that — she'd say 'Stand back.'")` on an entity. Call `codex_capture("voice_profile", entity_id, update_source=true)` — assert Codex entry created with `kind: "voice_profile"`, `source_novel` populated, `original_text` and `corrected_text` pairs, and `[codex-corrected]` tag. Call `codex_list("voice_profile")` — assert entry present. Call `codex_import(entry_id)` into a new Novel — assert matching entity's `voice_examples` includes the corrected snippet tagged `[codex-corrected]`. Call `codex_capture("voice_profile", entity_id)` without `update_source` — assert new entry created (not overwritten). Assert `badge_briefing` renders `[codex-corrected]` voice examples visually distinct from `[player-corrected]`. | REQ-347, REQ-321 |
| T398 | Automated | Faction-NPC coordination: create faction "Merchant Guild" with goal "Expand to East Dock". Create NPC "Guildmaster Kael" with `goals="Secure the East Dock contract"` and `disposition="suspicious"`. Set `TTRPG_FACTION_AUTONOMY_INTERVAL=3`, `TTRPG_NPC_AUTONOMY=on`. Call `set_scene_state("Scene A")`, then B, then C — assert autonomous tick fires on 3rd transition, faction clock advances, and Kael's goal pursuit suggestion is absent (suppressed). Assert `[faction-npc-coordination]` audit entry present. Call `set_scene_state("Scene D")` — no faction tick; assert Kael's goal pursuit suggestion appears in `## World in Motion`. Set `TTRPG_NPC_AUTONOMY=off` — assert faction autonomous ticks proceed without NPC coordination. | REQ-348 |
| T399 | Automated | Consequence-to-knowledge coupling: create countdown linked to Guard Room, 2 ticks. Set entity rogue_01 absent from `characters_present`. Advance countdown to fire via scene transitions. Set scene to Guard Room with rogue_01 present — assert `[discovered]` story journal entry AND `knowledge_state` includes `discovered_consequence` entry with countdown name, consequence text, and `source: discovered_consequence`. Create second countdown linked to Forge. Set rogue_01 AND wizard_01 absent. Advance to fire. Set scene to Forge with both present — assert both entities receive the knowledge entry independently. Assert discovered knowledge persists across scene transitions and Novel restart. | REQ-349, REQ-340, REQ-286 |
| T400 | Automated | Background lore triggering: create entity with `background="Veteran of the Border Wars"`. Create lore entry `border_treaty` with triggers `["border", "war", "treaty"]` and `badge_scope="shared"`. Invoke `badge_briefing` — assert `knowledge_state` includes `[background-relevant]` subsection listing `border_treaty` with matched trigger, content preview, and key. Create second lore entry `gm_secret` with triggers `["war"]` and `badge_scope="game_master"` — assert it does NOT appear in Player `badge_briefing` background matches. Create entity with empty `background` — assert `[background-relevant]` subsection absent. Update entity background to `"Scholar of the Arcane"` and create lore `arcane_rumor` with triggers `["arcane", "magic"]` — assert background match updates on next briefing render. | REQ-350, REQ-345, REQ-083 |
| T401 | Automated | Pacing-triggered autonomy: set `TTRPG_PACING_WINDOW=3`. Create faction "Thieves Guild" with clock and NPC "Locke" with `goals="Crack the vault"`, `disposition="suspicious"`. Set `TTRPG_FACTION_AUTONOMY_INTERVAL=5`, `TTRPG_NPC_AUTONOMY=on`. Perform 4 tool calls without scene transition — assert pacing signal fires AND `[pacing-autonomy]` audit entry recorded with faction tick annotation AND Locke's goal pursuit suggestion appears in `## World in Motion`. Perform 4 more tool calls — assert pacing signal re-fires but `[pacing-autonomy]` does NOT re-trigger. Call `set_scene_state("New scene")` — assert counter resets. Perform 4 more calls — assert `[pacing-autonomy]` fires again. Create overlapping faction+NPC goal (NPC whose goal text intersects faction goal text) — assert REQ-348 suppression applies during pacing autonomy. | REQ-351, REQ-336, REQ-338, REQ-339 |
| T402 | Automated | Codex adventure beat sequences: create Codex adventure entry via `codex_set("adventure", "Test Quest", {title: "Test Quest", premise: "...", sections: {}, suggested_beats: [{beat: "setup", scene_preview: "The tavern is quiet..."}, {beat: "escalation", scene_preview: "A fight breaks out..."}, {beat: "climax", scene_preview: "The dragon rises!"}]})`. Call `create_novel("test-quest", codex_adventure="test-quest")` — assert `badge_briefing` `story_beats` shows all three beats tagged `[adventure-scaffold]`. Call `set_scene_state("The tavern hums with conversation", beat="setup")` — assert first beat replaced, `[adventure-scaffold]` tag removed on this entry. Advance scene to second beat without explicit `beat` parameter — assert second scaffold beat still present with `[adventure-scaffold]` tag. Advance to third beat via `set_scene_state(beat="climax")` — assert scaffold replaced. Create adventure WITHOUT `suggested_beats` — call `codex_import` — assert no beat pre-population. | REQ-352, REQ-088, REQ-321, REQ-337 |
| T403 | Automated | Narrative coherence G7 gate: execute G7 verification workflow. Assert DECISIONS.md (6) contains `narrative_coherence` section with `@section evidence` sub-heading. Assert implementation status lists every REQ in §5.12 with disposition. Assert `badge_briefing` narrative section population evidence present. Assert smoke-session transcript embedded with ≥5 turns. Assert `spec_health.narrative_coherence` reports `pass`, `partial`, or `fail`. Assert `fail` disposition blocks handoff. | REQ-346, G7 |
| T404 | Automated | Beat-accelerated countdowns: set beat to `climax`. Create countdown with `on_scene_transition` flag, 5 ticks. Call `set_scene_state("Scene A")` — assert countdown at 3 ticks (5 − 2 × 1). Call `set_scene_state("Scene B")` — assert countdown at 1 tick (3 − 2). Call `set_scene_state("Scene C")` — assert countdown fires (1 − 2 ≤ 0). Set `TTRPG_CLIMAX_ACCELERATION=3`. Create new countdown with 5 ticks. Call `set_scene_state("Scene D")` — assert countdown at 2 ticks (5 − 3). Set beat to `setup` — call `set_scene_state("Scene E")` — assert countdown at 1 tick (standard single-tick). Set `TTRPG_CLIMAX_ACCELERATION=1` — set beat to `climax`, advance scene — assert standard single-tick (acceleration disabled). Assert `round`-type countdowns are unaffected by beat. | REQ-353, REQ-335, REQ-125, REQ-073 |
| T405 | Automated | Extended narrative enrichment: run Discovery on a ruleset with GM advice chapters covering scene pacing, NPC relationships, dramatic structure, and solo-play guidance. Assert `list_synthesis_items(tier=1, module="supplementary_guidance")` includes items with `component_type` annotations matching the REQ-354 catalogue (`scene_type`, `relationship`, `countdown`, `secret`, `player_signal`, `story_journal`, `scene_beats`, `pacing`, `autonomy`, `constraint_override`, `scene_world`, `npc_world` — any combination of at least two types, with vendor content satisfying barren extraction slots per REQ-225). Assert items carry `[ruleset]` tag or `[vendor]` tag with source anchors. Assert ruleset with no such chapters produces no additional items beyond the existing REQ-225 extraction. | REQ-354 |
| T406 | Automated | Secret-countdown coupling: create a secret "betrayal" and a countdown with `scope` containing "betrayal." Call `reveal_secret("betrayal", "pc_01")` — assert `badge_briefing` `narrative_threads` includes countdown-advancement advisory. Create a secret and countdown with no text overlap — assert no advisory. | REQ-355, REQ-234, REQ-073 |
| T407 | Automated | Vow-lore coupling: create lore entry "crown_of_alara" with trigger "crown". Call `set_vow("Find the Crown", "Retrieve the Crown of Alara", ...)` with at least one party member. Assert `badge_briefing` `narrative_threads` includes `[vow-relevant] crown_of_alara`. Call `resolve_vow` — assert match no longer appears. Create lore entry with no overlap to an unrelated vow — assert no match. | REQ-356, REQ-289, REQ-083 |
| T408 | Automated | Story journal-faction coupling: create faction "Merchant Guild" with goal "Control the docks." Call `record_story("consequence", "The docks were destroyed")` — assert `badge_briefing` `narrative_threads` includes faction-clock-advancement advisory. Call `record_story("moment", "The sunset was beautiful")` — assert no advisory (no entity/location overlap). | REQ-357, REQ-246, REQ-233 |
| T409 | Automated | Countdown-NPC disposition coupling: create NPC "Guard" with `disposition="neutral"`, `location="gatehouse"`. Create hostile-direction countdown with `scope="gatehouse"`. Fire the countdown — assert Guard disposition shifts to `suspicious` with `[countdown-disposition]` audit entry. Create benign-direction countdown — fire — assert Guard shifts back to `neutral`. NPC outside countdown scope — assert no shift. | REQ-358, REQ-073, REQ-075 |
| T410 | Automated | Relationship-countdown coupling: create countdown with `scope="alliance"`. Call `set_relationship("pc_01", "npc_guard", "ally")`. Call `set_relationship("pc_01", "npc_guard", "rival")` — assert `badge_briefing` `narrative_threads` includes relationship-countdown advisory. Flip relationship where no matching countdown exists — assert no advisory. | REQ-359, REQ-236, REQ-073 |
| T411 | Automated | Lore-countdown coupling: call `set_lore_entry("impending-raid", "The goblins are marching — they will be here by nightfall.", triggers=["raid", "imminent"])` — assert `badge_briefing` `narrative_threads` includes countdown-creation advisory. Call `set_lore_entry("forest-lore", "The woods are old and deep.", triggers=["forest"])` — assert no advisory (no urgency keywords). Create countdown with matching name — assert advisory suppressed. | REQ-360, REQ-083, REQ-073 |
| T412 | Automated | NPC-vow coupling: create NPC "Blacksmith" with `goals="Forge the legendary blade Starfang"`. Invoke `badge_briefing` — assert `narrative_threads` includes vow-creation suggestion. Call `set_vow("Forge Starfang", "Forge the legendary blade Starfang", ...)` — assert suggestion suppressed. Create NPC with short goal ("smith stuff") — assert no suggestion. | REQ-361, REQ-077, REQ-289 |
| T413 | Automated | Faction-vow coupling: create faction "Thieves Guild" with goal "Steal the Crown of Alara" and lore entry referencing "Crown of Alara". Invoke `badge_briefing` — assert `narrative_threads` includes faction-vow suggestion. Create faction with goal referencing no known entities — assert no suggestion. | REQ-362, REQ-233, REQ-289 |
| T414 | Automated | Secret-world coupling: create world-model room "Vault". Call `set_secret("vault-trap", "The floor is pressure-plated", world_target="vault")`. Call `set_scene_state("The strongroom", location="Vault")` — assert `badge_briefing` `narrative_threads` includes `[world-linked]` vault-trap entry. Call `set_scene_state(..., location="Inn")` — assert entry absent. | REQ-363, REQ-234, REQ-195 |
| T415 | Automated | Faction-world coupling: create room "Throne Room". Call `create_faction("Royal Guard", goals=["Protect the crown"], territory=["throne_room"])`. Call `set_scene_state(..., location="Throne Room")` — assert `badge_briefing` `narrative_threads` includes `[territorial] Royal Guard`. Call `set_scene_state(..., location="Pantry")` — assert faction absent. | REQ-364, REQ-233, REQ-195 |
| T416 | Automated | Server notes narrative coupling: call `set_server_note("old-gods", "The old gods were banished...", narrative_tag="lore_seed")` — assert `badge_briefing` supplementary guidance includes `[lore-seed]`. Call `set_server_note("dm-reminder", "Remind players...", narrative_tag="session_reminder")` — assert `[session-reminder]` tag. Call without `narrative_tag` — assert absent from briefing. Player badge — assert absent. | REQ-365, REQ-285 |
| T417 | Automated | Observer narrative surface: call `set_badge("observer")` on a populated Novel with entities carrying both active and non-present states, and knowledge gating active (entity present in some scenes, absent from others). Assert `badge_briefing` includes scene state, entity personality, and narrative threads with omniscient-role orientation directive. Assert `badge_briefing` includes `[not present]` markers for entities absent from the current scene. Assert `badge_briefing` includes `knowledge_state` for all entities in the Novel (not only the active entity), matching the GM-level visibility contract. Assert `badge_briefing` excludes secrets, faction clocks, countdown positions, and GM context. Assert `set_scene_state(...)` from observer returns `[FORBIDDEN]`. | REQ-366, REQ-305 |
| T418 | Automated | Property propagation: create world model with rooms. Call `convert_source("An iron chest is a container. It is in the Entrance Chamber. A glass jar is a container. It is transparent. It is in the iron chest. A glowing lantern is in the glass jar. It is lit. It is switched on.")`. Assert `command("look")` — lantern NOT visible (opaque outer chest blocks glass jar regardless). Remove chest from chain, place jar directly in room — assert `command("look")` shows "a glowing lantern (inside the glass jar)". Call `command("switch off lantern")` — assert `command("look")` shows "a dark lantern (inside the glass jar)". Create vehicle in dark cave with `lit: true` — assert `command("enter boat")` and `command("look")` shows lit interior. Create vehicle with `lit: false` — assert interior inherits dark from cave. | REQ-367 |
| T419 | Automated | Countdown-world effect coupling: create world model with room Cellar. Call `set_countdown("flood", 3, type="narrative", world_effect={type:"describe", target:"cellar", value:"Knee-deep water fills the cellar, rising fast."})`. Advance three narrative ticks — assert countdown fires, cellar.description equals new text, prior description in undo stack. Call `undo` — assert prior description restored. Create countdown with `world_effect.type="property", target="lantern_01", property="lit", value=false` — fire — assert lantern no longer lit. Create countdown with `world_effect.type="exit", target="cellar", action="create", direction="north", destination="cave"` — fire — assert north exit created. Create countdown targeting room that is deleted before fire — assert `[WARNING] target missing — effect not applied` in audit log, countdown removed from active. | REQ-368 |
| T420 | Automated | Holodeck archetype verification: parse Novel properties table (§7.7), assert every property group has ≥1 archetype tag from the defined set (Temporal, Entity-bearing, Scene-anchored, Knowledge-carrying, Narrative-memory, Spatial, Relational, Decision, Guidance, Session, Ruleset Wisdom, Mechanical, or `[content source]`). Assert every active coupling row in §7.7.1a cites a pattern rule in the Pattern Rule column (P1–P54 or `—` for uncategorized couplings). Assert no coupling row cites an undefined pattern rule. Assert every property group's archetypes are used by ≥1 coupling row (no orphaned archetype assignments). | REQ-369 |
| T421 | Automated | Coupling derivation: parse §7.7.1a coupling rows, assert every coupling row cites a pattern rule whose source and target archetypes are covered (order-insensitive) by the row's property-group archetypes. Parse §7.7.0 pattern rules (P1–P54), assert every pattern rule has ≥1 coupling row in §7.7.1a. Assert §7.7.1b no longer uses a completeness register — replaced by derivation contract. Assert `[non-property]` rows are exempt from archetype matching but count toward their rule's coverage. Assert `npm run validate` exits non-zero when a pattern rule has zero coupling rows. Assert `npm run validate` exits non-zero when a coupling row cites a mismatched archetype rule. | REQ-370 |
| T422 | Automated | Ruleset Wisdom as rendered reality: build with a ruleset that produces Ruleset Wisdom items. Create a Novel — assert NPCs render with voice_examples and personality patterns from Wisdom without manual `activate_synthesis_item` calls. Assert Wisdom-derived countdown pacing patterns advance mechanically on scene transitions. Call `deactivate_synthesis_item` on a Wisdom item — assert the coupled behavior ceases. Call `revert_synthesis` — assert Wisdom items and their couplings survive (only Tier 2 community items removed). Assert ruleset-free build has empty Wisdom with "[ruleset-free]" annotation in `spec_health`. | REQ-371 |
| T423 | Automated | Supplementary ruleset import: build a server against a primary ruleset. Create a Novel. Call `import_supplementary` on a minimal fixture (Appendix Z) — assert extraction runs, new tools appear in `tools/list` annotated with source slug, new Wisdom items appear in `list_synthesis_items(tier=1)` with source anchor pointing to the supplementary file. Assert Wisdom couples mechanically per P5–P11. Assert confidence below `TTRPG_CONFIDENCE_FLOOR` does not block import — items carry `[LOW]` and `spec_health` reports `supplementary_confidence_warnings`. Assert GM-only. Call `import_supplementary` with invalid path — assert `[NOT_FOUND]` with valid source enumeration. Call `import_supplementary` under Player badge — assert `[FORBIDDEN]`. Call `remove_supplementary` — assert tools and Wisdom removed. End Novel and resume — assert supplementary re-resolved. Move the supplementary file — assert `[supplementary-gap]` in `spec_health`, remaining content with `[partial]` marker. | REQ-372 |
| T424 | Automated | Dynamic tool registration: call `import_supplementary` with a matching fixture (Appendix Z) — assert new tools in `tools/list` annotated with source slug. Invoke a supplementary-derived tool — assert `[OK]` response with prefix, error taxonomy, source quoting. Call `remove_supplementary` — assert tools absent from `tools/list`. Invoke a removed tool — assert tool-not-found at MCP layer. Call `import_supplementary` on a builder-stack that recorded a dynamic-registration waiver — assert only Wisdom imported, no new tools in `tools/list`. | REQ-373 |
| T425 | Automated | Archetype coverage convergence: parse §7.7 property groups, assert all 30 groups carry ≥1 archetype per §7.7.0. A group missing an archetype fails the Phase 1 archetype coverage metric with threshold 100%. Assert `npm run validate` reports archetype assignment completeness for all property groups. | REQ-374 |
| T426 | Automated | Wisdom mechanical coupling rate: build with a ruleset producing Wisdom items. Assert ≥30% of extracted Wisdom items carry Mechanical coupling nature in §7.7.1a. A build with Wisdom items exclusively Navigational fails this Phase 1 metric. Assert re-classification from Navigational to Mechanical where ruleset text supports behavioral language. | REQ-375 |
| T427 | Automated | Coupling chain Pattern Buffer: populate world model, create countdown with world_effect, create faction. Advance scene — assert countdown ticks and faction clock ticks (P1). Move player via go — assert scene transition hook and lore triggers (P13, P2). Advance countdown to fire — assert world_effect mutates room (P14). Record consequence story journal — assert faction advisory in narrative_threads (P33). Undo — assert pre-chain state restored. | §6.6 S32 |
| T428 | Automated | Wisdom mechanical enactment Pattern Buffer: create NPC with Wisdom active — assert character_sheet shows auto-populated voice_examples, goals, personality (P6). Create countdown — assert auto-advances on set_scene_state (P7). suggest_actions returns constraint overrides (P10). Deactivate Wisdom items — assert behavior stops. Reactivate — assert resumes. Assert REQ-371 conformance: first-class mechanics, not advisory. | §6.6 S33, REQ-371 |
| T429 | Automated | S27 blocking promotion: enrichment lifecycle sub-workflow now blocked from handoff on failure. Assert mechanical enactment assertions (P6, P7, P10) execute as part of S27. Assert deactivating Wisdom item suppresses mechanical behavior; reactivating restores it. | §6.6 S27 |
| T430 | Automated | Cross-model audit archetype coverage: run cross-model audit per REQ-299. Assert coverage includes ≥2 distinct archetype categories from §7.7.0. Assert audit report enumerates archetype categories compared. Assert archetype disagreements recorded as findings with both models' assignments and source anchors. | REQ-299 |
| T431 | Automated | Holonovel Pattern Buffer traceability: after a full Holonovel Pattern Buffer run, assert DECISIONS.md (6) contains a Holonovel sub-workflow-to-REQ mapping covering every REQ in §5.10 (World-Model Layer), §5.12 (Narrative Architecture), §5.13 (Holodeck), §5.15 (Mechanical Coupling), and REQ-367. Assert each covered REQ maps to at least one Holonovel PB sub-workflow. Assert gaps detected by `npm run validate` are errors that block assembly. | REQ-376 |
| T432 | Automated | Mechanical coupling extraction: build against D&D 5e SRD. Assert Mechanics property group populated with coupling entries. Assert Fireball entry has target=Spatial, nature=Mechanical, source anchor. Assert Darkness has target=Spatial (extinguishing). Assert Light has target=Spatial (illumination). Assert Hold Person has target=Entity-bearing (condition). Assert every coupling entry carries confidence label (HIGH/MEDIUM/LOW). Assert ruleset-free build produces [ruleset-free]. | REQ-377 |
| T433 | Automated | Mechanical coupling verification: build with D&D 5e, assert ≥1 mechanical tool per extraction category carries coupling metadata. Assert total coupling entries ≥1 per 50 indexed items (≥4 for 200+ items). Assert ≥10% of couplings are Mechanical (automatic). Build ruleset-free — assert [ruleset-free] annotation. Build against a ruleset with zero world-affecting mechanics — assert [low-mechanical-coupling] finding. | REQ-378 |
| T434 | Automated | Coupling derivation: assert every pattern rule P1–P54 has ≥1 coupling row in §7.7.1a. Assert no coupling row cites a mismatched archetype rule. Assert completeness register (§7.7.1b previous) no longer exists — replaced by derivation contract. Assert `npm run validate` exits non-zero when a pattern rule has zero coupling rows. Assert `npm run validate` exits non-zero when a coupling row cites a mismatched pattern rule. | REQ-370 |
| T435 | Automated | Missing pattern rule detection: temporarily remove all coupling rows for P39 (Temporal → Scene-anchored). Assert `npm run validate` exits non-zero reporting P39 has zero coupling rows. Restore rows — assert passes. | REQ-370 |
| T436 | Automated | Scene ↔ NPC couplings: create NPC with disposition=friendly. Call `set_scene_type("combat")` — assert `narrative_threads` includes NPC disposition advisory (P41). Call `set_scene_type("social")` — assert advisory updated. Create NPC with `location` matching active room — call `set_scene_state("...", characters_present=["<entity>"])` — assert NPC auto-registers in scene per P42. | REQ-369, REQ-075 |
| T437 | Automated | Temporal → Scene coupling: create countdown with `world_effect: {type: "scene", value: "The chamber floods with dark water."}`. Advance countdown to fire — assert scene description includes flood text. Assert prior scene description in undo stack. Create countdown without scene scope — assert fire does not update scene. Remove countdown — assert no further effect. | REQ-369, REQ-073 |
| T438 | Automated | Knowledge → Scene coupling: create lore entry "The chapel was built on a mass grave" with triggers=["chapel"], badge_scope="shared". Call `set_scene_state("You stand in the chapel", location="Chapel")` — assert scene description surfaces lore tagged `[lore-relevant]`. Create lore with badge_scope="game_master" — assert GM briefing includes it, Player view does not. | REQ-369, REQ-083 |
| T439 | Automated | Archetype verification: parse §7.7 property groups, assert all 30 groups carry ≥1 archetype per §7.7.0 including Mechanical on Mechanics, Ruleset Wisdom on Synthesis, and `[content source]` on Adventure groups. Assert 12 distinct archetypes enumerated in §7.7.0 (Temporal, Entity-bearing, Scene-anchored, Knowledge-carrying, Narrative-memory, Spatial, Relational, Decision, Guidance, Session, Ruleset Wisdom, Mechanical). Assert every property group's archetypes are used by ≥1 coupling row. | REQ-374, REQ-369 |
| T440 | Automated | Tool namespacing: build a host with D&D and Starfinder packages loaded. Assert `tools/list` reports `dnd5e_` and `starfinder_` prefixed tools with correct `ruleset` annotations. Assert infrastructure tools carry `ruleset: null`. Assert `spec_health.ruleset_prefix_map` covers all slugs. | REQ-379 |
| T441 | Automated | Novel ruleset binding: call `create_novel("test", ruleset="dnd5e")` — assert `ruleset: "dnd5e"` in `novel_info`. Call `create_novel("test2", ruleset="unknown")` — assert `[ERROR] [INVALID_INPUT]` with valid rulesets enumerated. Export and verify `ruleset` field in manifest. | REQ-380 |
| T442 | Automated | Ruleset-scoped tool gating: create D&D Novel. Assert `dnd5e_roll_skill_check` succeeds, `starfinder_roll_weapon_attack` returns `[ERROR] [INVALID_INPUT]` naming D&D scope. Create Starfinder Novel — assert reverse. With no Novel active — both succeed. Assert `tools/list` includes all with `inapplicable` annotations. | REQ-381 |
| T443 | Automated | Extraction isolation: call `dnd5e_search_rules("fireball")` under D&D Novel — assert D&D-only results. Call `starfinder_search_rules("laser")` under Starfinder Novel — assert Starfinder-only results. Assert no cross-contamination in source anchors. | REQ-382 |
| T444 | Automated | Combined spec_health: assert `spec_health.ruleset_health` contains per-ruleset sections with independent counts. Assert `combined` section includes `ruleset_prefix_map` and total tool count. Assert Player badge sees only active Novel's ruleset health. | REQ-383 |
| T445 | Automated | Cross-ruleset switching: create D&D and Starfinder Novels. Switch between them — assert ruleset-derived tool availability changes. Assert audit log records both switches. Assert D&D Novel state unchanged after switching back. | REQ-384 |
| T446 | Automated | suggest_actions scoping: call `suggest_actions("attack")` under D&D Novel — assert D&D-prefixed tool suggestions only. Same intent under Starfinder Novel — assert Starfinder-prefixed only. | REQ-385 |
| T447 | Automated | Import rejection: export D&D Novel. Import into D&D + Starfinder server — assert success. Export Starfinder Novel — import into D&D-only server — assert rejection with valid rulesets enumerated. Import D&D character into Starfinder Novel — assert rejection naming both rulesets. | REQ-386 |
| T448 | Automated | Codex ruleset annotation: assert `codex_list(ruleset="dnd5e")` returns D&D-tagged plus untagged entries only. Assert `codex_list(ruleset="starfinder")` returns Starfinder-tagged plus untagged — no D&D entries. Assert `codex_import` of D&D spell codex entry into Starfinder Novel is rejected. Assert `codex_capture("npc", name)` from a D&D-bound Novel creates a codex entry with `ruleset: "dnd5e"` and does not appear in `codex_list(ruleset="starfinder")`; assert `codex_import` of that entry into a Starfinder Novel returns `[ERROR] [STATE_CONFLICT]`. | REQ-387 |
| T449 | Automated | G8 isolation workflow: run all nine G8 isolation steps. Assert all pass. Evidence in `@section evidence-g8`. | REQ-379, REQ-380, REQ-381, REQ-382, REQ-383, REQ-384, REQ-385, REQ-386 |
| T450 | Automated | Holodeck config discovery: build a server with TTRPG_PACING_WINDOW=6, TTRPG_NPC_AUTONOMY=off, TTRPG_WORLD_REACTIVITY=on. Call spec_health — assert holodeck_config.behavioral_coupled ≥ 3, natural_language_paths includes pacing_window → "player_signal(pace, faster/slower)", npc_autonomy → "set_narrative_directive('NPCs act independently')", world_reactivity → "set_narrative_directive('the world reacts')". Assert uncoupled array contains any behavioral variables without coupling rows. Assert system variables (TTRPG_MAX_NPCS, TTRPG_DATA_DIR) absent from behavioral counts. Set TTRPG_WORLD_REACTIVITY to a value with no coupling row — assert variable appears in uncoupled. | REQ-388, REQ-069, REQ-081 |
| T451 | Automated | Binding migration: create a ruleset-free Novel, install a ruleset package, call `bind_novel_ruleset` — assert the Novel gains the slug's tools and the transition is audited. Assert `bind_novel_ruleset` on a Novel already bound to a different slug returns `[ERROR] [STATE_CONFLICT]`. Assert `resume_novel` restores the migrated binding. | REQ-380c |
| T452 | Automated | Package format integrity: build a package via the Package step, load it into a host — assert `search_rules`, lookups, and dice tools serve with no source-Markdown file access. Corrupt the package manifest's content hash — assert the host rejects the package by slug, reports expected/received hashes in `spec_health`, and continues serving other packages. | REQ-389 |
| T453 | Automated | Install surface: `install_ruleset` with a duplicate slug or incompatible host version fails naming the reason; `remove_ruleset` with a bound Novel active returns `[ERROR] [STATE_CONFLICT]`; `list_rulesets` distinguishes loaded from installed-but-idle packages. Assert all three are audited. | REQ-389c |
| T454 | Automated | Lazy hydration: start a host with three installed packages, activate a Novel bound to one — assert only that package's tools register and its index loads; the other two report `[ERROR] [STATE_CONFLICT]` on a direct ruleset tool call until their Novel is activated. | REQ-390 |
| T455 | Automated | Cold-start budget: with five installed packages of mixed size, assert cold start (process start to first tool response) meets the REQ-100 tier for the single largest package; assert `spec_health.rulesets_installed` is 5, `rulesets_hydrated` equals the number activated at first call, and aggregate index bytes is reported. | REQ-390b |
| T456 | Automated | Scoped tool listing: under a D&D-bound Novel, default `tools/list` returns infrastructure plus `dnd5e_*` only; `tools/list(scope=all)` returns all loaded packages' tools with `inapplicable` hints; with no Novel active the default listing forces no hydration. | REQ-391a, REQ-381b |
| T457 | Automated | Schema deferral: assert the on-demand schema surface returns a single tool's full schema and a single ruleset's tool set; assert default listing entries preserve name, category, and one-line purpose when abbreviated. | REQ-391b |
| T458 | Automated | Pagination: a host whose `tools/list(scope=all)` exceeds the size cap returns paginated pages; assert default scoped listing size is independent of installed package count. | REQ-391c |
| T459 | Automated | Description budget: assert every tool description fits the build-time budget recorded in DECISIONS.md; assert `spec_health.tools_list_bytes` is present and reflects the default listing. | REQ-392 |
| T460 | Automated | Update preservation: bump the host version, restart with installed packages — assert a still-compatible package stays loaded with its indexed data intact, an incompatible package is flagged `[package-incompatible]` and held inactive, and Novel/roster/codex/server-note data survives byte-for-byte. | REQ-393 |

---

## Appendix G: Source Conversion

**Scope.** When the ruleset's sources are not Markdown (the Convert workflow is selected), conversion is a build step
of its own and completes before discovery. When the sources are Markdown, this appendix
does not apply.

**Freeze.** Intake hashes the original sources (REQ-014). The converted Markdown becomes
the ruleset for every downstream purpose — parsing, extraction, citations, verification workflows — and is
itself hashed and frozen at the conversion checkpoint. Conversion never modifies the
originals.

### G.1 Capability Profile

The builder SHALL select a converter that satisfies every capability dimension applicable
to the source format. Each dimension names the format(s) it applies to, defines the
contract the converter must meet, and specifies a verification method. The builder records
the selected converter and how it satisfies each dimension in DECISIONS.md (2). Any
dimension the converter cannot satisfy SHALL be recorded as an artifact with disposition
`waived` or `pending`.

**PDF capability dimensions:**

| Capability | Applies to | Verification |
|-----------|-----------|--------------|
| Text extraction accuracy | All PDF | Content-type fidelity ≥90% (G.2) |
| Reading-order preservation | Multi-column PDF | Column detection (G.3): no interleaved sentences across columns |
| Table structure preservation | Table-bearing PDF | Row/column count within ±10% of source; content-type fidelity ≥90% on table samples |
| Inline formatting preservation | All PDF | Bold-label count within ±10% of source |
| Scanned document support | Scan-based PDF | ≥200 characters extracted per sampled page; else OCR attempted and recorded |
| Multi-page table reassembly | Multi-page PDF | No orphaned header rows; row count matches source |
| Image content classification | All PDF | Mechanical images flagged for operator review; decorative images not counted |

**HTML capability dimensions:**

| Capability | Applies to | Verification |
|-----------|-----------|--------------|
| Chrome stripping | All HTML | Chrome fingerprinting (G.4): deduplicated blocks ≥0; mechanical content identifiable after stripping |
| Dynamic content detection | All HTML | ≥500 visible-text characters per page, or flag as `[js-dependent]` |
| Pagination following | Multi-page HTML | Page budget, depth, and URL-seen set recorded; `[page-budget-exhausted]` logged if reached |
| Content-type classification | All HTML | Zero-mechanical pages skipped and logged with reason |
| Table and formatting preservation | HTML with tables | Same verification as PDF table/formatting checks |

#### Known-Good Converters

*Informational — not prescriptive. Prefer permissively-licensed converters (MIT,
Apache 2.0). Copyleft licenses (GPL, AGPL) may impose distribution obligations on the
built server.*

**PDF converters:**

| Converter | Package | Strengths | License |
|-----------|---------|-----------|---------|
| Docling | `docling` | Rich structured output, reading-order detection, RAG integrations | MIT |
| pdf-craft | `pdf-craft` | Scanned book specialist, DeepSeek OCR, fully offline | MIT |
| pdfplumber | `pdfplumber` | Precise text positioning; requires post-processing pipeline | MIT |
| MarkItDown | `markitdown` | Multi-format, fast for digital PDFs; weak on table structure | MIT |
| Marker | `marker-pdf` | Strong table extraction, reading-order detection, optional LLM boost; GPU preferred | Apache 2.0 (code); AI Pubs Open RAIL-M (model weights — free for <$5M annual revenue) |
| MinerU | `mineru` | Best CJK support, complex layouts, broad accelerator compatibility | Apache 2.0 |
| PyMuPDF4LLM | `pymupdf4llm` | Lightweight, fastest for native PDFs, no GPU; useless for scanned documents | AGPL (copyleft — embedding may impose obligations) |
| Pandoc | `pandoc` | Universal format support, mature; weak on layout preservation | GPL (copyleft) |

**HTML converters:**

| Converter | Package | Strengths | License |
|-----------|---------|-----------|---------|
| Turndown + Mozilla/readability | `turndown` | Strong chrome stripping, mature HTML→MD pipeline | MIT |
| MarkItDown | `markitdown` | Multi-format, fast HTML→MD path | MIT |
| trafilatura | `trafilatura` | Web content extraction with metadata preservation | GPL (copyleft) |
| Pandoc (HTML reader) | `pandoc` | Preserves table structure, handles inline formatting; sidebar content mixed into main flow | GPL (copyleft) |

### G.2 Progressive Sampling Protocol

Progressive fidelity sampling is the RECOMMENDED verification method — it catches
converter defects on a trial page before committing to full-batch conversion. A
builder with a pre-validated converter whose fidelity evidence is already recorded
in DECISIONS.md may bypass the progressive protocol and proceed directly to full
conversion followed by the Appendix H checklist. The fidelity thresholds (≥70%
trial, ≥90% per content type) remain normative regardless of the verification
method used.

Conversion fidelity is measured in three phases. Each phase gates the next.

**Phase 1 — Trial page.** Convert one representative page containing both tabular and
prose content. Diff the converted Markdown against the rendered source text per the
fidelity protocol (below). If fidelity is below 70%, select a different converter or
record an `[unconvertible-source]` finding in DECISIONS.md (5) — do not convert the
full batch.

**Phase 2 — Content-type expansion.** Convert three more pages spanning at least one
table-bearing section, one stat-block section, and one procedure section. Measure
fidelity per content type per the fidelity protocol. If any content type falls below
90%, tune converter parameters or switch converter and restart Phase 1. Record
per-phase results in DECISIONS.md (5).

**Phase 3 — Batch conversion.** Convert the full source. Flag every conversion
artifact per the artifact disposition rules below. Record the final per-content-type
fidelity rates.

**Artifact disposition.** Conversion artifacts (empty anchors, stray-numeral headings,
broken table fragments, unresolved column-order ambiguities, suspected merge failures)
are flagged for review. Flagged artifacts are recorded in DECISIONS.md (5) with a
disposition: `fixed` (manually repaired before G0a), `waived` (accepted with
justification and no mechanical impact on the model), or `pending` (blocks G0a
until resolved).

### G.3 PDF-Specific Protocol

When C1 is PDF, the conversion SHALL additionally:

**Column detection.** Detect multi-column regions before extraction. Extract text in
visual reading order. Where the reading order is ambiguous — overlapping bounding boxes,
irregular column widths, or column-spanning elements — flag the affected section as an
artifact with disposition `pending`.

**Multi-page table reassembly.** Detect table fragments split across page breaks.
Continuation indicators include: a header row repeated on the subsequent page, the
text "continued" or "cont." in the table caption, or a table whose row count on a
page is anomalously low (fewer rows than other tables in the same section). Merge
detected fragments. Flag tables where merge is ambiguous or fails as artifacts.

**Image-content classification.** Classify every image in the source as mechanical
(diagram, chart, flowchart, area-of-effect template, reference table rendered as an
image) or decorative (art, illustration, page border). Record image counts per
category in DECISIONS.md (5). Every mechanical image receives a `pending` disposition
— operator review required before G0a. Decorative images require no disposition.

**OCR fallback.** After text extraction, count extracted characters per page. If the
mean across sampled pages is below 200 characters, the PDF is likely scan-based.
Attempt OCR with the engine and language recorded in DECISIONS.md (2). Flag OCR
output as a converted source with a `converted-from-scan` annotation in
DECISIONS.md (5).

### G.4 HTML-Specific Protocol

When C1 is HTML or web scrape, the conversion SHALL additionally:

**Dynamic content detection.** After fetching a page, check whether the HTML body
contains meaningful text content (≥500 characters of visible text, excluding script
and style elements). If a page returns a JS-dependent skeleton — empty body, content
only in `<script>` tags, or `display:none` wrapping all content — flag the page
as `[js-dependent]` in DECISIONS.md (6). The builder SHALL NOT silently convert
empty pages into the ruleset. The operator may supply a headless-browser fetch
pipeline or re-supply the source as static HTML.

**Chrome stripping.** Before Markdown conversion, strip elements that carry site
infrastructure rather than ruleset content: `<nav>`, `<header>`, `<footer>`,
`<aside>`, `<script>`, `<style>`, and elements whose text content repeats identically
across three or more fetched pages (cross-page boilerplate). The stripped element
types SHALL be recorded in DECISIONS.md (2).

**Chrome fingerprinting.** After conversion, hash the first 20 lines and last 20
lines of each page's Markdown output. Deduplicate blocks with identical hashes across
pages before assembling the final ruleset — repeated navigation, sidebar, and footer
text SHALL NOT appear in the assembled ruleset. Record the count of deduplicated
lines in DECISIONS.md (6).

**Pagination.** Detect pagination controls — "Next", "Previous", page-number lists,
directory/index links — and follow them within the same origin. The default crawl
depth is 3 (not 1). The operator may supply an alternative depth and a maximum page
budget (default 200). The builder SHALL maintain a URL-seen set and never re-fetch a
URL already visited. A crawl that reaches the page budget without exhausting all
discovered links SHALL record a `[page-budget-exhausted]` finding in DECISIONS.md (6)
— informational, not blocking.

**Content-type classification.** Before full Markdown conversion, score each fetched
page: mechanical content (tables, stat blocks, bold-labeled fields, procedural steps)
vs. non-mechanical content (navigation indexes, blog posts, changelogs, community
forums). Pages with zero mechanical indicators SHALL be skipped — the URL, reason,
and byte count are logged in DECISIONS.md (6) but no Markdown is produced. This
classification SHALL precede the fidelity protocol; skipped pages are not counted
against fidelity thresholds.

**Web-scrape protocol.** The builder fetches pages with at least 1 second between
requests, retries failed fetches up to 3 times with exponential backoff (2/4/8
seconds), and times out individual page fetches after 30 seconds. The builder records
the scraped URL, response code, byte count, and content-type classification per page
in DECISIONS.md (6). A scrape that fails 3 consecutive pages stops and records the
failure. The builder never follows links that match known non-content patterns
(login, search, print, PDF download pages).

### G.5 Structured Fidelity Report

Fidelity results SHALL be recorded in DECISIONS.md (5) as a table, not prose
narrative:

| Page | Content type | Fidelity % | Artifacts | Disposition |
| ---- | ------------ | ---------- | --------- | ----------- |
| 12   | table        | 94%        | 1 merged cell expanded | waived |
| 34   | stat-block   | 88%        | missing inline bold | fixed |
| 56   | procedure    | 97%        | — | — |

Additional context (diff narrative, converter parameters, sampling-phase results) MAY
follow the table as prose.

### G.6 Cross-Converter Verification

The builder SHALL run a second converter satisfying the capability profile on the
fidelity sample pages. The two Markdown outputs SHALL be diffed after whitespace normalization.
Disagreements — text present in one output but not the other, or different word order
— SHALL be flagged as artifacts with disposition `pending`. The converter pair and
disagreement count SHALL be recorded in DECISIONS.md (5).

If no second converter satisfying the capability profile is available for the source
format, the builder SHALL record a `[single-converter]` finding in DECISIONS.md (5)
with the justification — informational, not blocking.

**Pin.** The converter and its version are recorded in DECISIONS.md (2); the same
converter produces the frozen Markdown and any later diagnostic re-run.

**Fidelity protocol.** The fidelity diff is character-level after normalizing
whitespace (collapse runs, trim) and stripping Markdown formatting delimiters
(`**`, `*`, backticks). The rendered source text is extracted from the original
source using the same tool pipeline as conversion — for PDF, the text-extraction
layer of the chosen converter; for HTML, the rendered-textContent output of the
same parser. Mechanical content is defined as: text within `<table>` elements
(HTML) or table regions (PDF), text matching the `**Bold Label:** value` pattern,
and text within numbered-procedure blocks (lines beginning with a digit followed
by `.` or `)` and an imperative verb). Content matching none of these patterns is
textual content — excluded from the fidelity numerator but recorded for
completeness. The fidelity rate is (matching characters in mechanical content) ÷
(total characters in mechanical content in rendered source).

---

## Appendix H: Ruleset Preparation Checklist

Before declaring the ruleset ready for discovery, confirm:

**Blocking (any failure blocks the line):**

- [ ] All headings are ATX (`##`, `###`, `####`); no setext headings.
- [ ] Every heading is unique within its file.
- [ ] All adjudicator-only sections carry a `*<adjudicator term> only*` marker on the
  heading.
- [ ] Every table has a header row; all rows have equal column counts (padded where
  needed).
- [ ] All internal cross-references resolve to existing anchors.
- [ ] The output file is valid UTF-8 with no BOM.
- [ ] Output file(s) are named `<ruleset_slug>.md` (lowercase-hyphenated).
- [ ] No commentary or meta-notes appear in the ruleset Markdown output.
- [ ] Numeric ranges use en dash or hyphen; dice-roll columns use `NdS` notation.
- [ ] Bold-labeled fields use consistent format throughout.
- [ ] Every resolution mechanic states result bands explicitly.
- [ ] Every condition has a mechanical effect and an expiry trigger.
- [ ] Code blocks carry descriptive info strings.

**Informational (log findings, do not block):**

- [ ] Top-level sections (`##`) are separated by `---` horizontal rules.
- [ ] Consecutive bold-labeled fields (definition lists) have at least two entries.
- [ ] Every procedure uses imperative verbs, numbered steps, or trigger–action–outcome
  patterns.
- [ ] Guidance text and mechanics text appear in separate sections where possible; neither
  is reclassified.
- [ ] Strikethrough and HTML comments are preserved where the source carries them.
- [ ] (Converted sources only) At least 3 randomly selected tables match their source
  pages in row count and header labels — diff the converted Markdown table against the
  fidelity sample renderings.
- [ ] (Converted sources only) Heading count in the converted Markdown matches the source
  document within ±10% — a gross structural mismatch indicates conversion failure.
- [ ] (Converted sources only) Table count and bold-label count in the converted Markdown
  match the source document within ±10% — catch missing or duplicated content before the
  fidelity diff.

---

## Appendix I: Permissively-Licensed Ruleset Catalog

This catalog lists TTRPG rulesets published under open licenses (OGL, CC BY, CC BY-SA,
ORC, or equivalent) for which a full SRD or ruleset is freely available online. The
operator may select from this list when the Convert workflow web-scrape path is chosen, or suggest their
own URL.

| #    | Ruleset                    | License                           | Key SRD URL                | Notes                                                       |
| ---- | --------------------------- | --------------------------------- | -------------------------- | ----------------------------------------------------------- |
| 1    | Dungeons & Dragons 3.5      | OGL 1.0a                          | d20srd.org                 | Core SRD covers PHB, DMG, MM content.                       |
| 2    | Dungeons & Dragons 5e (2014) | OGL 1.0a + CC BY 4.0 (SRD 5.1)   | 5esrd.com                  | SRD 5.1 is dual-licensed.                                   |
| 3    | Pathfinder 1e               | OGL 1.0a                          | d20pfsrd.com               | Official partner site is Archives of Nethys (aonprd.com).    |
| 4    | Pathfinder 2e               | OGL 1.0a + ORC                    | 2e.aonprd.com              | Remastered content uses ORC; legacy OGL for earlier printings. |
| 5    | Starfinder 1e               | OGL 1.0a                          | aonsrd.com                 | Archives of Nethys hosts the official SRD.                   |
| 6    | Traveller                   | OGL 1.0a                          | traveller-srd.com           | Mongoose Publishing SRD; 40+ year sci-fi legacy.             |
| 7    | FATE Core                   | OGL 1.0a + CC BY 3.0              | fate-srd.com                | Multiple ENNIE awards; widely hacked narrative system.       |
| 8    | Blades in the Dark          | CC BY 4.0                         | bladesinthedark.com (FitD SRD) | ENNIE winner; spawned 50+ Forged in the Dark games.          |
| 9    | Dungeon World               | CC BY 3.0                         | dungeonworldsrd.com         | Most popular PbtA fantasy ruleset.                              |
| 10   | Old-School Essentials       | OGL 1.0a                          | necroticgnome.com (SRD)     | Top OSR retroclone; known for clarity and layout.            |

---

## Appendix J: Anti-Slop Synopsis

_Spec-embedded narrative quality guardrails. The full catalogue — with elaborated
forbidden/correct examples, pacing advice, and genre-specific patterns — is sourced from
the Synthesis workflow (§11.1) as supplementary guidance, served at `guidance://<badge>/anti-slop`
(REQ-070)._

| #  | Role   | Severity | Pattern                  | Forbidden                                        | Correct                                                     |
| -- | ------ | -------- | ------------------------ | ------------------------------------------------ | ----------------------------------------------------------- |
| 1  | GM     | Soft     | Purple prose             | Over-ornamented description burying detail       | Concrete, sensory, actionable — "The hall is old. Cracked pillars. Moss on the flagstones." |
| 2  | GM     | Soft     | Negation framing         | Describing by what is absent ("you don't see…")  | Describing what is present ("The corridor is still. Dust settles.") |
| 3  | GM     | Soft     | Rushing to closure       | Resolving all tension in one response            | Ending on an image or choice, not a resolution               |
| 4  | GM     | Hard     | Declaring player actions | Narrating what a PC thinks, feels, or decides    | Describing the world; letting the player react               |
| 5  | Player | Hard     | Establishing world facts | Declaring what exists as established truth       | Asking whether elements exist ("The curtains — are they moving?") |
| 6  | Player | Hard     | Assuming outcomes        | Narrating results before adjudication            | Describing intent and attempt, waiting for resolution         |
| 7  | Player | Hard     | Declaring NPC reactions  | Stating how an NPC responds                      | Laying out reasoning, waiting for GM response                |
| 8  | GM     | Soft     | Echoing                  | Restating player action without adding new information ("You attempt to pick the lock. The lock is before you.") | Advancing the scene with new sensory detail or consequence ("Your pick scrapes inside the mechanism. A click — then a second, heavier clunk from deeper in the wall.") |
| 9  | GM     | Soft     | Passive voice dominance  | Describing events without engaging player agency ("The door is opened. The room is revealed.") | Centering the player's senses or actions ("You push the door open. Cold air spills out. The room beyond is dark — but you hear breathing.") |
| 10 | GM     | Soft     | Motif repetition         | Reusing the same adjective, sentence structure, or descriptive template across responses | Varying sensory register between responses — if the last scene used visual description, open the next with sound, smell, or temperature |
| 11 | GM     | Hard     | Constraint forgetting    | Narrating in contradiction of established scene state, character conditions, or earlier decisions | Checking active scene state, entity conditions, and lore before narrating; when uncertain, re-reading the scene description |
| 12 | Both   | Soft     | Meta-commentary leakage  | Breaking character with out-of-character commentary ("As a GM, I would describe...", "That's a great question!") | Staying in the narrative register; reserving OOC communication for explicit OOC markers or system-level error messages |

---

## Appendix K: Adventure Module Format

Every adventure module loaded at build time SHALL conform to these conventions.
Adventures MAY omit the `## World` section — such adventures index as flat
prose content only.

### Required structural conventions

- `# Adventure Title` — used as the adventure slug (lowercase-hyphenated).
- `## Overview` — GM-only summary. Marked with the ruleset's adjudicator term.
- `## Adventure Hook` — player-visible introduction. No badge marker.
- `## World` (optional) — world-model declarative assertions. When absent, the
  adventure is indexed as flat prose content.
- `## Encounters` / `## NPCs` / `## Traps` / `## Lore` — TTRPG content blocks.
  Each block may contain `@category(Object Name)` annotation directives
  linking to world-model objects.
- `### Location Name` — individual rooms or scenes within the adventure's prose.
  These are guidance content, not mechanically enforced world-model rooms (use
  `## World` for mechanical rooms).

Adventure modules MAY include an optional `## Preview` section. When present, this section
SHALL contain 2–3 sentences of GM-facing premise. The preview is surfaced by
`list_adventures` (REQ-292). When `## Preview` is absent, `list_adventures` SHALL derive
the preview from the first sentences of the `## Adventure Hook` section, prepending
`[derived]` to indicate automated generation.

### World section format

The `## World` heading marks a declarative world-model block. Each line within
the section is one assertion. Supported assertion patterns:

- Room declaration: `<Name> is a room. "Description."`
- Room creation by exit: `<Direction> of <Room> is <Other Room>.`
- Thing with containment: `<Name> is in <Room>. "Description."`
  or `A <name> is in <Room>.`
- Thing on supporter: `<Name> is on <Supporter>.`
- Property declaration: `It is closed and locked.` or
  `<Name> is fixed in place.`

### TTRPG annotation format

Annotation directives reference world-model objects by name. Each directive
occupies one line:

```
@encounter(<Room Name>) <Description of the encounter>
@trap(<Room Name>) <Mechanics: DC, save type, damage>
@npc(<Name>, <Room Name>) <Stat block summary>
@lore(<Object or Room Name>) <Lore content>
```

An `@npc` annotation creates a Novel-scoped NPC at the named room's location.
An `@lore` annotation creates a Novel-scoped lore entry triggered when the
player enters or examines the named object. `@encounter` and `@trap` annotations
are inert reference data — the GM invokes them as encounters and checks at
runtime.

An unrecognized annotation category SHALL be treated as guidance content —
indexed for search but not mechanically linked.

### Format example

```markdown
# Tomb of the Serpent King
_A dungeon adventure for 4–6 delvers of levels 3–5._

## Overview — *Keeper only*
The tomb lies beneath the Marsh of Whispers. The delvers seek the Serpent Crown.

## Adventure Hook
The village elder offers 500 gold for the Crown. She knows the entrance is at the
base of the Weeping Willow, three days into the marsh.

## World
The Entrance Chamber is a room. "A dusty room with faded murals of serpent figures."
North of the Entrance Chamber is the Hall of Statues.
The Obsidian Door is north of the Hall of Statues and south of the Throne Room.
It is closed and locked.
The Serpent Crown is in the Throne Room. "A golden crown set with emerald eyes."

## Encounters — *Keeper only*
@encounter(Hall of Statues) Two stone golems animate when the crown is touched.

## NPCs
@npc(Serpent King Ghost, Throne Room) AC 15, HP 45. Incorporeal. Appears when
the crown is taken.

## Traps — *Keeper only*
@trap(Entrance Chamber) Poison dart trap: DC 13 Perception to spot, DC 15 Dex
save or 2d6 poison damage.

## Lore
@lore(Entrance Chamber) The murals depict the Serpent King conquering seven
nations. A faded inscription reads: "Only the worthy may wear the crown."
```

### Scene-world coupling example

When a world model is populated from adventure content and the Game Master sets a
scene whose `location` matches a room, the room's spatial reality composes into the
scene. The GM's free-text description provides narrative framing:

1. `set_scene_state("The king's burial chamber", location="Throne Room")` — the
   scene's spatial truth is the Throne Room: exits north/south (Obsidian Door),
   contained things (Serpent Crown). The description "The king's burial chamber" is
   narrative framing — it replaces the room's default prose but does not override
   exits or containment.
2. `resolve_intent("look")` from the Game Master badge returns:
   - Room: Throne Room
   - Description: "The king's burial chamber" (framed)
   - Exits: north (Obsidian Door, locked), south (Hall of Statues)
   - Visible things: Serpent Crown
3. `resolve_intent("go south")` — spatial transition resolves correctly.
4. When no room matches, `location` is a free-text label (current behavior).

NPCs whose `location` field matches a room name auto-register: `@npc(Serpent King
Ghost, Throne Room)` places the NPC in the Throne Room, visible on `resolve_intent`
from that room.

### Indexing and badge gating

Adventure content is indexed during discovery alongside the ruleset. Anchors are
derived from headings. `*Keeper only*` sections produce GM-only guidance items.
Unmarked sections produce shared (player-visible) guidance items. When a `## World`
section is present, declarative assertions are extracted and the world-model tier
is populated when `load_adventure` is called. TTRPG annotations are linked to
world-model objects by name; unmatched annotations are reported as unresolved
references. Adventure content appears in `search_rules` results filtered by active
adventure and badge. The `load_adventure` tool (REQ-079, REQ-292) sets the active adventure
and populates the world model for the current Novel.

**Non-Appendix-K adventures.** Adventure modules that do not conform to Appendix K
conventions — PDF-to-Markdown conversions, raw prose without `## World` sections,
unannotated content — are still structurally extracted and pre-populated per
REQ-247 (adventure structure extraction) and amended REQ-079. Appendix K conventions
enable higher-confidence extraction, world-model population, and `@npc` annotation
linkage. Non-conforming modules use discoverable-pattern extraction at LOW or
MEDIUM confidence — they receive NPC pre-population, location lore entries, and
faction creation, but cannot create world-model rooms or linked annotation entities
without a `## World` section.

---

## Appendix L: Lorebook Interchange Format

Lorebook export (REQ-094) produces JSON (SillyTavern-compatible World Info array)
and Markdown (HTML-comment-annotated entry document) formats. Both must carry these
metadata fields on every entry such that round-trip fidelity is preserved: `key`,
`content`, `triggers`, `badge_scope`, `priority`, `sticky`, `enabled`, and `group`.
Export excludes mechanical state (HP, conditions, combat position). Import respects
merge, replace, and dry-run modes per REQ-094. Markdown export embeds metadata as a
JSON object within an HTML comment on the line immediately following each entry
heading (`<!-- holonovel-meta: { ... } -->`), such that
`export_lorebook(markdown) → import_lorebook` produces lore entries indistinguishable
from the `export_lorebook(json) → import_lorebook` round-trip. Non-lore entries
found during import are preserved as inert reference content. Format schemas are
determined by the builder; the convergence loop (§6.5) enforces round-trip fidelity
against this metadata contract.

---

## Appendix M: REQ Authoring Conventions

This appendix defines what belongs in a requirement and what does not. It is not a
build artifact — it is a spec-maintainer reference.

**REQ Authoring Checklist** (apply before committing any new or modified REQ):

- [ ] States *what*, not *how* — no parameter types, sort orders, or algorithms
- [ ] No "Default:" clauses — defaults are the builder's domain
- [ ] No enumerated catalogs (>5 tokens) — use categories, not lists
- [ ] No worked examples disguised as requirements
- [ ] Trust-the-loop test: would the convergence loop catch this deviation?
- [ ] Red-team test: answered four questions from §4 Standing Rule 8
- [ ] Holodeck archetypes: new property group assigned archetypes in §7.7; coupling table
      extended for all property-group pairs per REQ-370; `[none]` declared where inapplicable
- [ ] Content sources: new content source type assigned property-group population mappings;
      downstream couplings covered by populated properties' archetype rules; no new coupling
      rows needed in §7.7.1
- [ ] Holodeck config alignment: every behavioral configuration introduced by this REQ
      has a coupling row in §7.7.1a with a Session-archetype source (player_signal or
      set_narrative_directive). System configuration is annotated as non-behavioral
      with justification.
- [ ] REQ body is exactly one paragraph — no blank lines, no tables, no bullet lists,
      no numbered steps
- [ ] REQ body is ≤ 800 characters
- [ ] REQ contains exactly one logical contract — if it has multiple SHALL clauses
      covering distinct concerns, split it
- [ ] Procedural/algorithmic content is in §6 or §7, not in the REQ body
- [ ] REQ body contains ≤ 8 sentences
- [ ] REQ body contains no more than 5 backtick-delimited enumerated tokens

These checks are mechanically enforced by `npm run validate --sdd-strict` — parameter type
annotations, Default: clauses, body-length violations, enumerated catalogs,
lifecycle repetition, multi-paragraph REQs, embedded tables, bullet lists,
numbered steps, and sentence-count violations all surface as errors before commit.
The proofreading checks (passive voice, modal drift, double negatives, sentence length,
condition stacking, pronoun ambiguity, term drift, REQ-body readability, narrative
prose readability) surface as warnings.

**Prose readability standard.** The narrative prose — the "How to read this
specification" block plus the prose of §1 through §4 — SHALL read at a Flesch-Kincaid
grade level of 12 or below. The check is a warning, not a gate: a paragraph flagged above
grade 12 does not block a commit. A flag is a *pointer*, not a verdict — the author reads
the flagged paragraph and rewrites it only if it is genuinely hard to follow. Length and
domain vocabulary alone are not defects; the numbered Standing Rules of §4, the §5
requirement bodies, and the reference appendices are exempt from this standard.

**REQ anatomy.** One paragraph stating a single verifiable contract — the
*what*. Ends in `_Check:` with test citations. Contains no parameter types,
no algorithm descriptions, no default values, no catalog enumerations
(>5 tokens), no markdown tables, no bullet lists, no numbered steps, and
no blank lines. A REQ body IS a single paragraph — if it needs more, it
is at minimum two REQs. Sub-REQs (e.g., REQ-XXXa) handle composable,
separable concerns. The gate (`npm run check`) fails on any violation —
there is no grandfathering.

**Provenance.** Every REQ SHALL be traceable to its origin spec version and
CHANGELOG entry via version control history. When a REQ is modified, the
CHANGELOG entry SHALL cite the REQ by ID and the nature of the change.
Appendix E mechanically verifies every REQ in §5 is cited exactly once in
the traceability table. Provenance for deleted REQs is maintained by the
CHANGELOG.

**SDD enforcement rules.** The following are mechanically enforced at
commit time via `npm run check`:

- No REQ body shall exceed 800 characters.
- No REQ body shall contain a markdown table.
- No REQ body shall contain bullet lists or numbered steps.
- No REQ body shall span more than one paragraph (no blank lines).
- No REQ body shall exceed 8 sentences.
- No REQ body shall contain more than 8 SHALL clauses.
- Every REQ body shall end with `_Check:` citing at least one test ID.
- No REQ body shall enumerate more than 5 backtick-delimited tokens.

These rules are not advisory. A REQ violating any rule is a spec defect
that blocks the assemble gate. The author SHALL split the REQ or move
procedural content to the appropriate section (§6 for build processes,
§7.7 for coupling, Appendices for reference tables, §B.3 for worked examples).

**Bloat prevention.** Before adding a new REQ, the author SHALL verify:
(a) no existing REQ already covers this concern; (b) the convergence loop
would not catch the deviation without a new REQ; (c) the concern could not
be covered by extending an existing REQ rather than proliferating new REQ IDs.
The validator-computed per-section REQ count (reported by `npm run validate`)
serves as a bloat indicator — a §5 subsection exceeding 40 REQs SHALL trigger a
maintainer review for consolidation. This check is mechanical (`npm run
validate` reports section REQ counts) and informational — a flagged section may
be justified by its domain complexity.

**What belongs elsewhere:**

- Parameter shapes and tool signatures → builder discovery + convergence loop
- Sort orders, algorithms, and trigger-scan caps → builder's implementation judgment
- Default starting values → builder determines; verified by verification workflow thresholds
- Tool name lists and resource URI catalogs → `tools/list` and `resources/list` are the
  live registries; the REQ states the category
- State-machine transition rules → state model table (§7.7) is canonical
- Worked examples and step-by-step procedures → golden transcript (§B.3) and the Pattern Buffer (§6.6)
- JSON schemas and file format specifications → builder's implementation; verification workflows verify
  correctness
- Procedural pipelines and phase descriptions → §6 (Build Process)
- Pattern-matching tables and classification heuristics → §6.3 (Discovery)
- Coupling acceleration and state-machine rules → §7.7 (Coupling Table)
- Return-value field enumerations → Appendix O (Behavioral Contracts)
- Infrastructure tool category enumerations → Appendix T (Tool Surface Map)

**The "trust the loop" test.** If a deviation from a requirement would be caught by
G2, G4, G5, the convergence loop, or a Pattern Buffer sub-workflow, do not specify the mechanism
in the REQ — specify the outcome. The REQ ends at the contract boundary.

**EARS notation.** REQ authors are encouraged — but not required — to structure
requirement bodies using the Easy Approach to Requirements Syntax (EARS). EARS
collapses ambiguity by making trigger, condition, and response explicit in machine-parseable
clauses. The five EARS patterns are:

- **Ubiquitous:** "THE system SHALL <behavior>." — always-true constraints.
- **Event-driven:** "WHEN <trigger> THE system SHALL <response>."
- **State-driven:** "WHILE <state> THE system SHALL <behavior>."
- **Unwanted behavior:** "IF <condition> THEN THE system SHALL <response>."
- **Optional feature:** "WHERE <feature is included> THE system SHALL <behavior>."

A REQ body that embeds EARS clauses alongside its narrative prose is easier for AI
builders to parse and harder to misinterpret. The narrative REQ body remains the
canonical contract; EARS clauses are supplementary precision tools, not replacements.
Appendix M's existing rules — no parameter types, no default values, no algorithm
descriptions — still apply to EARS clauses.

**Convergence-driven REQ review.** When the convergence loop produces more than two
findings of the same class across two or more ruleset builds, the builder flags the
pattern in DECISIONS.md (5) as a candidate for REQ revision. Common prefix classes
(see §6.5.4 Finding taxonomy) include:
consistently low extraction confidence in a section type not covered by existing
heuristics, repeated MUST-coverage gaps from an unmodeled mechanic present in multiple
rulesets, or repeated Pattern Buffer failures from an undertested contract. The flag cites
the finding class, the affected rulesets, and the REQ(s) most likely affected. This is
a spec-maintainer signal, not a build requirement.

---

## Appendix O: Behavioral Contracts — Reference

O.1–O.7 contracts are defined in §5 (REQ-001, REQ-002, REQ-003, REQ-032, REQ-041,
REQ-042, REQ-043, REQ-055, REQ-092). Output formats are documented in §7.3.

**O.2 — Error taxonomy (canonical catalog):**

| Category | Raised when | Corrective action |
|----------|------------|-------------------|
| `[FORBIDDEN]` | Caller lacks badge permission for the tool | "Use `set_badge` to switch to the required badge." |
| `[NOT_FOUND]` | Named entity or value does not exist in the indexed catalogue | Enumerate badge-filtered valid values; include "Did you mean?" hint for close matches |
| `[INVALID_INPUT]` | Input is malformed, out of range, or fails format validation | Enumerate badge-filtered valid values |
| `[STATE_CONFLICT]` | Action cannot proceed in current state (empty undo stack, ended Novel, pending workflow, coupling conflict) | Describe the state that must change; for coupling conflicts, enumerate the conflicting coupling rows (§7.7.1a) |
| `[RULE_VIOLATION]` | Input is well-formed but violates a ruleset constraint | Cite the ruleset anchor forbidding the action |
| `[UNIMPLEMENTED]` | Valid input but feature not yet modeled (waiver exists) | Name the unimplemented subsystem and cite the waiver entry in DECISIONS.md |
| `[AMBIGUOUS]` | Input matches multiple canonical entries | Enumerate matching entries with distinguishing fields |
| `[MISSING_PARAM]` | Required parameter is absent or empty and no default is defined | Name the missing parameter and its expected format |
| `[SYSTEM]` | Protocol/transport-level failure (JSON-RPC `-32000`), unrecoverable at the tool layer | Absent (no corrective action) |
| `[REJECTED]` | AI-narration proposal fails ruleset validation (REQ-312) | Corrective suggestion naming the violated state |

Empty-string searches return no results — not an error — with valid-value enumeration.
An error that matches a single close name SHALL include a "Did you mean?" hint. When
multiple close matches exist, list them all ("Did you mean one of…"). `Corrective
action: <action>` follows on a separate line.

**O.1 — Roll transparency example:**

```
[OK] Total: 14 — success
Dice: 1d20 = [12]
Modifiers: Strength +3, Proficiency +2
Outcome: The attack lands.
```

When multiple sources contribute to a modifier, each is listed separately.
A single source (e.g., an unskilled ability check) reports only that source.
When multiple dice are rolled with subset selection (advantage, disadvantage,
drop-lowest), all faces are reported with indication of which were selected:

```
[OK] Total: 19 — success
Dice: 2d20 = [12, 19], used: 19
Modifiers: Strength +3, Proficiency +2
Outcome: A clean strike past the guard.
```

Verify with T91, T138.

---

**O.8 — Lookup completeness example:**

A weapon lookup returns all defined fields inline:
  **Longsword** (martial melee)
  Cost: 15 gp  |  Damage: 1d8 slashing  |  Weight: 3 lb.
  Properties: Versatile (1d10)

A spell lookup returns all defined fields, not a file pointer:
  **Fireball** — 3rd-level evocation
  Casting Time: 1 action  |  Range: 150 feet  |  Duration: Instantaneous
  Components: V, S, M (a tiny ball of bat guano and sulfur)
  Description: A bright streak flashes from your pointing finger...

A monster lookup returns a full stat block, not a file pointer:
  **Goblin** — Small humanoid (goblinoid), Neutral Evil
  AC: 15 (leather armor, shield)  |  HP: 7 (2d6)
  Speed: 30 ft.
  STR 8 (-1) | DEX 14 (+2) | CON 10 (+0) | INT 10 (+0) | WIS 8 (-1) | CHA 8 (-1)

Verify with T47.

---

## Appendix P: STRIDE Security Threat Model

_This appendix is a spec-level security review, not a per-build check. It maps
each STRIDE category to Holonovel-specific threats, existing mitigations, and
identified gaps. Update this appendix on major spec revisions._

STRIDE categorises threats as Spoofing, Tampering, Repudiation, Information
Disclosure, Denial of Service, and Elevation of Privilege.

| STRIDE | Threat | Existing mitigation | Gap |
| ------ | ------ | ------------------- | --- |
| **Spoofing** | Client impersonates GM via `set_badge` without authorization | `set_badge` is always callable (REQ-066) — no authentication mechanism exists; the spec assumes a single trusted operator | **Moderate.** The server trusts all callers. For solo play this is acceptable by design; for multi-operator scenarios it is a documented limitation. |
| **Tampering** | Novel state file corrupted on disk | REQ-092: atomic writes + `.bak` retention + checksum verification, T88 verifies backup creation and recovery | **Minor.** Checksum detects tampering at load time; corruption between writes and backup retention could still degrade if both files are tainted identically. |
| **Tampering** | Audit log entries forged by direct file manipulation | REQ-040: append-only audit log, but append-only is enforced at the API level — the on-disk JSON is writable by the host process | **Minor.** No cryptographic integrity on audit log entries. Operator trust required. |
| **Repudiation** | Mutations denied by operator claiming tools were never called | REQ-040: append-only audit log records every mutating call with timestamp, badge, tool name, arguments, and output prefix; T8 verifies logging | **Covered.** Audit log provides non-repudiation at the operator-trust level. |
| **Information Disclosure** | Player badge sees GM-only lore through side channels in error messages | REQ-032: badge-filtered error values, REQ-002: curated valid-value enumerations, `[FORBIDDEN]` on GM-only requests | **Minor.** Error message verbosity (e.g., "Did you mean?" hints for GM-only terms) could leak existence of GM-only content. Not systematically audited. |
| **Information Disclosure** | Player reads GM-only content through badge_briefing truncation or resource URI guessing | REQ-032: badge filtering on all surfaces, §10 adversarial round tests rapid badge switching | **Covered.** Tested at adversarial round. |
| **Denial of Service** | State accumulation exceeds available memory (unbounded NPC count, lore entries, audit log) | §10 adversarial round (d): 500 NPCs in one Novel; S20: 50-round campaign endurance test | **Moderate.** No hard caps on NPC count, lore entry count, or audit log size beyond the adversarial test threshold. A determined operator could exceed tested limits. |
| **Denial of Service** | Malformed input crashes the server | REQ-054: input validation on every tool, T20: path traversal and malformed input rejection | **Covered.** |
| **Elevation of Privilege** | Player bypasses badge gating through rapid badge switching | §10 adversarial round (a): 20 rapid switches during combat, no state leak | **Covered.** Tested. |
| **Elevation of Privilege** | Player accesses GM-only resources through direct URI crafting | REQ-032: server-side gating on every endpoint including resources, T44 verifies player boundary | **Covered.** |
| **Tampering** | Converter tool produces subtly incorrect Markdown (swapped table columns, merged paragraphs) | Progressive fidelity sampling (Appendix G.2) catches gross errors; cross-converter verification (Appendix G.6) catches format-specific errors a single converter misses; pinning ensures reproducibility | **Minor.** Cross-converter verification on the fidelity sample surfaces disagreements a single converter would hide. |
| **Denial of Service** | Web scrape exhausts builder resources, gets IP banned by source site | Web-scrape protocol (Appendix G) enforces rate limiting and retry with backoff | **Minor.** Single-source scrape is bounded. Multi-source concurrent scraping is not addressed. |
| **Information Disclosure** | Scraped page source contains credentials, session tokens, or personal data | Chrome stripping (Appendix G.4) removes `<script>`, `<style>`, and non-content HTML elements before conversion; content-type classification (Appendix G.4) skips pages with no mechanical indicators | **Minor.** Stripping reduces the attack surface; classification skips the most likely injection targets (blog posts, forum pages). The spec still assumes trusted sources for content-bearing pages. |

_Verify:_ None — this appendix is a reference analysis. Gaps identified here are
candidates for future spec revisions, not per-build verification targets.

---

## Appendix Q: Novel Interchange Format

_Novel export (REQ-096) produces self-contained interchange files in JSON and Markdown
formats._

**JSON format.** The top-level object contains these keys:

| Key                | Content                                                         |
| ------------------ | --------------------------------------------------------------- |
| `format_version`   | Integer — the Novel format version at time of export (REQ-092)   |
| `manifest`         | Portability metadata object (see below)                           |
| `novel_metadata`   | slug, name, created_at, last_modified_at, spec_version            |
| `entities`         | Array of entity objects with all mechanical and narrative fields  |
| `npcs`             | Array of NPC objects with all fields                             |
| `factions`         | Array of faction objects with clock state (REQ-233)               |
| `relationships`    | Array of relationship objects (REQ-236)                           |
| `secrets`          | Array of secret objects with known-by status (REQ-234)            |
| `gm_context`       | Pause/resume context object (REQ-232)                             |
| `notes`            | Object mapping note keys to `{content, badge_scope}` objects (REQ-242)             |
| `scene`            | Current scene description and scene type                          |
| `countdowns`       | Array of active countdowns with name, ticks, type, clock_type     |
| `lore`             | Array of lore entries (Appendix L schema per entry)               |
| `synthesis`       | Array of synthesis items across all seven output modules          |
| `adventure`        | Active adventure slug and generated adventure content            |
| `audit_log`        | Array of audit entries (timestamp, badge, tool, args, output)       |
| `checkpoints`      | Array of checkpoint objects `{label, timestamp, state}` (REQ-241) |
| `badge_state`        | Active badge and per-Novel badge preferences                          |
| `undo_snapshots`   | Array of snapshot objects (per-badge stacks)                        |

The `manifest` object SHALL contain: `novel_format_version` (integer),
`server_spec_version` (spec CalVer string), `ruleset_hash` (SHA-256 hex string),
`builder_implementation` (object with `name` and `version` strings),
`adventure_module_slugs` (array of strings), `adventures_embedded` (boolean),
`property_groups_present` (array of populated tier name strings), and
`waiver_dependent_mechanics` (array of mechanic name strings from DECISIONS.md).

**Markdown format.** HTML-comment-annotated sections following the same key structure
as the JSON format. Each section begins with `<!-- @section <key> -->` and contains
the section's data in a human-readable Markdown representation. Sections with empty
arrays or null values are omitted.

**Round-trip fidelity.** `export_novel(format)` → `import_novel(data, mode)` →
`export_novel(format)` produces identical output for the same format. The builder
determines the exact schema and serialization; the convergence loop enforces
round-trip fidelity as a verification check.

_Verify with:_ T100.

---

## Appendix R: Deprecated Terminology

Terms listed here must not appear in implementation surfaces — tool names,
tool descriptions, parameter names, resource URIs, prompt names, field names,
error messages, or state-model property names. The canonical term is the one
used in the citing REQ body. An audit subagent greps for each deprecated
term during Convergence Phase 2's Surface Terminology domain and flags every
match as a finding.

| Deprecated term | Canonical term | Citing REQ |
|----------------|---------------|------------|
| persona (as parameter name, field name, or description text — excluding "personality" which is correct per REQ-077) | badge | REQ-031, REQ-066 |
| persona_scope | badge_scope | REQ-032, REQ-083 |
| persona_filter | badge_filter | REQ-086 |
| persona_briefing | badge_briefing | REQ-109 |
| person_briefing | badge_briefing | REQ-109 |
| oce, oce-state | `.holonovel-state` | REQ-055 |

**Multi-ruleset glossary.** These terms are defined in §4 and are collected here
for forward reference:

| Term | Citing REQ |
|------|-----------|
| ruleset slug | REQ-379 |
| tool prefix | REQ-379 |
| ruleset package | REQ-389 |
| host server | REQ-390 |
| install directory | REQ-390 |
| ruleset scope | REQ-380 |
| inapplicable hint | REQ-381 |
| cross-ruleset isolation | §8 G8 |

---

## Appendix S: Builder Glossary

Domain terms are defined in §4 (Terminology). This appendix adds the terms the
builder needs when the source ruleset overlaps Holonovel's own vocabulary, plus
attribution for borrowed mechanics.

Holonovel names that collide with tabletop vocabulary — "Wisdom", "Computer",
"Novel" — are defined in §4 and SHALL NOT be re-interpreted through the source
ruleset's meanings. Where a ruleset uses its own name for a concept Holonovel
already models, the builder SHALL use the ruleset's term for extracted tool
names (REQ-020) but SHALL annotate the mapping in RULESET_MODEL.md.

**Borrowed-mechanics attribution.** The following mechanics are genericized
narratives adapted from published roleplaying traditions, not rule imports:

- **Vows**, **milestones**, and difficulty ranks (`troublesome`, `dangerous`,
  `formidable`, `extreme`, `epic`) — adapted from Ironsworn's vow-progress loop.
- **Clocks** (progress/faction clocks) — adapted from Blades in the Dark's
  clock system; surfaced in Holonovel as countdowns.
- **Danger** and scene framing — common across many tabletop systems.

The builder treats these as first-class Holonovel mechanics (REQ-289, REQ-073,
REQ-233); they are not contingent on any published ruleset and are never waived.

---

## Appendix T: Tool Surface Map

Infrastructure tools in four immutable categories, independent of ruleset
content, always present in `tools/list`. These are never waived.

| Category | Tools |
|----------|-------|
| **World** | Room, thing, exit, and property operations; parser command dispatch; source conversion (`holonovel` package) |
| **Novels** | Save-file lifecycle, exchange, checkpoints, notes, resume state, archive, and server notes |
| **Badges & Workflow** | Badge switching, workflow response, undo/redo, and help — the identity and permission layer |
| **Narrative** | Story-content tools, grouped: Scene & Tone, Cast & Characters, World State, Player Interaction, Story Memory, Session Management, Synthesis Controls |

The `help` tool SHALL present these categories as the base grouping. The builder
MAY subdivide or rename categories for runtime display, but every tool in the
infrastructure enumeration SHALL appear under exactly one help category. The
mapping from infrastructure category to help category name SHALL be recorded in
DECISIONS.md. Help category names are advisory — the GM may override them
(REQ-067) — but the infrastructure classification is immutable.

_Verify:_ T3, T5, T32, T33.

---
