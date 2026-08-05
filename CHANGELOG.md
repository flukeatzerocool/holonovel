# Changelog

## 2026-08-05 — Enrich job spec improvements (12 recommendations)

- §5.8: Added **REQ-103 — Enrichment reversion** — `revert_enrichment` tool removes all
  enrichment state, pure-state, idempotent, fully reversible. GM only, Player →
  `[FORBIDDEN]`.
- §5.8: Amended **REQ-084 — Action suggestions** — enrich-derived action patterns are now
  **inert** (must be GM-activated via Novel-scoped toggle) to match the inert-by-default
  principle.
- §5.8: Amended **REQ-080 — Enrichment boundaries** — every enrich finding now carries
  `collected_at` (ISO 8601 timestamp of collection) for staleness detection.
- §5.9: Specified **adventure_advice integration** in REQ-090 (category match by
  adventure_templates, keyword match against premise, genre tag for scenario_starters) and
  REQ-091 (keyword match against table_expansions, highest confidence first).
- §6.2: Restored **E4 budget cap question** — operator may override module budget caps at
  intake; overrides below spec minimum are rejected.
- §11.1 Structured outputs: Added `collected_at` timestamp to all enrichment items;
  timestamps surfaced in resource output.
- §11.1 Module 4: Action patterns changed from auto-active to **Inert** (matching
  REQ-084 amendment).
- §11.1: Added **Persona scope assignment rules** — three-tier rule for classifying
  enrichment content as game_master, player, or shared based on source language.
- §11.1 Budgets: Added note that E4 budget overrides must be ≥ spec minimum.
- §11.1: Added **LOW-confidence presentation** semantics — `[LOW]` tag distinct from
  `[supplementary]`, grouped after HIGH/MEDIUM items, signals reduced weight.
- §11.1: Added **Deduplication and conflicts** — contradictory findings both recorded;
  later item carries `conflicts_with` reference; LLM may flag to GM.
- §11.1 Idempotence: **Decoupled from spec version** — enrichment fingerprint now uses
  ruleset content hash + intake answers only; spec-only updates do not invalidate
  enrichment.
- §11.1 Verification: Added checks 7 (research depth — ≥1 item per module, ≥2 domains
  per module) and 8 (content relevance — ruleset-specific anchor required).
- §11.1 Reversion: Cites REQ-103.
- Appendix E: Added REQ-103 row.
- Appendix F: Added **T94** (enrichment reversion), **T95** (LOW-confidence tagging),
  **T96** (action pattern inertness), **T97** (collected_at completeness).
- README.md: Noted `revert_enrichment` and `collected_at` timestamp in Extend with Enrich
  section.

## 2026-08-05 — Build job quality improvements (12 recommendations)

- §6.4: Declared six-layer construction order as recommendation, not requirement —
  builders may organize differently if they pass the same acceptance checks.
- §6.2: Added viability pre-check after Gate 0 — counts mechanical-section proportion
  and warns operator below 30% density before discovery begins.
- §6.3: Added cross-format consistency check — builder samples 10 items spanning at
  least 3 categories to verify RULESET_MODEL.md and ruleset_model.json agree before
  construction.
- §6.5: Added no-delta detection — convergence activities that produce zero measurable
  improvement abort after one stalled cycle, with remaining activities continuing
  independently.
- §6.5: Added critical-mechanics floor — core resolution mechanic must maintain ≥85%
  confidence independently; below-threshold triggers `[core-mechanic-block]` finding
  requiring operator disposition.
- §6.5: Added unbuildable disposition — two criteria (core ≤50% confidence or >40% LOW
  mechanical sections) trigger a formal unbuildable declaration distinct from residual
  gaps.
- §6.5: Extended post-write verification with completeness check — builder maintains a
  file manifest; missing or empty files are convergence findings.
- §6.5: Cross-model audit now records `single-model-audit` annotation in DECISIONS.md
  when only one model is available — informational, not blocking.
- §6.6: Defined improvement measurement for Gauntlet cycles — fewer total assertion
  failures or at least one previously-blocking scenario downgraded to non-blocking.
  Replaced "2 cycles without improvement" with "2 stalled cycles" throughout.
- §6.6: Split Gauntlet S14 (edge cases) into S14a–S14h — empty strings, boundary HP
  (zero/max), rapid calls, ambiguous aliases, unknown decisions, seed replay, and
  spec_health persona filtering — each with its own pass criterion.
- §6.6: Reduced Gauntlet S20 (campaign endurance) from 50 combat rounds/5
  confrontations to 30 rounds/3 confrontations with proportional NPC churn and audit
  log threshold (≥100) — same structural coverage, lower execution cost.
- §6.6: Added structured encoding paragraph — builder encodes Gauntlet scenarios as
  `{scenario_id, objective, blocking, steps}` records for mechanical consumption;
  dnd5e Gauntlet fixture is reference implementation.

## 2026-08-05 — Convert job spec refinements (6 recommendations)

- Added REQ-102 — Source conversion contract (§5.2): normative requirement covering

- Added REQ-102 — Source conversion contract (§5.2): normative requirement covering
  Appendix G conversion, fidelity sampling, converter pinning, artifact disposition, and
  `spec_health` reporting. Added T93 (Manual) to Appendix F for conversion verification.
  Added REQ-102 row to Appendix E manifest (76 REQs).
- Fixed REQ-025 — spec_health: added `conversionFidelity` field (per-content-type rates,
  overall rate, sample set, ambiguities, confidence cap counts) which was recorded in the
  2026-08-03 CHANGELOG but missing from the REQ body. Field is absent when conversion was
  not selected. Added T93 to REQ-025's Check line.
- Defined fidelity measurement protocol (Appendix G): character-level diff after whitespace
  normalization and Markdown formatting stripping; mechanical content scope defined as
  `<table>` elements, `**Bold Label:**` patterns, and numbered-procedure blocks.
- Added web-scrape protocol (Appendix G): same-origin link following, 1s request spacing,
  3-retry exponential backoff (2/4/8s), 30s page timeout, non-content pattern exclusion,
  default depth 1. Failed pages logged in DECISIONS.md; 3 consecutive failures stops scrape.
- Added conversion threats to STRIDE (Appendix P): tampering (converter errors unscanned by
  fidelity sampling), denial of service (scrape exhaust/IP ban), information disclosure
  (credential/personal data in scraped source).
- Defined artifact disposition (Appendix G): flagged conversion artifacts receive a
  disposition — `fixed` (manually repaired before Gate 0), `waived` (accepted with
  justification), or `pending` (blocks Gate 0 until resolved).

## 2026-08-05 — dnd5e enrichment job + prior spec fixes

- Enrich job (§11) run on dnd5e MCP server. Research across 3 source domains (CBR,
  litrpgreads, Dungeon Dweller's Digest) plus retained existing sources (The Alexandrian,
  r/RPG, RPGbot). 6 output modules populated:
  - Voice examples — 5 items (3 player, 2 GM) sourced from professional RPG journalism
  - Briefing order — 1 recommendation derived from DM session-prep workflow advice
  - Lore templates — 10 environment-specific entries (tavern, forest, ruins, dungeon,
    mountain, night, city, underground, desert, coast) with DC-based skill checks
  - Action patterns — 10 player intent-to-tool mappings informed by the REACT improvisation
    method from litrpgreads.com
  - Supplementary guidance — 15 items across player, GM, and shared scopes
  - Adventure advice — 11 items covering templates (five-room, node-based, three-act),
    scenario starters (horror, mystery, heist, sandbox), and table expansions
  - Search limitation acknowledged: DuckDuckGo returned empty results for TTRPG-specific
    terms; content extracted primarily from page-level fetches. All module caps satisfied.
- §11.1: Added source-domain fallback protocol — fewer than 5 distinct domains is an
  "incomplete" disposition (does not block handoff). Builder may supplement from retained
  content, pre-seeded community domains, or an accepted limitation with re-activation
  conditions.
- DECISIONS.md: enrichment evidence recorded including source domain audit, module
  counts per budget, and search limitation disposition.

## 2026-08-05 — Spec clarifications from dnd5e nuclear-rebuild AAR

- REQ-025: Added live-computation requirement — `spec_health` counts must be derived from
  live registrations, not hardcoded literals.
- REQ-065: Clarified build fingerprint precedence — constructor-derived fields
  (specification version, ruleset hash, build timestamp) always override stored values.
  Stored values retained for drift comparison only.
- REQ-088: Added Novel-scoped operation enumeration — character creation, import, and NPC
  creation explicitly require an active novel. Silent orphan creation is a defect.
- REQ-098: Added MCP server restart requirement — after spec-driven code changes, the
  builder must restart the server process and confirm `spec_health` reports the updated
  specification version.

## 2026-08-05 — v2.1 "Structured Analysis" — SATs applied to the spec

- Researched Structured Analytic Techniques (Heuer & Pherson taxonomy: decomposition,
  idea generation, scenarios & indicators, hypothesis testing, cause & effect, challenge
  analysis, conflict management, decision support) and software design analysis methods
  (STRIDE, FMEA, fault tree analysis, ATAM, requirements traceability, ambiguity
  detection, coverage completeness). Identified 10 complementary analyses for Holonovel.
- New `scripts/scan-ambiguity.ts` — ambiguity scanner detecting hedging language, vague
  qualifiers, unbounded extensions, should-vs-must, and "or equivalent" patterns in REQ
  bodies. Added to `npm run check` pipeline.
- Extended `scripts/validate.ts` with `--traceability` flag — full REQ↔test↔gate
  traceability matrix, failure mode preventive-REQ count, and coverage completeness
  report (tool citations, state tier persistence/filtering, construction layer
  acceptance checks). Available via `npm run validate:traceability`.
- New `scripts/fmea.ts` — REQ-level failure mode and effects skeleton: severity
  scoring (1–5), detection coverage from Check: citations, failure mode tags. Flags
  high-severity REQs with no detection coverage.
- New `scripts/graph-deps.ts` — REQ dependency graph outputting DOT/Graphviz format.
  Identifies orphaned, source-only, and sink-only REQs.
- New `scripts/spec-health-trends.ts` — reports REQ count, test count, line count,
  heading/table/code-block counts, cross-reference density, and test-per-REQ ratio.
  Designed for tracking complexity drift across spec revisions.
- §3: Fault trees added for all six failure modes (F1–F6). Each tree traces root
  causes to specific REQs or gates; leaves without guards are explicitly flagged.
- §4: Standing Rule 8 added — "Red-team every REQ." Spec authoring discipline:
  four questions per REQ to challenge ambiguity, edge cases, and paradigm assumptions
  before finalizing.
- New Appendix P: STRIDE Security Threat Model. Maps spoofing, tampering,
  repudiation, information disclosure, denial of service, and elevation of privilege
  threats to existing mitigations and identified gaps.
- package.json: version 2.0.0 → 2.1.0; five new scripts: `scan-ambiguity`, `fmea`,
  `graph-deps`, `spec-health-trends`, `validate:traceability`. Updated `check`
  pipeline to include `scan-ambiguity`.
- README: Contribute section expanded with analysis suite table, STRIDE reference,
  and Gauntlet scenario count corrected (19 → 20).
- AGENTS.md: layer map updated — 3 new appendices (now A–P, was A–O), 5 new scripts,
  spec headings revised to reflect fault trees and red-team discipline.

## 2026-08-05 — v2.0 "Self Reflection" — Assumption audit remediation

- Full 47-assumption audit conducted against the specification. 5 blockers, 28
  risks, 14 latent assumptions identified and remediated across 28 changes. The
  audit challenged the spec's own premises: TypeScript prescription, AI-as-builder
  viability, convergence loop completeness, state persistence model, MCP ecosystem
  assumptions, and more. 18 of 18 audit recommendations implemented.
- §1: Play model clarifies solo-play scope; rebuild costs documented.
- §4: Technology stack prescribes TypeScript on Node.js 20+ as the default;
  alternative stacks allowed via Gate verification with DECISIONS.md
  justification. Distribution mechanism requirement added (Docker, binary, or npx).
- §5: Three new requirements — REQ-099 (confidence-floor operator
  acknowledgment), REQ-100 (performance benchmarking with 4-tier system:
  Light/Standard/Heavy/Huge), REQ-101 (assumption audit trail per build).
- §5: REQ-092 amended to require atomic writes and backup retention.
- §6.5: Convergence confidence thresholds tiered by ruleset complexity
  (Light ≥85%, Standard ≥80%, Heavy ≥75%, Huge ≥70%).
- §6.6: Gauntlet scenario S20 added (50-round campaign endurance with state
  accumulation and memory checks). Scenario count: 19 → 20. S20 added to
  blocking scenarios list.
- §7.1: Slug safety rules — Windows reserved names and 240-char path limits.
- §8: Gate 2b added — complex fixture replay for rulesets above 200 indexed
  items (mandatory pre-handoff).
- §9: AGENTS.md artifact requires a Troubleshooting section covering common
  failure modes.
- §10: Independent verifier gains adversarial round — 5 breakage attempts
  (persona switching, simultaneous Novel ops, seed injection, oversized state,
  path traversal).
- §11.1: Copyright note for Enrich job — operator responsible for source
  compliance.
- Appendix B.3: Golden transcript extended from 7 to 17 interactions —
  scene state, countdown lifecycle, combat with dangers, session_recap, undo.
- New Appendix N: Complex Fixture (skeleton — content TBD).
- New Appendix O: Behavioral Contracts — observable output contracts for dice
  resolution, canonical lookups, combat, state management, workflows, persona
  gating, and state survival.
- Appendix E manifest: 72 → 75 REQ rows (REQ-099, REQ-100, REQ-101).
- Appendix F test catalogue: 7 new test IDs (T86–T92).
- New `scripts/audit-assumptions.ts` — structural assumption auditor detecting
  unverifiable citations, magic numbers, absolute language, and untiered
  thresholds. Exit 0, warnings only. Added to `npm run check` pipeline.
- New MCP prompt `assumption_audit` referenced in REQ-101 — guides AI through
  a structured nine-category assumption audit.
- README: Contribute section updated with assumption audit workflow.
- package.json: version 1.4.0 → 2.0.0; `audit-assumptions` script added.
- AGENTS.md: layer map updated (75 REQs, Gates 0–5+2b, Appendices A–O,
  new script).

## 2026-08-05 — Complex Fixture authored (Captain Proton)

- Appendix N: Complex Fixture drafted in full — synthetic pulp-sci-fi ruleset
  "Captain Proton and the Static Prison" with 3 fixture files
  (captain_proton_rules.md, captain_proton_gadgets.md, captain_proton_foes.md),
  4 deliberate defects (broken cross-ref, mechanical contradiction, 2 content
  gaps), a 24-interaction golden transcript, and a 4-seed RNG witness table.
  The fixture exercises cross-file dedup, embedded stat blocks in prose,
  GM-only sections, and condition/combat/countdown/undo/session_recap end-to-end.
- Appendix B: Tin Lanterns framing note added — ties the golden fixture to the
  Captain Proton holo-novel tradition.
- Appendix N: synthetic-disclaimer footnote added — cites Appendix I as the
  catalog of permissively-licensed production rulesets.
- README: golden-transcript paragraph updated to reference both Tin Lanterns
  and Captain Proton fixtures.

## 2026-08-05 — Convergence loop enhancements (6 improvements)

- §6.5: Cross-model audit recommendation — audit subagent uses a different model
  when available, consistent with multi-vendor audit convergence research.
- §6.5: Auditor pre-flight injection check — one seeded defect before first real
  audit validates the subagent itself.
- §6.5: Complexity-adjusted confidence thresholds — builder may lower confidence
  bar (floor 70%) for rulesets exceeding 200 indexed items, documented in
  DECISIONS.md (5).
- §6.6: Gauntlet assertion compression — periodic audit of accumulated regression
  assertions removes subsumed or gate-duplicative entries.
- REQ-025: spec_health gains convergence_summary section (per-activity cycles,
  findings, residual gaps). T15 description updated. Absent when build incomplete.
- Appendix M: Convergence-driven REQ review — repeated finding class across
  multiple rulesets flagged as candidate for REQ revision.
- README: Updated convergence paragraph to reference six metrics and cross-model
  auditing.

## 2026-08-05 — Merged Sheet job into Convert and Build

- Removed Sheet (§11.2) as a standalone optional job. Character sheet PDF
  conversion is handled by Convert (character sheets were already accepted as
  source material). The ASCII renderer and `format` parameter on
  `character_sheet` are now Build baselines (§6.4).
- Specification: 4 jobs → 3 jobs. Deleted §11.2, S1–S3 intake questions, and
  cross-job deduplication for Sheet. Updated §6.6 and §8 Gauntlet references.
- README: "Extend with Enrich and Sheet" → "Extend with Enrich"; removed
  Sheet-specific prose.
- AGENTS.md: §11 layer map updated.

## 2026-08-05 — dnd5e REQ-098 update + Gauntlet (Build, Enrich, Sheet)

- dnd5e v1.3.0: 14 gap dispositions resolved across Build, Enrich, and Sheet
  jobs. Core fixes — `[WARNING]`/`[PARTIAL]`/`[RULE_VIOLATION]`/`[UNIMPLEMENTED]`
  error categories, macro expansion system (`src/macros.ts`), 14 new resources,
  11 new tools, enriched `spec_health` with fingerprint fields and novel listing.
- Enrich job (`src/enrichment.ts`): 5 voice examples, 10 lore templates,
  10 action patterns, 20 guidance items, 11 adventure advice items.
- Gauntlet: all 19 scenarios pass (was 16). S17 (novel lifecycle), S18 (novel
  isolation), and S19 (setup/encounters) implemented. S1 sweep covers 54 tools.
  All 7 blocking scenarios pass.
- §6.6: Added verification principle — Gauntlet scenarios verify state through
  tool-observable surfaces, not raw state file reads. Gate 4 tests the on-disk
  format; Gate 5 tests observable behavior. S5 and S17 clarified; T72 tagged as
  Gate 4 format test with cross-reference to the verification principle.

## 2026-08-05 — v1.4 "Gauntlet"

- OCE (Operational Confidence Exercise) renamed to "The Gauntlet" across the
  specification. Promoted to Gate 5 — both a Build completion requirement and an
  independently runnable verification gate. The Gauntlet must re-run after any
  server code change: Enrich, Sheet, spec-driven updates, or manual edits.
- Specification-driven development philosophy surfaced in the spec and README.
  The Mission (§1) now states that the specification is the permanent artifact
  and implementations are disposable. The README frames spec-driven development
  as the reader's long-term investment — the server is rebuilt whenever the spec
  changes, and everything the reader creates survives every rebuild.

## 2026-08-05 — OCE renamed to Gauntlet, promoted to Gate 5

- §6.6: "Operational Confidence Exercise (OCE)" renamed to "The Gauntlet"
  throughout the spec, README, and CHANGELOG.
- §6.6: added independent invocation trigger — the Gauntlet re-runs after any
  server code change (Enrich, Sheet, spec-driven updates, manual edits).
- §8: Gate 5 — The Gauntlet added to verification gates. The Gauntlet is both a
  Build completion requirement and an independently runnable gate.
- README: rebuild-from-spec feature clarified in "Build your own game server"
  section; six verification gates now including the Gauntlet.
- `spec_health` field `last_oce` renamed to `last_gauntlet` (breaking change for
  existing servers — dnd5e implementation pending).

## 2026-08-05 — Spec compression and philosophy hardening

- Spec compressed from 2,620 to 2,229 lines (-15%). All cuts are reductive — no
  requirements removed, only implementation detail stripped.
- Regained ~450 lines lost to bloat from v1.3 "Novels" and v1.4 "Lorebook" releases.
- Lore subsystem collapsed: 5 REQs (083, 094, 095, 096, 097) → 2 (083, 094).
  Implementation-prescriptive algorithms (priority sort order, sticky decay mechanism,
  token-budget fill order, trigger-scan caps) moved to builder domain. Grouping (095),
  suggestion (096), and token budget (097) folded into REQ-083 as declarative clauses.
- OCE scenarios (19) compressed from step-by-step test scripts to objectives + pass
  criteria. Builder derives method from REQs; convergence loop verifies.
- §7.8 (Guidance and persona knowledge) collapsed from 40-line catalog duplicate
  of §5.8 REQ prose to a 4-line pointer.
- §6.7 Spec-driven updates merged with REQ-098 — no duplicate procedural steps.
- §11.1a (Enrichment manifest JSON schemas) removed entirely. Builders determine
  file formats; convergence loop verifies correctness.
- Appendix L (Lorebook Interchange Format) reduced from detailed JSON/Markdown
  schemas to a one-paragraph format declaration.
- Token catalogs removed: REQ-023 (7 prompts by name → domains), REQ-082 (16
  section tokens → declarative), REQ-085 (macro token list trimmed).
- All "Default:" clauses removed from REQ prose (083, 084, 085, 086, 087, 081).
  Defaults are the builder's domain.
- Lifecycle repetition consolidated: 6 REQs changed from "persists across
  connections and is discarded on end_novel" to "persists with the Novel." State
  model table (§7.7) remains canonical lifecycle reference.
- REQ-062 trimmed: enumerated GM/Player principles removed (Enrich job handles).
- REQ-064 trimmed: narrative-style prose reduced to core boundary contract.
- Quick reference: "games" → "Novels", stale REP-030 typo fixed, stale §11.1a
  references removed.
- Standing Rule 7 extended with 5-question REQ authoring checklist (applied
  before any new requirement).
- New Appendix M: "REQ Authoring Conventions" — defines REQ anatomy, what
  belongs elsewhere, and the "trust the loop" test.
- `scripts/validate.ts`: new `checkSpecViolations` function — warns on long REQ
  bodies (>800 chars), parameter type annotations, Default: clauses, enumerated
  token catalogs (>5 tokens), and lifecycle repetition (>3 occurrences). All
  warnings; none block the build.
- `.markdownlint.json`: MD049 disabled (underscore emphasis is intentional for
  `_Check:_` convention).
- AGENTS.md: requirement authoring guidelines added with pointer to Appendix M;
  layer map updated for current appendix count and REQ count.
- REQ-094 renamed "Lorebook export and import" → "Lorebook interchange."

## 2026-08-05 — v1.4 "Lorebook"

Holonovel's lore subsystem learns from lorebooks without becoming one. Eight
new tools, four new REQ blocks, five new tests — all backward-compatible.

- Extended REQ-083: lore entries gain `priority` (insertion ordering within
  `persona_briefing`), `sticky` (persistence for N assemblies after last trigger
  match, with audit-tracked decay), and `enabled` (per-entry toggle without
  deletion). New tools `enable_lore_entry`/`disable_lore_entry`.
- New tools: `export_lorebook`/`import_lorebook` (REQ-094, JSON and Markdown
  interchange formats, merge/replace/dry-run modes), `group_lore_entries`/
  `ungroup_lore_entries` (REQ-095, organizational grouping with `persona_briefing`
  headers), `suggest_lore` (REQ-096, context-aware enrich template matching).
- New server config: `TTRPG_MAX_LORE_TOKENS` (REQ-097, token budget with
  priority-based fill and `spec_health` overflow reporting).
- Spec: Appendix L (Lorebook Interchange Format), state model table extended,
  `persona_briefing` lore section documented with sorting, sticky markers,
  group headers, and budget overflow notes.
- Five new automated tests (T79–T83).
- README: lorebook export demo quote added to "Playing a Novel" section.
- Spec: new §6.7 "Spec-driven updates" with REQ-098 — mandates formal
  workflow when using the spec to update an existing MCP server: full
  comparison audit, gap plan, OCE re-verification with zero failures on
  changed code paths, dated DECISIONS.md record.
- New test T84 (Manual, process artifact verification).
- README: "Rebuild against a newer spec" section references formal §6.7
  update workflow.

## 2026-08-05 — dnd5e v1.3 Novel migration + OCE re-verification requirement

- Spec (§6.6, §11): OCE reclassified from "confidence check, not a requirement
  gate" to "required quality check." After any optional job that modifies the
  server (Enrich, Sheet) completes, re-run the OCE blocking scenarios and verify
  no regression. Record re-verification results in DECISIONS.md.
- dnd5e: Novel terminology migration (Game→Novel). State types, methods, and
  fields renamed: `GameState`→`NovelState`, `getActiveGame`→`getActiveNovel`,
  `_games`→`_novels`, `_activeGameId`→`_activeNovelSlug`. ~130 rename sites
  across `state.ts` and `index.ts`.
- dnd5e: 4 new tools (`create_novel`, `resume_novel`, `generate_adventure`,
  `generate_encounter`) conforming to REQ-088, REQ-090, REQ-091. `end_game`
  deprecated as alias for `end_novel` (backward compat).
- dnd5e: 2 new resources (`novel://current`, `novel://<slug>`), 1 new prompt
  (`novel_setup`, REQ-089). `audit://game`→`audit://novel`.
- dnd5e: Persistence path changed from `state/<id>.json` to
  `novels/<slug>.json` (REQ-092). Backward compat for `data.novel || data.game`
  JSON key and `TTRPG_GAME_ID` fallback.
- dnd5e: `NovelState` gains 6 metadata fields (slug, name, createdAt,
  charactersPresent, adventureSet, sessionZeroCompleted) per REQ-093.
  `spec_health` reports Novels on disk.
- dnd5e: `persona_briefing` gains `novel` section token; `set_briefing_order`
  valid tokens updated; `help` categories reorganized. McpServer version
  bumped to 1.3.0.
- dnd5e: Adventures split into per-novel (`adventureModules` in `NovelState`)
  and system (`_systemAdventures` on `StateManager` for startup-loaded
  modules). Dual-lookup prevents generated adventure leakage between Novels.
- dnd5e: `loadState` restores `NovelState` metadata fields (name, slug,
  createdAt, setup flags, adventureModules) discovered missing during OCE.
- dnd5e: `session_recap` heading fixed (Game:→Novel:). OCE scenarios S1, S6,
  S12, S13, S15(c-e), S18, S19 passed.

## 2026-08-05 — v1.3 "Novels"

The Novel is a named, persistent save file that bundles the whole game
under one roof. Create a Novel, set up your adventure (load a module,
generate from a premise, or build from scratch), activate the Player
persona, and play. Every Novel saves to disk — your game survives
restarts and rebuilds, waiting right where you left it. Setup is a
freeform toolkit, not a rigid wizard: the server surfaces what's
available and recommends a path, but you drive.

- Terminology overhaul: Game → Novel, `TTRPG_GAME_ID` → `TTRPG_NOVEL`,
  `end_game` → `end_novel` (deprecation alias one version), `game.id`
  macro → `novel.slug`, `audit://game` → `audit://novel`. Standing rules,
  play model, and all REQs updated.
- 6 new REQs (088–093): Novel lifecycle (create/resume/end with
  state-conflict gating), setup tracking (characters/adventure/
  session-zero flags), adventure generation (ruleset-bolstered scaffold,
  GM-only, no runtime network), encounter generation (batch scene+NPC+
  lore, single-undo atomic), disk persistence (`.holonovel-state/
  novels/<slug>.json`), Novel-scoped metadata in `spec_health`.
- REQ-062 trimmed from 12 to 7 principles (3 GM + 4 Player); REQ-070 and
  Appendix J reduced from full anti-slop catalogue to 7-row synopsis
  table (full catalogue moves to Enrich supplementary guidance).
- REQ-022 (+5 resource URIs), REQ-023 (6→7 prompts, `novel_setup` added),
  REQ-025 (Novel metadata in `spec_health`).
- OCE: 3 new scenarios (17–19). S17: Novel lifecycle and persistence
  (blocking). S18: Novel isolation and adventure generation
  (non-blocking). S19: setup tracking and encounter generation
  (non-blocking).
- Enrich gains 6th output module `adventure_advice` (30-item budget:
  templates, table expansions, scenario starters), added to idempotence
  manifest.
- REQ-080 updated (+adventure_advice), REQ-082 section tokens (+`novel`).
- State model rewritten: Novel tier replaces Game; all persistence,
  lifecycle, and isolation documented.
- 7 new tests (T72–T78), 3 tests updated (T9, T31, T61).
- README rewritten: 404→207 lines, workflow-centric structure,
  natural-language demos (no tool names), two-audience split, design
  conventions documented in HTML comment header. `.markdownlint.json`
  MD028 disabled for blockquote styling. AGENTS.md pointer added.
- Appendix D conformance, Appendix E manifest (70 REQ rows), Appendix F
  test catalogue all updated for Novel changes.

## 2026-08-04 — Add server LICENSE.md requirement

- Specified that the Build job MUST include a `LICENSE.md` in the server
  project root with Ruleset Data and Server Code sections (MIT).

## 2026-08-05 — dnd5e MCP server v1.2 alignment, energetic intros, anti-slop domain boundary

- dnd5e: upgraded from v1.1 to v1.2 spec alignment. State model expanded
  from 3 to 9 tiers (NPC, Scene, Countdown, Lore, Enrichment, Adventure).
  Tool count increased from 23 to 43 (+20): `lookup_class`, `end_game`,
  `set_active_entity`, `set_personality`, `set_voice_examples`,
  `player_signal`, `set_scene_state`, `set_scene_type`,
  `set_narrative_directive`, `create_npc`/`update_npc`/`remove_npc`,
  `set_countdown`/`advance_countdown`/`remove_countdown`,
  `set_lore_entry`/`remove_lore_entry`, `set_briefing_order`,
  `suggest_actions`, `compress_audit`, `load_adventure`. Persona model
  changed to nullable (null = full access, per REQ-031). Resources
  increased from 5 to 9 (+`party://current`, `npcs://`,
  `scene://current`, `countdown://active`).
- dnd5e: `persona_briefing` redesigned with anti-slop guidance
  (D&D-adapted Appendix J), voice examples, scene state, entities,
  NPCs, countdowns, lore, adventure, player signals, narrative directive,
  and `set_briefing_order`-aware section ordering. `intro` prompt
  rewritten to energetic D&D-flavored invitation with dynamic sourcebook
  listing.
- dnd5e: `advance_combat` now ticks round countdowns on new-round
  transitions. State file format updated (`state/` subdirectory with
  roster + game envelope) for v1.2 persistence.
- dnd5e OCE: expanded from 15 to 16 scenarios. Scenario 1 sweeps all 43
  tools. Scenario 6 blocks 16 GM tools from Player persona. New Scenario
  16 validates full narrative pipeline (scene, NPC lifecycle, countdowns,
  lore, briefing order, action suggestions, player signals, voice
  examples, class lookup). State file paths updated for new `state/`
  directory format.
- dnd5e docs: DECISIONS.md traceability table updated — 56 REQ rows
  implemented (22 WAIVED rows removed). AGENTS.md rewritten for 43-tool
  surface with categorized registry. README.md capabilities updated.
- Spec: REQ-063 clarification added — the `intro` prompt may use an
  engaging, energetic tone; the anti-slop catalogue (REQ-070, Appendix J)
  governs in-game GM and Player narration, not server onboarding prompts.
- Mothership MCP: `intro` prompt rewritten to energetic, sourcebook-aware
  invitation with four action-focused next actions.

- dnd5e: removed `dist/` directory (compiled JavaScript from `tsc`). All
  paths now reference TypeScript source directly — `main` is `src/index.ts`,
  `start` and `dev` use `tsx`, `build` drops `tsc` compilation step.
- dnd5e/package.json: added `typecheck` script (`tsc --noEmit`) to retain
  type safety without compilation.
- dnd5e OCE: spawns server via `tsx` instead of `node` since the entry
  point is now `.ts`.
- dnd5e docs: AGENTS.md, DECISIONS.md, and README.md updated to reference
  `src/index.ts` and `tsx` invocation.
- .gitignore: removed `dnd5e/dist/` entry.

## 2026-08-04 — D&D 5e OCE updated to 15 scenarios, server hardened

- dnd5e OCE: updated from 14 to 15 scenarios per §6.6. Tightened S4
  (danger damage with per-call seeds), S5 (byte-level state survival),
  S8 (source quoting, length check), S12 (re-import into second game
  with numeric baseline comparison). Added S15 (stress and recovery:
  concurrent sessions, corruption detection, rapid persona ×10, scale
  20/10/10, 10K-char search).
- dnd5e server: `roll_weapon_damage` now supports danger targets in
  combat participants. Added `corruptStates` tracking — `loadState`
  records corruption on JSON parse failure; `spec_health` reports it.
- dnd5e DECISIONS.md: OCE updated to 15 scenarios with accepted
  limitations (S9 D&D condition auto-expiry N/A, S8 structured JSON
  vs raw Markdown excerpt).
- .gitignore: added `dnd5e/.holonovel-oce-state/`.

## 2026-08-04 — OCE expanded: 15 scenarios, severity gating, post-write verification

- §6.6 OCE: expanded from 14 to 15 scenarios. Added scenario 15 (Stress and
  recovery — concurrent sessions, disk corruption, rapid persona switching,
  scale testing, long-query safety).
- §6.6 scenarios tightened: S4 requires deterministic combat seeds and
  external danger damage; S5 requires byte-level state match (numeric HP,
  ordered conditions, integer round, ID sequence); S8 requires self-contained
  output, 2000-char limit, alias resolution, and verbatim source quoting;
  S9 requires conditions to auto-expire via ruleset triggers; S12 requires
  re-import into second game session with numeric baseline comparison; S14
  requires explicit boundary-value checklist with 5-second timeout.
- §6.6 added Failure artifacts: failures must record assertion, request,
  state snapshot, and diagnostic trail in DECISIONS.md.
- §6.6 added regression capture: OCE-discovered bugs → permanent new
  assertion in the triggering scenario.
- §6.6 Exit criteria now severity-gated: scenarios 1/4/5/6/12/15 are
  blocking (operator notified); other failures are accepted limitations.
- §6.5 added Post-write verification: after every file write during
  construction, builder re-reads and audits heading structure, path
  corruption, and URL validity.
- README updated to reflect 15-scenario OCE.

## 2026-08-04 — Sample D&D 5e MCP server, README restructure

- MCP server: added pre-built D&D 5e SRD v5.1 Holonovel server at `dnd5e/`
  (23 tools, 1,029 indexed sections, 37 weapons, 319 spells, 318 monsters).
  Licensed CC BY 4.0 + OGL 1.0a (ruleset data) and MIT (server code).
- README: moved "Wait, what's an MCP server?" → "What's an MCP server?"
  under "What is Holonovel?". Added Sample MCP Server section with quick
  install and Opencode config fragment. Merged Validating into Quick Start.
  Removed Contributing section. Updated project structure tree.
- .gitignore: excluded `dnd5e/node_modules/`, `dnd5e/dist/`,
  `dnd5e/.holonovel-state/`.

## 2026-08-04 — README comparison section, fuzzy-match hints, propose-validate principle

- README: added "One spec. Any game. Zero code." tagline, "How Holonovel Compares"
  section (vs AI Dungeon, rpg-mcp, ChatGPT, consumer platforms), SEO keywords in
  "What you get" and "Who is this for" bullets, and RSS feed link.
- §6.5–§6.6 convergence/OCE: disambiguated "iterations" — replaced with "attempts"
  (per-activity retry) and "cycles" (full pass). The word "iteration" no longer
  appears in the spec.
- REQ-002: `[NOT_FOUND]` and `[INVALID_INPUT]` errors now include "Did you mean?"
  fuzzy-match hints when a close Levenshtein match exists (distance ≤ 2). T40 and
  T39a updated with fuzzy-assertion clauses.
- §4 standing rules: added rule 6 — "LLMs propose intentions; the engine validates
  and executes." Codifies the anti-hallucination architecture already enforced by
  persona gating, tool-result fidelity, and parameter canon validation. Existing rule 6
  renumbered to 7.

## 2026-08-04 — Persona system rewrite, intake simplification, README sync

- Persona system rewritten: no persona active by default (full access
  equivalent to Game Master). Persona gating only applies after explicit
  `set_persona` activation. `end_game` deactivates persona. REQ-031 and
  REQ-032 redrafted; §1 play model and §4 terminology updated.
- Intake questions simplified for novice audiences: removed B7 (persona
  question — personas don't apply outside adventures), B9 (adventure files —
  discovered in provided materials), and S4 (PDF reading method — convergence
  loop determines). Ten question texts reworded in plain language. E4 budget
  cap removed — replaced with automatic LOW-confidence budget rule in §11.1.
- §6.1 Convert and Build descriptions expanded to welcome all materials:
  core rulebooks, supplemental books, character sheets, and adventure modules.
- Enrich sources expanded to include media influences (movies, TV, video games).
- README synced: persona model reflects unrestricted-by-default, Convert/Build
  descriptions welcome all materials, Enrich adds media influences.
- Stale Enrich description in §6.1 fixed; REQ-083 citation tightened; §11.1
  gate cross-reference added; §6.2 auto-detection prose added; §7.7 Lore
  tier citation added; B-number ripple effects resolved.

## 2026-08-04 — Eight AI RP community-inspired features, enriched guidance, README prerequisites overhaul

- Eight new inline features, all zero-config by default:
  - Narrative directive (`set_narrative_directive`, REQ-081) — GM sets standing
    narration instruction visible only in their persona_briefing.
  - Entity voice examples (`set_voice_examples`, REQ-077 amended) — example
    dialogue snippets per character for AI voice-matching.
  - Prompt section ordering (`set_briefing_order`, REQ-082) — GM reorders
    persona_briefing sections; enrich recommendation is inert (never auto-applies).
  - Dynamic lore entries (`set_lore_entry`/`remove_lore_entry`, REQ-083) —
    keyword-triggered setting details that auto-inject into persona_briefing.
  - Action suggestions (`suggest_actions`, REQ-084) — natural-language intent
    maps to ruleset-legal tool invocations.
  - Macro system (REQ-085) — `{{entity.name}}`, `{{scene.current}}`, etc.
    auto-expand in all output; invisible to user.
  - Audit compression (`compress_audit`, REQ-086) — formatted prompt for LLM
    to summarize old audit entries; audit log stays append-only.
  - Scene type tagging (`set_scene_type`, REQ-087) — combat/social/exploration/
    neutral tag guides tool prioritization without altering mechanics.
- Context-sensitive tips mechanism in persona_briefing (up to 3 one-line
  suggestions, persona-filtered, gated behind usage thresholds).
- Enrich job upgraded (§11.1, §11.1a): produces structured enrichment manifest
  with five output modules (voice examples, prompt ordering, lore templates,
  action patterns, supplementary guidance) plus boundaries, budgets,
  idempotence, and verification. REQ-080 defines enrich constraints.
- Enrich recommendations are inert: prompt ordering and lore templates never
  auto-apply; the GM must explicitly activate them.
- State model gains Lore and Enrichment tiers (§7.7).
- REQ-022 resources expanded: `entity://<id>/voice_examples`, `lore://active`,
  `lore://<key>`, `lore://templates`, `enrichment://voice_examples`,
  `enrichment://briefing_order`.
- §6.2 intake: Q0 defaults to build+enrich when network detected; E4 budget
  cap question added.
- 9 new REQs (REQ-080–REQ-087, REQ-088 reserved), 9 new tests (T63–T71),
  1 amended REQ (REQ-077), 9 new tools.
- README.md prerequisites overhauled for AI novices: structured three-part
  prerequisites, MCP explainer section, compatible client list, linearized
  Quick Start, contributor-only validation marker.

## 2026-08-04 — v1.2

- Holonovel just leveled up (v1.2). It now thinks like the community it serves —
  you're the player, the AI is your Game Master, and you can always jump in to
  course-correct when the narrator drifts off-script. Instead of leaving your AI
  to improvise or keep everything in context alone, Holonovel hands it a full
  tabletop toolkit: it knows who's in every scene, it tracks deadlines and timers,
  it remembers every NPC you meet by name and disposition, it recaps what happened
  between sessions, and it loads whole adventure books as indexed, searchable
  reference so your narrator never invents a rule or forgets a room. It's a
  lorebook for rules, delivered as an MCP server — keeping your GM honest,
  creative, and on-world.

## 2026-08-04 — Community-informed improvements; play model; terminology; 11 new REQs

- Play model rewritten: Player persona is the human at the table (default); Game
  Master persona is the AI narrator and adjudicator. `set_persona` remains available
  for correction and direct state management. Multi-character clarified: one user per
  connection, multiple entities per game.
- Terminology: "Session" renamed to "Connection" for the MCP transport tier.
  "Game" sharpened to mean the `TTRPG_GAME_ID` state container. Informal uses of
  "game" meaning "ruleset" replaced throughout.
- 11 new requirements: REQ-067 (help and tool discovery), REQ-070 (anti-slop
  guidance — Appendix J), REQ-071 (voice examples), REQ-072 (session recap),
  REQ-073 (countdowns/timers), REQ-074 (multi-entity support), REQ-075 (named-NPC
  state), REQ-076 (scene-state ledger), REQ-077 (entity personality fields),
  REQ-078 (session zero prompt), REQ-079 (adventure modules — Appendix K).
- REQ-020 amended: session recap added to minimum tool categories.
- REQ-022 amended: 8 new resource URIs added (guidance variants, scene, countdown,
  party, NPC, personality, adventure).
- REQ-023 amended: prompts expanded from 4 to 6 (use_tool now includes worked
  examples; session_zero added). persona_briefing composition changed from
  prescribed order to category list (Standing Rule 6).
- New tool specs: `player_signal` (inert preference signals), persona switch
  guidance resource (`guidance://shared/persona-switch`).
- §6.3 Discovery: voice example extraction added as guidance subcategory.
- §7.7 State model: expanded from 3 tiers (Roster/Game/Connection) to 7 tiers
  by adding NPC, Scene, Countdown, and Adventure rows.
- §7.6 Config surface: `TTRPG_ADVENTURE` env var added.
- REQ-043: clarified participants may be entities, named NPCs, or dangers.
- Appendix D: `help` added to required utility tools.
- Appendix E: 11 new REQ rows (56 total).
- Appendix F: 10 new test rows T53–T62 added.
- New Appendices: J (Anti-Slop Catalogue — 13 patterns), K (Adventure Module
  Format).
- Appendix I: "Game" column renamed to "Ruleset".
- Golden transcript (B.3): "new session" → "new connection" (one line).
- README: "Who is this for?" rewritten for target audience (solo RPG players,
  AI roleplay enthusiasts).

## 2026-08-04 — Remove unassigned persona; pre-build gate; dedup; ses_034b fixes; proofread

- Removed the `unassigned` persona entirely (A1–A15): REQ-031 default is now
  `player`; REQ-066 accepts `player` or `game_master` only; glossary, quick
  reference, play model, config table, Appendix D, T9, T15, and T50 updated.
  12 references replaced or removed across 11 sites.
- Applied "state once" deduplication (B1–B3): quick reference carries REQ
  citations instead of bare prose; Appendix D persona access and conformance
  text replaced with `(REQ-032)` and `(REQ-031, REQ-066)` citations.
- Pre-build gate (C1): builder MUST NOT begin any job until operator answers
  Q0 and all selected-job questions, recorded in DECISIONS.md (1).
- Cross-job deduplication rule (C2): E1/S1 share one answer; C2→B1 implicit.
- Build job question B7 (default persona for MCP client config) and B8
  (connect MCP client to server after build?). B8: when yes, writes config and
  verifies handshake immediately.
- Config-key verification step (C5): builder fetches target client's MCP
  server config schema and verifies key names per B3's client target.
- Q1 pause enforcement (C6): builder MUST NOT produce completion summary or AAR
  until all jobs are finished when Q1=no.
- Enrich depth quantified (C7): min 5 domains, 3 substantive pages per source
  type (≥500 words), empty source types recorded as findings.
- H11 verified at config-write time per §6.2, re-confirmed at handoff (C8).
- Proofread corrections (D1–D10): removed stray `// F42FPPJK`; fixed
  non-existent section references in verifier prompt (§10); T29 "Section 4" →
  "Appendix E"; DECISIONS.md item (6) references corrected; verifier prompt
  "Section 7 format" → "Section 8 format"; H9 "GM session" → `set_persona`;
  B.3 golden transcript "start a Lantern Keeper session" → "switch to
  game_master persona via `set_persona`"; NEED_INPUT bracket consistency;
  T29/T36 Requirements column "Section 8" → "§9"; quick-reference line-wrap
  and "sessions audit" wording fix.

## 2026-08-04 — Persona model: immutability → switchable masks; REQ-066 set_persona

- Rewrote REQ-031 (Persona immutability) as REQ-031 (Persona activation):
  persona is the active role, switchable at runtime via `set_persona`, not a
  startup-locked session identity. Switching is audited; each persona has its
  own undo stack; `set_persona` raises `[STATE_CONFLICT]` during pending
  workflows.
- Added REQ-066 (`set_persona` tool): accepts `player`, `game_master`,
  `unassigned`; never persona-gated; returns `[OK] Active persona: <role>`.
- Updated REQ-030, REQ-032 to reflect active-persona model. REQ-032 gating
  now checks the currently active persona, not a session-locked value.
- Updated REQ-002: `[FORBIDDEN]` response directs to `set_persona`, not
  "correct persona session."
- Changed `TTRPG_PERSONA` from required to optional (default initial persona;
  server starts as `unassigned` if unset).
- Updated glossary (Persona, Session), quick-reference block, §1 model
  description, and OCE-6 scenario to reflect switchable personas.
- Updated T9, T44, T50 test descriptions for persona switching.
- Bumped REQ count: 34 → 35 (added REQ-066).
- Updated README: "Two ways to play" now mentions `set_persona`.

## 2026-08-04 — Retire OCE-subsumed tests; automate T25 and T50

- Retired T11, T12, T19, T34, T37 from Appendix F — all subsumed by OCE
  scenarios 4, 5, 8, 9, 10, 11, 14 or redundant with existing automated tests.
- Automated T25 (deletion drills) and T50 (intro pointer consistency).
- Extended OCE-14 edge cases with unknown decision/option response test,
  covering the T19 retirement gap.
- Cleaned retired test IDs from all REQ _Check:_ trailers and Appendix E
  "Verified by" columns.

## 2026-08-04 — Rename referee persona to Game Master (GM)

- Renamed "referee" persona to "Game Master" (GM) throughout holonovel.md;
  capitalized "Player" in formal persona references alongside "Game Master."
- Updated persona-gated language: referee-only → GM-only, referee-visible →
  GM-visible, guidance://referee → guidance://game_master.
- Changed environment variable value: `referee` → `game_master`.
- Updated fixture text, model excerpt, gate descriptions, OCE scenarios, and
  test catalogue descriptions.
- Updated README: "game master" → "Game Master" in all occurrences.
- No REQ numbers, test IDs, or cross-reference structure changed.

## 2026-08-04 — OCE, build fingerprint (REQ-065), Appendix E reorder

- Added §6.6 Operational Confidence Exercise: 14 scenarios exercising the built
  server with AI-simulated Player and Game Master personas; findings feed back into
  convergence loop.
- Added REQ-065 (Build fingerprint): state records spec version, ruleset hash, and
  build timestamp; graceful migration on mismatch; unrecoverable state surfaced in
  `spec_health`.
- Added T52 (Build fingerprint automated test).
- Reorganized §5 into seven focused subsections (§5.3 renamed, §5.4 split into
  5.4–5.6, §5.5 renumbered 5.7); moved REQ-057/058/059 to §5.3, REQ-042 to §5.4.
- Reordered Appendix E manifest by §5 subsection; moved REQ-063 and REQ-064 to
  their correct groups.
- Updated §7.7 state model with build fingerprint description.
- Updated README: OCE mention in Build description, fixed stale appendix listing.

## 2026-08-04 — Renumber appendices T, F, G to sequential F, G, H

- Renumbered Appendix T (Derived Test Catalogue) → Appendix F, Appendix F
  (Source Conversion) → Appendix G, Appendix G (Ruleset Preparation
  Checklist) → Appendix H. Updated all cross-references in spec body,
  TOC, and gate descriptions. Updated validate.ts `Appendix T:` heading
  lookup to `Appendix F:`.

## 2026-08-03 — Added persona behavioral boundaries (REQ-064); audit fixes

- Added REQ-064 (Persona behavioral boundaries): referee must not take action
  or make decisions on behalf of the player; player must not prescribe world
  facts or narrative outcomes without referee confirmation; output defaults to
  verbosity ("describe richly, prescribe never").
- Added T51 manual test for persona behavioral boundaries.
- Fixed stale cross-references: Appendix H.13 → Appendix G (2 occurrences),
  Q11/Q11-C → Convert job (2 occurrences), Q14 → build-time client target
  (1 occurrence).
- Fixed gate count: "four verification gates" → "five" (2 occurrences).
- Dropped stale requirement count ("34 requirements").
- Fixed stray period in output conventions section.
- Updated README: "Two ways to play" now mentions player agency boundaries.

## 2026-08-03 — Renamed build phases to jobs; unified pre-build questions

- Renamed "phase" to "job" throughout the specification for build operations
  (convert, build, enrich, sheet). Verifier phases in §10 retain the original term.
- Restructured §6.1 from a sequential five-phase table to four independently
  selectable jobs. Each job has its own required sections; the operator picks one
  or more jobs.
- Consolidated all pre-build questions into §6.2 as a unified, job-gated flow:
  Q0 (job selection) + Q1 (pause toggle for multi-job runs) + job-specific
  sub-tables (C1–C3 convert, B1–B6 build, E1–E3 enrich, S1–S4 sheet).
- Removed PE1, PE6, and Q19 (redundant with job selection). Removed PE2 (research
  depth — hardcoded to deep) and PE5 (max items cap — confidence threshold alone
  gates quality). Merged Q3 and Q12 into a single ruleset identifier question.
- Added B6 (MCP server name) to the build job. Added E1 and S1 (path to existing
  build artifacts) to the enrich and sheet jobs.
- Moved §11.1 and §11.2 question tables into §6.2; replaced with pointers.
- Updated README.md, AGENTS.md, and CHANGELOG.md for consistency.

## 2026-08-03 — Major rewrite: compress specification from 4,530 to 1,360 lines

- Restructured the document: new section order (§1–11) with Quick Reference box,
  requirements-at-a-glance, and consolidated appendices (A–G, T, I).
- Compressed each of the 34 REQ blocks from multi-paragraph prose and tables to
  single-paragraph statements keeping only the normative body and check citations.
  REQ-056 (advancement) and REQ-063 (intro) collapsed from prescribed
  implementations to principle-level statements.
- Cut the 20-item output convention catalog (§6.3 old) to roll-result format,
  error format, and the Golden Transcript as canonical reference.
- Consolidated convergence rules into one table (§6.5) replacing five separate
  activity-specific loops.
- Merged handoff check definitions (old Appendix G) into the §9 handoff checks
  table with a Procedure column, eliminating 120+ lines of per-check prose.
- Moved derived test catalogue from §7 to Appendix T; updated validate.ts to
  handle new section boundaries.
- Reduced appendices: old A (parsing heuristics) to principles only, cutting
  A.1 content-type detection signals and A.2 structured progression extraction;
  old D (conformance) to checklist only, cutting illustrative exchanges and undo
  script; old F (conversion) to 30 lines; old H (ruleset prep) to the H.13
  checklist only; old I (catalog) to table only.
- Converted optional phases (§§10–11 old, now §11) from detailed build
  instructions to phase declarations with pre-build question tables.
- Eliminated duplicate content: guardrails (§3 old) which duplicated REQ-058;
  per-checkpoint focus descriptions (§5.6 old) which duplicated requirement
  citations; persona foundations (§6.9a old) which belonged in Phase 3.
- Net reduction: ~65% fewer lines (~4,530 → ~1,360), ~50% fewer tokens.
  No requirements added or removed; all verification gates and golden transcript
  unchanged.
- Added 6th standing rule and Quick Reference line mandating contracts-not-implementations;
  added style-guide bullet to AGENTS.md to prevent future clutter.
- Updated README: fixed stale project-structure parenthetical, replaced project status
  with convergence-loop philosophy explaining why the spec stays lean.
- Removed AGENTS.md from .gitignore; the project's own AGENTS.md is now tracked.

## 2026-08-03 — Add conversion fidelity gates, sampling, and reporting

- Added pre-batch conversion fidelity sampling to Appendix F (new F.1): sample
  3–5 representative source pages, diff converted Markdown against rendered source
  text, compute fidelity rate; block batch conversion below 90 %. Renumbered F.1
  Common HTML patterns → F.2. Added F.1/F.2 sub-entries to Contents TOC.
- Amended §5.6 Conversion checkpoint: ground-truth reconciliation rate now a
  measured metric (per Appendix F.1), provisional until re-verified at Discovery
  checkpoint; below-threshold is a blocker.
- Extended §5.6a convergence rule: added conversion fidelity as sixth named
  verification activity with threshold (≥90 %), improvement step (tune converter,
  re-sample), and stop-check semantics.
- Added conversion confidence cap to REQ-011: sections from converted sources
  whose content type's fidelity rate falls below 90 % are capped at MEDIUM
  regardless of extraction signals; cap lifted when fidelity is restored.
- Extended §5.1a Gate 0 summary mode with random content sampling for converted
  sources (one excerpt per content type drawn from the fidelity sample).
- Extended Appendix H.13 verification checklist with semantic table-row check:
  at least 3 random tables diffed for row count and header label match against
  source page renderings.
- Added `conversionFidelity` section to `spec_health` output (REQ-025):
  per-content-type rates, overall rate, sample set, unresolved ambiguities,
  confidence cap counts. Updated convergence loop counts to include conversion
  fidelity. Section absent for native Markdown sources.

## 2026-08-03 — Spec defect fixes from consistency audit

- Fixed B.3 golden transcript: `entity://delver_01` → `roster://delver_01` in
  `create_delver` output, matching §6.2's roster-ID rule and §6.3's Character
  creation output convention.
- Added `import_character` step to B.3 golden transcript between creation and
  `roll_move`, per §6.4's rule that characters enter game state only through
  explicit import.
- Added to §6.3 Character creation output convention: fields absent from the
  ruleset (species, class, level) are omitted and a field summary follows the
  entity-creation convention.
- Added retired T1 to §7 test numbering explanation (was absorbed into early
  drafts and never formalized).
- Corrected 2026-08-01 CHANGELOG entry: the `[NO_ACTIVE_GAME]` approach was
  withdrawn; §6.7 uses lazy game creation instead.
- Added §6.8.1 to Contents TOC, which was missing despite the heading existing
  in the document body.
- Swapped Appendix G.13/G.14 so H11 (Client configuration launch) precedes H12
  (Cold-checkout replay), matching the §8.1 handoff-table order.
- Fixed validator regex patterns in `scripts/validate.ts` to handle suffixed
  requirement and test IDs (REQ-004a, T22a, T39a). Five patterns updated: REQ
  ID extraction, REQ citation, test ID extraction (row regex and inner match),
  and test citation. Manifest row count now 41 (was 40 — REQ-004a was previously
  invisible to the validator).
- Updated stale H-check range references: §8 line and G.7 changed from
  H1–H10/H1–H11 to H1–H12.
- Updated Phase 2 question list to include Q5 re-asked, matching the Phase 2
  pre-build question table.
- Normalized heading levels: §6.8.1 demoted from `###` to `####` to match
  §6.5.1 at the same sub-subsection depth.
- Added §6.5.1 Sequential Decision Queue to Contents TOC.
- Renumbered Appendix A subsections: A.4→A.1 (Content-type detection
  heuristics), A.5→A.2 (Structured Progression Extraction). Added A.2 to
  the TOC. Updated 13 cross-references from Appendix A.4 to Appendix A.1.
  Historical CHANGELOG references to A.4 remain as-is.


## 2026-08-03 — Four-phase build restructure with character sheet baseline

- Restructured the specification into four distinct build phases, each with its
  own pre-build question set and a required pause/report/proceed gate at
  completion. Phase 1 (ruleset prep) and Phase 2 (server build) are mandatory;
  Phase 3 (persona enrichment) and Phase 4 (PDF-enhanced character sheet) are
  optional. (§1.3, §5)
- Split the monolithic Q1–Q19 intake questionnaire into phase-specific batches:
  Phase 1 Qs stay in §5.1; Phase 2 Qs move to §5.5; Phase 4 Qs (Q16–Q19) move
  to §11. Added PE1–PE6 pre-build questions for Phase 3 (§10).
- Added phase-completion gates to §5.6: after each phase the builder reports
  what was built and verified, then asks whether to proceed. Non-interactive
  runs default to "yes."
- Character sheet baseline — derivation layer, Markdown renderer, and
  `character_sheet` tool inferred from the ruleset — is now always built in
  Phase 2 (§5.5a). Phase 4 (§11) adds PDF layout study, an ASCII renderer, and
  optional MCP App HTML display, gated by Q19. The server ships with a working
  character sheet tool regardless of whether Phase 4 runs.
- Promoted Appendix J (Character Sheet Generator) to §11 and Appendix K
  (Post-Build Persona Enrichment) to §10. Deleted Appendices J and K.
- Added handoff note to §8: Phases 3 and 4 amend the four artifacts without
  invalidating Phase 2 handoff.
- Updated TOC, all cross-references, and §1.3 how-to-use table.
- Rewrote README.md with marketing-focused "What is Holonovel?" section and
  phase-by-phase "How it works" section. Removed all appendix references.
  Reordered sections for first-time reader flow.

## 2026-08-03 — Add persona foundations and post-build enrichment appendix

- Added **Section 6.9a — Persona foundations** with eight player guidelines,
  ten referee guidelines, and a five-step referee conversational loop
  (describe scene → solicit actions → adjudicate → describe outcome → repeat).
  Foundations are ruleset-agnostic best practices composed into
  `persona_briefing` alongside ruleset-specific guidance.
- Added **REQ-062 — Persona foundations** gating foundation composition into
  `persona_briefing` with persona-appropriate filtering (player excludes
  referee-tagged items; referee excludes player-tagged items).
- Updated **Section 6.9 prompt composition** order to include generic
  foundations between ruleset-specific guidance and tool/resource listing.
- Updated **T26** test row to verify foundations presence and persona filtering.
- Added **Appendix K — Post-Build Persona Enrichment** as an optional research
  step (does not gate the Definition of Done) for collecting ruleset-specific
  play advice from community sources, actual plays, and strategy guides after
  the server passes all gates.
- Updated Contents, Section 4 requirements overview table, and Appendix E
  manifest.

## 2026-08-03 — Spec defect fixes from unchecked-assumption audit

- Fixed **REQ-050** seed-injectivity claim — removed impossible "1000 distinct
  d20 faces" text (only 20 faces exist), replaced with verifiable 8 %
  single-face distribution threshold, and corrected "three" seed values to
  "two" matching the Appendix B.4 witness table.
- Added **Layer 3 (Randomizer) and Layer 4 (State manager)** acceptance checks
  to §5.5 layer acceptance table, closing coverage gap where only layers 1, 2,
  5, and 6 had explicit go/no-go checks.
- Added **REQ-018 extraction span boundaries** in §4.2 — defines what "inside
  its cited anchor's section span" means for headings, tables, bold-labeled
  fields, and derived anchors.
- Added **confidence formula worked example** in §4.2 (REQ-011) — illustrates
  the MEDIUM ceiling with concrete numbers.
- Clarified **Pushing contradiction classification** in Appendix B.2 —
  distinguishes flat restatements from qualified conditional overrides, guiding
  builder classification of push/reroll mechanics in real rulesets.
- Documented **`create_character` non-undoable** consequence in §6.4 — explicit
  statement that roster mutations are not snapshotted (REQ-041).
- Rewrote `scripts/validate.ts` table parsers to use **header-driven column
  indices** via new `parseColumnIndices` helper — eliminates silent breakage on
  column reordering in Appendix E manifest and test tables.

## 2026-08-03 — Character sheet generator merged into specification

- Merged `character-sheet-generator.md` into `holonovel.md` as Appendix J:
  Character Sheet Generator — the character sheet tool is now part of the
  unified specification.
- Added Q16–Q19 to the §5.1 intake setup questionnaire: character sheet PDF
  availability (Q16), file path (Q17), PDF reading method with combined
  vision-model + OCR approach for image-based PDFs (Q18), and build gate
  (Q19).
- Added §5.1.1 Character sheet intake explaining the Q16–Q19 flow, environment
  probing order, and combined PDF reading strategy.
- Enhanced PDF study paths (§J.2) with explicit combined-method instructions:
  for image-based PDFs, use vision model as primary extraction and OCR as
  fallback on the same page images.
- Q18's reading-method detection probes the environment in order — the
  builder's own model, `pdftoppm`/ImageMagick, OCR — and ruleset inference is
  a last resort requiring operator notification and a `DECISIONS.md` record.
- Removed standalone `character-sheet-generator.md`; all references
  redirected to Appendix J in `README.md`.
- Updated `package.json` lint target to reflect the merge.

## 2026-08-03 — Large-ruleset scalability, multi-file support, and media asset handling

- Added fourth complexity tier "Huge" (§5.2a) for rulesets exceeding 1 000 mechanical sections, with
  iterative confidence-improvement directive — re-examine LOW-confidence sections per content type, stop
  only when no further reasonable extraction path remains.
- Added multi-file "books" concept (§5.1) with core-first intake discipline: core rulebooks before
  reference books before adventure modules, ensuring foundational context for structural pass and
  extraction.
- Added media asset resolution to the web-scrape (§5.1a) and PDF/HTML import (Q11-B/Q11-C) sub-flows:
  detect unresolved image placeholders, resolve via source file/image API, mark unavailable images as
  structural defects.
- Expanded Appendix A image rule with per-image classification: resolved links, unresolved placeholders
  (defect), mechanics-conveying images (LOW confidence), and illustrative images (no penalty).
- Added embedded stat block heuristics to Appendix A.4: consecutive bold-labeled clusters within
  narrative sections, and sub-section stat-block clusters (adventure module NPC patterns with
  Defenses/Offense/Base Stats sub-headings).
- Added Gate 0 summary mode for large/huge rulesets (§5.1a): per-file stats and aggregated counts
  instead of full tables of contents, with operator on-demand drill-down.
- Added source preparation acknowledgment (§5): pre-check is lightweight for clean Markdown but may
  dominate build time for scraped/converted sources; defect-density threshold for scope-reduction
  suggestion.
- Added structural-marker insertion guidance (Appendix H.3): prefer heading text or anchors over line
  numbers when inserting content.
- Added builder tool reusability note (§5): prefer reusable parameterized functions over one-off
  procedural scripts during source preparation.

## 2026-08-03 — Web-scrape intake, Gate 0, permissive-license catalog, and self-contained server bundling

- Replaced Q11 with tri-modal intake: Markdown files, PDF/HTML import, or web scrape from a
  permissively-licensed SRD.
- Added Q15 (ruleset license type) to the intake table.
- Added §5.1a — web-scrape sub-flow with catalog presentation, license verification, sample-page
  dry-run for converter validation, and Gate 0 hard-stop Markdown review before discovery begins.
- Added Appendix I — 10-entry permissively-licensed ruleset catalog (D&D 3.5/5e, Pathfinder 1e/2e,
  Starfinder, Traveller, FATE Core, Blades in the Dark, Dungeon World, Old-School Essentials) with
  search escape hatch.
- Added self-contained server bundling to §5.5 (ruleset copied into server output as `ruleset/`
  internal and `ruleset-user/` user-facing copies at build time).
- Updated §6.6 TTRPG_RULESET description for bundled paths.
- Updated §5.6 checkpoint list with Gate 0 stage.
- Added §F.1 Common HTML patterns — documented d20srd.org and MediaWiki site structures for
  converter authors.
- Updated README.md: new intake-flow description, web-scrape catalog mention, self-contained output,
  project status update (D&D 3.5 SRD exercise), revised project structure tree.

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
- Added §6.7 rule: game-dependent tools create a new game lazily when none exists.
  An earlier `[NO_ACTIVE_GAME]` approach was withdrawn; the current lazy-creation rule
  at §6.7 supersedes it.
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
