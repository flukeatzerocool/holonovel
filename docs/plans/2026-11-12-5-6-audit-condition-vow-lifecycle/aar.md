# AAR — §5.6 audit, condition, and vow lifecycle remediation

Status: complete · Increment: `docs/plans/2026-11-12-5-6-audit-condition-vow-lifecycle/`
Plan sha256: `c25e2c98…` (revision 1 `56752406…`; cold pass and delta review in `cold-review.md`)

## What happened

The increment took F-P3B1-4, F-P3B1-5, F-P3B1-8 and the two citation rows of
F-P3B1-9 whose behaviour lands in those surfaces (T8, T335). It also removed a
stale `ROADMAP.md` section whose trigger had already been met and narrowed the
surviving §5.6 section to the deferred recap/clock/combat-report work.

Order of work:

1. **Phase 0.** Skeleton AAR written so `check-loop-artifacts` stayed green;
   `npm run check:fast` baseline 41/41; stale roadmap section removed;
   sibling-contract probe (`manage_condition`/`manage_vow` bind only
   REQ-217/289/322, with advisory mentions in REQ-356/361/362); six-surface
   probe; two existing expectations reconciled (`test-narrative.ts` ungated
   resolve, T369 tick assertion) and a third named for Phase 5 (Appendix F).
2. **Phase 1 (red).** Assertions written before implementation and observed
   failing: `test-output-contracts` 483 passed / 28 failed (T8, T258 Player
   paths and audit, T369 fill/retention, T335 gate/consequence/marker/audit);
   `test-persistence-guardrails` 24 passed / 1 failed (`T10/REQ-041b`).
3. **Phases 2–4.** Condition authorization + audit; badge old/new audit before
   save; `appendAuditEntry` extraction + snapshot truncation; vow gating,
   clock fill/retention/removal, consequence entry, recap surfacing, rank
   table, audits.
4. **Phase 5.** Register, roadmap, Appendix F row, tool definitions, surface
   baseline, DECISIONS token counts, coverage register, CHANGELOG.
5. **Phase 6.** Gates.

## Evidence

| Step | Command | Result |
|---|---|---|
| Baseline | `npm run check:fast` | 41 passed, 0 failed, `check:fast: PASS` |
| Red probe A | `npm --prefix holonovel run test:output-contracts` | 483 passed, **28 failed** (new assertions) |
| Red probe B | `npm --prefix holonovel run test:persistence-guardrails` | 24 passed, **1 failed** (`REQ-041b`) |
| Green A | `npm --prefix holonovel run test:output-contracts` | **511 passed, 0 failed** |
| Green B | `npm --prefix holonovel run test:persistence-guardrails` | **25 passed, 0 failed** |
| Green C | `npm --prefix holonovel run test:narrative` | 83 passed, 0 failed |
| Green D | `npm --prefix holonovel run test:persistence` | 49 passed, 0 failed |
| Green E | `npm --prefix holonovel run test:security` | 12 passed, 0 failed |
| Green F | `npm --prefix holonovel run test:tool-definitions` | 22 passed, 0 failed |
| Types | `npm run typecheck` | clean |
| Definitions | `check-tool-definitions-sync` | in sync (37 tools) |
| Surface | `surface-budget` | PASS — full 28,956 / standard 25,358 |
| Coverage | `validate -- --write-register` | 0 errors, 287 warnings; A/B/D gaps 0 |
| Registers | `check-registers`, `check-roadmap` | clean |
| Fast gate | `npm run check:fast` | 41 passed, 0 failed, trailing PASS |
| Full gate | `npm run build-order` | 0 errors, 286 warnings; propagate/typecheck/bump/markers/version all OK |

Selected red transcripts (abridged, from the Phase 1 run):

```
FAIL T8 old badge recorded: expected to contain ""from":"game_master"" but got:
FAIL REQ-217b Player self-apply: expected to contain "[OK]" but got:
FAIL REQ-217c apply audited: expected to contain "apply_condition" but got:
FAIL REQ-289b dangerous is a 20-milestone track: expected to contain "20 milestones" but got:
FAIL REQ-289c resolve gated on the track: expected to contain "[STATE_CONFLICT]" but got:
FAIL REQ-289d forsaken marker in recap: expected to contain "[vow-forsaken]" but got:
FAIL T10/REQ-041b: expected 2 truncation entries after 12 mutations, got 0
```

## Deviations

1. **Delta amendment (approved path).** Phase 1 found `index.ts:4037-4040`
   created the suggested vow clock **full** (`ticks = total`). Under the
   approved eligibility rule that made resolve immediately available, defeating
   REQ-322d. Plan §12 was added; the clock is created empty
   (`0/total`, `direction: increment`) and fills one tick per milestone. The
   plan gate was re-stamped after a self-review of the delta (standard-depth
   diff re-review cap already spent) — recorded in `cold-review.md`.
2. **`manage_story` schema gap.** The tool description promised "previews
   unless detail is set" but the schema had no `detail` parameter, so the full
   record (including `scene_anchor`) was unreachable. Added
   `detail: z.boolean()`; the T335 anchor assertion uses it.
3. **Countdown rendering narrowed.** A first pass rendered any clock at
   `ticks >= total` as "filled", which broke REQ-329's decrement-clock
   snapshot ("candle(12 remaining"). Rendering is mission-clock-only:
   `<ticks>/<total>` then `filled`; every other clock keeps "N remaining".
   The task list's T369 expectation matches.
4. **Badge label assertion.** T8 asserts the briefing heading token
   `GAME_MASTER` (the raw `badgeLabel`), not "GAME MASTER".
5. **Assemble outputs.** Phase 6's `npm run assemble` rewrote `holonovel.md`,
   `holonovel/holonovel.md`, and the `spec/build-phase-map.md` content hash —
   generated files, outside the blast-radius table but inside the plan's
   stated gate sequence.

No other deviation from the approved plan; no out-of-plan file was modified.

## Findings

1. **F-P3B1-10 — cross-badge undo (REQ-041a).** Found while writing T8: undo
   stacks are badge-keyed (`core/state.ts:2104-2116`), so a mutation made under
   one badge cannot be reversed from another, while REQ-041a requires exactly
   that. Disposition: **Scheduled-roadmap** — new `ROADMAP.md` *
   Cross-badge undo stack access (P1)* section; register row added; the
   increment did not widen its own bar to absorb it.
2. **Line drift in the review register.** F-P3B1-3/-6/-7 still carry the
   2026-11-09 line anchors; they are scheduled, not resolved here, and the
   anchor-repoint roadmap item owns the wholesale fix. Recorded, no action.
3. **`spec_health` session `entry_count` excludes the truncation entry.** This
   is by design (the entry is bookkeeping, not a mutation) and Risk 8 in the
   plan predicted it; no gate detects a mismatch. Recorded as a P3 observation.
4. **Player scope filtering in the briefing thread list (REQ-289e).** The new
   active-vow line keeps the pre-existing unfiltered behaviour; not a
   regression and not part of F-P3B1-8. P3, recorded.

## Done bar assessment

All declared items are met: F-P3B1-4/-5/-8 `Resolved` with current predicates
and their assertions; F-P3B1-9 narrowed to nine IDs; stale roadmap section
retired and the surviving section narrowed; cross-references updated; red
transcripts recorded above; the six suites, typecheck, surface, coverage,
`check:fast`, and the full gate green; generated surfaces regenerated;
`LOOP PAUSED` requires no open P0/P1 beyond the scheduled roadmap, and
F-P3B1-10 is scheduled.

Publication (`push-pipeline.sh`) was **not** run: this session was authorized
to execute the plan, not to publish.

## Loop status

LOOP PAUSED — no new action items; the one new finding is scheduled on
`ROADMAP.md` and in the review register.
