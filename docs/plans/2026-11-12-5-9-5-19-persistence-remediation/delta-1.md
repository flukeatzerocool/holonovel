# Delta 1 — never-truncated tier for the §5.19 sections

Discovered during Phase 4 verification (the T469 budget leg the plan already
required). Not a scope change: it is the REQ-135 half of the directive work.

## Finding

`NEVER_TRUNCATED` (`holonovel/src/index.ts:3174`) listed only
`badge boundary`, `turn handoff`, `play loop`, and `intro`. At
`TTRPG_MAX_BRIEFING_TOKENS=200` the GM briefing rendered:

```
### State persistence [truncated — full content: guidance://state-persistence]
### State_ledger [truncated — full content: guidance://state-ledger]
### Persistence tools [truncated — full content: guidance://persistence-tools]
```

REQ-400 ("The directive SHALL render in the never-truncated tier (REQ-135)"),
REQ-401 ("The token SHALL be never-truncated per REQ-135"), and REQ-407 ("The
server SHALL never truncate those tools per REQ-135") are therefore violated
today. The plan's D7 preserved the directive text but did not add the section
headers; the budget assertion exposed the gap.

## Change

`NEVER_TRUNCATED` gains `state persistence`, `state_ledger`, and
`persistence tools`. The budget case in `test:persistence-guardrails` asserts
the directive body survives a 200-token budget.

## Evidence

- Before: `budget briefing directive window: State persistence [truncated — full content: guidance://state-persistence] …`
- After: `24 passed, 0 failed` in `test:persistence-guardrails`; the
  directive, ledger, and tool list render in full at the same budget.

## Plan-gate note

This delta is recorded outside `plan.md` so the stamped plan hash stays
`495c13dd…`. `build-review` §6 treats it as an in-plan Phase-4 verification
outcome; the AAR cites it.
