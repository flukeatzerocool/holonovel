# Tasks — server-suite red baseline

Increment: `docs/plans/2026-11-13-server-suite-reds/`
Plan: `plan.md` · AAR: `aar.md`
Status: complete (see aar.md)

## Phase 0 — baseline and evidence

- [x] 0.1 Re-confirm baseline: `npm run status` (67 unpushed, 12 open items),
      `git status --porcelain` (clean), `npm run check:fast` (41/41,
      `check:fast: PASS`).
- [x] 0.2 `npm --prefix holonovel run test:all` — 49 passed, 7 failed;
      the seven are `test:fingerprints` (5), `test:identity` (1), and the five
      Holosuite tiers.
- [x] 0.3 Probe each cause at its predicate: `state.ts:1696` unconditional
      load-time save; 27 `path:line#symbol` anchors that no longer resolve;
      `STATE_HASH_EXCLUDED_KEYS` omitting `connection_counter`; T772 comparing
      a whole record across a mutating briefing.
- [x] 0.4 T772 differential probe (throwaway script, deleted): the only changed
      keys were `appearance_scenes`, `appearance_count`, `first_seen`,
      `last_seen`, `appearance_sessions`.

## Phase 1 — migration gating (commit 1)

- [x] 1.1 Export `autoMigrateEnabled()` from `core/state.ts`; reuse it at
      `index.ts:137`.
- [x] 1.2 Defer the v1 audit-sidecar unlink to a successful primary write
      (`pendingAuditSidecars`); gate the load-time save on the switch.
- [x] 1.3 Verify: `typecheck` 0 · `test:fingerprints` 16/0 ·
      `test:persistence-guardrails` 25/0 · `test:persistence` 49/0.

## Phase 2 — holosuite greens (commit 2)

- [x] 2.1 Exclude `connection_counter` from the state-hash projection; bump
      projection 2 → 3; update the T712 pin (2 → 3) and sweep for other pins.
- [x] 2.2 Project the restart diagnostic through the same shape as the hash.
- [x] 2.3 Repoint 27 anchors by definition/dispatch site across the five tier
      libraries; re-run each tier until zero findings.
- [x] 2.4 Record both interpretations in `holonovel/DECISIONS.md`.
- [x] 2.5 Verify: five tiers exit 0 (45/25/26/3/100, no findings) ·
      `test:fingerprints` 16/0 · `test:persistence` 49/0 · `typecheck` 0.

## Phase 3 — T772 (commit 3)

- [x] 3.1 Require the identity block and a numeric version; compare canonically
      with `canonicalJson` imported from `src/core/state-hash.js`.
- [x] 3.2 Verify: `test:identity` 26/0 · `typecheck` 0.

## Phase 4 — close-out (commit 4)

- [x] 4.1 Remove the `Pre-existing server-suite reds (P1)` section from
      `ROADMAP.md`.
- [x] 4.2 Add the F-RB-1 – F-RB-4 `Resolved` entries to
      `spec/audit/review-register.md`, each citing its predicate.
- [x] 4.3 Copy the plan artifact and the cold review into this directory; write
      this file and `aar.md`.
- [x] 4.4 Verify: `npm --prefix holonovel run test:all` exits 0;
      `npm run assemble && npm run check:fast` ends `check:fast: PASS`.
