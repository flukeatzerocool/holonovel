# AAR — Subjective memory store (GM-only)

**Date:** 2026-11-08 · **Plan:** `plan.md` · **Tasks:** `tasks.md`
**Roadmap:** chunk 1 of 5 (`ROADMAP.md:15-25`, now retired).

## Planned vs. happened

| Planned | Happened |
|---|---|
| §5.35 + REQ-623–628 | Shipped as planned; one sentence split in REQ-623 and REQ-628 after the proofread pass flagged length and readability. |
| §7.7 group, two §7.6 configs, §5.19 + REQ-109 references | Shipped as planned. Group count 40 → 41 (also corrected T425/T439's stale 38); build-phase-map 33 → 35. |
| `core/subjective.ts`, state field, actions, briefing, health, redaction | Shipped as planned. All ten `subjective_*` fields are optional in the shared schema; the handler enforces the five required ones. |
| T743–T747 in `test-belief.ts` | Shipped; 18/18 pass. |
| Registers, DECISIONS, CHANGELOG, ROADMAP removal | Shipped, plus two blast-radius items the plan missed (below). |

## Verification evidence

- `npm run check:fast` → 37 passed / 0 failed, `check:fast: PASS`.
- `cd holonovel && npm run test:belief` → 18 passed / 0 failed (T551–T562, T629, T743–T747).
- `npm run build-order` → complete, 0 errors, 260 warnings; fingerprints advanced.
- `HOLONOVEL_IMPL_STRICT=1 npm run validate` → 0 errors; buckets A 0 / C 453 / E 126; register current.
- `npm run check-tool-surface` → PASS, 292 actions; `check-tool-definitions-sync` → in sync; `action-conflicts` → all baselined.

## What went right

1. **Plan-review caught two execution blockers before the first edit.** The
   five-required-field split would have broken the other twelve
   `manage_belief` actions (one flat schema, parsed on every call), and the
   missing `tool-surface-registry.json` entries would have failed
   `check-tool-surface`. Both were resolved in the plan, not during debugging.
2. **The coverage audit moved as intended.** REQ-623–628 landed as bucket C
   with direct T743–T747 evidence; bucket A stayed at 0 and the register was
   regenerated in the same increment.
3. **The append-only design held without special cases.** Snapshot, checkpoint,
   and undo reuse the perception-ledger pattern; T746 proves a checkpoint
   restore keeps a post-capture record.
4. **Determinism is tested at the section, not the whole briefing.** The test
   compares the `## Subjective Memory` section between two renders, because
   rendering advances the pacing counter elsewhere in the briefing (REQ-336).

## What went wrong

1. **The plan missed the starter artifact.** Adding a persisted Novel field
   makes `holonovel/content/torre-nosferatu.json` stale, and
   `check-starter-freshness` fails in `build-order`. Fixed with
   `cd holonovel && npm run build:starter-novel`; the plan's blast radius and
   expected-failure list were amended. This is a recurring class for any
   increment that adds Novel state, and the gate already names the fix command.
2. **The tool-description budget tripped.** Two new actions pushed
   `manage_belief`'s description to 1034 B against the 1000 B recorded budget
   (REQ-024c); trimmed to fit. Expected in principle, not listed in the plan.
3. **Proofread-register drift was larger than this increment.** The register
   recorded 231 warnings; live was 257 (26 from REQs landed since Batch 7, one
   from REQ-628's readability). Batch 8 records the current count and
   disposition.
4. **A concurrent session committed intermediate plan versions** (inside
   `12215ac`) and placed a placeholder `aar.md`. The final plan and this AAR
   supersede them.

## Findings and dispositions

| # | Finding | Class | Disposition |
|---|---|---|---|
| F1 | New persisted field leaves the starter artifact stale; plan missed it | P3 (gate-visible, fixed in-session) | Fixed; plan amended. The `check-starter-freshness` message is the standing guard. |
| F2 | Description budget crossed at 1034 B | P3 (gate-visible, fixed in-session) | Fixed by trimming; no guard needed, `tool-definitions-lint` owns it. |
| F3 | Proofread baseline stale by 26 warnings from earlier increments | P3 (informational) | Resolved: Batch 8 entry, register now matches live. |
| F4 | `manage_context` read action suggested by the roadmap item, implemented on `manage_belief` | P3 (interpretation) | Recorded as DECISIONS D4/roadmap-chunk decision; no separate reader. |
| F5 | REQ-241a says checkpoints include all §7.7 groups; append-only logs are excluded in practice | P3 (pre-existing, not introduced) | Recorded in the plan's Open question 3; not widened here. |

## Methodology findings

- **Flat-schema tools report requiredness per tool, not per action.** REQ-408
  evaluates an action tool per action, but `spec_health.tool_required_param_counts`
  counts non-optional keys in the single shared shape. Recorded as DECISIONS D4
  so a future increment does not mark a new field schema-required.
- **A persisted-field checklist item is missing from plan review.** Any plan
  that adds a Novel field must list the starter-artifact rebuild. Candidate for
  the `plan-review` skill; routed there rather than edited ad hoc.

## Terminal

Gates green, strict coverage at bucket A 0, roadmap chunks 2–5 still scheduled
and untouched. No open P0/P1.

LOOP PAUSED
