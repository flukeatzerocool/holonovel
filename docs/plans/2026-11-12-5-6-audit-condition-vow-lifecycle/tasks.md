# Tasks — §5.6 audit, condition, and vow lifecycle remediation

Dependency-ordered. Each task names its done signal. Phases mirror `plan.md` §5.

## Phase 0 — baseline and roadmap truth repair

- [x] 0.1 `npm run check:fast` on the clean tree; record the pass count and the
      trailing `check:fast: PASS` line. **Done:** count recorded in `aar.md`.
- [x] 0.2 Run `test:output-contracts`, `test:persistence-guardrails`,
      `test:narrative`, `test:persistence`, `test:security`,
      `test:tool-definitions`; record each pass/fail count. **Done:** six
      baselines recorded; any pre-existing failure named, not inherited.
- [x] 0.3 Re-anchor every `index.ts`/`core/state.ts` line cited in `plan.md` §1
      against the current tree. **Done:** predicates confirmed or corrected in
      the same commit that touches them.
- [x] 0.4 Remove the stale *§5.6 entity, scene, and NPC-depth remediation (P1)*
      section from `ROADMAP.md`; add the CHANGELOG bullet. **Done:**
      `npm run check-roadmap` passes.
- [x] 0.5 Write this task list and a skeleton `aar.md` (`Status: in progress`,
      ending `LOOP OPEN`), so `check-loop-artifacts` stays green mid-session.
      **Done:** both files present.
- [x] 0.6 Sibling-contract probe: grep `manage_condition`/`manage_vow` across
      `spec/02-requirements.md`; record the binder set (expected REQ-206,
      REQ-217a–d, REQ-289a–e, REQ-322a–d). **Done:** any surprise REQ resolved
      before the first edit.
- [x] 0.7 File-surface probe: registration + description, generated tool
      definitions, surface baseline, DECISIONS counts, harness assertions,
      gates. **Done:** six surfaces confirmed.
- [x] 0.8 Reconcile existing expectations: `test-narrative.ts:1006-1013`
      (ungated resolve) and `test-output-contracts.ts:829-842` (T369 ticks);
      Appendix F's T335 row is the third and is amended in Phase 5.
      **Done:** both Phase 0 amendments recorded in `aar.md`.

## Phase 1 — red probes

- [x] 1.1 T258: Player apply/remove on the active entity succeeds; Player apply
      on another entity returns `[FORBIDDEN]` with the target ID; Observer is
      refused. **Done:** observed red and transcript saved.
- [x] 1.2 Audit assertions: `apply_condition`/`remove_condition` entries exist;
      duplicate apply writes none. **Done:** observed red.
- [x] 1.3 T8: `set_badge` entry carries `from`/`to`; undo after a switch leaves
      the badge alone. **Done:** observed red (or recorded as already-satisfied
      evidence with the structural argument).
- [x] 1.4 Fresh process, `TTRPG_MAX_SNAPSHOT_DEPTH=10`, 11 `manage_scene`
      mutations: the `[snapshot-truncated]` count delta is one and the chain
      verifies. **Done:** observed red.
- [x] 1.4b A filled vow clock renders `filled`/`full` in the thread and recap
      lines, and a same-scene open decision survives a vow consequence.
      **Done:** observed red.
- [x] 1.5 T335: incomplete `resolve` → `[STATE_CONFLICT]`; complete resolve
      writes the consequence entry and removes `vow:<name>`; `forsake` renders
      `[vow-forsaken]`. **Done:** observed red.
- [x] 1.6 Vow audit: four mutations produce four entries. **Done:** observed
      red.

## Phase 2 — conditions

- [x] 2.1 `canMutateCondition(entityId, novel)` helper; replace both
      `requireGM()` calls. **Done:** T258 Player branches pass.
- [x] 2.2 `audit("apply_condition"|"remove_condition", …)` after the mutation,
      before save. **Done:** audit assertions pass.
- [x] 2.3 Update the `manage_condition` description. **Done:**
      `check-tool-definitions-sync` reports drift; regenerate in Phase 5.

## Phase 3 — audit gaps

- [x] 3.1 `set_badge` captures `previous` and audits `{from, to}`. **Done:** T8
      green.
- [x] 3.2 Extract `appendAuditEntry` from `StateManager.audit`; `snapshot()`
      appends `[snapshot-truncated]` with `discarded_timestamp`. **Done:** T10
      green, chain verification green.
- [x] 3.3 Confirm read-only renders write nothing (double `get_context` leaves
      the audit log length unchanged). **Done:** asserted in T10.

## Phase 4 — vow lifecycle

- [x] 4.0 `DIFFICULTY_TRACKS` corrected to 10/20/30/40/50 (REQ-289b); the
      update path preserves `rank_track` on a same-difficulty re-set; `set`
      response and `manage_vow` description follow. **Done:** a `dangerous`
      vow carries 20 milestones and a 20-tick suggestion; an 8-track re-set
      with the same difficulty stays 8.
- [x] 4.1 Complete-track or filled-countdown eligibility on `resolve`;
      `[STATE_CONFLICT]` names remaining milestones/ticks. **Done:** T335
      refusal branch green.
- [x] 4.2 Milestone fill clamps `ticks` to `total` and keeps the countdown;
      `resolve`/`forsake` delete `vow:<name>` and audit the removal. **Done:**
      widened T369 green.
- [x] 4.3 `resolve` with `consequences` writes one `consequence` story entry
      anchored `vow:<name>`. **Done:** T335 green, decision-survival
      assertion green.
- [x] 4.4 Forsaken/resolved rendering in narrative threads and
      `narrative_orientation`, including `[vow-forsaken]`. **Done:** T335
      green.
- [x] 4.5 Five vow audit calls (`set_vow`, `advance_vow`, `resolve_vow`,
      `forsake_vow`, `vow_countdown_removed`). **Done:** audit assertions
      green.
- [x] 4.6 Update the `manage_vow` description. **Done:** drift reported for
      Phase 5.

## Phase 5 — registers, roadmap, generated surfaces

- [x] 5.1 Review register: F-P3B1-4/-5/-8 `Resolved`; F-P3B1-9 narrowed to
      seven citations; chunk P3b-1 cross-reference updated. **Done:**
      `npm run check-registers` passes.
- [x] 5.2 `ROADMAP.md`: retitle/narrow the surviving §5.6 section to
      F-P3B1-3/-6/-7 and the nine citations with its trigger; amend Appendix
      F's T335 row for the gate and refusal. **Done:**
      `check-roadmap` passes.
- [x] 5.3 `npm run validate -- --write-register`; regenerate
      `tool-definitions.json`; `npm run surface-budget --write` and refresh
      DECISIONS counts only if the baseline moved. **Done:** the three
      freshness gates pass.

## Phase 6 — gates

- [x] 6.1 `npm run assemble`. **Done:** assembled spec current.
- [x] 6.2 Six harness suites, root and server `typecheck`. **Done:** all pass.
- [x] 6.3 `npm run check:fast`, un-piped, trailing PASS read. **Done:** green.
- [x] 6.4 `npm run build-order`; read the `N error(s), M warning(s)` summary.
      **Done:** green with no new warning class.
- [x] 6.5 Write `aar.md` with red transcripts, deviations, and the terminal
      `LOOP PAUSED` or `LOOP OPEN`.
