# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## SWSE sheet vitals

- SWSE character sheets carry only the three defenses — no Hit Points, Damage
  Threshold, or Force Points — so SWSE combat cannot be tracked. The server
  already persists every `derived_stats` entry a ruleset declares
  (`holonovel/src/core/character-creation.ts:362`); the gap is the SWSE package
  model's `character_creation.derived_stats`.
- Add `hit_points`, `damage_threshold`, and `force_points` derived stats to the
  SWSE package via the ruleset-build workflow, then rebuild/reinstall the
  package (REQ-399 family).

## Party-scoped completion oracle

- The parser and `manage_scene (action: set, location)` now place/move the
  whole present party, but the playtest oracle certifies escape on the active
  PC alone. Add a party-scoped escape component to the oracle and have the
  authoring protocol set party presence.
