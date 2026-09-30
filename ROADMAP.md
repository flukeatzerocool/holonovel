# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## SWSE sheet vitals

- Durable fix (REQ-399a): rebuild the SWSE package so a fresh install declares
  `hit_points`, `damage_threshold`, and `force_points` without the 2026-09-30
  hand patch. The engine-side formula context (REQ-399b) already ships —
  `opencode run --agent build "Perform Build workflow on swse. B1 intake: swse=/home/fluke/Documents/SWSE/ruleset/SWSE. Follow Appendix V V.1."`
