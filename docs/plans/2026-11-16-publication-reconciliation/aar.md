# AAR — Publication reconciliation

**Status:** LOOP PAUSED — the increment's done bar is met and no new project
action item remains. Plan revision 6, phases P1–P5 executed 2026-11-16.

## 1. What was supposed to happen

Resume the reviewed plan at P2+P3 (atomic) and carry it through P5. The done bar
(`plan.md` "Done bar"): no `HOLONOVEL_INVOKE_UPDATE` anywhere in `scripts/`,
`holonovel/scripts/`, or `.githooks/`; REQ-394a and §6.7 carry a reconciliation
evidence path with no agent subprocess (REQ body ≤ 800 chars); a dry run clears
`preflight` and `update` without `--yes` and leaves `holonovel/DECISIONS.md` and
the fingerprint baseline byte-identical; `test:update-workflow`, `test:pipeline`,
and `check:fast` green; `session:close` commits. Publish was explicitly out of
scope.

## 2. What happened

P1 was already executed and green on resume. This session executed T5–T13c
(script + pipeline, atomic), T14–T18b (harness, catalogue, renderer, discipline,
pipeline case), and T19–T23. Two plan-level corrections were made and are
recorded rather than silently applied:

- **Seed baseline.** T5 ordered the tail `reconcile(...)` deleted as
  "evidence-free". The tail is also the only baseline seeder: deleting it
  outright would leave a fresh state dir permanently unseeded and break the
  harness seed call. The seed path is kept, scoped to "no stored baseline"
  (nothing advanced, so REQ-394a does not apply); the unscoped-with-baseline
  path now refuses instead of reconciling blindly.
- **Removed REQ → waived** is derived before register lookup, matching pass-5 M2.

**Gate outcomes.** Token column records what this session actually emitted; the
plan was reviewed in an earlier session and its tokens are not re-emitted.

| Gate | Token | Verdict |
|------|-------|---------|
| plan-review (inherited, rev 6) | not emitted this session | passed earlier (pass 5: P2-NOT-READY, all findings settled) |
| independent-review | not emitted this session | not run (plan's stop rule forbids a cold pass) |
| build-review | not emitted this session | **miss** — see §8 |
| `check:fast` | `check:fast: PASS` | passed, 46/46 |
| `validate:sdd` | `0 error(s), 427 warning(s)` | passed |
| `build-order` | `Build order complete` | passed |
| `test:update-workflow` | `22 passed, 0 failed` | passed |
| `test:pipeline` | `30 passed, 0 failed` | passed |
| `push-pipeline.sh --dry-run` | `Done. commit=false … deploy=false` | passed, non-mutating |
| `session:close` | — | pending at write time |

Verification artifacts: `.holonovel-state` untouched by the derivation run (temp
state dir under `/tmp/opencode`); sha256 of `holonovel/DECISIONS.md` and
`.holonovel-state/pipeline-fingerprints.json` identical before/after the dry run.

## 3. What went right

- Derivation is cheap and complete where it should be: against `origin/main` the
  delta is Major with **120 changed REQs**; the register derives **115
  implemented, 5 waived, 0 operator exceptions**. The operator channel exists
  (and is exercised by the harness) but is not needed for this increment.
- The acceptance control (T18b) was written first and caught the difference
  between "derives something" and "derives the right disposition": absent REQ,
  bucket B, operator row precedence, and removal → waived are all asserted.
- The update harness's fixture sequencing was re-derived before running; the
  baseline is toggled by spec hash, so the reseed step that looked obvious could
  not work. One rewrite, zero failing runs in that section.
- Fail-closed evidence held: the dry-run's `build` step recorded
  `check_ran: false` on an already-fingerprinted tree, so `harness` ran
  `test:all` (56/56) instead of skipping — precisely T13's "otherwise run it".

## 4. What went wrong

- `check:fast` failed once on a stale `holonovel/src/generated/g7-attestation.ts`
  after the T84e catalogue edit. Expected (the P1 handoff noted the same), fixed
  by the documented regeneration; the plan's close steps do not name the G7
  regeneration explicitly, so it was re-learned rather than read.
- The plan's T5 evidence claim about the tail block was wrong in one respect
  (above). The code documents the deviation; the plan text was not rewritten
  beyond the status line.
- `tasks.md` V3's grep is broader than the increment's scope: it cannot be zero
  while the ruleset-side printers stay scheduled. The verification line now
  states the residual instead of claiming a clean zero.

## 5. Session performance

- **Outcome vs done bar:** met on every clause except the commit, which the close
  step performs after this report. Dry-run non-mutation and the derivation
  measurement are both demonstrated, not assumed.
- **Scope adherence:** no out-of-scope work. Publish untouched; the ruleset
  printers scheduled rather than fixed, as the plan required.
- **Verification quality:** the new control can fail (it blocks on an absent REQ,
  on bucket B, and on an incomplete record). The stub pipeline case is reported
  as wiring + non-mutation only, as designed.
- **Rework:** one targeted rewrite of the harness fixture sequence; one stale
  generated artifact.
- **Cost:** ~45 tool calls, concentrated in reads of the five touched surfaces,
  two full-gate runs, and one 175 s harness pass inside the dry run.

## 6. Findings

- **P3 (record-and-close):** plan T5's "delete the tail reconcile" is
  incompatible with baseline seeding. No action: the implementation keeps a
  baseline-less seed and documents why; a future plan touching this script
  should state the seed path explicitly.
- **P3 (record-and-close):** the close checklist in `AGENTS.md` does not remind
  the operator to regenerate the G7 attestation after an Appendix F edit; it is
  gated, so it fails loudly. No action.
- No P0/P1/P2 project action items. ROADMAP carries the one scheduled follow-up
  this increment created (ruleset-side printers).

**Follow-through register:** prior AAR findings live in
`spec/audit/review-register.md` and `ROADMAP.md`; this increment neither opened
nor closed a register row other than adding the roadmap item. No `SR-`/`PR-`
finding IDs were open in this session.

## 7. Auto-remediation

Not requested; report only.

## 8. Invocation audit

Expected shape: **Planned Change execution** (BUILD → COMMIT → CLOSE) per
`programming-orchestrator/references/workflows.md:138-144`.

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | no | miss (SK-20) |
| `build-review` | no | miss (SK-21) |
| `changelog-before-commit` | no | miss — recurrence of the recorded SK-2/SK-3/SK-18 gap; no duplicate row |
| `after-action-report` | yes | routed |

Invocation: 4 expected, 1 loaded, 3 misses.

Skill findings: 2 SK records appended. Run skill-improvement-loop to triage.

LOOP PAUSED
