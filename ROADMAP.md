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

## Memory divergence verdicts

- Check a memory's structured claims against recorded state and return a
  verdict — confirmed, misattributed, displaced, conflated, false outcome, or
  affect drift — without rewriting the event log.
- Add the GM truth view, the `[divergence]` marker, and the subjective recall
  probes.

**Trigger:** shipped when a fixture with a deliberately wrong memory returns
the expected verdict, recomputation is identical, and the event log is
unchanged.

## Disclosure axis and Player exposure

- Add `open` / `guarded` / `secret` disclosure to subjective memory; secret
  memories shape narration but are never quoted.
- Open the surface to the Player badge for the active entity and extend the
  draft visibility scan to secret memory keys.

**Trigger:** shipped when a secret memory influences the GM briefing, is
redacted from a Player draft, and a Player read of another entity returns
`[FORBIDDEN]`.

## Psyche-depth identity facets

- Extend identity facets with kind, awareness, false-but-held belief, valence,
  temporal bounds and owned contradictions, keeping candidate staging and the
  versioned kernel.
- Add a deterministic "who they are" renderer to the briefing and a
  contradiction-tension surface.

**Trigger:** shipped when a developmental facet remains a proposal, a false
belief renders marked, and a contradiction survives reconciliation.

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
