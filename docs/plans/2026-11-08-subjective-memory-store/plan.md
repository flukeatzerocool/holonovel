# Plan — Subjective memory store (GM-only)

Session 2026-11-08. Roadmap item: "Subjective memory store (GM-only)" —
`ROADMAP.md:15-25`, chunk 1 of 5. Source vocabulary: `docs/upstream/cof.md`.

## Questions

- The user asked: "draft plan for roadmap item 1/5."
- What is the smallest increment that meets the roadmap's own trigger
  (`ROADMAP.md:23-25`): `check:fast` green, the new REQs cited in server source
  with passing tests, and the coverage register listing them as evidenced?

## Baseline (measured this session)

- `npm run status` → version 2026.11.07, 2 unpushed commits, 5 open roadmap items.
- `npm run check:fast` → **FAIL**: 35 passed, 1 failed. The only red gate is
  `check-loop-artifacts`: `2026-11-08-license-compliance: missing aar.md`. That
  directory is untracked (`git status` → `?? docs/plans/2026-11-08-license-compliance/`)
  and belongs to a prior, unclosed session.
- `typecheck` PASS; every other fast gate PASS.
- Pre-existing spec drift, not introduced here and corrected in scope below:
  T425/T439 still say "38 groups" while §7.7 holds 40 (`spec/03-build.md:658`
  says 40), and `spec/build-phase-map.md:51` says "33 subsections" while §5 has
  34 headings.

## Why

The chunk-1 capability does not exist: no REQ, property group, config, tool
action, or state field names subjective memory.

| Claim | Evidence |
|---|---|
| No subjective-memory surface anywhere | `grep -rn "subjective" spec/ holonovel/src` → no match |
| Closest structural precedent (append-only, per-entity, ordinal-bound, capped) | `spec/02-requirements.md:4306-4324` (§5.32/§5.33); `holonovel/src/core/perception.ts` |
| Novel property-group table and archetype examples | `spec/04-runtime.md:253-286`, `:384-385` |
| Existing §7.7 coupling rows (none for Ruling Ledger — precedent for a group with no row) | `spec/04-runtime.md:265`, `:587-596` |
| Property-group count statement | `spec/03-build.md:658` |
| GM briefing composition and the section hook | `holonovel/src/index.ts:13044`, `:2185-2203` |
| `spec_health` counts and storage-cap status | `holonovel/src/index.ts:11244-11253` |
| Player-scope redaction list | `holonovel/src/index.ts:9685-9692` |
| REQ-407 persist-tools rendering | `holonovel/src/index.ts:13298-13303` |
| `manage_belief` schema and handler block | `holonovel/src/index.ts:7720-7743`, `:8555-8610` |
| Novel serialize / deserialize / migrate | `holonovel/src/core/state.ts:729-730`, `:1510`, `:2664`, `:2685`, `:2830`, `:2864` |
| COF vocabulary and the promised §5.35 attribution | `docs/upstream/cof.md:20-35` |
| Tool-surface documentation that lists `manage_belief` actions | `holonovel/AGENTS.md:101` |
| Next free identifiers | max REQ-622, max T742 → REQ-623–628, T743–747 |

## Scope

**In scope**

1. §5.35 "Subjective Memory" preamble (with the COF credit) and REQ-623–REQ-628.
2. §7.7 property group `Subjective Memory` (Narrative-memory), plus the
   archetype example list and the 40 → 41 group-count statements.
3. Two §7.6 configs: a storage cap and a briefing-count cap.
4. §5.19 guardrails (REQ-400, REQ-407) and briefing composition
   (REQ-109c3, REQ-109e) name the new surface.
5. §4 glossary row; §5 section map row; Appendix A REQ index; Appendix T tests;
   `spec/build-phase-map.md` subsection count 33 → 35.
6. Implementation: `holonovel/src/core/subjective.ts`, Novel field and
   persistence, `manage_belief (action: subjective_record|subjective_list)`,
   the `## Subjective Memory` GM briefing section, `spec_health` count,
   Player-scope redaction.
7. Tests T743–T747 in `holonovel/scripts/test-belief.ts`.
8. Registers and docs: ROADMAP item removed, DECISIONS entry, CHANGELOG,
   coverage register, tool definitions, surface baseline, `holonovel/AGENTS.md`.

**Out of scope** (each belongs to a later roadmap chunk; recorded, not scheduled)

- Divergence verdicts, the GM truth view, and the `[divergence]` marker (chunk 2).
- The `open` / `guarded` / `secret` disclosure axis and Player-badge reads (chunk 3).
- Psyche-depth identity facets (chunk 4).
- Scored budgeted recall, `[truncated]` / `[evicted]` reporting, consolidation,
  and the subjective probe family (chunk 5).
- COF `fidelity` and multimodal traces; promotion into knowledge, belief, or
  campaign memory; a new tool.

## Decisions

- **D1 — A §7.7 property group, no new §7.7.1a row.** The store is Novel-tier
  state with an archetype per REQ-374a/b. This increment defines no
  cross-property effect, so no coupling row is honest; Ruling Ledger
  (`spec/04-runtime.md:265`) is the precedent, and T439 requires archetype
  usage rather than a row per group. Rejected: a synthetic
  Subjective Memory → Lore row (it would assert knowledge promotion, which
  chunk 3 explicitly withholds).
- **D2 — Append-only, ordinal-bound, undo-preserved.** Records leave the
  snapshot and checkpoint payloads (`state.ts:2685`, `index.ts:10272-10275`) and
  join `APPEND_ONLY_STATE_FIELDS` (`state.ts:2864`), mirroring perception.
  Correction is a new record, never an edit. Rejected: mutable records restored
  by undo — a memory would silently change when the player rewinds, while the
  event log it cites does not.
- **D3 — Game Master only, both directions, for this increment.** Mutation
  requires the GM badge and every read refuses `[FORBIDDEN]` otherwise. Chunk 3
  opens the Player badge through the disclosure axis. Rejected: shipping a
  read-only Player view now (that is chunk 3's contract, and it would need the
  disclosure field to be safe).
- **D4 — Record shape is the roadmap's four fields plus provenance.** Owning
  entity, event ordinal, gist, claim (subject, predicate, object, polarity),
  `felt_then`, 0..1 salience, origin (`witnessed` | `told` | `inferred` |
  `authored`), stable id, and an audit timestamp. Rejected: COF `fidelity` and
  separate where/who fields (nothing in chunk 1 or 2 reads them; the claim
  triple already carries actor and location assertions and the ordinal
  recovers the event's recorded scene and participants).
- **D5 — Actions live on `manage_belief`.** `subjective_record` and
  `subjective_list` sit beside the perception actions that already own
  per-entity mental state. Rejected: a `manage_context (action: memory)` reader
  (that enum already carries 16 actions and its recap/health actions are
  decoded separately) and a new tool (REQ-429 budget churn for two actions).
- **D6 — Deterministic capped selection.** Descending salience, then
  descending event ordinal, then ascending record id; at most
  `TTRPG_SUBJECTIVE_MEMORY_BRIEFING_MAX` records. The cap is classified
  Presentation — non-behavioral because it bounds output volume, not story
  state (precedent: `TTRPG_SEARCH_MAX_TOKENS`, `TTRPG_NOVEL_PREVIEW_CHARS`).
  Rejected: recency-only selection (it discards the salience the field exists
  to record) and a scored model (chunk 5 owns scoring).
- **D7 — The section covers entities present in the current scene and renders
  after `## Campaign Memory`, GM only.** Rejected: every entity's memory (the
  section would grow with the cast and leak absent NPC mental state into the
  narration path).
- **D8 — The `spec_health` count is GM-gated.** Mirrors `ruling_ledger_count`
  (`index.ts:11253`); a Player-visible count would disclose secret memory
  before chunk 3 defines the disclosure axis.
- **D9 — No new tool and no REQ-137a row.** `manage_belief`'s schema grows, so
  `holonovel/tool-definitions.json` and `spec/audit/tool-surface-baseline.json`
  are regenerated; the REQ-429 budget is unchanged.
- **D10 — COF attribution lands in the §5.35 preamble**, as
  `docs/upstream/cof.md` promises; the Appendix U row already exists
  (`spec/appendices-licenses.md:21`).

## Contract changes

```ts
// holonovel/src/core/subjective.ts (new)
export type MemoryOrigin = "witnessed" | "told" | "inferred" | "authored";

export interface MemoryClaim {
  subject: string;
  predicate: string;
  object: string;
  polarity: "positive" | "negative";
}

export interface SubjectiveMemoryRecord {
  id: string;                 // "sm-<n>"
  entity_id: string;
  event_ordinal: number | null;
  gist: string;
  claim: MemoryClaim;
  felt_then: string;
  salience: number;           // 0..1
  origin: MemoryOrigin;
  at: string;                 // audit only; never ordered on
}

export const MEMORY_ORIGINS: MemoryOrigin[];
export function normalizeSubjectiveRecord(raw: any): SubjectiveMemoryRecord;
export function nextSubjectiveId(records: SubjectiveMemoryRecord[]): string;
export function selectForBriefing(
  records: SubjectiveMemoryRecord[],
  presentEntityIds: Set<string>,
  max: number,
): SubjectiveMemoryRecord[];
```

```ts
// holonovel/src/index.ts — schema additions on manage_belief
subjective_entity, subjective_gist, subjective_subject, subjective_predicate,
subjective_object, subjective_polarity, subjective_felt_then,
subjective_salience, subjective_origin, subjective_event_ordinal
```

The stored shape is additive: a pre-change Novel loads with
`subjective_memory: []`.

## Exact requirement prose (Phase 1)

**REQ-623 — Subjective memory record.**
THE server SHALL maintain, for each player character and named NPC, an
append-only subjective-memory store whose records carry the owning entity, the
contributing event-log ordinal, a gist, a structured claim of subject,
predicate, object, and polarity, the entity's affect at the event, a 0..1
salience, and an origin of witnessed, told, inferred, or authored. A record
SHALL hold what the entity remembers and SHALL NOT hold or rewrite objective
state. *Acceptance criterion:* recording a memory appends a record carrying its
entity, ordinal, gist, claim, affect, salience, and origin. _Check:_ T743.

**REQ-624 — Subjective memory recording.**
`manage_belief (action: subjective_record)` SHALL record one subjective memory
for an entity, accepting `subjective_entity`, `subjective_gist`,
`subjective_subject`, `subjective_predicate`, `subjective_object`,
`subjective_polarity`, `subjective_felt_then`, `subjective_salience`,
`subjective_origin`, and `subjective_event_ordinal`. A missing entity, gist, or
claim part SHALL return `[ERROR] [INVALID_INPUT]` with the valid values
enumerated. The event ordinal SHALL default to the latest event-log ordinal and
SHALL NOT exceed it. Mutation SHALL require the Game Master badge. *Acceptance
criterion:* a well-formed record appends one entry, a malformed record is
refused with valid origins enumerated, and a Player call is refused.
_Check:_ T743, T744.

**REQ-625 — Subjective memory read and gating.**
`manage_belief (action: subjective_list)` SHALL return the records for one
entity or one event ordinal in record order and SHALL NOT mutate state.
Subjective-memory reads and writes SHALL be Game Master only: a Player or
Observer read SHALL return `[FORBIDDEN]`, and a read SHALL NOT advance the
event log. *Acceptance criterion:* a Game Master entity query returns only that
entity's records; Player and Observer reads return `[FORBIDDEN]` and leave the
cursor unchanged. _Check:_ T744.

**REQ-626 — Deterministic briefing selection.**
WHEN `badge_briefing` composes Game Master content, THE server SHALL render a
`## Subjective Memory` section after `## Campaign Memory` covering entities
present in the current scene. Records SHALL be selected by descending salience,
then descending event ordinal, then ascending record identifier, and SHALL
render at most `TTRPG_SUBJECTIVE_MEMORY_BRIEFING_MAX` records (§7.6). The
section SHALL NOT render under the Player or Observer badge, and two renders of
unchanged state SHALL be identical. *Acceptance criterion:* two renders of
unchanged state return the same ordered section and a Player render omits it.
_Check:_ T745.

**REQ-627 — Persistence and retention.**
Subjective-memory records SHALL persist with the Novel, survive a restart, and
travel with clone and export operations, bounded by
`TTRPG_SUBJECTIVE_MEMORY_MAX_ENTRIES` (§7.6) with oldest-first eviction. Under
the Game Master badge, `spec_health` SHALL report `subjective_memory_count`, the
total number of records across all entities. *Acceptance criterion:* a record
survives an end-and-resume cycle, a cap overflow evicts the oldest record, and
the health report carries the count. _Check:_ T746.

**REQ-628 — Separation from recorded state.**
Recording a subjective memory SHALL NOT create or alter a perception, an
evidence record, a belief stance, a campaign-memory fact, or an event-log entry,
and reconciliation SHALL NOT rewrite a subjective-memory record. *Acceptance
criterion:* recording a memory leaves perceptions, evidence, stances,
campaign-memory facts, and the event-log cursor unchanged, and a reconcile
leaves the memory unchanged. _Check:_ T747.

## Phases

1. **Spec section.** Insert `### 5.35 Subjective Memory` before
   `#### End of requirements` (`spec/02-requirements.md:4357`) with a preamble
   carrying the COF credit, then REQ-623–REQ-628 with the prose above.
2. **Spec cross-references.** §5 map row (`spec/02-requirements.md:42`);
   REQ-109c3 and REQ-109e name the section; §7.7 property row after Perception
   Ledger (`spec/04-runtime.md:286`); the archetype example list (`:385`);
   §7.6 configs after `TTRPG_PERCEPTION_MAX_ENTRIES` (`:214`); §5.19 REQ-400 and
   REQ-407 name the surface; §4 glossary row
   (`spec/01a-constitution.md:173`); counts 40 → 41 (`spec/03-build.md:658`,
   T425 `:1843`, T439 `:1857`), which also corrects the stale 38; build-phase-map
   33 → 35 (`spec/build-phase-map.md:51`), which also corrects the stale 33.
3. **State.** New `holonovel/src/core/subjective.ts`; `NovelState.subjective_memory`
   plus init, migrate, `novelToJSON`, `novelToSnapshotJSON`, `APPEND_ONLY_STATE_FIELDS`;
   checkpoint capture deletes the field alongside the other append-only logs.
4. **Actions.** `manage_belief` enum, parameters, and handlers beside the
   perception block (`index.ts:8555-8610`); audit entries (`subjective_record`);
   badge gating; tool description trimmed to the 1000-byte budget.
5. **Briefing and health.** `composeSubjectiveMemorySection` beside
   `composeCampaignMemorySection` (`index.ts:2185`), rendered at `:13044`;
   `subjective_memory_count` and the storage-cap row at `:11244-11250`;
   `subjective_memory` added to `PLAYER_OMITTED_KEYS` (`index.ts:9685-9692`);
   the REQ-407 persistence line names the actions (`index.ts:13302`).
6. **Tests.** T743–T747 in `holonovel/scripts/test-belief.ts`; run
   `npm run test:belief` from `holonovel/`.
7. **Registers and docs.** Remove the ROADMAP section; add a DECISIONS entry
   (append-only, GM-only, no coupling row); `holonovel/AGENTS.md:101` action
   list; regenerate `tool-definitions.json`; `surface-budget --write`;
   `validate -- --write-register`; CHANGELOG; plan/tasks/AAR.
8. **Verify and close.** `npm run assemble && npm run check:fast` un-piped,
   `npm run build-order`, `HOLONOVEL_IMPL_STRICT=1 npm run validate`; then
   `npm run session:close` as one spec increment commit.

## Blast radius

| File | Change | Size |
|---|---|---|
| `spec/02-requirements.md` | §5.35 + six REQs, §5 map row, REQ-109c3/109e, REQ-400/407 | L |
| `spec/04-runtime.md` | property row, archetype example, two §7.6 configs | M |
| `spec/01a-constitution.md` | §4 glossary row | S |
| `spec/03-build.md` | 40 → 41 group count | S |
| `spec/appendices-reference.md` | REQ index, T743–T747, T425/T439 count correction | M |
| `spec/build-phase-map.md` | 33 → 35 subsections (content hash advances) | S |
| `holonovel/src/core/subjective.ts` | new module | M |
| `holonovel/src/core/state.ts` | field, init, migrate, serialize, snapshot, append-only | M |
| `holonovel/src/index.ts` | schema, handlers, briefing, health, redaction, persist line | L |
| `holonovel/scripts/test-belief.ts` | T743–T747 | M |
| `holonovel/AGENTS.md` | `manage_belief` action list | S |
| `holonovel/tool-definitions.json` | regenerated | S |
| `spec/audit/tool-surface-baseline.json` | re-recorded footprint | S |
| `spec/audit/req-coverage.md` | regenerated; REQ-623–628 evidenced | S |
| `ROADMAP.md` | item removed | S |
| `holonovel/DECISIONS.md` | decision entry | S |
| `CHANGELOG.md` | dated entry | S |
| `holonovel.md`, `holonovel/holonovel.md` | assembled | S |
| `docs/plans/2026-11-08-subjective-memory-store/` | plan, tasks, AAR | S |

## Expected cascading failures

- `check-markers` / contract fingerprints advance after assembly — regenerate
  with `npm run build-order`, not by hand.
- `check-tool-definitions-sync` fails until `generate-tool-definitions.ts`
  runs.
- `surface-budget` fails until the baseline is re-recorded.
- `action-conflicts` may flag `subjective_list` vs an existing read action;
  resolve by renaming the action, not by excluding it.

## Done bar

`npm run check:fast` prints `check:fast: PASS` (35 + gates, 0 failed) on the
un-piped command; `npm run build-order` reports 0 errors; `npm run test:belief`
passes with T743–T747; `HOLONOVEL_IMPL_STRICT=1 npm run validate` passes with
REQ-623–628 counted evidenced; the ROADMAP item is removed; the plan, tasks,
and AAR exist and the AAR ends `LOOP PAUSED`.

## Open questions

1. **Blocking:** `docs/plans/2026-11-08-license-compliance/` is untracked and
   has no `aar.md`, so `check:fast` is red before any edit. Per the AGENTS
   routine a red baseline is fixed first, as its own commit. That session's AAR
   is not this plan's to write; the operator should either close it
   (`npm run session:close` after writing its AAR) or delete the directory.
2. Should `subjective_list` also surface through `manage_context (action: recap)`
   for the GM? Proposed: no in chunk 1 — the briefing section is the narration
   path and recap already packs the campaign tier.
3. Chunk 5 says it replaces "the minimal selection" — this plan deliberately
   ships a plain deterministic top-k so that replacement is a clean diff.
