# After-action report — seam-drift remediation

**Date:** 2026-11-09 · **Plan:** `plan.md` (sha256
`73fdf090e5583660db57b0755504920fb0812409a3adffc761c0a58a4e77154b`)
**Gate:** `plan-gate.mjs stamp-plan` — verdict `passed`, independence `fresh`,
depth `standard`, cold report sha `a5bc298bb8fec007b382cf7e4c64b48402d24795b8f367e1e096f0e136141736`

## What happened

The seam drift report found seven disagreements between
`docs/engine-contract.md` + §5.9/§5.19 and `holonovel/src`. Two of them were
worse than reported: state drift could never become true, and
`TTRPG_STATE_GATE=warn` had no implementation. The plan grew from seven
mechanical findings to nine, and the cold review drove four revisions before
it passed.

## What went right

- The cold review caught the unreachable-drift defect before any code changed.
  My first plan would have shipped a `state_health` marker that was always
  false, and a test that could not pass.
- The baseline test run (13/13 green while the acceptance criteria were unmet)
  was the evidence that the tests only asserted their titles. That is what
  justified rewriting them rather than adding new ones.
- The plan-gate closure loop worked: each NOT_READY named a concrete missing
  element (REQ-095b, REQ-030, the S8 anchor, the block test), and each was
  resolved against the tree rather than argued away.
- Regenerating the starter artifact after touching `core/state.ts` was
  mechanical: the freshness gate named the exact command.

## What went wrong

- First draft mis-sized the task: it treated F4 as a spec-only edit and missed
  that `save_context` was the only writer of the drift timestamp while also
  being the call that cleared it.
- The draft's evidence IDs collided with the repo's own E8 decision label,
  which confused a reviewer.
- I initially pointed the `engine-contract.md:179` citation at
  `restoreFromBackups`; the claim actually lives in `backupCandidates`.
- `build-order` failed twice before green: once for the starter artifact
  fingerprint, once for the missing AAR (this file).

## Verification evidence

- `npm --prefix holonovel run test:persistence-guardrails` → 16 passed / 0
  failed (was 13 / 0).
- `npm run validate -- --write-register` → 0 errors; buckets A 0, B 0,
  C 478, D 0, E 125.
- `npm run typecheck` → exit 0.
- `npm run assemble` → exit 0.
- `npm run build-order` → exit 0 (version advanced to 2026.11.09; starter
  artifact re-emitted for the new data-format fingerprint).
- `npm run check:fast` → 37 passed, 0 failed, `check:fast: PASS`.
- `npm run check` → `check: PASS`, exit 0.

## Open items

None from this increment. Publication (push, deploy verification) is out of
scope per the plan; the AAR therefore cannot claim a deployed state.

`LOOP OPEN`
