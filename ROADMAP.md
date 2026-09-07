# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Supplementary ruleset import (REQ-372/373)

- Implement the supplementary-import subsystem end to end: `import_supplementary`
  / `remove_supplementary`, runtime extraction (REQ-011/225), MCP-level dynamic
  tool registration (REQ-020/373), Novel-scoped `supplementary_rulesets` state,
  Ruleset Wisdom rendering (REQ-371 P5–P11), the Appendix Z fixture, and the
  dynamic-registration waiver path (REQ-373). Currently a sanctioned bucket-E
  intended gap; Pattern Buffer sub-workflows S30/S31 are recorded `blocked`
  against it until shipped.
- Plan kept in `plans/2026-09-06-supplementary-import.md`; tracked in
  `spec/audit/review-register.md` (`Scheduled-roadmap`) and `req-coverage.md`
  (REQ-372/373 bucket E).
- Unblock S30/S31 in the §6.6 harness once the surface lands.

