# Plan — Novel-tier identity for entities and NPCs

Session 2026-11-08. Base HEAD `76f8706`; the working tree carries this
session's social-graph, relationship-coupling, and Torre content increments.
This plan implements option 2 for the remaining new-feature gap: identity
facets must ship with the Novel instead of requiring a roster staging step.
Plan revision 1.

## Done bar

**Done bar:** a Novel entity and an NPC stage and accept identity facets
without a roster entry; `manage_identity` and `identity://<id>` resolve both
tiers; the protagonist's authored facets render in `### Who They Are` from the
starter source; a Player read of a foreign NPC is refused; a Novel-tier
mutation takes a Novel snapshot and is undoable; clone, checkpoint, and archive
carry the Novel-tier map; the spec's §5.26 table, §7.7.0 class contract,
REQ-473 scope, REQ-240a/241a/334b enumerations, and T771 row are amended;
fingerprints, coverage register, tool definitions, and surface budget are
regenerated; `test:identity`, `test:starter-novel`, `test:persistence`,
`test:output-contracts`, `test:belief`, `test:tool-definitions`,
`test:memory-recall`, `typecheck`, `test:all`, root `check:fast`,
`check:conformance`, and `build-order` pass; the increment lands with
plan/tasks/AAR and a terminal LOOP token; nothing is pushed.

## Baseline (measured this session)

- `git rev-parse --short HEAD` → `76f8706`.
- Root `npm run check:fast` → 37 passed / 0 failed.
- `cd holonovel && npm run test:narrative` → 60 passed / 0 failed.
- `manage_identity` description 989 bytes (budget 1000); recorded full surface
  27,953 tokens.
- `identityFor` reads only `state.roster`; a Novel entity or NPC returns null.
  `holonovel/src/index.ts:8086-8092`.
- `NovelState` has no identity map; `novelToJSON`/`novelFromJSON` have no
  identity field. `holonovel/src/core/state.ts:580-744`, `:2581-2865`.
- The `identity://` resource lists only `state.roster.keys()`.
  `holonovel/src/index.ts:11959-11970`.
- The starter's `character_01` and `npc_mv4m1599` have no identity state.

## Findings

| ID | Severity | Finding | Predicate |
|---|---|---|---|
| NI-1 | Major | `manage_identity` cannot target a Novel entity or NPC. | `identityFor` returns null unless `state.roster.has(id)`. `holonovel/src/index.ts:8086-8092`. |
| NI-2 | Major | The starter's protagonist has no identity state to render. | The source has no novel-tier identity surface; `identityFor(novel.active_entity_id)` returns null, so `### Who They Are` is absent from the first briefing. `holonovel/src/index.ts:13626-13633`. |
| NI-3 | Major | The `identity://` listing omits Novel-tier subjects. | It lists `state.roster.keys()` only. `holonovel/src/index.ts:11961`. |
| NI-4 | Minor | Per-entity identity fields would leak NPC identity to the Player through `manage_npc get` and the entity sheet. | `sanitizeNpcForBadge` strips `mind` and `talkativeness` only; a per-NPC identity field would pass through. `holonovel/src/index.ts:581-586`. |
| NI-5 | Minor | The spec says identity is Roster-tier only. | `spec/01a-constitution.md:166`, `spec/04-runtime.md:369`. |

## Decisions

- **D1 — A Novel-level `identities` map, keyed by subject id.** Novel entities
  and NPCs get identity entries in `novel.identities`; roster characters keep
  `RosterEntity.identity`. Rejected: per-entity identity fields, which would
  leak NPC identity through `manage_npc get` and the entity sheet.
- **D2 — Resolution order: Novel map → roster baseline (read fallback) →
  empty.** A read for a Novel subject with no map falls back to the roster
  baseline when one exists. The first mutation on a Novel subject copies the
  roster baseline into the Novel map, then mutates the copy; the Novel-tier
  identity shadows the roster baseline for that id. A roster-only character
  continues to use its roster baseline.
- **D3 — An empty map is omitted from serialization.** `novelToJSON` includes
  `identities` only when the map is non-empty. Existing Novels and checkpoints
  hash and restore unchanged; `STATE_HASH_PROJECTION_VERSION` stays 2. A
  populated map joins the canonical state hash and the clone/checkpoint/archive
  payloads. Rejected: always serializing `{}` and bumping the projection,
  which would re-derive every old digest and invalidate old checkpoint hashes.
- **D4 — `manage_identity` persists to the owning tier.** Novel-tier mutations
  take `novelSnapshot()` and are undoable via `manage_history`; roster
  mutations keep `saveRoster()`. The tool description says so.
- **D5 — `### Who They Are` renders for any active entity.** A Novel entity
  with no map shows the existing `[No identity facets to state.]` marker; the
  starter's authored facets render. The Player projection is unchanged.
- **D6 — The starter authors the protagonist and one NPC.** `character_01`
  carries 12 facets, including one false-but-held belief and one unaware
  secret; `npc_mv4m1599` carries 3 facets and proves NPC support. The name
  facet is omitted because the player chooses the name at session zero.
- **D7 — Spec amendments, no new REQ.** Amend §5.26, §7.7.0, REQ-473's scope,
  REQ-240a/241a/334b's enumerations, and add T771 bound to REQ-473. No new
  tool, action, or property group.
- **D8 — The tool description shrinks to 958 bytes.** It adds the two-tier
  resolution and the owning-tier persistence while staying under the 1000-byte
  budget; the generated tool definitions and surface budget are regenerated.

## Blast radius

| File | Change | Size |
|---|---|---|
| `spec/01a-constitution.md` | §5.26 Character Identity row | S |
| `spec/04-runtime.md` | §7.7.0 identity class contract | M |
| `spec/02-requirements.md` | REQ-473 scope; REQ-240a/241a/334b enumerations; REQ-480 check binding | M |
| `spec/appendices-reference.md` | T771 row | S |
| `spec/audit/req-coverage.md` | Regenerated coverage register | S |
| `holonovel/src/core/identity.ts` | `normalizeIdentityMap` | S |
| `holonovel/src/core/state.ts` | `identities` field; empty/serialization/load/snapshot | M |
| `holonovel/src/index.ts` | Two-tier `identityFor`, tier save/snapshot, actions, resource list, description | M |
| `holonovel/content/torre-nosferatu.source.json` | `identities` for `character_01` and `npc_mv4m1599` | M |
| `holonovel/content/torre-nosferatu.json` | Rebuilt artifact | S |
| `holonovel/scripts/test-identity.ts` | T771: Novel entity, NPC, undo, persistence, Player refusal | M |
| `holonovel/scripts/test-starter-novel.ts` | Identity map + Who They Are + Player projection | S |
| `holonovel/tool-definitions.json` | Regenerated | S |
| `spec/audit/tool-surface-baseline.json` | Re-recorded if the footprint changes | S |
| `holonovel/src/generated/contract-fingerprints.ts` | Regenerated by build-order (§7.7 edit) | S |
| `holonovel/holonovel.md` | Generated server copy from `build-order` | S |
| `README.md` | Conditional `@spec:` marker refresh | S |
| `holonovel/DECISIONS.md` | Decision record and recorded surface budget | S |
| `CHANGELOG.md` | Dated entry | S |
| `docs/plans/2026-11-08-novel-tier-identity/plan.md` | This plan | S |
| `docs/plans/2026-11-08-novel-tier-identity/tasks.md` | Ordered checklist | S |
| `docs/plans/2026-11-08-novel-tier-identity/aar.md` | Post-execution AAR with LOOP token | S |

No `state-hash.ts` change: D3 keeps the projection version at 2.

## Implementation steps

### 1. Identity model — `holonovel/src/core/identity.ts`

Add `normalizeIdentityMap(raw): Record<string, IdentityState>`: iterate the
input object, default `character_id` to the key, coerce missing arrays to `[]`
and `version` to 0, then apply `normalizeIdentityState`. It returns `{}` for a
non-object. No import from `state.ts`.

### 2. State model — `holonovel/src/core/state.ts`

- `NovelState.identities: Record<string, import("./identity.js").IdentityState>`.
- `emptyNovel`: `identities: {}`.
- `novelToJSON`: include `identities` only when the map has keys.
- `novelFromJSON`: `identities: normalizeIdentityMap(data.identities)`; import
  `normalizeIdentityMap` at the top.
- The `out` object always owns an `identities` key so `captureFutureFields`
  treats it as known even when the serialized form omits it.
- `novelToSnapshotJSON` includes the map through `novelToJSON`; `applyNovelState`
  copies it.

### 3. Two-tier lookup and persistence — `holonovel/src/index.ts`

- `isNovelIdentitySubject(id)`: true when the active Novel has the id as an
  entity or NPC.
- `identityFor(characterId, create = false)`:
  1. Novel map hit → normalized state.
  2. Novel subject and `create=false` → the roster baseline if present, else
     `emptyIdentity`.
  3. Novel subject and `create=true` → copy the roster baseline (or an empty
     identity) into `novel.identities[id]` and return the copy.
  4. Roster character → the existing roster path.
  5. Otherwise `null`.
- `saveIdentity(id)`: `saveNovel` when the id is a Novel subject or has a Novel
  map entry; otherwise `saveRoster`.
- Every mutation action (`stage`, `accept`, `reject`, `revert`, `bootstrap`)
  calls `novelSnapshot()` before mutating when `isNovelIdentitySubject(id)`,
  and calls `saveIdentity(id)` after. `stage` and `bootstrap` call
  `identityFor(id, true)`; the read actions call `identityFor(id)`.
- Replace the "Roster character ... not found" messages with "Character ...
  not found. Corrective action: pass a Novel entity, NPC, or roster character
  id."
- `identity://` list: union `state.roster.keys()`, `novel.entities.keys()`, and
  `novel.npcs.keys()`; a Player still sees only the active entity.
- Rewrite the `manage_identity` description to the 958-byte two-tier version
  and change the `character_id` description to "Character id: a Novel entity,
  NPC, or roster character."

### 4. Starter identities — `holonovel/content/torre-nosferatu.source.json`

Add `identities`:

- `character_01`: 12 accepted facets, version 1, no candidates/history:
  - fact `calling` (structural, biographical): "A solicitor who came to Torre
    Nosferatu on a client's business."
  - value `method` (constitutional): "Keep the record exact, whatever the dark
    does."
  - belief `rescue` (core, `false_but_held: true`): "The client will send
    someone."
  - want `escape` (core): "Find a way out of the tower."
  - need `surrender` (developmental): "Admit that the record cannot save you."
  - fear `erasure` (core, `awareness: "partly"`): "Being forgotten in the dark,
    with no one left to read the record."
  - wound `locked-doors` (core): "The doors were locked behind you, and no one
    came when you called."
  - wound `witness` (core, `awareness: "no"`): "You were sent to be a witness,
    not to return."
  - stance `the-tower` (core, valence -70): "The tower is a thing to be
    survived, not understood."
  - contradiction `record-and-fear` (core, `contradicts: ["method", "erasure"]`):
    "The record is the only thing keeping the fear in order."
  - rule `last-match` (developmental): "Never spend the last match to light a
    page."
  - habit `journal` (developmental): "Write everything down, even when the hand
    shakes."
  All use `source: "authored"`, `revision: 1`, and `accepted_at:
  "2026-10-12T02:06:10.690Z"`.
- `npc_mv4m1599`: 3 facets, version 1:
  - fact `calling` (structural, biographical): "The hoarder of the third
    floor."
  - value `count` (constitutional): "A fair count is the only kindness he
    trusts."
  - fear `empty-handed` (core, `awareness: "partly"`): "Being left with nothing
    to count."
- Rebuild the artifact.

### 5. Spec amendments

- `spec/01a-constitution.md`: Character Identity row becomes "Durable identity
  state — Roster-tier for roster characters and Novel-tier for Novel entities
  and NPCs; ...".
- `spec/04-runtime.md` §7.7.0: two tiers; the Novel-tier map is a declared
  non-property, self-contained surface; clone, checkpoint, and archive carry
  it (REQ-240a/241a/334b); a Novel-tier identity shadows the roster baseline
  and its mutation persists to the Novel and is undoable.
- `spec/02-requirements.md`:
  - REQ-473: add "for any subject (a roster character, a Novel entity, or an
    NPC)".
  - REQ-240a: add "Novel-tier identity state (REQ-473)" to the clone list.
  - REQ-241a: add "Novel-tier identity state (REQ-473)" to the snapshot list;
    remove "The server SHALL provide checkpoints." to stay under 800 chars.
  - REQ-334b: add "Novel-tier identity state (REQ-473)" to the restore list.
  - REQ-473 `_Check:_` becomes `T563, T631, T771`.
- `spec/appendices-reference.md`: T771 row: "Novel-tier identity: a Novel
  entity and an NPC stage and accept facets without a roster entry; snapshot
  and the who-they-are briefing render them; a Player read of a foreign NPC is
  refused; a Novel-tier mutation is undoable; save/reload preserves the map.
  | REQ-473, REQ-480, REQ-643".
- Run `npm run assemble`, `npm run validate -- --write-register`, and
  `npm run refresh-properties`.
- Body lengths after edit (limit 800): REQ-473 ≈ 641, REQ-240a ≈ 705,
  REQ-241a ≈ 778 (the "server SHALL provide checkpoints" sentence is removed to
  make room), REQ-334b ≈ 789. Re-measure after the edit and trim if any body
  crosses 800.

### 5a. Sibling contracts

Grep `manage_identity`, `identity://`, and REQ-473/480/481/643 in
`holonovel.md`. Confirm the two-tier resolver does not alter the facet-kind,
awareness, false-belief, valence, temporal-bound, or tension contracts
(REQ-636–641), the Player projection (REQ-643), the candidate cap (REQ-547), or
the bootstrap exclusions (REQ-479). No sibling REQ binds a different
`manage_identity` scope; the tool keeps its seven actions and parameters.

### 6. Generated surfaces

- Regenerate `holonovel/tool-definitions.json`:
  `npx tsx holonovel/scripts/generate-tool-definitions.ts`.
- Run `npm run surface-budget -- --write`; update the `**Recorded surface
  budgets:**` line in `holonovel/DECISIONS.md` to the measured full/standard/
  small token counts.
- Run `npm run build-order` for the contract fingerprints and propagation.

### 7. Tests

- `test-identity.ts` T771: create a Novel entity without `stage_to_roster`;
  stage/accept a facet; assert `snapshot` and the GM `### Who They Are`
  render it; create an NPC, stage/accept, assert the GM snapshot; switch to
  the Player badge and assert the foreign NPC read is `[FORBIDDEN]`; accept a
  second facet and undo, assert the facet disappears; kill, reboot, resume,
  and assert the map persists.
- `test-starter-novel.ts`: assert `character_01` and `npc_mv4m1599` identities
  load; in the seeded-server test, assert the GM prompt contains `### Who They
  Are` and the aware `method` facet, the GM prompt contains the unaware
  `witness` facet with `[unaware]`, and the Player prompt omits `witness` but
  keeps `method`.
- The existing `test-identity` roster tests must still pass; the staged
  character now resolves the Novel copy, which starts from the roster
  baseline.
- `test:all` as the final server-suite check.

## Verification

1. `npm run assemble`
2. `npm run validate -- --write-register`
3. `npm run refresh-properties`
4. `cd holonovel && npx tsx scripts/generate-tool-definitions.ts`
5. `npm run surface-budget -- --write`; update the DECISIONS budget line.
6. `npm run build-order`
   - This propagates to the adjacent dnd5e checkout. If that checkout is
     absent, record the skip and confirm build-order's fingerprint step still
     regenerated `contract-fingerprints.ts`.
7. `cd holonovel && npm run typecheck`
8. `cd holonovel && npm run test:identity`
9. `cd holonovel && npm run test:starter-novel`
10. `cd holonovel && npm run test:persistence`
11. `cd holonovel && npm run test:output-contracts`
12. `cd holonovel && npm run test:belief && npm run test:tool-definitions && npm run test:memory-recall`
13. `cd holonovel && npm run test:all`
14. `npm run check:fast` (root, un-piped)
15. `npm run check:conformance`

Capture each exit code un-piped. The done bar is the `check:fast: PASS` line
plus the test totals.

## User impact

- The server must be restarted to load the two-tier resolver. No save
  migration: an existing Novel has no `identities` map and loads unchanged.
- A staged character's identity edits now live in the Novel copy; the roster
  baseline stays untouched. A Novel entity with no map falls back to the
  roster baseline for reads.
- The starter's protagonist shows `### Who They Are` from the first briefing;
  an entity with no facets shows the existing empty marker.
- `manage_identity` remains GM-only for mutation; a Player reads only the
  active character, and a foreign NPC read is refused.

## Edge cases and rollback

- **Existing save with no identity map:** `novelFromJSON` defaults `{}`;
  `novelToJSON` omits it, so the state hash is unchanged and old checkpoints
  restore.
- **Staged character:** a Novel entity with a roster baseline reads the
  baseline until the first mutation copies it into the Novel map; the copy
  shadows the baseline. The roster baseline is not mutated during Novel play.
- **Unknown id:** `identityFor` returns null; the tool returns `[NOT_FOUND]`.
- **Player foreign read:** the existing `identityReadGate` refuses it; the
  resource gate matches.
- **Undo:** a Novel-tier mutation snapshots the Novel; undo restores the map.
  A roster mutation still uses the roster, outside Novel history.
- **Rollback cost 1:** revert the spec/engine/content edits, rebuild the
  artifact, regenerate the fingerprints/tool definitions, and rerun the gates.
