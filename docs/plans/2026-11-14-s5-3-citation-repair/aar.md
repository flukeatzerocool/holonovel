# AAR — §5.3 citation repair

AAR: SUCCESS — two missing harness assertions written, five Check trailers
re-pointed to exercised IDs, two unimplemented acceptance depths scheduled
rather than claimed, gates green.

## 1. What was supposed to happen

Plan `docs/plans/2026-11-14-s5-3-citation-repair/plan.md` (v2, standard depth,
cold-reviewed) with a six-part done bar:

1. T22 and T35 exist as executed `test(...)` titles and pass.
2. Every harness-resolvable ID cited by the five edited Check lines is in
   `exercisedIds`; the Manual ID T3 is exempt by name.
3. `npm run assemble` and `npm run check:fast` pass with `check:fast: PASS`.
4. The coverage register regenerates with T22/T35 joining REQ-023/REQ-024 and
   no bucket moving.
5. F-P2-1/2/3 `Resolved`; F-P2-5 `Scheduled-roadmap`; the matching ROADMAP
   section exists; the §5.3 citation-repair section removed.
6. `check-registers`, `tool-citation-check`, `check-fingerprint-sync` green.

The plan's central claim, established by the cold pass, was that the roadmap's
"already exercised elsewhere" premise held for existence but not for depth:
two acceptance criteria have no implementation at HEAD.

## 2. What happened

| Step | Result | Evidence |
|---|---|---|
| T22 written | pass | `npx tsx holonovel/scripts/test-output-contracts.ts` → `556 passed, 0 failed` |
| T35 written | pass | same run |
| Five Check trailers edited | pass | `validate` → 0 errors; register diff shows T22/T35 only |
| Appendix F T22/T35 rows amended | pass | `spec/appendices-reference.md:1455,1464` |
| Register: F-P2-1/2/3 Resolved, F-P2-5/6 scheduled | pass | `check-registers` PASS |
| ROADMAP §5.3 replaced by the depth section | pass | `check-roadmap` PASS |
| Assemble + coverage register | pass | `validate -- --write-register` → 0 errors; diff = 3 lines, C-1 shape |
| CHANGELOG entry | pass | top dated entry |
| Full fast gate | 40/41 pre-AAR | only `check-loop-artifacts` failed (missing `aar.md`), which this file closes |

Deviations, recorded as A1–A3 in the plan:

- **A1** — `tools/list` reads its scope from `params._meta.scope`; the SDK
  strips an unknown top-level `scope`. The tests send the `_meta` form.
- **A2** — T35's post-removal listing leg was dropped: a removed package's
  tools stay in the live `tools/list`. Recorded as F-P2-6 and scheduled.
- **A3** — the `run_workflow` sub-leg was dropped: `runWorkflowCategories`
  walks the host surface registry, so a runtime-installed stub never renders
  there (C-2 resolved as "drop and record").

### Gate outcomes

| Gate | Token | Verdict |
|---|---|---|
| plan-review | `plan-review passed.` (Approved-with-conditions) | passed |
| independent-review | `independent-review passed.` (v1 `FAILED.`, v2 diff re-review passed) | passed |
| build-review | `build-review passed.` | passed |
| spec-review | not run (no spec-body changes; Check trailers and Appendix F only) | n/a |
| proofread | via `validate` (296 warnings, 0 errors, register count matches) | passed |
| drift-report | not run | n/a |

## 3. What went right

- The cold pass changed the design before any edit: both Blockers
  (`stale_references` hard-coded, `resource_uris` catalogue-derived) would
  have produced tests that could never pass. Scheduling the depth instead of
  weakening the citation is the increment's best decision.
- The two new tests were validated against real server behaviour rather than
  the plan's reading of it. Three plan assumptions were corrected by probing
  (A1, A2, A3) before the test was declared green.
- Coverage diff came out exactly as condition C-1 predicted (T22/T35 join two
  rows, no bucket moves), which confirms the Appendix F mechanism the cold
  pass identified.

## 4. What went wrong

- **Probe cost.** T22/T35 needed three iterations (scope param, removal leg,
  scope guard) because the plan asserted surface behaviour from source reading
  rather than from a probe. A five-minute probe of `tools/list` semantics
  before drafting would have saved two harness runs (~90 s each).
- **A defects-in-planning finding.** The plan's Appendix F basis statement was
  discovered by the cold pass, not by the author; the author had already
  written the correct resolver into the plan (M3 was self-contradictory). The
  planning step read the resolver but did not follow it to its conclusion.
- **Changelog skill not loaded** — the entry was written from repo history
  again (`SK-3`).

## 5. Session performance

- **Outcome vs done bar:** all six criteria hold (item 3 pending the post-AAR
  gate run, which the close step performs).
- **Scope adherence:** no out-of-plan file was touched except the plan's own
  amendment section. `holonovel/src/index.ts` was **not** edited — the count
  probe passed, so C-3 never triggered.
- **Verification quality:** the harness proves behaviour (runtime install,
  restart, refusal), not just token presence; the register diff is a real
  freshness check. The gate that could not fail — `check-loop-artifacts`
  missing `aar.md` — behaved correctly.
- **Rework:** T22/T35 rewritten three times; no file was edited repeatedly
  beyond that.
- **Cost:** ~55 tool calls, dominated by harness runs and one scratch probe.
- **User intervention:** one direction change early ("draft plan" → "execute
  plan"); no corrections during execution.

## 6. Findings

| # | Finding | Disposition |
|---|---|---|
| 1 | Removed-package tools remain in the live `tools/list` (F-P2-6) | Scheduled: ROADMAP §5.3 depth (P1) |
| 2 | `stale_references`/`resource_uris` implementations absent (F-P2-5) | Scheduled: ROADMAP §5.3 depth (P1) |
| 3 | Plan asserted `tools/list` and removal semantics without a probe | Record-and-close: the amendment section (A1–A3) is the terminal record; no gate exists for surface-semantics prediction |
| 4 | Appendix F check rows T167/T168 remain unexercised build-mode rows | Record-and-close: they are build-time evidence; D5 states no §6 pointer exists to lose |

Project action items after triage: none new (1 and 2 are scheduled with
register rows; 3 and 4 are recorded-and-closed).

Skill findings: 1 SK record appended (SK-3, `changelog-before-commit` miss).
Run `skill-improvement-loop` to triage.

## 7. Auto-remediation

Not requested; no loop run.

## 8. Invocation audit

Task shape: **Planned Change** (multi-file, spec + harness + registers).

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `build-review` | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | no | miss |

Invocation: 5 expected, 4 loaded, 1 miss.

LOOP PAUSED
