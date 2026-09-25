# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Feature parity — M2 Knowledge Corpus, Semantic Index, Knowledge Graph

### M2a Knowledge Corpus — SHIPPED 2026-09-24 (REQ-496–503)

Cold corpus, source-profile domain routing, four-way access predicate, and the
per-entity acquisition ledger ship as `manage_corpus`. Remaining below.

### M2b Build-time Semantic Index — SHIPPED 2026-09-24 (REQ-504–509)

Offline deterministic index, staleness fingerprint, advisory ranking,
relations, authority boundary, and scope filtering ship as `manage_index`.

### M2c Knowledge-Graph Projection (REQ-510–514)

Rebuildable JSON knowledge-graph projection over Novel sources; read tool
`manage_graph`.

## Feature parity — M3 Generation-consistent Briefing Frame

- REQ-515–521: token-budgeted `badge_briefing` frame with readiness cursor
  and single-flight assembly; extends `manage_session`, no new tool.
- Depends on M1a, M1b.

## Feature parity — M4 Durable Agent Tasks

- M4a (REQ-522–530): durable NPC/agent task and action lifecycle with
  autonomy policy; tool `manage_agent`.
- M4b: donated inference is de-scoped by Standing Rule 3 (no outbound network
  at runtime); the boundary is recorded as a §7.4 gloss.
- Depends on M1b, M1c.

## Feature parity — M5 Pipeline, Plugins, Multi-party Surfaces

- M5a (REQ-531–535) build-time job registry; M5b (REQ-536–539) ruleset-declared
  declarative extension points; M5c (REQ-540–545) per-entity perception ledger,
  import/export gateway, cross-Novel scope resolution, tool `manage_perception`.
- Depends on M1a, M1b, M2a.

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

