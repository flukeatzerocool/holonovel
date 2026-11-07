# Tasks — `@npc`/`@lore` annotation materialization

Session 2026-11-07. Plan: `plan.md`. Ordered by dependency; each item's evidence
is the command that proved it.

## Baseline (before the first edit)

- [x] `git status --porcelain` → clean apart from the drafted artifacts.
- [x] `npm run test:adventure` → 16 passed, 0 failed.
- [x] `npm run test:backfill` → 77 passed, 0 failed.
- [x] `npm run test:starter-novel` → 15 passed, 0 failed.
- [x] `npm run check-registers` → PASS (16 grandfathered findings).

## Parser (P1 — plan D1/D2/D4)

- [x] `AnnotationDirective` interface in `src/world/model.ts`.
- [x] `applyAnnotationLine` returns a deferred `directive` for `@npc`/`@lore`
      instead of the "mechanical linkage is not implemented" warning; a
      malformed `@npc` warns and an empty prose body is legal.
- [x] `linkAnnotations` collects directives; `AnnotationCounts.npcs/lore` stay 0.
- [x] `ConvertResult.directives` added; `convertSource` forwards the collected
      directives.
- [x] `annotationName` exported; `AnnotationDirective` added to the
      `src/world/index.ts` type block.
- Evidence: probe →
      `{"counts":{"encounters":0,"npcs":0,"traps":0,"lore":0},"directives":[{"category":"npc","target":"Ghost, The Vault","content":"AC 15, HP 45.","line":2},{"category":"lore",...}],"warnings":["TTRPG annotation '@npc(Broken)': expected '<Name>, <Room Name>' ..."]}`
      · `npx tsc --noEmit` → exit 0.

## Materializer (P2 — plan D3/D5/D6/D8)

- [x] `materializeAnnotations(novel, directives, slug)` in `src/index.ts` beside
      `capGuard`.
- [x] `@npc`: split target on the first comma; `name`, `description` (omitted
      when empty), `location`; `room_id` when `annotationName` resolves a room;
      `conditions: []`, `condition_rounds: {}`; `provenance.source` when a slug
      is known (maintainer-confirmed).
- [x] `@lore`: article-free key, `content`, trigger keyword, `priority: 0`,
      `sticky: 0`, `enabled: true`, `badge_scope: "shared"`
      (maintainer-confirmed); `world_target` when the target resolves to a room
      or thing, else warn and keep the entry.
- [x] Duplicate skip (case-insensitive name / existing key) and `capRefusal`
      skip produce `[WARNING]` notes, never a failed load.
- [x] No new snapshot call and no per-object audit: the
      `convert_source` / `load_adventure` audit event carries the `npcs`/`lore`
      counts.

## Wiring (P3)

- [x] `manage_world (action: convert)` materializes before `state.saveNovel`
      and reports the NPC/lore counts and skip warnings.
- [x] `manage_adventure (action: load)` materializes once per branch from
      `convertSource` plus the follow-up `linkAnnotations`, saving after the
      write; preserved-world (REQ-090) and no-World (REQ-079b) branches share
      the path; `target: "codex"` is untouched.
- [x] Response counts come from the materializer, not the parser.

## Tests (P4 — T244 / REQ-079a)

- [x] `test-adventure.ts`: create, provenance, room coupling, description, lore
      key/trigger/`world_target`/`badge_scope`, and the malformed `@npc` warning.
- [x] `test-adventure.ts`: repeated load skips both with a duplicate note and
      creates no state.
- [x] `test-adventure.ts`: unresolved targets create free-text state without
      `room_id`/`world_target` (no-World branch).
- [x] `test-backfill.ts`: convert path creates the NPC and lore entry (T244).
- Evidence: `test:adventure` → 19 passed, 0 failed (was 16);
      `test:backfill` → 78 passed, 0 failed (was 77). First run failed on the
      article-stripped lore key (`vault`, not `the_vault`) — test expectation
      corrected, no code change.

## Spec (P5)

- [x] Appendix K: `@npc` room resolution, description; `@lore` article-free key,
      trigger, `world_target` resolution, unresolved-target rule, default
      visibility, duplicate/cap behavior (REQ-079d/REQ-129b1/REQ-328).
- [x] No REQ text change — REQ-079a/079d/079g already state the contract.
- Evidence: `npm run assemble` → spec SHA-256
      `98e9fa47…`; build-phase-map hash refreshed.

## Close (P6)

- [x] `npm run assemble && npm run check:fast` → 36 passed, `check:fast: PASS`.
- [x] `npm run build-order` → 0 errors; propagate, version sync, typecheck OK.
- [x] ROADMAP: `@npc`/`@lore` item removed; REQ-083d–REQ-083f item added from
      the AAR finding.
- [x] Review register: `@npc`/`@lore` row → Resolved; lore `visibility` row →
      Scheduled-roadmap.
- [x] CHANGELOG entry dated 2026-11-07.
- [x] `aar.md` with a terminal LOOP token.
- [x] `npm run session:close` (one atomic spec increment; no push).
