# Changelog

## 2026-08-02 — README restructured and MIT license added

- Added LICENSE file (MIT).
- Changed package.json license from ISC to MIT; added README.md to lint scope.
- Restructured README.md: renamed "Purpose" to "What is Holonovel?" and
  "Implementation recommendations" to "Implementation notes".
- Added new README sections: Who is this for, Project status, Prerequisites,
  Quick Start, Contributing, License.

## 2026-08-02 — Verbose output and source-quoting requirements

- Added REQ-060 (Verbose output) — tool responses must be comprehensive, narrative-style descriptions
  presenting every field, the full calculation path, and prose outcomes rather than terse data dumps.
- Added REQ-061 (Source quoting) — lookup and rule-derived tool responses must include a verbatim
  Markdown source excerpt with file-and-anchor attribution, separated by a horizontal rule.
- Added T47 (verbose output) and T48 (source quoting) automated tests to §7 derived test table.
- Updated §6.3 Output conventions with source-quoting format.
- Updated §6.4 Tool-name conventions with source-quoting requirement for lookup tools.

## 2026-08-02 — Sheet parser bug fixes and defensive-parsing spec

- Fixed 8 bugs discovered through comprehensive integration testing of the sheet tools:
  - `parseString` now stops field capture at newlines, preventing over-capture across labeled fields.
  - HP regex now handles comma-separated numbers (`2,100` → 2100).
  - Cover always extracts "Total Cover" instead of single-char "T".
  - Weapon regex handles multi-gunner notation `(N Gunners)`, optional `*` after attack, and non-parenthetical damage descriptors.
  - Crew/passenger capture filters OCR artifacts (e.g., `Cover**` leaking into crew field).
  - Pilot overlay INT guard changed from `>= 0` to `> 0` to prevent -5 penalty when abilities are unparsed.
  - `create_character` now initializes `trainedSkills` as empty array instead of all class skills.
- Added §7a (Defensive parsing) to `character-sheet-generator.md` with field-capture rules.
- Added production-data testing requirement to §7 test coverage table.

## 2026-08-02 — Prestige class prerequisite spec clarifications

- Expanded talent prerequisite model (§6.4): now supports both count-based
  (`{ count: N }`) and name-based (`{ names: [...] }`) talent requirements for
  prestige class entry.
- Clarified feat-name matching (§6.4): parenthetical qualifiers in feat names
  (weapon types, skill subcategories) must be preserved during prerequisite
  comparison, not stripped.
- Acknowledged hardcoded prerequisite fallback (§6.4): when prestige class
  prerequisite text is embedded in prose and not uniformly parseable from the
  ruleset Markdown, hardcoded prerequisite objects in the class progression
  table are an acceptable fallback (cross-referenced against source).
- Clarified special-prerequisite display (§6.3): narrative/organizational
  prerequisites now appear as an informational note on successful validation,
  not only on failure.

## 2026-08-02 — Spec improvements from first-principles analysis

- Added reading map (§1.3) mapping build stages to required sections.
- Added "See also" cross-references to 16 REQs in §4 linking to §6 refinements.
- Added ruleset complexity classification (§5.2a) after structural pass — minimal,
  moderate, large — adjusting checkpoint depth and shadow re-extraction scope.
- Added capabilities self-assessment (§5.2b) enumerating recognized and unfamiliar
  mechanics before extraction.
- Added decision trail for ambiguous content-type classifications (§5.3): record
  matched signals, rejected alternatives, and classification basis.
- Added crash-recovery instruction (§5.6): resume from last complete stage in the
  structured task list.
- Added confidence calibration report at Discovery checkpoint (§5.6): builder
  surfaces the 10 most uncertain classifications for operator review.
- Added HTML comment markers (`<!-- @section ... -->`) to DECISIONS.md section
  template (§8) for mechanical verification.
- Added H12 cold-checkout replay evidence check to automated handoff gate (§8.1,
  Appendix G.13).
- Added Type column to derived test table (§7) classifying each test as Automated
  or Manual, with a requirement that automated tests ship runnable scripts.
- Populated Spec version column in Appendix E with date-stamped versions
  (2026-08-02) and added version-change conventions.
- Added cross-file fixture supplement (Appendix B.5, `tin_lanterns_gear.md`) and
  derived test T46 for cross-file dedup and inline mechanical extraction.
- Updated `scripts/validate.ts` for test-table header compatibility (Type column)
  and spec-version format validation.

## 2026-08-01 — Spec amendments from SWSE MCP server testing

- Added search-result confidence rule to REQ-011: `search_rules` confidence reflects query-term match
  strength, not section extraction confidence. HIGH requires a non-stop query token in the title or a
  bold-leading term; MEDIUM when tokens appear only in body text; no match returns `[NOT_FOUND]`.
- Added empty-table handling to REQ-024: when the ruleset contains zero rollable generation tables,
  `roll_on_table` is unregistered or returns a clear "no tables" message — the tool description must
  not advertise canonical values that resolve to nothing.
- Clarified talent extraction in REQ-057: a talent tree's member talents are each a distinct extracted
  item. `lookup_talent` returns the full entry by tree name or individual talent name.
- Updated Section 6.3 search-results output convention to document query-match confidence levels
  (HIGH/MEDIUM/LOW with `[NOT_FOUND]` for no match).
- Added lookup-dedup convention to Section 6.3: duplicate content across source files is collapsed to
  the first file in intake order with an `Also in:` line. NPC stat blocks default to baseline
  condition; condition-track variants are computed, not stored as separate lookup entries.
- Added cross-file dedup rule to Appendix A.4: identical entries are collapsed to the first source;
  content differences in mechanical fields are flagged as findings and surfaced in `spec_health`.
  Individual talent entries within trees are each extracted as distinct items.
- Updated A.4 content-type detection: feat detection broadened to accept `**Prerequisites:**`,
  `**Benefit:**`, and `**Special:**` markers alongside `**Prerequisite` and `**Effect:`.
- Updated A.4 content-type detection: force-power detection broadened with descriptor tags
  (`[*Telekinetic*]`, `[*Mind-Affecting*]`, `[*Dark Side*]`, `[*Light Side*]`);
  starship-maneuver detection now excludes sections with DC tables to disambiguate from
  force powers.
- Added §6.2 rule: `create_character` returns the roster ID in its response so callers
  can pass the correct identifier to `import_character` without guessing counter namespaces.
- Added §6.7 rule: game-dependent tools must check for an active game before executing
  and return `[NO_ACTIVE_GAME]` when none is active.
- Added §6.5 bounded-domain validation note: `create_character` must validate `species`
  and `heroic_class` parameters against the extracted index before creating.

## 2026-08-02 — Character creation validation, prestige class gating, and workflow expansions

- Tightened §6.4 character creation parameters: `species` and `heroic_class` are required
  non-empty strings; `heroic_class` validates against `heroic-class` content type only; prestige-class
  entries are rejected with `[INVALID_INPUT]` explaining the level 7+ and prerequisite requirement.
- Added name parameter constraints in §6.4: empty/whitespace strings rejected with
  `[INVALID_INPUT]`; maximum 100 Unicode code points.
- Added character creation output convention to §6.3: when ability scores are assigned, output
  appends ability scores; when class table is extractable, output includes derived statistics
  (HP, defenses, BAB, trained skills).
- Added droid-character bullet to §6.4: when species resolves to a droid and degree sub-types
  exist, `create_character` raises `[NEED_INPUT]` for degree selection; Force-Sensitivity
  classes rejected with `[RULE_VIOLATION]` unless the ruleset provides an exception.
- Added destiny, background, and organization steps to §6.4: when the ruleset contains these
  content types, `create_character` includes optional skippable `[NEED_INPUT]` steps.
- Expanded REQ-056 (Advancement workflow) with multiclassing: when the ruleset defines a
  multiclassing procedure, model a server-side workflow accepting class name and applying
  multiclass rules (starting feats, skill access, BAB, defenses, HP).

## 2026-08-01 — Reconciliation restart and lifecycle improvements

- Added rebuild, quality-check, and restart-verification step to §5.7 reconciliation: before re-running
  gates, rebuild and pass the server's own quality checks; restart the MCP client and verify the updated
  server is serving via a witness tool; record the restart and witness output as evidence.
- Added MCP process lifecycle note to §5.6 after the Layer 6 checkpoint: the server is a child process
  over stdio pipes; killing from outside forces the client to respawn; verify the respawned binary after
  any rebuild.
- Extended §7 evidence record format to reconciliation operational steps (rebuild, restart, witness
  verification).

## 2026-08-01 — Build-hardening amendments from the SWSE build retrospective

- Added handoff figure-report requirement to Section 8: headline figures (section counts,
  HIGH/MEDIUM/LOW distributions, confidence scores, registry counts) are regenerated by a single
  report command at handoff and after any detection or extraction change; all four artifacts update
  in the same step as the change, and a diff against a fresh report run is a Section 5.6 finding.
- Strengthened REQ-013 waiver validity: enumerated invalid grounds ("tested manually", "not tested",
  "not yet modeled", or similar); a feature present in the corpus but not implemented is a defect
  with a remediation plan, not a waiver. Extended G.6: H6 verifies waiver grounds and fails on
  invalid ones; the negative control covers them.
- Added classification inventory and referee-scoping inventory deliverables to the Section 5.2
  structural pass, recorded in `DECISIONS.md` (Section 8, item (4)).
- Added classification-profile rule to Section 5.3: detection rules are written against the
  inventory before the first index build; the inventory and profile are recorded in
  `RULESET_MODEL.md` and `DECISIONS.md`.
- Restructured Appendix A.4: ruleset-independent framework plus per-ruleset classification profile
  (the existing pattern list is explicitly the first build's d20-style profile, not universal);
  added the parent-context rule (sub-sections matching no signal are evaluated against the parent
  chain) and the false-positive audit (sample at least ten sections per assigned type after the
  first index build; above ten percent sampled misclassification is a checkpoint finding).
- Added measurement discipline to REQ-011: one rule family per index rebuild, per-change delta
  logging in the checkpoint findings log; an unattributable confidence delta is itself a finding.
  Section 5.6 cites the delta-record rule.
- Strengthened Section 7 evidence records: an artifact's existence is never evidence; a gate
  without execution evidence is FAIL for Definition of Done purposes; reporting the gates complete
  requires every gate PASS or validly WAIVED under REQ-013.
- Made the scripted smoke-session harness a required build deliverable when Q7 selects a scripted
  equivalent (intake table and Gate 4): it covers every derived test whose requirements are
  implemented and is project code exempt from the artifact diet.
- Added pre-flight item (f) to Section 5.6: every edit is reconciled by re-reading the edited
  region; a failed edit assumed applied is a blocker.
- Extended G.13: H11 evidence is the captured launch transcript (or its hash) and the Q14
  schema-conformance result; the README entry's existence is not evidence.
- Fixed G.7 recording coverage: H1–H10 → H1–H11.

## 2026-08-01 — MCP client config schema verification

- Added Q14 intake question capturing the target MCP client's config schema documentation
  (field names, value formats, required fields, timeout).
- Strengthened Section 5.1 MCP client configuration check: replaced generic "syntactically
  valid" with a requirement to consult and conform to the Q14 client's documented schema.
- Strengthened Section 8 README config-entry requirement with a Q14 schema verification clause.
- Extended H11 handoff check to two-part pass criteria: launch succeeds (a), and config entry
  matches the Q14 documented schema (b). Added positive/negative control pairs for both.

## 2026-08-01 — Live-index, alias resolution, content-type detection, and audit type safety

- Added live-registry requirement to REQ-023: prompt handlers read tool/resource/prompt
  registries at invocation time via module-level capture arrays, never static strings.
  Added T22a test (add stub tool, assert all four prompts reflect it; remove, assert
  absence).
- Added book-level `#` heading referee scoping to Appendix A: a `-- _<role> only_`
  marker on the file title scopes all `##` sections, overridable per-section.
- Added computed-confidence requirement to REQ-025: `spec_health` confidence is
  computed from extracted item counts at call time, not a literal string; includes
  formula expansion `HIGH=⟨n⟩, MEDIUM=⟨m⟩, LOW=⟨k⟩ → ⟨score⟩%`.
- Added live-index-derived option lists to Section 6.5: `[NEED_INPUT]` option lists
  for bounded domains (species, classes, etc.) derive from the rules index at call
  time, capped at 25 entries. Hardcoded arrays permitted only for ability
  abbreviations and persona roles.
- Added NOT_FOUND enumeration budget to REQ-002: error-message enumerations derive
  from the index at error time, up to a 500-character budget with truncation pointer.
- Added alias resolution at lookup boundaries to Section 6.4: every Query tool and
  `roll_on_table` applies Section 6.1 alias normalization before lookup; index is
  built with normalized tokens for exact-match lookup.
- Added audit entry point type-safety to Section 6.7: `addAudit` derives timestamp
  internally, requires `sessionId`/`action`/`result` with optional `entityId`, and
  accepts no partial object.
- Expanded Layer 6 acceptance check: fixture-specific tool absence, stub-tool prompt
  freshness check, and Gate 2 transcript dry-run.
- Added Appendix A.4 content-type detection heuristics (stat blocks, feats, force
  powers, equipment, species, skills, talent trees, prestige classes, destinies,
  starship maneuvers, guidance/prose) with classification rules.
- Added per-type extraction counts to Section 5.3: `RULESET_MODEL.md` includes a
  summary table per content type with section count, confidence distribution, and
  structural defects.
- Updated TOC, Appendix E manifest, and testtable for T22a.
- Added explicit one-server-per-ruleset constraint to Section 1 and Section 5:
  a second ruleset triggers a fresh server in a separate output directory, never
  merged into an existing server.

## 2026-07-30 — Expand character-sheet-generator with MCP App support

- Expanded `character-sheet-generator.md` with §6a MCP App support: HTML
  character sheet display with stdio-first architecture, HTTP fallback path,
  client-side Markdown parser, and host compatibility checks. Extended §0
  pre-check with MCP App readiness audit steps and `registerAppTool` persona
  gating notes.
- Renamed `character-sheet-from-pdf.md` → `character-sheet-generator.md` and
  updated all filename references in `README.md`, `package.json`, and
  `CHANGELOG.md` historical entries.
- Updated `README.md` implementation recommendations: reordered bullets,
  corrected the character-sheet description ("dual renderers" → two renderers
  plus optional MCP App HTML display), and refined Builds section wording.
- Added `opencode-raw-*.log` to `.gitignore`.

## 2026-07-30 — Rewrite README opening and Purpose section

- Rewrote `README.md` opening line and Purpose section as a three-paragraph
  elevator pitch: what problem Holonovel solves, how `holonovel.md` does it,
  and what features the resulting server provides. Trimmed verbosity in the
  Implementation recommendations section.

## 2026-07-30 — Consolidate ruleset-prep appendix, migrate validator to TypeScript

- Consolidated `holonovel-ruleset-prep.md` into Appendix H of `holonovel.md`:
  converted the cross-reference to full inline content, making the spec
  fully standalone. Deleted the now-redundant `holonovel-ruleset-prep.md`.
  Updated `README.md` project structure, recommendations, and project
  structure diagram to match.
- Migrated `scripts/validate.py` to `scripts/validate.ts`. Added
  TypeScript tooling (`tsx`, `typescript` ^7.0.2, `@types/node`) to
  `package.json`, introduced `tsconfig.json`, and added a `typecheck`
  script. Updated `package.json` validate and lint scripts, and removed
  the Python prerequisite from `.githooks/pre-commit` and `README.md`.
- Expanded `character-sheet-generator.md`: added a server pre-check
  section (§0) for auditing existing infrastructure before building,
  specified output resource template registration with per-tool
  counters, added REQ-002 compliance to error handling, restructured
  sections for clarity, and expanded the test documentation table.
- Added `session-*.md` to `.gitignore`.

## 2026-07-28 — Refine holonovel-ruleset-prep.md integration

- Added `holonovel-ruleset-prep.md` to the lint script in `package.json`.
- Refined `holonovel-ruleset-prep.md`: rewrote the blockquote cross-reference
  to Appendix A/F and fixed a typo ("improvise structure" →
  "improvise a structure").
- Tweaked `README.md` wording: "for rulesets" → "Run on rulesets" in the
  `holonovel-ruleset-prep.md` bullet, and "just under US $2" → "around US $2".

## 2026-07-28 — Convert character-sheet-generator from skill to prompt

- Created `character-sheet-generator.md`: converted the
  `character-sheet-from-pdf` opencode skill into a standalone build prompt
  document in the project root (same style as `holonovel.md`).
- Deleted `skills/character-sheet-from-pdf/SKILL.md` (and the `skills/`
  directory).
- Updated `README.md`: merged the character sheet section into the last
  bullet under "Implementation recommendations" and updated the project
  structure tree to reference the new prompt path.
- Updated `AGENTS.md` layer map to point to the new prompt file.

## 2026-07-28 — Add holonovel-ruleset-prep.md

- Added `holonovel-ruleset-prep.md`: a self-contained prompt for formatting
  TTRPG ruleset documents into Markdown structured for optimal ingestion by
  `holonovel.md`. Covers source intake, document structure, role scoping,
  tables, bold-labeled fields, procedures, dice and resolution, conditions,
  guidance vs. mechanics, special elements, output conventions, and a
  verification checklist.
- Updated `README.md`: folded the "Using the prompt" section into the first
  "Implementation recommendations" bullet and added a second bullet for
  `holonovel-ruleset-prep.md` for rulesets not yet in clean Markdown.
- Refined README.md language: tightened the `holonovel-ruleset-prep.md` bullet,
  added "Use" to the TypeScript and Deepseek Pro bullets, added a $2 cost
  note on the Deepseek Pro bullet, and shortened "opencode skill" to "skill."

## 2026-07-28 — Clarify role-scoping marker convention in Appendix A

- Reworded the role-scoping paragraph: `<name>` is now defined as the ruleset's
  own adjudicator term, and the parenthetical example is explicitly attributed to
  the Tin Lanterns fixture to avoid implying "Keeper" is a universal token.

## 2026-07-28 — Confidence threshold and handoff-gate clarifications

- R1: validate.py now reports the Appendix E manifest row count automatically;
  removed the stale hardcoded count from the Appendix E header (was "33", drift
  risk).
- R2: REQ-025 clarified — the player persona's filtered confidence score is the
  gating metric for the 80% threshold; the unfiltered referee/unassigned score is
  informational only.
- R3: REQ-011 now documents the MEDIUM-weight confidence ceiling: a ruleset where
  more than half of its sections carry MEDIUM book-level scoping cannot reach
  80% regardless of extraction quality.
- R4: Section 8.1 verification record template clarified — H1-H11 rows are
  mandatory; additional rows may be appended.
- R5: H5 pass criterion clarified — ruleset-derived attack resolvers that use the
  ruleset's own extracted model do not violate H5.
- Recommendations R6-R8 (test additions) implemented in the dnd2024 server
  build: T45b tests unfiltered `spec_health` confidence with a zero-LOW assertion,
  and a new H-row completeness test validates all 11 H1-H11 rows in the
  `DECISIONS.md` verification record.

## 2026-07-28 — Style guide compliance fixes

- Synced Contents with missing Appendix D.1 and G.1–G.13 subsection entries.
- Renumbered "Illustrative exchanges" heading to D.1.
- Added failure-mode tags (`_(F1)_`, `_(F3)_`, `_(F5)_`, `_(F6)_`) to 12 REQ
  headers that lacked them.
- Added T4 to REQ-012's `_Check:_` trailer, resolving an orphan-test warning.

## 2026-07-28 — Add character-sheet-from-pdf skill

- Added `skills/character-sheet-from-pdf/SKILL.md`: opencode skill for building
  character sheet rendering on top of a holonovel-built server.
- Updated `README.md` project structure and `AGENTS.md` layer map to reference
  the new skill.

## 2026-07-28 — Parsing heuristics expansion

- Appendix A: added table header detection (gap 1).
- Appendix A: added inline formatting preservation in table cells (gap 2).
- Appendix A: added fenced info-string handling for code blocks (gap 3).
- Appendix A: added callout classification heuristic (gap 4).
- Appendix A: added definition-list extraction (gap 5).
- Appendix A: added horizontal rule content-boundary handling (gap 6).
- Section 6.1: added Unicode normalization for quotation marks, dashes, and
  double-prime in canonical alias resolution (gap 7).
- Appendix A: added nested-list diagnostic for unmappable sections (gap 8).
- Appendix A: added role-scoping disambiguation for multi-word role terms
  sharing a final word (gap 9).
- Appendix A: added table caption association (gap 10).
- Appendix A: added strikethrough handling with content-finding flag (gap 12).
- Appendix A "Counted defect classes": expanded content-finding examples to
  cover nested-list unextractable sections and struck-through content (gaps
  8, 12).

## 2026-07-27 — Initial commit

- Moved `holonovel.md` from `~/Documents/` into this project directory.
- Added `.markdownlint.json` with prose line-length limit of 120 (tables and
  code blocks excluded).
- Added `scripts/validate.py` for cross-reference checking.
- Added `package.json` scripts (`lint`, `validate`, `check`) as task runner
  (`make` is unavailable on the build system).
- Prose lines exceeding 120 characters were re-wrapped near 110 columns; no
  text was added, removed, or reworded.
