# Plan — Materialize adventure-module hazard annotations (ROADMAP item 2)

**Status:** draft for review · **Date:** 2026-11-07 · **Depth:** standard
(multi-file, reversible, no remote/destructive state)

## Done bar (this session)

**Done bar:** a module whose `@encounter`/`@trap` annotation declares the REQ-622
parameters materializes the target room's `annotations.encounter` /
`annotations.trap` through both `manage_world (action: convert)` and
`manage_adventure (action: load)`, and the reported linked-annotation counts become
non-zero; a prose-only or invalid annotation writes nothing and warns without
blocking the load; Appendix K documents the parameter clause and no longer calls the
annotations inert; `test-adventure`, `test-backfill`, and `test-starter-novel` pass;
`npm run check:fast` and `npm run check` are green on the assembled tree; the ROADMAP
item is removed and the newly found `@npc`/`@lore` gap is scheduled.

## Evidence (verified this session)

| Claim | Evidence | Class |
|---|---|---|
| The load path converts only the `## World` section and never reads annotations elsewhere | `holonovel/src/index.ts:9244-9256` | repo |
| `convertSource` swallows `@encounter`/`@trap` and writes no room annotation | probe run of `convertSource` (below); `holonovel/src/world/model.ts:368-382` | tool-output |
| Linked-annotation counts are declared, never incremented, and always reported as 0 | probe: `{"encounters":0,"npcs":0,"traps":0,"lore":0}`; `holonovel/src/world/model.ts:760,775`; `holonovel/src/index.ts:4894` | tool-output |
| `@npc` emits a false "resolved as linked annotation" warning | probe output; `holonovel/src/world/model.ts:375-379` | tool-output |
| The canonical target shape is the structured object the starter ships | `holonovel/content/torre-nosferatu.json`: `{"encounter":{"resource":"The Candle","spill":1}}`, `{"trap":{"avoid":0,"faces":8,"resource":"The Candle","snuff":"Dread"}}` | repo |
| The read path already accepts that shape and warns on malformed input | `holonovel/src/core/hazard.ts:64-130` | repo |
| REQ-622a/b already fire hazards on entry, so only the write side is missing | `holonovel/src/index.ts:3965-3972` | repo |
| Appendix K calls the annotations "inert reference data — the GM invokes them", contradicting REQ-079a/REQ-622 | `spec/appendices-reference.md:2531-2533` | repo |
| Appendix K's annotation format is prose-only, with no parameter grammar | `spec/appendices-reference.md:2517-2534,2587` | repo |
| REQ-079a's body is 792 chars against an 800 limit — no room for a new clause | measured from `spec/02-requirements.md:1936-1937` | tool-output |
| `annotations.encounter`/`trap` are already the resource-visible fields | `holonovel/src/core/state.ts:777`; `holonovel.md:3868` | repo |
| The adventure-load test does not cover annotations; the T244-labelled convert test asserts no counts | `holonovel/scripts/test-adventure.ts:247`; `holonovel/scripts/test-backfill.ts:364-371` | repo |
| REQ-079 is already bucket C, so the gap is invisible to the coverage audit | `spec/audit/req-coverage.md:62` | repo |
| The one shipped prose-only annotation fixture cannot break a gate when it starts warning | `holonovel/scripts/run_pattern_buffer.ts:184` (fixture) and `:458-461` (asserts only `loaded`/`rooms`) | repo |

Probe transcript (`npx tsx /tmp/opencode/probe-convert.ts`): a world source carrying
`@encounter(Hall of Statues) …`, `@trap(Entrance Chamber) …`, and `@npc(…)` returned
`annotations: {encounters:0, npcs:0, traps:0, lore:0}`, one warning for `@npc`, and
`{}` for every room's `annotations`.

## The design question this item actually contains

REQ-079a says a linked `@encounter`/`@trap` annotation SHALL be materialized as the
structured REQ-622 field, but the documented annotation format carries only prose
(`@trap(Entrance Chamber) Poison dart trap: DC 13 …`). `spill`, `resource`, `snuff`,
and `faces` cannot be derived from prose without inventing mechanics. So the item is
not only "emit the annotation from `convertSource`"; it needs a parameter grammar.

**Decision (recommended): a structured clause in the annotation line.**

```
@encounter(<Room Name>) spill=<n> resource="<countdown>" [avoid=<n>] — <prose>
@trap(<Room Name>) snuff="<countdown>" faces=<n> resource="<countdown>" [avoid=<n>] — <prose>
```

- Required keys are exactly REQ-622's fields; values may be quoted to carry spaces
  (`resource="The Candle"`); the optional prose follows an em dash or `--`.
- A clause missing a required key, or carrying a non-integer/empty value, is
  **malformed**: no write, one `[WARNING]` with the line number, load continues —
  the behavior REQ-622 already mandates for malformed annotations.
- An annotation with no clause at all (Appendix K's current example) is malformed
  hazard data for materialization purposes and warns; it remains readable prose.

Rejected alternatives:

- **Derive defaults** (`spill: 1`, `faces: 8`, first countdown as `resource`). This
  fabricates mechanics the module never declared; it would make an encounter fire on
  rooms whose author wrote only prose, and it violates the spec's no-invented-numbers
  posture.
- **JSON payload** (`@trap(Room) {"snuff":…}`). Unambiguous but hostile to read and
  edit in Markdown, and REQ-622's field names already are the vocabulary.
- **Put the grammar in REQ-079a.** The body is 792/800 chars; a clause would breach
  the validator's limit. The format belongs in Appendix K, which is the format
  reference, and REQ-622 already owns the malformed rule.

**Second decision: where annotations are read.** Appendix K's own example places
`@encounter`/`@trap` under `## Encounters` / `## Traps`, outside `## World`, while the
load passes only the `## World` block to `convertSource`. REQ-079a says the load
links *any* annotations. So the loader must scan the module body, not only the World
section.

## Scope

In: the materialization write path, the parameter grammar and its Appendix K
documentation, the reported counts, the malformed path, and the tests that assert
them.

Out (scheduled, not silently dropped): `@npc` and `@lore` mechanical linkage
(REQ-079a, Appendix K) — `@npc` currently emits a false success warning and creates
no NPC; T244's spec row already claims NPC creation. This plan fixes the warning text
to be truthful and adds a ROADMAP entry; it does not implement the linkage.
Also out: `manage_ruleset (action: search)` retrievability of annotations asserted by
T244, and any change to the hazard resolution rules (REQ-622a/b work already).

## Phases

### 1. Grammar and materializer (M)

- `holonovel/src/world/model.ts`
  - add `parseAnnotationClause(content: string): { params: Record<string,string>; prose: string; error?: string }` — split at the first `—`/`--`, tokenize `key=value` with quoted values, reject unknown keys for the category.
  - add `materializeAnnotation(category, target, content, world): { linked: boolean; warning?: string }` — resolve the room by case-insensitive name, validate against `EncounterAnnotation`/`TrapAnnotation`, write `room.annotations.encounter`/`.trap`; warn when the room is unknown, the category is unsupported, or the clause is malformed.
  - export `linkAnnotations(source: string, world: WorldModel): { counts; warnings }`; call it at the end of `convertSource` for its own input and increment `annotationCounts` on each successful write (`:760-775`).
  - make `splitStatements` (`:308-350`) keep an `@`-prefixed line whole: it currently splits on `. ` outside quotes, so a clause followed by prose would be truncated and the tail would warn as an unrecognized assertion. Appendix K already says each directive occupies one line; the parser should honor that.
  - replace the `@npc` "resolved as linked annotation" message with the truth ("indexed as guidance; NPC/lore linkage is not implemented").
- `holonovel/src/index.ts`
  - `manage_adventure (action: load)` (`:9244`): after `convertSource(worldMatch[1], …)`, call `linkAnnotations` on the module body **with the World block removed**, so annotations under `## Encounters`/`## Traps` reach the room and nothing is processed twice; append the linked counts and warnings to the `[OK]` text.
  - link against the surviving world in **all three** branches: the normal World branch, the REQ-090 empty-World branch that preserves the existing world (`:9246-9255`), and the no-World branch (`:9257-9263`). In the preserved/no-World cases a target that names an existing room materializes; an unknown target warns.
  - `manage_world (action: convert)` (`:4894`): the counts now reflect real writes; keep the message shape.

### 2. Spec — Appendix K (M)

`spec/appendices-reference.md:2517-2534`:

- add the parameter clause to the annotation format block, with both hazard examples;
- update the **format example** (`:2586-2597`): its `@encounter(Hall of Statues)` and
  `@trap(Entrance Chamber)` lines must carry clauses, because T244's row says to run
  `convert` on "the Appendix K fixture example" and assert linked annotation counts —
  with a prose-only example that assertion can never pass. Keep each directive on one
  line; the current `@npc`/`@lore` examples wrap across lines and contradict the
  "each directive occupies one line" rule above them, so unwrap them and note the rule;
- replace "are inert reference data — the GM invokes them …" with the REQ-622/REQ-079a behavior: a well-formed clause materializes a room hazard that fires on entry; a malformed clause warns and never blocks entry;
- state that annotations are read from anywhere in the module, not only `## World`;
- leave REQ-079a and REQ-622 bodies untouched (no headroom; behavior already normative).
- Then `npm run assemble`; `holonovel/holonovel.md` propagation and the CalVer/version advance come from `npm run build-order`.

### 3. Tests (M)

- `holonovel/scripts/test-adventure.ts`: a load case with `## World` + `## Encounters` + `## Traps` carrying clauses; assert the target rooms' `annotations.encounter`/`.trap` in the persisted Novel, non-zero result counts in the `[OK]` text, a prose-only `@trap` warning with no write, and that the load still succeeds.
- `holonovel/scripts/test-backfill.ts:364`: extend the convert case to assert a materialized annotation and a malformed-clause warning with a line number.
- Leave `test-starter-novel.ts` untouched as the regression that hazards still fire from already-structured annotations.

### 4. Close (S)

- `ROADMAP.md`: remove item 2; add the `@npc`/`@lore` linkage item (action + `**Trigger:**`).
- `CHANGELOG.md`: dated entry.
- `npm run build-order` (assemble, check, propagate, version sync, typecheck); `npm run validate -- --write-register` if the coverage-register text shifts; `npm run refresh-properties` for README `@spec:` markers.
- `docs/plans/2026-11-07-hazard-materialization/{plan,tasks,aar}.md`, then `npm run session:close` — **one commit** (spec increment stays atomic).

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/world/model.ts` | clause parser, materializer, counts, warning text | M |
| `holonovel/src/index.ts` | load-path annotation scan, convert message | S |
| `spec/appendices-reference.md` | Appendix K grammar and behavior | M |
| `holonovel.md`, `holonovel/holonovel.md` | assembled/propagated spec | L (generated) |
| `holonovel/scripts/test-adventure.ts` | load-path assertions | M |
| `holonovel/scripts/test-backfill.ts` | convert assertions | S |
| `ROADMAP.md` | remove item, add NPC/lore item | S |
| `CHANGELOG.md` | entry | S |
| `package.json`, `holonovel/package.json`, both lockfiles, `holonovel/server.json`, `holonovel/src/index.ts` version constant | version/spec-hash sync (CalVer is already today's date, so this is a sync, not an advance) | S |
| `README.md` | `@spec:` markers (the spec hash moves) | S |
| `spec/audit/req-coverage.md` | regenerate if the register text shifts (`validate -- --write-register`) | S |
| `docs/plans/2026-11-07-hazard-materialization/*` | increment | S |

Rollback cost: **1** (reversible edits; the generated spec and version files are
regenerated by `build-order`).

## Edge cases and rollback

| Case | Behavior |
|---|---|
| Annotation targets an unknown room | Warn with the line number; no write; load proceeds. |
| Clause missing a required key or carrying a non-integer | Warn; no write; load proceeds (REQ-622 malformed rule). |
| Annotations inside `## World` | Applied by `convertSource`; the loader's body scan excludes the World block so no duplicate warning. |
| Annotation prose contains sentence periods | `@` lines are atomic in `splitStatements`, so the clause and the prose survive intact; without that, the tail would warn as an unrecognized assertion. |
| Module's World section yields no rooms (REQ-090) | The preserved world is the link target; a target naming an existing room materializes, an unknown target warns, and the module still loads. |
| Same annotation twice | Last write wins; counts increment per successful write — acceptable, but the test should not depend on duplicates. |
| Room already carries a structured annotation from CRUD | Materialization overwrites it; document this in the Appendix K paragraph so it is not a surprise. |
| Existing modules with prose-only annotations | Load still succeeds; they now emit a warning where they were silent. Intended, and the reason the Appendix K text changes. |
| Self-reference: `resource` names a countdown that does not exist yet | Materialize anyway — REQ-622 reads the named resource at entry and warns; conversion cannot know the Novel's countdowns in `manage_world (action: convert)` (no Novel context). State this in Appendix K. |
| `build-order` propagates a stale spec | Re-run `npm run assemble && npm run build-order`; the pre-push hash check catches drift. |

## Verification

| Claim | Probe |
|---|---|
| Materialization works | `npm run --prefix holonovel test:adventure` and the new assertions in `test:backfill` |
| No regression in hazard firing | `npm run --prefix holonovel test:starter-novel` (T741) |
| Spec is valid after the Appendix K edit | `npm run assemble && npm run check:fast` (trailing `check:fast: PASS`) |
| T244's row is satisfiable | the Appendix K fixture example carries clauses, so `convert` on it reports non-zero linked counts (the `@npc` half of T244 stays scheduled) |
| Full gate | `npm run check` |
| Generated artifacts are in sync | `npm run build-order` (regenerates and verifies fingerprints, versions, propagation) |
| ROADMAP/register consistency | `npm run check-roadmap`, `npm run check-registers`, `npm run check-traceability` |

## Trust boundary

All premises are `repo` evidence or `tool-output` from this session; no web content and
no external instruction is consumed. Module content parsed at runtime is untrusted
input in the product sense, which is why every clause failure path is a warning rather
than an exception.

## Risks / unknowns / open questions

**Risks.** The Appendix K change adds a syntax authors must learn; the clause is
optional in the sense that omitting it keeps the module loadable, but it will warn.
Counts become non-zero for existing modules only after they adopt the clause, so the
roadmap's "counts but never writes" complaint disappears without claiming retroactive
materialization of prose.

**Unknowns.** (a) Whether the T244 row's `manage_ruleset (action: search)` assertion is
exercised anywhere today; if not, it stays out of scope and is noted in the AAR.
(b) Whether `manage_adventure (action: load)` has any non-test consumer that depends on
the exact `[OK]` string; the message gains the counts, so an exact-match consumer would
notice — no such consumer was found in `holonovel/src`, and the plan keeps the
`Adventure '<slug>' loaded. World model:` prefix intact.

**Open question.** Should the prose-only annotation warn, or stay silent (indexed as
guidance) with only the *clause-bearing* form attempting materialization? The plan
chooses warn, because silence is what allowed the gap to persist; flipping it is a
one-line change in `materializeAnnotation`.

## Amendment (execution)

- **Room resolution strips a leading article.** Appendix K targets objects the way
  prose names them (`@trap(Hall of Statues)`), while declarations commonly carry the
  article (`The Hall of Statues is a room.`). The materializer therefore compares on
  an article-free lowercase form (`annotationName`) rather than a bare lowercase
  key; the plan's "resolves the room by case-insensitive name" is the narrower
  statement of the same step. The Appendix K paragraph documents the rule.
- **Test fixture key.** The new adventure-load assertion reads the persisted room by
  its declared key (`the trap hall`, article included) after an initial run looked up
  `trap hall`; the fetch, not the code, was wrong.
