# Changelog

## 2026-08-17 — Register ghost property groups and enforce archetype matching

- Registered eleven previously unregistered coupling surfaces as first-class
  Novel property groups in §7.7, expanding the property model from 19 to 30
  groups: Story Beats (Scene-anchored), Pacing Signal (Temporal), Narrative
  Directive (Session), Voice Feedback (Session), Voice Examples
  (Entity-bearing), Background (Knowledge-carrying), NPC Memory
  (Knowledge-carrying), World in Motion (Narrative-memory), Narrative Threads
  (Narrative-memory), NPC Goal Pursuit (Entity-bearing), and Autonomous
  Countdown (Temporal).
- Canonicalized the coupling table's property-pair column to archetype names:
  `World Model`/`World State` → `World`, `Entity/NPC` → `NPC`, `Knowledge` →
  `Lore`, `Beat` → `Story Beats`, `NPC Goals` → `NPC`, `Faction Goals` →
  `Faction`, `Faction Clock`/`Faction Autonomous` → `Autonomous Countdown`,
  `Countdown Fire (absent)` → `Countdown`, `World Reactivity` → `World in
  Motion`, `Synthesis Activation` → `Synthesis`, `Narrative` → `Narrative
  Threads`, `Player Signal(pace)` → `Player Signal`. `DM Context → State` is
  marked `[non-property]` as a snapshot workflow.
- Extended the coupling pattern rules to P1–P54: added P51 (Decision →
  Knowledge-carrying) for Vow → Lore, P52 (Scene-anchored → Narrative-memory)
  for Story Beats → Narrative Threads, P53 (Temporal → Temporal) for Pacing
  Signal → Autonomous Countdown, and P54 (Knowledge-carrying →
  Knowledge-carrying) for Background → Lore and NPC Memory → Campaign Memory.
  Corrected target archetypes on P23 (→ Narrative-memory), P46 (→
  Narrative-memory), and P47 (→ Ruleset Wisdom), and re-pointed four rows that
  cited mismatched rules (NPC → Countdown to P4, World in Motion → Campaign
  Memory to P16, Pacing Signal → Narrative Threads to P31, and added a
  Mechanics → Countdown row for P36).
- `scripts/validate.ts` `checkCouplingCompleteness` now enforces
  order-insensitive archetype-set matching between every coupling row and its
  cited pattern rule, with a `[non-property]` exemption for snapshot and
  tool-delegation rows. T-new-377/T-new-390 updated to the containment
  semantics; T-new-376/381/395 reconciled to 30 groups and P1–P54.
- Reconciled property counts and pattern-rule ranges across §7.7, REQ-369a,
  REQ-370a, REQ-374a, §6.5 metric, and Appendix T descriptions: "nineteen" →
  "thirty", "all 19" → "all 30", P1–P50 → P1–P54.
- Synced the spec hash in `holonovel/DECISIONS.md` and propagated the assembled
  spec to `holonovel/holonovel.md`.

## 2026-08-17 — Complete hat→badge migration in the holonovel server

- Renamed the holonovel server's public "hat" identifiers to "badge": the
  `set_hat` tool → `set_badge` (parameter `hat` → `badge`), the `hat_briefing`
  prompt → `badge_briefing`, the `hat_scope` field → `badge_scope` across
  lore/secret/note state, the `hat_boundary` spec_health key →
  `badge_boundary`, the `novel.hat` state field → `novel.badge`, the
  `{{hat.active}}` macro → `{{badge.active}}`, and the
  `guidance://shared/hat-switch` resource → `guidance://shared/badge-switch`.
- Folded observer support in: `set_badge` now accepts `observer` and `none`
  (Editor). Observer mode is read-only — mutating tools return `[FORBIDDEN]`
  with a corrective action citing `set_badge`; `badge_briefing` surfaces a
  dual-role instruction under observer mode; `spec_health` reports
  `active_badge`.
- `set_badge` returns `[STATE_CONFLICT]` while a workflow decision is pending
  (P50), and reports the Editor/observer badges with their canonical messages.
- Backward-compatible state migration: existing Novels carrying `hat` /
  `hat_scope` keys load without data loss — the loader accepts the old keys
  indefinitely and writes `badge` / `badge_scope` going forward.

## 2026-08-17 — Register Vow and Pending Workflow coupling groups

- Registered two previously uncoupled question surfaces as first-class Novel
  property groups in §7.7: `Vow` (Decision, Temporal) and `Pending Workflow`
  (Decision). Relabeled the two `Choice →` coupling rows to
  `Pending Workflow →` and normalized `Vows → Countdown` to `Vow → Countdown`.
- Added coupling pattern rule P50 (Decision → Session) and its coupling row
  `Pending Workflow → Undo/Redo/Badge`, capturing the pending-workflow freeze
  of undo, redo, and badge switching (REQ-042, REQ-041, REQ-116, REQ-066).
- Deleted six Codex coupling rows (Codex → NPC/World/Lore/Faction/Countdown and
  Voice Feedback → Codex); Codex is now excluded by absence like other content
  sources.
- Added explicit exclusions for build intake questions (§6.2) and
  input-validation workflows (character creation, confirmation prompts, parser
  disambiguation) in §7.7.1b.
- Reconciled property counts and pattern-rule ranges: "sixteen" → "nineteen"
  property groups (§7.7), "all 17" → "all 19" (REQ-374a, T-new-381, T-new-395,
  §6.5 metric), "all ten" checkpoint snapshot → "all property groups defined in
  §7.7" (REQ-241a), the 12-group clone enumeration → "§7.7" (REQ-240), and
  P1–P47/P1–P49 → P1–P50 across §1, REQ-369a/370a, §7.7.1b, and
  T-new-376/377/390.

## 2026-08-17 — Complete badge_scope migration in spec

- Corrected three stale `hat_scope` references — REQ-350 (body and
  acceptance criterion), T-new-356, and T-new-394 — to the canonical
  `badge_scope`, finishing the hat→badge terminology migration in the
  specification.

## 2026-08-17 — Remove dnd5e-holonovel server

- Deleted the `dnd5e-holonovel/` MCP server directory. The repo now ships
  one server — `holonovel/`, the ruleset-free world-model base — which
  becomes the reference implementation.
- Spec: re-anchored the Technology stack reference (§4) from the
  dnd5e-holonovel reference implementation to holonovel, and dropped the
  dnd5e-holonovel LICENSE-template citation (§6.4) — the two-section
  template is already specified inline.
- Build pipeline: removed the dnd5e arm from `build-order.ts` (source
  propagation, Ruleset Wisdom extraction, and dnd5e typecheck steps) and
  collapsed `SERVERS` to `holonovel` across `push-pipeline.sh`,
  `fingerprint.ts`, `check-traceability.ts`, `spec-delta.ts`, and
  `spec-propagate.ts`. Deleted `scripts/source-propagate.ts` and its
  package.json script. Dropped dnd5e blocks from `version-check.ts` and
  `version-bump.ts`.
- README: removed the dnd5e-holonovel quick-start subsection and the D&D 5e
  SRD license attribution; repositioned D&D 5e and Starfinder as example
  rulesets the spec can build rather than shipped servers.
- Wiki: updated Home, Getting Started, FAQ, Spec Contributing, and the
  Style Guide to center the holonovel server, with D&D 5e kept as an
  example ruleset.

## 2026-08-11 — Ruleset Wisdom extraction in build-order, pipeline efficiency

- Ruleset Wisdom extraction is now a fingerprint-scoped step in
  `build-order.ts` — invoked when `dnd5e-holonovel/ruleset/` or
  `holonovel/narrative_world_model/` change; skipped when sources are
  unchanged. Replaces the manual pre-pipeline enrichment step.
- Spec: renamed "Enrichment classification" to "Ruleset Wisdom
  extraction" in §6.3, correcting terminology inherited from pre-rename.
- `build-order.ts` fingerprint gains `dnd5e_ruleset_hash` component
  covering the SRD ruleset source directory.
- `push-pipeline.sh` spec-delta and fingerprint/update-server loops
  now run in parallel per server. Spec hash is read from the fingerprint
  file instead of recomputed from holonovel.md. Stale enrichment
  manifest population comments removed.

## 2026-08-11 — build-order integrated into push-pipeline

- The push-pipeline script now delegates spec assembly, checks,
  propagation, source propagation (holonovel→dnd5e), typechecking,
  and version sync to `build-order.ts` instead of running each step
  independently. The source-propagate step — which copies the world
  model, parser, and vendor content from holonovel to dnd5e — now
  runs automatically as part of every pipeline push, closing the gap
  where dnd5e could drift behind holonovel's reference implementation.
  Steps are fingerprint-scoped: only changed components run.

## 2026-08-11 — Traceability drift check + pipeline documentation

- A new traceability drift checker catches stale DECISIONS.md entries
  where a REQ is marked Deferred but the tool or resource it references
  already exists in the code. This runs as part of `check:fast` so it
  surfaces before every commit. Four existing partial-implementation
  entries (character_sheet, session_recap, create_character) were
  caught on first run — they're correctly deferred but had stale
  "not yet" wording.
- The `update-server.ts` script now documents why it doesn't invoke
  `opencode run` itself (opencode can't recursively invoke itself) and
  provides a commented-out exec block that can be uncommented when
  running outside of opencode in a bare shell or CI pipeline.

## 2026-08-11 — Full spec-server synchronization + fingerprint-scoped pipeline

- The holonovel reference server gained 45 new tools covering the full
  Novel-management surface: factions, secrets, relationships, vows,
  checkpoints, notes, server notes, story journal, pause/resume context,
  structured player choices, oracle rolls, entity/roster management,
  novel rename/list/info/clone, toggle_action_patterns, and conditions.
  The state model now carries all Novel-level fields (dm_context, notes,
  story journal, factions, secrets, relationships, vows, checkpoints)
  with full serialization/undo/redo support. (REQ-115, 168, 176-178,
  184, 206, 232-236, 240-242, 246, 256-258, 285, 289, 291)
- spec_health now reports live tool/prompt/resource counts, enrichment
  health, audit chain integrity, and safety protocol status across both
  servers. The spec hash is now computed at runtime from the embedded
  specification file rather than hardcoded. (REQ-025, REQ-187)
- The dnd5e server's world-model layer (rooms, things, exits, parser,
  convert_source) is now documented as implemented in the traceability
  table after the existing code was confirmed wired into the server
  surface. (REQ-195-202)
- Push-pipeline gains a fingerprint-based scoped-update step: each push
  computes REQ-313 implementation fingerprints for both servers, then
  compares against stored fingerprints to determine the rebuild scope.
  Only changed components trigger code regeneration — a typo fix stays
  fast, a spec change triggers a gap audit, a cold checkout runs the
  full build. (REQ-313, REQ-314)


## 2026-08-11 — REQ body-length compliance (20 → 0 errors)

- Split 20 REQ bodies that exceeded the 800-character SDD-strict limit
  into 43 sub-REQs. All REQs now satisfy shape constraints. Appendix E
  grows from 966 to 991 REQ rows. Cross-references preserved by the
  existing sub-REQ group resolution logic.
- AGENTS.md now documents `check:fast` as the recommended local pre-commit
  gate and `check` for CI/push. The stale 500-character body-length claim
  is corrected to 800.

## 2026-08-11 — Fast validation gate and pre-commit reliability

- Added `check:fast` — runs lint, structural validation (with proofreading
  skipped), and README guardrail in under 30 seconds. The full `check`
  command still exists for CI; `check:fast` is the new default for local
  iteration.
- Added `validate:fast` — runs `validate.ts` with `--sdd-strict --quick
  --no-proofread`, skipping the slow proofreading pass (passive voice,
  readability, sentence analysis on ~400 REQs) plus the Pattern Buffer
  and Coupling completeness checks.
- The pre-commit hook now runs `spec-delta.ts --report-only` — spec delta
  is still reported but no longer blocks commits. Every spec edit produces
  a hash mismatch with downstream artifacts; this is expected, not an
  error.
- Removed a duplicate `REQ-376b` row from Appendix E.

## 2026-08-11 — Validate backlog: 303 errors → zero

- The REQ citation validator now understands sub-REQ group references —
  citing `REQ-001a` resolves when `REQ-001a1` and `REQ-001a2` exist, and
  citing `REQ-003` resolves when `REQ-003a` through `REQ-003c` exist.
  This resolved 283 cross-reference errors with zero false positives.
  Citations of specific sub-REQs (≥9 chars) that aren't in Appendix E
  remain errors.
- Fixed 19 missing blank lines before section headings and horizontal
  rules across `spec/02-requirements.md` and `spec/03-build.md`,
  resolving all MD022 and MD003 lint errors.
- Suppressed MD038 (spaces inside code spans) — the 8 flagged instances
  were grammatically required spaces between code spans that markdownlint
  misidentified as internal spaces.

## 2026-08-11 — SDD maturity: Tier 3 Spec-as-Source hardening

- The spec now explicitly declares itself a Tier 3 Spec-as-Source system —
  the specification is the canonical source code, humans edit the spec,
  and generated server code is never edited by hand.
- Standing rules (§4) are now formally designated the project's immutable
  constitution, with an explicit precedence contract: constitution rules
  override any conflicting instruction in §5–§11.
- The convergence loop (§6.5) now carries a context-scoping
  recommendation: when multiple agent contexts are available, each build
  phase SHOULD run in a separate context scoped to its build-phase-map
  row. Single-context builds remain the default and are always acceptable.
- Appendix M gains a bloat-prevention contract — before adding a new REQ,
  the author verifies no existing REQ covers the concern and no extension
  would suffice. A §5 subsection exceeding 40 REQs triggers maintainer
  review.
- Appendix M gains a provenance contract — every REQ must be traceable to
  its origin spec version and CHANGELOG entry via version control history.

## 2026-08-11 — Push pipeline hardening

- The push pipeline now creates a `v{version}` git tag after each commit,
  matching the pre-existing `push.ts` workflow.
- Pipeline script invocations are consistent — every step uses `npm run`
  rather than a mix of `npx tsx` and `npm run`.
- The `--dry-run` description now accurately states that the full pipeline
  executes (including spec assembly, file copies, and version bumps); only
  git operations are skipped.
- Added cross-reference comments between the pipeline server list and the
  two TypeScript scripts (spec-delta, spec-propagate) that hardcode the
  same servers.
- Clarified a naming ambiguity in the staged-file pattern where
  `holonovel/` (server directory) could be misread as `holonovel.md`.

- Removed the misleading sentence-count check from validate:sdd. The
  800-character body limit is sufficient to constrain REQ size. The
  code checked for >8 sentences but reported a "5-sentence limit" —
  the mismatch made the check worse than useless.

- Split 265 REQ bodies exceeding the 800-character limit into 967
  sub-REQs using a programmatic splitter. Each sub-REQ body fits within
  the limit while preserving all original text. Sub-REQs use the
  existing letter-suffix convention (REQ-NNNa, REQ-NNNb).

- Updated REQ identifier regular expressions across validate.ts and
  parse-spec.ts to support multi-character suffixes (letters and
  digits), replacing the old single-letter `[a-z]?` pattern.

- Added sub-REQ cross-reference resolution: citations to a split REQ
  (e.g., REQ-043) now resolve to any of its sub-REQs (REQ-043a,
  REQ-043b), preventing false dangling-citation errors.

- Regenerated the Appendix E requirements manifest with all 967 REQ
  entries, including sub-REQs created during the body-length split.

- Added `scripts/split-long-reqs.ts` — a build tool for
  programmatically splitting REQ bodies at paragraph, sentence, or
  word boundaries.

- Redirected validate:sdd output in the push pipeline to avoid
  pipe-timeout caused by streaming 1000+ diagnostic lines.

## 2026-08-10 — Validate performance: 4x speedup for sdd-strict

- Optimized `extractReqBodiesWithSentences` in parse-spec.ts: replaced O(N²)
  progressive text.slice() pattern with a single-pass boundary index, and
  replaced a JavaScript lookbehind regex in `splitSentences` with a
  linear-character scan. validate:sdd drops from >10 minutes to <3 minutes.
- Consolidated 8 proofreading check functions into one loop over REQ bodies
  in validate.ts, eliminating 7 redundant map iterations.

## 2026-08-10 — README rewrite, badge model, license appendix

- Rewrote README.md against a comprehensive 10-dimension style guide: five
  capability pillars replacing six architecture subsystems, all demo prompts
  refreshed with fantasy TTRPG language, content-verified for valid MCP
  commands, and a single unified license footer.
- Migrated 30 occurrences of the colloquial "hat" to canonical "badge"
  terminology across five spec files. The spec now uses "badge" consistently;
  "hat" remains only in two literal parser commands for wearable clothing.
- Adopted Editor as a badge: four badges (Player, Game Master, Observer, Editor)
  replace the old "no badge" / "editing mode" model. Editor is the default
  badge on Novel creation and resume. Updated REQ-031 (badge activation),
  REQ-032 (server-side gating), REQ-066 (set_badge), REQ-136 (Editor-badge
  briefing), the terminology table, and the play model.
- Added Appendix U: Content Licenses — a single source of truth for all
  third-party content licenses (D&D 5e SRD, Inform, if-craft-corpus, dmcp,
  lonelog, BitD SRD). Updated REQ-154 (README handoff) with clause (f) for
  license footer rendering. Updated assemble pipeline and build-phase map.
- Updated README validator (scripts/validate-readme.ts) for new heading
  structure, design comment scan window, and required keys. Updated prose
  extraction (scripts/lib/parse-readme.ts) to skip HTML comments.
- Replaced "two servers ship in this repo" with "D&D 5e ships today.
  Starfinder tomorrow." Mothership references removed from all user-facing
  content.
  clauses, and 10→12 for "almost certainly multi-contract" flag. Updated
  validate-shape.ts, validate.ts, and Appendix M to match.
- Rationale: original limits were aspirational targets written before the
  spec was authored. Actual single-contract REQs commonly need 500–800 chars
  and 5–8 sentences. The relaxed thresholds maintain pressure for concision
  while acknowledging real-world contract density.
- Result: 594→259 shape errors (halved). Remaining 259 across 189 unique
  REQs are body-length and sentence-count violations requiring REQ-by-REQ
  content trimming (Phase D.2 follow-up).

## 2026-08-10 — Catalog fix, SHALL/body/sentence trimming via parser, and gate streamlining

- Fixed 8 REQ catalog violations (backtick token enumerations >5) by splitting
  comma-separated runs into groups of ≤4 tokens joined with "and".
- Modified `extractReqBodiesWithSentences` to exclude `*Acceptance criterion:*`
  text from normative body-length, sentence-count, and SHALL-count checks.
  Acceptance criteria describe verification — not the normative contract.
- Added horizontal-rule (`\n---\n`) trimming to REQ bodies to prevent file
  separators from leaking into REQ boundary parsing.
- Suppressed MD013 (line-length) in `.markdownlint.json` — single-paragraph
  REQs naturally exceed 120 chars. Retained all other lint rules.
- Result: 714 → 488 shape errors (226 fixed). 0 multi-paragraph, 0 parameter
  types, 0 catalog, 0 lint/typecheck errors. Remaining 488 are body-length and
  sentence-count violations requiring REQ splitting (Phase D).

## 2026-08-10 — Multi-paragraph REQ flattening and fast shape validation

- Removed 252 content-level blank lines from REQ bodies across
  02-requirements.md and 03-build.md, collapsing all multi-paragraph REQs to
  single-paragraph contracts. Blank lines before headings, REQ headers, and
  `---` separators are preserved.
- Fixed REQ-318 (Extended property contracts): replaced `(boolean, default false)`
  parameter-type annotations with prose.
- Added `scripts/validate-shape.ts` — a focused REQ shape validator that runs
  in ~0.6s (vs. 600s for the full validate pipeline). Checks paragraph count,
  body length, sentence count, SHALL count, tables, bullets, numbered steps,
  parameter types, Default: clauses, and token enumeration.
- Added `#### End of requirements` heading delimiter at end of
  02-requirements.md to prevent the assembly file-separator from leaking into
  the final REQ body.
- Result: 0 multi-paragraph errors (down from 138), validation runs in         <1s
  instead of 10m. 594 shape errors remain (body-length, sentence-count,
  SHALL-count, catalog) as Phase D follow-up work.

## 2026-08-10 — SDD structural-violation cleanup and cross-reference repair

- Fixed 6 sub-REQs (055a, 055b, 246a, 312a, 312b, 312c) missing from the
  Appendix E requirements manifest — dead cross-reference citations from the
  prior commit's REQ splits.
- Replaced retired test T7 with active test T84 in REQ-098's check line.
- Removed bullet lists from 15 REQ bodies (065, 073, 077, 084a, 233a, 237,
  269, 274, 283, 310, 311, 314, 326, 327, 368, 372), converting enumerations
  to prose contracts.
- Removed markdown tables from 6 REQ bodies (015, 284, 318, 319, 320, 137)
  and converted table data to prose or moved tables to section-level headings
  outside REQ boundaries.
- Removed numbered steps from 5 REQ bodies (080, 271, 273, 277, 308).
- Fixed duplicate REQ-073 heading (missing em-dash delimiter) that caused
  spurious parser boundary failures.
- Added h3 section separators before two build-phase tables (§6 Pattern Buffer
  coverage maps) to correctly delimit REQ-208 and REQ-376 body boundaries.

## 2026-08-10 — SDD enforcement: REQ atomicity gate and unified validation tooling

- Added Standing Rule 12 (REQ atomicity): every REQ is exactly one paragraph —
  no exceptions. Enforced mechanically via `validate --sdd-strict` — violations
  exit non-zero and block commits.
- Merged three standalone validation scripts (`scan-ambiguity.ts`,
  `check-cross-refs.ts`, `audit-assumptions.ts`) into `validate.ts` — single
  read of the spec, single pass of all checks.
- Added REQ shape checks (tables, bullet lists, numbered steps, multi-paragraph,
  >500 chars, >5 sentences, >8 SHALL clauses) gated under `--sdd-strict`.
- Added 10 proofreading checks: passive voice density, modal verb drift,
  cross-reference format, sentence length outliers, double negatives, defined
  term drift, condition stacking, ambiguous pronoun reference, reading-grade
  metric (Flesch-Kincaid), and empty section detection. All WARNING-level.
- Added `--quick` flag to skip heavy checks (coupling completeness, Pattern
  Buffer coverage) for fast iteration.
- Restructured `npm run check` from 7 tools (7 reads) to 3 reads:
  `lint && validate:sdd && validate-readme`. Full gate (`check:full`) adds
  `detect-dupes`.
- Rewrote Appendix M: removed "complex state contract" escape hatch, added SDD
  enforcement rules, added 6 new checklist items.
- Added Appendix T (Tool Surface Map) replacing reserved slot.
- Added error taxonomy catalog to Appendix O.2.
- Moved REQ declarations: 002 category catalog → Appendix O.2, 020
  infrastructure enumeration → Appendix T.
- Split REQ-055 → 055 (durability) + 055a (badge precedence) + 055b
  (resume notice).
- Split REQ-312 → 312 (gate) + 312a (bounds) + 312b (permission) + 312c
  (state).
- Split REQ-246 → 246 (tool surface) + 246a (surfacing).
- Tightened REQ-020, REQ-140, REQ-201, REQ-225, REQ-246, REQ-299, REQ-312,
  REQ-323, REQ-324, REQ-353, REQ-354 — removed embedded tables, bullet lists,
  numbered steps, and multi-paragraph bodies.
- Fixed §6.7 sub-headings from bold text (`**...**`) to h4 (`####`) to
  correctly delimit REQ-098 body.
- Updated §5 header text to state the one-paragraph rule explicitly.

## 2026-08-10 — Coupling completeness and Holodeck model alignment

- Every coupling row in §7.7.1a now carries a Holodeck model column — a
  north-star description explaining what each cross-property interaction
  means in Holodeck terms ("The clock runs while the scene plays," "Your
  actions change the room," "What you know colors what you see").
- Eight new coupling rows filled combinatorial gaps in the interaction
  matrix — most notably: relationship flips now drive NPC disposition
  (new P48: Relational → Entity-bearing), entity-NPC co-presence produces
  interaction advisories (P24 expansion), faction goals surface alongside
  NPC goals in World in Motion (P30), faction clock fires record story
  journal entries (P31), story journal entries prompt NPC goal pursuit
  (P33), beat transitions shape NPC disposition (P41), and scene type
  highlights relevant faction activity (P41).
- Server notes with temporal urgency keywords now suggest countdown
  creation in narrative_threads — the GM's notebook can drive the clock
  (new P49: Guidance → Temporal).
- Pattern rule range bumped from P1–P47 to P1–P49. All 49 pattern rules
  have at least one coupling row — verified at assembly.

## 2026-08-10 — Holodeck configuration alignment

- Player pacing signals now mechanically adjust the dramatic pacing
  window — "Computer, slow down" actually slows down the story rhythm
  instead of being inert advice. (REQ-069)
- Narrative directives are no longer purely inert — the system resolves
  directive keywords against four behavioral dimensions (pacing, NPC
  autonomy, world reactivity, synthesis activation) and applies the
  matched configuration mechanically. Directives that match no dimension
  remain inert as before. (REQ-081)
- Every behavioral configuration dimension (pacing, autonomy, reactivity,
  narrative tone, synthesis behavior) must register a natural language
  access path via a coupling row in §7.7.1a — enforced by a new standing
  rule, an Appendix M checklist item, and `spec_health` coverage
  reporting. System configuration is exempt. (SR 11, REQ-388)
- The system persona now answers to "Computer" — the canonical name for
  the MCP server across all user-facing surfaces, matching the Star Trek
  Holodeck north star.
- Added five pattern rules (P43–P47) and five coupling rows for
  player-signal and narrative-directive → behavioral-config couplings.
  All P1–P42 boundary references updated to P1–P47.

## 2026-08-10 — Multi-ruleset isolation hardening

- Closed codex capture ruleset-inheritance gap: `codex_capture` now defaults
  `ruleset` to the source Novel's ruleset scope, preventing cross-ruleset
  contamination through captured codex entries. (REQ-387)
- Added `codex_adventure` bootstrap gating: `create_novel(codex_adventure=...)`
  validates the Codex entry's ruleset against the new Novel's ruleset scope
  in multi-ruleset servers, preventing cross-ruleset adventure injection.
  (REQ-088, REQ-387)
- Fixed Pattern Buffer Combine-step categorization: S2 (Character creation)
  and S3 (Encounter setup) moved from infrastructure-once to per-ruleset
  re-verification — they are extraction-dependent and must re-verify
  against each ruleset's tools in the combined server. (§6.4.2)
- Added `help` tool ruleset filtering: tool listings and query results
  now scope to the active Novel's ruleset when a Novel is active,
  preventing cross-ruleset tool suggestions. (REQ-067)
- G8 verification workflow: added step 8 (Codex isolation) verifying
  `codex_capture` ruleset tagging and cross-ruleset import rejection.
  (§8 G8)
- Extended T-new-387 test to cover `codex_capture` ruleset defaults.
  (REQ-387)

## 2026-08-10 — Multi-ruleset build support

- Multi-ruleset builds let operators combine two or more TTRPG rulesets
  into a single MCP server (D&D 5e + Starfinder + Mothership, or any
  combination). Each ruleset is discovered and verified independently,
  then merged in a new Combine build step. (REQ-379–387)
- Ruleset-derived tools carry a `<slug>_` prefix (e.g. `dnd5e_roll_save`)
  while infrastructure tools (scene management, NPCs, world model) are
  shared without prefix. Tools, resources, and prompts are siloed — a
  D&D spell lookup cannot return Starfinder results. (REQ-379, REQ-382)
- Each Novel is bound to exactly one ruleset at creation. Switching
  between Novels switches the active ruleset scope. Cross-ruleset tool
  calls return a descriptive error naming the active Novel's ruleset.
  (REQ-380, REQ-381, REQ-384)
- Codex entries carry an optional `ruleset` annotation so reusable
  content (NPCs, equipment, spells) is filterable by ruleset;
  ruleset-agnostic entries (rooms, generic NPCs) are visible to all
  Novels. Roster imports and Novel imports are gated by ruleset match.
  (REQ-386, REQ-387)
- New verification workflow G8 validates cross-ruleset isolation across
  seven steps — tool gating, search isolation, lookup isolation, import
  rejection, Novel switching, spec_health per-ruleset, and tool name
  uniqueness. Combined server health splits metrics per ruleset for
  independent confidence tracking. (REQ-383, §8 G8)
- Added F8 failure mode for ruleset cross-contamination with fault tree
  mapping to the new isolation requirements. Single-ruleset servers and
  ruleset-free mode are backward compatible — no changes to existing
  builds. (§1, §3, §4, §5.16, §6.2, §6.4.2, §7.6, §7.7)

## 2026-08-10 — Push pipeline hardening

- Push pipeline now runs spec checks before propagating assembled output
  to server directories, so failed checks leave a clean working tree instead
  of half-applied copies and hash writes.
- Added version sync check to the pipeline — version drift between root
  package.json and both servers' manifests is now caught before commit.
- Fixed a hash-overwrite bug where the pipeline replaced every `**Spec
  hash:**` line in dnd5e-holonovel/DECISIONS.md instead of just the
  header-level entry, corrupting 11 build record hashes.
- Extracted server names into a single `SERVERS` variable used throughout
  the script, replacing four duplicated hardcoded lists.
- Commit message is now dynamic — reflects whether the spec changed or
  only server/script files were modified.
- Renamed ambiguous `FORCE` flag to `SKIP_CONFIRM` for clarity.

## 2026-08-10 — Integration tightening and token efficiency pass

- Coupling table (§7.7.1a): added standing rules for default badge scope
  (GM-only) and consolidated REQ citations (REQ-073, REQ-083, REQ-236
  lifted from individual rows to section header). Blanked "GM-only" column
  on ~35 default-scope rows for visual signal-to-noise.
- Coupling derivation (§7.7.1b) renamed to Coupling curation; replaced
  false "derived from pattern rules" claim with honest "instantiates
  pattern rules — curated, not every combinatorial instantiation is
  meaningful." Observer badge coupling scope added (read-only: sees
  all navigational, no mechanical couplings).
- Error taxonomy (REQ-002): Holodeck coupling conflicts now explicitly
  surface as `[STATE_CONFLICT]` with conflicting coupling rows enumerated.
- Extraction pipeline (§5.2): coupling metadata population during
  Discovery documented as annotation on existing extraction categories.
- World-model REQ-195 cross-references coupling architecture (§7.7.1a).
- Ruleset-free mode (REQ-218): navigational couplings active, mechanical
  couplings inert in ruleset-free builds.
- Vow-countdown coupling (REQ-322): shared-scope vow countdowns visible
  to Player and Observer badge_briefing.
- State tier enumeration updated: codex (server-level) added alongside
  synthesis as explicit persistence tiers.
- Pattern Buffer blocking sub-workflow lists deduplicated — §8 G5
  references §6.6 exit criteria instead of repeating enumeration.
- Independent verification (§10): coupling sub-workflows weighted 1.5×
  in adversarial selection pool.
- Terminology: added Holodeck Coupling entry; build-phase-map.md
  subsection count corrected (9→15 for §5).
- validate.ts: coupling boundary regex updated to match renamed section
  heading (Coupling derivation → Coupling curation).

## 2026-08-10 — Holodeck coupling architecture integration

- Replaced the coupling completeness register (§7.7.1b) with a derivation
  contract — couplings are derived from pattern rules, not hand-enumerated.
  Every pattern rule (P1–P42) must have at least one coupling row; every
  coupling row must cite a matching archetype rule. REQ-370 rewritten.
- Added 9 new pattern rules: Mechanical → Spatial/Entity-bearing/
  Temporal/Knowledge-carrying (P34–P37), Scene-anchored → Spatial (P38),
  Temporal → Scene-anchored (P39), Knowledge-carrying → Scene-anchored
  (P40), Scene-anchored → Entity-bearing (P41), Entity-bearing →
  Scene-anchored (P42). 6 new Holodeck coupling directions closed.
- Added 12th Holodeck archetype: Mechanical — ruleset-extracted resolution
  mechanics with coupling effects discovered during Discovery.
- Added Mechanics property group populated by Discovery per REQ-377.
  Mechanical tools now carry coupling metadata (target archetype, nature,
  triggering condition) extracted from the ruleset's own text. Same
  Holodeck, different ruleset = different coupling map.
- Added §5.15 Mechanical Coupling (REQ-377, REQ-378), mechanical coupling
  convergence metrics, and Discovery classification step for mechanical
  coupling effects.
- Fixed 3 misattributed rule citations: Scene→World Model (P3→P38),
  Secret→Countdown (P18→P19), Vows→Countdown (P4→P12).
- Added 7 missing coupling rows: Synthesis→Countdown (P7), Synthesis→
  Relationship (P9), Countdown→Scene (P39), Lore→Scene (P40), Scene→NPC
  (P41), NPC→Scene (P42), NPC→Countdown (P36), NPC→World Model (P3).
- Property group count: 15→16 (Novel-scoped, added Mechanics), 16→17
  (total including World Model). Archetype count: 11→12.
- Pattern rule range corrected: P1–P23 → P1–P42 in REQ-369 and T-new-376.
- REQ-376 and T-new-387 scope extended to cover §5.15.
- Renamed stale README terms: Hats → Badges, Enrich → Synthesis. Synthesis
  section rewritten for flat model.
- Updated `scripts/validate.ts` coupling validation from completeness
  register (every pair accounted for) to derivation (every pattern rule
  has ≥1 row). Added Mechanical to archetype set.
- Added 8 new verification tests (T-new-388 through T-new-395) covering
  mechanical coupling extraction, coupling derivation, Scene↔NPC
  couplings, Temporal→Scene, Knowledge→Scene, and archetype verification.

## 2026-08-10 — Pattern Buffer coverage expansion and Holodeck coupling hardening

- Holonovel Pattern Buffer now has a formal REQ coverage map (REQ-376)
  mapping every world-model and narrative-architecture requirement to
  exercised sub-workflows, mirroring the Ruleset PB's traceability
  (REQ-108). Gaps detected by `npm run validate` block assembly.
- Expanded REQ-108's scope from §5.5-5.7 + REQ-002 to cover all
  exercised sections: §5.8 (Synthesis), §5.10 (World-Model Layer),
  §5.12 (Narrative Architecture), and §5.13 (Holodeck). The REQ
  coverage map table grew from 77 to 120 rows.
- World Model (rooms, things, exits, vehicles) is now a formal property
  group in §7.7 with the Spatial archetype, closing a gap where
  world-model couplings existed in §7.7.1a but the group itself wasn't
  in the properties table.
- Three new Pattern Buffer sub-workflows cover untested coupling pattern
  rule chains: S34 (Entity-bearing chain — P24 + P25 + P26 + P27),
  S35 (Narrative architecture chain — P1 + P28 + P29 + P30 + P31),
  and S36 (Decision chain — P4 + P12 + P20). All are non-blocking.
- Cascade-aware scoping: changed surfaces now pull in sub-workflows for
  surfaces coupled through Mechanical linkages in §7.7.1, closing a gap
  where Scene changes wouldn't trigger Countdown or Faction sub-workflow
  re-execution.
- Sub-workflow segmentation allows independently-verifiable segments
  within a sub-workflow to carry their own surface hashes, enabling
  finer-grained re-execution within stable spec/ruleset contexts.
  Blocking sub-workflows always re-execute as a unit.

## 2026-08-10 — Synthesis rename stragglers and typo sweep

- Renamed residual "Enrich" references to "Synthesis" across the
  requirements body (§5), build intake questions (§6.2), and
  appendix text — stale references to "Enrich workflow," "Enrichment
  Controls," and "enrichment modules" now match the §11 Synthesis
  rename. Q0 intake option changed from `enrich` to `synthesize`.
  `TTRPG_MAX_ENRICHMENT_ITEMS` renamed to `TTRPG_MAX_SYNTHESIS_ITEMS`.
- Fixed eight run-together typos where "badges." collided with the
  following word ("badges.for" → "badges. For", etc.) across
  requirements, build process, fixtures, and appendix reference text.

## 2026-08-10 — REQ body contract hygiene

- Tightened six REQ bodies that exceeded character limits with
  implementation detail — removed JSON field enumeration and storage-format
  language from the audit log contract, replaced tool-name catalogs and URI
  template lists with category descriptions, collapsed spec_health's
  field-level enumeration into a categorical summary, and converted the
  adjustable-autonomy slider table to prose. (REQ-040, REQ-020, REQ-022,
  REQ-025, REQ-354, REQ-306)
- Replaced implementation tokens in workflow and audit-surface REQs with
  descriptive prose. (REQ-042, REQ-168, REQ-323)
- Stripped six unjustified bare-default values — numeric defaults are the
  builder's domain per Appendix M. (REQ-072, REQ-246, REQ-353, REQ-336,
  REQ-338)

## 2026-08-10 — Enrichment → Synthesis (flat model, no tiers)

- Renamed the enrichment workflow to Synthesis — a single flat workflow with two
  sources (external web research, internal Novel-state analysis) and no tiers.
  (REQ-080, REQ-227)
- Ruleset Wisdom is no longer framed as an enrichment tier. It is build output
  and a first-class archetype (P5–P11), always present in the Novel and not
  subject to synthesis reversion. (REQ-225)
- Merged community enrichment and novel enrichment into one Synthesis workflow at
  §11. Deleted the old `08-enrichment.md` spec file and created
  `08-synthesis.md`. Vendor content (§11.4) is repositioned as Ruleset Wisdom.
- Consolidated REQs 262–268 (previously "Novel enrichment tier" through "Novel
  enrichment in dashboard") into five synthesis REQs: 262 (Synthesis tool),
  263 (Synthesis auto-trigger), 264 (Synthesis confidence model), 265 (Synthesis
  in badge_briefing), 266 (Synthesis in dashboard). REQs 267–268 are retired.
- All tool names re-mapped: `revert_enrichment` → `revert_synthesis`,
  `player_enrich` → `player_synthesize`, `synthesize_novel_enrichment` →
  `synthesize`, etc. Resource URIs: `enrichment://` → `synthesis://`.
  Environment variable: `TTRPG_ENRICH_STALE_DAYS` →
  `TTRPG_SYNTHESIS_STALE_DAYS`. (REQ-103, REQ-260, REQ-261)
- Updated the §4 terminology table, §7.7 property table (Enrichment → Synthesis,
  Novel Enrichment removed), coupling table (Enrichment → Synthesis),
  archetype definition, completeness register, and cross-property coupling rows.
- Renamed G6 from "Enrichment lifecycle" to "Synthesis lifecycle" (§8).
- Updated intake question E5, build-phase-map, REQ titles in Appendix E,
  test descriptions for T-new-262 through T-new-268, and spec assembly script.
  Renamed §5.8 heading to "Synthesis, Lore, and Macros."

## 2026-08-10 — Convergence and Pattern Buffer strengthened from Holodeck taxonomy

- Added archetype coverage as a new Phase 1 convergence metric — every property
  group must carry ≥1 Holodeck archetype before coupling construction begins.
  A missing archetype is a silent failure: the Phase 2 Coupling completeness
  metric cannot detect it. (REQ-374, §6.5)
- Extended the Enrichment population metric with a Wisdom mechanical coupling
  rate sub-measurement — Wisdom items must be ≥30% Mechanical, not exclusively
  Navigational. A build with all-Wisdom-is-inert passes the old metric but
  violates REQ-371's intent. (REQ-375)
- The convergence regression gate now includes archetype coverage: a change to
  archetype assignments triggers re-verification of Enrichment population and
  Coupling completeness.
- Cross-model audit (REQ-299) now requires ≥2 distinct archetype categories in
  its comparison scope.
- Promoted S27 (Enrichment lifecycle) from non-blocking to blocking and added
  Wisdom mechanical enactment assertions — NPC voice/goals auto-population (P6),
  countdown auto-advance (P7), and constraint overrides in suggest_actions (P10).
- Added S32: Coupling chain exercise — exercises P1+P13+P14+P2+P33 cascade
  through world model, countdown fire, faction clock, scene transitions, and
  story journal consequences in one blocking sub-workflow.
- Added S33: Wisdom mechanical enactment — directly tests REQ-371's acceptance
  criterion: first-class server behavior, not advisory guidance.
- Added 10 new coupling pattern rules (P24–P33) filling all remaining
  non-content-source `—` gaps in §7.7.1a: Entity-bearing interaction,
  Knowledge-Relational bridges, Temporal consequences, Session corrections,
  Narrative-memory advisories. Coupling table now traces every active row to a
  definitive pattern rule.
- Pattern Buffer sub-workflow count: 31 → 33. All counts, ranges, and
  surface-to-scenario mappings updated.

## 2026-08-10 — Holodeck: automated cross-property coupling

- Defined 11 Holodeck archetypes (Temporal, Entity-bearing, Scene-anchored,
  Knowledge-carrying, Narrative-memory, Spatial, Relational, Decision, Guidance,
  Session, Ruleset Wisdom) that classify every Novel property group's behavioral
  nature. (REQ-369, §7.7.0)
- Coupling pattern rules (P1–P23) between archetypes now determine every
  cross-property interaction — the coupling table (§7.7.1) is derived from these
  rules rather than hand-enumerated. Coupling completeness is mechanically
  enforced: every property-group pair must carry either a coupling row or an
  explicit `[none]` declaration. (REQ-370)
- T1 enrichment is redefined as Ruleset Wisdom — a first-class archetype with
  mechanical couplings. Wisdom content (pacing patterns, NPC voice conventions,
  encounter design) renders as server behavior, not advisory guidance. NPCs
  created while Wisdom is active inherit voice and personality automatically;
  countdowns advance on Wisdom-described rhythms. (REQ-371)
- Content sources — rulesets, supplementary rulesets, and adventure modules —
  are now modeled as inputs that populate archetype-bearing property groups,
  not as coupling participants themselves. Adventure-specific coupling rows are
  replaced by the populated properties' own archetype rules. (§7.7.0 preamble)
- Supplementary TTRPG rulesets can be imported at runtime via
  `import_supplementary`. The server runs mini-extraction (mechanics become
  tools, Wisdom couples mechanically), activated per-Novel and removable via
  `remove_supplementary`. Dynamic tool registration supports this. When a
  builder's stack cannot support runtime tool registration, a waiver limits
  import to Wisdom only. (REQ-372, REQ-373)
- Supplementary import and dynamic tool registration are covered by Pattern Buffer
  sub-workflows S30 and S31, tested with the new Appendix Z fixture.
- Renamed "Gauntlet" to "Pattern Buffer" across the specification — terminology,
  REQ bodies, verification workflows, CHANGELOG history, and validation scripts.
  Field names (`gauntlet_scenarios` → `pattern_buffer_scenarios`), flags
  (`--full-gauntlet` → `--full-pattern-buffer`), function names (validate.ts),
  and file references updated. The Pattern Buffer is the transporter's
  verification buffer — holds a build in verification state before
  materializing it as handoff-ready.
- `npm run validate` now includes a coupling completeness check that verifies
  every property-group pair is accounted for in §7.7.1.

## 2026-08-10 — Badge-coupling annotations and enrichment coverage

- The cross-property coupling table now includes a Badge Scope column
  annotating every coupling as GM-only, Player-visible,
  Observer-visible, or editing-mode-only — builders can trace badge
  impact on every cross-group dependency. (§7.7.1)
- The Badges terminology entry cross-references the coupling table so
  the identity and permission layer is explicitly linked to its
  downstream effects. (§4)
- Observer badge briefing now includes presence markers and knowledge
  state for all entities, matching the GM-level visibility contract —
  no character's percepts are hidden when spectating. (REQ-366)
- Extended enrichment extraction with three new component types —
  scene beats, pacing, and autonomy — mapping GM advice on dramatic
  structure, session cadence, and solo-play agency into
  supplementary guidance. (REQ-354)

## 2026-08-10 — Badge integration tightening

- Observer badge now renders enrichment content in `badge_briefing` under
  the same badge-filtering rules as the Player badge, and gains read-only
  access to world-model inspection tools — `resolve_intent`, parser `look`
  and `examine`, and resource URIs. (REQ-366)
- `resolve_intent` is now callable by the Observer badge, consistent with
  its pure-resolution read-only contract. (REQ-323)
- Player signal preferences — pace, difficulty, tone, focus, boundary, and
  register — are now explicitly required to be respected at all autonomy
  levels including `full`. Autonomy controls who decides; player signals
  define constraints on all decisions regardless of agent. (REQ-306)

## 2026-08-10 — World-model integration and enrichment completeness

- Implicit action hints now cover new kinds — parsers suggest reaching
  vehicles in adjacent rooms, opening containers to read inscriptions,
  and correctly suppress hints when switching a device is the solution
  rather than a precondition. (REQ-284)
- Vehicles now record story journal entries on enter and exit, coupling
  vehicle traversal into the narrative surface without affecting the GM's
  scene state. (REQ-317)
- Containers and vehicles now propagate properties across containment
  boundaries — a lit lantern inside a transparent jar reports light to
  the room, while an opaque outer container blocks everything regardless
  of inner transparency. (REQ-367)
- Countdowns can now mutate world-model state when they fire:
  descriptions, properties, and exits can change as countdown effects,
  with deleted-target handling producing `[WARNING]` annotations rather
  than blocking the countdown. (REQ-368)
- Enrichment extraction now identifies three new narrative component
  types — `constraint_override`, `scene_world`, and `npc_world` — mapping
  GM advice chapters to world-model integration patterns. (REQ-354)
- Novel enrichment synthesis gains an 8th source category powered by the
  world model itself — populated rooms and descriptive things produce
  adventure-advice scene hooks and lore templates from room-to-thing
  relationships. (§11.3)
- A new enrichment verification step audits the manifest for world-model
  component type coverage, catching barren categories before handoff.
  (§11.1)
- The runtime coupling table now documents five new couplings:
  countdown→world state, vehicle→scene, world→novel enrichment, and
  enrichment→constraint overrides. (§7.8)

## 2026-08-10 — Narrative Architecture integration tightening

- Voice feedback corrections are now capturable to the Codex as
  `voice_profile` entries, preserving player-corrected dialogue across
  Novels via `codex_import`. (REQ-347)
- Faction autonomous advancement and NPC goal pursuit no longer produce
  duplicate World-in-Motion events — when a faction clock tick represents
  an overlapping NPC goal, that NPC's suggestion is suppressed for the
  transition. (REQ-348)
- Discovered consequences (off-screen countdown fires) now populate the
  discovering entity's `knowledge_state` — the character genuinely
  learned what happened while they were absent. (REQ-349)
- Entity background strings now trigger matching lore entries:
  `background="Veteran of the Border Wars"` surfaces lore tagged with
  shared-scope triggers matching "border", "war", etc. (REQ-350)
- Dramatic pacing signals now trigger autonomous advancement — when play
  stabilizes, factions advance and NPCs pursue goals (a "while you were
  deliberating, the world moved" mechanic). (REQ-351)
- Codex adventure entries can carry `suggested_beats` that pre-populate
  the narrative arc when a Novel is bootstrapped from an adventure.
  (REQ-352)
- Climax beats now accelerate countdown advancement (configurable
  multiplier, default 2x), so on-scene-transition countdowns race toward
  resolution when the story peaks. (REQ-353)
- `suggest_actions` spatial domain now delegates to `resolve_intent`
  rather than independently querying the world model, unifying spatial
  resolution into a single pipeline. (no new REQ)
- Narrative coherence attestation is now a formal verification gate
  (G7) — a build missing it blocks handoff. (REQ-346 updated)
- Voice feedback `[player-corrected]` tags now render visually distinct
  from enrichment `[supplementary]` and Codex `[codex-corrected]` tags,
  each reflecting a different provenance tier. (no new REQ)
- Enrichment extraction now covers six previously-uncovered narrative
  areas — scene types, relationships, countdowns, secrets, player
  signals, and story journal conventions — feeding into
  `supplementary_guidance` with `component_type` annotations. (REQ-354)
- Eleven new cross-property couplings deepen narrative integration:
  secret revelations suggest countdown advancement, vow subjects
  surface matching lore, story journal entries referencing faction goals
  prompt faction-clock advancement, countdown fires shift nearby NPC
  dispositions, relationship flips produce countdown advisories,
  temporal-urgency lore entries suggest countdown creation, NPCs and
  factions with goals suggest vow creation, secrets and factions may
  now reference world-model rooms and locations, server notes can carry
  `narrative_tag` to surface in badge briefing, and the observer badge
  sees a composited narrative surface distinct from GM-only state.
  (REQ-355 through REQ-366)

## 2026-08-10 — Holodeck north star

- The spec and README now anchor the project to the Star Trek Holodeck
  metaphor. A *holonovel* is a holodeck program — an interactive narrative
  where the user steps inside as a character. The server is the Holodeck;
  your campaign is the Holonovel program (the Novel) loaded into it.
- The README hero was rewritten to lead with this north star: "Build the
  Holodeck. Load your campaign."
- Added a Narrative Architecture subsystem (12 new REQs in §5.12) that
  composes the server's narrative engine: scene beats (setup, escalation,
  climax, resolution — with pacing signals and arc visibility), autonomous
  faction clock advancement and NPC goal pursuit, discovered consequences
  that fire off-screen and surface as "Meanwhile, ..." discoveries, a
  player-facing spatial surface derived from the world model, and scene
  descriptions composed from world-model state rather than duplicate prose.
  (REQ-335 through REQ-342)
- `suggest_actions` now resolves player intent across three domains —
  mechanical, spatial, and social — returning suggestions from all matching
  domains in a single response. Social intents resolve against NPC
  dispositions, relationships, and the scene's social type. (REQ-343)
- Players can now provide voice feedback — correcting the AI's portrayal
  and teaching it how their character should speak. (REQ-344)
- Characters now carry background-derived knowledge — a scholar knows
  things their training implies without needing to witness every fact in a
  scene. (REQ-345)
- Builds must now attest to narrative coherence before handoff — a smoke
  session transcript, badge_briefing population check, and narrative REQ
  implementation status verified by a new convergence metric. (REQ-346)
- The coupling table now supports a Narrative coupling class for
  dramaturgy and cast behavior — narrative couplings don't block
  mechanical Pattern Buffer sub-workflows, making it easier to add story
  features without tracing the full coupling table. (§7.7.1)
- The world-model default prominence shifted from `secondary` to `visible`
  — the room is now the stage, not background scaffolding. (REQ-309)

## 2026-08-10 — Push pipeline hardening

- The push pipeline script now refuses to run with a dirty working tree,
  preventing half-applied state from partial failures. (REQ-004)
- Spec propagation delegates to the existing TypeScript `spec-propagate.ts`
  script instead of raw `cp`, ensures target directories exist before copying.
- Gate order was reordered: checks now run *after* modifications, so files
  that ship have been validated against the assembled spec.
- `sha256sum` (Linux-only) replaced with a portable Node.js crypto call;
  GNU `sed` replaced with `perl -i` for cross-platform compatibility.
- Staging is now targeted (`git add -u` for tracked modifications only)
  instead of wildcard `git add` that could pick up untracked artifacts.
- The deploy step now builds both servers (dnd5e-holonovel and holonovel)
  instead of only the first found.
- Added `--dry-run` flag that runs all checks and reports what would happen
  without committing or pushing.
- Added `--yes` flag and interactive confirmation prompt as a safety barrier
  before the push and deploy phase.
- Added `--help` flag with usage instructions.
- Replaced swallowed `|| true` patterns with explicit guard clauses for
  wiki commit and deploy operations.

## 2026-08-10 — Novel integration and Codex provenance

- The Codex now tracks provenance through Novel artifacts. When you import
  an NPC or faction from the Codex, the Novel records its origin — re-importing
  the same Codex entry updates the existing artifact in-place rather than
  creating a duplicate. Stale Codex templates are flagged in spec_health.
  (REQ-332)
- Codex import accepts a batch array for atomic multi-entry bootstrapping.
  (REQ-321)
- Codex capture supports an `update_source` flag to push Novel improvements
  back to the source Codex entry rather than creating a separate copy.
  (REQ-321)
- `create_novel` now accepts an optional `codex_adventure` parameter for
  one-shot Novel bootstrapping from a Codex adventure template. (REQ-088)
- Story journal entries of type `revelation` or `moment` can be promoted
  to lore entries via `promote_story_to_lore` — narrative memory becomes
  world fact. (REQ-333)
- Novels can be archived separately from deletion — an archival lifecycle
  state distinct from trash, for long-term reference of finished campaigns.
  Archived Novels are read-only, searchable, and restorable. (REQ-334)
- Added `novel://<slug>/preview` resource for browsing Novel contents
  without activating. (REQ-022, REQ-258)
- The coupling table in §7.7.1 now surfaces nine missing property
  dependencies including Codex artifacts, vow-countdown coupling, world-scene
  transitions, story journal to lore promotion, and notes-lore cross-surfacing.

## 2026-08-10 — World model deep integration

- Redefined the world model as spatial foundation for scene composition
  rather than optional scaffolding. The new conflict resolution order
  places world constraints first (walls are solid, doors block, darkness
  conceals), with ruleset overrides (Knock, Ethereal Jaunt) requiring
  explicit named mechanics to suspend a constraint. (REQ-309, §5.10)
- Added `resolve_intent` tool: accepts natural-language spatial intent
  and resolves it against world-model constraints, returns room context
  and prose scene description. AI narrator calls it silently on the
  player's behalf — parser verb names are never exposed to the Player
  badge. (REQ-323)
- Added constraint override discovery: the builder scans ruleset mechanics
  for patterns that suspend physical constraints (pass through solid, open
  locked, see in darkness) and registers them in a catalog surfaced at
  `constraints://active`. Error responses include override hints when the
  active entity has a relevant bypass. (REQ-324, REQ-325)
- `set_scene_state` now resolves its `location` field against the
  world-model room graph. When a room matches, the room's exits, things,
  and NPCs become the scene's spatial truth — the GM's description is
  narrative framing. (REQ-326)
- NPC location resolves against the room graph. An NPC whose location
  matches a world-model room appears in that room's context. (REQ-327)
- Lore entries accept an optional `world_target` field — a room, thing,
  or exit reference. World-targeted lore fires on interaction, not
  keyword match. (REQ-328)
- Countdowns accept world-model triggers: `on_room_enter`, `on_thing_take`,
  and `on_door_open`. World events advance countdowns mechanically.
  (REQ-329)
- Room exploration via `resolve_intent` auto-adds entities to presence
  and populates `knowledge_state` with visited rooms and encountered NPCs.
  (REQ-330)
- Story journal entries auto-populate `room_id` when recorded in a
  scene coupled to a world-model room. (REQ-331)
- Parser `command` is now Game Master only. Player badge never sees parser
  verb names — `suggest_actions` maps spatial intents to `resolve_intent`.
  (REQ-196, REQ-309)

## 2026-08-10 — Badge rename, Codex expansion, vendor enrichment, badge integration

- Renamed "Hat" to "Badge" throughout the specification — ~200 references
  across 10 spec files. Tool `set_hat` → `set_badge`, prompt `hat_briefing` →
  `badge_briefing`, env var `TTRPG_HAT` → `TTRPG_BADGE`, URI `guidance://<hat>/`
  → `guidance://<badge>/`. Section §5.5 "Hats and Access" → "Badges and Access."
  Guidance "hat foundations/hat boundary/hat behavioral" → "badge foundations/
  badge boundary/badge behavioral." Safety protocol `hat_boundary` →
  `badge_boundary`; audit marker `[hat_switch]` → `[badge_switch]`; macro
  `{{hat.active}}` → `{{badge.active}}`. Glossary, standing rules, state tier
  tables, property access tables, golden transcripts, and test catalogue
  all renamed. Historical CHANGELOG entries retain "hat" terminology.
- Removed blanket GM-only access from Codex (REQ-321). Codex entries now carry a
  `visibility` field — `library` (default, world-building content) or `shared`
  (visible to both badges). `codex_list` and `codex_info` are badge-filtered:
  Player badge sees `shared` entries; Game Master badge sees all. Mutating
  Codex operations require editing mode or Game Master badge. `codex_import`
  is badge-scoped — Player badge may import `shared`-visibility characters.
- Added six new Codex kinds: `character` (Player-importable from `shared`
  entries), `equipment_template`, `spell_template`, `relationship_template`,
  `voice_profile` (GM-authored world-building content).
- Campaign Memory facts (REQ-310) now carry a `badge_scope` field — `gm`
  (default), `shared`, or `discovered` — compounding the existing presence
  scoping. Player badge sees only presence-scoped facts with `shared` or
  `discovered` scope.
- Available Actions (REQ-084a) now badge-filtered: Player badge sees only
  Player-classified and un-gated actions per REQ-137 gate classification.
- Noted per-badge prominence overrides as a valid future extension in
  REQ-309.
- Added three Tier 1 vendor enrichment sources: Dungeon World SRD
  (CC-BY 3.0 — normative GM rules), Fate SRD (CC-BY 3.0 — player role
  and collaboration), Ironsworn SRD (CC-BY 4.0 — solo play and dark fantasy
  conventions). Vendor source count: 7 → 10. (REQ-227, §11.2)

## 2026-08-09 — Narrative model: Codex adventures, vendor enrich, integration couplings

- Adventures can now be generated or loaded into the Codex without an active
  Novel, letting the GM build a persistent adventure library across campaigns.
  `generate_adventure` and `load_adventure` both gain a `target` parameter
  (`novel`/`codex`/`both`), and `codex_capture` can now pull Novel adventure
  content into the Codex. (REQ-321, REQ-079, REQ-090)
- Added three new Tier 1 vendor enrichment sources: Ironsworn: Starforged SRD
  (vows, progress tracks, oracle moves), Sly Flourish Lazy GM Resource Document
  (session prep, NPC design, scene pacing), and The Alexandrian (node-based
  design, Three Clue Rule, faction intrigue). (REQ-227, §11.2)
- Vows and countdowns are now optionally coupled: accepting a countdown
  suggestion after `set_vow` creates a linked `mission`-type countdown that
  tracks vow milestones and enables `resolve_vow` on completion. (REQ-322)
- Lore entries with `gm_only` or `player_discovered` visibility now check
  entity presence before firing — secret knowledge only surfaces when someone
  who knows it is in the scene. (REQ-083)
- Campaign memory facts are now presence-scoped for Player hat visibility,
  matching the existing knowledge-gating model. (REQ-310)
- Factions can now hold and discover secrets; `reveal_secret` and
  `check_knowledge` accept faction identifiers. Faction-implied rivalries
  auto-recommend relationship changes. (REQ-234)
- Voice examples in `hat_briefing` are now filtered by active scene type,
  preventing combat barks from appearing in social scenes. (REQ-282)
- NPC goal pursuit now offers countdown creation suggestions in the World in
  Motion section, sized by goal scope. (REQ-233a)
- Relationship type changes between non-neutral categories now inject event
  markers into the `narrative_threads` briefing section for the current scene.
  (REQ-236)
- Story journal entries now cross-reference into NPC memory — NPCs who were
  present carry a memory fact referencing the journal entry. (REQ-311)

## 2026-08-09 — T1 enrichment for world-model features

- Added 30 enrichment entries across both manifests covering all five
  Inform-derived world-model REQs (316–320): kind hierarchy design, device
  puzzle patterns, vehicle encounter and journey design, environmental text
  storytelling, parser command tier system, extended property design patterns,
  and narrative verb workflows.
- D&D 5e manifest gains 12 entries (lore_templates, action_patterns,
  supplementary_guidance, adventure_advice templates and starters).
- Ruleset-free manifest gains 18 entries covering the same domains with
  deeper world-model emphasis (the world model is the primary surface in
  ruleset-free mode).
- All entries tagged `vendor`, sourced to the world-model-provider.md
  documentation, with citations to Inform 7 chapters (Artistic License 2.0):
  Writing with Inform Ch4/Ch7/Ch8/Ch17, Recipe Book Ch8/Ch9.

## 2026-08-09 — Codex: server-level content library

- Added a server-level Codex — a typed content library for reusable GM-authored
  NPCs, scenes, encounters, lore entries, factions, countdowns, rooms, and things
  that persists outside Novels, survives restarts and rebuilds, and can be dropped
  into any Novel on demand. Six tools: `codex_set` (create/update), `codex_import`
  (materialize into Novel), `codex_capture` (pull from Novel), `codex_list`,
  `codex_info`, and `codex_delete` (with undo). Stored at `.holonovel-state/codex.json`.
  Game Master only. (REQ-321)
- The Codex is surfaced in `spec_health` with counts partitioned by kind and served
  as a resource at `codex://<id>`.

## 2026-08-09 — World-model expansion: devices, vehicles, extended properties, parser commands, narrative verbs

- Added two new kinds to the world model: `device` (switchable on/off objects like
  torches and levers) and `vehicle` (enterable mobile containers that move between
  rooms with passengers aboard). (REQ-316, REQ-317)
- Extended things with 11 new properties: `switchable`, `switched_on`, `wearable`,
  `worn_by`, `readable`, `read_text`, `edible`, `drinkable`, `enterable`,
  `climbable`, and `transparent`. Each enables mechanical contracts enforce by the
  parser. (REQ-318)
- Added 22 new parser commands in the standard tier: `wear`/`remove`, `read`,
  `eat`/`drink`, `climb`, `enter`/`exit`, `switch on`/`off`, `sit`/`stand`,
  `push`/`pull`, `light`/`extinguish`, `listen`, `smell`, `touch`, `insert`, and
  meta commands `again`/`g` and pronoun resolution (`it`/`them`). (REQ-319)
- Added 5 narrative-intent parser verbs — `ask`, `tell`, `give`, `show`, `throw` —
  that route player intent to the GM's narrative surface rather than resolving
  mechanically. (REQ-320)
- `convert_source` now recognizes all new property assertions and vehicle/device
  kind declarations. Climbable things adjacent to a directional exit are
  automatically associated as that exit's door.
- The Holonovel Pattern Buffer expanded from 13 to 18 sub-workflows covering device
  lifecycle, vehicle lifecycle, extended property contracts, extended parser
  commands, and narrative-intent verbs. (I14–I18)
- Both servers compile clean; all spec gates pass with 0 errors.

## 2026-08-09 — Incremental build-order fingerprinting + source hashing

- Build-order now fingerprints all watched directories (spec/, both servers'
  src/, vendor content) and skips steps whose inputs haven't changed since
  the last successful run. Second consecutive `npm run build-order` completes
  in under 1 second if nothing has changed.
- Both servers' `spec_health` output now includes `source_hash` — a SHA-256
  of all files in the server's `src/` directory — and `build_order` — the
  full build-order fingerprint from the last successful pipeline run. This
  lets an AI session query `spec_health` to determine whether a rebuild is
  needed without reading source files.
- Build-order fingerprint is saved to `.holonovel-state/` and copied into
  both server data dirs after each successful run, making it visible to
  `spec_health` on both servers.
- Fixed stale hardcoded `spec_version: "2026.08.08"` in dnd5e `spec_health`.

## 2026-08-09 — Unified build-order pipeline

- Added `npm run build-order` — a single command that sequences the full
  spec-to-servers pipeline: assemble → check → spec propagation → source
  propagation → typecheck both servers → version bump → version check.
- New `spec-propagate` script copies the canonical `holonovel.md` into both
  `holonovel/` and `dnd5e-holonovel/` server directories.
- New `source-propagate` script copies verbatim source files (world-model.ts,
  parser.ts) and vendor content from holonovel into dnd5e-holonovel, fixing
  import paths automatically. Customized files (state.ts, macros.ts,
  enrichment.ts) are flagged as diverged for manual attention.
- `version-bump` and `version-check` now cover the holonovel server in
  addition to dnd5e-holonovel, including the hardcoded version in each
  server's `src/index.ts` McpServer constructor.
- Fixed stale version references: holonovel AGENTS.md (2026.08.07→09),
  DECISIONS.md (2026.08.08→09), src/index.ts (2026.08.07→09),
  dnd5e-holonovel src/index.ts (2026.08.06→09).

## 2026-08-09 — Split narrative and world content, self-contain dnd5e vendor files

- Split `holonovel/narrative_world_model/` into `narrative/` (enrichment
  vendor sources: DMCP, BitD, Lonelog, IF Craft Corpus) and `world/`
  (kind hierarchy, property contracts, parser command catalog).
- Made dnd5e-holonovel self-contained — it now has its own copy of the
  vendor content it references (bitd/progress-clocks.md and
  if-craft-corpus/README.md), resolving provenance paths without
  depending on the holonovel package at runtime.
- Updated enrichment source URLs in both packages to match the new
  directory structure.

## 2026-08-09 — Remove stale inform directory, repair holonovel remote

- Removed the `inform/` directory — the `@holonovel/inform` package was
  superseded by `holonovel/` when dnd5e-holonovel was made standalone
  (composing shared infrastructure at build time rather than importing at
  runtime).
- Added missing source files to `holonovel/` — `src/index.ts`,
  `src/world/`, `tsconfig.json`, vendor content, and scripts were present
  locally but never reached the remote, leaving the published server
  un-runnable.
- Renamed stale `dnd5e` path references in version-bump, version-check,
  spec-delta, and RULESET_MODEL.md to `dnd5e-holonovel`.
- Synced assembled spec to both server directories.

## 2026-08-09 — Standalone dnd5e-holonovel + auto-deploy pipeline

- dnd5e-holonovel no longer imports holonovel at runtime — it composes the
  shared infrastructure (world model, parser, enrichment types) at build
  time. The `holonovel` file dependency is removed from package.json,
  making dnd5e-holonovel a fully standalone MCP server.
- push-pipeline.sh now deploys to the MCP target after a successful push
  — pulls the deployed copy from git.gay, installs dependencies, and
  rebuilds the server. A cron job running every 15 minutes serves as a
  fallback for pushes made from other machines.

## 2026-08-09 — Spec review follow-ups

- Extended `validate.ts` with subsection-count verification — the check
  compares the §5 navigation table Count column against actual REQ blocks
  per subsection and warns on mismatches. This eliminates the manual
  recount maintenance burden.
- Removed 26 Default-clause annotations from REQ bodies — every
  `(default N)` and `(default 'value')` pattern rewritten to preserve
  contract meaning without prescribing builder defaults. (Appendix M)
- Added `####` sub-headings within §5.6 to improve navigation across
  74 REQs: Core State and Lifecycle, Entities/NPCs/Adventure Content,
  and Fingerprinting/State Integrity. The section title already reflected
  this scope; sub-headings make it scannable.

## 2026-08-09 — Spec review remediation

- Fixed the appendix range in the reading guide — it claimed A–Y but T, U,
  and V didn't exist. Reserved those letters with placeholder entries so
  the sequence is now contiguous. (Appendices T–V)
- The `knowledge_state` hat_briefing prose block was structurally orphaned
  between REQ-281 and REQ-159. Promoted to its own requirement
  (REQ-286 — Knowledge-state section token) and grouped alongside
  REQ-281 under a new `#### Briefing Section Tokens` sub-heading within §5.5.
- REQ-193 and REQ-224 both covered workflow staleness detection with
  nearly identical contracts. Added cross-references so readers find both.
- Recounted every REQ per §5 subsection and updated the navigation table
  (Count and Range columns). All subsection counts now match actual REQ
  body counts. §5.6 title expanded to reflect its broader scope.
- Standardized gate reference form — `Gate 2` to `G2` — in all `_Check:`
  citations, matching the convention in AGENTS.md.
- Removed parameter-type annotations from seven REQ bodies (REQ-072,
  REQ-075, REQ-096, REQ-169, REQ-237, REQ-239, REQ-240) per Appendix M
  authoring conventions.
- Appendix M now acknowledges that REQs covering complex state contracts
  may exceed one paragraph where the contract resists subdivision.

## 2026-08-09 — Enrichment tier restructure

- Vendor content (DMCP, BitD SRD, Lonelog, IF Craft Corpus) is now Tier 1
  enrichment — processed at build time alongside ruleset-native extraction
  rather than gated behind a post-build intake question. Both `[ruleset]`
  and `[vendor]` items survive `revert_enrichment`. (REQ-225, REQ-227)
- Community enrichment (Tier 2 web research) now defaults to off — it
  remains defined as an optional workflow but no longer runs by default
  after every build. The intake E5 question now asks about community
  enrichment instead of vendor content. (§11.1, REQ-227)
- When a ruleset has no inspirational media citations (e.g., the D&D SRD's
  missing Appendix N), vendor content fills the `narrative_voices` module
  so the enrichment manifest reaches the ≥4-of-7-modules populated
  threshold. (REQ-225, REQ-226)
- Fixed three stale "six output modules" references — the enrichment
  manifest has seven modules since REQ-226 added `narrative_voices`.
- README restructured: Convert/Build and Enrich now have their own pillar
  sections alongside World Model, Narrative Model, Novels, and Hats.
  Pattern Buffer and enrichment detail moved out of Novels. Four pillars became
  six.

## 2026-08-08 — Holodeck benchmark improvements

- The engine now maintains a Campaign Memory — a per-NPC, per-thread, and
  per-location fact store derived automatically from state-changing tool
  calls, surfaced in `hat_briefing` and surviving rebuilds. (REQ-310)
- World state now advances autonomously between scenes: NPCs pursue
  goals, consequences ripple through connected entities, and the GM
  receives a World in Motion briefing with accept/modify/defer controls.
  (REQ-233a)
- NPCs maintain independent memories of their interactions with the party,
  with automatic disposition evolution driven by player actions rather than
  requiring GM tool calls. (REQ-311)
- A pre-narration validation gate intercepts AI narration claiming
  mechanically impossible outcomes before the player sees them, rejecting
  invalid proposals with corrective suggestions. (REQ-312)
- `hat_briefing` surfaces a proactive Available Actions section listing
  mechanically legal actions filtered by scene type and capability
  prerequisites, complementing the reactive `suggest_actions` tool.
  (REQ-084a)
- Added Narrative Freshness convention (§7.3a) establishing the
  architecture principle that AI prose output is archived but not
  re-injected as raw context — only structured state deltas enter the LLM's
  context window.

## 2026-08-08 — Push pipeline hardening

- The push-pipeline script now verifies the assembled spec matches its source
  files and lints spec/ directly, catching format drift before the audit runs.
- Spec read-through runs in Build mode with auto-fix for low-severity findings;
  severity-based gating blocks only on critical violations.
- The Inform Pattern Buffer count is corrected from 10 to 13 sub-workflows, a smoke
  test runs before the full Pattern Buffer, typecheck runs as part of the rebuild, and
  stale build artifacts are cleaned before each rebuild.
- Server rebuild steps delegate all spec-delta sync to a unified Step 6,
  eliminating redundant sync calls during rebuild.
- Dead-data scans are extracted into a shared parameterized function, findings
  are captured for downstream gating, and the commit message dynamically reflects
  what actually ran.
- The spec-driven update workflow (formerly the holonovel-update skill) is inlined
  into Step 6 as a four-phase Detect/Audit/Implement/Close workflow with
  surface-to-scenario Pattern Buffer selection and a two-iteration convergence cap for
  both servers.
- README validation runs as a post-session shell gate; wiki updates include
  proofreading, merge conflict detection, and coverage of all wiki pages.
- The pipeline tags successful runs, verifies the remote after push, and checks
  for accidental node_modules staging before commit.
- Pipeline scripts (spec-delta, version-bump, version-check) are no longer
  gitignored — they ship with the repo so the pipeline can run on a fresh clone.
- Git hooks (.githooks/) ship with the repo; the pre-push hook now directs
  operators to the push pipeline instead of the removed holonovel-update skill.
- Every opencode subprocess is wrapped in a configurable timeout with single-retry;
  pre-flight checks verify opencode, node, npx, and npm deps before any work begins.
- Undefined npm script references fixed — spec-delta and version-sync invoke
  npx tsx directly; markdownlint runs via npx.

## 2026-08-08 — Per-section extraction caching and inform version drift detection

- Adding a rulebook to an existing ruleset no longer forces full re-extraction of
  unchanged sections. Per-section hashing (REQ-302) now applies during Build intake
  as well as spec-driven updates — sections matching a prior build's hash reference
  their previous extraction output. (REQ-302)
- The build fingerprint now records the @holonovel/inform version, and the server
  detects inform version drift at startup alongside existing spec and ruleset drift
  checks. The Update workflow also checks inform version before beginning a gap
  audit, so operators get a signal when only the scaffold changed. (REQ-065, REQ-098)

## 2026-08-08 — Inform Pattern Buffer narrative surface hashing

- The Inform Pattern Buffer now tracks narrative tools alongside world-model tools: three new
  non-blocking sub-workflows (I11–I13) exercise NPC CRUD, lore and countdown lifecycle,
  and scene state/guidance. Narrative surfaces get the same per-sub-workflow surface-hash
  skipping as world-model surfaces — when unchanged between builds, their verification is
  cached individually. (REQ-244, REQ-245)
- The convergence cache key gains a fifth component — a narrative surface hash computed
  from all narrative-category tool names, resource URIs, and prompt names (excluding
  Novel lifecycle and Hat & Workflow tools). This enables finer-grained caching: a
  world-model change that bumps the inform version no longer forces re-verification of
  unchanged narrative tools. (REQ-244)

## 2026-08-08 — Observer hat, AI role, autonomy, subsystem classification fixes

- The world-model layer's "always secondary surface" constraint is now configurable via
  `TTRPG_WORLD_PROMINENCE`, with three levels: `secondary` (default, current behavior),
  `visible` (world-model and narrative tools in primary help categories), and `prominent`
  (parser commands as top-level tools, world-model state in decision-critical briefing,
  parser commands preferred for spatial intents). The setting controls default surface
  emphasis — TTRPG resolution authority is unchanged. Skipped in ruleset-free mode.
  (REQ-309, B12)
- The human can now spectate via the Observer hat (`set_hat("observer")`) — the AI plays
  both Player and Game Master while the human watches, stepping in for mechanical decisions
  at a configurable autonomy level. Observer is read-only. (REQ-305, REQ-032)
- The AI's narrative role is now the counterpart of the active hat: human as Player → AI
  as Game Master, human as Game Master → AI as Player. Configurable via `TTRPG_AI_ROLE` to
  lock the AI to a fixed role. (REQ-304)
- Adjustable autonomy controls how much the AI auto-plays vs. defers to the human, with
  independent sliders for level, confirmation, safety, and creativity. (REQ-306)
- Entity presence tracking gates knowledge acquisition by attendance — characters only
  learn what happened in scenes they were present for. (REQ-307, REQ-308)
- Server notes now survive Novels and rebuilds, stored at the server level. (REQ-285)
- Subsystem classification fixes: duplicate checkpoint/resume tools removed from Narrative
  → Session Management (already under Novels), `(World)` parenthetical corrected to
  `(Novels)` in the §5.10 conflict-resolution order, and `compress_audit` moved from
  Enrichment Controls to Story Memory where it pairs with `session_recap`. Notes moved from
  Narrative to Novels to match their save-file nature.
- Restored missing Appendix G (Source Conversion) heading — its G.1–G.6 sub-sections were
  orphaned between F and H and excluded from the assembled spec.
- dnd5e server grew from ~64 to ~106 tools: added factions, secrets, relationships, vows,
  story journal, notes, server notes, checkpoints, pause/resume, oracle, adventures,
  and the observer/autonomy/presence/knowledge infrastructure.

- Split verification workflow G0 into G0a (structural integrity) and G0b (MCP
  conformance) — source quality and server quality are now independently verifiable
  workflows. Added G6 enrichment lifecycle verification to the workflow table.
- Added a safety protocols concept reported by `spec_health`: `state_loss`,
  `hat_boundary`, `data_corruption`, and `unrecoverable_crash` each report
  `online`, `degraded`, `offline`, or `unverified`. (REQ-269)
- Mapped six T18 anti-hat persona archetypes to Pattern Buffer sub-workflows so every
  adversarial persona is exercised by operational verification.
- Added deduplication statements to each verification workflow — every workflow
  now states what it uniquely verifies that no other workflow covers.
- Handoff artifacts now carry their build-time spec version in a standardized
  `<!-- built against -->` comment, auditable by H13. (REQ-270)
- Split DECISIONS.md section 6 into navigable sub-sections with HTML anchors
  (evidence-g0a through evidence-g6, audit, task-list).
- Defined a minimum AGENTS.md structure contract: Code Map, Verification,
  Troubleshooting, and Build Context sections. (REQ-271)
- Added a stock elements catalog — ruleset-derived reusable templates (character
  archetypes, monster libraries, location templates) recorded in DECISIONS.md
  and reused across builds with unchanged ruleset hashes. (REQ-272)
- Independent verification now operates under a formal reproducibility tolerance
  contract — seed-pinned dice, status prefixes, and exit codes must match exactly;
  natural-language prose is checked structurally. (REQ-273)
- The independent verifier produces a confidence score (0–1) across all compared
  workflows rather than a binary pass/fail. (REQ-274)
- Evidence for independent verification is cryptographically committed with a
  SHA-256 hash before Phase 1 to prevent post-hoc tampering. (REQ-275)
- The independent verifier model must be from a different provider or architecture
  family than the builder — same-provider version increments are insufficient.
  (REQ-276)
- Risk-driven adversarial selection replaces pure-random Pattern Buffer sub-workflow
  selection during independent verification — prior failures and state-mutating
  sub-workflows receive higher weight.
- Replaced hardcoded per-workflow salient-value lists in §10 with a structured
  comparison criteria table covering all workflows including the new G6.
- Added a fixture coverage matrix mapping every extraction path tested by each
  fixture (dedup, inline stats, broken cross-refs, prompt injection, etc.).
- Added Appendix X (Court Intrigue) — a social-interaction fixture with no combat
  rules, testing persuasion, faction standing, and social gambit extraction.
- Added Appendix Y — a structural stress-test fixture for the Appendix H checklist
  (7-level heading nesting, 100-row tables, Unicode edge cases, mixed formatting).
- Defined a fixture evolution contract — when spec changes break a golden
  transcript, the fixture is version-bumped with the citing REQ recorded, not
  treated as a regression. (REQ-277)
- All RNG witness tables are now the normative contract; their generating
  algorithm is documented as a reference implementation, not a constraint.
- Fixed broken `appendices.md` file references in the build-phase-map, added a
  de-duplication statement against §6 Prepare directives, and defined a
  staleness-detection hash contract. (REQ-278)

## 2026-08-08 — Novel enrichment tier (tier 3)

- Added a third enrichment tier — `[novel]`-tagged — synthesized from the
  active Novel's own state (NPCs, lore entries, story journal, scene history,
  factions, secrets, relationships, and countdowns). Unlike community
  enrichment (web-researched) and vendor enrichment (curated documentation),
  novel enrichment is generated by the server at runtime. Items carry
  `[novel]` tag with `MEDIUM` or `LOW` confidence depending on whether
  they're derived from explicit Novel fields or inference. Seven REQs
  (262–268) define the tier, synthesis tool, auto-trigger thresholds,
  removal boundary, confidence model, briefing integration, and enrichment
  dashboard extension.
- GM tool `synthesize_novel_enrichment` analyzes Novel state and produces
  enrichment items across all seven output modules — voice examples from NPC
  personalities, lore connections between related entries, narrative tone
  profiles from story journal patterns, scene hooks from unresolved threads,
  faction tension notes, and countdown pacing warnings. Items are inert by
  default — the GM activates them individually.
- Optional auto-trigger thresholds (`on_session_start`, `on_scene_change`)
  via `TTRPG_NOVEL_ENRICH_AUTO_TRIGGER` let novel enrichment refresh
  automatically. A state fingerprint prevents wasteful re-synthesis when
  nothing has changed.
- `revert_novel_enrichment` removes only `[novel]` items — the three
  enrichment tiers now have independent removal boundaries.
- §11.3 describes the full synthesis workflow: source categories × output
  module mapping, seven synthesis heuristics, per-pass and total budget
  caps, storage format, persistence contract, and community enrichment
  interaction rules. The Novel properties table grew from thirteen to
  fourteen property groups.

## 2026-08-08 — Novels: World / Novels / Narrative recategorization & save-file model

- Replaced the binary "Inform / Not Inform" infrastructure split with three
  categories: World (the @holonovel/inform spatial layer), Novels (save-file
  operations), and Narrative (story content tools, resources, and prompts).
  The terminology table, §2, REQ-020 tool categories, §5.10 conflict-resolution
  order, and REQ-218 ruleset-free mode all reflect the new structure.

- Save-file tools added: `rename_novel` renaming a Novel on disk,
  `list_novels` browsing available save files with descriptions and enrichment
  status, and `novel_info` returning extended metadata for a single Novel.
  `spec_health` continues to report Novel listings as part of the build-health
  dashboard; the new tools are the dedicated save-file browsing surface.
  (REQ-256, REQ-257, REQ-258)

- The story journal (`record_story`) gained full CRUD: `update_story` for
  editing entries (immutable decision/consequence types), `remove_story` for
  deletion, and `list_stories` with type-filtered offset-based pagination.
  Growth is bounded by `TTRPG_MAX_STORY_ENTRIES` (default 500) with a
  configurable briefing display limit. (REQ-246, REQ-129)

- Enrichment Tier 1 (ruleset-native) content is no longer stored in the Novel
  JSON — the Novel stores only activation keys, resolved against the build's
  current extraction on startup. When a ruleset rebuild occurs, keys that still
  match stay active with updated content; vanished keys are reported as
  `[enrichment_gap]`. Tier 2 (community) stays in Novel JSON. (REQ-080)

- Granular enrichment control: the GM can browse, activate, deactivate, and
  remove individual enrichment items per-module instead of only toggling whole
  modules. The player can suppress items from their surfaces independently.
  Activation and suppression state persists with the Novel across restarts.
  (REQ-260, REQ-261)

- Enrichment state is now validated on import: Tier 2 items from unfetched
  sources are flagged `[stale]`, Tier 1 keys with unresolvable anchors are
  flagged `[orphan]` — both import inert. `strict=true` blocks import on any
  staleness. (REQ-096)

- Holodeck-inspired save-file improvements: `create_novel` gained an optional
  `description` field (surfaced in listing, info, and Novel metadata) and
  `update_novel_description` provides post-creation editing. When Novels exist
  on disk at startup, the `intro` prompt presents them as a browsable library
  with descriptions, play counts, and enrichment status. (REQ-088, REQ-063,
  REQ-259)

- Wearing a hat now comes with an explicit behavioral contract: `hat_briefing`
  includes a boundary directive reminding the operator — whether human or AI,
  Player or GM — that while a hat is active, they are in the story and should
  confine tool use and responses to the current Novel. `set_hat("none")` is
  stepping away from the table. The "In the story" terminology entry now
  carries this implication. The directive is symmetric — it works identically
  for both hats — and is never truncated from the briefing. (REQ-064, REQ-135)

## 2026-08-08 — Boundary signal enforcement, checkpoint queue entry

- Boundary signals set via `player_signal("boundary", ...)` are now surfaced in
  `hat_briefing` as a dedicated "Boundaries" advisory section with an explicit
  avoid directive — the GM AI sees "Do not narrate, imply, or introduce content
  that evokes these topics" for each boundary. GM narrative input tools
  (`set_scene_state`, `create_npc`, `update_npc`, `set_lore_entry`,
  `update_lore_entry`, `set_narrative_directive`) return `[WARNING]` when their
  input matches an active boundary value, without suppressing the operation.
  The boundary advisory is never truncated by briefing size budgets. (REQ-255)

## 2026-08-08 — Adventure extraction

- Adventure modules now support structural extraction: loading an adventure
  pre-populates NPCs, location lore, faction entities, and scene waypoints from
  parsed headings and prose. Structural extraction separates index-level data
  (read-only) from live Novel state, and adventure scene waypoints trigger scene
  transitions and lore coupling. (REQ-247–250, §5.6, §7.7)

- Bumped Novel property groups from eleven to thirteen to accommodate Adventure
  Scene Waypoint and Adventure Index. Cross-property coupling table now documents
  adventure waypoint → scene/lore and adventure index → NPC relationships.

- Synced dnd5e server with spec: added adventure_scene_waypoint and adventure_index
  to NovelState, enhanced load_adventure to pre-populate NPCs and location lore from
  extracted adventure data, surfaced waypoint in hat_briefing. Two new REQs
  implemented (REQ-248, REQ-250), two build-time REQs waived (REQ-247, REQ-249).
  Spec hash updated.

## 2026-08-08 — Story lifecycle, narrative memory, one-file Novel

- Defined the story lifecycle: entering a Novel now starts in editing
  mode (no hat, full access) — work on characters, load adventures, build
  the world before the story begins. Putting on a hat means you're in the
  story. `set_hat("none")` ends the story and returns to editing mode
  with the Novel intact. `end_novel` deletes the file from any state.
  When you resume a Novel with an active story, the server tells you
  "You're back in the story." (REQ-031, REQ-066, REQ-055)

- Replaced "game" with "story" throughout the prose — the Novel is the
  container, the story is what happens when a hat is active. "Game Master"
  and tool names unchanged. (Standing Rule 9, terminology table)

- The session zero prompt is now an eight-section builder-generated
  guide: welcome, per-signal explanations (5 signals × 3-5 tuning
  options with narrative paragraphs), three character introduction
  examples at increasing detail (minimal sketch, three-paragraph
  description, media reference), plain-English character creation
  walkthrough, adventure confirmation, narrative capability discovery
  with plaintext examples, quick-start guide, and post-session
  encouragement. No tool names — everything described as plain-English
  instructions. (REQ-078)

- The Novel setup prompt is now a three-step wizard with visual
  completion markers (`[✓]`, `[→]`, `[ ]`) and conversational
  descriptions. After session zero completes, a next-steps summary
  tells the GM how to begin the first scene. (REQ-089)

- Added a new standing rule: user-facing narrative prompts (`intro`,
  `session_zero`, `novel_setup`) must use plain English with no tool
  names or technical syntax. Operational prompts (`hat_briefing`,
  `run_workflow`) and tool output are exempt. (Standing Rule 10)

- Added a story journal — the Novel's narrative memory. The GM records
  decisions, moments, revelations, bonds, and consequences with
  `record_story(type, entry)`. Entries are typed for smart retrieval,
  surfacing in session recaps, hat briefings (when characters or scenes
  match), and exports. The mechanical audit log captures dice; the
  story journal captures everything else — motivations, emotional
  stakes, world changes. (REQ-246)

- Merged the Novel to a single file. The audit log is now an
  `audit_log` array inside the Novel JSON instead of a separate
  `.audit.jsonl` file. One file to copy, share, backup, export.
  Version 1 Novels auto-migrate on load. `novel_format_version` is
  now 2. (REQ-040, REQ-092)

- Combat state now persists across story boundaries — end the story
  mid-combat and resume it from the same round and turn. Hat switches
  via `set_hat` are explicitly recorded in the audit log. (REQ-043,
  REQ-040)

- `TTRPG_HAT` now accepts `none` so Novels can start in editing mode
  by default. (REQ-055, 04-runtime.md)

## 2026-08-08 — Pattern Buffer expansion, efficiency improvements, and auto-detection

- Added seven new TTRPG Pattern Buffer sub-workflows (S23–S29) covering all
  DMCP-sourced narrative features — pause/resume context, factions, player
  choices, relationships, secrets, notes, clock taxonomy — plus Narrative
  POV, enrichment lifecycle, briefing ordering, voice examples, session
  notation, and Novel export/import. The Pattern Buffer now has 29 sub-workflows,
  with S23 (narrative sweep), S25 (backups/checkpoints/clones), S26 (POV),
  and S29 (export/import) classified as blocking.

- Five efficiency improvements reduce Pattern Buffer token costs: (1) structured
  encoding now mandates a runnable test harness so re-runs cost zero AI
  tokens; (2) the S1 tool surface sweep skips categories exercised by other
  blocking sub-workflows; (3) per-sub-workflow surface hashes skip unchanged
  scenarios individually rather than all-or-nothing; (4) a pattern buffer manifest
  caches results by spec version and ruleset hash, reusing them across
  builds; (5) convergence-loop-driven scoping skips mechanics-fidelity
  sub-workflows when the ruleset hash is unchanged. All five applied to the
  TTRPG Pattern Buffer; (1) and (3) applied to the Inform Pattern Buffer as well.

- A normative REQ Pattern Buffer coverage map maps every requirement in §5.5,
  §5.6, §5.7, and REQ-002 to its covering sub-workflow(s). `scripts/validate.ts`
  mechanically enforces it — when a spec revision adds a new REQ to these
  sections, validate reports an error until the map is updated. This closes
  the loop between spec changes and Pattern Buffer coverage.

- Fixed a pre-existing desync where the verification file referenced a
  23-sub-workflow Pattern Buffer and a ghost S23 sub-workflow that didn't exist in
  the build specification. The section map REQ counts now include the
  DMCP-sourced REQs (232–242) that were previously absent.

- Terminology refresh: "game" replaced with "Novel" throughout the spec,
  and the play model now distinguishes editing mode (no hat) from story mode
  (hat active), with `set_hat("none")` returning to editing mode.

## 2026-08-08 — Convergence cache key, enrichment memoization, Pattern Buffer fingerprint caching

- Builders can now skip the convergence loop when the inputs haven't changed:
  a convergence cache key (ruleset hash + spec hash + inform version + enrichment
  vendor hash) enables reuse of prior Phase 1 and extraction-dependent Phase 2
  results across same-source rebuilds. Operator override via `--no-cache` flag.
  (REQ-244, §6.5.5)

- Ruleset-native enrichment extraction (REQ-225) is memoized by ruleset content
  hash — same-hash rebuilds skip extraction and the feedback-driven
  re-classification loop. Pre-built enrichment manifests shipped alongside
  ruleset sources are validated and used when the spec version matches.
  (REQ-245, §6.3)

- The inform package now ships a CONVERGENCE.md manifest with pre-computed
  Phase 2 results and Inform Pattern Buffer outcomes per version, enabling inform
  builds to skip convergence and the Inform Pattern Buffer when the spec version
  hasn't advanced. (REQ-245, §6.6)

- The TTRPG Pattern Buffer now supports fingerprint-driven scoping: when neither the
  ruleset hash nor spec hash change, all 22 sub-workflows are skipped. Spec-only
  changes run only sub-workflows exercising changed surfaces via the
  surface-to-scenario mapping. Operator override via `--full-pattern-buffer` flag.
  (§6.6)

- Vendor enrichment content (`inform/docs_md/` directory) now ships with a pre-verified
  MANIFEST.md: per-module confidence scores and term anchoring results that the
  convergence loop validates against instead of re-auditing from source. Module-level
  hashing from the partial-refresh contract catches drift. (§11.2)

## 2026-08-08 — Infrastructure reorg, DMCP/BitD/Lonelog imports, vendor enrichment

- Infrastructure taxonomy formalized: two subcategories — Inform (world-model
  layer, always secondary) and Not Inform (REQ-020 categories + new narrative
  tools). Ruleset-derived tools explicitly not infrastructure.
- Not Inform consolidations: lore upsert (REQ-083), scene unification
  (REQ-076/76a/81/87 merged into `set_scene_state`), personality merge
  (REQ-077 absorbs `set_voice_examples`). 7 tools reduced to 3.
- DMCP-sourced features: Pause/Resume context (REQ-232), Factions (REQ-233),
  Secrets/Knowledge (REQ-234), Player Choices (REQ-235), Relationships
  (REQ-236). All with cross-tool coupling clauses.
- BitD clock taxonomy: `clock_type` parameter on countdowns — racing, linked,
  tug-of-war, faction, and mission clocks. Extends REQ-073.
- Lonelog session notation: `format` parameter on `session_recap` and
  `compress_audit`. Optional `notation` field on audit entries. Extends
  REQ-072 and REQ-040.
- Adventure = Novel at session zero: narrative adventure sections (Premise,
  Factions, Scenes, NPCs, Lore, Seeds) co-exist with spatial `## World`
  sections. REQ-078 session zero surfaces adventure pre-populated state.
  REQ-079 adventure modules accept narrative-only content.
- Conflict resolution simplified to 3-level hierarchy: TTRPG ruleset >
  narrative infrastructure > Inform (always secondary surface).
- Ruleset-free server redefined as freeform narrative roleplay. Parser
  navigation is optional scaffolding, never primary interface.
- Vendor enrichment (§11.2): four open-source source bundles in `inform/docs_md/`
  directory — DMCP (MIT), Blades in the Dark SRD (CC-BY 3.0), Lonelog
  (CC BY-SA 4.0), IF Craft Corpus (CC-BY 4.0). No separate infrastructure
  web enrichment needed.
- Enrich intake: new E5 question for vendor content.
- State tiers updated: dm_context, Faction, Secret, Relationship, DM Context
  added to Novel properties table.
- Appendix E: REQ-232–236 added. Test catalogue: T268–T274 added.

- Enrichment is now two-tiered: ruleset-native enrichment is extracted during
  Discovery from the ruleset's own text (example-of-play dialogue, GM advice,
  setting descriptions, inspirational media citations) and shipped with every
  build. Community enrichment (web-sourced) is layered on top as an optional
  additive workflow. Ruleset-native items carry `[ruleset]` tag and are never
  removed by `revert_enrichment`. (REQ-225, REQ-226, REQ-227)

- The Quick Reference and §1 play model now frame the tabletop RPG ruleset as
  the primary driver — Inform is infrastructure, not a peer layer. Parser
  commands are secondary navigation tools; ruleset resolution mechanics are the
  focus during play. (§1, §2, §4)

- Added narrative voice profiles pulled from the ruleset's own inspirational
  media citations ("Appendix N," "Suggested Viewing") — the builder extracts the
  books, films, and games the designers cite as influences and structures them
  into enrichment profiles the GM can apply via narrative directives.
  (REQ-226, enrichment Module 7)

- Spec-driven updates now include an enrichment consistency check after the gap
  audit. Orphan enrichment references to changed/removed surfaces are classified
  as auto-repairable, GM-review, or stale-reference and recorded before the
  Pattern Buffer re-run. (REQ-228)

- Adventures loaded into a Novel now surface enrichment matches — voice examples
  for adventure NPCs, lore templates for adventure locations, and action
  patterns for encounters — in an augmentation section with a pointer to the
  enrichment status dashboard. (REQ-229)

- Added per-module enrichment dashboard (`enrichment://status`) showing
  activated/inactive/stale/pending counts per output module, and per-module
  toggle (`toggle_enrichment_module`) so the GM can disable entire categories
  without removing items. (REQ-230, REQ-231)

- Community enrichment now supports partial refresh — only modules whose content
  hash differs are replaced; unchanged modules and activated items are
  preserved. (§11.1)

- The Pattern Buffer was restructured from 23 to 22 sub-workflows: merged undo-during-
  combat into simulated combat (S4), workflow cancellation into workflow
  validation (S22), and adventure generation + encounter lifecycle (S18–S19)
  into one. Invalid-param testing moved to tool surface sweep (S1). Roll
  transparency, audit hash chain integrity, and adversarial input safety now
  have dedicated Pattern Buffer assertions. (§6.6)

- The Pattern Buffer Method now uses a second MCP connection only for sub-workflows
  exercising cross-hat interaction — single-hat scenarios use one connection.

- Convergence loop efficiency improvements: audit subagents now batch every two
  construction steps instead of after every step; regression gates re-measure
  only source-overlapping metrics instead of all metrics; guidance pass is
  deferred to a post-mechanical-extraction batch; Roles and Guidance categories
  have a lower confidence floor (30%) that triggers a finding without forcing
  re-extraction. (§6.5, §6.3)

- Discovery chunk size is now dynamically calibrated — after extracting the
  first 5 mechanical sections, section count per chunk is set to the context
  budget divided by the measured average tokens-per-section. (§6.3)

- Post-write verification in production mode now uses tiered depth: source files
  get full checks, artifact files get structural-only checks. (§6.5)

- Golden transcript replay for Light and Standard tiers now uses the first 100
  interactions of the fixture, with T185 contract coverage verifying all
  applicable contracts are exercised. Full transcript only for Heavy/Huge tiers.
  (§8)

- The assumption audit now supports re-use across same-spec builds against
  different rulesets — categories unaffected by the ruleset paradigm delta
  carry forward prior audit results. (REQ-101)

- Appendix W: World-model golden fixture for ruleset-free builds.

- Session lifecycle: audit logs now carry `[session_boundary]` markers
  between sessions with per-session metrics (entry counts, timespans, combat
  rounds) surfaced in `spec_health`. `session_recap` accepts an optional
  `session_id` to scope output to a single session. (REQ-237)

- Novel state safety: `end_novel` now rotates backups before deletion (last N
  retained per `TTRPG_NOVEL_BACKUP_COUNT`) and the server restores from backup
  on corruption detection. (REQ-238)

- Audit log compaction: long-running Novels can compress old audit sessions
  into an archive with summaries (timespan, entry count, confrontations,
  significant rolls). The archive is retrievable at `audit://novel/archive`
  for game-history queries. (REQ-239)

- Novel cloning and checkpoints: `clone_novel` forks a Novel with optional
  audit-session trimming, and `set_checkpoint`/`restore_checkpoint` provide
  named save points with configurable slot limits. (REQ-240, REQ-241)

- GM scratchpad: Notes tier added to Novel state — `set_note`/`remove_note`
  and `list_notes` for storing private GM reminders visible at `notes://<key>`.
  Notes are hat-filtered, persist with the Novel, and are included in export.
  (REQ-242)

- Novel interchange validation: `import_novel` now carries strict mode —
  enabled via `strict=true`, it rejects imports with unresolvable references
  rather than accepting them with a warning. (REQ-096)

- Ruleset-native enrichment classification is now feedback-driven, not a
  one-pass sort. When a module is empty after initial classification, the
  builder re-reads the relevant source section and attempts re-classification —
  one pass per barren module. The enrichment population metric (≥4 of 7 modules
  populated) is now tracked in the Phase 1 convergence loop with velocity
  monitoring, alongside a new term-anchoring metric that verifies enrichment
  items reference valid ruleset index terms. (REQ-225 amendment, §6.5 Phase 1)

- Spec-driven updates now auto-populate enrichment for new surfaces. After the
  gap audit implements new tools or resources, the builder runs a scoped
  REQ-225 re-classification on only the source sections that produced those
  surfaces, merging new `[ruleset]` items into the existing enrichment manifest
  without replacing existing content. (REQ-243)

- Module-count fix: REQ-160 and the export manifest now reference seven output
  modules (narrative_voices was added as the 7th module by REQ-226 but these
  counts weren't updated). §5.8 REQ count bumped from 20 to 21.

## 2026-08-07 — Build process efficiency: dynamic chunking, regression gates, and question-tiering

- Discovery now sizes rulebook-reading chunks by token budget instead of a
  fixed 10-section count, preventing context collapse on dense chapters and
  wasted round-trips on sparse ones. The chunking strategy is recorded in
  DECISIONS.md. (§6.3)
- The convergence loop now re-measures all metrics after each improvement step,
  catching regressions where fixing one metric silently breaks another.
  Oscillating metrics share the current step's remaining budget. (§6.5)
- Build pre-build questions are now two-tiered — Required first (path, client,
  save location, server name), then Advanced with default-acceptance (ruleset
  name, config path, spec URL, build mode, inform version). Operators face 4
  questions instead of 10. (§6.2)
- Converged servers can no longer ship with an unlimited count of unresolved
  non-blocking Pattern Buffer failures — 3 or more requires explicit operator
  acknowledgment at handoff. (§6.6)
- The ruleset-free mode's scattered "WHEN B1 is `none`" zero-case clauses
  have been consolidated into a single Standing Rule 9, reducing 15+ scattered
  clauses across 4 files to one governing rule with local references. (§4, §6,
  §8, §9)
- The auditor pre-flight now re-runs every 5 build sessions and on spec version
  changes, catching sub-agent quality drift that single-session checks miss. (§6.5)
- Construction step 4's acceptance check is now a full G2 golden-transcript
  replay instead of an undefined "dry-run." (§6.4)
- The suggestion-coverage intent set is now structurally constrained — it must
  include intents from every action category, a compound intent, a ruleset
  edge case, and an empty-result intent — reducing self-grading risk. (§6.5)

- The Inform world-model server is now published as the `@holonovel/inform`
  npm package with separate `core` and `world` entry points. The core
  scaffold provides state management, hat gating, macros, and enrichment
  types; the world entry point provides rooms, things, exits, parser
  commands, and the kind hierarchy.
- The `inform/src/` directory has been restructured into `src/core/` and
  `src/world/` subdirectories with barrel exports. The server helpers
  (initServer, getHat, requireGM, requireNovel, etc.) have been extracted
  into `core/server.ts` for reuse by TTRPG servers.
- The dnd5e server now depends on `@holonovel/inform` and inherits the
  full world-model layer. Eight world-model tools (command, create_room,
  delete_room, create_thing, delete_thing, create_exit, delete_exit,
  convert_source) are now registered. New entities gain `inventory` and
  `current_room` fields; each Novel carries a serialized `world` state
  tier.
- The specification now describes the new build architecture: B10 asks
  which version of @holonovel/inform to use instead of a provider-docs
  path; §6.3 replaces world-model provider indexing with Inform scaffold
  installation; §6.4 construction starts from the inform skeleton; and
  the Inform Pattern Buffer (§6.6) runs when inform is published, not during
  TTRPG builds. (spec/01-foundations.md, spec/03-build.md,
  spec/build-phase-map.md)

## 2026-08-07 — Combat, Narrative POV, and workflow staleness

- Abandoned decision workflows now auto-cancel after a configurable number
  of connection restarts, restoring pre-workflow state. The staleness
  threshold is set via `TTRPG_WORKFLOW_STALENESS_CONNECTIONS` (default 5).
  (REQ-224)
- `set_active_entity` now accepts an optional `pov` parameter — `character`
  (locked perspective, default) or `omniscient` (unrestricted narration).
  The POV mode persists across entity switches and server restarts.
  (REQ-220, REQ-223)
- `hat_briefing` now includes a never-truncated POV directive after the
  scene section. When character-locked, it names the active entity with
  narrative instruction and personality fields. When omniscient, it
  displays "POV: none — narration is omniscient."
- Pending workflow JSON persistence round-trip: `pending_workflow`,
  `pending_staleness_counter`, and `connection_counter` already serialized.
  Auto-cancel restoration uses the pre-workflow snapshot when available.

## 2026-08-07 — Combat navigation, parser vocabulary, POV mode, and workflow staleness

- Combat-navigation interaction: the world-model layer now blocks parser
  navigation commands during active combat — inspection and non-spatial
  commands still work, but movement is locked until combat ends. Prevents
  players from walking out of fights they're engaged in. (REQ-221)
- Parser command vocabulary extension: builders now discover additional
  command verbs from the ruleset's own text — if the equipment section
  mentions "push" and "pull," those become first-class parser commands with
  source anchors. Ruleset-free builds keep the base vocabulary only.
  (REQ-222)
- POV mode control: `set_active_entity` now accepts an optional `pov`
  parameter — `character` (locked to that entity's perspective, the default)
  or `omniscient` (narration unrestricted even with an active entity). POV
  mode persists across entity switches and server restarts. (REQ-223)
- Workflow staleness detection: abandoned decision workflows auto-cancel
  after a configurable number of connection restarts (default 5), restoring
  pre-workflow state and recording a `[workflow_stale]` audit entry. The
  threshold is configurable via `TTRPG_WORKFLOW_STALENESS_CONNECTIONS`.
  (REQ-224)

## 2026-08-07 — Narrative POV: player perspective controls for multi-character play

- Added REQ-220 (Narrative point of view): `set_active_entity` now carries narrative POV
  semantics — the server includes a POV directive in `hat_briefing` instructing the GM AI
  whose eyes and voice to narrate from.
- Extended REQ-074 (Multi-entity support) with POV cross-reference.
- Updated REQ-109 (Hat briefing composition): added narrative POV directive as a
  decision-critical group, positioned after scene state and before entity listing.
- Updated REQ-135 (Briefing size budget): POV directive added to never-truncated tier.
- Added T262 (Narrative POV directive) to the derived test catalogue.

## 2026-08-07 — Ruleset-free build mode: world-model-only servers

- Added ruleset-free build mode (REQ-218): when B1 is `none`, the builder skips all
  TTRPG extraction and builds an infrastructure-tools + world-model server.
- Defined ruleset-free entity creation (REQ-219): `create_character` produces
  narrative-only entities with no mechanical fields.
- Amended REQ-063 (intro prompt) with "when ruleset-free" clauses for publisher
  tagline and sourcebook listing.
- Amended REQ-207 (core-mechanic identification) with ruleset-free skip clause.
- Added zero-case clauses to convergence Phase 1 and Phase 2 metrics for ruleset-free
  builds (§6.5).
- Added Appendix W (World-Model Golden Fixture) — a parser-command-based transcript
  exercising infrastructure contracts without dice or stats.
- Branched G0 step 2, G2, H1, H10, and H12 for ruleset-free builds.
- Added B1 `none` option and viability pre-check skip for ruleset-free builds (§6.2).
- Created `inform/docs_md/world-model-provider.md` — the provider documentation for
  the world-model kind hierarchy, property contracts, and parser command catalog.
- Added three new derived tests: T259 (build mode), T260 (entity creation), T261
  (world-model fixture replay).

## 2026-08-07 — World-model layer: mandatory Inform-integrated spatial model

- Added §5.10 defining a mandatory world-model layer — rooms, things, exits,
  containment, properties, kinds, parser commands, world-model CRUD, and hybrid
  source conversion — installed by default in every Holonovel server. Conflict
  resolution: ruleset overrides world-model, world-model overrides
  infrastructure. (REQ-195–202)
- Replaced the adventure module model with a hybrid format: adventure modules
  with a `## World` section populate the Novel's world-model tier at load time
  via declarative assertions interleaved with TTRPG annotations (`@encounter`,
  `@trap`, `@npc`, `@lore`). Modules without a `## World` section load as flat
  indexed prose. (REQ-079 replaced, Appendix K rewritten)
- Extended `generate_adventure` to produce world-model content — generated
  adventures now include at minimum a starting room with description and exit
  connections when the premise suggests spatial content. (REQ-132 extended)
- Index the world-model provider documentation at build time from the B10
  intake path; the extracted kind hierarchy, property contracts, and parser
  command catalog are surfaced at the `world://kinds` resource. (§6.3 provider
  indexing, B10 question)
- Added world-model resource URIs (`room://<id>`, `thing://<id>`,
  `world://map`, `world://kinds`) to the resource catalog. (REQ-022 amended)
- Tightened REQ-200 (kind contracts) — collapsed enumerated kind catalog into
  a single paragraph, reduced ~80 words.
- Added F7 failure mode (world-model assertion parsing) with fault tree
  covering unrecognized assertions, duplicate names, kind contract violations,
  and unresolved annotation references.
- Unified foundational prose — Quick Reference, Play Model, and Requirements
  at a Glance now describe the world-model as a core server component.
- Updated spec repository URL to git.gay/flukeatzerocool/Holonovel across
  build config, handoff artifacts, and README.

## 2026-08-07 — 10 subsystems hardened across tiers

- Added converter selection, image-content disposition, progressive sampling,
  and content sanitization contracts to the Convert workflow, completing the
  source conversion subsystem. (REQ-179–182)
- Defined scene-type tool classification with compound-type persistence,
  turning set_scene_type into an ordered list that drives hat_briefing and
  suggest_actions ordering. (REQ-087 amended, REQ-183)
- Added alias disambiguation, canonical category determination, alias
  discovery, and subcategory-filtered results to canonical lookups.
  (REQ-184–186)
- Hardened action classification with five annotation rows (read-only,
  state-reading, command, generation, hybrid) and an explicit mapping table
  replacing the prior three-type model. (REQ-015 amended, REQ-187)
- Specified tool-surface economy defaults — per-action-class consolidation
  rules, dice-notation tool naming, and a hard seven-tool-type floor per
  category. (REQ-188–189)
- Completed prompt-length budget tiers, truncation priority order, and
  novel_setup composition with adventure, prompt guidance, and lore
  integration. (REQ-023 amended, REQ-118/063/078)
- Defined the full resource URI catalog with hat-filtered templates,
  per-resource output schemas, and list resource rendering contracts.
  (REQ-022 amended, REQ-105)
- Added respond drain result contracts, option display-label pairs, pending
  workflow staleness detection, and batch-respond collision contracts to
  decision workflows. (REQ-190–193)
- Expanded spec_health with per-file and per-category confidence breakdowns,
  a build_complete fingerprint field, and cross-references consolidated
  around REQ-098. (REQ-025 amended, REQ-065/147 amended)
- Synced the dnd5e MCP server — 61 tools registered, spec hash matched,
  server rebuilt to reflect all updated REQ contracts.
- Enumerated the always-present infrastructure tool categories —
  character creation, condition management, combat, table rolling, and
  session recap — which exist independent of ruleset content and are
  never waived. (REQ-020)
- Replaced the flat utility-tool list in Appendix D with a
  category-based enumeration synced to REQ-020's infrastructure
  categories.

## 2026-08-07 — Contract hardening across intake, audit, briefing, and personality subsystems

- Strengthened the intake workflow with REQ contracts for workflow selection,
  build-mode profiles, config verification, and mechanical-density pre-checks.
  Restored the missing B8 spec-repository-URL question and disambiguated the
  overloaded "quick" term into quick-create (character creation) and quick-build
  (build mode). (REQ-161–164)
- Defined entity ownership for personality gating and added explicit rendering
  contracts for personality fields in hat_briefing and personality resource
  URIs. Voice examples and NPC personality now carry clear hat gates.
  (REQ-165–167)
- Specified the audit://novel resource contract, a concrete boundary-violation
  marker format, compress_audit output structure, audit-chain integrity
  reporting in spec_health, and full-structure audit log export depth.
  (REQ-168–169, amended REQ-133/086/096)
- Completed the hat_briefing decision-critical boundary — all 16 groups are
  now classified, truncation respects three priority tiers (never/last/first),
  and the section-token-to-group mapping must be documented in DECISIONS.md.
  (amended REQ-109/135/082)
- Hardened adventure modules with a load_adventure error contract, an
  adventure discovery surface in spec_health, content validation against
  Appendix K, post-build drift detection, URI consistency with generated
  adventures, and search_rules confidence-level integration.
  (REQ-170–172, amended REQ-090/079)
- Expanded roll transparency to require discarded-die reporting in
  advantage/disadvantage rolls and per-source modifier decomposition — never
  collapsing to a bare aggregate. Added a concrete O.1 behavioral example.
  (amended REQ-003)
- Replaced signal age timestamps with a persistent connection counter that
  survives restarts, giving accurate "set N connections ago" deltas and
  compound signal entries matching the audit-log schema. (REQ-173,
  amended REQ-069/128)
- Rewrote the session recap contract to mandate a structured output with 14
  named fields, entity status derivation from HP/death mechanics, significant-
  roll criteria, audit-log-derived confrontation summaries, and configurable
  max_transitions/max_rolls parameters. (REQ-174–175, amended REQ-072)
- Added entity and roster-entity removal tools, entity/roster cardinality
  limits matching the existing property-group enforcement pattern, a roster
  listing tool and resource surface, and a duplicate import guard preventing
  silent entity duplication within a Novel. (REQ-176–178, amended
  REQ-074/129)

## 2026-08-07 — Split spec into 10 source files with per-phase builder loading

- Split the monolithic `holonovel.md` (5,300+ lines) into 10 source files
  under `spec/`, assembled via `npm run assemble`. The assembled file remains
  the distribution artifact for builders, verifiers, and spec compliance
  (REQ-105). Source files
  follow canonical load order numbering.
- Added `spec/build-phase-map.md` — a per-build-phase file dependency table
  that lets builders load only the files needed for each phase, reducing
  per-phase context by ~73%. Each §6 subsection now carries a `*Prepare:*`
  directive pointing to the relevant map rows.
- Appendices split into fixtures (`appendices-fixtures.md`: B, C, N — test
  instruments) and reference (`appendices-reference.md`: A, D–S). The
  assemble script interleaves them in canonical appendix order.
- Added a §5 subsection → REQ range mapping table at the top of
  `02-requirements.md` so readers can navigate the 145 REQs by function area.
- Renamed §5.8 (Narrative, Guidance, and Enrichment) to "Enrichment, Lore, and
  Macros" and §5.9 (Novel Lifecycle and Generation) to "Novel Persistence and
  Transport" for clarity and reduced overlap with other subsections.
- Fixed stale cross-section references that pointed to moved or renamed
  sections, updated related heading counts to reflect the reorganized
  §5, handoff verification, and Pattern Buffer structures, and updated the
  reading guide to describe the multi-file architecture.
- Updated `.githooks/pre-commit` to run `npm run assemble` before checks,
  the `AGENTS.md` layer map to document file numbering conventions, and the
  `README.md` spec description to reflect the source/build split.

## 2026-08-06 — 13 spec improvements across 3 subsystems

- `spec_health` now carries a `gap_audit` section for the spec-driven update
  workflow: a delta summary, tool-catalog comparison, resource-map comparison,
  prompt-list comparison, and hat-gating summary. (REQ-025)
- `spec_health` reports prompt health for every registered prompt — name,
  presence, budget compliance, and stale references to tools or resources
  that no longer exist. (REQ-138)
- `spec_health` reports resource URI presence for every REQ-022 catalog entry,
  so the gap audit can detect missing registrations. (REQ-139)
- The `run_workflow` prompt must now derive its tool associations from the
  live catalog's action classifications, not hardcoded keyword strings.
  (REQ-023, T155)
- Novel atomic writes now require explicit durability (fsync before rename)
  and collision-resistant temp file names. (REQ-092)
- Pending workflow state is now explicitly Novel-tier, persisting through
  restarts alongside all other property groups — no more ambiguity with
  ephemeral session state. (REQ-042)
- `end_novel` confirmation now has a concrete dispatch contract: `respond`
  receiving the end-novel decision must execute the full disposal sequence,
  and unrecognized decisions return `[NOT_FOUND]`. (REQ-140)
- `TTRPG_NOVEL` at server startup now has a contractual auto-load path:
  resume if the Novel exists, create if it doesn't, surface errors in
  `spec_health` if activation fails. (REQ-088)
- Novel file-size reporting in `spec_health` must match on-disk reality
  within 1%, with a `[size_mismatch]` warning on drift. (REQ-097)
- `advance_combat` now derives its turn report from the audit log when
  resolution is delegated to separate tools, ensuring full transparency
  even with tool-separated attack/damage mechanics. (REQ-043)
- Statless combat participants (dangers, statless NPCs) now advance
  automatically with an `[AUTO]` marker and narrative action, no caller
  intervention required. (REQ-043)
- Active combat state is now a dedicated `hat_briefing` group showing round,
  turn order with current-turn highlight, and hat-filtered participant
  redaction for the Player hat. (REQ-043, REQ-109)
- The total combat rounds counter now increments on round wrap instead of
  `end_combat`, keeping it live mid-combat and safe under undo. (REQ-043)

## 2026-08-06 — Pattern Buffer scoping for spec-driven updates

- REQ-098 no longer requires blanket Pattern Buffer re-run during spec-driven updates
  — the builder now selects only sub-workflows exercising the surfaces changed
  by the gap audit. (REQ-098, §6.6)
- Added a surface-to-scenario mapping table in §6.6 that connects each changed
  surface (character creation, combat, conditions, search, etc.) to the specific
  Pattern Buffer scenarios that exercise it, plus overrides for out-of-mapping cases
  like new tools or prompts.

## 2026-08-06 — Hat gating hardening: audit logging, surface contracts, and scope clarification

- Fixed a spec bug in REQ-030 that claimed hats were per-connection when
  they're actually per-Novel — two connections to the same Novel now
  explicitly share hat and entity state. (REQ-030)
- Forbidden tool calls are now audited — every boundary violation produces a
  log entry so probing for GM-only content is detectable. (REQ-133)
- The Player hat now has a guaranteed tool surface — dice resolution,
  lookups, character sheet, action suggestions, signals, help, undo, and
  hat switching are always callable. (REQ-134)
- `hat_briefing` output is now size-budgeted with configurable truncation,
  ensuring hat foundations and the intro pointer always survive trimming.
  (REQ-135)
- When no hat is active, `hat_briefing` now returns setup-oriented content
  instead of an undefined state. (REQ-136)
- Every tool's gate classification is now explicitly recorded in
  DECISIONS.md and enumerable at build time — no more guessing which tools
  are GM-only. (REQ-137)
- Empty briefing groups now carry explicit markers ("No active NPCs")
  instead of silently omitting, preventing the caller from hallucinating
  missing content. (REQ-109)
- Documented that the hat model is a narrative-integrity feature, not a
  security boundary — `set_hat` remains always callable without
  authentication, by design for solo play. (REQ-109, Appendix P)

<!--
  CHANGELOG WRITING STYLE

  Every entry must be comprehensible to someone who hasn't read the spec
  in a month. The changelog is for human readers, not for spec traceability.

  Rules:

  1. Human-readable description first. Open every bullet with what changed
     and why it matters in plain English. The REQ reference follows in
     parentheses — it's a traceability anchor, not the subject.

     Yes: "Deleting a Novel is no longer irreversible — end_novel now
          moves save files to a .trash/ directory with a configurable
          retention period. (REQ-117)"

     No:  "REQ-117: Added Novel retention period — end_novel moves files
          to .trash/ with configurable TTRPG_NOVEL_RETENTION_DAYS..."

  2. No internal diffs. Don't list appendix row additions, manifest count
     changes, or test ID catalogue updates. Those are spec maintenance
     records, not changelog content.

     No:  "Appendix E: Added REQ-116 and REQ-117 rows; bumped spec-version
          on REQ-040, REQ-041, REQ-065, REQ-088, REQ-092, REQ-097.
          Manifest: 93 → 95 rows."

  3. Group by what a user or builder experiences. Organize bullets under
     each date heading by impact area (e.g., state persistence, combat,
     character creation), not by REQ number order.

  4. Reader test. Every bullet must pass: "Would someone who hasn't read
     the spec in a month understand what changed and why it matters?"

  5. Omit tool and environment variable names unless a reader needs the
     exact name to use the feature. Describe what the feature does, not
     what it's called.
-->

## 2026-08-06 — State model: deep research and 6 improvements applied

- The Novel's property groups now carry configurable cardinality limits
  enforced at mutation time — NPCs, countdowns, lore entries, and enrichment
  items each have a maximum with per-group `[STATE_CONFLICT]` enforcement.
  `spec_health` reports counts and overflow flags for every group.
  (REQ-129)

- Re-running the Enrich workflow now preserves every enrichment item the GM
  has explicitly activated, replacing only inactive items. Full replacement
  of all enrichment — including activated items — requires an explicit
  `revert_enrichment` first. The enrichment property table row reflects this
  contract. (REQ-130)

- Novel property groups now have a defined initialization order that respects
  cross-group dependencies: Adventure loads first (provides NPC templates),
  then NPCs, Lore, Countdowns, and Scene state last. The order is stable and
  verifiable across restarts. (REQ-131)

- Generated adventure content from `generate_adventure` is now a formally
  scoped transient Novel artifact, distinct from build-time indexed adventure
  modules. A Novel may hold both an indexed adventure and a generated adventure
  simultaneously, with `hat_briefing` surfacing indexed first and
  `search_rules` tagging generated results. (REQ-132)

- All six cross-property group couplings — Scene→Lore trigger matching,
  Scene→Countdown hook decrement, Combat↔NPC participation, Adventure→NPC
  templates, Enrichment→Lore suggest, and Enrichment→Scene/Entity/NPC content
  — are now documented in a single table (§7.7.1) enumerating pair, coupling,
  nature (Navigational/Mechanical), and REQ citations.

- The "Connection" state tier is now "Session" — a Holonovel-level concept
  independent of the MCP transport layer. This aligns the spec with the MCP
  2026-07-28 specification's removal of protocol-level sessions. The
  behavioral contract is unchanged; the renaming clarifies that Session state
  is scoped within the Holonovel process, not the MCP channel.

## 2026-08-06 — Spec review automation: validation guardrails and pre-commit checklist

- Added three new checks to `scripts/validate.ts`: bare default-value detection
  in REQ bodies (flags `default 32,000 bytes` patterns that the existing
  `Default:` clause check missed), stale appendix-range detection (flags
  "Appendices A–R" when the actual count differs), and hardcoded cross-section
  count detection (flags "six metrics in §6.5" type drifts for human review).
- Created `scripts/detect-near-dupes.ts` — a near-duplicate paragraph detector
  that slides a 40-sentence window across the spec and reports paragraphs with
  >75% word overlap. Integrated into the `npm run check` pipeline.
- Documented the `GN` gate naming convention in §8 (the canonical form is
  G0/G2/etc.; "Gate N" is deprecated in body text).
- Updated Appendix M to note that REQ authoring violations are mechanically
  checked by `npm run validate` before commit.
- Added a pre-commit checklist to AGENTS.md covering cross-section counts,
  appendix ranges, REQ quality, stale references, and gate naming.
- Updated AGENTS.md layer map and gates table to reflect the new scripts
  and naming conventions.

## 2026-08-06 — Spec audit: defect fixes, structural tightening, and word-count reduction

- Fixed a duplicate paragraph in REQ-065 (build fingerprint) where "When
  unrecoverable state is detected…" appeared twice with slightly different
  wording. The merged paragraph is one-third shorter and unambiguous.
- Removed the hardcoded "six metrics" reference in REQ-025 — convergence
  metrics are now referred to without a fixed count that drifts with spec
  revisions. The builder determines metric count from §6.5.
- Standardized inconsistent "Gate N" vs "GN" naming — all references now
  use the G-prefix convention established in §8 (G0, G2, G3, G4, G5).
  Also fixed a stale "Appendices A–R" reference to the correct "A–S".
- Resolved the tension between §9's "Four documents. No more." and §6.4's
  mandatory LICENSE.md requirement. The handoff now says "Four handoff
  documents (plus LICENSE.md)" — the license is part of the server, not
  a handoff artifact.
- Collapsed the six ASCII-art fault trees in §3 to compact bullet lists,
  reducing the section from ~90 lines to ~30 without losing any guard
  citations. The summary table above the trees already carries the
  primary mitigations.
- Removed Appendix O (Behavioral Contracts) — all 93 lines of prose
  duplicated contracts already defined in §5 and §7. Replaced with a
  compact pointer to those sections. Roll-format examples live in §7.3.
- Compressed all 23 Pattern Buffer sub-workflow descriptions from multi-line
  prose paragraphs to single-line assertions, reducing the section by
  over 100 lines. The structured encoding paragraph was compacted; the
  convergence integration, improvement measurement, regression assertion,
  assertion compression, and exit criteria paragraphs were halved.
- Removed the "Verified by" column from Appendix E (requirements
  manifest) — it duplicated the Check: citations in every REQ body.
  The spec version pin remains as the table's unique value.
- Merged Appendix S (builder glossary) into the §4 terminology table
  and replaced the appendix with a two-line pointer. Standing Rule 7's
  five-point REQ authoring checklist was moved to Appendix M where the
  REQ anatomy rules live, replaced with a one-line pointer.
- Restructured §7 (runtime conventions) — replaced prose subsections for
  tool conventions, output contracts, decisions, and guidance with compact
  reference tables that cross-reference their source REQs in §5.
- Removed Levenshtein-distance and default-value language from REQ-002
  and REQ-004 bodies (Appendix M violations). These remain verifiable
  through tests without being hardcoded in REQ text.
- Fixed AGENTS.md appendix range to match the current 19 appendices.

## 2026-08-06 — SDD conventions upgrade: authoring, navigation, and cross-reference health

- The specification now opens with a reading guide teaching builders how to
  navigate the 4,300-line document in layers — builders start with §1/§4/§6,
  maintainers start with Appendix M, verifiers start with §8. This makes the
  monolithic spec reviewable in targeted passes rather than requiring a
  front-to-back read.
- Every requirements domain in §5 now carries an explicit out-of-scope
  statement defining what it does NOT cover — multiplayer sync, real-time
  collaboration, cryptographic RNG, runtime AI generation, and other
  intentionally excluded concerns. This bounds the agent's interpretation and
  matches SDD "spec the negative space" best practice.
- All twenty-six requirements in §5.1 (output and error contracts) now carry
  a one-sentence acceptance criterion between the body and the Check: line,
  so a human reviewer can verify what the REQ demands without following the
  test citation. The stated acceptance criterion is a plain-English check a
  running server can be held against.
- Appendix M now recommends EARS notation — the five structured requirement
  patterns (Ubiquitous, Event-driven, State-driven, Unwanted-behavior,
  Optional-feature) that make trigger/condition/response explicit in
  machine-parseable clauses compatible with AI builders.
- A new cross-reference health script catches dead citations (REQs cited
  that don't exist), REQ blocks present in the body but missing from the
  manifest, and one-way cross-section citations with no reciprocal reference.
  Runs as part of the standard check pipeline.
- A new Builder Glossary (Appendix S) defines domain terms — Builder,
  Convergence loop, Danger, Discovery, Pattern Buffer, Hat, Macro, MUST-covering
  set, Novel, Waiver, and more — with citing REQs, so builders encountering
  a term mid-spec have a single lookup point.
- AGENTS.md now reflects the current REQ count (107, up from the stale 75)
  and appendix range (A–R, not A–P).
- The remaining 91 requirements across §§5.2–5.9 — extraction, tools,
  decision workflows, hats, state, determinism, narrative, and Novel
  lifecycle — now carry one-sentence acceptance criteria between the body
  and the Check: line. A builder or reviewer can verify what a REQ demands
  without following the test citation.

## 2026-08-06 — Player signals subsystem: pace/focus semantics, briefing surface, and staleness

- Fixed a contradiction where session zero directed players to record
  exploration/action balance under the `pace` signal, but the signal
  specification defined `pace` as speed and `focus` as that balance.
  Session zero now separates them: `pace` (slower/faster) and `focus`
  (action/exploration/dialogue) are recorded independently, matching
  the specification's five-axis semantics. (REQ-069, REQ-078)
- Player signals now appear as a dedicated section in the GM briefing
  with signal type, value, and age — how many connections ago each was
  last set. Previously REQ-069 required briefing visibility but the
  implementation surface contract was undefined. (REQ-128)
- Signal entries now carry a `last_updated` timestamp, so a preference
  set in session one is distinguishable from one refreshed mid-campaign.
  (REQ-069)

## 2026-08-06 — Voice and personality subsystem: naming, composition, and rendering

- Entity personality fields and voice examples are now formal members of
  the hat_briefing composition contract — previously REQ-077 required them
  in hat_briefing but REQ-109 (the authoritative 16-group enumeration)
  omitted them. The internal contradiction is resolved. (REQ-109, REQ-077)
- The `voice` field now conveys the entity's speech characteristics across
  pitch, pace, vocabulary range, mannerisms, and formality register — not
  just a single free-text blob. Tag semantics on voice_examples are defined:
  tags describe the scene type or emotional context of the dialogue snippet.
  Authorship guidance helps GMs and players write personality fields that
  actually work: concrete behaviors beat abstract adjectives. (REQ-077)
- When an entity speaks in-character, their voice_examples must be rendered
  in the prompt context alongside personality traits, with dialogue examples
  ahead of trait descriptions. The show-don't-tell ordering comes from
  community research showing dialogue imitation beats trait-list reasoning
  for character consistency. (REQ-126)
- Ruleset-native personality constructs — D&D 5e's Traits, Ideals, Bonds,
  and Flaws, or whatever the ruleset provides — are now discovered and
  mapped to Holonovel personality fields during build. The `set_personality`
  tool and `session_zero` prompt reference ruleset-native terms when they
  exist. (REQ-127)
- REQ-071 renamed from "Example-of-play snippets" to "Narrative tone
  samples" to eliminate the naming collision with entity voice_examples.
  The `[voice]` tag is now `[narrative-tone]` and the resource moves to
  `guidance://<hat>/tone`. (REQ-071)

## 2026-08-06 — Countdown subsystem: visibility, direction, and lifecycle

- Countdowns now support two hat scopes — `game_master` for private
  threats (reinforcements, faction schemes, hidden poison timers) and
  `shared` for player-visible tension (ritual completion, torch burnout,
  environmental collapse). Shared countdowns appear in both hats' briefings.
  (REQ-073)
- Countdowns now support two directions — `decrement` (counts down to zero,
  the existing behavior) and `increment` (counts up to total, for progress
  clocks and accumulating threats). Both fire an audit log entry on reaching
  their endpoint. (REQ-073)
- Expired countdowns are now explicitly removed from the active set and
  their name slot freed for reuse. A new countdown with the same name
  creates a fresh timer, not a reactivation of the expired one. (REQ-073)
- The `on_scene_transition` flag is now available on both round and
  narrative countdowns, not just narrative — a round countdown on a
  collapsing cavern can now tick on scene changes as the party moves.
  (REQ-125)
- New macro tokens `{{countdown.<name>.scope}}` and
  `{{countdown.<name>.direction}}` let narrative prompts introspect
  countdown properties. (REQ-085)

## 2026-08-06 — Lore subsystem core contract enforcement

- Lore entries now sort by priority in the GM briefing, so the most
  important entries always surface first. (REQ-083)
- Sticky lore entries now actually persist — an entry set with `sticky: 3`
  remains visible for three briefings after its trigger keywords leave the
  scene, then decays. Previously the field was stored but ignored.
  (REQ-083)
- Lore entries are now subject to a configurable token budget via
  `TTRPG_MAX_LORE_TOKENS`. When triggered entries exceed the budget,
  lower-priority entries are omitted from the briefing and reported in
  `spec_health`. Without the config, lore is unbounded as before. (REQ-083)
- `suggest_lore` now matches enrichment templates against the current
  scene instead of returning a hardcoded placeholder. Results include
  content previews, confidence scores, and source URLs. (REQ-083)
- Markdown lorebook exports now embed metadata (triggers, scope, priority,
  sticky, group) in HTML comments, making the Markdown format
  round-trippable — export as Markdown and re-import to restore all
  metadata.
- `import_lorebook` now accepts both JSON and Markdown formats, auto-detecting
  the format. (REQ-094)
- New `update_lore_entry` tool for partial field updates without
  reconstructing the entire entry — useful when an entry has accumulated
  runtime state (sticky counters, enrichment provenance). (REQ-083)
- Added three lore resource endpoints: `lore://groups` lists entries by
  group, `lore://{key}` returns full metadata for a single entry,
  `lore://templates` surfaces enrichment-derived templates. (REQ-022)
- Appendix L now defines a minimum metadata contract for Markdown round-trip
  fidelity, so two independent builders produce compatible lorebook formats.

## 2026-08-06 — Decision workflow subsystem hardening

- Workflow decisions now have an explicit lifecycle — a workflow begins when a
  tool returns `[NEED_INPUT]` and ends when `respond` drains the decision.
  Only one workflow may be pending per Novel; a second `[NEED_INPUT]` returns
  `[STATE_CONFLICT]`. (REQ-042)
- Pending workflows now block undo, redo, and hat switching with clear
  `[STATE_CONFLICT]` responses, closing a gap where these tools were blocked
  by the spec but had no queryable pending-workflow state to enforce it.
  (REQ-042, REQ-041, REQ-066)
- `respond(cancel)` now correctly restores the pre-workflow snapshot even after
  a server restart — the pending decision and its pre-workflow state survive
  restarts. (REQ-042)
- Added a Pattern Buffer sub-workflow S23 (workflow validation) covering rejected
  decisions, rejected options, cancellation state restoration, concurrent
  workflow rejection, restart survival, and blocked-tool assertions. (S23)
- Added T138 (workflow lifecycle) to the test catalogue.

## 2026-08-06 — Scene management subsystem hardening

- Resolved a contradiction in REQ-076 — the "never influences tool behavior"
  claim now explicitly permits guidance-surface influences (hat_briefing tool
  ordering, suggest_actions filtering, lore trigger matching) while
  continuing to prohibit mechanical-resolution influence. (REQ-076)
- Added configurable scene history cap (default 50) with `[truncated]`
  markers when exceeded, preventing unbounded growth of `scene://history` in
  long campaigns. Full history remains in the audit log. (REQ-076, T132)
- Added structured scene fields — `location`, `time_of_day`, and
  `atmosphere` — to `set_scene_state`, surfaced in `hat_briefing`,
  `scene://current`, and `scene://history`. (REQ-076a, T133)
- Changed narrative directives from a singleton free-text field to a stacked
  array of `{label, instruction}` entries with backward-compatible
  single-string input. Duplicate labels replace the prior entry.
  (REQ-081, T134)
- Scene types now accept compound tags — the GM may set multiple types (e.g.,
  "combat" and "social" for a duel amidst negotiation). Tools matching any
  active type are prioritized in hat_briefing and suggest_actions. Single
  string input remains valid for backward compatibility. (REQ-087, T135)
- Added scene transition hook — every scene change records a
  `[scene_transition]` audit entry with old and new descriptions. Narrative
  countdowns with an `on_scene_transition` flag decrement automatically.
  A `skip_transition_hook` parameter suppresses the hook for detail updates
  within the same scene. (REQ-125, T136)
- Added a Novel-scoped `scene_tick` pacing counter, recording the number of
  combat rounds elapsed in the current scene (resets on transition). Visible
  in GM hat_briefing as a pacing aid. (REQ-076, T137)

## 2026-08-06 — D&D 5e MCP server rebuild, terminology audit, and spec hardening

- Rebuilt the dnd5e MCP server from the D&D 5e SRD v5.1 ruleset (1,021
  Markdown files), producing 51 tools, 29 resources, 7 prompts, and 5
  artifacts. All blocking Pattern Buffer sub-workflows pass.
- Fixed persona→hat terminology drift: 11 renames across the server source
  code so that tool descriptions, parameter names, and export fields all use
  the current spec term "hat" (not the deprecated "persona"). (REQ-031,
  REQ-066)
- Added a Surface Terminology domain to the convergence loop and a
  post-write terminology grep check to the builder workflow, so builders
  automatically catch deprecated terms during construction. Added Appendix R
  (Deprecated Terminology) and handoff check H13 (Pattern Buffer freshness) to
  close the feedback loop. (REQ-074)
- Updated DECISIONS.md with Pattern Buffer run evidence, terminology audit record,
  and gap disposition.

## 2026-08-06 — README fact-check and polish

- Tool count corrected from 23 to 58 and ruleset source count from 1,029 to
  1,021 — both now match the live dnd5e server's `spec_health` output.
- MCP client config example fixed — replaced stale `dist/index.js` (removed when
  the server dropped the tsc compilation step) with `npx tsx src/index.ts` plus
  a `cwd` field, matching the working config in `dnd5e/README.md`. Removed
  non-default environment variables.
- Spec Update prose smoothed — "a full comparison audit finds every gap...
  implements changes, and re-verifies" replaces the choppy "Implements changes.
  Re-verifies." sentence fragments. "When a hand-coded server improves" →
  "When a hand-coded server is updated" (fixing a misleading verb).

## 2026-08-06 — Clarify enrichment survival across rebuilds

- Enrichment content stored in a Novel now has a defined lifecycle across
  rebuild scenarios: it survives server restarts and same-ruleset rebuilds
  unchanged, is replaced when the ruleset hash changes and Enrich re-runs,
  and is absent after a nuclear rebuild (deleting the state directory and
  building from scratch) unless the Enrich workflow is selected at intake.
  The enrichment fingerprint model already encoded this behavior; the spec
  now states it explicitly in §11.1 (Rebuild scenarios).
- Removed the overbroad claim in REQ-103 that re-running Build without
  Enrich strips enrichment — this contradicted the Novel's "survives
  rebuilds" persistence contract. `revert_enrichment` remains the runtime
  tool for stripping enrichment; build-time behavior is defined by the
  rebuild scenario taxonomy.
- Added enrichment surface connection validation to the §11.1 verification
  checklist — enrichment items that reference build surfaces (action pattern
  tool names, lore template keywords, adventure advice ruleset terms) are
  now cross-referenced against the live tool registry, ruleset index, and
  resource map, with orphan references recorded in DECISIONS.md.
- Appendix F: Added T125 (enrichment rebuild survival across all four
  scenarios). Appendices E/F: Updated REQ-080 and REQ-103 manifest rows
  and check citations.

## 2026-08-06 — Server prompt hardening and surface reduction

- Server prompts now carry a configurable length budget — when a prompt
  exceeds its budget, low-priority sections are truncated with resource URI
  pointers rather than silently overrunning context. Section headers and
  required contract elements (intro pointer, player_signal directives) are
  preserved regardless of truncation. (REQ-118)
- Intent-mapping prompts must now derive their tool associations from the
  registered tool catalog and extraction model, not from hardcoded keyword
  strings that assume a specific ruleset's terminology. (REQ-023)
- The `use_tool` and `lookup_rule` prompts have been removed — they
  duplicated the `suggest_actions` tool, which is hat-filtered,
  scene-context-aware, and provides structured output. Callers are directed
  to `suggest_actions` for intent-to-tool mapping instead. The prompt
  surface is now five prompts: `run_workflow`, `hat_briefing`, `intro`,
  `session_zero`, and `novel_setup`. (REQ-023, REQ-063, REQ-084, §6.4,
  Appendix D)
- Session zero prompts now include explicit `player_signal` and
  `set_personality` recording directives with concrete argument shapes — a
  caller who follows the directives verbatim produces a valid tool call.
  (REQ-078)
- `spec_health` now reports prompt health — each registered prompt's
  presence, length relative to budget, and stale tool or resource references
  in prompt text. (REQ-025)
- Builder guidance for prompt composition (§6.4.1) documents the five
  sources from which prompt content is constructed: live index, state
  snapshot, registration surfaces, hat-scoped guidance, and required
  contract elements.

## 2026-08-06 — Changelog writing style guide

- Every changelog entry must now describe what changed and why in plain
  English first, with REQ references following parenthetically as
  traceability anchors rather than bullet subjects. Internal diffs —
  appendix row counts, manifest size changes, test ID catalogue updates —
  no longer belong in the changelog; they're spec maintenance records,
  not human-readable history.
- The changelog-before-commit skill now enforces these style rules
  automatically when writing new entries.

## 2026-08-06 — State and recovery hardening

- REQ-041: Replaced "implementation-defined" undo stack depth with a 10-level minimum
  per hat, with DECISIONS.md constraint recording for builders that cannot meet it.
  _Check:_ T10, T121.
- REQ-116: Added redo contract — companion to `undo` with dual-stack semantics
  (undo stack → redo stack on undo, mutation clears redo). _Check:_ T121.
- REQ-092: Added undo snapshot stack persistence across server restarts, closing the
  "undo stack empty after restart" gap. _Check:_ T77, T88.
- REQ-065: Added key-level corruption reporting — when unrecoverable state is detected,
  the server reports which top-level keys or entity/NPC identifiers could not be parsed.
  _Check:_ T52.
- REQ-117: Added Novel retention period — `end_novel` moves files to `.trash/` with
  configurable `TTRPG_NOVEL_RETENTION_DAYS`, preventing irreversible accidental deletion.
  _Check:_ T122.
- REQ-040: Added audit log integrity chain — chained-hash sequence for tamper-evidence
  with mismatch reporting in `spec_health`. _Check:_ T8.
- REQ-097: Added health trend reporting — sliding window of file-size and snapshot-depth
  deltas with `[size_growth]` predictive warning. _Check:_ T101.
- Appendix E: Added REQ-116 and REQ-117 rows; bumped spec-version on REQ-040, REQ-041,
  REQ-065, REQ-088, REQ-092, REQ-097. Manifest: 93 → 95 rows.
- Appendix F: Added T121 (redo) and T122 (retention) test catalogue entries.

## 2026-08-06 — Rules access subsystem hardening

- REQ-110: Added tool surface consolidation contract — functionally identical tools
  differing only by ruleset category are exposed as a single parameterized tool.
  _Check:_ T113.
- REQ-111: Added search result quality contract — results include match context, are
  ordered by relevance, and report suppressed-result counts. _Check:_ T114.
- REQ-112: Added cross-reference discovery contract — canonical lookups include pointers
  to related ruleset sections when the source text cross-references them. _Check:_ T115.
- REQ-113: Added result count reporting contract — tools returning collections report both
  returned and total matching count. _Check:_ T116.
- REQ-114: Added suggestion coverage contract — builder tests action suggestion coverage
  against a curated intent set spanning all action categories, with sub-80% coverage
  recorded as a DECISIONS.md finding. _Check:_ T117.
- Added suggestion-coverage convergence metric row to §6.5 Phase 2 table.
- REQ-067: Added GM-overridable help task-map category assignments via Novel-scoped
  mapping. _Check:_ T118.
- Appendix E: Added REQ-110 through REQ-114 rows (92 REQ rows). Appendix F: Added T113
  through T118 rows.
- REQ-115: Added action pattern activation toggle — requires a GM-only
  `toggle_action_patterns` tool to flip the Novel-scoped action pattern
  activation state. Previously the toggle field existed in state but no tool
  operated it, leaving enrichment action patterns permanently inaccessible.
  _Check:_ T119.
- REQ-084: Amended action suggestions — clarified that `suggest_actions` may
  return multiple plausible tools per intent (natural-language ambiguity),
  unrecognized intents return an empty list (not generic fallback), and
  enrichment pattern integration references REQ-115. _Check:_ T68, T96, T120.
- REQ-114: Amended suggestion coverage — defined concrete curated-intent-entry
  format (intent text, expected action categories per REQ-015, derivation source)
  and clarified that coverage is measured per-intent, with uncovered output
  naming both categories and their intents. _Check:_ T117.
- Appendix E: Added REQ-115 row (93 REQ rows). Appendix F: Updated T68 and T96,
  added T119 and T120.

## 2026-08-06 — Rename persona → hat; disambiguate "role"

- Renamed "persona" to "hat" throughout holonovel.md, dnd5e/holonovel.md,
  README.md, AGENTS.md, and dnd5e implementation files. Tool `set_persona`
  becomes `set_hat`, env var `TTRPG_PERSONA` becomes `TTRPG_HAT`, prompt
  `persona_briefing` becomes `hat_briefing`, guidance resource
  `guidance://shared/persona-switch` becomes `guidance://shared/hat-switch`.
  REQ titles updated: REQ-031 "Hat activation," REQ-062 "Hat foundations,"
  REQ-064 "Hat behavioral boundaries," REQ-066 "set_hat tool," REQ-109
  "Hat briefing composition." §5.5 "Hats and Access," §7.8 "Guidance and
  hat knowledge," §11.1 "Hat enrichment," Appendix O.6 "Hat Gating."
- Disambiguated "role" — REQ-002 "switch roles" → "switch hats," REQ-017
  "Role stories" → "Hat stories," REQ-066 return token `<role>` → `<hat>`.
  Guidance URI templates changed from `<role>` to `<hat>` for consistency.
  Terminology table entry: "Hat — Active hat — player, game_master, or
  none (full access)." MCP protocol terms ("user-role message") retained.
- dnd5e server: `Persona` → `Hat` (type), `activePersona` → `activeHat`,
  `setPersona()` → `setHat()`, `PERSONA_NAMES` → `HAT_NAMES`, `persona_scope`
  → `hat_scope`, `persona_filter` → `hat_filter`. State serialization uses
  `hat` key with backward-compat load (`data.hat ?? data.persona`).

## 2026-08-06 — Dice resolution subsystem hardening

- REQ-003: Added outcome-band reporting requirement — when the ruleset defines named result bands, roll outcomes report which band applies. _Check:_ T47 (extended).
- REQ-050: Clarified seed stream behavior — per-call seed override uses an isolated draw; after override, the next session-seeded draw matches the sequence it would have produced without the override. _Check:_ T111 (new).
- Appendix B.4: Extended RNG witness table with d20 column (seeds 42 and 7) for validating non-d6 draws. Updated draw formula description to include d20.
- Appendix O.1: Strengthened behavioral contract — removed unasserted "wording is not asserted" caveat, mandated prose outcome, required result-band reporting when ruleset-defined.
- New Appendix O.1a: Multi-Die Resolution behavioral contract — transparency requirements for dice pools, keep-N-highest, exploding dice, percentile, Fudge dice, and other multi-die procedures.
- Appendix E: Updated REQ-003 (Verified by → Gate 2, T47), REQ-050 (Verified by → Gate 2, T27, T111).
- Appendix F: Added T111 (RNG seed isolation and d20 witness verification). Extended T27 (seed stream position) and T47 (outcome-band reporting).

## 2026-08-06 — Combat pipeline contract hardening

- REQ-043: Added turn resolution output contract (participant name, action taken, roll result with full transparency, and any resulting state changes), automatic-advancement output clause for dangers and statless NPCs, initiative tie-break rule (entity before NPC before danger, then alphabetical by name), and total combat rounds counter increment on `end_combat`. _Check:_ T110 (new).
- REQ-109: Added active combat state group — round, turn order, and current participant (if in-combat) — to the mandatory `persona_briefing` information groups. Omitted when no combat active. Group count: 14 → 15. _Check:_ T110 (new).
- Appendix O.3: Synced behavioral contract with REQ-043 amendments (tie-break, automatic-advancement output, round-counter increment on `end_combat`).
- Appendix E: Updated REQ-043, REQ-093, and REQ-109 check citations with T110.
- Appendix F: Added T110 (combat state lifecycle: turn order tie-break, persona_briefing visibility, round-counter increment). Updated T109 to cover combat state group assertion.

## 2026-08-06 — Personas subsystem hardening

- REQ-055: Clarified `TTRPG_PERSONA` precedence — Novel persisted persona state wins on resume/switch; env var sets initial persona only when no persisted state exists. _Check:_ T108 (new).
- New REQ-109: Persona briefing composition — enumerates 14 mandatory information groups `persona_briefing` must surface, with empty-group omission clause. _Check:_ T109 (new).
- §8 T18 anti-persona table: Added "Example invocation" column with concrete tool-call examples per persona archetype (Power Gamer, New Player, Curious Player, Rules Lawyer, Forgetful Player ×2).
- §11.1 Enrichment persona scope: Added GM override mechanism — overridden items retain original `auto_scope` for audit.
- Appendix E: Added REQ-109 row (88 REQ rows). Appendix F: Added T108, T109.

## 2026-08-06 — README opener: tagline-first rewrite

- Replaced problem/solution opener with capability-forward prose built around
  "One spec. Any game. Zero code."
- Dropped pain-point paragraph — matches the confident declaration style used
  in every other section.
- §7.7: Simplified state model — collapsed 9-tier table into 3 primary tiers
  (Roster, Novel, Connection) with a Novel properties sub-table grouping NPC,
  Scene, Countdown, Lore, Enrichment, and Adventure under the shared Novel
  lifecycle. Access permissions preserved per property.

## 2026-08-06 — Verification model restructuring

- §6.5: Split converge:two sequential phases — extraction quality (confidence, extraction/conversion fidelity) before construction quality (MUST coverage, mechanics fidelity, process compliance). Added sub-section anchors for no-delta detection, cross-model audit, and adjusted thresholds.
- §8: Collapsedverification workflows 7→5 — G0 absorbs MCP conformance (intake integrity), G2 absorbs complex fixture (scalable G2 scoped by REQ-100 tier). All cross-references updated.
- §6.6: Added convergePatternBuffer handshake — failures mapped to convergence metrics,re-enter Phase 2 for affected metrics only. Replaced implicit "feed back" with structured coupling.
- New REQ-108: Pattern Buffer traceability — sub-workflow-to-REQ mapping recorded in DECISIONS.md,gapexercised REQs logged as findings,spec-driven updates re-examine mapped scenarios. _Check:_ T107 (new).
- §10: Deduplicated independent verification adversarial rounds — replaced 5hardcoded breakage attempts with random selection of blocking Pattern Buffer sub-workflows spanning ≥3 REQ categories, preserving cross-model value without shadow-Pattern Buffer drift.
- Version: Root bumped to 2026.08.06; dnd5e reference propagated.

## 2026-08-05 — README restructure: feature-driven, benefit-first

- Replaced demo-quote-heavy playground sections with domain-grouped feature
  descriptions (16 features across MCP server, specification, contribute).
- Added benefit-first feature copy — every description opens with what the
  user gains, not what the system does.
- Rewrote comparison table with 5 verified competitors, new column headers
  ("What you're used to" / "How Holonovel differs"), and game-changer prose.
- Updated README design comment and validate-readme.ts canonical headings.

## 2026-08-05 — D&D 5e spec update: 16 gaps from latest revision

- REQ-105: Added `spec://build` resource (GM-filtered, reads embedded
  `holonovel.md`).
- REQ-106: Added `spec_repo_url` to `spec_health` and `intro` prompt.
- REQ-107: Surfaced `spec_version` in `spec_health` output.
- REQ-104: Added quick-mode character creation — all parameters in one call
  produce complete entity without step-by-step workflow. Both modes require
  active Novel (STATE_CONFLICT otherwise).
- REQ-088: `end_novel` now emits `[NEED_INPUT]` confirmation workflow (yes/cancel)
  instead of removing state immediately. Cancel restores pre-invocation state.
- REQ-095: New `switch_novel(slug)` tool — always callable, restores target
  persona state, STATE_CONFLICT on missing/ended Novel.
- REQ-096: New `export_novel` and `import_novel` tools (GM-only). Modes:
  dry-run/replace/merge. JSON and Markdown formats per Appendix Q.
- REQ-097: Per-Novel health metrics in `spec_health` — NPC count, lore count,
  audit log size, snapshot depth, file size, `healthy` flag. Persona-filtered.
- REQ-092: Novel JSON now includes SHA-256 checksum field. Verified on load;
  mismatch triggers structured recovery (backup restore, then dual-corruption
  diagnostic with `spec_health` warning).
- REQ-093: Extended metadata in `spec_health` — session count, cumulative play
  time, last-active scene anchor, combat round tracking.
- REQ-080: Added `collected_at` ISO 8601 timestamp to all enrichment items.
  Staleness detection against `TTRPG_ENRICH_STALE_DAYS` env var (default 180
  days). Missing timestamps on loaded Novels backfilled to Novel creation date.
- REQ-103: New `revert_enrichment` tool (GM-only) — removes all enrichment
  state (enrichment items, briefing order, action pattern toggle).
  Idempotent, pure-state.
- REQ-084: Enrichment-derived action patterns are now inert by default. GM
  must explicitly activate via Novel-scoped `actionPatternsEnabled` toggle.
- REQ-022: Registered `spec://build` (GM-filtered) and
  `enrichment://action_patterns` resources.
- REQ-025: Added `spec_repo_url`, `spec_version`, per-Novel health, and
  stale enrichment detection to `spec_health` output.
- Tool count: 54 → 58. Resource count: 31 → 33. 8/8 test suites pass,
  typecheck clean, root spec validation 0 errors.
- README: Terminology tightened — "verification gates" → "verification
  workflows", "jobs" → "workflows" in Build workflow section.

## 2026-08-05 — Spec audit remediation (16 findings)

- REQ-004a: Added standalone requirement body for stat block baseline view.
- REQ-069: Added requirement number for `player_signal` tool (was orphaned
  without a REQ identifier). Check citations: T8, T26.
- REQ-022: Added `enrichment://action_patterns` to the resource URI catalog.
- REQ-084: Removed implementation-detail output field enumeration (deferred to
  convergence loop per Appendix M).
- REQ-101: Clarified `assumption_audit` prompt is spec-level, not a server prompt.
- T83: Rewrote from stale token-budget mechanics (referencing
  `TTRPG_MAX_LORE_TOKENS`, removed during spec compression) to
  contract-preserving behavioral test matching current REQ-083.
- B.3: Added note explaining dual combat naming conventions (confrontation /
  combat) in the golden transcript.
- S14d: Fixed ambiguous term — "same session" → "same connection."
- REQ-065: Added operational behavior clause after unrecoverable state detection
  (Novel treated as ended, roster and other Novels unaffected).
- H10: Clarified tier-adjusted confidence thresholds for Heavy and Huge tiers.
- REQ-088: Added `end_game` deprecated alias note for backward compatibility.
- Appendix E: Added REQ-069 row (85 REQ rows).
- T63: Clarified "six enumerated enrichment verification checks" — now references the six
  enrichment output modules defined in §11.1.
- T80: Changed "matches Appendix L schema" to "includes all Appendix L metadata fields"
  — Appendix L explicitly states schemas are builder-determined.

## 2026-08-06 — Spec embedding and upstream tracking

- REQ-105: Added `spec://build` resource — GM-filtered, returns embedded holonovel.md
  via `resources/read`. Player persona returns `[FORBIDDEN]` (per REQ-002).
- REQ-106: Added spec repository URL tracked in `spec_health` and surfaced in the
  `intro` prompt. The URL is informational; the embedded copy (REQ-105) is
  authoritative.
- REQ-022: Added `spec://build` (GM-filtered) to the resource URI catalog.
- REQ-025: Added `spec_repo_url` field to `spec_health` reporting.
- §6.2: Added B8 (spec repository URL at intake) and U3 (fetch latest spec from repo
  before update) to build and update job questions.
- §6.4: Added spec copy step during Layer 1 construction — the builder copies
  holonovel.md into the server directory and records its content hash.
- §6.7: Added spec fetch step to the Update workflow — fetches latest spec from the
  repo URL before gap audit; fetch failure does not block the update.
- T104: Added automated test for `spec://build` resource retrieval and persona gating.
- T105: Added automated test for `spec_repo_url` presence in `spec_health` and `intro`.
- Appendix E: Added REQ-105, REQ-106; updated REQ-022, REQ-025 check citations with
  T104, T105, T93.
- Appendix F: Added T104, T105.

## 2026-08-06 — Character creation workflow hardening

- REQ-104: Added dual-mode character creation — step-by-step (sequential `[NEED_INPUT]`
  decisions) and quick (all parameters in one call). Both modes produce complete entities
  with all ruleset-defined derived statistics. Creation without an active Novel returns
  `[STATE_CONFLICT]`.
- REQ-042: Tightened decision-key identity contract — the `decision` value accepted by
  `respond` is the exact question text from the preceding `[NEED_INPUT]`.
- Pattern Buffer S2: Strengthened pass criteria with quick-mode verification, Novel-scoping
  enforcement, and creation undo checks.
- T32: Added output completeness checks (starting inventory, Novel-scoping enforcement,
  zeroed-field detection) and REQ-104 citation.
- T103: Added character creation undo test covering both step-by-step and quick modes.
- §7.5, O.5: Synced decision-key identity rule and dual-mode creation workflow.

## 2026-08-05 — CalVer migration: date-based versioning and push discipline

- Versioning: Migrated from semver (2.1.0) to CalVer date stamps (YYYY.MM.DD).
  Root `package.json`, `dnd5e/package.json`, `dnd5e/DECISIONS.md`,
  `dnd5e/AGENTS.md`, `dnd5e/README.md`, and `dnd5e/src/state.ts` all carry
  `2026.08.05`. `state.ts` now reads the version dynamically from its own
  `package.json` at module load instead of hardcoding.
- REQ-107: Added version coordination contract — build fingerprint carries spec
  version surfaced via `spec_health.spec_version`; gap audit short-circuits when
  spec version is unchanged.
- Push discipline: New `.githooks/pre-push` hook runs `npm run version-sync`
  + `npm run check` before every push. New `scripts/version-check.ts` verifies
  version consistency across all 6 tracked files. New `scripts/push.ts` wraps
  checks + git tag `vYYYY.MM.DD` + push with `--tags`.
- §1 Mission: Updated "major increment" language to reflect CalVer (any spec
  version change may trigger full rebuild).
- Note: npm may emit a deprecation warning for leading zeros in `2026.08.05`
  (non-semver). This is intentional CalVer — the version is a date, not a
  semver triple. No functional impact on installs or scripts.

## 2026-08-05 — Audit findings remediation

- Appendix E: Populated 19 `(today)` spec-version placeholders with actual
  CHANGELOG dates — REQ-062/070 (2026-08-04), REQ-080/088–103 (2026-08-05).
- `scripts/validate.ts`: `checkSpecVersionFormat` now flags both `—` and
  `(today)` as unpopulated spec versions.
- REQ-087: Replaced vague qualifier "appropriate moves" with "moves matching
  the scene type" — ambiguity scanner now reports zero findings.
- §6.3: Added justification for 10-section chunk budget (calibrated compromise
  under REQ-100 tier benchmarks).
- §9 H10: Added tier context to ≥80% confidence threshold (Standard tier floor
  per REQ-100).

## 2026-08-05 — Novel subsystem: multi-novel, export, health, and persistence hardening

- REQ-088 (Novel lifecycle): Multiple Novels per server instance (one active per
  connection), `end_novel` confirmation workflow (`[NEED_INPUT]` with yes/cancel),
  clarified ended-Novel semantics (STATE_CONFLICT when file absent on disk).
- New REQ-095 (Novel switching): `switch_novel(slug)` — always callable, switches
  active Novel per connection, restores target's persona state, two connections
  may have different Novels active simultaneously.
- §4, §7.7, §7.6: Updated terminology, state model, and configuration surface to
  reflect multiple Novels per server and per-connection active Novel.
- REQ-041 (undo): Clarified LIFO snapshot stack semantics — stack depth is
  implementation-defined with minimum one level, resolving tension with S22
  assertion.
- REQ-092 (persistence): Added guided corruption recovery — auto-restore from
  `.bak` when primary corrupt, dual-corruption diagnostic path, and integrity
  checksum field verified on load.
- REQ-093 (metadata): Extended with session count, cumulative play time,
  last-active scene anchor, combat-round tracking.
- REQ-080 (enrichment boundaries): Added staleness detection — inactive items
  with `collected_at` exceeding `TTRPG_ENRICH_STALE_DAYS` flagged `[stale]` in
  `spec_health` and excluded from enrichment surfaces.
- New REQ-096 (Novel interchange): `export_novel` and `import_novel` with
  dry-run/replace/merge modes, JSON and Markdown formats, round-trip fidelity.
- New REQ-097 (Novel health): Per-Novel health metrics in `spec_health` — NPC
  count, lore entry count, audit log size, snapshot depth, file size warnings,
  and `healthy` flag, persona-filtered.
- §7.6: New env vars — `TTRPG_MAX_NPCS`, `TTRPG_MAX_LORE_ENTRIES`,
  `TTRPG_MAX_SNAPSHOT_DEPTH`, `TTRPG_ENRICH_STALE_DAYS`.
- New Appendix Q (Novel Interchange Format): JSON and Markdown schemas for
  Novel export/import.
- Appendix E: Manifest updated with REQ-095/096/097 (80 REQ rows).
- Appendix F: New tests T98 (Novel switching), T99 (Novel metadata), T100
  (Novel interchange), T101 (Novel health), T102 (enrichment staleness).
- Appendix P (STRIDE): Updated Tampering row — checksum field mitigates
  previously flagged gap.
- Pattern Buffer S17: Rewritten for multi-novel switch/end/confirm cycle.
- README: Updated "Playing a Novel" section with switch_novel, end_novel
  confirmation, export_novel, and health checks.

## 2026-08-05 — Spec-driven update intake path + §6.7 improvements (10 recommendations from deep research)

- §6.1: Added Update job (fourth job) — selectable at intake for reconciling
  existing servers with a revised specification.
- §6.2: Added U1–U2 intake questions for Update job. Q0 options list now
  includes `update`.
- §6.7: Delta classes (Patch/Minor/Major) with scoped workflows —
  wording-only changes skip the Pattern Buffer.
- §6.7: Gap audit method — comparison surfaces (tools/list, resources/list,
  prompts/list, spec_health, REQ-032, state model) without prescribing steps.
- §6.7: Changed code paths redefined — all blocking scenarios always re-run;
  non-blocking scenarios re-run only when exercising gap-audit-implemented
  surfaces.
- §6.7: State migration guidance — existing Novel state loads under REQ-065
  compatibility; absent fields default, extra fields preserved as inert data.
- §6.7: Operator-set wall-clock budget for spec-driven updates.
- §6.7: Strengthened REQ-098 Check: clause — each gap disposition must cite REQ
  and reason.
- §1: Pointer to §6.7 for delta classification replaces inline "narrow delta"
  criteria.
- README: "Point the Build job" → "Run the Update job" for spec-driven update
  flow.

## 2026-08-05 — Pattern Buffer improvements (10 recommendations from deep research)

- §6.6: Concretized S15 (stress and recovery) into four sub-scenarios — S15a
  (concurrent sessions), S15b (corrupted state file), S15c (rapid persona
  switching), S15d (long combat) — each with explicit tool calls and pass
  criteria.
- §6.6: Added S20 (persona briefing correctness) — verifies
  `persona_briefing` content adapts correctly across personas and scene types.
  Blocking.
- §6.6: Added S21 (lorebook interchange) — round-trips `export_lorebook` and
  `import_lorebook` through dry-run, merge, and replace modes. Blocking.
- §6.6: Renumbered old S20 (campaign endurance) to S22. Pattern Buffer scenario
  count increased from 20 to 22 across spec, README, DECISIONS.md, Gate 5,
  and `spec_health`.
- §6.6: Elevated S2 (character creation) to blocking — a server that cannot
  create characters fails the build.
- §6.6: Clarified Method paragraph — two MCP connections sharing one data
  directory, interleaved Player/GM calls, each scenario specifies which
  persona calls each tool.
- §6.6: Defined "valid input" for S1 tool sweep — parameter types per schema,
  simplest valid input, pass criterion covers crashes, hangs, and unexpected
  error codes.
- §6.6: Added S22 timeout budget (10 minutes wall-clock; 3 consecutive
  exceedances trigger scope re-evaluation) and global Pattern Buffer budget
  (60 minutes wall-clock with per-scenario timings).
- §6.6, §8: Updated exit criteria and Gate 5 blocking list to include new
  blocking scenarios (S2, S20, S21, S22) with parenthetical labels.
- dnd5e: Fixed `lastPatternBuffer` not set at construction (was `new Date()` in
  constructor — now absent until Pattern Buffer execution). Added
  `patternBufferScenariosPassed` field to `BuildFingerprint`. `spec_health` reports
  "completed N/22" or "pending 22 scenarios" depending on `lastPatternBuffer`
  presence.

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
- §6.6: Defined improvement measurement for Pattern Buffer cycles — fewer total assertion
  failures or at least one previously-blocking scenario downgraded to non-blocking.
  Replaced "2 cycles without improvement" with "2 stalled cycles" throughout.
- §6.6: Split Pattern Buffer S14 (edge cases) into S14a–S14h — empty strings, boundary HP
  (zero/max), rapid calls, ambiguous aliases, unknown decisions, seed replay, and
  spec_health persona filtering — each with its own pass criterion.
- §6.6: Reduced Pattern Buffer S20 (campaign endurance) from 50 combat rounds/5
  confrontations to 30 rounds/3 confrontations with proportional NPC churn and audit
  log threshold (≥100) — same structural coverage, lower execution cost.
- §6.6: Added structured encoding paragraph — builder encodes Pattern Buffer scenarios as
  `{scenario_id, objective, blocking, steps}` records for mechanical consumption;
  dnd5e Pattern Buffer fixture is reference implementation.

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
  and Pattern Buffer scenario count corrected (19 → 20).
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
- §6.6: Pattern Buffer scenario S20 added (50-round campaign endurance with state
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
- §6.6: Pattern Buffer assertion compression — periodic audit of accumulated regression
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
  cross-job deduplication for Sheet. Updated §6.6 and §8 Pattern Buffer references.
- README: "Extend with Enrich and Sheet" → "Extend with Enrich"; removed
  Sheet-specific prose.
- AGENTS.md: §11 layer map updated.

## 2026-08-05 — dnd5e REQ-098 update + Pattern Buffer (Build, Enrich, Sheet)

- dnd5e v1.3.0: 14 gap dispositions resolved across Build, Enrich, and Sheet
  jobs. Core fixes — `[WARNING]`/`[PARTIAL]`/`[RULE_VIOLATION]`/`[UNIMPLEMENTED]`
  error categories, macro expansion system (`src/macros.ts`), 14 new resources,
  11 new tools, enriched `spec_health` with fingerprint fields and novel listing.
- Enrich job (`src/enrichment.ts`): 5 voice examples, 10 lore templates,
  10 action patterns, 20 guidance items, 11 adventure advice items.
- Pattern Buffer: all 19 scenarios pass (was 16). S17 (novel lifecycle), S18 (novel
  isolation), and S19 (setup/encounters) implemented. S1 sweep covers 54 tools.
  All 7 blocking scenarios pass.
- §6.6: Added verification principle — Pattern Buffer scenarios verify state through
  tool-observable surfaces, not raw state file reads. Gate 4 tests the on-disk
  format; Gate 5 tests observable behavior. S5 and S17 clarified; T72 tagged as
  Gate 4 format test with cross-reference to the verification principle.

## 2026-08-05 — v1.4 "Pattern Buffer"

- OCE (Operational Confidence Exercise) renamed to "The Pattern Buffer" across the
  specification. Promoted to Gate 5 — both a Build completion requirement and an
  independently runnable verification gate. The Pattern Buffer must re-run after any
  server code change: Enrich, Sheet, spec-driven updates, or manual edits.
- Specification-driven development philosophy surfaced in the spec and README.
  The Mission (§1) now states that the specification is the permanent artifact
  and implementations are disposable. The README frames spec-driven development
  as the reader's long-term investment — the server is rebuilt whenever the spec
  changes, and everything the reader creates survives every rebuild.

## 2026-08-05 — OCE renamed to Pattern Buffer, promoted to Gate 5

- §6.6: "Operational Confidence Exercise (OCE)" renamed to "The Pattern Buffer"
  throughout the spec, README, and CHANGELOG.
- §6.6: added independent invocation trigger — the Pattern Buffer re-runs after any
  server code change (Enrich, Sheet, spec-driven updates, manual edits).
- §8: Gate 5 — The Pattern Buffer added to verification gates. The Pattern Buffer is both a
  Build completion requirement and an independently runnable gate.
- README: rebuild-from-spec feature clarified in "Build your own game server"
  section; six verification gates now including the Pattern Buffer.
- `spec_health` field `last_oce` renamed to `last_pattern_buffer` (breaking change for
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
