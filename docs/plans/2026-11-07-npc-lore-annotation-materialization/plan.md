# Plan — Materialize adventure-module `@npc` and `@lore` annotations (REQ-079a)

Session 2026-11-07. Roadmap item: "Materialize adventure-module `@npc` and
`@lore` annotations (REQ-079a)" — `ROADMAP.md:29-37`.

## Questions

- The user asked: "draft plan for next item on roadmap."
- Which roadmap item is actionable in-session, and what is the smallest change
  that closes its trigger?

## Baseline (measured this session)

- `git status --porcelain` → clean; 7 unpushed commits; last publish "never
  recorded" (`npm run status`).
- `npm run assemble && npm run check:fast` → 36 passed, 0 failed,
  `check:fast: PASS`.
- Roadmap selection: item 1 ("Rehearse the `next` publication engine on a real
  publish", `ROADMAP.md:15-27`) is **trigger-gated** — its trigger is an actual
  publish, which a plan cannot produce and which needs explicit publish
  authorization. Item 2 is the next actionable deliverable.

## Why

The loader indexes `@npc`/`@lore` as guidance only: it creates neither the named
Novel NPC nor the lore entry, while Appendix K and T244 state both. The hazard
half of REQ-079a shipped in the previous increment; this closes the remaining
half.

| Claim | Evidence |
|---|---|
| `@npc`/`@lore` are warned away, not materialized | `holonovel/src/world/model.ts:439-443` |
| Hazards materialize in one place | `holonovel/src/world/model.ts:426-492`, `:912-918` |
| `linkAnnotations` returns counts + warnings only | `holonovel/src/world/model.ts:494-511` |
| `ConvertResult` carries hazard counts + warnings | `holonovel/src/world/model.ts:300-306` |
| Convert handler prints counts, ignores state directives | `holonovel/src/index.ts:4881-4898` |
| Load handler links three branches, saves before the message | `holonovel/src/index.ts:9244-9285` (saves at `:9262`, `:9272`, `:9283`) |
| NPC shape and create-time coupling | `holonovel/src/core/state.ts:127-157`; `holonovel/src/index.ts:5913-5957` |
| Lore shape and set-time defaults | `holonovel/src/core/state.ts:160-174`; `holonovel/src/index.ts:6302-6325` |
| Cardinality guard is module-scope | `holonovel/src/index.ts:2375-2381`; `holonovel/src/core/limits.ts:42-47` |
| Contract: `@npc(Name, Room)` and `@lore(Target)` create Novel state | `spec/appendices-reference.md:2517-2551`, `:2595-2611` |
| Test row that asserts both | `spec/appendices-reference.md:1665` (T244) |
| Normative requirement | `spec/02-requirements.md:1936-1937` (REQ-079a), `:1945-1946` (REQ-079d), `:1954-1955` (REQ-079g) |
| Existing tests to extend | `holonovel/scripts/test-adventure.ts:260-288`; `holonovel/scripts/test-backfill.ts:373-383` |
| Finding to resolve | `spec/audit/review-register.md` § Scheduled-roadmap, `@npc`/`@lore` row |

## Scope

**In scope**

1. `@npc(<Name>, <Room Name>) <stat block summary>` creates a Novel-scoped NPC
   (`name`, `description`, `location`, `room_id` when the room resolves).
2. `@lore(<Object or Room Name>) <lore content>` creates a Novel-scoped lore
   entry with a deterministic key, `triggers`, and `world_target` when the
   target resolves.
3. Both directives work on the two paths that already materialize hazards:
   `manage_world (action: convert)` and `manage_adventure (action: load)`
   (World-section, preserved-world, and no-World branches).
4. Duplicate names skip with a note (REQ-079d); the group cap skips with a
   warning (REQ-129b1); malformed directives warn without blocking the load.
5. Response counts report what was actually materialized.
6. Tests for the load path and the convert path, citing T244 / REQ-079a.
7. Appendix K clarified where it is silent (lore target resolution, duplicate
   and cap behavior).

**Out of scope** (recorded, not scheduled — no regression, coverage unchanged)

- REQ-079d's ruleset-monster fuzzy-match suggestion at load time (needs ruleset
  hydration inside the loader).
- REQ-079f/REQ-084 `visibility` (`gm_only`/`shared`/`player_discovered`) — the
  field is absent from `LoreEntry`; entries carry `badge_scope` only.
- Switching adventures removing annotations created by a previous load
  (REQ-079i) — current switching already retains Novel NPCs.

## Decisions

- **D1 — State writes do not enter the world layer.** `src/world/model.ts`
  stays pure and world-scoped: it *parses* `@npc`/`@lore` into deferred
  directives, and the adapter writes Novel state. This keeps the layer map
  (world → core → adapter) intact and lets `test-hazard.ts` assert parsing
  without a Novel.
- **D2 — Deferred directives, not a callback.** `linkAnnotations` returns
  `directives`; `convertSource` surfaces them in `ConvertResult`. A sink
  callback would pull Novel-shaped arguments into `model.ts`.
- **D3 — One materializer, module scope.** `materializeAnnotations(novel,
  directives, slug)` beside `capGuard` in `src/index.ts`, so it can call
  `capGuard` and reuse the mutate/record/audit idiom. No per-object audit
  entry: the existing `load_adventure` / `convert_source` audit event gains the
  `npcs`/`lore` counts, mirroring how hazards are audited.
- **D4 — Hazard counts stay where they are.** `AnnotationCounts.npcs/lore`
  stay at 0 from the parser; the materializer owns those counts and the
  response adds them. No double counting.
- **D5 — Duplicate rule is name-based and case-insensitive** (article-free for
  NPCs, mirroring `annotationName`): an existing NPC with the same name or an
  existing lore key is skipped with a `[WARNING] ... skipped (duplicate)` note,
  not an error (REQ-079d).
- **D6 — Deterministic lore key** = the target's `annotationName` with
  non-alphanumerics collapsed to `_` (e.g. `entrance_chamber`). No timestamps,
  so a second load skips instead of duplicating.
- **D7 — Lore scope is `shared`.** Appendix K frames `@lore` as content the
  player reaches by entering or examining the target; `gm_only` is obtainable
  via `manage_lore (action: update)`. Flagged in Open questions.
- **D8 — Unresolved targets are not fatal.** An `@npc` room that does not
  resolve leaves a free-text `location` (legal per `NpcState`, and the normal
  case for a REQ-079b module). An `@lore` target that resolves to neither room
  nor thing creates the entry without `world_target` and warns — prose is kept,
  because dropping it loses module content.

## Contract changes

```ts
// src/world/model.ts
export interface AnnotationDirective {
  category: "npc" | "lore";
  target: string;      // raw parenthesized target: "Name, Room" | "Object or Room"
  content: string;     // prose after the clause
  line: number;
}
export function linkAnnotations(
  source: string,
  world: WorldModel,
): { counts: AnnotationCounts; warnings: AnnotationWarning[]; directives: AnnotationDirective[] };

export interface ConvertResult {
  // ...existing fields
  directives: AnnotationDirective[];
}
```

```ts
// src/index.ts (module scope, beside capGuard)
function materializeAnnotations(
  novel: NovelState,
  directives: AnnotationDirective[],
  slug: string | null,
): { counts: { npcs: number; lore: number }; warnings: string[] };
```

`AnnotationDirective` is also re-exported from `src/world/index.ts` (the world
namespace's type block) so the world surface stays complete. Both additions are
additive; `convertSource`/`linkAnnotations` are public (`src/index.ts:50-55`),
and no caller destructures exhaustively.

## Phases

1. **Parser** — replace the `@npc`/`@lore` warning with a deferred directive;
   thread `directives` through `linkAnnotations` and `convertSource`.
2. **Materializer** — `materializeAnnotations`: split `@npc` on the comma,
   resolve the room (`annotationName`), write the NPC (`location`, `room_id`,
   `description`, `provenance.source = loaded:<slug>` when a slug is known);
   slug the `@lore` target, resolve room/thing for `world_target`, write the
   entry (`triggers: [target]`, `badge_scope: "shared"`, priority 0, enabled).
   Cap and duplicate checks per D5/D6.
3. **Wiring** — convert handler materializes after `novel.world = world`; load
   handler materializes once per branch after the world is final and before the
   save, merging directives from `convertSource` and the follow-up
   `linkAnnotations`. Response text adds the state counts and the skip
   warnings. Undo coverage is unchanged: `worldSnapshot()` is
   `novelSnapshot()` (`src/index.ts:2624-2626`), so the convert path already
   snapshots the whole Novel; the load path has no snapshot today.
4. **Tests** — extend `test-adventure.ts` and `test-backfill.ts` (T244).
5. **Spec** — Appendix K: `@lore` resolution rule, duplicate/cap behavior,
   default badge scope. No REQ text changes; new prose stays inside
   markdownlint's 120-column limit.
6. **Close** — remove the ROADMAP item, move the register row to Resolved,
   CHANGELOG, assemble, gates, AAR, commit.

## Blast radius

- `holonovel/src/world/model.ts` — directive type, parser branch, two return
  shapes. (S/M)
- `holonovel/src/world/index.ts` — type re-export. (S)
- `holonovel/src/index.ts` — materializer, two handlers, response text. (M)
- `holonovel/scripts/test-adventure.ts`, `holonovel/scripts/test-backfill.ts`.
  (S each)
- `spec/appendices-reference.md` — Appendix K clarification (assemble
  regenerates `holonovel.md`, `holonovel/holonovel.md`). (S)
- `ROADMAP.md`, `spec/audit/review-register.md`, `CHANGELOG.md`,
  `docs/plans/2026-11-07-npc-lore-annotation-materialization/`. (S)

State shape changes are additive (`npcs`/`lore` maps already exist) — no save
migration. Rollback cost: 1 (reversible edit, no migration, no external
state).

## Verification

1. `cd holonovel && npm run test:adventure` → all pass, new T244 assertions.
2. `cd holonovel && npm run test:backfill` → all pass (convert path).
3. `cd holonovel && npm run test:starter-novel` → unchanged.
4. `npm run assemble && npm run check:fast` → `check:fast: PASS` (un-piped).
5. `npm run build-order` → 0 errors, fingerprints current.
6. Probe: load the Appendix K fixture into a scratch data dir, read the
   persisted Novel JSON, assert `npcs` and `lore` entries and the response
   counts.

## Done bar

**Done bar:** T244's `@npc`/`@lore` assertions pass on both the load and convert
paths (NPC in the named room, lore entry with triggers), duplicates and caps
skip with a note, the loader no longer claims linkage is unimplemented,
`assemble && check:fast` and `build-order` are green, and the ROADMAP item, the
register row, the CHANGELOG entry, and the AAR are updated in one commit.

## Risks and rollback

- **Risk:** a second load in the same Novel silently duplicates state.
  Mitigated by D5/D6 and an explicit test.
- **Risk:** `shared` lore leaks GM material. Mitigated by D7 being flagged and
  by `manage_lore (action: update)`; restore `gm_only` if the maintainer says
  so.
- **Risk:** response-count drift between branches. Mitigated by one materializer
  and one count merge.
- **Rollback:** revert the commit; no persisted-shape change, no migration.

## Open questions (resolved at execution)

1. **Lore badge scope (D7).** Resolved by the maintainer: `shared`.
2. **NPC provenance marker.** Resolved by the maintainer: include
   `provenance.source = loaded:<slug>` when a slug is known.

## Execution note

- The lore key follows `annotationName`, so "The Vault" keys as `vault` (D6);
  the first test run asserted `the_vault` and was corrected — no code change.
- The AAR found REQ-083d–REQ-083f (lore `visibility`) unimplemented and
  unscheduled; it is scheduled on ROADMAP and in the register in this
  increment.
