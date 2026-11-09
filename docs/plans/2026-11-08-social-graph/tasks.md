# Tasks — Social graph resolution, surface, and Torre cast links

Ordered; each task ends with its verification. Plan: `plan.md`.

1. **Resolver module.** Create `holonovel/src/core/relationships.ts` with
   `resolveRelationshipParty`, `relationshipParty`, `relationshipEndpoints`,
   `relationshipPairKey`, `isRelationshipInvolving`, `dedupeRelationships`, and
   `relationshipLines`. Verify: `cd holonovel && npm run typecheck`.

2. **Knowledge state.** In `holonovel/src/index.ts`, make
   `composeKnowledgeState` iterate the deduped rows, filter with
   `isRelationshipInvolving(novel, r, activeId)`, and render display names.
   Verify: the new narrative test's briefing assertion.

3. **Get/set.** In `manage_relationship`, resolve the `get` query and match by
   canonical id on both sides; make `set` dedupe by `relationshipPairKey`
   (ordered) and update in place. Verify: the new narrative test's get and
   dedupe assertions, plus T366.

4. **Sheet.** In `manage_character (action: sheet)`, append
   `### Relationships` to the text and html sheets from
   `relationshipLines(novel, entity.id ?? entity.name)`, add a `relationships`
   array to the JSON object, and append `Relations: N` to the ascii line.
   Verify: the new narrative test's sheet assertion; T505 still parses `name`.

5. **Suggest.** In `run_command (action: suggest)`, replace the raw id compare
   with `isRelationshipInvolving` and render the other party's display name.
   Verify: the new narrative test's suggest assertion.

6. **Graph sources.** In `gatherGraphSources`, resolve relationship endpoints
   to canonical party ids, and resolve `current_room`, NPC `location`/`room_id`,
   and faction `territory` to canonical room keys with case-insensitive name
   matching. Verify: `npm run test:graph`.

7. **Graph projection.** In `holonovel/src/core/graph.ts`, add a `partyNode`
   resolver for character/NPC/faction ids and derive `relates_to` edges for
   every resolvable pair. Verify: T602's character-NPC and NPC-NPC assertions.

8. **Torre content.** In `holonovel/content/torre-nosferatu.source.json`:
   - Remove the id-keyed row `npc_mv4m1599 -> npc_mv4m18a8` (duplicate of
     the ordered pair `Vlask -> Nadja`, row 10).
   - Add these eight pairs:
     - `Vlask -> Sister Marta`, `suspicious`, `-1`, "Opening posture. The
       archivist has read his ledger and will not say so; he counts her
       questions as theft."
     - `Vlask -> Ilona`, `suspicious`, `-1`, "Opening posture. He will not
       stand near the unlit candle; he counts her as a debt already spent."
     - `Vlask -> Count Orlok`, `suspicious`, `-1`, "Opening posture. He has
       counted the dark's arrivals and does not believe in a fair price for
       them."
     - `Sister Marta -> Petr`, `ally`, `1`, "Opening posture. The archivist
       shelters the innocent and has decided he is worth the page it costs."
     - `Sister Marta -> Nadja`, `suspicious`, `-1`, "Opening posture. The
       archivist keeps her ledger; the broker keeps hers. Neither will show
       the other the column."
     - `Sister Marta -> Count Orlok`, `suspicious`, `-1`, "Opening posture. She
       has read every account of him and trusts none of them."
     - `Ilona -> Nadja`, `rival`, `-1`, "Opening posture. Two people selling
       the same dark; each thinks the other is the mark."
     - `Petr -> Nadja`, `ally`, `1`, "Opening posture. He believes her price is
       a kindness; she lets him."
   - Add six faction links:
     - `Vlask -> The Survivors`, `neutral`, `0`, "Member. He keeps his own
       cache and counts the company as a cost."
     - `Sister Marta -> The Survivors`, `neutral`, `0`, "Member. She trades
       with the company and keeps its record."
     - `Ilona -> The Survivors`, `neutral`, `0`, "Member. She walks with them
       and sells them the distance."
     - `Petr -> The Survivors`, `neutral`, `0`, "Member. He would not leave
       them if he could."
     - `Nadja -> The Survivors`, `neutral`, `0`, "Member. She keeps her terms
       and her own counsel."
     - `Count Orlok -> The Survivors`, `rival`, `-2`, "Not a member. He is the
       reason the company exists."
   - Refresh the `graph-limitations` note: relationship and case-insensitive
     location edges now derive; keep the semantic-index and secret-reveal
     limits.
   - Rebuild: `npm run build:starter-novel`; verify
     `npm run check:starter-freshness`.

9. **Source integrity test.** In `test-starter-novel.ts`, assert 30 relationship
   rows, no canonical duplicate, every endpoint resolves, the eight named
   pairs are present, and the six faction links are present. Verify:
   `npm run test:starter-novel`.

10. **Graph test.** In `test-graph.ts` T602, add a character-NPC edge, an
    NPC-NPC edge, and a case-insensitive location edge (`"Hall"` against
    `"hall"`). Verify: `npm run test:graph`.

11. **Registers.** Add the `holonovel/DECISIONS.md` entry, the `CHANGELOG.md`
    entry, and write `aar.md` after the gates with a terminal `LOOP PAUSED` or
    `LOOP OPEN`.

12. **Gates.** Run `npm run typecheck`, `test:narrative`, `test:graph`,
    `test:starter-novel`, `test:output-contracts`, `test:belief`,
    `test:tool-definitions`, `build:starter-novel`, `check:starter-freshness`,
    root `npm run check:fast`, and `npm run check:conformance`. Regenerate
    `spec/audit/req-coverage.md` only if the validator reports drift.
