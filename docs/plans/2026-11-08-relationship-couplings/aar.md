# AAR — Relationship change marker and disposition coupling

**Date:** 2026-11-08 · **Plan:** `plan.md` · **Tasks:** `tasks.md`
**Base:** `76f8706` · **Rollback cost:** 1

## Planned vs. happened

| Planned | Happened |
|---|---|
| Scene-scoped marker map and helpers | Shipped. `relationshipMarkers`, `shiftDispositionToward`, `shouldMarkRelationshipChange`, `recordRelationshipMarker`, `relationshipMarkerLines`, `shiftRelationshipDispositions`. |
| Set path marker, shift, audit | Shipped. Previous type captured, qualifying change marked, rival flip shifts NPCs, `relationship_set` and `relationship_disposition` audited. |
| `narrative_threads` marker line | Shipped on the GM/observer branch. |
| Scene transition clear | Shipped. Cleared when `isTransition` is true, before the transition hook. |
| Tests | Shipped. Six new assertions in the social-graph block. |

The plan's Player-exposure assumption was corrected during execution: the
Player briefing does not render `narrative_threads` at all, so the marker is
GM-only in this build. The helper retains the active-entity filter for a future
Player section. The plan, decision, and done bar were amended before the final
gates.

The first test run also exposed a test-ordering bug: the Player assertion threw
before the badge was restored to GM, so the later GM mutations were refused.
The test now captures the Player briefing, restores GM, then asserts.

## Verification evidence

- `cd holonovel && npm run typecheck` → clean.
- `npm run test:narrative` → 60 passed / 0 failed (was 55; +5).
- `npm run test:graph` → 5 passed / 0 failed.
- `npm run test:starter-novel` → 15 passed / 0 failed.
- `npm run test:output-contracts` → 338 passed / 0 failed.
- `npm run test:belief` → 29 passed / 0 failed.
- `npm run test:tool-definitions` → 17 passed / 0 failed.
- `npm run test:competitive-gaps` → 28 passed / 0 failed.
- Root `npm run check:fast` → 37 passed / 0 failed, `check:fast: PASS`.
- `npm run check:conformance` → PASS; no bundle-dependent REQs.

## Conditions

- **C-1 — resolved.** The marker list is cleared whenever `isTransition` is
  true, before the `skip_transition_hook` gate; the scene-clear test passes.
- **C-2 — resolved.** A same-type set leaves the marker count at one and does
  not re-shift dispositions; the same-type test passes.
- **C-3 — resolved, amended.** The Player briefing exposes no marker because
  the section is not rendered; the test asserts absence and restores GM before
  the next assertion. The helper's active-entity filter remains for a future
  Player section.
- **C-4 — resolved.** A neutral NPC shifts to `suspicious`; a hostile NPC stays
  `hostile`; the shift and the set are audited.

## What went right

1. **The marker is scene-scoped without new persisted state.** The
   `pacingSessions` precedent kept the change small and avoided a §7.7 class
   contract for a transient line.
2. **The P48 shift is conservative.** A rival flip moves neutral to
   suspicious, friendly to neutral, and never softens a hostile NPC.
3. **The test caught the Player-section assumption.** The failure was a real
   briefing-surface fact, not a code bug; the plan was amended rather than
   forcing a Player section into scope.

## What went wrong

1. **The plan assumed the Player saw `narrative_threads`.** The section is in
   the GM/observer branch; the Player briefing never had it. Corrected in the
   plan and DECISIONS D2.
2. **A test assertion ran before the badge restore.** The failed Player
   assertion left the badge on Player, so the next test's GM mutations were
   refused. Fixed by restoring the badge before asserting.

## Findings and dispositions

| # | Finding | Class | Disposition |
|---|---|---|---|
| F1a | REQ-236b marker absent | P1 (normative REQ) | Fixed: scene-scoped marker, exact transition set, scene clear. |
| F1b | P48 disposition shift absent | P1 (normative REQ) | Fixed: rival flip shifts involved NPCs, no softening. |
| F1c | P48 names `hostile`, but the relationship enum has no `hostile` | P3 (no reachable path) | Recorded; the rival path is implemented, no enum widening. |
| F1d | `manage_relationship (set)` unaudited | P3 (pre-existing) | Fixed: `relationship_set` and `relationship_disposition` audit entries. |
| F1e | Player briefing omits `narrative_threads` | P3 (pre-existing interpretation) | Recorded; the marker is GM-only, the helper keeps the future filter. |

## Methodology findings

- **Check the briefing branch before promising a badge-visible surface.** A
  section can exist in the composer yet sit inside a GM-only branch. Verify
  the enclosing branch, not only the section's presence.

## Terminal

Done bar met: the REQ-236b marker fires on the exact transition set and clears
on a scene transition; P48's rival flip shifts involved NPCs without softening
a hostile one; the set and shift are audited; every targeted test and the root
gates pass. F1 is closed. The remaining P3 observations are recorded, not
open P0/P1 work.

LOOP PAUSED
