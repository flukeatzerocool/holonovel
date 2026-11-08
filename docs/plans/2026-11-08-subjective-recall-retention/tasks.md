# Tasks — Subjective recall quality and retention

Dependency order. Each task ends green under `check:fast` (the loop-artifact
gate stays red on the missing `aar.md` until task 8, as in every increment);
the spec block lands before the implementation so `tool-citation-check` and the
coverage audit have a target.

1. **Spec section.** Add REQ-644–648 in `spec/02-requirements.md` §5.35 after
   REQ-635; amend REQ-590 (ladder holds per-entity consolidation summaries),
   REQ-626 (score selection, budgeted assembly, evicted marker), REQ-627
   (per-entity bound and consolidation; global cap keeps oldest-first but folds
   first), and REQ-634 (Player selection and badge-scoped count). Update the §5
   map row at `spec/02-requirements.md:43` to `623–648`. Re-measure each body
   with `npm run validate` — the 646 (794) and 647 (793) drafts are close to the
   800-character limit. Run `npm run assemble`.
2. **State model, algorithms, and tables.** In `spec/04-runtime.md`: add §7.9e
   after §7.9d — score terms and weights, whole-record admission, the
   badge-scoped omitted count, and the three marker forms
   (`[truncated] N memories omitted at budget` versus §7.9b's
   `[truncated] <tier> tier omitted at this budget`, plus
   `[evicted #<ordinal>]`). Add the three §7.6 rows, each with its default:
   `TTRPG_SUBJECTIVE_MEMORY_BRIEFING_TOKENS` (Presentation, 800),
   `TTRPG_SUBJECTIVE_MEMORY_PER_ENTITY_MAX` (Storage, 500),
   `TTRPG_SUBJECTIVE_MEMORY_CONSOLIDATION_MAX` (Storage, 2000). Update the
   §7.7.4 Compression Ladder row (`:267`) and Subjective Memory row (`:289`).
   In `spec/appendices-reference.md`: Appendix E rows for REQ-644–648, Appendix
   F rows T766–T770, the T745 ordering amendment (`:2076`), and in O.12 the
   subjective recall floor plus the fixture record/probe field catalog
   (`:3143` region). In `spec/01a-constitution.md:174`: the glossary row gains
   the score and consolidation. Run `npm run assemble && npm run validate`.
3. **Core memory math.** `holonovel/src/core/subjective.ts`: `scoreMemory`
   (integer terms only), `assembleMemorySection` (whole-record admission,
   omitted count, token total), `selectForEviction` (ascending score, ties
   oldest ordinal then id), `foldIntoSummary` (keyed by `memory:<id>`, trims
   oldest lines, no `derived_at`), `eventState` (`retained` | `evicted` |
   `none`); rewrite `selectForBriefing` to sort by score.
   `holonovel/src/core/state.ts`: `EntityMemorySummary`, optional `entities` on
   `CompressionLadder`, `emptyCompressionLadder`, and the load default. Cite
   REQ-644–647 in the module header. Pure functions only.
4. **Ladder surfacing.** `holonovel/src/core/memory.ts`: `deriveCampaignTier`
   emits one fact per entity summary in the `gm` branch only (`memory
   <entity>: <lines joined by "; ">`, `ref: memory:<entity>`), inside the
   existing fact cap. Reuse `estimateTokens` for the section budget; do not add
   a second helper. `refreshCompressionLadder` must not touch `entities`.
5. **Wiring.** `holonovel/src/index.ts`:
   `composeSubjectiveMemorySection` (`:2221`) projects the Player path before
   packing and packs before tagging on the GM path, appends
   `[evicted #<ordinal>]` per record with no marker for a null ordinal, and
   appends one `[truncated]` line when records are omitted; the
   `subjective_record` handler (`:8801`) evicts the entity's overflow through
   `selectForEviction`, folds through `foldIntoSummary`, removes the records,
   then routes the global-cap overflow (`:8803-8804`) through the same fold
   before its oldest-first slice; `subjective_list` (`:8837`) adds the derived
   `event_state`. Before editing, grep for every REQ that bounds
   `badge_briefing` composition (118/135/626/634/645 expected) so no competing
   bound is missed.
6. **Tests.** In `holonovel/scripts/test-memory-recall.ts` with the new
   `holonovel/scripts/fixtures/subjective-recall.json`, titled
   `TNNN/REQ-NNN: …` so the coverage audit scans them: T766 (score order,
   two-render identity), T767 (budget binding, cap binding, badge-scoped
   `[truncated]` count), T768 (`[evicted]` in the section and `event_state` in
   the list after `TTRPG_EVENT_LOG_MAX_ENTRIES` evicts the source; `none` for
   an authored record), T769 (per-entity cap eviction order, consolidation
   text, GM recap inclusion, Player recap omission, survival across a ladder
   refresh, no duplication after undo and re-record), T770 (fixture recall at
   every declared budget for both badges, the floor, and the synthetic-miss
   detector). Reconcile T745 in `holonovel/scripts/test-belief.ts` against
   observed behavior before writing T766. Extend the harness header citations
   to REQ-644–648.
7. **Regenerated artifacts.** `cd holonovel && npm run build:starter-novel`;
   `npx tsx scripts/generate-tool-definitions.ts`; `npm run surface-budget --
   --write`; `npx tsx scripts/surface-replay.ts --write` only if the check
   reports a delta; `npm run validate -- --write-register`; `npm run
   assemble`.
8. **Docs and registers.** `holonovel/DECISIONS.md` entries for D1–D8 plus the
   two deferrals (Player-visible consolidation, configurable weights);
   `holonovel/AGENTS.md` `manage_belief` line; CHANGELOG under the `2026-11-08`
   heading; ROADMAP section removal (`:15-25`); re-grep
   `spec/audit/review-register.md` for a `Scheduled-roadmap` row naming this
   item; write
   `docs/plans/2026-11-08-subjective-recall-retention/aar.md`.
9. **Close.** Un-piped `npm run check:fast`; `cd holonovel && npm run
   test:memory-recall`; `cd holonovel && npm run test:belief`; `cd holonovel &&
   npm run test:briefing`; `cd holonovel && npm run test:all`; `npm run
   build-order` (refreshes
   `holonovel/src/generated/contract-fingerprints.ts`); `HOLONOVEL_IMPL_STRICT=1
   npm run validate`; `npm run session:close`.
