# AAR — Publication engine retirement

Session 2026-11-07. Plan: `plan.md`. Scope was amended mid-session: the
maintainer declined publication and declined deferral, so the retirement
executed without the live rehearsal the original plan was built around.

## What happened

- The step-registry engine was already the default, but the legacy monolith
  was still present as the backout path and the hooks still carried the
  `HOLONOVEL_PIPELINE_GATES` bridge.
- Planning found that the advisory run lock documented for `push-pipeline.sh`
  (AGENTS.md:391) existed **only** in the legacy engine
  (`push-pipeline-legacy.sh:196–205`). Deleting the legacy file without moving
  the lock would have removed a concurrency guard while leaving the docs
  claiming it existed.
- The retirement executed: one entry point, one engine, no bridge, the lock
  moved in front of the exec.
- No publish ran. The first-live-run evidence (REQ-418 remote-identity
  recovery, REQ-428 registry waiter) is still owed and is recorded as a
  standing fact rather than scheduled.

## What went right

- The planning pass caught F-1 before it became a silent regression; the lock
  test proves the moved guard works (held → exit 1, released → exit 0).
- The plan's blast-radius table matched the actual edit set; no named file was
  missed.
- `test:pipeline` stayed green (22/22), so the step registry itself is
  unaffected by the entry-point rewrite.

## What went wrong

- The first `AGENTS.md` edit collapsed a two-line layer-map entry into one
  line; caught on readback and fixed before any gate ran. No lasting effect,
  but it is a reminder that layer-map lines are column-aligned prose, not
  independent lines.
- The plan's verification matrix expected "no matches" for the retired names.
  Three explanatory comments legitimately remain (deviation D-4); the check
  was tightened in `tasks.md` to "no consumers" rather than "no strings".

## Findings and dispositions

| ID | Finding | Severity | Disposition |
|---|---|---|---|
| F-1 | The documented advisory `flock` existed only in the legacy engine; the deletion would have removed it | P1 (regression) | **Resolved** in this increment: lock moved into `scripts/push-pipeline.sh`, verified by the held/released test |
| F-2 | `--dry-run` claims "change nothing" but runs `build-order` and the `record` step, both of which write (`run.ts:29` vs `steps.ts`) | P3 | **Record-and-close.** Predicate confirmed by code read; no failure demonstrated. Revisit if a dry run ever dirties a tree |
| F-3 | The first live run of the sole engine must record its recovery path (REQ-418 remote-identity recovery, REQ-428 registry waiter) | P2 (evidence owed) | **Accepted standing fact:** recorded in `docs/publish-pipeline.md` § Rehearsal status and `holonovel/DECISIONS.md` § Publication engine retirement. No backout engine remains; `git revert` of this commit is the backout |
| F-4 | The `--only preflight` smoke was not run on a clean tree | P3 | **Deferred to the next publish** (deliberate: the tree stays dirty until the session commit) |

`check-registers` reports 16 grandfathered entries without a date/commit
reference. Pre-existing, informational, and outside this increment.

## Loop status

`LOOP PAUSED`

Gates are green (`check:fast` 36/36 before the change, the change-scope gates
after it: script discipline, workflow hygiene, roadmap, registers,
traceability, lint, validate, and the 22-case pipeline harness). No P0/P1
remains: F-1 is fixed in this increment and F-3 is an accepted standing fact
with a named surface in two tracked files.

Deployment was explicitly out of scope today: the maintainer declined
publication, so this increment joins the unpushed range that `npm run status`
surfaces. The first live publish is the standing next-session cadence, and its
recovery path must be recorded per the ledger.
