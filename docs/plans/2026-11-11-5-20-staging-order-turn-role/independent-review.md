# Independent review — §5.20 staging order source and AI-role turn handoff

Plan sha256: ed4641e32ea8a280539078ba469274a96fd18ad4e65a8a4061f26592b9e0a476

Cold pass (plan-review, gate depth standard), run in a fresh reviewer context
with no authoring history. Artifact reviewed:
`…/2026-11-12T02-05-06-417Z-194b942b.md`, sha256
`194b942ba0f408b9183ddbd4b0fb24eff5dc5a92c5ea8f92a2e368e94d68ba60` (match
verified). Evidence sidecar was not read as evidence. Reads used: 10/10.

## First pass (artifact `91baa8ae…`) — `independent-review FAILED.`

One Blocker, six Majors, four Nits.

1. **[Blocker, clarity]** Decision 2's code shape contradicted its own matrix
   row and done bar 6: the invite branch fired whenever
   `narrativeRole(novel) === "game_master"`, and that resolver returns
   `"game_master"` for `TTRPG_AI_ROLE=game_master` regardless of badge
   (`holonovel/src/index.ts:1107-1111`), so GM badge + AI-GM role could not
   yield "none". The branch needed REQ-412's WHEN guard
   (`spec/02-requirements.md:4112`).
2. **[Major, clarity]** The matrix omitted observer + `TTRPG_AI_ROLE=player`,
   a third changed behaviour (`index.ts:15017-15019` today vs the role-keyed
   result), so "only two rows change" was false.
3. **[Major, design]** `order` leaked onto `manage_scene`:
   `MANAGE_SCENE_STAGING_PARAMS` (`index.ts:6686`) filters staging parameters
   off the legacy schema (`:6735`, whose action enum `:6697` has no
   `cast`/`next_speaker`), and the plan never mentioned the Set.
4. **[Major, design]** T728's ordered sequence needed the spoken-set reset:
   T727 (`test-competitive-gaps.ts:588-607`) leaves all three ids in
   `cast.spoken`, so the walk needs `after_user: true`.
5. **[Major, clarity]** The §6 grep expectation was wrong —
   `grep -c "narrativeRole(novel)"` is 1 today (`:15414`), so 2 after the fix.
6. **[Major, design]** A pre-increment save yields `order: undefined` because
   load takes `data.social_cast` wholesale (`state.ts:1641`, `:3004`); the list
   branch needs a guarded read.
7. **[Nit, clarity]** Decision 4 claimed the T482 row already stated the
   no-directive case while done bar 10 forbade touching the row.
8. **[Nit, clarity]** "Editor briefing" was conflated with the badge-`none`
   active-Novel path; `:14930-14935` is the no-active-Novel early return.
9. **[Nit, design]** `spec/audit/tool-surface-replay.json` was conditional
   scope but absent from the blast-radius table.
10. **[Nit, clarity]** Citation drift: handoff block, `narrativeRole` range,
    fixture line range.

Assumption checks: fingerprint-safe §5.20 edit TRUE (`contract-fingerprint.ts:27`,
`:37-43`); `social_cast` persistence TRUE with the load caveat above; handoff
matrix FALSE as written (finding 1/2); "only definitions and budget move"
PARTLY FALSE (finding 3); suite counts 105/30 TRUE with the fixture hazard
(finding 4).

## Diff re-review (artifact `194b942b…`) — `plan-review passed.`

Prior findings 1–9 RESOLVED with evidence; finding 10 PARTIALLY RESOLVED (the
handoff block `:15013-15023` and fixture `:561-566` are correct; the
`narrativeRole` citation is off by one — the function is `index.ts:1107-1112`,
comment `:1100-1104`).

New nits introduced by the changed lines (non-blocking):

- The unchanged reads entry still calls T482 "already forward-specified" while
  Decision 4 now says the row gains a case — self-contradictory; accepted as a
  soft inconsistency to fix on the next full review.
- Done bar 7's rationale is imprecise: with all three ids spoken the first pick
  is still `Cato`, so the reset is needed for picks 2 and 3, not the first.
- The Decision 2 snippet comment still says "not the badge" while the branch
  now keys on the badge for REQ-412's WHEN guard. **Build-time instruction:**
  when Phase 3 writes the block, word the comment as "follows the AI's
  narrative role, gated by REQ-412's badge condition".

No new Blocker or Major introduced by the changed lines. Verdict:
`plan-review passed.`

`independent-review passed.` — one Blocker was raised, fixed in the artifact,
and the single permitted stage re-audit (cold diff re-review, 10/10 reads)
returned `plan-review passed.` with no remaining Blockers or Majors. No second
full pass was run, per the standard-depth re-review cap.

## Build-time binding note

The reviewed artifact was `194b942b…` (`plan sha256` at review time). The plan
was amended after the pass in two places only: the T482 override/budget
assertions move to `test-briefing.ts` (condition `C-amend`; second MCP process
cannot attach to `test-backfill`'s shared buffer) and done bar 8 now records
that the counterpart matrix is a regression guard rather than red proof. Both
are target-harness and wording changes, no new file, gate, or destructive step;
`build-review` verifies them. The plan sha above is the committed artifact's.
