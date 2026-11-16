# Tasks — process improvement program

Dependency-ordered. I0 and I1 are this session; I2–I6 are admitted to `ROADMAP.md`
and execute as their own increments.

## I0 — Process contract and ROADMAP admission

1. **Artifact.** Author `tasks.md` (this file) and a provisional `aar.md`.
   *Verify:* `npm run check-loop-artifacts` → 0 errors.
2. **Cadence.** Add the four per-session rules to `docs/workflow-cadence.md`:
   context budget, review the delta, review budget, shell ergonomics.
   *Verify:* the section names each rule and its trigger.
3. **Routine pointer.** Add one bullet to `AGENTS.md` → "Agent Operating Routine".
   *Verify:* `npm run check-gate-table` → PASS.
4. **ROADMAP admission.** Add five sections, each 1–3 bullets and `**Trigger:**`:
   loop-artifact gate ordering, single assembled spec copy, REQ evidence linkage,
   bookkeeping derivation, split `index.ts`. The existing fix-up re-measurement
   section carries R11 and is amended by I2.
   *Verify:* `npm run check-roadmap` → PASS, six sections.
5. **Changelog.** Add the dated `2026-11-15` heading for this increment.
   *Verify:* the top heading matches `session:close`'s derived subject.
6. **Close.** `npm run assemble && npm run check:fast`, then
   `npm run session:close --single`.

## I1 — Anchor maintenance

7. **Fast tier.** `check-anchors` fast: `npm("check-anchors")` in
   `scripts/lib/gate-manifest.ts`; regenerate the `AGENTS.md` gate table.
   *Verify:* `check-gate-table` PASS.
8. **Close heal.** In `scripts/session-close.ts`, run `npm run fix-anchors` after
   `assemble` and before `check:fast`.
   *Verify:* a moved anchor is healed before the gate runs.
9. **Self-test.** Add the unique-symbol shift and duplicated-symbol refusal cases
   to `scripts/test-anchor-tooling.ts`.
   *Verify:* `npm run test:anchor-tooling` PASS.
10. **Red probe.** Insert three lines above a recorded anchor; confirm
    `check:fast` fails on `check-anchors` and `fix-anchors` repairs it.
11. **AAR amendment.** Record I1 evidence and the red probe in `aar.md`.
12. **Close.** `npm run session:close --single`.
