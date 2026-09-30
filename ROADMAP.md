# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Party-wide placement and movement

- Only the active PC is placed by `manage_scene (action: set, location)` and
  moved by the parser; other party members stay roomless
  (`holonovel/src/index.ts:3684`, `:2724-2732`). Model placement and movement
  for the whole present party.
- Stop certifying escape on the active PC alone once party placement exists
  (the playtest oracle's `active_pc_in_escape` is currently active-PC-scoped).

## SWSE sheet vitals

- SWSE character sheets carry only the three defenses — no Hit Points, Damage
  Threshold, or Force Points — so SWSE combat cannot be tracked
  (`holonovel/src/core/character-creation.ts` `computeDerived` + the SWSE
  package `character_creation.derived_stats`).
- Add the missing derived stats to the SWSE package and the character-creation
  contract (REQ-399 family).

## Beat-enum discoverability

- `manage_scene (action: set, beat: <invalid>)` returns a raw
  `MCP error -32602` with no `[ERROR] [CODE]` envelope, and the valid beat
  vocabulary is not discoverable before the call.
- Surface the beat list in the tool description and return the standard
  `[ERROR] [INVALID_INPUT]` envelope (the D4 class).
