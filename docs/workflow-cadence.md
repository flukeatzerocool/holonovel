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
- Gate-retirement review: `npm run gate-cost -- --apply` downgrades gates with
  no findings across 20 consecutive runs to advisory. Deleting a gate is still a
  manual decision.

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
