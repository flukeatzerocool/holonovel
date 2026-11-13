# Tasks — §5.6 typed recap payload remediation

Increment: `docs/plans/2026-11-12-5-6-recap-typed-payload/`
Plan: `plan.md` · AAR: `aar.md`
Status: complete (see aar.md)

## Phase 0 — baseline and probes

- [x] 0.1 `npm run check:fast` (expect 41/41, trailing PASS); record the count.
- [x] 0.2 Run the eleven harness baselines: `test:output-contracts`,
      `test:backfill`, `test:lean-narrator`, `test:workflow`,
      `test:memory-recall`, `test:limits`, `test:security`,
      `test:tool-definitions`, `test:competitive-gaps`, `test:holosuite-novel`,
      `test:pattern-buffer-ruleset`; record per-suite pass counts in `aar.md`.
- [x] 0.3 Field-source probe: confirm each D2 row's source and badge filter in
      `holonovel/src/index.ts` / `core/state.ts`.
- [x] 0.4 Text-consumer inventory: one `grep` over the eleven assertion sites in seven files named in
      D1; record the count; confirm none needs an edit to keep passing.
- [x] 0.5 Roster-source probe: creation sites audit nothing (`:4716-4762`);
      `removeEntity` (`:4640`) and NPC paths (`:7787`, `:7832`) do;
      `state.ts:2423` counts tool names nothing writes.
- [x] 0.6 Sibling-contract probe: REQ-072a1–i, REQ-174a/b, REQ-175a/b,
      REQ-239b, REQ-279a–c, REQ-592 are the expected binders of
      `manage_context (action: recap)`; a binder outside that set is a scope
      change resolved before the first edit.
- [x] 0.7 File-surface probe: description and registration in `index.ts`;
      `core/server.ts:62-63` reads `structuredContent.category`/`.status` and
      must be unaffected; regenerated `tool-definitions.json` and the surface
      baseline; the Phase 5 assertions.
- [x] 0.8 Death-condition passthrough probe: `rulesets.hydrate(slug).model`
      preserves an undeclared `death_condition` key from a fixture
      `model.json`; if not, fall back to the no-declaration rule and record it.
- [x] 0.9 Audit-length probe: `grep -n "audit_log.length" holonovel/scripts`
      for assertions that would move when creation is audited.
- [x] 0.10 Write `tasks.md` (this file) and the skeleton `aar.md`.

## Phase 1 — red probes

- [x] 1.1 T53 red: 15 declared fields absent from the recap's structure.
- [x] 1.2 T212 red: no entity status at all; no death-condition rule.
- [x] 1.3 T214 red: `confrontations_completed` is a count, not objects.
- [x] 1.4 Unknown `session_id` returns `ok` with "not found", not
      `[ERROR] [NOT_FOUND]`.
- [x] 1.5 `roster_changes` has no created source (creation is unaudited).
- [x] 1.6 A grounded recap loses nothing today; assert `grounding` survives on
      the `okWith` path before the helper replaces `ok` (B2).
- [x] 1.7 Copy every red transcript into `aar.md`.

## Phase 2 — payload builder

- [x] 2.1 `okWith(text, fields)` helper beside `ok()`.
- [x] 2.2 Extract `buildRecapPayload(novel, entries, opts)`; keep the existing
      text renderer byte-identical where no field changed.
- [x] 2.3 Implement the 15 fields (D2) with typed nulls/empties (REQ-072d) and the D2a audit-row mapping for roster_changes/condition_changes.
- [x] 2.4 Badge filter computed once (`isGM`) and applied per D2.
- [x] 2.5 Attach the payload at all three returns: scoped, Lonelog, default.

## Phase 3 — status and confrontations

- [x] 3.1 `entityStatus(entity, novel)`: death condition applied → `dead`;
      HP > 0 → `alive`; HP 0 with a declaration → `unconscious`; no
      declaration → `incapacitated`.
- [x] 3.2 Death-condition lookup: `model.death_condition`, alias
      `model.concepts_death_condition`.
- [x] 3.3 Confrontation pairing: init/advance/end over the scoped entries;
      `rounds = endEntry.args.rounds_played ?? ceil(advances / participants)`;
      participants = entity ids + danger names.
- [x] 3.4 Pending object `{participants, round, turn_position}` from
      `novel.combat`; null when not active.
- [x] 3.5 T212 fixture ruleset model declaring `death_condition`.

## Phase 4 — scoping, refusal, audits

- [x] 4.1 Scoped payload for a live `session_id` (timespan from the marker).
- [x] 4.2 Archived-session payload: summary aggregates, arrays `[]`/null.
- [x] 4.3 Unknown `session_id` → `err("NOT_FOUND", …)` enumerating live and
      archived IDs in log order.
- [x] 4.4 `audit("create_character"…)` at `:4759` and `:4804`;
      `audit("import_character"…)` at `:4855`; all before `saveNovel()`.

## Phase 5 — assertions, registers, roadmap, generated surfaces

- [x] 5.1 Write T53 (`test-output-contracts.ts`): 15 fields, types, bounds
      errors, GM/Player filter, text-payload parity.
- [x] 5.2 Write T212 (`test-output-contracts.ts`): status matrix, two ruleset
      fixtures.
- [x] 5.3 Widen T214: typed completed entries (`rounds: 2`, outcome) and the
      pending object with `turn_position`.
- [x] 5.4 Widen T215 (`test-backfill.ts`): 15 fields, ISO/null timespans; drop
      the uncatalogued `T072` and the Manual `T261` from the title.
- [x] 5.5 Review register: F-P3B1-3 `Resolved`; F-P3B1-9 narrowed to the seven
      deferred rows; chunk P3b-1 cross-reference updated.
- [x] 5.6 `ROADMAP.md`: retitle and rescope to F-P3B1-6/-7 plus seven citations;
      rewrite the trigger.
- [x] 5.7 `spec/02-requirements.md` REQ-072c1 `string fields` → `typed fields`; REQ-175a gains the `rounds_played` round source; REQ-175b scopes its empty-array sentence.
- [x] 5.8 Appendix F: T53 (15 fields, four statuses), T212, T214, T215 row text per D7b.
- [x] 5.9 `npm run validate -- --write-register`; regenerate
      `tool-definitions.json`; `surface-budget --write` and DECISIONS counts
      only if the footprint moved.
- [x] 5.10 `check-roadmap`, `check-registers`, `validate` immediately after the
      register/REQ/Appendix edits.

## Phase 6 — gates

- [x] 6.1 `npm run assemble`.
- [x] 6.2 `npm run check:fast` (un-piped; read the trailing line).
- [x] 6.3 Eleven harness suites green.
- [x] 6.4 `npm run typecheck` and `npm --prefix holonovel run typecheck`.
- [x] 6.5 `npm run surface-budget`.
- [x] 6.6 `npm run build-order`; read the check summary.

## Close

- [x] 7.1 Replace the skeleton `aar.md`; end `LOOP PAUSED` or `LOOP OPEN`.
- [x] 7.2 Confirm the roadmap section that stays open names only deferred work.
- [x] 7.3 `npm run session:close` (one commit, dated CHANGELOG heading).
