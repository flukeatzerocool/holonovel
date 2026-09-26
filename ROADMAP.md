# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Scheduled — World in Motion gating decision (T358 vs T389)

The spec must name one gating owner and default for the `## World in Motion`
section. T358 expects `TTRPG_WORLD_REACTIVITY=on` alone to surface an NPC
goal-pursuit entry; T389 expects `TTRPG_NPC_AUTONOMY=off` to suppress goal
pursuit (default off per REQ-339). The current implementation gates the section
on reactivity and seeds goal pursuit under NPC autonomy — pending a spec
decision. Surfaced by the config-surface parity gate (B1); recorded in
`spec/audit/review-register.md` Scheduled-roadmap.

## Deferred — action-contract conflict lint (REQ authoring guard)

A validator check that flags two REQs binding the same tool action with
disjoint parameter sets (the REQ-086 `compress max_entries` versus REQ-239
`compress sessions` class). Held by user decision 2026-09-26 until a vetted
parser for `tool (action: X, params…)` bindings exists — the current parse is
heuristic and would produce false positives. The Appendix M action-contract
uniqueness item covers the convention in the interim.

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

## Feature parity — N3 Perception Ledger (REQ-540–545) — SHIPPED 2026-09-24

Append-only per-entity perception ledger, distinct from belief, ships as
`manage_perception`. The N1–N3 program is complete; only the narrowed M3
(briefing consistency) remains below.

## Feature parity — COMPLETE 2026-09-24

All roadmap items are shipped or dispositioned. Nothing is scheduled.

- **M1** Temporal event log, belief/evidence, identity firewall, causal
  validation — shipped.
- **M2** Knowledge corpus, semantic index, knowledge graph — shipped.
- **N1** Supplementary ruleset import — shipped under the REQ-372d waiver.
- **N2** Durable agent tasks — shipped.
- **N3** Perception ledger — shipped.
- **M3** Briefing consistency — shipped (narrowed: token budgeting already
  shipped; this adds the consistency cursor and derived-surface freshness).
- **M4b/M5a/M5b** de-scoped or folded (see dispositions below).
- **REQ-373** (dynamic tool registration) — recorded waived intended gap.

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
Wisdom-only import under the REQ-372d build-scope waiver; Pattern
Buffer S30/S31 now execute. REQ-373 (dynamic tool registration) remains
waived/E — the waiver was corrected 2026-09-25 to cite build scope, not stack
capability (the MCP SDK supports runtime registration).

## Residual remediation — SHIPPED 2026-09-25

- **REQ-388 `holodeck_config`** — implemented (`manage_session (action: health)`);
  the behavioral-config contract was reconciled (Standing Rule 11 two-tier:
  `Behavioral` vs `Behavioral (mechanical)`).
- **REQ-137b badge-filtered `tools/list`** — implemented; the SDK ListTools
  handler is wrapped to filter by the active badge.
- **REQ-546 corpus retention** — `TTRPG_CORPUS_MAX_DOCUMENTS` /
  `TTRPG_CORPUS_MAX_ACQUISITIONS` bound the corpus ledgers.

