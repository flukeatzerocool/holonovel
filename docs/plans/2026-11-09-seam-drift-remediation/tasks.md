# Tasks — seam-drift remediation

Dependency-ordered. Each group ends with a verification command; do not start
the next group on a failure introduced by the current one.

## T0. Pre-execution

- [x] Gate stamped: `plan-gate.mjs stamp-plan`, verdict `passed`, independence
      `fresh`, depth `standard`, cold report sha `a5bc298b…`.
- [x] Baseline recorded: `check:fast` exit 0; `test:persistence-guardrails`
      13/13 pass while the criteria are unmet (the evidence for F1–F3).
- [x] Confirmed `save_context` clears the timestamp it compares: `saved_at`
      written at `index.ts:10978`, `recordMutation` at `:10979`, comparison at
      `state.ts:2073`.

## T1. Drift reachability (S1)

- [x] `stateDriftActive`: false when `saved_at` is absent; true when
      `last_mutation_at` is null; otherwise compare.
- [x] Add `recordContextSave` — counts the `context` group, no clock, no
      roll drain, no agency ceiling.
- [x] `save_context` calls `recordContextSave`.
- [x] Verify: `npm --prefix holonovel run typecheck` exit 0.

## T2. Warn mode and block message (S2)

- [x] `stateDriftWarning` / `stateDriftBlockMessage` helpers.
- [x] Recap appends the warning under `warn`.
- [x] `switch` and `end` append the warning under `warn`; block messages no
      longer advise `save_context`.
- [x] Verify: T472 warn/block cases (T4).

## T3. Health surface (S3)

- [x] `state_health` block in `buildSpecHealth` (GM-gated).
- [x] Verify: `typecheck`; T471/T475 assertions (T4).

## T4. Tests (S4)

- [x] T471 asserts `[session-no-mutations]` and a non-empty window list.
- [x] T472 asserts drift from a bare context save, warn in recap/switch,
      block on switch, `save_context` still callable, and the clearing
      mutation.
- [x] T475 asserts `[state-regression]` and `audit_gap === 1`.
- [x] Verify: `npm --prefix holonovel run test:persistence-guardrails` →
      16 passed / 0 failed.

## T5. Drift contract wording (S5)

- [x] REQ-403a: drift is measured against the last story-state mutation.
- [x] REQ-403b: block list is `end` + `switch`; warn names the commit route.
- [x] T472: same deletion; a story-state mutation clears the gate.

## T6. Process-global scope (S6)

- [x] REQ-030, REQ-088a/c/d, REQ-095a/b, REQ-240b, REQ-256a, REQ-334a.
- [x] T98: two concurrent connections observe the same active Novel.

## T7. Save paths (S7)

- [x] Eight install-relative literals → `<DATA_DIR>/…`.
- [x] REQ-092f legacy JSONL path preserved.
- [x] Verify: `rg '\.holonovel-state/(novels|archive)'` → one line.

## T8. Engine-contract citations (S8)

- [x] Four citations re-pointed; each re-grepped.

## T9. Registers and artifacts (S9)

- [x] Review-register `Resolved` subsection, F1–F7.
- [x] CHANGELOG entry.
- [x] This increment's `plan.md`, `tasks.md`, `aar.md`.

## T10. Regenerate and gate (S10)

- [ ] `npm run assemble`
- [ ] `npm run validate -- --write-register`
- [ ] `npm run build-order`
- [ ] `npm run check:fast`
- [ ] `npm run check`
