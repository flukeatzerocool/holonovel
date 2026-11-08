# Plan — Memory divergence verdicts

Session 2026-11-08. Roadmap item: "Memory divergence verdicts" — `ROADMAP.md:15-25`,
chunk 2 of 5. Chunk 1 (the subjective-memory store) shipped at `83d7c86`.

## Questions

- The user asked: "draft plan for next roadmap item."
- What is the smallest increment that meets the roadmap's own trigger
  (`ROADMAP.md:23-25`): a fixture with a deliberately wrong memory returns the
  expected verdict, recomputation is identical, and the event log is unchanged —
  with `check:fast` green and the new REQs evidenced?

## Baseline (measured this session at `83d7c86`)

- `npm run status` → version 2026.11.08, 4 open roadmap items, 2 unpushed
  commits (`83d7c86`, `8822d66`), last publish 2026-11-07T20:30:06.731Z.
- `npm run check:fast` → **PASS**: 37 passed, 0 failed, `check:fast: PASS`
  (un-piped, exit 0, log kept at `/tmp/opencode/check-fast.log`).
- Working tree clean; `npm run status` lists no uncommitted change.
- This plan's own increment directory carries a placeholder `aar.md` ending
  `LOOP OPEN`, so `check-loop-artifacts` passes while the work is scheduled.
  Execution replaces it with the real AAR.

## Why

Chunk 1 records what an entity remembers; nothing checks whether a record is
true. The capability does not exist in any form today.

| Claim | Evidence |
|---|---|
| No divergence surface anywhere | `grep -rn "divergence" holonovel/src` → only REQ-603 state-hash verification (`index.ts:8729`) |
| Record shape the check consumes | `holonovel/src/core/subjective.ts:19-29` (claim triple + polarity + `felt_then` + `event_ordinal`) |
| Claim identity helper already exists | `holonovel/src/core/belief.ts:48-55` (`normalizeToken`, `questionKey`) |
| Predicate-family precedent | `holonovel/src/core/belief.ts:45-62` (`VOLATILE_PREDICATES`, `beliefFamily`) |
| Truth sources available in state | `holonovel/src/core/state.ts:617` (relationships), `:632` (campaign memory), `:157-158` (NPC contacts/dispositions), `:599-601` (scene presence), event log `event-log.ts:7-23`, story journal `state.ts:612` |
| Event log kinds are coarse and free-text | `index.ts:5901` (scene), `:7527` (story), `:8899` (event) — no structured outcome field |
| Replay does not reconstruct state | `index.ts:8811` returns log text + nearest checkpoint (`REQ-604`), not a state projection |
| Read action routing seam | `index.ts:7804-7805` (`mergeScopedArgs(args, "subjective")`), handler `:8661-8727` |
| Briefing section seam | `index.ts:2207-2231` (`composeSubjectiveMemorySection`) |
| GM-only gate precedent | `index.ts:8667-8670`, `:9800-9801` (`PLAYER_OMITTED_KEYS`) |
| Tool description headroom | `manage_belief` description is **984 bytes** of the 1000-byte lint budget (`holonovel/tool-definitions.json`) |
| Registry entry shape | `holonovel/tool-surface-registry.json:664-697` (`subjective_list` / `subjective_record`) |
| Fixed-table precedent | `spec/appendices-reference.md:3067` (O.11), `:3094` (O.12) |
| Appendix M placement rule | "Return-value field enumerations → Appendix O"; "algorithms → builder's implementation judgment" (`spec/appendices-reference.md:2887-2912`) |
| Next free identifiers | max REQ-628, max T747 → REQ-629–633, T748–752 |

## Scope

**In scope**

1. §5.35 additions REQ-629–REQ-633: truth projection, verdict computation, the GM
   truth view, the `[divergence]` briefing marker, and the divergence probes.
2. Appendix O.13: the fixed predicate-family, affect-valence, and outcome-opposition
   tables the verdict contract references (Appendix M forbids restating them in
   REQ bodies).
3. §5 map row `623–628` → `623–633`; Appendix E manifest rows; Appendix F test
   rows T748–T752; T91's O.1–O.8 range names O.13.
4. Implementation: `holonovel/src/core/divergence.ts`, the
   `manage_belief (action: subjective_verify)` read action, the briefing marker,
   and the description trim inside the existing byte budget.
5. Tests T748–T751 in `holonovel/scripts/test-belief.ts`; T752 plus the probe
   fixture in `holonovel/scripts/fixtures/subjective-divergence.json`, evaluated by
   `holonovel/scripts/test-memory-recall.ts` (REQ-593 harness).
6. Registers and docs: ROADMAP item removed, DECISIONS entry, CHANGELOG,
   coverage register, tool definitions, surface baseline, `holonovel/AGENTS.md`.

**Out of scope** (each belongs to a later roadmap chunk; recorded, not scheduled)

- The `open` / `guarded` / `secret` disclosure axis and Player-badge reads
  (chunk 3).
- Psyche-depth identity facets (chunk 4).
- Scored budgeted selection, retention consolidation, and the subjective
  **recall@budget** probe family with its declared floor (chunk 5). This
  increment ships verdict probes, not selection probes (D7).
- Any new persisted field, migration, checkpoint change, or starter rebuild.
- Promotion of a memory into knowledge, belief, or campaign memory; a new tool.

## Decisions

- **D1 — Verdicts are derived on read and never stored.** The check recomputes
  from recorded state at call and render time; no Novel field, migration, or
  checkpoint capture changes. Evidence: the roadmap trigger demands
  "recomputation is identical"; REQ-628 forbids rewriting recorded state.
  Rejected: storing the verdict on the record — a stored verdict goes stale the
  moment recorded state changes while the memory does not, and correcting it
  would require an edit to an append-only record.
- **D2 — The six roadmap verdicts are the divergence vocabulary; `unverifiable`
  is a separate insufficient-record outcome.** A claim the projection cannot
  resolve (unknown predicate family, no matching fact, evicted anchor) reports
  `unverifiable` and never renders a `[divergence]` marker. Rejected: forcing
  absence into `misattributed` — it would assert a divergence the record does
  not support, which is worse than admitting the record cannot decide.
- **D3 — The projection reads current recorded state plus event- or scene-anchored
  sources; it does not reconstruct state at the anchor.** Evidence: replay returns
  log text and the nearest checkpoint, not a state projection (`index.ts:8811`,
  REQ-604), and checkpoints are discrete and GM-created. Rejected: a replay-based
  historical projection — chunk 2 would need a state machine that chunk 1 does not
  have, and the roadmap trigger is determinism, not then-truth.
- **D4 — One new read action, no new tool and no new parameter.**
  `manage_belief (action: subjective_verify)` reuses `subjective_entity` and
  `subjective_event_ordinal`, which `mergeScopedArgs` already maps to `entity` and
  `event_ordinal` (`index.ts:2831-2840`). Rejected: a `verdicts` flag on
  `subjective_list` (it would change chunk 1's read output) and a
  `manage_memory` tool (REQ-429 budget churn).
- **D5 — Fixed tables live in Appendix O.13.** Predicate family → recorded surface,
  affect valence terms, and outcome opposition pairs are fixed contract tables
  referenced from the REQ body. Rejected: restating the tables in a REQ (Appendix M
  forbids it; the 800-character body limit makes it impossible) and leaving the
  mapping entirely to the builder (a verdict without a declared mapping is not
  reproducible across builds, which is exactly what the trigger measures).
- **D6 — The marker is appended to the rendered line, not added to the record.**
  `- [witnessed] anna: The bridge held (felt proud) [divergence: false outcome]`.
  Rejected: a stored `divergence` field (contradicts D1).
- **D7 — The probe fixture is a verdict family, not a recall-at-budget family.**
  `ROADMAP.md:54-55` reserves "the subjective probe family and a declared floor" for
  chunk 5; this increment's roadmap line (`:21`) asks for "the subjective recall
  probes" now. Resolution: chunk 2 loads divergence probes through the REQ-593
  harness and fails on a wrong verdict; chunk 5 adds selection probes and the
  declared floor. Rejected: adding recall@budget probes now — selection scoring is
  chunk 5's contract and there is no floor to assert.
- **D8 — The check never touches a fingerprinted section.** §5.9, §5.16–§5.17,
  §6.3, §6.4.2, §7.7, §5.19, and Appendix Q are untouched, so
  `check-fingerprint-sync` should not move; `npm run build-order` is the authority
  and runs before the commit.

## Contract changes

```ts
// holonovel/src/core/divergence.ts (new)
// REQ-629, REQ-630, REQ-631, REQ-632, REQ-633

export type DivergenceVerdict =
  | "confirmed" | "misattributed" | "displaced"
  | "conflated" | "false_outcome" | "affect_drift";

/** A divergence verdict, or the insufficient-record outcome (D2). */
export type ClaimStatus = DivergenceVerdict | "unverifiable";

/** One fact the recorded state asserts (REQ-629). */
export interface TruthFact {
  subject: string;                 // normalized token
  predicate: string;               // family from the O.13 table
  object: string;                  // normalized token
  polarity: "positive" | "negative" | "neutral";
  source: string;                  // "relationship:a|b", "campaign:npcs:<at>", "event:4"
  anchor: number | null;           // event ordinal when the source is event-bound
}

export interface DivergenceResult {
  record_id: string;
  verdict: ClaimStatus;
  reason: string;                  // which rule fired, in one clause
  truth: TruthFact | null;         // the recorded fact the verdict rests on
}

export function projectTruthFacts(novel: NovelState): TruthFact[];
export function affectValence(text: string): -1 | 0 | 1;
export function checkRecord(
  record: SubjectiveMemoryRecord,
  facts: TruthFact[],
  novel: NovelState,
): DivergenceResult;
```

`subjective_verify` output (one JSON object per matching record; whole result is
`JSON.stringify(..., null, 2)` like `subjective_list`):

```json
{
  "record_id": "sm-3",
  "entity_id": "anna",
  "event_ordinal": 4,
  "gist": "Kael welcomed the party",
  "claim": { "subject": "kael", "predicate": "disposition", "object": "loyal", "polarity": "negative" },
  "verdict": "false_outcome",
  "reason": "recorded disposition is positive",
  "truth": {
    "subject": "kael", "predicate": "disposition", "object": "loyal",
    "polarity": "positive", "source": "npc:kael", "anchor": null
  }
}
```

The stored record shape is unchanged; a pre-change Novel loads and verifies
unchanged.

## Exact config and table rows (Phase 2)

No §7.6 config is added: the check is bounded by the existing subjective-memory
cap and briefing cap, and the projection is linear in entities, not in log
length.

Appendix O.13 (new, after O.12 at `spec/appendices-reference.md:3119`):

**O.13 — Subjective-memory divergence contracts:**

| Contract | Value |
|----------|-------|
| Predicate family `relationship` | `relationships`; polarity positive for ally, mentor, dependent, neutral for neutral, negative for rival, suspicious |
| Predicate family `disposition` | NPC record; polarity positive for friendly, loyal, neutral for neutral or unset, negative for hostile |
| Predicate family `presence` | scene presence set; positive |
| Predicate family `location` | entity location or current scene; positive |
| Predicate family `possession` | entity inventory; positive |
| Predicate family `outcome` | event log, story journal, campaign memory; polarity from the outcome opposition table |
| Affect valence, positive | glad, grateful, relieved, proud, delighted, hopeful, fond, warm, safe |
| Affect valence, negative | afraid, terror, terrified, angry, furious, ashamed, grief, despair, bitter, guilty, alone |
| Outcome opposition pairs | held/gave way, survived/died, opened/sealed, won/lost, rescued/abandoned, kept/broke, trusted/betrayed, welcomed/expelled |

Appendix M placement check: the table is fixed infrastructure referenced from
REQ-629, REQ-630, and REQ-632, not restated in a body.

## Exact requirement prose (Phase 1)

**REQ-629 — Recorded-state truth projection.**
THE server SHALL derive, from recorded Novel state, a deterministic set of
truth facts, each carrying a subject, a predicate family, an object, a
polarity, and the recorded source that asserts it. The projection SHALL draw on
the event log, story journal, campaign memory, relationships, NPC dispositions,
scene presence and location, and inventory, and SHALL carry an event-ordinal
anchor when its source is event-bound. The predicate families are fixed in
Appendix O.13. Derivation SHALL consult only Novel state — no model call,
network, or wall-clock input — and SHALL NOT mutate state, append an event, or
record an audit entry. *Acceptance criterion:* two derivations of unchanged
state return equal fact sets, and a recorded relationship change alters the
projected facts. _Check:_ T748.

**REQ-630 — Divergence verdicts.**
A divergence check SHALL compare a memory record's structured claim with the
truth projection (REQ-629) and return exactly one verdict: confirmed,
misattributed, displaced, conflated, false outcome, or affect drift. A claim no
recorded fact resolves SHALL report `unverifiable`, not a divergence. Verdicts
SHALL follow a fixed precedence, SHALL cite the recorded fact behind a
non-confirmed verdict, and SHALL classify affect against recorded relational
valence per Appendix O.13. The check SHALL NOT rewrite the memory, the event
log, or any other state; two checks of unchanged state SHALL agree. *Acceptance
criterion:* a deliberately wrong memory returns its expected verdict,
recomputation is identical, and the event-log cursor is unchanged. _Check:_
T749.

**REQ-631 — Game Master truth view.**
`manage_belief (action: subjective_verify)` SHALL return each matching
subjective-memory record beside its divergence verdict, the recorded fact the
verdict rests on, and that fact's recorded source, filtered by the entity or
event-ordinal parameters already carried by `subjective_list` and defaulting to
every record. The action SHALL be Game Master only, SHALL NOT mutate state or
advance the event log, and SHALL return identical output for unchanged state.
*Acceptance criterion:* a Game Master call returns a verdict and its recorded
source per record, a Player or Observer call returns `[FORBIDDEN]`, and two
calls return equal output. _Check:_ T750.

**REQ-632 — Divergence marker in the briefing.**
WHEN the Game Master briefing renders the `## Subjective Memory` section
(REQ-626), THE server SHALL append a `[divergence]` marker naming the verdict to
every rendered record whose verdict is a divergence, and SHALL render no marker
for a confirmed or unverifiable record. The marker SHALL derive from the same
check as REQ-630 and SHALL NOT change record selection, order, or the render
cap. *Acceptance criterion:* a divergent record renders with its verdict named,
a confirmed record renders without a marker, and two renders of unchanged state
are identical. _Check:_ T751.

**REQ-633 — Subjective divergence probes.**
The server distribution SHALL include a committed probe fixture whose records
carry deliberately wrong structured claims, each declaring its expected verdict,
and the recall-probe harness (REQ-593) SHALL evaluate every divergence probe and
fail when any expected verdict is not returned. The harness SHALL report the
verdict per probe, and a probe whose claim is unverifiable SHALL fail rather
than pass. *Acceptance criterion:* the committed fixture runs and fails on a
deliberately missed expected verdict. _Check:_ T752.

## Phases

1. **Spec section.** Insert REQ-629–633 after REQ-628
   (`spec/02-requirements.md:4427`), before `#### End of requirements`
   (`:4429`), extending §5.35; update the §5 map row (`:43`) to `623–633`.
2. **Appendix tables and registers.** Add O.13 after O.12
   (`spec/appendices-reference.md:3119`); update T91's "O.1–O.8" clause (`:1527`)
   to name O.13; add Appendix E manifest rows beside `:1382-1388` and Appendix F
   rows T748–T752 after `:2063`.
3. **Core module.** New `holonovel/src/core/divergence.ts` with a header citing
   REQ-629–REQ-633 (the `subjective.ts:1-6` precedent); import it in
   `holonovel/src/index.ts` beside line 45. No `holonovel/src/core/state.ts`
   change (D1).
4. **Sibling-contract check, then the action.** Grep `manage_belief` across
   `spec/` and confirm REQ-461–472, REQ-540–545, REQ-594, and REQ-623–628 bind
   no conflicting badge gate, error code, or enum semantics for a sibling read;
   record the result in this plan. Then add `subjective_verify` to the
   `manage_belief` action enum (`index.ts:7750`), the enum's describe string, the
   tool description, and the `subjective_` routing prefix (`:7804`); implement
   the case in `handleSubjectiveActions` (`:8661-8727`) as a GM-only read that
   recomputes the projection once per call. The full surface is the routing
   branch, the schema enum and describe string, the handler, and T748–T752; the
   storage seam is untouched (D1). Trim the description (`:7748`, currently 984
   bytes) so the whole description stays at or under 1000 bytes;
   `tool-definitions-lint` fails otherwise. Register
   `manage_belief.subjective_verify` in `holonovel/tool-surface-registry.json`
   after the `subjective_list` entry (`:664-676`) with `mutation_class: "read"`
   and the same `group` / `phases`; no new parameters, so
   `spec_health.tool_required_param_counts.manage_belief` stays 1. If
   `action-conflicts` flags the new read against `subjective_list`, add a
   `decomposition` row to `spec/audit/action-conflicts-baseline.json` naming the
   REQ that introduces it; do not exclude the pair.
5. **Briefing marker.** In `composeSubjectiveMemorySection`
   (`index.ts:2207-2231`), compute each selected record's verdict through
   `checkRecord` against one projection built for the render and append
   ` [divergence: <verdict>]` for divergent records only (D6). Selection and cap
   are untouched.
6. **Tests and fixture.** T748–T751 in `holonovel/scripts/test-belief.ts` beside
   T743–T747 (`:248-380`), named `T748/REQ-629: …` in the existing style.
   T752 in `holonovel/scripts/test-memory-recall.ts`, loading
   `holonovel/scripts/fixtures/subjective-divergence.json` (new), whose probes
   are `{id, claim, expected_verdict}`; the fixture builds its memories through
   `manage_belief (action: subjective_record)` and asserts the effect log cursor
   is unchanged before and after the verify calls.
7. **Docs and registers.** `holonovel/AGENTS.md` `manage_belief` action list;
   DECISIONS entry (derived-not-stored, one read action, O.13 tables); CHANGELOG
   entry headed `2026-11-08` (the subject `session:close` derives); remove the
   ROADMAP section; `npm run validate -- --write-register`
   (coverage register); `npx tsx holonovel/scripts/generate-tool-definitions.ts`
   (no `--check`); `npm run surface-budget -- --write`; assembled spec via
   `npm run assemble`.
8. **Verify and close.** `npm run assemble && npm run check:fast` un-piped;
   `cd holonovel && npm run test:belief && npm run test:memory-recall`; then
   `npm run test:all` (the authoritative harness suite for a changed tool
   surface — `check:fast` does not run it); `npm run build-order`;
   `HOLONOVEL_IMPL_STRICT=1 npm run validate`; then `npm run session:close` as
   one spec increment commit.

## Blast radius

| File | Change | Size |
|---|---|---|
| `spec/02-requirements.md` | five REQs in §5.35, §5 map row | M |
| `spec/appendices-reference.md` | O.13 tables, T91 range, E rows, F rows T748–T752 | M |
| `spec/build-phase-map.md` | content hash regenerated by `npm run assemble` (mechanical; surfaced during execution) | S |
| `holonovel/src/core/divergence.ts` | new module | L |
| `holonovel/src/index.ts` | import, action enum, description trim, handler, briefing marker | M |
| `holonovel/scripts/test-belief.ts` | T748–T751 | M |
| `holonovel/scripts/test-memory-recall.ts` | T752 probe loop | S |
| `holonovel/scripts/fixtures/subjective-divergence.json` | new probe fixture | S |
| `holonovel/AGENTS.md` | `manage_belief` action list | S |
| `holonovel/tool-surface-registry.json` | one action entry | S |
| `holonovel/tool-definitions.json` | regenerated | S |
| `holonovel/DECISIONS.md` | decision entry | S |
| `spec/audit/tool-surface-baseline.json` | re-recorded footprint | S |
| `spec/audit/action-conflicts-baseline.json` | conditional disposition row (Phase 4) | S |
| `spec/audit/req-coverage.md` | regenerated; REQ-629–633 evidenced | S |
| `ROADMAP.md` | item removed | S |
| `CHANGELOG.md` | dated entry | S |
| `holonovel.md`, `holonovel/holonovel.md` | assembled | S |
| `docs/plans/2026-11-08-memory-divergence-verdicts/` | plan, tasks, AAR | S |

No change: `holonovel/src/core/state.ts`, `holonovel/content/torre-nosferatu.json`,
`holonovel/src/generated/contract-fingerprints.ts` (expected; D8), `.githooks/`,
`push-pipeline.sh`.

## Expected cascading failures

- `check-tool-surface` fails with `unregistered action:
  manage_belief.subjective_verify` until the registry entry lands.
- `tool-definitions-lint` fails if the grown description crosses 1000 bytes —
  headroom is 16 bytes, so the trim is mandatory, not optional. Trim wording; do
  not raise the budget.
- `check-tool-definitions-sync` fails until `generate-tool-definitions.ts` runs.
- `surface-budget` fails stale until `--write` re-records the baseline.
- `action-conflicts` may flag `subjective_verify` against `subjective_list` or a
  diagnostics `verify`; resolve by recording a decomposition row in
  `spec/audit/action-conflicts-baseline.json`, not by excluding the pair.
- `tool-citation-check` fails until the action is registered, because the spec
  cites `manage_belief (action: subjective_verify)`.
- `test-tool-definitions.ts:201-203` asserts every documented action appears in
  the live enum, so `holonovel/AGENTS.md`, the registry, and the generated
  definitions must land in the same commit.
- `check-markers` and the contract fingerprints advance after assembly —
  regenerate with `npm run build-order`, not by hand.
- `check-conformance` may classify REQ-629–633 as bucket A until the module and
  handlers cite each REQ at the code that implements it.
- `check-loop-artifacts` fails without `tasks.md` and an `aar.md` token.

**Rollback cost:** 0 — a pure addition (five REQs, one appendix table, one module,
one read action, one marker). Deleting the module, reverting the action enum and
description, and removing the REQ and appendix blocks returns the tree to the
current state; no Novel written under this change carries new state.

**Done bar:** `npm run check:fast` prints `check:fast: PASS` with 0 failed on the
un-piped command; `cd holonovel && npm run test:belief` passes with T748–T751;
`npm run test:memory-recall` passes with T752; `npm run test:all` passes;
`npm run build-order` reports 0 errors; `HOLONOVEL_IMPL_STRICT=1 npm run validate`
reports REQ-629–633 as evidenced (bucket C, not A); the ROADMAP item is removed;
the plan, tasks, and AAR exist and the AAR ends `LOOP PAUSED`.

## Open questions

1. **Affect drift needs a declared valence.** The record stores `felt_then` as free
   text. The plan checks it against the O.13 affect lexicon and the recorded
   relational valence; a record with no recorded valence never reports affect
   drift. If the maintainer prefers an explicit `felt_valence` field on the record
   instead, that is a chunk-1 record-shape amendment and belongs in a separate
   increment (it would force a starter rebuild and a migrate path).
2. **The projection is current-state, not anchor-state** (D3). A true historical
   projection needs a state-at-ordinal facility that REQ-604 does not provide.
   If that facility is wanted, it is its own roadmap item, not a silent widening
   of this one.
3. **Chunk 5 wording.** This plan reads `ROADMAP.md:21`'s "subjective recall probes"
   as verdict probes and leaves "the subjective probe family and a declared floor"
   (`:54-55`) to chunk 5 (D7). If the maintainer intended the opposite split, only
   Phase 6 moves; the REQ contract is unaffected.
