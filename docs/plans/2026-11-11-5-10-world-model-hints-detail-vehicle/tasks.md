# Tasks — §5.10 hints, detail signal, vehicle traversal

Dependency-ordered. Each task names its verification; a task is done when its
check passes, not when the edit lands.

## Phase 0 — Baseline and predicate re-check

- [x] T0.1 `npm run status` and `npm run check:fast` un-piped; record both in
      `aar.md` (expectation: 40/40, `check:fast: PASS`).
- [x] T0.2 Re-confirm predicates A–L (`plan.md` §3) with `grep -n`; drop any
      that already holds and record the evidence. H is already withdrawn; keep
      it withdrawn.
- [x] T0.3 Run the baseline harnesses (`test:backfill`, `test:output-contracts`,
      `test:world-remediation`, `test:adventure`, `test:narrative`); a red one
      is a P0 fixed first. Reconcile the Phase 1 assertions against Appendix F
      T354 and T362 and record which clause each assertion adds.
- [x] T0.4 Confirm the target increment directory does not exist and that this
      draft lives in the gitignored `plans/` tree.
- [x] T0.5 Sibling-contract grep over the REQ corpus for `hint`, `Hint:`,
      `detail`, `Player-Detail`, `vehicle`, `capacity`, `in_vehicle`, and the
      covered REQ IDs; record the result.
- [x] T0.6 Grep the whole `spec/audit/review-register.md` for each covered REQ
      ID and for F-P6a-8/9/10; only those three rows may cite them.
- [x] T0.7 Measure REQ-284b's pre-edit body with `extractReqBodies`; record the
      count for the D2 amendment budget (≤800 chars / ≤8 sentences).

## Phase 1 — Red tests

- [x] T1.1 Widen T354 in `holonovel/scripts/test-output-contracts.ts:1536`:
      locked `open` → `[ERROR] [RULE_VIOLATION]` plus the literal
      `Hint: You need the iron key (Hall) first.` line; no key → no `Hint:`
      line; `read` on an inscription in a closed glass jar → the jar hint;
      `enter raft` with the raft one room north through an open exit → the
      pinned `Hint: The raft is in the Shore (north) — go north first.` line;
      `enter nonexistent` → `[NOT_FOUND]` and `enter rock` → `[RULE_VIOLATION]`
      still hold; switched-off lantern → no hint; container in an adjacent room
      → no hint. Check: `test:output-contracts` fails on the new assertions
      only.
- [x] T1.2 Widen T240 (`test-output-contracts.ts:1438`): `signal detail=terse`
      forces brief `look`, reports `spec_health.detail_level`, and renders
      `**Player-Detail:** terse`; `detail=rich` after `brief` returns the full
      description and appends a `[lore]` notice when a lore entry becomes
      newly active; `rich` → `normal` restores `brief` without a prior `terse`;
      `rich` → `terse` → `normal` restores `brief`, not the forced `verbose`;
      `normal` after `terse` restores a previously set `verbose`; invalid
      value → `[INVALID_INPUT]` naming the three values. Check: fails pre-fix.
- [x] T1.3 Widen T362 in `holonovel/scripts/test-backfill.ts:745`: a
      CRUD-created vehicle carries `capacity: 4` and the parser rejects a fifth
      passenger; passenger movement on `go north`; closed-door block; interior
      `look`/`out`; no interior node in `world://map`; `[vehicle-entry]`
      carries the interior description; recap `scene_transition`; `### Vehicle`
      briefing block. Check: fails pre-fix.
- [x] T1.4 Copy the pre-fix failure output into `aar.md`.

## Phase 2 — Parser hints

- [x] T2.1 Add `hintLine` and `isHintReachable`; rebuild `findUnlockHint` on
      them so a closed container is not hint-reachable; add the adjacency scan
      helper with the pinned wording (D1). Check: `npm run typecheck`.
- [x] T2.2 `handleOpen`: locked → `ERROR`/`RULE_VIOLATION` with the hint
      appended to `text`; `handleUnlock`/`handleLock` keep `[WARNING]` for a
      bound, uncarried key and `[OK]` for the free case (D2). Check: T1.1 and
      T553 pass.
- [x] T2.3 `handleRead`: resolve only reachable things; closed-container
      readable → `ERROR`/`RULE_VIOLATION` plus the jar hint.
      Check: T1.1 subset passes.
- [x] T2.4 `handleEnter`/`handleClimb`: keep the existing `[NOT_FOUND]` and
      `[RULE_VIOLATION]` results; append the adjacency hint only when the
      requested vehicle/climbable is one open exit away. No hint for containers
      or a switched-off lantern. Check: T1.1 subset passes.

## Phase 3 — Detail level and briefing

- [x] T3.1 Replace `outputVerbosity` with `detailLevel: terse|normal|rich` and
      a separate `chosenRoomDescriptionMode`; `terseMode` derives from the
      level; `spec_health` reports `verbosity_mode`, `description_mode`
      (effective), and `detail_level` (D3). Check: typecheck; T313 stays green.
- [x] T3.2 Add `detail` to the signal enum and validate the value in the
      handler; set the level only, leaving the chosen mode untouched (D3).
      Check: T1.2 subset passes, including the `rich→normal` and
      `rich→terse→normal` assertions.
- [x] T3.3 Map `manage_diagnostics (action: verbosity)` onto `detailLevel`;
      confirm which of the two `verbosity` action enums is live
      (`:10052-10053`, `:10083`) and update both enumerations and
      descriptions.
- [x] T3.4 `run_command`: append `[lore]` notices when `detailLevel === "rich"`
      by diffing the active-lore key set before and after dispatch.
- [x] T3.5 `badge_briefing`: `**Player-Detail:** <level>` and the `### Vehicle`
      block in the never-truncated tier after `composeBadgeOrientation` (D4,
      D8); confirm both survive the `prompt_inputs` fallback. Check: T1.2
      passes.

## Phase 4 — Vehicles

- [x] T4.1 `create_thing`/`update_thing`: shared `DEFAULT_VEHICLE_CAPACITY`
      (4) for `kind: "vehicle"` plus an optional `capacity` argument; no
      duplicate capacity check in the `enter` branch (D5).
      Check: typecheck; T1.3 capacity clause passes.
- [x] T4.2 Aboard movement: door check against the parked room's `doorRefs`,
      passenger `current_room` updates, hazards retained (D6).
      Check: T1.3 subset passes.
- [x] T4.3 `recordVehicleMoment` carries the interior description; `recap`
      derives vehicle `scene_transitions` for every badge (D8).
      Check: T1.3 passes.

## Phase 5 — Spec and bookkeeping

- [x] T5.1 Amend REQ-284b's second example (`unlock` → `open`), walk the
      Appendix M checklist, re-measure the body (D2).
- [x] T5.2 Widen Appendix F T240 (detail signal) and T362 (capacity,
      door-blocked movement, interior-map exclusion); verify T354 unchanged.
- [x] T5.3 `npm run validate --sdd-strict` → 0 errors.
- [x] T5.4 Move F-P6a-8, F-P6a-9, F-P6a-10 to the Resolved section with
      post-change predicates; leave F-P6a-12/13/14 scheduled.
- [x] T5.5 Delete the first §5.10 roadmap bullet; rewrite the trigger to close
      on F-P6a-12/13/14. Check: `npm run check-roadmap`.
- [x] T5.6 `npm run validate -- --write-register`; `npm run check-registers`.
- [x] T5.7 Regenerate tool definitions if D5 moved the surface;
      `check-tool-definitions-sync`, `tool-definitions-lint`,
      `check-tdqs-scoreboard`, `surface-budget`.
- [x] T5.8 New top `CHANGELOG.md` heading naming the REQ-284b amendment.
- [x] T5.9 `npm run build-order`.

## Phase 6 — Verify and close

- [x] T6.1 Run every command in `plan.md` §7.
- [x] T6.2 Write `aar.md` with the red-test record, the re-audit outcomes, the
      REQ-284b measurement, and the terminal token.
- [x] T6.3 `npm run session:close`; report the commit list.
