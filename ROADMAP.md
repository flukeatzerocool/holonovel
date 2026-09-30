# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Player perception surface

- On ruleset-bound Novels the parser (`run_command`) is GM-only (REQ-309e), so
  a player agent's natural "look/examine" is `[FORBIDDEN]`; the player has no
  direct perception affordance. Surfaced by LLM-driven play
  (`llm-narrative-curious` turns 19, 21).
- Provide a Player-badge perception surface (e.g., a read-only look/examine
  action) or make the briefing the discoverable substitute.

## SWSE sheet vitals

- REQ-399a now requires the character-creation model to declare every
  damage-tracking resource the ruleset defines (amended 2026-09-30); the server
  already persists declared `derived_stats`
  (`holonovel/src/core/character-creation.ts:362`).
- Remaining: rebuild the SWSE package so it declares `hit_points`,
  `damage_threshold`, and `force_points` —
  `opencode run --agent build "Perform Build workflow on swse. B1 intake: swse=/home/fluke/Documents/SWSE/ruleset/SWSE. Follow Appendix V V.1."`
