## 6. The Build Process

### 6.1 Workflow overview

The build is organized into four independently selectable workflows. The operator picks one or
more workflows; the builder asks only the questions those workflows need and proceeds accordingly.

| Workflow | What it does                                                | Required sections        |
| ------- | ----------------------------------------------------------- | ------------------------ |
| Convert | Convert PDF/HTML/web source to Markdown; validate structure. Accept core rulebooks, supplemental books, character sheets, and adventure modules — anything related to the ruleset. | §6.2, Appendix G, H      |
| Build   | Intake Markdown, discover ruleset, construct & verify server. Accept core rulebooks, supplemental books, character sheets, and adventure modules — the builder discovers adventure content within provided materials. | All sections + appendices |
| Synthesize | Community play advice and structured synthesis (optional)   | §11.1            |
| Update  | Reconcile an existing server with a revised specification. Perform gap audit, implement changes, re-verify all blocking Pattern Buffer sub-workflows. | §6.7, §6.2      |

### 6.2 Intake

Ask the operator pre-build questions up front, as a single batch. The builder asks the
workflow-selection question first, then all questions relevant to the selected workflows. Each workflow's
questions are presented together; answers are recorded in DECISIONS.md. Non-interactive
runs use defaults from the tables below (defaults: `build` when offline, `build + synthesis (action: run)` when network detected).

Build intake questions are operator-facing build-process inputs recorded to DECISIONS.md (1) — they are not Novel property groups and do not participate in cross-property coupling (§7.7).

The builder MUST NOT begin any workflow until the operator has answered Q0 and all
questions for the selected workflows. Answers are recorded in DECISIONS.md (1). A
build that begins without recorded answers fails the process-compliance
convergence metric (§6.5). The builder presents all questions in one batch; if the
operator selects workflows at different times, the builder re-asks only the new workflow's
questions. After recording answers, the builder confirms back in one message:
selected workflows, all answers, and the first workflow to execute.

**Q0 — Workflow selection.** Asked first, at most one answer.

| #   | Question                     | Options                                  | Default |
| --- | ---------------------------- | ---------------------------------------- | ------- |
| Q0  | What workflow(s) should Holonovel run? | convert / build / synthesis (action: run) / update (select one or more) | build + synthesis (action: run) (when network detected), build (when offline) |

**Q1 — Pause between workflows.** Asked when two or more workflows are selected.

| #   | Question                     | Options       | Default |
| --- | ---------------------------- | ------------- | ------- |
| Q1  | Pause between workflows for operator review? | yes / no | yes |

If Q1 is `no`, the builder runs all workflows back-to-back without pausing and MUST NOT
produce any completion summary, AAR, or final-status table until all workflows are
finished and all verification workflows have run. Intermediate progress notes are permitted but must
not read as completion. If `yes`, the builder pauses after each workflow, reports its
outcome and verification results, and asks the operator whether to continue to the
next workflow.

Auto-detection for Q0 default. When the default option specifies "when network
detected," the builder probes connectivity to at least one known-public host before
presenting questions. If the probe fails, the builder falls back to `build` only and
records the failure in DECISIONS.md. If the probe succeeds, the default includes
`synthesis (action: run)`; the operator may still deselect it.

**Convert workflow.** Asked when `convert` is selected. The workflow produces Markdown
passing all Appendix H blocking checks and meeting content-type fidelity thresholds.
The builder selects a converter satisfying the capability profile (Appendix G.1),
produces the converted Markdown, and verifies fidelity per Appendix G.2.

| #   | Question                     | Options                          | Default             |
| --- | ---------------------------- | -------------------------------- | ------------------- |
| C1  | Source type                  | PDF / HTML / web scrape          | —                   |
| C2  | Source path(s) or URL(s)     | Paths or URLs                    | —                   |
| C3  | Ruleset identifier (name, edition) | String                      | derived from source |

**Build workflow.** Asked when `build` is selected. Questions are presented in
two tiers: Required first, then Advanced.

**Required Build questions:**

| #   | Question                     | Options                          | Default             |
| --- | ---------------------------- | -------------------------------- | ------------------- |
| B1  | Ruleset(s) to package              | One or more `slug=path` pairs separated by spaces (e.g., `dnd5e=ruleset/dnd5e/ starfinder=ruleset/sf/`), or `none` | —                   |
| B3  | Which AI client will you use? | Claude Desktop / Opencode CLI / other | Opencode CLI      |
| B4  | Where should the server save its data? | Folder path              | OS-standard out-of-tree default per §7.6; never inside the git work tree |
| B6  | What should the server be called? | Name                          | `[game_name]-holonovel` for single ruleset; `holonovel-multi` for multiple |
| B13 | Which rulesets to include? | Derived from B1 when multiple rulesets are specified | all rulesets in B1 |

**Advanced Build questions.** After the builder confirms Required answers, the
builder presents the Advanced defaults and asks whether the operator wants to
override any. If the operator declines, all Advanced questions take their
defaults without further prompting.

| #   | Question                     | Options                          | Default             |
| --- | ---------------------------- | -------------------------------- | ------------------- |
| B2  | Ruleset identifier (name, edition) | String                      | derived from source |
| B5  | Where is your AI client's settings file? | File path               | auto-detect from B3 |
| B7  | Connect MCP client to server after build? | yes / no                | yes                 |
| B8  | Where is the Holonovel spec repository? | URL                    | `origin` remote of the current repo, else the community-maintained default |
| B9  | Build mode                   | production / quick-build           | production          |
| B10 | Which version of holonovel to use as world-model base? | npm version or `latest` | `latest` |
| B11 | Embed adventure module content in Novel exports? | yes / no                     | no                  |
| B12 | World and narrative surface prominence? | secondary / visible / prominent | visible           |
| B15 | Per-ruleset build mode overrides | none / comma-separated `slug:mode` pairs | none |

The builder SHALL record all answers — Required and Advanced — in
DECISIONS.md (1). When the operator declines the Advanced prompt, the
defaults are recorded with a `(defaults accepted)` annotation.

**Multi-ruleset intake.** When B1 specifies two or more `slug=path` pairs, the builder
SHALL parse each pair. The slug MUST be a valid slug per §7.1a. The path MUST be a
readable directory containing at least one `.md` file. The builder SHALL verify each
path exists and is readable before Discovery begins. A path that does not exist or
contains no `.md` files SHALL be recorded as a finding in DECISIONS.md (1) — the
operator may correct it or remove that ruleset from the build. The builder SHALL
record the slug-to-path mapping in DECISIONS.md (1). Ruleset-free mode (B1=`none`)
and single-ruleset mode (B1 has exactly one `slug=path` pair) are unchanged — the
builder proceeds with the existing pipeline. Multi-ruleset mode emits one declarative
package per ruleset via the Package step (§6.4.2) after each ruleset completes
Construction and the Pattern Buffer; the host loads any number of packages, so
multi-ruleset builds no longer merge into a single server.

B13 defaults to all rulesets in B1. B15 allows per-ruleset `production` or
`quick-build` overrides — when not specified, each ruleset inherits the global B9
setting.

**Ruleset-free mode.** When B1 is `none`, the build operates in ruleset-free mode: no ruleset files
are indexed, no extraction occurs, and the server is built from the `holonovel`
package (B10) and infrastructure tools (REQ-020) alone. The server provides a freeform
narrative roleplay surface: scene management (`scene (action: set)` with scene_type and
narrative_directive), NPC creation, lore tracking, faction management, player choices,
pause/resume context, countdowns with full clock taxonomy, and session notation — all
with world-model spatial navigation available as optional scaffolding. The builder
records ruleset-free mode in DECISIONS.md (1), runs `npm install holonovel`
at the version specified by B10, and proceeds to server construction (§6.4) using
the holonovel scaffold as the starting point. Extraction discovery and its dependent
metrics are skipped. A build declared ruleset-free MUST NOT attempt to index, extract,
or model any ruleset content; the server's `ruleset (action: search)` tool returns empty results, its
canonical lookup tools are waived (REQ-013), and no dice-resolution tools are registered.
The server's ruleset content hash is the sentinel hash per REQ-044. When B1 is
`none`, B12 (`TTRPG_WORLD_PROMINENCE`) is skipped — the world-model and narrative
layers are the primary surface by definition (REQ-218), and no prominence
configuration is recorded.

**Build mode profiles.** `production` (default) runs the full quality suite:
assumption audit (REQ-101), per-step audits with auditor pre-flight, post-write
verification on every file, cross-model auditing when available, and the full
Pattern Buffer (§6.6). The Pattern Buffer gates both modes. `quick-build` mode narrows the
overhead rituals: skips the assumption audit and auditor pre-flight, scopes
post-write verification to critical files (DECISIONS.md, MCP client config,
on-disk Novel state), and accepts same-model audits. The Pattern Buffer still gates
— any build that creates or modifies tools must pass it. Quick-build mode is for
inner-loop iteration; the server is runnable but not handoff-ready. A
quick-mode build records a `quick-build` annotation in DECISIONS.md (6).

**Config verification.** After writing the MCP client configuration, the builder
fetches the target client's documentation for its MCP server config schema (from
B3) and verifies every key name matches the target's conventions. Known
differences include: `workdir` vs `cwd`, `env` vs `environment`, `args` as a
separate array vs appended to `command`. An incorrect key is a client-config
defect (F6) and blocks the build until remedied. If B7 is `yes`, the builder
writes the server entry into the client's config file, then immediately runs the
H11 verification step: launch the server via the client's documented invocation, assert the
initialize handshake succeeds, and confirm `serverInfo.name` matches the
`mcpServers` key. A `server unavailable` error stops the line.

**Synthesis workflow.** Asked when `synthesis (action: run)` is selected.

| #   | Question                     | Options                          | Default             |
| --- | ---------------------------- | -------------------------------- | ------------------- |
| E1  | Where is the server you already built? | Folder path              | —                   |
| E2  | What kinds of advice to search? | all / choose: community forums, actual plays, strategy guides, genre advice, designer notes, media influences (movies, TV, video games) | all |
| E3  | Minimum confidence           | high / medium / low               | medium              |
| E4  | Override module budget caps? | use defaults / custom (provide caps per module) | use defaults           |
| E5  | Run synthesis? (web-sourced + Novel-state, off by default) | yes / no                          | no                   |

**Update workflow.** Asked when `update` is selected.

| #   | Question                     | Options                          | Default             |
| --- | ---------------------------- | -------------------------------- | ------------------- |
| U1  | Where is the server to update? | Folder path                    | —                   |
| U2  | How should the spec version delta be detected? | auto (compare DECISIONS.md to current spec) / manual (operator states the previous spec version) | auto |
| U3  | Fetch latest spec from repo before update? | yes / no                       | yes                 |

**Cross-workflow deduplication.** When the operator selects multiple workflows, questions
identical in wording and semantics are asked once. If Convert produces the Markdown sources
Build uses, C2's resolved paths answer B1 implicitly; B1 is still asked so the
operator can override. The builder records the shared answer under each
applicable workflow's entry in DECISIONS.md (1) with a `(shared with <workflow>)`
annotation.

**Verification workflow G0.** Run at intake: verify the source is readable, well-formed, structurally sound.
The structural pass identifies heading count, table count, and broken links. The provisions
of Appendix H apply. A structural defect blocks the line. Sources not already in Markdown
are converted per [Appendix G](#appendix-g-source-conversion). G0 is a ruleset-facing
verification workflow — per §8, verification workflows G2 and G3 are fixture workflows run once per builder implementation.
WHEN B1 is `none`, G0a SHALL report a passing result with the finding "no ruleset — skipped" (per Standing Rule 9).

**Viability pre-check.** After G0 but before chunked discovery, the builder
counts mechanical sections — headings containing procedures, tables,
bold-labeled fields, or definition lists — as a proportion of total
`##`-level sections. If mechanical sections are below 30% of total sections,
the builder warns the operator: "This ruleset is below the
mechanical-density threshold (X% mechanical). Discovery may not produce a
playable server." The operator may proceed, select a different source, or
abort. The builder records the pre-check count and operator decision in
DECISIONS.md (4). Per Standing Rule 9, the viability pre-check is skipped — the
mechanical-section count SHALL be recorded as zero.

### 6.3 Discovery

*Prepare:* Load files from `build-phase-map.md` Discovery row: 03-build.md §6.3,
02-requirements.md §5.2.

**Chunked reading.** The ruleset is read in chunks calibrated to stay within the
builder's context window. The builder records the chunking strategy in
DECISIONS.md (4). The builder reads each chunk, extracts models (see below), then
requests the next. Guidance-only sections are read in a post-processing pass after
mechanical extraction and do not count against the mechanical-section budget.

**Per-section hash skip.** When per-section hashes from a prior build are present in
DECISIONS.md (4), the builder SHALL compare each section's hash before reading.
Sections whose hash matches the prior build SHALL be skipped — their prior extraction
output is referenced per REQ-302. Sections whose hash differs or is absent from the
prior record SHALL be read and extracted.

**Guidance pass budget.** Guidance-only sections are read after all mechanical
chunks have been extracted and Phase 1 confidence metrics converge. Guidance
extraction is a single post-processing pass, not interleaved with mechanical
extraction. The guidance pass SHALL not exceed 50
guidance-only sections per batch. If the ruleset contains more than 50 guidance-only
sections, the builder processes them in batches of 50.
The builder records the total guidance-section count and batch count in
DECISIONS.md (4). A ruleset whose guidance-section count exceeds the
mechanical-section count by more than 3× SHALL log a `[guidance-heavy]`
finding in the defect log — informational, not blocking.
*Acceptance criterion:* A ruleset with 120 guidance-only sections is
processed in 3 batches of 50 interleaved with chunk reads; DECISIONS.md
(4) records total guidance sections = 120, batches = 3; the defect log
carries a `[guidance-heavy]` finding. A ruleset with 30 guidance sections
is processed in a single pass.
_Check:_ T171.

Cross-chunk references are resolved at the end.

**Cross-chunk reference resolution.** After all chunks have been read, the builder
SHALL perform a resolution pass over all deferred cross-chunk references. A
reference is resolved when it maps to a source anchor present in
RULESET_MODEL.md. Unresolved references — those whose target does not appear
in any chunk's extractions — are classified: (a) target exists in ruleset but
was not extracted (MEDIUM-confidence defect, the builder re-reads the target
section); (b) target is in a section the builder classified as non-mechanical
(LOW-confidence, logged as informational); (c) target does not exist in the
ruleset (LOW-confidence, logged as broken cross-reference defect per
REQ-012). Resolution SHALL complete within one additional pass — a reference
still unresolved after the builder re-reads its target section is logged as a
HIGH-severity defect. The builder records the total cross-chunk reference
count, resolved count, and unresolved count in DECISIONS.md (4).
*Acceptance criterion:* A ruleset with 15 cross-chunk references produces a
DECISIONS.md (4) entry with resolved/unresolved counts; every resolveable
reference maps to a source anchor in RULESET_MODEL.md; an unresolvable
broken reference appears in the defect log with severity and source
location.
_Check:_ T172.

**holonovel prerequisite.** When B1 is not `none` (TTRPG build), the builder
installs the `holonovel` npm package at the version specified by B10. The holonovel
package provides the world-model layer pre-built — kind hierarchy, property contracts,
parser command catalog, and declarative assertion syntax — as `core` and `world` entry
points. The `holonovel` package IS the host server that loads ruleset packages; the
builder produces declarative packages (REQ-389) that the host consumes, rather than a
separate server per ruleset. No
chunked reading or provider-documentation indexing occurs during TTRPG builds — the
holonovel package is a build-time and runtime dependency, not a per-build extraction target. The
world-model layer is surfaced at the `world://kinds` resource (REQ-202). When B1 is
`none` (ruleset-free mode), the holonovel package IS the server with no packages installed — the builder installs it,
verifies it starts, and no further extraction occurs.

**Extraction categories.** For each chunk, the builder extracts and records:

1. **Concepts** — named ruleset terms: stats, moves, conditions, statuses. Each with
   confidence and source anchor.
2. **Entities** — character types, monsters, NPCs. Each with fields, field types, default
   values and ranges, and lifecycle (creation, advancement, deletion where defined).
3. **Actions** — resolution mechanics, commands, generation. Each classified as Resolution,
   Command, or Generation (REQ-015), with registration intent (MUST/SHOULD/MAY).
4. **Tables** — lookup tables and generation tables, with dice notation and content.
5. **Resolution** — the core mechanic: dice notation, stat associations, result bands.
6. **Roles** — Player and Game Master terms from the ruleset.
7. **Guidance** — badge-addressed prose, verbatim, with attribution and badge scope.
   **Narrative tone samples** are a guidance subcategory: example-of-play passages that demonstrate
   the ruleset's narrative tone, tagged `[narrative-tone]` and surfaced in `badge_briefing`
    (REQ-071).

**Category extraction order.** Within each chunk, the builder SHALL extract categories
in dependency order — Concepts first (they define terms other categories reference),
then Entities (they may reference Concept terms), then Tables, then Actions (classified
per REQ-015 against the chunk's Concept inventory), then Resolution (the core mechanic
as derived from Actions and Tables), then Roles (badge-addressed as extracted from
guidance signals), then Guidance (prose and tone samples, extracted last as inert data).
A cross-category reference in a later extraction that cannot be resolved against the
inventory of earlier extractions within the same chunk SHALL be recorded as a
MEDIUM-confidence finding in the defect log with a deferred-reference annotation.
Deferred references are resolved during cross-chunk reference resolution.
*Acceptance criterion:* A ruleset chunk whose Actions reference a Concept
term defined within the same chunk resolves that reference against the
Concept inventory. A reference to a Concept term not yet extracted within
the chunk produces a deferred-reference annotation in the defect log; the
reference is resolved correctly after cross-chunk resolution.
_Check:_ T173.

**Outputs.** Discovery produces:

- **RULESET_MODEL.md** — the semantic model with citations, confidence labels, and defect
  log.
- **ruleset_model.json** — machine-readable model consumed by verification and server
  code.

**Character-creation extraction.** When the ruleset defines character creation, the
builder SHALL extract the character-creation rules into the model: playable character
types and species, classes and advancement paths, ability-generation methods with their
parameters, derived-statistic definitions as formulas, and starting equipment. The
mandatory step enumeration is recorded under `character_creation.steps` per REQ-151a.
When the ruleset defines no character creation, the builder records the absence and the
model carries no character-creation data. Extraction follows the cross-format
consistency rule (REQ-209) and category order above.

**Ruleset Wisdom extraction.** After the seven extraction categories are complete,
the builder SHALL classify extracted guidance into seven Ruleset Wisdom output modules per
REQ-225: example-of-play dialogue → voice_examples, GM advice chapter structure →
briefing_order, setting/location descriptions → lore_templates, example-of-play
resolution sequences → action_patterns, GM/player advice prose →
supplementary_guidance, encounter tables and campaign frameworks →
adventure_advice. Classification is feedback-driven per REQ-225: after the initial
sort, the builder checks each module for content and re-reads source sections for
any barren module per the REQ-225 re-read mapping. Items carry the `[ruleset]` tag
and source anchors with HIGH confidence. The classified items form the
ruleset-native synthesis manifest — artifact-scope build output recorded in
RULESET_MODEL.md and the package. A pre-built host does not inject `[ruleset]`
items into runtime Novel state; the host's runtime Wisdom manifest carries
vendor content only (§11.4). Ruleset-free builds produce an empty manifest.

**Mechanical coupling classification.** After the seven extraction categories
are complete and Ruleset Wisdom extraction is done, the builder SHALL classify
extracted mechanical tools for Holodeck coupling effects per REQ-377. For each
extracted tool in categories 1–6, the builder checks the tool's ruleset
description for world-affecting language: destruction, illumination,
extinguishing, obstruction, creation, or transformation → Spatial; condition
application, disposition shifts, or entity modification → Entity-bearing;
divination, detection, revelation, or information discovery →
Knowledge-carrying; urgency creation, round-limited effects, or time pressure
→ Temporal.

Classification follows the same feedback-driven pattern as Synthesis
classification (§6.3): the builder sort-assigns each qualifying tool's
coupling effect to the matching archetype, then checks per-category coverage.
Mechanical coupling items below the REQ-378 thresholds trigger re-reading of
under-coupled source sections.

Coupling metadata is written to the Mechanics property group and rendered in
the coupling table (§7.7.1a) per pattern rules P34–P37.

**Synthesis extraction memoization.** Before running REQ-225 classification,
the builder SHALL check for a pre-built synthesis manifest per REQ-245. When
a validated manifest is present, REQ-225 extraction and the feedback-driven
re-classification loop SHALL be skipped. When no pre-built manifest is present,
the builder SHALL compare the ruleset content hash (REQ-044) against the
synthesis manifest stored in a prior build's DECISIONS.md (4). A hash match
indicates the ruleset source is unchanged — the builder MAY skip REQ-225
extraction and re-classification, recording `cached — ruleset hash match` in
DECISIONS.md (4). A hash mismatch or absent prior manifest SHALL trigger live
extraction.

**Cross-format consistency.** Before server construction, the builder samples 10
items at random from the model — spanning at least three extraction categories — and
verifies that RULESET_MODEL.md and ruleset_model.json agree on: name, source anchor,
confidence label, and action classification. A mismatch is a discovery defect,
recorded in the defect log, and must be resolved before construction begins.

**Reconciliation.** When the ruleset restates a mechanic across multiple sections (e.g., a
procedure and a summary table disagree), every source is recorded. The most authoritative
section is canonical; others are LOW confidence. Ambiguity is flagged as a defect.

**Reconciliation authority criteria.** When the ruleset restates a mechanic
across multiple sections, authority SHALL be determined by applying these
criteria in order, stopping at the first that yields a single candidate:

1. The section the ruleset's own index or table of contents designates as
   the primary reference for that mechanic.
2. The section whose heading text is the most specific match to the mechanic name.
3. The section within the ruleset's core-mechanics chapter (the chapter
   at the shallowest heading depth containing the highest proportion of
   mechanical sections, identified by the builder during viability pre-check).
4. The section with the most explicit procedural text — measured as the
   highest count of imperative verbs (roll, add, subtract, compare, apply)
   within the section's mechanics paragraphs.
If criteria 1–4 produce a tie, all tied sections are recorded as
co-canonical (MEDIUM confidence for each) and the ambiguity is flagged
as an `[authority-tie]` defect. The builder records which criterion
resolved each reconciliation in RULESET_MODEL.md's defect log.
*Acceptance criterion:* A mechanic restated in three sections — one in
the core-mechanics chapter, one in a summary table, and one in a
supplement — assigns canonical status to the core-mechanics section
(via criterion 3). If the ruleset's index points to the summary table
as the primary reference, criterion 1 overrides and the summary table
is canonical. An `[authority-tie]` is produced when criteria 1–4 all
produce a tie.
_Check:_ T174.

**Adventure structure extraction.** After the seven extraction categories and
synthesis classification, the builder SHALL run adventure structure extraction
(REQ-247) against every adventure module file present in the build input. The
builder records the adventure index — structural TOC, extracted NPC references,
location entries, and faction references — in DECISIONS.md (4). The step is
skipped when no adventure files are present.

### 6.4 Server construction

*Prepare:* Load files from `build-phase-map.md` Construction row: 03-build.md §6.4,
 02-requirements.md §5.3–§5.9, 04-runtime.md.

**Spec copy.** During Layer 1 (MCP skeleton), the builder copies the specification
document (`holonovel.md`) into the server's installation directory. The copy
establishes the `spec://build` resource (REQ-105). The builder records the
specification's content hash in DECISIONS.md (1) alongside the ruleset intake hash.

The six-step order below is a recommended construction sequence, not a
requirement. A builder that organizes its work differently and passes the same
acceptance checks (third column) is compliant. The steps are
dependency-ordered — each builds on the previous — and skipping or reordering
a step without an alternative acceptance check is a process-compliance
finding. The server is built in six steps, each with an acceptance check:

| Step | What it does                                                | Acceptance                                                   |
| ----- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| 1     | MCP skeleton: initialize with badge gating, state management, and world-model infrastructure (provided by holonovel scaffold), tools/list, resources/list, prompts/list | G0b (MCP conformance, Appendix D)         |
| 2     | Index: anchor tree, search, `ruleset (action: search)` tool              | RULESET_MODEL.md anchors match source                        |
| 3     | Extraction pipeline: content-type detection, entity/model extraction | B.2 expected model excerpt verified            |
| 4     | Domain tools: resolution, commands, generation, lookup       | Full G2 golden transcript replay (per §8 G2)                 |
| 5     | State layer: adds ruleset-specific types (entity stats, combat, spell slots) on top of the world-model infrastructure layer. World-model state is provided by the holonovel scaffold. | T9 pass (badge test)                                       |
| 6     | Prompts: `run_workflow`, `badge_briefing`, `intro`, `session_zero`, `novel_setup` | T22 pass (prompt registry test)            |
| 7     | Package: emit a declarative ruleset package (model, index, tool schemas, resources, prompts, hash, version manifest) per ruleset (REQ-389) | G8 pass, per-ruleset G2 replay after package load in the host |

The server renders user-requestable artifacts through the output format catalog
(Appendix T.1). The `markdown`, `json`, and `html` formats are mandatory Build
baselines on every artifact surface; `ascii` is a mandatory baseline on
stat-block surfaces; `lonelog` and ruleset-declared formats are optional. The
`character (action: sheet)` tool SHALL support `markdown` (default), `json`, `html`, and
`ascii`. Interactive `ui://` surfaces (REQ-426a) are an optional negotiated
extension, not a baseline.

For Step 1, the holonovel scaffold provides the MCP skeleton with badge gating
helpers, state management, macros, and world-model layer (rooms,
things, exits, parser commands, kind hierarchy). The TTRPG builder installs the package,
verifies `serverInfo.name` reports correctly, and proceeds to Steps 2–6 — layering
ruleset-specific content on top of the infrastructure base.

**License.** The server MUST include a `LICENSE.md` file at the project
root with two sections: a **Ruleset Data** section identifying the source
material and its license (drawn from Appendix I), and a **Server Code**
section stating that `src/` and `scripts/` are MIT-licensed (see
`package.json`). The builder SHALL also read Appendix U and render each row into the
README.md license footer. Format: "Built from: [Source] ([License], [Copyright])"
— one source per line, semicolon-separated, flowing into a single paragraph
terminated by the RSS link and last-updated date.

### 6.4.2 Package step

*Prepare:* Load files from `build-phase-map.md` Package row: 03-build.md §6.4.2,
02-requirements.md §5.16, §5.17.

The Package step emits a declarative ruleset package (REQ-389) per ruleset. Each
ruleset build SHALL have passed Steps 1–6, the Pattern Buffer, and verification
workflows G2–G5 before packaging begins. The step SHALL operate in this order:

1. **Assemble the artifact.** Serialize the extracted model, the full-text search
   index, every ruleset-derived tool schema with execution logic expressed as data,
   rule sources, and prompt definitions into the package. Each package carries a
   content hash and a version manifest carrying the package-format fingerprint
   (REQ-420) and the host version it was built against (REQ-389). When the model
   carries character-creation rules, the package SHALL
   include them (REQ-399). Derived-statistic formulas use a self-contained expression
   grammar over the model's value vocabulary: numeric literals, the arithmetic
   operators, parentheses, `floor`, `ceil`, `min`, and `max`, and named inputs drawn
   from the extracted model (ability values and modifiers, character level, class
   bonuses, and species traits). A formula referencing an input the package does not
   define is a build defect.

2. **Register per-ruleset surfaces.** For each ruleset, assign the `<slug>_` prefix
   to every ruleset-derived tool and annotate it with the ruleset slug (REQ-379).
    Infrastructure tools (REQ-020 World, Novels, Badges & Workflow, Narrative categories) are
   provided by the host and SHALL NOT be duplicated in a package. Per-ruleset
   resources (`ruleset://`, `monsters://`, `spells://`, `equipment://`,
   `classes://`, `adventure://`) SHALL be namespaced as `<slug>://<path>` — each
   package's resource tree is a separate URI namespace.

3. **Record the prefix map.** Record the prefix-to-slug mapping in DECISIONS.md (1),
   reported at runtime in `spec_health` under `ruleset_prefix_map` (REQ-379).

4. **Verify isolation.** The builder SHALL audit each package's tool set for: (a)
   every ruleset-derived tool carries a `ruleset` annotation matching its slug; (b)
   no infrastructure tool is duplicated into the package; (c) no two tools within the
   package share a registered name after prefixing; (d) the `ruleset_prefix_map`
   matches the B1 slug-to-path mapping; (e) every ruleset-derived tool schema carries
   a REQ-024a title in the ruleset's own terms, a three-clause description, and a
   REQ-427 description on every input parameter; (f) no ruleset-derived tool exceeds
   the REQ-408 parameter ceiling; (g) the tool set honors REQ-021 surface economy and
   REQ-413 action-discriminator consolidation — sibling-tool proliferation is a
   packaging defect; (h) every tool description fits the REQ-392 budget and states
   its ruleset scope. A violation is a
   packaging defect that SHALL be resolved before handoff.

5. **Re-verify per ruleset.** After loading the package into a host, run G2 (golden
   transcript) against the ruleset's fixture in the host, and run the Pattern Buffer
   sub-workflows S2–S9, S13–S14, S16, S18, S21, and S24–S27 against the loaded package
   — these are ruleset-specific and must re-verify. Run sub-workflows S1, S10–S12,
   S15, S17, S19–S20, and S22–S23 once — these are infrastructure and ruleset-agnostic.

6. **Run G8.** Execute the cross-ruleset isolation verification workflow (§8 G8)
   against the host with the package(s) loaded. A G8 failure SHALL block the build.

Unlike a merged server, packaging NEVER modifies the host: the base `holonovel`
server is installed unchanged, and packages are dropped into the install directory
(§7.6) for lazy hydration per REQ-390. After packaging, verify that the loaded host
reports per-ruleset metrics and `ruleset_prefix_map` via `spec_health`.

### 6.4.1 Prompt composition

Each server prompt is a user-role message composed at invocation time from
live state. The builder constructs prompts from these sources, in this order:

1. **Live index.** Counts and listings (available classes, races, spells,
   adventures, roster characters) are drawn from the running index — never
   hardcoded. A prompt whose source data changes regenerates on the next
   invocation.

2. **State snapshot.** Entity stats, NPC lists, countdown status, scene
   description, and Novel metadata are drawn from the current Novel state at
   invocation time.

3. **Registration surfaces.** Tool names, parameter hints, and category
   groupings are drawn from the live tool registry and the ruleset extraction
   model's action classifications (REQ-015).

4. **Badge-scoped guidance.** Foundations (REQ-062), anti-slop guidance
   (REQ-070), and supplementary synthesis (REQ-080) are included per the
   active badge's filter.

5. **Required contract elements.** Every prompt that carries a specification
    contract (intro pointer in `badge_briefing` per REQ-063, plain-English
    guidance sections and examples in `session_zero` per REQ-078, conversational
    wizard steps in `novel_setup` per REQ-089) includes
    those elements before any truncation. Standing Rule 10 applies — prompt
    bodies SHALL contain no tool names or technical syntax.

Prompts use the ruleset's own terminology for mechanics, tool names, and
categories — the builder does not invent terms. The prompt length budget
(REQ-118) applies to every prompt.

### 6.5 Verification and convergence

*Prepare:* Load files from `build-phase-map.md` Convergence row: 03-build.md §6.5,
02-requirements.md (all), 05-verification.md.

**Audit steps.** After each workflow completion and every two construction steps, the builder spawns a
subagent (fresh context) that audits the work against the requirements cited by that
step. Construction steps are audited in two batches: after Steps 1–3 (scaffold, index,
pipeline) and after Steps 4–6 (tools, state, prompts). The subagent reports findings;
the builder resolves each before the next batch.

**Context scoping.** Each build phase SHALL load only the files listed for
that phase in `build-phase-map.md`. When the builder operates across multiple
agent contexts, the builder SHOULD scope each phase to a separate context with
only its phase's files loaded, rather than retaining the full spec across all
phases. Context scoping is a recommendation — a single-context build is always
acceptable. The builder SHALL NOT gate or block on multi-context availability.

**Auditor pre-flight.** In `production` mode, before the first checkpoint audit
for a ruleset, and every 5 build sessions thereafter or when the spec version
changes, the builder seeds one deliberate
defect in its own output — a mislabeled anchor, a missing cross-reference, or an
extra tool name in a registry entry — and verifies the audit subagent catches
it. Subsequent build sessions for the same ruleset skip the pre-flight. A
subagent that misses a seeded defect is a process-compliance finding recorded
in DECISIONS.md (6); the subagent is re-prompted. Quick-mode builds skip the
pre-flight entirely.

**Convergence loop.** The builder converges in two sequential phases —
extraction quality, then construction quality. Each phase iterates up to 3
attempts per metric-targeted step. For each step, measure the metric, improve,
and verify. If the metric meets its threshold, record and stop. Thresholds are
tiered per REQ-100: Light (<100 indexed items), Standard (100–500), Heavy
(500–2000), Huge (2000+). No-delta detection (§6.5.1) applies independently to
each phase.

**Phase 1 — Extraction quality.**
Source-material quality: how completely the ruleset was read. Extraction
problems are source-material problems — they are diagnosed and dispositioned
before any server code is written.

| Domain               | Metric                              | Threshold     | Improvement step                         |
| -------------------- | ----------------------------------- | ------------- | ---------------------------------------- |
| Confidence           | Player-filtered HIGH + MEDIUM       | Light ≥85%, Standard ≥80%, Heavy ≥75%, Huge ≥70% | Re-extract, narrow scope, log as defect  |
| Extraction fidelity  | Cross-reference resolved citations  | 100%          | Re-extract, cite, or log finding         |
| Conversion fidelity  | Conversion output fidelity rate (per content type)| ≥ 90%         | Switch converter, re-run fidelity verification |
| Extraction completeness | Mechanical sections with ≥1 extraction / total mechanical sections | ≥ 95% | Re-read missed sections, re-extract |
| Category floor | Lowest per-category HIGH + MEDIUM across the 7 extraction categories | ≥ 50% | Re-extract weakest category, raise to ≥50%, or log operator-notified waiver |
| Cross-format consistency | Sampled items with MD/JSON agreement / 10 | 100% | Re-sample, resolve mismatches in defect log, re-verify |
| Reconciliation quality | Restated mechanics resolved to single canonical source / total restated mechanics | ≥ 90% | Re-resolve ties with additional evidence, or log `[authority-tie]` as accepted residual |
| Synthesis population | Modules with ≥1 ruleset-native item / 7 total modules; Wisdom items with Mechanical coupling nature / total Wisdom items | ≥4 populated; ≥30% Mechanical | Re-read source sections for barren modules per REQ-225 re-read mapping; re-classify Wisdom items from Navigational to Mechanical where ruleset text supports it |
| Synthesis term anchoring | Synthesis items referencing valid ruleset index terms / total synthesis items | ≥90% | Re-anchor or remove items with unresolvable ruleset references |
| Mechanical coupling population | Mechanical tools with coupling metadata / total mechanical tools; couplings ≥ 1 per 50 indexed items (floor 5, ceiling 50); Mechanical couplings ≥ 10% of total | Per REQ-378 | Re-read under-coupled sections, re-classify Navigational to Mechanical where ruleset text supports it |
| Archetype coverage | Property groups with ≥1 archetype per §7.7.0 / 30 total property groups | 100% | Re-read §7.7.0 definitions, reassign missing archetypes per coupling pattern rules |

Synthesis population, Synthesis term anchoring, and the Wisdom mechanical
coupling rate (REQ-375) are artifact-scope metrics — they verify the extracted
model and the ruleset-native synthesis manifest, not runtime enactment. Runtime
Wisdom content is the host's vendor manifest per §11.4.

**Regression gate.** After each metric-targeted improvement step completes (the
metric's pass/fail is measured), the builder SHALL re-measure metrics whose source
data overlaps with the changed step's domain. Confidence shares source data with
Extraction completeness and Category floor; Extraction fidelity shares with
Cross-format consistency; Synthesis population shares source data with Extraction
completeness; Archetype coverage shares source data with Synthesis population
(Wisdom items carry archetype-informed coupling nature) and Coupling derivation
(Phase 2 — the coupling table is derived from archetype pairs);
Reconciliation quality and Synthesis term anchoring are independent.
Mechanical coupling population shares source data with Extraction completeness
(mechanical tools populate both metrics).
The builder records the dependency map in DECISIONS.md (5) at Phase 1 start. If any
re-measured metric drops below its threshold, the
regression SHALL be recorded as a finding against the current step. The builder
SHALL resolve the regression before the current step can be marked complete, using
the current step's remaining iteration budget — no new budget is granted. A
regression that cannot be resolved within the remaining budget SHALL be recorded
as a residual gap for both the regressed metric and the current step's metric in
DECISIONS.md (5). This rule applies identically to Phase 1 and Phase 2. The
no-delta detection (§6.5.1) SHALL trigger independently for each metric: a stalled
step whose regression causes a second metric to stall SHALL log both stalls.

**Extraction completeness** measures coverage — whether every mechanical section
identified at intake produced at least one extracted item. A section is considered
extracted when it contributes at least one concept, entity, action, table, or
resolution entry to RULESET_MODEL.md. The denominator is the mechanical-section
count recorded during the viability pre-check (§6.2). Guidance-only sections are
excluded from both numerator and denominator. Completeness below 95% triggers
re-reading of the highest-priority missed sections (those with the most mechanical
indicators — procedures, tables, definition lists per §6.3).

**Per-category floor.** Mechanical categories (Concepts, Entities, Actions,
Tables, Resolution) must individually meet a minimum confidence floor of 50% HIGH +
MEDIUM. A mechanical category below 50% triggers a targeted re-extraction of that
category's source sections. Roles and Guidance categories below 30% record a
`[category-low-confidence]` finding in the defect log — informational, does not
trigger a re-extraction cycle unless the operator requests it. If re-extraction
cannot raise a mechanical category above 50%, the builder records a
`[category-confidence-block]` finding in DECISIONS.md (5) with: the affected
category, its current score, the sections contributing LOW items, and a
recommendation. The finding requires operator disposition (accept, reject, or
request targeted remediation) before Phase 1 exit.

**Archetype coverage** measures whether every Novel property group defined in §7.7
is classified with at least one Holodeck archetype. A group without an archetype
produces zero couplings — the Phase 2 Coupling derivation metric cannot detect
this gap because the cross-product excludes unclassified groups. Below 100%
triggers re-reading of §7.7.0 archetype definitions and reassignment per the
coupling pattern rules that govern each group's behavioral nature. Archetype
coverage shares source data with Synthesis population (Wisdom items carry
archetype-informed coupling nature) and Coupling derivation (Phase 2 — the
coupling table is derived from archetype pairs). A change to archetype
assignments SHALL trigger re-verification of both metrics.

Phase 1 exit: all eleven metrics meet threshold (conversion-fidelity conditional —
ten when conversion not selected, eleven when conversion selected), or an extraction stall
(no-delta on all metrics) triggers the unbuildable disposition check (§6.5.3).
An extraction stall after 3 iterations records residual gaps in DECISIONS.md
(5). The build does not proceed to Phase 2 until Phase 1 exits.

NOTE: Phase 1 row count varies with workflow selection. The conversion-fidelity
metric exists only when the Convert workflow (§6.2) was selected. When
conversion was not selected, the table contains ten metrics and the exit
condition is ten metrics meeting threshold.

**Ruleset-free convergence.** Phase 1 metrics are skipped per Standing Rule 9. The
builder records `ruleset-free — skipped` for each metric in DECISIONS.md (5). All
ten metrics are treated as met. No extraction stall applies — zero-case
dispositions are not a stall.

**Phase 2 — Construction quality.**
Builder implementation quality: whether the extracted model was faithfully
translated into tools, resources, and state.

| Domain               | Metric                              | Threshold     | Improvement step                         |
| -------------------- | ----------------------------------- | ------------- | ---------------------------------------- |
| MUST coverage        | Registered MUST tools / total MUST  | 100%          | Register missing tool or log REQ-013 waiver |
| Mechanics fidelity   | B.2 expected model excerpt verified | All items     | Re-extract, reclassify, or log defect    |
| Process compliance   | Pre-build answers present; verification workflow records present with timestamps after the most recent source-file modification | All present and fresh | Collect missing or re-run stale workflow, re-verify |
| Suggestion coverage  | Curated intents producing ≥1 match     | ≥ 80%         | Re-extract action patterns, review mapping |
| Surface terminology  | Deprecated term count in implementation — grep for each term in Appendix R | 0 | Rename in source, re-verify |
| Prompt health        | Stale reference count per prompt — sum of stale references across all registered prompts | 0 | Fix stale references in prompt source, re-verify |
| Resource URI completeness | Registered URIs matching REQ-022 catalog / total REQ-022 URI templates | 100% | Register missing URI, re-verify |
| Truncation accuracy        | Percentage of test cases where truncation fires within ±5% of the configured byte threshold and recovery pointers resolve correctly | 100% | Fix truncation threshold, repair output:// resolution |
| Narrative coherence  | Narrative-critical REQs implemented; smoke-session transcript embedded; badge_briefing narrative sections populated; G7 attestation present in DECISIONS.md (6) | Pass + G7 attestation present | Remediate missing narrative REQs, re-run smoke session |
| Coupling derivation | Pattern rules with ≥1 coupling row; coupling rows with matching archetype assignments; zero orphaned pattern rules | 100% | Add missing coupling rows for orphaned pattern rules; fix mismatched archetype assignments |

**Suggestion coverage constraint.** The curated intent set SHALL include at
minimum: one intent per extraction action category (classified during Discovery
per §6.3), one compound intent combining two categories, one ruleset-specific
edge case drawn from the ruleset's FAQ, errata, or corner-case examples (if the
ruleset provides them), and one player-narrative intent expected to produce an
empty result (no matching tool). If the ruleset provides no FAQ/errata material,
the edge-case slot SHALL be filled with a second compound intent. The set
composition SHALL be recorded in DECISIONS.md (4) alongside the coverage score.

**Prompt health** measures whether prompts contain references to tools or resources
that are no longer registered — a stale reference is a construction defect that
produces broken output at runtime. The metric uses the same stale-reference detection
defined in REQ-138. A single stale reference across any prompt fails the metric.

**Resource URI completeness** measures whether every URI template catalogued in
REQ-022 has a corresponding live registration. The metric uses the same presence
detection defined in REQ-139. An absent URI template is a construction defect.

Phase 2 exit: all ten metrics meet threshold (input-validation conditional —
eleven when REQ-141 is in scope, nine otherwise), or 3 iterations without
improvement. Residual gaps are logged in DECISIONS.md (5). For rulesets above
100 indexed items, verification continues with the scalable golden transcript
workflow (§8 G2 N-fixture path, verified by T90). The cross-model audit
(§6.5.2) and adjusted thresholds (§6.5.3) apply during Phase 2.
Cross-model auditing is RECOMMENDED during Phase 1 when multiple models are
available — different models detect different extraction defect classes —
but a single-model Phase 1 audit does not block handoff.

NOTE: Phase 2 row count varies with scope. The input-validation metric exists
only when REQ-141 is in scope. When REQ-141 is not in scope, the table contains
seven metrics and the exit condition is seven metrics meeting threshold.

**Ruleset-free Phase 2.** Per Standing Rule 9: MUST coverage is assessed against
REQ-020 infrastructure categories only — ruleset-derived MUST tools do not apply
and their absence is recorded as ruleset-free waivers. Mechanics fidelity and
suggestion coverage are skipped. Process compliance, surface terminology, prompt
health, resource URI completeness, and truncation accuracy operate identically
regardless of ruleset presence.

**Host-owned metrics.** Five convergence metrics measure the pre-built host's
implementation, not the ruleset package: Archetype coverage (Phase 1), Coupling
derivation, Resource URI completeness, Truncation accuracy, and Narrative
coherence (Phase 2). When a build consumes a pre-built `holonovel` host at a
pinned version (B10), the builder SHALL record each host-owned metric as
`host-verified — holonovel v<B10>` in DECISIONS.md (5), citing the host
package's CONVERGENCE.md results per REQ-245b, and SHALL NOT enter the
measurement/improvement loop for these metrics — the pre-built host cannot be
modified by the package builder, and their improvement steps (reassign
archetypes, add coupling rows, register URIs, fix truncation, remediate
narrative REQs) apply only when the builder owns the host. The host-verified
disposition requires the host's CONVERGENCE.md specification version to match
the current spec; when it does not, the builder records a
`[host-verification-pending]` finding in DECISIONS.md (5) and the affected
metric is dispositioned when the host advances (§6.7). Package-owned metrics —
MUST coverage, Mechanics fidelity, Process compliance, Suggestion coverage,
Surface terminology, Prompt health — always run fresh per §6.5.5 and REQ-244b.

### 6.5.1 No-delta detection

If a step produces zero measurable improvement from one iteration to the next
— the numeric metric is unchanged and no new findings are resolved — the
builder aborts that step after one stalled iteration and logs the reason in
DECISIONS.md (5). Remaining steps within the same phase continue independently.
A stalled step with no metric (process compliance) is declared stalled when it
is unsatisfied and no new verification workflow records are collected on the
repeated attempt.

### 6.5.2 Cross-model audit

In `production` mode, when the builder has access to more than one model, the
audit subagent must use a different model from the builder's primary model. A
cross-model audit surfaces defects that same-model audits miss. Different
models detect different defect classes; cross-model auditing increases
coverage. The builder detects cross-model availability; a single-model audit
is valid when only one model is available. A single-model build — where only
one model is available for both construction and audit — records a
`single-model-audit` annotation in DECISIONS.md (6). This annotation is
informational and does not block handoff; it alerts the operator that
same-model auditing may miss defect classes a cross-model audit would catch.
In `quick-build` mode, same-model audits are acceptable; the builder records a
`quick-build` annotation in DECISIONS.md (6) in place of any cross-model
requirement.

**REQ-299 — Cross-model audit sufficiency.** A cross-model audit SHALL
produce findings with REQ citations and specific discrepancies — not general
assessments — covering ≥3 extraction categories (REQ-210) and ≥2 Holodeck
archetype categories (§7.7.0), with ≥1 finding or an enumerated zero-finding
statement. An audit producing only "no issues found" SHALL be recorded as
`[insufficient]` and re-run. WHEN models disagree, the higher-confidence
extraction (REQ-011) is authoritative.
*Acceptance criterion:* Audit includes REQ-cited findings covering ≥3
extraction categories and ≥2 archetype categories, with ≥1 finding or an
enumerated zero-finding statement.
_Check:_ T343, T430.

### 6.5.3 Adjusted thresholds and unbuildable disposition

**Adjusted thresholds.** The builder may lower the confidence threshold specified in
the handoff verification workflow (§9 H10) for rulesets whose indexed-item count exceeds 200. The
adjusted threshold is documented in DECISIONS.md (5) with the complexity metric used
and the justification. The floor is 70%. The convergence loop enforces the chosen
threshold in the same iteration as the standard threshold. The core resolution
mechanic — the ruleset's primary dice/outcome procedure — must maintain at least
85% confidence independently. The builder SHALL identify the core resolution
mechanic by applying these criteria in order, stopping at the first that yields a
single candidate (see REQ-207): (a) the mechanic the ruleset's own introduction
or "how to play" section designates as the central resolution procedure; (b) the
mechanic cited by the most other sections in cross-references; (c) the mechanic
with the most distinct dice-roll invocations across the ruleset's examples of
play. The criterion used SHALL be recorded in DECISIONS.md (5) alongside the
identified mechanic. If criteria (a)-(c) produce a tie, the builder records all
tied candidates and flags an `[ambiguous-core-mechanic]` finding. If the core
mechanic falls below 85% after convergence (including any adjusted thresholds), the
builder records a `[core-mechanic-block]` finding in DECISIONS.md (5). The operator
is notified and may accept, reject, or request targeted re-extraction. The build does
not proceed past convergence without operator disposition of this finding.

**Unbuildable disposition.** A ruleset is declared unbuildable when either criterion
is met after convergence: (a) the core resolution mechanic carries confidence below
50%, or (b) more than 40% of mechanical sections carry LOW confidence. The builder
records the disposition in DECISIONS.md (5) with: the specific criterion triggered, a
summary of what could not be modeled, and a recommendation for source remediation
(conversion tuning, higher-quality Markdown, or selection of a different ruleset). An
unbuildable disposition stops the build — the operator may remediate the source and
restart or accept the disposition. This disposition is distinct from residual gaps: a
residual gap means the server works with known limitations; an unbuildable disposition
means the server cannot meet the Definition of Done.

**Post-write verification.** After every file write during construction and
verification, the builder re-reads the written file and verifies structural
integrity. In `production` mode: source code files receive full checks —
heading structure, path corruption, URLs, manifest completeness, and
terminology per (a)–(e) below. Artifact files (README.md, DECISIONS.md,
RULESET_MODEL.md, AGENTS.md) receive structural checks only — headings
present, non-empty, manifest entry exists. In `quick-build` mode: critical
files only — DECISIONS.md, MCP client configuration, and on-disk Novel state
file. Any discrepancy is a convergence finding and triggers a fix + re-read
iteration. (a) heading structure matches the plan; (b) no path corruption; (c)
URLs are syntactically valid; (d) completeness — file manifest checked; (e)
terminology — no deprecated term from Appendix R.

### 6.5.4 Finding taxonomy

Every convergence finding SHALL carry a standardized class prefix. The
taxonomy is: `[C-CONF]` confidence gap, `[C-XREF]` extraction fidelity,
`[C-CONV]` conversion fidelity, `[C-COMP]` extraction completeness, `[C-CAT]`
category floor, `[C-XFMT]` cross-format consistency, `[C-RECN]` reconciliation
quality, `[C-MUST]` MUST-coverage gap, `[C-MECH]` mechanics-fidelity
defect, `[C-PROC]` process-compliance omission, `[C-SUGG]` suggestion-coverage
gap, `[C-TERM]` surface terminology, `[C-PROMPT]` prompt health, `[C-URI]`
resource URI completeness, `[C-TRUNC]` truncation accuracy, `[C-INPUT]`
input-validation gap. The prefix enables cross-build pattern detection;
findings without a prefix are process-compliance defects.

### 6.5.5 Convergence result caching

Before Phase 1 measurement begins, the builder SHALL compute a convergence
cache key per REQ-244: ruleset content hash (REQ-044, sentinel `"none"` for
ruleset-free), specification content hash (REQ-187), holonovel package version
(B10), and aggregate hash of the `holonovel/narrative_world_model/` vendor directory. The builder SHALL
search DECISIONS.md (5) for a prior convergence recording whose cache key
matches.

When the key matches a prior successful convergence — all metrics met their
tiered thresholds and no residual gaps block handoff — the builder SHALL report
the following metrics as `cached — convergence fingerprint match` without
re-running the measurement/improvement iteration loop:

- **Phase 1 (all nine):** Confidence, Extraction fidelity, Conversion fidelity
  (when selected), Extraction completeness, Category floor, Cross-format
  consistency, Reconciliation quality, Synthesis population, Synthesis term
  anchoring.
- **Phase 2 (extraction-dependent):** Mechanics fidelity, Suggestion coverage.

The following metrics SHALL always run fresh regardless of cache-key match —
they measure builder implementation quality, not input stability, except host-owned
metrics dispositioned `host-verified` per §6.5:

- MUST coverage, Process compliance, Surface terminology, Prompt health,
  Resource URI completeness, Truncation accuracy.

The builder SHALL record the cache-key match and the list of skipped metrics
in DECISIONS.md (5) alongside the cache key. The cached-metric annotation is a
convergence event — it does not count as an iteration and does not consume the
3-attempt budget.

**Partial match.** When a single component of the cache key differs — the spec
version advanced but the ruleset hash, holonovel package version, and synthesis hash are
unchanged — the builder SHALL run Phase 1 metrics fresh (spec changes may alter
extraction rules) but MAY cache Phase 2 extraction-dependent metrics when the
extraction model is verified unchanged by a gap audit (§6.7). When the ruleset
hash changed but per-section hashes (REQ-302) reveal that only a subset of
sections were modified or added, the builder SHALL limit Phase 1 extraction to
the delta — unchanged sections reference their prior extraction output per
REQ-302. A partial-match
annotation in DECISIONS.md (5) SHALL name which component differed and which
metrics were cached.

**Operator override.** The `--no-cache` flag at intake bypasses all caching and
forces the full convergence loop. Non-interactive runs use the cache by default.
A cold checkout — no prior DECISIONS.md (5) from which to retrieve a cache key
— runs the full convergence loop.

**Ruleset-free builds.** When Phase 1 is skipped per Standing Rule 9, the
convergence cache key is computed for Phase 2 caching only. Ruleset-free Phase 2
extraction-dependent metrics (mechanics fidelity, suggestion coverage) are also
skipped per Standing Rule 9 — the cache key covers the remaining fresh-metric
domain (MUST coverage against infrastructure categories, process compliance,
surface terminology, prompt health, resource URI completeness, truncation
accuracy). For ruleset-free builds consuming a specific holonovel package version,
the holonovel convergence manifest (REQ-245) takes precedence over the convergence
cache key for Phase 2 metrics — the manifest provides pre-computed results.

### 6.6 The Pattern Buffer

*Prepare:* Load files from `build-phase-map.md` Ruleset Pattern Buffer row: 03-build.md §6.6,
05-verification.md, 06-artifacts.md.

**Timing.** After Phase 2 of the convergence loop (§6.5) has converged and the
ruleset-facing verification workflows (§8: G0b and G4) have passed, the
builder runs the Pattern Buffer. Fixture workflows (G2 and G3 — see §8) are
specification-level checks run once per builder implementation; they are
independent of Pattern Buffer timing. The Pattern Buffer exercises the built server with
AI-simulated badges. In realistic play scenarios. It is a required quality
check. Its purpose is to surface bugs that structured verification missed.

**Convergence handshake.** After each Pattern Buffer execution, the builder maps
every failure to the convergence-loop metric it affects per REQ-208. The builder then
re-enters Phase 2 of the convergence loop (§6.5) for only those metrics,
corrects the root cause, and re-runs the Pattern Buffer — up to 2 Pattern Buffer
iterations total. Each Pattern Buffer-triggered re-entry receives a fresh 3-attempt
budget for the affected metric, independent of any previous Phase 2 iterations
for that metric. The re-entry budget is recorded in DECISIONS.md (6) alongside
the failure mapping. The re-entry's no-delta detection (§6.5.1) applies
independently within the re-entry budget. If a metric that converged in Phase 2
is re-entered via Pattern Buffer and fails to re-converge within its re-entry budget,
the builder records the residual gap in DECISIONS.md (5) and proceeds — the
original convergence is not invalidated, but the Pattern Buffer-surfaced defect
persists as a known limitation. The mapping is recorded in DECISIONS.md (6) alongside each
failure artifact. A Pattern Buffer failure that maps to no convergence metric under
REQ-208 is logged as a process-compliance finding. The builder traces the root cause: if the
failure originates from an extraction defect (a misread rule, a miscategorized
action, a missing conceptual term), the builder records the specific Phase 1
metric affected and re-enters Phase 1 for only that metric's domain — following
the same per-metric re-entry model as Phase 2 failures. Extraction-rooted
Pattern Buffer failures that re-enter Phase 1 count against the Phase 1 iteration
budget (3 attempts per metric-targeted step) independently of Phase 2 budgets.
If the root cause is a construction defect that maps to no existing Phase 2
metric, the builder re-enters Phase 2 with all metrics in scope and records the
novel defect class in DECISIONS.md (6) with a proposed metric mapping for
future builds.

**Independent invocation.** The Pattern Buffer must also be re-run whenever server source
code changes — after Synthesize, after every spec-driven update (REQ-098),
and after any manual code modification. A previously-passing blocking sub-workflow that now
fails is a defect. Pattern Buffer results are recorded in DECISIONS.md (6).

**Convergence-loop-driven scoping.** When the convergence loop (§6.5) exits with all
metrics within their tiered thresholds and the ruleset content hash (REQ-044)
matches the prior build, the subsequent Pattern Buffer run SHALL skip
mechanics-fidelity sub-workflows — those whose failures would be
extraction-dependent: S2 (character creation), S3 (encounter setup), S4
(simulated combat), S7 (table generation), S8 (search and canonical lookup), and
S9 (condition lifecycle). Each skipped sub-workflow is recorded as
`skipped — ruleset hash unchanged` in DECISIONS.md (6). Infrastructure
sub-workflows — all others (S1, S5, S6, S10–S33) — always execute, as they
verify runtime contracts independent of extraction quality. This scoping applies
to both the initial build-time Pattern Buffer and subsequent re-runs after synthesis
or spec-driven updates. The operator MAY override with `--full-pattern-buffer` to force
all sub-workflows.

**Workflow completion.** The Build workflow is not complete until the Pattern Buffer
exits with all Pattern Buffer sub-workflows passing or the builder records 2
iterations without improvement (see Exit criteria below), and both
ruleset-facing verification workflows (G0b and G4) pass. The Pattern Buffer
gates both `production` and `quick-build` builds — any build that creates or modifies
tools must pass the Pattern Buffer before marking complete. In `production` mode
the build additionally requires the assumption audit (REQ-101), the audit steps
with auditor pre-flight (§6.5), full post-write verification on every file
(§6.5), and cross-model auditing when available (§6.5.2). These are optional in
`quick-build` mode; a quick-build-mode build records a `quick-build` annotation in
DECISIONS.md (6) listing which rituals were skipped and is not handoff-ready.
Marking a workflow complete without a passing Pattern Buffer is a process defect. The
Pattern Buffer findings and pass/fail disposition are recorded in DECISIONS.md (6).

**Method.** The builder starts up to two MCP client connections to the same server process
sharing one `TTRPG_DATA_DIR`. Sub-workflows exercising cross-badge interaction
(S6, S14h, S17, S23, S26) use one connection for the Game Master badge and one for the Player badge.
All other sub-workflows use a single connection switching badges as needed.
Both connections target the same Novel via `TTRPG_NOVEL`. The builder interleaves
calls between the two connections when simulating cross-badge turn-taking. Every scenario
states its objective, the tool calls to make, which badge calls each, and the pass
criterion.

**Verification principle.** Pattern Buffer sub-workflows verify state through tool-observable
surfaces — `character (action: sheet)`, `session (action: recap)`, `spec_health`, `badge_briefing`,
tool output — where the same assertion can be expressed through a tool call. The
on-disk state format is tested by verification workflow G4 (Appendix F derived tests, T72/T77) and
is an implementation detail. A Pattern Buffer sub-workflow that reads raw state files to
verify behavior observable through tools will become stale when the state model
changes during a spec-driven update (REQ-098). Direct file reads remain valid in
S17 (file removal) and S15 (corruption) where the pass criterion is a
file-system-level assertion.

**Pattern Buffer sub-workflows.** The builder must execute all sub-workflows. A sub-workflow passes when every
assertion in its pass criterion holds. A failure is recorded as a finding in
DECISIONS.md (6).

**Failure artifacts.** When a sub-workflow fails, the builder records in DECISIONS.md (6):
(i) the specific assertion that failed, with expected and actual values; (ii) the
full tool request and response that triggered the failure; (iii) a server state
snapshot captured immediately after the failure; (iv) a diagnostic trail showing the
narrowing steps taken to identify the root cause. A finding that omits any of these
four items is incomplete and blocks handoff.

1. **Tool surface sweep** — call one read-only tool from each REQ-015 category not
   exercised by another blocking sub-workflow, plus all Novel-lifecycle and
   badge-management tools. Each call uses valid input; additionally,
   call each with an invalid input (empty string, missing
   required param) and assert `[INVALID_INPUT]` or `[MISSING_PARAM]` response without
   crash. (Blocking.)
2. **Character creation workflow** — step-by-step and quick creation; correct derived
   stats; roster import; undo restores pre-creation state; no active Novel →
   `[STATE_CONFLICT]`. (Blocking.)
3. **Encounter setup** — combat init with entities and dangers reports round counter, turn order, participant classification.
4. **Simulated combat session** — turn resolution, HP tracking, condition effects, round
   advancement over ≥3 rounds with deterministic seeds. Verify roll transparency per
   REQ-003: a d20 attack with advantage reports both faces and selected/discarded
   faces, source-attributed modifiers, and result band. Undo one combat action and
   verify state restored to pre-action snapshot. Same seed → identical combat sequence.
   (Blocking.)
5. **Combat state survival** — HP, conditions, round counter, turn order restored identically
   after restart (verified through tool-observable surfaces). (Blocking.)
6. **Cross-badge boundary enforcement** — GM-only tools blocked from Player; no GM-only content leaks. (Blocking.)
7. **Table generation sweep** — every generation table produces valid ruleset results; GM-only tables blocked from Player.
8. **Search and canonical lookup** — exact/prefix/substring search returns correct sections;
   canonical lookups resolve by name and aliases; source quoting present; NOT_FOUND with
   enumeration.
9. **Condition lifecycle** — conditions apply, affect mechanics, expire by ruleset triggers; manual removal works.
10. **Undo during combat** — merged into S4. Undo combat action and
    determinism assertions are validated within the simulated combat session.
11. **Workflow cancellation** — merged into S20. Workflow cancel, state
    restore, and pending-workflow drain are validated within the workflow
    validation sub-workflow.
12. **Roster durability** — roster baselines immutable; re-import produces fresh copy matching baseline. (Blocking.)
13. **Novel isolation** — entities, adventures, generated content do not leak between Novels.
14. **Edge cases** — (a) moved to S1 (invalid params validated per category);
    (b) 0 HP triggers ruleset outcome; (c) heal above max
    caps at max; (d) 5 rapid calls complete without timeout/corruption; (e) ambiguous
    alias → `[AMBIGUOUS]` with entries enumerated; (f) unknown decision → `[NOT_FOUND]`
    with valid IDs; (g) same seed → identical results, different seeds differ
    (Blocking — verified in S4); (h) `spec_health` under Player badge returns only
    player-filtered metrics (Blocking — verified in S17);
    (i) adversarial input: `scene (action: set)` with SQL-injection string stores and
    echoes verbatim; no behavior change, no crash per REQ-054.
15. **Stress and recovery** — (a) two connections sharing one data directory: reads reflect
    latest writes, no stale reads/write conflicts/deadlocks; (b) corrupted state file →
    `[WARNING]` in `spec_health` enumerating corrupted Novel, no crash, uncorrupted
    Novels/roster continue working; (c) 10 rapid `set_badge` alternations → no lost state
    or crash after final switch; (d) 50-round combat with 2 entities + 2 dangers using
    deterministic seeds → round counter reaches 50, conditions persist, `session (action: recap)`
    summarizes all rounds, memory hasn't doubled. (Blocking.)
16. **Narrative state** — scene, NPC, countdown, lore, and briefing tools work end to end with deterministic seeds.
17. **Novel lifecycle and persistence** — create/resume/end/switch cycle works; state persists
    to disk and restores; `novel (action: end)` confirmation workflow removes file + backup; ended
    Novel blocks resume and switch. (Blocking.)
18. **Adventure generation and encounter lifecycle** — `adventure (action: generate)` produces Novel-scoped,
    badge-filtered, searchable content; regeneration replaces prior; `adventure (action: generate_encounter)`
    produces batch state (scene + NPC + lore) as single undo target; setup metadata
    tracks completion. Generated and indexed adventures coexist in `badge_briefing`.
19. **Badge briefing correctness** — populated Novel: Player sees entity stats without
    confidence breakdowns/GM-only lore; GM sees all content; briefing adapts to scene type
    changes. Verify badge foundations (REQ-062) and anti-slop guidance (REQ-070)
    sections present and badge-filtered. (Blocking.)
20. **Lorebook interchange** — export → modify → import dry-run (no side effects) → import
    merge (entry restored) → re-export matches original; import replace overwrites. (Blocking.)
21. **Campaign endurance** — 2 entities, 3 NPCs, 2 countdowns, 3 lore entries across 30
    combat rounds in 3 confrontations: all lore still triggers, ≥100 audit-log entries,
    verify audit log hash chain integrity per REQ-040 (consecutive entries form valid
    chain), `session (action: recap)` returns correct final state, memory hasn't doubled,
    Novel file ≤5 MB. (Blocking.)
22. **Workflow validation** — `[NEED_INPUT]`: unknown decision/option → `[NOT_FOUND]` with
    enumeration; cancel restores pre-workflow state; second workflow → `[STATE_CONFLICT]`;
    undo/redo/set_badge blocked during pending workflow; valid option drains workflow; pending
    workflow survives server restart. (Blocking.)
23. **Narrative features sweep** — exercise the narrative tool surface end to end:
    `novel (action: save_context)` / `novel (action: get_context)` round-trip with auto-captured faction
    clocks, countdown positions, NPC dispositions, and entity relationships;
    `novel (action: end)` clears gm_context; `faction (action: create)` with faction-type countdown,
    `faction://` resource, `countdown (action: advance)` coupling, scene transition advances
    faction clock, `faction (action: remove)` removes clock; `lore (action: set_secret)` / `lore (action: reveal)` /
    `lore (action: knowledge)` cycle with character (action: sheet) "Known Information" section;
    `scene (action: choices)` with `[NEED_INPUT]` workflow, `respond` resolution, `[choice]`
    audit tag, countdown and faction clock coupling on resolved id; `relationship (action: set)`
    / `relationship (action: get)` cycle, character (action: sheet) shows "Relationships" section,
    relationship change between `ally` and `rival` prompts lore entry in
    `badge_briefing`; `note (action: set)` / `note (action: list)` / `notes://<key>` round-trip, Player badge
    excluded from notes content. Verify clock taxonomy: `racing` clock pair resolves
    correctly (first to full wins), `linked` clock chain triggers child on parent
    completion, `tug_of_war` retreated to zero does not trigger, `mission` clock
    decrements on `novel (action: resume)`. All mutations appear in audit log and
    `session (action: recap)`. (Blocking.)
24. **Session segmentation and audit compaction** — two sessions with different
    `TTRPG_SESSION_ID` values: assert two `[session-boundary]` markers in audit log
    with session IDs and timestamps; `session (action: recap, session_id="s1")` returns only s1
    entries; `session (action: recap, session_id="s2")` returns only s2 entries; `session (action: recap)`
    returns all entries; `spec_health` reports per-session metrics array. With
    `TTRPG_AUDIT_RETENTION_SESSIONS=1`, `session (action: compress)` prompts `[NEED_INPUT]`
    confirmation; on confirm, session 1 entries removed from live log,
    `audit://novel/archive` returns session 1 summary; `session (action: recap, session_id="s1")`
    returns the summary from archive; `session (action: recap)` returns only session 2 entries.
    Player badge `session (action: compress)` returns `[FORBIDDEN]`. (Non-blocking.)
25. **State durability: backups, checkpoints, clones** — with
    `TTRPG_NOVEL_BACKUP_COUNT=3`, after 10 mutations assert three rotated backup
    files; corrupt primary and `.bak.1` — restart, assert restore from `.bak.2` with
    `[restored-from-backup]` audit entry; `novel (action: end)` removes all backups.
    `novel (action: checkpoint_set, "a")` → 5 mutations → `novel (action: checkpoint_restore, "a")` with `[NEED_INPUT]`
    confirm → assert all 5 mutations reversed; `novel (action: checkpoint_remove)` removes entry;
    `TTRPG_MAX_CHECKPOINTS=1` overflow discards oldest; checkpoint survives restart
    and Novel switch; `novel (action: export, json, include_checkpoints=true)` includes
    checkpoints key; Player badge returns `[FORBIDDEN]`. `novel (action: clone, "src", "dst")`
    creates independent Novel; mutating clone does not affect source; duplicate slug
    returns `[STATE_CONFLICT]`; `trim_audit_sessions=2` retains only 2 most recent
    sessions; Player badge returns `[FORBIDDEN]`. (Blocking.)
26. **Narrative POV** — import two entities; `character (action: set_active, "char_01")` — assert
    `badge_briefing` includes POV directive naming char_01 with narrative instruction
    and personality fields; `character (action: set_active, "char_02")` — assert directive updates
    to char_02. `character (action: set_active, "char_01", pov="omniscient")` — assert
    `badge_briefing` shows "POV: none — narration is omniscient" with char_01 still
    active; `character (action: set_active, "char_02")` preserves omniscient mode;
    `character (action: set_active, "char_02", pov="character")` switches to character-locked POV
    for char_02. POV mode persists across server restart. POV directive is never
    truncated under a tight briefing budget (REQ-135 tier 1). (Blocking.)
27. **Synthesis lifecycle with Wisdom mechanical enactment** — requires
    synthesis to have been run. Assert `synthesis://status` reports active
    modules with per-module item counts. Deactivate a module via
    `synthesis (action: toggle, module_name, false)` — assert items from that module
    absent from synthesis surfaces. Reactivate — assert items return.
    `synthesis (action: revert)` — assert community synthesis items removed, ruleset-native
    items (`[ruleset]` tag) preserved, `synthesis://status` reports zero community
    items. Assert `badge_briefing` synthesis content follows activation state: active
    modules' content appears, deactivated modules' content absent. Entity
    `voice_examples` carrying `[supplementary]` tag with source URL confirm synthesis
    sourcing. After synthesis is active: create a Novel, import an entity. Create an
    NPC — assert `character (action: sheet)` renders voice_examples, goals, and personality
    patterns without manual `character (action: voice)`/`character (action: personality)` (P6). Create a
    countdown — assert it advances on `scene (action: set)` (P7). Call
    `command (action: suggest, "spring a trap on the goblins")` — assert constraint override from
    Wisdom appears in results (P10). Deactivate the relevant Wisdom item — assert
    mechanical behavior suppressed. Reactivate — assert restored. (Blocking.)
28. **Briefing ordering, voice examples, session notation** —
    `session (action: briefing_order, ["scene", "entities", "lore"])` — assert `badge_briefing`
    sections in that order; unknown token returns `[INVALID_INPUT]` with valid tokens
    enumerated; `session (action: briefing_order, [])` resets to builder defaults.
    `character (action: voice, entity_id, [{context:"greeting", dialogue:"Hello",
    tag:"formal"}])` — assert `entity://<id>/voice_examples` returns examples;
    `entity://<id>/personality` reflects `character (action: personality)` fields.
    `session (action: recap, format="lonelog")` — assert output in Lonelog notation (`###` scene
    headers, `@` actions, `=>` outcomes); `session (action: compress, format="lonelog")` —
    assert compressed Lonelog entries. (Non-blocking.)
29. **Novel export/import cycle** — `novel (action: export, "json")` → `novel (action: import, data,
    "dry-run")` reports changes without side effects → `novel (action: import, data, "replace")`
    restores exported state → re-`novel (action: export, "json")` matches original.
    `novel (action: export, "json", "lore")` produces lore-only payload. `novel (action: import, data,
    "dry-run", strict=true)` with broken references reports all failures and blocks
    import. Assert `command (action: suggest, "attack the goblin")` returns at least one
    combat-category tool with registered name and REQ-015 classification. (Blocking.)
30. **Supplementary ruleset import** — call `import_supplementary` with the Appendix Z
    fixture. Assert `tools/list` includes `lookup_spell("frostbite")` and
    `lookup_monster("ice_wraith")` annotated with supplementary slug. Invoke
    `lookup_spell("frostbite")` — assert `[OK]` with response prefix, error taxonomy,
    and source quoting per REQ-001, REQ-002, REQ-061. Assert Wisdom items appear in
    `synthesis (action: list)` with source anchor. Assert `badge_briefing`
    `narrative_threads` includes countdown-pacing advisory without manual activation
    (P7 coupling). Call `remove_supplementary` — assert tools absent from
    `tools/list`, Wisdom items removed. End Novel and resume — assert supplementary
    re-resolved. Move the fixture file — assert `[supplementary-gap]` in
    `spec_health`, remaining content with `[partial]` marker. Player badge
    `import_supplementary` returns `[FORBIDDEN]`. (Blocking.)
31. **Dynamic tool registration** — call `import_supplementary` with Appendix Z.
    Assert `tools/list` includes supplementary tools. Invoke a supplementary-derived
    tool — assert conforms to REQ-001, REQ-002, REQ-003, REQ-061. Call
    `remove_supplementary` — assert tools deregistered, tool invocation returns
    tool-not-found at MCP layer. Build with a stack that recorded a dynamic-tool
    waiver — assert only Wisdom imported, no new tools. (Blocking.)
32. **Coupling chain exercise** — populate world model with 3 connected rooms. Set
    scene in room A with beat "setup". Create countdown with
    `world_effect {type:"describe"}` and faction with goal — verify faction countdown
    auto-created (P4). Advance scene — assert countdown ticks and faction clock ticks
    (P1). Move player via `go` command — assert scene transition hook fires and lore
    trigger keywords match against new room (P13, P2). Advance countdown to fire —
    assert `world_effect` mutates room description (P14). Set scene in changed room —
    assert `badge_briefing` reflects all state changes. Create `consequence` journal
    entry — assert faction clock advisory in `narrative_threads` (P33). Undo — assert
    pre-chain state restored. (Blocking.)
33. **Wisdom mechanical enactment** — build with synthesis active on all 7 modules.
    Create entity and NPC while Wisdom is active — assert NPC `character (action: sheet)` shows
    auto-populated voice_examples with `[vendor]` tag, goals from Wisdom patterns,
    personality without manual `character (action: personality)`/`character (action: voice)` calls (P6).
    Create countdown — assert `countdown (action: advance)` auto-applies on `scene (action: set)`, 1
    tick per transition (P7). Call `command (action: suggest, "negotiate with the guard")` —
    assert Wisdom constraint overrides appear (P10). Deactivate individual Wisdom
    items — assert corresponding mechanical behavior stops. Reactivate items — assert
    behavior resumes. Assert Wisdom-derived entities render with REQ-371-conformant
    behavior: first-class server mechanics, not advisory guidance. (Blocking.)
34. **Entity-bearing chain exercise** — create two NPCs sharing a scene. Assert
    relationship is auto-created between them (P24). Create a secret with text
    overlapping one NPC's name — assert `suspicious` relationship advisory in
    `narrative_threads` (P25). Flip relationship from `ally` to `rival` — assert
    lore-entry creation prompt in `badge_briefing` (P26). Advance through 3
    combat rounds with both NPCs present — assert NPC memory facts accumulated and
    disposition updates reflected (P27). End Novel — resume — assert memory facts
    and dispositions restored. (Non-blocking.)
35. **Narrative architecture chain exercise** — create countdown with
    `on_scene_transition`. Advance scene three times — assert countdown at 2
    remaining (P1). Set scene to fire the countdown while player entity absent —
    assert `[discovered]` consequence in story journal (P31) and `knowledge_state`
    populated with countdown name and consequence text (P28). Create pacing signal
    via rapid scene transitions — assert every faction clock receives autonomous
    tick (P29). Create goal-carrying NPC — assert World in Motion suggestion in
    `badge_briefing` on pacing signal (P30). (Non-blocking.)
36. **Decision chain exercise** — create vow via `vow (action: set)`. Assert coupled
    countdown auto-created (P4). Call `scene (action: choices, "Investigate the gate",
    [{id:"investigate_gate", label:"Check the gate"}])` with `id` matching vow
    scope — assert vow countdown advances one tick (P12). Call `vow (action: milestone)`
    — assert both vow progress and countdown advance. Declare goal on NPC with
    text >20 chars — assert vow-creation suggestion in `narrative_threads` (P20).
    Call `vow (action: forsake)` — assert coupled countdown removed. (Non-blocking.)

**REQ-108a — Pattern Buffer traceability (Part a).**
Pattern Buffer sub-workflow exercises each requirement in §5.5 (Badges and Access), §5.6 (State, Lifecycle, Entities, and Adventure Content), §5.7 (Determinism, Safety, and Performance), §5.8 (Synthesis, Lore, and Macros), §5.10 (World-Model Layer), §5.12 (Narrative Architecture), §5.13 (Holodeck), and the error contracts of REQ-002 (Error taxonomy). The builder records a sub-workflow-to-REQ mapping in DECISIONS.md (6) — one entry per covered REQ, naming the sub-workflow(s) that exercise it. When a REQ in these sections changes during a spec-driven update (REQ-098), the builder re-examines every sub-workflow mapped to it.

**REQ-108b — Pattern Buffer traceability (Part b).**
Gaps — a REQ in the covered sections with no mapped sub-workflow — are logged as process-compliance findings and must be resolved before handoff. New REQs added to the covered sections during a spec revision require the builder to propose at least one new Pattern Buffer sub-workflow exercising their contract; the proposal is a finding, not a blocker. _Check:_ T107.
**REQ-141a — Input-validation convergence metric (Part a).**
The convergence handshake in §6.6 must map Pattern Buffer failures to four convergence metrics, adding "input-validation gap" to the existing three (MUST-coverage gap, mechanics-fidelity defect, process-compliance omission). A sub-workflow failure attributable to incorrect input handling — malformed parameters accepted without error, valid inputs rejected, error categories misclassified, or corrective-action text missing — maps to the input-validation metric. The builder re-enters Phase 2 of the convergence loop (§6.5) for only the affected metric.

**REQ-141b — Input-validation convergence metric (Part b).**
A failure that maps to no metric is a novel defect class and re-enters Phase 2 with all four metrics in scope. An input-validation failure is recorded in DECISIONS.md (6) with the failing input value, the error category returned (or absent), and the expected error category per REQ-002. This metric covers Pattern Buffer sub-workflow S14 (Edge cases) and any other sub-workflow exercising REQ-001 (Response contract) or REQ-002 (Error taxonomy) through their input contracts. _Check:_ T163.

**REQ-141c — Input-validation convergence metric (Part c).**
A single S21 execution that exceeds 10 minutes of wall-clock time does not fail the sub-workflow but is recorded with the actual duration. Three consecutive S21 runs exceeding the budget trigger a scope re-evaluation recorded in DECISIONS.md (5). **Per-scenario budget.** Each sub-workflow must complete within 5 minutes of wall-clock time, except S13 (10 minutes), S21 (10 minutes), S25 (10 minutes), S22 (3 minutes), and S26 (3 minutes). A sub-workflow exceeding its individual budget does not fail but is recorded with actual duration in DECISIONS.md (6).

**REQ-141d — Input-validation convergence metric (Part d).**
Three consecutive runs of the same sub-workflow exceeding its budget trigger a scope re-evaluation recorded in DECISIONS.md (5). **Global budget.** The full Pattern Buffer run of all sub-workflows must complete within 60 minutes of wall-clock time. A run exceeding the budget is recorded with actual duration and per-sub-workflow timings in DECISIONS.md (6).

**REQ-141e — Input-validation convergence metric (Part e).**
The operator may increase the budget for rulesets exceeding 2,000 indexed items (REQ-100 Huge tier). **Structured encoding.** For mechanical consumption the builder encodes each sub-workflow as a structured record (`scenario_id`, `objective`, `blocking`, `steps`). The prose descriptions above are canonical; the structured encoding is a lossless transcription. The structured encoding SHALL be accompanied by a single runnable test harness (`scripts/run_pattern_buffer.ts`) that reads the encoded sub-workflow records and executes each against the live MCP server.

**REQ-141f — Input-validation convergence metric (Part f).**
The harness SHALL: (a) start the server process, (b) execute each sub-workflow's steps sequentially, (c) assert each pass criterion against tool-observable surfaces, (d) record pass/fail with failure artifacts per the Failure artifacts contract, and (e) exit zero when all sub-workflows pass or record non-blocking failures per the Exit criteria. The harness enables operator re-execution of the full Pattern Buffer without AI builder reasoning — re-runs after synthesis, after spec-driven updates, or after code changes consume zero AI tokens.

**REQ-141g — Input-validation convergence metric (Part g).**
The harness output SHALL include the Pattern Buffer execution timestamp and per-sub-workflow verdicts with failure details when applicable. The harness is recorded as a handoff artifact (§9 H13a). **Convergence integration.** The convergence handshake (see Timing block above) governs the Pattern Buffer ↔ Phase 2 feedback loop. **Improvement** is measured per iteration: fewer total assertion failures, or at least one blocking sub-workflow downgraded to non-blocking.

**REQ-141h — Input-validation convergence metric (Part h).**
Two stalled iterations is a stop; residual failures are logged in DECISIONS.md (5). **Regression assertions.** A bug discovered via Pattern Buffer failure and fixed via convergence gets at least one new regression assertion recorded in DECISIONS.md (6). **Assertion compression.** After spec-driven updates or five Pattern Buffer iterations, audit accumulated regression assertions for redundancy. Subsumed assertions are removed and logged in DECISIONS.md (6) with the subsuming citation. **Exit criteria.** The Pattern Buffer completes when all sub-workflows pass and all blocking failures are resolved.

**REQ-141i — Input-validation convergence metric (Part i).**
Failures in sub-workflows 1, 2, 4, 5, 6, 12, 13, 15, 19, 20, 21, 22, 23, 25, 26, 29, 30, and 31 are blocking — Build is incomplete until they pass. Other failures are accepted limitations after 2 stalled iterations, logged in DECISIONS.md (5). All failures are recorded with severity classification and diagnostic trail. A build with more than 3 unresolved non-blocking Pattern Buffer failures SHALL not be declared handoff-ready without explicit operator acknowledgment. The count of unresolved non-blocking failures SHALL be recorded in DECISIONS.md (5) alongside a per-failure severity assessment.

**REQ-141j — Input-validation convergence metric (Part j).**
The operator may override this ceiling by recording an acceptance entry in DECISIONS.md (5). This rule applies at handoff verification time (§9 H13) — non-blocking failures accumulated and logged during the build process are re-counted at handoff.
**REQ-142a — Blocking classification principle (Part a).**
A Pattern Buffer sub-workflow is classified as blocking when it exercises a correctness property whose failure would make the server unsafe to use in any play session — state loss, badge-boundary violation, data corruption, unrecoverable crash, or undetectable incorrect results in core play mechanics. A sub-workflow is non-blocking when it tests a property whose failure degrades experience but does not make the server unsafe — graceful-degradation edge cases, cosmetic output issues, or features documented as deferred in DECISIONS.md (5).

**REQ-142b — Blocking classification principle (Part b).**
The blocking classification of every sub-workflow is recorded in DECISIONS.md (6) with the safety property it protects and the REQ(s) it derives that classification from. When a new sub-workflow is added, the builder classifies it against this principle and records the rationale. When a sub-workflow's classification changes, the builder records the trigger — a spec revision, a discovered defect class, or an operator override. _Check:_ T164.
**REQ-208a — Pattern Buffer convergence metric mapping (Part a).**
The builder SHALL classify each Pattern Buffer failure by applying these rules: a failure from a missing tool or resource maps to MUST-coverage; a failure from incorrect tool output or behavior maps to mechanics-fidelity; a failure from missing or stale pre-build answers or verification records maps to process-compliance; a failure from incorrect input handling maps to input-validation (REQ-141). When a failure matches multiple rules, the most specific rule applies. The classification rule applied SHALL be recorded alongside each mapping in DECISIONS.md (6).

**REQ-208b — Pattern Buffer convergence metric mapping (Part b).**
A Pattern Buffer failure that maps to no convergence metric under these rules is logged as a process-compliance finding — the builder records the novel defect class in DECISIONS.md (6) with a proposed metric mapping for future builds. _Check:_ T250.

### Surface-to-scenario mapping

During spec-driven updates (REQ-098), the builder
selects Pattern Buffer sub-workflows based on which surfaces changed — not the blanket
set. The gap audit identifies the changed tools, resources, and prompts; the
builder maps each to scenarios via the table below. A sub-workflow is selected when
any surface it exercises appears in the gap audit's implemented-disposition rows.
S1 is always selected when new tools are added or existing tool signatures changed.

| Changed surface                                             | Pattern Buffer scenarios selected |
|-------------------------------------------------------------|-----------------------------|
| Character creation, roster, workflows (REQ-042, REQ-056, REQ-104) | S2, S12, S22 |
| Combat lifecycle, initiative, dangers (REQ-043)             | S3, S4, S5 |
| Conditions, condition management (REQ-206, REQ-217)         | S9 |
| Search, canonical lookups (REQ-057, REQ-060, REQ-061)      | S8 |
| Table generation                                            | S7 |
| Badge gating, badge briefing, entity scope (REQ-032, §5.5)     | S6, S14h, S19 |
| Undo, redo, snapshots (REQ-041, REQ-116)                   | S4, S22 |
| State model, Novel persistence (REQ-065, REQ-092)          | S5, S12, S13, S14 |
| Novel lifecycle (create/resume/end/switch)                  | S15 |
| Lore, synthesis, adventure generation                     | S18, S20 |
| New tool added or tool signature changed                    | S1 + category-mapped scenarios |
| New prompt, resource, or badge-scoped content                 | S6, S19 + content-specific |
| Error taxonomy, input validation (REQ-001, REQ-002)        | S14 |
| Campaign endurance, stress (REQ-052)                        | S13, S21 |
| Pause/resume, factions, player choices, relationships, secrets, notes, clock types | S23 |
| Session segmentation, audit compaction                      | S24 |
| Backup rotation, checkpoints, clone novel                   | S25 |
| Narrative POV (REQ-220, REQ-223)                            | S26 |
| Synthesis lifecycle, status, toggles                       | S27 (T429) |
| Briefing ordering, voice examples, session notation         | S28 |
| Novel export/import, action suggestions (REQ-084)           | S29, S1 |
| Supplementary ruleset import, dynamic tool registration      | S30, S31 |
| Coupling cascade (P1+P13+P14+P2+P33 chain)                    | S32 (T427) |
| Wisdom mechanical enactment (REQ-371, P6+P7+P10)              | S33 |

This surface-driven selection applies to all incremental updates — full
spec-driven updates (§6.7) and synthesis re-runs (§11) — not only the blanket Pattern Buffer run.

**Cascade-aware scoping.** When the surface-to-scenario mapping selects
sub-workflows for a changed surface, the builder SHALL also select sub-workflows
that exercise coupling cascade paths seeded by that surface — determined by
tracing the surface as a source property in the §7.7.1 coupling table and
following Mechanical couplings through one hop. The cascade trace SHALL follow
only Mechanical couplings (not Navigational or Narrative), as these represent
state mutations that can produce regressions. The cascade trace SHALL NOT
re-enter a property already visited via a prior hop in the same trace. The
cascade-selected sub-workflows SHALL be recorded in DECISIONS.md (6) alongside
the surface-selected sub-workflows, with the trace path that produced each
selection.

*Example:* A change to Scene surfaces selects S16 and S19 (direct). The cascade
trace follows Scene → Countdown (Mechanical, P1) → S4, S5, S16, S23; and
Scene → Faction (Mechanical, P1) → S23. The combined selection is S16, S19, S4,
S5, S23.

This cascade-aware scoping applies to spec-driven updates (§6.7) and synthesis
re-runs (§11). The operator MAY disable cascade tracing with
`--surface-only-scoping` to select only direct-surface sub-workflows.

**REQ Pattern Buffer coverage map.** The following table maps every requirement in §5.5
 (Badges and Access), §5.6 (State, Lifecycle, Entities, and Adventure Content), §5.7 (Determinism, Safety, and
Performance), and REQ-002 (Error taxonomy) to at least one Pattern Buffer sub-workflow
that exercises its contract. This table is normative — it ships with the
specification and is mechanically verified by `scripts/validate.ts`. When a spec
revision adds a new REQ to these sections, the maintainer SHALL add at least one
row mapping it to a Pattern Buffer sub-workflow (existing or new). When no existing
sub-workflow exercises the new REQ's contract, the maintainer SHALL add a new
sub-workflow. Gaps detected by validation are errors — they block assembly.

| REQ | Sub-workflows | Feature |
|-----|---------------|---------|
| REQ-030 | S6, S17 | Single-user connection |
| REQ-031 | S6, S22 | Badge activation |
| REQ-032 | S6, S14h, S19 | Server-side badge gating |
| REQ-066 | S6, S15 | set_badge tool |
| REQ-109 | S19 | Badge briefing composition |
| REQ-133 | S6 | Forbidden-call audit |
| REQ-134 | S6 | Minimum Player tool surface |
| REQ-135 | S19, S26 | Badge briefing size budget |
| REQ-136 | S19 | Null-badge briefing |
| REQ-137 | S6 | Gate classification auditability |
| REQ-148 | S6, S19 | Entity ownership filter |
| REQ-149 | S6, S19 | Badge-filtered resources |
| REQ-150 | S6 | Server-settable entity visibility |
| REQ-159 | S19, S27 | Synthesis briefing integration |
| REQ-216 | S7 | Generation table badge filtering |
| REQ-220 | S26 | Narrative point of view |
| REQ-223 | S26 | POV mode control |
| REQ-304 | S19 | Counterpart AI role |
| REQ-305 | S6, S19 | Observer mode |
| REQ-306 | S19, S22 | Adjustable autonomy |
| REQ-307 | S16, S17 | Entity presence |
| REQ-308 | S16, S19 | Knowledge gating by presence |
| REQ-040 | S16, S21 | Audit log |
| REQ-041 | S4, S22, S25 | Undo/redo/snapshots |
| REQ-043 | S3, S4, S5 | Combat lifecycle |
| REQ-044 | S17 | Ruleset hash recording |
| REQ-065 | S5, S17 | Build fingerprint |
| REQ-069 | S16 | Player feedback signal |
| REQ-072 | S21, S28 | Session recap (incl. Lonelog) |
| REQ-073 | S16, S23 | Countdowns (incl. clock taxonomy) |
| REQ-074 | S17, S19 | Multi-entity support |
| REQ-075 | S16 | Named-NPC state |
| REQ-076 | S16, S17 | Scene-state ledger |
| REQ-076a | S16 | Structured scene fields |
| REQ-077 | S2, S19, S28 | Entity personality fields |
| REQ-079 | S18, S29 | Adventure modules |
| REQ-116 | S4, S22 | Redo |
| REQ-192 | S22 | Batch-respond collision |
| REQ-119 | S16 | NPC stat block reference |
| REQ-120 | S16 | NPC rendering |
| REQ-121 | S16 | NPC resource URIs |
| REQ-122 | S16 | NPC narrative fields |
| REQ-123 | S16 | Builder-defined NPC stat fields |
| REQ-124 | S16 | NPC damage resolution |
| REQ-126 | S19, S28 | Voice examples rendering |
| REQ-127 | S2, S19 | Ruleset-native personality mapping |
| REQ-128 | S16 | Signal briefing surface |
| REQ-255 | S16, S19 | Boundary signal propagation |
| REQ-129 | S16 | Property group cardinality |
| REQ-132 | S18 | Adventure generation lifecycle |
| REQ-156 | S16 | Countdown persistence |
| REQ-203 | S15 | Corrupted state recovery |
| REQ-204 | S15 | State directory isolation |
| REQ-205 | S5, S15, S17 | State survival under restart |
| REQ-206 | S4, S9 | Condition management |
| REQ-217 | S9 | Condition lifecycle |
| REQ-221 | S23 | Combat-navigation interaction |
| REQ-229 | S18 | Adventure synthesis linkage |
| REQ-232 | S23 | Pause/resume context |
| REQ-233 | S23 | Factions |
| REQ-236 | S23 | Entity relationships |
| REQ-237 | S24 | Session segmentation |
| REQ-239 | S24 | Audit log compaction |
| REQ-241 | S25 | Checkpoints |
| REQ-242 | S23 | Notes |
| REQ-247 | S2, S18 | Adventure structure extraction |
| REQ-248 | S18 | Adventure overview resource |
| REQ-249 | S18 | Adventure navigation resource |
| REQ-250 | S16, S18 | Adventure scene waypoint |
| REQ-050 | S4, S7 | Determinism (PRNG) |
| REQ-051 | G4 | No runtime network access |
| REQ-052 | S13, S21 | Path containment |
| REQ-054 | S14i | Input safety |
| REQ-055 | S5, S17 | Durability and resume |
| REQ-100 | S13, S21 | Performance benchmark |
| REQ-409 | S13, S21 | Response-lean enumeration reads |
| REQ-410 | S13, S21 | Token footprint in performance record |
| REQ-416 | S13, S21 | Config default inheritance |
| REQ-417 | S13, S21 | Non-blocking startup probes |
| REQ-157 | S4 | Combat determinism |
| REQ-002 | S1, S14e, S14f, S22 | Error taxonomy |
| REQ-002a | S9 | Extended error category semantics |
| REQ-002b | S1, S14e | Corrective-action contract |
| REQ-002c | S6 | Badge-filtered error values |
| REQ-321 | S15, S16, S17 | Codex |
| REQ-322 | S23 | Vow-countdown coupling |
| REQ-329 | S16, S23 | Countdown-world coupling |
| REQ-330 | S16, S19 | Knowledge-world coupling |
| REQ-331 | S16 | Story journal-world coupling |
| REQ-332 | S15, S16 | Codex provenance |
| REQ-333 | S16 | Story journal to lore promotion |
| REQ-334 | S15 | Novel archiving |
| REQ-080 | S16, S18, S27, S33 | Synthesis lore templates |
| REQ-081 | S27 | Synthesis activation state |
| REQ-082 | S28 | Briefing ordering |
| REQ-083 | S16, S32 | Lore triggers |
| REQ-084 | S29 | command (action: suggest) |
| REQ-084a | S29 | lore (action: suggest) |
| REQ-085 | S19, S26 | Macros |
| REQ-086 | S18, S29 | Lorebook export/import |
| REQ-087 | S18 | Lorebook lifecycle |
| REQ-103 | S27 | Synthesis reversion |
| REQ-114 | S20, S29 | Lorebook interchange |
| REQ-115 | S29 | Novel export/import |
| REQ-125 | S16, S23 | Countdown scene coupling |
| REQ-130 | S27 | Synthesis status resource |
| REQ-155 | S16, S23 | Countdown alarm |
| REQ-158 | S30, S31 | Supplementary import |
| REQ-195 | I5, I10 | World model population |
| REQ-196 | I5, I7 | World model resource URIs |
| REQ-197 | I1, I4 | Room CRUD |
| REQ-198 | I2, I4 | Exit symmetry |
| REQ-199 | I4, I9 | Thing containment |
| REQ-200 | I7, I14, I16 | Kind hierarchy |
| REQ-201 | I5, I10 | world (action: convert) validation |
| REQ-202 | I5 | world (action: convert) on populated model |
| REQ-283 | I14 | Device lifecycle |
| REQ-284 | I6, I14, I16 | Property state propagation |
| REQ-309 | I7, I13 | World prominence |
| REQ-316 | I15 | Vehicle lifecycle |
| REQ-317 | I15 | Vehicle enter/exit coupling |
| REQ-318 | I16 | Extended property contracts |
| REQ-319 | I17 | Extended parser commands |
| REQ-320 | I18 | Narrative-intent verbs |
| REQ-325 | I3, I6 | Container open/close |
| REQ-326 | I10, I13 | Scene-world coupling |
| REQ-327 | I11 | NPC-world coupling |
| REQ-367 | I6, I16 | World-model property contracts |
| REQ-368 | S32 | Countdown-world effect coupling |
| REQ-369 | S32, S33 | Holodeck archetype taxonomy |
| REQ-370 | — (validated by `npm run validate`) | Coupling derivation |
| REQ-371 | S33 | Ruleset Wisdom as rendered reality |
| REQ-374 | — (convergence Phase 1 metric) | Archetype coverage |
| REQ-375 | — (convergence Phase 1 metric) | Wisdom mechanical coupling rate |

**Fingerprint-driven Pattern Buffer scoping.** When neither the ruleset content hash
(REQ-044) nor the specification content hash (REQ-187) have changed since the
prior successful Pattern Buffer execution — recorded in DECISIONS.md (6) with its
Pattern Buffer fingerprint (ruleset hash + spec hash + holonovel package version) — the builder
SHALL skip the Pattern Buffer sub-workflows. The gap audit reports zero changed
surfaces; no sub-workflows are selected per the surface-to-scenario mapping.
The builder records `cached — Pattern Buffer fingerprint match` in DECISIONS.md (6).

**Per-sub-workflow surface fingerprints.** Each sub-workflow's structured encoding
SHALL carry a `surface_hash` — a SHA-256 of the sorted, concatenated tool names,
resource URIs, and prompt names the sub-workflow exercises. When the
specification version has advanced but the ruleset hash is unchanged, the builder
SHALL run the gap audit (§6.7) and compute per-sub-workflow surface hashes.
Sub-workflows whose `surface_hash` matches the prior Pattern Buffer execution SHALL be
skipped individually — recorded as `cached — surface hash match for S<N>` in
DECISIONS.md (6). Sub-workflows whose `surface_hash` differs SHALL re-execute.
The full 29-sub-workflow Pattern Buffer is not required when the
gap audit identifies no ruleset-facing surface changes.

**Sub-workflow segmentation.** A sub-workflow whose structured encoding declares
independently-verifiable segments — enumerated as `segments` in the structured
record, each with its own `segment_hash` (SHA-256 of the ordered tool calls and
assertions in that segment) — MAY re-execute only segments whose hash changed
since the prior run. A segment is independently verifiable when: (a) its tool
calls do not depend on state mutated by prior segments (it can run standalone
given a freshly initialized Novel); and (b) its assertions are self-contained
— they verify a single property contract without relying on side effects from
other segments. Segments that share a state dependency SHALL execute together
as a fused unit. The builder records per-segment results in the pattern buffer
manifest; unchanged-segment verdicts carry forward from the prior run with
`cached — segment hash match for S<N>.seg<M>` in DECISIONS.md (6).

A sub-workflow without declared segments SHALL execute in full on every
selection. The full 33-sub-workflow Pattern Buffer SHALL still execute when the
ruleset hash or spec version changes — segmentation reduces re-execution cost
only within a stable-spec/stable-ruleset context where individual surfaces
change. Sub-workflow segmentation SHALL NOT be used to split blocking
sub-workflows into mixed blocking/non-blocking segments — if any segment of a
blocking sub-workflow is selected for re-execution, the entire sub-workflow
SHALL re-execute as a unit.

**Pattern Buffer results manifest.** The builder SHALL record a `pattern_buffer_manifest`
alongside the build fingerprint (REQ-065): per-sub-workflow pass/fail status,
surface hash, and execution timestamp, keyed to spec version + ruleset hash.
When the spec version and ruleset hash both match a prior manifest entry, all
sub-workflow results are reused — recorded as `cached — pattern buffer manifest match`
in DECISIONS.md (6) — instead of re-executing any sub-workflow. When the spec
version has advanced, sub-workflows with unchanged surface hashes carry forward
their prior results per the per-sub-workflow fingerprint rule; sub-workflows with
changed surface hashes re-execute. The manifest takes precedence over the
DECISIONS.md (6) execution record for re-use decisions.

The operator MAY override fingerprint scoping with a `--full-pattern-buffer` flag at
intake, forcing all 33 sub-workflows regardless of fingerprint match.

#### Holonovel Pattern Buffer

The Holonovel server — the `holonovel` npm package (ruleset-free per §6.2) — is
verified through a separate Pattern Buffer of world-model-specific sub-workflows. The Holonovel
Pattern Buffer runs when the holonovel package is built and before it is published, as part of
the holonovel package's own verification. It is not part of TTRPG builds — TTRPG servers
consume the published holonovel package as a build-time dependency and skip the Holonovel
Pattern Buffer sub-workflows. The same Method, Verification principle, Failure artifacts,
Budget, and Structured encoding contracts apply (§6.6), including the executable
test harness mandate — the holonovel package build SHALL produce a runnable harness
(`scripts/run_pattern_buffer.ts`) per the §6.6 Structured encoding clause. Blocking
sub-workflows SHALL pass; non-blocking failures are recorded as accepted
limitations.

**Version-bound results.** When the holonovel package version (B10) matches a
prior Holonovel Pattern Buffer execution recorded in DECISIONS.md (6), and the
specification version has not advanced, the builder MAY reuse the prior
results — recording `cached — holonovel vX.Y.Z Pattern Buffer results` in DECISIONS.md
(6) — instead of re-executing the 13 sub-workflows. A specification version
advance SHALL trigger a fresh Holonovel Pattern Buffer execution. The holonovel convergence
manifest (REQ-245) carries pre-computed Pattern Buffer results for the version it
was built against; the manifest takes precedence over prior-build DECISIONS.md
records.

**Per-sub-workflow surface fingerprints.** Each Holonovel sub-workflow's structured
encoding SHALL carry a `surface_hash` — a SHA-256 of the sorted tool names,
resource URIs, and prompt names the sub-workflow exercises. When the
specification version has advanced but the holonovel package version is unchanged,
sub-workflows whose `surface_hash` matches the prior Holonovel Pattern Buffer execution
SHALL be skipped individually — recorded as `cached — surface hash match for
I<N>` in DECISIONS.md (6). Sub-workflows with changed surface hashes SHALL
re-execute. The surface-to-scenario mapping below governs which sub-workflows
are selected for changed surfaces.

**Holonovel Pattern Buffer sub-workflows.**

1. **Parser command sweep** — call every registered parser command (look, go
   north/east/south/west, examine, take, drop, open, close, inventory, wait)
   on a populated world model; no crashes, hangs, or unexpected error codes.
   (Blocking.)

2. **Room navigation cycle** — navigate through a linked room chain (≥5 rooms)
   via direction commands; each room description matches the source text, exit
   directions match declarations, visible things are listed. (Blocking.)

3. **Object interaction cycle** — take a portable thing (succeeds, removed from
   room), examine it (shows description), drop it (reappears in current room).
   Attempt to take a fixed thing (returns rule-violation). Attempt to take a
   thing inside a closed container (returns rule-violation without first
   opening). (Blocking.)

4. **CRUD round-trip** — create a room via `world (action: create_room)`, create a thing in it,
   create an exit connecting it back; read room resource, assert name,
   description, things, and exits match. Delete the room — assert contained
   things and exits removed, audit log records all mutations. Undo — assert
   deleted room and contents restored. (Blocking.)

5. **world (action: convert) with fixture** — call `world (action: convert)` with the Appendix K
   fixture. Assert object counts (3+ rooms, things, exits), linked annotations,
   and auditor log entry. Assert command("look") shows Entrance Chamber with
   content. Call `world (action: convert)` on the same Novel — assert `[STATE_CONFLICT]`.
   (Blocking.)

6. **Property state propagation** — open a closed container, assert contents
   accessible. Close it, assert contents blocked. Lock a lockable door — assert
   it cannot be opened. Unlock it — assert it opens. All property mutations
   appear in audit log and `session (action: recap)`. (Blocking.)

7. **World-model resources** — call `room://<id>`, `thing://<id>`,
   `world://map`, `world://kinds`. Assert room and thing content matches state.
   Assert map shows correct adjacency. Assert kinds resource lists the kind
   hierarchy, property contracts, and parser command catalog provided by the
   holonovel package (B10). Swap to Player badge — assert GM-only metadata
   excluded from all four resources.

8. **Large-map navigation** — populate 50+ room world model. Navigate from one
   end to the other (≥10 sequential moves). Assert each room description is
   correct, no state corruption, memory stable. `session (action: recap)` covers
   traversal history.

9. **Empty world model** — on a Novel with zero rooms (fresh create, no
   adventure loaded), every parser command returns not-implemented directing
   to populate the world model. CRUD tools still function — create a room,
   assert parser commands now resolve against it.

10. **Hybrid adventure load** — load an adventure module containing `## World`
    assertions (Appendix K fixture format) via `adventure (action: load)`. Assert
    world-model tier populated, room descriptions match, things placed in
    declared rooms, exits connected. Assert `ruleset (action: search)` finds adventure
    prose. Assert `badge_briefing` surfaces adventure content badge-filtered.
    (Blocking.)

11. **Narrative CRUD cycle** — create an NPC via `npc (action: create)`, set personality
    fields via `character (action: personality)`, attach voice examples via `character (action: voice)`,
    update the NPC's disposition via `npc (action: update)`, then remove it via
    `npc (action: remove)`. Assert `badge_briefing` surfaces NPC name and disposition after
    each mutation. Assert `session (action: recap)` covers the create-update-remove
    sequence. Assert `npc (action: remove)` on a nonexistent NPC returns `[NOT_FOUND]`.
    (Non-blocking.)

12. **Lore and countdown lifecycle** — create a lore entry with triggers via
    `lore (action: set)`, toggle it disabled then re-enabled via `lore (action: toggle)`,
    update its content via `lore (action: update)`, remove it via
    `lore (action: remove)`. Create a countdown via `countdown (action: set, ticks=2)`,
    advance it twice to expiry via `countdown (action: advance)` — assert the expiry audit
    log entry and countdown removal. Assert `lore (action: remove)` on a removed
    entry returns `[NOT_FOUND]`. (Non-blocking.)

13. **Scene state and guidance** — set scene state via
    `scene (action: set, description, location, time_of_day, atmosphere)`, set scene
    type to `["social", "exploration"]`, set a narrative directive. Assert
    `badge_briefing` surfaces all scene fields, scene type, and directive. Set a
    custom briefing order via `session (action: briefing_order, [...])` — assert `badge_briefing`
    sections appear in the specified order. Assert `scene (action: set)` transitions
    push the prior scene to `scene_history`. (Non-blocking.)

14. **Device lifecycle** — create a device via `world (action: create_thing, "lantern", {kind:
    "device", lit: true})`. Assert `command("switch on lantern")` returns
    `[OK]`. Assert `command("switch off lantern")` returns `[OK]`. Assert
    `command("switch on rock")` on a non-device returns `[RULE_VIOLATION]`.
    Assert `world (action: convert)` recognizes "It is switchable." and "It is switched
    on." (Blocking.)

15. **Vehicle lifecycle** — create a world model with a vehicle via
    `world (action: convert)`. Assert `command("enter raft")` returns `[OK]` and
    viewpoint moves to vehicle interior. Assert `command("exit")` returns to
    parked room. Assert navigation aboard vehicle moves both vehicle and
    passengers. Assert vehicle persists at location when unoccupied. Assert
    `command("enter rock")` on non-enterable returns `[RULE_VIOLATION]`.
    (Blocking.)

16. **Extended property contracts** — create things with `wearable`, `edible`,
    `readable`, `transparent`, `climbable`, `enterable` properties via
    `world (action: convert)`. Assert each property assertion is recognized. Assert
    `command("wear ring")` succeeds. Assert `command("eat mushroom")` succeeds.
    Assert `command("read altar")` returns `read_text`. Assert missing-property
    commands return `[RULE_VIOLATION]`. Assert `read_text` extraction from "The
    inscription on the altar reads 'Beware.'" (Blocking.)

17. **Extended parser commands** — exercise all new standard-tier commands:
    `wear`, `remove`, `read`, `eat`, `drink`, `climb`, `enter`, `exit`,
    `switch on/off`, `sit`, `stand`, `push`, `pull`, `light`, `extinguish`,
    `listen`, `smell`, `touch`, `insert`, `again`/`g`, pronoun references
    (`it`, `them`). Assert `command("help")` lists verbs grouped by tier.
    Assert `command("again")` repeats last command. Assert `command("it")`
    resolves last referenced thing. Assert property-violation cases return
    `[RULE_VIOLATION]`. (Blocking.)

18. **Narrative-intent verbs** — create an NPC in a room. Assert `command("ask
    guard about crypt")` returns `[OK]` with intent. Assert `command("give
    sword to guard")` transfers item and returns `[OK]`. Assert `command("show
    shield to guard")` does NOT transfer. Assert `command("throw rock at
    statue")` moves object to room. Assert `command("give altar to guard")` on
    fixed item returns `[RULE_VIOLATION]`. Assert `command("ask nobody about
    crypt")` with no matching NPC returns `[WARNING]`. (Blocking.)

**Holonovel Pattern Buffer surface-to-scenario mapping.**

| Changed surface                                    | Holonovel Pattern Buffer scenarios |
|----------------------------------------------------|---------------------------|
| holonovel package changed (new version)     | All (1–18)                |
| Room navigation, parser commands                   | 1, 2, 8, 17                |
| Object interaction, properties                     | 3, 6, 14, 15, 16           |
| CRUD, state mutations                              | 4                         |
| world (action: convert), hybrid parsing                     | 5, 10                     |
| Badge filtering, resource URIs                       | 7                         |
| Empty state, error handling                        | 9                         |
| NPCs, character narrative fields                   | 11                        |
| Lore, countdowns                                   | 12                        |
| Scene state, tone, guidance                        | 13                        |
| Devices, vehicles                                  | 14, 15                    |
| Extended properties                                | 16                        |
| Parser command vocabulary                          | 17                        |
| Narrative verbs                                    | 18                        |

**REQ-376a — Holonovel Pattern Buffer traceability (Part a).**
The builder must ensure at least one Holonovel Pattern Buffer sub-workflow exercises each requirement in §5.10 (World-Model Layer), §5.12 (Narrative Architecture), §5.13 (Holodeck), and the world-model error contracts of REQ-367 (World-model property contracts). The builder records a Holonovel sub-workflow-to-REQ mapping in DECISIONS.md (6) — one entry per covered REQ, naming the sub-workflow(s) that exercise it. When a REQ in these sections changes during a holonovel package version advance, the builder re-examines every sub-workflow mapped to it.

**REQ-376b — Holonovel Pattern Buffer traceability (Part b).**
Gaps — a REQ in the covered sections with no mapped sub-workflow — are logged as process-compliance findings and must be resolved before the holonovel package is published. New REQs added to the covered sections during a spec revision require the builder to propose at least one new Holonovel Pattern Buffer sub-workflow exercising their contract; the proposal is a finding, not a blocker. _Check:_ T431.

### Holonovel REQ Pattern Buffer coverage map

The following table maps every
requirement in §5.10 (World-Model Layer), §5.12 (Narrative Architecture), §5.13
(Holodeck), and the world-model error contracts to at least one Holonovel Pattern
Buffer sub-workflow that exercises its contract. This table is normative — it ships
with the specification and is mechanically verified by `scripts/validate.ts`.
When a spec revision adds a new REQ to these sections, the maintainer SHALL add
at least one row mapping it to a Holonovel PB sub-workflow (existing or new).
When no existing sub-workflow exercises the new REQ's contract, the maintainer
SHALL add a new sub-workflow. Gaps detected by validation are errors — they
block assembly.

| REQ | Sub-workflows | Feature |
|-----|---------------|---------|
| REQ-195 | I5, I10 | World model population |
| REQ-196 | I5, I7 | World model resource URIs |
| REQ-197 | I1, I4 | Room CRUD |
| REQ-198 | I2, I4 | Exit symmetry |
| REQ-199 | I4, I9 | Thing containment |
| REQ-200 | I7, I14, I16 | Kind hierarchy |
| REQ-201 | I5, I10 | world (action: convert) validation |
| REQ-202 | I5 | world (action: convert) on populated model |
| REQ-222 | I4, I7 | World-model property resources |
| REQ-283 | I14 | Device lifecycle |
| REQ-284 | I6, I14, I16 | Property state propagation |
| REQ-309 | I7, I13 | World prominence |
| REQ-316 | I15 | Vehicle lifecycle |
| REQ-317 | I15 | Vehicle enter/exit coupling |
| REQ-318 | I16 | Extended property contracts |
| REQ-319 | I17 | Extended parser commands |
| REQ-320 | I18 | Narrative-intent verbs |
| REQ-325 | I3, I6 | Container open/close |
| REQ-326 | I10, I13 | Scene-world coupling |
| REQ-327 | I11 | NPC-world coupling |
| REQ-367 | I6, I16 | World-model property contracts |
| REQ-368 | S32 | Countdown-world effect coupling |

**REQ-300 — Structured failure diagnostics.** WHEN any Pattern Buffer sub-workflow fails, THE
builder SHALL produce a diagnostic record in DECISIONS.md (5) containing: gate name,
sub-workflow name, failing test ID, REQ citation, expected output, actual output, and a
diff (line-level comparison). The diagnostic record SHALL include a `resolution` field —
initially `pending`, updated to `converged` when the discrepancy is resolved.
*Acceptance criterion:* When G2 fails on an combat (action: init) turn-order mismatch,
DECISIONS.md (5) contains a diagnostic with gate name, test ID, REQ citation, expected
turn order, actual turn order, and a diff.
_Check:_ T344.

**REQ-301 — Convergence loop audit trail.** Each iteration of the convergence loop SHALL
produce a traceable record in DECISIONS.md (5) containing: iteration number, the specific
REQ or test ID addressed, the change made (summary), the re-test result, and the token
cost. After convergence, DECISIONS.md (5) SHALL include a `convergence_summary`: total
iterations, total token cost, REQ coverage, and final disposition.
*Acceptance criterion:* A convergence loop requiring 3 iterations produces 3 audit trail
entries with iteration numbers, REQ/test citations, change summaries, and re-test results.
_Check:_ T345.

**REQ-303 — Scoped re-verification.** WHEN extraction is incremental per REQ-302, Pattern Buffer
sub-workflows SHALL scope their verification to changed sections. Sub-workflows that
verify unchanged sections only SHALL be skipped with a `[section unchanged — re-validating
from previous build]` annotation. Cross-section sub-workflows SHALL run in full. Skipped
sub-workflows carry the `[validated-by-prior-build]` disposition.
*Acceptance criterion:* An incremental rebuild where only the "Spells" section changed
skips Pattern Buffer sub-workflows that verify unchanged sections and records the skip.
_Check:_ T347.

### 6.7 Spec-driven updates

*Prepare:* Load files from `build-phase-map.md` Spec-driven update row:
03-build.md §6.7 plus files changed per git diff.

**REQ-098 — Spec-driven update workflow.** When an existing MCP server is updated
to match spec changes, the operator SHALL audit gaps, produce a disposition plan,
implement changes, and re-run only Pattern Buffer sub-workflows exercising changed
surfaces. The builder selects scenarios from the surface-to-scenario mapping in §6.6.
Gap dispositions include: implemented, deferred, or waived — each citing the relevant
REQ. Pattern Buffer sub-workflows not exercised by changed surfaces are skipped.
*Acceptance criterion:* Gap audit produces one row per affected surface with REQ
citation and disposition; selected Pattern Buffer sub-workflows show zero failures.
_Check:_ T84.

#### Delta classes

| Class    | Trigger                                                       | Verification workflow                                                  |
| -------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| Patch    | Spec wording only — no REQ added, removed, or scope-changed  | G0 only; record version bump in DECISIONS.md; no Pattern Buffer |
| Editorial | REQ bodies repaired or reworded with no scope change — REQ set, state model, and tool surface unchanged; spec tooling or verification-only edits | G0 only; record version bump and the repaired REQ set in DECISIONS.md; no Pattern Buffer; no fingerprint advance required |
| Minor    | REQ bodies changed with a scope change, new REQs added, old REQs removed; no state model or tool-surface change | Full gap audit; Pattern Buffer sub-workflows per surface-to-scenario mapping (§6.6) |
| Major    | State model changed, new tools/prompts/resources mandated, badge-gating contract altered | Full gap audit; full Pattern Buffer (§6.6 — 33 sub-workflows, of which the 29-sub-workflow ruleset-facing subset applies when no world-model surface changed) |

The builder classifies the delta during gap audit. A major spec version increment
always triggers the Major class. An Editorial disposition records the repaired
REQ set in DECISIONS.md; a delta recorded Editorial whose REQ scope actually
changed is a classification error that blocks publication (REQ-394, REQ-419).
The operator may override the classification at intake (U2).

#### Implementation fingerprint comparison

Before the gap audit begins, the builder
SHALL compute the five implementation fingerprint components (REQ-313) and compare
them against the stored fingerprints from the prior build recorded in DECISIONS.md
(1). When all five components are unchanged and the spec version is unchanged, the
builder reports `[OK] Server is current` and exits without mutation. When the spec
version has advanced but no implementation fingerprints changed, the builder proceeds
to gap audit normally. When one or more implementation fingerprints changed, the
builder applies the partial-rebuild scoping rules (REQ-314) to determine which
verification steps to skip: unchanged components reuse their prior verification
output; only components with changed fingerprints run fresh verification. The
fingerprint delta summary — which components changed, which remain unchanged, and
the scoping decision — is recorded in DECISIONS.md (6) before the gap audit.
An update is complete only when the implementation fingerprints advance to reflect
the new revision; a Minor or Major revision SHALL NOT be recorded as applied ahead
of its implementation (REQ-394).

The implementation fingerprints are computed against the live, deployed server
source tree — never against the spec repository's own working tree or historical
DECISIONS.md entries. When the spec repository and the deployed server live in
different directories or repositories, the Update workflow SHALL establish which
deployed server the gate evaluates, record that location in DECISIONS.md, and
recompute fingerprints against it. When the canonical implementation source lives
inside the specification repository and a deployed clone is produced from it, the
gate SHALL evaluate the canonical tree at the revision being published and
verification SHALL run against the deployed clone after the pull (REQ-418). A
spec-repo-only change not reflected in the deployed server's fingerprints is a
pending update (REQ-394), not an applied one.

#### Gap audit method

Before the version comparison, the builder SHALL compare the
installed holonovel package version against the build-time holonovel package version recorded in the
server's build fingerprint (REQ-065). A mismatch SHALL be recorded as an informational
finding in the gap audit — the Update workflow proceeds, but DECISIONS.md records the
version delta with a recommendation to re-run Build.

The builder then compares the server's recorded spec version
(`spec_health.spec_version`) against the current spec version. When the
current version is unchanged, the builder reports `[OK] Server is current
(spec version <version>)` and exits without mutation. When the current version
has advanced, the builder proceeds to compare live registrations as follows:
the builder compares the server's live registrations — tool catalog
(tools/list), resource map (resources/list), prompt list (prompts/list),
and `spec_health` counts — against the spec's output contracts (§7.3), tool-surface
conventions (§7.4), state model (§7.7), and REQ-032 badge gating. Behavioral
contracts are verified by Pattern Buffer re-run. The audit produces one row per identified
gap with: the affected surface, the citing REQ, the disposition, and the reason.

#### State migration

When the state model changes, the builder verifies that
existing Novel state loads without error under REQ-065 compatibility rules. Novel
state fields present in stored state but absent in the updated model are preserved
as inert data; fields absent in stored state receive defaults. A load failure
during a spec-driven update is a blocking defect.

#### User-data disposition

The builder SHALL record a user-data disposition in the gap audit naming each tier
— ruleset packages, Novels, roster, codex, server notes — whose contract surface
changed, with the action (rebuild / migrate / none) and the citing REQ. A delta
touching a package-contract section (§5.16, §5.17, §6.3, §6.4.2) SHALL recommend
`update-rulesets` (REQ-422); a delta touching the state model (§7.7) SHALL
recommend `migrate-user-data` (REQ-424). Stale packages and state artifacts SHALL
be flagged at startup per REQ-420 and REQ-423; user data SHALL NOT be blocked from
loading by staleness (REQ-423).

#### Synthesis consistency check

After the gap audit and before Pattern Buffer
re-execution, the builder SHALL scan all synthesis items (ruleset-native and
community tiers) for references to surfaces identified as changed or removed in the
gap audit per REQ-228. The builder cross-references: action pattern tool names
against the gap audit's tool rows, briefing order section tokens against the gap
audit's token vocabulary rows, lore template keywords against the gap audit's
index-changed rows, supplementary guidance anchors against the gap audit's
section-removed rows, adventure advice ruleset terms against the index-changed
rows, and narrative voice profile source anchors against section-removed rows.
Orphan references are classified per REQ-228 and recorded in DECISIONS.md (6)
with the gap audit row reference. This is a cross-reference scan — no web
research occurs.

#### Synthesis population

After the synthesis consistency check, the builder
SHALL run a scoped ruleset-native synthesis re-classification per REQ-243:
identify new or changed surfaces from the gap audit's implemented-disposition
rows, map each surface to its source ruleset sections via RULESET_MODEL.md
citations, run REQ-225 classification on only those sections, merge new
`[ruleset]`-tagged items into the existing synthesis manifest (append, never
replace), and record the added item count per module in DECISIONS.md. When the
gap audit identifies no new surfaces (patch-level change), this step SHALL be
skipped with a "no new surfaces — skipped" annotation. No web research occurs.

**Budget.** The operator may set a wall-clock budget in minutes at intake. If the
budget is exceeded before the Pattern Buffer passes, the builder reports residual gaps
and the operator chooses: accept the partial update, extend the budget, or revert.
No budget set → no limit.

_Check:_ A dated DECISIONS.md gap-disposition entry exists with each gap citing its
relevant REQ and disposition reason. `spec_health` reports the updated specification
version. Pattern Buffer sub-workflows selected per the surface-to-scenario mapping in §6.6
pass with zero failures. `spec_health` reports
`last_spec_review` and `last_pattern_buffer` fields populated with ISO dates.

**Spec fetch.** When U3 is `yes`, the builder fetches the latest specification
from the repo URL recorded at build time before beginning the gap audit. The
fetched copy is compared against the embedded `spec://build` copy; a diff
summary is reported. The embedded copy is updated to the fetched version.
A successful fetch records the new content hash in DECISIONS.md. An unreachable
remote records a fetch-failure notice and does not block the update — the gap
audit proceeds against the embedded copy. Network access during the Update workflow
is a build-time operation and does not violate REQ-051.

