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

### M2c Knowledge-Graph Projection — SHIPPED 2026-09-24 (REQ-510–514)

Derived deterministic JSON graph, node/edge typing, fingerprint staleness,
idempotent rebuild, and scope-filtered read-only exposure ship as
`manage_graph`. **M2 complete.**

## Feature parity — N2 Durable Agent Tasks (REQ-522–530) — SHIPPED 2026-09-24

Durable task/action lifecycle with an autonomy policy ships as `manage_agent`;
the M4b inference-boundary gloss is recorded in §7.4.

## Feature parity — N3 Perception Ledger (REQ-540–545, narrowed)

- Per-entity record of which event-log ordinals, messages, and scene changes an
  entity perceived, feeding `manage_belief`; new tool `manage_perception`. The
  import/export gateway and cross-Novel scope are already covered (REQ-372,
  REQ-321/332) and are out of scope.
- Depends on M1a, M1b, M2a. Scheduled.

## De-scoped / narrowed (2026-09-24 program)

- **M3 Generation-consistent briefing (REQ-515–521)** — narrowed, retained:
  `badge_briefing` token budgeting already ships (REQ-109/135, T149); the
  remaining increment is a briefing-consistency indicator tied to the event log.
- **M4b Donated inference** — de-scoped by Standing Rule 3 (no outbound network
  at runtime); recorded as a §7.4 gloss carried by N2.
- **M5a Build-time job registry (REQ-531–535)** — de-scoped: the build pipeline
  is synchronous and stage-stamped; a durable job queue is non-applicable.
- **M5b Ruleset extension points (REQ-536–539)** — folded into REQ-372/373
  (shipped N1): ruleset packages already declare tools/resources/prompts as data.

## Supplementary ruleset import (REQ-372/373) — SHIPPED 2026-09-24 (N1)

`manage_ruleset (action: import_supplementary/remove_supplementary)` with
Wisdom-only import under the REQ-372d dynamic-registration waiver; Pattern
Buffer S30/S31 now execute. REQ-373 (dynamic tool registration) remains
waived/E.

