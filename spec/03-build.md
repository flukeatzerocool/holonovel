## 6. The Build Process

### 6.1 Workflow overview

The build is organized into four independently selectable workflows. The operator picks one or
more workflows; the builder asks only the questions those workflows need and proceeds accordingly.

| Workflow | What it does                                                | Required sections        |
| ------- | ----------------------------------------------------------- | ------------------------ |
| Convert | Convert PDF/HTML/web source to Markdown; validate structure. Accept core rulebooks, supplemental books, character sheets, and adventure modules — anything related to the game. | §6.2, Appendix G, H      |
| Build   | Intake Markdown, discover ruleset, construct & verify server. Accept core rulebooks, supplemental books, character sheets, and adventure modules — the builder discovers adventure content within provided materials. | All sections + appendices |
| Enrich  | Community play advice and structured enrichment (optional)   | §11.1            |
| Update  | Reconcile an existing server with a revised specification. Perform gap audit, implement changes, re-verify all blocking Gauntlet sub-workflows. | §6.7, §6.2      |

### 6.2 Intake

Ask the operator pre-build questions up front, as a single batch. The builder asks the
workflow-selection question first, then all questions relevant to the selected workflows. Each workflow's
questions are presented together; answers are recorded in DECISIONS.md. Non-interactive
runs use defaults from the tables below (defaults: `build` when offline, `build + enrich` when network detected).

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
| Q0  | What workflow(s) should Holonovel run? | convert / build / enrich / update (select one or more) | build + enrich (when network detected), build (when offline) |

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
`enrich`; the operator may still deselect it.

**Convert workflow.** Asked when `convert` is selected.

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
| B1  | Ruleset path(s)              | File paths or `none`             | —                   |
| B3  | Which AI client will you use? | Claude Desktop / Opencode CLI / other | Opencode CLI      |
| B4  | Where should the server save its data? | Folder path              | `.holonovel-state`  |
| B6  | What should the server be called? | Name                          | `[game_name]-holonovel` |

**Advanced Build questions.** After the builder confirms Required answers, the
builder presents the Advanced defaults and asks whether the operator wants to
override any. If the operator declines, all Advanced questions take their
defaults without further prompting.

| #   | Question                     | Options                          | Default             |
| --- | ---------------------------- | -------------------------------- | ------------------- |
| B2  | Ruleset identifier (name, edition) | String                      | derived from source |
| B5  | Where is your AI client's settings file? | File path               | auto-detect from B3 |
| B7  | Connect MCP client to server after build? | yes / no                | yes                 |
| B8  | Where is the Holonovel spec repository? | URL                    | <https://git.gay/flukeatzerocool/Holonovel> |
| B9  | Build mode                   | production / quick-build           | production          |
| B10 | Which version of @holonovel/inform to use as world-model base? | npm version or `latest` | `latest` |

The builder SHALL record all answers — Required and Advanced — in
DECISIONS.md (1). When the operator declines the Advanced prompt, the
defaults are recorded with a `(defaults accepted)` annotation.

**Ruleset-free mode.** When B1 is `none`, the build operates in ruleset-free mode: no ruleset files
are indexed, no extraction occurs, and the server is built from the `@holonovel/inform`
package (B10) and infrastructure tools (REQ-020) alone. The builder records ruleset-free
mode in DECISIONS.md (1), runs `npm install @holonovel/inform` at the version specified by B10,
and proceeds to server construction (§6.4) using the inform scaffold as the starting point.
Extraction discovery and its dependent metrics are skipped. A build declared ruleset-free MUST NOT attempt
to index, extract, or model any ruleset content; the server's `search_rules` tool returns empty
results, its canonical lookup tools are waived (REQ-013), and no dice-resolution tools are
registered. The server's ruleset content hash is the sentinel hash per REQ-044.

**Build mode profiles.** `production` (default) runs the full quality suite:
assumption audit (REQ-101), per-step audits with auditor pre-flight, post-write
verification on every file, cross-model auditing when available, and the full
Gauntlet (§6.6). The Gauntlet gates both modes. `quick-build` mode narrows the
overhead rituals: skips the assumption audit and auditor pre-flight, scopes
post-write verification to critical files (DECISIONS.md, MCP client config,
on-disk Novel state), and accepts same-model audits. The Gauntlet still gates
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

**Enrich workflow.** Asked when `enrich` is selected.

| #   | Question                     | Options                          | Default             |
| --- | ---------------------------- | -------------------------------- | ------------------- |
| E1  | Where is the server you already built? | Folder path              | —                   |
| E2  | What kinds of advice to search? | all / choose: community forums, actual plays, strategy guides, genre advice, designer notes, media influences (movies, TV, video games) | all |
| E3  | Minimum confidence           | high / medium / low               | medium              |
| E4  | Override module budget caps? | use defaults / custom (provide caps per module) | use defaults           |

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
WHEN B1 is `none`, G0 step 1 SHALL report a passing result with the finding "no ruleset — skipped" (per Standing Rule 9).

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
builder's context window — chunks are sized to fill approximately 3,000 tokens of
mechanical prose each, with a floor of 3 mechanical sections and a ceiling of 20.
The builder determines the token-equivalent section count per chunk by estimating
the average mechanical-section token size from a sample of the first 5 mechanical
sections encountered and records the chunking strategy (chunk-size floor/ceiling,
sample-token estimate) in DECISIONS.md (4). The builder reads each chunk, extracts
models (see below), then requests the next. Guidance-only sections are read in a
background pass and don't count against the mechanical-section budget.

**Guidance pass budget.** The background guidance pass SHALL not exceed 50
guidance-only sections. If the ruleset contains more than 50 guidance-only
sections, the builder processes them in batches of 50, interleaving each
batch with the next chunk read to prevent context-window exhaustion. The
builder records the total guidance-section count and batch count in
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

**Inform scaffold installation.** When B1 is not `none` (TTRPG build), the builder SHALL
install the `@holonovel/inform` npm package at the version specified by B10. The inform
package provides the world-model layer pre-built — kind hierarchy, property contracts,
parser command catalog, and declarative assertion syntax — as `core` and `world` entry
points. The builder SHALL add `@holonovel/inform` as a dependency of the TTRPG server and
import from it per §6.4. No chunked reading or provider-documentation indexing occurs
during TTRPG builds — the inform package is a build-time dependency, not a per-build
extraction target. Provider documentation is indexed once when the inform package is
published; the TTRPG builder consumes the published output. The world-model layer is
surfaced at the `world://kinds` resource (REQ-202). When B1 is `none` (ruleset-free mode),
the inform package IS the server — the builder installs it, verifies it starts, and no
further extraction occurs.

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
7. **Guidance** — hat-addressed prose, verbatim, with attribution and hat scope.
   **Narrative tone samples** are a guidance subcategory: example-of-play passages that demonstrate
   the ruleset's narrative tone, tagged `[narrative-tone]` and surfaced in `hat_briefing`
    (REQ-071).

**Category extraction order.** Within each chunk, the builder SHALL extract categories
in dependency order — Concepts first (they define terms other categories reference),
then Entities (they may reference Concept terms), then Tables, then Actions (classified
per REQ-015 against the chunk's Concept inventory), then Resolution (the core mechanic
as derived from Actions and Tables), then Roles (hat-addressed as extracted from
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
| 1     | MCP skeleton: initialize from @holonovel/inform scaffold, tools/list, resources/list, prompts/list | G0 step 2 (MCP conformance, Appendix D)         |
| 2     | Index: anchor tree, search, `search_rules` tool              | RULESET_MODEL.md anchors match source                        |
| 3     | Extraction pipeline: content-type detection, entity/model extraction | B.2 expected model excerpt verified            |
| 4     | Domain tools: resolution, commands, generation, lookup       | Full G2 golden transcript replay (per §8 G2)                 |
| 5     | State layer: extends @holonovel/inform's state with ruleset-specific types (entity stats, combat, spell slots). World-model state is provided by the inform scaffold. | T9 pass (hat test)                                       |
| 6     | Prompts: `run_workflow`, `hat_briefing`, `intro`, `session_zero`, `novel_setup` | T22 pass (prompt registry test)            |

The `character_sheet` tool supports both `markdown` (default) and `ascii` renderers.
Both formats are Build baselines.

For Step 1, the @holonovel/inform scaffold provides the MCP skeleton with hat gating
helpers, state management, macros, enrichment types, and world-model layer (rooms,
things, exits, parser commands, kind hierarchy). The TTRPG builder installs the package,
verifies `serverInfo.name` reports correctly, and proceeds to Steps 2–6 — layering
ruleset-specific content on top of the inform base.

**License.** The server MUST include a `LICENSE.md` file at the project
root with two sections: a **Ruleset Data** section identifying the source
material and its license (drawn from Appendix I), and a **Server Code**
section stating that `src/` and `scripts/` are MIT-licensed (see
`package.json`). The dnd5e server's `LICENSE.md` is the canonical
template.

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

4. **Hat-scoped guidance.** Foundations (REQ-062), anti-slop guidance
   (REQ-070), and supplementary enrichment (REQ-080) are included per the
   active hat's filter.

5. **Required contract elements.** Every prompt that carries a specification
   contract (intro pointer in `hat_briefing` per REQ-063, `player_signal`
   and `set_personality` directives in `session_zero` per REQ-078) includes
   those elements before any truncation.

Prompts use the ruleset's own terminology for mechanics, tool names, and
categories — the builder does not invent terms. The prompt length budget
(REQ-118) applies to every prompt.

### 6.5 Verification and convergence

*Prepare:* Load files from `build-phase-map.md` Convergence row: 03-build.md §6.5,
02-requirements.md (all), 05-verification.md.

**Audit steps.** After each workflow completion and each construction step, the builder spawns a
subagent (fresh context) that audits the work against the requirements cited by that step.
The subagent reports findings; the builder resolves each before the next step.

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
| Conversion fidelity  | G.1 fidelity rate (per content type)| ≥ 90%         | Tune converter, re-sample                |
| Extraction completeness | Mechanical sections with ≥1 extraction / total mechanical sections | ≥ 95% | Re-read missed sections, re-extract |
| Category floor | Lowest per-category HIGH + MEDIUM across the 7 extraction categories | ≥ 50% | Re-extract weakest category, raise to ≥50%, or log operator-notified waiver |
| Cross-format consistency | Sampled items with MD/JSON agreement / 10 | 100% | Re-sample, resolve mismatches in defect log, re-verify |
| Reconciliation quality | Restated mechanics resolved to single canonical source / total restated mechanics | ≥ 90% | Re-resolve ties with additional evidence, or log `[authority-tie]` as accepted residual |

**Regression gate.** After each metric-targeted improvement step completes (the
metric's pass/fail is measured), the builder SHALL re-measure all other metrics in
the same phase. If any previously-passed metric drops below its threshold, the
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

**Per-category floor.** In addition to the overall confidence threshold,
each of the seven extraction categories (§6.3: concepts, entities, actions,
tables, resolution, roles, guidance) must individually meet a minimum
confidence floor of 50% HIGH + MEDIUM. A category below 50% triggers a
targeted re-extraction of that category's source sections. If re-extraction
cannot raise the category above 50%, the builder records a
`[category-confidence-block]` finding in DECISIONS.md (5) with: the affected
category, its current score, the sections contributing LOW items, and a
recommendation. The finding requires operator disposition (accept, reject, or
request targeted remediation) before Phase 1 exit. The guidance category is
exempt from this floor — LOW guidance does not affect tool behavior.

Phase 1 exit: all seven metrics meet threshold (conversion-fidelity conditional —
six when conversion not selected, seven when conversion selected), or an extraction stall
(no-delta on all metrics) triggers the unbuildable disposition check (§6.5.3).
An extraction stall after 3 iterations records residual gaps in DECISIONS.md
(5). The build does not proceed to Phase 2 until Phase 1 exits.

NOTE: Phase 1 row count varies with workflow selection. The conversion-fidelity
metric exists only when the Convert workflow (§6.2) was selected. When
conversion was not selected, the table contains six metrics and the exit
condition is six metrics meeting threshold.

**Ruleset-free convergence.** Phase 1 metrics are skipped per Standing Rule 9. The
builder records `ruleset-free — skipped` for each metric in DECISIONS.md (5). All
seven metrics are treated as met. No extraction stall applies — zero-case
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

Phase 2 exit: all eight metrics meet threshold (input-validation conditional —
eight when REQ-141 is in scope, seven otherwise), or 3 iterations without
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
verification, the builder re-reads the written file and verifies: (a) heading
structure matches the plan — confirm the expected `##` and `###` headings appear in
order; (b) no path corruption — search for doubled directory components and missing
slashes in code blocks; (c) URLs are syntactically valid. Any discrepancy is a
convergence finding and triggers a fix + re-read iteration. In `production` mode
this check applies to every file write: source code, test scripts, README,
DECISIONS.md, and MCP client configuration. In `quick-build` mode it applies to
critical files only: DECISIONS.md, the MCP client configuration, and the on-disk
Novel state file. (d) **completeness** — the builder maintains a file manifest
(list of expected output files recorded after construction planning). The
manifest is checked during post-write verification: every file in the manifest
must exist and have non-zero size. A missing or empty file is a convergence
finding. (e) **terminology** — no deprecated term from Appendix R appears in the
written file. Grep for each deprecated term; any match is a convergence
finding.

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

### 6.6 The Gauntlet

*Prepare:* Load files from `build-phase-map.md` Gauntlet row: 03-build.md §6.6,
05-verification.md, 06-artifacts.md.

**Timing.** After Phase 2 of the convergence loop (§6.5) has converged and the
ruleset-facing verification workflows (§8: G0 step 2 and G4) have passed, the
builder runs the Gauntlet. Fixture workflows (G2 and G3 — see §8) are
specification-level checks run once per builder implementation; they are
independent of Gauntlet timing. The Gauntlet exercises the built server with
AI-simulated hats in realistic play scenarios. It is a required quality
check. Its purpose is to surface bugs that structured verification missed.

**Convergence handshake.** After each Gauntlet execution, the builder maps
every failure to the convergence-loop metric it affects per REQ-208. The builder then
re-enters Phase 2 of the convergence loop (§6.5) for only those metrics,
corrects the root cause, and re-runs the Gauntlet — up to 2 Gauntlet
iterations total. Each Gauntlet-triggered re-entry receives a fresh 3-attempt
budget for the affected metric, independent of any previous Phase 2 iterations
for that metric. The re-entry budget is recorded in DECISIONS.md (6) alongside
the failure mapping. The re-entry's no-delta detection (§6.5.1) applies
independently within the re-entry budget. If a metric that converged in Phase 2
is re-entered via Gauntlet and fails to re-converge within its re-entry budget,
the builder records the residual gap in DECISIONS.md (5) and proceeds — the
original convergence is not invalidated, but the Gauntlet-surfaced defect
persists as a known limitation. The mapping is recorded in DECISIONS.md (6) alongside each
failure artifact. A Gauntlet failure that maps to no convergence metric under
REQ-208 is logged as a process-compliance finding. The builder traces the root cause: if the
failure originates from an extraction defect (a misread rule, a miscategorized
action, a missing conceptual term), the builder records the specific Phase 1
metric affected and re-enters Phase 1 for only that metric's domain — following
the same per-metric re-entry model as Phase 2 failures. Extraction-rooted
Gauntlet failures that re-enter Phase 1 count against the Phase 1 iteration
budget (3 attempts per metric-targeted step) independently of Phase 2 budgets.
If the root cause is a construction defect that maps to no existing Phase 2
metric, the builder re-enters Phase 2 with all metrics in scope and records the
novel defect class in DECISIONS.md (6) with a proposed metric mapping for
future builds.

**Independent invocation.** The Gauntlet must also be re-run whenever server source
code changes — after Enrich, after every spec-driven update (REQ-098),
and after any manual code modification. A previously-passing blocking sub-workflow that now
fails is a defect. Gauntlet results are recorded in DECISIONS.md (6).

**Workflow completion.** The Build workflow is not complete until the Gauntlet
exits with all Gauntlet sub-workflows passing or the builder records 2
iterations without improvement (see Exit criteria below), and both
ruleset-facing verification workflows (G0 step 2 and G4) pass. The Gauntlet
gates both `production` and `quick-build` builds — any build that creates or modifies
tools must pass the Gauntlet before marking complete. In `production` mode
the build additionally requires the assumption audit (REQ-101), the audit steps
with auditor pre-flight (§6.5), full post-write verification on every file
(§6.5), and cross-model auditing when available (§6.5.2). These are optional in
`quick-build` mode; a quick-build-mode build records a `quick-build` annotation in
DECISIONS.md (6) listing which rituals were skipped and is not handoff-ready.
Marking a workflow complete without a passing Gauntlet is a process defect. The
Gauntlet findings and pass/fail disposition are recorded in DECISIONS.md (6).

**Method.** The builder starts two MCP client connections to the same server process
sharing one `TTRPG_DATA_DIR` — one connection for the Game Master hat
(`set_hat("game_master")`), one for the Player hat (`set_hat("player")`).
Both connections target the same Novel via `TTRPG_NOVEL`. The builder interleaves
calls between the two connections to simulate realistic turn-taking: the Player acts
(moves, attacks, asks questions), the GM adjudicates (narrates outcomes, escalates,
manages state). Every scenario states its objective, the tool calls to make, which
hat calls each, and the pass criterion.

**Verification principle.** Gauntlet sub-workflows verify state through tool-observable
surfaces — `character_sheet`, `session_recap`, `spec_health`, `hat_briefing`,
tool output — where the same assertion can be expressed through a tool call. The
on-disk state format is tested by verification workflow G4 (Appendix F derived tests, T72/T77) and
is an implementation detail. A Gauntlet sub-workflow that reads raw state files to
verify behavior observable through tools will become stale when the state model
changes during a spec-driven update (REQ-098). Direct file reads remain valid in
S17 (file removal) and S15 (corruption) where the pass criterion is a
file-system-level assertion.

**Gauntlet sub-workflows.** The builder must execute all sub-workflows. A sub-workflow passes when every
assertion in its pass criterion holds. A failure is recorded as a finding in
DECISIONS.md (6).

**Failure artifacts.** When a sub-workflow fails, the builder records in DECISIONS.md (6):
(i) the specific assertion that failed, with expected and actual values; (ii) the
full tool request and response that triggered the failure; (iii) a server state
snapshot captured immediately after the failure; (iv) a diagnostic trail showing the
narrowing steps taken to identify the root cause. A finding that omits any of these
four items is incomplete and blocks handoff.

1. **Tool surface sweep** — call every registered tool at least once with valid input;
   no crashes, hangs, or unexpected error codes. (Blocking.)
2. **Character creation workflow** — step-by-step and quick creation; correct derived
   stats; roster import; undo restores pre-creation state; no active Novel →
   `[STATE_CONFLICT]`. (Blocking.)
3. **Encounter setup** — combat init with entities and dangers reports round counter, turn order, participant classification.
4. **Simulated combat session** — turn resolution, HP tracking, condition effects, round
   advancement over ≥3 rounds with deterministic seeds. (Blocking.)
5. **Combat state survival** — HP, conditions, round counter, turn order restored identically
   after restart (verified through tool-observable surfaces). (Blocking.)
6. **Cross-hat boundary enforcement** — GM-only tools blocked from Player; no GM-only content leaks. (Blocking.)
7. **Table generation sweep** — every generation table produces valid ruleset results; GM-only tables blocked from Player.
8. **Search and canonical lookup** — exact/prefix/substring search returns correct sections;
   canonical lookups resolve by name and aliases; source quoting present; NOT_FOUND with
   enumeration.
9. **Condition lifecycle** — conditions apply, affect mechanics, expire by ruleset triggers; manual removal works.
10. **Undo during combat** — undo reverts combat state; blocked during pending workflows; succeeds after resolution.
11. **Workflow cancellation** — cancel restores pre-workflow state; tool works after cancellation.
12. **Roster durability** — roster baselines immutable; re-import produces fresh copy matching baseline. (Blocking.)
13. **Novel isolation** — entities, adventures, generated content do not leak between Novels.
14. **Edge cases** — (a) empty strings/missing params return `[INVALID_INPUT]` or
    `[MISSING_PARAM]`, no crash; (b) 0 HP triggers ruleset outcome; (c) heal above max
    caps at max; (d) 5 rapid calls complete without timeout/corruption; (e) ambiguous
    alias → `[AMBIGUOUS]` with entries enumerated; (f) unknown decision → `[NOT_FOUND]`
    with valid IDs; (g) same seed → identical results, different seeds differ;
    (h) `spec_health` under Player hat returns only player-filtered metrics.
15. **Stress and recovery** — (a) two connections sharing one data directory: reads reflect
    latest writes, no stale reads/write conflicts/deadlocks; (b) corrupted state file →
    `[WARNING]` in `spec_health` enumerating corrupted Novel, no crash, uncorrupted
    Novels/roster continue working; (c) 10 rapid `set_hat` alternations → no lost state
    or crash after final switch; (d) 50-round combat with 2 entities + 2 dangers using
    deterministic seeds → round counter reaches 50, conditions persist, `session_recap`
    summarizes all rounds, memory hasn't doubled. (Blocking.)
16. **Narrative state** — scene, NPC, countdown, lore, and briefing tools work end to end with deterministic seeds.
17. **Novel lifecycle and persistence** — create/resume/end/switch cycle works; state persists
    to disk and restores; `end_novel` confirmation workflow removes file + backup; ended
    Novel blocks resume and switch. (Blocking.)
18. **Novel isolation and adventure generation** — generated adventures are Novel-scoped, hat-filtered, searchable, regeneratable.
19. **Novel setup tracking and encounter generation** — setup metadata tracks completion;
    `generate_encounter` produces batch state (scene + NPC + lore) as single undo target.
20. **Hat briefing correctness** — populated Novel: Player sees entity stats without
    confidence breakdowns/GM-only lore; GM sees all content; briefing adapts to scene type
    changes. (Blocking.)
21. **Lorebook interchange** — export → modify → import dry-run (no side effects) → import
    merge (entry restored) → re-export matches original; import replace overwrites. (Blocking.)
22. **Campaign endurance** — 2 entities, 3 NPCs, 2 countdowns, 3 lore entries across 30
    combat rounds in 3 confrontations: all lore still triggers, ≥100 audit-log entries,
    `session_recap` returns correct final state, memory hasn't doubled, Novel file ≤5 MB.
    (Blocking.)
23. **Workflow validation** — `[NEED_INPUT]`: unknown decision/option → `[NOT_FOUND]` with
    enumeration; cancel restores pre-workflow state; second workflow → `[STATE_CONFLICT]`;
    undo/redo/set_hat blocked during pending workflow; valid option drains workflow; pending
    workflow survives server restart. (Blocking.)

**REQ-108 — Gauntlet traceability.** The builder must ensure at least one
Gauntlet sub-workflow exercises each requirement in §5.5 (Hats and Access),
§5.6 (State and Lifecycle), §5.7 (Determinism, Safety, and Performance), and
the error contracts of REQ-002 (Error taxonomy). The builder records a
sub-workflow-to-REQ mapping in DECISIONS.md (6) — one entry per covered REQ,
naming the sub-workflow(s) that exercise it. When a REQ in these sections
changes during a spec-driven update (REQ-098), the builder re-examines every
sub-workflow mapped to it. Gaps — a REQ in the covered sections with no mapped
sub-workflow — are logged as process-compliance findings and must be resolved
before handoff. New REQs added to the covered sections during a spec revision
require the builder to propose at least one new Gauntlet sub-workflow
exercising their contract; the proposal is a finding, not a blocker. _Check:_
T107.

**REQ-141 — Input-validation convergence metric.** The convergence handshake
in §6.6 must map Gauntlet failures to four convergence metrics, adding
"input-validation gap" to the existing three (MUST-coverage gap,
mechanics-fidelity defect, process-compliance omission). A sub-workflow
failure attributable to incorrect input handling — malformed parameters
accepted without error, valid inputs rejected, error categories
misclassified, or corrective-action text missing — maps to the
input-validation metric. The builder re-enters Phase 2 of the convergence
loop (§6.5) for only the affected metric. A failure that maps to no metric
is a novel defect class and re-enters Phase 2 with all four metrics in
scope.

An input-validation failure is recorded in DECISIONS.md (6) with the
failing input value, the error category returned (or absent), and the
expected error category per REQ-002.

This metric covers Gauntlet sub-workflow S14 (Edge cases) and any other
sub-workflow exercising REQ-001 (Response contract) or REQ-002 (Error
taxonomy) through their input contracts. _Check:_ T163.

A single S22 execution that exceeds 10 minutes of wall-clock time does not fail
the sub-workflow but is recorded with the actual duration. Three consecutive S22 runs
exceeding the budget trigger a scope re-evaluation recorded in DECISIONS.md (5).

**Per-scenario budget.** Each sub-workflow must complete within 5 minutes of
wall-clock time, except S15 (10 minutes), S22 (10 minutes), and S23 (3
minutes). A sub-workflow exceeding its individual budget does not fail but
is recorded with actual duration in DECISIONS.md (6). Three consecutive
runs of the same sub-workflow exceeding its budget trigger a scope
re-evaluation recorded in DECISIONS.md (5).

**Global budget.** The full Gauntlet run of all sub-workflows must complete
within 60 minutes of wall-clock time. A run exceeding the budget is
recorded with actual duration and per-sub-workflow timings in
DECISIONS.md (6). The operator may increase the budget for rulesets
exceeding 2,000 indexed items (REQ-100 Huge tier).

**Structured encoding.** For mechanical consumption the builder encodes each sub-workflow
as a structured record (`scenario_id`, `objective`, `blocking`, `steps`). The prose
descriptions above are canonical; the structured encoding is a lossless transcription.

**Convergence integration.** The convergence handshake (see Timing block above)
governs the Gauntlet ↔ Phase 2 feedback loop.

**Improvement** is measured per iteration: fewer total assertion failures, or at
least one blocking sub-workflow downgraded to non-blocking. Two stalled iterations is
a stop; residual failures are logged in DECISIONS.md (5).

**Regression assertions.** A bug discovered via Gauntlet failure and fixed via convergence
gets at least one new regression assertion recorded in DECISIONS.md (6).

**Assertion compression.** After spec-driven updates or five Gauntlet iterations, audit
accumulated regression assertions for redundancy. Subsumed assertions are removed
and logged in DECISIONS.md (6) with the subsuming citation.

**Exit criteria.** The Gauntlet completes when all sub-workflows pass and all blocking
failures are resolved. Failures in sub-workflows 1, 2, 4, 5, 6, 12, 15, 17, 20,
21, 22, and 23 are blocking — Build is incomplete until they pass. Other failures are
accepted limitations after 2 stalled iterations, logged in DECISIONS.md (5). All
failures are recorded with severity classification and diagnostic trail.

A build with more than 3 unresolved non-blocking Gauntlet failures SHALL not be
declared handoff-ready without explicit operator acknowledgment. The count of
unresolved non-blocking failures SHALL be recorded in DECISIONS.md (5) alongside
a per-failure severity assessment. The operator may override this ceiling by
recording an acceptance entry in DECISIONS.md (5). This rule applies at handoff
verification time (§9 H13) — non-blocking failures accumulated and logged during
the build process are re-counted at handoff.

**REQ-142 — Blocking classification principle.** A Gauntlet sub-workflow is
classified as blocking when it exercises a correctness property whose
failure would make the server unsafe to use in any play session — state
loss, hat-boundary violation, data corruption, unrecoverable crash, or
undetectable incorrect results in core play mechanics. A sub-workflow is
non-blocking when it tests a property whose failure degrades experience but
does not make the server unsafe — graceful-degradation edge cases, cosmetic
output issues, or features documented as deferred in DECISIONS.md (5).

The blocking classification of every sub-workflow is recorded in
DECISIONS.md (6) with the safety property it protects and the REQ(s) it
derives that classification from. When a new sub-workflow is added, the
builder classifies it against this principle and records the rationale.
When a sub-workflow's classification changes, the builder records the
trigger — a spec revision, a discovered defect class, or an operator
override. _Check:_ T164.

**REQ-208 — Gauntlet convergence metric mapping.** The builder SHALL
classify each Gauntlet failure by applying these rules: a failure from a
missing tool or resource maps to MUST-coverage; a failure from incorrect
tool output or behavior maps to mechanics-fidelity; a failure from missing
or stale pre-build answers or verification records maps to
process-compliance; a failure from incorrect input handling maps to
input-validation (REQ-141). When a failure matches multiple rules, the most
specific rule applies. The classification rule applied SHALL be recorded
alongside each mapping in DECISIONS.md (6). A Gauntlet failure that maps to
no convergence metric under these rules is logged as a process-compliance
finding — the builder records the novel defect class in DECISIONS.md (6)
with a proposed metric mapping for future builds. _Check:_ T250.

**Surface-to-scenario mapping.** During spec-driven updates (REQ-098), the builder
selects Gauntlet sub-workflows based on which surfaces changed — not the blanket
set. The gap audit identifies the changed tools, resources, and prompts; the
builder maps each to scenarios via the table below. A sub-workflow is selected when
any surface it exercises appears in the gap audit's implemented-disposition rows.
S1 is always selected when new tools are added or existing tool signatures changed.

| Changed surface                                             | Gauntlet scenarios selected |
|-------------------------------------------------------------|-----------------------------|
| Character creation, roster, workflows (REQ-042, REQ-056, REQ-104) | S2, S11, S12, S23 |
| Combat lifecycle, initiative, dangers (REQ-043)             | S3, S4, S5 |
| Conditions, condition management (REQ-206, REQ-217)         | S9 |
| Search, canonical lookups (REQ-057, REQ-060, REQ-061)      | S8 |
| Table generation                                            | S7 |
| Hat gating, hat briefing, entity scope (REQ-032, §5.5)     | S6, S14h, S20 |
| Undo, redo, snapshots (REQ-041, REQ-116)                   | S10, S11 |
| State model, Novel persistence (REQ-065, REQ-092)          | S5, S13, S15, S16 |
| Novel lifecycle (create/resume/end/switch)                  | S17 |
| Lore, enrichment, adventure generation                     | S18, S19, S21 |
| New tool added or tool signature changed                    | S1 + category-mapped scenarios |
| New prompt, resource, or hat-scoped content                 | S6, S20 + content-specific |
| Error taxonomy, input validation (REQ-001, REQ-002)        | S14 |
| Campaign endurance, stress (REQ-052)                        | S15, S22 |

This surface-driven selection applies to all incremental updates — full
spec-driven updates (§6.7), enrichment re-runs (§11), and spec-queue-cycle
syncs — not only the blanket Gauntlet run.

#### Inform Gauntlet

The Inform server — the `@holonovel/inform` npm package (ruleset-free per §6.2) — is
verified through a separate Gauntlet of world-model-specific sub-workflows. The Inform
Gauntlet runs when the inform package is built and before it is published, as part of
the inform package's own verification. It is not part of TTRPG builds — TTRPG servers
consume the published inform package as a build-time dependency and skip the Inform
Gauntlet sub-workflows. The same Method, Verification principle, Failure artifacts,
Budget, and Structured encoding contracts apply (§6.6). Blocking sub-workflows SHALL
pass; non-blocking failures are recorded as accepted limitations.

**Inform Gauntlet sub-workflows.**

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

4. **CRUD round-trip** — create a room via `create_room`, create a thing in it,
   create an exit connecting it back; read room resource, assert name,
   description, things, and exits match. Delete the room — assert contained
   things and exits removed, audit log records all mutations. Undo — assert
   deleted room and contents restored. (Blocking.)

5. **convert_source with fixture** — call `convert_source` with the Appendix K
   fixture. Assert object counts (3+ rooms, things, exits), linked annotations,
   and auditor log entry. Assert command("look") shows Entrance Chamber with
   content. Call `convert_source` on the same Novel — assert `[STATE_CONFLICT]`.
   (Blocking.)

6. **Property state propagation** — open a closed container, assert contents
   accessible. Close it, assert contents blocked. Lock a lockable door — assert
   it cannot be opened. Unlock it — assert it opens. All property mutations
   appear in audit log and `session_recap`. (Blocking.)

7. **World-model resources** — call `room://<id>`, `thing://<id>`,
   `world://map`, `world://kinds`. Assert room and thing content matches state.
   Assert map shows correct adjacency. Assert kinds resource lists the kind
   hierarchy, property contracts, and parser command catalog from the indexed
   provider documentation. Swap to Player hat — assert GM-only metadata
   excluded from all four resources.

8. **Large-map navigation** — populate 50+ room world model. Navigate from one
   end to the other (≥10 sequential moves). Assert each room description is
   correct, no state corruption, memory stable. `session_recap` covers
   traversal history.

9. **Empty world model** — on a Novel with zero rooms (fresh create, no
   adventure loaded), every parser command returns not-implemented directing
   to populate the world model. CRUD tools still function — create a room,
   assert parser commands now resolve against it.

10. **Hybrid adventure load** — load an adventure module containing `## World`
    assertions (Appendix K fixture format) via `load_adventure`. Assert
    world-model tier populated, room descriptions match, things placed in
    declared rooms, exits connected. Assert `search_rules` finds adventure
    prose. Assert `hat_briefing` surfaces adventure content hat-filtered.
    (Blocking.)

**Inform Gauntlet surface-to-scenario mapping.**

| Changed surface                                    | Inform Gauntlet scenarios |
|----------------------------------------------------|---------------------------|
| @holonovel/inform package changed (new version)     | All (1–10)                |
| Room navigation, parser commands                   | 1, 2, 8                   |
| Object interaction, properties                     | 3, 6                      |
| CRUD, state mutations                              | 4                         |
| convert_source, hybrid parsing                     | 5, 10                     |
| Hat filtering, resource URIs                       | 7                         |
| Empty state, error handling                        | 9                         |

### 6.7 Spec-driven updates

*Prepare:* Load files from `build-phase-map.md` Spec-driven update row:
03-build.md §6.7 plus files changed per git diff.

**REQ-098 — Spec-driven update workflow.** When an existing MCP server is updated
to match changes in this specification, the operator must audit gaps across the tool
catalog, resource map, prompt list, state model, hat gating, and behavioral
contracts; produce a documented plan with gap dispositions (implemented / deferred /
waived) each citing the relevant REQ; implement changes with passing verification
workflows; restart the MCP server process and confirm `spec_health` reports the updated
specification version; re-run only those Gauntlet sub-workflows that exercise the tools, resources,
or prompts identified as changed by the gap audit. The builder selects scenarios
from the surface-to-scenario mapping in §6.6: a sub-workflow is selected when any
tool, resource, or prompt it exercises appears in the gap audit's
implemented-disposition rows. Sub-workflows not exercised by the changed surfaces
are skipped. S1 (tool surface sweep) is always selected when new tools are added
or existing tool signatures changed. Zero failures on all selected sub-workflows;
implement any unimplemented Gauntlet sub-workflows from §6.6; and
record all gap dispositions in a dated DECISIONS.md entry.
The Inform Gauntlet sub-workflows (I1–I10, §6.6) are not included in TTRPG
spec-driven updates — they are run separately when the `@holonovel/inform` package
is built and published.

**Delta classes.**

| Class   | Trigger                                                       | Verification workflow                                                  |
| ------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| Patch   | Spec wording only — no REQ added, removed, or scope-changed  | G0 only; record version bump in DECISIONS.md; no Gauntlet |
| Minor   | REQ bodies changed, new REQs added, old REQs removed; no state model or tool-surface change | Full gap audit; Gauntlet sub-workflows per surface-to-scenario mapping (§6.6) |
| Major   | State model changed, new tools/prompts/resources mandated, hat-gating contract altered | Full gap audit; full 23-sub-workflow Gauntlet |

The builder classifies the delta during gap audit. A major spec version increment
always triggers the Major class. The operator may override the classification at
intake (U2).

**Gap audit method.** The builder first compares the server's recorded spec version
(`spec_health.spec_version`) against the current spec version. When the
current version is unchanged, the builder reports `[OK] Server is current
(spec version <version>)` and exits without mutation. When the current version
has advanced, the builder proceeds to compare live registrations as follows:
the builder compares the server's live registrations — tool catalog
(tools/list), resource map (resources/list), prompt list (prompts/list),
and `spec_health` counts — against the spec's output contracts (§7.3), tool-surface
conventions (§7.4), state model (§7.7), and REQ-032 hat gating. Behavioral
contracts are verified by Gauntlet re-run. The audit produces one row per identified
gap with: the affected surface, the citing REQ, the disposition, and the reason.

**State migration.** When the state model changes, the builder verifies that
existing Novel state loads without error under REQ-065 compatibility rules. Novel
state fields present in stored state but absent in the updated model are preserved
as inert data; fields absent in stored state receive defaults. A load failure
during a spec-driven update is a blocking defect.

**Budget.** The operator may set a wall-clock budget in minutes at intake. If the
budget is exceeded before the Gauntlet passes, the builder reports residual gaps
and the operator chooses: accept the partial update, extend the budget, or revert.
No budget set → no limit.

_Check:_ A dated DECISIONS.md gap-disposition entry exists with each gap citing its
relevant REQ and disposition reason. `spec_health` reports the updated specification
version. Gauntlet sub-workflows selected per the surface-to-scenario mapping in §6.6
pass with zero failures. `spec_health` reports
`last_spec_review` and `last_gauntlet` fields populated with ISO dates.

**Spec fetch.** When U3 is `yes`, the builder fetches the latest specification
from the repo URL recorded at build time before beginning the gap audit. The
fetched copy is compared against the embedded `spec://build` copy; a diff
summary is reported. The embedded copy is updated to the fetched version.
A successful fetch records the new content hash in DECISIONS.md. An unreachable
remote records a fetch-failure notice and does not block the update — the gap
audit proceeds against the embedded copy. Network access during the Update workflow
is a build-time operation and does not violate REQ-051.

