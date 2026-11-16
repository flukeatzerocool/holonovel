# Stage 4 — re-zoom

Reviewer: `review` subagent, fresh context
Artifact: `plan.md` · sha256 `c032d250…52437` (verified)
Reads: 6 file reads, 3 greps

## Findings

| Se | Finding | Rests on |
|---|---|---|
| **Blocker** | `parseAppendixFRows` keyed by `tid` with no merge rule silently drops one `T553` row's REQ association; the current `parseAppendixFReqTests` adds the ID to *every* REQ in the cell, so P1 would flip a bucket and fail V2 — the plan's duplicate analysis covered only the kind rule | plan:56-63, :165, :170 |
| Major | Self-test inventory stated three ways: P4 lists four reds, done bar and V1 say three | plan:115-116, :198-200, :246 |
| Major | Done bar requires a "dated entry" on ROADMAP, which P7 forbids (no date field) | plan:118 vs :234-235 |
| Major | §3's as-written REQ id contradicts the `INTENDED_GAP_REQS` membership test, which holds base ids; the 99/23 split is only obtainable with a base collapse | plan:100-102, :210, :76 |
| Nit | "never reads the `_Check:_` text" contradicted by the `hasCheck` boolean | plan:19 vs :21-23 |
| Nit | Task-to-phase map wrong for tasks 7–10 | tasks:4-5 |
| Nit | V5's `wc -l` predicate contradicts P6's "grouped by REQ" | plan:250, :218 |
| Nit | The 12-line print window can show zero of the 23 actionable warnings when in map order | plan:209-211 |
| Nit | P7/P8 carry no `**Test:**` line | plan:224-240 |
| Nit | §9 still asks the `T553` placement question the done bar already decides | plan:256-257 |
| Nit | P3's "Test: typecheck" is compile-only | plan:194 |
| Nit | The bucket guard omits bucket D | plan:87, :172, :247 |
| Nit | "the audit already dispositions" — not a verb form | plan:79 |

All applied in cycle 3; the duplicate merge rule, the base collapse, the
four-red inventory and the print order were the substantive ones.

`stage 4: 1 blocker, 3 majors, 9 nits`
