# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Builder-side evidence follow-through (AAR 2026-09-06)

- Plan the re-scoped-out builder-side evidence work on the correct bucket-E
  model (builder/verifier contracts are exempt from the server-runtime audit;
  evidence lives in harnesses + gates, not the §6.6 coverage map). Deferred
  pieces: a conversion evidence harness + §5.2 coverage map (REQ-451 model),
  a §6.7 update-workflow harness (REQ-098), and register alignment for the
  Holodeck/Wisdom/entry-point REQs. Each is a separate bounded increment.
- Shipped in this AAR: `check-vendor-manifest.ts` + REQ-451 (vendor-manifest
  verification), G6 `_Check:` wiring, and the REQ-141g "§9 H13a"→"§9 H13"
  repair. A general G/H-reference parity checker was judged not worthwhile
  (regex false-positives on heading terms); the targeted repair suffices.

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

