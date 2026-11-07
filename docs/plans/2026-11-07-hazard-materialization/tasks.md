# Tasks — hazard-annotation materialization

Session 2026-11-07. Plan: `plan.md` (stamped sha256 `2a95d4a8…`).
Ordered by dependency; each item's evidence is the command that proved it.

## Baseline (before the first edit)

- [x] `git status --porcelain` → clean.
- [x] `npm run test:adventure` → 15 passed, 0 failed.
- [x] `npm run test:backfill` → 76 passed, 0 failed.
- [x] `npm run test:starter-novel` → 15 passed, 0 failed.

## Materializer

- [x] `splitStatements` keeps an `@`-prefixed line whole (C-2).
- [x] `parseAnnotationClause` + `applyAnnotationLine` in `src/world/model.ts`;
      `annotationName` strips a leading article for room resolution.
- [x] `linkAnnotations` exported from `src/world/index.ts`.
- [x] `convertSource` collects directives and materializes them after the room pass;
      `annotationCounts` increments on each write.
- [x] `@npc`/`@lore` warning tells the truth (linkage not implemented).
- Evidence: probe → `{"encounters":1,"npcs":0,"traps":1,"lore":0}`, both room
  annotations present, malformed clause warned.

## Load path (C-3)

- [x] `manage_adventure (action: load)` links the module body outside `## World`.
- [x] Preserved-world (REQ-090) and no-World branches link against the surviving
      world.
- [x] `[OK]` text carries the linked counts and hazard warnings.
- Evidence: `npm run test:adventure` → 16 passed, 0 failed.

## Spec (C-1)

- [x] Appendix K: clause grammar, module-wide reading, materialization + entry
      firing, malformed rule, article rule.
- [x] Appendix K: "inert reference data" replaced; format example carries clauses;
      wrapped directives unwrapped.
- Evidence: `npm run assemble` → spec SHA-256 `f7cf5782…`.

## Tests

- [x] `test-adventure.ts`: load-path materialization + malformed warning.
- [x] `test-backfill.ts`: convert-path materialization + malformed warning.
- [x] `test-starter-novel.ts`: unchanged, still green (15 passed).

## Close

- [x] `npm run check:fast` → 36 passed, `check:fast: PASS`.
- [x] `npm run build-order` → 0 errors, propagate + version sync + typecheck OK.
- [x] ROADMAP: remove item 2, add the `@npc`/`@lore` item.
- [x] CHANGELOG entry.
- [x] Review register: hazard row → Resolved, `@npc`/`@lore` → Scheduled-roadmap.
- [x] AAR with a terminal LOOP token.
- [ ] `npm run session:close` (one atomic spec increment; no push).
