# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## SWSE sheet vitals

- Stopgap applied 2026-09-30: the character-creation engine exposes the first
  class's starting HP and hit die to derived-stat formulas (REQ-399b), and the
  installed SWSE packages declare `hit_points`, `damage_threshold`, and
  `force_points` (level-5 Soldier: HP 58, DT 18, FP 7).
- Durable fix: rebuild the SWSE package so a fresh install carries these stats
  without the hand patch —
  `opencode run --agent build "Perform Build workflow on swse. B1 intake: swse=/home/fluke/Documents/SWSE/ruleset/SWSE. Follow Appendix V V.1."`
