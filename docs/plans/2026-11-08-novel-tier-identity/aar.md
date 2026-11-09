# AAR — Novel-tier identity for entities and NPCs

**Date:** 2026-11-08 · **Plan:** `plan.md` · **Tasks:** `tasks.md`
**Base:** `76f8706` · **Rollback cost:** 1

## Planned vs. happened

| Planned | Happened |
|---|---|
| Novel-level `identities` map + normalizer | Shipped. `identity.ts` normalizer; `state.ts` field, empty/load/save/snapshot; empty-map omission keeps old hashes and checkpoints stable. |
| Two-tier resolver | Shipped. Novel map → roster baseline → empty; the first mutation copies the baseline into the Novel and shadows it. |
| `manage_identity` tier persistence | Shipped. Novel-tier mutations take `novelSnapshot()` and are undoable; roster mutations keep `saveRoster()`. |
| Identity resource listing | Shipped. Roster, Novel entity, and NPC ids; a Player sees only the active entity. |
| Starter identities | Shipped. `character_01` 12 facets; `npc_mv4m1599` 3 facets. |
| Spec amendments + T771 | Shipped. §5.26, §7.7.0, REQ-473/240a/241a/334b, T771; 0 validation errors. |
| Generated surfaces | Tool definitions regenerated (963-byte description); surface budget 27,955/24,357/1,149; fingerprints regenerated. |
| Tests | T771 passes; starter GM/Player projection assertions pass. |

The first build-order run failed because the new increment had no `aar.md`
(this file); the starter artifact was also stale after the fingerprint
regeneration advanced `DATA_FORMAT`. Both were resolved in-session.

## Verification evidence

- `cd holonovel && npm run typecheck` → clean.
- `npm run test:identity` → 25 passed / 0 failed, including T771.
- `npm run test:starter-novel` → 15 passed / 0 failed, including the GM/Player
  `### Who They Are` projection assertions.
- `npm run assemble` → 0 errors; `npm run validate -- --write-register` → 0
  errors, 272 warnings (proofread-register drift is informational).
- `npx tsx scripts/generate-tool-definitions.ts` → 37 tools, 116,848 bytes;
  `manage_identity` description 963 bytes.
- `npx tsx scripts/surface-budget.ts --check` → PASS, full 27,955 / standard
  24,357 / small 1,149.
- `npm run refresh-properties` → 0 errors; README markers current.
- `npm run build-order` → complete: 0 errors, 272 warnings, `Ready to commit`;
  fingerprints regenerated (`DATA_FORMAT` advanced), playability PASS (4
  Novels).
- `cd holonovel && npm run test:all` → 54 passed / 0 failed (127.8s).
- Root `npm run check:fast` → 37 passed / 0 failed, `check:fast: PASS`.
- `npm run check:conformance` → PASS; no bundle-dependent REQs.
- Holosuite anchor repoint: 12 original + 8 follow-on anchors updated across
  `holosuite-{novel,adversarial,differential,invariants,conformance}.ts`;
  `test:holosuite-evidence` 10/10 and the full suite green.

Manual probe: the GM `### Who They Are` shows the false belief, the partly-aware
fear, the unaware `witness` wound, and the `method <-> erasure` tension; the
Player render omits the fear and witness, clears the false-belief mark, and
omits the tension; the Player NPC identity read is `[FORBIDDEN]`.

## Conditions

- **C-1 — resolved.** The empty map is omitted from `novelToJSON`; the
  projection version stays 2; the canonical hash of an identity-free Novel is
  unchanged.
- **C-2 — resolved.** A Novel subject reads the roster baseline until the first
  mutation, which copies it into the Novel map; the roster baseline is not
  mutated. The T771 undo/reload assertions pass.
- **C-3 — resolved.** A Player read of a foreign NPC through the tool and the
  resource is refused; the active Novel entity's snapshot is projected.
- **C-4 — resolved.** REQ body lengths stay under 800 (measured after the
  edit); fingerprints, tool definitions, and the surface budget regenerated.
- **C-5 — resolved.** The starter GM prompt contains the aware and unaware
  facets; the Player prompt omits the unaware facet. `test:starter-novel`
  asserts both.

## What went right

1. **The Novel-level map avoids a Player leak.** Putting identity on the NPC
   record would have passed through `sanitizeNpcForBadge`; the map is read only
   by `manage_identity` and the active-entity briefing.
2. **The empty-map omission avoids a migration.** Existing Novels and old
   checkpoints keep their hashes; the new field appears only when populated.
3. **The starter renders immediately.** The protagonist's facets are visible
   from the first GM/Player briefing without a staging step.

## What went wrong

1. **A pre-existing cancel-path crash.** `novelFromJSON` defaulted
   `campaign_memory` to `{}`; cancelling the opening workflow and rendering the
   briefing threw `visible.slice is not a function`. Fixed to `[]`; this is a
   P0 in the path the starter identity test exercises.
2. **The starter's default badge masks the section.** The source badge is
   `none` (Editor), so the GM/Player-only `### Who They Are` section is absent
   until the opening workflow is resolved and a play badge is set. The test
   does both; the AAR records the behavior.
3. **The first build-order run was red on two sequencing items.** The AAR was
   missing, and the starter artifact was stale after `DATA_FORMAT` advanced.
   Both are expected pipeline order, now fixed.

## Findings and dispositions

| # | Finding | Class | Disposition |
|---|---|---|---|
| NI-1 | `manage_identity` could not target Novel subjects | P1 (normative gap) | Fixed: two-tier resolver and tier-aware persistence. |
| NI-2 | Starter protagonist had no identity to render | P1 (feature gap) | Fixed: authored 12 facets; `### Who They Are` renders. |
| NI-3 | `identity://` omitted Novel subjects | P2 | Fixed: roster + entity + NPC listing. |
| NI-4 | Per-entity identity would leak NPC state | P3 (design risk) | Avoided by the Novel-level map. |
| NI-6 | `campaign_memory: {}` crashed the cancel-path briefing | P0 (demonstrated crash) | Fixed to `[]`; no guard needed, the type is an array. |
| NI-7 | Editor badge hides the who-they-are section | P3 (by design) | Recorded; the play badge is required. |
| NI-8 | 20 Holosuite predicate anchors drifted after the source edits | P0 (gate failure) | Fixed: anchors repointed to the current symbol lines; `test:all` 54/54. |

## Methodology findings

- **Exercise the cancel path when adding starter content.** The opening
  snapshot bypasses the normal loader; a field default that differs between
  `loadNovelFromData` and `novelFromJSON` surfaces only after a cancel. The
  starter test now renders the briefing after cancel.

## Terminal

Done bar met: a Novel entity and an NPC carry identity without a roster entry;
the starter protagonist's 12 facets render from the first GM/Player briefing;
the Player projection omits unaware and partly-aware facets and clears the
false-belief mark; a foreign NPC read is refused; Novel-tier mutations undo and
persist; the spec and generated surfaces are current; `test:all` 54/54 and
root `check:fast` 37/37 pass. The P0 crash and the anchor drift are fixed. No
open P0/P1.

LOOP PAUSED
