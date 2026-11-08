# Plan — Subjective recall quality and retention

Session 2026-11-08. Roadmap item: "Subjective recall quality and retention" —
`ROADMAP.md:15-25`, chunk 5 (final) of the subjective-memory program (chunk 1 =
`2026-11-08-subjective-memory-store`, chunk 2 =
`2026-11-08-memory-divergence-verdicts`, chunk 3 =
`2026-11-08-subjective-disclosure-axis`, chunk 4 =
`2026-11-08-psyche-depth-identity-facets`).

**Artifact:** `docs/plans/2026-11-08-subjective-recall-retention/plan.md` ·
**Base HEAD:** `20fd127` · **Drafted:** 2026-11-08 · **Plan revision:** 2
(after a standard-depth plan review).

## Questions

- The user asked: "draft plan for next roadmap item." The only open roadmap
  section is `ROADMAP.md:15-25`; every earlier chunk of the program has shipped.
- What is the smallest increment that meets the roadmap's own trigger
  (`ROADMAP.md:23-25`): two runs at one budget return the same ordered set, an
  eviction fixture reports `[evicted]`, and the probe suite fails on a
  deliberately missed required probe?
- Does budgeted assembly replace the existing record cap, or sit beside it
  (D2)?
- What does "consolidation into the compression ladder" mean for an
  append-only store (D8)?

## Baseline (measured this session)

- `npm run status` → version 2026.11.08, 6 unpushed commits, 1 open roadmap
  item, last publish 2026-11-07T20:30:06Z. Tree clean.
- `npm run check:fast` (un-piped) → **PASS**: 37 passed, 0 failed, exit 0,
  `check:fast: PASS`. `typecheck` PASS inside it.
- Next free identifiers: max REQ-643, max T765 → REQ-644–648, T766–T770.
- `spec/audit/review-register.md` `## Scheduled-roadmap` is empty
  (`:872-874`), so no register row names this item.

## Why

The store, the disclosure axis, the divergence verdicts, and the identity
facets all exist. Selection is still the minimal comparator chunk 1 shipped
(`selectForBriefing`), the render bounds by record count only, an evicted
source is invisible, retention is one global oldest-first cap, and no probe
family measures subjective recall — the ladder harness tests `manage_context
(action: recap)` only. This increment is what makes the memory layer measurable
and keeps its quality from silently decaying as a campaign grows.

| Claim | Evidence |
|---|---|
| Selection is the fixed 3-key comparator, no score | `holonovel/src/core/subjective.ts:92-105` |
| Briefing bounds by record count only | `holonovel/src/index.ts:2224` (`configInt("TTRPG_SUBJECTIVE_MEMORY_BRIEFING_MAX", 5)`) |
| Section composer appends no marker and reports nothing omitted | `holonovel/src/index.ts:2221-2269` |
| Retention is one global oldest-first slice | `holonovel/src/index.ts:8803-8804`; `spec/02-requirements.md:4436-4447` |
| Ladder shape is arcs plus one campaign summary | `holonovel/src/core/state.ts:269-286`; `:1960-1974` |
| Ladder assembly already has a budget/truncation idiom to reuse | `holonovel/src/core/memory.ts:141-165`; `estimateTokens` at `:31` |
| GM campaign tier is derived live per badge | `holonovel/src/core/memory.ts:100-140`; `holonovel/src/index.ts:9310-9320` |
| Player-scope export already omits the ladder wholesale | `holonovel/src/index.ts:9958-9967` |
| Recall harness covers the ladder only | `holonovel/scripts/test-memory-recall.ts:203-220` (T700) |
| Committed ladder fixture and its shape | `holonovel/scripts/fixtures/memory-recall.json` |
| Probe-negative-control precedent | `holonovel/scripts/test-memory-recall.ts:120-135` (`divergenceMisses`) |
| Config rows for the memory bounds | `spec/04-runtime.md:215-216` |
| Recall floor constant lives in O.12 | `spec/appendices-reference.md:3143` |
| Budgeted assembly algorithm and its token estimate | `spec/04-runtime.md:687-693` (§7.9b) |
| Event-log cap the eviction marker must reference | `spec/04-runtime.md:202` |
| §5 map row and §7.7.4 rows to amend | `spec/02-requirements.md:43`; `spec/04-runtime.md:267`, `:289` |
| Roadmap scope and trigger | `ROADMAP.md:15-25` |

No external sources: this increment is derived entirely from in-repo state and
the existing spec algorithms. Nothing here is quoted from outside the repo.

## Scope

**In scope**

1. A deterministic integer score (`scoreMemory`) replacing the comparator in
   `selectForBriefing`, with the algorithm declared in §7.9e (D1, D4, D5).
2. Budgeted assembly: the record cap plus a token budget, whole-record
   admission, and a badge-scoped `[truncated]` count (D2, D3).
3. `[evicted]` reporting for a record whose cited event the log no longer
   retains, in the briefing line and in `subjective_list` (D6).
4. Per-entity retention with score-ordered eviction, and consolidation of the
   evicted records into `compression_ladder.entities` (D7, D8).
5. The GM campaign tier names consolidation summaries; Player recap and the
   player-scope export stay free of them.
6. The subjective probe family in the recall harness, with a committed
   fixture, a declared floor in O.12, and a deliberate-miss negative control.
7. Spec: new REQ-644–648; amendments to REQ-590, REQ-626, REQ-627, REQ-634;
   §5 map row, §7.6 config rows, §7.7.4 rows, glossary, Appendix E/F, O.12.
8. Tests T766–T770, registers, DECISIONS, `holonovel/AGENTS.md`, CHANGELOG,
   ROADMAP removal, generated artifacts, starter rebuild.

**Out of scope** (recorded, not scheduled)

- Promotion of a memory into knowledge, belief, or campaign memory: still
  withheld (chunk 1 D-record); consolidation is storage, not promotion.
- A per-entity *rendered* budget separate from the section budget (D2 keeps one
  section budget for both badges).
- Disclosure-aware consolidation projection to Player recap: the summary is
  GM-only this increment (D8); a Player summary would need a per-line
  disclosure matrix and its own contract.
- A configurable recency half-life: recency is normalized by the retained log
  length so no new knob and no fingerprint surface is added (D4).
- Changing the global entry cap's oldest-first order (D7 keeps it as a disk
  backstop).
- Any new tool, tool action, property group, or coupling row.

## Decisions

- **D1 — One integer score, pure and badge-neutral.** `scoreMemory(record,
  latestOrdinal, logLength)` returns `salience × 1000 + recency + origin`,
  each term an integer, so ordering never depends on float comparison. Ties
  keep chunk 1's order (descending ordinal, then ascending id) so unchanged
  state and unchanged inputs stay byte-identical. The weights live in §7.9e
  beside §7.9b's packing rule, not in the REQ body (Appendix M).
  Rejected: a float weight vector (its comparator is stable only while the
  arithmetic is), and a learned/telemetry score (no model or network input may
  participate).
- **D2 — The token budget sits beside the record cap; both apply.** The record
  cap stays (existing config row, T745/T755 acceptance, and a bounded header
  cost), and `TTRPG_SUBJECTIVE_MEMORY_BRIEFING_TOKENS` adds the quality bound
  the roadmap names. Its default is 800 tokens, sized so the default five-record
  cap binds before the budget at ordinary gist lengths (the gist is
  author-supplied and unbounded, so a Novel with long gists may truncate
  earlier — the bound is a ceiling, not a promise of no truncation). Assembly
  admits whole records in score order and stops at whichever bound binds first.
  Rejected: replacing the cap (it would retire a config row and two acceptance
  tests for no gain — the budget is the finer bound, not a contradictory one).
- **D3 — Truncation counts are badge-scoped.** The `[truncated]` count names
  only records the calling badge can see. A Player render that counted a
  `secret` omission would leak the existence of secret memory, which REQ-634
  and the chunk-3 exposure matrix forbid. The Player path therefore filters
  first (REQ-634's projection) and packs the projected lines, so the count and
  the budget are computed on what the badge actually receives.
- **D4 — Recency is measured against the event-log head, normalized by the
  retained log length.** `distance = latest_ordinal − record.event_ordinal`;
  `recency = round(200 × (1 − distance / max(1, logLength)))`, floored at 0. A
  null ordinal contributes 0. No clock is read (REQ-626's determinism clause),
  and no new config is added: the log's own retained length is the horizon the
  Novel already has. Origin contributes witnessed 60, told 40, inferred 20,
  authored 0 — provenance, not truth, so a told memory still outranks an
  inferred one. Salience dominates the sum (0–1000), which is the field's
  purpose. Rejected: a fixed decay window (`TTRPG_..._RECENCY_SPAN` — a §7.6
  row, a DECISIONS entry, and a fingerprint for a constant no operator would
  tune).
- **D5 — Disclosure does not score.** Ranking by secrecy would bury exactly
  the guarded and secret material the GM most needs to keep narration
  coherent. Exposure is already decided by the badge filter (REQ-625/REQ-634),
  so the score stays badge-neutral and one ordering serves both badges.
- **D6 — An evicted source is a marker, not a drop.** The gist outlives the
  event it cites: the record stays, and its line gains `[evicted #<ordinal>]`
  exactly as `manage_diagnostics (action: history)` reports `[evicted]` for an
  ordinal under the event-log cap (REQ-591). `subjective_list` gains a derived
  `event_state` member — `retained`, `evicted`, or `none` for a record that
  cites no event (an authored memory) — so a programmatic caller sees the same
  fact, and the briefing appends no marker for `none`. Neither surface mutates
  the record.
- **D7 — Per-entity retention evicts by ascending score; the global cap keeps
  oldest-first and folds too.** The per-entity cap
  (`TTRPG_SUBJECTIVE_MEMORY_PER_ENTITY_MAX`, default 500) is the quality
  decision: the record the character would forget first is the least salient,
  least recent, least firsthand one. The global cap
  (`TTRPG_SUBJECTIVE_MEMORY_MAX_ENTRIES`) is a disk backstop and keeps its
  documented oldest-first selection (REQ-627, T746/T757), so no existing test
  changes meaning — but its overflow now folds through the same consolidation
  helper before removal, so the two bounds share one loss semantics. Rejected:
  making the global cap score-ordered (two policies would become one, but the
  storage bound would silently become a story decision).
- **D8 — Consolidation is written at eviction time into
  `compression_ladder.entities`.** An evicted record is by definition gone from
  the store, so a summary derived lazily on read could never recover it. At
  eviction the server appends the record's `- [origin] gist (ordinal N)` line
  to that entity's summary and trims the text to
  `TTRPG_SUBJECTIVE_MEMORY_CONSOLIDATION_MAX` characters (default 2000)
  oldest-line-first. `source_refs` holds `memory:<id>` as a **fold key, not a
  resolvable pointer**: the id survives so a re-fold of the same record after
  an undo cannot duplicate a line, and no surface tries to dereference it. The
  member is optional on load (`{}` when absent), so no `DATA_FORMAT` migration
  is needed and pre-increment Novels load unchanged. It carries no `derived_at`
  stamp — a persisted clock would be a new state surface with no reader, and
  the ladder's own `derived_at` values are render-time arguments, not stored
  facts. It rides the existing ladder group, so clone/checkpoint/archive carry
  it and the player-scope export already omits it, and it surfaces only in the
  GM campaign tier (`deriveCampaignTier`'s `gm` branch). Rejected: a new
  property group (§7.7.0 class-contract and five enumerations to touch for a
  derived summary), and rewriting the store record in place (breaks the
  append-only contract).
- **D9 — No new tool, no new action, no REQ-137a row.** `manage_belief`'s
  schema is unchanged; `subjective_list` gains only a derived output member.
  `tool-definitions.json` changes only if description prose changes, and the
  REQ-429 budget is unchanged.
- **D10 — The starter artifact is rebuilt.** The §7.7 edit feeds the
  `DATA_FORMAT` fingerprint, so `holonovel/content/torre-nosferatu.json` is
  stale after the state-model task (chunk-4 precedent). `npm run
  build:starter-novel` is a named task step, not a post-commit chore.

## Contract changes

```ts
// holonovel/src/core/subjective.ts
export interface MemoryScoreInputs {
  latestOrdinal: number;   // event-log head; 0 when the log is empty
  logLength: number;       // retained entries; the recency horizon
}
export function scoreMemory(r: SubjectiveMemoryRecord, inputs: MemoryScoreInputs): number;

export interface AssembledMemorySection {
  lines: string[];          // rendered, score-ordered, marker-free
  kept_ids: string[];
  omitted: number;          // badge-visible records dropped by cap or budget
  tokens: number;
}
export function assembleMemorySection(
  records: SubjectiveMemoryRecord[],       // already badge-filtered and projected
  render: (r: SubjectiveMemoryRecord) => string,
  opts: { maxRecords: number; budgetTokens: number; marker: (omitted: number) => string },
): AssembledMemorySection;

export function selectForEviction(
  records: SubjectiveMemoryRecord[],   // one entity's records
  cap: number,
  inputs: MemoryScoreInputs,
): SubjectiveMemoryRecord[];           // lowest-score first, ties oldest ordinal then id

// Shared by both bounds (per-entity and global), so neither loses a gist.
export function foldIntoSummary(
  summary: EntityMemorySummary | undefined,
  evicted: SubjectiveMemoryRecord[],
  maxChars: number,
): EntityMemorySummary;

export function eventState(ordinal: number | null, retained: Set<number>): "retained" | "evicted" | "none";

// holonovel/src/core/state.ts
export interface EntityMemorySummary {
  entity_id: string;
  text: string;                 // "- [origin] gist (ordinal N)" lines, newest last
  source_ordinals: number[];
  source_refs: string[];        // "memory:<id>" fold keys; never dereferenced
}
export interface CompressionLadder {
  version: 1;
  arc: TierSummary[];
  campaign: TierSummary | null;
  entities?: Record<string, EntityMemorySummary>;  // absent on pre-increment Novels
}
```

`deriveCampaignTier` gains no parameter: it reads `novel.compression_ladder
.entities` in its `gm` branch and emits one fact per summary (`memory
<entity>: <lines joined by "; ">`, `ref: memory:<entity>`), bounded by the
existing fact cap. `refreshCompressionLadder` rewrites `arc` and `campaign`
only and must preserve `entities`.

## Drafted requirement bodies

Each body is one paragraph, under the validator's 800-character and 8-sentence
limits, and carries no table, bullet, `Default:` clause, or parameter type.
Measured (characters / sentences): 644 671/6, 645 650/5, 646 794/5, 647
793/6, 648 739/6. Re-measure with `npm run validate` before assembling — the
647 and 646 margins are thin.

> **REQ-644 — Deterministic recall score.** WHEN the server composes the
> `## Subjective Memory` section, THE server SHALL rank records by a
> deterministic score derived from recorded state under the algorithm in
> §7.9e. The score SHALL combine a record's salience, its recency measured
> against the event-log head, and its origin, and SHALL NOT consult the clock,
> network, or model output. Records of equal score SHALL order by descending
> event ordinal, then ascending record identifier. The disclosure level SHALL
> NOT affect the score. *Acceptance criterion:* two renders of unchanged state
> at one budget return the same ordered set, and a higher-salience record
> outranks a newer lower-salience record. _Check:_ T766.

> **REQ-645 — Budgeted section assembly.** The server SHALL assemble the
> section in score order until either `TTRPG_SUBJECTIVE_MEMORY_BRIEFING_MAX`
> records or the `TTRPG_SUBJECTIVE_MEMORY_BRIEFING_TOKENS` token budget binds,
> estimating cost under §7.9b. A record SHALL be admitted whole or not at all.
> When records are omitted, the section SHALL end with a `[truncated]` marker
> naming the number omitted from the calling badge's rendered set, and SHALL
> NOT disclose the existence of a record the badge cannot see. *Acceptance
> criterion:* a budget below the packed cost omits the lowest-scored records
> and reports the count, and a Player render's count excludes `secret` records.
> _Check:_ T767.

> **REQ-646 — Evicted-source reporting.** A subjective-memory record whose
> contributing event ordinal is no longer retained in the event log SHALL be
> reported with an `[evicted]` marker carrying that ordinal rather than
> dropped, fabricated, or re-charged to another event. The briefing SHALL
> append the marker to the record's rendered line; `manage_belief (action:
> subjective_list)` SHALL report a per-record event state of `retained`,
> `evicted`, or `none`, the last for a record citing no event. Eviction
> reporting SHALL NOT change selection, order, the render cap, or the record
> itself. *Acceptance criterion:* after the cited event is evicted by the
> event-log cap, the section marks the record `[evicted]` and the list reports
> its state, while a retained event reports `retained` and an authored record
> reports `none`. _Check:_ T768.

> **REQ-647 — Per-entity retention and consolidation.** The server SHALL bound
> each entity's records by `TTRPG_SUBJECTIVE_MEMORY_PER_ENTITY_MAX` (§7.6),
> evicting the lowest-scored first, ties broken by oldest event ordinal then
> ascending identifier. Before any bound evicts a record, the server SHALL fold
> its gist, origin, and ordinal into the entity's consolidation summary in the
> compression ladder (REQ-590), bounded by
> `TTRPG_SUBJECTIVE_MEMORY_CONSOLIDATION_MAX` and dropping the oldest lines
> first. A fold SHALL be keyed by record identifier so it never duplicates. The
> summary SHALL travel with clone, checkpoint, and archive operations and reach
> no Player surface. *Acceptance criterion:* with a per-entity cap of two, a
> third record evicts the lowest-scored one and the GM recap names its gist
> from the consolidation summary. _Check:_ T769.

> **REQ-648 — Subjective recall probes.** The server distribution SHALL include
> a committed subjective-recall probe fixture whose record and probe fields are
> declared in Appendix O.12. The recall-probe harness (REQ-593) SHALL seed the
> fixture, render the section at each probe's declared budget for the Game
> Master and Player badges, and report `subjective recall@budget` per badge. It
> SHALL fail when a required probe misses at any declared budget or aggregate
> recall falls below the subjective floor in Appendix O.12. The harness SHALL
> prove its miss detector fires on a synthetic probe whose expectation is
> deliberately withheld. *Acceptance criterion:* the committed fixture runs,
> and a required probe whose expected gist is withheld by the budget fails the
> run. _Check:_ T770.

## Amendments

- **REQ-590** (`spec/02-requirements.md:4362-4365`): the ladder also holds a
  per-entity consolidation summary per entity with folded memories. No change
  to its derivation determinism or copy-through clauses.
- **REQ-626** (`:4424-4434`): selection is the REQ-644 score; the section
  assembles per REQ-645 and reports evicted sources per REQ-646; the two-render
  identity clause stays.
- **REQ-627** (`:4436-4447`): per-entity bound and consolidation per REQ-647;
  the global cap stays the outer storage bound; the health count is unchanged.
- **REQ-634** (`:4513-4522`): selection and the render bound match REQ-626
  (hence REQ-644/645), and the truncation count is badge-scoped.
- **REQ-109c2 / REQ-109e** (`:1302`, `:1308`): no change — the section is
  already a decision-critical group, and the consolidation summary surfaces in
  the campaign tier, not a new briefing group.
- **Appendix F T745** (`spec/appendices-reference.md:2076`): the asserted
  ordering becomes descending score, then descending ordinal, then ascending
  id, and the bound clause names the token budget beside the record cap. This
  row is normative evidence for REQ-626 and would otherwise contradict
  REQ-644. T755 (the Player exposure matrix) asserts content, not order, and is
  unchanged.
- **Appendix O.12**: the row group gains the subjective recall floor and the
  subjective fixture field catalog (record fields and probe fields), so REQ-648
  cites the catalog instead of enumerating it.
- **§7.9e** fixes the three marker forms in this section family:
  `[truncated] <tier> tier omitted at this budget` names a dropped ladder tier
  (§7.9b), while `[truncated] N memories omitted at budget` names a record
  count omitted from the badge's rendered set.

## Blast radius

| File | Change | Size | Rollback |
|---|---|---|---|
| `spec/02-requirements.md` | REQ-644–648 added in §5.35; REQ-590/626/627/634 amended; §5 map row `623–635` → `623–648`, §5.34 row `590–593` unchanged | L | 1 |
| `spec/04-runtime.md` | §7.6 rows for the three new config values; §7.7.4 Compression Ladder and Subjective Memory rows; new §7.9e score and budget algorithm | M | 0 |
| `spec/appendices-reference.md` | Appendix E rows REQ-644–648; Appendix F rows T766–T770 plus the T745 ordering amendment; O.12 subjective recall floor and fixture field catalog | M | 0 |
| `spec/01a-constitution.md` | Glossary `Subjective Memory` row gains consolidation and the score (one row, `:174`) | S | 0 |
| `spec/build-phase-map.md` | Not edited (no new subsection) — confirmed by the count gate | — | — |
| `holonovel.md` | Regenerated by `npm run assemble` | L | 0 |
| `holonovel/src/core/subjective.ts` | `scoreMemory`, `assembleMemorySection`, `selectForEviction`, `eventState`; `selectForBriefing` becomes a score sort | L | 1 |
| `holonovel/src/core/state.ts` | `EntityMemorySummary`, optional `entities` on `CompressionLadder`, `emptyCompressionLadder`, load normalization | M | 1 |
| `holonovel/src/core/memory.ts` | `deriveCampaignTier` GM branch emits consolidation facts; reuse `estimateTokens` (no duplicate helper) | M | 1 |
| `holonovel/src/index.ts` | Section composer packs through `assembleMemorySection`, appends `[evicted]`; record path evicts per entity and folds consolidation; `subjective_list` emits `event_state` | L | 1 |
| `holonovel/src/generated/contract-fingerprints.ts` | Regenerated by `npm run build-order` | S | 0 |
| `holonovel/content/torre-nosferatu.json` | Rebuilt (`DATA_FORMAT` hashes §7.7) | S | 0 |
| `holonovel/scripts/test-memory-recall.ts` | Subjective probe family, eviction fixture pass, negative control | M | 0 |
| `holonovel/scripts/test-belief.ts` | T745 ordering assertion reconciled with the score (T745 lives here, not in the briefing suite) | S | 0 |
| `holonovel/scripts/fixtures/subjective-recall.json` | New committed fixture | S | 0 |
| `holonovel/scripts/lib/holosuite-*.ts` | Line-pinned evidence anchors re-resolved after `index.ts` edits | S | 0 |
| `holonovel/tool-definitions.json` | Regenerated only if `manage_belief` description prose changes | S | 0 |
| `spec/audit/req-coverage.md` | Regenerated by `validate -- --write-register` | S | 0 |
| `spec/audit/tool-surface-baseline.json` | Re-recorded if the schema/description delta reports one | S | 0 |
| `holonovel/DECISIONS.md` | Score weights, budget-beside-cap, badge-scoped counts, eviction policy split, consolidation storage and GM-only reach | M | 0 |
| `holonovel/AGENTS.md` | `manage_belief` line names scored/budgeted selection and consolidation; no count change | S | 0 |
| `CHANGELOG.md` | `2026-11-08` heading and bullets | S | 0 |
| `ROADMAP.md` | Remove the section (`:15-25`) | S | 1 |
| `docs/plans/2026-11-08-subjective-recall-retention/` | `plan.md`, `tasks.md`, `aar.md` | S | 0 |

## Tasks (dependency order)

1. **Spec section.** Add REQ-644–648 in `spec/02-requirements.md` §5.35; amend
   REQ-590 (`:4362`), REQ-626 (`:4424`), REQ-627 (`:4436`), REQ-634 (`:4513`);
   update the §5 map row (`:43`) to `623–648`. Count each body against the
   800-character and 8-sentence limits before assembling. Run `npm run
   assemble`.
2. **State model, algorithms, tables.** §7.9e score and assembly algorithm
   (`spec/04-runtime.md`, after §7.9d), including the two marker forms; §7.6
   config rows for `TTRPG_SUBJECTIVE_MEMORY_BRIEFING_TOKENS` (Presentation,
   default 800), `TTRPG_SUBJECTIVE_MEMORY_PER_ENTITY_MAX` (Storage, default
   500), and `TTRPG_SUBJECTIVE_MEMORY_CONSOLIDATION_MAX` (Storage, default
   2000); §7.7.4 rows (`:267`, `:289`); O.12 floor plus the subjective fixture
   field catalog (`spec/appendices-reference.md:3143` region); Appendix E rows
   and the Appendix F T745 ordering amendment (`:2076`); glossary row
   (`spec/01a-constitution.md:174`). Run `npm run assemble && npm run
   validate`.
3. **Core memory math.** `holonovel/src/core/subjective.ts`: `scoreMemory`,
   `assembleMemorySection`, `selectForEviction`, `foldIntoSummary`,
   `eventState`, with REQ citations in the header; `selectForBriefing` sorts by
   `scoreMemory`. `holonovel/src/core/state.ts`: summary type, optional member,
   empty-state and load default. No I/O, no clock.
4. **Ladder surfacing.** `holonovel/src/core/memory.ts`: `deriveCampaignTier`
   emits consolidation facts in the `gm` branch only, reusing `estimateTokens`
   for the section budget — do not add a second token helper (C2/C3 detectors).
5. **Wiring.** `holonovel/src/index.ts`: `composeSubjectiveMemorySection`
   (Player path projects first, then packs; GM path packs then tags) appends
   `[evicted #N]` and the `[truncated]` line; `subjective_record` evicts the
   entity's overflow through `selectForEviction`, folds through
   `foldIntoSummary`, and routes the global-cap overflow through the same fold
   before its oldest-first slice; `subjective_list` adds `event_state`. Grep for
   sibling REQs binding these surfaces before editing (sibling-contract check),
   including a check that no REQ other than 118/135/626/634/645 bounds
   `badge_briefing` composition.
6. **Tests.** T766 (score order and two-render identity), T767 (budget binding,
   cap binding, badge-scoped `[truncated]` count), T768 (`[evicted]` in the
   section and `event_state` in the list, after the log cap evicts the source),
   T769 (per-entity cap eviction order, consolidation text, GM recap inclusion,
   Player recap omission, no duplication on re-fold), T770 (fixture recall,
   floor, and the synthetic-miss detector) in
   `holonovel/scripts/test-memory-recall.ts`, with the new fixture. Titles use
   the `TNNN/REQ-NNN:` form the coverage audit scans. Reconcile T745 in
   `holonovel/scripts/test-belief.ts` against the observed score order before
   writing T766. Extend the harness header citations to REQ-644–648.
7. **Regenerated artifacts.** `cd holonovel && npm run build:starter-novel`;
   `npx tsx scripts/generate-tool-definitions.ts`; `npm run surface-budget --
   --write`; `npx tsx scripts/surface-replay.ts --write` only if the check
   reports a delta; `npm run validate -- --write-register`; `npm run assemble`.
8. **Docs and registers.** DECISIONS entries for D1–D8 and the two deferrals;
   `holonovel/AGENTS.md` `manage_belief` line; CHANGELOG under the `2026-11-08`
   heading; ROADMAP section removal; re-grep
   `spec/audit/review-register.md` for a `Scheduled-roadmap` row naming this
   item and update it in the same step if one appears.
9. **Close.** Un-piped `npm run check:fast`; `cd holonovel && npm run
   test:memory-recall`; `cd holonovel && npm run test:briefing`; `cd holonovel
   && npm run test:belief`; `cd holonovel && npm run test:all`; `npm run
   build-order`; `HOLONOVEL_IMPL_STRICT=1 npm run validate`; `npm run
   session:close`.

## Commit plan

This is a spec increment, so it is **one commit** via `npm run session:close`.
The commit must pass, in order: `npm run assemble`, un-piped `npm run
check:fast`, `npm run build-order`, `HOLONOVEL_IMPL_STRICT=1 npm run
validate`, and `npm run check-loop-artifacts`. The baseline is green (37/37);
a red baseline would be fixed as its own commit first. Push is a separate,
explicit authorization.

## Verification

| Step | Command | Pass condition |
|---|---|---|
| Spec assembly | `npm run assemble` | 0 errors |
| Fast gate | `npm run check:fast` (un-piped) | `check:fast: PASS`, ≥37 passed |
| Recall harness | `cd holonovel && npm run test:memory-recall` | 0 failed; T766–T770 named; subjective recall printed |
| Briefing suite | `cd holonovel && npm run test:briefing` | 0 failed; existing sections intact |
| Belief suite | `cd holonovel && npm run test:belief` | 0 failed; T745 reconciled with the score order |
| Full server suite | `cd holonovel && npm run test:all` | 0 failed |
| Fingerprints | `npm run build-order` | "Ready to commit"; `check-fingerprint-sync` PASS |
| Implementation coverage | `npm run validate -- --write-register`, then `HOLONOVEL_IMPL_STRICT=1 npm run validate` | 0 errors; REQ-644–648 each bucket C (source-cited and exercised by a `test("TNNN/REQ-NNN: …")` title) |
| Tool artifacts | inside `check:fast` | `check-tool-definitions-sync`, `tool-definitions-lint`, `surface-budget`, `surface-replay` PASS |
| Loop artifacts | `npm run check-loop-artifacts` | plan/tasks/AAR present, LOOP token terminal |

**Done bar:** In one session — the roadmap trigger's three conditions each
demonstrated by a named test (two renders at one budget are byte-identical with
the same ordered set, T766; the eviction fixture reports `[evicted]`, T768; the
subjective probe run fails on a deliberately missed required probe, T770); the
budget truncation fixture reports `[truncated]` with a badge-scoped count
(T767); per-entity retention evicts by score and the consolidation summary
reaches the GM recap while the Player recap omits it (T769); `check:fast` PASS
un-piped; REQ-644–648 each register as bucket C under
`HOLONOVEL_IMPL_STRICT=1 npm run validate`; the roadmap section gone and the
CHANGELOG carrying it; AAR terminating `LOOP PAUSED` or `LOOP OPEN`.

## Risks and rollback

| Risk | Mitigation |
|---|---|
| A new REQ body overruns 800 characters / 8 sentences | Each was measured at drafting (644 671, 645 650, 646 794, 647 793, 648 739 chars; ≤6 sentences); re-measure with `npm run validate` before assembling — the 646 and 647 margins are thin |
| Score arithmetic becomes order-unstable | Integer terms only; ties fall back to chunk 1's key order; T766 compares two renders byte for byte |
| The score buries a required probe under the budget | The fixture places required probes at high salience; T770 asserts every required probe survives every declared budget |
| REQ-644's ordering contradicts T745's asserted keys | The Appendix F T745 row is amended in the same increment, and T745 is reconciled against observed behavior before T766 is written |
| The `[truncated]` count leaks a secret's existence to a Player | The Player path projects first and counts projected omissions only (D3); T767 asserts the count excludes secrets |
| Per-entity eviction changes an existing acceptance test | The global cap keeps oldest-first, so T746/T757 are untouched; the per-entity cap is a new config with its own test |
| Consolidation loses a gist on a second eviction | The summary appends (never rewrites), trims oldest lines first, and folds are keyed by memory id; T769 evicts twice and asserts both gists until the char bound binds |
| Undo after an eviction restores the record and folds it twice | The fold is idempotent on `memory:<id>`; T769 undoes and re-records, asserting one line |
| `refreshCompressionLadder` wipes `entities` | The refresh writes `arc` and `campaign` only; T769 asserts the summary survives a compaction-triggered refresh |
| The consolidation summary reaches a Player surface | GM-only in `deriveCampaignTier`; the ladder is already in `PLAYER_OMITTED_KEYS`; T769 asserts both |
| The global cap silently loses what the per-entity cap folds | Both bounds fold through `foldIntoSummary` before removal; the storage bound keeps its selection, not its loss semantics |
| Fingerprint and starter drift after the §7.7 edit | `build:starter-novel` and `build-order` are named steps, not post-commit chores |
| A duplicate token estimator trips `check-script-quality` | Reuse `estimateTokens` from `core/memory.ts` (C2/C3 detectors) |
| Holosuite line-pinned anchors shift | Re-resolve each anchor to the nearest non-comment line carrying its token (chunk-3 precedent) |

Rollback cost: 1. The new config rows default to behavior that preserves the
current cap-only bound, the ladder member is optional, and reverting the scorer
restores the comparator while leaving stored summaries inert.

## User impact

- A GM gets the memories that matter first — salience-led, recency-aware, and
  provenance-weighted — inside the same section, with an explicit count when
  the budget cut some, and an `[evicted]` tag when the event a memory cites is
  gone.
- A Player gets the same ranking over what the disclosure axis allows, and the
  truncation count never hints at a secret they cannot see.
- A long campaign stops accumulating one entity's trivia at the expense of
  another's: retention is per entity, and what falls out is folded into the
  campaign bible rather than lost.
- Operators gain one new tunable (a token budget) and two storage bounds, each
  with a documented default; nothing existing needs to be reconfigured.

## Open questions

1. **Should the consolidation summary be able to reach a Player at all?** This
   plan keeps it GM-only: a Player summary would need a per-line disclosure
   matrix and a contract for partially withheld lines. Recorded as out of
   scope rather than decided.
2. **Is 0.90 the right subjective floor, or should it be stricter than the
   ladder floor?** The plan reuses the ladder's 0.90 for consistency; a
   stricter floor would be defensible once the fixture covers more budgets.
3. **Should the score weights be configurable?** They are contract constants in
   §7.9e. A config row would make the ranking operator-tunable but also make
   two servers with different settings disagree on the same Novel.
4. **Should the global cap also evict by score?** D7 keeps the split; if the
   disk backstop ever fires in practice, the two policies would need
   reconciling.
