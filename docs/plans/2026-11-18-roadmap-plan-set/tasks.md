# Tasks — Roadmap plan set

One line per phase; ticked as it lands. `session:close` requires this file
(`scripts/lib/loop-artifacts.ts:72-74`).

- [x] P1 — Research: roadmap triggers read verbatim; baseline (`check:fast` 46/46, mutation 12/12,
      status 4 items / 150 unpushed); item 1 evidence audit (one `@section evidence` record, no
      H1–H18 harness); item 2 composition (17 mutants, 5 oracle-derived, seeded 12) and the two
      uncomputed lanes; item 4 closure measurement over four candidate ranges; item 5 kind-set
      surface (union, order, counts, schema, install branch, `spec_health`).
- [x] P2 — Write `item-1a-handoff-evidence.md`, `item-1b-verifier-run.md`,
      `item-2-mutation-sample-depth.md`, `item-4-index-split-stage-2.md`, `item-5-codex-pack.md`.
- [x] P2a — Paths verified: preflight reports 4/4 targets present-and-untracked, 0 missing, 3 REQs
      resolved; every non-target path a draft cites was probed with `test -e` (10/10 present).
- [x] P3 — Self review of the set against the plan-review checklist.
- [x] P3a — One cold pass (`independent-review`): FAILED, 3 Blockers / 7 Majors / 10 Minors — fixed.
- [x] P3b — Diff re-review (finding → fix table) on the changed lines only: `passed.` 0 Blockers,
      0 unresolved Majors, 4 new Minors — fixed as a condition-only amendment; plan re-stamped (`plan.cold/stamp.md`).
- [ ] P4 — AAR (`after-action-report`) with the Changelog entry block and terminal token;
      `npm run check:fast` un-piped; `npm run session:close`.
