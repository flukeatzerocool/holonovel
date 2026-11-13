# Plan — §5.6 clock interaction models and audit-derived combat turn report

Status: draft (self-review pending) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-13-5-6-clock-combat-report/`
Rollback cost: 1 (server source, two spec files, one catalogue table,
registers, ROADMAP, CHANGELOG; reversible in one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the first open P1 roadmap section, *§5.6 clock and combat-report
remediation* (`ROADMAP.md:15-27`), and close both behaviour findings it names:

- **F-P3B1-6** — clock interaction models are unimplemented (REQ-073a1,
  REQ-073a2).
- **F-P3B1-7** — the combat turn report is not audit-derived (REQ-043b,
  REQ-043c).

Its dependent citation finding **F-P3B1-9** is reduced, not closed. F-P3B1-9
names exactly seven citations (`review-register.md:2280-2284`): T25/T33/T110/T161
(REQ-043f), T271 (REQ-073a2), and T54/T139 (REQ-073c3). This increment writes
four of those seven (T271, T54, T139, T110); T25 and T33 are re-pointed because
neither asserts the combat turn report (each belongs to REQ-013/REQ-020's
ruleset-combat coverage); T161 stays open because it asserts weapon
damage, which no surface implements until the *REQ-124 NPC damage resolution
(P1)* roadmap item lands. **T162 is not one of the seven** — it is a further
REQ-043f `_Check:_` citation (`02-requirements.md:1507`) whose only current
harness match is a false token, and it is written here because this increment
changes the marker it asserts. This plan names that dependency instead of faking
the assertion.

Baseline (this session, before any edit):

- `npm run status`: version `2026.11.12`, 66 unpushed commits, 11 open roadmap
  items, last publish `2026-11-09T04:30:29Z`. Publication is out of scope.
- `git status --porcelain`: clean, HEAD `26cf82c`.
- `npm run check:fast` (un-piped): **41 passed, 0 failed**, trailing
  `check:fast: PASS`.

## 2. Findings, predicates, dispositions

Current predicates verified in this tree:

| Finding | Current predicate | Contract | Disposition |
|---|---|---|---|
| F-P3B1-6 (schema) | `manage_countdown` `inputSchema` (`index.ts:8055-8083`) has no `clock_type`, `opposes`, `link_countdown`, `retreat_countdown`; the `set` handler (`:8085-8106`) also drops `clock_type` when writing the record. | REQ-073a1/a2 | **Resolve here** |
| F-P3B1-6 (models) | `Countdown.clock_type` exists (`state.ts:349-372`, field at `:355`) and is set only for faction (`index.ts:7110`) and vow-mission (`:4059`) clocks; no racing, linked, or tug-of-war behaviour exists. `fireCountdown` (`:7156`) removes the clock and applies `world_effect` with no model branch. | REQ-073a1/a2 | **Resolve here** |
| F-P3B1-6 (mission) | No `manage_novel (action: resume)` hook ticks a mission clock (`index.ts:12637-12649`). | REQ-073a1 | **Resolve here** (direction-aware; D6) |
| F-P3B1-7 (report) | `advance` returns one line, `Turn: <name> — Round R, Turn T/N. [AUTO]` (`index.ts:6909-6922`, marker at `:6917`); no audit slice, no actions/rolls/state changes, uppercase marker. | REQ-043b/c | **Resolve here** |
| F-P3B1-7 (auto turn) | `advanceCombat` (`state.ts:2553-2613`) advances every participant identically; the audit entry marks `statless: true` unconditionally (`:2608-2611`). No description-driven narrative action, no per-participant auto predicate. | REQ-043c | **Resolve here** |
| F-P3B1-7 (health) | `buildSpecHealth` (`index.ts:13986`) reports entities, NPCs, lore, countdowns, rooms, things — never `total_combat_rounds`, although REQ-043d requires the round counter in `spec_health`. | REQ-043d | **Resolve here** (needed by T110) |
| F-P3B1-9 (T271, T54, T139) | `grep -rl "\bT<id>\b" holonovel/scripts` returns 0 files for each. Appendix F catalogues them (`appendices-reference.md:1727`, `:1518`, `:1636`). | REQ-073a2, REQ-073c3 | **Write here** |
| F-P3B1-9 (T110) | 0 files. Catalogue row `:1577`. | REQ-043f | **Write here** |
| F-P3B1-9 (T162, not one of the seven) | 1 file — but only as a token in a title that asserts a pending-workflow guard (`test-backfill.ts:431`), not auto-advance. The same title carries a false `T131`. | REQ-043f | **Write here** + retitle the false-token test |
| F-P3B1-9 (T161) | 0 files. Row `:1659` asserts weapon damage against a target's HP. The only damage path in the tree is the ruleset damage claim (`index.ts:11127`), and ruleset-derived tools are declared non-mutating (`index.ts:2408-2411`). | REQ-043f | **Defer** to *REQ-124* |
| F-P3B1-9 (T25, T33) | T25 (`:1451`) asserts ruleset-section deletion drills for REQ-013/REQ-043; T33 (`:1458`) is a Manual ruleset-combat check owned by REQ-013/REQ-020/REQ-057. Neither asserts the combat turn report, yet REQ-043f cites both (`02-requirements.md:1507`). | REQ-043f (citation defect) | **Re-point** (D12) |
| Existing assertion drift | `test-adventure.ts:432` asserts `[AUTO]`; the spec requires lowercase `[auto]` (REQ-043c). | REQ-043c | **Update here** |

Count provenance: every "0 files" above is `grep -rl "\bT<id>\b"
holonovel/scripts`; T162 is `grep -rn "T162" holonovel/scripts` →
`test-backfill.ts:431` only. The authority for F-P3B1-9's membership is the
register's list at `review-register.md:2280-2284` (also mirrored in
`ROADMAP.md:26`); REQ-043f's `_Check:_` list is a superset and is reconciled in
D12. Separately, `spec/audit/req-coverage.md:33` lists REQ-043 as C with seven
citations of its own, T131 and T162 among them; both of those resolve only to
the false-token title above. An unstated count is not evidence.

## 3. Decisions

**D1 — Model fields live on `Countdown`.** Add optional `opposes?: string` and
`linked_parent?: string`; keep the existing `clock_type` union. No new property
group and no change to the clone/checkpoint enumerations: Countdown is already
a §7.7 Temporal group (`spec/04-runtime.md:262`). *Alternative rejected:* a
separate `ClockGraph` state object — new Novel-tier surface with no contract
requiring it.

**D2 — `link_countdown` is a `set` parameter, not a new action.** Wire shape:
`link_countdown: { parent_name: string, child_name: string }`, both required
strings naming existing clocks. An unknown name returns `[ERROR] [NOT_FOUND]`
enumerating the active clock names; a child that already has a `linked_parent`
or a cycle returns `[ERROR] [INVALID_INPUT]`; a parent that equals the child
returns `[ERROR] [INVALID_INPUT]`. REQ-073a1 writes the operation in
call-argument notation, and REQ-073c1 fixes the action set at
`set`/`advance`/`remove`; adding an action would move the tool surface and the
action-count registers for no contract benefit.

**D3 — Linked chain semantics.** A child clock carrying `linked_parent` is
*locked* while its parent is active: `advance` on it returns
`[ERROR] [STATE_CONFLICT]` naming the parent, and it renders indented beneath
the parent. When the parent fires, the server unlocks the child and applies one
advancement tick to it (`countdown_chain` audit entry). *Alternative rejected:*
firing the whole chain at once — a two-link chain would collapse in one call and
T271's "child clock triggers on parent completion" would be untestable as a
distinct step.

**D4 — Racing pair.** `opposes` names the opposing clock; both clocks must exist
and name each other (asymmetric `opposes` is `[INVALID_INPUT]`). When a racing
clock reaches its fire point, the server inspects the opponent: if the opponent
is already at its own fire point, the result is a tie (`countdown_race` audit,
both clocks removed); otherwise the firing clock wins, the opponent is removed,
and the outcome is audited. Simultaneous completion (both full after one
operation) resolves to a tie.

**D5 — Tug of war.** `advance` gains `retreat_countdown: z.number().int().min(0)`,
accepted only when `clock_type` is `tug_of_war` (otherwise
`[ERROR] [INVALID_INPUT]` naming the clock's type). It subtracts that many
ticks, clamped at 0, and never fires — firing stays tied to the clock's
`direction` threshold. A tug clock therefore needs `direction: "increment"` to
fire at `total` and retreats toward 0.

**D6 — Mission clock is direction-aware on resume (a recorded reading).** On
`manage_novel (action: resume)`, every active `clock_type: "mission"` clock with
`direction: "decrement"` loses one tick and fires at 0. Increment-direction
mission clocks (the vow-linked ones created at `index.ts:4059`, REQ-322a/c) are
not touched: auto-progressing them on every resume would corrupt the milestone
coupling. REQ-073a1 (`02-requirements.md:2178`) states the decrement without a
direction qualifier, so this is a **normative deviation**, recorded in a
`holonovel/DECISIONS.md` entry citing REQ-073a1 and REQ-322 (D-MISSION below)
and listed as a deviation in `aar.md`. REQ-073a1's "reaching zero changes
mission parameters" names no parameter surface anywhere in the spec; the
implementation fires and removes the clock like any countdown, and the missing
surface is recorded in the same entry. *Alternative rejected:*
literal decrement-for-all — it breaks REQ-322's milestone contract.

**D7 — The report boundary is an audit-log scan, not persisted state.** The
slice is every entry after the last `init_combat`/`advance_combat` entry in
`novel.audit_log`. Deriving the boundary from the log avoids adding a field to
`CombatState`, which would need a §7.7 non-property-group declaration. *Alternative
rejected:* a `last_advance_ordinal` field on combat state — new persisted state
for a value the log already carries.

**D8 — Participant attribution.** An entry belongs to the turn when its `args`
JSON (or `notation`) contains the participant id or name as a **whole token** —
the match is bounded by non-word characters, so `npc_1` never matches inside
`npc_10`. Dangers match on their name, entities and NPCs on their id (and their
name as a fallback). Entries matching no participant are excluded from the
report; engine bookkeeping entries (`advance_combat`, `init_combat`,
`auto-moment`) are excluded. This is a heuristic and the plan's tests pin the
three required cases (weapon-style mutation, unrelated mutation, no mutation);
when REQ-124 lands, T161 extends the first case. A misattribution remains
possible for a tool whose args embed another participant's id; the whole-token
rule makes omission the failure mode for the pinned cases and the plan records
the residual as a condition.

**D9 — Statless predicate.** A participant is statless when it is a danger, or
when it is an NPC whose `stats` is absent or empty. Entities are never
auto-advanced — they are the players' proxies. The narrative action comes from
`NpcState.description`; a danger carries only a name, so its name is the action
text ("the goblin acts"). The adventure path is the live example: the parser
extracts NPCs with `name`/`description`/`role`/`confidence` only
(`core/adventure.ts:186-196`) and materialization adds no `stats`, so the
"Bone Warden" fixture (`test-adventure.ts:404`, `AC 14. A skeletal guardian.`)
is statless even though its description embeds an AC number — which is why
`test-adventure.ts:432` keeps asserting the marker, now lowercase.

**D10 — Lowercase `[auto]`.** REQ-043c is literal about the marker. Update the
producer (`index.ts:6917`) and the one existing assertion
(`test-adventure.ts:432`); grep for other `[AUTO]` consumers before editing.

**D11 — The report stays a text result, and it names the resolved turn.** REQ-043b/c
describe a summary, not a typed payload; the recap payload is the structured
surface (REQ-072b). Adding a second structured combat payload would need a REQ
change. Format:

```
Turn: <name> — Round R, Turn T/N
Actions: <tool action(s) taken>            (or "No action.")
Rolls: <roll + total + outcome>            (omitted when none)
State changes: <HP/conditions/...>         (omitted when none)
```

with ` [auto]` appended to the first line for a statless participant and its
description sentence as the action line. **Behaviour change:** today
`index.ts:6910-6917` reads `turn_order[current_turn]` *after* `advanceCombat`
has incremented the index (`state.ts:2579`), so the line names the **next**
participant; the new code captures the participant before the call and names
the **resolved** one, which is what REQ-043b requires. The T110/T162 blocks pin
this with a two-participant case (the existing single-participant fixtures
cannot distinguish the readings).

**D12 — Citation repair, not assertion fabrication.** REQ-043f's `_Check:_`
list becomes T110, T161, T162; G2. T25 and T33 stay in Appendix F with their
real owners (REQ-013, REQ-020) but leave the REQ-043f list. REQ-043f's
**acceptance criterion keeps its weapon-damage sentence**: that behaviour is
still normative, and removing it would weaken the contract to match the
implementation. T161 therefore stays a live citation, the F-P3B1-9 row stays
`Scheduled-roadmap`, and the *§5.6* roadmap section stays open with a single
T161 bullet (D12a). T161's row and the existing T131 row are the acceptance
criterion of the REQ-124 roadmap item; that item's text is extended to name
both.

**D12a — The roadmap section narrows, it does not retire.** After this
increment the *§5.6 clock and combat-report remediation* section keeps one
bullet: "T161 evidence — reports a weapon-damage mutation against a target's HP
— lands with *REQ-124 NPC damage resolution*." Its close condition is rewritten
to name T271/T54/T139/T110/T162 as resolved here and T161 as the only remaining
citation.

**D13 — Tests land in `test-backfill.ts`, no new harness.** That harness is
already the bucket-B→C conformance backfill home
(`holonovel/scripts/test-backfill.ts:1-8`) and needs no `package.json`,
`run-test-suite.ts`, or harness-gating change. *Alternative rejected:* a new
`test-clock-combat.ts` — new gate wiring and suite runtime for five assertions.

**D14 — The briefing combat group is added here (REQ-043e).** T110 asserts a
`badge_briefing` combat group with round, turn order, current participant, and
Player redaction. The briefing today carries only a single summary line —
`**Combat active:** Round ${novel.combat.round}` at `index.ts:16909`, inside
`composeBadgeBriefing` (`:16527-17092`) — with no turn order, no current
participant, and no badge redaction; `state.combatReport` is used only by the
recap (`index.ts:11574`). The T110 row is not writable without the group, and
REQ-043e is a §5.6 contract the same roadmap section owns. The group reuses
`state.combatReport` (which already filters NPC/danger positions for the Player
badge) **replacing** the summary line at `:16909` rather than sitting beside it,
so the round is reported once, and the whole group is omitted when no combat is
active (REQ-043f's no-empty-state rule). *Alternative rejected:* narrowing T110
to the implemented subset — it would leave a §5.6 contract unasserted and the
citation partly false.

## 4. Phases

### Phase 0 — baseline and probes (mostly done while drafting)

1. Record the three baseline facts in §1; re-confirm at execution start.
2. `grep -rn "\[AUTO\]" holonovel/src holonovel/scripts spec docs README.md` —
   2 sites today (both under the first two roots); confirm the spec uses only
   lowercase `[auto]` in normative text.
3. `grep -rn "countdown://active" holonovel/scripts` — confirm the four
   payload consumers (`run_ruleset_pattern_buffer.ts:329,400,410,421`) keep
   passing once fields are added; they assert on `ticks` and names, not shape.
4. `grep -rn "T162\|T131" holonovel/scripts` — confirm the only false-token
   title is `test-backfill.ts:431`.
5. Sibling-contract probe: read REQ-073c1/c2/c3, REQ-329a/b, REQ-322a-d,
   REQ-353, REQ-043a-g to confirm no other REQ binds `manage_countdown` or
   `manage_combat (action: advance)` with a conflicting contract.
6. File-surface probe: `manage_countdown` schema/description
   (`index.ts:8055`), the `set`/`advance` handlers (`:8085-8150`),
   `countdown://active` (`:14708`), briefing countdown lines (`:16997`),
   `countdownDisplay` (`:3220`), `fireCountdown` (`:7156`), `advanceCombat`
   (`state.ts:2553`), `composeBadgeBriefing` (`:16527`), the resume handler
   (`index.ts:12637`), `buildSpecHealth` (`:13986`), and the generated
   `holonovel/tool-definitions.json`.
7. Record the harness baselines this increment can move:
   `npm --prefix holonovel run test:adventure` and `test:briefing` (the
   `[auto]` marker and the briefing section), plus `test:backfill`.
8. Write `tasks.md` and the skeleton `aar.md`.
9. Serialization probe (verified this session): countdowns persist via
   `Object.fromEntries` (`state.ts:3074`) and load via `new Map(Object.entries)`
   (`:1730`), so optional fields round-trip with no serializer change.

### Phase 1 — red probes (before implementation)

1. Retitle `test-backfill.ts:431` to drop the false `T131`/`T162` tokens; it
   keeps `T91` and `T043`.
2. Add failing assertions:
   - T271: racing pair (win + tie), linked chain unlock/tick, tug retreat to 0
     (no fire), mission decrement on `manage_novel (action: resume)`.
   - T54: round countdown loses one tick per full combat round; narrative
     countdown fires and leaves an audit entry.
   - T139: shared increment countdown fires at `total`; a decrement countdown
     started at 3 fires at 0 and leaves an audit entry; GM-only countdown hidden
     from the Player briefing; `remove` deletes without firing.
   - T110: two-participant turn order entity > NPC > danger; briefing combat
     group with round and current participant; one full round bumps the round;
     `manage_diagnostics (action: health)` reports `total_combat_rounds`; Player
     briefing redacts NPC/danger positions; the resolved-turn name is the
     participant that just acted, not the next one.
   - T162: statless NPC (the Bone Warden fixture) and a danger advance with
     `[auto]`, description sentence, no mechanical change.
3. Run `npm --prefix holonovel run test:backfill`; record the failing set (the
   red evidence for the AAR). Confirm `test:adventure` is green at baseline so
   the later marker change is attributable.

### Phase 2 — clock models

1. `core/state.ts`: extend `Countdown` with `opposes`, `linked_parent`; no
   serializer change needed (countdowns round-trip as an object map).
2. `index.ts`: add `clock_type`, `opposes`, `link_countdown` to the schema and
   the `set` persist block with `?? existingCd?.…` preservation; validate the
   link targets and the symmetric `opposes` pair; refuse a `clock_type` change
   on a clock that already has dependants.
3. `fireCountdown` (`:7156`) gains model branches: racing resolution (D4),
   child unlock + tick (D3). Tug clocks never reach `fireCountdown` from a
   retreat because `advance` clamps at 0 without calling it.
4. `advance` handler: `retreat_countdown` subtraction for tug clocks; locked
   child refusal for linked clocks.
5. `manage_novel (action: resume)` (`:12637`): tick decrement-direction mission
   clocks (D6).
6. `countdown://active` (`:14708`): keep the top-level map keyed by name, add
   `clock_type`, `opposes`, `linked_parent`, `locked`, and a `linked_children`
   array on parents. Briefing lines (`:16997`) indent children by two spaces.
7. `countdownDisplay` (`:3220`): unchanged for mission; a tug clock shows
   `ticks/total`.

### Phase 3 — combat turn report and briefing group

1. `state.ts`: add `deriveCombatTurnEntries(novel: NovelState, participant: string, from: number): AuditEntry[]`
   (D7/D8) and `combatTurnReport(novel: NovelState, participant: string, from: number): string`
   (D11). Extend the `advance_combat` audit entry with `statless` computed by D9
   rather than hard-coded `true` (`state.ts:2608-2611`).
2. `index.ts` `advance` case (`:6909`): capture the participant and the audit
   boundary before `state.advanceCombat`, then build the report; append
   ` [auto]` for statless (D9/D10) and the description sentence.
3. `buildSpecHealth` (`:13986`): add `total_combat_rounds` (the existing
   metadata field name at `state.ts:869`, already used by the recap at
   `index.ts:11277`; `combat_rounds` is a different per-session count and is not
   reused) so T110 and REQ-043d hold.
4. `composeBadgeBriefing` (`:16527`): replace the `**Combat active:** Round N`
   summary line at `:16909` with the combat group (D14) built from
   `state.combatReport`, omitted entirely when no combat is active, placed with
   the other decision-critical groups. T110 asserts the round appears exactly
   once.

### Phase 4 — spec edits

1. `spec/02-requirements.md:1507`: REQ-043f `_Check:_ T25, T33, T110, T161,
   T162; G2` → `_Check:_ T110, T161, T162; G2`. Recorded counts: 708 characters
   and 3 sentence terminators before the edit; the replacement is shorter, so the
   body stays under the 800-char / 8-sentence limits.
2. `spec/appendices-reference.md:1636`: remove T139's internal contradiction
   ("3 ticks … fires at 3/3") — assert the decrement reading (3 → 2 → 1 → fire)
   and the increment reading (0 → 3/3 fires) as two clocks.
3. `holonovel/DECISIONS.md`: insert `### Clock interaction models and combat
   turn report — 2026-11-13` immediately after `## Non-goals` (before the
   `### Seed conflict and env badge semantics — 2026-11-10` section) carrying the
   mission-direction reading (D6), the linked/racing semantics (D3/D4), and the
   report-attribution rule (D8), each citing its governing REQ. `check-traceability`
   reads the same file, so the entry is landed in this step and re-checked in
   Phase 5.

### Phase 5 — regeneration and gates

Order matters (`AGENTS.md` "After the last spec or description edit"):

1. `npm run assemble`
2. `npm --prefix holonovel run generate-tool-definitions` (schema and
   description changed) — then `npm run check-tool-definitions-sync`
3. `npm run surface-budget -- --write` (footprint moved; no tool count change)
4. `npm run build-order` — §5.6 feeds the contract fingerprint
   (`scripts/lib/contract-fingerprint.ts:38`), so this regenerates
   `contract-fingerprints.ts` and advances CalVer/AGENTS/DECISIONS/lockfile/
   server.json together
5. `npm run validate -- --write-register` (coverage register refresh)
6. `npm run test:package-smoke` is **not** required (no publish in this
   increment); publication stays with the next `push-pipeline.sh` run.

### Phase 6 — registers, roadmap, changelog

1. `spec/audit/review-register.md:2271-2284`: mark F-P3B1-6 and F-P3B1-7
   `Resolved` with the landing predicates; reduce F-P3B1-9 to T161 and record
   the T25/T33 re-point.
2. `ROADMAP.md:15-27`: keep the section title (the register cross-references it)
   and rewrite the close condition: four of F-P3B1-9's seven citations resolve
   here (T271, T54, T139, T110), T162 resolves here as a REQ-043f citation, T25
   and T33 are re-pointed, and T161 is the only remaining citation, closing with
   the *REQ-124 NPC damage resolution (P1)* item, which gains "T131 and T161" as
   its acceptance evidence. The section keeps that single T161 bullet (D12a).
3. `CHANGELOG.md`: one `## 2026-11-13 — §5.6 clock interaction models and
   audit-derived combat turn report` entry with four bullets (clocks, report,
   citations, regeneration).
4. Write `aar.md`, ending `LOOP PAUSED` (if the bar below is met) or `LOOP OPEN`
   naming the REQ-124 dependency.

## 5. Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/state.ts` | `Countdown` fields; `deriveCombatTurnEntries`, `combatTurnReport`, statless predicate in `advanceCombat` | M |
| `holonovel/src/index.ts` | countdown schema/set/advance/fire/resume/resource/briefing; combat advance report; briefing combat group; `total_combat_rounds` in health; version string from `build-order` | L |
| `holonovel/scripts/test-backfill.ts` | retitle false-token test; five assertion blocks | M |
| `holonovel/scripts/test-adventure.ts` | `[AUTO]` → `[auto]` | S |
| `spec/02-requirements.md` | REQ-043f `_Check:_` re-point | S |
| `spec/appendices-reference.md` | T139 row wording | S |
| `holonovel/DECISIONS.md` | one dated section (three readings) + spec hash/version block (build-order) | S |
| `holonovel/tool-definitions.json` | regenerated | S (generated) |
| `package.json`, `holonovel/package.json`, `holonovel/server.json` | CalVer advance from `build-order` | S (generated) |
| `holonovel/AGENTS.md` | version header from `build-order` | S (generated) |
| `holonovel/package-lock.json` | lockfile version from `build-order` | S (generated) |
| `holonovel/src/generated/contract-fingerprints.ts` | regenerated | S (generated) |
| `spec/audit/review-register.md` | three finding dispositions | S |
| `spec/audit/req-coverage.md` | regenerated | S (generated) |
| `ROADMAP.md` | amended close condition, REQ-124 bullet | S |
| `CHANGELOG.md` | new dated entry | S |
| `docs/plans/2026-11-13-5-6-clock-combat-report/*` | plan, tasks, AAR | S |

No new files under `holonovel/scripts`, no new tool, no new property group, no
schema migration (`opposes`/`linked_parent` are optional and old Novels load
unchanged).

## 6. Verification

- **Red first.** Phase 1 assertions fail for the stated reason before Phase 2/3
  edits; the AAR records the failing output.
- `npm --prefix holonovel run test:backfill` → 0 failures; also
  `test:adventure`, `test:briefing`, `test:narrative`, `test:hazard`,
  `test:pattern-buffer-ruleset` (countdown consumers), `test:workflow`,
  `test:limits`.
- `npm run assemble && npm run check:fast` — capture the un-piped exit code and
  the trailing line; grep the log for `check:fast: PASS`.
- `npm run check` (full) before the session closes, because the spec changed and
  proofreading warnings must be inspected.
- `npm run build-order` green; `check-fingerprint-sync` and
  `check-tool-definitions-sync` green; `surface-budget` green.
- Manual spot-check: a Novel created before the change still loads, its
  countdowns render, and `countdown://active` carries the new fields only when
  set.

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Attribution heuristic mislabels an entry (D8) | Whole-token matching on ids and names; the pinned cases plus the REQ-124 follow-up; residual risk is a tool whose args embed another participant's id, recorded as condition C-1 |
| Racing tie is unreachable in one call | Test drives both clocks to full through a linked/trigger path and asserts the tie; if unreachable the test asserts the documented resolution (`tie` only when both are full at resolution) |
| `countdown://active` shape change breaks a consumer | Phase 0 grep lists all four consumers; fields are additive |
| Lowercase `[auto]` breaks a hidden assertion | Phase 0 grep is exhaustive over `holonovel/src` and `holonovel/scripts` |
| Mission resume tick surprises existing Novels | Restricted to decrement-direction mission clocks; vow clocks are increment and untouched |
| §5.6 edit stales the fingerprint | `build-order` runs before commit; `check-fingerprint-sync` is in `check:fast` |
| T161 cannot be written without a damage surface | Explicitly deferred and cross-linked; no assertion claims it |

## 8. Done bar

This increment is done when all of the following hold:

1. `test:backfill` green with real T271, T54, T139, T110, T162 assertions, and
   the false-token title corrected.
2. `npm run assemble && npm run check:fast` prints `check:fast: PASS` with 0
   errors (un-piped exit code captured).
3. `npm run build-order` green; the regenerated fingerprint, tool definitions,
   and coverage register are committed.
4. `spec/audit/review-register.md` marks F-P3B1-6 and F-P3B1-7 `Resolved`;
   F-P3B1-9 is reduced to T161 with the REQ-124 link recorded.
5. `ROADMAP.md` § *§5.6 clock and combat-report remediation* keeps exactly one
   open bullet naming T161 and the *REQ-124* item; the REQ-124 item names T131
   and T161.
6. `holonovel/DECISIONS.md` carries the dated reading section and the
   deviation is listed in `aar.md`.
7. `aar.md` ends with a terminal token.

## 9. Out of scope

- REQ-124 NPC damage resolution and T161/T131 (its own increment).
- T25/T33 assertion writing (neither asserts REQ-043f).
- The P2 harness test-ID hygiene sweep (T408–T412 duplication); only the one
  false-token title this plan touches is corrected.
- Publication (`push-pipeline.sh`), version tagging, and the wiki mirror.
- Any restructuring of `manage_countdown` beyond the four parameters REQ-073a1
  names.

## 10. Open questions

- **Q1.** (Resolved in D12a.) The roadmap section stays open with one T161
  bullet; no assumption about a reduced-but-closed F-P3B1-9 is needed.
- **Q2.** Is the "mission parameters" clause in REQ-073a1 worth a spec
  clarification (removing it) rather than a DECISIONS reading? This plan records
  the reading; a spec edit is deferred to a later §5.6 pass and the AAR names it
  as a deviation.

## 11. Trust boundary

Every premise above is `repo` evidence: file paths and line numbers were read in
this tree at HEAD `26cf82c`. No web, user, or tool-output premise is used.

## 12. Evidence

- Preflight sidecar:
  `/home/fluke/.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/plan.evidence.json`
  · 9 targets (0 missing, 0 untracked) · 16 REQ matches (0 missing) · git
  `26cf82c6a4dbe9db3b861eb86f540a62d4b77be3`.
- Review independence: self, then one cold pass (report at `cold-review.md`,
  accepted with the fixes recorded in §2/D6/D8/D9/D11/D12a/D14). The attribution
  rule (D8) is a runtime heuristic, not a gate; its false-positive budget is
  bounded by the pinned T162/T110 cases, and residual risk is condition C-1.

## 13. Amendments during execution

- **A1 — T56's `[auto]` assertion moved to the no-action contract.**
  `test-backfill.ts` T56 drives an NPC with partial stats (`{Grit: 3}`) and
  asserted `[auto]`; under D9 that NPC is not statless, so the turn now reports
  "took no action". The assertion changed to the turn line plus the no-action
  phrase. T56's subject (NPC partial stats persisting across restart) is
  unchanged.
- **A2 — racing tests create the pair before setting `opposes`.** D2 refuses an
  `opposes` target that does not exist, so the test creates both clocks first and
  then links them in a second `set`. Behaviour unchanged; test ordering only.
- **A3 — the tug-of-war retreat assertion reads the response, not the
  resource.** `countdown://active` hides zero-tick clocks, so a retreat to zero
  is asserted through the advance response (`to 0`, no `expired`) plus a
  follow-up advance.
- **A4 — `check-playability` observed one red run under `build-order`.** The
  failure was `harbor-lights` importing a Novel with only `character_01` and then
  failing `encounter init` on `ghost_party`; the standalone `check-playability`
  run passes all four Novels. Recorded as an unexplained one-off; the AAR keeps
  it open as an observation, not a blocker.

- **A5 — pre-existing `test:all` reds, verified at HEAD.** After this
  increment's suites passed, `npm --prefix holonovel run test:all` reported 7
  failures. Re-running `test:fingerprints`, `test:identity`, and the holosuite
  tiers on the stashed tree at HEAD `26cf82c` reproduced the identical failure
  sets (fingerprints 5, identity 1, conformance 5, novel 8), so they are
  pre-existing and outside this plan's done bar. They are scheduled as the new
  `ROADMAP.md` P1 item *Pre-existing server-suite reds*; the AAR ends
  `LOOP OPEN` on that item.
