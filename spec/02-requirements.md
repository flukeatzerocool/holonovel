## 5. Requirements

_The normative core. Each requirement is one paragraph followed by its check citations._

| §       | Title                               | REQs                                                | Count |
|---------|-------------------------------------|-----------------------------------------------------|-------|
| 5.1     | Output and Error Contracts          | 001–004, 060–062, 064, 070–071, 101, 113, 118      | 19    |
| 5.2     | Extraction and Confidence           | 010–018, 099, 102, 111, 147, 153–154, 212, 214–215, 225           | 19    |
| 5.3     | Tools, Resources, and Lookups       | 020–025, 057–059, 063, 067, 078, 105–107, 110, 112, 138–139, 160 | 20    |
| 5.4     | Decision Workflows                  | 042, 056, 104, 140, 151–152, 224                     | 7     |
| 5.5     | Hats and Access                     | 030–032, 066, 109, 133–137, 148–150, 159, 216, 220, 223 | 17    |
| 5.6     | State and Lifecycle                 | 040–041, 043–044, 065, 069, 072–077, 079, 116, 119–124, 126–129, 132, 156, 203–206, 217, 221, 229 | 34    |
| 5.7     | Determinism, Safety, and Performance | 050–055, 100, 157                                   | 8     |
| 5.8     | Enrichment, Lore, and Macros          | 080–087, 103, 114–115, 125, 130, 155, 158, 226–228, 230–231           | 20    |
| 5.9     | Novel Persistence and Transport       | 088–098, 117, 131                                   | 12    |
| 5.10    | World-Model Layer                     | 195–202, 222                                       | 9     |
| 5.11    | Ruleset-Free Build Mode               | 218–219                                             | 2     |

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
_Check:_ Gate 2; Appendix D.

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

**REQ-002 — Error taxonomy.** _(F1)_ Every error carries a category: `[FORBIDDEN]`,
`[NOT_FOUND]`, `[INVALID_INPUT]`, `[STATE_CONFLICT]`, `[RULE_VIOLATION]`,
`[UNIMPLEMENTED]`, `[AMBIGUOUS]`, or `[MISSING_PARAM]`.
`[NOT_FOUND]` and `[INVALID_INPUT]` must enumerate session-visible valid
values in the corrective action, derived from the ruleset index and filtered by hat.
When a single close match exists (fuzzy match), include a
"Did you mean?" hint above the enumeration (e.g. `Did you mean 'longsword'?`). When
multiple close matches exist, list them all ("Did you mean one of…"). An
empty-string search returns no results — not an error — with valid-value enumeration.
`[FORBIDDEN]` directs callers to use `set_hat` to switch hats. `[STATE_CONFLICT]` is raised
when an action cannot proceed in the current state (undo with empty snapshot stack, resume of
ended game, undo while a workflow is pending). `[AMBIGUOUS]` is raised when the input
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
error — switching hats for `[FORBIDDEN]`, providing a valid value from the
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

**REQ-002c — Hat-filtered error values.** Valid-value enumerations in
`[NOT_FOUND]` and `[INVALID_INPUT]` errors exclude values the caller's current
hat cannot access — a Player hat sees only player-accessible spell names in a
`[NOT_FOUND]` on `lookup_spell`; a Game Master hat sees the full catalogue.
"Did you mean?" hints follow the same hat filter. A value that exists in the
ruleset but is invisible to the caller's hat is treated as absent for
enumeration purposes — it is neither enumerated nor hinted. This prevents
side-channel disclosure of GM-only content through error message verbosity.
*Acceptance criterion:* A Player-hat `[NOT_FOUND]` on `lookup_spell` with a
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
_Check:_ Gate 2, T47.

**REQ-004 — Truncation.** Tool output longer than a configurable limit
is truncated with `… [truncated — full content: output://<tool>/<counter>]`. `output://`
payloads are session-local, hat-filtered, and evict the oldest when exceeding the session
limit. Stat blocks shown within truncated output follow the same limit rules. Stat blocks are
presented in the ruleset's baseline format, with all fields regardless of truncation
(see REQ-004a). Prompt output truncation (REQ-118, REQ-135) is a separate mechanism — REQ-004
governs tool-level output only.
*Acceptance criterion:* A tool output exceeding 32,000 bytes is truncated with an
`output://` pointer; retrieving the pointer returns the full content, hat-filtered.
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
full untruncated tool output as Markdown, hat-filtered per REQ-032. The resource
SHALL declare MIME type `text/markdown` and a title of the form
"<tool_name> output #<counter>". Output payloads SHALL be session-local — they do
not survive server restart. When the session's output storage exceeds a
configurable limit (default 50 payloads), the oldest payload SHALL be evicted and
its URI SHALL return `[ERROR] [NOT_FOUND]` with a message indicating eviction.
*Acceptance criterion:* After a tool produces output exceeding 32,000 bytes,
`resources/templates/list` includes `output://{tool_name}/{counter}`; reading
the resolved URI returns the full untruncated content, hat-filtered; pushing
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
*Check:* T47.

**REQ-061 — Source quoting.** Lookup results, search results, and rule-derived tool
responses include a `---`-separated source block with `<file>#<anchor>` label and verbatim
Markdown excerpt preserving original formatting. Pure-state tools (undo, state queries,
condition queries, audit reads) are exempt.
*Acceptance criterion:* A spell lookup result ends with a `---`-separated block
containing `<file>#<anchor>` and the verbatim Markdown text from the source; an
undo result contains no source block.
_Check:_ T48.

**REQ-062 — Hat foundations.** `hat_briefing` includes ruleset-agnostic best-practice
foundations for each hat. The Enrich workflow (§11.1) supplies the expanded foundations
catalogue at `guidance://<hat>/foundations` as supplementary guidance.
*Acceptance criterion:* `hat_briefing` for the Player hat includes ruleset-agnostic
foundations guidance; the Game Master briefing includes both player and GM foundations.
_Check:_ T26.

**REQ-070 — Anti-slop guidance.** Hat foundations include anti-slop guidance — concrete
examples of forbidden narrative patterns with corrected alternatives, tagged `[anti-slop]`
and served at `guidance://<hat>/anti-slop`. The spec carries a synopsis in Appendix J; the
full anti-slop catalogue is sourced from the Enrich workflow (§11.1) as supplementary guidance,
with genre-specific examples from the `adventure_advice` module. Anti-slop guidance is
hat-filtered and appears in `hat_briefing` after foundations and before scene state.
*Acceptance criterion:* (a) Without enrichment, `hat_briefing` includes at least one
`[anti-slop]`-tagged item per hat sourced from the Appendix J synopsis, each carrying a
forbidden narrative pattern and a corrected alternative; (b) the content is hat-filtered
(rows 1–10 are GM-scoped, rows 5–7 and 12 are Player-scoped, rows 8–11 are GM-scoped);
(c) anti-slop guidance appears after foundations and before scene state;
(d) `guidance://<hat>/anti-slop` renders the same patterns as a retrievable resource.
_Check:_ T223.

**REQ-184 — Anti-slop resource rendering.** The server serves anti-slop guidance at
`guidance://<hat>/anti-slop` as a Markdown resource. The resource SHALL include every
Appendix J synopsis pattern whose scope matches the requested hat. Each pattern SHALL
appear as a `[anti-slop]`-tagged item with its Forbidden and Correct text. When enrichment
is active (REQ-159), the resource SHALL include both the Appendix J synopsis and
enrichment-supplied anti-slop items; enrichment items SHALL be tagged `[supplementary]`
with source URL and confidence. Without enrichment, the resource SHALL contain only the
Appendix J synopsis.
*Acceptance criterion:* `guidance://<hat>/anti-slop` returns Markdown containing every
Appendix J pattern for the requested hat, each tagged `[anti-slop]` and hat-filtered;
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

**REQ-071 — Narrative tone samples.** `hat_briefing` includes up to three
`[narrative-tone]`-tagged guidance items per hat — example-of-play prose extracted from the
ruleset that demonstrates the ruleset's narrative tone, served at `guidance://<hat>/tone`. Each
carries source anchor and confidence. Discovery (§6.3) extracts these snippets as a
guidance subcategory. When the ruleset provides none, the Enrich workflow (§11.1) may
source community examples. Entity-level voice_examples (REQ-077) are distinct — those
are dialogue snippets attached to specific characters.
*Acceptance criterion:* `hat_briefing` includes at least one `[narrative-tone]`-tagged
item per hat — a prose excerpt from the ruleset demonstrating its narrative
voice, with source anchor and confidence.
_Check:_ T26.

**REQ-064 — Hat behavioral boundaries.** The server respects hat boundaries in
all tool output. The Game Master hat describes situations and surfaces information; it
never takes action or makes decisions on behalf of the player. The Player hat describes
character intent; it never prescribes world facts or narrative outcomes without Game
Master confirmation.
*Acceptance criterion:* A Game Master hat `hat_briefing` describes situations without
prescribing player actions; a Player hat briefing describes character intent without
stating world facts the GM has not established.
_Check:_ T51.

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
guidance items with GM-only hat scope (REQ-016), mechanics extracted from
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
is guaranteed by seed or session-dependent; (d) the hat model with
tool-access implications; and (e) the state model describing what survives
restart and what is connection-scoped.
*Acceptance criterion:* An operator copies the `mcpServers` block from
README.md into their client config, launches the server, and the
initialize handshake succeeds with `serverInfo.name` matching the config
key.
_Check:_ T187.

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
_Check:_ Gate 2, T4.

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
Player hat. When the ruleset contains zero generation tables, `roll_on_table`
SHALL return a clear "no tables indexed" message — the tool is not
unregistered, per the content-absent tool contract (REQ-020, infrastructure
tools clause). The tool is classified as generation (REQ-015).
*Acceptance criterion:* `roll_on_table("gear")` with seed `42` returns the table
row for the gear table exactly; the same call without a seed returns a different
row; `roll_on_table("gm-only-table")` under Player hat returns `[FORBIDDEN]`;
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
| generation       | `generate_adventure`, `roll_on_table`     | `false`           | `false`            | `false`        | `false`         |
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

*Check:* T255.

**REQ-016 — Guidance extraction.** Role-addressed prose (imperatives, statements of
responsibility, advice, tone/setting text, examples of play) is extracted verbatim as
guidance items, each with attribution, confidence, and hat scope. Guidance is quoted
inert data — it never influences tool behavior, search results, or model extraction.
*Acceptance criterion:* Guidance items extracted from role-addressed prose carry
source anchor, confidence, attribution method, and hat scope; `guidance://player`
excludes GM-tagged items.
_Check:_ T26.

**REQ-017 — Hat stories.** A MUST-covering set of intent prompts maps each hat's
expected play activities to concrete tool/resource paths. Every hat's stories are
achievable from its visible registry.
*Acceptance criterion:* Every tool visible to the Player hat is covered by at
least one intent prompt in the Player hat stories set; every tool visible to GM
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
terms from the ruleset), and Guidance (hat-addressed prose, verbatim with attribution and
hat scope). A cross-category reference that cannot be resolved against the inventory of
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
(min/max/result tuples), a `hat_scope` (derived from source location — tables in
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

*Check:* T256.

**REQ-102 — Source conversion contract.** When the Convert workflow is selected (§6.2),
source materials are converted to Markdown per Appendix G: layout-aware extraction,
table reassembly with merged-cell handling, page-furniture stripping, and artifact
flagging. A fidelity sample of 3–5 representative pages is diffed per the fidelity
protocol in Appendix G; a rate below 90% for any content type blocks the batch. The
converter and its version are pinned in DECISIONS.md. Flagged artifacts receive a
disposition in DECISIONS.md (5): `fixed`, `waived`, or `pending`. Conversion fidelity
rates appear in `spec_health` (REQ-025).
*Acceptance criterion:* A converted PDF produces a fidelity report in `spec_health`;
any content type below 90% fidelity blocks the batch and records a disposition in
DECISIONS.md (5).
_Check:_ T93.

**REQ-225 — Ruleset-native enrichment extraction.** During Discovery (§6.3), the
builder SHALL classify extracted guidance into the six enrichment output modules
(voice_examples, briefing_order, lore_templates, action_patterns,
supplementary_guidance, adventure_advice) using the ruleset's own text. Extraction
sources and confidence: ruleset example-of-play dialogue = HIGH, ruleset GM advice
chapters = HIGH, ruleset setting descriptions = HIGH, ruleset "Inspirational Reading"
or Appendix N media citations = HIGH, ruleset encounter tables = HIGH. Ruleset-native
items carry `[ruleset]` tag with source anchor. This classification is a
post-processing sort of existing extraction output — no additional ruleset reading is
required. Items are sorted into module slots: example-of-play dialogue →
voice_examples, GM advice chapter structure → briefing_order, setting/location
descriptions → lore_templates, example-of-play resolution sequences →
action_patterns, GM/player advice prose → supplementary_guidance, encounter tables
and campaign frameworks → adventure_advice. Ruleset-native enrichment is populated
at build time and is always present in the Novel (REQ-227). In ruleset-free mode
(B1=none), all enrichment modules SHALL be empty — recorded as "ruleset-free" in
DECISIONS.md (4).
*Acceptance criterion:* A ruleset with GM advice chapters and example-of-play
dialogues produces ruleset-native enrichment items in ≥4 of the 6 modules with
`[ruleset]` tag and source anchors.
_Check:_ T-new-225.

*Out of scope:* extraction from non-Markdown sources without prior conversion
(§6.2 Convert workflow), confidence models beyond the three-tier HIGH/MEDIUM/LOW
system, and semantic interpretation of image-only content.

### 5.3 Tools, Resources, and Lookups

**REQ-020 — Tools.** Server behavior is modeled as MCP tools. Tools derive names from
ruleset terminology — never invented names. Character creation, condition management,
combat encounter management, table rolling, and session recap are the minimum tool categories any
ruleset deserves; missing categories are recorded as waivers.

Tools in the following categories exist independent of ruleset content and SHALL
always be present in `tools/list`: Novel lifecycle, hat and workflow, scene and
narrative state, NPC management, countdowns, dynamic lore, entity and roster
management, personality, briefing ordering, export and import (Novel and
lorebook), search and action suggestions, adventure and encounter generation,
session tools, utility (`help`, `spec_health`), and enrichment reversion. These
categories are never waived.

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
T33; Gate 2.

**REQ-021 — Tool-surface economy.** A named set of related operations (one per table, one
per move, one per stat) shares a single parameterized tool. The tool surface is determined
by extraction, not by what a builder finds easy to implement. The per-tool justification
list matches the registry.
*Acceptance criterion:* No two tools share identical parameter schemas differing
only by category enum; the per-tool justification list in DECISIONS.md matches the
live `tools/list` registry.
_Check:_ T3, T35.

**REQ-022 — Resources.** The server provides `ruleset://` (with hat filtering),
`entities://`, `entity://<id>`, `audit://novel`, `roster://<type>`, `roster://<id>`,
`guidance://<hat>`, `guidance://<hat>/anti-slop`, `guidance://<hat>/tone`,
`guidance://<hat>/foundations`, `guidance://shared/hat-switch`, `scene://current`, `scene://history`,
`countdown://active`, `party://current`, `npc://<id>`, `npcs://`, `entity://<id>/personality`,
`entity://<id>/voice_examples`, `lore://active`, `lore://<key>`, `lore://templates`,
`enrichment://voice_examples`, `enrichment://briefing_order`,
`enrichment://action_patterns`, `enrichment://adventure_advice`,
`enrichment://narrative_voices`, `enrichment://status`, `adventure://<slug>/<anchor>`, `novel://current`,
`novel://<slug>`, `novel://setup`, `room://<id>`, `thing://<id>`, `world://map`, `world://kinds`,
`spec://build` (GM-filtered),
`output://{tool_name}/{counter}`. `resources/templates/list` advertises entity,
roster-record, and `output://` templates. `resources/read` returns Markdown with a small
source header.
*Acceptance criterion:* `resources/list` includes all required URIs;
`resources/templates/list` includes entity, roster, and `output://` templates;
each resource declares a media type and title.
_Check:_ T16, T104.

**REQ-023 — Prompts.** The server provides prompts covering multi-step workflows,
hat briefing, connection introduction (REQ-063), session zero (REQ-078), and Novel
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
counts (anchors, concepts, entity types, actions, tables, procedures, guidance items),
pending sections, MUST-action coverage, defect count, ruleset-version status,
spec_repo_url, verification workflow dispositions, available Novels on disk (slug, name,
last-modified, active — per
REQ-093), and prompt health — each registered prompt's name, presence
(present/absent), length relative to its configured budget, and stale references
(tool or resource names appearing in prompt text that do not match any registered
tool or resource). Counts are derived from live registrations at call time — the
running tool catalog, resource map, prompt list, search index, and extracted data
arrays — not from hardcoded numeric literals. The player hat sees only
player-filtered metrics. Output is filtered by hat. The convergence summary section
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
per-prompt title and argument-description presence), and a hat-gating summary
(tool count per gate classification per REQ-136). The `gap_audit` section
SHALL be absent when the build is not yet complete.

`spec_health` must report a `gauntlet_scenarios` field containing
`passed` (count of sub-workflows that passed on the most recent run),
`total` (total sub-workflow count per §6.6), and `last_run` (ISO 8601
timestamp of the most recent Gauntlet execution, absent if never run).
When `last_run` is absent, `passed` and `total` are absent. The field is
hat-filtered: Player hat sees this field; no GM-only content is exposed.

*Acceptance criterion:* `spec_health` counts match the live registry — adding
a tool, resource, or prompt increments the count immediately; counts are derived
from arrays at call time, not hardcoded.
_Check:_ T15, T45, T93, T105, T154.

**REQ-160 — Enrichment health reporting.** `spec_health` SHALL report
enrichment status with these minimum fields: (a) `enrichment_active` —
boolean indicating whether enrichment state exists; (b) `module_counts`
— per-module item count for each of the six output modules (§11.1); (c)
`stale_count` — number of inactive enrichment items whose `collected_at`
exceeds `TTRPG_ENRICH_STALE_DAYS`; (d) `activated_count` — number of
enrichment items the Game Master has incorporated into active game state
via Novel-scoped tools (REQ-159); (e) `fingerprint` — the enrichment
fingerprint used for idempotence detection (ruleset content hash +
intake answers). Stale items SHALL appear with the `[stale]` flag when
listed. When enrichment has never been run, `enrichment_active` is false
and all count fields are zero.
When enrichment is absent (never run or reverted), `module_counts`
SHALL include all six module names — `voice_examples`,
`briefing_order`, `lore_templates`, `action_patterns`,
`supplementary_guidance`, `adventure_advice` — each with value zero.
An absent `module_counts` field or an empty object does not satisfy
this contract.
The enrichment health section is visible
to all hats — Player and GM alike see whether enrichment is active and
how many items are stale, but per-module content is hat-filtered per
REQ-080.
*Acceptance criterion:* After enrichment, `spec_health` reports
`enrichment_active: true`, per-module counts matching the manifest, and
a non-empty fingerprint. After `revert_enrichment`, `enrichment_active`
is false and all counts are zero. Stale items increment
`stale_count` and carry `[stale]` flag. After GM activates a lore
template via `set_lore_entry`, `activated_count` increments by one.
_Check:_ T195.

**REQ-169 — Audit chain integrity reporting.** `spec_health` SHALL include an
`audit_chain` field containing: `valid` (boolean — true when the hash chain is unbroken
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

**REQ-105 — Spec resource.** The server provides a `spec://build` resource,
retrievable via `resources/read` and listed in `resources/list`. It returns the
full text of the specification that built the server as Markdown, embedded in the
server directory at build time. The resource is GM-filtered: the Game Master hat
sees the full text; Player hat attempts return `[FORBIDDEN]` (per REQ-002). The
embedded copy is a snapshot — it may differ from the current upstream revision.
*Acceptance criterion:* `resources/read` on `spec://build` returns the full
embedded Markdown; Player hat returns `[FORBIDDEN]`; the snapshot content hash
matches DECISIONS.md.
_Check:_ T104.

**REQ-106 — Spec repository URL.** The server records a canonical URL for the
upstream specification repository, recorded in DECISIONS.md at intake. `spec_health`
surfaces it under a `spec_repo_url` field. The `intro` prompt includes the URL as a
pointer for operators who want the latest version. The URL is informational — the
embedded spec copy (REQ-105) is authoritative for the server's build-time contract.
*Acceptance criterion:* `spec_health` output includes `spec_repo_url` matching
the intake value; the `intro` prompt includes the URL; the URL is informational
and identical for both hats.
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
(§6.5.2), and the full Gauntlet (§6.6). `quick-build` mode SHALL narrow the overhead: it
skips the assumption audit, skips auditor pre-flight, scopes post-write verification to
critical files only (DECISIONS.md, MCP client configuration, on-disk Novel state), and
accepts same-model audits. The Gauntlet SHALL gate both modes — any build that creates or
modifies tools MUST pass the Gauntlet before marking complete. A quick-build-mode build
SHALL record a `quick-build` annotation in DECISIONS.md (6) listing which rituals were
skipped. A quick-build-mode build is runnable but not handoff-ready.
*Acceptance criterion:* A production build records assumption audit (T89), auditor
pre-flight, and cross-model audit results. A quick-build build records a `quick-build`
annotation listing skipped rituals and passes the Gauntlet. A quick-build build without
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
(3) a pointer to `hat_briefing` for hat-specific guidance. With a query, it
searches tool descriptions, prompt summaries, and guidance text for the most relevant
matches and returns their names, descriptions, and example invocations from the tool-use
playbook. Output is hat-filtered. The Game Master may customize the task-map category
assignments via a Novel-scoped mapping. A tool reassigned to a user-defined category
is removed from its builder-assigned category. The mapping persists with the Novel.
Player hat results always reflect builder-assigned categories. An empty mapping
restores builder defaults.
*Acceptance criterion:* `help()` returns an intro pointer, task-map with one-line
descriptions, and a `hat_briefing` pointer; `help("combat")` returns the most
relevant combat tools with example invocations.
_Check:_ T62, T118.

**REQ-063 — Connection introduction.** The server provides an `intro` prompt, listed first
in `prompts/list`. It takes no arguments, is visible to all hats, and serves as a
conversation starter — a brief overview of the ruleset, its core mechanic, and concrete next
actions a player can take. The tone is engaging and energetic; the anti-slop catalogue
(REQ-070, Appendix J) governs in-game GM and Player narration, not server onboarding
prompts. The `help` tool and `hat_briefing` each point to it. For intent-to-tool
mapping, callers are directed to `suggest_actions` (REQ-084) — no
`use_tool` or `lookup_rule` prompt is provided.
*Acceptance criterion:* `intro` prompt is ≤300 words, opens with the publisher
tagline (or a generic server-name identification when the server is ruleset-free),
includes a dynamic sourcebook listing from the live index (or a message indicating the
server is world-model-only when the server is ruleset-free), and ends
with four concrete next actions.
_Check:_ T49, T50, T259.

**REQ-078 — Session zero prompt.** The server provides a `session_zero` prompt. It takes no
arguments, is visible to all hats (unfiltered), and serves as a structured questionnaire surfaced at the
start of a new adventure. It gathers: character introductions (narrative fields, REQ-077),
tone preference (lighter/darker/grittier), difficulty preference, pacing preference
(slower/faster), focus preference (more-action/more-exploration/more-dialogue),
content boundaries (topics to avoid), and
adventure confirmation. For each preference category, the prompt includes an explicit
directive to record the response — `player_signal("tone", <value>)` for tone,
`player_signal("difficulty", <value>)` for difficulty, `player_signal("pace", <value>)`
for pacing, `player_signal("focus", <value>)` for focus, and
`player_signal("boundary", <value>)` for boundaries. Character introductions
include the directive `set_personality(entity_id, description, voice, background, goals)`.
Every recording directive names the specific tool and its expected arguments; a caller
who follows the directive verbatim produces a valid tool call. `session_zero` is listed
in `prompts/list` after `intro`. The `intro` prompt includes a concrete action to run
the `session_zero` prompt before play.
*Acceptance criterion:* `session_zero` prompt lists `player_signal(...)`
directives for tone, difficulty, pace, focus, and boundaries; a caller who
copies a directive verbatim produces a valid tool call.
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
call time, not from hardcoded literals. The enumeration is filtered by hat (per REQ-002c).
This requirement enforces the §6.5 builder rule: hardcoded arrays are permitted only
for ability abbreviations and persona roles. Tool implementations that enumerate valid values
from a static list rather than the live index SHALL be flagged in DECISIONS.md (5) as a
convergence violation.
*Acceptance criterion:* Adding a new skill entry to the ruleset source, rebuilding, and
calling a skill-check tool with the new skill name returns `[OK]`; removing a skill entry
and rebuilding produces `[NOT_FOUND]` for the removed skill. Both enumerations reflect
the live state — no hardcoded skill list produces stale values.
_Check:_ T39b.

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
all blocked tools (undo, redo, set_hat) are callable. Cancel restoration
works after a server restart — the persisted snapshot covers the full
pre-workflow Novel state.

A workflow begins when a tool returns `[NEED_INPUT]` and ends when `respond`
successfully drains the decision. Only one workflow may be pending per Novel at a time
— a tool that raises `[NEED_INPUT]` while a workflow is already pending returns
`[ERROR] [STATE_CONFLICT]` identifying the pending decision. The server must be able to
determine whether a workflow is pending, such that tools blocked during pending
workflows (undo, redo, set_hat) can query the pending state without ambiguity. Pending
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
Gate 2; S23.

**REQ-190 — Respond drain result.** WHEN `respond(decision, option)` drains a
pending workflow decision, THE system SHALL return `[OK]` with the decision
text, the selected option, and the resulting state change (if any) in a
single response. A drained workflow SHALL clear the `pending_workflow` field
on the Novel, restoring all blocked tools (undo, redo, set_hat) to callable
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
_Check:_ S23.

**REQ-193 — Pending workflow staleness detection.** THE server SHALL track
a staleness counter for open pending workflows, incremented on each new
connection to the Novel. When the counter reaches 3 or more connections
without drainage, `spec_health` SHALL include a `pending_workflow_warning`
object containing the decision text and connection count. The warning signals
that a workflow has been abandoned across multiple sessions — an operator
can drain or cancel it. Staleness tracking is informational only; it does
not auto-cancel or auto-drain.
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
_Check:_ T32; T47; T103; Gate 2.

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
_Check:_ T32, Gate 2.

*Out of scope:* branching narrative trees, puzzle-solving workflows, and decision
workflows that span multiple Novels or connections.

**REQ-140 — End-Novel confirmation dispatch.** WHEN the `respond` handler
receives a decision matching the open `end_novel` confirmation prompt,
THE system SHALL execute the Novel disposal sequence defined in REQ-088:
deactivate the active hat, clear undo and redo stacks, move the Novel's
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
counter reaches a configurable threshold (default 5 connections), the pending
workflow SHALL auto-cancel with the same behavior as `respond("cancel")`: the
pre-workflow snapshot is restored, a `[workflow_stale]` audit entry is recorded
with the decision text and connection count, and `undo` becomes callable. The
audited entry SHALL be tagged `[workflow_stale]` to distinguish it from explicit
cancellation. The staleness counter SHALL be recorded in `spec_health` under
`pending_workflow` alongside the decision text and elapsed connections. A
workflow cancelled by staleness follows the same state-restoration contract as
explicit cancellation (REQ-042). The threshold is configurable via
`TTRPG_WORKFLOW_STALENESS_CONNECTIONS`; setting it to zero SHALL disable
staleness detection.
*Acceptance criterion:* A pending workflow survives 4 connection restarts and
remains open; on the 5th restart it auto-cancels with `[workflow_stale]` audit
entry and restored pre-workflow state. Setting
`TTRPG_WORKFLOW_STALENESS_CONNECTIONS=0` prevents all auto-cancellation.
_Check:_ T266.

### 5.5 Hats and Access

**REQ-030 — Single-user connection.** Each MCP connection serves one active hat at a
time — the hat most recently set via `set_hat` or `TTRPG_HAT`. No concurrency,
no multiplayer state sharing within a connection. The active hat and active entity
are Novel-scoped: two connections to the same Novel share the same hat and entity
state (REQ-031, REQ-074). Each connection may independently switch between Novels
via `switch_novel` (REQ-095), and each Novel stores its own hat independently.
*Acceptance criterion:* Starting a second MCP connection to the same Novel succeeds
and inherits the Novel's current hat and active entity; switching hats on one
connection is visible on the other.
_Check:_ Appendix D.

**REQ-031 — Hat activation.** By default, no hat is active — the server operates
with full access, equivalent to Game Master privileges. All tools, resources, and prompts
are accessible without restriction. Hat gating (REQ-032) takes effect only when a
hat is explicitly activated via `set_hat` (REQ-066). When no hat is active,
all hat-filtered surfaces (`hat_briefing`, `prompts/list`, `resources/list`,
`tools/list`, guidance) return full unfiltered content. The hat activation state
persists with the Novel (REQ-055). `end_novel` deactivates the
hat and returns to full-access mode.
*Acceptance criterion:* On startup with no hat active, `tools/list` returns all
tools unfiltered; after `set_hat("player")`, GM-only tools are excluded from
`tools/list` and return `[FORBIDDEN]` on invocation.
_Check:_ T9, T150.

**REQ-066 — set_hat tool.** The server provides a `set_hat` tool accepting
`player` or `game_master`. Returns `[OK] Active hat: <hat>` on
success. Returns `[STATE_CONFLICT]` if a pending workflow exists. The tool is NEVER
hat-gated — it is always callable regardless of current hat. The hat switch
takes effect immediately on the next tool call.
*Acceptance criterion:* `set_hat("player")` returns `[OK] Active hat: player`
and the next tool call is gated; `set_hat(...)` during a pending workflow returns
`[STATE_CONFLICT]`.
_Check:_ T9.

**REQ-032 — Server-side gating.** When a hat is active, the server enforces hat
access on every endpoint. Player tools, resources, and prompts are a strict subset of
GM-visible ones. `tools/list` and related metadata surfaces are filtered. Guidance items
are filtered. `spec_health` metrics are filtered. `[FORBIDDEN]` responses direct callers
to use `set_hat` to switch hats. When no hat is active, no gating applies — all
endpoints return full content and all tools are callable.
*Acceptance criterion:* Under the Player hat, `create_npc(...)` returns
`[FORBIDDEN]`; switching to Game Master hat makes the same call succeed;
switching back and calling again returns `[FORBIDDEN]`.
_Check:_ T9, T13, T15, T18,
T26, T44, T148, T151.

**REQ-216 — Generation table hat filtering.** `roll_on_table` SHALL be callable
from both hats, but tables with `hat_scope: "game_master"` SHALL return
`[FORBIDDEN]` when called from the Player hat — the error SHALL enumerate the
full table name but SHALL NOT reveal table content. The `hat_scope` value SHALL
be visible in `spec_health` per-table metadata but the table content SHALL NOT.
The `hat_briefing` SHALL enumerate available table names with their hat_scope,
filtered per the active hat's access level. The error message SHALL direct the
caller to `hat_briefing` for a non-revealing list of accessible tables.

*Acceptance criterion:* `roll_on_table("madness_short_term")` called from the
Player hat returns `[FORBIDDEN]` with the table name visible but no content; the
same call from the Game Master hat returns the table result. `hat_briefing` under
the Player hat lists only `hat_scope: "shared"` table names.

*Check:* T257.

**REQ-133 — Forbidden-call audit.** Every tool invocation that returns
`[FORBIDDEN]` is recorded in the audit log with timestamp, active hat, tool
name, and arguments — matching the fields recorded for mutating calls
(REQ-040). Forbidden-call entries carry a `violation_type: "boundary"` field on the audit entry
that is absent from mutating-call entries. When surfaced through `compress_audit` or
`audit://novel`, the entry's output prefix is prepended with `[BOUNDARY_VIOLATION]`
to distinguish it from mutating entries at a glance.
*Acceptance criterion:* Invoking a GM-only tool under the Player hat produces
an audit entry with hat `player`, tool name, arguments, and a
boundary-violation marker; the entry is visible at `audit://novel` and is
distinguishable from mutating entries.
_Check:_ T147.

**REQ-134 — Minimum Player tool surface.** When the Player hat is active,
the server guarantees that tools in these functional groups are callable:
dice-resolution (rolls and checks), ruleset lookups, character sheet
rendering, action suggestions, player signals, help, undo/redo of the Player
hat's own mutations, and hat switching. The builder records the gate
classification for every tool in DECISIONS.md in a format that can be
diffed against each hat's filtered `tools/list` output.
*Acceptance criterion:* Under the Player hat, each Player-guaranteed group
defined in the body has at least one tool callable by the Player; a tool
known to be GM-exclusive returns `[FORBIDDEN]`.
_Check:_ T148.

**REQ-220 — Narrative point of view.** When `set_active_entity(entity_id)` is called,
the active entity carries narrative POV (point of view) semantics: the player is
inhabiting this character — speaking as them, perceiving through their senses. The
server SHALL include a POV directive in `hat_briefing`, positioned in the
decision-critical group after scene state and before the entity listing. The
directive contains: (a) the active entity's name; (b) an instruction to the Game
Master AI: describe the scene through this character's eyes and senses — other
characters' internal states (thoughts, feelings, unexpressed intentions) are
inaccessible unless the POV character could observe or infer them; (c) the active
entity's personality fields and voice examples (REQ-077) in compact inline form as
voice and manner reference. When no active entity is set — `active_entity_id` is null
per REQ-176 — the directive is replaced with an empty-state marker: "POV: none —
narration is omniscient." The directive is NEVER truncated by the briefing size budget
(REQ-135, tier 1). POV follows the active entity across `set_active_entity` calls —
there is no separate tool.
*Acceptance criterion:* After `set_active_entity("character_01")`, `hat_briefing`
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
`hat_briefing` shows "POV: none — narration is omniscient" with char_01 still
the active entity; `set_active_entity("char_02")` preserves omniscient mode;
`set_active_entity("char_02", pov="character")` switches to character-locked
POV for char_02.
_Check:_ T265.

**REQ-109 — Hat briefing composition.** `hat_briefing` surfaces
these hat-filtered information groups: hat foundations (REQ-062),
anti-slop guidance (REQ-070), narrative tone samples (REQ-071), current scene state
(REQ-076), narrative POV directive (REQ-220), active entities with summary stats (REQ-074), active NPCs
(REQ-075), active countdowns — hat-filtered by `hat_scope` (REQ-073), active lore entries (REQ-083),
active adventure content (REQ-079), registered tools relevant to the
current scene type (REQ-087), active combat state — round, turn order, and
current participant (if in-combat; REQ-043), active entity personality fields and voice
examples — hat-filtered per REQ-077 (REQ-077), the narrative directive (GM
only, REQ-081), player signals (GM only, REQ-069), Novel setup metadata
(REQ-089, including a "Session zero not yet completed — run `session_zero` prompt" reminder when
`session_zero_completed` is false), and a pointer to the intro prompt (REQ-063). Groups whose data
source is empty SHALL include an explicit empty-state marker describing which
category is empty. Markers preserve the expected briefing structure and prevent the
caller from inferring non-existent content. The enumeration order above is the
builder's required default section ordering for `hat_briefing`. Decision-critical
groups (scene state, the POV directive, entities, combat state, triggered lore, active NPCs, and active
countdowns) precede the section boundary; supplementary guidance and navigation groups
(hat foundations, anti-slop guidance, narrative tone samples, active adventure content,
registered tools, entity personality fields, the narrative directive, player signals,
Novel setup metadata, and the intro pointer) follow. The Game Master may override this
order via `set_briefing_order` (REQ-082).
*Acceptance criterion:* `hat_briefing` for a Novel with entities, combat,
countdowns, and lore includes all mandatory groups; an empty data source displays
its empty-state marker; decision-critical groups appear before supplementary groups.
_Check:_ T109, T110, T149.

**REQ-159 — Enrichment briefing integration.** When enrichment is active
(§11.1), `hat_briefing` SHALL include enrichment-derived content as
follows: (a) supplementary guidance items SHALL appear in the guidance
section, tagged `[supplementary]` with source URL and confidence, hat-filtered
by hat_scope (REQ-080); (b) entity voice examples sourced from enrichment
SHALL appear alongside roster-sourced voice examples under the entity
personality group, tagged `[supplementary]` (REQ-077); (c) adventure
advice SHALL appear when the active Novel contains a generated adventure
(REQ-132), tagged `[supplementary]`. Enrichment-sourced content follows
the same hat filtering rules as the enrichment resource surfaces —
game_master-scoped items are hidden from the Player hat. When enrichment
is not active, the briefing renders without enrichment content — no
empty-section markers for enrichment groups.
*Acceptance criterion:* After enrichment, `hat_briefing` under the GM
hat includes supplementary guidance items tagged `[supplementary]`
alongside source URLs. Enrich-sourced voice examples appear under entity
personality with `[supplementary]` tag. Under the Player hat,
game_master-scoped enrichment items are absent. After
`revert_enrichment`, enrichment content is absent from all hat views.
_Check:_ T194.

*Out of scope:* role-based access control beyond the two-hat model,
authentication or authorization mechanisms, multi-connection hat
synchronization, and hat inheritance across Novels. The spec assumes a
single trusted operator — `set_hat` is always callable without
authentication. The hat model is a convenience and narrative-integrity
feature, not a security boundary (see Appendix P for threat model).

**REQ-135 — Hat briefing size budget.** The total size of `hat_briefing`
output is bounded by a configurable limit. When the briefing would exceed
this limit, content is truncated from lowest-priority sections first.
Sections are truncated in full — no section is partially rendered. Each
truncated section includes a marker and a resource URI pointer for full
retrieval. Hat foundations (REQ-062) and the intro pointer (REQ-063) are
never truncated. The builder records the truncation priority order and the
default limit in DECISIONS.md. The truncation priority order SHALL respect three
tiers: (1) never-truncated — hat foundations (REQ-062), the intro pointer
(REQ-063), and the POV directive (REQ-220); (2) last-truncated — decision-critical groups as classified in REQ-109;
(3) first-truncated — supplementary guidance and navigation groups as classified in
REQ-109. Within each tier, the builder determines the relative truncation order and
records it in DECISIONS.md.
*Acceptance criterion:* With a small briefing budget, invoke `hat_briefing` —
assert some low-priority sections are truncated with resource URI pointers;
assert hat foundations and the intro pointer are always present regardless
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

**REQ-136 — Null-hat briefing.** When no hat is active (REQ-031),
`hat_briefing` returns setup-oriented content: a list of available Novels
(REQ-093), the current active Novel name if one exists, and a pointer to
the `intro` prompt (REQ-063). No gated content is accessible — the briefing
presents the same full-access view as all other null-hat surfaces but
structured for initial orientation rather than ongoing play.
*Acceptance criterion:* On startup with no Novel active, `hat_briefing`
returns a setup-oriented message with the intro pointer and Novel-creation
guidance; with a Novel active but no hat set, the briefing includes the
active Novel name and guidance to activate a hat via `set_hat`.
_Check:_ T150.

**REQ-137 — Gate classification auditability.** Every tool registered on
the server is assigned to one of three gate classifications: callable
only under the Player hat, callable only under the Game Master hat, or
callable under any hat (un-gated). The gate classification for every
tool is enumerable at build verification time from the tool registration
source without invoking the running server. The builder records the
classification for every tool in DECISIONS.md. Tool-category
reassignment (REQ-067) does not alter gate classification.
*Acceptance criterion:* The Player-filtered `tools/list` output contains
exactly the tools classified as Player or un-gated in DECISIONS.md; the
GM-filtered output contains exactly the tools classified as GM or un-gated;
`set_hat` is always present in both lists. No tool is classified as both
Player-only and GM-only.
_Check:_ T151.

The classification table in DECISIONS.md SHALL enumerate every registered tool
with the format:

| Tool name          | Gate       | Hat visibility         |
|--------------------|------------|------------------------|
| `set_hat`          | un-gated   | Player, Game Master    |
| `init_combat`      | GM-only    | Game Master            |
| `character_sheet`  | Player     | Player                 |

The `tools/list` output filtered by each hat SHALL match the Gate column of
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
diff summary; G4 records include per-test pass/fail counts; G5 (Gauntlet) records
include per-sub-workflow verdict and blocking/non-blocking classification. A verifier
following §10 SHALL produce evidence records with the same minimum field set for
Phase 1 step 2, enabling field-by-field comparison in Phase 2 step 8.
*Acceptance criterion:* A DECISIONS.md (6) evidence record for any workflow can be
parsed to extract workflow identifier, timestamp, environment pins, pass/fail status,
and sub-check enumeration without depending on prose interpretation.
_Check:_ T253, T188.

### 5.6 State and Lifecycle

**REQ-040 — Audit log.** Every tool call that mutates game state (character creation,
condition changes, HP changes, combat state, table rolls with results) is recorded in an
append-only audit log (`audit://novel`), including timestamp, hat, tool name,
arguments, and output prefix. State queries are not logged. Each audit entry chains the hash of the preceding entry,
producing a tamper-evident sequence. On load, the server verifies the chain end-to-end and
reports a mismatch in `spec_health` and stderr. The log survives connection
restarts for the same Novel.
*Acceptance criterion:* A combat attack produces an audit entry with timestamp,
hat, tool name, arguments, and output prefix; `audit://novel` returns entries in
append order with chained hashes.
_Check:_ T8, T147.

**REQ-168 — Audit resource.** The server provides an `audit://novel` resource,
retrievable via `resources/read` and listed in `resources/list`. It returns the Novel's
full audit log as Markdown — one entry per line, ordered append-first, each line
containing the timestamp, hat, tool name, and output prefix. The resource is
hat-filtered: the Player hat sees entries where the recorded hat is `player` or where
the entity affected is owned by the current player; the Game Master sees all entries.
Forbidden-call entries (REQ-133) carry a `[BOUNDARY_VIOLATION]` prefix in the output column
to distinguish them from mutating entries. State queries are not recorded and do not
appear. When no Novel is active, `resources/read` returns `[ERROR] [STATE_CONFLICT]`.
*Acceptance criterion:* `resources/read` on `audit://novel` returns all audit entries
in append order with chained hashes visible (REQ-040); Player hat sees only own-entity
and own-hat entries; forbidden-call entries carry `[BOUNDARY_VIOLATION]` prefix;
state query tool calls are absent from the resource.
_Check:_ T203.

**REQ-041 — Snapshots and undo.** Every mutating tool call saves a per-call snapshot.
`undo` restores the most recent mutation from a LIFO snapshot stack. Stacks are
keyed by the hat under which `undo` is invoked, but every snapshot captures
the full Novel state — `undo` in the Player hat reverses the most recent
mutation regardless of which hat initiated it. The stack depth
supports at least 10 undo levels per hat. Builders that cannot meet this floor must record
the constraint and its justification in DECISIONS.md (5). An empty stack returns
`[ERROR] [STATE_CONFLICT]`. `undo` is a pure-state tool — it itself is not snapshot-able,
and the step it reverses is removed from the snapshot stack. A pending `[NEED_INPUT]`
blocks undo. Cancelling a workflow restores the pre-workflow snapshot and discards the
workflow's internal undo candidates.
When the undo stack exceeds the configured or default depth ceiling and the oldest
snapshot is discarded, the server SHALL record a `[snapshot_truncated]` audit entry
identifying the hat and the discarded entry's snapshot timestamp. When no depth ceiling
is configured, the truncation threshold is the 10-entry floor defined above.
*Acceptance criterion:* Ten consecutive mutations produce ten snapshot entries;
`undo` restores each in LIFO order; the eleventh undo returns `[STATE_CONFLICT]`
when the builder minimum is 10.
_Check:_ T10.

**REQ-116 — Redo.** A `redo` tool re-applies the most recently undone mutation. After
`undo` pops a snapshot from the undo stack, the popped snapshot is pushed onto a per-hat
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
operations work within one connection. Active combat state is visible in `hat_briefing`
as a dedicated group containing the round number, the turn order list with the current
turn clearly marked, and the current participant name. The Game Master sees the full
turn order and all participant names; the Player hat sees entity turn positions only
(NPC and danger positions are redacted). When no combat is active, the group is omitted
entirely from the briefing — no empty-state marker.
*Acceptance criterion:* `init_combat(participants=["hero"], dangers=[{"name":
"goblin"}])` assigns turn order entity first, then dangers; `advance_combat`
reports the participant, action, roll, and state changes; `advance_combat` on a
danger's turn reports `[AUTO]` with a narrative action; after weapon-damage
mutation, `advance_combat` reports the participant name, weapon, damage roll
transparency, and target HP change; after a turn with no mutations it reports the
participant took no action.
_Check:_ T25, T33, T110, T161, T162; Gate 2.

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
with "All participants removed"; undo reverts the participant change; Player hat returns
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
present." Both tools are hat-gated per REQ-032: the Player may apply or remove
conditions on their own active entity only; the Game Master may apply or remove
conditions on any entity or NPC. Player attempts on other entities SHALL return
`[FORBIDDEN]` with the target entity ID. The optional `rounds` parameter on
`apply_condition` sets the combat-round duration for REQ-206 auto-expiry — omitting
it creates a condition without automatic expiry. Both tools SHALL record mutation
entries in the audit log (REQ-040) and appear in `session_recap` condition changes
(REQ-072). Applied conditions SHALL appear on `character_sheet` output and in
`hat_briefing` entity summaries.

Under the Player hat, condition entries in `character_sheet` and `hat_briefing`
SHALL be rendered without expiry round counts — the Player sees only the condition
name. The Game Master hat SHALL include expiry round counts when the `rounds`
parameter was set.

*Acceptance criterion:* `apply_condition(entity, "prone")` adds the condition and
returns `[OK]`; a second call returns `[WARNING]` with "Condition already active.";
`remove_condition(entity, "prone")` removes it; `remove_condition` on an entity
without the condition returns `[WARNING]` with "Condition not present."; applying
"not_a_condition" returns `[INVALID_INPUT]` with valid conditions listed; Player
`apply_condition` on another player's entity returns `[FORBIDDEN]`; applied condition
appears on `character_sheet` and `hat_briefing` entity summary.
_Check:_ T258.

**REQ-072 — Session recap.** The server provides a `session_recap` tool — a pure-state tool
that returns a structured summary of the active Novel: session timespan (earliest to latest
audit entry), active entities with final state (HP, conditions, status — where status is a
derived mechanical flag: "alive" when HP > 0, "unconscious" at HP = 0, "dead" when the
ruleset's death condition is applied; rulesets without a death condition SHALL report
"alive" and "incapacitated"), completed confrontations, pending confrontations, current
scene state, active lore entries and their trigger status, the current narrative directive,
current scene type, the last N scene state transitions (default 3, configurable), roster
changes (entities created or removed in this Novel during the audit-log timespan), condition
changes, and the last N significant rolls (default 5, configurable). `session_recap` output
is hat-filtered: the Player hat sees only own-entity data; the Game Master hat
sees all. `session_recap` output does not produce narrative prose — it returns structured
data the LLM uses to narrate the recap. The output SHALL be a machine-parseable structure.
At minimum it SHALL contain the following named fields with typed values: `timespan_start`
and `timespan_end` (ISO 8601 timestamps, or null if audit log empty), `entities` (array of
objects with `name`, `hp`, `max_hp`, `conditions`, and `status` string fields),
`confrontations_completed` (array of objects with `participants`, `rounds`, and `outcome`
derived from audit-log combat lifecycles per REQ-175), `confrontation_pending` (null or
object describing the active combat), `scene` (current description string), `scene_type`
(enum string), `lore_entries` (array of objects with `key`, `active` boolean),
`narrative_directive` (string or null), `scene_transitions` (array of `{from, to,
timestamp}` objects, most recent N), `roster_changes` (array of `{entity_id, action`
— "created" or "removed", `timestamp}`), `condition_changes` (array of `{entity_id,
condition, action` — "applied" or "removed", `timestamp}`), `significant_rolls` (per
REQ-174), and `total_combat_rounds` (integer). Missing or inapplicable fields SHALL be
present with a typed null or empty array, not omitted. The LLM reconstructs a narrative
recap from these fields; the tool SHALL NOT generate recap prose.
`session_recap` accepts optional parameters: `max_transitions` (integer, default 3,
minimum 1, maximum 20) — the number of scene state transitions to return; `max_rolls`
(integer, default 5, minimum 1, maximum 50) — the number of significant rolls to
return. Values outside the declared range SHALL produce `[ERROR] [INVALID_INPUT]`
with the valid range enumerated.
*Acceptance criterion:* `session_recap()` returns a structure with all named fields
present, each field carrying its declared type or null/empty-array when inapplicable;
the output contains no narrative prose strings outside field values; entity status
reports "alive" when HP > 0, "unconscious" at HP = 0, "dead" when death condition active.
_Check:_ T53, T212, T213, T214, T215.

**REQ-174 — Significant-roll criterion for recap.** A roll is significant for
`session_recap` purposes when it (a) was produced by a dice-resolution tool
(roll_save, roll_skill_check, roll_weapon_attack, roll_weapon_damage, or
ruleset-equivalent), (b) has an entity as participant or attacker, and (c)
produced a tool output visible to at least one hat. Pure-generation table rolls
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
has a `hat_scope` — `game_master` or `shared` — and a `direction` — `decrement` (fires at
`ticks <= 0`) or `increment` (fires at `ticks >= total`). Both carry an unambiguous
default preserving backward compatibility. `advance_countdown(name)` adjusts one tick in
the countdown's direction. `remove_countdown(name)` deletes a countdown before it fires.
When a countdown fires, it is recorded in the audit log with a timestamp and removed from
active countdowns — its name slot freed for reuse. Expired countdowns remain in the audit
log. `countdown://active` lists all active countdowns with remaining ticks, type,
hat_scope, and direction, hat-filtered: only shared countdowns are visible to the Player
hat. Countdowns are Novel-scoped — survive connection restarts, discarded by `end_novel`.
Countdown tools are Game Master only; the Player hat reads active countdowns via
`hat_briefing` and resource URIs.
*Acceptance criterion:* A shared countdown "torch" (3 ticks) appears in both hats'
briefings; a GM-only countdown "patrol" appears only in the GM briefing;
`advance_countdown("patrol")` at tick 1 fires and removes it.
_Check:_ T54, T139.

**REQ-074 — Multi-entity support.** A Novel may contain multiple game entities under the
same hat. The roster may hold multiple entities for the player. `entities://` lists
all Novel entities visible to the active hat. One entity is the active entity — the
default target for tools that accept an `entity_id` when no `entity_id` is supplied. The
first imported entity is the active entity by default. `set_active_entity(entity_id)`
switches the active entity and is always callable regardless of hat. The `party`
resource (`party://current`) lists all player-owned entities with summary stats: name,
active status, HP, and conditions. REQ-030 scoping is unchanged — one user per
connection, no multiplayer. The active entity also establishes the narrative POV per REQ-220.
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
a fresh copy. Entity removal is a mutating operation for undo/redo purposes. Player hat
attempts return `[FORBIDDEN]`.
*Acceptance criterion:* `remove_entity("character_02")` removes the entity from
`entities://`; `party://current` no longer lists it; the roster baseline is unchanged;
re-importing the same roster ID creates a fresh entity copy.
_Check:_ T216.

**REQ-177 — Roster entity removal.** The server SHALL provide a
`remove_roster_character(roster_id)` tool (callable with no hat active or Game Master hat)
that removes a character from the roster. Removing a roster character does not affect any
Novel that has already imported it — existing Novel entity copies survive independently.
Player hat attempts return `[FORBIDDEN]`. When the roster ID does not exist, SHALL return
`[NOT_FOUND]` with valid roster IDs enumerated.
*Acceptance criterion:* `remove_roster_character("character_01")` removes the entry from
`roster://`; a Novel that previously imported it retains its copy; re-creating a character
with the same name creates a new roster entry with a different ID.
_Check:_ T217.

**REQ-178 — Roster listing.** The server SHALL provide a `list_roster_characters` tool,
callable under any hat with no restrictions. The tool returns a structured listing: for each
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
persists with the Novel. All NPC tools are Game Master only; the Player hat reads
NPC state via `hat_briefing` and resource URIs.
*Acceptance criterion:* `create_npc("Innkeeper")` produces an NPC with `npc://<id>`
URI; `update_npc(id, {disposition: "friendly"})` changes the field; `remove_npc(id)`
deletes it.
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
an entity nor an NPC returns `[ERROR] [NOT_FOUND]`. The Game Master hat sees all
fields; the Player hat sees only fields visible in `hat_briefing`.
*Acceptance criterion:* `character_sheet(entity_id="npc_01")` renders the NPC
stat block in ruleset format; an unknown ID returns `[NOT_FOUND]`.
_Check:_ T127.

**REQ-121 — NPC resource URIs.** The server registers `npc://<id>` for each
active NPC in the current Novel, returning the NPC's full stat block and narrative
fields, and `npcs://` returning a list of all active NPCs with summary fields
(name, disposition, location). Resources are hat-filtered: Game Master sees all
fields; Player sees summary fields only. Resources are re-registered on Novel
switch and removed on `end_novel`.
*Acceptance criterion:* `npc://<id>` returns the NPC's full stat block and narrative
fields; `npcs://` lists all active NPCs with summary fields; both are hat-filtered.
_Check:_ T128.

**REQ-122 — NPC narrative fields.** Named NPCs (REQ-075) may carry narrative
personality fields following the same contract as entity personality fields
(REQ-077): `description`, `voice`, `background`, `goals`, and `voice_examples`.
These fields are set via `set_personality` and `set_voice_examples` accepting an
NPC identifier alongside entity identifiers. NPC narrative fields are Novel-scoped
— NPCs have no roster; fields persist only with the Novel. These fields are inert
narrative context and do not influence mechanical resolution. Setting narrative
fields on an NPC is Game Master only. Fields are surfaced in `hat_briefing` and at
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
description via `set_scene_state(description)`. Each call creates a timestamped entry in
the audit log; previous entries are retained in audit history. `scene://current` returns
the most recent scene state. `scene://history` returns up to a configurable maximum of
the most recent entries (default 50). When the cap is exceeded, the most recent entries
are returned with a count of suppressed entries and a `[truncated]` marker. The full
scene history is available in the audit log (REQ-040). All entries are hat-filtered.
Scene state is narrative context. It does not influence mechanical resolution or search
results. Guidance surfaces (hat_briefing tool ordering, suggest_actions filtering per
REQ-087, and lore trigger matching per REQ-083) may be informed by scene description
and type — these are navigation and narrative reactivity, distinct from mechanical
resolution. The server maintains a Novel-scoped `scene_tick` counter, initialized to
zero when the Novel is created and reset to zero on each scene transition. The tick
increments by one each time `advance_combat` resolves a full combat round (wraps from
last participant to first). It appears in `hat_briefing` for the Game Master hat only,
in the Scene section. The tick is a pacing aid — it does not trigger mechanics. The
`set_scene_state` tool is Game Master only; the Player hat reads scene state via
`hat_briefing` and `scene://current`. Scene state persists with the Novel.
scene state is narrative context and does not change search results for mechanical terms.
*Acceptance criterion:* Three `set_scene_state(...)` calls produce three
timestamped entries in `scene://history`; scene state is narrative context and
does not change search results for mechanical terms.
_Check:_ T57, T112, T132, T137.

**REQ-076a — Structured scene fields.** `set_scene_state` accepts optional structured
fields alongside the required `description`: `location` (a named place within the world),
`time_of_day` (morning, afternoon, evening, night, or free-text), and `atmosphere` (mood,
weather, sensory qualities — e.g., "tense, foggy, silent"). These fields are surfaced in
`hat_briefing` alongside the description, in `scene://current`, and in `scene://history`
entries. They are narrative context — inert data that does not influence mechanical
resolution. All fields persist with the Novel. The Player hat reads them via
`hat_briefing` and `scene://current`; write access is Game Master only.
*Acceptance criterion:* `set_scene_state("dark cavern", location="Underdark",
time_of_day="night", atmosphere="tense, dripping water")` surfaces all four
fields in `scene://current`.
_Check:_ T133.

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
  how the entity speaks in specific situations, sourced via `set_voice_examples(entity_id,
  examples)` and stored at the roster level. Voice examples set via `set_voice_examples`
  follow the same hat-gating contract as `set_personality`: Player-only for own entities
  (per REQ-165), GM for all. On NPCs (REQ-122), `set_voice_examples` is Game Master only.
  Voice examples sourced from enrichment carry a `[supplementary]` tag and source URL.

These are narrative context — inert data, not mechanical. `set_personality(entity_id,
fields)` sets description, voice, background, and goals (Player-only for own entities per
REQ-165, GM for all). The tool also accepts NPC identifiers per REQ-122. Personality
fields are stored at the roster level and are explicitly
mutable (an exception to roster baseline immutability — narrative fields, unlike
mechanical stats, may be edited after creation). Novel-level overrides: if personality
fields are set on a Novel entity via `set_personality`, they override the roster
baseline for that Novel only. On Novel entity import, roster personality fields are
copied alongside mechanical stats.

Fields are surfaced in `hat_briefing` alongside entity stats and at
`entity://<id>/personality`; voice_examples are surfaced under the entity personality
group in `hat_briefing` per REQ-109. When an entity speaks in-character, voice_examples
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
prompts and resources that surface entity personality: `hat_briefing`,
`entity://<id>/personality`, `npc://<id>/personality`, and the `character_sheet` tool.
Voice examples sourced from enrichment are tagged `[supplementary]` alongside their
source URL and are rendered after player-authored examples when both exist.
*Acceptance criterion:* When `hat_briefing` renders an entity with voice_examples
set, the dialogue snippets appear before the trait descriptions.
_Check:_ T140.

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
`set_personality` hat gating (REQ-077), an entity is "owned" by the Player hat
when that entity was created by the current connection under the Player hat.
When no Novel is active, or when the server restarts, ownership of all existing
entities resets to unowned — a Player may set personality fields on any entity
until a hat is activated. Once the Game Master hat sets personality fields on
an entity, the Player hat retains write access to that entity's personality
fields (ownership is not exclusive). This definition exists solely to resolve
the "Player-only for own entities" contract in REQ-077 — it does not affect
tool access, resource filtering, or any other subsystem.
*Acceptance criterion:* A Player creates an entity (`create_character` under
Player hat) and successfully calls `set_personality` on it. The same Player
attempts `set_personality` on an entity created by the GM — the call SHALL
succeed (ownership is non-exclusive per the body). A Player who has never
created any entity can still call `set_personality` on entities imported by
the GM (no ownership check blocks the Player).
_Check:_ T200.

**REQ-166 — Personality briefing rendering.** When `hat_briefing` renders the
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
*Acceptance criterion:* `hat_briefing` with an entity carrying `voice: "gruff"`
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
`source_url` field. Hat filtering: Player hat sees personality fields for all
entities, and NPC personality fields for NPCs visible in `hat_briefing` per
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

**REQ-128 — Signal briefing surface.** `hat_briefing` (GM only, REQ-109) includes a
dedicated player-signals section. For each recorded signal, the section lists the signal
type, value, and age — computed as the difference between the Novel's current
connection counter and the counter stored with the signal (REQ-173),
expressed as "set N connections ago." When no signals are recorded, the section
carries an empty-state marker signaling that no preferences have been set. Player
signals are on the decision-critical side of the briefing section boundary (REQ-109).
The section is never truncated (REQ-118).
*Acceptance criterion:* `hat_briefing` in GM hat includes a player-signals
section listing each signal type, value, and age delta; an empty-signal Novel
shows the empty-state marker.
_Check:_ T142.

**REQ-173 — Connection counter.** Each Novel tracks a `connection_counter`
that increments on every server start or MCP transport connect for that
Novel — not on individual tool invocations. When the server restarts or a
new MCP session begins, the counter advances by one before any tool is
serviced. The counter persists with the Novel and is included in
`novel://current` metadata. A `player_signal` call records the current
connection counter alongside the signal value, replacing the prior
counter when the signal type is overwritten. The age displayed in
`hat_briefing` per REQ-128 is `current_connection_counter - stored_counter`,
expressed as "set N connections ago" (or "set this connection" when zero).
When no connection counter is stored (pre-existing Novel from a build
that predates this REQ), the age SHALL display "unknown" instead of an
incorrect integer. The builder SHALL record the counter storage format
in DECISIONS.md.
*Acceptance criterion:* Set a signal, restart server, invoke
`hat_briefing` as GM — assert the signal shows "set 1 connection ago."
Set another signal, restart, invoke briefing — assert the first shows
"set 2 connections ago" and the second shows "set 1 connection ago."
Remove and re-set a signal in the same connection — assert it shows
"set this connection."
_Check:_ T211.

**REQ-129 — Property group cardinality.** Every Novel-scoped property
group has an enforced maximum item count. Exceeding the maximum on a create
or set operation SHALL return `[ERROR] [STATE_CONFLICT]` with the affected
group named and the current and maximum counts reported. Maximums and their
configuration sources are: NPCs — `TTRPG_MAX_NPCS` (default 500, also used
by REQ-097 for health warnings; this REQ adds enforcement at the same
threshold); Lore entries — `TTRPG_MAX_LORE_ENTRIES` (default 200, also
used by REQ-097; the lore token budget per REQ-083 is an independent
constraint); Countdowns — `TTRPG_MAX_COUNTDOWNS` (default 50); Entities per Novel —
`TTRPG_MAX_ENTITIES` (default 50), exceeding on `import_character` or `create_character`
SHALL return `[ERROR] [STATE_CONFLICT]` with counts reported; Roster entities —
`TTRPG_MAX_ROSTER_ENTITIES` (default 200), exceeding on `create_character` SHALL return
`[ERROR] [STATE_CONFLICT]` before any state mutation; Enrichment
items per output module — `TTRPG_MAX_ENRICHMENT_ITEMS` (default 100).
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
section SHALL be extracted and indexed. `load_adventure(adventure)` SHALL —
when the adventure module contains a `## World` section — populate the
Novel's world-model tier with the extracted rooms, things, exits, and
properties, then link any TTRPG annotations (`@encounter`, `@trap`, `@npc`,
`@lore`) to world-model objects by name. Adventure modules without a `## World`
section SHALL load as flat indexed content — their prose is searchable via
`search_rules` and surfaced in `hat_briefing`, but no world-model objects
are created.

After loading, the adventure's prose content SHALL be accessible at
`adventure://<adventure-slug>/<anchor>`. `search_rules` includes adventure
content; active-adventure results are sorted first. Active-adventure results
SHALL carry HIGH match confidence when the query token appears in a section
heading; MEDIUM when it appears in body text. The `[generated]` tag (REQ-132)
SHALL NOT affect sort order — generated and indexed results sort by match
strength identically; the tag is a source-of-origin marker only.

`hat_briefing` includes the active adventure's hook, current location,
and — when a world model is populated — the current room's name and visible
contents.

Adventure content is hat-filtered: sections marked with the ruleset's
adjudicator term (e.g., `*Keeper only*`) are hidden from the Player hat.
Unmarked sections are visible to all. Multiple adventures may be indexed;
only the active adventure's content is surfaced in `hat_briefing`. Adventure
NPCs defined via `@npc` annotations are Novel-scoped entities created at
load time; the GM may modify them via `update_npc`. `load_adventure` is Game
Master only. `load_adventure` with a slug not matching any indexed adventure
SHALL return `[NOT_FOUND]` and enumerate available adventure slugs. The
`TTRPG_ADVENTURE` env var (optional, comma-separated paths) pre-loads
adventures at startup.

State isolation: world-model objects, NPCs, and lore created by adventure
loading are Novel entities — discarded by `end_novel`. Switching adventures
replaces the active adventure's world model (if present) and prose content
but retains Novel entities created outside adventure loading.
*Acceptance criterion:* `load_adventure("tomb-of-the-serpent-king")`
activates the adventure, populates the world-model tier with rooms/things/
exits from the `## World` section, links `@npc` annotations, and surfaces
the adventure hook and current room in `hat_briefing`; a module without a
`## World` section loads as flat indexed content.
_Check:_ T59, T60, T61.

**REQ-229 — Adventure enrichment linkage.** After `load_adventure` processes
`@npc`, `@encounter`, and `@lore` annotations, the server SHALL scan both
enrichment tiers (ruleset-native and community) for matches against the newly
loaded adventure content: voice examples matched to NPC creature types via the
ruleset index, lore templates matched to `@lore` annotation keywords, action
patterns matched to encounter types, adventure advice matched to adventure
themes. Matches are surfaced in the `load_adventure` augmentation section:
"Enrichment found X voice examples for adventure NPCs, Y lore templates for
adventure locations. Review at `enrichment://status`." Matches are NOT
automatically activated — they remain inert per REQ-080. The augmentation
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
hat-filtered hooks. Both surfaces respect hat gating: GM-only content is hidden
from the Player hat.
*Acceptance criterion:* `spec_health` includes an `indexed_adventures` field
listing slugs and content hashes; `resources/read` on `adventures://` returns the
complete list; Player hat sees only Player-visible adventure hooks.
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

**REQ-132 — Adventure generation lifecycle.** Adventure content produced by
`generate_adventure(premise)` is a transient Novel-scoped artifact, distinct
from build-time indexed adventure modules (REQ-079). Generated adventures are
not indexed at build time — they exist only within the Novel that generated
them, are discarded by `end_novel`, and are not persisted to the
`TTRPG_ADVENTURE` directory. Generated adventure content SHALL be surfaced at
`adventure://generated/<anchor>`, use the same heading, anchor, and
hat-filtering conventions as indexed adventures (Appendix K), and appear in
`hat_briefing` and `search_rules` results when the generating Novel is active.
Calling `generate_adventure` when a generated adventure already exists in the
Novel SHALL replace the prior generated content. `load_adventure` replaces the
active indexed adventure but SHALL NOT affect the generated adventure; a
generated adventure SHALL NOT replace the indexed adventure. A Novel may have
both an indexed adventure and a generated adventure active simultaneously —
`hat_briefing` SHALL surface the indexed adventure's content first, then the
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

**REQ-065 — Build fingerprint.** The server records a build fingerprint in its state
directory: the specification version, the specification content hash (from the embedded
holonovel.md, REQ-105), the ruleset content hash (REQ-044), the spec repository URL
(REQ-106), and the build timestamp. The fingerprint is persisted alongside Novel state so
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
- **Build timestamp** — expected to differ across restarts; does not emit a warning.

Drift warnings are diagnostic surfaces, not safety interlocks — they do not block startup
or degrade service. The active build's specification version, ruleset hash, and build
timestamp always take precedence over stored values; stored values are retained for drift
comparison only. Per-session fields (the last specification review timestamp and last
Gauntlet execution timestamp) may be updated at runtime and preserved across restarts, but
the constructor-derived version, hash, and timestamp are immutable for the build's
lifetime. The server must load existing state gracefully: fields present in state but
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

### 5.7 Determinism, Safety, and Performance

**REQ-050 — Determinism.** All random draws come from a single deterministic PRNG, seedable
via `TTRPG_SEED`. Any tool that performs a random draw — dice-roll tools, `init_combat`
(danger initiative), `create_character` (stat generation), and any
ruleset-derived tool that includes dice resolution — accepts an optional
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
_Check:_ Gate 2, T27, T111.

**REQ-213 — Weighted table result mapping.** When a generation table defines a
dice-range-to-result mapping, `roll_on_table` SHALL roll the specified dice
expression, match the result against the defined ranges, and return the matched
result row. The output SHALL include: (a) the dice notation (e.g., `d100`),
(b) the individual die face rolled, and (c) the matched range with its result
text. When a roll falls outside all defined ranges, the tool SHALL return
`[WARNING]` with the raw roll and a "no range matched" message — the tool SHALL
NOT silently return a bare number.

A generation table entry defines: `dice_expression` (e.g., `1d100`, `1d8`), a
list of `ranges` (each with `min`, `max`, `result`), and an optional `hat_scope`
(`game_master` or `shared`, default `shared`). A generation table SHALL NOT
interleave dice-range rows with static lookup rows — tables are classified as
either generation or lookup at extraction; a table containing any dice-range row
is a generation table.

*Acceptance criterion:* `roll_on_table(table="wand_of_wonder", seed="42")`
produces the same result row on two separate server restarts, with output
including dice notation, individual die face, matched range, and result text.

*Check:* T254.

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
*Check:* T192.

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
When a Novel is resumed or switched to, the Novel's persisted hat state takes
precedence over `TTRPG_HAT`. `TTRPG_HAT` sets the initial active hat only
when the starting Novel has no persisted hat state — either because the Novel is
newly created, or because no hat was activated during a prior session.
*Acceptance criterion:* Server restart with `TTRPG_NOVEL=my-game` restores
entities, HP, conditions, hat, and RNG state; `resume_novel("ended-game")`
returns `[STATE_CONFLICT]`.
_Check:_ T9, T31, T108.

*Out of scope:* hardware-level RNG, cryptographic security guarantees, formal
verification of input safety, and performance under adversarial load beyond the tier
benchmarks defined in REQ-100.

### 5.8 Enrichment, Lore, and Macros

**REQ-080 — Enrichment boundaries.** Enrichment consists of two tiers: (1)
Ruleset-native enrichment — extracted during Discovery from the ruleset's own text
per REQ-225, populated at build time, always present. Items tagged `[ruleset]` with
source anchors. (2) Community enrichment — web-researched post-build per §11.1,
optionally run. Items tagged `[supplementary]` with source URLs. Both tiers coexist
in the enrichment manifest; community items never replace ruleset-native items. The
GM activates items from either tier via the same tool calls. Enrichment may ADD
content to entity voice_examples (REQ-077), prompt ordering recommendations
(REQ-082), lore templates (REQ-083), action suggestion patterns (REQ-084, REQ-115),
adventure advice (REQ-090, §11.1), narrative voice profiles (REQ-226), and
supplementary guidance. Enrichment MUST NOT modify mechanical fields (stats, saves,
HP, conditions, combat state), build-derived tool registrations, hat gating rules, or
any ruleset-derived values. Enrichment recommendations for prompt ordering, lore
templates, and adventure advice are inert — they never auto-apply; the GM must
explicitly activate them via the corresponding tools. Community enrichment items that
have never been activated and whose `collected_at` timestamp exceeds
`TTRPG_ENRICH_STALE_DAYS` are flagged as `[stale]` in `spec_health` and excluded
from enrichment resource surfaces. Ruleset-native items do not carry staleness
flags — they are canonical. Stale items are retained on disk and reactivate if the
GM explicitly activates them. Re-running community Enrich refreshes timestamps for
all community items. Every community enrich finding carries source_url,
quoted_excerpt, hat_scope, confidence (derived from source authority, not mechanical
completeness), output_module, and collected_at (ISO 8601 timestamp of collection) —
all non-empty. Ruleset-native items carry source anchor, confidence, output_module,
and `[ruleset]` tag. Reverting enrichment (REQ-103) removes only community
enrichment; ruleset-native items persist.
*Acceptance criterion:* Enrich-sourced voice_examples carry `[supplementary]` tag
and source URL; ruleset-native items carry `[ruleset]` tag and source anchor; a
stale community enrich item (past `TTRPG_ENRICH_STALE_DAYS`) is flagged
`[stale]` in `spec_health` and excluded from surfaces; `revert_enrichment` removes
community items but preserves ruleset-native items.
_Check:_ T63, T95, T97, T125.

**REQ-081 — Narrative directive.** The Game Master may set narrative directives via
`set_narrative_directive(directives)`. Each directive has a `label` (non-empty, unique
within a Novel) and an `instruction` (free-text). Setting a duplicate label replaces the
prior entry. An empty array clears all directives. For backward compatibility,
`set_narrative_directive` also accepts a single `directive` string — treated as
`[{"label": "primary", "instruction": <string>}]`. Directives appear in `hat_briefing`
for the Game Master hat only and at `novel://current`, grouped under "Narrative
Directives" with their labels. Directives are inert guidance — they do not affect tool
behavior, dice results, or rules enforcement. They persist with the Novel. Player hat
attempts return `[ERROR] [FORBIDDEN]`.
*Acceptance criterion:* `set_narrative_directive([{label: "mood", instruction:
"dark and brooding"}, {label: "pacing", instruction: "slow burn"}])` produces two
entries in `hat_briefing` under the GM hat; a duplicate "mood" label replaces the prior;
an empty array clears all directives.
_Check:_ T64, T134.

**REQ-082 — Prompt section ordering.** The Game Master may reorder the sections of
`hat_briefing` via `set_briefing_order(sections)`. The tool accepts an ordered
array of section tokens. Unknown tokens return `[ERROR] [INVALID_INPUT]` with valid
tokens enumerated. An empty array resets to the builder-determined default.
Section tokens control both ordering and inclusion — a token present in the
array causes its corresponding group to render (or render as an empty section
if the group has no content); a token absent from the array causes its group to
be omitted entirely from `hat_briefing`. The builder default ordering includes
all groups. The builder SHALL document the
complete section-token-to-group mapping and the default ordering in DECISIONS.md, so
the valid token set and default section ordering are auditable at build verification
time without invoking the running server. The mapping SHALL cite the REQ-109 group each
token corresponds to. Tokens
whose corresponding sections are absent from the current ruleset produce empty
sections (no error). Enrich may record an ordering recommendation visible in
`spec_health`, but never auto-applies. The ordering persists with the Novel. Player
hat attempts return `[ERROR] [FORBIDDEN]`.
*Acceptance criterion:* `set_briefing_order(["scene", "entities", "lore"])`
reorders `hat_briefing`; `set_briefing_order([])` resets to builder defaults; an
unknown token returns `[ERROR] [INVALID_INPUT]` with valid tokens enumerated.
_Check:_ T66.

**REQ-185 — Section token vocabulary.** The builder SHALL assign a stable,
validated section token to each REQ-109 group that has a runtime representation
in `hat_briefing`. Token names SHALL be lowercase snake_case identifiers
corresponding to the REQ-109 group (e.g., `entities` for the active entities
group, `combat_state` for the active combat state group). The complete
token-to-group mapping SHALL be documented in DECISIONS.md per REQ-082. The
mapping SHALL be stable across builds — tokens do not change when the ruleset
changes unless a REQ-109 group is added or removed. When a REQ-109 group has no
runtime representation (e.g., ruleset lacks the construct), the builder SHALL
still assign a token that produces an empty section. The valid token set is the
authoritative vocabulary for `set_briefing_order` and enrichment briefing_order
recommendations.

*Acceptance criterion:* Building for D&D 5e produces a DECISIONS.md table
mapping every REQ-109 group name to a snake_case token. Building for the
Appendix B fixture (which lacks combat, countdowns, lore, and adventures)
produces a subset mapping — the token set shrinks but token names for shared
groups are identical.

_Check:_ T224.

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

**REQ-083 — Dynamic lore.** The Game Master may create, update, toggle, group, and remove
keyword-triggered lore entries. Entries activate when trigger keywords appear in scene
description text (§7.7 Scene → Lore coupling), are hat-filtered, support priority ordering and sticky persistence, and are
subject to a configurable token budget. The server SHALL return matching enrich templates from `lore://templates`
via `suggest_lore`. The returned template set SHALL include all hat_scope
values when called from the Game Master hat, and SHALL exclude only
templates whose hat_scope is `game_master` when called from the Player
hat. The template's hat_scope is advisory — the Game Master may activate
a template with any hat_scope value via `set_lore_entry`, regardless of
the template's source scope. Suggested templates carry the same
provenance fields (key, content preview, triggers, confidence,
source_url, hat_scope) as lore templates in the enrichment manifest.
(REQ-155) Lore entries and groups persist with the Novel. Player hat mutating
and grouping attempts return `[ERROR] [FORBIDDEN]`.
*Acceptance criterion:* `set_lore_entry("tavern_rumor", "The innkeeper knows
more...", triggers=["innkeeper","tavern"])` activates when scene text matches;
sticky entries persist for their count after keywords leave; suppressed entries
count appears in `spec_health`.
_Check:_ T67, T79, T81, T82,
T83.

**REQ-155 — Sticky counter decay.** A lore entry's sticky counter decays by one
when the scene text changes such that the entry's trigger keywords are no longer
present. The counter resets to the entry's `sticky` value whenever trigger keywords
re-match. Decay occurs on state mutation (specifically `set_scene_state`), not on
read operations — calling `hat_briefing` multiple times without an intervening
scene change must not alter sticky counters. Entries whose sticky counter reaches
zero are deactivated in the next briefing assembly and removed from active lore
until re-triggered.
*Acceptance criterion:* An entry with `sticky: 3` triggered by scene A. Change
scene to B (no trigger keywords) — assert counter decrements by 1 per scene change.
Call `hat_briefing` twice on scene B — assert counter unchanged. After 3 scene
changes without re-triggering, assert entry no longer appears in `hat_briefing`
lore section. Revert scene back to A — assert counter resets to 3.
_Check:_ T190.

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
hat-filtered: GM-only tools are excluded from Player results. The tool does not
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

**REQ-115 — Action pattern activation.** The server provides a
`toggle_action_patterns` tool — Game Master only. Calling it flips
the Novel-scoped action pattern activation state between enabled and
disabled. When enabled, enrich-derived action patterns (§11.1) supplement
the `suggest_actions` (REQ-084) matching index. When disabled, patterns
remain visible at `enrichment://action_patterns` for review but are
excluded from `suggest_actions` results. The toggle is pure-resolution
(idempotent, no state beyond the boolean). Player hat returns
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
items) from the Novel per REQ-227. Ruleset-native enrichment (tier 1,
`[ruleset]`-tagged items) persists — `revert_enrichment` SHALL NOT remove or alter
ruleset-native enrichment items.
tool — Game Master only. Removes all enrichment state (six output modules from
§11.1), restoring the pre-enrich server state. Does not mutate mechanical fields,
build-derived tool registrations, hat gating rules, or any `[ruleset]`-tagged
content. Does not modify DECISIONS.md — the enrichment manifest and verification
results remain for audit.
GM-configured Novel state that references enrichment content —
briefing_order set via `set_briefing_order` (REQ-082) and the
action pattern activation toggle (REQ-115) — is Novel state, not
enrichment state. It survives reversion unchanged: the GM's
configuration choices persist even when the enrichment data they
reference is absent. After re-enrichment, these choices apply to
the new enrichment data without reconfiguration.
Build-rebuild enrichment behavior is defined in §11.1
(Rebuild scenarios). Player hat returns `[ERROR] [FORBIDDEN]`. Pure-state
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

**REQ-130 — Enrichment rebuild contract.** Re-running the Enrich workflow against a Novel that already contains
enrichment state SHALL preserve every enrichment item that the Game
Master has incorporated into active game state through any Novel-scoped
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
profile. When the ruleset provides no inspirational media section, the module is
empty — this is not a defect. Ruleset-free builds produce an empty module.
*Acceptance criterion:* A ruleset citing Conan and The Lord of the Rings produces
≥2 narrative voice profiles with source anchors and descriptions.
_Check:_ T-new-226.

**REQ-227 — Two-tier enrichment model.** Enrichment SHALL consist of exactly two
tiers: Tier 1 (ruleset-native) extracted during Discovery per REQ-225 from the
ruleset's own text, populated at build time, never removed by `revert_enrichment`.
Tier 2 (community) optionally collected via web research per §11.1, tagged
`[supplementary]`, removed by `revert_enrichment`. Both tiers coexist in all
enrichment resource URIs and `hat_briefing` enrichment sections. The GM activates
items from either tier via the same tool calls. Community items SHALL NOT replace
or override ruleset-native items with matching keys — conflicts are recorded with
`conflicts_with` reference to the ruleset-native item. Ruleset-native enrichment
is part of the build output; community enrichment is additive post-build.
*Acceptance criterion:* A build with ruleset content SHALL populate ruleset-native
enrichment in the Novel at creation time; community enrichment run afterwards adds
`[supplementary]` items alongside `[ruleset]` items; `revert_enrichment` removes
only `[supplementary]` items.
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
them. This check SHALL run before Gauntlet re-execution (§6.7) and SHALL NOT
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
at read time. The resource respects hat filtering per REQ-032. `spec_health`
SHALL surface a summary: `enrichment_status` with per-module activated/total
counts.
*Acceptance criterion:* After activating 2 lore templates and 1 voice example,
`enrichment://status` shows lore_templates: activated=2, total=N; voice_examples:
activated=1, total=N. Other modules show activated=0. Player hat sees only
shared-scope items.
_Check:_ T-new-230.

**REQ-231 — Per-module enrichment toggle.** The GM may enable or disable
individual enrichment output modules at runtime via `toggle_enrichment_module(module,
enabled)`. Module SHALL be one of: `voice_examples`, `briefing_order`,
`lore_templates`, `action_patterns`, `supplementary_guidance`, `adventure_advice`,
`narrative_voices`. Disabling a module SHALL suppress all items in that module
from `hat_briefing`, `suggest_actions`, `suggest_lore`, and enrichment resource
URIs for the current Novel. Disabling does not delete items — the items persist in
Novel state and re-appear when the module is re-enabled. Ruleset-native modules
default to enabled; community modules default to enabled when community enrichment
has been run. The toggle state persists with the Novel. Player hat attempts return
`[ERROR] [FORBIDDEN]`. An unknown module name returns `[INVALID_INPUT]` with valid
module names enumerated.
*Acceptance criterion:* `toggle_enrichment_module("voice_examples", false)` removes
voice examples from `hat_briefing` and `enrichment://voice_examples` for the active
Novel; re-enabling restores them; an unknown module returns `[INVALID_INPUT]`;
Player hat returns `[FORBIDDEN]`.
_Check:_ T-new-231.

**REQ-085 — Macro system.** The server expands macro tokens of the form `{{<path>}}`
in all tool output, resource text, and prompt text before delivery. Supported macros:
`{{entity.name}}`, `{{entity.hp}}`, `{{entity.<stat>}}` (per-ruleset stat names),
`{{scene.current}}`, `{{scene.type}}`, `{{countdown.<name>.remaining}}`,
`{{countdown.<name>.total}}`, `{{countdown.<name>.scope}}`,
`{{countdown.<name>.direction}}`, `{{novel.slug}}`, `{{hat.active}}`, `{{party.size}}`.
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
`[timestamp] [hat] tool_name — output_prefix` for mutating entries or
`[timestamp] [hat] tool_name — [BOUNDARY_VIOLATION]` for forbidden-call entries
(REQ-133). The tool does not modify the audit log (REQ-040). Output is hat-filtered:
Player sees entries where the recorded hat is
`player` or where the entity affected by the entry is owned by the current
player (per the entity-ownership filter defined in REQ-168, applied to
compress_audit output); Game Master sees all. `max_entries` is a positive
integer; values ≤ 0 return `[ERROR] [INVALID_INPUT]`. The tool is pure-generation
(idempotent, no server-side state mutation).
*Acceptance criterion:* `compress_audit(50)` returns a formatted prompt of the
50 most recent entries; Player hat sees only own-entity entries; `compress_audit(0)`
returns `[INVALID_INPUT]`.
_Check:_ T70.

**REQ-087 — Scene type tagging.** The Game Master may tag the current scene with one or
more types drawn from a canonical catalog: `combat`, `social`, `exploration`, `neutral`.
Multiple types may be active simultaneously (e.g., "combat" and "social" for a duel
amidst negotiation). `set_scene_type` accepts either a single type string or an array of
type strings. The type tags are guidance — they affect `hat_briefing` composition (tools
matching any active type are ordered before unmatched tools) and `suggest_actions`
filtering (actions matching any active type are prioritized), but do not alter tool
behavior, dice results, or rules enforcement. The types persist with the Novel. Player
hat attempts return `[ERROR] [FORBIDDEN]`. Confrontation tools (REQ-043) operate
identically regardless of scene type; the tag guides the GM and LLM toward moves
matching the scene type.
*Acceptance criterion:* `set_scene_type(["combat", "social"])` orders combat and
social tools before exploration tools in `hat_briefing`; `set_scene_type("exploration")`
works as single-string for backward compatibility.
_Check:_ T71, T135.

**REQ-125 — Scene transition hook.** When `set_scene_state` is called and the new
description differs from the current `scene_description`, the server records a
`[scene_transition]` audit entry with the old and new descriptions and a timestamp.
This is automatic — no additional tool call is required. Countdowns of either type
(`round` or `narrative`) carrying the `on_scene_transition` flag (REQ-073) decrement
by one tick on transition. Calling `set_scene_state` with a `skip_transition_hook` parameter
suppresses the audit entry and countdown decrement for cases where the GM is updating
the same scene without transitioning it (e.g., adding descriptive detail). The Player
hat sees scene transitions in `scene://history`; GM-only mechanics (audit entry,
countdown decrement) are invisible to the Player hat.
*Acceptance criterion:* `set_scene_state("cave", skip_transition_hook=true)`
does not record a `[scene_transition]` audit entry; a countdown with
`on_scene_transition=true` decrements on scene change.
_Check:_ T136.

*Out of scope:* AI content generation at runtime (all generation is build-time),
real-time web enrichment, and narrative quality assessment beyond the anti-slop
guidance catalog.

### 5.9 Novel Persistence and Transport

**REQ-088 — Novel lifecycle.** A Novel is a named, persistent save file on disk.
`create_novel(name)` creates a new Novel at `.holonovel-state/novels/<slug>.json` and
activates it for the calling connection. `resume_novel(slug)` activates an existing Novel
from disk. `switch_novel(slug)` (REQ-095) switches the active Novel for a connection.
`end_novel()` emits a `[NEED_INPUT]` workflow decision — "End Novel `<slug>`?" — with
options `yes` and `cancel`. On `yes`: deactivates hat, clears undo stacks, removes
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
*Acceptance criterion:* `create_novel("my-game")` creates `novels/my-game.json`;
`end_novel()` prompts `[NEED_INPUT]` with yes/cancel; on "yes", the file is moved
to `.trash/` and the roster survives.
_Check:_ T72, T73, T98, T159.

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

**REQ-095 — Novel switching.** `switch_novel(slug)` (always callable regardless of hat)
deactivates the connection's current Novel and activates the target Novel identified by
slug. The target must exist on disk and must not have been ended (file must be present at
`.holonovel-state/novels/<slug>.json`). Returns `[STATE_CONFLICT]` if the slug does not
exist or the target Novel's file is absent. When switching, the active hat for the
target Novel is restored from the Novel's persisted hat state (REQ-055). If no Novel
is currently active, `switch_novel` activates the target directly (equivalent to
`resume_novel(slug)` without requiring a fresh server start). Novel-scoped tools operate on
the connection's active Novel. Each connection maintains its own active Novel reference;
two connections may have different Novels active simultaneously.
*Acceptance criterion:* `switch_novel("other-game")` deactivates the current Novel
and activates the target; the target's persisted hat is restored; switching to a
nonexistent slug returns `[STATE_CONFLICT]`.
_Check:_ T98.

**REQ-089 — Novel setup.** The server provides a `novel_setup` prompt (prompt #7 in
`prompts/list`). It surfaces the recommended setup workflow: (1) create or import
characters, (2) choose an adventure source (load a module, generate from a premise, generate
a random encounter, or build from scratch), (3) run session zero. Lists available roster
characters, indexed adventure modules, and the generation tools. Setup is freeform — tools
are available without enforced order, but the Novel tracks completed steps
(characters_present, adventure_set, session_zero_completed) in its metadata, surfaced in
`hat_briefing` under the `novel` section token. After `create_novel`, the server response
or `hat_briefing` surfaces `novel_setup` as the recommended next step. `novel_setup` integrates
ruleset-extracted guidance (REQ-016), Enrich `adventure_advice` content, and spec
foundations for adventure-construction context.
*Acceptance criterion:* After `create_novel(...)`, the response directs the
operator to `novel_setup`; the prompt lists available roster characters, indexed
adventures, and generation tools.
_Check:_ T74.

**REQ-090 — Adventure generation.** `generate_adventure(premise)` (Game Master only).
Accepts a free-text premise and produces an adventure scaffold: a title (slug-ified from
premise), an Overview (GM-only, template-populated), an Adventure Hook (player-visible), 2–6
location headings with table-rolled flavor (setting, horror, puzzle tables from the
ruleset), NPC name suggestions, and encounter table seeding. Uses indexed ruleset tables
and, when available, Enrich `adventure_advice` content — selecting templates by
category match (adventure_templates for scaffold structure), genre-convention items by
keyword match against the premise string, and scenario_starters by genre tag — each
selection carrying its source_url and confidence in the output. No runtime
network — all content from indexed data. The scaffold is stored as
adventure content scoped to the Novel (read-only index-level data, guidance-category, same
hat gating as loaded modules per REQ-079). Appears in `search_rules`,
`hat_briefing` under the `adventure` token, and at
`adventure://generated/<anchor>`. Regenerating replaces the prior generated
adventure. The Game Master expands via existing tools; the LLM (GM hat) writes
narrative prose.
*Acceptance criterion:* `generate_adventure("The goblin king demands tribute")`
produces a title, overview, hook, 2–6 locations, NPC names, and encounter seeds;
the scaffold appears at `adventure://generated/<anchor>`.
_Check:_ T75.

**REQ-091 — Enhanced encounter generation.** `generate_encounter(context)` (Game Master
only, optional context string). Combines ruleset encounter tables with Enrich
`adventure_advice` content (matching by scene context keywords against table_expansions
category items, highest confidence first) to produce a complete encounter in one call: a scene description,
an NPC or monster stat block, and a complication entry. With ruleset tables, rolls on them
for the mechanical backbone and wraps in generated narrative. Without tables, produces from
context and Enrich template patterns. Output: three structured artifacts as a batch — one
`set_scene_state`, one `create_npc`, one `set_lore_entry` for the complication. Snapshotted
as a single undo target. No `[NEED_INPUT]`. Player hat → `[FORBIDDEN]`.
*Acceptance criterion:* `generate_encounter("dark forest at midnight")` produces
a scene description, an NPC stat block, and a lore entry as a single atomic batch;
undo rolls back all three.
_Check:_ T76.

**REQ-092 — Novel persistence.** Every mutating tool call writes the Novel to
`.holonovel-state/novels/<slug>.json` (self-contained JSON bundling all state tiers plus
Novel metadata) using an atomic rename — write to a temporary file, then atomically rename
over the target. The serialized Novel payload must be fully durable on the storage
medium before the atomic rename commits. Content written to the temporary file must
be flushed to stable storage (e.g., via fsync on the file descriptor) before the
rename operation. The temporary file path must include an element that prevents
collision with concurrent writers targeting the same Novel (e.g., a process
identifier or timestamp suffix). A Novel on disk whose file size is zero after an
atomic write indicates a durability failure — surfaced in `spec_health` and stderr.
A backup of the previous Novel file is retained as
`<slug>.json.bak`. Both corrupted JSON and a missing backup surface in `spec_health`
and stderr. A rebuild with a changed entity model loads the Novel gracefully:
absent-model fields in JSON preserved as inert data; missing fields receive ruleset-defined
defaults. Roster baselines remain immutable across rebuilds. Structurally corrupted JSON →
stderr warning and `spec_health` flag; never silently discarded. On load, if the primary
file is structurally corrupt but the `.bak` file is intact and parseable, the server loads
from the backup and records a `[restored_from_backup]` audit entry. If both primary and
backup are corrupt, the server emits a stderr warning listing both file paths, surfaces a
`[corrupted_novel]` flag in `spec_health` with the slug, and provides the backup path for
operator recovery. The server must not silently discard or zero-initialize the Novel. No
orphaned state — `end_novel` removes the save file and its backup. The Novel JSON includes
a checksum field — a hash of the serialized state excluding the checksum field itself. On
load, the server verifies the checksum against the loaded state. A mismatch follows the
same recovery path as structural corruption: attempt backup restore, then surface the
mismatch in `spec_health` and stderr if both are tainted. The checksum algorithm and field
name are builder-determined; the convergence loop enforces that tainted state is detected. Undo snapshot stacks
(REQ-041) persist with the Novel — they survive server restarts alongside all other
Novel state tiers.
*Acceptance criterion:* After 10 mutations, the Novel JSON on disk is non-empty
and parseable; `cat novels/<slug>.json | jq .checksum` returns a non-empty string;
a corrupt primary file triggers backup restore.
_Check:_ T77, T88, T156.

**REQ-093 — Novel listing and metadata.** `spec_health` reports available Novels on disk:
slug, name, last-modified timestamp, active flag. The active Novel's metadata includes:
creation timestamp, last-modified timestamp, entity count, adventure source (module slug,
"generated", or "none"), setup-completion flags, session count (distinct `TTRPG_SESSION_ID`
values in the audit log), cumulative play time (earliest-to-latest audit entry timestamp
range), last-active scene anchor, current combat round if in-combat, and total combat rounds
played across this Novel's lifetime. This metadata appears in
`hat_briefing` under the `novel` section token (added to REQ-082's documented token
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
metadata. Formats are defined in Appendix L. Player hat attempts return `[ERROR]
[FORBIDDEN]`. For a complete story package that includes lore alongside entities,
NPCs, scene state, countdowns, and audit history, use `export_novel` (REQ-096) —
which embeds the lore tier within the Novel interchange format. `export_lorebook`
is the lore-only interchange pathway.
*Acceptance criterion:* `export_lorebook()` → `import_lorebook(exported_data,
"replace")` → `export_lorebook()` produces identical output; Player hat returns
`[FORBIDDEN]`.
_Check:_ T80.

Merge mode adds entries whose keys are not present in the Novel's lore tier and
preserves all existing entries unchanged. Duplicate keys — entries whose key
matches an existing lore entry — are skipped with a count reported in the
operation result. Replace mode clears the lore tier before importing, producing
a lore set consisting solely of the import data. Dry-run mode reports which
entries would be added, which would be skipped as duplicates, and which would be
overwritten (replace only), without modifying state.

**REQ-096 — Novel interchange.** `export_novel(format)` (Game Master only, format `json`
or `markdown`) exports the active Novel's complete state — entities, NPCs, scene,
countdowns, lore, enrichment, adventure, audit log (full — all entries, structured per
REQ-040 entry format), snapshots, hat state, and
metadata — in a self-contained interchange format. `import_novel(data, mode)` (Game Master
only, mode `dry-run`, `replace`, or `merge`) imports a previously exported Novel.
`dry-run` reports what would change without side effects. `replace` replaces the active
Novel's state with the import data. `merge` adds entities and NPCs from the import to the
active Novel, skipping duplicates by entity or NPC ID. Player hat attempts return
`[ERROR] [FORBIDDEN]`. Round-trip: export → import → export produces identical output.
Format schema is defined in Appendix Q. Importing a Novel via `import_novel` restores
its lore tier alongside all other state; no separate `import_lorebook` call is
required for story-portability.
*Acceptance criterion:* `export_novel("json")` → `import_novel(data, "dry-run")`
reports changes without side effects; `import_novel(data, "replace")` restores
the exported state; round-trip is byte-identical.
_Check:_ T100.

**REQ-097 — Novel health.** The `spec_health` tool reports per-Novel health metrics for
the active Novel: NPC count (with warning if near `TTRPG_MAX_NPCS` when configured), lore
entry count (with warning if near `TTRPG_MAX_LORE_ENTRIES` when configured), audit log
entry count, snapshot stack depth (with warning if near `TTRPG_MAX_SNAPSHOT_DEPTH` when
configured), on-disk file size in bytes (with warning if exceeding 4 MB), and a `healthy`
flag — set to false if any warning is active). `spec_health` reports a sliding window of
Novel file-size deltas and snapshot depth deltas over the most recent sessions (distinct
`TTRPG_SESSION_ID` values in the audit log, bounded to the last 7 by default). A Novel
whose growth trajectory projects an on-disk file size exceeding 4 MB within the next 3
sessions is flagged with a `[size_growth]` warning. The file-size metric reported
in `spec_health` SHALL match the on-disk file size as reported by the operating
system, including all serialization overhead (encoding, checksum field,
whitespace formatting). A file reported at size S bytes in `spec_health` whose
on-disk size differs by more than 1% is a `[size_mismatch]` warning —
indicating a durability or serialization defect. The growth trajectory SHALL use
the on-disk size, not the in-memory representation size. Health metrics are hat-filtered:
Player sees entity-level health only; GM sees all.
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
Lore matching and Countdown hooks per REQ-083, REQ-125). Combat state, pending
workflows, enrichment state, and audit log entries SHALL be restored after all
property groups. An out-of-order initialization that produces observable
differences in `hat_briefing` content, resource URI output, or tool behavior
between two invocations of the same Novel against the same builder is a
convergence finding. The builder records the initialization order in
DECISIONS.md (4).
*Acceptance criterion:* Create a Novel with an adventure, an NPC referencing
an adventure template, a lore entry mentioning the NPC, and a countdown with
`on_scene_transition`. Restart. Assert `hat_briefing` surfaces adventure
content, then the NPC (with template stats), then the triggered lore entry,
then the countdown — in dependency order. The order IS stable across 3
restarts.
_Check:_ T145.

### 5.10 World-Model Layer

The server SHALL incorporate a world-model layer — a subsystem that models rooms,
things, exits, containment, kinds, and properties as typed objects with mechanical
contracts. The layer extends every Novel's state model with a spatial world model,
parser command dispatch tools, and world-model CRUD tools. It does not replace or
constrain TTRPG mechanics — it augments them.

Conflict-resolution order:

1. TTRPG ruleset contracts (dice, combat, conditions, spells — §§5.1–5.9)
   override world-model layer behavior.
2. World-model layer contracts override infrastructure defaults (response
   format, resource URIs, hat vocabulary).
3. TTRPG ruleset contracts override infrastructure defaults.
_Check:_ T237.

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

**REQ-196 — Parser command dispatch.** THE system SHALL accept
natural-language text commands and resolve them against the world model's
current state. Recognized commands SHALL include: navigation (walk, move,
or go directions), inspection (examine named objects, look at current room),
object interaction (take portable things, drop carried things, open/close
openable objects), inventory listing, and wait. Navigation SHALL resolve exit
directions and check door state — a closed door blocks passage. Object
interaction SHALL respect portability and containment — taking a fixed object
returns a rule-violation; taking an object inside a closed container returns a
rule-violation. An unrecognized command SHALL return a not-implemented result
with the command verb named. An ambiguous object reference SHALL return all
matching objects with their locations and distinguishing descriptions.
When the world-model tier is empty (no rooms), all parser commands SHALL
return a not-implemented result directing the user to populate the world
model via an adventure module or CRUD tools. _Check:_ T239.

**REQ-197 — Room description generation.** WHEN the player enters a room
or issues a look command THE system SHALL return the room's name, its
verbatim description, and visible things with containment chains expressed
in a standard format. The description SHALL be drawn from the source
text — no generative prose is appended. Exit directions SHALL appear in
status-line context, not in the room-description body. _Check:_ T240.

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
under the Game Master hat. The tool SHALL populate only an empty Novel
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
command catalog from the indexed provider documentation). All world-model resources SHALL be hat-filtered: the Player hat
sees only descriptions and visible state; the Game Master hat sees
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

*Out of scope:* multiplayer synchronization, real-time collaborative editing,
save-game versioning beyond the checksum model, and Novel migration between
different rulesets.

### 5.11 Ruleset-Free Build Mode

**REQ-218 — Ruleset-free build.** WHEN the Build workflow is selected with B1 set to
`none` THE builder SHALL operate in ruleset-free mode. THE builder SHALL NOT perform
chunked reading, extraction, or mechanical modeling of ruleset content. THE server
SHALL register every REQ-020 infrastructure tool category, every REQ-022 resource URI,
and every REQ-023 prompt. Ruleset-dependent tools — canonical lookups, dice-resolution
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

