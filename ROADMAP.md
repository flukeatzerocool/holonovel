# Roadmap

<!--
  Admission rule: a `## <title>` section is a scheduled work item. It needs an
  action a maintainer can take, 1–3 bullet lines, and a `**Trigger:**` line
  naming what starts the work or what closes it. Priority order, P0 first;
  remove a section when the work ships (it moves to CHANGELOG.md).

  Standing facts are not roadmap items: accepted tradeoffs, by-design
  limitations, and out-of-scope tracks are recorded in `holonovel/DECISIONS.md`,
  and `## Non-goals` is the pointer to them. `npm run check-roadmap` enforces
  this rule; `## Non-goals` is exempt.
-->

## Remaining full-review sweep (P1)

- Chunk P8 (narrative cognition: §5.12, §5.25–§5.27, §5.32–§5.35).
- The closing M1 machine-evidence re-run over the post-P8 tree, covering
  `check:conformance`, `fmea`, and `graph-deps`. Scope is §5.1–§5.35 except
  §5.9 and §5.19, which the 2026-11-09 seam pass closed; §5.6, chunks P1–P7b
  closed 2026-11-09.

**Trigger:** the next session allocated to review work; closes when chunk P8
and the closing M1 pass report.

## §5.2/§5.8 assertion repair (P1)

- Story journal and dynamic lore: write the T282 assertion and the
  T67/T79/T81/T82/T83 lifecycle assertions, or re-point the rows to the
  harnesses that exercise them (REQ-246a, REQ-246b1, REQ-246b2, REQ-083c).
- Synthesis: write or re-point the run/revert/rebuild, removal, and
  confidence assertions that T102/T288/T63/T95/T97/T94/T144/T324/T325 name
  (REQ-080g2, REQ-103a, REQ-103b, REQ-103c, REQ-103d, REQ-130a, REQ-130b,
  REQ-130c, REQ-265a, REQ-265b, REQ-265c, REQ-266a, REQ-266b).
- Prompt, scenes, secrets, suggestions, and §5.2: write or re-point the
  ordering, scene-tag/transition, secret, proactive-suggestion, and
  lookup-refusal assertions (REQ-082a, REQ-082b, REQ-082c, REQ-087a,
  REQ-087b, REQ-087c, REQ-125a, REQ-125b, REQ-234a, REQ-234b, REQ-234c,
  REQ-234d, REQ-084a1, REQ-084a2, REQ-084a3, REQ-084b1, REQ-084b2,
  REQ-084b3, REQ-084b4, REQ-214a, REQ-214b, REQ-214c).

**Trigger:** the next citation-remediation session; closes when F-P7b-1–F-P7b-9
are `Resolved` in the review register.

## §5.7 determinism and citation repair (P1)

- Emit the REQ-050a seed-conflict `[WARNING]` when a per-call seed is supplied
  while a session seed is active, in the oracle, dice, combat-init, and
  character-generation paths (REQ-050a).
- Re-point the stale citations: REQ-052 to the T739 traversal assertion,
  REQ-055/REQ-055a/REQ-055b off the unimplemented T31/T108 tokens, then refresh
  the coverage register (REQ-052, REQ-055, REQ-055a, REQ-055b).

**Trigger:** the next citation-remediation session; closes when F-P7a-1,
F-P7a-2, and F-P7a-3 are `Resolved`.

## §5.16/§5.17 ruleset surface remediation (P1)

- Scope, annotation, and health: ruleset-scoped dispatch and listing
  annotations, `inapplicable` hints, per-ruleset `ruleset_health` with a
  combined summary and Player filtering, and ruleset-derived `suggest` names
  (REQ-379b, REQ-379c, REQ-381b, REQ-381c, REQ-382b, REQ-382c, REQ-383a,
  REQ-383b, REQ-385a, REQ-385b).
- Novel identity, import/export, and codex: bind's mechanics-state check,
  audited cross-ruleset switching, import validation with valid-slug
  enumeration, export manifest ruleset, and the codex ruleset axis with
  mismatched-import refusal (REQ-380c, REQ-384b, REQ-384c, REQ-386a, REQ-386b,
  REQ-387a, REQ-387b).
- Metrics, budget, and lifecycle: the `ruleset://` resource surface, aggregate
  installed index bytes, the aggregate package tool budget, an Appendix
  U-derived license set, runtime install registration, and `tools/list`
  pagination (REQ-389c, REQ-390b, REQ-391c, REQ-430, REQ-432a, REQ-432b,
  REQ-558).

**Trigger:** the next §5.16/§5.17 remediation session; closes when F-P6b-9,
F-P6b-10, F-P6b-11, F-P6b-12, F-P6b-16, and F-P6b-20 are `Resolved`.

## §5.17/§5.18 package build and update remediation (P1)

- A committed ruleset emitter invoked by `build-ruleset`, with `update`
  rebuilding stale packages through it and running the package gates before a
  re-stamp (REQ-395a, REQ-395c, REQ-563, REQ-564, REQ-650).
- Supplement intake and overlay with recorded base/supplement/result hashes,
  registry recipe roles and license, and `update-rulesets` base-hash reporting
  (REQ-421, REQ-422, REQ-557).

**Trigger:** the next package-build remediation session; closes when F-P6b-7
and F-P6b-15 are `Resolved`.

## §5.18 deploy, state, and publication remediation (P1)

- State location: emit the `[state-in-tree]` warning in `spec_health` and on
  stderr, and route the host entry scripts through the resolved data directory
  (REQ-397).
- Deploy guards, delta classification, and distribution: refuse a deploy clean
  that would touch state, name the server on a fast-forward failure, stop the
  stub path reporting a completed deploy, fail closed when no published spec
  hash resolves, and add the container image plus `server.json` schema
  validation (REQ-394, REQ-396, REQ-418, REQ-428).

**Trigger:** the next §5.18 remediation session; closes when F-P6b-8,
F-P6b-13, F-P6b-14, and F-P6b-19 are `Resolved`.

## §5.21–§5.23 capability remediation (P1)

- Forged consequences and refusal atomicity: model the named Forged
  consequence so a resist reduces it, and move the Novel snapshot below every
  validation guard so a refused capability action writes no undo state
  (REQ-041a, REQ-041b, REQ-435, REQ-436, REQ-440, REQ-442).

**Trigger:** the next capability-remediation session; closes when F-P6b-17 and
F-P6b-18 are `Resolved`.

## §5.16–§5.18 citation repair (P1)

- §5.16/§5.17: write or re-point the missing assertions for the listing,
  health, import/export, codex, suggest, pagination, package-integrity, and
  Ironsworn-burn contracts (REQ-379c, REQ-381c, REQ-383b, REQ-384c, REQ-385b,
  REQ-386b, REQ-387b, REQ-389b, REQ-389c, REQ-391b, REQ-391c, REQ-393,
  REQ-439).
- §5.18: write or re-point the missing assertions for the entry points, deploy
  preservation, publication integrity, distribution, supplement provenance,
  and package emission (REQ-395a, REQ-395b, REQ-396, REQ-397, REQ-398,
  REQ-418, REQ-419, REQ-428, REQ-557, REQ-563, REQ-564).

**Trigger:** the next citation-remediation session; closes when F-P6b-21 is
`Resolved` and every §5.16–§5.18 `_Check:_` citation resolves to an exercised
harness.

## §5.10 world-model contract remediation (P1)

- Parser response and help contracts: the `[UNIMPLEMENTED]` envelope with the
  three nearest verbs, closed-container rule violation, numbered ambiguous
  prompt, help category/description and aliases, the narrative verb category,
  and status-line exits (REQ-196b, REQ-196c, REQ-196d, REQ-196e, REQ-197a,
  REQ-283a, REQ-283b, REQ-318a, REQ-320a, REQ-320b, REQ-320c).
- Hints, detail signal, and vehicle traversal: the REQ-284a–e hint shape and
  reachability, the `detail` signal and Player-Detail line, and vehicle
  interior/passenger/door handling (REQ-284a, REQ-284b, REQ-284c, REQ-284d,
  REQ-284e, REQ-197c, REQ-197d, REQ-317a, REQ-317b, REQ-317c, REQ-317d).
- Resources, suggest mapping, and CRUD lifecycle: badge-filtered `world://map`,
  `world://kinds`, `room://`, and `thing://` payloads with `parser_commands`,
  the Player `constraints://active` filter, Player spatial suggest mapping to
  `run_command (action: resolve)`, and exit/door binding plus room audit and
  removal cleanup (REQ-202a, REQ-202b, REQ-222b, REQ-325a, REQ-309b, REQ-309g,
  REQ-198, REQ-199).

**Trigger:** the next session that takes §5.10 remediation work; closes when
F-P6a-7–F-P6a-14 are `Resolved` in the review register.


## §5.20/§5.24 assertion and staging remediation (P1)

- Turn-role and staging order: drive the REQ-412 handoff from the AI narrative
  role, and give REQ-612's `list` strategy a real GM-order source on
  `manage_staging (action: cast)` (REQ-412, REQ-612; F-P5-5, F-P5-6).
- Widen narrow assertions: T545 replay reproduction, T550 derived-record
  citation, T640 per-role/budget orientation, T712 session-identity exclusion,
  T713 legacy/older-projection branches, T727 manual-selection clear
  (REQ-412a, REQ-455, REQ-460, REQ-601, REQ-602, REQ-611; F-P5-7).

**Trigger:** the next §5.20/§5.24 remediation session; closes when F-P5-5,
F-P5-6, and F-P5-7 are `Resolved`.

## §5.9/§5.19 persistence remediation (P1)

- Archive and corruption integrity: refuse archiving over an existing archived
  slug, surface the primary/backup chain paths on total corruption, implement
  `novel_format_version` with the v1 migration and `[format-future]` warning,
  and run workflow-staleness accounting on the restore path (REQ-334b,
  REQ-092c, REQ-092e, REQ-092f, REQ-092g, REQ-224a; F-P4-2, F-P4-4, F-P4-5,
  F-P4-8).
- Directive and warning completeness: append a `moment` on every combat-round
  resolution, name the uncommitted beats and commit tools in warn mode (and
  enumerate them in recap), and name the eight omitted state-tool categories in
  the REQ-400 directive (REQ-405, REQ-403b, REQ-400; F-P4-3, F-P4-6, F-P4-7).
- Citation repair: widen T470 to the ledger timestamp and drift/regression
  markers, T471 to the recap's named session, and T475 to the timestamp gap and
  the unparseable-primary branch (REQ-401, REQ-402, REQ-406; F-P4-9).

**Trigger:** the next session that takes persistence remediation work; closes
when F-P4-2–F-P4-9 are `Resolved` in the review register.

## §5.6 state surfaces remediation (P1)

- Pause/resume and world reactivity: return the `badge_briefing` payload from
  `get_context`, filter the story capture to `decision`/`bond`, include the
  `gm_context` summary in `intro`, add non-NPC World in Motion entries with
  one-hop ripple tracing, a `modify` option and a three-deferral cap, add the
  ally↔rival lore prompt, include `neutral` transitions in the relationship
  marker, and redact `session_id` from Player-visible session markers (REQ-232b,
  REQ-232c, REQ-233a1, REQ-233a2, REQ-233a3, REQ-236a, REQ-236b, REQ-236c,
  REQ-237b1, REQ-237b2; F-P3B4-1–F-P3B4-4, F-P3B4-11, F-P3B4-13).
- Notes, persistence, and codex truth: surface Novel notes in `badge_briefing`,
  write `server-notes.json` and `codex.json` atomically with backup rotation,
  partition `spec_health.codex` by kind, default a captured entry's `ruleset`
  to the source Novel's scope, and implement the `[codex-stale]` flag (REQ-242b,
  REQ-242d, REQ-285a, REQ-285c, REQ-321g, REQ-321k, REQ-321l, REQ-332b,
  REQ-332c, REQ-065f; F-P3B4-5–F-P3B4-10, F-P3B4-14, F-P3B4-15).
- Citation repair: write or re-point the unexercised assertions for T52
  (REQ-065), T270 (REQ-236), T358 (REQ-233), and widen T275 (REQ-237), T280
  (REQ-242), and T334 (REQ-285) to the full contracts (F-P3B4-10–F-P3B4-15).

**Trigger:** the first session that takes §5.6 state-surface remediation work;
closes when F-P3B4-1–F-P3B4-15 are `Resolved` in the review register.

## §5.6 adventure content remediation (P1)

- Module load, catalog, and discovery: give `load` a real `target: "codex"`
  path, pre-populate NPC/faction/lore state from the structural index, surface
  the adventure hook in `badge_briefing`, search adventure prose with
  active-first and confidence tiers, serve `adventure://<slug>/<anchor>`, emit
  build-time hashes in `indexed_adventures` plus `[malformed-adventure]` and
  `[adventure-drift]`, apply the genre filter and `player_visible`/shared-hook
  rule under both badges, enumerate slugs on `[NOT_FOUND]`, honour
  `TTRPG_ADVENTURE`, and add the `lookup_monster` suggestion (REQ-079b, REQ-079c,
  REQ-079d, REQ-079e, REQ-079f, REQ-079g, REQ-079h, REQ-079i, REQ-079j2,
  REQ-170, REQ-171b, REQ-172, REQ-247c, REQ-292a, REQ-292b, REQ-292d; F-P3B3-1, F-P3B3-2,
  F-P3B3-3, F-P3B3-4, F-P3B3-5, F-P3B3-6, F-P3B3-12).
- Resources, waypoint, and synthesis linkage: render NPC roles and location
  descriptions in the overview, badge-filter per adventure section marker, add
  navigation anchors and real `[STATE_CONFLICT]` detection on the adventure
  presence, fire the scene-transition hook on a waypoint change, and complete
  the synthesis augmentation (encounter/theme matching, community prompt,
  automatic activation, omission branch) (REQ-229a, REQ-229b, REQ-229c,
  REQ-229d, REQ-248a, REQ-249a, REQ-250b, REQ-250c; F-P3B3-7, F-P3B3-10).
- Generated-adventure lifecycle: keep the generated adventure across a `load`,
  emit a `## World` section with rooms and exits for spatial premises, order
  indexed-then-generated content in the briefing, tag generated search results,
  and widen the lifecycle assertions (REQ-132a, REQ-132b, REQ-132c, REQ-132d,
  REQ-132e; F-P3B3-8, F-P3B3-9, F-P3B3-11).

**Trigger:** the next session that takes adventure-content remediation work;
closes when F-P3B3-1–F-P3B3-12 are `Resolved` in the review register.

## §5.6 entities and NPCs remediation (P1)

- Entity, roster, and scene surfaces: add the duplicate-import `[STATE_CONFLICT]`
  guard, `party://current` HP, removal presence/audit, the roster listing fields
  and `roster://<id>`/`<type>` resources, valid-ID enumeration on
  `roster_remove`, the scene-history cap with `[truncated]`, `scene_tick`, the
  lore contradiction warning, fast-forward round clocks/lore triggers/bridging
  summary, and `last_location`/`[not present]`/`presence location`
  (REQ-074b, REQ-074c, REQ-176a, REQ-177, REQ-178a, REQ-178b, REQ-076b2,
  REQ-076b3, REQ-076b4, REQ-076b5, REQ-076b6, REQ-076b7, REQ-252a, REQ-252b,
  REQ-252c, REQ-307a, REQ-307b, REQ-307c; F-P3B2-1–F-P3B2-5).
- NPC depth and memory: maintain `appearance_count`/`first_seen`/`last_seen` with
  the `[recurring]`/`[campaign]`/`[distant]` markers and recap heatmap, unify the
  NPC description field across surfaces, and deepen the memory model with party
  knowledge, emotional state, social/mechanical ingestion, and campaign-memory
  coupling (REQ-075c, REQ-075d, REQ-075e, REQ-075g, REQ-156, REQ-311b, REQ-311c,
  REQ-311d, REQ-311f; F-P3B2-6–F-P3B2-8).
- Personality, signal, and citation surfaces: render the briefing personality
  group and voice examples, gate and tag-filter NPC voice directives, reshape and
  badge-filter the personality resources, store signals as
  `{value, connection_counter}` with removal semantics and briefing ages, extend
  boundary collision to every free-text entry point, and repair the unexercised
  Automated citations (REQ-077a, REQ-077b, REQ-077d, REQ-077e, REQ-077f,
  REQ-126a, REQ-126b, REQ-166a, REQ-166b, REQ-166c, REQ-282a, REQ-282b,
  REQ-282c, REQ-167a, REQ-167b, REQ-069a, REQ-069b, REQ-069c, REQ-128a,
  REQ-128b, REQ-173b, REQ-255b, REQ-124b, plus T55/T56/T57/T58/T65/T112/T132/
  T140/T142/T723/T131; F-P3B2-9–F-P3B2-14).

**Trigger:** the first session that takes §5.6 entities-and-NPCs remediation
work; closes when F-P3B2-1–F-P3B2-14 are `Resolved` in the review register.

## §5.6 core state and lifecycle remediation (P1)

- Structured recap payload: emit the typed fields REQ-072b/c1/c2/d and
  per-combat confrontation objects REQ-175a/b, and widen T214/T215/T072
  (F-P3B1-3).
- Condition and audit contracts: allow a Player to apply or remove conditions on
  their own active entity and audit both actions (REQ-217b, REQ-217c), record old
  and new badge on a switch (REQ-040c), audit snapshot truncation (REQ-041b), and
  audit vow mutations (REQ-040a) (F-P3B1-4, F-P3B1-5).
- Clock and vow surfaces: expose `clock_type` and the racing/linked/tug_of_war/
  retreat models (REQ-073a1/a2), derive the combat turn report from the audit log
  with `[auto]` (REQ-043b/c), gate vow resolve and remove linked countdowns
  (REQ-289c, REQ-322b/d) (F-P3B1-6–F-P3B1-8); repair the citations for REQ-040d,
  REQ-043f, REQ-072f, REQ-073a2, REQ-073c3, and REQ-289e (F-P3B1-9).

**Trigger:** the first session that takes §5.6 remediation work; closes when
F-P3B1-3–F-P3B1-9 are `Resolved` in the review register.

## §5.4 remediation (P1)

- Record the end-Novel disposal in the audit log before the Novel file moves to
  `.trash` (REQ-140; F-P3-5).
- Carry the ruleset source on each creation equipment entry and omit the field
  when the ruleset defines no starting equipment (REQ-152a, REQ-152b; F-P3-6).
- Surface a named creation error when a declared formula fails to evaluate, and
  add a ruleset-backed creation fixture so the drain-atomicity branch is
  asserted in-tree (REQ-399b, REQ-190; F-P3-7, F-P3-9).

**Trigger:** the next session that takes §5.4 remediation work; closes when
F-P3-5, F-P3-6, F-P3-7, and F-P3-9 are `Resolved` in the review register.

## §5.4 citation repair (P1)

- Write the T103 assertion (character creation undo: step-by-step and quick
  creation, undo blockage during a pending `[NEED_INPUT]`, empty-stack
  `[STATE_CONFLICT]`) or re-point REQ-104c to the harness that exercises it;
  then refresh the coverage register.

**Trigger:** the next citation-remediation session, or the same session as the
§5.4 remediation above; closes when REQ-104c's citation resolves to an exercised
harness and F-P3-8 is `Resolved`.


## Trust-core contract remediation (P1)

- Error envelope normalization: refusals return `[ERROR] [FORBIDDEN]` with a
  standalone `Corrective action:` line, every error carries a structured
  result including the valid values, the SDK `-32602` re-label is removed, and
  the `RAW` status is replaced by a declared one (REQ-001, REQ-002, REQ-002b1,
  REQ-548a, REQ-548b, REQ-548c; F-P1-1, F-P1-2, F-P1-3, F-P1-10, F-P1-11).
- Output and authorization surface: truncate every tool result by byte length,
  badge-filter `output://`, gate badge class in the dispatcher, and make
  `tools/list`, `prompts/list`, and `resources/list` the read-only subset
  (REQ-004, REQ-179a, REQ-180b, REQ-031a, REQ-032a, REQ-137b; F-P1-5, F-P1-6,
  F-P1-7, F-P1-8, F-P1-9).
- Audit durability and badge truth: refuse before mutating when the log is at
  capacity, record old and new badge on a switch, and make `set_badge` fail
  when no Novel is active instead of reporting success (REQ-040a, REQ-040c,
  REQ-447, REQ-030, REQ-066b; F-P1-4, F-P1-12, F-P1-13).

**Trigger:** the first session that takes remediation work instead of a review
chunk; closes when the §5.1/§5.5 findings in `spec/audit/review-register.md` are
`Resolved` and their assertions run in a harness.

## Trust-core citation repair (P1)

- Five §5.1/§5.5 REQs cite `Automated` tests that no harness implements
  (REQ-001b2 → T180, REQ-032b → T44, REQ-109f → T109/T110, REQ-286c → T336,
  REQ-306e → T350): write each assertion or re-point the citation to the test
  that exercises the behaviour, then refresh the coverage register.

**Trigger:** the same session as the remediation above, or the next one if that
session reaches its cap; closes when all five citations resolve to an exercised
harness.

## §5.3 citation repair (P1)

- Write the T22 prompt-registration assertion (REQ-023a/REQ-023b) and the T35
  fixture-isolation assertion (REQ-024a), or re-point them to a harness that
  exercises the stated behaviour; REQ-078a and REQ-078d already have T124 and
  need only a citation re-point.
- Re-point the nine stale citations REQ-025a/b1/b2/c → T45/T154/T165/T166/T170,
  REQ-138a/b → T167, REQ-139 → T168, REQ-057a/b → T40, each already exercised
  under T105/T486/T487/T488, T152, T153, and T39; then refresh the coverage
  register.

**Trigger:** the next session that takes citation-remediation work; closes when
every §5.3 Check citation resolves to an exercised harness and
`spec/audit/review-register.md` marks F-P2-1–F-P2-3 `Resolved`.

## Harness test-ID label hygiene (P2)

- Enumerate the zero-padded tokens in the server harness titles that are absent
  from Appendix F (`T020`, `T022`, `T002`, and the rest of the `T0nn` set),
  correct each to the catalogue ID its assertion implements, and re-run the
  coverage resolution — the padded tokens shadow real IDs and produced a false
  citation match for REQ-023b.

**Trigger:** the next harness-maintenance session, or any session whose
citation resolution reports an unexpected hold; closes when no harness title
carries an ID absent from Appendix F.

## Holosuite anchor repoint automation (P2)

- Add a fix mode to the evidence-anchor tooling (`npm run fix-anchors` or
  `holosuite --fix-anchors`) that content-matches a stale
  `path:line#symbol` predicate to its current line and rewrites it, instead of
  the manual repoints recorded at `2026-10-24`, roadmap-clearance F2, and
  `d92b8f0`.
- Keep the check strict and the fix conservative: `--check` still fails on a
  stale anchor, only the fix mode writes, and it refuses to guess when a
  symbol has no unique content match (REQ-141m).

**Trigger:** the next `holonovel/src/index.ts` or `holonovel/src/core/state.ts`
edit that drifts a predicate, closing when the four manual-repoint sessions no
longer need hand-editing.

## Non-goals

Authoritative list and rationale: `holonovel/DECISIONS.md` § Non-goals.
