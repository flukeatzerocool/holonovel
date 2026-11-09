# AAR — Survivor race clock: the faction-clock gap (REQ-233)

Session 2026-11-08. Base HEAD `920b833`. One spec increment, one commit.
Plan revision 2 plus `delta-1.md` (three execution deltas), approved with
conditions C-1/C-2/C-3.

## What happened

1. **Baseline.** `check:fast` 37/0 `PASS`; `test:narrative` 61/0; `test:graph`
   5/0; `test:memory-recall` 15/0; `test:competitive-gaps` 28/0;
   `test:starter-novel` 15/0; `playability --novel torre-nosferatu` `[clean]`.
   Winning descent measured at 84 transitions with `buildWorldModel` /
   `findWinningPath` (The Candle 30 → 16).
2. **C-1 enumeration.** Two harnesses create a faction and read countdowns:
   `test-narrative.ts:706` (T413, `assertContains` only) and
   `test-competitive-gaps.ts` (notification topics). Neither counts countdowns,
   so the auto-created mirror is additive; `test-tool-definitions` reads action
   enums only.
3. **delta-1 (three plan corrections, self-reviewed, re-stamped).** The mirror
   keeps `type: "narrative"` with a `fast_forward` skip instead of widening the
   persisted union; the Player projection is `id`/`name`/`description` on all
   three surfaces; `manage_faction (action: list)`'s summary branch was a third
   leak.
4. **Mechanism.** `advanceFactionClock` is the single writer (clamp → sync →
   fill) for transitions (`advanceSceneTransitionCountdowns`), REQ-235 choices,
   REQ-338 autonomous ticks, and P53 pacing; the mirror is created on a
   create-with-goals, deleted on remove, re-synced on update; a fill rotates
   `status`, resets the clock, and pushes a session-scoped notice into
   `spec_health.health_warnings` (GM only). `fast_forward` skips faction clocks.
5. **Descriptive starter.** `clock`/`clock_max` removed from The Survivors;
   the regenerated artifact diff is confined to those two keys plus the
   data-format stamp.
6. **Badge projection.** `faction://`, `factions://`, and both
   `manage_faction (action: list)` branches project for a Player;
   `countdown://active` honors `badge_scope`.
7. **Spec and evidence.** REQ-233b1 "an optional progress clock"; T269 (eight
   assertions) and a real T388 clock read; 22 Holosuite anchors repointed.
8. **Regeneration and registers.** Tool definitions, surface baseline
   (28,051 / 24,452 tokens), DECISIONS budget line and dated entry, coverage
   register (REQ-233 now cites T269), README markers, contract fingerprints,
   assembled spec; ROADMAP section removed and its register row resolved.

## What went right

- Reading the target code before editing caught all three deltas; each was
  evidenced with `file:line` before any source change, and the delta was
  re-stamped before execution rather than improvised.
- One writer (`advanceFactionClock`) removed the drift risk between the four
  tick paths and the mirror: T269 asserts both stores after a transition, an
  advance, and a fill.
- The fill notice reuses the relationship-marker precedent (session-scoped
  memory), so no §7.7 property, clone/checkpoint/archive enumeration, or
  fingerprint surface changed.
- Anchor repair was mechanical: a `git diff -U0` hunk-offset map beat a
  nearest-symbol heuristic, which had already mis-picked a `recap` anchor.

## What went wrong

- **F1 (P2, fixed in delta 1)** — the plan's `type: "faction"` mirror required
  widening a persisted union for no reader. Corrected to a `fast_forward` skip.
- **F2 (P2, fixed in delta 1)** — the planned Player projection named
  `territory`, which leaks unvisited room names, and missed the summary branch
  of `manage_faction (action: list)`, which returned `status` to a Player.
- **F3 (P2, fixed)** — 22 Holosuite predicate anchors drifted (+6 to +139
  lines). Repointed by diff-offset mapping, `stale=0`, all five tiers green.
- **F4 (P2, fixed)** — one anchor (`holosuite.ts:244#reportDigest`) was
  **already stale at HEAD**, independent of this increment; the baseline
  `test:all` run was not captured before editing, so the first red reading
  mixed both classes. Corrected to `:233`.
- **F5 (P2, fixed)** — the `data_format` fingerprint went stale when the spec
  clause changed, so `test:fingerprints` T502 failed and `build-order`
  regenerated it; the starter then had to be regenerated **after** the
  fingerprint update (the same ordering rule the previous AAR recorded).
- **F6 (P2, fixed)** — the rewritten `manage_faction` description dropped the
  persistence vocabulary `tool-definitions-lint` requires (REQ-450); restored
  "persist to the Novel" while keeping the new facts.
- **F7 (P3, recorded)** — `Test398/401` in `test-narrative.ts` still asserts
  only `"active_badge": "game_master"` for REQ-338 audit evidence; T388 now
  carries the real clock assertion, so the gap is evidence quality, not a
  demonstrated failure.
- **F8 (P3, recorded)** — the clockless `[territorial]` display guard is
  unexercised: resuming the starter leaves a pending session-zero workflow, so
  `set_badge` refuses and the briefing's narrative-threads section is
  unreachable for a GM in that harness.

## Evidence

| Step | Command | Result |
|---|---|---|
| Baseline fast gate | `npm run check:fast` | 37/0, `check:fast: PASS` |
| Baseline harnesses | `test:narrative` / `test:graph` / `test:memory-recall` / `test:competitive-gaps` / `test:starter-novel` | 61/0, 5/0, 15/0, 28/0, 15/0 |
| Descent measurement | `buildWorldModel` + `findWinningPath` | 84 transitions; Candle 30 → 16 |
| Typecheck | `npm run typecheck` (holonovel) | exit 0 |
| Mechanism + evidence | `npx tsx scripts/test-narrative.ts` | 69 passed, 0 failed (T269 ×8, T388 rewritten) |
| Fingerprints | `npm run test:fingerprints` | 9 passed, 0 failed (T502 after regeneration) |
| Holosuite | `--tier={conformance,invariants,novel,adversarial,differential}` | 45/0, 25/0, 100/0, 26/0, 3/0 — all PASS |
| Anchor check | repo-wide anchor verifier | `stale=0` |
| Playability | `npm run test:playability` | PASS (4 Novels, each matching its expectation) |
| Spec | `npm run validate -- --sdd-strict` | 0 errors, 274 warnings |
| Coverage register | `npm run validate -- --write-register` | REQ-233 evidence → `T269, T408, T413, T415` |
| Surface budget | `npm run surface-budget -- --write` | full 28,051 / standard 24,452 (DECISIONS synced) |
| Full suite | `npm run test:all` (holonovel) | 54 passed, 0 failed (127.5s) |

## Conditions

- **C-1** resolved: the enumeration ran before the code change and named the
  two contact points; both are `assertContains`/topic checks, so the mirror is
  additive.
- **C-2** resolved: §7.7.0 and the clone/checkpoint/archive enumerations name
  no countdown sub-field (`grep badge_scope` in `spec/04-runtime.md` → no
  match), so no fingerprint surface changed; `build-order` confirms.
- **C-3** resolved: REQ-233b1 is 727 chars / 9 sentences and
  `validate --sdd-strict` passes with the edit, so no fallback was needed.

## Findings and dispositions

| ID | Finding | Severity | Disposition |
|---|---|---|---|
| F1 | Mirror `type` widening was unnecessary | P2 | Resolved in delta 1 |
| F2 | Projection shape leaked `territory`; summary branch leaked `status` | P2 | Resolved in delta 1 |
| F3 | 22 Holosuite anchors drifted | P2 | Resolved: diff-offset repoint, tiers green |
| F4 | One anchor pre-existed as stale; baseline `test:all` not captured | P2 | Resolved; recorded here |
| F5 | `data_format` and the starter went stale in sequence | P2 | Resolved; ordering rule re-recorded |
| F6 | Rewritten description tripped REQ-450 vocabulary | P2 | Resolved |
| F7 | `Test398/401` assertion is vacuous | P3 | Record-and-close (evidence quality, no failure) |
| F8 | Clockless `[territorial]` guard unexercised | P3 | Record-and-close (harness cannot reach a GM briefing on the starter) |
| R1–R4 | REQ-233b1/b2 mechanism, fill, and resource filter unimplemented | P0 (found in planning) | Resolved: `advanceFactionClock`, fill warning, projections |
| R5 | Survivor race clock fills ~12% into the descent | P3 (design) | Resolved by decision: descriptive, recorded in DECISIONS.md |

## Done-bar status

Every clause of the plan's **Done bar** is met: the mechanism is real and
tested, The Survivors are descriptive, the badge projections close the leak,
REQ-233b1 is amended, T269 and T388 carry evidence, and every register,
generated artifact, and gate named in the plan is current. `ROADMAP.md` has no
scheduled work remaining. The commit is the one step this AAR precedes.

LOOP PAUSED
