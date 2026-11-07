# Tasks — Materialize lore `visibility`

Session 2026-11-07. Plan: `plan.md`. Ordered by dependency; each item's
evidence is the command that proved it.

## Baseline (before the first edit)

- [x] `git status --porcelain` → clean.
- [x] `npm run assemble` → exit 0.
- [x] `npm run check:fast` → 36 passed, 0 failed, `check:fast: PASS`.
- [x] `npm run check-registers` → PASS (16 grandfathered findings).
- [x] `npm run check-roadmap` → OK.
- [x] `cd holonovel && npm run test:output-contracts` → 321 passed, 0 failed.
- [x] `cd holonovel && npm run test:persistence` → 41 passed, 0 failed.

## State shape (P1 — plan D3)

- [x] `LoreVisibility` type and `visibility`/`known_by` fields on `LoreEntry`.
- [x] `migrateNovelData` sets `visibility ?? "gm_only"` and `known_by ?? []`.
- [x] Probe: legacy Novel JSON saves with both fields.
- Evidence: two-process tsx probe →
      `{"...","visibility":"gm_only","known_by":[]}` from both the save and
      reload processes.

## Lifecycle (P2 — plan D2/D5/D7)

- [x] `MANAGE_LORE_SCHEMA.visibility` enum.
- [x] `set` defaults/preserves; `update` assigns; `known_by` initialized at
      every creation site.
- [x] `reveal` lore branch sets `player_discovered` and appends the entity.
- [x] `export`/`import` carry `visibility` and `known_by`.
- [x] Tool description names the read gate (trimmed to the 1000-byte budget).
- Evidence: `npx tsc --noEmit` → exit 0; T342 → 338 passed.

## Read gate (P3 — plan D1/D4/D6)

- [x] `loreVisible` and `lorePresenceSatisfied` helpers.
- [x] `composeKnowledgeState` shared + player_discovered loops.
- [x] `manage_lore list/get`, `lore://active`, `lore://{key}` list/read,
      `graph://novel`, narrator clearance, player-safe export, campaign tier,
      index/graph scopes, draft-scan targets.
- [x] Triggered Lore: visibility + presence gate for non-GM.
- Evidence: `test:output-contracts` 338 passed; `test:briefing` 14 passed;
      `test:graph` 5 passed; `test:security` 12 passed.

## Creation sites (P4 — plan D2)

- [x] `@lore` → `shared`; story-promote, complication, character-book, codex,
      and `set` default → `gm_only`.
- Evidence: `npx tsc --noEmit` → exit 0; `test:adventure` 19 passed.

## Tests (P5)

- [x] T342 in `test-output-contracts.ts`: lifecycle, visibility read gate on
      briefing/list/get/resources/graph, reveal, and presence gate.
- [x] T693 fixture carries `visibility: "shared"`.
- Evidence: `test:output-contracts` → 338 passed, 0 failed (was 321);
      `test:persistence` → 41 passed, 0 failed.

## Spec (P6 — plan D9)

- [x] T342 row extended.
- [x] T67/T400/T438 add `visibility="shared"`.
- [x] Appendix L adds `visibility` and `known_by`.
- Evidence: `npm run assemble` → spec SHA-256 `6f16945a…`;
      build-phase-map hash refreshed.

## Registers/docs (P7)

- [x] ROADMAP item removed.
- [x] Review-register row moved to Resolved with a dated predicate.
- [x] DECISIONS entry (D1–D4) and re-baselined token counts.
- [x] Coverage register and `tool-definitions.json` regenerated.
- [x] Surface baseline re-recorded (`surface-budget --write`).
- [x] CHANGELOG entry.
- Evidence: `validate -- --write-register` → T342 bound to REQ-083/REQ-307;
      `tool-definitions-lint` → PASS (37 tools, 0 violations);
      `surface-budget` → PASS after the DECISIONS token update.

## Plan delta (amendment)

- [x] The approved plan's blast-radius table omitted the generated
      `spec/audit/tool-surface-baseline.json` and `spec/build-phase-map.md`.
      Added both, re-stamped the plan (`1a7f58d5…`), and re-ran preflight
      (0 unknowns). No scope change; only the generated-artifact list.

## Close (P8)

- [x] `npm run assemble && npm run check:fast` → 36 passed, `check:fast: PASS`.
- [x] `npm run build-order` → exit 0; 0 errors; propagate/typecheck/version OK.
- [x] `npm run check` → `check: PASS` (proofreading warnings unchanged).
- [x] `aar.md` with a terminal LOOP token.
- [x] `npm run session:close` (one atomic increment; no push).
