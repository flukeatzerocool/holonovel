# AAR — Subjective recall quality and retention

Session 2026-11-08. Plan:
`docs/plans/2026-11-08-subjective-recall-retention/plan.md` (revision 2, plan
gate stamped `2026-11-08T20:58:40Z`, independence self).

## What shipped

1. `scoreMemory` — one integer score (salience × 1000 + recency + origin) with
   §7.9e as the normative algorithm; `selectForBriefing` sorts by it, ties by
   descending ordinal then ascending id (REQ-644).
2. `assembleMemorySection` — whole-record admission, record cap plus
   `TTRPG_SUBJECTIVE_MEMORY_BRIEFING_TOKENS` (default 800), and a
   `[truncated] N memories omitted at budget` count computed over the badge's
   rendered set (REQ-645).
3. `eventState` — `retained` | `evicted` | `none`, driving `[evicted #<ordinal>]`
   in the briefing line and a derived `event_state` member on
   `manage_belief (action: subjective_list)` (REQ-646).
4. `selectForEviction` + `foldIntoSummary` — per-entity retention
   (`TTRPG_SUBJECTIVE_MEMORY_PER_ENTITY_MAX`, default 500) evicting
   lowest-score-first, folding gists into `compression_ladder.entities` bound by
   `TTRPG_SUBJECTIVE_MEMORY_CONSOLIDATION_MAX` (default 2000); the global cap
   keeps oldest-first but folds through the same helper; the summary surfaces in
   the GM campaign tier only (REQ-590, REQ-627, REQ-647).
5. Subjective probe family — committed fixture
   `holonovel/scripts/fixtures/subjective-recall.json`, per-badge
   `subjective recall@budget`, the O.12 floor, and a synthetic-miss detector
   (REQ-648).

## Evidence

| Step | Command | Result |
|---|---|---|
| Baseline | `npm run check:fast` (un-piped) | PASS, 37/37, before the increment's plan dir existed |
| Spec assembly | `npm run assemble` | 0 errors |
| Recall harness | `cd holonovel && npm run test:memory-recall` | 12 passed, 0 failed (T697–T700, T752, T766–T770) |
| Belief suite | `cd holonovel && npm run test:belief` | 27 passed, 0 failed (T745 reconciled) |
| Briefing suite | `cd holonovel && npm run test:briefing` | 14 passed, 0 failed |
| Full gate | `npm run build-order` | Runs the full `check`; playability PASS (4 Novels) |
| Coverage | `npm run validate -- --write-register` | 0 errors; bucket A 0, B 0, C 473, E 126 |
| Tool artifacts | inside `check:fast` | `check-tool-definitions-sync`, `surface-budget`, `surface-replay` PASS |
| Fingerprints | `npm run build-order` | `contract-fingerprints.ts` refreshed; `check-fingerprint-sync` PASS |

Subjective recall reported: 100% (4/4) Game Master, 100% (4/4) Player at the two
declared budgets.

## Done bar

Every clause of the plan's done bar is met by a named test:

- Two renders at one budget are byte-identical with the same ordered set —
  T766.
- The eviction pass reports `[evicted #1]` in the section and `evicted` in the
  list, with `none` for a record that cites no event — T768.
- The probe suite fails on a deliberately withheld expectation, proven by the
  synthetic-miss probe and by a fully withheld render map — T770.
- The budget truncation fixture reports `[truncated]` with a badge-scoped count
  strictly smaller for the Player — T767.
- Per-entity retention evicts the lowest-scored record, the consolidation
  summary reaches the GM recap, the Player recap omits it, a `close_session`
  ladder refresh preserves it, and a re-fold does not duplicate a line — T769.

## Deviations recorded during execution

- **Plan revision 2, before the first edit.** The confirming plan review raised
  three build conditions. C-1: the 400-token budget default was raised to 800
  and the "no config change keeps today's output" promise was dropped — the gist
  is author-supplied and unbounded, so the budget is a ceiling, not a
  guarantee. C-2: the `[evicted #<ordinal>]` form was pinned in §7.9e and the
  REQ-646 body was reworded to name the ordinal. C-3 was confirmed at close
  (bucket A 0, REQ-644–648 bucket C).
- **Fixture tight budget is 100 tokens, not 60.** At 60 the second required
  probe's line fell outside the budget once the secret record was included; the
  fixture declares the budget where the required probes must survive, which is
  the contract REQ-648 states. The truncation test keeps its own tighter 60.
- **`none` is exercised through an empty event log, not a save-file edit.** The
  drafted test planned to null a record's ordinal on disk; recording before any
  event exists reaches the same state through the public tool, so the file edit
  was dropped.
- **REQ-648 is cited in the section composer** (`holonovel/src/index.ts`) in
  addition to the harness. `validate` sources coverage citations from
  `holonovel/src` only, and the composer is the surface the probes measure.
- **Starter artifact rebuilt twice** — the first build preceded the final
  `assemble`, so `check-starter-freshness` caught the stale `DATA_FORMAT` in
  `build-order`. Rebuilt and re-verified.

## Findings

| Finding | Severity | Disposition |
|---|---|---|
| The global cap's oldest-first slice originally bypassed consolidation, contradicting the plan's "nothing is lost" claim | P0 (caught in plan review, before code) | **Resolved** — both bounds fold through `foldIntoSummary`; T769 asserts the GM recap carries the evicted gist |
| `[truncated]` now has two meanings in the ladder family (dropped tier vs omitted record) | P2 | **Resolved** — §7.9e names all three marker forms; T699 and T767 assert the two `[truncated]` forms independently |
| A Player-visible consolidation summary would need a per-line disclosure matrix | P2 (deferred by design) | **Closed-P3** — recorded in DECISIONS D9 and the plan's out-of-scope; no demonstrated failure |
| Score weights are contract constants, not config | P3 | **Record-and-close** — recorded in DECISIONS D9; a config would let two servers disagree on one Novel |
| Proofread-register warning count drift | P3 | **Record-and-close** — pre-existing informational drift (the register names findings, not a total); this increment adds eight REQ bodies and does not clear it |

## Coverage backlog

`spec/audit/req-coverage.md`: bucket A 0, bucket B 0, bucket C 473, bucket E
126 (599 REQs). REQ-644–648 are bucket C with T766–T770 as direct evidence.

No P0 or P1 remains, no new action item is open, and the roadmap section is
removed because the work shipped. Nothing is scheduled on `ROADMAP.md`.

LOOP PAUSED
