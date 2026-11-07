# After-action report — Two loops, one cadence

**Date:** 2026-11-06
**Increment:** `docs/plans/2026-11-06-loop-cadence`

## What happened

| Phase | Delivered | Evidence |
|---|---|---|
| 0 | `loop-audit.ts`; `run-gates` `--timing`, `--record`, `--recorded`, `--list --format=md`; hook-event log | `npm run loop-audit` → 672 commits / 107 sessions / 28 date drifts / 33 pushes |
| 1 | `docs/plans/` contract, `check-loop-artifacts` gate, `session:close` | `check-loop-artifacts` → PASS |
| 2 | `gate-run-manifest` (tree + content hash), rewritten hooks, generated AGENTS table | manifest matched then invalidated on a content edit |
| 3 | `publish/preflight.ts`, `publish/steps.ts`, `publish/run.ts`, thin driver, legacy retained | harness cases 1–5 |
| 4 | `test-push-pipeline.ts`, 11 cases | 11/11 twice; engine default flipped to `next` |
| 5 | `gate-cost-report.ts`, `weekly.ts`, cadence doc, retirement file | `gate-cost` reports 0 candidates at threshold 20 |
| 6 | CHANGELOG, AGENTS layer map, version bump | this commit |

## What went right

- Every loop now has an inspectable surface: plans and AARs are tracked, gate
  runs leave a manifest, publication steps leave a run record.
- The manifest is keyed on a content hash, not a path list — editing an
  untracked file invalidates a prior pass (verified by probe).
- The pipeline harness found two real defects before they reached a remote:
  the commit subject carried the `## ` marker (the exact two-form drift the
  audit measured), and the run record was being staged because the fixture had
  no `.gitignore` (a real hazard for any repo that adds a local state dir).
- Gate-cost data now exists; the fast suite is ~10 s across 33 gates, so the
  push cost was never the gate suite — it was the orchestration around it.

## What went wrong / deviations

1. **Two helper modules were added beyond the blast radius:**
   `scripts/lib/gate-manifest.ts` (extracted so the doc table and the runner
   share one source) and `scripts/lib/loop-artifacts.ts` (shared by the gate and
   `session-close`). Record-and-close: they reduce duplication and are covered
   by the gates.
2. **`gate-cost --apply` writes `spec/audit/gate-retirement.json` but does not
   auto-append a review-register row.** Auto-editing a gated register risks
   corrupting a terminal-disposition table; the JSON records the decision
   (gate, date, reason) instead. Record-and-close.
3. **No publish rehearsal on the `next` engine.** The harness proves control
   flow against a bare remote, not the real remote identity, registry, or wiki.
   Scheduled on `ROADMAP.md`.
4. **Slower registry step.** The port runs the registry wait synchronously
   instead of overlapping it with the wiki push and deploy. Accepted for
   correctness; the overlap can return once the engine has one real run.

## Findings and dispositions

| Finding | Severity | Disposition |
|---|---|---|
| Publish rehearsal on `next` pending | P1 | Scheduled on `ROADMAP.md` |
| Registry wait no longer overlaps | P3 | Record-and-close (latency only) |
| Gate timings inflate under parallel contention | P3 | Record-and-close (comparative use only) |
| Legacy engine still sets `HOLONOVEL_PIPELINE_GATES` | P3 | Record-and-close; bridge documented and removable |
| Retirement has no register row | P3 | Record-and-close; JSON is the decision record |

## Done bar

Phases 0–6 delivered; `check:fast` green (33 gates) and `check` green, including
the new `test:pipeline` gate (11/11); this increment closed through
`session:close`.

LOOP OPEN — one scheduled action: the first real publish on the `next` engine
must record the recovery path it used (or state that none was needed).
