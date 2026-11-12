# Tasks — §5.6 entity, scene, and NPC-depth remediation

Derived from `plan.md` (sha256 `fcdf573b9fda091942daf0c20dbec0b08f09d49552e87cbf7a392625d2a8ead6`,
recomputed after any plan edit).
Each task names its design decision; a task is done when its verification line
in `plan.md` §6 is green. No task is checked until its assertion has been seen
red.

## Phase 0 — baseline and predecessor commit

- [x] T0.1 Commit the finished §5.6 adventure-content increment separately
  (`npm run session:close`); confirm a clean tree.
- [x] T0.2 Re-run `npm run check:fast` and record the pass count.
- [x] T0.3 Re-anchor every predicate in `plan.md` §1 against the post-commit
  tree; correct any that moved (the register's line numbers predate two
  increments).

## Phase 1 — red probes

- [x] T1.1 Write and observe red: roster duplicate import, `roster_list` field
  set, `roster://<type>`, removal audit and presence cleanup (D2, D3).
- [x] T1.2 Write and observe red: `party://current` HP, briefing party listing
  with `[not present]`, `presence` location parameter (D1).
- [x] T1.3 Write and observe red: scene-history truncation, `scene_tick` presence
  and reset, contradiction warning, fast-forward round countdowns and bridging
  summary (D4–D7).
- [x] T1.4 Write and observe red: `[recurring]`/`[campaign]`/`[distant]` markers,
  recap heatmap, unified description read, memory ingestion, `npc_memory_count`
  delta (D8–D11).
- [x] T1.5 Capture every red transcript for `aar.md`.

## Phase 2 — entity lifecycle and roster

- [x] T2.1 `roster_source_id` on import; duplicate `[STATE_CONFLICT]` with
  REQ-074c's hint; per-Novel scope asserted (D2).
- [x] T2.2 `removeEntity` helper: snapshot, delete, clear active, clear presence,
  audit; `roster_remove` audit and valid-ID enumeration (D3).
- [x] T2.3 `roster_list` returns id, name, race, class, level plus the
  empty-state marker (REQ-178a).
- [x] T2.4 `roster://class` and `roster://race` static resources ahead of the
  `roster://{id}` template; observe the resolution order red-first; confirm
  `roster://{id}` still returns full data (D2c, REQ-178b).

## Phase 3 — party and presence

- [x] T3.1 `presentEntityIds`/`setPresence` in `core/scene-ledger.ts`; route
  `party://current` and both briefing presence loops through it (D1).
- [x] T3.2 Derived `hp`/`max_hp` on `party://current`, omitted when the ruleset
  defines none (REQ-074b).
- [x] T3.3 Briefing party listing with `[not present]` and `last_location`;
  non-present `set_active` succeeds and the knowledge-state marker renders
  (REQ-307b).
- [x] T3.4 `manage_staging (action: presence)` gains `location`, audits, and
  routes through `setPresence`; `[]` marks all absent, all-IDs restores
  (REQ-307c).

## Phase 4 — scene ledger and tick

- [x] T4.1 `scene://history` cap via `TTRPG_SCENE_HISTORY_MAX` (default 50),
  suppressed count, `[truncated]` marker, badge filter first (D4).
- [x] T4.2 `scene_tick` on `NovelState`, serialize/deserialize default 0, reset
  on the `isTransition` branch, increment on combat round wrap, GM-only Scene
  rendering (D5).

## Phase 5 — lore contradiction warning

- [x] T5.1 `loreContradictionWarning` with the fixed antonym table and the
  disposition half of REQ-076b6 (D6).
- [x] T5.2 `manage_scene (action: set)` emits the advisory `[WARNING]` naming the
  lore entry; REQ-076b7's two acceptance calls asserted (D6).

## Phase 6 — fast-forward bridging

- [x] T6.1 Proportional `round` countdown advance (D7).
- [x] T6.2 Lore triggers in the audit entry; bridging summary in the entry and
  the response; `skip_countdowns` asserted both ways; undo restores (D7).

## Phase 7 — NPC depth metadata and recap heatmap

- [x] T7.1 Fields + old-save fixture round-trip; marker thresholds;
  `[distant]` derivation with the no-session-data guard (D8).
- [x] T7.2 Mutation gated on `opts.mutate` for the briefing site; double
  `get_context` render leaves `appearance_count` unchanged; scene-set then
  briefing render of the same scene increments once (D8 dedup).
- [x] T7.3 Recap heatmap block, GM-only, `appearance_count > 1` only (D9).

## Phase 8 — description unification and memory ingestion

- [x] T8.1 `npcDescription`/`setNpcDescription`; three read surfaces and two
  write paths; REQ-156 most-recent-wins order asserted (D10).
- [x] T8.2 Memory ingestion from the social-check and disposition-update paths;
  contacts gain apparent capabilities and relationship status (D11).
- [x] T8.3 Campaign-memory coupling on disposition flip, goal advancement, and
  relationship change; `npc_memory_count` before/after (D11).

## Phase 9 — registers, roadmap split, generated surfaces

- [x] T9.1 Move F-P3B2-1…8 to `Resolved` with current predicates; record the two
  corrected stale premises; point `:2054` at both roadmap sections.
- [x] T9.2 Retitle the ROADMAP section, add the F-P3B2-9…14 section with its own
  trigger; run `check-roadmap` and `check-registers`.
- [x] T9.3 Regenerate the coverage register, `tool-definitions.json`, and the
  DECISIONS action/token counts; run `surface-budget`.

## Phase 10 — gates

- [x] T10.1 Six harness suites, both typechecks, `surface-budget`, `check:fast`
  read from the un-piped command.
- [x] T10.2 Full `check` via `build-order`, with the review summary read.
- [x] T10.3 Write `aar.md` with red transcripts, deviations, and the terminal
  token.
