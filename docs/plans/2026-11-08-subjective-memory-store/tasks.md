# Tasks — Subjective memory store (GM-only)

Session 2026-11-08. Plan: `plan.md` (chunk 1 of 5, `ROADMAP.md:15-25`).
Ordered by dependency; each item's evidence is the command that proved it.

## Baseline (before the first edit)

- [ ] `npm run status` → version 2026.11.08, 5 open roadmap items.
- [ ] `npm run check:fast` → **PASS, 36 passed / 0 failed** at `9b856c0`.
- [ ] `npm run assemble` → exit 0.
- [ ] `cd holonovel && npm run test:belief` → record pass count.
- [ ] `npm run check-roadmap` → OK.

## S1 — §5.35 section and REQs (plan Phase 1)

- [ ] Insert `### 5.35 Subjective Memory` before `#### End of requirements`
      (`spec/02-requirements.md:4357`) with the COF credit preamble.
- [ ] REQ-623 (record), REQ-624 (record action), REQ-625 (read and gating),
      REQ-626 (deterministic briefing selection), REQ-627 (persistence and
      retention), REQ-628 (separation from recorded state).
- [ ] §5 map row `| 5.35 | Subjective Memory | 623–628 |`.
- Evidence: `npm run assemble` exit 0; `npm run validate:fast` no REQ-shape error.

## S2 — Cross-references (plan Phase 2)

- [ ] REQ-109c3 and REQ-109e name the `## Subjective Memory` section.
- [ ] §7.7 property row after Perception Ledger; archetype example list.
- [ ] §7.6 `TTRPG_SUBJECTIVE_MEMORY_MAX_ENTRIES` (Storage) and
      `TTRPG_SUBJECTIVE_MEMORY_BRIEFING_MAX` (Presentation — non-behavioral).
- [ ] §5.19 REQ-400 and REQ-407 name the surface.
- [ ] §4 glossary row; Appendix E (Requirements Manifest) rows for REQ-623–628
      with the 2026-11-08 pin; Appendix F (Derived Test Catalogue) T743–T747.
- [ ] Group count 40 → 41 (`spec/03-build.md:658`, T425, T439 — also fixes the
      stale 38).
- [ ] `spec/build-phase-map.md` 33 → 35 subsections (also fixes the stale 33).
- Evidence: `npm run assemble && npm run check:fast` reaches only the expected
  implementation-gated failures.

## S3 — State (plan Phase 3, D2)

- [ ] `holonovel/src/core/subjective.ts`: type, origins, normalize, id, select.
- [ ] `NovelState.subjective_memory` + init `[]` + migrate normalize.
- [ ] `novelToJSON` carries it; `novelToSnapshotJSON` deletes it;
      `APPEND_ONLY_STATE_FIELDS` lists it.
- [ ] Checkpoint capture deletes it beside `event_log`/`perception_ledger`.
- Evidence: two-process tsx probe — record, save, reload → record present with
      claim, `felt_then`, `salience`, `origin`.

## S4 — Actions (plan Phase 4, D3/D4/D5)

- [ ] Sibling-contract check: grep `manage_belief` in `spec/`; confirm no
      conflicting badge gate, error code, or enum semantics in REQ-461–472,
      REQ-540–545, REQ-594; record the result here.
- [ ] Header citation in `subjective.ts` and per-block REQ-623–628 citations in
      the handlers (the coverage audit reads source citations).
- [ ] `manage_belief` enum gains `subjective_record`, `subjective_list`.
- [ ] Ten `subjective_*` parameters with descriptions.
- [ ] Handlers: record (default ordinal = latest, refuse ordinal > latest,
      cap eviction), list (entity or ordinal, badge gate, `[FORBIDDEN]`).
- [ ] Audit entry on record; tool description trimmed under the 1000-byte budget.
- [ ] Declare `manage_belief.subjective_record` and
      `manage_belief.subjective_list` in `holonovel/tool-surface-registry.json`
      (group, phases, entry, mutation class, preconditions, successors, edges).
- Evidence: `npx tsc --noEmit` exit 0; `npm run check-tool-surface` passes;
      manual call returns `[FORBIDDEN]` for Player.

## S5 — Briefing, health, redaction (plan Phases 5, D6/D7/D8)

- [ ] `composeSubjectiveMemorySection` beside `composeCampaignMemorySection`.
- [ ] Rendered after `## Campaign Memory` in the GM briefing path.
- [ ] `subjective_memory_count` (GM-gated) + storage-cap status row.
- [ ] `subjective_memory` in `PLAYER_OMITTED_KEYS`.
- [ ] REQ-407 persistence line names `subjective_record`.
- Evidence: repeated GM render is byte-identical; Player render has no section.

## S6 — Tests (plan Phase 6)

- [ ] T743: record + provenance round-trip.
- [ ] T744: Player/Observer read `[FORBIDDEN]`, Player write refused, cursor
      unchanged.
- [ ] T745: two renders at one state are identical; ordering by salience, then
      ordinal, then id; cap honored; Player render omits the section.
- [ ] T746: end/resume persistence, cap eviction, `subjective_memory_count`.
- [ ] T747: belief/evidence/perception/campaign-memory/event-log unchanged;
      reconcile leaves the memory unchanged.
- [ ] Test names use the `T743/REQ-623: …` prefix (`test-belief.ts:37` style).
- Evidence: `cd holonovel && npm run test:belief` → all pass.

## S7 — Registers and docs (plan Phase 7)

- [ ] ROADMAP section removed.
- [ ] `holonovel/DECISIONS.md` entry: append-only, GM-only, no coupling row.
- [ ] `holonovel/AGENTS.md:101` action list updated.
- [ ] `npx tsx holonovel/scripts/generate-tool-definitions.ts` (writes the
      artifact; `npm run check-tool-definitions-sync` is the verification).
- [ ] `npm run surface-budget -- --write`.
- [ ] `npm run validate -- --write-register`; confirm REQ-623–628 evidenced.
- [ ] CHANGELOG entry, dated 2026-11-08, matching the commit subject.
- [ ] `aar.md` written; ends `LOOP PAUSED` or `LOOP OPEN`.

## S8 — Verify and close (plan Phase 8)

- [ ] `npm run assemble && npm run check:fast` un-piped → `check:fast: PASS`.
- [ ] `npm run build-order` → 0 errors (fingerprints, markers, version sync).
- [ ] `HOLONOVEL_IMPL_STRICT=1 npm run validate` → pass.
- [ ] `npm run session:close` → one spec-increment commit.
