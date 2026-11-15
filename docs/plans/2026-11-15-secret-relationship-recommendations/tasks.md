# Tasks — Secret relationship recommendations

Dependency order. Each phase ends with a green gate and its own commit; `aar.md` is written
after the last phase and before the close commit.

## Phase A — detector and briefing line

- [ ] A1 `holonovel/src/core/relationships.ts` — add `SecretRelationshipRecommendation`
      (`type`, `holder_id`, `holder_name`, `target_id`, `target_name`, `secret_key`) and
      `secretRelationshipRecommendations(novel)`: exact whole-token, case-insensitive name
      overlap; deduped party enumeration (entities → NPCs → factions); holder exclusion;
      D3 type precedence (`rival` only for faction holder + faction target, else
      `suspicious`); suppression by sorted, unordered pair key against existing rows of the
      same type; header cites REQ-234b, REQ-234d.
- [ ] A2 `holonovel/scripts/test-narrative.ts:1165-1212` — write the gate-decisive T274
      probe **before** wiring the briefing: one GM-positive assertion on the
      `Relationship suggestion:` prefix and one Player-negative assertion. Run it on the
      unwired tree; it must fail.
- [ ] A3 `holonovel/src/index.ts` — push the formatted lines in the `narrative_threads`
      render behind an explicit `c.badge === "game_master"` guard; no schema, resource, or
      action change.
- [ ] A4 Gate: the T274 probe passes; `npm --prefix holonovel run typecheck`;
      `npm --prefix holonovel run test:narrative` → 84 rows green. Commit.

## Phase B — harness and traceability

- [ ] B1 `holonovel/scripts/test-narrative.ts:1165-1212` — extend T274 with the three
      authored fixtures: `secret_entity_faction` (`The Grey Court paid the butler.`,
      revealed to `character_01`) → `suspicious`; `secret_faction_faction` (`Salt Watch
      takes its orders from the Grey Court.`, revealed to `Salt Watch`) → `rival`, and no
      line pairing `Salt Watch` with `Ash Guild` (the Ash to Grey line from the Phase A
      probe is expected); create
      `Marisol Vane`, then `secret_faction_entity` (`Marisol Vane sold the ledger.`,
      revealed to `Ash Guild`) → `suspicious`. Add: no line for an unnamed party; Player
      and Observer briefings carry no `Relationship suggestion:` line; suppression after
      `manage_relationship (action: set)` in the reverse argument order for one case;
      `secrets://active` GM payload carries the key and `known_by`, Player gets
      `[FORBIDDEN]`.
- [ ] B2 `spec/appendices-reference.md:1743` — T274 REQ column gains `REQ-234b,
      REQ-234d`; assertion text gains the three recommendation checks and the resource
      check.
- [ ] B3 Regenerate: `npm run assemble`; `npx tsx holonovel/scripts/generate-g7-attestation.ts`
      when `npm run check-g7-attestation` reports drift.
- [ ] B4 Gate: `npm --prefix holonovel run test:narrative` → T274 green;
      `npm run assemble && npm run check:fast` → 45/45. Commit.

## Phase C — records and close-out

- [ ] C1 `spec/audit/review-register.md:3085-3101` — move the whole
      `### 2026-11-15 roadmap residuals — secret relationship recommendations` subsection
      into a new `## Resolved — 2026-11-15 secret relationship recommendations` section,
      keeping the `### <date> <session> — <title>` subheading. Rewrite the scheduling prose
      and the U6-F5b bullet to cite the detector, the briefing guard, and T274; keep the
      2026-11-15 date.
- [ ] C2 `ROADMAP.md` — remove the P1 section; keep the P2 re-measurement and `## Non-goals`.
      C1 and C2 land in one commit (`check-registers` traces scheduled REQs).
- [ ] C3 `CHANGELOG.md` — dated entry: both clauses, the D3 interpretation, the computed
      (not persisted) design, the GM-only guard, the T274 assertions, and the regeneration
      evidence.
- [ ] C4 Regenerate: `npm run validate -- --write-register` → `npm run build-order`.
- [ ] C5 `npm run fix-anchors` when `check-anchors` reports drifted anchors.
- [ ] C6 `plan.md` and `tasks.md` land with this commit.
- [ ] C7 Gate: `npm run assemble && npm run check:fast`; `npm run check-anchors`;
      `HOLONOVEL_IMPL_STRICT=1 npm run validate` → 0 errors; `npm --prefix holonovel run
      test:all` → 56 commands. Commit.

## Close

- [ ] D1 `aar.md` — findings with terminal dispositions; end `LOOP PAUSED`.
- [ ] D2 `npm run session:close`.
- [ ] D3 Report the commit list and the unpushed/publish status (informational).
