# Tasks — Relationship change marker and disposition coupling

Ordered; each task ends with its verification. Plan: `plan.md`.

1. **Marker store and helpers.** In `holonovel/src/index.ts`, add the
   `RelationshipMarker` type, the `relationshipMarkers` map near
   `pacingSessions`, `shiftDispositionToward`, `shouldMarkRelationshipChange`,
   `recordRelationshipMarker`, `relationshipMarkerLines`, and
   `shiftRelationshipDispositions`. Verify: `npm run typecheck`.

2. **Set path.** In `manage_relationship (action: set)`, capture the previous
   type, keep the row reference, record the marker on a qualifying change,
   shift involved NPCs on a flip to `rival`, and audit `relationship_set` plus
   each `relationship_disposition`. Verify: the narrative test's marker and
   disposition assertions.

3. **Briefing.** In the `narrative_threads` composition, push
   `relationshipMarkerLines(novel, badge, entity?.id)` after the pacing line.
   Verify: the GM and Player marker assertions.

4. **Scene clear.** In `manage_scene (action: set)`, delete the slug's marker
   list when `isTransition` is true, before the transition hook. Verify: the
   scene-clear assertion.

5. **Tests.** Extend the `test-narrative.ts` social-graph block:
   - seed an initial scene, then set `Mara -> Kestrel` ally;
   - change to `rival`, assert the marker text and Kestrel's `suspicious`
     disposition;
   - repeat the same `rival` set, assert no duplicate marker;
   - create Cora, set `Kestrel -> Cora` rival, assert Cora shifts to
     `suspicious`; set Cora hostile, repeat a rival set, assert she stays
     hostile;
   - switch to the Player badge, capture the briefing, switch back, and assert
     the Player briefing does not contain the marker (no `narrative_threads`
     section in this build);
   - set a new scene description, assert the marker is gone.

6. **Registers.** Add the `holonovel/DECISIONS.md` entry and the
   `CHANGELOG.md` entry. Write `aar.md` after the gates with a terminal
   `LOOP PAUSED` or `LOOP OPEN`.

7. **Gates.** Run `npm run typecheck`, `test:narrative`, `test:graph`,
   `test:starter-novel`, `test:output-contracts`, `test:belief`,
   `test:tool-definitions`, root `npm run check:fast`, and
   `npm run check:conformance`.
