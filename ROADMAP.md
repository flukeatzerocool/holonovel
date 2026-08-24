# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release. This file feeds the newsletter's
  "Upcoming" section directly.
-->

## Backlog-clearance program (waves 1–11)

The coverage-backlog program (145 A + 6 B REQs from `spec/audit/req-coverage.md`).
Each wave: implement → harness tests → register regen → `check:fast`. Program is
done when `npm run validate:sdd -- --impl-audit=strict` passes (A reflects
intended coverage). Order is dependency-first: base surfaces before couplings.

- **Wave 1 — §5.1 Output & error contracts (14)**: REQ-003,004,060,061,064,070,
  071,101,113,118,184,194,277,280
- **Wave 2 — §5.3 Tool-surface economy (20)**: REQ-021,024,057,058,059,063,078,
  106,110,112,138,139,169,182,183,269,413,414,415 + REQ-408 param-ceiling
  refactor
- **Wave 3 — §5.5 Badges & access (16)**: REQ-031,133–137,180,211,216,220,223,
  275,276,281,304,305
- **Wave 4 — §5.6 State/lifecycle + §5.9 (14)**: REQ-044,094,131,176–178,217,
  237,279,295,302,308,322,329,330,332
- **Wave 5 — §5.6 NPC surface & memory (17)**: REQ-119–129,156,165–168,282,311
- **Wave 6 — §5.6 Adventure resources (13)**: REQ-132,170–172,229,247–250,252,292
- **Wave 7 — §5.6/§5.7 Combat (9)**: REQ-157,203–206,221,251,253
- **Wave 8 — §5.7/§5.2 Determinism & safety (8)**: REQ-054,270,271,312,416,417
- **Wave 9 — §5.8 Synthesis subsystem (23)**: REQ-086,087,114,115,130,155,185,
  186,226,228,231,243–245,261–266,310,328,331,333
- **Wave 10 — §5.10 World-model couplings (10)**: REQ-197,283,284,325,326,327,
  337,338,367,368
- **Wave 11 — §5.4 + §5.16/§5.17 Decision/ruleset (10)**: REQ-056,193,380,389,
  390,391,392,393 (ruleset-dependent REQs need a fixture decision)

## Next

- No additional items beyond the backlog-clearance program above
