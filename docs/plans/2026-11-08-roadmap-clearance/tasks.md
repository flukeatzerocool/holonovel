# Tasks — Roadmap clearance: Torre polish and NPC identity in play

Dependency order. One commit (spec increment); evidence per step is recorded in
`aar.md`.

## Phase 0 — preflight

1. Record baseline: `git rev-parse --short HEAD`, `npm run status`,
   `npm run check:fast`, `cd holonovel && npm run test:starter-novel`,
   `npm run test:narrative`, `npm run test:identity`. **Done** — all green,
   HEAD `2f5a0c8`, 37/0 fast gates.
2. Write `plan.md` (approved revision 3) and this file.

## Phase 1 — Torre content polish (P1)

3. `firstSentence()` beside `recordBeatTransition`; use it at the
   `manage_scene (action: set)` call site (`holonovel/src/index.ts`).
4. Author the four `story_beats` previews in
   `holonovel/content/torre-nosferatu.source.json`.
5. `world.things["your candle"].wearable = false`.
6. Genre: add `gothic_horror` to REQ-294 (`spec/02-requirements.md`), to
   `GENRE_CATALOG` (`holonovel/src/index.ts`), to T339
   (`holonovel/scripts/test-persistence.ts`), and set the starter `genre`.
7. Regenerate the starter artifact (`holonovel/scripts/build-starter-novel.ts`);
   confirm the diff is confined to the intended fields.
8. Extend `test-starter-novel.ts` (preview terms, wearable, four beats) and
   `test-narrative.ts` (T387/REQ-337 first-sentence preview).

## Phase 2 — NPC identity in play (P2)

9. Spec: REQ-649 after REQ-643, §5 section map (`636–643, 649`), created-REQ
   row, Appendix T row T772.
10. `npcIdentitySummary()` in `holonovel/src/index.ts`; attach in `manage_npc`
    get (GM only); append lines in `composeNpcMemorySection`; include NPCs with
    identity but no `mind` in the present-NPC loop; update the `manage_npc`
    description.
11. T772 in `holonovel/scripts/test-identity.ts`.
12. Extend `test-starter-novel.ts` with the GM/Player Vlask read assertions.

## Phase 3 — regeneration and registers

13. `generate-tool-definitions.ts`, `npm run assemble`,
    `npm run surface-budget -- --write`, sync the DECISIONS.md budget line,
    `npm run validate -- --write-register`, `npm run refresh-properties`.
14. Move the three `Scheduled-roadmap` rows to `Resolved`; delete the P1 and P2
    `ROADMAP.md` sections.
15. CHANGELOG entry (one dated heading).

## Phase 4 — verification and close

16. `cd holonovel && npm run typecheck && npm run test:all`.
17. Root `npm run assemble && npm run check:fast`; `npm run check:conformance`;
    `npm run build-order`.
18. Write `aar.md` with the measured evidence and a terminal LOOP token.
19. `npm run session:close` (one commit). Do not push.
