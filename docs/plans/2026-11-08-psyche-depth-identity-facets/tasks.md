# Tasks — Psyche-depth identity facets

Dependency order. Each task ends green under `check:fast`; the spec block lands
before the implementation so `tool-citation-check` and the coverage audit have a
target.

1. **Spec section.** Add REQ-636 (facet kinds), REQ-637 (self-awareness),
   REQ-638 (false but held belief), REQ-639 (facet valence), REQ-640 (facet
   temporal bounds), REQ-641 (owned contradiction), REQ-642 (who-they-are
   renderer), REQ-643 (identity Player projection) in
   `spec/02-requirements.md` §5.26. Amend REQ-109c2 (`:1299`) and REQ-109e
   (`:1308`), REQ-476 (`:4189`), REQ-480 (`:4198`), REQ-481 (`:4200`), and
   REQ-482 (`:4202`). Update the §5 map row (`:34`) to
   `473–483, 547, 636–643`. Verify each body against the 800-character and
   8-sentence limits. Run `npm run assemble`.
2. **State model and glossary.** §7.7.0 identity paragraph
   (`spec/04-runtime.md:358-365`): the kind catalog and its order, the
   awareness values, the valence domain, the date-bounds semantics and
   evaluation instant, the tension definition, and the Player projection.
   Glossary row (`spec/01a-constitution.md:166`). Appendix E rows for
   REQ-636–643; Appendix F rows T758–T765
   (`spec/appendices-reference.md:1196`, `:1957`). Run
   `npm run assemble && npm run validate`.
3. **Core module.** `holonovel/src/core/identity.ts`: `FacetKind`,
   `FACET_KINDS`, `FacetAwareness`, `PsycheAttributes` on both records,
   `normalizeFacetAttributes` as the single defaulting point,
   `compileTensions`, `tensions` in `CompiledIdentityKernel` and
   `compileKernel`, `playerProjection`, `renderWhoTheyAre`, and
   `IDENTITY_COMPILER_VERSION` → `2026.11.08`. Attribute flow through
   `candidatesFromCard`, `applyFacet`, and `revertFacet`. Normalization is
   applied once at the access seam — `identityFor` (`index.ts:7958-7963`),
   through which every read and write already passes — so `core/state.ts` stays
   untouched: `RosterEntity.identity` is typed by `core/identity.ts` and
   persisted opaquely. Pure functions only.
4. **Tool schema and handler.** `holonovel/src/index.ts` `manage_identity`:
   `stage` gains `kind`, `awareness`, `false_but_held`, `valence`, `since`,
   `until`, `contradicts`; validation per plan D2–D6 with `[INVALID_INPUT]`;
   `list`/`snapshot` apply `playerProjection` for the Player badge; the
   `identity://<character>` resource applies the same gate as the tool
   (`:7975-7980`) and filters its `list` output. Keep the description inside
   the recorded byte budget. Sibling-contract grep before editing.
5. **Briefing.** `### Who They Are` after the POV block
   (`holonovel/src/index.ts:13427-13433`), rendering
   `renderWhoTheyAre(compileKernel(identity), { badge, at })` for the active
   entity; `at` is the newest event-log entry timestamp for the active Novel
   or `null` when the log is empty; `[No identity facets accepted.]` when the
   entity has none; section absent with no active entity.
6. **Tests.** T758 (kind catalog and legacy default), T759 (awareness marks and
   Player omission), T760 (false-belief mark surviving reconciliation), T761
   (valence preserved and rendered), T762 (date-window render vs. kernel),
   T763 (owned contradiction and the dormant case), T764 (renderer determinism
   and secret/ended absence), T765 (Player projection and foreign-read refusal
   through tool and resource) in `holonovel/scripts/test-identity.ts`; extend
   T572 with a developmental psyche facet.
7. **Regenerated artifacts.** `cd holonovel && npx tsx
   scripts/generate-tool-definitions.ts`; `npm run surface-budget -- --write`;
   `npx tsx scripts/surface-replay.ts --write` only if the check reports a
   delta; `npm run validate -- --write-register`; `npm run assemble`.
8. **Docs and registers.** DECISIONS (kind catalog order, awareness projection,
   date-bounds evaluation point, tension ownership and dormancy, Player
   projection and resource gate, compiler-version bump, `strength` deferral);
   `docs/upstream/cof.md` chunk-4 status and delta-log row;
   `holonovel/AGENTS.md` `manage_identity` line; CHANGELOG under the
   `2026-11-08` heading; ROADMAP section removal; re-grep
   `spec/audit/review-register.md` for a `Scheduled-roadmap` row naming this
   item.
9. **Close.** Un-piped `npm run check:fast`; `cd holonovel && npm run
   test:identity`; `cd holonovel && npm run test:briefing`; `cd holonovel &&
   npm run test:all`; `npm run build-order`; `HOLONOVEL_IMPL_STRICT=1 npm run
   validate`; `npm run session:close`.
