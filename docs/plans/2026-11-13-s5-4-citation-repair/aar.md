# AAR — §5.4 citation repair (REQ-104c / T103)

Plan: `plan.md` (amendment A1 during execution). Tasks: `tasks.md`.
Baseline: HEAD `554a446`, clean tree, `check:fast` 41/41.
Terminal token: **LOOP PAUSED** (final line).

## What happened

1. Added the four `T103/REQ-104c` assertions to
   `holonovel/scripts/test-workflow.ts`; the two creation-undo assertions failed
   against `554a446` with `[STATE_CONFLICT] Nothing to undo` (red recorded in
   `tasks.md`).
2. Root cause: both ruleset-free creation paths mutated Novel state without a
   pre-mutation snapshot (`holonovel/src/index.ts:4813` quick,
   `:4263` step-by-step completion). Added the two `novelSnapshot()` calls;
   `test:workflow` 18/18, probe confirms undo removes the character in both
   modes and leaves the roster untouched.
3. `test:all` then failed on 14 `predicate_unresolved` findings: the two
   inserted lines shifted the Holosuite `anchor("holonovel/src/index.ts", N,
   "sym")` constants. Wrote amendment A1, re-stamped the plan, repointed 13
   anchors (+1 for recorded lines 4263–4811, +2 above 4811), verified each new
   line holds its symbol, and re-ran `test:all` → 56 passed, 0 failed.
4. Refreshed the coverage register (REQ-104 row now `T32, T468, T103, T141`),
   closed F-P3-8 under `## Resolved` (deleting the Scheduled-roadmap chunk-P3
   stub whose four implementation findings were already resolved), removed the
   ROADMAP section, and added the dated CHANGELOG entry.

## What went right

- The plan's red-first condition (C-1) did its job: the assertion was written
  before the fix, so the missing snapshot surfaced as a failing contract rather
  than a silent gap in evidence.
- The fixture-ruleset probe earlier in the session distinguished the working
  rules-backed path from the broken rules-free path, which narrowed C1 to two
  lines.
- The anchor shift was mechanical and symbol-verified, so the repoint could be
  proven rather than guessed.

## What went wrong

- The plan assumed `test:all` would show no new failure; it did not account for
  pinned evidence anchors. The delta-amendment path absorbed it, at the cost of
  one extra full suite run (~165 s each).
- The proofread-register count drift (283 recorded vs 284 live) was not in the
  baseline capture; it is pre-existing (assembled spec and proofread register
  are byte-identical to HEAD) and informational.

## Deviations from the plan

1. C8 / amendment A1: four `holonovel/scripts/lib/holosuite-*.ts` files added
   to the blast radius for the anchor repoint, plan re-stamped before the edit.
2. The T103 block completes the step-by-step flow by iterating a fixed six-answer
   list and stopping on `[OK]` (the plan's "drive off `[NEED_INPUT]`, cap 8" is
   satisfied by that bound); no behaviour difference.

## Done-bar judgement

1. T103 resolves to an exercised harness — met (four assertions, red before the
   fix).
2. Both profile-only creation paths snapshot before mutating; no stack-depth
   regression — met (`test:all` 56/56; T10/T138/T157/T266 green).
3. Coverage register lists T103 on the REQ-104 row and is fresh — met.
4. F-P3-8 `Resolved`; no Scheduled-roadmap entry cites REQ-104c — met
   (`check-registers` PASS).
5. ROADMAP section removed; dated CHANGELOG entry present — met
   (`check-roadmap` OK, 7 sections).
6. `assemble && check:fast` green — pending the final run after `aar.md` lands
   (the loop-artifacts gate requires this file); `check-conformance` re-run with
   the correct script name.
7. One `session:close` commit — pending.

## Recommendations

None new. The anchor-drift cost is already scheduled (ROADMAP *Holosuite anchor
repoint automation (P2)*); the P2 harness-label-hygiene item still owns the
`atest`-collector blindness that made `test-character-creation.ts` the wrong
home for T103. No open P0/P1 beyond the scheduled roadmap.

LOOP PAUSED
