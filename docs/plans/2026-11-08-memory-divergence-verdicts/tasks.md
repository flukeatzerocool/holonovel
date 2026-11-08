# Tasks — Memory divergence verdicts

Dependency order. Each task ends green under `check:fast`; the spec block lands
before the implementation so `tool-citation-check` has a target.

1. **Spec section.** Add REQ-629–REQ-633 to §5.35 (`spec/02-requirements.md`),
   extend the §5 map row to `623–633`, run `npm run assemble`.
2. **Appendix tables.** Add O.13 after O.12 (`spec/appendices-reference.md`),
   update T91's O-range, add Appendix E rows and Appendix F T748–T752.
3. **Core module.** Write `holonovel/src/core/divergence.ts` with the
   `projectTruthFacts`, `affectValence`, and `checkRecord` contracts from the plan
   and the REQ citations in the header.
4. **Action.** Confirm no sibling REQ binding `manage_belief` conflicts with the
   new read; add `subjective_verify` to the enum, description, routing prefix,
   and handler; trim the description to ≤1000 bytes; register the action in
   `holonovel/tool-surface-registry.json`; disposition an `action-conflicts`
   candidate in the baseline if one appears.
5. **Briefing marker.** Append `[divergence: <verdict>]` in
   `composeSubjectiveMemorySection` for divergent records only.
6. **Tests.** T748–T751 in `holonovel/scripts/test-belief.ts`; the new fixture
   `holonovel/scripts/fixtures/subjective-divergence.json` and T752 in
   `holonovel/scripts/test-memory-recall.ts`.
7. **Regenerated artifacts.** `generate-tool-definitions.ts`,
   `surface-budget -- --write`, `validate -- --write-register`, `npm run assemble`.
8. **Docs and registers.** `holonovel/AGENTS.md`, DECISIONS, CHANGELOG (headed
   `2026-11-08`), ROADMAP item removal, AAR.
9. **Close.** `npm run check:fast` un-piped, `test:belief`, `test:memory-recall`,
   `test:all`, `npm run build-order`, `HOLONOVEL_IMPL_STRICT=1 npm run validate`,
   `npm run session:close`.
