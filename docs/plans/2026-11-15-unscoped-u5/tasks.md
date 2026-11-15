# Tasks — U5: artifacts, independent verification, cadence, publication

Dependency-ordered. `T0` runs in every session of the program (Phases 1–4).

## T0 — Phase 0 precondition (every session)

1. **T0.1** Run `git log --since=2026-11-14T23:59:59 --format='%H|%cI' --name-only`
   and count commits. Record the count and date in `plan.md` under Phase 0.
   - If < 26: record "re-measurement trigger unmet (n/26)", continue.
   - If ≥ 26: execute T5 before the chunk (Phase 5) and carry both closures in
     the AAR.
2. **T0.2** `npm run status`; record unpushed count, version, open roadmap count.
3. **T0.3** Un-piped `npm run check:fast`; require the trailing `check:fast: PASS`.
   A red baseline becomes its own commit before any chunk work.
4. **T0.4** Re-derive the chunk's row budget from the headings/unit list in
   `plan.md`; amend `plan.md` if the tree moved since the plan was written.

## T1 — Increment setup

1. **T1.1** Create `docs/plans/2026-11-15-unscoped-u5/`; move `plan.md` from
   `plans/2026-11-15-unscoped-u5/`; copy this file as `tasks.md`.
2. **T1.2** Create `review.md` with the 46-row table skeleton (IDs `R1`–`R46`) (one row per budget
   unit, keyed by anchor), columns: `Row | Unit | Claim | Predicate | Verdict |
   Finding`.
3. **T1.3** Confirm `git status` shows only the increment directory; the untracked
   `plans/` draft is gitignored and must not be staged.

## T2 — Prose rows (34 rows)

1. **T2.1** §9: lead-in (`spec/06-artifacts.md:1-45`), `H1`–`H18` (`:46-63`), and
   the tail paragraph (`:64-68`, the un-exercisable-step waiver rule and the
   traceability chain). For each H row, resolve its test ID against Appendix F and
   its check against the script that performs it (`scripts/validate.ts`,
   `holonovel/scripts/*`). Record `builder-side` where no repository check exists.
2. **T2.2** §10: operator procedure (`spec/07-independent.md:12-18`), verifier
   binding statement (`:1-11`), prompt steps 1–10 (`:20-118`, including step 10's
   REQ-274 confidence threshold), and the `DISPUTED`
   adjudication rule (`:121-127`). Confirm each step's
   carrier: the `independent-review` skill, `docs/plans/` artifacts, or
   `builder-side`.
3. **T2.3** Appendix V: ten runbooks (`spec/appendices-runbooks.md:13,51,70,85,128,
   143,158,194,228,260`). For each runbook step, name the script that performs it
   or record it as a manual action with its precondition.
4. **T2.4** Move `review.md` to the code rows only after all 34 prose rows carry a
   verdict. A §10 clause carried by a harness skill outside this repo is
   `external-skill`: record the skill's absolute path and the in-repo carrier.

## T3 — Code and doc rows (12 rows)

1. **T3.1** `scripts/push-pipeline.sh`, `scripts/publish/{preflight,steps,run}.ts`:
   role header, exit contract, ordering/resume semantics, and the Appendix V.4/V.5
   steps each serves.
2. **T3.2** `scripts/weekly.ts`, `scripts/loop-audit.ts`, `scripts/session-close.ts`:
   the cadence and loop claims in `docs/workflow-cadence.md` and §9/§10.
3. **T3.3** `.github/workflows/publish.yml`: cross-check against the CI-only table
   in `AGENTS.md` and `scripts/check-workflows.ts`.
4. **T3.4** `docs/workflow-cadence.md`, `docs/publish-pipeline.md`,
   `spec/audit/loop-audit.md`, `docs/plans/README.md`: prose-to-surface drift only.

## T4 — Dispositions, close

1. **T4.1** Triage every finding P0–P3 (`AGENTS.md` § Review-loop governance):
   P0 prose fix in this increment; P1 scheduled on `ROADMAP.md`; P2 bounded fix or
   scheduled; P3 dated record-and-close in the AAR.
2. **T4.2** Add `### 2026-11-15 U5 artifacts and publication` under the matching
   register heading(s) in `spec/audit/review-register.md`, one bullet per finding,
   each citing its predicate `file:line`.
3. **T4.3** Rewrite the `worklist.md:95` status row in U4's exit-evidence form
   (`worklist.md:204-237`), naming the three exit clauses and their evidence.
4. **T4.4** Apply the bounded prose fixes; run `npm run assemble`.
5. **T4.5** Write the dated `CHANGELOG.md` entry (date = session date).
6. **T4.6** Run `after-action-report`; write `aar.md` ending in `LOOP PAUSED` or
   `LOOP OPEN` (the token `docs/plans/README.md:52-63` defines).
7. **T4.7** Record the two program-record amendments from `plan.md` (the
   `check-registry` → `check-registers` normalization and the appendix fixture
   anchors) as U5 register findings.
8. **T4.8** Run the verification table in `plan.md` in order; record each exit code
   in the AAR. Then `npm run session:close`.

## T5 — Phase 5 re-measurement (only when T0.1 says the trigger holds)

1. **T5.1** Take the window's first 26 commits, oldest-first. For each consecutive
   pair within 900 s, intersect touched-path sets.
2. **T5.2** Record sharing-pair count, participating-commit count, and the shared
   paths; compare against 26 pairs / 15 sharing, target ≤7 of 26.
3. **T5.3** Record the verdict with its unit (pairs vs commits) in the AAR.
   Remove the roadmap section on a closed verdict; retain it with the evaluation
   date otherwise.
4. **T5.4** If the verdict is "unchanged", reopen the diagnosis per
   `ROADMAP.md:42-44` rather than re-running the count.

## T6 — Program successors (not this session)

1. **T6.1** U6 (`worklist.md:254-269`, 23 rows) — synthesis and fixtures.
2. **T6.2** U7 (`worklist.md:270-285`, 24 rows) — reference appendices and
   registries; regenerate fingerprints if Appendix Q is edited.
3. **T6.3** U8 (`worklist.md:286-313`, 25 rows) — governance and content assets;
   remove the sweep section from `ROADMAP.md` after the chunk's AAR.
4. **T6.4** Program close: `check-roadmap` green with zero scheduled sections.
