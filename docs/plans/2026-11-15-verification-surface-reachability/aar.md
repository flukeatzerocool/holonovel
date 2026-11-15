# AAR — verification-surface reachability

Increment: `docs/plans/2026-11-15-verification-surface-reachability/`
Plan: `plan.md` (sha256 `b28b3fc3…94be5`, cold-reviewed fresh, delta-reviewed)
Commits: `acf7489` (red-baseline repair), `ab5bca3` (surface wiring), this one
(docs and close).

## What was supposed to happen

The plan's done bar: the three harnesses each run in a gate, CI step, or hook
with a role header matching their exit behaviour, and both `check:fast` and
`check` pass on the final tree. Phase 0 had to make the 56-command suite green
first (19 stale anchors, two Player-surface leaks), then Phase 1 wired
`test:all`, `test:loop-artifacts`, and `test:holosuite-mutation`, and Phase 2
updated the gate table, the stale prose, and the roadmap.

## What happened

Done bar met on the primary path; the C-1 fallback was not entered.

| Step | Evidence |
|---|---|
| S1 — 23 anchor sites repointed | five tier commands PASS; per-anchor table in `tasks.md` |
| S2 — two leaks cleared | `test:backfill` 119/0, `test:narrative` 84/0; `surface-budget` PASS after the regenerated artifacts |
| S3 — suite dry run | `npm run test:all` → 56 passed, 0 failed (184.6 s) |
| S4–S8 — manifest, retirement guard, role header, CI, pre-push | `check:fast` 43/43 PASS; `check` 95 PASS lines, exit 0; `gate-cost --threshold 1` shows no protected gate as a candidate; a temporary retirement entry naming `test:all` left it blocking; `bash -n` clean; `check-workflows` PASS; `check-script-discipline` PASS |
| S9 — gate table | `check-gate-table` PASS |
| S10 — stale prose | `playtest/README.md` states the mutation gate is advisory; `holosuite.ts` made no gate-exclusivity claim |
| S11 — records | roadmap section removed (`check-roadmap` OK); register rows F-U4-4/F-U4-6 moved to Resolved; CHANGELOG entry dated 2026-11-15 |

Plan conditions: C-5 (fallback-gate wording fixed after the re-review cap)
verified by `build-review` at execution start; C-2's cost estimate was 184.6 s
measured against the predicted ~3 minutes; C-3's anchor work is evidence-only;
C-4's hook edit is verified by `bash -n`, the discipline gate, and the
`--recorded` round trip (`check` ran on this tree).

## What went right

- The error-gate dry run paid for itself: wiring a red suite would have made
  every subsequent gate red, and the plan caught that before the first edit.
- The delta rule worked. S2's assumption (a renderer filter) was wrong; the
  amendment recorded the real causes — a missing `badge_scope` setter and an
  over-broad assertion — before the fix landed, and the blast radius grew to
  include the regenerated surface artifacts.
- The cold pass caught the plan's own impossible acceptance criteria (a Phase 0
  command that did not exist yet, a cost-report invocation that could not
  output what it claimed).

## What went wrong

- **P0 — the suite was red at HEAD (fixed in commit 1).** 49/56 with 23 stale
  anchors and two leaks. A 2026-11-13 increment had closed the same suite at
  56/0, so this is recurrence, not inheritance.
- **P0 — `manage_countdown (action: set)` never accepted or persisted
  `badge_scope` (fixed in commit 1).** REQ-073c1/073c2 require it; the model
  field existed but no path set it, so GM-only clocks reached the Player
  briefing. T139 was the only detector.
- **P0 — `test-narrative` T-new forbade every relationship marker on the Player
  surface (fixed in commit 1).** REQ-281b keeps own-entity bonds visible; the
  assertion now targets the NPC↔NPC pair.
- **P2 — anchor drift repeated inside one session.** The S2 edit shifted twelve
  sites below `index.ts:8634` by four lines and immediately failed three tiers;
  the anchors were recomputed on the final tree. This is the same failure the
  scheduled P2 *Holosuite anchor repoint automation* item exists for; no new
  action, and this increment is additional evidence for that item.
- **P3 — the publish pipeline runs `test:all` a second time.** Accepted in D2
  (rare path, fingerprint-scoped) rather than coupling the pipeline to
  `.holonovel-state/gate-run.json`.
- **P3 — a `write` call truncated `CHANGELOG.md`.** Caught immediately by a line
  count, restored from `HEAD`, and the entry re-applied with a prepend; the
  committed file is the full 12,641-line log. Record-and-close: the tool's
  overwrite semantics are the hazard, and the check was a two-second `wc -l`.

## Skill-level findings

- **Plan-gate report binding (second occurrence of SK-8).** The gate binds the
  cold artifact to the plan by the **first** `Plan sha256:` line
  (`plan-gate-core.mjs:258-268`). Amending the plan after the cold pass leaves
  that header stale, and `mark-build` then refuses with "independent-review
  report is not bound to this plan" until the header hash and the stamp are
  refreshed. No new register row: SK-8 already records this contract gap, and
  this session is its second predicate (`stamp-plan` → `mark-build` after a
  delta). SK-8 stays `open` for the skill-improvement loop.

## Follow-through register

- ROADMAP *Verification-surface reachability (P1)*: **Resolved**, section
  removed; `check-roadmap` OK.
- Review register F-U4-4 and F-U4-6: **Resolved** (2026-11-15) with predicates.
- F-U4-7 (CI↔manifest split) remains scheduled under the P2 roadmap item; the
  three removed CI steps narrow it by nine commands but do not close it.
- Next roadmap item: *G7 attestation predicate (P1)*.

## Loop status

Every finding above has a terminal disposition: fixed in this increment, or
recorded with a dated note; the gating suite is green (`check:fast` PASS,
`check` PASS, `test:all` 56/0) and the roadmap item is closed.

LOOP PAUSED
