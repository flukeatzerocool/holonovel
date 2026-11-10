# After-Action Report — §5.2/§5.8 assertion repair

Date: 2026-11-09 · Increment: `docs/plans/2026-11-09-5-2-5-8-assertion-repair/`

## What was attempted

Close the first open roadmap item (§5.2/§5.8 assertion repair, P1) by writing
the Appendix F assertions that nine review findings said were unexercised.

## What happened

The first plan assumed the contracts were implemented and only the citations
were stale. The cold pass and direct verification disproved that: four of the
nine findings name behaviour that does not exist (story-journal `entity_ids`,
the GM lore briefing surface plus `lore://groups` and the lore token budget,
the character-sheet "Known Information" section, and the dynamic
generation-table enumeration). The plan was rewritten as probe-first, re-gated,
and executed.

## Outcome

- Resolved: **F-P7b-8** (REQ-082a/b/c citations split between T66 and T205).
- New committed evidence: **T136** (scene transition hook), **T94** (synthesis
  reversion), **T144** (synthesis rebuild), **T324** (synthesis removal) — all
  in `test:backfill`, harness green (82 passed).
- Re-scheduled with verified predicates: F-P7b-1, -2, -3, -4, -5, -6, -7, -9
  under the rewritten roadmap section `§5.2/§5.8 assertion and behaviour
  remediation (P1)`.
- Coverage register regenerated: 0 bucket-A gaps.

## What went right

- The plan gate caught the false premise before any commit.
- Probe-first kept every committed test green; no failing gate was introduced.
- Each rescheduled finding now carries a `file:line` predicate instead of a
  vague "write the assertion" instruction.

## What went wrong

- The initial plan asserted implementation conformance without verifying it;
  the cold reviewer found three blockers that source reads confirmed.
- Several first probe attempts failed for test-construction reasons (badge
  state cascade, export payload nesting), costing two extra harness runs.
- The increment closes only one of nine findings; the roadmap section is now a
  remediation program, not an assertion-repair session.

## Recommendations

- Schedule the remaining work from ROADMAP, not from this AAR.

LOOP OPEN
