# AAR — server-suite red baseline

AAR: SUCCESS — the pre-existing `test:all` red set is cleared: 49 passed / 7
failed → **56 passed / 0 failed**, `check:fast: PASS`, roadmap section retired.

## 1. What was supposed to happen

Intent: clear ROADMAP's `Pre-existing server-suite reds (P1)` — the last
blocking baseline failure — as its own increment, before any feature work.
Plan `plan.md`, reviewed at **standard** depth (`plan-review passed.`, cold
pass 5/5 stages), executed under `build-review passed.`.

Declared done bar (plan § Verification):

1. `test:fingerprints` 16/0.
2. `test:identity` 26/0.
3. Five Holosuite tier scripts exit 0, no `predicate_unresolved`, restart row
   stable.
4. `test:all` exits 0.
5. `assemble && check:fast` → `check:fast: PASS`.
6. ROADMAP reds section removed.
7. `docs/plans/2026-11-13-server-suite-reds/` holds plan, tasks, AAR with a
   LOOP token.

## 2. What happened

Four causes diagnosed at their predicates before any edit, then fixed in four
commits:

| Commit | Change | Gate evidence |
|---|---|---|
| `bcaba50` | load-time migration gated on `TTRPG_AUTO_MIGRATE`; sidecar unlink deferred to a successful primary write | `typecheck` 0 · `test:fingerprints` 16/0 · `test:persistence-guardrails` 25/0 · `test:persistence` 49/0 |
| `4850020` | `connection_counter` excluded from the state hash, projection v3; restart diagnostic projected like the hash; 27 anchors repointed | five tiers 45/25/26/3/100, zero findings · `test:fingerprints` 16/0 · `test:persistence` 49/0 |
| `84727ee` | T772 compares the identity block canonically with presence/version asserts | `test:identity` 26/0 · `typecheck` 0 |
| (this commit) | ROADMAP section retired, F-RB-1 – F-RB-4 register entries, plan/tasks/AAR | `test:all` 56/0 · `assemble && check:fast` PASS · `check-roadmap` · `check-registers` |

Loop closure: plan reviewed → executed under build-review → outcome verified
by the harnesses named above.

| Gate | Token | Verdict |
|------|-------|---------|
| plan-review | `plan-review passed.` | passed |
| independent-review | `independent-review passed.` (5/5 stages) | passed |
| build-review | `build-review passed.` | passed |
| spec-review | n/a — no spec body edited | — |
| proofread | not run — no spec prose changed | — |

## 3. What went right

- The four causes were each confirmed at a `file:line` predicate, so no fix
  was aimed at a gate message. The T772 probe (deleted after use) turned a
  "nondeterminism" label into a five-key `appearance_*` delta.
- The cold review earned its cost before execution: it caught the
  sidecar-orphaning design of the first draft, the missing `test-persistence`
  projection pin, and the wrong `_checksum` predicate — all of which would have
  surfaced as mid-build failures.
- Two anchor-motion slips (`stateHash` shifted by the state-hash edit,
  `share` one line below the chosen comment) were caught by the tier runs, not
  by a later full gate, because each tier was re-run to green.
- Done bar item 4 (`test:all`) grew from 49+7 to 56 suites and passed in one
  run after the per-commit gates were already green.

## 4. What went wrong

- **The first draft's Change A was unsafe.** Gating the whole migration on the
  switch would have orphaned the v1 audit sidecar on the next save. Caught in
  cold review stage 1; the adopted-log-then-deferred-unlink design replaced it.
- **A projection pin outside the blast radius.** `test-persistence.ts` T712
  pinned `projection: v2`; the first draft bumped the constant without naming
  the file. Fixed by a plan edit before execution and, in code, by updating the
  pin plus a sweep.
- **Anchor repoint needed one extra round.** The line numbers chosen for
  `stateHash` and `share` shifted with the same commit's edits. The lesson is
  mechanical: repoint anchors *after* the last edit that moves lines in the
  anchored files, then re-run every tier.

## 5. Session efficiency

Two review rounds (self + a 5-stage cold pass) before any edit; seven commits'
worth of verification reduced to four commits because the two Holosuite causes
were merged (no intermediate tree is green — `holosuite.ts` exits 1 on any
finding). No retries beyond the one anchor round and one wrong line reference
inside an anchor. No scope drift: every changed file is in the plan's blast
radius plus `docs/plans/` (named in Change E).

## 6. Recommendations

- **P3 — line-based evidence anchors remain fragile.** 27 anchors drifted from
  code motion alone. The `--fix-anchors` item is already scheduled
  (`Holosuite anchor repoint automation`, P2, ROADMAP); no new action.
- **P3 — `check-roadmap`'s heading count is a weak signal.** It reported 12
  sections both before and after the removal (the count includes `Non-goals`);
  the section text, not the count, is the evidence. Record-and-close.
- **Methodology — good standing, no delta.** The predicate-first rule and the
  "red baseline as its own commit" rule both held.
- No skill-improvement recommendations: no harness skill produced a failure
  this session; the cold pass blocked a real defect before execution.

Follow-through register: the prior AAR's open item (*Pre-existing server-suite
reds*, P1) is **Resolved** by this increment. No open `SR-`/`PR-` finding IDs.

## Loop status

Gates green (`test:all` 56/0, `check:fast: PASS`), no demonstrated failure
open, nothing P0/P1 beyond the scheduled ROADMAP items.

LOOP PAUSED
