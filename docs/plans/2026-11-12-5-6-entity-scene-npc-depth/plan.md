# Plan — §5.6 entity, scene, and NPC-depth remediation

Status: reviewed (cold pass FAILED on the first revision, diff re-review passed; no open conditions) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-12-5-6-entity-scene-npc-depth/`
Rollback cost: 1 (server source, one generated artifact, harness assertions,
registers, ROADMAP split; reversible in one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the top open `ROADMAP.md` section, and the first two of its three finding
groups: **F-P3B2-1 through F-P3B2-8** in `spec/audit/review-register.md`
(`:2057-2088`). Those eight findings are the entity/roster/scene/presence
surfaces and the NPC depth-and-memory surfaces. The third group (F-P3B2-9…14:
personality rendering, voice directives, personality resources, player signals,
boundary propagation, citation repair) becomes its own scheduled P1 section in
this same increment, so neither session inherits a bar it cannot close.

The REQs already state the contracts (REQ-074b/c, REQ-075c/d/e, REQ-076b2–b7,
REQ-156, REQ-176a, REQ-177, REQ-178a/b, REQ-252a/b/c, REQ-307a/b/c, REQ-311b/c/d/f).
The server is narrower than the spec. This is an implementation-and-assertion
increment, not a spec-design change: no `spec/02-requirements.md` body edit.

Baseline (this session, before any edit):

- `npm run status`: version `2026.11.12`, 59 unpushed commits, 10 open roadmap
  items, last publish `2026-11-09`. Publication is **out of scope** (§8).
- `git status --short`: dirty — the finished §5.6 adventure-content increment is
  staged-but-uncommitted (plan, tasks, AAR, cold review, `holonovel/src`,
  `spec/audit/*`, ROADMAP removal). Phase 0 commits that increment first; this
  plan's findings are re-anchored after that commit, because the register's
  cited line numbers have already drifted by the adventure increment.
- `npm run check:fast`: **41 passed, 0 failed**, `check:fast: PASS` (on the dirty
  tree above).

Findings and current predicates (verified at draft time, symbol-anchored):

| Finding | Predicate (current) | Contract |
|---|---|---|
| F-P3B2-1 | `import` checks ruleset scope and entity cardinality but never the per-Novel roster-ID duplicate (`index.ts:4662-4681`); `party://current` returns name/active/conditions/present/last_location and no HP (`:14364-14374`); `remove` deletes the entity, clears `active_entity_id`, writes no audit and leaves `characters_present_ids` untouched (`:4804-4809`); `roster_remove` enumerates no valid IDs (`:4810-4816`) and writes no audit — an REQ-040a gap, not an REQ-177 one, because REQ-177 requires only `[FORBIDDEN]` and the enumerated `[NOT_FOUND]` | REQ-074b, REQ-074c, REQ-176a, REQ-177, REQ-040a |
| F-P3B2-2 | `roster_list` maps `{ id, name }` only (`:4817-4821`), and `RosterEntity` extends `NovelEntity` with no race/class/level fields (`core/state.ts:905-912`), so those values can only be derived from the ruleset-derived `stats`; `roster://{id}` exists (`:14547-14557`), `roster://<type>` does not | REQ-178a, REQ-178b |
| F-P3B2-3 | `scene://history` returns the whole array with no cap, suppressed count, or `[truncated]` marker (`:14013-14021`); `scene_tick` appears in no server symbol; `manage_scene (action: set)` runs the sticky-lore loop (`:7160-7166`) but performs no contradiction comparison | REQ-076b2, REQ-076b3, REQ-076b5, REQ-076b6, REQ-076b7 |
| F-P3B2-4 | `fast_forward` advances `narrative` countdowns and NPC `changes` and audits `[fast-forward]` (`:7173-7197`), but skips `round` countdowns entirely, records no lore triggers, and emits no bridging-summary prose | REQ-252a, REQ-252b, REQ-252c |
| F-P3B2-5 | `party://current` derives `present` and reports `last_location` from `current_room` (`:14364-14374`); the briefing lists no party, so no entity ever carries `[not present]`; `manage_staging (action: presence)` sets `characters_present_ids` and nothing else — no `location` parameter, no audit, no other scene field touched (`:7279-7285`) | REQ-307a, REQ-307b, REQ-307c |
| F-P3B2-6 | `NpcState` carries no `appearance_count`, `first_seen`, or `last_seen` (`core/state.ts:247-275`); the briefing renders NPCs without depth markers (`:16138-16168`); `manage_context (action: recap)` renders disposition prose but no NPC heatmap (`:10837-10880`) | REQ-075c, REQ-075d, REQ-075e |
| F-P3B2-7 | `manage_character (action: personality)` writes `personality.description` and only mirrors it to `npc.description` when the target is a Novel NPC (`:4790-4796`), while `npc://<id>/personality` returns `npc.personality` alone (`:14106-14114`) and `npc://<id>` returns the whole record — two fields, divergent reads | REQ-156 |
| F-P3B2-8 | `recordNpcInteraction` is called from exactly one place, the combat round loop (`:6671`); the memory record holds witnessed events, contacts, stress markers, last-3 interactions, and `composeNpcMemorySection` renders emotional state/last-3/goals (`:4876-4905`), but party knowledge per entity, automatic social/mechanical ingestion, and campaign-memory coupling are absent; `spec_health.npc_memory_count` exists (`:13763`) | REQ-311b, REQ-311c, REQ-311d, REQ-311f |

Two stale premises in the register are corrected by this plan rather than
carried forward: `roster://<id>` **does** exist (F-P3B2-2 covers `<type>` only),
and `party://current` **does** carry `present`/`last_location` (F-P3B2-1/5 cover
HP, briefing presence, and the `presence` parameter gap). The register rows are
rewritten to the current predicates when the findings close.

Out of scope: F-P3B2-9…14 (new roadmap section, §8), the P2 sweeps, and the
F-P3B1/B3/B4 families.

## 2. Done bar

**Done bar:** F-P3B2-1 through F-P3B2-8 are `Resolved` in
`spec/audit/review-register.md` with current predicates; `ROADMAP.md`'s §5.6
section is retitled to *entity, scene, and NPC-depth remediation* with its
trigger narrowed to F-P3B2-1…8, and the F-P3B2-9…14 bullet moved into a new
*§5.6 personality, signal, and citation remediation (P1)* section with its own
trigger, while the register's "Scheduled under" line at `:2054` names both;
every new assertion was observed red before its fix (the scene-tick, presence,
and `[truncated]` assertions included) and the transcripts are in `aar.md`; the
five assertion-home suites — `npm --prefix holonovel run test:output-contracts`,
`:test-backfill`, `:test-narrative`, `:test-briefing`, `:test-persistence` —
pass, and `:test-pattern-buffer` stays green; `npm run typecheck` (root and
server), `npm run check:fast`, and the full `npm run check` (via `build-order`)
are green; `spec/04-runtime.md` §7.6 carries the `TTRPG_SCENE_HISTORY_MAX` row;
the coverage register is regenerated and REQ-074/075/076/156/176/177/
178/252/307/311 stay bucket C at **family level** (their families are evidenced
by harnesses this increment extends, which is what bucket C measures), while
the specific test IDs F-P3B2-14 owns — T55, T56, T57, T112, T132, and the rest
of its list — remain unexercised and are recorded in `aar.md` as a known
coverage gap carried by the new section, never as resolved coverage here;
`npm run surface-budget --write` and the DECISIONS action/token counts agree with
the new `manage_staging` parameter; `holonovel/tool-definitions.json` is regenerated
because the `presence` action gains `location`; no new tool and no new action is
added; no new §7.7 property group is introduced — `scene_tick` rides Scene,
`appearance_count`/`first_seen`/`last_seen`/`appearance_scenes` ride NPC, the
contact fields ride NPC Memory, and `roster_source_id` rides the Novel entity
record; `aar.md` ends `LOOP PAUSED` with zero new action items.

Sizing note: eight findings, eight phases, three of them (scene ledger, presence,
NPC depth) each independently able to consume a session. If the cap binds, the
completed findings commit, the ROADMAP section stays open with those findings
moved to `Resolved`, and `aar.md` records the partial pass as `LOOP OPEN`. The
plan never claims a finding resolved without its green assertion, and Phase 0
(commit the finished adventure increment) happens first so the baseline is a
clean tree.

Current values the edit must respect:

- `spec/02-requirements.md` bodies: no edit. The spec-file edits are
  `spec/04-runtime.md` §7.6 (one configuration row, below),
  `spec/audit/review-register.md`, `spec/audit/req-coverage.md` (regenerated),
  and `ROADMAP.md`.
- `spec/04-runtime.md` §7.6 (`:127-241`) is the single source for every
  `TTRPG_*` variable. D4's `TTRPG_SCENE_HISTORY_MAX` therefore needs a row
  there, classified **Presentation — non-behavioral** (it bounds a read
  surface, not story state), which adds no §7.7 coupling row and no P-rule. §7.6
  is outside the fingerprint set, so `check-fingerprint-sync` stays green.
- `holonovel/src/index.ts` and `core/state.ts` are source, not fingerprinted
  sections. The fingerprint set (§5.9, §5.16–5.17, §6.3, §6.4.2, §7.7, §5.19,
  Appendix Q) is untouched, so `check-fingerprint-sync` stays green — provided
  the new fields are documented as members of the existing groups rather than
  as new ones. `scene_tick` rides the Scene group, `appearance_count`/
  `first_seen`/`last_seen`/`appearance_scenes` ride NPC, the contact fields ride
  NPC Memory, and `roster_source_id` rides the Novel entity record (precedent:
  the existing `codex_source` at `core/state.ts:243`), not the NPC group.
- `NovelEntity` has no `hp` field; HP lives in the ruleset-derived
  `stats: Record<string, any>` (`core/state.ts:237`, inside the interface at
  `:226-244`). REQ-074b's HP must therefore be a derived read, not a new stored
  field.
- `metadata.sessions` (`:841-849`) already carries per-session `timespan_start`
  values via the REQ-237 `[session-boundary]` markers, which is the only honest
  source for "not seen in 5 or more sessions" and "3 appearances across 2
  sessions".
- `manage_staging` is already classified `MUTATING` (`index.ts:198`), so the
  parameter addition does not change the mutating-tool classification, the
  action-conflict table, or the DECISIONS gate table.

## 3. Design decisions

**D1 — one presence resolver, one presence writer (F-P3B2-1, -3, -5).** Today
`present` is derived inline in `party://current` (`:14368`) and again, with a
different fallback, in the briefing's NPC-presence loops (`:16145`, `:16157`).
Both become calls to one helper, `presentEntityIds(novel): Set<string>` (absent
list ⇒ all present, per REQ-307a's backward-compatible rule), and one writer,
`setPresence(novel, ids, location?)`, used by `manage_scene (action: set)`,
`manage_staging (action: presence)`, and entity removal. `last_location` is
written by the same writer from the scene location at the moment presence is
declared. This is the whole of REQ-307a/b/c and the presence half of REQ-176a in
one place.

**D2 — roster identity is a stored provenance field, not an ID match (F-P3B2-1).**
`addEntity` sets `novel.entities.set(entity.id, entity)` and keeps the roster
ID, so a duplicate *could* be detected by ID today — but REQ-074c explicitly
says "matched by roster source ID, not Novel entity ID", which accommodates a
server that re-keys. The plan adds `roster_source_id?: string` to `NovelEntity`,
written on import, and the duplicate guard reads it with a fallback to the
entity ID so Novels saved before this build still detect their own duplicates.
`[STATE_CONFLICT]` carries REQ-074c's exact hint wording.

**D2b — the roster listing derives race, class, and level from `stats`
(F-P3B2-2).** `RosterEntity` extends `NovelEntity` (`core/state.ts:905-912`) and
carries no `race`, `class`, or `level` field, so REQ-178a's four fields beyond
id/name are **derived reads** from the ruleset-derived `stats` bag
(`stats.race`/`stats.species`, `stats.class`/`stats.classes[0].name`,
`stats.level`), each omitted when the ruleset does not define it. No stored
duplicate of the ruleset's own fields is introduced. `roster://<type>` reuses
the same derivation.

**D2c — `roster://<type>` is two static resources, not a template branch
(F-P3B2-2).** The URI space already has the `roster://{id}` template
(`index.ts:14547-14557`). Registering a second template over the same space
would make the choice order-dependent, so the plan registers **two static
resources**, `roster://class` and `roster://race`. The MCP SDK is expected to
resolve a concrete `registerResource` URI ahead of a `ResourceTemplate`, but
that is an assumption until Phase 1's red probe observes the actual resolution
order; if templates win, the fallback is one `roster://{type}` template whose
reserved tokens take precedence over the ID lookup, documented the same way.
`class` and `race` are reserved type tokens: a roster entry whose literal ID
equals one of them is still reachable through `roster://current` and
`roster_list`, and D2c states that in the resource description so the shadowing
is declared rather than discovered. Each resource returns
`{ type, groups: [{ value, entries: [{ id, name }] }] }` with entries built from
the D2b derivation; a reserved token whose group set is empty returns the
empty-state marker.

**D3 — removal is one helper, audited, presence-aware (F-P3B2-1).**
`removeEntity(novel, entityId)` snapshots, deletes, clears `active_entity_id`
when it matches, removes the ID from `characters_present_ids`, writes
`audit("remove_entity", { entity_id, name })`, and returns the `[OK]` line.
`manage_character (action: remove)` and the last-entity branch of
`manage_staging (action: presence, [])` both call it. **Removing the last entity
clears the presence field to `null`**, not to `[]` — REQ-176a requires
`characters_present` cleared, and D1 makes absent mean "all present" while `[]`
means "none present", so an empty array would leave a later import invisible.
Both directions are asserted. `roster_remove` stays Novel-independent: REQ-177
requires `[FORBIDDEN]` and the enumerated `[NOT_FOUND]` only, and it gains the
`audit("roster_remove", { roster_id, name })` call that REQ-040a's
mutation-audit rule asks of roster mutations — which is a no-op when no Novel is
active (`audit()` returns early, `index.ts:2725-2727`), so the assertion covers
the no-Novel case rather than promising an entry that cannot exist.

**D4 — scene ledger cap is configurable and reports what it hid (F-P3B2-3).**
`scene://history` returns the newest `TTRPG_SCENE_HISTORY_MAX` entries (default
50), newest-last to match the stored order. When entries were dropped, the
returned array **begins with one marker element**,
`{ suppressed: <n>, truncated: true, marker: "[truncated]" }`, so array-consuming
callers keep working while the count and the literal both surface; the marker
element's type is added to the resource's documented shape. The cap applies at
read time only; the audit log remains the unbounded record, per REQ-076b2.
Badge filtering (the existing `characters_present_ids` strip) runs before
truncation so the suppressed count never leaks the existence of GM-only fields.
The variable is registered in `spec/04-runtime.md` §7.6 as Presentation.

**D5 — `scene_tick` is Novel state, reset by the same branch that decides a
transition (F-P3B2-3).** `scene_tick: number` joins the Scene property group on
`NovelState`, serialized with the Novel, defaulting to 0 on load for Novels
saved before this build. Reset happens exactly where `isTransition` is computed
(`:7134`) — so a waypoint-only transition also resets it, per REQ-250b/076b3.
The increment site is the combat round wrap in `manage_combat (action: advance)`
(the branch that returns the `[AUTO]` turn line), not per attack. Rendered in
the GM Scene section only.

**D6 — the lore contradiction check is a pure keyword comparison (F-P3B2-3).**
New pure function `loreContradictionWarning(novel, location, description):
string | null` in `core/scene-ledger.ts`: it takes lore entries whose badge
scope is `game_master`/`shared` and whose triggers match the location name, and
NPC dispositions set explicitly (a non-default disposition on an NPC whose
`location` matches), then looks for an antonym pair between the lore content and
the new description using a small fixed adjective table (crowded/empty,
quiet/noisy, busy/deserted, bright/dark, clean/filthy, warm/cold, safe/
dangerous, prosperous/impoverished) rather than an NLP pass. REQ-076b7's own
acceptance example (crowded vs. empty) is a member of that table. Advisory: the
warning rides the `[OK]` line as a `[WARNING]` paragraph, never a refusal.

**D7 — fast-forward grows a bridging summary built from what it changed
(F-P3B2-4).** The existing `fast_forward` branch already collects
`countdown_adjustments` and `npc_changes`; it gains (a) proportional `round`
countdown advancement (decrement = declared interval days, floored at 1, same
rounding as the narrative branch), (b) lore entries whose triggers match the new
scene, collected into `lore_triggers`, and (c) a `summary` string composed from
the interval, the countdown deltas, the NPC moves, and the lore triggers,
appended to the `[fast-forward]` audit entry and returned after the `[OK]` line.
`skip_countdowns` suppresses (a) and (b) but not (c)'s statement of what was
skipped. REQ-252c's `[FORBIDDEN]` for Player is already satisfied by
`requireGM()` on the action.

**D8 — appearance metadata is maintained on the render path, gated by
`opts.mutate` (F-P3B2-6).** `appearance_count`, `first_seen`, and `last_seen`
join `NpcState` (NPC group). An NPC *appears* in exactly two places, both
NPC-scoped — `characters_present_ids` holds Novel entity IDs only (REQ-076b1,
`index.ts:14367-14371`) and is never an NPC source:

1. the GM briefing loop that renders present NPCs, where the increment sits
   behind the existing `opts.mutate` flag for the same reason the pacing counter
   does — `manage_novel (action: get_context)` renders with `mutate: false` and
   must stay side-effect-free;
2. `manage_scene (action: set)`, for each NPC whose `location` matches the new
   scene location — the same predicate the briefing's presence loops use
   (`:16145`, `:16157`) — so a scene change that places an NPC counts it even
   when no briefing was rendered.

**The increment unit is one appearance per NPC per scene.** `appearance_scenes`
(the set D9 also reads) is the dedup key: an increment is recorded only when the
current scene is not already in that set, so the scene-set site and a later
briefing render of the same scene count the NPC once, and repeated briefing
renders never inflate the count. This keeps REQ-075c's acceptance figure ("3
appearances across 2 sessions") stable across render frequency. The set is
capped at 50 scene entries (oldest dropped) to bound the record; dropping old
entries can only make a much later re-visit count again, which is correct.
Markers: `< 3` name+description only, `>= 3` `[recurring]` with the count,
`>= 10` `[campaign]`. `[distant]` derives from sessions since `last_seen` by
counting `metadata.sessions` entries whose `timespan_start` is later than
`last_seen`, and is suppressed when no session data exists (never guess an
integer, mirroring REQ-173b's rationale).

**D9 — the recap heatmap reads the same metadata and ships as a GM-only
sub-block (F-P3B2-6).** `manage_context (action: recap)` gains an "NPCs in this
campaign" block for NPCs with `appearance_count > 1`, listing sessions appeared
and distinct scenes. Scene count comes from `appearance_scenes` (a
`Set<string>` of scene descriptions seen, capped at 50 to bound the record);
session count comes from the session-boundary derivation in D8. Player badge
omits the block, since appearance counts reveal off-screen activity.

**D10 — one description field with one reader and one writer (F-P3B2-7).**
`npcDescription(npc)` returns `npc.personality?.description ?? npc.description`
and `setNpcDescription(npc, value)` writes both, so the two historical fields
stay synchronised for Novels saved before this build and new writes never
diverge. `npc://<id>`, `npc://<id>/personality`, the `sheet` output, and the
briefing all call the reader. The write path is
`manage_character (action: personality)` and `manage_npc (action: create|update)`
— most recent write wins, per REQ-156.

**D11 — NPC memory ingestion moves to interaction points, and campaign memory
couples on significant events (F-P3B2-8).** `recordNpcInteraction` is called
from three places instead of one: the combat round loop (existing), a resolved
social check against an NPC, and a `manage_npc (action: update)` that changes
`disposition`. Contacts gain `apparent_capabilities: string[]` (from the
entity's `stats` keys and conditions at contact time) and `relationship`
(the disposition at last contact, already tracked). Significant events — a
disposition flip to `hostile`, a goal advancement, a relationship change —
call the existing `recordCampaignMemory(novel, "npcs", text, badge_scope)` so
REQ-311f's coupling is satisfied without a new memory store.

## 4. Blast radius

| Path | Size | Change | Gate that notices |
|---|---|---|---|
| `holonovel/src/core/state.ts` | M | `NpcState` gains `appearance_count`, `first_seen`, `last_seen`, `appearance_scenes`; `NovelEntity` gains `roster_source_id`; `NovelState` gains `scene_tick`; memory contacts gain `apparent_capabilities`; serialize/deserialize defaults for all | `typecheck`, `test:persistence`, `test:persistence-guardrails` |
| `holonovel/src/core/scene-ledger.ts` | M | New pure module: `presentEntityIds`, `loreContradictionWarning`, `sessionsSince` | `typecheck`, `check-script-quality` (new source file must be reachable) |
| `holonovel/src/index.ts` | L | `import` duplicate guard; `remove`/`roster_remove` helpers + audit; `roster_list` fields; `roster://<type>` resource; `party://current` HP; `scene://history` cap; `manage_scene (action: set)` tick reset + contradiction warning + fast-forward bridging; `manage_staging (action: presence)` `location` + audit; briefing party listing + NPC markers + recap heatmap; NPC description reader/writer; memory ingestion points; both tool descriptions that mention `presence` | `typecheck`, `surface-budget`, `check-tool-definitions-sync`, `action-conflicts`, `check-tool-surface`, `surface-replay` |
| `holonovel/scripts/test-output-contracts.ts` | M | Roster/scene/presence/personality assertions | harness run |
| `holonovel/scripts/test-backfill.ts` | M | Scene-history cap, fast-forward bridging, recap heatmap | harness run |
| `holonovel/scripts/test-narrative.ts` | M | NPC depth markers, `[distant]`, description unification | harness run |
| `holonovel/scripts/test-briefing.ts` | M | Party listing, `[not present]`, NPC markers, GM-only tick | harness run |
| `holonovel/scripts/test-persistence.ts` | S | Round-trip of the new fields; the pre-`scene_tick` save is built inline in the harness as a literal object, not a new fixture file, so no untracked fixture path or parser-format question is introduced | harness run |
| `holonovel/tool-definitions.json` | S | Regenerated (`presence.location`), deterministic — no timestamp or version field | `check-tool-definitions-sync`, `tool-definitions-lint` |
| `holonovel/DECISIONS.md` | S | Action/token counts refreshed only if `surface-budget --write` reports the footprint moved; no new gate, tool, or action class, so no table row is added | `check-traceability`, `surface-budget` |
| `spec/audit/review-register.md` | S | F-P3B2-1…8 → `Resolved` with current predicates; `:2054` names both roadmap sections | `check-registers` |
| `spec/audit/req-coverage.md` | S | Regenerated | `validate` freshness check |
| `ROADMAP.md` | S | Section retitled and narrowed; F-P3B2-9…14 section added | `check-roadmap` |
| `holonovel/package.json` | S | No change (no new dependency, no new script) — listed so the plan states it rather than leaving it implicit | `check-package-manifest` |
| `spec/04-runtime.md` | S | One §7.6 configuration row for `TTRPG_SCENE_HISTORY_MAX`, classified Presentation; no §7.7 group or coupling row | `lint`, `validate`, `check-fingerprint-sync` (unaffected: §7.6 is outside the fingerprint set) |
| `spec/audit/tool-surface-baseline.json` | S | Rewritten by `surface-budget --write` when the `presence.location` text moves the footprint | `surface-budget` |
| `CHANGELOG.md` | S | Dated `2026-11-12` heading with one bullet per surface group; `session:close` derives its commit subject from it | `session:close` |
| `docs/plans/2026-11-12-5-6-entity-scene-npc-depth/{plan,tasks,aar}.md` | S | This plan, its task list, and the AAR (plus the cold-review artifact already written) | `check-loop-artifacts` |

Not touched: `spec/02-requirements.md` (no REQ body changes), `spec/04-runtime.md`
§7.7 (every new field rides an existing group — §7.6 gains one row only),
`scripts/` (no new gate; `check-script-quality` applies to the new
`core/scene-ledger.ts` only as a reachable module), `holonovel/AGENTS.md` (no
tool-surface count changes, since no tool or action is added — verified by
`check-tool-surface`, which reads `tools/list`).

## 5. Phases

### Phase 0 — baseline and predecessor commit

1. Commit the finished §5.6 adventure-content increment as its own commit
   (`npm run session:close`), so this increment's baseline is a clean tree.
2. Re-run `npm run check:fast`; record the pass count.
3. Run the six harness suites named in §2 against the clean tree and record
   each suite's pass/fail count. The previous increment discovered a
   pre-existing red assertion only after writing new ones; this baseline step
   makes a pre-existing failure legible instead of confusable with a
   regression.
4. Re-anchor every predicate in §1 to the post-commit tree and correct any that
   moved. The register's F-P3B2 line numbers predate two increments.

**Done when:** clean tree, green `check:fast`, six harness baselines recorded,
§1 anchors verified.

### Phase 1 — red probes

Write each assertion before its implementation and capture the failure text:
roster duplicate import, `party://current` HP presence, removal audit and
presence cleanup, `roster_list` field set, `roster://<type>`, scene-history
truncation, `scene_tick` presence and reset, contradiction warning, `[recurring]`
and `[distant]` markers, recap heatmap, unified description read across three
surfaces, memory ingestion from a social check, and `npc_memory_count` deltas.
Transcripts go to `aar.md`.

**Done when:** every listed assertion has been observed red once, in a
`holonovel/scripts` harness file named in §4 (the five assertion homes). The
sixth suite, `test:pattern-buffer`, is a pass-only regression gate with no
assertions of its own; its baseline is recorded in Phase 0 and it must stay
green, but Phase 1 does not add to it.

### Phase 2 — entity lifecycle and roster (D2, D2b, D2c, D3; F-P3B2-1, -2)

- `roster_source_id` on import + duplicate `[STATE_CONFLICT]` with REQ-074c's hint.
- `removeEntity` helper; `remove` and `roster_remove` audit and clean presence,
  including the last-entity `null` clear and the no-active-Novel
  `roster_remove` case.
- `roster_remove` `[NOT_FOUND]` enumerates valid IDs.
- `roster_list` returns `{id, name, race, class, level}` derived from `stats`
  per D2b (each field omitted when the ruleset defines none), plus REQ-178a's
  empty-state marker.
- `roster://class` and `roster://race` as static resources ahead of the
  `roster://{id}` template, with the reserved-token shadowing declared in their
  descriptions; `roster://{id}` unchanged.

### Phase 3 — party and presence surfaces (D1; F-P3B2-1, -5)

- Sibling-contract probe first: grep the REQ corpus for every REQ that binds
  `manage_staging`, the `presence` action, or `characters_present` and record
  what each demands of the parameter and output. REQ-076 (scene `characters_present`),
  REQ-078 (scene state), REQ-307a–c, and REQ-176a are the expected set; a REQ
  outside it that binds the same action changes this phase's scope and is
  resolved before the first edit. `action-conflicts` is in the fast gate and
  re-checks the surface afterwards.
- `party://current` gains derived `hp`/`max_hp` (omitted when the ruleset is
  silent) and keeps `present`/`last_location` from the D1 writer.
- Briefing gains the party listing for GM and Player, with `[not present]` and
  `last_location` per REQ-307b.
- `manage_staging (action: presence)` gains `location`, audits, and routes
  through `setPresence`; `[]` marks all absent while clearing the last entity
  clears the field to `null` (both asserted).
- `manage_character (action: set_active)` to a non-present entity stays a
  success and the knowledge-state marker renders "Entity not present".

### Phase 4 — scene ledger and tick (D4, D5; F-P3B2-3)

- `scene://history` cap, suppressed count, `[truncated]`, badge filter first.
- `scene_tick` field, reset on transition, increment on round wrap, GM-only
  Scene rendering.
- `manage_scene (action: set)` stores the tick reset in the same branch as
  `isTransition`.

### Phase 5 — lore contradiction warning (D6; F-P3B2-3)

- New `core/scene-ledger.ts` comparison function with the fixed antonym table.
- `manage_scene (action: set)` emits the `[WARNING]` paragraph naming the
  conflicting lore entry; REQ-076b7's two acceptance calls are the assertion.

### Phase 6 — fast-forward bridging (D7; F-P3B2-4)

- `round` countdown proportional advance.
- Lore triggers collected into the audit entry.
- Bridging summary in the `[fast-forward]` entry and the tool response.
- `skip_countdowns` behaviour asserted both ways; undo restores.

### Phase 7 — NPC depth metadata and recap heatmap (D8, D9; F-P3B2-6)

- Fields, serialize/deserialize defaults, and a pre-`scene_tick`/pre-metadata
  save built as a literal object inline in `test-persistence.ts` (no new fixture
  file), asserting the defaults are 0/absent rather than undefined.
- Marker thresholds and `[distant]` derivation with the no-session-data guard.
- Appearance increments from both D8 sites: the briefing loop (mutate-gated) and
  `manage_scene (action: set)` for location-matched NPCs, plus the dedup rule —
  a scene-set followed by a briefing render of the same scene increments once.
- Briefing mutation gated on `opts.mutate`; `get_context` stays side-effect-free
  (asserted by a double render producing an unchanged `appearance_count`).
- Recap heatmap block, GM-only.

### Phase 8 — description unification and memory ingestion (D10, D11;
F-P3B2-7, -8)

- `npcDescription`/`setNpcDescription`, wired to the three read surfaces and the
  two write paths; most-recent-wins asserted in REQ-156's order.
- Memory ingestion from the social and disposition-update paths; contacts gain
  apparent capabilities and relationship status.
- Campaign-memory coupling on disposition flip, goal advancement, and
  relationship change; `npc_memory_count` asserted before and after.

### Phase 9 — registers, roadmap split, generated surfaces

- Review register: F-P3B2-1…8 `Resolved` with current predicates; the stale
  premises (roster `//id` exists; `party://current` already carries presence)
  recorded in the resolved text.
- `ROADMAP.md`: retitle the section to *§5.6 entity, scene, and NPC-depth
  remediation (P1)*, narrow its surviving `**Trigger:**` so it closes on
  F-P3B2-1…8 only (`ROADMAP.md:43-44` currently closes on all fourteen — the
  split is meaningless without this edit, and `check-roadmap` validates structure
  not trigger text, so nothing else will catch it), move the third bullet into a
  new *§5.6 personality, signal, and citation remediation (P1)* section whose
  trigger closes on F-P3B2-9…14, and correct the register's `:2054`
  cross-reference in the same edit. Run `check-roadmap` and `check-registers`
  immediately after this edit, before any other register work, so a
  cross-reference failure surfaces while the edit is the only one in flight.
- `npm run validate -- --write-register`; regenerate `tool-definitions.json`
  (`check-tool-definitions-sync` reports the drift first); run
  `npm run surface-budget --write` and refresh the DECISIONS action/token counts
  only if the baseline moved.

### Phase 10 — gates

`npm run assemble`, then `npm run check:fast`, the six server harness suites in
§2, root and server `typecheck`, `npm run surface-budget`, and finally
`npm run build-order` for the full `check` pass with the review summary read,
not swallowed.

## 6. Verification

| Gate | Command | Expected |
|---|---|---|
| Baseline | `npm run status`, `npm run check:fast` | 41/41, `check:fast: PASS` |
| Harness baseline | the six suites in §2, before any edit | each suite's pass count recorded in `aar.md`; a pre-existing failure is named, not inherited silently |
| Output contracts | `npm --prefix holonovel run test:output-contracts` | all pass, new assertions included |
| Backfill | `npm --prefix holonovel run test:backfill` | all pass |
| Narrative | `npm --prefix holonovel run test:narrative` | all pass |
| Briefing | `npm --prefix holonovel run test:briefing` | all pass |
| Persistence | `npm --prefix holonovel run test:persistence` | new-field round-trip passes |
| Pattern buffer | `npm --prefix holonovel run test:pattern-buffer` | blocking failures 0 |
| Types | `npm run typecheck`, `npm --prefix holonovel run typecheck` | clean |
| Surface | `npm run surface-budget --write` then `npm run surface-budget` | within budget after the `presence` parameter; the DECISIONS counts refreshed only if the baseline moved |
| Coverage | `npm run validate -- --write-register` | 0 errors, no bucket-A growth |
| Fast gate | `npm run check:fast` | all pass, trailing PASS line read from the un-piped command |
| Full gate | `npm run build-order` | `check` green, review summary printed |

Negative-path checks that must appear in the assertions, not just the happy
path: duplicate import refusal names the existing entity; `roster_remove` on a
missing ID lists valid IDs; a Player calling `manage_scene (action: set)` is
refused; `get_context` twice does not increment `appearance_count`; an old-save
fixture without `scene_tick` loads at 0 rather than undefined.

## 7. Risks and mitigations

1. **Briefing mutation leaks into read-only renders.** `appearance_count` is
   written from the briefing render path, and `get_context` renders with
   `mutate: false`. Mitigation: the briefing-site increment sits behind
   `opts.mutate` (the scene-set site is a mutation path and needs no such flag),
   with the double-render assertion from Phase 7 as the red probe.
2. **The presence resolver changes scene semantics.** A single
   `presentEntityIds` (absent list ⇒ all present) can silently flip an existing
   Novel's party when `characters_present_ids` is `[]` versus absent. Mitigation:
   the helper distinguishes `null`/`undefined` from an empty array, and the
   distinction is asserted in both directions (REQ-307c's "marks all entities as
   not present").
3. **`[distant]` guesses when session data is absent.** Mitigation: no session
   entries ⇒ no `[distant]` marker, mirroring REQ-173b's "unknown" rule; asserted
   with a fresh Novel.
4. **Scene-history truncation changes an existing consumer's array shape.** The
   resource currently returns a bare array; adding `suppressed` changes the
   document. Mitigation: emit the marker inside the array as a first element
   with `{ suppressed: N, truncated: true }`, so array-consuming callers keep
   working and the marker is still present; asserted by both the capped and the
   uncapped case.
5. **HP derivation invents a field the ruleset does not define.** Mitigation:
   read only `stats.hp`/`stats.current_hp`/`stats.hit_points` and omit the field
   entirely when none is present; the ruleset-free harness asserts the omission.
6. **Scope creep into F-P3B2-9…14.** The personality rendering the register
   assigns to F-P3B2-9 sits in the same function as the NPC markers this plan
   adds. Mitigation: this plan adds markers and presence only; the personality
   group, voice directive role/tag filtering, and resource reshaping stay in the
   new section. A finding that genuinely cannot be split is recorded in the AAR
   as a cross-section dependency, not silently absorbed.

## 8. Deliberately deferred

- **F-P3B2-9…14** — new ROADMAP section, same priority. Note for that session:
  `disposition` and `personality.description` are read from two fields today, so
  it lands after D10 rather than in parallel.
- **Publication** — `./scripts/push-pipeline.sh` is a user-authorized step, not
  part of this session.
- **The P2 sweeps** (unscoped-surface review, test-ID label hygiene, anchor
  repoint automation) — untouched.
- **The register's stale F-P3B2 premises beyond the two corrected here** — the
  remaining line-number drift is fixed wholesale by the planned anchor-repoint
  automation, not by hand in this increment.

## 9. Commit plan

One commit (`§5.6 entity, scene, and NPC-depth remediation`), per AGENTS.md's
"a spec increment is one commit" rule. Phase 0's predecessor increment is a
separate, earlier commit. The CHANGELOG heading is dated `2026-11-12` — the
version pinned in `package.json` and the value `session:close` derives its
subject from — with one bullet per coherent surface group (entity/roster,
presence, scene ledger, fast-forward, NPC depth, NPC memory, roadmap split).

## 10. User impact and sizing

- **Players** gain a party listing in the briefing with an honest `[not present]`
  marker and HP, so multi-entity play stops requiring `party://current`.
- **The GM** gains a scene tick, a contradiction warning that names the lore
  entry it disagrees with, a fast-forward that says what actually happened, and
  NPC markers that distinguish a recurring face from a campaign fixture.
- **Cost:** roughly 250-400 changed source lines plus assertions across five
  harness files; one generated artifact (`tool-definitions.json`) plus the
  surface baseline; one §7.6 configuration row; two register files; one roadmap
  split.
- **No migration:** every field defaults on load; the roster duplicate guard is
  per-Novel and fires only on a second import.

## 11. Review record

- Self-review: run; the gaps it found (blast-radius entries for
  `spec/04-runtime.md`, the surface baseline, `CHANGELOG.md`, and the increment
  artifacts; the missing sibling-contract probe; the harness baseline step) are
  incorporated.
- Cold pass (`independent-review`, standard depth): **FAILED** on revision
  `83d7c8ca…` with three Blockers — NPC appearance detected through the
  entity-only `characters_present_ids` (fixed in D8), the missing last-entity
  `characters_present` clear (fixed in D3), and `roster://<type>` colliding with
  the `roster://{id}` template (fixed in D2c) — plus six Majors (bucket-C
  wording, the unregistered `TTRPG_SCENE_HISTORY_MAX`, the unnarrowed roadmap
  trigger, blast-radius omissions, REQ-177's misattributed audit clause, and a
  hash mismatch caused by post-dispatch edits). All resolved in this revision;
  the cold artifact is `cold-review.md`.
- Diff re-review (standard-depth cap, 10 reads): `independent-review passed.` —
  all 3 Blockers and 6 Majors adjudicated `Resolved`, no new Blocker or Major;
  two nits introduced by the revision were folded in after the pass (the
  per-NPC-per-scene increment unit in D8, and the SDK-dispatch assumption in
  D2c), which are wording/precision amendments inside text the pass had already
  adjudicated.
- Conditions carried into execution: none.
