# AAR — §5.6 clock interaction models and audit-derived combat turn report

Increment: `docs/plans/2026-11-13-5-6-clock-combat-report/`
Plan: `plan.md` (plus §13 amendments) · Tasks: `tasks.md`
Terminal token: **LOOP OPEN**

## What shipped

- `manage_countdown` clock interaction models: `clock_type`, `opposes`,
  `link_countdown`, `retreat_countdown`; racing win/tie, linked lock/unlock +
  tick with indented chain rendering, tug-of-war retreat clamping at zero, and a
  direction-aware mission clock tick on `manage_novel (action: resume)`.
  `countdown://active` carries the new fields and `linked_children`.
- `manage_combat (action: advance)` audit-derived turn report: resolved
  participant, actions/rolls/state changes, "took no action", lowercase `[auto]`
  for statless participants with their description, `total_combat_rounds` in
  `spec_health`, and the `badge_briefing` combat group (REQ-043e) replacing the
  single summary line.
- Citations: T271, T54, T139, T110, T162 now exercise real behaviour in
  `holonovel/scripts/test-backfill.ts`; the false-token title is retitled; T25/T33
  leave REQ-043f; T161 stays scheduled with REQ-124.
- Regenerated: `tool-definitions.json`, contract fingerprint,
  `req-coverage.md`, `tool-surface-baseline.json`, `build-phase-map.md` hash,
  starter Novel, and the CalVer surfaces.

## Evidence

| Gate | Result |
|---|---|
| `npm --prefix holonovel run test:backfill` | 115 passed, 0 failed (110 baseline → +5 new assertions) |
| `test:adventure` | 27 passed, 0 failed (baseline 27) |
| `test:briefing` | 25 passed, 0 failed (baseline 25) |
| `test:narrative` | 83 passed, 0 failed |
| `test:hazard` | 13 passed, 0 failed |
| `test:limits` | 28 passed, 0 failed |
| `test:workflow` | 14 passed, 0 failed |
| `run_ruleset_pattern_buffer.ts` | PASS (all blocking sub-workflows) |
| `tsc --noEmit` (holonovel) | exit 0 |
| `npm run check-playability` | PASS, 4 Novels |
| `npm run check-registers` | PASS |
| `npm run surface-budget` | PASS (full 29192, standard 25593) |
| `npm --prefix holonovel run test:all` | **49 passed, 7 failed — all pre-existing** (reproduced on the stashed HEAD `26cf82c`: fingerprints 5, identity 1, conformance 5, novel 8, invariants 6, adversarial 7, differential 2); scheduled as ROADMAP *Pre-existing server-suite reds* |

Red evidence: the five new/changed assertions failed before implementation —
`T271` (no clock models), `T54` (not yet? see note), `T139`, `T110`
(no `### Combat` group), `T162`/`T56` (uppercase `[AUTO]`, next-participant
naming). The recorded `check:fast` red run is in the session log.

Note: T54 passed at the red stage because round-countdown ticking already
existed; it is retained as the citation's real assertion rather than a
behaviour change.

## Deviations

- **A1 (plan §13): T56's `[auto]` expectation.** T56 drives a *statted* NPC;
  REQ-043c reserves `[auto]` for statless participants. The assertion now checks
  the turn line plus "took no action". Test subject unchanged.
- **A2:** racing tests create both clocks before linking (`opposes` refuses an
  unknown target).
- **A3:** the tug retreat assertion reads the response, because
  `countdown://active` hides zero-tick clocks.
- **A4:** one `check-playability` red observed under `build-order`
  (`harbor-lights` imported with only `character_01`); standalone rerun passes.
  Not reproduced; carried as an observation.
- **D6 normative deviation:** mission auto-decrement applies to
  decrement-direction clocks only; recorded in `holonovel/DECISIONS.md` and
  repeated here as the plan's condition C-3 requires.

## Findings and dispositions

| Finding | Class | Disposition |
|---|---|---|
| F-P3B1-6 (clock models) | P1 | `Resolved` — register entry + T271 |
| F-P3B1-7 (combat report) | P1 | `Resolved` — register entry + T110/T162 |
| F-P3B1-9 reduced to T161 | P1 | `Scheduled-roadmap` — ROADMAP §5.6 bullet, REQ-124 item owns T131/T161 |
| REQ-073a1 "mission parameters" clause undefined | P3 | Recorded in DECISIONS; no code change possible without a defined surface |
| `check-playability` single red under build-order | P3 | Record-and-close (A4); standalone green, no recurrence |
| T139 catalogue contradiction | P2 (demonstrated by this increment's test) | `Resolved` — Appendix F row split into decrement and increment readings |
| Pre-existing `test:all` reds (fingerprint staleness cleared by migration; holosuite anchor drift; T772 nondeterminism) | P1, pre-existing | `Scheduled-roadmap` — new `ROADMAP.md` *Pre-existing server-suite reds* item (A5) |

## Loop status

Gates for this increment are green (`check:fast: PASS`, `build-order` OK,
`test:backfill` 115/115, affected harnesses green). The only open item is the
pre-existing `test:all` red set, scheduled on `ROADMAP.md` in this increment and
reproduced at HEAD before any edit.

LOOP OPEN — action item: *Pre-existing server-suite reds (P1)* on `ROADMAP.md`.
