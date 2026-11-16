# Process Improvement Program — 2026-11-15

Decomposition of the 13 accepted recommendations from the post-push
retrospective (R1–R9, R11–R14; R10 push ceiling excluded by user decision).

## 1. Premise and evidence base

The retrospective measured 117 commits, 97 increments, 337 sessions, 3.37 B
tokens (98.2% cache read), and 4,000 gate records. The costs were structural:

- Anchor maintenance: 54/97 AARs; 689 drifted anchors reported across 21 reports.
- Loop-artifact ordering: 17 gate failures, all "missing aar.md" on a directory
  the session itself created (`scripts/lib/loop-artifacts.ts:65-72`).
- Bookkeeping: CHANGELOG 96 touches, ROADMAP 87, review-register 86 (269 edits).
- Duplicate spec: `holonovel.md` and `holonovel/holonovel.md` are byte-identical
  at 1.79 MB and both regenerated in 63 commits; both are written from one
  `content` string by `scripts/assemble.ts:149-156` (`REF_IMPL_OUT` at `:19`),
  and the package copy is re-created at pack time by
  `holonovel/scripts/prepare-package.mjs:19-20,37`.
- Context: main threads 3.10 B of 3.31 B cache reads at 175 k avg per turn;
  subagents 0.21 B at 60 k (median 53 k overall; no compaction events).
- `index.ts`: 19,089 lines, 622 reads / 579 edits / 203 greps.
- Plan artifacts: 67,337 of 96,270 added lines (70%).
- Review yield: 565 verdict rows to ~40 findings (~7%); U1 81% holds.

**Correction to R1.** Anchors are already symbol-keyed: `anchor("path", line,
"symbol")` resolved by `scripts/lib/anchor-resolver.ts` (`ANCHOR_WINDOW = 40`).
Any line change is drift; a unique symbol is healed by `--write` anywhere, and a
duplicated symbol outside the window is refused (`refresh-predicates.ts:85-102`).
The defect is not the identity model; it is that repair is manual and drift is
detected only in full mode. R1 is re-scoped to automatic, early maintenance.

## 2. Done bar

**Done bar:** I0 and I1 land with `npm run check:fast` green and anchors current;
`check-anchors` runs in fast mode and `session:close` heals anchors before it
gates; the I1 red test is demonstrated (a 3-line insertion above a recorded
anchor fails `check:fast`, and `session:close` heals it); I2–I6 are specified
here and written into `ROADMAP.md`; this increment closes as two commits through
`npm run session:close --single`; its own `tasks.md` and `aar.md` exist and the
AAR ends `LOOP PAUSED`.

"Execute all seven increments" is not this bar; each later increment gets its own
`docs/plans` artifact and AAR when executed.

## 3. Non-goals

- R10 (push ceiling). Excluded by user decision; not scheduled, not re-raised.
- Re-architecting the anchor model (symbol-only, windowless). Not needed; see §1.
- Retiring, merging, or downgrading any gate. The retrospective found 99.3% of
  gate runs green and every failure genuine.
- Adding a new register. `review-register`, `req-coverage`, and `ROADMAP.md`
  carry the load.

## 4. Commit plan

Each increment is one commit via `npm run session:close --single` (the documented
opt-out from split-by-concern, correct for an atomic increment). The fast suite
runs once per increment before staging (`scripts/session-close.ts:318`), so the
commit is green at the point it is written. Because the subject is derived from
the top CHANGELOG heading (`session-close.ts:246-257`), I0 and I1 each author
their own dated heading; a second entry is required before the second close.

| Increment | Scope | Commits | Gate before the commit |
|---|---|---|---|
| I0 | Process contract + ROADMAP admission: R4, R6, R13, R14 | 1 | assemble + check:fast |
| I1 | Anchor maintenance: R1, R2 | 1 | check:fast + check-anchors |
| I2 | Loop tooling: R3, R11 | 1 | check:fast + check-loop-artifacts |
| I3 | Single assembled spec: R5 | 1 | check:fast + test:commit-plan |
| I4 | Evidence linkage: R8 | 1 | validate + validate:sdd + test:validators |
| I5 | Bookkeeping and template: R9, R12 | 1 | check:fast + test:commit-plan |
| I6 | Split `index.ts`: R7 | 3–5 (one per extraction stage) | test:all (56/56) per stage |

All increments are reversible edits (rollback cost 1). None is destructive.

Size legend: S ≤ 50 changed lines, M ≤ 250, L > 250 (AGENTS.md split rule).

## 5. Increment specifications

### I0 — Process contract and ROADMAP admission (R4, R6, R13, R14)

- **File:** `docs/plans/2026-11-15-process-improvement-program/tasks.md`,
  `.../aar.md`
  **Change:** author `tasks.md` and a provisional `aar.md` before the I0 close;
  the provisional AAR already ends `LOOP PAUSED` because `session-close` requires
  a terminal token at close (`loop-artifacts.ts:78-90`). After I1 lands, amend the
  AAR with I1's evidence (the red/green anchor probe) before the second close.
  **Test:** `npm run check-loop-artifacts` exits 0 at both closes.
  **Size:** S.
- **File:** `docs/workflow-cadence.md`
  **Change:** add four rules under "Per session": (a) *Context budget* — one
  increment per main session, restart near 100 k tokens, delegate exploration to
  subagents, read only files a claim cites; (b) *Review the delta* — scope sweeps
  to sections whose REQs changed since the last coverage-register snapshot,
  re-verify untouched sections by gate only; (c) *Review budget* — standard depth
  for new surface, light for repair of already-reviewed surface; (d) *Shell
  ergonomics* — workdir over `cd`, `edit` over `sed`, one command per turn where
  possible.
  **Test:** each rule names its trigger.
  **Size:** S.
- **File:** `AGENTS.md`, "Agent Operating Routine"
  **Change:** one bullet pointing at the new cadence subsection.
  **Test:** `check-gate-table` stays green (no table edit).
  **Size:** S.
- **File:** `ROADMAP.md`
  **Change:** add five sections, each 1–3 bullets plus `**Trigger:**`, satisfying
  `check-roadmap`:
  1. *Loop artifact and fix-up measurement (P2)* — run I2; trigger: `2026-11-22`
     or the next missing-`aar.md` warning.
  2. *Single assembled spec copy (P2)* — run I3; trigger: the next `spec/` edit
     that regenerates the spec.
  3. *REQ evidence linkage (P1)* — run I4; trigger: the corpus dry-run list is
     triaged.
  4. *Bookkeeping derivation (P3)* — run I5; trigger: the next close that edits
     three bookkeeping surfaces.
  5. *Split `index.ts` (P2)* — run I6; trigger: the next increment that moves more
     than 50 anchors, or a read count above 100 in one week.
  **Test:** `npm run check-roadmap` passes with six sections.
  **Size:** S.

### I1 — Anchor maintenance (R1, R2)

- **File:** `scripts/lib/gate-manifest.ts:324-329`
  **Change:** `check-anchors` fast: `npm("check-anchors")` (currently `null`),
  full unchanged. `AGENTS.md` gate table regenerates via
  `npm run gates -- --list --format=md`. No separate pre-commit invocation: the
  hook already runs the manifest's fast tier
  (`.githooks/pre-commit:41-46`), so the gate is covered there automatically.
  **Test:** `check-gate-table` passes; a 3-line insertion above a recorded anchor
  fails `check:fast` and `fix-anchors` heals it.
  **Size:** S.
- **File:** `scripts/session-close.ts:311-318`
  **Change:** run `npm run fix-anchors` after `assemble` and before `check:fast`;
  the healed files are staged by `git add -A` at `:326`. Print a one-line count to
  stderr when anchors move. On a refused (ambiguous) symbol the close aborts.
  **Test:** a session whose increment moved anchors closes with anchors current
  and includes the healed files in the commit.
  **Size:** S.
- **File:** `scripts/test-anchor-tooling.ts`
  **Change:** add two cases: a unique symbol shifted 41+ lines is healed by
  `--write` and red under `--check`; a duplicated symbol outside the window is
  refused with exit 1.
  **Test:** `npm run test:anchor-tooling` passes.
  **Size:** S.

### I2 — Loop tooling (R3, R11)

- **File:** `scripts/lib/loop-artifacts.ts:65-72`
  **Change:** add a `mode` option to `validateIncrements`: `"working"` (default,
  used by `check-loop-artifacts`) reports a missing `aar.md` or `tasks.md` as a
  warning; `"close"` keeps it an error. `scripts/session-close.ts:263` passes
  `mode: "close"`, so the commit still refuses. No `--staged` flag and no
  pre-commit change: the hook's recorded-pass skip cannot bypass the close-time
  check because that check runs before staging.
  **Test:** an increment with `plan.md` + `tasks.md` and no `aar.md` exits 0 with a
  warning from `check-loop-artifacts`, and `session:close --dry-run` refuses it.
  **Size:** S.
- **File:** `scripts/check-loop-artifacts.ts:21-40`
  **Change:** no flag added; document in the usage block that the gate is the
  working-tree view and `session:close` is the commit-time authority.
  **Test:** `npm run test:loop-artifacts` covers both modes.
  **Size:** S.
- **File:** `docs/plans/README.md:23`
  **Change:** state the two-mode contract: the three files are required to
  *close*; while an increment is in flight the gate warns.
  **Test:** doc read; `check-registers` unaffected.
  **Size:** S.
- **File:** `scripts/loop-audit.ts`
  **Change:** add two "Session loop" rows: fix-up pairs (≤15 min) and
  rework-classified pairs. A pair is a *deliberate split* when the second subject
  shares the first's prefix before the first `:` or is a numbered part
  (`… 1/3`); otherwise *rework*.
  **Test:** the 2026-11-08→15 window reports 29 pairs / 15 sharing and separates
  the three "Secret relationship recommendations" splits.
  **Size:** S.
- **File:** `ROADMAP.md:15-25`
  **Change:** keep the shared-path baseline verbatim (26 pairs / 15 sharing) and
  add a rework-count baseline computed for the same window, so the 2026-11-28
  comparison is like-for-like. The section stays one section.
  **Test:** `check-roadmap` passes.
  **Size:** S.

### I3 — Single assembled spec (R5)

Dev-time duplication is already handled by `assemble.ts:149-156`; this increment
only stops tracking the copy and pins the pack-time invariant.

- **File:** `.gitignore`
  **Change:** add `holonovel/holonovel.md`.
  **Test:** `git check-ignore holonovel/holonovel.md` exits 0.
  **Size:** S.
- **File:** `holonovel/holonovel.md`
  **Change:** `git rm --cached`; the file remains on disk, produced by assemble.
  **Test:** `git ls-files holonovel/holonovel.md` is empty; the file still exists.
  **Size:** S (removes 1.79 MB from every future diff).
- **File:** `holonovel/scripts/prepare-package.mjs:19-37`
  **Change:** compare the packaged copy with the root spec and fail on divergence
  instead of overwriting silently; cite the single source.
  **Test:** `npm run test:package-smoke` passes (REQ-614).
  **Size:** S.
- **File:** `scripts/test-spec-tooling.ts:320-323` (no edit)
  **Change:** none. Recorded precondition: the test hashes a disk file, so it must
  run after `assemble` (as `check:fast` does). A standalone run in a fresh
  checkout must assemble first; this is added to the plan's verification note, not
  the test.
  **Size:** S.
- **File:** `scripts/lib/commit-plan.ts:39` (verification only)
  **Change:** none. Untracking does not change `isSpecIncrement`'s path test, and
  `git add -A` simply stops staging the copy. Confirmed by `test:commit-plan`.
  **Test:** `npm run test:commit-plan` passes.
  **Size:** S.

### I4 — Evidence linkage (R8)

- **File:** `scripts/lib/req-checks.ts`
  **Change:** add `checkReqEvidenceLinkage`: a REQ whose `*Check:*` cites a T-ID
  requires the Appendix F row to be kind Automated and a harness under
  `holonovel/scripts` to reference that T-ID; Manual/Gate rows must name the
  procedure or gate explicitly. Step 0 confirms the Appendix F kind column exists
  in `scripts/validate.ts:1815`'s parser; if it does not, the check stops and the
  plan is amended.
  **Test:** `npm run test:validators` gains a red case (REQ citing a Manual T-ID
  with no named procedure) and a green case.
  **Size:** M.
- **File:** `scripts/validate.ts`
  **Change:** wire the check into the single pass in report-only mode first; print
  the corpus finding list.
  **Test:** the dry-run list is produced and recorded before any error mode.
  **Size:** M.
- **File:** `spec/audit/review-register.md`
  **Change:** one dated row recording the dry-run outcome. Required only if
  Appendix M text is also edited; if so, the pre-commit guarded-rule-change gate
  needs this row naming the rule.
  **Test:** `check-registers` passes.
  **Size:** S.

### I5 — Bookkeeping and template (R9, R12)

- **File:** `scripts/session-close.ts`
  **Change:** derive the CHANGELOG bullet list from the AAR's finding headings and
  the touched spec sections, writing only the derived block and preserving
  operator prose. ROADMAP retirement stays manual: there is no `retires` field in
  the artifact contract, and inventing one is out of scope.
  **Test:** `npm run test:commit-plan`; a fixture increment produces the same
  CHANGELOG block the manual edit did.
  **Size:** M.
- **File:** `docs/plans/README.md`
  **Change:** state the delta contract (plan carries intent, done-bar, verification
  table; AAR carries deviations and triage only) and a bound: plan ≤ 150 lines,
  AAR ≤ 120 lines. Name the 70% measurement as the reason.
  **Test:** a new increment follows it; `check-loop-artifacts` unchanged.
  **Size:** S.
- **File:** `scripts/loop-audit.ts`
  **Change:** add one "Session loop" row: median plan+AAR lines per increment, so
  the bound is measurable.
  **Test:** `npm run loop-audit` reports the row.
  **Size:** S.

### I6 — Split `index.ts` (R7)

- **File:** `scripts/refresh-predicates.ts`
  **Change:** stage 0 adds `--repath`: when a symbol is not found on its recorded
  path, search the `holonovel/src` tree for a unique occurrence and rewrite the
  anchor's path and line; refuse when the symbol is absent or ambiguous. Without
  this, a moved symbol is unresolvable and the split cannot heal its own anchors
  (`refresh-predicates.ts:81,94-96`).
  **Test:** `npm run test:anchor-tooling` covers a symbol moved to a new file
  (repath heals), a missing symbol (refused), and a duplicated symbol (refused).
  **Size:** M.
- **File:** `holonovel/src/index.ts` (19,089 lines) → `holonovel/src/tools/`,
  `holonovel/src/trust/`, `holonovel/src/ruleset/`, `holonovel/src/world/`
  **Change:** staged, leaf-first, move-only: (1) tool registry and definitions;
  (2) trust-core envelope and badge/scope helpers; (3) dispatch and error
  normalization; (4) ruleset surface; (5) world-model handlers; (6) synthesis
  router. Run `fix-anchors --repath` in each stage; preserve exported symbols and
  registration order.
  **Test:** `npm --prefix holonovel run test:all` 56/56 after each stage; no file
  exceeds 3,000 lines at the end.
  **Size:** L. **Rollback:** revert the stage commit; no persisted-format change.

## 6. Blast radius

| Path | Increment | Tracked | Note |
|---|---|---|---|
| `docs/plans/2026-11-15-process-improvement-program/tasks.md`, `aar.md` | I0 | yes | gate requires before close |
| `docs/workflow-cadence.md` | I0 | yes | doc only |
| `AGENTS.md` | I0, I1 | yes | gate table regenerated by tool |
| `ROADMAP.md` | I0, I2 | yes | `check-roadmap` |
| `scripts/lib/gate-manifest.ts` | I1 | yes | `check-gate-table` enforces sync |
| `scripts/session-close.ts` | I1, I2, I5 | yes | `test:commit-plan` |
| `scripts/test-anchor-tooling.ts` | I1, I6 | yes | self-test |
| `scripts/lib/loop-artifacts.ts` | I2 | yes | `test:loop-artifacts` |
| `scripts/check-loop-artifacts.ts` | I2 | yes | usage text |
| `docs/plans/README.md` | I2, I5 | yes | artifact contract |
| `scripts/loop-audit.ts` | I2, I5 | yes | writes `spec/audit/loop-audit.md` |
| `.gitignore` | I3 | yes | — |
| `holonovel/holonovel.md` | I3 | becomes untracked | generated |
| `holonovel/scripts/prepare-package.mjs` | I3 | yes | REQ-105/614 |
| `scripts/test-spec-tooling.ts` | I3 | yes | precondition only, no edit |
| `scripts/lib/commit-plan.ts` | I3 | yes | verification only, no edit |
| `scripts/lib/req-checks.ts` | I4 | yes | `test:validators` |
| `scripts/validate.ts` | I4 | yes | all validators |
| `spec/audit/review-register.md` | I4 | yes | `check-registers` |
| `scripts/refresh-predicates.ts` | I6 | yes | `--repath` |
| `holonovel/src/index.ts` + new modules | I6 | yes | `test:all` |

## 7. Dependency order and rollback

1. I0 (no dependency).
2. I1 (independent of I0; both are S and land first).
3. I2 (independent).
4. I3 (independent).
5. I4 (independent; the corpus dry-run gates error mode).
6. I5 (after I4, because the register row format is settled there).
7. I6 last: splitting moves symbols across files, so it depends on I1's heal and
   I6's own `--repath` step.

Every increment reverts with `git revert <sha>`; none writes persisted Novel
state or changes a data format. I6 reverts per stage.

## 8. Risks and edge cases

| Risk | Mitigation |
|---|---|
| Auto-heal masks a genuinely unresolved anchor | `fix-anchors` refuses ambiguous and missing symbols (exit 1); the close aborts (`refresh-predicates.ts:90-96`). |
| Gating anchors in fast slows iteration | `check-anchors` median is 538 ms (loop audit). |
| Working-tree warning hides a missing AAR | `session-close` passes `mode: "close"` and refuses before staging; the hook's recorded skip cannot bypass it. |
| Untracking the packaged copy breaks a dev run | `assemble` writes both; `prepare-package` fails on divergence. |
| `test:spec-tooling` run standalone in a fresh clone | precondition recorded: assemble first; `check:fast` already does. |
| I4's new check floods the corpus | report-only with a triage step before error mode; baseline in the register. |
| I5's derivation mis-writes operator prose | only the derived block is written; a fixture proves parity. |
| I6 changes behavior by accident | move-only stages, 56/56 after each; `--repath` refuses ambiguity. |

## 9. Verification matrix

| Increment | Commands |
|---|---|
| I0 | `npm run assemble && npm run check:fast`; `npm run check-roadmap`; `npm run check-loop-artifacts` |
| I1 | `npm run test:anchor-tooling`; `npm run check:fast`; red/green anchor probe |
| I2 | `npm run test:loop-artifacts`; `npm run check-loop-artifacts`; `npm run session:close --dry-run` |
| I3 | `npm run assemble`; `cmp holonovel.md holonovel/holonovel.md`; `npm run test:commit-plan`; `npm run test:package-smoke` |
| I4 | `npm run test:validators`; `npm run validate`; `npm run validate:sdd` |
| I5 | `npm run test:commit-plan`; `npm run loop-audit` |
| I6 | `npm run test:anchor-tooling`; `npm --prefix holonovel run test:all` per stage |

## 10. Decisions

- **D1 — resolved: untrack the packaged spec copy.** Adopted; I3 implements it.
  Rationale: 1.79 MB × 63 commits of churn, and `assemble` already writes both
  paths, so untracking changes no build behavior.
- **D2 — resolved: report-only first.** Adopted; I4 wires the linkage check in
  report-only mode and promotion to error is its own later increment.
- **D3 — open.** Keep I6 inside this program, or let the ROADMAP section written
  in I0 own it? It is 3–5 commits against a 19 k-line file. Recommendation: keep
  it scheduled in ROADMAP and execute it as its own increment, because the bar of
  *this* plan is I0 + I1.
