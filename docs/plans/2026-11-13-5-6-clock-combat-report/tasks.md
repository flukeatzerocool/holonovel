# Tasks — §5.6 clock interaction models and audit-derived combat turn report

Increment: `docs/plans/2026-11-13-5-6-clock-combat-report/`
Plan: `plan.md` · AAR: `aar.md`
Status: complete (see aar.md)

## Phase 0 — baseline and probes

- [x] 0.1 Re-confirm baseline: `npm run status`, `git status --porcelain`,
      `npm run check:fast` (expect 41/41 and a trailing `check:fast: PASS`).
- [x] 0.2 `grep -rn "\[AUTO\]" holonovel/src holonovel/scripts` — expect 2
      sites (`index.ts:6917`, `test-adventure.ts:432`).
- [x] 0.3 `grep -rn "countdown://active" holonovel/scripts` — expect 4
      consumers in `run_ruleset_pattern_buffer.ts`.
- [x] 0.4 `grep -rn "T162\|T131" holonovel/scripts` — expect only
      `test-backfill.ts:431`.
- [x] 0.5 Sibling-contract probe: REQ-073c1/c2/c3, REQ-329a/b, REQ-322a–d,
      REQ-353, REQ-043a–g; record any second binder.
- [x] 0.6 File-surface probe: schema (`index.ts:8055`), handlers
      (`:8085-8150`), resource (`:14708`), briefing (`:16997`),
      `countdownDisplay` (`:3220`), `fireCountdown` (`:7156`), `advanceCombat`
      (`state.ts:2553`), resume (`:12637`), `buildSpecHealth` (`:13986`),
      `holonovel/tool-definitions.json`.
- [x] 0.7 Write the skeleton `aar.md`.

## Phase 1 — red probes

- [x] 1.1 Retitle `test-backfill.ts:431` to `T91/T043: …` (drop T131, T162).
- [x] 1.2 Add failing T271 assertions (racing win + tie, linked chain,
      tug retreat, mission decrement on resume).
- [x] 1.3 Add failing T54 assertions (round countdown per combat round;
      narrative countdown fires with an audit entry).
- [x] 1.4 Add failing T139 assertions (increment fires at total; decrement from
      3 fires at 0 with an audit entry; GM-only countdown hidden from Player
      briefing; remove does not fire).
- [x] 1.5 Add failing T110 assertions (two-participant turn order, briefing
      combat group with round and current participant, one full round advances
      the round, `manage_diagnostics (action: health)` reports
      `total_combat_rounds`, Player redaction, resolved-turn naming).
- [x] 1.6 Add failing T162 assertions (statless Bone Warden and danger `[auto]`
      with description, no mechanical change).
- [x] 1.7 `npm --prefix holonovel run test:backfill`; record the failing set;
      confirm `test:adventure` and `test:briefing` are green at baseline.

## Phase 2 — clock models

- [x] 2.1 `core/state.ts`: `Countdown.opposes`, `Countdown.linked_parent`.
- [x] 2.2 `index.ts` schema: `clock_type`, `opposes`, `link_countdown`,
      `retreat_countdown`, with descriptions.
- [x] 2.3 `set` handler: persist the new fields with omission preservation;
      validate link targets and symmetric `opposes`.
- [x] 2.4 `fireCountdown`: racing resolution (winner/tie) and linked child
      unlock + one tick.
- [x] 2.5 `advance` handler: `retreat_countdown` for tug clocks; locked-child
      `[STATE_CONFLICT]`.
- [x] 2.6 `manage_novel (action: resume)`: decrement-direction mission clocks.
- [x] 2.7 `countdown://active`: additive fields plus `linked_children`;
      briefing indents children.

## Phase 3 — combat turn report

- [x] 3.1 `state.ts`: audit-slice derivation, participant attribution, statless
      predicate, report formatter; `advance_combat` entry records the computed
      `statless`.
- [x] 3.2 `index.ts` `advance`: capture the resolved participant before the
      call, emit the report with lowercase `[auto]` and the description.
- [x] 3.3 `buildSpecHealth`: add `total_combat_rounds` (REQ-043d).
- [x] 3.4 `composeBadgeBriefing`: add the combat group (REQ-043e), omitted when
      no combat is active.
- [x] 3.5 Update `test-adventure.ts:432` to `[auto]`.

## Phase 4 — spec edits

- [x] 4.1 REQ-043f `_Check:_` re-point (T110, T161, T162; G2); record before
      and after character counts.
- [x] 4.2 Appendix F T139 row: split the decrement and increment readings.
- [x] 4.3 `holonovel/DECISIONS.md`: new `### Clock interaction models and combat
      turn report — 2026-11-13` section (mission direction, linked/racing
      semantics, report attribution), each with its REQ citation.

## Phase 5 — regeneration and gates

- [x] 5.1 `npm run assemble`
- [x] 5.2 `npm --prefix holonovel run generate-tool-definitions` then
      `npm run check-tool-definitions-sync`
- [x] 5.3 `npm run surface-budget -- --write`
- [x] 5.4 `npm run build-order` (fingerprint + version surfaces)
- [x] 5.5 `npm run validate -- --write-register`
- [x] 5.6 `npm run assemble && npm run check:fast` (un-piped; 0 errors)
- [x] 5.7 `npm run check` (full, proofreading pass)

## Phase 6 — registers, roadmap, changelog, AAR

- [x] 6.1 `spec/audit/review-register.md`: F-P3B1-6 and F-P3B1-7 `Resolved`;
      F-P3B1-9 reduced to T161 with the T25/T33 re-point and REQ-124 link.
- [x] 6.2 `ROADMAP.md`: amend the §5.6 close condition; add T131/T161 to the
      REQ-124 item.
- [x] 6.3 `CHANGELOG.md`: dated entry for the increment.
- [x] 6.4 `aar.md`: findings, gate evidence, terminal token.
- [x] 6.5 `npm run session:close` (spec increment, one commit).
