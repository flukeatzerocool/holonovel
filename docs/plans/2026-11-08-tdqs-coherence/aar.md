# AAR — Server coherence remediation (2026-11-08)

Session 2026-11-08. Base HEAD `a42f790` (plan drafted at `e59857f`). One spec
increment, one commit. Plan revision 2 (re-stamped against `a42f790`).

**Done bar:** the four split originals carry no `_meta.deprecated` and no prose
claiming retired actions remain callable; the 27 retired actions still refuse
naming the split tool; `manage_world (list|get)` is live and T511 asserts it;
Novel notes, corpus access, and causal mutations are undoable; the lint guards
the knowledge cluster and deprecated listed tools; the internal coherence proxy
reports disambiguation 3 and 10 mutual pairs; `check:fast`, `check`, and the
five server harnesses pass; one commit with plan/tasks/AAR and a LOOP token.

## What happened

1. **Baseline delta.** The tree advanced from `e59857f` to `a42f790` between
   the plan and execution: the previously untracked user-data update increment
   was committed with its AAR. The plan was re-stamped and preflighted against
   `a42f790`; `check:fast` was 37/0 PASS before the first edit.
2. **Phase 1.** Added `meta` capture to the tool-definitions artifact (schema
   3) and two lint rules. The dry run produced exactly the predicted findings:
   four listed tools marked deprecated and three missing knowledge-cluster
   axes.
3. **P1/P2.** Removed the four stale `_meta.deprecated` markers; corrected
   `manage_novel`'s compatibility sentence; dropped the four originals'
   back-references to their split tools. `test:tool-surface` passes with a new
   assertion covering all retired action aliases.
4. **P3/P6.** Rewrote the seven knowledge/content opening sentences, added
   three axes and the `knowledge` cluster. The eight widest tools gained
   action-span title suffixes.
5. **P4.** Added `manage_world (action: list|get)` under `requireGM()`, two
   lookup declarations, REQ-198's read sentence, and assertions in T241/T511.
6. **P5.** Added `novelSnapshot()` to note set/remove, corpus
   register/route/grant/deny/access, and causal mutations. The new T10 block
   passes.
7. **Registers.** DECISIONS budget/surface budgets and D1–D7, review register
   F1–F7, coverage register, CHANGELOG, and this increment.

## Evidence

| Step | Command | Result |
|---|---|---|
| Baseline | `npm run check:fast` | 37/0 PASS |
| Lint dry run | `npx tsx scripts/tool-definitions-lint.ts` | 4 deprecated + 3 missing axes (predicted) |
| Lint final | `npx tsx scripts/tool-definitions-lint.ts` | 0 violations |
| Surface contract | `npx tsx scripts/check-tool-surface.ts` | PASS, 296 declarations (242 canonical) |
| Coherence | `cd holonovel && npm run score:tools` | 3.8 proxy; disambiguation 3; 10 mutual pairs |
| Surface harness | `cd holonovel && npm run test:tool-surface` | 13/0 PASS |
| Definitions harness | `cd holonovel && npm run test:tool-definitions` | 17/0 PASS |
| Backfill harness | `cd holonovel && npm run test:backfill` | 78/0 PASS |
| Guardrails harness | `cd holonovel && npm run test:persistence-guardrails` | 13/0 PASS |
| Guards harness | `cd holonovel && npm run test:surface-guards` | 15/0 PASS |
| Budget | `npx tsx scripts/surface-budget.ts --write` | canonical 242, compatibility 54 |
| Replay | `npx tsx scripts/surface-replay.ts --check` | 46 intents, precision 0.978 |
| Validation | `npm run validate -- --write-register` | 0 errors, 277 warnings |
| Assembly | `npm run assemble` | spec hash `118d6dac…` |
| Fast gate | `npm run check:fast` | 37/0 PASS |
| Full gate | `npm run check` | PASS |
| Build order | `npm run build-order` | complete, fingerprints propagated |

## What went right

- The evidence correction before execution prevented a wasted action-retirement
  pass: the 27 split actions were already hidden tombstones, so P2 reduced to a
  prose and metadata fix.
- The lint dry run matched the predicted findings exactly, so the new gates
  never surprised the build.
- One-way split routing dropped four mutual pairs without deleting useful
  guidance, moving disambiguation 2→3.

## What went wrong

- **F1 (P2, resolved in-session).** The first corpus undo test passed
  unprefixed `title`/`body`/`domain` to `manage_corpus`; the tool expects
  `corpus_*` parameters. The harness failed once, then passed with the
  prefixed names. Recorded rather than hidden.
- **F2 (P3, record-and-close).** `manage_synthesis`'s first rewrite exceeded
  the 1000-byte cap by 10 bytes; shortening the parenthetical fixed it.
- **F3 (P6 delta, record-and-close).** P6 moved from first-sentence spans to
  title spans because five descriptions sat within 30 bytes of the budget.
  Intent preserved; recorded in tasks.md D-1.

## What remains

- The external Glama score can only be re-captured after the catalog changes;
  the internal proxy moved 3.5→3.8 (disambiguation 2→3, 14→10 mutual pairs).
  Re-inspection is a follow-up, not an open action item.

## Follow-up check

- `check:fast` 37/0 PASS, `check` PASS, and `build-order` complete are the
  final gates. No P0/P1 finding remains; F1–F3 are recorded above, and F3 is
  the approved P6 title-span deviation.

LOOP PAUSED
