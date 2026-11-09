# AAR — Social graph resolution, surface, and Torre cast links

**Date:** 2026-11-08 · **Plan:** `plan.md` · **Tasks:** `tasks.md`
**Base:** `76f8706` · **Rollback cost:** 1

## Planned vs. happened

| Planned | Happened |
|---|---|
| `core/relationships.ts` read seam | Shipped. Named/id resolution, canonical pair keys, read-side dedupe, outgoing/incoming edges, display lines. |
| Rewire get/set, knowledge state, sheet, suggest | Shipped. `get` and `suggest` now resolve both key forms; `set` updates by canonical pair; the sheet gains text/html/json/ascii relationship output. |
| Graph party-node edges and case-insensitive rooms | Shipped. Character-NPC, NPC-NPC, and NPC-faction `relates_to` edges derive; capitalized room names resolve to canonical keys. |
| Torre content: remove duplicate, add 8 pairs + 6 faction links | Shipped. 17 → 30 rows; every endpoint resolves; no canonical duplicate. |
| Tests in narrative, graph, starter harnesses | Shipped. Narrative +6 assertions, graph +3 edge classes, starter +source integrity. |
| No new REQ/T/gate | Held. Conformance fix against REQ-236a, REQ-286, REQ-512. |

The plan's duplicate-row reference was corrected before the first edit: the
id-keyed row `npc_mv4m1599 -> npc_mv4m18a8` duplicates the ordered pair
`Vlask -> Nadja` (row 10), not `Nadja -> Vlask` (row 11).

## Verification evidence

- `cd holonovel && npm run typecheck` → clean.
- `npm run test:narrative` → 55 passed / 0 failed (was 49; +6).
- `npm run test:graph` → 5 passed / 0 failed.
- `npm run test:starter-novel` → 15 passed / 0 failed.
- `npm run test:output-contracts` → 338 passed / 0 failed.
- `npm run test:belief` → 29 passed / 0 failed.
- `npm run test:tool-definitions` → 17 passed / 0 failed.
- `npm run test:competitive-gaps` → 28 passed / 0 failed (T516 political
  projection still distinct).
- `npm run build:starter-novel` → 293,602 bytes; `check:starter-freshness` →
  PASS.
- Root `npm run check:fast` → 37 passed / 0 failed, `check:fast: PASS`.
- `npm run check:conformance` → PASS; no bundle-dependent REQs.
- C-3 live-save probe: `manage_relationship (get, "Vlask")` → 3 outgoing;
  `get, "npc_mv4m1599"` → 3 outgoing; the `Vlask -> Nadja` pair appears once;
  the GM briefing renders 6 resolved relationship lines for the protagonist
  (previously 0).
- Manual render probe on a fresh seed: GM briefing → 6 relationship lines; the
  `character_01` sheet → 6; `manage_knowledge graph_get` → 30 `relates_to`
  edges (6 NPC→character, 18 NPC→NPC, 6 NPC→faction) and 6 `located_in` edges.

## Conditions

- **C-1 — resolved.** The `set` path still writes `type`; the narrative test
  asserts an in-place `ally` → `rival` update, and T410's
  relationship-countdown advisory still passes. REQ-236b's marker and P48's
  coupling are **not implemented in this build**; recorded as F1 below, not a
  regression.
- **C-2 — resolved.** `relationships.ts` imports only types from `state.ts`;
  `typecheck` and every server-backed test boot cleanly.
- **C-3 — resolved.** The live save carrying both key forms resolves to one
  edge on `get` and on the briefing.

## What went right

1. **The failure was a seam, not a content gap.** The relationship rows were
   authored; the briefing, sheet, get, and suggest paths all compared raw
   tokens. One resolver fixed five surfaces without migrating a save.
2. **The graph became a graph.** Resolving endpoints to canonical party ids and
   room names turned an empty projection into character-NPC, NPC-NPC, and
   NPC-faction edges.
3. **The live save needed no migration.** Read-side dedupe keeps the first row,
   so the id duplicate in `.holonovel-state` stops rendering twice without a
   write to user state.
4. **The content stayed readable.** The eight missing pairs and six faction
   links use display names, matching the existing rows; the resolver makes them
   addressable by id.

## What went wrong

1. **Plan-review's C-1 assumed behavior that does not exist.** REQ-236b's
   marker and P48's disposition coupling were never implemented; the original
   condition could not be satisfied. The condition was amended to the
   verifiable `type` write and the missing pair recorded as F1.
2. **The duplicate-row reference in the plan was wrong.** It named row 11
   (`Nadja -> Vlask`) instead of row 10 (`Vlask -> Nadja`). Corrected before
   the first edit; a reminder that ordered-pair references need the exact
   direction.
3. **The `graph-limitations` note was stale.** It still claimed 0 edges and
   "UNWIRED"; refreshed with the current behavior.

## Findings and dispositions

| # | Finding | Class | Disposition |
|---|---|---|---|
| F1 | REQ-236b's relationship-change marker and P48's disposition coupling are unimplemented | P1 (normative REQ unevidenced) | Open; schedule as the next social-graph increment. Not a regression. |
| F2 | The live save carries an id-keyed duplicate from the pre-fix `set` path | P3 (existing data, handled on read) | Closed: read-side dedupe renders one edge; no migration needed. |
| F3 | The graph note claimed 0 edges | P3 (stale documentation) | Closed: note refreshed. |

## Methodology findings

- **Ordered-pair references need a direction check.** A relationship dedupe is
  ordered; a plan that says "duplicate of `A -> B`" must confirm the stored
  direction, not the unordered pair. Candidate for the `plan-review` skill's
  relationship-change lens.

## Terminal

Done bar met: the five read surfaces resolve both key forms, the graph derives
party edges, the Torre source carries 30 clean rows, and every targeted test
passes. One pre-existing normative gap remains open (F1); it is outside this
plan's bar and needs its own increment.

LOOP OPEN
