# Workflow cadence

Two loops, one cadence. The rule is that routine things run routinely, and
anything that is not routine belongs in a plan with a tracked action.

## Per session

```
questions → research → plan → execute → AAR → fix if necessary → commit
```

1. Create `docs/plans/<date>-<slug>/` with `plan.md`, `tasks.md`, `aar.md`.
2. Execute the plan. A deviation is an amendment to `plan.md`, not a silent
   improvise.
3. Every AAR finding ends as a dated `ROADMAP.md` entry, a
   `review-register.md` row, or an explicit record-and-close. A prose
   recommendation with no owner is not a finding.
4. Close with `npm run session:close`. It derives the commit subject from the
   CHANGELOG heading, verifies the AAR, runs the fast suite, and commits. A spec
   increment stays one commit; a non-spec session is split by concern with
   docs/CHANGELOG last. `--single` is the explicit opt-out.

**Four rules that keep the session cheap.**

- **Context budget.** One increment per main session. Restart the session when the
  context approaches 100 k tokens; a second increment starts a new session.
  Delegate exploration to subagents, and read only the files a claim cites. The
  measured baseline is 175 k tokens average per turn in main threads against 60 k
  in subagents, and cache read was 98% of a week's token spend.
- **Review the delta.** Scope a review sweep to the sections whose REQs changed
  since the last coverage-register snapshot; re-verify untouched sections by gate
  only. A corpus-wide sweep is the expensive path and it mostly re-proves
  cleanliness.
- **Review budget.** Standard (cold) depth for new or changed surface; light
  depth for repair of surface already reviewed in the same program.
- **Shell ergonomics.** Set the tool's working directory instead of prefixing
  `cd`; prefer `edit` over `sed`; batch independent reads into one turn.

**Push on demand, not on a schedule.** The obligation is a cost bound: a push
must be resumable (`.holonovel-state/publish-run.json`, `--from`/`--only`/
`--resume`) so an on-demand push stays single-purpose instead of accumulating
into a batch. If a push fails, resume; do not start over.

## Weekly

```
npm run weekly
```

One fixed slot. Runs the full gate, the hermetic pipeline harness, the loop
audit, the gate-cost report, the register check, and the marker check, then
writes `spec/audit/weekly-<date>.md`.

This is the **replenishment point**: new findings may enter the schedule here
and nowhere else, so work in flight is not preempted. Items that are not
scheduled are explicitly parked, not "in progress".

## Monthly

- Release tag (the pipeline tags when the version advances).
- Dependency refresh.
- Upstream watch: review `docs/upstream/cof.md` against the pinned commit, triage
  every design-relevant delta, and update the pin and delta log. A delta that
  changes a pending chunk amends that chunk's plan; a new capability waits for
  the weekly replenishment point.
- Gate-retirement review: `npm run gate-cost -- --apply` downgrades a gate to
  advisory only when it has no findings across 20 consecutive runs **and** its
  manifest entry declares a `coveredBy` cover that still blocks the same finding
  class. A green streak is a candidate, not a decision: gates stay green
  precisely when the tree is healthy. The report prints each gate's fast-tier
  and full-tier saving, so the trade is visible — the fast tier runs
  concurrently, where retiring anything but the slowest gate saves nothing,
  while a full-tier gate's saving is its whole median. Deleting a gate is still
  a manual decision.

## Quarterly

- **Competitive integration-layer sweep.** Re-run the single-axis sweep over
  the SillyTavern extension ecosystem, agent-memory engines, and VTT modules.
  Surfaces: GitHub repository search, the SillyTavern extension index, and the
  source register in
  `report://mcp-servers-similar-to-holonovel-competitive-feature-report-rev-3`.
  Record new candidates, their axis delta, licence, and disposition.
- **W7 — memory policy.** Fires when a competitor adds badge-scoped disclosure
  gating or memory-versus-truth divergence verdicts. Response: ship the GM
  memory audit and divergence surface before the feature is commoditized.
- **Report revision trigger.** Refresh the competitive report when any
  watchlist threshold fires, a second independent COF implementation appears,
  or the quarter ends.

## Limits

- **WIP:** one uncommitted logical change; at most three open threads.
- **Committed column:** keep `ROADMAP.md` short. Lead time is WIP ÷ throughput,
  so an unbounded ready column silently sets the delivery latency.
- **Push cost:** if a push costs more than the batch it would join, fix the
  push, not the cadence.

## Where the evidence lives

| Loop | Signal | Surface |
|---|---|---|
| Session | plans, AARs, loop tokens | `docs/plans/` (gated by `check-loop-artifacts`) |
| Session | drift, repeats, session size | `spec/audit/loop-audit.md` |
| Publication | step outcomes, resume state | `.holonovel-state/publish-run.json` (local) |
| Publication | failures and their guards | `docs/publish-pipeline.md` |
| Gates | duration, failure rate, streaks | `.holonovel-state/gate-timing.json` (local) |
| Gates | retirement decisions | `spec/audit/gate-retirement.json` |
