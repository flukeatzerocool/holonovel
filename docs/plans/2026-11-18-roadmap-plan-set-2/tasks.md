# Tasks — Roadmap plan set 2

Dependency order. P1 is complete before this plan was stamped; the checklist records it so the AAR
can cite it.

## P1 — Research (done)

- [x] Read `ROADMAP.md`; record the four trigger predicates verbatim and their met-or-not status
      (all four unfired).
- [x] Baseline the tree: `check:fast` 46/46, `test:holosuite-mutation` 12/12, `check-anchors`
      current, `npm run status` (4 items, 155 unpushed, last pipeline run stopped at `record`).
- [x] Re-derive item 2's composition from `holosuite-mutation.ts` and `playtest-lib.ts`; verify the
      Wilson arithmetic at 7/7, 12/12, 34/35, 35/35.
- [x] Measure item 4's slice (`5524-6503`, 980 lines, 26 declarations), its two outbound helpers,
      its seven forward references and their two consuming functions, `toolCtx`'s member
      declaration order, and the 19-anchor partition per file (7 before / 12 after / 0 inside).
- [x] Re-measure item 5's union sites, the spec/Appendix F line numbers, and its two anchor
      exposures at this HEAD.
- [x] Bound item 1's evidence set from §9's declared homes, the record parser, and the H-step
      clauses in `spec/06-artifacts.md`.

## P2 — Drafts

- [x] `plan.md` — this increment's container plan.
- [x] `item-1a-handoff-evidence.md`, `item-1b-verifier-kit.md`, `item-1c-report-adjudication.md`,
      `item-2-mutation-sample-depth.md`, `item-4-index-split-stage-3.md`, `item-5-codex-pack.md`.
- [x] `tasks.md` — this file.
- [x] Path preflight: every cited path exists (`test -e`); proposed-new paths marked *(new)*.

## P3 — Review

- [x] **P3a — Preflight** (`plan-gate.mjs preflight`): 7 targets present and untracked, 5 REQs
      matched, 0 external paths. Sidecar written under the plan-id directory.
- [x] **P3b — Self pass**, then one cold pass (`independent-review`, five stages plus readiness).
      Cold verdict: `independent-review FAILED.` — 6 Blockers, 19 Majors, 13 Nits. Report persisted
      outside the tree as `cold-report-r1.md`.
- [x] Fix every Blocker and Major (revision 2).
- [x] **P3b(2) — Diff re-review** of the changed lines only (revision 2): `independent-review
      FAILED.` on one new Blocker, three Majors, two Nits.
- [x] **P3b(3) — Targeted re-review** of revision 3: `independent-review passed.`, no remaining hard
      blocker; one Major and three Nits fixed as a condition-only amendment.
- [x] **P3c — Stamp**: kind `planned`, independence `fresh`, depth `standard`, cold-report-r3 path
      + sha256, stages 5. Verdict `passed`.

## P4 — Close

- [ ] `aar.md` under `after-action-report`, with the `## Changelog entry` block and a terminal
      token.
- [ ] `npm run check:fast` un-piped → `check:fast: PASS`.
- [ ] `npm run session:close` → one commit.

## Deferred to the executing sessions

- Re-measuring line numbers before each item's own stamp (each draft's header says so).
- Any roadmap retirement: no item closes in this increment.
