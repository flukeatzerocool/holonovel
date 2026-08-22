## 5. Requirements

_The normative core. Each requirement is exactly one paragraph — no blank lines,
no tables, no bullet lists, no numbered steps. Ends in `_Check:` with test citations.
Sub-REQs (XXXa, XXXb) handle composable concerns. Enforced by `npm run check`._

| §       | Title                               | REQs                                                |
|---------|-------------------------------------|-----------------------------------------------------|
| 5.1     | Output and Error Contracts          | 001–004, 001a–001b, 002a–002c, 004a, 060–062, 064, 070–071, 101, 113, 118, 179, 184, 194, 277, 280 |
| 5.2     | Extraction and Confidence           | 010–018, 099, 102, 111, 147, 153–154, 207, 209–212, 214–215, 225, 272, 302, 315, 324, 354 |
| 5.3     | Tools, Resources, and Lookups       | 020–025, 057–059, 063, 067, 078, 105–107, 110, 112, 138–139, 160, 161–164, 169, 182–183, 187, 278, 296, 323, 408, 411, 413–415 |
| 5.4     | Decision Workflows                  | 042, 056, 104, 140, 151–152, 190–193, 224, 235       |
| 5.5     | Badges and Access                   | 030–032, 066, 109, 133–137, 148–150, 159, 216, 220, 223, 281, 286, 304–306, 306f–306g |
| 5.6     | State and Lifecycle                 | 040–041, 043–044, 065, 069, 072–077, 076a, 079, 116, 119–124, 126–129, 132, 156, 203–206, 217, 221, 229, 232–233, 233a, 234, 236–237, 239, 241–242, 247–250, 252, 255, 285, 307–308, 311, 321–322, 329–332 |
| 5.7     | Determinism, Safety, and Performance | 050–055, 100, 157, 251, 253, 269, 409–410, 416–417  |
| 5.8     | Synthesis, Lore, and Macros          | 080–087, 084a, 103, 114–115, 125, 130, 155, 158, 226–228, 230–231, 234, 243–245, 260–266, 328, 333 |
| 5.9     | Novel Persistence and Transport       | 088–098, 117, 131, 238, 240, 256–259, 334           |
| 5.10    | World-Model Layer                     | 195–202, 222, 283–284, 309, 316–320, 325–327, 367–368        |
| 5.11    | Ruleset-Free Build Mode               | 218–219                                             |
| 5.12 | Narrative Architecture | 335–366 |
| 5.13 | Holodeck | 369–371, 374–376 |
| 5.14 | Content Sources | 372–373 |
| 5.15    | Mechanical Coupling                  | 377–378                                             |
| 5.16    | Multi-Ruleset Build                  | 379–387                                             |
| 5.17    | Ruleset Packages                     | 389–393                                             |
| 5.18    | Workflow Entry Points                | 395a–395b, 396–398                                  |
| 5.19    | State Persistence Guardrails         | 400–407                                             |
| 5.20    | Narrative Turn Conventions           | 412                                                 |

### 5.1 Output and Error Contracts

**REQ-101a — Assumption audit trail (Part a).**
workflow begins, the builder invokes the `assumption_audit` prompt (a spec-level prompt shipped with the specification — not a server prompt) against the current spec revision and records at least one challenged assumption per category — technology, AI-as-builder, extraction and confidence, MCP ecosystem, state persistence, verification model, build process, runtime guarantees, spec process — in DECISIONS.md (0). The audit does not block the build. For spec revisions, a diff-only audit — challenging only assumptions affected by the spec delta — is acceptable.

**REQ-101b — Assumption audit trail (Part b).**
For same-spec builds against different rulesets, when a prior assumption audit exists for the same spec version, only assumptions in categories affected by the ruleset paradigm delta are re-audited. Categories unaffected by the ruleset change (technology, MCP ecosystem, verification model, build process) carry forward the prior audit results. The builder records the prior audit's ruleset fingerprint for traceability.

**REQ-101c — Assumption audit trail (Part c).**
Audit re-use does not block the build — a full audit is always acceptable. *Acceptance criterion:* DECISIONS.md (0) contains at least one challenged assumption per category with justification, or a diff-only audit note for spec revisions, or a re-use note citing the prior audit's ruleset fingerprint for unaffected categories. _Check:_ T89.
**REQ-001 — Response contract.** _(F3)_ Every tool response begins with a status prefix:
`[OK]`, `[NEED_INPUT]`, `[PARTIAL]`, `[ERROR]`, or `[WARNING]`. Tool-level failures use
`isError: true` with the prefix in `content[0].text`; protocol-level failures use JSON-RPC
error code `-32000` with the prefix in `message`. SDK-level schema errors use `-32602`.
*Acceptance criterion:* Every tool response from a running server uses exactly one
of the five prefixes; protocol-level errors use JSON-RPC error code -32000 with the
prefix in `message`.
_Check:_ G2; Appendix D.

**REQ-001a1 — Warning and Partial semantics (Part a1).**
requested operation succeeds but encounters a condition requiring operator attention — corrupted-but-unused state, seed conflict where a per-call seed overrides the session seed, or speculative operations where the server cannot guarantee the outcome's correctness. `[PARTIAL]` is raised when the requested operation can produce a partial result but cannot fully satisfy the request — contradictory ruleset citations where both texts are returned with the conflict explained, or a canonical lookup that resolves to a section the ruleset marks as incomplete or placeholder.

**REQ-001a2 — Warning and Partial semantics (Part a2).**
Neither `[WARNING]` nor `[PARTIAL]` uses `isError: true`. *Acceptance criterion:* A corrupted Novel on disk produces `[WARNING]` in `spec_health` with the Novel slug enumerated; a search returning contradictory ruleset texts produces `[PARTIAL]` with both texts cited. _Check:_ T175.
**REQ-277 — Fixture evolution contract.** When a specification change causes a
golden transcript assertion (Appendix B.3, N.3, W.3, X.3) to fail, the maintainer
SHALL version-bump the fixture, record the citing REQ that caused the break in the
fixture's changelog comment, and update the transcript and RNG witness values to
match the new expected behavior. A fixture transcript that fails replay under a
conformant server is a spec defect — the fixture SHALL be updated, not treated as
a regression. The fixture version SHALL increment on any transcript or
witness-value change.
_Check:_ T297.

**REQ-002 — Error taxonomy.** _(F1)_ Every error carries one of eight categories
defined in Appendix O.2. `[NOT_FOUND]` and `[INVALID_INPUT]` SHALL enumerate
badge-filtered valid values. A "Did you mean?" hint SHALL precede the enumeration
when a close match exists. `Corrective action: <action>` SHALL follow every error.
*Acceptance criterion:* A `[NOT_FOUND]` error on an unknown spell name returns the
category, a "Did you mean?" hint when a close match exists, and a session-visible
list of valid spell names.
_Check:_ T18, T177.

**REQ-002a1 — Extended error category semantics (Part a1).**
when the input is well-formed and within the tool's domain but violates a ruleset constraint — a non-stacking bonus applied when already present, a character creation choice that conflicts with prerequisites, or an action prohibited by the ruleset's own restrictions. The response cites the ruleset anchor that forbids the action. `[UNIMPLEMENTED]` is raised when the tool recognizes the input as valid but the feature is not yet modeled — a subsystem the ruleset defines but the builder could not extract, recorded as a DECISIONS.md waiver.

**REQ-002a2 — Extended error category semantics (Part a2).**
The response names the unimplemented subsystem and cites the waiver entry. *Acceptance criterion:* Applying a condition already active on the target returns `[ERROR] [RULE_VIOLATION]` citing the ruleset anchor; calling a tool for a waived subsystem returns `[ERROR] [UNIMPLEMENTED]` with the waiver reference. _Check:_ T176.
**REQ-002b1 — Corrective-action contract (Part b1).**
single imperative sentence describing what the caller must do to resolve the error — switching badges. For `[FORBIDDEN]`, providing a valid value from the enumeration for `[NOT_FOUND]`, or waiting for a state change for `[STATE_CONFLICT]`. It is not a prompt, not a suggestion, and not a multi-sentence explanation. For `[UNIMPLEMENTED]`, the corrective action names the waiver entry in DECISIONS.md (5).

**REQ-002b2 — Corrective-action contract (Part b2).**
For `[SYSTEM]` errors (JSON-RPC `-32000`), the corrective action is absent — these are unrecoverable at the tool layer. *Acceptance criterion:* Every tool-level error response contains exactly one `Corrective action:` line matching its category; protocol-level errors carry no corrective action. The `[SYSTEM]` category is catalogued in Appendix O.2. _Check:_ T178.
**REQ-002c1 — Badge-filtered error values (Part c1).**
`[NOT_FOUND]` and `[INVALID_INPUT]` errors exclude values the caller's current badge cannot access — a Player badge sees only player-accessible spell names in a `[NOT_FOUND]` on `lookup_spell`; a Game Master badge sees the full catalogue. "Did you mean?" hints follow the same badge filter. A value that exists in the ruleset but is invisible to the caller's badge is treated as absent for enumeration purposes — it is neither enumerated nor hinted.

**REQ-002c2 — Badge-filtered error values (Part c2).**
This prevents side-channel disclosure of GM-only content through error message verbosity. *Acceptance criterion:* A Player-badge `[NOT_FOUND]` on `lookup_spell` with a GM-only spell name lists only player-visible spell names and provides no "Did you mean?" hint for the GM-only name. _Check:_ T179.
**REQ-003a — Roll transparency (Part a).**
path: dice notation, individual die results, modifiers, total, and outcome. Every modifier's source and contribution is reported. Every modifier contribution SHALL identify the source by its ruleset name (e.g., "Strength", "Proficiency", "Bless spell"). When multiple sources contribute to the total, each SHALL be listed as a separate signed contribution — the modifier total SHALL NOT be collapsed into a single undifferentiated number. Sources with a zero contribution (e.g., a non-proficient skill) MAY be omitted.

**REQ-003b — Roll transparency (Part b).**
When a resolution mechanic involves rolling multiple dice of the same type where only a subset is selected (advantage, disadvantage, keep-N-highest, drop-lowest, or luck rerolls), all rolled faces SHALL be reported with an indication of which were selected. The selected/used face or faces SHALL be clearly distinguished from discarded faces.

**REQ-003c — Roll transparency (Part c).**
When the ruleset defines named result bands (e.g., critical success, partial success, failure), the roll outcome reports which band applies to the total. *Acceptance criterion:* A d20 attack roll with advantage reports both d20 faces — e.g., `Dice: 2d20 = [12, 7], used: 12` — not just the higher value. A Strength-based attack roll with +2 proficiency reports `Modifiers: Strength +3, Proficiency +2` — not `Modifiers: +5`. _Check:_ G2, T47.
**REQ-004 — Truncation.** Tool output longer than a configurable limit
is truncated with `… [truncated — full content: output://<tool>/<counter>]`. `output://`
payloads are session-local, badge-filtered, and evict the oldest when exceeding the session
limit. Stat blocks shown within truncated output follow the same limit rules. Stat blocks are
presented in the ruleset's baseline format, with all fields regardless of truncation
(see REQ-004a). Prompt output truncation (REQ-118, REQ-135) is a separate mechanism — REQ-004
governs tool-level output only.
*Acceptance criterion:* A tool output exceeding 32,000 bytes is truncated with an
`output://` pointer; retrieving the pointer returns the full content, badge-filtered.
_Check:_ T13.

**REQ-004a — Stat block baseline view.** Stat blocks are presented in the ruleset's
baseline format, with all fields regardless of truncation. When the entire output
including a stat block exceeds the truncation limit, the stat block may be replaced
with an output:// pointer (REQ-004) — but the stat block SHALL NOT be partially
rendered.
*Acceptance criterion:* A character-sheet rendering includes every stat field the
ruleset defines, in the ruleset's baseline format and order, regardless of whether
the output exceeds the truncation limit.
_Check:_ T13.

**REQ-179a — Output pointer resource template (Part a).**
`output://{tool_name}/{counter}` resource template in `resources/templates/list`. The template URI pattern SHALL be `output://{tool_name}/{counter}` where `{tool_name}` matches the producing tool's registered name and `{counter}` is a per-session monotonically increasing integer. `resources/read` on a resolved URI SHALL return the full untruncated tool output as Markdown, badge-filtered per REQ-032. The resource SHALL declare MIME type `text/markdown` and a title of the form "<tool_name> output #<counter>". Output payloads SHALL be session-local — they do not survive server restart.

**REQ-179b — Output pointer resource template (Part b).**
When the session's output storage exceeds a configurable limit, the oldest payload SHALL be evicted and its URI SHALL return `[ERROR] [NOT_FOUND]` with a message indicating eviction. *Acceptance criterion:* After a tool produces output exceeding 32,000 bytes, `resources/templates/list` includes `output://{tool_name}/{counter}`; reading the resolved URI returns the full untruncated content, badge-filtered; pushing storage beyond the limit evicts the oldest payload and its URI returns `[ERROR] [NOT_FOUND]`. _Check:_ T221.
**REQ-118a — Prompt length budget (Part a).**
stays within a per-prompt token budget. When a prompt's constructed content exceeds its budget, sections are truncated in priority order (low-priority first) with `[truncated]` markers and pointers to the corresponding resource URIs where full content is retrievable. The truncation mechanism preserves the prompt's structural integrity — section headers remain, and required contract elements (intro pointer per REQ-063, `player_signal` directives per REQ-078) are never truncated.

**REQ-118b — Prompt length budget (Part b).**
The per-prompt budget is configurable; exceeding it without truncation is a defect. *Acceptance criterion:* When a prompt's content exceeds its token budget, low-priority sections are replaced with `[truncated]` markers and resource URI pointers; section headers and required contract elements are never truncated. _Check:_ T123.
**REQ-113 — Result count reporting.** A tool that returns a collection of results
reports both the count of items returned and the total count of matching items.
When the total exceeds the returned count, the difference is explicit — the
caller is not required to infer how many results were suppressed. The segment
size is configurable.
*Acceptance criterion:* A lookup returning 3 of 42 matching items reports both
counts — "3 of 42 results" — so the caller knows 39 results are suppressed.
_Check:_ T116.

**REQ-060a — Verbose output (Part a).**
ruleset defines for the item or action is returned. The roll transparency contract (REQ-003) governs the format of dice-roll results. Combat lifecycle output (advance_combat) SHALL follow the conflict lifecycle contract (REQ-043). Character creation and advancement results include all derived statistics alongside inputs (see REQ-181 for minimum surface). *Acceptance criterion:* A weapon lookup returns every field the ruleset defines for that weapon — damage dice, damage type, properties, weight, cost, range — not a summary.

**REQ-060b — Verbose output (Part b).**
A spell lookup returns level, school, casting time, range, components, duration, description, and at-higher-level effects — not a pointer or summary. A monster lookup returns its full stat block — AC, HP, speed, ability scores, saves, skills, senses, traits, actions — not a pointer. A class lookup returns hit dice, HP formula, proficiencies, features by level, and archetype paths. _Check:_ T47.
**REQ-061 — Source quoting.** Lookup results, search results, and rule-derived tool
responses include a `---`-separated source block with `<file>#<anchor>` label and verbatim
Markdown excerpt preserving original formatting. Pure-state tools (undo, state queries,
condition queries, audit reads) are exempt.
*Acceptance criterion:* A spell lookup result ends with a `---`-separated block
containing `<file>#<anchor>` and the verbatim Markdown text from the source; an
undo result contains no source block.
_Check:_ T48.

**REQ-280a — Source-anchor citation (Part a).**
`lookup_equipment`, `lookup_monster`, `lookup_class`, and `search_rules` — SHALL include the source anchor from which the content was extracted in every result. The anchor SHALL include: (a) the source file name; (b) the heading path (e.g., "Spells > Level 3 > Fireball"); and (c) the line range in the source Markdown (e.g., "lines 1420–1445"). The anchor is surfaced as a `source_anchor` field in the tool output, positioned after the mechanical data and before any narrative framing. The anchor enables the caller to verify the output against the ruleset source without re-running extraction.

**REQ-280b — Source-anchor citation (Part b).**
For `search_rules`, every result item SHALL carry its own `source_anchor`. For canonical lookups returning a single entry, the anchor SHALL be the heading from which the entry was extracted. The anchor is derived from extraction metadata per REQ-010 (traceability) and SHALL be present even when the extraction confidence is LOW — the anchor labels the source, not the confidence. *Acceptance criterion:* `lookup_spell("fireball")` returns a `source_anchor` field with file name, heading path, and line range. Every result in `search_rules("grapple")` carries its own `source_anchor`.

**REQ-280c — Source-anchor citation (Part c).**
A ruleset-free build returns `source_anchor: null` for all lookups (waived per REQ-013). _Check:_ T329.
**REQ-062 — Badge foundations.** `badge_briefing` includes ruleset-agnostic best-practice
foundations for each badge. The Synthesis workflow (§11.1) supplies the expanded foundations
catalogue at `guidance://<badge>/foundations` as supplementary guidance.
*Acceptance criterion:* `badge_briefing` for the Player badge includes ruleset-agnostic
foundations guidance; the Game Master briefing includes both player and GM foundations.
_Check:_ T26.

**REQ-070a — Anti-slop guidance (Part a).**
examples of forbidden narrative patterns with corrected alternatives, tagged `[anti-slop]` and served at `guidance://<badge>/anti-slop`. The spec carries a synopsis in Appendix J; the full anti-slop catalogue is sourced from the Synthesis workflow (§11.1) as supplementary guidance, with genre-specific examples from the `adventure_advice` module.

**REQ-070b — Anti-slop guidance (Part b).**
Anti-slop guidance is badge-filtered and appears in `badge_briefing` after foundations and before scene state. *Acceptance criterion:* (a) Without synthesis, `badge_briefing` includes at least one `[anti-slop]`-tagged item per badge sourced from the Appendix J synopsis, each carrying a forbidden narrative pattern and a corrected alternative; (b) the content is badge-filtered (rows 1–10 are GM-scoped, rows 5–7 and 12 are Player-scoped, rows 8–11 are GM-scoped); (c) anti-slop guidance appears after foundations and before scene state; (d) `guidance://<badge>/anti-slop` renders the same patterns as a retrievable resource. _Check:_ T223.
**REQ-184a — Anti-slop resource rendering (Part a).**
`guidance://<badge>/anti-slop` as a Markdown resource. The resource SHALL include every Appendix J synopsis pattern whose scope matches the requested badge. Each pattern SHALL appear as a `[anti-slop]`-tagged item with its Forbidden and Correct text. When synthesis is active (REQ-159), the resource SHALL include both the Appendix J synopsis and synthesis-supplied anti-slop items; synthesis items SHALL be tagged `[supplementary]` with source URL and confidence.

**REQ-184b — Anti-slop resource rendering (Part b).**
Without synthesis, the resource SHALL contain only the Appendix J synopsis. *Acceptance criterion:* `guidance://<badge>/anti-slop` returns Markdown containing every Appendix J pattern for the requested badge, each tagged `[anti-slop]` and badge-filtered; synthesis-sourced items carry `[supplementary]` with source URL. _Check:_ T223.
**REQ-194a — Anchor derivation (Part a).**
deterministically: lowercase the text, strip punctuation, replace whitespace and hyphen-equivalent runs with single hyphens, and collapse consecutive hyphens. Explicit IDs (`{#id}`) take precedence over derived anchors. Role-scoping markers (`*Keeper only*`, `*Player only*`, or the ruleset's discovered badge terms) SHALL be stripped from the heading text before derivation. Duplicate derived anchors within a source file SHALL append `-1`, `-2`, etc. Duplicate explicit IDs across files SHALL be treated as an authoring defect. Re-indexing the same source SHALL reproduce identical anchors.

**REQ-194b — Anchor derivation (Part b).**
Punctuation stripped SHALL be the character class `[\p{P}\p{S}]` (Unicode punctuation and symbol categories); CJK and other non-ASCII word characters SHALL be preserved. *Acceptance criterion:* The same heading text processed twice through anchor derivation produces the same anchor. A heading with an explicit ID (`{#foo}`) uses `foo` regardless of its text. Two headings with identical derived text in the same file produce anchors suffixed `-1` and `-2`. _Check:_ T16, T236.
**REQ-071a — Narrative tone samples (Part a).**
`[narrative-tone]`-tagged guidance items per badge — example-of-play prose extracted from the ruleset that demonstrates the ruleset's narrative tone, served at `guidance://<badge>/tone`. Each carries source anchor and confidence. Discovery (§6.3) extracts these snippets as a guidance subcategory. When the ruleset provides none, the Synthesis workflow (§11.1) may source community examples.

**REQ-071b — Narrative tone samples (Part b).**
Entity-level voice_examples (REQ-077) are distinct — those are dialogue snippets attached to specific characters. *Acceptance criterion:* `badge_briefing` includes at least one `[narrative-tone]`-tagged item per badge — a prose excerpt from the ruleset demonstrating its narrative voice, with source anchor and confidence. _Check:_ T26.
**REQ-064a — Badge behavioral boundaries (Part a).**
all tool output. The AI's behavioral boundaries are role-dependent. When the AI's narrative role is Game Master, it describes situations and surfaces information; it never takes action or makes decisions on behalf of the player. When the AI's narrative role is Player, it describes character intent; it never prescribes world facts or narrative outcomes without Game Master confirmation. These boundaries are delivered in the `badge_briefing` orientation content, determined by the AI's role per REQ-304. When the AI has no narrative role (Editor-badge), tool output follows the active badge's boundary conventions.

**REQ-064b — Badge behavioral boundaries (Part b).**
When a player's natural-language input carries both in-character and meta-intent simultaneously — e.g., "I examine the altar" (character action) + "what does my character see?" (meta-query) — the `suggest_actions` tool SHALL return both tool categories: the in-character resolution (roll_skill_check, examine) and the meta-inquiry (search_rules for altar lore).

**REQ-064c — Badge behavioral boundaries (Part c).**
The AI (when in the Game Master role), informed by `badge_briefing`, SHALL resolve the in-character component through narration and redirect the meta-intent component through tool calls — it SHALL NOT silently treat a meta-query as an in-character action resolved without the player's knowledge. The `player_signal` tool SHALL accept a `register` signal with values `character` (speaking or acting in-character) and `meta` (asking a rules question or directing the GM out-of-character).

**REQ-064d — Badge behavioral boundaries (Part d).**
Setting `register=meta` SHALL suppress in-character narration in tool output — responses from `suggest_actions`, rule lookups, and similar tools present bare mechanical information without narrative framing. The register state persists for the session (discarded on connection close) and is visible in `badge_briefing` as a Player-Register line. Setting `register=character` restores narrative-framed output. The default register is `character`. When a badge is active, `badge_briefing` SHALL include a badge boundary directive — a single sentence: "You are in the story.

**REQ-064e — Badge behavioral boundaries (Part e).**
Confine tool use and responses to the current Novel. To step away from the table, call `set_badge(\"none\")`." The directive is identical for both badges. It SHALL appear after the badge foundations (REQ-062) and before the anti-slop guidance (REQ-070). It is never truncated (REQ-135, tier 1). *Acceptance criterion:* A player typing "Can my character jump the chasm?" under `register=character` receives `suggest_actions` output with the acrobatics check tool AND a rules-lookup pointer; under `register=meta` the same input produces only mechanical information with no "you attempt to jump" narrative framing.

**REQ-064f — Badge behavioral boundaries (Part f).**
The register state appears in `badge_briefing` and does not persist across server restarts. The boundary directive appears in `badge_briefing` for both Player and GM badges. _Check:_ T51, T461. *Out of scope:* transport-layer error handling, client-side error formatting, error localization or internationalization, and error recovery strategies beyond the corrective-action model defined in REQ-002.
**REQ-001b1 — Error boundary (Part b1).**
a category from REQ-002) use `isError: true` and are normal `result` objects — the calling model receives the error text and can react. Protocol-level errors are for failures at the transport or request-routing layer — unknown methods, unparseable requests, or transport disconnection — and use standard JSON-RPC error codes per Appendix D. SDK-level schema validation failures (bad parameter types, missing required fields) surface as `-32602` before the tool handler runs and carry no REQ-002 taxonomy.

**REQ-001b2 — Error boundary (Part b2).**
A conformant server never emits a protocol-level error with a REQ-002 category string embedded. *Acceptance criterion:* A tool called with a structurally invalid parameter returns an SDK-level `-32602` response before the handler — this response does not contain `[ERROR] [INVALID_INPUT]` or a REQ-002 category. A tool called with a semantically invalid parameter returns a result with `isError: true` and `[ERROR] [INVALID_INPUT]`. _Check:_ T180.

### 5.2 Extraction and Confidence

During Discovery (§6.3), mechanical coupling metadata — which mechanics produce
world-affecting, entity-bearing, revealing, or temporally-urgent outcomes — is
populated alongside standard extraction per REQ-377. Coupling extraction annotates
existing extraction categories; it is not a separate category. Confidence labels
apply to coupling metadata the same as any extracted item.

**REQ-010 — Traceability.** Every modeled mechanic cites the ruleset anchor(s) from which it
was extracted. The citation chain — Markdown source → modeled item → tool/resource →
verification — is traceable end-to-end.
*Acceptance criterion:* `RULESET_MODEL.md` contains at least one anchor citation
per modeled mechanic; `spec_health` reports no uncited extractions.
_Check:_ T15.

**REQ-011a — Confidence (Part a).**
directly from ruleset text), MEDIUM (interpretable but not explicit, or missing a discoverable trigger), or LOW (contradictory, image-conveyed, broken-link, or structurally defective). Book-level headings, source-converted sections, and callout types tagged non-normative cap at MEDIUM. Structured content — formal tables, definition lists (bold-labeled terms with values), and ordered procedural sequences (at least three consecutive imperative-verb sentences describing a mechanic's resolution steps) — where the extraction was stable and not restructured, is HIGH above the book-level cap.

**REQ-011b — Confidence (Part b).**
The builder identifies structured-procedural sequences using the same mechanical-indicator heuristics as the viability pre-check (§6.2): bold-labeled fields, imperative verbs, and definition-list markup. Sections flagged as "conveying mechanics" from images, diagrams, or flowcharts are LOW. Confidence is computed per-section and aggregated per REQ-147, with the player-filtered view as the gating metric. The player filter excludes: guidance items with GM-only badge scope (REQ-016), mechanics extracted from GM-only ruleset sections (REQ-032), and synthesis content tagged `[gm-only]` (REQ-080).

**REQ-011c — Confidence (Part c).**
The builder computes player-filtered confidence by applying these exclusions before aggregation per REQ-147. *Acceptance criterion:* A spell extracted from a table cell at a ruleset-normative heading carries HIGH confidence; an image-conveyed mechanic carries LOW. _Check:_ T15.
**REQ-147a — Confidence aggregation (Part a).**
percentage of extracted items in that section carrying HIGH or MEDIUM labels, excluding items marked as guidance (REQ-016) from the per-section count. The overall player-filtered confidence — the Phase 1 gate metric — is the mean of per-section confidence scores, weighted by each section's extracted item count. LOW items count against the section total but do not contribute positively. A section with zero extracted mechanical items is excluded from the mean. The formula is: Σ(section_items × section_score) / Σ(section_items) where section_score = (HIGH + MEDIUM items) / total extracted items in section.

**REQ-147b — Confidence aggregation (Part b).**
The overall score is expressed as a percentage in `spec_health`. *Acceptance criterion:* A ruleset with three sections — Section A: 8 HIGH, 2 MEDIUM, 0 LOW; Section B: 3 HIGH, 3 MEDIUM, 4 LOW; Section C (guidance-only, 5 extracted guidance items) — produces per-section scores of Section A = 100%, Section B = 60%. Section C's guidance items are excluded from the mean per REQ-016. Overall = ((10 × 1.0) + (10 × 0.6)) / 20 = 80%. _Check:_ T181.
**REQ-153 — AGENTS.md troubleshooting.** Every build's AGENTS.md includes a
`## Troubleshooting` section documenting at minimum four failure classes —
config mismatch, corrupted state file, badge confusion, and missing
environment variables — each with diagnostic steps recoverable by an
operator without access to the builder. The section must reference
verification commands that exercise the diagnosed failure mode where a
corresponding automated test exists.
*Acceptance criterion:* An operator encountering a `[STATE_CONFLICT]` from
a corrupted state file finds the Troubleshooting section listing the
corruption symptom, the recovery step (restore from `.bak`), and the
verification command to confirm recovery.
_Check:_ T186.

**REQ-154a — README.md handoff content (Part a).**
Every build's README.md includes: (a)
prerequisite environment and setup instructions that an operator can follow
from a cold checkout; (b) a copy-paste `mcpServers` configuration entry
with key names matching the build-time client target's documented schema
(§6.2 B3); (c) the RNG continuity contract — whether deterministic replay
is guaranteed by seed or session-dependent; (d) the badge model with
tool-access implications.

**REQ-154b — README.md handoff content (Part b).**
Every build's README.md also includes: (e) the state model describing what survives
restart and what is connection-scoped; and (f) a license footer rendering
the Appendix U content license table — one line per source listing source
name, license identifier, and copyright holder, flowing into a single
semicolon-separated paragraph prefixed with "Built from:" and terminated
by the RSS link and last-updated date.
*Acceptance criterion:* An operator copies the `mcpServers` block from
README.md into their client config, launches the server, and the
initialize handshake succeeds with `serverInfo.name` matching the config
key.
_Check:_ T187.

**REQ-270 — Artifact version identification.** Each of the four handoff artifacts
(RULESET_MODEL.md, DECISIONS.md, README.md, AGENTS.md) SHALL carry its build-time
specification version in a standardized position — the first HTML comment line of
each file: `<!-- built against Holonovel spec vX.Y.Z -->`. The version SHALL match
the value reported by `spec_health.spec_version`. An artifact missing this
identifier or carrying a version that does not match `spec_health` is a handoff
defect recorded in DECISIONS.md (6).
_Check:_ T290.

**REQ-271 — AGENTS.md structure contract.** Every build's AGENTS.md SHALL include
a Code Map (REQ-to-source-file mapping listing every REQ and its primary
implementation file), a Verification section (commands for gates G0–G5 with
expected exit codes and pass criteria), a Troubleshooting section (common
operator-reported failure modes per REQ-153), and Build Context (spec version,
ISO 8601 build date, builder model identifier, ruleset content hash per REQ-044,
and holonovel version). Missing sections or sections without content are handoff
defects.
_Check:_ T291.

**REQ-099 — Confidence-floor acknowledgment.** When the overall confidence threshold drops
below 80% — whether via the convergence loop's adjusted-threshold provision or acceptance of
residual gaps — the builder records the drop in DECISIONS.md (5) with the adjusted threshold,
the justification, and a field requiring explicit operator approval. The build does not proceed
past the convergence loop without this approval. The operator may accept, reject, or request a
specific remediation target.
*Acceptance criterion:* When confidence drops below 80%, DECISIONS.md (5) records
the adjusted threshold, justification, and explicit operator approval before
construction continues.
_Check:_ T86.

**REQ-207a — Core-mechanic identification (Part a).**
resolution mechanic — the primary dice/outcome procedure — by applying these criteria in order, stopping at the first that yields a single candidate: (a) the mechanic the ruleset's own introduction or "how to play" section designates as the central resolution procedure; (b) the mechanic cited by the most other sections in cross-references; (c) the mechanic with the most distinct dice-roll invocations across the ruleset's examples of play. The criterion used SHALL be recorded in DECISIONS.md (5) alongside the identified mechanic.

**REQ-207b — Core-mechanic identification (Part b).**
If (a)–(c) produce a tie, the builder SHALL record all tied candidates and flag an `[ambiguous-core-mechanic]` finding. The core mechanic SHALL maintain at least 85% confidence independently of the overall threshold. WHEN the build operates in ruleset-free mode THE core-mechanic identification SHALL be skipped. The builder SHALL record "ruleset-free — no core mechanic" in the core-mechanic field of DECISIONS.md (5).

**REQ-207c — Core-mechanic identification (Part c).**
No `[ambiguous-core-mechanic]` or `[core-mechanic-block]` finding is produced — the absence is intentional and not a defect. *Acceptance criterion:* A build against a ruleset whose introduction names "d20 + stat vs target number" as the core mechanic correctly identifies it via criterion (a). DECISIONS.md (5) records the criterion used and the mechanic's confidence meets ≥85%. _Check:_ T251.
**REQ-012 — Graceful fallback.** A section that cannot be modeled as a tool or state remains
searchable via `search_rules` and retrievable as a `ruleset://` resource.
The builder never fabricates mechanics to fill a gap. Missing triggers do not invalidate the modeled portion.
Search returns the expected section in the top 3 results for exact, prefix, and substring queries.
*Acceptance criterion:* An unmodelable section returns `[OK]` with the `ruleset://`
URI from `search_rules` for an exact title query in the top 3 results.
_Check:_ G2, T4.

**REQ-315a — Full-text ruleset indexing (Part a).**
ruleset Markdown SHALL be indexed by `search_rules` at runtime. The index SHALL cover the entire ruleset — every `##` and `###` heading with its associated body text, regardless of whether the section content was extracted into a tool, resource, or model. Partial coverage where some ruleset sections are invisible to `search_rules` is a construction defect. The builder SHALL verify at build time that the ruleset's table of contents maps to the search index and SHALL record any unmapped sections in DECISIONS.md (4) with justification.

**REQ-315b — Full-text ruleset indexing (Part b).**
Sections omitted by the `Convert` workflow's artifact-disposition waivers are exempt. *Acceptance criterion:* `search_rules("ability scores")` returns results from the ruleset's character creation chapter. Every heading in the ruleset's own table of contents resolves to at least one search result for a heading-text query. _Check:_ T360.
**REQ-111a — Search result quality (Part a).**
surrounding text from which each match was drawn — sufficient for the caller to distinguish the match's relevance to the query. Results are ordered by relevance to the query terms. A search that returns more results than a configurable display limit includes a count of suppressed results. `search_rules` confidence reflects query-term match strength, not the extraction confidence of the matched section. HIGH match confidence requires a non-stop query token in the section title or first heading; MEDIUM requires a match in section body text; LOW indicates peripheral or single-word matches.

**REQ-111b — Search result quality (Part b).**
This is distinct from extraction confidence (REQ-011). *Acceptance criterion:* Each result carries a confidence label (`[HIGH]`, `[MEDIUM]`, or `[LOW]`) on the same line as the heading; a multi-match search returns context snippets for each result, ordered by relevance, with a suppressed-result count when the display limit is exceeded. _Check:_ T114.
**REQ-212a — Generation table rolling (Part a).**
table name drawn from the build's indexed generation tables (§6.3 extraction category 4). It SHALL roll the dice notation embedded in the selected table's definition — including nested table references — and return the result row with dice breakdown per REQ-003. A deterministic seed parameter SHALL produce identical results across calls and sessions (per REQ-050). Tables tagged as GM-only during extraction SHALL return `[FORBIDDEN]` when called under the Player badge.

**REQ-212b — Generation table rolling (Part b).**
When the ruleset contains zero generation tables, `roll_on_table` SHALL return a clear "no tables indexed" message — the tool is not unregistered, per the content-absent tool contract (REQ-020, infrastructure tools clause). The tool is classified as generation (REQ-015). *Acceptance criterion:* `roll_on_table("gear")` with seed `42` returns the table row for the gear table exactly; the same call without a seed returns a different row; `roll_on_table("gm-only-table")` under Player badge returns `[FORBIDDEN]`; a ruleset with zero tables returns "No generation tables indexed." _Check:_ T46, T210.
**REQ-013 — No assumed mechanics.** Nothing enters the model that is not traceable to the
ruleset text. A mechanic present in one edition or supplement but absent from the source is
not assumed. Absent features — no advancement, no deletion, no spellcasting — produce no
tool; this absence is recorded in DECISIONS.md as a waiver with a re-activation condition.
Inline formatting inside table cells is preserved, not interpreted. Code blocks are literal
text, not executed. Callouts produce no mechanics. Conditions apply and expire per the ruleset's own triggers.
*Acceptance criterion:* A species table missing advancement rules produces no
`advance_character` tool; the absence is recorded as a waiver in DECISIONS.md (5).
_Check:_ T25, T32, T33, T36.

**REQ-014 — Source immutability.** The ruleset Markdown — and, where conversion applied, the
original sources — is hashed at intake (SHA-256) and never modified. The intake hash is
the golden record: it is stored in DECISIONS.md (1) at build time and recorded in the
build fingerprint (REQ-065) as the definitive source identity. Any later comparison that
detects a change in the ruleset is drift detection, defined by REQ-065 — this requirement
concerns the freeze only.
*Acceptance criterion:* A sha256 hash of the original Markdown sources matches the intake
hash stored in DECISIONS.md; the source files on disk are byte-identical to the files
hashed at intake.
_Check:_ T21.

**REQ-015 — Action classification.** Every modeled action is classified into one of
five types: read-only (no state access), state-reading (inspects but does not
mutate), command (state mutation), generation (content creation from tables or
prompts), or hybrid (both command and generation). The classification determines
tool annotations per §7.4.
*Acceptance criterion:* Every tool in `tools/list` carries annotations matching its
classification — `idempotentHint` for read-only and state-reading, `destructiveHint`
for command, both for generation and hybrid.
_Check:_ T15.

### Classification rules

The builder SHALL classify every registered tool according to the following
table. Every tool in `tools/list` falls into exactly one classification row.
When a tool's behavior spans two rows, the builder SHALL apply the higher-impact
classification (command overrides state-reading, hybrid overrides generation).

| Classification   | Tool examples                              | `idempotentHint` | `destructiveHint` | `readOnlyHint` | `openWorldHint` |
|------------------|--------------------------------------------|-------------------|--------------------|----------------|-----------------|
| read-only        | `help`, `spec_health`                     | `true`            | `false`            | `true`         | `false`         |
| state-reading    | `character_sheet`, `session_recap`        | `true`            | `false`            | `false`        | `false`         |
| command          | `create_character`, `set_scene_state`     | `false`           | `true`             | `false`        | `false`         |
| generation       | `generate_adventure`, `roll_on_table`, `ask_oracle`     | `false`           | `false`            | `false`        | `false`         |
| hybrid           | `generate_encounter`, `roll_weapon_damage`| `false`           | `true`             | `false`        | `false`         |

The `openWorldHint` is `false` for all tools when the server operates without
network access (the default per REQ-051). A server configured with network
access SHALL set `openWorldHint: true` on tools whose output depends on
external content.

**REQ-214a — Table classification (Part a).**
carry a `type` field of `generation` or `lookup`. A generation table contains at least one dice-range-to-result row and is registered under `roll_on_table`. A lookup table contains only deterministic reference data and is registered as a `lookup_<category>` tool or served via `ruleset://` resources. A table containing any dice-range row is a generation table — generation and lookup rows SHALL NOT coexist in the same registered tool entry.

**REQ-214b — Table classification (Part b).**
When the ruleset contains zero generation tables, `roll_on_table` SHALL be registered with an empty domain and return `[NOT_FOUND]` with a clear "no random generation tables in this ruleset" message on any call. The tool description SHALL reflect this — it SHALL NOT advertise canonical table names that resolve to nothing.

**REQ-214c — Table classification (Part c).**
When the ruleset contains at least one generation table, `roll_on_table` SHALL enumerate valid table names in its input schema dynamically from the ruleset model. *Acceptance criterion:* Building for D&D 5e produces a `roll_on_table` whose `table` parameter enumerates only generation tables (trinkets, madness tables, wand of wonder, etc.) — not lookup tables (ability_modifiers, difficulty_classes). Building for a ruleset with zero generation tables registers `roll_on_table` with an empty domain and a "no tables" response. _Check:_ T255.
**REQ-016 — Guidance extraction.** Role-addressed prose (imperatives, statements of
responsibility, advice, tone/setting text, examples of play) is extracted verbatim as
guidance items, each with attribution, confidence, and badge scope. Guidance is quoted
inert data — it never influences tool behavior, search results, or model extraction.
*Acceptance criterion:* Guidance items extracted from role-addressed prose carry
source anchor, confidence, attribution method, and badge scope; `guidance://player`
excludes GM-tagged items.
_Check:_ T26.

**REQ-017 — Badge stories.** A MUST-covering set of intent prompts maps each badge's
expected play activities to concrete tool/resource paths. Every badge's stories are
achievable from its visible registry.
*Acceptance criterion:* Every tool visible to the Player badge is covered by at
least one intent prompt in the Player badge stories set; every tool visible to GM
is covered by at least one GM story.
_Check:_ T28.

**REQ-018 — Extraction evidence.** Every extraction decision in RULESET_MODEL.md is
accompanied by the verbatim source text on which it was based.
*Acceptance criterion:* RULESET_MODEL.md includes a verbatim source quote for
every extraction decision; a reviewer can trace any modeled mechanic to its
original text without opening the ruleset.
_Check:_ T15; Discovery
checkpoint.

**REQ-146a — Reconciliation authority (Part a).**
multiple sections (e.g., a procedure and a summary table disagree), every source SHALL be recorded.

**REQ-146b — Reconciliation authority (Part b).**
Authority SHALL be determined by applying these criteria in order, stopping at the first that yields a single candidate: (a) the section the ruleset's own index or table of contents designates as the primary reference; (b) the section whose heading text is the most specific match to the mechanic name; (c) the section within the ruleset's core-mechanics chapter (the chapter at the shallowest heading depth containing the highest proportion of mechanical sections); (d) the section with the most explicit procedural text — measured as the highest count of imperative verbs (roll, add, subtract, compare, apply) within the section's mechanics paragraphs.

**REQ-146c — Reconciliation authority (Part c).**
If (a)–(d) produce a tie, all tied sections SHALL be recorded as co-canonical (MEDIUM confidence) and the ambiguity flagged as an `[authority-tie]` defect. The builder SHALL record which criterion resolved each reconciliation in the defect log. The most authoritative section SHALL be treated as canonical; other sources SHALL be LOW confidence. *Acceptance criterion:* A mechanic restated in three sections — one in the core-mechanics chapter, one in a summary table, and one in a supplement — assigns canonical status via criterion (c). With a ruleset whose index points to the summary table, criterion (a) overrides.

**REQ-146d — Reconciliation authority (Part d).**
An `[authority-tie]` defect is produced when (a)–(d) all produce a tie. _Check:_ T174.
**REQ-209 — Cross-format consistency.** Before server construction begins, the builder
SHALL sample 10 items at random from the extraction model, spanning at least three of the
seven extraction categories (§6.3), and verify that RULESET_MODEL.md and ruleset_model.json
agree on: name, source anchor, confidence label, and action classification for each sampled
item. A mismatch is a discovery defect, recorded in the defect log with both values, and
SHALL be resolved before construction begins.
*Acceptance criterion:* After extraction, RULESET_MODEL.md and ruleset_model.json agree on
all four fields for 100% of sampled items. A single mismatch blocks construction until
resolved.
_Check:_ T252.

**REQ-210a — Extraction categories (Part a).**
categories in dependency order within each chunk: Concepts (named ruleset terms: stats, moves, conditions, statuses), Entities (character types, monsters, NPCs with fields and lifecycle), Tables (lookup tables and generation tables with dice notation), Actions (resolution mechanics, commands, generation — classified per REQ-015), Resolution (the core mechanic: dice notation, stat associations, result bands), Roles (Player and Game Master terms from the ruleset), and Guidance (badge-addressed prose, verbatim with attribution and badge scope).

**REQ-210b — Extraction categories (Part b).**
A cross-category reference that cannot be resolved against the inventory of earlier extractions within the same chunk SHALL be recorded as a MEDIUM-confidence finding in the defect log with a deferred-reference annotation. *Acceptance criterion:* A ruleset chunk whose Actions reference a Concept term defined within the same chunk resolves that reference against the Concept inventory. A reference to a Concept term not yet extracted produces a deferred-reference annotation which resolves after cross-chunk resolution. _Check:_ T173.
**REQ-215a — Table content extraction (Part a).**
content from the ruleset and register it as `roll_on_table` entries. For each generation table, the builder SHALL produce: a canonical `key` (snake_case slug derived from the source heading), a `dice_expression`, a `ranges` array (min/max/result tuples), a `badge_scope` (derived from source location — tables in GM-only chapters are `game_master`, otherwise `shared`), and a `source_anchor` (heading and file path). Table content extraction follows the same confidence labeling and traceability rules as other extraction categories (REQ-011, REQ-010).

**REQ-215b — Table content extraction (Part b).**
The builder SHALL detect dice-range tables from Markdown table cells containing `d100`, `d%`, `d8`, `d20`, or explicit numeric ranges (`01-10`, `11-25`). A row whose first column is a numeric range is a generation result row. A row whose first column is a name or label (not a numeric range) is a lookup row.

**REQ-215c — Table content extraction (Part c).**
Each generation table entry SHALL be stored in the ruleset model under `generation_tables` with its full content, and the server SHALL serve it via `roll_on_table` at runtime. *Acceptance criterion:* The D&D 5e build extracts at minimum the Short-Term Madness, Long-Term Madness, Indefinite Madness, Reincarnate Race, Wand of Wonder, and Trinkets tables. Each table entry includes dice_expression, ranges with result text, and a source_anchor. `spec_health` reports the count of extracted generation tables. _Check:_ T256.
**REQ-272 — Stock elements catalog.** The builder SHALL record ruleset-derived
reusable templates in DECISIONS.md (4) as a structured catalog — a `stock_elements`
table enumerating character archetypes, monster stat-block libraries, location
templates, lore patterns, and generation tables extracted during Discovery (§6.3).
Each entry carries a key, a description, and the source anchor(s) from which it was
derived. Future builds against the same ruleset target with an unchanged ruleset
content hash (REQ-044) SHALL reference this catalog rather than re-extracting;
changed entries are re-extracted per the delta. The catalog is a normalizations
record, not a runtime surface — it lives in DECISIONS.md only.
_Check:_ T292.

**REQ-102a — Source conversion contract (Part a).**
source materials are converted to Markdown per Appendix G. The builder SHALL select a converter satisfying the capability profile in Appendix G.1 and record the selection in DECISIONS.md (2). Conversion fidelity SHALL be verified per Appendix G.2; progressive sampling is the RECOMMENDED verification method: trial page (Phase 1) at ≥70% fidelity gates the batch, content-type expansion (Phase 2) gates at ≥90% per type, and batch conversion (Phase 3) completes the source.

**REQ-102b — Source conversion contract (Part b).**
PDF sources SHALL additionally follow the format-specific protocol (Appendix G.3): column detection, multi-page table reassembly, image-content classification, and OCR fallback. HTML sources SHALL additionally follow the format-specific protocol (Appendix G.4): dynamic content detection, chrome stripping, chrome fingerprinting, pagination, and content-type classification. The builder SHALL run cross-converter verification (Appendix G.6) on the fidelity sample pages. Fidelity results SHALL be reported in the structured format (Appendix G.5). The converter and its version are pinned in DECISIONS.md (2).

**REQ-102c — Source conversion contract (Part c).**
Flagged artifacts receive a disposition in DECISIONS.md (5): `fixed`, `waived`, or `pending`. Conversion fidelity rates appear in `spec_health` (REQ-025). *Acceptance criterion:* A converted PDF produces a fidelity report in `spec_health`; any content type below 90% fidelity blocks the batch and records a disposition in DECISIONS.md (5). DECISIONS.md (2) records the selected converter and any cross-converter verification results in DECISIONS.md (5). _Check:_ T93.
**REQ-225a — Ruleset Wisdom extraction (Part a).**
SHALL classify extracted guidance into seven Ruleset Wisdom output modules using the ruleset's own text. Classification is feedback-driven — barren modules SHALL trigger re-reading of the most likely source section. When ruleset-native extraction leaves a module barren, the builder SHALL attempt vendor-content population (§11.2). At least 4 of 7 modules SHALL be populated. Items carry `[ruleset]` or `[vendor]` tag with source anchor.

**REQ-225b — Ruleset Wisdom extraction (Part b).**
In ruleset-free mode, all Wisdom modules SHALL be empty. *Acceptance criterion:* A ruleset with GM advice chapters and example-of-play dialogues produces Ruleset Wisdom items in ≥4 of 7 modules with `[ruleset]` tag and source anchors. _Check:_ T301. *Out of scope:* extraction from non-Markdown sources without prior conversion (§6.2 Convert workflow), confidence models beyond the three-tier HIGH/MEDIUM/LOW system, and semantic interpretation of image-only content.
**REQ-354 — Extended narrative extraction.** During Discovery (§6.3), the
builder SHALL extend REQ-225 extraction to include scene pacing, relationship
patterns, countdown/tension clocks, secret/revelation pacing, player signal
conventions, and story journal conventions from ruleset GM advice chapters —
all mapped to `supplementary_guidance`. Items follow REQ-225's confidence
model and tagging. Zero items SHALL NOT mark the module barren. Items SHALL
carry a `component_type` annotation.
*Acceptance criterion:* A ruleset with GM advice chapters produces at least
one `[ruleset]` item in `supplementary_guidance` with a `component_type`
annotation. Without these chapters, output is unchanged from REQ-225 alone.
_Check:_ T405.

**REQ-324 — Constraint override extraction.** During Discovery (§6.3), the
builder SHALL scan for mechanics that explicitly suspend world-model physical
constraints, using the pattern-to-constraint mapping defined in §6.3. Each
discovered override SHALL be classified by constraint type and mechanic source
and registered in RULESET_MODEL.md. Patterns are ruleset-agnostic — zero
overrides is not an error. In ruleset-free mode, the scan SHALL be skipped.
*Acceptance criterion:* A ruleset with Knock, Fly, and Darkvision spells
produces at least three constraint overrides in RULESET_MODEL.md.
_Check:_ T368.

### 5.3 Tools, Resources, and Lookups

**REQ-020a — Tools (Part a).**
terminology — never invented names. Infrastructure tools in four immutable categories — World, Novels, Badges, Narrative (enumerated in Appendix T) — SHALL always be present. Character creation, condition management, combat, table rolling, and session recap are the minimum ruleset-derived categories; missing categories are recorded as waivers.

**REQ-020b — Tools (Part b).**
Tools whose results depend on indexed ruleset content produce empty or context-only results when that content is absent. *Acceptance criterion:* `tools/list` includes at minimum character creation, condition management, combat, table rolling, and session recap tools; a missing category is recorded as a waiver in DECISIONS.md. _Check:_ T3, T5, T32, T33; G2.
**REQ-021 — Tool-surface economy.** A named set of related operations (one per table, one
per move, one per stat) shares a single parameterized tool. The tool surface is determined
by extraction, not by what a builder finds easy to implement. The per-tool justification
list matches the registry.
*Acceptance criterion:* No two tools share identical parameter schemas differing
only by category enum; the per-tool justification list in DECISIONS.md matches the
live `tools/list` registry.
_Check:_ T3, T35.

**REQ-408 — Tool parameter ceiling.**
No advertised tool SHALL expose more parameters than a ceiling recorded at build time in
DECISIONS.md; inputs beyond the ceiling move to a refinement or retrieval call rather than
inflating a single definition. The ceiling applies to infrastructure and ruleset-derived
tools alike, and the per-tool parameter count SHALL be recoverable from `spec_health`.
*Acceptance criterion:* No advertised tool exceeds the recorded ceiling; a tool whose
operation needs more inputs splits into a compact entry call plus a refinement path;
`spec_health` exposes each tool's parameter count. _Check:_ T477.

**REQ-413 — Action-discriminator tool surface.**
When the builder determines that a group of operations shares a domain but not a common
input or output contract, the operations SHALL be exposed as one entry tool carrying an
action discriminator rather than as sibling tools, and each action SHALL be documented as
its own sub-REQ. The discriminator SHALL name actions in the ruleset's own terms, and the
parameters and contract of each action SHALL be recoverable from `spec_health`.
Consolidation SHALL NOT alter any action's output contract.
*Acceptance criterion:* a domain with distinct operations exposes one entry tool whose
discriminator enumerates them; each action is documented as a sub-REQ; `spec_health`
exposes per-action contracts. _Check:_ T486.

**REQ-414 — Schema-surface economy.**
A tool's advertised input schema SHALL prefer the most compact form that carries the same
information and preserves strict server-side validation, substituting example values for
nested structural descriptions wherever the builder determines the compact form is
equivalent. The advertised form SHALL be self-explanatory to a caller without external
documentation and SHALL NOT weaken the input-validation contract of REQ-054. `spec_health`
SHALL report the count of advertised inputs using nested structural form, and an input that
could have been advertised compactly but is not SHALL be recorded in DECISIONS.md.
*Acceptance criterion:* inputs expressible compactly are advertised so with examples;
validation is unchanged; `spec_health` reports the nested-form count. _Check:_ T487.

**REQ-415 — Summary-first tool catalog.**
Enumeration of the tool catalog SHALL return summary entries by default and expose full
schema and description on a detail request, so a caller pays for full tool definitions
only on demand. The summary view SHALL be derived from the live registry at call time and
SHALL NOT be a separately maintained list, preserving the count derivation of REQ-025c. A
detail request SHALL require no intervening state mutation, and `spec_health` SHALL report
the active catalog verbosity.
*Acceptance criterion:* `tools/list` returns summaries by default; a detail request returns
full definitions; counts still match the live registry; `spec_health` reports the
verbosity. _Check:_ T488.

**REQ-022a — Resources (Part a).**
The server provides resources covering ruleset content
(with badge filtering), entities at collection and individual URIs, the audit
log, the roster, badge-specific guidance (foundations, anti-slop, tone,
badge-switch), scene state, countdowns, the party roster, NPCs at
collection and individual URIs, entity personality and voice examples, lore
entries, synthesis modules, adventure content, novel state, rooms and
things, the world map and kind registry, the knowledge graph, the build
specification, and per-tool output pointers.

**REQ-022b — Resources (Part b).**
`resources/templates/list`
advertises entity, roster-record, and output-pointer templates.
`resources/read` returns Markdown with a source header.
*Acceptance criterion:* `resources/list` includes all required URIs;
`resources/templates/list` includes entity, roster, and `output://` templates;
each resource declares a media type and title.
_Check:_ T16, T104.

**REQ-296a — Knowledge-graph resource (Part a).**
returning the Novel's entity-relationship graph as a structured adjacency list. The resource SHALL include: (a) `entities` — all Novel entities with their current relationships; (b) `npcs` — all NPCs with relationships, dispositions, and location; (c) `lore_connections`; (d) `secrets` — secret lore entries mapped to the entities that have had them revealed; (e) `factions` — faction memberships. The resource is badge-filtered: Player badge sees only relationships involving their active entities, `shared`-scope lore, and revealed secrets.

**REQ-296b — Knowledge-graph resource (Part b).**
When no Novel is active, `resources/read` returns `[STATE_CONFLICT]`. `graph://novel` has no briefing presence per §5.10. *Acceptance criterion:* After creating 2 NPCs with a relationship, setting a faction with 1 member NPC, and revealing a secret to entity "hero", `graph://novel` under the GM badge includes entities, NPCs with relationships, lore_connections, secrets, and factions. _Check:_ T341.
**REQ-023a — Prompts (Part a).**
badge briefing, connection introduction (REQ-063), session zero (REQ-078), and Novel setup (REQ-089). Tool-use intent mapping is handled by the `suggest_actions` tool (REQ-084) rather than a prompt — a dedicated prompt for this function is redundant. The remaining intent-mapping prompt (`run_workflow`) derives its tool associations from the registered tool catalog and the ruleset extraction model's action classifications (REQ-015) — not from hardcoded keyword strings that assume a specific ruleset's terminology.

**REQ-023b — Prompts (Part b).**
Prompts are dynamic: adding a tool, resource, or guidance item updates their output without restart. `prompts/get` returns exactly one user-role message. `prompts/list` carries a title on every prompt and a description on every argument. *Acceptance criterion:* Removing a stub tool and restarting removes it from all five prompts; adding a tool updates prompt output without restart; `prompts/list` carries a title on every prompt and a description on every argument. _Check:_ T22, T28, T155.
**REQ-024a — Tool documentation (Part a).**
term for that action. Annotations match action classification. *Acceptance criterion:* Every tool's `title` field uses the ruleset's own term for that action; a `lookup_weapon` tool under D&D 5e is titled "Weapons" not "lookup_weapon." _Check:_ T3, T35, T39. The `description` field SHALL follow a three-clause structure: a one-line summary of the tool's action (verb + object), a "Use when:" clause naming concrete scenarios that select this tool, and a "Do NOT use when:" clause naming sibling tools the caller should prefer for similar-sounding requests.

**REQ-024b — Tool documentation (Part b).**
Descriptions longer than three sentences are truncated in `tools/list`; the full text remains available at `resources/read`. *Acceptance criterion:* Every tool's description contains all three clauses; overlapping tools (e.g., `roll_weapon_attack` and `roll_weapon_damage`) name each other in their disambiguation clauses; a verifier can map a natural-language player intent to the correct tool using only the tool descriptions. _Check:_ T3, T49.
**REQ-025a — spec_health (Part a).**
derived from live registrations at call time — not from hardcoded numeric literals.

**REQ-025b1 — spec_health (Part b1).**
Reported categories include: confidence scores per-file and overall; conversion fidelity when conversion was selected (per-content-type rates, overall rate, sample set, unresolved ambiguities, confidence cap counts); convergence summary (per-metric iterations, findings, residual gaps, and per-extraction-category confidence breakdown); indexed counts (anchors, concepts, entity types, actions, tables, procedures, guidance items, synthesis items per module); pending sections; MUST-action coverage; defect count; ruleset-version status; verification workflow dispositions; available Novels on disk.

**REQ-025b2 — spec_health (Part b2).**
Also reported: prompt health (each registered prompt's presence, length relative to budget, and stale references); a gap audit section comparing current spec version against build-time version with tool-catalog, resource-map, prompt-list, and badge-gating comparisons; cross-reference health (total, resolved, unresolved, and unresolved percentage across discovered ruleset cross-references, with regression detection on rebuild); Pattern Buffer scenarios (passed, total, last run timestamp); and search index coverage (total headings, indexed headings, coverage percentage, with unmapped sections where coverage is below threshold).

**REQ-025c — spec_health (Part c).**
The Player badge sees only player-filtered metrics. Build-phase-dependent sections (convergence summary, gap audit) are absent when the build is not yet complete. *Acceptance criterion:* `spec_health` counts match the live registry — adding a tool, resource, or prompt increments the count immediately; counts are derived from arrays at call time, not hardcoded. _Check:_ T15, T45, T93, T105, T154.

**REQ-411 — Stable-metadata caching.**
Rendered content that does not change between calls — tool schemas, prompt scaffolding, and
taxonomy vocabularies — SHALL be cached and served on repeat without recomputation, so a
session pays the render cost once. A cached entry SHALL invalidate when its source
registration changes, preserving the live-registration dynamism of REQ-023b and REQ-025; the
cache SHALL never alter tool output or badge filtering. `spec_health` SHALL report cache
coverage.
*Acceptance criterion:* A repeated read of stable metadata returns the cached entry without
recomputation; mutating a registration invalidates the cache and the next read reflects it;
outputs are identical cached or not; `spec_health` reports coverage. _Check:_ T480.
**REQ-160a — Synthesis health reporting (Part a).**
synthesis status with these minimum fields: (a) `synthesis_active` — boolean indicating whether synthesis state exists; (b) `module_counts` — per-module item count for each of the seven output modules (§11.1); (c) `stale_count` — number of inactive synthesis items whose `collected_at` exceeds `TTRPG_SYNTHESIS_STALE_DAYS`; (d) `activated_count` — number of synthesis items the Game Master has incorporated into active Novel state via Novel-scoped tools (REQ-159); (e) `fingerprint` — the synthesis fingerprint used for idempotence detection (ruleset content hash + intake answers).

**REQ-160b — Synthesis health reporting (Part b).**
Stale items SHALL appear with the `[stale]` flag when listed. When synthesis has never been run, `synthesis_active` is false and all count fields are zero. When synthesis is absent (never run or reverted), `module_counts` SHALL include all seven module names — `voice_examples`, `briefing_order`, `lore_templates`, `action_patterns` and `supplementary_guidance`, `adventure_advice`, `narrative_voices` — each with value zero. An absent `module_counts` field or an empty object does not satisfy this contract.

**REQ-160c — Synthesis health reporting (Part c).**
The synthesis health section is visible to all badges — Player and GM alike see whether synthesis is active and how many items are stale, but per-module content is badge-filtered per REQ-080. *Acceptance criterion:* After synthesis, `spec_health` reports `synthesis_active: true`, per-module counts matching the manifest, and a non-empty fingerprint. After `revert_synthesis`, `synthesis_active` is false and all counts are zero. Stale items increment `stale_count` and carry `[stale]` flag. After GM activates a lore template via `set_lore_entry`, `activated_count` increments by one. _Check:_ T195.
**REQ-169a — Audit chain integrity reporting (Part a).**
`audit_chain` field containing: `valid` (true when the hash chain is unbroken from first entry to last, false when any entry's hash does not match the computed chain), `entries` (total count of audit entries), and `first_broken_index` (the zero-based index of the first entry whose hash verification fails; absent when `valid` is true). Chain verification is performed at `spec_health` call time by recomputing every entry's hash from the preceding entry's hash. A Novel with zero audit entries reports `valid: true, entries: 0`.

**REQ-169b — Audit chain integrity reporting (Part b).**
When no Novel is active, the field is absent. *Acceptance criterion:* A Novel with 5 valid entries reports `audit_chain: { valid: true, entries: 5 }` with `first_broken_index` absent; tampering with entry 2's hash produces `valid: false, first_broken_index: 2`; the field is absent when no Novel is active. _Check:_ T204.
**REQ-138a — Prompt health reporting (Part a).**
registered prompt: its name, presence (present/absent), character length, the configured budget from REQ-118, a budget-compliance flag (within/exceeded), and a stale-references list — tool or resource names appearing in the prompt's rendered text that do not match any name in the live tool registry or resource map. A stale reference is one whose name (matching by exact string or the MCP SDK's registration name) appears in the prompt text but is absent from the live registrations at call time. The absence of any stale references SHALL be reported as an empty list.

**REQ-138b — Prompt health reporting (Part b).**
Prompt health SHALL be present in `spec_health` regardless of build mode. *Acceptance criterion:* `spec_health` reports prompt health for every registered prompt; renaming a tool referenced in a prompt produces a stale reference entry on the next `spec_health` call; restoring the tool name clears the entry. _Check:_ T152.
**REQ-139 — Resource URI completeness reporting.** `spec_health` SHALL report
resource URI presence: for every URI template defined in the REQ-022 resource
catalog, `spec_health` SHALL list the URI, its presence (present/absent), its
registration name if present, and its MIME type. URIs with dynamic segments
(`<id>`, `<key>`, `<slug>`, `<anchor>`, `<type>`) SHALL be listed by their
template form. Counts SHALL be derived from the live resource map at call time.
The report SHALL be absent when the build is not yet complete.
*Acceptance criterion:* `spec_health.resource_uris` lists every REQ-022 URI
with presence; registering a new resource adds an entry immediately; removing a
resource changes its presence to `absent`.
_Check:_ T153.

**REQ-269 — Safety protocol status.** The server SHALL report, through `spec_health`,
a `safety_protocols` object enumerating each safety property (state loss, badge
boundary, data corruption, unrecoverable crash) and its status. Each property carries
a `status` of `online`, `degraded` (one or more non-blocking Pattern Buffer failures
in relevant sub-workflows), or `offline` (blocking failure unresolved). Properties
with no exercising Pattern Buffer sub-workflow SHALL report `unverified`.
Per-safety-property status is recorded in DECISIONS.md (6) alongside the Pattern
Buffer fingerprint.
_Check:_ T289.

**REQ-388a — Holodeck config discovery (Part a).**
`holodeck_config` field reporting behavioral configuration coverage.

**REQ-388b — Holodeck config discovery (Part b).**
The field SHALL contain: `behavioral_coupled` (count of behavioral `TTRPG_*` variables whose configuration has a coupling row in §7.7.1a with a Session-archetype source), `behavioral_total` (total count of behavioral `TTRPG_*` variables classified as affecting pacing, autonomy, reactivity, synthesis, narration, or tone), `natural_language_paths` (an object mapping each behavioral variable name to its natural language access path — the `player_signal` signal type or `set_narrative_directive` keywords that control it), and `uncoupled` (an array of behavioral variable names lacking a natural language access path).

**REQ-388c — Holodeck config discovery (Part c).**
System variables (storage caps, file paths, build parameters, seed values) SHALL be excluded from the behavioral count. The classification of each `TTRPG_*` variable as behavioral or system SHALL be recorded in DECISIONS.md at build time.

**REQ-388d — Holodeck config discovery (Part d).**
When no Novel is active, `holodeck_config` SHALL report server-level defaults without Novel overrides. *Acceptance criterion:* After a build with `TTRPG_PACING_WINDOW=6` and `TTRPG_NPC_AUTONOMY=off`, `spec_health.holodeck_config` reports `behavioral_coupled: <N>`, `behavioral_total: <M>`, `natural_language_paths` listing each coupled variable's natural language path, and `uncoupled` listing any behavioral variables without a coupling row. _Check:_ T450.
**REQ-105 — Spec resource.** The server provides a `spec://build` resource,
retrievable via `resources/read` and listed in `resources/list`. It returns the
full text of the specification that built the server as Markdown, embedded in the
server directory at build time. The resource is GM-filtered: the Game Master badge
sees the full text; Player badge attempts return `[FORBIDDEN]` (per REQ-002). The
embedded copy is a snapshot — it may differ from the current upstream revision.
*Acceptance criterion:* `resources/read` on `spec://build` returns the full
embedded Markdown; Player badge returns `[FORBIDDEN]`; the snapshot content hash
matches DECISIONS.md.
_Check:_ T104.

**REQ-106 — Spec repository URL.** The server records a canonical URL for the
upstream specification repository, recorded in DECISIONS.md at intake. `spec_health`
surfaces it under a `spec_repo_url` field. The `intro` prompt includes the URL as a
pointer for operators who want the latest version. The URL is informational — the
embedded spec copy (REQ-105) is authoritative for the server's build-time contract.
*Acceptance criterion:* `spec_health` output includes `spec_repo_url` matching
the intake value; the `intro` prompt includes the URL; the URL is informational
and identical for both badges.
_Check:_ T105.

**REQ-107a — Version coordination (Part a).**
version in the build fingerprint, surfaced through `spec_health` under a `spec_version` field. The version is a CalVer date-stamp (YYYY.MM.DD) matching the CHANGELOG entry date at which the specification was last substantively changed. The builder records the spec version in DECISIONS.md §2 Pinned Versions at intake and sets the server's `package.json` version to the same value. The two SHALL agree; a mismatch is a build-time defect that blocks handoff.

**REQ-107b — Version coordination (Part b).**
During a spec-driven update (REQ-098), the builder compares the current spec version against the server's recorded version: when the spec version has advanced, the gap audit proceeds; when unchanged, the builder reports the server is current and exits without mutation. The version string is informational — it does not gate runtime behavior beyond reporting. *Acceptance criterion:* `spec_health.spec_version` is a CalVer date-stamp matching DECISIONS.md §2 Pinned Versions; the server's `package.json` version matches both; a gap audit against the same version exits "current" without mutation. _Check:_ T106.
**REQ-187a — Spec content hash computation (Part a).**
specification content hash at build time from the embedded spec file (`holonovel.md` in the server directory, per §6.4) and record it in the server's build fingerprint. The stored hash SHALL be read from the build fingerprint at runtime — never from a hardcoded literal. A mismatch between the stored hash and the embedded file's current hash at startup SHALL surface as a warning on stderr and in `spec_health`.

**REQ-187b — Spec content hash computation (Part b).**
The hash algorithm SHALL be SHA-256. *Acceptance criterion:* Computing the SHA-256 hash of the embedded spec file produces the value recorded in `state.buildFingerprint.specHash`; modifying the embedded file and restarting produces a drift warning; `spec_health` reports the stored hash alongside a `spec_hash_current` boolean. _Check:_ T226.
**REQ-278 — Build-phase-map staleness detection.** The build-phase-map
(`spec/build-phase-map.md`) SHALL carry a SHA-256 hash of the concatenated,
normalized content of the spec files it references, computed at assembly time
(`npm run assemble`). The builder SHALL compute the hash of the loaded spec
files and compare against the map's recorded hash. A mismatch SHALL be recorded
as a process-compliance finding in DECISIONS.md (6) — the builder proceeds with
the map but records the stale-hash warning with the list of files whose content
differs. The `npm run validate` check SHALL verify the map's hash matches the
current spec file set.
_Check:_ T298.

**REQ-161a — Intake workflow contract (Part a).**
present the operator with Q0 (workflow selection) and, when two or more workflows are selected, Q1 (pause toggle). After Q0 and Q1, the builder SHALL present all questions relevant to the selected workflows in one batch. Answers SHALL be recorded in DECISIONS.md (1) before any workflow execution begins. A build that begins without recorded answers for all selected-workflow questions fails the process-compliance convergence metric (§6.5). When an operator selects workflows at different times, the builder SHALL re-ask only the new workflow's questions.

**REQ-161b — Intake workflow contract (Part b).**
After recording answers, the builder SHALL confirm back: selected workflows, all answers, and the first workflow to execute. Non-interactive runs SHALL use the defaults enumerated in §6.2. The default for Q0 SHALL be determined by network probing: when the probe succeeds, the default is `build + synthesize`; when the probe fails, the default is `build` only; the builder SHALL record the probe result in DECISIONS.md (1). *Acceptance criterion:* A build started without DECISIONS.md (1) intake answers fails the process-compliance metric. A non-interactive run with network detected defaults to `build + synthesize`.

**REQ-161c — Intake workflow contract (Part c).**
A run re-selecting an additional workflow re-asks only that workflow's questions. _Check:_ T196.
**REQ-162a — Build-mode profiles (Part a).**
at intake via B9. `production` mode (default) SHALL run the full quality suite: assumption audit (REQ-101), per-step audits with auditor pre-flight (§6.5), post-write verification on every file written during construction (§6.5.3), cross-model auditing when available (§6.5.2), and the full Pattern Buffer (§6.6). `quick-build` mode SHALL narrow the overhead: it skips the assumption audit, skips auditor pre-flight, scopes post-write verification to critical files only (DECISIONS.md, MCP client configuration, on-disk Novel state), and accepts same-model audits.

**REQ-162b — Build-mode profiles (Part b).**
The Pattern Buffer SHALL gate both modes — any build that creates or modifies tools MUST pass the Pattern Buffer before marking complete. A quick-build-mode build SHALL record a `quick-build` annotation in DECISIONS.md (6) listing which rituals were skipped. A quick-build-mode build is runnable but not handoff-ready. *Acceptance criterion:* A production build records assumption audit (T89), auditor pre-flight, and cross-model audit results. A quick-build build records a `quick-build` annotation listing skipped rituals and passes the Pattern Buffer.

**REQ-162c — Build-mode profiles (Part c).**
A quick-build build without the annotation fails the process-compliance metric. _Check:_ T197.
**REQ-163a — Client config verification (Part a).**
entry, the builder SHALL fetch the target client's documentation for its MCP server config schema (from the B3 answer) and verify every key name in the written entry matches the target's documented conventions. Known schema variants (including `workdir` vs `cwd`, `env` vs `environment`, `args` array placement vs appended to `command`) SHALL be checked. An incorrect key is a client-config defect (F6) and SHALL block the build until remedied.

**REQ-163b — Client config verification (Part b).**
When B7 is `yes`, the builder SHALL write the server entry into the client's config file and immediately verify the server launches via the client's documented invocation: the initialize handshake SHALL succeed with `serverInfo.name` matching the `mcpServers` key. A `server unavailable` error SHALL stop the line. *Acceptance criterion:* A config entry with `workdir` targeting a client expecting `cwd` produces an F6 defect and blocks the build. After correction, the initialize handshake succeeds with matching `serverInfo.name`. _Check:_ H11.
**REQ-164a — Viability pre-check (Part a).**
discovery begins, the builder SHALL count mechanical sections — headings containing procedures, tables, bold-labeled fields, or definition lists — as a proportion of total `##`-level sections. If mechanical sections are below 30% of total sections, the builder SHALL warn the operator: "This ruleset is below the mechanical-density threshold (X% mechanical). Discovery may not produce a playable server." The operator MAY proceed, select a different source, or abort. The builder SHALL record the pre-check count and operator decision in DECISIONS.md (4).

**REQ-164b — Viability pre-check (Part b).**
Guidance-only sections SHALL be excluded from the mechanical count but SHALL be included in the total-section denominator. *Acceptance criterion:* A ruleset with 15 mechanical sections out of 60 total sections (25%) triggers the warning. The builder records the count (15/60 = 25%) and the operator's decision in DECISIONS.md (4). A ruleset with 25/60 (42%) proceeds without warning. _Check:_ T199.
**REQ-067a — Help and tool discovery (Part a).**
required utility tools alongside `search_rules`, `respond`, `undo`, and `spec_health`. `help` accepts an optional `query` parameter. With no query, it returns: (1) a pointer to the `intro` prompt, (2) a categorized task map — tools grouped by task domain (characters, dice and resolution, combat, lookups, state, adventure) with one-line descriptions, and (3) a pointer to `badge_briefing` for badge-specific guidance. With a query, it searches tool descriptions, prompt summaries, and guidance text for the most relevant matches and returns their names, descriptions, and example invocations from the tool-use playbook.

**REQ-067b — Help and tool discovery (Part b).**
Output is badge-filtered. When a Novel is active, tool listings and query results SHALL be ruleset-filtered — showing only tools whose `ruleset` annotation matches the active Novel's ruleset scope or is `null`. The Game Master may customize the task-map category assignments via a Novel-scoped mapping. A tool reassigned to a user-defined category is removed from its builder-assigned category. The mapping persists with the Novel. Player badge results always reflect builder-assigned categories. The builder-assigned categories SHALL follow the default set by `TTRPG_WORLD_PROMINENCE` (REQ-309).

**REQ-067c — Help and tool discovery (Part c).**
An empty mapping restores builder defaults. *Acceptance criterion:* `help()` returns an intro pointer, task-map with one-line descriptions, and a `badge_briefing` pointer; `help("combat")` returns the most relevant combat tools with example invocations. _Check:_ T62, T118.
**REQ-063a — Connection introduction (Part a).**
in `prompts/list`. It takes no arguments, is visible to all badges, and serves as a conversation starter — a brief overview of the ruleset, its core mechanic, and concrete next actions a player can take. The tone is engaging and energetic; the anti-slop catalogue (REQ-070, Appendix J) governs GM and Player narration in the story, not server onboarding prompts. The `help` tool and `badge_briefing` each point to it. For intent-to-tool mapping, callers are directed to `suggest_actions` (REQ-084) — no `use_tool` or `lookup_rule` prompt is provided.

**REQ-063b — Connection introduction (Part b).**
When `TTRPG_NOVEL` is unset at startup and one or more Novels exist on disk, the `intro` prompt SHALL present them as a browsable library: each Novel's name, description preview (first sentence or first 120 characters), session count, last-played date, and synthesis status (Tier 1 activated item count, Tier 2 item count). The prompt ends with: "You have N Novels.

**REQ-063c — Connection introduction (Part c).**
Which would you like to resume, or create a new one?" When no Novels exist, the prompt directs the user to `create_novel` with a plain-English description of what a Novel is. *Acceptance criterion:* `intro` prompt is ≤300 words, opens with the publisher tagline (or a generic server-name identification when the server is ruleset-free), includes a dynamic sourcebook listing from the live index (or a message indicating the server is world-model-only when the server is ruleset-free), and ends with four concrete next actions. _Check:_ T49, T50, T259.
**REQ-078a — Session zero prompt (Part a).**
arguments, is visible to all badges (unfiltered), and serves as a structured guide surfaced at the start of a new story. The builder SHALL generate the prompt text at build time, drawing on the ruleset model for ruleset terminology, character-creation rules, example-of-play excerpts, and native personality constructs, and drawing on Synthesis `adventure_advice` content when available for genre conventions, narrative-voice profiles, and anti-slop examples.

**REQ-078b — Session zero prompt (Part b).**
The builder MAY generate narrative prose — tuning option descriptions, example character introductions, plaintext capability examples — using its own language capabilities when the ruleset model provides sufficient context. Missing ruleset content SHALL produce the corresponding section with a plain-English fallback description — this is not a defect. The prompt SHALL be verbose throughout — every section SHALL describe narrative possibilities in plain English without tool names or technical syntax, per Standing Rule 10.

**REQ-078c1 — Session zero prompt (Part c1).**
Sections 1–2 of the eight-section prompt: (1) a welcome explaining session zero's purpose as creative alignment and a safety check — this is where the GM and player agree on the shape of the story before anyone rolls, and the preferences recorded here feed into the GM's narration for the entire story; (2) per-signal explanations — for each of tone, difficulty, pace, focus, and boundary, a plain-English description of what the signal controls narratively and three to five named tuning options each with a paragraph describing what that choice means for the story (scene style, narrative voice, consequences model, encounter design), plus a plain-English example instruction the player could write.

**REQ-078c2 — Session zero prompt (Part c2).**
Sections 3–4: (3) character introductions — three example character descriptions at increasing detail (a minimal one-to-two-sentence archetype, a three-paragraph description covering physical appearance and mannerisms then personality and voice then backstory and motivation, and a media reference that names a known character as shorthand then elaborates what to emphasise or change about that archetype), each a usable model for the player's description; (4) character creation — every mechanical choice category the ruleset provides (species/ancestry, class/archetype, background, stat generation, equipment) described in plain English with what each option means for the character's capabilities narratively, noting that roster characters are already available for import.

**REQ-078c3 — Session zero prompt (Part c3).**
Sections 5–6: (5) adventure confirmation — presenting loaded adventure premise, factions with their starting tensions, pre-populated NPCs with personality summaries, and the opening scene with a plain-English confirmation that the GM can accept or describe what to change, or guiding from-scratch definition when no adventure is loaded; (6) narrative capabilities — plain-English descriptions of what the GM can do during the story organized by context (combat, exploration, dialogue, world-building), with plaintext examples written as natural-language instructions the GM would give.

**REQ-078c4 — Session zero prompt (Part c4).**
Sections 7–8: (7) a quick-start guide summarising what is ready and describing how the first scene begins — the GM sets the opening scene, the player describes what their character does; (8) post-session encouragement to refine characters between stories — personality, voice, dialogue examples referencing favorite media, and mechanical advancement when the ruleset provides it.

**REQ-078d — Session zero prompt (Part d).**
The prompt SHALL use the ruleset's own terminology for mechanical concepts. `session_zero` is listed in `prompts/list` after `intro`. The `intro` prompt includes a concrete action to run `session_zero` before play. *Acceptance criterion:* `session_zero` prompt contains all eight sections in order; per-signal explanations include three to five named tuning options with narrative paragraphs; character introductions include three example descriptions at increasing detail; narrative capabilities section uses plain English and plaintext examples with no tool names. _Check:_ T22, T124.
**REQ-057a — Canonical lookup tools (Part a).**
content (equipment, spells, monsters/stat-blocks, conditions, feats, class features, species, backgrounds), a `lookup_<category>` tool accepts the canonical name and documented aliases and returns the full ruleset entry. Unknown names return `[ERROR] [NOT_FOUND]` with valid values enumerated; no fabricated entry is returned.

**REQ-057b — Canonical lookup tools (Part b).**
For additional ruleset-unique canonical content — talent trees, abilities, features, or other named resources — `lookup_<feature>` tools follow the same pattern. *Acceptance criterion:* `lookup_spell("fireball")` returns every field the ruleset defines; `lookup_spell("nonexistent")` returns `[NOT_FOUND]` with session-visible valid spell names and a "Did you mean?" hint when applicable. _Check:_ T39, T40.
**REQ-112 — Cross-reference discovery.** When the ruleset text for a canonical entry
names another ruleset section by its heading or anchor, the lookup result includes a
pointer to that section — the section anchor and a one-line description of the
relationship. The pointer is a reference, not a recursive expansion. When the ruleset
text contains no cross-references, no pointers appear.
*Acceptance criterion:* When the ruleset entry for "Fireball" references "Saving
Throws" by heading, the lookup result includes a pointer to that section with
anchor and relationship context.
_Check:_ T115.

**REQ-058 — Tool-result fidelity.** The builder must not patch around missing, thin, or
incomplete extraction: no fabricated entries, no result padding, no hiding of thin content.
Canonical lookups use the loaded index or model, never the original Markdown files after
startup indexing. No option is ever pre-selected in a `[NEED_INPUT]` workflow — decisions
require an explicit `respond`. Tool error messages must be readable in a chat interface.
*Acceptance criterion:* A `[NOT_FOUND]` lookup returns no fabricated data; a
`[NEED_INPUT]` decision has no pre-selected option; no tool reads ruleset Markdown
files after startup indexing.
_Check:_ T41, T42.

**REQ-110 — Tool surface consolidation.** When two or more tools in the registry share
an identical input shape and output contract — differing only in the ruleset category
they operate on — they are exposed as a single parameterized tool. The builder determines
which categories share a retrieval pattern from the ruleset extraction model. This
requirement does not override ruleset-derived naming conventions (§7.4) — the shared
tool's name and parameters derive from the ruleset's own terminology.
*Acceptance criterion:* Two lookup tools differing only in category parameter are
consolidated into one parameterized tool whose parameter description documents
valid categories.
_Check:_ T113.

**REQ-059a — Parameter canon validation (Part a).**
(parameters whose legal values are a finite set derived from the ruleset's own catalogue — skill names, spell names, equipment names, condition names, and analogous ruleset-defined categories) SHALL validate against the ruleset index at call time. An unknown value returns `[ERROR] [NOT_FOUND]` with session-visible valid values enumerated (per REQ-002). A valid value returns `[OK]`. For dice-resolution tools, the `[OK]` response includes transparent dice results (per REQ-003).

**REQ-059b — Parameter canon validation (Part b).**
When a bounded-domain value set includes entries extracted at LOW confidence (per REQ-011), the catalogue remains available for validation — a caller who passes a LOW-confidence value receives `[OK]` — but `spec_health` SHALL report a `[LOW_CONFIDENCE_CATALOGUE]` finding naming the parameter and the affected entries.

**REQ-059c — Parameter canon validation (Part c).**
The builder SHALL record the finding in DECISIONS.md (5). *Acceptance criterion:* Passing an unknown skill name to a bounded-domain skill-check tool returns `[ERROR] [NOT_FOUND]` with valid skill names enumerated; passing a known skill name returns `[OK]` with results from the ruleset's resolution model. _Check:_ T39, T39a.
**REQ-182a — Bounded-domain parameter documentation (Part a).**
DECISIONS.md (5) every tool parameter whose legal values are a bounded domain: for each such parameter, record the tool name, the parameter name, the ruleset source section from which the valid-value set is derived, and the extraction confidence of that source (per REQ-011). A parameter whose valid-value set is split across multiple ruleset sections SHALL list every contributing section.

**REQ-182b — Bounded-domain parameter documentation (Part b).**
This mapping enables independent verification of parameter canon validation (REQ-059) without parsing the builder's internal model. *Acceptance criterion:* DECISIONS.md (5) lists every bounded-domain tool parameter with its source section; a verifier can use this mapping to test REQ-059 compliance for every listed parameter. _Check:_ T39, T39a.
**REQ-183a — Live-index-derived error enumerations (Part a).**
error enumerations for bounded-domain parameters SHALL derive from the ruleset index at call time, not from hardcoded literals. The enumeration is filtered by badge (per REQ-002c). This requirement enforces the §6.5 builder rule: hardcoded arrays are permitted only for ability abbreviations and persona roles.

**REQ-183b — Live-index-derived error enumerations (Part b).**
Tool implementations that enumerate valid values from a static list rather than the live index SHALL be flagged in DECISIONS.md (5) as a convergence violation. *Acceptance criterion:* Adding a new skill entry to the ruleset source, rebuilding, and calling a skill-check tool with the new skill name returns `[OK]`; removing a skill entry and rebuilding produces `[NOT_FOUND]` for the removed skill. Both enumerations reflect the live state — no hardcoded skill list produces stale values. _Check:_ T39b.
**REQ-323a — resolve_intent tool (Part a).**
tool that resolves a natural-language spatial intent against the world model without mutating state. Resolution proceeds in three phases: constraint check, override check, and scene composition. Return values are defined in Appendix O. The tool is callable by the AI narrator and Game Master/ Observer badges. Player badge calls SHALL return `[FORBIDDEN]`. When the world model is unpopulated, `resolve_intent` SHALL return `status: "no_world_model"`. *Acceptance criterion:* `resolve_intent("go north")` against a populated map with a north exit returns `resolved` with destination room context.

**REQ-323b — resolve_intent tool (Part b).**
Against a wall returns `blocked` with the constraint named. Player badge returns `[FORBIDDEN]`. _Check:_ T367. *Out of scope:* real-time collaboration tools, streaming resource endpoints, tools that modify the ruleset source, and MCP protocol features beyond the standard tool/resource/prompt surface.

### 5.4 Decision workflows

**REQ-056 — Advancement workflow.** If the ruleset defines character advancement (leveling,
class progression, feat acquisition), it is modeled as a server-side workflow — a sequential
queue of `[NEED_INPUT]` decisions drained from the open choices the ruleset defines. The
builder discovers the decisions from the ruleset's own progression tables and rules.
Successful advancement is a snapshot point and an undo target. Validate every mechanical
choice against the ruleset's own progression tables.
*Acceptance criterion:* Leveling a character from 1 to 2 produces a `[NEED_INPUT]`
for each open choice the ruleset defines; undo after advancement restores pre-level
state.
_Check:_ T38; T32 where applicable.

**REQ-042a — Workflow decisions (Part a).**
that raise `[NEED_INPUT]` are completed by `respond(decision, option)`. The `decision` value matches the question text from the preceding `[NEED_INPUT]` after canonicalization: leading/trailing whitespace stripped, internal whitespace collapsed to single spaces. The server SHALL accept a `decision` value that differs from the emitted text only in whitespace — an exact-match requirement is brittle under LLM-mediated tool calls. A `decision` that differs in non-whitespace characters returns `[ERROR] [NOT_FOUND]` with the canonical text.

**REQ-042b — Workflow decisions (Part b).**
Each decision enumerates options — limited to at most 25 entries, derived from the ruleset index, with empty-string and "cancel" always available. An unrecognized decision or option returns `[ERROR] [NOT_FOUND]` with valid values. `respond(cancel)` SHALL restore the pre-workflow snapshot (persisted per REQ-055). Restoration SHALL overwrite all Novel-tier fields with the snapshot values, clear the pending workflow state, and reset the staleness counter. The restored state SHALL be audited with a workflow-cancellation entry recording the decision text and the pre-workflow snapshot timestamp.

**REQ-042c — Workflow decisions (Part c).**
After restoration, all blocked tools (undo, redo, set_badge) are callable. Cancel restoration works after a server restart — the persisted snapshot covers the full pre-workflow Novel state. A workflow begins when a tool returns `[NEED_INPUT]` and ends when `respond` successfully drains the decision. Only one workflow may be pending per Novel at a time — a tool that raises `[NEED_INPUT]` while a workflow is already pending returns `[ERROR] [STATE_CONFLICT]` identifying the pending decision.

**REQ-042d — Workflow decisions (Part d).**
The server must be able to determine whether a workflow is pending, such that tools blocked during pending workflows (undo, redo, set_badge) can query the pending state without ambiguity. Pending workflow state survives server restarts — after restart the `[NEED_INPUT]` remains open and the server returns the same decision prompt on the next query. The Novel's pre- workflow snapshot is persisted alongside the pending decision so that `respond(cancel)` restores the correct pre-workflow state even after a restart.

**REQ-042e — Workflow decisions (Part e).**
Pending workflow state is Novel-tier: it persists with the Novel to disk and survives process restarts alongside all other Novel property groups. After a restart, `respond(cancel)` must restore the correct pre-workflow snapshot, and `respond` with a valid option must drain the same decision that was open before the restart.

**REQ-042f — Workflow decisions (Part f).**
Session-tier fields (connection-scoped transient state) are re-initialized from the Novel's persisted values on resume. The active entity is Novel-scoped (REQ-030) and persists with the Novel. *Acceptance criterion:* `respond("cancel")` restores pre-workflow state; a second `create_character()` during a pending step-by-step workflow returns `[STATE_CONFLICT]`; the pending decision survives server restart. _Check:_ T32, T138, T157; G2; S22.
**REQ-190 — Respond drain result.** WHEN `respond(decision, option)` drains a
pending workflow decision, THE system SHALL return `[OK]` with the decision
text, the selected option, and the resulting state change (if any) in a
single response. A drained workflow SHALL clear the `pending_workflow` field
on the Novel, restoring all blocked tools (undo, redo, set_badge) to callable
state. The drain is atomic — a partial drain where the workflow is cleared
but the state change is not applied is a defect.
*Acceptance criterion:* After `respond("stat-array", "grit-forward")` drains
a character creation step, `undo` is callable (no longer returns
`[STATE_CONFLICT]`), `pending_workflow` is null, and the next
`create_character()` call starts a fresh workflow.
_Check:_ T138.

**REQ-191 — Option display-label pairs.** Every option in a `[NEED_INPUT]`
decision SHALL be presented as a display-label pair: a kebab-cased option
value and a human-readable label. The `option` parameter passed to `respond`
is the kebab-cased value. Labels are ruleset-derived (e.g., class names,
equipment names) and SHALL NOT exceed 60 characters. The display-label
mapping SHALL be stable within a ruleset version — the same option value
always maps to the same label. `cancel` is always last with label "Cancel".
*Acceptance criterion:* A `[NEED_INPUT]` for skill selection renders as
`acrobatics (Acrobatics), arcana (Arcana), ...` and `respond("arcana")`
matches the kebab-cased value.
_Check:_ T32.

**REQ-192 — Batch-respond collision.** WHEN two `respond` calls arrive for
the same pending workflow (e.g., from concurrent connections), the first
call drains the decision and the second SHALL return `[ERROR] [STATE_CONFLICT]`
identifying that the workflow has already been drained. The server SHALL
NOT apply the same decision twice or leave the Novel in an inconsistent state
where the workflow appears both drained and pending.
*Acceptance criterion:* Two concurrent `respond` calls to the same decision —
first succeeds, second returns `[STATE_CONFLICT]` with "no pending workflow".
_Check:_ S22.

**REQ-193a — Pending workflow staleness detection (Part a).**
a staleness counter for open pending workflows, incremented on each new connection to the Novel. When the counter reaches 3 or more connections without drainage, `spec_health` SHALL include a `pending_workflow_warning` object containing the decision text and connection count. The warning signals that a workflow has been abandoned across multiple sessions — an operator can drain or cancel it. Staleness tracking is informational only; it does not auto-cancel or auto-drain.

**REQ-193b — Pending workflow staleness detection (Part b).**
See also REQ-224. *Acceptance criterion:* Start a character creation workflow, restart the server (connection 1), connect twice more (connections 2, 3) — on the third connection, `spec_health` includes `pending_workflow_warning`. _Check:_ spec_health output assertion.
**REQ-104a — Character creation workflow (Part a).**
`create_character` offers step-by-step (called without parameters) and quick-create (called with every creation parameter the ruleset's model marks required). Step-by-step produces sequential `[NEED_INPUT]` decisions covering every mandatory creation step the ruleset defines; quick-create creates the character in a single call. Both modes produce a complete entity with every ruleset-defined derived statistic and no ruleset-defined starting field zeroed out.

**REQ-104b — Character creation workflow (Part b).**
In step-by-step mode, when the ruleset defines ability scores as a mandatory step, the builder SHALL present each ability score for player assignment — the player chooses which rolled or array value maps to which ability. The builder SHALL NOT auto-assign ability scores without a `[NEED_INPUT]` decision presenting the assignment as a choice. In quick-create mode, the builder MAY auto-assign using a documented heuristic recorded in RULESET_MODEL.md. When the ruleset's stat generation uses a rolled method, `create_character` SHALL accept an optional seed parameter per REQ-050.

**REQ-104c — Character creation workflow (Part c).**
The seed applies an isolated draw (REQ-050) — stat generation does not advance the session PRNG position. Creation without an active Novel returns `[STATE_CONFLICT]`. `cancel` restores the pre-workflow snapshot. *Acceptance criterion:* `create_character()` without parameters starts step-by-step mode; `create_character(name="X", species="Y", ...)` creates in one call; both modes require an active Novel or return `[STATE_CONFLICT]`. _Check:_ T32; T47; T103; G2.
**REQ-181a — Character creation output surface (Part a).**
`create_character` SHALL return, in its final `[OK]` or `[NEED_INPUT]` completion response, the character's identity fields and every derived statistic the ruleset defines, each presented under the label the ruleset declares. *Acceptance criterion:* A `create_character` quick-mode call returns the ruleset's derived statistics with their declared labels — not a bare confirmation; a step-by-step creation's final response includes all derived statistics computed so far. _Check:_ T47.

**REQ-181b — Character creation output surface (Part b).**
The output SHALL distinguish inputs (player-provided values) from derived statistics (computed from inputs and ruleset tables). *Acceptance criterion:* A `create_character` quick-mode call returning `[OK]` includes the ruleset's derived statistics alongside the player's inputs — not just a confirmation message. A step-by-step creation's final `[NEED_INPUT]` response includes all derived statistics computed so far. _Check:_ T47.
**REQ-151a — Creation step enumeration (Part a).**
mandatory creation step the ruleset defines in RULESET_MODEL.md under `character_creation.steps`, in the order the ruleset prescribes. In step-by-step mode, each step that requires a player choice SHALL produce one `[NEED_INPUT]` decision — no step produces more than one decision, and no decision covers more than one step.

**REQ-151b — Creation step enumeration (Part b).**
Steps the server resolves without player input (derived statistics, HP calculation, proficiency assignment) SHALL NOT produce `[NEED_INPUT]` decisions but SHALL be reported in the creation result alongside player-chosen values. *Acceptance criterion:* RULESET_MODEL.md enumerates every mandatory step; `create_character()` without params produces exactly one `[NEED_INPUT]` per choice step, never bundling steps. _Check:_ T32.
**REQ-152a — Starting equipment assignment (Part a).**
When the ruleset defines starting equipment per class, background, or similar creation choice, the builder SHALL assign that equipment to the created entity. The entity's state representation SHALL include an `equipment` field listing each assigned item by name, quantity, and ruleset source. If the ruleset presents equipment choices (e.g., "choose weapon A or weapon B"), the builder SHALL present each choice as a `[NEED_INPUT]` decision in step-by-step mode. In quick mode, the builder SHALL select the first listed option and record the selection in the creation result.

**REQ-152b — Starting equipment assignment (Part b).**
When the ruleset defines no starting equipment, the `equipment` field SHALL be absent — the builder SHALL NOT fabricate equipment. *Acceptance criterion:* A character created under D&D 5e SRD carries class and background starting equipment by name. _Check:_ T32, G2. *Out of scope:* branching narrative trees, puzzle-solving workflows, and decision workflows that span multiple Novels or connections.
**REQ-399a — Character-creation package data (Part a).**
When the ruleset defines character creation, the builder SHALL extract the ruleset's character-creation rules — playable character types, classes and advancement paths, ability-generation methods, derived-statistic definitions, and starting equipment — into the ruleset model and the package. The model SHALL record the mandatory creation step enumeration under `character_creation.steps` in the order the ruleset prescribes (REQ-151a). Extraction SHALL be cross-consistent with the model's other categories per REQ-209. *Acceptance criterion:* A ruleset build that defines character creation yields a package whose model carries the ruleset's character-creation rules and whose step enumeration matches the step-by-step decisions the host produces. _Check:_ T468.

**REQ-399b — Character-creation computation (Part b).**
Derived statistics are computed by the host from ruleset-declared formulas evaluated against the character's player-provided inputs and the ruleset's extracted tables; the host SHALL NOT hard-code a ruleset's formula. A formula that fails to evaluate SHALL surface a named creation error rather than a silent default. *Acceptance criterion:* A character created under a ruleset declaring a formula-based statistic returns that statistic computed from the declared formula; a formula referencing an undefined input produces a named error. _Check:_ T468.

**REQ-399c — Character creation without package data (Part c).**
A Novel bound to a ruleset whose package carries no character-creation rules SHALL follow the ruleset-free creation contract (REQ-219): `create_character` produces a profile with no mechanical statistics. Requesting mechanical statistics in that state SHALL return a named error directing the caller to bind a ruleset whose package defines character creation. *Acceptance criterion:* `create_character` on a Novel bound to a character-data-less package yields a profile-only entity; requesting classes yields a named error naming the missing data. _Check:_ T260, T468.

**REQ-140 — End-Novel confirmation dispatch.** WHEN the `respond` handler
receives a decision matching the `end_novel` confirmation, THE system SHALL
execute the Novel disposal sequence per REQ-088 and record the disposal in the
audit log. IF the decision matches no open workflow, THEN `respond` SHALL
return `[NOT_FOUND]` with the open decision's text.
*Acceptance criterion:* `end_novel()` → `respond("End Novel <slug>?", "yes")`
removes the Novel from disk; a subsequent `resume_novel` returns
`[STATE_CONFLICT]`.
_Check:_ T158.

**REQ-224a — Workflow staleness detection (Part a).**
per-workflow staleness counter — an integer incremented each time a new MCP connection is established while the workflow is pending. When the staleness counter reaches a configurable threshold, the pending workflow SHALL auto-cancel with the same behavior as `respond("cancel")`: the pre-workflow snapshot is restored, a `[workflow-stale]` audit entry is recorded with the decision text and connection count, and `undo` becomes callable. The audited entry SHALL be tagged `[workflow-stale]` to distinguish it from explicit cancellation.

**REQ-224b — Workflow staleness detection (Part b).**
The staleness counter SHALL be recorded in `spec_health` under `pending_workflow` alongside the decision text and elapsed connections. A workflow canceled by staleness follows the same state-restoration contract as explicit cancellation (REQ-042). The threshold is configurable via `TTRPG_WORKFLOW_STALENESS_CONNECTIONS`; setting it to zero SHALL disable staleness detection. See also REQ-193. *Acceptance criterion:* A pending workflow survives 4 connection restarts and remains open; on the 5th restart it auto-cancels with `[workflow-stale]` audit entry and restored pre-workflow state.

**REQ-224c — Workflow staleness detection (Part c).**
Setting `TTRPG_WORKFLOW_STALENESS_CONNECTIONS=0` prevents all auto-cancellation. _Check:_ T266.
**REQ-235a — Structured player choices (Part a).**
choice prompts to the player. `present_choices(prompt, choices[], allow_freeform?, context?)` returns a `[NEED_INPUT]` decision workflow (REQ-042). Each choice in the `choices` array SHALL have `id` (kebab-cased identifier), `label` (display text), and `description` (detail text). `allow_freeform` (configurable) permits the player to provide a free-text response instead of selecting a listed option. `context` is an optional metadata object (e.g., `{urgency: "medium"}`). The player responds via `respond(decision, option)`.

**REQ-235b — Structured player choices (Part b).**
The outcome SHALL be appended to the audit log with a `[choice]` tag; freeform responses SHALL be stored in the audit entry's `content` field. *Coupling:* When a `present_choices` result is recorded, any countdown (REQ-073) bearing the same `id` in its `scope` field SHALL advance by one tick. Choices whose resolved `id` matches a faction goal keyword (REQ-233) SHALL advance that faction's clock.

**REQ-235c — Structured player choices (Part c).**
The choice outcome SHALL also advance any `linked` countdown triggered by the matching clock. *Acceptance criterion:* `present_choices("The goon blocks your path.", [{id: "talk", label: "Talk", description: "Persuade him"}, {id: "fight", label: "Fight", description: "Start combat"}])` returns `[NEED_INPUT]` with two options; `respond("The goon blocks your path.", "fight")` records a `[choice]` audit entry; a countdown with `scope: "fight"` advances. _Check:_ T273.

### 5.5 Badges and Access

**REQ-030 — Single-user connection.** Each MCP connection serves one active badge at a
time — the badge most recently set via `set_badge` or `TTRPG_BADGE`. No concurrency,
no multiplayer state sharing within a connection. The active badge and active entity
are Novel-scoped: two connections to the same Novel share the same badge and entity
state (REQ-031, REQ-074). Each connection may independently switch between Novels
via `switch_novel` (REQ-095), and each Novel stores its own badge independently.
*Acceptance criterion:* Starting a second MCP connection to the same Novel succeeds
and inherits the Novel's current badge and active entity; switching badges. On one
connection is visible on the other.
_Check:_ Appendix D.

**REQ-031a — Badge activation (Part a).**
active by default — the server operates with full access. All tools, resources, and prompts are accessible without restriction. Badge gating (REQ-032) takes effect based on the active badge. Wearing the Player or Game Master badge means you are in the story. Editor and Observer badges are out of the story. Switching to the Editor badge with `set_badge("none")` restores full access; the Novel persists. Under the Editor badge, all badge-filtered surfaces (`badge_briefing`, `prompts/list`, `resources/list`, `tools/list`, guidance) return full unfiltered content.

**REQ-031b — Badge activation (Part b).**
The badge activation state persists with the Novel (REQ-055). `end_novel` deletes the Novel regardless of badge state. *Acceptance criterion:* On Novel creation or resume with the Editor badge active, `tools/list` returns all tools unfiltered; after `set_badge("player")`, GM-only tools are excluded from `tools/list` and return `[FORBIDDEN]` on invocation; after `set_badge("none")`, full access is restored and the Novel persists. _Check:_ T9, T150.
**REQ-066a — set_badge tool (Part a).**
`player`, `game_master`, `observer`, or `none`. Returns `[OK] Active badge: <badge>` on success — `"none"` returns `[OK] Active badge: Editor — full access`, `"observer"` returns `[OK] Active badge: observer — read-only spectator mode`. Returns `[STATE_CONFLICT]` if a pending workflow exists. The tool is NEVER badge-gated — it is always callable regardless of current badge.

**REQ-066b — set_badge tool (Part b).**
The badge switch takes effect immediately on the next tool call. `set_badge("none")` switches to the Editor badge with full access; the Novel persists untouched. *Acceptance criterion:* `set_badge("player")` returns `[OK] Active badge: player` and the next tool call is gated; `set_badge("observer")` returns `[OK] Active badge: observer — read-only spectator mode`; `set_badge("none")` returns `[OK] Active badge: Editor — full access` and full access is restored; `set_badge(...)` during a pending workflow returns `[STATE_CONFLICT]`. _Check:_ T9.
**REQ-032a — Server-side gating (Part a).**
badge. Player tools, resources, and prompts are a strict subset of GM-visible ones. Observer tools are a read-only subset: state-query tools (`character_sheet`, `session_recap`, `help`, `scene://current`, `entities://`, etc.) are permitted; mutating tools (commands, generation, hybrid per REQ-015) return `[FORBIDDEN]` with the corrective action "Observer mode is read-only. Switch badges with `set_badge` to interact." `tools/list` and related metadata surfaces are filtered. Guidance items are filtered. `spec_health` metrics are filtered. `[FORBIDDEN]` responses direct callers to use `set_badge` to switch badges.

**REQ-032b — Server-side gating (Part b).**
Under the Editor badge, no gating applies — all endpoints return full content and all tools are callable. *Acceptance criterion:* Under the Player badge, `create_npc(...)` returns `[FORBIDDEN]`; switching to Game Master badge makes the same call succeed; switching back and calling again returns `[FORBIDDEN]`. Under the Observer badge, `set_scene_state(...)` returns `[FORBIDDEN]` directing to `set_badge`; `help()` succeeds. _Check:_ T9, T13, T15, T18, T26, T44, T148, T151.
**REQ-216a — Generation table badge filtering (Part a).**
from both badges, but tables with `badge_scope: "game_master"` SHALL return `[FORBIDDEN]` when called from the Player badge — the error SHALL enumerate the full table name but SHALL NOT reveal table content. The `badge_scope` value SHALL be visible in `spec_health` per-table metadata but the table content SHALL NOT. The `badge_briefing` SHALL enumerate available table names with their badge_scope, filtered per the active badge's access level.

**REQ-216b — Generation table badge filtering (Part b).**
The error message SHALL direct the caller to `badge_briefing` for a non-revealing list of accessible tables. *Acceptance criterion:* `roll_on_table("madness_short_term")` called from the Player badge returns `[FORBIDDEN]` with the table name visible but no content; the same call from the Game Master badge returns the table result. `badge_briefing` under the Player badge lists only `badge_scope: "shared"` table names. _Check:_ T257.
**REQ-133a — Forbidden-call audit (Part a).**
`[FORBIDDEN]` is recorded in the audit log with timestamp, active badge, tool name, and arguments — matching the fields recorded for mutating calls (REQ-040). Forbidden-call entries carry a `violation_type: "boundary"` field on the audit entry that is absent from mutating-call entries.

**REQ-133b — Forbidden-call audit (Part b).**
When surfaced through `compress_audit` or `audit://novel`, the entry's output prefix is prepended with `[BOUNDARY_VIOLATION]` to distinguish it from mutating entries at a glance. *Acceptance criterion:* Invoking a GM-only tool under the Player badge produces an audit entry with badge `player`, tool name, arguments, and a boundary-violation marker; the entry is visible at `audit://novel` and is distinguishable from mutating entries. _Check:_ T147.
**REQ-134 — Minimum Player tool surface.** When the Player badge is active,
the server guarantees that tools in these functional groups are callable:
dice-resolution (rolls and checks), ruleset lookups, character sheet
rendering, action suggestions, player signals, help, undo/redo of the Player
badge's own mutations, and badge switching. The builder records the gate
classification for every tool in DECISIONS.md in a format that can be
diffed against each badge's filtered `tools/list` output.
*Acceptance criterion:* Under the Player badge, each Player-guaranteed group
defined in the body has at least one tool callable by the Player; a tool
known to be GM-exclusive returns `[FORBIDDEN]`.
_Check:_ T148.

**REQ-220a — Narrative point of view (Part a).**
the active entity carries narrative POV (point of view) semantics: the player is inhabiting this character — speaking as them, perceiving through their senses. The server SHALL include a POV directive in `badge_briefing`, positioned in the decision-critical group after scene state and before the entity listing.

**REQ-220b — Narrative point of view (Part b).**
The directive contains: (a) the active entity's name; (b) an instruction to the AI: describe the scene through this character's eyes and senses — other characters' internal states (thoughts, feelings, unexpressed intentions) are inaccessible unless the POV character could observe or infer them; (c) the active entity's personality fields and voice examples (REQ-077) in compact inline form as voice and manner reference.

**REQ-220c — Narrative point of view (Part c).**
When no active entity is set — `active_entity_id` is null per REQ-176 — the directive is replaced with an empty-state marker: "POV: none — narration is omniscient." The directive is NEVER truncated by the briefing size budget (REQ-135, tier 1). POV follows the active entity across `set_active_entity` calls — there is no separate tool. *Acceptance criterion:* After `set_active_entity("character_01")`, `badge_briefing` includes a POV directive naming character_01 with the narrative instruction and personality fields.

**REQ-220d — Narrative point of view (Part d).**
Switching to character_02 updates the directive; removing all entities shows the omniscient empty-state marker. _Check:_ T262.
**REQ-223a — POV mode control (Part a).**
optional `pov` parameter — `character` (default) or `omniscient`. When `pov=character` is set with an active entity, the POV directive follows REQ-220: the narration locks to that character's perspective. When `pov=omniscient` is set, the POV directive SHALL render as the omniscient empty-state marker defined in REQ-220 regardless of whether an active entity exists — narration is unrestricted, all characters' states are accessible.

**REQ-223b — POV mode control (Part b).**
The `pov` parameter is stored as Novel-scoped state and persists across `set_active_entity` calls: switching entities with `pov=character` keeps the new entity under character-locked POV; switching entities with `pov=omniscient` keeps narration omniscient. When `set_active_entity` is called without the `pov` parameter, the existing POV mode is preserved.

**REQ-223c — POV mode control (Part c).**
The initial default is `character` — the first `set_active_entity` call in a Novel locks POV to that entity unless `pov=omniscient` is explicit. *Acceptance criterion:* After `set_active_entity("char_01", pov="omniscient")`, `badge_briefing` shows "POV: none — narration is omniscient" with char_01 still the active entity; `set_active_entity("char_02")` preserves omniscient mode; `set_active_entity("char_02", pov="character")` switches to character-locked POV for char_02. _Check:_ T265.
**REQ-304a — Counterpart AI role (Part a).**
active badge by default: when the human wears `player`, the AI briefs as Game Master; when the human wears `game_master`, the AI briefs as Player; under the Editor badge, the AI has no narrative role (Editor-badge briefing per REQ-136). The server accepts a `TTRPG_AI_ROLE` environment variable with values `counterpart` (default), `game_master`, or `player`. When set to a fixed value, the AI's narrative role is locked — `game_master` forces GM-oriented briefing regardless of the human's badge, `player` forces player-oriented briefing.

**REQ-304b — Counterpart AI role (Part b).**
The AI role determines the orientation sections in `badge_briefing` (foundations, anti-slop, tone samples, behavioral boundary directive per REQ-109) while the active badge determines the state surface and tool filtering. `TTRPG_AI_ROLE` is read at startup and applies to all connections and Novels. The active badge controls tool-access gating; the AI role controls narrative orientation.

**REQ-304c — Counterpart AI role (Part c).**
The default `counterpart` preserves current behavior when the human wears the Player badge (AI briefs as GM) and enables human-GM + AI-Player configuration when the human wears the Game Master badge. *Acceptance criterion:* With `TTRPG_AI_ROLE=counterpart` and human wearing the Player badge, `badge_briefing` orientation content is GM-oriented. Same badge but `TTRPG_AI_ROLE=player` forces player-oriented orientation. Human wearing the GM badge with `counterpart` shows player-oriented orientation. Editor-badge with any `TTRPG_AI_ROLE` shows Editor-badge briefing per REQ-136. _Check:_ T348.
**REQ-305a — Observer mode (Part a).**
human observes while the AI plays both Player and Game Master roles. Tool gating (REQ-032) restricts the human to read-only access: state-query tools succeed; all mutating tools return `[FORBIDDEN]` directing the caller to switch badges. `badge_briefing` orientation content instructs the AI: "You are both Game Master and Player. The human is observing. Narrate scenes, make decisions for all player characters, advance combat, play the Novel." The state surface is unfiltered (GM-level visibility). The human may step out by calling `set_badge` with any other value.

**REQ-305b — Observer mode (Part b).**
Observer mode is Novel-scoped — it persists with the Novel and is visible in `spec_health`. *Acceptance criterion:* `set_badge("observer")` returns `[OK] Active badge: observer — read-only spectator mode`. `create_npc("Test")` returns `[FORBIDDEN]` with corrective action citing `set_badge`. `help()` succeeds. `badge_briefing` includes the dual-role orientation instruction. _Check:_ T349.
**REQ-306a — Adjustable autonomy (Part a).**
The server provides a `set_autonomy` tool — Game Master only, Novel-scoped.

**REQ-306b — Adjustable autonomy (Part b).**
The tool accepts an object with four independent sliders, each defaulting per the §7.6 configuration surface: `level` (`full`, `mechanical_prompt`, or `manual`) — who decides what the AI plays, from auto-playing everything to requiring human decisions on all ruleset mechanical actions; `confirmation` (`auto`, `confirm`, or `prompt`) — how decisions are presented, from auto-execution to prompting with options; `safety` (`safe`, `moderate`, or `hardcore`) — consequence severity, from no permanent death to full consequences; `creativity` (`predictable`, `standard`, or `chaotic`) — how much the AI surprises the player, from optimal decisions to dramatic twists.

**REQ-306c — Adjustable autonomy (Part c).**
The `mechanical_prompt` boundary applies only to tools that invoke ruleset-derived resolution mechanics — tools classified as command or hybrid per REQ-015 whose behavior is derived from the ruleset, not from the world model or narrative infrastructure. Inform parser commands and narrative state tools are never paused. At `mechanical_prompt` level, when a mechanical decision point is reached, the AI SHALL call `present_choices` (REQ-235) with `[NEED_INPUT]` to present the decision; the human responds via `respond`. All four slider values SHALL be visible in `badge_briefing` and `spec_health`.

**REQ-306d — Adjustable autonomy (Part d).**
Autonomy composes with any badge — a human Player with `level=full` lets the AI auto-play their character; a human GM with `level=full` lets the AI run all NPCs and player characters. Player signal preferences (REQ-069) — pace, difficulty, tone, focus, and boundary — SHALL be respected at all autonomy levels. Autonomy controls who makes decisions; player signals define constraints on all decisions regardless of which agent makes them. A `level=full` AI SHALL still observe a `boundary=veil` signal by skipping detailed violence descriptions, and SHALL still respect `difficulty=easy` by calibrating encounter threat.

**REQ-306e — Adjustable autonomy (Part e).**
The `register` signal (REQ-064) SHALL also be respected at all autonomy levels — the AI SHALL NOT switch between character and meta register without an explicit `player_signal` call. *Acceptance criterion:* `set_autonomy({level: "full", confirmation: "auto", safety: "safe", creativity: "standard"})` returns `[OK]`. `badge_briefing` includes the autonomy state. With `level=mechanical_prompt` and `confirmation=prompt`, the AI auto-narrates exploration but pauses via `present_choices` for combat actions; the human responds via `respond`. _Check:_ T350.
**REQ-306f — Safety escalation advisory (Part f).**
WHEN a `set_autonomy` call raises the `safety` slider from `safe` to a higher tier, THE system SHALL surface an escalation advisory stating the consequence change before it takes effect — `moderate` allows death with warnings, `hardcore` makes death permanent without warnings. The advisory SHALL require explicit confirmation; a declined escalation SHALL leave the current tier in place. The advisory SHALL render once per Novel per target tier. *Acceptance criterion:* Raising `safety` to `moderate` surfaces the advisory and requires confirmation before the tier applies; declining leaves `safe` active. _Check:_ T483.
**REQ-306g — Creativity tier mapping (Part g).**
The three `creativity` tiers SHALL correspond to distinct, monotonically ordered output-variation levels — `predictable` producing the least deviation from expected outcomes and `chaotic` the most. The build SHALL record the concrete configuration for each tier in DECISIONS.md (4); the `standard` tier SHALL NOT equal an unmodified platform sampling default unless that default is recorded as the standard configuration. `spec_health` SHALL report the recorded tier mapping. *Acceptance criterion:* DECISIONS.md (4) records distinct per-tier configurations; `spec_health` reports the mapping. _Check:_ T484.
**REQ-109a — Badge briefing composition (Part a).**
these groups, split into two sourcing layers: **Orientation layer** (sourced from the AI's narrative role per REQ-304): badge foundations (REQ-062), anti-slop guidance (REQ-070), narrative tone samples (REQ-071), and badge behavioral boundary directive (REQ-064). When the AI's role is Game Master, these groups contain GM-oriented content; when the AI's role is Player, player-oriented content. Under observer mode (REQ-305), the orientation layer SHALL include a dual-role instruction: "You are both Game Master and Player. The human is observing.

**REQ-109b — Badge briefing composition (Part b).**
Narrate scenes, make decisions for all player characters, advance combat.

**REQ-109c1 — Badge briefing composition (Part c1).**
Play the Novel." **State surface layer** (sourced from the active badge per REQ-032): current scene state (REQ-076), narrative POV directive (REQ-220), active entities with summary stats and presence markers (REQ-074, REQ-307), active NPCs (REQ-075), active countdowns — badge-filtered by `badge_scope` (REQ-073), active lore entries (REQ-083), active adventure content (REQ-079), registered tools relevant to the current scene type (REQ-087), active combat state — round, turn order, and current participant (if in-combat; REQ-043).

**REQ-109c2 — Badge briefing composition (Part c2).**
Also reported: active entity personality fields and voice examples — badge-filtered per REQ-077 (REQ-077), the narrative directive (GM only, REQ-081), player signals (GM only, REQ-069), Novel setup metadata (REQ-089, including a "Session zero not yet completed" reminder when `session_zero_completed` is false), a pointer to the intro prompt (REQ-063).

**REQ-109c3 — Badge briefing composition (Part c3).**
Further reported: story journal entries — entries whose entity IDs overlap the active entities or whose scene anchor matches the current scene (GM only, REQ-246), the current autonomy state — all four slider values from `set_autonomy` (REQ-306) when set, campaign memory facts (GM only, REQ-310), world in motion entries (GM only, REQ-233a), and proactive available actions (REQ-084a).

**REQ-109d — Badge briefing composition (Part d).**
Groups whose data source is empty SHALL include an explicit empty-state marker describing which category is empty. Markers preserve the expected briefing structure and prevent the caller from inferring non-existent content. The enumeration order above is the builder's required default section ordering for `badge_briefing`.

**REQ-109e — Badge briefing composition (Part e).**
Decision-critical groups (scene state, the POV directive, entities, combat state, triggered lore, active NPCs, active countdowns, narrative threads, campaign memory (REQ-310), world in motion (REQ-233a), and available actions (REQ-084a)) precede the section boundary; supplementary guidance and navigation groups (badge foundations, anti-slop guidance, narrative tone samples, active adventure content, registered tools, entity personality fields, the narrative directive, player signals, Novel setup metadata, autonomy state, and the intro pointer) follow.

**REQ-109f — Badge briefing composition (Part f).**
The Game Master may override this order via `set_briefing_order` (REQ-082). *Acceptance criterion:* `badge_briefing` for a Novel with entities, combat, countdowns, and lore includes all mandatory groups; an empty data source displays its empty-state marker; decision-critical groups appear before supplementary groups. _Check:_ T109, T110, T149.

#### Briefing Section Tokens

**REQ-281a — Narrative-threads section token (Part a).**
`narrative_threads` section token in the decision-critical group containing: (a) unresolved story journal decisions — `decision` type entries whose referenced entity or scene has no corresponding `consequence` entry (REQ-246), surfaced as "Unresolved: <entry summary>"; (b) active promises derived from story journal `bond` entries with no `consequence`; (c) active countdowns with their narrative meaning — name + remaining ticks in prose form; (d) active NPC dispositions where the disposition differs from the NPC's creation default, surfaced as "<NPC name> (<disposition>, set in session <N>)"; (e) active vow progress when populated (REQ-289).

**REQ-281b — Narrative-threads section token (Part b).**
The section is badge-filtered: GM sees all; Player sees only own-entity bonds and `shared`-scope content. The `narrative_threads` token SHALL appear in the decision-critical group, after entities and before combat state. This token gives the AI GM a "what's currently unresolved" signal for narrative consistency.

**REQ-281c — Narrative-threads section token (Part c).**
When all source data is empty, the token SHALL render its empty-state marker: "[No unresolved threads.]" *Acceptance criterion:* After recording a story journal `decision` with no `consequence`, setting a countdown, and creating an NPC with a non-default disposition, `badge_briefing` under the GM badge includes a `narrative_threads` section with the unresolved decision, the countdown in narrative form, and the NPC disposition. Under the Player badge, only own-entity bonds and shared content appear. _Check:_ T330.
**REQ-286a — Knowledge-state section token (Part a).**
group showing what the active entity currently knows: (a) revealed secrets (key and reveal timestamp); (b) known NPC relationships where the active entity is a participant; (c) `shared`-scope lore entries whose trigger keywords have appeared in scenes the active entity was present for. Knowledge SHALL be scoped by entity presence per REQ-308: an entity only learns percepts from scenes where it was present (listed in `characters_present` per REQ-076). Percepts gained from scenes the entity attended are retained regardless of current presence.

**REQ-286b — Knowledge-state section token (Part b).**
When the active entity is not present in the current scene, the section renders "[Entity not present in this scene]" above the entity's retained knowledge. When no active entity is set, the section renders "[No active entity — knowledge state unavailable.]" When the active entity knows nothing, it renders "[No known information.]" The section SHALL NOT include GM-only secrets, unrevealed lore, or relationships where the active entity is not a participant.

**REQ-286c — Knowledge-state section token (Part c).**
On a fresh Novel, `badge_briefing` renders the empty-state marker — narrative tools fade into the background per §5.10. *Acceptance criterion:* After `reveal_secret("floor_trap", "rogue_01")`, setting the rogue as active entity, `badge_briefing` under the GM badge includes a `knowledge_state` section token listing the revealed secret. After setting an entity not present in the current scene as active, the section renders "[Entity not present in this scene]" above retained knowledge. _Check:_ T336.
**REQ-159a — Synthesis briefing integration (Part a).**
(§11.1), `badge_briefing` SHALL include synthesis-derived content as follows: (a) supplementary guidance items SHALL appear in the guidance section, tagged `[supplementary]` with source URL and confidence, badge-filtered by badge_scope (REQ-080); (b) entity voice examples sourced from synthesis SHALL appear alongside roster-sourced voice examples under the entity personality group, tagged `[supplementary]` (REQ-077); (c) adventure advice SHALL appear when the active Novel contains a generated adventure (REQ-132), tagged `[supplementary]`.

**REQ-159b — Synthesis briefing integration (Part b).**
Synthesis-sourced content follows the same badge filtering rules as the synthesis resource surfaces — game_master-scoped items are hidden from the Player badge. When synthesis is not active, the briefing renders without synthesis content — no empty-section markers for synthesis groups. *Acceptance criterion:* After synthesis, `badge_briefing` under the GM badge includes supplementary guidance items tagged `[supplementary]` alongside source URLs. Synthesis-sourced voice examples appear under entity personality with `[supplementary]` tag. Under the Player badge, game_master-scoped synthesis items are absent.

**REQ-159c — Synthesis briefing integration (Part c).**
After `revert_synthesis`, synthesis content is absent from all badge views. _Check:_ T194. *Out of scope:* authentication or authorization mechanisms, multi-connection badge synchronization, and badge inheritance across Novels. The spec assumes a single trusted operator — `set_badge` is always callable without authentication. The badge model supports configurable AI narrative role (REQ-304), observer mode (REQ-305), and adjustable autonomy (REQ-306) while maintaining two-badge tool-access gating.

**REQ-159d — Synthesis briefing integration (Part d).**
The badge model is a convenience and narrative-integrity feature, not a security boundary (see Appendix P for threat model).
**REQ-135a — Badge briefing size budget (Part a).**
output is bounded by a configurable limit. When the briefing would exceed this limit, content is truncated from lowest-priority sections first. Sections are truncated in full — no section is partially rendered. Each truncated section includes a marker and a resource URI pointer for full retrieval. Badge foundations (REQ-062) and the intro pointer (REQ-063) are never truncated. The builder records the truncation priority order and the default limit in DECISIONS.md.

**REQ-135b — Badge briefing size budget (Part b).**
The truncation priority order SHALL respect three tiers: (1) never-truncated: badge foundations (REQ-062), badge boundary directive (REQ-064), intro pointer (REQ-063), POV directive (REQ-220); (2) last-truncated: decision-critical groups per REQ-109; (3) first-truncated: supplementary guidance and navigation groups per REQ-109.

**REQ-135c — Badge briefing size budget (Part c).**
Within each tier, the builder determines the relative truncation order and records it in DECISIONS.md. *Acceptance criterion:* With a small briefing budget, invoke `badge_briefing` — assert some low-priority sections are truncated with resource URI pointers; assert badge foundations and the intro pointer are always present regardless of budget. _Check:_ T149.
**REQ-180a — Truncation budget unit (Part a).**
specification are defined in bytes of UTF-8 encoded Markdown output. When a builder's implementation environment measures in tokens, the builder SHALL use a character-to-token heuristic of 4 characters per token (the `CHARS_PER_TOKEN` convention) to convert between units and SHALL record the chosen heuristic in DECISIONS.md.

**REQ-180b — Truncation budget unit (Part b).**
The byte-level threshold is the authoritative limit — the token estimate is a proximity guard that SHALL NOT be used to truncate earlier than the byte threshold would require. *Acceptance criterion:* A 32,000-byte threshold produces truncation at the same byte offset regardless of whether the builder internally measures in tokens or bytes; the heuristic is recorded in DECISIONS.md. _Check:_ T222.
**REQ-136a — Editor-badge briefing (Part a).**
`badge_briefing` returns setup-oriented content: a list of available Novels (REQ-093), the current active Novel name if one exists, and a pointer to the `intro` prompt (REQ-063).

**REQ-136b — Editor-badge briefing (Part b).**
No gated content is accessible — the briefing presents the same full-access view as all other Editor-badge surfaces but structured for initial orientation rather than ongoing play. *Acceptance criterion:* On startup with no Novel active, `badge_briefing` returns a setup-oriented message with the intro pointer and Novel-creation guidance; with a Novel active under the Editor badge, the briefing includes the active Novel name, setup progress when incomplete, and guidance to continue Novel setup or start the story when ready. _Check:_ T150.
**REQ-137a — Gate classification auditability (Part a).**
the server is assigned to one of three gate classifications: callable only under the Player badge, callable only under the Game Master badge, or callable under any badge (un-gated). The gate classification for every tool is enumerable at build verification time from the tool registration source without invoking the running server. The builder records the classification for every tool in DECISIONS.md.

**REQ-137b — Gate classification auditability (Part b).**
Tool-category reassignment (REQ-067) does not alter gate classification. *Acceptance criterion:* The Player-filtered `tools/list` output contains exactly the tools classified as Player or un-gated in DECISIONS.md; the GM-filtered output contains exactly the tools classified as GM or un-gated; `set_badge` is always present in both lists. No tool is classified as both Player-only and GM-only. _Check:_ T151.

### Gate classification table

The classification table in DECISIONS.md SHALL enumerate every registered tool
with the format:

| Tool name          | Gate       | Badge visibility         |
|--------------------|------------|------------------------|
| `set_badge`          | un-gated   | Player, Game Master    |
| `init_combat`      | GM-only    | Game Master            |
| `character_sheet`  | Player     | Player                 |

The `tools/list` output filtered by each badge SHALL match the Gate column of
this table. A tool added after the initial build SHALL append a new row within
the same DECISIONS.md section before the server restarts. Helper tools that
exist solely to support other tools (e.g., `respond`) inherit the gate of
the tool they service.

**REQ-148 — Structural integrity gate.** _(F1)_ The ruleset source SHALL pass all
blocking items in the Appendix H checklist before discovery proceeds. A failed
blocking item stops the line; informational items produce findings logged in
DECISIONS.md (4) without blocking. The G0a evidence record in
DECISIONS.md (6) SHALL enumerate each blocking item and its pass/fail status.
*Acceptance criterion:* A ruleset with duplicate headings fails G0a and
the build does not proceed to discovery; a ruleset missing horizontal-rule
separators passes G0a with the finding logged.
_Check:_ G0; T183.

**REQ-149 — MCP conformance gate.** _(F3)_ The running server SHALL pass every
check in Appendix D before the build proceeds past intake. A failed check stops
the line. The G0b evidence record in DECISIONS.md (6) SHALL enumerate
each Appendix D check and its pass/fail status. The server SHALL be verified
against the active fixture as specified in §8 G0b.
*Acceptance criterion:* A server that returns a JSON-RPC error for a canonical
lookup of a known-absent entity fails G0b and the build does not proceed;
a server that passes all Appendix D checks produces an evidence record
enumerating each check.
_Check:_ G0; T184.

**REQ-150a — Golden transcript coverage completeness (Part a).**
transcript passes G2, the builder SHALL verify that every behavioral contract the selected fixture exercises (REQ-001, REQ-032, REQ-041, REQ-042, REQ-043, REQ-050, REQ-072, REQ-073) is exercised by at least one transcript interaction. Any unexercised contract SHALL be recorded as a coverage gap in the G2 evidence record with the unexercised REQ cited. Coverage gaps do not block the line; they are findings recorded in DECISIONS.md (6) for operator disposition. *Acceptance criterion:* Replay the Appendix B golden transcript — assert every contract is exercised by at least one interaction.

**REQ-150b — Golden transcript coverage completeness (Part b).**
Mask an interaction from the transcript — assert the unexercised REQ is recorded as a coverage gap without blocking the build. _Check:_ G2; T185.
**REQ-211a — Evidence record field contract (Part a).**
DECISIONS.md (6) SHALL include, at minimum: workflow identifier (G0, G2, G3, G4, G5, or H1–H14), timestamp, environment pins (runtime version, OS, and spec hash at time of execution), pass/fail status, and a findings section enumerating each sub-check with its individual result.

**REQ-211b — Evidence record field contract (Part b).**
Per-workflow extension fields: G0 records enumerate Appendix H and Appendix D checklist items with individual pass/fail; G2 records include the per-contract coverage enumeration defined in §8; G3 records include registry/resource diff summary; G4 records include per-test pass/fail counts; G5 (Pattern Buffer) records include per-sub-workflow verdict and blocking/non-blocking classification.

**REQ-211c — Evidence record field contract (Part c).**
A verifier following §10 SHALL produce evidence records with the same minimum field set for Phase 1 step 2, enabling field-by-field comparison in Phase 2 step 8. *Acceptance criterion:* A DECISIONS.md (6) evidence record for any workflow can be parsed to extract workflow identifier, timestamp, environment pins, pass/fail status, and sub-check enumeration without depending on prose interpretation. _Check:_ T253, T188.
**REQ-275 — Evidence hash commitment.** Before Phase 1 of independent verification
(§10), the builder SHALL compute and record a SHA-256 hash of the full DECISIONS.md
in the redacted copy supplied to the verifier. After Phase 1, when the operator
supplies the unredacted DECISIONS.md, the verifier SHALL compute its SHA-256 hash
and compare against the commitment. A hash mismatch SHALL be recorded as a
Discrepancy with the "evidence tampered" classification. Hash match is a
prerequisite for Phase 2 comparison — mismatch blocks Phase 2.
_Check:_ T295.

**REQ-276 — Independent verifier model criteria.** The independent verifier
(§10) SHALL be a model from a different provider or a different architecture
family than the builder model. A model from the same provider with a version
increment (e.g., provider-model-v3 vs. provider-model-v4) is insufficient. The
verifier SHALL record its model identity (provider, model name, version) in its
evidence record. The operator SHALL verify the model-difference criterion before
beginning Phase 1; a same-provider-same-architecture verifier SHALL be noted as
a process-compliance finding and does not block the verification but SHALL be
recorded in DECISIONS.md (6).
_Check:_ T296.

### 5.6 State, Lifecycle, Entities, and Adventure Content

#### Core State and Lifecycle

**REQ-040a — Audit log (Part a).**
condition changes, HP changes, combat state, table rolls with results) is recorded in an append-only audit log (`audit://novel`), including timestamp, badge, tool name, arguments, and output prefix. State queries are not logged. Each audit entry chains the hash of the preceding entry, producing a tamper-evident sequence. On load, the server verifies the chain end-to-end and reports a mismatch in `spec_health` and stderr. The log survives connection restarts for the same Novel.

**REQ-040b — Audit log (Part b).**
WHEN a new `TTRPG_SESSION_ID` value is detected, the server SHALL insert a `[session-boundary]` marker entry (REQ-237) before the first mutating entry of the session — the marker is a mutating entry for hash-chain purposes and is included in `audit://novel` output. A hash chain broken at any point SHALL report a mismatch in `spec_health` and stderr; the server loads entries up to the break point. The audit log is part of the Novel and is removed with it by `end_novel`.

**REQ-040c — Audit log (Part c).**
Badge switches via `set_badge` (all values: `player`, `game_master`, `none`) SHALL produce audit entries recording the old badge, new badge, and timestamp. Badge-switch entries carry the badge-switch designation as their tool-name field.

**REQ-040d — Audit log (Part d).**
They are recorded in the append-only audit log and included in `audit://novel` output, but they are not mutating state operations for undo/redo purposes — `undo` SHALL NOT reverse a badge switch. *Acceptance criterion:* A combat attack produces an audit entry with timestamp, badge, tool name, arguments, and output prefix; `audit://novel` returns entries in append order with chained hashes. _Check:_ T8, T147.
**REQ-168a — Audit resource (Part a).**
retrievable via `resources/read` and listed in `resources/list`. It returns the Novel's full audit log as Markdown — one entry per line, ordered append-first, each line containing the timestamp, badge, tool name, and output prefix. The resource is badge-filtered: the Player badge sees entries where the recorded badge is `player` or where the entity affected is owned by the current player; the Game Master sees all entries. Forbidden-call entries (REQ-133) carry a `[BOUNDARY_VIOLATION]` prefix in the output column to distinguish them from mutating entries. State queries are not recorded and do not appear.

**REQ-168b — Audit resource (Part b).**
When no Novel is active, `resources/read` returns `[ERROR] [STATE_CONFLICT]`. *Acceptance criterion:* `resources/read` on `audit://novel` returns audit entries in append order with chained hashes; Player badge sees only own-entity and own-badge entries; forbidden-call entries are distinguished; state queries are absent. _Check:_ T203.
**REQ-041a — Snapshots and undo (Part a).**
`undo` restores the most recent mutation from a LIFO snapshot stack. Stacks are keyed by the badge under which `undo` is invoked, but every snapshot captures the full Novel state — `undo` in the Player badge reverses the most recent mutation regardless of which badge initiated it. The stack depth supports at least 10 undo levels per badge. Builders that cannot meet this floor must record the constraint and its justification in DECISIONS.md (5).

**REQ-041b — Snapshots and undo (Part b).**
An empty stack returns `[ERROR] [STATE_CONFLICT]`. `undo` is a pure-state tool — it itself is not snapshot-able, and the step it reverses is removed from the snapshot stack. A pending `[NEED_INPUT]` blocks undo. Cancelling a workflow restores the pre-workflow snapshot and discards the workflow's internal undo candidates. When the undo stack exceeds the configured or default depth ceiling and the oldest snapshot is discarded, the server SHALL record a `[snapshot-truncated]` audit entry identifying the badge and the discarded entry's snapshot timestamp.

**REQ-041c — Snapshots and undo (Part c).**
When no depth ceiling is configured, the truncation threshold is the 10-entry floor defined above. *Acceptance criterion:* Ten consecutive mutations produce ten snapshot entries; `undo` restores each in LIFO order; the eleventh undo returns `[STATE_CONFLICT]` when the builder minimum is 10. _Check:_ T10.
**REQ-116 — Redo.** A `redo` tool re-applies the most recently undone mutation. After
`undo` pops a snapshot from the undo stack, the popped snapshot is pushed onto a per-badge
redo stack. `redo` pops from the redo stack, restores the snapshot to the active Novel, and
pushes the pre-redo state back onto the undo stack. An empty redo stack returns
`[ERROR] [STATE_CONFLICT]`. Any new mutating tool call clears the redo stack. `redo` is a
pure-state tool — it is not snapshot-able. A pending `[NEED_INPUT]` blocks redo.
*Acceptance criterion:* After `undo` then `redo`, the Novel state matches the
pre-undo state exactly; a new mutation after undo clears the redo stack; redo with
empty stack returns `[STATE_CONFLICT]`.
_Check:_ T121.

**REQ-043a — Conflict lifecycle (Part a).**
confrontation), it is modeled as Novel-scoped state: participants, round counter, turn order. `init_combat` starts; `advance_combat` resolves one participant's turn and advances the turn order, incrementing the round when wrapping around; `end_combat` terminates. Participants may be entities, named NPCs (REQ-075), or dangers. Turn resolution reports the participant name, the action taken (if any), the roll result with full transparency, and any resulting state changes (HP, conditions).

**REQ-043b — Conflict lifecycle (Part b).**
When the ruleset delegates mechanical resolution to separate tools (attack, damage, condition), `advance_combat` derives its turn report from the audit log — summarizing the most recent mutating entries for the current participant since the preceding `advance_combat` call — and reports the participant name, actions taken, roll results with full transparency, and resulting state changes. When no mutating entries exist for the participant (a skipped or delayed turn), `advance_combat` reports the participant took no action.

**REQ-043c — Conflict lifecycle (Part c).**
The builder selects the reporting strategy at build time and records the choice in RULESET_MODEL.md. Participants with no turn-defining mechanical stats — dangers and NPCs created without stat fields — advance automatically on their turn. `advance_combat` reports the participant name with an `[auto]` marker, describes the participant's narrative action using the participant's description field (if any), applies no mechanical changes, and advances to the next turn. No separate tool call is required from the caller.

**REQ-043d — Conflict lifecycle (Part d).**
Initiative ties resolve by participant type (entity before NPC before danger), then alphabetically by name. The Novel's total combat rounds counter increments by one each time the combat round wraps (last participant's turn completes and the turn order returns to the first participant). The counter is cumulative across all combats in the Novel's lifetime. `end_combat` does not additionally adjust the counter — it records the outcome and tears down the combat state. The counter is included in novel metadata (REQ-093) and reported in `session_recap` (REQ-072) and `spec_health` (REQ-025).

**REQ-043e — Conflict lifecycle (Part e).**
Snapshot/load operations work within one connection. Active combat state is visible in `badge_briefing` as a dedicated group containing the round number, the turn order list with the current turn clearly marked, and the current participant name. The Game Master sees the full turn order and all participant names; the Player badge sees entity turn positions only (NPC and danger positions are redacted).

**REQ-043f — Conflict lifecycle (Part f).**
When no combat is active, the group is omitted entirely from the briefing — no empty-state marker. *Acceptance criterion:* `init_combat(participants=["hero"], dangers=[{"name": "goblin"}])` assigns turn order entity first, then dangers; `advance_combat` reports the participant, action, roll, and state changes; `advance_combat` on a danger's turn reports `[auto]` with a narrative action; after weapon-damage mutation, `advance_combat` reports the participant name, weapon, damage roll transparency, and target HP change; after a turn with no mutations it reports the participant took no action. _Check:_ T25, T33, T110, T161, T162; G2.

**REQ-043g — Conflict lifecycle (Part g).**
Combat state is Novel-scoped — it persists when the story ends via `set_badge("none")` or resumes via `set_badge("player")` or `set_badge("game_master")`. `end_novel` discards the combat state along with all other Novel state. When a story resumes mid-combat, the combat continues from its current round and turn position — the turn order, participant states, and round counter are unchanged. When a story resumes and no combat was active, play begins from the current scene state.
**REQ-203 — Combat-init guard.** When `init_combat` is called while combat is already
active, the server SHALL return `[ERROR] [STATE_CONFLICT]` with the text "Combat already
active — call `end_combat` first." No combat state is modified and the existing combat
continues unchanged.
*Acceptance criterion:* `init_combat` followed by a second `init_combat` call returns
`[STATE_CONFLICT]` and the active combat's round and turn order are unchanged by the
rejected call.
_Check:_ T246.

**REQ-204a — Combat participant validation (Part a).**
participant ID against the Novel's known entities and named NPCs. Participants that resolve are added to the turn order normally. Participants that do not resolve to any known entity or NPC SHALL produce `[ERROR] [NOT_FOUND]` enumerating the unresolvable IDs and the complete list of valid entity and NPC identifiers. Validation occurs before any initiative rolls or turn-order construction — a rejected `init_combat` call leaves no combat state active.

**REQ-204b — Combat participant validation (Part b).**
Danger entries (which have no persistent IDs) are exempt from this validation. *Acceptance criterion:* `init_combat(participants=["nonexistent"])` with no entities imported returns `[NOT_FOUND]` enumerating "nonexistent" and listing valid entity/NPC IDs; no combat state is created; `session_recap` reports no pending confrontation. _Check:_ T247.
**REQ-205a — Mid-combat participant changes (Part a).**
participants during active combat via `add_combat_participant` and `remove_combat_participant` tools. Both are Game Master only. Participants added during combat are inserted into the turn order immediately after the current turn position, preserving the existing turn order for all other participants. Added participants that do not resolve to a known entity or NPC SHALL produce `[ERROR] [NOT_FOUND]` with valid identifiers enumerated. The current turn pointer does not advance — the added participant will act in the same round, after the current participant's turn.

**REQ-205b — Mid-combat participant changes (Part b).**
Removing the current participant SHALL advance the turn pointer to the next participant before removal.

**REQ-205c — Mid-combat participant changes (Part c).**
Removing the last participant SHALL auto-trigger `end_combat` with the outcome "All participants removed." These tools are mutating operations for undo/redo purposes and SHALL appear in the audit log. *Acceptance criterion:* During active combat with participants ["hero", "goblin"], `add_combat_participant("wizard")` inserts wizard after hero in turn order; `remove_combat_participant("goblin")` removes goblin from turn order and advances pointer if goblin was current; removing the last participant from a 1-participant combat ends it with "All participants removed"; undo reverts the participant change; Player badge returns `[FORBIDDEN]`. _Check:_ T248.
**REQ-206a — Combat-round condition expiry (Part a).**
for a fixed number of rounds or turns, the server SHALL track the remaining duration on the entity. Conditions with a round-based duration SHALL decrement their remaining counter when the affected entity's turn resolves via `advance_combat`. Conditions reaching zero remaining rounds SHALL be automatically removed, recorded in the audit log as a `[condition-expired]` entry with the entity ID, condition name, and the triggering combat round. The expiry occurs after the turn's actions and before the turn pointer advances — an entity's last-round effect is active for its final turn.

**REQ-206b — Combat-round condition expiry (Part b).**
Conditions without a declared duration are exempt from automatic expiry. The builder records the ruleset's condition-duration convention in RULESET_MODEL.md under `condition_durations`. *Acceptance criterion:* Apply a condition with `rounds: 1` to a participant, call `advance_combat` once — assert the condition is removed after the turn and the audit log contains a `[condition-expired]` entry. Apply a condition with `rounds: 0` (instant) — assert it does not decrement. Apply a condition with no `rounds` field — assert no auto-expiry occurs.

**REQ-206c — Combat-round condition expiry (Part c).**
Apply a condition with `rounds: 2` — assert it decrements to 1 after the first `advance_combat` and expires after the second. _Check:_ T249.
**REQ-221a — Combat-navigation interaction (Part a).**
world-model parser commands that change the player's location (go, enter, exit, or equivalent navigation verbs) SHALL return `[ERROR] [STATE_CONFLICT]` with the message "Combat is active — cannot navigate. Call `end_combat` first or flee per the ruleset's retreat mechanic." Inspection commands (examine, look) and non-spatial commands (take, drop on current room) SHALL continue to function — they do not move the player. The combat turn order and round counter SHALL NOT be affected by parser commands — navigation blocking prevents spatial changes but does not consume combat turns.

**REQ-221b — Combat-navigation interaction (Part b).**
This contract applies regardless of whether the TTRPG ruleset defines movement restrictions during combat — the world-model layer enforces spatial immutability during combat as a narrative-integrity guard, superseded only if the ruleset defines a specific retreat or tactical-movement mechanic that explicitly permits location changes during combat. *Acceptance criterion:* During active combat with a populated world model, `command("go north")` returns `[STATE_CONFLICT]`; `command("look")` and `command("examine sword")` return `[OK]`; after `end_combat`, navigation resumes. _Check:_ T263.
**REQ-217a — Condition tools (Part a).**
via `apply_condition(entity_id, condition, rounds?)` and `remove_condition(entity_id, condition)`. `condition` SHALL be validated against the ruleset's indexed condition list — unknown conditions SHALL return `[INVALID_INPUT]` with valid conditions enumerated (REQ-059).

**REQ-217b — Condition tools (Part b).**
Applying the same condition to an entity that already has it SHALL return `[WARNING]` with the text "Condition already active." No duplicate is added, no other state changes. `remove_condition` on an entity that does not have the condition SHALL return `[WARNING]` with the text "Condition not present." Both tools are badge-gated per REQ-032: the Player may apply or remove conditions on their own active entity only; the Game Master may apply or remove conditions on any entity or NPC. Player attempts on other entities SHALL return `[FORBIDDEN]` with the target entity ID.

**REQ-217c — Condition tools (Part c).**
The optional `rounds` parameter on `apply_condition` sets the combat-round duration for REQ-206 auto-expiry — omitting it creates a condition without automatic expiry. Both tools SHALL record mutation entries in the audit log (REQ-040) and appear in `session_recap` condition changes (REQ-072). Applied conditions SHALL appear on `character_sheet` output and in `badge_briefing` entity summaries. Under the Player badge, condition entries in `character_sheet` and `badge_briefing` SHALL be rendered without expiry round counts — the Player sees only the condition name.

**REQ-217d — Condition tools (Part d).**
The Game Master badge SHALL include expiry round counts when the `rounds` parameter was set. *Acceptance criterion:* `apply_condition(entity, "prone")` adds the condition and returns `[OK]`; a second call returns `[WARNING]` with "Condition already active."; `remove_condition(entity, "prone")` removes it; `remove_condition` on an entity without the condition returns `[WARNING]` with "Condition not present."; applying "not_a_condition" returns `[INVALID_INPUT]` with valid conditions listed; Player `apply_condition` on another player's entity returns `[FORBIDDEN]`; applied condition appears on `character_sheet` and `badge_briefing` entity summary. _Check:_ T258.
**REQ-072a1 — Session recap (Part a1).**
`session_recap` returns a structured summary of the active Novel: session timespan (earliest to latest audit entry), active entities with final state (HP, conditions, status — where status is a derived mechanical flag: "alive" when HP > 0, "unconscious" at HP = 0, "dead" when the ruleset's death condition is applied; rulesets without a death condition SHALL report "alive" and "incapacitated"), completed confrontations, pending confrontations, current scene state, active lore entries and their trigger status, the current narrative directive, and current scene type.

**REQ-072a2 — Session recap (Part a2).**
Also reported: the last N scene state transitions (configurable), roster changes (entities created or removed in this Novel during the audit-log timespan), condition changes, and the last N significant rolls (configurable). `session_recap` output is badge-filtered: the Player badge sees only own-entity data; the Game Master badge sees all. `session_recap` output does not produce narrative prose — it returns structured data the LLM uses to narrate the recap.

**REQ-072b — Session recap (Part b).**
The output SHALL be a machine-parseable structure.

**REQ-072c1 — Session recap (Part c1).**
At minimum it SHALL contain these named fields with typed values: `timespan_start` and `timespan_end` (ISO 8601 timestamps, or null if audit log empty), `entities` (array of objects with `name`, `hp`, `max_hp`, `conditions`, and `status` string fields), `confrontations_completed` (array of objects with `participants`, `rounds`, and `outcome` derived from audit-log combat lifecycles per REQ-175), `confrontation_pending` (null or object describing the active combat), `scene` (current description), `scene_type`, `lore_entries` (array of objects with `key` and `active`), `narrative_directive` (free-text or null).

**REQ-072c2 — Session recap (Part c2).**
Also: `scene_transitions` (array of `{from, to, timestamp}` objects, most recent N), `roster_changes` (array of `{entity_id, action` — "created" or "removed", `timestamp}`), `condition_changes` (array of `{entity_id, condition, action` — "applied" or "removed", `timestamp}`), `significant_rolls` (per REQ-174), `total_combat_rounds`, and `story_entries` (array of objects with `type`, `entry`, `timestamp`, `scene_anchor`, and `entity_ids` — most recent N, default 10).

**REQ-072d — Session recap (Part d).**
Missing or inapplicable fields SHALL be present with a typed null or empty array, not omitted.

**REQ-072e — Session recap (Part e).**
The LLM reconstructs a narrative recap from these fields; the tool SHALL NOT generate recap prose. `session_recap` accepts optional parameters: `session_id` (when provided, scopes the recap to the audit log range bounded by the matching `[session-boundary]` marker and the next marker, or the log end for the current session; when omitted, spans the full log range); `max_transitions` (configurable, bounded 1–20) — the number of scene state transitions to return; `max_rolls` (configurable, bounded 1–50) — the number of significant rolls to return.

**REQ-072f — Session recap (Part f).**
Values outside the declared range SHALL produce `[ERROR] [INVALID_INPUT]` with the valid range enumerated. When `session_id` does not match any `[session-boundary]` marker, return `[ERROR] [NOT_FOUND]` with valid session IDs enumerated. *Acceptance criterion:* `session_recap()` returns a structure with all named fields present, each field carrying its declared type or null/empty-array when inapplicable; the output contains no narrative prose strings outside field values; entity status reports "alive" when HP > 0, "unconscious" at HP = 0, "dead" when death condition active. _Check:_ T53, T212, T213, T214, T215.
**REQ-279a — Narrative orientation (Part a).**
field — a prose paragraph (2–4 sentences) derived from the active Novel state. The paragraph SHALL synthesize: (a) the last 3 story journal entries of type `decision` or `bond` (REQ-246); (b) active NPC dispositions that differ from their creation default; (c) the current narrative directive (REQ-081); (d) active countdown names and remaining ticks in narrative form ("The ritual completes in 2 rounds"); and (e) active vow names and milestone counts when vow tracking is populated (REQ-289).

**REQ-279b — Narrative orientation (Part b).**
The paragraph SHALL use plain English without tool names, status prefixes, or structured field syntax — it reads as a "Previously on…" summary a returning player can understand immediately. The field SHALL be present when any of its source data is non-empty. When all source data is empty (new Novel with no play), the field SHALL contain the empty-state marker "[No narrative history yet — your story begins here.]" `session_recap` SHALL include `narrative_orientation` as its first field, before the structured data blocks.

**REQ-279c — Narrative orientation (Part c).**
The paragraph is badge-filtered: Player badge sees orientation derived from `shared`-scope lore, own-entity story entries, and player-visible NPC dispositions per REQ-032. *Acceptance criterion:* After a session with a story journal decision, a narrative directive, and an active countdown, `session_recap()` returns a `narrative_orientation` field containing a 2–4 sentence prose summary synthesizing all three sources. `session_recap` on a new Novel with no play returns the empty-state marker. _Check:_ T328.
**REQ-174a — Significant-roll criterion for recap (Part a).**
`session_recap` purposes when it (a) was produced by a dice-resolution tool (roll_save, roll_skill_check, roll_weapon_attack, roll_weapon_damage, or ruleset-equivalent), (b) has an entity as participant or attacker, and (c) produced a tool output visible to at least one badge. Pure-generation table rolls (REQ-086), GM-only state queries, and rolls without an entity participant are excluded.

**REQ-174b — Significant-roll criterion for recap (Part b).**
The server SHALL track the last N significant rolls per Novel, discarding the oldest when N+1 is reached. `session_recap` SHALL list significant rolls in chronological order with: tool name, entity identifier, die faces, and at most the major outcome (hit/miss/fail/success/damage amount without full transparency replay — the recap is a summary, not a transcript). _Check:_ T213.
**REQ-175a — Confrontation summary derivation (Part a).**
confrontation summaries from the Novel's audit log. Each completed confrontation is the span between a `init_combat` audit entry and its matching `end_combat` entry: participants (entities and named NPC identifiers from the init_combat entry), round count (audit-log-derived count of `advance_combat` entries divided by participant count, rounded up), and outcome (end_combat's outcome field). The pending confrontation, if any, is the active combat state: participants, current round, and turn position.

**REQ-175b — Confrontation summary derivation (Part b).**
When no combat is active, `confrontations_completed` SHALL be an empty array and `confrontation_pending` SHALL be null. Consecutive combats in a single audit-log timespan SHALL produce separate completed entries in chronological order. _Check:_ T214.
**REQ-0731 — Countdowns (Part 1).**
`set_countdown(name, ticks, type, options)`. A `round` countdown decrements automatically at the end of each combat round. A `narrative` countdown decrements only when the Game Master calls `advance_countdown(name)` (for in-world events: time until sunrise, enemy army arrival, ritual completion, torch burnout, poison timers). Either type may carry an `on_scene_transition` flag (decrements on scene transition per REQ-125). Every countdown has a `badge_scope` — `game_master` or `shared` — and a `direction` — `decrement` (fires at `ticks <= 0`) or `increment` (fires at `ticks >= total`).

**REQ-0732 — Countdowns (Part 2).**
Both carry an unambiguous default preserving backward compatibility. `advance_countdown(name)` adjusts one tick in the countdown's direction. `remove_countdown(name)` deletes a countdown before it fires. When a countdown fires, it is recorded in the audit log with a timestamp and removed from active countdowns — its name slot freed for reuse. Expired countdowns remain in the audit log. `countdown://active` lists all active countdowns with remaining ticks, type, badge_scope, and direction, badge-filtered: only shared countdowns are visible to the Player badge.

**REQ-0733 — Countdowns (Part 3).**
Countdowns are Novel-scoped — survive connection restarts, discarded by `end_novel`. Countdown tools are Game Master only; the Player badge reads active countdowns via `badge_briefing` and resource URIs. *Acceptance criterion:* A shared countdown "torch" (3 ticks) appears in both badges. briefings; a GM-only countdown "patrol" appears only in the GM briefing; `advance_countdown("patrol")` at tick 1 fires and removes it. _Check:_ T54, T139.
**REQ-329a — Countdown-world coupling (Part a).**
array with world-model event types. Supported trigger types: `on_room_enter(<room_id>)` — fires when the active entity enters the named room via parser navigation; `on_thing_take(<thing_id>)` — fires when the named thing is taken; `on_door_open(<exit_ref>)` — fires when the named exit's door is opened. World-model events that match a trigger SHALL advance the countdown by one tick. Multiple triggers per countdown SHALL be permitted — if any trigger matches, the countdown advances. Trigger resolution is mechanical — the countdown fires regardless of narrative framing.

**REQ-329b — Countdown-world coupling (Part b).**
A countdown with no `trigger` array SHALL use existing advancement behavior (manual `advance_countdown` or round/narrative type advancement). Triggers SHALL NOT replace existing advancement — a round countdown with a trigger advances on both round completion AND trigger match. *Acceptance criterion:* `set_countdown("ambush", 3, type="narrative", triggers=["on_room_enter(guard_room)"])` — parser navigation into the guard room advances the countdown by one tick. A countdown without triggers behaves as before. A round countdown with a trigger advances on both round end and trigger match. _Check:_ T373, T376.
**REQ-289a — Vow tracking (Part a).**
promises, quests, or obligations that bind entities or the party. `set_vow(name, description, parties, difficulty, scope)` creates a vow: `name` (unique identifier), `description` (the vow's substance — a sentence), `parties` (array of entity/NPC/faction IDs bound by the vow), `difficulty` (one of `troublesome`, `dangerous`, `formidable`, `extreme`, `epic` — determines the rank track), `scope` (one of `gm`, `shared`, `faction`, or `party` — badge visibility per REQ-032).

**REQ-289b — Vow tracking (Part b).**
A vow's rank track has 10 milestones per difficulty rank (troublesome = 10, dangerous = 20, formidable = 30, extreme = 40, epic = 50). `mark_milestone(vow_name)` advances the milestone counter by one.

**REQ-289c — Vow tracking (Part c).**
When milestones reach the rank track total, the vow is complete and `resolve_vow` becomes available. `resolve_vow(vow_name, outcome, consequences)` closes the vow: the vow moves from active to resolved state, the outcome (free-text summary) is stored, and `consequences` (free-text narrative effects) are recorded as a `consequence` story journal entry per REQ-246. `forsake_vow(vow_name, reason)` abandons a vow — the vow moves to `forsaken` state and is excluded from active displays; the reason is recorded alongside the vow.

**REQ-289d — Vow tracking (Part d).**
Active vows appear in `badge_briefing` (`narrative_threads` section per REQ-281) and `session_recap` (`narrative_orientation` per REQ-279). Resolved and forsaken vows appear in `session_recap` with their state and outcome/reason — a forsaken vow is surfaced with the `[vow-forsaken]` marker. Vow state persists with the Novel and is included in `set_pause_context` captures (REQ-232).

**REQ-289e — Vow tracking (Part e).**
Vow tools are Game Master only; the Player badge reads vow state via `badge_briefing` and `session_recap` when the vow's scope is `shared` or `party`. *Acceptance criterion:* `set_vow("Find the Crown", "Recover the lost Crown of Alara", parties=["pc_1", "pc_2"], difficulty="dangerous", scope="shared")` creates a vow with a 20-milestone track. `mark_milestone("Find the Crown")` advances the counter. `resolve_vow("Find the Crown", "The Crown is found in the Dragon's hoard", "The kingdom is restored")` moves the vow to resolved. `forsake_vow("other_vow", "Too dangerous")` marks it forsaken. _Check:_ T335.
**REQ-322a — Vow-countdown coupling (Part a).**
SHALL offer a countdown creation suggestion in the `narrative_threads` section of `badge_briefing`: the suggestion carries the vow name, a proposed countdown name (`vow:<vow_name>`), and the vow's milestone total as the tick count. The GM may accept via `respond` to auto-create a `mission`-type countdown linked to the vow. WHEN `mark_milestone` advances a vow, if a linked countdown exists with name `vow:<vow_name>`, THE engine SHALL advance that countdown by one tick. WHEN a linked countdown fills, the countdown fires its completion AND the vow becomes eligible for `resolve_vow`.

**REQ-322b — Vow-countdown coupling (Part b).**
WHEN `resolve_vow` or `forsake_vow` closes a vow, any linked countdown with name `vow:<vow_name>` is removed. The coupling is optional — the GM may decline the suggestion and manage vows via milestones alone (current behavior). Vow-countdown links SHALL survive Novel persistence and SHALL be included in `set_pause_context` captures (REQ-232).

**REQ-322c — Vow-countdown coupling (Part c).**
For shared-scope vows, the countdown suggestion and linked countdown state SHALL be visible in Player and Observer `badge_briefing` `narrative_threads`; GM-scope vow countdowns remain GM-only. *Acceptance criterion:* `set_vow("Find Crown", ..., difficulty="dangerous")` produces a countdown suggestion in `badge_briefing`. Accepting creates a 20-tick `mission`-type countdown named `vow:Find Crown`. `mark_milestone("Find Crown")` advances both the milestone counter and the countdown.

**REQ-322d — Vow-countdown coupling (Part d).**
Filling the countdown makes the vow eligible for `resolve_vow`. `resolve_vow("Find Crown", ...)` removes the countdown. _Check:_ T369.

#### Entities, NPCs, and Adventure Content

**REQ-074a — Multi-entity support (Part a).**
same badge. The roster may hold multiple entities for the player. `entities://` lists all Novel entities visible to the active badge. One entity is the active entity — the default target for tools that accept an `entity_id` when no `entity_id` is supplied. The first imported entity is the active entity by default. `set_active_entity(entity_id)` switches the active entity and is always callable regardless of badge.

**REQ-074b — Multi-entity support (Part b).**
The `party` resource (`party://current`) lists all player-owned entities with summary stats: name, active status, HP, conditions, and `present` flag (derived from the most recent `set_scene_state` `characters_present` parameter per REQ-307). REQ-030 scoping is unchanged — one user per connection, no multiplayer. The active entity also establishes the narrative POV per REQ-220. *Acceptance criterion:* Creating and importing two entities produces two entries in `entities://`; `set_active_entity(entity_02)` switches the default target for entity_id-optional tools. _Check:_ T55.

**REQ-074c — Multi-entity support (Part c).**
Calling `import_character(roster_id)` for a roster entity whose Novel already contains a copy (matched by roster source ID, not Novel entity ID) SHALL return `[STATE_CONFLICT]` identifying the existing Novel entity by name and ID, with a hint: "Entity already imported as `<name>` (`<entity_id>`)." This prevents silent entity duplication within a Novel. The constraint is per-Novel — importing the same roster character into two different Novels is permitted. _Check:_ T220.
**REQ-176a — Entity removal (Part a).**
(Game Master only) that removes an entity from the active Novel. Removing the active entity SHALL clear the active entity field; the next imported or explicitly activated entity becomes active. Removing the last entity SHALL leave `active_entity_id` null and clear `characters_present`. `party://current` SHALL exclude removed entities. The roster baseline is unaffected — `import_character` using the same roster ID after removal creates a fresh copy. Entity removal is a mutating operation for undo/redo purposes.

**REQ-176b — Entity removal (Part b).**
Player badge attempts return `[FORBIDDEN]`. *Acceptance criterion:* `remove_entity("character_02")` removes the entity from `entities://`; `party://current` no longer lists it; the roster baseline is unchanged; re-importing the same roster ID creates a fresh entity copy. _Check:_ T216.
**REQ-177 — Roster entity removal.** The server SHALL provide a
`remove_roster_character(roster_id)` tool (callable with the Editor badge or Game Master badge)
that removes a character from the roster. Removing a roster character does not affect any
Novel that has already imported it — existing Novel entity copies survive independently.
Player badge attempts return `[FORBIDDEN]`. When the roster ID does not exist, SHALL return
`[NOT_FOUND]` with valid roster IDs enumerated.
*Acceptance criterion:* `remove_roster_character("character_01")` removes the entry from
`roster://`; a Novel that previously imported it retains its copy; re-creating a character
with the same name creates a new roster entry with a different ID.
_Check:_ T217.

**REQ-178a — Roster listing (Part a).**
callable under any badge with no restrictions. The tool returns a structured listing: for each roster entry, the roster ID, name, race, class, and level. When no characters exist in the roster, the tool SHALL return an empty-state marker. The `novel_setup` prompt (REQ-089) SHALL source its roster character list from this tool's output rather than constructing the list independently.

**REQ-178b — Roster listing (Part b).**
The `roster://` resource (REQ-022) SHALL be populated from the same data source — `roster://<type>` groups entries by type (e.g., class, race), and `roster://<id>` returns the full entity data for a single roster entry including personality fields and voice examples. *Acceptance criterion:* `list_roster_characters()` returns all roster entries with ID, name, race, class, level; `roster://character_01` returns full data; an empty roster returns the empty-state marker. _Check:_ T219.
**REQ-075a — Named-NPC state (Part a).**
`create_npc(name)`. NPCs are Novel-scoped with URIs (`npc://<id>`). Only `name` is a required field; optional fields include `description`, `disposition`, `location`, and any ruleset-derived stat fields as partial entries (all optional). NPCs may participate in confrontations alongside entities and dangers (REQ-043). `update_npc(id, fields)` mutates NPC fields; providing a field not previously set on the NPC SHALL extend the NPC's field surface — the field is added with the supplied value.

**REQ-075b — Named-NPC state (Part b).**
Null or empty-string values SHALL clear the field without removing it from the NPC's known field set. `remove_npc(id)` deletes an NPC. `npcs://` lists all active NPCs. NPC state persists with the Novel. All NPC tools are Game Master only; the Player badge reads NPC state via `badge_briefing` and resource URIs.

**REQ-075c — Named-NPC state (Part c).**
Every NPC SHALL carry depth metadata: `appearance_count` (incremented each time the NPC appears in a scene or is referenced in `badge_briefing`), `first_seen` (ISO 8601 timestamp of first appearance), and `last_seen` (ISO 8601 timestamp of most recent appearance). `badge_briefing` SHALL include a depth signal for each NPC: NPCs with `appearance_count < 3` display with name and description only; NPCs with `appearance_count >= 3` display with a `[recurring]` marker and the count ("3 appearances across 2 sessions"); NPCs with `appearance_count >= 10` display with a `[campaign]` marker. `session_recap` SHALL include an NPC relationship heatmap: for each NPC with `appearance_count > 1`, the number of sessions they appeared in and the number of distinct scenes.

**REQ-075d — Named-NPC state (Part d).**
An NPC not seen in 5 or more sessions SHALL carry a `[distant]` marker in `badge_briefing`. The depth metadata is automatically maintained by the server — the GM does not set it directly. *Acceptance criterion:* `create_npc("Innkeeper")` produces an NPC with `npc://<id>` URI; `update_npc(id, {disposition: "friendly"})` changes the field; `remove_npc(id)` deletes it. An NPC appearing in 3 scenes across 2 sessions displays `[recurring]` in `badge_briefing` with the appearance count.

**REQ-075e — Named-NPC state (Part e).**
An NPC not seen in 5 sessions carries `[distant]`. `session_recap` includes an NPC relationship heatmap with session and scene counts. _Check:_ T56.
**REQ-119a — NPC stat block reference (Part a).**
ruleset reference — the name of a monster, NPC template, or stat block entry from the indexed ruleset. When a reference matches a ruleset entry, the builder populates the NPC's stat fields from that entry's baseline values as defined by the ruleset. Any caller-supplied stat fields override the referenced values.

**REQ-119b — NPC stat block reference (Part b).**
A reference that does not match any ruleset entry returns `[ERROR] [NOT_FOUND]` with valid reference names enumerated. *Acceptance criterion:* `create_npc("Goblin", ruleset_reference="Goblin")` populates stat fields from the ruleset entry; an unknown reference returns `[NOT_FOUND]` with valid names. _Check:_ T126. Reference-populated fields are additive to the builder-determined NPC stat surface (REQ-123).

**REQ-119c — NPC stat block reference (Part c).**
A reference entry may carry fields beyond the builder's discovered conventions — those fields SHALL be included on the NPC and are considered part of the NPC's stat block for rendering (REQ-120) and resource URI output (REQ-121). Caller-supplied fields that match reference field names override the referenced values; caller-supplied fields that do not match any reference field name SHALL extend the NPC's stat surface.

**REQ-119d — NPC stat block reference (Part d).**
A reference field whose name collides with a builder-determined stat field that uses a different ruleset-native name SHALL be surfaced under the reference field's name; the builder records the name mapping in RULESET_MODEL.md.
**REQ-120 — NPC rendering.** The server renders NPC stat blocks through the
same mechanism it uses for entity character sheets. An NPC identifier produces a
stat block containing all populated stat fields, current conditions, and narrative
fields (description, disposition, location, and any personality fields per REQ-122)
in the ruleset's baseline stat-block format. An identifier that resolves to neither
an entity nor an NPC returns `[ERROR] [NOT_FOUND]`. The Game Master badge sees all
fields; the Player badge sees only fields visible in `badge_briefing`.
*Acceptance criterion:* `character_sheet(entity_id="npc_01")` renders the NPC
stat block in ruleset format; an unknown ID returns `[NOT_FOUND]`.
_Check:_ T127.

**REQ-121 — NPC resource URIs.** The server registers `npc://<id>` for each
active NPC in the current Novel, returning the NPC's full stat block and narrative
fields, and `npcs://` returning a list of all active NPCs with summary fields
(name, disposition, location). Resources are badge-filtered: Game Master sees all
fields; Player sees summary fields only. Resources are re-registered on Novel
switch and removed on `end_novel`.
*Acceptance criterion:* `npc://<id>` returns the NPC's full stat block and narrative
fields; `npcs://` lists all active NPCs with summary fields; both are badge-filtered.
_Check:_ T128.

**REQ-122a — NPC narrative fields (Part a).**
personality fields following the same contract as entity personality fields (REQ-077): `description`, `voice`, `background`, `goals`, and `voice_examples`. These fields are set via `set_personality` and `set_voice_examples` accepting an NPC identifier alongside entity identifiers. NPC narrative fields are Novel-scoped — NPCs have no roster; fields persist only with the Novel. These fields are inert narrative context and do not influence mechanical resolution. Setting narrative fields on an NPC is Game Master only.

**REQ-122b — NPC narrative fields (Part b).**
Fields are surfaced in `badge_briefing` and at `npc://<id>/personality`. *Acceptance criterion:* `set_personality("npc_01", {voice: "gruff, clipped sentences"})` sets NPC narrative fields; `npc://npc_01/personality` returns them; these fields are inert and do not influence combat resolution. _Check:_ T129.
**REQ-156 — NPC description field.** The `description` field listed in
REQ-075 and the `description` personality field in REQ-122 refer to the same
NPC property. Setting description via either `create_npc(description=...)`
or `set_personality(npc_id, {description: ...})` SHALL write to the same
field. The most recent write wins regardless of which tool was used.
A read via `npc://<id>`, `character_sheet`, or `npc://<id>/personality`
SHALL return the same value from all surfaces.
*Acceptance criterion:* `create_npc("Guard", description="Tall")` then
`set_personality(npc_id, {description: "Suspicious"})` produces an NPC
whose description reads "Suspicious" at `npc://<id>`, `character_sheet`,
and `npc://<id>/personality`.
_Check:_ T191.

**REQ-123 — Builder-defined NPC stat fields.** The stat fields exposed on NPCs
are determined by the builder from the ruleset during discovery — not enumerated in
the specification as a fixed set. The builder derives the NPC stat surface from the
ruleset's own stat-block conventions. The `create_npc` and `update_npc` tools
expose builder-determined fields as optional parameters. Every field is optional
except `name` (per REQ-075). A ruleset with no discovered NPC stat conventions
produces an NPC surface with only narrative fields.
*Acceptance criterion:* A ruleset defining AC, HP, and Speed as NPC stat
conventions produces `create_npc` with those parameters; a ruleset with no
stat conventions produces only narrative fields.
_Check:_ T130.

**REQ-124a — NPC damage resolution (Part a).**
identifiers as target parameters alongside entity identifiers. When an NPC is the target, the tool resolves damage against the NPC's defensive stats using the ruleset's own damage model — deducting HP, wounds, or the ruleset's loss-of-effectiveness metric — and reports the result with full transparency (per REQ-003). An NPC reduced to or below the ruleset's zero-health threshold is marked with the ruleset-defined incapacitation condition.

**REQ-124b — NPC damage resolution (Part b).**
Damage resolution against NPCs is snapshot-able and audited. *Acceptance criterion:* `roll_weapon_damage("longsword", target_id="npc_01")` reduces NPC HP; zero HP applies incapacitation per ruleset convention; the result is audited and snapshot-able. _Check:_ T131.
**REQ-0761 — Scene-state ledger (Part 1).**
via `set_scene_state(description, ...)`. In addition to `description` (required), the tool accepts optional fields: `location`, `time_of_day`, `atmosphere` (per REQ-076a), `scene_type` (per REQ-087), `narrative_directive` (per REQ-081), `skip_transition_hook` (per REQ-125), and `characters_present` (per REQ-307 — array of entity IDs present in this scene; omitted defaults to all imported entities). When `location` resolves to a world-model room (REQ-326), the room provides spatial truth for the scene — the GM's `description` is narrative framing.

**REQ-0762 — Scene-state ledger (Part 2).**
Each call creates a timestamped entry in the audit log; previous entries are retained in audit history. `scene://current` returns the most recent scene state. `scene://history` returns up to a configurable maximum of the most recent entries. When the cap is exceeded, the most recent entries are returned with a count of suppressed entries and a `[truncated]` marker. The full scene history is available in the audit log (REQ-040). All entries are badge-filtered. Scene state is narrative context. It does not influence mechanical resolution or search results.

**REQ-0763 — Scene-state ledger (Part 3).**
Guidance surfaces (badge_briefing tool ordering, suggest_actions filtering per REQ-087, and lore trigger matching per REQ-083) may be informed by scene description and type — these are navigation and narrative reactivity, distinct from mechanical resolution. The server maintains a Novel-scoped `scene_tick` counter, initialized to zero when the Novel is created and reset to zero on each scene transition. The tick increments by one each time `advance_combat` resolves a full combat round (wraps from last participant to first). It appears in `badge_briefing` for the Game Master badge only, in the Scene section.

**REQ-0764 — Scene-state ledger (Part 4).**
The tick is a pacing aid — it does not trigger mechanics. The `set_scene_state` tool is Game Master only; the Player badge reads scene state via `badge_briefing` and `scene://current`. Scene state persists with the Novel. *Acceptance criterion:* Three `set_scene_state(...)` calls produce three timestamped entries in `scene://history`; scene state is narrative context and does not change search results for mechanical terms. _Check:_ T57, T112, T132, T137.

**REQ-0765 — Scene-state ledger (Part 5).**
WHEN `set_scene_state` references a location that has established lore entries (REQ-083) and the new scene description contradicts an established property of that location, THE server SHALL emit a `[WARNING]` naming the contradiction and the conflicting lore entry. The warning SHALL NOT block the scene change — the GM may override — but SHALL surface the inconsistency for the GM's awareness.

**REQ-0766 — Scene-state ledger (Part 6).**
The check SHALL compare against: (a) lore entries with `badge_scope: "game_master"` or `"shared"` whose trigger keywords match the location name; (b) NPC dispositions set explicitly (not creation defaults) for NPCs whose `location` field matches the scene location.

**REQ-0767 — Scene-state ledger (Part 7).**
The check is keyword-based and does not perform semantic analysis — a lore entry stating "the Inn is crowded" with a trigger keyword "Inn" SHALL produce a `[WARNING]` when a scene description contains "the empty Inn." *Acceptance criterion:* Set a lore entry for "Blackwood Inn" with content "crowded and noisy" and trigger "Blackwood." Call `set_scene_state("The Blackwood Inn is quiet and deserted.")` — assert `[WARNING]` naming the lore entry. Call `set_scene_state("The Blackwood Inn is bustling as always.")` — assert no warning. _Check:_ T331.
**REQ-076a1 — Structured scene fields (Part a1).**
fields alongside the required `description`: `location` (a named place within the world), `time_of_day` (morning, afternoon, evening, night, or free-text), `atmosphere` (mood, weather, sensory qualities — e.g., "tense, foggy, silent"), `scene_type` (one or more type tags from the canonical catalog: `combat`, `social`, `exploration`, `neutral`, per REQ-087), and `narrative_directive` (a standalone directive string or an array of labeled directives per REQ-081). These fields are surfaced in `badge_briefing` alongside the description, in `scene://current`, and in `scene://history` entries.

**REQ-076a2 — Structured scene fields (Part a2).**
They are narrative context — inert data that does not influence mechanical resolution. All fields persist with the Novel. The Player badge reads them via `badge_briefing` and `scene://current`; write access is Game Master only. *Acceptance criterion:* `set_scene_state("dark cavern", location="Underdark", time_of_day="night", atmosphere="tense, dripping water")` surfaces all four fields in `scene://current`. _Check:_ T133.
**REQ-252a — Narrative fast-forward (Part a).**
time via a `fast_forward` parameter on `set_scene_state`. When present, the fast-forward SHALL produce a bridging summary of what transpired during the skipped interval: (a) any countdowns that would have elapsed — `narrative` countdowns advance by the caller-declared interval and `round` countdowns advance proportionally; (b) location lore entries whose triggers match the new scene; (c) NPC state changes the GM declares in a `changes` array (position, disposition, condition).

**REQ-252b — Narrative fast-forward (Part b).**
The bridging summary SHALL be recorded in the audit log as a `[fast-forward]` entry containing the interval description, countdown adjustments, NPC updates, and lore triggers activated. `fast_forward` accepts: `interval` (free-text describing the skipped period — "three days of uneventful travel"), `changes` (optional array of NPC state assertions), and `skip_countdowns` (optional boolean — when true, countdowns are NOT advanced, preserving their state for later use). The fast-forward is snapshot-able and the pre-fast-forward state is restored on undo.

**REQ-252c — Narrative fast-forward (Part c).**
Caller SHALL omit `skip_transition_hook` when `fast_forward` is present — the transition hook fires after the bridging summary is generated. Player badge returns `[FORBIDDEN]`. *Acceptance criterion:* `set_scene_state("The castle gates", fast_forward={interval: "three days of travel", changes:[{npc_id:"guard_1", location:"castle gate"}])` produces an audit entry with the bridging summary, advances narrative countdowns by 3 days, and updates guard_1's location. Undo restores the pre-fast-forward scene state and countdown positions. _Check:_ T312.
**REQ-307a — Entity presence (Part a).**
`last_location` field, derived from the most recent `set_scene_state` call that listed the entity in its `characters_present` parameter (REQ-076). When `characters_present` is omitted, all imported entities are considered present (backward compatible). `party://current` SHALL include a `present` boolean per entity.

**REQ-307b — Entity presence (Part b).**
Entities listed in `badge_briefing` SHALL carry a `[not present]` marker and their `last_location` when their `present` flag is false. `set_active_entity` to a non-present entity SHALL NOT produce an error — the active entity switches and the `knowledge_state` section renders the "Entity not present" marker per REQ-109. A GM-only `set_party_presence(entity_ids, location?)` tool SHALL allow the GM to declare presence explicitly — setting `characters_present` on the current scene without altering other scene fields.

**REQ-307c — Entity presence (Part c).**
Calling `set_party_presence([])` marks all entities as not present; calling it with all entity IDs restores full-party presence. Presence state persists with the Novel. *Acceptance criterion:* After `set_scene_state("Dark corridor", characters_present=["rogue_01"])`, `party://current` shows the rogue as present and other entities as not present. `set_party_presence(["wizard_01"], "Camp")` updates presence without changing scene description. Entity listing in `badge_briefing` marks non-present entities with `[not present]`. _Check:_ T351.
**REQ-308a — Knowledge gating by presence (Part a).**
scoped to the scenes it attended. An entity gains percepts — revealed secrets, triggered lore, NPC relationship changes — only from scenes where it was listed in `characters_present` (REQ-307). Percepts gained from attended scenes are retained regardless of current presence. When the active entity was not present for a percept, that percept SHALL NOT appear in the entity's `knowledge_state` section. When the active entity is not present in the current scene, the `knowledge_state` section SHALL render "[Entity not present in this scene]" above the entity's retained knowledge.

**REQ-308b — Knowledge gating by presence (Part b).**
The GM controls when information crosses character boundaries via existing tools — `reveal_secret` makes secrets known to other entities, `set_lore_entry` with appropriate triggers extends lore to entities that were not present, and story journal entries record character-to-character information sharing. *Acceptance criterion:* A scene with only the rogue present where the trap secret is revealed to the rogue, then a scene with only the wizard, then a reunion scene — assert the rogue retains trap knowledge, the wizard does not until `reveal_secret("floor_trap", "wizard_01")`. _Check:_ T352.
**REQ-330a — Knowledge-world coupling (Part a).**
navigation (`resolve_intent` per REQ-323 or `command` per REQ-196), the entity SHALL be auto-added to presence for that scene/room. Rooms visited via exploration SHALL produce knowledge state entries: room names visited, visible things examined, NPCs encountered. Exploration-derived knowledge SHALL be retained per REQ-308 — once an entity has visited a room, it knows the room regardless of current presence.

**REQ-330b — Knowledge-world coupling (Part b).**
The `knowledge_state` briefing section SHALL include exploration-derived entries alongside revealed secrets — grouped as "Explored" (rooms visited, things seen) and "Learned" (secrets revealed via `reveal_secret`). The GM's explicit `characters_present` on `set_scene_state` (REQ-307) SHALL remain the primary presence mechanism — exploration presence supplements, it does not replace.

**REQ-330c — Knowledge-world coupling (Part c).**
When the GM sets `characters_present` that conflicts with exploration presence, the explicit GM declaration wins. *Acceptance criterion:* A character in room "Entrance" navigates via `resolve_intent` to "Guard Room" — `knowledge_state` includes "Guard Room" under "Explored" with timestamp. Moving to "Chapel" adds Chapel. Returning to "Guard Room" does not create a duplicate entry. `set_scene_state("Camp", characters_present=["pc_1"])` overrides exploration presence — pc_1 is present in Camp regardless of prior room. _Check:_ T374, T377.
**REQ-311a — NPC memory model (Part a).**
interactions with player entities, independent of the global knowledge system (REQ-308).

**REQ-311b — NPC memory model (Part b).**
The NPC memory records witnessed events (what the NPC observed when present per REQ-307, including entity actions, dialogue context, mechanical outcomes, and story journal entries they were present for), contact history (per-player-entity encounter counts with timestamps, disposition history, and "no prior contact" markers for entities the NPC has not encountered), emotional state (derived from recent interactions: disposition trends, stress markers, and goal proximity, surfaced as a one-sentence summary in `badge_briefing` alongside personality fields), and state evolution (automatic disposition updates when player entities interact with the NPC via combat, social checks, or mechanical outcomes — without requiring a GM tool call).

**REQ-311c — NPC memory model (Part c).**
FOR each player entity the NPC has interacted with, the engine SHALL record party knowledge: entity name, apparent capabilities, relationship status, and recent interactions with timestamps (an NPC who has never met an entity carries a "no prior contact" marker). The engine SHALL derive emotional state from disposition trends, stress markers, and goal proximity, surfaced as a one-sentence summary in `badge_briefing` alongside personality fields.

**REQ-311d — NPC memory model (Part d).**
WHEN a player entity interacts with an NPC — via combat, social checks, or mechanical outcomes — the engine SHALL update the NPC's memory and disposition automatically without requiring a GM tool call; the GM may override via `update_npc`. WHEN an NPC is present in the current scene, THE engine SHALL surface the NPC's memory in `badge_briefing` as an `## NPC Memory` section within the entity personality group (REQ-109). The section SHALL include: a one-sentence emotional state summary, a summary of the NPC's last 3 interactions with present player entities, and any goals the NPC is pursuing.

**REQ-311e — NPC memory model (Part e).**
NPC memory SHALL be gated by presence (REQ-307) — only NPCs in the current scene surface their memory.

**REQ-311f — NPC memory model (Part f).**
Memory facts persist with the Novel. `spec_health` SHALL report `npc_memory_count` — the total number of NPC memory entries across all NPCs. *Coupling:* NPC memory entries SHALL populate campaign memory facts (REQ-310) per-NPC category when the event involves significant state changes (goal advancement, disposition flip, relationship change). *Acceptance criterion:* After a session where an NPC (blacksmith) is threatened by a player entity, `update_npc` is not called, but `badge_briefing` under GM badge includes the NPC's memory section showing `disposition: hostile` and the threat event.

**REQ-311g — NPC memory model (Part g).**
After a second session where the same player entity helps the blacksmith, the NPC's memory section shows `disposition: friendly` and the disposition flip is a campaign memory fact. An NPC who has never met the party shows "no prior contact." `spec_health` reports `npc_memory_count ≥ 1`. _Check:_ T356.
**REQ-077a — Entity personality fields (Part a).**
fields: `description` (physical appearance), `voice` (speech characteristics conveying pitch, pace, vocabulary range, mannerisms, and formality register as a free-text description), `background` (history and motivation), `goals` (current objectives), and `voice_examples` (up to 5 example dialogue snippets, each recording `context`, `dialogue`, and `tag` — a scene-type or emotional-context label).

**REQ-077b — Entity personality fields (Part b).**
These are roster-level fields set via `set_personality(entity_id, ...)` and persisted at the roster level; `voice_examples` are set via `set_voice_examples(entity_id, examples)`.   Voice examples follow the same badge-gating contract as other personality fields:   Player-only for own entities (per REQ-165), GM for all. On NPCs (REQ-122), setting   voice_examples is Game Master only.   voice examples sourced from synthesis carry a `[supplementary]` tag and source URL.

**REQ-077c — Entity personality fields (Part c).**
These are narrative context — inert data, not mechanical. `set_personality(entity_id, fields)` sets description, voice, background, goals, and voice_examples — all as optional fields on one tool (Player-only for own entities per REQ-165, GM for all). The tool also accepts NPC identifiers per REQ-122. Personality fields are stored at the roster level and are explicitly mutable (an exception to roster baseline immutability — narrative fields, unlike mechanical stats, may be edited after creation).

**REQ-077d — Entity personality fields (Part d).**
Novel-level overrides: if personality fields are set on a Novel entity via `set_personality`, they override the roster baseline for that Novel only. On Novel entity import, roster personality fields are copied alongside mechanical stats. Fields are surfaced in `badge_briefing` alongside entity stats and at `entity://<id>/personality`; voice_examples are surfaced under the entity personality group in `badge_briefing` per REQ-109.

**REQ-077e — Entity personality fields (Part e).**
When an entity speaks in-character, voice_examples are rendered ahead of trait descriptions in the prompt context (REQ-126). **Authorship guidance.** Effective personality fields describe concrete behaviors rather than abstract traits. The `voice` field works best when it specifies how the entity speaks in practice — e.g., clipped sentences, reaches for sword before speaking when startled — rather than bare adjectives.

**REQ-077f — Entity personality fields (Part f).**
Voice_examples should demonstrate the entity in emotionally distinct situations; they are the primary mechanism for dialogue consistency. *Acceptance criterion:* `set_personality(entity_id, {voice: "slow drawl, formal register"})` stores fields at the roster level; `entity://<id>/personality` returns them; Novel-level override replaces roster baseline for that Novel only. _Check:_ T58, T65, T140.
**REQ-126a — Voice examples rendering (Part a).**
player entity or an NPC with set personality fields — the entity's voice_examples must be rendered in the prompt context alongside its personality trait fields. Voice examples must precede trait descriptions in the prompt ordering, reflecting the show-don't-tell principle: dialogue patterns give the model concrete behavior to imitate, while trait descriptions provide abstract reasoning cues. Voice examples are inert data — they never influence mechanical resolution or dice outcomes.

**REQ-126b — Voice examples rendering (Part b).**
The rendering contract applies to all prompts and resources that surface entity personality: `badge_briefing`, `entity://<id>/personality`, `npc://<id>/personality`, and the `character_sheet` tool. Voice examples sourced from synthesis are tagged `[supplementary]` alongside their source URL and are rendered after player-authored examples when both exist. *Acceptance criterion:* When `badge_briefing` renders an entity with voice_examples set, the dialogue snippets appear before the trait descriptions. _Check:_ T140.
**REQ-282a — NPC voice directive (Part a).**
group (REQ-109), every NPC whose `location` field matches the current scene location AND whose `voice_examples` array is non-empty SHALL include a compact voice directive block. The directive SHALL contain: (a) the NPC name and role; (b) the `voice` field value (REQ-077); (c) up to 2 voice_example snippets (the first two examples from the array); (d) a synthesized "Avoid:" line derived from the voice field — counsel on what the NPC should NOT sound like. The directive block SHALL be badge-filtered per REQ-032: GM sees all NPC voice directives; Player badge sees directives for NPCs created with `shared` scope.

**REQ-282b — NPC voice directive (Part b).**
The voice directive is rendered inline in the entity personality group, after personality fields and before any synthesis-sourced content. It is advisory — it provides the AI GM with voice constraints but does not mechanically enforce them. `voice_examples` stored in the roster (entity-level) follow the same directive rendering in the entity personality group but use the entity's own voice_examples, not NPC-role synthesis. Format: `Voice directive (<NPC name>, <role>): <voice>.

**REQ-282c — NPC voice directive (Part c).**
Example: "<snippet 1>" Example: "<snippet 2>" Avoid: <voice mismatch counsel>.` WHEN `badge_briefing` renders voice_examples for entities or NPCs, only examples whose `tag` field matches at least one active `scene_type` (REQ-087) SHALL be surfaced. Examples with no `tag` or `tag: "neutral"` SHALL always surface. Entity-level voice_examples in the entity personality group follow the same filtering rule. *Acceptance criterion:* Create an NPC with `voice: "gruff, uses 'oi'"`, `voice_examples` containing two dialogue snippets, and `location` matching the current scene.

**REQ-282d — NPC voice directive (Part d).**
Assert `badge_briefing` under the GM badge includes a voice directive block for the NPC. Set scene to a different location — assert the NPC voice directive is absent. _Check:_ T332.
**REQ-127a — Ruleset-native personality mapping (Part a).**
must identify ruleset-native personality constructs — character traits, motivations, beliefs, flaws, bonds, or equivalent mechanics defined in the ruleset's characterization or player-facing sections. If the ruleset defines such constructs with distinct names and semantics, the builder must map each construct to the closest Holonovel personality field and record the mapping in RULESET_MODEL.md. When native constructs exist, the `set_personality` tool description and the `session_zero` prompt (REQ-078) must reference those constructs by their ruleset names.

**REQ-127b — Ruleset-native personality mapping (Part b).**
For example, a ruleset that defines "Traits," "Ideals," "Bonds," and "Flaws" would see those terms in tool descriptions alongside the Holonovel field names. The mapping is advisory — it does not constrain which fields a player sets, only how the surface is presented. If the ruleset defines no native personality constructs, the builder records this finding and uses only the Holonovel field names. *Acceptance criterion:* Building for D&D 5e produces RULESET_MODEL.md mapping Traits/Ideals/Bonds/Flaws to Holonovel fields; `set_personality` tool description includes "Traits," "Ideals," etc. _Check:_ T141.
**REQ-165a — Entity ownership for personality gating (Part a).**
`set_personality` badge gating (REQ-077), an entity is "owned" by the Player badge when that entity was created by the current connection under the Player badge. When no Novel is active, or when the server restarts, ownership of all existing entities resets to unowned — a Player may set personality fields on any entity until a badge is activated. Once the Game Master badge sets personality fields on an entity, the Player badge retains write access to that entity's personality fields (ownership is not exclusive).

**REQ-165b — Entity ownership for personality gating (Part b).**
This definition exists solely to resolve the "Player-only for own entities" contract in REQ-077 — it does not affect tool access, resource filtering, or any other subsystem. *Acceptance criterion:* A Player creates an entity (`create_character` under Player badge) and successfully calls `set_personality` on it. The same Player attempts `set_personality` on an entity created by the GM — the call SHALL succeed (ownership is non-exclusive per the body). A Player who has never created any entity can still call `set_personality` on entities imported by the GM (no ownership check blocks the Player). _Check:_ T200.
**REQ-166a — Personality briefing rendering (Part a).**
entity personality group (REQ-109), each entity with populated personality fields or voice_examples SHALL be rendered as a block containing: the entity name, each populated personality field on its own line (`description`, `voice`, `background`, `goals`), and voice_examples following REQ-126 ordering (dialogue snippets before trait descriptions). Empty personality fields SHALL be omitted — no placeholder lines for unset fields. Entities with no personality fields and no voice_examples SHALL be omitted from the personality group entirely.

**REQ-166b — Personality briefing rendering (Part b).**
When the active Novel contains no entities with personality data, the group SHALL render the empty-state marker per REQ-109. NPCs with narrative fields per REQ-122 SHALL be rendered in the same block, distinguished by an NPC marker. Synthesis-sourced voice_examples carry `[supplementary]` tag per REQ-159. *Acceptance criterion:* `badge_briefing` with an entity carrying `voice: "gruff"` and `goals: "find the relic"` renders both fields under the entity's name; `description` and `background` are absent when unset. An entity with no personality data is absent from the personality group.

**REQ-166c — Personality briefing rendering (Part c).**
NPC personality renders alongside entity personality with an NPC marker. _Check:_ T201.
**REQ-167a — Personality resource URIs (Part a).**
`entity://<id>/personality` for each active entity in the current Novel and `npc://<id>/personality` for each active NPC. Both resources SHALL return a structured object containing: `entity_id` (or `npc_id`), `name`, and the populated personality fields (`description`, `voice`, `background`, `goals`) plus `voice_examples` as an ordered array per REQ-126 (dialogue snippets before trait descriptions). Unpopulated fields SHALL be absent from the response. Synthesis-sourced voice_examples SHALL carry `source: "synthesis"` and a `source_url` field.

**REQ-167b — Personality resource URIs (Part b).**
Badge filtering: Player badge sees personality fields for all entities, and NPC personality fields for NPCs visible in `badge_briefing` per REQ-032. *Acceptance criterion:* `entity://<id>/personality` returns populated fields only; unset fields are absent; `npc://<id>/personality` follows same contract. _Check:_ T58 (extend), T65 (extend), T129 (extend).
**REQ-069a — Player feedback signal (Part a).**
Player-only. Records a structured preference signal: `pace` (slower/faster), `difficulty` (easier/harder), `tone` (lighter/darker/grittier), `focus` (more-action/more-exploration/more-dialogue), or `boundary` (avoid a topic string). The signal is recorded in the audit log. Each signal entry carries a `last_updated` timestamp. When a signal type is sent more than once, the most recent value replaces the prior one and the timestamp refreshes. Sending an empty `value` removes the signal for that type. Player signals persist for the life of the Novel.

**REQ-069b — Player feedback signal (Part b).**
The `pace` signal SHALL mechanically adjust the dramatic pacing window (§7.7.1a). All other signal types SHALL surface in `badge_briefing` as directive context for the AI narrator — the builder SHALL surface them in the orientation layer per REQ-109 but SHALL NOT enforce them mechanically. Adversarial free-text in `value` is stored verbatim as inert data (REQ-054). The stored signal entry is a compound structure: a `value` field (the free-text string, empty for removed signals) and a `connection_counter` field (the Novel's connection counter at set-time per REQ-173).

**REQ-069c — Player feedback signal (Part c).**
The builder determines the internal representation; the contract is that both fields survive Novel persistence and restart. The audit log entry for a `player_signal` call SHALL follow the REQ-040 schema with `tool: "player_signal"`, `args: {signal, value}`, and `output_prefix: "Signal '<signal>' recorded."` (or "removed" for empty-value removal). *Acceptance criterion:* `player_signal("tone", "darker")` records in audit log; sending `player_signal("tone", "lighter")` replaces the value; sending `player_signal("tone", "")` removes it. _Check:_ T8, T26, T142, T211, T450.
**REQ-128a — Signal briefing surface (Part a).**
dedicated player-signals section. For each recorded signal, the section lists the signal type, value, and age — computed as the difference between the Novel's current connection counter and the counter stored with the signal (REQ-173), expressed as "set N connections ago." When no signals are recorded, the section carries an empty-state marker signaling that no preferences have been set. Player signals are on the decision-critical side of the briefing section boundary (REQ-109).

**REQ-128b — Signal briefing surface (Part b).**
The section is never truncated (REQ-118). *Acceptance criterion:* `badge_briefing` in GM badge includes a player-signals section listing each signal type, value, and age delta; an empty-signal Novel shows the empty-state marker. _Check:_ T142.
**REQ-255a — Boundary signal propagation (Part a).**
`player_signal("boundary", value)` (REQ-069) SHALL be surfaced in `badge_briefing` as a dedicated advisory section titled "Boundaries," visible only to the Game Master and positioned before the scene state group (REQ-109). The section SHALL list each active boundary value with an explicit directive: "Do not narrate, imply, or introduce content that evokes these topics." Boundary removal (empty value per REQ-069) removes the entry. The boundary advisory is never truncated by the briefing size budget (REQ-135, tier 1).

**REQ-255b — Boundary signal propagation (Part b).**
When `set_scene_state`, `create_npc`, `update_npc`, `set_lore_entry`, `update_lore_entry`, or `set_narrative_directive` receive free-text input containing a substring that matches an active boundary value (case-insensitive), the server SHALL return `[WARNING]` identifying the matched boundary and the colliding input segment without suppressing the operation — the collision check is advisory because free-text narrative input may coincidentally contain boundary strings without evoking the prohibited topic.

**REQ-255c — Boundary signal propagation (Part c).**
The `generate_adventure` and `generate_encounter` tools are covered separately by REQ-251, whose participant-consent criterion includes boundary-relevant content. *Acceptance criterion:* `player_signal("boundary", "spiders")` sets a boundary; `badge_briefing` under GM badge includes a Boundaries section listing "spiders" with the avoid directive; `set_scene_state("a cavern full of spiders")` returns `[WARNING]` identifying the "spiders" boundary collision. Removing the boundary removes the section. Player badge does not see the Boundaries section in badge_briefing. _Check:_ T314.
**REQ-173a — Connection counter (Part a).**
that increments on every server start or MCP transport connect for that Novel — not on individual tool invocations. When the server restarts or a new MCP session begins, the counter advances by one before any tool is serviced. The counter persists with the Novel and is included in `novel://current` metadata. A `player_signal` call records the current connection counter alongside the signal value, replacing the prior counter when the signal type is overwritten.

**REQ-173b — Connection counter (Part b).**
The age displayed in `badge_briefing` per REQ-128 is `current_connection_counter - stored_counter`, expressed as "set N connections ago" (or "set this connection" when zero). When no connection counter is stored (pre-existing Novel from a build that predates this REQ), the age SHALL display "unknown" instead of an incorrect integer.

**REQ-173c — Connection counter (Part c).**
The builder SHALL record the counter storage format in DECISIONS.md. *Acceptance criterion:* Set a signal, restart server, invoke `badge_briefing` as GM — assert the signal shows "set 1 connection ago." Set another signal, restart, invoke briefing — assert the first shows "set 2 connections ago" and the second shows "set 1 connection ago." Remove and re-set a signal in the same connection — assert it shows "set this connection." _Check:_ T211.
**REQ-129a — Property group cardinality (Part a).**
group has an enforced maximum item count. Exceeding the maximum on a create or set operation SHALL return `[ERROR] [STATE_CONFLICT]` with the affected group named and the current and maximum counts reported.

**REQ-129b1 — Property group cardinality (Part b1).**
Maximums and their configuration sources are: NPCs — `TTRPG_MAX_NPCS` (also used by REQ-097 for health warnings; this REQ adds enforcement at the same threshold); Lore entries — `TTRPG_MAX_LORE_ENTRIES` (also used by REQ-097; the lore token budget per REQ-083 is an independent constraint); Countdowns — `TTRPG_MAX_COUNTDOWNS`; Synthesis items per output module — `TTRPG_MAX_SYNTHESIS_ITEMS`; Story journal entries — `TTRPG_MAX_STORY_ENTRIES`, exceeding on `record_story` SHALL return `[ERROR] [STATE_CONFLICT]`.

**REQ-129b2 — Property group cardinality (Part b2).**
Entities per Novel — `TTRPG_MAX_ENTITIES`, exceeding on `import_character` or `create_character` SHALL return `[ERROR] [STATE_CONFLICT]` with counts reported; Roster entities — `TTRPG_MAX_ROSTER_ENTITIES`, exceeding on `create_character` SHALL return `[ERROR] [STATE_CONFLICT]` before any state mutation.

**REQ-129c — Property group cardinality (Part c).**
Scene history entries are capped per REQ-076. Setting a maximum to zero SHALL disable that group's mutating tools — create, set, and update operations return `[STATE_CONFLICT]`. `spec_health` SHALL report the current count and maximum for every group, with an `overflow` flag when at maximum. A warning fires in `spec_health` when entity count exceeds 80% of the entity maximum; the `healthy` flag is set to false when at maximum.

**REQ-129d — Property group cardinality (Part d).**
The builder records the configured maximums in DECISIONS.md (4). *Acceptance criterion:* Creating the 501st NPC returns `[STATE_CONFLICT]` with the group named; setting `TTRPG_MAX_NPCS=0` causes `create_npc` to fail; `TTRPG_MAX_ENTITIES=0` causes `import_character` to fail; `spec_health` reports per-group counts and overflow status including entity and roster groups. _Check:_ T143, T218.
**REQ-079a — Adventure modules (Part a).**
during the Build workflow alongside the ruleset. Every adventure module SHALL be parsed for world-model declarative assertions (rooms, things, exits, properties) within a designated `## World` section. Assertions found in the section SHALL be extracted and indexed. `load_adventure(adventure, target?)` SHALL — when the adventure module contains a `## World` section — populate the Novel's world-model tier with the extracted rooms, things, exits, and properties, then link any TTRPG annotations (`@encounter`, `@trap`, `@npc`, `@lore`) to world-model objects by name.

**REQ-079b — Adventure modules (Part b).**
Adventure modules without a `## World`  section SHALL load as flat indexed content — their prose is searchable via `search_rules` and surfaced in `badge_briefing`, but no world-model objects are created.

**REQ-079c — Adventure modules (Part c).**
When the adventure module has undergone structural extraction (REQ-247), `load_adventure` SHALL additionally pre-populate Novel state from the extracted content: extracted NPCs SHALL become Novel-scoped NPC entities created silently (GM-modifiable via `update_npc`), extracted location descriptions SHALL become lore entries keyed by heading name, extracted faction references SHALL become faction entities with starting clocks, and the extracted premise SHALL become the adventure hook surfaced in `badge_briefing`. The load response SHALL include a summary of pre-populated items with counts.

**REQ-079d — Adventure modules (Part d).**
Items whose name duplicates existing Novel state are skipped with a note. NPCs carrying only a name and no parseable stats are created as skeletal entities — they participate in combat with `[auto]` turns per REQ-043, using the description field for narration, and the GM is expected to fill in stats via `update_npc` before mechanical combat participation is needed. When a pre-populated NPC's name fuzzy-matches a ruleset monster entry (per `lookup_monster`), the load response SHALL include a suggestion: "NPC '<name>' may match ruleset entry '<match>'.

**REQ-079e — Adventure modules (Part e).**
Confirm to populate stats." After loading, the adventure's prose content SHALL be accessible at `adventure://<adventure-slug>/<anchor>`. `search_rules` includes adventure content; active-adventure results are sorted first. Active-adventure results SHALL carry HIGH match confidence when the query token appears in a section heading; MEDIUM when it appears in body text.

**REQ-079f — Adventure modules (Part f).**
The `[generated]` tag (REQ-132) SHALL NOT affect sort order — generated and indexed results sort by match strength identically; the tag is a source-of-origin marker only. `badge_briefing` includes the active adventure's hook, current location, and — when a world model is populated — the current room's name and visible contents. Adventure content is badge-filtered: sections marked with the ruleset's adjudicator term (e.g., `*Keeper only*`) are hidden from the Player badge. Unmarked sections are visible to all. Multiple adventures may be indexed; only the active adventure's content is surfaced in `badge_briefing`.

**REQ-079g — Adventure modules (Part g).**
Adventure NPCs defined via `@npc` annotations are Novel-scoped entities created at load time; the GM may modify them via `update_npc`. `load_adventure` is Game Master only. `load_adventure` with a slug not matching any indexed adventure SHALL return `[NOT_FOUND]` and enumerate available adventure slugs. The `TTRPG_ADVENTURE` env var (optional, comma-separated paths) pre-loads adventures at startup.

**REQ-079h — Adventure modules (Part h).**
The optional `target` parameter accepts `novel` (default when a Novel is active) or `codex` (default when no Novel is active). `target: "codex"` SHALL process the adventure module's structural extraction (REQ-247) and store the resulting scaffold as a Codex entry of kind `adventure` with `source: loaded:<slug>` — world-model assertions, extracted NPCs, factions, lore entries, and the premise are stored in the adventure data payload per REQ-321 without populating Novel state. `target: "novel"` SHALL load into the active Novel with all existing pre-population behavior (world-model tier population, NPC creation, faction creation, lore entry creation).

**REQ-079i — Adventure modules (Part i).**
When no Novel is active and `target` is omitted, `target` defaults to `codex`. `load_adventure` SHALL be callable regardless of Novel state — no Novel is required for `target: "codex"`. State isolation: world-model objects, NPCs, and lore created by adventure loading are Novel entities — discarded by `end_novel`. Switching adventures replaces the active adventure's world model (if present) and prose content but retains Novel entities created outside adventure loading.

**REQ-079j1 — Adventure modules (Part j1).**
Adventure module content loaded into a Novel SHALL be included in `export_novel` (REQ-096): when `TTRPG_EXPORT_EMBED_ADVENTURES` is `true`, the module's prose content and world-model assertions are embedded inline; when `false`, module slugs are recorded in the export manifest for reconstitution at import time.

**REQ-079j2 — Adventure modules (Part j2).**
*Acceptance criterion:* `load_adventure("tomb-of-the-serpent-king")` activates the adventure, populates the world-model tier with rooms/things/ exits from the `## World` section, links `@npc` annotations, and surfaces the adventure hook and current room in `badge_briefing`; a module without a `## World` section loads as flat indexed content. `load_adventure("tomb-of-the-serpent-king", target="codex")` with no Novel active stores the adventure scaffold in Codex; `codex_list("adventure")` returns the entry with `source: loaded:tomb-of-the-serpent-king`; server restart preserves it. _Check:_ T59, T60, T61, T368.
**REQ-292a — Adventure catalog (Part a).**
(always callable) returning metadata for every adventure module present in `TTRPG_ADVENTURE`. Each entry SHALL include: `slug`, `title`, `preview` (2–3 sentence GM-facing premise), `genre_tags`, `room_count`, `npc_count`, `complexity` (estimated: `short`, `standard`, `epic` based on room count thresholds), and `last_modified`. An optional `filter` parameter accepts a genre tag string and returns only matching adventures.

**REQ-292b — Adventure catalog (Part b).**
When `TTRPG_ADVENTURE` contains no adventure modules, `list_adventures` SHALL return an empty-state message: "[No adventure modules found.]" The catalog is badge-filtered: Player badge sees adventures with a `player_visible` flag or `shared` adventure hooks; GM badge sees all. `spec_health` SHALL report `adventure_catalog_count`. `list_adventures` has no briefing presence per §5.10. `help("list_adventures")` SHALL return usage examples and parameter contracts. *Acceptance criterion:* With 2 adventure modules, `list_adventures()` returns 2 entries with slug, title, preview, genre_tags, room_count, npc_count, complexity, and last_modified.

**REQ-292c — Adventure catalog (Part c).**
Empty directory returns the empty-state message. _Check:_ T338. Adventure modules MAY contain narrative sections in addition to or instead of the `## World` spatial section: `## Premise` — one-paragraph hook introducing the adventure; `## Factions` — named organizations with goals, resources, and starting clocks (per REQ-233); `## Scenes` — ordered or branching scene descriptions with embedded choice prompts; `## NPCs` — named characters with personality fields and voice examples; `## Lore` — worldbuilding keywords with triggers; `## Seeds` — GM-facing prompts and improvisation hooks.

**REQ-292d — Adventure catalog (Part d).**
An adventure with no `## World` section is a narrative-only adventure — it populates Novel state (factions, lore, NPCs, and scene history seeds) without creating spatial rooms. `load_adventure` processes all present sections regardless of spatial content.
**REQ-229a — Adventure synthesis linkage (Part a).**
`@npc`, `@encounter`, and `@lore` annotations, the server SHALL scan both Ruleset Wisdom and synthesis for matches against the newly loaded adventure content: voice examples matched to NPC creature types via the ruleset index, lore templates matched to `@lore` annotation keywords, action patterns matched to encounter types, adventure advice matched to adventure themes.

**REQ-229b — Adventure synthesis linkage (Part b).**
For non-Appendix-K adventures, matches SHALL be derived from structural extraction content (REQ-247): voice examples matched to extracted NPC names via the ruleset index, lore templates matched to extracted location keywords, action patterns matched to extracted encounter descriptions. Ruleset-native synthesis items SHALL be automatically activated for the GM — items are active in `badge_briefing`, synthesis resources, and suggestion surfaces immediately after `load_adventure` completes.

**REQ-229c — Adventure synthesis linkage (Part c).**
Community synthesis items SHALL remain inert per REQ-080, with a prompt in the load response offering activation: "Synthesis X items found. Review at `synthesis://status` and activate individually." Matches are surfaced in the `load_adventure` augmentation section: "Synthesis found X voice examples for adventure NPCs, Y lore templates for adventure locations. Review at `synthesis://status`." The augmentation section SHALL appear after the world-model population confirmation. When no matches are found, the augmentation section is omitted.

**REQ-229d — Adventure synthesis linkage (Part d).**
When synthesis has not been run (community tier empty) and Ruleset Wisdom provides no matches, the section is omitted with no error. *Acceptance criterion:* Loading an adventure with `@npc(goblin)` and synthesis voice_examples containing "goblin" entries produces an augmentation section with match count and `synthesis://status` pointer. Loading an adventure with no matching synthesis items omits the augmentation section. _Check:_ T305.
**REQ-170 — Adventure discovery surface.** `spec_health` SHALL report the set of
indexed adventure slugs and their build-time content hashes. A resource at
`adventures://` SHALL list all indexed adventure slugs with their titles and
badge-filtered hooks. Both surfaces respect badge gating: GM-only content is hidden
from the Player badge.
*Acceptance criterion:* `spec_health` includes an `indexed_adventures` field
listing slugs and content hashes; `resources/read` on `adventures://` returns the
complete list; Player badge sees only Player-visible adventure hooks.
_Check:_ T207.

**REQ-171a — Adventure content validation (Part a).**
builder SHALL validate that every adventure module conforms to Appendix K conventions: an H1 title (used as slug), an `## Overview` heading, an `## Adventure Hook` heading, and consistent use of the ruleset's adjudicator marker for GM-only sections. Adventures that fail validation SHALL be reported at build time with a `[malformed-adventure]` entry in `spec_health` listing the adventure slug, the failing convention, and whether the adventure was skipped or partially indexed.

**REQ-171b — Adventure content validation (Part b).**
Partially indexed adventures serve only the conforming sections; skipped adventures are absent from all surfaces. *Acceptance criterion:* Build with a malformed adventure (missing Overview heading) — assert `spec_health` reports `[malformed-adventure]` with the slug and failure reason; assert conforming sections of partially indexed adventures are retrievable at `adventure://<slug>/<anchor>`. _Check:_ T208.
**REQ-172 — Adventure content drift detection.** The server SHALL record a
content hash for every indexed adventure module at build time. On startup, the
server SHALL compare each adventure's stored hash against the current file on
disk. A mismatch SHALL emit a warning on stderr and surface a
`[adventure-drift]` entry in `spec_health` listing the affected slug and the
detection timestamp. Drift detection SHALL NOT block startup or degrade
service — it is a diagnostic surface, not a safety interlock.
*Acceptance criterion:* Modify an indexed adventure file after build, restart —
assert `spec_health` reports `[adventure-drift]` for the modified slug with the
detection timestamp; assert stderr carries a matching warning.
_Check:_ T209.

**REQ-247a — Adventure structure extraction (Part a).**
builder SHALL extract structural content from every adventure module using discoverable patterns — no Appendix K formatting is required.

**REQ-247b1 — Adventure structure extraction (Part b1).**
The builder SHALL apply three heuristics in order: (a) heading extraction — every `##` or `###` heading in the adventure file becomes a structural table-of-contents entry; headings that are purely numeric or exceed 50 characters without whitespace are excluded (garbled OCR text); confidence HIGH; (b) NPC extraction — a bolded name followed within 3 lines by a numeric stat value, a role noun, or a page reference is an NPC reference; stat values that parse as numbers populate the NPC's fields; non-parsing values are recorded in a `notes` narrative field; confidence LOW.

**REQ-247b2 — Adventure structure extraction (Part b2).**
And: (c) location and faction extraction — a heading whose text contains no rule/action keywords (roll, check, save, attack, damage) and has at least 100 words of prose below it is a scene/location description; a heading within 80 words of a goal- or resource-describing sentence and containing an organization term (Guild, Fleet, Council, Company, Syndicate) is a faction reference; confidence MEDIUM.

**REQ-247c — Adventure structure extraction (Part c).**
Garbled text matching no pattern is discarded silently — the contract guarantees extraction is attempted, not that it yields results. Output is recorded in the build's adventure index. The step is skipped when no adventure files are present. *Acceptance criterion:* Build with a non-Appendix-K adventure — assert structural index produced with scene headings, NPC references, and location entries; a module with no discoverable structure produces an empty index without error. _Check:_ T283.
**REQ-248a — Adventure overview resource (Part a).**
resource at `adventure://<slug>/overview` summarizing the adventure's contents: the premise (one paragraph introducing the adventure), key NPCs (name and one-line role), major locations (name and one-line description), factions in conflict, and the scene count from the structural index. Content is drawn from the structural extraction (REQ-247) and populated when `load_adventure` is called. The resource SHALL be badge-filtered: the Player badge sees only the premise and shared content; the Game Master badge sees the full overview including GM-only sections.

**REQ-248b — Adventure overview resource (Part b).**
When the adventure has no structural index (empty extraction), the resource SHALL return `[WARNING]` with "No structured overview available" and the raw adventure slug. *Acceptance criterion:* `adventure://<slug>/overview` returns premise, NPC list with roles, location list, faction descriptions, and scene count, badge-filtered per section markers. _Check:_ T285.
**REQ-249a — Adventure navigation resource (Part a).**
resource at `adventure://<slug>/navigation` rendering the adventure's structural index (REQ-247) as navigable Markdown: all scenes in order with heading anchors, the current scene waypoint (REQ-250) marked with `[→]`, adjacent scenes indicated as previous and next. The resource is on-demand — it SHALL NOT be included in `badge_briefing`. The resource SHALL be badge-filtered: GM-only sections are hidden from the Player badge; the Player sees only the scene list without GM annotations. When no adventure is loaded, the resource SHALL return `[ERROR] [STATE_CONFLICT]` directing the caller to load an adventure first.

**REQ-249b — Adventure navigation resource (Part b).**
When the adventure has no structural index, the resource SHALL return `[WARNING]` with "No navigation index available." *Acceptance criterion:* `adventure://<slug>/navigation` returns scene list with current waypoint marked; adjacent scenes indicated; badge-filtered per section markers; unavailable when no adventure is loaded. _Check:_ T286.
**REQ-250a — Adventure scene waypoint (Part a).**
an optional `adventure_scene` field accepting a heading anchor from the adventure's structural index (REQ-247). When set: `badge_briefing` SHALL surface the adventure scene's description as a distinct labeled block alongside the current scene state — "Adventure Scene (<slug> § <heading>): <prose>"; `badge_briefing` SHALL list adjacent scenes (previous and next in the structural index) as nearby; the GM's free-text `description` parameter remains independent — the two SHALL NOT overwrite each other. The waypoint persists with the Novel.

**REQ-250b — Adventure scene waypoint (Part b).**
Setting `adventure_scene` to a heading not in the index returns `[NOT_FOUND]` with nearby scene names enumerated. Setting it to an empty string or null clears the waypoint. Changing the waypoint fires a scene transition hook (REQ-125). The field is Game Master only; the Player badge reads it passively via `badge_briefing`.

**REQ-250c — Adventure scene waypoint (Part c).**
When `adventure_scene` is set and the adventure contains GM-only sections, the scene description SHALL be rendered regardless of badge — but the full scene prose (at the adventure resource) is badge-filtered per adventure section markers. *Acceptance criterion:* Set `adventure_scene` to a heading anchor — assert description in `badge_briefing` labeled with adventure slug and scene heading; adjacent scenes listed; transition hook fires; `[NOT_FOUND]` for unknown anchors; Player pass-through in briefing. _Check:_ T284.
**REQ-132a — Adventure generation lifecycle (Part a).**
`generate_adventure(premise)` is a transient Novel-scoped artifact, distinct from build-time indexed adventure modules (REQ-079). Generated adventures are not indexed at build time — they exist only within the Novel that generated them, are discarded by `end_novel`, and are not persisted to the `TTRPG_ADVENTURE` directory. Generated adventure content SHALL be surfaced at `adventure://generated/<anchor>`, use the same heading, anchor, and badge-filtering conventions as indexed adventures (Appendix K), and appear in `badge_briefing` and `search_rules` results when the generating Novel is active.

**REQ-132b — Adventure generation lifecycle (Part b).**
Calling `generate_adventure` when a generated adventure already exists in the Novel SHALL replace the prior generated content. `load_adventure` replaces the active indexed adventure but SHALL NOT affect the generated adventure; a generated adventure SHALL NOT replace the indexed adventure.

**REQ-132c — Adventure generation lifecycle (Part c).**
A Novel may have both an indexed adventure and a generated adventure active simultaneously — `badge_briefing` SHALL surface the indexed adventure's content first, then the generated adventure's content, and `search_rules` SHALL distinguish generated results with a `[generated]` tag. `generate_adventure(premise)` SHALL include a `## World` section in its generated output when the premise suggests spatial content (locations, dungeons, buildings).

**REQ-132d — Adventure generation lifecycle (Part d).**
The generated world-model section SHALL contain at minimum: one room (the starting location) with a description, and exit connections for any additional locations named in the premise. Generated world-model content SHALL follow the same declarative assertion conventions as indexed adventure modules (Appendix K).

**REQ-132e — Adventure generation lifecycle (Part e).**
When the generated adventure is replaced or the Novel is ended, the generated world-model objects SHALL be discarded — they are Novel-scoped per the base contract. *Acceptance criterion:* `generate_adventure("A haunted station")` produces adventure content at `adventure://generated/overview`; restarting the server preserves the generated adventure; `end_novel` discards it; a second `generate_adventure` replaces the first. _Check:_ T146.

#### Fingerprinting and State Integrity

**REQ-044 — Ruleset hash recording.** The server computes a SHA-256 content hash of the
ruleset Markdown files at build time and records it in the build fingerprint (REQ-065).
The hash is computed from the sorted, concatenated contents of every ruleset source file
so that the same filesystem contents always produce the same hash. The recorded hash is
the basis for post-build drift detection (REQ-065). A server built without ruleset files
(e.g., a pure-discovery build that records only the intake answers) records a sentinel
hash indicating no ruleset was present.
*Acceptance criterion:* Building the same ruleset twice produces identical ruleset hashes;
building against two different ruleset revisions produces different hashes.
_Check:_ T17.

**REQ-302a — Per-section content hashing (Part a).**
(REQ-044), the builder SHALL compute per-section content hashes — one hash per top-level heading section in the ruleset Markdown source. Each section hash SHALL use SHA-256 over the normalized section content. Per-section hashes SHALL be recorded in DECISIONS.md (4). During Build (§6.2–§6.3) when per-section hashes from a prior build are recorded in DECISIONS.md (4), and during spec-driven updates (§6.7), sections whose hash is unchanged SHALL be skipped — their prior extraction output is referenced. Sections whose hash changed SHALL be re-extracted.

**REQ-302b — Per-section content hashing (Part b).**
The builder SHALL record a per-section delta summary: total sections, sections unchanged, sections changed, sections added, sections removed. This SHALL NOT override REQ-272 (stock elements catalog) — both operate independently. *Acceptance criterion:* A ruleset with 20 top-level sections, one of which changed, produces per-section hashes where 19 match the prior build and 1 is re-extracted. DECISIONS.md (4) records the delta summary. _Check:_ T346.
**REQ-065a — Build fingerprint (Part a).**
directory: the specification version, the specification content hash (from the embedded holonovel.md, REQ-105), the ruleset content hash (REQ-044), the holonovel version (from B10), the spec repository URL (REQ-106), and the build timestamp. The fingerprint is persisted alongside Novel state so it survives server restarts. On startup with existing state, the server reloads the stored fingerprint and compares it against the freshly computed current-build fingerprint.

**REQ-065b — Build fingerprint (Part b).**
The comparison is field-by-field: a specification version mismatch emits `[spec-version-drift]`; a specification content hash mismatch emits `[spec-drift]` listing the stored and current hashes; a ruleset content hash mismatch emits `[ruleset-drift]` listing the stored and current hashes (traceable to REQ-014); a holonovel version mismatch emits `[holonovel-drift]`; the build timestamp is expected to differ across restarts and does not emit a warning. Drift warnings are diagnostic surfaces, not safety interlocks — they do not block startup or degrade service.

**REQ-065c — Build fingerprint (Part c).**
The active build's specification version, ruleset hash, and build timestamp always take precedence over stored values; stored values are retained for drift comparison only. Per-session fields (the last specification review timestamp and last Pattern Buffer execution timestamp) may be updated at runtime and preserved across restarts, but the constructor-derived version, hash, holonovel package version, and timestamp are immutable for the build's lifetime.

**REQ-065d — Build fingerprint (Part d).**
The server must load existing state gracefully: fields present in state but absent from the current entity model are preserved as inert data and cause no errors; fields required by the current model but absent from existing state receive their ruleset-defined defaults. Roster baselines remain immutable across rebuilds. Unrecoverable state — state that cannot be parsed or structurally loaded — is reported to the operator via stderr and surfaced in spec_health with the affected top-level keys or entity/NPC identifiers named; the server must not silently discard it.

**REQ-065e — Build fingerprint (Part e).**
The server continues to operate with a clean state for the affected Novel — the corrupted state is not loaded; the Novel is treated as ended (resume returns `[STATE_CONFLICT]`). Roster baselines and other intact Novels are unaffected. A fresh start against an empty state directory is a match. *Acceptance criterion:* After a rebuild with added entity fields, an existing Novel loads without error. A corrupted JSON produces a stderr diagnostic naming the affected keys.

**REQ-065f — Build fingerprint (Part f).**
A ruleset modification after build produces a [ruleset-drift] warning in spec_health and stderr at next startup; a spec modification produces a [spec-drift] warning; neither blocks startup. _Check:_ T52, T224. *Out of scope:* relational database backends, distributed state across processes, cloud synchronization, and state migration between incompatible specification versions without the Update workflow (§6.7).
**REQ-313a — Server implementation fingerprinting (Part a).**
content hashes for five server implementation components at every build and record them alongside the build fingerprint (REQ-065) in DECISIONS.md (1).

**REQ-313b — Server implementation fingerprinting (Part b).**
The five components are: server source code (all files in the server's source directory, sorted by path and concatenated), server configuration (the build configuration files governing compilation and dependencies), the dependency lockfile (recording the exact dependency tree), generated extraction data (ruleset extraction output produced during Discovery), and registered surfaces (the sorted, concatenated list of registered tool names, resource URIs, and prompt names).

**REQ-313c — Server implementation fingerprinting (Part c).**
When generated extraction data is absent (ruleset-free builds or servers without extraction), the generated-data component records a sentinel indicating no extraction was performed. Each component hash SHALL be updated on every build and every spec-driven update (§6.7). The builder SHALL NOT use these hashes to gate startup — they exist for scoping subsequent builds and updates (REQ-314). *Acceptance criterion:* A build records five component hashes in DECISIONS.md (1) alongside the build fingerprint; a subsequent build with unchanged source code produces an identical source code hash.

**REQ-313d — Server implementation fingerprinting (Part d).**
A ruleset-free build records the sentinel for generated extraction data. _Check:_ T357.
**REQ-314a — Fingerprint-driven partial rebuild (Part a).**
spec-driven updates (§6.7), the builder SHALL compare the current implementation fingerprints (REQ-313) against the stored fingerprints from the prior build. When one or more components changed but others are unchanged, the builder SHALL scope the rebuild to only the changed components and their dependents, reusing prior output for unchanged components. Source code changes (with configuration and dependencies unchanged) require a typecheck then Pattern Buffer sub-workflows for the changed surfaces per §6.6.

**REQ-314b — Fingerprint-driven partial rebuild (Part b).**
Configuration or dependency changes (with source unchanged) require dependency reinstall and typecheck only. Generated extraction data changes (with ruleset content hash unchanged per REQ-044) require re-indexing generation data only, reusing prior extraction output per REQ-302. Registered surface changes require Pattern Buffer sub-workflows per §6.6 for the changed tools, resources, or prompts. Specification content hash changes per REQ-187 require a gap audit per REQ-098 then implementation of only changed surfaces.

**REQ-314c — Fingerprint-driven partial rebuild (Part c).**
Cold checkout (no stored fingerprints) and builds where more than half the fingerprint components changed SHALL run the full Build workflow (§6.2–§6.6). The builder SHALL record a fingerprint delta summary in DECISIONS.md (1): which components changed, which remained unchanged, the scoping decision, and which prior outputs were reused. *Acceptance criterion:* A build where only the source code changed reuses the stored generated-data hash, skips extraction, and runs only surface-dependent Pattern Buffer sub-workflows. A cold checkout with no stored fingerprints runs the full Build workflow without scoping.

**REQ-314d — Fingerprint-driven partial rebuild (Part d).**
When four of five components changed, the full Build workflow runs regardless of individual scoping rules. _Check:_ T358.
**REQ-232a — Pause/resume context (Part a).**
alongside other Novel state. Fields: `current_scene` (narrative summary of the active scene), `immediate_situation` (what is happening right now), `pending_player_action` (what the player was about to decide), `short_term_plans` (GM's next move), `long_term_plans` (GM's arc-level direction), `active_threads` (array of {name, status, urgency, description}), `npc_attitudes` (object mapping NPC ids to their current disposition strings), `player_goals` (what the player seems focused on), and `saved_at` (ISO 8601 timestamp of last save).

**REQ-232b — Pause/resume context (Part b).**
All fields are optional; a call supplies only the fields the GM wants to update. `set_pause_context(fields...)` — Game Master only — merges provided fields into the existing `gm_context`. `get_pause_context()` returns a complete briefing for session resumption: `gm_context` content plus a Novel state summary plus the `badge_briefing` prompt.

**REQ-232c — Pause/resume context (Part c).**
When `resume_novel` is called, the `intro` prompt SHALL include the `gm_context` summary. `end_novel` clears `gm_context`. `set_pause_context` SHALL automatically capture current faction clock states (REQ-233), active countdown positions (REQ-073), NPC dispositions, entity relationships (REQ-236), the last 3 story journal entries of type `decision` or `bond` (REQ-246), and active vow state — milestone counts and difficulty ranks (REQ-289) — the GM is not required to re-enter these manually.

**REQ-232d — Pause/resume context (Part d).**
The story journal and vow captures SHALL be stored as `story_context` (array of entry summaries, 1–2 sentences each) and `active_vows` (array of vow summaries: name, difficulty, milestone count). These fields are surfaced by `get_pause_context` and included in the `intro` prompt's GM context summary. *Acceptance criterion:* `set_pause_context(current_scene="The tavern brawl", short_term_plans="Guards arrive in 2 rounds")` followed by `get_pause_context()` returns both fields; `resume_novel` includes the context in `intro`. _Check:_ T268.
**REQ-2331 — Factions (Part 1).**
with goals, resources, and a progress clock. `create_faction(name, description, goals?, resources?)` creates a faction. `update_faction(faction_id, fields...)` mutates existing fields. `remove_faction(faction_id)` removes a faction and its clock. Factions persist with the Novel. Resources: `faction://<id>` and `factions://` — GM-filtered. Faction clocks update faction progress and are surfaced in `badge_briefing`. When a faction clock fills, the faction's status updates to the next goal and a new clock begins — surfaced as a `[WARNING]` in `spec_health`. Factions appear in `gm_context.active_threads` (REQ-232).

**REQ-2332 — Factions (Part 2).**
Faction clocks SHALL advance by one tick at scene transitions (REQ-125). *Coupling:* `create_faction` SHALL auto-create a `faction`-type countdown (REQ-073) for the faction's primary goal. `advance_countdown` on a faction-named clock SHALL update the faction's clock display.

**REQ-2333 — Factions (Part 3).**
When a relationship is set between a faction and an entity (REQ-236), the faction name SHALL be accepted as valid for either direction. *Acceptance criterion:* `create_faction("Merchant Guild", "Controls trade routes", goals=["Expand to East Dock"])` creates a faction with a `faction`-type clock; `faction://<id>` returns the faction with its current clock position. _Check:_ T269.
**REQ-233a1 — World reactivity (Part a1).**
autonomously advance the world state beyond faction clocks. FOR each NPC with `goals` whose last-known location differs from a goal-relevant entity's current scene, the engine SHALL check goal progress — success produces a campaign memory fact (REQ-310), failure produces a stalled-pursuit fact. WHEN a player action triggers a state change in a connected entity (relationship change, secret revelation, faction clock filling), the engine SHALL trace ripple effects through directly connected entities one hop.

**REQ-233a2 — World reactivity (Part a2).**
The GM SHALL see a World in Motion section in `badge_briefing` listing pending world changes with source, summary, and accept/modify/defer labels. Accept applies the change to canonical state. Modify raises a `[NEED_INPUT]` workflow. Defer suppresses the change (max 3 deferrals; fourth escalates to `[WARNING]` in `spec_health`). A setting `TTRPG_WORLD_REACTIVITY` (defaults to active) controls whether the reactivity cycle runs.

**REQ-233a3 — World reactivity (Part a3).**
When `off`, scene transitions advance faction clocks only (current behavior). *Acceptance criterion:* With `TTRPG_WORLD_REACTIVITY=on`, an NPC with `goals="Steal the crown"` produces a World in Motion entry at scene transition showing goal pursuit progress. A relationship change on entity A (`ally` → `rival` with entity B) produces a campaign memory fact on entity B. The GM accepts a proposed change — it appears in campaign memory. The GM defers a change — it re-appears at the next scene transition. _Check:_ T358.
**REQ-236a — Entity relationships (Part a).**
between entities, NPCs, and factions. `set_relationship(entity_a, entity_b, type, value?, description?)` sets a directed relationship. Relationship types: `ally`, `rival`, `neutral`, `mentor` and `dependent`, `suspicious`. `get_relationships(entity_id)` returns all relationships for an entity (both outgoing and incoming). Relationships SHALL appear on `character_sheet` output in a "Relationships" section. When an entity's relationship type changes between `ally` and `rival` (in either direction), the GM SHALL be prompted via `badge_briefing` to consider a lore entry.

**REQ-236b — Entity relationships (Part b).**
WHEN `set_relationship` changes a relationship type between non-neutral categories (`ally` ↔ `rival`, `ally` ↔ `suspicious`, `rival` ↔ `suspicious`, or any change to or from `neutral`), THE server SHALL inject an event marker into the `narrative_threads` section token: "Relationship changed: `<entity_a>` and `<entity_b>` are now `<type>`." The marker persists for the duration of the current scene and is removed on the next scene transition. Relationships persist with the Novel and SHALL be saved as part of `set_pause_context` (REQ-232).

**REQ-236c — Entity relationships (Part c).**
Faction identifiers are accepted as valid for either direction. *Acceptance criterion:* `set_relationship("pc_1", "npc_guard", "suspicious", value=3)` records a suspicious relationship; `get_relationships("pc_1")` includes the entry; `character_sheet("pc_1")` shows "Relationships: Guard (suspicious)." _Check:_ T270.
**REQ-237a — Session segmentation (Part a).**
`[session-boundary]` audit log marker entry when a new `TTRPG_SESSION_ID` value is detected on the first mutating tool call after a server start or Novel resume. The marker entry carries `session_id`, `started_at` (ISO 8601 timestamp of first mutating call), and `ended_at` (ISO 8601 timestamp of the previous session's last mutating entry, or null for the first session). The marker is a mutating entry for audit-chain purposes (REQ-040) but its output prefix is the marker identifier.

**REQ-237b1 — Session segmentation (Part b1).**
Markers SHALL be badge-filtered: the Player badge sees only session boundary timespans without the `session_id`; the Game Master sees the full marker entry. `session_recap` (REQ-072) SHALL accept an optional `session_id` parameter — when provided, the recap is scoped to the audit log range bounded by the matching `[session-boundary]` entry and the next marker. `spec_health` SHALL report a `sessions` array in Novel metadata with per-session objects containing `session_id`, `entry_count`, `timespan_start`, `timespan_end` and `combat_rounds`, `significant_roll_count`, and `scene_transitions`.

**REQ-237b2 — Session segmentation (Part b2).**
*Acceptance criterion:* After two sessions with different `TTRPG_SESSION_ID` values, the audit log contains two `[session-boundary]` entries; `session_recap(session_id="s1")` returns only entries from session s1; `spec_health` reports per-session metrics for both sessions. _Check:_ T275.
**REQ-073a1 — Clock types (Part a) (Part a1).**
selecting the clock's interaction model. `danger` (default) fills on consequences — full triggers danger. `racing` creates two opposed clocks, first to full wins. `linked` triggers an unlocked clock on completion, rendered as an indented chain tree. `tug_of_war` allows advancing and retreating ticks; `retreat_countdown` SHALL remove ticks without going below zero. `faction` advances one tick per scene transition for factions (REQ-233). `mission` auto-decrements one tick per `resume_novel`, reaching zero changes mission parameters. `link_countdown(parent_name, child_name)` creates a linked relationship between two existing clocks.

**REQ-073a2 — Clock types (Part a) (Part a2).**
The existing `type` parameter (`round`/`narrative`) controls tick timing — `clock_type` controls the clock's interaction model. Both parameters coexist: a clock may be `clock_type: "racing"` with `type: "round"`. *Acceptance criterion:* A `racing` clock pair with `opposes` resolves correctly; a `linked` clock chain triggers the child on parent completion; a `tug_of_war` clock retreated to zero does not trigger. _Check:_ T271.
**REQ-073b1 — Clock types (Part b) (Part b1).**
**REQ-072 session format.** `session_recap` SHALL accept an optional `format` parameter: `"markdown"` (default, current behavior) or `"lonelog"` — structured in Lonelog notation: `###` scene headers, `@` entity actions, `=>` narrative outcomes, `?` GM-decision equivalents, `d:` resolved mechanics. `compress_audit` SHALL accept the same `format` parameter to produce compressed entries in the requested notation.

**REQ-073b2 — Clock types (Part b) (Part b2).**
Each audit entry (REQ-040) SHALL gain an optional `notation` field storing the Lonelog representation alongside the raw audit data. *Acceptance criterion:* `session_recap(format="lonelog")` produces output in Lonelog notation; `compress_audit(format="lonelog")` produces compressed Lonelog entries; audit entries contain the `notation` field. _Check:_ T272.
**REQ-239a — Audit log compaction (Part a).**
`compact_audit_log(sessions?)` tool (Game Master only) that archives audit entries older than a configurable session window into per-session metadata summaries. The session window is configured via `TTRPG_AUDIT_RETENTION_SESSIONS` configurable) — sessions are identified by `[session-boundary]` markers (REQ-237). For each archived session, the compaction produces a summary containing: `session_id`, `timespan_start`, `timespan_end`, `entry_count`, `confrontations` (derived per REQ-175), `significant_rolls` (per REQ-174), `condition_changes`, `roster_changes`, and `scene_transitions`.

**REQ-239b — Audit log compaction (Part b).**
Summaries are stored in the Novel JSON under an `audit_archive` key; raw audit entries for archived sessions are removed from the `audit_log` array in the Novel JSON (REQ-040, hash chain is re-anchored at the first live entry after compaction — the chain is not broken, but entries after the compaction boundary form a new segment. `session_recap` (REQ-072) SHALL derive from live entries plus archive summaries when a `session_id` targets an archived session. Summarized sessions are retrievable via `audit://novel/archive` as structured objects.

**REQ-239c — Audit log compaction (Part c).**
Compaction is irreversible — confirmation proceeds through a `[NEED_INPUT]` workflow. Calling `compact_audit_log` with a `sessions` parameter (minimum 1) sets the number of recent sessions to retain as live; when omitted, the `TTRPG_AUDIT_RETENTION_SESSIONS` default is used. Sessions currently active (no `ended_at` marker) SHALL NOT be compacted.

**REQ-239d — Audit log compaction (Part d).**
Player badge attempts return `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* With `TTRPG_AUDIT_RETENTION_SESSIONS=1`, after two sessions, `compact_audit_log()` archives session 1 — audit log shows only session 2 entries, `audit://novel/archive` returns session 1 summary, `session_recap(session_id="s1")` returns the summary, session 2 entries remain live. A third call to `compact_audit_log(sessions=2)` retains both sessions 2 and 3. _Check:_ T277.
**REQ-241a — Checkpoints (Part a).**
active Novel: `set_checkpoint(label)` saves a named, persistent snapshot of the full Novel state (all property groups defined in §7.7, world-model tier, combat state, pending workflows, gm_context, metadata, audit log pointer, and undo stacks). `list_checkpoints()` returns all checkpoint labels with ISO 8601 timestamps. `restore_checkpoint(label)` reverts the Novel to the checkpoint state — emits a `[NEED_INPUT]` workflow decision with options `yes` and `cancel` (on `yes`: restores the snapshot and records a `[checkpoint-restored]` audit entry; on `cancel`: restores pre-invocation state unchanged). `remove_checkpoint(label)` removes one checkpoint.

**REQ-241b — Checkpoints (Part b).**
Checkpoints survive server restarts, Novel switches, and undo/redo cycles — they are independent of undo stacks (REQ-041). Maximum checkpoints per Novel is configured via `TTRPG_MAX_CHECKPOINTS`; when at capacity, `set_checkpoint` discards the oldest. Checkpoints SHALL be stored in the Novel JSON under a `checkpoints` key (array of `{label, timestamp, state}` objects). `end_novel` removes all checkpoints. Checkpoints are NOT included in `export_novel` output by default — an optional `include_checkpoints` parameter on `export_novel` (configurable) controls inclusion.

**REQ-241c — Checkpoints (Part c).**
All checkpoint tools are Game Master only. `spec_health` SHALL report checkpoint count and storage size. The snapshot SHALL use the same compression setting as the Novel (REQ-092). *Acceptance criterion:* `set_checkpoint("before the ritual")` creates a checkpoint; `list_checkpoints()` returns one entry with label and timestamp; after 5 mutations, `restore_checkpoint("before the ritual")` reverts all 5; `end_novel` removes the checkpoint; `export_novel("json", include_checkpoints= true)` includes the checkpoints key. _Check:_ T279.
**REQ-242a — Notes (Part a).**
entries each carrying a `badge_scope` of `game_master`, `player`, or `shared`. WHEN no scope is provided, THE system SHALL default to `game_master`. `set_note(key, content, badge_scope?)` creates or updates a note. `remove_note(key)` removes a note — the caller's badge must own the scope, or be Game Master. `list_notes()` returns note keys, content previews (first 100 characters), and badge_scope — badge-filtered. Notes are inert narrative context — they do not trigger lore matching, countdown hooks, or any mechanical effect.

**REQ-242b — Notes (Part b).**
Notes persist with the Novel, survive `revert_synthesis`, and are removed by `end_novel`. Notes SHALL be surfaced in `badge_briefing` under the `notes` section token — Game Master sees all scopes; Player sees `player` and `shared` scopes only. Notes SHALL be retrievable at `notes://<key>` as a badge-filtered resource. Notes SHALL be included in `export_novel` output under the `notes` key (mapping keys to `{content, badge_scope}` objects), in `clone_novel` (REQ-240) output, and in checkpoint snapshots (REQ-241).

**REQ-242c — Notes (Part c).**
This tier is the unstructured complement to REQ-232's structured `gm_context` — gm_context captures session-transition state with named fields; notes capture raw ideas, secrets-in-progress, and session jottings that do not fit gm_context's schema.

**REQ-242d — Notes (Part d).**
IF the Player badge calls `set_note` with scope `game_master`, `remove_note` on a `game_master`-scoped note, or attempts to access `game_master`-scoped content, THEN THE system SHALL return `[FORBIDDEN]`. *Acceptance criterion:* `set_note("betrayal", "The captain is the real villain")` stores the note with default `game_master` scope; `list_notes()` under Game Master badge returns the note with scope `game_master`; `notes://betrayal` returns full content; the Player badge sees no `game_master`-scoped notes in `badge_briefing`; `set_note("clue", "The key is in the clock", "player")` is visible to both Player and GM; after `end_novel`, all notes are cleared. _Check:_ T280.
**REQ-285a — Server notes (Part a).**
key-value freeform text entries that persist across Novels and survive server restarts. `set_server_note(key, content)` creates or updates a server note. `remove_server_note(key)` removes a server note. `list_server_notes()` returns all server note keys and a content preview (first 100 characters). Server notes are inert narrative context — they do not trigger any mechanical effect within Novels. Server notes persist to `.holonovel-state/server-notes.json` with atomic writes and backup rotation. Server notes survive `end_novel`, `revert_synthesis`, and server rebuilds.

**REQ-285b — Server notes (Part b).**
Server notes SHALL be surfaced in `spec_health` under a `server_notes` key (count). Server notes SHALL be retrievable at `server-notes://<key>` as a resource. Server notes SHALL NOT appear in `export_novel`, `clone_novel`, or checkpoint snapshots.

**REQ-285c — Server notes (Part c).**
WHEN the Player badge calls any server note tool, THE system SHALL return `[FORBIDDEN]`. *Acceptance criterion:* `set_server_note("campaign-bible", "The old gods were banished to the outer dark")` stores the note; server restart preserves it; `end_novel` preserves it; `server-notes://campaign-bible` returns full content; `list_server_notes()` returns the note; Player badge returns `[FORBIDDEN]`; `spec_health` reports the server note count. _Check:_ T334.
**REQ-321a — Codex (Part a).**
library for reusable content (NPCs, characters, scenes, encounters, lore entries, factions, countdowns, rooms, things, equipment templates, spell templates, relationship templates, voice profiles, adventures) that persists outside Novels and survives server restarts. The codex operates at the server level — it has no inherent badge context. The codex SHALL support content kinds: `npc`, `character`, `scene`, `encounter` and `lore_entry`, `faction`, `countdown`, `room` and `thing`, `equipment_template`, `spell_template`, `relationship_template` and `voice_profile`, `adventure`.

**REQ-321b — Codex (Part b).**
Every codex entry SHALL carry a `visibility` field — `library` (default, for world-building content) or `shared` (visible to both badges). `codex_set(kind, name, data, description?, tags?, visibility?)` SHALL create or update a codex entry with upsert semantics — the `data` parameter carries a kind-specific payload whose shape mirrors the corresponding Novel or roster tool parameters. `codex_import(id)` — where `id` is a string or an array of strings — SHALL materialize one or more codex entries into the active Novel.

**REQ-321c — Codex (Part c).**
An array SHALL be processed atomically: all entries applied as a single undo snapshot; partial failure reports the failed entry with its array index and cause, and the operation SHALL NOT produce side effects on novel state.

**REQ-321d — Codex (Part d).**
Materialization delegates to the existing tool for the entry's kind: `npc` → `create_npc`, `character` → `import_character`, `scene` → `set_scene_state`, `encounter` → `init_combat`, `lore_entry` → `set_lore_entry`, `faction` → `create_faction`, `countdown` → `set_countdown`, `room` → `create_room`, `thing` → `create_thing`, `equipment_template` → materialize equipment into the entity's inventory, `spell_template` → materialize a custom spell into the entity's known spells, `relationship_template` → apply the relationship set via `set_relationship` for each pair, `voice_profile` → apply via `set_voice_examples` and `set_personality`.

**REQ-321e — Codex (Part e).**
For kind `adventure`, `codex_import` SHALL materialize the adventure scaffold into the active Novel: populate world-model tier from the stored `## World` section data (rooms, things, exits per REQ-079), create NPCs from extracted NPC data, set factions from extracted faction data, create lore entries from extracted location descriptions, and activate synthesis linkages per REQ-229.

**REQ-321f — Codex (Part f).**
The adventure data payload for kind `adventure` SHALL carry: `title`, `slug`, `source` (one of `generated`, `loaded:<adventure_slug>`, `captured:<novel_slug>`), `premise`, `overview`, `hook`, `locations` (array of `{heading, flavor_text}`), `npc_suggestions` (array of `{name, description}`), `encounter_seeds` (array of free-text entries), `genre_tags` (array of strings), and `sections` (the full parsed adventure sections per REQ-079: `## World`, `## Premise`, `## Factions`, `## Scenes` `## NPCs`, `## Lore`, `## Seeds`). `codex_capture(kind, source_id)` SHALL pull an existing Novel artifact into the codex — the captured entry carries a `source_novel` field tracing its origin.

**REQ-321g — Codex (Part g).**
The captured entry SHALL default its `ruleset` field to the source Novel's ruleset scope (REQ-387). `codex_capture("adventure")` SHALL pull the active Novel's adventure content (loaded or generated) into the Codex as kind `adventure` with `source: captured:<novel_slug>`, carrying the full adventure data payload defined above. When the active Novel has no adventure content, `codex_capture("adventure")` SHALL return `[STATE_CONFLICT]` with corrective action `"No adventure content in the active Novel.

**REQ-321h — Codex (Part h).**
Load an adventure via load_adventure or generate one via generate_adventure."` `codex_list(kind?, tag?)` SHALL return a WHEN `codex_capture` is called with an `update_source` flag set to `true`, and the captured artifact originated from a prior `codex_import` (detected by the provenance field defined in REQ-332), THE system SHALL update the source Codex entry in-place rather than creating a separate entry.

**REQ-321i — Codex (Part i).**
When `update_source` is `true` but the artifact has no Codex provenance, the system SHALL return `[ERROR] [STATE_CONFLICT]` with corrective action directing the caller to omit `update_source`. `codex_list(kind?, tag?)` SHALL return a filterable list of codex entries with id, kind, name, description, tags, and visibility. `codex_list` SHALL be badge-filtered: when a badge is active, the Player badge sees only `shared`-visibility entries; the Game Master badge sees all entries.

**REQ-321j — Codex (Part j).**
Under the Editor badge, `codex_list` returns all entries unfiltered. `codex_info(id)` SHALL return the full record including the kind-specific data payload, badge-filtered by visibility. `codex_delete(id)` SHALL remove an entry with no confirmation gate — `undo` SHALL restore a deleted entry within the same connection.

**REQ-321k — Codex (Part k).**
Mutating codex operations (`codex_set`, `codex_capture`, `codex_delete`) SHALL require the Editor badge or Game Master badge; Player badge SHALL return `[FORBIDDEN]`. `codex_import` SHALL be badge-scoped: Player badge MAY import `shared`-visibility entries of kind `character`; the Game Master badge may import any entry regardless of visibility. Player badge import of any other kind SHALL return `[FORBIDDEN]`. Codex entries persist to `.holonovel-state/codex.json` with atomic writes and backup rotation. The codex SHALL survive `end_novel`, `revert_synthesis`, and server rebuilds.

**REQ-321l — Codex (Part l).**
Codex entries SHALL be surfaced in `spec_health` under a `codex` key (count partitioned by kind). The codex SHALL be retrievable at `codex://<id>` as a resource, badge-filtered by visibility. Codex entries SHALL NOT appear in `export_novel`, `clone_novel`, or checkpoint snapshots.

**REQ-321m1 — Codex (Part m1).**
Codex entries SHALL carry no mechanical effect within a Novel until explicitly imported via `codex_import`. `codex_import` and `codex_capture` SHALL return `[STATE_CONFLICT]` when no Novel is active.

**REQ-321m2 — Codex (Part m2).**
*Acceptance criterion:* `codex_set("npc", "Blacksmith", {description: "Gruff, scarred", ac: 14, hp: 35}, "The village blacksmith", ["blacksmith", "village"])` stores the entry with default visibility `library`; `codex_set("npc", "Blacksmith", ..., visibility="shared")` stores with `shared` visibility; server restart preserves entries; `end_novel` preserves them; `codex://blacksmith` returns full content; `codex_list("npc")` under Player badge returns only `shared` entries; `codex_list("npc")` under Game Master badge returns all entries; `codex_list("npc")` with the Editor badge returns all entries; Player badge `codex_set(...)` returns `[FORBIDDEN]`.

**REQ-321m3 — Codex (Part m3).**
*Acceptance criterion:* Game Master badge `codex_import("blacksmith")` into an active Novel creates the NPC; Player badge `codex_import("fighter-01")` of a `shared`-visibility `character` entry imports the character; Player badge `codex_import("blacksmith")` returns `[FORBIDDEN]`; `codex_import("my-adventure")` with kind `adventure` into an active Novel populates world-model, NPCs, factions, lore, and activates synthesis linkages; `codex_import(["blacksmith", "innkeeper", "guild-faction"])` imports three entries atomically; `codex_import(["blacksmith", "nonexistent"])` reports `nonexistent` at index 1 as `[NOT_FOUND]` and imports nothing.

**REQ-321m4 — Codex (Part m4).**
*Acceptance criterion:* `codex_capture("adventure")` from an active Novel with adventure content stores it in Codex with `source: captured:<slug>`; without adventure content returns `[STATE_CONFLICT]`; `codex_capture("npc", "blacksmith", update_source=true)` on a codex-sourced NPC updates the Codex entry in-place; `codex_capture("npc", "handcrafted-npc", update_source=true)` on an NPC with no codex_source returns `[STATE_CONFLICT]`; `spec_health` reports codex counts by kind. _Check:_ T366, T382, T383.
**REQ-332a — Codex provenance (Part a).**
entry, faction, countdown) is created via `codex_import`, THE artifact SHALL carry a `codex_source` field recording: the Codex entry ID, the import timestamp, and the Codex entry's `modified_at` value at the time of import. `codex_import` of an entry whose `codex_source` already references that Codex entry SHALL update the existing artifact in-place rather than creating a duplicate — fields present in the Codex entry SHALL overwrite corresponding Novel artifact fields; fields set only in the Novel (runtime state like HP, conditions, disposition) SHALL be preserved. `novel_info` SHALL report `codex_sources` — an array of `{id, kind, imported_at, codex_modified_at}` for every Codex-sourced artifact in the Novel.

**REQ-332b — Codex provenance (Part b).**
WHEN a Codex entry's `modified_at` timestamp is newer than the import timestamp recorded in the Novel artifact's `codex_source`, THE `spec_health` tool SHALL flag the artifact as `[codex-stale]` — the Codex template has been updated since import. `clone_novel` and checkpoint snapshots SHALL preserve `codex_source` fields on copied artifacts. *Acceptance criterion:* `codex_import("blacksmith")` creates NPC "Blacksmith" with `codex_source: {id: "blacksmith", imported_at: <ISO>, codex_modified_at: <ISO>}`.

**REQ-332c — Codex provenance (Part c).**
Updating the blacksmith Codex entry via `codex_set`, then calling `codex_import("blacksmith")` again updates the existing NPC (same entity ID) rather than creating a new one. `novel_info()` reports `codex_sources` including the blacksmith entry. After updating the Codex entry, `spec_health` reports `[codex-stale]` for the Novel's blacksmith NPC. _Check:_ T380, T384.

### 5.7 Determinism, Safety, and Performance

**REQ-050a — Determinism (Part a).**
via `TTRPG_SEED`. Any tool that performs a random draw — dice-roll tools, `init_combat` (danger initiative), `create_character` (stat generation), and any ruleset-derived tool that includes dice resolution — accepts an optional per-call seed. Same seed + same call sequence = same results across sessions and games. Seed conflict (a tool-call seed when a session seed is active) is a `[WARNING]` and the per-call seed wins for that draw.

**REQ-050b — Determinism (Part b).**
During a per-call seed override, the override uses an isolated draw that does not advance the session PRNG position — after the override completes, the next session-seeded draw produces the same result it would have produced had the override never occurred. The session seed persists across draws unless explicitly reseeded. When `TTRPG_SEED` is not set, the PRNG shall use a fixed default seed (0). The server logs the active seed at startup — `[info] PRNG seed: <value> (source: env|default)` — so operators can verify determinism.

**REQ-050c — Determinism (Part c).**
The acceptance criterion below — that `roll_save("dexterity", seed="42")` produces the same d20 face on two separate server restarts — extends to the unset case: two restarts without `TTRPG_SEED` shall produce identical event sequences for identical tool-call sequences. *Acceptance criterion:* `roll_save("dexterity", seed="42")` produces the same d20 face on two separate server restarts; a per-call seed does not advance the session PRNG position. _Check:_ G2, T27, T111.
**REQ-273a — Independent verification reproducibility tolerance (Part a).**
independent verifier (§10) compares its results to the builder's, seed-pinned dice rolls, status prefixes (`[OK]`, `[ERROR]`, `[WARNING]`, `[NEED_INPUT]`), exit codes, and tool names with parameter values SHALL match exactly. Natural-language prose (scene descriptions, NPC dialogue, lore content) is non-adversarial — a match is structural (non-empty and within ±20% word count). Counts (entity count, lore entry count, audit entry count) SHALL match within zero tolerance for exact-count fields and ±1 for open-ended fields. A comparison that satisfies all applicable tolerance rules is a match.

**REQ-273b — Independent verification reproducibility tolerance (Part b).**
Any violation of exact-match rules (dice, status, exit codes, tool/param) is a Discrepancy. Any violation of prose tolerance is Unclassifiable (operator's call). Any count violation is Pin drift unless exact-match rules also fail. _Check:_ T293.
**REQ-274 — Independent verifier confidence score.** The independent verifier
(§10) SHALL produce an overall confidence score between 0 and 1 across all
compared workflows. Each Discrepancy contributes weight 0, each Pin drift weight
0.2 (conditional on operator confirmation), each Structural match under REQ-273
tolerance weight 1.0, and each Exact match weight 1.0. Score = sum(weights) /
total_comparisons. A score below 0.80 is FAIL; 0.80–0.95 is PARTIAL with
enumerated reservations; above 0.95 is PASS. The score and per-workflow component
weights are recorded in the verifier's evidence.
_Check:_ T294.

**REQ-213a — Weighted table result mapping (Part a).**
dice-range-to-result mapping, `roll_on_table` SHALL roll the specified dice expression, match the result against the defined ranges, and return the matched result row. The output SHALL include: (a) the dice notation (e.g., `d100`), (b) the individual die face rolled, and (c) the matched range with its result text. When a roll falls outside all defined ranges, the tool SHALL return `[WARNING]` with the raw roll and a "no range matched" message — the tool SHALL NOT silently return a bare number.

**REQ-213b — Weighted table result mapping (Part b).**
A generation table entry defines: `dice_expression` (e.g., `1d100`, `1d8`), a list of `ranges` (each with `min`, `max`, `result`), and an optional `badge_scope` (`game_master` or `shared`, default `shared`).

**REQ-213c — Weighted table result mapping (Part c).**
A generation table SHALL NOT interleave dice-range rows with static lookup rows — tables are classified as either generation or lookup at extraction; a table containing any dice-range row is a generation table. *Acceptance criterion:* `roll_on_table(table="wand_of_wonder", seed="42")` produces the same result row on two separate server restarts, with output including dice notation, individual die face, matched range, and result text. _Check:_ T254.
**REQ-291a — Oracle tool (Part a).**
The server provides an `ask_oracle` tool (accepting a free-text `question` and an optional per-call `seed`) for uncertainty resolution. The tool accepts a `likelihood` value — `almost_certain` (d100 ≥ 11), `likely` (d100 ≥ 26), `50_50` (d100 ≥ 51), `unlikely` (d100 ≥ 76), or `small_chance` (d100 ≥ 91) — the Ask-the-Oracle ladder, defaulting to `50_50` when omitted. It draws from the PRNG (REQ-050) and returns one of `[YES]`, `[NO]`, `[EXCEPTIONAL_YES]`, or `[EXCEPTIONAL_NO]`. Doubles on the d100 (11, 22, 33, ..., 99) produce an exceptional result — an `EXCEPTIONAL_YES` or `EXCEPTIONAL_NO` — which signals a stronger, more intense version of the answer. The `question` parameter is recorded in the audit log; the draw is deterministic and seedable.

**REQ-291b — Oracle tool (Part b).**
The oracle is positioned as an uncertainty-resolution aid for both badges — it resolves an outcome when the caller cannot determine what happens next, and SHALL NOT replace the AI narrator's judgment. The Player badge SHALL be permitted to call `ask_oracle`; in solo play the human Player consults the oracle directly, and the AI Game Master remains the interpreter of the result.

**REQ-291c — Oracle tool (Part c).**
The oracle has no briefing presence — it is callable on demand only and fades into the background per §5.10. `help("ask_oracle")` SHALL return usage examples, parameter contracts, and common workflows. `suggest_actions("I don't know what's behind the door")` SHALL map to `ask_oracle`. *Acceptance criterion:* `ask_oracle("Is there a guard behind the door?", "50_50", seed="42")` returns `[YES]`, `[NO]`, `[EXCEPTIONAL_YES]`, or `[EXCEPTIONAL_NO]`. Same seed + same call sequence produces the same result across restarts. Likelihood "almost_certain" returns `[YES]` or `[EXCEPTIONAL_YES]` on most draws; omitted likelihood defaults to `50_50`.

**REQ-291d — Oracle tool (Part d).**
The oracle is callable by Player and Game Master badges; no badge SHALL be blocked from consulting it. *Acceptance criterion:* `ask_oracle` succeeds under the Player badge and under the Game Master badge. _Check:_ T481.
**REQ-157a — Combat determinism (Part a).**
same PRNG as all other random draws (REQ-050). `init_combat` accepts an optional per-call seed. When a per-call seed is provided, every danger initiative roll within that combat session uses an isolated draw that does not advance the session PRNG position — after the override completes, the next session-seeded draw matches the sequence it would have produced without the override.

**REQ-157b — Combat determinism (Part b).**
When no per-call seed is provided, danger initiative draws advance the session PRNG position normally. *Acceptance criterion:* `init_combat(participants=[], dangers=[{name:"goblin"}], seed="42")` produces the same danger initiative value on two separate server restarts; the d20 face matches the Appendix B.4 seed-42 column at the appropriate offset. _Check:_ T192.
**REQ-051 — No runtime network access.** The server makes no outbound network requests
after startup. All ruleset content, prompts, and tool implementations run entirely
locally.
*Acceptance criterion:* Disconnecting the network before a lookup tool call
produces the same result as when connected — zero outbound requests appear
in network monitoring.
_Check:_ Appendix D; G4.

**REQ-052 — Path containment.** The server reads files only from the configured ruleset
directory, its own installation directory, and the state directory. Path-traversal and
malformed input are rejected.
*Acceptance criterion:* A tool call with `../../etc/passwd` as a path parameter
returns `[ERROR] [INVALID_INPUT]` without reading any file outside the configured
directories.
_Check:_ T20.
Performance benchmarks are governed by REQ-100 below.

**REQ-251a — Generation intent guard (Part a).**
and `generate_encounter` SHALL assess the premise or context string for direct and implied harm, power-inversion requests ("create an adversary capable of defeating <specific entity>"), and content that exceeds the ruleset's mechanical ceiling. Any request whose resolution would require the server to fabricate mechanics, void the ruleset's stated constraints, or generate content likely to violate participant consent SHALL return `[WARNING]` describing the concern and requesting clarification or modification — the server SHALL NOT silently comply.

**REQ-251b — Generation intent guard (Part b).**
The assessment SHALL operate on the input string without generating output first — compliance is checked before resources are consumed. The operator MAY override the guard by prefixing the premise with `!force` — the override SHALL be recorded in the audit log with a `[generation-guard-overridden]` entry. A GM-only advisory SHALL appear in `badge_briefing` when a generation guard fired in the current session, listing the premise and the concern.

**REQ-251c — Generation intent guard (Part c).**
When the ruleset defines a difficulty system (challenge rating, threat levels), `generate_encounter` SHALL cap generated danger power against the party's existing entity levels — exceeding the cap produces `[WARNING]` with the cap value. *Acceptance criterion:* `generate_adventure("create an adversary capable of defeating Data")` returns `[WARNING]` listing the guard concern; `generate_adventure("!force create an adversary capable of defeating Data")` proceeds with the generation and records a `[generation-guard-overridden]` audit entry.

**REQ-251d — Generation intent guard (Part d).**
A ruleset that defines challenge rating caps generated encounters against party level and warns on exceedance. _Check:_ T311.
**REQ-100a — Performance benchmark (Part a).**
representative query latency for the target ruleset. Measurements are recorded in DECISIONS.md (4) with the measurement environment (OS, CPU, memory, runtime version). Cold-start timing: launch server, call `spec_health`, measure wall-clock time from process start to response. Query latency is the mean of 5 representative lookups. `spec_health` reports the most recent measurement.

**REQ-100b — Performance benchmark (Part b).**
Tiers: Light (<100 indexed items) ≤2 s cold start; Standard (100–500) ≤5 s; Heavy (500–2000) ≤10 s; Huge (2000+) ≤20 s. *Acceptance criterion:* DECISIONS.md (4) records cold-start time and mean query latency for 5 representative lookups; `spec_health` reports the most recent measurement. _Check:_ T87. The five representative lookups are one canonical call per lookup category registered on the server: `lookup_spell`, `lookup_equipment`, `lookup_monster`, `lookup_class`, and `search_rules`.

**REQ-100c — Performance benchmark (Part c).**
If fewer than five lookup categories exist, the builder measures all available categories and notes the count in DECISIONS.md (4). The indexed-item count used for tier classification is the value reported by `spec_health.search_index` (the heading count in the loaded search index).

**REQ-100d — Performance benchmark (Part d).**
For servers where `spec_health` reports no `search_index` field, the builder counts extracted items in RULESET_MODEL.md and records the count and method in DECISIONS.md (4). *Acceptance criterion (added):* The five lookup calls are one per registered lookup category; DECISIONS.md (4) records which categories were measured and their individual latencies. _Check:_ T87.

**REQ-410 — Token footprint in performance record.**
The performance record of REQ-100 SHALL additionally capture the token footprint: the
aggregate byte size of the default tool listing (REQ-392) and the prompt-budget consumption
(REQ-118) under the measured tier, so token efficiency is a recorded, gated attribute rather
than an aspiration. Measurements SHALL sit in DECISIONS.md (4) beside cold-start and latency
figures and be reported by `spec_health` as the most recent measurement; a missing footprint
record is a handoff defect.
*Acceptance criterion:* DECISIONS.md (4) records listing bytes and prompt-budget consumption
alongside latency; `spec_health` reports them; a build without the record fails handoff.
_Check:_ T479.

**REQ-416 — Config default inheritance.**
Configuration SHALL support a defaults section whose values are inherited by any entry
that does not override them, so a shared value is declared once rather than repeated per
entry. A value absent from both an entry and the defaults section SHALL resolve to the
documented built-in. The defaults section SHALL be rendered in `spec_health` and grouped
according to the operator-facing tiers of §7.6. Inheritance SHALL NOT alter the behavior
of an entry that declares its own value.
*Acceptance criterion:* a value declared in the defaults section is inherited by entries
that omit it; an entry with its own value is unaffected; `spec_health` renders the
defaults grouped by tier. _Check:_ T489.

**REQ-417 — Non-blocking startup probes.**
Server startup SHALL NOT be delayed awaiting slow health or status probes; the server
SHALL accept calls once its state is initialized, with any slow probe completing in the
background. A probe that has not finished SHALL be reported as pending in `spec_health`,
distinct from a completed result, and a background probe SHALL NOT block or reorder tool
calls.
*Acceptance criterion:* a server with a slow probe is callable before the probe
completes; `spec_health` reports the probe pending then completed; tool calls proceed
normally during the probe. _Check:_ T490.
**REQ-253a — Tool-output verbosity control (Part a).**
a `terse` mode that returns the minimum mechanical content needed to resolve the rules question — no narrative framing, no extended context, no auxiliary information. The `terse` mode SHALL return: for `lookup_spell`, the spell name, level, casting time, range, duration, and damage/effect die — omitting verbal/somatic/material components and full spell description; for `search_rules`, the most relevant sentence or paragraph only — omitting surrounding context; for combat advance, the participant name, action taken (or `[auto]`), and resulting state changes — omitting full roll transparency.

**REQ-253b — Tool-output verbosity control (Part b).**
The default mode is `normal` (balanced per REQ-197c): full entry content for lookups and single-entry reads (REQ-060), full roll transparency in combat (REQ-003), and summary entries for enumerations (REQ-409). `terse` mode is selectable via: (a) the `detail=terse` player signal (REQ-197) which applies to all subsequent tool output; (b) a per-call `terse: true` parameter on individual tool invocations. `rich` mode is selectable via the `detail=rich` signal. The per-call parameter overrides the session-scoped signal for that call. `spec_health` SHALL report the active verbosity mode.

**REQ-253c — Tool-output verbosity control (Part c).**
The mode is session-scoped — discarded on connection close. *Acceptance criterion:* `lookup_spell("fireball", terse=true)` returns the spell name, level, and damage die without the full spell description. `search_rules("grapple", terse=true)` returns the most relevant sentence only. `advance_combat` under `detail=terse` returns participant name + `[auto]` + resulting HP/condition changes without full roll breakdown. _Check:_ T313.

**REQ-409 — Response-lean enumeration reads.**
Collection and listing tools SHALL return summary entries by default and expose a detail
request path for full entries, so a caller enumerating a set pays for full records only on
demand. The lean default applies to enumeration tools only — it SHALL NOT reduce the
verbose full-entry contract of REQ-060 for lookups, rolls, or single-entry reads. A detail
request SHALL require no intervening state mutation, and `spec_health` SHALL report the
active enumeration verbosity.
*Acceptance criterion:* A collection read returns summary entries by default; requesting
detail returns full entries; a lookup under the default still returns the full REQ-060
entry; `spec_health` reports the enumeration mode. _Check:_ T478.
**REQ-054 — Input safety.** All tool inputs are validated server-side. Adversarial
free-text is stored and echoed verbatim as inert data in all surfaces, with no behavior
change. The server trusts nothing client-supplied.
*Acceptance criterion:* `set_scene_state("'); DROP TABLE novels;--")` stores
and echoes the string verbatim; no SQL execution, no behavior change, no crash.
_Check:_ T20, T42.

**REQ-055 — Durability.** Novel state survives connection restarts: entities,
HP, conditions, slots, turn order, audit logs, and RNG state persist. The roster
is permanent and immutable at baseline. `import_character` copies a roster entry
into a Novel. `end_novel` discards the Novel; the roster survives. Resuming an
ended Novel fails with `[ERROR] [STATE_CONFLICT]`.
*Acceptance criterion:* Server restart restores entities, HP, conditions, and
RNG state; `resume_novel("ended-novel")` returns `[STATE_CONFLICT]`.
_Check:_ T9, T31, T108.

**REQ-055a — Badge precedence on resume.** WHEN a Novel is resumed or switched
to, the Novel's persisted badge state takes precedence over `TTRPG_BADGE`.
`TTRPG_BADGE` sets the initial active badge ONLY WHEN the starting Novel has no
persisted badge state — either because the Novel is newly created, or because no
badge was activated during a prior session.
*Acceptance criterion:* Create Novel with Player badge, end connection, resume —
badge is Player, not `TTRPG_BADGE` value.
_Check:_ T108.

**REQ-055b — Story-in-progress notice.** WHEN `resume_novel` restores a Novel
with an active badge, THE server SHALL include a notice identifying the active
badge so the operator knows they have resumed an active story rather than entered
the Editor badge.
*Acceptance criterion:* Resume a Novel with Player badge active — the server
responds with a notice identifying "Player badge active."
_Check:_ T108.
*Out of scope:* hardware-level RNG, cryptographic security guarantees, formal
verification of input safety, and performance under adversarial load beyond the tier
benchmarks defined in REQ-100.

**REQ-3121 — Pre-narration validation gate (Part 1).**
narration implying a mechanical outcome, THE engine SHALL validate the proposal against ruleset constraints per REQ-312a/312b/312c before the narration reaches the player. Invalid proposals SHALL produce a `[REJECTED]` corrective suggestion behind the server interface. The setting `TTRPG_NARRATION_VALIDATION` controls the gate; `spec_health` SHALL report `narration_validation` status and `narration_rejection_count`.

**REQ-3122 — Pre-narration validation gate (Part 2).**
Validation activates only when a state-mutating tool call is preceded by AI narration. *Acceptance criterion:* With `TTRPG_NARRATION_VALIDATION=on`, narration claiming a dead NPC speaks is rejected with a corrective suggestion and increments `narration_rejection_count`. With `TTRPG_NARRATION_VALIDATION=off`, same narration passes through. _Check:_ T357.
**REQ-312a — Bounds conformance.** Mechanical claims SHALL NOT exceed
ruleset-defined maxima. A narration claiming a spell deals damage exceeding
the ruleset maximum SHALL be rejected with a corrective naming the limit.
*Acceptance criterion:* Narration claiming 12d6 Fireball (SRD max 8d6 at
3rd level) is rejected.
_Check:_ T357.

**REQ-312b — Permission conformance.** Mechanical claims SHALL NOT assert
outcomes requiring capabilities the entity does not possess. A narration claiming
an action requiring a class feature, spell slot, equipment, or feat the entity
lacks SHALL be rejected.
*Acceptance criterion:* Narration claiming a Fighter casts a spell they do not
know is rejected.
_Check:_ T357.

**REQ-312c — State conformance.** Mechanical claims SHALL NOT contradict current
Novel state. A narration claiming a dead NPC acts or applying a condition already
active SHALL be rejected.
*Acceptance criterion:* Narration claiming a deceased NPC speaks is rejected.
_Check:_ T357.
*Out of scope:* Validation of narrative style, tone, or prose quality — these are AI
judgment, not mechanical integrity.

### 5.8 Synthesis, Lore, and Macros

**REQ-2461 — Story journal (Part 1).**
Master only. `record_story(type, entry)` records a narrative memory; `update_story(index, entry?, type?)` edits by index; `remove_story(index)` deletes; `list_stories(filter?, offset?, limit?)` returns paginated entries. `type` SHALL be one of `decision`, `moment`, `revelation`, `bond`, or `consequence`. Entries SHALL record scene anchor, entity IDs, and timestamp. Editing `decision` or `consequence` entries SHALL return `[RULE_VIOLATION]`. Entries are Novel-scoped, discarded by `end_novel`. Undo SHALL NOT reverse story journal entries.

**REQ-2462 — Story journal (Part 2).**
Growth is bounded by `TTRPG_MAX_STORY_ENTRIES`. *Acceptance criterion:* Record, list, update, and remove operations work as described; editing a decision returns `[RULE_VIOLATION]`; undo does not reverse entries; Player badge returns `[FORBIDDEN]`. _Check:_ T282.
**REQ-246a — Story journal surfacing.** Story journal entries SHALL surface
in `session_recap` (paginated), `badge_briefing` (badge-filtered by entity
overlap and scene match, configurable via `TTRPG_STORY_JOURNAL_DISPLAY`),
`export_novel` output, and `clone_novel` as a copied array. `spec_health`
SHALL report `story_journal_count_by_type` and warn at 80% of
`TTRPG_MAX_STORY_ENTRIES`.
*Acceptance criterion:* Entries appear in all four surfaces; `spec_health`
reports per-type counts.
_Check:_ T282.

**REQ-331a — Story journal-world coupling (Part a).**
optional `room_id` field. When `record_story` is called during a scene that is coupled to a world-model room (REQ-326), `room_id` SHALL auto-populate with the room's ID. Entries with `room_id` SHALL annotate their `scene_anchor` with the room's name — surfaced in `list_stories` and `export_novel` output. `session_recap` `narrative_orientation` SHALL include room names for entries that carry them. `badge_briefing` `story` section entries SHALL include room context when available. The `room_id` field is optional — entries in non-room-coupled scenes or scenes with unmatched locations SHALL carry no `room_id`.

**REQ-331b — Story journal-world coupling (Part b).**
Backward compatible: existing story journal entries without `room_id` are valid. *Acceptance criterion:* `record_story("moment", "Discovered the hidden passage")` with scene coupled to world-model room "Library" — entry auto-populates `room_id: "library"` and `scene_anchor` includes "Library". Same call with unmatched location — `room_id` absent. _Check:_ T375, T378.
**REQ-333a — Story journal to lore promotion (Part a).**
`promote_story_to_lore(index, key?)` tool — Game Master only. Accepts a story journal entry index of type `revelation` or `moment` and creates a lore entry whose key SHALL be either the explicit `key` parameter (when provided) or a slug derived from the first sentence of the journal entry. The lore entry's content SHALL be the journal entry text; its triggers SHALL be derived from entity and location names mentioned in the entry. The journal entry is unchanged — promotion is non-destructive.

**REQ-333b — Story journal to lore promotion (Part b).**
Promoting a `decision` or `consequence` type entry SHALL return `[ERROR] [RULE_VIOLATION]` — decisions and consequences are immutable. When a lore entry already exists at the target key, the system SHALL return `[STATE_CONFLICT]` with corrective action suggesting a `key` parameter to disambiguate. The created lore entry carries a `source` field citing the story journal index as `story_journal:<index>`.

**REQ-333c — Story journal to lore promotion (Part c).**
Player badge returns `[FORBIDDEN]`. *Acceptance criterion:* `record_story("revelation", "The old well leads to the undercity")` then `promote_story_to_lore(0)` creates lore entry `the-old-well-leads-to-the-undercity` with `source: story_journal:0`. `promote_story_to_lore(0, key="well-undercity-link")` uses the explicit key (succeeds only if that key is not already taken). Promoting a `decision` entry returns `[RULE_VIOLATION]`. Player badge returns `[FORBIDDEN]`. _Check:_ T380.
**REQ-310a — Campaign Memory (Part a).**
memory — a per-entity fact store derived automatically from state-changing tool calls, surviving process restart and full rebuild. Facts are recorded by the engine, not the AI, and SHALL be stored in the Novel JSON per REQ-092. The campaign memory tracks per-NPC facts (combat participation, scene presence, relationship changes, personality updates), per-thread facts (faction clock advances, narrative countdowns, orphaned decisions, active vows), and per-location facts (notable events and NPC presence at locations).

**REQ-310b — Campaign Memory (Part b).**
WHEN `badge_briefing` composes GM-oriented content, THE engine SHALL inject campaign memory facts under a `## Campaign Memory` section. This section is a decision-critical group (REQ-109) ordered after scene state and before entities. Facts SHALL be prioritized by relevance to the current scene: (a) NPCs present in the scene, (b) NPCs with relationships to present entities, (c) active thread facts involving present entities, (d) location facts for the current scene, (e) recency (most recent first). The section SHALL render at most 10 facts, ordered by priority.

**REQ-310c — Campaign Memory (Part c).**
Campaign memory facts SHALL NOT introduce new mutating tools — they are a surfacing layer over existing state. `spec_health` SHALL report `campaign_memory` with per-category counts (`npcs`, `threads`, `locations`) and a total. `export_novel` SHALL include `campaign_memory` in its payload. Campaign memory facts rendered in `badge_briefing` under the Player badge SHALL be presence-scoped: a fact is visible to the Player badge only when the active entity was present in the scene where the fact was recorded as determined by `characters_present` (REQ-307). The Game Master badge sees all facts (current behavior).

**REQ-310d — Campaign Memory (Part d).**
Facts from scenes the entity attended are retained regardless of current presence — presence scoping gates visibility, not storage. Every campaign memory fact SHALL carry a `badge_scope` field — `gm` (default, for GM-authored or engine-derived facts that should remain GM-visible only), `shared` (visible to both badges. When presence-scoped), or `discovered` (visible to both badges. tagged as player-discovered).

**REQ-310e — Campaign Memory (Part e).**
Under the Player badge, campaign memory visibility compounds two filters: a fact is visible only when (a) the active entity was present for the scene where the fact was recorded (presence scoping), AND (b) the fact's `badge_scope` is `shared` or `discovered`. The Game Master badge sees all facts regardless of `badge_scope`.

**REQ-310f — Campaign Memory (Part f).**
Facts created by the engine default to `gm`; the GM may override scope via `set_lore_entry` (REQ-083) for facts that also correspond to lore entries. `discovered`-scope facts carry a `[discovered]` tag in `badge_briefing` distinct from the standard rendering. *Acceptance criterion:* After a session with two NPCs (each appearing in a scene and combat), three scene changes, one faction clock advancement, and one story journal decision, `spec_health` reports `campaign_memory.npcs ≥ 2`, `campaign_memory.threads ≥ 1`, `campaign_memory.locations ≥ 1`. `badge_briefing` includes `## Campaign Memory` with facts prioritized by scene relevance.

**REQ-310g — Campaign Memory (Part g).**
Facts survive Novel persistence and are present in `export_novel("json")`. _Check:_ T355.
**REQ-080a — Synthesis boundaries (Part a).**
with a unified storage model, separate from Ruleset Wisdom. External synthesis (optionally run post-build per §11.1) stores items in full within the Novel JSON under a `synthesis` key, tagged `[supplementary]` with source URLs. Internal synthesis (generated at runtime per §11.2) stores items in the same `synthesis` key, tagged `[supplementary]` with `novel://` source URIs.

**REQ-080b — Synthesis boundaries (Part b).**
Player-authored synthesis (created at runtime via `player_synthesize` per REQ-261) stores items in full within the Novel JSON under a `player_synthesis` key, tagged `[player]`, active immediately in player-facing modules, with a per-module cap of 15 items and default badge scope `shared`. Ruleset Wisdom (`[ruleset]` and `[vendor]`-tagged items) is build output — always present in the Novel, not subject to synthesis reversion. On Novel startup, Ruleset Wisdom activation keys resolve against the build's current Wisdom extraction. Keys that match stay active with the latest extracted content.

**REQ-080c — Synthesis boundaries (Part c).**
Vanished keys — those whose anchors no longer resolve — silently drop and are reported in `spec_health` as `[wisdom-gap]` entries. New Wisdom items discovered in the current extraction but not present in the activation keys start inactive. When a ruleset rebuild occurs, fresh extraction replaces the build output directory; the same key resolution logic applies on next Novel startup. Synthesis items never replace Ruleset Wisdom items. Player items never replace Ruleset Wisdom or synthesis items — the three source categories coexist. The GM activates synthesis items via `activate_synthesis_item`.

**REQ-080d — Synthesis boundaries (Part d).**
Player items are active immediately upon creation; the player may deactivate their own items via `deactivate_synthesis_item` (REQ-260). Synthesis may ADD content to entity voice_examples (REQ-077), prompt ordering recommendations (REQ-082), lore templates (REQ-083), action suggestion patterns (REQ-084, REQ-115), adventure advice (REQ-090, §11), narrative voice profiles (REQ-226), and supplementary guidance. Synthesis MUST NOT modify mechanical fields (stats, saves, HP, conditions, combat state), build-derived tool registrations, badge gating rules, or any Ruleset Wisdom content.

**REQ-080e — Synthesis boundaries (Part e).**
Synthesis recommendations for prompt ordering, lore templates, and adventure advice are inert — they never auto-apply; the GM must explicitly activate them via the corresponding tools. External synthesis items that have never been activated and whose `collected_at` timestamp exceeds `TTRPG_SYNTHESIS_STALE_DAYS` are flagged as `[stale]` in `spec_health` and excluded from synthesis resource surfaces. Ruleset Wisdom items do not carry staleness flags — they are canonical. Stale items are retained on disk and reactivate if the GM explicitly activates them.

**REQ-080f — Synthesis boundaries (Part f).**
Re-running synthesis refreshes timestamps for all external items. Every external synthesis finding carries source_url, quoted_excerpt, badge_scope, confidence (derived from source authority, not mechanical completeness), output_module, and collected_at (ISO 8601 timestamp of collection) — all non-empty. Ruleset Wisdom items carry source anchor, confidence, output_module, and `[ruleset]` or `[vendor]` tag.

**REQ-080g1 — Synthesis boundaries (Part g1).**
Reverting synthesis (REQ-103) removes all synthesis items; Ruleset Wisdom and player items persist.

**REQ-080g2 — Synthesis boundaries (Part g2).**
*Acceptance criterion:* Synthesis-sourced voice_examples carry `[supplementary]` tag and source URL; Ruleset Wisdom items carry `[ruleset]` or `[vendor]` tag and source anchor; player-authored items carry `[player]` tag and appear in both Player and GM `badge_briefing` by default; a stale synthesis item (past `TTRPG_SYNTHESIS_STALE_DAYS`) is flagged `[stale]` in `spec_health` and excluded from surfaces; `revert_synthesis` removes synthesis items but preserves Ruleset Wisdom and player items; a Ruleset Wisdom activation key that no longer resolves against the build's current extraction appears as a `[wisdom-gap]` entry in `spec_health`; new Wisdom items in the current extraction with no matching activation key start inactive. _Check:_ T63, T95, T97, T125.
**REQ-081a — Narrative directive (Part a).**
the `narrative_directive` parameter on `set_scene_state`. Each directive has a `label` (non-empty, unique within a Novel) and an `instruction` (free-text). Setting a duplicate label replaces the prior entry. An empty array clears all directives. For backward compatibility, `set_narrative_directive` also accepts a single `directive` string — treated as `[{"label": "primary", "instruction": <string>}]`. Directives appear in `badge_briefing` for the Game Master badge only and at `novel://current`, grouped under "Narrative Directives" with their labels.

**REQ-081b — Narrative directive (Part b).**
The directive text SHALL be resolved against the Holodeck behavioral dimension catalog at resolution time. Directives whose instruction text matches a catalog keyword — pacing keywords ("faster," "slower," "brisk," "leisurely"), autonomy keywords ("NPCs act independently," "characters drive themselves"), reactivity keywords ("the world reacts," "living world," "active factions"), or synthesis keywords ("use voice patterns," "activate lore templates," "use action patterns," "add flavor") — SHALL mechanically couple to the corresponding behavioral configuration per the coupling rows in §7.7.1a (P44–P47).

**REQ-081c — Narrative directive (Part c).**
Directives that match no catalog dimension SHALL be stored as inert guidance. Catalog keyword matching SHALL be case-insensitive substring matching. The catalog is closed — only the four named dimensions (pacing, autonomy, reactivity, synthesis) produce mechanical effects. They persist with the Novel.

**REQ-081d — Narrative directive (Part d).**
Player badge attempts return `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* The `narrative_directive` parameter on `set_scene_state` with `[{label: "mood", instruction: "dark and brooding"}, {label: "pacing", instruction: "slow burn"}]` produces two entries in `badge_briefing` under the GM badge; a duplicate "mood" label replaces the prior; an empty array clears all directives. _Check:_ T64, T134, T450.
**REQ-082a — Prompt section ordering (Part a).**
`badge_briefing` via `set_briefing_order(sections)`. The tool accepts an ordered array of section tokens. Unknown tokens return `[ERROR] [INVALID_INPUT]` with valid tokens enumerated. An empty array resets to the builder-determined default. Section tokens control both ordering and inclusion — a token present in the array causes its corresponding group to render (or render as an empty section if the group has no content); a token absent from the array causes its group to be omitted entirely from `badge_briefing`.

**REQ-082b — Prompt section ordering (Part b).**
The builder default ordering includes all groups and SHALL follow the placement contract of `TTRPG_WORLD_PROMINENCE` (REQ-309) — world-model state is decision-critical at `prominent`, a dedicated section at `visible`, or folded into scene state at `secondary`. The builder SHALL document the complete section-token-to-group mapping and the default ordering in DECISIONS.md, so the valid token set and default section ordering are auditable at build verification time without invoking the running server. The mapping SHALL cite the REQ-109 group each token corresponds to.

**REQ-082c — Prompt section ordering (Part c).**
Tokens whose corresponding sections are absent from the current ruleset produce empty sections (no error). Synthesis may record an ordering recommendation visible in `spec_health`, but never auto-applies. The ordering persists with the Novel. Player badge attempts return `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* `set_briefing_order(["scene", "entities", "lore"])` reorders `badge_briefing`; `set_briefing_order([])` resets to builder defaults; an unknown token returns `[ERROR] [INVALID_INPUT]` with valid tokens enumerated. _Check:_ T66.
**REQ-185a — Section token vocabulary (Part a).**
validated section token to each REQ-109 group that has a runtime representation in `badge_briefing`. Token names SHALL be lowercase snake_case identifiers corresponding to the REQ-109 group (e.g., `entities` for the active entities group, `combat_state` for the active combat state group). The complete token-to-group mapping SHALL be documented in DECISIONS.md per REQ-082. The mapping SHALL be stable across builds — tokens do not change when the ruleset changes unless a REQ-109 group is added or removed.

**REQ-185b — Section token vocabulary (Part b).**
When a REQ-109 group has no runtime representation (e.g., ruleset lacks the construct), the builder SHALL still assign a token that produces an empty section. The builder SHALL also assign tokens for world-model briefing sections: `world_state` (current room context from the world model, including room name, exits, and contained visible things — rendered when world-model tier is populated) and `room_detail` (room description and examination-level detail — rendered as a dedicated section at `visible` and `prominent` prominence levels, folded into scene state at `secondary`).

**REQ-185c — Section token vocabulary (Part c).**
The valid token set is the authoritative vocabulary for `set_briefing_order` and synthesis briefing_order recommendations. *Acceptance criterion:* Building for D&D 5e produces a DECISIONS.md table mapping every REQ-109 group name to a snake_case token. Building for the Appendix B fixture (which lacks combat, countdowns, lore, and adventures) produces a subset mapping — the token set shrinks but token names for shared groups are identical. _Check:_ T300.
**REQ-186a — Section token discoverability (Part a).**
be discoverable without triggering an error. `spec_health` SHALL include a `section_tokens` field listing every valid token with its corresponding REQ-109 group name and whether the group currently has runtime content in the active Novel. The `help` tool, when queried with `"briefing"` or `"section ordering"`, SHALL enumerate the valid token set.

**REQ-186b — Section token discoverability (Part b).**
The `[INVALID_INPUT]` error from `set_briefing_order` (REQ-082) SHALL continue to enumerate valid tokens for the immediate caller, but callers are not required to probe via error to find valid tokens. *Acceptance criterion:* `spec_health` returns a `section_tokens` array with token, group, and has_content fields. `set_briefing_order` with an unknown token returns `[INVALID_INPUT]` with valid tokens enumerated — and the enumerated list matches the `section_tokens` field exactly. _Check:_ T225.
**REQ-083a — Dynamic lore (Part a).**
group, and remove keyword-triggered lore entries via `set_lore_entry(key, content, ...)`. If the key already exists, provided fields merge into the existing entry; if the key does not exist, a new entry is created. `content` is required for new entries and optional for updates. Entries activate when trigger keywords appear in scene description text (§7.7 Scene → Lore coupling), are badge-filtered, support priority ordering and sticky persistence, and are subject to a configurable token budget. The server SHALL return matching synthesis templates from `lore://templates` via `suggest_lore`.

**REQ-083b — Dynamic lore (Part b).**
The returned template set SHALL include all badge_scope values when called from the Game Master badge, and SHALL exclude only templates whose badge_scope is `game_master` when called from the Player badge. The template's badge_scope is advisory — the Game Master may activate a template with any badge_scope value via `set_lore_entry`, regardless of the template's source scope. Suggested templates carry the same provenance fields (key, content preview, triggers, confidence, source_url, badge_scope) as lore templates in the synthesis manifest. (REQ-155) Lore entries and groups persist with the Novel.

**REQ-083c — Dynamic lore (Part c).**
Player badge mutating and grouping attempts return `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* `set_lore_entry("tavern_rumor", "The innkeeper knows more...", triggers=["innkeeper","tavern"])` activates when scene text matches; sticky entries persist for their count after keywords leave; suppressed entries count appears in `spec_health`. _Check:_ T67, T79, T81, T82, T83.

**REQ-083d — Dynamic lore (Part d).**
Extend `set_lore_entry` and `update_lore_entry`: each lore entry SHALL carry a `visibility` field — one of `gm_only` (applied to new entries), `shared` (visible to Player badge immediately), or `player_discovered` (set automatically when `reveal_secret` is called for this entry's key). `gm_only` entries are excluded from Player-badge surfaces including `badge_briefing`, `lore://active`, and `graph://novel`. `shared` entries are visible to both badges. When `set_lore_entry` creates a new entry without a `visibility` field, it defaults to `gm_only`. `update_lore_entry` MAY change the visibility field.

**REQ-083e — Dynamic lore (Part e).**
The `badge_scope` field controls briefing presentation priority; `visibility` controls badge-filtered read access. *Acceptance criterion:* `set_lore_entry("secret", "content", visibility="shared")` creates a lore entry visible to Player badge. `set_lore_entry("gm_secret", "content")` creates a `gm_only` entry invisible to Player badge. _Check:_ T342.

**REQ-083f — Dynamic lore (Part f).**
WHEN a lore entry's `visibility` is `gm_only` or `player_discovered`, trigger matching SHALL additionally check `characters_present` (REQ-307): the entry fires only when at least one entity who knows about it — via `reveal_secret` or the original revelation that set `player_discovered` — is present in the current scene. `visibility: shared` entries fire on keyword match regardless of presence (current behavior). Entries with no `visibility` field (backward compatibility) SHALL follow the `gm_only` rule, applying the presence check.
**REQ-155a — Sticky counter decay (Part a).**
when the scene text changes such that the entry's trigger keywords are no longer present. The counter resets to the entry's `sticky` value whenever trigger keywords re-match. Decay occurs on state mutation (specifically `set_scene_state`), not on read operations — calling `badge_briefing` multiple times without an intervening scene change must not alter sticky counters. Entries whose sticky counter reaches zero are deactivated in the next briefing assembly and removed from active lore until re-triggered. *Acceptance criterion:* An entry with `sticky: 3` triggered by scene A.

**REQ-155b — Sticky counter decay (Part b).**
Change scene to B (no trigger keywords) — assert counter decrements by 1 per scene change. Call `badge_briefing` twice on scene B — assert counter unchanged. After 3 scene changes without re-triggering, assert entry no longer appears in `badge_briefing` lore section. Revert scene back to A — assert counter resets to 3. _Check:_ T299.
**REQ-328a — Lore-world coupling (Part a).**
field — a room ID, thing ID, or exit reference in the world model. When `world_target` is set, the lore entry SHALL trigger when the target is examined, entered, or interacted with via parser navigation — not on keyword match. `world_target` SHALL take precedence over `triggers` for activation: when both are present, the entry fires on target interaction AND keyword match. Entries without `world_target` SHALL use keyword matching per REQ-083 (current behavior). `suggest_lore` SHALL return world-targeted entries whose target is reachable from the current scene — same room or adjacent via open exit.

**REQ-328b — Lore-world coupling (Part b).**
World-targeted lore entries SHALL appear in `badge_briefing` lore section with a `[world]` tag and the target name. The `world_target` field is optional — backward compatible with all existing lore entries. *Acceptance criterion:* `set_lore_entry("altar_secret", "The altar hums with power", world_target="altar_01")` — lore fires when `resolve_intent("examine altar")` succeeds, regardless of keyword match. `set_lore_entry("altar_secret", "The altar hums", triggers=["altar"], world_target="altar_01")` — fires on both target interaction and keyword match. _Check:_ T372.
**REQ-158a — Independent verification obligation (Part a).**
be accompanied by an independent verification report (§10) with a final verdict of VERIFIED or VERIFIED WITH FINDINGS. A NOT VERIFIED verdict blocks the claim. The independent verification report is operator-produced evidence — it is not a builder artifact in the four-artifact diet.

**REQ-158b — Independent verification obligation (Part b).**
The builder does not control the verifier or its output; the builder's obligation is to produce artifacts sufficient for a cold-checkout verifier to execute the verification suite without the builder's assistance. *Acceptance criterion:* A build's handoff directory, when handed to a verifier of a different model following only README.md and AGENTS.md, produces a VERIFIED or VERIFIED WITH FINDINGS report. The verifier report must be included with the build when the build is claimed as complete. _Check:_ H12, §10 Phase 1 execuability.
**REQ-0841 — Action suggestions (Part 1).**
that maps a player's natural-language intent to ruleset-legal tool invocations. Each suggestion entry carries three fields: the registered tool name, its REQ-015 action classification, and a one-sentence rationale connecting the intent to the mechanic. Freeform prose without tool-name references is insufficient — the LLM must be able to map a suggestion directly to a tool call. With an intent string, it returns all matching actions from the ruleset registry that plausibly correspond to the expressed intent.

**REQ-0842 — Action suggestions (Part 2).**
Because a single natural-language intent may resolve to different mechanical approaches — a player declaring intent to persuade a guard might approach it through persuasion, deception, or intimidation — the tool may return multiple plausible tools for one intent. With an unrecognized intent — one for which no registered tool or documented ruleset procedure plausibly corresponds — the tool returns an empty list. Without an intent, it returns contextually relevant actions based on current scene type (REQ-087), scene_state, entity conditions, and active countdowns.

**REQ-0843 — Action suggestions (Part 3).**
The tool is pure-resolution (idempotent, no state mutation). Results are badge-filtered: GM-only tools are excluded from Player results. The tool does not fabricate actions — every suggestion maps to a registered tool or documented ruleset procedure. Synthesis-derived action patterns (§11.1) may supplement the matching index. They are **inert** — visible at `synthesis://action_patterns` for review but excluded from `suggest_actions` results until the GM activates them via the Novel-scoped action pattern toggle (REQ-115).

**REQ-0844 — Action suggestions (Part 4).**
Unactivated synthesis patterns remain reference-only and do not influence tool output. `suggest_actions` is the canonical mechanism for intent-to-tool mapping at runtime; the server provides no dedicated `use_tool` or `lookup_rule` prompt for this function — directing callers to this tool instead eliminates the redundancy of maintaining two surfaces for the same capability. *Acceptance criterion:* `suggest_actions("persuade the guard")` returns matching tools; `suggest_actions("xyzzy")` returns an empty list; synthesis patterns are excluded from results until activated via `toggle_action_patterns`. _Check:_ T68, T96, T120.
**REQ-084a1 — Proactive action surfacing (Part a1).**
mapping, THE server SHALL surface an Available Actions section in `badge_briefing` (REQ-109) — a decision-critical group after combat state and before lore. This section lists mechanically legal actions the active entity can take given the current scene state, entity capabilities, and ruleset.

**REQ-084a2 — Proactive action surfacing (Part a2).**
Actions SHALL be filtered by scene type (combat, social, or exploration), capability gating (only actions whose mechanical prerequisites are met), count gating (at most 8 actions prioritized by scene-type relevance), and badge filtering (Player badge sees only Player or un-gated actions per REQ-137). `suggest_actions` (REQ-084) remains the canonical intent-to-tool mapping; the proactive surface is a discovery aide, not a replacement. `badge_briefing` SHALL include an `available_actions` section token following the existing token contract (REQ-082, REQ-185). *Acceptance criterion:* During combat, `badge_briefing` `## Available Actions` lists weapon attack, spell, and condition-clearance actions, filtered to the active entity's capabilities.

**REQ-084a3 — Proactive action surfacing (Part a3).**
A wizard with no 3rd-level slots does not see "Cast Fireball." An entity in a social scene sees persuasion and deception actions instead of combat actions. `suggest_actions` continues to return reactive suggestions independently of the proactive listing. _Check:_ T359.
**REQ-115a — Action pattern activation (Part a).**
`toggle_action_patterns` tool — Game Master only. Calling it flips the Novel-scoped action pattern activation state between enabled and disabled. When enabled, synthesis-derived action patterns (§11.1) supplement the `suggest_actions` (REQ-084) matching index. When disabled, patterns remain visible at `synthesis://action_patterns` for review but are excluded from `suggest_actions` results. The toggle is pure-resolution (idempotent, no state beyond the boolean).

**REQ-115b — Action pattern activation (Part b).**
Player badge returns `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* `toggle_action_patterns()` flips the Novel-scoped boolean; when enabled, `suggest_actions` includes synthesis patterns; when disabled, patterns remain at `synthesis://action_patterns` only. _Check:_ T119.
**REQ-114a — Suggestion coverage (Part a).**
against a curated intent set spanning every ruleset-defined action category identified during discovery. Each curated intent entry records: the natural-language intent text, the expected action categories per REQ-015 that the intent should map to, and the ruleset section or synthesis source that defines the category. The full curated set and its derivation are recorded in RULESET_MODEL.md.

**REQ-114b — Suggestion coverage (Part b).**
Coverage below 80% — fewer than 80% of curated intents for which `suggest_actions` returns at least one tool matching the expected action categories — is recorded as a suggestion-coverage finding in DECISIONS.md (5) with the uncovered categories and their intents named. This is a build-time audit; suggestion mappings do not change at runtime. *Acceptance criterion:* The curated intent set in RULESET_MODEL.md covers every discovered action category; coverage below 80% records the uncovered categories and their intents in DECISIONS.md (5) with named uncovered categories. _Check:_ T117.
**REQ-103a — Synthesis reversion (Part a).**
tool — Game Master only. Removes all synthesis items (external web-sourced and internal Novel-state-synthesized, `[supplementary]`-tagged) from the Novel. Ruleset Wisdom (`[ruleset]` and `[vendor]`-tagged items) persists — `revert_synthesis` SHALL NOT remove or alter Ruleset Wisdom content. Player items (`[player]`-tagged) persist. Does not mutate mechanical fields, build-derived tool registrations, badge gating rules, or DECISIONS.md — the synthesis manifest and verification results remain for audit.

**REQ-103b — Synthesis reversion (Part b).**
GM-configured Novel state that references synthesis content — briefing_order set via `set_briefing_order` (REQ-082) and the action pattern activation toggle (REQ-115) — is Novel state, not synthesis state. It survives reversion unchanged: the GM's configuration choices persist even when the synthesis data they reference is absent. After re-synthesis, these choices apply to the new synthesis data without reconfiguration. Player badge returns `[ERROR] [FORBIDDEN]`.

**REQ-103c — Synthesis reversion (Part c).**
Pure-state tool: idempotent, fully reversible — re-running synthesis after reversion repopulates synthesis items. *Acceptance criterion:* After `revert_synthesis()`, all synthesis surfaces (`synthesis://` resource URIs with `[supplementary]` items) return empty or absent; Ruleset Wisdom items (`[ruleset]`, `[vendor]`-tagged) persist unchanged; `lore://templates` returns only Novel-scoped lore entries, never synthesis-sourced templates; `spec_health` reports `synthesis_active: false` with zero counts for synthesis modules.

**REQ-103d — Synthesis reversion (Part d).**
Re-running synthesis repopulates modules; a second revert call changes nothing (idempotent). _Check:_ T94, T125.
**REQ-260a — Granular synthesis activation (Part a).**
synthesis items individually. `list_synthesis_items(module?)` returns all available items with key, preview, source, source tag, and activated status — Ruleset Wisdom resolved from current build output, synthesis from Novel JSON. `activate_synthesis_item(module, key)` activates one item: Ruleset Wisdom adds the key to the Novel's `synthesis_activated` keys; synthesis items marked active in Novel JSON. `deactivate_synthesis_item(module, key)` deactivates without removal. `remove_synthesis_item(module, key)` permanently deletes a synthesis item from the Novel JSON.

**REQ-260b — Granular synthesis activation (Part b).**
Calling `remove_synthesis_item` on a Ruleset Wisdom item SHALL return `[ERROR] [RULE_VIOLATION]` directing the caller to `deactivate_synthesis_item` — Ruleset Wisdom items cannot be removed, only deactivated. The above activation, deactivation, and removal tools are Game Master only. Activation and deactivation state persists with the Novel. Existing `toggle_synthesis_module` and `revert_synthesis` tools remain unchanged as convenience shortcuts.

**REQ-260c — Granular synthesis activation (Part c).**
The Player badge may call `activate_synthesis_item` and `deactivate_synthesis_item` on items they authored (tagged `[player]`) — items stored under the `player_synthesis` key in Novel JSON. Player-created items are active immediately upon creation; `deactivate_synthesis_item` suppresses a player item from the player's `badge_briefing` and synthesis surfaces without deleting it. The Player may NOT call `remove_synthesis_item` — they use `player_remove_synthesis` (REQ-261) for their own items.

**REQ-260d — Granular synthesis activation (Part d).**
Player badge attempts to activate, deactivate, or remove any item NOT tagged `[player]` SHALL return `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* `list_synthesis_items()` shows all items with activation status and source tag; `activate_synthesis_item("voice_examples", "goblin-snarl")` activates the item and it appears in synthesis surfaces; `deactivate_synthesis_item("voice_examples", "goblin-snarl")` removes it from surfaces; `remove_synthesis_item("voice_examples", "goblin-snarl")` on a Ruleset Wisdom item returns `[RULE_VIOLATION]`; on a synthesis item it permanently deletes it; Player calls `deactivate_synthesis_item` on a `[player]` item — item hidden from player briefing; Player calls `activate_synthesis_item` on a `[ruleset]` item — returns `[FORBIDDEN]`. _Check:_ T319.
**REQ-261a — Player synthesis (Part a).**
player-facing subset of output modules: `voice_examples`, `action_patterns`, `supplementary_guidance`, `narrative_voices`, and `lore_templates` — modules where player-authored content enriches the shared story experience.

**REQ-261b — Player synthesis (Part b).**
Three tools provide player synthesis: `player_synthesize(module, key, content, triggers?, badge_scope?)` creates a `[player]`-tagged synthesis item in the specified module. `key` is a unique snake_case slug within the module. `content` is a Markdown string. `triggers` is an optional keyword array for lore_templates (ignored for other modules). `badge_scope` defaults to `shared` — the item is visible to both Player and GM badges. The player may set `badge_scope` to `player` to keep the item private. `player_remove_synthesis(module, key)` removes a `[player]`-tagged item.

**REQ-261c — Player synthesis (Part c).**
Returns `[RULE_VIOLATION]` if the item is not player-authored. `player_list_synthesis(module?)` lists all `[player]`-tagged items, optionally filtered by module, with key, preview, scope, and activated status. Player-created items are stored in the Novel JSON under a `player_synthesis` key, organized by module. Items survive restarts and follow the Novel's persistence contract (REQ-092). Player items are active immediately upon creation — the player does not need to activate them separately. The player may `deactivate_synthesis_item` on their own items to suppress them from their briefing without deletion.

**REQ-261d — Player synthesis (Part d).**
Player items are subject to the same per-module budget caps as community synthesis (§11.1), with a per-module player cap of 15 items each. The GM badge sees player synthesis items in `list_synthesis_items` and in `badge_briefing` filtered by the item's `badge_scope`. The GM may not modify or remove player synthesis items — attempts return `[FORBIDDEN]` — but may override an item's `badge_scope` from `shared` to `game_master` to incorporate it into the GM's active synthesis set. `revert_synthesis` (REQ-103) and `revert_synthesis` (REQ-265) SHALL NOT remove `[player]` items.

**REQ-261e — Player synthesis (Part e).**
Player badge only. *Acceptance criterion:* `player_synthesize("action_patterns", "feint-suggestion", "When I feint, suggest deception check")` creates an item that appears in the player's `suggest_actions` output and in the GM's `badge_briefing` (shared scope); `player_synthesize("voice_examples", "growl", "Get away from my hoard!", [], "player")` creates a private item visible only to the Player badge; `player_remove_synthesis("action_patterns", "feint-suggestion")` removes it; `player_remove_synthesis` on a Tier 1 `[ruleset]` item returns `[RULE_VIOLATION]`; `player_list_synthesis()` returns all player-authored items with module, key, preview, and scope; GM badge returns `[FORBIDDEN]` on player synthesis tools; player items survive server restart. _Check:_ T320.
**REQ-262a — Synthesis tool (Part a).**
Game Master only. It analyzes the Novel's state across seven source categories and produces synthesis items for each output module that has synthesizable content: NPCs (personality, disposition, goals, voice examples), lore entries, the story journal, scene history, factions, secrets, relationships, countdowns, and world-model rooms and things — per §11.2. Internal synthesis items are stored in the Novel JSON under the `synthesis` key alongside external items. Items carry `[supplementary]` tag with `novel://` source URIs. Modules that produce no synthesizable content produce empty sections with `[empty]` markers.

**REQ-262b — Synthesis tool (Part b).**
The tool records a `synthesis_fingerprint` — a hash of the Novel state at synthesis time — to detect staleness without re-synthesis. Calling the tool when no Novel state has changed since the last synthesis returns `[OK] Synthesis up to date — <ISO 8601 timestamp>`. The `force` parameter bypasses the staleness check and re-synthesizes all modules. Items produced by synthesis are inert (inactive by default) — the GM must activate them via REQ-260.

**REQ-262c — Synthesis tool (Part c).**
Player badge returns `[FORBIDDEN]`. *Acceptance criterion:* Calling `synthesize()` with NPCs possessing personality fields produces `[supplementary]` voice examples with `source: novel://<slug>/npc/<npc_id>`. Calling again with no state changes returns the up-to-date message with timestamp. Calling with `force=true` re-synthesizes regardless. Player badge returns `[FORBIDDEN]`. _Check:_ T321.
**REQ-263a — Synthesis auto-trigger (Part a).**
to one of `off` (default), `on_session_start`, or `on_scene_change`, the server SHALL trigger `synthesize` automatically per the selected threshold. `on_session_start`: triggers when `TTRPG_SESSION_ID` changes (a `[session-boundary]` marker is inserted per REQ-237). `on_scene_change`: triggers after every `set_scene_state` call. Auto-triggered synthesis uses the staleness fingerprint — if no relevant state changed since the last synthesis, synthesis is skipped. Auto-triggered items are inert (inactive by default) — the GM must activate them.

**REQ-263b — Synthesis auto-trigger (Part b).**
The auto-trigger threshold is visible in `spec_health` as `synthesis_auto_trigger: <threshold>`. When a ruleset-free Novel has no entities, NPCs, or story journal entries, synthesis produces empty modules with `[empty — no state]` markers. *Acceptance criterion:* With `TTRPG_SYNTHESIS_AUTO_TRIGGER=on_session_start`, a session boundary marker triggers synthesis. With `off`, synthesis requires explicit `synthesize` invocation. Auto-synthesized items appear in `list_synthesis_items()` with `activated: false`. A ruleset-free Novel with no populated state produces empty module markers. _Check:_ T322.
**REQ-264a — Synthesis confidence model (Part a).**
`confidence` field reflecting their synthesis source, not external authority. Items derived from explicit Novel fields — NPC personality text, voice examples, named relationships, faction descriptions, secret content — carry `MEDIUM`. Items derived from inference — pattern detection across story journal entries, cross-referenced lore connections, scene-theme extraction, countdown tension analysis — carry `LOW`. Items carry `[supplementary]` tag alongside the confidence tag. The tag pair (`[supplementary] [MEDIUM]` or `[supplementary] [LOW]`) signals both provenance and reliability.

**REQ-264b — Synthesis confidence model (Part b).**
Internal synthesis items do not carry the `[stale]` flag — they are regenerated on demand, not collected at a fixed time. When a source field changes (e.g., NPC personality is edited), the corresponding item's `collected_at` timestamp is updated to reflect the synthesis time. Confidence is re-evaluated on each synthesis pass — an item that was `MEDIUM` may become `LOW` if its source was replaced with inferred content. *Acceptance criterion:* A voice example synthesized from an NPC's explicit personality field carries `[supplementary] [MEDIUM]`.

**REQ-264c — Synthesis confidence model (Part c).**
A "recurring theme" insight derived from cross-referencing three story journal entries carries `[supplementary] [LOW]`. After editing an NPC's personality, re-synthesis updates the `collected_at` timestamp for that NPC's items. _Check:_ T323.
**REQ-265a — Synthesis in badge_briefing (Part a).**
`badge_briefing` under their respective sections, tagged `[supplementary]` with confidence, alongside Ruleset Wisdom and `[player]` items. Badge filtering follows the same rules as REQ-159: items assigned `badge_scope: game_master` are hidden from the Player badge. Internal synthesis item badge scope defaults to `game_master` — they are GM prep aids by nature. The GM may override the scope to `shared` or `player`. The Player may deactivate individual synthesis items via `deactivate_synthesis_item` when the GM has overridden their scope to `shared` or `player` (REQ-260).

**REQ-265b — Synthesis in badge_briefing (Part b).**
When no synthesis items are active, `badge_briefing` SHALL NOT include an empty synthesis section — unlike Ruleset Wisdom sections which require explicit empty-state markers per REQ-109. The absence of synthesis content is not a deficiency to signal. *Acceptance criterion:* Synthesis items appear in `badge_briefing` under their respective sections tagged `[supplementary]` with confidence, alongside `[ruleset]`, `[vendor]`, and `[player]` items. Player badge sees only items whose scope is `shared` or `player`. Deactivated items via REQ-260 are hidden from the Player badge.

**REQ-265c — Synthesis in badge_briefing (Part c).**
After `revert_synthesis`, synthesis items are absent from `badge_briefing` with no empty-section marker. _Check:_ T324, T326.
**REQ-266a — Synthesis in dashboard (Part a).**
include a synthesis column in its per-module table, showing `[supplementary]` item counts alongside Ruleset Wisdom counts. `spec_health` SHALL surface `synthesis_status` with per-module activated/total counts and the last synthesis timestamp (`synthesis_last_run` as ISO 8601). `synthesis://status` SHALL include a `synthesis` section with the auto-trigger threshold, last synthesis timestamp, and a per-module breakdown of item counts.

**REQ-266b — Synthesis in dashboard (Part b).**
When no synthesis items exist, `synthesis://status` SHALL include the synthesis column with zero counts — the column is always present. *Acceptance criterion:* `synthesis://status` displays synthesis item counts per module alongside Ruleset Wisdom counts. `spec_health` includes `synthesis_last_run` timestamp and `synthesis_status` with per-module counts. After `synthesize()`, the synthesis column shows non-zero counts for populated modules. _Check:_ T325, T327.
**REQ-130a — Synthesis rebuild contract (Part a).**
synthesis state SHALL preserve every synthesis item that the Game Master has incorporated into active Novel state through any Novel-scoped tool call. A synthesis item is "activated" when a Novel-scoped GM tool call causes it to appear in at least one tool-observable surface (tool output, resource, or prompt) for the current Novel. Items never incorporated into active state — those that appear only in synthesis resource surfaces — are "inactive." The builder may replace inactive synthesis items with fresh synthesize output.

**REQ-130b — Synthesis rebuild contract (Part b).**
Activated items SHALL NOT be removed, downgraded, or altered in their activated state by re-synthesis. The synthesized state's foundational principle — additive, inert, never modifying mechanical fields — extends to replacement: replacing inactive items is not modifying; removing or downgrading activated items is modifying and is forbidden. The builder SHALL record whether replacement preserved activated items or performed a full replacement in DECISIONS.md (5).

**REQ-130c — Synthesis rebuild contract (Part c).**
Full replacement — removing all synthesis including activated items — requires `revert_synthesis` (REQ-103) before re-running Synthesis. *Acceptance criterion:* Create lore entry from synthesis template, activate it. Re-run synthesize — assert the activated entry persists unchanged. Revert synthesis, re-run synthesize — assert fresh synthesis state replaces all. _Check:_ T144.
**REQ-226a — Narrative voice profiles (Part a).**
narrative voice profiles from the ruleset's inspirational media citations ("Appendix N," "Inspirational Reading," "Suggested Viewing," or equivalent sections discovered during the guidance pass). Each profile records: `name` (e.g., "Sword & Sorcery — Conan"), `source` (ruleset anchor), `media_title`, `media_type` (film, novel, game, or other), and `description` (narrative techniques and stylistic markers from the source material). External synthesis (§11.1) may add supplementary profiles. Stored at `synthesis://narrative_voices`.

**REQ-226b — Narrative voice profiles (Part b).**
Profiles are inert — the GM applies them via narrative directive (REQ-081) by naming the profile. When the ruleset provides no inspirational media section, the builder SHALL attempt to populate the module from vendor content — IF Craft Corpus genre conventions and BitD thematic advice (§11.2). When both ruleset and vendor sources produce no narrative voice profiles, the module is empty — this is not a defect.

**REQ-226c — Narrative voice profiles (Part c).**
Ruleset-free builds produce an empty module when vendor content is also absent. *Acceptance criterion:* A ruleset citing Conan and The Lord of the Rings produces ≥2 narrative voice profiles with source anchors and descriptions. _Check:_ T302.
**REQ-227a — Synthesis model (Part a).**
sources: external (web-researched per §11.1, defaults to off at intake, tagged `[supplementary]`, removed by `revert_synthesis`) and internal (Novel-state analysis per §11.2, tagged `[supplementary]` with `novel://` source URIs, removed by `revert_synthesis`). Ruleset Wisdom (`[ruleset]` and `[vendor]`-tagged items) is build output from two sources — the ruleset's own text per REQ-225 and the vendor content bundles in `holonovel/narrative_world_model/` per §11.4 — populated at build time, never removed by `revert_synthesis`.

**REQ-227b — Synthesis model (Part b).**
Synthesis items and Ruleset Wisdom coexist in all resource URIs and `badge_briefing` sections. The GM activates synthesis items via the same tool calls as Wisdom items. Synthesis items SHALL NOT replace or override Ruleset Wisdom items with matching keys — conflicts are recorded with `conflicts_with` reference to the Wisdom item. *Acceptance criterion:* A build with ruleset content SHALL populate Ruleset Wisdom in the Novel at creation time; synthesis, when run, adds `[supplementary]` items alongside `[ruleset]` and `[vendor]` items; `revert_synthesis` removes all `[supplementary]` items. _Check:_ T303.
**REQ-228a — Synthesis consistency during spec-driven updates (Part a).**
spec-driven update per REQ-098, after the gap audit identifies changed surfaces, the builder SHALL scan all synthesis items (both tiers) for references to surfaces identified as changed or removed in the gap audit. Orphan references SHALL be classified: `auto-repairable` (tool was renamed — update the synthesis reference to the new name), `GM-review` (the referenced surface was removed — the GM should review and replace the synthesis item), or `stale-reference` (the surface is absent with no obvious replacement).

**REQ-228b — Synthesis consistency during spec-driven updates (Part b).**
GM-activated items (REQ-130) with orphan references carry a `[stale-reference]` tag in `spec_health` until the GM resolves them. This check SHALL run before Pattern Buffer re-execution (§6.7) and SHALL NOT trigger web research — it is a cross-reference scan only. Results are recorded in DECISIONS.md with the gap audit row reference. *Acceptance criterion:* After a Minor update that renames a tool, ruleset-native synthesis action patterns referencing the old tool name are flagged `auto-repairable` and updated before the re-build completes.

**REQ-228c — Synthesis consistency during spec-driven updates (Part c).**
A community synthesis item referencing a removed ruleset section is flagged `GM-review` with the gap audit row cited. _Check:_ T304.
**REQ-230a — Synthesis status dashboard (Part a).**
`synthesis://status` resource showing per-module synthesis item counts for the active Novel: total items, activated items (GM-activated via Novel-scoped tool calls), inactive items, stale items, and pending-suggestion count (synthesis items matching current adventure/scene content but not yet activated). Counts are per output module (voice_examples, briefing_order, lore_templates, action_patterns, supplementary_guidance, adventure_advice, narrative_voices). The resource SHALL render as Markdown with a header line "Synthesis Status" and one `##`-level section per module.

**REQ-230b — Synthesis status dashboard (Part b).**
Ruleset-native items are counted separately from community items within each module. The status SHALL be dynamically computed from Novel state at read time. The resource respects badge filtering per REQ-032. `spec_health` SHALL surface a summary: `synthesis_status` with per-module activated/total counts. *Acceptance criterion:* After activating 2 lore templates and 1 voice example, `synthesis://status` shows lore_templates: activated=2, total=N; voice_examples: activated=1, total=N. Other modules show activated=0. Player badge sees only shared-scope items. _Check:_ T306.
**REQ-231a — Per-module synthesis toggle (Part a).**
individual synthesis output modules at runtime via `toggle_synthesis_module(module, enabled)`. Module SHALL be one of: `voice_examples`, `briefing_order`, `lore_templates`, `action_patterns` and `supplementary_guidance`, `adventure_advice`, `narrative_voices`. Disabling a module SHALL suppress all items in that module from `badge_briefing`, `suggest_actions`, `suggest_lore`, and synthesis resource URIs for the current Novel. Disabling does not delete items — the items persist in Novel state and re-appear when the module is re-enabled.

**REQ-231b — Per-module synthesis toggle (Part b).**
Ruleset-native modules default to enabled; community modules default to enabled when community synthesis has been run. The toggle state persists with the Novel. Player badge attempts return `[ERROR] [FORBIDDEN]`. An unknown module name returns `[INVALID_INPUT]` with valid module names enumerated. *Acceptance criterion:* `toggle_synthesis_module("voice_examples", false)` removes voice examples from `badge_briefing` and `synthesis://voice_examples` for the active Novel; re-enabling restores them; an unknown module returns `[INVALID_INPUT]`; Player badge returns `[FORBIDDEN]`. _Check:_ T307.
**REQ-243a — Synthesis population during spec-driven updates (Part a).**
spec-driven update per REQ-098, after the gap audit implements new or changed surfaces and before Pattern Buffer re-execution, the builder SHALL run a scoped ruleset-native synthesis re-classification.

**REQ-243b — Synthesis population during spec-driven updates (Part b).**
The builder: (a) identifies new or changed surfaces from the gap audit's implemented-disposition rows — surfaces are tools, resources, prompts, or state fields; (b) maps each surface to the source ruleset sections that produced it, using the extraction citations in RULESET_MODEL.md; (c) runs REQ-225 classification on only those sections, producing new `[ruleset]`-tagged items; (d) merges new items into the existing synthesis manifest — appending to modules, never replacing existing items; (e) records the added item count per module in DECISIONS.md alongside the gap audit row reference.

**REQ-243c — Synthesis population during spec-driven updates (Part c).**
When the gap audit identifies no new surfaces (patch-level change), this step SHALL be skipped with a "no new surfaces — skipped" annotation. The scoped re-classification SHALL NOT trigger a full re-read of the ruleset — only the sections that produced the new surfaces are re-read. This step SHALL NOT trigger web research. Community synthesis items are not affected. *Acceptance criterion:* After a Minor update that adds a new `lookup_<category>` tool, ruleset-native action_patterns and supplementary_guidance receive new `[ruleset]` items for the new tool.

**REQ-243d — Synthesis population during spec-driven updates (Part d).**
DECISIONS.md records the added count per module. _Check:_ T308.
**REQ-244a — Convergence cache key (Part a).**
cache key at the start of Phase 1, composed of five components: the ruleset content hash (REQ-044, sentinel `"none"` for ruleset-free), the specification content hash (REQ-187), the holonovel package version (B10), an aggregate hash of the `holonovel/narrative_world_model/` vendor directory, and a narrative surface hash — a SHA-256 of the sorted, concatenated tool names, resource URIs, and prompt names for all narrative-category tools (excluding Novel lifecycle and Badge & Workflow tools).

**REQ-244b — Convergence cache key (Part b).**
When the cache key matches a prior successful convergence recorded in DECISIONS.md (5), the builder MAY skip Phase 1 metrics whose inputs are fully captured by the key — all nine metrics when the key matches, or individual metrics when a partial match is detected. Phase 2 metrics that depend on extraction quality (mechanics fidelity, suggestion coverage) MAY be skipped when the extraction model is unchanged; Phase 2 metrics that depend on builder implementation quality (MUST coverage, process compliance, surface terminology, prompt health, resource URI completeness, truncation accuracy) SHALL always run fresh.

**REQ-244c — Convergence cache key (Part c).**
Every skipped metric SHALL be recorded in DECISIONS.md (5) with the annotation `cached — convergence fingerprint match` and the cache key that produced the match. The operator MAY override the cache at intake with a `--no-cache` flag that forces the full convergence loop regardless of cache-key match. In non-interactive mode the defaults apply — cached results are reused when available. A full rebuild (cold checkout, no prior DECISIONS.md) has no cache key to match and runs the full convergence loop.

**REQ-244d — Convergence cache key (Part d).**
In `quick-build` mode the cache key is still computed but Phase 1 metrics are always reported fresh — quick-build runs the full convergence loop for speed-versus-correctness trade-off tracking. A partial match — one component differs while the rest are unchanged — SHALL record which component differed and which metrics were cached in DECISIONS.md (5). *Acceptance criterion:* A TTRPG build against a ruleset whose prior build recorded a matching convergence cache key in DECISIONS.md (5) reports Phase 1 metrics as `cached — convergence fingerprint match` and skips the measurement/improvement iteration loop.

**REQ-244e — Convergence cache key (Part e).**
A build with `--no-cache` runs the full convergence loop regardless of key match. A cold checkout (no prior DECISIONS.md) runs the full convergence loop. _Check:_ T309.
**REQ-245a — Pre-computed synthesis manifest (Part a).**
`CONVERGENCE.md` manifest at the package root recording Phase 2 convergence results per package version: the holonovel package version, the specification version the manifest was computed against, all eight Phase 2 convergence metric results, and Holonovel Pattern Buffer sub-workflow outcomes (I1–I18, per-sub-workflow pass/fail with ISO 8601 timestamps).

**REQ-245b — Pre-computed synthesis manifest (Part b).**
When the specification version recorded in the manifest matches the current specification version, the holonovel package builder MAY skip Phase 2 convergence and the Holonovel Pattern Buffer, recording `cached — holonovel vX.Y.Z convergence manifest` in DECISIONS.md (5) and (6). When the specification version has advanced, the builder SHALL run convergence and the Holonovel Pattern Buffer fresh and update the manifest with the new results and spec version. TTRPG builders consuming the holonovel package as a dependency SHALL NOT load or reference this manifest — it applies only to holonovel package builds.

**REQ-245c — Pre-computed synthesis manifest (Part c).**
A ruleset source MAY include a pre-built synthesis manifest (`synthesis_manifest.json` alongside the ruleset Markdown) containing the seven-module REQ-225 extraction output, each module's `[ruleset]`-tagged items with source anchors and confidence labels, the ruleset content hash it was extracted from, and the specification version used for extraction. During Discovery, before running REQ-225 classification, the builder SHALL check for this manifest.

**REQ-245d — Pre-computed synthesis manifest (Part d).**
When the manifest is present AND the specification version recorded in the manifest matches the current specification version AND the manifest's ruleset content hash matches the current ruleset content hash: the builder SHALL use the pre-built manifest, recording `pre-built synthesis manifest — validated` in DECISIONS.md (4). When any validation condition fails, the builder SHALL fall back to live REQ-225 extraction with the annotation `pre-built synthesis manifest — <failure reason>, live extraction` in DECISIONS.md (4).

**REQ-245e — Pre-computed synthesis manifest (Part e).**
When no manifest is present, the builder proceeds with live extraction as normal. *Acceptance criterion:* A holonovel package build whose CONVERGENCE.md spec version matches the current spec reports Phase 2 metrics and Holonovel Pattern Buffer results as cached. A TTRPG build against a ruleset with a valid pre-built synthesis manifest skips REQ-225 extraction and uses the manifest. A ruleset without a manifest runs live REQ-225 extraction as before. _Check:_ T310.
**REQ-085a — Macro system (Part a).**
in all tool output, resource text, and prompt text before delivery. Supported macros: `{{entity.name}}`, `{{entity.hp}}`, `{{entity.<stat>}}` (per-ruleset stat names), `{{scene.current}}`, `{{scene.type}}`, `{{countdown.<name>.remaining}}`, `{{countdown.<name>.total}}` and `{{countdown.<name>.scope}}`, `{{countdown.<name>.direction}}`, `{{novel.slug}}`, `{{badge.active}}` `{{party.size}}`. Macros referencing nonexistent state expand to the literal token unchanged. Macro expansion occurs after output composition and before client delivery.

**REQ-085b — Macro system (Part b).**
Macros do not expand in audit log entries. *Acceptance criterion:* `{{entity.name}}` in tool output expands to the active entity's name; `{{nonexistent.path}}` expands to the literal token unchanged; macros do not expand in audit log entries. _Check:_ T69.
**REQ-086a — Audit compression (Part a).**
tool that returns a Markdown-formatted prompt with a header line — "Compressed audit log (summarize into a single paragraph):" — followed by one line per entry in the format `[timestamp] [badge] tool_name — output_prefix` for mutating entries or `[timestamp] [badge] tool_name — [BOUNDARY_VIOLATION]` for forbidden-call entries (REQ-133). The tool does not modify the audit log (REQ-040).

**REQ-086b — Audit compression (Part b).**
Output is badge-filtered: Player sees entries where the recorded badge is `player` or where the entity affected by the entry is owned by the current player (per the entity-ownership filter defined in REQ-168, applied to compress_audit output); Game Master sees all. `max_entries` is a positive integer; values ≤ 0 return `[ERROR] [INVALID_INPUT]`.

**REQ-086c — Audit compression (Part c).**
The tool is pure-generation (idempotent, no server-side state mutation). *Acceptance criterion:* `compress_audit(50)` returns a formatted prompt of the 50 most recent entries; Player badge sees only own-entity entries; `compress_audit(0)` returns `[INVALID_INPUT]`. _Check:_ T70.
**REQ-087a — Scene type tagging (Part a).**
more type strings. The default catalog — always present — is `social`, `exploration`, `neutral`. The builder SHALL extract additional scene types from the ruleset's guidance and activity-pillar descriptions (e.g., `crafting`, `investigation`, `survival`, `hacking`). Extracted types merge with the default catalog; the builder SHALL record the full resolved catalog in DECISIONS.md. Combat is not a scene type — it is a resolution mode with dedicated state (REQ-043); combat presence is signalled by the combat state group in `badge_briefing`, not by a scene type tag.

**REQ-087b — Scene type tagging (Part b).**
Multiple scene types may be active simultaneously (e.g., `["social", "exploration"]` for negotiation during a journey). The `scene_type` parameter on `set_scene_state` accepts either a single type string or an array of type strings. The type tags are guidance — they affect `badge_briefing` composition (tools matching any active type are ordered before unmatched tools) and `suggest_actions` filtering (actions matching any active type are prioritized), but do not alter tool behavior, dice results, or rules enforcement. The types persist with the Novel. Player badge attempts return `[ERROR] [FORBIDDEN]`.

**REQ-087c — Scene type tagging (Part c).**
Confrontation tools (REQ-043) operate identically regardless of scene type; the tag guides the GM and LLM toward moves matching the scene type. *Acceptance criterion:* The `scene_type` parameter on `set_scene_state` with `["social", "exploration"]` orders social and exploration tools before unmatched tools in `badge_briefing`; a single string `"exploration"` works for backward compatibility. _Check:_ T71, T135.
**REQ-125a — Scene transition hook (Part a).**
description differs from the current `scene_description`, the server records a `[scene-transition]` audit entry with the old and new descriptions and a timestamp. This is automatic — no additional tool call is required. Countdowns of either type (`round` or `narrative`) carrying the `on_scene_transition` flag (REQ-073) decrement by one tick on transition. Calling `set_scene_state` with a `skip_transition_hook` parameter suppresses the audit entry and countdown decrement for cases where the GM is updating the same scene without transitioning it (e.g., adding descriptive detail).

**REQ-125b — Scene transition hook (Part b).**
The Player badge sees scene transitions in `scene://history`; GM-only mechanics (audit entry, countdown decrement) are invisible to the Player badge. *Acceptance criterion:* `set_scene_state("cave", skip_transition_hook=true)` does not record a `[scene-transition]` audit entry; a countdown with `on_scene_transition=true` decrements on scene change. _Check:_ T136. *Out of scope:* AI content generation at runtime (all generation is build-time), real-time web synthesis, and narrative quality assessment beyond the anti-slop guidance catalog.
**REQ-234a — Secrets and knowledge (Part a).**
with per-entity visibility. `set_secret(key, content, triggers?, badge_scope?)` creates a secret lore entry visible only to the Game Master badge. `reveal_secret(key, entity_id)` makes a secret known to a specific entity — the entity's `character_sheet` SHALL include the secret text in a "Known Information" section. `get_knowledge(entity_id, key?)` returns what secrets an entity knows; without `key`, returns all known secrets. Secrets are functionally lore entries with a knowledge-visibility layer — they follow the same persistence, grouping, and export contracts as lore (REQ-083, REQ-094).

**REQ-234b — Secrets and knowledge (Part b).**
Resource: `secrets://active` — GM-filtered, lists all secrets and their known-by status. *Coupling:* When a secret implicates another entity or faction (detected by name overlap between the secret text and registered entity/NPC/faction names), a `suspicious` relationship (REQ-236) SHALL be recommended between the knowledge-holder and the implicated entity.

**REQ-234c — Secrets and knowledge (Part c).**
The recommendation SHALL be surfaced in `badge_briefing` for the Game Master badge only. `reveal_secret(key, target_id)` SHALL accept faction identifiers as `target_id` alongside entity identifiers. `get_knowledge(faction_id, key?)` SHALL accept faction identifiers alongside entity identifiers and SHALL return secrets known to the faction. Faction-known secrets SHALL surface at `faction://<id>` for the GM badge.

**REQ-234d — Secrets and knowledge (Part d).**
WHEN a faction is revealed a secret that names another faction in its content, a `rival` relationship (REQ-236) SHALL be recommended between the knowledge-holding faction and the named faction. *Acceptance criterion:* `set_secret("murder_confession", "The butler killed Lord Ashworth")` creates a GM-only lore entry; `reveal_secret("murder_confession", "pc_detective")` adds "Known Information" to the detective's character sheet; `get_knowledge("pc_detective")` returns the secret. _Check:_ T274.

### 5.9 Novel Persistence and Transport

**REQ-088a — Novel lifecycle (Part a).**
`create_novel(name, description?)` creates a new Novel at `.holonovel-state/novels/<slug>.json` and activates it for the calling connection. An optional `codex_adventure` parameter — a Codex entry ID of kind `adventure` — bootstraps the Novel in one atomic operation: creates the Novel, imports the Codex adventure scaffold (world-model, NPCs, factions, lore, synthesis linkages per REQ-321), and marks `adventure_set: true` in Novel metadata. When `codex_adventure` is provided and the referenced Codex entry does not exist or is not of kind `adventure`, `create_novel` SHALL return `[ERROR] [NOT_FOUND]`.

**REQ-088b — Novel lifecycle (Part b).**
In a multi-ruleset server, the referenced Codex entry's `ruleset` field SHALL match the Novel's ruleset scope (per REQ-387); a mismatch returns `[ERROR] [STATE_CONFLICT]` naming both rulesets.

**REQ-088c — Novel lifecycle (Part c).**
When no Codex entries exist on the server, the parameter is ignored silently. `description` is an optional free-text field (one paragraph recommended), stored in the Novel JSON, surfaced in `novel://current`, `list_novels`, `novel_info`, and `export_novel` manifest. `resume_novel(slug)` activates an existing Novel from disk. `switch_novel(slug)` (REQ-095) switches the active Novel for a connection. `end_novel()` emits a `[NEED_INPUT]` workflow decision — "End Novel `<slug>`?" — with options `yes` and `cancel`.

**REQ-088d — Novel lifecycle (Part d).**
On `yes`: deactivates badge, clears undo stacks, removes the Novel's save file and its backup from disk (no orphaned state), and the roster survives. On `cancel`: restores pre-invocation state unchanged. `resume_novel(slug)` returns `[STATE_CONFLICT]` if no file exists at `.holonovel-state/novels/<slug>.json` (whether removed by `end_novel` or never created). Multiple Novels may coexist on disk per server instance. One Novel is active per connection at a time (REQ-030); a connection may switch between Novels via `switch_novel` (REQ-095).

**REQ-088e — Novel lifecycle (Part e).**
Character creation, character import, and NPC creation are Novel-scoped operations — they require an active Novel. Without one, they return `[STATE_CONFLICT]` directing the operator to `create_novel`. Silent orphan creation — adding an entity to the roster without a Novel association — is a defect. `[STATE_CONFLICT]` if no Novel active when a Novel-scoped tool is called. Server start without `TTRPG_NOVEL` operates with no Novel active — Novel-scoped tools direct users to create or resume one.

**REQ-088f — Novel lifecycle (Part f).**
For backward compatibility, the builder may accept `end_game` as a deprecated alias for `end_novel`; the alias is not required and may be logged as deprecated in `spec_health`. WHEN `TTRPG_NOVEL` is set at server startup, THE system SHALL attempt to activate the Novel named by the env var before servicing any tool call. If a Novel matching the slug exists on disk, the server resumes it (equivalent to `resume_novel(slug)`). If no such Novel exists, the server creates one with the given name (equivalent to `create_novel(name)`).

**REQ-088g — Novel lifecycle (Part g).**
In either case, the Novel is the active Novel before the first tool call or prompt is served.

**REQ-088h1 — Novel lifecycle (Part h1).**
If `TTRPG_NOVEL` is set but activation fails for any reason other than non-existence (e.g., corrupt file, checksum mismatch), the server reports the error in stderr and `spec_health`, and proceeds with no Novel active — it does not silently swallow the error.

**REQ-088h2 — Novel lifecycle (Part h2).**
*Acceptance criterion:* `create_novel("my-novel", "A noir detective story set in a rain-soaked city.")` creates `novels/my-novel.json` and stores the description; `end_novel()` prompts `[NEED_INPUT]` with yes/cancel; on "yes", the file is moved to `.trash/` and the roster survives. `create_novel("dragon-game", codex_adventure="dragon-hoard")` creates the Novel and imports the dragon-hoard Codex adventure scaffold atomically; `create_novel("broken", codex_adventure="nonexistent")` returns `[NOT_FOUND]`. _Check:_ T72, T73, T98, T159, T379.
**REQ-117 — Novel retention period.** On `end_novel` confirmation, the server moves the
Novel's save file and its backup to a `.trash/` subdirectory within the state directory
rather than deleting them immediately. Files in `.trash/` are excluded from `listNovels`
and `resume_novel`. The operator may configure a retention duration via
`TTRPG_NOVEL_RETENTION_DAYS`; files older than this duration are eligible for removal on
next server startup. If `TTRPG_NOVEL_RETENTION_DAYS` is unset or set to zero, files in
`.trash/` are retained indefinitely (manual cleanup required).
*Acceptance criterion:* After `end_novel`, the file exists in `.trash/` but
`resume_novel(slug)` returns `[STATE_CONFLICT]`; `TTRPG_NOVEL_RETENTION_DAYS=0`
retains files indefinitely.
_Check:_ T122.

**REQ-095a — Novel switching (Part a).**
deactivates the connection's current Novel and activates the target Novel identified by slug. The target must exist on disk and must not have been ended (file must be present at `.holonovel-state/novels/<slug>.json`). Returns `[STATE_CONFLICT]` if the slug does not exist or the target Novel's file is absent. When switching, the active badge for the target Novel is restored from the Novel's persisted badge state (REQ-055). If no Novel is currently active, `switch_novel` activates the target directly (equivalent to `resume_novel(slug)` without requiring a fresh server start).

**REQ-095b — Novel switching (Part b).**
Novel-scoped tools operate on the connection's active Novel. Each connection maintains its own active Novel reference; two connections may have different Novels active simultaneously. *Acceptance criterion:* `switch_novel("other-novel")` deactivates the current Novel and activates the target; the target's persisted badge is restored; switching to a nonexistent slug returns `[STATE_CONFLICT]`. _Check:_ T98.
**REQ-256a — Rename Novel (Part a).**
only) renames the active Novel's save file on disk and updates the slug in state. Returns `[STATE_CONFLICT]` if the target slug already exists on disk or if the active Novel is active in another connection. The Novel's `.bak.N` files are renamed to match. The rename is atomic — the server SHALL NOT leave the Novel in a state where the slug differs from the filename. The Novel must be active when called. Badge state, synthesis activation keys, and all property groups are preserved under the new slug.

**REQ-256b — Rename Novel (Part b).**
The new slug is reflected in `list_novels`, `novel_info`, and `spec_health`. *Acceptance criterion:* `rename_novel("new-name")` renames `novels/old-name.json` to `novels/new-name.json`; `list_novels()` lists the Novel under the new slug; duplicate slug returns `[STATE_CONFLICT]`; the old slug returns `[NOT_FOUND]` on `resume_novel`. _Check:_ T315.
**REQ-259 — Update Novel description.** `update_novel_description(description)` (Game
Master only) sets or replaces the active Novel's description. An empty string clears
the description. The updated description is surfaced immediately in `novel://current`,
`list_novels`, `novel_info`, and `badge_briefing` under the `novel` section token.
The description is stored in the Novel JSON per REQ-092. Calling with no Novel
active returns `[STATE_CONFLICT]`. *Acceptance criterion:*
`update_novel_description("A new premise.")` updates the description;
`novel_info()` returns the new description; an empty string clears it.
_Check:_ T318.

**REQ-257a — List Novels (Part a).**
Novels on disk with these fields per Novel: slug, name, description, last-modified timestamp, session count, cumulative play time, on-disk file size in bytes, story journal entry count, synthesis item counts (Tier 1 activated key count per module, Tier 2 item count per module), and active flag. Badge-filtered: the Player badge sees only Novels with `shared` scope adventure hooks and excludes GM-only metadata. When no Novels exist, the response SHALL include an explicit empty-state message.

**REQ-257b — List Novels (Part b).**
This is the dedicated save-file browsing surface — `spec_health` (REQ-093) continues to report Novels as part of its build-health dashboard, but `list_novels` is the primary interface for the save-file library. *Acceptance criterion:* After creating two Novels, `list_novels()` returns two entries; after `end_novel`, the ended Novel is absent; empty disk returns an empty-state message; Player badge sees filtered metadata. _Check:_ T316.
**REQ-258a — Novel info (Part a).**
to the active Novel) returns extended metadata for a single Novel: slug, name, description, creation timestamp, last-modified timestamp, session count, cumulative play time, on-disk file size, story journal entry counts by type, checkpoint count, notes count, adventure source (slug, "generated", or "none"), setup-completion flags, format version, compression flag, synthesis status (Tier 1 activated key count per module, Tier 2 item count per module, stale item count), `codex_sources` (array of `{id, kind, imported_at, codex_modified_at}` per REQ-332), and the active badge. Badge-filtered.

**REQ-258b — Novel info (Part b).**
When the specified slug doesn't exist on disk, returns `[NOT_FOUND]` with available slugs enumerated. When no slug is given and no Novel is active, returns `[NOT_FOUND]` directing the caller to `list_novels` or `create_novel`. *Acceptance criterion:* `novel_info()` returns extended metadata for the active Novel; `novel_info("other-novel")` returns metadata for a different Novel without activating it; nonexistent slug returns `[NOT_FOUND]` with available slugs; Player badge sees filtered metadata. _Check:_ T317.
**REQ-089a — Novel setup (Part a).**
`prompts/list`). It SHALL present a guided setup wizard in three sequential steps: (1) characters — import roster characters or create new ones, with the ruleset's creation options described in plain English; (2) story source — load an adventure, generate from a premise, generate a random encounter, or build from scratch, with each option explained in terms of what the GM gets narratively; after step 2 completes and a story source is selected, `novel_setup` SHALL include a plain-English note: "Community-sourced play advice tailored to your adventure's themes — is available for this Novel.

**REQ-089b — Novel setup (Part b).**
You can run synthesis against this server to add it now, or proceed without it." The note SHALL describe synthesis in terms of what it delivers (voice examples, lore ideas, scene advice) not what it is called or how to invoke it; (3) session zero. Each step SHALL display a visual completion marker — `[✓]` for completed, `[→]` for current, `[ ]` for pending — so the operator always knows where they are. Step descriptions SHALL be conversational in plain English (e.g., "You have 2 characters in your roster. Would you like to import one, create a new one, or move on?") rather than a static listing.

**REQ-089c — Novel setup (Part c).**
After session zero completes, the prompt SHALL present a next-steps summary describing what is ready and how to begin the first scene. The Novel SHALL track completed steps (characters_present, adventure_set, session_zero_completed) in its metadata, surfaced in `badge_briefing` under the `novel` section token.

**REQ-089d — Novel setup (Part d).**
After `create_novel`, the server response or `badge_briefing` SHALL surface `novel_setup` as the recommended next step. `novel_setup` SHALL integrate ruleset-extracted guidance (REQ-016), Synthesis `adventure_advice` content, and spec foundations for story-construction context. *Acceptance criterion:* `novel_setup` presents three sequential steps with visual completion markers; step descriptions use conversational plain English; after session zero completes, a next-steps summary appears; completed steps are tracked in Novel metadata. _Check:_ T74.
**REQ-294 — Genre declaration.** The Novel SHALL carry a `genre` field, settable via
`novel://current` metadata and `badge_briefing` under the `novel` section token. The field
accepts a canonical set of genre tags: `noir`, `high_fantasy`, `sword_and_sorcery`, `sci_fi_horror` and `cosmic_horror`, `historical`, `western`, `modern` and `cyberpunk`.
Ruleset-derived genre tags merge with the canonical catalog. Default is unset. When a
genre is set, `spec_health` SHALL report `active_genre`. When unset, the genre line is
absent from briefing per §5.10.
*Acceptance criterion:* After setting `genre: "noir"`, `spec_health` reports
`active_genre: "noir"` and `badge_briefing` includes a `genre` line. Setting an unknown tag
returns `[WARNING]` but the tag is stored.
_Check:_ T339.

**REQ-090a — Adventure generation (Part a).**
only). Accepts a free-text premise and produces an adventure scaffold: a title (slug-ified from premise), an Overview (GM-only, template-populated), an Adventure Hook (player-visible), 2–6 location headings with table-rolled flavor (setting, horror, puzzle tables from the ruleset), NPC name suggestions, and encounter table seeding.

**REQ-090b — Adventure generation (Part b).**
Uses indexed ruleset tables and, when available, Synthesis `adventure_advice` content — selecting templates by category match (adventure_templates for scaffold structure), genre-convention items by keyword match against the premise string, and scenario_starters by genre tag — each selection carrying its source_url and confidence in the output. No runtime network — all content from indexed data.

**REQ-090c — Adventure generation (Part c).**
The optional `target` parameter accepts `novel` (default when a Novel is active), `codex` (default when no Novel is active), or `both`. `target: "codex"` SHALL store the generated scaffold as a Codex entry of kind `adventure` under the derived slug with `source: generated`. `target: "novel"` SHALL store as the active Novel's generated adventure content — the scaffold is indexed at `adventure://generated/<anchor>`, appears in `search_rules` and `badge_briefing` under the `adventure` token. `target: "both"` SHALL produce both.

**REQ-090d — Adventure generation (Part d).**
When no Novel is active and `target` is omitted, `target` defaults to `codex`. `generate_adventure` SHALL be callable regardless of Novel state — no Novel is required. Regenerating with `target: "codex"` replaces the prior Codex entry at the same slug; regenerating with `target: "novel"` replaces the prior generated Novel adventure.

**REQ-090e — Adventure generation (Part e).**
The Game Master expands via existing tools; the LLM (GM badge) writes narrative prose. *Acceptance criterion:* `generate_adventure("The goblin king demands tribute")` produces a title, overview, hook, 2–6 locations, NPC names, and encounter seeds; the scaffold appears at `adventure://generated/<anchor>`. `generate_adventure("The dragon hoard", target="codex")` with no Novel active stores the scaffold in Codex; `codex_list("adventure")` returns the entry; server restart preserves it. _Check:_ T75, T367.
**REQ-091a — Enhanced encounter generation (Part a).**
only, optional context string). Combines ruleset encounter tables with Synthesis `adventure_advice` content (matching by scene context keywords against table_expansions category items, highest confidence first) to produce a complete encounter in one call: a scene description, an NPC or monster stat block, and a complication entry. With ruleset tables, rolls on them for the mechanical backbone and wraps in generated narrative. Without tables, produces from context and Synthesis template patterns.

**REQ-091b — Enhanced encounter generation (Part b).**
Output: three structured artifacts as a batch — one `set_scene_state`, one `create_npc`, one `set_lore_entry` for the complication. Snapshotted as a single undo target. No `[NEED_INPUT]`. Player badge → `[FORBIDDEN]`. *Acceptance criterion:* `generate_encounter("dark forest at midnight")` produces a scene description, an NPC stat block, and a lore entry as a single atomic batch; undo rolls back all three. _Check:_ T76.
**REQ-295a — Genre-filtered generation (Part a).**
(REQ-294), `generate_adventure` and `generate_encounter` SHALL filter their table draws and template selections to prefer genre-matching content.

**REQ-295b — Genre-filtered generation (Part b).**
The filtering SHALL operate as a preference, not a block: (a) encounter tables, NPC archetypes, and location templates that carry a matching genre tag SHALL be drawn from first; (b) untagged or `universal` tables SHALL be drawn from only when genre-matching content is exhausted; (c) content tagged with a non-matching genre SHALL be excluded unless the GM explicitly requests it via a `!include_all` prefix on the premise/context string; (d) synthesis content SHALL be filtered by genre tag when the Novel's genre is set.

**REQ-295c — Genre-filtered generation (Part c).**
Generation tables (REQ-213) SHALL carry an optional `genre_tags` field extracted during Discovery (§6.3). A table with no `genre_tags` field is classified as `universal`. *Acceptance criterion:* With `genre: "noir"` set, `generate_encounter("dark alley")` drawn from tables where the noir-tagged table contains "mugger" and the universal table contains "dragon" SHALL return the mugger. _Check:_ T340.
**REQ-092a — Novel persistence (Part a).**
`.holonovel-state/novels/<slug>.json` (self-contained JSON bundling all state tiers, the `audit_log` array (REQ-040), the `story_journal` array (REQ-246), Novel metadata, and undo snapshot stacks) using an atomic rename — write to a temporary file, then atomically rename over the target. The serialized Novel payload must be fully durable on the storage medium before the atomic rename commits. Content written to the temporary file must be flushed to stable storage (e.g., via fsync on the file descriptor) before the rename operation.

**REQ-092b — Novel persistence (Part b).**
The temporary file path must include an element that prevents collision with concurrent writers targeting the same Novel (e.g., a process identifier or timestamp suffix). A Novel on disk whose file size is zero after an atomic write indicates a durability failure — surfaced in `spec_health` and stderr. A backup of the previous Novel file is retained as `<slug>.json.bak`. Both corrupted JSON and a missing backup surface in `spec_health` and stderr. A rebuild with a changed entity model loads the Novel gracefully: absent-model fields in JSON preserved as inert data; missing fields receive ruleset-defined defaults.

**REQ-092c — Novel persistence (Part c).**
Roster baselines remain immutable across rebuilds. Structurally corrupted JSON → stderr warning and `spec_health` flag; never silently discarded. On load, if the primary file is structurally corrupt but the `.bak` file is intact and parseable, the server loads from the backup and records a `[restored-from-backup]` audit entry. If both primary and backup are corrupt, the server emits a stderr warning listing both file paths, surfaces a `[corrupted-novel]` flag in `spec_health` with the slug, and provides the backup path for operator recovery. The server must not silently discard or zero-initialize the Novel.

**REQ-092d — Novel persistence (Part d).**
No orphaned state — `end_novel` removes the save file and its backup. The Novel JSON includes a checksum field — a hash of the serialized state excluding the checksum field itself. On load, the server verifies the checksum against the loaded state. A mismatch follows the same recovery path as structural corruption: attempt backup restore, then surface the mismatch in `spec_health` and stderr if both are tainted. The checksum algorithm and field name are builder-determined; the convergence loop enforces that tainted state is detected.

**REQ-092e — Novel persistence (Part e).**
Undo snapshot stacks (REQ-041) persist with the Novel — they survive server restarts alongside all other Novel state tiers. The Novel JSON SHALL include a `novel_format_version` field — an integer, initially `2`, incremented when the Novel's on-disk schema changes incompatibly. On load, the server compares the stored version to the current format version. Version < current: trigger graceful migration per the existing load rules (absent-model fields receive ruleset-defined defaults; extra fields are preserved as inert data).

**REQ-092f — Novel persistence (Part f).**
For version 1 Novels, the server SHALL auto-migrate: if a `.holonovel-state/novels/<slug>.audit.jsonl` file exists alongside the Novel JSON, read all entries from the JSONL file, construct an `audit_log` array in the Novel, verify the hash chain end-to-end, delete the JSONL file, and set `novel_format_version` to `2`. If no JSONL file exists for a version 1 Novel, load with an empty `audit_log` array, record a `[migration-missing-audit]` audit entry, and set `novel_format_version` to `2`.

**REQ-092g — Novel persistence (Part g).**
Version > current: surface a `[WARNING] [format-future]` in `spec_health` — the Novel may contain fields the current server cannot interpret; the server loads the Novel with the existing graceful migration rules and the warning remains active until the format version matches. WHEN `TTRPG_NOVEL_COMPRESS` is `true` (configurable), the serialized Novel JSON SHALL be gzip-compressed before writing to disk. Backups SHALL be compressed when the primary is compressed.

**REQ-092h1 — Novel persistence (Part h1).**
The 4 MB health warning threshold in REQ-097 applies to the on-disk compressed size. `export_novel` output (REQ-096) SHALL be uncompressed regardless of this setting — the interchange format is always uncompressed JSON or Markdown. `TTRPG_NOVEL_COMPRESS` SHALL be recorded in the Novel's metadata for integrity verification on resume: a compressed Novel loaded with compression disabled SHALL produce a `[WARNING] [compression-mismatch]`; an uncompressed Novel loaded with compression enabled loads normally.

**REQ-092h2 — Novel persistence (Part h2).**
*Acceptance criterion:* After 10 mutations, the Novel JSON on disk is non-empty and parseable; `cat novels/<slug>.json | jq .checksum` returns a non-empty string; `cat novels/<slug>.json | jq .novel_format_version` returns `2`; `cat novels/<slug>.json | jq .audit_log` returns an array with 10 entries; a version 1 Novel with a valid JSONL file auto-migrates on load; a corrupt primary file triggers backup restore. _Check:_ T77, T88, T156, T282.
**REQ-093a — Novel listing and metadata (Part a).**
slug, name, last-modified timestamp, active flag. `list_novels` (REQ-257) is the dedicated save-file browsing surface — `spec_health` is the build-health dashboard. `novel_info(slug?)` (REQ-258) returns extended metadata for a single Novel.

**REQ-093b — Novel listing and metadata (Part b).**
The active Novel's metadata includes: creation timestamp, last-modified timestamp, entity count, adventure source (module slug, "generated", or "none"), setup-completion flags, story journal entry count, session count (distinct `TTRPG_SESSION_ID` values in the audit log), cumulative play time (earliest-to-latest audit entry timestamp range), last-active scene anchor, current combat round if in-combat, total combat rounds played across this Novel's lifetime, and a `sessions` array — per-session objects with `session_id`, `entry_count`, `timespan_start`, `timespan_end` and `combat_rounds`, `significant_roll_count`, and `scene_transitions` — derived from `[session-boundary]` marker intervals (REQ-237).

**REQ-093c — Novel listing and metadata (Part c).**
This metadata appears in `badge_briefing` under the `novel` section token (added to REQ-082's documented token set). `novel://current` and `novel://<slug>` resources return full metadata, including the narrative directive (REQ-081). *Acceptance criterion:* `spec_health` lists available Novels with slug, name, last-modified, and active flag; the active Novel's metadata includes session count, cumulative play time, and last-active scene anchor. _Check:_ T78, T99.
**REQ-094a — Lorebook interchange (Part a).**
lorebooks from interoperable formats. Export excludes mechanical state; import modifies only the lore tier with merge, replace, and dry-run modes. Round-trip preserves lore metadata. Formats are defined in Appendix L. Player badge attempts return `[ERROR] [FORBIDDEN]`.

**REQ-094b — Lorebook interchange (Part b).**
For a complete story package that includes lore alongside entities, NPCs, scene state, countdowns, and audit history, use `export_novel` (REQ-096) — which embeds the lore tier within the Novel interchange format. `export_lorebook` is the lore-only interchange pathway. *Acceptance criterion:* `export_lorebook()` → `import_lorebook(exported_data, "replace")` → `export_lorebook()` produces identical output; Player badge returns `[FORBIDDEN]`. _Check:_ T80. Merge mode adds entries whose keys are not present in the Novel's lore tier and preserves all existing entries unchanged.

**REQ-094c — Lorebook interchange (Part c).**
Duplicate keys — entries whose key matches an existing lore entry — are skipped with a count reported in the operation result. Replace mode clears the lore tier before importing, producing a lore set consisting solely of the import data. Dry-run mode reports which entries would be added, which would be skipped as duplicates, and which would be overwritten (replace only), without modifying state.
**REQ-096a — Novel interchange (Part a).**
only, format `json` or `markdown`, scope defaults to `full`) exports the active Novel's state in a self-contained interchange format per Appendix Q.

**REQ-096b — Novel interchange (Part b).**
The `scope` parameter selects the payload: `full` (all state tiers, audit log, snapshots, checkpoints if `include_checkpoints=true` per REQ-241), `state_only` (all tiers except audit log and checkpoints), `lore` (lore tier only), `world_model` (rooms, things, exits, properties), `npcs` (NPCs with personality fields), `factions` (factions with clock state), `secrets` (secrets with known-by status), `relationships` (relationship objects), `gm_context` (pause/ resume context), `notes` (key-value notes), `story_journal` (story journal entries per REQ-246), or `scene_history` (scene-state ledger).

**REQ-096c — Novel interchange (Part c).**
No dedicated `synthesis` scope — Ruleset Wisdom activation keys export as part of `full` scope in the manifest's `synthesis_activation` field; synthesis items export as the `synthesis` key in `full` scope (per Appendix Q). Each scope outputs Appendix Q schema with omitted keys for excluded tiers. Single scope per call. `import_novel(data, mode, strict?)` (Game Master only, mode `dry-run`, `replace`, or `merge`, strict defaults to `false`) imports a previously exported Novel. `dry-run` reports what would change without side effects. `replace` replaces the active Novel's state with the import data.

**REQ-096d1 — Novel interchange (Part d1).**
On import, the server SHALL validate: (a) entity IDs within the import are unique, (b) NPC references in lore entry trigger lists resolve to NPCs present in the import (or the existing Novel for merge mode), (c) faction references in `gm_context.active_threads` resolve to factions present in the import, (d) relationship targets resolve to entities, NPCs, or factions present in the import, (e) world-model exit references resolve to rooms present in the import, (f) countdown names are unique within the import, (g) clock `opposes` and `unlocks` references resolve to countdowns present in the import, (h) adventure content referenced in `manifest.adventure_module_slugs` is either embedded or the slugs are recorded as missing with a warning.

**REQ-096d2 — Novel interchange (Part d2).**
On import, the server SHALL additionally validate: (i) Tier 2 synthesis items whose `source_url` the target server never fetched SHALL be flagged `[stale]`, (j) Tier 1 synthesis activation keys whose anchor does not resolve against the target build's current extraction SHALL be flagged `[orphan]`.

**REQ-096e — Novel interchange (Part e).**
Tier 2 stale items and Tier 1 orphan items are imported inert (inactive). Module toggle state that references absent synthesis modules produces a warning. When `strict` is `true`, any staleness or orphan synthesis items also block the import. `dry-run` reports all validation failures with each item's path. In `replace` and `merge` modes, failures surface as `[WARNING]` with enumerated items but import proceeds. For one interchange-format version, the legacy `"dm_context"` scope string is accepted and aliased to `gm_context` on import.

**REQ-096f — Novel interchange (Part f).**
When `strict` is `true`, any validation failure blocks the import and returns `[ERROR] [STATE_CONFLICT]` for `replace`/`merge` modes (returning the failure list in the error body), or produces a failure report with `isError: false` for `dry-run`. `merge` adds entities and NPCs from the import to the active Novel, skipping duplicates by entity or NPC ID. Player badge attempts return `[ERROR] [FORBIDDEN]`. Round-trip: export → import → export produces identical output (full scope, same format).

**REQ-096g — Novel interchange (Part g).**
The export SHALL include a `manifest` object containing: `novel_format_version` (defined in REQ-092), `server_spec_version` (CalVer from DECISIONS.md), `ruleset_hash` (SHA-256 of source ruleset), `builder_implementation` (name and version of the builder that produced the server), `adventure_module_slugs` (array of module slugs active at export time), `adventures_embedded` (true when adventures are embedded), whether module content is embedded inline), `property_groups_present` (array of populated tier names), and `waiver_dependent_mechanics` (array of mechanic names that depend on REQ-013 waivers recorded in DECISIONS.md).

**REQ-096h — Novel interchange (Part h).**
The manifest is advisory — `import_novel` surfaces mismatches as warnings but does not block import. `export_novel` SHALL embed loaded adventure module content inline in the `adventure` key when `TTRPG_EXPORT_EMBED_ADVENTURES` is `true` (default `false`). When `false`, the export's `manifest.adventure_module_slugs` field records which adventure modules were active at export time but their content is not embedded — the import target must have those modules indexed to restore adventure content.

**REQ-096i1 — Novel interchange (Part i1).**
Adventure modules embedded inline SHALL include their prose content (all narrative sections per REQ-079) and world-model assertions (`## World` section); embedded content carries the module's build-time content hash for integrity verification on import. `TTRPG_EXPORT_EMBED_ADVENTURES` SHALL be recorded in the Novel's build fingerprint as part of the Build workflow's Advanced questions (B9 area).

**REQ-096i2 — Novel interchange (Part i2).**
*Acceptance criterion:* `export_novel("json")` → `import_novel(data, "dry-run")` reports changes without side effects; `import_novel(data, "replace")` restores the exported state; round-trip is byte-identical; `export_novel("json", "lore")` produces a payload with only the lore tier present; `import_novel (data, "dry-run", strict=true)` with broken references reports all failures and blocks import; `export_novel("json")` includes a `manifest` object with all declared fields present. _Check:_ T100, T281.
**REQ-097a1 — Novel health (Part a1).**
`spec_health` SHALL report for the active Novel: NPC count (with warning if near `TTRPG_MAX_NPCS` when configured), lore entry count (with warning if near `TTRPG_MAX_LORE_ENTRIES` when configured), audit log entry count, story journal entry count, story journal total characters (on-disk byte count), snapshot stack depth (with warning if near `TTRPG_MAX_SNAPSHOT_DEPTH` when configured), on-disk file size in bytes (with warning if exceeding 4 MB), `synthesis_gap_count` — the number of activated Tier 1 keys that no longer resolve against the current build's extraction (per REQ-080, surfaced as `[synthesis-gap]` entries), and a `healthy` flag — set to false if any warning is active.

**REQ-097a2 — Novel health (Part a2).**
`spec_health` reports a sliding window of Novel file-size deltas and snapshot depth deltas over the most recent sessions (distinct `TTRPG_SESSION_ID` values in the audit log, bounded to the last 7 by default).

**REQ-097b — Novel health (Part b).**
A Novel whose growth trajectory projects an on-disk file size exceeding 4 MB within the next 3 sessions is flagged with a `[size-growth]` warning. The file-size metric reported in `spec_health` SHALL match the on-disk file size as reported by the operating system, including all serialization overhead (encoding, checksum field, whitespace formatting). A file reported at size S bytes in `spec_health` whose on-disk size differs by more than 1% is a `[size-mismatch]` warning — indicating a durability or serialization defect. The growth trajectory SHALL use the on-disk size, not the in-memory representation size.

**REQ-097c — Novel health (Part c).**
Health metrics are badge-filtered: Player sees entity-level health only; GM sees all. *Acceptance criterion:* When NPC count approaches `TTRPG_MAX_NPCS`, `spec_health` reports a warning and `healthy` is false; a Novel at 3.9 MB with growth trajectory projects a `[size-growth]` warning. _Check:_ T101, T160.
**REQ-131a — Novel initialization order (Part a).**
from disk, its property groups SHALL be initialized such that cross-group dependencies are satisfied before dependents are loaded (see §7.7.1). Dependencies are: Adventure content before NPCs (NPCs may reference adventure stat block templates per REQ-119), NPCs before Lore entries (Lore content may reference NPCs), Scene state last among property groups (Scene changes trigger Lore matching and Countdown hooks per REQ-083, REQ-125).

**REQ-131b — Novel initialization order (Part b).**
Synthesis activation keys (`synthesis_activated`, REQ-080) SHALL be loaded before synthesis state resolution, so that Tier 1 key resolution against current build output determines which synthesis items are active before any synthesis surfaces are computed. Combat state, pending workflows, remaining synthesis state, and audit log entries SHALL be restored after all property groups. An out-of-order initialization that produces observable differences in `badge_briefing` content, resource URI output, or tool behavior between two invocations of the same Novel against the same builder is a convergence finding.

**REQ-131c — Novel initialization order (Part c).**
The builder records the initialization order in DECISIONS.md (4). *Acceptance criterion:* Create a Novel with an adventure, an NPC referencing an adventure template, a lore entry mentioning the NPC, and a countdown with `on_scene_transition`. Restart. Assert `badge_briefing` surfaces adventure content, then the NPC (with template stats), then the triggered lore entry, then the countdown — in dependency order. The order IS stable across 3 restarts. _Check:_ T145.
**REQ-238a — Backup rotation (Part a).**
each Novel, configured via `TTRPG_NOVEL_BACKUP_COUNT` (minimum 1). Backups are named `<slug>.json.bak.1` through `<slug>.json.bak.N`. On each atomic write (REQ-092), existing backups are rotated: `<slug>.json.bak.N-1` → `<slug>.json.bak.N`, … `.bak.1` → `.bak.2`, the previous primary file (after fsync) → `.bak.1`. On load, if the primary file is corrupt (structural JSON error or checksum mismatch per REQ-092), the server attempts backup restore in order from `.bak.1` through `.bak.N` — the first parseable backup with a valid checksum wins and a `[restored-from-backup]` audit entry records the backup index used.

**REQ-238b — Backup rotation (Part b).**
If no backup is parseable, the server follows the existing recovery path (stderr + `[corrupted-novel]` in `spec_health`). `end_novel` moves all backup files to `.trash/` alongside the primary. Setting `TTRPG_NOVEL_BACKUP_COUNT=1` retains only the immediate previous backup (current behavior). *Acceptance criterion:* After 10 mutations with `TTRPG_NOVEL_BACKUP_COUNT=3`, three rotated backup files exist; corrupting the primary and `.bak.1` triggers restore from `.bak.2`; `end_novel` removes all backups. _Check:_ T276.
**REQ-240a — Clone Novel (Part a).**
new_name, trim_audit_sessions?)` tool (callable with the Editor badge or Game Master badge). The tool creates an independent copy of the source Novel as a new Novel at `.holonovel-state/novels/<new_slug>.json`. All property groups defined in §7.7 plus the world-model tier, combat state, pending workflows, metadata, audit log, story journal, undo snapshots, and checkpoints (if present, REQ-241) SHALL be copied. Roster references are preserved — cloned entities point to the same roster IDs.

**REQ-240b — Clone Novel (Part b).**
The cloned Novel's `created_at` timestamp SHALL be the clone time; the clone is not activated — the caller's active Novel is unchanged. Returns `[STATE_CONFLICT]` if the target slug already exists. The optional `trim_audit_sessions` parameter (configurable, default null = full copy) strips audit entries older than N sessions from the clone, keeping only the most recent N sessions' entries (session boundaries determined by `[session-boundary]` markers per REQ-237). A new `clone` audit entry SHALL be recorded in both the source and cloned Novel.

**REQ-240c — Clone Novel (Part c).**
Player badge attempts return `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* `clone_novel("my-novel", "my-novel-fork")` creates an independent copy; mutating the clone does not affect the source; `spec_health` lists both Novels; `clone_novel("my-novel", "my-novel-fork")` a second time returns `[STATE_CONFLICT]`; `clone_novel("my-novel", "trimmed", trim_audit_ sessions=2)` clones with only the 2 most recent sessions' audit entries. _Check:_ T278.
**REQ-334a — Novel archive (Part a).**
tool — Game Master only, Novel must not be active in another connection. Marks the Novel as archived: the Novel file SHALL be moved from `.holonovel-state/novels/<slug>.json` to `.holonovel-state/archive/<slug>.json` with its backup files. The active badge is deactivated; the Novel is no longer active. IF the Novel is active in another connection, THE system SHALL return `[STATE_CONFLICT]`. Archived Novels SHALL be read-only — all mutating tools SHALL return `[STATE_CONFLICT]` with corrective action directing the caller to `unarchive_novel`.

**REQ-334b — Novel archive (Part b).**
Archive is distinct from trash (REQ-117): archived Novels are long-term reference files, never auto-deleted. `list_novels` SHALL accept an optional `filter` parameter with values `active` (default, excludes archived and trashed), `archived` (archived-only), or `all`. `unarchive_novel(slug)` SHALL restore an archived Novel to active status at `.holonovel-state/novels/<slug>.json` with full state preserved — all property groups and metadata intact. Player badge returns `[FORBIDDEN]`. Archived Novels SHALL surface in `spec_health` under an `archived_novels` key with slug and archive timestamp.

**REQ-334c — Novel archive (Part c).**
Codex entries captured from an archived Novel via `codex_capture` SHALL preserve their `source_novel` field — the archived Novel remains the provenance reference. *Acceptance criterion:* `archive_novel("my-novel")` moves the file to `.holonovel-state/archive/my-novel.json`; `list_novels()` excludes it; `list_novels(filter="archived")` includes it with archive timestamp; `resume_novel("my-novel")` returns `[STATE_CONFLICT]`; `unarchive_novel("my-novel")` restores the Novel to active state with all property groups intact. `spec_health.archived_novels` lists the archived slug.

**REQ-334d — Novel archive (Part d).**
Player badge returns `[FORBIDDEN]`. _Check:_ T381.

### 5.10 World-Model Layer

The server SHALL incorporate a world-model layer — a subsystem that models rooms,
things, exits, containment, kinds, and properties as typed objects with mechanical
contracts. The layer extends every Novel's state model with a spatial world model,
parser command dispatch tools, and world-model CRUD tools. The world model is the
**spatial foundation** for scene composition — when populated, it defines what is
physically possible in the story. The ruleset resolves what succeeds within those
constraints. Narrative frames the result.

Conflict-resolution order reflects this relationship:

1. **World constraints** — spatial reality. Walls are solid; doors block passage;
   darkness conceals. The world model defines default physical constraints. These
   are the medium the story operates within, not an optional module.

2. **Ruleset overrides of world constraints** — explicit mechanics that suspend a
   specific world constraint (Knock opens locked doors, Ethereal Jaunt passes
   through solid objects, darkvision sees in darkness). Overrides require an
   explicit named mechanic — the ruleset cannot silently contradict world-model
   state. Override discovery (§5.2 REQ-324) and the constraint override catalog
   (REQ-325) govern registration and lookup.

3. **Ruleset resolution** — for actions that are possible (within constraints or
   after override), the ruleset determines success, failure, or effect. Dice,
   conditions, spells — these resolve mechanical outcomes without affecting
   world-model spatial state unless a mechanic explicitly does so.

4. **Narrative framing** — meaning, tone, story continuity. Framing respects
   both world constraints and ruleset outcomes; it never contradicts either.

Parser commands are an **AI-narrator resolution engine** — they resolve spatial
intent silently when the player describes actions in natural language. Parser verb
names are never exposed to the Player badge. The Game Master may inspect the
world-model directly through the parser command tool.
_Check:_ T237.

**World surface prominence.** REQ-309 defines a `TTRPG_WORLD_PROMINENCE`
configuration with three levels controlling the default surface emphasis of
world-model and narrative infrastructure tools across help categories,
`badge_briefing` composition, and `suggest_actions` intent mapping. Parser
commands are a Game-Master tool — the Player badge never sees parser verb names
or the `command` tool. At every prominence level, the AI narrator resolves
player spatial intent through `resolve_intent` (REQ-323) without exposing parser
mechanics. At the
default `secondary` level: In TTRPG builds, the parser `command` SHALL be
the only world-model tool visible in the primary help surface (under "World
Inspection", Game Master only) — and only when
a world model is populated. All other World tools (`create_room`, `remove_room`,
`create_thing`, `remove_thing`, `create_exit`, `remove_exit`, `convert_source`)
SHALL be placed in a secondary "World (Setup)" category at the bottom of the
help task map. In ruleset-free builds, the same rule applies — the freeform
narrative tools (Narrative) are the primary surface; World serves as optional
spatial scaffolding in the secondary category.

This backgrounding principle extends to all narrative infrastructure tools that are
not part of the TTRPG rules engine: vows (REQ-289), oracles (REQ-291), genre declaration
(REQ-294), knowledge-graph resources (REQ-296), and any future narrative tools. These
tools follow the Holonovel design philosophy in both directions:

**When you are not using them, they are invisible.** Narrative tools that render briefing
sections (vows, narrative threads, knowledge state) render their sections only when data
is non-empty. Empty state renders a compact empty-state marker. Narrative tools invoked on
demand (oracle, graph://novel, list_adventures) SHALL have no briefing presence — they
are callable by the GM but do not push content into the briefing unprompted. Advisory
constraints (genre) render as a single line in the `novel` briefing section when set;
absent when unset.

**When you call on them, they are as helpful as anything else on the server.** Every
narrative tool inherits the full Holonovel UX contract: `[INVALID_INPUT]` with enumerated
valid options; `help("<tool_name>")` returns usage examples, parameter contracts, and
common workflows; `suggest_actions("<intent>")` maps player intent to narrative tools;
`[NOT_FOUND]` with nearest-match suggestions; `[STATE_CONFLICT]` with corrective action.

The acid test: when a new GM opens `badge_briefing` on a fresh Novel with no narrative
tools populated, the briefing SHALL look the same as it did before the tools were added.
When that same GM types `help("set_vow")`, the server SHALL respond with the same level
of helpfulness as `help("set_countdown")`.

**REQ-195a — World-model state tier (Part a).**
state tier. The tier SHALL hold: rooms (named locations with descriptions and exits), things (named objects with descriptions, containment, and portability classification), exits (directional connections between rooms with associated door and openable/lockable state), and properties (either/or attributes on world-model objects: open/closed, locked/unlocked, fixed/portable, lit/dark). The tier SHALL be snapshot-able, audit-logged, and persistent with the Novel per REQ-088, REQ-092.

**REQ-195b — World-model state tier (Part b).**
World-model properties couple with other Holodeck surfaces per the coupling architecture (§7.7.1a — coupling rows citing P3, P13, P34, P38–P42). A Novel whose world-model tier has not been populated (no rooms declared) SHALL report an empty world model — the TTRPG layer is not dependent on world-model population. _Check:_ T238.
**REQ-196a — Parser command dispatch (Part a).**
natural-language text and resolve it against the world model's current state. The `command` tool is an AI-narrator resolution engine — the AI narrator calls it internally when the player describes spatial actions. The tool is Game Master only; Player badge calls return `[ERROR] [FORBIDDEN]`.

**REQ-196b — Parser command dispatch (Part b).**
The tool's `tools/list` description SHALL state "AI-narrator tool — resolves spatial intent internally." Recognized commands SHALL include: navigation (walk, move, or go directions), inspection (examine named objects, look at current room), object interaction (take portable things, drop carried things, open/close openable objects), inventory listing, and wait. Navigation SHALL resolve exit directions and check door state — a closed door blocks passage.

**REQ-196c — Parser command dispatch (Part c).**
Object interaction SHALL respect portability and containment — taking a fixed object returns a rule-violation; taking an object inside a closed container returns a rule-violation. An unrecognized command SHALL return a not-implemented result with the command verb named AND the three nearest-matching valid commands from the parser catalog, ordered by edit distance — the response pattern is `[UNIMPLEMENTED] Unknown verb '<verb>'.

**REQ-196d — Parser command dispatch (Part d).**
Valid commands include: <nearest-1>, <nearest-2>, <nearest-3>.` `command("help")` SHALL enumerate every available command verb with its category (navigation, inspection, object interaction, inventory, wait) and a one-line description. `command("what can I do?")`, `command("commands")`, and `command("verbs")` SHALL produce the same output as `command("help")`. When the world-model tier is empty (no rooms), the help enumeration SHALL still list verbs — the base vocabulary is known even without a populated world.

**REQ-196e — Parser command dispatch (Part e).**
An ambiguous object reference SHALL return a disambiguation prompt listing all matching objects by name and location, ending with a question: "Which <object type>?" The response pattern is: `[OK] Which <object_type>?` followed by a numbered list of matches with locations (e.g., "1. The stone altar (in the Crypt)\n2. The wooden altar (in the Chapel)"). This replaces the previous behavior of returning all matches as a flat list — the numbered format enables the caller to respond with a specific match.

**REQ-196f — Parser command dispatch (Part f).**
When the world-model tier is empty (no rooms), all parser commands SHALL return a not-implemented result directing the user to populate the world model via an adventure module or CRUD tools. _Check:_ T239.
**REQ-283a — Verb coverage tiers (Part a).**
registered command verb into one of three coverage tiers. The `core` tier is the base vocabulary (go, look, examine, take, drop, inventory, wait) — always present. The `standard` tier comprises IF-community baseline verbs (open, close, lock, unlock, push, pull, search, read, sit, stand, wear, remove, eat, drink, light, extinguish, climb, jump, enter, exit, put, insert), available when the world model contains objects supporting the corresponding property.

**REQ-283b — Verb coverage tiers (Part b).**
The `extended` tier includes ruleset-derived verbs discovered via REQ-222. `command("help")` SHALL group commands by tier; `command("verbs")` SHALL report tiered coverage with per-tier counts; `world://kinds` SHALL report per-tier verb lists; `spec_health` SHALL include `parser_verb_coverage` with per-tier counts.

**REQ-283c — Verb coverage tiers (Part c).**
The tier classification is advisory — it signals parser completeness, not mechanical enforcement. *Acceptance criterion:* A populated world model with openable doors, readable books, and wearable items reports `core` tier verbs (7), `standard` tier verbs (12+ depending on world-model supports), and `extended` tier verbs per REQ-222. A ruleset with no additional verbs reports 0 `extended`. A world model with no openable objects reports the `open` and `close` verbs as registered but unavailable (annotated in the verb list). _Check:_ T333.
**REQ-284a — Implicit action hints (Part a).**
is not met — a locked container before unlocking, a closed door before opening, an object in darkness — THE response SHALL include a hint naming the required action and object when that object exists and is reachable in the world model. Reachable means: the object is in the current room, in the player's inventory, or in an open container in either.

**REQ-284b — Implicit action hints (Part b).**
The hint SHALL be appended to the rule-violation message as a separate line: `Hint: You need the <object name> (<location>) first.` Examples: `command("open chest")` when the chest is locked and the iron key is in the player's inventory → `[RULE_VIOLATION] The chest is locked. Hint: You need the iron key (inventory) first.` `command("unlock chest")` when no key exists in the world model → `[RULE_VIOLATION] The chest is locked.` (no hint — no reachable key exists). The hint contract SHALL extend to the following precondition failures for new kinds, following the same reachability rules.

**REQ-284c — Implicit action hints (Part c).**
When a readable thing is inside a closed container in the room, the hint SHALL state the thing is inside the container — open it first. When a vehicle or climbable is in an adjacent room visible through an open exit, the hint SHALL name the room and direction. When targeting a switched-off device in a dark room, no hint is produced — switching the device is the solution.

**REQ-284d — Implicit action hints (Part d).**
When reading requires unworn wearable equipment, no hint is produced — the parser returns a `[RULE_VIOLATION]` listing the missing equipment type. *Acceptance criterion:* Create a world model with a locked chest and an iron key in the room. `command("open chest")` returns `[RULE_VIOLATION]` with a hint naming the iron key and its location. Remove the key from the world model — `command("open chest")` returns `[RULE_VIOLATION]` with no hint.

**REQ-284e — Implicit action hints (Part e).**
A readable inscription inside a closed glass jar produces "Hint: The inscription is inside the glass jar — open it first." A vehicle in an adjacent room produces the direction-bearing hint. A switched-off lantern produces no hint. _Check:_ T354.
**REQ-316a — Device kind (Part a).**
kind extending `thing`. A device SHALL carry `switchable` (can be turned on or off) and `switched_on` (current state) properties. A device that is both `lit` and `switched_on` SHALL provide light; a device that is `switched_off` SHALL be dark regardless of the `lit` property. A device is portable by default. `command("switch on <device>")` SHALL set `switched_on` to true; `command("switch off <device>")` SHALL set it to false. Switching a non-switchable thing SHALL return `[RULE_VIOLATION]`.

**REQ-316b — Device kind (Part b).**
The `switch on` and `switch off` commands SHALL be registered in the parser command catalog under `object_interaction` category, standard tier. The property assertions "It is switchable." and "It is switched on." SHALL be recognized by `convert_source`. _Check:_ T361.
**REQ-317a — Vehicle kind (Part a).**
kind extending `thing`. A vehicle SHALL carry `enterable: true` by default and `capacity` (maximum passengers, integer). A vehicle is `fixed` by default — it cannot be taken. When a player enters a vehicle via `command("enter <vehicle>")`, the player's current room SHALL become a virtual interior room derived from the vehicle's description. The vehicle interior SHALL have an `out` exit that returns the player to the room where the vehicle is parked.

**REQ-317b — Vehicle kind (Part b).**
While the player is aboard, `command("look")` SHALL show the interior description and list visible exits — the room the vehicle is parked in SHALL be visible as an `out` exit. Navigation commands (`go north`, `go south`, etc.) while aboard SHALL move the vehicle and all its contents (passengers and items) through the world-model exit graph — movement SHALL resolve against the room the vehicle occupies, not the vehicle interior. A vehicle SHALL persist at its last location when unoccupied.

**REQ-317c — Vehicle kind (Part c).**
A vehicle reaching capacity SHALL reject additional passengers with `[RULE_VIOLATION]`. `command("exit")` and `command("get out")` SHALL return the player to the room containing the vehicle. Vehicle interior rooms SHALL NOT appear in `world://map` independently — they are child objects of the vehicle, not world-graph nodes. The kind declaration "A raft is a vehicle. 'Description.' It is in the Lake." SHALL be recognized by `convert_source`.

**REQ-317d — Vehicle kind (Part d).**
WHEN a player enters a vehicle via `command("enter <vehicle>")`, the server SHALL record a `[vehicle-entry]` story journal entry of type `moment` with the context `entered <vehicle>` and the vehicle's interior description. WHEN the player exits the vehicle, a `[vehicle-exit]` entry SHALL record the room returned to. These entries SHALL appear in `session_recap` scene transitions and SHALL be surfaced in `badge_briefing` narrative context when present. This couples vehicle traversal into the narrative surface without affecting scene state — the GM's `set_scene_state` remains authoritative. _Check:_ T362.
**REQ-318a — Extended property contracts (Part a).**
THE world-model layer SHALL
extend the `thing` type with properties enabling parser commands, each
defaulting to false: `switchable` enables `switch on`/`switch off`; `switched_on`
records current switch state; `wearable` enables `wear`/`remove`; `readable`
enables `read` with `read_text` providing revealed text and defaulting to null;
`edible` enables `eat`, removing the thing from inventory; `drinkable` enables
`drink`; `enterable` enables `enter` for containers or vehicles; `climbable`
enables `climb`; `transparent` makes contents visible when closed.

**REQ-318b — Extended property contracts (Part b).**
`convert_source` SHALL recognize property assertions for each boolean
property: "It is wearable.", "It is readable.", "It is edible.", "It is
transparent.", "It is switched on.", "It is enterable.", "It is climbable."
The `read_text` property SHALL be settable via assertion: "The inscription
on the altar reads 'Beware the serpent.'" — `convert_source` SHALL extract
the quoted text and assign it to `read_text` of the named thing.
_Check:_ T363.

**REQ-319a — Extended parser command vocabulary (Part a).**
recognize the following additional commands, each registered as `standard` tier (REQ-283) and resolving against world-model property contracts defined in REQ-316 through REQ-318. When a target lacks the required property, the command SHALL return `[ERROR] [RULE_VIOLATION]` naming the missing property.

**REQ-319b — Extended parser command vocabulary (Part b).**
Object interaction commands: `wear` (target must be wearable and in inventory, sets `worn_by`), `remove` (clears `worn_by`), `eat` (target must be edible, removed from inventory), `drink` (target must be drinkable), `push`/`pull` (movable things), `insert` (put in, synonym for `put in`), `light`/`extinguish` (light sources), `switch on`/`switch off` (switchable targets). Inspection commands: `read` (returns `read_text` or description), `listen`/`smell` (reports sensory objects, LLM composes prose), `touch` (tactile properties).

**REQ-319c — Extended parser command vocabulary (Part c).**
Navigation commands: `climb` (climbable targets with associated exits), `enter` (enterable containers/vehicles), `exit`/`get out` (returns to parent room), `sit` (supporters, records sitting), `stand` (ceases sitting). Meta commands: `again`/`g` (repeats last command, session-local), `it`/`them`/`all` (pronoun disambiguation). `convert_source` directional exit adjacency SHALL associate a climbable thing with the exit in the same direction: when "A rope ladder is in the Entrance Chamber.

**REQ-319d — Extended parser command vocabulary (Part d).**
It is climbable." is followed by "Up of the Entrance Chamber is the Rookery.", the rope ladder SHALL be registered as the door for the `up` exit — `command("climb rope ladder")` SHALL resolve to `go up` through that exit. _Check:_ T364.
**REQ-320a — Narrative-intent parser verbs (Part a).**
commands that route narrative intent to the Game Master rather than resolving mechanically. These commands SHALL be registered under a new `narrative` parser category and SHALL be standard tier. They SHALL produce `[OK]` with a description of the expressed intent and SHALL NOT simulate conversation or adjudicate outcomes. The intent SHALL be surfaced in `badge_briefing` under a Player Intent section.

**REQ-320b — Narrative-intent parser verbs (Part b).**
The `ask` and `tell` commands resolve an NPC by name in the current room and record the topic intent; `give` transfers a thing from inventory to the NPC; `show` records intent without transferring; `throw` moves a thing to the target's room without equipping it. NPC resolution SHALL match by name substring against NPCs whose location matches the current room.

**REQ-320c — Narrative-intent parser verbs (Part c).**
When no NPC matches in the current room, the command SHALL still record the intent with a `[WARNING]` marker — the player may be calling through a door or across a chasm. `command("help")` SHALL list narrative verbs under their own category with a note that outcomes are determined by the Game Master. _Check:_ T365.
**REQ-197a — Room description generation (Part a).**
or issues a look command THE system SHALL return the room's name, its verbatim description, and visible things with containment chains expressed in a standard format. The description SHALL be drawn from the source text — no generative prose is appended. Exit directions SHALL appear in status-line context, not in the room-description body. The system SHALL support three description modes settable via `command("brief")`, `command("verbose")`, and `command("normal")` (default).

**REQ-197b — Room description generation (Part b).**
In `brief` mode, `command("look")` returns only the room name and exit directions — the verbatim description and visible things are suppressed. In `verbose` mode, every room entry prints the full verbatim description regardless of whether the player has seen the room before. `normal` mode prints the full description on first entry only; subsequent entries into seen rooms return the name and exits.

**REQ-197c — Room description generation (Part c).**
The mode persists for the session — it is discarded on connection close. `command("brief")` and `command("verbose")` are always recognized verbs, even when the world-model tier is empty. `spec_health` SHALL report the current description mode. The `player_signal` interface SHALL accept a `detail` signal with values `terse` (room name + exits only, minimal combat feedback — participant name + result, no full roll transparency), `normal` (balanced output), and `rich` (full descriptions, complete roll transparency, lore trigger notifications).

**REQ-197d — Room description generation (Part d).**
Setting `detail=terse` SHALL override both the room description mode and combat verbosity — all tool output follows the selected detail level. The detail signal is session-scoped (discarded on connection close) and visible in `badge_briefing` as a Player-Detail line. _Check:_ T240.
**REQ-198 — World-model CRUD.** THE system SHALL provide tools to create
and delete world-model object types: rooms, things, and exits. Every
mutation SHALL be snapshot-able, audit-logged, and Game Master only.
Creating a room SHALL accept a name and optional description. Creating a
thing SHALL accept a name, optional description, optional containment (a
room, container, or supporter), and optional properties (fixed/portable,
openable, lockable). Creating an exit SHALL accept a direction and two room
names; the reverse exit SHALL be created implicitly. Deleting a room SHALL
remove all contained things and connected exits from the world model.
_Check:_ T241.

**REQ-199 — Property state tracking.** THE system SHALL track either/or
properties on world-model objects. Openable objects (containers, doors)
SHALL have open/closed state. Lockable objects SHALL have locked/unlocked
state in addition to open/closed state. A closed container SHALL block
access to its contents — examining, taking, or interacting with contents
requires opening the container first. A closed door SHALL block passage
in both directions. Property mutations (open, close, lock, unlock) SHALL
be snapshot-able and audit-logged. _Check:_ T242.

**REQ-200 — Kind mechanical contracts.** The world-model layer SHALL define
mechanical contracts for the kinds extracted from the provider documentation:
containers (open/closed, contents blocked when closed), supporters (surface things
visible and reachable, supporter fixed by default), doors (connect two rooms,
open/closed, closed blocks passage), persons (visible, examinable in rooms),
backdrops (visible from every room in a defined region), and regions (named room
groups). Every thing SHALL have a portability classification: `portable` (may be
taken) or `fixed` (may not be taken). Supporters are fixed by default. Containers
and unclassified things are portable by default. Taking a fixed thing SHALL return
a rule-violation. _Check:_ T243.

**REQ-201 — Hybrid source conversion.** THE system SHALL provide a
`convert_source` tool that parses hybrid source text — declarative world-model
assertions interleaved with TTRPG annotations — into a linked world model +
TTRPG state. The tool operates only under the Game Master badge on an empty
Novel. Unrecognized assertion patterns SHALL produce not-implemented warnings
but SHALL NOT block recognized assertions.
_Check:_ T244.

**REQ-202a — World-model resources (Part a).**
URIs for the world-model tier: `room://<id>` (room name, description, visible things, exits), `thing://<id>` (thing name, description, location, properties), `world://map` (all rooms with exit connections — a navigable graph), `world://kinds` (kind hierarchy, property contracts, and parser command catalog from the indexed provider documentation).

**REQ-202b — World-model resources (Part b).**
All world-model resources SHALL be badge-filtered: the Player badge sees only descriptions and visible state; sees only descriptions and visible state; the Game Master badge sees metadata including property values and containment chains. `world://map` SHALL return a list of room names with directional exits formatted as a navigable adjacency list. _Check:_ T245.
**REQ-222a — Parser command vocabulary extension (Part a).**
additional command verbs from the ruleset's equipment, action descriptions, and mechanical procedures. Verbs discovered during extraction SHALL be registered in the parser command catalog alongside the base vocabulary (REQ-196). A discovered verb SHALL map to one or more parser command categories — navigation, inspection, object interaction, inventory, or wait — based on the ruleset context from which it was extracted. Verbs that do not fit an existing category SHALL be registered under a `ruleset_custom` category.

**REQ-222b — Parser command vocabulary extension (Part b).**
The registered vocabulary SHALL be exposed at `world://kinds` under `parser_commands` with each verb's category and extraction source. Discovery SHALL NOT fabricate verbs — every registered verb SHALL cite a ruleset anchor per REQ-010.

**REQ-222c — Parser command vocabulary extension (Part c).**
When no additional verbs are discovered, the base vocabulary (REQ-196) is the complete command set. *Acceptance criterion:* A ruleset whose equipment section mentions "push" and "pull" as object interactions registers `push` and `pull` under object interaction category with source anchors; a ruleset with no additional verbs exposes only the base vocabulary at `world://kinds/parser_commands`. _Check:_ T264.
**REQ-309a — World and narrative surface prominence (Part a).**
`TTRPG_WORLD_PROMINENCE` configuration with three levels controlling the default surface emphasis of world-model and narrative infrastructure tools across the help task map, `badge_briefing` composition, and `suggest_actions` intent mapping. The setting SHALL be a build-time configuration recorded in DECISIONS.md (1) and SHALL be server-scoped — it applies as the default to every Novel, overridable per-Novel by `set_help_category` (REQ-067) and `set_briefing_order` (REQ-082). TTRPG resolution authority is unchanged by this setting — it affects presentation, not mechanics.

**REQ-309b — World and narrative surface prominence (Part b).**
On ruleset-bound Novels, parser `command` and all parser verb names SHALL be Game Master only. The Player badge SHALL never see parser verb names in help, `suggest_actions`, or any tool output on a ruleset-bound Novel. The AI narrator resolves player spatial intent through `resolve_intent` (REQ-323); `suggest_actions` under the Player badge on a ruleset-bound Novel SHALL map spatial intents to `resolve_intent`, never `command`. In ruleset-free mode (B1=`none`), the parser is the primary Player surface (REQ-218) — the Player badge MAY call `command` and see parser verbs. At `visible` (default): World-model and narrative tools SHALL appear in primary help categories.

**REQ-309c — World and narrative surface prominence (Part c).**
Parser `command` SHALL appear in "World Inspection" (GM only). `badge_briefing` SHALL include a dedicated world-model state section with an empty-state marker when the world-model tier is unpopulated. `suggest_actions` SHALL return `resolve_intent` for spatial intents under both badges; under the Game Master badge, `suggest_actions` SHALL also return parser `command` for spatial intents for direct world-model inspection. At `secondary`: World-model tools SHALL be placed in a secondary help category.

**REQ-309d — World and narrative surface prominence (Part d).**
Parser `command` SHALL appear as "World Inspection" in the GM-only tool surface — it SHALL NOT appear in Player help. `badge_briefing` SHALL fold world-model state into the scene state section; narrative-tool sections SHALL render only when their data is non-empty. `suggest_actions` SHALL NOT return parser commands for exploration or navigation intents; Player-badge spatial intents SHALL map to `resolve_intent`.

**REQ-309e — World and narrative surface prominence (Part e).**
At `prominent`: Parser `command` SHALL be a top-level GM help entry under "World Inspection"; world CRUD tools SHALL appear in a primary setup category. `badge_briefing` SHALL include world-model state in the decision-critical group. `suggest_actions` under the Game Master badge SHALL prefer parser `command` for spatial inspection; under the Player badge, `suggest_actions` SHALL return `resolve_intent` for all spatial intents. In ruleset-free mode (B1=`none`), the setting SHALL be skipped — the world-model and narrative layers are the primary surface by definition (REQ-218).

**REQ-309f — World and narrative surface prominence (Part f).**
The builder SHALL NOT record a `TTRPG_WORLD_PROMINENCE` value in DECISIONS.md when B1 is `none`, and the intake question (B12) SHALL NOT be asked. *Acceptance criterion:* A build with `TTRPG_WORLD_PROMINENCE=visible` produces the default help categorization (world-model and narrative tools in primary help). `TTRPG_WORLD_PROMINENCE=prominent` places parser `command` as a top-level GM help entry and includes world-model state in the decision-critical briefing group. `TTRPG_WORLD_PROMINENCE=secondary` produces a minimized surface with world-model tools in secondary categories.

**REQ-309g — World and narrative surface prominence (Part g).**
At all levels, Player-badge `suggest_actions` returns `resolve_intent` for spatial intents — never `command`. The prominence setting applies uniformly across badges— Game Master and Player receive the same world-model state surface in `badge_briefing`. Per-badge prominence overrides are a recognized future extension (a GM building world content may prefer `prominent` display emphasis while the Player navigating it prefers `secondary` display emphasis) but are out of scope for this revision.

**REQ-309h — World and narrative surface prominence (Part h).**
On ruleset-bound Novels, parser `command` tool access is badge-gated independently of prominence — the Player badge can never call `command` directly regardless of `TTRPG_WORLD_PROMINENCE` value. On ruleset-free Novels (B1=`none`), the parser remains a primary Player surface and `command` SHALL accept the `player`, `game_master`, and `observer` badges (observer read-only). _Check:_ T353.
**REQ-325a — Constraint override catalog (Part a).**
overrides (REQ-324) at a `constraints://active` resource. The resource SHALL be badge-filtered: Game Master sees all overrides; Player sees overrides for the active entity only. Each override entry SHALL carry: constraint type, mechanic name, mechanic source (spell, class_feature, item, ability), prerequisites (level, spell slot count, item name), and source anchor. `spec_health` SHALL report `constraint_override_counts` by constraint type and by mechanic source.

**REQ-325b — Constraint override catalog (Part b).**
Error responses that cite a world-model constraint SHALL include override hints when the active entity possesses a relevant bypass: `[RULE_VIOLATION] The door is locked. Hint: Knock (1 slot remaining) can open it.` Hints SHALL be sourced from the override catalog at call time — never hardcoded. When the entity has no relevant override, hints SHALL be absent.

**REQ-325c — Constraint override catalog (Part c).**
Override hints SHALL be badge-filtered: Player-badge errors SHALL enumerate only the active entity's overrides; Game Master-badge errors SHALL enumerate all known overrides. *Acceptance criterion:* A character with Knock prepared attempts to pass a locked door — `resolve_intent("go north")` returns an override hint citing Knock. A character without knock receives no hint. `constraints://active` returns overrides badge-filtered. _Check:_ T369.
**REQ-326a — Scene-world coupling (Part a).**
that fuzzy-matches a world-model room name (case-insensitive, substring match with closest word-edit-distance for disambiguation), THE room SHALL become the scene's spatial truth. The room's description, exits, and contained visible things SHALL be composable into the scene's spatial reality.

**REQ-326b — Scene-world coupling (Part b).**
The GM's free-text `description` field SHALL serve as narrative framing of that reality — it may supplement or override the room's prose description but SHALL NOT contradict exit or containment data. `scene://current` SHALL include the resolved `room_id` and room name when a match exists. `resolve_intent` under the Game Master badge (for GM inspection) SHALL compose the full scene from room data and narrative framing. Under the Player badge, scene composition SHALL occur through AI narration via `resolve_intent` — the Player never sees room graph data directly.

**REQ-326c — Scene-world coupling (Part c).**
When the world model is unpopulated or no room name matches the location, `location` works as a free-text label (current behavior).

**REQ-326d — Scene-world coupling (Part d).**
Room-coupled scenes are backward compatible: unmatched location strings produce no spatial truth but remain valid scene labels. *Acceptance criterion:* `set_scene_state("The throne room", location="Throne Room")` where world model has room "Throne Room" with exits [north, south] and contained things [throne, chandelier] — `scene://current` includes `room_id`, and `resolve_intent` returns exits and things. `set_scene_state("The void", location="Nowhere")` where no room matches — `location` is a free-text label. _Check:_ T370.
**REQ-327a — NPC-world coupling (Part a).**
the world-model room graph. When an NPC's `location` string fuzzy-matches a room name, the NPC SHALL be registered in that room. `command("look")` or equivalent inspection SHALL list the NPC among the room's present entities. `create_npc` with a `location` matching a room name SHALL register the NPC in that room at creation time. `update_npc` changes to `location` SHALL re-register the NPC — removed from the prior room (if any) and registered in the new room (if matched). NPCs whose location does not match any room SHALL NOT be registered in a specific room — their location is a free-text label.

**REQ-327b — NPC-world coupling (Part b).**
Room-registered NPCs SHALL appear in `room_context` of `resolve_intent` results for that room. NPC presence in `badge_briefing` and `party://current` SHALL continue to be governed by `characters_present` on `set_scene_state` (REQ-307) — room registration supplements, it does not replace presence tracking. *Acceptance criterion:* `create_npc("Blacksmith", location="Forge")` where world model has room "Forge" — `resolve_intent("look")` from Forge lists Blacksmith. `update_npc("blacksmith", location="Inn")` — Blacksmith is no longer in Forge; listed in Inn.

**REQ-327c — NPC-world coupling (Part c).**
No matching room — Blacksmith carries free-text location only. _Check:_ T371.
**REQ-367a — Property propagation across containment (Part a).**
vehicle carries a property that affects perception of its contents, the property SHALL propagate from the container boundary. Propagation SHALL evaluate containment from outermost to innermost. An opaque or `dark` container at any level in the chain SHALL block perception of all recursively contained things — propagation SHALL stop at the first opaque boundary. Inner containers' `transparent` properties are irrelevant when an outer container is opaque.

**REQ-367b1 — Property propagation across containment (Part b1).**
A `transparent` container containing a `lit` and `switched_on` device SHALL report the device's light state to the room — "a glowing lantern (inside the glass case)." A `transparent` container containing a `lit` device that is `switched_off` SHALL NOT report light — "a dark lantern (inside the glass case)." A `dark` container SHALL block perception of its contents regardless of `transparent` — "a brass urn (opaque, what's inside is hidden)." A vehicle interior SHALL inherit the `lit`/`dark` state of the vehicle's exterior room unless the vehicle itself is `lit`. `command("look")` output SHALL reflect propagated state.

**REQ-367b2 — Property propagation across containment (Part b2).**
*Acceptance criterion:* A world model with a transparent jar containing a switched-on lantern in a dark room — `command("look")` reports "a glowing lantern (inside the glass jar)." Switch the lantern off — `command("look")` reports "a dark lantern (inside the glass jar)." Place the jar inside an opaque iron chest — `command("look")` does not mention the lantern.

**REQ-367c — Property propagation across containment (Part c).**
A vehicle in a dark cave with the vehicle itself `lit` — interior shows as lit; vehicle not `lit` — interior inherits dark. _Check:_ T418.
**REQ-368a — Countdown-world effect coupling (Part a).**
optional `world_effect` field. WHEN a countdown with `world_effect` fires, the effect SHALL be applied immediately after the countdown is removed from active countdowns.

**REQ-368b — Countdown-world effect coupling (Part b).**
The `world_effect.type` is one of `describe` (change room description), `property` (toggle a world-model property), or `exit` (open/close/create/remove an exit). `describe` with `target=<room_id>` and `value="<description>"` SHALL replace the target room's description field, preserving the prior description in the undo snapshot. `property` with `target=<thing_id>`, `property=<name>`, `value=<new_value>` SHALL set the target thing's property — only properties defined in REQ-318 are addressable. `exit` with `target=<room_id>`, `direction=<dir>`, `destination=<room_id>` SHALL create the exit per REQ-198 with implicit reverse exit.

**REQ-368c — Countdown-world effect coupling (Part c).**
All `world_effect` mutations are snapshot-able and surfaced in `badge_briefing` `narrative_threads` as `[countdown-effect]`. WHEN a countdown with `world_effect` fires and the referenced target has been deleted between creation and firing, the countdown SHALL still fire — removed from active countdowns and recorded in the audit log with a `[WARNING]` entry carrying the effect type, target ID, and `target missing — effect not applied` annotation. The countdown is not re-queued.

**REQ-368d — Countdown-world effect coupling (Part d).**
An `undo` that restores the deleted target before the countdown fires SHALL restore the effect's ability to apply. *Acceptance criterion:* `set_countdown("flood", 3, type="narrative", world_effect={type:"describe", target:"cellar", value:"Knee-deep water fills the cellar, rising fast."})`. Advance three narrative ticks — assert countdown fires, cellar room description replaced, prior description in undo snapshot.

**REQ-368e — Countdown-world effect coupling (Part e).**
Create countdown with `world_effect.target="nonexistent"` and fire — assert `[WARNING] target missing — effect not applied` in audit log. _Check:_ T419. *Out of scope:* multiplayer synchronization, real-time collaborative editing, save-Novel versioning beyond the checksum model, and Novel migration between different rulesets.

### 5.11 Ruleset-Free Build Mode

**REQ-218a — Ruleset-free build (Part a).**
`none` THE builder SHALL operate in ruleset-free mode. THE builder SHALL NOT perform chunked reading, extraction, or mechanical modeling of ruleset content. THE server SHALL register every REQ-020 infrastructure tool category (World, Novels, Narrative, Badges & Workflow), every REQ-022 resource URI, and every REQ-023 prompt. Ruleset-dependent tools — canonical lookups, dice-resolution tools, and any tool whose registry depends on extracted mechanics — SHALL be waived under REQ-013 or registered with empty domains that return content-absent responses.

**REQ-218b — Ruleset-free build (Part b).**
The world-model layer (§5.10) SHALL be populated from the provider documentation indexed at the B10 intake path. `search_rules` SHALL return an empty result set with a clear message indicating no ruleset is indexed. `roll_on_table` SHALL return the content-absent message per REQ-214. Navigational couplings (§7.7.1) SHALL be active — World→Scene, Scene→Lore, Scene→Countdown, and other Advisory/Navigational nature rows function in ruleset-free mode.

**REQ-218c — Ruleset-free build (Part c).**
Mechanical couplings (Mechanics→World, Mechanics→NPC, and Ruleset Wisdom couplings) SHALL be inert — no ruleset means no mechanical resolution to drive coupling effects. Verification workflow G0b and G2 SHALL use the Appendix W fixture in place of Appendix B or N. Handoff verification steps H1 and H10 SHALL be skipped for ruleset-free builds — there is no source edition/title to compare and no extraction confidence to measure. _Check:_ T259.
**REQ-219a1 — Ruleset-free entity creation (Part a) (Part a1).**
When the ruleset defines no classes, species, or equipment, THE `create_character` tool SHALL accept a name and optional personality fields per REQ-077 (description, voice, background, goals). The tool SHALL produce a roster entry with no mechanical fields — only name and narrative fields. The `character_sheet` rendering for a ruleset-free entity SHALL display the entity's name and populated personality fields; no stat block is rendered. Import into a Novel follows the standard import contract (REQ-055). The roster entry is a permanent baseline; its narrative fields are mutable per REQ-077.

**REQ-219a2 — Ruleset-free entity creation (Part a) (Part a2).**
The entity is valid as a combat participant in `init_combat` — it receives a turn in the order and auto-advances with an `[auto]` marker without mechanical effects (dangers and entities have no hit points, no damage, and no death state). `suggest_actions` SHALL include the entity's name and narrative fields in context but SHALL return no mechanical action suggestions. _Check:_ T260.
**REQ-219b — Ruleset-free entity creation (Part b).**
Ruleset-free and character-data-less creation share the profile-only contract (REQ-219a1, REQ-399c): a character carries no mechanical statistics, and any request for them returns a named error naming the missing condition. _Check:_ T260.

---

### 5.12 Narrative Architecture

The REQs in this section extend existing infrastructure — scene state (REQ-076,
REQ-087), factions (REQ-233), NPCs (REQ-075, REQ-077), countdowns (REQ-073),
badge briefing (REQ-109), intents (REQ-084, REQ-323), relationships (REQ-236),
voice examples (REQ-077), knowledge (REQ-308, REQ-286), and the world-model
layer (§5.10) — with dramaturgical primitives, autonomous cast behavior, and
a unified intent pipeline. Together they compose the server's narrative engine:
the machinery that transforms state management into story emergence.

**REQ-335a — Scene beat taxonomy (Part a).**
annotation alongside scene type (REQ-087). Valid beat values are: `setup`, `escalation`, `turning_point`, `climax`, `resolution`, and `denouement`. Beats SHALL be set via `set_scene_state` as an optional `beat` parameter and via `set_scene_type` as a `beat` parameter. The current beat SHALL surface in `badge_briefing` as a sub-element of the scene state section, immediately after the scene type tag, in the form `Beat: <beat>`.

**REQ-335b — Scene beat taxonomy (Part b).**
A scene without an explicit beat SHALL carry the default `mid_scene`. `session_recap` SHALL include beat transitions alongside scene transitions in the `scene_transitions` array as `beat_before` and `beat_after` pairs. A scene transition that retains the same beat SHALL NOT record a beat transition. The beat taxonomy is descriptive — the GM may set any beat at any time; the server does not enforce beat progression sequences.

**REQ-335c — Scene beat taxonomy (Part c).**
Scene beat SHALL influence countdown advancement rate per REQ-353. *Acceptance criterion:* `set_scene_state("The hall darkens", beat="escalation")` surfaces `Beat: escalation` after the scene type tag in `badge_briefing`. `session_recap` includes `beat_transitions` showing `{from: "mid_scene", to: "escalation", timestamp: <ISO>}`. Setting the same beat on consecutive `set_scene_state` calls produces no beat transition entry. _Check:_ T385.
**REQ-353 — Beat-accelerated countdown advancement.** Scene beat SHALL influence
countdown advancement rate per the coupling table (§7.7.1a). The acceleration
multiplier SHALL be configurable via `TTRPG_CLIMAX_ACCELERATION`; setting it
to 1 disables acceleration. Acceleration SHALL apply only to
`on_scene_transition` countdowns.
*Acceptance criterion:* `climax` beat with a 5-tick `on_scene_transition`
countdown advances 2 ticks per scene transition. Setting
`TTRPG_CLIMAX_ACCELERATION=1` disables acceleration (1 tick per transition).
Changing beat away from `climax` reverts to standard rate.
_Check:_ T404.

**REQ-336a — Dramatic pacing signal (Part a).**
tool calls (mutating and non-mutating) since the last scene transition or beat change. When the count exceeds a configurable ceiling (`TTRPG_PACING_WINDOW`), `badge_briefing` SHALL include a pacing signal in the `narrative_threads` section (REQ-281): `[pacing] Scene stabilized — N actions since last transition.` The signal is advisory — it does not block or auto-advance narration. The ceiling SHALL be configurable via `TTRPG_PACING_WINDOW`; setting it to zero disables pacing signals. The pacing counter resets on every `set_scene_state` call (scene transition) and on every beat change.

**REQ-336b — Dramatic pacing signal (Part b).**
When a pacing signal fires, the server SHALL additionally trigger autonomous advancement per REQ-351. *Acceptance criterion:* After 21 tool calls with no scene transition, `badge_briefing` includes `[pacing] Scene stabilized — 21 actions since last transition.` After `set_scene_state("new scene")`, the counter resets and the signal disappears. Setting `TTRPG_PACING_WINDOW=0` suppresses all pacing signals. _Check:_ T386.
**REQ-351a — Pacing-triggered autonomy (Part a).**
REQ-336, the server SHALL immediately perform one autonomous advancement cycle: (a) every faction clock SHALL receive one autonomous tick per REQ-338 (regardless of whether the `TTRPG_FACTION_AUTONOMY_INTERVAL` threshold has been met — the pacing signal overrides the interval), and (b) every NPC with a populated `goals` field SHALL produce a goal pursuit suggestion per REQ-339 (regardless of disposition change status — the pacing signal triggers suggestions for all goal-carrying NPCs). The combined advancement SHALL be recorded in the audit log as `[pacing-autonomy]` with a list of factions and NPCs affected.

**REQ-351b — Pacing-triggered autonomy (Part b).**
The REQ-348 faction-NPC coordination rule SHALL apply during pacing-triggered autonomy: if a faction tick outcome overlaps an NPC's goal, that NPC's suggestion SHALL be suppressed as normal. Pacing-triggered autonomy SHALL fire at most once per `TTRPG_PACING_WINDOW` window — if play continues without a scene transition past a second window, the pacing signal re-fires but autonomy does not re-trigger until a scene transition resets the pacing counter. This contract implements the narrative intuition that "while you were deliberating, the world moved." *Acceptance criterion:* Set `TTRPG_PACING_WINDOW=3`.

**REQ-351c — Pacing-triggered autonomy (Part c).**
Create faction with clock and NPC with goal. Perform 4 tool calls without scene transition — assert pacing signal fires AND audit log records `[pacing-autonomy]` with faction tick and NPC suggestion. Perform 4 more tool calls — assert pacing signal re-fires but `[pacing-autonomy]` does NOT re-trigger (already fired this window). Call `set_scene_state("new scene")` — assert counter resets. Perform 4 more tool calls — assert `[pacing-autonomy]` fires again. _Check:_ T401.
**REQ-337a — Narrative arc visibility (Part a).**
`badge_briefing` (REQ-281) SHALL include a `story_beats` line showing the sequence of completed beats within the current Novel in chronological order, gated by badge scope: `shared` beats visible to both badges; `game_master` beats visible to GM only. The sequence SHALL list beat names with the scene description preview (first sentence) that produced them, e.g., `setup (\"The hall is quiet...\") -> escalation (\"The torches flicker...\")`. An empty sequence SHALL render `[No beats completed.]`.

**REQ-337b — Narrative arc visibility (Part b).**
The sequence SHALL NOT exceed the most recent 10 completed beats. *Acceptance criterion:* After three `set_scene_state` calls with beats `setup`, `escalation`, `climax`, `badge_briefing` includes the three-beat sequence. After 12 beat transitions, only the most recent 10 appear. An empty sequence renders the empty-state marker. _Check:_ T387.
**REQ-352a — Codex adventure beat sequences (Part a).**
`adventure` (REQ-321) MAY carry an optional `suggested_beats` field — an array of `{beat, scene_preview}` pairs where `beat` is a valid beat value per REQ-335 and `scene_preview` is a one-sentence scene descriptor. When a Novel is created via `create_novel(codex_adventure=...)` (REQ-088) or an adventure is imported via `codex_import` (REQ-321) into an active Novel, and the adventure entry carries `suggested_beats`, the sequence SHALL pre-populate the `story_beats` briefing surface (REQ-337) with `[adventure-scaffold]` annotation.

**REQ-352b — Codex adventure beat sequences (Part b).**
Scaffold beats are advisory — the GM may override any beat via `set_scene_state(beat=...)` at any time. A GM-set beat at a scaffold position replaces the scaffold entry. Scaffold beats SHALL NOT appear in `beat_transitions` in `session_recap` until a scene transition actually adopts them — only GM-confirmed or auto-adopted beats enter the transition history.

**REQ-352c — Codex adventure beat sequences (Part c).**
Adventure entries without `suggested_beats` SHALL produce no pre-population. *Acceptance criterion:* Create Codex adventure entry with `suggested_beats: [{beat: "setup", scene_preview: "The tavern is quiet..."}, {beat: "escalation", scene_preview: "A fight breaks out..."}]`. Call `create_novel(codex_adventure=...)` — assert `badge_briefing` `story_beats` shows both beats tagged `[adventure-scaffold]`. Call `set_scene_state("The tavern hums", beat="setup")` — assert first scaffold beat replaced, no `[adventure-scaffold]` tag on this entry.

**REQ-352d — Codex adventure beat sequences (Part d).**
Advance to second beat — assert second scaffold beat still tagged `[adventure-scaffold]` until GM confirms it. Call `codex_import` of an adventure WITHOUT `suggested_beats` — assert no beat pre-population. _Check:_ T402.
**REQ-338a — Faction autonomous advancement (Part a).**
SHALL advance one tick on each scene transition per the existing coupling contract. In addition, faction clocks SHALL advance one autonomous tick per `TTRPG_FACTION_AUTONOMY_INTERVAL` scene transitions (configurable) to represent faction pursuit of goals off-screen. The autonomous tick SHALL be recorded in the faction's clock with an `[autonomous]` annotation. Faction clocks with `TTRPG_FACTION_AUTONOMY_INTERVAL` set to zero SHALL NOT receive autonomous ticks — only scene-transition and GM-triggered advancement applies.

**REQ-338b — Faction autonomous advancement (Part b).**
Autonomous advancement SHALL NOT fire linked countdowns without GM awareness: when an autonomous tick would fire a linked countdown, the countdown SHALL surface a `[pending-fire]` annotation in `badge_briefing` `narrative_threads` section (REQ-281) requiring GM confirmation via a workflow decision. *Acceptance criterion:* A faction with `TTRPG_FACTION_AUTONOMY_INTERVAL=3` advances its clock by one autonomous tick on the 3rd, 6th, and 9th scene transition. The tick is annotated `[autonomous]` in the clock state.

**REQ-338c — Faction autonomous advancement (Part c).**
An autonomous tick that would fire a linked countdown produces a `[pending-fire]` decision in `badge_briefing`. Setting the interval to zero suppresses all autonomous advancement. _Check:_ T388. Coordination with NPC goal pursuit per REQ-348.
**REQ-339a — NPC goal pursuit (Part a).**
(REQ-077) and the NPC's current disposition differs from its creation default, `badge_briefing` SHALL surface a `## World in Motion` suggestion once per scene transition: the NPC's name, its current goal, a brief description of what the NPC might do to pursue that goal off-screen, and three response options: `accept` (apply the described state change), `defer` (re-surface at next transition), `dismiss` (do not re-surface). The suggestion SHALL be derived from the NPC's goals text and disposition, surfaced as a decision workflow.

**REQ-339b — NPC goal pursuit (Part b).**
Deferred suggestions SHALL re-appear at every subsequent scene transition until accepted or dismissed. Dismissed suggestions SHALL NOT re-appear for the same NPC in the same Novel. The feature is disabled by default (`TTRPG_NPC_AUTONOMY=off`); the GM enables it per Novel. *Acceptance criterion:* Create an NPC with `goals="Steal the crown"` and `disposition="suspicious"` (differs from default `neutral`). Set `TTRPG_NPC_AUTONOMY=on`. Call `set_scene_state("Throne room")` — assert `badge_briefing` `## World in Motion` includes a goal-pursuit suggestion.

**REQ-339c — NPC goal pursuit (Part c).**
Accept it — assert the described state change applies, suggestion does not re-appear. Defer — assert it re-appears at next transition. Dismiss — assert it does not re-appear. `TTRPG_NPC_AUTONOMY=off` — assert no suggestions. _Check:_ T389.
**REQ-348a — Faction-NPC goal coordination (Part a).**
autonomous tick per REQ-338, the server SHALL compare the faction's goal description against each NPC's `goals` field. If a faction clock advancement represents an outcome that overlaps with an NPC's current goal — the faction name or goal text intersects the NPC's goal text — the NPC goal pursuit suggestion for that NPC SHALL be suppressed for that scene transition. The suppression SHALL be recorded in the audit log as `[faction-npc-coordination]` with the faction ID, NPC ID, and suppressed goal text.

**REQ-348b — Faction-NPC goal coordination (Part b).**
The suppression is per-transition: if the next scene transition produces no autonomous tick, the NPC goal pursuit SHALL resume. When `TTRPG_NPC_AUTONOMY=off`, faction autonomous advancement SHALL proceed normally per REQ-338 without NPC coordination. The contract prevents duplicate World-in-Motion events for the same narrative outcome. *Acceptance criterion:* Create faction "Merchant Guild" with goal "Expand to East Dock". Create NPC "Guildmaster Kael" with `goals="Secure the East Dock contract"`. Set `TTRPG_FACTION_AUTONOMY_INTERVAL=3` and `TTRPG_NPC_AUTONOMY=on`.

**REQ-348c — Faction-NPC goal coordination (Part c).**
Advance through 3 scene transitions — assert autonomous tick fires, faction clock advances, and Guildmaster Kael's goal pursuit suggestion is suppressed with `[faction-npc-coordination]` audit entry. Advance 1 more transition (no faction tick) — assert Kael's goal pursuit resumes. _Check:_ T398.
**REQ-340a — Discovered consequences (Part a).**
active entity's characters are not present in the scene where the countdown was linked — entity IDs absent from `characters_present` on all scenes since the countdown was created — the consequence SHALL be surfaced as a `[discovered]` story journal entry of type `consequence` (REQ-246). The entry SHALL carry: the countdown name, the consequence description, the timestamp of discovery (the scene transition when the player's entity next becomes present in a scene linked to the countdown's location), and a `discovered` boolean set to `true`.

**REQ-340b — Discovered consequences (Part b).**
The entry SHALL appear in `session_recap` `narrative_orientation` as a "Meanwhile, ..." prose fragment. Countdowns that fire while the player's entity IS present SHALL produce standard `consequence` entries with `discovered` unset. A `[discovered]` consequence SHALL populate the discovering entity's `knowledge_state` per REQ-349. *Acceptance criterion:* Create a countdown linked to Guard Room. Set entity absent (not in `characters_present`). Advance countdown to fire. Set entity present in Gatehouse scene (different location). Advance scene — no discovery.

**REQ-340c — Discovered consequences (Part c).**
Set entity present in Guard Room scene — assert `[discovered]` story journal entry created with "Meanwhile, ..." orientation text. Countdown fires with entity present — assert standard `consequence` entry without `discovered`. _Check:_ T390.
**REQ-349a — Consequence-to-knowledge coupling (Part a).**
consequence fires per REQ-340, the discovering entity's `knowledge_state` (REQ-286) SHALL be populated with a `discovered_consequence` entry carrying: the countdown name, the consequence description, the timestamp of discovery, and a `source: discovered_consequence` field with the countdown ID. The entry SHALL surface in `badge_briefing` under the `knowledge_state` section token as `[discovered]` followed by the consequence text.

**REQ-349b — Consequence-to-knowledge coupling (Part b).**
If the discovering entity was absent from all scenes since the countdown's creation (per REQ-340 presence check), the discovery represents genuine new knowledge — the entity SHALL know what happened off-screen. If multiple entities discover the same consequence (are all present when the countdown location is reached), each entity's `knowledge_state` SHALL receive the entry independently. Consequence knowledge SHALL persist in `knowledge_state` across scene transitions and Novel restarts. *Acceptance criterion:* Create countdown linked to Guard Room. Set rogue_01 absent. Advance countdown to fire.

**REQ-349c — Consequence-to-knowledge coupling (Part c).**
Set scene to Guard Room with rogue_01 present — assert `[discovered]` story journal entry AND `knowledge_state` includes `discovered_consequence` entry. Create countdown linked to Forge. Set rogue_01 and wizard_01 absent. Advance to fire. Set scene to Forge with both present — assert both entities receive the knowledge entry. _Check:_ T399.
**REQ-341a — Player-facing spatial surface (Part a).**
populated (REQ-195), the Player badge SHALL have access to a resolved spatial surface through `badge_briefing`: the scene state section SHALL include the current room name, visible exits (direction labels only — not destination names), and visible things in the room. The spatial surface SHALL NOT include room IDs, exit destination IDs, or world-model internal names.

**REQ-341b — Player-facing spatial surface (Part b).**
The AI narrator resolves the player's spatial intent through `resolve_intent` (REQ-323) without exposing parser mechanics; the spatial surface in `badge_briefing` gives the player direct awareness of surroundings without requiring the AI narrator to explicitly describe every detail.

**REQ-341c — Player-facing spatial surface (Part c).**
When the world-model tier is unpopulated, no spatial surface appears — the empty-state marker renders `[No world model — surroundings are as described by the GM.]`. *Acceptance criterion:* A populated world model with rooms, exits, and things produces a spatial surface in Player `badge_briefing` containing the room name, exit directions, and visible things — without IDs or internal names. An unpopulated world model produces the empty-state marker. _Check:_ T391.
**REQ-342a — Scene description from world-model state (Part a).**
is called with a `location` parameter that resolves to a world-model room (REQ-195), the scene SHALL derive a base description from the room's world-model state: the room description string, a list of contained things, a list of visible NPCs registered in the room (REQ-327), and visible exits with their direction labels. The GM's `description` parameter SHALL override the derived description. When `description` is empty and `location` resolves, the derived world-model description SHALL serve as the scene description.

**REQ-342b — Scene description from world-model state (Part b).**
When `location` does not resolve to any room, the `description` parameter SHALL be the sole scene description as before. This contract ensures the GM describes a room once — the world model is the source of spatial truth. *Acceptance criterion:* `set_scene_state("", location="Throne Room")` with the Throne Room containing a throne thing and two NPCs produces a scene description derived from the room description and its contents. The same call with an explicit `description` parameter uses the explicit description. A `location` that does not match any room uses the `description` alone. _Check:_ T392.
**REQ-343a — Unified intent resolution (Part a).**
(REQ-084) SHALL resolve player intent across three domains — mechanical (resolution tools), spatial (resolve_intent, REQ-323), and social (NPC interaction, disposition context, persuasion) — and return suggested actions from all matching domains in the response, grouped by domain. The response SHALL include, for each domain with at least one match: a domain header, the matching tools or actions with parameters, and a confidence indicator for each match. When the intent spans multiple domains, `suggest_actions` SHALL return suggestions from all matching domains ordered by relevance.

**REQ-343b — Unified intent resolution (Part b).**
The tool SHALL accept an optional `entity_id` parameter; when provided, entity-specific context (personality fields per REQ-077, voice examples, equipment, known abilities) SHALL be included in the match weighting. Spatial domain results SHALL delegate to `resolve_intent` (REQ-323) for exit, constraint, and thing context. The intent resolver SHALL call `resolve_intent` with the player's spatial intent — the response SHALL incorporate the resolved room context, exits, constraints, and override hints — rather than independently querying the world model.

**REQ-343c — Unified intent resolution (Part c).**
This ensures spatial suggestions and parser-based navigation draw from the same resolution pipeline. Social intents SHALL resolve against: the target NPC's disposition (REQ-075), the caller entity's relationship to the target (REQ-236), any active scene type of `social` (REQ-087), and the ruleset's social-skill catalogue.

**REQ-343d — Unified intent resolution (Part d).**
The resolution SHALL return: the most relevant skill check tool with the target NPC's name as context, any available constraint overrides that could affect the outcome (REQ-325), and a narrative framing hint derived from the NPC's personality fields. *Acceptance criterion:* `suggest_actions("convince the guard to let us pass", entity_id="bard_01")` returns mechanical suggestions (skill check with persuasion), spatial context (current room exits), and social context (guard's disposition, relationship). A purely mechanical intent ("attack the goblin") returns only mechanical suggestions. _Check:_ T393.
**REQ-344a — Voice example feedback (Part a).**
provide feedback on the AI narrator's portrayal of their entity's voice through `player_signal` (REQ-078). A `signal="voice_feedback"` with a `value` containing a corrected dialogue snippet SHALL cause the server to: (a) append the corrected snippet to the entity's `voice_examples` array (REQ-077) tagged `[player-corrected]` with the original snippet context; (b) record a `[voice-feedback]` entry in the audit log (REQ-040) with the original and corrected text; (c) surface the correction in `badge_briefing` under the entity's personality group as a `[voice-corrected]` annotation on the relevant voice example.

**REQ-344b — Voice example feedback (Part b).**
A correction replaces the AI-generated snippet's `dialogue` text while preserving `context` and `tag` fields. The `[player-corrected]` annotation SHALL render visually distinct from synthesis `[supplementary]` tags (REQ-080) and Codex `[codex-corrected]` tags (REQ-347) in `badge_briefing` — each annotation reflects a different provenance tier (player feedback, community synthesis, cross-Novel Codex import). The Player may issue up to 3 corrections per session (configurable via `TTRPG_MAX_VOICE_CORRECTIONS_PER_SESSION`); exceeding the limit SHALL return `[WARNING] Voice correction limit reached for this session.`.

**REQ-344c — Voice example feedback (Part c).**
The limit resets on `TTRPG_SESSION_ID` change per REQ-237. Voice corrections SHALL be capturable to the Codex for cross-Novel persistence per REQ-347. *Acceptance criterion:* `player_signal("voice_feedback", "She wouldn't say that — she'd say 'The door is trapped. Stand back.'")` appends a `[player-corrected]` snippet. `badge_briefing` shows the correction. `character_sheet` shows the updated voice example. Fourth correction in same session returns `[WARNING]`. Session ID change resets the limit. _Check:_ T394.
**REQ-347a — Voice feedback codex capture (Part a).**
in entity `voice_examples` per REQ-344 SHALL be capturable to the Codex (REQ-321) via `codex_capture("voice_profile", entity_id, update_source=true)`. A Codex entry of kind `voice_profile` SHALL store: the entity's name, the corrected dialogue snippets with preserved `context` and `tag` fields, the original AI-generated text for each correction, the Novel slug where corrections were made, and the entity's background text.

**REQ-347b — Voice feedback codex capture (Part b).**
When `codex_import` imports a `voice_profile` into a Novel, the corrected voice examples SHALL populate the matching entity's `voice_examples` field tagged `[codex-corrected]`, visually distinct from `[player-corrected]` (REQ-344) and `[supplementary]` (REQ-080) in `badge_briefing` rendering. A Codex `voice_profile` SHALL NOT contain mechanical stats — it carries only personality and voice fields (REQ-077).

**REQ-347c — Voice feedback codex capture (Part c).**
The `update_source` flag SHALL push Novel-level voice corrections back to the source Codex entry in-place, matching the bidirectional sync contract of REQ-321. *Acceptance criterion:* Call `player_signal("voice_feedback", "She wouldn't say that — she'd say 'Stand back.'")` on an entity. Call `codex_capture("voice_profile", entity_id, update_source=true)` — assert Codex entry created with corrected dialogue, original text, and Novel provenance. Call `codex_import("<id>")` into a new Novel — assert entity voice_examples tagged `[codex-corrected]`. _Check:_ T397.
**REQ-345a — Background-derived knowledge (Part a).**
beyond presence-scoped percepts (REQ-308). When an entity's personality fields include a populated `background` string (REQ-077), the `knowledge_state` briefing section (REQ-286) SHALL include a `background_knowledge` subsection listing the entity's background text and a boundary directive for the AI narrator: "The character may know things their background implies — regional geography from 'soldier', academic knowledge from 'sage', underworld contacts from 'criminal' — without needing to have witnessed them in a scene.

**REQ-345b — Background-derived knowledge (Part b).**
The AI narrator SHALL surface plausible background knowledge when the scene context makes it relevant, and SHALL NOT gate such knowledge on presence." The subsection SHALL be present when `background` is populated; absent when empty. Background knowledge is advisory — it instructs the AI narrator to permit reasonable inference but does not populate the `knowledge_state` with explicit facts.

**REQ-345c — Background-derived knowledge (Part c).**
The background string SHALL additionally be matched against lore entry triggers per REQ-350. *Acceptance criterion:* Create entity with `background="Veteran of the Border Wars"`. `badge_briefing` `knowledge_state` includes `background_knowledge` subsection with the background text and boundary directive. Entity with empty `background` — subsection absent. _Check:_ T395.
**REQ-350a — Background lore triggering (Part a).**
string SHALL be tokenized into keywords. The server SHALL match those keywords against the trigger lists (REQ-083) of all active lore entries in the Novel. Lore entries whose triggers intersect the background keyword set SHALL surface in the entity's `badge_briefing` `knowledge_state` subsection tagged `[background-relevant]`, with the lore entry key, a content preview, and the matched trigger word. The match is advisory — it informs the AI narrator that this lore may relate to the character's background but does not automatically reveal the lore's full content or populate `knowledge_state` with explicit facts.

**REQ-350b — Background lore triggering (Part b).**
Background lore matching SHALL NOT fire on lore entries tagged `game_master`-scope (REQ-083 badge_scope) — only `shared`-scope entries are matched. The match SHALL re-evaluate on every `badge_briefing` render to accommodate lore entry additions and removals during play. *Acceptance criterion:* Create entity with `background="Veteran of the Border Wars"`. Create lore entry `border_treaty` with triggers `["border", "war", "treaty"]` and `badge_scope="shared"`. Call `badge_briefing` — assert `knowledge_state` includes `[background-relevant]` subsection listing `border_treaty` with matched trigger "war".

**REQ-350c — Background lore triggering (Part c).**
Create lore entry `gm_secret` with triggers `["war"]` and `badge_scope="game_master"` — assert it does NOT appear in Player `badge_briefing` background matches. Create entity with empty `background` — assert `[background-relevant]` subsection absent. _Check:_ T400.
**REQ-355a — Secret-countdown coupling (Part a).**
entity via `reveal_secret` (REQ-234) AND a countdown exists whose `scope` or `direction` text references the secret's key, THE server SHALL surface an advisory in the `narrative_threads` briefing section (REQ-281) suggesting the countdown be advanced. The advisory SHALL carry the secret's key, the countdown name, and a prompt for the GM to advance or ignore.

**REQ-355b — Secret-countdown coupling (Part b).**
This is a navigational coupling — the server suggests; the GM decides. *Acceptance criterion:* Create a secret "betrayal" and a countdown with `scope` containing the term "betrayal." Call `reveal_secret("betrayal", "pc_01")` — assert `badge_briefing` `narrative_threads` includes a countdown-advancement advisory referencing the secret and countdown. Create a secret and countdown with no overlap — assert no advisory. _Check:_ T406.
**REQ-356a — Vow-lore coupling (Part a).**
AND an active lore entry exists whose `triggers` or `key` intersect the vow's `name` or `description` text, THE server SHALL surface matching lore entries in the `narrative_threads` briefing section (REQ-281) tagged `[vow-relevant]`. The match SHALL re-evaluate on each `badge_briefing` render. This is a navigational coupling — lore is surfaced as guidance, not auto-revealed. *Acceptance criterion:* Create lore entry "crown_of_alara" with trigger "crown".

**REQ-356b — Vow-lore coupling (Part b).**
Call `set_vow("Find the Crown", "Retrieve the Crown of Alara", ...)` with at least one party member — assert `badge_briefing` `narrative_threads` includes `[vow-relevant] crown_of_alara` with content preview. Call `resolve_vow` — assert the match no longer appears on next briefing. _Check:_ T407.
**REQ-357a — Story journal-faction coupling (Part a).**
of type `consequence` or `moment` is recorded via `record_story` (REQ-246) AND a faction exists whose `goals` text references an entity or location named in the entry, THE server SHALL surface a faction-clock-advancement advisory in the `narrative_threads` briefing section (REQ-281). The advisory SHALL carry the faction name, the matching goal text, the story entry preview, and a prompt for the GM to advance or ignore.

**REQ-357b — Story journal-faction coupling (Part b).**
This is a navigational coupling — the server suggests; the GM decides. *Acceptance criterion:* Create faction "Merchant Guild" with goal "Control the docks." Call `record_story("consequence", "The docks were destroyed")` — assert `badge_briefing` `narrative_threads` includes faction-clock-advancement advisory referencing the Merchant Guild. Call `record_story("moment", "The sunset was beautiful")` — assert no advisory (no entity or location overlap). _Check:_ T408.
**REQ-358a — Countdown-NPC disposition coupling (Part a).**
via `advance_countdown` or scene transition (REQ-073, REQ-125) AND an NPC exists whose `location` matches the countdown's `scope`, THE NPC's disposition SHALL shift toward the countdown's `direction`: `hostile` countdowns shift the NPC toward `hostile` disposition; `benign` countdowns shift toward `friendly`. The shift SHALL be one step on the disposition scale — `neutral` to `suspicious`, `friendly` to `neutral`, and so on. The shift SHALL be recorded in the audit log with `[countdown-disposition]` annotation carrying the NPC ID, countdown name, and disposition change.

**REQ-358b — Countdown-NPC disposition coupling (Part b).**
This is a mechanical coupling — disposition changes automatically on countdown fire. *Acceptance criterion:* Create NPC "Guard" with `disposition="neutral"`, `location="gatehouse"`. Create `hostile`-direction countdown with `scope="gatehouse"`. Fire the countdown — assert Guard's disposition shifts to `suspicious` with `[countdown-disposition]` audit entry. Create `benign`-direction countdown — fire — assert Guard shifts back to `neutral`. NPC outside countdown scope — assert no shift. _Check:_ T409.
**REQ-359a — Relationship-countdown coupling (Part a).**
changes from `ally` to `rival` or `hostile` via `set_relationship` (REQ-236) AND a countdown exists whose `scope` or `direction` text references either entity in the relationship, THE server SHALL surface an advisory in the `narrative_threads` briefing section (REQ-281) suggesting the countdown be advanced or a new countdown be created to represent the fallout. The advisory SHALL carry both entity names, the relationship change, and the matching countdown name. This is a navigational coupling — the server suggests; the GM decides. *Acceptance criterion:* Create countdown with `scope="alliance"`.

**REQ-359b — Relationship-countdown coupling (Part b).**
Call `set_relationship("pc_01", "npc_guard", "ally")`. Then call `set_relationship("pc_01", "npc_guard", "rival")` — assert `badge_briefing` `narrative_threads` includes relationship-countdown advisory referencing the countdown. Flip relationship where no matching countdown exists — assert no advisory. _Check:_ T410.
**REQ-360a — Lore-countdown coupling (Part a).**
updated via `set_lore_entry` or `update_lore_entry` (REQ-083) AND the lore entry's `triggers` include temporal urgency keywords ("imminent," "approaching," "deadline," "ticking," "countdown") AND no countdown exists whose `name` or `scope` matches the lore entry's `key`, THE server SHALL surface a countdown-creation advisory in the `narrative_threads` briefing section (REQ-281) suggesting a countdown be created from the lore entry's content. The advisory SHALL carry the lore entry key, the matched urgency trigger, and a prompt for the GM to create or ignore.

**REQ-360b — Lore-countdown coupling (Part b).**
This is a navigational coupling — the server suggests; the GM decides. *Acceptance criterion:* Call `set_lore_entry("impending-raid", "The goblins are marching — they will be here by nightfall.", triggers=["raid", "imminent"])` — assert `badge_briefing` `narrative_threads` includes a countdown-creation advisory referencing "impending-raid" and the "imminent" trigger. Call `set_lore_entry("forest-lore", "The woods are old and deep.", triggers=["forest"])` — assert no advisory (no urgency keywords). Create countdown with matching name — assert advisory suppressed. _Check:_ T411.
**REQ-361a — NPC-vow coupling (Part a).**
(REQ-077) AND the GM calls `badge_briefing`, THE `narrative_threads` section (REQ-281) SHALL include a vow-creation suggestion for each goal-carrying NPC whose goal text exceeds 20 characters and does not already match an active vow's `description`. The suggestion SHALL carry the NPC name, the goal text, and a prompt for the GM to create a corresponding vow via `set_vow` (REQ-289). This is a navigational coupling — the server suggests; the GM decides.

**REQ-361b — NPC-vow coupling (Part b).**
An NPC whose goal text already appears in an active vow's `description` SHALL NOT produce a suggestion. *Acceptance criterion:* Create NPC "Blacksmith" with `goals="Forge the legendary blade Starfang"`. Invoke `badge_briefing` — assert `narrative_threads` includes vow-creation suggestion naming the Blacksmith and their goal. Call `set_vow("Forge Starfang", "Forge the legendary blade Starfang", ...)` with at least one party member — assert suggestion no longer appears. NPC with short goal ("smith stuff") — assert no suggestion. _Check:_ T412.
**REQ-362a — Faction-vow coupling (Part a).**
populated `goals` array (REQ-233) AND the GM calls `badge_briefing`, THE `narrative_threads` section (REQ-281) SHALL include a vow-creation suggestion for each faction goal that intersects the party's interests — the goal text references an entity, location, or faction known from lore entries or story journal records — and does not already match an active vow's `description`. The suggestion SHALL carry the faction name, the matching goal text, and a prompt for the GM to create a vow via `set_vow` (REQ-289).

**REQ-362b — Faction-vow coupling (Part b).**
This is a navigational coupling — the server suggests; the GM decides. *Acceptance criterion:* Create faction "Thieves Guild" with goal "Steal the Crown of Alara". Create lore entry referencing "Crown of Alara". Invoke `badge_briefing` — assert `narrative_threads` includes faction-vow suggestion naming the Thieves Guild and the crown goal. Create faction with goal that references no known entities — assert no suggestion. _Check:_ T413.
**REQ-363a — Secret-world coupling (Part a).**
SHALL accept an optional `world_target` parameter that references a world-model room ID (REQ-195). When a secret carries a `world_target`, the secret's triggers SHALL be matched against the room's `room_description` text in addition to scene description text (REQ-083). The secret SHALL surface in `badge_briefing` `narrative_threads` tagged `[world-linked]` when the active scene's `location` resolves to the targeted room. This is a navigational coupling — the secret is annotated with location context; it does not auto-reveal. *Acceptance criterion:* Create world-model room "Vault".

**REQ-363b — Secret-world coupling (Part b).**
Call `set_secret("vault-trap", "The floor is pressure-plated", world_target="vault")`. Call `set_scene_state("The strongroom", location="Vault")` — assert `badge_briefing` `narrative_threads` includes `[world-linked]` vault-trap entry. Call `set_scene_state("The garden", location="Inn")` — assert entry absent. _Check:_ T414.
**REQ-364a — Faction-world coupling (Part a).**
`update_faction` tools (REQ-233) SHALL accept an optional `territory` parameter referencing one or more world-model room IDs (REQ-195). When a faction carries `territory`, the faction's clock and goal surface SHALL appear in `badge_briefing` `narrative_threads` tagged `[territorial]` when the active scene's `location` resolves to a room within the faction's territory. This is a navigational coupling — the faction is annotated with location context; its clock behavior is unchanged. *Acceptance criterion:* Create world-model room "Throne Room".

**REQ-364b — Faction-world coupling (Part b).**
Call `create_faction("Royal Guard", goals=["Protect the crown"], territory=["throne_room"])`. Call `set_scene_state("The royal chamber", location="Throne Room")` — assert `badge_briefing` `narrative_threads` includes `[territorial] Royal Guard` with clock state. Call `set_scene_state("The kitchen", location="Pantry")` — assert faction absent from `narrative_threads`. _Check:_ T415.
**REQ-365a — Server notes narrative coupling (Part a).**
`set_server_note` (REQ-285) SHALL accept an optional `narrative_tag` parameter from the set: `campaign_bible`, `house_rules`, `lore_seed`, or `session_reminder`. Server notes carrying a `narrative_tag` SHALL surface in the `badge_briefing` supplementary guidance alongside synthesis items (REQ-080), tagged with the narrative tag value. Server notes without a `narrative_tag` SHALL remain in the server notes resource only, as current behavior.

**REQ-365b — Server notes narrative coupling (Part b).**
This is a navigational coupling — server notes are surfaced as GM guidance in the briefing prompt. *Acceptance criterion:* Call `set_server_note("old-gods", "The old gods were banished to the outer dark", narrative_tag="lore_seed")` — assert `badge_briefing` supplementary guidance includes `[lore-seed] The old gods were banished..."`. Call `set_server_note("dm-reminder", "Remind players about the curse", narrative_tag="session_reminder")` — assert surfaces with `[session-reminder]` tag. Call without `narrative_tag` — assert absent from `badge_briefing`.

**REQ-365c — Server notes narrative coupling (Part c).**
Player badge — assert server notes absent from briefing regardless of tag. _Check:_ T416.
**REQ-366a — Observer narrative surface (Part a).**
`observer` (REQ-305), the `badge_briefing` SHALL compose narrative surfaces from both Game Master and Player perspectives: scene state and scene type (REQ-076, REQ-087) from the GM surface, entity presence and personality (REQ-307, REQ-077) from the Player surface, the combined narrative threads from both perspectives (REQ-281), and an orientation directive indicating the AI narrates from an omniscient perspective. The observer badge SHALL NOT see GM-only surfaces — secrets (REQ-234), faction clock states (REQ-233), countdown tick positions (REQ-073), or the GM context (REQ-232).

**REQ-366b — Observer narrative surface (Part b).**
The observer SHALL NOT mutate state — the read-only contract of REQ-305 applies to all narrative tools. Synthesis content (REQ-159) SHALL render in the observer `badge_briefing` under the same badge-filtering rules as the Player badge: game_master-scoped synthesis items are hidden; shared-scope items are visible. The observer SHALL have read-only access to world-model inspection tools — `resolve_intent` (REQ-323), parser `look` and `examine` commands, and resource reads (`room://<id>`, `thing://<id>`, `world://map`) — consistent with the state-query permission of REQ-305.

**REQ-366c — Observer narrative surface (Part c).**
The observer `badge_briefing` SHALL include presence markers and `knowledge_state` for all entities present in the Novel — the observer sees what the AI (playing both roles) knows for every character. Entity presence markers (REQ-307) and knowledge scoped by attendance (REQ-308) are unfiltered under the observer badge, matching the GM-level visibility contract: the human watches the AI auto-play, so no entity's percepts are hidden. *Acceptance criterion:* Call `set_badge("observer")` on a populated Novel.

**REQ-366d — Observer narrative surface (Part d).**
Assert `badge_briefing` includes scene state, entity personality, and narrative threads with omniscient-role orientation directive. Assert `badge_briefing` includes `[not present]` markers and `knowledge_state` for all entities (not just the active entity). Assert `badge_briefing` excludes secrets, faction clocks, countdown positions, and GM context. Assert `set_scene_state("test")` returns `[FORBIDDEN]` as before. _Check:_ T417.
**REQ-346a1 — Narrative coherence attestation (Part a) (Part a1).**
builder SHALL include in DECISIONS.md (6) a `narrative_coherence` attestation recording that: (a) every narrative-critical REQ is implemented — the verification workflow G7 narrative coherence attestation passed; (b) the `badge_briefing` prompt, when rendered against a populated Novel, includes all decision-critical and supplementary narrative sections as defined by REQ-109; (c) a smoke-session transcript (5+ turns of cooperative play) demonstrates that the server's narrative surfaces support coherent story flow. The smoke-session transcript SHALL be embedded or linked in DECISIONS.md (6).

**REQ-346a2 — Narrative coherence attestation (Part a) (Part a2).**
A build missing this attestation is a handoff defect. *Acceptance criterion:* DECISIONS.md (6) contains a `narrative_coherence` section sub-headed `@section evidence` with the three attestation points and an embedded or linked smoke-session transcript. _Check:_ T396, T403.
**REQ-346b — Narrative coherence attestation (Part b).**

---

### 5.13 Holodeck

**REQ-369a — Holodeck archetype taxonomy (Part a).**
(§7.7) SHALL be assigned one or more archetypes — Temporal, Entity-bearing, Scene-anchored, Knowledge-carrying, Narrative-memory, Spatial, Relational, Decision, Guidance, Session, or Ruleset Wisdom — as defined in §7.7.0. Every cross-property coupling in §7.7.1 SHALL trace to one or more coupling pattern rules (P1–P54, §7.7.0). A coupling that does not trace to a pattern rule is a spec defect.

**REQ-369b — Holodeck archetype taxonomy (Part b).**
Archetypes classified as `[content source]` denote input sources that populate property groups — they are excluded from the coupling cross-product. `npm run validate` SHALL verify that every coupling row in §7.7.1a cites a valid pattern rule. *Acceptance criterion:* `npm run validate` reports no untraced coupling rows and no coupling row with an invalid or missing pattern rule reference. _Check:_ T420, T436, T437, T438.
**REQ-370a — Coupling derivation (Part a).**
cite a pattern rule whose source and target archetypes match the row's property-group archetypes (§7.7.0, §7.7.1b). Every pattern rule in §7.7.0 (P1–P54) SHALL have at least one coupling row in §7.7.1a. A pattern rule with zero coupling rows is a spec defect. A coupling row citing a mismatched pattern rule is a spec defect. A `[non-property]` row (single-property snapshot or tool delegation) is exempt from archetype matching but counts toward its rule's coverage. `npm run validate` SHALL verify both conditions. Property groups classified as `[content source]` do not participate in coupling derivation — the properties they populate couple via their own archetype rules (§7.7.0).

**REQ-370b — Coupling derivation (Part b).**
The coupling completeness register (§7.7.1b previous) IS REMOVED — it is replaced by this derivation contract. *Acceptance criterion:* `npm run validate` reports no pattern rules with zero coupling rows and no coupling rows with mismatched archetype assignments. _Check:_ T421 (amended), T434, T435.
**REQ-371a — Ruleset Wisdom as rendered reality (Part a).**
synthesis output modules extracted during Discovery (REQ-225) — SHALL be rendered as first-class server behavior, not advisory guidance. WHERE Ruleset Wisdom content describes pacing patterns, dramatic structure, NPC voice conventions, or encounter design, THE server SHALL mechanically enact those patterns per the coupling contracts defined in §7.7.0 (P5–P11). The GM may override individual Wisdom items via `deactivate_synthesis_item`. Ruleset Wisdom survives `revert_synthesis`.

**REQ-371b — Ruleset Wisdom as rendered reality (Part b).**
Wisdom items extracted from the ruleset but not yet implemented in the current build SHALL render as Navigational suggestions until the builder implements the Mechanical coupling. *Acceptance criterion:* An NPC created in a Novel with active Ruleset Wisdom carries voice_examples, goals, and personality patterns without manual GM activation. A countdown created from Wisdom pacing patterns advances automatically on scene transitions. Deactivating the responsible Wisdom item suppresses the mechanical behavior. _Check:_ T422, T428.
**REQ-374a — Archetype coverage (Part a).**
that every Novel property group defined in §7.7 carries at least one Holodeck archetype from the set defined in §7.7.0 (Temporal, Entity-bearing, Scene-anchored, Knowledge-carrying, Narrative-memory, Spatial, Relational, Decision, Guidance, Session, Ruleset Wisdom). A property group without an archetype produces zero couplings — the coupling completeness metric in Phase 2 cannot detect this gap. The metric threshold is 100%: all 30 property groups classified.

**REQ-374b — Archetype coverage (Part b).**
Missing archetype assignments SHALL be resolved by re-reading §7.7.0 definitions and reassigning archetypes per the coupling pattern rules that govern each group's behavioral nature. *Acceptance criterion:* Every property group in §7.7 carries ≥1 archetype. A group missing an archetype causes this metric to fail, directing the builder to re-read and re-classify before proceeding to Phase 2. _Check:_ T425, T439.
**REQ-375a — Wisdom mechanical coupling rate (Part a).**
Enrichment population meets its threshold, the builder SHALL verify that Wisdom items extracted from the ruleset include Mechanical couplings — not exclusively Navigational ones. The metric measures: Wisdom items classified with Mechanical coupling nature per §7.7.1a / total Wisdom items extracted. Threshold: ≥30% Mechanical. A build where all Wisdom items are Navigational meets the Enrichment population metric but violates REQ-371's intent — the ruleset's guidance should render as server behavior.

**REQ-375b — Wisdom mechanical coupling rate (Part b).**
The builder SHALL improve the rate by re-reading ruleset source sections where the text carries strong behavioral language (procedures, pacing directives, structural patterns), re-classifying items from Navigational to Mechanical where the coupling contract supports it. *Acceptance criterion:* At least 30% of extracted Wisdom items carry Mechanical coupling nature in §7.7.1a. A build with Wisdom items exclusively Navigational causes this metric to fail, directing the builder to re-classify. _Check:_ T426.
**REQ-376a1 — Holonovel Pattern Buffer traceability (Part a) (Part a1).**
one Holonovel Pattern Buffer sub-workflow exercises each requirement in §5.10 (World-Model Layer), §5.12 (Narrative Architecture), §5.13 (Holodeck), §5.15 (Mechanical Coupling), and the world-model error contracts of REQ-367 (World-model property contracts). The builder records a Holonovel sub-workflow-to-REQ mapping in DECISIONS.md (6) — one entry per covered REQ, naming the sub-workflow(s) that exercise it. When a REQ in these sections changes during a holonovel package version advance, the builder re-examines every sub-workflow mapped to it.

**REQ-376a2 — Holonovel Pattern Buffer traceability (Part a) (Part a2).**
Gaps — a REQ in the covered sections with no mapped sub-workflow — are logged as process-compliance findings and must be resolved before the holonovel package is published. New REQs added to the covered sections during a spec revision require the builder to propose at least one new Holonovel Pattern Buffer sub-workflow exercising their contract; the proposal is a finding, not a blocker. *Acceptance criterion:* After a full Holonovel Pattern Buffer run, DECISIONS.md (6) contains a Holonovel sub-workflow-to-REQ mapping covering every REQ in the specified sections.

**REQ-376a3 — Holonovel Pattern Buffer traceability (Part a) (Part a3).**
Gaps detected by `npm run validate` are errors that block assembly. _Check:_ T431.
**REQ-376b — Holonovel Pattern Buffer traceability (Part b).**

---

### 5.14 Content Sources

**REQ-372a — Supplementary ruleset import (Part a).**
import of supplementary TTRPG rulesets via `import_supplementary`. Import is Novel-scoped — each Novel records its active supplementary rulesets under `supplementary_rulesets: [<slug>, ...]`. Import IS reversible via `remove_supplementary`.

**REQ-372b — Supplementary ruleset import (Part b).**
WHEN a supplementary ruleset is imported, THE server SHALL run extraction against the supplementary source per REQ-011 and REQ-225 (recording confidence and content hash in Novel metadata), register extracted mechanics as MCP tools per REQ-020 and REQ-373, render extracted Ruleset Wisdom per REQ-371 (P5–P11), record the supplementary ruleset's slug and content hash in the Novel's metadata, and on Novel resume re-resolve supplementary rulesets (surfacing `[supplementary-gap]` in `spec_health` if a source file is missing or hash-mismatched). Import is Game Master only, under the Editor badge.

**REQ-372c — Supplementary ruleset import (Part c).**
Supplementary rulesets do not affect other Novels — tools and Wisdom are Novel-scoped. The server MAY cache extraction results across Novels that import the same supplementary source. `remove_supplementary` deactivates all tools and Wisdom from the supplementary ruleset in the current Novel; state derived from supplementary content (NPCs created from supplementary stat blocks, lore from supplementary Wisdom) persists — the tools that created them are no longer available.

**REQ-372d — Supplementary ruleset import (Part d).**
WHEN the builder's chosen stack cannot support dynamic tool registration, THE builder SHALL record a waiver in DECISIONS.md (5) citing the technical constraint, and supplementary ruleset import SHALL be limited to Ruleset Wisdom only — mechanics from supplementary sources require a full rebuild. The waiver SHALL re-evaluate on each builder version. *Acceptance criterion:* Call `import_supplementary("xanathars-guide.md")` in a Novel — assert new spells, classes, and Wisdom appear in `tools/list`, `badge_briefing`, and `list_synthesis_items`. Assert Wisdom mechanically couples per P5–P11.

**REQ-372e — Supplementary ruleset import (Part e).**
Call `remove_supplementary("xanathars-guide.md")` — assert tools and Wisdom removed. End Novel and resume — assert supplementary ruleset re-resolves. Move the source file — assert `[supplementary-gap]` in `spec_health`. _Check:_ T423.
**REQ-373a1 — Dynamic tool registration (Part a) (Part a1).**
registration of additional MCP tools at runtime when supplementary rulesets are imported (REQ-372). Dynamically registered tools SHALL conform to the same contracts as build-time tools: response prefix (REQ-001), error taxonomy (REQ-002), roll transparency (REQ-003), source quoting (REQ-061), and badge gating (REQ-032). `tools/list` SHALL include dynamically registered tools alongside build-time tools. `tools/list` output SHALL annotate dynamically registered tools with their source supplementary ruleset slug.

**REQ-373a2 — Dynamic tool registration (Part a) (Part a2).**
When a supplementary ruleset is removed (REQ-372), its tools SHALL be deregistered — `tools/list` and tool invocation SHALL behave as if the tools were never present. *Acceptance criterion:* After `import_supplementary`, `tools/list` includes new tools annotated with source slug. Tool invocation produces `[OK]` with response prefix, error taxonomy, and source quoting. After `remove_supplementary`, tools are absent from `tools/list` and invocation returns `[NOT_FOUND]` (tool not recognized by the MCP layer). _Check:_ T424.
**REQ-373b — Dynamic tool registration (Part b).**

---

### 5.15 Mechanical Coupling

**REQ-377a — Mechanical coupling extraction (Part a).**
extracting mechanical tools from categories 1–6, the builder SHALL identify which mechanical tools carry Holodeck coupling effects. A tool carries coupling effects when the ruleset's own text describes outcomes that affect the game world beyond immediate mechanical resolution — destruction of objects, illumination or extinguishing of light sources, creation or removal of obstacles, transformation of environments, revelation of information, or application of persistent conditions to entities.

**REQ-377b — Mechanical coupling extraction (Part b).**
For each qualifying tool, the builder SHALL record coupling metadata: (a) the target archetype — Spatial, Entity-bearing, Temporal, or Knowledge-carrying, (b) the coupling nature — Mechanical for deterministic effects the ruleset describes as automatic, Navigational for effects requiring GM interpretation, and (c) the triggering condition drawn from the ruleset text. This metadata populates the Mechanics property group per the Mechanical archetype (§7.7.0).

**REQ-377c — Mechanical coupling extraction (Part c).**
Confidence labels apply per coupling entry: HIGH when the ruleset text unambiguously describes a world-affecting outcome, MEDIUM when the effect is implied but not explicit, LOW when the builder infers coupling from genre convention alone. *Acceptance criterion:* A build against D&D 5e SRD produces coupling metadata for Fireball (Spatial, destruction — HIGH), Darkness (Spatial, extinguishing — HIGH), Light (Spatial, illumination — HIGH), and Hold Person (Entity-bearing, condition — HIGH). Each entry carries source anchor and confidence label.

**REQ-377d — Mechanical coupling extraction (Part d).**
A ruleset-free build produces `[ruleset-free]` annotation. _Check:_ T432.
**REQ-378a — Mechanical coupling verification (Part a).**
verify that: (a) at least one mechanical tool per extraction category (Concepts, Entities, Actions, Tables, Resolution, Roles) carries coupling metadata — a category with zero coupling entries is a finding; (b) the total coupling entries meet the threshold of at least one coupling entry per 50 indexed mechanical items, with a floor of 5 and a ceiling of 50; (c) at least 10% of mechanical couplings are Mechanical (automatic) rather than Navigational (advisory) — a build where every mechanical coupling requires GM confirmation is a findings. *Acceptance criterion:* A build against D&D 5e SRD (200+ indexed mechanical items) produces at least 4 mechanical coupling entries that meet the thresholds.

**REQ-378b — Mechanical coupling verification (Part b).**
At least one coupling is Mechanical (automatic), not Navigational. A ruleset-free build produces `[ruleset-free]` annotation for all mechanical coupling metrics. _Check:_ T433.

### 5.16 Multi-Ruleset Build

**REQ-379a — Tool namespacing (Part a).**
`ruleset` annotation — the ruleset slug for ruleset-derived tools, or `null` for infrastructure tools. Ruleset-derived tools carry a `<slug>_` prefix in their registered name. Infrastructure tools — those in the World, Novels, Badges & Workflow, and Narrative REQ-020 categories — SHALL carry no prefix. The set of ruleset-derived tools is the union of tools classified during Discovery (§6.3) as Concepts-derived, Entities-derived, Actions-derived, Tables-derived, Resolution-derived, or Roles-derived.

**REQ-379b — Tool namespacing (Part b).**
Tool names that clash between two rulesets under the prefix scheme (e.g., both rulesets extract a tool named `roll_skill_check`) are resolved by the prefix — the tool names are distinct on the registry surface. The mapping of prefix to ruleset slug SHALL be recorded in DECISIONS.md (1) during package construction (§6.4.2) and reported in `spec_health` under a `ruleset_prefix_map` field.

**REQ-379c — Tool namespacing (Part c).**
A tool whose `ruleset` annotation does not match any known ruleset is a registration defect. *Acceptance criterion:* `tools/list` for a host with D&D and Starfinder packages loaded reports `dnd5e_roll_skill_check` with `ruleset: "dnd5e"`, and `starfinder_roll_skill_check` with `ruleset: "starfinder"`. `create_npc` carries `ruleset: null`. `spec_health.ruleset_prefix_map` maps each prefix to its ruleset slug. _Check:_ T440.
**REQ-380a — Novel ruleset binding (Part a).**
`ruleset` parameter — a ruleset slug matching one of the prefixes in the server's `ruleset_prefix_map`. The Novel's `ruleset` field SHALL be immutable for the Novel's lifetime except the single audited migration path (REQ-380c). `resume_novel` SHALL restore the bound ruleset from the Novel's persisted state. `clone_novel` SHALL preserve the source Novel's ruleset. `switch_novel` to a Novel bound to a different ruleset SHALL activate that Novel's ruleset scope — the ruleset-derived tool surface changes to match. `create_novel` with a ruleset slug not present in the server's `ruleset_prefix_map` returns `[ERROR] [INVALID_INPUT]` with valid rulesets enumerated.

**REQ-380b — Novel ruleset binding (Part b).**
A conformant server with exactly one ruleset MAY accept `create_novel` without the `ruleset` parameter, defaulting to that single ruleset — this preserves backward compatibility with single-ruleset servers built before multi-ruleset support. *Acceptance criterion:* `create_novel("greyhawk", ruleset="dnd5e")` succeeds and the Novel's `ruleset` field is `"dnd5e"`. Subsequent calls to `dnd5e_roll_skill_check` succeed against this Novel. `create_novel("absalom", ruleset="starfinder")` succeeds with `ruleset: "starfinder"`.

**REQ-380c — Novel ruleset binding (Part c).**
Calling `dnd5e_lookup_spell` against the Starfinder Novel returns an error per REQ-381. *Acceptance criterion:* A ruleset-free Novel (created with no `ruleset` field) binds to an installed slug via `bind_novel_ruleset` — a Game Master or Editor operation, audited and one-way — and gains that slug's tools. Binding SHALL refuse `[ERROR] [STATE_CONFLICT]` when the Novel already carries mechanics-derived state under a different or no ruleset. _Check:_ T441, T451.
**REQ-381a — Ruleset-scoped tool gating (Part a).**
is active, only tools whose `ruleset` annotation is `X` or `null` SHALL be callable. A call to a tool annotated with a different ruleset scope returns `[ERROR] [INVALID_INPUT]` with the corrective action stating the active Novel's ruleset and directing the caller to tools matching that ruleset. This gating is independent of badge gating (REQ-032) — both filters apply. A call that passes badge gating but fails ruleset gating returns `[ERROR] [INVALID_INPUT]` with the active Novel's ruleset named in the corrective action.

**REQ-381b — Ruleset-scoped tool gating (Part b).**
A call that fails both returns `[ERROR] [FORBIDDEN]` (badge gating takes precedence in the response taxonomy). Ruleset scope applies to every MCP surface: `tools/list` SHALL, when invoked with `scope=all`, include all registered tools regardless of active Novel, with tools whose ruleset scope does not match the active Novel's scope annotated with an `inapplicable` hint — their descriptions remain visible for discoverability. The default scoped listing is governed by REQ-391. `resources/list` and `prompts/list` SHALL include all entries; resources and prompts whose content draws from a ruleset model SHALL badge-filter and ruleset-filter their output.

**REQ-381c — Ruleset-scoped tool gating (Part c).**
When no Novel is active, all tools are callable and no ruleset gating applies — the server operates with full cross-ruleset access. *Acceptance criterion:* With a D&D-bound Novel active, `starfinder_roll_skill_check` returns `[ERROR] [INVALID_INPUT]` naming the active Novel's ruleset as `dnd5e`. With no Novel active, the same call succeeds. `tools/list` with `scope=all` includes all tools with `inapplicable` annotations on mismatched-ruleset tools. _Check:_ T442.
**REQ-382a — Per-ruleset extraction isolation (Part a).**
— search index, canonical lookup catalogues (spells, equipment, monsters, conditions, classes, abilities), generation tables, condition registry, constraint override catalog, and mechanical coupling metadata — SHALL be isolated from every other ruleset's model. A `search_rules` call under a D&D-bound Novel searches only the D&D index.

**REQ-382b — Per-ruleset extraction isolation (Part b).**
The same query under a Starfinder-bound Novel searches only the Starfinder index. `lookup_spell`, `lookup_equipment`, `lookup_monster`, `lookup_class`, and analogous ruleset-derived lookup tools SHALL search only their ruleset's catalogue. `roll_on_table` SHALL enumerate only the tables extracted from the active Novel's ruleset. `suggest_actions` SHALL return only tool suggestions from the active Novel's ruleset. `spec_health` SHALL report per-ruleset extraction metrics. *Acceptance criterion:* `dnd5e_search_rules("fireball")` under a D&D Novel returns D&D Fireball results with source anchors in the D&D ruleset. `starfinder_search_rules("fireball")` under a Starfinder Novel returns results from the Starfinder ruleset (or `[NOT_FOUND]`).

**REQ-382c — Per-ruleset extraction isolation (Part c).**
The same tool called under the wrong Novel returns per REQ-381. `spec_health` reports `ruleset_dnd5e` and `ruleset_starfinder` sections with independent counts. _Check:_ T443.
**REQ-383a — Host ruleset health (Part a).**
metrics in a `ruleset_health` object keyed by ruleset slug. Each slug entry contains: confidence scores (overall and per-file), indexed counts (anchors, concepts, entity types, actions, tables, procedures, guidance items, synthesis items per module), MUST-action coverage, defect count, and verification workflow dispositions. A `combined` summary reports total tool count, total resource count, total prompt count, active Novel count, and the `ruleset_prefix_map`. The per-ruleset sections SHALL be absent when the build is not yet complete.

**REQ-383b — Host ruleset health (Part b).**
Player-badge calls SHALL filter per-ruleset sections: the Player sees only metrics for the active Novel's ruleset (if a Novel is active with a badge) or no per-ruleset sections (if no Novel is active). The `combined` summary section is visible to all badges. *Acceptance criterion:* A host with D&D and Starfinder packages loaded reports `spec_health.ruleset_health.dnd5e` and `ruleset_health.starfinder` with independent counts, plus a `combined` section with the prefix map. Under a Player badge with a D&D Novel active, only `ruleset_health.dnd5e` is visible. _Check:_ T444.
**REQ-384a — Cross-ruleset Novel switching (Part a).**
activate the target Novel's ruleset scope. The ruleset-derived tool surface — which lookup tools, which dice-resolution tools, which generation tables, which `search_rules` index, which `suggest_actions` suggestions, and which condition registry — SHALL change to match the activated Novel's ruleset. Switching between Novels of different rulesets SHALL NOT corrupt either Novel's state. The `badge_briefing` prompt SHALL recompose using the activated Novel's ruleset model.

**REQ-384b — Cross-ruleset Novel switching (Part b).**
Infrastructure tools and their state (scene, NPCs, world model, lore, countdowns) are unchanged — they operate on the activated Novel's data regardless of ruleset. Switching Novels SHALL be an audited mutation with the source and destination slugs and their rulesets recorded. *Acceptance criterion:* Switching from a D&D Novel (slug `greyhawk`) to a Starfinder Novel (slug `absalom-station`) changes the `badge_briefing` to use Starfinder terminology, makes `starfinder_roll_skill_check` callable, and makes `dnd5e_roll_skill_check` return per REQ-381. The D&D Novel's state is unchanged on disk.

**REQ-384c — Cross-ruleset Novel switching (Part c).**
Switching back restores D&D ruleset scope. The audit log records both switches with ruleset metadata. _Check:_ T445.
**REQ-385a — suggest_actions cross-ruleset scoping (Part a).**
return only tool suggestions whose `ruleset` annotation matches the active Novel's ruleset scope, plus infrastructure tools. When the world model is populated, `suggest_actions` SHALL also return parser `command` suggestions (per REQ-319) — these are infrastructure and unrestricted. A `suggest_actions` call with no Novel active SHALL return `[ERROR] [STATE_CONFLICT]` directing the caller to create or resume a Novel. The action-suggestion catalogue is drawn from the active Novel's ruleset model.

**REQ-385b — suggest_actions cross-ruleset scoping (Part b).**
Suggestions SHALL use the prefixed tool names for ruleset-derived tools. *Acceptance criterion:* `suggest_actions("attack the goblin")` under a D&D Novel returns `dnd5e_roll_weapon_attack` as a suggestion. The same intent under a Starfinder Novel returns `starfinder_roll_weapon_attack`. Neither returns the other ruleset's tool. _Check:_ T446.
**REQ-386a — Cross-ruleset import rejection (Part a).**
the imported Novel's `ruleset` field against the server's known ruleset slugs (from `ruleset_prefix_map`). An import whose ruleset does not match any known slug returns `[ERROR] [INVALID_INPUT]` with valid rulesets enumerated. The import succeeds when the ruleset is known — the imported Novel's ruleset is preserved as-is. `import_character(roster_id)` SHALL validate that the Roster entry's ruleset matches the active Novel's ruleset scope.

**REQ-386b — Cross-ruleset import rejection (Part b).**
A mismatch returns `[ERROR] [STATE_CONFLICT]` naming the entry's ruleset and the Novel's ruleset. `export_novel` SHALL include the Novel's `ruleset` field in the export manifest. A Novel exported from one host is importable into any conformant host that recognizes its ruleset slug. *Acceptance criterion:* Exporting a D&D Novel includes `ruleset: "dnd5e"` in the manifest. Importing a Starfinder Novel into a D&D + Mothership host rejects with valid rulesets enumerated. Importing a character from a Starfinder Roster entry into a D&D Novel rejects with both rulesets named. _Check:_ T447.
**REQ-387a — Codex ruleset annotation (Part a).**
`ruleset` field — the slug matching one entry in the server's `ruleset_prefix_map`, or `null` for ruleset-agnostic entries (rooms, scenes, generic NPCs without mechanical stats, lore entries). `codex_set` SHALL default the `ruleset` field to the active Novel's ruleset scope when one is active, or leave it `null` when no Novel is active (the caller MAY override). `codex_capture` SHALL default `ruleset` to the source Novel's ruleset scope, mirroring the `codex_set` default. `codex_list` SHALL support a `ruleset` filter parameter — when provided, returns only entries whose `ruleset` matches or is `null`. `codex_import` into a Novel SHALL show only entries whose `ruleset` matches the Novel's ruleset or is `null`.

**REQ-387b — Codex ruleset annotation (Part b).**
A `codex_import` of a ruleset-specific entry (e.g., a D&D spell) into a Novel of a different ruleset returns `[ERROR] [STATE_CONFLICT]` naming both rulesets. *Acceptance criterion:* `codex_list(ruleset="dnd5e")` returns D&D-tagged entries plus untagged entries. `codex_list(ruleset="starfinder")` returns Starfinder-tagged entries plus untagged entries — no D&D entries. `codex_import` of a D&D spell codex entry into a Starfinder Novel is rejected. _Check:_ T431.

### 5.17 Ruleset Packages

**REQ-389a — Ruleset package format (Part a).**
A ruleset package is a self-contained declarative artifact produced by the Package step (§6.4.2). It SHALL contain the extracted model, the full-text search index, tool schemas with execution logic expressed as data, resource and prompt definitions, a content hash, and a version manifest naming the host version it was built against. The host SHALL load a package without reading or re-parsing ruleset Markdown source, using only the prebuilt index and model the package ships.

**REQ-389b — Ruleset package format (Part b).**
A package whose declared content hash does not match its contents SHALL be rejected at load with its slug and the expected and received hashes reported; the host SHALL surface the rejection in `spec_health` and continue serving other packages. *Acceptance criterion:* A package built via the Package step loads once and serves `search_rules`, lookups, and dice tools with no source-Markdown access; a package with a corrupted manifest is rejected by slug without affecting loaded packages. _Check:_ T452.

**REQ-389c — Ruleset install surface (Part c).**
`install_ruleset` SHALL validate slug uniqueness and host-version compatibility before activation; `remove_ruleset` SHALL deregister the package's tools, resources, and prompts and SHALL refuse while any active Novel is bound to its slug. `list_rulesets` SHALL report each installed package with installed-versus-loaded state. All three are Game Master or Editor operations and SHALL be audited. *Acceptance criterion:* Installing a package with a duplicate slug or an incompatible host version fails with the reason named; removing a package with a Novel still bound to it returns `[ERROR] [STATE_CONFLICT]`; `list_rulesets` distinguishes loaded from installed-but-idle packages. _Check:_ T453.

**REQ-390a — Lazy ruleset hydration (Part a).**
On startup the host SHALL scan the install directory, validate package integrity and version compatibility, and record installed-package metadata. Search-index loading, tool registration, and model hydration for an installed package SHALL be deferred until a Novel bound to that ruleset is first activated. A tool call for an installed-but-not-yet-hydrated ruleset SHALL return `[ERROR] [STATE_CONFLICT]` directing first activation of a Novel bound to that slug.

**REQ-390b — Lazy ruleset hydration (Part b).**
Cold start — process start to first tool response — SHALL meet the REQ-100 tier for the single largest installed package regardless of the total installed set; aggregate installed size SHALL NOT add startup time. `spec_health` SHALL report `rulesets_installed`, `rulesets_hydrated`, and aggregate installed index bytes. *Acceptance criterion:* A host with five installed packages starts within the single-largest-package tier, hydrates only the active Novel's package, and reports one hydrated and four idle packages in `spec_health`. _Check:_ T454, T455.

**REQ-391a — Scoped tool listing (Part a).**
`tools/list` SHALL, absent a filter, return only the active Novel's ruleset tools plus infrastructure tools. A `scope=all` parameter SHALL return the full listing per REQ-381b. With no Novel active, the default listing SHALL return infrastructure tools plus installed-ruleset metadata, and SHALL NOT force hydration of inactive packages. *Acceptance criterion:* Under a D&D-bound Novel, the default `tools/list` returns infrastructure plus `dnd5e_*` tools only; `tools/list(scope=all)` returns every loaded package's tools with `inapplicable` hints. _Check:_ T456.

**REQ-391b — On-demand schema delivery (Part b).**
A mechanism SHALL exist for a client to retrieve an individual tool's full schema or a single ruleset's tool set on demand, distinct from the default listing. Default listing entries MAY carry abbreviated descriptions when full schemas are retrievable on demand; the abbreviated form SHALL preserve each tool's name, category, and one-line purpose. _Check:_ T457.

**REQ-391c — Tool listing pagination (Part c).**
`tools/list` responses exceeding a configurable size SHALL return in paginated form per the MCP protocol. Client discovery cost under the default scoped listing SHALL NOT grow with the number of installed packages. *Acceptance criterion:* A host with a full listing exceeding the size cap paginates `tools/list(scope=all)`; the default scoped listing size is independent of installed package count. _Check:_ T458.

**REQ-392 — Tool-description budget.**
Every registered tool's `description` SHALL fit a build-time size budget recorded in DECISIONS.md; it SHALL state the tool's one-line purpose and ruleset scope and SHALL NOT duplicate parameter guidance already carried by the schema. `spec_health` SHALL report `tools_list_bytes` — the aggregate byte size of the default `tools/list` response. *Acceptance criterion:* Tool descriptions fit the recorded budget; `spec_health.tools_list_bytes` is present and reflects the current default listing. _Check:_ T459.

**REQ-393 — Update preservation.**
A host update (§6.7) SHALL revalidate installed packages against the new host version without re-building or re-extracting them. A package whose version manifest names an incompatible host version SHALL be reported in `spec_health` and held inactive (surfacing a `[package-incompatible]` flag) rather than silently dropped. Installed packages and all Novel, roster, codex, server-note, and world-model data SHALL survive a host update unchanged. *Acceptance criterion:* After a host version bump, a still-compatible package stays loaded and retains its indexed data; an incompatible package is flagged and held inactive; all user data survives byte-for-byte. _Check:_ T460.

**REQ-394 — Spec publication integrity.**
A Minor or Major spec delta (§6.7) SHALL NOT be propagated to a repository or deployed server, or recorded as applied, until the implementation fingerprints (REQ-313) advance to reflect the update. Publication tooling SHALL detect a pending update — a non-patch delta with unchanged implementation fingerprints — and block publication with a pending-update notice; patch deltas are exempt. An operator override recorded in DECISIONS.md may lift the block when the update is scheduled. *Acceptance criterion:* A Minor or Major delta with unchanged fingerprints blocks publication; after the update advances the fingerprints, publication succeeds. _Check:_ T462.

### 5.18 Workflow Entry Points

**REQ-395a — Ruleset-build entry point (Part a).**
The distribution SHALL expose a single, documented entry point — `build-ruleset` — that accepts one or more `slug=path` pairs (B1) and emits a declarative ruleset package (REQ-389) into the install directory without modifying the host. Invoked with no arguments, it SHALL print its usage and the install directory. Package output SHALL land only in the install directory, and build tooling inside the git-tracked tree SHALL be committed or placed outside it. *Acceptance criterion:* `build-ruleset example=<path>` emits a package the host loads without re-parsing source Markdown; `build-ruleset` with no arguments prints usage; no untracked build tooling is left in the tracked tree. _Check:_ T463.

**REQ-395b — Workflow runbooks (Part b).**
Every workflow named in §6.1 — Convert, Build, Synthesize, and Update — SHALL have a runbook: a short procedural guide naming the workflow's entry point, happy-path steps, and recovery steps. Each runbook SHALL be reachable from the reading guide (§0) and from its entry point's output. *Acceptance criterion:* a builder asked to add a ruleset reaches the Build runbook before §6.3 Discovery. _Check:_ T464.

**REQ-396 — Deploy preservation.**
Any mechanism that updates a deployed host instance — a git pull, clean, checkout, or equivalent deploy step — SHALL preserve the install directory, all installed ruleset packages, and all user-generated data (Novels, roster, codex, server notes, and world-model data) unchanged, byte-for-byte. Such a deploy SHALL NOT run destructive git operations that delete or revert the install directory or the user-data directory (REQ-397). *Acceptance criterion:* A deploy step that pulls and cleans untracked files leaves the install directory, installed packages, and every Novel, roster, codex, server-note, and world-model entry byte-for-byte identical; a deploy whose git operations would touch the install or user-data directory is rejected before any file is deleted. _Check:_ T465.

**REQ-397 — Untracked state location.**
Server-generated persistent state — Novels, roster, codex, server notes, world-model data, and the ruleset install directory — SHALL be stored such that no ordinary git operation on the host's working tree (pull, checkout, clean, reset) can delete or revert it. The default state location SHALL resolve outside the git work tree when the server runs inside one; when it cannot, the server SHALL surface a `[state-in-tree]` warning in `spec_health` and on stderr. User data SHALL NOT be required to be committed to version control to survive restarts or rebuilds. *Acceptance criterion:* A server started inside a git work tree, then subjected to `git clean -fdx` and a hard reset, retains every Novel, roster, codex, server-note, and installed package unchanged. _Check:_ T466.

**REQ-398 — Deploy-model scope.**
The deployment model is a git-managed specification repository that produces a separately deployed host server with its own working tree. Build, Update, and verification workflows SHALL treat the specification repository and the deployed server as distinct surfaces: spec changes propagate to a deployed server only through the Update workflow (§6.7) and the fingerprint gate (REQ-394), never by a bare file copy or checkout into the server's directory. _Check:_ T467.

### 5.19 State Persistence Guardrails

**REQ-400 — State-Persistence Directive.** When the AI's narrative role is
Game Master, `badge_briefing` orientation SHALL include a persistence
directive instructing the GM to commit state for every narratable change —
scene changes, mechanical outcomes, disposition shifts, and story beats SHALL
be persisted with the corresponding state tool (REQ-076, REQ-246, REQ-075,
REQ-073) in the same turn they are narrated. The directive SHALL render in the
never-truncated tier (REQ-135). _Check:_ T469.

**REQ-401 — State ledger briefing token.** `badge_briefing` SHALL render a
`state_ledger` decision-critical section token (REQ-082, REQ-185) under the
Game Master badge listing the timestamp of the last state mutation, per-group
mutation counts for the current session, and any active drift markers
(REQ-402, REQ-403). The token SHALL be never-truncated per REQ-135. _Check:_
T470.

**REQ-402 — Session no-mutation detection.** When a session boundary
(REQ-237) closes a window containing zero mutating audit-log entries, the
server SHALL surface a `[session-no-mutations]` marker in `spec_health` and
`session_recap` naming the session that recorded no state writes. The marker is
observational and SHALL NOT block play. _Check:_ T471.

**REQ-403a — State-drift detection (Part a).**
The server SHALL detect state drift — a `gm_context.saved_at` timestamp newer
than the last audit-log mutation, indicating the GM narrated without
committing — and SHALL surface it as a `[state-drift]` marker in `spec_health`,
`session_recap`, and the `state_ledger` token.

**REQ-403b — State-drift detection (Part b).**
A `TTRPG_STATE_GATE` setting — `off` (default), `warn`, or `block` — read at
startup, SHALL control the gate: `off` renders drift markers observationally,
`warn` appends a prominent warning naming the uncommitted beats and the tools
to fix them at session close (`set_pause_context`, `session_recap`), and
`block` returns `[STATE_CONFLICT]` from `set_pause_context`, `end_novel`, and
`switch_novel` while drift is active. Commit tools SHALL remain callable in
every mode. _Check:_ T472.

**REQ-404 — Roll-to-commit coupling.** A significant roll (REQ-174) implying
a mechanical consequence SHALL be followed by a state-committing mutation in
the same turn; `session_recap` SHALL flag a `[uncommitted-roll]` marker naming
the roll and the suggested commit tool when no such mutation follows. The
marker is observational. _Check:_ T473.

**REQ-405 — Auto-moment on transitions.** Every scene transition (REQ-125)
and combat-round resolution SHALL append a `moment` entry to the story journal
(REQ-246) carrying the scene anchor, location, and timestamp, unless the
transition sets `skip_transition_hook`. A Novel-scoped `auto_record` flag,
default `true`, SHALL enable this behavior; the GM MAY set it `false` to
restore manual-only recording. _Check:_ T474.

**REQ-406 — Backup-restore regression visibility.** When a Novel loads from a
backup (REQ-092), `spec_health` SHALL report a `[state-regression]` marker
carrying the audit-entry-count gap and the timestamp gap between the restored
state and the corruption event, so recovered content loss is operator-visible.
_Check:_ T475.

**REQ-407 — Persist-tools never truncated.** The Game Master's scene-typed
tool section in `badge_briefing` (REQ-087) SHALL always include the core
state-persistence tools — the scene, story-journal, countdown, note,
personality, NPC, and vow tools defined in §5 — regardless of scene type, and
those tools SHALL be never-truncated per REQ-135. _Check:_ T476.

### 5.20 Narrative Turn Conventions

**REQ-412 — Turn-handoff directive.** WHEN the AI's narrative role is Game Master and a Player or Observer badge is active, `badge_briefing` orientation SHALL include a turn-handoff directive instructing the narrator to close each narrated turn by inviting the player's next action in plain English — a question or prompt to act, never a tool signature. The directive SHALL render in the never-truncated tier (REQ-135). Under an AI-Player role, the directive SHALL instruct closing turns with an in-character offer that hands initiative back to the human Game Master. *Acceptance criterion:* `badge_briefing` under the GM role includes the turn-handoff directive; under the AI-Player role it instructs handing initiative back. _Check:_ T482.

#### End of requirements
