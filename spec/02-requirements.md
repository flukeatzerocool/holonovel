## 5. Requirements

_The normative core. Each requirement is one paragraph followed by its check citations._

| §       | Title                               | REQs                                                | Count |
|---------|-------------------------------------|-----------------------------------------------------|-------|
| 5.1     | Output and Error Contracts          | 001–004, 001a–001b, 002a–002c, 004a, 060–062, 064, 070–071, 101, 113, 118, 179, 184, 194, 277, 280 | 24    |
| 5.2     | Extraction and Confidence           | 010–018, 099, 102, 111, 147, 153–154, 207, 209–212, 214–215, 225, 272, 302, 315, 324, 354 | 29    |
| 5.3     | Tools, Resources, and Lookups       | 020–025, 057–059, 063, 067, 078, 105–107, 110, 112, 138–139, 160, 161–164, 169, 182–183, 187, 278, 296, 323 | 32    |
| 5.4     | Decision Workflows                  | 042, 056, 104, 140, 151–152, 190–193, 224, 235       | 13    |
| 5.5     | Hats and Access                     | 030–032, 066, 109, 133–137, 148–150, 159, 216, 220, 223, 281, 286, 304–306 | 26    |
| 5.6     | State and Lifecycle                 | 040–041, 043–044, 065, 069, 072–077, 076a, 079, 116, 119–124, 126–129, 132, 156, 203–206, 217, 221, 229, 232–233, 233a, 234, 236–237, 239, 241–242, 247–250, 252, 255, 285, 307–308, 311, 321–322, 329–332 | 79    |
| 5.7     | Determinism, Safety, and Performance | 050–055, 100, 157, 251, 253, 269           | 14    |
| 5.8     | Enrichment, Lore, and Macros          | 080–087, 084a, 103, 114–115, 125, 130, 155, 158, 226–228, 230–231, 234, 243–245, 260–268, 328, 333 | 41    |
| 5.9     | Novel Persistence and Transport       | 088–098, 117, 131, 238, 240, 256–259, 334           | 21    |
| 5.10    | World-Model Layer                     | 195–202, 222, 283–284, 309, 316–320, 325–327, 367–368        | 22    |
| 5.11    | Ruleset-Free Build Mode               | 218–219                                             | 2     |
| 5.12 | Narrative Architecture | 335–366 | 31 |
| 5.13 | Holodeck | 369–371, 374–375 | 5 |
| 5.14 | Content Sources | 372–373 | 2 |

### 5.1 Output and Error Contracts

**REQ-101 — Assumption audit trail.** In `production` mode, before the Convert
workflow begins, the builder invokes the
`assumption_audit` prompt (a spec-level prompt shipped with the specification — not a
server prompt) against the current spec revision and records at least one
challenged assumption per category — technology, AI-as-builder, extraction and confidence,
MCP ecosystem, state persistence, verification model, build process, runtime guarantees, spec
process — in DECISIONS.md (0). The audit does not block the build. For spec revisions, a
diff-only audit — challenging only assumptions affected by the spec delta — is acceptable.
For same-spec builds against different rulesets, when a prior assumption audit exists for
the same spec version, only assumptions in categories affected by the ruleset paradigm
delta are re-audited. Categories unaffected by the ruleset change (technology, MCP
ecosystem, verification model, build process) carry forward the prior audit results.
The builder records the prior audit's ruleset fingerprint for traceability. Audit re-use
does not block the build — a full audit is always acceptable.
*Acceptance criterion:* DECISIONS.md (0) contains at least one challenged assumption
per category with justification, or a diff-only audit note for spec revisions, or
a re-use note citing the prior audit's ruleset fingerprint for unaffected categories.
_Check:_ T89.

**REQ-001 — Response contract.** _(F3)_ Every tool response begins with a status prefix:
`[OK]`, `[NEED_INPUT]`, `[PARTIAL]`, `[ERROR]`, or `[WARNING]`. Tool-level failures use
`isError: true` with the prefix in `content[0].text`; protocol-level failures use JSON-RPC
error code `-32000` with the prefix in `message`. SDK-level schema errors use `-32602`.
*Acceptance criterion:* Every tool response from a running server uses exactly one
of the five prefixes; protocol-level errors use JSON-RPC error code -32000 with the
prefix in `message`.
_Check:_ G2; Appendix D.

**REQ-001a — Warning and Partial semantics.** `[WARNING]` is raised when the
requested operation succeeds but encounters a condition requiring operator
attention — corrupted-but-unused state, seed conflict where a per-call seed
overrides the session seed, or speculative operations where the server cannot
guarantee the outcome's correctness. `[PARTIAL]` is raised when the requested
operation can produce a partial result but cannot fully satisfy the request —
contradictory ruleset citations where both texts are returned with the conflict
explained, or a canonical lookup that resolves to a section the ruleset marks as
incomplete or placeholder. Neither `[WARNING]` nor `[PARTIAL]` uses `isError:
true`.
*Acceptance criterion:* A corrupted Novel on disk produces `[WARNING]` in
`spec_health` with the Novel slug enumerated; a search returning contradictory
ruleset texts produces `[PARTIAL]` with both texts cited.
_Check:_ T175.

**REQ-277 — Fixture evolution contract.** When a specification change causes a
golden transcript assertion (Appendix B.3, N.3, W.3, X.3) to fail, the maintainer
SHALL:

1. Version-bump the fixture — the fixture carries a `<!-- fixture version N -->` comment.
2. Record the citing REQ that caused the break in the fixture's changelog comment.
3. Update the transcript and RNG witness values to match the new expected behavior.

A fixture transcript that fails replay under a conformant server is a spec defect
— the fixture SHALL be updated, not treated as a regression. The fixture version
SHALL increment on any transcript or witness-value change.
_Check:_ T297.

**REQ-002 — Error taxonomy.** _(F1)_ Every error carries a category: `[FORBIDDEN]`,
`[NOT_FOUND]`, `[INVALID_INPUT]`, `[STATE_CONFLICT]`, `[RULE_VIOLATION]`,
`[UNIMPLEMENTED]`, `[AMBIGUOUS]`, or `[MISSING_PARAM]`.
`[NOT_FOUND]` and `[INVALID_INPUT]` must enumerate session-visible valid
values in the corrective action, derived from the ruleset index and filtered by badge.
When a single close match exists (fuzzy match), include a
"Did you mean?" hint above the enumeration (e.g. `Did you mean 'longsword'?`). When
multiple close matches exist, list them all ("Did you mean one of…"). An
empty-string search returns no results — not an error — with valid-value enumeration.
`[FORBIDDEN]` directs callers to use `set_badge` to switch badges. `[STATE_CONFLICT]` is raised
when an action cannot proceed in the current state (undo with empty snapshot stack, resume of
ended Novel, undo while a workflow is pending). `[AMBIGUOUS]` is raised when the input
matches multiple entries — an alias that resolves to more than one canonical
name. The response enumerates the matching entries with their distinguishing
fields. `[MISSING_PARAM]` is raised when a required parameter is absent or empty
and no default is defined. The response names the missing parameter and its
expected format. Corrective actions are a separate line:
`Corrective action: <action>`.
*Acceptance criterion:* A `[NOT_FOUND]` error on an unknown spell name returns the
category, a "Did you mean?" hint when a close match exists, and a session-visible
list of valid spell names.
_Check:_ T18, T177.

**REQ-002a — Extended error category semantics.** `[RULE_VIOLATION]` is raised
when the input is well-formed and within the tool's domain but violates a
ruleset constraint — a non-stacking bonus applied when already present, a
character creation choice that conflicts with prerequisites, or an action
prohibited by the ruleset's own restrictions. The response cites the ruleset
anchor that forbids the action. `[UNIMPLEMENTED]` is raised when the tool
recognizes the input as valid but the feature is not yet modeled — a subsystem
the ruleset defines but the builder could not extract, recorded as a DECISIONS.md
waiver. The response names the unimplemented subsystem and cites the waiver
entry.
*Acceptance criterion:* Applying a condition already active on the target
returns `[ERROR] [RULE_VIOLATION]` citing the ruleset anchor; calling a tool for
a waived subsystem returns `[ERROR] [UNIMPLEMENTED]` with the waiver reference.
_Check:_ T176.

**REQ-002b — Corrective-action contract.** The `Corrective action:` line is a
single imperative sentence describing what the caller must do to resolve the
error — switching badges.for `[FORBIDDEN]`, providing a valid value from the
enumeration for `[NOT_FOUND]`, or waiting for a state change for
`[STATE_CONFLICT]`. It is not a prompt, not a suggestion, and not a
multi-sentence explanation. For `[UNIMPLEMENTED]`, the corrective action names
the waiver entry in DECISIONS.md (5). For `[SYSTEM]` errors (JSON-RPC
`-32000`), the corrective action is absent — these are unrecoverable at the
tool layer.
*Acceptance criterion:* Every tool-level error response contains exactly one
`Corrective action:` line matching its category; protocol-level errors carry
no corrective action.
_Check:_ T178.

**REQ-002c — Badge-filtered error values.** Valid-value enumerations in
`[NOT_FOUND]` and `[INVALID_INPUT]` errors exclude values the caller's current
hat cannot access — a Player badge sees only player-accessible spell names in a
`[NOT_FOUND]` on `lookup_spell`; a Game Master badge sees the full catalogue.
"Did you mean?" hints follow the same hat filter. A value that exists in the
ruleset but is invisible to the caller's badge is treated as absent for
enumeration purposes — it is neither enumerated nor hinted. This prevents
side-channel disclosure of GM-only content through error message verbosity.
*Acceptance criterion:* A Player-badge `[NOT_FOUND]` on `lookup_spell` with a
GM-only spell name lists only player-visible spell names and provides no
"Did you mean?" hint for the GM-only name.
_Check:_ T179.

**REQ-003 — Roll transparency.** _(F1)_ Every dice-roll tool returns the full calculation
path: dice notation, individual die results, modifiers, total, and outcome. Every modifier's
source and contribution is reported. Every modifier contribution SHALL identify the source
by its ruleset name (e.g., "Strength", "Proficiency", "Bless spell"). When multiple sources
contribute to the total, each SHALL be listed as a separate signed contribution — the
modifier total SHALL NOT be collapsed into a single undifferentiated number. Sources with a
zero contribution (e.g., a non-proficient skill) MAY be omitted. When a resolution mechanic
involves rolling multiple dice of the same type where only a subset is selected (advantage,
disadvantage, keep-N-highest, drop-lowest, or luck rerolls), all rolled faces SHALL be
reported with an indication of which were selected. The selected/used face or faces SHALL be
clearly distinguished from discarded faces. When the ruleset defines named result bands
(e.g., critical success, partial success, failure), the roll outcome reports which
band applies to the total.
*Acceptance criterion:* A d20 attack roll with advantage reports both d20
faces — e.g., `Dice: 2d20 = [12, 7], used: 12` — not just the higher value. A
Strength-based attack roll with +2 proficiency reports `Modifiers: Strength +3,
Proficiency +2` — not `Modifiers: +5`.
_Check:_ G2, T47.

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

**REQ-179 — Output pointer resource template.** The server SHALL register an
`output://{tool_name}/{counter}` resource template in `resources/templates/list`.
The template URI pattern SHALL be `output://{tool_name}/{counter}` where `{tool_name}`
matches the producing tool's registered name and `{counter}` is a
per-session monotonically increasing integer. `resources/read` on a resolved URI SHALL return the
full untruncated tool output as Markdown, badge-filtered per REQ-032. The resource
SHALL declare MIME type `text/markdown` and a title of the form
"<tool_name> output #<counter>". Output payloads SHALL be session-local — they do
not survive server restart. When the session's output storage exceeds a
configurable limit, the oldest payload SHALL be evicted and
its URI SHALL return `[ERROR] [NOT_FOUND]` with a message indicating eviction.
*Acceptance criterion:* After a tool produces output exceeding 32,000 bytes,
`resources/templates/list` includes `output://{tool_name}/{counter}`; reading
the resolved URI returns the full untruncated content, badge-filtered; pushing
storage beyond the limit evicts the oldest payload and its URI returns
`[ERROR] [NOT_FOUND]`.
_Check:_ T221.

**REQ-118 — Prompt length budget.** Every prompt returned by `prompts/get`
stays within a per-prompt token budget. When a prompt's constructed content
exceeds its budget, sections are truncated in priority order (low-priority
first) with `[truncated]` markers and pointers to the corresponding resource
URIs where full content is retrievable. The truncation mechanism preserves the
prompt's structural integrity — section headers remain, and required contract
elements (intro pointer per REQ-063, `player_signal` directives per REQ-078)
are never truncated. The per-prompt budget is configurable; exceeding it
without truncation is a defect.
*Acceptance criterion:* When a prompt's content exceeds its token budget,
low-priority sections are replaced with `[truncated]` markers and resource URI
pointers; section headers and required contract elements are never truncated.
_Check:_ T123.

**REQ-113 — Result count reporting.** A tool that returns a collection of results
reports both the count of items returned and the total count of matching items.
When the total exceeds the returned count, the difference is explicit — the
caller is not required to infer how many results were suppressed. The segment
size is configurable.
*Acceptance criterion:* A lookup returning 3 of 42 matching items reports both
counts — "3 of 42 results" — so the caller knows 39 results are suppressed.
_Check:_ T116.

**REQ-060 — Verbose output.** Tool output is comprehensive — every field the
ruleset defines for the item or action is returned. The roll transparency
contract (REQ-003) governs the format of dice-roll results. Combat lifecycle
output (advance_combat) SHALL follow the conflict lifecycle contract (REQ-043).
Character creation and advancement results include all derived statistics
alongside inputs (see REQ-181 for minimum surface).

*Acceptance criterion:* A weapon lookup returns every field the ruleset defines
for that weapon — damage dice, damage type, properties, weight, cost, range —
not a summary. A spell lookup returns level, school, casting time, range,
components, duration, description, and at-higher-level effects — not a pointer
or summary. A monster lookup returns its full stat block — AC, HP, speed,
ability scores, saves, skills, senses, traits, actions — not a pointer. A class
lookup returns hit dice, HP formula, proficiencies, features by level, and
archetype paths.
_Check:_ T47.

**REQ-061 — Source quoting.** Lookup results, search results, and rule-derived tool
responses include a `---`-separated source block with `<file>#<anchor>` label and verbatim
Markdown excerpt preserving original formatting. Pure-state tools (undo, state queries,
condition queries, audit reads) are exempt.
*Acceptance criterion:* A spell lookup result ends with a `---`-separated block
containing `<file>#<anchor>` and the verbatim Markdown text from the source; an
undo result contains no source block.
_Check:_ T48.

**REQ-280 — Source-anchor citation.** Every ruleset lookup tool — `lookup_spell`,
`lookup_equipment`, `lookup_monster`, `lookup_class`, and `search_rules` — SHALL include
the source anchor from which the content was extracted in every result. The anchor SHALL
include: (a) the source file name; (b) the heading path (e.g., "Spells > Level 3 >
Fireball"); and (c) the line range in the source Markdown (e.g., "lines 1420–1445"). The
anchor is surfaced as a `source_anchor` field in the tool output, positioned after the
mechanical data and before any narrative framing. The anchor enables the caller to verify
the output against the ruleset source without re-running extraction.

For `search_rules`, every result item SHALL carry its own `source_anchor`. For canonical
lookups returning a single entry, the anchor SHALL be the heading from which the entry
was extracted. The anchor is derived from extraction metadata per REQ-010 (traceability)
and SHALL be present even when the extraction confidence is LOW — the anchor labels the
source, not the confidence.

*Acceptance criterion:* `lookup_spell("fireball")` returns a `source_anchor` field with
file name, heading path, and line range. Every result in `search_rules("grapple")`
carries its own `source_anchor`. A ruleset-free build returns `source_anchor: null` for
all lookups (waived per REQ-013).
_Check:_ T-new-280.

**REQ-062 — Badge foundations.** `badge_briefing` includes ruleset-agnostic best-practice
foundations for each badge. The Enrich workflow (§11.1) supplies the expanded foundations
catalogue at `guidance://<badge>/foundations` as supplementary guidance.
*Acceptance criterion:* `badge_briefing` for the Player badge includes ruleset-agnostic
foundations guidance; the Game Master briefing includes both player and GM foundations.
_Check:_ T26.

**REQ-070 — Anti-slop guidance.** Badge foundations include anti-slop guidance — concrete
examples of forbidden narrative patterns with corrected alternatives, tagged `[anti-slop]`
and served at `guidance://<badge>/anti-slop`. The spec carries a synopsis in Appendix J; the
full anti-slop catalogue is sourced from the Enrich workflow (§11.1) as supplementary guidance,
with genre-specific examples from the `adventure_advice` module. Anti-slop guidance is
badge-filtered and appears in `badge_briefing` after foundations and before scene state.
*Acceptance criterion:* (a) Without enrichment, `badge_briefing` includes at least one
`[anti-slop]`-tagged item per badge sourced from the Appendix J synopsis, each carrying a
forbidden narrative pattern and a corrected alternative; (b) the content is badge-filtered
(rows 1–10 are GM-scoped, rows 5–7 and 12 are Player-scoped, rows 8–11 are GM-scoped);
(c) anti-slop guidance appears after foundations and before scene state;
(d) `guidance://<badge>/anti-slop` renders the same patterns as a retrievable resource.
_Check:_ T223.

**REQ-184 — Anti-slop resource rendering.** The server serves anti-slop guidance at
`guidance://<badge>/anti-slop` as a Markdown resource. The resource SHALL include every
Appendix J synopsis pattern whose scope matches the requested badge. Each pattern SHALL
appear as a `[anti-slop]`-tagged item with its Forbidden and Correct text. When enrichment
is active (REQ-159), the resource SHALL include both the Appendix J synopsis and
enrichment-supplied anti-slop items; enrichment items SHALL be tagged `[supplementary]`
with source URL and confidence. Without enrichment, the resource SHALL contain only the
Appendix J synopsis.
*Acceptance criterion:* `guidance://<badge>/anti-slop` returns Markdown containing every
Appendix J pattern for the requested hat, each tagged `[anti-slop]` and badge-filtered;
enrichment-sourced items carry `[supplementary]` with source URL.
_Check:_ T223.

**REQ-194 — Anchor derivation.** Anchors SHALL be derived from heading text
deterministically: lowercase the text, strip punctuation, replace whitespace and
hyphen-equivalent runs with single hyphens, and collapse consecutive hyphens.
Explicit IDs (`{#id}`) take precedence over derived anchors. Role-scoping markers
(`*Keeper only*`, `*Player only*`, or the ruleset's discovered hat terms) SHALL be
stripped from the heading text before derivation. Duplicate derived anchors within
a source file SHALL append `-1`, `-2`, etc. Duplicate explicit IDs across files
SHALL be treated as an authoring defect. Re-indexing the same source SHALL
reproduce identical anchors. Punctuation stripped SHALL be the character class
`[\p{P}\p{S}]` (Unicode punctuation and symbol categories); CJK and other non-ASCII
word characters SHALL be preserved.
*Acceptance criterion:* The same heading text processed twice through anchor
derivation produces the same anchor. A heading with an explicit ID (`{#foo}`)
uses `foo` regardless of its text. Two headings with identical derived text in
the same file produce anchors suffixed `-1` and `-2`.
_Check:_ T16, T236.

**REQ-071 — Narrative tone samples.** `badge_briefing` includes up to three
`[narrative-tone]`-tagged guidance items per badge — example-of-play prose extracted from the
ruleset that demonstrates the ruleset's narrative tone, served at `guidance://<badge>/tone`. Each
carries source anchor and confidence. Discovery (§6.3) extracts these snippets as a
guidance subcategory. When the ruleset provides none, the Enrich workflow (§11.1) may
source community examples. Entity-level voice_examples (REQ-077) are distinct — those
are dialogue snippets attached to specific characters.
*Acceptance criterion:* `badge_briefing` includes at least one `[narrative-tone]`-tagged
item per badge — a prose excerpt from the ruleset demonstrating its narrative
voice, with source anchor and confidence.
_Check:_ T26.

**REQ-064 — Badge behavioral boundaries.** The server respects badge boundaries in
all tool output. The AI's behavioral boundaries are role-dependent. When the AI's
narrative role is Game Master, it describes situations and surfaces information; it
never takes action or makes decisions on behalf of the player. When the AI's
narrative role is Player, it describes character intent; it never prescribes world
facts or narrative outcomes without Game Master confirmation. These boundaries are
delivered in the `badge_briefing` orientation content, determined by the AI's role
per REQ-304. When the AI has no narrative role (null-badge), tool output follows the
active badge's boundary conventions.

When a player's natural-language input carries both in-character and meta-intent
simultaneously — e.g., "I examine the altar" (character action) + "what does my
character see?" (meta-query) — the `suggest_actions` tool SHALL return both
tool categories: the in-character resolution (roll_skill_check, examine) and the
meta-inquiry (search_rules for altar lore). The AI (when in the Game Master role),
informed by `badge_briefing`, SHALL resolve the in-character component through
narration and redirect the meta-intent component through tool calls — it SHALL NOT
silently treat a meta-query as an in-character action resolved without the player's
knowledge.

The `player_signal` tool SHALL accept a `register` signal with values `character`
(speaking or acting in-character) and `meta` (asking a rules question or directing
the GM out-of-character). Setting `register=meta` SHALL suppress in-character
narration in tool output — responses from `suggest_actions`, rule lookups, and
similar tools present bare mechanical information without narrative framing. The
register state persists for the session (discarded on connection close) and is
visible in `badge_briefing` as a Player-Register line. Setting `register=character`
restores narrative-framed output. The default register is `character`.

When a badge is active, `badge_briefing` SHALL include a badge boundary directive — a
single sentence: "You are in the story. Confine tool use and responses to the
current Novel. To step away from the table, call `set_badge(\"none\")`." The
directive is identical for both badges. It SHALL appear after the badge foundations
(REQ-062) and before the anti-slop guidance (REQ-070). It is never truncated
(REQ-135, tier 1).

*Acceptance criterion:* A player typing "Can my character jump the chasm?" under
`register=character` receives `suggest_actions` output with the acrobatics check
tool AND a rules-lookup pointer; under `register=meta` the same input produces
only mechanical information with no "you attempt to jump" narrative framing. The
register state appears in `badge_briefing` and does not persist across server restarts.
The boundary directive appears in `badge_briefing` for both Player and GM badges.
_Check:_ T51, T-new-badge-boundary.

*Out of scope:* transport-layer error handling, client-side error formatting,
error localization or internationalization, and error recovery strategies beyond the
corrective-action model defined in REQ-002.

**REQ-001b — Error boundary.** Tool-level errors (all `[ERROR]` responses with
a category from REQ-002) use `isError: true` and are normal `result` objects —
the calling model receives the error text and can react. Protocol-level errors
are for failures at the transport or request-routing layer — unknown methods,
unparseable requests, or transport disconnection — and use standard JSON-RPC
error codes per Appendix D. SDK-level schema validation failures (bad parameter
types, missing required fields) surface as `-32602` before the tool handler runs
and carry no REQ-002 taxonomy. A conformant server never emits a protocol-level
error with a REQ-002 category string embedded.
*Acceptance criterion:* A tool called with a structurally invalid parameter
returns an SDK-level `-32602` response before the handler — this response does
not contain `[ERROR] [INVALID_INPUT]` or a REQ-002 category. A tool called with
a semantically invalid parameter returns a result with `isError: true` and
`[ERROR] [INVALID_INPUT]`.
_Check:_ T180.

### 5.2 Extraction and Confidence

**REQ-010 — Traceability.** Every modeled mechanic cites the ruleset anchor(s) from which it
was extracted. The citation chain — Markdown source → modeled item → tool/resource →
verification — is traceable end-to-end.
*Acceptance criterion:* `RULESET_MODEL.md` contains at least one anchor citation
per modeled mechanic; `spec_health` reports no uncited extractions.
_Check:_ T15.

**REQ-011 — Confidence.** Every extracted item carries a confidence label: HIGH (unambiguous,
directly from ruleset text), MEDIUM (interpretable but not explicit, or missing a discoverable
trigger), or LOW (contradictory, image-conveyed, broken-link, or structurally defective).
Book-level headings, source-converted sections, and callout types tagged non-normative cap at
MEDIUM. Structured content — formal tables, definition lists (bold-labeled
terms with values), and ordered procedural sequences (at least three consecutive
imperative-verb sentences describing a mechanic's resolution steps) — where the
extraction was stable and not restructured, is HIGH above the book-level cap.
The builder identifies structured-procedural sequences using the same
mechanical-indicator heuristics as the viability pre-check (§6.2): bold-labeled
fields, imperative verbs, and definition-list markup. Sections
flagged as "conveying mechanics" from images, diagrams, or flowcharts are LOW. Confidence is
computed per-section and aggregated per REQ-147, with the player-filtered view as the gating metric. The player filter excludes:
guidance items with GM-only badge scope (REQ-016), mechanics extracted from
GM-only ruleset sections (REQ-032), and enrichment content tagged `[gm_only]`
(REQ-080). The builder computes player-filtered confidence by applying these
exclusions before aggregation per REQ-147.
*Acceptance criterion:* A spell extracted from a table cell at a ruleset-normative
heading carries HIGH confidence; an image-conveyed mechanic carries LOW.
_Check:_ T15.

**REQ-147 — Confidence aggregation.** Per-section confidence is the
percentage of extracted items in that section carrying HIGH or MEDIUM labels,
excluding items marked as guidance (REQ-016) from the per-section count. The
overall player-filtered confidence — the Phase 1 gate metric — is the mean of
per-section confidence scores, weighted by each section's extracted item count.
LOW items count against the section total but do not contribute positively. A
section with zero extracted mechanical items is excluded from the mean. The
formula is: Σ(section_items × section_score) / Σ(section_items) where
section_score = (HIGH + MEDIUM items) / total extracted items in section. The
overall score is expressed as a percentage in `spec_health`.
*Acceptance criterion:* A ruleset with three sections — Section A: 8 HIGH, 2
MEDIUM, 0 LOW; Section B: 3 HIGH, 3 MEDIUM, 4 LOW; Section C (guidance-only, 5
extracted guidance items) — produces per-section scores of Section A = 100%,
Section B = 60%. Section C's guidance items are excluded from the mean per
REQ-016. Overall = ((10 × 1.0) + (10 × 0.6)) / 20 = 80%.
_Check:_ T181.

**REQ-153 — AGENTS.md troubleshooting.** Every build's AGENTS.md includes a
`## Troubleshooting` section documenting at minimum four failure classes —
config mismatch, corrupted state file, hat confusion, and missing
environment variables — each with diagnostic steps recoverable by an
operator without access to the builder. The section must reference
verification commands that exercise the diagnosed failure mode where a
corresponding automated test exists.
*Acceptance criterion:* An operator encountering a `[STATE_CONFLICT]` from
a corrupted state file finds the Troubleshooting section listing the
corruption symptom, the recovery step (restore from `.bak`), and the
verification command to confirm recovery.
_Check:_ T186.

**REQ-154 — README.md handoff content.** Every build's README.md includes: (a)
prerequisite environment and setup instructions that an operator can follow
from a cold checkout; (b) a copy-paste `mcpServers` configuration entry
with key names matching the build-time client target's documented schema
(§6.2 B3); (c) the RNG continuity contract — whether deterministic replay
is guaranteed by seed or session-dependent; (d) the badge model with
tool-access implications; and (e) the state model describing what survives
restart and what is connection-scoped.
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
four sections in order:

1. **Code Map** — a REQ-to-source-file mapping listing every REQ implemented in the
   server and the primary file(s) exercising its contract.
2. **Verification** — the commands to run gates G0–G5 with expected exit codes and
   per-workflow pass criteria.
3. **Troubleshooting** — common operator-reported failure modes per REQ-153.
4. **Build Context** — spec version, build date in ISO 8601, builder model identifier,
   ruleset content hash (REQ-044), and the `holonovel` version used.

Missing sections or sections without content are handoff defects.
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

**REQ-207 — Core-mechanic identification.** The builder SHALL identify the ruleset's core
resolution mechanic — the primary dice/outcome procedure — by applying these criteria in
order, stopping at the first that yields a single candidate: (a) the mechanic the ruleset's
own introduction or "how to play" section designates as the central resolution procedure;
(b) the mechanic cited by the most other sections in cross-references; (c) the mechanic
with the most distinct dice-roll invocations across the ruleset's examples of play. The
criterion used SHALL be recorded in DECISIONS.md (5) alongside the identified mechanic. If
(a)–(c) produce a tie, the builder SHALL record all tied candidates and flag an
`[ambiguous-core-mechanic]` finding. The core mechanic SHALL maintain at least 85%
confidence independently of the overall threshold. WHEN the build operates in ruleset-free
mode THE core-mechanic identification SHALL be skipped. The builder SHALL record
"ruleset-free — no core mechanic" in the core-mechanic field of DECISIONS.md (5). No
`[ambiguous-core-mechanic]` or `[core-mechanic-block]` finding is produced — the absence is
intentional and not a defect.
*Acceptance criterion:* A build against a ruleset whose introduction names "d20 + stat vs
target number" as the core mechanic correctly identifies it via criterion (a). DECISIONS.md
(5) records the criterion used and the mechanic's confidence meets ≥85%.
_Check:_ T251.

**REQ-012 — Graceful fallback.** A section that cannot be modeled as a tool or state remains
searchable via `search_rules` and retrievable as a `ruleset://` resource.
The builder never fabricates mechanics to fill a gap. Missing triggers do not invalidate the modeled portion.
Search returns the expected section in the top 3 results for exact, prefix, and substring queries.
*Acceptance criterion:* An unmodelable section returns `[OK]` with the `ruleset://`
URI from `search_rules` for an exact title query in the top 3 results.
_Check:_ G2, T4.

**REQ-315 — Full-text ruleset indexing.** Every heading and its content from the
ruleset Markdown SHALL be indexed by `search_rules` at runtime. The index SHALL
cover the entire ruleset — every `##` and `###` heading with its associated body
text, regardless of whether the section content was extracted into a tool, resource,
or model. Partial coverage where some ruleset sections are invisible to
`search_rules` is a construction defect. The builder SHALL verify at build time
that the ruleset's table of contents maps to the search index and SHALL record any
unmapped sections in DECISIONS.md (4) with justification. Sections omitted by the
`Convert` workflow's artifact-disposition waivers are exempt.
*Acceptance criterion:* `search_rules("ability scores")` returns results from the
ruleset's character creation chapter. Every heading in the ruleset's own table of
contents resolves to at least one search result for a heading-text query.
_Check:_ T-new-316.

**REQ-111 — Search result quality.** Search results include match context — the
surrounding text from which each match was drawn — sufficient for the caller to
distinguish the match's relevance to the query. Results are ordered by
relevance to the query terms. A search that returns more results than a
configurable display limit includes a count of suppressed results.
`search_rules` confidence reflects query-term match strength, not the extraction
confidence of the matched section. HIGH match confidence requires a non-stop
query token in the section title or first heading; MEDIUM requires a match in
section body text; LOW indicates peripheral or single-word matches. This is
distinct from extraction confidence (REQ-011).
*Acceptance criterion:* Each result carries a confidence label (`[HIGH]`,
`[MEDIUM]`, or `[LOW]`) on the same line as the heading; a multi-match search
returns context snippets for each result, ordered by relevance, with a
suppressed-result count when the display limit is exceeded.
_Check:_ T114.

**REQ-212 — Generation table rolling.** `roll_on_table(table, seed?)` accepts a
table name drawn from the build's indexed generation tables (§6.3 extraction
category 4). It SHALL roll the dice notation embedded in the selected table's
definition — including nested table references — and return the result row with
dice breakdown per REQ-003. A deterministic seed parameter SHALL produce
identical results across calls and sessions (per REQ-050). Tables tagged as
GM-only during extraction SHALL return `[FORBIDDEN]` when called under the
Player badge. When the ruleset contains zero generation tables, `roll_on_table`
SHALL return a clear "no tables indexed" message — the tool is not
unregistered, per the content-absent tool contract (REQ-020, infrastructure
tools clause). The tool is classified as generation (REQ-015).
*Acceptance criterion:* `roll_on_table("gear")` with seed `42` returns the table
row for the gear table exactly; the same call without a seed returns a different
row; `roll_on_table("gm-only-table")` under Player badge returns `[FORBIDDEN]`;
a ruleset with zero tables returns "No generation tables indexed."
_Check:_ T46, T210.

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

**REQ-214 — Table classification.** Every table extracted from the ruleset SHALL
carry a `type` field of `generation` or `lookup`. A generation table contains at
least one dice-range-to-result row and is registered under `roll_on_table`. A
lookup table contains only deterministic reference data and is registered as a
`lookup_<category>` tool or served via `ruleset://` resources. A table containing
any dice-range row is a generation table — generation and lookup rows SHALL NOT
coexist in the same registered tool entry.

When the ruleset contains zero generation tables, `roll_on_table` SHALL be
registered with an empty domain and return `[NOT_FOUND]` with a clear "no random
generation tables in this ruleset" message on any call. The tool description
SHALL reflect this — it SHALL NOT advertise canonical table names that resolve to
nothing. When the ruleset contains at least one generation table, `roll_on_table`
SHALL enumerate valid table names in its input schema dynamically from the
ruleset model.

*Acceptance criterion:* Building for D&D 5e produces a `roll_on_table` whose
`table` parameter enumerates only generation tables (trinkets, madness tables,
wand of wonder, etc.) — not lookup tables (ability_modifiers, difficulty_classes).
Building for a ruleset with zero generation tables registers `roll_on_table` with
an empty domain and a "no tables" response.

_Check:_ T255.

**REQ-016 — Guidance extraction.** Role-addressed prose (imperatives, statements of
responsibility, advice, tone/setting text, examples of play) is extracted verbatim as
guidance items, each with attribution, confidence, and badge scope. Guidance is quoted
inert data — it never influences tool behavior, search results, or model extraction.
*Acceptance criterion:* Guidance items extracted from role-addressed prose carry
source anchor, confidence, attribution method, and badge scope; `guidance://player`
excludes GM-tagged items.
_Check:_ T26.

**REQ-017 — Badge stories.** A MUST-covering set of intent prompts maps each badge's
expected play activities to concrete tool/resource paths. Every hat's stories are
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

**REQ-146 — Reconciliation authority.** When the ruleset restates a mechanic across
multiple sections (e.g., a procedure and a summary table disagree), every source SHALL be
recorded. Authority SHALL be determined by applying these criteria in order, stopping at the
first that yields a single candidate: (a) the section the ruleset's own index or table of
contents designates as the primary reference; (b) the section whose heading text is the most
specific match to the mechanic name; (c) the section within the ruleset's core-mechanics
chapter (the chapter at the shallowest heading depth containing the highest proportion of
mechanical sections); (d) the section with the most explicit procedural text — measured as
the highest count of imperative verbs (roll, add, subtract, compare, apply) within the
section's mechanics paragraphs. If (a)–(d) produce a tie, all tied sections SHALL be
recorded as co-canonical (MEDIUM confidence) and the ambiguity flagged as an
`[authority-tie]` defect. The builder SHALL record which criterion resolved each
reconciliation in the defect log. The most authoritative section SHALL be treated as
canonical; other sources SHALL be LOW confidence.
*Acceptance criterion:* A mechanic restated in three sections — one in the core-mechanics
chapter, one in a summary table, and one in a supplement — assigns canonical status via
criterion (c). With a ruleset whose index points to the summary table, criterion (a)
overrides. An `[authority-tie]` defect is produced when (a)–(d) all produce a tie.
_Check:_ T174.

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

**REQ-210 — Extraction categories.** The builder SHALL extract ruleset content into seven
categories in dependency order within each chunk: Concepts (named ruleset terms: stats,
moves, conditions, statuses), Entities (character types, monsters, NPCs with fields and
lifecycle), Tables (lookup tables and generation tables with dice notation), Actions
(resolution mechanics, commands, generation — classified per REQ-015), Resolution (the core
mechanic: dice notation, stat associations, result bands), Roles (Player and Game Master
terms from the ruleset), and Guidance (badge-addressed prose, verbatim with attribution and
badge scope). A cross-category reference that cannot be resolved against the inventory of
earlier extractions within the same chunk SHALL be recorded as a MEDIUM-confidence finding
in the defect log with a deferred-reference annotation.
*Acceptance criterion:* A ruleset chunk whose Actions reference a Concept term defined
within the same chunk resolves that reference against the Concept inventory. A reference to
a Concept term not yet extracted produces a deferred-reference annotation which resolves
after cross-chunk resolution.
_Check:_ T173.

**REQ-215 — Table content extraction.** The builder SHALL extract generation table
content from the ruleset and register it as `roll_on_table` entries. For each
generation table, the builder SHALL produce: a canonical `key` (snake_case slug
derived from the source heading), a `dice_expression`, a `ranges` array
(min/max/result tuples), a `badge_scope` (derived from source location — tables in
GM-only chapters are `game_master`, otherwise `shared`), and a `source_anchor`
(heading and file path). Table content extraction follows the same confidence
labeling and traceability rules as other extraction categories (REQ-011,
REQ-010).

The builder SHALL detect dice-range tables from Markdown table cells containing
`d100`, `d%`, `d8`, `d20`, or explicit numeric ranges (`01-10`, `11-25`). A row
whose first column is a numeric range is a generation result row. A row whose
first column is a name or label (not a numeric range) is a lookup row. Each
generation table entry SHALL be stored in the ruleset model under
`generation_tables` with its full content, and the server SHALL serve it via
`roll_on_table` at runtime.

*Acceptance criterion:* The D&D 5e build extracts at minimum the Short-Term
Madness, Long-Term Madness, Indefinite Madness, Reincarnate Race, Wand of Wonder,
and Trinkets tables. Each table entry includes dice_expression, ranges with
result text, and a source_anchor. `spec_health` reports the count of extracted
generation tables.

_Check:_ T256.

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

**REQ-102 — Source conversion contract.** When the Convert workflow is selected (§6.2),
source materials are converted to Markdown per Appendix G. The builder SHALL select a
converter satisfying the capability profile in Appendix G.1 and record the selection in
DECISIONS.md (2). Conversion fidelity SHALL be verified per Appendix G.2; progressive
sampling is the RECOMMENDED verification method: trial page (Phase 1) at ≥70% fidelity
gates the batch, content-type
expansion (Phase 2) gates at ≥90% per type, and batch conversion (Phase 3) completes
the source. PDF sources SHALL additionally follow the format-specific protocol
(Appendix G.3): column detection, multi-page table reassembly, image-content
classification, and OCR fallback. HTML sources SHALL additionally follow the
format-specific protocol (Appendix G.4): dynamic content detection, chrome stripping,
chrome fingerprinting, pagination, and content-type classification. The builder SHALL
run cross-converter verification (Appendix G.6) on the fidelity sample pages.
Fidelity results SHALL be reported in the structured format (Appendix G.5). The
converter and its version are pinned in DECISIONS.md (2). Flagged artifacts receive a
disposition in DECISIONS.md (5): `fixed`, `waived`, or `pending`. Conversion fidelity
rates appear in `spec_health` (REQ-025).
*Acceptance criterion:* A converted PDF produces a fidelity report in `spec_health`;
any content type below 90% fidelity blocks the batch and records a disposition in
DECISIONS.md (5). DECISIONS.md (2) records the selected converter and any
cross-converter verification results in DECISIONS.md (5).
_Check:_ T93.

**REQ-225 — Ruleset-native enrichment extraction.** During Discovery (§6.3), the
builder SHALL classify extracted guidance into the seven enrichment output modules
(voice_examples, briefing_order, lore_templates, action_patterns,
supplementary_guidance, adventure_advice, narrative_voices) using the ruleset's own
text. Extraction sources and confidence: ruleset example-of-play dialogue = HIGH,
ruleset GM advice chapters = HIGH, ruleset setting descriptions = HIGH, ruleset
"Inspirational Reading" or Appendix N media citations = HIGH, ruleset encounter
tables = HIGH. Ruleset-native items carry `[ruleset]` tag with source anchor.

Classification is feedback-driven, not a one-pass sort. After the initial
classification pass, the builder SHALL check each module for content. When a module
is empty, the builder SHALL re-read the source ruleset section most likely to contain
the missing content and attempt re-classification — one pass per barren module. The
mapping is:

- Empty voice_examples → re-read example-of-play dialogue sections.
- Empty briefing_order → re-read GM advice chapter structure.
- Empty lore_templates → re-read setting/location description sections.
- Empty action_patterns → re-read example-of-play resolution sequences.
- Empty supplementary_guidance → re-read imperative advice paragraphs addressed
  to GM or player.
- Empty adventure_advice → re-read encounter tables and campaign frameworks.
- Empty narrative_voices → re-read inspirational-media citation sections
  (REQ-226).

When ruleset-native extraction leaves a module barren after the re-read mapping
pass, the builder SHALL attempt to populate that module from vendor content
(§11.2). The vendor mapping is: voice_examples → DMCP NPC voice design;
briefing_order → DMCP campaign lifecycle structure; lore_templates → IF Craft
Corpus worldbuilding; action_patterns → DMCP combat management;
supplementary_guidance → DMCP NPC guidance + Lonelog session notation;
adventure_advice → DMCP campaign lifecycle + BitD clock patterns;
narrative_voices → IF Craft Corpus genre conventions + BitD thematic advice.
Vendor items carry `[vendor]` tag with source anchor pointing to the vendor file.
A module populated only by vendor content counts toward the ≥4 of 7 modules
populated acceptance criterion.

Items are sorted into module slots: example-of-play dialogue →
voice_examples, GM advice chapter structure → briefing_order, setting/location
descriptions → lore_templates, example-of-play resolution sequences →
action_patterns, GM/player advice prose → supplementary_guidance, encounter tables
and campaign frameworks → adventure_advice. Tier 1 enrichment (ruleset-native +
vendor) is populated at build time and is always present in the Novel (REQ-227). In ruleset-free mode
(B1=none), all enrichment modules SHALL be empty — recorded as "ruleset-free" in
DECISIONS.md (4).
*Acceptance criterion:* A ruleset with GM advice chapters and example-of-play
dialogues produces ruleset-native enrichment items in ≥4 of the 7 modules with
`[ruleset]` tag and source anchors.
_Check:_ T-new-225.

*Out of scope:* extraction from non-Markdown sources without prior conversion
(§6.2 Convert workflow), confidence models beyond the three-tier HIGH/MEDIUM/LOW
system, and semantic interpretation of image-only content.

**REQ-354 — Extended narrative enrichment extraction.** During Discovery
(§6.3), the builder SHALL extend REQ-225 extraction to include the
following sources, mapping each to the `supplementary_guidance` output
module: scene type and pacing conventions (from GM advice chapters
discussing when to use combat, social, and exploration scenes);
relationship patterns (from NPC interaction guidelines and
example-of-play dialogues depicting alliances, rivalries, and
allegiances); countdown and tension clocks (from encounter design and
pacing sections describing timed threats and escalating stakes); secret
and revelation pacing (from mystery design, investigation guidance, and
information-revelation chapters); player signal conventions (from
GM-player communication guidance discussing tone, boundaries, and
session pacing feedback); and story journal and session recording (from
session notation chapters and campaign record-keeping guidance).
Items follow the same confidence model and `[ruleset]` tagging contract
as REQ-225. Extraction that produces no items from these sources SHALL
NOT mark the module barren — `supplementary_guidance` remains populated
by existing REQ-225 sources. Items SHALL carry a `component_type`
annotation identifying the narrative area they enrich: `scene_type`,
`relationship`, `countdown`, `secret`, `player_signal`,
`story_journal`, `scene_beats`, `pacing`, `autonomy`,
`constraint_override`, `scene_world`, or
`npc_world`.

The `constraint_override` component type SHALL map to GM advice chapters
discussing mechanics that bypass physical world limits — teleportation
spells, phasing abilities, light-source magic — and SHALL feed the
constraint override design patterns (REQ-325). The `scene_world` component
type SHALL map to setting and location descriptions with explicit adjacency,
sight lines, or spatial relationships — rooms that connect to other rooms,
environments where line of sight matters (REQ-326). The `npc_world`
component type SHALL map to NPC interaction guidelines mentioning
positioning, patrol routes, territory, or situational awareness — NPCs
placed in specific rooms with behavioral context (REQ-327). The
`scene_beats` component type SHALL map to GM advice chapters discussing
dramatic structure — rising action, climax, denouement, scene
sequences — and SHALL feed the story beats briefing surface (REQ-335).
The `pacing` component type SHALL map to session-management advice
discussing scene duration, action-to-description cadence, and when to
cut scenes — and SHALL feed the pacing signal surface (REQ-336). The
`autonomy` component type SHALL map to solo-play and GM-emulation
advice discussing NPC agency, faction independence, and automated world
reaction — and SHALL feed faction autonomous advancement (REQ-338) and
NPC goal pursuit (REQ-339). Items extracted with these component types
follow the same confidence model and `[ruleset]` tagging contract. Items SHALL include the corresponding world-model REQ
citation in their `source_anchor`.

*Acceptance criterion:* A ruleset with GM advice chapters produces at
least one `[ruleset]` enrichment item in `supplementary_guidance`
carrying a `component_type` annotation from the extended source list.
A ruleset without these chapters produces the same
`supplementary_guidance` output as REQ-225 alone — no additional items.
_Check:_ T-new-361.

**REQ-324 — Constraint override extraction.** During Discovery (§6.3), the
builder SHALL scan for mechanics that explicitly suspend world-model physical
constraints. The builder SHALL match language patterns indicating constraint
suspension in spell descriptions, class features, items, and abilities:

| Pattern | Constraint overridden |
|---------|----------------------|
| "opens locked," "unlocks" | `lockable` |
| "pass through solid," "incorporeal" | `solid` |
| "see in darkness," "darkvision" | `dark` |
| "fly," "levitate," "climb" | `ground_constraint`, `climbable` |
| "teleport," "dimension door" | `solid`, `exit_constraint` |
| "breathe underwater" | `underwater` |
| "detect invisible," "see invisible" | `hidden` |
| "find traps," "detect traps" | `hidden`, `readable` |
| "force open," "bend bars" | `lockable`, `solid` |
| "create passage" | `solid` |
| "silence," "muffle" | `sound` |
| "squeeze through," "tiny" | `solid` |
| "read any language" | `readable` |
| "walk on water" | `liquid` |

Each override SHALL be classified by constraint type and mechanic source
(spell, class_feature, item, ability). Overrides SHALL carry the mechanic's
name, prerequisites (level, spell slot, item equipped), and source anchor.
Discovered overrides SHALL be registered in RULESET_MODEL.md. The patterns
are ruleset-agnostic — any ruleset's mechanics can match them. When no
overrides are discovered, RULESET_MODEL.md records zero overrides — this is
not an error. The override catalog is fed into the constraint override
registry (REQ-325) and `resolve_intent` (REQ-323). In ruleset-free mode,
the scan SHALL be skipped with "ruleset-free" annotation.
*Acceptance criterion:* A ruleset with Knock, Fly, and Darkvision spells
produces at least three constraint overrides classified by type in
RULESET_MODEL.md, each with mechanic name and source anchor. A ruleset
without constraint-overriding mechanics produces zero overrides.
_Check:_ T-new-324.

### 5.3 Tools, Resources, and Lookups

**REQ-020 — Tools.** Server behavior is modeled as MCP tools. Tools derive names from
ruleset terminology — never invented names. Character creation, condition management,
combat encounter management, table rolling, and session recap are the minimum tool categories any
ruleset deserves; missing categories are recorded as waivers.

Tools in the following categories exist independent of ruleset content and SHALL
always be present in `tools/list`:

- **World** — room, thing, exit, and property CRUD; parser command dispatch;
  `convert_source`. (`holonovel` package.)
- **Novels** — save-file operations: lifecycle (`create_novel`, `resume_novel`,
  `end_novel`, `switch_novel`, `clone_novel`), exchange (`export_novel`,
  `import_novel`, `export_lorebook`, `import_lorebook`), checkpoints
  (`set_checkpoint`, `list_checkpoints`, `restore_checkpoint`,
  `delete_checkpoint`), notes (`set_note`, `remove_note`, `list_notes`),
  resume state (`save_pause_context`, `get_resume_context`), and archive
  (`compact_audit_log`), and server notes (`set_server_note`,
  `remove_server_note`, `list_server_notes`).
- **Badges & Workflow** — `set_badge`, `respond`, `undo`, `redo`, `help`.
  The identity and permission layer — never waived.
- **Narrative** — story-content tools, grouped by function: Scene & Tone
  (`set_scene_state`, `set_scene_type`, `set_narrative_directive`,
  `generate_encounter`), Cast & Characters (`create_npc`, `update_npc`,
  `remove_npc`, `set_personality` (NPCs), `set_voice_examples` (NPCs),
  `set_relationship`, `get_relationships`), World State (`set_lore_entry`,
  `update_lore_entry`, `remove_lore_entry`, `toggle_lore_entry`,
  `set_lore_group`, `suggest_lore`, `create_faction`, `update_faction`,
  `remove_faction`, `set_countdown`, `advance_countdown`, `remove_countdown`,
  `set_vow`, `mark_milestone`, `resolve_vow`, `forsake_vow`,
  `set_secret`, `reveal_secret`, `check_knowledge`), Player Interaction
  (`present_choices`, `suggest_actions`, `player_signal`), Story Memory
  (`record_story`, `update_story`, `remove_story`, `list_stories`,
   `session_recap`, `compress_audit`), Session
  Management (`set_briefing_order`, `load_adventure`, `generate_adventure`), and
  Enrichment Controls (`revert_enrichment`, `list_enrichment_items`,
  `activate_enrichment_item`, `deactivate_enrichment_item`,
  `remove_enrichment_item`, `toggle_action_patterns`,
  `player_enrich`, `player_remove_enrichment`,
  `player_list_enrichment`). These categories
  are never waived.

The `help` tool SHALL present these infrastructure categories as the base
grouping for its task map. The builder MAY subdivide or rename categories for
runtime display, but every tool in the infrastructure enumeration SHALL appear
under exactly one help category. The mapping from infrastructure category to
help category name SHALL be recorded in DECISIONS.md. Help category names are
advisory — the GM may override them (REQ-067) — but the infrastructure
classification is immutable.

Tools whose results depend on indexed ruleset
content (`search_rules`, `suggest_actions`, `generate_adventure`,
`generate_encounter`) produce empty or context-only results when that content is
absent — they are not absent from the tool surface.
*Acceptance criterion:* `tools/list` includes at minimum character creation,
condition management, combat, table rolling, and session recap tools; a missing
category is recorded as a waiver in DECISIONS.md.
_Check:_ T3, T5, T32,
T33; G2.

**REQ-021 — Tool-surface economy.** A named set of related operations (one per table, one
per move, one per stat) shares a single parameterized tool. The tool surface is determined
by extraction, not by what a builder finds easy to implement. The per-tool justification
list matches the registry.
*Acceptance criterion:* No two tools share identical parameter schemas differing
only by category enum; the per-tool justification list in DECISIONS.md matches the
live `tools/list` registry.
_Check:_ T3, T35.

**REQ-022 — Resources.** The server provides `ruleset://` (with badge filtering),
`entities://`, `entity://<id>`, `audit://novel`, `roster://<type>`, `roster://<id>`,
`guidance://<badge>`, `guidance://<badge>/anti-slop`, `guidance://<badge>/tone`,
`guidance://<badge>/foundations`, `guidance://shared/badge-switch`, `scene://current`, `scene://history`,
`countdown://active`, `party://current`, `npc://<id>`, `npcs://`, `entity://<id>/personality`,
`entity://<id>/voice_examples`, `lore://active`, `lore://<key>`, `lore://templates`,
`enrichment://voice_examples`, `enrichment://briefing_order`,
`enrichment://action_patterns`, `enrichment://adventure_advice`,
`enrichment://narrative_voices`, `enrichment://status`, `adventure://<slug>/<anchor>`, `novel://current`,
`novel://<slug>`, `novel://<slug>/preview`, `novel://setup`, `room://<id>`,
`thing://<id>`, `world://map`, `world://kinds`, `graph://novel`,
`spec://build` (GM-filtered),
`output://{tool_name}/{counter}`. `resources/templates/list` advertises entity,
roster-record, and `output://` templates. `resources/read` returns Markdown with a small
source header.
*Acceptance criterion:* `resources/list` includes all required URIs;
`resources/templates/list` includes entity, roster, and `output://` templates;
each resource declares a media type and title.
_Check:_ T16, T104.

**REQ-296 — Knowledge-graph resource.** THE server SHALL provide a `graph://novel` resource
returning the Novel's entity-relationship graph as a structured adjacency list. The resource
SHALL include: (a) `entities` — all Novel entities with their current relationships;
(b) `npcs` — all NPCs with relationships, dispositions, and location; (c) `lore_connections`;
(d) `secrets` — secret lore entries mapped to the entities that have had them revealed;
(e) `factions` — faction memberships. The resource is badge-filtered: Player badge sees only
relationships involving their active entities, `shared`-scope lore, and revealed secrets.
When no Novel is active, `resources/read` returns `[STATE_CONFLICT]`. `graph://novel` has
no briefing presence per §5.10.

*Acceptance criterion:* After creating 2 NPCs with a relationship, setting a faction with
1 member NPC, and revealing a secret to entity "hero", `graph://novel` under the GM badge
includes entities, NPCs with relationships, lore_connections, secrets, and factions.
_Check:_ T-new-296.

**REQ-023 — Prompts.** The server provides prompts covering multi-step workflows,
badge briefing, connection introduction (REQ-063), session zero (REQ-078), and Novel
setup (REQ-089). Tool-use intent mapping is handled by the `suggest_actions` tool
(REQ-084) rather than a prompt — a dedicated prompt for this function is
redundant. The remaining intent-mapping prompt (`run_workflow`) derives its tool
associations from the registered tool catalog and the ruleset extraction model's
action classifications (REQ-015) — not from hardcoded keyword strings that assume
a specific ruleset's terminology. Prompts are dynamic: adding a tool, resource, or
guidance item updates their output without restart. `prompts/get` returns exactly
one user-role message. `prompts/list` carries a title on every prompt and a
description on every argument.
*Acceptance criterion:* Removing a stub tool and restarting removes it from all
five prompts; adding a tool updates prompt output without restart; `prompts/list`
carries a title on every prompt and a description on every argument.
_Check:_ T22, T28, T155.

**REQ-024 — Tool documentation.** Every tool carries a `title` field with the ruleset's own
term for that action. Annotations match action classification.
*Acceptance criterion:* Every tool's `title` field uses the ruleset's own term
for that action; a `lookup_weapon` tool under D&D 5e is titled "Weapons" not
"lookup_weapon."
_Check:_ T3, T35, T39.

The `description` field SHALL follow a three-clause structure: a one-line summary
of the tool's action (verb + object), a "Use when:" clause naming concrete
scenarios that select this tool, and a "Do NOT use when:" clause naming sibling
tools the caller should prefer for similar-sounding requests. Descriptions longer
than three sentences are truncated in `tools/list`; the full text remains
available at `resources/read`.

*Acceptance criterion:* Every tool's description contains all three clauses;
overlapping tools (e.g., `roll_weapon_attack` and `roll_weapon_damage`) name
each other in their disambiguation clauses; a verifier can map a natural-language
player intent to the correct tool using only the tool descriptions.
_Check:_ T3, T49.

**REQ-025 — spec_health.** A `spec_health` tool reports: confidence scores
(per-file and overall), conversion fidelity (per-content-type rates, overall rate,
sample set, unresolved ambiguities, confidence cap counts — per REQ-102; absent
when conversion was not selected), convergence summary (per-metric iterations run,
findings per iteration, residual gaps for each metric in §6.5), including a per-category confidence breakdown —
for each of the seven extraction categories (§6.3: concepts, entities, actions, tables, resolution, roles, guidance),
the count and percentage of HIGH, MEDIUM, and LOW items, and per-metric velocity —
for each quantitative metric in both Phase 1 and Phase 2, the per-iteration delta (Δ)
from the previous measurement, recorded as a signed value. Velocity
SHALL be reported alongside each metric's iteration count. When a metric's
velocity drops to zero for two consecutive iterations while the metric remains
below threshold, the builder SHALL record a `[velocity-stall]` finding in
DECISIONS.md (5) and the metric's step is aborted per §6.5.1 no-delta
detection — the velocity stall counts as the stalled iteration. This
integrates velocity into the existing no-delta detection mechanism without
adding a separate exit criterion, indexed
counts (anchors, concepts, entity types, actions, tables, procedures, guidance items,
enrichment items per module — ruleset-native count for each of the seven output modules),
pending sections, MUST-action coverage, defect count, ruleset-version status,
spec_repo_url, verification workflow dispositions, available Novels on disk (slug, name,
last-modified, active — per REQ-093; the dedicated `list_novels` tool — REQ-257 — is the
primary save-file browsing surface), and prompt health — each registered prompt's name, presence
(present/absent), length relative to its configured budget, and stale references
(tool or resource names appearing in prompt text that do not match any registered
tool or resource). Counts are derived from live registrations at call time — the
running tool catalog, resource map, prompt list, search index, and extracted data
arrays — not from hardcoded numeric literals. The Player badge sees only
player-filtered metrics. Output is filtered by badge. The convergence summary section
is absent when the build is not yet complete. `spec_health` SHALL include a
`gap_audit` section containing: a delta summary comparing the server's recorded
spec version against the current spec version recorded at build time — a
`server_spec_version` field (CalVer date-stamp from the server's build
fingerprint), a `current_spec_version` field (CalVer date-stamp from the active
build), and a `version_advanced` boolean (true when `current_spec_version` is
lexicographically greater than `server_spec_version`, indicating the spec has
advanced and a gap audit is needed); a tool-catalog comparison (tool count from live registry vs
expected per REQ-020 categories, with per-category presence), a resource-map
comparison (URI count from live registry vs REQ-022 catalog), a prompt-list
comparison (prompt count and names from live registry vs REQ-023 contract, with
per-prompt title and argument-description presence), and a badge-gating summary
(tool count per gate classification per REQ-136). The `gap_audit` section
SHALL be absent when the build is not yet complete.

`spec_health` SHALL include a `cross_ref_health` section reporting: (a)
`total_cross_refs` — the count of cross-references discovered during extraction across
all ruleset sections (a spell referencing a condition, a class feature referencing a
spell, equipment referencing a mechanic); (b) `resolved` — cross-references where the
referenced entry exists in the extraction; (c) `unresolved` — cross-references where
the referenced entry does not exist in the extraction, each flagged with the source
entry, the referenced target, and the source anchor; (d) `unresolved_pct` — percentage.
When `unresolved_pct` exceeds 5%, `spec_health` SHALL include a `[fidelity_warning]`
annotation. The builder records the `cross_ref_health` section in DECISIONS.md (4).

A rebuilt server re-computes cross-reference health from the current extraction. A
previously resolved cross-reference that becomes unresolved after a ruleset change SHALL
be flagged as a `[regression]` in the `unresolved` list.

`spec_health` must report a `pattern_buffer_scenarios` field containing
`passed` (count of sub-workflows that passed on the most recent run),
`total` (total sub-workflow count per §6.6), and `last_run` (ISO 8601
timestamp of the most recent Pattern Buffer execution, absent if never run).
When `last_run` is absent, `passed` and `total` are absent. The field is
badge-filtered: Player badge sees this field; no GM-only content is exposed.

`spec_health` SHALL include a `search_index_coverage` field containing:
`total_headings` (the count of `##` and `###` headings in the ruleset source at
build time), `indexed_headings` (the count of headings with entries in the
runtime search index), and `coverage_pct` (indexed_headings / total_headings ×
100). A coverage below 100% SHALL include an `unmapped_sections` array listing
each unmapped heading with its source file and anchor. Coverage below the
configurable threshold SHALL surface a `[search-coverage-warning]`
annotation.

*Acceptance criterion:* `spec_health` counts match the live registry — adding
a tool, resource, or prompt increments the count immediately; counts are derived
from arrays at call time, not hardcoded.
_Check:_ T15, T45, T93, T105, T154.

**REQ-160 — Enrichment health reporting.** `spec_health` SHALL report
enrichment status with these minimum fields: (a) `enrichment_active` —
boolean indicating whether enrichment state exists; (b) `module_counts`
— per-module item count for each of the seven output modules (§11.1); (c)
`stale_count` — number of inactive enrichment items whose `collected_at`
exceeds `TTRPG_ENRICH_STALE_DAYS`; (d) `activated_count` — number of
enrichment items the Game Master has incorporated into active Novel state
via Novel-scoped tools (REQ-159); (e) `fingerprint` — the enrichment
fingerprint used for idempotence detection (ruleset content hash +
intake answers). Stale items SHALL appear with the `[stale]` flag when
listed. When enrichment has never been run, `enrichment_active` is false
and all count fields are zero.
When enrichment is absent (never run or reverted), `module_counts`
SHALL include all seven module names — `voice_examples`,
`briefing_order`, `lore_templates`, `action_patterns`,
`supplementary_guidance`, `adventure_advice`, `narrative_voices` — each with value zero.
An absent `module_counts` field or an empty object does not satisfy
this contract.
The enrichment health section is visible
to all badges — Player and GM alike see whether enrichment is active and
how many items are stale, but per-module content is badge-filtered per
REQ-080.
*Acceptance criterion:* After enrichment, `spec_health` reports
`enrichment_active: true`, per-module counts matching the manifest, and
a non-empty fingerprint. After `revert_enrichment`, `enrichment_active`
is false and all counts are zero. Stale items increment
`stale_count` and carry `[stale]` flag. After GM activates a lore
template via `set_lore_entry`, `activated_count` increments by one.
_Check:_ T195.

**REQ-169 — Audit chain integrity reporting.** `spec_health` SHALL include an
`audit_chain` field containing: `valid` (true when the hash chain is unbroken
from first entry to last, false when any entry's hash does not match the computed chain),
`entries` (total count of audit entries), and `first_broken_index` (the zero-based index
of the first entry whose hash verification fails; absent when `valid` is true). Chain
verification is performed at `spec_health` call time by recomputing every entry's hash
from the preceding entry's hash. A Novel with zero audit entries reports `valid: true,
entries: 0`. When no Novel is active, the field is absent.
*Acceptance criterion:* A Novel with 5 valid entries reports `audit_chain: { valid: true,
entries: 5 }` with `first_broken_index` absent; tampering with entry 2's hash produces
`valid: false, first_broken_index: 2`; the field is absent when no Novel is active.
_Check:_ T204.

**REQ-138 — Prompt health reporting.** `spec_health` SHALL include, for each
registered prompt: its name, presence (present/absent), character length, the
configured budget from REQ-118, a budget-compliance flag (within/exceeded), and
a stale-references list — tool or resource names appearing in the prompt's
rendered text that do not match any name in the live tool registry or resource
map. A stale reference is one whose name (matching by exact string or the MCP
SDK's registration name) appears in the prompt text but is absent from the
live registrations at call time. The absence of any stale references SHALL be
reported as an empty list. Prompt health SHALL be present in `spec_health`
regardless of build mode.
*Acceptance criterion:* `spec_health` reports prompt health for every
registered prompt; renaming a tool referenced in a prompt produces a stale
reference entry on the next `spec_health` call; restoring the tool name clears
the entry.
_Check:_ T152.

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
a `safety_protocols` object enumerating each safety property protected by the build
and its status:

- `state_loss` — Novel state is recoverable after restart
- `badge_boundary` — GM-only content never leaks to Player badge
- `data_corruption` — corrupted state files are detected and isolated
- `unrecoverable_crash` — the server handles adversarial input without crash

Each property carries a `status` of `online`, `degraded` (one or more non-blocking
Pattern Buffer failures in relevant sub-workflows), or `offline` (blocking failure
unresolved). Properties with no exercising Pattern Buffer sub-workflow SHALL report
`unverified`. Per-safety-property status is recorded in DECISIONS.md (6) alongside the
Pattern Buffer fingerprint.
_Check:_ T289.

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

**REQ-107 — Version coordination.** The server carries its build-time specification
version in the build fingerprint, surfaced through `spec_health` under a `spec_version`
field. The version is a CalVer date-stamp (YYYY.MM.DD) matching the CHANGELOG entry date
at which the specification was last substantively changed. The builder records the spec
version in DECISIONS.md §2 Pinned Versions at intake and sets the server's `package.json`
version to the same value. The two SHALL agree; a mismatch is a build-time defect that
blocks handoff. During a spec-driven update (REQ-098), the builder compares the current
spec version against the server's recorded version: when the spec version has advanced,
the gap audit proceeds; when unchanged, the builder reports the server is current and
exits without mutation. The version string is informational — it does not gate runtime
behavior beyond reporting.
*Acceptance criterion:* `spec_health.spec_version` is a CalVer date-stamp matching
DECISIONS.md §2 Pinned Versions; the server's `package.json` version matches both; a
gap audit against the same version exits "current" without mutation.
_Check:_ T106.

**REQ-187 — Spec content hash computation.** The builder SHALL compute the
specification content hash at build time from the embedded spec file
(`holonovel.md` in the server directory, per §6.4) and record it in the
server's build fingerprint. The stored hash SHALL be read from the build
fingerprint at runtime — never from a hardcoded literal. A mismatch between the
stored hash and the embedded file's current hash at startup SHALL surface as a
warning on stderr and in `spec_health`. The hash algorithm SHALL be SHA-256.
*Acceptance criterion:* Computing the SHA-256 hash of the embedded spec file
produces the value recorded in `state.buildFingerprint.specHash`; modifying the
embedded file and restarting produces a drift warning; `spec_health` reports the
stored hash alongside a `spec_hash_current` boolean.
_Check:_ T226.

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

**REQ-161 — Intake workflow contract.** Before any workflow begins, the builder SHALL
present the operator with Q0 (workflow selection) and, when two or more workflows are
selected, Q1 (pause toggle). After Q0 and Q1, the builder SHALL present all questions
relevant to the selected workflows in one batch. Answers SHALL be recorded in DECISIONS.md
(1) before any workflow execution begins. A build that begins without recorded answers for
all selected-workflow questions fails the process-compliance convergence metric (§6.5). When
an operator selects workflows at different times, the builder SHALL re-ask only the new
workflow's questions. After recording answers, the builder SHALL confirm back: selected
workflows, all answers, and the first workflow to execute. Non-interactive runs SHALL use
the defaults enumerated in §6.2. The default for Q0 SHALL be determined by network probing:
when the probe succeeds, the default is `build + enrich`; when the probe fails, the default
is `build` only; the builder SHALL record the probe result in DECISIONS.md (1).
*Acceptance criterion:* A build started without DECISIONS.md (1) intake answers fails the
process-compliance metric. A non-interactive run with network detected defaults to
`build + enrich`. A run re-selecting an additional workflow re-asks only that workflow's
questions.
_Check:_ T196.

**REQ-162 — Build-mode profiles.** The build SHALL operate in one of two modes, selected
at intake via B9. `production` mode (default) SHALL run the full quality suite: assumption
audit (REQ-101), per-step audits with auditor pre-flight (§6.5), post-write verification on
every file written during construction (§6.5.3), cross-model auditing when available
(§6.5.2), and the full Pattern Buffer (§6.6). `quick-build` mode SHALL narrow the overhead: it
skips the assumption audit, skips auditor pre-flight, scopes post-write verification to
critical files only (DECISIONS.md, MCP client configuration, on-disk Novel state), and
accepts same-model audits. The Pattern Buffer SHALL gate both modes — any build that creates or
modifies tools MUST pass the Pattern Buffer before marking complete. A quick-build-mode build
SHALL record a `quick-build` annotation in DECISIONS.md (6) listing which rituals were
skipped. A quick-build-mode build is runnable but not handoff-ready.
*Acceptance criterion:* A production build records assumption audit (T89), auditor
pre-flight, and cross-model audit results. A quick-build build records a `quick-build`
annotation listing skipped rituals and passes the Pattern Buffer. A quick-build build without
the annotation fails the process-compliance metric.
_Check:_ T197.

**REQ-163 — Client config verification.** After writing the MCP client configuration
entry, the builder SHALL fetch the target client's documentation for its MCP server config
schema (from the B3 answer) and verify every key name in the written entry matches the
target's documented conventions. Known schema variants (including `workdir` vs `cwd`, `env`
vs `environment`, `args` array placement vs appended to `command`) SHALL be checked. An
incorrect key is a client-config defect (F6) and SHALL block the build until remedied. When
B7 is `yes`, the builder SHALL write the server entry into the client's config file and
immediately verify the server launches via the client's documented invocation: the
initialize handshake SHALL succeed with `serverInfo.name` matching the `mcpServers` key. A
`server unavailable` error SHALL stop the line.
*Acceptance criterion:* A config entry with `workdir` targeting a client expecting `cwd`
produces an F6 defect and blocks the build. After correction, the initialize handshake
succeeds with matching `serverInfo.name`.
_Check:_ H11.

**REQ-164 — Viability pre-check.** After G0 structural integrity passes but before chunked
discovery begins, the builder SHALL count mechanical sections — headings containing
procedures, tables, bold-labeled fields, or definition lists — as a proportion of total
`##`-level sections. If mechanical sections are below 30% of total sections, the builder
SHALL warn the operator: "This ruleset is below the mechanical-density threshold (X%
mechanical). Discovery may not produce a playable server." The operator MAY proceed, select
a different source, or abort. The builder SHALL record the pre-check count and operator
decision in DECISIONS.md (4). Guidance-only sections SHALL be excluded from the mechanical
count but SHALL be included in the total-section denominator.
*Acceptance criterion:* A ruleset with 15 mechanical sections out of 60 total sections
(25%) triggers the warning. The builder records the count (15/60 = 25%) and the operator's
decision in DECISIONS.md (4). A ruleset with 25/60 (42%) proceeds without warning.
_Check:_ T199.

**REQ-067 — Help and tool discovery.** The server provides a `help` tool, listed in the
required utility tools alongside `search_rules`, `respond`, `undo`, and `spec_health`.
`help` accepts an optional `query` parameter. With no query, it returns: (1) a pointer to
the `intro` prompt, (2) a categorized task map — tools grouped by task domain (characters,
dice and resolution, combat, lookups, state, adventure) with one-line descriptions, and
(3) a pointer to `badge_briefing` for hat-specific guidance. With a query, it
searches tool descriptions, prompt summaries, and guidance text for the most relevant
matches and returns their names, descriptions, and example invocations from the tool-use
playbook. Output is badge-filtered. The Game Master may customize the task-map category
assignments via a Novel-scoped mapping. A tool reassigned to a user-defined category
is removed from its builder-assigned category. The mapping persists with the Novel.
Player badge results always reflect builder-assigned categories. The builder-assigned
categories SHALL follow the default set by `TTRPG_WORLD_PROMINENCE` (REQ-309). An
empty mapping restores builder defaults.
*Acceptance criterion:* `help()` returns an intro pointer, task-map with one-line
descriptions, and a `badge_briefing` pointer; `help("combat")` returns the most
relevant combat tools with example invocations.
_Check:_ T62, T118.

**REQ-063 — Connection introduction.** The server provides an `intro` prompt, listed first
in `prompts/list`. It takes no arguments, is visible to all badges, and serves as a
conversation starter — a brief overview of the ruleset, its core mechanic, and concrete next
actions a player can take. The tone is engaging and energetic; the anti-slop catalogue
(REQ-070, Appendix J) governs GM and Player narration in the story, not server onboarding
prompts. The `help` tool and `badge_briefing` each point to it. For intent-to-tool
mapping, callers are directed to `suggest_actions` (REQ-084) — no
`use_tool` or `lookup_rule` prompt is provided.

When `TTRPG_NOVEL` is unset at startup and one or more Novels exist on disk, the
`intro` prompt SHALL present them as a browsable library: each Novel's name,
description preview (first sentence or first 120 characters), session count,
last-played date, and enrichment status (Tier 1 activated item count, Tier 2 item count).
The prompt ends with: "You have N Novels. Which would you like to resume, or create
a new one?" When no Novels exist, the prompt directs the user to `create_novel`
with a plain-English description of what a Novel is.
*Acceptance criterion:* `intro` prompt is ≤300 words, opens with the publisher
tagline (or a generic server-name identification when the server is ruleset-free),
includes a dynamic sourcebook listing from the live index (or a message indicating the
server is world-model-only when the server is ruleset-free), and ends
with four concrete next actions.
_Check:_ T49, T50, T259.

**REQ-078 — Session zero prompt.** The server provides a `session_zero` prompt. It takes no
arguments, is visible to all badges (unfiltered), and serves as a structured guide
surfaced at the start of a new story. The builder SHALL generate the prompt text at
build time, drawing on the ruleset model for ruleset terminology,
character-creation rules, example-of-play excerpts, and native personality
constructs, and drawing on Enrich `adventure_advice` content when available
for genre conventions, narrative-voice profiles, and anti-slop examples. The
builder MAY generate narrative prose — tuning option descriptions, example
character introductions, plaintext capability examples — using its own
language capabilities when the ruleset model provides sufficient context. Missing
ruleset content SHALL produce the corresponding section with a plain-English fallback
description — this is not a defect. The prompt SHALL be verbose throughout — every
section SHALL describe narrative possibilities in plain English without tool names or
technical syntax, per Standing Rule 10. The prompt SHALL include eight sections in
order: (1) a welcome explaining session zero's purpose as creative alignment and a
safety check — this is where the GM and player agree on the shape of the story before
anyone rolls, and the preferences recorded here feed into the GM's narration for the
entire story; (2) per-signal explanations — for each of tone, difficulty, pace, focus,
and boundary, a plain-English description of what the signal controls narratively and
three to five named tuning options each with a paragraph describing what that choice
means for the story (scene style, narrative voice, consequences model, encounter
design), plus a plain-English example instruction the player could write; (3) character
introductions — three example character descriptions at increasing detail (a minimal
one-to-two-sentence archetype, a three-paragraph description covering physical
appearance and mannerisms then personality and voice then backstory and motivation, and
a media reference that names a known character as shorthand then elaborates what to
emphasise or change about that archetype), each self-contained as a usable model for
the player's own description; (4) character creation — every mechanical choice category
the ruleset provides (species/ancestry, class/archetype, background, stat generation,
equipment) described in plain English with what each option means for the character's
capabilities narratively, noting that roster characters are already available for
import; (5) adventure confirmation — presenting loaded adventure premise, factions with
their starting tensions, pre-populated NPCs with personality summaries, and the opening
scene with a plain-English confirmation that the GM can accept or describe what to
change, or guiding from-scratch definition when no adventure is loaded; (6) narrative
capabilities — plain-English descriptions of what the GM can do during the story
organized by context (combat, exploration, dialogue, world-building), with plaintext
examples written as natural-language instructions the GM would give; (7) a quick-start
guide summarising what is ready and describing how the first scene begins — the GM sets
the opening scene, the player describes what their character does; (8) post-session
encouragement to refine characters between stories — personality, voice, dialogue
examples referencing favorite media, and mechanical advancement when the ruleset
provides it. The prompt SHALL use the ruleset's own terminology for mechanical
concepts. `session_zero` is listed in `prompts/list` after `intro`. The `intro`
prompt includes a concrete action to run `session_zero` before play.
*Acceptance criterion:* `session_zero` prompt contains all eight sections in
order; per-signal explanations include three to five named tuning options with
narrative paragraphs; character introductions include three example descriptions at
increasing detail; narrative capabilities section uses plain English and plaintext
examples with no tool names.
_Check:_ T22, T124.

**REQ-057 — Canonical lookup tools.** For each category the ruleset defines as canonical
content (equipment, spells, monsters/stat-blocks, conditions, feats, class features,
species, backgrounds), a `lookup_<category>` tool accepts the canonical name and documented
aliases and returns the full ruleset entry. Unknown names return `[ERROR] [NOT_FOUND]` with
valid values enumerated; no fabricated entry is returned. For additional ruleset-unique
canonical content — talent trees, abilities, features, or other named resources —
`lookup_<feature>` tools follow the same pattern.
*Acceptance criterion:* `lookup_spell("fireball")` returns every field the
ruleset defines; `lookup_spell("nonexistent")` returns `[NOT_FOUND]` with
session-visible valid spell names and a "Did you mean?" hint when applicable.
_Check:_ T39, T40.

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

**REQ-059 — Parameter canon validation.** Tool parameters that accept bounded-domain values
(parameters whose legal values are a finite set derived from the ruleset's own catalogue —
skill names, spell names, equipment names, condition names, and analogous ruleset-defined
categories) SHALL validate against the ruleset index at call time. An unknown value returns
`[ERROR] [NOT_FOUND]` with session-visible valid values enumerated (per REQ-002). A valid
value returns `[OK]`. For dice-resolution tools, the `[OK]` response includes transparent
dice results (per REQ-003).
When a bounded-domain value set includes entries extracted at LOW confidence (per REQ-011),
the catalogue remains available for validation — a caller who passes a LOW-confidence value
receives `[OK]` — but `spec_health` SHALL report a `[LOW_CONFIDENCE_CATALOGUE]` finding
naming the parameter and the affected entries. The builder SHALL record the finding in
DECISIONS.md (5).
*Acceptance criterion:* Passing an unknown skill name to a bounded-domain skill-check tool
returns `[ERROR] [NOT_FOUND]` with valid skill names enumerated; passing a known skill name
returns `[OK]` with results from the ruleset's resolution model.
_Check:_ T39, T39a.

**REQ-182 — Bounded-domain parameter documentation.** The builder SHALL document in
DECISIONS.md (5) every tool parameter whose legal values are a bounded domain: for each
such parameter, record the tool name, the parameter name, the ruleset source section from
which the valid-value set is derived, and the extraction confidence of that source (per
REQ-011). A parameter whose valid-value set is split across multiple ruleset sections
SHALL list every contributing section. This mapping enables independent verification of
parameter canon validation (REQ-059) without parsing the builder's internal model.
*Acceptance criterion:* DECISIONS.md (5) lists every bounded-domain tool parameter
with its source section; a verifier can use this mapping to test REQ-059 compliance
for every listed parameter.
_Check:_ T39, T39a.

**REQ-183 — Live-index-derived error enumerations.** `[NOT_FOUND]` and `[INVALID_INPUT]`
error enumerations for bounded-domain parameters SHALL derive from the ruleset index at
call time, not from hardcoded literals. The enumeration is filtered by badge (per REQ-002c).
This requirement enforces the §6.5 builder rule: hardcoded arrays are permitted only
for ability abbreviations and persona roles. Tool implementations that enumerate valid values
from a static list rather than the live index SHALL be flagged in DECISIONS.md (5) as a
convergence violation.
*Acceptance criterion:* Adding a new skill entry to the ruleset source, rebuilding, and
calling a skill-check tool with the new skill name returns `[OK]`; removing a skill entry
and rebuilding produces `[NOT_FOUND]` for the removed skill. Both enumerations reflect
the live state — no hardcoded skill list produces stale values.
_Check:_ T39b.

**REQ-323 — resolve_intent tool.** THE server SHALL register a `resolve_intent`
tool that takes a natural-language spatial intent string and resolves it against
the world model. The tool is pure-resolution — it returns data without mutating
state. Resolution order SHALL be: (a) world-model constraint check — is the
target direction or object reachable, visible, and physically possible? (b)
constraint override check — does the active entity have a mechanic that bypasses
a blocking constraint (per REQ-324, REQ-325)? (c) scene composition — prose
description derived from room data if movement or inspection occurred.

The return value SHALL include: `status` (one of `resolved`, `blocked`,
`ambiguous`, `no_world_model`), `constraint_results` (array of constraint name
and result), `override_hints` (available constraint bypasses for the active
entity, or empty), `scene_description` (prose from room data or null), and
`room_context` (current room name, exits, visible things, present NPCs, or
null when world model is unpopulated). The return MAY also include
`suggested_mechanics` (list of follow-up mechanical tool suggestions relevant
to the intent — stealth for sneaking, perception for searching — not executed).

The tool is callable by the AI narrator (any badge), the Game Master badge,
and the Observer badge (read-only per REQ-305).
Player badge calls SHALL return `[ERROR] [FORBIDDEN]` — the AI narrator calls
`resolve_intent` on the player's behalf. The tool SHALL be registered in
`tools/list` and SHALL support `help("<tool_name>")`. `suggest_actions` SHALL
return `resolve_intent` for spatial intents under both badges; under the Game
Master badge, `suggest_actions` MAY also return parser `command` for
direct world-model inspection.

When the world model is unpopulated, `resolve_intent` SHALL return `status:
"no_world_model"` with a message directing the caller to populate the world
model. `resolve_intent` is complementary to `suggest_actions` (which suggests
tools) and `command` (direct parser invocation) — it does not replace either.
*Acceptance criterion:* `resolve_intent("go north")` against a populated world
model with a north exit returns status `resolved` with room context for the
destination room. `resolve_intent("go north")` against a wall returns `blocked`
with the constraint named. Player badge returns `[FORBIDDEN]`; Observer
badge returns `[OK]` with resolved room context.
_Check:_ T-new-323.

*Out of scope:* real-time collaboration tools, streaming resource endpoints,
tools that modify the ruleset source, and MCP protocol features beyond the standard
tool/resource/prompt surface.

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

**REQ-042 — Workflow decisions.** Multi-step procedures (character creation, advancement)
that raise `[NEED_INPUT]` are completed by `respond(decision, option)`. The `decision`
value matches the question text from the preceding `[NEED_INPUT]`
after canonicalization: leading/trailing whitespace stripped, internal whitespace
collapsed to single spaces. The server SHALL accept a `decision` value that differs
from the emitted text only in whitespace — an exact-match requirement is brittle
under LLM-mediated tool calls. A `decision` that differs in non-whitespace
characters returns `[ERROR] [NOT_FOUND]` with the canonical text. Each
decision enumerates options — limited to at most 25 entries, derived from the ruleset
index, with empty-string and "cancel" always available. An unrecognized decision or
option returns `[ERROR] [NOT_FOUND]` with valid values.
`respond(cancel)` SHALL restore the pre-workflow snapshot from the persisted
`pending_workflow.snapshot` field. Restoration SHALL overwrite all
Novel-tier fields with the snapshot values, clear `pending_workflow` to
null, and reset `pending_staleness_counter` to zero. The restored state
SHALL be audited with a `[workflow_cancelled]` audit entry recording the
decision text and the pre-workflow snapshot timestamp. After restoration,
all blocked tools (undo, redo, set_badge) are callable. Cancel restoration
works after a server restart — the persisted snapshot covers the full
pre-workflow Novel state.

A workflow begins when a tool returns `[NEED_INPUT]` and ends when `respond`
successfully drains the decision. Only one workflow may be pending per Novel at a time
— a tool that raises `[NEED_INPUT]` while a workflow is already pending returns
`[ERROR] [STATE_CONFLICT]` identifying the pending decision. The server must be able to
determine whether a workflow is pending, such that tools blocked during pending
workflows (undo, redo, set_badge) can query the pending state without ambiguity. Pending
workflow state survives server restarts — after restart the `[NEED_INPUT]` remains open
and the server returns the same decision prompt on the next query. The Novel's pre-
workflow snapshot is persisted alongside the pending decision so that `respond(cancel)`
restores the correct pre-workflow state even after a restart. Pending workflow
state is Novel-tier: it persists with the Novel to disk and survives process
restarts alongside all other Novel property groups. After a restart,
`respond(cancel)` must restore the correct pre-workflow snapshot, and `respond`
with a valid option must drain the same decision that was open before the
restart. Session-tier fields (active entity, connection-scoped transient state)
are re-initialized from the Novel's persisted values on resume.
*Acceptance criterion:* `respond("cancel")` restores pre-workflow state; a
second `create_character()` during a pending step-by-step workflow returns
`[STATE_CONFLICT]`; the pending decision survives server restart.
_Check:_ T32, T138, T157;
G2; S22.

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

**REQ-193 — Pending workflow staleness detection.** THE server SHALL track
a staleness counter for open pending workflows, incremented on each new
connection to the Novel. When the counter reaches 3 or more connections
without drainage, `spec_health` SHALL include a `pending_workflow_warning`
object containing the decision text and connection count. The warning signals
that a workflow has been abandoned across multiple sessions — an operator
can drain or cancel it. Staleness tracking is informational only; it does
not auto-cancel or auto-drain. See also REQ-224.
*Acceptance criterion:* Start a character creation workflow, restart the
server (connection 1), connect twice more (connections 2, 3) — on the third
connection, `spec_health` includes `pending_workflow_warning`.
_Check:_ spec_health output assertion.

**REQ-104 — Character creation workflow.** `create_character` supports two modes:
step-by-step (called without parameters) and quick-create (called with all required
creation parameters). Step-by-step produces sequential `[NEED_INPUT]` decisions covering
every mandatory creation step the ruleset defines; quick-create creates the character in a
single call. Both modes produce a complete entity with every ruleset-defined derived statistic
and no ruleset-defined starting field zeroed out. In step-by-step mode, when the
ruleset defines ability scores as a mandatory step, the builder SHALL present each
ability score for player assignment — the player chooses which rolled or array value
maps to which ability. The builder SHALL NOT auto-assign ability scores without a
`[NEED_INPUT]` decision presenting the assignment as a choice. In quick-create mode, the
builder MAY auto-assign using a documented heuristic recorded in RULESET_MODEL.md.
When `stat_method` is `roll_4d6`, `create_character` accepts an optional `seed`
parameter. The seed applies an isolated draw (REQ-050) — stat generation does
not advance the session PRNG position.
Creation without an active Novel
returns `[STATE_CONFLICT]`. `cancel` restores the pre-workflow snapshot.
*Acceptance criterion:* `create_character()` without parameters starts step-by-step
mode; `create_character(name="X", race="Y", ...)` creates in one call; both modes
require an active Novel or return `[STATE_CONFLICT]`.
_Check:_ T32; T47; T103; G2.

**REQ-181 — Character creation output surface.** `create_character` SHALL
return, in its final `[OK]` or `[NEED_INPUT]` completion response, every
ruleset-defined derived statistic: the entity's name, race, class, level,
ability scores with computed modifiers, hit points (current and maximum),
armor class, speed, and all proficiencies (saves, skills, armor, weapons,
tools). When the ruleset defines additional derived fields (initiative,
passive scores, spellcasting ability, known languages), those SHALL also
appear. The output SHALL distinguish inputs (player-provided values) from
derived statistics (computed from inputs and ruleset tables).
*Acceptance criterion:* A `create_character` quick-mode call returning `[OK]`
includes ability scores with per-score modifiers, HP, AC, speed, and the
full proficiency list — not just a confirmation message. A step-by-step
creation's final `[NEED_INPUT]` response includes all derived statistics
computed so far.
_Check:_ T47.

**REQ-151 — Creation step enumeration.** The builder SHALL enumerate every
mandatory creation step the ruleset defines in RULESET_MODEL.md under
`character_creation.steps`, in the order the ruleset prescribes. In step-by-step
mode, each step that requires a player choice SHALL produce one `[NEED_INPUT]`
decision — no step produces more than one decision, and no decision covers more
than one step. Steps the server resolves without player input (derived statistics,
HP calculation, proficiency assignment) SHALL NOT produce `[NEED_INPUT]` decisions
but SHALL be reported in the creation result alongside player-chosen values.
*Acceptance criterion:* RULESET_MODEL.md enumerates every mandatory step;
`create_character()` without params produces exactly one `[NEED_INPUT]` per choice
step, never bundling steps.
_Check:_ T32.

**REQ-152 — Starting equipment assignment.** When the ruleset defines starting
equipment per class, background, or similar creation choice, the builder SHALL
assign that equipment to the created entity. The entity's state representation
SHALL include an `equipment` field listing each assigned item by name, quantity,
and ruleset source. If the ruleset presents equipment choices (e.g., "choose
weapon A or weapon B"), the builder SHALL present each choice as a `[NEED_INPUT]`
decision in step-by-step mode. In quick mode, the builder SHALL select the first
listed option and record the selection in the creation result. When the ruleset
defines no starting equipment, the `equipment` field SHALL be absent — the builder
SHALL NOT fabricate equipment.
*Acceptance criterion:* A character created under D&D 5e SRD carries class and
background starting equipment by name.
_Check:_ T32, G2.

*Out of scope:* branching narrative trees, puzzle-solving workflows, and decision
workflows that span multiple Novels or connections.

**REQ-140 — End-Novel confirmation dispatch.** WHEN the `respond` handler
receives a decision matching the open `end_novel` confirmation prompt,
THE system SHALL execute the Novel disposal sequence defined in REQ-088:
deactivate the active badge, clear undo and redo stacks, move the Novel's
save file and backup to `.trash/`, remove the Novel from the active set,
and record the disposal in the audit log. The `respond` tool's routing
logic SHALL be auditable — a mismatch between the open decision and the
routed action is a build defect. IF `respond` receives a decision not
matching any open workflow, THEN it SHALL return `[NOT_FOUND]` with
the open decision's text.
*Acceptance criterion:* `end_novel()` → `respond("End Novel <slug>?", "yes")`
removes the Novel from disk and the active set; a subsequent `resume_novel`
returns `[STATE_CONFLICT]`.
_Check:_ T158.

**REQ-224 — Workflow staleness detection.** THE server SHALL track a
per-workflow staleness counter — an integer incremented each time a new MCP
connection is established while the workflow is pending. When the staleness
counter reaches a configurable threshold, the pending
workflow SHALL auto-cancel with the same behavior as `respond("cancel")`: the
pre-workflow snapshot is restored, a `[workflow_stale]` audit entry is recorded
with the decision text and connection count, and `undo` becomes callable. The
audited entry SHALL be tagged `[workflow_stale]` to distinguish it from explicit
cancellation. The staleness counter SHALL be recorded in `spec_health` under
`pending_workflow` alongside the decision text and elapsed connections. A
workflow canceled by staleness follows the same state-restoration contract as
explicit cancellation (REQ-042). The threshold is configurable via
`TTRPG_WORKFLOW_STALENESS_CONNECTIONS`; setting it to zero SHALL disable
staleness detection. See also REQ-193.
*Acceptance criterion:* A pending workflow survives 4 connection restarts and
remains open; on the 5th restart it auto-cancels with `[workflow_stale]` audit
entry and restored pre-workflow state. Setting
`TTRPG_WORKFLOW_STALENESS_CONNECTIONS=0` prevents all auto-cancellation.
_Check:_ T266.

**REQ-235 — Structured player choices.** The Game Master may present structured
choice prompts to the player. `present_choices(prompt, choices[], allow_freeform?,
context?)` returns a `[NEED_INPUT]` decision workflow (REQ-042). Each choice in
the `choices` array SHALL have `id` (kebab-cased identifier), `label` (display
text), and `description` (detail text). `allow_freeform` (configurable) permits
the player to provide a free-text response instead of selecting a listed option.
`context` is an optional metadata object (e.g., `{urgency: "medium"}`). The player
responds via `respond(decision, option)`. The outcome SHALL be appended to the
audit log with a `[choice]` tag; freeform responses SHALL be stored in the audit
entry's `content` field.
*Coupling:* When a `present_choices` result is recorded, any countdown (REQ-073)
bearing the same `id` in its `scope` field SHALL advance by one tick. Choices whose
resolved `id` matches a faction goal keyword (REQ-233) SHALL advance that faction's
clock. The choice outcome SHALL also advance any `linked` countdown triggered by
the matching clock.
*Acceptance criterion:* `present_choices("The goon blocks your path.", [{id:
"talk", label: "Talk", description: "Persuade him"}, {id: "fight", label:
"Fight", description: "Start combat"}])` returns `[NEED_INPUT]` with two
options; `respond("The goon blocks your path.", "fight")` records a `[choice]`
audit entry; a countdown with `scope: "fight"` advances.
_Check:_ T273.

### 5.5 Badges and Access

**REQ-030 — Single-user connection.** Each MCP connection serves one active badge at a
time — the hat most recently set via `set_badge` or `TTRPG_BADGE`. No concurrency,
no multiplayer state sharing within a connection. The active badge and active entity
are Novel-scoped: two connections to the same Novel share the same badge and entity
state (REQ-031, REQ-074). Each connection may independently switch between Novels
via `switch_novel` (REQ-095), and each Novel stores its own badge independently.
*Acceptance criterion:* Starting a second MCP connection to the same Novel succeeds
and inherits the Novel's current badge and active entity; switching badges.on one
connection is visible on the other.
_Check:_ Appendix D.

**REQ-031 — Badge activation.** By default, no badge is active — the server operates
with full access, equivalent to Game Master privileges. All tools, resources, and prompts
are accessible without restriction. Badge gating (REQ-032) takes effect only when a
hat is explicitly activated via `set_badge` (REQ-066). Wearing a hat means you are
in the story. The hat may be deactivated with `set_badge("none")` — the Novel
persists in editing mode with full access. When no badge is active,
all badge-filtered surfaces (`badge_briefing`, `prompts/list`, `resources/list`,
`tools/list`, guidance) return full unfiltered content. The badge activation state
persists with the Novel (REQ-055). `end_novel` deletes the Novel regardless of
badge state.
*Acceptance criterion:* On startup with no badge active, `tools/list` returns all
tools unfiltered; after `set_badge("player")`, GM-only tools are excluded from
`tools/list` and return `[FORBIDDEN]` on invocation; after `set_badge("none")`,
full access is restored and the Novel persists.
_Check:_ T9, T150.

**REQ-066 — set_badge tool.** The server provides a `set_badge` tool accepting
`player`, `game_master`, `observer`, or `none`. Returns `[OK] Active badge: <badge>` on
success — `"none"` returns `[OK] Active badge: none — Novel editing mode`,
`"observer"` returns `[OK] Active badge: observer — read-only spectator mode`. Returns
`[STATE_CONFLICT]` if a pending workflow exists. The tool is NEVER
badge-gated — it is always callable regardless of current badge. The badge switch
takes effect immediately on the next tool call. `set_badge("none")` deactivates
the badge and returns to editing mode with full access; the Novel persists
untouched.
*Acceptance criterion:* `set_badge("player")` returns `[OK] Active badge: player`
and the next tool call is gated; `set_badge("observer")` returns
`[OK] Active badge: observer — read-only spectator mode`; `set_badge("none")` returns
`[OK] Active badge: none — Novel editing mode` and full access is restored;
`set_badge(...)` during a pending workflow returns `[STATE_CONFLICT]`.
_Check:_ T9.

**REQ-032 — Server-side gating.** When a badge is active, the server enforces hat
access on every endpoint. Player tools, resources, and prompts are a strict subset of
GM-visible ones. Observer tools are a read-only subset: state-query tools
(`character_sheet`, `session_recap`, `help`, `scene://current`, `entities://`,
etc.) are permitted; mutating tools (commands, generation, hybrid per REQ-015)
return `[FORBIDDEN]` with the corrective action "Observer mode is read-only.
Switch badges.with `set_badge` to interact." `tools/list` and related metadata surfaces
are filtered. Guidance items are filtered. `spec_health` metrics are filtered.
`[FORBIDDEN]` responses direct callers to use `set_badge` to switch badges. When no
badge is active, no gating applies — all endpoints return full content and all tools
are callable.
*Acceptance criterion:* Under the Player badge, `create_npc(...)` returns
`[FORBIDDEN]`; switching to Game Master badge makes the same call succeed;
switching back and calling again returns `[FORBIDDEN]`. Under the Observer badge,
`set_scene_state(...)` returns `[FORBIDDEN]` directing to `set_badge`; `help()`
succeeds.
_Check:_ T9, T13, T15, T18,
T26, T44, T148, T151.

**REQ-216 — Generation table badge filtering.** `roll_on_table` SHALL be callable
from both badges, but tables with `badge_scope: "game_master"` SHALL return
`[FORBIDDEN]` when called from the Player badge — the error SHALL enumerate the
full table name but SHALL NOT reveal table content. The `badge_scope` value SHALL
be visible in `spec_health` per-table metadata but the table content SHALL NOT.
The `badge_briefing` SHALL enumerate available table names with their badge_scope,
filtered per the active badge's access level. The error message SHALL direct the
caller to `badge_briefing` for a non-revealing list of accessible tables.

*Acceptance criterion:* `roll_on_table("madness_short_term")` called from the
Player badge returns `[FORBIDDEN]` with the table name visible but no content; the
same call from the Game Master badge returns the table result. `badge_briefing` under
the Player badge lists only `badge_scope: "shared"` table names.

_Check:_ T257.

**REQ-133 — Forbidden-call audit.** Every tool invocation that returns
`[FORBIDDEN]` is recorded in the audit log with timestamp, active badge, tool
name, and arguments — matching the fields recorded for mutating calls
(REQ-040). Forbidden-call entries carry a `violation_type: "boundary"` field on the audit entry
that is absent from mutating-call entries. When surfaced through `compress_audit` or
`audit://novel`, the entry's output prefix is prepended with `[BOUNDARY_VIOLATION]`
to distinguish it from mutating entries at a glance.
*Acceptance criterion:* Invoking a GM-only tool under the Player badge produces
an audit entry with badge `player`, tool name, arguments, and a
boundary-violation marker; the entry is visible at `audit://novel` and is
distinguishable from mutating entries.
_Check:_ T147.

**REQ-134 — Minimum Player tool surface.** When the Player badge is active,
the server guarantees that tools in these functional groups are callable:
dice-resolution (rolls and checks), ruleset lookups, character sheet
rendering, action suggestions, player signals, help, undo/redo of the Player
hat's own mutations, and badge switching. The builder records the gate
classification for every tool in DECISIONS.md in a format that can be
diffed against each badge's filtered `tools/list` output.
*Acceptance criterion:* Under the Player badge, each Player-guaranteed group
defined in the body has at least one tool callable by the Player; a tool
known to be GM-exclusive returns `[FORBIDDEN]`.
_Check:_ T148.

**REQ-220 — Narrative point of view.** When `set_active_entity(entity_id)` is called,
the active entity carries narrative POV (point of view) semantics: the player is
inhabiting this character — speaking as them, perceiving through their senses. The
server SHALL include a POV directive in `badge_briefing`, positioned in the
decision-critical group after scene state and before the entity listing. The
directive contains: (a) the active entity's name; (b) an instruction to the AI:
describe the scene through this character's eyes and senses — other
characters' internal states (thoughts, feelings, unexpressed intentions) are
inaccessible unless the POV character could observe or infer them; (c) the active
entity's personality fields and voice examples (REQ-077) in compact inline form as
voice and manner reference. When no active entity is set — `active_entity_id` is null
per REQ-176 — the directive is replaced with an empty-state marker: "POV: none —
narration is omniscient." The directive is NEVER truncated by the briefing size budget
(REQ-135, tier 1). POV follows the active entity across `set_active_entity` calls —
there is no separate tool.
*Acceptance criterion:* After `set_active_entity("character_01")`, `badge_briefing`
includes a POV directive naming character_01 with the narrative instruction and
personality fields. Switching to character_02 updates the directive; removing all
entities shows the omniscient empty-state marker.
_Check:_ T262.

**REQ-223 — POV mode control.** THE `set_active_entity` tool SHALL accept an
optional `pov` parameter — `character` (default) or `omniscient`. When
`pov=character` is set with an active entity, the POV directive follows
REQ-220: the narration locks to that character's perspective. When
`pov=omniscient` is set, the POV directive SHALL render as the omniscient
empty-state marker defined in REQ-220 regardless of whether an active entity
exists — narration is unrestricted, all characters' states are accessible. The
`pov` parameter is stored as Novel-scoped state and persists across
`set_active_entity` calls: switching entities with `pov=character` keeps the new
entity under character-locked POV; switching entities with `pov=omniscient`
keeps narration omniscient. When `set_active_entity` is called without the `pov`
parameter, the existing POV mode is preserved. The initial default is `character`
— the first `set_active_entity` call in a Novel locks POV to that entity unless
`pov=omniscient` is explicit.
*Acceptance criterion:* After `set_active_entity("char_01", pov="omniscient")`,
`badge_briefing` shows "POV: none — narration is omniscient" with char_01 still
the active entity; `set_active_entity("char_02")` preserves omniscient mode;
`set_active_entity("char_02", pov="character")` switches to character-locked
POV for char_02.
_Check:_ T265.

**REQ-304 — Counterpart AI role.** The AI's narrative role is the counterpart of the
active badge by default: when the human wears `player`, the AI briefs as Game Master;
when the human wears `game_master`, the AI briefs as Player; when no badge is active,
the AI has no narrative role (null-badge briefing per REQ-136). The server accepts a
`TTRPG_AI_ROLE` environment variable with values `counterpart` (default),
`game_master`, or `player`. When set to a fixed value, the AI's narrative role is
locked — `game_master` forces GM-oriented briefing regardless of the human's badge,
`player` forces player-oriented briefing. The AI role determines the orientation
sections in `badge_briefing` (foundations, anti-slop, tone samples, behavioral boundary
directive per REQ-109) while the active badge determines the state surface and tool
filtering. `TTRPG_AI_ROLE` is read at startup and applies to all connections and
Novels. The active badge controls tool-access gating; the AI role controls narrative
orientation. The default `counterpart` preserves current behavior when the human
wears the Player badge (AI briefs as GM) and enables human-GM + AI-Player
configuration when the human wears the Game Master badge.
*Acceptance criterion:* With `TTRPG_AI_ROLE=counterpart` and human wearing the
Player badge, `badge_briefing` orientation content is GM-oriented. Same hat but
`TTRPG_AI_ROLE=player` forces player-oriented orientation. Human wearing the GM badge
with `counterpart` shows player-oriented orientation. Null-badge with any
`TTRPG_AI_ROLE` shows null-badge briefing per REQ-136.
_Check:_ T-new-304.

**REQ-305 — Observer mode.** `set_badge("observer")` activates spectator mode — the
human observes while the AI plays both Player and Game Master roles. Tool gating
(REQ-032) restricts the human to read-only access: state-query tools succeed;
all mutating tools return `[FORBIDDEN]` directing the caller to switch badges.
`badge_briefing` orientation content instructs the AI: "You are both Game Master
and Player. The human is observing. Narrate scenes, make decisions for all player
characters, advance combat, play the Novel." The state surface is unfiltered
(GM-level visibility). The human may step out by calling `set_badge` with any other
value. Observer mode is Novel-scoped — it persists with the Novel and is visible
in `spec_health`.
*Acceptance criterion:* `set_badge("observer")` returns `[OK] Active badge: observer
— read-only spectator mode`. `create_npc("Test")` returns `[FORBIDDEN]` with
corrective action citing `set_badge`. `help()` succeeds. `badge_briefing` includes
the dual-role orientation instruction.
_Check:_ T-new-305.

**REQ-306 — Adjustable autonomy.** The server provides a `set_autonomy(options)`
tool — Game Master only, Novel-scoped. The tool accepts an object with four
independent sliders, each with a default middle value:

| Slider | Values | Default | Controls |
|--------|--------|---------|----------|
| `level` | `full` / `mechanical_prompt` / `manual` | `mechanical_prompt` | Who decides wbadge. `full` — AI auto-plays everything. `mechanical_prompt` — AI auto-plays narrative decisions (dialogue, exploration direction, social approach), world-model navigation, and character flavor, but SHALL pause for TTRPG ruleset mechanical decisions: dice rolls, combat actions, spell selection, condition management, character advancement, and ruleset-derived generation tables. `manual` — human decides everything (current default, formalized). |
| `confirmation` | `auto` / `confirm` / `prompt` | `prompt` | How decisions are presented. `auto` — AI executes without asking. `confirm` — AI proposes its chosen action as the default option in `present_choices`, human confirms or vetoes. `prompt` — AI presents options via `present_choices` without a default, human chooses. |
| `safety` | `safe` / `moderate` / `hardcore` | `moderate` | Consequence severity. `safe` — no permanent character death; lethal damage reduces HP to 1 and applies incapacitation. `moderate` — death possible but telegraphed; dramatic but survivable challenges. `hardcore` — full consequences; death permanent; no warnings. |
| `creativity` | `predictable` / `standard` / `chaotic` | `standard` | How much the AI surprises the player. `predictable` — optimal, rational decisions. `standard` — occasional complications and character flaws. `chaotic` — dramatic twists, suboptimal emotional choices, unwinnable encounters. |

The `mechanical_prompt` boundary applies only to tools that invoke ruleset-derived
resolution mechanics — tools classified as command or hybrid per REQ-015 whose
behavior is derived from the ruleset, not from the world model or narrative
infrastructure. Inform parser commands (`go north`, `take lamp`) and narrative
state tools (`set_scene_state`, `create_npc`) are never paused. At
`mechanical_prompt` level, when a mechanical decision point is reached, the AI
SHALL call `present_choices` (REQ-235) with `[NEED_INPUT]` to present the
decision; the human responds via `respond`. All four slider values SHALL be
visible in `badge_briefing` and `spec_health`. Autonomy composes with any badge
— a human Player with `level=full` lets the AI auto-play their character; a
human GM with `level=full` lets the AI run all NPCs and player characters.

Player signal preferences (REQ-069) — pace, difficulty, tone, focus, and
boundary — SHALL be respected at all autonomy levels. Autonomy controls
who makes decisions; player signals define constraints on all decisions
regardless of which agent makes them. A `level=full` AI SHALL still
observe a `boundary=veil` signal by skipping detailed violence
descriptions, and SHALL still respect `difficulty=easy` by calibrating
encounter threat. The `register` signal (REQ-064) SHALL also be
respected at all autonomy levels — the AI SHALL NOT switch between
character and meta register without an explicit `player_signal` call.
*Acceptance criterion:* `set_autonomy({level: "full", confirmation: "auto",
safety: "safe", creativity: "standard"})` returns `[OK]`. `badge_briefing`
includes the autonomy state. With `level=mechanical_prompt` and
`confirmation=prompt`, the AI auto-narrates exploration but pauses via
`present_choices` for combat actions; the human responds via `respond`.
_Check:_ T-new-306.

**REQ-109 — Badge briefing composition.** `badge_briefing` surfaces
these groups, split into two sourcing layers:

**Orientation layer** (sourced from the AI's narrative role per REQ-304):
badge foundations (REQ-062), anti-slop guidance (REQ-070), narrative tone samples
(REQ-071), and badge behavioral boundary directive (REQ-064). When the AI's role is
Game Master, these groups contain GM-oriented content; when the AI's role is Player,
player-oriented content. Under observer mode (REQ-305), the orientation layer SHALL
include a dual-role instruction: "You are both Game Master and Player. The human is
observing. Narrate scenes, make decisions for all player characters, advance combat.
Play the Novel."

**State surface layer** (sourced from the active badge per REQ-032):
current scene state (REQ-076), narrative POV directive (REQ-220), active entities
with summary stats and presence markers (REQ-074, REQ-307), active NPCs (REQ-075),
active countdowns — badge-filtered by `badge_scope` (REQ-073), active lore entries
(REQ-083), active adventure content (REQ-079), registered tools relevant to the
current scene type (REQ-087), active combat state — round, turn order, and current
participant (if in-combat; REQ-043), active entity personality fields and voice
examples — badge-filtered per REQ-077 (REQ-077), the narrative directive (GM only,
REQ-081), player signals (GM only, REQ-069), Novel setup metadata (REQ-089,
including a "Session zero not yet completed" reminder when `session_zero_completed`
is false), a pointer to the intro prompt (REQ-063), story journal entries — entries
whose entity IDs overlap the active entities or whose scene anchor matches the current
scene (GM only, REQ-246), the current autonomy state — all four slider values
from `set_autonomy` (REQ-306) when set, campaign memory facts (GM only, REQ-310),
world in motion entries (GM only, REQ-233a), and proactive available actions
(REQ-084a).

Groups whose data source is empty SHALL include an explicit empty-state marker
describing which category is empty. Markers preserve the expected briefing structure
and prevent the caller from inferring non-existent content. The enumeration order
above is the builder's required default section ordering for `badge_briefing`.
Decision-critical groups (scene state, the POV directive, entities, combat state,
triggered lore, active NPCs, active countdowns, narrative threads, campaign memory
(REQ-310), world in motion (REQ-233a), and available actions (REQ-084a)) precede
the section boundary; supplementary guidance and navigation groups (badge foundations,
anti-slop guidance, narrative tone samples, active adventure content, registered
tools, entity personality fields, the narrative directive, player signals, Novel
setup metadata, autonomy state, and the intro pointer) follow. The Game Master may
override this order via `set_briefing_order` (REQ-082).
*Acceptance criterion:* `badge_briefing` for a Novel with entities, combat,
countdowns, and lore includes all mandatory groups; an empty data source displays
its empty-state marker; decision-critical groups appear before supplementary groups.
_Check:_ T109, T110, T149.

#### Briefing Section Tokens

**REQ-281 — Narrative-threads section token.** `badge_briefing` SHALL include a
`narrative_threads` section token in the decision-critical group containing: (a)
unresolved story journal decisions — `decision` type entries whose referenced entity or
scene has no corresponding `consequence` entry (REQ-246), surfaced as "Unresolved: <entry
summary>"; (b) active promises derived from story journal `bond` entries with no
`consequence`; (c) active countdowns with their narrative meaning — name + remaining ticks
in prose form; (d) active NPC dispositions where the disposition differs from the NPC's
creation default, surfaced as "<NPC name> (<disposition>, set in session <N>)"; (e)
active vow progress when populated (REQ-289). The section is badge-filtered: GM sees all;
Player sees only own-entity bonds and `shared`-scope content.

The `narrative_threads` token SHALL appear in the decision-critical group, after entities
and before combat state. This token gives the AI GM a "what's currently unresolved"
signal for narrative consistency. When all source data is empty, the token SHALL render
its empty-state marker: "[No unresolved threads.]"

*Acceptance criterion:* After recording a story journal `decision` with no `consequence`,
setting a countdown, and creating an NPC with a non-default disposition, `badge_briefing`
under the GM badge includes a `narrative_threads` section with the unresolved decision, the
countdown in narrative form, and the NPC disposition. Under the Player badge, only
own-entity bonds and shared content appear.
_Check:_ T-new-281.

**REQ-286 — Knowledge-state section token.** `badge_briefing` SHALL include a `knowledge_state` section token in the decision-critical
group showing what the active entity currently knows: (a) revealed secrets (key and
reveal timestamp); (b) known NPC relationships where the active entity is a participant;
(c) `shared`-scope lore entries whose trigger keywords have appeared in scenes the active
entity was present for. Knowledge SHALL be scoped by entity presence per REQ-308: an
entity only learns percepts from scenes where it was present (listed in
`characters_present` per REQ-076). Percepts gained from scenes the entity attended are
retained regardless of current presence. When the active entity is not present in the
current scene, the section renders "[Entity not present in this scene]" above the
entity's retained knowledge. When no active entity is set, the section renders "[No
active entity — knowledge state unavailable.]" When the active entity knows nothing, it
renders "[No known information.]" The section SHALL NOT include GM-only secrets,
unrevealed lore, or relationships where the active entity is not a participant. On a
fresh Novel, `badge_briefing` renders the empty-state marker — narrative tools fade into
the background per §5.10.
*Acceptance criterion:* After `reveal_secret("floor_trap", "rogue_01")`, setting
the rogue as active entity, `badge_briefing` under the GM badge includes a `knowledge_state`
section token listing the revealed secret. After setting an entity not present in the
current scene as active, the section renders "[Entity not present in this scene]" above
retained knowledge.
_Check:_ T-new-287.

**REQ-159 — Enrichment briefing integration.** When enrichment is active
(§11.1), `badge_briefing` SHALL include enrichment-derived content as
follows: (a) supplementary guidance items SHALL appear in the guidance
section, tagged `[supplementary]` with source URL and confidence, badge-filtered
by badge_scope (REQ-080); (b) entity voice examples sourced from enrichment
SHALL appear alongside roster-sourced voice examples under the entity
personality group, tagged `[supplementary]` (REQ-077); (c) adventure
advice SHALL appear when the active Novel contains a generated adventure
(REQ-132), tagged `[supplementary]`. Enrichment-sourced content follows
the same badge filtering rules as the enrichment resource surfaces —
game_master-scoped items are hidden from the Player badge. When enrichment
is not active, the briefing renders without enrichment content — no
empty-section markers for enrichment groups.
*Acceptance criterion:* After enrichment, `badge_briefing` under the GM
badge includes supplementary guidance items tagged `[supplementary]`
alongside source URLs. Enrich-sourced voice examples appear under entity
personality with `[supplementary]` tag. Under the Player badge,
game_master-scoped enrichment items are absent. After
`revert_enrichment`, enrichment content is absent from all badge views.
_Check:_ T194.

*Out of scope:* authentication or authorization mechanisms, multi-connection badge
synchronization, and badge inheritance across Novels. The spec assumes a
single trusted operator — `set_badge` is always callable without
authentication. The badge model supports configurable AI narrative role (REQ-304),
observer mode (REQ-305), and adjustable autonomy (REQ-306) while maintaining
two-badge tool-access gating. The badge model is a convenience and
narrative-integrity feature, not a security boundary (see Appendix P for threat
model).

**REQ-135 — Badge briefing size budget.** The total size of `badge_briefing`
output is bounded by a configurable limit. When the briefing would exceed
this limit, content is truncated from lowest-priority sections first.
Sections are truncated in full — no section is partially rendered. Each
truncated section includes a marker and a resource URI pointer for full
retrieval. Badge foundations (REQ-062) and the intro pointer (REQ-063) are
never truncated. The builder records the truncation priority order and the
default limit in DECISIONS.md. The truncation priority order SHALL respect three
tiers: (1) never-truncated: badge foundations (REQ-062), badge boundary directive
(REQ-064), intro pointer (REQ-063), POV directive (REQ-220);
(2) last-truncated: decision-critical groups per REQ-109;
(3) first-truncated: supplementary guidance and navigation groups per REQ-109.
Within each tier, the builder determines the relative truncation order and
records it in DECISIONS.md.
*Acceptance criterion:* With a small briefing budget, invoke `badge_briefing` —
assert some low-priority sections are truncated with resource URI pointers;
assert badge foundations and the intro pointer are always present regardless
of budget.
_Check:_ T149.

**REQ-180 — Truncation budget unit.** All truncation thresholds in this
specification are defined in bytes of UTF-8 encoded Markdown output. When a
builder's implementation environment measures in tokens, the builder SHALL use
a character-to-token heuristic of 4 characters per token (the `CHARS_PER_TOKEN`
convention) to convert between units and SHALL record the chosen heuristic in
DECISIONS.md. The byte-level threshold is the authoritative limit — the token
estimate is a proximity guard that SHALL NOT be used to truncate earlier than
the byte threshold would require.
*Acceptance criterion:* A 32,000-byte threshold produces truncation at the same
byte offset regardless of whether the builder internally measures in tokens or
bytes; the heuristic is recorded in DECISIONS.md.
_Check:_ T222.

**REQ-136 — Null-badge briefing.** When no badge is active (REQ-031),
`badge_briefing` returns setup-oriented content: a list of available Novels
(REQ-093), the current active Novel name if one exists, and a pointer to
the `intro` prompt (REQ-063). No gated content is accessible — the briefing
presents the same full-access view as all other null-badge surfaces but
structured for initial orientation rather than ongoing play.
*Acceptance criterion:* On startup with no Novel active, `badge_briefing`
returns a setup-oriented message with the intro pointer and Novel-creation
guidance; with a Novel active but no badge set (editing mode), the briefing
includes the active Novel name, setup progress when incomplete, and
guidance to continue Novel setup or start the story when ready.
_Check:_ T150.

**REQ-137 — Gate classification auditability.** Every tool registered on
the server is assigned to one of three gate classifications: callable
only under the Player badge, callable only under the Game Master badge, or
callable under any badge (un-gated). The gate classification for every
tool is enumerable at build verification time from the tool registration
source without invoking the running server. The builder records the
classification for every tool in DECISIONS.md. Tool-category
reassignment (REQ-067) does not alter gate classification.
*Acceptance criterion:* The Player-filtered `tools/list` output contains
exactly the tools classified as Player or un-gated in DECISIONS.md; the
GM-filtered output contains exactly the tools classified as GM or un-gated;
`set_badge` is always present in both lists. No tool is classified as both
Player-only and GM-only.
_Check:_ T151.

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
DECISIONS.md (4) without blocking. The G0 step 1 evidence record in
DECISIONS.md (6) SHALL enumerate each blocking item and its pass/fail status.
*Acceptance criterion:* A ruleset with duplicate headings fails G0 step 1 and
the build does not proceed to discovery; a ruleset missing horizontal-rule
separators passes G0 step 1 with the finding logged.
_Check:_ G0; T183.

**REQ-149 — MCP conformance gate.** _(F3)_ The running server SHALL pass every
check in Appendix D before the build proceeds past intake. A failed check stops
the line. The G0 step 2 evidence record in DECISIONS.md (6) SHALL enumerate
each Appendix D check and its pass/fail status. The server SHALL be verified
against the active fixture as specified in §8 G0 step 2.
*Acceptance criterion:* A server that returns a JSON-RPC error for a canonical
lookup of a known-absent entity fails G0 step 2 and the build does not proceed;
a server that passes all Appendix D checks produces an evidence record
enumerating each check.
_Check:_ G0; T184.

**REQ-150 — Golden transcript coverage completeness.** After the golden
transcript passes G2, the builder SHALL verify that every behavioral contract
the selected fixture exercises (REQ-001, REQ-032, REQ-041, REQ-042, REQ-043,
REQ-050, REQ-072, REQ-073) is exercised by at least one transcript interaction.
Any unexercised contract SHALL be recorded as a coverage gap in the G2 evidence
record with the unexercised REQ cited. Coverage gaps do not block the line;
they are findings recorded in DECISIONS.md (6) for operator disposition.
*Acceptance criterion:* Replay the Appendix B golden transcript — assert every
contract is exercised by at least one interaction. Mask an interaction from the
transcript — assert the unexercised REQ is recorded as a coverage gap without
blocking the build.
_Check:_ G2; T185.

**REQ-211 — Evidence record field contract.** Every evidence record embedded in
DECISIONS.md (6) SHALL include, at minimum: workflow identifier (G0, G2, G3, G4, G5,
or H1–H14), timestamp, environment pins (runtime version, OS, and spec hash at time
of execution), pass/fail status, and a findings section enumerating each sub-check with
its individual result. Per-workflow extension fields: G0 records enumerate Appendix H
and Appendix D checklist items with individual pass/fail; G2 records include the
per-contract coverage enumeration defined in §8; G3 records include registry/resource
diff summary; G4 records include per-test pass/fail counts; G5 (Pattern Buffer) records
include per-sub-workflow verdict and blocking/non-blocking classification. A verifier
following §10 SHALL produce evidence records with the same minimum field set for
Phase 1 step 2, enabling field-by-field comparison in Phase 2 step 8.
*Acceptance criterion:* A DECISIONS.md (6) evidence record for any workflow can be
parsed to extract workflow identifier, timestamp, environment pins, pass/fail status,
and sub-check enumeration without depending on prose interpretation.
_Check:_ T253, T188.

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

**REQ-040 — Audit log.** Every tool call that mutates Novel state (character creation,
condition changes, HP changes, combat state, table rolls with results) is recorded in an
append-only audit log (`audit://novel`), including timestamp, badge, tool name,
arguments, and output prefix. State queries are not logged. Each audit entry chains the hash of the preceding entry,
producing a tamper-evident sequence. On load, the server verifies the chain end-to-end and
reports a mismatch in `spec_health` and stderr. The log survives connection
restarts for the same Novel. WHEN a new `TTRPG_SESSION_ID` value is detected,
the server SHALL insert a `[session_boundary]` marker entry (REQ-237) before the
first mutating entry of the session — the marker is a mutating entry for
hash-chain purposes and is included in `audit://novel` output.

The audit log SHALL be stored as an `audit_log` array in the Novel JSON,
appended on each mutating tool call alongside the Novel state write per REQ-092.
Each entry is a JSON object with `timestamp`, `badge`, `tool`, `args`, and `prefix`
fields. Each audit entry chains the hash of the preceding entry, producing a
tamper-evident sequence verified end-to-end on load. A hash chain broken at any
point SHALL produce a `[corrupted_audit]` warning in `spec_health` — the server
loads entries up to the break point. `end_novel` removes the Novel JSON and its
backup — the audit log is part of the Novel and removed with it. `export_novel`
(REQ-096) serializes the `audit_log` array directly from the Novel JSON.
Badge switches via `set_badge` (all values: `player`, `game_master`, `none`)
SHALL produce audit entries recording the old hat, new hat, and timestamp.
Badge-switch entries carry `[badge_switch]` as the tool-name field. They are
recorded in the append-only audit log and included in `audit://novel`
output, but they are not mutating state operations for undo/redo purposes —
`undo` SHALL NOT reverse a badge switch.
*Acceptance criterion:* A combat attack produces an audit entry with timestamp,
badge, tool name, arguments, and output prefix; `audit://novel` returns entries in
append order with chained hashes.
_Check:_ T8, T147.

**REQ-168 — Audit resource.** The server provides an `audit://novel` resource,
retrievable via `resources/read` and listed in `resources/list`. It returns the Novel's
full audit log as Markdown — one entry per line, ordered append-first, each line
containing the timestamp, badge, tool name, and output prefix. The resource is
badge-filtered: the Player badge sees entries where the recorded badge is `player` or where
the entity affected is owned by the current player; the Game Master sees all entries.
Forbidden-call entries (REQ-133) carry a `[BOUNDARY_VIOLATION]` prefix in the output column
to distinguish them from mutating entries. State queries are not recorded and do not
appear. When no Novel is active, `resources/read` returns `[ERROR] [STATE_CONFLICT]`.
*Acceptance criterion:* `resources/read` on `audit://novel` returns all audit entries
in append order with chained hashes visible (REQ-040); Player badge sees only own-entity
and own-badge entries; forbidden-call entries carry `[BOUNDARY_VIOLATION]` prefix;
state query tool calls are absent from the resource.
_Check:_ T203.

**REQ-041 — Snapshots and undo.** Every mutating tool call saves a per-call snapshot.
`undo` restores the most recent mutation from a LIFO snapshot stack. Stacks are
keyed by the badge under which `undo` is invoked, but every snapshot captures
the full Novel state — `undo` in the Player badge reverses the most recent
mutation regardless of which badge initiated it. The stack depth
supports at least 10 undo levels per badge. Builders that cannot meet this floor must record
the constraint and its justification in DECISIONS.md (5). An empty stack returns
`[ERROR] [STATE_CONFLICT]`. `undo` is a pure-state tool — it itself is not snapshot-able,
and the step it reverses is removed from the snapshot stack. A pending `[NEED_INPUT]`
blocks undo. Cancelling a workflow restores the pre-workflow snapshot and discards the
workflow's internal undo candidates.
When the undo stack exceeds the configured or default depth ceiling and the oldest
snapshot is discarded, the server SHALL record a `[snapshot_truncated]` audit entry
identifying the badge and the discarded entry's snapshot timestamp. When no depth ceiling
is configured, the truncation threshold is the 10-entry floor defined above.
*Acceptance criterion:* Ten consecutive mutations produce ten snapshot entries;
`undo` restores each in LIFO order; the eleventh undo returns `[STATE_CONFLICT]`
when the builder minimum is 10.
_Check:_ T10.

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

**REQ-043 — Conflict lifecycle.** If the ruleset defines a conflict procedure (combat,
confrontation), it is modeled as Novel-scoped state: participants, round counter, turn
order. `init_combat` starts; `advance_combat` resolves one participant's turn and advances
the turn order, incrementing the round when wrapping around; `end_combat` terminates.
Participants may be entities, named NPCs (REQ-075), or dangers. Turn resolution reports
the participant name, the action taken (if any), the roll result with full transparency,
and any resulting state changes (HP, conditions). When the ruleset delegates mechanical
resolution to separate tools (attack, damage, condition), `advance_combat` derives its
turn report from the audit log — summarizing the most recent mutating entries for the
current participant since the preceding `advance_combat` call — and reports the
participant name, actions taken, roll results with full transparency, and resulting state
changes. When no mutating entries exist for the participant (a skipped or delayed turn),
`advance_combat` reports the participant took no action. The builder selects the
reporting strategy at build time and records the choice in RULESET_MODEL.md. Participants
with no turn-defining mechanical stats — dangers and NPCs created without stat fields —
advance automatically on their turn. `advance_combat` reports the participant name with
an `[AUTO]` marker, describes the participant's narrative action using the participant's
description field (if any), applies no mechanical changes, and advances to the next
turn. No separate tool call is required from the caller. Initiative ties resolve by
participant type (entity before NPC before danger), then alphabetically by name. The
Novel's total combat rounds counter increments by one each time the combat round wraps
(last participant's turn completes and the turn order returns to the first participant).
The counter is cumulative across all combats in the Novel's lifetime. `end_combat` does
not additionally adjust the counter — it records the outcome and tears down the combat
state. The counter is included in novel metadata (REQ-093) and reported in
`session_recap` (REQ-072) and `spec_health` (REQ-025). Snapshot/load
operations work within one connection. Active combat state is visible in `badge_briefing`
as a dedicated group containing the round number, the turn order list with the current
turn clearly marked, and the current participant name. The Game Master sees the full
turn order and all participant names; the Player badge sees entity turn positions only
(NPC and danger positions are redacted). When no combat is active, the group is omitted
entirely from the briefing — no empty-state marker.
*Acceptance criterion:* `init_combat(participants=["hero"], dangers=[{"name":
"goblin"}])` assigns turn order entity first, then dangers; `advance_combat`
reports the participant, action, roll, and state changes; `advance_combat` on a
danger's turn reports `[AUTO]` with a narrative action; after weapon-damage
mutation, `advance_combat` reports the participant name, weapon, damage roll
transparency, and target HP change; after a turn with no mutations it reports the
participant took no action.
_Check:_ T25, T33, T110, T161, T162; G2.

Combat state is Novel-scoped — it persists when the story ends via
`set_badge("none")` or resumes via `set_badge("player")` or
`set_badge("game_master")`. `end_novel` discards the combat state along with all
other Novel state. When a story resumes mid-combat, the combat continues from
its current round and turn position — the turn order, participant states, and
round counter are unchanged. When a story resumes and no combat was active,
play begins from the current scene state.

**REQ-203 — Combat-init guard.** When `init_combat` is called while combat is already
active, the server SHALL return `[ERROR] [STATE_CONFLICT]` with the text "Combat already
active — call `end_combat` first." No combat state is modified and the existing combat
continues unchanged.
*Acceptance criterion:* `init_combat` followed by a second `init_combat` call returns
`[STATE_CONFLICT]` and the active combat's round and turn order are unchanged by the
rejected call.
_Check:_ T246.

**REQ-204 — Combat participant validation.** `init_combat` SHALL validate every
participant ID against the Novel's known entities and named NPCs. Participants that resolve
are added to the turn order normally. Participants that do not resolve to any known entity
or NPC SHALL produce `[ERROR] [NOT_FOUND]` enumerating the unresolvable IDs and the
complete list of valid entity and NPC identifiers. Validation occurs before any initiative
rolls or turn-order construction — a rejected `init_combat` call leaves no combat state
active. Danger entries (which have no persistent IDs) are exempt from this validation.
*Acceptance criterion:* `init_combat(participants=["nonexistent"])` with no entities
imported returns `[NOT_FOUND]` enumerating "nonexistent" and listing valid entity/NPC IDs;
no combat state is created; `session_recap` reports no pending confrontation.
_Check:_ T247.

**REQ-205 — Mid-combat participant changes.** The Game Master may add or remove
participants during active combat via `add_combat_participant` and
`remove_combat_participant` tools. Both are Game Master only. Participants added during
combat are inserted into the turn order immediately after the current turn position,
preserving the existing turn order for all other participants. Added participants that do
not resolve to a known entity or NPC SHALL produce `[ERROR] [NOT_FOUND]` with valid
identifiers enumerated. The current turn pointer does not advance — the added participant
will act in the same round, after the current participant's turn. Removing the current
participant SHALL advance the turn pointer to the next participant before removal. Removing
the last participant SHALL auto-trigger `end_combat` with the outcome "All participants
removed." These tools are mutating operations for undo/redo purposes and SHALL appear in
the audit log.
*Acceptance criterion:* During active combat with participants ["hero", "goblin"],
`add_combat_participant("wizard")` inserts wizard after hero in turn order;
`remove_combat_participant("goblin")` removes goblin from turn order and advances pointer
if goblin was current; removing the last participant from a 1-participant combat ends it
with "All participants removed"; undo reverts the participant change; Player badge returns
`[FORBIDDEN]`.
_Check:_ T248.

**REQ-206 — Combat-round condition expiry.** When the ruleset defines conditions that last
for a fixed number of rounds or turns, the server SHALL track the remaining duration on the
entity. Conditions with a round-based duration SHALL decrement their remaining counter when
the affected entity's turn resolves via `advance_combat`. Conditions reaching zero
remaining rounds SHALL be automatically removed, recorded in the audit log as a
`[condition_expired]` entry with the entity ID, condition name, and the triggering combat
round. The expiry occurs after the turn's actions and before the turn pointer advances — an
entity's last-round effect is active for its final turn. Conditions without a declared
duration are exempt from automatic expiry. The builder records the ruleset's
condition-duration convention in RULESET_MODEL.md under `condition_durations`.
*Acceptance criterion:* Apply a condition with `rounds: 1` to a participant, call
`advance_combat` once — assert the condition is removed after the turn and the audit log
contains a `[condition_expired]` entry. Apply a condition with `rounds: 0` (instant) —
assert it does not decrement. Apply a condition with no `rounds` field — assert no
auto-expiry occurs. Apply a condition with `rounds: 2` — assert it decrements to 1 after
the first `advance_combat` and expires after the second.
_Check:_ T249.

**REQ-221 — Combat-navigation interaction.** WHEN combat is active THE
world-model parser commands that change the player's location (go, enter,
exit, or equivalent navigation verbs) SHALL return `[ERROR] [STATE_CONFLICT]`
with the message "Combat is active — cannot navigate. Call `end_combat`
first or flee per the ruleset's retreat mechanic." Inspection commands
(examine, look) and non-spatial commands (take, drop on current room) SHALL
continue to function — they do not move the player. The combat turn order
and round counter SHALL NOT be affected by parser commands — navigation
blocking prevents spatial changes but does not consume combat turns. This
contract applies regardless of whether the TTRPG ruleset defines movement
restrictions during combat — the world-model layer enforces spatial
immutability during combat as a narrative-integrity guard, superseded only
if the ruleset defines a specific retreat or tactical-movement mechanic
that explicitly permits location changes during combat.
*Acceptance criterion:* During active combat with a populated world model,
`command("go north")` returns `[STATE_CONFLICT]`; `command("look")` and
`command("examine sword")` return `[OK]`; after `end_combat`, navigation
resumes.
_Check:_ T263.

**REQ-217 — Condition tools.** The server supports applying and removing conditions
via `apply_condition(entity_id, condition, rounds?)` and
`remove_condition(entity_id, condition)`. `condition` SHALL be validated against the
ruleset's indexed condition list — unknown conditions SHALL return `[INVALID_INPUT]`
with valid conditions enumerated (REQ-059). Applying the same condition to an entity
that already has it SHALL return `[WARNING]` with the text "Condition already active."
No duplicate is added, no other state changes. `remove_condition` on an entity that
does not have the condition SHALL return `[WARNING]` with the text "Condition not
present." Both tools are badge-gated per REQ-032: the Player may apply or remove
conditions on their own active entity only; the Game Master may apply or remove
conditions on any entity or NPC. Player attempts on other entities SHALL return
`[FORBIDDEN]` with the target entity ID. The optional `rounds` parameter on
`apply_condition` sets the combat-round duration for REQ-206 auto-expiry — omitting
it creates a condition without automatic expiry. Both tools SHALL record mutation
entries in the audit log (REQ-040) and appear in `session_recap` condition changes
(REQ-072). Applied conditions SHALL appear on `character_sheet` output and in
`badge_briefing` entity summaries.

Under the Player badge, condition entries in `character_sheet` and `badge_briefing`
SHALL be rendered without expiry round counts — the Player sees only the condition
name. The Game Master badge SHALL include expiry round counts when the `rounds`
parameter was set.

*Acceptance criterion:* `apply_condition(entity, "prone")` adds the condition and
returns `[OK]`; a second call returns `[WARNING]` with "Condition already active.";
`remove_condition(entity, "prone")` removes it; `remove_condition` on an entity
without the condition returns `[WARNING]` with "Condition not present."; applying
"not_a_condition" returns `[INVALID_INPUT]` with valid conditions listed; Player
`apply_condition` on another player's entity returns `[FORBIDDEN]`; applied condition
appears on `character_sheet` and `badge_briefing` entity summary.
_Check:_ T258.

**REQ-072 — Session recap.** The server provides a `session_recap` tool — a pure-state tool
that returns a structured summary of the active Novel: session timespan (earliest to latest
audit entry), active entities with final state (HP, conditions, status — where status is a
derived mechanical flag: "alive" when HP > 0, "unconscious" at HP = 0, "dead" when the
ruleset's death condition is applied; rulesets without a death condition SHALL report
"alive" and "incapacitated"), completed confrontations, pending confrontations, current
scene state, active lore entries and their trigger status, the current narrative directive,
current scene type, the last N scene state transitions (configurable), roster
changes (entities created or removed in this Novel during the audit-log timespan), condition
changes, and the last N significant rolls (configurable). `session_recap` output
is badge-filtered: the Player badge sees only own-entity data; the Game Master badge
sees all. `session_recap` output does not produce narrative prose — it returns structured
data the LLM uses to narrate the recap. The output SHALL be a machine-parseable structure.
At minimum it SHALL contain the following named fields with typed values: `timespan_start`
and `timespan_end` (ISO 8601 timestamps, or null if audit log empty), `entities` (array of
objects with `name`, `hp`, `max_hp`, `conditions`, and `status` string fields),
`confrontations_completed` (array of objects with `participants`, `rounds`, and `outcome`
derived from audit-log combat lifecycles per REQ-175), `confrontation_pending` (null or
object describing the active combat), `scene` (current description), `scene_type`
(lore_entries (array of objects with `key` and `active`),
`narrative_directive` (free-text or null), `scene_transitions` (array of `{from, to,
timestamp}` objects, most recent N), `roster_changes` (array of `{entity_id, action`
— "created" or "removed", `timestamp}`), `condition_changes` (array of `{entity_id,
condition, action` — "applied" or "removed", `timestamp}`), `significant_rolls` (per
REQ-174), `total_combat_rounds`, and `story_entries` (array of objects with
`type`, `entry`, `timestamp`, `scene_anchor`, and `entity_ids` — most recent N, default
10). Missing or inapplicable fields SHALL be
present with a typed null or empty array, not omitted. The LLM reconstructs a narrative
recap from these fields; the tool SHALL NOT generate recap prose.
`session_recap` accepts optional parameters: `session_id` (when
provided, scopes the recap to the audit log range bounded by the matching
`[session_boundary]` marker and the next marker, or the log end for the current
session; when omitted, spans the full log range); `max_transitions` (configurable, default 3,
minimum 1, maximum 20) — the number of scene state transitions to return; `max_rolls`
(configurable, default 5, minimum 1, maximum 50) — the number of significant rolls to
return. Values outside the declared range SHALL produce `[ERROR] [INVALID_INPUT]`
with the valid range enumerated. When `session_id` does not match any
`[session_boundary]` marker, return `[ERROR] [NOT_FOUND]` with valid
session IDs enumerated.
*Acceptance criterion:* `session_recap()` returns a structure with all named fields
present, each field carrying its declared type or null/empty-array when inapplicable;
the output contains no narrative prose strings outside field values; entity status
reports "alive" when HP > 0, "unconscious" at HP = 0, "dead" when death condition active.
_Check:_ T53, T212, T213, T214, T215.

**REQ-279 — Narrative orientation.** `session_recap` SHALL include a `narrative_orientation`
field — a prose paragraph (2–4 sentences) derived from the active Novel state. The
paragraph SHALL synthesize: (a) the last 3 story journal entries of type `decision` or
`bond` (REQ-246); (b) active NPC dispositions that differ from their creation default;
(c) the current narrative directive (REQ-081); (d) active countdown names and remaining
ticks in narrative form ("The ritual completes in 2 rounds"); and (e) active vow names
and milestone counts when vow tracking is populated (REQ-289). The paragraph SHALL use
plain English without tool names, status prefixes, or structured field syntax — it reads
as a "Previously on…" summary a returning player can understand immediately.

The field SHALL be present when any of its source data is non-empty. When all source data
is empty (new Novel with no play), the field SHALL contain the empty-state marker
"[No narrative history yet — your story begins here.]" `session_recap` SHALL include
`narrative_orientation` as its first field, before the structured data blocks. The
paragraph is badge-filtered: Player badge sees orientation derived from `shared`-scope lore,
own-entity story entries, and player-visible NPC dispositions per REQ-032.

*Acceptance criterion:* After a session with a story journal decision, a narrative
directive, and an active countdown, `session_recap()` returns a `narrative_orientation`
field containing a 2–4 sentence prose summary synthesizing all three sources.
`session_recap` on a new Novel with no play returns the empty-state marker.
_Check:_ T-new-279.

**REQ-174 — Significant-roll criterion for recap.** A roll is significant for
`session_recap` purposes when it (a) was produced by a dice-resolution tool
(roll_save, roll_skill_check, roll_weapon_attack, roll_weapon_damage, or
ruleset-equivalent), (b) has an entity as participant or attacker, and (c)
produced a tool output visible to at least one badge. Pure-generation table rolls
(REQ-086), GM-only state queries, and rolls without an entity participant are
excluded. The server SHALL track the last N significant rolls per Novel,
discarding the oldest when N+1 is reached. `session_recap` SHALL list
significant rolls in chronological order with: tool name, entity identifier,
die faces, and at most the major outcome (hit/miss/fail/success/damage amount
without full transparency replay — the recap is a summary, not a transcript).
_Check:_ T213.

**REQ-175 — Confrontation summary derivation.** `session_recap` SHALL derive
confrontation summaries from the Novel's audit log. Each completed confrontation is
the span between a `init_combat` audit entry and its matching `end_combat` entry:
participants (entities and named NPC identifiers from the init_combat entry), round
count (audit-log-derived count of `advance_combat` entries divided by participant
count, rounded up), and outcome (end_combat's outcome field). The pending
confrontation, if any, is the active combat state: participants, current round, and
turn position. When no combat is active, `confrontations_completed` SHALL be an empty
array and `confrontation_pending` SHALL be null. Consecutive combats in a single
audit-log timespan SHALL produce separate completed entries in chronological order.
_Check:_ T214.

**REQ-073 — Countdowns.** The server supports named Novel-scoped countdowns via
`set_countdown(name, ticks, type, options)`. A `round` countdown decrements automatically
at the end of each combat round. A `narrative` countdown decrements only when the Game
Master calls `advance_countdown(name)` (for in-world events: time until sunrise, enemy
army arrival, ritual completion, torch burnout, poison timers). Either type may carry an
`on_scene_transition` flag (decrements on scene transition per REQ-125). Every countdown
has a `badge_scope` — `game_master` or `shared` — and a `direction` — `decrement` (fires at
`ticks <= 0`) or `increment` (fires at `ticks >= total`). Both carry an unambiguous
default preserving backward compatibility. `advance_countdown(name)` adjusts one tick in
the countdown's direction. `remove_countdown(name)` deletes a countdown before it fires.
When a countdown fires, it is recorded in the audit log with a timestamp and removed from
active countdowns — its name slot freed for reuse. Expired countdowns remain in the audit
log. `countdown://active` lists all active countdowns with remaining ticks, type,
badge_scope, and direction, badge-filtered: only shared countdowns are visible to the Player
badge. Countdowns are Novel-scoped — survive connection restarts, discarded by `end_novel`.
Countdown tools are Game Master only; the Player badge reads active countdowns via
`badge_briefing` and resource URIs.
*Acceptance criterion:* A shared countdown "torch" (3 ticks) appears in both badges.
briefings; a GM-only countdown "patrol" appears only in the GM briefing;
`advance_countdown("patrol")` at tick 1 fires and removes it.
_Check:_ T54, T139.

**REQ-329 — Countdown-world coupling.** Countdowns SHALL accept an optional `trigger`
array with world-model event types. Supported trigger types: `on_room_enter(<room_id>)`
— fires when the active entity enters the named room via parser navigation;
`on_thing_take(<thing_id>)` — fires when the named thing is taken; `on_door_open(<exit_ref>)`
— fires when the named exit's door is opened. World-model events that match a trigger
SHALL advance the countdown by one tick. Multiple triggers per countdown SHALL be
permitted — if any trigger matches, the countdown advances. Trigger resolution is
mechanical — the countdown fires regardless of narrative framing. A countdown with no
`trigger` array SHALL use existing advancement behavior (manual `advance_countdown` or
round/narrative type advancement). Triggers SHALL NOT replace existing advancement
— a round countdown with a trigger advances on both round completion AND trigger match.
*Acceptance criterion:* `set_countdown("ambush", 3, type="narrative",
triggers=["on_room_enter(guard_room)"])` — parser navigation into the guard room advances
the countdown by one tick. A countdown without triggers behaves as before. A round
countdown with a trigger advances on both round end and trigger match.
_Check:_ T-new-329.

**REQ-289 — Vow tracking.** The Game Master may track narrative vows — intangible
promises, quests, or obligations that bind entities or the party. `set_vow(name,
description, parties, difficulty, scope)` creates a vow: `name` (unique identifier),
`description` (the vow's substance — a sentence), `parties` (array of entity/NPC/faction
IDs bound by the vow), `difficulty` (one of `troublesome`, `dangerous`, `formidable`,
`extreme`, `epic` — determines the rank track), `scope` (one of `gm`, `shared`,
`faction`, or `party` — badge visibility per REQ-032). A vow's rank track has 10
milestones per difficulty rank (troublesome = 10, dangerous = 20, formidable = 30,
extreme = 40, epic = 50). `mark_milestone(vow_name)` advances the milestone counter by
one. When milestones reach the rank track total, the vow is complete and `resolve_vow`
becomes available. `resolve_vow(vow_name, outcome, consequences)` closes the vow: the
vow moves from active to resolved state, the outcome (free-text summary) is stored, and
`consequences` (free-text narrative effects) are recorded as a `consequence` story
journal entry per REQ-246. `forsake_vow(vow_name, reason)` abandons a vow — the vow
moves to `forsaken` state and is excluded from active displays; the reason is recorded
alongside the vow.

Active vows appear in `badge_briefing` (`narrative_threads` section per REQ-281) and
`session_recap` (`narrative_orientation` per REQ-279). Resolved and forsaken vows
appear in `session_recap` with their state and outcome/reason. Vow state persists
with the Novel and is included in `save_pause_context` captures (REQ-232). Vow tools
are Game Master only; the Player badge reads vow state via `badge_briefing` and
`session_recap` when the vow's scope is `shared` or `party`.

*Acceptance criterion:* `set_vow("Find the Crown", "Recover the lost Crown of Alara",
parties=["pc_1", "pc_2"], difficulty="dangerous", scope="shared")` creates a vow with
a 20-milestone track. `mark_milestone("Find the Crown")` advances the counter.
`resolve_vow("Find the Crown", "The Crown is found in the Dragon's hoard", "The
kingdom is restored")` moves the vow to resolved. `forsake_vow("other_vow", "Too
dangerous")` marks it forsaken.
_Check:_ T-new-286.

**REQ-322 — Vow-countdown coupling.** WHEN `set_vow` creates a vow (REQ-289), THE engine
SHALL offer a countdown creation suggestion in the `narrative_threads` section of
`badge_briefing`: the suggestion carries the vow name, a proposed countdown name
(`vow:<vow_name>`), and the vow's milestone total as the tick count. The GM may accept
via `respond` to auto-create a `mission`-type countdown linked to the vow. WHEN
`mark_milestone` advances a vow, if a linked countdown exists with name `vow:<vow_name>`,
THE engine SHALL advance that countdown by one tick. WHEN a linked countdown fills, the
countdown fires its completion AND the vow becomes eligible for `resolve_vow`. WHEN
`resolve_vow` or `forsake_vow` closes a vow, any linked countdown with name
`vow:<vow_name>` is removed. The coupling is optional — the GM may decline the suggestion
and manage vows via milestones alone (current behavior). Vow-countdown links SHALL
survive Novel persistence and SHALL be included in `save_pause_context` captures
(REQ-232).

*Acceptance criterion:* `set_vow("Find Crown", ..., difficulty="dangerous")` produces a
countdown suggestion in `badge_briefing`. Accepting creates a 20-tick `mission`-type
countdown named `vow:Find Crown`. `mark_milestone("Find Crown")` advances both the
milestone counter and the countdown. Filling the countdown makes the vow eligible for
`resolve_vow`. `resolve_vow("Find Crown", ...)` removes the countdown.
_Check:_ T-new-325.

#### Entities, NPCs, and Adventure Content

**REQ-074 — Multi-entity support.** A Novel may contain multiple entities under the
same badge. The roster may hold multiple entities for the player. `entities://` lists
all Novel entities visible to the active badge. One entity is the active entity — the
default target for tools that accept an `entity_id` when no `entity_id` is supplied. The
first imported entity is the active entity by default. `set_active_entity(entity_id)`
switches the active entity and is always callable regardless of badge. The `party`
resource (`party://current`) lists all player-owned entities with summary stats: name,
active status, HP, conditions, and `present` flag (derived from the most recent
`set_scene_state` `characters_present` parameter per REQ-307). REQ-030 scoping is
unchanged — one user per connection, no multiplayer. The active entity also establishes the
narrative POV per REQ-220.
*Acceptance criterion:* Creating and importing two entities produces two entries
in `entities://`; `set_active_entity(entity_02)` switches the default target for
entity_id-optional tools.
_Check:_ T55. Calling `import_character(roster_id)` for a roster entity whose Novel
already contains a copy (matched by roster source ID, not Novel entity ID) SHALL
return `[STATE_CONFLICT]` identifying the existing Novel entity by name and ID, with
a hint: "Entity already imported as `<name>` (`<entity_id>`)." This prevents silent
entity duplication within a Novel. The constraint is per-Novel — importing the same
roster character into two different Novels is permitted.
_Check:_ T220.

**REQ-176 — Entity removal.** The server SHALL provide a `remove_entity(entity_id)` tool
(Game Master only) that removes an entity from the active Novel. Removing the active
entity SHALL clear the active entity field; the next imported or explicitly activated
entity becomes active. Removing the last entity SHALL leave `active_entity_id` null and
clear `characters_present`. `party://current` SHALL exclude removed entities. The roster
baseline is unaffected — `import_character` using the same roster ID after removal creates
a fresh copy. Entity removal is a mutating operation for undo/redo purposes. Player badge
attempts return `[FORBIDDEN]`.
*Acceptance criterion:* `remove_entity("character_02")` removes the entity from
`entities://`; `party://current` no longer lists it; the roster baseline is unchanged;
re-importing the same roster ID creates a fresh entity copy.
_Check:_ T216.

**REQ-177 — Roster entity removal.** The server SHALL provide a
`remove_roster_character(roster_id)` tool (callable with no badge active or Game Master badge)
that removes a character from the roster. Removing a roster character does not affect any
Novel that has already imported it — existing Novel entity copies survive independently.
Player badge attempts return `[FORBIDDEN]`. When the roster ID does not exist, SHALL return
`[NOT_FOUND]` with valid roster IDs enumerated.
*Acceptance criterion:* `remove_roster_character("character_01")` removes the entry from
`roster://`; a Novel that previously imported it retains its copy; re-creating a character
with the same name creates a new roster entry with a different ID.
_Check:_ T217.

**REQ-178 — Roster listing.** The server SHALL provide a `list_roster_characters` tool,
callable under any badge with no restrictions. The tool returns a structured listing: for each
roster entry, the roster ID, name, race, class, and level. When no characters exist in the
roster, the tool SHALL return an empty-state marker. The `novel_setup` prompt (REQ-089) SHALL source
its roster character list from this tool's output rather than constructing the list
independently. The `roster://` resource (REQ-022) SHALL be populated from the same data
source — `roster://<type>` groups entries by type (e.g., class, race), and `roster://<id>`
returns the full entity data for a single roster entry including personality fields and
voice examples.
*Acceptance criterion:* `list_roster_characters()` returns all roster entries with ID, name,
race, class, level; `roster://character_01` returns full data; an empty roster returns the
empty-state marker.
_Check:_ T219.

**REQ-075 — Named-NPC state.** The server supports named non-player characters via
`create_npc(name)`. NPCs are Novel-scoped with URIs (`npc://<id>`). Only `name` is a
required field; optional fields include `description`, `disposition`, `location`, and
any ruleset-derived stat fields as partial entries (all optional). NPCs may participate in
confrontations alongside entities and dangers (REQ-043). `update_npc(id, fields)` mutates
NPC fields; providing a field not previously set on the NPC SHALL extend the NPC's
field surface — the field is added with the supplied value. Null or empty-string
values SHALL clear the field without removing it from the NPC's known field set.
`remove_npc(id)` deletes an NPC. `npcs://` lists all active NPCs. NPC state
persists with the Novel. All NPC tools are Game Master only; the Player badge reads
NPC state via `badge_briefing` and resource URIs.

Every NPC SHALL carry depth metadata: `appearance_count` (incremented each
time the NPC appears in a scene or is referenced in `badge_briefing`), `first_seen`
(ISO 8601 timestamp of first appearance), and `last_seen` (ISO 8601 timestamp of
most recent appearance). `badge_briefing` SHALL include a depth signal for each NPC:
NPCs with `appearance_count < 3` display with name and description only; NPCs with
`appearance_count >= 3` display with a `[recurring]` marker and the count ("3
appearances across 2 sessions"); NPCs with `appearance_count >= 10` display with a
`[campaign]` marker. `session_recap` SHALL include an NPC relationship heatmap:
for each NPC with `appearance_count > 1`, the number of sessions they appeared in
and the number of distinct scenes. An NPC not seen in 5 or more sessions SHALL carry
a `[distant]` marker in `badge_briefing`. The depth metadata is automatically maintained
by the server — the GM does not set it directly.

*Acceptance criterion:* `create_npc("Innkeeper")` produces an NPC with `npc://<id>`
URI; `update_npc(id, {disposition: "friendly"})` changes the field; `remove_npc(id)`
deletes it. An NPC appearing in 3 scenes across 2 sessions displays `[recurring]` in
`badge_briefing` with the appearance count. An NPC not seen in 5 sessions carries
`[distant]`. `session_recap` includes an NPC relationship heatmap with session and
scene counts.
_Check:_ T56.

**REQ-119 — NPC stat block reference.** `create_npc` accepts an optional
ruleset reference — the name of a monster, NPC template, or stat block entry from
the indexed ruleset. When a reference matches a ruleset entry, the builder populates
the NPC's stat fields from that entry's baseline values as defined by the ruleset.
Any caller-supplied stat fields override the referenced values. A reference that
does not match any ruleset entry returns `[ERROR] [NOT_FOUND]` with valid reference
names enumerated.
*Acceptance criterion:* `create_npc("Goblin", ruleset_reference="Goblin")`
populates stat fields from the ruleset entry; an unknown reference returns
`[NOT_FOUND]` with valid names.
_Check:_ T126.

Reference-populated fields are additive to the builder-determined NPC stat
surface (REQ-123). A reference entry may carry fields beyond the builder's
discovered conventions — those fields SHALL be included on the NPC and are
considered part of the NPC's stat block for rendering (REQ-120) and resource
URI output (REQ-121). Caller-supplied fields that match reference field names
override the referenced values; caller-supplied fields that do not match any
reference field name SHALL extend the NPC's stat surface.
A reference field whose name collides with a builder-determined stat field
that uses a different ruleset-native name SHALL be surfaced under the
reference field's name; the builder records the name mapping in
RULESET_MODEL.md.

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

**REQ-122 — NPC narrative fields.** Named NPCs (REQ-075) may carry narrative
personality fields following the same contract as entity personality fields
(REQ-077): `description`, `voice`, `background`, `goals`, and `voice_examples`.
These fields are set via `set_personality` and `set_voice_examples` accepting an
NPC identifier alongside entity identifiers. NPC narrative fields are Novel-scoped
— NPCs have no roster; fields persist only with the Novel. These fields are inert
narrative context and do not influence mechanical resolution. Setting narrative
fields on an NPC is Game Master only. Fields are surfaced in `badge_briefing` and at
`npc://<id>/personality`.
*Acceptance criterion:* `set_personality("npc_01", {voice: "gruff, clipped
sentences"})` sets NPC narrative fields; `npc://npc_01/personality` returns them;
these fields are inert and do not influence combat resolution.
_Check:_ T129.

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

**REQ-124 — NPC damage resolution.** Damage-resolution tools accept NPC
identifiers as target parameters alongside entity identifiers. When an NPC is the
target, the tool resolves damage against the NPC's defensive stats using the ruleset's own
damage model — deducting HP, wounds, or the ruleset's loss-of-effectiveness metric —
and reports the result with full transparency (per REQ-003). An NPC reduced to or below the ruleset's
zero-health threshold is marked with the ruleset-defined incapacitation condition.
Damage resolution against NPCs is snapshot-able and audited.
*Acceptance criterion:* `roll_weapon_damage("longsword", target_id="npc_01")`
reduces NPC HP; zero HP applies incapacitation per ruleset convention; the
result is audited and snapshot-able.
_Check:_ T131.

**REQ-076 — Scene-state ledger.** The server maintains a Novel-scoped narrative scene
via `set_scene_state(description, ...)`. In addition to `description` (required), the
tool accepts optional fields: `location`, `time_of_day`, `atmosphere` (per REQ-076a),
`scene_type` (per REQ-087), `narrative_directive` (per REQ-081),
`skip_transition_hook` (per REQ-125), and `characters_present` (per REQ-307 — array of
entity IDs present in this scene; omitted defaults to all imported entities). When
`location` resolves to a world-model room (REQ-326), the room provides spatial truth
for the scene — the GM's `description` is narrative framing. Each call creates a timestamped entry in
the audit log; previous entries are retained in audit history. `scene://current` returns
the most recent scene state. `scene://history` returns up to a configurable maximum of
the most recent entries. When the cap is exceeded, the most recent entries
are returned with a count of suppressed entries and a `[truncated]` marker. The full
scene history is available in the audit log (REQ-040). All entries are badge-filtered.
Scene state is narrative context. It does not influence mechanical resolution or search
results. Guidance surfaces (badge_briefing tool ordering, suggest_actions filtering per
REQ-087, and lore trigger matching per REQ-083) may be informed by scene description
and type — these are navigation and narrative reactivity, distinct from mechanical
resolution. The server maintains a Novel-scoped `scene_tick` counter, initialized to
zero when the Novel is created and reset to zero on each scene transition. The tick
increments by one each time `advance_combat` resolves a full combat round (wraps from
last participant to first). It appears in `badge_briefing` for the Game Master badge only,
in the Scene section. The tick is a pacing aid — it does not trigger mechanics. The
`set_scene_state` tool is Game Master only; the Player badge reads scene state via
`badge_briefing` and `scene://current`. Scene state persists with the Novel.
*Acceptance criterion:* Three `set_scene_state(...)` calls produce three
timestamped entries in `scene://history`; scene state is narrative context and
does not change search results for mechanical terms.
_Check:_ T57, T112, T132, T137.

WHEN `set_scene_state` references a location that has established lore entries (REQ-083)
and the new scene description contradicts an established property of that location, THE
server SHALL emit a `[WARNING]` naming the contradiction and the conflicting lore entry.
The warning SHALL NOT block the scene change — the GM may override — but SHALL surface
the inconsistency for the GM's awareness. The check SHALL compare against: (a) lore
entries with `badge_scope: "game_master"` or `"shared"` whose trigger keywords match the
location name; (b) NPC dispositions set explicitly (not creation defaults) for NPCs whose
`location` field matches the scene location. The check is keyword-based and does not
perform semantic analysis — a lore entry stating "the Inn is crowded" with a trigger
keyword "Inn" SHALL produce a `[WARNING]` when a scene description contains "the empty
Inn."

*Acceptance criterion:* Set a lore entry for "Blackwood Inn" with content "crowded and
noisy" and trigger "Blackwood." Call `set_scene_state("The Blackwood Inn is quiet and
deserted.")` — assert `[WARNING]` naming the lore entry. Call `set_scene_state("The
Blackwood Inn is bustling as always.")` — assert no warning.
_Check:_ T-new-282.

**REQ-076a — Structured scene fields.** `set_scene_state` accepts optional structured
fields alongside the required `description`: `location` (a named place within the world),
`time_of_day` (morning, afternoon, evening, night, or free-text), `atmosphere` (mood,
weather, sensory qualities — e.g., "tense, foggy, silent"), `scene_type` (one or more
type tags from the canonical catalog: `combat`, `social`, `exploration`, `neutral`, per
REQ-087), and `narrative_directive` (a standalone directive string or an array of
labeled directives per REQ-081). These fields are surfaced in
`badge_briefing` alongside the description, in `scene://current`, and in `scene://history`
entries. They are narrative context — inert data that does not influence mechanical
resolution. All fields persist with the Novel. The Player badge reads them via
`badge_briefing` and `scene://current`; write access is Game Master only.
*Acceptance criterion:* `set_scene_state("dark cavern", location="Underdark",
time_of_day="night", atmosphere="tense, dripping water")` surfaces all four
fields in `scene://current`.
_Check:_ T133.

**REQ-252 — Narrative fast-forward.** The Game Master may skip intervening narrative
time via a `fast_forward` parameter on `set_scene_state`. When present, the
fast-forward SHALL produce a bridging summary of what transpired during the
skipped interval: (a) any countdowns that would have elapsed — `narrative` countdowns
advance by the caller-declared interval and `round` countdowns advance proportionally;
(b) location lore entries whose triggers match the new scene; (c) NPC state changes
the GM declares in a `changes` array (position, disposition, condition). The bridging
summary SHALL be recorded in the audit log as a `[fast_forward]` entry containing the
interval description, countdown adjustments, NPC updates, and lore triggers activated.
`fast_forward` accepts: `interval` (free-text describing the skipped period —
"three days of uneventful travel"), `changes` (optional array of NPC state assertions),
and `skip_countdowns` (optional boolean — when true, countdowns are NOT advanced,
preserving their state for later use). The fast-forward is snapshot-able and the
pre-fast-forward state is restored on undo. Caller SHALL omit `skip_transition_hook`
when `fast_forward` is present — the transition hook fires after the bridging
summary is generated. Player badge returns `[FORBIDDEN]`.
*Acceptance criterion:* `set_scene_state("The castle gates", fast_forward={interval:
"three days of travel", changes:[{npc_id:"guard_1", location:"castle gate"}])`
produces an audit entry with the bridging summary, advances narrative countdowns by 3
days, and updates guard_1's location. Undo restores the pre-fast-forward scene state
and countdown positions.
_Check:_ T-new-252.

**REQ-307 — Entity presence.** Entities carry a Novel-scoped `present` flag and
`last_location` field, derived from the most recent `set_scene_state` call that
listed the entity in its `characters_present` parameter (REQ-076). When
`characters_present` is omitted, all imported entities are considered present
(backward compatible). `party://current` SHALL include a `present` boolean per
entity. Entities listed in `badge_briefing` SHALL carry a `[not present]` marker
and their `last_location` when their `present` flag is false. `set_active_entity`
to a non-present entity SHALL NOT produce an error — the active entity switches
and the `knowledge_state` section renders the "Entity not present" marker per
REQ-109. A GM-only `set_party_presence(entity_ids, location?)` tool SHALL
allow the GM to declare presence explicitly — setting `characters_present` on
the current scene without altering other scene fields. Calling
`set_party_presence([])` marks all entities as not present; calling it with all
entity IDs restores full-party presence. Presence state persists with the Novel.
*Acceptance criterion:* After `set_scene_state("Dark corridor",
characters_present=["rogue_01"])`, `party://current` shows the rogue as present
and other entities as not present. `set_party_presence(["wizard_01"], "Camp")`
updates presence without changing scene description. Entity listing in
`badge_briefing` marks non-present entities with `[not present]`.
_Check:_ T-new-307.

**REQ-308 — Knowledge gating by presence.** An entity's knowledge state SHALL be
scoped to the scenes it attended. An entity gains percepts — revealed secrets,
triggered lore, NPC relationship changes — only from scenes where it was listed in
`characters_present` (REQ-307). Percepts gained from attended scenes are
retained regardless of current presence. When the active entity was not present for a
percept, that percept SHALL NOT appear in the entity's `knowledge_state` section.
When the active entity is not present in the current scene, the `knowledge_state`
section SHALL render "[Entity not present in this scene]" above the entity's
retained knowledge. The GM controls when information crosses character boundaries
via existing tools — `reveal_secret` makes secrets known to other entities,
`set_lore_entry` with appropriate triggers extends lore to entities that were not
present, and story journal entries record character-to-character information sharing.
*Acceptance criterion:*

1. Set scene to corridor with rogue only present. `reveal_secret("floor_trap",
"rogue_01")`. Rogue's `knowledge_state` includes the trap.
2. Set scene to camp with wizard only present. Wizard's `knowledge_state` does NOT
include the trap.
3. Reunite party (`characters_present` includes all). Rogue's knowledge is retained;
wizard's knowledge still excludes the trap until `reveal_secret("floor_trap",
"wizard_01")` is called.
_Check:_ T-new-308.

**REQ-330 — Knowledge-world coupling.** WHEN an entity explores rooms via parser
navigation (`resolve_intent` per REQ-323 or `command` per REQ-196), the entity SHALL
be auto-added to presence for that scene/room. Rooms visited via exploration SHALL
produce knowledge state entries: room names visited, visible things examined, NPCs
encountered. Exploration-derived knowledge SHALL be retained per REQ-308 — once an
entity has visited a room, it knows the room regardless of current presence. The
`knowledge_state` briefing section SHALL include exploration-derived entries alongside
revealed secrets — grouped as "Explored" (rooms visited, things seen) and "Learned"
(secrets revealed via `reveal_secret`). The GM's explicit `characters_present` on
`set_scene_state` (REQ-307) SHALL remain the primary presence mechanism — exploration
presence supplements, it does not replace. When the GM sets `characters_present` that
conflicts with exploration presence, the explicit GM declaration wins.
*Acceptance criterion:* A character in room "Entrance" navigates via `resolve_intent`
to "Guard Room" — `knowledge_state` includes "Guard Room" under "Explored" with
timestamp. Moving to "Chapel" adds Chapel. Returning to "Guard Room" does not create
a duplicate entry. `set_scene_state("Camp", characters_present=["pc_1"])` overrides
exploration presence — pc_1 is present in Camp regardless of prior room.
_Check:_ T-new-330.

**REQ-311 — NPC memory model.** EACH NPC SHALL maintain a per-NPC memory of its
interactions with player entities, independent of the global knowledge system (REQ-308).
The NPC memory records:

- **Witnessed events.** WHEN an NPC is present in a scene (`characters_present` per
  REQ-307), THE engine SHALL record a memory for what the NPC observed: entity actions,
  dialogue context, and mechanical outcomes (damage dealt, conditions applied, countdowns
  fired). This is scoped to what the NPC could perceive — an NPC in the tavern does not
  learn what happened in the dungeon. WHEN `record_story` fires in a scene where NPCs are
  present via `characters_present` (REQ-307), each present NPC SHALL additionally gain a
  memory fact referencing the journal entry: entry type, summary, and timestamp. This
  supplements independently witnessed events — NPCs carry both direct observations and
  journal-noted events they were present for.

- **Party knowledge.** FOR each player entity the NPC has interacted with, THE engine
  SHALL record what the NPC knows: the entity's name, apparent capabilities (class,
  visible equipment), relationship status (REQ-236), and recent interactions (the last 3
  interactions with timestamps). An NPC who has never met an entity SHALL carry a "no
  prior contact" marker for that entity.

- **Emotional state.** THE engine SHALL derive the NPC's current emotional state from
  recent interactions: disposition trends (hostile → neutral → friendly), stress markers
  (number of combats survived, allies lost), and goal proximity (goal-relevant events per
  REQ-311). The emotional state SHALL be surfaced as a one-sentence summary in
  `badge_briefing` alongside the NPC's personality fields.

- **State evolution.** WHEN a player entity interacts with an NPC — via combat (REQ-043),
  social skill checks, or mechanical outcomes that affect the NPC — THE engine SHALL
  update the NPC's memory and disposition without requiring a GM tool call. A player who
  threatens an NPC SHALL produce `disposition: hostile` automatically. A player who helps
  an NPC SHALL produce `disposition: friendly`. The GM may override automated disposition
  changes via `update_npc`.

WHEN an NPC is present in the current scene, THE engine SHALL surface the NPC's memory in
`badge_briefing` as an `## NPC Memory` section within the entity personality group
(REQ-109). The section SHALL include: a one-sentence emotional state summary, a summary
of the NPC's last 3 interactions with present player entities, and any goals the NPC is
pursuing. NPC memory SHALL be gated by presence (REQ-307) — only NPCs in the current
scene surface their memory. Memory facts persist with the Novel. `spec_health` SHALL
report `npc_memory_count` — the total number of NPC memory entries across all NPCs.

*Coupling:* NPC memory entries SHALL populate campaign memory facts (REQ-310) per-NPC
category when the event involves significant state changes (goal advancement, disposition
flip, relationship change).

*Acceptance criterion:* After a session where an NPC (blacksmith) is threatened by a
player entity, `update_npc` is not called, but `badge_briefing` under GM badge includes the
NPC's memory section showing `disposition: hostile` and the threat event. After a second
session where the same player entity helps the blacksmith, the NPC's memory section shows
`disposition: friendly` and the disposition flip is a campaign memory fact. An NPC who
has never met the party shows "no prior contact." `spec_health` reports
`npc_memory_count ≥ 1`.
_Check:_ T-new-312.

**REQ-077 — Entity personality fields.** Each roster entity may carry optional narrative
fields:

- `description` — physical appearance.
- `voice` — the entity's speech characteristics. Conveys at minimum pitch, pace,
  vocabulary range, mannerisms, and formality register as a free-text description.
- `background` — history and motivation.
- `goals` — current objectives.
- `voice_examples` — up to 5 example dialogue snippets, each recording `context`
  (situation label), `dialogue` (verbatim speech), and `tag`
  (scene-type or emotional-context label describing when the example dialogue would be
  spoken — e.g., combat, social, exploration). These examples demonstrate
  how the entity speaks in specific situations, set via the optional `voice_examples`
  parameter on `set_personality(entity_id, ...)` and stored at the roster level.
  Voice examples follow the same badge-gating contract as other personality fields:
  Player-only for own entities (per REQ-165), GM for all. On NPCs (REQ-122), setting
  voice_examples is Game Master only.
  Voice examples sourced from enrichment carry a `[supplementary]` tag and source URL.

These are narrative context — inert data, not mechanical. `set_personality(entity_id,
fields)` sets description, voice, background, goals, and voice_examples — all as
optional fields on one tool (Player-only for own entities per
REQ-165, GM for all). The tool also accepts NPC identifiers per REQ-122. Personality
fields are stored at the roster level and are explicitly
mutable (an exception to roster baseline immutability — narrative fields, unlike
mechanical stats, may be edited after creation). Novel-level overrides: if personality
fields are set on a Novel entity via `set_personality`, they override the roster
baseline for that Novel only. On Novel entity import, roster personality fields are
copied alongside mechanical stats.

Fields are surfaced in `badge_briefing` alongside entity stats and at
`entity://<id>/personality`; voice_examples are surfaced under the entity personality
group in `badge_briefing` per REQ-109. When an entity speaks in-character, voice_examples
are rendered ahead of trait descriptions in the prompt context (REQ-126).

**Authorship guidance.** Effective personality fields describe concrete behaviors rather
than abstract traits. The `voice` field works best when it specifies how the entity
speaks in practice — e.g., clipped sentences, reaches for sword before speaking when
startled — rather than bare adjectives. Voice_examples should demonstrate the entity in
emotionally distinct situations; they are the primary mechanism for dialogue
consistency.
*Acceptance criterion:* `set_personality(entity_id, {voice: "slow drawl, formal
register"})` stores fields at the roster level; `entity://<id>/personality` returns
them; Novel-level override replaces roster baseline for that Novel only.
_Check:_ T58, T65, T140.

**REQ-126 — Voice examples rendering.** When an entity speaks in-character — whether a
player entity or an NPC with set personality fields — the entity's voice_examples must
be rendered in the prompt context alongside its personality trait fields. Voice examples
must precede trait descriptions in the prompt ordering, reflecting the show-don't-tell
principle: dialogue patterns give the model concrete behavior to imitate, while trait
descriptions provide abstract reasoning cues. Voice examples are inert data — they never
influence mechanical resolution or dice outcomes. The rendering contract applies to all
prompts and resources that surface entity personality: `badge_briefing`,
`entity://<id>/personality`, `npc://<id>/personality`, and the `character_sheet` tool.
Voice examples sourced from enrichment are tagged `[supplementary]` alongside their
source URL and are rendered after player-authored examples when both exist.
*Acceptance criterion:* When `badge_briefing` renders an entity with voice_examples
set, the dialogue snippets appear before the trait descriptions.
_Check:_ T140.

**REQ-282 — NPC voice directive.** WHEN `badge_briefing` renders the entity personality
group (REQ-109), every NPC whose `location` field matches the current scene location AND
whose `voice_examples` array is non-empty SHALL include a compact voice directive
block. The directive SHALL contain: (a) the NPC name and role; (b) the `voice` field
value (REQ-077); (c) up to 2 voice_example snippets (the first two examples from the
array); (d) a synthesized "Avoid:" line derived from the voice field — counsel on what
the NPC should NOT sound like. The directive block SHALL be badge-filtered per REQ-032:
GM sees all NPC voice directives; Player badge sees directives for NPCs created with
`shared` scope.

The voice directive is rendered inline in the entity personality group, after personality
fields and before any enrichment-sourced content. It is advisory — it provides the AI GM
with voice constraints but does not mechanically enforce them. `voice_examples` stored
in the roster (entity-level) follow the same directive rendering in the entity personality
group but use the entity's own voice_examples, not NPC-role synthesis.

Format: `Voice directive (<NPC name>, <role>): <voice>. Example: "<snippet 1>"
Example: "<snippet 2>" Avoid: <voice mismatch counsel>.`

WHEN `badge_briefing` renders voice_examples for entities or NPCs, only examples whose
`tag` field matches at least one active `scene_type` (REQ-087) SHALL be surfaced.
Examples with no `tag` or `tag: "neutral"` SHALL always surface. Entity-level
voice_examples in the entity personality group follow the same filtering rule.

*Acceptance criterion:* Create an NPC with `voice: "gruff, uses 'oi'"`, `voice_examples`
containing two dialogue snippets, and `location` matching the current scene. Assert
`badge_briefing` under the GM badge includes a voice directive block for the NPC.
Set scene to a different location — assert the NPC voice directive is absent.
_Check:_ T-new-283.

**REQ-127 — Ruleset-native personality mapping.** During discovery (§6.3), the builder
must identify ruleset-native personality constructs — character traits, motivations,
beliefs, flaws, bonds, or equivalent mechanics defined in the ruleset's characterization
or player-facing sections. If the ruleset defines such constructs with distinct names and
semantics, the builder must map each construct to the closest Holonovel personality field
and record the mapping in RULESET_MODEL.md. When native constructs exist, the
`set_personality` tool description and the `session_zero` prompt (REQ-078) must reference
those constructs by their ruleset names. For example, a ruleset that defines "Traits,"
"Ideals," "Bonds," and "Flaws" would see those terms in tool descriptions alongside the
Holonovel field names. The mapping is advisory — it does not constrain which fields a
player sets, only how the surface is presented. If the ruleset defines no native
personality constructs, the builder records this finding and uses only the Holonovel
field names.
*Acceptance criterion:* Building for D&D 5e produces RULESET_MODEL.md mapping
Traits/Ideals/Bonds/Flaws to Holonovel fields; `set_personality` tool description
includes "Traits," "Ideals," etc.
_Check:_ T141.

**REQ-165 — Entity ownership for personality gating.** For the purpose of
`set_personality` badge gating (REQ-077), an entity is "owned" by the Player badge
when that entity was created by the current connection under the Player badge.
When no Novel is active, or when the server restarts, ownership of all existing
entities resets to unowned — a Player may set personality fields on any entity
until a badge is activated. Once the Game Master badge sets personality fields on
an entity, the Player badge retains write access to that entity's personality
fields (ownership is not exclusive). This definition exists solely to resolve
the "Player-only for own entities" contract in REQ-077 — it does not affect
tool access, resource filtering, or any other subsystem.
*Acceptance criterion:* A Player creates an entity (`create_character` under
Player badge) and successfully calls `set_personality` on it. The same Player
attempts `set_personality` on an entity created by the GM — the call SHALL
succeed (ownership is non-exclusive per the body). A Player who has never
created any entity can still call `set_personality` on entities imported by
the GM (no ownership check blocks the Player).
_Check:_ T200.

**REQ-166 — Personality briefing rendering.** When `badge_briefing` renders the
entity personality group (REQ-109), each entity with populated personality
fields or voice_examples SHALL be rendered as a block containing: the entity
name, each populated personality field on its own line (`description`, `voice`,
`background`, `goals`), and voice_examples following REQ-126 ordering
(dialogue snippets before trait descriptions). Empty personality fields SHALL
be omitted — no placeholder lines for unset fields. Entities with no
personality fields and no voice_examples SHALL be omitted from the personality
group entirely. When the active Novel contains no entities with personality
data, the group SHALL render the empty-state marker per REQ-109. NPCs with
narrative fields per REQ-122 SHALL be rendered in the same block,
distinguished by an NPC marker. Enrichment-sourced voice_examples carry
`[supplementary]` tag per REQ-159.
*Acceptance criterion:* `badge_briefing` with an entity carrying `voice: "gruff"`
and `goals: "find the relic"` renders both fields under the entity's name;
`description` and `background` are absent when unset. An entity with no
personality data is absent from the personality group. NPC personality
renders alongside entity personality with an NPC marker.
_Check:_ T201.

**REQ-167 — Personality resource URIs.** The server SHALL register
`entity://<id>/personality` for each active entity in the current Novel and
`npc://<id>/personality` for each active NPC. Both resources SHALL return a
structured object containing: `entity_id` (or `npc_id`), `name`, and the
populated personality fields (`description`, `voice`, `background`, `goals`)
plus `voice_examples` as an ordered array per REQ-126 (dialogue snippets before
trait descriptions). Unpopulated fields SHALL be absent from the response.
Enrichment-sourced voice_examples SHALL carry `source: "enrichment"` and a
`source_url` field. Badge filtering: Player badge sees personality fields for all
entities, and NPC personality fields for NPCs visible in `badge_briefing` per
REQ-032.
*Acceptance criterion:* `entity://<id>/personality` returns populated fields
only; unset fields are absent; `npc://<id>/personality` follows same contract.
_Check:_ T58 (extend), T65 (extend), T129 (extend).

**REQ-069 — Player feedback signal.** The server provides a `player_signal(signal, value)` tool —
Player-only. Records a structured preference signal: `pace` (slower/faster), `difficulty`
(easier/harder), `tone` (lighter/darker/grittier), `focus`
(more-action/more-exploration/more-dialogue), or `boundary` (avoid a topic string). The
signal is recorded in the audit log. Each signal entry carries a `last_updated` timestamp.
When a signal type is sent more than once, the most recent value
replaces the prior one and the timestamp refreshes. Sending an empty `value` removes the signal for that type.
Player signals persist for the life of the Novel. Purely inert data — the server
does not enforce preferences; the LLM reads them and adjusts narration.
Adversarial free-text in `value` is stored verbatim as inert data
(REQ-054). The stored signal entry is a compound structure: a `value` field (the
free-text string, empty for removed signals) and a `connection_counter`
field (the Novel's connection counter at set-time per REQ-173). The
builder determines the internal representation; the contract is that
both fields survive Novel persistence and restart. The audit log entry
for a `player_signal` call SHALL follow the REQ-040 schema with
`tool: "player_signal"`, `args: {signal, value}`, and
`output_prefix: "Signal '<signal>' recorded."` (or "removed" for
empty-value removal).
*Acceptance criterion:* `player_signal("tone", "darker")` records in audit log;
sending `player_signal("tone", "lighter")` replaces the value; sending
`player_signal("tone", "")` removes it.
_Check:_ T8, T26, T142, T211.

**REQ-128 — Signal briefing surface.** `badge_briefing` (GM only, REQ-109) includes a
dedicated player-signals section. For each recorded signal, the section lists the signal
type, value, and age — computed as the difference between the Novel's current
connection counter and the counter stored with the signal (REQ-173),
expressed as "set N connections ago." When no signals are recorded, the section
carries an empty-state marker signaling that no preferences have been set. Player
signals are on the decision-critical side of the briefing section boundary (REQ-109).
The section is never truncated (REQ-118).
*Acceptance criterion:* `badge_briefing` in GM badge includes a player-signals
section listing each signal type, value, and age delta; an empty-signal Novel
shows the empty-state marker.
_Check:_ T142.

**REQ-255 — Boundary signal propagation.** Active boundary signals set via
`player_signal("boundary", value)` (REQ-069) SHALL be surfaced in `badge_briefing` as a
dedicated advisory section titled "Boundaries," visible only to the Game Master and
positioned before the scene state group (REQ-109). The section SHALL list each active
boundary value with an explicit directive: "Do not narrate, imply, or introduce content
that evokes these topics." Boundary removal (empty value per REQ-069) removes the entry.
The boundary advisory is never truncated by the briefing size budget (REQ-135, tier 1).

When `set_scene_state`, `create_npc`, `update_npc`, `set_lore_entry`, `update_lore_entry`,
or `set_narrative_directive` receive free-text input containing a substring that matches an
active boundary value (case-insensitive), the server SHALL return `[WARNING]` identifying
the matched boundary and the colliding input segment without suppressing the operation —
the collision check is advisory because free-text narrative input may coincidentally
contain boundary strings without evoking the prohibited topic. The `generate_adventure`
and `generate_encounter` tools are covered separately by REQ-251, whose participant-consent
criterion includes boundary-relevant content.
*Acceptance criterion:* `player_signal("boundary", "spiders")` sets a boundary;
`badge_briefing` under GM badge includes a Boundaries section listing "spiders" with the avoid
directive; `set_scene_state("a cavern full of spiders")` returns `[WARNING]` identifying
the "spiders" boundary collision. Removing the boundary removes the section. Player badge
does not see the Boundaries section in badge_briefing.
_Check:_ T-new-255.

**REQ-173 — Connection counter.** Each Novel tracks a `connection_counter`
that increments on every server start or MCP transport connect for that
Novel — not on individual tool invocations. When the server restarts or a
new MCP session begins, the counter advances by one before any tool is
serviced. The counter persists with the Novel and is included in
`novel://current` metadata. A `player_signal` call records the current
connection counter alongside the signal value, replacing the prior
counter when the signal type is overwritten. The age displayed in
`badge_briefing` per REQ-128 is `current_connection_counter - stored_counter`,
expressed as "set N connections ago" (or "set this connection" when zero).
When no connection counter is stored (pre-existing Novel from a build
that predates this REQ), the age SHALL display "unknown" instead of an
incorrect integer. The builder SHALL record the counter storage format
in DECISIONS.md.
*Acceptance criterion:* Set a signal, restart server, invoke
`badge_briefing` as GM — assert the signal shows "set 1 connection ago."
Set another signal, restart, invoke briefing — assert the first shows
"set 2 connections ago" and the second shows "set 1 connection ago."
Remove and re-set a signal in the same connection — assert it shows
"set this connection."
_Check:_ T211.

**REQ-129 — Property group cardinality.** Every Novel-scoped property
group has an enforced maximum item count. Exceeding the maximum on a create
or set operation SHALL return `[ERROR] [STATE_CONFLICT]` with the affected
group named and the current and maximum counts reported. Maximums and their
configuration sources are: NPCs — `TTRPG_MAX_NPCS` (also used
by REQ-097 for health warnings; this REQ adds enforcement at the same
threshold); Lore entries — `TTRPG_MAX_LORE_ENTRIES` (also
used by REQ-097; the lore token budget per REQ-083 is an independent
constraint); Countdowns — `TTRPG_MAX_COUNTDOWNS`; Entities per Novel —
`TTRPG_MAX_ENTITIES`, exceeding on `import_character` or `create_character`
SHALL return `[ERROR] [STATE_CONFLICT]` with counts reported; Roster entities —
`TTRPG_MAX_ROSTER_ENTITIES`, exceeding on `create_character` SHALL return
`[ERROR] [STATE_CONFLICT]` before any state mutation; Enrichment
items per output module — `TTRPG_MAX_ENRICHMENT_ITEMS`;
Story journal entries — `TTRPG_MAX_STORY_ENTRIES`, exceeding
on `record_story` SHALL return `[ERROR] [STATE_CONFLICT]`.
Scene history entries are capped per REQ-076. Setting a maximum to zero
SHALL disable that group's mutating tools — create, set, and update
operations return `[STATE_CONFLICT]`. `spec_health` SHALL report the
current count and maximum for every group, with an `overflow` flag when at
maximum. A warning fires in `spec_health` when entity count exceeds 80% of the
entity maximum; the `healthy` flag is set to false when at maximum. The builder records
the configured maximums in DECISIONS.md (4).
*Acceptance criterion:* Creating the 501st NPC returns `[STATE_CONFLICT]`
with the group named; setting `TTRPG_MAX_NPCS=0` causes `create_npc` to
fail; `TTRPG_MAX_ENTITIES=0` causes `import_character` to fail; `spec_health` reports
per-group counts and overflow status including entity and roster groups.
_Check:_ T143, T218.

**REQ-079 — Adventure modules.** The server loads Markdown adventure modules
during the Build workflow alongside the ruleset. Every adventure module SHALL
be parsed for world-model declarative assertions (rooms, things, exits,
properties) within a designated `## World` section. Assertions found in the
section SHALL be extracted and indexed. `load_adventure(adventure, target?)` SHALL —
when the adventure module contains a `## World` section — populate the
Novel's world-model tier with the extracted rooms, things, exits, and
properties, then link any TTRPG annotations (`@encounter`, `@trap`, `@npc`,
`@lore`) to world-model objects by name. Adventure modules without a `## World`
 section SHALL load as flat indexed content — their prose is searchable via
`search_rules` and surfaced in `badge_briefing`, but no world-model objects
are created.

When the adventure module has undergone structural extraction (REQ-247),
`load_adventure` SHALL additionally pre-populate Novel state from the
extracted content: extracted NPCs SHALL become Novel-scoped NPC entities
created silently (GM-modifiable via `update_npc`), extracted location
descriptions SHALL become lore entries keyed by heading name, extracted
faction references SHALL become faction entities with starting clocks, and
the extracted premise SHALL become the adventure hook surfaced in
`badge_briefing`. The load response SHALL include a summary of pre-populated
items with counts. Items whose name duplicates existing Novel state are
skipped with a note. NPCs carrying only a name and no parseable stats are
created as skeletal entities — they participate in combat with `[AUTO]`
turns per REQ-043, using the description field for narration, and the GM
is expected to fill in stats via `update_npc` before mechanical combat
participation is needed. When a pre-populated NPC's name fuzzy-matches a
ruleset monster entry (per `lookup_monster`), the load response SHALL
include a suggestion: "NPC '<name>' may match ruleset entry '<match>'.
Confirm to populate stats."

After loading, the adventure's prose content SHALL be accessible at
`adventure://<adventure-slug>/<anchor>`. `search_rules` includes adventure
content; active-adventure results are sorted first. Active-adventure results
SHALL carry HIGH match confidence when the query token appears in a section
heading; MEDIUM when it appears in body text. The `[generated]` tag (REQ-132)
SHALL NOT affect sort order — generated and indexed results sort by match
strength identically; the tag is a source-of-origin marker only.

`badge_briefing` includes the active adventure's hook, current location,
and — when a world model is populated — the current room's name and visible
contents.

Adventure content is badge-filtered: sections marked with the ruleset's
adjudicator term (e.g., `*Keeper only*`) are hidden from the Player badge.
Unmarked sections are visible to all. Multiple adventures may be indexed;
only the active adventure's content is surfaced in `badge_briefing`. Adventure
NPCs defined via `@npc` annotations are Novel-scoped entities created at
load time; the GM may modify them via `update_npc`. `load_adventure` is Game
Master only. `load_adventure` with a slug not matching any indexed adventure
SHALL return `[NOT_FOUND]` and enumerate available adventure slugs. The
`TTRPG_ADVENTURE` env var (optional, comma-separated paths) pre-loads
adventures at startup.

The optional `target` parameter accepts `novel` (default when a Novel is active) or
`codex` (default when no Novel is active). `target: "codex"` SHALL process the adventure
module's structural extraction (REQ-247) and store the resulting scaffold as a Codex entry
of kind `adventure` with `source: loaded:<slug>` — world-model assertions, extracted NPCs,
factions, lore entries, and the premise are stored in the adventure data payload per
REQ-321 without populating Novel state. `target: "novel"` SHALL load into the active Novel
with all existing pre-population behavior (world-model tier population, NPC creation,
faction creation, lore entry creation). When no Novel is active and `target` is omitted,
`target` defaults to `codex`. `load_adventure` SHALL be callable regardless of Novel
state — no Novel is required for `target: "codex"`.

State isolation: world-model objects, NPCs, and lore created by adventure
loading are Novel entities — discarded by `end_novel`. Switching adventures
replaces the active adventure's world model (if present) and prose content
but retains Novel entities created outside adventure loading.
Adventure module content loaded into a Novel SHALL be included in
`export_novel` (REQ-096): when `TTRPG_EXPORT_EMBED_ADVENTURES` is `true`,
the module's prose content and world-model assertions are embedded inline;
when `false`, module slugs are recorded in the export manifest for
reconstitution at import time.
*Acceptance criterion:* `load_adventure("tomb-of-the-serpent-king")`
activates the adventure, populates the world-model tier with rooms/things/
exits from the `## World` section, links `@npc` annotations, and surfaces
the adventure hook and current room in `badge_briefing`; a module without a
`## World` section loads as flat indexed content. `load_adventure("tomb-of-the-serpent-king",
target="codex")` with no Novel active stores the adventure scaffold in Codex;
`codex_list("adventure")` returns the entry with `source: loaded:tomb-of-the-serpent-king`;
server restart preserves it.
_Check:_ T59, T60, T61, T-new-324.

**REQ-292 — Adventure catalog.** THE server SHALL provide a `list_adventures(filter?)` tool
(always callable) returning metadata for every adventure module present in `TTRPG_ADVENTURE`.
Each entry SHALL include: `slug`, `title`, `preview` (2–3 sentence GM-facing premise),
`genre_tags`, `room_count`, `npc_count`, `complexity` (estimated: `short`, `standard`,
`epic` based on room count thresholds), and `last_modified`. An optional `filter` parameter
accepts a genre tag string and returns only matching adventures.

When `TTRPG_ADVENTURE` contains no adventure modules, `list_adventures` SHALL return an
empty-state message: "[No adventure modules found.]" The catalog is badge-filtered: Player
badge sees adventures with a `player_visible` flag or `shared` adventure hooks; GM badge sees
all. `spec_health` SHALL report `adventure_catalog_count`. `list_adventures` has no
briefing presence per §5.10.

`help("list_adventures")` SHALL return usage examples and parameter contracts.

*Acceptance criterion:* With 2 adventure modules, `list_adventures()` returns 2 entries
with slug, title, preview, genre_tags, room_count, npc_count, complexity, and
last_modified. Empty directory returns the empty-state message.
_Check:_ T-new-292.

Adventure modules MAY contain narrative sections in addition to or instead of the
`## World` spatial section: `## Premise` — one-paragraph hook introducing the
adventure; `## Factions` — named organizations with goals, resources, and starting
clocks (per REQ-233); `## Scenes` — ordered or branching scene descriptions with
embedded choice prompts; `## NPCs` — named characters with personality fields and
voice examples; `## Lore` — worldbuilding keywords with triggers; `## Seeds` —
GM-facing prompts and improvisation hooks. An adventure with no `## World` section
is a narrative-only adventure — it populates Novel state (factions, lore, NPCs,
and scene history seeds) without creating spatial rooms. `load_adventure` processes
all present sections regardless of spatial content.

**REQ-229 — Adventure enrichment linkage.** After `load_adventure` processes
`@npc`, `@encounter`, and `@lore` annotations, the server SHALL scan both
enrichment tiers (ruleset-native and community) for matches against the newly
loaded adventure content: voice examples matched to NPC creature types via the
ruleset index, lore templates matched to `@lore` annotation keywords, action
patterns matched to encounter types, adventure advice matched to adventure
themes. For non-Appendix-K adventures, matches SHALL be derived
from structural extraction content (REQ-247): voice examples matched to
extracted NPC names via the ruleset index, lore templates matched to
extracted location keywords, action patterns matched to extracted encounter
descriptions. Ruleset-native enrichment items SHALL be automatically
activated for the GM — items are active in `badge_briefing`, enrichment
resources, and suggestion surfaces immediately after `load_adventure`
completes. Community enrichment items SHALL remain inert per REQ-080, with
a prompt in the load response offering activation: "Community enrichment
X items found. Review at `enrichment://status` and activate individually."
Matches are surfaced in the `load_adventure` augmentation section:
"Enrichment found X voice examples for adventure NPCs, Y lore templates for
adventure locations. Review at `enrichment://status`." The augmentation
section SHALL appear after the world-model population confirmation. When no
matches are found, the augmentation section is omitted. When enrichment has not
been run (community tier empty) and ruleset-native enrichment provides no
matches, the section is omitted with no error.
*Acceptance criterion:* Loading an adventure with `@npc(goblin)` and enrichment
voice_examples containing "goblin" entries produces an augmentation section with
match count and `enrichment://status` pointer. Loading an adventure with no
matching enrichment items omits the augmentation section.
_Check:_ T-new-229.

**REQ-170 — Adventure discovery surface.** `spec_health` SHALL report the set of
indexed adventure slugs and their build-time content hashes. A resource at
`adventures://` SHALL list all indexed adventure slugs with their titles and
badge-filtered hooks. Both surfaces respect badge gating: GM-only content is hidden
from the Player badge.
*Acceptance criterion:* `spec_health` includes an `indexed_adventures` field
listing slugs and content hashes; `resources/read` on `adventures://` returns the
complete list; Player badge sees only Player-visible adventure hooks.
_Check:_ T207.

**REQ-171 — Adventure content validation.** During discovery (§6.3), the
builder SHALL validate that every adventure module conforms to Appendix K
conventions: an H1 title (used as slug), an `## Overview` heading, an
`## Adventure Hook` heading, and consistent use of the ruleset's adjudicator
marker for GM-only sections. Adventures that fail validation SHALL be reported at
build time with a `[malformed_adventure]` entry in `spec_health` listing the
adventure slug, the failing convention, and whether the adventure was skipped or
partially indexed. Partially indexed adventures serve only the conforming
sections; skipped adventures are absent from all surfaces.
*Acceptance criterion:* Build with a malformed adventure (missing Overview
heading) — assert `spec_health` reports `[malformed_adventure]` with the slug
and failure reason; assert conforming sections of partially indexed adventures
are retrievable at `adventure://<slug>/<anchor>`.
_Check:_ T208.

**REQ-172 — Adventure content drift detection.** The server SHALL record a
content hash for every indexed adventure module at build time. On startup, the
server SHALL compare each adventure's stored hash against the current file on
disk. A mismatch SHALL emit a warning on stderr and surface a
`[adventure_drift]` entry in `spec_health` listing the affected slug and the
detection timestamp. Drift detection SHALL NOT block startup or degrade
service — it is a diagnostic surface, not a safety interlock.
*Acceptance criterion:* Modify an indexed adventure file after build, restart —
assert `spec_health` reports `[adventure_drift]` for the modified slug with the
detection timestamp; assert stderr carries a matching warning.
_Check:_ T209.

**REQ-247 — Adventure structure extraction.** During Discovery (§6.3), the
builder SHALL extract structural content from every adventure module using
discoverable patterns — no Appendix K formatting is required. The builder
SHALL apply three heuristics in order: (a) heading extraction — every `##`
or `###` heading in the adventure file becomes a structural table-of-contents
entry; headings that are purely numeric or exceed 50 characters without
whitespace are excluded (garbled OCR text); confidence HIGH; (b) NPC
extraction — a bolded name followed within 3 lines by a numeric stat value,
a role noun, or a page reference is an NPC reference; stat values that parse
as numbers populate the NPC's fields; non-parsing values are recorded in a
`notes` narrative field; confidence LOW; (c) location and faction extraction
— a heading whose text contains no rule/action keywords (roll, check, save,
attack, damage) and has at least 100 words of prose below it is a
scene/location description; a heading within 80 words of a goal- or
resource-describing sentence and containing an organization term (Guild,
Fleet, Council, Company, Syndicate) is a faction reference; confidence
MEDIUM. Garbled text matching no pattern is discarded silently — the
contract guarantees extraction is attempted, not that it yields results.
Output is recorded in the build's adventure index. The step is skipped when
no adventure files are present.
*Acceptance criterion:* Build with a non-Appendix-K adventure — assert
structural index produced with scene headings, NPC references, and location
entries; a module with no discoverable structure produces an empty index
without error.
_Check:_ T283.

**REQ-248 — Adventure overview resource.** The server SHALL provide a
resource at `adventure://<slug>/overview` summarizing the adventure's
contents: the premise (one paragraph introducing the adventure), key NPCs
(name and one-line role), major locations (name and one-line description),
factions in conflict, and the scene count from the structural index.
Content is drawn from the structural extraction (REQ-247) and populated
when `load_adventure` is called. The resource SHALL be badge-filtered: the
Player badge sees only the premise and shared content; the Game Master badge
sees the full overview including GM-only sections. When the adventure has
no structural index (empty extraction), the resource SHALL return
`[WARNING]` with "No structured overview available" and the raw adventure
slug.
*Acceptance criterion:* `adventure://<slug>/overview` returns premise,
NPC list with roles, location list, faction descriptions, and scene count,
badge-filtered per section markers.
_Check:_ T285.

**REQ-249 — Adventure navigation resource.** The server SHALL provide a
resource at `adventure://<slug>/navigation` rendering the adventure's
structural index (REQ-247) as navigable Markdown: all scenes in order
with heading anchors, the current scene waypoint (REQ-250) marked with
`[→]`, adjacent scenes indicated as previous and next. The resource is
on-demand — it SHALL NOT be included in `badge_briefing`. The resource SHALL
be badge-filtered: GM-only sections are hidden from the Player badge; the Player
sees only the scene list without GM annotations. When no adventure is loaded,
the resource SHALL return `[ERROR] [STATE_CONFLICT]` directing the caller to
load an adventure first. When the adventure has no structural index, the
resource SHALL return `[WARNING]` with "No navigation index available."
*Acceptance criterion:* `adventure://<slug>/navigation` returns scene list
with current waypoint marked; adjacent scenes indicated; badge-filtered per
section markers; unavailable when no adventure is loaded.
_Check:_ T286.

**REQ-250 — Adventure scene waypoint.** The `set_scene_state` tool gains
an optional `adventure_scene` field accepting a heading anchor from the
adventure's structural index (REQ-247). When set: `badge_briefing` SHALL
surface the adventure scene's description as a distinct labeled block
alongside the current scene state — "Adventure Scene (<slug> § <heading>):
<prose>"; `badge_briefing` SHALL list adjacent scenes (previous and next in
the structural index) as nearby; the GM's free-text `description` parameter
remains independent — the two SHALL NOT overwrite each other. The waypoint
persists with the Novel. Setting `adventure_scene` to a heading not in the
index returns `[NOT_FOUND]` with nearby scene names enumerated. Setting it
to an empty string or null clears the waypoint. Changing the waypoint fires
a scene transition hook (REQ-125). The field is Game Master only; the Player
hat reads it passively via `badge_briefing`. When `adventure_scene` is set and
the adventure contains GM-only sections, the scene description SHALL be
rendered regardless of badge — but the full scene prose (at the adventure
resource) is badge-filtered per adventure section markers.
*Acceptance criterion:* Set `adventure_scene` to a heading anchor — assert
description in `badge_briefing` labeled with adventure slug and scene heading;
adjacent scenes listed; transition hook fires; `[NOT_FOUND]` for unknown
anchors; Player pass-through in briefing.
_Check:_ T284.

**REQ-132 — Adventure generation lifecycle.** Adventure content produced by
`generate_adventure(premise)` is a transient Novel-scoped artifact, distinct
from build-time indexed adventure modules (REQ-079). Generated adventures are
not indexed at build time — they exist only within the Novel that generated
them, are discarded by `end_novel`, and are not persisted to the
`TTRPG_ADVENTURE` directory. Generated adventure content SHALL be surfaced at
`adventure://generated/<anchor>`, use the same heading, anchor, and
badge-filtering conventions as indexed adventures (Appendix K), and appear in
`badge_briefing` and `search_rules` results when the generating Novel is active.
Calling `generate_adventure` when a generated adventure already exists in the
Novel SHALL replace the prior generated content. `load_adventure` replaces the
active indexed adventure but SHALL NOT affect the generated adventure; a
generated adventure SHALL NOT replace the indexed adventure. A Novel may have
both an indexed adventure and a generated adventure active simultaneously —
`badge_briefing` SHALL surface the indexed adventure's content first, then the
generated adventure's content, and `search_rules` SHALL distinguish generated
results with a `[generated]` tag.

`generate_adventure(premise)` SHALL include a `## World` section in its
generated output when the premise suggests spatial content (locations,
dungeons, buildings). The generated world-model section SHALL contain at
minimum: one room (the starting location) with a description, and exit
connections for any additional locations named in the premise. Generated
world-model content SHALL follow the same declarative assertion conventions
as indexed adventure modules (Appendix K). When the generated adventure is
replaced or the Novel is ended, the generated world-model objects SHALL
be discarded — they are Novel-scoped per the base contract.
*Acceptance criterion:* `generate_adventure("A haunted station")` produces
adventure content at `adventure://generated/overview`; restarting the
server preserves the generated adventure; `end_novel` discards it;
a second `generate_adventure` replaces the first.
_Check:_ T146.

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

**REQ-302 — Per-section content hashing.** In addition to the ruleset-wide content hash
(REQ-044), the builder SHALL compute per-section content hashes — one hash per top-level
heading section in the ruleset Markdown source. Each section hash SHALL use SHA-256 over
the normalized section content. Per-section hashes SHALL be recorded in DECISIONS.md (4).

During Build (§6.2–§6.3) when per-section hashes from a prior build are recorded in
DECISIONS.md (4), and during spec-driven updates (§6.7), sections whose hash is
unchanged SHALL be skipped —
their prior extraction output is referenced. Sections whose hash changed SHALL be
re-extracted. The builder SHALL record a per-section delta summary: total sections,
sections unchanged, sections changed, sections added, sections removed. This SHALL NOT
override REQ-272 (stock elements catalog) — both operate independently.

*Acceptance criterion:* A ruleset with 20 top-level sections, one of which changed,
produces per-section hashes where 19 match the prior build and 1 is re-extracted.
DECISIONS.md (4) records the delta summary.
_Check:_ T-new-302.

**REQ-065 — Build fingerprint.** The server records a build fingerprint in its state
directory: the specification version, the specification content hash (from the embedded
holonovel.md, REQ-105), the ruleset content hash (REQ-044), the holonovel
version (from B10), the spec repository URL (REQ-106), and the build timestamp.
The fingerprint is persisted alongside Novel state so
it survives server restarts. On startup with existing state, the server reloads the stored
fingerprint and compares it against the freshly computed current-build fingerprint. The
comparison is field-by-field:

- **Specification version mismatch** — the current spec version differs from the stored
  version. Emits a `[spec_version_drift]` warning on stderr and in spec_health.
- **Specification content hash mismatch** — the embedded holonovel.md hash differs from
  the stored hash. Emits a `[spec_drift]` warning on stderr and in spec_health listing the
  stored and current hashes. This detects post-build modification of the embedded spec
  copy.
- **Ruleset content hash mismatch** — the current ruleset hash differs from the stored
  intake hash. Emits a `[ruleset_drift]` warning on stderr and in spec_health listing the
  stored and current hashes. This is the source immutability drift check traceable to
  REQ-014.
- **Holonovel version mismatch** — the installed holonovel package version differs from the
  build-time version recorded in the fingerprint. Emits an `[holonovel_drift]` warning on
  stderr and in spec_health listing the stored and current versions.
- **Build timestamp** — expected to differ across restarts; does not emit a warning.

Drift warnings are diagnostic surfaces, not safety interlocks — they do not block startup
or degrade service. The active build's specification version, ruleset hash, and build
timestamp always take precedence over stored values; stored values are retained for drift
comparison only. Per-session fields (the last specification review timestamp and last
Pattern Buffer execution timestamp) may be updated at runtime and preserved across restarts, but
the constructor-derived version, hash, holonovel package version, and timestamp are immutable for
the build's lifetime. The server must load existing state gracefully: fields present in state but
absent from the current entity model are preserved as inert data and cause no errors;
fields required by the current model but absent from existing state receive their
ruleset-defined defaults. Roster baselines remain immutable across rebuilds. Unrecoverable
state — state that cannot be parsed or structurally loaded — is reported to the operator
via stderr and surfaced in spec_health with the affected top-level keys or entity/NPC
identifiers named; the server must not silently discard it. The server continues to
operate with a clean state for the affected Novel — the corrupted state is not loaded; the
Novel is treated as ended (resume returns `[STATE_CONFLICT]`). Roster baselines and other
intact Novels are unaffected. A fresh start against an empty state directory is a match.
*Acceptance criterion:* After a rebuild with added entity fields, an existing Novel loads
without error. A corrupted JSON produces a stderr diagnostic naming the affected keys. A
ruleset modification after build produces a [ruleset_drift] warning in spec_health and
stderr at next startup; a spec modification produces a [spec_drift] warning; neither
blocks startup.
_Check:_ T52, T224.

*Out of scope:* relational database backends, distributed state across processes,
cloud synchronization, and state migration between incompatible specification versions
without the Update workflow (§6.7).

**REQ-313 — Server implementation fingerprinting.** The builder SHALL compute SHA-256
content hashes for five server implementation components at every build and record
them alongside the build fingerprint (REQ-065) in DECISIONS.md (1). The five
components are: server source code (all files in the server's source directory, sorted
by path and concatenated), server configuration (the build configuration files
governing compilation and dependencies), the dependency lockfile (recording the exact
dependency tree), generated extraction data (ruleset extraction output produced during
Discovery), and registered surfaces (the sorted, concatenated list of registered tool
names, resource URIs, and prompt names). When generated extraction data is absent
(ruleset-free builds or servers without extraction), the generated-data component
records a sentinel indicating no extraction was performed. Each component hash SHALL
be updated on every build and every spec-driven update (§6.7). The builder SHALL NOT
use these hashes to gate startup — they exist for scoping subsequent builds and
updates (REQ-314).
*Acceptance criterion:* A build records five component hashes in DECISIONS.md (1)
alongside the build fingerprint; a subsequent build with unchanged source code
produces an identical source code hash. A ruleset-free build records the sentinel
for generated extraction data.
_Check:_ T-new-313.

**REQ-314 — Fingerprint-driven partial rebuild.** During Build (§6.2–§6.6) or
spec-driven updates (§6.7), the builder SHALL compare the current implementation
fingerprints (REQ-313) against the stored fingerprints from the prior build. When
one or more components changed but others are unchanged, the builder SHALL scope
the rebuild to only the changed components and their dependents, reusing prior
output for unchanged components. The scoping rules are:

- **Source code changed** (configuration and dependencies unchanged) → typecheck
  the server, then run only the Pattern Buffer sub-workflows whose surface-to-scenario
  mapping (§6.6) covers the surfaces implemented by the changed source files.
- **Configuration or dependencies changed** (source unchanged) → reinstall
  dependencies and typecheck; no Pattern Buffer re-run required.
- **Generated extraction data changed** (ruleset content hash REQ-044 unchanged) →
  re-index generation data only, reusing prior extraction output for unchanged
  ruleset sections per REQ-302.
- **Registered surfaces changed** → run Pattern Buffer sub-workflows per the
  surface-to-scenario mapping (§6.6) for the changed tools, resources, or prompts.
- **Specification content hash changed** (REQ-187) → gap audit per REQ-098, then
  implement only changed surfaces; unchanged components reuse prior verification.

Cold checkout (no stored fingerprints) and builds where more than half the
fingerprint components changed SHALL run the full Build workflow (§6.2–§6.6).
The builder SHALL record a fingerprint delta summary in DECISIONS.md (1): which
components changed, which remained unchanged, the scoping decision, and which
prior outputs were reused.
*Acceptance criterion:* A build where only the source code changed reuses the stored
generated-data hash, skips extraction, and runs only surface-dependent Pattern Buffer
sub-workflows. A cold checkout with no stored fingerprints runs the full Build
workflow without scoping. When four of five components changed, the full Build
workflow runs regardless of individual scoping rules.
_Check:_ T-new-314.

**REQ-232 — Pause/resume context.** The Novel SHALL persist a `dm_context` object
alongside other Novel state. Fields: `current_scene` (narrative summary of the active
scene), `immediate_situation` (what is happening right now), `pending_player_action`
(what the player was about to decide), `short_term_plans` (GM's next move),
`long_term_plans` (GM's arc-level direction), `active_threads` (array of {name,
status, urgency, description}), `npc_attitudes` (object mapping NPC ids to their
current disposition strings), `player_goals` (what the player seems focused on), and
`saved_at` (ISO 8601 timestamp of last save). All fields are optional; a call supplies
only the fields the GM wants to update. `save_pause_context(fields...)` — Game Master
only — merges provided fields into the existing `dm_context`. `get_resume_context()`
returns a complete briefing for session resumption: `dm_context` content plus a
Novel state summary plus the `badge_briefing` prompt. When `resume_novel` is called,
the `intro` prompt SHALL include the `dm_context` summary. `end_novel` clears
`dm_context`. `save_pause_context` SHALL automatically capture current faction clock
states (REQ-233), active countdown positions (REQ-073), NPC dispositions, entity
relationships (REQ-236), the last 3 story journal entries of type `decision` or
`bond` (REQ-246), and active vow state — milestone counts and difficulty ranks
(REQ-289) — the GM is not required to re-enter these manually. The story journal
and vow captures SHALL be stored as `story_context` (array of entry summaries,
1–2 sentences each) and `active_vows` (array of vow summaries: name, difficulty,
milestone count). These fields are surfaced by `get_resume_context` and included
in the `intro` prompt's DM context summary.
*Acceptance criterion:* `save_pause_context(current_scene="The tavern brawl",
short_term_plans="Guards arrive in 2 rounds")` followed by `get_resume_context()`
returns both fields; `resume_novel` includes the context in `intro`.
_Check:_ T268.

**REQ-233 — Factions.** The Game Master may manage named organizations (factions)
with goals, resources, and a progress clock. `create_faction(name, description,
goals?, resources?)` creates a faction. `update_faction(faction_id, fields...)`
mutates existing fields. `remove_faction(faction_id)` removes a faction and its
clock. Factions persist with the Novel. Resources: `faction://<id>` and
`factions://` — GM-filtered. Faction clocks update faction progress and are
surfaced in `badge_briefing`. When a faction clock fills, the faction's status updates
to the next goal and a new clock begins — surfaced as a `[WARNING]` in `spec_health`.
Factions appear in `dm_context.active_threads` (REQ-232). Faction clocks SHALL
advance by one tick at scene transitions (REQ-125).
*Coupling:* `create_faction` SHALL auto-create a `faction`-type countdown (REQ-073)
for the faction's primary goal. `advance_countdown` on a faction-named clock SHALL
update the faction's clock display. When a relationship is set between a faction and
an entity (REQ-236), the faction name SHALL be accepted as valid for either
direction.
*Acceptance criterion:* `create_faction("Merchant Guild", "Controls trade routes",
goals=["Expand to East Dock"])` creates a faction with a `faction`-type clock;
`faction://<id>` returns the faction with its current clock position.
_Check:_ T269.

**REQ-233a — World reactivity.** WHEN scene_transition (REQ-125) fires, THE engine SHALL
autonomously advance the world state beyond faction clocks:

- **NPC goal pursuit.** FOR each NPC with `goals` (REQ-077) whose last-known location
  differs from a goal-relevant entity's current scene, THE engine SHALL check whether
  the NPC made progress toward their goal between scenes. A success SHALL produce a
  campaign memory fact (REQ-310) describing the advancement: the NPC acted on their
  goal. A failure SHALL produce a fact noting the NPC's stalled pursuit. WHEN an NPC
  has `goals` and no existing countdown whose name starts with `npc_goal:<npc_name>`,
  THE `## World in Motion` section SHALL include a countdown creation suggestion:
  "NPC `<npc_name>` is pursuing `<goal>`. Create a tracking countdown?" The GM may
  accept, modify, or defer per the World in Motion acceptance model. An accepted
  countdown SHALL be created as `danger`-type, sized by goal scope: 3 ticks (minor),
  6 ticks (significant), 10 ticks (campaign).

- **Consequence propagation.** WHEN a player action triggers a state change in a
  connected entity — a relationship type change (REQ-236), a secret revelation
  (REQ-234), or a faction clock filling (REQ-233) — THE engine SHALL trace ripple
  effects through directly connected entities. An entity with an `ally` relationship
  to the affected entity SHALL receive a campaign memory fact noting the ally's state
  change. An entity with a `rival` relationship SHALL receive a fact noting the rival's
  change as an opportunity. Propagation extends one hop from the affected entity.

- **GM approval surface.** The GM SHALL see a `## World in Motion` section in
  `badge_briefing` — a decision-critical group ordered after Narrative Threads
  (REQ-281) — listing pending world changes produced by this cycle. Each entry
  carries: the source (NPC goal / faction / consequence), a one-sentence summary of
  the proposed change, and an accept/modify/defer label. Accept applies the change
  to canonical state. Modify raises a `[NEED_INPUT]` workflow (REQ-042) for the GM
  to edit the change. Defer suppresses the change — it does not produce a campaign
  memory fact and will be re-evaluated at the next scene transition. Deferred
  changes SHALL accumulate no more than 3 deferrals; on the fourth, the engine SHALL
  escalate to a `[WARNING]` in `spec_health`.

A setting `TTRPG_WORLD_REACTIVITY` (defaults to active) controls whether the reactivity
cycle runs. When `off`, scene transitions advance faction clocks only (current
behavior).

*Acceptance criterion:* With `TTRPG_WORLD_REACTIVITY=on`, an NPC with
`goals="Steal the crown"` produces a World in Motion entry at scene transition
showing goal pursuit progress. A relationship change on entity A (`ally` → `rival`
with entity B) produces a campaign memory fact on entity B. The GM accepts a
proposed change — it appears in campaign memory. The GM defers a change — it
re-appears at the next scene transition.
_Check:_ T-new-314.

**REQ-236 — Entity relationships.** The Game Master may set directed relationships
between entities, NPCs, and factions. `set_relationship(entity_a, entity_b, type,
value?, description?)` sets a directed relationship. Relationship types: `ally`,
`rival`, `neutral`, `mentor`, `dependent`, `suspicious`. `get_relationships(entity_id)`
returns all relationships for an entity (both outgoing and incoming). Relationships
SHALL appear on `character_sheet` output in a "Relationships" section. When an
entity's relationship type changes between `ally` and `rival` (in either direction),
the GM SHALL be prompted via `badge_briefing` to consider a lore entry.

WHEN `set_relationship` changes a relationship type between non-neutral categories
(`ally` ↔ `rival`, `ally` ↔ `suspicious`, `rival` ↔ `suspicious`, or any change to or
from `neutral`), THE server SHALL inject an event marker into the `narrative_threads`
section token: "Relationship changed: `<entity_a>` and `<entity_b>` are now `<type>`."
The marker persists for the duration of the current scene and is removed on the next
scene transition.

Relationships persist with the Novel and SHALL be saved as part of `save_pause_context` (REQ-232).
Faction identifiers are accepted as valid for either direction.
*Acceptance criterion:* `set_relationship("pc_1", "npc_guard", "suspicious",
value=3)` records a suspicious relationship; `get_relationships("pc_1")` includes
the entry; `character_sheet("pc_1")` shows "Relationships: Guard (suspicious)."
_Check:_ T270.

**REQ-237 — Session segmentation.** The server SHALL insert a
`[session_boundary]` audit log marker entry when a new `TTRPG_SESSION_ID`
value is detected on the first mutating tool call after a server start or
Novel resume. The marker entry carries: `session_id` (the
`TTRPG_SESSION_ID` value), `started_at` (ISO 8601 timestamp of first
mutating call), and `ended_at` (ISO 8601 timestamp of the previous session's
last mutating entry, or null for the first session). The marker is a
mutating entry for audit-chain purposes (REQ-040) but its output prefix is
the marker identifier. Markers SHALL be badge-filtered: the Player badge sees
only session boundary timespans without the `session_id`; the Game Master
sees the full marker entry. `session_recap` (REQ-072) SHALL accept an
optional `session_id` parameter — when provided, the recap is scoped to the
audit log range bounded by the matching `[session_boundary]` entry and the
next marker (or the log end for the current session). When omitted, the
recap spans the full log range (current behavior). `spec_health` (REQ-093)
SHALL report a `sessions` array in Novel metadata: per-session objects with
`session_id`, `entry_count`, `timespan_start`, `timespan_end`,
`combat_rounds`, `significant_roll_count`, and `scene_transitions` —
derived from audit log marker intervals.
*Acceptance criterion:* After two sessions with different `TTRPG_SESSION_ID`
values, the audit log contains two `[session_boundary]` entries;
`session_recap(session_id="s1")` returns only entries from session s1;
`spec_health` reports per-session metrics for both sessions.
_Check:_ T275.

**REQ-073 clock types.** `set_countdown` SHALL accept a `clock_type` parameter
selecting the clock's interaction model:

- `danger` (default) — Current behavior: fills on consequences. Full = danger triggers.
- `racing` — Two opposed clocks specified by `opposes: <name>`. First to full wins.
  Both complete simultaneously → tie. Surfaced as paired entries in `countdown://active`.
- `linked` — On completion, triggers `unlocks: <name>`. Unlocked clock starts at 0.
  Linked clock chains rendered as an indented tree in `countdown://active`.
- `tug_of_war` — Segments can be advanced AND retreated. `retreat_countdown(name, ticks?)`
  removes ticks from the clock; does not go below zero. Filling a `tug_of_war` clock
  triggers its resolution; retreating does not.
- `faction` — Background clock for factions (REQ-233). Advances one tick on each scene
  transition (REQ-125). Surfaced in the faction's resource display.
- `mission` — Window of opportunity. Auto-decrements one tick at each `resume_novel`.
  Reaching zero changes mission parameters — surfaced in `badge_briefing`.

`link_countdown(parent_name, child_name)` creates a linked relationship between two
existing clocks. The existing `type` parameter (`round`/`narrative`) controls tick
timing — `clock_type` controls the clock's interaction model. Both parameters coexist:
a clock may be `clock_type: "racing"` with `type: "round"`.
*Acceptance criterion:* A `racing` clock pair with `opposes` resolves correctly;
a `linked` clock chain triggers the child on parent completion; a `tug_of_war` clock
retreated to zero does not trigger.
_Check:_ T271.

**REQ-072 session format.** `session_recap` SHALL accept an optional `format`
parameter: `"markdown"` (default, current behavior) or `"lonelog"` — structured
in Lonelog notation: `###` scene headers, `@` entity actions, `=>` narrative
outcomes, `?` GM-decision equivalents, `d:` resolved mechanics. `compress_audit`
SHALL accept the same `format` parameter to produce compressed entries in the
requested notation. Each audit entry (REQ-040) SHALL gain an optional `notation`
field storing the Lonelog representation alongside the raw audit data.
*Acceptance criterion:* `session_recap(format="lonelog")` produces output in
Lonelog notation; `compress_audit(format="lonelog")` produces compressed
Lonelog entries; audit entries contain the `notation` field.
_Check:_ T272.

**REQ-239 — Audit log compaction.** The server SHALL provide a
`compact_audit_log(sessions?)` tool (Game Master only) that archives audit
entries older than a configurable session window into per-session metadata
summaries. The session window is configured via `TTRPG_AUDIT_RETENTION_SESSIONS`
configurable) — sessions are identified by `[session_boundary]` markers
(REQ-237). For each archived session, the compaction produces a summary
containing: `session_id`, `timespan_start`, `timespan_end`, `entry_count`,
`confrontations` (derived per REQ-175), `significant_rolls` (per REQ-174),
`condition_changes`, `roster_changes`, and `scene_transitions`. Summaries are
stored in the Novel JSON under an `audit_archive` key; raw audit entries for
archived sessions are removed from the `audit_log` array in the Novel JSON (REQ-040,
hash chain is re-anchored at the first live entry after compaction — the
chain is not broken, but entries after the compaction boundary form a new
segment. `session_recap` (REQ-072) SHALL derive from live entries plus archive
summaries when a `session_id` targets an archived session. Summarized sessions
are retrievable via `audit://novel/archive` as structured objects. Compaction
is irreversible — confirmation proceeds through a `[NEED_INPUT]` workflow.
Calling `compact_audit_log` with a `sessions` parameter (minimum 1)
sets the number of recent sessions to retain as live; when omitted, the
`TTRPG_AUDIT_RETENTION_SESSIONS` default is used. Sessions currently active
(no `ended_at` marker) SHALL NOT be compacted. Player badge attempts return
`[ERROR] [FORBIDDEN]`.
*Acceptance criterion:* With `TTRPG_AUDIT_RETENTION_SESSIONS=1`, after two
sessions, `compact_audit_log()` archives session 1 — audit log shows only
session 2 entries, `audit://novel/archive` returns session 1 summary,
`session_recap(session_id="s1")` returns the summary, session 2 entries
remain live. A third call to `compact_audit_log(sessions=2)` retains both
sessions 2 and 3.
_Check:_ T277.

**REQ-241 — Checkpoints.** The server SHALL provide checkpoint tools for the
active Novel: `set_checkpoint(label)` saves a named, persistent snapshot of
the full Novel state (all ten property groups, world-model tier, combat state,
pending workflows, dm_context, metadata, audit log pointer, and undo stacks).
`list_checkpoints()` returns all checkpoint labels with ISO 8601 timestamps.
`restore_checkpoint(label)` reverts the Novel to the checkpoint state — emits
a `[NEED_INPUT]` workflow decision with options `yes` and `cancel` (on `yes`:
restores the snapshot and records a `[checkpoint_restored]` audit entry; on
`cancel`: restores pre-invocation state unchanged). `delete_checkpoint(label)`
removes one checkpoint. Checkpoints survive server restarts, Novel switches,
and undo/redo cycles — they are independent of undo stacks (REQ-041). Maximum
checkpoints per Novel is configured via `TTRPG_MAX_CHECKPOINTS`;
when at capacity, `set_checkpoint` discards the oldest. Checkpoints
SHALL be stored in the Novel JSON under a `checkpoints` key (array of
`{label, timestamp, state}` objects). `end_novel` removes all checkpoints.
Checkpoints are NOT included in `export_novel` output by default — an
optional `include_checkpoints` parameter on `export_novel` (configurable)
controls inclusion. All checkpoint tools are Game Master only.
`spec_health` SHALL report checkpoint count and storage size. The snapshot
SHALL use the same compression setting as the Novel (REQ-092).
*Acceptance criterion:* `set_checkpoint("before the ritual")` creates a
checkpoint; `list_checkpoints()` returns one entry with label and timestamp;
after 5 mutations, `restore_checkpoint("before the ritual")` reverts all 5;
`end_novel` removes the checkpoint; `export_novel("json", include_checkpoints=
true)` includes the checkpoints key.
_Check:_ T279.

**REQ-242 — Notes.** The Novel SHALL carry a notes tier — key-value freeform text
entries each carrying a `badge_scope` of `game_master`, `player`, or `shared`. WHEN no
scope is provided, THE system SHALL default to `game_master`. `set_note(key, content,
badge_scope?)` creates or updates a note. `remove_note(key)` removes a note — the
caller's badge must own the scope, or be Game Master. `list_notes()` returns note keys,
content previews (first 100 characters), and badge_scope — badge-filtered. Notes are inert
narrative context — they do not trigger lore matching, countdown hooks, or any
mechanical effect. Notes persist with the Novel, survive `revert_enrichment`, and are
removed by `end_novel`. Notes SHALL be surfaced in `badge_briefing` under the `notes`
section token — Game Master sees all scopes; Player sees `player` and `shared` scopes
only. Notes SHALL be retrievable at `notes://<key>` as a badge-filtered resource. Notes
SHALL be included in `export_novel` output under the `notes` key (mapping keys to
`{content, badge_scope}` objects), in `clone_novel` (REQ-240) output, and in checkpoint
snapshots (REQ-241). This tier is the unstructured complement to REQ-232's structured
`dm_context` — dm_context captures session-transition state with named fields; notes
capture raw ideas, secrets-in-progress, and session jottings that do not fit
dm_context's schema. IF the Player badge calls `set_note` with scope `game_master`,
`remove_note` on a `game_master`-scoped note, or attempts to access `game_master`-scoped
content, THEN THE system SHALL return `[FORBIDDEN]`.
*Acceptance criterion:* `set_note("betrayal", "The captain is the real villain")` stores
the note with default `game_master` scope; `list_notes()` under Game Master badge returns
the note with scope `game_master`; `notes://betrayal` returns full content; the Player
badge sees no `game_master`-scoped notes in `badge_briefing`; `set_note("clue", "The key is
in the clock", "player")` is visible to both Player and GM; after `end_novel`, all
notes are cleared.
_Check:_ T280.

**REQ-285 — Server notes.** THE server SHALL carry a server-level notes store —
key-value freeform text entries that persist across Novels and survive server
restarts. `set_server_note(key, content)` creates or updates a server note.
`remove_server_note(key)` removes a server note. `list_server_notes()` returns all
server note keys and a content preview (first 100 characters). Server notes are
inert narrative context — they do not trigger any mechanical effect within
Novels. Server notes persist to `.holonovel-state/server-notes.json` with atomic
writes and backup rotation. Server notes survive `end_novel`,
`revert_enrichment`, and server rebuilds. Server notes SHALL be surfaced in
`spec_health` under a `server_notes` key (count). Server notes SHALL be
retrievable at `server-notes://<key>` as a resource. Server notes SHALL NOT
appear in `export_novel`, `clone_novel`, or checkpoint snapshots. WHEN the Player
hat calls any server note tool, THE system SHALL return `[FORBIDDEN]`.
*Acceptance criterion:* `set_server_note("campaign-bible", "The old gods were
banished to the outer dark")` stores the note; server restart preserves it;
`end_novel` preserves it; `server-notes://campaign-bible` returns full content;
`list_server_notes()` returns the note; Player badge returns `[FORBIDDEN]`;
`spec_health` reports the server note count.
_Check:_ T-new-285.

**REQ-321 — Codex.** THE server SHALL carry a server-level codex — a typed content
library for reusable content (NPCs, characters, scenes, encounters, lore entries,
factions, countdowns, rooms, things, equipment templates, spell templates,
relationship templates, voice profiles, adventures) that persists outside Novels and
survives server restarts. The codex operates at the server level — it has no inherent
badge context. The codex SHALL support content kinds: `npc`, `character`, `scene`,
`encounter`, `lore_entry`, `faction`, `countdown`, `room`, `thing`,
`equipment_template`, `spell_template`, `relationship_template`, `voice_profile`,
`adventure`. Every codex entry SHALL carry a `visibility` field — `library` (default,
for world-building content) or `shared` (visible to both badges). `codex_set(kind,
name, data, description?, tags?, visibility?)` SHALL create or update a codex entry
with upsert semantics — the `data` parameter carries a kind-specific payload whose
shape mirrors the corresponding Novel or roster tool parameters. `codex_import(id)`
— where `id` is a string or an array of strings — SHALL materialize one or more
codex entries into the active Novel. An array SHALL be processed atomically: all
entries applied as a single undo snapshot; partial failure reports the failed
entry with its array index and cause, and the operation SHALL NOT produce side
effects on novel state. Materialization delegates to the existing tool for the
entry's kind: `npc` → `create_npc`, `character` → `import_character`,
`scene` → `set_scene_state`, `encounter` → `init_combat`, `lore_entry` →
`set_lore_entry`, `faction` → `create_faction`, `countdown` → `set_countdown`,
`room` → `create_room`, `thing` → `create_thing`, `equipment_template` →
materialize equipment into the entity's inventory, `spell_template` → materialize
a custom spell into the entity's known spells, `relationship_template` → apply the
relationship set via `set_relationship` for each pair, `voice_profile` → apply via
`set_voice_examples` and `set_personality`. For kind `adventure`, `codex_import`
SHALL materialize the adventure scaffold into the active Novel: populate world-model
tier from the stored `## World` section data (rooms, things, exits per REQ-079),
create NPCs from extracted NPC data, set factions from extracted faction data, create
lore entries from extracted location descriptions, and activate enrichment linkages
per REQ-229. The adventure data payload for kind `adventure` SHALL carry: `title`,
`slug`, `source` (one of `generated`, `loaded:<adventure_slug>`,
`captured:<novel_slug>`), `premise`, `overview`, `hook`, `locations` (array of
`{heading, flavor_text}`), `npc_suggestions` (array of `{name, description}`),
`encounter_seeds` (array of free-text entries), `genre_tags` (array of strings), and
`sections` (the full parsed adventure sections per REQ-079: `## World`, `## Premise`,
`## Factions`, `## Scenes`, `## NPCs`, `## Lore`, `## Seeds`). `codex_capture(kind,
source_id)` SHALL pull an existing Novel artifact into the codex — the captured
entry carries a `source_novel` field tracing its origin. `codex_capture("adventure")`
SHALL pull the active Novel's adventure content (loaded or generated) into the Codex
as kind `adventure` with `source: captured:<novel_slug>`, carrying the full adventure
data payload defined above. When the active Novel has no adventure content,
`codex_capture("adventure")` SHALL return `[STATE_CONFLICT]` with corrective action
`"No adventure content in the active Novel. Load an adventure via load_adventure or
generate one via generate_adventure."` `codex_list(kind?, tag?)` SHALL return a

WHEN `codex_capture` is called with an `update_source` flag set to `true`, and the
captured artifact originated from a prior `codex_import` (detected by the provenance
field defined in REQ-332), THE system SHALL update the source Codex entry in-place
rather than creating a separate entry. When `update_source` is `true` but the
artifact has no Codex provenance, the system SHALL return `[ERROR] [STATE_CONFLICT]`
with corrective action directing the caller to omit `update_source`.

`codex_list(kind?, tag?)` SHALL return a
filterable list of codex entries with id, kind, name, description, tags, and
visibility. `codex_list` SHALL be badge-filtered: when a badge is active, the Player
badge sees only `shared`-visibility entries; the Game Master badge sees all entries.
In editing mode (no badge active), `codex_list` returns all entries unfiltered.
`codex_info(id)` SHALL return the full record including the kind-specific data
payload, badge-filtered by visibility. `codex_delete(id)` SHALL remove an entry with
no confirmation gate — `undo` SHALL restore a deleted entry within the same
connection. Mutating codex operations (`codex_set`, `codex_capture`, `codex_delete`)
SHALL require no badge active (editing mode) or Game Master badge; Player badge
SHALL return `[FORBIDDEN]`. `codex_import` SHALL be badge-scoped: Player badge MAY
import `shared`-visibility entries of kind `character`; the Game Master badge may
import any entry regardless of visibility. Player badge import of any other kind
SHALL return `[FORBIDDEN]`. Codex entries persist to `.holonovel-state/codex.json`
with atomic writes and backup rotation. The codex SHALL survive `end_novel`,
`revert_enrichment`, and server rebuilds. Codex entries SHALL be surfaced in
`spec_health` under a `codex` key (count partitioned by kind). The codex SHALL be
retrievable at `codex://<id>` as a resource, badge-filtered by visibility. Codex
entries SHALL NOT appear in `export_novel`, `clone_novel`, or checkpoint snapshots.
Codex entries SHALL carry no mechanical effect within a Novel until explicitly
imported via `codex_import`. `codex_import` and `codex_capture` SHALL return
`[STATE_CONFLICT]` when no Novel is active.
*Acceptance criterion:* `codex_set("npc", "Blacksmith", {description: "Gruff,
scarred", ac: 14, hp: 35}, "The village blacksmith", ["blacksmith",
"village"])` stores the entry with default visibility `library`; `codex_set("npc",
"Blacksmith", ..., visibility="shared")` stores with `shared` visibility; server
restart preserves entries; `end_novel` preserves them; `codex://blacksmith` returns
full content; `codex_list("npc")` under Player badge returns only `shared` entries;
`codex_list("npc")` under Game Master badge returns all entries; `codex_list("npc")`
with no badge active returns all entries; Player badge `codex_set(...)` returns
`[FORBIDDEN]`; Game Master badge `codex_import("blacksmith")` into an active Novel
creates the NPC; Player badge `codex_import("fighter-01")` of a `shared`-visibility
`character` entry imports the character; Player badge `codex_import("blacksmith")`
returns `[FORBIDDEN]`; `codex_import("my-adventure")` with kind `adventure` into an
active Novel populates world-model, NPCs, factions, lore, and activates enrichment
linkages; `codex_capture("adventure")` from an active Novel with adventure content
stores it in Codex with `source: captured:<slug>`; without adventure content returns
`[STATE_CONFLICT]`; `codex_import(["blacksmith", "innkeeper", "guild-faction"])`
imports three entries atomically; `codex_import(["blacksmith", "nonexistent"])`
reports `nonexistent` at index 1 as `[NOT_FOUND]` and imports nothing;
`codex_capture("npc", "blacksmith", update_source=true)` on a codex-sourced NPC
updates the Codex entry in-place; `codex_capture("npc", "handcrafted-npc",
update_source=true)` on an NPC with no codex_source returns `[STATE_CONFLICT]`;
`spec_health` reports codex counts by kind.
_Check:_ T-new-322, T-new-338, T-new-339.

**REQ-332 — Codex provenance.** WHEN a Novel artifact (NPC, room, thing, lore
entry, faction, countdown) is created via `codex_import`, THE artifact SHALL
carry a `codex_source` field recording: the Codex entry ID, the import timestamp,
and the Codex entry's `modified_at` value at the time of import. `codex_import`
of an entry whose `codex_source` already references that Codex entry SHALL update
the existing artifact in-place rather than creating a duplicate — fields present
in the Codex entry SHALL overwrite corresponding Novel artifact fields; fields
set only in the Novel (runtime state like HP, conditions, disposition) SHALL be
preserved. `novel_info` SHALL report `codex_sources` — an array of `{id, kind,
imported_at, codex_modified_at}` for every Codex-sourced artifact in the Novel.
WHEN a Codex entry's `modified_at` timestamp is newer than the import timestamp
recorded in the Novel artifact's `codex_source`, THE `spec_health` tool SHALL
flag the artifact as `[codex_stale]` — the Codex template has been updated since
import. `clone_novel` and checkpoint snapshots SHALL preserve `codex_source`
fields on copied artifacts.

*Acceptance criterion:* `codex_import("blacksmith")` creates NPC "Blacksmith"
with `codex_source: {id: "blacksmith", imported_at: <ISO>, codex_modified_at:
<ISO>}`. Updating the blacksmith Codex entry via `codex_set`, then calling
`codex_import("blacksmith")` again updates the existing NPC (same entity ID)
rather than creating a new one. `novel_info()` reports `codex_sources` including
the blacksmith entry. After updating the Codex entry, `spec_health` reports
`[codex_stale]` for the Novel's blacksmith NPC.

_Check:_ T-new-336.

### 5.7 Determinism, Safety, and Performance

**REQ-050 — Determinism.** All random draws come from a single deterministic PRNG, seedable
via `TTRPG_SEED`. Any tool that performs a random draw — dice-roll tools, `init_combat`
(danger initiative), `create_character` (stat generation), and any
ruleset-derived tool tbadge includes dice resolution — accepts an optional
per-call seed. Same seed + same call
sequence = same results across sessions and games. Seed conflict (a tool-call seed when a
session seed is active) is a `[WARNING]` and the per-call seed wins for that draw.
During a per-call seed override, the override uses an isolated draw that does not
advance the session PRNG position — after the override completes, the next
session-seeded draw produces the same result it would have produced had the
override never occurred. The session seed persists across draws unless explicitly
reseeded.
When `TTRPG_SEED` is not set, the PRNG shall use a fixed default seed (0). The
server logs the active seed at startup — `[info] PRNG seed: <value> (source: env|default)` —
so operators can verify determinism. The acceptance criterion below — that
`roll_save("dexterity", seed="42")` produces the same d20 face on two separate
server restarts — extends to the unset case: two restarts without `TTRPG_SEED`
shall produce identical event sequences for identical tool-call sequences.
*Acceptance criterion:* `roll_save("dexterity", seed="42")` produces the same
d20 face on two separate server restarts; a per-call seed does not advance the
session PRNG position.
_Check:_ G2, T27, T111.

**REQ-273 — Independent verification reproducibility tolerance.** When the
independent verifier (§10) compares its results to the builder's, the following
count as a structural match rather than a discrepancy:

1. Seed-pinned dice rolls SHALL match exactly.
2. Status prefixes (`[OK]`, `[ERROR]`, `[WARNING]`, `[NEED_INPUT]`) SHALL match
   exactly.
3. Exit codes SHALL match.
4. Tool names and parameter values SHALL match.
5. Natural-language prose (scene descriptions, NPC dialogue, lore content) is
   non-adversarial — a match is structural (non-empty and within ±20% word count)
   rather than verbatim.
6. Counts (entity count, lore entry count, audit entry count) SHALL match within
   zero tolerance for exact-count fields and ±1 for open-ended fields (audit log
   entries, session recap entries).

A comparison that satisfies all applicable tolerance rules is a match. Any
violation of rules 1–4 is a Discrepancy. Any violation of rule 5 is Unclassifiable
(operator's call). Any violation of rule 6 is Pin drift unless rule 1–4 also fail.
_Check:_ T293.

**REQ-274 — Independent verifier confidence score.** The independent verifier
(§10) SHALL produce an overall confidence score between 0 and 1 across all
compared workflows, computed as:

- Each Discrepancy: weight 0
- Each Pin drift: weight 0.2 × (1 if operator confirms pin drift, 0 if operator
  flags as discrepancy)
- Each Structural match under REQ-273 tolerance: weight 1.0
- Each Exact match: weight 1.0

Score = sum(weights) / total_comparisons. A score below 0.80 is FAIL; 0.80–0.95
is PARTIAL with enumerated reservations; above 0.95 is PASS. The score and
per-workflow component weights are recorded in the verifier's evidence.
_Check:_ T294.

**REQ-213 — Weighted table result mapping.** When a generation table defines a
dice-range-to-result mapping, `roll_on_table` SHALL roll the specified dice
expression, match the result against the defined ranges, and return the matched
result row. The output SHALL include: (a) the dice notation (e.g., `d100`),
(b) the individual die face rolled, and (c) the matched range with its result
text. When a roll falls outside all defined ranges, the tool SHALL return
`[WARNING]` with the raw roll and a "no range matched" message — the tool SHALL
NOT silently return a bare number.

A generation table entry defines: `dice_expression` (e.g., `1d100`, `1d8`), a
list of `ranges` (each with `min`, `max`, `result`), and an optional `badge_scope`
(`game_master` or `shared`, default `shared`). A generation table SHALL NOT
interleave dice-range rows with static lookup rows — tables are classified as
either generation or lookup at extraction; a table containing any dice-range row
is a generation table.

*Acceptance criterion:* `roll_on_table(table="wand_of_wonder", seed="42")`
produces the same result row on two separate server restarts, with output
including dice notation, individual die face, matched range, and result text.

_Check:_ T254.

**REQ-291 — Oracle tool.** THE server SHALL provide an `ask_oracle(question, likelihood,
seed?)` tool (GM only) for uncertainty resolution. The tool accepts a free-text `question`
and a `likelihood` value — one of `certain` (90% yes), `likely` (70% yes), `even` (50%
yes), `unlikely` (30% yes), or `impossible` (10% yes). It draws from the PRNG (REQ-050)
and returns one of: `[YES]`, `[NO]`, `[EXCEPTIONAL_YES]`, or `[EXCEPTIONAL_NO]`.

Doubles on the d100 (11, 22, 33, ..., 99) produce an exceptional result — an
`EXCEPTIONAL_YES` or `EXCEPTIONAL_NO` — which signals a stronger, more intense version
of the answer. The `question` parameter is recorded in the audit log; the draw is
deterministic and seedable. The oracle is positioned as a GM-input aid — it resolves
uncertainty when the GM doesn't know what should happen, but SHALL NOT replace the AI
GM's narrative judgment. Player badge returns `[FORBIDDEN]`. The oracle has no briefing
presence — it is callable on demand only and fades into the background per §5.10.

`help("ask_oracle")` SHALL return usage examples, parameter contracts, and common
workflows. `suggest_actions("I don't know what's behind the door")` SHALL map to
`ask_oracle`.

*Acceptance criterion:* `ask_oracle("Is there a guard behind the door?", "even",
seed="42")` returns `[YES]`, `[NO]`, `[EXCEPTIONAL_YES]`, or `[EXCEPTIONAL_NO]`. Same
seed + same call sequence produces the same result across restarts. Likelihood "certain"
returns `[YES]` or `[EXCEPTIONAL_YES]` on most draws. Player badge returns `[FORBIDDEN]`.
_Check:_ T-new-291.

**REQ-157 — Combat determinism.** Combat initiative for dangers is drawn from the
same PRNG as all other random draws (REQ-050). `init_combat` accepts an optional
per-call seed. When a per-call seed is provided, every danger initiative roll
within that combat session uses an isolated draw that does not advance the session
PRNG position — after the override completes, the next session-seeded draw matches
the sequence it would have produced without the override. When no per-call seed is
provided, danger initiative draws advance the session PRNG position normally.
*Acceptance criterion:* `init_combat(participants=[], dangers=[{name:"goblin"}], seed="42")`
produces the same danger initiative value on two separate server restarts; the
d20 face matches the Appendix B.4 seed-42 column at the appropriate offset.
_Check:_ T192.

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

**REQ-251 — Generation intent guard.** Before producing generation output, `generate_adventure`
and `generate_encounter` SHALL assess the premise or context string for direct and
implied harm, power-inversion requests ("create an adversary capable of defeating
<specific entity>"), and content that exceeds the ruleset's mechanical ceiling. Any
request whose resolution would require the server to fabricate mechanics, void the
ruleset's stated constraints, or generate content likely to violate participant consent
SHALL return `[WARNING]` describing the concern and requesting clarification or
modification — the server SHALL NOT silently comply. The assessment SHALL operate on
the input string without generating output first — compliance is checked before
resources are consumed. The operator MAY override the guard by prefixing the premise
with `!force` — the override SHALL be recorded in the audit log with a
`[generation_guard_overridden]` entry. A GM-only advisory SHALL appear in
`badge_briefing` when a generation guard fired in the current session, listing the premise
and the concern. When the ruleset defines a difficulty system (challenge rating, threat
levels), `generate_encounter` SHALL cap generated danger power against the party's
existing entity levels — exceeding the cap produces `[WARNING]` with the cap value.
*Acceptance criterion:* `generate_adventure("create an adversary capable of defeating
Data")` returns `[WARNING]` listing the guard concern; `generate_adventure("!force
create an adversary capable of defeating Data")` proceeds with the generation and
records a `[generation_guard_overridden]` audit entry. A ruleset that defines
challenge rating caps generated encounters against party level and warns on exceedance.
_Check:_ T-new-251.

**REQ-100 — Performance benchmark.** The builder measures and records cold-start time and
representative query latency for the target ruleset. Measurements are recorded in
DECISIONS.md (4) with the measurement environment (OS, CPU, memory, runtime version).
Cold-start timing: launch server, call `spec_health`, measure wall-clock time from process
start to response. Query latency is the mean of 5 representative lookups. `spec_health`
reports the most recent measurement. Tiers: Light (<100 indexed items) ≤2 s cold start;
Standard (100–500) ≤5 s; Heavy (500–2000) ≤10 s; Huge (2000+) ≤20 s.
*Acceptance criterion:* DECISIONS.md (4) records cold-start time and mean query
latency for 5 representative lookups; `spec_health` reports the most recent
measurement.
_Check:_ T87.

The five representative lookups are one canonical call per lookup category
registered on the server: `lookup_spell`, `lookup_equipment`, `lookup_monster`,
`lookup_class`, and `search_rules`. If fewer than five lookup categories exist,
the builder measures all available categories and notes the count in
DECISIONS.md (4). The indexed-item count used for tier classification is the
value reported by `spec_health.search_index` (the heading count in the loaded
search index). For servers where `spec_health` reports no `search_index` field,
the builder counts extracted items in RULESET_MODEL.md and records the count and
method in DECISIONS.md (4).
*Acceptance criterion (added):* The five lookup calls are one per registered
lookup category; DECISIONS.md (4) records which categories were measured and
their individual latencies.
_Check:_ T87.

**REQ-253 — Tool-output verbosity control.** Every lookup and resolution tool SHALL support
a `terse` mode that returns the minimum mechanical content needed to resolve the rules
question — no narrative framing, no extended context, no auxiliary information. The
`terse` mode SHALL return: for `lookup_spell`, the spell name, level, casting time,
range, duration, and damage/effect die — omitting verbal/somatic/material components
and full spell description; for `search_rules`, the most relevant sentence or paragraph
only — omitting surrounding context; for combat advance, the participant name,
action taken (or `[AUTO]`), and resulting state changes — omitting full roll
transparency. The default mode is `verbose` (full output, current behavior). `terse`
mode is selectable via: (a) the `detail=terse` player signal (REQ-197) which applies
to all subsequent tool output; (b) a per-call `terse: true` parameter on individual
tool invocations. The per-call parameter overrides the session-scoped signal for
that call. `spec_health` SHALL report the active verbosity mode. The mode is
session-scoped — discarded on connection close.
*Acceptance criterion:* `lookup_spell("fireball", terse=true)` returns the spell name,
level, and damage die without the full spell description. `search_rules("grapple", terse=true)`
returns the most relevant sentence only. `advance_combat` under `detail=terse` returns
participant name + `[AUTO]` + resulting HP/condition changes without full roll breakdown.
_Check:_ T-new-253.

**REQ-054 — Input safety.** All tool inputs are validated server-side. Adversarial
free-text is stored and echoed verbatim as inert data in all surfaces, with no behavior
change. The server trusts nothing client-supplied.
*Acceptance criterion:* `set_scene_state("'); DROP TABLE novels;--")` stores
and echoes the string verbatim; no SQL execution, no behavior change, no crash.
_Check:_ T20, T42.

**REQ-055 — Durability and resume.** Novel state survives connection restarts:
entities, HP, conditions, slots, turn order persist. The roster is permanent and immutable
at baseline. `import_character` brings a fresh copy of a roster entry into a Novel. Session
audit logs survive. `end_novel` discards the Novel; the roster survives. Resuming an ended
Novel fails with `[ERROR] [STATE_CONFLICT]`. RNG seed and position survive with the Novel.
When a Novel is resumed or switched to, the Novel's persisted badge state takes
precedence over `TTRPG_BADGE`. `TTRPG_BADGE` sets the initial active badge only
when the starting Novel has no persisted badge state — either because the Novel is
newly created, or because no badge was activated during a prior session. WHEN
`resume_novel` restores a Novel that has a badge active (a story in progress) THE
server SHALL include a notice identifying the active badge — e.g., "This Novel has
a story in progress (Player badge active). You're back in the story." — so the
operator knows they have resumed an active story rather than entered editing
mode.
*Acceptance criterion:* Server restart with `TTRPG_NOVEL=my-novel` restores
entities, HP, conditions, badge, and RNG state; `resume_novel("ended-novel")`
returns `[STATE_CONFLICT]`.
_Check:_ T9, T31, T108.

*Out of scope:* hardware-level RNG, cryptographic security guarantees, formal
verification of input safety, and performance under adversarial load beyond the tier
benchmarks defined in REQ-100.

**REQ-312 — Pre-narration validation gate.** WHEN the AI narrator proposes narration that
implies a mechanical outcome — damage dealt, condition applied, spell effect resolved,
ruleset-defined state change — THE engine SHALL validate the proposal against ruleset
constraints before the narration reaches the player. Validation SHALL check:

- **Bounds conformance.** Mechanical claims (damage amounts, DC values, spell slot
  expenditures, condition applicability) SHALL NOT exceed ruleset-defined maxima. A
  narration claiming Fireball deals 12d6 damage SHALL be rejected with a corrective
  suggestion naming the ruleset maximum.

- **Permission conformance.** Mechanical claims SHALL NOT assert outcomes a character is
  not capable of — the entity must possess the referenced capability (class feature,
  spell slot, equipment, feat). A narration claiming a Fighter casts a spell they do not
  know SHALL be rejected.

- **State conformance.** Mechanical claims SHALL NOT contradict current state — a
  narration claiming a dead NPC acts SHALL be rejected. A narration claiming a condition
  the entity already has is applied again SHALL be rejected.

Invalid proposals SHALL be rejected behind the server interface — the player never sees
the invalid narration. The rejection SHALL produce a corrective suggestion: `[REJECTED]
Proposed narration implies <claim>. Ruleset constraint: <constraint>. Corrective
suggestion: <rewrite>`. The AI narrator receives the correction and may retry. Validation
leverages existing ruleset extraction (REQ-010–018) and the server's indexed capabilities
catalogue. Validation is a per-narration gate, not a continuous scanner — it activates
only when a state-mutating tool call is preceded by AI narration.

A setting `TTRPG_NARRATION_VALIDATION` (defaults to active) controls the gate. When `off`,
narration passes through unvalidated (current behavior). `spec_health` SHALL report
`narration_validation: enabled | disabled` and `narration_rejection_count` — cumulative
rejections since last Novel resume.

*Out of scope:* Validation of narrative style, tone, or prose quality — these are AI
judgment, not mechanical integrity.

*Acceptance criterion:* With `TTRPG_NARRATION_VALIDATION=on`, the AI proposes narration
claiming a dead NPC speaks — the engine rejects it with a corrective suggestion citing
the NPC's deceased state. The player never sees the invalid narration. The AI retries
with a corrected narration. `spec_health` reports `narration_rejection_count: 1`. With
`TTRPG_NARRATION_VALIDATION=off`, the same narration passes through.
_Check:_ T-new-313.

### 5.8 Enrichment, Lore, and Macros

**REQ-246 — Story journal.** The server provides story journal tools — Game Master only.
`record_story(type, entry)` records a narrative memory in the Novel's
`story_journal` array. `update_story(index, entry?, type?)` edits an existing entry
by array index; editing a `decision` or `consequence` type entry SHALL return
`[ERROR] [RULE_VIOLATION]` — past decisions and their consequences are immutable.
Editing other types where the entry's scene anchor predates the current scene SHALL
return `[WARNING]` but the edit proceeds. `remove_story(index)` deletes an entry by
array index; remaining entries retain their indices (gaps allowed). `list_stories(filter?,
offset?, limit?)` returns paginated entries with optional `type` filter; offset-based
pagination with default limit 20.

`type` SHALL be one of `decision`, `moment`, `revelation`, `bond`, or `consequence`.
`entry` is free-form text — recommended one to four sentences. The entry SHALL record
the current scene anchor, active entity IDs, and an ISO 8601 timestamp. Each type signals
retrieval context: `decision` (a choice with consequences), `moment` (an emotional beat
or roleplay highlight), `revelation` (new information that changed understanding), `bond`
(a relationship formed or deepened), `consequence` (something happened because of a prior
choice). The tool SHALL include a style guide in its help text: focus on narrative
elements the mechanical audit log does not capture — motivations, emotional stakes,
world changes, off-screen events. Entries are Novel-scoped, survive restarts, and are
discarded by `end_novel`. Story journal entries are not mutating state operations for
undo/redo purposes — `undo` SHALL NOT reverse a story journal entry. Player badge returns
`[FORBIDDEN]`.

Story journal entries SHALL be surfaced: (a) in `session_recap` under a `story_entries`
field — paginated via `offset`/`limit` params, default 10; (b) in `badge_briefing` under
a `story` section token, configurable via `TTRPG_STORY_JOURNAL_DISPLAY` —
entries whose `entity_ids` overlap the current active entities or whose `scene_anchor`
matches the current scene; (c) in `export_novel` output under `story_journal`; (d) in
`clone_novel` as a copied array. The `story_journal` array is stored in the Novel JSON
per REQ-092 and grows with each recorded entry. Growth is bounded by
`TTRPG_MAX_STORY_ENTRIES` per REQ-129; exceeding returns
`[STATE_CONFLICT]`. `spec_health` SHALL report `story_journal_count_by_type` —
per-type entry counts — and warn at 80% of the maximum.
*Acceptance criterion:* `record_story("moment", "The ferryman told a story...")` appends
an entry; `list_stories(type="moment")` returns entries filtered by type;
`update_story(0, "Corrected entry.")` edits the first entry; editing a `decision` type
returns `[ERROR] [RULE_VIOLATION]`; `remove_story(0)` deletes; undo does not remove
entries; Player badge returns `[FORBIDDEN]`; `spec_health` shows per-type counts.
_Check:_ T282.

**REQ-331 — Story journal-world coupling.** Story journal entries SHALL accept an
optional `room_id` field. When `record_story` is called during a scene that is
coupled to a world-model room (REQ-326), `room_id` SHALL auto-populate with the
room's ID. Entries with `room_id` SHALL annotate their `scene_anchor` with the
room's name — surfaced in `list_stories` and `export_novel` output. `session_recap`
`narrative_orientation` SHALL include room names for entries that carry them.
`badge_briefing` `story` section entries SHALL include room context when available.
The `room_id` field is optional — entries in non-room-coupled scenes or scenes
with unmatched locations SHALL carry no `room_id`. Backward compatible: existing
story journal entries without `room_id` are valid.
*Acceptance criterion:* `record_story("moment", "Discovered the hidden passage")`
with scene coupled to world-model room "Library" — entry auto-populates
`room_id: "library"` and `scene_anchor` includes "Library". Same call with
unmatched location — `room_id` absent.
_Check:_ T-new-331.

**REQ-333 — Story journal to lore promotion.** THE server SHALL provide a
`promote_story_to_lore(index, key?)` tool — Game Master only. Accepts a story
journal entry index of type `revelation` or `moment` and creates a lore entry
whose key SHALL be either the explicit `key` parameter (when provided) or a slug
derived from the first sentence of the journal entry. The lore entry's content
SHALL be the journal entry text; its triggers SHALL be derived from entity and
location names mentioned in the entry. The journal entry is unchanged —
promotion is non-destructive. Promoting a `decision` or `consequence` type entry
SHALL return `[ERROR] [RULE_VIOLATION]` — decisions and consequences are
immutable. When a lore entry already exists at the target key, the system SHALL
return `[STATE_CONFLICT]` with corrective action suggesting a `key` parameter to
disambiguate. The created lore entry carries a `source` field citing the story
journal index as `story_journal:<index>`. Player badge returns `[FORBIDDEN]`.

*Acceptance criterion:* `record_story("revelation", "The old well leads to the
undercity")` then `promote_story_to_lore(0)` creates lore entry
`the-old-well-leads-to-the-undercity` with `source: story_journal:0`.
`promote_story_to_lore(0, key="well-undercity-link")` uses the explicit key
(succeeds only if that key is not already taken). Promoting a `decision` entry
returns `[RULE_VIOLATION]`. Player badge returns `[FORBIDDEN]`.

_Check:_ T-new-336.

**REQ-310 — Campaign Memory.** THE server SHALL maintain an engine-recorded campaign
memory — a per-entity fact store derived automatically from state-changing tool calls,
surviving process restart and full rebuild. Facts are recorded by the engine, not the AI,
and SHALL be stored in the Novel JSON per REQ-092. The campaign memory tracks three
categories:

- **Per-NPC facts.** WHEN an NPC participates in combat (REQ-043), appears in a scene
  (`characters_present` per REQ-307), undergoes a relationship change (REQ-236), or
  receives a personality update (REQ-077), THE engine SHALL record a fact capturing the
  nature of the event, the scene anchor, and a timestamp. Per-NPC facts SHALL NOT duplicate
  the NPC's own personality fields or depth metadata (REQ-075) — they capture events, not
  traits.

- **Per-thread facts.** WHEN a faction clock (REQ-233) advances, a countdown with narrative
  scope fires, a story journal `decision` entry has no corresponding `consequence`
  (REQ-246), or an active vow (REQ-289) accumulates milestones, THE engine SHALL record a
  fact linking the thread to the entities involved.

- **Per-location facts.** WHEN scene state (REQ-076) records a notable event or NPC
  presence at a location, THE engine SHALL record a fact associating the location with the
  event, timestamp, and involved entities.

WHEN `badge_briefing` composes GM-oriented content, THE engine SHALL inject campaign memory
facts under a `## Campaign Memory` section. This section is a decision-critical group
(REQ-109) ordered after scene state and before entities. Facts SHALL be prioritized by
relevance to the current scene: (a) NPCs present in the scene, (b) NPCs with relationships
to present entities, (c) active thread facts involving present entities, (d) location
facts for the current scene, (e) recency (most recent first). The section SHALL render at
most 10 facts, ordered by priority. Campaign memory facts SHALL NOT introduce new mutating
tools — they are a surfacing layer over existing state. `spec_health` SHALL report
`campaign_memory` with per-category counts (`npcs`, `threads`, `locations`) and a total.
`export_novel` SHALL include `campaign_memory` in its payload.

Campaign memory facts rendered in `badge_briefing` under the Player badge SHALL be
presence-scoped: a fact is visible to the Player badge only when the active entity was
present in the scene where the fact was recorded as determined by `characters_present`
(REQ-307). The Game Master badge sees all facts (current behavior). Facts from scenes the
entity attended are retained regardless of current presence — presence scoping gates
visibility, not storage.

Every campaign memory fact SHALL carry a `badge_scope` field — `gm` (default, for
GM-authored or engine-derived facts that should remain GM-visible only), `shared`
(visible to both badges.when presence-scoped), or `discovered` (visible to both badges.
tagged as player-discovered). Under the Player badge, campaign memory visibility
compounds two filters: a fact is visible only when (a) the active entity was present
for the scene where the fact was recorded (presence scoping), AND (b) the fact's
`badge_scope` is `shared` or `discovered`. The Game Master badge sees all facts regardless
of `badge_scope`. Facts created by the engine default to `gm`; the GM may override
scope via `set_lore_entry` (REQ-083) for facts that also correspond to lore entries.
`discovered`-scope facts carry a `[discovered]` tag in `badge_briefing` distinct from
the standard rendering.

*Acceptance criterion:* After a session with two NPCs (each appearing in a scene and
combat), three scene changes, one faction clock advancement, and one story journal
decision, `spec_health` reports `campaign_memory.npcs ≥ 2`, `campaign_memory.threads ≥ 1`,
`campaign_memory.locations ≥ 1`. `badge_briefing` includes `## Campaign Memory` with facts
prioritized by scene relevance. Facts survive Novel persistence and are present in
`export_novel("json")`.
_Check:_ T-new-311.

**REQ-080 — Enrichment boundaries.** Enrichment consists of three source
categories with distinct storage models:

1. **Tier 1 (ruleset-native)** — extracted during Discovery from the ruleset's own
text per REQ-225, populated at build time. Tier 1 content is **build output**: full
item definitions (voice_examples, lore templates, action patterns, etc.) live in the
build's extraction directory, not in the Novel JSON. The Novel stores only activation
keys under `enrichment_activated: {module: [key, ...]}`, recording which Tier 1 items
the GM has activated. Items tagged `[ruleset]` with source anchors.

2. **Tier 2 (community)** — web-researched post-build per §11.1, optionally run.
Tier 2 items are stored in full within the Novel JSON. Items tagged
`[supplementary]` with source URLs.

3. **Player-authored (player)** — created at runtime by the Player badge via
`player_enrich` (REQ-261). Items are stored in full within the Novel JSON under a
`player_enrichment` key, organized by output module. Items are tagged `[player]`
and are active immediately upon creation in the player-facing subset of modules:
`voice_examples`, `action_patterns`, `supplementary_guidance`, `narrative_voices`,
and `lore_templates`. Default badge scope is `shared` (visible to both badges.; the
player may scope items `player` (private). Player items are subject to a per-module
cap of 15 items. The GM may not modify or remove `[player]` items but may override
their `badge_scope` to `game_master` to incorporate them into the GM's active
enrichment set.

On Novel startup, Tier 1 activation keys resolve against the build's current tier 1
extraction. Keys that match stay active with the latest extracted content. Vanished
keys — those whose anchors no longer resolve — silently drop and are reported in
`spec_health` as `[enrichment_gap]` entries. New Tier 1 items discovered in the current
extraction but not present in the activation keys start inactive. When a ruleset
rebuild occurs, fresh extraction replaces the build output directory; the same key
resolution logic applies on next Novel startup.

Community items never replace ruleset-native items. Player items never replace
ruleset-native or community items — the three source categories coexist. The GM
activates items from Tier 1 and Tier 2 via the same tool calls. Player items are
active immediately upon creation; the player may deactivate their own items via
`deactivate_enrichment_item` (REQ-260). Enrichment may ADD content to entity
voice_examples (REQ-077), prompt ordering recommendations (REQ-082), lore templates
(REQ-083), action suggestion patterns (REQ-084, REQ-115), adventure advice (REQ-090,
§11.1), narrative voice profiles (REQ-226), and supplementary guidance. Enrichment
MUST NOT modify mechanical fields (stats, saves, HP, conditions, combat state),
build-derived tool registrations, badge gating rules, or any ruleset-derived values.
Enrichment recommendations for prompt ordering, lore templates, and adventure advice
are inert — they never auto-apply; the GM must explicitly activate them via the
corresponding tools. Community enrichment items that have never been activated and
whose `collected_at` timestamp exceeds `TTRPG_ENRICH_STALE_DAYS` are flagged as
`[stale]` in `spec_health` and excluded from enrichment resource surfaces.
Ruleset-native items do not carry staleness flags — they are canonical. Stale items
are retained on disk and reactivate if the GM explicitly activates them. Re-running
community Enrich refreshes timestamps for all community items. Every community enrich
finding carries source_url, quoted_excerpt, badge_scope, confidence (derived from
source authority, not mechanical completeness), output_module, and collected_at (ISO
8601 timestamp of collection) — all non-empty. Ruleset-native items carry source
anchor, confidence, output_module, and `[ruleset]` tag. Reverting enrichment
(REQ-103) removes only community enrichment; ruleset-native and
player items persist.

*Acceptance criterion:* Enrich-sourced voice_examples carry `[supplementary]` tag
and source URL; ruleset-native items carry `[ruleset]` tag and source anchor;
player-authored items carry `[player]` tag and appear in both Player and GM
`badge_briefing` by default; a
stale community enrich item (past `TTRPG_ENRICH_STALE_DAYS`) is flagged
`[stale]` in `spec_health` and excluded from surfaces; `revert_enrichment` removes
community items but preserves ruleset-native and player items; a Novel's Tier 1 activation key that
no longer resolves against the build's current extraction appears as an
`[enrichment_gap]` entry in `spec_health`; new Tier 1 items in the current extraction
with no matching activation key start inactive.

_Check:_ T63, T95, T97, T125.

**REQ-081 — Narrative directive.** The Game Master may set narrative directives via
the `narrative_directive` parameter on `set_scene_state`. Each directive has a `label` (non-empty, unique
within a Novel) and an `instruction` (free-text). Setting a duplicate label replaces the
prior entry. An empty array clears all directives. For backward compatibility,
`set_narrative_directive` also accepts a single `directive` string — treated as
`[{"label": "primary", "instruction": <string>}]`. Directives appear in `badge_briefing`
for the Game Master badge only and at `novel://current`, grouped under "Narrative
Directives" with their labels. Directives are inert guidance — they do not affect tool
behavior, dice results, or rules enforcement. They persist with the Novel. Player badge
attempts return `[ERROR] [FORBIDDEN]`.
*Acceptance criterion:* The `narrative_directive` parameter on
`set_scene_state` with `[{label: "mood", instruction:
"dark and brooding"}, {label: "pacing", instruction: "slow burn"}]` produces two
entries in `badge_briefing` under the GM badge; a duplicate "mood" label replaces the prior;
an empty array clears all directives.
_Check:_ T64, T134.

**REQ-082 — Prompt section ordering.** The Game Master may reorder the sections of
`badge_briefing` via `set_briefing_order(sections)`. The tool accepts an ordered
array of section tokens. Unknown tokens return `[ERROR] [INVALID_INPUT]` with valid
tokens enumerated. An empty array resets to the builder-determined default.
Section tokens control both ordering and inclusion — a token present in the
array causes its corresponding group to render (or render as an empty section
if the group has no content); a token absent from the array causes its group to
be omitted entirely from `badge_briefing`. The builder default ordering includes
all groups and SHALL follow the placement contract of `TTRPG_WORLD_PROMINENCE`
(REQ-309) — world-model state is decision-critical at `prominent`, a dedicated
section at `visible`, or folded into scene state at `secondary`. The builder
SHALL document the
complete section-token-to-group mapping and the default ordering in DECISIONS.md, so
the valid token set and default section ordering are auditable at build verification
time without invoking the running server. The mapping SHALL cite the REQ-109 group each
token corresponds to. Tokens
whose corresponding sections are absent from the current ruleset produce empty
sections (no error). Enrich may record an ordering recommendation visible in
`spec_health`, but never auto-applies. The ordering persists with the Novel. Player
badge attempts return `[ERROR] [FORBIDDEN]`.
*Acceptance criterion:* `set_briefing_order(["scene", "entities", "lore"])`
reorders `badge_briefing`; `set_briefing_order([])` resets to builder defaults; an
unknown token returns `[ERROR] [INVALID_INPUT]` with valid tokens enumerated.
_Check:_ T66.

**REQ-185 — Section token vocabulary.** The builder SHALL assign a stable,
validated section token to each REQ-109 group that has a runtime representation
in `badge_briefing`. Token names SHALL be lowercase snake_case identifiers
corresponding to the REQ-109 group (e.g., `entities` for the active entities
group, `combat_state` for the active combat state group). The complete
token-to-group mapping SHALL be documented in DECISIONS.md per REQ-082. The
mapping SHALL be stable across builds — tokens do not change when the ruleset
changes unless a REQ-109 group is added or removed. When a REQ-109 group has no
runtime representation (e.g., ruleset lacks the construct), the builder SHALL
still assign a token that produces an empty section. The builder SHALL also assign
tokens for world-model briefing sections: `world_state` (current room context from
the world model, including room name, exits, and contained visible things — rendered
when world-model tier is populated) and `room_detail` (room description and
examination-level detail — rendered as a dedicated section at `visible` and
`prominent` prominence levels, folded into scene state at `secondary`). The valid
token set is the
authoritative vocabulary for `set_briefing_order` and enrichment briefing_order
recommendations.

*Acceptance criterion:* Building for D&D 5e produces a DECISIONS.md table
mapping every REQ-109 group name to a snake_case token. Building for the
Appendix B fixture (which lacks combat, countdowns, lore, and adventures)
produces a subset mapping — the token set shrinks but token names for shared
groups are identical.

_Check:_ T300.

**REQ-186 — Section token discoverability.** The valid section token set SHALL
be discoverable without triggering an error. `spec_health` SHALL include a
`section_tokens` field listing every valid token with its corresponding REQ-109
group name and whether the group currently has runtime content in the active
Novel. The `help` tool, when queried with `"briefing"` or `"section ordering"`,
SHALL enumerate the valid token set. The `[INVALID_INPUT]` error from
`set_briefing_order` (REQ-082) SHALL continue to enumerate valid tokens for
the immediate caller, but callers are not required to probe via error to find
valid tokens.

*Acceptance criterion:* `spec_health` returns a `section_tokens` array with
token, group, and has_content fields. `set_briefing_order` with an unknown
token returns `[INVALID_INPUT]` with valid tokens enumerated — and the
enumerated list matches the `section_tokens` field exactly.

_Check:_ T225.

**REQ-083 — Dynamic lore.** The Game Master may set (upsert — create or update), toggle,
group, and remove keyword-triggered lore entries via `set_lore_entry(key, content, ...)`.
If the key already exists, provided fields merge into the existing entry; if the key
does not exist, a new entry is created. `content` is required for new entries and optional
for updates. Entries activate when trigger keywords appear in scene
description text (§7.7 Scene → Lore coupling), are badge-filtered, support priority
ordering and sticky persistence, and are subject to a configurable token budget.
The server SHALL return matching enrich templates from `lore://templates`
via `suggest_lore`. The returned template set SHALL include all badge_scope
values when called from the Game Master badge, and SHALL exclude only
templates whose badge_scope is `game_master` when called from the Player
badge. The template's badge_scope is advisory — the Game Master may activate
a template with any badge_scope value via `set_lore_entry`, regardless of
the template's source scope. Suggested templates carry the same
provenance fields (key, content preview, triggers, confidence,
source_url, badge_scope) as lore templates in the enrichment manifest.
(REQ-155) Lore entries and groups persist with the Novel. Player badge mutating
and grouping attempts return `[ERROR] [FORBIDDEN]`.
*Acceptance criterion:* `set_lore_entry("tavern_rumor", "The innkeeper knows
more...", triggers=["innkeeper","tavern"])` activates when scene text matches;
sticky entries persist for their count after keywords leave; suppressed entries
count appears in `spec_health`.
_Check:_ T67, T79, T81, T82,
T83.

Extend `set_lore_entry` and `update_lore_entry`: each lore entry SHALL carry a
`visibility` field — one of `gm_only` (applied to new entries), `shared` (visible to
Player badge immediately), or `player_discovered` (set automatically when `reveal_secret`
is called for this entry's key). `gm_only` entries are excluded from Player-badge surfaces
including `badge_briefing`, `lore://active`, and `graph://novel`. `shared` entries are
visible to both badges.

When `set_lore_entry` creates a new entry without a `visibility` field, it defaults to
`gm_only`. `update_lore_entry` MAY change the visibility field. The `badge_scope` field
controls briefing presentation priority; `visibility` controls badge-filtered read access.

*Acceptance criterion:* `set_lore_entry("secret", "content", visibility="shared")`
creates a lore entry visible to Player badge. `set_lore_entry("gm_secret", "content")`
creates a `gm_only` entry invisible to Player badge.
_Check:_ T-new-298.

WHEN a lore entry's `visibility` is `gm_only` or `player_discovered`, trigger matching
SHALL additionally check `characters_present` (REQ-307): the entry fires only when at
least one entity who knows about it — via `reveal_secret` or the original revelation that
set `player_discovered` — is present in the current scene. `visibility: shared` entries
fire on keyword match regardless of presence (current behavior). Entries with no
`visibility` field (backward compatibility) SHALL follow the `gm_only` rule, applying the
presence check.

**REQ-155 — Sticky counter decay.** A lore entry's sticky counter decays by one
when the scene text changes such that the entry's trigger keywords are no longer
present. The counter resets to the entry's `sticky` value whenever trigger keywords
re-match. Decay occurs on state mutation (specifically `set_scene_state`), not on
read operations — calling `badge_briefing` multiple times without an intervening
scene change must not alter sticky counters. Entries whose sticky counter reaches
zero are deactivated in the next briefing assembly and removed from active lore
until re-triggered.
*Acceptance criterion:* An entry with `sticky: 3` triggered by scene A. Change
scene to B (no trigger keywords) — assert counter decrements by 1 per scene change.
Call `badge_briefing` twice on scene B — assert counter unchanged. After 3 scene
changes without re-triggering, assert entry no longer appears in `badge_briefing`
lore section. Revert scene back to A — assert counter resets to 3.
_Check:_ T299.

**REQ-328 — Lore-world coupling.** Lore entries SHALL accept an optional `world_target`
field — a room ID, thing ID, or exit reference in the world model. When `world_target`
is set, the lore entry SHALL trigger when the target is examined, entered, or
interacted with via parser navigation — not on keyword match. `world_target` SHALL
take precedence over `triggers` for activation: when both are present, the entry
fires on target interaction AND keyword match. Entries without `world_target` SHALL
use keyword matching per REQ-083 (current behavior). `suggest_lore` SHALL return
world-targeted entries whose target is reachable from the current scene — same room
or adjacent via open exit. World-targeted lore entries SHALL appear in `badge_briefing`
lore section with a `[world]` tag and the target name. The `world_target` field is
optional — backward compatible with all existing lore entries.
*Acceptance criterion:* `set_lore_entry("altar_secret", "The altar hums with power",
world_target="altar_01")` — lore fires when `resolve_intent("examine altar")` succeeds,
regardless of keyword match. `set_lore_entry("altar_secret", "The altar hums",
triggers=["altar"], world_target="altar_01")` — fires on both target interaction and
keyword match.
_Check:_ T-new-328.

**REQ-158 — Independent verification obligation.** A build claimed as complete SHALL
be accompanied by an independent verification report (§10) with a final verdict of
VERIFIED or VERIFIED WITH FINDINGS. A NOT VERIFIED verdict blocks the claim. The
independent verification report is operator-produced evidence — it is not a builder
artifact in the four-artifact diet. The builder does not control the verifier or its
output; the builder's obligation is to produce artifacts sufficient for a cold-checkout
verifier to execute the verification suite without the builder's assistance.
*Acceptance criterion:* A build's handoff directory, when handed to a verifier of a
different model following only README.md and AGENTS.md, produces a VERIFIED or
VERIFIED WITH FINDINGS report. The verifier report must be included with the build
when the build is claimed as complete.
_Check:_ H12, §10 Phase 1 execuability.

**REQ-084 — Action suggestions.** The server provides a `suggest_actions(intent)` tool
that maps a player's natural-language intent to ruleset-legal tool invocations.
Each suggestion entry carries three fields: the registered tool name, its REQ-015
action classification, and a one-sentence rationale connecting the intent to the
mechanic. Freeform prose without tool-name references is insufficient — the
LLM must be able to map a suggestion directly to a tool call. With an
intent string, it returns all matching actions from the ruleset registry that plausibly
correspond to the expressed intent. Because a single natural-language intent may
resolve to different mechanical approaches — a player declaring intent to persuade a
guard might approach it through persuasion, deception, or intimidation — the tool may
return multiple plausible tools for one intent. With an unrecognized intent — one for
which no registered tool or documented ruleset procedure plausibly corresponds — the
tool returns an empty list. Without an intent, it returns contextually relevant actions
based on current scene type (REQ-087), scene_state, entity conditions, and active
countdowns. The tool is pure-resolution (idempotent, no state mutation). Results are
badge-filtered: GM-only tools are excluded from Player results. The tool does not
fabricate actions — every suggestion maps to a registered tool or documented ruleset
procedure. Enrich-derived action patterns (§11.1) may supplement the matching index.
They are **inert** — visible at `enrichment://action_patterns` for review but excluded
from `suggest_actions` results until the GM activates them via the Novel-scoped action
pattern toggle (REQ-115). Unactivated enrich patterns remain reference-only and do not
influence tool output. `suggest_actions` is the canonical mechanism for
intent-to-tool mapping at runtime; the server provides no dedicated `use_tool` or
`lookup_rule` prompt for this function — directing callers to this tool instead
eliminates the redundancy of maintaining two surfaces for the same capability.
*Acceptance criterion:* `suggest_actions("persuade the guard")` returns matching
tools; `suggest_actions("xyzzy")` returns an empty list; enrichment patterns are
excluded from results until activated via `toggle_action_patterns`.
_Check:_ T68, T96, T120.

**REQ-084a — Proactive action surfacing.** IN addition to reactive intent-to-tool
mapping, THE server SHALL surface a `## Available Actions` section in `badge_briefing`
(REQ-109) — a decision-critical group after combat state and before lore. This section
lists mechanically legal actions the active entity can take given the current scene
state, entity capabilities, and ruleset. Actions SHALL be filtered:

- **Scene-type filtering.** Combat scenes (REQ-087) SHALL surface attack, dodge, spell,
  and condition-clearance actions. Social scenes SHALL surface persuasion, deception,
  and insight actions. Exploration scenes SHALL surface perception, investigation,
  and navigation actions.

- **Capability gating.** An action SHALL appear only when its mechanical prerequisites
  are met — a spell appears only when the entity has the required spell slot available;
  a class feature appears only when the entity possesses it and its per-rest uses are
  not exhausted; an equipment-dependent action appears only when the entity carries
  the equipment.

- **Count gating.** The section SHALL render at most 8 actions, prioritized by relevance
  to the current scene type. Actions are drawn from the registered tool surface — no
  fabricated actions. `suggest_actions` (REQ-084) remains the canonical intent-to-tool
  mapping; the proactive surface is a discovery aide, not a replacement.

- **Badge filtering.** After scene-type, capability, and count filters are applied, the
  remaining actions SHALL be filtered by the active badge: under the Player badge, only
  actions classified as Player or un-gated per the gate classification table (REQ-137)
  SHALL appear. Under the Game Master badge, all actions appear. Under the Observer badge
  (REQ-305), only read-only state-query actions appear. Filtering is applied last —
  a Player-legal action that passes all three prior filters is still suppressed if its
  tool is GM-only per REQ-137.

`badge_briefing` SHALL include an `available_actions` section token following the
existing token contract (REQ-082, REQ-185).

*Acceptance criterion:* During combat, `badge_briefing` `## Available Actions` lists
weapon attack, spell, and condition-clearance actions, filtered to the active entity's
capabilities. A wizard with no 3rd-level slots does not see "Cast Fireball." An entity
in a social scene sees persuasion and deception actions instead of combat actions.
`suggest_actions` continues to return reactive suggestions independently of the
proactive listing.
_Check:_ T-new-315.

**REQ-115 — Action pattern activation.** The server provides a
`toggle_action_patterns` tool — Game Master only. Calling it flips
the Novel-scoped action pattern activation state between enabled and
disabled. When enabled, enrich-derived action patterns (§11.1) supplement
the `suggest_actions` (REQ-084) matching index. When disabled, patterns
remain visible at `enrichment://action_patterns` for review but are
excluded from `suggest_actions` results. The toggle is pure-resolution
(idempotent, no state beyond the boolean). Player badge returns
`[ERROR] [FORBIDDEN]`.
*Acceptance criterion:* `toggle_action_patterns()` flips the Novel-scoped boolean;
when enabled, `suggest_actions` includes enrichment patterns; when disabled,
patterns remain at `enrichment://action_patterns` only.
_Check:_ T119.

**REQ-114 — Suggestion coverage.** The builder tests action suggestion coverage
against a curated intent set spanning every ruleset-defined action category
identified during discovery. Each curated intent entry records: the natural-language
intent text, the expected action categories per REQ-015 that the intent should map
to, and the ruleset section or enrichment source that defines the category. The full
curated set and its derivation are recorded in RULESET_MODEL.md. Coverage below
80% — fewer than 80% of curated intents for which `suggest_actions` returns at
least one tool matching the expected action categories — is recorded as a
suggestion-coverage finding in DECISIONS.md (5) with the uncovered categories and
their intents named. This is a build-time audit; suggestion mappings do not change
at runtime.
*Acceptance criterion:* The curated intent set in RULESET_MODEL.md covers every
discovered action category; coverage below 80% records the uncovered categories
and their intents in DECISIONS.md (5) with named uncovered categories.
_Check:_ T117.

**REQ-103 — Enrichment reversion.** The server provides a `revert_enrichment`
tool that removes all community enrichment state (tier 2, `[supplementary]`-tagged
items) from the Novel per REQ-227. Tier 1 enrichment (`[ruleset]`-tagged and
`[vendor]`-tagged items) persists — `revert_enrichment` SHALL NOT remove or alter
Tier 1 enrichment items.
tool — Game Master only. Removes all enrichment state (seven output modules from
§11.1), restoring the pre-enrich server state. Does not mutate mechanical fields,
build-derived tool registrations, badge gating rules, or any Tier 1 enrichment
content (tagged `[ruleset]` or `[vendor]`). Does not modify DECISIONS.md — the enrichment manifest and verification
results remain for audit.
GM-configured Novel state that references enrichment content —
briefing_order set via `set_briefing_order` (REQ-082) and the
action pattern activation toggle (REQ-115) — is Novel state, not
enrichment state. It survives reversion unchanged: the GM's
configuration choices persist even when the enrichment data they
reference is absent. After re-enrichment, these choices apply to
the new enrichment data without reconfiguration.
Build-rebuild enrichment behavior is defined in §11.1
(Rebuild scenarios). Player badge returns `[ERROR] [FORBIDDEN]`. Pure-state
tool: idempotent, fully reversible — re-running Enrich after reversion repopulates
enrichment state.
*Acceptance criterion:* After `revert_enrichment()`, all
community enrichment surfaces (enrichment resource URIs with `[supplementary]`
items) return empty or absent; ruleset-native enrichment items (`[ruleset]`-tagged)
persist unchanged; `lore://templates` returns only Novel-scoped lore entries, never
community enrichment-sourced templates; `spec_health` reports
`community_enrichment_active: false` with zero counts for community modules.
Re-running Enrich repopulates community modules; a second revert call changes
nothing (idempotent).
_Check:_ T94, T125.

**REQ-260 — Granular enrichment activation.** The Game Master may manage
enrichment items individually. `list_enrichment_items(module?, tier?)` returns
all available enrichment items with key, preview, source, source tag, and activated
status — Tier 1 resolved from current build output, Tier 2 from Novel JSON.
`activate_enrichment_item(module, key)` activates one item: Tier 1 adds the key to
the Novel's `enrichment_activated` keys; Tier 2 marks the item active in Novel
JSON. `deactivate_enrichment_item(module, key)` deactivates without removal —
Tier 1 removes the key from the activation set; Tier 2 marks the item inactive in
Novel JSON. `remove_enrichment_item(module, key)` permanently deletes a Tier 2 item
from the Novel JSON. Calling `remove_enrichment_item` on a Tier 1 item SHALL return
`[ERROR] [RULE_VIOLATION]` directing the caller to `deactivate_enrichment_item` —
Tier 1 items cannot be removed, only deactivated. The above activation, deactivation,
and removal tools are Game Master only. Activation and deactivation state persists
with the Novel. Existing `toggle_enrichment_module` and `revert_enrichment` tools
remain unchanged as convenience shortcuts.

The Player badge may call `activate_enrichment_item` and `deactivate_enrichment_item`
on items they authored (tagged `[player]`) — items stored under the
`player_enrichment` key in Novel JSON. Player-created items are active immediately
upon creation; `deactivate_enrichment_item` suppresses a player item from the player's
`badge_briefing` and enrichment surfaces without deleting it. The Player may NOT call
`remove_enrichment_item` — they use `player_remove_enrichment` (REQ-261) for their
own items. Player badge attempts to activate, deactivate, or remove any item NOT tagged
`[player]` SHALL return `[ERROR] [FORBIDDEN]`.

*Acceptance criterion:*
`list_enrichment_items(tier=1)` shows all Tier 1 items with activation status
and source tag;
`activate_enrichment_item("voice_examples", "goblin-snarl")` activates the item
and it appears in enrichment surfaces;
`deactivate_enrichment_item("voice_examples", "goblin-snarl")` removes it from
surfaces; `remove_enrichment_item("voice_examples", "goblin-snarl")` on a Tier 1 item
returns `[RULE_VIOLATION]`; on a Tier 2 item it permanently deletes it;
Player calls `deactivate_enrichment_item` on a `[player]` item — item hidden from
player briefing; Player calls `activate_enrichment_item` on a `[ruleset]` item —
returns `[FORBIDDEN]`.

_Check:_ T-new-260.

**REQ-261 — Player enrichment.** The player may create enrichment items in a
player-facing subset of enrichment modules: `voice_examples`, `action_patterns`,
`supplementary_guidance`, `narrative_voices`, and `lore_templates` — modules where
player-authored content enriches the shared story experience. Three tools provide
player enrichment:

`player_enrich(module, key, content, triggers?, badge_scope?)` creates a `[player]`-tagged
enrichment item in the specified module. `key` is a unique snake_case slug within
the module. `content` is a Markdown string. `triggers` is an optional keyword array
for lore_templates (ignored for other modules). `badge_scope` defaults to `shared`
— the item is visible to both Player and GM badges. The player may set `badge_scope` to
`player` to keep the item private. `player_remove_enrichment(module, key)` removes a
`[player]`-tagged item. Returns `[RULE_VIOLATION]` if the item is not player-authored.
`player_list_enrichment(module?)` lists all `[player]`-tagged items, optionally filtered
by module, with key, preview, scope, and activated status.

Player-created items are stored in the Novel JSON under a `player_enrichment` key,
organized by module. Items survive restarts and follow the Novel's persistence
contract (REQ-092). Player items are active immediately upon creation — the player
does not need to activate them separately. The player may `deactivate_enrichment_item`
on their own items to suppress them from their briefing without deletion. Player items
are subject to the same per-module budget caps as community enrichment (§11.1), with a
per-module player cap of 15 items each. The GM badge sees player enrichment items in
`list_enrichment_items` and in `badge_briefing` filtered by the item's `badge_scope`.
The GM may not modify or remove player enrichment items — attempts return
`[FORBIDDEN]` — but may override an item's `badge_scope` from `shared` to `game_master`
to incorporate it into the GM's active enrichment set. `revert_enrichment` (REQ-103)
and `revert_novel_enrichment` (REQ-265) SHALL NOT remove `[player]` items.
Player badge only.

*Acceptance criterion:*
`player_enrich("action_patterns", "feint-suggestion", "When I feint, suggest
deception check")` creates an item that appears in the player's `suggest_actions`
output and in the GM's `badge_briefing` (shared scope);
`player_enrich("voice_examples", "growl", "Get away from my hoard!", [],
"player")` creates a private item visible only to the Player badge;
`player_remove_enrichment("action_patterns", "feint-suggestion")` removes it;
`player_remove_enrichment` on a Tier 1 `[ruleset]` item returns `[RULE_VIOLATION]`;
`player_list_enrichment()` returns all player-authored items with module, key,
preview, and scope; GM badge returns `[FORBIDDEN]` on player enrichment tools;
player items survive server restart.

_Check:_ T-new-261.

**REQ-262 — Novel enrichment tier.** The server SHALL support a third enrichment tier, tagged
`[novel]`, synthesized from the active Novel's own state. Items carry source
citations of the form `novel://<slug>/<source_type>/<identifier>` — e.g.,
`novel://my-campaign/lore/tavern-rumor`. Items are stored in full within the
Novel JSON under a `novel_enrichment` key, alongside Tier 2 community items per
REQ-092. Items persist with the Novel across server restarts. Items are
Novel-scoped — they do not transfer between Novels. Items are removed by
`revert_novel_enrichment` (REQ-265), not by `revert_enrichment` (REQ-103).
Items are inert — they do not auto-apply to any surface. The GM activates
individual `[novel]` items via the same granular tools as Tier 1 and Tier 2
(REQ-260). The Player may deactivate individual `[novel]` items via
`deactivate_enrichment_item` when the GM has overridden their scope to
`shared` or `player` (REQ-261).

*Acceptance criterion:* `list_enrichment_items(tier=3)` returns items tagged
`[novel]` with Novel-scoped source citations. `revert_enrichment` does not
remove `[novel]` items — they persist unchanged. `revert_novel_enrichment`
removes all `[novel]` items. After `end_novel`, `[novel]` items are discarded
with the Novel JSON.

_Check:_ T-new-262.

**REQ-263 — Novel enrichment synthesis tool.** The server provides a
`synthesize_novel_enrichment(force?)` tool — Game Master only. It analyzes the
Novel's state across six source categories and produces enrichment items for
each output module that has synthesizable content:

1. **NPCs** (personality, disposition, goals, voice examples) → voice example
   candidates, NPC spotlight suggestions.
2. **Lore entries** → cross-referenced connections between related entries,
   suggested new lore templates.
3. **Story journal** → narrative tone profile, unresolved thread detection,
   pattern synthesis across entries.
4. **Scene history + current scene** → prep suggestions, unresolved hooks,
   scene pacing notes.
5. **Factions + secrets + relationships** → faction conflict suggestions,
   secret-revelation timing, NPC relationship gap recommendations.
6. **Countdowns** → pacing warnings, suggested new countdowns, tension
   scaling recommendations.

Modules that produce no synthesizable content produce empty sections with
`[novel] [empty]` markers. The tool records a `novel_enrichment_fingerprint` —
a hash of the Novel state at synthesis time — to detect staleness without
re-synthesis. Calling the tool when no Novel state has changed since the last
synthesis returns `[OK] Novel enrichment up to date — <ISO 8601 timestamp>`.
The `force` parameter bypasses the staleness check and re-synthesizes all
modules. Items produced by synthesis are inert (inactive by default) — the GM
must activate them via REQ-260. Player badge returns `[FORBIDDEN]`.

*Acceptance criterion:* Calling `synthesize_novel_enrichment()` with NPCs
possessing personality fields produces `[novel]` voice examples with
`source: novel://<slug>/npc/<npc_id>`. Calling again with no state changes
returns the up-to-date message with timestamp. Calling with `force=true`
re-synthesizes regardless. Player badge returns `[FORBIDDEN]`.

_Check:_ T-new-263.

**REQ-264 — Novel enrichment auto-trigger.** When
`TTRPG_NOVEL_ENRICH_AUTO_TRIGGER` is set to one of `off` (default),
`on_session_start`, or `on_scene_change`, the server SHALL trigger
`synthesize_novel_enrichment` automatically per the selected threshold.
`on_session_start`: triggers when `TTRPG_SESSION_ID` changes (a
`[session_boundary]` marker is inserted per REQ-237). `on_scene_change`:
triggers after every `set_scene_state` call. Auto-triggered synthesis uses the
staleness fingerprint — if no relevant state changed since the last synthesis,
synthesis is skipped. Auto-triggered items are inert (inactive by default) —
the GM must activate them. The auto-trigger threshold is visible in
`spec_health` as `novel_enrich_auto_trigger: <threshold>`. When a
ruleset-free Novel has no entities, NPCs, or story journal entries, synthesis
produces empty modules with `[novel] [empty — no state]` markers.

*Acceptance criterion:* With `TTRPG_NOVEL_ENRICH_AUTO_TRIGGER=on_session_start`,
a session boundary marker triggers synthesis. With `off`, synthesis requires
explicit `synthesize_novel_enrichment` invocation. Auto-synthesized items
appear in `list_enrichment_items(tier=3)` with `activated: false`. A ruleset-free
Novel with no populated state produces empty module markers.

_Check:_ T-new-264.

**REQ-265 — Novel enrichment removal.** The server provides a
`revert_novel_enrichment` tool — Game Master only. Removes all
`[novel]`-tagged enrichment items from the Novel JSON. Does not affect
Tier 1 (`[ruleset]`) or Tier 2 (`[supplementary]`) items. Does not
affect the staleness fingerprint — the GM may re-synthesize immediately
after removal. Pure-state, idempotent — calling on a Novel with no
`[novel]` items returns `[OK] No novel enrichment to revert`. Player
hat returns `[FORBIDDEN]`. `revert_enrichment` (REQ-103) SHALL NOT
remove `[novel]` items — the three tiers have independent removal
boundaries.

*Acceptance criterion:* After `revert_novel_enrichment()`,
`list_enrichment_items(tier=3)` returns 0 items. Tier 1 and Tier 2
items are unchanged. `revert_enrichment` does not remove `[novel]`
items. Calling `revert_novel_enrichment` on an empty `[novel]` tier
returns the idempotent OK message.

_Check:_ T-new-265.

**REQ-266 — Novel enrichment confidence model.** All `[novel]` items carry a
`confidence` field reflecting their synthesis source, not external authority.
Items derived from explicit Novel fields — NPC personality text, voice
examples, named relationships, faction descriptions, secret content — carry
`MEDIUM`. Items derived from inference — pattern detection across story
journal entries, cross-referenced lore connections, scene-theme extraction,
countdown tension analysis — carry `LOW`. Items carry a `[novel]` tag in
addition to the confidence tag. The tag pair (`[novel] [MEDIUM]` or `[novel]
[LOW]`) signals both provenance and reliability. `[novel]` items do not carry
the `[stale]` flag — they are regenerated on demand, not collected at a fixed
time. When a source field changes (e.g., NPC personality is edited), the
corresponding `[novel]` item's `collected_at` timestamp is updated to reflect
the synthesis time. Confidence is re-evaluated on each synthesis pass — an
item that was `MEDIUM` may become `LOW` if its source was replaced with
inferred content.

*Acceptance criterion:* A voice example synthesized from an NPC's explicit
personality field carries `[novel] [MEDIUM]`. A "recurring theme" insight
derived from cross-referencing three story journal entries carries `[novel]
[LOW]`. After editing an NPC's personality, re-synthesis updates the
`collected_at` timestamp for that NPC's items.

_Check:_ T-new-266.

**REQ-267 — Novel enrichment in badge_briefing.** `[novel]` items appear in
`badge_briefing` under their respective enrichment sections, tagged `[novel]`
with confidence, alongside Tier 1, Tier 2, and `[player]` items. Badge filtering follows
the same rules as Tier 2 items (REQ-159): items assigned `badge_scope:
game_master` are hidden from the Player badge. `[novel]` item badge scope
defaults to `game_master` — they are GM prep aids by nature. The GM may
override the scope to `shared` or `player`. The Player may deactivate individual
`[novel]` items via `deactivate_enrichment_item` when the GM has overridden their
scope to `shared` or `player` (REQ-260). When no `[novel]`
items are active, `badge_briefing` SHALL NOT include an empty `[novel]` section —
unlike Tier 1 and Tier 2 enrichment sections which require explicit
empty-state markers per REQ-109. The absence of `[novel]` content is not a
deficiency to signal.

*Acceptance criterion:* `[novel]` items appear in `badge_briefing` under their
respective enrichment sections tagged with `[novel]` and confidence, alongside
`[ruleset]`, `[supplementary]`, and `[player]` items. Player
badge sees only items whose scope is `shared` or `player`. Deactivated items via
REQ-260 are hidden from the Player badge. After `revert_novel_enrichment`,
`[novel]` items are absent from `badge_briefing` with no empty-section marker.

_Check:_ T-new-267.

**REQ-268 — Novel enrichment in enrichment dashboard.** `enrichment://status`
(REQ-230) SHALL include a `novel` column in its per-module table, showing
`[novel]` item counts alongside Tier 1 and Tier 2 counts — three columns:
`ruleset-native`, `community`, `novel`. `spec_health` SHALL surface
`novel_enrichment_status` with per-module activated/total counts and the
last synthesis timestamp (`novel_enrichment_last_synthesis` as ISO 8601).
`enrichment://status` SHALL include a `novel_enrichment` section with the
auto-trigger threshold, last synthesis timestamp, and a per-module breakdown
of `[novel]` item counts. When no `[novel]` items exist,
`enrichment://status` SHALL include the `novel` column with zero counts — the
column is always present.

*Acceptance criterion:* `enrichment://status` displays three columns per
module: ruleset-native, community, novel. `spec_health` includes
`novel_enrichment_last_synthesis` timestamp and `novel_enrichment_status`
with per-module counts. After `synthesize_novel_enrichment()`, the `novel`
column shows non-zero counts for populated modules.

_Check:_ T-new-268.

**REQ-130 — Enrichment rebuild contract.** Re-running the Enrich workflow against a Novel that already contains
enrichment state SHALL preserve every enrichment item that the Game
Master has incorporated into active Novel state through any Novel-scoped
tool call. An enrichment item is "activated" when a Novel-scoped GM tool
call causes it to appear in at least one tool-observable surface (tool
output, resource, or prompt) for the current Novel. Items never
incorporated into active state — those that appear only in enrichment
resource surfaces — are "inactive." The builder may replace inactive
enrichment items with fresh enrich output. Activated items SHALL NOT be
removed, downgraded, or altered in their activated state by
re-enrichment. The enriched state's foundational principle — additive,
inert, never modifying mechanical fields — extends to replacement:
replacing inactive items is not modifying; removing or downgrading
activated items is modifying and is forbidden. The builder SHALL record
whether replacement preserved activated items or performed a full
replacement in DECISIONS.md (5). Full replacement — removing all
enrichment including activated items — requires `revert_enrichment`
(REQ-103) before re-running Enrich.
*Acceptance criterion:* Create lore entry from enrich template, activate
it. Re-run enrich — assert the activated entry persists unchanged. Revert
enrichment, re-run enrich — assert fresh enrich state replaces all.
_Check:_ T144.

**REQ-226 — Narrative voice profiles.** The builder SHALL extract media-cited
narrative voice profiles from the ruleset's inspirational media citations
("Appendix N," "Inspirational Reading," "Suggested Viewing," or equivalent sections
discovered during the guidance pass). Each profile records: `name` (e.g., "Sword &
Sorcery — Conan"), `source` (ruleset anchor), `media_title`, `media_type` (film,
novel, game, or other), and `description` (narrative techniques and stylistic
markers from the source material). Community enrichment (§11.1) may add
supplementary profiles. Stored at `enrichment://narrative_voices`. Profiles are
inert — the GM applies them via narrative directive (REQ-081) by naming the
profile. When the ruleset provides no inspirational media section, the builder SHALL
attempt to populate the module from vendor content — IF Craft Corpus genre
conventions and BitD thematic advice (§11.2). When both ruleset and vendor
sources produce no narrative voice profiles, the module is empty — this is
not a defect. Ruleset-free builds produce an empty module when vendor content
is also absent.
*Acceptance criterion:* A ruleset citing Conan and The Lord of the Rings produces
≥2 narrative voice profiles with source anchors and descriptions.
_Check:_ T-new-226.

**REQ-227 — Two-tier enrichment model.** Enrichment SHALL consist of exactly two
tiers: Tier 1 (ruleset-native + vendor) extracted at build time from two sources —
the ruleset's own text per REQ-225 and the vendor content bundles in
`holonovel/narrative_world_model/` per §11.2 — populated at build time, never
removed by `revert_enrichment`. Tier 1 items carry `[ruleset]` or `[vendor]` tags
with source anchors. Tier 2 (community) optionally collected via web research per
§11.1, defaults to off at intake, tagged `[supplementary]`, removed by
`revert_enrichment`. Both tiers coexist in all enrichment resource URIs and
`badge_briefing` enrichment sections. The GM activates items from either tier via the
same tool calls. Community items SHALL NOT replace or override ruleset-native or
vendor items with matching keys — conflicts are recorded with `conflicts_with`
reference to the Tier 1 item. Tier 1 enrichment is part of the build output;
community enrichment is additive post-build and off by default.
*Acceptance criterion:* A build with ruleset content SHALL populate Tier 1
enrichment (ruleset-native + vendor) in the Novel at creation time; community
enrichment, when run, adds `[supplementary]` items alongside `[ruleset]` and
`[vendor]` items; `revert_enrichment` removes only `[supplementary]` items.
_Check:_ T-new-227.

**REQ-228 — Enrichment consistency during spec-driven updates.** During a
spec-driven update per REQ-098, after the gap audit identifies changed surfaces,
the builder SHALL scan all enrichment items (both tiers) for references to surfaces
identified as changed or removed in the gap audit. Orphan references SHALL be
classified: `auto-repairable` (tool was renamed — update the enrichment reference
to the new name), `GM-review` (the referenced surface was removed — the GM should
review and replace the enrichment item), or `stale-reference` (the surface is
absent with no obvious replacement). GM-activated items (REQ-130) with orphan
references carry a `[stale-reference]` tag in `spec_health` until the GM resolves
them. This check SHALL run before Pattern Buffer re-execution (§6.7) and SHALL NOT
trigger web research — it is a cross-reference scan only. Results are recorded in
DECISIONS.md with the gap audit row reference.
*Acceptance criterion:* After a Minor update that renames a tool, ruleset-native
enrichment action patterns referencing the old tool name are flagged
`auto-repairable` and updated before the re-build completes. A community enrichment
item referencing a removed ruleset section is flagged `GM-review` with the gap
audit row cited.
_Check:_ T-new-228.

**REQ-230 — Enrichment status dashboard.** The server SHALL provide an
`enrichment://status` resource showing per-module enrichment counts for the active
Novel: total items, activated items (GM-activated via Novel-scoped tool calls),
inactive items, stale community items, and pending-suggestion count (enrichment
items matching current adventure/scene content but not yet activated). Counts are
per output module (voice_examples, briefing_order, lore_templates, action_patterns,
supplementary_guidance, adventure_advice, narrative_voices). The resource SHALL
render as Markdown with a header line "Enrichment Status" and one `##`-level
section per module. Ruleset-native items are counted separately from community
items within each module. The status SHALL be dynamically computed from Novel state
at read time. The resource respects badge filtering per REQ-032. `spec_health`
SHALL surface a summary: `enrichment_status` with per-module activated/total
counts.
*Acceptance criterion:* After activating 2 lore templates and 1 voice example,
`enrichment://status` shows lore_templates: activated=2, total=N; voice_examples:
activated=1, total=N. Other modules show activated=0. Player badge sees only
shared-scope items.
_Check:_ T-new-230.

**REQ-231 — Per-module enrichment toggle.** The GM may enable or disable
individual enrichment output modules at runtime via `toggle_enrichment_module(module,
enabled)`. Module SHALL be one of: `voice_examples`, `briefing_order`,
`lore_templates`, `action_patterns`, `supplementary_guidance`, `adventure_advice`,
`narrative_voices`. Disabling a module SHALL suppress all items in that module
from `badge_briefing`, `suggest_actions`, `suggest_lore`, and enrichment resource
URIs for the current Novel. Disabling does not delete items — the items persist in
Novel state and re-appear when the module is re-enabled. Ruleset-native modules
default to enabled; community modules default to enabled when community enrichment
has been run. The toggle state persists with the Novel. Player badge attempts return
`[ERROR] [FORBIDDEN]`. An unknown module name returns `[INVALID_INPUT]` with valid
module names enumerated.
*Acceptance criterion:* `toggle_enrichment_module("voice_examples", false)` removes
voice examples from `badge_briefing` and `enrichment://voice_examples` for the active
Novel; re-enabling restores them; an unknown module returns `[INVALID_INPUT]`;
Player badge returns `[FORBIDDEN]`.
_Check:_ T-new-231.

**REQ-243 — Enrichment population during spec-driven updates.** During a
spec-driven update per REQ-098, after the gap audit implements new or changed
surfaces and before Pattern Buffer re-execution, the builder SHALL run a scoped
ruleset-native enrichment re-classification. The builder: (a) identifies new or
changed surfaces from the gap audit's implemented-disposition rows — surfaces are
tools, resources, prompts, or state fields; (b) maps each surface to the source
ruleset sections that produced it, using the extraction citations in
RULESET_MODEL.md; (c) runs REQ-225 classification on only those sections,
producing new `[ruleset]`-tagged items; (d) merges new items into the existing
enrichment manifest — appending to modules, never replacing existing items;
(e) records the added item count per module in DECISIONS.md alongside the gap
audit row reference. When the gap audit identifies no new surfaces (patch-level
change), this step SHALL be skipped with a "no new surfaces — skipped" annotation.
The scoped re-classification SHALL NOT trigger a full re-read of the ruleset —
only the sections that produced the new surfaces are re-read. This step SHALL
NOT trigger web research. Community enrichment items are not affected.
*Acceptance criterion:* After a Minor update that adds a new `lookup_<category>`
tool, ruleset-native action_patterns and supplementary_guidance receive new
`[ruleset]` items for the new tool. DECISIONS.md records the added count per module.
_Check:_ T-new-243.

**REQ-244 — Convergence cache key.** The builder SHALL compute a convergence
cache key at the start of Phase 1, composed of five components: the ruleset
content hash (REQ-044, sentinel `"none"` for ruleset-free), the specification
content hash (REQ-187), the holonovel package version (B10), an aggregate hash
of the `holonovel/narrative_world_model/` vendor directory, and a narrative surface hash — a
SHA-256 of the sorted, concatenated tool names, resource URIs, and prompt names
for all narrative-category tools (excluding Novel lifecycle and Badge & Workflow
tools). When the cache key matches a prior successful
convergence recorded in DECISIONS.md (5), the builder MAY skip Phase 1 metrics
whose inputs are fully captured by the key — all nine metrics when the key
matches, or individual metrics when a partial match is detected. Phase 2 metrics
that depend on extraction quality (mechanics fidelity, suggestion coverage) MAY
be skipped when the extraction model is unchanged; Phase 2 metrics that depend
on builder implementation quality (MUST coverage, process compliance, surface
terminology, prompt health, resource URI completeness, truncation accuracy)
SHALL always run fresh. Every skipped metric SHALL be recorded in DECISIONS.md
(5) with the annotation `cached — convergence fingerprint match` and the cache
key that produced the match. The operator MAY override the cache at intake with a
`--no-cache` flag that forces the full convergence loop regardless of cache-key
match. In non-interactive mode the defaults apply — cached results are reused
when available. A full rebuild (cold checkout, no prior DECISIONS.md) has no
cache key to match and runs the full convergence loop. In `quick-build` mode the
cache key is still computed but Phase 1 metrics are always reported fresh —
quick-build runs the full convergence loop for speed-versus-correctness
trade-off tracking. A partial match — one component differs while the rest
are unchanged — SHALL record which component differed and which metrics were
cached in DECISIONS.md (5).
*Acceptance criterion:* A TTRPG build against a ruleset whose prior build
recorded a matching convergence cache key in DECISIONS.md (5) reports Phase 1
metrics as `cached — convergence fingerprint match` and skips the
measurement/improvement iteration loop. A build with `--no-cache` runs the full
convergence loop regardless of key match. A cold checkout (no prior
DECISIONS.md) runs the full convergence loop.
_Check:_ T-new-244.

**REQ-245 — Pre-computed enrichment manifest.** The holonovel package SHALL ship a
`CONVERGENCE.md` manifest at the package root recording Phase 2 convergence
results per package version: the holonovel package version, the specification version the
manifest was computed against, all eight Phase 2 convergence metric results, and
Holonovel Pattern Buffer sub-workflow outcomes (I1–I18, per-sub-workflow pass/fail with
ISO 8601 timestamps). When the specification version recorded in the manifest
matches the current specification version, the holonovel package builder MAY skip Phase 2
convergence and the Holonovel Pattern Buffer, recording `cached — holonovel vX.Y.Z
convergence manifest` in DECISIONS.md (5) and (6). When the specification
version has advanced, the builder SHALL run convergence and the Holonovel
Pattern Buffer fresh and update the manifest with the new results and spec version.
TTRPG builders consuming the holonovel package as a dependency SHALL NOT load or
reference this manifest — it applies only to holonovel package builds.

A ruleset source MAY include a pre-built enrichment manifest
(`enrichment_manifest.json` alongside the ruleset Markdown) containing the
seven-module REQ-225 extraction output, each module's `[ruleset]`-tagged items
with source anchors and confidence labels, the ruleset content hash it was
extracted from, and the specification version used for extraction. During
Discovery, before running REQ-225 classification, the builder SHALL check for
this manifest. When the manifest is present AND the specification version
recorded in the manifest matches the current specification version AND the
manifest's ruleset content hash matches the current ruleset content hash: the
builder SHALL use the pre-built manifest, recording `pre-built enrichment
manifest — validated` in DECISIONS.md (4). When any validation condition fails,
the builder SHALL fall back to live REQ-225 extraction with the annotation
`pre-built enrichment manifest — <failure reason>, live extraction` in
DECISIONS.md (4). When no manifest is present, the builder proceeds with live
extraction as normal.
*Acceptance criterion:* A holonovel package build whose CONVERGENCE.md spec
version matches the current spec reports Phase 2 metrics and Holonovel Pattern Buffer
results as cached. A TTRPG build against a ruleset with a valid pre-built
enrichment manifest skips REQ-225 extraction and uses the manifest. A ruleset
without a manifest runs live REQ-225 extraction as before.
_Check:_ T-new-245.

**REQ-085 — Macro system.** The server expands macro tokens of the form `{{<path>}}`
in all tool output, resource text, and prompt text before delivery. Supported macros:
`{{entity.name}}`, `{{entity.hp}}`, `{{entity.<stat>}}` (per-ruleset stat names),
`{{scene.current}}`, `{{scene.type}}`, `{{countdown.<name>.remaining}}`,
`{{countdown.<name>.total}}`, `{{countdown.<name>.scope}}`,
`{{countdown.<name>.direction}}`, `{{novel.slug}}`, `{{badge.active}}`, `{{party.size}}`.
Macros referencing nonexistent state expand to the literal token unchanged. Macro
expansion occurs after output composition and before client delivery. Macros do not
expand in audit log entries.
*Acceptance criterion:* `{{entity.name}}` in tool output expands to the active
entity's name; `{{nonexistent.path}}` expands to the literal token unchanged;
macros do not expand in audit log entries.
_Check:_ T69.

**REQ-086 — Audit compression.** The server provides a `compress_audit(max_entries)`
tool that returns a Markdown-formatted prompt with a header line — "Compressed audit log
(summarize into a single paragraph):" — followed by one line per entry in the format
`[timestamp] [badge] tool_name — output_prefix` for mutating entries or
`[timestamp] [badge] tool_name — [BOUNDARY_VIOLATION]` for forbidden-call entries
(REQ-133). The tool does not modify the audit log (REQ-040). Output is badge-filtered:
Player sees entries where the recorded badge is
`player` or where the entity affected by the entry is owned by the current
player (per the entity-ownership filter defined in REQ-168, applied to
compress_audit output); Game Master sees all. `max_entries` is a positive
integer; values ≤ 0 return `[ERROR] [INVALID_INPUT]`. The tool is pure-generation
(idempotent, no server-side state mutation).
*Acceptance criterion:* `compress_audit(50)` returns a formatted prompt of the
50 most recent entries; Player badge sees only own-entity entries; `compress_audit(0)`
returns `[INVALID_INPUT]`.
_Check:_ T70.

**REQ-087 — Scene type tagging.** The Game Master may tag the current scene with one or
more type strings. The default catalog — always present — is `social`, `exploration`,
`neutral`. The builder SHALL extract additional scene types from the ruleset's guidance
and activity-pillar descriptions (e.g., `crafting`, `investigation`, `survival`,
`hacking`). Extracted types merge with the default catalog; the builder SHALL record
the full resolved catalog in DECISIONS.md. Combat is not a scene type — it is a
resolution mode with dedicated state (REQ-043); combat presence is signalled by the
combat state group in `badge_briefing`, not by a scene type tag.

Multiple scene types may be active simultaneously (e.g., `["social", "exploration"]`
for negotiation during a journey). The `scene_type` parameter on `set_scene_state`
accepts either a single type string or an array of type strings. The type tags are
guidance — they affect `badge_briefing` composition (tools matching any active type are
ordered before unmatched tools) and `suggest_actions` filtering (actions matching any
active type are prioritized), but do not alter tool behavior, dice results, or rules
enforcement. The types persist with the Novel. Player badge attempts return
`[ERROR] [FORBIDDEN]`. Confrontation tools (REQ-043) operate identically regardless of
scene type; the tag guides the GM and LLM toward moves matching the scene type.
*Acceptance criterion:* The `scene_type` parameter on `set_scene_state` with
`["social", "exploration"]` orders social and exploration tools before unmatched tools
in `badge_briefing`; a single string `"exploration"` works for backward compatibility.
_Check:_ T71, T135.

**REQ-125 — Scene transition hook.** When `set_scene_state` is called and the new
description differs from the current `scene_description`, the server records a
`[scene_transition]` audit entry with the old and new descriptions and a timestamp.
This is automatic — no additional tool call is required. Countdowns of either type
(`round` or `narrative`) carrying the `on_scene_transition` flag (REQ-073) decrement
by one tick on transition. Calling `set_scene_state` with a `skip_transition_hook` parameter
suppresses the audit entry and countdown decrement for cases where the GM is updating
the same scene without transitioning it (e.g., adding descriptive detail). The Player
badge sees scene transitions in `scene://history`; GM-only mechanics (audit entry,
countdown decrement) are invisible to the Player badge.
*Acceptance criterion:* `set_scene_state("cave", skip_transition_hook=true)`
does not record a `[scene_transition]` audit entry; a countdown with
`on_scene_transition=true` decrements on scene change.
_Check:_ T136.

*Out of scope:* AI content generation at runtime (all generation is build-time),
real-time web enrichment, and narrative quality assessment beyond the anti-slop
guidance catalog.

**REQ-234 — Secrets and knowledge.** The Game Master may manage hidden information
with per-entity visibility. `set_secret(key, content, triggers?, badge_scope?)`
creates a secret lore entry visible only to the Game Master badge. `reveal_secret(key,
entity_id)` makes a secret known to a specific entity — the entity's `character_sheet`
SHALL include the secret text in a "Known Information" section. `check_knowledge
(entity_id, key?)` returns what secrets an entity knows; without `key`, returns all
known secrets. Secrets are functionally lore entries with a knowledge-visibility
layer — they follow the same persistence, grouping, and export contracts as lore
(REQ-083, REQ-094). Resource: `secrets://active` — GM-filtered, lists all secrets
and their known-by status.
*Coupling:* When a secret implicates another entity or faction (detected by name
overlap between the secret text and registered entity/NPC/faction names), a
`suspicious` relationship (REQ-236) SHALL be recommended between the
knowledge-holder and the implicated entity. The recommendation SHALL be surfaced
in `badge_briefing` for the Game Master badge only.

`reveal_secret(key, target_id)` SHALL accept faction identifiers as `target_id` alongside
entity identifiers. `check_knowledge(faction_id, key?)` SHALL accept faction identifiers
alongside entity identifiers and SHALL return secrets known to the faction. Faction-known
secrets SHALL surface at `faction://<id>` for the GM badge. WHEN a faction is revealed a
secret that names another faction in its content, a `rival` relationship (REQ-236) SHALL
be recommended between the knowledge-holding faction and the named faction.

*Acceptance criterion:* `set_secret("murder_confession", "The butler killed Lord
Ashworth")` creates a GM-only lore entry; `reveal_secret("murder_confession",
"pc_detective")` adds "Known Information" to the detective's character sheet;
`check_knowledge("pc_detective")` returns the secret.
_Check:_ T274.

### 5.9 Novel Persistence and Transport

**REQ-088 — Novel lifecycle.** A Novel is a named, persistent save file on disk.
`create_novel(name, description?)` creates a new Novel at `.holonovel-state/novels/<slug>.json`
and activates it for the calling connection. An optional `codex_adventure` parameter —
a Codex entry ID of kind `adventure` — bootstraps the Novel in one atomic operation:
creates the Novel, imports the Codex adventure scaffold (world-model, NPCs, factions,
lore, enrichment linkages per REQ-321), and marks `adventure_set: true` in Novel
metadata. When `codex_adventure` is provided and the referenced Codex entry does not
exist or is not of kind `adventure`, `create_novel` SHALL return `[ERROR] [NOT_FOUND]`.
When no Codex entries exist on the server, the parameter is ignored silently.
`description` is an optional free-text field
(one paragraph recommended), stored in the Novel JSON, surfaced in `novel://current`,
`list_novels`, `novel_info`, and `export_novel` manifest. `resume_novel(slug)` activates an existing Novel
from disk. `switch_novel(slug)` (REQ-095) switches the active Novel for a connection.
`end_novel()` emits a `[NEED_INPUT]` workflow decision — "End Novel `<slug>`?" — with
options `yes` and `cancel`. On `yes`: deactivates badge, clears undo stacks, removes
the Novel's save file and its backup from disk (no orphaned state), and the roster
survives. On `cancel`: restores pre-invocation state unchanged. `resume_novel(slug)`
returns `[STATE_CONFLICT]` if no file exists at
`.holonovel-state/novels/<slug>.json` (whether removed by `end_novel` or never created).
Multiple Novels may coexist on disk per server instance. One Novel is active per connection
at a time (REQ-030); a connection may switch between Novels via `switch_novel` (REQ-095).
Character creation, character import, and NPC creation are Novel-scoped operations — they
require an active Novel. Without one, they return `[STATE_CONFLICT]` directing the operator
to `create_novel`. Silent orphan creation — adding an entity to the roster without a Novel
association — is a defect. `[STATE_CONFLICT]` if no Novel active when a Novel-scoped tool is
called. Server start without `TTRPG_NOVEL` operates with no Novel active — Novel-scoped
tools direct users to create or resume one. For backward compatibility, the builder may
accept `end_game` as a deprecated alias for `end_novel`; the alias is not required
and may be logged as deprecated in `spec_health`. WHEN `TTRPG_NOVEL` is set at
server startup, THE system SHALL attempt to activate the Novel named by the env
var before servicing any tool call. If a Novel matching the slug exists on disk,
the server resumes it (equivalent to `resume_novel(slug)`). If no such Novel
exists, the server creates one with the given name (equivalent to
`create_novel(name)`). In either case, the Novel is the active Novel before the
first tool call or prompt is served. If `TTRPG_NOVEL` is set but activation
fails for any reason other than non-existence (e.g., corrupt file, checksum
mismatch), the server reports the error in stderr and `spec_health`, and
proceeds with no Novel active — it does not silently swallow the error.
*Acceptance criterion:* `create_novel("my-novel",
"A noir detective story set in a rain-soaked city.")` creates `novels/my-novel.json`
and stores the description; `end_novel()` prompts `[NEED_INPUT]` with yes/cancel; on
"yes", the file is moved to `.trash/` and the roster survives.
`create_novel("dragon-game", codex_adventure="dragon-hoard")` creates the Novel and
imports the dragon-hoard Codex adventure scaffold atomically;
`create_novel("broken", codex_adventure="nonexistent")` returns `[NOT_FOUND]`.
_Check:_ T72, T73, T98, T159, T-new-335.

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

**REQ-095 — Novel switching.** `switch_novel(slug)` (always callable regardless of badge)
deactivates the connection's current Novel and activates the target Novel identified by
slug. The target must exist on disk and must not have been ended (file must be present at
`.holonovel-state/novels/<slug>.json`). Returns `[STATE_CONFLICT]` if the slug does not
exist or the target Novel's file is absent. When switching, the active badge for the
target Novel is restored from the Novel's persisted badge state (REQ-055). If no Novel
is currently active, `switch_novel` activates the target directly (equivalent to
`resume_novel(slug)` without requiring a fresh server start). Novel-scoped tools operate on
the connection's active Novel. Each connection maintains its own active Novel reference;
two connections may have different Novels active simultaneously.
*Acceptance criterion:* `switch_novel("other-novel")` deactivates the current Novel
and activates the target; the target's persisted badge is restored; switching to a
nonexistent slug returns `[STATE_CONFLICT]`.
_Check:_ T98.

**REQ-256 — Rename Novel.** `rename_novel(new_slug)` (Game Master
only) renames the active Novel's save file on disk and updates the slug in
state. Returns `[STATE_CONFLICT]` if the target slug already exists on disk
or if the active Novel is active in another connection. The Novel's
`.bak.N` files are renamed to match. The rename is atomic — the server
SHALL NOT leave the Novel in a state where the slug differs from the
filename. The Novel must be active when called. Badge state, enrichment
activation keys, and all property groups are preserved under the new slug.
The new slug is reflected in `list_novels`, `novel_info`, and `spec_health`.
*Acceptance criterion:* `rename_novel("new-name")` renames
`novels/old-name.json` to `novels/new-name.json`; `list_novels()` lists
the Novel under the new slug; duplicate slug returns `[STATE_CONFLICT]`;
the old slug returns `[NOT_FOUND]` on `resume_novel`.
_Check:_ T-new-256.

**REQ-259 — Update Novel description.** `update_novel_description(description)` (Game
Master only) sets or replaces the active Novel's description. An empty string clears
the description. The updated description is surfaced immediately in `novel://current`,
`list_novels`, `novel_info`, and `badge_briefing` under the `novel` section token.
The description is stored in the Novel JSON per REQ-092. Calling with no Novel
active returns `[STATE_CONFLICT]`. *Acceptance criterion:*
`update_novel_description("A new premise.")` updates the description;
`novel_info()` returns the new description; an empty string clears it.
_Check:_ T-new-259.

**REQ-257 — List Novels.** `list_novels()` (always callable) returns all
Novels on disk with these fields per Novel: slug, name, description,
last-modified timestamp, session count, cumulative play time, on-disk file
size in bytes, story journal entry count, enrichment item counts (Tier 1
activated key count per module, Tier 2 item count per module), and active flag.
Badge-filtered: the Player badge sees only Novels with `shared` scope
adventure hooks and excludes GM-only metadata. When no Novels exist, the
response SHALL include an explicit empty-state message. This is the dedicated
save-file browsing surface — `spec_health` (REQ-093) continues to report
Novels as part of its build-health dashboard, but `list_novels` is the
primary interface for the save-file library.
*Acceptance criterion:* After creating two Novels, `list_novels()` returns
two entries; after `end_novel`, the ended Novel is absent; empty disk
returns an empty-state message; Player badge sees filtered metadata.
_Check:_ T-new-257.

**REQ-258 — Novel info.** `novel_info(slug?)` (always callable, defaults
to the active Novel) returns extended metadata for a single Novel: slug,
name, description, creation timestamp, last-modified timestamp, session
count, cumulative play time, on-disk file size, story journal entry counts
by type, checkpoint count, notes count, adventure source (slug, "generated",
or "none"), setup-completion flags, format version, compression flag,
enrichment status (Tier 1 activated key count per module, Tier 2 item count per
module, stale item count), `codex_sources` (array of `{id, kind, imported_at,
codex_modified_at}` per REQ-332), and the active badge. Badge-filtered. When the
specified slug doesn't exist on disk, returns `[NOT_FOUND]` with available
slugs enumerated. When no slug is given and no Novel is active, returns
`[NOT_FOUND]` directing the caller to `list_novels` or `create_novel`.
*Acceptance criterion:* `novel_info()` returns extended metadata for the
active Novel; `novel_info("other-novel")` returns metadata for a different
Novel without activating it; nonexistent slug returns `[NOT_FOUND]` with
available slugs; Player badge sees filtered metadata.
_Check:_ T-new-258.

**REQ-089 — Novel setup.** The server provides a `novel_setup` prompt (prompt #7 in
`prompts/list`). It SHALL present a guided setup wizard in three sequential steps: (1)
characters — import roster characters or create new ones, with the ruleset's creation
options described in plain English; (2) story source — load an adventure, generate from
a premise, generate a random encounter, or build from scratch, with each option
explained in terms of what the GM gets narratively; after step 2 completes and
a story source is selected, `novel_setup` SHALL include a plain-English
note: "Community enrichment — web-sourced play advice tailored to your
adventure's themes — is available for this Novel. You can run enrichment
against this server to add it now, or proceed without it." The note SHALL
describe enrichment in terms of what it delivers (voice examples, lore
ideas, scene advice) not what it is called or how to invoke it; (3)
session zero. Each step SHALL
display a visual completion marker — `[✓]` for completed, `[→]` for current, `[ ]` for
pending — so the operator always knows where they are. Step descriptions SHALL be
conversational in plain English (e.g., "You have 2 characters in your roster. Would you
like to import one, create a new one, or move on?") rather than a static listing. After
session zero completes, the prompt SHALL present a next-steps summary describing what is
ready and how to begin the first scene. The Novel SHALL track completed steps
(characters_present, adventure_set, session_zero_completed) in its metadata, surfaced in
`badge_briefing` under the `novel` section token. After `create_novel`, the server
response or `badge_briefing` SHALL surface `novel_setup` as the recommended next step.
`novel_setup` SHALL integrate ruleset-extracted guidance (REQ-016), Enrich
`adventure_advice` content, and spec foundations for story-construction context.
*Acceptance criterion:* `novel_setup` presents three sequential steps with visual
completion markers; step descriptions use conversational plain English; after session
zero completes, a next-steps summary appears; completed steps are tracked in Novel
metadata.
_Check:_ T74.

**REQ-294 — Genre declaration.** The Novel SHALL carry a `genre` field, settable via
`novel://current` metadata and `badge_briefing` under the `novel` section token. The field
accepts a canonical set of genre tags: `noir`, `high_fantasy`, `sword_and_sorcery`,
`sci_fi_horror`, `cosmic_horror`, `historical`, `western`, `modern`, `cyberpunk`.
Ruleset-derived genre tags merge with the canonical catalog. Default is unset. When a
genre is set, `spec_health` SHALL report `active_genre`. When unset, the genre line is
absent from briefing per §5.10.

*Acceptance criterion:* After setting `genre: "noir"`, `spec_health` reports
`active_genre: "noir"` and `badge_briefing` includes a `genre` line. Setting an unknown tag
returns `[WARNING]` but the tag is stored.
_Check:_ T-new-294.

**REQ-090 — Adventure generation.** `generate_adventure(premise, target?)` (Game Master
only). Accepts a free-text premise and produces an adventure scaffold: a title (slug-ified
from premise), an Overview (GM-only, template-populated), an Adventure Hook
(player-visible), 2–6 location headings with table-rolled flavor (setting, horror, puzzle
tables from the ruleset), NPC name suggestions, and encounter table seeding. Uses indexed
ruleset tables and, when available, Enrich `adventure_advice` content — selecting
templates by category match (adventure_templates for scaffold structure), genre-convention
items by keyword match against the premise string, and scenario_starters by genre tag —
each selection carrying its source_url and confidence in the output. No runtime network —
all content from indexed data.

The optional `target` parameter accepts `novel` (default when a Novel is active), `codex`
(default when no Novel is active), or `both`. `target: "codex"` SHALL store the generated
scaffold as a Codex entry of kind `adventure` under the derived slug with `source:
generated`. `target: "novel"` SHALL store as the active Novel's generated adventure
content — the scaffold is indexed at `adventure://generated/<anchor>`, appears in
`search_rules` and `badge_briefing` under the `adventure` token. `target: "both"` SHALL
produce both. When no Novel is active and `target` is omitted, `target` defaults to
`codex`. `generate_adventure` SHALL be callable regardless of Novel state — no Novel is
required. Regenerating with `target: "codex"` replaces the prior Codex entry at the same
slug; regenerating with `target: "novel"` replaces the prior generated Novel adventure.
The Game Master expands via existing tools; the LLM (GM badge) writes narrative prose.

*Acceptance criterion:* `generate_adventure("The goblin king demands tribute")` produces a
title, overview, hook, 2–6 locations, NPC names, and encounter seeds; the scaffold appears
at `adventure://generated/<anchor>`. `generate_adventure("The dragon hoard",
target="codex")` with no Novel active stores the scaffold in Codex; `codex_list("adventure")`
returns the entry; server restart preserves it.
_Check:_ T75, T-new-323.

**REQ-091 — Enhanced encounter generation.** `generate_encounter(context)` (Game Master
only, optional context string). Combines ruleset encounter tables with Enrich
`adventure_advice` content (matching by scene context keywords against table_expansions
category items, highest confidence first) to produce a complete encounter in one call: a scene description,
an NPC or monster stat block, and a complication entry. With ruleset tables, rolls on them
for the mechanical backbone and wraps in generated narrative. Without tables, produces from
context and Enrich template patterns. Output: three structured artifacts as a batch — one
`set_scene_state`, one `create_npc`, one `set_lore_entry` for the complication. Snapshotted
as a single undo target. No `[NEED_INPUT]`. Player badge → `[FORBIDDEN]`.
*Acceptance criterion:* `generate_encounter("dark forest at midnight")` produces
a scene description, an NPC stat block, and a lore entry as a single atomic batch;
undo rolls back all three.
_Check:_ T76.

**REQ-295 — Genre-filtered generation.** WHEN the active Novel carries a genre declaration
(REQ-294), `generate_adventure` and `generate_encounter` SHALL filter their table draws
and template selections to prefer genre-matching content. The filtering SHALL operate as
a preference, not a block: (a) encounter tables, NPC archetypes, and location templates
that carry a matching genre tag SHALL be drawn from first; (b) untagged or `universal`
tables SHALL be drawn from only when genre-matching content is exhausted; (c) content
tagged with a non-matching genre SHALL be excluded unless the GM explicitly requests it
via a `!include_all` prefix on the premise/context string; (d) enrichment content SHALL
be filtered by genre tag when the Novel's genre is set.

Generation tables (REQ-213) SHALL carry an optional `genre_tags` field extracted during
Discovery (§6.3). A table with no `genre_tags` field is classified as `universal`.

*Acceptance criterion:* With `genre: "noir"` set, `generate_encounter("dark alley")` drawn
from tables where the noir-tagged table contains "mugger" and the universal table contains
"dragon" SHALL return the mugger.
_Check:_ T-new-295.

**REQ-092 — Novel persistence.** Every mutating tool call writes the Novel to
`.holonovel-state/novels/<slug>.json` (self-contained JSON bundling all state tiers,
the `audit_log` array (REQ-040), the `story_journal` array (REQ-246), Novel metadata,
and undo snapshot stacks) using an atomic rename — write to a temporary file, then
atomically rename over the target. The serialized Novel payload must be fully durable
on the storage medium before the atomic rename commits. Content written to the
temporary file must be flushed to stable storage (e.g., via fsync on the file
descriptor) before the rename operation. The temporary file path must include an
element that prevents collision with concurrent writers targeting the same Novel
(e.g., a process identifier or timestamp suffix). A Novel on disk whose file size is
zero after an atomic write indicates a durability failure — surfaced in `spec_health`
and stderr. A backup of the previous Novel file is retained as
`<slug>.json.bak`. Both corrupted JSON and a missing backup surface in `spec_health`
and stderr. A rebuild with a changed entity model loads the Novel gracefully:
absent-model fields in JSON preserved as inert data; missing fields receive
ruleset-defined defaults. Roster baselines remain immutable across rebuilds.
Structurally corrupted JSON → stderr warning and `spec_health` flag; never silently
discarded. On load, if the primary file is structurally corrupt but the `.bak` file
is intact and parseable, the server loads from the backup and records a
`[restored_from_backup]` audit entry. If both primary and backup are corrupt, the
server emits a stderr warning listing both file paths, surfaces a
`[corrupted_novel]` flag in `spec_health` with the slug, and provides the backup
path for operator recovery. The server must not silently discard or zero-initialize
the Novel. No orphaned state — `end_novel` removes the save file and its backup. The
Novel JSON includes a checksum field — a hash of the serialized state excluding the
checksum field itself. On load, the server verifies the checksum against the loaded
state. A mismatch follows the same recovery path as structural corruption: attempt
backup restore, then surface the mismatch in `spec_health` and stderr if both are
tainted. The checksum algorithm and field name are builder-determined; the
convergence loop enforces that tainted state is detected. Undo snapshot stacks
(REQ-041) persist with the Novel — they survive server restarts alongside all other
Novel state tiers.

The Novel JSON SHALL include a `novel_format_version` field — an integer, initially
`2`, incremented when the Novel's on-disk schema changes incompatibly. On load, the
server compares the stored version to the current format version. Version < current:
trigger graceful migration per the existing load rules (absent-model fields receive
ruleset-defined defaults; extra fields are preserved as inert data). For version 1
Novels, the server SHALL auto-migrate: if a `.holonovel-state/novels/<slug>.audit.jsonl`
file exists alongside the Novel JSON, read all entries from the JSONL file, construct an
`audit_log` array in the Novel, verify the hash chain end-to-end, delete the JSONL file,
and set `novel_format_version` to `2`. If no JSONL file exists for a version 1 Novel,
load with an empty `audit_log` array, record a `[migration_missing_audit]` audit entry,
and set `novel_format_version` to `2`. Version > current: surface a `[WARNING]
[format_future]` in `spec_health` — the Novel may contain fields the current server
cannot interpret; the server loads the Novel with the existing graceful migration
rules and the warning remains active until the format version matches.

WHEN `TTRPG_NOVEL_COMPRESS` is `true` (configurable), the serialized Novel
JSON SHALL be gzip-compressed before writing to disk. Backups SHALL be
compressed when the primary is compressed. The 4 MB health warning threshold
in REQ-097 applies to the on-disk compressed size. `export_novel` output
(REQ-096) SHALL be uncompressed regardless of this setting — the interchange
format is always uncompressed JSON or Markdown. `TTRPG_NOVEL_COMPRESS` SHALL
be recorded in the Novel's metadata for integrity verification on resume:
a compressed Novel loaded with compression disabled SHALL produce a `[WARNING]
[compression_mismatch]`; an uncompressed Novel loaded with compression enabled
loads normally.
*Acceptance criterion:* After 10 mutations, the Novel JSON on disk is non-empty
and parseable; `cat novels/<slug>.json | jq .checksum` returns a non-empty string;
`cat novels/<slug>.json | jq .novel_format_version` returns `2`;
`cat novels/<slug>.json | jq .audit_log` returns an array with 10 entries;
a version 1 Novel with a valid JSONL file auto-migrates on load; a corrupt primary
file triggers backup restore.
_Check:_ T77, T88, T156, T282.

**REQ-093 — Novel listing and metadata.** `spec_health` reports available Novels on disk:
slug, name, last-modified timestamp, active flag. `list_novels` (REQ-257)
is the dedicated save-file browsing surface — `spec_health` is the
build-health dashboard. `novel_info(slug?)` (REQ-258) returns extended
metadata for a single Novel. The active Novel's metadata includes:
creation timestamp, last-modified timestamp, entity count, adventure source (module slug,
"generated", or "none"), setup-completion flags, story journal entry count, session count (distinct `TTRPG_SESSION_ID`
values in the audit log), cumulative play time (earliest-to-latest audit entry timestamp
range), last-active scene anchor, current combat round if in-combat, total combat rounds
played across this Novel's lifetime, and a `sessions` array — per-session objects with
`session_id`, `entry_count`, `timespan_start`, `timespan_end`, `combat_rounds`,
`significant_roll_count`, and `scene_transitions` — derived from `[session_boundary]`
marker intervals (REQ-237). This metadata appears in
`badge_briefing` under the `novel` section token (added to REQ-082's documented token
set). `novel://current` and `novel://<slug>` resources return full metadata, including
the narrative directive (REQ-081).
*Acceptance criterion:* `spec_health` lists available Novels with slug, name,
last-modified, and active flag; the active Novel's metadata includes session count,
cumulative play time, and last-active scene anchor.
_Check:_ T78,
T99.

**REQ-094 — Lorebook interchange.** The Game Master may export Novel lore to and import
lorebooks from interoperable formats. Export excludes mechanical state; import modifies
only the lore tier with merge, replace, and dry-run modes. Round-trip preserves lore
metadata. Formats are defined in Appendix L. Player badge attempts return `[ERROR]
[FORBIDDEN]`. For a complete story package tbadge includes lore alongside entities,
NPCs, scene state, countdowns, and audit history, use `export_novel` (REQ-096) —
which embeds the lore tier within the Novel interchange format. `export_lorebook`
is the lore-only interchange pathway.
*Acceptance criterion:* `export_lorebook()` → `import_lorebook(exported_data,
"replace")` → `export_lorebook()` produces identical output; Player badge returns
`[FORBIDDEN]`.
_Check:_ T80.

Merge mode adds entries whose keys are not present in the Novel's lore tier and
preserves all existing entries unchanged. Duplicate keys — entries whose key
matches an existing lore entry — are skipped with a count reported in the
operation result. Replace mode clears the lore tier before importing, producing
a lore set consisting solely of the import data. Dry-run mode reports which
entries would be added, which would be skipped as duplicates, and which would be
overwritten (replace only), without modifying state.

**REQ-096 — Novel interchange.** `export_novel(format, scope?)` (Game Master
only, format `json` or `markdown`, scope defaults to `full`) exports the active
Novel's state in a self-contained interchange format per Appendix Q. The
`scope` parameter selects the payload: `full` (all state tiers, audit log,
snapshots, checkpoints if `include_checkpoints=true` per REQ-241), `state_only`
(all tiers except audit log and checkpoints), `lore` (lore tier only),
`world_model` (rooms, things, exits, properties), `npcs` (NPCs with personality
fields), `factions` (factions with clock state), `secrets` (secrets with
known-by status), `relationships` (relationship objects), `dm_context` (pause/
resume context), `notes` (key-value notes), `story_journal` (story journal entries
per REQ-246), or `scene_history` (scene-state
ledger). No dedicated `enrichment` scope — Tier 1 activation keys export as part of
`full` scope in the manifest's `enrichment_activation` field; Tier 2 items export as
the `enrichment` key in `full` scope (per Appendix Q). Each scope outputs
Appendix Q schema with omitted keys for excluded tiers. Single scope per call.

`import_novel(data, mode, strict?)` (Game Master only, mode `dry-run`,
`replace`, or `merge`, strict defaults to `false`) imports a previously
exported Novel. `dry-run` reports what would change without side effects.
`replace` replaces the active Novel's state with the import data. On import,
the server SHALL validate: (a) entity IDs within the import are unique,
(b) NPC references in lore entry trigger lists resolve to NPCs present in the
import (or the existing Novel for merge mode), (c) faction references in
`dm_context.active_threads` resolve to factions present in the import,
(d) relationship targets resolve to entities, NPCs, or factions present in
the import, (e) world-model exit references resolve to rooms present in the
import, (f) countdown names are unique within the import, (g) clock `opposes`
and `unlocks` references resolve to countdowns present in the import,
(h) adventure content referenced in `manifest.adventure_module_slugs` is
either embedded or the slugs are recorded as missing with a warning, (i) Tier 2
enrichment items whose `source_url` the target server never fetched SHALL be
flagged `[stale]`, (j) Tier 1 enrichment activation keys whose anchor does not
resolve against the target build's current extraction SHALL be flagged
`[orphan]`. Tier 2 stale items and Tier 1 orphan items are imported inert (inactive).
Module toggle state that references absent enrichment modules produces a
warning. When `strict` is `true`, any staleness or orphan enrichment items also
block the import. `dry-run`
reports all validation failures with each item's path. In `replace` and
`merge` modes, failures surface as `[WARNING]` with enumerated items but
import proceeds. When `strict` is `true`, any validation failure blocks the
import and returns `[ERROR] [STATE_CONFLICT]` for `replace`/`merge` modes
(returning the failure list in the error body), or produces a failure report
with `isError: false` for `dry-run`. `merge` adds entities and NPCs from the
import to the active Novel, skipping duplicates by entity or NPC ID. Player
badge attempts return `[ERROR] [FORBIDDEN]`. Round-trip: export → import →
export produces identical output (full scope, same format).

The export SHALL include a `manifest` object containing: `novel_format_version`
(defined in REQ-092), `server_spec_version` (CalVer from DECISIONS.md),
`ruleset_hash` (SHA-256 of source ruleset), `builder_implementation` (name and
version of the builder that produced the server), `adventure_module_slugs`
(array of module slugs active at export time), `adventures_embedded` (true when adventures are embedded),
whether module content is embedded inline), `property_groups_present` (array
of populated tier names), and `waiver_dependent_mechanics` (array of mechanic
names that depend on REQ-013 waivers recorded in DECISIONS.md). The manifest
is advisory — `import_novel` surfaces mismatches as warnings but does not
block import.

`export_novel` SHALL embed loaded adventure module content inline in the
`adventure` key when `TTRPG_EXPORT_EMBED_ADVENTURES` is `true` (default
`false`). When `false`, the export's `manifest.adventure_module_slugs` field
records which adventure modules were active at export time but their content
is not embedded — the import target must have those modules indexed to
restore adventure content. Adventure modules embedded inline SHALL include
their prose content (all narrative sections per REQ-079) and
world-model assertions (`## World` section); embedded content carries the
module's build-time content hash for integrity verification on import.
`TTRPG_EXPORT_EMBED_ADVENTURES` SHALL be recorded in the Novel's build
fingerprint as part of the Build workflow's Advanced questions (B9 area).
*Acceptance criterion:* `export_novel("json")` → `import_novel(data, "dry-run")`
reports changes without side effects; `import_novel(data, "replace")` restores
the exported state; round-trip is byte-identical; `export_novel("json",
"lore")` produces a payload with only the lore tier present; `import_novel
(data, "dry-run", strict=true)` with broken references reports all failures and
blocks import; `export_novel("json")` includes a `manifest` object with all
declared fields present.
_Check:_ T100, T281.

**REQ-097 — Novel health.** The `spec_health` tool reports per-Novel health metrics for
the active Novel: NPC count (with warning if near `TTRPG_MAX_NPCS` when configured), lore
entry count (with warning if near `TTRPG_MAX_LORE_ENTRIES` when configured), audit log
entry count, story journal entry count, story journal total characters (on-disk byte count),
snapshot stack depth (with warning if near `TTRPG_MAX_SNAPSHOT_DEPTH` when
configured), on-disk file size in bytes (with warning if exceeding 4 MB),
`enrichment_gap_count` — the number of activated Tier 1 keys that no longer resolve
against the current build's extraction (per REQ-080, surfaced as `[enrichment_gap]`
entries), and a `healthy` flag — set to false if any warning is active.
`spec_health` reports a sliding window of Novel file-size deltas and snapshot depth
deltas over the most recent sessions (distinct `TTRPG_SESSION_ID` values in the audit
log, bounded to the last 7 by default). A Novel whose growth trajectory projects an
on-disk file size exceeding 4 MB within the next 3 sessions is flagged with a
`[size_growth]` warning. The file-size metric reported in `spec_health` SHALL match
the on-disk file size as reported by the operating system, including all serialization
overhead (encoding, checksum field, whitespace formatting). A file reported at size S
bytes in `spec_health` whose on-disk size differs by more than 1% is a
`[size_mismatch]` warning — indicating a durability or serialization defect. The
growth trajectory SHALL use the on-disk size, not the in-memory representation size.
Health metrics are badge-filtered: Player sees entity-level health only; GM sees all.
*Acceptance criterion:* When NPC count approaches `TTRPG_MAX_NPCS`, `spec_health`
reports a warning and `healthy` is false; a Novel at 3.9 MB with growth trajectory
projects a `[size_growth]` warning.
_Check:_ T101, T160.

**REQ-131 — Novel initialization order.** When a Novel is created or resumed
from disk, its property groups SHALL be initialized such that cross-group
dependencies are satisfied before dependents are loaded (see §7.7.1).
Dependencies are: Adventure content before NPCs (NPCs may reference adventure
stat block templates per REQ-119), NPCs before Lore entries (Lore content may
reference NPCs), Scene state last among property groups (Scene changes trigger
Lore matching and Countdown hooks per REQ-083, REQ-125). Enrichment activation keys
(`enrichment_activated`, REQ-080) SHALL be
loaded before enrichment state resolution, so that Tier 1 key resolution against
current build output determines which enrichment items are active before any
enrichment surfaces are computed. Combat state, pending workflows, remaining
enrichment state, and audit log entries SHALL be restored after all property
groups. An out-of-order initialization that produces observable
differences in `badge_briefing` content, resource URI output, or tool behavior
between two invocations of the same Novel against the same builder is a
convergence finding. The builder records the initialization order in
DECISIONS.md (4).
*Acceptance criterion:* Create a Novel with an adventure, an NPC referencing
an adventure template, a lore entry mentioning the NPC, and a countdown with
`on_scene_transition`. Restart. Assert `badge_briefing` surfaces adventure
content, then the NPC (with template stats), then the triggered lore entry,
then the countdown — in dependency order. The order IS stable across 3
restarts.
_Check:_ T145.

**REQ-238 — Backup rotation.** The server SHALL retain the last N backups of
each Novel, configured via `TTRPG_NOVEL_BACKUP_COUNT` (minimum 1).
Backups are named `<slug>.json.bak.1` through `<slug>.json.bak.N`. On each
atomic write (REQ-092), existing backups are rotated: `<slug>.json.bak.N-1`
→ `<slug>.json.bak.N`, … `.bak.1` → `.bak.2`, the previous primary file
(after fsync) → `.bak.1`. On load, if the primary file is corrupt (structural
JSON error or checksum mismatch per REQ-092), the server attempts backup
restore in order from `.bak.1` through `.bak.N` — the first parseable backup
with a valid checksum wins and a `[restored_from_backup]` audit entry records
the backup index used. If no backup is parseable, the server follows the
existing recovery path (stderr + `[corrupted_novel]` in `spec_health`).
`end_novel` moves all backup files to `.trash/` alongside the primary.
Setting `TTRPG_NOVEL_BACKUP_COUNT=1` retains only the immediate previous
backup (current behavior).
*Acceptance criterion:* After 10 mutations with `TTRPG_NOVEL_BACKUP_COUNT=3`,
three rotated backup files exist; corrupting the primary and `.bak.1` triggers
restore from `.bak.2`; `end_novel` removes all backups.
_Check:_ T276.

**REQ-240 — Clone Novel.** The server SHALL provide a `clone_novel(source_slug,
new_name, trim_audit_sessions?)` tool (callable with no badge active or Game Master
badge). The tool creates an independent copy of the source Novel as a new Novel at
`.holonovel-state/novels/<new_slug>.json`. All property groups (NPC, Scene,
Countdown, Lore, Enrichment, Adventure, Faction, Secret, Relationship, DM Context,
Notes, Story Journal) plus the world-model tier, combat state, pending workflows,
metadata, audit log, story journal, undo snapshots, and checkpoints (if present,
REQ-241) SHALL be copied. Roster
references are preserved — cloned entities point to the same roster IDs. The
cloned Novel's `created_at` timestamp SHALL be the clone time; the clone is not
activated — the caller's active Novel is unchanged. Returns `[STATE_CONFLICT]`
if the target slug already exists. The optional `trim_audit_sessions` parameter
(configurable, default null = full copy) strips audit entries older than N sessions
from the clone, keeping only the most recent N sessions' entries (session
boundaries determined by `[session_boundary]` markers per REQ-237). A new
`clone` audit entry SHALL be recorded in both the source and cloned Novel.
Player badge attempts return `[ERROR] [FORBIDDEN]`.
*Acceptance criterion:* `clone_novel("my-novel", "my-novel-fork")` creates an
independent copy; mutating the clone does not affect the source; `spec_health`
lists both Novels; `clone_novel("my-novel", "my-novel-fork")` a second time
returns `[STATE_CONFLICT]`; `clone_novel("my-novel", "trimmed", trim_audit_
sessions=2)` clones with only the 2 most recent sessions' audit entries.
_Check:_ T278.

**REQ-334 — Novel archive.** THE server SHALL provide an `archive_novel(slug)`
tool — Game Master only, Novel must not be active in another connection. Marks
the Novel as archived: the Novel file SHALL be moved from
`.holonovel-state/novels/<slug>.json` to
`.holonovel-state/archive/<slug>.json` with its backup files. The active badge
is deactivated; the Novel is no longer active. IF the Novel is active in another
connection, THE system SHALL return `[STATE_CONFLICT]`. Archived Novels SHALL be
read-only — all mutating tools SHALL return `[STATE_CONFLICT]` with corrective
action directing the caller to `unarchive_novel`. Archive is distinct from trash
(REQ-117): archived Novels are long-term reference files, never auto-deleted.
`list_novels` SHALL accept an optional `filter` parameter with values `active`
(default, excludes archived and trashed), `archived` (archived-only), or `all`.
`unarchive_novel(slug)` SHALL restore an archived Novel to active status at
`.holonovel-state/novels/<slug>.json` with full state preserved — all property
groups and metadata intact. Player badge returns `[FORBIDDEN]`. Archived Novels
SHALL surface in `spec_health` under an `archived_novels` key with slug and
archive timestamp. Codex entries captured from an archived Novel via
`codex_capture` SHALL preserve their `source_novel` field — the archived Novel
remains the provenance reference.

*Acceptance criterion:* `archive_novel("my-novel")` moves the file to
`.holonovel-state/archive/my-novel.json`; `list_novels()` excludes it;
`list_novels(filter="archived")` includes it with archive timestamp;
`resume_novel("my-novel")` returns `[STATE_CONFLICT]`;
`unarchive_novel("my-novel")` restores the Novel to active state with all
property groups intact. `spec_health.archived_novels` lists the archived slug.
Player badge returns `[FORBIDDEN]`.

_Check:_ T-new-337.

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
a world model is populated. All other World tools (`create_room`, `delete_room`,
`create_thing`, `delete_thing`, `create_exit`, `delete_exit`, `convert_source`)
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

**REQ-195 — World-model state tier.** Every Novel SHALL carry a world-model
state tier. The tier SHALL hold: rooms (named locations with descriptions and
exits), things (named objects with descriptions, containment, and portability
classification), exits (directional connections between rooms with associated
door and openable/lockable state), and properties (either/or attributes on
world-model objects: open/closed, locked/unlocked, fixed/portable, lit/dark).
The tier SHALL be snapshot-able, audit-logged, and persistent with the Novel
per REQ-088, REQ-092. A Novel whose world-model tier has not been populated
(no rooms declared) SHALL report an empty world model — the TTRPG layer is
not dependent on world-model population. _Check:_ T238.

**REQ-196 — Parser command dispatch.** THE parser command system SHALL accept
natural-language text and resolve it against the world model's current state. The
`command` tool is an AI-narrator resolution engine — the AI narrator calls it
internally when the player describes spatial actions. The tool is Game Master only;
Player badge calls return `[ERROR] [FORBIDDEN]`. The tool's `tools/list`
description SHALL state "AI-narrator tool — resolves spatial intent internally."
Recognized commands SHALL include: navigation (walk, move,
or go directions), inspection (examine named objects, look at current room),
object interaction (take portable things, drop carried things, open/close
openable objects), inventory listing, and wait. Navigation SHALL resolve exit
directions and check door state — a closed door blocks passage. Object
interaction SHALL respect portability and containment — taking a fixed object
returns a rule-violation; taking an object inside a closed container returns a
rule-violation. An unrecognized command SHALL return a not-implemented result
with the command verb named AND the three nearest-matching valid commands from
the parser catalog, ordered by edit distance — the response pattern is
`[NOT_IMPLEMENTED] Unknown verb '<verb>'. Valid commands include: <nearest-1>,
<nearest-2>, <nearest-3>.` `command("help")` SHALL enumerate every available
command verb with its category (navigation, inspection, object interaction,
inventory, wait) and a one-line description. `command("what can I do?")`,
`command("commands")`, and `command("verbs")` SHALL produce the same output
as `command("help")`. When the world-model tier is empty (no rooms), the
help enumeration SHALL still list verbs — the base vocabulary is known even
without a populated world. An ambiguous object reference SHALL return a
disambiguation prompt listing all matching objects by name and location, ending with
a question: "Which <object type>?" The response pattern is:
`[OK] Which <object_type>?` followed by a numbered list of matches with locations
(e.g., "1. The stone altar (in the Crypt)\n2. The wooden altar (in the Chapel)").
This replaces the previous behavior of returning all matches as a flat list — the
numbered format enables the caller to respond with a specific match.
When the world-model tier is empty (no rooms), all parser commands SHALL
return a not-implemented result directing the user to populate the world
model via an adventure module or CRUD tools. _Check:_ T239.

**REQ-283 — Verb coverage tiers.** The parser command catalog SHALL classify every
registered command verb into one of three coverage tiers:

- `core` — the base vocabulary: go (and direction equivalents), look, examine, take,
  drop, inventory, and wait. Always present. These are the minimum verb set for any
  populated world model.
- `standard` — IF-community baseline verbs that map to world-model object properties:
  open, close, lock, unlock, push, pull, search, read, sit, stand, wear, remove, eat,
  drink, light, extinguish, climb, jump, enter, exit, put, insert. Available when the
  world model contains objects supporting the corresponding property (openable,
  lockable, portable/fixed, readable, wearable, edible, drinkable, etc.).
- `extended` — ruleset-derived verbs discovered via REQ-222, registered under their
  discovered category.

`command("help")` SHALL group commands by tier. `command("verbs")` SHALL report the
tiered coverage with per-tier counts. `world://kinds` SHALL report per-tier verb lists.
`spec_health` SHALL include `parser_verb_coverage` with per-tier counts. The tier
classification is advisory — it signals parser completeness, not mechanical enforcement.

*Acceptance criterion:* A populated world model with openable doors, readable books,
and wearable items reports `core` tier verbs (7), `standard` tier verbs (12+ depending
on world-model supports), and `extended` tier verbs per REQ-222. A ruleset with no
additional verbs reports 0 `extended`. A world model with no openable objects reports
the `open` and `close` verbs as registered but unavailable (annotated in the verb list).
_Check:_ T-new-284.

**REQ-284 — Implicit action hints.** WHEN a parser command fails because a precondition
is not met — a locked container before unlocking, a closed door before opening, an object
in darkness — THE response SHALL include a hint naming the required action and object
when that object exists and is reachable in the world model. Reachable means: the object
is in the current room, in the player's inventory, or in an open container in either.
The hint SHALL be appended to the rule-violation message as a separate line:
`Hint: You need the <object name> (<location>) first.`

Examples: `command("open chest")` when the chest is locked and the iron key is in the
player's inventory → `[RULE_VIOLATION] The chest is locked. Hint: You need the iron key
(inventory) first.` `command("unlock chest")` when no key exists in the world model →
`[RULE_VIOLATION] The chest is locked.` (no hint — no reachable key exists).

The hint contract SHALL extend to the following precondition failures for new kinds,
following the same reachability rules:

| Precondition | Hint pattern |
|---|---|
| `command("read inscription")` when the readable thing is inside a closed container in the room | `Hint: The <thing> is inside the <container> — open it first.` |
| `command("enter raft")` when the vehicle is in an adjacent room visible through an open exit | `Hint: The <vehicle> is in the <room> to the <direction>.` |
| `command("climb rope ladder")` when climbable ladder is in an adjacent room visible through an open exit | `Hint: The <climbable> is in the <room> to the <direction>.` |
| `command("switch on lantern")` targeting a device that is `switched_off` in a dark room | No hint — switching the device is the solution, not a precondition. |
| `command("read scroll")` when a wearable thing required to permit reading is not worn (e.g., "you need glasses to read") | No hint — stateless; the parser returns `[RULE_VIOLATION]` listing the missing equipment type. |

*Acceptance criterion:* Create a world model with a locked chest and an iron key in the
room. `command("open chest")` returns `[RULE_VIOLATION]` with a hint naming the iron key
and its location. Remove the key from the world model — `command("open chest")` returns
`[RULE_VIOLATION]` with no hint. A readable inscription inside a closed glass jar produces
"Hint: The inscription is inside the glass jar — open it first." A vehicle in an adjacent
room produces the direction-bearing hint. A switched-off lantern produces no hint.
_Check:_ T-new-310.

**REQ-316 — Device kind.** THE world-model layer SHALL define a `device`
kind extending `thing`. A device SHALL carry `switchable` (can be turned on
or off) and `switched_on` (current state) properties. A device that is both
`lit` and `switched_on` SHALL provide light; a device that is `switched_off`
SHALL be dark regardless of the `lit` property. A device is portable by
default. `command("switch on <device>")` SHALL set `switched_on` to true;
`command("switch off <device>")` SHALL set it to false. Switching a
non-switchable thing SHALL return `[RULE_VIOLATION]`. The `switch on` and
`switch off` commands SHALL be registered in the parser command catalog
under `object_interaction` category, standard tier. The property assertions
"It is switchable." and "It is switched on." SHALL be recognized by
`convert_source`. _Check:_ T-new-317.

**REQ-317 — Vehicle kind.** THE world-model layer SHALL define a `vehicle`
kind extending `thing`. A vehicle SHALL carry `enterable: true` by default
and `capacity` (maximum passengers, integer). A vehicle is `fixed` by
default — it cannot be taken. When a player enters a vehicle via
`command("enter <vehicle>")`, the player's current room SHALL become a
virtual interior room derived from the vehicle's description. The vehicle
interior SHALL have an `out` exit that returns the player to the room where
the vehicle is parked. While the player is aboard, `command("look")` SHALL
show the interior description and list visible exits — the room the vehicle
is parked in SHALL be visible as an `out` exit. Navigation commands (`go
north`, `go south`, etc.) while aboard SHALL move the vehicle and all its
contents (passengers and items) through the world-model exit graph —
movement SHALL resolve against the room the vehicle occupies, not the
vehicle interior. A vehicle SHALL persist at its last location when
unoccupied. A vehicle reaching capacity SHALL reject additional passengers
with `[RULE_VIOLATION]`. `command("exit")` and `command("get out")` SHALL
return the player to the room containing the vehicle. Vehicle interior
rooms SHALL NOT appear in `world://map` independently — they are child
objects of the vehicle, not world-graph nodes. The kind declaration "A raft
is a vehicle. 'Description.' It is in the Lake." SHALL be recognized by
`convert_source`.

WHEN a player enters a vehicle via `command("enter <vehicle>")`, the server
SHALL record a `[vehicle-entry]` story journal entry of type `moment` with
the context `entered <vehicle>` and the vehicle's interior description. WHEN
the player exits the vehicle, a `[vehicle-exit]` entry SHALL record the room
returned to. These entries SHALL appear in `session_recap` scene transitions
and SHALL be surfaced in `badge_briefing` narrative context when present.
This couples vehicle traversal into the narrative surface without affecting
scene state — the GM's `set_scene_state` remains authoritative.
_Check:_ T-new-318.

**REQ-318 — Extended property contracts.** THE world-model layer SHALL
extend the `thing` type with the following properties, each enabling a
parser command and carrying a default value:

| Property | Type | Default | Enables | Effect |
|---|---|---|---|---|
| `switchable` | boolean | false | `switch on`/`switch off` | Target must be switchable |
| `switched_on` | boolean | false | (state only) | Current switch state |
| `wearable` | boolean | false | `wear`/`remove` | Can be worn; sets `worn_by` on wear |
| `worn_by` | string \| null | null | (state only) | Who is wearing this |
| `readable` | boolean | false | `read` | Has readable text |
| `read_text` | string \| null | null | `read` | Text revealed on read |
| `edible` | boolean | false | `eat` | Can be eaten; removed from inventory on eat |
| `drinkable` | boolean | false | `drink` | Can be drunk |
| `enterable` | boolean | false | `enter` | Can be entered (container or vehicle) |
| `climbable` | boolean | false | `climb` | Can be climbed |
| `transparent` | boolean | false | (state only) | Contents visible when closed (container) |

`convert_source` SHALL recognize property assertions for each boolean
property: "It is wearable.", "It is readable.", "It is edible.", "It is
transparent.", "It is switched on.", "It is enterable.", "It is climbable."
The `read_text` property SHALL be settable via assertion: "The inscription
on the altar reads 'Beware the serpent.'" — `convert_source` SHALL extract
the quoted text and assign it to `read_text` of the named thing.
_Check:_ T-new-319.

**REQ-319 — Extended parser command vocabulary.** THE parser SHALL
recognize the following additional commands, each registered as
`standard` tier (REQ-283). Each command SHALL resolve against the
world-model property contracts defined in REQ-316 through REQ-318.
When a target lacks the required property, the command SHALL return
`[ERROR] [RULE_VIOLATION]` naming the missing property.

| Command | Category | Args | Contract |
|---|---|---|---|
| `wear` | object_interaction | thing | Target must be `wearable` and in caller's inventory. Sets `worn_by` to active entity. Returns `[RULE_VIOLATION]` if already worn. |
| `remove` | object_interaction | thing | Target must be worn by caller. Clears `worn_by`. |
| `read` | inspection | thing | Target must be `readable`. Returns `read_text` or the thing's description if `read_text` is null. |
| `eat` | object_interaction | thing | Target must be `edible` and in caller's inventory. Removes from inventory. |
| `drink` | object_interaction | thing | Target must be `drinkable` and in caller's inventory. |
| `climb` | navigation | thing | Target must be `climbable`. Resolves an associated exit (a climbable thing declared adjacent to a directional exit acts as that exit's door). Returns `[RULE_VIOLATION]` if no associated exit exists. |
| `enter` | navigation | thing | Target must be `enterable` (container with enterable property, or vehicle). Moves viewpoint to interior. |
| `exit` / `get out` | navigation | — | Returns to parent room from container/vehicle interior. Returns `[STATE_CONFLICT]` if not inside an enterable object. |
| `switch on` / `switch off` | object_interaction | thing | Target must be `switchable`. |
| `sit` | navigation | thing | Target must be a supporter. Records sitting state. |
| `stand` | navigation | — | Ceases sitting. |
| `push` | object_interaction | thing | Pushes a movable thing. |
| `pull` | object_interaction | thing | Pulls a movable thing. |
| `insert` | object_interaction | thing, target | Places a thing into a container. Synonym for `put in`. |
| `light` | object_interaction | thing | Lights a light source. Target must be `lit`. |
| `extinguish` | object_interaction | thing | Extinguishes a light source. |
| `listen` | inspection | — | Returns list of sound-producing objects in current room. The parser reports objects; the LLM composes sensory prose. |
| `smell` | inspection | — | Returns list of smell-producing objects in current room. |
| `touch` | inspection | thing | Returns tactile properties of a thing. |
| `again` / `g` | meta | — | Repeats the last command verbatim. Session-local command buffer — discarded on connection close. Returns `[WARNING]` "Nothing to repeat." if no prior command exists. |
| `it` / `them` / `all` | meta | thing reference | Pronoun disambiguation. `it` resolves to the last referenced thing. `them` resolves to the last referenced group. `all` applies the current command to all matching targets. `command("help")` SHALL list all verbs grouped by tier. `command("verbs")` SHALL report per-tier counts. `spec_health.parser_verb_coverage` SHALL reflect the extended vocabulary. |

`convert_source` directional exit adjacency SHALL associate a climbable
thing with the exit in the same direction: when "A rope ladder is in the
Entrance Chamber. It is climbable." is followed by "Up of the Entrance
Chamber is the Rookery.", the rope ladder SHALL be registered as the door
for the `up` exit — `command("climb rope ladder")` SHALL resolve to `go
up` through that exit. _Check:_ T-new-320.

**REQ-320 — Narrative-intent parser verbs.** THE parser SHALL recognize
commands that route narrative intent to the Game Master rather than
resolving mechanically. These commands SHALL be registered under a new
`narrative` parser category and SHALL be standard tier. They SHALL produce
`[OK]` with a description of the expressed intent and SHALL NOT simulate
conversation or adjudicate outcomes. The intent SHALL be surfaced in
`badge_briefing` under a `## Player Intent` section.

| Command | Args | Behavior |
|---|---|---|
| `ask <npc> about <topic>` | npc, topic | Resolves NPC by name in current room. Returns `[OK] You ask <npc> about <topic>.` If no matching NPC is present in the current room, returns `[WARNING]` noting the NPC is not present but still records the intent. |
| `tell <npc> about <topic>` | npc, topic | Same pattern as `ask`. |
| `give <thing> to <npc>` | thing, npc | Transfers thing from caller's inventory to the NPC. Returns `[OK] You give the <thing> to <npc>.` Returns `[ERROR] [RULE_VIOLATION]` if the thing is fixed or not in inventory. |
| `show <thing> to <npc>` | thing, npc | Does NOT transfer. Returns `[OK] You show the <thing> to <npc>.` Works with held and fixed things. |
| `throw <thing> at <target>` | thing, target | Moves thing from caller's inventory to the target's room. Returns `[OK] You throw the <thing> toward <target>.` The thing appears in the room — not equipped to or held by the target. Returns `[ERROR] [RULE_VIOLATION]` if the thing is fixed or not in inventory. |

NPC resolution SHALL match by name substring against NPCs whose location
matches the current room. When no NPC matches in the current room, the
command SHALL still record the intent with a `[WARNING]` marker — the
player may be calling through a door or across a chasm. `command("help")`
SHALL list narrative verbs under their own category with a note that
outcomes are determined by the Game Master. _Check:_ T-new-321.

**REQ-197 — Room description generation.** WHEN the player enters a room
or issues a look command THE system SHALL return the room's name, its
verbatim description, and visible things with containment chains expressed
in a standard format. The description SHALL be drawn from the source
text — no generative prose is appended. Exit directions SHALL appear in
status-line context, not in the room-description body.

The system SHALL support three description modes settable via `command("brief")`,
`command("verbose")`, and `command("normal")` (default). In `brief` mode,
`command("look")` returns only the room name and exit directions — the verbatim
description and visible things are suppressed. In `verbose` mode, every room
entry prints the full verbatim description regardless of whether the player has
seen the room before. `normal` mode prints the full description on first entry
only; subsequent entries into seen rooms return the name and exits. The mode
persists for the session — it is discarded on connection close. `command("brief")`
and `command("verbose")` are always recognized verbs, even when the world-model
tier is empty. `spec_health` SHALL report the current description mode.

The `player_signal` interface SHALL accept a `detail` signal with values `terse`
(room name + exits only, minimal combat feedback — participant name + result, no
full roll transparency), `normal` (balanced output), and `rich` (full descriptions,
complete roll transparency, lore trigger notifications). Setting `detail=terse`
SHALL override both the room description mode and combat verbosity — all tool
output follows the selected detail level. The detail signal is session-scoped
(discarded on connection close) and visible in `badge_briefing` as a Player-Detail
line. _Check:_ T240.

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
`convert_source` tool accepting hybrid source text — declarative
world-model assertions interleaved with TTRPG annotations — and parsing
it into a linked world model + TTRPG state. The tool SHALL operate only
under the Game Master badge. The tool SHALL populate only an empty Novel
(world-model tier has zero rooms) — calling `convert_source` on a Novel
with existing world-model objects SHALL return a state-conflict. The
conversion pipeline SHALL consist of four phases:

1. **Tokenize.** Split source into declarative assertions and TTRPG
   annotations. Declarative assertions follow the world-model layer's
   prose conventions: room declarations ("The Crypt is a room. 'Desc.'"),
   thing declarations with containment ("A sword is in the Crypt."),
   exit declarations ("East of the Crypt is the Hall."), and property
   declarations ("It is closed and locked."). TTRPG annotations are
   directives attaching ruleset-specific data to named world-model objects.

2. **Validate.** Each assertion is checked against the kind hierarchy
   and property contracts. Contradictions (duplicate names, incompatible
   properties on a kind) produce line-numbered diagnostics.

3. **Resolve.** Containment chains, exit symmetry, implicit objects
   (reverse exits, implied rooms from exit declarations), and property
   defaults are resolved. TTRPG annotations are matched to world-model
   objects by name. Unmatched annotations are reported as unresolved
   references.

4. **Populate.** The resolved world model and linked annotations are
   installed in the Novel. Object counts (rooms, things, exits) and
   linked-annotation counts (encounters, NPCs, traps, lore) are reported.
   The operation is snapshot-able and audit-logged.

Unrecognized assertion patterns SHALL produce not-implemented warnings
naming the pattern and its source line, but SHALL NOT block population
of recognized assertions — the system SHALL parse every recognized
assertion and report the count of both successful and skipped items.
_Check:_ T244.

**REQ-202 — World-model resources.** THE system SHALL provide resource
URIs for the world-model tier: `room://<id>` (room name, description,
visible things, exits), `thing://<id>` (thing name, description, location,
properties), `world://map` (all rooms with exit connections — a navigable
graph), `world://kinds` (kind hierarchy, property contracts, and parser
command catalog from the indexed provider documentation). All world-model resources
SHALL be badge-filtered: the Player badge sees only descriptions and visible state;
sees only descriptions and visible state; the Game Master badge sees
metadata including property values and containment chains. `world://map`
SHALL return a list of room names with directional exits formatted as a
navigable adjacency list. _Check:_ T245.

**REQ-222 — Parser command vocabulary extension.** THE builder SHALL discover
additional command verbs from the ruleset's equipment, action descriptions, and
mechanical procedures. Verbs discovered during extraction SHALL be registered in
the parser command catalog alongside the base vocabulary (REQ-196). A discovered
verb SHALL map to one or more parser command categories — navigation, inspection,
object interaction, inventory, or wait — based on the ruleset context from which
it was extracted. Verbs that do not fit an existing category SHALL be registered
under a `ruleset_custom` category. The registered vocabulary SHALL be exposed at
`world://kinds` under `parser_commands` with each verb's category and extraction
source. Discovery SHALL NOT fabricate verbs — every registered verb SHALL cite a
ruleset anchor per REQ-010. When no additional verbs are discovered, the base
vocabulary (REQ-196) is the complete command set.
*Acceptance criterion:* A ruleset whose equipment section mentions "push" and
"pull" as object interactions registers `push` and `pull` under object interaction
category with source anchors; a ruleset with no additional verbs exposes only the
base vocabulary at `world://kinds/parser_commands`.
_Check:_ T264.

**REQ-309 — World and narrative surface prominence.** THE server SHALL accept a
`TTRPG_WORLD_PROMINENCE` configuration with three levels controlling the default
surface emphasis of world-model and narrative infrastructure tools across the help
task map, `badge_briefing` composition, and `suggest_actions` intent mapping. The
setting SHALL be a build-time configuration recorded in DECISIONS.md (1) and SHALL
be server-scoped — it applies as the default to every Novel, overridable per-Novel
by `set_help_category` (REQ-067) and `set_briefing_order` (REQ-082). TTRPG
resolution authority is unchanged by this setting — it affects presentation, not
mechanics.

Parser `command` and all parser verb names SHALL be Game Master only. The Player
badge SHALL never see parser verb names in help, `suggest_actions`, or any tool
output. The AI narrator resolves player spatial intent through `resolve_intent`
(REQ-323) — the parser is never exposed to the Player as a callable tool. At
every prominence level, `suggest_actions` under the Player badge SHALL map
spatial intents to `resolve_intent`, never to `command`.

At `visible` (default): World-model and narrative tools SHALL appear in primary help
categories. Parser `command` SHALL appear in "World Inspection" (GM only).
`badge_briefing` SHALL include a dedicated
world-model state section with an empty-state marker when the world-model tier is
unpopulated. `suggest_actions` SHALL return `resolve_intent` for spatial intents
under both badges; under the Game Master badge, `suggest_actions` SHALL also
return parser `command` for spatial intents for direct world-model inspection.
At `secondary`: World-model tools SHALL be placed in a secondary help
category. Parser `command` SHALL appear as "World Inspection" in the GM-only tool
surface — it SHALL NOT appear in Player help. `badge_briefing` SHALL fold
world-model state into the scene state section;
narrative-tool sections SHALL render only when their data is non-empty.
`suggest_actions` SHALL NOT return parser commands for exploration or navigation
intents; Player-badge spatial intents SHALL map to `resolve_intent`.

At `prominent`: Parser `command` SHALL be a top-level GM help entry under "World
Inspection"; world CRUD tools
SHALL appear in a primary setup category. `badge_briefing` SHALL include world-model
state in the decision-critical group. `suggest_actions` under the Game Master badge
SHALL prefer parser `command` for spatial inspection; under the Player badge,
`suggest_actions` SHALL return `resolve_intent` for all spatial intents.

In ruleset-free mode (B1=`none`), the setting SHALL be skipped — the world-model
and narrative layers are the primary surface by definition (REQ-218). The builder
SHALL NOT record a `TTRPG_WORLD_PROMINENCE` value in DECISIONS.md when B1 is
`none`, and the intake question (B12) SHALL NOT be asked.

*Acceptance criterion:* A build with `TTRPG_WORLD_PROMINENCE=visible` produces
the default help categorization (world-model and narrative tools in primary help).
`TTRPG_WORLD_PROMINENCE=prominent` places parser `command` as a top-level GM help
entry and includes world-model state in the decision-critical briefing group.
`TTRPG_WORLD_PROMINENCE=secondary` produces a minimized surface with world-model
tools in secondary categories. At all levels, Player-badge `suggest_actions`
returns `resolve_intent` for spatial intents — never `command`.

The prominence setting applies uniformly across badges— Game Master and Player receive
the same world-model state surface in `badge_briefing`. Per-badge prominence overrides
are a recognized future extension (a GM building world content may prefer `prominent`
display emphasis while the Player navigating it prefers `secondary` display emphasis)
but are out of scope for this revision. Parser `command` tool access is badge-gated
independently of prominence — the Player badge can never call `command` directly
regardless of `TTRPG_WORLD_PROMINENCE` value.
_Check:_ T-new-309.

**REQ-325 — Constraint override catalog.** THE server SHALL expose constraint
overrides (REQ-324) at a `constraints://active` resource. The resource SHALL
be badge-filtered: Game Master sees all overrides; Player sees overrides for
the active entity only. Each override entry SHALL carry: constraint type,
mechanic name, mechanic source (spell, class_feature, item, ability),
prerequisites (level, spell slot count, item name), and source anchor.
`spec_health` SHALL report `constraint_override_counts` by constraint type and
by mechanic source.

Error responses that cite a world-model constraint SHALL include override hints
when the active entity possesses a relevant bypass: `[RULE_VIOLATION] The door
is locked. Hint: Knock (1 slot remaining) can open it.` Hints SHALL be
sourced from the override catalog at call time — never hardcoded. When the
entity has no relevant override, hints SHALL be absent. Override hints SHALL
be badge-filtered: Player-badge errors SHALL enumerate only the active entity's
overrides; Game Master-badge errors SHALL enumerate all known overrides.
*Acceptance criterion:* A character with Knock prepared attempts to pass a
locked door — `resolve_intent("go north")` returns an override hint citing
Knock. A character without knock receives no hint. `constraints://active`
returns overrides badge-filtered.
_Check:_ T-new-325.

**REQ-326 — Scene-world coupling.** WHEN `set_scene_state` provides a `location`
that fuzzy-matches a world-model room name (case-insensitive, substring match
with closest word-edit-distance for disambiguation), THE room SHALL become the
scene's spatial truth:

- The room's description, exits, and contained visible things SHALL be
  composable into the scene's spatial reality.
- The GM's free-text `description` field SHALL serve as narrative framing of
  that reality — it may supplement or override the room's prose description
  but SHALL NOT contradict exit or containment data.
- `scene://current` SHALL include the resolved `room_id` and room name when
  a match exists.
- `resolve_intent` under the Game Master badge (for GM inspection) SHALL
  compose the full scene from room data and narrative framing.
- Under the Player badge, scene composition SHALL occur through AI narration
  via `resolve_intent` — the Player never sees room graph data directly.

When the world model is unpopulated or no room name matches the location,
`location` works as a free-text label (current behavior). Room-coupled scenes
are backward compatible: unmatched location strings produce no spatial truth
but remain valid scene labels.
*Acceptance criterion:* `set_scene_state("The throne room", location="Throne
Room")` where world model has room "Throne Room" with exits [north, south] and
contained things [throne, chandelier] — `scene://current` includes `room_id`,
and `resolve_intent` returns exits and things. `set_scene_state("The void",
location="Nowhere")` where no room matches — `location` is a free-text label.
_Check:_ T-new-326.

**REQ-327 — NPC-world coupling.** NPCs' `location` field SHALL resolve against
the world-model room graph. When an NPC's `location` string fuzzy-matches a
room name, the NPC SHALL be registered in that room:

- `command("look")` or equivalent inspection SHALL list the NPC among the
  room's present entities.
- `create_npc` with a `location` matching a room name SHALL register the NPC
  in that room at creation time.
- `update_npc` changes to `location` SHALL re-register the NPC — the NPC is
  removed from the prior room (if any) and registered in the new room (if
  matched).
- NPCs whose location does not match any room SHALL NOT be registered in a
  specific room — their location is a free-text label (current behavior).
- Room-registered NPCs SHALL appear in `room_context` of `resolve_intent`
  results for that room.
- NPC presence in `badge_briefing` and `party://current` SHALL continue to
  be governed by `characters_present` on `set_scene_state` (REQ-307) — room
  registration supplements, it does not replace presence tracking.

*Acceptance criterion:* `create_npc("Blacksmith", location="Forge")` where
world model has room "Forge" — `resolve_intent("look")` from Forge lists
Blacksmith. `update_npc("blacksmith", location="Inn")` — Blacksmith is no
longer in Forge; listed in Inn. No matching room — Blacksmith carries
free-text location only.
_Check:_ T-new-327.

**REQ-367 — Property propagation across containment.** WHEN a container or
vehicle carries a property that affects perception of its contents, the
property SHALL propagate from the container boundary. Propagation SHALL
evaluate containment from outermost to innermost. An opaque or `dark`
container at any level in the chain SHALL block perception of all
recursively contained things — propagation SHALL stop at the first opaque
boundary. Inner containers' `transparent` properties are irrelevant when an
outer container is opaque.

A `transparent` container containing a `lit` and `switched_on` device SHALL
report the device's light state to the room — "a glowing lantern (inside the
glass case)." A `transparent` container containing a `lit` device that is
`switched_off` SHALL NOT report light — "a dark lantern (inside the glass
case)." A `dark` container SHALL block perception of its contents regardless
of `transparent` — "a brass urn (opaque, what's inside is hidden)."

A vehicle interior SHALL inherit the `lit`/`dark` state of the vehicle's
exterior room unless the vehicle itself is `lit`. `command("look")` output
SHALL reflect propagated state.

*Acceptance criterion:* A world model with a transparent jar containing a
switched-on lantern in a dark room — `command("look")` reports "a glowing
lantern (inside the glass jar)." Switch the lantern off — `command("look")`
reports "a dark lantern (inside the glass jar)." Place the jar inside an
opaque iron chest — `command("look")` does not mention the lantern. A
vehicle in a dark cave with the vehicle itself `lit` — interior shows as
lit; vehicle not `lit` — interior inherits dark.
_Check:_ T-new-374.

**REQ-368 — Countdown-world effect coupling.** Countdowns SHALL accept an
optional `world_effect` field. WHEN a countdown with `world_effect` fires,
the effect SHALL be applied immediately after the countdown is removed from
active countdowns:

- `world_effect.type` is one of: `describe` (change room description),
  `property` (toggle a world-model property), or `exit`
  (open/close/create/remove an exit).
- `describe` with `target=<room_id>` and `value="<description>"` SHALL
  replace the target room's `description` field. The prior description is
  preserved in the undo snapshot preceding the countdown fire.
- `property` with `target=<thing_id>`, `property=<name>`, `value=<new_value>`
  SHALL set the target thing's property. Only properties defined in REQ-318
  are addressable; attempting an undefined property returns
  `[RULE_VIOLATION]` in the audit log.
- `exit` with `target=<room_id>`, `direction=<dir>`,
  `destination=<room_id>` SHALL create the exit per REQ-198 with implicit
  reverse exit. `action=remove` deletes the existing exit. `action=open` or
  `action=close` changes the exit's door state.

All `world_effect` mutations are snapshot-able and surfaced in
`badge_briefing` `narrative_threads` as `[countdown-effect]`. WHEN a
countdown with `world_effect` fires and the referenced target has been
deleted between creation and firing, the countdown SHALL still fire —
removed from active countdowns and recorded in the audit log with a
`[WARNING]` entry carrying the effect type, target ID, and `target missing —
effect not applied` annotation. The countdown is not re-queued. An `undo`
that restores the deleted target before the countdown fires SHALL restore
the effect's ability to apply.

*Acceptance criterion:* `set_countdown("flood", 3, type="narrative",
world_effect={type:"describe", target:"cellar", value:"Knee-deep water
fills the cellar, rising fast."})`. Advance three narrative ticks — assert
countdown fires, cellar room description replaced, prior description in
undo snapshot. Create countdown with `world_effect.target="nonexistent"` and
fire — assert `[WARNING] target missing — effect not applied` in audit log.
_Check:_ T-new-375.

*Out of scope:* multiplayer synchronization, real-time collaborative editing,
save-Novel versioning beyond the checksum model, and Novel migration between
different rulesets.

### 5.11 Ruleset-Free Build Mode

**REQ-218 — Ruleset-free build.** WHEN the Build workflow is selected with B1 set to
`none` THE builder SHALL operate in ruleset-free mode. THE builder SHALL NOT perform
chunked reading, extraction, or mechanical modeling of ruleset content. THE server
SHALL register every REQ-020 infrastructure tool category (World, Novels,
Narrative, Badges & Workflow),
every REQ-022 resource URI, and every REQ-023 prompt. Ruleset-dependent tools — canonical lookups, dice-resolution
tools, and any tool whose registry depends on extracted mechanics — SHALL be waived
under REQ-013 or registered with empty domains that return content-absent responses.
The world-model layer (§5.10) SHALL be populated from the provider documentation
indexed at the B10 intake path. `search_rules` SHALL return an empty result set with a
clear message indicating no ruleset is indexed. `roll_on_table` SHALL return the
content-absent message per REQ-214. Verification workflow G0 step 2 and G2 SHALL use
the Appendix W fixture in place of Appendix B or N. Handoff verification steps H1 and
H10 SHALL be skipped for ruleset-free builds — there is no source edition/title to
compare and no extraction confidence to measure.
_Check:_ T259.

**REQ-219 — Ruleset-free entity creation.** WHEN no ruleset defines entity stats,
classes, species, or equipment THE `create_character` tool SHALL accept a name and
optional personality fields per REQ-077 (description, voice, background, goals). The
tool SHALL produce a roster entry with no mechanical fields — only name and narrative
fields. The `character_sheet` rendering for a ruleset-free entity SHALL display the
entity's name and populated personality fields; no stat block is rendered. Import into
a Novel follows the standard import contract (REQ-055). The roster entry is a permanent
baseline; its narrative fields are mutable per REQ-077. The entity is valid as a combat
participant in `init_combat` — it receives a turn in the order and auto-advances with an
`[AUTO]` marker without mechanical effects (dangers and entities have no hit points, no
damage, and no death state). `suggest_actions` SHALL include the entity's name and
narrative fields in context but SHALL return no mechanical action suggestions.
_Check:_ T260.

---

### 5.12 Narrative Architecture

The REQs in this section extend existing infrastructure — scene state (REQ-076,
REQ-087), factions (REQ-233), NPCs (REQ-075, REQ-077), countdowns (REQ-073),
badge briefing (REQ-109), intents (REQ-084, REQ-323), relationships (REQ-236),
voice examples (REQ-077), knowledge (REQ-308, REQ-286), and the world-model
layer (§5.10) — with dramaturgical primitives, autonomous cast behavior, and
a unified intent pipeline. Together they compose the server's narrative engine:
the machinery that transforms state management into story emergence.

**REQ-335 — Scene beat taxonomy.** The server SHALL support scene beat
annotation alongside scene type (REQ-087). Valid beat values are: `setup`,
`escalation`, `turning_point`, `climax`, `resolution`, and `denouement`.
Beats SHALL be set via `set_scene_state` as an optional `beat` parameter and
via `set_scene_type` as a `beat` parameter. The current beat SHALL surface in
`badge_briefing` as a sub-element of the scene state section, immediately
after the scene type tag, in the form `Beat: <beat>`. A scene without an
explicit beat SHALL carry the default `mid_scene`. `session_recap` SHALL
include beat transitions alongside scene transitions in the
`scene_transitions` array as `beat_before` and `beat_after` pairs. A scene
transition that retains the same beat SHALL NOT record a beat transition. The
beat taxonomy is descriptive — the GM may set any beat at any time; the
server does not enforce beat progression sequences. Scene beat SHALL influence
countdown advancement rate per REQ-353.

*Acceptance criterion:* `set_scene_state("The hall darkens", beat="escalation")`
surfaces `Beat: escalation` after the scene type tag in `badge_briefing`.
`session_recap` includes `beat_transitions` showing `{from: "mid_scene",
to: "escalation", timestamp: <ISO>}`. Setting the same beat on consecutive
`set_scene_state` calls produces no beat transition entry.
_Check:_ T-new-341.

**REQ-353 — Beat-accelerated countdown advancement.** When the current scene
beat is `climax`, every countdown carrying the `on_scene_transition` flag
(REQ-125, REQ-073) SHALL advance two ticks per scene transition instead of one.
`Setup` and `denouement` beats SHALL NOT alter the default advancement rate —
countdowns advance one tick per transition as standard. The acceleration
multiplier SHALL be configurable via `TTRPG_CLIMAX_ACCELERATION` (default 2).
Setting `TTRPG_CLIMAX_ACCELERATION` to 1 SHALL disable acceleration (climax
beats advance countdowns at the standard rate). The acceleration SHALL apply
only to `on_scene_transition` countdowns — countdowns of type `round` and those
triggered by specific events (REQ-329) are unaffected. Acceleration SHALL
revert when the beat changes away from `climax` on the next scene transition.

*Acceptance criterion:* Set beat to `climax`. Create countdown with
`on_scene_transition` flag, 5 ticks. Call `set_scene_state("Scene A")` — assert
countdown at 3 ticks remaining. Call `set_scene_state("Scene B")` — assert
countdown at 1 tick. Set `TTRPG_CLIMAX_ACCELERATION=3` — call
`set_scene_state("Scene C")` with new countdown of 5 ticks — assert 2 ticks
remaining (5 - 3). Set beat to `setup` — call `set_scene_state("Scene D")` —
assert countdown at 1 tick (standard single-tick advancement). Set
`TTRPG_CLIMAX_ACCELERATION=1` — set beat to `climax`, advance scene — assert
standard single-tick advancement (acceleration disabled).
_Check:_ T-new-360.

**REQ-336 — Dramatic pacing signal.** The server SHALL track the count of
tool calls (mutating and non-mutating) since the last scene transition or beat
change. When the count exceeds a configurable ceiling
(`TTRPG_PACING_WINDOW`, default 20), `badge_briefing` SHALL include a pacing
signal in the `narrative_threads` section (REQ-281): `[pacing] Scene
stabilized — N actions since last transition.` The signal is advisory — it
does not block or auto-advance narration. The ceiling SHALL be configurable
via `TTRPG_PACING_WINDOW`; setting it to zero disables pacing signals. The
pacing counter resets on every `set_scene_state` call (scene transition) and
on every beat change. When a pacing signal fires, the server SHALL additionally
trigger autonomous advancement per REQ-351.

*Acceptance criterion:* After 21 tool calls with no scene transition,
`badge_briefing` includes `[pacing] Scene stabilized — 21 actions since last
transition.` After `set_scene_state("new scene")`, the counter resets and the
signal disappears. Setting `TTRPG_PACING_WINDOW=0` suppresses all pacing
signals.
_Check:_ T-new-342.

**REQ-351 — Pacing-triggered autonomy.** When a pacing signal fires per
REQ-336, the server SHALL immediately perform one autonomous advancement cycle:
(a) every faction clock SHALL receive one autonomous tick per REQ-338
(regardless of whether the `TTRPG_FACTION_AUTONOMY_INTERVAL` threshold has been
met — the pacing signal overrides the interval), and (b) every NPC with a
populated `goals` field SHALL produce a goal pursuit suggestion per REQ-339
(regardless of disposition change status — the pacing signal triggers
suggestions for all goal-carrying NPCs). The combined advancement SHALL be
recorded in the audit log as `[pacing-autonomy]` with a list of factions and
NPCs affected. The REQ-348 faction-NPC coordination rule SHALL apply during
pacing-triggered autonomy: if a faction tick outcome overlaps an NPC's goal,
that NPC's suggestion SHALL be suppressed as normal. Pacing-triggered autonomy
SHALL fire at most once per `TTRPG_PACING_WINDOW` window — if play continues
without a scene transition past a second window, the pacing signal re-fires but
autonomy does not re-trigger until a scene transition resets the pacing
counter. This contract implements the narrative intuition that "while you were
deliberating, the world moved."

*Acceptance criterion:* Set `TTRPG_PACING_WINDOW=3`. Create faction with
clock and NPC with goal. Perform 4 tool calls without scene transition — assert
pacing signal fires AND audit log records `[pacing-autonomy]` with faction tick
and NPC suggestion. Perform 4 more tool calls — assert pacing signal re-fires
but `[pacing-autonomy]` does NOT re-trigger (already fired this window). Call
`set_scene_state("new scene")` — assert counter resets. Perform 4 more tool
calls — assert `[pacing-autonomy]` fires again.
_Check:_ T-new-357.

**REQ-337 — Narrative arc visibility.** The `narrative_threads` section of
`badge_briefing` (REQ-281) SHALL include a `story_beats` line showing the
sequence of completed beats within the current Novel in chronological order,
gated by badge scope: `shared` beats visible to both badges; `game_master`
beats visible to GM only. The sequence SHALL list beat names with the scene
description preview (first sentence) that produced them, e.g., `setup (\"The
hall is quiet...\") -> escalation (\"The torches flicker...\")`. An empty
sequence SHALL render `[No beats completed.]`. The sequence SHALL NOT exceed
the most recent 10 completed beats.

*Acceptance criterion:* After three `set_scene_state` calls with beats
`setup`, `escalation`, `climax`, `badge_briefing` includes the three-beat
sequence. After 12 beat transitions, only the most recent 10 appear. An empty
sequence renders the empty-state marker.
_Check:_ T-new-343.

**REQ-352 — Codex adventure beat sequences.** Codex adventure entries of kind
`adventure` (REQ-321) MAY carry an optional `suggested_beats` field — an array
of `{beat, scene_preview}` pairs where `beat` is a valid beat value per
REQ-335 and `scene_preview` is a one-sentence scene descriptor. When a Novel is
created via `create_novel(codex_adventure=...)` (REQ-088) or an adventure is
imported via `codex_import` (REQ-321) into an active Novel, and the adventure
entry carries `suggested_beats`, the sequence SHALL pre-populate the
`story_beats` briefing surface (REQ-337) with `[adventure_scaffold]`
annotation. Scaffold beats are advisory — the GM may override any beat via
`set_scene_state(beat=...)` at any time. A GM-set beat at a scaffold position
replaces the scaffold entry. Scaffold beats SHALL NOT appear in
`beat_transitions` in `session_recap` until a scene transition actually adopts
them — only GM-confirmed or auto-adopted beats enter the transition history.
Adventure entries without `suggested_beats` SHALL produce no pre-population.

*Acceptance criterion:* Create Codex adventure entry with `suggested_beats:
[{beat: "setup", scene_preview: "The tavern is quiet..."}, {beat:
"escalation", scene_preview: "A fight breaks out..."}]`. Call
`create_novel(codex_adventure=...)` — assert `badge_briefing` `story_beats`
shows both beats tagged `[adventure_scaffold]`. Call
`set_scene_state("The tavern hums", beat="setup")` — assert first scaffold beat
replaced, no `[adventure_scaffold]` tag on this entry. Advance to second beat —
assert second scaffold beat still tagged `[adventure_scaffold]` until GM
confirms it. Call `codex_import` of an adventure WITHOUT `suggested_beats` —
assert no beat pre-population.
_Check:_ T-new-358.

**REQ-338 — Faction autonomous advancement.** Faction clocks (REQ-233)
SHALL advance one tick on each scene transition per the existing coupling
contract. In addition, faction clocks SHALL advance one autonomous tick per
`TTRPG_FACTION_AUTONOMY_INTERVAL` scene transitions (configurable, default 3)
to represent faction pursuit of goals off-screen. The autonomous tick SHALL be
recorded in the faction's clock with an `[autonomous]` annotation. Faction
clocks with `TTRPG_FACTION_AUTONOMY_INTERVAL` set to zero SHALL NOT receive
autonomous ticks — only scene-transition and GM-triggered advancement applies.
Autonomous advancement SHALL NOT fire linked countdowns without GM awareness:
when an autonomous tick would fire a linked countdown, the countdown SHALL
surface a `[pending_fire]` annotation in `badge_briefing`
`narrative_threads` section (REQ-281) requiring GM confirmation via a
workflow decision.

*Acceptance criterion:* A faction with `TTRPG_FACTION_AUTONOMY_INTERVAL=3`
advances its clock by one autonomous tick on the 3rd, 6th, and 9th scene
transition. The tick is annotated `[autonomous]` in the clock state. An
autonomous tick that would fire a linked countdown produces a `[pending_fire]`
decision in `badge_briefing`. Setting the interval to zero suppresses all
autonomous advancement.
_Check:_ T-new-344. Coordination with NPC goal pursuit per REQ-348.

**REQ-339 — NPC goal pursuit.** When an NPC has a populated `goals` field
(REQ-077) and the NPC's current disposition differs from its creation default,
`badge_briefing` SHALL surface a `## World in Motion` suggestion once per
scene transition: the NPC's name, its current goal, a brief description of what
the NPC might do to pursue that goal off-screen, and three response options:
`accept` (apply the described state change), `defer` (re-surface at next
transition), `dismiss` (do not re-surface). The suggestion SHALL be derived
from the NPC's goals text and disposition, surfaced as a decision workflow.
Deferred suggestions SHALL re-appear at every subsequent scene transition
until accepted or dismissed. Dismissed suggestions SHALL NOT re-appear for
the same NPC in the same Novel. The feature is disabled by default
(`TTRPG_NPC_AUTONOMY=off`); the GM enables it per Novel.

*Acceptance criterion:* Create an NPC with `goals="Steal the crown"` and
`disposition="suspicious"` (differs from default `neutral`). Set
`TTRPG_NPC_AUTONOMY=on`. Call `set_scene_state("Throne room")` — assert
`badge_briefing` `## World in Motion` includes a goal-pursuit suggestion.
Accept it — assert the described state change applies, suggestion does not
re-appear. Defer — assert it re-appears at next transition. Dismiss — assert
it does not re-appear. `TTRPG_NPC_AUTONOMY=off` — assert no suggestions.
_Check:_ T-new-345.

**REQ-348 — Faction-NPC goal coordination.** When a faction clock receives an
autonomous tick per REQ-338, the server SHALL compare the faction's goal
description against each NPC's `goals` field. If a faction clock advancement
represents an outcome that overlaps with an NPC's current goal — the faction
name or goal text intersects the NPC's goal text — the NPC goal pursuit
suggestion for that NPC SHALL be suppressed for that scene transition. The
suppression SHALL be recorded in the audit log as `[faction-npc-coordination]`
with the faction ID, NPC ID, and suppressed goal text. The suppression is
per-transition: if the next scene transition produces no autonomous tick, the
NPC goal pursuit SHALL resume. When `TTRPG_NPC_AUTONOMY=off`, faction
autonomous advancement SHALL proceed normally per REQ-338 without NPC
coordination. The contract prevents duplicate World-in-Motion events for the
same narrative outcome.

*Acceptance criterion:* Create faction "Merchant Guild" with goal "Expand to
East Dock". Create NPC "Guildmaster Kael" with `goals="Secure the East Dock
contract"`. Set `TTRPG_FACTION_AUTONOMY_INTERVAL=3` and
`TTRPG_NPC_AUTONOMY=on`. Advance through 3 scene transitions — assert
autonomous tick fires, faction clock advances, and Guildmaster Kael's goal
pursuit suggestion is suppressed with `[faction-npc-coordination]` audit entry.
Advance 1 more transition (no faction tick) — assert Kael's goal pursuit
resumes.
_Check:_ T-new-354.

**REQ-340 — Discovered consequences.** When a countdown fires while the
active entity's characters are not present in the scene where the countdown
was linked — entity IDs absent from `characters_present` on all scenes since
the countdown was created — the consequence SHALL be surfaced as a
`[discovered]` story journal entry of type `consequence` (REQ-246). The entry
SHALL carry: the countdown name, the consequence description, the timestamp of
discovery (the scene transition when the player's entity next becomes present
in a scene linked to the countdown's location), and a `discovered` boolean set
to `true`. The entry SHALL appear in `session_recap`
`narrative_orientation` as a "Meanwhile, ..." prose fragment. Countdowns that
fire while the player's entity IS present SHALL produce standard `consequence`
entries with `discovered` unset. A `[discovered]` consequence SHALL populate
the discovering entity's `knowledge_state` per REQ-349.

*Acceptance criterion:* Create a countdown linked to Guard Room. Set entity
absent (not in `characters_present`). Advance countdown to fire. Set entity
present in Gatehouse scene (different location). Advance scene — no discovery.
Set entity present in Guard Room scene — assert `[discovered]` story journal
entry created with "Meanwhile, ..." orientation text. Countdown fires with
entity present — assert standard `consequence` entry without `discovered`.
_Check:_ T-new-346.

**REQ-349 — Consequence-to-knowledge coupling.** When a `[discovered]`
consequence fires per REQ-340, the discovering entity's `knowledge_state`
(REQ-286) SHALL be populated with a `discovered_consequence` entry carrying:
the countdown name, the consequence description, the timestamp of discovery,
and a `source: discovered_consequence` field with the countdown ID. The entry
SHALL surface in `badge_briefing` under the `knowledge_state` section token as
`[discovered]` followed by the consequence text. If the discovering entity was
absent from all scenes since the countdown's creation (per REQ-340 presence
check), the discovery represents genuine new knowledge — the entity SHALL know
what happened off-screen. If multiple entities discover the same consequence
(are all present when the countdown location is reached), each entity's
`knowledge_state` SHALL receive the entry independently. Consequence knowledge
SHALL persist in `knowledge_state` across scene transitions and Novel restarts.

*Acceptance criterion:* Create countdown linked to Guard Room. Set rogue_01
absent. Advance countdown to fire. Set scene to Guard Room with rogue_01
present — assert `[discovered]` story journal entry AND `knowledge_state`
includes `discovered_consequence` entry. Create countdown linked to Forge. Set
rogue_01 and wizard_01 absent. Advance to fire. Set scene to Forge with both
present — assert both entities receive the knowledge entry.
_Check:_ T-new-355.

**REQ-341 — Player-facing spatial surface.** When the world-model tier is
populated (REQ-195), the Player badge SHALL have access to a resolved spatial
surface through `badge_briefing`: the scene state section SHALL include the
current room name, visible exits (direction labels only — not destination
names), and visible things in the room. The spatial surface SHALL NOT include
room IDs, exit destination IDs, or world-model internal names. The AI narrator
resolves the player's spatial intent through `resolve_intent` (REQ-323) without
exposing parser mechanics; the spatial surface in `badge_briefing` gives the
player direct awareness of surroundings without requiring the AI narrator to
explicitly describe every detail. When the world-model tier is unpopulated, no
spatial surface appears — the empty-state marker renders `[No world model —
surroundings are as described by the GM.]`.

*Acceptance criterion:* A populated world model with rooms, exits, and things
produces a spatial surface in Player `badge_briefing` containing the room name,
exit directions, and visible things — without IDs or internal names. An
unpopulated world model produces the empty-state marker.
_Check:_ T-new-347.

**REQ-342 — Scene description from world-model state.** When `set_scene_state`
is called with a `location` parameter that resolves to a world-model room
(REQ-195), the scene SHALL derive a base description from the room's
world-model state: the room description string, a list of contained things,
a list of visible NPCs registered in the room (REQ-327), and visible exits
with their direction labels. The GM's `description` parameter SHALL override
the derived description. When `description` is empty and `location` resolves,
the derived world-model description SHALL serve as the scene description. When
`location` does not resolve to any room, the `description` parameter SHALL be
the sole scene description as before. This contract ensures the GM describes a
room once — the world model is the source of spatial truth.

*Acceptance criterion:* `set_scene_state("", location="Throne Room")` with
the Throne Room containing a throne thing and two NPCs produces a scene
description derived from the room description and its contents. The same call
with an explicit `description` parameter uses the explicit description. A
`location` that does not match any room uses the `description` alone.
_Check:_ T-new-348.

**REQ-343 — Unified intent resolution.** The `suggest_actions` tool
(REQ-084) SHALL resolve player intent across three domains — mechanical
(resolution tools), spatial (resolve_intent, REQ-323), and social (NPC
interaction, disposition context, persuasion) — and return suggested actions
from all matching domains in the response, grouped by domain. The response
SHALL include, for each domain with at least one match: a domain header, the
matching tools or actions with parameters, and a confidence indicator for
each match. When the intent spans multiple domains, `suggest_actions` SHALL
return suggestions from all matching domains ordered by relevance. The tool
SHALL accept an optional `entity_id` parameter; when provided, entity-specific
context (personality fields per REQ-077, voice examples, equipment, known
abilities) SHALL be included in the match weighting.

Spatial domain results SHALL delegate to `resolve_intent` (REQ-323) for exit,
constraint, and thing context. The intent resolver SHALL call `resolve_intent`
with the player's spatial intent — the response SHALL incorporate the resolved
room context, exits, constraints, and override hints — rather than
independently querying the world model. This ensures spatial suggestions and
parser-based navigation draw from the same resolution pipeline.

Social intents SHALL resolve against: the target NPC's disposition (REQ-075),
the caller entity's relationship to the target (REQ-236), any active scene
type of `social` (REQ-087), and the ruleset's social-skill catalogue. The
resolution SHALL return: the most relevant skill check tool with the target
NPC's name as context, any available constraint overrides that could affect
the outcome (REQ-325), and a narrative framing hint derived from the NPC's
personality fields.

*Acceptance criterion:* `suggest_actions("convince the guard to let us
pass", entity_id="bard_01")` returns mechanical suggestions (skill check
with persuasion), spatial context (current room exits), and social context
(guard's disposition, relationship). A purely mechanical intent ("attack the
goblin") returns only mechanical suggestions.
_Check:_ T-new-349.

**REQ-344 — Voice example feedback.** The Player badge SHALL be able to
provide feedback on the AI narrator's portrayal of their entity's voice
through `player_signal` (REQ-078). A `signal="voice_feedback"` with a
`value` containing a corrected dialogue snippet SHALL cause the server to:
(a) append the corrected snippet to the entity's `voice_examples` array
(REQ-077) tagged `[player-corrected]` with the original snippet context;
(b) record a `[voice_feedback]` entry in the audit log (REQ-040) with the
original and corrected text; (c) surface the correction in `badge_briefing`
under the entity's personality group as a `[voice-corrected]` annotation on
the relevant voice example. A correction replaces the AI-generated snippet's
`dialogue` text while preserving `context` and `tag` fields. The
`[player-corrected]` annotation SHALL render visually distinct from enrichment
`[supplementary]` tags (REQ-080) and Codex `[codex-corrected]` tags (REQ-347)
in `badge_briefing` — each annotation reflects a different provenance tier
(player feedback, community enrichment, cross-Novel Codex import). The Player
may
issue up to 3 corrections per session (configurable via
`TTRPG_MAX_VOICE_CORRECTIONS_PER_SESSION`); exceeding the limit SHALL return
`[WARNING] Voice correction limit reached for this session.`. The limit resets
on `TTRPG_SESSION_ID` change per REQ-237. Voice corrections SHALL be capturable
to the Codex for cross-Novel persistence per REQ-347.

*Acceptance criterion:* `player_signal("voice_feedback", "She wouldn't say
that — she'd say 'The door is trapped. Stand back.'")` appends a
`[player-corrected]` snippet. `badge_briefing` shows the correction.
`character_sheet` shows the updated voice example. Fourth correction in same
session returns `[WARNING]`. Session ID change resets the limit.
_Check:_ T-new-350.

**REQ-347 — Voice feedback codex capture.** Voice feedback corrections stored
in entity `voice_examples` per REQ-344 SHALL be capturable to the Codex (REQ-321)
via `codex_capture("voice_profile", entity_id, update_source=true)`. A Codex
entry of kind `voice_profile` SHALL store: the entity's name, the corrected
dialogue snippets with preserved `context` and `tag` fields, the original
AI-generated text for each correction, the Novel slug where corrections were
made, and the entity's background text. When `codex_import` imports a
`voice_profile` into a Novel, the corrected voice examples SHALL populate the
matching entity's `voice_examples` field tagged `[codex-corrected]`, visually
distinct from `[player-corrected]` (REQ-344) and `[supplementary]` (REQ-080) in
`badge_briefing` rendering. A Codex `voice_profile` SHALL NOT contain mechanical
stats — it carries only personality and voice fields (REQ-077). The
`update_source` flag SHALL push Novel-level voice corrections back to the source
Codex entry in-place, matching the bidirectional sync contract of REQ-321.

*Acceptance criterion:* Call `player_signal("voice_feedback", "She wouldn't
say that — she'd say 'Stand back.'")` on an entity. Call
`codex_capture("voice_profile", entity_id, update_source=true)` — assert Codex
entry created with corrected dialogue, original text, and Novel provenance. Call
`codex_import("<id>")` into a new Novel — assert entity voice_examples tagged
`[codex-corrected]`.
_Check:_ T-new-353.

**REQ-345 — Background-derived knowledge.** Character knowledge SHALL extend
beyond presence-scoped percepts (REQ-308). When an entity's personality fields
include a populated `background` string (REQ-077), the `knowledge_state`
briefing section (REQ-286) SHALL include a `background_knowledge` subsection
listing the entity's background text and a boundary directive for the AI
narrator: "The character may know things their background implies — regional
geography from 'soldier', academic knowledge from 'sage', underworld contacts
from 'criminal' — without needing to have witnessed them in a scene. The AI
narrator SHALL surface plausible background knowledge when the scene context
makes it relevant, and SHALL NOT gate such knowledge on presence." The
subsection SHALL be present when `background` is populated; absent when empty.
Background knowledge is advisory — it instructs the AI narrator to permit
reasonable inference but does not populate the `knowledge_state` with explicit
facts. The background string SHALL additionally be matched against lore entry
triggers per REQ-350.

*Acceptance criterion:* Create entity with `background="Veteran of the
Border Wars"`. `badge_briefing` `knowledge_state` includes
`background_knowledge` subsection with the background text and boundary
directive. Entity with empty `background` — subsection absent.
_Check:_ T-new-351.

**REQ-350 — Background lore triggering.** An entity's populated `background`
string SHALL be tokenized into keywords. The server SHALL match those keywords
against the trigger lists (REQ-083) of all active lore entries in the Novel.
Lore entries whose triggers intersect the background keyword set SHALL surface
in the entity's `badge_briefing` `knowledge_state` subsection tagged
`[background_relevant]`, with the lore entry key, a content preview, and the
matched trigger word. The match is advisory — it informs the AI narrator that
this lore may relate to the character's background but does not automatically
reveal the lore's full content or populate `knowledge_state` with explicit
facts. Background lore matching SHALL NOT fire on lore entries tagged
`game_master`-scope (REQ-083 hat_scope) — only `shared`-scope entries are
matched. The match SHALL re-evaluate on every `badge_briefing` render to
accommodate lore entry additions and removals during play.

*Acceptance criterion:* Create entity with `background="Veteran of the Border
Wars"`. Create lore entry `border_treaty` with triggers `["border", "war",
"treaty"]` and `hat_scope="shared"`. Call `badge_briefing` — assert
`knowledge_state` includes `[background_relevant]` subsection listing
`border_treaty` with matched trigger "war". Create lore entry `gm_secret` with
triggers `["war"]` and `hat_scope="game_master"` — assert it does NOT appear in
Player `badge_briefing` background matches. Create entity with empty
`background` — assert `[background_relevant]` subsection absent.
_Check:_ T-new-356.

**REQ-355 — Secret-countdown coupling.** WHEN a secret is revealed to an
entity via `reveal_secret` (REQ-234) AND a countdown exists whose `scope`
or `direction` text references the secret's key, THE server SHALL surface
an advisory in the `narrative_threads` briefing section (REQ-281)
suggesting the countdown be advanced. The advisory SHALL carry the
secret's key, the countdown name, and a prompt for the GM to advance or
ignore. This is a navigational coupling — the server suggests; the GM
decides.

*Acceptance criterion:* Create a secret "betrayal" and a countdown with
`scope` containing the term "betrayal." Call `reveal_secret("betrayal",
"pc_01")` — assert `badge_briefing` `narrative_threads` includes a
countdown-advancement advisory referencing the secret and countdown.
Create a secret and countdown with no overlap — assert no advisory.
_Check:_ T-new-362.

**REQ-356 — Vow-lore coupling.** WHEN a vow is set via `set_vow` (REQ-289)
AND an active lore entry exists whose `triggers` or `key` intersect the
vow's `name` or `description` text, THE server SHALL surface matching
lore entries in the `narrative_threads` briefing section (REQ-281) tagged
`[vow-relevant]`. The match SHALL re-evaluate on each `badge_briefing`
render. This is a navigational coupling — lore is surfaced as guidance,
not auto-revealed.

*Acceptance criterion:* Create lore entry "crown_of_alara" with trigger
"crown". Call `set_vow("Find the Crown", "Retrieve the Crown of Alara",
...)` with at least one party member — assert `badge_briefing`
`narrative_threads` includes `[vow-relevant] crown_of_alara` with content
preview. Call `resolve_vow` — assert the match no longer appears on next
briefing.
_Check:_ T-new-363.

**REQ-357 — Story journal-faction coupling.** WHEN a story journal entry
of type `consequence` or `moment` is recorded via `record_story` (REQ-246)
AND a faction exists whose `goals` text references an entity or location
named in the entry, THE server SHALL surface a faction-clock-advancement
advisory in the `narrative_threads` briefing section (REQ-281). The
advisory SHALL carry the faction name, the matching goal text, the story
entry preview, and a prompt for the GM to advance or ignore. This is a
navigational coupling — the server suggests; the GM decides.

*Acceptance criterion:* Create faction "Merchant Guild" with goal
"Control the docks." Call `record_story("consequence", "The docks were
destroyed")` — assert `badge_briefing` `narrative_threads` includes
faction-clock-advancement advisory referencing the Merchant Guild. Call
`record_story("moment", "The sunset was beautiful")` — assert no advisory
(no entity or location overlap).
_Check:_ T-new-364.

**REQ-358 — Countdown-NPC disposition coupling.** WHEN a countdown fires
via `advance_countdown` or scene transition (REQ-073, REQ-125) AND an NPC
exists whose `location` matches the countdown's `scope`, THE NPC's
disposition SHALL shift toward the countdown's `direction`: `hostile`
countdowns shift the NPC toward `hostile` disposition; `benign`
countdowns shift toward `friendly`. The shift SHALL be one step on the
disposition scale — `neutral` to `suspicious`, `friendly` to `neutral`,
and so on. The shift SHALL be recorded in the audit log with
`[countdown-disposition]` annotation carrying the NPC ID, countdown name,
and disposition change. This is a mechanical coupling — disposition
changes automatically on countdown fire.

*Acceptance criterion:* Create NPC "Guard" with `disposition="neutral"`,
`location="gatehouse"`. Create `hostile`-direction countdown with
`scope="gatehouse"`. Fire the countdown — assert Guard's disposition
shifts to `suspicious` with `[countdown-disposition]` audit entry. Create
`benign`-direction countdown — fire — assert Guard shifts back to
`neutral`. NPC outside countdown scope — assert no shift.
_Check:_ T-new-365.

**REQ-359 — Relationship-countdown coupling.** WHEN a relationship type
changes from `ally` to `rival` or `hostile` via `set_relationship`
(REQ-236) AND a countdown exists whose `scope` or `direction` text
references either entity in the relationship, THE server SHALL surface an
advisory in the `narrative_threads` briefing section (REQ-281) suggesting
the countdown be advanced or a new countdown be created to represent the
fallout. The advisory SHALL carry both entity names, the relationship
change, and the matching countdown name. This is a navigational coupling
— the server suggests; the GM decides.

*Acceptance criterion:* Create countdown with `scope="alliance"`. Call
`set_relationship("pc_01", "npc_guard", "ally")`. Then call
`set_relationship("pc_01", "npc_guard", "rival")` — assert
`badge_briefing` `narrative_threads` includes relationship-countdown
advisory referencing the countdown. Flip relationship where no matching
countdown exists — assert no advisory.
_Check:_ T-new-366.

**REQ-360 — Lore-countdown coupling.** WHEN a lore entry is created or
updated via `set_lore_entry` or `update_lore_entry` (REQ-083) AND the
lore entry's `triggers` include temporal urgency keywords ("imminent,"
"approaching," "deadline," "ticking," "countdown") AND no countdown
exists whose `name` or `scope` matches the lore entry's `key`, THE server
SHALL surface a countdown-creation advisory in the `narrative_threads`
briefing section (REQ-281) suggesting a countdown be created from the
lore entry's content. The advisory SHALL carry the lore entry key, the
matched urgency trigger, and a prompt for the GM to create or ignore.
This is a navigational coupling — the server suggests; the GM decides.

*Acceptance criterion:* Call `set_lore_entry("impending-raid", "The
goblins are marching — they will be here by nightfall.",
triggers=["raid", "imminent"])` — assert `badge_briefing`
`narrative_threads` includes a countdown-creation advisory referencing
"impending-raid" and the "imminent" trigger. Call
`set_lore_entry("forest-lore", "The woods are old and deep.",
triggers=["forest"])` — assert no advisory (no urgency keywords). Create
countdown with matching name — assert advisory suppressed.
_Check:_ T-new-367.

**REQ-361 — NPC-vow coupling.** WHEN an NPC has a populated `goals` field
(REQ-077) AND the GM calls `badge_briefing`, THE `narrative_threads`
section (REQ-281) SHALL include a vow-creation suggestion for each
goal-carrying NPC whose goal text exceeds 20 characters and does not
already match an active vow's `description`. The suggestion SHALL carry
the NPC name, the goal text, and a prompt for the GM to create a
corresponding vow via `set_vow` (REQ-289). This is a navigational
coupling — the server suggests; the GM decides. An NPC whose goal text
already appears in an active vow's `description` SHALL NOT produce a
suggestion.

*Acceptance criterion:* Create NPC "Blacksmith" with
`goals="Forge the legendary blade Starfang"`. Invoke `badge_briefing` —
assert `narrative_threads` includes vow-creation suggestion naming the
Blacksmith and their goal. Call `set_vow("Forge Starfang", "Forge the
legendary blade Starfang", ...)` with at least one party member — assert
suggestion no longer appears. NPC with short goal ("smith stuff") —
assert no suggestion.
_Check:_ T-new-368.

**REQ-362 — Faction-vow coupling.** WHEN a faction exists with a
populated `goals` array (REQ-233) AND the GM calls `badge_briefing`,
THE `narrative_threads` section (REQ-281) SHALL include a vow-creation
suggestion for each faction goal that intersects the party's interests —
the goal text references an entity, location, or faction known from lore
entries or story journal records — and does not already match an active
vow's `description`. The suggestion SHALL carry the faction name, the
matching goal text, and a prompt for the GM to create a vow via `set_vow`
(REQ-289). This is a navigational coupling — the server suggests; the GM
decides.

*Acceptance criterion:* Create faction "Thieves Guild" with goal
"Steal the Crown of Alara". Create lore entry referencing "Crown of
Alara". Invoke `badge_briefing` — assert `narrative_threads` includes
faction-vow suggestion naming the Thieves Guild and the crown goal.
Create faction with goal that references no known entities — assert no
suggestion.
_Check:_ T-new-369.

**REQ-363 — Secret-world coupling.** The `set_secret` tool (REQ-234)
SHALL accept an optional `world_target` parameter that references a
world-model room ID (REQ-195). When a secret carries a `world_target`,
the secret's triggers SHALL be matched against the room's
`room_description` text in addition to scene description text (REQ-083).
The secret SHALL surface in `badge_briefing` `narrative_threads` tagged
`[world-linked]` when the active scene's `location` resolves to the
targeted room. This is a navigational coupling — the secret is annotated
with location context; it does not auto-reveal.

*Acceptance criterion:* Create world-model room "Vault". Call
`set_secret("vault-trap", "The floor is pressure-plated",
world_target="vault")`. Call `set_scene_state("The strongroom",
location="Vault")` — assert `badge_briefing` `narrative_threads` includes
`[world-linked]` vault-trap entry. Call `set_scene_state("The garden",
location="Inn")` — assert entry absent.
_Check:_ T-new-370.

**REQ-364 — Faction-world coupling.** The `create_faction` and
`update_faction` tools (REQ-233) SHALL accept an optional `territory`
parameter referencing one or more world-model room IDs (REQ-195). When a
faction carries `territory`, the faction's clock and goal surface SHALL
appear in `badge_briefing` `narrative_threads` tagged `[territorial]`
when the active scene's `location` resolves to a room within the
faction's territory. This is a navigational coupling — the faction is
annotated with location context; its clock behavior is unchanged.

*Acceptance criterion:* Create world-model room "Throne Room". Call
`create_faction("Royal Guard", goals=["Protect the crown"],
territory=["throne_room"])`. Call `set_scene_state("The royal chamber",
location="Throne Room")` — assert `badge_briefing` `narrative_threads`
includes `[territorial] Royal Guard` with clock state. Call
`set_scene_state("The kitchen", location="Pantry")` — assert faction
absent from `narrative_threads`.
_Check:_ T-new-371.

**REQ-365 — Server notes narrative coupling.** Server notes set via
`set_server_note` (REQ-285) SHALL accept an optional `narrative_tag`
parameter from the set: `campaign_bible`, `house_rules`, `lore_seed`, or
`session_reminder`. Server notes carrying a `narrative_tag` SHALL surface
in the `badge_briefing` supplementary guidance alongside enrichment items
(REQ-080), tagged with the narrative tag value. Server notes without a
`narrative_tag` SHALL remain in the server notes resource only, as
current behavior. This is a navigational coupling — server notes are
surfaced as GM guidance in the briefing prompt.

*Acceptance criterion:* Call `set_server_note("old-gods", "The old gods
were banished to the outer dark", narrative_tag="lore_seed")` — assert
`badge_briefing` supplementary guidance includes `[lore_seed] The old
gods were banished..."`. Call `set_server_note("dm-reminder", "Remind
players about the curse", narrative_tag="session_reminder")` — assert
surfaces with `[session_reminder]` tag. Call without `narrative_tag` —
assert absent from `badge_briefing`. Player badge — assert server notes
absent from briefing regardless of tag.
_Check:_ T-new-372.

**REQ-366 — Observer narrative surface.** When the active badge is
`observer` (REQ-305), the `badge_briefing` SHALL compose narrative
surfaces from both Game Master and Player perspectives: scene state
and scene type (REQ-076, REQ-087) from the GM surface, entity presence
and personality (REQ-307, REQ-077) from the Player surface, the combined
narrative threads from both perspectives (REQ-281), and an orientation
directive indicating the AI narrates from an omniscient perspective. The
observer badge SHALL NOT see GM-only surfaces — secrets (REQ-234),
faction clock states (REQ-233), countdown tick positions (REQ-073), or
the DM context (REQ-232). The observer SHALL NOT mutate state — the
read-only contract of REQ-305 applies to all narrative tools.
Enrichment content (REQ-159) SHALL render in the observer `badge_briefing`
under the same badge-filtering rules as the Player badge:
game_master-scoped enrichment items are hidden; shared-scope items are
visible. The observer SHALL have read-only access to world-model
inspection tools — `resolve_intent` (REQ-323), parser `look` and
`examine` commands, and resource reads (`room://<id>`, `thing://<id>`,
`world://map`) — consistent with the state-query permission of REQ-305.

The observer `badge_briefing` SHALL include presence markers and
`knowledge_state` for all entities present in the Novel — the observer
sees what the AI (playing both roles) knows for every character. Entity
presence markers (REQ-307) and knowledge scoped by attendance (REQ-308)
are unfiltered under the observer badge, matching the GM-level visibility
contract: the human watches the AI auto-play, so no entity's percepts are
hidden.

*Acceptance criterion:* Call `set_badge("observer")` on a populated
Novel. Assert `badge_briefing` includes scene state, entity personality,
and narrative threads with omniscient-role orientation directive. Assert
`badge_briefing` includes `[not present]` markers and `knowledge_state`
for all entities (not just the active entity). Assert `badge_briefing`
excludes secrets, faction clocks, countdown positions, and DM context.
Assert `set_scene_state("test")` returns `[FORBIDDEN]` as before.
_Check:_ T-new-373.

**REQ-346 — Narrative coherence attestation.** Before handoff (§9), the
builder SHALL include in DECISIONS.md (6) a `narrative_coherence` attestation
recording that: (a) every narrative-critical REQ is implemented — the
verification workflow G7 narrative coherence attestation passed; (b) the
`badge_briefing` prompt, when rendered against a populated Novel, includes
all decision-critical and supplementary narrative sections as defined by
REQ-109; (c) a smoke-session transcript (5+ turns of cooperative play)
demonstrates that the server's narrative surfaces support coherent story flow.
The smoke-session transcript SHALL be embedded or linked in DECISIONS.md (6).
A build missing this attestation is a handoff defect.

*Acceptance criterion:* DECISIONS.md (6) contains a `narrative_coherence`
section sub-headed `@section evidence` with the three attestation points and
an embedded or linked smoke-session transcript.
_Check:_ T-new-352.

---

### 5.13 Holodeck

**REQ-369 — Holodeck archetype taxonomy.** Every Novel property group
(§7.7) SHALL be assigned one or more archetypes — Temporal, Entity-bearing,
Scene-anchored, Knowledge-carrying, Narrative-memory, Spatial, Relational,
Decision, Guidance, Session, or Ruleset Wisdom — as defined in §7.7.0.
Every cross-property coupling in §7.7.1 SHALL trace to one or more coupling
pattern rules (P1–P23, §7.7.0). A coupling that does not trace to a pattern
rule is a spec defect. Archetypes classified as `[content source]` denote
input sources that populate property groups — they are excluded from the
coupling cross-product. `npm run validate` SHALL verify that every coupling
row in §7.7.1a cites a valid pattern rule.

*Acceptance criterion:* `npm run validate` reports no untraced coupling rows
and no coupling row with an invalid or missing pattern rule reference.
_Check:_ T-new-376.

**REQ-370 — Coupling completeness.** Every ordered property-group pair in
the Novel properties table (§7.7) — excluding `[content source]` groups —
SHALL be accounted for in the coupling table (§7.7.1). Each pair SHALL carry
either a defined coupling in §7.7.1a or an explicit `[none]` declaration in
§7.7.1b. An ordered pair with neither is a spec defect. `npm run validate`
SHALL report any unaccounted pair as an error. WHEN a new property group is
added to §7.7, THE author SHALL assign its archetypes and extend §7.7.1 for
every pair involving the new group — pattern rules dictate coupling behaviors;
`[none]` is declared where no pattern rule applies.

*Acceptance criterion:* `npm run validate` exits zero on coupling
completeness; exits non-zero when any ordered pair is unaccounted.
_Check:_ T-new-377.

**REQ-371 — Ruleset Wisdom as rendered reality.** Ruleset Wisdom — the seven
enrichment output modules extracted during Discovery (REQ-225) — SHALL be
rendered as first-class server behavior, not advisory guidance. WHERE Ruleset
Wisdom content describes pacing patterns, dramatic structure, NPC voice
conventions, or encounter design, THE server SHALL mechanically enact those
patterns per the coupling contracts defined in §7.7.0 (P5–P11). The GM may
override individual Wisdom items via `deactivate_enrichment_item`. Ruleset
Wisdom survives `revert_enrichment`. Wisdom items extracted from the ruleset
but not yet implemented in the current build SHALL render as Navigational
suggestions until the builder implements the Mechanical coupling.

*Acceptance criterion:* An NPC created in a Novel with active Ruleset Wisdom
carries voice_examples, goals, and personality patterns without manual GM
activation. A countdown created from Wisdom pacing patterns advances
automatically on scene transitions. Deactivating the responsible Wisdom item
suppresses the mechanical behavior.
_Check:_ T-new-378.

**REQ-374 — Archetype coverage.** Builder SHALL verify during convergence Phase 1
that every Novel property group defined in §7.7 carries at least one Holodeck
archetype from the set defined in §7.7.0 (Temporal, Entity-bearing,
Scene-anchored, Knowledge-carrying, Narrative-memory, Spatial, Relational,
Decision, Guidance, Session, Ruleset Wisdom). A property group without an
archetype produces zero couplings — the coupling completeness metric in Phase 2
cannot detect this gap. The metric threshold is 100%: all 16 property groups
classified. Missing archetype assignments SHALL be resolved by re-reading §7.7.0
definitions and reassigning archetypes per the coupling pattern rules that govern
each group's behavioral nature.

*Acceptance criterion:* Every property group in §7.7 carries ≥1 archetype. A
group missing an archetype causes this metric to fail, directing the builder to
re-read and re-classify before proceeding to Phase 2.
_Check:_ T-new-381.

**REQ-375 — Wisdom mechanical coupling rate.** During convergence Phase 1, after
Enrichment population meets its threshold, the builder SHALL verify that Wisdom
items extracted from the ruleset include Mechanical couplings — not exclusively
Navigational ones. The metric measures: Wisdom items classified with Mechanical
coupling nature per §7.7.1a / total Wisdom items extracted. Threshold: ≥30%
Mechanical. A build where all Wisdom items are Navigational meets the Enrichment
population metric but violates REQ-371's intent — the ruleset's guidance should
render as server behavior. The builder SHALL improve the rate by re-reading
ruleset source sections where the text carries strong behavioral language
(procedures, pacing directives, structural patterns), re-classifying items from
Navigational to Mechanical where the coupling contract supports it.

*Acceptance criterion:* At least 30% of extracted Wisdom items carry Mechanical
coupling nature in §7.7.1a. A build with Wisdom items exclusively Navigational
causes this metric to fail, directing the builder to re-classify.
_Check:_ T-new-382.

---

### 5.14 Content Sources

**REQ-372 — Supplementary ruleset import.** The server SHALL support runtime
import of supplementary TTRPG rulesets via `import_supplementary`. Import is
Novel-scoped — each Novel records its active supplementary rulesets under
`supplementary_rulesets: [<slug>, ...]`. Import IS reversible via
`remove_supplementary`. WHEN a supplementary ruleset is imported, THE server
SHALL:

- (a) Run extraction against the supplementary source per REQ-011 (confidence
  thresholds) and REQ-225 (Wisdom module classification). Extraction
  confidence SHALL be recorded in the Novel's metadata alongside the content
  hash. Confidence below the `TTRPG_CONFIDENCE_FLOOR` (REQ-011) SHALL NOT
  block import — low-confidence items carry `[LOW]` markers in tool output
  and badge briefing, and `spec_health` SHALL report
  `supplementary_confidence_warnings`.

- (b) Register extracted mechanics as MCP tools per REQ-020 and REQ-373,
  available in the current Novel — new spells, classes, monsters, equipment,
  and resolution mechanics.

- (c) Render extracted Ruleset Wisdom per REQ-371 (P5–P11) — mechanically
  coupled, not advisory.

- (d) Record the supplementary ruleset's slug and content hash in the Novel's
  metadata.

- (e) On Novel resume, re-resolve supplementary rulesets — if a source file
  is missing or hash-mismatched, surface `[supplementary_gap]` in
  `spec_health` and render available content with a `[partial]` marker.

Import is Game Master only, editing-mode only (no badge active).
Supplementary rulesets do not affect other Novels — tools and Wisdom are
Novel-scoped. The server MAY cache extraction results across Novels that
import the same supplementary source. `remove_supplementary` deactivates all
tools and Wisdom from the supplementary ruleset in the current Novel; state
derived from supplementary content (NPCs created from supplementary stat
blocks, lore from supplementary Wisdom) persists — the tools that created
them are no longer available.

WHEN the builder's chosen stack cannot support dynamic tool registration,
THE builder SHALL record a waiver in DECISIONS.md (5) citing the technical
constraint, and supplementary ruleset import SHALL be limited to Ruleset
Wisdom only — mechanics from supplementary sources require a full rebuild.
The waiver SHALL re-evaluate on each builder version.

*Acceptance criterion:* Call `import_supplementary("xanathars-guide.md")`
in a Novel — assert new spells, classes, and Wisdom appear in `tools/list`,
`badge_briefing`, and `list_enrichment_items`. Assert Wisdom mechanically
couples per P5–P11. Call `remove_supplementary("xanathars-guide.md")` —
assert tools and Wisdom removed. End Novel and resume — assert supplementary
ruleset re-resolves. Move the source file — assert `[supplementary_gap]` in
`spec_health`.
_Check:_ T-new-379.

**REQ-373 — Dynamic tool registration.** The server SHALL support
registration of additional MCP tools at runtime when supplementary rulesets
are imported (REQ-372). Dynamically registered tools SHALL conform to the
same contracts as build-time tools: response prefix (REQ-001), error
taxonomy (REQ-002), roll transparency (REQ-003), source quoting (REQ-061),
and badge gating (REQ-032). `tools/list` SHALL include dynamically
registered tools alongside build-time tools. `tools/list` output SHALL
annotate dynamically registered tools with their source supplementary
ruleset slug. When a supplementary ruleset is removed (REQ-372), its tools
SHALL be deregistered — `tools/list` and tool invocation SHALL behave as if
the tools were never present.

*Acceptance criterion:* After `import_supplementary`, `tools/list` includes
new tools annotated with source slug. Tool invocation produces `[OK]` with
response prefix, error taxonomy, and source quoting. After
`remove_supplementary`, tools are absent from `tools/list` and invocation
returns `[NOT_FOUND]` (tool not recognized by the MCP layer).
_Check:_ T-new-380.

