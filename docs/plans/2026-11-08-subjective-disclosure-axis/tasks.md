# Tasks — Subjective memory disclosure axis and Player exposure

Dependency order. Each task ends green under `check:fast`; the spec block lands
before the implementation so `tool-citation-check` and the coverage audit have
a target.

1. **Spec section.** Amend REQ-623 (record gains `disclosure`), REQ-624
   (`subjective_disclosure` parameter, default `secret`), REQ-625 (Player read
   of the active entity; foreign entity `[FORBIDDEN]`; Observer unchanged),
   REQ-626 (Player variant, GM tags), REQ-627 (export/clone carries the
   attribute; reclassification is not rolled back) in
   `spec/02-requirements.md` §5.35; add REQ-634 (disclosure axis and the
   exposure matrix) and REQ-635 (reclassification action). Update the §5 map
   row to `623–635`, REQ-109 `:1302`, REQ-599b `:1443`, REQ-096b `:3050`.
   Verify each body against the 800-character and 8-sentence limits. Run
   `npm run assemble`.
2. **Appendix and glossary tables.** Appendix E rows for REQ-634/635
   (`spec/appendices-reference.md`), Appendix F rows T753–T757, and amended
   T744/T745/T746 rows for the new read, briefing, and persistence contracts;
   the §7.7.4 Subjective Memory row (`spec/04-runtime.md:289`) and the §4
   glossary row (`spec/01a-constitution.md:174`). Run
   `npm run assemble && npm run validate`.
3. **Core module.** `holonovel/src/core/subjective.ts`: `MemoryDisclosure`,
   `MEMORY_DISCLOSURES`, the `secret` default inside
   `normalizeSubjectiveRecord`, `playerProjection`, `disclosureScanTargets`.
   Cite REQ-623/634/635 and REQ-599b in the header.
4. **Tool schema and handler.** `holonovel/src/index.ts`: add
   `subjective_disclosure` (enum `open`/`guarded`/`secret`) and
   `subjective_record_id`; add `subjective_disclose` to the action enum and
   description; dispatch under the existing `subjective_` routing prefix.
   Enforce GM-only record and disclose, `[INVALID_INPUT]` on a bad value,
   `[NOT_FOUND]` on an unknown record id, Player scoping per plan D4. Keep the
   description inside the recorded byte budget. Sibling-contract grep for
   another REQ binding `subjective_list`/`subjective_record` before editing.
5. **Briefing.** `composeSubjectiveMemorySection` (`holonovel/src/index.ts:2213`):
   GM line tag (D9); Player branch applying the D2 matrix over the active
   entity with the existing ordering and cap.
6. **Draft scan.** `collectVisibilityTargets`
   (`holonovel/src/index.ts:1102`) consumes `disclosureScanTargets`; no other
   target source or threshold changes.
7. **Player-scope export.** `PLAYER_OMITTED_KEYS` (`holonovel/src/index.ts:9831`)
   drops `subjective_memory`; `redactNovelForPlayer` inserts the filtered
   projection (D7).
8. **Tests.** T753 (default/flip/invalid), T754 (Player read scoping),
   T755 (Player briefing matrix and determinism), T756 (scan redaction and
   non-redaction), T757 (reclassification, audit entry, and the player-scope
   export through `manage_archive (action: export, scope: "player")`) in
   `holonovel/scripts/test-belief.ts`.
9. **Regenerated artifacts.** `cd holonovel && npx tsx
   scripts/generate-tool-definitions.ts`; `npm run surface-budget -- --write`;
   `npx tsx scripts/surface-replay.ts --check` (write only on a delta);
   `cd holonovel && npm run build:starter-novel` (the `DATA_FORMAT` bump lands
   in the starter artifact); `npm run validate -- --write-register`;
   `npm run assemble`.
10. **Docs and registers.** `holonovel/AGENTS.md` action list; DECISIONS entry
    (default disclosure, undo asymmetry, gate-classification note, and the two
    deferrals); CHANGELOG under the version-pinned date (`2026-11-08` today);
    ROADMAP section removal; `spec/audit/review-register.md` checked for a
    `Scheduled-roadmap` row naming the item; coverage register current;
    `docs/plans/2026-11-08-subjective-disclosure-axis/aar.md` written.
11. **Close.** Un-piped `npm run check:fast`; `cd holonovel && npm run
    test:belief`; `cd holonovel && npm run test:briefing`; `cd holonovel && npm
    run test:all`; `npm run build-order` (refreshes
    `holonovel/src/generated/contract-fingerprints.ts`); `HOLONOVEL_IMPL_STRICT=1
    npm run validate`; `npm run session:close`.
