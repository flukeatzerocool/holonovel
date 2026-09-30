# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## SWSE sheet vitals

- REQ-399a now requires the character-creation model to declare every
  damage-tracking resource the ruleset defines (amended 2026-09-30); the server
  already persists declared `derived_stats`
  (`holonovel/src/core/character-creation.ts:362`).
- Remaining: rebuild the SWSE package so it declares `hit_points`,
  `damage_threshold`, and `force_points` —
  `opencode run --agent build "Perform Build workflow on swse. B1 intake: swse=/home/fluke/Documents/SWSE/ruleset/SWSE. Follow Appendix V V.1."`
