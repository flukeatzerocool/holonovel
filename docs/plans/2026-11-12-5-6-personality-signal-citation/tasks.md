# Tasks — §5.6 personality, signal, and citation remediation

Ordered checklist for `plan.md`. Each phase's done-condition is the one stated in
the plan. Record red-green transcripts in `aar.md` as they happen.

## Phase 0 — baseline and re-anchor

- [ ] Confirm clean tree; commit any uncommitted predecessor increment first.
- [ ] Run `npm run check:fast`; record the 41/41 result.
- [ ] Run the six suites; record each pass count.
- [ ] Re-anchor §1 predicates and the Phase 8 citation tokens; correct drift.

## Phase 1 — probes

- [ ] Sibling-contract grep for the five actions and two resources.
- [ ] §7.7/§7.7.0 declaration probe for `persona`, `scope`, `role`,
  `player_signals`, `voice_examples`.
- [ ] Tool-schema/description surface enumeration.
- [ ] `player_signals` reader/writer enumeration.
- [ ] Record probe results; fold any scope change into the plan.

## Phase 2 — red probes

- [ ] Personality group presence/ordering assertion red.
- [ ] Voice-example tag filter assertion red.
- [ ] Sixth-example refusal assertion red.
- [ ] Player/shared vs Player/GM-scope directive assertion red.
- [ ] Personality resource shape + badge filter assertion red.
- [ ] Signal compound/removal assertion red.
- [ ] Signal age (0/1/N/unknown) assertion red.
- [ ] Boundary warning for each of the five entry points red.
- [ ] Tightened T201/T216/T220 assertions red.

## Phase 3 — personality accessor and group (F-P3B2-9, -11)

- [ ] Add `core/personality.ts` helpers.
- [ ] Wire `fmtEntitySheet` through the helpers.
- [ ] Add the entity personality group outside the GM-only branch.
- [ ] Reshape `entity://<id>/personality` and `npc://<id>/personality`.
- [ ] Badge-filter the NPC resource.

## Phase 4 — voice directive, scope, tags, cap (F-P3B2-10)

- [ ] Add `NpcState.scope`/`role` and schema parameters with defaults.
- [ ] Move the directive out of the GM-only branch.
- [ ] Apply the scope gate, role, tag filter (before slice), and `Avoid:` line.
- [ ] Add voice-example source metadata and the 5-example normalization.

## Phase 5 — signals and briefing (F-P3B2-12)

- [ ] Add `PlayerSignalEntry`, the compound type, and four persistence paths.
- [ ] Migrate the legacy string form on load.
- [ ] Implement removal, counter/timestamp refresh, REQ-069c audit identity.
- [ ] Render age in the GM-only section; add the title to `NEVER_TRUNCATED`.
- [ ] Adapt boundaries and the collision helper to `.value`.

## Phase 6 — boundary propagation (F-P3B2-13)

- [ ] Add `appendBoundaryWarning`.
- [ ] Wire `manage_scene (set/directive)`, `manage_npc (create/update)`, and
  `manage_lore (set/update)`.
- [ ] Assert advisory-only behavior and deduplication.

## Phase 7 — registers, roadmap, generated surfaces

- [ ] Mark F-P3B2-9…14 `Resolved` with current predicates.
- [ ] Update every `Scheduled-roadmap` cross-reference in the same edit.
- [ ] Remove the shipped ROADMAP section and add **REQ-124 NPC damage resolution
  (P1)**; run `check-roadmap`/`check-registers`.
- [ ] Regenerate the coverage register.
- [ ] Regenerate `holonovel/tool-definitions.json`.
- [ ] Run `surface-budget --write`; refresh DECISIONS counts only if moved.

## Phase 8 — citation repair (F-P3B2-14)

- [ ] T55 entity lifecycle + `party://current`.
- [ ] T56 NPC partial stats/turn/persistence.
- [ ] T57 scene state/Player refusal.
- [ ] T58 entity personality briefing/resource/override.
- [ ] T65 voice examples + supplementary + Player refusal.
- [ ] T112 scene history order.
- [ ] T132 N+1 cap/suppressed count/audit.
- [ ] T140 render ordering cross-surface.
- [ ] T142 signal lifecycle.
- [ ] T723 talkativeness default/selection/Player read.
- [ ] T129 NPC narrative fields/Player refusal.
- [ ] T202 personality-resource shape.
- [ ] Correct the T131 conflict-lifecycle title (remove T131 only); record
  T91/T162 as residual mislabels.
- [ ] Leave REQ-124b untouched; add the REQ-124 roadmap item and register row.
- [ ] Tighten T201/T216/T220.
- [ ] Re-run coverage resolution; record result.

## Phase 9 — gates

- [ ] `npm run assemble`.
- [ ] `npm run check:fast` (un-piped; read the trailing line).
- [ ] Six server suites.
- [ ] Root and server `typecheck`.
- [ ] `npm run surface-budget`.
- [ ] `npm run build-order`; read the review summary.

## Close

- [ ] Write `aar.md` with red-green transcripts, deviations, register/roadmap
  state, and the `LOOP PAUSED`/`LOOP OPEN` terminal token.
- [ ] `npm run session:close`.
