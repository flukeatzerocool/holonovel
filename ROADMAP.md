# Roadmap

<!--
  Admission rule: a `## <title>` section is a scheduled work item. It needs an
  action a maintainer can take, 1–3 bullet lines, and a `**Trigger:**` line
  naming what starts the work or what closes it. Priority order, P0 first;
  remove a section when the work ships (it moves to CHANGELOG.md).

  Standing facts are not roadmap items: accepted tradeoffs, by-design
  limitations, and out-of-scope tracks are recorded in `holonovel/DECISIONS.md`,
  and `## Non-goals` is the pointer to them. `npm run check-roadmap` enforces
  this rule; `## Non-goals` is exempt.
-->

## Subjective recall quality and retention

- Replace the minimal selection with a deterministic score, budgeted assembly,
  `[truncated]` / `[evicted]` reporting, and per-entity retention with
  consolidation into the compression ladder.
- Extend the recall-probe harness with the subjective probe family and a
  declared floor.

**Trigger:** shipped when two runs at one budget return the same ordered set,
an eviction fixture reports `[evicted]`, and the probe suite fails on a
deliberately missed required probe.

## Non-goals

Authoritative list and rationale: `holonovel/DECISIONS.md` § Non-goals.
