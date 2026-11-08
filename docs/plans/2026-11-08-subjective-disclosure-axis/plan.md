# Plan — Subjective memory disclosure axis and Player exposure

Session 2026-11-08. Roadmap item: "Disclosure axis and Player exposure" —
`ROADMAP.md:15-24`, chunk 3 of the subjective-memory program (chunk 1 =
`2026-11-08-subjective-memory-store`, chunk 2 = `2026-11-08-memory-divergence-verdicts`).

## Questions

- The user asked: "draft plan for next roadmap item." The next unscheduled
  roadmap section is the disclosure axis (`ROADMAP.md:15-24`); the two sections
  below it are chunks 4 and 5 of the same program.
- What is the smallest increment that meets the roadmap's own trigger
  (`ROADMAP.md:22-24`): a secret memory influences the GM briefing, is redacted
  from a Player draft, and a Player read of another entity returns
  `[FORBIDDEN]`?

## Baseline (measured this session)

- `npm run status` → version 2026.11.08, 4 unpushed commits, 3 open roadmap
  items.
- `npm run check:fast` (un-piped) → **PASS**: 37 passed, 0 failed,
  `check:fast: PASS`. Tree clean at the session start.
- `typecheck` PASS inside `check:fast`.
- Next free identifiers: max REQ-633, max T752 → REQ-634–635, T753–T757.

## Why

The store exists and is deliberately GM-only: the record has no visibility
attribute, the read action refuses every non-GM caller, the briefing section
returns `""` for a non-GM badge, and player-scope export deletes the whole
array. Chunk 3 is the increment that makes the axis safe enough to open.

| Claim | Evidence |
|---|---|
| Record carries no disclosure field | `holonovel/src/core/subjective.ts:19-29` |
| Load normalization has no visibility default | `holonovel/src/core/subjective.ts:37-61` |
| Player and Observer reads refused today | `holonovel/src/index.ts:8723-8732` (comment at `:8724-8725` names this chunk) |
| GM briefing section is GM-only and untagged | `holonovel/src/index.ts:2209-2241` (`:2215` returns `""`) |
| Player-scope export omits the array wholesale | `holonovel/src/index.ts:9831-9842`, `:10049-10052` |
| Draft-scan target set has no memory source | `holonovel/src/index.ts:1102-1134` |
| Scan redaction and strict refusal | `holonovel/src/index.ts:9261-9282` |
| Briefing group is decision-critical (REQ-109) and named "(GM only)" | `spec/02-requirements.md:1302`, `:1308` |
| Current read/record/briefing/persistence contracts | `spec/02-requirements.md:4378-4419` |
| Scan match-set contract | `spec/02-requirements.md:1443-1444` |
| Player-safe bundle contract | `spec/02-requirements.md:3050` |
| §7.7 group row says "Game Master only" | `spec/04-runtime.md:289` |
| Glossary term has no disclosure axis | `spec/01a-constitution.md:174` |
| `manage_belief` is classified un-gated (per-action gating inside) | `holonovel/DECISIONS.md:767` |
| Append-only set, snapshot and checkpoint exclusion | `holonovel/src/core/state.ts:2873`, `:2692`; `holonovel/src/index.ts:10421` |
| Test catalogue tail and the chunk-2 harness | `spec/appendices-reference.md:2064-2071`; `holonovel/scripts/test-belief.ts:320-355` |

## Scope

**In scope**

1. A `disclosure` attribute (`open` | `guarded` | `secret`) on the record, with
   a fail-closed load default.
2. The three-level exposure matrix (D2) across GM briefing, Player briefing,
   Player read, and the draft scan.
3. `manage_belief (action: subjective_list)` opens to the Player badge for the
   active entity; a foreign entity id is `[FORBIDDEN]`.
4. `manage_belief (action: subjective_disclose)` reclassifies one record.
5. The draft scan gains memory targets derived from gist and claim.
6. Player-scope export filters the array instead of deleting it.
7. Spec: REQ-623/624/625/626/627 amendments, new REQ-634/635, REQ-109,
   REQ-096b, REQ-599b amendments; §5 map row `623–635`; §7.7.4 row; glossary;
   Appendix E/F rows.
8. Tests T753–T757, registers, DECISIONS, CHANGELOG, ROADMAP removal,
   `holonovel/AGENTS.md`, generated tool artifacts.

**Out of scope** (recorded, not scheduled)

- The `narrate` prompt (REQ-598) learning to carry memory: the GM briefing is
  the documented narration-shaping surface, and adding a Player-role exclusion
  clause there is a separate contract change.
- Observer-badge memory reads: the spectator contract is GM-visibility
  read-only (`spec/02-requirements.md:1267-1270`); opening it needs its own
  decision.
- Psyche-depth identity facets (roadmap chunk 4) and scored/budgeted recall
  (chunk 5).
- Promotion of a memory into knowledge, belief, or campaign memory (withheld
  since chunk 1, `docs/plans/2026-11-08-subjective-memory-store/plan.md:80-86`).
- `fidelity`/multimodal traces; any new tool; any new property group.

## Decisions

- **D1 — Disclosure is a record field; the load default is `secret`.** A
  record written before this increment carries no attribute, and the only
  behavior those records have ever had is GM-only. Defaulting them to
  `guarded` or `open` would publish previously-private content without a GM
  action. Rejected: a side table keyed by record id (a second persisted
  surface for one enum) and an origin-derived default (two rules where one
  suffices).
- **D2 — Three levels, four surfaces.**

  | disclosure | GM briefing | Player briefing (owner) | Player read (owner) | draft scan |
  |---|---|---|---|---|
  | `open` | full | gist, claim, affect | full record | not a target |
  | `guarded` | full, tagged | gist only | gist only | claim and affect |
  | `secret` | full, tagged | absent | absent | gist and claim |

  `guarded` exists to make "may be alluded to, never quoted" enforceable; a
  two-level axis would give `guarded` no behavior distinct from `secret` on the
  Player surfaces. Rejected: `open`/`secret` only (no middle level, and the
  roadmap names three) and treating `guarded` as "not scanned" (the level would
  then be a label with no gate behind it). For a `guarded` projection the
  retained fields are `id`, `entity_id`, `event_ordinal`, `gist`, `origin`,
  `disclosure`, `salience`, and `at` (metadata, not content); `claim` is
  cleared to empty strings and `felt_then` to `""`. The GM line tag prefixes
  the rendered line; REQ-632's `[divergence]` marker still appends after it.
- **D3 — Reclassification is `manage_belief (action: subjective_disclose)`.**
  The claim, gist, affect, ordinal, and id stay immutable; only the visibility
  attribute changes. The precedent is `manage_lore (action: reveal)`, which
  mutates visibility in place while leaving the fact alone. Rejected:
  re-recording the memory (produces two records with different disclosures for
  one memory, and duplicates the append-only history) and making disclosure
  write-once (every legacy record would be locked at `secret` with no remedy).
- **D4 — Player read scope is the active entity.** No `entity` parameter
  defaults to the active entity; an explicit foreign entity id returns
  `[FORBIDDEN]` (the trigger's third condition); Observer stays `[FORBIDDEN]`
  (out of scope, above). The ownership filter applies before the
  `event_ordinal` filter, so an ordinal query returns only the active entity's
  records at that ordinal. No active entity returns `[ERROR]
  [STATE_CONFLICT]` with a corrective action naming `manage_character
  (action: set_active)`. The Player briefing branch runs only for
  `badge === "player"`; `observer`, `game_master`, and `none` keep their
  current paths (`Badge` is `player | game_master | observer | none`,
  `holonovel/src/core/state.ts:72`).
  Rejected: a Player-shaped aggregate read (it would need its own pagination
  contract) and returning the empty list (indistinguishable from "this entity
  remembers nothing").
- **D5 — The Player briefing reuses the `## Subjective Memory` header.** The
  group is already decision-critical in REQ-109, so a second header would
  either duplicate the group or leave the existing one GM-only while a new one
  drifted. Selection reuses `selectForBriefing` restricted to the active
  entity, so the ordering and `TTRPG_SUBJECTIVE_MEMORY_BRIEFING_MAX` contract
  are unchanged. Rejected: folding memories into `knowledge_state` (mixes
  recorded knowledge with remembered gist and loses the deterministic
  ordering/cap contract) and a `## Known Memories` header (two names for one
  group).
- **D6 — Scan targets are derived text, not a synthetic key.** The record has
  no key field, so "secret memory keys" (`ROADMAP.md:20`) has no literal
  referent; the plan reads it as the record's quotable text: the `gist` and the
  `${subject} ${predicate} ${object}` claim. `guarded` contributes its claim
  and `felt_then` for the owning entity and gist plus claim for any other
  entity. The existing `key` flag stays false for these (content semantics:
  the ≥12-character floor and case-insensitive substring match apply).
  Rejected: hashing the record id into a key (a narrator never types `sm-7`, so
  the target would never match) and scanning `open` records (they are quotable
  by definition).
- **D7 — Player-scope export filters instead of omitting.** The bundle carries
  the active entity's `open` records in full and its `guarded` records with
  claim and affect stripped; `secret` records and every foreign entity's
  records are absent. Rejected: keeping the wholesale omission (the export
  would contradict the live Player read in the same release).
- **D8 — No new tool, no new property group, no new config.** Tool count stays
  37; `manage_belief` grows one action (15 → 16) and one parameter. The §7.7
  group is unchanged in identity, so the group count stays 41. Disclosure rides
  the existing audit entry (`subjective_disclose`) and the existing snapshot
  exclusion — undo does not revert a reclassification, matching the append-only
  treatment of the array (`state.ts:2692`).
- **D9 — The GM briefing tags non-open records.** A `[secret]` / `[guarded]`
  prefix tells the narrator what may not be quoted, which is what makes
  "shapes narration but is never quoted" actionable. Ordering, selection, and
  the cap are untouched, so two renders remain identical.
- **D10 — `subjective_verify` and `subjective_record` stay GM-only.** The truth
  view exposes the projection and the recorded facts behind it; the Player read
  is a disclosure-filtered view of the memory, not of recorded truth.
  Rejected: opening `subjective_verify` to the Player (it would disclose
  recorded state the Player never perceived).

## Contract changes

```ts
// holonovel/src/core/subjective.ts
export type MemoryDisclosure = "open" | "guarded" | "secret";
export const MEMORY_DISCLOSURES: MemoryDisclosure[];

export interface SubjectiveMemoryRecord {
  // …unchanged fields…
  disclosure: MemoryDisclosure;   // load default: "secret"
}

// Player-safe projection: the record for "open", the record with `claim` and
// `felt_then` cleared for "guarded", null for "secret". Pure; never mutates
// the input record.
export function playerProjection(r: SubjectiveMemoryRecord): SubjectiveMemoryRecord | null;

// Scan phrases for a record, given the active entity.
export function disclosureScanTargets(
  r: SubjectiveMemoryRecord,
  activeEntityId: string | null,
): Array<{ kind: string; phrase: string; key: false }>;
```

```ts
// holonovel/src/index.ts — manage_belief schema additions
subjective_disclosure: z.enum(["open", "guarded", "secret"]).optional()
  // subjective_record: default "secret"; subjective_disclose: required
subjective_record_id: z.string().optional()
  // subjective_disclose: required (the `sm-<n>` id; mirrors `evidence_id`)

// new action
"subjective_disclose"   // (subjective_record_id, subjective_disclosure)
                        // GM only; audit entry; unknown id -> [NOT_FOUND]
```

`manage_belief` description must stay inside the recorded byte budget in
`holonovel/tool-definitions.json` (currently 979 bytes after the chunk-2 trim;
the lint prints the budget). New prose replaces, not appends, where possible.

## Blast radius

| File | Change | Size | Rollback |
|---|---|---|---|
| `spec/02-requirements.md` | §5.35 REQ-623/624/625/626/627 amended; REQ-634/635 added; §5 map row `623–635`; REQ-109 `:1302`; REQ-599b `:1443`; REQ-096b `:3050` | L | 1 |
| `spec/04-runtime.md` | §7.7.4 Subjective Memory row: Player read, disclosure-filtered | S | 0 |
| `spec/01a-constitution.md` | Glossary row gains the disclosure axis | S | 0 |
| `spec/appendices-reference.md` | Appendix E rows for REQ-634/635; Appendix F T753–T757; traceability matrix | M | 0 |
| `spec/build-phase-map.md` | Not edited (no new subsection, no new phase dependency) — confirmed by the count gate | — | — |
| `holonovel.md` | Regenerated by `npm run assemble` | L | 0 |
| `holonovel/src/core/subjective.ts` | Disclosure type, normalization, `playerProjection`, `disclosureScanTargets` | M | 1 |
| `holonovel/src/index.ts` | Schema param + enum + description; record/list/disclose handlers; briefing render; scan targets; player-scope redaction | L | 1 |
| `holonovel/src/generated/contract-fingerprints.ts` | Regenerated by `npm run build-order` (the §7.7.4 row feeds the fingerprint) | S | 0 |
| `holonovel/tool-surface-registry.json` | `manage_belief.subjective_disclose` entry (hand-edited declaration) | S | 0 |
| `holonovel/tool-definitions.json` | Regenerated by `generate-tool-definitions.ts` | S | 0 |
| `holonovel/tool-routing.json` | Discovery step decides whether the new action needs a routing entry | S | 0 |
| `spec/audit/tool-surface-baseline.json` | Re-recorded by `surface-budget -- --write` | S | 0 |
| `spec/audit/tool-surface-replay.json` | Re-recorded only if `surface-replay --write` changes | S | 0 |
| `holonovel/DECISIONS.md` | Default-disclosure note, reclassification note, gate-classification note | S | 0 |
| `holonovel/AGENTS.md` | `manage_belief` action list gains `subjective_disclose`; no count change | S | 0 |
| `holonovel/scripts/test-belief.ts` | T753, T754, T755, T756, T757 | M | 0 |
| `holonovel/scripts/lib/holosuite-*.ts` | Line-pinned evidence anchors re-resolved after the `index.ts` edits (deviation) | S | 0 |
| `holonovel/content/torre-nosferatu.json` | Starter artifact rebuilt for the `DATA_FORMAT` bump (deviation) | S | 0 |
| `spec/audit/req-coverage.md` | Regenerated by `validate -- --write-register` | S | 0 |
| `CHANGELOG.md` | `2026-11-08` heading and bullets | S | 0 |
| `ROADMAP.md` | Remove the disclosure section | S | 1 |
| `docs/plans/2026-11-08-subjective-disclosure-axis/` | `plan.md`, `tasks.md`, `aar.md` | S | 0 |

No test fixture is added: T753–T757 build their records through the tool, so
the chunk-2 fixture format is untouched.

## Tasks (dependency order)

1. **Spec section.** Amend REQ-623/624/625/626/627 and add REQ-634/635 in
   `spec/02-requirements.md` §5.35; update the §5 map row to `623–635`; amend
   REQ-109 `:1302`, REQ-599b `:1443`, REQ-096b `:3050`; run
   `npm run assemble`. Verify each new or amended body against the validator's
   limits (one paragraph, no tables/bullets, ≤800 characters, ≤8 sentences)
   before running the gate.
2. **Appendix and glossary tables.** Appendix E rows for REQ-634/635, Appendix
   F rows T753–T757, §7.7.4 group row, §4 glossary row. Run
   `npm run assemble && npm run validate` — the traceability matrix, coverage
   audit, and cross-reference checks are the target.
3. **Core module.** `holonovel/src/core/subjective.ts`: `MemoryDisclosure`,
   `MEMORY_DISCLOSURES`, the `secret` load default in
   `normalizeSubjectiveRecord`, `playerProjection`, `disclosureScanTargets`,
   with the REQ citations in the header. Pure functions only.
4. **Tool schema and handler.** `manage_belief`: add the parameter, the action
   enum entry, the routing prefix (already covered by `subjective_`), and the
   dispatch. Enforce: record default `secret`, `[INVALID_INPUT]` on an unknown
   value, `subjective_disclose` GM-only with a `[NOT_FOUND]` for an unknown
   record id, Player `subjective_list` scoping per D4, Observer unchanged.
   Grep for sibling REQs binding `subjective_list`/`subjective_record` and
   confirm none conflicts before editing (sibling-contract check).
5. **Briefing.** `composeSubjectiveMemorySection`: GM tag (D9); Player branch
   with the D2 matrix, active-entity scope, and the existing selection and cap.
   Keep the empty-state contract (no section when nothing renders).
6. **Draft scan.** `collectVisibilityTargets` gains the
   `disclosureScanTargets` rows. Confirm the existing ≥12-character content
   floor and the case-insensitive replace path are unchanged for every other
   source.
7. **Player-scope export.** Replace the `subjective_memory` entry in
   `PLAYER_OMITTED_KEYS` with a filtered projection in `redactNovelForPlayer`
   (D7), reached through `manage_archive (action: export, scope: "player")`.
   Confirm `exportNovelJSON` still includes the full array.
8. **Tests.** T753–T757 in `holonovel/scripts/test-belief.ts`, one per trigger
   condition and one per reclassification path. Each asserts the negative
   branch too (open memory not scanned, GM read unscanned, foreign entity
   refused).
9. **Regenerated artifacts.** `cd holonovel && npx tsx scripts/generate-tool-definitions.ts`
   (writes `tool-definitions.json`), `npm run surface-budget -- --write`,
   `npx tsx scripts/surface-replay.ts --write` if the check reports a delta,
   `npm run validate -- --write-register`, `npm run assemble`.
10. **Docs and registers.** DECISIONS entry (default disclosure; reclassification
    is not rolled back by undo; `manage_belief` stays un-gated in the
    gate-classification table while the new actions are per-action gated) plus
    by-design limitations for the two deferrals (the `narrate` prompt and
    Observer reads). `holonovel/AGENTS.md` action list. CHANGELOG under the
    heading date the version gate pins — `2026-11-08` at the current version
    `2026.11.08`; `build-order`/`version-bump` owns any advance. ROADMAP section
    removal, plus a grep of `spec/audit/review-register.md` for a
    `Scheduled-roadmap` row naming this item (none found at drafting time;
    update in the same step if one exists — `check-registers` gates the
    cross-reference). Coverage register current.
11. **Close.** Un-piped `npm run check:fast`; `cd holonovel && npm run
    test:belief`; `cd holonovel && npm run test:briefing`; `cd holonovel && npm
    run test:all`; `npm run build-order` (regenerates
    `holonovel/src/generated/contract-fingerprints.ts`; `check-fingerprint-sync`
    decides); `HOLONOVEL_IMPL_STRICT=1 npm run validate`; `npm run
    session:close`.

## Verification

| Step | Command | Pass condition |
|---|---|---|
| Spec assembly | `npm run assemble` | 0 errors |
| Fast gate | `npm run check:fast` (un-piped) | `check:fast: PASS`, 37/37 or more |
| Belief suite | `cd holonovel && npm run test:belief` | 0 failed; T753–T757 named |
| Briefing suite | `cd holonovel && npm run test:briefing` | 0 failed; scan tests still pass |
| Full server suite | `cd holonovel && npm run test:all` | 0 failed |
| Fingerprints | `npm run build-order` | "Ready to commit"; `contract-fingerprints.ts` refreshed and `check-fingerprint-sync` PASS |
| Implementation coverage | `HOLONOVEL_IMPL_STRICT=1 npm run validate` | 0 errors; REQ-634/635 evidenced |
| Tool artifacts | inside `check:fast` | `check-tool-definitions-sync`, `tool-definitions-lint`, `surface-budget`, `surface-replay` PASS |
| Loop artifacts | `npm run check-loop-artifacts` | plan/tasks/AAR present, LOOP token terminal |

**Done bar:** All of the following, in one session: the trigger's three
conditions each demonstrated by a named test (secret memory renders tagged in
the GM briefing; a Player-audience draft quoting it is redacted; a Player read
of a foreign entity returns `[FORBIDDEN]`); `check:fast` PASS un-piped;
`HOLONOVEL_IMPL_STRICT=1 npm run validate` 0 errors; the roadmap section gone
and the changelog carrying it; AAR terminating `LOOP PAUSED` or `LOOP OPEN`.

## Risks and rollback

| Risk | Mitigation |
|---|---|
| A new REQ body overruns 800 characters / 8 sentences | Count before assembling; the amended bodies are short clauses, the new REQs are single-control |
| `manage_belief` description exceeds the recorded budget | Replace text rather than append; the lint prints the measured size |
| Player-scope export regresses to leaking secret records | T757 asserts the export path; the D2 matrix is applied in one helper used by both the read and the export |
| A guarded record's gist renders where the claim was expected | `playerProjection` is the single projection point; the briefing and the export both consume it |
| The scan false-positives on ordinary prose | Targets are the record's own text (≥12 characters), same as existing content targets; T756 asserts a clean draft is unchanged |
| Fingerprint drift after the §7.7 edit | `npm run build-order` is a named task step, not a post-commit chore; `holonovel/src/generated/contract-fingerprints.ts` is in the blast radius |
| Reclassification is not undone by `manage_history` | Documented in DECISIONS and asserted in T757 (the array is append-only) |

Rollback cost: 1. The record field is additive, old files load (fail-closed
default), and reverting the schema leaves the extra field inert.

## User impact

- A GM can now set disclosure at record time and reclassify later.
- A Player badge sees its own entity's memories at the level the GM allowed,
  and gets `[FORBIDDEN]` asking about anyone else.
- Existing novels behave exactly as before (all records normalize `secret`).
- No new config, no restart semantics, no data migration.

## Deviations (recorded during execution)

- **REQ-096k, not REQ-096b, carries the player-bundle detail.** The player-scope
  filter belongs in the part that defines the player-safe bundle; REQ-096b
  already routes to it (`spec/02-requirements.md:3051`).
- **REQ-624's parameter list was compressed** to "the remaining `subjective_*`
  parameters" once `subjective_disclosure` was added: the enumerated list plus
  the new clause exceeded the 800-character body limit. The schema still names
  every parameter; the body keeps the required inputs and the disclosure rule.
- **T744, T745, and T746 were amended** in the same increment. Their prior text
  encoded the GM-only contract this increment replaces (a Player read refused, a
  Player render empty, a record with no level); leaving them would make the
  catalogue contradict the amended REQs.
- **The `share: true` scope concern raised at plan review is closed, not a
  finding.** REQ-096m already refuses `share` with a non-`full` scope
  (`holonovel/src/index.ts:10078`), so the `full` precedence at `:10010` cannot
  turn a requested player export into a full one.
- **The holosuite evidence anchors were re-resolved.** Five harness predicates
  pin `holonovel/src/index.ts` line numbers; the edits shifted them and the
  evidence gate correctly refused a stale anchor. Each anchor moved to the
  nearest non-comment line carrying its token (11 anchors across four tier
  files), and all four tiers pass again.
- **The starter artifact was rebuilt.** Adding `disclosure` to a §7.7 property
  group changes `DATA_FORMAT`, which `holonovel/content/torre-nosferatu.json`
  embeds; `npm run build:starter-novel` rewrote that one line and
  `check-starter-freshness` is green again. This is the record-shape cost the
  chunk-1 plan flagged in its Open questions.

## Open questions

1. **Should `guarded` withhold the claim from the Player read or only from the
   briefing?** This plan withholds it from both (D2), so "never quoted" holds
   wherever the Player looks. If the maintainer prefers a full Player read with
   briefing-only suppression, that is a one-line matrix change and a test edit.
2. **Observer reads.** Left closed. If the spectator seat should inherit the
   GM-level memory view, that is a separate contract change to REQ-135.
3. **Whether the `narrate` prompt should carry the GM memory section.** Out of
   scope here; the briefing remains the narration-shaping surface.
