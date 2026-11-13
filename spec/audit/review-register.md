# Review Register — 2026-09-06

Findings and follow-through items from the after-action review loop. Each
entry carries a terminal disposition: `Resolved`, `Scheduled-roadmap`,
`Closed-P3`, or `Deferred-by-user`. The AAR references this file; it does not
restate it. The REQ-coverage register (`req-coverage.md`) and ROADMAP.md are
the tracking surfaces for the coverage backlog.

Each finding cites the predicate it rests on — the `file:line` of the
condition — not a gate's emitted message; a message alone is not evidence.

## Resolved

### 2026-11-13 §5.6 clock interaction models and combat turn report

Resolved in the 2026-11-13 clock/combat-report increment (plan
`docs/plans/2026-11-13-5-6-clock-combat-report/`).

- **F-P3B1-6 — clock interaction models are unimplemented. Resolved.**
  `manage_countdown (action: set)` now exposes `clock_type` (danger, racing,
  linked, tug_of_war, faction, mission), `opposes`, and
  `link_countdown(parent_name, child_name)`; `advance` accepts
  `retreat_countdown`. Racing pairs resolve a winner or a tie, a linked child
  stays locked and renders indented until its parent fires, a tug_of_war clock
  retreats without firing, and a decrement-direction mission clock ticks once per
  `manage_novel (action: resume)`. T271 asserts all five models
  (`holonovel/scripts/test-backfill.ts`). REQ-073a1, REQ-073a2.
- **F-P3B1-7 — the combat turn report is not audit-derived. Resolved.**
  `manage_combat (action: advance)` derives the report from the audit entries
  after the last `init_combat`/`advance_combat` boundary, reports the resolved
  participant (not the next one), lists actions, rolls, and state changes, and
  reports "took no action" when the turn left no mutation. Statless participants
  (dangers and NPCs with absent/empty `stats`) carry lowercase `[auto]` and their
  description sentence. The briefing gains the REQ-043e combat group (round, turn
  order, current participant, Player redaction) replacing the single summary
  line, and `spec_health` gains `total_combat_rounds` (REQ-043d). T110 and T162
  assert the behaviour. REQ-043b, REQ-043c, REQ-043d, REQ-043e.

### 2026-11-12 assembler appendix completeness (H-4)

Resolved in the 2026-11-12 assembler-completeness increment. The defect sat in
the assembly step, not in the spec sources: `parseAppendices` discarded every
part of an appendix source that did not begin with `## Appendix <letter>`.

- **H-4a — Appendix O.8–O.13 were dropped from `holonovel.md`.** The
  separator-filter parser (`scripts/assemble.ts:52-73` at HEAD) discarded the
  four continuation blocks after the intra-appendix rules at
  `spec/appendices-reference.md:3108,3131,3158,3184`; the assembled spec cited
  the O.11/O.12/O.13 constants from §5 bodies and Appendix F rows T91/T770
  (`holonovel.md:10883`, `:11442`) while carrying none of them.
  `parseAppendices` now slices by heading boundaries
  (`scripts/lib/appendices.ts`), so text between two headings always belongs to
  the preceding appendix; four self-tests in `scripts/test-spec-tooling.ts` pin
  it (continuation retention, reconstruction invariant, duplicate failure, the
  assembled O.8–O.13 pin). REQ-434, REQ-436, REQ-438, REQ-440, REQ-441,
  REQ-097, REQ-129, REQ-273, REQ-571, REQ-593, REQ-629, REQ-630, REQ-632,
  REQ-648.
- **H-4b — the fixture coverage matrix was dropped.** The leading block of
  `spec/appendices-fixtures.md` (`## Fixture Coverage Matrix`, carrying the
  per-ruleset annotation SHALL) was neither `# Appendices` nor an appendix
  heading, so the old parser discarded it. The parser returns it as a preamble
  and assembly emits it immediately before the first appendix that file defines
  (between Appendix A and Appendix B).

### 2026-11-12 harness failure remediation (H-1..H-3)

Resolved in the 2026-11-12 harness-failure increment. Both findings were
HEAD-red assertions the previous increment's baseline recorded.

- **H-1 — an unanchored restatement outranked the cited event.** `checkRecord`
  treated a fact with `anchor === null` as satisfying any cited ordinal, because
  `anchorMismatch` only rejected a *different* non-null anchor; the T752 campaign
  thread "Kael now regards Anna as ally" (`holonovel/src/index.ts:1091`) supplied
  such a fact and `confirmed` won (`holonovel/src/core/divergence.ts:364`,
  `:379`). The check now evaluates both polarity sets over the event-anchored
  subset when the record cites an ordinal and that subset is non-empty
  (`considered` in `checkRecord`); CR-3's false-outcome-before-displaced order is
  unchanged among the facts considered. Appendix O.13 records the precedence.
  T752 adds an assertion that the displaced verdict cites an anchored event.
- **H-2 — the share license gate read the embedded payload, not the loaded
  module.** `export` ran the Appendix U check only when `embedded` carried
  provenance (`index.ts:12688`), and `embeddedAdventureContent` returns the
  generated adventure first with `provenance: null` (`:12364-12366`), so a
  loaded non-redistributable module never reached the refusal while a generated
  adventure was active. `shareLicenseRefusal` now resolves
  `novel.adventure_slug` directly and runs before embedding. A generated-only
  share no longer writes the spurious `export_license_unattributed` entry
  (pinned by T740).
- **H-3 — both-active share embeds only the generated adventure (Closed-P3).**
  `embeddedAdventureContent` still prefers the generated payload while
  `manifest.adventure_module_slugs` names `novel.adventure_slug`
  (`index.ts:12364`, `:12724`); REQ-132c permits coexistence and REQ-096m does
  not say which wins. No gate demonstrates a failure, and a multi-adventure
  bundle key is a format change. Recorded, no action.

### 2026-11-12 §5.6 audit, condition, and vow lifecycle remediation

Resolved in the 2026-11-12 increment. The three findings share one seam: the
audit log and the lifecycle gates that write to it.

- **F-P3B1-4 — condition tools refused the Player and wrote no audit entry.**
  `conditionAccessRefusal` is the single predicate behind `apply` and `remove`:
  the GM/Editor may act on any entity or NPC, the Player only on
  `novel.active_entity_id`, and Observer is refused (`holonovel/src/index.ts`
  `conditionAccessRefusal`). Both successful mutations audit before saving —
  `apply_condition` (with `rounds` when supplied) and `remove_condition`; the
  duplicate/absent `[WARNING]` paths write nothing. T258 now covers self-apply,
  self-remove, other-entity `[FORBIDDEN]` naming the target, Observer refusal,
  and the entry counts.
- **F-P3B1-5 — audit coverage gaps.** `set_badge` captures the previous badge,
  audits `{from, to}` before `saveNovel` (`index.ts`, `set_badge` handler), so
  REQ-040c's old/new pair persists with the switch. `StateManager.appendAuditEntry`
  is the shared entry writer; `snapshot()` calls it when the depth ceiling
  evicts the oldest clone, recording `[snapshot-truncated]` with the badge and
  the discarded snapshot's `last_mutation_at` (`core/state.ts`, `appendAuditEntry`
  and `snapshot`). The isolated `T10/REQ-041b` assertion pins
  `TTRPG_MAX_SNAPSHOT_DEPTH=10`, mutates twelve times on a fresh Novel, and
  observes exactly two entries with the chain still valid. All four vow
  mutations audit before saving — `set_vow`, `advance_vow`, `resolve_vow`,
  `forsake_vow`, plus `vow_countdown_filled` and `vow_countdown_removed`.
- **F-P3B1-8 — vow lifecycle gaps.** `resolve` is gated on
  `milestones >= rank_track` or a filled `vow:<name>` clock, before
  `novelSnapshot()` (a refusal pushes no snapshot); the linked clock is created
  empty by the accepted suggestion (`ticks: 0`, `total` = rank track,
  `direction: increment`, `clock_type: mission`), fills one tick per milestone,
  and is retained at fill so REQ-322d's eligibility is real rather than
  vacuous; resolve/forsake remove it and audit the removal. Consequences become
  a `consequence` story entry anchored `vow:<name>` (never the live scene, so
  an open decision is not silently cleared) and respect
  `TTRPG_MAX_STORY_ENTRIES`. `DIFFICULTY_TRACKS` now matches REQ-289b
  (10/20/30/40/50), with the update path preserving a stored track on a
  same-difficulty re-set. Resolved vows render "fulfilled" and forsaken vows
  `[vow-forsaken]` in the recap. T335 (two vows) and the widened T369 cover the
  gate, the fill, the consequence, the marker, and the audit entries.

### 2026-11-12 §5.6 typed recap payload remediation

Resolved in the 2026-11-12 increment. `manage_context (action: recap)` now
carries the machine-readable structure REQ-072b requires in its structured
result (`okWith` → `structured("OK", expanded, fields)`, so `grounding`
survives), while the text envelope keeps its markdown/Lonelog notation.

- **F-P3B1-3 — recap is not the typed structure REQ-072 requires.** The 15
  declared fields (REQ-072c1/c2) plus `narrative_orientation` are built once by
  `buildRecapPayload` and attached on all three return paths (scoped session,
  Lonelog, default); missing values are typed null or `[]` (REQ-072d).
  `confrontations_completed` holds per-combat `{participants, rounds, outcome}`
  objects paired from `init_combat`/`advance_combat`/`end_combat`, with
  `rounds` read from the end entry's `rounds_played` (REQ-175a) and
  `confrontation_pending` null unless `novel.combat.active` (REQ-175b).
  `entities` carries `{name, hp, max_hp, conditions, status}` with the
  four-status rule: the ruleset model's declared `death_condition` applied →
  `dead`; HP > 0 → `alive`; HP = 0 with a declaration → `unconscious`; HP = 0
  with no declaration → `incapacitated` (REQ-072a1). `roster_changes` and
  `condition_changes` map audit rows explicitly (including `condition_expired`),
  which required auditing the three unaudited creation paths (REQ-040a).
  A Player recap filters entities, lore, story, roster, condition, roll, and
  confrontation rows to the active entity (REQ-072a2), and an unknown
  `session_id` is `[ERROR] [NOT_FOUND]` with valid IDs enumerated (REQ-072f)
  instead of appending a not-found line to a successful recap. T53 and T212 are
  written; T214/T215 assert the typed payload.

### 2026-11-12 §5.6 entity, scene, and NPC-depth remediation

Resolved in the 2026-11-12 increment. The scene ledger, presence, and NPC depth
derivations now live in one pure module (`holonovel/src/core/scene-ledger.ts`),
and the roster/entity lifecycle runs through two helpers (`removeEntity`,
`rosterListingFields`) so the surfaces cannot drift.

- **F-P3B2-1 — entity/roster lifecycle gaps.** `import` matches the roster
  source id (`roster_source_id`) with an entity-id fallback and returns
  REQ-074c's `[STATE_CONFLICT]` hint; `removeEntity` clears the active field,
  drops the entity from the presence list, and audits (`index.ts:4591-4613`);
  `roster_remove` enumerates valid IDs and audits under REQ-040a — a no-op with
  no active Novel, which the assertion covers (`:4951-4963`); `party://current`
  carries derived `hp`/`max_hp` from the ruleset stats (`entityHp`,
  `:4635-4645`). T216/T220.
- **F-P3B2-2 — roster listing and resources.** `roster_list` returns id, name,
  and the ruleset-derived race/class/level, omitting each when the ruleset
  defines none (`rosterListingFields`, `:4615-4633`); `roster://class` and
  `roster://race` are concrete resources ahead of the `roster://{id}` template,
  with the reserved-token shadowing declared in their descriptions (`:14841`,
  `:14846`). T219.
- **F-P3B2-3 — scene-ledger gaps.** `scene://history` returns the newest
  `TTRPG_SCENE_HISTORY_MAX` entries with a leading `{suppressed, truncated,
  marker}` element (`:14261-14280`); `scene_tick` rides the Scene group, resets
  on the transition branch (`:7431`), increments when a combat round wraps
  (`:6838`), and renders GM-only (`:16475`); the lore/disposition contradiction
  check is `loreContradictionWarning` (`core/scene-ledger.ts:96-138`), invoked by
  `manage_scene (action: set)` at `index.ts:7471` as an advisory `[WARNING]`.
  T137, T331, T057.
- **F-P3B2-4 — fast-forward gaps.** Round countdowns advance proportionally
  (`intervalMagnitude`, `:4567-4589`), lore triggers are collected, and a
  bridging summary is recorded in the `[fast-forward]` audit entry and returned
  after the `[OK]` line; `skip_countdowns` suppresses advancement and says so.
  T312.
- **F-P3B2-5 — presence surface gaps.** `presentEntityIds`/`isPresent` keep the
  absent-versus-empty distinction (absent means all present per REQ-307a); the
  briefing renders a Party section with `[not present]` and `last_location`
  (`:16180-16192`); `manage_staging (action: presence)` accepts `location`,
  audits, validates IDs, and persists (`:7489-7511`, reached through the staging
  alias at `:7974`). T351.
- **F-P3B2-6 — NPC depth metadata.** `appearance_count`, `first_seen`,
  `last_seen`, `appearance_scenes`, and `appearance_sessions` join `NpcState`;
  `recordNpcAppearance` is deduped per scene and runs on the mutate-gated
  briefing render and the scene-set path (`:4528-4547`); `npcDepthMarker`
  renders `[recurring]` (3+), `[campaign]` (10+), and `[distant]` (5+ sessions
  unseen, suppressed without session data) (`:4549-4560`); the recap carries the
  GM-only `npc_heatmap` (`:11147-11153`). T056, T723.
- **F-P3B2-7 — NPC description diverged.** `npcDescription`/`setNpcDescription`
  are the only reader and writer of the shared description property; `npc://<id>`,
  `npc://<id>/personality`, and the sheet output all read the same value, and
  the most recent write wins (`:4515-4523`). T191.
- **F-P3B2-8 — NPC memory was combat-only.** `manage_npc (action: update)` with a
  disposition change ingests an interaction and couples a hostile flip into
  campaign memory; contacts carry `apparent_capabilities` and `relationship`;
  the memory section renders per-entity party knowledge (`:5040-5060`).
  `npc_memory_count` grows and the emotional-state summary/last-3/goals render
  as before. T056/REQ-311. Deviation: no in-tree social-check resolution surface
  exists to hook automatic social ingestion (checks route to the bound ruleset's
  roll tools), recorded as a P3 coverage note in the increment's AAR.

### 2026-11-12 §5.6 adventure content remediation

Resolved in the 2026-11-12 increment. The structure extractor
(`holonovel/src/core/adventure.ts`) is the single parser behind every surface;
the build-time index is emitted by `holonovel/scripts/generate-adventure-index.ts`
and gated by `npm run check-adventure-index`.

- **F-P3B3-1 — `load` ignored `target`.** `manage_adventure (action: load)`
  reads `args.target`, defaults to `codex` with no active Novel, and stores the
  Appendix O.10 payload as `adventure_<slug>` with `source: loaded:<slug>`
  without touching Novel state (`index.ts:11284-11360`). T368.
- **F-P3B3-2 — no pre-population or briefing block.** `prepopulateAdventure`
  creates skeletal NPCs, location lore entries, and faction clocks with
  duplicate skips and monster suggestions (`index.ts:2900-2960`); the briefing
  renders `## Adventure` (hook, current location, room contents) and
  `## Generated Adventure` (`:15720-15760`). T287, T60.
- **F-P3B3-3 — adventure prose was not searchable.** `searchAdventureProse`
  (`index.ts:12525-12575`) adds HIGH/MEDIUM confidence hits, active-first sort,
  the `[generated]` tag as a label only, and a REQ-280 source anchor; the
  ruleset branch merges them instead of returning `NOT_FOUND` (`:12562-12610`).
  T59.
- **F-P3B3-4 — no per-anchor resource.** `adventure://{slug}/{anchor}` is
  registered after the two specific templates (`index.ts:11750`), serving
  indexed prose and the generated anchors `overview`/`hook`/`world`/
  `location-<n>`. T59, T146.
- **F-P3B3-5 — discovery and drift fields violated the health contract.**
  `spec_health.indexed_adventures` carries `title`, `content_hash`,
  `player_visible`, `source`, and `malformed` entries with the
  `[malformed-adventure]` flag (`index.ts:13527`); `warmAdventureIndex`
  (`:2962-2985`) compares build hashes at startup and surfaces
  `[adventure-drift]` with a detection timestamp and stderr warning. T207,
  T208, T209.
- **F-P3B3-6 — catalog filter and badge rules diverged.** The genre filter
  applies to every badge; Player visibility is `player_visible` (front-matter
  marker) or a shared `## Adventure Hook`; the same rule gates
  `adventures://`; the preview falls back to `[derived]` hook sentences
  (`index.ts:11494-11530`, `:11580-11600`). T338, T207.
- **F-P3B3-7 — overview and navigation omitted contract fields.** Both render
  from the extractor: NPC roles, location descriptions, faction lines, scene
  count; navigation carries heading anchors and per-marker badge filtering;
  `[STATE_CONFLICT]` tests adventure absence (`index.ts:11617-11745`). T285,
  T286.
- **F-P3B3-8 — a waypoint change fired no transition.** `isTransition`
  includes `waypointChanged` (`index.ts:6889-6900`), scene history is pushed
  only on a description change, and the audit entry names the waypoint
  (`:7010-7018`). T284.
- **F-P3B3-9 — generated-adventure lifecycle broke coexistence.** `generate`
  emits a `## World` section for a spatial premise and tracks
  `materialized_rooms` (`index.ts:11050-11075`); `load` re-applies the generated
  rooms after replacing the indexed world instead of nulling the generated
  adventure (`:11370-11410`), and regeneration removes the prior rooms. T146.
- **F-P3B3-10 — synthesis linkage was partial.** `adventureSynthesisMatches`
  (`index.ts:2988-3030`) matches voice, lore, action-pattern, and
  adventure-advice items against the extracted structure; both load branches
  share `adventureAugmentation` with REQ-229c's wording and the omission
  branch; `manage_synthesis (action: list)` derives `adventure_slug`
  (`:15400-15440`). T305, T288.
- **F-P3B3-11 — cited assertions were absent or narrow.** T59, T60, T61, T206,
  T208, T209, T283, T287, T368 are implemented in
  `holonovel/scripts/test-adventure.ts`; T146, T207, T284, T285, T286, T305,
  T338 are widened in `test-output-contracts.ts`.
- **F-P3B3-12 — not-found, environment, and suggestion deviations.** The
  `[NOT_FOUND]` message enumerates slugs (`index.ts:11293`); `TTRPG_ADVENTURE`
  contributes file paths (`:2790`, `:2838`); `prepopulateAdventure` emits the
  `lookup_monster`-style suggestion for a bound ruleset.

### 2026-11-12 §5.6 state surfaces remediation

Resolved in the 2026-11-12 increment. Findings F-P3B4-3 (neutral-inclusive
marker set) and F-P3B4-8 (`ruleset` on a captured entry) were already satisfied
in source; their resolution is the added assertion.

- **F-P3B4-1 — pause/resume context gaps.** `get_context` now returns the
  `badge_briefing` payload rendered read-only through
  `composeBadgeBriefing(novel, { mutate: false })` (`index.ts:15305`); the
  renderer skips the pacing counter and world-in-motion bookkeeping. The
  `save_context` capture filters to `decision`/`bond` entries
  (`index.ts:12016`), and the `intro` prompt renders a `## GM context` summary
  from `gmContextSummary` (`:15242`) through `IntroContext.gmContext`
  (`core/prompt-composition.ts:36`). T268 widened.
- **F-P3B4-2 — world reactivity was NPC-only.** `WorldChange` and
  `novel.world_in_motion` (`core/state.ts:807`) hold pending non-NPC changes;
  `enqueueWorldChange` (`index.ts:2482`) covers the three REQ-233a1 triggers
  (relationship set, `fillFactionClock`, `manage_lore (action: reveal)`) and
  traces one hop through `worldChangeTargets` (`:2469`). The transition cycle
  (`:2504`) receives the marker list captured before the clear
  (`index.ts:6910`). `respond_decision` resolves accept/modify/defer/dismiss,
  the `modify` branch raises an apply/cancel `[NEED_INPUT]` workflow, and the
  fourth deferral surfaces `spec_health.world_reactivity_warnings` (derived at
  render time, `:13223`). REQ-233a3's T358 now exists.
- **F-P3B4-3 — relationship gaps.** `recordRelationshipMarker` records the
  ally↔rival lore prompt rendered in `narrative_threads`
  (`index.ts:1103`), and clears it with the markers at the transition. The
  neutral-inclusive transition set was already implemented at `:1087`; T270
  now asserts it.
- **F-P3B4-4 — session markers were not badge-filtered.** `auditArgsForBadge`
  (`index.ts:13688`) renders a `[session-boundary]` marker for a non-GM badge as
  a `started_at`/`ended_at` timespan and strips `session_id` from other args;
  boundary markers are always visible so the Player sees the timespan.
- **F-P3B4-5 — notes were absent from the briefing.** `composeNotesSection`
  (`index.ts:1060`) renders `### Notes (notes)` badge-filtered, and the `notes`
  token is in both `section_tokens` and `VALID_TOKENS`.
- **F-P3B4-6 — flat stores were not atomic.** `writeFlatStore`
  (`core/state.ts:2875`) gives `server-notes.json` and `codex.json` the Novel
  writer's `.bak.N` rotation, fsync, and rename.
- **F-P3B4-7 — codex health count was not partitioned.** `spec_health.codex`
  is `{ total, by_kind }` (`index.ts:13200`).
- **F-P3B4-8 — captured entries carried no ruleset scope.** Already
  implemented at capture (`index.ts:14740`, `ruleset: novel.ruleset ?? null`);
  T383 now asserts the field.
- **F-P3B4-9 — `[codex-stale]` was unimplemented.** `spec_health.codex_stale`
  (`index.ts:13206`) compares each source entry's `codex_modified_at` against
  the Novel artifact's recorded import value; T384 asserts the flag appears and
  clears.
- **F-P3B4-10 — REQ-065f cited an unexercised T52.** The `_Check:` re-points to
  the exercised T224 (`test-persistence.ts:703`), which asserts all three drift
  branches.
- **F-P3B4-11 — REQ-236c cited an unexercised T270.** T270 now exists in
  `test-narrative.ts` (relationship read, sheet, lore prompt, pause capture).
- **F-P3B4-12 — REQ-233a3 cited an unexercised T358.** T358 now exists in
  `test-briefing.ts` (reactivity/autonomy matrix, ripple memory fact, accept,
  defer re-surface, fourth-deferral warning).
- **F-P3B4-13 — T275 was narrower than REQ-237.** T275 now asserts two
  boundary markers, per-session recap scoping through `sessionAuditRange`
  (`index.ts:10439`), the full per-session metric set, and Player redaction.
- **F-P3B4-14 — T280 was narrower than REQ-242.** T280 now asserts the default
  `game_master` scope, Player list filtering, `notes://` `[FORBIDDEN]`, both
  briefing views, the export shape, and end-Novel clearing.
- **F-P3B4-15 — T334 was narrower than REQ-285.** T334 now asserts restart
  persistence, Player refusals on all four surfaces, the
  `server-notes://<key>` content, and the `spec_health.server_notes` count.

### 2026-11-12 §5.9/§5.19 persistence remediation

- **F-P4-2 — an archive over an existing archived Novel deleted it (resolved
  2026-11-12):** `archiveNovel` (`holonovel/src/core/state.ts:1872`) refuses
  with `[STATE_CONFLICT]` when the archive target or any backup destination
  exists (`:1884`), names the path, and suggests rename or unarchive, so the
  earlier archived copy survives byte-for-byte. Exercised by
  `T381/REQ-334b` in `test:persistence`.
- **F-P4-3 — combat-round resolution wrote no auto-moment (resolved
  2026-11-12):** the round increment in `advanceCombat`
  (`holonovel/src/core/state.ts:2496`) appends a `moment` through the shared
  `appendStoryMoment` and audits `auto-moment`, gated by `auto_record`.
  Exercised by `T474/REQ-405` in `test:persistence-guardrails`.
- **F-P4-4 — total corruption surfaced no chain paths (resolved 2026-11-12):**
  `markCorrupt` (`holonovel/src/core/state.ts:2633`) records
  `data_health.corrupted_detail` (primary plus every backup path) and emits a
  stderr line naming them; `data_health.markers` carries `[corrupted-novel]`.
  Four call sites: the `resumeNovel` catch and both hydration branches in
  `state.ts`, plus the `TTRPG_NOVEL` activation in `index.ts:2134`. Exercised
  by `T175/REQ-001a`.
- **F-P4-5 — `novel_format_version` and its migrations were absent (resolved
  2026-11-12):** `saveNovel` stamps `novel_format_version`
  (`holonovel/src/core/state.ts:2705`); `migrateNovelFormat` (`:1758`) adopts
  and deletes a valid v1 `.audit.jsonl`, records `[migration-missing-audit]`
  when the sidecar is absent or its chain fails (keeping an unverified
  sidecar), stamps `2`, and records `[format-future]` for a newer payload. The
  stamp is reserved from `future_fields` so the digest is stable, and the
  export manifest uses the same constant. Exercised by `T77/REQ-092e/f/g`.
- **F-P4-6 — warn-mode drift text named no beats or commit tools (resolved
  2026-11-12):** `stateDriftWarning` (`holonovel/src/index.ts:12611`) names up
  to five beats from `gm_context.saved_beats` with the tool that commits each;
  the recap, switch, end, and block paths share the formatter, and
  `recordMutation` clears the list. Exercised by `T472/REQ-403b`.
- **F-P4-7 — the persistence directive omitted eight tool categories
  (resolved 2026-11-12):** `### State persistence`
  (`holonovel/src/index.ts:15347`) names the eight omitted REQ-400 categories
  from `PERSISTENCE_CATEGORY_TOKENS`, the same table that feeds the REQ-407
  tool list, and all three §5.19 sections are in `NEVER_TRUNCATED`. Exercised
  by `T469/REQ-400/135`.
- **F-P4-8 — a restored backup skipped workflow-staleness accounting (resolved
  2026-11-12):** the `resumeNovel` restore branch calls
  `checkWorkflowStaleness` (`holonovel/src/core/state.ts:1431`) before
  returning. Exercised by the restore-staleness case in
  `test:persistence-guardrails` (T266 family/REQ-224a).
- **F-P4-9 — three §5.19 assertions were narrower than their REQs (resolved
  2026-11-12):** T470 asserts the ISO last-mutation timestamp and an active
  `[state-drift]` ledger marker; T471 asserts the recap names the recorded
  session; T475 asserts the timestamp gap and the unparseable-primary branch
  (honest zero gaps, `backup_index` recorded). Exercised by
  `test:persistence-guardrails`.

### 2026-11-11 §5.20/§5.24 assertion repair

- **F-P5-7 — six narrow assertions (resolved 2026-11-11):** each check now
  reaches the clause its REQ body states. `T545`
  (`holonovel/scripts/test-event-log.ts:33`) keeps the retained ordinals across
  a restart, continues at `#3`/`#4`, and returns both through
  `replay (to_event: 2)`; `T550` (`:165`) admits evidence citing ordinal 1 while
  `#2` exists and asserts the record's `source_ordinals` is `[1]`; `T640`
  (`holonovel/scripts/test-lean-narrator.ts:122`) covers all six badge ×
  AI-role cases plus a 150-character briefing budget, and the token now reads
  `narrativeRole(novel) ?? "game_master"` (`holonovel/src/index.ts:14963`) and
  renders under a tier-1 `### Play loop` section (`:3175`); `T712` (`:190`)
  excludes `active_session_id` and `last_mutation_at`; `T713` (`:204`) injects
  an unhashed entry and an older-projection entry and asserts the two counts,
  the `[unhashed]` replay line, and `State verification: unhashed entries: 1`;
  and `T727` (`holonovel/scripts/test-competitive-gaps.ts:588`, `:704`) asserts
  the manual selection clears on a scene transition and that export, clone, and
  checkpoint preserve the cast state. The widened `T713` exposed a REQ-603
  defect — `verify` claimed `clean` beside unhashed entries — fixed in the same
  increment (`index.ts:10696-10703`). REQ-412a, REQ-455, REQ-460, REQ-601,
  REQ-602, REQ-603, REQ-611.

### 2026-11-11 fingerprinted-section tool-token re-point

- **F-P6a-21 — three `command` tokens remained in fingerprinted sections
  (resolved 2026-11-11):** REQ-221b
  (`spec/02-requirements.md:1542`) carried three `command("…")` call forms and
  REQ-330a (`:1826`) one bare token, both in §5.6, a data-format fingerprint
  source (`scripts/lib/contract-fingerprint.ts:38`); REQ-385a (`:3906`) carried
  one bare token in §5.16, a package-format source (`:27`). All three now name
  the registered tool — `run_command (action: execute, …)` at the call sites,
  and "parser-command suggestions" where the token named the parser surface
  rather than a tool. `scripts/tool-citation-check.ts` ships an empty allowlist,
  so the bare-token detector gates every REQ body; the §4 fixture-notation row
  no longer records a deferral
  (`spec/01a-constitution.md:141`). Both constants were regenerated in the same
  increment (`holonovel/src/generated/contract-fingerprints.ts`: package format
  `a16b1e40…`, data format `9c07813a…`) and the two artifacts that bake them
  were re-emitted (`holonovel/testdata/rulesets/fixture/manifest.json`,
  `holonovel/content/torre-nosferatu.json`). REQ-221b, REQ-330a, REQ-385a.

### 2026-11-11 §5.20 staging order and AI-role handoff

- **F-P5-5 — REQ-612 `list` had no GM-order source (resolved 2026-11-11):** the
  `list` branch iterated `novel.npcs` insertion order
  (`holonovel/src/index.ts:6932`) because no action wrote
  `social_cast.order` — the field was typed (`holonovel/src/core/state.ts:737`)
  and persisted but never set. `manage_staging (action: cast)` now accepts
  `order` (`index.ts:6718`), stores it (`:6922`) and audits it in the existing
  `set_scene_cast` entry (`:6925`); the `list` branch walks the declared order
  first, then insertion order, ignoring ids that name no present NPC, and reads
  `cast.order ?? []` so a pre-increment save cannot break the selector
  (`:6949-6961`). `manage_scene` stays unchanged: `order` joins
  `MANAGE_SCENE_STAGING_PARAMS` (`:6686`), which filters staging parameters off
  the legacy schema. Exercised by T728
  (`holonovel/scripts/test-competitive-gaps.ts:609-640`); REQ-611 and REQ-612
  (`spec/02-requirements.md:4119`, `:4122`).
- **F-P5-6 — turn handoff keyed on badge, not AI role (resolved 2026-11-11):**
  the directive branched on `badge` (`index.ts:15013-15023`) and read
  `TTRPG_AI_ROLE` only afterwards for orientation (`:15029-15033`), so the
  override never reached the handoff. The block now resolves the AI narrative
  role through the REQ-598 helper (`narrativeRole`, `:1106-1111`; call at
  `:15039`) and gates the invite branch on REQ-412's WHEN clause
  (`badge === "player" || badge === "observer"`), so a Player or Observer badge
  under an AI-Player role hands initiative back and a Game Master badge under
  an AI-Game-Master role carries no directive. Exercised by T482 in
  `holonovel/scripts/test-backfill.ts:1250-1268` (counterpart matrix) and
  `holonovel/scripts/test-briefing.ts:130-162` (role overrides and the
  never-truncated tier). REQ-412, REQ-304.

### 2026-11-11 §5.10 parser tool-name drift

- **F-P6a-20 — `command`-as-tool drift in §5.10 (resolved 2026-11-11):** the
  retired token survived the 2026-09-10 rename in 26 §5.10 REQ bodies and two
  §5.10 prose paragraphs (`spec/02-requirements.md:3199-3203`), while the
  registered tool is `run_command` (`holonovel/AGENTS.md:72`; rename recorded
  at `holonovel/DECISIONS.md:1507`). All 28 sites now name `run_command`
  (`run_command (action: execute, "X")` where an invocation is quoted), and
  `scripts/tool-citation-check.ts` gained a bare-token detector
  (`checkToolTokenDrift` in `scripts/lib/req-checks.ts`) so the class cannot
  recur silently. The fixture-notation clause's licence was also re-pointed
  from the Appendix T tool-surface map to Appendix F, the actual test
  catalogue, and now excludes §5 normative text
  (`spec/01a-constitution.md:141`); Appendix W's transcript is declared as
  notation rather than rewritten, and T261 asserts the registered tool through
  that notation (`spec/appendices-reference.md:1721`). REQ-196a, REQ-196d,
  REQ-197a–c, REQ-283b, REQ-284b/d/f, REQ-309b–h, REQ-316a, REQ-317a–d,
  REQ-319d, REQ-320c, REQ-327a, REQ-367b1/b2.

### 2026-11-11 §5.12 observer resolve and resource reads

- **F-5.12-1 — REQ-366b resolve, spatial-query, and resource depth (resolved
  2026-11-11):** the two observer refusals are gone — the `visibility`/
  `audibility` query (`holonovel/src/index.ts:4786-4789`) and
  `run_command (action: resolve)` (`:4814-4821`), both formerly gated by
  `requireNotObserver()`. The Player-badge refusals are unchanged. The
  register's original "resource reads still observer-refused" premise was
  wrong: no resource handler called `requireNotObserver()`, and a probe read
  `room://`, `thing://`, and `world://map` under the observer badge. The actual
  defect was depth — `room-single` and `thing-single` computed
  `isGM = game_master || none` (`:13450`, `:13489`) and so rendered the
  observer at Player depth, while `world://map`/`world://kinds` already used
  the `player ? player : game_master` split (`:13513`, `:13519`). Both now
  admit `observer`, matching REQ-305a's unfiltered state surface. REQ-366b
  gains its missing `_Check:_ T417` and the depth sentence; T417 and T643 are
  widened and exercised. REQ-366b, REQ-305, REQ-596, REQ-597.

### 2026-11-11 §5.10 observer parser access

- **F-5.10-2 — REQ-309h observer clause implemented (resolved 2026-11-11):**
  The parser gate now carries one read-only predicate: the `observer` badge is
  read-only on every Novel and resolves `look`, `examine`/`search`, and
  `inventory` while navigation and mutation return `[FORBIDDEN]`, and a
  ruleset-bound Player keeps its verb-scoped window
  (`holonovel/src/index.ts:4971-4984`). The ruleset-free `requireNotObserver()`
  refusal is gone. REQ-196a now admits the observer badge on a ruleset-free
  Novel (`spec/02-requirements.md:3243`) and REQ-309b names the observer's
  read-only commands as a second exception to the GM-only verb rule (`:3415`).
  Appendix F's T353 row states the ruleset-free observer case and T643 states
  the ruleset-bound one (`spec/appendices-reference.md:1779`, `:2061`),
  exercised by `holonovel/scripts/test-backfill.ts` and
  `holonovel/scripts/test-competitive-gaps.ts`. The description-mode verbs no
  longer write the Novel file (`holonovel/src/index.ts:4937-4940`), so an
  observer `brief` mutates nothing. REQ-366b's parser clause is covered;
  its resolve and resource clauses are scheduled as F-5.12-1. REQ-309h,
  REQ-196a, REQ-309b, REQ-366b, REQ-305.

### 2026-11-11 §5.10 parser badge clause

- **F-P6a-19 — REQ-196a Player-badge clause reconciled (resolved 2026-11-11):**
  REQ-196a now states qualified badge gating — ruleset-bound navigation and
  mutation are Game Master only and a Player call for either returns
  `[ERROR] [FORBIDDEN]`, while the read-only commands of REQ-309h succeed, and
  a ruleset-free Novel accepts the `player` and `game_master` badges
  (`spec/02-requirements.md:3243`), matching the shipped gate
  (`holonovel/src/index.ts:4966-4971`) and the Appendix W.3 transcript
  (`spec/appendices-fixtures.md:831`). REQ-196c's unconditional
  unrecognized-command sentence is qualified the same way (`:3249`).
  Appendix F's T239 row no longer claims an unreachable ruleset-bound Player
  nearest-verb list (`spec/appendices-reference.md:1697`); T643 states the
  reachable refusal (`:2061`), exercised by the new `xyzzy` → `[FORBIDDEN]`
  assertion in `holonovel/scripts/test-competitive-gaps.ts:493-505`. Appendix
  W.4 says `[UNIMPLEMENTED]` (`spec/appendices-fixtures.md:964`). Exercised by
  T239 (`test-backfill.ts:392-441`) and T643. REQ-196a, REQ-196c. ROADMAP
  section deleted; the observer clause REQ-309h also states is scheduled as
  F-5.10-2.

### 2026-11-11 §5.10 override hint envelope

- **F-5.10-1 — override hint envelope and the REQ-325c Check (resolved
  2026-11-11):** `run_command (action: resolve)` returns `status: "blocked"`
  with the constraint and reason for a closed or locked door, and carries
  `override_hints` only when the catalog offers a bypass; the hint names the
  mechanic and its remaining slots (`Knock (1 slot remaining) can open it.`),
  sourced at call time by `doorOverrideHints` (`holonovel/src/index.ts:6133-6150`),
  which keys on the entry's `type` constraint class instead of comparing the
  mechanic name to the door (`:6176-6195`). The catalog visibility rule is one
  shared predicate used by the resource and the hint scan
  (`visibleConstraintOverrides`, `:6125-6132`; resource at `:13721-13728`).
  REQ-325c now cites `T370, T372` (`spec/02-requirements.md:3440`), the
  Appendix F T370 row asserts the blocked envelope and the GM breadth
  (`spec/appendices-reference.md:1825`), and REQ-326d cites T373 (`:3451`).
  Exercised by T370 (`holonovel/scripts/test-output-contracts.ts:1575`) and T372
  (`:1649`). REQ-323, REQ-325. ROADMAP section deleted.

### 2026-11-11 §5.10 resources, suggest, and CRUD

- **F-P6a-12 — world resources and badge filtering (resolved 2026-11-11):**
  every world-model resource reads the live badge (`getBadge() === "game_master"
  || getBadge() === "none"`) and splits the payload: `room://` lists direct
  occupants, a supporter's surface, and the contents of open containers, then
  adds ids, exit targets, and the four-key `**Annotations:**` line for the GM
  (`holonovel/src/index.ts:13385-13441`); `thing://` adds the full property list,
  `doorConnects`, and the `containmentChain` walk
  (`holonovel/src/world/model.ts:1074-1096`) for the GM and only the room-level
  location for the Player (`index.ts:13443-13476`); `worldMap` and `worldKinds`
  take the badge (`world/model.ts:1044-1072`, `:1098-1139`), with the GM map
  appending `## Annotations` and a bound-Player `worldKinds` stopping before
  `## Parser Commands` (`index.ts:13477-13491`); the `constraints://active`
  Player filter keeps an override only when `match_all` is set or its `entities`
  list names the active entity (`index.ts:13695-13709`), and
  `constraint_override_counts` reports `{ total, by_type, by_source }`
  (`index.ts:12884-12895`). REQ-202a, REQ-202b, REQ-222b, REQ-325a, REQ-309b.
  ROADMAP section deleted.
- **F-P6a-13 — Player spatial suggest never maps to resolve (resolved
  2026-11-11):** `spatialCmd` returns
  `run_command (action: resolve, intent: "<intent>")` for the Player badge on a
  ruleset-bound Novel (ruleset-free keeps the parser form, REQ-309b's scoped
  ban), the spatial list is deduped, and the GM receives the resolve mapping
  beside the parser form (`holonovel/src/index.ts:4831-4834`, `:4908-4914`).
  REQ-309b, REQ-309g. ROADMAP section deleted.
- **F-P6a-14 — CRUD lifecycle gaps (resolved 2026-11-11):** `create_exit`
  validates before snapshotting, writes canonical room names, accepts an
  optional `door` that binds `doorRefs` on both rooms and `doorConnects` on the
  door, and clears any prior binding (`holonovel/src/index.ts:5755-5797`);
  `remove_exit` removes the reverse edge when it points back and clears both
  `doorRefs` entries plus `doorConnects` (`:5798-5828`); `remove_room` removes a
  transitive contents fixpoint, both-direction exits, and bound doors, and
  audits `{ things, exits, doors }` (`:5626-5682`); `update_room` validates
  before snapshotting and audits its changed fields (`:5614-5625`); the parser
  resolves the door portion of `unlock/lock <door> with <key>`
  (`holonovel/src/world/parser.ts:616-660`). REQ-198, REQ-199. ROADMAP section
  deleted.

### 2026-11-11 §5.10 hints, detail, and vehicles

- **F-P6a-8 — implicit action hints (resolved 2026-11-11):** a locked `open`
  now returns `[ERROR] [RULE_VIOLATION]` with
  `Hint: You need the <object> (<location>) first.` on its own line, omitted
  when no key is reachable (`holonovel/src/world/parser.ts:518-531`); the hint
  uses the room's display name and REQ-284a reachability (room, inventory, or an
  **open** container) through `hintLine`/`isHintReachable`
  (`parser.ts:548-583`); `unlock`/`lock` keep the bound-key `[WARNING]` and the
  REQ-284f free-unlock `[OK]` with the hint on its own line
  (`parser.ts:616-650`); a readable thing inside a closed container returns the
  jar hint (`parser.ts:758-782`); and `enter`/`climb` on a vehicle or climbable
  one open exit away returns the direction-bearing hint while keeping their
  existing `[NOT_FOUND]` result (`parser.ts:584-611`, `:792-823`). REQ-284a,
  REQ-284b, REQ-284c, REQ-284d, REQ-284e.
- **F-P6a-9 — detail signal and Player-Detail line (resolved 2026-11-11):**
  `detailLevel` is a session `terse|normal|rich` override over the independently
  stored chosen room mode (`holonovel/src/index.ts:1954-1961`); the signal
  handler validates the three values and sets the level without mutating the
  chosen mode (`index.ts:4358-4372`); `spec_health` reports `detail_level` and
  the effective `description_mode` (`index.ts:12919-12920`, `:12961`);
  `run_command` appends `[lore] <key>` notices under `rich` by diffing the
  active-lore set around the call (`index.ts:5065`, `:5299-5303`); and
  `badge_briefing` renders the `Player-Detail:` line (`index.ts:14764`).
  REQ-197c, REQ-197d.
- **F-P6a-10 — vehicle traversal (resolved 2026-11-11):** `create_thing` gives a
  vehicle the shared default capacity of 4 or the supplied value
  (`index.ts:5486`, `:5668`), and the parser's full-vehicle check applies to it
  while re-entry by an occupant is idempotent (`parser.ts:813-823`, with
  `actorId` from `index.ts:5063`); aboard movement resolves the parked room's
  `doorRefs` and moves every passenger (`index.ts:5025-5050`); the
  `[vehicle-entry]` moment carries the interior description
  (`index.ts:5342-5354`, call at `:5231`); vehicle traversals appear as
  `kind: "vehicle"` recap transitions (`index.ts:10355-10362`) and a
  `### Vehicle` briefing block (`index.ts:14795-14805`); the interior stays
  virtual, so `world://map` never lists it. REQ-317a, REQ-317b, REQ-317c,
  REQ-317d.

### 2026-11-10 §5.10 parser and help contracts

- **F-P6a-7 — parser response and help contracts (resolved 2026-11-10):** the
  unknown-verb path now returns `[UNIMPLEMENTED]` naming the verb and the three
  nearest valid commands, filtered to the caller's vocabulary
  (`holonovel/src/world/parser.ts:125-136`); taking from a closed container
  resolves through the widened candidate set and returns `[RULE_VIOLATION]`
  (`:435`, `:458-462`); ambiguity returns `[OK] Which thing?` with a numbered,
  location-bearing list and a numeric reply re-dispatches the command
  (`:350-368`; `holonovel/src/index.ts:4885-4897`); `help`, `commands`,
  `what can I do?`, and `verbs` return one canonical text grouped by tier and
  category with one-line descriptions (`index.ts:4900-4906`, `:5253-5282`); the
  catalog is a single table carrying category, tier, args, effect, and source,
  with `jump` dispatched and `touch` registered as inspection
  (`world/model.ts:271-321`; `parser.ts:738-747`); exits render as the closing
  status line (`parser.ts:343`); the `run_command` description states the
  AI-narrator role (`index.ts:4742`); `read_text` carries a property-contract
  row (`world/model.ts:102-106`). Covered REQs: REQ-196b, REQ-196c, REQ-196d,
  REQ-196e, REQ-197a, REQ-283a, REQ-283b, REQ-318a. Assertions: T239
  (`holonovel/scripts/test-backfill.ts:392`), T240 and T333
  (`test-output-contracts.ts:1438`), T245 (`test-world-provider.ts:49-80`).
- **F-P6a-11 — narrative-intent verbs (resolved 2026-11-10):** the catalog
  registers `ask`/`tell`/`give`/`show`/`throw` under a `narrative` category at
  standard tier, and help renders that block with the Game-Master-outcome note
  (`world/model.ts:316-320`; `index.ts:5253-5282`); `give` and `show` resolve
  the NPC only in the current room and a miss records a `[WARNING]` intent
  without transferring (`index.ts:5342-5379`); `throw` moves the thing to the
  matched target's room (`:5328-5341`). Covered REQs: REQ-320a, REQ-320b,
  REQ-320c. Assertion: T365 (`test-backfill.ts:811`).
- **F-P6a-17 — narrative-verb NPC scope (resolved 2026-11-10):** the
  `resolveNpcInRoom(..., null)` any-room fallback is removed from `give` and
  `show` (`index.ts:5355`, `:5369`), and `throw` uses the matched target's
  room (`:5334`); a no-NPC `give` now records `[WARNING]`, not `[OK]`
  (`:5356`). Covered REQs: REQ-320b, REQ-320c. Assertion: T365
  (`test-backfill.ts:851`).

### 2026-11-10 §5.16–§5.18 citation repair

- **F-P6b-21 — §5.16–§5.18 citation gaps (resolved 2026-11-10):** the eight
  §5.16/§5.17 contracts the 2026-11-10 remediation sessions shipped are
  exercised by T440 (`test-ruleset-surface-remediation.ts:173`), T442 (`:225`),
  T444 (`:252`), T446 (`:292`), T445 (`:332`), T447 (`:352`), T458 (`:196`), and
  T525 (`test-ironsworn.ts:100`); the §5.18 contracts by T463
  (`test-fingerprints.ts:275`), T650 (`:298`), T656
  (`test-ruleset-gates.ts:328`), and T657 (`test-fingerprints.ts:326`). Four
  citations were re-pointed: REQ-387b now cites T448 — the codex ruleset axis
  (`test-ruleset-surface-remediation.ts:373`) — instead of T431, which is the
  Pattern Buffer row; REQ-391b's schema clause is carried by the T457 token on
  T720 (`test-selection.ts:204`); REQ-398 cites T467, whose two halves are the
  pipeline deploy checks (`scripts/test-push-pipeline.ts:144,307`), plus T462
  and T491; REQ-393 cites T498 as well as T460. Two assertions were written:
  T464 (`scripts/test-spec-tooling.ts:371`: the Appendix V Convert/Build/
  Synthesize/Update runbooks each carry an entry point, a happy-path passage,
  and recovery steps, and §0 reaches Appendix V) and T492
  (`scripts/test-spec-tooling.ts:113-121`: a body-only delta is Minor without a
  disposition naming the repaired REQ set, Editorial with one, and never
  Editorial for a state-model or tool-surface body change). T460 moved from a
  numeric-only check to a real assertion (`test-fingerprints.ts:247`: the
  compatible package stays loaded with its installed files unchanged, the
  incompatible one is `[package-incompatible]` and held inactive, and
  roster/codex/server-notes survive byte-for-byte when the Novel is compared
  without its re-stamped `data_format`). The T492 case exposed a real ordering
  hole — `classifyDelta` returned `editorial` before consulting the major
  triggers (`scripts/lib/spec-delta-classify.ts:46`), letting an Editorial
  disposition lower a tool-surface contract change — now fail-closed; the
  interpretation is that the family predicate is the mechanical proxy for
  "REQ scope actually changed" (REQ-419), so a typo repair inside a
  state-model or tool-surface REQ classifies major rather than editorial.
  `hasEditorialDisposition` moved beside `classifyDelta` (`:55`) so the
  self-test asserts the same rule. REQ-379c, REQ-381c, REQ-383b, REQ-384c,
  REQ-385b, REQ-386b, REQ-387b, REQ-389b, REQ-389c, REQ-391b, REQ-391c,
  REQ-393, REQ-394, REQ-395a, REQ-395b, REQ-398, REQ-419, REQ-439, REQ-557,
  REQ-563, REQ-564.

### 2026-11-10 §5.21–§5.23 capability remediation

- **F-P6b-17 — Forged resist does not reduce a named consequence (resolved
  2026-11-10):** `ForgedCharacterState` now carries `consequences: string[]`
  (`holonovel/src/core/state.ts:590-594`) and the deep normalizer defaults a
  legacy character to `[]` (`:599-612`); a named `mark` records the
  consequence once, a filling mark records trauma only, and `resist` removes
  the recorded consequence before spending the cost
  (`holonovel/src/index.ts:8210-8262`), refusing a missing name
  (`[INVALID_INPUT]`) or an unrecorded one (`[NOT_FOUND]`). Exercised by T528
  (`holonovel/scripts/test-forged.ts:101-140`). REQ-442.
- **F-P6b-18 — refusal paths push undo state and clear redo (resolved
  2026-11-10):** every capability branch validates its op, arguments, and
  state lookups before `novelSnapshot()`, and the entry creation
  (`fate.stress[...] ??=`, `forged.characters[...] ??=`) sits below the
  snapshot (`holonovel/src/index.ts:7913, 7965, 8000, 8068, 8140, 8235,
  8281`), so only a real mutation reaches the `redo_stacks` clear at
  `holonovel/src/core/state.ts:1932`. Exercised by T10
  (`holonovel/scripts/test-persistence-guardrails.ts:130-174`: five refusal
  entries across REQ-435/436/440/442 plus unknown-op entry absence) and T121
  (`holonovel/scripts/test-backfill.ts:364-374`). REQ-041a, REQ-041b,
  REQ-116, REQ-435, REQ-436, REQ-440, REQ-442.

### 2026-11-10 §5.16/§5.17 ruleset surface remediation

- **F-P6b-9 — listing annotation, per-ruleset health, and prefix map
  (resolved 2026-11-10):** every listed tool reports its scope via
  `annotateRulesetScope` (`holonovel/src/index.ts:1981-1991`); `scope=all`
  marks mismatched tools `_meta.inapplicable`; `buildRulesetHealthSections`
  (`:12275`) plus the `combined` summary and Player filter are in
  `spec_health.ruleset_health` (`:12488`); the prefix map is recorded in
  `holonovel/DECISIONS.md` and reported for every badge inside `combined`.
  Exercised by T440 and T444 in `test:ruleset-surface-remediation`.
  REQ-379b, REQ-379c, REQ-381b, REQ-381c, REQ-382b, REQ-382c, REQ-383a,
  REQ-383b.
- **F-P6b-9a — `ruleset://` resource absent (resolved 2026-11-10):** split
  from F-P6b-9 because its governing REQs are REQ-012/REQ-214a, not
  REQ-389c. The `ruleset-entry` template
  (`holonovel/src/index.ts:12812-12829`) resolves an index entry by id or
  anchor; `test:selection` T688 now reads the pointer that truncation
  prints. REQ-012, REQ-214a.
- **F-P6b-10 — identity, import/export, switching, and codex ruleset gaps
  (resolved 2026-11-10):** `bindNovelRuleset` refuses mechanics-derived state
  (`holonovel/src/core/state.ts:1286-1303`); switch audits both endpoints
  (`holonovel/src/index.ts:11055-11062`); archive import validates the
  incoming slug (`:11177-11185`); export names `ruleset` in its manifest
  (`:11131`); `CodexEntry.ruleset` defaults on set/capture, filters list, and
  refuses a cross-ruleset import (`:13850`, `:13913`, `:14063`). Exercised by
  T441/T451, T445, T447, and T448. REQ-380c, REQ-384b, REQ-384c, REQ-386a,
  REQ-386b, REQ-387a, REQ-387b.
- **F-P6b-11 — `run_command (action: suggest)` ignores the ruleset model
  (resolved 2026-11-10):** a matched intent emits prefixed package tools
  (`holonovel/src/index.ts:4834-4852`); parser suggestions stay
  infrastructure and prose remains the no-match fallback. Exercised by T446.
  REQ-385a, REQ-385b.
- **F-P6b-12 — metrics, budget, license, and registry gaps (resolved
  2026-11-10):** `spec_health.ruleset_index_bytes` reads the install
  directory without hydrating (`holonovel/src/rulesets.ts:638-649`,
  `holonovel/src/index.ts:12485`); `RULESET_PACKAGE_TOOL_BUDGET` is enforced
  at load (`rulesets.ts:607-611`) and by the package gate
  (`scripts/check-ruleset-package.ts:59-63`); `APPENDIX_U_LICENSES` equals
  Appendix U's license column (`rulesets.ts:51-61`, parity asserted by
  `test:ruleset-gates`); the registry records `source_license`
  (`scripts/lib/ruleset-registry.ts:31`) and `build-ruleset` accepts
  `--license=` (`scripts/build-ruleset.ts:139-143`). REQ-421's recipe-role
  clause already holds (`sources[{path, role}]`); its supplement-provenance
  half remains tracked by F-P6b-15. REQ-390b, REQ-430, REQ-432a, REQ-432b.
- **F-P6b-16 — runtime-installed packages register no tools (resolved
  2026-11-10):** `registerPackageTools`/`registerPackageResources`
  (`holonovel/src/index.ts:2320-2381`) run at startup and from
  `manage_ruleset (action: install)`, rolling the package back on a
  registration failure; removal stays an installed-package filter. Exercised
  by T453 and T454 in `test:output-contracts`. REQ-389c, REQ-558.
- **F-P6b-20 — `tools/list` never paginates (resolved 2026-11-10):** an
  over-cap listing slices at a tool boundary and returns a scope/profile/
  group-bound `nextCursor`; an unknown cursor is `[INVALID_INPUT]`
  (`holonovel/src/index.ts:15360-15385`). Exercised by T458. REQ-391c.

- **F-P7a-1 — seed-conflict warning (resolved 2026-11-10):**
  `seedConflictWarning` (`holonovel/src/core/rng.ts:60-66`) emits
  `[WARNING] [seed-conflict] …` when a per-call seed is supplied while
  `TTRPG_SEED` is set, and the per-call seed wins for that draw. Rendered at
  the oracle, combat-init, character-create, Fate, Ironsworn, Forged, ruleset
  roll, generation-table, and world-generate sites
  (`holonovel/src/index.ts:2893-2906`). Exercised by `test:backfill` T27 and
  T111, and by `test:competitive-gaps` REQ-050a cases (`:461`, `:502`).
  REQ-050a.
- **F-P7a-2 — REQ-055 family evidence and the resume notice (resolved
  2026-11-10):** T31 and T108 are implemented in
  `holonovel/scripts/test-persistence.ts:761-830`; `applyEnvBadge`
  (`holonovel/src/core/state.ts:1327-1336`) applies `TTRPG_BADGE` to a Novel
  with no active badge on resume and switch, and the resume response names the
  effective badge (`holonovel/src/index.ts:10825`). REQ-055, REQ-055a,
  REQ-055b.
- **F-P7a-3 — REQ-052 path containment (resolved 2026-11-10):** REQ-052 now
  cites T739, whose case submits `../../etc/passwd` and asserts
  `[ERROR] [INVALID_INPUT]` plus "outside the exchange inbox"
  (`holonovel/scripts/test-artifact-registry.ts:147-151`). The T20 case is
  retitled to the contract it asserts
  (`holonovel/scripts/test-backfill.ts:606`). REQ-052.

### 2026-11-09 §5.2/§5.8 behaviour remediation — table classification

- **F-P7b-9 — generation tables are advertised from the ruleset model (resolved
  2026-11-09):** the badge-filtered `tools/list` wrapper patches
  `resolve_mechanic.inputSchema.properties.table` with the active Novel's
  generation-table names, and keeps the permissive string for a zero-table
  ruleset (`holonovel/src/index.ts:14890-14912`); the roll handler refuses a
  lookup name with `[NOT_FOUND]` and returns the "No random generation tables"
  message when the domain is empty (`:11524-11536`). Exercised by
  `test:backfill` T255 and T255b with seeded ruleset packages — the D&D 5e
  build clause is exercised by fixture substitution because no 5e package
  exists in-tree (F-P6b-7). (REQ-214a, REQ-214b, REQ-214c)

### 2026-11-09 §5.2/§5.8 behaviour remediation — scenes and suggestions

- **F-P7b-4 — the scene catalog is open and every type contributes actions
  (resolved 2026-11-09):** `manage_scene.scene_type` accepts a string or array
  of strings and validates against `resolvedSceneTypes` — the default four plus
  `model.scene_types` — refusing unknown values with `[NOT_FOUND]` and the
  catalog (`holonovel/src/index.ts:6276-6283`, `:6348-6357`); the Available
  Actions composer evaluates each active family independently instead of
  `else if` (`:2344-2381`). Exercised by `test:backfill` T135, T71.
  (REQ-087a, REQ-087b, REQ-087c, REQ-125a, REQ-125b)
- **F-P7b-6 — suggestions and capability gating (resolved 2026-11-09):** a
  non-empty intent that matches no domain returns `[OK] No matching actions
  for "<intent>".` instead of the spatial fallback (`index.ts:4703-4710`), and
  Available Actions lists `Cast <spell>` only while
  `entity.stats.spell_slots[level] > 0` (`:2376-2383`) with `spells` settable
  through `manage_character (action: update)` (`:4001`, `:4224`). Exercised by
  `test:backfill` T359, T68. (REQ-084a1, REQ-084a2, REQ-084a3, REQ-084b1,
  REQ-084b2, REQ-084b3, REQ-084b4)

### 2026-11-09 §5.2/§5.8 behaviour remediation — synthesis

- **F-P7b-3 — synthesis provenance, confidence, and adventure surfacing
  (resolved 2026-11-09):** every synthesis row and `synthesis://` resource now
  carries per-item `collected_at` from the manifest timestamp
  (`holonovel/src/index.ts:13752-13765`, `:13144-13154`); `run` merges
  Novel-derived items — a MEDIUM `[supplementary]` voice example per
  entity/NPC with an explicit voice or description and a LOW theme item from
  the story journal (`mergeNovelDerivedSynthesis`, `:12962-12990`); LOW items
  render after HIGH/MEDIUM (`:14186-14190`); adventure load reports active and
  inert synthesis counts (`adventureSynthesisLines`, `:12946-12960`). The
  Appendix F T63 row is corrected to REQ-080g2's tier split. Exercised by
  `test:backfill` T63, T95, T97, T102, T288. (REQ-080g2, REQ-103a-d,
  REQ-130a-c)
- **F-P7b-7 — confidence tiers and removal (resolved 2026-11-09):** T324
  (reversion, idempotence, Player refusal) and T325 (MEDIUM from explicit
  fields, LOW from inference, `collected_at` refresh) both pass in
  `test:backfill`; the confidence values come from
  `mergeNovelDerivedSynthesis`. (REQ-265a-c, REQ-266a-b)

### 2026-11-09 §5.2/§5.8 behaviour remediation — journal, lore, secrets

- **F-P7b-1 — story journal now records entity attribution (resolved
  2026-11-09):** `manage_story (action: record)` wrote `entity_ids: []`
  unconditionally. It now records the active entity (else the present party) at
  `holonovel/src/index.ts:8106`, and `story_journal` joins
  `APPEND_ONLY_STATE_FIELDS` so undo cannot reverse entries
  (`holonovel/src/core/state.ts:3031-3038`). Recap carries the last ten entries
  (`index.ts:9874`). Exercised by `test:output-contracts` T282.
  (REQ-246a, REQ-246b1, REQ-246b2)
- **F-P7b-2 — lore briefing surface, groups, budget, and suggestion rows
  (resolved 2026-11-09):** `composeLoreSection` renders triggered entries for
  every badge with keyword, sticky (REQ-155a), and world-target activation,
  priority ordering, `[world]` tags, presence gating for non-GM badges
  (REQ-083f), and a `TTRPG_MAX_LORE_TOKENS` budget reported as
  `spec_health.lore_budget` (`index.ts:911-930`, render at `:14510`).
  `lore://groups` is registered (`index.ts:13090-13096`), and
  `manage_lore (action: suggest)` returns up to five rows carrying key, preview,
  triggers, confidence, source_url, and badge_scope (`index.ts:7074-7110`).
  Exercised by `test:narrative` T67, T79, T81, T82, T83. (REQ-083c)
- **F-P7b-5 — the character sheet renders known information (resolved
  2026-11-09):** `fmtEntitySheet` appends a `### Known Information` section and
  `entitySheetJson` carries `known_information`; both read
  `knownInformationFor` (`index.ts:3178-3212`, `:3344-3359`). Exercised by
  `test:narrative` T274. (REQ-234a, REQ-234b, REQ-234c, REQ-234d)

### 2026-11-09 §5.2/§5.8 assertion repair (F-P7b-8)

- **F-P7b-8 — prompt-ordering citations leaned on a builder-side test
  (resolved 2026-11-09):** REQ-082c cited `T66, T205` while REQ-082a/082b cited
  nothing, so the runtime ordering contract rested on T205's DECISIONS.md
  section-token assertion (`spec/appendices-reference.md:1605`). The citations
  now split by contract: REQ-082a and REQ-082c cite `T66` (the exercised server
  ordering assertion, `holonovel/scripts/test-backfill.ts:811`), and REQ-082b
  cites `T205`, which asserts the builder-side mapping and default ordering that
  REQ-082b actually states (`spec/02-requirements.md:2607,2610,2613`).
  REQ-082a, REQ-082b, REQ-082c.

### 2026-11-09 server-note narrative coupling (P1 remediation)

- **F-P8-1 — server-note narrative coupling is stored but never surfaced
  (resolved 2026-11-09):** `manage_note (action: set_server)` stored a
  `narrative_tag` and `server-notes://` served it, but the briefing builder
  never read `state.serverNotes`, so REQ-365a's briefing surface did not exist.
  The builder now emits a `### Server guidance` section for entries carrying a
  tag and a non-empty body, rendered `- [<tag>] <content>` in key order, gated
  by `badge === "game_master" || badge === "none"` (predicate
  `holonovel/src/index.ts:14101`, render `:14107`); untagged notes remain
  resource-only and the Player and observer badges see none. REQ-365c is
  asserted on the Player briefing. (REQ-365a, REQ-365b, REQ-365c; exercised by
  `test:backfill` T416, widened from set/list to the briefing surface)

### 2026-11-09 full-review sweep — chunk P6b (ruleset packages and host entry points)

- **F-P6b-1 — ruleset scope was enforced in listing only (resolved 2026-11-09):**
  `holonovel/src/index.ts:1820-1836` gated retired aliases and the surface
  profile but never compared a call's package prefix to the active Novel's
  ruleset, so a foreign-ruleset tool stayed callable. `guardToolCall` now
  refuses with `[ERROR] [INVALID_INPUT]` naming both scopes
  (`index.ts:1832-1846`); asserted by `test:ruleset-surface-remediation`.
  REQ-381a, REQ-380c, REQ-384a.
- **F-P6b-2 — `manage_ruleset (action: list)` hydrated every package (resolved
  2026-11-09):** `index.ts:11280` called `hydrate` and then reported
  `isHydrated`, so every installed package read `loaded` and the read-only
  action inflated `rulesets_hydrated`. The list is built from the non-hydrating
  `manifests()` accessor (`index.ts:11276-11300`); asserted by
  `test:ruleset-surface-remediation`. REQ-389c, REQ-390.
- **F-P6b-3 — removed package tools stayed live (resolved 2026-11-09):** the
  SDK has no unregister, so `tools/list`/`engine.tools.list` filtered only by
  installed slugs (`index.ts:1447-1455, 1453`) and a removed package's tools
  remained. Visibility now filters registered package prefixes
  (`index.ts:1712, 14600`); asserted by `test:ruleset-surface-remediation`.
  REQ-389c.
- **F-P6b-4 — imported/restored state could change a Novel's ruleset (resolved
  2026-11-09):** `holonovel/src/core/state.ts:3067` copied every serialized key,
  so an import or checkpoint restore could replace `ruleset` silently.
  `applyNovelState` now always preserves `ruleset` (`state.ts:3066`); asserted
  by `test:ruleset-surface-remediation`. REQ-380a.
- **F-P6b-5 — content-hash rejections never reached `spec_health` (resolved
  2026-11-09):** `holonovel/src/rulesets.ts:504-508` threw on a hash mismatch,
  but the `[load-rejected]` channel read a list that was always empty.
  `RulesetManager.recordLoadFailure` now records the failure
  (`rulesets.ts:449-460`) and `spec_health.ruleset_package_alerts` merges it
  (`index.ts:11971-11976`); asserted by `test:ruleset-surface-remediation`.
  REQ-389b, REQ-390a.
- **F-P6b-6 — malformed Fate notation escaped the handler (resolved
  2026-11-09):** `index.ts:7519` called `rollDice` unguarded, so `dice: "x"`
  threw instead of refusing. The call is now wrapped and returns
  `[ERROR] [INVALID_INPUT]` (`index.ts:7519-7527`); asserted by
  `test:ruleset-surface-remediation`. REQ-002, REQ-434.

### 2026-11-09 full-review sweep — chunk P6a (world model and the adapter seam)

- **F-P6a-1 — `update_thing fixed` wrote a non-existent field (resolved 2026-11-09):**
  `index.ts:5254` assigned `thing.fixed`; `WorldThing` stores `portable`
  (`world/model.ts:193`), so a GM marking a thing fixed left it takeable.
  Fixed at `index.ts:5258` (`thing.portable = !args.fixed`), asserted by
  `test:world-remediation` (REQ-198, REQ-200).
- **F-P6a-2 — room description modes were inert (resolved 2026-11-09):**
  `roomDescriptionMode` (`index.ts:1862`) was set by `brief`/`verbose`/`normal`
  but read nowhere; `handleLook` always emitted the full body. Fixed in
  `world/parser.ts:247-285` (mode + session seen-set), wired at `index.ts:4699`,
  asserted by `test:world-remediation` (REQ-197b).
- **F-P6a-3 — container placement bound the room, not the container (resolved
  2026-11-09):** `world/model.ts:683` set `locationType = "room"` for
  `It is in <container>.`, so converted contents were unreachable even when the
  container was open. Fixed at `world/model.ts:683-699` (resolve the parent by
  bare name), asserted by `test:world-remediation` (REQ-199, REQ-200).
- **F-P6a-4 — NPC location update did not re-register the NPC (resolved
  2026-11-09):** `index.ts:6509` set `npc.location` without updating `room_id`,
  which briefing and graph reads use. Fixed at `index.ts:6509-6517`
  (REQ-327a; no new assertion — the create path is covered by the starter
  harness).
- **F-P6a-5 — scene identity was not carried on the resource (resolved
  2026-11-09):** `scene://current` (`index.ts:12304`) omitted the resolved room,
  and `manage_scene` matched locations by prefix only. Fixed at
  `index.ts:12304-12316` (`room_id`/`room_name`) and `:6241-6250` (substring
  match, closest-length tie-break) (REQ-326a, REQ-326b).
- **F-P6a-6 — the parser catalog leaked to the Player badge (resolved
  2026-11-09):** the `help`/`verbs` branch (`index.ts:4591`) returned the catalog
  before the ruleset-bound badge gate at `:4610`. Fixed with an explicit guard
  in the branch (`index.ts:4591-4598`) (REQ-196a, REQ-309b).

### 2026-11-09 full-review sweep — chunk P5 (engine loop, event stream, agent tasks)

- **F-P5-1 — a branch slice shared its `alternatives` array with the source (resolved 2026-11-09):**
  `sliceThrough` mapped each entry with a shallow spread, so a branch that
  superseded an entry pushed into the parent's (and siblings') array; a live
  import probe produced parent `alternatives: [2,2]`, violating REQ-458's
  "parent Novel SHALL remain unmodified" and REQ-459's isolation clause.
  Predicate: `holonovel/src/core/event-log.ts:75-78` (pre-fix). Fix clones the
  array in `event-log.ts:75-86`; the new `T548` unit assertion in
  `test-event-log.ts` covers it.
- **F-P5-2 — the supersede path omitted the projection version (resolved 2026-11-09):**
  `manage_diagnostics (action: event, supersede)` set `state_hash` but not
  `state_hash_projection`, so verify counted a freshly written entry as
  historical; REQ-602 requires the hash "together with the projection version
  in force". Predicate: `holonovel/src/index.ts:9541` (pre-fix) against
  `recordEvent` at `:2434`. Fixed at `index.ts:9541-9543`; `T547` asserts
  `historical event hashes: 0`.
- **F-P5-3 — history returned requested ordinals in request order (resolved 2026-11-09):**
  `history` with `ordinals` mapped `traverse` output in the caller's order, not
  ordinal order as REQ-456 requires. Predicate: `holonovel/src/index.ts:9562`
  (pre-fix). Fixed at `index.ts:9562-9563` (sort by ordinal); `T546` asserts
  `[3,1]` returns `#1` before `#3` and covers the capped-eviction marker.
- **F-P5-4 — Observer reads of agent tasks were refused (resolved 2026-11-09):**
  `manage_agent` list/get called `requireNotObserver`, which refuses the
  Observer, while REQ-530 says task reads are available to every badge and "the
  Observer SHALL read without mutating". Predicate:
  `holonovel/src/index.ts:9046,9056` (pre-fix). Fixed at `index.ts:9045-9077`;
  `T613` now asserts Observer list/get succeed while create is refused.

### 2026-11-09 full-review sweep — chunk P4 (persistence and §5.19)

- **F-P4-1 — archiving the active Novel was accepted (resolved 2026-11-09):**
  `manage_archive (action: archive)` cleared `activeNovelId` and archived the
  Novel the caller was playing, while REQ-334a requires `[STATE_CONFLICT]` when
  the target is the process's active Novel. Predicate: `holonovel/src/index.ts:10885`
  (pre-fix) and the wrong expectation encoded in `test-persistence.ts:421`.
  Fix at `index.ts:10883-10892`: the handler refuses with a corrective action;
  T381 asserts the refusal, switches away, then archives.

### 2026-11-09 full-review sweep — chunk P3b-1 (§5.6 core state and lifecycle)

- **F-P3B1-1 — `audit://novel` was truncated JSON, unfiltered (resolved):** the
  resource returned `novel.audit_log.slice(-50)` as JSON, with no badge filter
  and `"[]"` when no Novel was active — REQ-168a requires the full log as
  Markdown, one entry per line, badge-filtered, and REQ-168b requires
  `[ERROR] [STATE_CONFLICT]`. Predicate: `holonovel/src/index.ts:12447`
  (pre-fix); T203 asserted only that `create_novel` appeared. Fix at `:12442-12458`:
  Markdown lines `timestamp | badge | tool | output_prefix | hash | args`,
  Player/Observer filter by badge or active-entity reference, no-Novel error.
  The `withForbiddenAudit` wrapper now records `getBadge()` instead of the
  undefined `ctx.badge` (`core/server.ts:66-73`), so boundary entries carry the
  active badge. T203 asserts format, filter, state-query absence, boundary
  prefix, boundary badge, and the no-Novel error; `test-security` and
  `test-artifact-registry` parse the Markdown resource.
- **F-P3B1-2 — combat refusals named a tool that does not exist (resolved):**
  the init guard and the navigation block said `end_combat`; REQ-203/REQ-221a
  quote `manage_combat (action: end)`. Predicate: `index.ts:5708` and `:4636`
  (pre-fix). Fix: both messages corrected; T246/T263 assert the quoted action.

### 2026-11-12 execution findings

Scheduled under `ROADMAP.md` § *Cross-badge undo stack access (P1)*.

- **F-P3B1-10 — undo cannot reach another badge's mutation (2026-11-12):**
  `StateManager.snapshot` pushes under `getBadge()` and `undo`/`redo` select
  `novel.undo_stacks[stackKey]` by the current badge
  (`holonovel/src/core/state.ts:2104-2116`), so a mutation made under one badge
  is absent from another badge's stack and an undo there returns
  `[STATE_CONFLICT]` — REQ-041a requires that "an undo in the Player badge
  reverses the most recent mutation regardless of which badge initiated it"
  (`spec/02-requirements.md:1473`). Found during the §5.6 audit/condition/vow
  increment while writing T8. REQ-041a.

### 2026-11-09 full-review sweep — chunk P3 (§5.4 decision workflows)

- **F-P3-1 — structured decision options were mangled (resolved):**
  `parseDecisionOptions` matched the first `**id** — label` line and returned it
  as both `value` and `label`, dropped every later option, and never emitted a
  kebab value, a distinct display label, the free-text entry, `cancel`, or the
  25-entry cap REQ-042b/REQ-191/REQ-548d require. Predicate:
  `holonovel/src/index.ts:2566-2570` (pre-fix). Fix at `:2566-2608`; T32/REQ-548d
  (`scripts/test-workflow.ts`) and T635 (`scripts/test-lean-narrator.ts`) now
  assert value/label pairs, cancel-last, unique values, and the cap.
- **F-P3-2 — step-by-step creation discarded the equipment answer (resolved):**
  the `equipment` step wrote `wf.answers.equipment` (`index.ts:3480`) but the
  completion build omitted the field, so the player's choice was replaced by
  class defaults. Predicate: `index.ts:3512-3521` (pre-fix). Fix: the build now
  passes `equipment: wf.answers.equipment ?? []` (REQ-152a).
- **F-P3-3 — partial drain cleared the workflow before the state change
  (resolved):** `pending_workflow` was nulled before the character-creation
  class-validation error (`index.ts:3488` then `:3504`) and before the
  world-generate missing-payload error (`:3378`), leaving the workflow drained and
  the state unchanged — the defect REQ-190 names. Predicate: those lines
  (pre-fix). Fix: the field is cleared only after validation succeeds; error
  paths keep the workflow open and say so in the corrective action.
- **F-P3-4 — holosuite evidence anchors were stale, so the suite was red
  (resolved):** 19 `anchor(path, line, symbol)` predicates in
  `holonovel/scripts/lib/holosuite-*.ts` no longer contained their symbol at the
  recorded line (`index.ts:2589#err`, `state.ts:2465#saveNovel`,
  `index.ts:9606#recap`, and 16 more; six were stale but unattached to a
  finding). Predicate: `holonovel/src/index.ts:2589` vs
  `holosuite-conformance.ts:37`; `holonovel/src/core/state.ts:2465` vs
  `holosuite-differential.ts:25`. Fix: all 19 repointed by nearest
  symbol-bearing line; `npm --prefix holonovel run test:all` 54/54.

### 2026-11-09 seam-drift remediation (REQ-030, REQ-088, REQ-092, REQ-095, REQ-238, REQ-240, REQ-256, REQ-334, REQ-401–REQ-406, REQ-613)

- **F1 — `[session-no-mutations]` absent from `spec_health` (resolved):**
  `buildSpecHealth` now emits a GM-gated `state_health` block whose `markers`
  array carries the string, and T471 asserts it. Predicate:
  `holonovel/src/index.ts:11938` (`state_health`), `state.ts` `NovelState.session_no_mutation_windows`.
- **F2a — drift was unreachable (resolved):** `save_context` set
  `gm_context.saved_at` and then `recordMutation` advanced `last_mutation_at`
  to the same instant, so `saved_at > last_mutation_at` never held. Context
  saves now go through `recordContextSave`, which counts the `context` group
  without advancing the clock, and `stateDriftActive` treats a Novel with no
  recorded story-state mutation as drifting. Predicate:
  `holonovel/src/core/state.ts` `recordContextSave`, `stateDriftActive`;
  `holonovel/src/index.ts:10987`.
- **F2b — `TTRPG_STATE_GATE=warn` had no effect (resolved):** recap, `switch`,
  and `end` now append the drift warning under `warn`; the block message no
  longer advises `save_context`, which cannot clear drift. Predicates:
  `index.ts:9712`, `:10536`, `:10555`.
- **F2c / F3 — `[state-drift]`, `[state-regression]` absent from `spec_health` (resolved):**
  both are emitted in `state_health.markers`; T472 and T475 assert the strings
  and the regression audit gap. Predicate: `index.ts:11938`.
- **F4 — REQ-403b listed `save_context` in block mode (resolved):** the REQ and
  T472 now name `end` and `switch` only, matching the handler at
  `index.ts:10542`/`:10563`. Predicate: `spec/02-requirements.md` REQ-403b.
- **F5 — per-connection Novel claim contradicted the code (resolved):**
  REQ-030, REQ-088a/c/d, REQ-095a/b, REQ-240b, REQ-256a, REQ-334a, and T98 now
  describe the process-global `activeNovelId` (`state.ts:989`).
- **F6 — engine-contract citations pointed at unrelated code (resolved):**
  `docs/engine-contract.md:59,124,179,202` now cite the artifact writes,
  verify/replay, `backupCandidates`, and the export/import audit sites.
- **F7 — §5.9 hardcoded install-relative save paths (resolved):** eight
  occurrences now read `<DATA_DIR>/…`; REQ-092f's legacy v1 JSONL path is
  preserved by design (REQ-613 keeps an existing legacy directory).

### 2026-11-08 server coherence remediation (REQ-429, REQ-554, REQ-581)

- **F1 — canonical tools marked deprecated (resolved):** `manage_world`,
  `manage_scene`, `manage_lore`, and `manage_novel` are listed tools that
  still own canonical actions, so their `_meta.deprecated` was removed;
  `manage_session` remains a hidden tombstone. Predicate:
  `holonovel/src/index.ts` `registerTool` blocks for those four tools.
- **F2 — stale split-action prose (resolved):** `manage_novel`'s description
  claimed export/import/archive actions remained callable; the sentence is
  removed, and the four originals no longer point back at their split tools.
  Predicate: `holonovel/src/index.ts` `manage_novel` description.
- **F3 — knowledge cluster had no recorded axes (resolved):**
  `manage_note`, `manage_codex`, and `manage_synthesis` now carry axes, and
  `tool-disambiguation.json` declares the seven-member `knowledge` cluster
  that the lint requires. Predicate: `holonovel/tool-disambiguation.json`
  `clusters.knowledge` and `axes`.
- **F4 — world model had no read action (resolved):**
  `manage_world (action: list|get)` enumerates rooms/things/exits and returns
  one record by id under `requireGM()`. Predicate:
  `holonovel/src/index.ts` `MANAGE_WORLD_SCHEMA` and the `list`/`get` cases.
- **F5 — uneven undo coverage (resolved):** Novel-scoped notes, corpus access
  mutations, and causal mutations now take a `novelSnapshot()`; server notes
  and corpus consumption stay explicit exceptions. Predicate:
  `holonovel/src/index.ts` `novelSnapshot()` calls in those handlers.
- **F6 — multiplexing hidden by `manage_*` names (resolved as far as the
  naming convention allows):** the eight widest tools carry an action-span
  suffix in their title, and their descriptions name the retained action
  span. Predicate: `holonovel/src/index.ts` titles for `manage_belief`,
  `manage_lore`, `manage_synthesis`, `manage_novel`, `manage_character`,
  `manage_diagnostics`, `manage_knowledge`, and `manage_archive`.
- **F7 — tool count and naming remain structural (closed-P3):** the surface
  stays at 37 tools; merging unrelated domains would raise multiplexing, so
  the decision is recorded in DECISIONS.md D1. Predicate:
  `holonovel/DECISIONS.md` "Server coherence remediation — 2026-11-08".

### 2026-11-08 survivor race clock (REQ-233)

- **Survivor race is descriptive (resolved):** the roadmap decision is made —
  The Survivors carry goals, resources, and territory, and no numeric clock, so
  the race stays narration. The generic mechanism it exposed is now real:
  `advanceFactionClock` is the single writer, a scene transition ticks every
  clocked faction, a create with goals auto-creates a Game Master-only
  `clock_type: faction` countdown, a fill rotates `status` to the next goal and
  surfaces a `[WARNING]` in `spec_health`, and a Player read of `faction://`,
  `factions://`, or `manage_faction (action: list)` is a GM-filtered projection.
  T269 and T388 assert it. Predicate: `holonovel/src/index.ts`
  `advanceFactionClock`; `holonovel/content/torre-nosferatu.source.json`
  `factions[0]`.

### 2026-11-08 roadmap clearance (P1, P2)

- **Story-beat previews cut at 60 chars (resolved):** `firstSentence()` replaces
  the `substring(0, 60)` cut at the beat transition, and the four starter
  previews are authored first sentences; T387/REQ-337 and the starter harness
  assert it. Predicate: `holonovel/src/index.ts` `firstSentence` /
  `recordBeatTransition`.
- **`Your Candle` flagged wearable (resolved):** `wearable` is `false` on the
  candle and the starter harness asserts no authored thing is wearable.
  Predicate: `holonovel/content/torre-nosferatu.source.json`
  `world.things["your candle"]`.
- **NPC identity facets invisible in normal play (resolved):** REQ-649 makes
  the Game Master's `manage_npc (action: get)` and the present-NPC briefing
  block render the compiled identity summary; the Player badge stays free of
  it. T772 asserts it. Predicate: `holonovel/src/index.ts` `npcIdentitySummary`.

### 2026-11-08 Torre knowledge depth

- **Player-facing knowledge is ten pages (resolved):** the starter carries ten
  readable `Page — …` fragments, at least one per floor; `the tower's origin`,
  `the bargain`, and `the matches` join the seven. Predicate:
  `holonovel/content/torre-nosferatu.source.json` `world.things`; asserted by
  `test:starter-novel` and the Holosuite novel tier's `things` pin (REQ-565).

### 2026-11-08 review remediation (CR-1..CR-22)

- **CR-1 — Player open memory omitted the claim (resolved):** `index.ts`
  `composeSubjectiveMemorySection` now appends `(claims: …)` for an `open`
  record; T755 asserts it. Predicate: `holonovel/src/index.ts` `composeSubjectiveMemorySection`.
- **CR-2 — Markers changed selection/order (resolved):** the renderer returns
  `{ text, suffix }`, cost is measured on `text`, and the suffix is appended after
  admission; T768 proves it. Predicate: `holonovel/src/core/subjective.ts` `assembleMemorySection`.
- **CR-3 — False outcome evaluated after displaced (resolved):** `checkRecord`
  checks an opposite-polarity fact before the displaced fallback; T749 covers the
  precedence. Predicate: `holonovel/src/core/divergence.ts` `checkRecord`.
- **CR-4 — Consolidation summaries dropped by the campaign cap (resolved):**
  `deriveCampaignTier` reserves fact slots for summaries. Predicate:
  `holonovel/src/core/memory.ts` `deriveCampaignTier`.
- **CR-5 — Undo/restore dropped a fold (resolved):** `applyNovelState` preserves
  `compression_ladder.entities` on `"undo"`; T769 asserts the recap after undo.
  Predicate: `holonovel/src/core/state.ts` `applyNovelState`.
- **CR-6 — Scan matrix contradicted REQ-599b (resolved):** the matrix is now
  `guarded` owner claim+affect, non-owner gist+claim, `secret` gist+claim; REQ-599b
  is amended; T757 covers the secret-affect exemption. Predicate:
  `holonovel/src/core/subjective.ts` `disclosureScanTargets`.
- **CR-7 — Branch kept future memories (resolved):** `branch` filters records
  after the branch point; REQ-458 is amended; T746 covers it. Predicate:
  `holonovel/src/index.ts` `branch`.
- **CR-8 — Budget admitted the first record over the ceiling (resolved):**
  `assembleMemorySection` enforces the budget on every record; T767 covers it.
- **CR-9 — Raw `parseInt(process.env)` (resolved):** the three bounds use
  `configInt`. Predicate: `holonovel/src/index.ts` `handleSubjectiveActions`.
- **CR-10 — Renderer ordered class before catalog (resolved):** global
  `KIND_INDEX` sort with class as a tie-break; T758 covers a structural `name`
  fact. Predicate: `holonovel/src/core/identity.ts` `renderWhoTheyAre`.
- **CR-11 — Load accepted out-of-range valence / off-kind false belief
  (resolved):** `normalizeFacetAttributes` clamps and clears; T761 covers it.
- **CR-12 — Lexicon superset and substring matching (resolved):** the cue table
  matches Appendix O.13, whole-token matching; T749 covers `unsafe`/`wonder`.
- **CR-13 — Ordinal accepted floats/negatives (resolved):** the schema is
  `int().min(0)` and the handler re-validates.
- **CR-14 — `compileKernel` spread a possibly-undefined `contradicts`
  (resolved):** defensive `?? []` at every copy.
- **CR-15 — Alias index rebuilt per record (resolved):** `buildAliases` is
  exported and passed through `checkRecord`/`recordedValence`; performance-only,
  no gate (Closed-P3 for a regression test).
- **CR-16 — Orphan memory from a typo (resolved):** `resolveMemoryEntity`
  resolves id or name and refuses an unresolved entity; T743 covers it.
- **CR-17 — `0` semantics undocumented (resolved):** §7.6 rows 216–217 say
  `0 = unlimited`.
- **CR-18 — §7.7.0/enumerations omitted subjective memory (resolved):** §7.7.0
  gains the class-contract paragraph; REQ-240a/241a/334b name it.
- **CR-19 — Recall floor hardcoded (resolved):** `test-memory-recall` reads the
  O.12 floor from the assembled spec copy and fails when it is absent.
- **CR-20 — Legacy records had no id (resolved):** `normalizeSubjectiveRecord`
  assigns `sm-legacy-<n>` deterministically.
- **CR-21 — License-doc prose mangled (resolved):** the license-compliance
  plan/tasks/AAR are grammatical and the purge evidence points at the recorded
  bundle manifest. Predicate: `docs/plans/2026-11-08-license-compliance/plan.md`.
- **CR-22 — 18/23 Holosuite anchors stale; gate skipped record predicates
  (resolved):** anchors are re-pointed and `unresolvedPredicates` validates every
  recorded event; `test-holosuite-evidence` covers the failure path. Predicate:
  `holonovel/scripts/lib/eval-predicate.ts` `unresolvedPredicates`.

- **Lore `visibility` is specified and now implemented (resolved 2026-11-07):**
  `LoreEntry` now carries `visibility` (`gm_only`/`shared`/`player_discovered`)
  and `known_by`; `manage_lore` accepts `visibility`, reveal marks a lore entry
  `player_discovered`, and read gating plus the REQ-083f presence gate cover
  `badge_briefing`, `lore://active`, `lore://{key}`, `graph://novel`, list/get,
  narrator clearance, player-safe export, campaign memory, and the draft scan.
  T342 exercises the lifecycle, read gate, reveal, and presence gate; the
  ROADMAP entry is removed. (REQ-083d–REQ-083f; predicate
  `holonovel/src/core/state.ts:LoreEntry`.)

- **Adventure-module hazard annotations were counted, never materialized
  (resolved 2026-11-07):** `convertSource` swallowed `@encounter`/`@trap`
  directives, left `annotations.encounter`/`.trap` empty, and reported a zeroed
  linked-annotation count; the load read only the `## World` block, so directives
  under `## Encounters`/`## Traps` were never seen. Directives now carry a
  `key=value` clause (Appendix K), materialize on the world that survives the
  load in all three load branches, and warn `annotation not materialized` when
  malformed instead of staying silent. (REQ-079a, REQ-622; predicate
  `holonovel/src/world/model.ts:applyAnnotationLine`; exercised by the new
  adventure-load and convert assertions.)

- **Generic hazard-model implementation drift (resolved 2026-10-31):** the
  reference server read `annotations.trap = "snuff=Dread;avoid=0"` and hardcoded
  the candle/match/wax names. Rooms now carry structured `encounter`/`trap`
  annotations naming a survival resource; the resource's own `survival`
  annotation declares the bundle increment, per-use decrement, last-light
  ticks, and the light/unit bindings. Legacy string annotations coerce with a
  `[WARNING]`. (REQ-622, REQ-622a–c; predicate
  `holonovel/src/core/hazard.ts:104`; exercised by T741/T742.)

- **Adventure load with an empty `## World` section replaces the Novel world —
  resolved 2026-10-30:** `manage_adventure (action: load)` now keeps the
  existing world when the module's World section converts to zero rooms,
  emits `[WARNING] [world-preserved]`, and audits `preserved: true`
  (`holonovel/src/index.ts:8998`). Regression test T741/REQ-090 creates a room,
  loads a prose-only World module, and asserts the room survives. Demonstrated
  2026-10-30 by the Holosuite Understudies run (85 rooms / 35 things → 0 / 0);
  ROADMAP entry removed on ship. (REQ-090; predicate
  `holonovel/src/index.ts:8998`)
- **Compact default tool surface — resolved 2026-10-29:** the 2026-10-25 TDQS
  capture graded tool-count appropriateness 2/5 at 36 tools, and a compact
  default was worth about +0.225 overall. Closed as a product decision: keep
  the full default. The recorded replays show `small` keeps 37% of expected
  tools visible and raises mean calls to 1.826, against 1.0 and 1.196 for
  `full`; hiding capability risks the completeness dimension. Disambiguation
  and per-tool quality remain the levers. ROADMAP entry moved to Not planned;
  the 2026-10-25 compact decision stays as the build record. (REQ-429,
  REQ-554, REQ-580)

- **Recap notation and configurable bounds — resolved 2026-10-29:** REQ-072e/f/g
  declared `format`, `max_transitions`, and `max_rolls` while
  `MANAGE_SESSION_SCHEMA` and the recap/compress handlers exposed none of them
  (`holonovel/src/index.ts` schema and handler; T272 had no exercised
  evidence). The schema and canonical `manage_context` now carry all three,
  out-of-range values return `[INVALID_INPUT]` with the valid range, recap
  bounds its significant-roll and scene-transition arrays, Lonelog notation is
  available in recap and `compress`, and audit entries carry `notation`.
  Evidence: T272 in `test:output-contracts` 316/316; markdown output
  unchanged. Reopen only if a declared bound is ignored again.

- **Location-gated discovery — since-creation absence — resolved 2026-10-29:**
  discovery used only fire-time presence (`fireCountdown` read
  `characters_present_ids` directly; `scene_history` carried no attendance).
  Scene-ledger entries now snapshot presence, countdowns record a creation
  index, and eligibility scans scenes from creation through the fire
  transition. Evidence: T390 since-creation negative in `test:narrative`
  48/48; `test:persistence` round-trip. Reopen only if an entity present
  before the fire can later "discover" the event.

- **Discovered-consequence attribution — deferred-resolution variant —
  resolved 2026-10-29:** `fireCountdown` snapshotted `eligible_entity_ids` at
  fire. Pending consequences now store the creation/fire ledger bounds and
  resolve the discoverer set at the discovery transition; legacy entries keep
  the recorded eligible list. Evidence: T399 post-fire creation and
  resolution-time attribution in `test:narrative` 48/48. Reopen only if an
  entity's discoverer status is decided at fire instead of resolution.

- **State-hash bookkeeping exclusions — resolved 2026-10-29:** the canonical
  projection covered `last_mutation_at` (wall clock) and `active_session_id`
  (session identity), so identical seeded runs could not hash equally and a
  REQ-237 boundary written after a save made `verify` report divergence
  (`holonovel/src/core/state-hash.ts` exclusion list;
  `holonovel/src/core/state.ts` audit/save ordering). REQ-601 now excludes both
  fields under a versioned projection, REQ-602 tags per-event hashes with the
  projection, and REQ-603 reports older-projection digests as stale; load-time
  migration re-derives the last-save and checkpoint digests. The E3 workarounds
  (boundary flush, novel-tier strip, façade mask) are removed, and a loaded-path
  map keeps a misnamed Novel's filename across a save. Evidence:
  `test:persistence` 39/39 (misnamed retention + projection migration),
  `test:engine-facade` 7/7 with unmasked determinism, all five Holosuite tiers
  PASS, `test:all` 51/51, `check:fast` 31/31. Reopen only if two identical
  seeded runs diverge or an older-projection digest reports clean.

- **Engine contract divergences — resolved 2026-10-29:** the E2 review found six
  mismatches between `docs/engine-contract.md` and the reference implementation.
  Pacing advanced on briefing renders rather than tool calls and a prompt
  incremented the counter (`holonovel/src/index.ts:11842-11843`, `545-568`);
  returned `[FORBIDDEN]` envelopes skipped the boundary audit
  (`holonovel/src/core/server.ts:52-58`); the serializer omitted three declared
  Novel fields (`holonovel/src/core/state.ts:634-641` vs `2477-2573`); REQ-055
  claimed RNG state persisted; and both load paths dropped unknown top-level
  keys. Fixed by counting completed tool calls in the registry wrapper with a
  session-scoped counter, auditing either forbidden envelope form, emitting the
  three fields, retaining unknown fields in `future_fields`, and amending
  REQ-055 to match REQ-050c. Evidence: `test:narrative` 46/46,
  `test:security` 10/10, `test:persistence` 37/37, `check:fast` PASS. Reopen only
  if a read-only call changes the live state hash, a returned forbidden call
  leaves no boundary audit, or a save drops a declared or unknown field.

- **Packaging and distribution integrity — resolved 2026-10-26:** a packed
  audit found the published tarball omitted three runtime artifacts (the
  assembled specification, the surface registry, and the disambiguation
  record), resolved the default state directory inside the install tree
  (`holonovel/src/index.ts:80`), and documented a source-only client config
  (`README.md` install JSON, `holonovel/README.md:31-40`). The package now
  ships the spec and both records, resolves the per-OS data directory with
  legacy preservation (REQ-613), exposes the library without starting a server,
  pins production dependencies, supports Node 22+, carries CC BY attribution,
  and gates publication on a manifest check plus an isolated packed-artifact
  MCP smoke test (REQ-614). Predicates: the pre-fix `files` allowlist in
  `holonovel/package.json`, `holonovel/src/index.ts:83,1307,1393,10600`, and
  `holonovel/src/core/state.ts:50`. Evidence: `npm run test:package-smoke` →
  10 passed, 0 failed; `check-package-manifest` → PASS; `validate:fast` → 0
  errors; `test:data-dir` → 10 passed. Reopen only if a published tarball
  omits a runtime artifact or writes user data under the install directory.

- **Fingerprint-delta record and publication update evidence — resolved
  2026-10-25:** reopens and supersedes the 2026-09-26 Closed-P3 "Pipeline step-4
  flag" row with two confirmed predicates, not a message. (1) The advisory
  branch was unenforceable: `scripts/update-server.ts` reconciled the stored
  baseline at the former lines 284-286 *before* the printed `opencode run`
  command could execute (289-291), so a skipped or failed invocation was
  recorded as applied, and a `changedCount > 2` run exited 0. (2) REQ-313a and
  REQ-314b require the five component hashes and the fingerprint delta summary
  in DECISIONS.md at every build; the 2026-10-25 publication recorded neither
  (`holonovel/DECISIONS.md` Spec Update entry for `f4bc3d04…`), and no check
  implemented T497. Fixed by emitting `fingerprint-deltas.json` from
  `update-server.ts`, rendering it as the gated `**Fingerprint delta:**` bullet
  in `spec-update-record.ts`, reconciling only after a successful invocation,
  and blocking a Minor/Major delta with advanced fingerprints and no evidence
  (REQ-394a, T84e). Evidence: `test-update-workflow` 16 passed, `test-spec-tooling`
  31 passed, `check:fast` / `check` green. Reopen only if a Minor/Major delta
  with advanced fingerprints publishes without either a recorded deferral or an
  executed invocation.

- **Character-roleplay market learnings — resolved 2026-10-24:** the five
  findings from the adjacent-market research shipped. Social cast strategy and
  speaker selection (REQ-611/612, T727/T728), NPC `talkativeness` (REQ-075g,
  T723), NPC `identity_core`/`shared_notes` (REQ-075f, T722), session-boundary
  proactive beats (REQ-339e, T726), ensemble cast direction in `narrate`
  (REQ-598, T729), and Character Card V3 import/export with `persona`
  (REQ-077a/075h/075i, T724/T725). Evidence: `test:competitive-gaps` → 26
  passed, 0 failed; `npm run build-order` → 0 errors; `check-tool-surface` →
  PASS (229 actions).

- **Competitive report closeout (rev 2.3) — resolved 2026-10-24:** the
  Edition 2 competitive report's gap analysis was corrected against the spec
  and closed out. Items 1–7 are shipped or retired (REQ-075f/REQ-339d,
  REQ-433a/b, REQ-050a–c, REQ-431a–c, REQ-432 + `resolve_*`, REQ-296c,
  REQ-072a2/072h; T513–T519, T27, T111); item 8 is a stated non-goal
  (`SECURITY.md:53-59`); item 11 is delivered as
  `report://holonovel-token-footprint-benchmark-2026-10-24` (25,856 tokens /
  103,424 bytes / 36 tools, `spec/audit/performance-record.json`); item 12 is
  `SECURITY.md`. Rev 2.3 is published at
  `report://mcp-servers-similar-to-holonovel-competitive-feature-report-rev-2-3-closeout`.
  Items 9, 10, and the §13 runtime bake-off are dispositioned Closed-P3 below.
  Evidence: `holonovel/scripts/test-competitive-gaps.ts`; `check-registers`.

- **Two-week audit remediation — resolved 2026-10-24:** the 2026-10-10..10-24
  audit's code and spec findings are closed; publication (AU-3) is deferred by
  the operator. The export envelope now uses the
  REQ-601 state hash and an `audit_hash`; the Appendix M defaults and
  procedural ladders moved to §7.6 and §7.9; the validator rejects
  parenthetical numeric defaults; the recorded DECISIONS budgets are gated
  against the generated baseline; the three new blocking harness failures are
  repaired; and the two pattern-buffer debts are cleared. Evidence:
  `npm run check` → 0 errors; `test:all` → 48 suites passed; `surface-budget`
  → PASS; `test:surface-guards` → 12/12; `test:persistence` → 34/34;
  `test:pattern-buffer` → 18/18; `test:pattern-buffer-ruleset` → 27/27.

- **Prompt generation from the ruleset model — resolved 2026-10-24:** the five
  host prompt bodies (`intro`, `badge_briefing`, `session_zero`,
  `novel_setup`, `run_workflow`) are no longer ruleset prose literals.
  `holonovel/src/core/prompt-composition.ts` assembles them from the package
  model's build-time `prompt_inputs` (§6.3) plus live state; the ruleset-free
  fallbacks are preserved. `derivePromptInputs` in
  `scripts/lib/ruleset-build-kit.mjs` records the inputs at Package time, and
  both package emitters call it. REQ-127's prompt half is exercised by T141
  with and without native constructs; the `manage_character` tool-description
  half remains the manual builder-side check T141 describes, because the host
  serves one statically cached `tools/list` across rulesets (REQ-411).
  Evidence: `test:output-contracts` → 293 passed, 0 failed; `check:fast` and
  `check:conformance` green; ROADMAP item removed.

- **Appendix M guard acknowledgment — resolved 2026-10-21:** the staged diff
  touches `spec/appendices-reference.md` (Appendix E manifest rows and the
  T685/T686 test-catalogue rows) and `scripts/validate.ts` (the intended-gap
  whitelist), but it does not change an Appendix M authoring rule or the
  validator pattern that enforces one. Recorded per the pre-commit
  `check-guarded-rule-change` guard. Evidence: `npm run validate:sdd` → 0
  errors; `npm run check:fast` → PASS.

- **Tool Surface coverage evidence (SR-1, SR-2, SR-3, SR-4, SR-5, SR-9) —
  resolved 2026-10-20:** the strict coverage audit had reported REQ-569 and
  REQ-571 as uncited because `gatherSourceCites` read only explicit `REQ-NNN`
  tokens (`scripts/validate.ts:1415`), and eight surface REQs had no exercised
  test. Citation expansion now reads slash/range shorthand
  (`scripts/lib/req-citations.ts`), the surface block carries explicit tokens
  (`holonovel/src/index.ts:759`, `:8265`), and exercised tests cover T660,
  T661, T663, T665, T667, T670, T672, and T673. The mislabelled T574/T577
  surface tests were renamed to their real IDs, and `DECISIONS.md:20` no
  longer claims T649 covers REQ-579. New bucket-B REQs now fail
  (`scripts/lib/req-checks.ts`). Evidence: `validate --impl-audit=strict` →
  exit 0, A=0/B=0; `test:tool-surface` → 6/6; `test:ruleset-gates` → 13/13;
  `test:fingerprints` → 9/9; `test:all` → 44/44; `check:full` → exit 0.

- **Harness/agent process improvements (AH-1, AH-2, AH-3) — resolved
  2026-10-05:** AH-3 is satisfied by `build-review` v2.6, whose Output
  Contract now requires the `build-review passed.` token as the first Build
  Mode output, before the first edit, not retroactively
  (`~/.config/opencode/skills/build-review/SKILL.md:192-196`). AH-1 and AH-2
  are model/tool behavior, so `skill-improvement-loop` triage classifies them
  OUT_OF_SCOPE for skill content (its Safety Rules also bar unrequested
  agent/config edits); the correct home is the harness instruction file, and
  the operator authorized two rules there
  (`~/.config/opencode/instructions/deepseek-tuning.md`, items 6–7):
  `workdir`-over-`cd` chaining, and dedicated tools over shell utilities.
  Source findings: `plans/2026-10-03-convert-build-hardening.md` §Harness.
  Evidence: `npm run check-registers:strict` PASS.

- **Push-pipeline performance audit (resolved 2026-10-03):** audited
  `scripts/push-pipeline.sh` and `.githooks/pre-push` and remediated the
  duplication/overhead findings. (F1, predicate `push-pipeline.sh:473` origin
  push + `:486` mirror push, `pre-push:106` unconditional strict gate) the
  implementation-coverage strict gate re-ran on every `git push`; it now runs
  once at step 4d (`push-pipeline.sh:337`) and `HOLONOVEL_PIPELINE_STRICT`
  (`:342`) suppresses the hook repeat, with main and the tag pushed as one ref
  list per remote. (F2, predicate the direct `npx tsx` spawns) direct tool calls
  use `node --import tsx` via the `TSX` array. (F4, predicate `pre-push:59`) the
  root spec hash is reused rather than recomputed. (F5, predicate
  `push-pipeline.sh:507`) the REQ-428 registry poll runs in the background from
  step 7d and is collected at 9c. (F6, predicate `push-pipeline.sh:267`) one
  stderr file is reused for delta classification instead of a per-server
  `mktemp`. Dispositions: F3 (step-5b re-check) is already `Closed-P3`
  (2026-09-27 entry below) — not reopened; F7 (`git ls-remote` tag guard)
  retained as a correctness guard; F2's sequential `npm run check` chain
  deferred (a gate-behavior change, out of scope). Evidence: `check:fast` PASS,
  `check-registers:strict` PASS, `push-pipeline.sh --dry-run` exit 0.

- **Convert/Build hardening from a two-book PDF integration (resolved
  2026-10-03, `ad08fa2`):** hardened the Convert/Build workflows from a two-book
  (389-page, two-column PDF) integration and the session audit. Resolved Convert
  findings CV-1…CV-10 (Appendix G.1/G.2/G.3/G.6),
  Build findings BD-1…BD-8 (REQ-395a supplement overlay, REQ-421 build recipe,
  new REQ-557 + T650, REQ-430, Appendix M), and reliability findings HR-1…HR-4
  (REQ-011c no-inference abstention, §6.3 deterministic-first extraction,
  REQ-299 deterministic-checks-first, REQ-061 `[NOT_FOUND]` abstention).
  Evidence: `check:fast` PASS, `build-order` complete, commit `ad08fa2`.

- **Appendix M read-only description rule (added 2026-10-03):** Appendix M's REQ
  authoring checklist gained the read-only description phrasing rule — a read-only
  tool's description names no mutating operation, forbidding the verbs create,
  update, remove, delete, destroy, install, apply, persist, and write — which the
  REQ-552 `MUTATION_VERBS` hard gate enforces. The rule was committed in the same
  diff as a `scripts/validate.ts` intended-gap whitelist update (REQ-557, a §5.18
  build-tooling contract), so `check-guarded-rule-change` flags the combined change;
  this entry records the rule per the acknowledgment convention. Evidence:
  `check:fast` PASS, `build-order` complete. Resolves the ThunderCats integration
  finding BD-3 (legacy read-only descriptions tripping the mutation-verb detector).

- **Script audit, consolidation, and standards hardening (resolved
  2026-10-02):** audited all 80 scripts across both trees by running the spec
  gates, the full server suite, the Holosuite deterministic tiers and mutation
  audit, and every standalone script. Consolidation: `readResource`/`readRes`
  across six harnesses unified on `holonovel/scripts/lib/jsonrpc.ts`;
  `contentHash`/`packageContentHash` across five harnesses unified on
  `sha256Canonical` in `scripts/lib/hash.ts`; `compare-spec-code.ts` memoized
  its repeated `readSpec`/`walkTsFiles` calls
  (`scripts/compare-spec-code.ts:66,140,265,375`), and `validate.ts` hoists its
  walked file lists. Parser consolidation: `extractReqHeaders`/
  `extractReqEntries` added to `scripts/lib/parse-spec.ts`; `fmea.ts`'s
  `REQ-\d{3}[a-z]?` header regex undercounted suffix REQs (1098/1187) and now
  uses the shared parser (1187/1187); `validate.ts` `checkReqBlocks`/
  `checkSpecViolations`/`checkCrossRefs`/§5-map scans use the shared parser.
  Standards: `check-script-discipline.ts` now covers `.mjs` and its detectors
  moved to `scripts/lib/script-discipline.ts`; `check-script-quality.ts` C2/C3/C4
  promoted from report-only to hard gates (detectors in
  `scripts/lib/script-quality.ts`), C4 narrowed to REQ-header-shape regexes (the
  prior `REQ-`+`\d` predicate flagged 20 citation/table scans), and the one
  intentional divergence (`doAction`) baselined. New regression self-test
  `scripts/test-script-tooling.ts` (21/21) wired into `check` and `check:fast`.
  Evidence: `check:fast` PASS, `check` PASS, `test:all` 41/41,
  `test-script-tooling` 21/21, `typecheck` clean. The former manual
  fingerprint-inspection CLI was removed on 2026-10-21 (see the Resolved
  entry below). Not script defects: `check-registry-publish` exits 1 because the
  published registry lags the repo version; `spec-update-record --check` exits 1
  on the pending unpublished delta (publication gate).

- **Holosuite II — adversarial + differential tiers and PB follow-on port
  (resolved 2026-10-02):** T3 adversarial
  (`holonovel/scripts/lib/holosuite-adversarial.ts`) and T4 differential
  (`holonovel/scripts/lib/holosuite-differential.ts`) shipped wired into CI and
  pre-push. The seven Pattern Buffer follow-ons (S15, S21, S23, S24, S25, S27,
  S33) were ported into `holonovel/scripts/run_ruleset_pattern_buffer.ts` as
  executable sub-workflows (S27/S33 prerequisite-gated on active synthesis);
  S10/S11 remain spec-defined stubs merged into S4/S20. Harness: 27 passed, 0
  failed, 8 skipped, 2 stubbed. Covers REQ-001, REQ-002, REQ-032, REQ-041,
  REQ-050, REQ-450.

- **Holosuite III — Understudies + method audit (resolved 2026-10-02):** §8 now
  defines the nine analytic lenses and the mutation-audit catch rate
  (`spec/05-verification.md`). The stochastic playtest harness emits the shared
  `EvalEvent`/manifest schema and nine-lens report sections
  (`holonovel/scripts/playtest.ts`, `holonovel/scripts/lib/playtest-lib.ts`);
  the mutation audit runs report-only
  (`holonovel/scripts/lib/holosuite-mutation.ts`, `test:holosuite-mutation`,
  catch rate 13/13 = 1.0); Holosuite events carry REQ identifiers and the
  runner emits a per-REQ coverage aggregate. Covers REQ-050, REQ-141m.

- **Embedded-spec hash and build-fingerprint conformance (resolved
  2026-09-30):** `spec_health.spec_hash` reported `"unknown"` and
  `spec://build` served "Specification not embedded in this build" because both
  read `holonovel.md` beside `src/` rather than the server root
  (`holonovel/src/index.ts:68`, `holonovel/src/index.ts:8168`). Corrected, and
  the runtime build-fingerprint contract (REQ-065a/b, REQ-187a/b) is now
  implemented: the fingerprint persists to
  `.holonovel-state/build-fingerprint.json`, reloads at startup, emits
  `[spec-version-drift]`/`[spec-drift]`/`[ruleset-drift]`/`[holonovel-drift]`,
  and surfaces `spec_hash_current` (`holonovel/src/core/state.ts`
  `loadBuildFingerprint`). `host_tool_quality` now covers host tools only, not
  generated ruleset tools (`holonovel/src/index.ts:654`). Evidence:
  `test:persistence` 30/30 (T224, T226), `test:backfill` 75/75, `check:fast`
  PASS.

- **Fixture notation and Player-parser divergence (resolved 2026-09-29):** the
  Appendix W.3 golden transcript's Player `command` calls were read as a
  divergence from `run_command` gating. Resolved on two grounds. (1) The parser
  gate is ruleset-aware (`holonovel/src/index.ts:2566-2569`, REQ-309/REQ-309e):
  a ruleset-free Novel — which the Appendix W fixture is — keeps the parser as
  the Player surface, so the transcript's Player commands are conformant. (2)
  The spec's golden transcripts and test catalog use abbreviated tool tokens as
  notation, not registered names; §4 now defines this ("Fixture notation"):
  `command("X")` denotes `run_command (action: execute, "X")`. The briefing text
  that had named the non-existent `command` tool was corrected separately (the
  2026-09-29 CHANGELOG, `holonovel/src/index.ts`). The original entry rested on a
  pre-discovery, ruleset-agnostic reading of the gate.

- **Glama image Node 24 + published `engines` floor (REQ-428)** (resolved
  2026-09-28): the operator bumped Glama's admin build-spec image to Node 24, so
  `holonovel/package.json` now carries `engines.node: ">=24"` (lockfile root
  entry refreshed) without surfacing `EBADENGINE` on Glama's `npm ci`. Evidence:
  isolated `npm ci` under Node 24 → exit 0 (100 packages); ROADMAP entry removed.

- **Spec-delta missed REQ-body changes (resolved 2026-09-28):**
  `scripts/spec-delta.ts`'s private `extractReqBodies` used `[^*]+?`, which
  stopped at the `*Acceptance criterion:*` emphasis, so 610 of 1182 REQ IDs were
  never captured and a REQ-body edit classified `patch`. Replaced it with the
  shared boundary parser (`scripts/lib/parse-spec.ts`, `changedReqBodies`),
  which covers 1182/1182 headers; added a fixture test asserting an
  acceptance-criterion body edit is detected and the diff is symmetric. The
  citation is REQ-419 (the scheduled entry and ROADMAP mislabeled it REQ-417).
  Evidence: `test-spec-tooling` 9/9 PASS; `spec-delta --base origin/main` →
  NONE/in-sync.

- **Harness-suite runtime (`test:all` ≈244 s) (resolved 2026-09-28):**
  `holonovel/scripts/test-update-workflow.ts` read and save/restored the live
  `.holonovel-state/pipeline-fingerprints.json`, ruling out parallel execution.
  `scripts/update-server.ts` now honors `HOLONOVEL_STATE_DIR`; the harness points
  it at a temp dir and drops the save/restore. New
  `holonovel/scripts/run-test-suite.ts` runs the 36 commands at bounded
  concurrency (default `min(4, CPUs)`); `test:all` is rewired to it. Evidence:
  36/36 PASS, 70.6 s wall clock (was ≈244 s); live baseline hash byte-identical;
  scratch failure-path run exits 1.

- **Publish workflow npm-exposure timeout (resolved 2026-09-28):** the
  `Wait for the version to appear on npm` step (`publish.yml`, `exit 1` after
  12 × 15 s) failed run `36440069199` even though `npm publish` succeeded
  (`+ holonovel@2026.9.28`, `14:59:08Z`); npm exposed the version at
  `15:05:19Z` (≈6 min), past the 180 s window, so the registry publish was
  skipped. Fixed by widening the wait to 10 min, making a timeout a
  `::warning::` + exit 0 gated by an `npm_ready` output, and tolerating npm's
  duplicate-version error as already-published success. Evidence: the version
  is present on npm (`registry.npmjs.org/holonovel`, `dist-tags.latest` =
  `2026.9.28`); `check-registers:strict` and `check:fast` PASS.

- **Publish Server scheduled-run false failure (resolved 2026-09-28):** the
  `Determine publish state` step read MCP Registry presence through the
  eventually-consistent `?search=` listing endpoint (`publish.yml:45`) and
  treated every value but `"true"` — including `"unknown"` from a failed
  fetch — as "needs publishing" (`publish.yml:56-57`), so it republished the
  already-registered `2026.9.27`; `mcp-publisher` rejected the duplicate and
  GitHub run `36433656516` step 11 exited 1. The workflow's copy of the
  presence logic had diverged from `scripts/check-registry-publish.ts`, which
  `e5b03c0` had already moved to the deterministic `/versions` endpoint. Fixed
  by delegating presence to that script (single source of truth), treating an
  unreachable registry as skip-with-warning, tolerating a duplicate-version
  rejection as success, and adding a registry read-back verdict step.
  Regression guard `scripts/check-workflows.ts` rejects the `?search=`
  endpoint, missing delegation, Node-runtime actions below `@v5`, and
  `node-version` below 24. Evidence: guard dry-run 7 violations on the pre-fix
  tree / 0 after; `npm run check:fast` PASS; `npm run typecheck` clean.

- **Push-pipeline delta-classification regression + fail-open server list**
  (resolved 2026-09-27): (1) `classify_delta()` in `scripts/push-pipeline.sh`
  captured `spec-delta` with `2>&1`, merging its stderr summary (`\nSpec delta:
  …`, `scripts/spec-delta.ts`) into the JSON on stdout; strict `JSON.parse` then
  rejected the trailing text and the run aborted at step 3 — the same
  code-identical defect blocked every push in `.githooks/pre-push`. Both now
  read stdout only and parse the first balanced JSON object. (2)
  `read -r -a SERVERS` yielded an empty array with exit 0 when `node` or
  `scripts/lib/servers.json` failed, silently skipping the REQ-394 gate, the
  hash sync, and REQ-418 verification; replaced with `mapfile` plus a non-empty
  guard that aborts. Also: deploy `npm ci`/`build` is scoped to lockfile/source
  changes, a failed deploy step emits a server-naming REQ-418 notice, the
  harness suite is gated on delta class (§6.7 Patch/Editorial = G0 only,
  `--full-tests` to force), and `HOLONOVEL_PIPELINE=1` stops the hooks re-running
  gates build-order already ran. Evidence: extracted `classify_delta` returns
  `minor`; missing `servers.json` → exit 1; `npm run check:fast` → PASS.

- **Spec↔code conformance assessment 2026-09-27 (F1–F5)** (resolved
  2026-09-27): (F1) `manage_codex (action: import)` implemented per REQ-321d —
  per-kind materialization, batch atomicity (REQ-321c/REQ-321m3), badge scoping
  (REQ-321k), and the `id` alias. Predicate: the import branch in
  `holonovel/src/index.ts` handled only `voice_profile`/`adventure`. Restored
  Appendix F T382/T383/T384 plus T366. (F2) the `manage_session (action:
  compress)` overload was split — the irreversible compactor moved to a distinct
  `compact` action (REQ-239a), resolving the REQ-086a/REQ-239a conflict;
  `action-conflicts` now carries no `known-conflict` entry and fails when one is
  absent from ROADMAP.md. (F3) added the `compare-spec-code --dedicated` report
  (bucket-C REQs with no dedicated exercised test). Dry-run measured **131
  flagged / 0 confirmed defects** on the current corpus — a false-positive rate
  above the gate budget, so it is report-only (surfaced in push-pipeline step
  4b). (F4) `checkTestNameInflation` errors under `--impl-audit=strict`. (F5)
   `spec-delta --base <ref>` added; push-pipeline now fetches origin before the
   delta classification (step 2b) and passes `--base origin/main`. Spec
   conventions changed in the same increment: the Appendix M action-contract
   uniqueness precedent was rewritten for the compress/compact split, and the
   Appendix M assertion-relevance rule gained the false-C methodology note that
   the report-only detector complements.


- **Spec-review 2026-09-27 remediation (SR-1…SR-8, SR-10)** (resolved
  2026-09-27): full-document spec review findings dispositioned in one
  increment. SR-1 (method in REQ bodies) and SR-2 (worked examples): relocated
  to §6.3/§6.4.1/§6.5/§7.1/§7.7 and Appendix O.11 per Appendix M. SR-3
  (thresholds/defaults): REQs now reference §6.5/Appendix O. SR-4 (oracle tool
  binding): discovery confirmed the `manage_scene (action: oracle)` placement is
  deliberate; documented in §5.22 and Appendix S. SR-5 (reading-guide drift) and
  SR-10 (AGENTS map): §2, Quick Reference, and AGENTS.md updated. SR-6
  (`_Check:` scope): Appendix M restated at REQ-family scope. SR-7
  (property-group count): already guarded by `checkPropertyGroupCount`. SR-8
  (Appendix T enumeration): §5.19 named as canonical. Prevention: REQ-family
  `_Check:` coverage gate plus report-only REQ-body content scans in
  `scripts/lib/req-checks.ts`.

- **Codex `capture` action-contract conflict (REQ-321f vs REQ-347a)** (resolved
  2026-09-26): REQ-321f's `capture, kind, source_id` binding is narrowed to the
  provenance contract; per-kind capture is owned by REQ-321g (adventure) and
  REQ-347a (voice profile). General capture is scheduled on ROADMAP.md as a
  feature request, so `scripts/action-conflicts.ts` no longer reports two
  contracts for the `capture` action.

- **Conformance-gap remediation + prevention program** (2026-09-26, commit
  `65146ab` + follow-on): resolved the config-drift class and the false-C
  evidence class found by the spec↔code audit (REQ-129, REQ-097, REQ-239,
  REQ-241, REQ-096, REQ-092, REQ-084, REQ-030/REQ-055a, REQ-063b, REQ-405,
  REQ-246a, REQ-077). Prevention wired: config-surface parity gate (B1),
  false-C + Appendix F assertion ratchet with baseline (B2/B4), direct-test
  requirement for new bucket-C REQs (B3), and the conformance dossier in
  `check:fast`/pre-push (B5). The "Pre-existing config drift outside the
  unpushed range" and "SC-7 comment-only source citations" Closed-P3 entries
  below are superseded: both classes are now mechanically caught.
- **§7.6 config-default alignment, commits since `origin/main`** (2026-09-25):
  audited the 15 configs added and 4 re-annotated by the 27 unpushed commits
  against the solo-play north star and their REQ/coupling/classification
  surfaces. Resolved: (F1) `TTRPG_BELIEF_RECONCILIATION` was a phantom — REQ-465
  and REQ-468 now carry the disablement contract and `recomputeBeliefs` honors it
  (T629); (F2) `TTRPG_IDENTITY_MAX_CANDIDATES` was a phantom — new REQ-547 bounds
  the candidate set with oldest-first eviction (T630); (F3) REQ-473/REQ-479 now
  admit the configured non-developmental authored-card acceptance that
  `TTRPG_IDENTITY_AUTO_ACCEPT_AUTHORED=true` implements (T631); (F5) §7.6 defines
  `0` as eviction-disabled. (F4) causal validation stays default-on — aligned with
  "the rules govern every outcome"; (F6) the `Required` column is uniformly `No`,
  already zero-config-aligned. F7 below is Closed-P3.

- **Feature-parity residual remediation** (2026-09-25): (1) N1 — the behavioral-
  config contract was reconciled: Standing Rule 11 now distinguishes
  natural-language-tunable (`Behavioral`, Session-source coupling row) from
  mechanically-coupled (`Behavioral (mechanical)`) dimensions; §7.6 re-annotated
  ten non-Session configs; REQ-388b/c redefined against §7.6; the validator now
  rejects a plain `Behavioral` annotation whose cited P-rule is not Session-
  sourced. (2) R2 — `holodeck_config` is implemented in `buildSpecHealth`, with a
  real T450 in `test-tool-definitions.ts`; REQ-388 moved E→C. (3) N2 — Knowledge
  Corpus is bounded (REQ-546/T628; `TTRPG_CORPUS_MAX_DOCUMENTS` /
  `TTRPG_CORPUS_MAX_ACQUISITIONS`). (4) R3 — the REQ-372d waiver rationale was
  corrected to a build-scope basis (the MCP SDK supports runtime registration).
  (5) R1/REQ-137b — badge-filtered `tools/list` is implemented by wrapping the
  SDK ListTools handler; T151 extended to assert the filtered lists. (6) N3/R4
  minor fixes. Register buckets A0/B0/C387/E112.

- **Spec↔code conformance comparison SC-1…SC-6, SC-8** (2026-09-25): full
  498-REQ comparison (`spec/audit/spec-code-comparison-2026-09-25.md`,
  `scripts/compare-spec-code.ts`) found five false bucket-C REQs caused by
  bundled harness test names, and one config-name drift. Fixed in-session:
  added T116/T148/T149/T380 tests, whitelisted REQ-124 as a ruleset-dependent
  intended gap, added `checkTestNameInflation`, corrected two mislabeled test
  names, and made the briefing budget honor `TTRPG_MAX_BRIEFING_TOKENS`.
  SC-7 (comment-only citations) is `Closed-P3` below. `--impl-audit=strict`
  passes at A0/B0/C385/E113, 0 errors.
- **REQ-372/373 — supplementary ruleset import & dynamic tool registration**
  (2026-09-25): SHIPPED/closed. N1 shipped 2026-09-24 under the REQ-372d
  dynamic-registration waiver; Pattern Buffer S30/S31 now execute, and REQ-373
  is recorded as a waived intended gap in `holonovel/DECISIONS.md`. Reconciled
  with `ROADMAP.md` §"Supplementary ruleset import (REQ-372/373) — SHIPPED".
- **Residual remediation SC-6/SC-9** (2026-09-25, session 2): the
  `compare-spec-code.ts --bundles` report isolated the 6 falsely-C
  bundle-dependent REQs (123, 160, 175, 380, 389, 390). Added
  T195/T214/T441/T452/T453/T454/T455 tests, reclassified REQ-123 as a
  ruleset-dependent intended gap, and fixed SC-9 — a corrupt-hash package
  crashed the host at startup (`toolSchemas` hydrated during tool registration)
  and at health/list hydration, violating REQ-389b and defeating REQ-390 lazy
  hydration. `toolSchemas` now reads `tools.json` without hydrating,
  `validateDeclaredToolSchemas` preserves REQ-430, and startup/health/list guard
  per-package hydration. Register now A0/B0/C384/E114, 0 errors; `test:all`
  0 failures.
- **§5 subsection consolidation review** (full-document spec-review SR-9,
  2026-09-10): Appendix M's "§5 subsection exceeding 40 REQs SHALL trigger a
  maintainer review for consolidation" exercised across the nine sections over
  the threshold — §5.6 (260), §5.8 (127), §5.3 (84), §5.12 (82), §5.9 (76),
  §5.10 (74), §5.5 (58), §5.1 (51), §5.7 (49). Disposition: `Deferred-by-user`
  — each section's density is justified by its domain complexity; no immediate
  consolidation. §5.6 is a candidate for a future dedicated consolidation
  increment.
- **§7.6 behavioral-annotation drift** (baseline spec-review, 2026-09-09):
  normalized the config-table annotation to one canonical form — `TTRPG_AUTONOMY`
  dropped its `§7.7.1a` prefix and `TTRPG_SYNTHESIS_AUTO_TRIGGER` gained its
  `couples per P47` annotation (backed by a literal variable name in the §7.7.1a
  "Narrative Directive → Synthesis" row). `checkConfigCouplingAnnotations` now
  rejects a bare `Behavioral` row or the non-canonical prefixed form instead of
  silently skipping them. SR-1, SR-2, SR-3 closed.
- **Builder-side evidence follow-through** (AAR 2026-09-06): shipped 2026-09-06
  as three bounded increments — a conversion evidence harness + §5.2 coverage
  map (REQ-452/453, `check-conversion-evidence.ts`, T542/T543), a §6.7
  update-workflow harness (REQ-098/T84b, `test-update-workflow.ts`), and
  register alignment for the Holodeck/Wisdom/entry-point REQs (the §5.12
  disposition range-keyed bug corrected to section membership, so REQ-354 no
  longer misreports `implemented`). ROADMAP.md entry removed; see CHANGELOG.
- **SR-1 — machine-warning backlog** (full-document spec-review, 2026-09-06):
  zero-findings editorial campaign complete. All 15 increments plus the
  structural passes shipped as Editorial commits 2026-09-06 (`662efa1` →
  `584310c`); machine-flagged warnings 1,219 → 6, and all 6 residual are
  documented DP-3 non-actionable (DECISIONS.md structural-reconciliation
  disposition). No open items remain.
- **Backlog-clearance program waves 1–11** (2026-08-24 kickoff): complete.
  `req-coverage.md` now registers zero A and zero B REQs (A 0 / B 0 / C 302 /
  E 110); the wave-named REQs (REQ-408, REQ-193, REQ-380/389/390) are bucket C
  with exercised tests; the terminal step `--impl-audit=strict` is wired into
  `.githooks/pre-push`. Program closed; no ROADMAP.md entry remains.
- **SR-1 — §5 index table drift** (integration review, 2026-09-04): §5 section
  map rebuilt from actual REQ→section membership (98 missing REQs across
  §5.1–5.9 plus rows 5.21–5.23), and `validate.ts` now enforces completeness
  (`checkSectionIndexCompleteness`).
- **SR-2 — coupling row unresolvable token** (integration review): "NPC Mind"
  and the two `command (action: …)` tokens registered as aliases;
  `validate.ts` promotes unresolvable property tokens from warning to error.
- **SR-3 — TTRPG_NPC_MIND coupling mislabel + missing Session-source path**:
  P45 now names the NPC-mind keyword ("NPCs think for themselves"), a
  "Narrative Directive → NPC Mind" coupling row was added, and
  `checkConfigCouplingAnnotations` verifies behavioral-config annotations.
- **SR-4 — base capabilities outside the Holodeck model**: §7.7.0 now
  declares host base-capability state a self-contained non-coupling surface
  (escape hatch: future cross-property base capabilities register per REQ-370).
  Option A (declare non-coupling) chosen over wiring in property groups.
- **SR-5 — build-phase-map subsection count**: corrected 20 → 23.
- **SR-6 — holonovel/AGENTS.md tool-surface drift**: rewritten for the
  28-tool surface; T511 harness asserts the count.
- **F1 — term-fixing grammar in §5.2** (prior AAR): fixed.
- **F2/F3 — REQ-096/090/091 erroneous-citation and registration drift**:
  fixed.
- **F4 — proofreading-blocked REQs**: partial (remaining items shipped as
  implementation landed).
- **G2 — gather-tool tightening**: fixed.
- **Lockfile drift on deploy** (REQ-418 recurrence): `push-pipeline.sh` deploy
  now uses `npm ci` + lockfile-revert guard.
- **REQ-192 → S22 mapping** (methodology finding a): §6.6 row added in-session;
  the register correctly surfaced the gap. No further audit needed; the
  suggested S-ID cross-check validator is recorded below as `Closed-P3`.
- **remove_room / remove_thing redo-stack wipe** (methodology finding b): the
  snapshot-before-NOT_FOUND bug was fixed and regression-tested. The suggested
  validator guard is recorded below as `Closed-P3`.
- **§5.4 / §5.9 / §5.12 / §5.19 completion waves**: shipped 2026-08-24.
- **Deploy pull blocked by stale uncommitted tree edit** (P2, 2026-08-30):
  `push-pipeline.sh` step 9 now discards working-tree drift before
  `git pull --ff-only`, matching the AGENTS.md Two-Repo Workflow contract;
  verified REQ-418 deploy verification passes end-to-end.
- **2026-09-08 full-document evaluation follow-through** (top-3 recommendations
  + residual findings): (1) Standing Rule 11 scoped to the REQ-388b behavioral
  classes with build-time/presentation exemptions; the six remaining uncoupled
  behavioral configs wired with §7.7.1a coupling rows under new pattern rules
  P55–P59; TTRPG_WORLD_PROMINENCE and TTRPG_NOVEL_PREVIEW_CHARS reclassified
  non-behavioral in §7.6. (2) REQ-067 removed from the intended-gap whitelist,
  source-cited, and exercised by a new `test-help.ts` harness (T62/T118) — the
  help-tool category-override rendering gap was fixed in the same pass;
  REQ-454/T544 added so a server-cited REQ can never be silently whitelisted.
  (3) REQ-374a editorial de-duplication (12-name archetype enumeration →
  §7.7.0 reference) cleared the two residual proofreading warnings.
- **F6 — world-model "Known limitations" staleness** (2026-09-08 evaluation):
  the three Aug-2026 limitations recorded in holonovel/DECISIONS.md were
  verified RESOLVED — multi-direction door form parsed (`model.ts`
  convert_source), `create_thing` carries `location_type`
  (room/container/supporter), and parser `take` scans supporter/container
  things. Historical DECISIONS.md entries left as immutable build records; no
  open action.
- **World in Motion gating tension (T358 vs T389)** (2026-09-26): RESOLVED by
  spec decision — the two-gate model is canonical. `TTRPG_WORLD_REACTIVITY`
  (default active) gates the World in Motion section and its non-NPC entries;
  NPC goal-pursuit suggestions (REQ-339) additionally require
  `TTRPG_NPC_AUTONOMY=on` (default off). REQ-233a2 states the two gates,
  REQ-233a3's acceptance criterion sets both variables for the goal-pursuit
  assertion and adds the `NPC_AUTONOMY=off` negative case, and T358 was
  amended to match. No code change — `holonovel/src/index.ts:8969` gates the
  section on `worldReactivityOn()` and `:8970` seeds goal pursuit under
  `npcAutonomyOn()`. Surfaced by the B1 config-surface parity gate.
- **build-review skill §7 edit** (prior AAR Item 6): RESOLVED — §7 "Spec hash
  drift" gains a dated-narrative-entry check (confirm the human-readable
  `### Holonovel Spec Update — <date>` entry exists after assembly, not only
  the synced hash line). build-review `metadata.version` 2.3 → 2.4. External
  file, not in this repo. The same pass added a heuristic-check
  false-positive-budget item to plan-review §2 (version 2.3 → 2.4).
- **General codex capture (Scheduled feature request)** (resolved 2026-09-26):
  REQ-321n now specifies `manage_codex (action: capture, kind, source_id,
  update_source?)`; the tool dispatches capture by kind, REQ-321f points at the
  new contract, and the ROADMAP entry is removed. New evidence T397b/T397c/T402c.
- **§6.7 update self-invocation** (resolved 2026-09-26): `scripts/update-server.ts`
  executes the printed update command when `HOLONOVEL_INVOKE_UPDATE=1` (default
  off, never under `--check`); `push-pipeline.sh --auto-update` sets it.
  Exercised by T84c/T84d. ROADMAP entry removed.
- **Action-contract conflict error gate** (resolved 2026-09-26):
  `scripts/action-conflicts.ts --check` fails on any candidate group not in
  `spec/audit/action-conflicts-baseline.json`; report-only stays in `check:fast`
  and `--check` is wired into `check`. The five known groups are dispositioned;
  the one genuine overload (REQ-086a vs REQ-239a) is Scheduled-roadmap.
  ROADMAP entry removed.

## Resolved (2026-09-29 playtest fixes)

Findings from the 2026-09-29 persona/GM playtest matrix
(`plans/2026-09-29-playtest-matrix/`) that the fix increment
(`plans/2026-09-29-playtest-fixes/`) addressed. 38 sessions, all
completion-oracle green; these were the mission-level defects they surfaced.
Fix evidence: regression tests G1/G3/G4/G5 in
`holonovel/scripts/test-output-contracts.ts`; full suite 37/37;
`check:fast` PASS.

- **Ruleset lookup source anchors dropped (P0, 2026-09-29):** `sourceAnchor()`
  returns null and is spread after the entry, clobbering the model's own
  anchor; the index id/key join also misses hyphenated ids (e.g. `stat-checks`
  vs `stat_check`) — `holonovel/src/index.ts:822-823,1180-1185`. Reproduction:
  every matrix batch, e.g. `pt-fair-power-gamer` (6/8 lookups null),
  `pt-adversarial-rules-lawyer`.
- **`mothership_core_mechanic` returns its own description, not the mechanic
  text (P0, 2026-09-29):** the `info`-kind handler returns
  `schema.description` — `holonovel/src/index.ts:886`. Reproduction:
  `pt-fair-power-gamer` T58.
- **Frozen per-turn dice RNG (P0, 2026-09-29):** `1d100` returned 24 in every
  fresh process because the per-turn reboot re-seeds from the default and the
  harness does not propagate a seed — `holonovel/src/core/rng.ts:38-39` +
  `holonovel/scripts/playtest.ts:131-139`. Reproduction:
  `pt-fair-power-gamer` (10/10), `pt-adversarial-new-player`.
- **Cross-ruleset condition vocabulary (F8, P0, 2026-09-29):** a Mothership
  Novel validates conditions against the D&D 2024 `BASE_CONDITIONS` list;
  `Panicked`/`Stressed` were rejected — `holonovel/src/index.ts:4107`.
  Reproduction: `pt-lorekeeper-new-player` T32, `pt-adversarial-rules-lawyer`.
- **Cross-room `open`/`unlock` false `[OK]` (P0, 2026-09-29):** the parser
  resolves things globally while the writer is room-scoped, so an action on a
  remote object reports success with no persisted change —
  `holonovel/src/world/parser.ts:421,471` vs `holonovel/src/index.ts:2693`.
  Reproduction: `pt-adversarial-curious`, `pt-benevolent-new-player`.
- **Party-scope completion certified by the active PC alone (P1, 2026-09-29):**
  only the active entity moves and the oracle checks only that entity, and the
  escape room equals the spawn room — `holonovel/src/index.ts:2652`,
  `holonovel/scripts/playtest.ts:380-385`. Reproduction: all six batches.
- **Parser key/article matching and `suggest` unlock verb (P2, 2026-09-29):**
  a leading article defeats name resolution and `unlock X with keycard` claims
  the carried key is absent — `holonovel/src/world/model.ts:120-121`,
  `holonovel/src/world/parser.ts:478`; `suggest` emits `open` but not
  `unlock … with …` — `holonovel/src/index.ts:2510`. Reproduction:
  `pt-fair-new-player` T53, `pt-fair-completionist` T49.
- **Observability and coupling fixes (P2, 2026-09-29):** `discover` leaks zod
  internals (`holonovel/src/index.ts:1391`); story-journal beats record the
  wrong room (`holonovel/src/index.ts:3533,4806-4808`); invalid arguments
  return raw `-32602` with no envelope (`holonovel/src/index.ts:3803`); the
  harness appends without a per-run lock and drops the dice seed
  (`holonovel/scripts/playtest.ts:311`). Reproduction: `pt-fair-power-gamer`,
  `pt-narrative-curious`, `pt-benevolent-forgetful`.
- **`suggest` unlock verb and parser-move countdown ticks (2026-09-29):**
  confirmation re-runs showed the `suggest` intent still emitted only `open
  <door>` (`holonovel/src/index.ts` intent routing) and parser `go` did not tick
  `on_scene_transition` clocks (REQ-125/REQ-353). Fixed: `suggest` emits
  `unlock <door> with <key>`, and the move side-effect calls
  `advanceSceneTransitionCountdowns`. Evidence: tests G7/G8 in
  `holonovel/scripts/test-output-contracts.ts`; confirmation probes now pass.
- **Parser/writer take/drop agreement, arg-error envelope, story-list room
  (2026-09-29):** the re-run confirmation surfaced `take the pulse rifle` as a
  false-OK (the writer's `findMatchingThing` lacked article normalization and
  exact-first matching, so `vault door` matched `door`) and a `drop` that lost
  the item (held things carry no location). Fixed: `findMatchingThing`/
  `findThingByName` are exact-first and normalized; drop uses the all-things
  lookup; `manage_story (action: list)` surfaces `room`. Evidence: tests G10
  (plus G9) in `holonovel/scripts/test-output-contracts.ts`.

- **Tool argument-schema violations were misclassified by the harness (resolved
  2026-09-29):** the MCP SDK returns an invalid enum/type argument as a tool
  result with `isError: true` and an `MCP error -32602: Input validation error
  …` message (not a JSON-RPC error). Fixed on both sides: `classifyResult` in
  `holonovel/scripts/lib/playtest-lib.ts` (wired into `cmdTurn`, unit-tested),
  and a feature-guarded `createToolError` wrapper in `holonovel/src/index.ts`
  that emits an `[ERROR] [INVALID_INPUT]` envelope. Evidence: test G9.

## Resolved (2026-09-30 SWSE author-play)

Findings from the 2026-09-30 SWSE author-from-scratch play matrix
(`plans/2026-09-30-swse-author-playtest/`). 36 cells, all authoring-validity
pass and completion-oracle green. Fix evidence: regression tests in
`holonovel/scripts/test-persistence.ts` and
`holonovel/scripts/test-playtest.ts`; server suite 37/37; `check:fast` PASS.

- **Entity-id collision across restarts (P0, 2026-09-30):** `StateManager`
  kept a process-local `entityCounter` (`holonovel/src/core/state.ts:741`)
  that restarted at `character_01`, so a party created one-process-per-turn
  collapsed to a single PC. `createEntity` now allocates the next free id from
  the Novel's own entities (`holonovel/src/core/state.ts:2182`). Reproduction:
  four `manage_character (action: create)` turns previously all returned
  `character_01`.
- **`create_exit` crash on a missing direction (P0, 2026-09-30):**
  `manage_world (action: create_exit)` called `args.direction.toLowerCase()`
  though `direction` is optional, returning a raw TypeError
  (`holonovel/src/index.ts:3188`). It now returns `[ERROR] [INVALID_INPUT]`
  and accepts `room`/`from` and `to` aliases.
- **Playtest classifier counted `[FORBIDDEN]` as a defect (P3, 2026-09-30):**
  badge-gating refusals arrive with `isError: true`, so `classifyResult`
  (`holonovel/scripts/lib/playtest-lib.ts`) labelled them `[ERROR]` and the
  oracle failed on an expected refusal. It now classifies a refusal envelope
  in an `isError` result as a denial.
- **Scene-location set placed only the active PC (P1, 2026-09-30):**
  `manage_scene (action: set, location)` teleported only the active entity
  (`holonovel/src/index.ts:3684`) while parser `go` moved the whole present
  party (REQ-307/REQ-074). It now places the present party too; regression test
  in `holonovel/scripts/test-backfill.ts`.
- **Beat-enum finding rejected — the envelope already exists (2026-09-30):**
  the earlier "raw `-32602`" note was provisionally raised from a truncated
  message. The predicate confirms `manage_scene` with an invalid beat returns
  `[ERROR] [INVALID_INPUT]` enumerating the valid beats; the description now
  lists them as well. No envelope fix required.
- **Harness mission metric missed grounding searches (P3, 2026-09-30):**
  `missionTelemetry` (`holonovel/scripts/playtest.ts`) counted only `lookup_*`;
  it now counts `manage_ruleset (action: search)` toward the lookup/anchor
  metrics.
- **Synthesis health `stale_count` was hardcoded (P1, 2026-09-30):** REQ-160
  requires `spec_health.synthesis_health.stale_count`; `buildSpecHealth` pinned
  it to `0` and `StateManager.getWisdomHealth` (which computes it) was dead and
  crashed iterating the `briefing_order` object
  (`holonovel/src/core/state.ts:1745`). It is now wired, array-guarded, and
  stamps items lacking a timestamp from the manifest `collected_at`; list
  output carries a `stale` flag. T195 asserts it; the Appendix F baseline is
  re-pinned to 0.
- **Party-scoped completion oracle (P2, 2026-09-30):** the playtest oracle now
  requires every PC in the escape room (`party_in_escape`), gating `success`;
  the authoring protocol sets `manage_scene (action: presence)`. ROADMAP entry
  retired.
- **Player had no perception surface on ruleset-bound Novels (P2,
  2026-09-30):** an LLM-driven player agent calling `run_command (action:
  execute, "look")` was refused because the parser was wholly GM-gated. REQ-309h
  now permits the Player read-only perception commands (`look`, `examine`,
  `inventory`, `status`) while navigation and mutation stay GM-only
  (`holonovel/src/index.ts` `PLAYER_READONLY_VERBS`); test in
  `holonovel/scripts/test-competitive-gaps.ts`.
- **Character-creation package contract (P1, 2026-09-30):** REQ-399a now
  requires the character-creation model to declare every damage-tracking
  resource a ruleset defines (hit points, a damage threshold, a metacurrency).
- **SWSE sheets lacked HP/Damage Threshold/Force Points on a fresh install
  (P1, 2026-09-30):** the installed `swse` package declared only the three
  defenses, closed by a hand edit of `model.json`. The `character_creation`
  block is now an authored build source
  (`scripts/ruleset-builds/swse/character_creation.json`) applied during
  packaging by `scripts/ruleset-builds/swse/build-package.mjs`, which discards
  any baseline `character_creation` before overlaying it (REQ-399a). A rebuild
  from a pre-patch extraction emits `hit_points`, `damage_threshold`, and
  `force_points` (and populated class hit dice); the `swse` manifest advances
  `host_version` 2026.09.27 → 2026.09.30 with content unchanged. ROADMAP entry
  retired.
- **`TTRPG_NOVEL_RETENTION_DAYS` was dead code (P2, 2026-09-30):**
  `StateManager.cleanupExpiredTrash` (`holonovel/src/core/state.ts:1359`) was
  defined but never called, so the declared retention setting had no effect.
  It is now invoked during startup hydration; T122 asserts the purge.
- **Appendix F assertion-miss remediation (P3, 2026-09-30):**
  `checkAppendixFAssertions` (`scripts/validate.ts`) flagged exercised tests
  whose Appendix F row names a config var no harness references. The check now
  excludes build-time/informational/builder-side vars a server harness cannot
  set (`scripts/validate.ts` `nonHarnessAssertionVars`, sourced from §7.6 and
  `holonovel/DECISIONS.md`), and the eight genuinely runtime knobs gained
  env-set assertions: `TTRPG_CLIMAX_ACCELERATION` (T404),
  `TTRPG_MAX_ROSTER_ENTITIES` (T218), `TTRPG_WORLD_GEN_MAX_ROOMS` (T515),
  `TTRPG_NOVEL_RETENTION_DAYS` (T122), `TTRPG_AUDIT_RETENTION_SESSIONS` (T277),
  `TTRPG_AUTONOMY` (T485), `TTRPG_SYNTHESIS_AUTO_TRIGGER` (T323). Misses fell
  18 → 1; the recorded baseline was re-pinned to 1.

- **REQ-581 compatibility aliases (resolved 2026-10-21):** the five
  split-duplicate action sets and the four consolidation aliases
  (`resolve_fate`, `resolve_ironsworn`, `resolve_forged`, and
  `manage_ruleset (action: roll)`) are retired tombstones. Each hidden
  declaration returns `[NOT_FOUND]` naming its replacement; `tools/list` omits
  them; `spec_health.tool_surface` reports 45 retired declarations; T675 covers
  the tombstone refusal and T674 covers the compatibility mechanism. The
  canonical surface is unchanged at 36 tools / 214 actions. (REQ-581)
  The guarded-rule co-change is incidental: Appendix M's authoring rules were
  not edited. The shared appendices file also carries the T674/T675 catalogue
  correction, and `scripts/validate.ts` updated the `TTRPG_AUTONOMY` alias to
  the canonical `manage_staging (action: autonomy)` token.

- **`manage_session` rename (resolved 2026-10-29):** the play-facing tool is
  now `manage_context` (recap, verbosity, briefing_order, discover), so the
  lifecycle tools `open_session`/`close_session` no longer share a stem with a
  play-facing tool (REQ-024a, REQ-554). `manage_session` is a retired hidden
  whole-tool alias whose calls return `[NOT_FOUND]` naming
  `manage_context.<action>`; its maintenance action aliases still name
  `manage_diagnostics` (REQ-581). Canonical surface unchanged at 37 tools;
  compatibility declarations 50 → 54. T674/T675 cover the tombstone.

- **Deploy remote-identity guard (resolved 2026-10-31):** step 9 compared the
  deploy clone's origin against the publication remote as raw strings, so the
  scp (`git@host:path`) and URL (`ssh://git@host/path`) spellings of one
  repository were read as different remotes and a real deploy aborted after
  main, tag, mirror, and wiki had already been pushed. The comparison now runs
  through `scripts/lib/remote-url.ts` (`sameRemote`), which normalises scheme,
  user, default port, `.git` suffix, and trailing slash; an empty side still
  fails closed. (REQ-418; predicate `scripts/push-pipeline.sh:777`; exercised by
  `test:spec-tooling`)

- **Non-interactive confirmation refusal (resolved 2026-10-31):** the `--yes` /
  TTY check sat after step 5, so a non-interactive run without `--yes` paid for
  the full gate pass and the 54-command harness suite, rewrote
  `holonovel/DECISIONS.md`, then exited 1 with a dirty tree that blocked the
  retry. The refusal now runs before any file change
  (`scripts/push-pipeline.sh:159`); the prompt keeps its own check at `:548` as
  a safety net against step reordering.

- **Adventure-module `@npc`/`@lore` annotations materialize (resolved
  2026-11-07):** the loader reported those directives as guidance content and
  created neither the named Novel NPC nor the triggered lore entry, while
  Appendix K and T244 state both. `linkAnnotations`/`convertSource` now return
  deferred `AnnotationDirective`s, and `materializeAnnotations` writes the Novel
  NPC (location, room coupling, provenance) and lore entry (article-free key,
  trigger keyword, `world_target`) on the convert and adventure-load paths;
  duplicates and caps skip with a note. (REQ-079a, REQ-079d; predicate
  `holonovel/src/index.ts:materializeAnnotations`; exercised by
  `test:adventure` and `test:backfill` T244)

## Resolved — 2026-11-10 package build and update remediation

- **F-P6b-7 — no committed ruleset emitter; `build-ruleset` never emits
  (resolved 2026-11-10):** the covered non-commercial fixture ships a committed
  deterministic emitter (`scripts/ruleset-builds/fixture/build-package.mjs`),
  `build-ruleset` invokes the resolved emitter and propagates its exit code
  (`scripts/build-ruleset.ts:263`), and both it and `update` stage, gate, then
  swap (`scripts/lib/ruleset-registry.ts:173`); drift is gated by
  `scripts/check-fixture-emitter.ts`. Exercised by T656
  (`holonovel/scripts/test-ruleset-gates.ts:328`) and T689
  (`holonovel/scripts/test-update-workflow.ts`). REQ-395a, REQ-395c, REQ-563,
  REQ-564, REQ-650.
- **F-P6b-15 — supplement provenance and base-hash reporting absent
  (resolved 2026-11-10):** `build-ruleset` parses `slug+=path`, overlays merged
  parts through the emitter
  (`scripts/lib/ruleset-supplement.ts`), records `base_content_hash` and
  per-source hashes, and appends the state-dir provenance log; `update` and
  `update-rulesets` compare the recorded base hash against the current base
  emission (`scripts/lib/ruleset-registry.ts:139`). Exercised by T650
  (`holonovel/scripts/test-fingerprints.ts:298`). REQ-395a, REQ-421, REQ-557.

## Resolved — 2026-11-10 §5.18 deploy, state, and publication remediation

- **F-P6b-8 — no `[state-in-tree]` warning; scripts create in-tree state
  (resolved 2026-11-10):** `locateStateDir`
  (`holonovel/src/core/data-dir.ts:88-101`) reports the resolved source and the
  nearest git work-tree root, `spec_health.state_location`
  (`holonovel/src/index.ts:12537-12544`) carries the `[state-in-tree]` warning
  and the same line is written to stderr at startup (`:100-103`) without
  blocking. The four entry scripts resolve through it
  (`scripts/build-ruleset.ts:26`, `scripts/update-rulesets.ts:23`,
  `scripts/migrate-user-data.ts:24`, `scripts/update.ts:53`) and
  `scripts/lib/ruleset-build-kit.mjs:35` mirrors the precedence for a direct
  emitter run. Exercised by T466 in `test:data-dir` (in-tree warning, six-surface
  survival across `git clean -fdx` + `git reset --hard`, and the entry-point
  resolution). REQ-397.
- **F-P6b-13 — deploy clean and verification guards (resolved 2026-11-10):**
  the deploy step classifies each resolved state candidate as tracked,
  untracked, or ignored and refuses before any removal only when
  checkout/clean would touch it (`scripts/publish/steps.ts:594-619`; classifier
  `scripts/lib/publish-guards.ts`); the fast-forward failure names the server
  (`:622`); a stubbed verification returns `skip` and leaves `didDeploy` false
  (`:654-660`). Exercised by T465/T491 in `test:pipeline` (ignored state passes,
  untracked state is refused with the file intact, a divergent clone fails with
  the server named, and a stub run reports `deploy=false`). REQ-396, REQ-418.
- **F-P6b-14 — delta classification reads a working-tree hash (resolved
  2026-11-10):** the working-copy fallback is gone; the report carries
  `baseline_missing` and `stored_hash_source`
  (`scripts/spec-delta.ts:60-81,147-151`), classification stays `major` without
  a baseline, the CLI exits 1 outside `--report-only` (`:219-222`), and
  `classifyDelta` refuses on the field, not the exit code
  (`scripts/publish/steps.ts:116-122`). Exercised by T462 in
  `test:update-workflow` (no baseline fails closed despite a matching
  working-copy hash; a published baseline classifies normally). REQ-394.
- **F-P6b-19 — no container image and no manifest schema validation (resolved
  2026-11-10):** `holonovel/Dockerfile` builds the host and starts it
  (`ENTRYPOINT ["node","bin/holonovel.js"]`), gated by
  `check-container-image` and a CI `container` job; `holonovel/server.json` is
  validated against the vendored registry schema by
  `scripts/lib/server-manifest.ts:97` in `check-server-manifest`,
  `scripts/version-check.ts:112-126`, and the publish preflight
  (`scripts/publish/preflight.ts`). Exercised by T510 in
  `test:tool-definitions` (valid manifest, missing `name`, non-string
  `version`, out-of-enum transport, and the gate refusing a scratch manifest).
  REQ-428.

### 2026-11-10 §5.16–§5.17 capability citation gaps

- **F-P6b-27 — REQ-392's description-budget clause is now asserted (resolved
  2026-11-10):** T459 reads the budget recorded in DECISIONS.md through the
  shared parser (`holonovel/scripts/lib/tool-budget.ts`) and asserts every
  description in the live `scope=all` registry — host and installed-package
  tools — fits it (`holonovel/scripts/test-output-contracts.ts:1815-1821`); the
  same case asserts `tools_list_bytes` equals the served default listing before
  the `_meta.ruleset` annotation (`:1822-1836`). Exercised by T459 in
  `test:output-contracts`. REQ-392.
- **F-P6b-28 — REQ-391b's ruleset tool set has a surface (resolved
  2026-11-10):** `tools/list` accepts a `ruleset` slug filter, selecting that
  package's registered tools and refusing `scope`/`group` combinations and
  unknown slugs (`holonovel/src/index.ts:15405-15427`), with the filter bound
  into the pagination signature (`:15438`). Exercised by T457 in
  `test:selection` (filtered set, no infrastructure, no foreign package,
  unknown slug, conflicting filters, unchanged `rulesets_hydrated`, foreign
  cursor) at `holonovel/scripts/test-selection.ts:268-299`. REQ-391b.

### 2026-11-09 full-review sweep — chunk P3b-2 (§5.6 entities and NPCs)

F-P3B2-9 through F-P3B2-14 are `Resolved` in the 2026-11-12 §5.6 personality,
signal, and citation remediation increment. The one citation that could not be
re-pointed honestly (REQ-124b's T131) is split out as F-P3B2-15 below and
scheduled on `ROADMAP.md`.

- **F-P3B2-9 — personality surfaces (Resolved).** `composePersonalityGroup`
  renders a `### Personality` group with voice examples before trait lines, an
  `[NPC]` marker, omitted unset fields, and the REQ-109 empty-state marker;
  `NovelEntity.personality.persona` joins the entity personality object; and
  `normalizeVoiceExamples` refuses a sixth example
  (`core/personality.ts:96-108`, `index.ts:16405-16440`). T140/T201 exercise
  the briefing and sheet ordering. REQ-077a/b/d/e/f, REQ-126a/b, REQ-166a/b/c.
- **F-P3B2-10 — NPC voice-directive scope and tagging (Resolved).** `NpcState`
  carries `scope` and `role`; the directive renders outside the GM-only branch,
  keeps the REQ-282a location gate, filters examples by active `scene_type`
  before slicing, and gates the Player badge on `scope: "shared"`
  (`index.ts:16412-16428`, `:7760-7776`). T332 exercises GM/Player scope, the
  location change, and tag filtering. REQ-282a/b/c.
- **F-P3B2-11 — personality resources (Resolved).** Both resources return
  `{entity_id|npc_id, name, …populated fields, voice_examples}` with synthesis
  source metadata and badge filtering (`index.ts:14252-14268`,
  `:14405-14422`). T58/T65/T167/T202 exercise the shape and the Player read.
  REQ-167a/b.
- **F-P3B2-12 — player signals (Resolved).** `PlayerSignalEntry` stores
  `{value, connection_counter, last_updated}`; empty values delete; the audit
  entry uses `manage_character (action: signal)` with the REQ-069c prefix; the
  briefing renders "set N connections ago" and "unknown"; `connection_counter`
  increments once per Novel per process (`core/state.ts:96-110`, `:2018-2024`,
  `index.ts:4912-4955`, `:16460-16480`). T142/T211 exercise the lifecycle and
  restart ages. REQ-069a/b/c, REQ-128a/b, REQ-173a/b.
- **F-P3B2-13 — boundary propagation (Resolved).** `appendBoundaryWarning` is
  called from `manage_scene (set|directive)`, `manage_npc (create|update)`, and
  `manage_lore (set|update)`; the operation succeeds and the warning names the
  boundary (`index.ts:2724-2740`). T314 exercises every entry point. REQ-255b.
- **F-P3B2-14 — citations and narrow assertions (Resolved).** T55, T56, T57,
  T58, T65, T112, T132, T140, T142, T723, T129, and T202 now title assertions
  in the harnesses that own the surface; T201 asserts briefing rendering; T216/
  T220 assert the `party://current` contract; the conflict-lifecycle title no
  longer carries the false T131 token (`test-backfill.ts:415`). REQ-074,
  REQ-075g, REQ-076, REQ-077, REQ-126b, REQ-128b, REQ-167b.

## Scheduled-roadmap

### 2026-11-12 §5.6 citation remediation

- **F-P3B2-15 — REQ-124 NPC damage resolution is unimplemented
  (2026-11-12):** REQ-124b's `_Check:_ T131` names an NPC damage resolution
  (`roll_weapon_damage` reduces NPC HP; zero HP applies incapacitation), but no
  `roll_weapon_damage` handler exists and `manage_ruleset (action: roll)` rolls
  only generation tables; the conflict-lifecycle harness title previously
  carried a false T131 token, now removed. Scheduled under `ROADMAP.md` §
  *REQ-124 NPC damage resolution (P1)*. REQ-124a, REQ-124b.

### 2026-11-09 full-review sweep — chunk P8 (narrative cognition)

- **F-P8-2 — duplicate test IDs shadow coverage resolution (2026-11-09):**
  `T408` titles three different assertions (`test-narrative.ts:767`,
  `test-backfill.ts:722`, `test-limits.ts:403`) and `T409`–`T412` are each
  titled twice (`test-narrative.ts:774-813`, `test-backfill.ts:731-821`), so a
  token-presence match can evidence a REQ with an unrelated test. REQ-073,
  REQ-075, REQ-077, REQ-083, REQ-233, REQ-236, REQ-246, REQ-289, REQ-357,
  REQ-358, REQ-359, REQ-360, REQ-361. Scheduled under Harness test-ID label
  hygiene.

### 2026-11-09 full-review sweep — chunk P7b (extraction and synthesis)

Probe status: the 2026-11-09 assertion-repair session ran the Appendix F rows
against live harnesses. Four rows now pass and are committed (T136, T94, T144,
T324); the rows below could not be asserted because the behaviour they name is
absent, so each finding carries the failing predicate rather than a test.



### 2026-11-09 full-review sweep — chunk P3b-1 (§5.6 core state and lifecycle)

Partially scheduled under `ROADMAP.md` § *§5.6 clock and combat-report
remediation (P1)*. F-P3B1-3, F-P3B1-4, F-P3B1-5, F-P3B1-6, F-P3B1-7, and
F-P3B1-8 are `Resolved` above; F-P3B1-9 is reduced to the single T161 citation
that asserts the deferred damage surface.

- **F-P3B1-9 — Automated citations with no harness (partially resolved
  2026-11-13):** the clock and combat-report citations are now exercised by
  `holonovel/scripts/test-backfill.ts`, and T25/T33 are re-pointed off REQ-043f
  because neither asserts the combat turn report (T25 is the ruleset-section
  deletion drill, T33 a Manual ruleset-combat check). **Open:** T161 (REQ-043f)
  asserts a weapon-damage mutation against a target's HP, and no
  damage-resolution surface exists until REQ-124 lands. The row stays
  `Scheduled-roadmap` on that single citation.

### 2026-11-09 full-review sweep — chunk P3 (§5.4 decision workflows)

Scheduled under `ROADMAP.md` § *§5.4 remediation (P1)* and § *§5.4 citation
repair (P1)*. Each finding cites the predicate that carries it.

- **F-P3-5 — end-Novel disposal is not recorded in the audit log:** REQ-140
  requires the disposal recorded; `respond_decision` calls `state.endNovel`
  (`holonovel/src/index.ts:3406-3416`) and `endNovel`
  (`holonovel/src/core/state.ts:1697-1725`) writes no audit entry before moving
  the Novel to `.trash`. The record has no home once the Novel file is gone —
  the remediation decides where it lives (server log, audit archive, or a
  tombstone entry).
- **F-P3-6 — creation equipment lacks the ruleset source:** REQ-152a requires
  name, quantity, and ruleset source per assigned item; player-supplied names
  become `{ name, quantity: 1 }` (`holonovel/src/index.ts:3797-3799`), and a
  creation with no equipment stores `equipment: []` instead of omitting the
  field (REQ-152b).
- **F-P3-7 — a failing declared formula is not a named creation error:**
  REQ-399b requires a named error; `evaluateFormula` throws inside
  `computeDerived` (`holonovel/src/core/character-creation.ts:368`) and
  `buildCharacterStats` (`holonovel/src/index.ts:3780`) does not catch, so the
  caller receives an uncaught tool failure.
- **F-P3-8 — REQ-104c cites Automated T103 with no harness:** Appendix F
  catalogues T103 (`spec/appendices-reference.md:1564`); no `holonovel/scripts`
  harness carries the token.
- **F-P3-9 — the drain-atomicity fix has no in-tree assertion:** the failing
  branch (`holonovel/src/index.ts:3503-3504`) needs a ruleset package that
  defines character creation; the repo ships no such fixture, so the fix is
  code-verified only.

### 2026-11-09 full-review sweep — chunk P1 (trust core, §5.1/§5.5)

Scheduled under `ROADMAP.md` § *Trust-core contract remediation (P1)* and
§ *Trust-core citation repair (P1)*. Each finding cites the predicate that
carries it; none is derived from a gate message or a test failure (no gate
currently asserts these contracts — that is the finding).

- **F-P1-1 — GM-only refusals are bare `[FORBIDDEN]`, not `[ERROR] [FORBIDDEN]`
  (scheduled):** `core/state.ts:1097-1098` throws
  `"[FORBIDDEN] … Corrective action: …"` with the corrective action inline;
  `core/server.ts:70-74` rethrows; the SDK builds a text-only error result.
  Violates REQ-001 (response must begin with one of the five prefixes) and
  REQ-002b1/b2 (standalone `Corrective action:` line) and REQ-548c (no
  structured result). Every gated tool shares the path. Predicate:
  `state.ts:1097`, `index.ts:229`.
- **F-P1-2 — SDK schema errors are re-labelled `[ERROR] [INVALID_INPUT]`
  (scheduled):** `index.ts:226-233` rewrites the SDK's `-32602` argument error
  into a REQ-002 category result; REQ-001b2's acceptance criterion forbids
  exactly that shape. The absent T180 is why no harness catches it. Predicate:
  `index.ts:226-233`.
- **F-P1-3 — `raw()` emits an undeclared `RAW` status and unprefixed text
  (scheduled):** `index.ts:2735-2737` returns `structured("RAW", …)` for
  payloads that start with `{` or prose; `raw("[WARNING] …")` reports `RAW`
  while the text says `[WARNING]` (`index.ts:4557`, `:4560`, `:4638`, `:4828`,
  `:10789`). Violates REQ-001, REQ-548a/b (declared statuses omit `RAW`).
  Predicate: `index.ts:2737`, `:243`.
- **F-P1-4 — audit at capacity aborts after the mutation is saved
  (scheduled):** `index.ts:3274-3276` saves the Novel then calls `audit()`,
  which throws at `state.ts:1938-1939`; the write persists while the caller
  sees a failure and the audit chain has a gap. Violates REQ-040a/REQ-447
  (refuse *before* mutating). Predicate: `index.ts:3274`, `state.ts:1938`.
- **F-P1-5 — `output://` payloads are not badge-filtered (scheduled):**
  `index.ts:12589` stores plain text keyed `<tool>/<counter>`; the resolver at
  `:1531-1538` returns it with no badge check. REQ-004 ("session-local and
  badge-filtered") and REQ-179a ("badge-filtered per REQ-032"). A Player can
  read a payload produced under the GM badge. Predicate: `index.ts:12589`,
  `:1531`.
- **F-P1-6 — truncation covers four ruleset surfaces only and measures UTF-16
  length (scheduled):** `truncateOutput` (`index.ts:2760-2769`) is called at
  `:2094`, `:2117`, `:2196`, `:11148` only, and compares `text.length`, not
  bytes. REQ-004 requires truncation of tool output generally; REQ-180b makes
  the byte threshold authoritative. Predicate: `index.ts:2761`.
- **F-P1-7 — no badge gate in the dispatcher (scheduled):**
  `guardToolCall` (`index.ts:1821-1837`) handles retired aliases and the
  surface profile only; authorization is 142 handler-local `requireGM()`
  calls, and three tools delegate into another handler (`:5738`, `:6628`,
  `:11321`). REQ-032a/REQ-137b describe server-side gating of the surface.
  Predicate: `index.ts:1831-1836`.
- **F-P1-8 — Observer `tools/list` is not the read-only subset (scheduled):**
  `toolsVisibleToBadge` (`index.ts:315-318`) admits every non-GM-only tool for
  `observer`, including mutating tools that then refuse. REQ-032a: "Observer
  tools are a read-only subset … `tools/list` … filtered". Predicate:
  `index.ts:317`.
- **F-P1-9 — `prompts/list` and `resources/list` are unfiltered (scheduled):**
  the prompt wrapper at `index.ts:14638` merges package prompts and applies a
  budget, with no `getBadge()`; no resource-list handler exists in this file.
  REQ-031a/REQ-032a make prompts and resources badge-filtered surfaces.
  Predicate: `index.ts:14638`.
- **F-P1-10 — structured errors omit valid values (scheduled):**
  `err()` (`index.ts:2589-2593`) sets `category` and `corrective_action`; the
  `Valid values: …` enumeration is built into the text only (`:2104-2108`).
  REQ-548c requires the values where the enumeration is badge-visible.
  Predicate: `index.ts:2593`.
- **F-P1-11 — dispatcher refusals carry no structured result (scheduled):**
  `guardToolCall` returns `{content, isError}` directly (`index.ts:1832`,
  `:1835`), bypassing `ensureStructured`; the client receives
  `structuredContent === undefined`. REQ-548c requires one on every error.
  Predicate: `index.ts:1832`.
- **F-P1-12 — badge-switch audit omits the old badge (scheduled):**
  `index.ts:3273-3276` assigns `novel.badge` before `audit("set_badge", { badge })`,
  so only the new value is recorded. REQ-040c requires old badge, new badge,
  timestamp. Predicate: `index.ts:3274`.
- **F-P1-13 — `set_badge` succeeds with no active Novel (scheduled):**
  `index.ts:3268-3281` returns `[OK] Active badge: player` while `getBadge()`
  still resolves `none` (Editor), so the next call runs with full access.
  REQ-030 and REQ-066b. Predicate: `index.ts:3268`.
- **F-S1 — five §5.1/§5.5 REQs cite automated tests no harness implements
  (scheduled):** REQ-001b2 → T180, REQ-032b → T44, REQ-109f → T109/T110,
  REQ-286c → T336, REQ-306e → T350. Each test is defined `Automated` in
  Appendix F and absent from every `holonovel/scripts` harness; the coverage
  register marks all five bucket C. Either the assertion is written or the
  citation is re-pointed to the test that does exercise the behaviour.
  Predicate: `spec/02-requirements.md` Check lines for those REQs;
  `spec/appendices-reference.md` T44/T109/T110/T180/T336/T350 rows.

### 2026-11-09 full-review sweep — chunk P2 (tool surface, §5.3)

Scheduled under `ROADMAP.md` § *§5.3 citation repair (P1)* and
§ *Harness test-ID label hygiene (P2)*. Each finding cites the predicate that
carries it; the citation findings rest on an enumeration of the §5.3 blocks
against Appendix F and the harness corpus, not on a gate message.

- **F-P2-1 — nine §5.3 REQs cite T22 with no implementing harness
  (scheduled):** REQ-023a and REQ-023b cite T22 (prompt registration lifecycle:
  stub tool appears/absent across restart, exactly one user-role message, a
  title on every prompt, a description on every argument). No harness under
  `holonovel/scripts` or `scripts` references T22. The only literal token is
  `T022` at `holonovel/scripts/test-backfill.ts:164`, whose title is
  `T16/T022: resources/list exposes world + spec resources` — a different
  assertion, so it is a false match. REQ-078a–078d inherit the same citation
  but are already exercised by T124
  (`holonovel/scripts/test-output-contracts.ts:320`), so they need a re-point,
  not a new assertion. Predicate: `test-backfill.ts:164`;
  `spec/02-requirements.md` REQ-023b and REQ-078a–078d Check lines.
- **F-P2-2 — REQ-024a cites T35 (fixture isolation) with no implementing
  harness (scheduled):** T35 asserts fixture-only tool names
  (`create_delver`, `roll_move`, `start_confrontation`) are absent from
  `tools/list` for the target ruleset and present when serving the fixture.
  Neither token appears in any harness, and `test-tool-surface.ts` only asserts
  alias/retirement behaviour. Predicate: `spec/02-requirements.md` REQ-024a
  Check line; `holonovel/scripts/test-tool-surface.ts:225-252`.
- **F-P2-3 — nine §5.3 REQs cite stale test IDs whose behaviour is exercised
  under another ID (scheduled):** REQ-025a/b1/b2/c cite
  T45/T154/T165/T166/T170 (behaviour asserted by
  `holonovel/scripts/test-output-contracts.ts:281` under T105/T486/T487/T488);
  REQ-138a/b cite T167 (asserted at `:419` under T152); REQ-139 cites T168
  (asserted at `:427` under T153); REQ-057a/b cite T40 (asserted at `:305`
  under T39). Action is a citation re-point, not a new assertion. Predicate:
  the cited Check lines against the named harness lines.
- **F-P2-4 — zero-padded harness test IDs shadow real catalogue IDs
  (scheduled):** `holonovel/scripts/test-backfill.ts:157` (`T5/T020`),
  `:164` (`T16/T022`), and `:802` (`T176/T177/T178/T002`) use tokens that do
  not exist in Appendix F. A naive literal-match resolution treats `T022` as
  T22 and records REQ-023b as covered when it is not; the same shadowing
  applies to any REQ citing T20/T2. Fix is to enumerate the padded tokens,
  correct them to the IDs the assertions actually implement, and re-run the
  coverage resolution. Predicate: `test-backfill.ts:157,164,802`.

## Closed-P3 (recorded, no action)

### 2026-11-11 §5.10 override hint envelope — residuals

- **REQ-325c's Player-badge hint clause is unreachable (2026-11-11):**
  `run_command (action: resolve)` refuses the Player badge
  (`holonovel/src/index.ts:4826-4828`) and then refuses the observer
  (`:4829`), so only the GM/Editor branch of the hint scan is reachable; the
  Player-facing badge-filtered catalog surface is `constraints://active`,
  exercised by T372 (`holonovel/scripts/test-output-contracts.ts:1649`). The
  clause is vestigial, not wrong — no demonstrated wrong output. REQ-325c.
- **Harness label corrections (2026-11-11):** `T373`/`T374` moved to the
  scene-coupling test (`test-output-contracts.ts:1526`), and the countdown and
  knowledge tests now carry `T376` (`:780`) and `T377` (`:728`); the backfill
  resolve smoke check is REQ-only (`test-backfill.ts:713`). REQ-324's `T371`
  builder-side row loses its never-faithful server-harness carrier and stays
  bucket E (intended gap, exempt; `spec/audit/req-coverage.md:293`). The broad
  zero-padded-token sweep stays scheduled under `ROADMAP.md` Harness test-ID
  label hygiene.
- **REQ-323a's Appendix O pointer is dangling (2026-11-11):** the body says
  "Return values are defined in Appendix O"
  (`spec/02-requirements.md:1003`), but Appendix O has no resolve-return
  subsection (`spec/appendices-reference.md:3033-3190`). The shape is evidenced
  by the T370 row instead. REQ-323a.

### 2026-11-09 full-review sweep — chunk P8 (narrative cognition)

- **Stranded §5.12 list comment (2026-11-09):** `scripts/validate.ts:1866`
  carries a comment naming the canonical §5.12 REQ list above
  `INTENDED_GAP_REQS` (`:1872`); the list itself is `SECTION_512_REQS`
  (`holonovel/src/index.ts:325`) and the comment is mislocated, not false.
  REQ-346. No action follows: the list exists and is exercised.

### 2026-11-09 full-review sweep — chunk P6b (ruleset packages and host entry points)

- **F-P6b-22 — capability edge cases (2026-11-09):** the Forged zero-dice case
  prints one die (`index.ts:7781-7793`), the Fate modifier renders `−0`
  (`:7527`), `compel` grants a point without an aspect check (`:7538-7544`), a
  stress mark with neither track nor consequence is a silent `[OK]`
  (`:7596-7602`), and negative quantities are accepted (`:7597, 7734, 7810`).
  REQ-434–REQ-442. Each is a narrow convenience or display defect with no
  demonstrated wrong state.
- **F-P6b-23 — assertion breadth (2026-11-09):** T453 exercises neither
  duplicate-slug nor loaded-vs-idle; T455/T459/T460 assert only a type;
  T511's persisted-type list is a partial allowlist. REQ-389c, REQ-390b,
  REQ-392, REQ-393, REQ-429. Covered by the dedicated remediation harness for
  the fixed contracts; the remaining breadth is informational.
- **F-P6b-24 — entry-point polish (2026-11-09):** `update` prints no runbook
  pointer (`scripts/update.ts:146-157`), `update-rulesets` prints no usage
  (`scripts/update-rulesets.ts:27-38`), `migrate-user-data` duplicates the
  runtime re-stamp, and `prepare-package.mjs:22-27` omits the compiled update
  entry. REQ-395b, REQ-422, REQ-424, REQ-428.
- **F-P6b-25 — surface polish (2026-11-09):** the no-Novel default listing
  omits installed-ruleset metadata (`index.ts:1447-1455`) and
  `tools_list_bytes` is a canonical-cache approximation
  (`index.ts:12161`). REQ-391a, REQ-392.
- **F-P6b-26 — provenance and error taxonomy (2026-11-09):** the install
  provenance records the license in the `source` field
  (`index.ts:11244-11251`), and `search`/`roll` hydrate failures escape the
  `[STATE_CONFLICT]` taxonomy (`index.ts:11206, 11317`). REQ-432a, REQ-389b,
  REQ-390a.

### 2026-11-09 full-review sweep — chunk P6a (world model and the adapter seam)

- **F-P6a-15 — stale tool name in the empty-world message (2026-11-09):**
  `holonovel/src/index.ts:4627` directs the GM to `` `convert_source` ``, a
  retired tool; the live surface is `manage_world (action: convert)`. REQ-196f.
  A message-only defect; the corrective action still leads to the right surface.
- **F-P6a-16 — climb link and `all` pronoun (2026-11-09):** `climb` always
  routes to the `up` exit and `convert` never registers the climbable as that
  exit's door (`holonovel/src/index.ts:4833-4834`,
  `holonovel/src/world/model.ts:880-931`); `all` is not handled as a pronoun
  (`index.ts:4600-4604`). REQ-319c, REQ-319d. The `climbable` property and the
  `it`/`them` pronouns work; the uncovered remainder is a narrow convenience.
- **F-P6a-18 — generation and bundle bookkeeping (2026-11-09):** generated
  door-role objects carry no exit/`doorRefs` (`holonovel/src/index.ts:5433`) and
  `annotations.bundle_of` has no producer (`index.ts:4384`). REQ-431d,
  REQ-622c. Both are bookkeeping gaps in paths that otherwise validate; the
  review records them without scheduling a distinct fix.

### 2026-11-09 full-review sweep — chunk P5 (engine loop, event stream, agent tasks)

- **F-P5-8 — `entriesByOrdinals` is dead code (2026-11-09):**
  `event-log.ts:94-98` exports a helper with no call site in `src/` or
  `scripts/`; the ordinal-range surface is served by `traverse`
  (`core/memory.ts:178`, REQ-591). Recorded for a future cleanup; no
  demonstrated failure and no normative REQ assigns it a caller.

### 2026-11-09 full-review sweep — chunk P4 (persistence and §5.19)

- **F-P4-10 — `reStampArtifact` does not fsync its temp file (2026-11-09):**
  the migration writer uses `writeFileSync` + `renameSync` with no `fsync`,
  unlike `saveNovel`. Predicate: `state.ts:189-192` vs `state.ts:2549`. No
  demonstrated failure: a re-run of `holonovel update` or the next save re-stamps
  the artifact.
- **F-P4-11 — a corrupt `roster.json` aborts startup (2026-11-09):**
  `state.loadRoster()` is unguarded (`index.ts:131`) and `loadRoster` parses
  without a catch (`state.ts:2585-2586`), while server notes and codex catch
  corruption. No normative REQ requires roster-corruption tolerance; recorded
  for a future operational-hardening pass.
- **F-P4-12 — `saveRoster` is a plain write (2026-11-09):** `state.ts:2577`
  writes `roster.json` without the temp+rename pattern; the same class as
  F-P3B4-6 (notes/codex), whose scheduled fix should adopt one atomic helper.
  No roster-persistence REQ mandates atomicity.

- **Prototype-key hardening in package tool schemas (2026-11-09):** `index.ts:2018-2032`
  builds `const shape = {}` and assigns `shape[k]`, where `k` comes from an
  installed package's `tools.json`. A `__proto__` key invokes the prototype
  setter and silently drops the parameter; no path to `Object.prototype`
  pollution was found (Zod reads own keys), so this is hardening, not a
  demonstrated exploit. Record and close; use `Object.create(null)` if the
  surface is ever opened to untrusted packages. (predicate `index.ts:2018`)

- **T244's ruleset-search assertion for annotations is unexercised
  (2026-11-07):** the spec row requires `@encounter`/`@trap` annotations to be
  retrievable via `manage_ruleset (action: search)`; the linked-count half is now
  reachable, but no harness exercises search retrievability and no gate consumes
  the row. Record and close until that surface is specced.

- **Raw-JSON list results unclassified by the playtest prefix harness
  (2026-10-30):** `manage_artifact (action: list)` and `manage_belief (action:
  knowledge_query)` return bare JSON; `prefix()` classifies them `[?]` (and
  some list results `[]`). `error_class` stays `ok`, so no defect is counted;
  the effect is a distorted prefix histogram. Record and close; promote a list
  action into a deterministic tier before treating its prefix as a contract.
  (predicate `holonovel/scripts/lib/playtest-lib.ts:26`)
- **Install footprint and optional registry metadata — closed 2026-10-26:** the
  93-package / ~72 MB installed dependency tree is inherited from
  `@modelcontextprotocol/sdk` (express, hono, jose, ajv); no demonstrated
  failure depends on it, and trimming would fork the SDK. Optional
  `server.json` fields (`title`, `websiteUrl`, `icons`) are recorded as
  deferred unless the registry schema accepts them. Record and close; reopen
  only if install size causes a documented failure.

- **Multi-step replay call cost (REQ-586) — closed 2026-10-24:** the replay
  corpus now records six multi-step workflows (character creation, combat
  round, room move, saved-game load, skill check, item pickup); full and
  standard mean calls are 1.196 against per-intent expectations. Composites
  would remove a call from character creation and the combat round, but no
  demonstrated failure depends on it and REQ-577 already covers session and
  turn composites. Record and close; reopen if the replay corpus shows a call
  cost above its expected value.

- **Plan-artifact shape drift (AU-9) — closed 2026-10-24:** eight of fourteen
  10-23/10-24 plans omit a Gate-mapping section and eleven omit a literal
  "Summary" heading. The artifacts are historical records of executed
  increments; rewriting them would not change a gate or a contract. New plans
  continue to follow `plans/README.md`. Record and close.

- **Commit-message convention drift (AU-10) — closed 2026-10-24:** nine of
  thirty-three commits in the window lack the `## <date> — <title>` prefix.
  History is immutable; the convention remains the standard for new commits.
  Record and close.

- **AAR absence for the 10-24 batch (AU-11) — closed 2026-10-24:** thirteen of
  fourteen increments have no stored AAR artifact; the review register carried
  a terminal entry only for prompt generation. This remediation increment adds
  the consolidated AAR and loop status; retroactive per-increment AARs would
  restate the changelog. Record and close.

- **Dedicated-evidence backlog (`compare-spec-code --dedicated`) — closed
  2026-10-20:** the detector (`scripts/compare-spec-code.ts:477-484`) flags
  bucket-C REQs whose exercised tests are shared with other REQs in Appendix F.
  It reports 131 REQs, not the three samples (REQ-415/T488, REQ-427/T509,
  REQ-463/T553) cited in the 2026-10-20 AAR. The report is intentionally
  report-only and over-flags ordinary multi-REQ test bundles; no gate consumes
  it. Record-and-close; re-open only if a dedicated-evidence gate is proposed.
  The resource-URI failure class it exposed is separately guarded by T665.

- **Competitor-learned architecture-isolation gate (L1)** (closed 2026-10-08,
  commit `fb861cf`): a module-import boundary gate generalizing REQ-492's
  causal-epistemic firewall (`spec/02-requirements.md:4000`, T582). Predicate:
  no boundary violation is present — the sole `@modelcontextprotocol/sdk`
  importer is `holonovel/src/index.ts:10-12`, and `holonovel/src` imports
  neither `holonovel/scripts`, `scripts/`, nor `spec/`. Boundary if promoted:
  B4 — transport-only (only `holonovel/src/index.ts` may import the SDK) +
  domain (`core/`, `world/`, `rulesets.ts`, `generated/`) may not import
  `index.ts` + runtime may not import build-time (`holonovel/scripts/`,
  `scripts/`) or `spec/`. Mechanism if promoted: custom TS script (TypeScript
  compiler API, no new dependency) as a `[gate]` wired into `check:fast`. No
  demonstrated recurrence → record and close; reopen and promote to P2 if a
  cross-layer import is ever introduced.

- **Competitor-learned modular NPC-mind slices (L4)** (closed 2026-10-08,
  commit `fb861cf`): decompose the NPC `mind` object into named, toggleable
  context slices. Predicate: `spec/02-requirements.md:1586-1587` (REQ-075f)
  defines `mind` as a flat `directive`/`private_journal`/`auto_play` triple.
  The monolithic form has no demonstrated failure, and the rpg-mcp comparison
  (server-bound-LLM prompt slices) conflicts with the local/offline design
  (REQ-504). No roadmap entry. Record and close; reopen only if a concrete
  per-NPC context-assembly need is demonstrated.

- **BD-9 retrieval-contract documentation (closed 2026-10-03):** heading-anchored
  chunking and hybrid retrieval are already satisfied by REQ-315a's full-heading
  index; no demonstrated failure, no action.



- **Guard-before-fix sequencing for single-source-a-gate plans** (closed
  2026-09-28): the Publish-Server recurrence guard (`scripts/check-workflows.ts`)
  was authored after the workflow fix, so its red dry-run had to be reproduced
  with a scoped `git stash`. A `plan-review` skill edit to order guard-before-fix
  was declined — one occurrence, no demonstrated recurrence. Record and close;
  reopen if a plan again reviews a fix whose guard step is authored after it.

- **Push-pipeline B4 — consolidate the step-5b Spec Update re-check** (closed
  2026-09-27): the pipeline's step 5b re-invokes `spec-delta` (~0.4 s) after
  step 5's generator already wrote the dated entry. That backstop is the
  Appendix V.4 guard against a hand-edited `**Spec hash:**` line; the saving
  does not justify weakening it. Record and close; reopen only if the backstop
  is shown reducible without loss.

- **Changed-REQ gap-audit gate (AAR follow-through G3)** (closed 2026-09-27):
  declined. A "changed REQ must carry a non-comment citation" predicate collides
  with the repo's comment-citation convention (78 bucket-C REQs are comment-only
  by design) and would over-flag; the report-only `compare-spec-code --dedicated`
  signal covers the class.
- **Deployed semantic evidence check (AAR follow-through G4)** (closed
  2026-09-27): push-pipeline step 9b already gates the deploy on implementation
  fingerprints (REQ-418); a deployed semantic check would require `--server-dir`
  plumbing in `compare-spec-code` to surface a report-only signal with no gate
  value. Reopen if a deployed-only conformance gap is demonstrated.
- **Spec-review 2026-09-27 SR-9 (passive-voice proofreading warnings)** (closed
  2026-09-27): 158 proofreading warnings, concentrated in §5.25–§5.33
  belief/identity REQs. Appendix M frames proofreading flags as pointers, not
  defects ("a flag is a pointer, not a verdict"); no demonstrated failure.
  Record and close; targeted rewrites are a future Could.

- **AAR follow-through deferred automation (E5, E6)** (closed 2026-09-27,
  intended-no-op): E5 (tool-action registry) has no canonical registry to check
  against and its target class — two contracts owning one action — is already
  covered by `scripts/action-conflicts.ts`; E6 (reading-guide coverage) is
  vacuous because the §5 section map is the canonical index and
  `checkSectionIndexCompleteness` already gates it.

- **Pipeline step-4 "full Build workflow required" flag** (`scripts/push-pipeline.sh
  --dry-run`, 2026-09-26): the step-4 message is REQ-314 rebuild-scoping output, not
  the REQ-394 pending-update block. The gate correctly permitted publication — the
  REQ-394 pending condition is a non-patch delta with *unchanged* fingerprints, and
  all five components had advanced. The confusing output came from the machine
  baseline (`.holonovel-state/pipeline-fingerprints.json`, `spec_hash 0a444e3b…`)
  lagging the hand-edited `**Spec hash:**` line in `holonovel/DECISIONS.md`
  (`88030ebd…`, commit `83f405e`). REQ-394 requires classifying against a
  machine-recorded baseline, never a hand-edited value, so the divergence is
  expected; a real pipeline run rewrites the baseline and self-heals. No
  demonstrated gate failure; reopen only if a Minor/Major delta with unchanged
  fingerprints is observed to publish. **Superseded 2026-10-25** — the
  baseline-lag reading was right for that occurrence, but two adjacent
  predicates were confirmed on a later recurrence (the advisory branch exited 0
  after reconciling before invocation, and the REQ-313a/REQ-314b DECISIONS
  record was never written). See the Resolved entry for REQ-394a/T84e.
- **Config drift + comment-only-citation false-C** (superseded 2026-09-26): the
  prior Closed-P3 dispositions for "pre-existing config drift" and "SC-7
  comment-only source citations" are withdrawn. The config items are fixed or
  dispositioned and gated (B1); the SC-7 12-REQ sample understated the class —
  the full audit found seven false-C REQs whose only exercised test asserted
  nothing relevant. This is a methodology finding: nominal evidence (an ID
  inside a bundled test name) is not evidence. Closed by the prevention
  mechanisms above.
- **DECISIONS.md gate-classification table absent** (content-integration scan,
  2026-09-04): RESOLVED 2026-09-25 — DECISIONS.md carries the REQ-137a table
  enumerating all 34 tools, and REQ-137b badge-filtered `tools/list` is
  implemented (the SDK ListTools handler is wrapped in `src/index.ts`); T151
  asserts both the table coverage and the filtered lists.
- **Uncoupled behavioral configs** (integration review, 2026-09-04): RESOLVED
  2026-09-08 — the ten listed configs are now all coupled or reclassified
  (P55–P59 coupling rows; TTRPG_WORLD_PROMINENCE / TTRPG_NOVEL_PREVIEW_CHARS
  reclassified non-behavioral; TTRPG_CLIMAX_ACCELERATION and
  TTRPG_SYNTHESIS_AUTO_TRIGGER had already gained P1 / P47 rows). See Resolved.
- **REQ-373 (dynamic tool registration) intended gap** — terminal builder-scope
  non-goal. The reference `holonovel` build registers ruleset-derived tools
  statically by design; the MCP SDK's runtime-registration capability is
  acknowledged and deliberately unused (the 2026-09-25 correction established
  the limitation is build scope, not stack capability). Recorded in
  `holonovel/DECISIONS.md` (a dated build record; the historical Waiver (5)
  entry is left immutable), dispositioned in `scripts/validate.ts`
  `INTENDED_GAP_CITED_DISPOSITIONS`, and exercised by T424's waiver branch. No
  re-activation trigger.
- **Counting-surface drift** (2026-09-08 evaluation, F3): the three prior
  instances (§5 index drift, build-phase-map subsection count, AGENTS.md
  tool-surface drift) are Resolved and now mechanically enforced
  (`checkSectionIndexCompleteness`, phase-map consistency, T511). The remaining
  manual count checks in the AGENTS.md before-commit checklist stay documented
  discipline; no demonstrated failure. Reopen only on a demonstrated count
  drift that escapes the enforced checks.
- **Redo-stack snapshot validator guard** — no demonstrated recurrence beyond
  the two fixed tools; reopen if a later bug demonstrates the class.
- **§6.6 REQ→S-ID cross-check validator** — the register correctly surfaced
  the REQ-192 gap without it; reopen only on demonstrated miss.
- **"Audit the §6.6 table" open-ended audit** — superseded by the REQ-192
  mapping fix; no demonstrated failure.
- **B3 — `narrative_world_model/` directory naming** (terminology sweep,
  2026-09-07): the vendor directory's name reads as the spatial "World" layer
  but holds narrative Ruleset Wisdom content (§11.4). Renaming ripples through
  §11.4, REQ-244a, and T541 (MANIFEST path). Deferred; a §11.4 gloss would be
  the low-cost alternative if the name causes a demonstrated misread.
- **B4 — bare "Wisdom" shorthand in §7.7 tables** (terminology sweep,
  2026-09-07): P5–P11 and §7.7.1a narrative cells shorten "Ruleset Wisdom" to
  "Wisdom" while the archetype keeps the full name; Appendix S already guards
  the D&D-stat collision. Consistent and low-risk; a table legend note is the
  optional mitigation.
- **C — "persona" prose senses** (terminology sweep, 2026-09-07): §8 uses
  "persona archetype" for verifier personae and §4 uses "system persona", both
  outside Appendix R's implementation-surface scope. No demonstrated failure;
  a §8 pointer distinguishing verifier-persona from the deprecated runtime
  sense is the optional mitigation.

- **Canonical tool-name guard (P7, review 2026-09-26): no automated guard added.**
  `scripts/validate.ts` already emits `termDrift` warnings against the §4
  Terminology table (`scripts/validate.ts:457-466,606`); the only recurrence was
  the 2026-09-25 terminology sweep (commit `acfc069`), and no bare-tool-name
  drift has been demonstrated since. Per AGENTS.md P3 ("open-ended 'worth a
  guard' with no demonstrated recurrence → record-and-close"), no gate is added.
  Reopen on a demonstrated bare `manage_X` reference where the canonical
  `manage_X (action: …)` form is required.

- **Unmodeled module scenery (P3, closed 2026-09-29):** module prose names
  body/map/console/notes/rig/rec table/footlocker/incubator/sample logs that
  are not declared as things, so `examine`/`open` refuse them —
  `greta-base.md:35,41,47,61,67,71,73` vs `holonovel/src/world/parser.ts:340`.
  The `curious` persona surfaced it as designed; fixture scope, not a server
  fault. Record-and-close; model the nouns if a richer parse surface is wanted.

- **`unlock` then `open` two-step (P3, closed 2026-09-29):** an unlocked door
  still refuses passage until an explicit `open`; recovered one turn later —
  `holonovel/src/world/parser.ts:298-300`. Minor UX friction, no failure.
  Record-and-close.

- **Player spatial-resolution surface (P3, closed 2026-09-29):**
  `run_command (action: resolve)` is GM-gated; the Player route is
  `run_command (action: suggest)`. This is the recorded Player-parser contract,
  not a defect in the matrix scope. Record-and-close.

- **List actions return bare JSON arrays (P3, closed 2026-09-29):** some
  management `list` actions return a JSON array without an `[OK]` envelope
  (e.g. `manage_vow list`). Consistent with the JSON-payload contract;
  record-and-close.

- **Panic/stress mechanics never exercised (P3, closed 2026-09-29):** the
  Mothership horror module produced no panic checks or stress resolution in any
  run, so the resolve surface was unexercised. Coverage note, not a defect.
  Record-and-close.

- **Script-quality report-only classes and residual helper duplication**
  (closed 2026-10-02; superseded): resolved by the 2026-10-02 script audit
  above — C2/C3/C4 promoted to hard checks, C4 narrowed to REQ-header-shape,
  the harness duplicates extracted, and the one intentional `doAction`
  divergence baselined.

- **`scripts/fingerprint.ts` removal candidate (resolved 2026-10-21):** the
  manual implementation-fingerprint inspection CLI was removed and its
  reachability allowlist entry retired. The capability remains in
  `scripts/lib/fingerprints.ts` (REQ-313a–d) and is consumed by
  `scripts/update-server.ts`.

- **Competitive report item 9 — VTT interop (closed 2026-10-24):** Edition 2
  rated a Foundry/VTT export bridge P3. Holonovel already exports portable,
  inspectable campaign files (`manage_novel (action: export)`, `SECURITY.md`
  data-ownership section), and no user request or demonstrated failure
  depends on a VTT-native protocol. A bridge adds a version-coupled external
  dependency for an unproven requirement. Record and close; reopen if VTT
  round-trip demand is demonstrated or a competitor ships portable
  bidirectional interop that Holonovel cannot match with file export.

- **Competitive report item 10 — Discord/webhook delivery (closed
  2026-10-24):** Edition 2 rated external chat delivery P3. The in-protocol
  event surface already ships (REQ-433a/b `manage_diagnostics (action:
  subscribe)` over MCP notifications, T519); pushing the same events to a
  third-party chat service is a client/host concern, not a server contract,
  and no demonstrated need exists. Record and close; reopen if an operator
  requests a non-MCP delivery channel.

- **Competitive report §13 — competitor runtime bake-off (closed
  2026-10-24):** Edition 2 named a [RT] bake-off of rpg-mcp, Grimoire, and
  worldstate as its highest-value next action. It requires running
  third-party servers (network installs, credentials, model bindings) and no
  Holonovel defect depends on the result; the P3 triage bar is a demonstrated
  failure, not an open-ended audit. Record and close; reopen if a competitor
  capability is observed that Holonovel lacks and cannot cover.

- **Publication-retry misclassification — withdrawn (2026-10-31):** an earlier
  finding from the same session claimed that once an aborted run advances the
  fingerprint baseline, a retry sees `changedCount 0` against a `major`
  delta class, is blocked as a silent-stale publication by
  `scripts/update-server.ts:279`, and then overwrites the recorded delta via
  `writeNoneDelta`. Both claims are false: `scripts/update-server.ts:219` exits
  earlier when `storedHash === currentHash`. Verified live on 2026-10-31 — the
  retry printed "Spec unchanged — no update needed", exit 0, baseline
  unchanged. No code change; the baseline restoration performed during the
  remediation was unnecessary and harmless.

## Deferred-by-user

- **Audit remediation publication (AU-3) — deferred 2026-10-24:** the operator
  authorized execution with "execute plan, don't publish". The code and spec
  changes were committed; push and deploy verification remain pending operator
  authorization. Evidence: `spec-update-record --check` still reports the
  unpublished delta.
