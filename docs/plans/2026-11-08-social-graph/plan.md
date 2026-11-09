# Plan — Social graph resolution, surface, and Torre cast links

Session 2026-11-08. Base HEAD `76f8706`. The working tree already carries this
session's cast, subjective-memory, and secret-trigger content changes; this
increment lands on top of them. Plan revision 1.

## Done bar

**Done bar:** a relationship written with a display name and the same
relationship written with an id resolve to the same edge in
`manage_relationship (action: get)`, the `badge_briefing` knowledge state,
`manage_character (action: sheet)`, and `run_command (action: suggest)`;
`manage_relationship (action: set)` updates by canonical pair rather than
appending a second row; `graph://novel` and `manage_knowledge (action:
graph_*)` derive relationship edges for character, NPC, and faction pairs and
location edges from name-keyed rooms; the Torre source carries the eight
missing cast pairs, six faction links, and no canonical duplicate;
`test:narrative`, `test:graph`, `test:starter-novel`, `test:output-contracts`,
`test:belief`, `test:tool-definitions`, and `typecheck` pass; root
`check:fast` passes 37/37 un-piped; the increment lands with plan/tasks/AAR and
a terminal LOOP token; nothing is pushed.

## Baseline (measured this session)

- `git rev-parse --short HEAD` → `76f8706`.
- `git status --porcelain` → the two Torre content files modified by the cast,
  subjective-memory, and secret-trigger work. No engine files touched yet.
- `npm run check:fast` (last un-piped run) → **PASS**, 37 passed, 0 failed.
- `cd holonovel && npm run test:starter-novel` → 15 passed, 0 failed.
- Source shape: 94 rooms, 32 things, 19 lore entries, 6 NPCs, 3 secrets,
  17 relationship rows, 1 faction.
- The live save (`.holonovel-state/torre/novels/torre-nosferatu.json`) carries
  the same 17 rows, including the duplicate.

## Findings (with the predicate each rests on)

| ID | Severity | Finding | Predicate |
|---|---|---|---|
| SG-1 | Major | The Player/GM knowledge state never shows a relationship for `character_01`. | `composeKnowledgeState` compares `r.entity_a === activeId` / `r.entity_b === activeId`, and `activeId` is `character_01`; rows are keyed `"You"`, `"Vlask"`, etc. `holonovel/src/index.ts:866-867`. |
| SG-2 | Major | `manage_relationship (action: get)` misses an edge addressed by the other key form. | It compares raw `entity_a`/`entity_b`; `get("Vlask")` does not match `npc_mv4m1599`, and `get("npc_mv4m1599")` does not match `"Vlask"`. `holonovel/src/index.ts:6963-6965`. |
| SG-3 | Major | `manage_relationship (action: set)` duplicates an existing pair when the second call uses an id. | It dedupes by exact string pair only. `holonovel/src/index.ts:6947`. This is why row 14 (`npc_mv4m1599 -> npc_mv4m18a8`) duplicates row 10 (`Vlask -> Nadja`). |
| SG-4 | Major | `manage_character (action: sheet)` has no Relationships section, contrary to REQ-236a. | The sheet handler calls `fmtEntitySheet` / `entitySheetJson`, neither of which reads `novel.relationships`. `holonovel/src/index.ts:3867-3878`, `:3104-3114`, `:2957`. |
| SG-5 | Major | `run_command (action: suggest)` omits every relationship for the active entity. | The suggest loop compares `r.entity_a === entity?.id`; rows use display names. `holonovel/src/index.ts:4392-4396`. |
| SG-6 | Major | The knowledge graph derives no Torre relationship or location edges. | `gatherGraphSources` passes raw names; `projectGraph` only accepts character ids for relationship edges (`holonovel/src/core/graph.ts:83-87`); room keys are lowercase while `current_room`/`location` are capitalized (`:89-95`). |
| SG-7 | Minor | The source carries an id-keyed duplicate relationship. | Row 14 is `npc_mv4m1599 -> npc_mv4m18a8 rival -1`; row 10 is `Vlask -> Nadja suspicious -1` (same ordered pair, different type). |
| SG-8 | Minor | The `graph-limitations` note says relationship edges are unwired. | `notes[graph-limitations]` (source key) describes 0 edges; the fixed build derives them. |
| SG-9 | Minor | REQ-236b's relationship-change marker and P48's relationship-to-disposition coupling are not implemented in this build. Pre-existing; this increment does not remove either because neither exists. | No writer emits the marker and no `set` consumer shifts disposition. `holonovel/src/index.ts:6947-6965`; the only `shiftDisposition` call at `:6459` is countdown-driven. Record for the next review; not a regression. |

## Decisions

- **D1 — Names and ids are equivalent on read.** A stored token resolves to a
  party by id or display name, case-insensitively, in this order: Novel
  entities, NPCs, factions. Storage stays as supplied, so existing saves load
  unchanged. Display always resolves to the party's display name. Rejected:
  rewriting every row to ids on load (a silent mutation, and the Player would
  see ids if a name is missing).
- **D2 — Dedupe by canonical ordered pair.** `set` compares resolved ids for
  the ordered `(entity_a, entity_b)` pair; a read-side dedupe keeps the first
  row so an existing save with the id duplicate does not render twice.
  Rejected: a one-time migration (the live save is outside the source).
- **D3 — Graph edges cover every party pair.** The `relates_to` edge derives
  when both endpoints resolve to a character, NPC, or faction node. REQ-512's
  "including relationship edges between characters" is a non-exhaustive
  minimum; extending to NPC and faction pairs needs no spec amendment.
  Rejected: character-only edges (the Torre graph would stay empty).
- **D4 — Room lookup is case-insensitive by name.** `gatherGraphSources`
  resolves `current_room`, `location`/`room_id`, and faction `territory` to the
  canonical room key before the graph sees them. Rejected: lowercasing every
  exterior key at projection time (would mask a real mismatch).
- **D5 — No new REQ, T id, or gate.** The fix brings REQ-236a, REQ-286, and
  REQ-512 into conformance and extends existing harnesses. No fingerprint
  section is edited. Rejected: a dedicated relationship harness (duplicates
  `test-narrative.ts` and adds a gate-manifest row for no new finding class).
- **D6 — Content keeps display names.** The eight missing pairs and six
  faction links are authored with names, matching the existing rows; the
  resolver makes them addressable by id. The id duplicate is removed.
- **D7 — The Player-facing surface is the knowledge state and sheet; the GM
  graph is the full social graph.** NPC and faction nodes are GM-scope, so a
  Player graph read remains scope-filtered by REQ-514. No scope change.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/relationships.ts` | New pure resolver/dedupe/line helpers | M |
| `holonovel/src/index.ts` | Import + knowledge state, get/set, sheet, suggest call sites | M |
| `holonovel/src/core/graph.ts` | Party-node resolver; accept NPC/faction relationship edges | M |
| `holonovel/content/torre-nosferatu.source.json` | Remove duplicate; add 8 pairs + 6 faction links; refresh the graph note | M |
| `holonovel/content/torre-nosferatu.json` | Rebuild via `npm run build:starter-novel` | S |
| `holonovel/scripts/test-narrative.ts` | Name/id resolution, sheet, briefing, dedupe test | M |
| `holonovel/scripts/test-graph.ts` | Character-NPC and NPC/faction edges; case-insensitive location | S |
| `holonovel/scripts/test-starter-novel.ts` | Source integrity: 30 rows, no canonical duplicate, all endpoints resolve | S |
| `holonovel/DECISIONS.md` | Dated relationship-resolution decision | S |
| `CHANGELOG.md` | Dated entry for the increment | S |
| `docs/plans/2026-11-08-social-graph/plan.md` | This plan | S |
| `docs/plans/2026-11-08-social-graph/tasks.md` | Ordered checklist | S |
| `docs/plans/2026-11-08-social-graph/aar.md` | Post-execution AAR with LOOP token | S |
| `spec/audit/req-coverage.md` | Conditional: regenerate only if the coverage audit shifts | S |

## Implementation steps

### 1. New resolver — `holonovel/src/core/relationships.ts`

Add a pure module (type-only import of `NovelState` from `./state.js`):

- `RelationshipParty { id: string; name: string }`.
- `resolveRelationshipParty(novel, token): RelationshipParty | null` — trim and
  case-fold; check `novel.entities`, then `novel.npcs`, then `novel.factions`
  by id or name.
- `relationshipParty(novel, token)` — the resolved party or a raw fallback
  `{ id: token, name: token }`.
- `relationshipEndpoints(novel, rel)` — resolved `{ a, b }`.
- `relationshipPairKey(novel, rel)` — ordered canonical ids, or normalized raw
  tokens when either end is unresolved.
- `isRelationshipInvolving(novel, rel, token)` — compare the resolved target id
  to either endpoint; fall back to case-insensitive raw match for fixtures such
  as `"a"`/`"b"` that are not registered parties.
- `dedupeRelationships(novel)` — first row per pair key.
- `relationshipLines(novel, token)` — `A -> B (type)` display lines from the
  deduped rows involving `token`.

### 2. Rewire the index call sites — `holonovel/src/index.ts`

- Import the helpers.
- `composeKnowledgeState`: iterate `dedupeRelationships(novel)`; filter with
  `isRelationshipInvolving(novel, r, activeId)`; render
  `Relationship: ${a.name} -> ${b.name} (${r.type})`.
- `manage_relationship` `get`: resolve `args.entity_id`; return outgoing rows
  whose `relationshipEndpoints(...).a` matches the target id and incoming rows
  whose `b` matches; fall back to raw exact matching when the token does not
  resolve.
- `manage_relationship` `set`: find the existing row by canonical
  `relationshipPairKey` (ordered) instead of exact strings; update it in place.
  Keep the supplied tokens on insert.
- `manage_character` `sheet`: build the sheet text, then append
  `### Relationships` with `relationshipLines(novel, entity.id ?? entity.name)`
  when non-empty; apply the same section to the html render; add
  `relationships: relationshipLines(...)` to the JSON object; append
  `Relations: N` to the ascii line.
- `run_command` `suggest`: replace the raw id comparison with
  `isRelationshipInvolving` and render the other party's display name.
- Tool descriptions are unchanged, so `check-tool-definitions-sync` and
  `tool-definitions-lint` are not triggered.

### 2a. Sibling-contract check

Grep `REQ-236` in `holonovel.md` and confirm the contracts this change
touches: REQ-236a's sheet section (implemented here); REQ-359's
relationship-countdown advisory (the `set` path still writes `type`, and the
advisory reads the row); and REQ-236b's marker plus P48's disposition
coupling, which are **not implemented in this build**. Record the marker and
P48 as a pre-existing gap in the AAR, not a regression. No sibling REQ binds a
different `get`/`set` contract.

### 3. Knowledge graph — `holonovel/src/core/graph.ts`

- `projectGraph`: replace `characterIds.has(...)` with a `partyNode(id)` helper
  that maps a resolved id to `character:`, `npc:`, or `faction:` when that node
  exists; push `relates_to` when both ends resolve.
- `gatherGraphSources` (`index.ts`): resolve each relationship endpoint through
  `resolveRelationshipParty` and emit the canonical id (fallback raw);
  resolve `current_room`, NPC `location`/`room_id`, and faction `territory` to
  the canonical room key with a case-insensitive name lookup.
- `fingerprintGraph` keeps its shape; the values become canonical.

### 4. Content — `holonovel/content/torre-nosferatu.source.json`

- Remove the id-keyed row 14 (`npc_mv4m1599 -> npc_mv4m18a8`), which
  duplicates the ordered pair of row 10 (`Vlask -> Nadja`).
- Add the eight missing pairs (exact rows in `tasks.md`): Vlask-Marta,
  Vlask-Ilona, Vlask-Orlok, Marta-Petr, Marta-Nadja, Marta-Orlok, Ilona-Nadja,
  Petr-Nadja.
- Add six faction links: the five survivors `-> The Survivors` (`neutral`),
  and `Count Orlok -> The Survivors` (`rival`, "not a member").
- Refresh the `graph-limitations` note: relationship and case-insensitive
  location edges now derive; keep the semantic-index and secret-reveal limits.
- Rebuild the artifact and run the freshness gate.

### 5. Tests

- `test-narrative.ts`: a new block creates a character and an NPC, sets the
  edge by display name, reads it back by character id, asserts the sheet text
  contains `### Relationships` and the other party's name, asserts the GM
  briefing contains the relationship line, sets the reverse edge by NPC id,
  and asserts a second `set` by id does not append a duplicate.
- `test-graph.ts` T602: add a character-NPC edge and an NPC-NPC edge; add an
  NPC whose `location` is `"Hall"` against a room keyed `"hall"` and assert the
  `located_in` edge. Keep the existing character-character assertion.
- `test-starter-novel.ts`: assert 30 relationship rows, no canonical duplicate,
  every endpoint resolves to an entity/NPC/faction, the eight named pairs are
  present, and the six faction links are present.

### 6. Registers and artifacts

- Add a `holonovel/DECISIONS.md` entry under `### Relationship resolution —
  2026-11-08` recording D1-D4 and the rejected alternatives.
- Add a `CHANGELOG.md` entry under the current dated heading.
- Write `tasks.md` before execution and `aar.md` after; the AAR ends with
  `LOOP PAUSED` or `LOOP OPEN`.
- If `npm run validate -- --write-register` changes
  `spec/audit/req-coverage.md`, include that diff; otherwise leave it untouched.

## Verification

Run in this order; capture each exit code un-piped:

1. `cd holonovel && npm run typecheck`
2. `cd holonovel && npm run test:narrative`
3. `cd holonovel && npm run test:graph`
4. `cd holonovel && npm run test:starter-novel`
5. `cd holonovel && npm run test:output-contracts`
6. `cd holonovel && npm run test:belief`
7. `cd holonovel && npm run test:tool-definitions`
8. `cd holonovel && npm run build:starter-novel && npm run check:starter-freshness`
9. `npm run check:fast` (root, un-piped)
10. `npm run check:conformance`
11. Manual render probe: a GM briefing at `Third Floor — Social Hall` shows
    Vlask's links; the Player sheet for `character_01` shows its relationships;
    `manage_knowledge (action: graph_get)` shows `relates_to` edges for
    character/NPC/faction pairs.

The done bar is the un-piped `check:fast: PASS` line plus the targeted test
totals, not a piped tail.

## User impact

- The MCP server must be restarted to load the new resolver. No save
  migration: existing saves load unchanged, and the read-side dedupe renders
  the id duplicate once.
- The character sheet's text and html outputs gain a `### Relationships`
  section; the JSON output gains a `relationships` array; the ascii line gains
  `Relations: N`.
- The knowledge graph derives more edges. A Player graph read remains
  scope-filtered by REQ-514; the GM graph is the full social graph.

## Edge cases and rollback

- **Unresolved tokens** (test fixtures `"a"`/`"b"`, or a deleted party) fall
  back to normalized raw matching; no edge is invented.
- **Name collision** between an entity and an NPC: entities win; the resolver
  order is documented in the module header.
- **Existing save with the id duplicate**: read-side dedupe keeps the first
  row; no migration writes to the save.
- **Graph scope**: Player reads still hide NPC/faction nodes per REQ-514; the
  GM graph is the full social graph.
- **Rollback cost 1**: all edits are reversible. Revert the engine and content
  files, rebuild the artifact, and rerun the freshness gate.

## Risks

- The `manage_relationship (set)` dedupe changes update semantics for
  mixed-key pairs; T366 and the new narrative test cover the exact-pair and
  cross-key cases.
- The sheet JSON gains a `relationships` array; T505 parses `name` only, so the
  addition is additive.
- The graph extension is a behavior change beyond the character-only minimum;
  D3 records the interpretation and T602 covers NPC/faction edges.
- The `graph-limitations` note edit is content; no gate reads it.
