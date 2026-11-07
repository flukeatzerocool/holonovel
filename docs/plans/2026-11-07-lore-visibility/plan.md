# Plan — Materialize lore `visibility` (REQ-083d–REQ-083f)

Session 2026-11-07. Roadmap item: "Materialize lore `visibility`
(REQ-083d–REQ-083f)" — `ROADMAP.md:17-25`. Review-register row:
`spec/audit/review-register.md:864` (Scheduled-roadmap).

## Questions

- The user asked: "draft plan for remaining action item."
- Which open roadmap item is the remaining actionable deliverable, and what is
  the smallest change that closes its trigger?

## Baseline (measured this session)

- `git status --short` → clean; 9 unpushed commits; last publish "never
  recorded"; version 2026.11.07 (`npm run status`).
- `npm run assemble` → exit 0.
- `npm run check:fast` → 36 passed, 0 failed, `check:fast: PASS` (un-piped
  aggregate status 0).
- Roadmap selection: the only open item is the lore `visibility` item; the
  publication-engine retirement increment closed the previous one.

## Why

REQ-083d–REQ-083f are normative and unevidenced: `LoreEntry` carries
`badge_scope` only, `manage_lore` accepts no `visibility` parameter, and the
three named Player-badge surfaces (`badge_briefing`, `lore://active`,
`graph://novel`) filter by `badge_scope` or not at all. The trigger-matching
presence gate (REQ-083f) has no per-entity knowledge set to consult.

| Claim | Evidence |
|---|---|
| `LoreEntry` has no `visibility` or `known_by` | `holonovel/src/core/state.ts:160-175` |
| `manage_lore` schema lacks `visibility` | `holonovel/src/index.ts:6356-6371` |
| `set`/update handlers never read visibility | `holonovel/src/index.ts:6400-6446` |
| `set` defaults `badge_scope` to `game_master` | `holonovel/src/index.ts:6410` |
| `list`/`get` filter by `badge_scope` | `holonovel/src/index.ts:6489-6504` |
| `reveal` only resolves secrets | `holonovel/src/index.ts:6568-6593` |
| `lore://active` is unfiltered | `holonovel/src/index.ts:11508-11513` |
| `lore://{key}` is unfiltered | `holonovel/src/index.ts:11515-11531` |
| `graph://novel` lore list is unfiltered | `holonovel/src/index.ts:11684-11689` |
| `composeKnowledgeState` gates on `badge_scope` | `holonovel/src/index.ts:848-877` |
| Triggered lore has no presence gate | `holonovel/src/index.ts:13243-13258` |
| Narrator clearance gates GM lore on `badge_scope` | `holonovel/src/index.ts:958-963` |
| Player-safe export gates on `badge_scope` | `holonovel/src/index.ts:9634-9640` |
| Campaign tier gates on `badge_scope` | `holonovel/src/core/memory.ts:103-106` |
| Draft-scan targets gate on `badge_scope` | `holonovel/src/index.ts:1083-1087` |
| Index/graph scopes derive from `badge_scope` | `holonovel/src/index.ts:8254`, `8277` |
| Creation sites omit visibility | `holonovel/src/index.ts:6159-6164` (character book), `2460-2472` (`@lore`), `7494-7499` (promote), `9309` (complication), `12168-12173` (codex) |
| Spec contract | `spec/02-requirements.md:2632-2639` (REQ-083d–f) |
| Interchange metadata list | `spec/appendices-reference.md:2674-2681` (Appendix L) |
| Test rows asserting Player visibility via `badge_scope` | `spec/appendices-reference.md:1765` (T342), `:1494` (T67), `:1818` (T400), `:1856` (T438) |
| Harness test to extend | `holonovel/scripts/test-output-contracts.ts:1265-1279` (T299 area) |
| Player-scope export assertion | `holonovel/scripts/test-persistence.ts:319-334` (T693) |

## Scope

**In scope**

1. `LoreEntry` gains `visibility: "gm_only" | "shared" | "player_discovered"`
   and `known_by: string[]`; `migrateNovelData` normalizes both.
2. `manage_lore (action: set|update)` accepts `visibility`; a new entry
   without it defaults to `gm_only`; `update` may change it.
3. `manage_lore (action: reveal)` on a lore key sets `player_discovered` and
   appends `entity_id` to `known_by`; reveal on a secret key is unchanged.
4. Read gating by `visibility` on the three surfaces named by REQ-083d plus
   `manage_lore list/get`, `lore://{key}`, `narrate` clearance, player-safe
   export, campaign tier, semantic-index scope, knowledge-graph sources, and
   the REQ-599 draft scan.
5. REQ-083f trigger gate: `gm_only`/`player_discovered` entries fire on a
   non-GM surface only when a knowing entity is present (`known_by` ∩
   `characters_present_ids`); `shared` entries fire on keyword match.
6. `manage_lore (action: export|import)` round-trips `visibility` and
   `known_by`.
7. T342 implemented in `test-output-contracts.ts` with the lifecycle plus
   visibility, reveal, presence-gate, and resource assertions.
8. Spec rows updated: T342 extended; T67, T400 (`border_treaty`,
   `arcane_rumor`), and T438 add `visibility="shared"` where they assert
   Player visibility; Appendix L adds the two fields.
9. Registers/docs: ROADMAP item removed, review-register row Resolved,
   DECISIONS entry, CHANGELOG, coverage register regenerated,
   `tool-definitions.json` regenerated.

**Out of scope** (recorded, not scheduled — no demonstrated failure)

- A separate `visibility` audit/resource surface; the existing audit log
  records the reveal.
- Extending Appendix L with `world_target` (pre-existing omission).
- Changing `badge_scope` semantics on synthesis templates, notes, secrets, or
  countdowns.
- A per-entity reveal parameter on `manage_lore (action: set)`; discovery is
  via `reveal` only.

## Decisions

- **D1 — `visibility` is the sole lore read gate; `badge_scope` remains the
  briefing presentation priority.** Rejected: co-gating on both fields (two
  overlapping gates; contradicts REQ-083e). `badge_scope` still drives
  REQ-350 background matching.
- **D2 — Every creation site states its intent.** `set` without `visibility`
  → `gm_only` (REQ-083d). Sites that already create player-visible lore
  (`@lore` materialization, and the Player-visible test fixtures) pass
  `visibility: "shared"` explicitly. Rejected: seeding visibility from
  `badge_scope` (bends the stated default and blurs 083e).
- **D3 — Legacy migration is strict.** `migrateNovelData` sets
  `visibility: v.visibility ?? "gm_only"` and `known_by: v.known_by ?? []`.
  Rejected: inferring `shared` from legacy `badge_scope` (contradicts
  REQ-083f's backward-compatibility rule). Consequence: pre-existing
  `badge_scope: "shared"` entries become GM-only until re-scoped; named in
  the CHANGELOG as a deliberate behavior change (rollback cost 1).
- **D4 — The presence gate applies to Player and Observer surfaces; the GM
  badge sees all lore.** Rationale: REQ-083d scopes exclusion to Player, the
  GM must narrate GM-only material, and REQ-366 defines Observer as
  non-GM. Rejected: a literal all-badge gate (would make `gm_only` entries
  unreachable, since no entity can "know" them before reveal).
- **D5 — `known_by` is the per-entity discovery set.** `reveal` sets
  `player_discovered` and records the recipient. Rejected: a new `reveal`
  action or a `known_by` input on `set` (tool-surface change not required by
  the REQs).
- **D6 — Read access is entry-level; entity knowledge is per-surface.**
  `list/get` and resources show any entry readable by visibility;
  `player_discovered` knowledge-state rendering additionally requires the
  active entity to be `known_by` and present (REQ-083f). The REQ-599 draft
  scan treats `player_discovered` as a target for entities not in `known_by`,
  mirroring the secret branch.
- **D7 — Reveal keeps its secret branch first.** REQ-308b and REQ-3681 bind
  reveal to secrets; a lore-key branch appends after the secret lookup so
  existing contracts are unchanged.
- **D8 — No new tool.** A parameter addition leaves the tool count and
  REQ-137a classification untouched; `tool-definitions.json` is regenerated
  for the schema fingerprint and `spec/audit/tool-surface-baseline.json` is
  re-recorded for the measured token delta. Appendix L and the test catalog
  feed no declared contract fingerprint, but `build-order` is still run to
  confirm `check-fingerprint-sync` after the assembly.
- **D9 — Spec test rows are corrected, not bent.** T67, T400
  (`border_treaty` and `arcane_rumor`), and T438 currently assert Player
  visibility from `badge_scope` alone, which contradicts REQ-083e; they gain
  `visibility="shared"` on those entries. Rejected: preserving the
  contradiction by special-casing `badge_scope`.

## Contract changes

```ts
// holonovel/src/core/state.ts
export type LoreVisibility = "gm_only" | "shared" | "player_discovered";
export interface LoreEntry {
  // ...existing fields
  visibility: LoreVisibility;   // default "gm_only"
  known_by: string[];           // entity ids that learned it via reveal
}
```

```ts
// holonovel/src/index.ts — schema addition
visibility: z.enum(["gm_only", "shared", "player_discovered"]).optional()
  .describe("gm_only (default), shared, or player_discovered (set/update; reveal sets player_discovered).");
```

```ts
// holonovel/src/index.ts — module-scope helpers
function loreVisible(entry: LoreEntry, badge: Badge): boolean;
function lorePresenceSatisfied(novel: NovelState, entry: LoreEntry): boolean;
```

The stored shape is additive: old Novels load, migrate, and save with the two
new fields. No reader is required to preserve unknown fields (they are now
typed).

## Phases

1. **State shape** — `state.ts`: add the type and both fields to `LoreEntry`;
   normalize in `migrateNovelData` (D3); confirm `novelFromJSON` reaches the
   migration (probe with a legacy fixture).
2. **Lifecycle** — `index.ts`: add `visibility` to `MANAGE_LORE_SCHEMA`;
   `set` defaults and preserves; `update` assigns; `export` (JSON) and
   `import` carry `visibility`/`known_by`; `reveal` gains the lore branch
   (D7); every creation site also initializes `known_by: []`; update the
   tool description.
3. **Read gate** — add `loreVisible`/`lorePresenceSatisfied`; swap the
   `badge_scope` read checks at `index.ts:850,875,959,9637,6490,6503,8254,
   8277,1084,11512,11688` and `memory.ts:105`; filter `lore://{key}`'s
   resource list and read by `loreVisible`; filter `graph://novel`
   `lore_connections`; gate Triggered Lore by visibility + presence for
   non-GM; target `player_discovered` in the draft scan when the active
   entity is not a knower (D4, D6).
4. **Creation sites** — set explicit visibility where behavior must not
   change: `@lore` → `shared`; story-promote, complication, character-book,
   codex, and generic set defaults → `gm_only`.
5. **Tests** — implement T342 in `test-output-contracts.ts`; add
   `visibility: "shared"` to T693's shared fixture
   (`test-persistence.ts:322`); run the affected harnesses.
6. **Spec** — extend the T342 row; add `visibility` to T67/T400/T438; add
   `visibility` and `known_by` to Appendix L; assemble.
7. **Registers/docs** — remove the ROADMAP section; move the register row to
   Resolved; add the DECISIONS entry; regenerate the coverage register and
   tool definitions; re-record the surface baseline (`surface-budget --write`);
   CHANGELOG; write plan/tasks/AAR.
8. **Verify and close** — run the harnesses, `assemble && check:fast`,
   `build-order`; fix findings; commit once.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/state.ts` | type + fields + migration | M |
| `holonovel/src/index.ts` | schema, handlers, helpers, 12 read sites, 6 creation sites, 2 resources | L |
| `holonovel/src/core/memory.ts` | campaign-tier read gate | S |
| `holonovel/scripts/test-output-contracts.ts` | T342 | M |
| `holonovel/scripts/test-persistence.ts` | T693 fixture | S |
| `spec/appendices-reference.md` | T342, T67, T400, T438, Appendix L | M |
| `spec/audit/req-coverage.md` | regenerated | S |
| `spec/audit/review-register.md` | row disposition | S |
| `ROADMAP.md` | remove item | S |
| `CHANGELOG.md` | date-headed entry | S |
| `holonovel/DECISIONS.md` | visibility read-gate decision | S |
| `holonovel/tool-definitions.json` | regenerated schema fingerprint | S |
| `spec/audit/tool-surface-baseline.json` | re-recorded surface footprint | S |
| `spec/build-phase-map.md` | regenerated content hash by assemble | S |
| `holonovel.md`, `holonovel/holonovel.md` | regenerated by assemble | S |
| `README.md` | only if `check-markers` reports drift | S (conditional) |
| `docs/plans/2026-11-07-lore-visibility/{plan,tasks,aar}.md` | increment artifacts | S |

Rollback cost: 1 (reversible edits; additive persisted fields; no external
state).

## Verification

1. Legacy-shape probe: load a Novel JSON with lore entries lacking
   `visibility` in a scratch `TTRPG_DATA_DIR`; assert the saved file carries
   `visibility: "gm_only"` and `known_by: []` (D3).
2. `cd holonovel && npm run test:output-contracts` → T342 passes, including
   Player badge, resources, presence gate, and reveal.
3. `cd holonovel && npm run test:persistence` → T693 passes.
4. `cd holonovel && npm run test:briefing && npm run test-narrative &&
   npm run test-graph && npm run test-security && npm run test-adventure` →
   no regression in lore, clearance, graph, or annotation paths.
5. `npm run assemble && npm run check:fast` → `check:fast: PASS` (un-piped).
6. `npm run build-order` → 0 errors; fingerprints and
   `tool-definitions.json` current; server harness suite green.
7. `npm run validate -- --write-register` → REQ-083 coverage row lists T342;
   commit the regenerated register.
8. `npm run check` (full) before commit → proofreading warnings unchanged
   except any new prose.

## Done bar

**Done bar:** a `manage_lore (action: set)` entry with no `visibility` is
invisible to the Player badge; a `visibility: "shared"` entry is visible;
`reveal` moves a lore entry to `player_discovered` and the presence gate
hides it when no knowing entity is present; `lore://active`,
`graph://novel`, and `manage_lore list/get` agree with `badge_briefing`;
T342 asserts all of it; the ROADMAP item and register row are closed; the
CHANGELOG/DECISIONS and regenerated artifacts are in one commit; and
`assemble && check:fast` plus `build-order` are green.

## Risks and rollback

- **Risk: legacy shared lore disappears for Player.** D3 is deliberate and
  named in the CHANGELOG; the recovery is `manage_lore (action: update,
  visibility="shared")` or `reveal`. If the maintainer prefers preservation,
  switch D3 to the heuristic and re-stamp before execution.
- **Risk: two filters diverge (briefing vs resources).** Mitigated by one
  `loreVisible` helper and T342 asserting all three surfaces.
- **Risk: reveal changes secret behavior.** Mitigated by D7's secret-first
  branch and the existing `test-output-contracts` reveal/secret assertions.
- **Risk: observer behavior changes (gm_only now hidden).** D4 aligns with
  REQ-366; called out in DECISIONS and T342.
- **Rollback:** `git revert` the increment commit. Old code ignores the two
  added fields; no destructive migration.

## Open questions (resolved at execution)

1. **Legacy migration strictness (D3).** Recommended strict per REQ-083f;
   confirm the maintainer accepts the visible behavior change.
2. **Observer lore visibility (D4).** Recommended non-GM; confirm against
   REQ-366.

## Evidence

Baseline and probes were run this session; see the Evidence table above and
the gate output: `check:fast` 36/36, assemble exit 0, tree clean, 9 unpushed
commits. Count probe: `grep -rn 'badge_scope: "shared"' holonovel/scripts`
→ 14 hits, of which only T693 asserts Player visibility; the rest are GM
contexts or graph-source scopes. `grep -n 'badge_scope="shared"'
spec/appendices-reference.md` → T400, T438 (T67 updated by prose).
Preflight's only missing target is the increment's own
`docs/plans/2026-11-07-lore-visibility/plan.md`, which the increment creates;
all other targets are tracked and present.
