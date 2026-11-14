# AAR — §5.4 remediation

Date: 2026-11-13 (session crossed into 2026-11-14 UTC)
Plan: `plan.md` (stamped `24fdc6fa…` after the delta amendment; original
`ef81f61b…` at approval)
Baseline: HEAD `842a71e`, clean tree, `check:fast` 41/41.

## What shipped

- **F-P3-5** `respond_decision` now appends `end_novel` through
  `state.audit` before the file moves, refuses before mutating when fewer than
  three audit slots remain, marks the entry as a security event, and records
  `end_novel_failed` when a move fails. The primary rename is the last move, so
  a failure leaves the Novel live. `AUDIT_CAP_CORRECTIVE` replaces the stale
  `session (action: compress)` wording.
- **F-P3-6** `buildCharacterStats` takes the bound ruleset slug; every assigned
  item carries a source (package-declared, else the slug), and the `equipment`
  key is omitted when nothing was assigned.
- **F-P3-7 / F-P3-9** `computeDerived` names the statistic, label, and formula;
  both creation paths return `[ERROR] [INVALID_INPUT]` with a package-side
  corrective action, and the whole compute block runs before the drain.
- **Tests** T468 gained a six-assertion server tier over the shipped fixture
  (labels, declared source, supplied source, omission, named error, undrained
  workflow); T158 gained the audit-record, stderr, and audit-capacity clauses.
  Appendix F rows record both.
- **Registers** F-P3-5/6/7/9 `Resolved` with dated predicates, F-P3-8 stays
  scheduled; the §5.4 remediation ROADMAP section is closed and its dangling
  Trigger reference repaired; DECISIONS and CHANGELOG updated.

## Verification

| Gate | Result |
|---|---|
| `test:character-creation` | 13 pure + 6 server-tier passed |
| `test:persistence` | 51 passed, 0 failed |
| `test:all` | 56 passed, 0 failed |
| `assemble` + `check:fast` | 41/41 PASS |
| `build-order` | complete, 0 errors |
| `check:conformance` | PASS (0 bundle-dependent REQs) |
| `check-registers` | PASS |

Red evidence is recorded in `tasks.md`: 5 character-creation assertions and 2
persistence assertions failed before the implementation and passed after.

## What went right

- Red-first ordering caught that the fixture's declared-source and label
  assertions were already green, so only four behaviours were genuinely
  missing — the rest act as regression guards.
- The cold pass found nine distinct defect classes before any code was written;
  the disposal failure contract in particular went through three revisions and
  ended simpler than the first draft (no new `[PARTIAL]` primitive).
- Deriving each variant package's content hash in-test let one fixture serve
  three behaviours without committing new fixture files.

## What went wrong

- The blast radius missed the Holosuite evidence-anchor surface. Four
  `test:all` runs were needed to chase line drift across five
  `scripts/lib/holosuite-*.ts` files. This is the exact recurring cost the
  ROADMAP's "Holosuite anchor repoint automation" item exists to remove; the
  item stays open and this session is new evidence for it.
- The plan's T158 capacity clause specified `TTRPG_AUDIT_MAX_ENTRIES=1`. The
  implementation instead computes `cap = logLength + 2`, because a fixed cap of
  1 is fragile against a startup append; the derivation is deterministic and
  still exercises the refusal. Recorded as a deviation.
- The first readiness cold pass returned `not-ready` twice before the final
  fixes, consuming the dispatch budget; the gate closed on a recorded risk
  acceptance with the last four fixes verified by direct inspection.

## Deviations from the plan

1. Capacity test uses a computed cap, not the literal `1` (above).
2. Variant packages are built by rewriting the manifest slug and recomputing
   `computeContentHash`, because `installPackage` requires `manifest.slug ===
   slug` and a matching hash (`holonovel/src/rulesets.ts:677-695`).
3. Anchor repoints were added to the blast radius by delta amendment and the
   plan was re-stamped before the commit.

## Done-bar judgement

1. Four findings `Resolved` with dated evidence — met.
2. Harnesses green — met.
3. Spec gates, conformance, registers, fresh coverage register — met.
4. ROADMAP section deleted, Trigger and register preamble repaired — met.
5. One `session:close` commit — met.

## Recommendations

None new. The anchor-drift cost is already scheduled (ROADMAP *Holosuite anchor
repoint automation*); F-P3-8 and the remaining coverage work stay in their
existing roadmap sections; the proofread-register count drift (283 recorded vs
284 live) is pre-existing and informational.

LOOP PAUSED
