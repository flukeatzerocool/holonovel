# Plan — §5.6 typed recap payload remediation

Status: draft (self-review pending) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-12-5-6-recap-typed-payload/`
Rollback cost: 1 (server source, one generated artifact, harness assertions,
registers, ROADMAP; reversible in one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the first open P1 roadmap section — *§5.6 recap, clock, and combat-report
remediation* — and the session-achievable half of it: **F-P3B1-3** (the typed
recap payload) plus the two citation rows of **F-P3B1-9** that assert it
(**T53**, **T212**), widened **T214**/**T215**, and one contract fix found
while drafting (REQ-072f's unknown-`session_id` refusal).

The remaining findings — **F-P3B1-6** (clock interaction models) and
**F-P3B1-7** (audit-derived combat turn report), with their dependent
citations (T271, T54/T139, T25/T33/T110/T161) — move to a retitled section in
the same increment. The prior increment already established that split: F-P3B1-3
and F-P3B1-6 are each a full increment, and the combat report depends on
neither.

Baseline (this session, before any edit):

- `npm run status`: version `2026.11.12`, 63 unpushed commits, 11 open roadmap
  items, last publish `2026-11-09`. Publication is out of scope (§8).
- `git status --short`: clean, HEAD `6aafcc7`.
- `npm run check:fast`: **41 passed, 0 failed**, trailing `check:fast: PASS`
  (un-piped).

Findings, current predicates (verified in this tree), and disposition:

| Finding | Current predicate | Contract | Disposition |
|---|---|---|---|
| F-P3B1-3a | `manage_context (action: recap)` returns one text blob via `ok(recap)` (`index.ts:11202-11448`); `ok()` sets only the `{status, text}` envelope (`:3175-3178` via `structured`, `:3127-3131`), so no recap field is structured. | REQ-072b, REQ-548a | **Resolve here** |
| F-P3B1-3b | `confrontations_completed` is the integer `endCount` (`:11323-11325`); `confrontation_pending` is a rendered string (`:11326`). No `participants`/`rounds`/`outcome` objects. | REQ-175a/b, REQ-072c1 | **Resolve here** |
| F-P3B1-3c | `entities`, `lore_entries`, `narrative_directive`, `scene_type`, `roster_changes`, `condition_changes`, `total_combat_rounds`, and typed `timespan_*` have no field at all; `scene_transitions`/`story_entries` exist only as JSON embedded in text and `story_entries` is GM-only. | REQ-072c1/c2/d | **Resolve here** |
| REQ-072f drift | An unknown `session_id` appends `archived_session: '<id>' not found…` to the **full** recap body and returns `ok(recap)` (`:11424`, `:11447`); REQ-072f requires `[ERROR] [NOT_FOUND]` with valid IDs enumerated. | REQ-072f | **Resolve here** (found while drafting) |
| roster audit gap | `manage_character (action: create|import)` saves with no audit entry (`:4716-4762`, `:4804-4855`), while `removeEntity` audits `remove_character` (`:4640`); `state.ts:2423` counts `create_character`/`import_character` entries that are never written. | REQ-040a, REQ-072c2 | **Resolve here** (roster_changes has no source otherwise) |
| F-P3B1-9 (T53/T212) | Neither ID appears in `holonovel/scripts` (`grep -rl "\bT53\b"` → 0; same for T212). Appendix F catalogues both (`appendices-reference.md:1517`, `:1614`). | REQ-072f | **Resolve here** |
| F-P3B1-9 (T214/T215) | Present but assert substrings only: `test-output-contracts.ts:2351-2363` checks `confrontations_completed:`; `test-backfill.ts:216-219` checks `Active Novel`. | REQ-175b, REQ-072 | **Widen here** |
| F-P3B1-9 (rest) | T271 (REQ-073a2), T54/T139 (REQ-073c3), T25/T33/T110/T161 (REQ-043f) absent from `holonovel/scripts`. | REQ-073a2/c3, REQ-043f | **Defer** — assertions require F-P3B1-6/-7 |
| F-P3B1-6, -7 | `manage_countdown` exposes no `clock_type` (`index.ts:6678-6706` region, per the register); `advance` returns only the turn line. | REQ-073a1/a2, REQ-043b/c | **Defer** — new P1 section (§8) |

Count provenance: the absent-ID probes are `grep -rl "\bT53\b" holonovel/scripts`
(0 files), likewise T212, T271, T54, T139, T25, T33, T110, T161 (0 files each);
T214, T215, T261 each resolve to at least one file. T261 is `Manual` and T213 is
the automated REQ-072f check for the significant-roll criterion; this increment
touches neither, so neither is claimed as coverage evidence (N4). An unstated
count is not evidence.

Two catalogue contradictions surfaced by the same read and are reconciled here
rather than asserted around:

1. **The declared field count is 15, not 14.** REQ-072c1 declares nine fields
   and REQ-072c2 six, one of which is `story_entries`; T53 (`:1517`) and T215
   (`:1617`) both say "all 14 named fields" and T215's list omits
   `story_entries`. The assertions run over the declared 15 and the two rows are
   corrected (D7b).
2. **REQ-175a's round formula contradicts T214.** The REQ divides advance
   entries by participant count; T214 expects round count 2 from a fixture whose
   `init` names Ann and Foe and whose sequence is one advance — the formula
   yields `ceil(1/2) = 1`. The end entry carries
   `rounds_played: novel.combat.round` (`state.ts:2618`), which is the live
   round counter (`state.ts:2579-2583`), not a value read back from the log.
   D4 makes the recorded value authoritative and amends REQ-175a to say so
   (D7c), because the alternative is a normative REQ that disagrees with the
   assertion the plan writes.

Three `spec/02-requirements.md` normative edits, all inside the 800-character
and sentence limits: the length-neutral REQ-072c1 wording fix (D7a), REQ-175a's
round source, and REQ-175b's empty-array sentence (D7c). This is an
implementation, assertion, and register increment.

## 2. Done bar

**Done bar:** F-P3B1-3 is `Resolved` in `spec/audit/review-register.md` with the
predicates above; `manage_context (action: recap)` returns a structured result
carrying **all 15 declared fields** plus `narrative_orientation`, each with its
declared type or typed null/empty array; T53 and T212 are written in
`holonovel/scripts` and green; T214/T215 are widened to assert the typed payload
(and T215's field list is the 15); REQ-175a names the end entry's `rounds_played`
as the round source, REQ-175b scopes its empty-array sentence to the timespan,
and REQ-072c1 says "typed fields" (D7a/D7c); an unknown
`session_id` returns
`[ERROR] [NOT_FOUND]` naming valid IDs; `roster_changes` carries created and
removed entries because the creation paths are audited; the surviving roadmap
section is retitled to F-P3B1-6/-7 and the seven deferred citations (T25, T33,
T110, T161, T271, T54, T139), with a
trigger that closes only on those; every new assertion was observed **red**
before its fix, or recorded in `aar.md` as already-satisfied evidence when the
behaviour pre-existed (the significant-rolls field and the text parity checks),
and the transcripts are in `aar.md`;
`npm --prefix holonovel run test:output-contracts`, `test:backfill`,
`test:lean-narrator`, `test:workflow`, `test:memory-recall`, `test:limits`,
`test:security`, `test:tool-definitions`, `test:competitive-gaps`,
`test:holosuite-novel`, and `test:pattern-buffer-ruleset` pass (the last three
own text-envelope assertions `check:fast` does not run); a grounded recap still
carries `grounding` in its structured result; root and server `typecheck`
pass; `npm run check:fast` and `npm run build-order` are green;
`holonovel/tool-definitions.json` is regenerated for the changed
`manage_context` description; the coverage register is regenerated and REQ-072/
REQ-175 stay bucket C; the deferred test IDs are recorded in `aar.md` as open,
never as resolved; `aar.md` ends `LOOP PAUSED` with zero new action items.

Sizing note: one payload builder, one status rule, three REQ wording fixes plus
the REQ-072f refusal, five assertions (two new, two widened, one grounding),
four catalogue rows, two registers, one roadmap split. If the cap binds, completed findings commit, the roadmap section
stays open with those findings moved to `Resolved`, and `aar.md` records the
partial pass as `LOOP OPEN`. No finding is marked resolved without its green
assertion.

Current values the edit must respect:

- `ok()` (`index.ts:3175-3178`) delegates to `structured("OK", expanded)`, and
  `structured(status, text, extra?)` (`:3127-3131`) already merges an `extra`
  object **and** appends `grounding` when `groundingSet()` returns one. The new
  helper is therefore `okWith(text, fields)` =
  `{content:[{type:"text",text:`[OK] ${expanded}`}], structuredContent: structured("OK", expanded, fields)}`
  — never a hand-built object, which would drop `grounding`. Never drop `text`
  either: REQ-548a and T632's parity check read it. A recap that was grounded
  before the change must still carry `grounding` (asserted).
- `entityHp(entity)` (`:4667-4674`) resolves `hp`/`max_hp` from the ruleset stats
  bag (`max_hp`/`hp_max`/`max_hit_points`) and returns an object with either key
  **omitted** when the bag defines none. Reuse it, then normalize:
  `{hp: hp.hp ?? null, max_hp: hp.max_hp ?? null}` — REQ-072d forbids omission.
- `novel.combat` (`state.ts:374-381`) is `{participants, dangers, round,
  turn_order, current_turn, active}`. `turn_position` is
  `turn_order[current_turn]`, not `current_turn` itself.
- `novel.metadata.total_combat_rounds` (`state.ts:869`, incremented at `:2583`)
  is the integer for REQ-072c2's `total_combat_rounds`. It is Novel-lifetime,
  not session-scoped; the field's declared meaning is the total, so it is
  reported as-is and the session scoping applies to the array fields only.
- `scene_type` is `string[]` (`:7391`), `lore_entries` is a Map of
  `{key, enabled, visibility, known_by}` (`state.ts:315-330`), and
  `story_journal` entries carry `{index,type,entry,scene_anchor,entity_ids,
  timestamp}` (`state.ts:443-460`) — the exact shape REQ-072c2 asks for.
- The `session_id` live path returns early at `:11217-11232` with `ok(...)`
  lines and never reaches the body. The payload builder therefore takes the
  scoped entry list as a parameter so both paths use it.
- `format: "lonelog"` returns early at `:11427-11446`; the payload must be
  attached there too, or the Lonelog recap silently loses it.
- Appendix F row IDs are stable: T53, T212, T214, T215. Editing their text does
  not change the catalogue count.

## 3. Design decisions

**D1 — the typed payload is the structured result, not a JSON text body
(F-P3B1-3a; REQ-072b, REQ-548a).** `structuredContent` gains the 15 declared
fields plus `narrative_orientation`; the text envelope is left as the human
render it is today.

The text cannot become the structure, and three existing contracts decide that:
REQ-072g makes the text a **notation** (`markdown` default, `lonelog`
alternative), so a JSON body would break the `format` parameter it defines;
REQ-279b requires `narrative_orientation` **prose** as the recap's first field;
and eleven assertion sites across seven in-tree files read the text envelope as
text (`test-backfill.ts:216-219`, `:996-1005`, `:1115-1119`;
`test-output-contracts.ts:812`, `:2351-2363`, `:2620-2624`;
`test-competitive-gaps.ts:412-421`; `test-limits.ts:348-349`;
`test-memory-recall.ts:227-251`; `holosuite-novel.ts:381-383`;
`run_ruleset_pattern_buffer.ts:375`). `okWith` preserves every one of them, and
the three suites that own the last three sites join the gate set in §2 because
`check:fast` does not run them (B3).

REQ-548a's "reports the fields the text envelope reports" is satisfied by
parity, not identity: the payload is a typed superset, and the plan adds a
parity assertion for the fields both carry (`confrontations_completed` array
length equals the text's count; `entities` names appear in the text's entity
rendering; `timespan_start` appears in the text's timespan line). Rejected
alternative: returning `raw(JSON.stringify(payload))` — it contradicts
REQ-072g's `format` contract and breaks open_session/close_session, which embed
the recap text (`:16968`, `:16982`).

**D2 — field derivations and badge filters.** One builder,
`buildRecapPayload(novel, entries, opts)` in `index.ts`, returns the object
below. `entries` is the scoped audit slice (full log, or the `[session-boundary]`
range); `opts` carries the recap arguments (`max_transitions`, `max_rolls`,
`session_id`) and is never the audit entry's own args — those are read as
`initEntry.args.participants`, `endEntry.args.rounds_played`, and so on (M2).

| Field | Type | Source | Player badge |
|---|---|---|---|
| `narrative_orientation` | string | existing builder (`:11234-11270`), first key | already filtered |
| `timespan_start` / `timespan_end` | string \| null | `entries[0]` / `entries.at(-1)` `timestamp`; when `session_id` scopes the slice, the marker's `started_at`/`ended_at` (D5) | same |
| `entities` | `{name,hp,max_hp,conditions,status}[]` | `novel.entities` via `entityHp` | own `active_entity_id` only |
| `confrontations_completed` | `{participants,rounds,outcome}[]` | audit pairing (D4) | combats whose participants name the active entity |
| `confrontation_pending` | object \| null | `novel.combat` (D4) | same rule |
| `scene` | string | `scene_description` | same |
| `scene_type` | string \| null | `scene_type.join(", ")` or null | same |
| `lore_entries` | `{key,active}[]` | `novel.lore` filtered by `enabled` | `visibility === "shared"` or `known_by` includes the active entity |
| `narrative_directive` | string \| null | `narrative_directive` or null | same |
| `scene_transitions` | `{from,to,timestamp,location?,kind?}[]` | `scene_history` + vehicle journal entries, last `max_transitions` | same |
| `roster_changes` | `{entity_id,action,timestamp}[]` | audit rows mapped per D2a | own entity only |
| `condition_changes` | `{entity_id,condition,action,timestamp}[]` | audit rows mapped per D2a | own entity only |
| `significant_rolls` | `{tool,entity,dice,outcome}[]` | existing `rollDetail`/`rollVisible` (`:11290-11308`) over the passed `entries` slice, chronological | already filtered |
| `total_combat_rounds` | integer | `novel.metadata.total_combat_rounds` | same |
| `story_entries` | `{type,entry,timestamp,scene_anchor,entity_ids}[]` | `story_journal.slice(-10)` | entries whose `entity_ids` include the active entity or are empty |

`from` is the prior description: `scene_history[i-1].description` for history
entries (null for the first) and the scene description preceding a vehicle
entry. Extra `location`/`kind` fields are carried because REQ-072c2 says "at
minimum"; the text renderer keeps its current objects unchanged so
`test-backfill.ts:1118`'s `"kind":"vehicle"` assertion still holds.

`significant_rolls` reads the **passed `entries` slice**, not `novel.audit_log`,
so a `session_id` recap does not pair scoped confrontations with Novel-wide
rolls. `scene_transitions` stays Novel-wide by design: `scene_history` is not
audited, so a session-scoped transition list has no source; the field is
documented as the most recent N transitions, not "within the session".

Missing or inapplicable values are typed null or `[]`, never omitted
(REQ-072d) — including for a Novel with an empty audit log
(`timespan_*` null, all arrays empty).

**D2a — the two derived change arrays have an explicit audit-row mapping.**
REQ-072c2's `entity_id` and its two action vocabularies are not the audit
argument shapes, so each source row is mapped rather than copied:

| Audit tool | `entity_id` from | `action` |
|---|---|---|
| `create_character` | `args.entity_id` | `created` |
| `import_character` | `args.entity_id` | `created` |
| `remove_character` | `args.entity_id` | `removed` |
| `create_npc` | `args.id` (renamed) | `created` |
| `remove_npc` | `args.npc_id` (renamed) | `removed` |
| `apply_condition` | `args.entity_id` | `applied` |
| `remove_condition` | `args.entity_id` | `removed` |
| `condition_expired` | `args.entity` resolved to an entity ID by name; the raw name when unresolved | `removed` |

`condition_expired` is written by combat tick-down (`core/state.ts:2573`) with
the entity's **name**, not its ID, so the builder resolves it against
`novel.entities`/`novel.npcs` and falls back to the name. It is reported
because REQ-072c2's `condition_changes` is a change log, and an expiry removes a
condition. A row whose `entity_id` cannot be resolved and whose action is a
roster change is skipped rather than emitted with a null ID.

**D3 — entity status and the death condition (T212; REQ-072a1).** Status is
computed per entity:

| Condition | Status |
|---|---|
| the bound ruleset's declared death condition is applied | `dead` |
| HP > 0 | `alive` |
| HP = 0, ruleset declares a death condition it has not applied | `unconscious` |
| HP = 0, no death condition declared (ruleset-free, or bound model declares none) | `incapacitated` |

The declaration is read from the hydrated package model as `model.death_condition`
(string), with `model.concepts_death_condition` accepted as the alias the
condition catalogue already uses for `conditions`/`concepts_conditions`
(`:8498-8504`). No ingestion change: the model is a loose object
(`seedRuleset` writes arbitrary `model.json` content,
`test-output-contracts.ts:113-125`), so a fixture declares the field directly.
A model with no declaration is "a ruleset without a death condition", which is
exactly REQ-072a1's closing sentence. `max_hp` is null when the stat bag defines
none; `hp` is null likewise, and status falls back to `alive`. Rejected
alternative: hardcoding a condition named `dead` — it would fire on rulesets
that use `dead` as an ordinary condition and would not match a ruleset whose
death marker is `destroyed` or `terminated`.

**D4 — confrontation pairing and the recorded round count (F-P3B1-3b;
REQ-175a/b).** Walk `entries` in order maintaining one open combat:

- `init_combat` opens it; `participants` = `initEntry.args.participants` plus
  every `initEntry.args.dangers[].name` (REQ-175a names "entities and named NPC
  identifiers").
- `advance_combat` increments the open combat's advance count.
- `end_combat` closes it: `rounds = endEntry.args.rounds_played ?? ceil(advances
  / max(1, participants.length))`, `outcome = endEntry.args.outcome ?? null`.
  D7c makes the recorded value the normative source.
- An `init` with no matching `end` (the last open combat) is
  `confrontation_pending`; when it is not the last entry it is still pending,
  because combat state is the authority for "active".

`confrontation_pending` is null unless `novel.combat?.active`; the object is
`{participants, round, turn_position}` with `turn_position =
turn_order[current_turn] ?? null`. Consecutive combats produce separate
completed entries in chronological order (REQ-175b).

**D5 — session scoping and the unknown-ID refusal (REQ-072e/f).** The builder
takes the scoped slice, so `session_id` with a live marker uses
`sessionAuditRange` (`:11059-11068`) and the payload's `timespan_*` prefer the
marker's `started_at`/`ended_at`. Order of resolution:

1. live `[session-boundary]` marker → scoped payload + the existing scoped
   **text**, which is its own `session_scope`/`timespan`/`entry_count` line
   listing (`:11225-11230`), not the recap body. The payload is computed from
   the scoped slice; the text is not rewritten to match it (M8).
2. archived session in `novel.audit_archive` → the existing summary text plus a
   payload in the typed-empty shape REQ-072d requires. Exactly:
   `timespan_start`/`timespan_end` from the summary's fields, `total_combat_rounds`
   from Novel metadata, `narrative_orientation` computed as today,
   `confrontation_pending`/`scene`/`scene_type`/`narrative_directive` null, and
   `entities`/`confrontations_completed`/`lore_entries`/`scene_transitions`/
   `roster_changes`/`condition_changes`/`significant_rolls`/`story_entries` as
   `[]`. The summary's counts (`entry_count`, `confrontations`,
   `significant_rolls`, `condition_changes`, `roster_changes`,
   `scene_transitions`) appear only in the existing text line
   (`index.ts:11423`) — they are never turned into fabricated array entries,
   because the raw rows no longer exist.
3. neither → `err("NOT_FOUND", …, corrective action enumerating valid IDs)`.
   Valid IDs are the live markers' ids concatenated with the archive's session
   ids, in log order; an empty enumeration says "no sessions recorded".

Rejected alternative: return an empty-typed payload for an unknown ID — it
would report a session that never existed as one with no events, which is worse
than a refusal and contradicts REQ-072f's explicit `[NOT_FOUND]`.

The current `ok("… not found …")` (`:11419-11425`) is the only asserted
behaviour of this branch and no harness reads it (probe: `grep -rn "not found in
the audit archive" holonovel/scripts` → 0), so the change is safe.

**D6 — badge filtering is computed once per builder call.** `getBadge()` is read
once into `const isGM`; every filter in D2's last column uses it. The text
renderer keeps its own existing badge checks — no behaviour change there — so a
badge regression in the payload cannot leak through the text and vice versa.

**D7 — the catalogue and REQ wording follow the implemented contract.**

- **D7a (REQ-072c1, length-neutral).** "…`conditions`, and `status` string
  fields" becomes "…`conditions`, and `status` typed fields" (`string` → `typed`,
  one character shorter; the body is 777 characters against the 800 limit). This
  resolves the contradiction between "typed values" and "string fields" that
  would otherwise force numbers to be stringified.
- **D7b (Appendix F).** T53 and T215 count 15 fields and name `story_entries`;
  T53's status sentence carries the four statuses (`alive`, `unconscious`,
  `dead`, `incapacitated`) and the no-death-condition fixture; T214 states that
  `rounds` comes from the end entry's `rounds_played` (falling back to the
  advance formula); T212 states the `model.death_condition` declaration rule
  from D3. IDs, positions, and the row count are unchanged.
- **D7c (REQ-175a/175b amendments).** `rounds_played` is the live combat round
  counter written into the end entry (`state.ts:2618` from `:2579-2583`), not a
  value derived from the log, so reading it does **not** satisfy REQ-175a's
  published formula. REQ-175a (653 characters) is amended to make the end
  entry's `rounds_played` the source and to keep the divide-by-participants
  formula for an end entry that lacks it: "the round count (the `rounds_played`
  value on the `manage_combat (action: end)` entry, or the count of
  `manage_combat (action: advance)` entries divided by participant count when
  that value is absent)". REQ-175b (250 characters) is amended in the same
  class: its opening "When no combat is active, …" is replaced by "When the
  timespan contains no completed confrontation, `confrontations_completed` SHALL
  be an empty array; when no combat is active, `confrontation_pending` SHALL be
  null." — D4 returns completed objects whenever an `end_combat` exists, which
  the literal sentence currently forbids. Both edits stay inside the
  800-character and sentence-count limits; neither adds a sentence to
  REQ-175a. Rejected alternative: follow the formula and set T214's expected
  rounds to 1 — it contradicts T214's own catalogue row and the round the
  fixture actually played.
- **D7d (citation hygiene).** `test-backfill.ts:216`'s title carries `T072`,
  which Appendix F does not catalogue (`grep -n "^| T072 " appendices-reference.md`
  → 0), and `T261`, which is a `Manual` world-model transcript replay
  (`appendices-reference.md:1721`), not a recap assertion. Both tokens are
  dropped from the widened title; the padded/absent-ID sweep remains the
  separate P2 roadmap item, and this increment does not broaden it.

**D8 — audit the creation paths (roster_changes; REQ-040a).** Add
`audit("create_character", {entity_id, name})` after the successful create at
`:4759` and `:4804`, and `audit("import_character", {entity_id, name, roster_id})`
after the roster import at `:4855`, each **before** `saveNovel()` so the entry
persists with the change (the ordering rule the last increment established).
This is required for `roster_changes` to have any "created" source, and it
closes a REQ-040a gap on three mutating paths. `remove_character` and
`create_npc`/`remove_npc` already audit. Rejected alternative: deriving
creations from `novel.metadata.created` or the roster file — neither records a
per-entity timestamp in the audit timespan, and REQ-072c2 asks for `timestamp`.

## 4. Blast radius

| Path | Size | Change | Gate that notices |
|---|---|---|---|
| `holonovel/src/index.ts` | L | `okWith` helper; `buildRecapPayload`; status/death-condition rule; confrontation pairing; session scoping, with an unknown `session_id` replacing the recap with `[ERROR] [NOT_FOUND]`; payload attached on all three returns (scoped, Lonelog, default); three creation audits; `manage_context` description names the structured recap | `typecheck`, `check-tool-definitions-sync`, `tool-definitions-lint`, `surface-budget`, `action-conflicts` |
| `holonovel/scripts/test-output-contracts.ts` | M | New T53 (field set, bounds, badge filter, parity, and the `grounding` assertion), new T212 (death-condition fixture), widened T214 (typed confrontation objects) | harness run |
| `holonovel/scripts/test-backfill.ts` | S | T215 asserts the 15 typed fields and ISO/null timespans; title drops the uncatalogued `T072` and the Manual `T261` | harness run |
| `holonovel/tool-definitions.json` | S | Regenerated for the `manage_context` description; deterministic | `check-tool-definitions-sync`, `tool-definitions-lint` |
| `spec/audit/tool-surface-baseline.json` | S | Rewritten only if `surface-budget --write` reports the footprint moved (the description grows) | `surface-budget`, `surface-replay` |
| `holonovel/DECISIONS.md` | S | Action/token counts refreshed only if the baseline moved; the REQ-137a gate-classification table is unchanged (no new tool or action) | `check-traceability`, `surface-budget` |
| `holonovel/src/core/server.ts` | — read-only | `:62-63` reads `structuredContent.category`/`.status`; the payload keeps `status: "OK"` and adds no `category`, so refusal auditing is unchanged. Probed, not edited. | `test:security` |
| `holonovel/scripts/test-competitive-gaps.ts` | — read-only | T518 reads `gm_notes` in the text envelope; unchanged. Run as a baseline and in the done bar. | harness run |
| `holonovel/scripts/test-limits.ts` | — read-only | Archived-session text (`archived_session: s1`) unchanged. Run in the done bar. | harness run |
| `holonovel/scripts/test-memory-recall.ts` | — read-only | T699's no-arg recap comparison and the tiered lines unchanged. Run in the done bar. | harness run |
| `holonovel/scripts/holosuite.ts` | — read-only | `--tier=novel`'s `recap_is_prose_only` reads the text envelope; unchanged. Run in the done bar. | harness run |
| `holonovel/scripts/run_ruleset_pattern_buffer.ts` | — read-only | The Lonelog recap row reads the text envelope; the payload is attached on that return without changing it. Run in the done bar. | harness run |
| `holonovel/scripts/test-lean-narrator.ts` | — read-only | Structured-envelope assertions; `okWith` keeps the envelope shape. Run in the done bar. | harness run |
| `holonovel/scripts/test-workflow.ts` | — read-only | Reads `structuredContent.options`; the recap payload adds none. Run in the done bar. | harness run |
| `holonovel/scripts/test-security.ts` | — read-only | Refusal auditing and the structured envelope; no `category` is added. Run in the done bar. | harness run |
| `holonovel/scripts/test-tool-definitions.ts` | — read-only | Asserts the declared descriptions; re-run after regeneration. | harness run |
| `spec/02-requirements.md` | S | REQ-072c1 "string fields" → "typed fields" (777 → 776 characters); REQ-175a round-source amendment (653 → ~718); REQ-175b empty-array scope (250 → ~300); all inside the 800-character and sentence limits | `validate`, `lint` |
| `holonovel.md` | S | Regenerated by `npm run assemble`, which writes the root copy (committed, never hand-edited) | `validate`, `lint`, `check:fast` |
| `holonovel/holonovel.md` | S | The embedded copy, written by the same assemble step (`scripts/assemble.ts:7`); hashes equal to the root copy | `test:spec-tooling` (embedded spec hash) |
| `holonovel/src/generated/contract-fingerprints.ts` | S | Regenerated by `regenerateContractFingerprints()` because §5.6 is a `DATA_FORMAT` section | `check-fingerprint-sync` |
| `spec/appendices-reference.md` | S | T53/T212/T214/T215 row text per D7b; no ID or count change | `validate`, `lint` |
| `spec/audit/review-register.md` | S | F-P3B1-3 `Resolved` with predicates; F-P3B1-9 narrowed to the seven deferred rows; chunk P3b-1 cross-reference and every `Scheduled-roadmap` row naming the section updated | `check-registers` |
| `spec/audit/req-coverage.md` | S | Regenerated | `validate` freshness check |
| `ROADMAP.md` | S | Surviving section retitled *§5.6 clock and combat-report remediation (P1)*, scoped to F-P3B1-6/-7 and seven citations, trigger rewritten | `check-roadmap` |
| `CHANGELOG.md` | S | Dated `2026-11-12` heading; one bullet per surface group plus the three REQ wording fixes and the Appendix F amendments | `session:close` |
| `docs/plans/2026-11-12-5-6-recap-typed-payload/{plan,tasks,aar}.md` | S | This plan, its task list, the AAR | `check-loop-artifacts` |

Fingerprint membership: §5.6 **is** a `DATA_FORMAT` section —
`scripts/lib/contract-fingerprint.ts:38` lists `### 5.6 ` in `DATA_SECTIONS` —
so the REQ-072c1/175a/175b edits invalidate
`holonovel/src/generated/contract-fingerprints.ts`. Execution regenerates it
with `regenerateContractFingerprints()` (or `npm run build-order`) and
`check-fingerprint-sync` gates the result. This corrects the draft's claim that
§5.6 feeds no fingerprint (§12). `spec/audit/req-coverage.md` is regenerated
because the REQ evidence changes, not because its bucket does.

Not touched: `holonovel/src/core/state.ts` (no new persisted field, no schema
change), `spec/04-runtime.md` (§7.7 unchanged — nothing new is persisted),
`holonovel/package.json`, `holonovel/AGENTS.md` (no tool, action, or count
change — `check-tool-surface` verifies), `scripts/` (no new gate),
`docs/engine-contract.md` (recap is a tool result, not an engine seam).

## 5. Phases

### Phase 0 — baseline and probes

1. Re-run `npm run check:fast` and record the count (green at draft time); run
   the eleven harness suites named in §2 for their baselines.
2. Re-anchor every `index.ts` line in §1 against this tree after the first edit
   (the payload refactor moves line numbers inside the recap branch).
3. **Field-source probe.** Confirm each D2 row's source and badge filter in the
   tree before writing the builder; a missing source is a scope change resolved
   before the first edit.
4. **Text-consumer inventory.** Run the eleven-site, seven-file probe from D1
   as a single `grep` and record the count in `aar.md`; each consumer must keep
   passing without an edit. Any consumer that does need an edit is amended in the phase
   that changes the text, not by rewriting the text to suit it.
5. **Roster-source probe.** Confirm the three creation sites audit nothing
   (`:4716-4762`) and that `removeEntity` (`:4640`) and the NPC paths (`:7787`,
   `:7832`) do; confirm `state.ts:2423`'s counter reads tool names nothing
   writes.
6. **Sibling-contract probe.** `grep -n "manage_context" spec/02-requirements.md`
   and `grep -n "action: recap\|recap\b" spec/02-requirements.md`: the expected
   binder set is REQ-072a1–i, REQ-174a/b, REQ-175a/b, REQ-239b, REQ-279a–c, and
   REQ-592 (tiered memory). A REQ outside that set that binds `recap` changes the
   phase scope and is resolved before the first edit. `action-conflicts` in the
   fast gate re-checks the surface afterwards.
7. **File-surface probe.** Four surfaces: (1) registration and
   the `manage_context` description in `holonovel/src/index.ts`, (2) the
   response seam — `core/server.ts:62-63` reads `structuredContent.category`
   and `.status`, and the new payload leaves `status: "OK"` and adds no
   `category`, so refusal auditing is unaffected; (3) the regenerated
   `holonovel/tool-definitions.json` and the surface baseline; (4) the
   assertions named in Phase 5. The probe confirms each still applies rather
   than assuming the implementer will discover it.
8. **Death-condition passthrough probe.** Confirm `rulesets.hydrate(slug).model`
   preserves an undeclared key such as `death_condition` from a fixture's
   `model.json` (`test-output-contracts.ts:113-125`). If hydration strips it,
   the fallback is the ruleset-free rule applied to bound models without the
   key — recorded as a scope change before Phase 3, not discovered during it.
9. **Audit-length probe.** `grep -n "audit_log.length" holonovel/scripts` for
   assertions that would move when creation is audited.
10. Write `tasks.md` and a skeleton `aar.md` (`Status: in progress`, ending
    `LOOP OPEN`) so `check-loop-artifacts` stays green mid-session.

**Done when:** clean tree, green `check:fast`, eleven harness baselines recorded,
the field-source, text-consumer, roster-source, sibling-contract, file-surface,
death-condition, and audit-length probes recorded, tasks written.

### Phase 1 — red probes

Write each assertion before its implementation and capture the failing output in
`aar.md`:

- A populated Novel's recap has `timespan_start`, `timespan_end`, `entities`,
  `confrontations_completed` (array of objects), `confrontation_pending`,
  `scene`, `scene_type`, `lore_entries`, `narrative_directive`,
  `scene_transitions`, `roster_changes`, `condition_changes`,
  `significant_rolls`, `total_combat_rounds`, `story_entries` (T53/T215).
- An entity at full HP, one at 0 HP, and one with the fixture's death condition
  report `alive`, `unconscious`, `dead`; the same Novel with no death condition
  reports `alive` and `incapacitated` (T212).
- A completed combat yields one entry with participants, `rounds: 2`, outcome;
  an open second combat yields a non-null pending object with participants,
  round, and turn position (T214).
- An unknown `session_id` returns `[ERROR] [NOT_FOUND]` naming the valid IDs.
- `roster_changes` carries `created` for a created character and `removed` for
  a removed one; a `condition_expired` combat tick appears as `removed` in
  `condition_changes` with a resolved entity ID.
- A recap taken under a badge that grounds responses still carries `grounding`
  in its structured result after `okWith` replaces `ok` (B2).

**Done when:** every listed assertion has been observed red once in the named
harness, with the transcript in `aar.md`. If an assertion passes before its fix
(the existing significant-rolls field and the text parity checks are expected
cases), record it as already-satisfied evidence instead of forcing a red.

### Phase 2 — payload builder (D1, D2, D4, D6; F-P3B1-3)

- Factor the existing recap body into `buildRecapPayload` + the current text
  renderer, so the text output is byte-identical where no field changed.
- Implement the 15 fields with typed nulls and the D6 badge filter; reuse
  `entityHp`, `rollDetail`, and the existing orientation builder.
- `okWith` and the three attachment points (scoped, Lonelog, default).

### Phase 3 — status and confrontations (D3, D4; T212, T214)

- `entityStatus(entity, novel)` with the death-condition declaration lookup.
- Confrontation pairing with `rounds_played` and the legacy fallback.
- Fixture ruleset model declaring `death_condition` for T212.

### Phase 4 — scoping, refusal, audits (D5, D8)

- Scoped payload for a live `session_id`; archived payload in the typed-empty
  shape (D5 item 2: summary timespans, metadata total, every array `[]`);
  `[NOT_FOUND]` with the enumerated valid IDs, replacing the whole-recap
  response.
- Three creation audits before `saveNovel()`.

### Phase 5 — assertions, registers, roadmap, generated surfaces

- Write T53 and T212; widen T215 (15 fields) and T214 (typed objects); drop the
  uncatalogued `T072` and the Manual `T261` from the backfill title.
- Review register: F-P3B1-3 `Resolved` with the current predicates; F-P3B1-9
  reduced to the seven deferred citations; chunk P3b-1's "Scheduled under" line
  names the resolved set and the retitled section; every `Scheduled-roadmap`
  disposition row that names this roadmap section follows the retitled name in
  the same edit, because `check-registers` cross-checks the two.
- `ROADMAP.md`: retitle to *§5.6 clock and combat-report remediation (P1)* and
  scope the trigger to F-P3B1-6/-7 plus the seven citations.
- `spec/02-requirements.md` REQ-072c1 wording (D7a) **and** REQ-175a's round
  source plus REQ-175b's empty-array sentence (D7c); Appendix F rows (D7b).
- `npm run validate -- --write-register`; regenerate `tool-definitions.json`
  (run `check-tool-definitions-sync` first to see the drift);
  `npm run surface-budget --write` and DECISIONS counts only if it moved.
- Run `check-roadmap`, `check-registers`, and `npm run validate` immediately
  after the register, REQ, and Appendix F edits, before the next phase.

### Phase 6 — gates

`npm run assemble`, `npm run check:fast`, the eleven harness suites, root and
server `typecheck`, `npm run surface-budget`, then `npm run build-order` and read
the check summary rather than swallowing it.

## 6. Verification

| Gate | Command | Expected |
|---|---|---|
| Baseline | `npm run status`, `npm run check:fast` | 41/41, `check:fast: PASS` |
| Harness baselines | eleven suites in §2, before any edit | per-suite pass counts in `aar.md` |
| Output contracts | `npm --prefix holonovel run test:output-contracts` | pass; T53/T212 added, T214 widened |
| Backfill | `npm --prefix holonovel run test:backfill` | pass; T215 widened, title free of `T072` and `T261` |
| Lean narrator / workflow | `test:lean-narrator`, `test:workflow` | pass; structured envelope and `options` unchanged |
| Memory / limits | `test:memory-recall`, `test:limits` | pass; T699's no-arg recap stays byte-identical |
| Security / definitions | `test:security`, `test:tool-definitions` | pass after regeneration |
| Text-envelope consumers | `test:competitive-gaps`, `test:holosuite-novel`, `test:pattern-buffer-ruleset` | pass; T518, `recap_is_prose_only`, and the Lonelog recap row unchanged |
| Types | `npm run typecheck`, `npm --prefix holonovel run typecheck` | clean |
| Spec bodies | `npm run validate` | REQ-072c1, REQ-175a, and REQ-175b pass the 800-character and shape checks |
| Surface | `npm run surface-budget --write` then `npm run surface-budget` | within budget; DECISIONS counts only if moved |
| Coverage | `npm run validate -- --write-register` | 0 errors, no bucket-A growth |
| Fast gate | `npm run check:fast` | all pass, trailing PASS read un-piped |
| Full gate | `npm run build-order` | `check` green, summary printed |

Negative-path checks that must appear in the assertions, not only the happy
path: `max_transitions=0` and `max_rolls=51` are `[INVALID_INPUT]` with the
range named; an unknown `session_id` is `[NOT_FOUND]` with valid IDs and
`isError: true`; a Player recap carries no other entity's `entities` entry, no
GM-only `lore_entries` key, and no GM-only `story_entries`; a Novel with an
empty log returns null timespans and empty arrays rather than omitting keys; a
ruleset with no death condition never reports `dead`; a pending confrontation
reports `turn_position` as a participant id, not an index; a grounded recap
keeps `grounding` in its structured result; a `condition_expired` row appears in
`condition_changes` as `removed` with a resolved entity ID.

## 7. Risks and mitigations

1. **The payload and the text drift.** Two renders of the same state can
   disagree. Mitigation: both derive from the same builder for the fields both
   carry, and T53 asserts the parity points; the text renderer is not rewritten,
   so any divergence is limited to fields the text never rendered.
2. **A Player-badge field leaks GM state.** `entities`, `lore_entries`,
   `story_entries`, and `roster_changes` each need a filter, and the existing
   text path filters only some. Mitigation: one `isGM` per call, one filter per
   field in D2, and T53 asserts the Player payload as well as the GM payload.
3. **`story_entries` changes visibility.** Today it is GM-only in the text; the
   payload gives the Player own-entity entries. Mitigation: the text keeps its
   current GM-only behaviour (no text change), the payload filter is asserted,
   and the divergence is deliberate — REQ-279c already sources Player
   orientation from own-entity story entries.
4. **The death-condition field is a new ruleset-model read.** A package that
   never declares it reports `incapacitated` at 0 HP, which is the REQ's stated
   fallback. Mitigation: T212 covers declared and undeclared fixtures, and D3
   documents the alias.
5. **Creation audits shift existing counts.** A harness that counts audit
   entries or asserts a creation leaves no trace would move. Mitigation: Phase 0
   greps `holonovel/scripts` for `audit_log.length` assertions near character
   creation and records the result; any reconciliation is a Phase 0 deliverable.
6. **T699's byte-identical no-arg recap.** That assertion compares two plain
   recaps, not a pre/post-change literal, so it stays green; but adding payload
   fields to `structuredContent` changes the response size.
   `check-performance-record` and `surface-budget` measure the tool surface, not
   result size, and `tool-call-bytes` counters read the text. Mitigation: Phase 6
   runs both surface gates and the record freshness gate; if the record moved,
   it is regenerated in the same commit.
7. **Register/roadmap drift.** Two registers, four Appendix F rows, and ROADMAP
   describe the same findings. Mitigation: Phase 5 runs `check-roadmap`,
   `check-registers`, and `validate` immediately after the edits, and the AAR
   references the registers instead of restating them.
8. **Scope creep into the deferred surfaces.** The clock models and the combat
   report are adjacent and both cite the same register chunk. Mitigation: D1-D8
   name no clock or combat-report behaviour, §8 lists them explicitly, and the
   roadmap split keeps them an open P1 section.

## 8. Deliberately deferred

- **F-P3B1-6** (clock interaction models: `clock_type`, `opposes`,
  `link_countdown`, `retreat_countdown`, the four models) and **F-P3B1-7**
  (audit-derived combat turn report with the lowercase `[auto]` marker) — the
  surviving P1 section.
- **F-P3B1-9's remaining rows** — T271, T54, T139, T25, T33, T110, T161 assert
  behaviour those two findings build; writing them now means writing red tests
  and leaving them red.
- **Publication** — `./scripts/push-pipeline.sh` is a user-authorized step.
- **The P2 sweeps** and the Trust-core and §5.3/§5.4 P1 sections — untouched.
- **The padded/absent harness-ID sweep** (T072 is one instance) — the separate
  P2 roadmap item owns the full enumeration; this increment corrects only the
  title it widens.
- **`entities` beyond the PC roster.** NPCs appear in `participants` and in
  orientation; adding them to `entities` would require a presence contract this
  REQ does not state.
- **`gm_notes` (REQ-072h) and `tiered_memory` (REQ-072i) stay text-only.** Both
  already render in the text envelope (`index.ts:11365` default, `:11442`
  Lonelog; `tiered_memory` at `:11415`) and both have
  passing assertions (T518, T699); neither is a REQ-072c1/c2 field, so the
  payload does not add them and this increment does not touch their contracts.
  If a later increment moves them into the payload, it owns their badge-filter
  and degradation assertions.

## 9. Commit plan

One commit (`§5.6 typed recap payload remediation`), per AGENTS.md's "a spec
increment is one commit" rule, containing the payload, the assertions, the
roadmap split, and the register truth-keeping. The CHANGELOG heading is dated
`2026-11-12` with one bullet per surface group: recap payload, entity status,
confrontation derivation, session scoping, creation audits, catalogue rows, and
the regenerated surfaces.

## 10. User impact and sizing

- **The LLM narrator** gets a machine-parseable recap with typed entities,
  confrontations, lore, and changes, so it can narrate without re-reading the
  text blob or guessing at counts.
- **The Player** gets own-entity recap data and no GM-only lore, story, or
  roster rows in the structured result; the text they see is unchanged.
- **The GM** gets per-combat summaries with participants, rounds, and outcome,
  and a correct refusal when they name a session that does not exist.
- **Cost:** roughly 180-260 changed source lines (one builder, one status rule,
  three audits, one refusal) plus five assertions across two harness files; one
  regenerated artifact (`tool-definitions.json`); two register files and four
  catalogue rows; one roadmap split; no migration (no new persisted field, no
  schema version change).

## 11. Review record

- Self-review: run. Resolved and now decided in the body — REQ-548a parity is
  typed-superset plus the three parity assertions (D1); `scene_type` is
  `string | null` from the live array (D2); the archived payload's empty arrays
  are the REQ-072d typed-empty case (D5); and the creation audits belong here
  because `roster_changes` has no other source (D8). Blockers B1–B5 and Majors
  M1–M9 from the cold pass are incorporated (§12).
- Cold pass (`independent-review`, standard depth, fresh context): **FAILED**
  on revision `735b0408…` with five Blockers — B1 the round-count override
  lacked a REQ amendment, B2 `okWith` would drop `grounding`, B3 three text
  consumers are ungated, B4 the blast radius omitted files the plan names, B5
  the deferred-citation count was six against seven tokens — and nine Majors
  (`entityHp` null normalization, the `args` name collision, the roster and
  condition action mappings, T261's Manual status, the §11 contradiction, the
  stale evidence sidecar, the scoped-path text, and the `gm_notes`/
  `tiered_memory` disposition). All are resolved in this revision; the artifact
  is `cold-review.md`.
- Diff re-review (standard-depth cap, 1 of 1): **FAILED** on the amended artifact
  at `e1f1ccd6…` with one new Blocker (N-B1) and no unresolved prior finding:
  the REQ-175a amendment was decided in D7c and listed in §4, but §1 still said
  no normative change beyond REQ-072c1, and neither the Phase 5 spec bullet nor
  the done bar carried it — executing the phase list would have left the REQ
  and T214 disagreeing. Resolved in this revision by restating §1, adding the
  amendment to the Phase 5 bullet, the done bar, and the §6 spec-body row. The
  re-review also found the sibling `tasks.md` stale against the plan (six/seven
  counts, `args`/`opts`, eight/eleven suites, the missing REQ-175a step); it is
  regenerated. The cap is reached, so this amendment is not re-reviewed here
  and is carried as condition C-1 into `build-review`.
- Conditions carried into execution: **C-1** — `build-review` confirms the
  REQ-175a body names `rounds_played` and the REQ-175b body scopes its
  empty-array sentence before Phase 5 closes, and that `tasks.md` and `plan.md`
  agree on the seven citations, the eleven suites, and the `opts` parameter.
- Second cold pass (fresh context, standard, 13/40 reads) on revision
  `aa71e59c…`: **FAILED** with two Blockers — the assembled spec copies
  (`holonovel.md`, `holonovel/holonovel.md`) were absent from the blast radius,
  and the archived-session payload was specified two ways — plus three Majors
  (significant-rolls scoping, REQ-175b's literal empty-array sentence, T53's
  three-status row) and six Nits. All are resolved in this revision and
  recorded in §12; the reports are in `cold-review.md`.
- Review-policy unknowns: the cold pass ran its five stage roles as five lenses
  in one fresh context rather than five separate dispatches, and the harness
  injected `holonovel/AGENTS.md` into that context. Both are recorded in
  `cold-review.md`; neither changes the verdict class.

## 12. Delta amendment log

- **2026-11-12 (execution delta).** Three plan assumptions were invalidated by
  execution evidence and are amended here rather than improvised:
  1. **§5.6 is fingerprinted.** `scripts/lib/contract-fingerprint.ts:38` lists
     `### 5.6 ` in `DATA_SECTIONS`, so the REQ edits invalidate
     `holonovel/src/generated/contract-fingerprints.ts`. The §4 fingerprint
     paragraph and table now name the regeneration; `check-fingerprint-sync`
     passes after it.
  2. **The creation audit is visible to the Player.** REQ-168a grants the Player
     GM-badge entries "where the entity affected is owned by the current
     player", and the new `create_character` args carry `entity_id`, so the
     existing T203 assertion ("never a GM-badge entry") contradicted the REQ.
     T203 now asserts that no GM-badge entry names a *foreign* entity, with the
     REQ-168a citation. This is an existing-expectation reconciliation, not a
     behaviour change to the resource filter.
  3. **T214's fixture named no participants.** `manage_combat (action: init)`
     defaults to `participants: []`, so the assertion passes explicit ids and
     advances twice (one full round) to make `rounds_played` 2; this also
     demonstrates that the recorded value wins over the advance/participants
     formula (2 advances ÷ 2 participants = 1).
  Pre-existing failures recorded, not caused by this increment: `test:memory-recall`
  (T752), `test:limits` (T740), and `test:holosuite-novel` (8 anchor findings
  whose predicates were already wrong at `HEAD` — e.g. `index.ts:9945` is `}`),
  plus `test:holosuite-invariants`/`adversarial` share the same stale anchors.
- **2026-11-12 (second cold pass).** B1 adds `holonovel.md` and
  `holonovel/holonovel.md` to the blast radius (both written by `npm run
  assemble`). B2 replaces the archived payload's "aggregate fields are the
  summary's counts" with an explicit typed-empty mapping, and Phase 4 matches.
  M1 scopes `significant_rolls` to the passed slice and records that
  `scene_transitions` stays Novel-wide because `scene_history` is not audited.
  M2 amends REQ-175b's empty-array sentence. M3 adds T53's four-status sentence
  to D7b. Nits: the done-bar red-observation wording, the `gm_notes` line
  anchors, the `timespan_*` override folded into D2, the `grounding` assertion
  named in the harness row, four more read-only harness rows, and the
  unknown-`session_id` description corrected to "appends to the full recap".
- **2026-11-12 (first cold pass).** B1/D7c amend REQ-175a rather than
  claiming `rounds_played` is log-derived; the §4 spec row and the gate list
  reflect it. B2 defines `okWith` through `structured(..., extra)` so
  `grounding` survives. B3 adds `test:competitive-gaps`, `test:holosuite-novel`,
  and `test:pattern-buffer-ruleset` to the baseline and done bar. B4 adds the
  read-only rows and removes the false "all named in §4" claim. B5 writes seven
  citations everywhere. M1-M9 add the `entityHp` normalization, the `opts`
  rename, the D2a mapping table, T261's removal from the widened title, the
  settled §11 record, the scoped-text clarification, and
  the `gm_notes`/`tiered_memory` deferral.
