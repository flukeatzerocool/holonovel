# Ruleset semantic index — Phase 0 no-go

Date: 2026-11-10
Plan: Competitive Recommendations, Increment D (REQ-657)
Status: closed — no-go

## Setup

- Package: `dnd2024` (Dungeons & Dragons 2024), 5,655 indexed entries.
- Data dir: a scratch copy of the package and `ruleset-registry.json`; no Novel
  bound (`manage_ruleset (action: search, slug)`).
- Method: five paraphrase queries whose expected entry exists in `index.json`.
  A miss is the expected anchor absent from the top 10; a misrank is present but
  not first.

## Results

| # | Query | Expected anchor | Result |
|---|---|---|---|
| 1 | grab and hold a creature | `Grappling` | MISS |
| 2 | leaving an enemy's reach provokes a strike | `OpportunityAttacks` | rank 3 |
| 3 | spell ends when you take damage | `Concentration` | MISS |
| 4 | knocked off your feet | `DroppingProne` | MISS |
| 5 | fatigue from skipping a long rest | `Conditions` | MISS |

Top results were populated but off-target (e.g. `b1b_captain_s_quarters` for
query 1, `Level1Rage` for query 3), so the misses are ranking behaviour, not an
empty index. The expected anchors are present in the package index.

## Decision

The Phase 0 gate requires five ranking misses. The run produced four misses and
one top-3 hit. The threshold is not met, so **REQ-657 is not built**: no
`ruleset` item type, no `semantic` option on `manage_ruleset search`, no new
index path.

This is not a claim that exact search is good. Four of five paraphrases miss,
which is a real semantic gap. It is a claim that the demonstrated need is below
the bar this plan set, and building an index path without meeting it would be
feature work ahead of evidence.

## Reopen predicate

Reopen when any of the following is demonstrated:

1. A fifth ranking miss in ordinary play, recorded with the query and the
   expected anchor.
2. A competitor ships offline semantic retrieval over multiple rulesets.
3. A user-visible rules lookup failure that the keyword index cannot fix without
   changing REQ-315 coverage behaviour.

The evidence above is retained so a future run can diff against it.
