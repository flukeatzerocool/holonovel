# Tasks — Survivor race clock: the faction-clock gap

Dependency order. One commit (spec increment); evidence per step is recorded in
`aar.md`.

## Phase 0 — preflight

1. Record baseline: `git rev-parse --short HEAD` (`920b833`), `npm run status`
   (1 open roadmap item, 14 unpushed), `npm run check:fast` (37/0, PASS),
   `npm run playability -- --novel holonovel/content/torre-nosferatu.json`
   (`[clean]`). **Done.**
2. Measure the descent: 84 transitions on the winning path; The Candle 30 → 16
   (Baseline, plan.md). **Done.**
3. Write `plan.md` (approved revision 2) and this file.

## Phase 1 — mechanism

4. Enumerate at-risk harness assertions: `grep -rn "countdown"
   holonovel/scripts/test-*.ts` over every test that creates a faction; list
   each assertion that would see the new mirror. (`test-narrative.ts:287` is the
   first known contact.)
5. `holonovel/src/core/state.ts`: `FactionState.clock`/`clock_max` optional;
   `CountdownState.badge_scope` and `clock_type` (D7).
6. `holonovel/src/index.ts`: `hasFactionClock`, `advanceFactionClock`
   (clamp/sync/fill), `fillFactionClock` (D2, D3).
7. Route the four tick callers through the helper: transitions inside
   `advanceSceneTransitionCountdowns` (`:5911`), REQ-235 choices (`:3413`),
   REQ-338 autonomous (`:682`), P53 pacing.
8. `manage_faction`: create the mirror when `goals.length > 0`; `remove` deletes
   it; `update` clamps a reduced `clock_max`, re-derives `status`, re-syncs.
9. `manage_countdown (action: advance)`: faction mirror writes back and fills at
   zero instead of expiring (D5).
10. Guards: `[territorial]` line (`:842`), `save_context.faction_clocks`
    (`:10782`, null clocks), clockless factions skipped in every caller (D4).
11. Update the `manage_faction` and `manage_countdown` descriptions.

## Phase 2 — descriptive starter

12. Drop `clock`/`clock_max` from `factions[0]` in
    `holonovel/content/torre-nosferatu.source.json`.
13. Regenerate `holonovel/content/torre-nosferatu.json`
    (`npm run build:starter-novel`); confirm the diff is confined.

## Phase 3 — badge filter and spec

14. Player projection for `faction://` and `factions://` (D6).
15. `countdown://active` omits a `game_master` countdown for a Player (D7).
16. Re-confirm §7.7.0 and the clone/checkpoint/archive enumerations name no
    countdown sub-field before editing REQ-233b1 ("an optional progress clock"),
    then `npm run assemble && npm run validate --sdd-strict`.

## Phase 4 — evidence and registers

17. T269 in `holonovel/scripts/test-narrative.ts`: create/mirror, resource
    position, advance write-back, transition tick, `fast_forward` no-op, fill
    rotation + `health_warnings`, remove, Player projection, clockless faction,
    `save_context` null clocks.
18. T388: replace the vacuous assertions with a `faction://` clock read.
19. `generate-tool-definitions.ts`, `npm run assemble`,
    `npm run surface-budget -- --write`, sync the `DECISIONS.md` budget line,
    `npm run validate -- --write-register`, `npm run refresh-properties`.
20. Move the `Scheduled-roadmap` row to `Resolved`; delete the P3 ROADMAP
    section; add the dated `DECISIONS.md` entry.
21. CHANGELOG entry headed 2026-11-08 (agrees with the version and
    `session:close`'s default).

## Phase 5 — verification and close

22. `cd holonovel && npm run typecheck && npm run test:all`.
23. Root `npm run assemble && npm run check:fast`; `npm run check:conformance`;
    `npm run build-order`.
24. Write `aar.md` with the measured evidence and a terminal LOOP token.
25. `npm run session:close` (one commit). Do not push.
