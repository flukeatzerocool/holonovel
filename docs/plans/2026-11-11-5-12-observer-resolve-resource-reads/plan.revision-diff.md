# Revision packet — plan.md (post-cold-pass)

Pre-revision artifact was not persisted by the gate (the standard-depth stamp
refused until a cold pass existed), so this packet carries the exact replaced
blocks instead of a machine diff. Everything not shown here is unchanged from
the artifact the cold pass reviewed (sha256
`7026e423772ad071c560c154b47262d41a30ca5eadab7a4a2365c8d34ce25eeb`).

## Hunk 1 — done bar 6–8 (cold-pass blocker B1)

### Before

```text
6. `spec/appendices-reference.md:2061` (T643 row) gains: "On the same
   ruleset-bound Novel, an observer `run_command (action: resolve)` and
   `run_command (action: visibility)` succeed." Its REQ column becomes
   `REQ-309, REQ-196a, REQ-366b`.
7. `holonovel/scripts/test-narrative.ts:910-919` (the T417 case) creates a
   portable thing in the fixture's `Throne Room`, then under `observer` asserts:
   `resolve` for `look` and `go north` returns a JSON status and no
   `[FORBIDDEN]`; `visibility` with `source: "character_01"` and the thing as
   target returns `can_see`; `audibility` returns `can_hear`;
   `room://throne_room` names the thing with its id; `thing://<id>` carries
   `**Properties:**`; `world://map` names both rooms; `manage_scene (action:
   set)` is still `[FORBIDDEN]`; badge restored to `game_master`. The suite
   reports 75 passed, 0 failed with no new case (`test()` count unchanged).
8. `holonovel/scripts/test-competitive-gaps.ts:509-518` (T643's observer
   window) adds `run_command { action: "resolve", intent: "look" }` and
   `run_command { action: "visibility", source: "character_01", target: "Bay" }`
   assertions; the suite stays 30 passed, 0 failed.
```

### After

```text
6. `spec/appendices-reference.md:2061` (T643 row) gains: "On the same
   ruleset-bound Novel, an observer `run_command (action: resolve)` and
   `run_command (action: visibility, source: "character_01", target:
   "Scout")` succeed." Its REQ column becomes
   `REQ-309, REQ-196a, REQ-366b`.
7. `holonovel/scripts/test-narrative.ts:910-919` (the T417 case) creates a
   fixed, lit thing `lantern` in the fixture's `Throne Room`
   (`manage_world { action: "create_thing", name: "lantern", kind: "thing",
   location: "Throne Room", fixed: true, lit: true, switched_on: true }` —
   `fixed`, not `portable`, is the schema's take-prevention flag,
   `index.ts:5511`), then under `observer` asserts: `resolve` for `look` and
   `go north` returns a JSON status and no `[FORBIDDEN]`; with
   `source: "character_01"` the query without a target lists `lantern` and the
   query with `target: "lantern"` returns `can_see` (a room name is not a valid
   target — `resolveSpatialThing` resolves things only, `index.ts:4764-4771`,
   and returns `[NOT_FOUND]` for a room); `audibility` with
   `target: "lantern"` returns `can_hear`; `room://throne_room` names the thing
   with its id and `thing://lantern` carries `**Properties:**`; `world://map`
   names both rooms; `manage_scene (action: set)` is still `[FORBIDDEN]`; badge
   restored to `game_master`. The suite reports 75 passed, 0 failed with no new
   case (`test()` count unchanged).
8. `holonovel/scripts/test-competitive-gaps.ts:509-518` (T643's observer
   window) adds `run_command { action: "resolve", intent: "look" }` and
   `run_command { action: "visibility", source: "character_01", target:
   "Scout" }`, asserting each returns its JSON field (`status`, `can_see`) and
   no `[FORBIDDEN]`; the suite stays 30 passed, 0 failed. The fixture has no
   thing, so the visibility target is the active entity, which
   `resolveSpatialActor` resolves by name (`index.ts:4755-4761`); the `Bay`
   room is not lit, so the assertion is on the field's presence, not on
   `can_see: true`.
```

## Hunk 2 — Phase 3 (same blocker, step detail)

### Before

```text
1. `holonovel/scripts/test-narrative.ts:910-919`: create a portable thing in
   `Throne Room` before switching badges, then extend the T417 case per done
   bar 7. Use the existing `assertContains`/`assertNotContains` helpers and
   `readResource`; parse the resolve JSON with `JSON.parse` only after the
   `[FORBIDDEN]` assertion, so a refusal fails with a readable message.
2. `holonovel/scripts/test-competitive-gaps.ts:509-518`: insert the resolve and
   visibility assertions inside the existing observer window, before the badge
   reset at `:518`.
```

### After

```text
1. `holonovel/scripts/test-narrative.ts:910-919`: create the fixed, lit
   `lantern` in `Throne Room` before switching badges, then extend the T417
   case per done bar 7. Use the existing `assertContains`/`assertNotContains`
   helpers and `readResource`; parse the resolve/query JSON with `JSON.parse`
   only after the `[FORBIDDEN]` assertion, so a refusal fails with a readable
   message.
2. `holonovel/scripts/test-competitive-gaps.ts:509-518`: insert the resolve and
   visibility assertions inside the existing observer window, before the badge
   reset at `:518`. Use `Scout` as the visibility target (see done bar 8), not
   the room name.
```

## Hunk 3 — Evidence (second probe, resolution shape)

Added after the first probe bullet in §2: the targetless/with-target
`visibility` results, the `audibility` result, the room-as-target `[NOT_FOUND]`,
and the finding that `manage_character (action: create)` leaves the entity with
a `current_room`, so an explicit `source` resolves.

## Hunk 4 — Verification (unverified by design)

Added: the observer hazard-`annotations` branch of `room://` follows the same
predicate but has no purpose-built T417 fixture; REQ-622 annotation coverage is
T741 at GM depth, and observer parity is recorded in `aar.md` as a soft gap.

## Response to the cold-pass findings

- B1 — fixed in hunks 1–2: the visibility target is a thing (`lantern`) in the
  T417 fixture and the active entity by name (`Scout`) in the T643 fixture; a
  room name is documented as `[NOT_FOUND]` with the resolving functions cited.
- M1 — the plan already records the REQ-366a alternative (Decision 2,
  alternative b) and scopes the exclusion list to `badge_briefing`; no change
  beyond the annotation note in hunk 4.
- M2 — addressed as a recorded soft gap (hunk 4), not a claimed assertion.
- M3 — the "explicit source" mitigation was wrong about `current_room`; hunk 3
  records the probe result that the entity carries it.
- M4 — done bar 8 now names the observable field and its expected value.
- Nits — draft length is 694 in both places (the "706" remnant was corrected
  before the cold pass); `fixed` replaces `portable`; the `isGM` grep is a
  single-line predicate and matches twice after the edit.

## Build-time delta (execution evidence, post-stamp)

Evidence gathered during Phase 3 invalidated one literal in done bar 7: room
keys are `args.name.toLowerCase()` including spaces (`holonovel/src/index.ts:5614`),
so `room://throne_room` returns `{"error":"not found"}` and the URI must
percent-encode the space. Probe: `room://Throne%20Room` returns GM-depth content,
`thing://lantern` returns `**Kind:**`/`**Location:** (lantern → Throne Room)`/
`**Properties:**`, while `room://throne_room` and `room://anteroom` return
`not found`.

Amendment: done bar 7 now names `room://Throne%20Room` and states the key/
encoding rule; plan §2 records the third probe. No behaviour, file list, gate,
or destructive operation changes — a condition-only amendment verified by
build-review.
