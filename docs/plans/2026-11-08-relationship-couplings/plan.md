# Plan — Relationship change marker and disposition coupling

Session 2026-11-08. Base HEAD `76f8706`; the working tree carries this
session's social-graph increment. This plan closes F1 from
`docs/plans/2026-11-08-social-graph/aar.md`: REQ-236b's relationship-change
marker and P48's relationship-to-disposition coupling. Plan revision 1.

## Done bar

**Done bar:** a qualifying relationship type change injects
`Relationship changed: <a> and <b> are now <type>.` into the
`narrative_threads` section; the marker is visible to the GM and is not
exposed on the Player briefing (the Player `narrative_threads` section is not
rendered in this build; the helper retains the active-entity filter for a
future Player section); it clears on the next scene transition; a flip to
`rival` shifts each involved NPC one step toward `suspicious` without
softening a more-hostile NPC, and the shift and the set are audited;
`test:narrative` covers the marker, the clear, the Player absence, the
disposition shift, and the no-softening case; root `check:fast` passes 37/37
un-piped and `check:conformance` passes; the increment lands with plan/tasks/
AAR and a terminal LOOP token; nothing is pushed.

## Baseline (measured this session)

- `git rev-parse --short HEAD` → `76f8706`.
- Root `npm run check:fast` → 37 passed / 0 failed.
- `cd holonovel && npm run test:narrative` → 55 passed / 0 failed.
- `manage_relationship (action: set)` updates a row and saves; it emits no
  `narrative_threads` marker and no disposition shift. `holonovel/src/index.ts:6952-6973`.
- The `narrative_threads` section is composed at `holonovel/src/index.ts:13770-13805`.
- `resetPacing` runs on a scene transition at `holonovel/src/index.ts:5621` and
  `:5963`.
- The relationship enum is `ally | rival | neutral | mentor | dependent | suspicious`;
  P48's `hostile` is not a reachable relationship type.

## Findings

| ID | Severity | Finding | Predicate |
|---|---|---|---|
| F1a | Major | REQ-236b's marker is absent. | `manage_relationship (set)` has no marker write; `narrative_threads` has no marker read. `holonovel/src/index.ts:6952-6973`, `:13770`. |
| F1b | Major | P48's disposition shift is absent. | The only `shiftDisposition` call is countdown-driven at `:6459`; the set path never touches `npc.disposition`. |
| F1c | Minor | P48 names `hostile`, but the relationship enum has no `hostile`. | `Relationship.type` at `holonovel/src/core/state.ts:357`; the tool enum at `:6947`. Only `rival` is reachable. |
| F1d | Minor | `manage_relationship (set)` is not audited. | The handler calls `state.saveNovel` but not `audit`. |
| F1e | Minor | The Player briefing does not render the `narrative_threads` section. Pre-existing; the marker is therefore GM-only in this build. | The section lives in the `else if (badge === "game_master" \|\| badge === "observer")` branch at `holonovel/src/index.ts:13742-13755`. |

## Decisions

- **D1 — The marker is scene-scoped in memory, like the pacing session.** A
  module-level `Map<slug, marker[]>` holds the current scene's markers and is
  cleared on the scene transition. Rejected: a persisted Novel field, which
  would require a §7.7 class contract and the REQ-240a/241a/334b clone/
  checkpoint/archive enumerations for a transient briefing line. A server
  restart mid-scene drops the marker; accepted for a scene-scoped advisory.
- **D2 — The marker is a GM advisory.** The current Player briefing does not
  render the `narrative_threads` section, so the Player does not see the
  marker; the test asserts that absence. The helper retains the active-entity
  filter for a future Player section. Rejected: adding a Player
  `narrative_threads` section in this increment (a broader briefing change).
- **D3 — P48's reachable target is `suspicious`.** A flip to `rival` shifts
  each involved NPC one step toward `suspicious`; a more-hostile NPC is not
  softened. `hostile` is not a valid relationship type, so no path exists;
  recorded, not fixed by widening the enum.
- **D4 — Marker transitions follow REQ-236b exactly.** `ally` ↔ `rival`,
  `ally` ↔ `suspicious`, `rival` ↔ `suspicious`, and any change involving
  `neutral`. A new row's previous type reads as `neutral`.
- **D5 — Audit the mutation and the shift.** Add `relationship_set` and
  `relationship_disposition` entries. No new tool, REQ, T id, or gate.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | Marker map, helpers, set path, narrative threads, scene clear, disposition shift, audit | M |
| `holonovel/scripts/test-narrative.ts` | Marker, clear, badge filter, shift, no-softening tests | M |
| `holonovel/DECISIONS.md` | Dated marker/coupling decision | S |
| `CHANGELOG.md` | Dated entry | S |
| `docs/plans/2026-11-08-relationship-couplings/plan.md` | This plan | S |
| `docs/plans/2026-11-08-relationship-couplings/tasks.md` | Ordered checklist | S |
| `docs/plans/2026-11-08-relationship-couplings/aar.md` | Post-execution AAR with LOOP token | S |

No content file changes: the Torre source's initial rival rows load; they do
not call `set`, so no marker or shift fires at load.

## Implementation steps

1. **Marker store and helpers** in `holonovel/src/index.ts`:
   - `interface RelationshipMarker { text: string; entity_ids: string[] }` and
     `const relationshipMarkers = new Map<string, RelationshipMarker[]>()` near
     `pacingSessions`.
   - `shiftDispositionToward(current, target: "hostile" | "suspicious")` near
     `shiftDisposition`; it moves one step toward the target and never softens
     an NPC already at or beyond it.
   - `shouldMarkRelationshipChange(previous, next)`: false when equal or next
     is undefined; true when either side is `neutral`; otherwise true for the
     unordered pairs `ally|rival`, `ally|suspicious`, `rival|suspicious`.
   - `recordRelationshipMarker(novel, row, type)`: resolve endpoints, build the
     exact text, dedupe by text, append to the slug's list.
   - `relationshipMarkerLines(novel, badge, activeId)`: GM/`none` returns every
     text; Player returns only markers whose `entity_ids` include the active
     id; other badges return `[]`.
   - `shiftRelationshipDispositions(novel, row)`: for each endpoint that
     resolves to an NPC, shift toward `suspicious`, save the new disposition,
     and audit `relationship_disposition`.

2. **Set path** in `manage_relationship (action: set)`:
   - Capture `previousType` (`"neutral"` when the row is new) before writing.
   - Keep the row reference; write `type`, `value`, `description` as today.
   - If the type changed and `shouldMarkRelationshipChange` is true, record the
     marker.
   - If the previous type is not `rival` and the new type is `rival`, call
     `shiftRelationshipDispositions`.
   - Audit `relationship_set` with the pair, previous type, and new type.
   - No tool schema or description changes; `check-tool-definitions-sync` and
     `tool-definitions-lint` are not triggered.

3. **Briefing** in the `narrative_threads` composition: after the pacing line,
   push `relationshipMarkerLines(novel, badge, entity?.id)`. The live path is
   the GM/observer branch; the helper's Player branch is reserved for a future
   Player section.

4. **Scene transition** in `manage_scene (action: set)`: when `isTransition`,
   delete the slug's marker list before the transition hook, so a
   `skip_transition_hook` set also clears it.

5. **Tests** in `test-narrative.ts` social-graph block:
   - Set an initial scene description so the later scene set is a transition.
   - `ally → rival`: the GM briefing contains the marker; the involved NPC's
     disposition becomes `suspicious`.
   - `rival → rival`: no second marker.
   - A second NPC pair `Kestrel -> Cora` rival: both neutral NPCs shift; a
     hostile Cora stays hostile on the next rival set (no softening).
   - Switch to the Player badge, capture the briefing, and switch back before
     asserting; the Player briefing has no `narrative_threads` section, so it
     must not contain the marker.
   - Set a new scene description: the marker is absent from the GM briefing.

6. **Registers:** DECISIONS entry, CHANGELOG entry, tasks/AAR. No spec file,
   coverage register, or fingerprint section changes.

## Verification

1. `cd holonovel && npm run typecheck`
2. `cd holonovel && npm run test:narrative`
3. `cd holonovel && npm run test:graph`
4. `cd holonovel && npm run test:starter-novel`
5. `cd holonovel && npm run test:output-contracts`
6. `cd holonovel && npm run test:belief`
7. `cd holonovel && npm run test:tool-definitions`
8. `npm run check:fast` (root, un-piped)
9. `npm run check:conformance`
10. Manual probe: set a rival in a fresh Novel, confirm the marker, the NPC
    disposition, the Player filter, and the scene clear.

## Edge cases and rollback

- **Unresolved endpoint:** the marker uses the raw token; no NPC shift; the
  Player filter compares the raw id to the active id.
- **New row:** previous type reads `neutral`, so a new `rival` row marks and
  shifts. The Torre source loads rows without `set`, so no startup shift.
- **Same-type set:** no marker, no shift.
- **Softening:** a hostile or suspicious NPC stays at or above the target.
- **Rollback cost 1:** revert the index and test edits; the in-memory marker
  dies with the process. No content rebuild.

## User impact

- A `set` that changes a relationship type can now shift an NPC's disposition;
  this is the P48 contract and is audited.
- The GM sees every marker. The Player briefing does not render the
  `narrative_threads` section in this build, so it exposes no marker.
- No restart migration is needed. A server restart mid-scene drops the
  in-memory marker; the next scene transition would clear it anyway.
