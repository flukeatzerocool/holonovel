## 5. Requirements

_The normative core. Each requirement is exactly one paragraph — no blank lines,
no tables, no bullet lists, no numbered steps. Ends in `_Check:` with test citations.
Sub-REQs (XXXa, XXXb) handle composable concerns. Enforced by `npm run check`._

| §       | Title                               | REQs                                                |
|---------|-------------------------------------|-----------------------------------------------------|
| 5.1    | Output and Error Contracts                              | 001–004, 060–062, 064, 070, 071, 101, 113, 118, 179, 184, 194, 277, 280, 425 |
| 5.2    | Extraction and Confidence                               | 010–018, 099, 102, 111, 146, 147, 153, 154, 207, 209, 210, 212, 214, 215, 225, 270–272, 315, 324, 354 |
| 5.3    | Tools, Resources, and Lookups                           | 020–025, 057–059, 063, 067, 078, 105–107, 110, 112, 138, 139, 160–164, 169, 182, 183, 187, 269, 278, 296, 323, 388, 408, 411, 413–415, 426, 427, 450 |
| 5.4    | Decision Workflows                                      | 042, 056, 104, 140, 151, 152, 181, 190–193, 224, 235, 399 |
| 5.5    | Badges and Access                                       | 030–032, 066, 109, 133–137, 148–150, 159, 180, 211, 216, 220, 223, 275, 276, 281, 286, 304–306 |
| 5.6    | State, Lifecycle, Entities, and Adventure Content       | 040, 041, 043, 044, 065, 069, 072–077, 079, 116, 119–124, 126–129, 132, 156, 165–168, 170–178, 203–206, 217, 221, 229, 232, 233, 236, 237, 239, 241, 242, 247–250, 252, 255, 279, 282, 285, 289, 292, 302, 307, 308, 311, 313, 314, 321, 322, 329, 330, 332 |
| 5.7    | Determinism, Safety, and Performance                    | 050–052, 054, 055, 100, 157, 213, 251, 253, 273, 274, 291, 312, 409, 410, 416, 417, 433, 444–449 |
| 5.8    | Synthesis, Lore, and Macros                             | 080–087, 103, 114, 115, 125, 130, 155, 158, 185, 186, 226–228, 230, 231, 234, 243–246, 260–266, 310, 328, 331, 333 |
| 5.9    | Novel Persistence and Transport                         | 088–097, 117, 131, 238, 240, 256–259, 294, 295, 334 |
| 5.10   | World-Model Layer                                       | 195–202, 222, 283, 284, 309, 316–320, 325–327, 367, 368, 431 |
| 5.11   | Ruleset-Free Build Mode                                 | 218, 219 |
| 5.12   | Narrative Architecture                                  | 335–353, 355–366 |
| 5.13   | Holodeck                                                | 369–371, 374–376 |
| 5.14   | Content Sources                                         | 372, 373 |
| 5.15   | Mechanical Coupling                                     | 377, 378 |
| 5.16   | Multi-Ruleset Build                                     | 379–387 |
| 5.17   | Ruleset Packages                                        | 389–394, 419, 430, 432 |
| 5.18   | Workflow Entry Points                                   | 395–398, 418, 420–424, 428, 429 |
| 5.19   | State Persistence Guardrails                            | 400–407 |
| 5.20   | Narrative Turn Conventions                              | 412 |
| 5.21   | Fate Base Capabilities                                  | 434–437 |
| 5.22   | Ironsworn Base Capabilities                             | 438–440 |
| 5.23   | Forged in the Dark Base Capabilities                    | 441–443 |

### 5.1 Output and Error Contracts

**REQ-101a — Assumption audit trail (Part a).**
In `production` mode, before the Convert workflow begins, the builder runs the `assumption_audit` prompt (a spec-level prompt shipped with the specification — not a server prompt) against the current spec revision. The builder records at least one challenged assumption per category in DECISIONS.md (0): technology, AI-as-builder, extraction and confidence, MCP ecosystem, state persistence, verification model, build process, runtime guarantees, spec process. The audit does not block the build. For spec revisions, a diff-only audit — challenging only assumptions affected by the spec delta — is acceptable.

**REQ-101b — Assumption audit trail (Part b).**
For same-spec builds against different rulesets, when a prior assumption audit exists for the same spec version, the builder re-audits only the categories affected by the ruleset paradigm delta. Categories unaffected by the ruleset change (technology, MCP ecosystem, verification model, build process) keep the prior audit results. The builder records the prior audit's ruleset fingerprint for traceability.

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
The tool raises `[WARNING]` when the operation succeeds but hits a condition that needs operator attention — corrupted-but-unused state, a seed conflict where a per-call seed overrides the session seed, or a speculative operation whose result the server cannot prove. The tool raises `[PARTIAL]` when the operation can produce a partial result but cannot fully answer the request. Examples: the tool returns two conflicting texts and explains the conflict, or a lookup lands on a section the ruleset marks incomplete or a placeholder.

**REQ-001a2 — Warning and Partial semantics (Part a2).**
Neither `[WARNING]` nor `[PARTIAL]` uses `isError: true`. *Acceptance criterion:* A corrupted Novel on disk produces `[WARNING]` in `spec_health` with the Novel slug enumerated; a search returning contradictory ruleset texts produces `[PARTIAL]` with both texts cited. _Check:_ T175.
**REQ-277 — Fixture evolution contract.** When a specification change breaks a
golden transcript assertion (Appendix B.3, N.3, W.3, X.3), the maintainer SHALL
version-bump the fixture. The maintainer SHALL also record the citing REQ that caused
the break in the fixture's changelog comment, and update the transcript and RNG
witness values to match the new expected behavior. A fixture transcript that fails
replay under a conformant server marks a spec defect — the fixture SHALL be updated,
not treated as a regression. The fixture version SHALL increment on any transcript
or witness-value change.
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
The tool raises `[RULE_VIOLATION]` when the input follows the tool's rules but breaks a ruleset constraint — a non-stacking bonus the caller applies twice, a character choice that conflicts with prerequisites, or an action the ruleset forbids. The response cites the ruleset anchor that forbids the action. The tool raises `[UNIMPLEMENTED]` when it sees valid input for a subsystem the ruleset defines but the builder could not extract; the builder records that subsystem as a DECISIONS.md waiver.

**REQ-002a2 — Extended error category semantics (Part a2).**
The response names the unimplemented subsystem and cites the waiver entry. *Acceptance criterion:* Applying a condition already active on the target returns `[ERROR] [RULE_VIOLATION]` citing the ruleset anchor; calling a tool for a waived subsystem returns `[ERROR] [UNIMPLEMENTED]` with the waiver reference. _Check:_ T176.
**REQ-002b1 — Corrective-action contract (Part b1).**
The `Corrective action:` line is a single imperative sentence describing what the caller must do to resolve the error — switching badges. For `[FORBIDDEN]`, providing a valid value from the enumeration for `[NOT_FOUND]`, or waiting for a state change for `[STATE_CONFLICT]`. The line is not a prompt, not a suggestion, and not a multi-sentence explanation. For `[UNIMPLEMENTED]`, the corrective action names the waiver entry in DECISIONS.md (5).

**REQ-002b2 — Corrective-action contract (Part b2).**
For `[SYSTEM]` errors (JSON-RPC `-32000`), no corrective action applies — the server cannot recover these at the tool layer. *Acceptance criterion:* Every tool-level error response contains exactly one `Corrective action:` line matching its category; protocol-level errors carry no corrective action. The `[SYSTEM]` category is catalogued in Appendix O.2. _Check:_ T178.
**REQ-002c1 — Badge-filtered error values (Part c1).**
`[NOT_FOUND]` and `[INVALID_INPUT]` errors hide values the caller's current badge cannot access — a Player badge sees only player-accessible spell names in a `[NOT_FOUND]` on `lookup_spell`; a Game Master badge sees the full catalogue. "Did you mean?" hints follow the same badge filter. For enumeration, the tool treats a value that exists in the ruleset but stays invisible to the caller's badge as absent — it neither enumerates nor hints at that value.

**REQ-002c2 — Badge-filtered error values (Part c2).**
This prevents side-channel disclosure of GM-only content through error message verbosity. *Acceptance criterion:* A Player-badge `[NOT_FOUND]` on `lookup_spell` with a GM-only spell name lists only player-visible spell names and provides no "Did you mean?" hint for the GM-only name. _Check:_ T179.
**REQ-003a — Roll transparency (Part a).**
_(F1)_ Every dice-roll tool returns the full calculation path: dice notation, individual die results, modifiers, total, and outcome. Every modifier's source and contribution is reported. Every modifier contribution SHALL identify the source by its ruleset name (e.g., "Strength", "Proficiency", "Bless spell"). When multiple sources contribute to the total, each SHALL be listed as a separate signed contribution — the modifier total SHALL NOT be collapsed into a single undifferentiated number. Sources with a zero contribution (e.g., a non-proficient skill) MAY be omitted.

**REQ-003b — Roll transparency (Part b).**
When a resolution mechanic rolls multiple dice of the same type and selects only a subset (advantage, disadvantage, keep-N-highest, drop-lowest, or luck rerolls), the tool reports every rolled face and marks which ones it selected. The selected or used face SHALL stand apart from discarded faces.

**REQ-003c — Roll transparency (Part c).**
When the ruleset defines named result bands (e.g., critical success, partial success, failure), the roll outcome reports which band applies to the total. *Acceptance criterion:* A d20 attack roll with advantage reports both d20 faces — e.g., `Dice: 2d20 = [12, 7], used: 12` — not just the higher value. A Strength-based attack roll with +2 proficiency reports `Modifiers: Strength +3, Proficiency +2` — not `Modifiers: +5`. _Check:_ G2, T47.
**REQ-004 — Truncation.** The tool truncates output longer than a configurable limit
with `… [truncated — full content: output://<tool>/<counter>]`. `output://`
payloads stay session-local and badge-filtered, and evict the oldest when exceeding the session
limit. Stat blocks shown within truncated output follow the same limit rules. Stat blocks use
the ruleset's baseline format, with all fields regardless of truncation
(see REQ-004a). Prompt output truncation (REQ-118, REQ-135) is a separate mechanism — REQ-004
governs tool-level output only.
*Acceptance criterion:* A tool output exceeding 32,000 bytes is truncated with an
`output://` pointer; retrieving the pointer returns the full content, badge-filtered.
_Check:_ T13.

**REQ-004a — Stat block baseline view.** Stat blocks use the ruleset's
baseline format, with all fields regardless of truncation. When the entire output
including a stat block exceeds the truncation limit, the server may replace the stat
block with an output:// pointer (REQ-004) — but the stat block SHALL NOT render
partially.
*Acceptance criterion:* A character-sheet rendering includes every stat field the
ruleset defines, in the ruleset's baseline format and order, regardless of whether
the output exceeds the truncation limit.
_Check:_ T13.

**REQ-179a — Output pointer resource template (Part a).**
`output://{tool_name}/{counter}` resource template in `resources/templates/list`. The template URI pattern SHALL be `output://{tool_name}/{counter}` where `{tool_name}` matches the producing tool's registered name and `{counter}` is a per-session monotonically increasing integer. `resources/read` on a resolved URI SHALL return the full untruncated tool output as Markdown, badge-filtered per REQ-032. The resource SHALL declare MIME type `text/markdown` and a title of the form "<tool_name> output #<counter>". Output payloads SHALL be session-local — they do not survive server restart.

**REQ-179b — Output pointer resource template (Part b).**
When the session's output storage exceeds a configurable limit, the oldest payload SHALL be evicted and its URI SHALL return `[ERROR] [NOT_FOUND]` with a message indicating eviction. *Acceptance criterion:* After a tool produces output exceeding 32,000 bytes, `resources/templates/list` includes `output://{tool_name}/{counter}`; reading the resolved URI returns the full untruncated content, badge-filtered; pushing storage beyond the limit evicts the oldest payload and its URI returns `[ERROR] [NOT_FOUND]`. _Check:_ T221.
**REQ-118a — Prompt length budget (Part a).**
Every prompt returned by `prompts/get` stays within a per-prompt token budget. When a prompt's constructed content exceeds its budget, sections are truncated in priority order (low-priority first) with `[truncated]` markers and pointers to the corresponding resource URIs where full content is retrievable. The truncation mechanism preserves the prompt's structural integrity — section headers remain, and required contract elements (intro pointer per REQ-063, `character (action: signal)` directives per REQ-078) are never truncated.

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
Tool output is comprehensive — every field the ruleset defines for the item or action is returned. The roll transparency contract (REQ-003) governs the format of dice-roll results. Combat lifecycle output (combat (action: advance)) SHALL follow the conflict lifecycle contract (REQ-043). Character creation and advancement results include all derived statistics alongside inputs (see REQ-181 for minimum surface). *Acceptance criterion:* A weapon lookup returns every field the ruleset defines for that weapon — damage dice, damage type, properties, weight, cost, range — not a summary.

**REQ-060b — Verbose output (Part b).**
A spell lookup returns level, school, casting time, range, components, duration, description, and at-higher-level effects — not a pointer or summary. A monster lookup returns its full stat block — AC, HP, speed, ability scores, saves, skills, senses, traits, actions — not a pointer. A class lookup returns hit dice, HP formula, proficiencies, features by level, and archetype paths. _Check:_ T47.
**REQ-061 — Source quoting.** Lookup results, search results, and rule-derived tool
responses include a `---`-separated source block with `<file>#<anchor>` label and verbatim
Markdown excerpt preserving original formatting. Pure-state tools (undo, state queries,
condition queries, audit reads) stay exempt.
*Acceptance criterion:* A spell lookup result ends with a `---`-separated block
containing `<file>#<anchor>` and the verbatim Markdown text from the source; an
undo result contains no source block.
_Check:_ T48.

**REQ-280a — Source-anchor citation (Part a).**
`lookup_equipment`, `lookup_monster`, `lookup_class`, and `ruleset (action: search)` — SHALL include, in every result, the source anchor from which extraction pulled the content. The anchor SHALL include: (a) the source file name; (b) the heading path (e.g., "Spells > Level 3 > Fireball"); and (c) the line range in the source Markdown (e.g., "lines 1420–1445"). The tool surfaces the anchor as a `source_anchor` field in the output, placed after the mechanical data and before any narrative framing. The anchor lets the caller verify the output against the ruleset source without re-running extraction.

**REQ-280b — Source-anchor citation (Part b).**
For `ruleset (action: search)`, every result item SHALL carry its own `source_anchor`. For canonical lookups returning a single entry, the anchor SHALL be the heading from which the entry was extracted. The anchor is derived from extraction metadata per REQ-010 (traceability) and SHALL be present even when the extraction confidence is LOW — the anchor labels the source, not the confidence. *Acceptance criterion:* `lookup_spell("fireball")` returns a `source_anchor` field with file name, heading path, and line range. Every result in `ruleset (action: search, "grapple")` carries its own `source_anchor`.

**REQ-280c — Source-anchor citation (Part c).**
A ruleset-free build returns `source_anchor: null` for all lookups (waived per REQ-013). _Check:_ T329.
**REQ-062 — Badge foundations.** `badge_briefing` includes ruleset-agnostic best-practice
foundations for each badge. The Synthesis workflow (§11.1) supplies the expanded foundations
catalogue at `guidance://<badge>/foundations` as supplementary guidance.
*Acceptance criterion:* `badge_briefing` for the Player badge includes ruleset-agnostic
foundations guidance; the Game Master briefing includes both player and GM foundations.
_Check:_ T26.

**REQ-070a — Anti-slop guidance (Part a).**
Badge foundations include anti-slop guidance — concrete examples of forbidden narrative patterns with corrected alternatives, tagged `[anti-slop]` and served at `guidance://<badge>/anti-slop`. The spec carries a synopsis in Appendix J; the Synthesis workflow (§11.1) sources the full anti-slop catalogue as supplementary guidance, with genre-specific examples from the `adventure_advice` module.

**REQ-070b — Anti-slop guidance (Part b).**
Anti-slop guidance is badge-filtered and appears in `badge_briefing` after foundations and before scene state. *Acceptance criterion:* (a) Without synthesis, `badge_briefing` includes at least one `[anti-slop]`-tagged item per badge sourced from the Appendix J synopsis, each carrying a forbidden narrative pattern and a corrected alternative; (b) the content is badge-filtered (rows 1–10 are GM-scoped, rows 5–7 and 12 are Player-scoped, rows 8–11 are GM-scoped); (c) anti-slop guidance appears after foundations and before scene state; (d) `guidance://<badge>/anti-slop` renders the same patterns as a retrievable resource. _Check:_ T223.
**REQ-184a — Anti-slop resource rendering (Part a).**
`guidance://<badge>/anti-slop` as a Markdown resource. The resource SHALL include every Appendix J synopsis pattern whose scope matches the requested badge. Each pattern SHALL appear as a `[anti-slop]`-tagged item with its Forbidden and Correct text. When synthesis is active (REQ-159), the resource SHALL include both the Appendix J synopsis and synthesis-supplied anti-slop items; synthesis items SHALL be tagged `[supplementary]` with source URL and confidence.

**REQ-184b — Anti-slop resource rendering (Part b).**
Without synthesis, the resource SHALL contain only the Appendix J synopsis. *Acceptance criterion:* `guidance://<badge>/anti-slop` returns Markdown containing every Appendix J pattern for the requested badge, each tagged `[anti-slop]` and badge-filtered; synthesis-sourced items carry `[supplementary]` with source URL. _Check:_ T223.
**REQ-194a — Anchor derivation (Part a).**
Anchors SHALL be derived from heading text deterministically: lowercase the text, strip punctuation, replace whitespace and hyphen-equivalent runs with single hyphens, and collapse consecutive hyphens. Explicit IDs (`{#id}`) take precedence over derived anchors. Role-scoping markers (`*Keeper only*`, `*Player only*`, or the ruleset's discovered badge terms) SHALL be stripped from the heading text before derivation. Duplicate derived anchors within a source file SHALL append `-1`, `-2`, etc. Duplicate explicit IDs across files SHALL be treated as an authoring defect. Re-indexing the same source SHALL reproduce identical anchors.

**REQ-194b — Anchor derivation (Part b).**
Punctuation stripped SHALL be the character class `[\p{P}\p{S}]` (Unicode punctuation and symbol categories); CJK and other non-ASCII word characters SHALL be preserved. *Acceptance criterion:* The same heading text processed twice through anchor derivation produces the same anchor. A heading with an explicit ID (`{#foo}`) uses `foo` regardless of its text. Two headings with identical derived text in the same file produce anchors suffixed `-1` and `-2`. _Check:_ T16, T236.
**REQ-071a — Narrative tone samples (Part a).**
`[narrative-tone]`-tagged guidance items per badge — example-of-play prose extracted from the ruleset that demonstrates the ruleset's narrative tone, served at `guidance://<badge>/tone`. Each carries source anchor and confidence. Discovery (§6.3) extracts these snippets as a guidance subcategory. When the ruleset provides none, the Synthesis workflow (§11.1) may source community examples.

**REQ-071b — Narrative tone samples (Part b).**
Entity-level voice_examples (REQ-077) form a separate category — dialogue snippets for specific characters. *Acceptance criterion:* `badge_briefing` includes at least one `[narrative-tone]`-tagged item per badge — a prose excerpt from the ruleset demonstrating its narrative voice, with source anchor and confidence. _Check:_ T26.
**REQ-064a — Badge behavioral boundaries (Part a).**
The server respects badge boundaries in all tool output. The AI's behavioral boundaries depend on its role. When the AI's narrative role is Game Master, it describes situations and surfaces information; it never takes action or decides on behalf of the player. When the AI's narrative role is Player, it describes character intent; it never prescribes world facts or narrative outcomes without Game Master confirmation. The `badge_briefing` orientation content delivers these boundaries, determined by the AI's role per REQ-304. When the AI has no narrative role (Editor-badge), tool output follows the active badge's boundary conventions.

**REQ-064b — Badge behavioral boundaries (Part b).**
A player's natural-language input may carry in-character and meta-intent at once — e.g., "I examine the altar" (character action) plus "what does my character see?" (meta-query). For that input, the `command (action: suggest)` tool SHALL return both tool categories: the in-character resolution (roll_skill_check, examine) and the meta-inquiry (ruleset (action: search) for altar lore).

**REQ-064c — Badge behavioral boundaries (Part c).**
The AI (when in the Game Master role), informed by `badge_briefing`, SHALL resolve the in-character component through narration and redirect the meta-intent component through tool calls — it SHALL NOT silently treat a meta-query as an in-character action resolved without the player's knowledge. The `character (action: signal)` tool SHALL accept a `register` signal with values `character` (speaking or acting in-character) and `meta` (asking a rules question or directing the GM out-of-character).

**REQ-064d — Badge behavioral boundaries (Part d).**
Setting `register=meta` SHALL suppress in-character narration in tool output — responses from `command (action: suggest)`, rule lookups, and similar tools present bare mechanical information without narrative framing. The register state persists for the session (discarded on connection close) and is visible in `badge_briefing` as a Player-Register line. Setting `register=character` restores narrative-framed output. The default register is `character`. When a badge is active, `badge_briefing` SHALL include a badge boundary directive — a single sentence: "You are in the story.

**REQ-064e — Badge behavioral boundaries (Part e).**
Confine tool use and responses to the current Novel. To step away from the table, call `set_badge(\"none\")`." The directive is identical for both badges. The directive SHALL appear after the badge foundations (REQ-062) and before the anti-slop guidance (REQ-070). The server never truncates the directive (REQ-135, tier 1). *Acceptance criterion:* A player typing "Can my character jump the chasm?" under `register=character` receives `command (action: suggest)` output with the acrobatics check tool AND a rules-lookup pointer; under `register=meta` the same input produces only mechanical information with no "you attempt to jump" narrative framing.

**REQ-064f — Badge behavioral boundaries (Part f).**
The register state appears in `badge_briefing` and does not persist across server restarts. The boundary directive appears in `badge_briefing` for both Player and GM badges. _Check:_ T51, T461. *Out of scope:* transport-layer error handling, client-side error formatting, error localization or internationalization, and error recovery strategies beyond the corrective-action model defined in REQ-002.
**REQ-001b1 — Error boundary (Part b1).**
Tool-level errors (all `[ERROR]` responses with a category from REQ-002) use `isError: true` and are normal `result` objects — the calling model receives the error text and can react. Protocol-level errors are for failures at the transport or request-routing layer — unknown methods, unparseable requests, or transport disconnection — and use standard JSON-RPC error codes per Appendix D. SDK-level schema validation failures (bad parameter types, missing required fields) surface as `-32602` before the tool handler runs and carry no REQ-002 taxonomy.

**REQ-001b2 — Error boundary (Part b2).**
A conformant server never emits a protocol-level error with a REQ-002 category string embedded. *Acceptance criterion:* A tool called with a structurally invalid parameter returns an SDK-level `-32602` response before the handler — this response does not contain `[ERROR] [INVALID_INPUT]` or a REQ-002 category. A tool called with a semantically invalid parameter returns a result with `isError: true` and `[ERROR] [INVALID_INPUT]`. _Check:_ T180.

**REQ-425a — Output format catalog (Part a).**
Every user-requestable artifact surface — a tool or resource that returns a content artifact — SHALL accept an optional format selector drawn from the output format catalog (Appendix T.1). When the caller omits the selector, the surface renders the catalog default. *Acceptance criterion:* Each universal catalog format requested on a content surface returns that artifact's content in the requested format. _Check:_ T505.

**REQ-425b — Output format validation (Part b).**
A requested format the surface does not support SHALL return `[INVALID_INPUT]` enumerating the formats the surface supports, filtered by badge per REQ-002. The enumeration SHALL derive from the catalog at call time per REQ-059. *Acceptance criterion:* Requesting a notation format on a stat-block surface returns `[INVALID_INPUT]` naming the supported formats; a Player badge enumeration excludes GM-only formats. _Check:_ T505.

**REQ-425c — Output format consistency (Part c).**
The same artifact rendered in the same format SHALL be byte-identical across every surface. Where an interchange schema exists (Appendix L, Appendix Q), the `json` render SHALL match it, so an interchange export and the corresponding resource render agree. *Acceptance criterion:* `novel://current?format=json` equals `novel (action: export, format="json")`; `character (action: sheet)` and `npc://<id>` agree in every catalog format. _Check:_ T505.

**REQ-425d — Ruleset-declared formats (Part d).**
A ruleset package MAY declare extra format identifiers in the catalog (Appendix T.1). A declared format renders on the surfaces the package defines and SHALL appear in those surfaces' enumerations and in `spec_health`. *Acceptance criterion:* A fixture package declaring a format renders it on its surfaces and lists it; an undeclared format returns `[INVALID_INPUT]`. _Check:_ T506.

### 5.2 Extraction and Confidence

During Discovery (§6.3), mechanical coupling metadata — which mechanics produce
world-affecting, entity-bearing, revealing, or temporally-urgent outcomes — is
populated alongside standard extraction per REQ-377. Coupling extraction annotates
existing extraction categories; it is not a separate category. Confidence labels
apply to coupling metadata the same as any extracted item.

**REQ-010 — Traceability.** Every modeled mechanic cites the ruleset anchor(s) from which
extraction produced it. The citation chain — Markdown source → modeled item → tool/resource →
verification — stays traceable end-to-end.
*Acceptance criterion:* `RULESET_MODEL.md` contains at least one anchor citation
per modeled mechanic; `spec_health` reports no uncited extractions.
_Check:_ T15.

**REQ-011a — Confidence (Part a).**
Every extracted item carries a confidence label: HIGH (unambiguous, directly from ruleset text), MEDIUM (interpretable but not explicit, or missing a discoverable trigger), or LOW (contradictory, image-conveyed, broken-link, or structurally defective). Book-level headings, source-converted sections, and callout types tagged non-normative cap at MEDIUM. Structured content covers formal tables, definition lists (bold-labeled terms with values), and ordered procedural sequences. An ordered procedural sequence is three or more consecutive imperative-verb sentences that describe a mechanic's resolution steps. Structured content reaches HIGH above the book-level cap when extraction stayed stable and not restructured.

**REQ-011b — Confidence (Part b).**
The builder identifies structured-procedural sequences using the same mechanical-indicator heuristics as the viability pre-check (§6.2): bold-labeled fields, imperative verbs, and definition-list markup. Sections flagged as "conveying mechanics" from images, diagrams, or flowcharts are LOW. Confidence is computed per-section and aggregated per REQ-147, with the player-filtered view as the gating metric. The player filter excludes: guidance items with GM-only badge scope (REQ-016), mechanics extracted from GM-only ruleset sections (REQ-032), and synthesis content tagged `[gm-only]` (REQ-080).

**REQ-011c — Confidence (Part c).**
The builder computes player-filtered confidence by applying these exclusions before aggregation per REQ-147. *Acceptance criterion:* A spell extracted from a table cell at a ruleset-normative heading carries HIGH confidence; an image-conveyed mechanic carries LOW. _Check:_ T15.
**REQ-147a — Confidence aggregation (Part a).**
Per-section confidence is the percentage of extracted items in that section carrying HIGH or MEDIUM labels, excluding items marked as guidance (REQ-016) from the per-section count. The overall player-filtered confidence — the Phase 1 gate metric — is the mean of per-section confidence scores, weighted by each section's extracted item count. LOW items count against the section total but do not contribute positively. A section with zero extracted mechanical items is excluded from the mean. The formula is: Σ(section_items × section_score) / Σ(section_items) where section_score = (HIGH + MEDIUM items) / total extracted items in section.

**REQ-147b — Confidence aggregation (Part b).**
`spec_health` expresses the overall score as a percentage. *Acceptance criterion:* A ruleset with three sections — Section A: 8 HIGH, 2 MEDIUM, 0 LOW; Section B: 3 HIGH, 3 MEDIUM, 4 LOW; Section C (guidance-only, 5 extracted guidance items) — produces per-section scores of Section A = 100%, Section B = 60%. Section C's guidance items are excluded from the mean per REQ-016. Overall = ((10 × 1.0) + (10 × 0.6)) / 20 = 80%. _Check:_ T181.
**REQ-153 — AGENTS.md troubleshooting.** Every build's AGENTS.md includes a
`## Troubleshooting` section documenting at minimum four failure classes —
config mismatch, corrupted state file, badge confusion, and missing
environment variables — each with steps an operator can follow without
access to the builder. The section must reference
verification commands that exercise the diagnosed failure mode where a
matching automated test exists.
*Acceptance criterion:* An operator encountering a `[STATE_CONFLICT]` from
a corrupted state file finds the Troubleshooting section listing the
corruption symptom, the recovery step (restore from `.bak`), and the
verification command to confirm recovery.
_Check:_ T186.

**REQ-154a — README.md handoff content (Part a).**
Every build's README.md presents four items. The first item is prerequisite
environment and setup instructions an operator can follow from a cold checkout.
The second item is a copy-paste `mcpServers` configuration entry whose key names
match the build-time client target's documented schema (§6.2 B3). The third item
is the RNG continuity contract — whether deterministic replay relies on a seed or
varies by session. The fourth item is the badge model with tool-access implications.

**REQ-154b — README.md handoff content (Part b).**
Every build's README.md also adds two more items. The fifth item is the state model
describing what survives restart and what stays connection-scoped. The sixth item is
a license footer rendering the Appendix U content license table, one line per source.
Each line lists source name, license identifier, and copyright holder. The lines flow
into a single semicolon-separated paragraph prefixed with "Built from:" and terminated
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
four sections. A Code Map: a REQ-to-source-file mapping listing every REQ and its primary
implementation file. A Verification section: commands for gates G0–G5 with
expected exit codes and pass criteria. A Troubleshooting section: common
operator-reported failure modes per REQ-153. Build Context: spec version,
ISO 8601 build date, builder model identifier, ruleset content hash per REQ-044,
and holonovel version. Missing sections, or sections without content, are handoff
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
The builder SHALL identify the ruleset's core resolution mechanic — the primary dice/outcome procedure. The builder SHALL apply these criteria in order, stopping at the first that yields a single candidate. Criterion (a) is the mechanic the ruleset's own introduction or "how to play" section designates as the central resolution procedure. Criterion (b) is the mechanic cited by the most other sections in cross-references. Criterion (c) is the mechanic with the most distinct dice-roll invocations across the ruleset's examples of play. The builder SHALL record the criterion used, alongside the identified mechanic, in DECISIONS.md (5).

**REQ-207b — Core-mechanic identification (Part b).**
If (a)–(c) produce a tie, the builder SHALL record all tied candidates and flag an `[ambiguous-core-mechanic]` finding. The core mechanic SHALL maintain at least 85% confidence independently of the overall threshold. WHEN the build operates in ruleset-free mode THE core-mechanic identification SHALL be skipped. The builder SHALL record "ruleset-free — no core mechanic" in the core-mechanic field of DECISIONS.md (5).

**REQ-207c — Core-mechanic identification (Part c).**
The builder produces no `[ambiguous-core-mechanic]` or `[core-mechanic-block]` finding — the absence is intentional and not a defect. *Acceptance criterion:* A build against a ruleset whose introduction names "d20 + stat vs target number" as the core mechanic correctly identifies it via criterion (a). DECISIONS.md (5) records the criterion used and the mechanic's confidence meets ≥85%. _Check:_ T251.
**REQ-012 — Graceful fallback.** A section that cannot be modeled as a tool or state remains
searchable via `ruleset (action: search)` and retrievable as a `ruleset://` resource.
The builder never fabricates mechanics to fill a gap. Missing triggers do not invalidate the modeled portion.
Search returns the expected section in the top 3 results for exact, prefix, and substring queries.
*Acceptance criterion:* An unmodelable section returns `[OK]` with the `ruleset://`
URI from `ruleset (action: search)` for an exact title query in the top 3 results.
_Check:_ G2, T4.

**REQ-315a — Full-text ruleset indexing (Part a).**
Every heading and its content from the ruleset Markdown SHALL be indexed by `ruleset (action: search)` at runtime. The index SHALL cover the entire ruleset — every `##` and `###` heading with its associated body text, regardless of whether the section content was extracted into a tool, resource, or model. Partial coverage where some ruleset sections are invisible to `ruleset (action: search)` is a construction defect. The builder SHALL verify at build time that the ruleset's table of contents maps to the search index and SHALL record any unmapped sections in DECISIONS.md (4) with justification.

**REQ-315b — Full-text ruleset indexing (Part b).**
The `Convert` workflow's artifact-disposition waivers exempt the sections they omit. *Acceptance criterion:* `ruleset (action: search, "ability scores")` returns results from the ruleset's character creation chapter. Every heading in the ruleset's own table of contents resolves to at least one search result for a heading-text query. _Check:_ T360.
**REQ-111a — Search result quality (Part a).**
Search results include match context — the surrounding text from which each match was drawn — sufficient for the caller to distinguish the match's relevance to the query. Results are ordered by relevance to the query terms. A search that returns more results than a configurable display limit includes a count of suppressed results. `ruleset (action: search)` confidence reflects query-term match strength, not the extraction confidence of the matched section. HIGH match confidence requires a non-stop query token in the section title or first heading; MEDIUM requires a match in section body text; LOW indicates peripheral or single-word matches.

**REQ-111b — Search result quality (Part b).**
This differs from extraction confidence (REQ-011). *Acceptance criterion:* Each result carries a confidence label (`[HIGH]`, `[MEDIUM]`, or `[LOW]`) on the same line as the heading; a multi-match search returns context snippets for each result, ordered by relevance, with a suppressed-result count when the display limit is exceeded. _Check:_ T114.
**REQ-212a — Generation table rolling (Part a).**
`ruleset (action: roll, table, seed?)` accepts a table name drawn from the build's indexed generation tables (§6.3 extraction category 4). The tool SHALL roll the dice notation embedded in the selected table's definition — including nested table references — and return the result row with dice breakdown per REQ-003. A deterministic seed parameter SHALL produce identical results across calls and sessions (per REQ-050). Tables tagged as GM-only during extraction SHALL return `[FORBIDDEN]` when called under the Player badge.

**REQ-212b — Generation table rolling (Part b).**
When the ruleset contains zero generation tables, `ruleset (action: roll)` SHALL return a clear "no tables indexed" message — the tool stays registered, per the content-absent tool contract (REQ-020, infrastructure tools clause). The tool carries the generation classification (REQ-015). *Acceptance criterion:* `ruleset (action: roll, "gear")` with seed `42` returns the table row for the gear table exactly; the same call without a seed returns a different row; `ruleset (action: roll, "gm-only-table")` under Player badge returns `[FORBIDDEN]`; a ruleset with zero tables returns "No generation tables indexed." _Check:_ T46, T210.
**REQ-013 — No assumed mechanics.** Nothing enters the model that does not trace to the
ruleset text. The builder never assumes a mechanic present in one edition or supplement but absent from the source.
Absent features — no advancement, no deletion, no spellcasting — produce no
tool; the builder records this absence in DECISIONS.md as a waiver with a re-activation condition.
The builder preserves inline formatting inside table cells; it never interprets it. Code blocks stay literal
text, never executed. Callouts produce no mechanics. Conditions apply and expire per the ruleset's own triggers.
*Acceptance criterion:* A species table missing advancement rules produces no
`advance_character` tool; the absence is recorded as a waiver in DECISIONS.md (5).
_Check:_ T25, T32, T33, T36.

**REQ-014 — Source immutability.** The builder hashes the ruleset Markdown — and, where conversion applied, the
original sources — at intake (SHA-256), and never changes them. The intake hash is
the golden record: the builder stores it in DECISIONS.md (1) at build time and records it in the
build fingerprint (REQ-065) as the definitive source identity. Any later comparison that
detects a change in the ruleset counts as drift detection, defined by REQ-065 — this requirement
concerns the freeze only.
*Acceptance criterion:* A sha256 hash of the original Markdown sources matches the intake
hash stored in DECISIONS.md; the source files on disk are byte-identical to the files
hashed at intake.
_Check:_ T21.

**REQ-015 — Action classification.** The builder classifies every modeled action into one of
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
| state-reading    | `character (action: sheet)`, `session (action: recap)`        | `true`            | `false`            | `false`        | `false`         |
| command          | `character (action: create)`, `scene (action: set)`     | `false`           | `true`             | `false`        | `false`         |
| generation       | `adventure (action: generate)`, `ruleset (action: roll)`, `scene (action: oracle)`     | `false`           | `false`            | `false`        | `false`         |
| hybrid           | `adventure (action: generate_encounter)`, `roll_weapon_damage`| `false`           | `true`             | `false`        | `false`         |

The `openWorldHint` is `false` for all tools when the server operates without
network access (the default per REQ-051). A server configured with network
access SHALL set `openWorldHint: true` on tools whose output depends on
external content.

**REQ-214a — Table classification (Part a).**
Every table extracted from the ruleset SHALL carry a `type` field of `generation` or `lookup`. A generation table contains at least one dice-range-to-result row and is registered under `ruleset (action: roll)`. A lookup table contains only deterministic reference data and is registered as a `lookup_<category>` tool or served via `ruleset://` resources. A table containing any dice-range row is a generation table — generation and lookup rows SHALL NOT coexist in the same registered tool entry.

**REQ-214b — Table classification (Part b).**
When the ruleset contains zero generation tables, `ruleset (action: roll)` SHALL be registered with an empty domain and return `[NOT_FOUND]` with a clear "no random generation tables in this ruleset" message on any call. The tool description SHALL reflect this — it SHALL NOT advertise canonical table names that resolve to nothing.

**REQ-214c — Table classification (Part c).**
When the ruleset contains at least one generation table, `ruleset (action: roll)` SHALL enumerate valid table names in its input schema dynamically from the ruleset model. *Acceptance criterion:* Building for D&D 5e produces a `ruleset (action: roll)` whose `table` parameter enumerates only generation tables (trinkets, madness tables, wand of wonder, etc.) — not lookup tables (ability_modifiers, difficulty_classes). Building for a ruleset with zero generation tables registers `ruleset (action: roll)` with an empty domain and a "no tables" response. _Check:_ T255.
**REQ-016 — Guidance extraction.** The extractor pulls role-addressed prose (imperatives, statements of
responsibility, advice, tone/setting text, examples of play) verbatim as
guidance items, each with attribution, confidence, and badge scope. The builder treats guidance as quoted
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

**REQ-018 — Extraction evidence.** The verbatim source text that grounds each extraction decision appears alongside it in RULESET_MODEL.md.
*Acceptance criterion:* RULESET_MODEL.md includes a verbatim source quote for
every extraction decision; a reviewer can trace any modeled mechanic to its
original text without opening the ruleset.
_Check:_ T15; Discovery
checkpoint.

**REQ-146a — Reconciliation authority (Part a).**
When the ruleset restates a mechanic across multiple sections (e.g., a procedure and a summary table disagree), every source SHALL be recorded.

**REQ-146b — Reconciliation authority (Part b).**
The builder SHALL determine authority by applying these criteria in order, stopping at the first that yields a single candidate. Criterion (a) is the section the ruleset's own index or table of contents designates as the primary reference. Criterion (b) is the section whose heading text best matches the mechanic name. Criterion (c) is the section within the ruleset's core-mechanics chapter — the chapter at the shallowest heading depth containing the highest proportion of mechanical sections. Criterion (d) is the section with the most explicit procedural text, measured as the highest count of imperative verbs (roll, add, subtract, compare, apply) within the section's mechanics paragraphs.

**REQ-146c — Reconciliation authority (Part c).**
If (a)–(d) produce a tie, all tied sections SHALL be recorded as co-canonical (MEDIUM confidence) and the ambiguity flagged as an `[authority-tie]` defect. The builder SHALL record which criterion resolved each reconciliation in the defect log. The most authoritative section SHALL be treated as canonical; other sources SHALL be LOW confidence. *Acceptance criterion:* A mechanic restated in three sections — one in the core-mechanics chapter, one in a summary table, and one in a supplement — assigns canonical status via criterion (c). With a ruleset whose index points to the summary table, criterion (a) overrides.

**REQ-146d — Reconciliation authority (Part d).**
The builder produces an `[authority-tie]` defect when (a)–(d) all produce a tie. _Check:_ T174.
**REQ-209 — Cross-format consistency.** Before server construction begins, the builder
SHALL sample 10 items at random from the extraction model, spanning at least three of the
seven extraction categories (§6.3). For each sampled
item, the builder SHALL verify that RULESET_MODEL.md and ruleset_model.json
agree on name, source anchor, confidence label, and action classification.
A mismatch counts as a discovery defect, recorded in the defect log with both values, and
SHALL be resolved before construction begins.
*Acceptance criterion:* After extraction, RULESET_MODEL.md and ruleset_model.json agree on
all four fields for 100% of sampled items. A single mismatch blocks construction until
resolved.
_Check:_ T252.

**REQ-210a — Extraction categories (Part a).**
The builder SHALL extract ruleset content into seven categories, in dependency order within each chunk. Concepts: named ruleset terms (stats, moves, conditions, statuses). Entities: character types, monsters, NPCs with fields and lifecycle. Tables: lookup tables and generation tables with dice notation. Actions: resolution mechanics, commands, generation — classified per REQ-015. Resolution: the core mechanic (dice notation, stat associations, result bands). Roles: Player and Game Master terms from the ruleset. Guidance: badge-addressed prose, verbatim with attribution and badge scope.

**REQ-210b — Extraction categories (Part b).**
A cross-category reference that cannot resolve against the inventory of earlier extractions within the same chunk SHALL become a MEDIUM-confidence finding in the defect log. The finding carries a deferred-reference annotation. *Acceptance criterion:* A ruleset chunk whose Actions reference a Concept term defined within the same chunk resolves that reference against the Concept inventory. A reference to a Concept term not yet extracted produces a deferred-reference annotation which resolves after cross-chunk resolution. _Check:_ T173.
**REQ-215a — Table content extraction (Part a).**
The builder SHALL extract generation table content from the ruleset and register it as `ruleset (action: roll)` entries. For each generation table, the builder SHALL produce five fields. A canonical `key` (snake_case slug derived from the source heading). A `dice_expression`. A `ranges` array (min/max/result tuples). A `badge_scope` (derived from source location — tables in GM-only chapters are `game_master`, otherwise `shared`). A `source_anchor` (heading and file path). Table content extraction follows the same confidence labeling and traceability rules as other extraction categories (REQ-011, REQ-010).

**REQ-215b — Table content extraction (Part b).**
The builder SHALL detect dice-range tables from Markdown table cells containing `d100`, `d%`, `d8`, `d20`, or explicit numeric ranges (`01-10`, `11-25`). A row whose first column is a numeric range is a generation result row. A row whose first column is a name or label (not a numeric range) is a lookup row.

**REQ-215c — Table content extraction (Part c).**
Each generation table entry SHALL be stored in the ruleset model under `generation_tables` with its full content, and the server SHALL serve it via `ruleset (action: roll)` at runtime. *Acceptance criterion:* The D&D 5e build extracts at minimum the Short-Term Madness, Long-Term Madness, Indefinite Madness, Reincarnate Race, Wand of Wonder, and Trinkets tables. Each table entry includes dice_expression, ranges with result text, and a source_anchor. `spec_health` reports the count of extracted generation tables. _Check:_ T256.
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
When the Convert workflow is selected (§6.2), source materials are converted to Markdown per Appendix G. The builder SHALL select a converter satisfying the capability profile in Appendix G.1 and record the selection in DECISIONS.md (2). Conversion fidelity SHALL be verified per Appendix G.2; progressive sampling is the RECOMMENDED verification method: trial page (Phase 1) at ≥70% fidelity gates the batch, content-type expansion (Phase 2) gates at ≥90% per type, and batch conversion (Phase 3) completes the source.

**REQ-102b — Source conversion contract (Part b).**
PDF sources SHALL additionally follow the format-specific protocol (Appendix G.3): column detection, multi-page table reassembly, image-content classification, and OCR fallback. HTML sources SHALL additionally follow the format-specific protocol (Appendix G.4): dynamic content detection, chrome stripping, chrome fingerprinting, pagination, and content-type classification. The builder SHALL run cross-converter verification (Appendix G.6) on the fidelity sample pages. Fidelity results SHALL be reported in the structured format (Appendix G.5). The converter and its version are pinned in DECISIONS.md (2).

**REQ-102c — Source conversion contract (Part c).**
Flagged artifacts receive a disposition in DECISIONS.md (5): `fixed`, `waived`, or `pending`. Conversion fidelity rates appear in `spec_health` (REQ-025). *Acceptance criterion:* A converted PDF produces a fidelity report in `spec_health`; any content type below 90% fidelity blocks the batch and records a disposition in DECISIONS.md (5). DECISIONS.md (2) records the selected converter and any cross-converter verification results in DECISIONS.md (5). _Check:_ T93.
**REQ-225a — Ruleset Wisdom extraction (Part a).**
During Discovery (§6.3), the builder SHALL classify extracted guidance into seven Ruleset Wisdom output modules using the ruleset's own text. Classification is feedback-driven — barren modules SHALL trigger re-reading of the most likely source section. When ruleset-native extraction leaves a module barren, the builder SHALL attempt vendor-content population (§11.2). At least 4 of 7 modules SHALL be populated. Items carry `[ruleset]` or `[vendor]` tag with source anchor.

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
The server models behavior as MCP tools using ruleset terminology — never invented names. Infrastructure tools in four immutable categories — World, Novels, Badges & Workflow, Narrative (enumerated in Appendix T) — SHALL always be present. Character creation, condition management, combat, table rolling, and session recap are the minimum ruleset-derived categories; the builder records missing categories as waivers.

**REQ-020b — Tools (Part b).**
Tools whose results depend on indexed ruleset content produce empty or context-only results when the index lacks that content. *Acceptance criterion:* `tools/list` includes at minimum character creation, condition management, combat, table rolling, and session recap tools; a missing category is recorded as a waiver in DECISIONS.md. _Check:_ T3, T5, T32, T33; G2.
**REQ-021 — Tool-surface economy.** A named set of related operations (one per table, one
per move, one per stat) shares a single parameterized tool. The tool surface is determined
by extraction, not by what a builder finds easy to implement. The per-tool justification
list matches the registry.
*Acceptance criterion:* No two tools share identical parameter schemas differing
only by category enum; the per-tool justification list in DECISIONS.md matches the
live `tools/list` registry.
_Check:_ T3, T35.

**REQ-408 — Tool parameter ceiling.**
No advertised tool SHALL expose more parameters than a ceiling recorded at build time in DECISIONS.md; inputs beyond the ceiling move to a refinement or retrieval call. For an action-discriminator tool (REQ-413), the ceiling is evaluated per action — against what a single action requires, not the union of optional fields. The ceiling applies to infrastructure and ruleset-derived tools alike; per-tool and per-action counts SHALL be recoverable from `spec_health`.
*Acceptance criterion:* No tool exceeds the recorded ceiling (per-action for action-discriminator tools); an operation needing more inputs splits into a compact entry call plus a refinement path; `spec_health` reports per-tool and per-action parameter counts. _Check:_ T477.

**REQ-413 — Action-discriminator tool surface.**
When the builder determines that a group of operations shares a domain but not a common
input or output contract, the operations SHALL be exposed as one entry tool carrying an
action discriminator rather than as sibling tools. Each action SHALL be documented as
its own sub-REQ. The discriminator SHALL name actions in the ruleset's own terms, and the
parameters and contract of each action SHALL be recoverable from `spec_health`.
Consolidation SHALL NOT alter any action's output contract.
*Acceptance criterion:* a domain with distinct operations exposes one entry tool whose
discriminator enumerates them; each action is documented as a sub-REQ; `spec_health`
exposes per-action contracts. _Check:_ T486.

**REQ-414 — Schema-surface economy.**
A tool's advertised input schema SHALL prefer the most compact form that carries the same
information and preserves strict server-side validation. Where the builder judges two
forms equivalent, it SHALL substitute example values for nested structural descriptions.
The advertised form SHALL be self-explanatory to a caller without external documentation
and SHALL NOT weaken the input-validation contract of REQ-054. `spec_health` SHALL report
how many advertised inputs use nested structural form. The server SHALL record in
DECISIONS.md every input that remains in non-compact form when a compact form was
available.
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
The server provides resources covering ruleset content (with badge filtering). The
resource catalog also includes entities at collection and individual URIs, the audit log,
the roster, and badge-specific guidance (foundations, anti-slop, tone, badge-switch). The
catalog further includes scene state, countdowns, the party roster, and NPCs at collection
and individual URIs. The catalog covers entity personality and voice examples, lore
entries, synthesis modules, and adventure content. Finally, the catalog includes novel
state, rooms and things, and the world map and kind registry. The catalog adds the
knowledge graph, the build specification, and per-tool output pointers.

**REQ-022b — Resources (Part b).**
`resources/templates/list`
advertises entity, roster-record, and output-pointer templates.
`resources/read` returns Markdown with a source header.
*Acceptance criterion:* `resources/list` includes all required URIs;
`resources/templates/list` includes entity, roster, and `output://` templates;
each resource declares a media type and title.
_Check:_ T16, T104.

**REQ-296a — Knowledge-graph resource (Part a).**
THE server SHALL provide a `graph://novel` resource returning the Novel's entity-relationship graph as a structured adjacency list. The resource SHALL include the following sections: (a) `entities` — all Novel entities with their current relationships; (b) `npcs` — all NPCs with relationships, dispositions, and location; and (c) `lore_connections`. The other sections are (d) `secrets` — secret lore entries mapped to the entities that have had them revealed — and (e) `factions` — faction memberships. The resource is badge-filtered: Player badge sees only relationships involving their active entities, `shared`-scope lore, and revealed secrets.

**REQ-296b — Knowledge-graph resource (Part b).**
When no Novel is active, `resources/read` returns `[STATE_CONFLICT]`. `graph://novel` has no briefing presence per §5.10. *Acceptance criterion:* After creating 2 NPCs with a relationship, setting a faction with 1 member NPC, and revealing a secret to entity "hero", `graph://novel` under the GM badge includes entities, NPCs with relationships, lore_connections, secrets, and factions. _Check:_ T341.

**REQ-296c — Knowledge-graph resource (Part c).**
`graph://novel` SHALL accept an optional `projection` query that selects a filtered view. The `political` projection returns factions, memberships, and relationships among factions and NPCs. The `timeline` projection returns entities and relationships ordered by most recent scene or journal timestamps. The `geography` projection returns rooms with located NPCs, things, and exits. An absent or unrecognized projection SHALL return the current adjacency list. Badge filtering SHALL apply unchanged to every projection.
*Acceptance criterion:* a Novel with two factions, a member NPC, and two connected rooms returns distinct political, timeline, and geography views; the Player badge receives filtered projections. _Check:_ T516.

**REQ-426a — MCP Apps UI resource surface (Part a).**
The server SHALL expose interactive HTML views of user-requestable artifacts as UI resources under the `ui://` scheme, per the MCP Apps extension, served with the `text/html;profile=mcp-app` MIME type. Each UI resource SHALL render the same artifact as its `html` catalog format (REQ-425) and SHALL declare no external origins in its UI metadata. *Acceptance criterion:* `resources/list` exposes `ui://` templates for stat-block, codex, lore, and Novel surfaces, each returning `text/html;profile=mcp-app` content matching the artifact's `html` render. _Check:_ T507.

**REQ-426b — Tool-UI linkage (Part b).**
A content tool SHALL reference the UI resource for the artifact it returns through tool-result metadata, so a negotiating host can present the interactive view. *Acceptance criterion:* `character (action: sheet)` output carries metadata pointing to its `ui://` resource. _Check:_ T507.

**REQ-426c — MCP Apps capability negotiation (Part c).**
The server SHALL declare the MCP Apps extension capability during initialization. When a client does not negotiate the extension, `ui://` resources and linkage metadata SHALL be absent and text surfaces SHALL serve unchanged. *Acceptance criterion:* A negotiating client receives `ui://` resources and linkage metadata; a non-negotiating client sees neither and all text output is unchanged. _Check:_ T507.

**REQ-426d — UI resource security (Part d).**
UI resources SHALL be static, self-contained HTML with no external network origins; the server SHALL declare restrictive CSP metadata and SHALL NOT embed credentials. *Acceptance criterion:* every `ui://` resource's UI metadata declares no external origins. _Check:_ T507.

**REQ-023a — Prompts (Part a).**
The server provides prompts covering multi-step workflows, badge briefing, connection introduction (REQ-063), session zero (REQ-078), and Novel setup (REQ-089). Tool-use intent mapping is handled by the `command (action: suggest)` tool (REQ-084) rather than a prompt — a dedicated prompt for this function is redundant. The remaining intent-mapping prompt (`run_workflow`) derives its tool associations from the registered tool catalog and the ruleset extraction model's action classifications (REQ-015) — not from hardcoded keyword strings that assume a specific ruleset's terminology.

**REQ-023b — Prompts (Part b).**
Adding a tool, resource, or guidance item updates prompt output without restart. `prompts/get` returns exactly one user-role message. `prompts/list` carries a title on every prompt and a description on every argument. *Acceptance criterion:* Removing a stub tool and restarting removes it from all five prompts; adding a tool updates prompt output without restart; `prompts/list` carries a title on every prompt and a description on every argument. _Check:_ T22, T28, T155.
**REQ-024a — Tool documentation (Part a).**
Every tool carries a `title` field with the ruleset's own term for that action. Annotations match action classification. *Acceptance criterion:* Every tool's `title` field uses the ruleset's own term for that action; a `lookup_weapon` tool under D&D 5e is titled "Weapons" not "lookup_weapon." _Check:_ T3, T35, T39. The `description` field SHALL follow a three-clause structure: a one-line summary of the tool's action (verb + object), a "Use when:" clause naming concrete scenarios that select this tool, and a "Do NOT use when:" clause naming sibling tools the caller should prefer for similar-sounding requests.

**REQ-024b — Tool documentation (Part b).**
The server truncates descriptions longer than three sentences in `tools/list`; the full text remains available at `resources/read`. *Acceptance criterion:* Every tool's description contains all three clauses; overlapping tools (e.g., `roll_weapon_attack` and `roll_weapon_damage`) name each other in their disambiguation clauses; a verifier can map a natural-language player intent to the correct tool using only the tool descriptions. _Check:_ T3, T49.

**REQ-427 — Tool parameter semantics.**
Every advertised tool SHALL describe each input parameter in its JSON Schema — its meaning, allowed values, and the default applied when omitted — so a caller can invoke the tool correctly without external documentation. An advertised parameter lacking a description is a definition defect. *Acceptance criterion:* the input schema of every registered tool carries a description on every parameter naming its meaning and, where applicable, its allowed values and default. _Check:_ T509.

**REQ-450 — TDQS-conformant tool definitions.**
Every host tool SHALL meet the Glama TDQS standard. Its description SHALL enumerate every action, declare a mutation-class annotation (read-only, destructive, idempotent, or open-world), disclose side effects (persistence, audit, badge gating, reversibility) for each mutating action, and state the return or error behavior for each action. Tools with four or more parameters SHALL state which parameters apply to each action. *Acceptance criterion:* every registered tool carries an annotation matching its mutation class and a description naming all of its actions with side-effect and return behavior. A mutating action lacking side-effect disclosure is a definition defect. _Check:_ T536.

**REQ-025a — spec_health (Part a).**
The `spec_health` report — produced by the `session` tool's `health` action — reports build-health metrics derived from live registrations at call time, not from hardcoded numeric literals.

**REQ-025b1 — spec_health (Part b1).**
Reported categories include several groups. Confidence scores appear per-file and overall. For builds that converted content, conversion fidelity reports per-content-type rates, the overall rate, the sample set, unresolved ambiguities, and confidence cap counts. The convergence summary covers per-metric iterations, findings, residual gaps, and the per-extraction-category confidence breakdown. Indexed counts cover anchors, concepts, entity types, actions, tables, procedures, guidance items, and synthesis items per module. The remaining categories report pending sections, MUST-action coverage, defect count, ruleset-version status, verification workflow dispositions, and the Novels available on disk.

**REQ-025b2 — spec_health (Part b2).**
`spec_health` also reports prompt health — each registered prompt's presence, length relative to budget, and stale references. The report also includes a gap audit section that compares the current spec version against the build-time version, with tool-catalog, resource-map, prompt-list, and badge-gating comparisons. Cross-reference health reports the total, resolved, unresolved, and unresolved percentage across discovered ruleset cross-references, with regression detection on rebuild. Pattern Buffer scenarios report the passed count, total count, and last-run timestamp. Search index coverage reports total headings, indexed headings, and coverage percentage, with unmapped sections flagged where coverage sits below threshold.

**REQ-025c — spec_health (Part c).**
The Player badge sees only player-filtered metrics. Build-phase-dependent sections (the convergence summary and the gap audit) appear only after the build completes. *Acceptance criterion:* `spec_health` counts match the live registry — adding a tool, resource, or prompt increments the count immediately; counts are derived from arrays at call time, not hardcoded. _Check:_ T15, T45, T93, T105, T154.

**REQ-411 — Stable-metadata caching.**
Rendered content that does not change between calls — tool schemas, prompt scaffolding, and
taxonomy vocabularies — SHALL be cached and served on repeat without recomputation. A
session pays the render cost once. A cached entry SHALL invalidate when its source
registration changes, preserving the live-registration dynamism of REQ-023b and REQ-025. The
cache SHALL never alter tool output or badge filtering. `spec_health` SHALL report cache
coverage.
*Acceptance criterion:* A repeated read of stable metadata returns the cached entry without
recomputation; mutating a registration invalidates the cache and the next read reflects it;
outputs are identical cached or not; `spec_health` reports coverage. _Check:_ T480.
**REQ-160a — Synthesis health reporting (Part a).**
`spec_health` SHALL report synthesis status with these minimum fields. Field (a), `synthesis_active`, is a boolean indicating whether synthesis state exists. Field (b), `module_counts`, reports the per-module item count for each of the seven output modules (§11.1). Field (c), `stale_count`, counts inactive synthesis items whose `collected_at` exceeds `TTRPG_SYNTHESIS_STALE_DAYS`. Field (d), `activated_count`, counts synthesis items the Game Master has incorporated into active Novel state via Novel-scoped tools (REQ-159). Field (e), `fingerprint`, holds the synthesis fingerprint used for idempotence detection (ruleset content hash plus intake answers).

**REQ-160b — Synthesis health reporting (Part b).**
Stale items SHALL appear with the `[stale]` flag when listed. When synthesis has never been run, `synthesis_active` is false and all count fields are zero. When synthesis is absent (never run or reverted), `module_counts` SHALL include all seven module names — `voice_examples`, `briefing_order`, `lore_templates`, `action_patterns` and `supplementary_guidance`, `adventure_advice`, `narrative_voices` — each with value zero. An absent `module_counts` field or an empty object does not satisfy this contract.

**REQ-160c — Synthesis health reporting (Part c).**
The synthesis health section is visible to all badges — Player and GM alike see whether synthesis is active and how many items are stale, but per-module content is badge-filtered per REQ-080. *Acceptance criterion:* After synthesis, `spec_health` reports `synthesis_active: true`, per-module counts matching the manifest, and a non-empty fingerprint. After `synthesis (action: revert)`, `synthesis_active` is false and all counts are zero. Stale items increment `stale_count` and carry `[stale]` flag. After GM activates a lore template via `lore (action: set)`, `activated_count` increments by one. _Check:_ T195.
**REQ-169a — Audit chain integrity reporting (Part a).**
The `audit_chain` field contains three values. The `valid` value is true while the hash chain remains unbroken from the first entry to the last; it turns false when any entry's hash does not match the computed chain. The `entries` value holds the total count of audit entries. The `first_broken_index` value holds the zero-based index of the first entry whose hash verification fails, and it stays absent while `valid` is true. Chain verification is performed at `spec_health` call time by recomputing every entry's hash from the preceding entry's hash. A Novel with zero audit entries reports `valid: true, entries: 0`.

**REQ-169b — Audit chain integrity reporting (Part b).**
When no Novel is active, the field does not appear. *Acceptance criterion:* A Novel with 5 valid entries reports `audit_chain: { valid: true, entries: 5 }` with `first_broken_index` absent; tampering with entry 2's hash produces `valid: false, first_broken_index: 2`; the field is absent when no Novel is active. _Check:_ T204.
**REQ-138a — Prompt health reporting (Part a).**
`spec_health` SHALL include, for each registered prompt: its name, presence (present/absent), character length, the configured budget from REQ-118, a budget-compliance flag (within/exceeded), and a stale-references list. The stale-references list names tool or resource names appearing in the prompt's rendered text that do not match any name in the live tool registry or resource map. A stale reference is one whose name (matching by exact string or the MCP SDK's registration name) appears in the prompt text but is absent from the live registrations at call time. The absence of any stale references SHALL be reported as an empty list.

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
The `holodeck_config` field reports coverage of behavioral configuration.

**REQ-388b — Holodeck config discovery (Part b).**
The field SHALL contain the following values. The `behavioral_coupled` value counts behavioral `TTRPG_*` variables whose configuration has a coupling row in §7.7.1a with a Session-archetype source. The `behavioral_total` value counts behavioral `TTRPG_*` variables classified as affecting pacing, autonomy, reactivity, synthesis, narration, or tone. The `natural_language_paths` value maps each behavioral variable name to its natural language access path — the `character (action: signal)` signal type or `scene (action: directive)` keywords that control it. The `uncoupled` value lists behavioral variable names lacking a natural language access path.

**REQ-388c — Holodeck config discovery (Part c).**
System variables (storage caps, file paths, build parameters, seed values) SHALL be excluded from the behavioral count. The classification of each `TTRPG_*` variable as behavioral or system SHALL be recorded in DECISIONS.md at build time.

**REQ-388d — Holodeck config discovery (Part d).**
When no Novel is active, `holodeck_config` SHALL report server-level defaults without Novel overrides. *Acceptance criterion:* After a build with `TTRPG_PACING_WINDOW=6` and `TTRPG_NPC_AUTONOMY=off`, `spec_health.holodeck_config` reports `behavioral_coupled: <N>`, `behavioral_total: <M>`, `natural_language_paths` listing each coupled variable's natural language path, and `uncoupled` listing any behavioral variables without a coupling row. _Check:_ T450.
**REQ-105 — Spec resource.** The server provides a `spec://build` resource,
retrievable via `resources/read` and listed in `resources/list`. The resource returns the
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
The server carries its build-time specification version in the build fingerprint, surfaced through `spec_health` under a `spec_version` field. The version is a CalVer date-stamp (YYYY.MM.DD) matching the CHANGELOG entry date at which the specification was last substantively changed. The builder records the spec version in DECISIONS.md §2 Pinned Versions at intake and sets the server's `package.json` version to the same value. The two SHALL agree; a mismatch is a build-time defect that blocks handoff. Publication tooling SHALL verify the version equals the date of the latest substantive CHANGELOG entry before push; a stale version blocks publication. _Check:_ T493.

**REQ-107b — Version coordination (Part b).**
During a spec-driven update (REQ-098), the builder compares the current spec version against the server's recorded version: when the spec version has advanced, the gap audit proceeds; when unchanged, the builder reports the server as current and exits without mutation. The version string is informational — it does not gate runtime behavior beyond reporting. *Acceptance criterion:* `spec_health.spec_version` is a CalVer date-stamp matching DECISIONS.md §2 Pinned Versions; the server's `package.json` version matches both; a gap audit against the same version exits "current" without mutation. _Check:_ T106.
**REQ-187a — Spec content hash computation (Part a).**
The builder SHALL compute the specification content hash at build time from the embedded spec file (`holonovel.md` in the server directory, per §6.4) and record it in the server's build fingerprint. The stored hash SHALL be read from the build fingerprint at runtime — never from a hardcoded literal. A mismatch between the stored hash and the embedded file's current hash at startup SHALL surface as a warning on stderr and in `spec_health`.

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
Before any workflow begins, the builder SHALL present the operator with Q0 (workflow selection) and, when two or more workflows are selected, Q1 (pause toggle). After Q0 and Q1, the builder SHALL present all questions relevant to the selected workflows in one batch. Answers SHALL be recorded in DECISIONS.md (1) before any workflow execution begins. A build that begins without recorded answers for all selected-workflow questions fails the process-compliance convergence metric (§6.5). When an operator selects workflows at different times, the builder SHALL re-ask only the new workflow's questions.

**REQ-161b — Intake workflow contract (Part b).**
After recording answers, the builder SHALL confirm back: selected workflows, all answers, and the first workflow to execute. Non-interactive runs SHALL use the defaults enumerated in §6.2. The default for Q0 SHALL be determined by network probing: when the probe succeeds, the default is `build + synthesis (action: run)`; when the probe fails, the default is `build` only; the builder SHALL record the probe result in DECISIONS.md (1). *Acceptance criterion:* A build started without DECISIONS.md (1) intake answers fails the process-compliance metric. A non-interactive run with network detected defaults to `build + synthesis (action: run)`.

**REQ-161c — Intake workflow contract (Part c).**
A run re-selecting an additional workflow re-asks only that workflow's questions. _Check:_ T196.
**REQ-162a — Build-mode profiles (Part a).**
The build SHALL operate in one of two modes, selected at intake via B9. The default `production` mode SHALL run the full quality suite: the assumption audit (REQ-101), per-step audits with auditor pre-flight (§6.5), post-write verification on every file written during construction (§6.5.3), cross-model auditing when available (§6.5.2), and the full Pattern Buffer (§6.6). The `quick-build` mode SHALL narrow the overhead: it skips the assumption audit and the auditor pre-flight, scopes post-write verification to critical files only (DECISIONS.md, MCP client configuration, on-disk Novel state), and accepts same-model audits.

**REQ-162b — Build-mode profiles (Part b).**
The Pattern Buffer SHALL gate both modes — any build that creates or modifies tools MUST pass the Pattern Buffer before marking complete. A quick-build-mode build SHALL record a `quick-build` annotation in DECISIONS.md (6) listing which rituals were skipped. A quick-build-mode build is runnable but not handoff-ready. *Acceptance criterion:* A production build records assumption audit (T89), auditor pre-flight, and cross-model audit results. A quick-build build records a `quick-build` annotation listing skipped rituals and passes the Pattern Buffer.

**REQ-162c — Build-mode profiles (Part c).**
A quick-build build without the annotation fails the process-compliance metric. _Check:_ T197.
**REQ-163a — Client config verification (Part a).**
After writing the MCP client configuration entry, the builder SHALL fetch the target client's documentation for its MCP server config schema (from the B3 answer) and verify every key name in the written entry matches the target's documented conventions. Known schema variants (including `workdir` vs `cwd`, `env` vs `environment`, `args` array placement vs appended to `command`) SHALL be checked. An incorrect key is a client-config defect (F6) and SHALL block the build until remedied.

**REQ-163b — Client config verification (Part b).**
When B7 is `yes`, the builder SHALL write the server entry into the client's config file and immediately verify the server launches via the client's documented invocation: the initialize handshake SHALL succeed with `serverInfo.name` matching the `mcpServers` key. A `server unavailable` error SHALL stop the line. *Acceptance criterion:* A config entry with `workdir` targeting a client expecting `cwd` produces an F6 defect and blocks the build. After correction, the initialize handshake succeeds with matching `serverInfo.name`. _Check:_ H11.
**REQ-164a — Viability pre-check (Part a).**
After G0 structural integrity passes but before chunked discovery begins, the builder SHALL count mechanical sections — headings containing procedures, tables, bold-labeled fields, or definition lists — as a proportion of total `##`-level sections. If mechanical sections are below 30% of total sections, the builder SHALL warn the operator: "This ruleset is below the mechanical-density threshold (X% mechanical). Discovery may not produce a playable server." The operator MAY proceed, select a different source, or abort. The builder SHALL record the pre-check count and operator decision in DECISIONS.md (4).

**REQ-164b — Viability pre-check (Part b).**
Guidance-only sections SHALL be excluded from the mechanical count but SHALL be included in the total-section denominator. *Acceptance criterion:* A ruleset with 15 mechanical sections out of 60 total sections (25%) triggers the warning. The builder records the count (15/60 = 25%) and the operator's decision in DECISIONS.md (4). A ruleset with 25/60 (42%) proceeds without warning. _Check:_ T199.
**REQ-067a — Help and tool discovery (Part a).**
The server provides a `help` tool, listed in the required utility tools alongside `ruleset (action: search)`, `respond`, `undo`, and `spec_health`. `help` accepts an optional `query` parameter. With no query, it returns: (1) a pointer to the `intro` prompt, (2) a categorized task map — tools grouped by task domain (characters, dice and resolution, combat, lookups, state, adventure) with one-line descriptions, and (3) a pointer to `badge_briefing` for badge-specific guidance. With a query, it searches tool descriptions, prompt summaries, and guidance text for the most relevant matches and returns their names, descriptions, and example invocations from the tool-use playbook.

**REQ-067b — Help and tool discovery (Part b).**
Output is badge-filtered. When a Novel is active, tool listings and query results SHALL be ruleset-filtered — showing only tools whose `ruleset` annotation matches the active Novel's ruleset scope or is `null`. The Game Master may customize the task-map category assignments via a Novel-scoped mapping. A tool reassigned to a user-defined category is removed from its builder-assigned category. The mapping persists with the Novel. Player badge results always reflect builder-assigned categories. The builder-assigned categories SHALL follow the default set by `TTRPG_WORLD_PROMINENCE` (REQ-309).

**REQ-067c — Help and tool discovery (Part c).**
An empty mapping restores builder defaults. *Acceptance criterion:* `help()` returns an intro pointer, task-map with one-line descriptions, and a `badge_briefing` pointer; `help("combat")` returns the most relevant combat tools with example invocations. _Check:_ T62, T118.
**REQ-063a — Connection introduction (Part a).**
The server provides an `intro` prompt, listed first in `prompts/list`. The prompt takes no arguments, is visible to all badges, and serves as a conversation starter — a brief overview of the ruleset, its core mechanic, and concrete next actions a player can take. The tone is engaging and energetic; the anti-slop catalogue (REQ-070, Appendix J) governs GM and Player narration in the story, not server onboarding prompts. The `help` tool and `badge_briefing` each point to it. For intent-to-tool mapping, callers are directed to `command (action: suggest)` (REQ-084) — no `use_tool` or `lookup_rule` prompt is provided.

**REQ-063b — Connection introduction (Part b).**
When the operator leaves `TTRPG_NOVEL` unset at startup and one or more Novels exist on disk, the `intro` prompt SHALL present the Novels as a browsable library. Each entry shows the Novel's name, description preview (first sentence or first `TTRPG_NOVEL_PREVIEW_CHARS` characters, default 120), session count, last-played date, and synthesis status (Tier 1 activated item count and Tier 2 item count). The prompt ends with: "You have N Novels.

**REQ-063c — Connection introduction (Part c).**
Which would you like to resume, or create a new one?" When no Novels exist, the prompt directs the user to `novel (action: create)` with a plain-English description of what a Novel is. *Acceptance criterion:* `intro` prompt is ≤300 words, opens with the publisher tagline (or a generic server-name identification when the server is ruleset-free), includes a dynamic sourcebook listing from the live index (or a message indicating the server is world-model-only when the server is ruleset-free), and ends with four concrete next actions. _Check:_ T49, T50, T259.
**REQ-078a — Session zero prompt (Part a).**
The server provides a `session_zero` prompt. The prompt takes no arguments, is visible to all badges (unfiltered), and serves as a structured guide surfaced at the start of a new story. The builder SHALL generate the prompt text at build time, drawing on the ruleset model for ruleset terminology, character-creation rules, example-of-play excerpts, and native personality constructs, and drawing on Synthesis `adventure_advice` content when available for genre conventions, narrative-voice profiles, and anti-slop examples.

**REQ-078b — Session zero prompt (Part b).**
The builder MAY generate narrative prose — tuning option descriptions, example character introductions, plaintext capability examples — using its own language capabilities when the ruleset model provides sufficient context. Missing ruleset content SHALL produce the corresponding section with a plain-English fallback description — this is not a defect. The prompt SHALL be verbose throughout — every section SHALL describe narrative possibilities in plain English without tool names or technical syntax, per Standing Rule 10.

**REQ-078c1 — Session zero prompt (Part c1).**
Sections 1–2 of the eight-section prompt cover two topics. Section (1) is a welcome that explains session zero's purpose as creative alignment and a safety check. Section (1) is also where the GM and player agree on the shape of the story before anyone rolls, and the preferences recorded here feed the GM's narration for the entire story. Section (2) explains each signal. For each of tone, difficulty, pace, focus, and boundary, the prompt gives a plain-English description of what the signal controls narratively, plus three to five named tuning options, each with a paragraph describing what that choice means for the story (scene style, narrative voice, consequences model, encounter design). The section ends with a plain-English example instruction the player could write.

**REQ-078c2 — Session zero prompt (Part c2).**
Sections 3–4 cover character content. Section (3) gives three example character descriptions at increasing detail. The first is a one-to-two-sentence archetype. The second is a three-paragraph description covering appearance, mannerisms, personality, voice, backstory, and motivation. The third is a media reference naming a known character as shorthand, then elaborating what to emphasise or change. Each example serves as a model for the player's description. Section (4) explains character creation. Section (4) describes every mechanical choice category the ruleset provides (species/ancestry, class/archetype, background, stat generation, equipment), stating what each option means for the character. Section (4) also notes that roster characters are already available for import.

**REQ-078c3 — Session zero prompt (Part c3).**
Sections 5–6 cover the loaded story and narrative capabilities. Section (5) confirms the adventure. The prompt presents the loaded adventure premise, the factions with their starting tensions, the pre-populated NPCs with personality summaries, and the opening scene, along with a plain-English confirmation that the GM can accept or describe what to change. When no adventure loaded, the section guides from-scratch definition instead. Section (6) describes narrative capabilities. The section explains, in plain English, what the GM can do during the story, organized by context (combat, exploration, dialogue, world-building). The section includes plaintext examples written as natural-language instructions the GM would give.

**REQ-078c4 — Session zero prompt (Part c4).**
Sections 7–8 close the prompt. Section (7) is a quick-start guide that summarises what is ready and describes how the first scene begins: the GM sets the opening scene, and the player describes what their character does. Section (8) offers post-session encouragement to refine characters between stories. The section covers personality, voice, dialogue examples referencing favorite media, and mechanical advancement when the ruleset provides it.

**REQ-078d — Session zero prompt (Part d).**
The prompt SHALL use the ruleset's own terminology for mechanical concepts. `session_zero` appears in `prompts/list` after `intro`. The `intro` prompt includes a concrete action to run `session_zero` before play. *Acceptance criterion:* `session_zero` prompt contains all eight sections in order; per-signal explanations include three to five named tuning options with narrative paragraphs; character introductions include three example descriptions at increasing detail; narrative capabilities section uses plain English and plaintext examples with no tool names. _Check:_ T22, T124.
**REQ-057a — Canonical lookup tools (Part a).**
The ruleset defines certain categories as canonical content: equipment, spells, monsters/stat-blocks, conditions, feats, class features, species, and backgrounds. For each such category, a `lookup_<category>` tool accepts the canonical name and documented aliases and returns the full ruleset entry. Unknown names return `[ERROR] [NOT_FOUND]` with valid values enumerated; the tool returns no fabricated entry.

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
which categories share a retrieval pattern from the ruleset extraction model. REQ-110 does not override ruleset-derived naming conventions (§7.4) — the shared
tool's name and parameters derive from the ruleset's own terminology.
*Acceptance criterion:* Two lookup tools differing only in category parameter are
consolidated into one parameterized tool whose parameter description documents
valid categories.
_Check:_ T113.

**REQ-059a — Parameter canon validation (Part a).**
(parameters whose legal values are a finite set derived from the ruleset's own catalogue — skill names, spell names, equipment names, condition names, and analogous ruleset-defined categories) SHALL validate against the ruleset index at call time. An unknown value returns `[ERROR] [NOT_FOUND]` with session-visible valid values enumerated (per REQ-002). A valid value returns `[OK]`. For dice-resolution tools, the `[OK]` response includes transparent dice results (per REQ-003).

**REQ-059b — Parameter canon validation (Part b).**
When a bounded-domain value set includes entries extracted at LOW confidence (per REQ-011), the catalogue remains available for validation. A caller who passes a LOW-confidence value receives `[OK]`. `spec_health` SHALL still report a `[LOW_CONFIDENCE_CATALOGUE]` finding naming the parameter and the affected entries.

**REQ-059c — Parameter canon validation (Part c).**
The builder SHALL record the finding in DECISIONS.md (5). *Acceptance criterion:* Passing an unknown skill name to a bounded-domain skill-check tool returns `[ERROR] [NOT_FOUND]` with valid skill names enumerated; passing a known skill name returns `[OK]` with results from the ruleset's resolution model. _Check:_ T39, T39a.
**REQ-182a — Bounded-domain parameter documentation (Part a).**
DECISIONS.md (5) lists every tool parameter whose legal values form a bounded domain. For each such parameter, the builder records the tool name, the parameter name, the ruleset source section that supplies the valid-value set, and the extraction confidence of that source (per REQ-011). A parameter whose valid-value set spans multiple ruleset sections SHALL list every contributing section.

**REQ-182b — Bounded-domain parameter documentation (Part b).**
This mapping enables independent verification of parameter canon validation (REQ-059). A verifier does not need to parse the builder's internal model. *Acceptance criterion:* DECISIONS.md (5) lists every bounded-domain tool parameter with its source section; a verifier can use this mapping to test REQ-059 compliance for every listed parameter. _Check:_ T39, T39a.
**REQ-183a — Live-index-derived error enumerations (Part a).**
`[NOT_FOUND]` and `[INVALID_INPUT]` error enumerations for bounded-domain parameters SHALL derive from the ruleset index at call time, not from hardcoded literals. Badge filtering applies to the enumeration (per REQ-002c). REQ-183 enforces the §6.5 builder rule, which permits hardcoded arrays only for ability abbreviations and persona roles.

**REQ-183b — Live-index-derived error enumerations (Part b).**
Tool implementations that enumerate valid values from a static list rather than the live index SHALL be flagged in DECISIONS.md (5) as a convergence violation. *Acceptance criterion:* Adding a new skill entry to the ruleset source, rebuilding, and calling a skill-check tool with the new skill name returns `[OK]`; removing a skill entry and rebuilding produces `[NOT_FOUND]` for the removed skill. Both enumerations reflect the live state — no hardcoded skill list produces stale values. _Check:_ T39b.
**REQ-323a — command resolve action (Part a).**
THE server SHALL register a `command (action: resolve)` tool that resolves a natural-language spatial intent against the world model without mutating state. Resolution proceeds in three phases: constraint check, override check, and scene composition. Return values are defined in Appendix O. The tool is callable by the AI narrator and Game Master/ Observer badges. Player badge calls SHALL return `[FORBIDDEN]`. When the world model is unpopulated, `command (action: resolve)` SHALL return `status: "no_world_model"`. *Acceptance criterion:* `command (action: resolve, "go north")` against a populated map with a north exit returns `resolved` with destination room context.

**REQ-323b — command resolve action (Part b).**
Against a wall returns `blocked` with the constraint named. Player badge returns `[FORBIDDEN]`. _Check:_ T367. *Out of scope:* real-time collaboration tools and tools that modify the ruleset source. Server-to-client notifications are governed by REQ-433.

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
Multi-step procedures (character creation, advancement) that raise `[NEED_INPUT]` are completed by `respond(decision, option)`. The `decision` value matches the question text from the preceding `[NEED_INPUT]` after canonicalization: leading/trailing whitespace stripped, internal whitespace collapsed to single spaces. The server SHALL accept a `decision` value that differs from the emitted text only in whitespace — an exact-match requirement is brittle under LLM-mediated tool calls. A `decision` that differs in non-whitespace characters returns `[ERROR] [NOT_FOUND]` with the canonical text.

**REQ-042b — Workflow decisions (Part b).**
Each decision enumerates options — limited to at most 25 entries, derived from the ruleset index, with empty-string and "cancel" always available. An unrecognized decision or option returns `[ERROR] [NOT_FOUND]` with valid values. `respond(cancel)` SHALL restore the pre-workflow snapshot (persisted per REQ-055). Restoration SHALL overwrite all Novel-tier fields with the snapshot values, clear the pending workflow state, and reset the staleness counter. The restored state SHALL be audited with a workflow-cancellation entry recording the decision text and the pre-workflow snapshot timestamp.

**REQ-042c — Workflow decisions (Part c).**
After restoration, all blocked tools (undo, redo, set_badge) are callable. Cancel restoration works after a server restart — the persisted snapshot covers the full pre-workflow Novel state. A workflow begins when a tool returns `[NEED_INPUT]` and ends when `respond` successfully drains the decision. Only one workflow may be pending per Novel at a time — a tool that raises `[NEED_INPUT]` while a workflow is already pending returns `[ERROR] [STATE_CONFLICT]` identifying the pending decision.

**REQ-042d — Workflow decisions (Part d).**
The server must be able to determine whether a workflow is pending, such that tools blocked during pending workflows (undo, redo, set_badge) can query the pending state without ambiguity. Pending workflow state survives server restarts — after restart the `[NEED_INPUT]` remains open and the server returns the same decision prompt on the next query. The Novel's pre- workflow snapshot is persisted alongside the pending decision so that `respond(cancel)` restores the correct pre-workflow state even after a restart.

**REQ-042e — Workflow decisions (Part e).**
Pending workflow state belongs to the Novel tier: it persists with the Novel to disk and survives process restarts alongside all other Novel property groups. After a restart, `respond(cancel)` must restore the correct pre-workflow snapshot, and `respond` with a valid option must drain the same decision that remained open before the restart.

**REQ-042f — Workflow decisions (Part f).**
Session-tier fields (connection-scoped transient state) are re-initialized from the Novel's persisted values on resume. The active entity is Novel-scoped (REQ-030) and persists with the Novel. *Acceptance criterion:* `respond("cancel")` restores pre-workflow state; a second `character (action: create)` during a pending step-by-step workflow returns `[STATE_CONFLICT]`; the pending decision survives server restart. _Check:_ T32, T138, T157; G2; S22.
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
`character (action: create)` call starts a fresh workflow.
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
identifying the workflow as already drained. The server SHALL
NOT apply the same decision twice or leave the Novel in an inconsistent state
where the workflow appears both drained and pending.
*Acceptance criterion:* Two concurrent `respond` calls to the same decision —
first succeeds, second returns `[STATE_CONFLICT]` with "no pending workflow".
_Check:_ S22.

**REQ-193a — Pending workflow staleness detection (Part a).**
THE server SHALL track a staleness counter for open pending workflows, incremented on each new connection to the Novel. When the counter reaches 3 or more connections without drainage, `spec_health` SHALL include a `pending_workflow_warning` object containing the decision text and connection count. The warning signals that a workflow has been abandoned across multiple sessions — an operator can drain or cancel it. Staleness tracking is informational only; it does not auto-cancel or auto-drain.

**REQ-193b — Pending workflow staleness detection (Part b).**
See also REQ-224. *Acceptance criterion:* Start a character creation workflow, restart the server (connection 1), connect twice more (connections 2, 3) — on the third connection, `spec_health` includes `pending_workflow_warning`. _Check:_ spec_health output assertion.
**REQ-104a — Character creation workflow (Part a).**
`character (action: create)` offers step-by-step (called without parameters) and quick-create (called with every creation parameter the ruleset's model marks required). Step-by-step produces sequential `[NEED_INPUT]` decisions covering every mandatory creation step the ruleset defines; quick-create creates the character in a single call. Both modes produce a complete entity with every ruleset-defined derived statistic and no ruleset-defined starting field zeroed out.

**REQ-104b — Character creation workflow (Part b).**
In step-by-step mode, when the ruleset defines ability scores as a mandatory step, the builder SHALL present each ability score for player assignment — the player chooses which rolled or array value maps to which ability. The builder SHALL NOT auto-assign ability scores without a `[NEED_INPUT]` decision presenting the assignment as a choice. In quick-create mode, the builder MAY auto-assign using a documented heuristic recorded in RULESET_MODEL.md. When the ruleset's stat generation uses a rolled method, `character (action: create)` SHALL accept an optional seed parameter per REQ-050.

**REQ-104c — Character creation workflow (Part c).**
The seed applies an isolated draw (REQ-050) — stat generation does not advance the session PRNG position. Creation without an active Novel returns `[STATE_CONFLICT]`. `cancel` restores the pre-workflow snapshot. *Acceptance criterion:* `character (action: create)` without parameters starts step-by-step mode; `character (action: create, name="X", species="Y", ...)` creates in one call; both modes require an active Novel or return `[STATE_CONFLICT]`. _Check:_ T32; T47; T103; G2.
**REQ-181a — Character creation output surface (Part a).**
`character (action: create)` SHALL return, in its final `[OK]` or `[NEED_INPUT]` completion response, the character's identity fields and every derived statistic the ruleset defines. The tool presents each statistic under the label the ruleset declares. *Acceptance criterion:* A `character (action: create)` quick-mode call returns the ruleset's derived statistics with their declared labels — not a bare confirmation; a step-by-step creation's final response includes all derived statistics computed so far. _Check:_ T47.

**REQ-181b — Character creation output surface (Part b).**
The output SHALL distinguish inputs (player-provided values) from derived statistics (computed from inputs and ruleset tables). *Acceptance criterion:* A `character (action: create)` quick-mode call returning `[OK]` includes the ruleset's derived statistics alongside the player's inputs — not just a confirmation message. A step-by-step creation's final `[NEED_INPUT]` response includes all derived statistics computed so far. _Check:_ T47.
**REQ-151a — Creation step enumeration (Part a).**
The builder SHALL enumerate every mandatory creation step the ruleset defines in RULESET_MODEL.md under `character_creation.steps`, in the order the ruleset prescribes. In step-by-step mode, each step that requires a player choice SHALL produce one `[NEED_INPUT]` decision — no step produces more than one decision, and no decision covers more than one step.

**REQ-151b — Creation step enumeration (Part b).**
Steps the server resolves without player input (derived statistics, HP calculation, proficiency assignment) SHALL NOT produce `[NEED_INPUT]` decisions. The server SHALL report these steps in the creation result alongside the player-chosen values. *Acceptance criterion:* RULESET_MODEL.md enumerates every mandatory step; `character (action: create)` without params produces exactly one `[NEED_INPUT]` per choice step, never bundling steps. _Check:_ T32.
**REQ-152a — Starting equipment assignment (Part a).**
When the ruleset defines starting equipment per class, background, or similar creation choice, the builder SHALL assign that equipment to the created entity. The entity's state representation SHALL include an `equipment` field listing each assigned item by name, quantity, and ruleset source. If the ruleset presents equipment choices (e.g., "choose weapon A or weapon B"), the builder SHALL present each choice as a `[NEED_INPUT]` decision in step-by-step mode. In quick mode, the builder SHALL select the first listed option and record the selection in the creation result.

**REQ-152b — Starting equipment assignment (Part b).**
When the ruleset defines no starting equipment, the `equipment` field SHALL be absent — the builder SHALL NOT fabricate equipment. *Acceptance criterion:* A character created under D&D 5e SRD carries class and background starting equipment by name. _Check:_ T32, G2. *Out of scope:* branching narrative trees, puzzle-solving workflows, and decision workflows that span multiple Novels or connections.
**REQ-399a — Character-creation package data (Part a).**
When the ruleset defines character creation, the builder SHALL extract the ruleset's character-creation rules into the ruleset model and the package. The rules cover playable character types, classes and advancement paths, ability-generation methods, derived-statistic definitions, and starting equipment. The model SHALL record the mandatory creation step enumeration under `character_creation.steps` in the order the ruleset prescribes (REQ-151a). Extraction SHALL be cross-consistent with the model's other categories per REQ-209. *Acceptance criterion:* A ruleset build that defines character creation yields a package whose model carries the ruleset's character-creation rules and whose step enumeration matches the step-by-step decisions the host produces. _Check:_ T468.

**REQ-399b — Character-creation computation (Part b).**
The host computes derived statistics from ruleset-declared formulas, evaluating them against the character's player-provided inputs and the ruleset's extracted tables; the host SHALL NOT hard-code a ruleset's formula. A formula that fails to evaluate SHALL surface a named creation error rather than a silent default. *Acceptance criterion:* A character created under a ruleset declaring a formula-based statistic returns that statistic computed from the declared formula; a formula referencing an undefined input produces a named error. _Check:_ T468.

**REQ-399c — Character creation without package data (Part c).**
A Novel bound to a ruleset whose package carries no character-creation rules SHALL follow the ruleset-free creation contract (REQ-219): `character (action: create)` produces a profile with no mechanical statistics. Requesting mechanical statistics in that state SHALL return a named error directing the caller to bind a ruleset whose package defines character creation. *Acceptance criterion:* `character (action: create)` on a Novel bound to a character-data-less package yields a profile-only entity; requesting classes yields a named error naming the missing data. _Check:_ T260, T468.

**REQ-140 — End-Novel confirmation dispatch.** WHEN the `respond` handler
receives a decision matching the `novel (action: end)` confirmation, THE system SHALL
execute the Novel disposal sequence per REQ-088 and record the disposal in the
audit log. IF the decision matches no open workflow, THEN `respond` SHALL
return `[NOT_FOUND]` with the open decision's text.
*Acceptance criterion:* `novel (action: end)` → `respond("End Novel <slug>?", "yes")`
removes the Novel from disk; a subsequent `novel (action: resume)` returns
`[STATE_CONFLICT]`.
_Check:_ T158.

**REQ-224a — Workflow staleness detection (Part a).**
THE server SHALL track a per-workflow staleness counter — an integer that increments each time a new MCP connection opens while the workflow remains pending. When the staleness counter reaches a configurable threshold, the pending workflow SHALL auto-cancel with the same behavior as `respond("cancel")`: the server restores the pre-workflow snapshot, records a `[workflow-stale]` audit entry with the decision text and connection count, and `undo` becomes callable. The audited entry SHALL be tagged `[workflow-stale]` to distinguish it from explicit cancellation.

**REQ-224b — Workflow staleness detection (Part b).**
The staleness counter SHALL be recorded in `spec_health` under `pending_workflow` alongside the decision text and elapsed connections. A workflow canceled by staleness follows the same state-restoration contract as explicit cancellation (REQ-042). The threshold is configurable via `TTRPG_WORKFLOW_STALENESS_CONNECTIONS`; setting it to zero SHALL disable staleness detection. See also REQ-193. *Acceptance criterion:* A pending workflow survives 4 connection restarts and remains open; on the 5th restart it auto-cancels with `[workflow-stale]` audit entry and restored pre-workflow state.

**REQ-224c — Workflow staleness detection (Part c).**
Setting `TTRPG_WORKFLOW_STALENESS_CONNECTIONS=0` prevents all auto-cancellation. _Check:_ T266.
**REQ-235a — Structured player choices (Part a).**
The Game Master may present structured choice prompts to the player. `scene (action: choices, prompt, choices[], allow_freeform?, context?)` returns a `[NEED_INPUT]` decision workflow (REQ-042). Each choice in the `choices` array SHALL have `id` (kebab-cased identifier), `label` (display text), and `description` (detail text). `allow_freeform` (configurable) permits the player to provide a free-text response instead of selecting a listed option. `context` is an optional metadata object (e.g., `{urgency: "medium"}`). The player responds via `respond(decision, option)`.

**REQ-235b — Structured player choices (Part b).**
The outcome SHALL be appended to the audit log with a `[choice]` tag. Freeform responses SHALL be stored in the audit entry's `content` field. *Coupling:* When the server records a `scene (action: choices)` result, any countdown (REQ-073) bearing the same `id` in its `scope` field SHALL advance by one tick. Choices whose resolved `id` matches a faction goal keyword (REQ-233) SHALL advance that faction's clock.

**REQ-235c — Structured player choices (Part c).**
The choice outcome SHALL also advance any `linked` countdown triggered by the matching clock. *Acceptance criterion:* `scene (action: choices, "The goon blocks your path.", [{id: "talk", label: "Talk", description: "Persuade him"}, {id: "fight", label: "Fight", description: "Start combat"}])` returns `[NEED_INPUT]` with two options; `respond("The goon blocks your path.", "fight")` records a `[choice]` audit entry; a countdown with `scope: "fight"` advances. _Check:_ T273.

### 5.5 Badges and Access

**REQ-030 — Single-user connection.** Each MCP connection serves one active badge at a
time — the badge most recently set via `set_badge` or `TTRPG_BADGE`. No concurrency,
no multiplayer state sharing within a connection. The active badge and active entity
are Novel-scoped: two connections to the same Novel share the same badge and entity
state (REQ-031, REQ-074). Each connection may independently switch between Novels
via `novel (action: switch)` (REQ-095), and each Novel stores its own badge independently.
*Acceptance criterion:* Starting a second MCP connection to the same Novel succeeds
and inherits the Novel's current badge and active entity; switching badges on one
connection is visible on the other.
_Check:_ Appendix D.

**REQ-031a — Badge activation (Part a).**
On Novel creation or resume, the Editor badge is active by default — the server operates with full access. All tools, resources, and prompts are accessible without restriction. Badge gating (REQ-032) takes effect based on the active badge. Wearing the Player or Game Master badge means you are in the story. Editor and Observer badges are out of the story. Switching to the Editor badge with `set_badge("none")` restores full access; the Novel persists. Under the Editor badge, all badge-filtered surfaces (`badge_briefing`, `prompts/list`, `resources/list`, `tools/list`, guidance) return full unfiltered content.

**REQ-031b — Badge activation (Part b).**
The badge activation state persists with the Novel (REQ-055). `novel (action: end)` deletes the Novel regardless of badge state. *Acceptance criterion:* On Novel creation or resume with the Editor badge active, `tools/list` returns all tools unfiltered; after `set_badge("player")`, GM-only tools are excluded from `tools/list` and return `[FORBIDDEN]` on invocation; after `set_badge("none")`, full access is restored and the Novel persists. _Check:_ T9, T150.
**REQ-066a — set_badge tool (Part a).**
`player`, `game_master`, `observer`, or `none`. Returns `[OK] Active badge: <badge>` on success — `"none"` returns `[OK] Active badge: Editor — full access`, `"observer"` returns `[OK] Active badge: observer — read-only spectator mode`. Returns `[STATE_CONFLICT]` if a pending workflow exists. The tool is NEVER badge-gated — it is always callable regardless of current badge.

**REQ-066b — set_badge tool (Part b).**
The badge switch takes effect immediately on the next tool call. `set_badge("none")` switches to the Editor badge with full access; the Novel persists untouched. *Acceptance criterion:* `set_badge("player")` returns `[OK] Active badge: player` and the next tool call is gated; `set_badge("observer")` returns `[OK] Active badge: observer — read-only spectator mode`; `set_badge("none")` returns `[OK] Active badge: Editor — full access` and full access is restored; `set_badge(...)` during a pending workflow returns `[STATE_CONFLICT]`. _Check:_ T9.
**REQ-032a — Server-side gating (Part a).**
The server enforces access based on the active badge. Player tools, resources, and prompts are a strict subset of GM-visible ones. Observer tools are a read-only subset: state-query tools (`character (action: sheet)`, `session (action: recap)`, `help`, `scene://current`, `entities://`, etc.) are permitted; mutating tools (commands, generation, hybrid per REQ-015) return `[FORBIDDEN]` with the corrective action "Observer mode is read-only. Switch badges with `set_badge` to interact." `tools/list` and related metadata surfaces are filtered. Guidance items are filtered. `spec_health` metrics are filtered. `[FORBIDDEN]` responses direct callers to use `set_badge` to switch badges.

**REQ-032b — Server-side gating (Part b).**
Under the Editor badge, no gating applies — all endpoints return full content and all tools are callable. *Acceptance criterion:* Under the Player badge, `npc (action: create, ...)` returns `[FORBIDDEN]`; switching to Game Master badge makes the same call succeed; switching back and calling again returns `[FORBIDDEN]`. Under the Observer badge, `scene (action: set, ...)` returns `[FORBIDDEN]` directing to `set_badge`; `help()` succeeds. _Check:_ T9, T13, T15, T18, T26, T44, T148, T151.
**REQ-216a — Generation table badge filtering (Part a).**
`ruleset (action: roll)` SHALL be callable from both badges, but tables with `badge_scope: "game_master"` SHALL return `[FORBIDDEN]` when called from the Player badge — the error SHALL enumerate the full table name but SHALL NOT reveal table content. The `badge_scope` value SHALL be visible in `spec_health` per-table metadata but the table content SHALL NOT. The `badge_briefing` SHALL enumerate available table names with their badge_scope, filtered per the active badge's access level.

**REQ-216b — Generation table badge filtering (Part b).**
The error message SHALL direct the caller to `badge_briefing` for a non-revealing list of accessible tables. *Acceptance criterion:* `ruleset (action: roll, "madness_short_term")` called from the Player badge returns `[FORBIDDEN]` with the table name visible but no content; the same call from the Game Master badge returns the table result. `badge_briefing` under the Player badge lists only `badge_scope: "shared"` table names. _Check:_ T257.
**REQ-133a — Forbidden-call audit (Part a).**
The server records `[FORBIDDEN]` in the audit log with timestamp, active badge, tool name, and arguments — matching the fields recorded for mutating calls (REQ-040). Forbidden-call entries carry a `violation_type: "boundary"` field on the audit entry that does not appear on mutating-call entries.

**REQ-133b — Forbidden-call audit (Part b).**
When surfaced through `session (action: compress)` or `audit://novel`, the server prepends the entry's output prefix with `[BOUNDARY_VIOLATION]` to distinguish it from mutating entries at a glance. *Acceptance criterion:* Invoking a GM-only tool under the Player badge produces an audit entry with badge `player`, tool name, arguments, and a boundary-violation marker; the entry is visible at `audit://novel` and is distinguishable from mutating entries. _Check:_ T147.
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
When a caller invokes `character (action: set_active, entity_id)`, the active entity carries narrative POV (point of view) semantics: the player is inhabiting this character — speaking as them, perceiving through their senses. The server SHALL include a POV directive in `badge_briefing`, positioned in the decision-critical group after scene state and before the entity listing.

**REQ-220b — Narrative point of view (Part b).**
The directive contains three parts. Part (a) names the active entity. Part (b) instructs the AI to describe the scene through this character's eyes and senses. Other characters' internal states (thoughts, feelings, unexpressed intentions) stay inaccessible unless the POV character could observe or infer them. Part (c) lists the active entity's personality fields and voice examples (REQ-077) in compact inline form as a voice and manner reference.

**REQ-220c — Narrative point of view (Part c).**
When no active entity exists, `active_entity_id` is null per REQ-176. In that state, the directive shows the empty-state marker "POV: none — narration is omniscient." The directive is NEVER truncated by the briefing size budget (REQ-135, tier 1). POV follows the active entity across `character (action: set_active)` calls. The server provides no separate tool for this. *Acceptance criterion:* After `character (action: set_active, "character_01")`, `badge_briefing` includes a POV directive naming character_01 with the narrative instruction and personality fields.

**REQ-220d — Narrative point of view (Part d).**
Switching to character_02 updates the directive; removing all entities shows the omniscient empty-state marker. _Check:_ T262.
**REQ-223a — POV mode control (Part a).**
THE `character (action: set_active)` tool SHALL accept an optional `pov` parameter — `character` (default) or `omniscient`. When the caller sets `pov=character` with an active entity, the POV directive follows REQ-220 and the narration locks to that character's perspective. When the caller sets `pov=omniscient`, the POV directive SHALL render as the omniscient empty-state marker defined in REQ-220, regardless of whether an active entity exists. In that mode, narration stays unrestricted and all characters' states remain accessible.

**REQ-223b — POV mode control (Part b).**
The server stores the `pov` parameter as Novel-scoped state, and it persists across `character (action: set_active)` calls. Switching entities with `pov=character` keeps the new entity under character-locked POV. Switching entities with `pov=omniscient` keeps narration omniscient. When the caller invokes `character (action: set_active)` without the `pov` parameter, the existing POV mode stays in place.

**REQ-223c — POV mode control (Part c).**
The initial default is `character` — the first `character (action: set_active)` call in a Novel locks POV to that entity unless the caller sets `pov=omniscient` explicitly. *Acceptance criterion:* After `character (action: set_active, "char_01", pov="omniscient")`, `badge_briefing` shows "POV: none — narration is omniscient" with char_01 still the active entity; `character (action: set_active, "char_02")` preserves omniscient mode; `character (action: set_active, "char_02", pov="character")` switches to character-locked POV for char_02. _Check:_ T265.
**REQ-304a — Counterpart AI role (Part a).**
The AI's narrative role is the counterpart of the active badge by default. When the human wears `player`, the AI briefs as Game Master. When the human wears `game_master`, the AI briefs as Player. Under the Editor badge, the AI has no narrative role (Editor-badge briefing per REQ-136). The server accepts a `TTRPG_AI_ROLE` environment variable with values `counterpart` (default), `game_master`, or `player`. When set to a fixed value, the AI's narrative role is locked — `game_master` forces GM-oriented briefing regardless of the human's badge, `player` forces player-oriented briefing.

**REQ-304b — Counterpart AI role (Part b).**
The AI role determines the orientation sections in `badge_briefing` (foundations, anti-slop, tone samples, behavioral boundary directive per REQ-109) while the active badge determines the state surface and tool filtering. `TTRPG_AI_ROLE` is read at startup and applies to all connections and Novels. The active badge controls tool-access gating; the AI role controls narrative orientation.

**REQ-304c — Counterpart AI role (Part c).**
The default `counterpart` preserves current behavior when the human wears the Player badge (AI briefs as GM) and enables human-GM + AI-Player configuration when the human wears the Game Master badge. *Acceptance criterion:* With `TTRPG_AI_ROLE=counterpart` and human wearing the Player badge, `badge_briefing` orientation content is GM-oriented. Same badge but `TTRPG_AI_ROLE=player` forces player-oriented orientation. Human wearing the GM badge with `counterpart` shows player-oriented orientation. Editor-badge with any `TTRPG_AI_ROLE` shows Editor-badge briefing per REQ-136. _Check:_ T348.
**REQ-305a — Observer mode (Part a).**
`set_badge("observer")` activates spectator mode — the human observes while the AI plays both Player and Game Master roles. Tool gating (REQ-032) restricts the human to read-only access: state-query tools succeed; all mutating tools return `[FORBIDDEN]` directing the caller to switch badges. `badge_briefing` orientation content instructs the AI: "You are both Game Master and Player. The human is observing. Narrate scenes, make decisions for all player characters, advance combat, play the Novel." The state surface is unfiltered (GM-level visibility). The human may step out by calling `set_badge` with any other value.

**REQ-305b — Observer mode (Part b).**
Observer mode is Novel-scoped — it persists with the Novel and is visible in `spec_health`. *Acceptance criterion:* `set_badge("observer")` returns `[OK] Active badge: observer — read-only spectator mode`. `npc (action: create, "Test")` returns `[FORBIDDEN]` with corrective action citing `set_badge`. `help()` succeeds. `badge_briefing` includes the dual-role orientation instruction. _Check:_ T349.
**REQ-306a — Adjustable autonomy (Part a).**
The server provides a `scene (action: autonomy)` tool — Game Master only, Novel-scoped.

**REQ-306b — Adjustable autonomy (Part b).**
The tool accepts an object with four independent sliders, each defaulting per the §7.6 configuration surface. The `level` slider (`full`, `mechanical_prompt`, or `manual`) decides what the AI plays, from auto-playing everything to requiring human decisions on all ruleset mechanical actions. The `confirmation` slider (`auto`, `confirm`, or `prompt`) controls how the server presents decisions, from auto-execution to prompting with options. The `safety` slider (`safe`, `moderate`, or `hardcore`) sets consequence severity, from no permanent death to full consequences. The `creativity` slider (`predictable`, `standard`, or `chaotic`) sets how much the AI surprises the player, from optimal decisions to dramatic twists.

**REQ-306c — Adjustable autonomy (Part c).**
The `mechanical_prompt` boundary applies only to tools that invoke ruleset-derived resolution mechanics — tools classified as command or hybrid per REQ-015 whose behavior derives from the ruleset, not from the world model or narrative infrastructure. Inform parser commands and narrative state tools are never paused. At `mechanical_prompt` level, when the AI reaches a mechanical decision point, it SHALL call `scene (action: choices)` (REQ-235) with `[NEED_INPUT]` to present the decision; the human responds via `respond`. All four slider values SHALL be visible in `badge_briefing` and `spec_health`.

**REQ-306d — Adjustable autonomy (Part d).**
Autonomy composes with any badge — a human Player with `level=full` lets the AI auto-play their character; a human GM with `level=full` lets the AI run all NPCs and player characters. Player signal preferences (REQ-069) — pace, difficulty, tone, focus, and boundary — SHALL be respected at all autonomy levels. Autonomy controls who makes decisions; player signals define constraints on all decisions regardless of which agent makes them. A `level=full` AI SHALL still observe a `boundary=veil` signal by skipping detailed violence descriptions, and SHALL still respect `difficulty=easy` by calibrating encounter threat.

**REQ-306e — Adjustable autonomy (Part e).**
The `register` signal (REQ-064) SHALL also be respected at all autonomy levels — the AI SHALL NOT switch between character and meta register without an explicit `character (action: signal)` call. *Acceptance criterion:* `scene (action: autonomy, {level: "full", confirmation: "auto", safety: "safe", creativity: "standard"})` returns `[OK]`. `badge_briefing` includes the autonomy state. With `level=mechanical_prompt` and `confirmation=prompt`, the AI auto-narrates exploration but pauses via `scene (action: choices)` for combat actions; the human responds via `respond`. _Check:_ T350.
**REQ-306f — Safety escalation advisory (Part f).**
WHEN a `scene (action: autonomy)` call raises the `safety` slider from `safe` to a higher tier, THE system SHALL surface an escalation advisory stating the consequence change before it takes effect — `moderate` allows death with warnings, `hardcore` makes death permanent without warnings. The advisory SHALL require explicit confirmation; a declined escalation SHALL leave the current tier in place. The advisory SHALL render once per Novel per target tier. *Acceptance criterion:* Raising `safety` to `moderate` surfaces the advisory and requires confirmation before the tier applies; declining leaves `safe` active. _Check:_ T483.
**REQ-306g — Creativity tier mapping (Part g).**
The three `creativity` tiers SHALL correspond to distinct, monotonically ordered output-variation levels — `predictable` producing the least deviation from expected outcomes and `chaotic` the most. The build SHALL record the concrete configuration for each tier in DECISIONS.md (4); the `standard` tier SHALL NOT equal an unmodified platform sampling default unless the build records that default as the standard configuration. `spec_health` SHALL report the recorded tier mapping. *Acceptance criterion:* DECISIONS.md (4) records distinct per-tier configurations; `spec_health` reports the mapping. _Check:_ T484.
**REQ-109a — Badge briefing composition (Part a).**
`badge_briefing` surfaces these groups, split into two sourcing layers: **Orientation layer** (sourced from the AI's narrative role per REQ-304): badge foundations (REQ-062), anti-slop guidance (REQ-070), narrative tone samples (REQ-071), and badge behavioral boundary directive (REQ-064). When the AI's role is Game Master, these groups contain GM-oriented content; when the AI's role is Player, player-oriented content. Under observer mode (REQ-305), the orientation layer SHALL include a dual-role instruction: "You are both Game Master and Player. The human is observing.

**REQ-109b — Badge briefing composition (Part b).**
Narrate scenes, make decisions for all player characters, advance combat.

**REQ-109c1 — Badge briefing composition (Part c1).**
Play the Novel." **State surface layer** (sourced from the active badge per REQ-032): current scene state (REQ-076), narrative POV directive (REQ-220), active entities with summary stats and presence markers (REQ-074, REQ-307), active NPCs (REQ-075), active countdowns — badge-filtered by `badge_scope` (REQ-073), active lore entries (REQ-083), active adventure content (REQ-079), registered tools relevant to the current scene type (REQ-087), active combat state — round, turn order, and current participant (if in-combat; REQ-043).

**REQ-109c2 — Badge briefing composition (Part c2).**
Also reported: active entity personality fields and voice examples — badge-filtered per REQ-077 (REQ-077), the narrative directive (GM only, REQ-081), player signals (GM only, REQ-069), Novel setup metadata (REQ-089, including a "Session zero not yet completed" reminder when `session_zero_completed` is false), a pointer to the intro prompt (REQ-063).

**REQ-109c3 — Badge briefing composition (Part c3).**
Further reported: story journal entries — entries whose entity IDs overlap the active entities or whose scene anchor matches the current scene (GM only, REQ-246), the current autonomy state — all four slider values from `scene (action: autonomy)` (REQ-306) when set, campaign memory facts (GM only, REQ-310), world in motion entries (GM only, REQ-233a), and proactive available actions (REQ-084a).

**REQ-109d — Badge briefing composition (Part d).**
Groups whose data source is empty SHALL include an explicit empty-state marker describing which category is empty. Markers preserve the expected briefing structure and prevent the caller from inferring non-existent content. The enumeration order above is the builder's required default section ordering for `badge_briefing`.

**REQ-109e — Badge briefing composition (Part e).**
Decision-critical groups precede the section boundary. The decision-critical groups include scene state, the POV directive, entities, combat state, and triggered lore. The group also includes active NPCs, active countdowns, narrative threads, campaign memory (REQ-310), world in motion (REQ-233a), and available actions (REQ-084a). Supplementary guidance and navigation groups follow. The supplementary groups include badge foundations, anti-slop guidance, narrative tone samples, active adventure content, registered tools, and entity personality fields. The supplementary groups also include the narrative directive, player signals, Novel setup metadata, autonomy state, and the intro pointer.

**REQ-109f — Badge briefing composition (Part f).**
The Game Master may override this order via `session (action: briefing_order)` (REQ-082). *Acceptance criterion:* `badge_briefing` for a Novel with entities, combat, countdowns, and lore includes all mandatory groups; an empty data source displays its empty-state marker; decision-critical groups appear before supplementary groups. _Check:_ T109, T110, T149.

#### Briefing Section Tokens

**REQ-281a — Narrative-threads section token (Part a).**
The `narrative_threads` section token sits in the decision-critical group, and it contains five items. Item (a) lists unresolved story journal decisions — `decision` type entries whose referenced entity or scene has no corresponding `consequence` entry (REQ-246) — surfaced as "Unresolved: <entry summary>". Item (b) lists active promises derived from story journal `bond` entries with no `consequence`. Item (c) lists active countdowns with their narrative meaning, as name plus remaining ticks in prose form. Item (d) lists active NPC dispositions where the disposition differs from the NPC's creation default, surfaced as "<NPC name> (<disposition>, set in session <N>)". Item (e) lists active vow progress when populated (REQ-289).

**REQ-281b — Narrative-threads section token (Part b).**
The section is badge-filtered: GM sees all; Player sees only own-entity bonds and `shared`-scope content. The `narrative_threads` token SHALL appear in the decision-critical group, after entities and before combat state. The token gives the AI GM a "what's currently unresolved" signal for narrative consistency.

**REQ-281c — Narrative-threads section token (Part c).**
When all source data is empty, the token SHALL render its empty-state marker: "[No unresolved threads.]" *Acceptance criterion:* After recording a story journal `decision` with no `consequence`, setting a countdown, and creating an NPC with a non-default disposition, `badge_briefing` under the GM badge includes a `narrative_threads` section with the unresolved decision, the countdown in narrative form, and the NPC disposition. Under the Player badge, only own-entity bonds and shared content appear. _Check:_ T330.
**REQ-286a — Knowledge-state section token (Part a).**
`badge_briefing` SHALL include a `knowledge_state` section token in the decision-critical group showing what the active entity currently knows. The token contains: (a) revealed secrets (key and reveal timestamp); (b) known NPC relationships where the active entity is a participant; (c) `shared`-scope lore entries whose trigger keywords have appeared in scenes the active entity attended. Knowledge SHALL be scoped by entity presence per REQ-308, so an entity learns percepts only from scenes it attended (listed in `characters_present` per REQ-076). Percepts gained from scenes the entity attended persist regardless of current presence.

**REQ-286b — Knowledge-state section token (Part b).**
When the active entity does not appear in the current scene, the section renders the marker "[Entity not present in this scene]". The marker sits above the entity's retained knowledge. With no active entity, the section renders "[No active entity — knowledge state unavailable.]". With no known information for the active entity, the section renders "[No known information.]". The section SHALL NOT include GM-only secrets, unrevealed lore, or relationships where the active entity does not participate.

**REQ-286c — Knowledge-state section token (Part c).**
On a fresh Novel, `badge_briefing` renders the empty-state marker — narrative tools fade into the background per §5.10. *Acceptance criterion:* After `lore (action: reveal, "floor_trap", "rogue_01")`, setting the rogue as active entity, `badge_briefing` under the GM badge includes a `knowledge_state` section token listing the revealed secret. After setting an entity not present in the current scene as active, the section renders "[Entity not present in this scene]" above retained knowledge. _Check:_ T336.
**REQ-159a — Synthesis briefing integration (Part a).**
(§11.1), `badge_briefing` SHALL include synthesis-derived content as follows. First, supplementary guidance items SHALL appear in the guidance section, tagged `[supplementary]` with source URL and confidence, badge-filtered by badge_scope (REQ-080). Second, entity voice examples sourced from synthesis SHALL appear alongside roster-sourced voice examples under the entity personality group, tagged `[supplementary]` (REQ-077). Third, adventure advice SHALL appear when the active Novel contains a generated adventure (REQ-132), tagged `[supplementary]`.

**REQ-159b — Synthesis briefing integration (Part b).**
Synthesis-sourced content follows the same badge filtering rules as the synthesis resource surfaces — the server hides game_master-scoped items from the Player badge. When synthesis is inactive, the briefing renders without synthesis content — no empty-section markers for synthesis groups. *Acceptance criterion:* After synthesis, `badge_briefing` under the GM badge includes supplementary guidance items tagged `[supplementary]` alongside source URLs. Synthesis-sourced voice examples appear under entity personality with `[supplementary]` tag. Under the Player badge, game_master-scoped synthesis items are absent.

**REQ-159c — Synthesis briefing integration (Part c).**
After `synthesis (action: revert)`, synthesis content is absent from all badge views. _Check:_ T194. *Out of scope:* authentication or authorization mechanisms, multi-connection badge synchronization, and badge inheritance across Novels. The spec assumes a single trusted operator — `set_badge` is always callable without authentication. The badge model supports configurable AI narrative role (REQ-304), observer mode (REQ-305), and adjustable autonomy (REQ-306) while maintaining two-badge tool-access gating.

**REQ-159d — Synthesis briefing integration (Part d).**
The badge model is a convenience and narrative-integrity feature, not a security boundary (see Appendix P for threat model).
**REQ-135a — Badge briefing size budget (Part a).**
The total size of `badge_briefing` output is bounded by a configurable limit. When the briefing would exceed this limit, content is truncated from lowest-priority sections first. Sections are truncated in full — no section is partially rendered. Each truncated section includes a marker and a resource URI pointer for full retrieval. Badge foundations (REQ-062) and the intro pointer (REQ-063) are never truncated. The builder records the truncation priority order and the default limit in DECISIONS.md.

**REQ-135b — Badge briefing size budget (Part b).**
The truncation priority order SHALL respect three tiers. Tier 1 is never-truncated: badge foundations (REQ-062), badge boundary directive (REQ-064), the intro pointer (REQ-063), and the POV directive (REQ-220). Tier 2 is last-truncated: the decision-critical groups per REQ-109. Tier 3 is first-truncated: the supplementary guidance and navigation groups per REQ-109.

**REQ-135c — Badge briefing size budget (Part c).**
Within each tier, the builder determines the relative truncation order and records it in DECISIONS.md. *Acceptance criterion:* With a small briefing budget, invoke `badge_briefing` — assert some low-priority sections are truncated with resource URI pointers; assert badge foundations and the intro pointer are always present regardless of budget. _Check:_ T149.
**REQ-180a — Truncation budget unit (Part a).**
All truncation thresholds in this specification use bytes of UTF-8 encoded Markdown output. When a builder's implementation environment measures in tokens, the builder SHALL use a character-to-token heuristic of 4 characters per token (the `CHARS_PER_TOKEN` convention) to convert between units and SHALL record the chosen heuristic in DECISIONS.md.

**REQ-180b — Truncation budget unit (Part b).**
The byte-level threshold is the authoritative limit — the token estimate is a proximity guard that SHALL NOT be used to truncate earlier than the byte threshold would require. *Acceptance criterion:* A 32,000-byte threshold produces truncation at the same byte offset regardless of whether the builder internally measures in tokens or bytes; the heuristic is recorded in DECISIONS.md. _Check:_ T222.
**REQ-136a — Editor-badge briefing (Part a).**
`badge_briefing` returns setup-oriented content: a list of available Novels (REQ-093), the current active Novel name if one exists, and a pointer to the `intro` prompt (REQ-063).

**REQ-136b — Editor-badge briefing (Part b).**
No gated content is accessible — the briefing presents the same full-access view as all other Editor-badge surfaces but structured for initial orientation rather than ongoing play. *Acceptance criterion:* On startup with no Novel active, `badge_briefing` returns a setup-oriented message with the intro pointer and Novel-creation guidance; with a Novel active under the Editor badge, the briefing includes the active Novel name, setup progress when incomplete, and guidance to continue Novel setup or start the story when ready. _Check:_ T150.
**REQ-137a — Gate classification auditability (Part a).**
Every tool registered on the server is assigned to one of three gate classifications: callable only under the Player badge, callable only under the Game Master badge, or callable under any badge (un-gated). The gate classification for every tool is enumerable at build verification time from the tool registration source without invoking the running server. The builder records the classification for every tool in DECISIONS.md.

**REQ-137b — Gate classification auditability (Part b).**
Tool-category reassignment (REQ-067) does not alter gate classification. *Acceptance criterion:* The Player-filtered `tools/list` output contains exactly the tools classified as Player or un-gated in DECISIONS.md; the GM-filtered output contains exactly the tools classified as GM or un-gated; `set_badge` is always present in both lists. No tool is classified as both Player-only and GM-only. _Check:_ T151.

### Gate classification table

The classification table in DECISIONS.md SHALL enumerate every registered tool
with the format:

| Tool name          | Gate       | Badge visibility         |
|--------------------|------------|------------------------|
| `set_badge`          | un-gated   | Player, Game Master    |
| `combat (action: init)`      | GM-only    | Game Master            |
| `character (action: sheet)`  | Player     | Player                 |

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
_Check:_ G0a; T183.

**REQ-149 — MCP conformance gate.** _(F3)_ The running server SHALL pass every
check in Appendix D before the build proceeds past intake. A failed check stops
the line. The G0b evidence record in DECISIONS.md (6) SHALL enumerate
each Appendix D check and its pass/fail status. The server SHALL be verified
against the active fixture as specified in §8 G0b.
*Acceptance criterion:* A server that returns a JSON-RPC error for a canonical
lookup of a known-absent entity fails G0b and the build does not proceed;
a server that passes all Appendix D checks produces an evidence record
enumerating each check.
_Check:_ G0b; T184.

**REQ-150a — Golden transcript coverage completeness (Part a).**
After the golden transcript passes G2, the builder SHALL verify that every behavioral contract the selected fixture exercises (REQ-001, REQ-032, REQ-041, REQ-042, REQ-043, REQ-050, REQ-072, REQ-073) is exercised by at least one transcript interaction. Any unexercised contract SHALL be recorded as a coverage gap in the G2 evidence record with the unexercised REQ cited. Coverage gaps do not block the line; they are findings recorded in DECISIONS.md (6) for operator disposition. *Acceptance criterion:* Replay the Appendix B golden transcript — assert every contract is exercised by at least one interaction.

**REQ-150b — Golden transcript coverage completeness (Part b).**
Mask an interaction from the transcript, then assert the build records the unexercised REQ as a coverage gap without blocking the build. _Check:_ G2; T185.
**REQ-211a — Evidence record field contract (Part a).**
DECISIONS.md (6) SHALL include, at minimum, a workflow identifier (G0a, G0b, G2, G3, G4, G5, G6, G7, G8, or H1–H18) and a timestamp. The record SHALL also include environment pins (runtime version, OS, and spec hash at time of execution), pass/fail status, and a findings section. The findings section enumerates each sub-check with its individual result.

**REQ-211b — Evidence record field contract (Part b).**
Per-workflow extension fields differ by workflow. G0 records enumerate Appendix H and Appendix D checklist items with individual pass/fail. G2 records include the per-contract coverage enumeration defined in §8. G3 records include the registry/resource diff summary. G4 records include per-test pass/fail counts. G5 (Pattern Buffer) records include per-sub-workflow verdict and blocking/non-blocking classification.

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
Every tool call that mutates Novel state (character creation, condition changes, HP changes, combat state, table rolls with results) is recorded in an append-only audit log (`audit://novel`), including timestamp, badge, tool name, arguments, and output prefix. State queries are not logged. Each audit entry chains the hash of the preceding entry, producing a tamper-evident sequence. On load, the server verifies the chain end-to-end and reports a mismatch in `spec_health` and stderr. The log survives connection restarts for the same Novel.

**REQ-040b — Audit log (Part b).**
WHEN the server detects a new `TTRPG_SESSION_ID` value, it SHALL insert a `[session-boundary]` marker entry (REQ-237) before the session's first mutating entry. The marker counts as a mutating entry for hash-chain purposes and appears in `audit://novel` output. A hash chain that breaks at any point SHALL report a mismatch in `spec_health` and stderr; the server loads entries up to the break point. `novel (action: end)` removes the audit log along with the rest of the Novel.

**REQ-040c — Audit log (Part c).**
Badge switches via `set_badge` (all values: `player`, `game_master`, `none`) SHALL produce audit entries recording the old badge, new badge, and timestamp. Badge-switch entries carry the badge-switch designation as their tool-name field.

**REQ-040d — Audit log (Part d).**
The server records badge-switch entries in the append-only audit log and includes them in `audit://novel` output, but it does not treat them as mutating state operations for undo/redo purposes — `undo` SHALL NOT reverse a badge switch. *Acceptance criterion:* A combat attack produces an audit entry with timestamp, badge, tool name, arguments, and output prefix; `audit://novel` returns entries in append order with chained hashes. _Check:_ T8, T147.
**REQ-168a — Audit resource (Part a).**
The server provides an `audit://novel` resource, retrievable via `resources/read` and listed in `resources/list`. The resource returns the Novel's full audit log as Markdown — one entry per line, ordered append-first, each line containing the timestamp, badge, tool name, and output prefix. The resource is badge-filtered: the Player badge sees entries where the recorded badge is `player` or where the entity affected is owned by the current player; the Game Master sees all entries. Forbidden-call entries (REQ-133) carry a `[BOUNDARY_VIOLATION]` prefix in the output column to distinguish them from mutating entries. State queries are not recorded and do not appear.

**REQ-168b — Audit resource (Part b).**
When no Novel is active, `resources/read` returns `[ERROR] [STATE_CONFLICT]`. *Acceptance criterion:* `resources/read` on `audit://novel` returns audit entries in append order with chained hashes; Player badge sees only own-entity and own-badge entries; forbidden-call entries are distinguished; state queries are absent. _Check:_ T203.
**REQ-041a — Snapshots and undo (Part a).**
`undo` restores the most recent mutation from a LIFO snapshot stack. Stacks are keyed by the badge under which `undo` is invoked, but every snapshot captures the full Novel state — `undo` in the Player badge reverses the most recent mutation regardless of which badge initiated it. The stack depth supports at least 10 undo levels per badge. Builders that cannot meet this floor must record the constraint and its justification in DECISIONS.md (5).

**REQ-041b — Snapshots and undo (Part b).**
An empty stack returns `[ERROR] [STATE_CONFLICT]`. `undo` operates as a pure-state tool: the server does not snapshot it, and the step it reverses leaves the snapshot stack. A pending `[NEED_INPUT]` blocks undo. Cancelling a workflow restores the pre-workflow snapshot and discards the workflow's internal undo candidates. When the undo stack exceeds the configured or default depth ceiling, the server discards the oldest snapshot and SHALL record a `[snapshot-truncated]` audit entry identifying the badge and the discarded snapshot's timestamp.

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
If the ruleset defines a conflict procedure (combat, confrontation), the server models it as Novel-scoped state: participants, round counter, and turn order. The `combat (action: init)` tool starts a conflict; the `combat (action: advance)` tool resolves one participant's turn and advances the turn order, incrementing the round when wrapping around; and the `combat (action: end)` tool terminates it. Participants may be entities, named NPCs (REQ-075), or dangers. Turn resolution reports the participant name, the action taken (if any), the roll result with full transparency, and any resulting state changes (HP, conditions).

**REQ-043b — Conflict lifecycle (Part b).**
When the ruleset delegates mechanical resolution to separate tools (attack, damage, condition), `combat (action: advance)` derives its turn report from the audit log. The tool summarizes the most recent mutating entries for the current participant since the preceding `combat (action: advance)` call, then reports the participant name, actions taken, roll results with full transparency, and resulting state changes. When no mutating entries exist for the participant (a skipped or delayed turn), `combat (action: advance)` reports that the participant took no action.

**REQ-043c — Conflict lifecycle (Part c).**
The builder selects the reporting strategy at build time and records the choice in RULESET_MODEL.md. Participants with no turn-defining mechanical stats — dangers and NPCs created without stat fields — advance automatically on their turn. The `combat (action: advance)` tool reports the participant name with an `[auto]` marker, describes the participant's narrative action using the participant's description field (if any), applies no mechanical changes, and advances to the next turn. No separate tool call is required from the caller.

**REQ-043d — Conflict lifecycle (Part d).**
Initiative ties resolve by participant type (entity before NPC before danger), then alphabetically by name. The Novel's total combat rounds counter increments by one each time the combat round wraps (last participant's turn completes and the turn order returns to the first participant). The counter is cumulative across all combats in the Novel's lifetime. `combat (action: end)` does not additionally adjust the counter — it records the outcome and tears down the combat state. The counter is included in novel metadata (REQ-093) and reported in `session (action: recap)` (REQ-072) and `spec_health` (REQ-025).

**REQ-043e — Conflict lifecycle (Part e).**
Snapshot/load operations work within one connection. Active combat state is visible in `badge_briefing` as a dedicated group containing the round number, the turn order list with the current turn clearly marked, and the current participant name. The Game Master sees the full turn order and all participant names; the Player badge sees entity turn positions only (NPC and danger positions are redacted).

**REQ-043f — Conflict lifecycle (Part f).**
When no combat is active, the group is omitted entirely from the briefing — no empty-state marker. *Acceptance criterion:* `combat (action: init, participants=["hero"], dangers=[{"name": "goblin"}])` assigns turn order entity first, then dangers; `combat (action: advance)` reports the participant, action, roll, and state changes; `combat (action: advance)` on a danger's turn reports `[auto]` with a narrative action; after weapon-damage mutation, `combat (action: advance)` reports the participant name, weapon, damage roll transparency, and target HP change; after a turn with no mutations it reports the participant took no action. _Check:_ T25, T33, T110, T161, T162; G2.

**REQ-043g — Conflict lifecycle (Part g).**
Combat state is Novel-scoped — it persists when the story ends via `set_badge("none")` or resumes via `set_badge("player")` or `set_badge("game_master")`. `novel (action: end)` discards the combat state along with all other Novel state. When a story resumes mid-combat, the combat continues from its current round and turn position — the turn order, participant states, and round counter are unchanged. When a story resumes and no combat was active, play begins from the current scene state.
**REQ-203 — Combat-init guard.** When the server detects a `combat (action: init)` call while combat is already active, it SHALL return `[ERROR] [STATE_CONFLICT]` with the text "Combat already active — call `combat (action: end)` first." The server modifies no combat state, and the existing combat continues unchanged.
*Acceptance criterion:* `combat (action: init)` followed by a second `combat (action: init)` call returns
`[STATE_CONFLICT]` and the active combat's round and turn order are unchanged by the
rejected call.
_Check:_ T246.

**REQ-204a — Combat participant validation (Part a).**
`combat (action: init)` SHALL validate every participant ID against the Novel's known entities and named NPCs. Participants that resolve are added to the turn order normally. Participants that do not resolve to any known entity or NPC SHALL produce `[ERROR] [NOT_FOUND]` enumerating the unresolvable IDs and the complete list of valid entity and NPC identifiers. Validation occurs before any initiative rolls or turn-order construction — a rejected `combat (action: init)` call leaves no combat state active.

**REQ-204b — Combat participant validation (Part b).**
The server exempts danger entries (which have no persistent IDs) from this validation. *Acceptance criterion:* `combat (action: init, participants=["nonexistent"])` with no entities imported returns `[NOT_FOUND]` enumerating "nonexistent" and listing valid entity/NPC IDs; no combat state is created; `session (action: recap)` reports no pending confrontation. _Check:_ T247.
**REQ-205a — Mid-combat participant changes (Part a).**
The Game Master may add or remove participants during active combat via `combat (action: add_participant)` and `combat (action: remove_participant)` tools. Both are Game Master only. Participants added during combat are inserted into the turn order immediately after the current turn position, preserving the existing turn order for all other participants. Added participants that do not resolve to a known entity or NPC SHALL produce `[ERROR] [NOT_FOUND]` with valid identifiers enumerated. The current turn pointer does not advance — the added participant acts in the same round, after the current participant's turn.

**REQ-205b — Mid-combat participant changes (Part b).**
Removing the current participant SHALL advance the turn pointer to the next participant before removal.

**REQ-205c — Mid-combat participant changes (Part c).**
Removing the last participant SHALL auto-trigger `combat (action: end)` with the outcome "All participants removed." These tools are mutating operations for undo/redo purposes. The two tools SHALL appear in the audit log. *Acceptance criterion:* During active combat with participants ["hero", "goblin"], `combat (action: add_participant, "wizard")` inserts wizard after hero in turn order; `combat (action: remove_participant, "goblin")` removes goblin from turn order and advances pointer if goblin was current; removing the last participant from a 1-participant combat ends it with "All participants removed"; undo reverts the participant change; Player badge returns `[FORBIDDEN]`. _Check:_ T248.
**REQ-206a — Combat-round condition expiry (Part a).**
When the ruleset defines conditions that last for a fixed number of rounds or turns, the server SHALL track the remaining duration on the entity. Conditions with a round-based duration SHALL decrement their remaining counter when the affected entity's turn resolves via `combat (action: advance)`. Conditions reaching zero remaining rounds SHALL be automatically removed, recorded in the audit log as a `[condition-expired]` entry with the entity ID, condition name, and the triggering combat round. The expiry occurs after the turn's actions and before the turn pointer advances — an entity's last-round effect is active for its final turn.

**REQ-206b — Combat-round condition expiry (Part b).**
The server exempts conditions without a declared duration from automatic expiry. The builder records the ruleset's condition-duration convention in RULESET_MODEL.md under `condition_durations`. *Acceptance criterion:* Apply a condition with `rounds: 1` to a participant, call `combat (action: advance)` once — assert the condition is removed after the turn and the audit log contains a `[condition-expired]` entry. Apply a condition with `rounds: 0` (instant) — assert it does not decrement. Apply a condition with no `rounds` field — assert no auto-expiry occurs.

**REQ-206c — Combat-round condition expiry (Part c).**
Apply a condition with `rounds: 2` — assert it decrements to 1 after the first `combat (action: advance)` and expires after the second. _Check:_ T249.
**REQ-221a — Combat-navigation interaction (Part a).**
WHEN combat is active THE world-model parser commands that change the player's location (go, enter, exit, or equivalent navigation verbs) SHALL return `[ERROR] [STATE_CONFLICT]` with the message "Combat is active — cannot navigate. Call `combat (action: end)` first or flee per the ruleset's retreat mechanic." Inspection commands (examine, look) and non-spatial commands (take, drop on current room) SHALL continue to function — they do not move the player. The combat turn order and round counter SHALL NOT be affected by parser commands — navigation blocking prevents spatial changes but does not consume combat turns.

**REQ-221b — Combat-navigation interaction (Part b).**
The spatial-immutability contract applies regardless of whether the TTRPG ruleset defines movement restrictions during combat. The world-model layer enforces spatial immutability during combat as a narrative-integrity guard. The ruleset supersedes this guard only when it defines a specific retreat or tactical-movement mechanic. Such a mechanic explicitly permits location changes during combat. *Acceptance criterion:* During active combat with a populated world model, `command("go north")` returns `[STATE_CONFLICT]`; `command("look")` and `command("examine sword")` return `[OK]`; after `combat (action: end)`, navigation resumes. _Check:_ T263.
**REQ-217a — Condition tools (Part a).**
The server applies and removes conditions via `condition (action: apply, entity_id, condition, rounds?)` and `condition (action: remove, entity_id, condition)`. The server SHALL validate `condition` against the ruleset's indexed condition list. Unknown conditions SHALL return `[INVALID_INPUT]` with valid conditions enumerated (REQ-059).

**REQ-217b — Condition tools (Part b).**
Applying the same condition to an entity that already has it SHALL return `[WARNING]` with the text "Condition already active." The server adds no duplicate and changes no other state. The `condition (action: remove)` tool, when the entity does not have the condition, SHALL return `[WARNING]` with the text "Condition not present." Both tools are badge-gated per REQ-032. The Player may apply or remove conditions on their own active entity only. The Game Master may apply or remove conditions on any entity or NPC. Player attempts on other entities SHALL return `[FORBIDDEN]` with the target entity ID.

**REQ-217c — Condition tools (Part c).**
The optional `rounds` parameter on `condition (action: apply)` sets the combat-round duration for REQ-206 auto-expiry — omitting it creates a condition without automatic expiry. Both tools SHALL record mutation entries in the audit log (REQ-040) and appear in `session (action: recap)` condition changes (REQ-072). Applied conditions SHALL appear on `character (action: sheet)` output and in `badge_briefing` entity summaries. Under the Player badge, condition entries in `character (action: sheet)` and `badge_briefing` SHALL be rendered without expiry round counts — the Player sees only the condition name.

**REQ-217d — Condition tools (Part d).**
The Game Master badge SHALL include expiry round counts when the caller supplies the `rounds` parameter. *Acceptance criterion:* `condition (action: apply, entity, "prone")` adds the condition and returns `[OK]`; a second call returns `[WARNING]` with "Condition already active."; `condition (action: remove, entity, "prone")` removes it; `condition (action: remove)` on an entity without the condition returns `[WARNING]` with "Condition not present."; applying "not_a_condition" returns `[INVALID_INPUT]` with valid conditions listed; Player `condition (action: apply)` on another player's entity returns `[FORBIDDEN]`; applied condition appears on `character (action: sheet)` and `badge_briefing` entity summary. _Check:_ T258.
**REQ-072a1 — Session recap (Part a1).**
`session (action: recap)` returns a structured summary of the active Novel. The summary covers the session timespan (earliest to latest audit entry), active entities with final state (HP, conditions, status), completed confrontations, pending confrontations, current scene state, active lore entries and their trigger status, the current narrative directive, and current scene type. Status is a computed mechanical flag: "alive" when HP > 0, "unconscious" at HP = 0, "dead" when the ruleset's death condition applies; rulesets without a death condition SHALL report "alive" and "incapacitated".

**REQ-072a2 — Session recap (Part a2).**
`session (action: recap)` also reports the last N scene state transitions (configurable), roster changes (entities created or removed in this Novel during the audit-log timespan), condition changes, and the last N significant rolls (configurable). The output is badge-filtered: the Player badge sees only own-entity data; the Game Master badge sees all. The output does not produce narrative prose — it returns structured data the LLM uses to narrate the recap.

**REQ-072b — Session recap (Part b).**
The output SHALL be a machine-parseable structure.

**REQ-072c1 — Session recap (Part c1).**
At minimum, the output SHALL contain these named fields with typed values. The `timespan_start` and `timespan_end` fields hold ISO 8601 timestamps, or null if the audit log is empty. The `entities` field holds an array of objects with `name`, `hp`, `max_hp`, `conditions`, and `status` string fields. The `confrontations_completed` field holds an array of objects with `participants`, `rounds`, and `outcome` derived from audit-log combat lifecycles per REQ-175. The `confrontation_pending` field holds null or an object describing the active combat. The `scene` field holds the current description. The `scene_type` field holds the scene type. The `lore_entries` field holds an array of objects with `key` and `active`. The `narrative_directive` field holds free text or null.

**REQ-072c2 — Session recap (Part c2).**
The output also holds these fields. The `scene_transitions` field holds an array of `{from, to, timestamp}` objects for the most recent N transitions. The `roster_changes` field holds an array of `{entity_id, action` — "created" or "removed", `timestamp}`. The `condition_changes` field holds an array of `{entity_id, condition, action` — "applied" or "removed", `timestamp}`. The `significant_rolls` field holds the rolls per REQ-174. The `total_combat_rounds` field holds the total. The `story_entries` field holds an array of objects with `type`, `entry`, `timestamp`, `scene_anchor`, and `entity_ids` for the most recent N entries, default 10.

**REQ-072d — Session recap (Part d).**
Missing or inapplicable fields SHALL be present with a typed null or empty array, not omitted.

**REQ-072e — Session recap (Part e).**
The LLM reconstructs a narrative recap from these fields; the tool SHALL NOT generate recap prose. `session (action: recap)` accepts optional parameters. The `session_id` parameter scopes the recap to the audit log range bounded by the matching `[session-boundary]` marker and the next marker, or the log end for the current session; when omitted, the recap spans the full log range. The `max_transitions` parameter (configurable, bounded 1–20) sets the number of scene state transitions to return. The `max_rolls` parameter (configurable, bounded 1–50) sets the number of significant rolls to return.

**REQ-072f — Session recap (Part f).**
Values outside the declared range SHALL produce `[ERROR] [INVALID_INPUT]` with the valid range enumerated. When `session_id` does not match any `[session-boundary]` marker, return `[ERROR] [NOT_FOUND]` with valid session IDs enumerated. *Acceptance criterion:* `session (action: recap)` returns a structure with all named fields present, each field carrying its declared type or null/empty-array when inapplicable; the output contains no narrative prose strings outside field values; entity status reports "alive" when HP > 0, "unconscious" at HP = 0, "dead" when death condition active. _Check:_ T53, T212, T213, T214, T215.
**REQ-072g — Session recap format (Part g).**
`session (action: recap)` SHALL accept an optional `format` parameter: `"markdown"` (default, current behavior) or `"lonelog"`. Lonelog notation uses `###` scene headers, `@` entity actions, `=>` narrative outcomes, `?` GM-decision equivalents, and `d:` resolved mechanics. `session (action: compress)` SHALL accept the same `format` parameter to produce compressed entries in the requested notation. Each audit entry (REQ-040) SHALL gain an optional `notation` field storing the Lonelog representation alongside the raw audit data. *Acceptance criterion:* `session (action: recap, format="lonelog")` produces output in Lonelog notation; `session (action: compress, format="lonelog")` produces compressed Lonelog entries; audit entries contain the `notation` field. _Check:_ T272.

**REQ-072h — Session recap (Part h).**
`session (action: recap)` SHALL accept an optional `gm_notes` free-text field, populated by the caller and returned only to the Game Master badge. The field SHALL be structurally excluded from Player-badge output and SHALL never be merged with player-visible fields. `narrative_orientation` SHALL derive from `shared`-scope and revealed content only; when all source data is GM-only, the Player-badge field SHALL render the empty-state marker.
*Acceptance criterion:* a recap carrying `gm_notes` returns them under the GM badge and no `gm_notes` under the Player badge; orientation sourced only from GM-only lore returns the empty-state marker to the Player badge. _Check:_ T518.

**REQ-279a — Narrative orientation (Part a).**
`session (action: recap)` SHALL include a `narrative_orientation` field — a prose paragraph (2–4 sentences) derived from the active Novel state. The paragraph SHALL synthesize five inputs. The first input is the last 3 story journal entries of type `decision` or `bond` (REQ-246). The second input is the active NPC dispositions that differ from their creation default. The third input is the current narrative directive (REQ-081). The fourth input is the active countdown names with their remaining ticks in narrative form ("The ritual completes in 2 rounds"). The fifth input is the active vow names and milestone counts when vow tracking holds data (REQ-289).

**REQ-279b — Narrative orientation (Part b).**
The paragraph SHALL use plain English without tool names, status prefixes, or structured field syntax — it reads as a "Previously on…" summary a returning player can understand immediately. The field SHALL be present when any of its source data is non-empty. When all source data is empty (new Novel with no play), the field SHALL contain the empty-state marker "[No narrative history yet — your story begins here.]" `session (action: recap)` SHALL include `narrative_orientation` as its first field, before the structured data blocks.

**REQ-279c — Narrative orientation (Part c).**
The paragraph is badge-filtered: Player badge sees orientation derived from `shared`-scope lore, own-entity story entries, and player-visible NPC dispositions per REQ-032. *Acceptance criterion:* After a session with a story journal decision, a narrative directive, and an active countdown, `session (action: recap)` returns a `narrative_orientation` field containing a 2–4 sentence prose summary synthesizing all three sources. `session (action: recap)` on a new Novel with no play returns the empty-state marker. _Check:_ T328.
**REQ-174a — Significant-roll criterion for recap (Part a).**
A significant roll for `session (action: recap)` meets three conditions. Condition (a): a dice-resolution tool produced the roll (roll_save, roll_skill_check, roll_weapon_attack, roll_weapon_damage, a ruleset-equivalent, or a base-capability dice-resolution action per REQ-434, REQ-439, or REQ-441). Condition (b): the roll has an entity as participant or attacker, or it carries a mechanical consequence. The mechanical consequence may be a difficulty, a position and effect, or a momentum burn. Condition (c): the roll produced a tool output visible to at least one badge. The server excludes pure-generation table rolls (REQ-086), GM-only state queries, and rolls without an entity participant.

**REQ-174b — Significant-roll criterion for recap (Part b).**
The server SHALL track the last N significant rolls per Novel, discarding the oldest when the count reaches N+1. `session (action: recap)` SHALL list significant rolls in chronological order. Each listed roll carries the tool name, entity identifier, die faces, and at most the major outcome (hit/miss/fail/success/damage amount without full transparency replay — the recap is a summary, not a transcript). _Check:_ T213.
**REQ-175a — Confrontation summary derivation (Part a).**
`session (action: recap)` SHALL derive confrontation summaries from the Novel's audit log. Each completed confrontation spans a `combat (action: init)` audit entry and its matching `combat (action: end)` entry. The summary reports the participants (entities and named NPC identifiers from the combat (action: init) entry), the round count (audit-log-derived count of `combat (action: advance)` entries divided by participant count, rounded up), and the outcome (combat (action: end)'s outcome field). The pending confrontation, if any, is the active combat state: participants, current round, and turn position.

**REQ-175b — Confrontation summary derivation (Part b).**
When no combat is active, `confrontations_completed` SHALL be an empty array and `confrontation_pending` SHALL be null. Consecutive combats in a single audit-log timespan SHALL produce separate completed entries in chronological order. _Check:_ T214.
**REQ-073c1 — Countdowns (Part c1).**
`countdown (action: set, name, ticks, type, options)`. A `round` countdown decrements automatically at the end of each combat round. A `narrative` countdown decrements only when the Game Master calls `countdown (action: advance, name)` (for in-world events: time until sunrise, enemy army arrival, ritual completion, torch burnout, poison timers). Either type may carry an `on_scene_transition` flag (decrements on scene transition per REQ-125). Every countdown has a `badge_scope` — `game_master` or `shared` — and a `direction` — `decrement` (fires at `ticks <= 0`) or `increment` (fires at `ticks >= total`).

**REQ-073c2 — Countdowns (Part c2).**
Both carry an unambiguous default preserving backward compatibility. `countdown (action: advance, name)` adjusts one tick in the countdown's direction. `countdown (action: remove, name)` deletes a countdown before it fires. When a countdown fires, it is recorded in the audit log with a timestamp and removed from active countdowns — its name slot freed for reuse. Expired countdowns remain in the audit log. `countdown://active` lists all active countdowns with remaining ticks, type, badge_scope, and direction, badge-filtered: only shared countdowns are visible to the Player badge.

**REQ-073c3 — Countdowns (Part c3).**
Countdowns are Novel-scoped — survive connection restarts, discarded by `novel (action: end)`. Countdown tools are Game Master only; the Player badge reads active countdowns via `badge_briefing` and resource URIs. *Acceptance criterion:* A shared countdown "torch" (3 ticks) appears in both badges' briefings; a GM-only countdown "patrol" appears only in the GM briefing; `countdown (action: advance, "patrol")` at tick 1 fires and removes it. _Check:_ T54, T139.
**REQ-329a — Countdown-world coupling (Part a).**
Countdowns SHALL accept an optional `trigger` array with world-model event types. The server supports three trigger types. `on_room_enter(<room_id>)` fires after the active entity enters the named room via parser navigation. `on_thing_take(<thing_id>)` fires after the named thing is taken. `on_door_open(<exit_ref>)` fires after the named exit's door is opened. World-model events that match a trigger SHALL advance the countdown by one tick. Multiple triggers per countdown SHALL be permitted — if any trigger matches, the countdown advances. Trigger resolution is mechanical — the countdown fires regardless of narrative framing.

**REQ-329b — Countdown-world coupling (Part b).**
A countdown with no `trigger` array SHALL use existing advancement behavior (manual `countdown (action: advance)` or round/narrative type advancement). Triggers SHALL NOT replace existing advancement — a round countdown with a trigger advances on both round completion AND trigger match. *Acceptance criterion:* `countdown (action: set, "ambush", 3, type="narrative", triggers=["on_room_enter(guard_room)"])` — parser navigation into the guard room advances the countdown by one tick. A countdown without triggers behaves as before. A round countdown with a trigger advances on both round end and trigger match. _Check:_ T373, T376.
**REQ-289a — Vow tracking (Part a).**
The Game Master may track narrative vows — intangible promises, quests, or obligations that bind entities or the party. `vow (action: set, name, description, parties, difficulty, scope)` creates a vow. The `name` field is a unique identifier. The `description` field holds the vow's substance (a sentence). The `parties` field holds an array of entity, NPC, or faction IDs bound by the vow. The `difficulty` field is one of `troublesome`, `dangerous`, `formidable`, `extreme`, or `epic`, and it determines the rank track. The `scope` field is one of `gm`, `shared`, `faction`, or `party`, and it sets badge visibility per REQ-032.

**REQ-289b — Vow tracking (Part b).**
A vow's rank track has 10 milestones per difficulty rank (troublesome = 10, dangerous = 20, formidable = 30, extreme = 40, epic = 50). `vow (action: milestone, vow_name)` advances the milestone counter by one.

**REQ-289c — Vow tracking (Part c).**
When milestones reach the rank track total, the vow is complete and `vow (action: resolve)` becomes available. The `vow (action: resolve, vow_name, outcome, consequences)` call closes the vow: the vow moves from active to resolved state, the server stores the outcome (free-text summary), and the server records `consequences` (free-text narrative effects) as a `consequence` story journal entry per REQ-246. The `vow (action: forsake, vow_name, reason)` call abandons a vow — the vow moves to `forsaken` state and drops out of active displays; the server records the reason alongside the vow.

**REQ-289d — Vow tracking (Part d).**
Active vows appear in `badge_briefing` (`narrative_threads` section per REQ-281) and `session (action: recap)` (`narrative_orientation` per REQ-279). Resolved and forsaken vows appear in `session (action: recap)` with their state and outcome/reason — a forsaken vow is surfaced with the `[vow-forsaken]` marker. Vow state persists with the Novel and is included in `novel (action: save_context)` captures (REQ-232).

**REQ-289e — Vow tracking (Part e).**
Vow tools are Game Master only; the Player badge reads vow state via `badge_briefing` and `session (action: recap)` when the vow's scope is `shared` or `party`. *Acceptance criterion:* `vow (action: set, "Find the Crown", "Recover the lost Crown of Alara", parties=["pc_1", "pc_2"], difficulty="dangerous", scope="shared")` creates a vow with a 20-milestone track. `vow (action: milestone, "Find the Crown")` advances the counter. `vow (action: resolve, "Find the Crown", "The Crown is found in the Dragon's hoard", "The kingdom is restored")` moves the vow to resolved. `vow (action: forsake, "other_vow", "Too dangerous")` marks it forsaken. _Check:_ T335.
**REQ-322a — Vow-countdown coupling (Part a).**
WHEN `vow (action: set)` creates a vow (REQ-289), THE engine SHALL offer a countdown creation suggestion in the `narrative_threads` section of `badge_briefing`: the suggestion carries the vow name, a proposed countdown name (`vow:<vow_name>`), and the vow's milestone total as the tick count. The GM may accept via `respond` to auto-create a countdown with `clock_type: mission` linked to the vow. WHEN `vow (action: milestone)` advances a vow, if a linked countdown exists with name `vow:<vow_name>`, THE engine SHALL advance that countdown by one tick. WHEN a linked countdown fills, the countdown fires its completion AND the vow becomes eligible for `vow (action: resolve)`.

**REQ-322b — Vow-countdown coupling (Part b).**
WHEN `vow (action: resolve)` or `vow (action: forsake)` closes a vow, any linked countdown with name `vow:<vow_name>` is removed. The coupling is optional — the GM may decline the suggestion and manage vows via milestones alone (current behavior). Vow-countdown links SHALL survive Novel persistence and SHALL be included in `novel (action: save_context)` captures (REQ-232).

**REQ-322c — Vow-countdown coupling (Part c).**
For shared-scope vows, the countdown suggestion and linked countdown state SHALL be visible in Player and Observer `badge_briefing` `narrative_threads`; GM-scope vow countdowns remain GM-only. *Acceptance criterion:* `vow (action: set, "Find Crown", ..., difficulty="dangerous")` produces a countdown suggestion in `badge_briefing`. Accepting creates a 20-tick `clock_type: mission` countdown named `vow:Find Crown`. `vow (action: milestone, "Find Crown")` advances both the milestone counter and the countdown.

**REQ-322d — Vow-countdown coupling (Part d).**
Filling the countdown makes the vow eligible for `vow (action: resolve)`. `vow (action: resolve, "Find Crown", ...)` removes the countdown. _Check:_ T369.

#### Entities, NPCs, and Adventure Content

**REQ-074a — Multi-entity support (Part a).**
A Novel may contain multiple entities under the same badge. The roster may hold multiple entities for the player. `entities://` lists all Novel entities visible to the active badge. One entity is the active entity — the default target for tools that accept an `entity_id` when no `entity_id` is supplied. The first imported entity is the active entity by default. `character (action: set_active, entity_id)` switches the active entity and is always callable regardless of badge.

**REQ-074b — Multi-entity support (Part b).**
The `party` resource (`party://current`) lists all player-owned entities with summary stats: name, active status, HP, conditions, and `present` flag (derived from the most recent `scene (action: set)` `characters_present` parameter per REQ-307). REQ-030 scoping is unchanged — one user per connection, no multiplayer. The active entity also establishes the narrative POV per REQ-220. *Acceptance criterion:* Creating and importing two entities produces two entries in `entities://`; `character (action: set_active, entity_02)` switches the default target for entity_id-optional tools. _Check:_ T55.

**REQ-074c — Multi-entity support (Part c).**
Calling `character (action: import, roster_id)` for a roster entity whose Novel already contains a copy (matched by roster source ID, not Novel entity ID) SHALL return `[STATE_CONFLICT]` identifying the existing Novel entity by name and ID. The hint reads: "Entity already imported as `<name>` (`<entity_id>`)." This prevents silent entity duplication within a Novel. The constraint is per-Novel — the server permits importing the same roster character into two different Novels. _Check:_ T220.
**REQ-176a — Entity removal (Part a).**
(Game Master only) that removes an entity from the active Novel. Removing the active entity SHALL clear the active entity field; the next imported or explicitly activated entity becomes active. Removing the last entity SHALL leave `active_entity_id` null and clear `characters_present`. `party://current` SHALL exclude removed entities. The roster baseline is unaffected — `character (action: import)` using the same roster ID after removal creates a fresh copy. Entity removal is a mutating operation for undo/redo purposes.

**REQ-176b — Entity removal (Part b).**
Player badge attempts return `[FORBIDDEN]`. *Acceptance criterion:* `character (action: remove, "character_02")` removes the entity from `entities://`; `party://current` no longer lists it; the roster baseline is unchanged; re-importing the same roster ID creates a fresh entity copy. _Check:_ T216.
**REQ-177 — Roster entity removal.** The server SHALL provide a
`character (action: roster_remove, roster_id)` tool (callable with the Editor badge or Game Master badge)
that removes a character from the roster. Removing a roster character does not affect any
Novel that has already imported it — existing Novel entity copies survive independently.
Player badge attempts return `[FORBIDDEN]`. When the roster ID does not exist, SHALL return
`[NOT_FOUND]` with valid roster IDs enumerated.
*Acceptance criterion:* `character (action: roster_remove, "character_01")` removes the entry from
`roster://`; a Novel that previously imported it retains its copy; re-creating a character
with the same name creates a new roster entry with a different ID.
_Check:_ T217.

**REQ-178a — Roster listing (Part a).**
The server SHALL provide a `character (action: roster_list)` tool, callable under any badge with no restrictions. The tool returns a structured listing: for each roster entry, the roster ID, name, race, class, and level. When no characters exist in the roster, the tool SHALL return an empty-state marker. The `novel_setup` prompt (REQ-089) SHALL source its roster character list from this tool's output rather than constructing the list independently.

**REQ-178b — Roster listing (Part b).**
The `roster://` resource (REQ-022) SHALL be populated from the same data source — `roster://<type>` groups entries by type (e.g., class, race), and `roster://<id>` returns the full entity data for a single roster entry including personality fields and voice examples. *Acceptance criterion:* `character (action: roster_list)` returns all roster entries with ID, name, race, class, level; `roster://character_01` returns full data; an empty roster returns the empty-state marker. _Check:_ T219.
**REQ-075a — Named-NPC state (Part a).**
`npc (action: create, name)`. NPCs are Novel-scoped with URIs (`npc://<id>`). Only `name` is a required field; optional fields include `description`, `disposition`, `location`, and any ruleset-derived stat fields as partial entries (all optional). NPCs may participate in confrontations alongside entities and dangers (REQ-043). `npc (action: update, id, fields)` mutates NPC fields; providing a field not previously set on the NPC SHALL extend the NPC's field surface — the field is added with the supplied value.

**REQ-075b — Named-NPC state (Part b).**
Null or empty-string values SHALL clear the field without removing it from the NPC's known field set. `npc (action: remove, id)` deletes an NPC. `npcs://` lists all active NPCs. NPC state persists with the Novel. All NPC tools are Game Master only; the Player badge reads NPC state via `badge_briefing` and resource URIs.

**REQ-075c — Named-NPC state (Part c).**
Every NPC SHALL carry depth metadata: `appearance_count` (incremented each time the NPC appears in a scene or `badge_briefing` references it), `first_seen` (ISO 8601 timestamp of first appearance), and `last_seen` (ISO 8601 timestamp of most recent appearance). `badge_briefing` SHALL include a depth signal for each NPC. NPCs with `appearance_count < 3` display with name and description only. NPCs with `appearance_count >= 3` display with a `[recurring]` marker and the count ("3 appearances across 2 sessions"). NPCs with `appearance_count >= 10` display with a `[campaign]` marker. `session (action: recap)` SHALL include an NPC relationship heatmap: for each NPC with `appearance_count > 1`, the number of sessions they appeared in and the number of distinct scenes.

**REQ-075d — Named-NPC state (Part d).**
An NPC not seen in 5 or more sessions SHALL carry a `[distant]` marker in `badge_briefing`. The depth metadata is automatically maintained by the server — the GM does not set it directly. *Acceptance criterion:* `npc (action: create, "Innkeeper")` produces an NPC with `npc://<id>` URI; `npc (action: update, id, {disposition: "friendly"})` changes the field; `npc (action: remove, id)` deletes it. An NPC appearing in 3 scenes across 2 sessions displays `[recurring]` in `badge_briefing` with the appearance count.

**REQ-075e — Named-NPC state (Part e).**
An NPC not seen in 5 sessions carries `[distant]`. `session (action: recap)` includes an NPC relationship heatmap with session and scene counts. _Check:_ T56.
**REQ-075f — Named-NPC state (Part f).**
Every NPC MAY carry a GM-only `mind` object holding `private_journal` (a free-text array auto-appended on significant interactions per REQ-311), `directive` (a narrator-facing instruction — goals, mannerisms, decision tendencies), and `auto_play` (a boolean flag). Mind content SHALL be excluded from every Player-badge surface, including `badge_briefing`, `npc://<id>`, and `session (action: recap)`. Mind content persists with the Novel and SHALL be included in `novel (action: export)` full scope, clone, checkpoints, and archive (REQ-240, REQ-241, REQ-334). Setting or clearing mind fields is Game Master only.
*Acceptance criterion:* an NPC with a populated mind renders no mind content under the Player badge; GM surfaces include it; export/import round-trip preserves it. _Check:_ T513.
**REQ-119a — NPC stat block reference (Part a).**
`npc (action: create)` accepts an optional ruleset reference — the name of a monster, NPC template, or stat block entry from the indexed ruleset. When a reference matches a ruleset entry, the builder populates the NPC's stat fields from that entry's baseline values as defined by the ruleset. Any caller-supplied stat fields override the referenced values.

**REQ-119b — NPC stat block reference (Part b).**
A reference that does not match any ruleset entry returns `[ERROR] [NOT_FOUND]` with valid reference names enumerated. *Acceptance criterion:* `npc (action: create, "Goblin", ruleset_reference="Goblin")` populates stat fields from the ruleset entry; an unknown reference returns `[NOT_FOUND]` with valid names. _Check:_ T126. Reference-populated fields are additive to the builder-determined NPC stat surface (REQ-123).

**REQ-119c — NPC stat block reference (Part c).**
A reference entry may carry fields beyond the builder's discovered conventions — those fields SHALL be included on the NPC and count as part of the NPC's stat block for rendering (REQ-120) and resource URI output (REQ-121). Caller-supplied fields that match reference field names override the referenced values; caller-supplied fields that do not match any reference field name SHALL extend the NPC's stat surface.

**REQ-119d — NPC stat block reference (Part d).**
A reference field may collide in name with a builder-determined stat field that uses a different ruleset-native name. The server SHALL surface the colliding field under the reference field's name, and the builder records the name mapping in RULESET_MODEL.md.
**REQ-120 — NPC rendering.** The server renders NPC stat blocks through the
same mechanism it uses for entity character sheets. An NPC identifier produces a
stat block containing all populated stat fields, current conditions, and narrative
fields (description, disposition, location, and any personality fields per REQ-122)
in the ruleset's baseline stat-block format. An identifier that resolves to neither
an entity nor an NPC returns `[ERROR] [NOT_FOUND]`. The Game Master badge sees all
fields; the Player badge sees only fields visible in `badge_briefing`.
*Acceptance criterion:* `character (action: sheet, entity_id="npc_01")` renders the NPC
stat block in ruleset format; an unknown ID returns `[NOT_FOUND]`.
_Check:_ T127.

**REQ-121 — NPC resource URIs.** The server registers `npc://<id>` for each
active NPC in the current Novel, returning the NPC's full stat block and narrative
fields, and `npcs://` returning a list of all active NPCs with summary fields
(name, disposition, location). Resources are badge-filtered: Game Master sees all
fields; Player sees summary fields only. Resources are re-registered on Novel
switch and removed on `novel (action: end)`.
*Acceptance criterion:* `npc://<id>` returns the NPC's full stat block and narrative
fields; `npcs://` lists all active NPCs with summary fields; both are badge-filtered.
_Check:_ T128.

**REQ-122a — NPC narrative fields (Part a).**
Named NPCs (REQ-075) may carry narrative personality fields following the same contract as entity personality fields (REQ-077): `description`, `voice`, `background`, `goals`, and `voice_examples`. The `character (action: personality)` and `character (action: voice)` tools set these fields and accept an NPC identifier alongside entity identifiers. NPC narrative fields are Novel-scoped — NPCs have no roster; fields persist only with the Novel. The narrative personality fields remain inert narrative context and do not influence mechanical resolution. Setting narrative fields on an NPC is Game Master only.

**REQ-122b — NPC narrative fields (Part b).**
The server surfaces the fields in `badge_briefing` and at `npc://<id>/personality`. *Acceptance criterion:* `character (action: personality, "npc_01", {voice: "gruff, clipped sentences"})` sets NPC narrative fields; `npc://npc_01/personality` returns them; these fields are inert and do not influence combat resolution. _Check:_ T129.
**REQ-156 — NPC description field.** The `description` field listed in
REQ-075 and the `description` personality field in REQ-122 refer to the same
NPC property. Setting description via either `npc (action: create, description=...)`
or `character (action: personality, npc_id, {description: ...})` SHALL write to the same
field. The most recent write wins regardless of which tool was used.
A read via `npc://<id>`, `character (action: sheet)`, or `npc://<id>/personality`
SHALL return the same value from all surfaces.
*Acceptance criterion:* `npc (action: create, "Guard", description="Tall")` then
`character (action: personality, npc_id, {description: "Suspicious"})` produces an NPC
whose description reads "Suspicious" at `npc://<id>`, `character (action: sheet)`,
and `npc://<id>/personality`.
_Check:_ T191.

**REQ-123 — Builder-defined NPC stat fields.** The stat fields exposed on NPCs
are determined by the builder from the ruleset during discovery — not enumerated in
the specification as a fixed set. The builder derives the NPC stat surface from the
ruleset's own stat-block conventions. The `npc (action: create)` and `npc (action: update)` tools
expose builder-determined fields as optional parameters. Every field is optional
except `name` (per REQ-075). A ruleset with no discovered NPC stat conventions
produces an NPC surface with only narrative fields.
*Acceptance criterion:* A ruleset defining AC, HP, and Speed as NPC stat
conventions produces `npc (action: create)` with those parameters; a ruleset with no
stat conventions produces only narrative fields.
_Check:_ T130.

**REQ-124a — NPC damage resolution (Part a).**
Damage-resolution tools accept NPC identifiers as target parameters alongside entity identifiers. When an NPC is the target, the tool resolves damage against the NPC's defensive stats using the ruleset's own damage model — deducting HP, wounds, or the ruleset's loss-of-effectiveness metric — and reports the result with full transparency (per REQ-003). An NPC reduced to or below the ruleset's zero-health threshold is marked with the ruleset-defined incapacitation condition.

**REQ-124b — NPC damage resolution (Part b).**
Damage resolution against NPCs is snapshot-able and audited. *Acceptance criterion:* `roll_weapon_damage("longsword", target_id="npc_01")` reduces NPC HP; zero HP applies incapacitation per ruleset convention; the result is audited and snapshot-able. _Check:_ T131.
**REQ-076b1 — Scene-state ledger (Part b1).**
The server maintains a Novel-scoped narrative scene via `scene (action: set, description, ...)`. In addition to `description` (required), the tool accepts optional fields: `location`, `time_of_day`, `atmosphere` (per REQ-076a), `scene_type` (per REQ-087), `narrative_directive` (per REQ-081), `skip_transition_hook` (per REQ-125), and `characters_present` (per REQ-307 — array of entity IDs present in this scene; omitted defaults to all imported entities). When `location` resolves to a world-model room (REQ-326), the room provides spatial truth for the scene — the GM's `description` is narrative framing.

**REQ-076b2 — Scene-state ledger (Part b2).**
Each call creates a timestamped entry in the audit log; previous entries are retained in audit history. `scene://current` returns the most recent scene state. `scene://history` returns up to a configurable maximum of the most recent entries. When the cap is exceeded, the most recent entries are returned with a count of suppressed entries and a `[truncated]` marker. The full scene history is available in the audit log (REQ-040). All entries are badge-filtered. Scene state is narrative context. Scene state does not influence mechanical resolution or search results.

**REQ-076b3 — Scene-state ledger (Part b3).**
Guidance surfaces (badge_briefing tool ordering, command (action: suggest) filtering per REQ-087, and lore trigger matching per REQ-083) may be informed by scene description and type — these are navigation and narrative reactivity, distinct from mechanical resolution. The server maintains a Novel-scoped `scene_tick` counter, initialized to zero when the Novel is created and reset to zero on each scene transition. The tick increments by one each time `combat (action: advance)` resolves a full combat round (wraps from last participant to first). The tick appears in `badge_briefing` for the Game Master badge only, in the Scene section.

**REQ-076b4 — Scene-state ledger (Part b4).**
The tick is a pacing aid — it does not trigger mechanics. The `scene (action: set)` tool is Game Master only; the Player badge reads scene state via `badge_briefing` and `scene://current`. Scene state persists with the Novel. *Acceptance criterion:* Three `scene (action: set, ...)` calls produce three timestamped entries in `scene://history`; scene state is narrative context and does not change search results for mechanical terms. _Check:_ T57, T112, T132, T137.

**REQ-076b5 — Scene-state ledger (Part b5).**
WHEN `scene (action: set)` references a location that has established lore entries (REQ-083) and the new scene description contradicts an established property of that location, THE server SHALL emit a `[WARNING]` naming the contradiction and the conflicting lore entry. The warning SHALL NOT block the scene change — the GM may override — but SHALL surface the inconsistency for the GM's awareness.

**REQ-076b6 — Scene-state ledger (Part b6).**
The check SHALL compare against: (a) lore entries with `badge_scope: "game_master"` or `"shared"` whose trigger keywords match the location name; (b) NPC dispositions set explicitly (not creation defaults) for NPCs whose `location` field matches the scene location.

**REQ-076b7 — Scene-state ledger (Part b7).**
The check is keyword-based and does not perform semantic analysis. A lore entry stating "the Inn feels crowded" with a trigger keyword "Inn" SHALL produce a `[WARNING]` when a scene description contains "the empty Inn." *Acceptance criterion:* Set a lore entry for "Blackwood Inn" with content "crowded and noisy" and trigger "Blackwood." Call `scene (action: set, "The Blackwood Inn is quiet and deserted.")` — assert `[WARNING]` naming the lore entry. Call `scene (action: set, "The Blackwood Inn is bustling as always.")` — assert no warning. _Check:_ T331.
**REQ-076a1 — Structured scene fields (Part a1).**
`scene (action: set)` accepts optional structured fields alongside the required `description`. The `location` field names a place within the world. The `time_of_day` field holds morning, afternoon, evening, night, or free text. The `atmosphere` field holds mood, weather, or sensory qualities, such as "tense, foggy, silent". The `scene_type` field holds one or more type tags from the canonical catalog: `combat`, `social`, `exploration`, or `neutral`, per REQ-087. The `narrative_directive` field holds a standalone directive string or an array of labeled directives per REQ-081. The server surfaces these fields in `badge_briefing` alongside the description, in `scene://current`, and in `scene://history` entries.

**REQ-076a2 — Structured scene fields (Part a2).**
They are narrative context — inert data that does not influence mechanical resolution. All fields persist with the Novel. The Player badge reads them via `badge_briefing` and `scene://current`; write access is Game Master only. *Acceptance criterion:* `scene (action: set, "dark cavern", location="Underdark", time_of_day="night", atmosphere="tense, dripping water")` surfaces all four fields in `scene://current`. _Check:_ T133.
**REQ-252a — Narrative fast-forward (Part a).**
The Game Master may skip intervening narrative time via a `fast_forward` parameter on `scene (action: set)`. When present, the fast-forward SHALL produce a bridging summary of what transpired during the skipped interval. The summary covers countdowns, location lore entries, and NPC state changes. `narrative` countdowns advance by the caller-declared interval and `round` countdowns advance proportionally. Location lore entries appear when their triggers match the new scene. NPC state changes come from the `changes` array the GM declares (position, disposition, condition).

**REQ-252b — Narrative fast-forward (Part b).**
The bridging summary SHALL be recorded in the audit log as a `[fast-forward]` entry containing the interval description, countdown adjustments, NPC updates, and lore triggers activated. `fast_forward` accepts three parameters. The `interval` parameter holds free text describing the skipped period — "three days of uneventful travel". The `changes` parameter holds an optional array of NPC state assertions. The `skip_countdowns` parameter is an optional boolean — when true, the server does not advance countdowns, preserving their state for later use. The fast-forward is snapshot-able, and undo restores the pre-fast-forward state.

**REQ-252c — Narrative fast-forward (Part c).**
Caller SHALL omit `skip_transition_hook` when setting `fast_forward` — the transition hook fires after the server generates the bridging summary. Player badge returns `[FORBIDDEN]`. *Acceptance criterion:* `scene (action: set, "The castle gates", fast_forward={interval: "three days of travel", changes:[{npc_id:"guard_1", location:"castle gate"}])` produces an audit entry with the bridging summary, advances narrative countdowns by 3 days, and updates guard_1's location. Undo restores the pre-fast-forward scene state and countdown positions. _Check:_ T312.
**REQ-307a — Entity presence (Part a).**
The server tracks a `last_location` field, derived from the most recent `scene (action: set)` call that listed the entity in its `characters_present` parameter (REQ-076). When the caller omits `characters_present`, all imported entities count as present (backward compatible). `party://current` SHALL include a `present` boolean per entity.

**REQ-307b — Entity presence (Part b).**
Entities listed in `badge_briefing` SHALL carry a `[not present]` marker and their `last_location` when their `present` flag is false. `character (action: set_active)` to a non-present entity SHALL NOT produce an error. The active entity switches, and the `knowledge_state` section renders the "Entity not present" marker per REQ-109. A GM-only `scene (action: presence, entity_ids, location?)` tool SHALL allow the GM to declare presence explicitly — setting `characters_present` on the current scene without altering other scene fields.

**REQ-307c — Entity presence (Part c).**
Calling `scene (action: presence, [])` marks all entities as not present; calling it with all entity IDs restores full-party presence. Presence state persists with the Novel. *Acceptance criterion:* After `scene (action: set, "Dark corridor", characters_present=["rogue_01"])`, `party://current` shows the rogue as present and other entities as not present. `scene (action: presence, ["wizard_01"], "Camp")` updates presence without changing scene description. Entity listing in `badge_briefing` marks non-present entities with `[not present]`. _Check:_ T351.
**REQ-308a — Knowledge gating by presence (Part a).**
An entity's knowledge state SHALL be scoped to the scenes it attended. An entity gains percepts — revealed secrets, triggered lore, NPC relationship changes — only from scenes where it was listed in `characters_present` (REQ-307). Percepts gained from attended scenes are retained regardless of current presence. When the active entity was not present for a percept, that percept SHALL NOT appear in the entity's `knowledge_state` section. When the active entity is not present in the current scene, the `knowledge_state` section SHALL render "[Entity not present in this scene]" above the entity's retained knowledge.

**REQ-308b — Knowledge gating by presence (Part b).**
The GM controls when information crosses character boundaries via existing tools. `lore (action: reveal)` makes secrets known to other entities. `lore (action: set)` with appropriate triggers extends lore to entities not present. Story journal entries record character-to-character information sharing. *Acceptance criterion:* A scene with only the rogue present where the trap secret is revealed to the rogue, then a scene with only the wizard, then a reunion scene — assert the rogue retains trap knowledge, the wizard does not until `lore (action: reveal, "floor_trap", "wizard_01")`. _Check:_ T352.
**REQ-330a — Knowledge-world coupling (Part a).**
WHEN an entity explores rooms via parser navigation (`command (action: resolve)` per REQ-323 or `command` per REQ-196), the entity SHALL be auto-added to presence for that scene/room. Rooms visited via exploration SHALL produce knowledge state entries: room names visited, visible things examined, NPCs encountered. Exploration-derived knowledge SHALL be retained per REQ-308 — once an entity has visited a room, it knows the room regardless of current presence.

**REQ-330b — Knowledge-world coupling (Part b).**
The `knowledge_state` briefing section SHALL include exploration-derived entries alongside revealed secrets — grouped as "Explored" (rooms visited, things seen) and "Learned" (secrets revealed via `lore (action: reveal)`). The GM's explicit `characters_present` on `scene (action: set)` (REQ-307) SHALL remain the primary presence mechanism — exploration presence supplements, it does not replace.

**REQ-330c — Knowledge-world coupling (Part c).**
When the GM sets `characters_present` that conflicts with exploration presence, the explicit GM declaration wins. *Acceptance criterion:* A character in room "Entrance" navigates via `command (action: resolve)` to "Guard Room" — `knowledge_state` includes "Guard Room" under "Explored" with timestamp. Moving to "Chapel" adds Chapel. Returning to "Guard Room" does not create a duplicate entry. `scene (action: set, "Camp", characters_present=["pc_1"])` overrides exploration presence — pc_1 is present in Camp regardless of prior room. _Check:_ T374, T377.
**REQ-311a — NPC memory model (Part a).**
EACH NPC SHALL maintain a per-NPC memory of its interactions with player entities, independent of the global knowledge system (REQ-308).

**REQ-311b — NPC memory model (Part b).**
The NPC memory records four kinds of data. Witnessed events hold what the NPC observed when present per REQ-307: entity actions, dialogue context, mechanical outcomes, and story journal entries the NPC attended. Contact history holds per-player-entity encounter counts with timestamps, disposition history, and "no prior contact" markers for entities the NPC has not encountered. Emotional state derives from recent interactions — disposition trends, stress markers, and goal proximity — and surfaces as a one-sentence summary in `badge_briefing` alongside personality fields. State evolution holds automatic disposition updates when player entities interact with the NPC via combat, social checks, or mechanical outcomes, without requiring a GM tool call.

**REQ-311c — NPC memory model (Part c).**
FOR each player entity the NPC has interacted with, the engine SHALL record party knowledge: entity name, apparent capabilities, relationship status, and recent interactions with timestamps. An NPC who has never met an entity carries a "no prior contact" marker. The engine SHALL derive emotional state from disposition trends, stress markers, and goal proximity, surfaced as a one-sentence summary in `badge_briefing` alongside personality fields.

**REQ-311d — NPC memory model (Part d).**
WHEN a player entity interacts with an NPC — via combat, social checks, or mechanical outcomes — the engine SHALL update the NPC's memory and disposition automatically without requiring a GM tool call; the GM may override via `npc (action: update)`. WHEN an NPC is present in the current scene, THE engine SHALL surface the NPC's memory in `badge_briefing` as an `## NPC Memory` section within the entity personality group (REQ-109). The section SHALL include: a one-sentence emotional state summary, a summary of the NPC's last 3 interactions with present player entities, and any goals the NPC is pursuing.

**REQ-311e — NPC memory model (Part e).**
NPC memory SHALL be gated by presence (REQ-307) — only NPCs in the current scene surface their memory.

**REQ-311f — NPC memory model (Part f).**
Memory facts persist with the Novel. The `spec_health` report SHALL include `npc_memory_count`, the total number of NPC memory entries across all NPCs. *Coupling:* NPC memory entries SHALL populate campaign memory facts (REQ-310) per-NPC category when the event involves significant state changes (goal advancement, disposition flip, relationship change). *Acceptance criterion:* After a session where an NPC (blacksmith) is threatened by a player entity, `npc (action: update)` is not called, but `badge_briefing` under GM badge includes the NPC's memory section showing `disposition: hostile` and the threat event.

**REQ-311g — NPC memory model (Part g).**
After a second session where the same player entity helps the blacksmith, the NPC's memory section shows `disposition: friendly` and the disposition flip is a campaign memory fact. An NPC who has never met the party shows "no prior contact." `spec_health` reports `npc_memory_count ≥ 1`. _Check:_ T356.
**REQ-077a — Entity personality fields (Part a).**
Each roster entity may carry optional narrative fields. The `description` field holds physical appearance. The `voice` field holds speech characteristics conveying pitch, pace, vocabulary range, mannerisms, and formality register as a free-text description. The `background` field holds history and motivation. The `goals` field holds current objectives. The `voice_examples` field holds up to 5 example dialogue snippets, each recording `context`, `dialogue`, and `tag` — a scene-type or emotional-context label.

**REQ-077b — Entity personality fields (Part b).**
The `character (action: personality, entity_id, ...)` tool sets and persists these fields at the roster level, and the `character (action: voice, entity_id, examples)` tool sets `voice_examples`. Voice examples follow the same badge-gating contract as other personality fields: Player-only for own entities (per REQ-165), and GM for all. On NPCs (REQ-122), setting `voice_examples` is Game Master only. Voice examples sourced from synthesis carry a `[supplementary]` tag and a source URL.

**REQ-077c — Entity personality fields (Part c).**
These are narrative context — inert data, not mechanical. `character (action: personality, entity_id, fields)` sets description, voice, background, goals, and voice_examples — all as optional fields on one tool (Player-only for own entities per REQ-165, GM for all). The tool also accepts NPC identifiers per REQ-122. Personality fields are stored at the roster level and are explicitly mutable (an exception to roster baseline immutability — narrative fields, unlike mechanical stats, may be edited after creation).

**REQ-077d — Entity personality fields (Part d).**
Novel-level overrides: personality fields set via `character (action: personality)` on a Novel entity override the roster baseline for that Novel only. On Novel entity import, the server copies roster personality fields alongside mechanical stats. The server surfaces the fields in `badge_briefing` alongside entity stats and at `entity://<id>/personality`, and surfaces `voice_examples` under the entity personality group in `badge_briefing` per REQ-109.

**REQ-077e — Entity personality fields (Part e).**
When an entity speaks in-character, the server renders voice_examples ahead of trait descriptions in the prompt context (REQ-126). **Authorship guidance.** Effective personality fields describe concrete behaviors rather than abstract traits. The `voice` field works best when it specifies how the entity speaks in practice — e.g., clipped sentences, reaches for sword before speaking when startled — rather than bare adjectives.

**REQ-077f — Entity personality fields (Part f).**
Voice_examples should demonstrate the entity in emotionally distinct situations. They are the primary mechanism for dialogue consistency. *Acceptance criterion:* `character (action: personality, entity_id, {voice: "slow drawl, formal register"})` stores fields at the roster level; `entity://<id>/personality` returns them; Novel-level override replaces roster baseline for that Novel only. _Check:_ T58, T65, T140.
**REQ-126a — Voice examples rendering (Part a).**
When an entity speaks in-character — whether a player entity or an NPC with set personality fields — the entity's voice_examples must be rendered in the prompt context alongside its personality trait fields. Voice examples must precede trait descriptions in the prompt ordering, reflecting the show-don't-tell principle: dialogue patterns give the model concrete behavior to imitate, while trait descriptions provide abstract reasoning cues. Voice examples are inert data — they never influence mechanical resolution or dice outcomes.

**REQ-126b — Voice examples rendering (Part b).**
The rendering contract applies to all prompts and resources that surface entity personality: `badge_briefing`, `entity://<id>/personality`, `npc://<id>/personality`, and the `character (action: sheet)` tool. The server tags voice examples sourced from synthesis `[supplementary]` alongside their source URL and renders them after player-authored examples when both exist. *Acceptance criterion:* When `badge_briefing` renders an entity with voice_examples set, the dialogue snippets appear before the trait descriptions. _Check:_ T140.
**REQ-282a — NPC voice directive (Part a).**
WHEN `badge_briefing` renders the entity personality group (REQ-109), every NPC whose `location` field matches the current scene location AND whose `voice_examples` array is non-empty SHALL include a compact voice directive block. The directive SHALL contain the NPC name and role, the `voice` field value (REQ-077), up to 2 voice_example snippets (the first two examples from the array), and a synthesized "Avoid:" line. The "Avoid:" line derives from the voice field and names the vocal patterns to avoid. The directive block SHALL be badge-filtered per REQ-032: GM sees all NPC voice directives; Player badge sees directives for NPCs created with `shared` scope.

**REQ-282b — NPC voice directive (Part b).**
The voice directive is rendered inline in the entity personality group, after personality fields and before any synthesis-sourced content. The directive is advisory — it provides the AI GM with voice constraints but does not mechanically enforce them. `voice_examples` stored in the roster (entity-level) follow the same directive rendering in the entity personality group but use the entity's own voice_examples, not NPC-role synthesis. Format: `Voice directive (<NPC name>, <role>): <voice>.

**REQ-282c — NPC voice directive (Part c).**
Example: "<snippet 1>" Example: "<snippet 2>" Avoid: <voice mismatch counsel>.` WHEN `badge_briefing` renders voice_examples for entities or NPCs, only examples whose `tag` field matches at least one active `scene_type` (REQ-087) SHALL be surfaced. Examples with no `tag` or `tag: "neutral"` SHALL always surface. Entity-level voice_examples in the entity personality group follow the same filtering rule. *Acceptance criterion:* Create an NPC with `voice: "gruff, uses 'oi'"`, `voice_examples` containing two dialogue snippets, and `location` matching the current scene.

**REQ-282d — NPC voice directive (Part d).**
Assert `badge_briefing` under the GM badge includes a voice directive block for the NPC. Set scene to a different location — assert the server omits the NPC voice directive. _Check:_ T332.
**REQ-127a — Ruleset-native personality mapping (Part a).**
During discovery (§6.3), the builder must identify ruleset-native personality constructs — character traits, motivations, beliefs, flaws, bonds, or equivalent mechanics defined in the ruleset's characterization or player-facing sections. If the ruleset defines such constructs with distinct names and semantics, the builder must map each construct to the closest Holonovel personality field and record the mapping in RULESET_MODEL.md. When native constructs exist, the `character (action: personality)` tool description and the `session_zero` prompt (REQ-078) must reference those constructs by their ruleset names.

**REQ-127b — Ruleset-native personality mapping (Part b).**
For example, a ruleset that defines "Traits," "Ideals," "Bonds," and "Flaws" would see those terms in tool descriptions alongside the Holonovel field names. The mapping is advisory — it does not constrain which fields a player sets, only how the surface is presented. If the ruleset defines no native personality constructs, the builder records this finding and uses only the Holonovel field names. *Acceptance criterion:* Building for D&D 5e produces RULESET_MODEL.md mapping Traits/Ideals/Bonds/Flaws to Holonovel fields; `character (action: personality)` tool description includes "Traits," "Ideals," etc. _Check:_ T141.
**REQ-165a — Entity ownership for personality gating (Part a).**
For `character (action: personality)` badge gating (REQ-077), the Player badge "owns" an entity when the current connection created that entity under the Player badge. When no Novel is active, or when the server restarts, ownership of all existing entities resets to unowned — a Player may set personality fields on any entity until a badge activates. Once the Game Master badge sets personality fields on an entity, the Player badge retains write access to that entity's personality fields; ownership does not exclude.

**REQ-165b — Entity ownership for personality gating (Part b).**
This definition exists solely to resolve the "Player-only for own entities" contract in REQ-077 — it does not affect tool access, resource filtering, or any other subsystem. *Acceptance criterion:* A Player creates an entity (`character (action: create)` under Player badge) and successfully calls `character (action: personality)` on it. The same Player attempts `character (action: personality)` on an entity created by the GM — the call SHALL succeed (ownership is non-exclusive per the body). A Player who has never created any entity can still call `character (action: personality)` on entities imported by the GM (no ownership check blocks the Player). _Check:_ T200.
**REQ-166a — Personality briefing rendering (Part a).**
When `badge_briefing` renders the entity personality group (REQ-109), each entity with populated personality fields or voice_examples SHALL be rendered as a block. The block contains the entity name and each populated personality field on its own line (`description`, `voice`, `background`, `goals`). The block also contains voice_examples following REQ-126 ordering (dialogue snippets before trait descriptions). Empty personality fields SHALL be omitted — no placeholder lines for unset fields. Entities with no personality fields and no voice_examples SHALL be omitted from the personality group entirely.

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
The builder determines the internal representation; the contract requires both fields to survive Novel persistence and restart. The audit log entry for a `character (action: signal)` call SHALL follow the REQ-040 schema with `tool: "character (action: signal)"`, `args: {signal, value}`, and `output_prefix: "Signal '<signal>' recorded."` (or "removed" for empty-value removal). *Acceptance criterion:* `character (action: signal, "tone", "darker")` records in audit log; sending `character (action: signal, "tone", "lighter")` replaces the value; sending `character (action: signal, "tone", "")` removes it. _Check:_ T8, T26, T142, T211, T450.
**REQ-128a — Signal briefing surface (Part a).**
`badge_briefing` (GM only, REQ-109) includes a dedicated player-signals section. For each recorded signal, the section lists the signal type, value, and age. The age is the difference between the Novel's current connection counter and the counter stored with the signal (REQ-173), expressed as "set N connections ago." When no signals are recorded, the section carries an empty-state marker signaling that no preferences have been set. Player signals are on the decision-critical side of the briefing section boundary (REQ-109).

**REQ-128b — Signal briefing surface (Part b).**
The section is never truncated (REQ-118). *Acceptance criterion:* `badge_briefing` in GM badge includes a player-signals section listing each signal type, value, and age delta; an empty-signal Novel shows the empty-state marker. _Check:_ T142.
**REQ-255a — Boundary signal propagation (Part a).**
`character (action: signal, "boundary", value)` (REQ-069) SHALL be surfaced in `badge_briefing` as a dedicated advisory section titled "Boundaries," visible only to the Game Master and positioned before the scene state group (REQ-109). The section SHALL list each active boundary value with an explicit directive: "Do not narrate, imply, or introduce content that evokes these topics." Boundary removal (empty value per REQ-069) removes the entry. The boundary advisory is never truncated by the briefing size budget (REQ-135, tier 1).

**REQ-255b — Boundary signal propagation (Part b).**
When `scene (action: set)`, `npc (action: create)`, `npc (action: update)`, `lore (action: set)`, `lore (action: update)`, or `scene (action: directive)` receive free-text input containing a substring that matches an active boundary value (case-insensitive), the server SHALL return `[WARNING]`. The warning identifies the matched boundary and the colliding input segment without suppressing the operation. The collision check is advisory because free-text narrative input may coincidentally contain boundary strings without evoking the prohibited topic.

**REQ-255c — Boundary signal propagation (Part c).**
REQ-251 covers the `adventure (action: generate)` tool separately. REQ-251 covers the `adventure (action: generate_encounter)` tool separately. Its participant-consent criterion includes boundary-relevant content. *Acceptance criterion:* `character (action: signal, "boundary", "spiders")` sets a boundary; `badge_briefing` under GM badge includes a Boundaries section listing "spiders" with the avoid directive; `scene (action: set, "a cavern full of spiders")` returns `[WARNING]` identifying the "spiders" boundary collision. Removing the boundary removes the section. Player badge does not see the Boundaries section in badge_briefing. _Check:_ T314.
**REQ-173a — Connection counter (Part a).**
Each Novel tracks a `connection_counter` that increments on every server start or MCP transport connect for that Novel — not on individual tool invocations. When the server restarts or a new MCP session begins, the counter advances by one before the server services any tool. The counter persists with the Novel and appears in `novel://current` metadata. A `character (action: signal)` call records the current connection counter alongside the signal value, replacing the prior counter when the server overwrites the signal type.

**REQ-173b — Connection counter (Part b).**
The age displayed in `badge_briefing` per REQ-128 is `current_connection_counter - stored_counter`, expressed as "set N connections ago" (or "set this connection" when zero). When the server stores no connection counter (pre-existing Novel from a build that predates this REQ), the age SHALL display "unknown" instead of an incorrect integer.

**REQ-173c — Connection counter (Part c).**
The builder SHALL record the counter storage format in DECISIONS.md. *Acceptance criterion:* Set a signal, restart server, invoke `badge_briefing` as GM — assert the signal shows "set 1 connection ago." Set another signal, restart, invoke briefing — assert the first shows "set 2 connections ago" and the second shows "set 1 connection ago." Remove and re-set a signal in the same connection — assert it shows "set this connection." _Check:_ T211.
**REQ-129a — Property group cardinality (Part a).**
Every Novel-scoped property group has an enforced maximum item count. Exceeding the maximum on a create or set operation SHALL return `[ERROR] [STATE_CONFLICT]` with the affected group named and the current and maximum counts reported.

**REQ-129b1 — Property group cardinality (Part b1).**
The following lists each maximum and its configuration source. NPCs: `TTRPG_MAX_NPCS` (also used by REQ-097 for health warnings; this REQ adds enforcement at the same threshold). Lore entries: `TTRPG_MAX_LORE_ENTRIES` (also used by REQ-097; the lore token budget per REQ-083 is an independent constraint). Countdowns: `TTRPG_MAX_COUNTDOWNS`. Synthesis items per output module: `TTRPG_MAX_SYNTHESIS_ITEMS`. Story journal entries: `TTRPG_MAX_STORY_ENTRIES`, and exceeding on `story (action: record)` SHALL return `[ERROR] [STATE_CONFLICT]`.

**REQ-129b2 — Property group cardinality (Part b2).**
Entities per Novel — `TTRPG_MAX_ENTITIES`, exceeding on `character (action: import)` or `character (action: create)` SHALL return `[ERROR] [STATE_CONFLICT]` with counts reported; Roster entities — `TTRPG_MAX_ROSTER_ENTITIES`, exceeding on `character (action: create)` SHALL return `[ERROR] [STATE_CONFLICT]` before any state mutation.

**REQ-129c — Property group cardinality (Part c).**
REQ-076 caps scene history entries. Setting a maximum to zero SHALL disable that group's mutating tools — create, set, and update operations return `[STATE_CONFLICT]`. `spec_health` SHALL report the current count and maximum for every group, with an `overflow` flag when at maximum. A warning fires in `spec_health` when entity count exceeds 80% of the entity maximum; the server sets the `healthy` flag to false when at maximum.

**REQ-129d — Property group cardinality (Part d).**
The builder records the configured maximums in DECISIONS.md (4). *Acceptance criterion:* Creating the 501st NPC returns `[STATE_CONFLICT]` with the group named; setting `TTRPG_MAX_NPCS=0` causes `npc (action: create)` to fail; `TTRPG_MAX_ENTITIES=0` causes `character (action: import)` to fail; `spec_health` reports per-group counts and overflow status including entity and roster groups. _Check:_ T143, T218.
**REQ-079a — Adventure modules (Part a).**
The server loads Markdown adventure modules during the Build workflow alongside the ruleset. Every adventure module SHALL be parsed for world-model declarative assertions (rooms, things, exits, properties) within a designated `## World` section. Assertions found in the section SHALL be extracted and indexed. `adventure (action: load, adventure, target?)` SHALL populate the Novel's world-model tier with the extracted rooms, things, exits, and properties when the adventure module contains a `## World` section. The load SHALL then link any TTRPG annotations (`@encounter`, `@trap`, `@npc`, `@lore`) to world-model objects by name.

**REQ-079b — Adventure modules (Part b).**
Adventure modules without a `## World` section SHALL load as flat indexed content — their prose is searchable via `ruleset (action: search)` and surfaced in `badge_briefing`, but the server creates no world-model objects.

**REQ-079c — Adventure modules (Part c).**
When the adventure module has undergone structural extraction (REQ-247), `adventure (action: load)` SHALL additionally pre-populate Novel state from the extracted content. Extracted NPCs SHALL become Novel-scoped NPC entities created silently (GM-modifiable via `npc (action: update)`). Extracted location descriptions SHALL become lore entries keyed by heading name. Extracted faction references SHALL become faction entities with starting clocks. The extracted premise SHALL become the adventure hook surfaced in `badge_briefing`. The load response SHALL include a summary of pre-populated items with counts.

**REQ-079d — Adventure modules (Part d).**
The server skips items whose name duplicates existing Novel state, with a note. The server creates NPCs carrying only a name and no parseable stats as skeletal entities. The skeletal NPCs participate in combat with `[auto]` turns per REQ-043, using the description field for narration, and the GM fills in stats via `npc (action: update)` before mechanical combat participation becomes necessary. When a pre-populated NPC's name fuzzy-matches a ruleset monster entry (per `lookup_monster`), the load response SHALL include a suggestion: "NPC '<name>' may match ruleset entry '<match>'.

**REQ-079e — Adventure modules (Part e).**
Confirm to populate stats." After loading, the adventure's prose content SHALL be accessible at `adventure://<adventure-slug>/<anchor>`. `ruleset (action: search)` includes adventure content; the server sorts active-adventure results first. Active-adventure results SHALL carry HIGH match confidence when the query token appears in a section heading; MEDIUM when it appears in body text.

**REQ-079f — Adventure modules (Part f).**
The `[generated]` tag (REQ-132) SHALL NOT affect sort order — generated and indexed results sort by match strength identically; the tag is a source-of-origin marker only. The `badge_briefing` surface includes the active adventure's hook, current location, and the current room's name and visible contents when the server has populated a world model. The server filters adventure content by badge: it hides sections marked with the ruleset's adjudicator term (e.g., `*Keeper only*`) from the Player badge. Unmarked sections remain visible to all. Multiple adventures may be indexed, and the server surfaces only the active adventure's content in `badge_briefing`.

**REQ-079g — Adventure modules (Part g).**
Adventure NPCs defined via `@npc` annotations are Novel-scoped entities created at load time. The GM may modify them via `npc (action: update)`. `adventure (action: load)` is Game Master only. `adventure (action: load)` with a slug not matching any indexed adventure SHALL return `[NOT_FOUND]` and enumerate available adventure slugs. The `TTRPG_ADVENTURE` env var (optional, comma-separated paths) pre-loads adventures at startup.

**REQ-079h — Adventure modules (Part h).**
The optional `target` parameter accepts `novel` (default when a Novel is active) or `codex` (default when no Novel is active). The `target: "codex"` value SHALL process the adventure module's structural extraction (REQ-247) and store the resulting scaffold as a Codex entry of kind `adventure` with `source: loaded:<slug>`. The server stores world-model assertions, extracted NPCs, factions, lore entries, and the premise in the adventure data payload per REQ-321 without populating Novel state. The `target: "novel"` value SHALL load into the active Novel with all existing pre-population behavior (world-model tier population, NPC creation, faction creation, lore entry creation).

**REQ-079i — Adventure modules (Part i).**
When no Novel is active and `target` is omitted, `target` defaults to `codex`. `adventure (action: load)` SHALL be callable regardless of Novel state — no Novel is required for `target: "codex"`. State isolation: world-model objects, NPCs, and lore created by adventure loading are Novel entities — discarded by `novel (action: end)`. Switching adventures replaces the active adventure's world model (if present) and prose content but retains Novel entities created outside adventure loading.

**REQ-079j1 — Adventure modules (Part j1).**
Adventure module content loaded into a Novel SHALL be included in `novel (action: export)` (REQ-096). When `TTRPG_EXPORT_EMBED_ADVENTURES` is `true`, the server embeds the module's prose content and world-model assertions inline. When `false`, the server records module slugs in the export manifest for reconstitution at import time.

**REQ-079j2 — Adventure modules (Part j2).**
*Acceptance criterion:* `adventure (action: load, "tomb-of-the-serpent-king")` activates the adventure, populates the world-model tier with rooms/things/ exits from the `## World` section, links `@npc` annotations, and surfaces the adventure hook and current room in `badge_briefing`; a module without a `## World` section loads as flat indexed content. `adventure (action: load, "tomb-of-the-serpent-king", target="codex")` with no Novel active stores the adventure scaffold in Codex; `codex (action: list, "adventure")` returns the entry with `source: loaded:tomb-of-the-serpent-king`; server restart preserves it. _Check:_ T59, T60, T61, T368.
**REQ-292a — Adventure catalog (Part a).**
(always callable) returning metadata for every adventure module present in `TTRPG_ADVENTURE`. Each entry SHALL include: `slug`, `title`, `preview` (2–3 sentence GM-facing premise), `genre_tags`, `room_count`, `npc_count`, `complexity` (estimated: `short`, `standard`, `epic` based on room count thresholds), and `last_modified`. An optional `filter` parameter accepts a genre tag string and returns only matching adventures.

**REQ-292b — Adventure catalog (Part b).**
When `TTRPG_ADVENTURE` contains no adventure modules, `adventure (action: list)` SHALL return an empty-state message: "[No adventure modules found.]" The catalog is badge-filtered. The Player badge sees adventures with a `player_visible` flag or `shared` adventure hooks, and the GM badge sees all. `spec_health` SHALL report `adventure_catalog_count`. `adventure (action: list)` has no briefing presence per §5.10. `help("adventure (action: list)")` SHALL return usage examples and parameter contracts. *Acceptance criterion:* With 2 adventure modules, `adventure (action: list)` returns 2 entries with slug, title, preview, genre_tags, room_count, npc_count, complexity, and last_modified.

**REQ-292c — Adventure catalog (Part c).**
Empty directory returns the empty-state message. _Check:_ T338. Adventure modules MAY contain narrative sections in addition to or instead of the `## World` spatial section. The `## Premise` section holds a one-paragraph hook introducing the adventure. The `## Factions` section holds named organizations with goals, resources, and starting clocks (per REQ-233). The `## Scenes` section holds ordered or branching scene descriptions with embedded choice prompts. The `## NPCs` section holds named characters with personality fields and voice examples. The `## Lore` section holds worldbuilding keywords with triggers. The `## Seeds` section holds GM-facing prompts and improvisation hooks.

**REQ-292d — Adventure catalog (Part d).**
An adventure with no `## World` section is a narrative-only adventure. Such an adventure populates Novel state (factions, lore, NPCs, and scene history seeds) without creating spatial rooms. `adventure (action: load)` processes all present sections regardless of spatial content.
**REQ-229a — Adventure synthesis linkage (Part a).**
For `@npc`, `@encounter`, and `@lore` annotations, the server SHALL scan both Ruleset Wisdom and synthesis for matches against the newly loaded adventure content. The server matches voice examples to NPC creature types via the ruleset index, lore templates to `@lore` annotation keywords, action patterns to encounter types, and adventure advice to adventure themes.

**REQ-229b — Adventure synthesis linkage (Part b).**
For non-Appendix-K adventures, matches SHALL be derived from structural extraction content (REQ-247). The server matches voice examples to extracted NPC names via the ruleset index, lore templates to extracted location keywords, and action patterns to extracted encounter descriptions. Ruleset-native synthesis items SHALL be automatically activated for the GM. The items remain active in `badge_briefing`, synthesis resources, and suggestion surfaces immediately after `adventure (action: load)` completes.

**REQ-229c — Adventure synthesis linkage (Part c).**
Community synthesis items SHALL remain inert per REQ-080, with a prompt in the load response offering activation: "Synthesis X items found. Review at `synthesis://status` and activate individually." The load response surfaces matches in the `adventure (action: load)` augmentation section: "Synthesis found X voice examples for adventure NPCs, Y lore templates for adventure locations. Review at `synthesis://status`." The augmentation section SHALL appear after the world-model population confirmation. When the server finds no matches, the load response omits the augmentation section.

**REQ-229d — Adventure synthesis linkage (Part d).**
When synthesis has not been run (community tier empty) and Ruleset Wisdom provides no matches, the load response omits the section with no error. *Acceptance criterion:* Loading an adventure with `@npc(goblin)` and synthesis voice_examples containing "goblin" entries produces an augmentation section with match count and `synthesis://status` pointer. Loading an adventure with no matching synthesis items omits the augmentation section. _Check:_ T305.
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
During discovery (§6.3), the builder SHALL validate that every adventure module conforms to Appendix K conventions. The conventions require an H1 title (used as slug), an `## Overview` heading, an `## Adventure Hook` heading, and consistent use of the ruleset's adjudicator marker for GM-only sections. Adventures that fail validation SHALL be reported at build time with a `[malformed-adventure]` entry in `spec_health`. The entry lists the adventure slug, the failing convention, and whether the builder skipped or partially indexed the adventure.

**REQ-171b — Adventure content validation (Part b).**
Partially indexed adventures serve only the conforming sections; the server omits skipped adventures from all surfaces. *Acceptance criterion:* Build with a malformed adventure (missing Overview heading) — assert `spec_health` reports `[malformed-adventure]` with the slug and failure reason; assert conforming sections of partially indexed adventures are retrievable at `adventure://<slug>/<anchor>`. _Check:_ T208.
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
During Discovery (§6.3), the builder SHALL extract structural content from every adventure module using discoverable patterns. The extraction requires no Appendix K formatting.

**REQ-247b1 — Adventure structure extraction (Part b1).**
The builder SHALL apply three heuristics in order. Heading extraction: every `##` or `###` heading in the adventure file becomes a structural table-of-contents entry. The server excludes headings that are purely numeric or exceed 50 characters without whitespace (garbled OCR text); confidence HIGH. NPC extraction: a bolded name followed within 3 lines by a numeric stat value, a role noun, or a page reference counts as an NPC reference. Stat values that parse as numbers populate the NPC's fields. The server records non-parsing values in a `notes` narrative field; confidence LOW.

**REQ-247b2 — Adventure structure extraction (Part b2).**
Location and faction extraction follows. A heading whose text contains no rule/action keywords (roll, check, save, attack, damage) and has at least 100 words of prose below it counts as a scene or location description. A heading within 80 words of a goal- or resource-describing sentence and containing an organization term (Guild, Fleet, Council, Company, Syndicate) counts as a faction reference. Confidence MEDIUM.

**REQ-247c — Adventure structure extraction (Part c).**
The builder discards garbled text matching no pattern silently — the contract guarantees that the builder attempts extraction, not that it yields results. The builder records output in the build's adventure index. The builder skips the step when no adventure files are present. *Acceptance criterion:* Build with a non-Appendix-K adventure — assert structural index produced with scene headings, NPC references, and location entries; a module with no discoverable structure produces an empty index without error. _Check:_ T283.
**REQ-248a — Adventure overview resource (Part a).**
The server SHALL provide a resource at `adventure://<slug>/overview` summarizing the adventure's contents: the premise (one paragraph introducing the adventure), key NPCs (name and one-line role), major locations (name and one-line description), factions in conflict, and the scene count from the structural index. Content is drawn from the structural extraction (REQ-247) and populated when `adventure (action: load)` is called. The resource SHALL be badge-filtered: the Player badge sees only the premise and shared content; the Game Master badge sees the full overview including GM-only sections.

**REQ-248b — Adventure overview resource (Part b).**
When the adventure has no structural index (empty extraction), the resource SHALL return `[WARNING]` with "No structured overview available" and the raw adventure slug. *Acceptance criterion:* `adventure://<slug>/overview` returns premise, NPC list with roles, location list, faction descriptions, and scene count, badge-filtered per section markers. _Check:_ T285.
**REQ-249a — Adventure navigation resource (Part a).**
The server SHALL provide a resource at `adventure://<slug>/navigation` rendering the adventure's structural index (REQ-247) as navigable Markdown: all scenes in order with heading anchors, the current scene waypoint (REQ-250) marked with `[→]`, adjacent scenes indicated as previous and next. The resource is on-demand — it SHALL NOT be included in `badge_briefing`. The resource SHALL be badge-filtered: GM-only sections are hidden from the Player badge; the Player sees only the scene list without GM annotations. When no adventure is loaded, the resource SHALL return `[ERROR] [STATE_CONFLICT]` directing the caller to load an adventure first.

**REQ-249b — Adventure navigation resource (Part b).**
When the adventure has no structural index, the resource SHALL return `[WARNING]` with "No navigation index available." *Acceptance criterion:* `adventure://<slug>/navigation` returns scene list with current waypoint marked; adjacent scenes indicated; badge-filtered per section markers; unavailable when no adventure is loaded. _Check:_ T286.
**REQ-250a — Adventure scene waypoint (Part a).**
The `scene (action: set)` tool gains an optional `adventure_scene` field accepting a heading anchor from the adventure's structural index (REQ-247). When set, `badge_briefing` SHALL surface the adventure scene's description as a distinct labeled block alongside the current scene state — "Adventure Scene (<slug> § <heading>): <prose>". The `badge_briefing` output SHALL list adjacent scenes (previous and next in the structural index) as nearby. The GM's free-text `description` parameter remains independent — the two SHALL NOT overwrite each other. The waypoint persists with the Novel.

**REQ-250b — Adventure scene waypoint (Part b).**
Setting `adventure_scene` to a heading not in the index returns `[NOT_FOUND]` with nearby scene names enumerated. Setting it to an empty string or null clears the waypoint. Changing the waypoint fires a scene transition hook (REQ-125). The field is Game Master only; the Player badge reads it passively via `badge_briefing`.

**REQ-250c — Adventure scene waypoint (Part c).**
When the caller sets `adventure_scene` and the adventure contains GM-only sections, the scene description SHALL be rendered regardless of badge — but the full scene prose (at the adventure resource) is badge-filtered per adventure section markers. *Acceptance criterion:* Set `adventure_scene` to a heading anchor — assert description in `badge_briefing` labeled with adventure slug and scene heading; adjacent scenes listed; transition hook fires; `[NOT_FOUND]` for unknown anchors; Player pass-through in briefing. _Check:_ T284.
**REQ-132a — Adventure generation lifecycle (Part a).**
`adventure (action: generate, premise)` is a transient Novel-scoped artifact, distinct from build-time indexed adventure modules (REQ-079). Generated adventures are not indexed at build time — they exist only within the Novel that generated them, are discarded by `novel (action: end)`, and are not persisted to the `TTRPG_ADVENTURE` directory. Generated adventure content SHALL be surfaced at `adventure://generated/<anchor>`, use the same heading, anchor, and badge-filtering conventions as indexed adventures (Appendix K), and appear in `badge_briefing` and `ruleset (action: search)` results when the generating Novel is active.

**REQ-132b — Adventure generation lifecycle (Part b).**
Calling `adventure (action: generate)` when a generated adventure already exists in the Novel SHALL replace the prior generated content. `adventure (action: load)` replaces the active indexed adventure but SHALL NOT affect the generated adventure. A generated adventure SHALL NOT replace the indexed adventure.

**REQ-132c — Adventure generation lifecycle (Part c).**
A Novel may have both an indexed adventure and a generated adventure active simultaneously. `badge_briefing` SHALL surface the indexed adventure's content first, then the generated adventure's content. The `ruleset (action: search)` tool SHALL distinguish generated results with a `[generated]` tag. `adventure (action: generate, premise)` SHALL include a `## World` section in its generated output when the premise suggests spatial content (locations, dungeons, buildings).

**REQ-132d — Adventure generation lifecycle (Part d).**
The generated world-model section SHALL contain at minimum: one room (the starting location) with a description, and exit connections for any additional locations named in the premise. Generated world-model content SHALL follow the same declarative assertion conventions as indexed adventure modules (Appendix K).

**REQ-132e — Adventure generation lifecycle (Part e).**
When the server replaces the generated adventure or the Novel ends, the server SHALL discard the generated world-model objects — they are Novel-scoped per the base contract. *Acceptance criterion:* `adventure (action: generate, "A haunted station")` produces adventure content at `adventure://generated/overview`; restarting the server preserves the generated adventure; `novel (action: end)` discards it; a second `adventure (action: generate)` replaces the first. _Check:_ T146.

#### Fingerprinting and State Integrity

**REQ-044 — Ruleset hash recording.** The server computes a SHA-256 content hash of the
ruleset Markdown files at build time and records it in the build fingerprint (REQ-065).
The server computes the hash from the sorted, concatenated contents of every ruleset source file
so that the same filesystem contents always produce the same hash. The recorded hash is
the basis for post-build drift detection (REQ-065). A server built without ruleset files
(e.g., a pure-discovery build that records only the intake answers) records a sentinel
hash indicating the absence of a ruleset.
*Acceptance criterion:* Building the same ruleset twice produces identical ruleset hashes;
building against two different ruleset revisions produces different hashes.
_Check:_ T17.

**REQ-302a — Per-section content hashing (Part a).**
(REQ-044), the builder SHALL compute per-section content hashes — one hash per top-level heading section in the ruleset Markdown source. Each section hash SHALL use SHA-256 over the normalized section content. Per-section hashes SHALL be recorded in DECISIONS.md (4). During Build (§6.2–§6.3) when per-section hashes from a prior build are recorded in DECISIONS.md (4), and during spec-driven updates (§6.7), sections whose hash is unchanged SHALL be skipped — their prior extraction output is referenced. Sections whose hash changed SHALL be re-extracted.

**REQ-302b — Per-section content hashing (Part b).**
The builder SHALL record a per-section delta summary: total sections, sections unchanged, sections changed, sections added, sections removed. The delta summary SHALL NOT override REQ-272 (stock elements catalog) — both operate independently. *Acceptance criterion:* A ruleset with 20 top-level sections, one of which changed, produces per-section hashes where 19 match the prior build and 1 is re-extracted. DECISIONS.md (4) records the delta summary. _Check:_ T346.
**REQ-065a — Build fingerprint (Part a).**
The server records a build fingerprint in its state directory: the specification version, the specification content hash (from the embedded holonovel.md, REQ-105), the ruleset content hash (REQ-044), the holonovel version (from B10), the spec repository URL (REQ-106), and the build timestamp. The fingerprint is persisted alongside Novel state so it survives server restarts. On startup with existing state, the server reloads the stored fingerprint and compares it against the freshly computed current-build fingerprint.

**REQ-065b — Build fingerprint (Part b).**
The comparison runs field-by-field. A specification version mismatch emits `[spec-version-drift]`. A specification content hash mismatch emits `[spec-drift]` listing the stored and current hashes. A ruleset content hash mismatch emits `[ruleset-drift]` listing the stored and current hashes (traceable to REQ-014). A holonovel version mismatch emits `[holonovel-drift]`. The build timestamp differs across restarts by design and emits no warning. Drift warnings are diagnostic surfaces, not safety interlocks — they do not block startup or degrade service.

**REQ-065c — Build fingerprint (Part c).**
The active build's specification version, ruleset hash, and build timestamp always take precedence over stored values; the server retains stored values for drift comparison only. Per-session fields (the last specification review timestamp and last Pattern Buffer execution timestamp) may be updated at runtime and preserved across restarts. The constructor-derived version, hash, holonovel package version, and timestamp are immutable for the build's lifetime.

**REQ-065d — Build fingerprint (Part d).**
The server must load existing state gracefully. Fields present in state but absent from the current entity model remain inert data and cause no errors. Fields required by the current model but absent from existing state receive their ruleset-defined defaults. Roster baselines remain immutable across rebuilds. Unrecoverable state — state that cannot be parsed or structurally loaded — reaches the operator via stderr and surfaces in spec_health with the affected top-level keys or entity/NPC identifiers named; the server must not silently discard it.

**REQ-065e — Build fingerprint (Part e).**
The server continues to operate with a clean state for the affected Novel — the corrupted state is not loaded; the Novel is treated as ended (resume returns `[STATE_CONFLICT]`). Roster baselines and other intact Novels are unaffected. A fresh start against an empty state directory is a match. *Acceptance criterion:* After a rebuild with added entity fields, an existing Novel loads without error. A corrupted JSON produces a stderr diagnostic naming the affected keys.

**REQ-065f — Build fingerprint (Part f).**
A ruleset modification after build produces a [ruleset-drift] warning in spec_health and stderr at next startup; a spec modification produces a [spec-drift] warning; neither blocks startup. _Check:_ T52, T224. Out of scope: relational database backends, distributed state, cloud synchronization, and cross-version state migration without the Update workflow (§6.7).
**REQ-313a — Server implementation fingerprinting (Part a).**
The builder SHALL compute SHA-256 content hashes for five server implementation components at every build and record them alongside the build fingerprint (REQ-065) in DECISIONS.md (1). _Check:_ T497.

**REQ-313b — Server implementation fingerprinting (Part b).**
The five components follow. The server source code component hashes all files in the server's source directory, sorted by path and concatenated. The server configuration component hashes the build configuration files governing compilation and dependencies. The dependency lockfile component hashes the exact dependency tree. The generated extraction data component hashes the ruleset extraction output produced during Discovery. The registered surfaces component hashes the sorted, concatenated list of registered tool names, resource URIs, and prompt names. _Check:_ T497.

**REQ-313c — Server implementation fingerprinting (Part c).**
When generated extraction data is absent (ruleset-free builds or servers without extraction), the generated-data component records a sentinel indicating no extraction was performed. Each component hash SHALL be updated on every build and every spec-driven update (§6.7). The builder SHALL NOT use these hashes to gate startup — they exist for scoping subsequent builds and updates (REQ-314). *Acceptance criterion:* A build records five component hashes in DECISIONS.md (1) alongside the build fingerprint; a subsequent build with unchanged source code produces an identical source code hash. _Check:_ T497.

**REQ-313d — Server implementation fingerprinting (Part d).**
A ruleset-free build records the sentinel for generated extraction data. _Check:_ T497.
**REQ-314a — Fingerprint-driven partial rebuild (Part a).**
During Build (§6.2–§6.6) or spec-driven updates (§6.7), the builder SHALL compare the current implementation fingerprints (REQ-313) against the stored fingerprints from the prior build. When one or more components changed but others are unchanged, the builder SHALL scope the rebuild to only the changed components and their dependents, reusing prior output for unchanged components. Source code changes (with configuration and dependencies unchanged) require a typecheck then Pattern Buffer sub-workflows for the changed surfaces per §6.6. _Check:_ T497.

**REQ-314b — Fingerprint-driven partial rebuild (Part b).**
Configuration or dependency changes (with source unchanged) require dependency reinstall and typecheck only. Generated extraction data changes (with ruleset content hash unchanged per REQ-044) require re-indexing generation data only, reusing prior extraction output per REQ-302. Registered surface changes require Pattern Buffer sub-workflows per §6.6 for the changed tools, resources, or prompts. Specification content hash changes per REQ-187 require a gap audit per REQ-098 then implementation of only changed surfaces. _Check:_ T497.

**REQ-314c — Fingerprint-driven partial rebuild (Part c).**
Cold checkout (no stored fingerprints) and builds where more than half the fingerprint components changed SHALL run the full Build workflow (§6.2–§6.6). The builder SHALL record a fingerprint delta summary in DECISIONS.md (1): which components changed, which remained unchanged, the scoping decision, and which prior outputs the builder reused. *Acceptance criterion:* A build where only the source code changed reuses the stored generated-data hash, skips extraction, and runs only surface-dependent Pattern Buffer sub-workflows. A cold checkout with no stored fingerprints runs the full Build workflow without scoping. _Check:_ T497.

**REQ-314d — Fingerprint-driven partial rebuild (Part d).**
When four of five components changed, the full Build workflow runs regardless of individual scoping rules. _Check:_ T497.
**REQ-232a — Pause/resume context (Part a).**
The Novel SHALL persist a `gm_context` object alongside other Novel state. The `current_scene` field holds a narrative summary of the active scene. The `immediate_situation` field holds what happens right now. The `pending_player_action` field holds the decision the player faced next. The `short_term_plans` field holds the GM's next move. The `long_term_plans` field holds the GM's arc-level direction. The `active_threads` field holds an array of {name, status, urgency, description}. The `npc_attitudes` field holds an object mapping NPC ids to their current disposition strings. The `player_goals` field holds what the player seems focused on. The `saved_at` field holds an ISO 8601 timestamp of the last save.

**REQ-232b — Pause/resume context (Part b).**
All fields are optional; a call supplies only the fields the GM wants to update. `novel (action: save_context, fields...)` — Game Master only — merges provided fields into the existing `gm_context`. `novel (action: get_context)` returns a complete briefing for session resumption. The briefing includes `gm_context` content, a Novel state summary, and the `badge_briefing` prompt.

**REQ-232c — Pause/resume context (Part c).**
When the caller invokes `novel (action: resume)`, the `intro` prompt SHALL include the `gm_context` summary. The `novel (action: end)` tool clears `gm_context`. The `novel (action: save_context)` tool SHALL automatically capture the current faction clock states (REQ-233), active countdown positions (REQ-073), NPC dispositions, entity relationships (REQ-236), the last 3 story journal entries of type `decision` or `bond` (REQ-246), and active vow state. The vow capture includes milestone counts and difficulty ranks (REQ-289). The GM does not need to re-enter these manually.

**REQ-232d — Pause/resume context (Part d).**
The story journal and vow captures SHALL be stored as `story_context` (array of entry summaries, 1–2 sentences each) and `active_vows` (array of vow summaries: name, difficulty, milestone count). The server surfaces these fields via `novel (action: get_context)` and includes them in the `intro` prompt's GM context summary. *Acceptance criterion:* `novel (action: save_context, current_scene="The tavern brawl", short_term_plans="Guards arrive in 2 rounds")` followed by `novel (action: get_context)` returns both fields; `novel (action: resume)` includes the context in `intro`. _Check:_ T268.
**REQ-233b1 — Factions (Part b1).**
The Game Master may manage named organizations (factions) with goals, resources, and a progress clock. `faction (action: create, name, description, goals?, resources?)` creates a faction. `faction (action: update, faction_id, fields...)` mutates existing fields. `faction (action: remove, faction_id)` removes a faction and its clock. Factions persist with the Novel. Resources: `faction://<id>` and `factions://` — GM-filtered. Faction clocks update faction progress and are surfaced in `badge_briefing`. When a faction clock fills, the faction's status updates to the next goal and a new clock begins — surfaced as a `[WARNING]` in `spec_health`. Factions appear in `gm_context.active_threads` (REQ-232).

**REQ-233b2 — Factions (Part b2).**
Faction clocks SHALL advance by one tick at scene transitions (REQ-125). *Coupling:* `faction (action: create)` SHALL auto-create a countdown with `clock_type: faction` (REQ-073) for the faction's primary goal. `countdown (action: advance)` on a faction-named clock SHALL update the faction's clock display.

**REQ-233b3 — Factions (Part b3).**
When the caller sets a relationship between a faction and an entity (REQ-236), the faction name SHALL be accepted as valid for either direction. *Acceptance criterion:* `faction (action: create, "Merchant Guild", "Controls trade routes", goals=["Expand to East Dock"])` creates a faction with a `clock_type: faction` countdown; `faction://<id>` returns the faction with its current clock position. _Check:_ T269.
**REQ-233a1 — World reactivity (Part a1).**
WHEN scene_transition (REQ-125) fires, THE engine SHALL autonomously advance the world state beyond faction clocks. FOR each NPC with `goals` whose last-known location differs from a goal-relevant entity's current scene, the engine SHALL check goal progress — success produces a campaign memory fact (REQ-310), failure produces a stalled-pursuit fact. WHEN a player action triggers a state change in a connected entity (relationship change, secret revelation, faction clock filling), the engine SHALL trace ripple effects through directly connected entities one hop.

**REQ-233a2 — World reactivity (Part a2).**
The GM SHALL see a World in Motion section in `badge_briefing` listing pending world changes with source, summary, and accept/modify/defer labels. Accept applies the change to canonical state. Modify raises a `[NEED_INPUT]` workflow. Defer suppresses the change (max 3 deferrals; fourth escalates to `[WARNING]` in `spec_health`). A setting `TTRPG_WORLD_REACTIVITY` (defaults to active) controls whether the reactivity cycle runs.

**REQ-233a3 — World reactivity (Part a3).**
When `off`, scene transitions advance faction clocks only (current behavior). *Acceptance criterion:* With `TTRPG_WORLD_REACTIVITY=on`, an NPC with `goals="Steal the crown"` produces a World in Motion entry at scene transition showing goal pursuit progress. A relationship change on entity A (`ally` → `rival` with entity B) produces a campaign memory fact on entity B. The GM accepts a proposed change — it appears in campaign memory. The GM defers a change — it re-appears at the next scene transition. _Check:_ T358.
**REQ-236a — Entity relationships (Part a).**
The Game Master may set directed relationships between entities, NPCs, and factions. `relationship (action: set, entity_a, entity_b, type, value?, description?)` sets a directed relationship. Relationship types: `ally`, `rival`, `neutral`, `mentor` and `dependent`, `suspicious`. `relationship (action: get, entity_id)` returns all relationships for an entity (both outgoing and incoming). Relationships SHALL appear on `character (action: sheet)` output in a "Relationships" section. When an entity's relationship type changes between `ally` and `rival` (in either direction), the GM SHALL be prompted via `badge_briefing` to consider a lore entry.

**REQ-236b — Entity relationships (Part b).**
WHEN `relationship (action: set)` changes a relationship type between non-neutral categories, THE server SHALL inject an event marker into the `narrative_threads` section token. The marker reads: "Relationship changed: `<entity_a>` and `<entity_b>` are now `<type>`." The triggering changes are `ally` ↔ `rival`, `ally` ↔ `suspicious`, `rival` ↔ `suspicious`, and any change involving `neutral`. The marker persists for the duration of the current scene and leaves on the next scene transition. Relationships persist with the Novel and SHALL be saved as part of `novel (action: save_context)` (REQ-232).

**REQ-236c — Entity relationships (Part c).**
The server accepts faction identifiers as valid for either direction. *Acceptance criterion:* `relationship (action: set, "pc_1", "npc_guard", "suspicious", value=3)` records a suspicious relationship; `relationship (action: get, "pc_1")` includes the entry; `character (action: sheet, "pc_1")` shows "Relationships: Guard (suspicious)." _Check:_ T270.
**REQ-237a — Session segmentation (Part a).**
`[session-boundary]` audit log marker entry when a new `TTRPG_SESSION_ID` value is detected on the first mutating tool call after a server start or Novel resume. The marker entry carries `session_id`, `started_at` (ISO 8601 timestamp of first mutating call), and `ended_at` (ISO 8601 timestamp of the previous session's last mutating entry, or null for the first session). The marker is a mutating entry for audit-chain purposes (REQ-040) but its output prefix is the marker identifier.

**REQ-237b1 — Session segmentation (Part b1).**
Markers SHALL be badge-filtered: the Player badge sees only session boundary timespans without the `session_id`, and the Game Master sees the full marker entry. `session (action: recap)` (REQ-072) SHALL accept an optional `session_id` parameter. When provided, the recap scopes to the audit log range bounded by the matching `[session-boundary]` entry and the next marker. `spec_health` SHALL report a `sessions` array in Novel metadata. Each per-session object contains `session_id`, `entry_count`, `timespan_start`, and `timespan_end`, plus `combat_rounds`, `significant_roll_count`, and `scene_transitions`.

**REQ-237b2 — Session segmentation (Part b2).**
*Acceptance criterion:* After two sessions with different `TTRPG_SESSION_ID` values, the audit log contains two `[session-boundary]` entries; `session (action: recap, session_id="s1")` returns only entries from session s1; `spec_health` reports per-session metrics for both sessions. _Check:_ T275.
**REQ-073a1 — Clock types (Part a1).**
`countdown (action: set)` SHALL accept a `clock_type` parameter selecting the clock's interaction model. The `danger` clock (default) fills on consequences — a full clock triggers danger. The `racing` clock creates two opposed clocks; the first to full wins. The `linked` clock triggers an unlocked clock on completion, rendered as an indented chain tree. The `tug_of_war` clock allows advancing and retreating ticks; `retreat_countdown` SHALL remove ticks without going below zero. The `faction` clock advances one tick per scene transition for factions (REQ-233). The `mission` clock auto-decrements one tick per `novel (action: resume)`, and reaching zero changes mission parameters. The `link_countdown(parent_name, child_name)` call creates a linked relationship between two existing clocks.

**REQ-073a2 — Clock types (Part a2).**
The existing `type` parameter (`round`/`narrative`) controls tick timing — `clock_type` controls the clock's interaction model. Both parameters coexist: a clock may be `clock_type: "racing"` with `type: "round"`. *Acceptance criterion:* A `racing` clock pair with `opposes` resolves correctly; a `linked` clock chain triggers the child on parent completion; a `tug_of_war` clock retreated to zero does not trigger. _Check:_ T271.
**REQ-239a — Audit log compaction (Part a).**
`session (action: compress, sessions?)` tool (Game Master only) that archives audit entries older than a configurable session window into per-session metadata summaries. The session window is configured via `TTRPG_AUDIT_RETENTION_SESSIONS` — sessions are identified by `[session-boundary]` markers (REQ-237). For each archived session, the compaction produces a summary containing: `session_id`, `timespan_start`, `timespan_end`, `entry_count`, `confrontations` (derived per REQ-175), `significant_rolls` (per REQ-174), `condition_changes`, `roster_changes`, and `scene_transitions`.

**REQ-239b — Audit log compaction (Part b).**
Summaries live in the Novel JSON under an `audit_archive` key. The server removes raw audit entries for archived sessions from the `audit_log` array in the Novel JSON (REQ-040). The hash chain stays intact — the server re-anchors it at the first live entry after compaction, and entries after the compaction boundary form a new segment. The `session (action: recap)` tool (REQ-072) SHALL derive from live entries plus archive summaries when a `session_id` targets an archived session. Summarized sessions are retrievable via `audit://novel/archive` as structured objects.

**REQ-239c — Audit log compaction (Part c).**
Compaction is irreversible — confirmation proceeds through a `[NEED_INPUT]` workflow. Calling `session (action: compress)` with a `sessions` parameter (minimum 1) sets the number of recent sessions to retain as live; when omitted, the `TTRPG_AUDIT_RETENTION_SESSIONS` default is used. Sessions currently active (no `ended_at` marker) SHALL NOT be compacted.

**REQ-239d — Audit log compaction (Part d).**
Player badge attempts return `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* With `TTRPG_AUDIT_RETENTION_SESSIONS=1`, after two sessions, `session (action: compress)` archives session 1 — audit log shows only session 2 entries, `audit://novel/archive` returns session 1 summary, `session (action: recap, session_id="s1")` returns the summary, session 2 entries remain live. A third call to `session (action: compress, sessions=2)` retains both sessions 2 and 3. _Check:_ T277.
**REQ-241a — Checkpoints (Part a).**
The server SHALL provide checkpoint tools. `novel (action: checkpoint_set, label)` saves a named snapshot of the Novel state. The snapshot includes all §7.7 property groups, host base-capability state, NPC mind (REQ-075f), world-model tier, combat state, pending workflows, gm_context, metadata, audit log pointer, and undo stacks. The `novel (action: checkpoint_list)` returns checkpoint labels with ISO 8601 timestamps. The `novel (action: checkpoint_restore, label)` reverts the Novel to the checkpoint state — emits a `[NEED_INPUT]` workflow decision with options `yes` and `cancel` (on `yes`: restores the snapshot and records a `[checkpoint-restored]` audit entry; on `cancel`: restores pre-invocation state unchanged). The `novel (action: checkpoint_remove, label)` removes one checkpoint.

**REQ-241b — Checkpoints (Part b).**
Checkpoints survive server restarts, Novel switches, and undo/redo cycles — they operate independently of undo stacks (REQ-041). The maximum number of checkpoints per Novel comes from `TTRPG_MAX_CHECKPOINTS`; when at capacity, `novel (action: checkpoint_set)` discards the oldest. Checkpoints SHALL be stored in the Novel JSON under a `checkpoints` key (array of `{label, timestamp, state}` objects). `novel (action: end)` removes all checkpoints. The server does not include checkpoints in `novel (action: export)` output by default — an optional `include_checkpoints` parameter on `novel (action: export)` (configurable) controls inclusion.

**REQ-241c — Checkpoints (Part c).**
All checkpoint tools are Game Master only. `spec_health` SHALL report checkpoint count and storage size. The snapshot SHALL use the same compression setting as the Novel (REQ-092). *Acceptance criterion:* `novel (action: checkpoint_set, "before the ritual")` creates a checkpoint; `novel (action: checkpoint_list)` returns one entry with label and timestamp; after 5 mutations, `novel (action: checkpoint_restore, "before the ritual")` reverts all 5; `novel (action: end)` removes the checkpoint; `novel (action: export, "json", include_checkpoints= true)` includes the checkpoints key. _Check:_ T279.
**REQ-242a — Notes (Part a).**
The Novel SHALL carry a notes tier — key-value freeform text entries each carrying a `badge_scope` of `game_master`, `player`, or `shared`. WHEN no scope is provided, THE system SHALL default to `game_master`. The `note (action: set, key, content, badge_scope?)` tool creates or updates a note. The `note (action: remove, key)` tool removes a note when the caller's badge owns the scope or holds the Game Master badge. The `note (action: list)` tool returns note keys, content previews (first 100 characters), and badge_scope, badge-filtered. Notes are inert narrative context — they do not trigger lore matching, countdown hooks, or any mechanical effect.

**REQ-242b — Notes (Part b).**
Notes persist with the Novel, survive `synthesis (action: revert)`, and are removed by `novel (action: end)`. Notes SHALL be surfaced in `badge_briefing` under the `notes` section token — Game Master sees all scopes; Player sees `player` and `shared` scopes only. Notes SHALL be retrievable at `notes://<key>` as a badge-filtered resource. Notes SHALL be included in `novel (action: export)` output under the `notes` key (mapping keys to `{content, badge_scope}` objects), in `novel (action: clone)` (REQ-240) output, and in checkpoint snapshots (REQ-241).

**REQ-242c — Notes (Part c).**
This tier is the unstructured complement to REQ-232's structured `gm_context`. The `gm_context` object captures session-transition state with named fields. Notes capture raw ideas, secrets-in-progress, and session jottings that do not fit the `gm_context` schema.

**REQ-242d — Notes (Part d).**
IF the Player badge calls `note (action: set)` with scope `game_master`, `note (action: remove)` on a `game_master`-scoped note, or attempts to access `game_master`-scoped content, THEN THE system SHALL return `[FORBIDDEN]`. *Acceptance criterion:* `note (action: set, "betrayal", "The captain is the real villain")` stores the note with default `game_master` scope; `note (action: list)` under Game Master badge returns the note with scope `game_master`; `notes://betrayal` returns full content; the Player badge sees no `game_master`-scoped notes in `badge_briefing`; `note (action: set, "clue", "The key is in the clock", "player")` is visible to both Player and GM; after `novel (action: end)`, all notes are cleared. _Check:_ T280.
**REQ-285a — Server notes (Part a).**
THE server SHALL carry a server-level notes store — key-value freeform text entries that persist across Novels and survive server restarts. The `note (action: set_server, key, content)` tool creates or updates a server note. The `note (action: remove_server, key)` tool removes a server note. The `note (action: list_server)` tool returns all server note keys and a content preview (first 100 characters). Server notes are inert narrative context — they do not trigger any mechanical effect within Novels. Server notes persist to `.holonovel-state/server-notes.json` with atomic writes and backup rotation. Server notes survive `novel (action: end)`, `synthesis (action: revert)`, and server rebuilds.

**REQ-285b — Server notes (Part b).**
Server notes SHALL be surfaced in `spec_health` under a `server_notes` key (count). Server notes SHALL be retrievable at `server-notes://<key>` as a resource. Server notes SHALL NOT appear in `novel (action: export)`, `novel (action: clone)`, or checkpoint snapshots.

**REQ-285c — Server notes (Part c).**
WHEN the Player badge calls any server note tool, THE system SHALL return `[FORBIDDEN]`. *Acceptance criterion:* `note (action: set_server, "campaign-bible", "The old gods were banished to the outer dark")` stores the note; server restart preserves it; `novel (action: end)` preserves it; `server-notes://campaign-bible` returns full content; `note (action: list_server)` returns the note; Player badge returns `[FORBIDDEN]`; `spec_health` reports the server note count. _Check:_ T334.
**REQ-321a — Codex (Part a).**
THE server SHALL carry a server-level codex — a typed content library for reusable content (NPCs, characters, scenes, encounters, lore entries, factions, countdowns, rooms, things, equipment templates, spell templates, relationship templates, voice profiles, adventures) that persists outside Novels and survives server restarts. The codex operates at the server level — it has no inherent badge context. The codex SHALL support content kinds: `npc`, `character`, `scene`, `encounter` and `lore_entry`, `faction`, `countdown`, `room` and `thing`, `equipment_template`, `spell_template`, `relationship_template` and `voice_profile`, `adventure`.

**REQ-321b — Codex (Part b).**
Every codex entry SHALL carry a `visibility` field — `library` (default, for world-building content) or `shared` (visible to both badges). The `codex (action: set, kind, name, data, description?, tags?, visibility?)` tool SHALL create or update a codex entry with upsert semantics. The `data` parameter carries a kind-specific payload whose shape mirrors the corresponding Novel or roster tool parameters. The `codex (action: import, id)` tool — where `id` is a string or an array of strings — SHALL materialize one or more codex entries into the active Novel.

**REQ-321c — Codex (Part c).**
An array SHALL be processed atomically: all entries apply as a single undo snapshot. Partial failure reports the failed entry with its array index and cause. The operation SHALL NOT produce side effects on novel state.

**REQ-321d — Codex (Part d).**
Materialization delegates to the entry's tool. The `npc` kind maps to `npc (action: create)`; `character` to `character (action: import)`; `scene` to `scene (action: set)`; `encounter` to `combat (action: init)`. The `lore_entry` kind maps to `lore (action: set)`; `faction` to `faction (action: create)`; `countdown` to `countdown (action: set)`; `room` to `world (action: create_room)`; `thing` to `world (action: create_thing)`. The `equipment_template` kind materializes equipment into the entity's inventory. The `spell_template` kind materializes a spell into the entity's known spells. The `relationship_template` kind applies the relationship via `relationship (action: set)`. The `voice_profile` kind applies via `character (action: voice)` and `character (action: personality)`.

**REQ-321e — Codex (Part e).**
For kind `adventure`, `codex (action: import)` SHALL materialize the adventure scaffold into the active Novel. The import populates the world-model tier from the stored `## World` section data (rooms, things, and exits per REQ-079). The import creates NPCs from extracted NPC data, sets factions from extracted faction data, creates lore entries from extracted location descriptions, and activates synthesis linkages per REQ-229.

**REQ-321f — Codex (Part f).**
The adventure data payload holds `title`, `slug`, `premise`, `overview`, and `hook` as strings. The `source` field holds one of `generated`, `loaded:<adventure_slug>`, or `captured:<novel_slug>`. The `locations` field holds an array of `{heading, flavor_text}`. The `npc_suggestions` field holds an array of `{name, description}`. The `encounter_seeds` field holds an array of free-text entries. The `genre_tags` field holds an array of strings. The `sections` field holds the full parsed adventure sections per REQ-079: `## World`, `## Premise`, `## Factions`, and `## Scenes`, plus `## NPCs`, `## Lore`, and `## Seeds`. The `codex (action: capture, kind, source_id)` tool SHALL pull an existing Novel artifact into the codex — the captured entry carries a `source_novel` field tracing origin.

**REQ-321g — Codex (Part g).**
The captured entry SHALL default its `ruleset` field to the source Novel's ruleset scope (REQ-387). The `codex (action: capture, "adventure")` tool SHALL pull the active Novel's adventure content (loaded or generated) into the Codex as kind `adventure` with `source: captured:<novel_slug>`, carrying the full adventure data payload defined above. When the active Novel has no adventure content, `codex (action: capture, "adventure")` SHALL return `[STATE_CONFLICT]` with corrective action `"No adventure content in the active Novel. Load an adventure via adventure (action: load) or generate one via adventure (action: generate)."`

**REQ-321h — Codex (Part h).**
WHEN the caller invokes `codex (action: capture)` with an `update_source` flag set to `true`, and the captured artifact originated from a prior `codex (action: import)`, THE system SHALL update the source Codex entry in-place rather than creating a separate entry. REQ-332 defines the provenance field that detects the prior import.

**REQ-321i — Codex (Part i).**
When `update_source` is `true` but the artifact has no Codex provenance, the system SHALL return `[ERROR] [STATE_CONFLICT]` with corrective action directing the caller to omit `update_source`. The `codex (action: list, kind?, tag?)` tool SHALL return a filterable list of codex entries with id, kind, name, description, tags, and visibility. The `codex (action: list)` tool SHALL be badge-filtered: when a badge is active, the Player badge sees only `shared`-visibility entries, and the Game Master badge sees all entries.

**REQ-321j — Codex (Part j).**
Under the Editor badge, `codex (action: list)` returns all entries unfiltered. The `codex (action: get, id)` tool SHALL return the full record including the kind-specific data payload, badge-filtered by visibility. The `codex (action: delete, id)` tool SHALL remove an entry with no confirmation gate — `undo` SHALL restore a deleted entry within the same connection.

**REQ-321k — Codex (Part k).**
Mutating codex operations (`codex (action: set)`, `codex (action: capture)`, `codex (action: delete)`) SHALL require the Editor badge or Game Master badge; the Player badge SHALL return `[FORBIDDEN]`. `codex (action: import)` SHALL be badge-scoped. The Player badge MAY import `shared`-visibility entries of kind `character`. The Game Master badge may import any entry regardless of visibility. Player badge import of any other kind SHALL return `[FORBIDDEN]`. Codex entries persist to `.holonovel-state/codex.json` with atomic writes and backup rotation. The codex SHALL survive `novel (action: end)`, `synthesis (action: revert)`, and server rebuilds.

**REQ-321l — Codex (Part l).**
Codex entries SHALL be surfaced in `spec_health` under a `codex` key (count partitioned by kind). The codex SHALL be retrievable at `codex://<id>` as a resource, badge-filtered by visibility. Codex entries SHALL NOT appear in `novel (action: export)`, `novel (action: clone)`, or checkpoint snapshots.

**REQ-321m1 — Codex (Part m1).**
Codex entries SHALL carry no mechanical effect within a Novel until explicitly imported via `codex (action: import)`. `codex (action: import)` and `codex (action: capture)` SHALL return `[STATE_CONFLICT]` when no Novel is active.

**REQ-321m2 — Codex (Part m2).**
*Acceptance criterion:* `codex (action: set, "npc", "Blacksmith", {description: "Gruff, scarred", ac: 14, hp: 35}, "The village blacksmith", ["blacksmith", "village"])` stores the entry with default visibility `library`; `codex (action: set, "npc", "Blacksmith", ..., visibility="shared")` stores with `shared` visibility; server restart preserves entries; `novel (action: end)` preserves them; `codex://blacksmith` returns full content; `codex (action: list, "npc")` under Player badge returns only `shared` entries; `codex (action: list, "npc")` under Game Master badge returns all entries; `codex (action: list, "npc")` with the Editor badge returns all entries; Player badge `codex (action: set, ...)` returns `[FORBIDDEN]`.

**REQ-321m3 — Codex (Part m3).**
*Acceptance criterion:* Game Master badge `codex (action: import, "blacksmith")` into an active Novel creates the NPC; Player badge `codex (action: import, "fighter-01")` of a `shared`-visibility `character` entry imports the character; Player badge `codex (action: import, "blacksmith")` returns `[FORBIDDEN]`; `codex (action: import, "my-adventure")` with kind `adventure` into an active Novel populates world-model, NPCs, factions, lore, and activates synthesis linkages; `codex (action: import, ["blacksmith", "innkeeper", "guild-faction"])` imports three entries atomically; `codex (action: import, ["blacksmith", "nonexistent"])` reports `nonexistent` at index 1 as `[NOT_FOUND]` and imports nothing.

**REQ-321m4 — Codex (Part m4).**
*Acceptance criterion:* `codex (action: capture, "adventure")` from an active Novel with adventure content stores it in Codex with `source: captured:<slug>`; without adventure content returns `[STATE_CONFLICT]`; `codex (action: capture, "npc", "blacksmith", update_source=true)` on a codex-sourced NPC updates the Codex entry in-place; `codex (action: capture, "npc", "handcrafted-npc", update_source=true)` on an NPC with no codex_source returns `[STATE_CONFLICT]`; `spec_health` reports codex counts by kind. _Check:_ T366, T382, T383.
**REQ-332a — Codex provenance (Part a).**
WHEN `codex (action: import)` creates a Novel artifact (NPC, room, thing, lore entry, faction, countdown), THE artifact SHALL carry a `codex_source` field. The field records the Codex entry ID, the import timestamp, and the Codex entry's `modified_at` value at the time of import. `codex (action: import)` of an entry whose `codex_source` already references that Codex entry SHALL update the existing artifact in-place rather than creating a duplicate. Fields present in the Codex entry SHALL overwrite corresponding Novel artifact fields. Fields set only in the Novel (runtime state like HP, conditions, disposition) SHALL be preserved. `novel (action: info)` SHALL report `codex_sources` — an array of `{id, kind, imported_at, codex_modified_at}` for every Codex-sourced artifact in the Novel.

**REQ-332b — Codex provenance (Part b).**
WHEN a Codex entry's `modified_at` timestamp is newer than the import timestamp recorded in the Novel artifact's `codex_source`, THE `spec_health` tool SHALL flag the artifact as `[codex-stale]` — the Codex template changed since import. The `novel (action: clone)` tool and checkpoint snapshots SHALL preserve `codex_source` fields on copied artifacts. *Acceptance criterion:* `codex (action: import, "blacksmith")` creates NPC "Blacksmith" with `codex_source: {id: "blacksmith", imported_at: <ISO>, codex_modified_at: <ISO>}`.

**REQ-332c — Codex provenance (Part c).**
Updating the blacksmith Codex entry via `codex (action: set)`, then calling `codex (action: import, "blacksmith")` again updates the existing NPC (same entity ID) rather than creating a new one. `novel (action: info)` reports `codex_sources` including the blacksmith entry. After updating the Codex entry, `spec_health` reports `[codex-stale]` for the Novel's blacksmith NPC. _Check:_ T380, T384.

### 5.7 Determinism, Safety, and Performance

**REQ-050a — Determinism (Part a).**
All random draws come from a single deterministic PRNG, seedable via `TTRPG_SEED`. Any tool that performs a random draw — dice-roll tools, `combat (action: init)` (danger initiative), `character (action: create)` (stat generation), and any ruleset-derived tool that includes dice resolution — accepts an optional per-call seed. Same seed + same call sequence = same results across sessions and games. Seed conflict (a tool-call seed when a session seed is active) is a `[WARNING]` and the per-call seed wins for that draw.

**REQ-050b — Determinism (Part b).**
During a per-call seed override, the override uses an isolated draw that does not advance the session PRNG position — after the override completes, the next session-seeded draw produces the same result it would have produced had the override never occurred. The session seed persists across draws unless explicitly reseeded. When `TTRPG_SEED` is not set, the PRNG shall use a fixed default seed (0). The server logs the active seed at startup — `[info] PRNG seed: <value> (source: env|default)` — so operators can verify determinism.

**REQ-050c — Determinism (Part c).**
The acceptance criterion below — that `roll_save("dexterity", seed="42")` produces the same d20 face on two separate server restarts — extends to the unset case. Two restarts without `TTRPG_SEED` shall produce identical event sequences for identical tool-call sequences. *Acceptance criterion:* `roll_save("dexterity", seed="42")` produces the same d20 face on two separate server restarts; a per-call seed does not advance the session PRNG position. _Check:_ G2, T27, T111.
**REQ-273a — Independent verification reproducibility tolerance (Part a).**
When the independent verifier (§10) compares its results to the builder's, seed-pinned dice rolls, status prefixes (`[OK]`, `[ERROR]`, `[WARNING]`, `[NEED_INPUT]`), exit codes, and tool names with parameter values SHALL match exactly. Natural-language prose (scene descriptions, NPC dialogue, lore content) is non-adversarial — a match is structural (non-empty and within ±20% word count). Counts (entity count, lore entry count, audit entry count) SHALL match within zero tolerance for exact-count fields and ±1 for open-ended fields. A comparison that satisfies all applicable tolerance rules is a match.

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
When a generation table defines a dice-range-to-result mapping, `ruleset (action: roll)` SHALL roll the specified dice expression, match the result against the defined ranges, and return the matched result row. The output SHALL include: (a) the dice notation (e.g., `d100`), (b) the individual die face rolled, and (c) the matched range with its result text. When a roll falls outside all defined ranges, the tool SHALL return `[WARNING]` with the raw roll and a "no range matched" message — the tool SHALL NOT silently return a bare number.

**REQ-213b — Weighted table result mapping (Part b).**
A generation table entry defines: `dice_expression` (e.g., `1d100`, `1d8`), a list of `ranges` (each with `min`, `max`, `result`), and an optional `badge_scope` (`game_master` or `shared`, default `shared`).

**REQ-213c — Weighted table result mapping (Part c).**
A generation table SHALL NOT interleave dice-range rows with static lookup rows. At extraction, the builder classifies each table as either generation or lookup; any table containing a dice-range row is a generation table. *Acceptance criterion:* `ruleset (action: roll, table="wand_of_wonder", seed="42")` produces the same result row on two separate server restarts, with output including dice notation, individual die face, matched range, and result text. _Check:_ T254.
**REQ-291a — Oracle tool (Part a).**
The server provides an `scene (action: oracle)` tool (accepting a free-text `question` and an optional per-call `seed`) for uncertainty resolution. The tool accepts a `likelihood` value — `almost_certain` (d100 ≥ 11), `likely` (d100 ≥ 26), `50_50` (d100 ≥ 51), `unlikely` (d100 ≥ 76), or `small_chance` (d100 ≥ 91) — the Ask-the-Oracle ladder, defaulting to `50_50` when omitted. The tool draws from the PRNG (REQ-050) and returns one of `[YES]`, `[NO]`, `[EXCEPTIONAL_YES]`, or `[EXCEPTIONAL_NO]`. Doubles on the d100 (11, 22, 33, ..., 99) produce an exceptional result — an `EXCEPTIONAL_YES` or `EXCEPTIONAL_NO` — which signals a stronger, more intense version of the answer. The `question` parameter is recorded in the audit log; the draw is deterministic and seedable.

**REQ-291b — Oracle tool (Part b).**
The server positions the oracle as an uncertainty-resolution aid for both badges. The oracle resolves an outcome when the caller cannot determine what happens next, and it SHALL NOT replace the AI narrator's judgment. The Player badge SHALL be permitted to call `scene (action: oracle)`. In solo play, the human Player consults the oracle directly, and the AI Game Master remains the interpreter of the result.

**REQ-291c — Oracle tool (Part c).**
The oracle has no briefing presence; the tool is callable on demand only and fades into the background per §5.10. The `help` tool SHALL return usage examples, parameter contracts, and common workflows for the oracle. The `command (action: suggest, "I don't know what's behind the door")` call SHALL map to `scene (action: oracle)`. *Acceptance criterion:* `scene (action: oracle, "Is there a guard behind the door?", "50_50", seed="42")` returns `[YES]`, `[NO]`, `[EXCEPTIONAL_YES]`, or `[EXCEPTIONAL_NO]`. Same seed + same call sequence produces the same result across restarts. Likelihood "almost_certain" returns `[YES]` or `[EXCEPTIONAL_YES]` on most draws; omitted likelihood defaults to `50_50`.

**REQ-291d — Oracle tool (Part d).**
The oracle is callable by Player and Game Master badges; no badge SHALL be blocked from consulting it. *Acceptance criterion:* `scene (action: oracle)` succeeds under the Player badge and under the Game Master badge. _Check:_ T481.
**REQ-157a — Combat determinism (Part a).**
Combat initiative for dangers comes from the same PRNG as all other random draws (REQ-050). `combat (action: init)` accepts an optional per-call seed. When the caller provides a per-call seed, every danger initiative roll within that combat session uses an isolated draw that does not advance the session PRNG position. After the override completes, the next session-seeded draw matches the sequence that would have appeared without the override.

**REQ-157b — Combat determinism (Part b).**
When the caller provides no per-call seed, danger initiative draws advance the session PRNG position normally. *Acceptance criterion:* `combat (action: init, participants=[], dangers=[{name:"goblin"}], seed="42")` produces the same danger initiative value on two separate server restarts; the d20 face matches the Appendix B.4 seed-42 column at the appropriate offset. _Check:_ T192.
**REQ-051 — No runtime network access.** The server makes no outbound network requests
after startup. All ruleset content, prompts, and tool implementations run entirely
locally.
*Acceptance criterion:* Disconnecting the network before a lookup tool call
produces the same result as when connected — zero outbound requests appear
in network monitoring.
_Check:_ Appendix D; G4.

**REQ-433a — Event notification surface (Part a).**
The server SHALL provide `session (action: subscribe, topics[])` — Game Master only, session-scoped, dropped on connection close — accepting `audit_delta`, `countdown_fire`, `lore_trigger`, and `scene_transition` topics. Subscribing SHALL NOT create multi-connection badge synchronization (REQ-030 unchanged). Notifications SHALL be read-only echoes of already-recorded audit events — they carry no new state, and their absence SHALL NOT alter tool results.

**REQ-433b — Event notification surface (Part b).**
A subscribed connection SHALL receive a server-to-client notification for each recorded event matching a subscribed topic, payload structured per the audit entry (REQ-040). A Player-badge connection SHALL receive no notification carrying GM-only content. A connection subscribing to nothing receives no notifications. Subscriptions SHALL NOT persist across restart.
*Acceptance criterion:* after subscribing to `countdown_fire`, advancing a countdown to fire produces a notification echoing the audit entry; a Player-badge connection subscribed to `audit_delta` receives only Player-visible entries; restart clears subscriptions. _Check:_ T519.

**REQ-052 — Path containment.** The server reads files only from the configured ruleset
directory, its own installation directory, and the state directory. The server rejects
path-traversal and malformed input.
*Acceptance criterion:* A tool call with `../../etc/passwd` as a path parameter
returns `[ERROR] [INVALID_INPUT]` without reading any file outside the configured
directories.
_Check:_ T20.

**REQ-251a — Generation intent guard (Part a).**
Before producing generation output, `adventure (action: generate)` and `adventure (action: generate_encounter)` SHALL assess the premise or context string. The assessment checks for direct and implied harm, for power-inversion requests ("create an adversary capable of defeating <specific entity>"), and for content that exceeds the ruleset's mechanical ceiling. Any request whose resolution would require the server to fabricate mechanics, void the ruleset's stated constraints, or generate content likely to violate participant consent SHALL return `[WARNING]`. The warning describes the concern and requests clarification or modification — the server SHALL NOT silently comply.

**REQ-251b — Generation intent guard (Part b).**
The assessment SHALL operate on the input string without generating output first — compliance is checked before resources are consumed. The operator MAY override the guard by prefixing the premise with `!force` — the override SHALL be recorded in the audit log with a `[generation-guard-overridden]` entry. A GM-only advisory SHALL appear in `badge_briefing` when a generation guard fired in the current session, listing the premise and the concern.

**REQ-251c — Generation intent guard (Part c).**
When the ruleset defines a difficulty system (challenge rating, threat levels), `adventure (action: generate_encounter)` SHALL cap generated danger power against the party's existing entity levels. Exceeding the cap produces `[WARNING]` with the cap value. *Acceptance criterion:* `adventure (action: generate, "create an adversary capable of defeating Data")` returns `[WARNING]` listing the guard concern; `adventure (action: generate, "!force create an adversary capable of defeating Data")` proceeds with the generation and records a `[generation-guard-overridden]` audit entry.

**REQ-251d — Generation intent guard (Part d).**
A ruleset that defines challenge rating caps generated encounters against party level and warns on exceedance. _Check:_ T311.
**REQ-100a — Performance benchmark (Part a).**
The builder measures and records cold-start time and representative query latency for the target ruleset. Measurements are recorded in DECISIONS.md (4) with the measurement environment (OS, CPU, memory, runtime version). Cold-start timing: launch server, call `session (action: health)`, measure wall-clock time from process start to response. Query latency is the mean of 5 representative lookups. `spec_health` reports the most recent measurement.

**REQ-100b — Performance benchmark (Part b).**
Tiers: Light (<100 indexed items) ≤2 s cold start; Standard (100–500) ≤5 s; Heavy (500–2000) ≤10 s; Huge (2000+) ≤20 s. *Acceptance criterion:* DECISIONS.md (4) records cold-start time and mean query latency for 5 representative lookups; `spec_health` reports the most recent measurement. _Check:_ T87. The five representative lookups are one canonical call per lookup category registered on the server: `lookup_spell`, `lookup_equipment`, `lookup_monster`, `lookup_class`, and `ruleset (action: search)`.

**REQ-100c — Performance benchmark (Part c).**
If fewer than five lookup categories exist, the builder measures all available categories and notes the count in DECISIONS.md (4). The indexed-item count used for tier classification is the value reported by `spec_health.search_index` (the heading count in the loaded search index).

**REQ-100d — Performance benchmark (Part d).**
For servers where `spec_health` reports no `search_index` field, the builder counts extracted items in RULESET_MODEL.md and records the count and method in DECISIONS.md (4). *Acceptance criterion:* The five lookup calls are one per registered lookup category; DECISIONS.md (4) records which categories the builder measured and their individual latencies. _Check:_ T87.

**REQ-410 — Token footprint in performance record.**
The performance record of REQ-100 SHALL additionally capture the token footprint. The footprint is the aggregate byte size of the default tool listing (REQ-392) plus the prompt-budget consumption (REQ-118) under the measured tier. The record makes token efficiency a recorded, gated attribute rather than an aspiration. Measurements SHALL sit in DECISIONS.md (4) beside cold-start and latency figures and be reported by `spec_health` as the most recent measurement; a missing footprint record is a handoff defect.
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
SHALL accept calls once its state finishes initializing, with any slow probe completing in the
background. A probe that has not finished SHALL be reported as pending in `spec_health`,
distinct from a completed result, and a background probe SHALL NOT block or reorder tool
calls.
*Acceptance criterion:* a server with a slow probe is callable before the probe
completes; `spec_health` reports the probe pending then completed; tool calls proceed
normally during the probe. _Check:_ T490.
**REQ-253a — Tool-output verbosity control (Part a).**
Every lookup and resolution tool SHALL support a `terse` mode that returns the minimum mechanical content needed to resolve the rules question — no narrative framing, no extended context, no auxiliary information. For `lookup_spell`, terse mode SHALL return the spell name, level, casting time, range, duration, and damage/effect die, omitting verbal/somatic/material components and the full spell description. For `ruleset (action: search)`, terse mode SHALL return the most relevant sentence or paragraph only, omitting surrounding context. For combat advance, terse mode SHALL return the participant name, the action taken (or `[auto]`), and the resulting state changes, omitting full roll transparency.

**REQ-253b — Tool-output verbosity control (Part b).**
The default mode is `normal` (balanced per REQ-197c): full entry content for lookups and single-entry reads (REQ-060), full roll transparency in combat (REQ-003), and summary entries for enumerations (REQ-409). The `terse` mode is selectable via the `detail=terse` player signal (REQ-197), which applies to all subsequent tool output, or via a per-call `terse: true` parameter on individual tool invocations. The `rich` mode is selectable via the `detail=rich` signal. The per-call parameter overrides the session-scoped signal for that call. `spec_health` SHALL report the active verbosity mode.

**REQ-253c — Tool-output verbosity control (Part c).**
The mode is session-scoped — discarded on connection close. *Acceptance criterion:* `lookup_spell("fireball", terse=true)` returns the spell name, level, and damage die without the full spell description. `ruleset (action: search, "grapple", terse=true)` returns the most relevant sentence only. `combat (action: advance)` under `detail=terse` returns participant name + `[auto]` + resulting HP/condition changes without full roll breakdown. _Check:_ T313.

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
*Acceptance criterion:* `scene (action: set, "'); DROP TABLE novels;--")` stores
and echoes the string verbatim; no SQL execution, no behavior change, no crash.
_Check:_ T20, T42.

**REQ-055 — Durability.** Novel state survives connection restarts: entities,
HP, conditions, slots, turn order, audit logs, and RNG state persist. The roster
is permanent and immutable at baseline. `character (action: import)` copies a roster entry
into a Novel. `novel (action: end)` discards the Novel; the roster survives. Resuming an
ended Novel fails with `[ERROR] [STATE_CONFLICT]`.
*Acceptance criterion:* Server restart restores entities, HP, conditions, and
RNG state; `novel (action: resume, "ended-novel")` returns `[STATE_CONFLICT]`.
_Check:_ T9, T31, T108.

**REQ-055a — Badge precedence on resume.** WHEN the operator resumes or switches to a Novel, the Novel's persisted badge state takes precedence over `TTRPG_BADGE`. The `TTRPG_BADGE` variable
sets the initial active badge ONLY WHEN the starting Novel has no
persisted badge state — either because the Novel is new, or because no
badge became active during a prior session.
*Acceptance criterion:* Create Novel with Player badge, end connection, resume —
badge is Player, not `TTRPG_BADGE` value.
_Check:_ T108.

**REQ-055b — Story-in-progress notice.** WHEN `novel (action: resume)` restores a Novel
with an active badge, THE server SHALL include a notice identifying the active
badge so the operator knows they have resumed an active story rather than entered
the Editor badge.
*Acceptance criterion:* Resume a Novel with Player badge active — the server
responds with a notice identifying "Player badge active."
_Check:_ T108.
*Out of scope:* hardware-level RNG, cryptographic security guarantees, formal
verification of input safety, and performance under adversarial load beyond the tier
benchmarks defined in REQ-100.

**REQ-312d1 — Pre-narration validation gate (Part d1).**
WHEN the AI narrator proposes narration implying a mechanical outcome, THE engine SHALL validate the proposal against ruleset constraints per REQ-312a/312b/312c before the narration reaches the player. Invalid proposals SHALL produce a `[REJECTED]` corrective suggestion behind the server interface. The setting `TTRPG_NARRATION_VALIDATION` controls the gate; `spec_health` SHALL report `narration_validation` status and `narration_rejection_count`.

**REQ-312d2 — Pre-narration validation gate (Part d2).**
Validation activates only when AI narration precedes a state-mutating tool call. *Acceptance criterion:* With `TTRPG_NARRATION_VALIDATION=on`, narration claiming a dead NPC speaks is rejected with a corrective suggestion and increments `narration_rejection_count`. With `TTRPG_NARRATION_VALIDATION=off`, same narration passes through. _Check:_ T357.
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

**REQ-444 — Import-channel inertness.** Imported content — Novel JSON, codex entries, lore imports, and ruleset package content — SHALL be treated as untrusted data. Embedded directives in imported content (instruction-framing text, HTML comments, tool-shaped commands) SHALL stay verbatim, inert, and logged as findings. They SHALL never execute or take effect. The capability surface, badge gating, and tool registry SHALL NOT change after import. *Acceptance criterion:* importing a Novel whose scene description contains "ignore all previous instructions" stores and echoes it verbatim with no behavior change, no new tools, and a logged finding. _Check:_ T530.

**REQ-445 — Error-value disclosure control.** Error responses SHALL NOT reveal the existence or content of badge-invisible surfaces. Validation hints and "did you mean" suggestions SHALL enumerate only values visible to the caller's active badge. A Player-badge caller receiving `[FORBIDDEN]`, `[NOT_FOUND]`, or `[AMBIGUOUS]` SHALL get no hint naming a GM-only tool, resource, lore key, or secret. *Acceptance criterion:* a Player-badge call for a GM-only lore key returns an error that does not echo the key's existence, while the same call under the Game Master badge returns the key-specific corrective action. _Check:_ T531.

**REQ-446 — Ruleset package provenance.** `ruleset (action: install)` SHALL verify the package-format fingerprint (REQ-420) and content hash (REQ-389b) before activation. Install SHALL record a provenance audit entry naming the slug, content hash, and source. When an operator supplies a verification key via configuration, install SHALL verify a signature over the package manifest and refuse a package whose signature does not verify, naming the failure. *Acceptance criterion:* a tampered package with a mismatched hash is refused by slug; a package installed with a configured key records provenance and verifies the signature; a signature failure names the failure. _Check:_ T532.

**REQ-447 — Audit-log growth cap.** The audit log SHALL honor a configurable maximum entry count. When appending an entry would exceed the configured maximum, the server SHALL refuse with `[ERROR] [STATE_CONFLICT]` naming the cap and the corrective action. `spec_health` SHALL report `audit_at_capacity`. *Acceptance criterion:* with a small configured cap, a mutating call that would exceed it is refused with the cap named; `spec_health` reports `audit_at_capacity`; raising the cap re-enables appends. _Check:_ T533.

**REQ-448 — Security-event audit completeness.** Security-relevant events SHALL be recorded in the append-only chained audit log. The events are: badge switches, Novel import or export, codex or lore import, ruleset package install or remove, boundary violations (REQ-133), generation-guard overrides (REQ-251), cap refusals (REQ-447). Each entry SHALL carry the badge, the tool name, and a security-event tag. *Acceptance criterion:* a session that switches badges, imports a Novel, installs a package, and trips a boundary violation yields one tagged audit entry per event in append order with chained hashes intact. _Check:_ T534.

**REQ-449 — Excessive-agency mutation ceiling.** A configurable per-turn mutation ceiling SHALL bound AI-initiated state mutations when `scene (action: autonomy)` sits at `level=full` with `confirmation=auto`. Exceeding the ceiling within one turn SHALL surface a `[NEED_INPUT]` decision naming the accumulated mutations rather than auto-continuing. The refusal SHALL be recorded in the audit log. *Acceptance criterion:* with a ceiling of three, four consecutive auto-executed mutations in one turn surface a `[NEED_INPUT]` listing the three applied mutations and the pending one; a human-originated call never counts against the ceiling. _Check:_ T535.

### 5.8 Synthesis, Lore, and Macros

**REQ-246b1 — Story journal (Part b1).**
The server provides story journal tools — Game Master only. The `story (action: record, type, entry)` tool records a narrative memory. The `story (action: update, index, entry?, type?)` tool edits by index. The `story (action: remove, index)` tool deletes. The `story (action: list, filter?, offset?, limit?)` tool returns paginated entries. `type` SHALL be one of `decision`, `moment`, `revelation`, `bond`, or `consequence`. Entries SHALL record scene anchor, entity IDs, and timestamp. Editing `decision` or `consequence` entries SHALL return `[RULE_VIOLATION]`. Entries are Novel-scoped, discarded by `novel (action: end)`. Undo SHALL NOT reverse story journal entries.

**REQ-246b2 — Story journal (Part b2).**
`TTRPG_MAX_STORY_ENTRIES` bounds growth. *Acceptance criterion:* Record, list, update, and remove operations work as described; editing a decision returns `[RULE_VIOLATION]`; undo does not reverse entries; Player badge returns `[FORBIDDEN]`. _Check:_ T282.
**REQ-246a — Story journal surfacing.** Story journal entries SHALL surface
in `session (action: recap)` (paginated), `badge_briefing` (badge-filtered by entity
overlap and scene match, configurable via `TTRPG_STORY_JOURNAL_DISPLAY`),
`novel (action: export)` output, and `novel (action: clone)` as a copied array. `spec_health`
SHALL report `story_journal_count_by_type` and warn at 80% of
`TTRPG_MAX_STORY_ENTRIES`.
*Acceptance criterion:* Entries appear in all four surfaces; `spec_health`
reports per-type counts.
_Check:_ T282.

**REQ-331a — Story journal-world coupling (Part a).**
Story journal entries SHALL accept an optional `room_id` field. When `story (action: record)` is called during a scene that is coupled to a world-model room (REQ-326), `room_id` SHALL auto-populate with the room's ID. Entries with `room_id` SHALL annotate their `scene_anchor` with the room's name — surfaced in `story (action: list)` and `novel (action: export)` output. `session (action: recap)` `narrative_orientation` SHALL include room names for entries that carry them. `badge_briefing` `story` section entries SHALL include room context when available. The `room_id` field is optional — entries in non-room-coupled scenes or scenes with unmatched locations SHALL carry no `room_id`.

**REQ-331b — Story journal-world coupling (Part b).**
Backward compatible: existing story journal entries without `room_id` are valid. *Acceptance criterion:* `story (action: record, "moment", "Discovered the hidden passage")` with scene coupled to world-model room "Library" — entry auto-populates `room_id: "library"` and `scene_anchor` includes "Library". Same call with unmatched location — `room_id` absent. _Check:_ T375, T378.
**REQ-333a — Story journal to lore promotion (Part a).**
`story (action: promote, index, key?)` tool — Game Master only. Accepts a story journal entry index of type `revelation` or `moment` and creates a lore entry whose key SHALL be either the explicit `key` parameter (when provided) or a slug derived from the first sentence of the journal entry. The lore entry's content SHALL be the journal entry text; its triggers SHALL be derived from entity and location names mentioned in the entry. The journal entry is unchanged — promotion is non-destructive.

**REQ-333b — Story journal to lore promotion (Part b).**
Promoting a `decision` or `consequence` type entry SHALL return `[ERROR] [RULE_VIOLATION]` — decisions and consequences are immutable. When a lore entry already exists at the target key, the system SHALL return `[STATE_CONFLICT]` with corrective action suggesting a `key` parameter to disambiguate. The created lore entry carries a `source` field citing the story journal index as `story_journal:<index>`.

**REQ-333c — Story journal to lore promotion (Part c).**
Player badge returns `[FORBIDDEN]`. *Acceptance criterion:* `story (action: record, "revelation", "The old well leads to the undercity")` then `codex (action: list))` creates lore entry `the-old-well-leads-to-the-undercity` with `source: story_journal:0`. `codex (action: list), key="well-undercity-link")` uses the explicit key (succeeds only if that key is not already taken). Promoting a `decision` entry returns `[RULE_VIOLATION]`. Player badge returns `[FORBIDDEN]`. _Check:_ T380.
**REQ-310a — Campaign Memory (Part a).**
THE server SHALL maintain an engine-recorded campaign memory — a per-entity fact store derived automatically from state-changing tool calls, surviving process restart and full rebuild. Facts are recorded by the engine, not the AI, and SHALL be stored in the Novel JSON per REQ-092. The campaign memory tracks per-NPC facts (combat participation, scene presence, relationship changes, personality updates), per-thread facts (faction clock advances, narrative countdowns, orphaned decisions, active vows), and per-location facts (notable events and NPC presence at locations).

**REQ-310b — Campaign Memory (Part b).**
WHEN `badge_briefing` composes GM-oriented content, THE engine SHALL inject campaign memory facts under a `## Campaign Memory` section. The Campaign Memory section is a decision-critical group (REQ-109) ordered after scene state and before entities. Facts SHALL be prioritized by relevance to the current scene: (a) NPCs present in the scene, (b) NPCs with relationships to present entities, (c) active thread facts involving present entities, (d) location facts for the current scene, (e) recency (most recent first). The section SHALL render at most `TTRPG_CAMPAIGN_MEMORY_MAX_FACTS` facts (default 10), ordered by priority.

**REQ-310c — Campaign Memory (Part c).**
Campaign memory facts SHALL NOT introduce new mutating tools — they are a surfacing layer over existing state. `spec_health` SHALL report `campaign_memory` with per-category counts (`npcs`, `threads`, `locations`) and a total. `novel (action: export)` SHALL include `campaign_memory` in its payload. Campaign memory facts rendered in `badge_briefing` under the Player badge SHALL be presence-scoped: a fact is visible to the Player badge only when the active entity was present in the scene where the fact was recorded as determined by `characters_present` (REQ-307). The Game Master badge sees all facts (current behavior).

**REQ-310d — Campaign Memory (Part d).**
The server retains facts from scenes the entity attended regardless of current presence — presence scoping gates visibility, not storage. Every campaign memory fact SHALL carry a `badge_scope` field — `gm` (default, for GM-authored or engine-derived facts that remain GM-visible only), `shared` (visible to both badges when presence-scoped), or `discovered` (visible to both badges, tagged as player-discovered).

**REQ-310e — Campaign Memory (Part e).**
Under the Player badge, campaign memory visibility compounds two filters: a fact is visible only when (a) the active entity attended the scene where the server recorded the fact (presence scoping), AND (b) the fact's `badge_scope` is `shared` or `discovered`. The Game Master badge sees all facts regardless of `badge_scope`.

**REQ-310f — Campaign Memory (Part f).**
Facts created by the engine default to `gm`; the GM may override scope via `lore (action: set)` (REQ-083) for facts that also correspond to lore entries. `discovered`-scope facts carry a `[discovered]` tag in `badge_briefing` distinct from the standard rendering. *Acceptance criterion:* After a session with two NPCs (each appearing in a scene and combat), three scene changes, one faction clock advancement, and one story journal decision, `spec_health` reports `campaign_memory.npcs ≥ 2`, `campaign_memory.threads ≥ 1`, `campaign_memory.locations ≥ 1`. `badge_briefing` includes `## Campaign Memory` with facts prioritized by scene relevance.

**REQ-310g — Campaign Memory (Part g).**
Facts survive Novel persistence and appear in `novel (action: export, "json")`. _Check:_ T355.
**REQ-080a — Synthesis boundaries (Part a).**
Synthesis consists of three source categories with a unified storage model, separate from Ruleset Wisdom. External synthesis (optionally run post-build per §11.1) stores items in full within the Novel JSON under a `synthesis` key, tagged `[supplementary]` with source URLs. Internal synthesis (generated at runtime per §11.2) stores items in the same `synthesis` key, tagged `[supplementary]` with `novel://` source URIs.

**REQ-080b — Synthesis boundaries (Part b).**
Player-authored synthesis (created at runtime via `synthesis (action: player_add)` per REQ-261) stores items in full within the Novel JSON under a `player_synthesis` key, tagged `[player]`, active immediately in player-facing modules, with a per-module cap of 15 items and default badge scope `shared`. Ruleset Wisdom (`[vendor]`-tagged items per §11.4) is always present in the Novel, not subject to reversion. Ruleset-native (`[ruleset]`) items are artifact-scope build output per §6.3: verified by the Phase 1 enrichment metrics, not injected into runtime Novel state. On Novel startup, Ruleset Wisdom activation keys resolve against the build's current Wisdom extraction. Matching keys stay active with the latest extracted content.

**REQ-080c — Synthesis boundaries (Part c).**
Vanished keys — those whose anchors no longer resolve — silently drop and are reported in `spec_health` as `[wisdom-gap]` entries. New Wisdom items discovered in the current extraction but not present in the activation keys start inactive. When a ruleset rebuild occurs, fresh extraction replaces the build output directory; the same key resolution logic applies on next Novel startup. Synthesis items never replace Ruleset Wisdom items. Player items never replace Ruleset Wisdom or synthesis items — the three source categories coexist. The GM activates synthesis items via `synthesis (action: activate)`.

**REQ-080d — Synthesis boundaries (Part d).**
Player items are active immediately upon creation; the player may deactivate their own items via `synthesis (action: deactivate)` (REQ-260). Synthesis may ADD content to entity voice_examples (REQ-077), prompt ordering recommendations (REQ-082), lore templates (REQ-083), action suggestion patterns (REQ-084, REQ-115), adventure advice (REQ-090, §11), narrative voice profiles (REQ-226), and supplementary guidance. Synthesis MUST NOT modify mechanical fields (stats, saves, HP, conditions, combat state), build-derived tool registrations, badge gating rules, or any Ruleset Wisdom content.

**REQ-080e — Synthesis boundaries (Part e).**
Synthesis recommendations for prompt ordering, lore templates, and adventure advice remain inert — they never auto-apply; the GM must explicitly activate them via the corresponding tools. The server flags external synthesis items as `[stale]` in `spec_health` and excludes them from synthesis resource surfaces when they have never been activated and their `collected_at` timestamp exceeds `TTRPG_SYNTHESIS_STALE_DAYS`. Ruleset Wisdom items do not carry staleness flags — they are canonical. Stale items remain on disk and reactivate if the GM explicitly activates them.

**REQ-080f — Synthesis boundaries (Part f).**
Re-running synthesis refreshes timestamps for all external items. Every external synthesis finding carries source_url, quoted_excerpt, badge_scope, confidence (derived from source authority, not mechanical completeness), output_module, and collected_at (ISO 8601 timestamp of collection) — all non-empty. Ruleset Wisdom items carry source anchor, confidence, output_module, and `[ruleset]` or `[vendor]` tag.

**REQ-080g1 — Synthesis boundaries (Part g1).**
Reverting synthesis (REQ-103) removes all synthesis items; Ruleset Wisdom and player items persist.

**REQ-080g2 — Synthesis boundaries (Part g2).**
*Acceptance criterion:* Synthesis-sourced voice_examples carry `[supplementary]` tag and source URL; Ruleset Wisdom items carry `[ruleset]` or `[vendor]` tag and source anchor; player-authored items carry `[player]` tag and appear in both Player and GM `badge_briefing` by default; a stale synthesis item (past `TTRPG_SYNTHESIS_STALE_DAYS`) is flagged `[stale]` in `spec_health` and excluded from surfaces; `synthesis (action: revert)` removes synthesis items but preserves Ruleset Wisdom and player items; a Ruleset Wisdom activation key that no longer resolves against the build's current extraction appears as a `[wisdom-gap]` entry in `spec_health`; new Wisdom items in the current extraction with no matching activation key start inactive. _Check:_ T63, T95, T97, T125.
**REQ-081a — Narrative directive (Part a).**
The Game Master may set narrative directives via the `narrative_directive` parameter on `scene (action: set)`. Each directive has a `label` (non-empty, unique within a Novel) and an `instruction` (free-text). Setting a duplicate label replaces the prior entry. An empty array clears all directives. For backward compatibility, `scene (action: directive)` also accepts a single `directive` string — treated as `[{"label": "primary", "instruction": <string>}]`. Directives appear in `badge_briefing` for the Game Master badge only and at `novel://current`, grouped under "Narrative Directives" with their labels.

**REQ-081b — Narrative directive (Part b).**
The directive text SHALL be resolved against the Holodeck behavioral dimension catalog at resolution time. Directives whose instruction text matches a catalog keyword SHALL mechanically couple to the corresponding behavioral configuration per the coupling rows in §7.7.1a (P44–P47). The pacing keywords include "faster," "slower," "brisk," and "leisurely". The autonomy keywords include "NPCs act independently" and "characters drive themselves". The reactivity keywords include "the world reacts," "living world," and "active factions". The synthesis keywords include "use voice patterns," "activate lore templates," "use action patterns," and "add flavor".

**REQ-081c — Narrative directive (Part c).**
Directives that match no catalog dimension SHALL be stored as inert guidance. Catalog keyword matching SHALL be case-insensitive substring matching. The catalog is closed — only the four named dimensions (pacing, autonomy, reactivity, synthesis) produce mechanical effects. They persist with the Novel.

**REQ-081d — Narrative directive (Part d).**
Player badge attempts return `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* The `narrative_directive` parameter on `scene (action: set)` with `[{label: "mood", instruction: "dark and brooding"}, {label: "pacing", instruction: "slow burn"}]` produces two entries in `badge_briefing` under the GM badge; a duplicate "mood" label replaces the prior; an empty array clears all directives. _Check:_ T64, T134, T450.
**REQ-082a — Prompt section ordering (Part a).**
The GM reorders `badge_briefing` via `session (action: briefing_order, sections)`. The tool accepts an ordered array of section tokens. Unknown tokens return `[ERROR] [INVALID_INPUT]` with valid tokens enumerated. An empty array resets to the builder-determined default. Section tokens control both ordering and inclusion. A token present in the array causes its corresponding group to render, or to render as an empty section if the group has no content. A token absent from the array causes its group to be omitted entirely from `badge_briefing`.

**REQ-082b — Prompt section ordering (Part b).**
The builder default ordering includes all groups and SHALL follow the placement contract of `TTRPG_WORLD_PROMINENCE` (REQ-309) — world-model state is decision-critical at `prominent`, a dedicated section at `visible`, or folded into scene state at `secondary`. The builder SHALL document the complete section-token-to-group mapping and the default ordering in DECISIONS.md, so the valid token set and default section ordering are auditable at build verification time without invoking the running server. The mapping SHALL cite the REQ-109 group each token corresponds to.

**REQ-082c — Prompt section ordering (Part c).**
Tokens whose corresponding sections are absent from the current ruleset produce empty sections (no error). Synthesis may record an ordering recommendation visible in `spec_health`, but never auto-applies. The ordering persists with the Novel. Player badge attempts return `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* `session (action: briefing_order, ["scene", "entities", "lore"])` reorders `badge_briefing`; `session (action: briefing_order, [])` resets to builder defaults; an unknown token returns `[ERROR] [INVALID_INPUT]` with valid tokens enumerated. _Check:_ T66.
**REQ-185a — Section token vocabulary (Part a).**
The builder SHALL assign a stable, validated section token to each REQ-109 group that has a runtime representation in `badge_briefing`. Token names SHALL be lowercase snake_case identifiers corresponding to the REQ-109 group (e.g., `entities` for the active entities group, `combat_state` for the active combat state group). The complete token-to-group mapping SHALL be documented in DECISIONS.md per REQ-082. The mapping SHALL be stable across builds — tokens do not change when the ruleset changes unless a REQ-109 group is added or removed.

**REQ-185b — Section token vocabulary (Part b).**
When a REQ-109 group has no runtime representation (e.g., ruleset lacks the construct), the builder SHALL still assign a token that produces an empty section. The builder SHALL also assign tokens for world-model briefing sections. The `world_state` token holds current room context from the world model — room name, exits, and contained visible things — rendered when the world-model tier has data. The `room_detail` token holds room description and examination-level detail, rendered as a dedicated section at `visible` and `prominent` prominence levels, and folded into scene state at `secondary`.

**REQ-185c — Section token vocabulary (Part c).**
The valid token set governs `session (action: briefing_order)` and synthesis briefing_order recommendations. *Acceptance criterion:* Building for D&D 5e produces a DECISIONS.md table mapping every REQ-109 group name to a snake_case token. Building for the Appendix B fixture (which lacks combat, countdowns, lore, and adventures) produces a subset mapping — the token set shrinks but token names for shared groups are identical. _Check:_ T300.
**REQ-186a — Section token discoverability (Part a).**
The valid section token set SHALL be discoverable without triggering an error. `spec_health` SHALL include a `section_tokens` field listing every valid token with its corresponding REQ-109 group name and whether the group currently has runtime content in the active Novel. The `help` tool, when queried with `"briefing"` or `"section ordering"`, SHALL enumerate the valid token set.

**REQ-186b — Section token discoverability (Part b).**
The `[INVALID_INPUT]` error from `session (action: briefing_order)` (REQ-082) SHALL continue to enumerate valid tokens for the immediate caller, but callers need not probe via error to find valid tokens. *Acceptance criterion:* `spec_health` returns a `section_tokens` array with token, group, and has_content fields. `session (action: briefing_order)` with an unknown token returns `[INVALID_INPUT]` with valid tokens enumerated — and the enumerated list matches the `section_tokens` field exactly. _Check:_ T225.
**REQ-083a — Dynamic lore (Part a).**
The Game Master may set (upsert — create or update), toggle, group, and remove keyword-triggered lore entries via `lore (action: set, key, content, ...)`, `lore (action: update)`, `lore (action: toggle)`, and `lore (action: remove)`. If the key already exists, provided fields merge into the existing entry. If the key does not exist, the server creates a new entry. New entries require `content`; updates may omit it. Entries activate when trigger keywords appear in scene description text (§7.7 Scene → Lore coupling). The server badge-filters entries, supports priority ordering and sticky persistence, and respects a configurable token budget. The server SHALL return matching synthesis templates from `lore://templates` via `lore (action: suggest)`.

**REQ-083b — Dynamic lore (Part b).**
The returned template set SHALL include all badge_scope values when called from the Game Master badge, and SHALL exclude only templates whose badge_scope is `game_master` when called from the Player badge. The template's badge_scope is advisory — the Game Master may activate a template with any badge_scope value via `lore (action: set)`, regardless of the template's source scope. Suggested templates carry the same provenance fields (key, content preview, triggers, confidence, source_url, badge_scope) as lore templates in the synthesis manifest. (REQ-155) Lore entries and groups persist with the Novel.

**REQ-083c — Dynamic lore (Part c).**
Player badge mutating and grouping attempts return `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* `lore (action: set, "tavern_rumor", "The innkeeper knows more...", triggers=["innkeeper","tavern"])` activates when scene text matches; sticky entries persist for their count after keywords leave; suppressed entries count appears in `spec_health`. _Check:_ T67, T79, T81, T82, T83.

**REQ-083d — Dynamic lore (Part d).**
Extend `lore (action: set)` and `lore (action: update)`: each lore entry SHALL carry a `visibility` field. The values are `gm_only` (applied to new entries), `shared` (visible to the Player badge immediately), or `player_discovered`. The server sets `player_discovered` automatically when the caller invokes `lore (action: reveal)` for the entry's key. The server excludes `gm_only` entries from Player-badge surfaces including `badge_briefing`, `lore://active`, and `graph://novel`. Both badges see `shared` entries. When `lore (action: set)` creates a new entry without a `visibility` field, it defaults to `gm_only`. `lore (action: update)` MAY change the visibility field.

**REQ-083e — Dynamic lore (Part e).**
The `badge_scope` field controls briefing presentation priority; `visibility` controls badge-filtered read access. *Acceptance criterion:* `lore (action: set, "secret", "content", visibility="shared")` creates a lore entry visible to Player badge. `lore (action: set, "gm_secret", "content")` creates a `gm_only` entry invisible to Player badge. _Check:_ T342.

**REQ-083f — Dynamic lore (Part f).**
WHEN a lore entry's `visibility` is `gm_only` or `player_discovered`, trigger matching SHALL additionally check `characters_present` (REQ-307). The entry fires only when at least one entity who knows about it — via `lore (action: reveal)` or the original revelation that set `player_discovered` — attends the current scene. `visibility: shared` entries fire on keyword match regardless of presence (current behavior). Entries with no `visibility` field (backward compatibility) SHALL follow the `gm_only` rule, applying the presence check.
**REQ-155a — Sticky counter decay (Part a).**
A lore entry's sticky counter decays by one when the scene text changes such that the entry's trigger keywords are no longer present. The counter resets to the entry's `sticky` value whenever trigger keywords re-match. Decay occurs on state mutation (specifically `scene (action: set)`), not on read operations — calling `badge_briefing` multiple times without an intervening scene change must not alter sticky counters. Entries whose sticky counter reaches zero are deactivated in the next briefing assembly and removed from active lore until re-triggered. *Acceptance criterion:* An entry with `sticky: 3` triggered by scene A.

**REQ-155b — Sticky counter decay (Part b).**
Change scene to B (no trigger keywords) — assert counter decrements by 1 per scene change. Call `badge_briefing` twice on scene B — assert counter unchanged. After 3 scene changes without re-triggering, assert entry no longer appears in `badge_briefing` lore section. Revert scene back to A — assert counter resets to 3. _Check:_ T299.
**REQ-328a — Lore-world coupling (Part a).**
Lore entries SHALL accept an optional `world_target` field — a room ID, thing ID, or exit reference in the world model. When `world_target` is set, the lore entry SHALL trigger on target interaction, not keyword match. The target interaction covers examination, entry, or parser navigation. `world_target` SHALL take precedence over `triggers` for activation: when both are present, the entry fires on target interaction AND keyword match. Entries without `world_target` SHALL use keyword matching per REQ-083 (current behavior). The `lore (action: suggest)` tool SHALL return world-targeted entries whose target the caller can reach from the current scene — same room or adjacent via an open exit.

**REQ-328b — Lore-world coupling (Part b).**
World-targeted lore entries SHALL appear in `badge_briefing` lore section with a `[world]` tag and the target name. The `world_target` field is optional — backward compatible with all existing lore entries. *Acceptance criterion:* `lore (action: set, "altar_secret", "The altar hums with power", world_target="altar_01")` — lore fires when `command (action: resolve, "examine altar")` succeeds, regardless of keyword match. `lore (action: set, "altar_secret", "The altar hums", triggers=["altar"], world_target="altar_01")` — fires on both target interaction and keyword match. _Check:_ T372.
**REQ-158a — Independent verification obligation (Part a).**
A build claimed as complete SHALL be accompanied by an independent verification report (§10) with a final verdict of VERIFIED or VERIFIED WITH FINDINGS. A NOT VERIFIED verdict blocks the claim. The independent verification report is operator-produced evidence — it is not a builder artifact in the four-artifact diet.

**REQ-158b — Independent verification obligation (Part b).**
The builder does not control the verifier or its output. The builder's obligation is to produce artifacts sufficient for a cold-checkout verifier to run the verification suite without the builder's help. *Acceptance criterion:* A build's handoff directory, when handed to a verifier of a different model following only README.md and AGENTS.md, produces a VERIFIED or VERIFIED WITH FINDINGS report. The verifier report must be included with the build when the build is claimed as complete. _Check:_ H12, §10 Phase 1 execuability.
**REQ-084b1 — Action suggestions (Part b1).**
The server provides a `command (action: suggest, intent)` tool that maps a player's natural-language intent to ruleset-legal tool invocations. Each suggestion entry carries three fields: the registered tool name, its REQ-015 action classification, and a one-sentence rationale connecting the intent to the mechanic. Freeform prose without tool-name references is insufficient — the LLM must be able to map a suggestion directly to a tool call. With an intent string, it returns all matching actions from the ruleset registry that plausibly correspond to the expressed intent.

**REQ-084b2 — Action suggestions (Part b2).**
Because a single natural-language intent may resolve to different mechanical approaches — a player declaring intent to persuade a guard might approach it through persuasion, deception, or intimidation — the tool may return multiple plausible tools for one intent. With an unrecognized intent — one for which no registered tool or documented ruleset procedure plausibly corresponds — the tool returns an empty list. Without an intent, it returns contextually relevant actions based on current scene type (REQ-087), scene_state, entity conditions, and active countdowns.

**REQ-084b3 — Action suggestions (Part b3).**
The tool is pure-resolution (idempotent, no state mutation). Results are badge-filtered: GM-only tools are excluded from Player results. The tool does not fabricate actions — every suggestion maps to a registered tool or documented ruleset procedure. Synthesis-derived action patterns (§11.1) may supplement the matching index. They are **inert** — visible at `synthesis://action_patterns` for review but excluded from `command (action: suggest)` results until the GM activates them via the Novel-scoped action pattern toggle (REQ-115).

**REQ-084b4 — Action suggestions (Part b4).**
Unactivated synthesis patterns remain reference-only and do not influence tool output. The `command (action: suggest)` tool is the canonical mechanism for intent-to-tool mapping at runtime. The server provides no dedicated `use_tool` or `lookup_rule` prompt for this function. Directing callers to this tool instead eliminates the redundancy of maintaining two surfaces for the same capability. *Acceptance criterion:* `command (action: suggest, "persuade the guard")` returns matching tools; `command (action: suggest, "xyzzy")` returns an empty list; synthesis patterns are excluded from results until activated via `synthesis (action: toggle_action)`. _Check:_ T68, T96, T120.
**REQ-084a1 — Proactive action surfacing (Part a1).**
IN addition to reactive intent-to-tool mapping, THE server SHALL surface an Available Actions section in `badge_briefing` (REQ-109) — a decision-critical group after combat state and before lore. The Available Actions section lists mechanically legal actions the active entity can take given the current scene state, entity capabilities, and ruleset.

**REQ-084a2 — Proactive action surfacing (Part a2).**
Actions SHALL be filtered by scene type (combat, social, or exploration). Capability gating keeps only actions whose prerequisites hold. Count gating caps at `TTRPG_MAX_AVAILABLE_ACTIONS` actions (default 8), prioritized by relevance. Badge filtering shows the Player badge only Player or un-gated actions per REQ-137. The `command (action: suggest)` tool stays the canonical intent-to-tool mapping; the proactive surface is a discovery aid, not a replacement. The `badge_briefing` output SHALL include an `available_actions` section token following the existing token contract (REQ-082, REQ-185). *Acceptance criterion:* During combat, `badge_briefing` `## Available Actions` lists weapon attack, spell, and condition-clearance actions, filtered to the active entity's capabilities.

**REQ-084a3 — Proactive action surfacing (Part a3).**
A wizard with no 3rd-level slots does not see "Cast Fireball." An entity in a social scene sees persuasion and deception actions instead of combat actions. `command (action: suggest)` keeps returning reactive suggestions apart from the proactive listing. _Check:_ T359.
**REQ-115a — Action pattern activation (Part a).**
`synthesis (action: toggle_action)` tool — Game Master only. Calling it flips the Novel-scoped action pattern activation state between enabled and disabled. When enabled, synthesis-derived action patterns (§11.1) supplement the `command (action: suggest)` (REQ-084) matching index. When disabled, patterns remain visible at `synthesis://action_patterns` for review but are excluded from `command (action: suggest)` results. The toggle is pure-resolution (idempotent, no state beyond the boolean).

**REQ-115b — Action pattern activation (Part b).**
Player badge returns `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* `synthesis (action: toggle_action)` flips the Novel-scoped boolean; when enabled, `command (action: suggest)` includes synthesis patterns; when disabled, patterns remain at `synthesis://action_patterns` only. _Check:_ T119.
**REQ-114a — Suggestion coverage (Part a).**
The builder tests action suggestion coverage against a curated intent set spanning every ruleset-defined action category identified during discovery. Each curated intent entry records: the natural-language intent text, the expected action categories per REQ-015 that the intent should map to, and the ruleset section or synthesis source that defines the category. The full curated set and its derivation are recorded in RULESET_MODEL.md.

**REQ-114b — Suggestion coverage (Part b).**
The builder records coverage below 80% — fewer than 80% of curated intents for which `command (action: suggest)` returns at least one tool matching the expected action categories — as a suggestion-coverage finding in DECISIONS.md (5), naming the uncovered categories and their intents. Coverage testing is a build-time audit; suggestion mappings do not change at runtime. *Acceptance criterion:* The curated intent set in RULESET_MODEL.md covers every discovered action category; coverage below 80% records the uncovered categories and their intents in DECISIONS.md (5) with named uncovered categories. _Check:_ T117.
**REQ-103a — Synthesis reversion (Part a).**
The server provides a `synthesis (action: revert)` tool — Game Master only. Removes all synthesis items (external web-sourced and internal Novel-state-synthesized, `[supplementary]`-tagged) from the Novel. Ruleset Wisdom (`[ruleset]` and `[vendor]`-tagged items) persists — `synthesis (action: revert)` SHALL NOT remove or alter Ruleset Wisdom content. Player items (`[player]`-tagged) persist. Does not mutate mechanical fields, build-derived tool registrations, badge gating rules, or DECISIONS.md — the synthesis manifest and verification results remain for audit.

**REQ-103b — Synthesis reversion (Part b).**
GM-configured Novel state that references synthesis content — briefing_order set via `session (action: briefing_order)` (REQ-082) and the action pattern activation toggle (REQ-115) — is Novel state, not synthesis state. The configuration survives reversion unchanged: the GM's configuration choices persist even when the synthesis data they reference is absent. After re-synthesis, these choices apply to the new synthesis data without reconfiguration. Player badge returns `[ERROR] [FORBIDDEN]`.

**REQ-103c — Synthesis reversion (Part c).**
Pure-state tool: idempotent and reversible. Re-running synthesis after reversion restores the items. *Acceptance criterion:* After `synthesis (action: revert)`, all synthesis surfaces (`synthesis://` resource URIs with `[supplementary]` items) return empty or absent; Ruleset Wisdom items (`[ruleset]`, `[vendor]`-tagged) persist unchanged; `lore://templates` returns only Novel-scoped lore entries, never synthesis-sourced templates; `spec_health` reports `synthesis_active: false` with zero counts for synthesis modules.

**REQ-103d — Synthesis reversion (Part d).**
Re-running synthesis repopulates modules; a second revert call changes nothing (idempotent). _Check:_ T94, T125.
**REQ-260a — Granular synthesis activation (Part a).**
The Game Master may manage synthesis items individually. The `synthesis (action: list, module?)` tool returns all available items with key, preview, source, source tag, and activated status. Ruleset Wisdom resolves from current build output; synthesis resolves from Novel JSON. The `synthesis (action: activate, module, key)` tool activates one item: Ruleset Wisdom adds the key to the Novel's `synthesis_activated` keys, and the Novel JSON marks synthesis items active. The `synthesis (action: deactivate, module, key)` tool deactivates without removal. Permanent deletion is limited to player-authored items via `synthesis (action: player_remove)` (REQ-261) and to bulk Tier-2 removal via reversion (REQ-103); the server never removes Ruleset Wisdom.

**REQ-260b — Granular synthesis activation (Part b).**
Ruleset Wisdom items cannot be removed, only deactivated; activation and deactivation tools are Game Master only. Activation and deactivation state persists with the Novel. Existing `synthesis (action: toggle)` and `synthesis (action: revert)` tools remain unchanged as convenience shortcuts.

**REQ-260c — Granular synthesis activation (Part c).**
The Player badge may call `synthesis (action: activate)` and `synthesis (action: deactivate)` on items they authored (tagged `[player]`) — items stored under the `player_synthesis` key in Novel JSON. Player-created items are active immediately upon creation; `synthesis (action: deactivate)` suppresses a player item from the player's `badge_briefing` and synthesis surfaces without deleting it. The Player deletes their own items via `synthesis (action: player_remove)` (REQ-261).

**REQ-260d — Granular synthesis activation (Part d).**
Player badge attempts to activate or deactivate any item NOT tagged `[player]` SHALL return `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* `synthesis (action: list)` shows all items with activation status and source tag; `synthesis (action: activate, "voice_examples", "goblin-snarl")` activates the item, surfacing it; `synthesis (action: deactivate, "voice_examples", "goblin-snarl")` removes it from surfaces; Player calls `synthesis (action: deactivate)` on a `[player]` item — hidden from player briefing; Player calls `synthesis (action: activate)` on a `[ruleset]` item — `[FORBIDDEN]`. _Check:_ T319.
**REQ-261a — Player synthesis (Part a).**
The player may create synthesis items in a player-facing subset of output modules: `voice_examples`, `action_patterns`, `supplementary_guidance`, `narrative_voices`, and `lore_templates` — modules where player-authored content enriches the shared story experience.

**REQ-261b — Player synthesis (Part b).**
Three tools provide player synthesis. The `synthesis (action: player_add, module, key, content, triggers?, badge_scope?)` tool creates a `[player]`-tagged synthesis item in the specified module. The `key` field is a unique snake_case slug within the module. The `content` field is a Markdown string. The `triggers` field is an optional keyword array for lore_templates (ignored for other modules). The `badge_scope` field defaults to `shared` — the item is visible to both Player and GM badges. The player may set `badge_scope` to `player` to keep the item private. The `synthesis (action: player_remove, module, key)` tool removes a `[player]`-tagged item.

**REQ-261c — Player synthesis (Part c).**
Returns `[RULE_VIOLATION]` if the item is not player-authored. `synthesis (action: player_list, module?)` lists all `[player]`-tagged items, optionally filtered by module, with key, preview, scope, and activated status. Player-created items are stored in the Novel JSON under a `player_synthesis` key, organized by module. Items survive restarts and follow the Novel's persistence contract (REQ-092). Player items are active immediately upon creation — the player does not need to activate them separately. The player may `synthesis (action: deactivate)` on their own items to suppress them from their briefing without deletion.

**REQ-261d — Player synthesis (Part d).**
Player items are subject to the same per-module budget caps as community synthesis (§11.1), with a per-module player cap of 15 items each. The GM badge sees player synthesis items in `synthesis (action: list)` and in `badge_briefing` filtered by the item's `badge_scope`. The GM may not modify or remove player synthesis items — attempts return `[FORBIDDEN]`. The GM may override an item's `badge_scope` from `shared` to `game_master` to incorporate it into the GM's active synthesis set. `synthesis (action: revert)` (REQ-103) and `synthesis (action: revert)` (REQ-265) SHALL NOT remove `[player]` items.

**REQ-261e — Player synthesis (Part e).**
Player badge only. *Acceptance criterion:* `synthesis (action: player_add, "action_patterns", "feint-suggestion", "When I feint, suggest deception check")` creates an item appearing in the player's `command (action: suggest)` output and the GM's `badge_briefing` (shared scope); `synthesis (action: player_add, "voice_examples", "growl", "Get away from my hoard!", [], "player")` creates a private Player-only item; `synthesis (action: player_remove, "action_patterns", "feint-suggestion")` removes it; `synthesis (action: player_remove)` on a Tier 1 `[ruleset]` item returns `[RULE_VIOLATION]`; `synthesis (action: player_list)` lists all player-authored items with module, key, preview, and scope; GM badge: `[FORBIDDEN]` on player synthesis tools; player items survive restart. _Check:_ T320.
**REQ-262a — Synthesis tool (Part a).**
The synthesis tool is Game Master only. The tool analyzes the Novel's state across seven source categories and produces synthesis items for each output module that has synthesizable content. The source categories include NPCs (personality, disposition, goals, voice examples), lore entries, the story journal, scene history, factions, secrets, relationships, countdowns, and world-model rooms and things — per §11.2. Internal synthesis items are stored in the Novel JSON under the `synthesis` key alongside external items. Items carry `[supplementary]` tag with `novel://` source URIs. Modules that produce no synthesizable content produce empty sections with `[empty]` markers.

**REQ-262b — Synthesis tool (Part b).**
The tool records a `synthesis_fingerprint` — a hash of the Novel state at synthesis time — to detect staleness without re-synthesis. Calling the tool when no Novel state has changed since the last synthesis returns `[OK] Synthesis up to date — <ISO 8601 timestamp>`. The `force` parameter bypasses the staleness check and re-synthesizes all modules. Items produced by synthesis are inert (inactive by default) — the GM must activate them via REQ-260.

**REQ-262c — Synthesis tool (Part c).**
Player badge returns `[FORBIDDEN]`. *Acceptance criterion:* Calling `synthesis (action: run)` with NPCs possessing personality fields produces `[supplementary]` voice examples with `source: novel://<slug>/npc/<npc_id>`. Calling again with no state changes returns the up-to-date message with timestamp. Calling with `force=true` re-synthesizes regardless. Player badge returns `[FORBIDDEN]`. _Check:_ T321.
**REQ-263a — Synthesis auto-trigger (Part a).**
When the operator sets `TTRPG_SYNTHESIS_AUTO_TRIGGER` to one of `off` (default), `on_session_start`, or `on_scene_change`, the server SHALL trigger `synthesis (action: run)` automatically per the selected threshold. The `on_session_start` threshold triggers when `TTRPG_SESSION_ID` changes (the server inserts a `[session-boundary]` marker per REQ-237). The `on_scene_change` threshold triggers after every `scene (action: set)` call. Auto-triggered synthesis uses the staleness fingerprint — if no relevant state changed since the last synthesis, the server skips synthesis. Auto-triggered items remain inert (inactive by default) — the GM SHALL activate them.

**REQ-263b — Synthesis auto-trigger (Part b).**
The auto-trigger threshold is visible in `spec_health` as `synthesis_auto_trigger: <threshold>`. When a ruleset-free Novel has no entities, NPCs, or story journal entries, synthesis produces empty modules with `[empty — no state]` markers. *Acceptance criterion:* With `TTRPG_SYNTHESIS_AUTO_TRIGGER=on_session_start`, a session boundary marker triggers synthesis. With `off`, synthesis requires explicit `synthesis (action: run)` invocation. Auto-synthesized items appear in `synthesis (action: list)` with `activated: false`. A ruleset-free Novel with no populated state produces empty module markers. _Check:_ T322.
**REQ-264a — Synthesis confidence model (Part a).**
`confidence` field reflecting their synthesis source, not external authority. Items derived from explicit Novel fields — NPC personality text, voice examples, named relationships, faction descriptions, secret content — carry `MEDIUM`. Items derived from inference — pattern detection across story journal entries, cross-referenced lore connections, scene-theme extraction, countdown tension analysis — carry `LOW`. Items carry `[supplementary]` tag alongside the confidence tag. The tag pair (`[supplementary] [MEDIUM]` or `[supplementary] [LOW]`) signals both provenance and reliability.

**REQ-264b — Synthesis confidence model (Part b).**
Internal synthesis items do not carry the `[stale]` flag — the server regenerates them on demand rather than collecting them at a fixed time. When a source field changes (e.g., the GM edits an NPC personality), the server updates the corresponding item's `collected_at` timestamp to reflect the synthesis time. Confidence is re-evaluated on each synthesis pass. An item that was `MEDIUM` may become `LOW` if the builder replaced its source with inferred content. *Acceptance criterion:* A voice example synthesized from an NPC's explicit personality field carries `[supplementary] [MEDIUM]`.

**REQ-264c — Synthesis confidence model (Part c).**
A "recurring theme" insight derived from cross-referencing three story journal entries carries `[supplementary] [LOW]`. After editing an NPC's personality, re-synthesis updates the `collected_at` timestamp for that NPC's items. _Check:_ T323.
**REQ-265a — Synthesis in badge_briefing (Part a).**
`badge_briefing` under their respective sections, tagged `[supplementary]` with confidence, alongside Ruleset Wisdom and `[player]` items. Badge filtering follows the same rules as REQ-159: items assigned `badge_scope: game_master` are hidden from the Player badge. Internal synthesis item badge scope defaults to `game_master` — they are GM prep aids by nature. The GM may override the scope to `shared` or `player`. The Player may deactivate individual synthesis items via `synthesis (action: deactivate)` when the GM has overridden their scope to `shared` or `player` (REQ-260).

**REQ-265b — Synthesis in badge_briefing (Part b).**
When no synthesis items are active, `badge_briefing` SHALL NOT include an empty synthesis section — unlike Ruleset Wisdom sections which require explicit empty-state markers per REQ-109. The absence of synthesis content does not signal a deficiency. *Acceptance criterion:* Synthesis items appear in `badge_briefing` under their respective sections tagged `[supplementary]` with confidence, alongside `[ruleset]`, `[vendor]`, and `[player]` items. Player badge sees only items whose scope is `shared` or `player`. Deactivated items via REQ-260 are hidden from the Player badge.

**REQ-265c — Synthesis in badge_briefing (Part c).**
After `synthesis (action: revert)`, synthesis items stay absent from `badge_briefing` with no empty-section marker. _Check:_ T324, T326.
**REQ-266a — Synthesis in dashboard (Part a).**
`synthesis://status` (REQ-230) SHALL include a synthesis column in its per-module table, showing `[supplementary]` item counts alongside Ruleset Wisdom counts. The `spec_health` report SHALL surface `synthesis_status` with per-module activated/total counts and the last synthesis timestamp (`synthesis_last_run` as ISO 8601). The `synthesis://status` resource SHALL include a `synthesis` section with the auto-trigger threshold, last synthesis timestamp, and a per-module breakdown of item counts.

**REQ-266b — Synthesis in dashboard (Part b).**
When no synthesis items exist, `synthesis://status` SHALL include the synthesis column with zero counts — the column is always present. *Acceptance criterion:* `synthesis://status` displays synthesis item counts per module alongside Ruleset Wisdom counts. `spec_health` includes `synthesis_last_run` timestamp and `synthesis_status` with per-module counts. After `synthesis (action: run)`, the synthesis column shows non-zero counts for populated modules. _Check:_ T325, T327.
**REQ-130a — Synthesis rebuild contract (Part a).**
Re-running the Synthesis workflow against a Novel that already contains synthesis state SHALL preserve every synthesis item that the Game Master has incorporated into active Novel state through any Novel-scoped tool call. A synthesis item is "activated" when a Novel-scoped GM tool call causes it to appear in at least one tool-observable surface (tool output, resource, or prompt) for the current Novel. Items never incorporated into active state — those that appear only in synthesis resource surfaces — are "inactive." The builder may replace inactive synthesis items with fresh synthesis (action: run) output.

**REQ-130b — Synthesis rebuild contract (Part b).**
Activated items SHALL NOT be removed, downgraded, or altered in their activated state by re-synthesis. The synthesized state's foundational principle — additive, inert, never modifying mechanical fields — extends to replacement. Replacing inactive items is not modifying. Removing or downgrading activated items counts as modifying, and the server forbids it. The builder SHALL record whether replacement preserved activated items or performed a full replacement in DECISIONS.md (5).

**REQ-130c — Synthesis rebuild contract (Part c).**
Full replacement — removing all synthesis including activated items — requires `synthesis (action: revert)` (REQ-103) before re-running Synthesis. *Acceptance criterion:* Create lore entry from synthesis template, activate it. Re-run synthesis (action: run) — assert the activated entry persists unchanged. Revert synthesis, re-run synthesis (action: run) — assert fresh synthesis state replaces all. _Check:_ T144.
**REQ-226a — Narrative voice profiles (Part a).**
The builder SHALL extract media-cited narrative voice profiles from the ruleset's inspirational media citations ("Appendix N," "Inspirational Reading," "Suggested Viewing," or equivalent sections discovered during the guidance pass). Each profile records: `name` (e.g., "Sword & Sorcery — Conan"), `source` (ruleset anchor), `media_title`, `media_type` (film, novel, game, or other), and `description` (narrative techniques and stylistic markers from the source material). External synthesis (§11.1) may add supplementary profiles. Stored at `synthesis://narrative_voices`.

**REQ-226b — Narrative voice profiles (Part b).**
Profiles remain inert — the GM applies them via narrative directive (REQ-081) by naming the profile. When the ruleset provides no inspirational media section, the builder SHALL attempt to populate the module from vendor content — IF Craft Corpus genre conventions and BitD thematic advice (§11.2). When both ruleset and vendor sources produce no narrative voice profiles, the module stays empty — this counts as no defect.

**REQ-226c — Narrative voice profiles (Part c).**
Ruleset-free builds produce an empty module when vendor content is also absent. *Acceptance criterion:* A ruleset citing Conan and The Lord of the Rings produces ≥2 narrative voice profiles with source anchors and descriptions. _Check:_ T302.
**REQ-227a — Synthesis model (Part a).**
Synthesis SHALL be a single workflow with two sources. External synthesis comes from web research per §11.1, defaults to off at intake, carries `[supplementary]`, and reverts under `synthesis (action: revert)`. Internal synthesis comes from Novel-state analysis per §11.2, carries `[supplementary]` with `novel://` source URIs, and reverts under `synthesis (action: revert)`. Ruleset Wisdom (`[ruleset]` and `[vendor]`-tagged items) forms build output from two sources — the ruleset's own text per REQ-225 and the vendor content bundles in `holonovel/narrative_world_model/` per §11.4 — populated at build time and never removed by `synthesis (action: revert)`.

**REQ-227b — Synthesis model (Part b).**
Synthesis items and Ruleset Wisdom coexist in all resource URIs and `badge_briefing` sections. The GM activates synthesis items via the same tool calls as Wisdom items. Synthesis items SHALL NOT replace or override Ruleset Wisdom items with matching keys — conflicts are recorded with `conflicts_with` reference to the Wisdom item. *Acceptance criterion:* A build with ruleset content SHALL populate Ruleset Wisdom in the Novel at creation time; synthesis, when run, adds `[supplementary]` items alongside `[ruleset]` and `[vendor]` items; `synthesis (action: revert)` removes all `[supplementary]` items. _Check:_ T303.
**REQ-228a — Synthesis consistency during spec-driven updates (Part a).**
During a spec-driven update per REQ-098, after the gap audit identifies changed surfaces, the builder SHALL scan all synthesis items (both tiers) for references to surfaces identified as changed or removed in the gap audit. Orphan references SHALL be classified as follows. The `auto-repairable` class covers a renamed tool — the builder updates the synthesis reference to the new name. The `GM-review` class covers a removed surface that the GM needs to review and replace. The `stale-reference` class covers a surface that is absent with no obvious replacement.

**REQ-228b — Synthesis consistency during spec-driven updates (Part b).**
GM-activated items (REQ-130) with orphan references carry a `[stale-reference]` tag in `spec_health` until the GM resolves them. The consistency check SHALL run before Pattern Buffer re-execution (§6.7) and SHALL NOT trigger web research — it is a cross-reference scan only. Results are recorded in DECISIONS.md with the gap audit row reference. *Acceptance criterion:* After a Minor update that renames a tool, ruleset-native synthesis action patterns referencing the old tool name are flagged `auto-repairable` and updated before the re-build completes.

**REQ-228c — Synthesis consistency during spec-driven updates (Part c).**
The builder flags a community synthesis item referencing a removed ruleset section as `GM-review`, citing the gap audit row. _Check:_ T304.
**REQ-230a — Synthesis status dashboard (Part a).**
The `synthesis://status` resource shows per-module synthesis item counts for the active Novel. The counts cover total items, activated items (GM-activated via Novel-scoped tool calls), inactive items, stale items, and pending-suggestion count (synthesis items matching current adventure or scene content but not yet activated). The counts split per output module: voice_examples, briefing_order, lore_templates, action_patterns, supplementary_guidance, adventure_advice, and narrative_voices. The resource SHALL render as Markdown with a header line "Synthesis Status" and one `##`-level section per module.

**REQ-230b — Synthesis status dashboard (Part b).**
Ruleset-native items are counted separately from community items within each module. The status SHALL be dynamically computed from Novel state at read time. The resource respects badge filtering per REQ-032. `spec_health` SHALL surface a summary: `synthesis_status` with per-module activated/total counts. *Acceptance criterion:* After activating 2 lore templates and 1 voice example, `synthesis://status` shows lore_templates: activated=2, total=N; voice_examples: activated=1, total=N. Other modules show activated=0. Player badge sees only shared-scope items. _Check:_ T306.
**REQ-231a — Per-module synthesis toggle (Part a).**
The GM may enable or disable individual synthesis output modules at runtime via `synthesis (action: toggle, module, enabled)`. Module SHALL be one of: `voice_examples`, `briefing_order`, `lore_templates`, `action_patterns` and `supplementary_guidance`, `adventure_advice`, `narrative_voices`. Disabling a module SHALL suppress all items in that module from `badge_briefing`, `command (action: suggest)`, `lore (action: suggest)`, and synthesis resource URIs for the current Novel. Disabling does not delete items — the items persist in Novel state and re-appear when the module is re-enabled.

**REQ-231b — Per-module synthesis toggle (Part b).**
Ruleset-native modules default to enabled; community modules default to enabled when community synthesis has been run. The toggle state persists with the Novel. Player badge attempts return `[ERROR] [FORBIDDEN]`. An unknown module name returns `[INVALID_INPUT]` with valid module names enumerated. *Acceptance criterion:* `synthesis (action: toggle, "voice_examples", false)` removes voice examples from `badge_briefing` and `synthesis://voice_examples` for the active Novel; re-enabling restores them; an unknown module returns `[INVALID_INPUT]`; Player badge returns `[FORBIDDEN]`. _Check:_ T307.
**REQ-243a — Synthesis population during spec-driven updates (Part a).**
During a spec-driven update per REQ-098, the builder SHALL run a scoped ruleset-native synthesis re-classification. The builder runs it after the gap audit implements new or changed surfaces and before Pattern Buffer re-execution.

**REQ-243b — Synthesis population during spec-driven updates (Part b).**
The builder performs five steps. Step (a) identifies new or changed surfaces from the gap audit's implemented-disposition rows — surfaces are tools, resources, prompts, or state fields. Step (b) maps each surface to the source ruleset sections that produced it, using the extraction citations in RULESET_MODEL.md. Step (c) runs REQ-225 classification on only those sections, producing new `[ruleset]`-tagged items. Step (d) merges new items into the existing synthesis manifest — appending to modules, never replacing existing items. Step (e) records the added item count per module in DECISIONS.md alongside the gap audit row reference.

**REQ-243c — Synthesis population during spec-driven updates (Part c).**
When the gap audit identifies no new surfaces (patch-level change), the builder skips this step with a "no new surfaces — skipped" annotation. The scoped re-classification SHALL NOT trigger a full re-read of the ruleset — only the sections that produced the new surfaces are re-read. The re-classification SHALL NOT trigger web research. Community synthesis items are not affected. *Acceptance criterion:* After a Minor update that adds a new `lookup_<category>` tool, ruleset-native action_patterns and supplementary_guidance receive new `[ruleset]` items for the new tool.

**REQ-243d — Synthesis population during spec-driven updates (Part d).**
DECISIONS.md records the added count per module. _Check:_ T308.
**REQ-244a — Convergence cache key (Part a).**
The builder SHALL compute a convergence cache key at the start of Phase 1. The key has five components. The first component is the ruleset content hash (REQ-044, sentinel `"none"` for ruleset-free). The second component is the specification content hash (REQ-187). The third component is the holonovel package version (B10). The fourth component is an aggregate hash of the `holonovel/narrative_world_model/` vendor directory. The fifth component is a narrative surface hash — a SHA-256 of the sorted, concatenated tool names, resource URIs, and prompt names for all narrative-category tools (excluding Novel lifecycle and Badge & Workflow tools).

**REQ-244b — Convergence cache key (Part b).**
When the cache key matches a prior successful convergence recorded in DECISIONS.md (5), the builder MAY skip Phase 1 metrics whose inputs the key fully captures. The builder MAY skip all nine metrics when the key matches, or individual metrics when it detects a partial match. Phase 2 metrics that depend on extraction quality (mechanics fidelity, suggestion coverage) MAY be skipped when the extraction model stays unchanged. Phase 2 metrics that depend on builder implementation quality (MUST coverage, process compliance, surface terminology, prompt health, resource URI completeness, truncation accuracy) SHALL always run fresh, except host-owned metrics dispositioned `host-verified` per §6.5.

**REQ-244c — Convergence cache key (Part c).**
Every skipped metric SHALL be recorded in DECISIONS.md (5) with the annotation `cached — convergence fingerprint match` and the cache key that produced the match. The operator MAY override the cache at intake with a `--no-cache` flag that forces the full convergence loop regardless of cache-key match. In non-interactive mode the defaults apply — cached results are reused when available. A full rebuild (cold checkout, no prior DECISIONS.md) has no cache key to match and runs the full convergence loop.

**REQ-244d — Convergence cache key (Part d).**
In `quick-build` mode the builder still computes the cache key but reports Phase 1 metrics fresh — quick-build runs the full convergence loop for speed-versus-correctness trade-off tracking. A partial match — one component differs while the rest stay unchanged — SHALL record which component differed and which metrics the builder cached in DECISIONS.md (5). *Acceptance criterion:* A TTRPG build against a ruleset whose prior build recorded a matching convergence cache key in DECISIONS.md (5) reports Phase 1 metrics as `cached — convergence fingerprint match` and skips the measurement/improvement iteration loop.

**REQ-244e — Convergence cache key (Part e).**
A build with `--no-cache` runs the full convergence loop regardless of key match. A cold checkout (no prior DECISIONS.md) runs the full convergence loop. _Check:_ T309.
**REQ-245a — Pre-computed synthesis manifest (Part a).**
The package root carries a `CONVERGENCE.md` manifest recording Phase 2 convergence results per package version. The manifest records the holonovel package version, the specification version used for computation, all eight Phase 2 convergence metric results, and Holonovel Pattern Buffer sub-workflow outcomes (I1–I18, per-sub-workflow pass/fail with ISO 8601 timestamps).

**REQ-245b — Pre-computed synthesis manifest (Part b).**
When the specification version recorded in the manifest matches the current specification version, the holonovel package builder MAY skip Phase 2 convergence and the Holonovel Pattern Buffer, recording `cached — holonovel vX.Y.Z convergence manifest` in DECISIONS.md (5) and (6). When the specification version has advanced, the builder SHALL run convergence and the Holonovel Pattern Buffer fresh and update the manifest with the new results and spec version. TTRPG builders consuming the holonovel package as a dependency SHALL NOT load or reference this manifest for package-owned metrics — it applies only to holonovel package builds. The builder MAY reference the manifest's host-owned metric results (per §6.5) solely to record the `host-verified` disposition.

**REQ-245c — Pre-computed synthesis manifest (Part c).**
A ruleset source MAY include a pre-built synthesis manifest (`synthesis_manifest.json` alongside the ruleset Markdown). The manifest contains the seven-module REQ-225 extraction output, each module's `[ruleset]`-tagged items with source anchors and confidence labels, its ruleset content hash, and the specification version used for extraction. During Discovery, before running REQ-225 classification, the builder SHALL check for this manifest.

**REQ-245d — Pre-computed synthesis manifest (Part d).**
When the manifest exists AND the specification version recorded in the manifest matches the current specification version AND the manifest's ruleset content hash matches the current ruleset content hash, the builder SHALL use the pre-built manifest. The builder records `pre-built synthesis manifest — validated` in DECISIONS.md (4). When any validation condition fails, the builder SHALL fall back to live REQ-225 extraction with the annotation `pre-built synthesis manifest — <failure reason>, live extraction` in DECISIONS.md (4).

**REQ-245e — Pre-computed synthesis manifest (Part e).**
When no manifest exists, the builder proceeds with live extraction as normal. *Acceptance criterion:* A holonovel package build whose CONVERGENCE.md spec version matches the current spec reports Phase 2 metrics and Holonovel Pattern Buffer results as cached. A TTRPG build against a ruleset with a valid pre-built synthesis manifest skips REQ-225 extraction and uses the manifest. A ruleset without a manifest runs live REQ-225 extraction as before. _Check:_ T310, T495.
**REQ-085a — Macro system (Part a).**
The server expands macro tokens of the form `{{<path>}}` in all tool output, resource text, and prompt text before delivery. Supported macros: `{{entity.name}}`, `{{entity.hp}}`, `{{entity.<stat>}}` (per-ruleset stat names), `{{scene.current}}`, `{{scene.type}}`, `{{countdown.<name>.remaining}}`, `{{countdown.<name>.total}}` and `{{countdown.<name>.scope}}`, `{{countdown.<name>.direction}}`, `{{novel.slug}}`, `{{badge.active}}` `{{party.size}}`. Macros referencing nonexistent state expand to the literal token unchanged. Macro expansion occurs after output composition and before client delivery.

**REQ-085b — Macro system (Part b).**
Macros do not expand in audit log entries. *Acceptance criterion:* `{{entity.name}}` in tool output expands to the active entity's name; `{{nonexistent.path}}` expands to the literal token unchanged; macros do not expand in audit log entries. _Check:_ T69.
**REQ-086a — Audit compression (Part a).**
The server provides a `session (action: compress, max_entries)` tool that returns a Markdown-formatted prompt. The prompt has a header line — "Compressed audit log (summarize into a single paragraph):". The prompt then lists one line per entry in the format `[timestamp] [badge] tool_name — output_prefix` for mutating entries or `[timestamp] [badge] tool_name — [BOUNDARY_VIOLATION]` for forbidden-call entries (REQ-133). The tool does not modify the audit log (REQ-040).

**REQ-086b — Audit compression (Part b).**
The server badge-filters output. The Player badge sees entries where the recorded badge is `player` or where the current player owns the entity affected by the entry, per the entity-ownership filter defined in REQ-168 and applied to `session (action: compress)` output. The Game Master badge sees all entries. The `max_entries` value is a positive integer; values at or below 0 return `[ERROR] [INVALID_INPUT]`.

**REQ-086c — Audit compression (Part c).**
The tool is pure-generation (idempotent, no server-side state mutation). *Acceptance criterion:* `session (action: compress, 50)` returns a formatted prompt of the 50 most recent entries; Player badge sees only own-entity entries; `session (action: compress, 0)` returns `[INVALID_INPUT]`. _Check:_ T70.
**REQ-087a — Scene type tagging (Part a).**
The Game Master may tag the current scene with one or more type strings. The default catalog — always present — is `social`, `exploration`, `neutral`. The builder SHALL extract additional scene types from the ruleset's guidance and activity-pillar descriptions (e.g., `crafting`, `investigation`, `survival`, `hacking`). Extracted types merge with the default catalog; the builder SHALL record the full resolved catalog in DECISIONS.md. Combat is not a scene type — it is a resolution mode with dedicated state (REQ-043); combat presence is signalled by the combat state group in `badge_briefing`, not by a scene type tag.

**REQ-087b — Scene type tagging (Part b).**
Multiple scene types may be active simultaneously (e.g., `["social", "exploration"]` for negotiation during a journey). The `scene_type` parameter on `scene (action: set)` accepts either a single type string or an array of type strings. The type tags are guidance — they affect `badge_briefing` composition (tools matching any active type are ordered before unmatched tools) and `command (action: suggest)` filtering (actions matching any active type are prioritized), but do not alter tool behavior, dice results, or rules enforcement. The types persist with the Novel. Player badge attempts return `[ERROR] [FORBIDDEN]`.

**REQ-087c — Scene type tagging (Part c).**
Confrontation tools (REQ-043) operate identically regardless of scene type; the tag guides the GM and LLM toward moves matching the scene type. *Acceptance criterion:* The `scene_type` parameter on `scene (action: set)` with `["social", "exploration"]` orders social and exploration tools before unmatched tools in `badge_briefing`; a single string `"exploration"` works for backward compatibility. _Check:_ T71, T135.
**REQ-125a — Scene transition hook (Part a).**
When the caller invokes `scene (action: set)` and the new description differs from the current `scene_description`, the server records a `[scene-transition]` audit entry with the old and new descriptions and a timestamp. The transition records automatically — no additional tool call is needed. Countdowns of either type (`round` or `narrative`) carrying the `on_scene_transition` flag (REQ-073) decrement by one tick on transition. Calling `scene (action: set)` with a `skip_transition_hook` parameter suppresses the audit entry and countdown decrement for cases where the GM is updating the same scene without transitioning it (e.g., adding descriptive detail).

**REQ-125b — Scene transition hook (Part b).**
The Player badge sees scene transitions in `scene://history`; GM-only mechanics (audit entry, countdown decrement) are invisible to the Player badge. *Acceptance criterion:* `scene (action: set, "cave", skip_transition_hook=true)` does not record a `[scene-transition]` audit entry; a countdown with `on_scene_transition=true` decrements on scene change. _Check:_ T136. *Out of scope:* AI content generation at runtime (all generation is build-time), real-time web synthesis, and narrative quality assessment beyond the anti-slop guidance catalog.
**REQ-234a — Secrets and knowledge (Part a).**
The Game Master may manage hidden information with per-entity visibility. The `lore (action: set_secret, key, content, triggers?, badge_scope?)` tool creates a secret lore entry visible only to the Game Master badge. The `lore (action: reveal, key, entity_id)` tool makes a secret known to a specific entity. The entity's `character (action: sheet)` SHALL include the secret text in a "Known Information" section. The `lore (action: knowledge, entity_id, key?)` tool returns what secrets an entity knows; without `key`, it returns all known secrets. Secrets are functionally lore entries with a knowledge-visibility layer — they follow the same persistence, grouping, and export contracts as lore (REQ-083, REQ-094).

**REQ-234b — Secrets and knowledge (Part b).**
Resource: `secrets://active` — GM-filtered, lists all secrets and their known-by status. *Coupling:* When a secret implicates another entity or faction, a `suspicious` relationship (REQ-236) SHALL be recommended between the knowledge-holder and the implicated entity. The server detects the implication by name overlap between the secret text and registered entity, NPC, or faction names. The term "name overlap" means an exact case-insensitive match between a registered name and a token in the secret text, with no fuzzy or semantic matching.

**REQ-234c — Secrets and knowledge (Part c).**
The recommendation SHALL be surfaced in `badge_briefing` for the Game Master badge only. The `lore (action: reveal, key, target_id)` tool SHALL accept faction identifiers as `target_id` alongside entity identifiers. The `lore (action: knowledge, faction_id, key?)` tool SHALL accept faction identifiers alongside entity identifiers and SHALL return secrets known to the faction. Faction-known secrets SHALL surface at `faction://<id>` for the GM badge.

**REQ-234d — Secrets and knowledge (Part d).**
WHEN the caller reveals a secret to a faction and the secret names another faction in its content, a `rival` relationship (REQ-236) SHALL be recommended between the knowledge-holding faction and the named faction. *Acceptance criterion:* `lore (action: set_secret, "murder_confession", "The butler killed Lord Ashworth")` creates a GM-only lore entry; `lore (action: reveal, "murder_confession", "pc_detective")` adds "Known Information" to the detective's character sheet; `lore (action: knowledge, "pc_detective")` returns the secret. _Check:_ T274.

### 5.9 Novel Persistence and Transport

**REQ-088a — Novel lifecycle (Part a).**
`novel (action: create, name, description?)` creates a new Novel at `.holonovel-state/novels/<slug>.json` and activates it for the calling connection. An optional `codex_adventure` parameter — a Codex entry ID of kind `adventure` — bootstraps the Novel in one atomic operation: creates the Novel, imports the Codex adventure scaffold (world-model, NPCs, factions, lore, synthesis linkages per REQ-321), and marks `adventure_set: true` in Novel metadata. When `codex_adventure` is provided and the referenced Codex entry does not exist or is not of kind `adventure`, `novel (action: create)` SHALL return `[ERROR] [NOT_FOUND]`.

**REQ-088b — Novel lifecycle (Part b).**
In a multi-ruleset server, the referenced Codex entry's `ruleset` field SHALL match the Novel's ruleset scope (per REQ-387); a mismatch returns `[ERROR] [STATE_CONFLICT]` naming both rulesets.

**REQ-088c — Novel lifecycle (Part c).**
When no Codex entries exist on the server, the server ignores the parameter silently. The `description` field is optional free text (one paragraph recommended). The server stores it in the Novel JSON and surfaces it in `novel://current`, `novel (action: list)`, `novel (action: info)`, and the `novel (action: export)` manifest. The `novel (action: resume, slug)` tool activates an existing Novel from disk. The `novel (action: switch, slug)` tool (REQ-095) switches the active Novel for a connection. The `novel (action: end)` tool emits a `[NEED_INPUT]` workflow decision — "End Novel `<slug>`?" — with options `yes` and `cancel`.

**REQ-088d — Novel lifecycle (Part d).**
On `yes`: deactivates badge, clears undo stacks, moves the Novel's save file and its backup chain (REQ-238) to `.trash/` per REQ-117 — retained files are excluded from `novel (action: list)` and `novel (action: resume)` — and the roster survives. On `cancel`: restores pre-invocation state unchanged. `novel (action: resume, slug)` returns `[STATE_CONFLICT]` if no file exists at `.holonovel-state/novels/<slug>.json` (whether retained in `.trash/` after `novel (action: end)` or never created). Multiple Novels may coexist on disk per server instance. One Novel is active per connection at a time (REQ-030); a connection may switch between Novels via `novel (action: switch)` (REQ-095).

**REQ-088e — Novel lifecycle (Part e).**
Character creation, character import, and NPC creation are Novel-scoped operations — they require an active Novel. Without one, they return `[STATE_CONFLICT]` directing the operator to `novel (action: create)`. Silent orphan creation — adding an entity to the roster without a Novel association — is a defect. `[STATE_CONFLICT]` if no Novel active when a Novel-scoped tool is called. Server start without `TTRPG_NOVEL` operates with no Novel active — Novel-scoped tools direct users to create or resume one.

**REQ-088f — Novel lifecycle (Part f).**
For backward compatibility, the builder may accept `end_game` as a deprecated alias for `novel (action: end)`; the alias is not required and may be logged as deprecated in `spec_health`. WHEN `TTRPG_NOVEL` is set at server startup, THE system SHALL attempt to activate the Novel whose internal slug matches the env var, resolved against the hydrated registry (REQ-065), before servicing any tool call. A save file whose filename diverges from its internal slug still activates. If no Novel with that slug exists, the server creates one with the given name (equivalent to `novel (action: create, name)`).

**REQ-088g — Novel lifecycle (Part g).**
In either case, the server activates the Novel before it serves the first tool call or prompt.

**REQ-088h1 — Novel lifecycle (Part h1).**
If the operator sets `TTRPG_NOVEL` but activation fails for any reason other than non-existence (e.g., corrupt file, checksum mismatch), the server reports the error in stderr and `spec_health`, and proceeds with no Novel active. The server does not silently swallow the error.

**REQ-088h2 — Novel lifecycle (Part h2).**
*Acceptance criterion:* `novel (action: create, "my-novel", "A noir detective story set in a rain-soaked city.")` creates `novels/my-novel.json` and stores the description; `novel (action: end)` prompts `[NEED_INPUT]` with yes/cancel; on "yes", the file is moved to `.trash/` and the roster survives. `novel (action: create, "dragon-game", codex_adventure="dragon-hoard")` creates the Novel and imports the dragon-hoard Codex adventure scaffold atomically; `novel (action: create, "broken", codex_adventure="nonexistent")` returns `[NOT_FOUND]`. `TTRPG_NOVEL` naming the internal slug of a misnamed save file activates that Novel at startup. _Check:_ T72, T73, T98, T159, T379.
**REQ-117 — Novel retention period.** On `novel (action: end)` confirmation, the server moves the Novel's save file and its backup to a `.trash/` subdirectory within the state directory
rather than deleting them immediately. Files in `.trash/` remain excluded from `novel (action: list)`
and `novel (action: resume)`. The operator may configure a retention duration via
`TTRPG_NOVEL_RETENTION_DAYS`; files older than this duration are eligible for removal on
next server startup. If `TTRPG_NOVEL_RETENTION_DAYS` is unset or set to zero, files in
`.trash/` are retained indefinitely (manual cleanup required).
*Acceptance criterion:* After `novel (action: end)`, the file exists in `.trash/` but
`novel (action: resume, slug)` returns `[STATE_CONFLICT]`; `TTRPG_NOVEL_RETENTION_DAYS=0`
retains files indefinitely.
_Check:_ T122.

**REQ-095a — Novel switching (Part a).**
`novel (action: switch, slug)` (always callable regardless of badge) deactivates the connection's current Novel and activates the target Novel identified by slug. The target must exist on disk and must not have been ended (file must be present at `.holonovel-state/novels/<slug>.json`). Returns `[STATE_CONFLICT]` if the slug does not exist or the target Novel's file is absent. When switching, the active badge for the target Novel is restored from the Novel's persisted badge state (REQ-055). If no Novel is currently active, `novel (action: switch)` activates the target directly (equivalent to `novel (action: resume, slug)` without requiring a fresh server start).

**REQ-095b — Novel switching (Part b).**
Novel-scoped tools operate on the connection's active Novel. Each connection maintains its own active Novel reference; two connections may have different Novels active simultaneously. *Acceptance criterion:* `novel (action: switch, "other-novel")` deactivates the current Novel and activates the target; the target's persisted badge is restored; switching to a nonexistent slug returns `[STATE_CONFLICT]`. _Check:_ T98.
**REQ-256a — Rename Novel (Part a).**
`novel (action: rename, new_slug)` (Game Master only) renames the active Novel's save file on disk and updates the slug in state. Returns `[STATE_CONFLICT]` if the target slug already exists on disk or if the active Novel is active in another connection. The Novel's `.bak.N` files are renamed to match. The server SHALL name the file atomically — the rename is atomic, and the server SHALL NOT leave the Novel with a slug that differs from the filename. The Novel SHALL be active when called. Badge state, synthesis activation keys, and all property groups are preserved under the new slug.

**REQ-256b — Rename Novel (Part b).**
The new slug is reflected in `novel (action: list)`, `novel (action: info)`, and `spec_health`. *Acceptance criterion:* `novel (action: rename, "new-name")` renames `novels/old-name.json` to `novels/new-name.json`; `novel (action: list)` lists the Novel under the new slug; duplicate slug returns `[STATE_CONFLICT]`; the old slug returns `[NOT_FOUND]` on `novel (action: resume)`. _Check:_ T315.
**REQ-259 — Update Novel description.** `novel (action: description, description)` (Game
Master only) sets or replaces the active Novel's description. An empty string clears
the description. The updated description is surfaced immediately in `novel://current`,
`novel (action: list)`, `novel (action: info)`, and `badge_briefing` under the `novel` section token.
The description is stored in the Novel JSON per REQ-092. Calling with no Novel
active returns `[STATE_CONFLICT]`. *Acceptance criterion:*
`novel (action: description, "A new premise.")` updates the description;
`novel (action: info)` returns the new description; an empty string clears it.
_Check:_ T318.

**REQ-257a — List Novels (Part a).**
`novel (action: list)` returns Novels on disk with these fields per Novel. The list includes slug, name, description, last-modified timestamp, session count, cumulative play time, on-disk file size in bytes, and story journal entry count. The list also includes synthesis item counts (Tier 1 activated key count per module and Tier 2 item count per module) and an active flag. The response is badge-filtered: the Player badge sees only Novels with `shared` scope adventure hooks and excludes GM-only metadata. When no Novels exist, the response SHALL include an explicit empty-state message.

**REQ-257b — List Novels (Part b).**
This is the dedicated save-file browsing surface — `spec_health` (REQ-093) continues to report Novels as part of its build-health dashboard, but `novel (action: list)` is the primary interface for the save-file library. *Acceptance criterion:* After creating two Novels, `novel (action: list)` returns two entries; after `novel (action: end)`, the ended Novel is absent; empty disk returns an empty-state message; Player badge sees filtered metadata. _Check:_ T316.
**REQ-258a — Novel info (Part a).**
`novel (action: info, slug?)` (always callable, defaults to the active Novel) returns extended metadata for a single Novel. The metadata includes slug, name, description, creation timestamp, last-modified timestamp, session count, cumulative play time, on-disk file size, story journal entry counts by type, checkpoint count, notes count, adventure source (slug, "generated", or "none"), setup-completion flags, format version, compression flag, and the active badge. The metadata also includes synthesis status (Tier 1 activated key count per module, Tier 2 item count per module, and stale item count) and `codex_sources` (array of `{id, kind, imported_at, codex_modified_at}` per REQ-332). The resource is badge-filtered.

**REQ-258b — Novel info (Part b).**
When the specified slug doesn't exist on disk, returns `[NOT_FOUND]` with available slugs enumerated. When the caller omits the slug and no Novel is active, returns `[NOT_FOUND]` directing the caller to `novel (action: list)` or `novel (action: create)`. *Acceptance criterion:* `novel (action: info)` returns extended metadata for the active Novel; `novel (action: info, "other-novel")` returns metadata for a different Novel without activating it; nonexistent slug returns `[NOT_FOUND]` with available slugs; Player badge sees filtered metadata. _Check:_ T317.
**REQ-089a — Novel setup (Part a).**
`prompts/list`). The `novel_setup` prompt SHALL present a guided setup wizard in three sequential steps. Step 1 is characters — import roster characters or create new ones, with the ruleset's creation options described in plain English. Step 2 is story source — load an adventure, generate from a premise, generate a random encounter, or build from scratch, with each option explained in terms of what the GM gets narratively. After step 2 completes and a story source is selected, `novel_setup` SHALL include a plain-English note: "Community-sourced play advice tailored to your adventure's themes — is available for this Novel.

**REQ-089b — Novel setup (Part b).**
You can run synthesis against this server to add it now, or proceed without it." The note SHALL describe synthesis in terms of what it delivers (voice examples, lore ideas, scene advice) not what it is called or how to invoke it; (3) session zero. Each step SHALL display a visual completion marker — `[✓]` for completed, `[→]` for current, `[ ]` for pending — so the operator always knows where they are. Step descriptions SHALL be conversational in plain English (e.g., "You have 2 characters in your roster. Would you like to import one, create a new one, or move on?") rather than a static listing.

**REQ-089c — Novel setup (Part c).**
After session zero completes, the prompt SHALL present a next-steps summary describing what is ready and how to begin the first scene. The Novel SHALL track completed steps (characters_present, adventure_set, session_zero_completed) in its metadata, surfaced in `badge_briefing` under the `novel` section token.

**REQ-089d — Novel setup (Part d).**
After `novel (action: create)`, the server response or `badge_briefing` SHALL surface `novel_setup` as the recommended next step. `novel_setup` SHALL integrate ruleset-extracted guidance (REQ-016), Synthesis `adventure_advice` content, and spec foundations for story-construction context. *Acceptance criterion:* `novel_setup` presents three sequential steps with visual completion markers; step descriptions use conversational plain English; after session zero completes, a next-steps summary appears; completed steps are tracked in Novel metadata. _Check:_ T74.
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
`adventure (action: generate, premise, target?)` (Game Master only). Accepts a free-text premise and produces an adventure scaffold: a title (slug-ified from premise), an Overview (GM-only, template-populated), an Adventure Hook (player-visible), 2–6 location headings with table-rolled flavor (setting, horror, puzzle tables from the ruleset), NPC name suggestions, and encounter table seeding.

**REQ-090b — Adventure generation (Part b).**
Uses indexed ruleset tables and, when available, Synthesis `adventure_advice` content — selecting templates by category match (adventure_templates for scaffold structure), genre-convention items by keyword match against the premise string, and scenario_starters by genre tag — each selection carrying its source_url and confidence in the output. No runtime network — all content from indexed data.

**REQ-090c — Adventure generation (Part c).**
The optional `target` parameter accepts `novel` (default when a Novel is active), `codex` (default when no Novel is active), or `both`. The `target: "codex"` value SHALL store the generated scaffold as a Codex entry of kind `adventure` under the derived slug with `source: generated`. The `target: "novel"` value SHALL store the scaffold as the active Novel's generated adventure content. The scaffold indexes at `adventure://generated/<anchor>`, appears in `ruleset (action: search)`, and surfaces in `badge_briefing` under the `adventure` token. The `target: "both"` value SHALL produce both.

**REQ-090d — Adventure generation (Part d).**
When the caller omits `target` and no Novel is active, the server defaults `target` to `codex`. The `adventure (action: generate)` tool SHALL be callable regardless of Novel state — the server requires no Novel. Regenerating with `target: "codex"` replaces the prior Codex entry at the same slug; regenerating with `target: "novel"` replaces the prior generated Novel adventure.

**REQ-090e — Adventure generation (Part e).**
The Game Master expands via existing tools; the LLM (GM badge) writes narrative prose. *Acceptance criterion:* `adventure (action: generate, "The goblin king demands tribute")` produces a title, overview, hook, 2–6 locations, NPC names, and encounter seeds; the scaffold appears at `adventure://generated/<anchor>`. `adventure (action: generate, "The dragon hoard", target="codex")` with no Novel active stores the scaffold in Codex; `codex (action: list, "adventure")` returns the entry; server restart preserves it. _Check:_ T75, T367.
**REQ-091a — Enhanced encounter generation (Part a).**
`adventure (action: generate_encounter, context)` (Game Master only, optional context string). Combines ruleset encounter tables with Synthesis `adventure_advice` content (matching by scene context keywords against table_expansions category items, highest confidence first) to produce a complete encounter in one call: a scene description, an NPC or monster stat block, and a complication entry. With ruleset tables, rolls on them for the mechanical backbone and wraps in generated narrative. Without tables, produces from context and Synthesis template patterns.

**REQ-091b — Enhanced encounter generation (Part b).**
Output: three structured artifacts as a batch — one `scene (action: set)`, one `npc (action: create)`, one `lore (action: set)` for the complication. Snapshotted as a single undo target. No `[NEED_INPUT]`. Player badge → `[FORBIDDEN]`. *Acceptance criterion:* `adventure (action: generate_encounter, "dark forest at midnight")` produces a scene description, an NPC stat block, and a lore entry as a single atomic batch; undo rolls back all three. _Check:_ T76.
**REQ-295a — Genre-filtered generation (Part a).**
(REQ-294), `adventure (action: generate)` and `adventure (action: generate_encounter)` SHALL filter their table draws and template selections to prefer genre-matching content.

**REQ-295b — Genre-filtered generation (Part b).**
The filtering SHALL operate as a preference, not a block. Preference (a): the server draws from encounter tables, NPC archetypes, and location templates that carry a matching genre tag first. Preference (b): the server draws from untagged or `universal` tables only when genre-matching content runs out. Preference (c): the server excludes content tagged with a non-matching genre unless the GM explicitly requests it via a `!include_all` prefix on the premise or context string. Preference (d): the server filters synthesis content by genre tag when the Novel's genre has a value.

**REQ-295c — Genre-filtered generation (Part c).**
Generation tables (REQ-213) SHALL carry an optional `genre_tags` field extracted during Discovery (§6.3). The server classifies a table with no `genre_tags` field as `universal`. *Acceptance criterion:* With `genre: "noir"` set, `adventure (action: generate_encounter, "dark alley")` drawn from tables where the noir-tagged table contains "mugger" and the universal table contains "dragon" SHALL return the mugger. _Check:_ T340.
**REQ-092a — Novel persistence (Part a).**
`.holonovel-state/novels/<slug>.json` (self-contained JSON bundling all state tiers, the `audit_log` array (REQ-040), the `story_journal` array (REQ-246), Novel metadata, and undo snapshot stacks) using an atomic rename — write to a temporary file, then atomically rename over the target. The serialized Novel payload must be fully durable on the storage medium before the atomic rename commits. Content written to the temporary file must be flushed to stable storage (e.g., via fsync on the file descriptor) before the rename operation.

**REQ-092b — Novel persistence (Part b).**
The temporary file path must include an element that prevents collision with concurrent writers targeting the same Novel (e.g., a process identifier or timestamp suffix). A Novel on disk whose file size is zero after an atomic write indicates a durability failure — surfaced in `spec_health` and stderr. The previous Novel file is retained as a rotating backup chain `<slug>.json.bak.1..N` per REQ-238. Both corrupted JSON and a missing backup chain surface in `spec_health` and stderr. A rebuild with a changed entity model loads the Novel gracefully: absent-model fields in JSON preserved as inert data; missing fields receive ruleset-defined defaults.

**REQ-092c — Novel persistence (Part c).**
Roster baselines remain immutable across rebuilds. Structurally corrupted JSON → stderr warning and `spec_health` flag; never silently discarded. On load, if the primary file is structurally corrupt but a backup in the rotation chain (REQ-238) is intact and parseable, starting from `.bak.1`, the server loads from that backup and records a `[restored-from-backup]` audit entry. If the primary and every backup in the chain are corrupt, the server emits a stderr warning listing the file paths, surfaces a `[corrupted-novel]` flag in `spec_health` with the slug, and provides the chain paths for operator recovery. The server must not silently discard or zero-initialize the Novel.

**REQ-092d — Novel persistence (Part d).**
No orphaned active state — `novel (action: end)` moves the save file and its backup chain (REQ-238) to `.trash/` per REQ-117; retained files never surface in `novel (action: list)` or `novel (action: resume)`. The Novel JSON includes a checksum field — a hash of the serialized state excluding the checksum field itself. On load, the server verifies the checksum against the loaded state. A mismatch follows the same recovery path as structural corruption: attempt backup restore, then surface the mismatch in `spec_health` and stderr if both are tainted. The checksum algorithm and field name are builder-determined; the convergence loop enforces that tainted state is detected.

**REQ-092e — Novel persistence (Part e).**
Undo snapshot stacks (REQ-041) persist with the Novel — they survive server restarts alongside all other Novel state tiers. The Novel JSON SHALL include a `novel_format_version` field — an integer, initially `2`, incremented when the Novel's on-disk schema changes incompatibly. On load, the server compares the stored version to the current format version. Version < current: trigger graceful migration per the existing load rules (absent-model fields receive ruleset-defined defaults; extra fields are preserved as inert data).

**REQ-092f — Novel persistence (Part f).**
For version 1 Novels, the server SHALL auto-migrate: if a `.holonovel-state/novels/<slug>.audit.jsonl` file exists alongside the Novel JSON, read all entries from the JSONL file, construct an `audit_log` array in the Novel, verify the hash chain end-to-end, delete the JSONL file, and set `novel_format_version` to `2`. If no JSONL file exists for a version 1 Novel, load with an empty `audit_log` array, record a `[migration-missing-audit]` audit entry, and set `novel_format_version` to `2`.

**REQ-092g — Novel persistence (Part g).**
Version > current: surface a `[WARNING] [format-future]` in `spec_health` — the Novel may contain fields the current server cannot interpret; the server loads the Novel with the existing graceful migration rules and the warning remains active until the format version matches. WHEN `TTRPG_NOVEL_COMPRESS` is `true` (configurable), the serialized Novel JSON SHALL be gzip-compressed before writing to disk. Backups SHALL be compressed when the primary is compressed.

**REQ-092h1 — Novel persistence (Part h1).**
The 4 MB health warning threshold in REQ-097 applies to the on-disk compressed size. The `novel (action: export)` output (REQ-096) SHALL stay uncompressed regardless of this setting — the interchange format is always uncompressed JSON or Markdown. The server SHALL record `TTRPG_NOVEL_COMPRESS` in the Novel's metadata for integrity verification on resume. A compressed Novel loaded with compression disabled SHALL produce a `[WARNING] [compression-mismatch]`; an uncompressed Novel loaded with compression enabled loads without issue.

**REQ-092h2 — Novel persistence (Part h2).**
*Acceptance criterion:* After 10 mutations, the Novel JSON on disk is non-empty and parseable; `cat novels/<slug>.json | jq .checksum` returns a non-empty string; `cat novels/<slug>.json | jq .novel_format_version` returns `2`; `cat novels/<slug>.json | jq .audit_log` returns an array with 10 entries; a version 1 Novel with a valid JSONL file auto-migrates on load; a corrupt primary file triggers backup restore. _Check:_ T77, T88, T156, T282.
**REQ-093a — Novel listing and metadata (Part a).**
`spec_health` reports available Novels on disk: slug, name, last-modified timestamp, and active flag. The `novel (action: list)` tool (REQ-257) is the dedicated save-file browsing surface. The `spec_health` report is the build-health dashboard. The `novel (action: info, slug?)` tool (REQ-258) returns extended metadata for a single Novel.

**REQ-093b — Novel listing and metadata (Part b).**
The active Novel's metadata includes many fields. The list has the creation timestamp, last-modified timestamp, entity count, adventure source (module slug, "generated", or "none"), setup-completion flags, story journal entry count, session count (distinct `TTRPG_SESSION_ID` values in the audit log), and cumulative play time (earliest-to-latest audit entry timestamp range). The list also has the last-active scene anchor, current combat round if in-combat, total combat rounds played across the Novel's lifetime, and a `sessions` array. Each per-session object carries `session_id`, `entry_count`, and `timespan_start`, plus `timespan_end`, `combat_rounds`, `significant_roll_count`, and `scene_transitions`, derived from `[session-boundary]` marker intervals (REQ-237).

**REQ-093c — Novel listing and metadata (Part c).**
This metadata appears in `badge_briefing` under the `novel` section token (added to REQ-082's documented token set). `novel://current` and `novel://<slug>` resources return full metadata, including the narrative directive (REQ-081). *Acceptance criterion:* `spec_health` lists available Novels with slug, name, last-modified, and active flag; the active Novel's metadata includes session count, cumulative play time, and last-active scene anchor. _Check:_ T78, T99.
**REQ-094a — Lorebook interchange (Part a).**
The Game Master may export Novel lore to and import lorebooks from interoperable formats. Export excludes mechanical state; import modifies only the lore tier with merge, replace, and dry-run modes. Round-trip preserves lore metadata. Formats are defined in Appendix L. Player badge attempts return `[ERROR] [FORBIDDEN]`.

**REQ-094b — Lorebook interchange (Part b).**
For a complete story package that includes lore alongside entities, NPCs, scene state, countdowns, and audit history, use `novel (action: export)` (REQ-096) — which embeds the lore tier within the Novel interchange format. `lore (action: export)` is the lore-only interchange pathway. *Acceptance criterion:* `lore (action: export)` → `lore (action: import, exported_data, "replace")` → `lore (action: export)` produces identical output; Player badge returns `[FORBIDDEN]`. _Check:_ T80. Merge mode adds entries whose keys are not present in the Novel's lore tier and preserves all existing entries unchanged.

**REQ-094c — Lorebook interchange (Part c).**
Duplicate keys — entries whose key matches an existing lore entry — are skipped with a count reported in the operation result. Replace mode clears the lore tier before importing, producing a lore set consisting solely of the import data. Dry-run mode reports which entries would be added, which would be skipped as duplicates, and which would be overwritten (replace only), without modifying state.
**REQ-096a — Novel interchange (Part a).**
`novel (action: export, format, scope?)` (Game Master only, format `json` or `markdown`, scope defaults to `full`) exports the active Novel's state in a self-contained interchange format per Appendix Q.

**REQ-096b — Novel interchange (Part b).**
The `scope` parameter selects the payload. The `full` scope covers all state tiers, the audit log, snapshots, and checkpoints (if `include_checkpoints=true`). The `state_only` scope covers all tiers except the audit log and checkpoints. The `lore` scope covers the lore tier only. The `world_model` scope covers rooms, things, exits, and properties. The `npcs` scope covers NPCs with personality fields, and the `factions` scope covers factions with clock state. The `secrets` scope covers secrets with known-by status, and the `relationships` scope covers relationship objects. The `gm_context` scope covers pause/resume context, the `notes` scope covers key-value notes, and the `story_journal` scope covers story journal entries. The `scene_history` scope covers the scene-state ledger.

**REQ-096c — Novel interchange (Part c).**
No dedicated `synthesis` scope — Ruleset Wisdom activation keys export as part of `full` scope in the manifest's `synthesis_activation` field; synthesis items export as the `synthesis` key in `full` scope (per Appendix Q). Each scope outputs Appendix Q schema with omitted keys for excluded tiers. Single scope per call. `novel (action: import, data, mode, strict?)` (Game Master only, mode `dry-run`, `replace`, or `merge`, strict defaults to `false`) imports a previously exported Novel. `dry-run` reports what would change without side effects. `replace` replaces the active Novel's state with the import data.

**REQ-096d1 — Novel interchange (Part d1).**
On import, the server SHALL validate eight conditions. Condition (a): the import's entity IDs are unique. Condition (b): NPC references in lore trigger lists resolve to NPCs in the import (or the existing Novel for merge mode). Condition (c): faction references in `gm_context.active_threads` resolve to factions in the import. Condition (d): relationship targets resolve to entities, NPCs, or factions in the import. Condition (e): world-model exit references resolve to rooms in the import. Condition (f): countdown names are unique in the import. Condition (g): clock `opposes` and `unlocks` references resolve to countdowns in the import. Condition (h): the server records adventure content referenced in `manifest.adventure_module_slugs` as missing with a warning when it is not embedded.

**REQ-096d2 — Novel interchange (Part d2).**
On import, the server SHALL additionally validate two conditions. Condition (i): the server flags Tier 2 synthesis items whose `source_url` the target server never fetched as `[stale]`. Condition (j): the server flags Tier 1 synthesis activation keys whose anchor does not resolve against the target build's current extraction as `[orphan]`.

**REQ-096e — Novel interchange (Part e).**
Tier 2 stale items and Tier 1 orphan items are imported inert (inactive). Module toggle state that references absent synthesis modules produces a warning. When `strict` is `true`, any staleness or orphan synthesis items also block the import. `dry-run` reports all validation failures with each item's path. In `replace` and `merge` modes, failures surface as `[WARNING]` with enumerated items but import proceeds. For one interchange-format version, the legacy `"dm_context"` scope string is accepted and aliased to `gm_context` on import.

**REQ-096f — Novel interchange (Part f).**
When `strict` is `true`, any validation failure blocks the import. The import returns `[ERROR] [STATE_CONFLICT]` for `replace` or `merge` modes, with the failure list in the error body. The `dry-run` mode produces a failure report with `isError: false`. The `merge` mode adds entities and NPCs from the import to the active Novel, skipping duplicates by entity or NPC ID. Player badge attempts return `[ERROR] [FORBIDDEN]`. A round-trip of export, import, and export produces identical output (full scope, same format).

**REQ-096g — Novel interchange (Part g).**
The export SHALL include a `manifest` object containing these fields. The `novel_format_version` field (defined in REQ-092) and `server_spec_version` field (CalVer from DECISIONS.md) describe the format and server. The `ruleset_hash` field stores the SHA-256 of the source ruleset. The `builder_implementation` field names the builder and version. The `adventure_module_slugs` field lists module slugs active at export time. The `adventures_embedded` field is true when adventures are embedded. The `property_groups_present` field lists populated tier names. The `waiver_dependent_mechanics` field lists mechanic names that depend on REQ-013 waivers recorded in DECISIONS.md.

**REQ-096h — Novel interchange (Part h).**
The manifest is advisory — `novel (action: import)` surfaces mismatches as warnings but does not block import. The `novel (action: export)` tool SHALL embed loaded adventure module content inline in the `adventure` key when `TTRPG_EXPORT_EMBED_ADVENTURES` is `true` (default `false`). When `false`, the export's `manifest.adventure_module_slugs` field records which adventure modules were active at export time, but their content is not embedded. The import target SHALL hold those modules indexed to restore adventure content.

**REQ-096i1 — Novel interchange (Part i1).**
Adventure modules embedded inline SHALL include their prose content (all narrative sections per REQ-079) and world-model assertions (`## World` section). Embedded content carries the module's build-time content hash for integrity verification on import. The server SHALL record `TTRPG_EXPORT_EMBED_ADVENTURES` in the Novel's build fingerprint as part of the Build workflow's Advanced questions (B9 area).

**REQ-096i2 — Novel interchange (Part i2).**
*Acceptance criterion:* `novel (action: export, "json")` → `novel (action: import, data, "dry-run")` reports changes without side effects; `novel (action: import, data, "replace")` restores the exported state; round-trip is byte-identical; `novel (action: export, "json", "lore")` produces a payload with only the lore tier present; `novel (action: import) (data, "dry-run", strict=true)` with broken references reports all failures and blocks import; `novel (action: export, "json")` includes a `manifest` object with all declared fields present. _Check:_ T100, T281.
**REQ-097a1 — Novel health (Part a1).**
`spec_health` SHALL report many fields for the active Novel. The report lists the NPC count, lore entry count, audit log entry count, story journal entry count, story journal total characters (on-disk byte count), snapshot stack depth, on-disk file size in bytes, the `synthesis_gap_count`, and a `healthy` flag. A configured `TTRPG_MAX_NPCS` near the NPC count triggers a warning; likewise `TTRPG_MAX_LORE_ENTRIES`, `TTRPG_MAX_SNAPSHOT_DEPTH`, and a 4 MB file-size ceiling. The `synthesis_gap_count` counts activated Tier 1 keys that no longer resolve against the current build's extraction, surfaced as `[synthesis-gap]` entries per REQ-080. The `healthy` flag is false if any warning is active.

**REQ-097a2 — Novel health (Part a2).**
`spec_health` reports a sliding window of Novel file-size deltas and snapshot depth deltas over the most recent sessions (distinct `TTRPG_SESSION_ID` values in the audit log, bounded to the last 7 by default).

**REQ-097b — Novel health (Part b).**
A Novel whose growth trajectory projects an on-disk file size exceeding 4 MB within the next 3 sessions is flagged with a `[size-growth]` warning. The file-size metric reported in `spec_health` SHALL match the on-disk file size as reported by the operating system, including all serialization overhead (encoding, checksum field, whitespace formatting). A file reported at size S bytes in `spec_health` whose on-disk size differs by more than 1% is a `[size-mismatch]` warning — indicating a durability or serialization defect. The growth trajectory SHALL use the on-disk size, not the in-memory representation size.

**REQ-097c — Novel health (Part c).**
Health metrics are badge-filtered: Player sees entity-level health only; GM sees all. *Acceptance criterion:* When NPC count approaches `TTRPG_MAX_NPCS`, `spec_health` reports a warning and `healthy` is false; a Novel at 3.9 MB with growth trajectory projects a `[size-growth]` warning. _Check:_ T101, T160.
**REQ-131a — Novel initialization order (Part a).**
When the server creates or resumes a Novel from disk, its property groups SHALL initialize such that cross-group dependencies resolve before dependents load (see §7.7.1). Dependencies are: Adventure content before NPCs (NPCs may reference adventure stat block templates per REQ-119), NPCs before Lore entries (Lore content may reference NPCs), Scene state last among property groups (Scene changes trigger Lore matching and Countdown hooks per REQ-083, REQ-125).

**REQ-131b — Novel initialization order (Part b).**
Synthesis activation keys (`synthesis_activated`, REQ-080) SHALL be loaded before synthesis state resolution, so that Tier 1 key resolution against current build output determines which synthesis items are active before any synthesis surfaces are computed. Combat state, pending workflows, remaining synthesis state, and audit log entries SHALL be restored after all property groups. An out-of-order initialization that produces observable differences in `badge_briefing` content, resource URI output, or tool behavior between two invocations of the same Novel against the same builder is a convergence finding.

**REQ-131c — Novel initialization order (Part c).**
The builder records the initialization order in DECISIONS.md (4). *Acceptance criterion:* Create a Novel with an adventure, an NPC referencing an adventure template, a lore entry mentioning the NPC, and a countdown with `on_scene_transition`. Restart. Assert `badge_briefing` surfaces adventure content, then the NPC (with template stats), then the triggered lore entry, then the countdown — in dependency order. The order IS stable across 3 restarts. _Check:_ T145.
**REQ-238a — Backup rotation (Part a).**
The server SHALL retain the last N backups of each Novel, configured via `TTRPG_NOVEL_BACKUP_COUNT` (minimum 1). Backups are named `<slug>.json.bak.1` through `<slug>.json.bak.N`. On each atomic write (REQ-092), existing backups rotate: `<slug>.json.bak.N-1` → `<slug>.json.bak.N`, through `.bak.1` → `.bak.2`, with the previous primary file (after fsync) becoming `.bak.1`. On load, if the primary file is corrupt (structural JSON error or checksum mismatch per REQ-092), the server attempts backup restore in order from `.bak.1` through `.bak.N`. The first parseable backup with a valid checksum wins, and a `[restored-from-backup]` audit entry records the backup index used.

**REQ-238b — Backup rotation (Part b).**
If no backup is parseable, the server follows the existing recovery path (stderr + `[corrupted-novel]` in `spec_health`). `novel (action: end)` moves all backup files to `.trash/` alongside the primary. Setting `TTRPG_NOVEL_BACKUP_COUNT=1` retains only the immediate previous backup. *Acceptance criterion:* After 10 mutations with `TTRPG_NOVEL_BACKUP_COUNT=3`, three rotated backup files exist; corrupting the primary and `.bak.1` triggers restore from `.bak.2`; `novel (action: end)` removes all backups. _Check:_ T276.
**REQ-240a — Clone Novel (Part a).**
The server SHALL provide a `novel (action: clone, source_slug, new_name, trim_audit_sessions?)` tool (callable with the Editor badge or Game Master badge). The tool creates an independent copy of the source Novel as a new Novel at `.holonovel-state/novels/<new_slug>.json`. All property groups defined in §7.7 plus host base-capability state (REQ-434–443) and NPC mind state (REQ-075f), the world-model tier, combat state, pending workflows, metadata, audit log, story journal, undo snapshots, and checkpoints (if present, REQ-241) SHALL be copied. Roster references are preserved — cloned entities point to the same roster IDs.

**REQ-240b — Clone Novel (Part b).**
The cloned Novel's `created_at` timestamp SHALL be the clone time; the clone is not activated — the caller's active Novel is unchanged. Returns `[STATE_CONFLICT]` if the target slug already exists. The optional `trim_audit_sessions` parameter (configurable, default null = full copy) strips audit entries older than N sessions from the clone, keeping only the most recent N sessions' entries (session boundaries determined by `[session-boundary]` markers per REQ-237). A new `clone` audit entry SHALL be recorded in both the source and cloned Novel.

**REQ-240c — Clone Novel (Part c).**
Player badge attempts return `[ERROR] [FORBIDDEN]`. *Acceptance criterion:* `novel (action: clone, "my-novel", "my-novel-fork")` creates an independent copy; mutating the clone does not affect the source; `spec_health` lists both Novels; `novel (action: clone, "my-novel", "my-novel-fork")` a second time returns `[STATE_CONFLICT]`; `novel (action: clone, "my-novel", "trimmed", trim_audit_ sessions=2)` clones with only the 2 most recent sessions' audit entries. _Check:_ T278.
**REQ-334a — Novel archive (Part a).**
THE server SHALL provide an `novel (action: archive, slug)` tool — Game Master only, and the Novel SHALL NOT be active in another connection. The tool marks the Novel as archived: the server moves the Novel file from `.holonovel-state/novels/<slug>.json` to `.holonovel-state/archive/<slug>.json`, along with its backup files. The active badge is deactivated; the Novel is no longer active. IF the Novel is active in another connection, THE system SHALL return `[STATE_CONFLICT]`. Archived Novels SHALL be read-only — all mutating tools SHALL return `[STATE_CONFLICT]` with corrective action directing the caller to `novel (action: unarchive)`.

**REQ-334b — Novel archive (Part b).**
Archive is distinct from trash (REQ-117): archived Novels are long-term reference files, never auto-deleted. `novel (action: list)` SHALL accept an optional `filter` parameter with values `active` (default, excludes archived and trashed), `archived` (archived-only), or `all`. The `novel (action: unarchive, slug)` tool SHALL restore an archived Novel to active status at `.holonovel-state/novels/<slug>.json` with full state preserved. The restore covers all property groups, host base-capability state (REQ-434–443), NPC mind state (REQ-075f), and metadata. Player badge returns `[FORBIDDEN]`. Archived Novels SHALL surface in `spec_health` under an `archived_novels` key with slug and archive timestamp.

**REQ-334c — Novel archive (Part c).**
Codex entries captured from an archived Novel via `codex (action: capture)` SHALL preserve their `source_novel` field — the archived Novel remains the provenance reference. *Acceptance criterion:* `novel (action: archive, "my-novel")` moves the file to `.holonovel-state/archive/my-novel.json`; `novel (action: list)` excludes it; `novel (action: list, filter="archived")` includes it with archive timestamp; `novel (action: resume, "my-novel")` returns `[STATE_CONFLICT]`; `novel (action: unarchive, "my-novel")` restores the Novel to active state with all property groups intact. `spec_health.archived_novels` lists the archived slug.

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
`badge_briefing` composition, and `command (action: suggest)` intent mapping. Parser
commands are a Game-Master tool — the Player badge never sees parser verb names
or the `command` tool. At every prominence level, the AI narrator resolves
player spatial intent through `command (action: resolve)` (REQ-323) without exposing parser
mechanics. At the
`secondary` level: In TTRPG builds, the parser `command` SHALL be
the only world-model tool visible in the primary help surface (under "World
Inspection", Game Master only) — and only when
a world model is populated. All other World tools (`world (action: create_room)`, `world (action: remove_room)`,
`world (action: create_thing)`, `world (action: remove_thing)`, `world (action: create_exit)`, `world (action: remove_exit)`, `world (action: convert)`)
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
demand (oracle, graph://novel, adventure (action: list)) SHALL have no briefing presence — they
are callable by the GM but do not push content into the briefing unprompted. Advisory
constraints (genre) render as a single line in the `novel` briefing section when set;
absent when unset.

**When you call on them, they are as helpful as anything else on the server.** Every
narrative tool inherits the full Holonovel UX contract: `[INVALID_INPUT]` with enumerated
valid options; `help("<tool_name>")` returns usage examples, parameter contracts, and
common workflows; `command (action: suggest, "<intent>")` maps player intent to narrative tools;
`[NOT_FOUND]` with nearest-match suggestions; `[STATE_CONFLICT]` with corrective action.

The acid test: when a new GM opens `badge_briefing` on a fresh Novel with no narrative
tools populated, the briefing SHALL look the same as it did before the tools were added.
When that same GM types `help("vow (action: set)")`, the server SHALL respond with the same level
of helpfulness as `help("countdown (action: set)")`.

**REQ-195a — World-model state tier (Part a).**
Every Novel SHALL carry a world-model state tier. The tier SHALL hold: rooms (named locations with descriptions and exits), things (named objects with descriptions, containment, and portability classification), exits (directional connections between rooms with associated door and openable/lockable state), and properties (either/or attributes on world-model objects: open/closed, locked/unlocked, fixed/portable, lit/dark). The tier SHALL be snapshot-able, audit-logged, and persistent with the Novel per REQ-088, REQ-092.

**REQ-195b — World-model state tier (Part b).**
World-model properties couple with other Holodeck surfaces per the coupling architecture (§7.7.1a — coupling rows citing P3, P13, P34, P38–P42). A Novel whose world-model tier has not been populated (no rooms declared) SHALL report an empty world model — the TTRPG layer is not dependent on world-model population. _Check:_ T238.
**REQ-196a — Parser command dispatch (Part a).**
THE parser command system SHALL accept natural-language text and resolve it against the world model's current state. The `command` tool is an AI-narrator resolution engine — the AI narrator calls it internally when the player describes spatial actions. The tool is Game Master only; Player badge calls return `[ERROR] [FORBIDDEN]`.

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
The parser command catalog SHALL classify every registered command verb into one of three coverage tiers. The `core` tier is the base vocabulary (go, look, examine, take, drop, inventory, wait) — always present. The `standard` tier comprises IF-community baseline verbs (open, close, lock, unlock, push, pull, search, read, sit, stand, wear, remove, eat, drink, light, extinguish, climb, jump, enter, exit, put, insert), available when the world model contains objects supporting the corresponding property.

**REQ-283b — Verb coverage tiers (Part b).**
The `extended` tier includes ruleset-derived verbs discovered via REQ-222. `command("help")` SHALL group commands by tier; `command("verbs")` SHALL report tiered coverage with per-tier counts; `world://kinds` SHALL report per-tier verb lists; `spec_health` SHALL include `parser_verb_coverage` with per-tier counts.

**REQ-283c — Verb coverage tiers (Part c).**
The tier classification is advisory — it signals parser completeness, not mechanical enforcement. *Acceptance criterion:* A populated world model with openable doors, readable books, and wearable items reports `core` tier verbs (7), `standard` tier verbs (12+ depending on world-model supports), and `extended` tier verbs per REQ-222. A ruleset with no additional verbs reports 0 `extended`. A world model with no openable objects reports the `open` and `close` verbs as registered but unavailable (annotated in the verb list). _Check:_ T333.
**REQ-284a — Implicit action hints (Part a).**
WHEN a parser command fails because a precondition is not met — a locked container before unlocking, a closed door before opening, an object in darkness — THE response SHALL include a hint naming the required action and object when that object exists and is reachable in the world model. Reachable means: the object is in the current room, in the player's inventory, or in an open container in either.

**REQ-284b — Implicit action hints (Part b).**
The hint SHALL be appended to the rule-violation message as a separate line: `Hint: You need the <object name> (<location>) first.` Examples: `command("open chest")` when the chest is locked and the iron key is in the player's inventory → `[RULE_VIOLATION] The chest is locked. Hint: You need the iron key (inventory) first.` `command("unlock chest")` when no key exists in the world model → `[RULE_VIOLATION] The chest is locked.` (no hint — no reachable key exists). The hint contract SHALL extend to the following precondition failures for new kinds, following the same reachability rules.

**REQ-284c — Implicit action hints (Part c).**
When a readable thing is inside a closed container in the room, the hint SHALL state the thing is inside the container — open it first. When a vehicle or climbable is in an adjacent room visible through an open exit, the hint SHALL name the room and direction. When targeting a switched-off device in a dark room, no hint is produced — switching the device is the solution.

**REQ-284d — Implicit action hints (Part d).**
When reading requires unworn wearable equipment, no hint is produced — the parser returns a `[RULE_VIOLATION]` listing the missing equipment type. *Acceptance criterion:* Create a world model with a locked chest and an iron key in the room. `command("open chest")` returns `[RULE_VIOLATION]` with a hint naming the iron key and its location. Remove the key from the world model — `command("open chest")` returns `[RULE_VIOLATION]` with no hint.

**REQ-284e — Implicit action hints (Part e).**
A readable inscription inside a closed glass jar produces "Hint: The inscription is inside the glass jar — open it first." A vehicle in an adjacent room produces the direction-bearing hint. A switched-off lantern produces no hint. _Check:_ T354.
**REQ-316a — Device kind (Part a).**
THE world-model layer SHALL define a `device` kind extending `thing`. A device SHALL carry `switchable` (can be turned on or off) and `switched_on` (current state) properties. A device that is both `lit` and `switched_on` SHALL provide light; a device that is `switched_off` SHALL be dark regardless of the `lit` property. A device is portable by default. `command("switch on <device>")` SHALL set `switched_on` to true; `command("switch off <device>")` SHALL set it to false. Switching a non-switchable thing SHALL return `[RULE_VIOLATION]`.

**REQ-316b — Device kind (Part b).**
The `switch on` and `switch off` commands SHALL be registered in the parser command catalog under `object_interaction` category, standard tier. The property assertions "It is switchable." and "It is switched on." SHALL be recognized by `world (action: convert)`. _Check:_ T361.
**REQ-317a — Vehicle kind (Part a).**
THE world-model layer SHALL define a `vehicle` kind extending `thing`. A vehicle SHALL carry `enterable: true` by default and `capacity` (maximum passengers, integer). A vehicle is `fixed` by default — it cannot be taken. When a player enters a vehicle via `command("enter <vehicle>")`, the player's current room SHALL become a virtual interior room derived from the vehicle's description. The vehicle interior SHALL have an `out` exit that returns the player to the room where the vehicle is parked.

**REQ-317b — Vehicle kind (Part b).**
While the player is aboard, `command("look")` SHALL show the interior description and list visible exits — the room the vehicle is parked in SHALL be visible as an `out` exit. Navigation commands (`go north`, `go south`, etc.) while aboard SHALL move the vehicle and all its contents (passengers and items) through the world-model exit graph — movement SHALL resolve against the room the vehicle occupies, not the vehicle interior. A vehicle SHALL persist at its last location when unoccupied.

**REQ-317c — Vehicle kind (Part c).**
A vehicle reaching capacity SHALL reject additional passengers with `[RULE_VIOLATION]`. `command("exit")` and `command("get out")` SHALL return the player to the room containing the vehicle. Vehicle interior rooms SHALL NOT appear in `world://map` independently — they are child objects of the vehicle, not world-graph nodes. The kind declaration "A raft is a vehicle. 'Description.' It is in the Lake." SHALL be recognized by `world (action: convert)`.

**REQ-317d — Vehicle kind (Part d).**
WHEN a player enters a vehicle via `command("enter <vehicle>")`, the server SHALL record a `[vehicle-entry]` story journal entry of type `moment` with the context `entered <vehicle>` and the vehicle's interior description. WHEN the player exits the vehicle, a `[vehicle-exit]` entry SHALL record the room returned to. These entries SHALL appear in `session (action: recap)` scene transitions and SHALL be surfaced in `badge_briefing` narrative context when present. This couples vehicle traversal into the narrative surface without affecting scene state — the GM's `scene (action: set)` remains authoritative. _Check:_ T362.
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
`world (action: convert)` SHALL recognize property assertions for each boolean
property: "It is wearable.", "It is readable.", "It is edible.", "It is
transparent.", "It is switched on.", "It is enterable.", "It is climbable."
The `read_text` property SHALL be settable via assertion: "The inscription
on the altar reads 'Beware the serpent.'" — `world (action: convert)` SHALL extract
the quoted text and assign it to `read_text` of the named thing.
_Check:_ T363.

**REQ-319a — Extended parser command vocabulary (Part a).**
THE parser SHALL recognize the following additional commands, each registered as `standard` tier (REQ-283) and resolving against world-model property contracts defined in REQ-316 through REQ-318. When a target lacks the required property, the command SHALL return `[ERROR] [RULE_VIOLATION]` naming the missing property.

**REQ-319b — Extended parser command vocabulary (Part b).**
Object interaction commands: `wear` (target must be wearable and in inventory, sets `worn_by`), `remove` (clears `worn_by`), `eat` (target must be edible, removed from inventory), `drink` (target must be drinkable), `push`/`pull` (movable things), `insert` (put in, synonym for `put in`), `light`/`extinguish` (light sources), `switch on`/`switch off` (switchable targets). Inspection commands: `read` (returns `read_text` or description), `listen`/`smell` (reports sensory objects, LLM composes prose), `touch` (tactile properties).

**REQ-319c — Extended parser command vocabulary (Part c).**
Navigation commands: `climb` (climbable targets with associated exits), `enter` (enterable containers/vehicles), `exit`/`get out` (returns to parent room), `sit` (supporters, records sitting), `stand` (ceases sitting). Meta commands: `again`/`g` (repeats last command, session-local), `it`/`them`/`all` (pronoun disambiguation). `world (action: convert)` directional exit adjacency SHALL associate a climbable thing with the exit in the same direction: when "A rope ladder is in the Entrance Chamber.

**REQ-319d — Extended parser command vocabulary (Part d).**
It is climbable." is followed by "Up of the Entrance Chamber is the Rookery.", the rope ladder SHALL be registered as the door for the `up` exit — `command("climb rope ladder")` SHALL resolve to `go up` through that exit. _Check:_ T364.
**REQ-320a — Narrative-intent parser verbs (Part a).**
THE parser SHALL recognize commands that route narrative intent to the Game Master rather than resolving mechanically. These commands SHALL be registered under a new `narrative` parser category and SHALL be standard tier. They SHALL produce `[OK]` with a description of the expressed intent and SHALL NOT simulate conversation or adjudicate outcomes. The intent SHALL be surfaced in `badge_briefing` under a Player Intent section.

**REQ-320b — Narrative-intent parser verbs (Part b).**
The `ask` and `tell` commands resolve an NPC by name in the current room and record the topic intent; `give` transfers a thing from inventory to the NPC; `show` records intent without transferring; `throw` moves a thing to the target's room without equipping it. NPC resolution SHALL match by name substring against NPCs whose location matches the current room.

**REQ-320c — Narrative-intent parser verbs (Part c).**
When no NPC matches in the current room, the command SHALL still record the intent with a `[WARNING]` marker — the player may be calling through a door or across a chasm. `command("help")` SHALL list narrative verbs under their own category with a note that outcomes are determined by the Game Master. _Check:_ T365.
**REQ-197a — Room description generation (Part a).**
WHEN the player enters a room or issues a look command THE system SHALL return the room's name, its verbatim description, and visible things with containment chains expressed in a standard format. The description SHALL be drawn from the source text — no generative prose is appended. Exit directions SHALL appear in status-line context, not in the room-description body. The system SHALL support three description modes settable via `command("brief")`, `command("verbose")`, and `command("normal")` (default).

**REQ-197b — Room description generation (Part b).**
In `brief` mode, `command("look")` returns only the room name and exit directions — the verbatim description and visible things are suppressed. In `verbose` mode, every room entry prints the full verbatim description regardless of whether the player has seen the room before. `normal` mode prints the full description on first entry only; subsequent entries into seen rooms return the name and exits.

**REQ-197c — Room description generation (Part c).**
The mode persists for the session — it is discarded on connection close. `command("brief")` and `command("verbose")` are always recognized verbs, even when the world-model tier is empty. `spec_health` SHALL report the current description mode. The `character (action: signal)` interface SHALL accept a `detail` signal with values `terse` (room name + exits only, minimal combat feedback — participant name + result, no full roll transparency), `normal` (balanced output), and `rich` (full descriptions, complete roll transparency, lore trigger notifications).

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
mechanical contracts for the kinds provided by the `holonovel` package (B10) and
surfaced at the `world://kinds` registry:
containers (open/closed, contents blocked when closed), supporters (surface things
visible and reachable, supporter fixed by default), doors (connect two rooms,
open/closed, closed blocks passage), persons (visible, examinable in rooms),
backdrops (visible from every room in a defined region), and regions (named room
groups). Every thing SHALL have a portability classification: `portable` (may be
taken) or `fixed` (may not be taken). Supporters are fixed by default. Containers
and unclassified things are portable by default. Taking a fixed thing SHALL return
a rule-violation. _Check:_ T243.

**REQ-201 — Hybrid source conversion.** THE system SHALL provide a
`world (action: convert)` tool that parses hybrid source text — declarative world-model
assertions interleaved with TTRPG annotations — into a linked world model +
TTRPG state. The tool operates only under the Game Master badge on an empty
Novel. Unrecognized assertion patterns SHALL produce not-implemented warnings
but SHALL NOT block recognized assertions.
_Check:_ T244.

**REQ-431a — Procedural world generation (Part a).**
The server SHALL provide `world (action: generate, seed?, options?)` — Game Master only — building a world-model scaffold from the ruleset's generation tables (REQ-213) and kind contracts (REQ-200). The tool SHALL produce rooms, things, exits, and properties as declarative assertions (Appendix K) in one atomic batch, submitted as a workflow decision (REQ-042) with `apply` and `discard` options. The draw sequence SHALL use the deterministic PRNG (REQ-050); the same seed with the same tables SHALL produce the same world across restarts.

**REQ-431b — Procedural world generation (Part b).**
`world (action: generate)` SHALL NOT fabricate mechanics — it instantiates only what generation tables and kind contracts define. A ruleset registering no generation tables SHALL return the content-absent message per REQ-214. Ruleset-free builds SHALL register the tool with an empty domain and return the same message. Player badge calls SHALL return `[FORBIDDEN]`.

**REQ-431c — Procedural world generation (Part c).**
The tool SHALL bound output by a configurable room cap (`TTRPG_WORLD_GEN_MAX_ROOMS`, default 20). Generated worlds SHALL respect world-model validation — exits reference generated rooms only; containment follows kind contracts.
*Acceptance criterion:* `world (action: generate, seed="42")` on a table-bearing ruleset produces a batch under the cap offered as a decision; applying creates the rooms; the same seed reproduces them; a table-less ruleset returns the content-absent message. _Check:_ T515.

**REQ-202a — World-model resources (Part a).**
URIs for the world-model tier: `room://<id>` (room name, description, visible things, exits), `thing://<id>` (thing name, description, location, properties), `world://map` (all rooms with exit connections — a navigable graph), `world://kinds` (kind hierarchy, property contracts, and parser command catalog from the `holonovel` package (B10)).

**REQ-202b — World-model resources (Part b).**
All world-model resources SHALL be badge-filtered: the Player badge sees only descriptions and visible state; the Game Master badge sees metadata including property values and containment chains. `world://map` SHALL return a list of room names with directional exits formatted as a navigable adjacency list. _Check:_ T245.
**REQ-222a — Parser command vocabulary extension (Part a).**
THE builder SHALL discover additional command verbs from the ruleset's equipment, action descriptions, and mechanical procedures. Verbs discovered during extraction SHALL be registered in the parser command catalog alongside the base vocabulary (REQ-196). A discovered verb SHALL map to one or more parser command categories — navigation, inspection, object interaction, inventory, or wait — based on the ruleset context from which it was extracted. Verbs that do not fit an existing category SHALL be registered under a `ruleset_custom` category.

**REQ-222b — Parser command vocabulary extension (Part b).**
The registered vocabulary SHALL be exposed at `world://kinds` under `parser_commands` with each verb's category and extraction source. Discovery SHALL NOT fabricate verbs — every registered verb SHALL cite a ruleset anchor per REQ-010.

**REQ-222c — Parser command vocabulary extension (Part c).**
When no additional verbs are discovered, the base vocabulary (REQ-196) is the complete command set. *Acceptance criterion:* A ruleset whose equipment section mentions "push" and "pull" as object interactions registers `push` and `pull` under object interaction category with source anchors; a ruleset with no additional verbs exposes only the base vocabulary at `world://kinds/parser_commands`. _Check:_ T264.
**REQ-309a — World and narrative surface prominence (Part a).**
`TTRPG_WORLD_PROMINENCE` configuration with three levels controlling the default surface emphasis of world-model and narrative infrastructure tools across the help task map, `badge_briefing` composition, and `command (action: suggest)` intent mapping. The setting SHALL be a build-time configuration recorded in DECISIONS.md (1) and SHALL be server-scoped — it applies as the default to every Novel, overridable per-Novel by `help (action: category)` (REQ-067) and `session (action: briefing_order)` (REQ-082). TTRPG resolution authority is unchanged by this setting — it affects presentation, not mechanics.

**REQ-309b — World and narrative surface prominence (Part b).**
On ruleset-bound Novels, parser `command` and all parser verb names SHALL be Game Master only. The Player badge SHALL never see parser verb names in help, `command (action: suggest)`, or any tool output on a ruleset-bound Novel. The AI narrator resolves player spatial intent through `command (action: resolve)` (REQ-323); `command (action: suggest)` under the Player badge on a ruleset-bound Novel SHALL map spatial intents to `command (action: resolve)`, never `command`. In ruleset-free mode (B1=`none`), the parser is the primary Player surface (REQ-218) — the Player badge MAY call `command` and see parser verbs. At `visible` (default): World-model and narrative tools SHALL appear in primary help categories.

**REQ-309c — World and narrative surface prominence (Part c).**
Parser `command` SHALL appear in "World Inspection" (GM only). `badge_briefing` SHALL include a dedicated world-model state section with an empty-state marker when the world-model tier is unpopulated. `command (action: suggest)` SHALL return `command (action: resolve)` for spatial intents under both badges; under the Game Master badge, `command (action: suggest)` SHALL also return parser `command` for spatial intents for direct world-model inspection. At `secondary`: World-model tools SHALL be placed in a secondary help category.

**REQ-309d — World and narrative surface prominence (Part d).**
Parser `command` SHALL appear as "World Inspection" in the GM-only tool surface — it SHALL NOT appear in Player help. `badge_briefing` SHALL fold world-model state into the scene state section; narrative-tool sections SHALL render only when their data is non-empty. `command (action: suggest)` SHALL NOT return parser commands for exploration or navigation intents; Player-badge spatial intents SHALL map to `command (action: resolve)`.

**REQ-309e — World and narrative surface prominence (Part e).**
At `prominent`: Parser `command` SHALL be a top-level GM help entry under "World Inspection"; world CRUD tools SHALL appear in a primary setup category. `badge_briefing` SHALL include world-model state in the decision-critical group. `command (action: suggest)` under the Game Master badge SHALL prefer parser `command` for spatial inspection; under the Player badge, `command (action: suggest)` SHALL return `command (action: resolve)` for all spatial intents. In ruleset-free mode (B1=`none`), the setting SHALL be skipped — the world-model and narrative layers are the primary surface by definition (REQ-218).

**REQ-309f — World and narrative surface prominence (Part f).**
The builder SHALL NOT record a `TTRPG_WORLD_PROMINENCE` value in DECISIONS.md when B1 is `none`, and the intake question (B12) SHALL NOT be asked. *Acceptance criterion:* A build with `TTRPG_WORLD_PROMINENCE=visible` produces the default help categorization (world-model and narrative tools in primary help). `TTRPG_WORLD_PROMINENCE=prominent` places parser `command` as a top-level GM help entry and includes world-model state in the decision-critical briefing group. `TTRPG_WORLD_PROMINENCE=secondary` produces a minimized surface with world-model tools in secondary categories.

**REQ-309g — World and narrative surface prominence (Part g).**
At all levels, Player-badge `command (action: suggest)` returns `command (action: resolve)` for spatial intents — never `command`. The prominence setting applies uniformly across badges— Game Master and Player receive the same world-model state surface in `badge_briefing`. Per-badge prominence overrides are a recognized future extension (a GM building world content may prefer `prominent` display emphasis while the Player navigating it prefers `secondary` display emphasis) but are out of scope for this revision.

**REQ-309h — World and narrative surface prominence (Part h).**
On ruleset-bound Novels, parser `command` tool access is badge-gated independently of prominence — the Player badge can never call `command` directly regardless of `TTRPG_WORLD_PROMINENCE` value. On ruleset-free Novels (B1=`none`), the parser remains a primary Player surface and `command` SHALL accept the `player`, `game_master`, and `observer` badges (observer read-only). _Check:_ T353.
**REQ-325a — Constraint override catalog (Part a).**
THE server SHALL expose constraint overrides (REQ-324) at a `constraints://active` resource. The resource SHALL be badge-filtered: Game Master sees all overrides; Player sees overrides for the active entity only. Each override entry SHALL carry: constraint type, mechanic name, mechanic source (spell, class_feature, item, ability), prerequisites (level, spell slot count, item name), and source anchor. `spec_health` SHALL report `constraint_override_counts` by constraint type and by mechanic source.

**REQ-325b — Constraint override catalog (Part b).**
Error responses that cite a world-model constraint SHALL include override hints when the active entity possesses a relevant bypass: `[RULE_VIOLATION] The door is locked. Hint: Knock (1 slot remaining) can open it.` Hints SHALL be sourced from the override catalog at call time — never hardcoded. When the entity has no relevant override, hints SHALL be absent.

**REQ-325c — Constraint override catalog (Part c).**
Override hints SHALL be badge-filtered: Player-badge errors SHALL enumerate only the active entity's overrides; Game Master-badge errors SHALL enumerate all known overrides. *Acceptance criterion:* A character with Knock prepared attempts to pass a locked door — `command (action: resolve, "go north")` returns an override hint citing Knock. A character without knock receives no hint. `constraints://active` returns overrides badge-filtered. _Check:_ T369.
**REQ-326a — Scene-world coupling (Part a).**
WHEN `scene (action: set)` provides a `location` that fuzzy-matches a world-model room name (case-insensitive, substring match with closest word-edit-distance for disambiguation), THE room SHALL become the scene's spatial truth. The room's description, exits, and contained visible things SHALL be composable into the scene's spatial reality.

**REQ-326b — Scene-world coupling (Part b).**
The GM's free-text `description` field SHALL serve as narrative framing of that reality — it may supplement or override the room's prose description but SHALL NOT contradict exit or containment data. `scene://current` SHALL include the resolved `room_id` and room name when a match exists. `command (action: resolve)` under the Game Master badge (for GM inspection) SHALL compose the full scene from room data and narrative framing. Under the Player badge, scene composition SHALL occur through AI narration via `command (action: resolve)` — the Player never sees room graph data directly.

**REQ-326c — Scene-world coupling (Part c).**
When the world model is unpopulated or no room name matches the location, `location` works as a free-text label (current behavior).

**REQ-326d — Scene-world coupling (Part d).**
Room-coupled scenes are backward compatible: unmatched location strings produce no spatial truth but remain valid scene labels. *Acceptance criterion:* `scene (action: set, "The throne room", location="Throne Room")` where world model has room "Throne Room" with exits [north, south] and contained things [throne, chandelier] — `scene://current` includes `room_id`, and `command (action: resolve)` returns exits and things. `scene (action: set, "The void", location="Nowhere")` where no room matches — `location` is a free-text label. _Check:_ T370.
**REQ-327a — NPC-world coupling (Part a).**
NPCs' `location` field SHALL resolve against the world-model room graph. When an NPC's `location` string fuzzy-matches a room name, the NPC SHALL be registered in that room. `command("look")` or equivalent inspection SHALL list the NPC among the room's present entities. `npc (action: create)` with a `location` matching a room name SHALL register the NPC in that room at creation time. `npc (action: update)` changes to `location` SHALL re-register the NPC — removed from the prior room (if any) and registered in the new room (if matched). NPCs whose location does not match any room SHALL NOT be registered in a specific room — their location is a free-text label.

**REQ-327b — NPC-world coupling (Part b).**
Room-registered NPCs SHALL appear in `room_context` of `command (action: resolve)` results for that room. NPC presence in `badge_briefing` and `party://current` SHALL continue to be governed by `characters_present` on `scene (action: set)` (REQ-307) — room registration supplements, it does not replace presence tracking. *Acceptance criterion:* `npc (action: create, "Blacksmith", location="Forge")` where world model has room "Forge" — `command (action: resolve, "look")` from Forge lists Blacksmith. `npc (action: update, "blacksmith", location="Inn")` — Blacksmith is no longer in Forge; listed in Inn.

**REQ-327c — NPC-world coupling (Part c).**
No matching room — Blacksmith carries free-text location only. _Check:_ T371.
**REQ-367a — Property propagation across containment (Part a).**
WHEN a container or vehicle carries a property that affects perception of its contents, the property SHALL propagate from the container boundary. Propagation SHALL evaluate containment from outermost to innermost. An opaque or `dark` container at any level in the chain SHALL block perception of all recursively contained things — propagation SHALL stop at the first opaque boundary. Inner containers' `transparent` properties are irrelevant when an outer container is opaque.

**REQ-367b1 — Property propagation across containment (Part b1).**
A `transparent` container containing a `lit` and `switched_on` device SHALL report the device's light state to the room — "a glowing lantern (inside the glass case)." A `transparent` container containing a `lit` device that is `switched_off` SHALL NOT report light — "a dark lantern (inside the glass case)." A `dark` container SHALL block perception of its contents regardless of `transparent` — "a brass urn (opaque, what's inside is hidden)." A vehicle interior SHALL inherit the `lit`/`dark` state of the vehicle's exterior room unless the vehicle itself is `lit`. `command("look")` output SHALL reflect propagated state.

**REQ-367b2 — Property propagation across containment (Part b2).**
*Acceptance criterion:* A world model with a transparent jar containing a switched-on lantern in a dark room — `command("look")` reports "a glowing lantern (inside the glass jar)." Switch the lantern off — `command("look")` reports "a dark lantern (inside the glass jar)." Place the jar inside an opaque iron chest — `command("look")` does not mention the lantern.

**REQ-367c — Property propagation across containment (Part c).**
A vehicle in a dark cave with the vehicle itself `lit` — interior shows as lit; vehicle not `lit` — interior inherits dark. _Check:_ T418.
**REQ-368a — Countdown-world effect coupling (Part a).**
Countdowns SHALL accept an optional `world_effect` field. WHEN a countdown with `world_effect` fires, the effect SHALL be applied immediately after the countdown is removed from active countdowns.

**REQ-368b — Countdown-world effect coupling (Part b).**
The `world_effect.type` is one of `describe` (change room description), `property` (toggle a world-model property), or `exit` (open/close/create/remove an exit). `describe` with `target=<room_id>` and `value="<description>"` SHALL replace the target room's description field, preserving the prior description in the undo snapshot. `property` with `target=<thing_id>`, `property=<name>`, `value=<new_value>` SHALL set the target thing's property — only properties defined in REQ-318 are addressable. `exit` with `target=<room_id>`, `direction=<dir>`, `destination=<room_id>` SHALL create the exit per REQ-198 with implicit reverse exit.

**REQ-368c — Countdown-world effect coupling (Part c).**
All `world_effect` mutations are snapshot-able and surfaced in `badge_briefing` `narrative_threads` as `[countdown-effect]`. WHEN a countdown with `world_effect` fires and the referenced target has been deleted between creation and firing, the countdown SHALL still fire — removed from active countdowns and recorded in the audit log with a `[WARNING]` entry carrying the effect type, target ID, and `target missing — effect not applied` annotation. The countdown is not re-queued.

**REQ-368d — Countdown-world effect coupling (Part d).**
An `undo` that restores the deleted target before the countdown fires SHALL restore the effect's ability to apply. *Acceptance criterion:* `countdown (action: set, "flood", 3, type="narrative", world_effect={type:"describe", target:"cellar", value:"Knee-deep water fills the cellar, rising fast."})`. Advance three narrative ticks — assert countdown fires, cellar room description replaced, prior description in undo snapshot.

**REQ-368e — Countdown-world effect coupling (Part e).**
Create countdown with `world_effect.target="nonexistent"` and fire — assert `[WARNING] target missing — effect not applied` in audit log. _Check:_ T419. *Out of scope:* multiplayer synchronization, real-time collaborative editing, save-Novel versioning beyond the checksum model, and Novel migration between different rulesets.

### 5.11 Ruleset-Free Build Mode

**REQ-218a — Ruleset-free build (Part a).**
WHEN the Build workflow is selected with B1 set to `none` THE builder SHALL operate in ruleset-free mode. THE builder SHALL NOT perform chunked reading, extraction, or mechanical modeling of ruleset content. THE server SHALL register every REQ-020 infrastructure tool category (World, Novels, Narrative, Badges & Workflow), every REQ-022 resource URI, and every REQ-023 prompt. Ruleset-dependent tools — canonical lookups, dice-resolution tools, and any tool whose registry depends on extracted mechanics — SHALL be waived under REQ-013 or registered with empty domains that return content-absent responses.

**REQ-218b — Ruleset-free build (Part b).**
The world-model layer (§5.10) SHALL be populated from the kind hierarchy, property
contracts, and parser command catalog provided pre-built by the `holonovel`
package at B10 and surfaced at the `world://kinds` registry (REQ-200, REQ-202a).
`ruleset (action: search)` SHALL return an empty result set with a clear message indicating no
ruleset is indexed. `ruleset (action: roll)` SHALL return the content-absent message per REQ-214. Navigational couplings (§7.7.1) SHALL be active — World→Scene, Scene→Lore, Scene→Countdown, and other Advisory/Navigational nature rows function in ruleset-free mode.

**REQ-218c — Ruleset-free build (Part c).**
Mechanical couplings (Mechanics→World, Mechanics→NPC, and Ruleset Wisdom couplings) SHALL be inert — no ruleset means no mechanical resolution to drive coupling effects. Verification workflow G0b and G2 SHALL use the Appendix W fixture in place of Appendix B or N. Handoff verification steps H1 and H10 SHALL be skipped for ruleset-free builds — there is no source edition/title to compare and no extraction confidence to measure. _Check:_ T259.
**REQ-219a1 — Ruleset-free entity creation (Part a1).**
When the ruleset defines no classes, species, or equipment, THE `character (action: create)` tool SHALL accept a name and optional personality fields per REQ-077 (description, voice, background, goals). The tool SHALL produce a roster entry with no mechanical fields — only name and narrative fields. The `character (action: sheet)` rendering for a ruleset-free entity SHALL display the entity's name and populated personality fields; no stat block is rendered. Import into a Novel follows the standard import contract (REQ-055). The roster entry is a permanent baseline; its narrative fields are mutable per REQ-077.

**REQ-219a2 — Ruleset-free entity creation (Part a2).**
The entity is valid as a combat participant in `combat (action: init)` — it receives a turn in the order and auto-advances with an `[auto]` marker without mechanical effects (dangers and entities have no hit points, no damage, and no death state). `command (action: suggest)` SHALL include the entity's name and narrative fields in context but SHALL return no mechanical action suggestions. _Check:_ T260.
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

The coupling advisories in this section (REQ-355 through REQ-365) match by
token containment against a named field — an entity ID, lore key, secret key,
faction goal, or countdown scope/direction. Every fixture in Appendix F that
exercises a coupling advisory SHALL carry setup whose matched token appears
verbatim in the field the contract names; a fixture whose `scope`, `direction`,
or other matching field does not contain the referenced token is a spec defect.

**REQ-335a — Scene beat taxonomy (Part a).**
The server SHALL support scene beat annotation alongside scene type (REQ-087). Valid beat values are: `setup`, `escalation`, `turning_point`, `climax`, `resolution`, and `denouement`. Beats SHALL be set via `scene (action: set)` as an optional `beat` parameter. The current beat SHALL surface in `badge_briefing` as a sub-element of the scene state section, immediately after the scene type tag, in the form `Beat: <beat>`.

**REQ-335b — Scene beat taxonomy (Part b).**
A scene without an explicit beat SHALL carry the default `mid_scene`. `session (action: recap)` SHALL include beat transitions alongside scene transitions in the `scene_transitions` array as `beat_before` and `beat_after` pairs. A scene transition that retains the same beat SHALL NOT record a beat transition. The beat taxonomy is a fixed vocabulary — the six values in REQ-335a are the only valid beats, and the server SHALL reject unrecognized values with `[INVALID_INPUT]`; the GM may set any *valid* beat at any time and the server does not enforce beat progression sequences.

**REQ-335c — Scene beat taxonomy (Part c).**
Scene beat SHALL influence countdown advancement rate per REQ-353. *Acceptance criterion:* `scene (action: set, "The hall darkens", beat="escalation")` surfaces `Beat: escalation` after the scene type tag in `badge_briefing`. `session (action: recap)` includes `beat_transitions` showing `{from: "mid_scene", to: "escalation", timestamp: <ISO>}`. Setting the same beat on consecutive `scene (action: set)` calls produces no beat transition entry. _Check:_ T385.
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
The server SHALL track the count of tool calls (mutating and non-mutating) since the last scene transition or beat change. When the count exceeds a configurable ceiling (`TTRPG_PACING_WINDOW`), `badge_briefing` SHALL include a pacing signal in the `narrative_threads` section (REQ-281): `[pacing] Scene stabilized — N actions since last transition.` The signal is advisory — it does not block or auto-advance narration. The ceiling SHALL be configurable via `TTRPG_PACING_WINDOW`; setting it to zero disables pacing signals. The pacing counter resets on every `scene (action: set)` call (scene transition) and on every beat change.

**REQ-336b — Dramatic pacing signal (Part b).**
When a pacing signal fires, the server SHALL additionally trigger autonomous advancement per REQ-351. *Acceptance criterion:* After 21 tool calls with no scene transition, `badge_briefing` includes `[pacing] Scene stabilized — 21 actions since last transition.` After `scene (action: set, "new scene")`, the counter resets and the signal disappears. Setting `TTRPG_PACING_WINDOW=0` suppresses all pacing signals. _Check:_ T386.
**REQ-351a — Pacing-triggered autonomy (Part a).**
When a pacing signal fires per REQ-336, the server SHALL immediately perform one autonomous advancement cycle: (a) every faction clock SHALL receive one autonomous tick per REQ-338 (regardless of whether the `TTRPG_FACTION_AUTONOMY_INTERVAL` threshold has been met — the pacing signal overrides the interval), and (b) every NPC with a populated `goals` field SHALL produce a goal pursuit suggestion per REQ-339 (regardless of disposition change status — the pacing signal triggers suggestions for all goal-carrying NPCs). The combined advancement SHALL be recorded in the audit log as `[pacing-autonomy]` with a list of factions and NPCs affected.

**REQ-351b — Pacing-triggered autonomy (Part b).**
The REQ-348 faction-NPC coordination rule SHALL apply during pacing-triggered autonomy: if a faction tick outcome overlaps an NPC's goal, that NPC's suggestion SHALL be suppressed as normal. Pacing-triggered autonomy SHALL fire at most once per `TTRPG_PACING_WINDOW` window — if play continues without a scene transition past a second window, the pacing signal re-fires but autonomy does not re-trigger until a scene transition resets the pacing counter. This contract implements the narrative intuition that "while you were deliberating, the world moved." *Acceptance criterion:* Set `TTRPG_PACING_WINDOW=3`.

**REQ-351c — Pacing-triggered autonomy (Part c).**
Create faction with clock and NPC with goal. Perform 4 tool calls without scene transition — assert pacing signal fires AND audit log records `[pacing-autonomy]` with faction tick and NPC suggestion. Perform 4 more tool calls — assert pacing signal re-fires but `[pacing-autonomy]` does NOT re-trigger (already fired this window). Call `scene (action: set, "new scene")` — assert counter resets. Perform 4 more tool calls — assert `[pacing-autonomy]` fires again. _Check:_ T401.
**REQ-337a — Narrative arc visibility (Part a).**
`badge_briefing` (REQ-281) SHALL include a `story_beats` line showing the sequence of completed beats within the current Novel in chronological order, gated by badge scope: `shared` beats visible to both badges; `game_master` beats visible to GM only. The sequence SHALL list beat names with the scene description preview (first sentence) that produced them, e.g., `setup (\"The hall is quiet...\") -> escalation (\"The torches flicker...\")`. An empty sequence SHALL render `[No beats completed.]`.

**REQ-337b — Narrative arc visibility (Part b).**
The sequence SHALL NOT exceed the most recent `TTRPG_STORY_BEAT_WINDOW` completed beats (default 10). *Acceptance criterion:* After three `scene (action: set)` calls with beats `setup`, `escalation`, `climax`, `badge_briefing` includes the three-beat sequence. After 12 beat transitions, only the most recent 10 appear. An empty sequence renders the empty-state marker. _Check:_ T387.
**REQ-352a — Codex adventure beat sequences (Part a).**
`adventure` (REQ-321) MAY carry an optional `suggested_beats` field — an array of `{beat, scene_preview}` pairs where `beat` is a valid beat value per REQ-335 and `scene_preview` is a one-sentence scene descriptor. When a Novel is created via `novel (action: create, codex_adventure=...)` (REQ-088) or an adventure is imported via `codex (action: import)` (REQ-321) into an active Novel, and the adventure entry carries `suggested_beats`, the sequence SHALL pre-populate the `story_beats` briefing surface (REQ-337) with `[adventure-scaffold]` annotation.

**REQ-352b — Codex adventure beat sequences (Part b).**
Scaffold beats are advisory — the GM may override any beat via `scene (action: set, beat=...)` at any time. A GM-set beat at a scaffold position replaces the scaffold entry. Scaffold beats SHALL NOT appear in `beat_transitions` in `session (action: recap)` until a scene transition actually adopts them — only GM-confirmed or auto-adopted beats enter the transition history.

**REQ-352c — Codex adventure beat sequences (Part c).**
Adventure entries without `suggested_beats` SHALL produce no pre-population. *Acceptance criterion:* Create Codex adventure entry with `suggested_beats: [{beat: "setup", scene_preview: "The tavern is quiet..."}, {beat: "escalation", scene_preview: "A fight breaks out..."}]`. Call `novel (action: create, codex_adventure=...)` — assert `badge_briefing` `story_beats` shows both beats tagged `[adventure-scaffold]`. Call `scene (action: set, "The tavern hums", beat="setup")` — assert first scaffold beat replaced, no `[adventure-scaffold]` tag on this entry.

**REQ-352d — Codex adventure beat sequences (Part d).**
Advance to second beat — assert second scaffold beat still tagged `[adventure-scaffold]` until GM confirms it. Call `codex (action: import)` of an adventure WITHOUT `suggested_beats` — assert no beat pre-population. _Check:_ T402.
**REQ-338a — Faction autonomous advancement (Part a).**
Faction clocks (REQ-233) SHALL advance one tick on each scene transition per the existing coupling contract. In addition, faction clocks SHALL advance one autonomous tick per `TTRPG_FACTION_AUTONOMY_INTERVAL` scene transitions (configurable) to represent faction pursuit of goals off-screen. The autonomous tick SHALL be recorded in the faction's clock with an `[autonomous]` annotation. Faction clocks with `TTRPG_FACTION_AUTONOMY_INTERVAL` set to zero SHALL NOT receive autonomous ticks — only scene-transition and GM-triggered advancement applies.

**REQ-338b — Faction autonomous advancement (Part b).**
Autonomous advancement SHALL NOT fire linked countdowns without GM awareness: when an autonomous tick would fire a linked countdown, the countdown SHALL surface a `[pending-fire]` annotation in `badge_briefing` `narrative_threads` section (REQ-281) requiring GM confirmation via a workflow decision. *Acceptance criterion:* A faction with `TTRPG_FACTION_AUTONOMY_INTERVAL=3` advances its clock by one autonomous tick on the 3rd, 6th, and 9th scene transition. The tick is annotated `[autonomous]` in the clock state.

**REQ-338c — Faction autonomous advancement (Part c).**
An autonomous tick that would fire a linked countdown produces a `[pending-fire]` decision in `badge_briefing`. Setting the interval to zero suppresses all autonomous advancement. _Check:_ T388. Coordination with NPC goal pursuit per REQ-348.
**REQ-339a — NPC goal pursuit (Part a).**
(REQ-077) and the NPC's current disposition differs from its creation default, `badge_briefing` SHALL surface a `## World in Motion` suggestion once per scene transition: the NPC's name, its current goal, a brief description of what the NPC might do to pursue that goal off-screen, and three response options: `accept` (apply the described state change), `defer` (re-surface at next transition), `dismiss` (do not re-surface). The suggestion SHALL be derived from the NPC's goals text and disposition, surfaced as a decision workflow.

**REQ-339b — NPC goal pursuit (Part b).**
Deferred suggestions SHALL re-appear at every subsequent scene transition until accepted or dismissed. Dismissed suggestions SHALL NOT re-appear for the same NPC in the same Novel. The feature is disabled by default (`TTRPG_NPC_AUTONOMY=off`); the GM enables it per Novel. *Acceptance criterion:* Create an NPC with `goals="Steal the crown"` and `disposition="suspicious"` (differs from default `neutral`). Set `TTRPG_NPC_AUTONOMY=on`. Call `scene (action: set, "Throne room")` — assert `badge_briefing` `## World in Motion` includes a goal-pursuit suggestion.

**REQ-339c — NPC goal pursuit (Part c).**
Accept it — assert the described state change applies, suggestion does not re-appear. Defer — assert it re-appears at next transition. Dismiss — assert it does not re-appear. `TTRPG_NPC_AUTONOMY=off` — assert no suggestions. _Check:_ T389.
**REQ-339d — NPC goal pursuit (Part d).**
WHEN `TTRPG_NPC_MIND=on` and an NPC carries a populated `directive` (REQ-075f), the goal-pursuit suggestion SHALL offer `auto-apply` alongside `accept`, `defer`, and `dismiss`. `auto-apply` SHALL apply the described state change immediately and SHALL direct the narrator to play the NPC from the directive and mind journal on later initiative turns. The change SHALL be audit-logged as `[npc-mind]`. `auto-apply` SHALL NOT appear when `TTRPG_NPC_MIND=off`; mind-driven behavior SHALL NOT fabricate mechanics — effects resolve through existing ruleset tools per REQ-050.
*Acceptance criterion:* with `TTRPG_NPC_MIND=on`, a directive-carrying NPC surfaces `auto-apply`; selecting it applies the change with an `[npc-mind]` entry; with the variable off the option is absent. _Check:_ T514.
**REQ-348a — Faction-NPC goal coordination (Part a).**
When a faction clock receives an autonomous tick per REQ-338, the server SHALL compare the faction's goal description against each NPC's `goals` field. If a faction clock advancement represents an outcome that overlaps with an NPC's current goal — the faction name or goal text intersects the NPC's goal text — the NPC goal pursuit suggestion for that NPC SHALL be suppressed for that scene transition. The suppression SHALL be recorded in the audit log as `[faction-npc-coordination]` with the faction ID, NPC ID, and suppressed goal text.

**REQ-348b — Faction-NPC goal coordination (Part b).**
The suppression is per-transition: if the next scene transition produces no autonomous tick, the NPC goal pursuit SHALL resume. When `TTRPG_NPC_AUTONOMY=off`, faction autonomous advancement SHALL proceed normally per REQ-338 without NPC coordination. The contract prevents duplicate World-in-Motion events for the same narrative outcome. *Acceptance criterion:* Create faction "Merchant Guild" with goal "Expand to East Dock". Create NPC "Guildmaster Kael" with `goals="Secure the East Dock contract"`. Set `TTRPG_FACTION_AUTONOMY_INTERVAL=3` and `TTRPG_NPC_AUTONOMY=on`.

**REQ-348c — Faction-NPC goal coordination (Part c).**
Advance through 3 scene transitions — assert autonomous tick fires, faction clock advances, and Guildmaster Kael's goal pursuit suggestion is suppressed with `[faction-npc-coordination]` audit entry. Advance 1 more transition (no faction tick) — assert Kael's goal pursuit resumes. _Check:_ T398.
**REQ-340a — Discovered consequences (Part a).**
When a countdown fires while the active entity's characters are not present in the scene where the countdown was linked — entity IDs absent from `characters_present` on all scenes since the countdown was created — the consequence SHALL be surfaced as a `[discovered]` story journal entry of type `consequence` (REQ-246). The entry SHALL carry: the countdown name, the consequence description, the timestamp of discovery (the scene transition when the player's entity next becomes present in a scene linked to the countdown's location), and a `discovered` boolean set to `true`.

**REQ-340b — Discovered consequences (Part b).**
The entry SHALL appear in `session (action: recap)` `narrative_orientation` as a "Meanwhile, ..." prose fragment. Countdowns that fire while the player's entity IS present SHALL produce standard `consequence` entries with `discovered` unset. A `[discovered]` consequence SHALL populate the discovering entity's `knowledge_state` per REQ-349. *Acceptance criterion:* Create a countdown linked to Guard Room. Set entity absent (not in `characters_present`). Advance countdown to fire. Set entity present in Gatehouse scene (different location). Advance scene — no discovery.

**REQ-340c — Discovered consequences (Part c).**
Set entity present in Guard Room scene — assert `[discovered]` story journal entry created with "Meanwhile, ..." orientation text. Countdown fires with entity present — assert standard `consequence` entry without `discovered`. _Check:_ T390.
**REQ-349a — Consequence-to-knowledge coupling (Part a).**
When a `[discovered]` consequence fires per REQ-340, the discovering entity's `knowledge_state` (REQ-286) SHALL be populated with a `discovered_consequence` entry carrying: the countdown name, the consequence description, the timestamp of discovery, and a `source: discovered_consequence` field with the countdown ID. The entry SHALL surface in `badge_briefing` under the `knowledge_state` section token as `[discovered]` followed by the consequence text.

**REQ-349b — Consequence-to-knowledge coupling (Part b).**
If the discovering entity was absent from all scenes since the countdown's creation (per REQ-340 presence check), the discovery represents genuine new knowledge — the entity SHALL know what happened off-screen. If multiple entities discover the same consequence (are all present when the countdown location is reached), each entity's `knowledge_state` SHALL receive the entry independently. Consequence knowledge SHALL persist in `knowledge_state` across scene transitions and Novel restarts. *Acceptance criterion:* Create countdown linked to Guard Room. Set rogue_01 absent. Advance countdown to fire.

**REQ-349c — Consequence-to-knowledge coupling (Part c).**
Set scene to Guard Room with rogue_01 present — assert `[discovered]` story journal entry AND `knowledge_state` includes `discovered_consequence` entry. Create countdown linked to Forge. Set rogue_01 and wizard_01 absent. Advance to fire. Set scene to Forge with both present — assert both entities receive the knowledge entry. _Check:_ T399.
**REQ-341a — Player-facing spatial surface (Part a).**
When the world-model tier is populated (REQ-195), the Player badge SHALL have access to a resolved spatial surface through `badge_briefing`: the scene state section SHALL include the current room name, visible exits (direction labels only — not destination names), and visible things in the room. The spatial surface SHALL NOT include room IDs, exit destination IDs, or world-model internal names.

**REQ-341b — Player-facing spatial surface (Part b).**
The AI narrator resolves the player's spatial intent through `command (action: resolve)` (REQ-323) without exposing parser mechanics; the spatial surface in `badge_briefing` gives the player direct awareness of surroundings without requiring the AI narrator to explicitly describe every detail.

**REQ-341c — Player-facing spatial surface (Part c).**
When the world-model tier is unpopulated, no spatial surface appears — the empty-state marker renders `[No world model — surroundings are as described by the GM.]`. *Acceptance criterion:* A populated world model with rooms, exits, and things produces a spatial surface in Player `badge_briefing` containing the room name, exit directions, and visible things — without IDs or internal names. An unpopulated world model produces the empty-state marker. _Check:_ T391.
**REQ-342a — Scene description from world-model state (Part a).**
When `scene (action: set)` is called with a `location` parameter that resolves to a world-model room (REQ-195), the scene SHALL derive a base description from the room's world-model state: the room description string, a list of contained things, a list of visible NPCs registered in the room (REQ-327), and visible exits with their direction labels. The GM's `description` parameter SHALL override the derived description. When `description` is empty and `location` resolves, the derived world-model description SHALL serve as the scene description.

**REQ-342b — Scene description from world-model state (Part b).**
When `location` does not resolve to any room, the `description` parameter SHALL be the sole scene description as before. This contract ensures the GM describes a room once — the world model is the source of spatial truth. *Acceptance criterion:* `scene (action: set, "", location="Throne Room")` with the Throne Room containing a throne thing and two NPCs produces a scene description derived from the room description and its contents. The same call with an explicit `description` parameter uses the explicit description. A `location` that does not match any room uses the `description` alone. _Check:_ T392.
**REQ-343a — Unified intent resolution (Part a).**
(REQ-084) SHALL resolve player intent across three domains — mechanical (resolution tools), spatial (command (action: resolve), REQ-323), and social (NPC interaction, disposition context, persuasion) — and return suggested actions from all matching domains in the response, grouped by domain. The response SHALL include, for each domain with at least one match: a domain header, the matching tools or actions with parameters, and a confidence indicator for each match. When the intent spans multiple domains, `command (action: suggest)` SHALL return suggestions from all matching domains ordered by relevance.

**REQ-343b — Unified intent resolution (Part b).**
The tool SHALL accept an optional `entity_id` parameter; when provided, entity-specific context (personality fields per REQ-077, voice examples, equipment, known abilities) SHALL be included in the match weighting. Spatial domain results SHALL delegate to `command (action: resolve)` (REQ-323) for exit, constraint, and thing context. The intent resolver SHALL call `command (action: resolve)` with the player's spatial intent — the response SHALL incorporate the resolved room context, exits, constraints, and override hints — rather than independently querying the world model.

**REQ-343c — Unified intent resolution (Part c).**
This ensures spatial suggestions and parser-based navigation draw from the same resolution pipeline. Social intents SHALL resolve against: the target NPC's disposition (REQ-075), the caller entity's relationship to the target (REQ-236), any active scene type of `social` (REQ-087), and the ruleset's social-skill catalogue.

**REQ-343d — Unified intent resolution (Part d).**
The resolution SHALL return: the most relevant skill check tool with the target NPC's name as context, any available constraint overrides that could affect the outcome (REQ-325), and a narrative framing hint derived from the NPC's personality fields. *Acceptance criterion:* `command (action: suggest, "convince the guard to let us pass", entity_id="bard_01")` returns mechanical suggestions (skill check with persuasion), spatial context (current room exits), and social context (guard's disposition, relationship). A purely mechanical intent ("attack the goblin") returns only mechanical suggestions. _Check:_ T393.
**REQ-344a — Voice example feedback (Part a).**
The Player badge SHALL be able to provide feedback on the AI narrator's portrayal of their entity's voice through `character (action: signal)` (REQ-078). A `signal="voice_feedback"` with a `value` containing a corrected dialogue snippet SHALL cause the server to: (a) append the corrected snippet to the entity's `voice_examples` array (REQ-077) tagged `[player-corrected]` with the original snippet context; (b) record a `[voice-feedback]` entry in the audit log (REQ-040) with the original and corrected text; (c) surface the correction in `badge_briefing` under the entity's personality group as a `[voice-corrected]` annotation on the relevant voice example.

**REQ-344b — Voice example feedback (Part b).**
A correction replaces the AI-generated snippet's `dialogue` text while preserving `context` and `tag` fields. The `[player-corrected]` annotation SHALL render visually distinct from synthesis `[supplementary]` tags (REQ-080) and Codex `[codex-corrected]` tags (REQ-347) in `badge_briefing` — each annotation reflects a different provenance tier (player feedback, community synthesis, cross-Novel Codex import). The Player may issue up to 3 corrections per session (configurable via `TTRPG_MAX_VOICE_CORRECTIONS_PER_SESSION`); exceeding the limit SHALL return `[WARNING] Voice correction limit reached for this session.`.

**REQ-344c — Voice example feedback (Part c).**
The limit resets on `TTRPG_SESSION_ID` change per REQ-237. Voice corrections SHALL be capturable to the Codex for cross-Novel persistence per REQ-347. *Acceptance criterion:* `character (action: signal, "voice_feedback", "She wouldn't say that — she'd say 'The door is trapped. Stand back.'")` appends a `[player-corrected]` snippet. `badge_briefing` shows the correction. `character (action: sheet)` shows the updated voice example. Fourth correction in same session returns `[WARNING]`. Session ID change resets the limit. _Check:_ T394.
**REQ-347a — Voice feedback codex capture (Part a).**
Voice feedback corrections stored in entity `voice_examples` per REQ-344 SHALL be capturable to the Codex (REQ-321) via `codex (action: capture, "voice_profile", entity_id, update_source=true)`. A Codex entry of kind `voice_profile` SHALL store: the entity's name, the corrected dialogue snippets with preserved `context` and `tag` fields, the original AI-generated text for each correction, the Novel slug where corrections were made, and the entity's background text.

**REQ-347b — Voice feedback codex capture (Part b).**
When `codex (action: import)` imports a `voice_profile` into a Novel, the corrected voice examples SHALL populate the matching entity's `voice_examples` field tagged `[codex-corrected]`, visually distinct from `[player-corrected]` (REQ-344) and `[supplementary]` (REQ-080) in `badge_briefing` rendering. A Codex `voice_profile` SHALL NOT contain mechanical stats — it carries only personality and voice fields (REQ-077).

**REQ-347c — Voice feedback codex capture (Part c).**
The `update_source` flag SHALL push Novel-level voice corrections back to the source Codex entry in-place, matching the bidirectional sync contract of REQ-321. *Acceptance criterion:* Call `character (action: signal, "voice_feedback", "She wouldn't say that — she'd say 'Stand back.'")` on an entity. Call `codex (action: capture, "voice_profile", entity_id, update_source=true)` — assert Codex entry created with corrected dialogue, original text, and Novel provenance. Call `codex (action: import, "<id>")` into a new Novel — assert entity voice_examples tagged `[codex-corrected]`. _Check:_ T397.
**REQ-345a — Background-derived knowledge (Part a).**
Character knowledge SHALL extend beyond presence-scoped percepts (REQ-308). When an entity's personality fields include a populated `background` string (REQ-077), the `knowledge_state` briefing section (REQ-286) SHALL include a `background_knowledge` subsection listing the entity's background text and a boundary directive for the AI narrator: "The character may know things their background implies — regional geography from 'soldier', academic knowledge from 'sage', underworld contacts from 'criminal' — without needing to have witnessed them in a scene.

**REQ-345b — Background-derived knowledge (Part b).**
The AI narrator SHALL surface plausible background knowledge when the scene context makes it relevant, and SHALL NOT gate such knowledge on presence." The subsection SHALL be present when `background` is populated; absent when empty. Background knowledge is advisory — it instructs the AI narrator to permit reasonable inference but does not populate the `knowledge_state` with explicit facts.

**REQ-345c — Background-derived knowledge (Part c).**
The background string SHALL additionally be matched against lore entry triggers per REQ-350. *Acceptance criterion:* Create entity with `background="Veteran of the Border Wars"`. `badge_briefing` `knowledge_state` includes `background_knowledge` subsection with the background text and boundary directive. Entity with empty `background` — subsection absent. _Check:_ T395.
**REQ-350a — Background lore triggering (Part a).**
An entity's populated `background` string SHALL be tokenized into keywords. The server SHALL match those keywords against the trigger lists (REQ-083) of all active lore entries in the Novel. Lore entries whose triggers intersect the background keyword set SHALL surface in the entity's `badge_briefing` `knowledge_state` subsection tagged `[background-relevant]`, with the lore entry key, a content preview, and the matched trigger word. The match is advisory — it informs the AI narrator that this lore may relate to the character's background but does not automatically reveal the lore's full content or populate `knowledge_state` with explicit facts.

**REQ-350b — Background lore triggering (Part b).**
Background lore matching SHALL NOT fire on lore entries tagged `game_master`-scope (REQ-083 badge_scope) — only `shared`-scope entries are matched. The match SHALL re-evaluate on every `badge_briefing` render to accommodate lore entry additions and removals during play. *Acceptance criterion:* Create entity with `background="Veteran of the Border Wars"`. Create lore entry `border_treaty` with triggers `["border", "war", "treaty"]` and `badge_scope="shared"`. Call `badge_briefing` — assert `knowledge_state` includes `[background-relevant]` subsection listing `border_treaty` with matched trigger "war".

**REQ-350c — Background lore triggering (Part c).**
Create lore entry `gm_secret` with triggers `["war"]` and `badge_scope="game_master"` — assert it does NOT appear in Player `badge_briefing` background matches. Create entity with empty `background` — assert `[background-relevant]` subsection absent. _Check:_ T400.
**REQ-355a — Secret-countdown coupling (Part a).**
WHEN a secret is revealed to an entity via `lore (action: reveal)` (REQ-234) AND a countdown exists whose `scope` or `direction` text references the secret's key, THE server SHALL surface an advisory in the `narrative_threads` briefing section (REQ-281) suggesting the countdown be advanced. The advisory SHALL carry the secret's key, the countdown name, and a prompt for the GM to advance or ignore.

**REQ-355b — Secret-countdown coupling (Part b).**
This is a navigational coupling — the server suggests; the GM decides. *Acceptance criterion:* Create a secret "betrayal" and a countdown with `scope` containing the term "betrayal." Call `lore (action: reveal, "betrayal", "pc_01")` — assert `badge_briefing` `narrative_threads` includes a countdown-advancement advisory referencing the secret and countdown. Create a secret and countdown with no overlap — assert no advisory. _Check:_ T406.
**REQ-356a — Vow-lore coupling (Part a).**
WHEN a vow is set via `vow (action: set)` (REQ-289) AND an active lore entry exists whose `triggers` or `key` intersect the vow's `name` or `description` text, THE server SHALL surface matching lore entries in the `narrative_threads` briefing section (REQ-281) tagged `[vow-relevant]`. The match SHALL re-evaluate on each `badge_briefing` render. This is a navigational coupling — lore is surfaced as guidance, not auto-revealed. *Acceptance criterion:* Create lore entry "crown_of_alara" with trigger "crown".

**REQ-356b — Vow-lore coupling (Part b).**
Call `vow (action: set, "Find the Crown", "Retrieve the Crown of Alara", ...)` with at least one party member — assert `badge_briefing` `narrative_threads` includes `[vow-relevant] crown_of_alara` with content preview. Call `vow (action: resolve)` — assert the match no longer appears on next briefing. _Check:_ T407.
**REQ-357a — Story journal-faction coupling (Part a).**
WHEN a story journal entry of type `consequence` or `moment` is recorded via `story (action: record)` (REQ-246) AND a faction exists whose `goals` text references an entity or location named in the entry, THE server SHALL surface a faction-clock-advancement advisory in the `narrative_threads` briefing section (REQ-281). The advisory SHALL carry the faction name, the matching goal text, the story entry preview, and a prompt for the GM to advance or ignore.

**REQ-357b — Story journal-faction coupling (Part b).**
This is a navigational coupling — the server suggests; the GM decides. *Acceptance criterion:* Create faction "Merchant Guild" with goal "Control the docks." Call `story (action: record, "consequence", "The docks were destroyed")` — assert `badge_briefing` `narrative_threads` includes faction-clock-advancement advisory referencing the Merchant Guild. Call `story (action: record, "moment", "The sunset was beautiful")` — assert no advisory (no entity or location overlap). _Check:_ T408.
**REQ-358a — Countdown-NPC disposition coupling (Part a).**
WHEN a countdown fires via `countdown (action: advance)` or scene transition (REQ-073, REQ-125) AND an NPC exists whose `location` matches the countdown's `scope`, THE NPC's disposition SHALL shift toward the countdown's `direction`: `hostile` countdowns shift the NPC toward `hostile` disposition; `benign` countdowns shift toward `friendly`. The shift SHALL be one step on the disposition scale — `neutral` to `suspicious`, `friendly` to `neutral`, and so on. The shift SHALL be recorded in the audit log with `[countdown-disposition]` annotation carrying the NPC ID, countdown name, and disposition change.

**REQ-358b — Countdown-NPC disposition coupling (Part b).**
This is a mechanical coupling — disposition changes automatically on countdown fire. *Acceptance criterion:* Create NPC "Guard" with `disposition="neutral"`, `location="gatehouse"`. Create `hostile`-direction countdown with `scope="gatehouse"`. Fire the countdown — assert Guard's disposition shifts to `suspicious` with `[countdown-disposition]` audit entry. Create `benign`-direction countdown — fire — assert Guard shifts back to `neutral`. NPC outside countdown scope — assert no shift. _Check:_ T409.
**REQ-359a — Relationship-countdown coupling (Part a).**
WHEN a relationship type changes from `ally` to `rival` or `hostile` via `relationship (action: set)` (REQ-236) AND a countdown exists whose `scope` or `direction` text references either entity in the relationship, THE server SHALL surface an advisory in the `narrative_threads` briefing section (REQ-281) suggesting the countdown be advanced or a new countdown be created to represent the fallout. The advisory SHALL carry both entity names, the relationship change, and the matching countdown name. This is a navigational coupling — the server suggests; the GM decides. *Acceptance criterion:* Create countdown with `scope="npc_guard"`.

**REQ-359b — Relationship-countdown coupling (Part b).**
Call `relationship (action: set, "pc_01", "npc_guard", "ally")`. Then call `relationship (action: set, "pc_01", "npc_guard", "rival")` — assert `badge_briefing` `narrative_threads` includes relationship-countdown advisory referencing the countdown. Flip relationship where no matching countdown exists — assert no advisory. _Check:_ T410.
**REQ-360a — Lore-countdown coupling (Part a).**
WHEN a lore entry is created or updated via `lore (action: set)` or `lore (action: update)` (REQ-083) AND the lore entry's `triggers` include temporal urgency keywords ("imminent," "approaching," "deadline," "ticking," "countdown") AND no countdown exists whose `name` or `scope` matches the lore entry's `key`, THE server SHALL surface a countdown-creation advisory in the `narrative_threads` briefing section (REQ-281) suggesting a countdown be created from the lore entry's content. The advisory SHALL carry the lore entry key, the matched urgency trigger, and a prompt for the GM to create or ignore.

**REQ-360b — Lore-countdown coupling (Part b).**
This is a navigational coupling — the server suggests; the GM decides. *Acceptance criterion:* Call `lore (action: set, "impending-raid", "The goblins are marching — they will be here by nightfall.", triggers=["raid", "imminent"])` — assert `badge_briefing` `narrative_threads` includes a countdown-creation advisory referencing "impending-raid" and the "imminent" trigger. Call `lore (action: set, "forest-lore", "The woods are old and deep.", triggers=["forest"])` — assert no advisory (no urgency keywords). Create countdown with matching name — assert advisory suppressed. _Check:_ T411.
**REQ-361a — NPC-vow coupling (Part a).**
(REQ-077) AND the GM calls `badge_briefing`, THE `narrative_threads` section (REQ-281) SHALL include a vow-creation suggestion for each goal-carrying NPC whose goal text length is at or above `TTRPG_VOW_SUGGESTION_GOAL_MIN_CHARS` (default 20) and does not already match an active vow's `description`. The suggestion SHALL carry the NPC name, the goal text, and a prompt for the GM to create a corresponding vow via `vow (action: set)` (REQ-289). This is a navigational coupling — the server suggests; the GM decides.

**REQ-361b — NPC-vow coupling (Part b).**
An NPC whose goal text already appears in an active vow's `description` SHALL NOT produce a suggestion. *Acceptance criterion:* Create NPC "Blacksmith" with `goals="Forge the legendary blade Starfang"`. Invoke `badge_briefing` — assert `narrative_threads` includes vow-creation suggestion naming the Blacksmith and their goal. Call `vow (action: set, "Forge Starfang", "Forge the legendary blade Starfang", ...)` with at least one party member — assert suggestion no longer appears. NPC with short goal ("smith stuff") — assert no suggestion. _Check:_ T412.
**REQ-362a — Faction-vow coupling (Part a).**
WHEN a faction exists with a populated `goals` array (REQ-233) AND the GM calls `badge_briefing`, THE `narrative_threads` section (REQ-281) SHALL include a vow-creation suggestion for each faction goal that intersects the party's interests — the goal text references an entity, location, or faction known from lore entries or story journal records — and does not already match an active vow's `description`. The suggestion SHALL carry the faction name, the matching goal text, and a prompt for the GM to create a vow via `vow (action: set)` (REQ-289).

**REQ-362b — Faction-vow coupling (Part b).**
This is a navigational coupling — the server suggests; the GM decides. *Acceptance criterion:* Create faction "Thieves Guild" with goal "Steal the Crown of Alara". Create lore entry referencing "Crown of Alara". Invoke `badge_briefing` — assert `narrative_threads` includes faction-vow suggestion naming the Thieves Guild and the crown goal. Create faction with goal that references no known entities — assert no suggestion. _Check:_ T413.
**REQ-363a — Secret-world coupling (Part a).**
The `lore (action: set_secret)` tool (REQ-234) SHALL accept an optional `world_target` parameter that references a world-model room ID (REQ-195). When a secret carries a `world_target`, the secret's triggers SHALL be matched against the room's `room_description` text in addition to scene description text (REQ-083). The secret SHALL surface in `badge_briefing` `narrative_threads` tagged `[world-linked]` when the active scene's `location` resolves to the targeted room. This is a navigational coupling — the secret is annotated with location context; it does not auto-reveal. *Acceptance criterion:* Create world-model room "Vault".

**REQ-363b — Secret-world coupling (Part b).**
Call `lore (action: set_secret, "vault-trap", "The floor is pressure-plated", world_target="vault")`. Call `scene (action: set, "The strongroom", location="Vault")` — assert `badge_briefing` `narrative_threads` includes `[world-linked]` vault-trap entry. Call `scene (action: set, "The garden", location="Inn")` — assert entry absent. _Check:_ T414.
**REQ-364a — Faction-world coupling (Part a).**
`faction (action: update)` tools (REQ-233) SHALL accept an optional `territory` parameter referencing one or more world-model room IDs (REQ-195). When a faction carries `territory`, the faction's clock and goal surface SHALL appear in `badge_briefing` `narrative_threads` tagged `[territorial]` when the active scene's `location` resolves to a room within the faction's territory. This is a navigational coupling — the faction is annotated with location context; its clock behavior is unchanged. *Acceptance criterion:* Create world-model room "Throne Room".

**REQ-364b — Faction-world coupling (Part b).**
Call `faction (action: create, "Royal Guard", goals=["Protect the crown"], territory=["throne_room"])`. Call `scene (action: set, "The royal chamber", location="Throne Room")` — assert `badge_briefing` `narrative_threads` includes `[territorial] Royal Guard` with clock state. Call `scene (action: set, "The kitchen", location="Pantry")` — assert faction absent from `narrative_threads`. _Check:_ T415.
**REQ-365a — Server notes narrative coupling (Part a).**
`note (action: set_server)` (REQ-285) SHALL accept an optional `narrative_tag` parameter from the set: `campaign_bible`, `house_rules`, `lore_seed`, or `session_reminder`. Server notes carrying a `narrative_tag` SHALL surface in the `badge_briefing` supplementary guidance alongside synthesis items (REQ-080), tagged with the narrative tag value. Server notes without a `narrative_tag` SHALL remain in the server notes resource only, as current behavior.

**REQ-365b — Server notes narrative coupling (Part b).**
This is a navigational coupling — server notes are surfaced as GM guidance in the briefing prompt. *Acceptance criterion:* Call `note (action: set_server, "old-gods", "The old gods were banished to the outer dark", narrative_tag="lore_seed")` — assert `badge_briefing` supplementary guidance includes `[lore-seed] The old gods were banished..."`. Call `note (action: set_server, "dm-reminder", "Remind players about the curse", narrative_tag="session_reminder")` — assert surfaces with `[session-reminder]` tag. Call without `narrative_tag` — assert absent from `badge_briefing`.

**REQ-365c — Server notes narrative coupling (Part c).**
Player badge — assert server notes absent from briefing regardless of tag. _Check:_ T416.
**REQ-366a — Observer narrative surface (Part a).**
`observer` (REQ-305), the `badge_briefing` SHALL compose narrative surfaces from both Game Master and Player perspectives: scene state and scene type (REQ-076, REQ-087) from the GM surface, entity presence and personality (REQ-307, REQ-077) from the Player surface, the combined narrative threads from both perspectives (REQ-281), and an orientation directive indicating the AI narrates from an omniscient perspective. The observer badge SHALL NOT see GM-only surfaces — secrets (REQ-234), faction clock states (REQ-233), countdown tick positions (REQ-073), or the GM context (REQ-232).

**REQ-366b — Observer narrative surface (Part b).**
The observer SHALL NOT mutate state — the read-only contract of REQ-305 applies to all narrative tools. Synthesis content (REQ-159) SHALL render in the observer `badge_briefing` under the same badge-filtering rules as the Player badge: game_master-scoped synthesis items are hidden; shared-scope items are visible. The observer SHALL have read-only access to world-model inspection tools — `command (action: resolve)` (REQ-323), parser `look` and `examine` commands, and resource reads (`room://<id>`, `thing://<id>`, `world://map`) — consistent with the state-query permission of REQ-305.

**REQ-366c — Observer narrative surface (Part c).**
The observer `badge_briefing` SHALL include presence markers and `knowledge_state` for all entities present in the Novel — the observer sees what the AI (playing both roles) knows for every character. Entity presence markers (REQ-307) and knowledge scoped by attendance (REQ-308) are unfiltered under the observer badge, matching the GM-level visibility contract: the human watches the AI auto-play, so no entity's percepts are hidden. *Acceptance criterion:* Call `set_badge("observer")` on a populated Novel.

**REQ-366d — Observer narrative surface (Part d).**
Assert `badge_briefing` includes scene state, entity personality, and narrative threads with omniscient-role orientation directive. Assert `badge_briefing` includes `[not present]` markers and `knowledge_state` for all entities (not just the active entity). Assert `badge_briefing` excludes secrets, faction clocks, countdown positions, and GM context. Assert `scene (action: set, "test")` returns `[FORBIDDEN]` as before. _Check:_ T417.
**REQ-346a1 — Narrative coherence attestation (Part a1).**
Before handoff (§9), the builder SHALL include in DECISIONS.md (6) a `narrative_coherence` attestation recording that: (a) every narrative-critical REQ is implemented — the verification workflow G7 narrative coherence attestation passed; (b) the `badge_briefing` prompt, when rendered against a populated Novel, includes all decision-critical and supplementary narrative sections as defined by REQ-109; (c) a smoke-session transcript (5+ turns of cooperative play) demonstrates that the server's narrative surfaces support coherent story flow. The smoke-session transcript SHALL be embedded or linked in DECISIONS.md (6).

**REQ-346a2 — Narrative coherence attestation (Part a2).**
A build missing this attestation is a handoff defect. *Acceptance criterion:* DECISIONS.md (6) contains a `narrative_coherence` section sub-headed `@section evidence` with the three attestation points and an embedded or linked smoke-session transcript. _Check:_ T396, T403.
**REQ-346b — Narrative coherence attestation (Part b).**
The `spec_health` `narrative_coherence` flag SHALL report a disposition of `pass`, `partial`, or `fail`. `pass` requires every server-side §5.12 REQ to be implemented and the attestation block to be recorded; `partial` requires at least one §5.12 REQ implemented; `fail` applies otherwise. A `fail` disposition blocks handoff (§9); a `partial` disposition is recorded as a non-blocking finding with a re-activation condition. _Check:_ T403.

---

### 5.13 Holodeck

**REQ-369a — Holodeck archetype taxonomy (Part a).**
(§7.7) SHALL be assigned one or more archetypes — Temporal, Entity-bearing, Scene-anchored, Knowledge-carrying, Narrative-memory, Spatial, Relational, Decision, Guidance, Session, Ruleset Wisdom, or Mechanical — as defined in §7.7.0. Every cross-property coupling in §7.7.1 SHALL trace to one or more coupling pattern rules (P1–P54, §7.7.0). A coupling that does not trace to a pattern rule is a spec defect.

**REQ-369b — Holodeck archetype taxonomy (Part b).**
Archetypes classified as `[content source]` denote input sources that populate property groups — they are excluded from the coupling cross-product. `npm run validate` SHALL verify that every coupling row in §7.7.1a cites a valid pattern rule. *Acceptance criterion:* `npm run validate` reports no untraced coupling rows and no coupling row with an invalid or missing pattern rule reference. _Check:_ T420, T436, T437, T438.
**REQ-370a — Coupling derivation (Part a).**
Every coupling row in §7.7.1a SHALL cite a pattern rule whose source and target archetypes match the row's property-group archetypes (§7.7.0, §7.7.1b). Every pattern rule in §7.7.0 (P1–P54) SHALL have at least one coupling row in §7.7.1a. A pattern rule with zero coupling rows is a spec defect. A coupling row citing a mismatched pattern rule is a spec defect. A `[non-property]` row (single-property snapshot or tool delegation) is exempt from archetype matching but counts toward its rule's coverage. `npm run validate` SHALL verify both conditions. Property groups classified as `[content source]` do not participate in coupling derivation — the properties they populate couple via their own archetype rules (§7.7.0).

**REQ-370b — Coupling derivation (Part b).**
The coupling completeness register (§7.7.1b previous) IS REMOVED — it is replaced by this derivation contract. *Acceptance criterion:* `npm run validate` reports no pattern rules with zero coupling rows and no coupling rows with mismatched archetype assignments. _Check:_ T421 (amended), T434, T435.
**REQ-371a — Ruleset Wisdom as rendered reality (Part a).**
Ruleset Wisdom content the server carries at runtime — `[vendor]`-tagged items per §11.4 — SHALL be rendered as first-class server behavior, not advisory guidance. Ruleset-native (`[ruleset]`) items are artifact-scope (§6.3): verified by the Phase 1 enrichment metrics; a pre-built host does not inject them into runtime state. WHERE host-carried Wisdom content describes pacing patterns, dramatic structure, NPC voice conventions, or encounter design, THE server SHALL mechanically enact those patterns per the coupling contracts defined in §7.7.0 (P5–P11). The GM may override individual Wisdom items via `synthesis (action: deactivate)`. Ruleset Wisdom survives `synthesis (action: revert)`.

**REQ-371b — Ruleset Wisdom as rendered reality (Part b).**
Wisdom items the host carries whose Mechanical coupling is not yet implemented SHALL render as Navigational suggestions until the coupling is implemented. *Acceptance criterion:* An NPC created in a Novel with active Ruleset Wisdom carries voice_examples, goals, and personality patterns without manual GM activation. A countdown created from Wisdom pacing patterns advances automatically on scene transitions. Deactivating the responsible Wisdom item suppresses the mechanical behavior. _Check:_ T422, T428, T496.
**REQ-374a — Archetype coverage (Part a).**
Builder SHALL verify during convergence Phase 1 that every Novel property group defined in §7.7 carries at least one Holodeck archetype from the set defined in §7.7.0 (Temporal, Entity-bearing, Scene-anchored, Knowledge-carrying, Narrative-memory, Spatial, Relational, Decision, Guidance, Session, Ruleset Wisdom, Mechanical). A property group without an archetype produces zero couplings — the coupling completeness metric in Phase 2 cannot detect this gap. The metric threshold is 100%: all 30 property groups classified.

**REQ-374b — Archetype coverage (Part b).**
Missing archetype assignments SHALL be resolved by re-reading §7.7.0 definitions and reassigning archetypes per the coupling pattern rules that govern each group's behavioral nature. *Acceptance criterion:* Every property group in §7.7 carries ≥1 archetype. A group missing an archetype causes this metric to fail, directing the builder to re-read and re-classify before proceeding to Phase 2. _Check:_ T425, T439.
**REQ-375a — Wisdom mechanical coupling rate (Part a).**
Synthesis population meets its threshold, the builder SHALL verify that Wisdom items extracted from the ruleset include Mechanical couplings — not exclusively Navigational ones. The metric measures: Wisdom items classified with Mechanical coupling nature per §7.7.1a / total Wisdom items extracted. Threshold: ≥30% Mechanical. A build where all Wisdom items are Navigational meets the Synthesis population metric but violates REQ-371's intent — the ruleset's guidance should render as server behavior.

**REQ-375b — Wisdom mechanical coupling rate (Part b).**
The builder SHALL improve the rate by re-reading ruleset source sections where the text carries strong behavioral language (procedures, pacing directives, structural patterns), re-classifying items from Navigational to Mechanical where the coupling contract supports it. *Acceptance criterion:* At least 30% of extracted Wisdom items carry Mechanical coupling nature in §7.7.1a. A build with Wisdom items exclusively Navigational causes this metric to fail, directing the builder to re-classify. _Check:_ T426.
**REQ-376a1 — Holonovel Pattern Buffer traceability (Part a1).**
The builder must ensure at least one Holonovel Pattern Buffer sub-workflow exercises each requirement in §5.10 (World-Model Layer), §5.12 (Narrative Architecture), §5.13 (Holodeck), §5.15 (Mechanical Coupling), and the world-model error contracts of REQ-367 (World-model property contracts). The builder records a Holonovel sub-workflow-to-REQ mapping in DECISIONS.md (6) — one entry per covered REQ, naming the sub-workflow(s) that exercise it. When a REQ in these sections changes during a holonovel package version advance, the builder re-examines every sub-workflow mapped to it.

**REQ-376a2 — Holonovel Pattern Buffer traceability (Part a2).**
Gaps — a REQ in the covered sections with no mapped sub-workflow — are logged as process-compliance findings and must be resolved before the holonovel package is published. New REQs added to the covered sections during a spec revision require the builder to propose at least one new Holonovel Pattern Buffer sub-workflow exercising their contract; the proposal is a finding, not a blocker. *Acceptance criterion:* After a full Holonovel Pattern Buffer run, DECISIONS.md (6) contains a Holonovel sub-workflow-to-REQ mapping covering every REQ in the specified sections.

**REQ-376a3 — Holonovel Pattern Buffer traceability (Part a3).**
Gaps detected by `npm run validate` are errors that block assembly. _Check:_ T431.

---

### 5.14 Content Sources

**REQ-372a — Supplementary ruleset import (Part a).**
The server SHALL support runtime import of supplementary TTRPG rulesets via `import_supplementary`. Import is Novel-scoped — each Novel records its active supplementary rulesets under `supplementary_rulesets: [<slug>, ...]`. Import IS reversible via `remove_supplementary`.

**REQ-372b — Supplementary ruleset import (Part b).**
WHEN a supplementary ruleset is imported, THE server SHALL run extraction against the supplementary source per REQ-011 and REQ-225 (recording confidence and content hash in Novel metadata), register extracted mechanics as MCP tools per REQ-020 and REQ-373, render extracted Ruleset Wisdom per REQ-371 (P5–P11), record the supplementary ruleset's slug and content hash in the Novel's metadata, and on Novel resume re-resolve supplementary rulesets (surfacing `[supplementary-gap]` in `spec_health` if a source file is missing or hash-mismatched). Import is Game Master only, under the Editor badge.

**REQ-372c — Supplementary ruleset import (Part c).**
Supplementary rulesets do not affect other Novels — tools and Wisdom are Novel-scoped. The server MAY cache extraction results across Novels that import the same supplementary source. `remove_supplementary` deactivates all tools and Wisdom from the supplementary ruleset in the current Novel; state derived from supplementary content (NPCs created from supplementary stat blocks, lore from supplementary Wisdom) persists — the tools that created them are no longer available.

**REQ-372d — Supplementary ruleset import (Part d).**
WHEN the builder's chosen stack cannot support dynamic tool registration, THE builder SHALL record a waiver in DECISIONS.md (5) citing the technical constraint, and supplementary ruleset import SHALL be limited to Ruleset Wisdom only — mechanics from supplementary sources require a full rebuild. The waiver SHALL re-evaluate on each builder version. *Acceptance criterion:* Call `import_supplementary("xanathars-guide.md")` in a Novel — assert new spells, classes, and Wisdom appear in `tools/list`, `badge_briefing`, and `synthesis (action: list)`. Assert Wisdom mechanically couples per P5–P11.

**REQ-372e — Supplementary ruleset import (Part e).**
Call `remove_supplementary("xanathars-guide.md")` — assert tools and Wisdom removed. End Novel and resume — assert supplementary ruleset re-resolves. Move the source file — assert `[supplementary-gap]` in `spec_health`. _Check:_ T423.
**REQ-373a1 — Dynamic tool registration (Part a1).**
The server SHALL support registration of additional MCP tools at runtime when supplementary rulesets are imported (REQ-372). Dynamically registered tools SHALL conform to the same contracts as build-time tools: response prefix (REQ-001), error taxonomy (REQ-002), roll transparency (REQ-003), source quoting (REQ-061), and badge gating (REQ-032). `tools/list` SHALL include dynamically registered tools alongside build-time tools. `tools/list` output SHALL annotate dynamically registered tools with their source supplementary ruleset slug.

**REQ-373a2 — Dynamic tool registration (Part a2).**
When a supplementary ruleset is removed (REQ-372), its tools SHALL be deregistered — `tools/list` and tool invocation SHALL behave as if the tools were never present. *Acceptance criterion:* After `import_supplementary`, `tools/list` includes new tools annotated with source slug. Tool invocation produces `[OK]` with response prefix, error taxonomy, and source quoting. After `remove_supplementary`, tools are absent from `tools/list` and invocation returns `[NOT_FOUND]` (tool not recognized by the MCP layer). _Check:_ T424.

---

### 5.15 Mechanical Coupling

**REQ-377a — Mechanical coupling extraction (Part a).**
During Discovery (§6.3), after extracting mechanical tools from categories 1–6, the builder SHALL identify which mechanical tools carry Holodeck coupling effects. A tool carries coupling effects when the ruleset's own text describes outcomes that affect the game world beyond immediate mechanical resolution — destruction of objects, illumination or extinguishing of light sources, creation or removal of obstacles, transformation of environments, revelation of information, or application of persistent conditions to entities.

**REQ-377b — Mechanical coupling extraction (Part b).**
For each qualifying tool, the builder SHALL record coupling metadata: (a) the target archetype — Spatial, Entity-bearing, Temporal, or Knowledge-carrying, (b) the coupling nature — Mechanical for deterministic effects the ruleset describes as automatic, Navigational for effects requiring GM interpretation, and (c) the triggering condition drawn from the ruleset text. This metadata populates the Mechanics property group per the Mechanical archetype (§7.7.0).

**REQ-377c — Mechanical coupling extraction (Part c).**
Confidence labels apply per coupling entry: HIGH when the ruleset text unambiguously describes a world-affecting outcome, MEDIUM when the effect is implied but not explicit, LOW when the builder infers coupling from genre convention alone. *Acceptance criterion:* A build against D&D 5e SRD produces coupling metadata for Fireball (Spatial, destruction — HIGH), Darkness (Spatial, extinguishing — HIGH), Light (Spatial, illumination — HIGH), and Hold Person (Entity-bearing, condition — HIGH). Each entry carries source anchor and confidence label.

**REQ-377d — Mechanical coupling extraction (Part d).**
A ruleset-free build produces `[ruleset-free]` annotation. _Check:_ T432.
**REQ-378a — Mechanical coupling verification (Part a).**
The convergence loop SHALL verify that: (a) at least one mechanical tool per extraction category (Concepts, Entities, Actions, Tables, Resolution, Roles) carries coupling metadata — a category with zero coupling entries is a finding; (b) the total coupling entries meet the threshold of at least one coupling entry per 50 indexed mechanical items, with a floor of 5 and a ceiling of 50; (c) at least 10% of mechanical couplings are Mechanical (automatic) rather than Navigational (advisory) — a build where every mechanical coupling requires GM confirmation is a findings. *Acceptance criterion:* A build against D&D 5e SRD (200+ indexed mechanical items) produces at least 4 mechanical coupling entries that meet the thresholds.

**REQ-378b — Mechanical coupling verification (Part b).**
At least one coupling is Mechanical (automatic), not Navigational. A ruleset-free build produces `[ruleset-free]` annotation for all mechanical coupling metrics. _Check:_ T433.

### 5.16 Multi-Ruleset Build

**REQ-379a — Tool namespacing (Part a).**
`ruleset` annotation — the ruleset slug for ruleset-derived tools, or `null` for infrastructure tools. Ruleset-derived tools carry a `<slug>_` prefix in their registered name. Infrastructure tools — those in the World, Novels, Badges & Workflow, and Narrative REQ-020 categories — SHALL carry no prefix. The set of ruleset-derived tools is the union of tools classified during Discovery (§6.3) as Concepts-derived, Entities-derived, Actions-derived, Tables-derived, Resolution-derived, or Roles-derived.

**REQ-379b — Tool namespacing (Part b).**
Tool names that clash between two rulesets under the prefix scheme (e.g., both rulesets extract a tool named `roll_skill_check`) are resolved by the prefix — the tool names are distinct on the registry surface. The mapping of prefix to ruleset slug SHALL be recorded in DECISIONS.md (1) during package construction (§6.4.2) and reported in `spec_health` under a `ruleset_prefix_map` field.

**REQ-379c — Tool namespacing (Part c).**
A tool whose `ruleset` annotation does not match any known ruleset is a registration defect. *Acceptance criterion:* `tools/list` for a host with D&D and Starfinder packages loaded reports `dnd5e_roll_skill_check` with `ruleset: "dnd5e"`, and `starfinder_roll_skill_check` with `ruleset: "starfinder"`. `npc (action: create)` carries `ruleset: null`. `spec_health.ruleset_prefix_map` maps each prefix to its ruleset slug. _Check:_ T440.
**REQ-380a — Novel ruleset binding (Part a).**
`ruleset` parameter — a ruleset slug matching one of the prefixes in the server's `ruleset_prefix_map`. The Novel's `ruleset` field SHALL be immutable for the Novel's lifetime except the single audited migration path (REQ-380c). `novel (action: resume)` SHALL restore the bound ruleset from the Novel's persisted state. `novel (action: clone)` SHALL preserve the source Novel's ruleset. `novel (action: switch)` to a Novel bound to a different ruleset SHALL activate that Novel's ruleset scope — the ruleset-derived tool surface changes to match. `novel (action: create)` with a ruleset slug not present in the server's `ruleset_prefix_map` returns `[ERROR] [INVALID_INPUT]` with valid rulesets enumerated.

**REQ-380b — Novel ruleset binding (Part b).**
A conformant server with exactly one ruleset MAY accept `novel (action: create)` without the `ruleset` parameter, defaulting to that single ruleset — this preserves backward compatibility with single-ruleset servers built before multi-ruleset support. *Acceptance criterion:* `novel (action: create, "greyhawk", ruleset="dnd5e")` succeeds and the Novel's `ruleset` field is `"dnd5e"`. Subsequent calls to `dnd5e_roll_skill_check` succeed against this Novel. `novel (action: create, "absalom", ruleset="starfinder")` succeeds with `ruleset: "starfinder"`.

**REQ-380c — Novel ruleset binding (Part c).**
Calling `dnd5e_lookup_spell` against the Starfinder Novel returns an error per REQ-381. *Acceptance criterion:* A ruleset-free Novel (created with no `ruleset` field) binds to an installed slug via `ruleset (action: bind)` — a Game Master or Editor operation, audited and one-way — and gains that slug's tools. Binding SHALL refuse `[ERROR] [STATE_CONFLICT]` when the Novel already carries mechanics-derived state under a different or no ruleset. _Check:_ T441, T451.
**REQ-381a — Ruleset-scoped tool gating (Part a).**
When a Novel with ruleset scope `X` is active, only tools whose `ruleset` annotation is `X` or `null` SHALL be callable. A call to a tool annotated with a different ruleset scope returns `[ERROR] [INVALID_INPUT]` with the corrective action stating the active Novel's ruleset and directing the caller to tools matching that ruleset. This gating is independent of badge gating (REQ-032) — both filters apply. A call that passes badge gating but fails ruleset gating returns `[ERROR] [INVALID_INPUT]` with the active Novel's ruleset named in the corrective action.

**REQ-381b — Ruleset-scoped tool gating (Part b).**
A call that fails both returns `[ERROR] [FORBIDDEN]` (badge gating takes precedence in the response taxonomy). Ruleset scope applies to every MCP surface: `tools/list` SHALL, when invoked with `scope=all`, include all registered tools regardless of active Novel, with tools whose ruleset scope does not match the active Novel's scope annotated with an `inapplicable` hint — their descriptions remain visible for discoverability. The default scoped listing is governed by REQ-391. `resources/list` and `prompts/list` SHALL include all entries; resources and prompts whose content draws from a ruleset model SHALL badge-filter and ruleset-filter their output.

**REQ-381c — Ruleset-scoped tool gating (Part c).**
When no Novel is active, all tools are callable and no ruleset gating applies — the server operates with full cross-ruleset access. *Acceptance criterion:* With a D&D-bound Novel active, `starfinder_roll_skill_check` returns `[ERROR] [INVALID_INPUT]` naming the active Novel's ruleset as `dnd5e`. With no Novel active, the same call succeeds. `tools/list` with `scope=all` includes all tools with `inapplicable` annotations on mismatched-ruleset tools. _Check:_ T442.
**REQ-382a — Per-ruleset extraction isolation (Part a).**
Each ruleset's extraction model — search index, canonical lookup catalogues (spells, equipment, monsters, conditions, classes, abilities), generation tables, condition registry, constraint override catalog, and mechanical coupling metadata — SHALL be isolated from every other ruleset's model. A `ruleset (action: search)` call under a D&D-bound Novel searches only the D&D index.

**REQ-382b — Per-ruleset extraction isolation (Part b).**
The same query under a Starfinder-bound Novel searches only the Starfinder index. `lookup_spell`, `lookup_equipment`, `lookup_monster`, `lookup_class`, and analogous ruleset-derived lookup tools SHALL search only their ruleset's catalogue. `ruleset (action: roll)` SHALL enumerate only the tables extracted from the active Novel's ruleset. `command (action: suggest)` SHALL return only tool suggestions from the active Novel's ruleset. `spec_health` SHALL report per-ruleset extraction metrics. *Acceptance criterion:* `dnd5e_search_rules("fireball")` under a D&D Novel returns D&D Fireball results with source anchors in the D&D ruleset. `starfinder_search_rules("fireball")` under a Starfinder Novel returns results from the Starfinder ruleset (or `[NOT_FOUND]`).

**REQ-382c — Per-ruleset extraction isolation (Part c).**
The same tool called under the wrong Novel returns per REQ-381. `spec_health` reports `ruleset_dnd5e` and `ruleset_starfinder` sections with independent counts. _Check:_ T443.
**REQ-383a — Host ruleset health (Part a).**
`spec_health` SHALL report per-ruleset metrics in a `ruleset_health` object keyed by ruleset slug. Each slug entry contains: confidence scores (overall and per-file), indexed counts (anchors, concepts, entity types, actions, tables, procedures, guidance items, synthesis items per module), MUST-action coverage, defect count, and verification workflow dispositions. A `combined` summary reports total tool count, total resource count, total prompt count, active Novel count, and the `ruleset_prefix_map`. The per-ruleset sections SHALL be absent when the build is not yet complete.

**REQ-383b — Host ruleset health (Part b).**
Player-badge calls SHALL filter per-ruleset sections: the Player sees only metrics for the active Novel's ruleset (if a Novel is active with a badge) or no per-ruleset sections (if no Novel is active). The `combined` summary section is visible to all badges. *Acceptance criterion:* A host with D&D and Starfinder packages loaded reports `spec_health.ruleset_health.dnd5e` and `ruleset_health.starfinder` with independent counts, plus a `combined` section with the prefix map. Under a Player badge with a D&D Novel active, only `ruleset_health.dnd5e` is visible. _Check:_ T444.
**REQ-384a — Cross-ruleset Novel switching (Part a).**
`novel (action: switch, slug)` SHALL activate the target Novel's ruleset scope. The ruleset-derived tool surface — which lookup tools, which dice-resolution tools, which generation tables, which `ruleset (action: search)` index, which `command (action: suggest)` suggestions, and which condition registry — SHALL change to match the activated Novel's ruleset. Switching between Novels of different rulesets SHALL NOT corrupt either Novel's state. The `badge_briefing` prompt SHALL recompose using the activated Novel's ruleset model.

**REQ-384b — Cross-ruleset Novel switching (Part b).**
Infrastructure tools and their state (scene, NPCs, world model, lore, countdowns) are unchanged — they operate on the activated Novel's data regardless of ruleset. Switching Novels SHALL be an audited mutation with the source and destination slugs and their rulesets recorded. *Acceptance criterion:* Switching from a D&D Novel (slug `greyhawk`) to a Starfinder Novel (slug `absalom-station`) changes the `badge_briefing` to use Starfinder terminology, makes `starfinder_roll_skill_check` callable, and makes `dnd5e_roll_skill_check` return per REQ-381. The D&D Novel's state is unchanged on disk.

**REQ-384c — Cross-ruleset Novel switching (Part c).**
Switching back restores D&D ruleset scope. The audit log records both switches with ruleset metadata. _Check:_ T445.
**REQ-385a — command suggest cross-ruleset scoping (Part a).**
`command (action: suggest)` SHALL return only tool suggestions whose `ruleset` annotation matches the active Novel's ruleset scope, plus infrastructure tools. When the world model is populated, `command (action: suggest)` SHALL also return parser `command` suggestions (per REQ-319) — these are infrastructure and unrestricted. A `command (action: suggest)` call with no Novel active SHALL return `[ERROR] [STATE_CONFLICT]` directing the caller to create or resume a Novel. The action-suggestion catalogue is drawn from the active Novel's ruleset model.

**REQ-385b — command suggest cross-ruleset scoping (Part b).**
Suggestions SHALL use the prefixed tool names for ruleset-derived tools. *Acceptance criterion:* `command (action: suggest, "attack the goblin")` under a D&D Novel returns `dnd5e_roll_weapon_attack` as a suggestion. The same intent under a Starfinder Novel returns `starfinder_roll_weapon_attack`. Neither returns the other ruleset's tool. _Check:_ T446.
**REQ-386a — Cross-ruleset import rejection (Part a).**
`novel (action: import)` SHALL validate the imported Novel's `ruleset` field against the server's known ruleset slugs (from `ruleset_prefix_map`). An import whose ruleset does not match any known slug returns `[ERROR] [INVALID_INPUT]` with valid rulesets enumerated. The import succeeds when the ruleset is known — the imported Novel's ruleset is preserved as-is. `character (action: import, roster_id)` SHALL validate that the Roster entry's ruleset matches the active Novel's ruleset scope.

**REQ-386b — Cross-ruleset import rejection (Part b).**
A mismatch returns `[ERROR] [STATE_CONFLICT]` naming the entry's ruleset and the Novel's ruleset. `novel (action: export)` SHALL include the Novel's `ruleset` field in the export manifest. A Novel exported from one host is importable into any conformant host that recognizes its ruleset slug. *Acceptance criterion:* Exporting a D&D Novel includes `ruleset: "dnd5e"` in the manifest. Importing a Starfinder Novel into a D&D + Mothership host rejects with valid rulesets enumerated. Importing a character from a Starfinder Roster entry into a D&D Novel rejects with both rulesets named. _Check:_ T447.
**REQ-387a — Codex ruleset annotation (Part a).**
`ruleset` field — the slug matching one entry in the server's `ruleset_prefix_map`, or `null` for ruleset-agnostic entries (rooms, scenes, generic NPCs without mechanical stats, lore entries). `codex (action: set)` SHALL default the `ruleset` field to the active Novel's ruleset scope when one is active, or leave it `null` when no Novel is active (the caller MAY override). `codex (action: capture)` SHALL default `ruleset` to the source Novel's ruleset scope, mirroring the `codex (action: set)` default. `codex (action: list)` SHALL support a `ruleset` filter parameter — when provided, returns only entries whose `ruleset` matches or is `null`. `codex (action: import)` into a Novel SHALL show only entries whose `ruleset` matches the Novel's ruleset or is `null`.

**REQ-387b — Codex ruleset annotation (Part b).**
A `codex (action: import)` of a ruleset-specific entry (e.g., a D&D spell) into a Novel of a different ruleset returns `[ERROR] [STATE_CONFLICT]` naming both rulesets. *Acceptance criterion:* `codex (action: list, ruleset="dnd5e")` returns D&D-tagged entries plus untagged entries. `codex (action: list, ruleset="starfinder")` returns Starfinder-tagged entries plus untagged entries — no D&D entries. `codex (action: import)` of a D&D spell codex entry into a Starfinder Novel is rejected. _Check:_ T431.

### 5.17 Ruleset Packages

**REQ-389a — Ruleset package format (Part a).**
A ruleset package is a self-contained declarative artifact produced by the Package step (§6.4.2). It SHALL contain the extracted model, the full-text search index, tool schemas with execution logic expressed as data, resource and prompt definitions, a content hash, and a version manifest naming the host version it was built against. The host SHALL load a package without reading or re-parsing ruleset Markdown source, using only the prebuilt index and model the package ships.

**REQ-389b — Ruleset package format (Part b).**
A package whose declared content hash does not match its contents SHALL be rejected at load with its slug and the expected and received hashes reported; the host SHALL surface the rejection in `spec_health` and continue serving other packages. *Acceptance criterion:* A package built via the Package step loads once and serves `ruleset (action: search)`, lookups, and dice tools with no source-Markdown access; a package with a corrupted manifest is rejected by slug without affecting loaded packages. _Check:_ T452.

**REQ-389c — Ruleset install surface (Part c).**
`ruleset (action: install)` SHALL validate slug uniqueness and package-format compatibility (REQ-420) before activation; `ruleset (action: remove)` SHALL deregister the package's tools, resources, and prompts and SHALL refuse while any active Novel is bound to its slug. `ruleset (action: list)` SHALL report each installed package with installed-versus-loaded state. All three are Game Master or Editor operations and SHALL be audited. *Acceptance criterion:* Installing a package with a duplicate slug or an incompatible package-format fingerprint fails with the reason named; removing a package with a Novel still bound to it returns `[ERROR] [STATE_CONFLICT]`; `ruleset (action: list)` distinguishes loaded from installed-but-idle packages. _Check:_ T453.

**REQ-430 — Ruleset tool-quality conformance.**
Every tool schema shipped in a ruleset package SHALL satisfy the tool-documentation contracts of REQ-024a (title, three-clause description) and REQ-427 (per-parameter description); a schema lacking any of these is a package defect (REQ-389). The host SHALL validate each installed package's tool schemas at load, keep non-conformant tools registered but flagged, and surface each in `spec_health` under `ruleset_package_alerts` naming the slug, tool, and defect, without blocking package loading. `spec_health` SHALL report conformant and non-conformant ruleset-derived tool counts. *Acceptance criterion:* a package whose `lookup_spell` schema omits a parameter description loads with that tool flagged in `spec_health`; after a conformant rebuild the flag clears. _Check:_ T512.

**REQ-432a — Vendor ruleset package certification (Part a).**
A ruleset package built from a content source recorded in Appendix U SHALL ship a `source_license` field in its version manifest naming the license and the Appendix U row. `build-ruleset` SHALL populate the field from the source registry (REQ-421). The host SHALL surface `licensed` and `source_license` in `ruleset (action: list)` output.

**REQ-432b — Vendor ruleset package certification (Part b).**
A vendor package whose license is not recorded in Appendix U SHALL be flagged `[license-unattributed]` in `spec_health` and held inactive.
*Acceptance criterion:* a fixture package whose manifest names an Appendix U license lists it in `ruleset (action: list)`; a package with a missing license row is flagged and held inactive; the handoff license footer (H11) renders vendor packages. _Check:_ T517.

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
A host update (§6.7) SHALL revalidate installed packages against the host's current package-format fingerprint (REQ-420) without re-building or re-extracting them. A package whose version manifest names an incompatible package-format fingerprint SHALL be reported in `spec_health` and held inactive (surfacing a `[package-incompatible]` flag) rather than silently dropped. User data (REQ-396) SHALL survive a host update unchanged. *Acceptance criterion:* After a package-format fingerprint change, a still-compatible package stays loaded and retains its indexed data; an incompatible package is flagged and held inactive; all user data survives byte-for-byte. _Check:_ T460.

**REQ-394 — Spec publication integrity.**
A Minor or Major spec delta (§6.7) SHALL NOT be propagated to a repository or deployed server, or recorded as applied, until implementation fingerprints (REQ-313) advance to reflect the update. Publication tooling SHALL detect a pending update — a non-patch delta with unchanged fingerprints — and block publication with a pending-update notice; patch deltas are exempt. The gate SHALL classify a delta against the last-published spec hash, never a hand-edited value. An operator override recorded in DECISIONS.md may lift the block when the update is scheduled. *Acceptance criterion:* A Minor or Major delta with unchanged fingerprints blocks publication; after the update advances the fingerprints, publication succeeds. _Check:_ T462.

**REQ-419 — Editorial delta classification.**
Publication tooling SHALL detect REQ-body modifications and SHALL NOT classify a delta as patch when any REQ body changed. Such a delta SHALL classify as Editorial only when a disposition recording the repaired REQ set is recorded in DECISIONS.md; otherwise it SHALL classify as Minor (§6.7). A delta recorded Editorial whose REQ scope actually changed is a classification error that blocks publication (REQ-394). *Acceptance criterion:* A body-modified delta without an Editorial record classifies Minor; with one, Editorial and no fingerprint advance. _Check:_ T492.

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
The deployment model is a git-managed specification repository that produces a separately deployed host server with its own working tree. Build, Update, and verification workflows SHALL treat the specification repository and the deployed server as distinct surfaces: spec changes propagate to a deployed server only through the Update workflow (§6.7) and the fingerprint gate (REQ-394), never by a bare file copy or checking spec content directly into the server's directory. _Check:_ T467.

**REQ-418 — Deployment verification.**
Publication tooling SHALL, after updating a deployed instance, verify the deployed spec hash equals the published spec hash and the deployed implementation fingerprints (REQ-313) match the published fingerprints. A pull that fails, conflicts, or leaves the deployed tree at a prior revision SHALL surface a deploy-failed notice naming the server, and the deployment SHALL NOT be reported complete until verification passes. When the canonical implementation source lives inside the specification repository, verification SHALL run against the deployed clone after the pull. *Acceptance criterion:* A deploy that cannot fast-forward ends with a deploy-failed notice and no completion marker; a successful deploy reports matching spec hash and fingerprints. _Check:_ T491.

**REQ-420 — Ruleset package-format fingerprint.**
A ruleset package's version manifest SHALL record a package-format fingerprint: a content hash of the package-contract sections (§5.16, §5.17, §6.3, §6.4.2) of the assembled specification, computed at Package time (§6.4.2). The host SHALL compare each installed package's package-format fingerprint against its own current value at startup and after a host update (§6.7), and a mismatch SHALL hold the package inactive and surface a `[package-incompatible]` flag in `spec_health` naming the slug and both fingerprints, without re-building or re-extracting the package (REQ-393). *Acceptance criterion:* a package built under a prior package-format fingerprint is flagged `[package-incompatible]` and held inactive after a fingerprint change; a current package stays loaded. _Check:_ T498.

**REQ-421 — Ruleset source registry.**
The `build-ruleset` entry point (REQ-395a) SHALL record each accepted `slug=path` intake in a source registry stored under the server's state directory (REQ-397), mapping slug to source path, package-format fingerprint, and build timestamp. The registry SHALL survive deploys and host updates (REQ-396) and SHALL NOT be committed to the specification repository. Re-running `build-ruleset` for a registered slug SHALL default to the recorded path. *Acceptance criterion:* after a build the registry maps the slug to its source; a deploy preserves it; a re-run defaults to the recorded path. _Check:_ T499.

**REQ-422 — Ruleset update entry point.**
The distribution SHALL expose a documented entry point — `update-rulesets` — that lists installed packages whose package-format fingerprint (REQ-420) differs from the host's current value or is absent, and emits the Build workflow invocation for each affected slug, reading slug-to-source mappings from the source registry (REQ-421). Invoked with no arguments, it SHALL print usage, the install directory, and a per-package compatibility summary. *Acceptance criterion:* `update-rulesets` reports each stale slug with its recorded source and prints a Build invocation; no stale slug is omitted. _Check:_ T500.

**REQ-423 — User-data format fingerprint.**
Every persisted user-data artifact — Novel, roster, codex, and server-note state — SHALL record a data-format fingerprint: a hash of the state-model sections (§7.7, §5.6, §5.9, §5.19, §5.21–§5.23, Appendix Q) of the assembled specification, computed at write. The host SHALL compare each artifact's data-format fingerprint against its own current value at startup and after a host update (§6.7) and SHALL surface a `[data-stale]` flag in `spec_health` naming the artifact and both fingerprints. Staleness SHALL NOT block loading — artifacts load per REQ-065 with inert fields preserved and defaults added. *Acceptance criterion:* an artifact written under a prior data-format fingerprint reports `[data-stale]` and still loads; user data survives byte-for-byte apart from the stamp. _Check:_ T501.

**REQ-424 — User-data migration entry point.**
The distribution SHALL expose a documented entry point — `migrate-user-data` — that lists artifacts whose data-format fingerprint (REQ-423) differs from the host's current value or is absent and, when explicitly invoked, re-stamps each through the interchange round-trip (REQ-096, Appendix Q), preserving inert fields and applying defaults per REQ-065. The default invocation SHALL be a dry run with no side effects. A migration that fails before completing SHALL leave the original artifact unchanged and name the artifact. *Acceptance criterion:* the default invocation changes nothing; an explicit run re-stamps stale artifacts; re-export after migration is unchanged. _Check:_ T502.

**REQ-428 — Registry-published distribution.**
The distribution SHALL build a container image that runs the host server and SHALL maintain a registry manifest (`server.json`) whose version and package version match the host version as published to the package registry (REQ-107a). A publish to an external registry SHALL validate the manifest against its schema and SHALL fail closed when the manifest is missing or its version does not match. *Acceptance criterion:* the container image builds and starts the host; the manifest versions equal the host version; the publish entry point rejects a missing or mismatched manifest. _Check:_ T510.

**REQ-429 — Server-wide action-discriminator surface.**
The server SHALL expose one action-discriminator tool per persisted entity type (REQ-413) instead of a sibling tool per operation. The registered catalog SHALL stay within a recorded budget of at most twenty-eight tools. Every persisted type SHALL be enumerable through a `list` action and readable through a `get`, `info`, `status`, or `knowledge` action on its entity tool. Tool names SHALL be uniform, and each action SHALL be a documented sub-REQ. *Acceptance criterion:* `tools/list` returns at most twenty-eight tools, and every persisted type has read and enumeration actions. _Check:_ T511.

### 5.19 State Persistence Guardrails

**REQ-400 — State-Persistence Directive.** When the AI's narrative role is
Game Master, `badge_briefing` orientation SHALL include a persistence
directive instructing the GM to commit state for every narratable change —
scene changes, mechanical outcomes, disposition shifts, and story beats SHALL
be persisted with the corresponding state tool (REQ-076, REQ-246, REQ-075,
REQ-073), including the base-capability state tools (REQ-434–443), in the same turn they are narrated. The directive SHALL render in the
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
`session (action: recap)` naming the session that recorded no state writes. The marker is
observational and SHALL NOT block play. _Check:_ T471.

**REQ-403a — State-drift detection (Part a).**
The server SHALL detect state drift — a `gm_context.saved_at` timestamp newer
than the last audit-log mutation, indicating the GM narrated without
committing — and SHALL surface it as a `[state-drift]` marker in `spec_health`,
`session (action: recap)`, and the `state_ledger` token.

**REQ-403b — State-drift detection (Part b).**
A `TTRPG_STATE_GATE` setting — `off` (default), `warn`, or `block` — read at
startup, SHALL control the gate: `off` renders drift markers observationally,
`warn` appends a prominent warning naming the uncommitted beats and the tools
to fix them at session close (`novel (action: save_context)`, `session (action: recap)`), and
`block` returns `[STATE_CONFLICT]` from `novel (action: save_context)`, `novel (action: end)`, and
`novel (action: switch)` while drift is active. Commit tools SHALL remain callable in
every mode. _Check:_ T472.

**REQ-404 — Roll-to-commit coupling.** A significant roll (REQ-174) implying
a mechanical consequence SHALL be followed by a state-committing mutation in
the same turn; `session (action: recap)` SHALL flag a `[uncommitted-roll]` marker naming
the roll and the suggested commit tool when no such mutation follows. For
base-capability rolls (REQ-434, REQ-439, REQ-441), the marker SHALL name the
committing base-capability action as the suggested commit tool. The
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
personality, NPC, vow, and base-capability state tools defined in §5 — regardless of scene type, and
those tools SHALL be never-truncated per REQ-135. _Check:_ T476.

### 5.20 Narrative Turn Conventions

**REQ-412 — Turn-handoff directive.** WHEN the AI's narrative role is Game Master and a Player or Observer badge is active, `badge_briefing` orientation SHALL include a turn-handoff directive instructing the narrator to close each narrated turn by inviting the player's next action in plain English — a question or prompt to act, never a tool signature. The directive SHALL render in the never-truncated tier (REQ-135). Under an AI-Player role, the directive SHALL instruct closing turns with an in-character offer that hands initiative back to the human Game Master. *Acceptance criterion:* `badge_briefing` under the GM role includes the turn-handoff directive; under the AI-Player role it instructs handing initiative back. _Check:_ T482.

### 5.21 Fate Base Capabilities

**REQ-434 — Fudge dice.** `fate (action: roll)` SHALL roll Fudge dice expressed in `dF` notation — `NdF` rolls N Fudge dice, each face returning −1, 0, or +1, and a bare `dF` defaults to four. The result SHALL report the notation, each die face, a `skill` label and `modifier` when supplied, and the total against an optional `difficulty` (default 0), honoring the roll-transparency contract (REQ-003) and the per-call seed (REQ-050). The total SHALL be classified on the Fate ladder — Fail below the difficulty, Tie when equal, Succeed above, and Succeed with style at least three above. *Acceptance criterion:* `fate (action: roll, skill="Fight", modifier=2, difficulty=2, seed="42")` returns four faces in {−1, 0, +1}, a total, and a ladder band; the same seed reproduces the same faces. _Check:_ T520.

**REQ-435 — Fate aspects.** `fate (action: aspect)` SHALL create, invoke, compel, remove, and list aspects — free-form narrative phrases attached to a scene, entity, or NPC. Creating an aspect requires a `name` and a `target` and is a Game Master operation; invoking an aspect SHALL consume one Fate point from the invoking entity (REQ-436) and report the invoke; compelling an aspect SHALL grant one Fate point to the compelled entity. Listing SHALL return active aspects with their targets and is readable by any badge. Aspects persist with the Novel (REQ-092). *Acceptance criterion:* creating a scene aspect then invoking it with an entity holding Fate points consumes one; invoking with zero Fate points is refused with the corrective action named. _Check:_ T521.

**REQ-436 — Fate points.** `fate (action: fate_point)` SHALL spend, grant, refresh, and list Fate points per character, keyed by entity identifier. A character's Fate points start at a refresh value of three and SHALL NOT fall below zero on a spend; spending below zero is refused. Refreshing SHALL return the character to the refresh value. Spend, grant, and refresh are Game Master operations; listing SHALL be readable by any badge. Fate points persist with the Novel. *Acceptance criterion:* spending one Fate point on an entity reduces three to two; a spend exceeding the balance is refused; a refresh returns three. _Check:_ T522.

**REQ-437 — Stress and consequences.** `fate (action: stress)` SHALL mark, clear, and list physical and mental stress plus consequences per character. Marking SHALL record a number of shifts against a physical or mental track and SHALL record a consequence — mild, moderate, or severe — when declared; clearing SHALL empty a named track or consequence slot. Listing SHALL report each entity's physical stress, mental stress, and consequence slots and is readable by any badge. Mark and clear are Game Master operations; stress persists with the Novel. *Acceptance criterion:* marking two physical stress on an entity reports a two-box track; marking a moderate consequence records it; clearing a track empties it. _Check:_ T523.

### 5.22 Ironsworn Base Capabilities

**REQ-438 — Ironsworn momentum.** `ironsworn (action: momentum)` SHALL set, gain, lose, reset, and list momentum — a per-character resource in the range −6 to +10 that defaults to +2. Setting, gaining, losing, and resetting are Game Master operations; listing SHALL be readable by any badge. Momentum SHALL be clamped to the −6..+10 range on every write. Momentum persists with the Novel (REQ-092). *Acceptance criterion:* setting momentum to 5 then gaining 1 and losing 2 reports 4; resetting returns 2; a set above 10 clamps to 10. _Check:_ T524.

**REQ-439 — Ironsworn move framework.** `ironsworn (action: move)` SHALL resolve the Ironsworn action roll — an action die (d6) plus a stat-and-bonus `adds` modifier, compared against two challenge dice (d10). The result SHALL report the action die, the challenge dice, and a band — Strong hit when the action score beats both challenge dice, Weak hit when it beats exactly one, and Miss otherwise. With `burn` set, the action score SHALL be replaced by the burning entity's current momentum (REQ-438), after which momentum resets to its default. The draw SHALL honor the per-call seed (REQ-050). *Acceptance criterion:* a seeded move reports an action die, two challenge dice, and a hit band; the same seed reproduces the same band. _Check:_ T525.

**REQ-440 — Ironsworn progress tracks.** `ironsworn (action: progress)` SHALL create, mark, test, and list generic progress tracks. Creating requires a `name` and a `rank` (troublesome, dangerous, formidable, extreme, or epic) and opens a ten-box track; marking adds `ticks` boxes clamped to ten; testing compares the filled boxes against two challenge dice (d10) and reports Strong hit, Weak hit, or Miss. Create, mark, and test are Game Master operations; listing SHALL be readable by any badge. Progress tracks persist with the Novel. *Acceptance criterion:* creating a dangerous track, marking two boxes, and testing reports the boxes, the challenge dice, and a band. _Check:_ T526.

### 5.23 Forged in the Dark Base Capabilities

**REQ-441 — Action roll with position and effect.** `forged (action: action_roll)` SHALL resolve the Forged in the Dark action roll — a pool of `dice` d6s (default two; a zero-dice pool rolls two d6 and keeps the lower), taking the highest. The result SHALL report the dice, the highest, a `position` (controlled, risky, or desperate; default risky), an `effect` (limited, standard, or great; default standard), and a band — Critical success on a 6, Partial success on 4–5, and Miss on 1–3. The draw SHALL honor the per-call seed (REQ-050). *Acceptance criterion:* a seeded roll with three dice reports the position, effect, highest die, and a band; the same seed reproduces the same result. _Check:_ T527.

**REQ-442 — Stress, trauma, and resistance.** `forged (action: stress)` SHALL mark, clear, resist, and list stress — a per-character track from 0 to 8. Marking adds `amount` stress; when the track fills, the character SHALL gain a trauma and the stress resets to 0. Resisting SHALL spend `cost` stress (default two) to reduce a named consequence and SHALL be refused when the cost would exceed the track. Mark, clear, and resist are Game Master operations; listing SHALL be readable by any badge. Stress and trauma persist with the Novel. *Acceptance criterion:* marking two stress reports a two-box track; a resist spends two; filling the track records a trauma and resets stress; an over-budget resist is refused. _Check:_ T528.

**REQ-443 — Downtime.** `forged (action: downtime)` SHALL recover and indulge a character's vice, and list character stress and trauma. Recovering SHALL reduce stress by `amount` boxes (default two); indulging a vice SHALL clear stress to 0. Recover and indulge are Game Master operations; listing SHALL be readable by any badge. Downtime state persists with the Novel. *Acceptance criterion:* recovering after marking three stress reduces the track; indulging a vice clears it to 0. _Check:_ T529.

#### End of requirements
