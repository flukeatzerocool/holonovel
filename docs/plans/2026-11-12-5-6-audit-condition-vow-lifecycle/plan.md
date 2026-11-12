# Plan — §5.6 audit, condition, and vow lifecycle remediation

Status: draft (self-review pending) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-12-5-6-audit-condition-vow-lifecycle/`
Rollback cost: 1 (server source, one generated artifact, harness assertions,
registers, ROADMAP; reversible in one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the next open P1 roadmap section — *§5.6 core state and lifecycle
remediation* — and the session-achievable half of it: **F-P3B1-4, F-P3B1-5,
F-P3B1-8**, plus the two citation rows of **F-P3B1-9** whose behaviour lands
here (T8 for REQ-040d, T335 for REQ-289e). The remaining findings — the typed
recap payload (F-P3B1-3), the clock interaction models (F-P3B1-6), the
audit-derived combat report (F-P3B1-7), and the citations that depend on those
surfaces — move to a retitled section in the same increment.

The split is deliberate. F-P3B1-3 alone rewrites `manage_context (action:
recap)` from line-oriented text into a typed structure, while REQ-072e/f/g
also demand bounded arrays, a `format` parameter (markdown default, Lonelog
alternative), and `[ERROR]` bounds handling; F-P3B1-6 adds four clock models
to `state.ts` and the `manage_countdown` schema. Either is a full increment on
its own. This increment takes the three findings that share one seam — the
audit log and the lifecycle gates that write to it — and closes them with
assertions. House rule: a bar that cannot be reached in one session is not a
bar; the remainder is scheduled on `ROADMAP.md` in this same increment.

**Roadmap truth repair (Phase 0).** The first `ROADMAP.md` section, *§5.6
entity, scene, and NPC-depth remediation (P1)*, is stale: its trigger closes on
F-P3B2-1–8, all eight are `Resolved` in `spec/audit/review-register.md:14-72`,
and commit `9932019` shipped them — but the section was never retired. Nothing
gates trigger closure (`check-roadmap` validates structure and admission, not
predicate truth), so a reader following the roadmap starts with work already
done. Phase 0 removes it. The next section after that repair is the one this
plan works.

Baseline (this session, before any edit):

- `npm run status`: version `2026.11.12`, 62 unpushed commits, 11 open roadmap
  items, last publish `2026-11-09`. Publication is out of scope (§8).
- `git status --short`: clean.
- `npm run check:fast`: **41 passed, 0 failed**, trailing `check:fast: PASS`
  (un-piped).

Findings, current predicates (verified in this tree), and disposition:

| Finding | Current predicate | Contract | Disposition |
|---|---|---|---|
| F-P3B1-4 | `manage_condition` `apply` and `remove` both call `requireGM()` (`index.ts:8493`, `:8513`), so a Player cannot condition their own active entity; neither branch calls `audit()` — only `state.saveNovel()` (`:8508`, `:8523`). `T258` exercises the GM path only (`test-output-contracts.ts:595`). | REQ-217b (Player self-service, `[FORBIDDEN]` with target ID otherwise), REQ-217c (both actions audited), REQ-040a | **Resolve here** |
| F-P3B1-5a | `set_badge` audits only `{badge}` after assigning it (`index.ts:3934-3938`); the old badge is overwritten before the audit call. | REQ-040c (old, new, timestamp), REQ-040d | **Resolve here** |
| F-P3B1-5b | `StateManager.snapshot` pushes the clone and `shift()`s the oldest over depth with no record (`core/state.ts:2102-2113`). | REQ-041b (`[snapshot-truncated]` naming badge and discarded timestamp) | **Resolve here** |
| F-P3B1-5c | No `manage_vow` branch audits: `set`/`milestone`/`resolve`/`forsake` call `state.saveNovel()` only (`index.ts:8717-8790`). | REQ-040a | **Resolve here** |
| F-P3B1-8 | `resolve` is gated only on `requireGM()` (`:8767-8777`); no rank-track check, no `consequence` story entry, no linked-countdown removal on `resolve`/`forsake`. The milestone branch *deletes* `vow:<name>` when it fills (`:8757-8760`), which makes REQ-322d's "fill enables resolve, resolve removes it" unreachable. The rank table itself is wrong: `DIFFICULTY_TRACKS` is 12/8/4/2/1 (`core/state.ts:732-734`), while REQ-289b requires 10/20/30/40/50, and that map feeds both `rank_track` and the suggested countdown's tick count (`index.ts:8726`, `:8734`, `:8740`). | REQ-289b, REQ-289c, REQ-322a/322b/322d, REQ-289d (resolved/forsaken surfacing) | **Resolve here** |
| F-P3B1-9 (T8) | No harness carries T8; T147 is titled REQ-133. Appendix F catalogues T8 (`spec/appendices-reference.md:1440`). | REQ-040d | **Resolve here** |
| F-P3B1-9 (T335) | No harness carries T335; Appendix F catalogues it (`:1796`). | REQ-289e | **Resolve here** |
| F-P3B1-9 (rest) | T25/T33/T110/T161 (REQ-043f), T53/T212 (REQ-072f), T271 (REQ-073a2), T54/T139 (REQ-073c3) absent from `holonovel/scripts`. | REQ-043f, REQ-072f, REQ-073a2, REQ-073c3 | **Defer** — assertions require the surfaces F-P3B1-3/6/7 build |
| F-P3B1-3, -6, -7 | Recap is a text blob; `clock_type` is internal-only (`core/state.ts:355`); `advance` returns only the turn line (`index.ts:6888-6897`). | REQ-072b/c1/c2/d, REQ-175a/b, REQ-073a1/a2, REQ-043b/c | **Defer** — new P1 section (§8) |

Count provenance: the "absent from `holonovel/scripts`" claim is
`grep -rl "\bT8\b" holonovel/scripts` (0 files), likewise T335, T25, T33, T110,
T161, T53, T212, T271, T54, T139 (0 files each); T147, T162, T214, T215, T261,
T369, T258 each resolve to at least one file. An unstated count is not
evidence, so the probe is written out here.

No `spec/02-requirements.md` body changes: every contract above already exists
and the server is narrower than the spec. This is an implementation and
assertion increment plus register truth-keeping.

## 2. Done bar

**Done bar:** F-P3B1-4, F-P3B1-5, and F-P3B1-8 are `Resolved` in
`spec/audit/review-register.md` with the current predicates and the assertions
that evidence them; F-P3B1-9 stays open on its nine remaining test IDs (T8 and
T335 are lifted; T25/T33/T110/T161, T53/T212, T271, and T54/T139 remain); the
stale *§5.6 entity, scene, and NPC-depth remediation* roadmap section is
removed; the surviving §5.6 section is retitled and narrowed to F-P3B1-3, -6,
-7 and the nine remaining citations, with a trigger that closes only on those;
the register's `2026-11-09 … chunk P3b-1` cross-reference names both the
resolved findings and the new section; every new assertion was observed **red**
before its fix (condition Player path, condition audit, badge old/new audit,
snapshot truncation, vow gating, vow audit, consequence entry, countdown
retention, T8, T335) and the red transcripts are in `aar.md`;
`npm --prefix holonovel run test:output-contracts`,
`test-persistence-guardrails`, `test-narrative`, `test-persistence`,
`test-security`, and `test-tool-definitions` pass; root and server `typecheck`
pass; `npm run check:fast` and `npm run build-order` are green;
`holonovel/tool-definitions.json` is regenerated for the two changed
descriptions (`manage_condition`, `manage_vow`) and `npm run surface-budget
--write` is re-run if the footprint moved; the coverage register is regenerated
and REQ-040/041/217/289/322 stay bucket C at family level, while the deferred
test IDs are recorded in `aar.md` as open, never as resolved;
`aar.md` ends `LOOP PAUSED` with zero new action items.

Sizing note: three findings and two citation rows, six phases after
baseline and red probes. If the cap binds, completed findings commit, the
roadmap section stays open with those findings moved to `Resolved`, and
`aar.md` records the partial pass as `LOOP OPEN`. No finding is marked resolved
without its green assertion.

Current values the edit must respect:

- `snapshotDepth()` is `Math.max(10, TTRPG_MAX_SNAPSHOT_DEPTH)`
  (`core/limits.ts:31,36-38`): the variable can only raise the floor, never
  lower it. The truncation assertion therefore runs on a fresh process with
  `TTRPG_MAX_SNAPSHOT_DEPTH=10` pinned and asserts a **delta** in the count of
  `[snapshot-truncated]` entries, not an absolute count.
- `novelToSnapshotJSON` deletes `audit_log`/`audit_archive`
  (`core/state.ts:3153-3164`), so an audit entry written while snapshotting
  cannot recurse into the clone.
- `applyNovelState` preserves only `APPEND_ONLY_STATE_FIELDS` and
  `BOOKKEEPING_STATE_FIELDS` on undo (`core/state.ts:3360-3402`); `badge` is
  not preserved. It does not need to be. `set_badge` never calls
  `novelSnapshot()` (`index.ts:3929-3943`), so a switch is not a history step;
  and undo/redo select the stack by the current badge
  (`core/state.ts:2104-2116`), so a mutation made under one badge is not
  reachable from another badge's stack at all. REQ-040d's "undo SHALL NOT
  reverse a badge switch" is therefore true for the reachable path (same-badge
  undo after one or more switches) and is asserted, not re-implemented (D3).
  The unreachable cross-badge path is a separate contract question (REQ-041a's
  "regardless of which badge initiated it") recorded in §8, not fixed here.
- `manage_condition` is un-gated in `toolsVisibleToBadge`
  (`index.ts:321-333`), so a Player reaches the handler and is refused by
  `requireGM()` — the authorization change is handler-local, not a surface
  change.
- `VowState` (`core/state.ts:562-574`) and the §7.7 Vow row
  (`spec/04-runtime.md:271`) name the group's read/write/create/delete
  contract, not its field list, so the lifecycle fix adds no spec edit and no
  fingerprint regeneration. The decision is to add **no** new vow field: the
  linked countdown stays with `ticks = 0` until resolve/forsake deletes it,
  which is what REQ-322d already says (D4).
- Story entry shape for a consequence is the existing literal at
  `index.ts:9351-9357` (`index`, `type`, `entry`, `scene_anchor`,
  `entity_ids`, `timestamp`, optional `room_id`); `discovered` is only for
  absence-fired consequences (REQ-340), so a vow consequence leaves it unset.
- `TTRPG_MAX_SNAPSHOT_DEPTH` is already declared in §7.6
  (`spec/04-runtime.md:148`); no configuration row is added.

## 3. Design decisions

**D1 — one authorization predicate for conditions (F-P3B1-4, REQ-217b).**
`canMutateCondition(entityId, novel)` replaces the two `requireGM()` calls:

- `game_master` or `none` — allow any entity or NPC.
- `player` — allow only when `entityId === novel.active_entity_id`; otherwise
  `err("FORBIDDEN", ...)` naming the target entity ID (REQ-217b's exact
  requirement).
- `observer` — refuse (read-only spectator).

The predicate is one helper called by both branches so `apply` and `remove`
cannot drift. Rejected alternative: leaving `requireGM()` and letting the
Player use `manage_character (action: update)`. REQ-217b grants the condition
tools themselves; routing around them would leave the contract unmet and the
audit trail silent.

**D2 — audit the mutation, and only the mutation (F-P3B1-4, -5c; REQ-040a).**
Each successful condition/ vow mutation calls `audit()` with the tool name,
arguments, and prefix:

| Site | Tool name | Args | Prefix |
|---|---|---|---|
| condition apply | `apply_condition` | `{entity_id, condition, rounds}` (rounds omitted when absent) | `[OK]` |
| condition remove | `remove_condition` | `{entity_id, condition}` | `[OK]` |
| vow set/update | `set_vow` | `{name, description?, difficulty?, scope?, updated}` | `[OK]` |
| vow milestone | `advance_vow` | `{vow_name, milestones, rank_track}` | `[OK]` |
| vow resolve | `resolve_vow` | `{vow_name, outcome, consequences}` | `[OK]` |
| vow forsake | `forsake_vow` | `{vow_name, reason}` | `[OK]` |
| vow countdown removal | `vow_countdown_removed` | `{vow_name, countdown}` | `[OK]` |

A duplicate-condition `[WARNING]` and an absent-condition `[WARNING]` change
no state, so they write no entry — the audit log records mutations, not
refusals (REQ-133 owns the refusal audit). Every new audit call is placed
after the mutation and **before** `saveNovel()` so the entry is persisted with
the change; the current handlers do not all follow that order (see D3 for
`set_badge`), so the position is a requirement of this plan, not a pattern
copied from a nearby line.

**D3 — badge switch records both badges and persists the entry
(F-P3B1-5a, F-P3B1-9/T8; REQ-040a/040c/040d).** `set_badge` captures
`const previous = novel.badge` before assignment, assigns, calls
`audit("set_badge", {from: previous, to: badge})`, and only then calls
`saveNovel()`. The current order is save-then-audit (`index.ts:3935-3938`), so
today the entry lives only in memory until a later save; the plan moves the
audit above the save. The entry's own `timestamp` is the REQ-040c timestamp —
one clock read, not a second copy in args. No change to `applyNovelState`.

**T8's exact sequence** (all mutations under one badge, so the badge-keyed
stack is not left):

1. `set_badge game_master` → one entry `{from: "none"|"player", to:
   "game_master"}`.
2. `manage_scene (action: set, description: "D1")` → one snapshot in the
   `game_master` stack.
3. `set_badge player`, `set_badge game_master` → two more entries, no pushes.
4. `manage_history (action: undo)` → `[OK]`; the scene description returns to
   its prior value and the badge is still `game_master` — proving the two
   switches consumed no history step and the undo targeted the mutation. (Undo
   stack depth is not an observable surface; the assertion stays on these
   observable effects rather than inferring a count.)
5. `audit://novel` lists all three `set_badge` entries in append order, each
   with `from`/`to`.

The test comment records the boundary: a mutation made under a different badge
is not reachable from the current badge's stack (`state.ts:2104-2116`), which
is why the sequence never switches before the mutation it undoes. REQ-041a's
"regardless of which badge initiated it" is a cross-badge question outside
this finding and is listed in §8.

**D4 — snapshot truncation is audited from the state manager
(F-P3B1-5b; REQ-041b).** Extract the entry-construction block of
`StateManager.audit` (`core/state.ts:2206-2219`: prev hash, timestamp, badge,
args, prefix, notation, push) into a private `appendAuditEntry(novel, badge,
tool, args, prefix)`, and call it from `snapshot()` after the `shift()`:

```
this.appendAuditEntry(novel, badge, "[snapshot-truncated]",
  { badge, discarded_timestamp: discarded.last_mutation_at ?? null },
  "[snapshot-truncated]");
```

`last_mutation_at` is REQ-401's per-mutation ISO timestamp already carried by
every snapshot clone; when it is null the field is null rather than invented.
The extraction moves only the entry construction and push (timestamp, badge,
args, prev-hash chain, `security_event`, `notation`); `audit()`'s capacity
refusal and session-counter update stay in `audit()`, so a truncation neither
fabricates a `[session-boundary]` marker nor increments a session's
`entry_count`. When the log is already at `TTRPG_AUDIT_MAX_ENTRIES`,
`snapshot()` skips the entry rather than exceeding the cap: at that ceiling
REQ-447 refuses further mutations, so there is no compliant append to make.
The edge is asserted as "no entry written and the cap not breached".
Rejected alternative: a queued "next audit drains it" field — it loses the
entry when no later mutation occurs, which is exactly the silent-loss case the
REQ names.

**D5 — vow resolve is gated on completeness, and the countdown survives the
fill (F-P3B1-8; REQ-289c/322b/322d).** Eligibility is
`vow.milestones >= vow.rank_track` **or** a `vow:<name>` countdown present with
`ticks >= total`. The gate runs **before** `novelSnapshot()` in `resolve`, so a
refused resolve pushes no snapshot and consumes no history step (the invariant
`test-persistence-guardrails.ts:170-173` already tests for refused capability
calls).

The suggestion-accept branch changes with it: it currently creates the linked
clock **full** (`ticks = total = tick_count`, `index.ts:4037-4040`), so an
accepted suggestion would satisfy the eligibility branch immediately and leave
resolve ungated. The countdown is created empty and fills with the vow:
`ticks: 0, total: suggestion.tick_count, direction: "increment",
clock_type: "mission"`. Milestones advance it one tick (REQ-322c); at
`ticks >= total` it is filled and resolve becomes eligible (REQ-322d). Because
the clock is retained at fill (the current code deletes it at `:8757-8760`),
the two reader-visible countdown lines render a mission clock as
`<ticks>/<total>` and a filled clock as `filled`/`full`, never "0 remaining"
(`index.ts:16652-16653`, `:11263`); a `decrement` clock keeps "N remaining"
until it is full. `resolve` and `forsake` delete `vow:<name>` (auditing
`vow_countdown_removed` when it existed). An ineligible `resolve` returns
`[STATE_CONFLICT]` naming `milestones/rank_track` and, when linked, the
countdown's `ticks/total`.

Resolve's consequence entry also respects the story-journal cardinality: when
`TTRPG_MAX_STORY_ENTRIES` is already reached, `resolve` returns the same
`[STATE_CONFLICT]` capacity refusal `manage_story (action: record)` returns
(`capGuard("story", …)`), before `novelSnapshot()`. No new field is added.
Rejected alternative: a `countdown_filled` boolean — the countdown's own state
already carries the fact, and a duplicated boolean can drift.

**D5b — the rank table follows REQ-289b (F-P3B1-8).** `DIFFICULTY_TRACKS`
becomes `troublesome: 10, dangerous: 20, formidable: 30, extreme: 40, epic: 50`
and keeps its single use site (vow `rank_track`, the suggested countdown's
`tick_count`, and the `set` response line). REQ-289b states the table
explicitly, and REQ-322c's own acceptance text expects a 20-tick countdown for
`dangerous`; the current 12/8/4/2/1 map contradicts both.

Existing Novels keep their stored `rank_track`, with one named exception: the
update path re-keys when `difficulty` is supplied (`index.ts:8724-8726`). The
plan preserves the stored `rank_track` when the supplied `difficulty` equals
the vow's current difficulty, and re-keys only on an actual difficulty change
(a deliberate user action, not a migration). Both branches are asserted: a
saved 8-track vow re-set as `dangerous` stays at 8, and a re-set that changes
`dangerous` → `epic` becomes 50. The `manage_vow` description's parenthetical
("troublesome 12, dangerous 8, …") is corrected with the table. Rejected
alternative: keeping the map and deriving the milestone total from a second
constant — the same difficulty would then mean two different totals on two
surfaces.

**D6 — resolve writes the consequence entry and the recap carries the vow
states (F-P3B1-8, T335; REQ-289c/289d).** On `resolve` with `consequences`,
push one story entry of the existing shape with `type: "consequence"`,
`entry = consequences`, `entity_ids` = the vow's parties that resolve to Novel
entities, and `scene_anchor = "vow:<name>"` — a unique journal anchor, never
the live scene. The synthetic anchor surfaces in recap `story_entries` and
`manage_story (action: list|export)` as the entry's scene anchor; that is
expected (REQ-246a only annotates a room name when `room_id` is present, and
this entry sets none) and is asserted once so the value is pinned. The anchor matters: the briefing clears an open decision
whenever any `consequence` shares its `scene_anchor` (`index.ts:16643`), so a
scene-anchored vow consequence would silently resolve unrelated decisions in
that scene. Using the vow anchor cannot alias a scene, and T335 asserts a
pre-existing decision survives the resolve.

Resolved vows render "the vow to <name> was fulfilled: <outcome>" and forsaken
vows render "[vow-forsaken] the vow to <name> was abandoned: <reason>" in
`narrative_orientation` only. The briefing keeps its existing active-vow
behavior: REQ-289c says a forsaken vow "drops out of active displays", and
REQ-289d places the resolved/forsaken surfacing in the recap, so adding them to
the briefing's `narrative_threads` would contradict both. The active-vow thread
line (`index.ts:16649-16651`) gains the description and bound parties —
`Vow: <name> — <description> (parties: <p1, p2>) (<difficulty>, <n>/<rank>
milestones)` — because Appendix F's T335 row asserts the briefing carries the
description, target, and entity. Both edits add no new badge rule; Player scope
filtering is REQ-289e's existing gap and is not expanded here (recorded as a P3
note if the AAR re-raises it).

**D7 — citations are written where the behaviour lives (F-P3B1-9 subset).**
T8 joins the badge/audit block in `test-output-contracts.ts` (beside
`T9/T147`, `:439`). T335 joins the vow block (beside `T369`, `:829`) with two
vows — one resolved, one forsaken — and asserts set → briefing (description,
parties) → milestone → complete track → resolve → consequence entry →
recap them → `list`; the forsaken vow is a separate vow, never a resolve
followed by a forsake of the same record. T258 is widened for the Player
self/other branches and the two audit entries; T369 is widened to the full
catalogue row (fill keeps the countdown and renders it filled, eligibility,
resolve removes it, declined suggestion still resolves by milestones). T10's
title in `test-persistence-guardrails.ts` gains REQ-041b.

**D7b — the catalogue rows match the executed assertions.** Appendix F's T335
row prescribes `resolve` immediately after `set`, which is the ungated
behaviour REQ-289c replaces; executing the widened test while leaving the row
intact would leave the catalogue describing a rejected contract. The row is
amended in the same increment to insert the rank-track (or filled-countdown)
completion and the `[STATE_CONFLICT]` refusal, with a CHANGELOG bullet naming
the amendment. T369's row already describes fill → eligible → resolve, so it
needs no edit.

**D7c — the truncation assertion is isolated.** It runs on a fresh Novel and a
fresh badge in its own process with `TTRPG_MAX_SNAPSHOT_DEPTH=10` pinned,
counts `[snapshot-truncated]` entries before and after eleven mutations, and
asserts a delta of exactly one; it never runs inside the shared T10 process
whose earlier tests have already pushed snapshots. The Phase 1 probe list
therefore builds depth with eleven `manage_scene (action: set)` calls, not with
duplicate condition applies (those snapshot before returning the warning,
`index.ts:8495, 8504-8505`).

## 4. Blast radius

| Path | Size | Change | Gate that notices |
|---|---|---|---|
| `holonovel/src/index.ts` | L | Condition authorization helper + two audit calls; `set_badge` old/new args and audit-before-save; vow gating (before snapshot), countdown retention/removal and filled rendering, consequence entry, five audit values, resolved/forsaken recap rendering, description/parties in the active-vow line; `manage_condition` and `manage_vow` descriptions | `typecheck`, `check-tool-definitions-sync`, `tool-definitions-lint`, `surface-budget`, `action-conflicts` |
| `holonovel/src/core/state.ts` | M | Extract `appendAuditEntry`; `snapshot()` writes `[snapshot-truncated]` on eviction; `DIFFICULTY_TRACKS` corrected; no new Novel field | `typecheck`, `test:persistence`, `test:persistence-guardrails` |
| `holonovel/scripts/test-output-contracts.ts` | M | New T8; new T335 (two vows); widen T258; widen T369 | harness run |
| `holonovel/scripts/test-persistence-guardrails.ts` | S | New isolated REQ-041b truncation assertion (fresh process, pinned depth, delta) | harness run |
| `holonovel/scripts/test-narrative.ts` | S | The `T-new` vow-undo assertion (`:1006-1013`) completes the track before `resolve`; the `T408`-family block is re-run to confirm no behaviour shift | harness run |
| `holonovel/scripts/test-security.ts` | S | No change expected: `set_badge` stays a security event and the mutating-tool list is unchanged — Phase 0 runs it as a baseline, Phase 6 re-runs | harness run |
| `holonovel/tool-definitions.json` | S | Regenerated for the two descriptions; deterministic (no timestamp) | `check-tool-definitions-sync`, `tool-definitions-lint` |
| `spec/appendices-reference.md` | S | Appendix F T335 row amended for the rank-track gate and the refusal; no ID, count, or range changes | `validate`, `lint` |
| `spec/audit/tool-surface-baseline.json` | S | Rewritten only if `surface-budget --write` reports the footprint moved | `surface-budget` |
| `holonovel/DECISIONS.md` | S | Action/token counts refreshed only if the baseline moved. The six new audit event names are log values, not tools or actions, so they add no table row and no count | `check-traceability`, `surface-budget` |
| `spec/audit/review-register.md` | S | F-P3B1-4/-5/-8 `Resolved` with predicates; F-P3B1-9 narrowed; chunk P3b-1 cross-reference names both sections | `check-registers` |
| `spec/audit/req-coverage.md` | S | Regenerated | `validate` freshness check |
| `ROADMAP.md` | S | Stale entity section removed; surviving §5.6 section retitled/narrowed with trigger | `check-roadmap` |
| `CHANGELOG.md` | S | Dated `2026-11-12` heading; one bullet per surface group plus the roadmap truth repair and the T335 catalogue amendment | `session:close` |
| `docs/plans/2026-11-12-5-6-audit-condition-vow-lifecycle/{plan,tasks,aar,cold-review}.md` | S | This plan, its task list, the AAR, and the cold-review record | `check-loop-artifacts` |

Not touched: `spec/02-requirements.md` (no REQ body change),
`spec/04-runtime.md` (§7.6 already declares the one config used; §7.7 Vow row
unchanged), `holonovel/package.json` (no dependency or script),
`holonovel/AGENTS.md` (no tool or action count changes — verified by
`check-tool-surface`), `scripts/` (no new gate).

## 5. Phases

### Phase 0 — baseline, roadmap truth repair

1. Re-run `npm run check:fast` and record the count (already green at draft
   time); run the six harness suites named in §2 for their baselines.
2. Confirm the finding predicates in §1 against this tree (they were read at
   draft time; re-anchor every `index.ts` line after any Phase 0 edit).
3. Remove the stale *§5.6 entity, scene, and NPC-depth remediation (P1)*
   section from `ROADMAP.md:15-36` and add its CHANGELOG bullet ("the section
   closed with its findings and is retired"). Run `npm run check-roadmap`.
4. Write `tasks.md` for this increment and a skeleton `aar.md`
   (`Status: in progress`, ending `LOOP OPEN`). The skeleton is not a
   formality: `check-loop-artifacts` fails an increment directory without an
   AAR, and this directory exists from Phase 0, so every mid-session
   `check:fast` would otherwise be red for the wrong reason. Phase 6 replaces
   the skeleton with the real AAR.
5. **Sibling-contract probe.** `grep -n "manage_condition"` and
   `grep -n "manage_vow"` across `spec/02-requirements.md`; the expected
   binder set is REQ-206 (auto-expiry), REQ-217a–d, REQ-289a–e, and
   REQ-322a–d. A REQ outside that set that binds either action changes the
   phase scope and is resolved before the first edit. `action-conflicts` in the
   fast gate re-checks the surface afterwards.
6. **File-surface probe.** A changed action contract touches six places, all
   named in §4: the registration and description in `holonovel/src/index.ts`,
   the regenerated `holonovel/tool-definitions.json`
   (`npx tsx holonovel/scripts/generate-tool-definitions.ts`), the surface
   baseline (`npm run surface-budget --write`), the DECISIONS action/token
   counts, the harness assertions, and the gates that read them
   (`check-tool-definitions-sync`, `tool-definitions-lint`, `surface-budget`,
   `surface-replay`, `action-conflicts`). The probe confirms each still applies
   after the edit rather than assuming an implementer will discover it.
7. **Existing-expectation reconciliation.** Two existing assertions encode the
   behaviour this increment changes and are amended in the same phase as the
   change: `test-narrative.ts:1006-1013` resolves a vow with zero milestones
   and expects success (becomes: complete the track first), and
   `test-output-contracts.ts:829-842` (T369) accepts the suggestion without
   asserting tick count. `test-memory-recall.ts:203` only sets a vow and is
   unaffected. Appendix F's T335 row is the third expectation and is amended in
   Phase 5 (D7b). Record each reconciliation in `aar.md`.

**Done when:** clean tree, green `check:fast`, six harness baselines recorded,
stale roadmap section gone, tasks written, sibling-contract set recorded, the
six file surfaces confirmed, and the two existing expectations reconciled in
`aar.md`.

### Phase 1 — red probes

Write each assertion before its implementation and capture the failing output
in `aar.md`:

- Player applies/removes a condition on the active entity (`T258`).
- Player applies a condition to another entity → `[FORBIDDEN]` naming the ID.
- `audit://novel` carries `apply_condition`/`remove_condition` entries.
- `audit://novel` carries a `set_badge` entry with `from`/`to` (`T8`), and the
  post-switch undo sequence from D3 reverses the scene mutation, not a switch.
- A fresh process with `TTRPG_MAX_SNAPSHOT_DEPTH=10`, 11 `manage_scene`
  mutations, and a before/after count shows a `[snapshot-truncated]` delta of
  exactly one.
- `resolve` on an incomplete vow → `[STATE_CONFLICT]` (`T335`), with no
  snapshot pushed.
- A `dangerous` vow carries 20 milestones and a 20-tick suggestion (`T369`).
- A saved 8-track vow re-set with the same difficulty keeps 8; re-set with a
  new difficulty re-keys (`T335`).
- `resolve` on a complete vow removes `vow:<name>`, renders it filled between
  fill and resolve, and writes a `consequence` entry anchored `vow:<name>`
  without clearing an open decision in the same scene (`T335`, widened
  `T369`).
- `forsake` renders `[vow-forsaken]` in the recap and leaves the briefing's
  active-vow list without it (`T335`).
- Four vow mutations each produce an audit entry.

**Done when:** every listed assertion has been observed red once in the named
harness file, with the transcript copied to `aar.md`. If an assertion passes
before its fix (the same-badge undo inertness and the "decision survives"
check are the expected cases), record it as already-satisfied evidence instead
of forcing a red.

### Phase 2 — conditions (D1, D2; F-P3B1-4)

- `canMutateCondition` helper; both branches use it.
- Two `audit()` calls before `saveNovel()`; duplicate/absent warnings stay
  unlogged. The `manage_condition` description must state both halves of the
  new contract: a Player may apply/remove on their own active entity only, and
  the GM may act on any entity or NPC.
- Widen T258.

### Phase 3 — audit gaps (D3, D4; F-P3B1-5a/b)

- `set_badge` captures the old badge and audits `{from, to}` **before**
  `saveNovel()`.
- `appendAuditEntry` extraction; `snapshot()` truncation entry; filled-clock
  rendering in the two countdown lines.
- T8; the isolated truncation assertion.

### Phase 4 — vow lifecycle (D5, D5b, D6, D2; F-P3B1-8, F-P3B1-5c)

- `DIFFICULTY_TRACKS` corrected to REQ-289b's 10/20/30/40/50 with the
  update-path preservation rule; the `set` response and the `manage_vow`
  description follow it.
- Eligibility gate on `resolve`, placed before `novelSnapshot()`; countdown
  clamp-on-fill and removal on resolve/forsake.
- Consequence entry anchored `vow:<name>`; resolved/forsaken recap rendering;
  description and parties in the active-vow thread line.
- Five audit calls before `saveNovel()`; widen T369; new T335; reconcile the
  `test-narrative` vow-undo assertion.

### Phase 5 — registers, roadmap, generated surfaces

- Review register: F-P3B1-4/-5/-8 `Resolved` with the current predicates;
  F-P3B1-9 reduced to the nine deferred citations; the chunk P3b-1
  "Scheduled under" line names the resolved set and the retitled section.
- `ROADMAP.md`: retitle the surviving section to *§5.6 recap, clock, and
  combat-report remediation (P1)*, keep only F-P3B1-3/-6/-7 plus the nine
  citation rows, and set the trigger to close on those.
- `spec/appendices-reference.md`: amend the Appendix F T335 row per D7b
  (completion step and refusal), leaving its ID, position, and count intact.
- `npm run validate -- --write-register`; regenerate `tool-definitions.json`
  (run `check-tool-definitions-sync` first to see the drift);
  `npm run surface-budget --write` and DECISIONS counts only if it moved.
- Run `check-roadmap`, `check-registers`, and `npm run validate` immediately
  after the register and Appendix F edits, before the next phase.

### Phase 6 — gates

`npm run assemble`, `npm run check:fast`, the six harness suites, root and
server `typecheck`, `npm run surface-budget`, then `npm run build-order` and
read the check summary rather than swallowing it.

## 6. Verification

| Gate | Command | Expected |
|---|---|---|
| Baseline | `npm run status`, `npm run check:fast` | 41/41, `check:fast: PASS` |
| Harness baselines | six suites in §2, before any edit | per-suite pass counts in `aar.md` |
| Output contracts | `npm --prefix holonovel run test:output-contracts` | pass; T8/T335 added, T258/T369 widened |
| Guardrails | `npm --prefix holonovel run test:persistence-guardrails` | pass; isolated truncation assertion with pinned depth |
| Narrative | `npm --prefix holonovel run test:narrative` | pass; vow-undo assertion completes the track first |
| Persistence | `npm --prefix holonovel run test:persistence` | pass (no new field) |
| Security | `npm --prefix holonovel run test:security` | pass; `set_badge` still a security event |
| Tool definitions | `npm --prefix holonovel run test:tool-definitions` | pass after regeneration |
| Types | `npm run typecheck`, `npm --prefix holonovel run typecheck` | clean |
| Surface | `npm run surface-budget --write` then `npm run surface-budget` | within budget; DECISIONS counts only if moved |
| Coverage | `npm run validate -- --write-register` | 0 errors, no bucket-A growth |
| Fast gate | `npm run check:fast` | all pass, trailing PASS read un-piped |
| Full gate | `npm run build-order` | `check` green, summary printed |

Negative-path checks that must appear in the assertions, not only the happy
path: Player apply on another entity is `[FORBIDDEN]` with the target ID; an
Observer apply is refused; a duplicate apply writes no audit entry; `resolve`
on an incomplete vow is `[STATE_CONFLICT]` naming the remaining milestones and
pushes no snapshot; `forsake` on a vow with no linked countdown still
succeeds; the truncation delta is one at depth 10 and zero before the first eviction;
once the stack is at or below the depth, no further entry is written; a
vow saved with the old `rank_track` (8) keeps 8 on a same-difficulty
re-set and re-keys only on a difficulty change; a vow consequence anchored
`vow:<name>` leaves an open decision in the scene untouched; a filled vow
clock renders `filled`/`full`, not a positive "remaining" count.

## 7. Risks and mitigations

1. **Keeping a filled countdown changes a consumer.** `vow:<name>` at
   `ticks = total` is no longer deleted, so a caller that treated absence as
   "vow complete" must read eligibility instead, and the two reader-visible
   countdown lines would otherwise say "<total> remaining". Mitigation: the audit
   `vow_countdown_filled` entry and the [OK] line both state the fill, the two
   renderers print `filled`/`full` at `ticks >= total` (pinned by assertion),
   the assertion covers the filled and resolved states, and no harness asserts
   deletion today (probe: `grep -rn "vow_countdown_filled" holonovel/scripts` → 0).
2. **Player condition access widens the mutation surface.** The handler is
   un-gated, so the only control is the new predicate. Mitigation: the
   predicate is one helper used by both branches, and the assertion covers
   own-entity success, other-entity refusal, and Observer refusal.
3. **Auditing inside `snapshot()` writes during a read path.** `snapshot()` is
   called from `novelSnapshot()` before a mutation, never from a render path
   (`core/server.ts:37-40`). Mitigation: the truncation entry is only emitted
   when an eviction happens, so read-only renders never write; the isolated
   assertion renders twice and asserts an unchanged audit-log length.
4. **The audit chain hash changes ordering expectations.** The truncation
   entry is appended through the same prev-hash chain, so `spec_health`'s
   chain verification stays intact — provided `appendAuditEntry` carries the
   `security_event` and `notation` fields. Mitigation: the isolated assertion
   re-reads `spec_health` after truncation.
5. **Register/roadmap drift.** Two register files, Appendix F, and ROADMAP
   describe the same findings. Mitigation: Phase 5 runs `check-roadmap`,
   `check-registers`, and `validate` immediately after the edits, and the AAR
   references the registers instead of restating them.
6. **Scope creep into the deferred surfaces.** `narrative_orientation` is the
   recap's first field, and the recap rewrite (F-P3B1-3) will move it into a
   structure. Mitigation: D6 adds only the two vow lines to the existing text
   renderer; no field, shape, or `format` behaviour changes here, and the
   deferred section's plan owns the restructure.
7. **The corrected rank table changes existing expectations.** Two suites
   encode the old table or the ungated resolve (Phase 0 item 7). Mitigation:
   the reconciliation is a Phase 0 deliverable recorded in `aar.md`, and
   `test-narrative`/`test-output-contracts` run before and after the change so
   a count shift is attributable rather than surprising.
8. **The appended truncation entry is not counted in session `entry_count`.**
   `appendAuditEntry` deliberately omits `audit()`'s session counters, so a
   session's `entry_count` can trail its audit entries. Mitigation: the entry
   is bookkeeping, not a mutation; the isolated assertion records the delta and
   `spec_health` remains consistent because it counts log entries, not session
   counters. If the AAR finds a `spec_health` inconsistency, the counter update
   moves into `appendAuditEntry` with a `countSession` flag.

## 8. Deliberately deferred

- **F-P3B1-3** (typed recap payload), **F-P3B1-6** (clock interaction models),
  **F-P3B1-7** (audit-derived combat report) and the nine dependent
  citations — new P1 section *§5.6 recap, clock, and combat-report
  remediation*.
- **F-P3B1-9's remaining rows** — they assert behaviour the deferred surfaces
  build; writing them now would mean writing red tests and leaving them red.
- **Publication** — `./scripts/push-pipeline.sh` is a user-authorized step.
- **The P2 sweeps** and the Trust-core and §5.3/§5.4 P1 sections — untouched.
- **REQ-289e's Player scope filtering** in the briefing thread list — a
  pre-existing gap not in F-P3B1-8; recorded as a P3 note if re-raised.
- **Cross-badge undo (REQ-041a)** — the cold pass surfaced that undo stacks are
  keyed by badge (`state.ts:2104-2116`), so a mutation made under one badge is
  not reachable from another badge's stack, while REQ-041a says undo works
  "regardless of which badge initiated it". This is outside F-P3B1's findings;
  the AAR records it with a disposition (register row or `Scheduled-roadmap`)
  rather than silently widening this increment.

## 9. Commit plan

One commit (`§5.6 audit, condition, and vow lifecycle remediation`), per
AGENTS.md's "a spec increment is one commit" rule, containing the roadmap
truth repair and the increment. The CHANGELOG heading is dated `2026-11-12`
(the version pinned in `package.json` and the value `session:close` derives
its subject from) with one bullet per surface group: roadmap truth repair,
conditions, audit gaps, vow lifecycle, citations, plus the regenerated
surfaces.

## 10. User impact and sizing

- **Players** can apply and remove conditions on their own active entity,
  which multi-entity play previously required a GM for; other entities still
  refuse and the refusal names the target.
- **The GM** gets an audit trail for conditions and vows, sees both badges on
  a switch, and is told when a snapshot was discarded instead of silently
  losing undo depth.
- **Vow play** becomes rule-complete: a vow cannot be resolved before its
  track completes (or its clock fills), the linked clock survives the fill
  until resolution, and the consequence is a story-journal entry the recap
  already surfaces.
- **Cost:** roughly 150-250 changed source lines plus assertions across two to
  three harness files; one regenerated artifact (`tool-definitions.json`) and
  possibly the surface baseline; two register files; one roadmap repair plus
  one split; no migration (no new persisted field).

## 11. Review record

- Self-review: run; the gaps it found are incorporated — the sibling-contract
  probe, the six-surface file probe, the existing-expectation reconciliation,
  the Appendix F T335 amendment, the truncation assertion's isolation, the
  resolve gate's position, and the count corrections.
- Cold pass (`independent-review`, standard depth, fresh context): **FAILED**
  on revision `231b0521…` with one Blocker (T8's undo assertion was unreachable
  as written because undo stacks are badge-keyed and `set_badge` never
  snapshots) and eight Majors (audit save-then-audit ordering; the update path
  re-keying `rank_track`; a filled clock rendering as "remaining"; the
  `[vow-forsaken]` briefing contradiction; the T335 row divergence; the
  truncation assertion's shared process; the consequence entry clearing
  unrelated decisions; the unstated gate/snapshot order). All are resolved in
  this revision; the artifact is `cold-review.md`.
- Diff re-review (standard-depth cap, 6 of 10 reads): `independent-review
  passed.` on revision `5244caa5…` — one Blocker, eight Majors, and five of six
  Nits adjudicated `Resolved`, no new Blocker or Major, five new Nits. The Nits
  (the filled-clock example, the unobservable stack-depth claim, the synthetic
  anchor's surfacing, the four-versus-five audit-call count, and the
  unreachable "depth 10 or less" phrasing) are folded in after the pass as
  wording/precision amendments inside text the pass had already adjudicated;
  the final bytes are recorded by the plan-gate stamp.
- Review-policy unknowns: the cold pass ran its five stage roles sequentially
  in one fresh context rather than five separate dispatches, and the harness
  injected `AGENTS.md` (root and server) into that context. Both are recorded
  in `cold-review.md`; neither changes the verdict.
- Conditions carried into execution: none.


## 12. Delta amendment — 2026-11-12 (mid-execution)

**What changed.** D5 now (a) states that the suggestion-accept branch creates
the linked mission clock empty (`0/total`, `direction: "increment"`) instead of
full, (b) defines filled as `ticks >= total` for that clock, (c) pins the
mission-clock rendering to `<ticks>/<total>` / `filled`, and (d) makes
`resolve`'s consequence write respect the story-journal capacity refusal.

**Why.** Execution's Phase 1 predicate read found `index.ts:4037-4040` creates
the suggested clock with `ticks: s.tick_count, total: s.tick_count`. Under the
approved eligibility rule (`ticks >= total` enables resolve), accepting a
suggestion would make the vow immediately resolvable without a single
milestone — the gate would be defeated by its own coupled clock, and REQ-322d's
"filling the countdown makes the vow eligible" would be vacuous. The approved
plan assumed the clock filled over time; the evidence contradicts that
assumption, so the delta is required under the execution-discipline rule.

**Scope.** One branch in `index.ts` (suggestion accept), two rendering lines,
and a capacity guard on `resolve`; no new field, tool, action, or spec body.
The added capacity guard prevents exceeding `TTRPG_MAX_STORY_ENTRIES` when
`consequences` is supplied at the journal ceiling (the same refusal
`manage_story (action: record)` already returns).

**Evidence class.** repo (`index.ts:4037-4040`, `:8757-8760`, `:16652-16653`,
`:11263`, `:3202-3209`).

**Review.** Re-reviewed as a diff against revision `56752406…`; the delta's
verdict and the re-stamped hash are recorded in `cold-review.md` and the
plan-gate stamp.
