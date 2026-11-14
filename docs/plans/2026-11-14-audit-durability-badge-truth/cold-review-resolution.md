# Cold-review resolutions — plan v1 → v2 (F-P1-4, F-P1-13)

Reviewed artifact: `plan.md` v1, sha256
`469805fe88de0b941d73ed3f01f540bf912d24b104771c3c65f06ac1acf5eda0`,
at HEAD `739b362`.
Review artifact: `cold-review.md`, sha256
`a22ba72a44633e2e58c1034d5dfd7d8e0fcf9955765bc8de98a7fda5a989054e`,
verdict `independent-review passed.` — 0 Blockers, 5 Majors, 6 Minors, 1 Nit,
stages 5/5, 36/40 reads.

## Majors

- **M1** — C2's catch sat at `index.ts:313`, above `normalizeRefusal`, which
  envelopes the capacity throw first. Resolved: D3/C2 place a
  `withCapacityAbort` wrapper inside `normalizeRefusal`.
- **M2** — the capture was unspecified and the only named helper
  (`captureWorkflowSnapshot`) mutates counters and drops stacks. Resolved: D3
  specifies interchange JSON (`novelToJSON`/`novelFromJSON`), `"replace"`
  restore plus explicit stack reassignment, and records the rejected helpers.
- **M3** — the "0.2–0.7 ms snapshot-cost record" had no path. Resolved: D3
  cites `holonovel/DECISIONS.md` § *TDQS coherence remediation*
  ("Snapshot-cost measurement"), scopes the number to `snapshot()`, and makes
  the interchange-capture cost a step-1 measurement with a 5 ms fallback.
- **M4** — "when the log has room for the entry" would make REQ-448's
  cap-refusal clause non-binding. Resolved: D5/C5 drop the qualifier and add a
  sentence naming the at-capacity exception and its reporting surface.
- **M5** — `applyNovelState` already has `"replace"`. Resolved: D3/C2 use it,
  state its stack-preservation behaviour, and compensate explicitly; the
  blast-radius row for `state.ts` shrinks to the `auditForbidden` predicate.

## Minors and nits

Reviewed in `cold-review.md`; none changes a decision. The two that touched the
plan text are folded in: the capture round-trip is a named step (Dependency
order 1(g)), and the rollback edge case now describes `"replace"` + stack
reassignment rather than a new mode.

## Build-time conditions

- C-1 — Confirm in step 1 that the interchange round-trip reproduces
  `audit_log` exactly; if it does not, the rollback restores from the on-disk
  copy instead and the AAR records the amendment.
- C-2 — Record the measured capture cost on the harness Novels; if it exceeds
  5 ms on a 3.6 MB Novel, narrow the capture before C2 is marked done.
