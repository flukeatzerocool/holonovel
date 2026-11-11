# Tasks — §5.10 world-model resources, suggest mapping, CRUD lifecycle

Dependency-ordered. Each task names its verification; a task is done when its
check passes, not when the edit lands.

## Phase 0 — Baseline, scaffold, and predicate re-check

- [x] T0.1 Move the drafted `plan.md`/`tasks.md` into
      `docs/plans/2026-11-11-5-10-world-model-resources-crud/` and add an
      `aar.md` scaffold ending `LOOP OPEN` (before any gate; a partial
      directory fails `check-loop-artifacts`).
- [x] T0.2 `npm run status` and `npm run check:fast` un-piped; record both in
      the scaffold (expectation: 40/40, `check:fast: PASS`).
- [x] T0.3 `npm --prefix holonovel run typecheck`; record exit status.
- [x] T0.4 Re-confirm predicates A–K (`plan.md` §3) with `grep -n`; drop any
      that already holds and record the evidence. Re-confirm the "holding" list
      (`worldKinds` sources, map adjacency).
- [x] T0.5 Run the baseline harnesses (`test:backfill`, `test:output-contracts`,
      `test:world-provider`, `test:world-remediation`); a red one is a P0 fixed
      first.
- [x] T0.6 Reconcile the Phase 1 assertions against Appendix F T241, T242,
      T245, T372; classify each clause **already stated** vs **new appendix
      clause** (known new: T241 two-level removal and reverse-exit removal;
      T245 bound-Player kinds omission and `trap`; T372 `by_source` and the
      `match_all` Player case).
- [x] T0.7 Sibling-contract grep for `world://map`, `world://kinds`, `room://`,
      `thing://`, `constraints://active`, `parser_commands`, `doorRefs`,
      `doorConnects`, and REQ-198/199/202a/202b/222b/309b/309g/325a; record the
      result.
- [x] T0.8 Grep `spec/audit/review-register.md` for each covered REQ ID, for
      F-P6a-12/13/14, and for `§5.10`; record the rows Phase 4 must rewrite.
- [x] T0.9 Repeat the `constraint_overrides` writer grep over `holonovel/src`
      and `holonovel/dist` (excluding type/reader sites) to confirm D6's "no
      writer" premise.

## Phase 1 — Red and regression tests

- [x] T1.1 Widen T241 (`holonovel/scripts/test-backfill.ts:444`): create
      `Vault`, `crown` (fixed: true), `chest` (container), `gem` (in chest), and
      `update_room`; assert reverse exit, `take crown` violation, `list` rooms
      with `exits`, `get <room>`, Player `[FORBIDDEN]`, `remove_exit` reverse
      removal, `remove_room` removing the two-level chain (`gem` in `chest` in
      `Vault`) and both-direction exits, binding-undo leaving no
      `doorRefs`/`doorConnects`, a mixed-case `create_exit` + `remove_exit`
      removing the reverse exit, `resources/read audit://novel` listing
      `create_room`, `create_thing`, `create_exit`, `update_room`,
      `remove_room`, `remove_exit` (read before undo), and undo restoring the
      room with contents. Check: `test:backfill` fails on the new positive
      assertions only.
- [x] T1.2 Widen T242 (`:455`): create `hall`/`gallery`, `oak key` in `hall`,
      door `create_thing (name: "oak door", kind: "door", location: "hall",
      locked: true, key: "oak key")`, bind via `create_exit (door: "oak
      door")`; blocked `command("go north")` from both sides; `command("unlock
      oak door with oak key")`; `undo` re-blocks; unlock, `command("open oak
      door")`, `go north` passes. No binding-undo here (T241 owns it). Check:
      same command.
- [x] T1.3 Widen T245 (`:501`): `manage_novel (action: create, name:
      "w10-res")` + switch; `manage_world (action: convert, source: <text>)`
      with the D2 fixture text (Hall, `@encounter` spill=3, `@trap` snuff=doom
      faces=2, `@npc Hall Warden`, `@lore`, open `chest` holding `gem`, closed
      `box` holding `rune`); assert the exact `**Annotations:**` line, open-
      container contents visible / closed-container contents not, `thing://`
      properties + `→` chain, Player exclusions (green guard), map annotations
      (Player absent, green guard), bound-Player `world://kinds` omission and
      GM/`none` inclusion; switch back. Check: same command.
- [x] T1.4 Widen the suggest case (`:520`): install a ruleset in
      `DATA_DIR/rulesets/<slug>` and bind it (the sequence near T255 at
      `:1608-1635`), create a Novel bound to it; Player result contains
      `run_command (action: resolve` and not `(action: execute`; GM contains
      both; the ruleset-free `bf2` Player keeps `(action: execute`; restore
      `bf2`. Check: same command.
- [x] T1.5 `test-world-provider.ts`: add `worldKinds("player", true)` omission,
      `worldKinds("player", false)` inclusion, and default GM case. Check:
      `test:world-provider` fails on the new positive case only.
- [x] T1.6 Widen T372 (`holonovel/scripts/test-output-contracts.ts:1575`):
      create a character, `set_active`; `manage_archive (action: export,
      format: "json", scope: "full")` returns bundle text; set
      `bundle.novel.constraint_overrides` to the three D6 entries, delete
      `bundle.integrity`, `manage_archive (action: import, mode: "replace",
      data: …)`; GM sees all three, Player with the first entity sees Knock +
      Darkvision, no-entity Player sees Darkvision only; GM `spec_health`
      `constraint_override_counts` = `{ total: 3, by_type: { door: 3 },
      by_source: { spell: 3 } }`; Player read is `undefined`. Check:
      `test:output-contracts` fails on the new assertions only.
- [x] T1.7 Run the three widened harnesses against the unmodified source and
      capture the failing positive assertions in `aar.md` before Phase 2; record
      the red set and the green guard set. Only the red set must fail pre-fix.

## Phase 2 — Resource payloads

- [x] T2.1 `world/model.ts`: `worldMap(world, badge = "game_master")` with the
      GM `## Annotations` section (D4); handler `mimeType` → `text/markdown`
      (Player view stays a plain list).
- [x] T2.2 `world/model.ts`: `worldKinds(badge = "game_master", rulesetBound =
      true)` omitting both parser sections for the bound Player (D5).
- [x] T2.3 `world/model.ts`: `containmentChain(world, thing)` — room terminal,
      cycle-safe (D3); add it (only it) to `index.ts`'s model import block.
- [x] T2.4 `index.ts` `room://`: D1 badge read and D2 payload.
- [x] T2.5 `index.ts` `thing://`: D1 badge read and D3 payload.
- [x] T2.6 `index.ts` `world://map` / `world://kinds`: pass
      `gameMaster ? "game_master" : "player"`, plus `rulesetBound =
      !!novel.ruleset` for kinds.
- [x] T2.7 `index.ts` `constraints://active`: D6 attribution filter (attributed
      + `match_all`; no active entity → `match_all` only);
      `spec_health.constraint_override_counts` → `{ total, by_type, by_source }`
      keyed by `type`/mechanic `source`.
- [x] T2.8 `core/state.ts`: add `entities?: string[]` to the override entry
      type; confirm the export/import round trip preserves it (T1.6 depends on
      it).
- [x] T2.9 Check: T1.3, T1.5, and T1.6 pass; `test:world-provider` stays green.

## Phase 3 — Suggest mapping and CRUD

- [x] T3.1 `index.ts` `spatialCmd`: Player/ruleset-bound returns
      `run_command (action: resolve, intent: "<intent>")`; GM adds a resolve
      entry beside the execute form (D7).
- [x] T3.2 `index.ts` `create_exit`: optional `door` argument (schema,
      description, validation, prior-binding clear, `doorRefs` on both rooms,
      `doorConnects` with canonical room names, canonical `exits` values); move
      `worldSnapshot()` after validation (D8).
- [x] T3.3 `index.ts` `remove_exit`: remove the destination's opposite exit only
      when it points back at the source; clear both `doorRefs` and
      `doorConnects` (D8).
- [x] T3.4 `index.ts` `remove_room`: fixpoint contents, both-direction exits,
      door cleanup (including a door in a surviving room), audit
      `{ name, things, exits, doors }` (D8).
- [x] T3.5 `index.ts` `update_room`: audit the changed fields and move
      `worldSnapshot()` after the not-found check (D8).
- [x] T3.6 `manage_world` schema/description updates for `door`.
- [x] T3.7 Check: T1.1, T1.2, and T1.4 pass.

## Phase 4 — Spec and registers

- [x] T4.1 `spec/appendices-reference.md`: rewrite T241, T242, T245, T372 with
      the new clauses from T0.6; replace superseded clauses (T242's undo-to-
      locked clause now covers the unlock step; T372's "only that override"
      becomes "attributed plus any `match_all`") rather than appending
      contradictions; leave T264 and T369 untouched.
- [x] T4.2 `spec/audit/review-register.md`: F-P6a-12/13/14 → new
      `### 2026-11-11 §5.10 resources, suggest, and CRUD` subsection under
      `## Resolved`, with post-change predicates and every covered REQ named;
      rewrite each moved row's `Scheduled under … §5.10` clause to "ROADMAP
      section deleted"; remove only the `## Scheduled-roadmap` chunk-P6a heading
      (`:1625`), not the identically titled `## Resolved` (`:370`) or
      `## Closed-P3` (`:2164`) headings; add `F-5.10-1` under a new
      `### 2026-11-11 §5.10 override hint envelope` subsection of
      `## Scheduled-roadmap`. Check: `check-registers`.
- [x] T4.3 `ROADMAP.md`: delete the §5.10 resources/CRUD section; add
      `## §5.10 constraint override hint envelope and REQ-325c Check (P1)`
      naming `F-5.10-1` with a trigger that closes when it is `Resolved`.
      Check: `npm run check-roadmap`.
- [x] T4.4 `npm run validate -- --write-register`; `check-registers`,
      `check-traceability`. Check: all PASS.
- [x] T4.5 Record D6's §7.7.0/Appendix M determination (no new surface, no
      fingerprint regeneration) in `aar.md` with its evidence line.

## Phase 5 — Generated surfaces and bookkeeping

- [x] T5.1 `check-tool-definitions-sync` → regenerate if it reports drift;
      `tool-definitions-lint`, `check-tdqs-scoreboard`. Check: all PASS.
- [x] T5.2 `check-world-provider`; regenerate through its emitter if D5 made
      the generated document stale. Check: PASS.
- [x] T5.3 `surface-budget` — `--write` only when the footprint moved; refresh
      the DECISIONS action/token counts. Check: PASS.
- [x] T5.4 `npm run assemble`; new `CHANGELOG.md` heading
      `## 2026-11-11 — §5.10 resources, suggest, and CRUD remediation`.
- [x] T5.5 `npm run build-order`. Check: completes.

## Phase 6 — Verify and close

- [x] T6.1 Run every command in `plan.md` §7; record outputs in `aar.md`.
- [x] T6.2 Replace the `aar.md` scaffold with the final AAR (done bar vs
      outcome, red/green table, gates, findings, `LOOP PAUSED`).
- [x] T6.3 `npm run session:close` → one commit.
