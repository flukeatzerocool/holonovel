# After-action report — Trust-core error envelope

Plan: `plan.md` (v3; `cold-review.md` and `re-review.md` record the review
trail). Commit: one, via `npm run session:close`.

## What shipped

| Bar | Result | Evidence |
|---|---|---|
| 1 refusal envelope | PASS | `test:backfill` T178 (117 passed); probe: `[ERROR] [FORBIDDEN]` + one standalone line + structured + `isError` |
| 2 error boundary | PASS | `test:output-contracts` T180 (516 passed); structural errors carry the SDK `-32602` shape and no category |
| 3 declared status | PASS | T632 extension; `grep -rn '"RAW"' holonovel/src` → no matches |
| 4 structured values | PASS | T634 extension; `values` mirrors the text enumeration on the scene-type refusal |
| 5 dispatcher result | PASS | T180b (`resolve_fate` → `[ERROR] [NOT_FOUND]` + structured) |
| 6 coverage register | PASS | `validate -- --write-register` → current, 0 errors |
| 7 registers/roadmap | PASS | `check-registers`, `check-roadmap` pass; six rows resolved, three recorded, F-S1 amended |
| 8 gates | PASS | `check:fast` 41/41 after fixes, trailing `check:fast: PASS`; `test:all` 56/56 |
| 9 one commit | PASS | see `git log -1` |

## What went right

- The cold review paid for itself: three blockers (hash/provenance, the
  `isError` drop, the ROADMAP duplication) would each have shipped as a
  defect. The `refusalResult` split (D4) avoided a much larger `err()` change.
- The step-0 probe changed the plan before any assertion was written: the SDK
  shape, the pacing observability gap, and the dispatcher path were all
  measured rather than assumed.
- Anchor repoints were mechanical: every drift finding resolved to a unique
  current line (15 anchors across four Holosuite libs).

## What went wrong

- **Plan amended twice mid-execution.** Delta A1 (T386c + bar 5 repoint) was
  forced by the probe, and a further correction was needed when T386c's first
  two designs mis-modelled the counter (new-novel scene set is not a
  transition; the Player briefing does not render the pacing section). The
  empirical-threshold design is the one that works.
- **Four harness expectations encoded the removed override.** `G9`, T753,
  T756, T720, and T699 asserted `[ERROR] [INVALID_INPUT]` for schema-level
  violations. Each was reconciled to accept the SDK shape. This is the
  "existing-expectation reconciliation" step the plan named — but the count
  (five sites) was discovered during the run, not planned.
- **Generated artifacts drifted twice.** `tool-definitions.json` (the
  `OUTPUT_SCHEMA` description) and `spec/audit/tool-surface-baseline.json` +
  the DECISIONS token counts (29,417 → 29,806) both needed regeneration.
- **Proofread warning count moved** from 283 to 284 (one new advisory from the
  REQ edits); `validate` still reports 0 errors.

## Findings recorded, not fixed

- **F-P1-14** (REQ-001b1): returned `err()` results still carry no
  `isError: true`.
- **F-P1-15** (REQ-548c): SDK parameter-validation results carry no structured
  result, while REQ-548c says "every error response".
- **F-P1-16** (REQ-002c1/REQ-445): the ruleset lookup `Valid values:` list is
  not badge-filtered (`index.ts:2280`).
- **Observation (P3, no action):** under `TTRPG_SURFACE_PROFILE=small`,
  `manage_adventure`, `manage_story`, and `manage_combat` returned normal
  results rather than a group refusal. F-P1-7 (dispatcher gating) is the
  owning finding; recorded here as an unverified anomaly.
- **Observation (P3):** REQ-002 says "eight categories" while Appendix O.2
  lists ten (adds `[MISSING_PARAM]`, `[REJECTED]`). Recorded, not fixed.

## Delta A2 (discovered in step 7)

The plan's blast-radius table did not name these, and the change needed them:

- `holonovel/scripts/test-belief.ts`, `test-selection.ts`,
  `test-memory-recall.ts` — three further sites that asserted the removed
  override's `[ERROR] [INVALID_INPUT]` for schema-level violations (reconciled
  alongside `G9` in `test-output-contracts.ts`).
- `holonovel/tool-definitions.json` — regenerated: the `OUTPUT_SCHEMA`
  description is part of every tool's output schema.
- `spec/audit/tool-surface-baseline.json` and `holonovel/DECISIONS.md` — the
  surface footprint moved 29,417 → 29,806 tokens; regenerated and recorded
  (REQ-571/REQ-107a).
- `holonovel.md`, `holonovel/holonovel.md`, `spec/build-phase-map.md` —
  assembled outputs of the spec edit.

Deviation: `holonovel/src/core/state.ts` was **not** edited. The plan's C1
proposed dropping the inline `Corrective action:` tails, but `normalizeRefusal`
splits the message instead, so one canonical shape was already available and
the core module stayed untouched.

Correction (from the v3 binding pass): plan §4a cites `index.ts:713` for the
`pacing_counter` assignment; `:713` is `pacingSignalText` and the assignment is
`:730`. The plan bytes were left frozen so the gate binding stays valid; the
corrected reference is recorded here.

## Condition C-A1 verification

`C-A1` — delta A1 added `test-narrative.ts` T386c and repointed bar 5 to the
probed retired-alias refusal after the standard re-review cap. Verified here:
T386c fails without the pacing guard (measured: 83 passed, 1 failed with the
guard removed) and passes with it (84 passed, 0 failed); bar 5 is asserted by
T180b, which exercises the probed path.

## Register hygiene

- `spec/audit/review-register.md`: six `Resolved` rows with post-change
  predicates; F-P1-4…F-P1-9 and F-P1-13 predicates refreshed; F-P1-14/15/16
  added under `Scheduled-roadmap`; F-S1 reduced to four citations.
- `spec/audit/req-coverage.md`: regenerated; REQ-001b2 now evidenced by T180.
- `ROADMAP.md`: bullet 1 replaced by the remainder bullet; citation bullet
  drops REQ-001b2. Section still has three bullets and one trigger.

## Recommendations

None open. The three recorded findings sit on the ROADMAP section, not in this
list.

LOOP PAUSED
